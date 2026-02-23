import Swatch from "../shared/Swatch";
import Arrow from "../shared/Arrow";
import Tag from "../shared/Tag";

export default function ComponentTokenRow({ token, tokenDef, resolvedColor }) {
  const semanticRef = tokenDef?.semantic;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "5px 0",
        borderBottom: "1px solid #2C2E33",
      }}
    >
      <Swatch color={resolvedColor} />
      <span
        style={{
          fontSize: 12,
          fontFamily: "monospace",
          color: "#C1C2C5",
          minWidth: 260,
        }}
      >
        {token}
      </span>
      <Arrow />
      {semanticRef ? (
        <Tag color="#4DABF7">{semanticRef}</Tag>
      ) : (
        <Tag color="#5C5F66">transparent</Tag>
      )}
    </div>
  );
}
