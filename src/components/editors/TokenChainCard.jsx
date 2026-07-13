import ChevronRightIcon from "@untitledui-icons/react/line/ChevronRightIcon";
import Swatch from "../shared/Swatch";
import Arrow from "../shared/Arrow";
import Tag from "../shared/Tag";

const GRADIENT_PREFIX = "__gradient__:";

export default function TokenChainCard({
  componentToken,
  semanticToken,
  mapping,
  resolvedColor,
  isActive,
  onClick,
  onUpdate,
  brandColors,
  globalColors,
  gradientIds = [],
}) {
  const opacity = Number.isFinite(Number(mapping.opacity))
    ? Math.min(100, Math.max(0, Math.round(Number(mapping.opacity))))
    : 100;
  const isGradient = Boolean(mapping?.gradient && String(mapping.gradient).trim());
  const isTransparent = !isGradient && mapping.color === "transparent";
  const primitive = isGradient
    ? `gradient/${String(mapping.gradient).trim()}`
    : isTransparent
      ? "transparent"
      : `${mapping.color}/${mapping.index}${opacity !== 100 ? ` @ ${opacity}%` : ""}`;

  const paletteSelectValue = isGradient
    ? `${GRADIENT_PREFIX}${String(mapping.gradient).trim()}`
    : mapping.color || "neutral";

  const updateOpacity = (nextValue) => {
    if (isGradient) return;
    const parsed = Number.parseInt(nextValue, 10);
    const safeOpacity = Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 0;
    onUpdate(componentToken, { ...mapping, opacity: safeOpacity });
  };

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
              value={paletteSelectValue}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw.startsWith(GRADIENT_PREFIX)) {
                  const gid = raw.slice(GRADIENT_PREFIX.length);
                  onUpdate(componentToken, { gradient: gid, opacity });
                  return;
                }
                if (raw === "transparent") {
                  onUpdate(componentToken, {
                    color: "transparent",
                    index: 0,
                    opacity: 0,
                  });
                  return;
                }
                const nextOpacity = isTransparent && opacity === 0 ? 100 : opacity;
                onUpdate(componentToken, {
                  color: raw,
                  index: isGradient ? 5 : (Number.isFinite(Number(mapping.index)) ? Number(mapping.index) : 5),
                  opacity: nextOpacity,
                });
              }}
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
              <optgroup label="Brand">
                {brandColors.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </optgroup>
              {gradientIds.length > 0 && (
                <optgroup label="Gradients">
                  {gradientIds.map((id) => (
                    <option key={`grad-${id}`} value={`${GRADIENT_PREFIX}${id}`}>
                      {id}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Global">
                {globalColors.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </optgroup>
              <optgroup label="Special">
                <option value="transparent">transparent</option>
              </optgroup>
            </select>
            <span style={{ color: "#5C5F66", fontSize: 12, flexShrink: 0 }}>/</span>
            <select
              value={mapping.index}
              disabled={isTransparent || isGradient}
              onChange={(e) =>
                onUpdate(componentToken, {
                  ...mapping,
                  index: Number.parseInt(e.target.value, 10) || 0,
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
                opacity: isTransparent || isGradient ? 0.55 : 1,
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginTop: 8 }}>
            <div
              style={{
                fontSize: 11,
                color: "#5C5F66",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Opacity
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="range"
                min={0}
                max={100}
                value={opacity}
                disabled={isTransparent || isGradient}
                onChange={(e) => updateOpacity(e.target.value)}
                style={{ flex: 1, accentColor: "#228BE6", opacity: isTransparent || isGradient ? 0.45 : 1 }}
              />
              <input
                type="number"
                min={0}
                max={100}
                value={opacity}
                disabled={isTransparent || isGradient}
                onChange={(e) => updateOpacity(e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                style={{
                  width: 58,
                  background: "#1A1B1E",
                  border: "1px solid #373A40",
                  borderRadius: 4,
                  color: "#C1C2C5",
                  fontSize: 12,
                  fontFamily: "monospace",
                  padding: "6px 8px",
                  opacity: isTransparent || isGradient ? 0.55 : 1,
                }}
              />
              <span style={{ color: "#5C5F66", fontSize: 12, flexShrink: 0 }}>%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
