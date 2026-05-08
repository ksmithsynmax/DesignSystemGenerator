import { Button } from "@mantine/core";
import PlusIcon from "@untitledui-icons/react/line/PlusIcon";
import ChevronRightIcon from "@untitledui-icons/react/line/ChevronRightIcon";
import { getDefaultSizeKey, resolveColor, resolveDimension } from "../../utils/resolveToken";
import { resolveGradientCss } from "../../utils/resolveGradient";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

const VARIANT_MAP = {
  filled: "filled",
  outlined: "outline",
  ghost: "subtle",
};

const WEIGHT_TO_CSS = {
  "Thin": 100,
  "Extra Light": 200,
  "Light": 300,
  "Regular": 400,
  "Medium": 500,
  "Semi Bold": 600,
  "Bold": 700,
  "Extra Bold": 800,
  "Black": 900,
};

export default function ButtonPreview({
  brands,
  brandId,
  variant,
  color = "primary",
  size,
  state,
  previewTheme = "light",
  focusRingStyle = "offset",
  showLeftIcon = false,
  showRightIcon = false,
  /** When set with variant `filled`, overrides solid `--button-bg` / hover with this CSS gradient. */
  fillGradientCss = null,
}) {
  const tokens = COMPONENT_TOKENS.button;
  const colorSegment = color === "error" ? "-error" : "";
  const tokenKey = (property, stateKey) => {
    const maybeState = stateKey && stateKey !== "default" ? `-${stateKey}` : "";
    const preferred = `button-${variant}${colorSegment}-${property}${maybeState}`;
    if (tokens[preferred]) return preferred;
    const fallback = `button-${variant}-${property}${maybeState}`;
    return tokens[fallback] ? fallback : preferred;
  };
  const isFocus = state === "focus";
  const isDisabled = state === "disabled";

  const bgKey = tokenKey("background", state);
  const textKey = tokenKey("text", state);
  const borderKey = tokenKey("border", state);

  const brand = brands[brandId];
  const bgOverride =
    previewTheme === "dark" ? brand?.componentOverridesDark?.[bgKey] : brand?.componentOverrides?.[bgKey];
  const overrideGradientCss =
    variant === "filled" && bgOverride?.gradient && String(bgOverride.gradient).trim()
      ? resolveGradientCss(brand, String(bgOverride.gradient).trim())
      : null;

  const bg = resolveColor(brands, brandId, tokens[bgKey]?.semantic, previewTheme, bgKey);
  const bgHover = state
    ? bg
    : resolveColor(brands, brandId, tokens[tokenKey("background", "hover")]?.semantic, previewTheme, tokenKey("background", "hover"));
  const text = resolveColor(brands, brandId, tokens[textKey]?.semantic, previewTheme, textKey);
  const border = resolveColor(brands, brandId, tokens[borderKey]?.semantic, previewTheme, borderKey);

  const resolvedSizeFor = (tokenName) => {
    if (size !== "default") return size;
    return getDefaultSizeKey(brands, brandId, tokenName) || "sm";
  };

  const paddingY = resolveDimension(brands, brandId, "button-padding-y", resolvedSizeFor("button-padding-y"));
  const paddingX = resolveDimension(brands, brandId, "button-padding-x", resolvedSizeFor("button-padding-x"));
  const fontSize = resolveDimension(brands, brandId, "button-font-size", resolvedSizeFor("button-font-size"));
  const lineHeight = resolveDimension(brands, brandId, "button-line-height", resolvedSizeFor("button-line-height"));
  const tokenIconSize = resolveDimension(brands, brandId, "button-icon-size", resolvedSizeFor("button-icon-size"));
  const tokenIconStroke = resolveDimension(
    brands,
    brandId,
    "button-icon-stroke-width",
    resolvedSizeFor("button-icon-stroke-width")
  );
  const borderRadius = resolveDimension(brands, brandId, "button-border-radius");
  const borderWidth = resolveDimension(brands, brandId, "button-border-width");
  const focusRing = resolveColor(brands, brandId, tokens["button-focus-ring"]?.semantic, previewTheme, "button-focus-ring");
  const focusRingWidth = resolveDimension(brands, brandId, "button-focus-ring-width");
  const focusRingSpacing = resolveDimension(brands, brandId, "button-focus-ring-spacing");
  const focusRingRadius = resolveDimension(brands, brandId, "button-focus-ring-radius");
  const fontWeight = resolveDimension(brands, brandId, "button-font-weight");
  const fontFamily = resolveDimension(brands, brandId, "button-font-family");

  const mantineVariant = VARIANT_MAP[variant] || "filled";
  const iconSize = tokenIconSize || Math.max(14, Math.round((fontSize || 14) * 1.1));
  const computedHeight = Math.round((lineHeight || fontSize || 14) + 2 * (paddingY || 0));

  const effectiveGradientCss = overrideGradientCss || fillGradientCss;
  const useGradientFill = Boolean(effectiveGradientCss && variant === "filled");
  const bgVar = useGradientFill ? effectiveGradientCss : bg;
  const bgHoverVar = useGradientFill ? effectiveGradientCss : bgHover || bg;

  const bdValue =
    border !== "transparent"
      ? `${borderWidth}px solid ${border}`
      : `${borderWidth}px solid transparent`;

  const focusStyles = isFocus
    ? focusRingStyle === "attached"
      ? {
          boxShadow:
            variant === "ghost"
              ? `0 0 0 1px rgba(255,255,255,0.35), 0 0 0 2px ${focusRing || "#228BE6"}`
              : `0 0 0 1px rgba(255,255,255,0.65), 0 0 0 4px ${focusRing || "#228BE6"}`,
          borderRadius: `${borderRadius || 8}px`,
        }
      : {
          outline: `${variant === "ghost" ? 1 : (focusRingWidth || 2)}px solid ${focusRing || "#228BE6"}`,
          outlineOffset: `${variant === "ghost" ? 1 : (focusRingSpacing || 3)}px`,
          borderRadius: `${focusRingRadius || 11}px`,
        }
    : null;
  const disabledStyles = isDisabled
    ? {
        opacity: 1,
        background: useGradientFill ? effectiveGradientCss : bg,
        color: text,
        border: bdValue,
      }
    : null;

  return (
    <Button
      variant={mantineVariant}
      disabled={state === "disabled"}
      style={state ? { pointerEvents: "none" } : undefined}
      leftSection={
        showLeftIcon ? (
          <PlusIcon
            width={iconSize}
            height={iconSize}
            strokeWidth={tokenIconStroke || 2}
            style={{ color: text }}
          />
        ) : undefined
      }
      rightSection={
        showRightIcon ? (
          <ChevronRightIcon
            width={iconSize}
            height={iconSize}
            strokeWidth={tokenIconStroke || 2}
            style={{ color: text }}
          />
        ) : undefined
      }
      vars={() => ({
        root: {
          "--button-bg": bgVar,
          "--button-hover": bgHoverVar,
          "--button-color": text,
          "--button-bd": bdValue,
          "--button-height": `${computedHeight}px`,
          "--button-padding-y": `${paddingY}px`,
          "--button-padding-x": `${paddingX}px`,
          "--button-fz": `${fontSize}px`,
          "--button-radius": `${borderRadius}px`,
        },
      })}
      styles={{
        root: {
          fontWeight: WEIGHT_TO_CSS[fontWeight] ?? 600,
          fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : undefined,
          lineHeight: lineHeight ? `${lineHeight}px` : undefined,
          ...(disabledStyles || {}),
          "&:disabled, &[data-disabled], &:disabled:hover, &[data-disabled]:hover": {
            ...(disabledStyles || {}),
          },
          ...(focusStyles || {}),
          "&:active, &[data-active], &:active:hover": {
            transform: "none !important",
          },
        },
      }}
    >
      Button
    </Button>
  );
}
