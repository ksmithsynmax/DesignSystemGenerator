export default function SemanticRow({
  token,
  mapping,
  resolvedColor,
  onUpdate,
  colors,
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: 8,
        marginBottom: 4,
        background: "#25262B",
        borderRadius: 6,
        border: "1px solid #2C2E33",
      }}
    >
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
            fontSize: 12,
            fontFamily: "monospace",
            color: "#C1C2C5",
            marginBottom: 4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {token}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <select
            value={mapping.color}
            onChange={(e) => onUpdate(token, { ...mapping, color: e.target.value })}
            style={{
              background: "#1A1B1E",
              border: "1px solid #373A40",
              borderRadius: 4,
              color: "#C1C2C5",
              fontSize: 11,
              fontFamily: "monospace",
              padding: "3px 6px",
            }}
          >
            {colors.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span style={{ color: "#5C5F66", fontSize: 11 }}>/</span>
          <select
            value={mapping.index}
            onChange={(e) =>
              onUpdate(token, { ...mapping, index: parseInt(e.target.value) })
            }
            style={{
              background: "#1A1B1E",
              border: "1px solid #373A40",
              borderRadius: 4,
              color: "#C1C2C5",
              fontSize: 11,
              fontFamily: "monospace",
              padding: "3px 6px",
              width: 44,
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
