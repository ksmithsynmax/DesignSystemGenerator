import { COMPONENT_TOKENS, COMPONENT_SIZE_KEYS, TOKEN_TYPES } from "../data/componentTokens";
import { resolveColor, resolveDimension, getDefaultSizeKey } from "./resolveToken";
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

/**
 * Builds the fully-resolved token payload for all brands.
 * Returns a plain object (not serialized).
 */
export function buildExportPayload(brands, options) {
  const out = { globalPrimitives: GLOBAL_PRIMITIVES };
  if (options && Array.isArray(options.componentsToBuild)) {
    out.__buildOptions = {
      componentsToBuild: options.componentsToBuild,
    };
  }

  // Helper: resolve a semantic map into { key: { type, value, alias } }
  const resolveSemanticMap = (brand, map) => {
    const resolved = {};
    Object.entries(map).forEach(([key, mapping]) => {
      const isTransparent = mapping.color === "transparent";
      const baseValue = isTransparent
        ? "transparent"
        : brand.primitives[mapping.color]?.[mapping.index]
          ?? GLOBAL_PRIMITIVES[mapping.color]?.[mapping.index]
          ?? null;
      const opacity = normalizeOpacity(mapping.opacity);
      const value = baseValue ? applyOpacity(baseValue, opacity) : null;
      const alias = isTransparent
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
          if (def.sizes) {
            sizeKeys.forEach((size) => {
              const val = resolveDimension(brands, brandId, tokenName, size);
              out[brandId].components[`${def.figmaPath}-${size}`] = {
                type: "FLOAT",
                value: val,
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
            };
          }
        } else if (def.type === TOKEN_TYPES.STRING) {
          const val = resolveDimension(brands, brandId, tokenName);
          out[brandId].components[def.figmaPath] = {
            type: "STRING",
            value: val,
          };
        }
      });
    });
  });
  return out;
}
