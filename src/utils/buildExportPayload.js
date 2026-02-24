import { COMPONENT_TOKENS, COMPONENT_SIZE_KEYS, TOKEN_TYPES } from "../data/componentTokens";
import { resolveColor, resolveDimension, getDefaultSizeKey } from "./resolveToken";
import { GLOBAL_PRIMITIVES } from "../data/brands";

/**
 * Builds the fully-resolved token payload for all brands.
 * Returns a plain object (not serialized).
 */
export function buildExportPayload(brands) {
  const out = { globalPrimitives: GLOBAL_PRIMITIVES };

  // Helper: resolve a semantic map into { key: { type, value, alias } }
  const resolveSemanticMap = (brand, map) => {
    const resolved = {};
    Object.entries(map).forEach(([key, mapping]) => {
      const value = brand.primitives[mapping.color]?.[mapping.index]
        ?? GLOBAL_PRIMITIVES[mapping.color]?.[mapping.index]
        ?? null;
      resolved[key] = {
        type: "COLOR",
        value,
        alias: `${mapping.color}/${mapping.index}`,
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
          const hex = resolveColor(brands, brandId, def.semantic);
          out[brandId].components[def.figmaPath] = {
            type: "COLOR",
            value: hex,
            alias: def.semantic || null,
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
