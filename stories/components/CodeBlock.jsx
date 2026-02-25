import { useState } from "react";

export default function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: "relative", marginTop: 24 }}>
      <div
        style={{
          fontSize: 11,
          color: "#868E96",
          marginBottom: 6,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Component Code
      </div>
      <pre
        style={{
          background: "#1A1B1E",
          color: "#C1C2C5",
          padding: 16,
          borderRadius: 8,
          fontSize: 13,
          fontFamily: "monospace",
          overflow: "auto",
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        {code}
      </pre>
      <button
        onClick={handleCopy}
        style={{
          position: "absolute",
          top: 30,
          right: 8,
          background: copied ? "#2B8A3E" : "#373A40",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          padding: "4px 10px",
          fontSize: 11,
          cursor: "pointer",
          fontFamily: "monospace",
        }}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
