import { COMPONENT_TOKENS, COMPONENT_SIZE_KEYS, TOKEN_TYPES } from "../data/componentTokens";
import { resolveDimension, getDefaultSizeKey, mergeLightSemanticsForBrand, mergeDarkSemanticsForBrand } from "./resolveToken";
import { gradientCssFromDef, gradientFirstStopHex, gradientFigmaExport } from "./resolveGradient";
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
  if (!mapping) return { value: "#FF00FF", primitiveAlias: null, gradientSpec: null };
  if (mapping.gradient && String(mapping.gradient).trim()) {
    const gid = String(mapping.gradient).trim();
    const def = brand.gradients?.[gid];
    const css = def ? gradientCssFromDef(brand, def) : null;
    const firstHex = gradientFirstStopHex(brand, gid);
    const gradientSpec = css ? gradientFigmaExport(brand, gid) : null;
    return {
      value: firstHex || "#FF00FF",
      primitiveAlias: css ? `gradient/${gid}` : null,
      gradientSpec,
    };
  }
  if (mapping.color === "transparent") return { value: "transparent", primitiveAlias: "transparent", gradientSpec: null };
  const baseValue = brand.primitives[mapping.color]?.[mapping.index]
    ?? GLOBAL_PRIMITIVES[mapping.color]?.[mapping.index]
    ?? null;
  const opacity = normalizeOpacity(mapping.opacity);
  const value = baseValue ? applyOpacity(baseValue, opacity) : "#FF00FF";
  // Opacity colors must stay raw to preserve alpha channel in Figma.
  const primitiveAlias = opacity === 100 ? `${mapping.color}/${mapping.index}` : null;
  return { value, primitiveAlias, gradientSpec: null };
}

/**
 * Builds the fully-resolved token payload for all brands.
 * Returns a plain object (not serialized).
 */
