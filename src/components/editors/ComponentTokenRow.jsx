import Swatch from "../shared/Swatch";
import Arrow from "../shared/Arrow";
import Tag from "../shared/Tag";

export default function ComponentTokenRow({ token, tokenDef, resolvedColor }) {
  const semanticRef = tokenDef?.semantic;
  return (
    <div
      style={{
        padding: "5px 4px",
        borderBottom: "1px solid #2C2E33",
        borderRadius: 4,
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#2C2E33")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div
        style={{
          fontSize: 12,
          fontFamily: "monospace",
          color: "#C1C2C5",
          marginBottom: 4,
        }}
      >
        {token}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Swatch color={resolvedColor} />
        <Arrow />
        {semanticRef ? (
          <Tag color="#4DABF7">{semanticRef}</Tag>
        ) : (
          <Tag color="#5C5F66">transparent</Tag>
        )}
      </div>
    </div>
  );
}
