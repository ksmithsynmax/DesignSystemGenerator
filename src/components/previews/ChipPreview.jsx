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
  const filledUncheckedBg = resolveFirst([
    `chip-filled-background${stateSuffix}`,
    "chip-filled-background",
    `chip-background${stateSuffix}`,
    "chip-background",
  ]);
  const lightUncheckedBg = resolveFirst([
    `chip-light-background${stateSuffix}`,
    "chip-light-background",
    `chip-background${stateSuffix}`,
    "chip-background",
  ]);
  const outlineUncheckedBg = resolveFirst([
    `chip-outline-background${stateSuffix}`,
    "chip-outline-background",
    `chip-background${stateSuffix}`,
    "chip-background",
  ]);
  const filledUncheckedBorderColor = resolveFirst([
    `chip-filled-border${stateSuffix}`,
    "chip-filled-border",
    `chip-border${stateSuffix}`,
    "chip-border",
  ]);
  const lightUncheckedBorderColor = resolveFirst([
    `chip-light-border${stateSuffix}`,
    "chip-light-border",
    `chip-border${stateSuffix}`,
    "chip-border",
  ]);
  const outlineUncheckedBorderColor = resolveFirst([
    `chip-outline-border${stateSuffix}`,
    "chip-outline-border",
    `chip-border${stateSuffix}`,
    "chip-border",
  ]);
  const filledCheckedBorderColor = resolveFirst([
    `chip-filled-border-checked${stateSuffix}`,
    "chip-filled-border-checked",
    `chip-checked-border${stateSuffix}`,
    "chip-checked-border",
    `chip-border${stateSuffix}`,
    "chip-border",
  ]);
  const lightCheckedBorderColor = resolveFirst([
    `chip-light-border-checked${stateSuffix}`,
    "chip-light-border-checked",
    `chip-checked-border${stateSuffix}`,
    "chip-checked-border",
    `chip-border${stateSuffix}`,
    "chip-border",
  ]);
  const outlineCheckedBorderColor = resolveFirst([
    `chip-outline-border-checked${stateSuffix}`,
    "chip-outline-border-checked",
    `chip-checked-border${stateSuffix}`,
    "chip-checked-border",
    `chip-border${stateSuffix}`,
    "chip-border",
  ]);
  const filledUncheckedText = resolveFirst([
    `chip-filled-text${stateSuffix}`,
    "chip-filled-text",
    `chip-text${stateSuffix}`,
    "chip-text",
  ]);
  const lightUncheckedText = resolveFirst([
    `chip-light-text${stateSuffix}`,
    "chip-light-text",
    `chip-text${stateSuffix}`,
    "chip-text",
  ]);
  const outlineUncheckedText = resolveFirst([
    `chip-outline-text${stateSuffix}`,
    "chip-outline-text",
    `chip-text${stateSuffix}`,
    "chip-text",
  ]);

  // Variant-specific checked backgrounds
  const filledCheckedBg = resolveFirst([`chip-filled-background-checked${stateSuffix}`, "chip-filled-background-checked"]);
  const lightCheckedBg = resolveFirst([`chip-light-background-checked${stateSuffix}`, "chip-light-background-checked"]);
  const outlineCheckedBg = resolveFirst([`chip-outline-background-checked${stateSuffix}`, "chip-outline-background-checked"]);

  // Variant-specific checked text
  const filledCheckedText = resolveFirst([
    `chip-filled-text-checked${stateSuffix}`,
    "chip-filled-text-checked",
    `chip-text${stateSuffix}`,
    "chip-text",
  ]);
  const lightCheckedText = resolveFirst([
    `chip-light-text-checked${stateSuffix}`,
    "chip-light-text-checked",
    `chip-text${stateSuffix}`,
    "chip-text",
  ]);
  const outlineCheckedText = resolveFirst([
    `chip-outline-text-checked${stateSuffix}`,
    "chip-outline-text-checked",
    `chip-text${stateSuffix}`,
    "chip-text",
  ]);

  const iconColor = resolveFirst([isDisabled ? "chip-icon-color-disabled" : "chip-icon-color"]);
  const focusRing = resolveFirst(["chip-focus-ring"]);

  // Resolve dimensions
  // Height is intentionally not resolved — it is driven by padding + line height.
  const chipPaddingX = resolveDimension(brands, brandId, "chip-padding-x", size);
  const chipPaddingY = resolveDimension(brands, brandId, "chip-padding-y", size);
  const chipIconSize = resolveDimension(brands, brandId, "chip-icon-size", size);
  const chipIconStrokeWidth = resolveDimension(brands, brandId, "chip-icon-stroke-width", size);
  const chipFontSize = resolveDimension(brands, brandId, "chip-font-size", size);
  const chipFontFamily = resolveDimension(brands, brandId, "chip-font-family");
  const chipFontWeight = resolveDimension(brands, brandId, "chip-font-weight");
  const chipLineHeight = resolveDimension(brands, brandId, "chip-line-height", size);
  const sharedChipRadius = resolveDimension(brands, brandId, "chip-radius", radius || size);
  const variantDefaultChipRadius = resolveDimension(brands, brandId, `chip-${variant}-radius`);
  const chipRadius =
    radius === "default"
      ? (variantDefaultChipRadius ?? sharedChipRadius)
      : sharedChipRadius;
  const chipSpacing = resolveDimension(brands, brandId, "chip-spacing", size);
  const chipBorderWidth = resolveDimension(brands, brandId, "chip-border-width");

  // Pick variant-specific values
  let checkedBg, checkedText, checkedBorderColor, uncheckedBorderColor, uncheckedBg, textColor;
  if (variant === "light") {
    uncheckedBg = lightUncheckedBg;
    textColor = lightUncheckedText;
    checkedBg = lightCheckedBg;
    checkedText = lightCheckedText;
    checkedBorderColor = lightCheckedBorderColor;
    uncheckedBorderColor = lightUncheckedBorderColor;
  } else if (variant === "outline") {
    uncheckedBg = outlineUncheckedBg;
    textColor = outlineUncheckedText;
    checkedBg = outlineCheckedBg;
    checkedText = outlineCheckedText;
    checkedBorderColor = outlineCheckedBorderColor;
    uncheckedBorderColor = outlineUncheckedBorderColor;
  } else {
    uncheckedBg = filledUncheckedBg;
    textColor = filledUncheckedText;
    checkedBg = filledCheckedBg;
    checkedText = filledCheckedText;
    checkedBorderColor = filledCheckedBorderColor;
    uncheckedBorderColor = filledUncheckedBorderColor;
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
          "--chip-fz": `${chipFontSize}px`,
          "--chip-icon-size": `${chipIconSize}px`,
          "--chip-radius": `${chipRadius}px`,
          "--chip-spacing": `${chipSpacing}px`,
          "--chip-bg": checked ? checkedBg : uncheckedBg,
          "--chip-color": checked ? checkedText : textColor,
          "--chip-icon-color": checked ? (variant === "filled" ? iconColor : checkedText) : textColor,
          "--chip-bd": `${chipBorderWidth}px solid ${variant === "outline" || !checked ? (checked ? checkedBorderColor : uncheckedBorderColor) : "transparent"}`,
        },
      })}
      styles={{
        // Hide Mantine's built-in check glyph (a filled path we can't stroke)
        // so our own stroked checkmark below drives the icon + stroke width.
        iconWrapper: { display: "none" },
        label: {
          // Match the filter-chip previews: an explicit centered flex box so the
          // icon + label sit centered and the height hugs content + padding
          // (Mantine's default label otherwise anchors content and caps height).
          height: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: checked ? checkedBg : uncheckedBg,
          borderColor: variant === "outline" || !checked ? (checked ? checkedBorderColor : uncheckedBorderColor) : "transparent",
          borderWidth: chipBorderWidth,
          paddingLeft: chipPaddingX,
          paddingRight: chipPaddingX,
          paddingTop: chipPaddingY,
          paddingBottom: chipPaddingY,
          color: checked ? checkedText : textColor,
          boxShadow: state === "focus" ? `0 0 0 2px ${focusRing}40` : "none",
          fontFamily: chipFontFamily ? `"${chipFontFamily}", sans-serif` : undefined,
          fontWeight: chipFontWeight === "Semi Bold" ? 600 : chipFontWeight === "Bold" ? 700 : 400,
          lineHeight: chipLineHeight ? `${chipLineHeight}px` : undefined,
        },
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: chipSpacing }}>
        {checked ? (
          <svg
            width={chipIconSize}
            height={chipIconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke={variant === "filled" ? iconColor : checkedText}
            // Stroke width is authored in px against the icon's rendered size,
            // then scaled into the fixed 24-unit viewBox so it looks correct.
            strokeWidth={chipIconStrokeWidth ? (chipIconStrokeWidth / chipIconSize) * 24 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : null}
        <span style={{ lineHeight: chipLineHeight ? `${chipLineHeight}px` : undefined }}>
          {label}
        </span>
      </span>
    </Chip>
  );
}
