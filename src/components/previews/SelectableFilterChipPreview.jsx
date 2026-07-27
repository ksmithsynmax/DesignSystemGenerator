import { useState } from "react";
import { Chip } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function SelectableFilterChipPreview({
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

  const tokens = COMPONENT_TOKENS.selectablefilterchip;
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
      const base = useV ? `selectablefilterchip-${variant}-${prop}` : `selectablefilterchip-${prop}`;
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

  const focusRing = resolveFirst(["selectablefilterchip-focus-ring"]);
  const warningColor = resolveFirst(["selectablefilterchip-selective-inactive-warning-color"]);
  const warningBorderColor = resolveFirst(["selectablefilterchip-selective-inactive-warning-border"]);
  const warningIconColor = resolveFirst(["selectablefilterchip-selective-inactive-warning-icon"]);
  const selectiveInactiveBorderStyle =
    resolveDimension(brands, brandId, "selectablefilterchip-selective-inactive-border-style") || "dashed";

  // Sub-label + remove ("×") colors
  const subLabelColor = resolveFirst([
    checked ? "selectablefilterchip-sublabel-color-selected" : "selectablefilterchip-sublabel-color",
    "selectablefilterchip-sublabel-color",
  ]);
  const removeColor = isDisabled
    ? textColor
    : resolveFirst([checked ? "selectablefilterchip-remove-color-selected" : "selectablefilterchip-remove-color", "selectablefilterchip-remove-color"]);
  const chipIconStrokeWidth = resolveDimension(brands, brandId, "selectablefilterchip-icon-stroke-width", size);

  // Resolve dimensions
  const chipPaddingX = resolveDimension(brands, brandId, "selectablefilterchip-padding-x", size);
  const chipPaddingY = resolveDimension(brands, brandId, "selectablefilterchip-padding-y", size);
  const chipIconSize = resolveDimension(brands, brandId, "selectablefilterchip-icon-size", size);
  const chipFontSize = resolveDimension(brands, brandId, "selectablefilterchip-font-size", size);
  const chipFontFamily = resolveDimension(brands, brandId, "selectablefilterchip-font-family");
  const chipFontWeightDefault = resolveDimension(brands, brandId, "selectablefilterchip-font-weight");
  const chipFontWeightSelected = resolveDimension(brands, brandId, "selectablefilterchip-font-weight-selected");
  const chipFontWeightInactive = resolveDimension(brands, brandId, "selectablefilterchip-font-weight-inactive");
  const chipFontWeightSelectedInactive = resolveDimension(brands, brandId, "selectablefilterchip-font-weight-selected-inactive");
  const chipFontWeight =
    checked && isInactive
      ? (chipFontWeightSelectedInactive ?? chipFontWeightDefault)
      : checked
        ? (chipFontWeightSelected ?? chipFontWeightDefault)
        : isInactive
          ? (chipFontWeightInactive ?? chipFontWeightDefault)
          : chipFontWeightDefault;
  const chipLineHeight = resolveDimension(brands, brandId, "selectablefilterchip-line-height", size);
  const chipRadius = resolveDimension(brands, brandId, "selectablefilterchip-radius", radius || size);
  const chipSpacing = resolveDimension(brands, brandId, "selectablefilterchip-spacing", size);
  const chipBorderWidth = resolveDimension(brands, brandId, "selectablefilterchip-border-width");
  const subLabelFontSize = resolveDimension(brands, brandId, "selectablefilterchip-sublabel-font-size", size);
  const subLabelLineHeight = resolveDimension(brands, brandId, "selectablefilterchip-sublabel-line-height", size);
  const subLabelSpacing = resolveDimension(brands, brandId, "selectablefilterchip-sublabel-spacing");
  const removeSize = resolveDimension(brands, brandId, "selectablefilterchip-remove-size", size);
  const removeStrokeWidth = resolveDimension(brands, brandId, "selectablefilterchip-remove-icon-stroke-width", size);

  const handleChange =
    readOnly || isDisabled || isInactive ? undefined : () => setInternalChecked((v) => !v);

  // Both inactive states (plain "Inactive" and "Selective Inactive") use a dashed
  // border; only the warning "!" marker is exclusive to selective-inactive.
  // Filled/light checked chips normally hide their border (transparent), but a
  // selective-inactive chip is the exception: it always shows its dashed border.
  const borderStyle = isInactive ? selectiveInactiveBorderStyle : "solid";
  // Filter chips have no variant styling; the border is always shown (its color
  // comes from the border token for the current selective/interaction state).
  const effectiveBorderColor = borderColor;

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
          paddingLeft: chipPaddingX,
          paddingRight: chipPaddingX,
          paddingTop: chipPaddingY,
          paddingBottom: chipPaddingY,
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
