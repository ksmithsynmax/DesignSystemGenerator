import { useState } from "react";

export default function PrimitiveScale({ name, scale, onUpdate }) {
  const [editing, setEditing] = useState(null);
  const [val, setVal] = useState("");

  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#C1C2C5",
          marginBottom: 6,
          fontFamily: "monospace",
        }}
      >
        {name}
      </div>
      <div style={{ display: "flex", gap: 2 }}>
        {scale.map((c, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            {editing === i ? (
              <input
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onBlur={() => {
                  if (/^#[0-9A-Fa-f]{6}$/.test(val)) onUpdate(name, i, val);
                  setEditing(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.target.blur();
                  if (e.key === "Escape") setEditing(null);
                }}
                autoFocus
                style={{
                  width: 56,
                  fontSize: 9,
                  fontFamily: "monospace",
                  padding: "2px 4px",
                  background: "#25262B",
                  border: "1px solid #4DABF7",
                  borderRadius: 3,
                  color: "#C1C2C5",
                  textAlign: "center",
                }}
              />
            ) : (
              <div
                onClick={() => {
                  setEditing(i);
                  setVal(c);
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 4,
                  background: c,
                  cursor: "pointer",
                  border: "2px solid transparent",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "#4DABF7")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "transparent")
                }
                title={`${name}/${i} — ${c}\nClick to edit`}
              />
            )}
            <span
              style={{ fontSize: 9, color: "#5C5F66", fontFamily: "monospace" }}
            >
              {i}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
