export default function TokenEditor({
  componentToken,
  semanticToken,
  mapping,
  resolvedColor,
  onUpdate,
  colors,
}) {
  return (
    <div
      style={{
        background: "#25262B",
        borderRadius: "0 0 6px 6px",
        border: "1px solid #4DABF7",
        borderTop: "1px solid #373A40",
        padding: 16,
        marginTop: 0,
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: resolvedColor,
            flexShrink: 0,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontFamily: "monospace",
              color: "#E9ECEF",
              fontWeight: 600,
            }}
          >
            {componentToken}
          </div>
          <div
            style={{
              fontSize: 11,
              fontFamily: "monospace",
              color: "#5C5F66",
            }}
          >
            ↳ {semanticToken}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <select
            value={mapping.color}
            onChange={(e) =>
              onUpdate(semanticToken, { ...mapping, color: e.target.value })
            }
            style={{
              background: "#1A1B1E",
              border: "1px solid #373A40",
              borderRadius: 4,
              color: "#C1C2C5",
              fontSize: 12,
              fontFamily: "monospace",
              padding: "4px 8px",
            }}
          >
            {colors.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span style={{ color: "#5C5F66", fontSize: 12 }}>/</span>
          <select
            value={mapping.index}
            onChange={(e) =>
              onUpdate(semanticToken, {
                ...mapping,
                index: parseInt(e.target.value),
              })
            }
            style={{
              background: "#1A1B1E",
              border: "1px solid #373A40",
              borderRadius: 4,
              color: "#C1C2C5",
              fontSize: 12,
              fontFamily: "monospace",
              padding: "4px 8px",
              width: 48,
            }}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
