import { useState } from "react";
import { highlightCode } from "../../utils/highlightCode";

export default function CodeSnippet({ code, label }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          position: "relative",
          background: "#1A1B1E",
          borderRadius: 8,
          padding: 16,
        }}
      >
        <button
          onClick={handleCopy}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: copied ? "#2F9E44" : "#373A40",
            color: copied ? "#fff" : "#C1C2C5",
            border: "none",
            borderRadius: 4,
            padding: "4px 10px",
            fontSize: 11,
            cursor: "pointer",
            transition: "background 0.2s",
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <pre
          style={{
            margin: 0,
            color: "#C1C2C5",
            fontSize: 12,
            fontFamily: "monospace",
            lineHeight: 1.5,
            overflowX: "auto",
            whiteSpace: "pre",
          }}
        >
          {highlightCode(code)}
        </pre>
      </div>
    </div>
  );
}
