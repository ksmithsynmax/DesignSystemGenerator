import { useCallback, useMemo, useState } from "react";
import { buildExportPayload } from "../utils/buildExportPayload";
import { buildTokenLock } from "../utils/buildTokenLock";
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
  "chart-area",
  "chart-stacked-bar",
  "chart-combo",
  "chart-donut",
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
  "table",
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
  "chart-area": "Area Chart",
  "chart-stacked-bar": "Stacked Bar Chart",
  "chart-combo": "Combo Chart",
  "chart-donut": "Donut Chart",
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
  const [buildMode, setBuildMode] = useState("all");
  const [selectedComponents, setSelectedComponents] = useState(BUILDABLE_COMPONENTS);
  const [preserveExistingVariables, setPreserveExistingVariables] = useState(true);
  const [lockMessage, setLockMessage] = useState(null);
  const [changelog, setChangelog] = useState(null);

  const selectedCount = selectedComponents.length;
  const selectionError = buildMode === "selected" && selectedCount === 0
    ? "Pick at least one component for selected build mode."
    : null;

  const componentLabel = useCallback((name) => {
    return COMPONENT_LABELS[name] || name.charAt(0).toUpperCase() + name.slice(1);
  }, []);

  const selectedSummary = useMemo(() => {
    if (buildMode === "all") return "All components";
    return selectedCount + " selected";
  }, [buildMode, selectedCount]);

  const handleSync = useCallback(() => {
    if (buildMode === "selected" && selectedComponents.length === 0) return;
    var buildOptions = Object.assign({}, syncBuildOptions || {});
    buildOptions.preserveExistingVariables = preserveExistingVariables;
    if (buildMode === "selected") {
      buildOptions.componentsToBuild = selectedComponents.slice();
    }
    if (Object.keys(buildOptions).length === 0) buildOptions = null;
    const payload = buildExportPayload(brands, buildOptions);
    sync(payload);

    // Capture what this push changed vs. the previous baseline, then advance the
    // baseline to now. The changelog is the artifact to hand the dev.
    setLockMessage(null);
    const nextLock = buildTokenLock(brands);
    (async () => {
      let prev = null;
      try {
        prev = await readBaseline();
      } catch {
        // Relay unreachable — we just won't have a diff to show this time.
      }
      if (prev && prev.payload) {
        const diff = diffTokenPayloads(prev.payload, nextLock.payload);
        setChangelog({ diff, brandNames: brandNamesOf(brands), date: new Date() });
      } else {
        setChangelog(null);
      }
      try {
        await writeTokenLockToRepo(nextLock);
        const summary =
          prev && prev.payload
            ? diffSummaryText(diffTokenPayloads(prev.payload, nextLock.payload))
            : "baseline initialized";
        setLockMessage({ type: "success", text: `Synced · baseline updated (${summary})` });
      } catch {
        setLockMessage({
          type: "error",
          text: "Synced, but baseline not written (restart `npm run relay`, or use Save token lock).",
        });
      }
    })();
  }, [brands, buildMode, selectedComponents, sync, syncBuildOptions, preserveExistingVariables]);

  // Preview what changed vs. the saved baseline WITHOUT advancing the baseline,
  // and download the changelog to send to a dev.
  // Builds (or rebuilds) just the Foundations doc on the Figma "Component
  // Documentation" page. Variables are re-synced (idempotent) so the doc has
  // something to bind to, but component sets are NOT rebuilt.
  const handleBuildFoundationsDoc = useCallback(() => {
    const buildOptions = Object.assign({}, syncBuildOptions || {});
    buildOptions.preserveExistingVariables = preserveExistingVariables;
    buildOptions.foundationsDocOnly = true;
    const payload = buildExportPayload(brands, buildOptions);
    sync(payload);
  }, [brands, preserveExistingVariables, sync, syncBuildOptions]);

  const handleExportChanges = useCallback(() => {
    setLockMessage(null);
    const current = buildExportPayload(brands);
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
      const diff = diffTokenPayloads(prev.payload, current);
      setChangelog({ diff, brandNames: brandNamesOf(brands), date: new Date() });
      if (isEmptyDiff(diff)) {
        setLockMessage({ type: "success", text: "No token changes since the last baseline." });
        return;
      }
      const text = formatTokenChangelog(diff, { brandNames: brandNamesOf(brands), date: new Date() });
      triggerDownload("tokens-changelog.txt", text);
      setLockMessage({ type: "success", text: `Downloaded changelog (${diffSummaryText(diff)})` });
    })();
  }, [brands]);

  const handleDownloadReport = useCallback(() => {
    if (!changelog) return;
    const text = formatTokenChangelog(changelog.diff, {
      brandNames: changelog.brandNames,
      date: changelog.date,
    });
    triggerDownload("tokens-changelog.txt", text);
  }, [changelog]);

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
              Token changes since baseline · {diffSummaryText(changelog.diff)}
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
