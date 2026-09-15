function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: l * 100 };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (v) =>
    Math.round(Math.min(255, Math.max(0, v * 255)))
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Lightness of the two extreme stops the ramp reaches toward.
const L_LIGHT = 97; // stop 0 target when the base isn't already near-white
const L_DARK = 12; // stop 9 target when the base isn't already near-black

export function generateScale(baseHex) {
  const base = hexToHsl(baseHex);
  const normalizedBase = baseHex.toUpperCase();

  // Place the base color at the stop whose lightness matches it, so the exact
  // input color is always included in the scale. Everything lighter ramps up to
  // near-white, everything darker ramps down to near-black — keeping a smooth,
  // visibly distinct progression regardless of how dark or light the base is.
  const clampedL = Math.max(L_DARK, Math.min(L_LIGHT, base.l));
  const position = (L_LIGHT - clampedL) / (L_LIGHT - L_DARK); // 0 = lightest .. 1 = darkest
  const anchor = Math.max(0, Math.min(9, Math.round(position * 9)));

  const scale = [];
  for (let i = 0; i < 10; i++) {
    // Anchor stop is the exact base color the user entered.
    if (i === anchor) {
      scale.push(normalizedBase);
      continue;
    }

    let l;
    if (i < anchor) {
      // Lighter side: ramp from near-white down to the base lightness.
      l = lerp(L_LIGHT, base.l, i / anchor);
    } else {
      // Darker side: ramp from the base lightness down to near-black.
      l = lerp(base.l, L_DARK, (i - anchor) / (9 - anchor));
    }

    // Keep saturation close to the base, tapering gently toward the extremes.
    const span = Math.max(anchor, 9 - anchor, 1);
    const distFromAnchor = Math.abs(i - anchor) / span;
    const s = Math.max(0, base.s * (1 - distFromAnchor * 0.15));

    scale.push(hslToHex(base.h, s, l));
  }

  return scale;
}

export function isValidHex(value) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function isValidScaleJson(text) {
  try {
    const arr = JSON.parse(text);
    return Array.isArray(arr) && arr.length === 10 && arr.every(isValidHex);
  } catch {
    return false;
  }
}
