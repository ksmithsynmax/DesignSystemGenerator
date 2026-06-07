import { COMPONENT_TOKENS, COMPONENT_SIZE_KEYS, TOKEN_TYPES, getComponentDisplayName } from "../data/componentTokens";
import { gradientCssFromDef, gradientFirstStopHex } from "./resolveGradient";
import { summarizePalette } from "./resolveToken";

// Reads a scalar semantic map entry that may be a bare value or a { value } object.
function scalarValue(def) {
  if (def && typeof def === "object") return def.value;
  return def;
}

// Appends a brand's Foundations tables: a light/main/dark color summary plus the
// radius and spacing scales. All read-only over existing brand data.
function pushBrandFoundations(lines, brand) {
  const primitives = brand.primitives || {};
  if (Object.keys(primitives).length > 0) {
    lines.push("#### Color Summary (Light / Main / Dark)");
    lines.push("");
    lines.push("Representative stops from each ramp above. The full ramp remains the source of truth.");
    lines.push("");
    lines.push("| Palette | Light | Main | Dark |");
    lines.push("|---------|-------|------|------|");
    Object.entries(primitives).forEach(([name, ramp]) => {
      const s = summarizePalette(ramp);
      if (!s) return;
      lines.push(
        `| ${name} | \`${s.light.hex}\` (${s.light.index}) | \`${s.main.hex}\` (${s.main.index}) | \`${s.dark.hex}\` (${s.dark.index}) |`
      );
    });
    lines.push("");
  }

  const radiusMap = brand.semanticRadiusMap || {};
  if (Object.keys(radiusMap).length > 0) {
    lines.push("#### Radius");
    lines.push("");
    lines.push("| Token | Value |");
    lines.push("|-------|-------|");
    Object.entries(radiusMap).forEach(([key, def]) => {
      lines.push(`| ${key} | ${scalarValue(def)} |`);
    });
    lines.push("");
  }

  const spacingMap = brand.semanticSpacingMap || {};
  if (Object.keys(spacingMap).length > 0) {
    lines.push("#### Spacing");
    lines.push("");
    lines.push("| Token | Value |");
    lines.push("|-------|-------|");
    Object.entries(spacingMap).forEach(([key, def]) => {
      lines.push(`| ${key} | ${scalarValue(def)} |`);
    });
    lines.push("");
  }

  // Typography intentionally omitted from Foundations — the Text and Title
  // components own the type scale.
}

