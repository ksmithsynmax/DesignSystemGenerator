import { Button } from "@mantine/core";
import PlusIcon from "@untitledui-icons/react/line/PlusIcon";
import ChevronRightIcon from "@untitledui-icons/react/line/ChevronRightIcon";
import { getDefaultSizeKey, resolveColor, resolveDimension } from "../../utils/resolveToken";
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
  size,
  state,
  previewTheme = "light",
  focusRingStyle = "offset",
  showLeftIcon = false,
  showRightIcon = false,
}) {
  const tokens = COMPONENT_TOKENS.button;
  const prefix = `button-${variant}`;
  const suffix = state ? `-${state}` : "";
  const isFocus = state === "focus";
  const isDisabled = state === "disabled";

  const bgKey = suffix && tokens[`${prefix}-background${suffix}`] ? `${prefix}-background${suffix}` : `${prefix}-background`;
  const textKey = suffix && tokens[`${prefix}-text${suffix}`] ? `${prefix}-text${suffix}` : `${prefix}-text`;
  const borderKey = suffix && tokens[`${prefix}-border${suffix}`] ? `${prefix}-border${suffix}` : `${prefix}-border`;

  const bg = resolveColor(brands, brandId, tokens[bgKey]?.semantic, previewTheme, bgKey);
  const bgHover = state
    ? bg
    : resolveColor(brands, brandId, tokens[`${prefix}-background-hover`]?.semantic, previewTheme, `${prefix}-background-hover`);
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

  const bdValue =
    border !== "transparent"
      ? `${borderWidth}px solid ${border}`
      : `${borderWidth}px solid transparent`;

  const focusStyles = isFocus
    ? focusRingStyle === "attached"
      ? {
          boxShadow: `0 0 0 1px rgba(255,255,255,0.65), 0 0 0 4px ${focusRing || "#228BE6"}`,
          borderRadius: `${borderRadius || 8}px`,
        }
      : {
          outline: `${focusRingWidth || 2}px solid ${focusRing || "#228BE6"}`,
          outlineOffset: `${focusRingSpacing || 3}px`,
          borderRadius: `${focusRingRadius || 11}px`,
        }
    : null;
  const disabledStyles = isDisabled
    ? {
        opacity: 1,
        background: bg,
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
          "--button-bg": bg,
          "--button-hover": bgHover || bg,
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
