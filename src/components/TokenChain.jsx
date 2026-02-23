import Tag from "./shared/Tag";
import Arrow from "./shared/Arrow";
import Swatch from "./shared/Swatch";
import { COMPONENT_TOKENS, COMPONENT_SIZE_KEYS, TOKEN_TYPES } from "../data/componentTokens";
import { resolveDimension, getDefaultSizeKey } from "../utils/resolveToken";

export default function TokenChain({ brands, brandId, componentName }) {
  const tokens = COMPONENT_TOKENS[componentName];
  if (!tokens) return null;

  const brand = brands[brandId];
  const sizeKeys = COMPONENT_SIZE_KEYS[componentName] || [];

  // Color chains
  const colorChains = Object.entries(tokens)
    .filter(([, def]) => def.type === TOKEN_TYPES.COLOR && def.semantic)
    .map(([tokenName, def]) => {
      const mapping = brand.semanticMap[def.semantic];
      if (!mapping) return null;
      const hex = brand.primitives[mapping.color]?.[mapping.index];
      if (!hex) return null;
      return {
        tokenName,
        type: "COLOR",
        semanticRef: def.semantic,
        primitive: `${mapping.color}/${mapping.index}`,
        hex,
        figmaPath: def.figmaPath,
      };
    })
    .filter(Boolean);

  // Dimension chains
  const dimChains = Object.entries(tokens)
    .filter(([, def]) => def.type === TOKEN_TYPES.FLOAT)
    .map(([tokenName, def]) => {
      const defaultSize = getDefaultSizeKey(brands, brandId, tokenName);
      const resolvedValue = def.sizes
        ? resolveDimension(brands, brandId, tokenName, defaultSize || sizeKeys[0])
        : resolveDimension(brands, brandId, tokenName);
      return {
        tokenName,
        type: "FLOAT",
        value: resolvedValue,
        unit: def.unit || "",
        defaultSize: def.sizes ? defaultSize : null,
        figmaPath: def.figmaPath,
      };
    });

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          color: "#5C5F66",
          marginBottom: 16,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontWeight: 600,
        }}
      >
        Token Resolution Chain — {brand.name} — {componentName}
      </div>

      {/* Color chains */}
      {colorChains.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: "#5C5F66", marginBottom: 8 }}>
            Color Tokens: Value → Primitive → Semantic → Component → Render
          </div>
          {colorChains.map(({ tokenName, semanticRef, primitive, hex, figmaPath }) => (
            <div
              key={tokenName}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
                padding: "8px 0",
                borderBottom: "1px solid #2C2E33",
              }}
            >
              <Tag color="#FA5252" bg="#FA525218">{hex}</Tag>
              <Arrow />
              <Tag color="#FAB005" bg="#FAB00518">{primitive}</Tag>
              <Arrow />
              <Tag color="#51CF66" bg="#51CF6618">{semanticRef}</Tag>
              <Arrow />
              <Tag color="#4DABF7" bg="#4DABF718">{figmaPath}</Tag>
              <Arrow />
              <Swatch color={hex} size={20} />
            </div>
          ))}
        </>
      )}

      {/* Dimension chains */}
      {dimChains.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: "#5C5F66", marginBottom: 8, marginTop: 16 }}>
            Dimension Tokens: Value → Component
          </div>
          {dimChains.map(({ tokenName, value, unit, defaultSize, figmaPath }) => (
            <div
              key={tokenName}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
                padding: "8px 0",
                borderBottom: "1px solid #2C2E33",
              }}
            >
              <Tag color="#FA5252" bg="#FA525218">
                {value}{unit}
              </Tag>
              <Arrow />
              <Tag color="#4DABF7" bg="#4DABF718">{figmaPath}</Tag>
              {defaultSize && (
                <Tag color="#868E96" bg="#868E9618">default: {defaultSize}</Tag>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
