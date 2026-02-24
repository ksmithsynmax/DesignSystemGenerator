import { useCallback } from "react";
import { buildExportPayload } from "../utils/buildExportPayload";
import { useFigmaSync } from "../hooks/useFigmaSync";

export default function FigmaSyncButton({ brands }) {
  const { status, pluginConnected, sync, error, lastSyncMessage } = useFigmaSync();

  const handleSync = useCallback(() => {
    const payload = buildExportPayload(brands);
    sync(payload);
  }, [brands, sync]);

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
    !pluginConnected;

  const statusLabel =
    status === "syncing" ? "Syncing..." :
    pluginConnected ? "Plugin connected" :
    status === "connected" ? "Waiting for plugin" :
    status === "connecting" ? "Connecting..." : "Relay disconnected";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
      }}
    >
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

      {error && (
        <span style={{ fontSize: 11, color: "#FA5252" }}>{error}</span>
      )}
      {lastSyncMessage && !error && (
        <span style={{ fontSize: 11, color: "#51CF66" }}>{lastSyncMessage}</span>
      )}
    </div>
  );
}
