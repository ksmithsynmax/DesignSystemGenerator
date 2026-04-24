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

function usableHexOrTransparent(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return false;
    if (t.toLowerCase() === "transparent") return true;
    return /^#?[0-9A-Fa-f]{3,8}$/.test(t);
  }
  return false;
}

/**
 * Resolve a palette name + step to a hex (or "transparent").
 * Brand scale wins when that index has a real value; otherwise uses global scale so
 * empty string / holes in brand arrays do not block globals (avoids accidental #FF00FF).
 */
export function resolvePrimitiveHex(brand, colorName, index) {
  if (!colorName || colorName === "transparent") return "transparent";
  const idx = Number.isFinite(Number(index)) ? Math.min(9, Math.max(0, Math.round(Number(index)))) : 0;
  const brandPalette = brand?.primitives?.[colorName];
  const fromBrand = Array.isArray(brandPalette) ? brandPalette[idx] : undefined;
  const globalPalette = GLOBAL_PRIMITIVES[colorName];
  const fromGlobal = Array.isArray(globalPalette) ? globalPalette[idx] : undefined;

  const raw = usableHexOrTransparent(fromBrand) ? fromBrand : fromGlobal;
  if (usableHexOrTransparent(raw)) {
    return typeof raw === "string" && raw.trim().toLowerCase() === "transparent"
      ? "transparent"
      : String(raw).trim();
  }
  return "#FF00FF";
}

/** First stop color (with opacity) for swatches / export when a token uses a named gradient. */
export function gradientFirstStopHex(brand, gradientId) {
  const def = brand?.gradients?.[gradientId];
  if (!def?.stops?.length) return null;
  const sorted = [...def.stops].sort(
    (a, b) => (Number(a.position) || 0) - (Number(b.position) || 0)
  );
  const first = sorted[0];
  if (!first) return null;
  const hex = resolvePrimitiveHex(brand, first.color, first.index);
  return applyOpacity(hex, first.opacity);
}

/**
 * Build CSS gradient string from a definition object (not required to live on `brand.gradients`).
 * Uses current `brand` primitives/globals so previews update when palette swatches change.
 */
export function gradientCssFromDef(brand, def) {
  if (!def || !Array.isArray(def.stops) || def.stops.length < 2) return null;

  const type = def.type === "radial" ? "radial" : "linear";
  const angle = Number.isFinite(Number(def.angle)) ? Number(def.angle) : 90;
  const sorted = [...def.stops].sort(
    (a, b) => (Number(a.position) || 0) - (Number(b.position) || 0)
  );

  const parts = [];
  for (const stop of sorted) {
    const hex = resolvePrimitiveHex(brand, stop.color, stop.index);
    const withAlpha = applyOpacity(hex, stop.opacity);
    const pos = Math.min(100, Math.max(0, Math.round(Number(stop.position) || 0)));
    parts.push(`${withAlpha} ${pos}%`);
  }

  if (parts.length < 2) return null;
  if (type === "radial") {
    return `radial-gradient(circle at center, ${parts.join(", ")})`;
  }
  return `linear-gradient(${angle}deg, ${parts.join(", ")})`;
}

/**
 * Build CSS from `brand.gradients[id]` (same rules as {@link gradientCssFromDef}).
 */
export function resolveGradientCss(brand, gradientId) {
  if (!brand?.gradients || typeof brand.gradients !== "object") return null;
  const def = brand.gradients[gradientId];
  return gradientCssFromDef(brand, def);
}

/** Parse #RGB / #RRGGBB / #RRGGBBAA into Figma-style RGBA (0–1). */
function hexToFigmaRgba(hex) {
  if (!hex || typeof hex !== "string") return { r: 0, g: 0, b: 0, a: 0 };
  const t = hex.trim();
  if (t.toLowerCase() === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  const c = t.startsWith("#") ? t.slice(1) : t;
  if (c.length === 3) {
    const r = parseInt(c[0] + c[0], 16) / 255;
    const g = parseInt(c[1] + c[1], 16) / 255;
    const b = parseInt(c[2] + c[2], 16) / 255;
    return { r, g, b, a: 1 };
  }
  if (c.length === 6) {
    return {
      r: parseInt(c.slice(0, 2), 16) / 255,
      g: parseInt(c.slice(2, 4), 16) / 255,
      b: parseInt(c.slice(4, 6), 16) / 255,
      a: 1,
    };
  }
  if (c.length === 8) {
    return {
      r: parseInt(c.slice(0, 2), 16) / 255,
      g: parseInt(c.slice(2, 4), 16) / 255,
      b: parseInt(c.slice(4, 6), 16) / 255,
      a: parseInt(c.slice(6, 8), 16) / 255,
    };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

/**
 * Serializable gradient for the Figma plugin (multi-stop fills).
 * `kind` + `angleDeg` match {@link gradientCssFromDef} / CSS linear-gradient angles.
 */
export function gradientFigmaExport(brand, gradientId) {
  const def = brand?.gradients?.[gradientId];
  if (!def || !Array.isArray(def.stops) || def.stops.length < 2) return null;

  const sorted = [...def.stops].sort(
    (a, b) => (Number(a.position) || 0) - (Number(b.position) || 0)
  );
  const stops = [];
  for (const stop of sorted) {
    const hx = resolvePrimitiveHex(brand, stop.color, stop.index);
    const withAlpha = applyOpacity(hx, stop.opacity);
    const rgba = hexToFigmaRgba(withAlpha);
    const pos = Math.min(1, Math.max(0, (Number(stop.position) || 0) / 100));
    stops.push({ position: pos, r: rgba.r, g: rgba.g, b: rgba.b, a: rgba.a });
  }
  if (stops.length < 2) return null;

  const kind = def.type === "radial" ? "radial" : "linear";
  const angleDeg = Number.isFinite(Number(def.angle)) ? Number(def.angle) : 90;
  return { kind, angleDeg, stops };
}
