import { ActionIcon } from "@mantine/core";
import ChevronRightIcon from "@untitledui-icons/react/line/ChevronRightIcon";
import CheckIcon from "@untitledui-icons/react/line/CheckIcon";
import MinusIcon from "@untitledui-icons/react/line/MinusIcon";
import { getDefaultSizeKey, resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

const VARIANT_MAP = {
  default: "default",
  filled: "filled",
  light: "light",
  outlined: "outline",
  transparent: "transparent",
};

function getIcon(iconName, iconSize, color) {
  if (iconName === "check") {
    return <CheckIcon width={iconSize} height={iconSize} style={{ color }} />;
  }
  if (iconName === "minus") {
    return <MinusIcon width={iconSize} height={iconSize} style={{ color }} />;
  }
  return <ChevronRightIcon width={iconSize} height={iconSize} style={{ color }} />;
}

export default function ActionIconPreview({
  brands,
  brandId,
  variant = "default",
  size = "sm",
  radius = "sm",
  state,
  focusRingStyle = "offset",
  iconName = "check",
}) {
  const tokens = COMPONENT_TOKENS.actionicon;
  const prefix = `actionicon-${variant}`;
  const suffix = state ? `-${state}` : "";

  const bgKey = suffix && tokens[`${prefix}-background${suffix}`]
    ? `${prefix}-background${suffix}`
    : `${prefix}-background`;
  const iconKey = suffix && tokens[`${prefix}-icon${suffix}`]
    ? `${prefix}-icon${suffix}`
    : `${prefix}-icon`;
  const borderKey = suffix && tokens[`${prefix}-border${suffix}`]
    ? `${prefix}-border${suffix}`
    : `${prefix}-border`;

  const bg = resolveColor(brands, brandId, tokens[bgKey]?.semantic, "light", bgKey);
  const bgHover = state
    ? bg
    : resolveColor(
      brands,
      brandId,
      tokens[`${prefix}-background-hover`]?.semantic,
      "light",
      `${prefix}-background-hover`
    );
  const iconColor = resolveColor(brands, brandId, tokens[iconKey]?.semantic, "light", iconKey);
  const border = resolveColor(brands, brandId, tokens[borderKey]?.semantic, "light", borderKey);
  const focusRing = resolveColor(brands, brandId, tokens["actionicon-focus-ring"]?.semantic, "light", "actionicon-focus-ring");

  const resolveSizeKey = (tokenName, requestedKey, fallbackKey = "sm") => {
    if (requestedKey !== "default") return requestedKey;
    return getDefaultSizeKey(brands, brandId, tokenName) || fallbackKey;
  };

  const resolvedActionIconSize = resolveSizeKey("actionicon-size", size, "sm");
  const resolvedRadiusSize = resolveSizeKey("actionicon-radius", radius || size, resolvedActionIconSize);

  const actionIconSize = resolveDimension(brands, brandId, "actionicon-size", resolvedActionIconSize);
  const actionIconRadius = resolveDimension(brands, brandId, "actionicon-radius", resolvedRadiusSize);
  const iconSize = resolveDimension(
    brands,
    brandId,
    "actionicon-icon-size",
    resolveSizeKey("actionicon-icon-size", size, resolvedActionIconSize)
  );
  const borderWidth = resolveDimension(brands, brandId, "actionicon-border-width");
  const focusRingWidth = resolveDimension(
    brands,
    brandId,
    "actionicon-focus-ring-width",
    resolveSizeKey("actionicon-focus-ring-width", radius || size, resolvedRadiusSize)
  );
  const focusRingSpacing = resolveDimension(
    brands,
    brandId,
    "actionicon-focus-ring-spacing",
    resolveSizeKey("actionicon-focus-ring-spacing", radius || size, resolvedRadiusSize)
  );
  const focusRingRadius = resolveDimension(brands, brandId, "actionicon-focus-ring-radius", resolvedRadiusSize);

  const mantineVariant = VARIANT_MAP[variant] || "default";
  const borderValue =
    border !== "transparent"
      ? `${borderWidth}px solid ${border}`
      : `${borderWidth}px solid transparent`;
  const isFocus = state === "focus";
  const isDisabled = state === "disabled";
  const focusStyles = isFocus
    ? focusRingStyle === "attached"
      ? {
          boxShadow: `0 0 0 ${focusRingWidth || 2}px ${focusRing}40`,
          borderRadius: `${actionIconRadius}px`,
        }
      : {
          outline: `${focusRingWidth || 2}px solid ${focusRing}`,
          outlineOffset: `${focusRingSpacing || 3}px`,
          borderRadius: `${focusRingRadius || actionIconRadius}px`,
        }
    : null;
  const disabledStyles = isDisabled
    ? {
        opacity: 1,
        background: bg,
        color: iconColor,
        border: borderValue,
      }
    : null;

  return (
    <ActionIcon
      variant={mantineVariant}
      disabled={state === "disabled"}
      style={state ? { pointerEvents: "none" } : undefined}
      vars={() => ({
        root: {
          "--ai-bg": bg,
          "--ai-hover": bgHover || bg,
          "--ai-color": iconColor,
          "--ai-bd": borderValue,
          "--ai-size": `${actionIconSize}px`,
          "--ai-radius": `${actionIconRadius}px`,
        },
      })}
      styles={{
        root: {
          ...(disabledStyles || {}),
          "&:disabled, &[data-disabled], &:disabled:hover, &[data-disabled]:hover": {
            ...(disabledStyles || {}),
          },
          ...(focusStyles || {}),
        },
      }}
    >
      {getIcon(iconName, iconSize, iconColor)}
    </ActionIcon>
  );
}
