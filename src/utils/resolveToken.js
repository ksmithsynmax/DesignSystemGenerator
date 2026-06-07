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

// A presentation-only summary of a 10-step palette ramp as light / main / dark.
// The full ramp stays the source of truth; this just picks three representative
// stops (clamped for shorter ramps) so docs/previews can show a clean trio.
export const PALETTE_SUMMARY_INDICES = { light: 2, main: 5, dark: 8 };

export function summarizePalette(ramp) {
  if (!Array.isArray(ramp) || ramp.length === 0) return null;
  const n = ramp.length;
  const at = (i) => ramp[Math.max(0, Math.min(n - 1, i))];
  return {
    light: { hex: at(PALETTE_SUMMARY_INDICES.light), index: Math.min(PALETTE_SUMMARY_INDICES.light, n - 1) },
    main: { hex: at(PALETTE_SUMMARY_INDICES.main), index: Math.min(PALETTE_SUMMARY_INDICES.main, n - 1) },
    dark: { hex: at(PALETTE_SUMMARY_INDICES.dark), index: Math.min(PALETTE_SUMMARY_INDICES.dark, n - 1) },
  };
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

// Chart series palette: resolved per-brand so we only ever use hues the brand
// actually defines (no #FF00FF "missing color" fallback). Ordered for visual
// distinctness; neutral is always available via GLOBAL_PRIMITIVES as a backstop.
const CHART_SERIES_HUE_ORDER = [
  "blue", "green", "orange", "purple", "cyan", "red",
  "yellow", "teal", "pink", "steel", "neutral", "indigo", "violet",
];

function brandHasColorFamily(brand, name) {
  const family = brand?.primitives?.[name] || GLOBAL_PRIMITIVES[name];
  return Array.isArray(family) && family.length > 5;
}

/** The hue used by this brand's interactive-primary (series-1), so we can avoid reusing it. */
function brandPrimaryHue(brand) {
  const mapping = brand?.semanticMap?.["interactive-primary"];
  return mapping && mapping.color ? mapping.color : null;
}

/**
 * Ordered hues for chart series 2..6 — only hues the brand defines, with the
 * primary hue (used by series-1) removed so no two series share a color.
 */
export function chartSeriesHues(brand) {
  const primary = brandPrimaryHue(brand);
  const hues = CHART_SERIES_HUE_ORDER.filter(
    (c) => brandHasColorFamily(brand, c) && c !== primary
  );
  return hues.length > 0 ? hues : ["neutral"];
}

/**
 * Resolve the default {color,index} mapping for a chart series number.
 * series-1 is driven by the interactive-primary semantic elsewhere; this covers 2..6.
 */
export function chartSeriesMapping(brand, seriesNum) {
  const hues = chartSeriesHues(brand);
  const slot = Math.max(0, (Number(seriesNum) || 2) - 2);
  const hue = hues[slot % hues.length];
  const wrap = Math.floor(slot / hues.length);
  const index = Math.min(9, 5 + wrap * 2);
  return { color: hue, index, opacity: 100 };
}

/** If the token is a chart-series-N color token, return its brand-aware mapping. */
export function chartSeriesMappingForToken(brand, tokenName) {
  const m = /^chart-series-(\d+)$/.exec(tokenName || "");
  if (!m) return null;
  return chartSeriesMapping(brand, parseInt(m[1], 10));
}

// "shades" color mode: a monochromatic ramp built from the series-1 hue. We
// spread the requested number of steps across a mid-range band of the family
// so adjacent shades stay distinct and readable (dark -> light).
const SHADE_INDEX_HI = 8;
const SHADE_INDEX_LO = 3;

function pickShadeIndices(count) {
  if (count <= 1) return [5];
  const step = (SHADE_INDEX_HI - SHADE_INDEX_LO) / (count - 1);
  return Array.from({ length: count }, (_, i) =>
    Math.round(SHADE_INDEX_HI - i * step)
  );
}

/** The primitive color family (e.g. "blue") that series-1 resolves to for a theme. */
export function chartSeriesBaseHue(brands, brandId, theme = "light") {
  const brand = brands?.[brandId];
  if (!brand) return "neutral";
  const override =
    theme === "dark"
      ? brand.componentOverridesDark?.["chart-series-1"]
      : brand.componentOverrides?.["chart-series-1"];
  if (override && override.color && override.color !== "transparent") {
    return override.color;
  }
  const map =
    theme === "dark"
      ? mergeDarkSemanticsForBrand(brand)
      : mergeLightSemanticsForBrand(brand);
  const m = map["interactive-primary"];
  if (m && m.color && m.color !== "transparent") return m.color;
  return "neutral";
}

/** N hex colors forming a shade ramp from the series-1 hue (dark -> light). */
export function chartShadeColors(brands, brandId, theme, count) {
  const brand = brands?.[brandId];
  const family = chartSeriesBaseHue(brands, brandId, theme);
  const ramp =
    brand?.primitives?.[family] || GLOBAL_PRIMITIVES[family] || GLOBAL_PRIMITIVES.neutral;
  const n = Math.max(1, Number(count) || 1);
  return pickShadeIndices(n).map((i) => {
    const idx = Math.max(0, Math.min(ramp.length - 1, i));
    return ramp[idx] || "#FF00FF";
  });
}

// Fixed default shade ramp (dark -> light) for chart-shade-1..6. These are only
// DEFAULTS — each chart-shade-N token is independently editable.
const CHART_SHADE_RAMP = pickShadeIndices(6); // [8, 7, 6, 5, 4, 3]

/** The base hue family used for shade-token defaults (brand primary, else a sensible fallback). */
function chartShadeBaseHue(brand) {
  const primary = brandPrimaryHue(brand);
  if (primary && brandHasColorFamily(brand, primary)) return primary;
  const hues = ["blue", "teal", "indigo", "neutral"].filter((c) =>
    brandHasColorFamily(brand, c)
  );
  return hues[0] || "neutral";
}

/** If the token is a chart-shade-N color token, return its default {color,index} mapping. */
export function chartShadeMappingForToken(brand, tokenName) {
  const m = /^chart-shade-(\d+)$/.exec(tokenName || "");
  if (!m) return null;
  const slot = Math.max(0, parseInt(m[1], 10) - 1);
  const family = chartShadeBaseHue(brand);
  const ramp = brand?.primitives?.[family] || GLOBAL_PRIMITIVES[family] || GLOBAL_PRIMITIVES.neutral;
  const index = Math.max(
    0,
    Math.min(ramp.length - 1, CHART_SHADE_RAMP[slot % CHART_SHADE_RAMP.length])
  );
  return { color: family, index, opacity: 100 };
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
  const seriesMapping = chartSeriesMappingForToken(brand, componentToken);
  if (seriesMapping) return mappingToHex(brand, seriesMapping);
  const shadeMapping = chartShadeMappingForToken(brand, componentToken);
  if (shadeMapping) return mappingToHex(brand, shadeMapping);
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
