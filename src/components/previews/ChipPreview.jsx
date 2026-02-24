import { useState } from "react";
import { Chip } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function ChipPreview({ brands, brandId, variant = "filled", size, radius, checked: controlledChecked, readOnly, label = "Chip" }) {
  const [internalChecked, setInternalChecked] = useState(false);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const tokens = COMPONENT_TOKENS.chip;

  // Resolve colors based on variant and checked state
  const uncheckedBg = resolveColor(brands, brandId, tokens["chip-background"]?.semantic);
  const borderColor = resolveColor(brands, brandId, tokens["chip-border"]?.semantic);
  const textColor = resolveColor(brands, brandId, tokens["chip-text"]?.semantic);

  // Variant-specific checked backgrounds
  const filledCheckedBg = resolveColor(brands, brandId, tokens["chip-filled-background-checked"]?.semantic);
  const lightCheckedBg = resolveColor(brands, brandId, tokens["chip-light-background-checked"]?.semantic);
  const outlineCheckedBg = resolveColor(brands, brandId, tokens["chip-outline-background-checked"]?.semantic);

  // Variant-specific checked text
  const filledCheckedText = resolveColor(brands, brandId, tokens["chip-filled-text-checked"]?.semantic);
  const lightCheckedText = resolveColor(brands, brandId, tokens["chip-light-text-checked"]?.semantic);
  const outlineCheckedText = resolveColor(brands, brandId, tokens["chip-outline-text-checked"]?.semantic);

  const iconColor = resolveColor(brands, brandId, tokens["chip-icon-color"]?.semantic);

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

  const handleChange = readOnly ? undefined : () => setInternalChecked((v) => !v);

  return (
    <Chip
      checked={checked}
      variant={variant}
      onChange={handleChange}
      readOnly={readOnly}
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
        },
      }}
    >
      {label}
    </Chip>
  );
}
