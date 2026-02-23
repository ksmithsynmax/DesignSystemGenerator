import { useState, useRef, useCallback, useEffect } from "react";

const WS_URL = "ws://localhost:9001";

export function useFigmaSync() {
  const [status, setStatus] = useState("disconnected");
  const [pluginConnected, setPluginConnected] = useState(false);
  const [error, setError] = useState(null);
  const [lastSyncMessage, setLastSyncMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const connect = useCallback(() => {
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
          } else {
            setStatus("error");
            setError(msg.error || "Unknown error");
          }
          break;
        case "sync-progress":
          setLastSyncMessage(msg.message);
          break;
        case "error":
          setError(msg.message);
          break;
      }
    };

    ws.onclose = () => {
      setStatus("disconnected");
      setPluginConnected(false);
      wsRef.current = null;
      reconnectRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectRef.current);
      if (wsRef.current) wsRef.current.close();
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
    wsRef.current.send(JSON.stringify({ type: "sync-tokens", payload }));
  }, [pluginConnected]);

  return { status, pluginConnected, sync, error, lastSyncMessage };
}
