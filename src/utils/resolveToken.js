import { COMPONENT_TOKENS, TOKEN_TYPES } from "../data/componentTokens";
import { GLOBAL_PRIMITIVES } from "../data/brands";

function normalizeOpacity(opacity) {
  const parsed = Number(opacity);
  if (!Number.isFinite(parsed)) return 100;
  return Math.min(100, Math.max(0, Math.round(parsed)));
}

function normalizeHex(hex) {
  if (typeof hex !== "string") return null;
  const trimmed = hex.trim();
  if (trimmed.toLowerCase() === "transparent") return "transparent";
  const raw = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  if (raw.length === 3) {
    return raw
      .split("")
      .map((c) => c + c)
      .join("")
      .toUpperCase();
  }
  if (raw.length === 8) return raw.slice(0, 6).toUpperCase();
  if (raw.length === 6) return raw.toUpperCase();
  return null;
}

function applyOpacity(hex, opacity) {
  if (hex === "transparent") return "transparent";
  const normalized = normalizeHex(hex);
  if (!normalized) return hex;
  const alpha = Math.round((normalizeOpacity(opacity) / 100) * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
  return `#${normalized}${alpha}`;
}

export function resolveColor(brands, brandId, semanticKey, theme = "light", componentToken = null) {
  if (!semanticKey) return "transparent";
  const brand = brands[brandId];
  const runtimeTheme =
    typeof window !== "undefined" && (window.__DSG_PREVIEW_THEME === "dark" || window.__DSG_PREVIEW_THEME === "light")
      ? window.__DSG_PREVIEW_THEME
      : null;
  const activeTheme = runtimeTheme || theme;
  // Check component-level override first (avoids bleeding shared semantics)
  const themedComponentOverride =
    activeTheme === "dark"
      ? brand.componentOverridesDark?.[componentToken]
      : brand.componentOverrides?.[componentToken];
  if (componentToken && themedComponentOverride) {
    const mapping = themedComponentOverride;
    if (mapping.color === "transparent") return "transparent";
    const baseColor = brand.primitives[mapping.color]?.[mapping.index]
      ?? GLOBAL_PRIMITIVES[mapping.color]?.[mapping.index]
      ?? "#FF00FF";
    return applyOpacity(baseColor, mapping.opacity);
  }
  // Merge dark overrides when theme is dark
  const map = activeTheme === "dark"
    ? { ...brand.semanticMap, ...(brand.darkSemanticOverrides || {}) }
    : brand.semanticMap;
  const mapping = map[semanticKey];
  if (!mapping) return "#FF00FF";
  if (mapping.color === "transparent") return "transparent";
  // Check brand primitives first, then global primitives
  const baseColor = brand.primitives[mapping.color]?.[mapping.index]
    ?? GLOBAL_PRIMITIVES[mapping.color]?.[mapping.index]
    ?? "#FF00FF";
  return applyOpacity(baseColor, mapping.opacity);
}

export function resolveDimension(brands, brandId, tokenName, size) {
  const brand = brands[brandId];
  const tokenDef = findTokenDef(tokenName);
  if (!tokenDef || (tokenDef.type !== TOKEN_TYPES.FLOAT && tokenDef.type !== TOKEN_TYPES.STRING)) return null;
  const hasExplicitDefaultSize = Boolean(tokenDef.sizes && Object.prototype.hasOwnProperty.call(tokenDef.sizes, "default"));
  const fallbackSizeKey = tokenDef.sizes ? getFallbackSizeKey(tokenDef.sizes) : null;
  const effectiveSize =
    tokenDef.sizes && size === "default"
      ? (getDefaultSizeKey(brands, brandId, tokenName) || (hasExplicitDefaultSize ? "default" : fallbackSizeKey))
      : size;

  // Check brand overrides first
  if (effectiveSize && brand.dimensionOverrides?.[tokenName]?.[effectiveSize] !== undefined) {
    return brand.dimensionOverrides[tokenName][effectiveSize];
  }

  // Size-variant token
  if (tokenDef.sizes && effectiveSize) {
    return tokenDef.sizes[effectiveSize] ?? null;
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

function getFallbackSizeKey(sizes) {
  if (!sizes || typeof sizes !== "object") return null;
  if (Object.prototype.hasOwnProperty.call(sizes, "sm")) return "sm";
  if (Object.prototype.hasOwnProperty.call(sizes, "md")) return "md";
  const keys = Object.keys(sizes).filter((key) => key !== "default");
  if (keys.length > 0) return keys[0];
  if (Object.prototype.hasOwnProperty.call(sizes, "default")) return "default";
  return null;
}
