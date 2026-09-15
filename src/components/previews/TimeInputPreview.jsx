import { useMemo, useState } from "react";
import { TextInput } from "@mantine/core";
import ClockIcon from "@untitledui-icons/react/line/ClockIcon";
import { resolveColor, resolveDimension, getDefaultSizeKey } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

// TimeInput is a text field with a fixed clock icon in the right section
// (mirrors DateInputPreview / TextInputPreview). Clicking the field opens a
// token-driven hour / minute / AM–PM column picker (like Mantine's TimePicker),
// so each part of the time is independently selectable while still using the
// same option/dropdown tokens as the rest of the design system's dropdowns.

// Column data for the 12-hour clock picker.
const HOURS = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i)); // 12, 1, 2 … 11
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 0 … 59
const PERIODS = ["AM", "PM"];
const pad2 = (n) => String(n).padStart(2, "0");

export default function TimeInputPreview({
  brands,
  brandId,
  variant = "default",
  size = "sm",
  radius = "sm",
  showLabel = true,
  labelText = "Label",
  withAsterisk = false,
  showError = false,
  errorText = "Error message",
  placeholder = "HH:MM",
  state,
  disabled,
  showDropdown = false,
  onToggleDropdown,
}) {
  const tokens = COMPONENT_TOKENS.timeinput;
  const prefix = `timeinput-${variant}`;

  // Picker state: 12-hour clock split into hour / minute / period so each column
  // is independently selectable (the old single "HH:MM" list couldn't set AM/PM).
  const [hour, setHour] = useState(9); // 1–12
  const [minute, setMinute] = useState(0); // 0–59
  const [period, setPeriod] = useState("AM");

  const isDisabled = disabled || state === "disabled";
  const isError = showError || state === "error";
  const isFocus = state === "focus";
  const isHover = state === "hover";

  const stateSuffix = isDisabled
    ? "-disabled"
    : isError
    ? "-error"
    : isFocus
    ? "-focus"
    : isHover
    ? "-hover"
    : "";

  const bgKey = `${prefix}-background${stateSuffix}`;
  const borderKey = `${prefix}-border${stateSuffix}`;

  const bg = resolveColor(brands, brandId, tokens[bgKey]?.semantic, "light", bgKey);
  const borderColor = resolveColor(brands, brandId, tokens[borderKey]?.semantic, "light", borderKey);

  const textColor = isDisabled
    ? resolveColor(brands, brandId, tokens["timeinput-text-disabled"]?.semantic, "light", "timeinput-text-disabled")
    : isError
    ? resolveColor(brands, brandId, tokens["timeinput-text-error"]?.semantic, "light", "timeinput-text-error")
    : resolveColor(brands, brandId, tokens["timeinput-text"]?.semantic, "light", "timeinput-text");
  const placeholderColor = isDisabled
    ? resolveColor(
        brands,
        brandId,
        tokens[`${prefix}-placeholder-disabled`]?.semantic ?? tokens["timeinput-placeholder"]?.semantic,
        "light",
        tokens[`${prefix}-placeholder-disabled`] ? `${prefix}-placeholder-disabled` : "timeinput-placeholder"
      )
    : isError
    ? resolveColor(brands, brandId, tokens["timeinput-placeholder-error"]?.semantic, "light", "timeinput-placeholder-error")
    : resolveColor(brands, brandId, tokens["timeinput-placeholder"]?.semantic, "light", "timeinput-placeholder");
  const labelColor = isDisabled
    ? resolveColor(brands, brandId, tokens["timeinput-label-color-disabled"]?.semantic, "light", "timeinput-label-color-disabled")
    : resolveColor(brands, brandId, tokens["timeinput-label-color"]?.semantic, "light", "timeinput-label-color");
  const asteriskColor = resolveColor(brands, brandId, tokens["timeinput-asterisk-color"]?.semantic, "light", "timeinput-asterisk-color");
  const errorColor = resolveColor(brands, brandId, tokens["timeinput-error-color"]?.semantic, "light", "timeinput-error-color");
  const focusRingColor = resolveColor(brands, brandId, tokens["timeinput-focus-ring"]?.semantic, "light", "timeinput-focus-ring");

  // Dropdown / option colors (Select-style).
  const dropdownBg = resolveColor(brands, brandId, tokens["timeinput-dropdown-background"]?.semantic, "light", "timeinput-dropdown-background");
  const dropdownBorder = resolveColor(brands, brandId, tokens["timeinput-dropdown-border"]?.semantic, "light", "timeinput-dropdown-border");
  const optionText = resolveColor(brands, brandId, tokens["timeinput-option-text"]?.semantic, "light", "timeinput-option-text");
  const optionSelBg = resolveColor(brands, brandId, tokens["timeinput-option-selected-background"]?.semantic, "light", "timeinput-option-selected-background");
  const optionSelText = resolveColor(brands, brandId, tokens["timeinput-option-selected-text"]?.semantic, "light", "timeinput-option-selected-text");
  const optionHoverBg = resolveColor(brands, brandId, tokens["timeinput-option-hover-background"]?.semantic, "light", "timeinput-option-hover-background");
  const optionHoverText = resolveColor(brands, brandId, tokens["timeinput-option-hover-text"]?.semantic, "light", "timeinput-option-hover-text");

  const height = resolveDimension(brands, brandId, "timeinput-height", size);
  const fontSize = resolveDimension(brands, brandId, "timeinput-font-size", size);
  const fontFamily = resolveDimension(brands, brandId, "timeinput-font-family");
  const fontWeight = resolveDimension(brands, brandId, "timeinput-font-weight");
  const lineHeight = resolveDimension(brands, brandId, "timeinput-line-height", size);
  const paddingX = resolveDimension(brands, brandId, "timeinput-padding-x", size);
  const paddingY = resolveDimension(brands, brandId, "timeinput-padding-y", size);
  const iconSize = resolveDimension(brands, brandId, "timeinput-icon-size", size) ?? 16;
  const iconStrokeWidth = resolveDimension(brands, brandId, "timeinput-icon-stroke-width", size);
  const iconGap = resolveDimension(brands, brandId, "timeinput-icon-gap", size) ?? 8;
  const sectionSize = resolveDimension(brands, brandId, "timeinput-section-size", size) ?? iconSize + iconGap * 2;
  const borderRadius = resolveDimension(brands, brandId, "timeinput-radius", radius);
  const borderWidth = resolveDimension(brands, brandId, "timeinput-border-width");
  const labelFontSize = resolveDimension(brands, brandId, "timeinput-label-font-size", size);
  const labelFontFamily = resolveDimension(brands, brandId, "timeinput-label-font-family");
  const labelFontWeight = resolveDimension(brands, brandId, "timeinput-label-font-weight");
  const labelLineHeight = resolveDimension(brands, brandId, "timeinput-label-line-height");
  const labelGap = resolveDimension(brands, brandId, "timeinput-label-gap", size);
  const errorFontSize = resolveDimension(brands, brandId, "timeinput-error-font-size");
  const errorFontFamily = resolveDimension(brands, brandId, "timeinput-error-font-family");
  const errorFontWeight = resolveDimension(brands, brandId, "timeinput-error-font-weight");
  const errorLineHeight = resolveDimension(brands, brandId, "timeinput-error-line-height");
  const errorGap = resolveDimension(brands, brandId, "timeinput-error-gap");

  // Dropdown dims.
  const dropdownRadius = resolveDimension(brands, brandId, "timeinput-dropdown-radius");
  const dropdownBorderWidth = resolveDimension(brands, brandId, "timeinput-dropdown-border-width");
  const dropdownPadding = resolveDimension(brands, brandId, "timeinput-dropdown-padding");
  const dropdownMaxHeight = resolveDimension(brands, brandId, "timeinput-dropdown-max-height") ?? 200;
  const optionFontSize = resolveDimension(brands, brandId, "timeinput-option-font-size", size);
  const optionRadius = resolveDimension(brands, brandId, "timeinput-option-radius");
  const optionPaddingX = resolveDimension(brands, brandId, "timeinput-option-padding-x", size);
  const optionPaddingY = resolveDimension(brands, brandId, "timeinput-option-padding-y", size);

  const bdValue = `${borderWidth}px solid ${borderColor}`;
  const mantineSize = size === "default" ? getDefaultSizeKey(brands, brandId, "timeinput-height") || "sm" : size;
  const mantineRadius = radius === "default" ? getDefaultSizeKey(brands, brandId, "timeinput-radius") || "sm" : radius;
  const iconColorKey = `${prefix}-icon${stateSuffix}`;
  const iconColor = resolveColor(
    brands,
    brandId,
    tokens[iconColorKey]?.semantic ?? tokens[`${prefix}-icon`]?.semantic,
    "light",
    tokens[iconColorKey] ? iconColorKey : `${prefix}-icon`
  );
  const iconProps = {
    width: iconSize,
    height: iconSize,
    strokeWidth: Number.isFinite(Number(iconStrokeWidth)) ? Number(iconStrokeWidth) : 2,
    style: { color: iconColor },
  };

  const [hovered, setHovered] = useState(null);

  // The dropdown never shows in the error or disabled states.
  const canInteract = !isDisabled && !isError;
  const dropdownOpen = showDropdown && canInteract;

  const displayValue = useMemo(
    () => `${pad2(hour)}:${pad2(minute)} ${period}`,
    [hour, minute, period]
  );

  // One picker cell, styled from the shared option tokens. `colKey` doubles as
  // the hover identity so only the hovered cell (across all columns) highlights.
  const renderOption = (colKey, label, isSelected, onSelect) => {
    const isHovered = hovered === colKey;
    const optBg = isSelected ? optionSelBg : isHovered ? optionHoverBg : "transparent";
    const optColor = isSelected ? optionSelText : isHovered ? optionHoverText : optionText;
    return (
      <div
        key={colKey}
        onMouseEnter={() => setHovered(colKey)}
        onMouseLeave={() => setHovered(null)}
        onClick={onSelect}
        style={{
          padding: `${optionPaddingY}px ${optionPaddingX}px`,
          borderRadius: optionRadius,
          background: optBg,
          color: optColor,
          fontSize: optionFontSize,
          lineHeight: 1.4,
          cursor: "pointer",
          userSelect: "none",
          textAlign: "center",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {label}
      </div>
    );
  };

  const columnStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    flex: 1,
    minWidth: 0,
    maxHeight: dropdownMaxHeight,
    overflowY: "auto",
  };

  return (
    <div style={{ width: "100%" }}>
      <TextInput
        size={mantineSize}
        radius={mantineRadius}
        label={showLabel ? labelText : undefined}
        withAsterisk={showLabel && withAsterisk}
        placeholder={placeholder}
        value={displayValue}
        readOnly
        error={isError ? errorText : undefined}
        disabled={isDisabled}
        onClick={canInteract ? onToggleDropdown : undefined}
        rightSection={<ClockIcon {...iconProps} />}
        rightSectionPointerEvents="none"
        vars={() => ({
          root: {
            "--input-height": `${height}px`,
            "--input-fz": `${fontSize}px`,
            "--input-radius": `${borderRadius}px`,
            "--input-padding-x": `${paddingX}px`,
            "--input-padding-y": `${paddingY}px`,
            "--input-left-section-size": `${sectionSize}px`,
            "--input-right-section-size": `${sectionSize}px`,
            "--input-section-size": `${sectionSize}px`,
          },
        })}
        styles={{
          label: {
            color: labelColor,
            fontSize: labelFontSize,
            fontFamily: labelFontFamily ? `"${labelFontFamily}", sans-serif` : undefined,
            fontWeight: labelFontWeight === "Semi Bold" ? 600 : labelFontWeight === "Bold" ? 700 : 400,
            lineHeight: labelLineHeight ? `${labelLineHeight}px` : undefined,
            marginBottom: labelGap,
          },
          input: {
            backgroundColor: bg,
            color: textColor,
            border: bdValue,
            borderRadius: `${borderRadius}px`,
            height: "auto",
            minHeight: 0,
            paddingTop: `${paddingY}px`,
            paddingBottom: `${paddingY}px`,
            paddingLeft: `${paddingX}px`,
            paddingRight: `${sectionSize}px`,
            cursor: canInteract && onToggleDropdown ? "pointer" : undefined,
            "--input-placeholder-color": placeholderColor,
            fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : undefined,
            fontWeight: fontWeight === "Semi Bold" ? 600 : fontWeight === "Bold" ? 700 : 400,
            lineHeight: lineHeight ? `${lineHeight}px` : undefined,
            ...(isFocus ? { boxShadow: `0 0 0 2px ${focusRingColor}40` } : {}),
          },
          error: {
            color: errorColor,
            fontSize: errorFontSize,
            fontFamily: errorFontFamily ? `"${errorFontFamily}", sans-serif` : undefined,
            fontWeight: errorFontWeight === "Semi Bold" ? 600 : errorFontWeight === "Bold" ? 700 : 400,
            lineHeight: errorLineHeight ? `${errorLineHeight}px` : undefined,
            marginTop: errorGap,
          },
          required: {
            color: asteriskColor,
          },
        }}
      />
      {dropdownOpen && (
        <div
          style={{
            marginTop: 4,
            background: dropdownBg,
            border: `${dropdownBorderWidth}px solid ${dropdownBorder}`,
            borderRadius: dropdownRadius,
            padding: dropdownPadding,
            display: "flex",
            gap: 4,
            fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : undefined,
          }}
        >
          {/* Hours column (12-hour clock) */}
          <div style={columnStyle}>
            {HOURS.map((h) => renderOption(`h-${h}`, pad2(h), h === hour, () => setHour(h)))}
          </div>
          {/* Minutes column */}
          <div style={columnStyle}>
            {MINUTES.map((m) => renderOption(`m-${m}`, pad2(m), m === minute, () => setMinute(m)))}
          </div>
          {/* AM / PM column */}
          <div style={columnStyle}>
            {PERIODS.map((p) => renderOption(`p-${p}`, p, p === period, () => setPeriod(p)))}
          </div>
        </div>
      )}
    </div>
  );
}
