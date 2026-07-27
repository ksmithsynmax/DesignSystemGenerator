import { useState, useRef, useCallback, useEffect } from "react";

const WS_URL = "ws://localhost:9001";

export function useFigmaSync() {
  const [status, setStatus] = useState("disconnected");
  const [pluginConnected, setPluginConnected] = useState(false);
  const [error, setError] = useState(null);
  const [lastSyncMessage, setLastSyncMessage] = useState(null);
  // Determinate build progress + a heartbeat timestamp. `updatedAt` lets the UI
  // tell a genuine stall (no message for a long time) from a slow-but-alive
  // build. `current`/`total` come from the plugin's per-component step messages.
  const [syncProgress, setSyncProgress] = useState({
    current: 0,
    total: 0,
    updatedAt: 0,
    startedAt: 0,
  });
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  // Tracks whether the hook is still mounted. Without this, an intentional
  // close during effect cleanup (which happens on every HMR update to App.jsx)
  // fires `onclose`, which schedules a fresh reconnect AFTER cleanup already
  // cleared the timer — leaving an orphaned socket + reconnect loop behind.
  // Those accumulate over a long dev session and eventually OOM the renderer.
  const mountedRef = useRef(false);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    // Never open a second socket when one is already opening/open.
    if (wsRef.current && wsRef.current.readyState <= 1) return;

    setStatus("connecting");
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      setError(null);
      ws.send(JSON.stringify({ type: "register", role: "react" }));
    };

    ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      switch (msg.type) {
        case "peer-connected":
          if (msg.peer === "plugin") setPluginConnected(true);
          break;
        case "peer-disconnected":
          if (msg.peer === "plugin") setPluginConnected(false);
          break;
        case "sync-complete":
          if (msg.success) {
            setStatus("success");
            setLastSyncMessage(msg.message || "Sync complete");
            // Snap the bar to 100% on success.
            setSyncProgress((p) => ({
              ...p,
              current: p.total > 0 ? p.total : p.current,
              updatedAt: Date.now(),
            }));
          } else {
            setStatus("error");
            setError(msg.error || "Unknown error");
          }
          break;
        case "sync-progress":
          setLastSyncMessage(msg.message);
          setSyncProgress((p) => {
            const hasCounts =
              typeof msg.current === "number" && typeof msg.total === "number";
            return {
              current: hasCounts ? msg.current : p.current,
              total: hasCounts ? msg.total : p.total,
              updatedAt: Date.now(),
              startedAt: p.startedAt || Date.now(),
            };
          });
          break;
        case "error":
          setError(msg.message);
          break;
      }
    };

    ws.onclose = () => {
      if (wsRef.current === ws) wsRef.current = null;
      setStatus("disconnected");
      setPluginConnected(false);
      // Only auto-reconnect while still mounted — never after cleanup.
      if (mountedRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectRef.current);
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws) {
        // Detach handlers so this intentional close can't schedule a reconnect
        // or push state updates after unmount.
        ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;
        try {
          ws.close();
        } catch {
          /* already closing */
        }
      }
    };
  }, [connect]);

  const sync = useCallback((payload) => {
    if (!wsRef.current || wsRef.current.readyState !== 1) {
      setError("Not connected to relay server");
      return;
    }
    if (!pluginConnected) {
      setError("Figma plugin not connected");
      return;
    }
    setStatus("syncing");
    setError(null);
    setLastSyncMessage(null);
    setSyncProgress({ current: 0, total: 0, updatedAt: Date.now(), startedAt: Date.now() });
    wsRef.current.send(JSON.stringify({ type: "sync-tokens", payload }));
  }, [pluginConnected]);

  return { status, pluginConnected, sync, error, lastSyncMessage, syncProgress };
}
