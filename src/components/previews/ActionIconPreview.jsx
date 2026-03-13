import { ActionIcon } from "@mantine/core";
import ChevronRightIcon from "@untitledui-icons/react/line/ChevronRightIcon";
import CheckIcon from "@untitledui-icons/react/line/CheckIcon";
import MinusIcon from "@untitledui-icons/react/line/MinusIcon";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
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

  const actionIconSize = resolveDimension(brands, brandId, "actionicon-size", size);
  const actionIconRadius = resolveDimension(brands, brandId, "actionicon-radius", radius || size);
  const iconSize = resolveDimension(brands, brandId, "actionicon-icon-size", size);
  const borderWidth = resolveDimension(brands, brandId, "actionicon-border-width");

  const mantineVariant = VARIANT_MAP[variant] || "default";
  const borderValue =
    border !== "transparent"
      ? `${borderWidth}px solid ${border}`
      : `${borderWidth}px solid transparent`;

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
    >
      {getIcon(iconName, iconSize, iconColor)}
    </ActionIcon>
  );
}
