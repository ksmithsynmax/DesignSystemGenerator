import ChevronRightIcon from "@untitledui-icons/react/line/ChevronRightIcon";
import { resolveDimension, getDefaultSizeKey } from "../../utils/resolveToken";

export default function DimensionTokenRow({
  tokenName,
  tokenDef,
  brands,
  brandId,
  sizeKeys,
  onUpdateDimension,
  isActive,
  onClick,
}) {
  const defaultSize = getDefaultSizeKey(brands, brandId, tokenName);
  const brand = brands[brandId];
  const hasOverride = (size) =>
    brand.dimensionOverrides?.[tokenName]?.[size] !== undefined;

  const isString = tokenDef.type === "STRING";
  const allowedValues = tokenDef.allowedValues;
  const isSingleValue = tokenDef.value !== undefined && !tokenDef.sizes;

  // Resolve a display value for the collapsed card
  const displayValue = isSingleValue
    ? resolveDimension(brands, brandId, tokenName)
    : resolveDimension(brands, brandId, tokenName, defaultSize || sizeKeys[0]);
  const unit = tokenDef.unit || "";
  const displayText = isString ? displayValue : `${displayValue}${unit}`;

  return (
    <div>
      {/* Collapsed card header */}
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
          {tokenName}
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

      {/* Expanded editing panel */}
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
          {isSingleValue ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {isString && allowedValues ? (
                <select
                  value={resolveDimension(brands, brandId, tokenName) ?? ""}
                  onChange={(e) => onUpdateDimension(tokenName, "_value", e.target.value)}
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
                  {allowedValues.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              ) : (
                <>
                  <input
                    type="number"
                    value={resolveDimension(brands, brandId, tokenName) ?? ""}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v)) onUpdateDimension(tokenName, "_value", v);
                    }}
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      background: "#1A1B1E",
                      border: "1px solid #373A40",
                      borderRadius: 4,
                      color: "#C1C2C5",
                      fontSize: 12,
                      fontFamily: "monospace",
                    }}
                  />
                  {unit && (
                    <span style={{ fontSize: 12, color: "#5C5F66", fontFamily: "monospace", flexShrink: 0 }}>
                      {unit}
                    </span>
                  )}
                </>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {sizeKeys.map((size) => {
                const val = resolveDimension(brands, brandId, tokenName, size);
                const isDefault = size === defaultSize;
                const isOverridden = hasOverride(size);
                return (
                  <div
                    key={size}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        color: isDefault ? "#228BE6" : "#5C5F66",
                        fontWeight: isDefault ? 600 : 400,
                        fontFamily: "monospace",
                      }}
                    >
                      {size}
                      {isDefault ? "*" : ""}
                    </span>
                    {isString && allowedValues ? (
                      <select
                        value={val ?? ""}
                        onChange={(e) => onUpdateDimension(tokenName, size, e.target.value)}
                        style={{
                          width: 80,
                          padding: "4px 6px",
                          background: isOverridden ? "#2C2E33" : "#1A1B1E",
                          border: `1px solid ${isOverridden ? "#E9ECEF" : "#373A40"}`,
                          borderRadius: 4,
                          color: "#C1C2C5",
                          fontSize: 11,
                          fontFamily: "monospace",
                        }}
                      >
                        {allowedValues.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        value={val ?? ""}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          if (!isNaN(v)) onUpdateDimension(tokenName, size, v);
                        }}
                        style={{
                          width: 48,
                          padding: "4px 6px",
                          background: isOverridden ? "#2C2E33" : "#1A1B1E",
                          border: `1px solid ${isOverridden ? "#E9ECEF" : "#373A40"}`,
                          borderRadius: 4,
                          color: "#C1C2C5",
                          fontSize: 11,
                          fontFamily: "monospace",
                          textAlign: "center",
                        }}
                      />
                    )}
                  </div>
                );
              })}
              {unit && (
                <span
                  style={{
                    fontSize: 11,
                    color: "#5C5F66",
                    fontFamily: "monospace",
                    alignSelf: "flex-end",
                    marginBottom: 4,
                  }}
                >
                  {unit}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
