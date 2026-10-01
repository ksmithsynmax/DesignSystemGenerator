import { COMPONENT_TOKENS, COMPONENT_SIZE_KEYS, TOKEN_TYPES } from "../data/componentTokens";
import {
  resolveDimension,
  getDefaultSizeKey,
  mergeLightSemanticsForBrand,
  mergeDarkSemanticsForBrand,
  relativeLuminance,
  availableAvatarColors,
  chartSeriesMappingForToken,
  chartSeriesOpacityMappingForToken,
  chartShadeMappingForToken,
  chartShadeOpacityMappingForToken,
} from "./resolveToken";
import { gradientCssFromDef, gradientFirstStopHex, gradientFigmaExport } from "./resolveGradient";
import {
  getAlphaPrimitives,
  getAlphaFamilyRamp,
  resolveAlphaAlias,
  isAlphaFamily,
} from "./alphaPrimitives";
import {
  GLOBAL_PRIMITIVES,
  GLOBAL_SPACING,
  GLOBAL_SIZES,
  GLOBAL_ENUMS,
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
  // Alpha primitive family: the value is the ramp entry as-is (alpha channel
  // preserved) and it always references the alpha token — never a raw literal.
  if (isAlphaFamily(mapping.color)) {
    const ramp = getAlphaFamilyRamp(brand, mapping.color);
    const idx = Number.isFinite(Number(mapping.index)) ? Number(mapping.index) : 0;
    return {
      value: ramp?.[idx] || "#FF00FF",
      primitiveAlias: ramp ? `${mapping.color}/${idx}` : null,
      gradientSpec: null,
    };
  }
  const baseValue = brand.primitives[mapping.color]?.[mapping.index]
    ?? GLOBAL_PRIMITIVES[mapping.color]?.[mapping.index]
    ?? null;
  const opacity = normalizeOpacity(mapping.opacity);
  // A fully-transparent color is functionally the `transparent` primitive —
  // alias it there instead of emitting an unreferenceable raw literal.
  if (opacity === 0) return { value: "transparent", primitiveAlias: "transparent", gradientSpec: null };
  const value = baseValue ? applyOpacity(baseValue, opacity) : "#FF00FF";
  // Full-opacity colors alias to their base primitive; opacity tints alias to a
  // dedicated alpha ramp when one exists, otherwise stay a raw literal.
  const primitiveAlias =
    opacity === 100
      ? `${mapping.color}/${mapping.index}`
      : resolveAlphaAlias(brand, mapping.color, mapping.index, opacity);
  return { value, primitiveAlias, gradientSpec: null };
}

/**
 * Builds the fully-resolved token payload for all brands.
 * Returns a plain object (not serialized).
 */
