import { COMPONENT_TOKENS, TOKEN_TYPES } from "../data/componentTokens";

export function resolveColor(brands, brandId, semanticKey) {
  if (!semanticKey) return "transparent";
  const brand = brands[brandId];
  const mapping = brand.semanticMap[semanticKey];
  if (!mapping) return "#FF00FF";
  return brand.primitives[mapping.color]?.[mapping.index] ?? "#FF00FF";
}

export function resolveDimension(brands, brandId, tokenName, size) {
  const brand = brands[brandId];
  const tokenDef = findTokenDef(tokenName);
  if (!tokenDef || (tokenDef.type !== TOKEN_TYPES.FLOAT && tokenDef.type !== TOKEN_TYPES.STRING)) return null;

  // Check brand overrides first
  if (size && brand.dimensionOverrides?.[tokenName]?.[size] !== undefined) {
    return brand.dimensionOverrides[tokenName][size];
  }

  // Size-variant token
  if (tokenDef.sizes && size) {
    return tokenDef.sizes[size] ?? null;
  }

  // Single-value token — check override first
  if (brand.dimensionOverrides?.[tokenName]?.["_value"] !== undefined) {
    return brand.dimensionOverrides[tokenName]["_value"];
  }
  return tokenDef.value ?? null;
}

export function getDefaultSizeKey(brands, brandId, tokenName) {
  const brand = brands[brandId];
  const defaultKey = `${tokenName}-default`;
  return brand.componentDefaults?.[defaultKey] ?? null;
}

export function getComponentDefaultSize(brands, brandId, componentName) {
  const brand = brands[brandId];
  const defaults = brand.componentDefaults || {};
  // Use the first matching default key for this component
  const prefix = `${componentName}-`;
  for (const [key, size] of Object.entries(defaults)) {
    if (key.startsWith(prefix)) return size;
  }
  return null;
}

function findTokenDef(tokenName) {
  for (const tokens of Object.values(COMPONENT_TOKENS)) {
    if (tokens[tokenName]) return tokens[tokenName];
  }
  return null;
}
