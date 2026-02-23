import Swatch from "../shared/Swatch";
import Arrow from "../shared/Arrow";

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
        alignItems: "center",
        gap: 8,
        padding: "6px 0",
        borderBottom: "1px solid #2C2E33",
      }}
    >
      <Swatch color={resolvedColor} />
      <span
        style={{
          fontSize: 12,
          fontFamily: "monospace",
          color: "#C1C2C5",
          minWidth: 200,
        }}
      >
        {token}
      </span>
      <Arrow />
      <select
        value={mapping.color}
        onChange={(e) => onUpdate(token, { ...mapping, color: e.target.value })}
        style={{
          background: "#25262B",
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
          background: "#25262B",
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
  );
}