export function buildExportPayload(brands, options) {
  const GLOBAL_RADII = [
    { name: "none", value: 0 },
    { name: "2", value: 2 },
    { name: "4", value: 4 },
    { name: "6", value: 6 },
    { name: "8", value: 8 },
    { name: "12", value: 12 },
    { name: "16", value: 16 },
    { name: "24", value: 24 },
  ];

  const out = { 
    globalPrimitives: GLOBAL_PRIMITIVES, 
    globalSpacing: GLOBAL_SPACING,
    globalRadii: GLOBAL_RADII,
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

  const resolveSemanticRadiusMap = (map) => {
    const resolved = {};
    Object.entries(map || {}).forEach(([key, def]) => {
      const value = Number(def?.value);
      if (!Number.isFinite(value)) return;
      const radiusAlias = value === 0 ? "radius/none" : `radius/${value}`;
      const hasAlias = GLOBAL_RADII.some((entry) => entry.name === (value === 0 ? "none" : String(value)));
      resolved[key] = {
        type: "FLOAT",
        value,
        alias: hasAlias ? radiusAlias : null,
      };
    });
    return resolved;
  };

  const resolveSemanticSpacingMap = (map) => {
    const resolved = {};
    Object.entries(map || {}).forEach(([key, def]) => {
      const value = Number(def?.value);
      if (!Number.isFinite(value)) return;
      resolved[key] = {
        type: "FLOAT",
        value,
        alias: GLOBAL_SPACING.includes(value) ? `spacing/${value}` : null,
      };
    });
    return resolved;
  };

  const resolveSemanticTypographyMap = (map) => {
    const resolved = {};
    Object.entries(map || {}).forEach(([key, def]) => {
      const value = def?.value;
      if (typeof value === "number" && Number.isFinite(value)) {
        const norm = String(value).replace(".", "_");
        resolved[key] = {
          type: "FLOAT",
          value,
          alias: GLOBAL_FONT_SIZES.includes(value) ? `font-size-${norm}` : null,
        };
        return;
      }
      if (typeof value === "string") {
        const fontKey = Object.keys(GLOBAL_FONTS).find((k) => GLOBAL_FONTS[k] === value);
        resolved[key] = {
          type: "STRING",
          value,
          alias: fontKey ? `typography/font-family/${fontKey}` : null,
        };
      }
    });
    return resolved;
  };

  const inferDefaultSizeKey = (tokenSizeKeys, componentSizeKeys) => {
    const merged = [
      ...(componentSizeKeys || []),
      ...((tokenSizeKeys || []).filter((k) => !(componentSizeKeys || []).includes(k))),
    ].filter((k) => k !== "default");
    if (merged.includes("sm")) return "sm";
    if (merged.includes("md")) return "md";
    return merged[0] || null;
  };

  Object.entries(brands).forEach(([brandId, brand]) => {
    const lightMerged = mergeLightSemanticsForBrand(brand);
    const darkMerged = mergeDarkSemanticsForBrand(brand);
    const lightSemantic = resolveSemanticMap(brand, lightMerged);
    const darkSemantic = resolveSemanticMap(brand, darkMerged);

    out[brandId] = {
      primitives: brand.primitives,
      semantic: { light: lightSemantic, dark: darkSemantic },
      semanticRadius: {
        light: resolveSemanticRadiusMap(brand.semanticRadiusMap),
        dark: resolveSemanticRadiusMap(brand.semanticRadiusMap),
      },
      semanticSpacing: {
        light: resolveSemanticSpacingMap(brand.semanticSpacingMap),
        dark: resolveSemanticSpacingMap(brand.semanticSpacingMap),
      },
      semanticTypography: {
        light: resolveSemanticTypographyMap(brand.semanticTypographyMap),
        dark: resolveSemanticTypographyMap(brand.semanticTypographyMap),
      },
      components: {},
    };

    // Resolve component tokens using Figma folder hierarchy
    Object.entries(COMPONENT_TOKENS).forEach(([compName, tokens]) => {
      const sizeKeys = COMPONENT_SIZE_KEYS[compName] || [];

      Object.entries(tokens).forEach(([tokenName, def]) => {
        if (def.type === TOKEN_TYPES.COLOR) {
          const lightSemanticMapping = def.semantic ? lightMerged[def.semantic] || null : null;
          const darkSemanticMapping = def.semantic ? darkMerged[def.semantic] || null : null;
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
          // Keep semantic collection limited to actual semantic tokens.
          // If component semantic mapping is missing (or overridden),
          // component sync falls back to primitiveAlias downstream.
          const lightAlias = !lightOverride && lightHasSemantic ? def.semantic : null;
          const darkAlias = !darkOverride && darkHasSemantic ? def.semantic : null;

          out[brandId].components[def.figmaPath] = {
            type: "COLOR",
            value: lightResolved.value,
            alias: lightAlias,
            primitiveAlias: lightResolved.primitiveAlias,
            light: {
              value: lightResolved.value,
              alias: lightAlias,
              primitiveAlias: lightResolved.primitiveAlias,
              gradientSpec: lightResolved.gradientSpec || null,
            },
            dark: {
              value: darkResolved.value,
              alias: darkAlias,
              primitiveAlias: darkResolved.primitiveAlias,
              gradientSpec: darkResolved.gradientSpec || null,
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
              return GLOBAL_FONT_SIZES.includes(Number(val)) ? `font-size-${norm}` : null;
            }
            if (def.figmaPath.includes("line-height")) {
              return GLOBAL_LINE_HEIGHTS.includes(Number(val)) ? `typography/line-height/${norm}` : null;
            }
            return GLOBAL_SPACING.includes(Number(val)) ? `spacing/${val}` : null;
          };
          const resolveSizedFloatValue = (sizeKey) => {
            if (sizeKey === "default" && Object.prototype.hasOwnProperty.call(def.sizes || {}, "default")) {
              const explicitDefaultOverride = brand.dimensionOverrides?.[tokenName]?.default;
              if (explicitDefaultOverride !== undefined) return explicitDefaultOverride;
              return def.sizes.default;
            }
            return resolveDimension(brands, brandId, tokenName, sizeKey);
          };

          if (def.sizes) {
            const tokenSizeKeys = Object.keys(def.sizes || {});
            const orderedSizeKeys = [
              ...sizeKeys,
              ...tokenSizeKeys.filter((k) => !sizeKeys.includes(k)),
            ];
            orderedSizeKeys.forEach((size) => {
              const val = resolveSizedFloatValue(size);
              out[brandId].components[`${def.figmaPath}-${size}`] = {
                type: "FLOAT",
                value: val,
                alias: resolveFloatAlias(val)
              };
            });
            const defaultSize = getDefaultSizeKey(brands, brandId, tokenName) || inferDefaultSizeKey(tokenSizeKeys, sizeKeys);
            const hasExplicitDefaultSize = Object.prototype.hasOwnProperty.call(def.sizes || {}, "default");
            if (!hasExplicitDefaultSize && defaultSize) {
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
          const resolveStringAlias = (val) => {
            if (def.figmaPath.includes("font-family")) {
              const key = Object.keys(GLOBAL_FONTS).find((k) => GLOBAL_FONTS[k] === val);
              if (key) return `typography/font-family/${key}`;
            } else if (def.figmaPath.includes("font-weight")) {
              const key = Object.keys(GLOBAL_WEIGHTS).find((k) => GLOBAL_WEIGHTS[k] === val);
              if (key) return `typography/font-weight/${key}`;
            }
            return null;
          };

          const resolveSizedStringValue = (sizeKey) => {
            if (sizeKey === "default" && Object.prototype.hasOwnProperty.call(def.sizes || {}, "default")) {
              const explicitDefaultOverride = brand.dimensionOverrides?.[tokenName]?.default;
              if (explicitDefaultOverride !== undefined) return explicitDefaultOverride;
              return def.sizes.default;
            }
            return resolveDimension(brands, brandId, tokenName, sizeKey);
          };

          if (def.sizes) {
            const tokenSizeKeys = Object.keys(def.sizes || {});
            const orderedSizeKeys = [
              ...sizeKeys,
              ...tokenSizeKeys.filter((k) => !sizeKeys.includes(k)),
            ];
            orderedSizeKeys.forEach((size) => {
              const val = resolveSizedStringValue(size);
              out[brandId].components[`${def.figmaPath}-${size}`] = {
                type: "STRING",
                value: val,
                alias: resolveStringAlias(val),
              };
            });

            const defaultSize = getDefaultSizeKey(brands, brandId, tokenName) || inferDefaultSizeKey(tokenSizeKeys, sizeKeys);
            const hasExplicitDefaultSize = Object.prototype.hasOwnProperty.call(def.sizes || {}, "default");
            if (!hasExplicitDefaultSize && defaultSize) {
              out[brandId].components[`${def.figmaPath}-default`] = {
                type: "STRING",
                value: resolveDimension(brands, brandId, tokenName, defaultSize),
                aliasOf: `${def.figmaPath}-${defaultSize}`,
              };
              // Backward-compatible base string path used by older plugin bindings.
              out[brandId].components[def.figmaPath] = {
                type: "STRING",
                value: resolveDimension(brands, brandId, tokenName, defaultSize),
                aliasOf: `${def.figmaPath}-default`,
              };
            }
          } else {
            const val = resolveDimension(brands, brandId, tokenName);
            out[brandId].components[def.figmaPath] = {
              type: "STRING",
              value: val,
              alias: resolveStringAlias(val),
            };
          }
        }
      });
    });

    // Tabs variant swap: keep variant names, swap outlined/pills values.
    // This lets "Outlined" use pill visuals while binding to tabs/outlined-* vars (and vice versa).
    const componentVars = out[brandId].components;
    const componentKeys = Object.keys(componentVars);
    const swapSuffixes = new Set();
    componentKeys.forEach((path) => {
      if (path.startsWith("tabs/outlined-")) swapSuffixes.add(path.slice("tabs/outlined-".length));
      if (path.startsWith("tabs/pills-")) swapSuffixes.add(path.slice("tabs/pills-".length));
    });
    swapSuffixes.forEach((suffix) => {
      const outlinedPath = `tabs/outlined-${suffix}`;
      const pillsPath = `tabs/pills-${suffix}`;
      const outlinedDef = componentVars[outlinedPath];
      const pillsDef = componentVars[pillsPath];
      if (!outlinedDef || !pillsDef) return;
      componentVars[outlinedPath] = pillsDef;
      componentVars[pillsPath] = outlinedDef;
    });

    // Serializable multi-stop gradients for Figma paint styles (plugin); not used for COLOR variables.
    const gradientExports = {};
    const gradientSource =
      brand.gradients && typeof brand.gradients === "object" ? brand.gradients : {};
    Object.keys(gradientSource).forEach((gid) => {
      const spec = gradientFigmaExport(brand, gid);
      if (spec) gradientExports[gid] = spec;
    });
    out[brandId].gradientExports = gradientExports;
  });
  return out;
}
