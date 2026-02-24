import { COMPONENT_TOKENS, COMPONENT_SIZE_KEYS, TOKEN_TYPES } from "../data/componentTokens";

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

    // Semantic Tokens (Light)
    lines.push("#### Semantic Tokens (Light)");
    lines.push("");
    lines.push("| Token | Alias | Resolved Hex |");
    lines.push("|-------|-------|-------------|");
    Object.entries(brand.semanticMap).forEach(([key, mapping]) => {
      const hex = brand.primitives[mapping.color]?.[mapping.index]
        ?? globalPrimitives[mapping.color]?.[mapping.index]
        ?? "—";
      lines.push(`| ${key} | \`${mapping.color}/${mapping.index}\` | \`${hex}\` |`);
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
        const hex = brand.primitives[mapping.color]?.[mapping.index]
          ?? globalPrimitives[mapping.color]?.[mapping.index]
          ?? "—";
        lines.push(`| ${key} | \`${mapping.color}/${mapping.index}\` | \`${hex}\` |`);
      });
      lines.push("");
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
    lines.push(`### ${compName.charAt(0).toUpperCase() + compName.slice(1)}`);
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
