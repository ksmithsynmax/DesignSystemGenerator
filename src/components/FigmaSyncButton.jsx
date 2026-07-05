import { useCallback, useMemo, useState } from "react";
import { buildExportPayload } from "../utils/buildExportPayload";
import { TOKEN_LOCK_VERSION } from "../utils/buildTokenLock";
import { diffTokenPayloads, formatTokenChangelog, isEmptyDiff } from "../utils/diffTokenPayloads";
import { useFigmaSync } from "../hooks/useFigmaSync";
import { CHART_COMPONENTS } from "../data/componentTokens";

const SAVE_LOCK_ENDPOINT = "http://localhost:9001/api/save-token-lock";
const READ_LOCK_ENDPOINT = "http://localhost:9001/api/token-lock";

// Tries to write tokens.lock.json straight into the repo via the relay server.
// Returns true on success. Throws if the relay is down or running an old build
// (e.g. 404 for this route) so callers can fall back to a download.
async function writeTokenLockToRepo(lock) {
  const res = await fetch(SAVE_LOCK_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lock),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `relay returned ${res.status}`);
  }
  return true;
}

// Reads the saved baseline (the anchor the changelog diffs against). Returns the
// parsed lock, or null if no baseline has been saved yet. Throws if relay is down.
async function readBaseline() {
  const res = await fetch(READ_LOCK_ENDPOINT);
  if (!res.ok) throw new Error(`relay returned ${res.status}`);
  const data = await res.json();
  if (data && data.missing) return null;
  return data;
}

