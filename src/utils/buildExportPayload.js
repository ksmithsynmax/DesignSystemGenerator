import { COMPONENT_TOKENS, COMPONENT_SIZE_KEYS, TOKEN_TYPES } from "../data/componentTokens";
import { resolveDimension, getDefaultSizeKey } from "./resolveToken";
import {
  GLOBAL_PRIMITIVES,
  GLOBAL_SPACING,
  GLOBAL_FONTS,
  GLOBAL_WEIGHTS,
  GLOBAL_BORDER_WIDTHS,
  GLOBAL_FONT_SIZES,
  GLOBAL_LINE_HEIGHTS,
} from "../data/brands";

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

function resolveMappingToColor(brand, mapping) {
  if (!mapping) return { value: "#FF00FF", primitiveAlias: null };
  if (mapping.color === "transparent") return { value: "transparent", primitiveAlias: "transparent" };
  const baseValue = brand.primitives[mapping.color]?.[mapping.index]
    ?? GLOBAL_PRIMITIVES[mapping.color]?.[mapping.index]
    ?? null;
  const value = baseValue ? applyOpacity(baseValue, mapping.opacity) : "#FF00FF";
  const primitiveAlias = `${mapping.color}/${mapping.index}`;
  return { value, primitiveAlias };
}

function resolveMappingToSemanticToken(brand, mapping) {
  if (!mapping) {
    return { type: "COLOR", value: "#FF00FF", alias: null };
  }
  if (mapping.color === "transparent") {
    return { type: "COLOR", value: "transparent", alias: "transparent" };
  }
  const baseHex = brand.primitives[mapping.color]?.[mapping.index]
    ?? GLOBAL_PRIMITIVES[mapping.color]?.[mapping.index]
    ?? null;
  const opacity = normalizeOpacity(mapping.opacity);
  const value = baseHex ? applyOpacity(baseHex, opacity) : "#FF00FF";
  const alias = `${mapping.color}/${mapping.index}${opacity !== 100 ? ` @ ${opacity}%` : ""}`;
  return { type: "COLOR", value, alias };
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
    globalBorderWidths: GLOBAL_BORDER_WIDTHS,
    globalFontSizes: GLOBAL_FONT_SIZES,
    globalLineHeights: GLOBAL_LINE_HEIGHTS,
  };
  if (options && typeof options === "object" && Object.keys(options).length > 0) {
    out.__buildOptions = { ...options };
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
          const lightSemanticMapping = brand.semanticMap?.[def.semantic] || null;
          const darkSemanticMap = { ...brand.semanticMap, ...(brand.darkSemanticOverrides || {}) };
          const darkSemanticMapping = darkSemanticMap?.[def.semantic] || null;
          const lightOverride = brand.componentOverrides?.[tokenName] || null;
          const darkOverride = brand.componentOverridesDark?.[tokenName] || null;

          const lightResolved = lightOverride
            ? resolveMappingToColor(brand, lightOverride)
            : resolveMappingToColor(brand, lightSemanticMapping);
          const darkResolved = darkOverride
            ? resolveMappingToColor(brand, darkOverride)
            : resolveMappingToColor(brand, darkSemanticMapping);

          const lightHasSemantic = Boolean(def.semantic && lightSemanticMapping);
          const darkHasSemantic = Boolean(def.semantic && darkSemanticMapping);
          const lightOpacity = lightOverride ? normalizeOpacity(lightOverride.opacity) : 100;
          const darkOpacity = darkOverride ? normalizeOpacity(darkOverride.opacity) : 100;
          const needsBridge = (lightOverride && lightOpacity !== 100) || (darkOverride && darkOpacity !== 100);
          const bridgeSemanticKey = needsBridge ? `component/${tokenName}` : null;

          if (bridgeSemanticKey) {
            out[brandId].semantic.light[bridgeSemanticKey] = resolveMappingToSemanticToken(
              brand,
              lightOverride || lightSemanticMapping
            );
            out[brandId].semantic.dark[bridgeSemanticKey] = resolveMappingToSemanticToken(
              brand,
              darkOverride || darkSemanticMapping
            );
          }

          const lightAlias = bridgeSemanticKey
            ? bridgeSemanticKey
            : (!lightOverride && lightHasSemantic ? def.semantic : null);
          const darkAlias = bridgeSemanticKey
            ? bridgeSemanticKey
            : (!darkOverride && darkHasSemantic ? def.semantic : null);

          out[brandId].components[def.figmaPath] = {
            type: "COLOR",
            value: lightResolved.value,
            alias: lightAlias,
            primitiveAlias: lightResolved.primitiveAlias,
            light: {
              value: lightResolved.value,
              alias: lightAlias,
              primitiveAlias: lightResolved.primitiveAlias,
            },
            dark: {
              value: darkResolved.value,
              alias: darkAlias,
              primitiveAlias: darkResolved.primitiveAlias,
            },
          };
        } else if (def.type === TOKEN_TYPES.FLOAT) {
          const resolveFloatAlias = (val) => {
            const norm = String(val).replace(".", "_");
            if (
              def.figmaPath.includes("border-width") ||
              def.figmaPath.includes("stroke-width") ||
              def.figmaPath.includes("focus-ring-width")
            ) {
              return GLOBAL_BORDER_WIDTHS.includes(Number(val)) ? `border-width/${norm}` : null;
            }
            if (def.figmaPath.includes("font-size")) {
              return GLOBAL_FONT_SIZES.includes(Number(val)) ? `typography/font-size/${norm}` : null;
            }
            if (def.figmaPath.includes("line-height")) {
              return GLOBAL_LINE_HEIGHTS.includes(Number(val)) ? `typography/line-height/${norm}` : null;
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
            if (key) alias = `typography/font-family/${key}`;
          } else if (def.figmaPath.includes("font-weight")) {
            const key = Object.keys(GLOBAL_WEIGHTS).find(k => GLOBAL_WEIGHTS[k] === val);
            if (key) alias = `typography/font-weight/${key}`;
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
