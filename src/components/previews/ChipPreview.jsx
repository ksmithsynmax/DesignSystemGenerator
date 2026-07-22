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
  inactive = false,
  state,
  readOnly,
  label = "Chip",
  subLabel,
  withRemove = false,
  showCheckmark = false,
}) {
  const [internalChecked, setInternalChecked] = useState(false);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const tokens = COMPONENT_TOKENS.chip;
  const isDisabled = state === "disabled";
  // Interaction state (Enabled/Hovered/Focused/Pressed/Disabled) is orthogonal to
  // the "selective state" (Active/Selected/Inactive/Selective Inactive), which is
  // expressed as checked (selected) + inactive (unavailable).
  const interaction = state && state !== "default" ? state : null;
  const isInactive = Boolean(inactive);
  const isSelectiveInactive = isInactive && checked;

  const resolveFirst = (tokenKeys) => {
    const key = tokenKeys.find((k) => tokens[k]);
    if (!key) return "#FF00FF";
    return resolveColor(brands, brandId, tokens[key]?.semantic, "light", key);
  };

  // Build a most-specific-first fallback chain for a color property, combining
  // variant + checked + inactive + interaction. Qualifiers are dropped in order
  // of least importance (interaction, then inactive, then checked, then variant)
  // so a missing precise token gracefully degrades to a sensible base.
  const chipColorKeys = (prop) => {
    const keys = [];
    const make = (useV, useC, useIa, useIt) => {
      const base = useV ? `chip-${variant}-${prop}` : `chip-${prop}`;
      let s = "";
      if (useC && checked) s += "-selected";
      if (useIa && isInactive) s += "-inactive";
      if (useIt && interaction) s += `-${interaction}`;
      return base + s;
    };
    [true, false].forEach((useV) => {
      keys.push(make(useV, true, true, true));
      keys.push(make(useV, true, true, false));
      keys.push(make(useV, true, false, true));
      keys.push(make(useV, true, false, false));
      keys.push(make(useV, false, true, true));
      keys.push(make(useV, false, true, false));
      keys.push(make(useV, false, false, true));
      keys.push(make(useV, false, false, false));
    });
    return keys;
  };
  const resolveChipColor = (prop) => resolveFirst(chipColorKeys(prop));

  const bg = resolveChipColor("background");
  const borderColor = resolveChipColor("border");
  const textColor = resolveChipColor("text");

  const focusRing = resolveFirst(["chip-focus-ring"]);
  const warningColor = resolveFirst(["chip-selective-inactive-warning-color"]);
  const warningBorderColor = resolveFirst(["chip-selective-inactive-warning-border"]);
  const warningIconColor = resolveFirst(["chip-selective-inactive-warning-icon"]);
  const selectiveInactiveBorderStyle =
    resolveDimension(brands, brandId, "chip-selective-inactive-border-style") || "dashed";

  // Sub-label + remove ("×") colors
  const subLabelColor = resolveFirst([
    checked ? "chip-sublabel-color-selected" : "chip-sublabel-color",
    "chip-sublabel-color",
  ]);
  const removeColor = isDisabled
    ? textColor
    : resolveFirst([checked ? "chip-remove-color-selected" : "chip-remove-color", "chip-remove-color"]);
  const chipIconStrokeWidth = resolveDimension(brands, brandId, "chip-icon-stroke-width", size);

  // Resolve dimensions
  const chipPaddingX = resolveDimension(brands, brandId, `chip-${variant}-padding-x`, size);
  const chipPaddingY = resolveDimension(brands, brandId, `chip-${variant}-padding-y`, size);
  const chipCheckedPaddingX = resolveDimension(brands, brandId, `chip-${variant}-selected-padding-x`, size);
  const chipCheckedPaddingY = resolveDimension(brands, brandId, `chip-${variant}-selected-padding-y`, size);
  const chipIconSize = resolveDimension(brands, brandId, "chip-icon-size", size);
  const chipFontSize = resolveDimension(brands, brandId, "chip-font-size", size);
  const chipFontFamily = resolveDimension(brands, brandId, "chip-font-family");
  const chipFontWeightDefault = resolveDimension(brands, brandId, "chip-font-weight");
  const chipFontWeightSelected = resolveDimension(brands, brandId, "chip-font-weight-selected");
  const chipFontWeight = checked ? (chipFontWeightSelected ?? chipFontWeightDefault) : chipFontWeightDefault;
  const chipLineHeight = resolveDimension(brands, brandId, "chip-line-height", size);
  const sharedChipRadius = resolveDimension(brands, brandId, "chip-radius", radius || size);
  const variantDefaultChipRadius = resolveDimension(brands, brandId, `chip-${variant}-radius`);
  const chipRadius =
    radius === "default"
      ? (variantDefaultChipRadius ?? sharedChipRadius)
      : sharedChipRadius;
  const chipSpacing = resolveDimension(brands, brandId, "chip-spacing", size);
  const chipBorderWidth = resolveDimension(brands, brandId, "chip-border-width");
  const subLabelFontSize = resolveDimension(brands, brandId, "chip-sublabel-font-size", size);
  const subLabelLineHeight = resolveDimension(brands, brandId, "chip-sublabel-line-height", size);
  const subLabelSpacing = resolveDimension(brands, brandId, "chip-sublabel-spacing");
  const removeSize = resolveDimension(brands, brandId, "chip-remove-size", size);
  const removeStrokeWidth = resolveDimension(brands, brandId, "chip-remove-icon-stroke-width", size);

  const handleChange =
    readOnly || isDisabled || isInactive ? undefined : () => setInternalChecked((v) => !v);

  // Both inactive states (plain "Inactive" and "Selective Inactive") use a dashed
  // border; only the warning "!" marker is exclusive to selective-inactive.
  // Filled/light checked chips normally hide their border (transparent), but a
  // selective-inactive chip is the exception: it always shows its dashed border.
  const borderStyle = isInactive ? selectiveInactiveBorderStyle : "solid";
  // Only a filled + selected chip hides its border (its solid fill carries the
  // shape). Outline and light chips always show their border, as do unchecked
  // chips and any inactive chip (dashed).
  const hideBorder = variant === "filled" && checked && !isInactive;
  const effectiveBorderColor = hideBorder ? "transparent" : borderColor;

  const warningSize = Math.max(12, Math.round(chipIconSize));

  // The checkmark is an independent toggle. Its color always follows the label
  // text color so it stays legible across every variant/state.
  const checkColor = textColor;

  const labelContent = (
    <span style={{ display: "inline-flex", alignItems: "center", gap: chipSpacing }}>
      {showCheckmark ? (
        <svg
          width={chipIconSize}
          height={chipIconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke={checkColor}
          strokeWidth={chipIconStrokeWidth ? (chipIconStrokeWidth / chipIconSize) * 24 : 2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : null}
      <span
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: subLabel ? subLabelSpacing : 0,
        }}
      >
        <span style={{ lineHeight: chipLineHeight ? `${chipLineHeight}px` : undefined }}>
          {label}
        </span>
        {subLabel ? (
          <span
            style={{
              fontSize: subLabelFontSize,
              lineHeight: subLabelLineHeight ? `${subLabelLineHeight}px` : undefined,
              color: subLabelColor,
              fontWeight: 400,
            }}
          >
            {subLabel}
          </span>
        ) : null}
      </span>
      {withRemove ? (
        <svg
          width={removeSize}
          height={removeSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke={removeColor}
          strokeWidth={removeStrokeWidth ? (removeStrokeWidth / removeSize) * 24 : 2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ) : null}
    </span>
  );

  const warningMarker = isSelectiveInactive && variant !== "light" ? (
    <span
      style={{
        position: "absolute",
        // Sit ~2px inside the visible border (offset past the border width).
        bottom: (chipBorderWidth || 1.5) + 2,
        right: (chipBorderWidth || 1.5) + 2,
        width: warningSize,
        height: warningSize,
        borderRadius: "50%",
        background: warningColor,
        color: warningIconColor,
        fontSize: Math.round(warningSize * 0.72),
        fontWeight: 700,
        lineHeight: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1.5px solid ${warningBorderColor}`,
        boxSizing: "border-box",
        pointerEvents: "none",
        zIndex: 2,
      }}
    >
      !
    </span>
  ) : null;

  const chip = (
    <Chip
      checked={checked}
      variant={variant}
      onChange={handleChange}
      readOnly={readOnly || isDisabled || isInactive}
      disabled={isDisabled}
      vars={() => ({
        root: {
          "--chip-fz": `${chipFontSize}px`,
          "--chip-icon-size": `${chipIconSize}px`,
          "--chip-radius": `${chipRadius}px`,
          "--chip-spacing": `${chipSpacing}px`,
          "--chip-bg": bg,
          "--chip-color": textColor,
          "--chip-bd": `${chipBorderWidth}px ${borderStyle} ${effectiveBorderColor}`,
        },
      })}
      styles={{
        // Mantine draws its own checkmark whenever `checked` is true. The checkmark
        // is now an independent toggle, so hide the built-in one and render our own.
        iconWrapper: { display: "none" },
        label: {
          position: "relative",
          overflow: "visible",
          // Height is driven by content + vertical padding (no fixed height cap).
          height: "auto",
          display: "flex",
          alignItems: "center",
          backgroundColor: bg,
          borderColor: effectiveBorderColor,
          borderStyle,
          borderWidth: chipBorderWidth,
          paddingLeft: checked ? chipCheckedPaddingX : chipPaddingX,
          paddingRight: checked ? chipCheckedPaddingX : chipPaddingX,
          paddingTop: checked ? chipCheckedPaddingY : chipPaddingY,
          paddingBottom: checked ? chipCheckedPaddingY : chipPaddingY,
          color: textColor,
          boxShadow: state === "focus" ? `0 0 0 2px ${focusRing}40` : "none",
          fontFamily: chipFontFamily ? `"${chipFontFamily}", sans-serif` : undefined,
          fontWeight: chipFontWeight === "Semi Bold" ? 600 : chipFontWeight === "Bold" ? 700 : 400,
          lineHeight: subLabel ? "normal" : chipLineHeight ? `${chipLineHeight}px` : undefined,
        },
      }}
    >
      {labelContent}
    </Chip>
  );

  if (!warningMarker) return chip;

  // Wrap so the warning marker is positioned against the chip's actual box
  // (bottom-right corner), independent of Mantine's internal label layout.
  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      {chip}
      {warningMarker}
    </span>
  );
}