function triggerDownload(filename, text, mime) {
  const blob = new Blob([text], { type: mime || "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function brandNamesOf(brands) {
  const names = {};
  Object.keys(brands || {}).forEach((id) => {
    names[id] = (brands[id] && brands[id].name) || id;
  });
  return names;
}

// Returns a brands object containing only the given ids (preserving config).
function pickBrands(brands, ids) {
  const out = {};
  (ids || []).forEach((id) => {
    if (brands && brands[id]) out[id] = brands[id];
  });
  return out;
}

// Drops non-selected brand entries from a resolved payload so a scoped diff only
// compares the brands you actually exported (otherwise unexported brands in the
// baseline would falsely show up as "removed").
function scopePayloadBrands(payload, ids) {
  if (!payload) return payload;
  const idSet = new Set(ids || []);
  const out = {};
  Object.keys(payload).forEach((key) => {
    const entry = payload[key];
    const isBrand = entry && typeof entry === "object" && entry.components;
    if (isBrand && !idSet.has(key)) return;
    out[key] = entry;
  });
  return out;
}

// Advances the saved baseline for ONLY the exported brands, keeping every other
// brand's previous baseline entry intact. This mirrors what actually changed in
// Figma (a scoped sync only touches the brands it pushed).
function mergeScopedLock(prevLock, scopedBrandsConfig, scopedPayload) {
  const prevPayload = (prevLock && prevLock.payload) || {};
  const prevBrands = (prevLock && prevLock.brands) || {};
  return {
    version: TOKEN_LOCK_VERSION,
    brands: Object.assign({}, prevBrands, scopedBrandsConfig),
    payload: Object.assign({}, prevPayload, scopedPayload),
  };
}

function diffSummaryText(diff) {
  if (isEmptyDiff(diff)) return "no changes";
  const t = diff.totals;
  return `${t.changed} changed, ${t.added} added, ${t.removed} removed`;
}

const BUILDABLE_COMPONENTS = [
  "button",
  "switch",
  "burger",
  "segmentedcontrol",
  "slider",
  "rangeslider",
  "checkbox",
  "radio",
  "chip",
  "notification",
  "alert",
  "modal",
  "tooltip",
  "popover",
  "menu",
  "divider",
  "list",
  "loader",
  "progress",
  "chart",
  "chart-line",
  "chart-time-series",
  "chart-time-series-dual-axis",
  "chart-area",
  "chart-stacked-area",
  "chart-stacked-bar",
  "chart-scatter",
  "chart-candlestick",
  "chart-combo",
  "chart-donut",
  "chart-radar",
  "chart-sparkline",
  "chart-bar-horizontal",
  "chart-pie",
  "chart-funnel",
  "chart-radial",
  "pill",
  "badge",
  "textinput",
  "select",
  "multiselect",
  "card",
  "actionicon",
  "tabs",
  "accordion",
  "anchor",
  "title",
  "text",
  "image",
  "avatar",
  "skeleton",
  "table",
  "calendar",
];

// Split the buildable list into Components vs Charts for the selector UI.
const BUILDABLE_SECTIONS = [
  {
    label: "Components",
    names: BUILDABLE_COMPONENTS.filter((name) => !CHART_COMPONENTS.includes(name)),
  },
  {
    label: "Charts",
    names: BUILDABLE_COMPONENTS.filter((name) => CHART_COMPONENTS.includes(name)),
  },
];

const COMPONENT_LABELS = {
  actionicon: "ActionIcon",
  chart: "Bar Chart",
  "chart-line": "Line Chart",
  "chart-time-series": "Time Series Chart",
  "chart-time-series-dual-axis": "Time Series Dual Axis Chart",
  "chart-area": "Area Chart",
  "chart-stacked-area": "Stacked Area Chart",
  "chart-stacked-bar": "Stacked Bar Chart",
  "chart-combo": "Combo Chart",
  "chart-donut": "Donut Chart",
  "chart-radar": "Radar Chart",
  "chart-scatter": "Scatter Chart",
  "chart-candlestick": "Candlestick Chart",
  "chart-sparkline": "Sparkline",
  "chart-bar-horizontal": "Horizontal Bar Chart",
  "chart-pie": "Pie Chart",
  "chart-funnel": "Funnel Chart",
  "chart-radial": "Radial Bar Chart",
  rangeslider: "RangeSlider",
  textinput: "TextInput",
  multiselect: "MultiSelect",
  segmentedcontrol: "SegmentedControl",
  popover: "Popover",
  menu: "Menu",
  divider: "Divider",
  list: "List",
};

export default function FigmaSyncButton({ brands, syncBuildOptions }) {
  const { status, pluginConnected, sync, error, lastSyncMessage } = useFigmaSync();
  // Default to scoped builds with an empty selection so a sync can never
  // accidentally regenerate every component — the user must opt in to "All
  // components" or explicitly pick which components to build.
  const [buildMode, setBuildMode] = useState("selected");
  const [selectedComponents, setSelectedComponents] = useState([]);
  // "All brands" is temporarily hidden (see commented radio below); force scoped
  // selection for now. Flip back to "all" when re-enabling the All brands option.
  const [brandMode, setBrandMode] = useState("selected");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [preserveExistingVariables, setPreserveExistingVariables] = useState(true);
  const [lockMessage, setLockMessage] = useState(null);
  const [changelog, setChangelog] = useState(null);

  const allBrandIds = useMemo(() => Object.keys(brands || {}), [brands]);

  // The brand ids this export will actually touch. "all" follows the live brand
  // list; "selected" is intersected with it so a removed brand can't linger.
  const exportBrandIds = useMemo(() => {
    if (brandMode === "all") return allBrandIds;
    return selectedBrands.filter((id) => allBrandIds.includes(id));
  }, [brandMode, selectedBrands, allBrandIds]);

  const selectedCount = selectedComponents.length;
  const brandSelectionError =
    brandMode === "selected" && exportBrandIds.length === 0
      ? "Pick at least one brand to export."
      : null;
  const selectionError =
    (buildMode === "selected" && selectedCount === 0
      ? "Pick at least one component for selected build mode."
      : null) || brandSelectionError;

  const componentLabel = useCallback((name) => {
    return COMPONENT_LABELS[name] || name.charAt(0).toUpperCase() + name.slice(1);
  }, []);

  const selectedSummary = useMemo(() => {
    const comps = buildMode === "all" ? "All components" : selectedCount + " selected";
    const brandLabel =
      brandMode === "all"
        ? "all brands"
        : exportBrandIds.length === 1
        ? (brands[exportBrandIds[0]] && brands[exportBrandIds[0]].name) || exportBrandIds[0]
        : exportBrandIds.length + " brands";
    return `${comps} · ${brandLabel}`;
  }, [buildMode, selectedCount, brandMode, exportBrandIds, brands]);

  const handleSync = useCallback(() => {
    if (buildMode === "selected" && selectedComponents.length === 0) return;
    if (exportBrandIds.length === 0) return;
    const scopedIds = exportBrandIds.slice();
    const scopedBrandsConfig = pickBrands(brands, scopedIds);
    var buildOptions = Object.assign({}, syncBuildOptions || {});
    buildOptions.preserveExistingVariables = preserveExistingVariables;
    if (buildMode === "selected") {
      buildOptions.componentsToBuild = selectedComponents.slice();
    }
    if (Object.keys(buildOptions).length === 0) buildOptions = null;
    // Only the selected brands go into the payload. Combined with the plugin's
    // additive mode reconciliation, this leaves every other brand in the Figma
    // file untouched.
    const payload = buildExportPayload(scopedBrandsConfig, buildOptions);
    sync(payload);

    // Capture what this push changed vs. the previous baseline (scoped to the
    // exported brands), then advance the baseline for just those brands. The
    // changelog is the artifact to hand the dev.
    setLockMessage(null);
    const scopedNewPayload = buildExportPayload(scopedBrandsConfig);
    (async () => {
      let prev = null;
      try {
        prev = await readBaseline();
      } catch {
        // Relay unreachable — we just won't have a diff to show this time.
      }
      let diff = null;
      if (prev && prev.payload) {
        diff = diffTokenPayloads(scopePayloadBrands(prev.payload, scopedIds), scopedNewPayload);
        setChangelog({ diff, brandNames: brandNamesOf(brands), date: new Date(), scopeIds: scopedIds });
      } else {
        setChangelog(null);
      }
      try {
        await writeTokenLockToRepo(mergeScopedLock(prev, scopedBrandsConfig, scopedNewPayload));
        const summary = diff ? diffSummaryText(diff) : "baseline initialized";
        setLockMessage({ type: "success", text: `Synced · baseline updated (${summary})` });
      } catch {
        setLockMessage({
          type: "error",
          text: "Synced, but baseline not written (restart `npm run relay`, or use Save token lock).",
        });
      }
    })();
  }, [brands, buildMode, selectedComponents, exportBrandIds, sync, syncBuildOptions, preserveExistingVariables]);

  // Preview what changed vs. the saved baseline WITHOUT advancing the baseline,
  // and download the changelog to send to a dev.
  // Builds (or rebuilds) just the Foundations doc on the Figma "Component
  // Documentation" page. Variables are re-synced (idempotent) so the doc has
  // something to bind to, but component sets are NOT rebuilt.
  const handleBuildFoundationsDoc = useCallback(() => {
    if (exportBrandIds.length === 0) return;
    const buildOptions = Object.assign({}, syncBuildOptions || {});
    buildOptions.preserveExistingVariables = preserveExistingVariables;
    buildOptions.foundationsDocOnly = true;
    const payload = buildExportPayload(pickBrands(brands, exportBrandIds), buildOptions);
    sync(payload);
  }, [brands, exportBrandIds, preserveExistingVariables, sync, syncBuildOptions]);

  const handleExportChanges = useCallback(() => {
    if (exportBrandIds.length === 0) return;
    setLockMessage(null);
    const scopedIds = exportBrandIds.slice();
    const current = buildExportPayload(pickBrands(brands, scopedIds));
    (async () => {
      let prev;
      try {
        prev = await readBaseline();
      } catch {
        setLockMessage({ type: "error", text: "Relay not running. Start it with: npm run relay" });
        return;
      }
      if (!prev || !prev.payload) {
        setLockMessage({
          type: "warn",
          text: "No baseline yet — Sync to Figma once to set the starting point.",
        });
        return;
      }
      const diff = diffTokenPayloads(scopePayloadBrands(prev.payload, scopedIds), current);
      setChangelog({ diff, brandNames: brandNamesOf(brands), date: new Date(), scopeIds: scopedIds });
      if (isEmptyDiff(diff)) {
        setLockMessage({ type: "success", text: "No token changes since the last baseline." });
        return;
      }
      const text = formatTokenChangelog(diff, { brandNames: brandNamesOf(brands), date: new Date() });
      triggerDownload("tokens-changelog.txt", text);
      setLockMessage({ type: "success", text: `Downloaded changelog (${diffSummaryText(diff)})` });
    })();
  }, [brands, exportBrandIds]);

  const handleDownloadReport = useCallback(() => {
    if (!changelog) return;
    const text = formatTokenChangelog(changelog.diff, {
      brandNames: changelog.brandNames,
      date: changelog.date,
    });
    triggerDownload("tokens-changelog.txt", text);
  }, [changelog]);

  const toggleBrand = useCallback((id) => {
    setSelectedBrands((curr) => {
      if (curr.indexOf(id) >= 0) return curr.filter((item) => item !== id);
      return curr.concat(id);
    });
  }, []);

  const selectAllBrands = useCallback(() => {
    setSelectedBrands(allBrandIds.slice());
  }, [allBrandIds]);

  const clearBrands = useCallback(() => {
    setSelectedBrands([]);
  }, []);

  const toggleComponent = useCallback((name) => {
    setSelectedComponents((curr) => {
      if (curr.indexOf(name) >= 0) {
        return curr.filter((item) => item !== name);
      }
      return curr.concat(name);
    });
  }, []);

  const selectAllComponents = useCallback(() => {
    setSelectedComponents(BUILDABLE_COMPONENTS.slice());
  }, []);

  const clearComponents = useCallback(() => {
    setSelectedComponents([]);
  }, []);

  const dotColor = {
    disconnected: "#868E96",
    connecting: "#FAB005",
    connected: pluginConnected ? "#51CF66" : "#FAB005",
    syncing: "#228BE6",
    success: "#51CF66",
    error: "#FA5252",
  }[status] || "#868E96";

  const buttonDisabled =
    status === "disconnected" ||
    status === "connecting" ||
    status === "syncing" ||
    !pluginConnected ||
    Boolean(selectionError);

  const statusLabel =
    status === "syncing" ? "Syncing..." :
    pluginConnected ? "Plugin connected" :
    status === "connected" ? "Waiting for plugin" :
    status === "connecting" ? "Connecting..." : "Relay disconnected";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 12,
        padding: "12px 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: dotColor,
              boxShadow: status === "syncing" ? `0 0 6px ${dotColor}` : "none",
            }}
          />
          <span style={{ fontSize: 11, color: "#868E96" }}>{statusLabel}</span>
        </div>
        <span style={{ fontSize: 11, color: "#ADB5BD" }}>Build: {selectedSummary}</span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          border: "1px solid #2c2f36",
          borderRadius: 6,
          padding: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#868E96", fontWeight: 600, minWidth: 48 }}>Brands</span>
          {/* Temporarily hidden — re-enable to allow pushing every brand at once.
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#CED4DA" }}>
            <input
              type="radio"
              name="brand-mode"
              checked={brandMode === "all"}
              onChange={() => setBrandMode("all")}
            />
            All brands
          </label>
          */}
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#CED4DA" }}>
            <input
              type="radio"
              name="brand-mode"
              checked={brandMode === "selected"}
              onChange={() => setBrandMode("selected")}
            />
            Selected brands
          </label>
        </div>

        {brandMode === "selected" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={selectAllBrands}
                style={{
                  background: "#2f9e44",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "4px 8px",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                Select all
              </button>
              <button
                onClick={clearBrands}
                style={{
                  background: "#495057",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "4px 8px",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 6,
                border: "1px solid #2c2f36",
                borderRadius: 6,
                padding: 8,
              }}
            >
              {allBrandIds.map((id) => (
                <label
                  key={id}
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#CED4DA" }}
                >
                  <input
                    type="checkbox"
                    checked={selectedBrands.indexOf(id) >= 0}
                    onChange={() => toggleBrand(id)}
                  />
                  {(brands[id] && brands[id].name) || id}
                </label>
              ))}
            </div>
            <span style={{ fontSize: 10, color: "#868E96", lineHeight: 1.4 }}>
              Only the brands you pick are pushed. Other brands in the Figma file are left untouched.
            </span>
          </div>
        )}

        <div style={{ height: 1, background: "#2c2f36", margin: "2px 0" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#868E96", fontWeight: 600, minWidth: 48 }}>Build</span>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#CED4DA" }}>
            <input
              type="radio"
              name="build-mode"
              checked={buildMode === "all"}
              onChange={() => setBuildMode("all")}
            />
            All components
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#CED4DA" }}>
            <input
              type="radio"
              name="build-mode"
              checked={buildMode === "selected"}
              onChange={() => setBuildMode("selected")}
            />
            Selected components
          </label>
        </div>

        {buildMode === "selected" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={selectAllComponents}
                style={{
                  background: "#2f9e44",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "4px 8px",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                Select all
              </button>
              <button
                onClick={clearComponents}
                style={{
                  background: "#495057",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "4px 8px",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            </div>
            <div
              style={{
                maxHeight: 176,
                overflowY: "auto",
                border: "1px solid #2c2f36",
                borderRadius: 6,
                padding: 8,
              }}
            >
              {BUILDABLE_SECTIONS.map((section, sectionIndex) => (
                <div key={section.label} style={{ marginTop: sectionIndex === 0 ? 0 : 12 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#868E96",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    {section.label}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                      gap: 6,
                    }}
                  >
                    {section.names.map((name) => (
                      <label
                        key={name}
                        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#CED4DA" }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedComponents.indexOf(name) >= 0}
                          onChange={() => toggleComponent(name)}
                        />
                        {componentLabel(name)}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#CED4DA" }}>
          <input
            type="checkbox"
            checked={preserveExistingVariables}
            onChange={(e) => setPreserveExistingVariables(e.target.checked)}
          />
          Safe sync: do not delete missing Figma variables
        </label>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={handleSync}
          disabled={buttonDisabled}
          style={{
            background: buttonDisabled ? "#373A40" : "#228BE6",
            color: buttonDisabled ? "#5C5F66" : "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            cursor: buttonDisabled ? "not-allowed" : "pointer",
          }}
        >
          Sync to Figma
        </button>
        <button
          onClick={handleBuildFoundationsDoc}
          disabled={buttonDisabled}
          title="Build (or rebuild) just the Foundations doc on the Figma Component Documentation page — colors, radius, spacing, and typography. Does not rebuild component sets."
          style={{
            background: "transparent",
            color: buttonDisabled ? "#5C5F66" : "#ADB5BD",
            border: "1px solid #2c2f36",
            borderRadius: 6,
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 500,
            cursor: buttonDisabled ? "not-allowed" : "pointer",
          }}
        >
          Build Foundations doc
        </button>
        <button
          onClick={handleExportChanges}
          title="Diff current tokens against the saved baseline and download a changelog to send to a dev"
          style={{
            background: "transparent",
            color: "#ADB5BD",
            border: "1px solid #2c2f36",
            borderRadius: 6,
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Export token changes
        </button>
      </div>

      {selectionError && <span style={{ fontSize: 11, color: "#FA5252" }}>{selectionError}</span>}
      {error && <span style={{ fontSize: 11, color: "#FA5252" }}>{error}</span>}
      {lastSyncMessage && !error && (
        <span style={{ fontSize: 11, color: "#51CF66" }}>{lastSyncMessage}</span>
      )}
      {lockMessage && (
        <span
          style={{
            fontSize: 11,
            color:
              lockMessage.type === "error"
                ? "#FA5252"
                : lockMessage.type === "warn"
                ? "#FAB005"
                : "#51CF66",
          }}
        >
          {lockMessage.text}
        </span>
      )}

      {changelog && !isEmptyDiff(changelog.diff) && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            border: "1px solid #2c2f36",
            borderRadius: 6,
            padding: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#CED4DA" }}>
              Token changes since baseline
              {changelog.scopeIds && changelog.scopeIds.length && changelog.scopeIds.length < allBrandIds.length
                ? ` · ${changelog.scopeIds
                    .map((id) => (changelog.brandNames && changelog.brandNames[id]) || id)
                    .join(", ")}`
                : ""}
              {" · "}
              {diffSummaryText(changelog.diff)}
            </span>
            <button
              onClick={handleDownloadReport}
              style={{
                background: "#228BE6",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Download report
            </button>
          </div>
          <pre
            style={{
              margin: 0,
              maxHeight: 220,
              overflow: "auto",
              fontSize: 11,
              lineHeight: 1.5,
              color: "#ADB5BD",
              whiteSpace: "pre",
            }}
          >
            {formatTokenChangelog(changelog.diff, { brandNames: changelog.brandNames, date: changelog.date })}
          </pre>
        </div>
      )}
    </div>
  );
}
