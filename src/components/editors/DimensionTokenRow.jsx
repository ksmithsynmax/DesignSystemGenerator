import { resolveDimension, getDefaultSizeKey } from "../../utils/resolveToken";

export default function DimensionTokenRow({
  tokenName,
  tokenDef,
  brands,
  brandId,
  sizeKeys,
  onUpdateDimension,
}) {
  const defaultSize = getDefaultSizeKey(brands, brandId, tokenName);
  const brand = brands[brandId];
  const hasOverride = (size) =>
    brand.dimensionOverrides?.[tokenName]?.[size] !== undefined;

  const isString = tokenDef.type === "STRING";
  const allowedValues = tokenDef.allowedValues;

  // Single value token (no size variants)
  if (tokenDef.value !== undefined && !tokenDef.sizes) {
    const resolved = resolveDimension(brands, brandId, tokenName);
    const singleOverridden = brand.dimensionOverrides?.[tokenName]?.["_value"] !== undefined;
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
        <span
          style={{
            fontSize: 12,
            fontFamily: "monospace",
            color: "#C1C2C5",
            minWidth: 200,
          }}
        >
          {tokenName}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
          {isString && allowedValues ? (
            <select
              value={resolved ?? ""}
              onChange={(e) => onUpdateDimension(tokenName, "_value", e.target.value)}
              style={{
                padding: "2px 4px",
                background: singleOverridden ? "#2C2E33" : "#1A1B1E",
                border: `1px solid ${singleOverridden ? "#4DABF7" : "#373A40"}`,
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
            <>
              <input
                type="number"
                value={resolved ?? ""}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) onUpdateDimension(tokenName, "_value", v);
                }}
                style={{
                  width: 56,
                  padding: "2px 4px",
                  background: singleOverridden ? "#2C2E33" : "#1A1B1E",
                  border: `1px solid ${singleOverridden ? "#4DABF7" : "#373A40"}`,
                  borderRadius: 4,
                  color: "#C1C2C5",
                  fontSize: 11,
                  fontFamily: "monospace",
                  textAlign: "center",
                }}
              />
              {tokenDef.unit && (
                <span style={{ fontSize: 11, color: "#5C5F66", fontFamily: "monospace" }}>
                  {tokenDef.unit}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Size variant token
  return (
    <div
      style={{
        padding: "5px 0",
        borderBottom: "1px solid #2C2E33",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontFamily: "monospace",
          color: "#C1C2C5",
          marginBottom: 4,
        }}
      >
        {tokenName}
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
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
                gap: 2,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: isDefault ? "#228BE6" : "#5C5F66",
                  fontWeight: isDefault ? 600 : 400,
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
                    padding: "2px 2px",
                    background: isOverridden ? "#2C2E33" : "#1A1B1E",
                    border: `1px solid ${isOverridden ? "#4DABF7" : "#373A40"}`,
                    borderRadius: 4,
                    color: "#C1C2C5",
                    fontSize: 10,
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
                    padding: "2px 4px",
                    background: isOverridden ? "#2C2E33" : "#1A1B1E",
                    border: `1px solid ${isOverridden ? "#4DABF7" : "#373A40"}`,
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
        {tokenDef.unit && (
          <span
            style={{
              fontSize: 10,
              color: "#5C5F66",
              alignSelf: "flex-end",
              marginBottom: 2,
            }}
          >
            {tokenDef.unit}
          </span>
        )}
      </div>
    </div>
  );
}
