import ChevronRightIcon from "@untitledui-icons/react/line/ChevronRightIcon";
import Swatch from "../shared/Swatch";
import Arrow from "../shared/Arrow";
import Tag from "../shared/Tag";

export default function TokenChainCard({
  componentToken,
  semanticToken,
  mapping,
  resolvedColor,
  isActive,
  onClick,
  onUpdate,
  colors,
}) {
  const primitive = `${mapping.color}/${mapping.index}`;

  return (
    <div>
      <div
        onClick={onClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: 8,
          marginBottom: isActive ? 0 : 4,
          background: isActive ? "#2C2E33" : "#25262B",
          borderRadius: isActive ? "6px 6px 0 0" : 6,
          border: `1px solid ${isActive ? "#E9ECEF" : "#2C2E33"}`,
          borderBottom: isActive ? "none" : undefined,
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.borderColor = "#373A40";
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.borderColor = "#2C2E33";
        }}
      >
        <Swatch color={resolvedColor} size={20} />
        <div
          style={{
            fontSize: 12,
            fontFamily: "monospace",
            color: isActive ? "#E9ECEF" : "#C1C2C5",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          }}
        >
          {componentToken}
        </div>
        <ChevronRightIcon
          style={{
            width: 16,
            height: 16,
            color: "#5C5F66",
            flexShrink: 0,
            transition: "transform 0.15s",
            transform: isActive ? "rotate(90deg)" : "rotate(0deg)",
          }}
        />
      </div>

      {isActive && (
        <div
          style={{
            background: "#25262B",
            borderRadius: "0 0 6px 6px",
            border: "1px solid #E9ECEF",
            borderTop: "1px solid #373A40",
            padding: "10px 8px",
            marginBottom: 8,
          }}
        >
          {/* Chain visualization */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              flexWrap: "wrap",
              rowGap: 4,
              marginBottom: 10,
            }}
          >
            <Tag color="#868E96">{resolvedColor}</Tag>
            <Arrow />
            <Tag color="#868E96">{primitive}</Tag>
            <Arrow />
            <Tag color="#868E96">{semanticToken}</Tag>
          </div>

          {/* Editing controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <select
              value={mapping.color}
              onChange={(e) =>
                onUpdate(semanticToken, { ...mapping, color: e.target.value })
              }
              style={{
                flex: 1,
                background: "#1A1B1E",
                border: "1px solid #373A40",
                borderRadius: 4,
                color: "#C1C2C5",
                fontSize: 12,
                fontFamily: "monospace",
                padding: "6px 10px",
                appearance: "none",
                WebkitAppearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%235C5F66' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
                paddingRight: 28,
              }}
            >
              {colors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span style={{ color: "#5C5F66", fontSize: 12, flexShrink: 0 }}>/</span>
            <select
              value={mapping.index}
              onChange={(e) =>
                onUpdate(semanticToken, {
                  ...mapping,
                  index: parseInt(e.target.value),
                })
              }
              style={{
                width: 56,
                flexShrink: 0,
                background: "#1A1B1E",
                border: "1px solid #373A40",
                borderRadius: 4,
                color: "#C1C2C5",
                fontSize: 12,
                fontFamily: "monospace",
                padding: "6px 10px",
                appearance: "none",
                WebkitAppearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%235C5F66' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
                paddingRight: 28,
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
      )}
    </div>
  );
}