// Figma can't store a gradient in a variable, so a gradient-backed token has two
// faces in Figma: a solid fallback variable + a paint style. Mirror the plugin's
// paint-style name so devs/designers can cross-reference.
function gradientPaintStyleName(brandId, gradientId) {
  const cap = brandId.charAt(0).toUpperCase() + brandId.slice(1);
  const safeId = String(gradientId).replace(/\//g, "-");
  return `Gradient / ${cap} / ${safeId}`;
}

// Finds every token that maps to each gradient id, across the brand's mapping
// layers, so the export shows which tokens actually render the gradient.
function gradientUsage(brand) {
  const usage = {};
  const scan = (map, themeLabel) => {
    if (!map || typeof map !== "object") return;
    Object.entries(map).forEach(([token, mapping]) => {
      const gid = mapping && mapping.gradient ? String(mapping.gradient).trim() : "";
      if (!gid) return;
      if (!usage[gid]) usage[gid] = [];
      usage[gid].push(themeLabel ? `${token} (${themeLabel})` : token);
    });
  };
  scan(brand.semanticMap, null);
  scan(brand.darkSemanticOverrides, "dark");
  scan(brand.componentOverrides, null);
  scan(brand.componentOverridesDark, "dark");
  return usage;
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

/**
 * Generates a comprehensive markdown reference document
 * for the design system's tokens, brands, and components.
 */
export function buildMarkdownExport(brands, globalPrimitives) {
  const lines = [];

  lines.push("# Design System Token Reference");
  lines.push("");

  // ── Global Primitives ──
  lines.push("## Global Primitives");
  lines.push("");
  lines.push("Shared across all brands. Single mode (no brand switching).");
  lines.push("");
  lines.push("| Palette | Index | Hex |");
  lines.push("|---------|-------|-----|");
  Object.entries(globalPrimitives).forEach(([palette, values]) => {
    values.forEach((hex, i) => {
      lines.push(`| ${palette} | ${i} | \`${hex}\` |`);
    });
  });
  lines.push("");

  // ── Brands ──
  lines.push("## Brands");
  lines.push("");

  Object.entries(brands).forEach(([brandId, brand]) => {
    lines.push(`### ${brand.name} (\`${brandId}\`)`);
    lines.push("");

    // Brand Primitives
    lines.push("#### Brand Primitives");
    lines.push("");
    lines.push("| Palette | Index | Hex |");
    lines.push("|---------|-------|-----|");
    Object.entries(brand.primitives).forEach(([palette, values]) => {
      values.forEach((hex, i) => {
        lines.push(`| ${palette} | ${i} | \`${hex}\` |`);
      });
    });
    lines.push("");

    // Foundations: color summary + radius / spacing scales
    pushBrandFoundations(lines, brand);

    // Semantic Tokens (Light)
    lines.push("#### Semantic Tokens (Light)");
    lines.push("");
    lines.push("| Token | Alias | Resolved Hex |");
    lines.push("|-------|-------|-------------|");
    Object.entries(brand.semanticMap).forEach(([key, mapping]) => {
      const isTransparent = mapping.color === "transparent";
      const baseHex = isTransparent
        ? "transparent"
        : brand.primitives[mapping.color]?.[mapping.index]
          ?? globalPrimitives[mapping.color]?.[mapping.index]
          ?? "—";
      const opacity = normalizeOpacity(mapping.opacity);
      const alias = isTransparent
        ? "transparent"
        : `${mapping.color}/${mapping.index}${opacity !== 100 ? ` @ ${opacity}%` : ""}`;
      const hex = baseHex === "—" ? "—" : applyOpacity(baseHex, opacity);
      lines.push(`| ${key} | \`${alias}\` | \`${hex}\` |`);
    });
    lines.push("");

    // Dark Semantic Overrides
    if (brand.darkSemanticOverrides && Object.keys(brand.darkSemanticOverrides).length > 0) {
      lines.push("#### Semantic Tokens (Dark Overrides)");
      lines.push("");
      lines.push("These override the light values above when in dark mode.");
      lines.push("");
      lines.push("| Token | Alias | Resolved Hex |");
      lines.push("|-------|-------|-------------|");
      Object.entries(brand.darkSemanticOverrides).forEach(([key, mapping]) => {
        const isTransparent = mapping.color === "transparent";
        const baseHex = isTransparent
          ? "transparent"
          : brand.primitives[mapping.color]?.[mapping.index]
            ?? globalPrimitives[mapping.color]?.[mapping.index]
            ?? "—";
        const opacity = normalizeOpacity(mapping.opacity);
        const alias = isTransparent
          ? "transparent"
          : `${mapping.color}/${mapping.index}${opacity !== 100 ? ` @ ${opacity}%` : ""}`;
        const hex = baseHex === "—" ? "—" : applyOpacity(baseHex, opacity);
        lines.push(`| ${key} | \`${alias}\` | \`${hex}\` |`);
      });
      lines.push("");
    }

    // Gradients
    if (brand.gradients && Object.keys(brand.gradients).length > 0) {
      const usage = gradientUsage(brand);
      lines.push("#### Gradients");
      lines.push("");
      lines.push(
        "Figma variables cannot hold gradients. Each gradient is delivered as: a **CSS value** (copy this in code), a **solid fallback** (the Figma variable value = first stop), and a **Figma paint style** (the real gradient, applied to nodes)."
      );
      lines.push("");
      lines.push("| Gradient | Type | CSS (for code) | Solid fallback | Figma paint style |");
      lines.push("|----------|------|----------------|----------------|-------------------|");
      Object.entries(brand.gradients).forEach(([gid, def]) => {
        const css = gradientCssFromDef(brand, def) || "—";
        const fallback = gradientFirstStopHex(brand, gid) || "—";
        const styleName = gradientPaintStyleName(brandId, gid);
        lines.push(`| \`${gid}\` | ${def?.type || "linear"} | \`${css}\` | \`${fallback}\` | \`${styleName}\` |`);
      });
      lines.push("");

      const usedGradients = Object.keys(usage);
      if (usedGradients.length > 0) {
        lines.push("**Tokens using a gradient** (copy the CSS above for these tokens; the Figma variable resolves to the solid fallback):");
        lines.push("");
        lines.push("| Token | Gradient | CSS (for code) |");
        lines.push("|-------|----------|----------------|");
        usedGradients.forEach((gid) => {
          const css = gradientCssFromDef(brand, brand.gradients[gid]) || "—";
          usage[gid].forEach((token) => {
            lines.push(`| ${token} | \`${gid}\` | \`${css}\` |`);
          });
        });
        lines.push("");
      }
    }

    // Component Defaults
    if (brand.componentDefaults && Object.keys(brand.componentDefaults).length > 0) {
      lines.push("#### Component Defaults");
      lines.push("");
      lines.push("Brand-specific default size aliases. Tokens ending in `-default` resolve to these sizes.");
      lines.push("");
      lines.push("| Token | Default Size |");
      lines.push("|-------|-------------|");
      Object.entries(brand.componentDefaults).forEach(([key, size]) => {
        lines.push(`| ${key} | ${size} |`);
      });
      lines.push("");
    }
  });

  // ── Components ──
  lines.push("## Components");
  lines.push("");

  Object.entries(COMPONENT_TOKENS).forEach(([compName, tokens]) => {
    const sizeKeys = COMPONENT_SIZE_KEYS[compName] || [];
    lines.push(`### ${getComponentDisplayName(compName)}`);
    lines.push("");
    lines.push(`Size variants: ${sizeKeys.join(", ") || "none"}`);
    lines.push("");

    // Color Tokens
    const colorTokens = Object.entries(tokens).filter(([, def]) => def.type === TOKEN_TYPES.COLOR);
    if (colorTokens.length > 0) {
      lines.push("#### Color Tokens");
      lines.push("");
      lines.push("| Token | Semantic Alias | Figma Path |");
      lines.push("|-------|---------------|------------|");
      colorTokens.forEach(([name, def]) => {
        const alias = def.semantic || "_(none — raw value)_";
        lines.push(`| ${name} | ${alias} | \`${def.figmaPath}\` |`);
      });
      lines.push("");
    }

    // Dimension Tokens
    const dimTokens = Object.entries(tokens).filter(
      ([, def]) => def.type === TOKEN_TYPES.FLOAT || def.type === TOKEN_TYPES.STRING
    );
    if (dimTokens.length > 0) {
      lines.push("#### Dimension & Typography Tokens");
      lines.push("");

      // Size-variant tokens
      const sizedTokens = dimTokens.filter(([, def]) => def.sizes);
      if (sizedTokens.length > 0) {
        const sizeHeaders = sizeKeys.map((k) => k).join(" | ");
        lines.push(`| Token | Type | ${sizeHeaders} | Unit | Figma Path |`);
        lines.push(`|-------|------|${sizeKeys.map(() => "---").join("|")}|------|------------|`);
        sizedTokens.forEach(([name, def]) => {
          const vals = sizeKeys.map((k) => def.sizes[k] ?? "—").join(" | ");
          lines.push(`| ${name} | ${def.type} | ${vals} | ${def.unit || "—"} | \`${def.figmaPath}\` |`);
        });
        lines.push("");
      }

      // Single-value tokens
      const singleTokens = dimTokens.filter(([, def]) => !def.sizes);
      if (singleTokens.length > 0) {
        lines.push("| Token | Type | Value | Unit | Figma Path |");
        lines.push("|-------|------|-------|------|------------|");
        singleTokens.forEach(([name, def]) => {
          const val = def.value ?? "—";
          lines.push(`| ${name} | ${def.type} | ${val} | ${def.unit || "—"} | \`${def.figmaPath}\` |`);
        });
        lines.push("");
      }
    }
  });

  return lines.join("\n");
}
