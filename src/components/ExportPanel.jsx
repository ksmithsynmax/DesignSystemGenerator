import { useState, useMemo } from "react";
import { buildExportPayload } from "../utils/buildExportPayload";

export default function ExportPanel({ brands }) {
  const [show, setShow] = useState(false);
  const exported = useMemo(() => JSON.stringify(buildExportPayload(brands), null, 2), [brands]);

  return (
    <div style={{ marginTop: 16 }}>
      <button
        onClick={() => setShow(!show)}
        style={{
          background: "#228BE6",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          padding: "8px 16px",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {show ? "Hide" : "Export"} Token JSON
      </button>
      {show && (
        <pre
          style={{
            marginTop: 12,
            background: "#1A1B1E",
            border: "1px solid #2C2E33",
            borderRadius: 8,
            padding: 16,
            fontSize: 11,
            fontFamily: "monospace",
            color: "#C1C2C5",
            overflow: "auto",
            maxHeight: 400,
          }}
        >
          {exported}
        </pre>
      )}
    </div>
  );
}
