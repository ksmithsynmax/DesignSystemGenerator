import { useCallback, useMemo, useState } from "react";
import { buildExportPayload } from "../utils/buildExportPayload";
import { useFigmaSync } from "../hooks/useFigmaSync";

const BUILDABLE_COMPONENTS = [
  "button",
  "switch",
  "slider",
  "rangeslider",
  "checkbox",
  "radio",
  "chip",
  "notification",
  "alert",
  "modal",
  "tooltip",
  "loader",
  "pill",
  "badge",
  "textinput",
  "select",
  "card",
  "actionicon",
  "tabs",
  "accordion",
  "anchor",
  "title",
  "text",
  "image",
];

const COMPONENT_LABELS = {
  actionicon: "ActionIcon",
  rangeslider: "RangeSlider",
  textinput: "TextInput",
};

export default function FigmaSyncButton({ brands, syncBuildOptions }) {
  const { status, pluginConnected, sync, error, lastSyncMessage } = useFigmaSync();
  const [buildMode, setBuildMode] = useState("all");
  const [selectedComponents, setSelectedComponents] = useState(BUILDABLE_COMPONENTS);
  const [textInputDebugDefaultOnly, setTextInputDebugDefaultOnly] = useState(false);

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
    buildOptions.textInputDebugDefaultOnly = textInputDebugDefaultOnly;
    if (buildMode === "selected") {
      buildOptions.componentsToBuild = selectedComponents.slice();
    }
    if (Object.keys(buildOptions).length === 0) buildOptions = null;
    const payload = buildExportPayload(brands, buildOptions);
    sync(payload);
  }, [brands, buildMode, selectedComponents, sync, syncBuildOptions, textInputDebugDefaultOnly]);

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
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 6,
                maxHeight: 176,
                overflowY: "auto",
                border: "1px solid #2c2f36",
                borderRadius: 6,
                padding: 8,
              }}
            >
              {BUILDABLE_COMPONENTS.map((name) => (
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
        )}
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#CED4DA" }}>
          <input
            type="checkbox"
            checked={textInputDebugDefaultOnly}
            onChange={(e) => setTextInputDebugDefaultOnly(e.target.checked)}
          />
          TextInput debug: only Default size/radius
        </label>
      </div>

      <button
        onClick={handleSync}
        disabled={buttonDisabled}
        style={{
          alignSelf: "flex-start",
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

      {selectionError && <span style={{ fontSize: 11, color: "#FA5252" }}>{selectionError}</span>}
      {error && <span style={{ fontSize: 11, color: "#FA5252" }}>{error}</span>}
      {lastSyncMessage && !error && (
        <span style={{ fontSize: 11, color: "#51CF66" }}>{lastSyncMessage}</span>
      )}
    </div>
  );
}
