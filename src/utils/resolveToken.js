import { COMPONENT_TOKENS, TOKEN_TYPES } from "../data/componentTokens";
import { GLOBAL_PRIMITIVES, BRAND_STARTER_SEMANTIC_MAP } from "../data/brands";
import { gradientFirstStopHex } from "./resolveGradient";

function isValidSemanticMapping(m) {
  return (
    m != null &&
    typeof m === "object" &&
    m.color != null &&
    Number.isFinite(Number(m.index))
  );
}

/** Starter semantics merged with brand.semanticMap (invalid user entries are ignored). */
export function mergeLightSemanticsForBrand(brand) {
  const merged = { ...BRAND_STARTER_SEMANTIC_MAP };
  for (const [k, v] of Object.entries(brand.semanticMap || {})) {
    if (isValidSemanticMapping(v)) merged[k] = v;
  }
  return merged;
}

/** Light semantics merged with valid darkSemanticOverrides (Figma + preview dark mode). */
export function mergeDarkSemanticsForBrand(brand) {
  const lightMerged = mergeLightSemanticsForBrand(brand);
  const darkOnly = {};
  for (const [k, v] of Object.entries(brand.darkSemanticOverrides || {})) {
    if (isValidSemanticMapping(v)) darkOnly[k] = v;
  }
  return { ...lightMerged, ...darkOnly };
}

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

// Curated avatar palette colors (only included if they exist in the brand/global palette).
export const AVATAR_PALETTE_COLORS = [
  "red",
  "green",
  "blue",
  "purple",
  "orange",
  "yellow",
  "pink",
  "cyan",
  "navy",
];
// Primitive scale step used for avatar fills.
export const AVATAR_COLOR_SHADE = 5;
// Luminance cutoff for choosing dark vs. light text (mirrors Mantine's autoContrast default).
const AVATAR_CONTRAST_THRESHOLD = 0.3;

function channelToLinear(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance for a hex color (returns 1 for invalid/transparent). */
export function relativeLuminance(hex) {
  const n = normalizeHex(hex);
  if (!n || n === "transparent") return 1;
  const r = channelToLinear(parseInt(n.slice(0, 2), 16));
  const g = channelToLinear(parseInt(n.slice(2, 4), 16));
  const b = channelToLinear(parseInt(n.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Returns the readable text color (white or near-black) for a given background hex. */
export function readableTextOn(hex) {
  return relativeLuminance(hex) >= AVATAR_CONTRAST_THRESHOLD ? "#000000" : "#FFFFFF";
}

/** Curated avatar colors that actually exist in the brand or global palette (with the needed shade). */
export function availableAvatarColors(brands, brandId) {
  const brand = brands?.[brandId];
  return AVATAR_PALETTE_COLORS.filter((name) => {
    const family = brand?.primitives?.[name] || GLOBAL_PRIMITIVES[name];
    return Array.isArray(family) && family.length > AVATAR_COLOR_SHADE;
  });
}

function mappingToHex(brand, mapping) {
  if (!mapping) return "#FF00FF";
  if (mapping.gradient && String(mapping.gradient).trim()) {
    const g = gradientFirstStopHex(brand, String(mapping.gradient).trim());
    return g || "#FF00FF";
  }
  if (mapping.color === "transparent") return "transparent";
  const base = brand.primitives[mapping.color]?.[mapping.index]
    ?? GLOBAL_PRIMITIVES[mapping.color]?.[mapping.index]
    ?? "#FF00FF";
  return applyOpacity(base, mapping.opacity);
}

/** Resolve a semantic-less component color token via its defaultMapping / autoContrastOf. */
function resolveComponentTokenDefault(brand, brands, brandId, componentToken, activeTheme) {
  const def = findTokenDef(componentToken);
  if (!def) return "transparent";
  if (def.defaultMapping) return mappingToHex(brand, def.defaultMapping);
  if (def.autoContrastOf) {
    const bgHex = resolveColor(brands, brandId, null, activeTheme, def.autoContrastOf);
    return readableTextOn(bgHex);
  }
  return "transparent";
}

export function resolveColor(brands, brandId, semanticKey, theme = "light", componentToken = null) {
  const brand = brands[brandId];
  if (!brand) return "transparent";
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
    return mappingToHex(brand, themedComponentOverride);
  }
  // Semantic-less component token (e.g. per-color avatar tokens) resolve from defaults.
  if (!semanticKey && componentToken) {
    return resolveComponentTokenDefault(brand, brands, brandId, componentToken, activeTheme);
  }
  if (!semanticKey) return "transparent";
  const map =
    activeTheme === "dark" ? mergeDarkSemanticsForBrand(brand) : mergeLightSemanticsForBrand(brand);
  const mapping = map[semanticKey];
  if (!mapping) return "#FF00FF";
  return mappingToHex(brand, mapping);
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
