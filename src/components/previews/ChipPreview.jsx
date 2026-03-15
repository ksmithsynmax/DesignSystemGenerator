import { useState } from "react";
import { Chip } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function ChipPreview({
  brands,
  brandId,
  variant = "filled",
  size,
  radius,
  checked: controlledChecked,
  state,
  readOnly,
  label = "Chip",
}) {
  const [internalChecked, setInternalChecked] = useState(false);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const tokens = COMPONENT_TOKENS.chip;
  const stateSuffix = state && state !== "default" ? `-${state}` : "";
  const isDisabled = state === "disabled";

  const resolveFirst = (tokenKeys) => {
    const key = tokenKeys.find((k) => tokens[k]);
    if (!key) return "#FF00FF";
    return resolveColor(brands, brandId, tokens[key]?.semantic, "light", key);
  };

  // Resolve colors based on variant and checked state
  const uncheckedBg = resolveFirst([`chip-background${stateSuffix}`, "chip-background"]);
  const borderColor = resolveFirst([`chip-border${stateSuffix}`, "chip-border"]);
  const textColor = resolveFirst([isDisabled ? "chip-text-disabled" : "chip-text"]);

  // Variant-specific checked backgrounds
  const filledCheckedBg = resolveFirst([`chip-filled-background-checked${stateSuffix}`, "chip-filled-background-checked"]);
  const lightCheckedBg = resolveFirst([`chip-light-background-checked${stateSuffix}`, "chip-light-background-checked"]);
  const outlineCheckedBg = resolveFirst([`chip-outline-background-checked${stateSuffix}`, "chip-outline-background-checked"]);

  // Variant-specific checked text
  const filledCheckedText = resolveFirst([isDisabled ? "chip-text-disabled" : "chip-filled-text-checked"]);
  const lightCheckedText = resolveFirst([isDisabled ? "chip-text-disabled" : "chip-light-text-checked"]);
  const outlineCheckedText = resolveFirst([isDisabled ? "chip-text-disabled" : "chip-outline-text-checked"]);

  const iconColor = resolveFirst([isDisabled ? "chip-icon-color-disabled" : "chip-icon-color"]);
  const focusRing = resolveFirst(["chip-focus-ring"]);

  // Resolve dimensions
  const chipHeight = resolveDimension(brands, brandId, "chip-height", size);
  const chipPadding = resolveDimension(brands, brandId, "chip-padding", size);
  const chipCheckedPadding = resolveDimension(brands, brandId, "chip-checked-padding", size);
  const chipIconSize = resolveDimension(brands, brandId, "chip-icon-size", size);
  const chipFontSize = resolveDimension(brands, brandId, "chip-font-size", size);
  const chipRadius = resolveDimension(brands, brandId, "chip-radius", radius || size);
  const chipSpacing = resolveDimension(brands, brandId, "chip-spacing", size);
  const chipBorderWidth = resolveDimension(brands, brandId, "chip-border-width");

  // Pick variant-specific values
  let checkedBg, checkedText;
  if (variant === "light") {
    checkedBg = lightCheckedBg;
    checkedText = lightCheckedText;
  } else if (variant === "outline") {
    checkedBg = outlineCheckedBg;
    checkedText = outlineCheckedText;
  } else {
    checkedBg = filledCheckedBg;
    checkedText = filledCheckedText;
  }

  const handleChange = readOnly || isDisabled ? undefined : () => setInternalChecked((v) => !v);

  return (
    <Chip
      checked={checked}
      variant={variant}
      onChange={handleChange}
      readOnly={readOnly || isDisabled}
      disabled={isDisabled}
      vars={() => ({
        root: {
          "--chip-size": `${chipHeight}px`,
          "--chip-fz": `${chipFontSize}px`,
          "--chip-padding": `${chipPadding}px`,
          "--chip-checked-padding": `${chipCheckedPadding}px`,
          "--chip-icon-size": `${chipIconSize}px`,
          "--chip-radius": `${chipRadius}px`,
          "--chip-spacing": `${chipSpacing}px`,
          "--chip-bg": checked ? checkedBg : uncheckedBg,
          "--chip-color": checked ? checkedText : textColor,
          "--chip-icon-color": checked ? (variant === "filled" ? iconColor : checkedText) : textColor,
          "--chip-bd": `${chipBorderWidth}px solid ${variant === "outline" || !checked ? borderColor : "transparent"}`,
        },
      })}
      styles={{
        label: {
          backgroundColor: checked ? checkedBg : uncheckedBg,
          borderColor: variant === "outline" || !checked ? borderColor : "transparent",
          borderWidth: chipBorderWidth,
          color: checked ? checkedText : textColor,
          boxShadow: state === "focus" ? `0 0 0 2px ${focusRing}40` : "none",
        },
      }}
    >
      {label}
    </Chip>
  );
}