export function buildExportPayload(brands, options) {
  const GLOBAL_RADII = [
    { name: "none", value: 0 },
    { name: "1", value: 1 },
    { name: "2", value: 2 },
    { name: "3", value: 3 },
    { name: "4", value: 4 },
    { name: "5", value: 5 },
    { name: "6", value: 6 },
    { name: "8", value: 8 },
    { name: "9", value: 9 },
    { name: "11", value: 11 },
    { name: "12", value: 12 },
    { name: "16", value: 16 },
    { name: "17", value: 17 },
    { name: "19", value: 19 },
    { name: "24", value: 24 },
    { name: "35", value: 35 },
    { name: "999", value: 999 },
  ];

  const out = { 
    globalPrimitives: GLOBAL_PRIMITIVES,
    globalSpacing: GLOBAL_SPACING,
    globalSizes: GLOBAL_SIZES,
    globalEnums: GLOBAL_ENUMS,
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
      // Alpha primitive family: pass the ramp value through and reference the token.
      if (isAlphaFamily(mapping.color)) {
        const ramp = getAlphaFamilyRamp(brand, mapping.color);
        const idx = Number.isFinite(Number(mapping.index)) ? Number(mapping.index) : 0;
        resolved[key] = {
          type: "COLOR",
          value: ramp?.[idx] || null,
          alias: ramp ? `${mapping.color}/${idx}` : null,
        };
        return;
      }
      const baseValue = brand.primitives[mapping.color]?.[mapping.index]
          ?? GLOBAL_PRIMITIVES[mapping.color]?.[mapping.index]
          ?? null;
      const opacity = normalizeOpacity(mapping.opacity);
      const value = baseValue ? applyOpacity(baseValue, opacity) : null;
      let alias;
      if (mapping.color === "transparent") {
        alias = "transparent";
      } else if (opacity !== 100) {
        // Prefer a real alpha-primitive reference; fall back to the "@ %" label.
        alias =
          resolveAlphaAlias(brand, mapping.color, mapping.index, opacity) ||
          `${mapping.color}/${mapping.index} @ ${opacity}%`;
      } else {
        alias = `${mapping.color}/${mapping.index}`;
      }
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

  // Per-color avatar tokens (avatar-color-*, avatar-on-color-*) map to a SINGLE
  // Figma variable shared across all brand modes. A brand that lacks the palette
  // color would leave its mode with no reference (→ literal white → fails the
  // downstream token test). So we only emit a palette color when EVERY brand
  // defines it. This is dynamic: add the color's ramp to all brands and it comes
  // back automatically; remove it from any one brand and it drops for all.
  const brandIdList = Object.keys(brands);
  const avatarColorsInAllBrands = brandIdList.length
    ? brandIdList
        .map((bid) => availableAvatarColors(brands, bid))
        .reduce((acc, list) => acc.filter((c) => list.includes(c)))
    : [];

  Object.entries(brands).forEach(([brandId, brand]) => {
    const lightMerged = mergeLightSemanticsForBrand(brand);
    const darkMerged = mergeDarkSemanticsForBrand(brand);
    const lightSemantic = resolveSemanticMap(brand, lightMerged);
    const darkSemantic = resolveSemanticMap(brand, darkMerged);

    out[brandId] = {
      primitives: {
        ...brand.primitives,
        ...getAlphaPrimitives(brand),
      },
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
          // Skip per-color tokens unless the palette color exists in EVERY brand
          // (shared variable must have a real reference in all brand modes).
          if (def.paletteGate && !avatarColorsInAllBrands.includes(def.paletteGate)) return;

          const lightSemanticMapping = def.semantic ? lightMerged[def.semantic] || null : null;
          const darkSemanticMapping = def.semantic ? darkMerged[def.semantic] || null : null;
          const lightOverride = brand.componentOverrides?.[tokenName] || null;
          const darkOverride = brand.componentOverridesDark?.[tokenName] || null;

          // Resolve a color token for one theme. Supports semantic-less tokens that
          // default to a palette primitive (defaultMapping) or to auto-contrast text.
          const seriesMapping =
            chartSeriesMappingForToken(brand, tokenName) ||
            chartSeriesOpacityMappingForToken(brand, tokenName);
          const shadeMapping =
            chartShadeMappingForToken(brand, tokenName) ||
            chartShadeOpacityMappingForToken(brand, tokenName);
          const resolveColorTokenTheme = (override, semanticMapping, isDark) => {
            if (override) return resolveMappingToColor(brand, override);
            if (def.semantic) return resolveMappingToColor(brand, semanticMapping);
            if (seriesMapping) return resolveMappingToColor(brand, seriesMapping);
            if (shadeMapping) return resolveMappingToColor(brand, shadeMapping);
            if (def.defaultMapping) return resolveMappingToColor(brand, def.defaultMapping);
            if (def.autoContrastOf) {
              const bgDef = COMPONENT_TOKENS[compName]?.[def.autoContrastOf];
              const bgOverride = isDark
                ? brand.componentOverridesDark?.[def.autoContrastOf]
                : brand.componentOverrides?.[def.autoContrastOf];
              const bgMapping = bgOverride || bgDef?.defaultMapping || null;
              const bgResolved = resolveMappingToColor(brand, bgMapping);
              const onIndex = relativeLuminance(bgResolved.value) >= 0.3 ? 9 : 0;
              return resolveMappingToColor(brand, { color: "neutral", index: onIndex });
            }
            return resolveMappingToColor(brand, null);
          };

          const lightResolved = resolveColorTokenTheme(lightOverride, lightSemanticMapping, false);
          const darkResolved = resolveColorTokenTheme(darkOverride, darkSemanticMapping, true);

          const lightHasSemantic = Boolean(def.semantic && lightSemanticMapping);
          const darkHasSemantic = Boolean(def.semantic && darkSemanticMapping);
          // Keep semantic collection limited to actual semantic tokens.
          // If component semantic mapping is missing (or overridden),
          // component sync falls back to primitiveAlias downstream.
          const lightAlias = !lightOverride && lightHasSemantic ? def.semantic : null;
          const darkAlias = !darkOverride && darkHasSemantic ? def.semantic : null;

          // Chart opacity tints (series/shade-opacity-N) have no dedicated alpha
          // primitive for their exact hue+step, so a lowered-opacity override
          // would otherwise emit a raw literal. Per product decision, fall back to
          // the SOLID sibling's primitive (same hue) so they reference a real
          // token. NOTE: this drops the translucency for those specific tokens.
          const solidChartMapping = seriesMapping || shadeMapping || null;
          const chartSolidAlias =
            solidChartMapping ? resolveMappingToColor(brand, solidChartMapping).primitiveAlias : null;
          const lightPrimAlias =
            lightResolved.primitiveAlias || (!lightAlias && chartSolidAlias) || lightResolved.primitiveAlias;
          const darkPrimAlias =
            darkResolved.primitiveAlias || (!darkAlias && chartSolidAlias) || darkResolved.primitiveAlias;

          out[brandId].components[def.figmaPath] = {
            type: "COLOR",
            value: lightResolved.value,
            alias: lightAlias,
            primitiveAlias: lightPrimAlias,
            light: {
              value: lightResolved.value,
              alias: lightAlias,
              primitiveAlias: lightPrimAlias,
              gradientSpec: lightResolved.gradientSpec || null,
            },
            dark: {
              value: darkResolved.value,
              alias: darkAlias,
              primitiveAlias: darkPrimAlias,
              gradientSpec: darkResolved.gradientSpec || null,
            },
          };
        } else if (def.type === TOKEN_TYPES.FLOAT) {
          const p = def.figmaPath;
          const isThickness = /border-width|stroke-width|focus-ring-width|thickness|axis-width|grid-width|wick-width|divider-width/.test(p);
          const resolveFloatAlias = (val) => {
            const n = Number(val);
            const norm = String(val).replace(".", "_");
            // Opacity is a dimensionless ratio — never alias it to a spacing primitive.
            if (p.includes("opacity")) return null;
            // Path-preferred scales first (so a width doesn't grab a spacing token, etc.)
            if (isThickness && GLOBAL_BORDER_WIDTHS.includes(n)) return `border-width/${norm}`;
            if (p.includes("font-size")) return GLOBAL_FONT_SIZES.includes(n) ? `font-size-${norm}` : null;
            if (p.includes("line-height")) return GLOBAL_LINE_HEIGHTS.includes(n) ? `typography/line-height/${norm}` : null;
            if (p.includes("radius")) {
              const radiusName = n === 0 ? "none" : String(n);
              if (GLOBAL_RADII.some((e) => e.name === radiusName)) return `radius/${radiusName}`;
              // fall through to generic membership checks
            }
            // Generic membership fallbacks: spacing → size → border-width.
            if (GLOBAL_SPACING.includes(n)) return `spacing/${n}`;
            if (GLOBAL_SIZES.includes(n)) return `size/${n}`;
            if (GLOBAL_BORDER_WIDTHS.includes(n)) return `border-width/${norm}`;
            return null;
          };
          // Snap computed (non-scale) icon/point sizes to the nearest spacing step
          // so they alias a real primitive (accepted tiny <1px shift). Only kicks in
          // when the raw value has no primitive of its own.
          const snapToSpacing = (val) => {
            let best = null, bestD = Infinity;
            for (let si = 0; si < GLOBAL_SPACING.length; si++) {
              const d = Math.abs(GLOBAL_SPACING[si] - Number(val));
              if (d < bestD) { bestD = d; best = GLOBAL_SPACING[si]; }
            }
            return best;
          };
          const isSnappable = /icon-size|dot-radius|point-radius/.test(p);
          // Returns { value, alias } — snapping the value only if it would otherwise
          // be an unaliasable literal on a snappable (computed) token.
          const floatEmit = (val) => {
            let alias = resolveFloatAlias(val);
            if (alias == null && isSnappable) {
              const snapped = snapToSpacing(val);
              const snappedAlias = snapped == null ? null : resolveFloatAlias(snapped);
              if (snappedAlias != null) return { value: snapped, alias: snappedAlias };
            }
            return { value: val, alias };
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
              const emitted = floatEmit(resolveSizedFloatValue(size));
              out[brandId].components[`${def.figmaPath}-${size}`] = {
                type: "FLOAT",
                value: emitted.value,
                alias: emitted.alias,
              };
            });
            const defaultSize = getDefaultSizeKey(brands, brandId, tokenName) || inferDefaultSizeKey(tokenSizeKeys, sizeKeys);
            const hasExplicitDefaultSize = Object.prototype.hasOwnProperty.call(def.sizes || {}, "default");
            if (!hasExplicitDefaultSize && defaultSize) {
              // Resolve the canonical "default" exactly as the app preview does.
              // This honors an explicit "default" override AND derived tokens
              // (e.g. checkbox/radio icon size scales off the box's default),
              // so Figma always matches the preview.
              const defaultVal = resolveDimension(brands, brandId, tokenName, "default");
              const namedVal = resolveDimension(brands, brandId, tokenName, defaultSize);
              const explicitDefaultOverride = brand.dimensionOverrides?.[tokenName]?.default;
              // Only alias to the named size when the default genuinely tracks
              // it (same value, not decoupled by an explicit "default" edit).
              // Otherwise emit a literal so the alias can't drag the value back
              // to the named size.
              if (explicitDefaultOverride === undefined && defaultVal === namedVal) {
                // Default tracks a named size. Prefer a DIRECT primitive/semantic
                // alias when one exists (hermes requires component tokens to
                // reference primitives/semantics, not sibling component tokens —
                // a component→component `aliasOf` that the plugin can't collapse
                // ends up as a raw literal and fails the test). Only fall back to
                // tracking the sibling when there's no primitive to point at.
                const emittedDefault = floatEmit(defaultVal);
                if (emittedDefault.alias) {
                  out[brandId].components[`${def.figmaPath}-default`] = {
                    type: "FLOAT",
                    value: emittedDefault.value,
                    alias: emittedDefault.alias,
                  };
                } else {
                  out[brandId].components[`${def.figmaPath}-default`] = {
                    type: "FLOAT",
                    value: defaultVal,
                    aliasOf: `${def.figmaPath}-${defaultSize}`,
                  };
                }
              } else {
                const emittedDefault = floatEmit(defaultVal);
                out[brandId].components[`${def.figmaPath}-default`] = {
                  type: "FLOAT",
                  value: emittedDefault.value,
                  alias: emittedDefault.alias,
                };
              }
            }
          } else {
            const emittedSingle = floatEmit(resolveDimension(brands, brandId, tokenName));
            out[brandId].components[def.figmaPath] = {
              type: "FLOAT",
              value: emittedSingle.value,
              alias: emittedSingle.alias,
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
            // Enum keyword tokens (styles / curves) reference a global enum primitive.
            const p = def.figmaPath;
            let group = null;
            if (p.includes("border-style")) group = "border-style";
            else if (p.includes("line-curve") || p.includes("curve")) group = "line-curve";
            else if (p.includes("-style")) group = "line-style"; // series/grid/line style
            if (group && GLOBAL_ENUMS[group]?.includes(val)) return `enum/${group}/${val}`;
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
              // Resolve "default" as the app preview does, honoring an explicit
              // "default" override — mirrors the FLOAT branch above.
              const defaultStringValue = resolveDimension(brands, brandId, tokenName, "default");
              const namedStringValue = resolveDimension(brands, brandId, tokenName, defaultSize);
              const explicitDefaultOverride = brand.dimensionOverrides?.[tokenName]?.default;
              if (explicitDefaultOverride === undefined && defaultStringValue === namedStringValue) {
                out[brandId].components[`${def.figmaPath}-default`] = {
                  type: "STRING",
                  value: defaultStringValue,
                  aliasOf: `${def.figmaPath}-${defaultSize}`,
                };
              } else {
                out[brandId].components[`${def.figmaPath}-default`] = {
                  type: "STRING",
                  value: defaultStringValue,
                  alias: resolveStringAlias(defaultStringValue),
                };
              }
              // Backward-compatible base string path used by older plugin bindings.
              out[brandId].components[def.figmaPath] = {
                type: "STRING",
                value: defaultStringValue,
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
