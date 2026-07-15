import { useState } from "react";
import ChevronRightIcon from "@untitledui-icons/react/line/ChevronRightIcon";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

const ALL_OPTIONS = ["Option one", "Option two", "Option three"];

export default function SelectPreview({
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
  placeholder = "Pick one",
  state,
  disabled,
  showDropdown = false,
  onToggleDropdown,
  onCloseDropdown,
  interactive = false,
}) {
  const tokens = COMPONENT_TOKENS.select;
  const prefix = `select-${variant}`;
  const effectiveRadius = variant === "default" ? "default" : radius;

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
  const resolveSelectColorToken = (tokenNames, fallback = "transparent") => {
    for (const tokenName of tokenNames) {
      const semantic = tokens[tokenName]?.semantic;
      if (!semantic) continue;
      return resolveColor(brands, brandId, semantic, "light", tokenName);
    }
    return fallback;
  };

  const textColor = isDisabled
    ? resolveColor(
        brands,
        brandId,
        tokens[`${prefix}-text-disabled`]?.semantic ?? tokens["select-text"]?.semantic,
        "light",
        tokens[`${prefix}-text-disabled`] ? `${prefix}-text-disabled` : "select-text"
      )
    : resolveColor(brands, brandId, tokens["select-text"]?.semantic, "light", "select-text");
  // The hover/error colors apply only to the trigger value text (under the
  // label), never to the dropdown option rows.
  const triggerValueColor = isDisabled
    ? textColor
    : isError
      ? resolveColor(
          brands,
          brandId,
          tokens["select-text-error"]?.semantic ?? tokens["select-text"]?.semantic,
          "light",
          tokens["select-text-error"] ? "select-text-error" : "select-text"
        )
      : isHover
        ? resolveColor(
            brands,
            brandId,
            tokens[`${prefix}-text-hover`]?.semantic ?? tokens["select-text"]?.semantic,
            "light",
            tokens[`${prefix}-text-hover`] ? `${prefix}-text-hover` : "select-text"
          )
        : textColor;
  const placeholderColor = resolveSelectColorToken(
    isError
      ? [
          `${prefix}-placeholder-error`,
          "select-placeholder-error",
          `${prefix}-placeholder`,
        ]
      : [`${prefix}-placeholder`]
  );
  const labelColor = isDisabled
    ? resolveColor(
        brands,
        brandId,
        tokens[`${prefix}-label-disabled`]?.semantic ?? tokens["select-label-color"]?.semantic,
        "light",
        tokens[`${prefix}-label-disabled`] ? `${prefix}-label-disabled` : "select-label-color"
      )
    : resolveColor(brands, brandId, tokens["select-label-color"]?.semantic, "light", "select-label-color");
  const asteriskColor = resolveColor(brands, brandId, tokens["select-asterisk-color"]?.semantic, "light", "select-asterisk-color");
  const errorColor = resolveColor(brands, brandId, tokens["select-error-color"]?.semantic, "light", "select-error-color");
  const iconSemantic = isDisabled
    ? tokens[`${prefix}-icon-disabled`]?.semantic ?? tokens["select-icon"]?.semantic
    : isError
      ? tokens["select-icon-error"]?.semantic ??
        tokens["select-icon"]?.semantic
      : isHover
        ? tokens[`${prefix}-icon-hover`]?.semantic ??
          tokens["select-icon"]?.semantic
        : tokens["select-icon"]?.semantic;
  const iconColorKey = isDisabled
    ? (tokens[`${prefix}-icon-disabled`] ? `${prefix}-icon-disabled` : "select-icon")
    : isError
      ? "select-icon-error"
      : isHover
        ? (tokens[`${prefix}-icon-hover`] ? `${prefix}-icon-hover` : "select-icon")
        : "select-icon";
  const chevronColor = resolveColor(brands, brandId, iconSemantic, "light", iconColorKey);
  const focusRingColor = resolveColor(brands, brandId, tokens["select-focus-ring"]?.semantic, "light", "select-focus-ring");
  const dropdownBackground = resolveSelectColorToken([`${prefix}-dropdown-background`]);
  const dropdownBorderColor = resolveSelectColorToken([`${prefix}-dropdown-border`]);
  const optionSelectedBackground = resolveSelectColorToken([`${prefix}-option-selected-background`]);
  const optionSelectedText = resolveSelectColorToken([`${prefix}-option-selected-text`, "select-text"]);
  const optionHoverBackground = resolveSelectColorToken([`${prefix}-option-hover-background`]);
  const optionHoverText = resolveSelectColorToken([`${prefix}-option-hover-text`]);

  const fontSize = resolveDimension(brands, brandId, "select-font-size", size);
  const fontFamily = resolveDimension(brands, brandId, `${prefix}-font-family`);
  const fontWeight = resolveDimension(brands, brandId, `${prefix}-font-weight`);
  const lineHeight = resolveDimension(brands, brandId, "select-line-height", size);
  const variantPaddingXToken = variant === "filled" ? "select-filled-padding-x" : "select-default-padding-x";
  const variantPaddingYToken = variant === "filled" ? "select-filled-padding-y" : "select-default-padding-y";
  const paddingX = resolveDimension(brands, brandId, variantPaddingXToken, size);
  const paddingY = resolveDimension(brands, brandId, variantPaddingYToken, size);
  const borderRadius = resolveDimension(brands, brandId, "select-radius", effectiveRadius);
  const borderWidth = resolveDimension(brands, brandId, "select-border-width");
  const labelFontSize = resolveDimension(brands, brandId, "select-label-font-size");
  const labelFontFamily = resolveDimension(brands, brandId, "select-label-font-family");
  const labelFontWeight = resolveDimension(brands, brandId, "select-label-font-weight");
  const labelLineHeight = resolveDimension(brands, brandId, "select-label-line-height");
  const labelGap = resolveDimension(brands, brandId, "select-label-gap");
  const errorFontSize = resolveDimension(brands, brandId, "select-error-font-size");
  const errorFontFamily = resolveDimension(brands, brandId, "select-error-font-family");
  const errorFontWeight = resolveDimension(brands, brandId, "select-error-font-weight");
  const errorLineHeight = resolveDimension(brands, brandId, "select-error-line-height");
  const errorGap = resolveDimension(brands, brandId, "select-error-gap");
  const sectionSize = resolveDimension(brands, brandId, "select-icon-size", size);
  const iconStrokeWidth = resolveDimension(brands, brandId, "select-icon-stroke-width", size);

  const bdValue = `${borderWidth}px solid ${borderColor}`;
  const dropdownBdValue = `${borderWidth}px solid ${dropdownBorderColor}`;
  const chevronIconSize = Math.max(8, Math.round((Number(sectionSize) || 20) * 0.7));
  const fontWeightValue = fontWeight === "Semi Bold" ? 600 : fontWeight === "Bold" ? 700 : 400;
  const labelFontWeightValue = labelFontWeight === "Semi Bold" ? 600 : labelFontWeight === "Bold" ? 700 : 400;
  const errorFontWeightValue = errorFontWeight === "Semi Bold" ? 600 : errorFontWeight === "Bold" ? 700 : 400;

  const [selectedValue, setSelectedValue] = useState("Option one");
  const [hoveredOption, setHoveredOption] = useState(null);
  const canInteract = interactive && !isDisabled;
  const displayValue = interactive ? selectedValue : "Option one";
  const triggerTextColor = isError && !displayValue ? placeholderColor : triggerValueColor;
  // The dropdown never shows in the error or disabled states; both are
  // closed-field states.
  const dropdownOpen = showDropdown && !isError && !isDisabled;

  const selectOption = (opt) => {
    if (!canInteract) return;
    setSelectedValue(opt);
    if (onCloseDropdown) onCloseDropdown();
  };

  const renderDropdown = () => (
    <div
      style={{
        marginTop: 4,
        backgroundColor: dropdownBackground,
        border: dropdownBdValue,
        borderRadius: borderRadius,
        padding: 8,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {ALL_OPTIONS.map((opt) => {
        const isSelected = displayValue === opt;
        const isOptionHover = canInteract && hoveredOption === opt;
        const rowBackground = isSelected
          ? optionSelectedBackground
          : isOptionHover
            ? optionHoverBackground
            : "transparent";
        const rowColor = isOptionHover
          ? optionHoverText
          : isSelected
            ? optionSelectedText
            : textColor;
        return (
          <div
            key={opt}
            onClick={() => selectOption(opt)}
            onMouseEnter={canInteract ? () => setHoveredOption(opt) : undefined}
            onMouseLeave={canInteract ? () => setHoveredOption(null) : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "6px 8px",
              borderRadius: borderRadius,
              backgroundColor: rowBackground,
              color: rowColor,
              fontSize,
              fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : undefined,
              fontWeight: fontWeightValue,
              lineHeight: lineHeight ? `${lineHeight}px` : undefined,
              whiteSpace: "nowrap",
              cursor: canInteract ? "pointer" : "default",
            }}
          >
            {opt}
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ width: "100%" }}>
      {showLabel && (
        <div
          style={{
            color: labelColor,
            fontSize: labelFontSize,
            fontFamily: labelFontFamily ? `"${labelFontFamily}", sans-serif` : undefined,
            fontWeight: labelFontWeightValue,
            lineHeight: labelLineHeight ? `${labelLineHeight}px` : undefined,
            marginBottom: labelGap,
          }}
        >
          {labelText}
          {withAsterisk ? <span style={{ color: asteriskColor }}> *</span> : null}
        </div>
      )}
      <div
        onClick={isDisabled ? undefined : onToggleDropdown}
        style={{
          backgroundColor: bg,
          color: triggerTextColor,
          border: bdValue,
          borderRadius: borderRadius,
          paddingLeft: paddingX,
          paddingRight: paddingX,
          paddingTop: paddingY,
          paddingBottom: paddingY,
          fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : undefined,
          fontWeight: fontWeightValue,
          lineHeight: lineHeight ? `${lineHeight}px` : undefined,
          fontSize,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 8,
          width: "100%",
          boxSizing: "border-box",
          opacity: isDisabled ? 0.6 : 1,
          cursor: !isDisabled && onToggleDropdown ? "pointer" : "default",
          ...(isFocus ? { boxShadow: `0 0 0 2px ${focusRingColor}40` } : {}),
        }}
      >
        <span
          style={{
            color: displayValue ? triggerTextColor : placeholderColor,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flex: variant === "default" ? "0 1 auto" : 1,
          }}
        >
          {displayValue || placeholder}
        </span>
        <ChevronRightIcon
          width={chevronIconSize}
          height={chevronIconSize}
          strokeWidth={Number.isFinite(Number(iconStrokeWidth)) ? Number(iconStrokeWidth) : 2}
          aria-hidden
          style={{
            color: chevronColor,
            transform: dropdownOpen ? "rotate(270deg)" : "rotate(90deg)",
            display: "block",
            flexShrink: 0,
          }}
        />
      </div>
      {dropdownOpen && renderDropdown()}
      {isError && (
        <div
          style={{
            color: errorColor,
            fontSize: errorFontSize,
            fontFamily: errorFontFamily ? `"${errorFontFamily}", sans-serif` : undefined,
            fontWeight: errorFontWeightValue,
            lineHeight: errorLineHeight ? `${errorLineHeight}px` : undefined,
            marginTop: errorGap,
          }}
        >
          {errorText}
        </div>
      )}
    </div>
  );
}
