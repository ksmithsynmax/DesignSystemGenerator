import { useState } from "react";

export default function PrimitiveScale({ name, scale, onUpdate, readOnly, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [val, setVal] = useState("");
  const normalizeHex = (raw) => {
    const stripped = String(raw || "").trim().replace(/^#/, "");
    if (/^[0-9A-Fa-f]{3}$/.test(stripped)) {
      return "#" + stripped.split("").map((ch) => ch + ch).join("").toUpperCase();
    }
    if (/^[0-9A-Fa-f]{6}$/.test(stripped)) {
      return "#" + stripped.toUpperCase();
    }
    return null;
  };

  const commitEdit = () => {
    if (editing === null) return;
    const normalized = normalizeHex(val);
    if (normalized) onUpdate(name, editing, normalized);
    setEditing(null);
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#C1C2C5",
            fontFamily: "monospace",
          }}
        >
          {name}
        </div>
        {!readOnly && typeof onDelete === "function" ? (
          <button
            onClick={() => onDelete(name)}
            style={{
              background: "none",
              border: "none",
              color: "#FA5252",
              fontSize: 11,
              fontFamily: "monospace",
              cursor: "pointer",
              padding: 0,
            }}
            title={`Delete ${name} scale`}
          >
            Delete
          </button>
        ) : null}
      </div>
      <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {scale.map((c, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              minWidth: 0,
            }}
          >
            {!readOnly && editing === i ? (
              <input
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitEdit();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setEditing(null);
                  }
                }}
                autoFocus
                style={{
                  width: "100%",
                  fontSize: 9,
                  fontFamily: "monospace",
                  padding: "2px 4px",
                  background: "#25262B",
                  border: `1px solid ${normalizeHex(val) ? "#4DABF7" : "#FA5252"}`,
                  borderRadius: 3,
                  color: "#C1C2C5",
                  textAlign: "center",
                  boxSizing: "border-box",
                }}
              />
            ) : (
              <div
                onClick={readOnly ? undefined : () => {
                  setEditing(i);
                  setVal(c);
                }}
                style={{
                  width: "100%",
                  height: 36,
                  borderRadius: 4,
                  background: c,
                  cursor: readOnly ? "default" : "pointer",
                  border: "2px solid transparent",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={readOnly ? undefined : (e) =>
                  (e.currentTarget.style.borderColor = "#4DABF7")
                }
                onMouseLeave={readOnly ? undefined : (e) =>
                  (e.currentTarget.style.borderColor = "transparent")
                }
                title={`${name}/${i} — ${c}`}
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
