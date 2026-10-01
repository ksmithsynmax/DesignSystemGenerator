// Alpha primitive ramps
// ---------------------------------------------------------------------------
// An alpha primitive is a base swatch (e.g. neutral/5) given a fixed 0–9 ramp of
// opacity steps, so "opacity colors" can reference a real primitive token
// (e.g. "neutral-5-alpha/3") instead of emitting a hardcoded #RRGGBBAA literal.
// The alpha channel is baked into the value, so nothing renders differently —
// the color just becomes traceable.
//
// The set of alpha sources is DATA-DRIVEN per brand (`brand.alphaPrimitives`,
// an array of { color, index }). When a brand hasn't defined the field yet we
// fall back to DEFAULT_ALPHA_SOURCES (filtered to swatches that brand actually
// has). Designers add/remove sources via the UI; add a source here only to
// change the out-of-the-box defaults. Step index → opacity %:
import { GLOBAL_PRIMITIVES } from "../data/brands";

export const ALPHA_STEPS = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90];
export const ALPHA_STEP_INDEX = ALPHA_STEPS.reduce((acc, pct, i) => {
  acc[pct] = i;
  return acc;
}, {});

// Out-of-the-box defaults: brand accents at their main step + black/white
// neutral overlays. References resolve against the brand palette OR the globals.
export const DEFAULT_ALPHA_SOURCES = [
  { color: "blue", index: 5 },
  { color: "red", index: 5 },
  { color: "green", index: 5 },
  { color: "yellow", index: 5 },
  { color: "steel", index: 5 },
  { color: "neutral", index: 0 },
  { color: "neutral", index: 9 },
];

export const alphaFamilyName = (color, index) => `${color}-${index}-alpha`;

const ALPHA_FAMILY_RE = /-\d+-alpha$/;
export const isAlphaFamily = (name) =>
  typeof name === "string" && ALPHA_FAMILY_RE.test(name);

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

// Bake an opacity % into a hex as an 8-digit #RRGGBBAA (alpha preserved).
function applyAlpha(hex, pct) {
  if (hex === "transparent") return "transparent";
  const normalized = normalizeHex(hex);
  if (!normalized) return hex;
  const clamped = Math.min(100, Math.max(0, Number(pct) || 0));
  const alpha = Math.round((clamped / 100) * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
  return `#${normalized}${alpha}`;
}

// Resolve a base swatch hex against the brand palette, then the globals.
export function resolveBaseHex(brand, color, index) {
  return (
    brand?.primitives?.[color]?.[index] ??
    GLOBAL_PRIMITIVES[color]?.[index] ??
    null
  );
}

// Build a 0–9 alpha ramp (array of #RRGGBBAA) from a base hex.
export function buildAlphaRamp(baseHex) {
  return ALPHA_STEPS.map((pct) => applyAlpha(baseHex, pct));
}

// The alpha sources for a brand: its own list if valid, else the defaults
// filtered to swatches this brand can actually resolve.
export function getAlphaSources(brand) {
  const list = brand?.alphaPrimitives;
  if (Array.isArray(list)) {
    return list.filter(
      (s) =>
        s &&
        typeof s.color === "string" &&
        Number.isFinite(Number(s.index)) &&
        resolveBaseHex(brand, s.color, Number(s.index)) != null
    );
  }
  return DEFAULT_ALPHA_SOURCES.filter(
    (s) => resolveBaseHex(brand, s.color, s.index) != null
  );
}

// { familyName: [10 hexes] } for every resolvable alpha source of a brand.
export function getAlphaPrimitives(brand) {
  const families = {};
  getAlphaSources(brand).forEach(({ color, index }) => {
    const idx = Number(index);
    const baseHex = resolveBaseHex(brand, color, idx);
    if (!baseHex) return;
    families[alphaFamilyName(color, idx)] = buildAlphaRamp(baseHex);
  });
  return families;
}

// Look up an alpha family's hex ramp for a brand.
export function getAlphaFamilyRamp(brand, familyName) {
  return getAlphaPrimitives(brand)[familyName] || null;
}

// Return the alpha-primitive alias (e.g. "green-5-alpha/2") for a base
// color/index at the given opacity, or null when no source/step matches. Used
// by the (chart-only) opacity→alpha matching path.
export function resolveAlphaAlias(brand, color, index, opacity) {
  const stepIndex = ALPHA_STEP_INDEX[opacity];
  if (stepIndex === undefined) return null;
  const hasSource = getAlphaSources(brand).some(
    (s) => s.color === color && Number(s.index) === Number(index)
  );
  if (!hasSource) return null;
  return `${alphaFamilyName(color, index)}/${stepIndex}`;
}

// Ordered alpha family names for the color pickers.
export function alphaFamilyNames(brand) {
  return Object.keys(getAlphaPrimitives(brand));
}
