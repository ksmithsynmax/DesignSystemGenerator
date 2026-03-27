import { COMPONENT_TOKENS, COMPONENT_SIZE_KEYS, TOKEN_TYPES } from "../data/componentTokens";
import { resolveColor, resolveDimension, getDefaultSizeKey } from "./resolveToken";
import { GLOBAL_PRIMITIVES, GLOBAL_SPACING, GLOBAL_FONTS, GLOBAL_WEIGHTS, GLOBAL_BORDER_WIDTHS } from "../data/brands";

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
 * Builds the fully-resolved token payload for all brands.
 * Returns a plain object (not serialized).
 */
export function buildExportPayload(brands, options) {
  const out = { 
    globalPrimitives: GLOBAL_PRIMITIVES, 
    globalSpacing: GLOBAL_SPACING,
    globalFonts: GLOBAL_FONTS,
    globalWeights: GLOBAL_WEIGHTS,
    globalBorderWidths: GLOBAL_BORDER_WIDTHS
  };
  if (options && Array.isArray(options.componentsToBuild)) {
    out.__buildOptions = {
      componentsToBuild: options.componentsToBuild,
    };
  }

  // Helper: resolve a semantic map into { key: { type, value, alias } }
  const resolveSemanticMap = (brand, map) => {
    const resolved = {};
    Object.entries(map).forEach(([key, mapping]) => {
      const baseValue = brand.primitives[mapping.color]?.[mapping.index]
          ?? GLOBAL_PRIMITIVES[mapping.color]?.[mapping.index]
          ?? null;
      const opacity = normalizeOpacity(mapping.opacity);
      const value = baseValue ? applyOpacity(baseValue, opacity) : null;
      const alias = mapping.color === "transparent" 
        ? "transparent" 
        : `${mapping.color}/${mapping.index}${opacity !== 100 ? ` @ ${opacity}%` : ""}`;
      resolved[key] = {
        type: "COLOR",
        value,
        alias,
      };
    });
    return resolved;
  };

  Object.entries(brands).forEach(([brandId, brand]) => {
    // Build light semantic (base semanticMap)
    const lightSemantic = resolveSemanticMap(brand, brand.semanticMap);

    // Build dark semantic (base merged with darkSemanticOverrides)
    const darkMap = { ...brand.semanticMap, ...(brand.darkSemanticOverrides || {}) };
    const darkSemantic = resolveSemanticMap(brand, darkMap);

    out[brandId] = {
      primitives: brand.primitives,
      semantic: { light: lightSemantic, dark: darkSemantic },
      components: {},
    };

    // Resolve component tokens using Figma folder hierarchy
    Object.entries(COMPONENT_TOKENS).forEach(([compName, tokens]) => {
      const sizeKeys = COMPONENT_SIZE_KEYS[compName] || [];

      Object.entries(tokens).forEach(([tokenName, def]) => {
        if (def.type === TOKEN_TYPES.COLOR) {
          const hex = resolveColor(brands, brandId, def.semantic, "light", tokenName);
          const hasComponentOverride = !!brand.componentOverrides?.[tokenName];
          out[brandId].components[def.figmaPath] = {
            type: "COLOR",
            value: hex,
            alias: hasComponentOverride ? null : (def.semantic || null),
          };
        } else if (def.type === TOKEN_TYPES.FLOAT) {
          const resolveFloatAlias = (val) => {
            if (def.figmaPath.includes("border-width") || def.figmaPath.includes("stroke-width")) {
              return GLOBAL_BORDER_WIDTHS.includes(Number(val)) ? `border-width/${String(val).replace('.', '_')}` : null;
            }
            return GLOBAL_SPACING.includes(Number(val)) ? `spacing/${val}` : null;
          };

          if (def.sizes) {
            sizeKeys.forEach((size) => {
              const val = resolveDimension(brands, brandId, tokenName, size);
              out[brandId].components[`${def.figmaPath}-${size}`] = {
                type: "FLOAT",
                value: val,
                alias: resolveFloatAlias(val)
              };
            });
            const defaultSize = getDefaultSizeKey(brands, brandId, tokenName);
            if (defaultSize) {
              const defaultVal = resolveDimension(brands, brandId, tokenName, defaultSize);
              out[brandId].components[`${def.figmaPath}-default`] = {
                type: "FLOAT",
                value: defaultVal,
                aliasOf: `${def.figmaPath}-${defaultSize}`,
              };
            }
          } else {
            const val = resolveDimension(brands, brandId, tokenName);
            out[brandId].components[def.figmaPath] = {
              type: "FLOAT",
              value: val,
              alias: resolveFloatAlias(val)
            };
          }
        } else if (def.type === TOKEN_TYPES.STRING) {
          const val = resolveDimension(brands, brandId, tokenName);
          let alias = null;
          if (def.figmaPath.includes("font-family")) {
            const key = Object.keys(GLOBAL_FONTS).find(k => GLOBAL_FONTS[k] === val);
            if (key) alias = `font-family/${key}`;
          } else if (def.figmaPath.includes("font-weight")) {
            const key = Object.keys(GLOBAL_WEIGHTS).find(k => GLOBAL_WEIGHTS[k] === val);
            if (key) alias = `font-weight/${key}`;
          }
          
          out[brandId].components[def.figmaPath] = {
            type: "STRING",
            value: val,
            alias: alias
          };
        }
      });
    });
  });
  return out;
}
