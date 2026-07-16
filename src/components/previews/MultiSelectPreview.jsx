import { useState } from "react";
import ChevronRightIcon from "@untitledui-icons/react/line/ChevronRightIcon";
import CheckIcon from "@untitledui-icons/react/line/CheckIcon";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

const ALL_OPTIONS = ["Option one", "Option two", "Option three"];

export default function MultiSelectPreview({
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
  placeholder = "Pick options",
  state,
  disabled,
  showDropdown = false,
  onToggleDropdown,
  interactive = false,
}) {
  const tokens = COMPONENT_TOKENS.multiselect;
  const prefix = `multiselect-${variant}`;
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
  const resolveMultiSelectColorToken = (tokenNames, fallback = "transparent") => {
    for (const tokenName of tokenNames) {
      const semantic = tokens[tokenName]?.semantic;
      if (!semantic) continue;
      return resolveColor(brands, brandId, semantic, "light", tokenName);
    }
    return fallback;
  };

  const textColor = isDisabled
    ? resolveColor(brands, brandId, tokens["multiselect-text-disabled"]?.semantic, "light", "multiselect-text-disabled")
    : resolveColor(brands, brandId, tokens["multiselect-text"]?.semantic, "light", "multiselect-text");
  const placeholderColor = resolveMultiSelectColorToken(
    isError
      ? [
          `${prefix}-placeholder-error`,
          "multiselect-placeholder-error",
          `${prefix}-placeholder`,
        ]
      : [`${prefix}-placeholder`]
  );
  const labelColor = isDisabled
    ? resolveColor(
        brands,
        brandId,
        tokens[`${prefix}-label-disabled`]?.semantic ?? tokens["multiselect-label-color"]?.semantic,
        "light",
        tokens[`${prefix}-label-disabled`] ? `${prefix}-label-disabled` : "multiselect-label-color"
      )
    : resolveColor(brands, brandId, tokens["multiselect-label-color"]?.semantic, "light", "multiselect-label-color");
  const asteriskColor = resolveColor(brands, brandId, tokens["multiselect-asterisk-color"]?.semantic, "light", "multiselect-asterisk-color");
  const errorColor = resolveColor(brands, brandId, tokens["multiselect-error-color"]?.semantic, "light", "multiselect-error-color");
  const iconSemantic = isDisabled
    ? tokens["multiselect-icon-disabled"]?.semantic
    : isError
      ? tokens["multiselect-icon-error"]?.semantic ??
        tokens["multiselect-icon"]?.semantic
      : tokens["multiselect-icon"]?.semantic;
  const iconColorKey = isDisabled ? "multiselect-icon-disabled" : isError ? "multiselect-icon-error" : "multiselect-icon";
  const chevronColor = resolveColor(brands, brandId, iconSemantic, "light", iconColorKey);
  const focusRingColor = resolveColor(brands, brandId, tokens["multiselect-focus-ring"]?.semantic, "light", "multiselect-focus-ring");
  const dropdownBackground = resolveMultiSelectColorToken([`${prefix}-dropdown-background`]);
  const dropdownBorderColor = resolveMultiSelectColorToken([`${prefix}-dropdown-border`]);
  const optionSelectedBackground = resolveMultiSelectColorToken([`${prefix}-option-selected-background`]);
  const optionSelectedText = resolveMultiSelectColorToken([`${prefix}-option-selected-text`, "multiselect-text"]);
  const optionHoverBackground = resolveMultiSelectColorToken([`${prefix}-option-hover-background`]);
  const optionHoverText = resolveMultiSelectColorToken([`${prefix}-option-hover-text`]);
  const optionCheckColor = resolveMultiSelectColorToken(["multiselect-option-check-icon"]);
  const pillBackground = resolveMultiSelectColorToken(
    isDisabled
      ? ["multiselect-pill-background-disabled", `${prefix}-pill-background`]
      : isError
        ? ["multiselect-pill-background-error", `${prefix}-pill-background`]
        : [`${prefix}-pill-background`]
  );
  const pillText = resolveMultiSelectColorToken(
    isDisabled
      ? ["multiselect-pill-text-disabled", "multiselect-pill-text"]
      : isError
        ? ["multiselect-pill-text-error", "multiselect-pill-text"]
        : ["multiselect-pill-text"]
  );
  const pillRemoveIcon = resolveMultiSelectColorToken(
    isDisabled
      ? ["multiselect-pill-remove-icon-disabled", "multiselect-pill-remove-icon"]
      : isError
        ? ["multiselect-pill-remove-icon-error", "multiselect-pill-remove-icon"]
        : ["multiselect-pill-remove-icon"]
  );

  const fontSize = resolveDimension(brands, brandId, "multiselect-font-size", size);
  const fontFamily = resolveDimension(brands, brandId, `${prefix}-font-family`);
  const fontWeight = resolveDimension(brands, brandId, `${prefix}-font-weight`);
  const lineHeight = resolveDimension(brands, brandId, "multiselect-line-height", size);
  const variantPaddingXToken = variant === "filled" ? "multiselect-filled-padding-x" : "multiselect-default-padding-x";
  const variantPaddingYToken = variant === "filled" ? "multiselect-filled-padding-y" : "multiselect-default-padding-y";
  const paddingX = resolveDimension(brands, brandId, variantPaddingXToken, size);
  const paddingY = resolveDimension(brands, brandId, variantPaddingYToken, size);
  const borderRadius = resolveDimension(brands, brandId, "multiselect-radius", effectiveRadius);
  const borderWidth = resolveDimension(brands, brandId, "multiselect-border-width");
  const labelFontSize = resolveDimension(brands, brandId, "multiselect-label-font-size");
  const labelFontFamily = resolveDimension(brands, brandId, "multiselect-label-font-family");
  const labelFontWeight = resolveDimension(brands, brandId, "multiselect-label-font-weight");
  const labelLineHeight = resolveDimension(brands, brandId, "multiselect-label-line-height");
  const labelGap = resolveDimension(brands, brandId, "multiselect-label-gap");
  const errorFontSize = resolveDimension(brands, brandId, "multiselect-error-font-size");
  const errorFontFamily = resolveDimension(brands, brandId, "multiselect-error-font-family");
  const errorFontWeight = resolveDimension(brands, brandId, "multiselect-error-font-weight");
  const errorLineHeight = resolveDimension(brands, brandId, "multiselect-error-line-height");
  const errorGap = resolveDimension(brands, brandId, "multiselect-error-gap");
  const pillFontSize = resolveDimension(brands, brandId, "multiselect-pill-font-size", size);
  const pillGap = resolveDimension(brands, brandId, "multiselect-pill-gap");
  const pillRadius = resolveDimension(brands, brandId, "multiselect-pill-radius", effectiveRadius);
  const sectionSize = resolveDimension(brands, brandId, "multiselect-icon-size", size);
  const iconStrokeWidth = resolveDimension(brands, brandId, "multiselect-icon-stroke-width", size);
  const dropdownMaxHeight = resolveDimension(brands, brandId, "multiselect-dropdown-max-height");

  const bdValue = `${borderWidth}px solid ${borderColor}`;
  const dropdownBdValue = `${borderWidth}px solid ${dropdownBorderColor}`;
  const chevronIconSize = Math.max(8, Math.round((Number(sectionSize) || 20) * 0.7));
  const optionCheckSize = Math.max(12, Math.round(Number(fontSize) || 16));
  const fontWeightValue = fontWeight === "Semi Bold" ? 600 : fontWeight === "Bold" ? 700 : 400;
  const labelFontWeightValue = labelFontWeight === "Semi Bold" ? 600 : labelFontWeight === "Bold" ? 700 : 400;
  const errorFontWeightValue = errorFontWeight === "Semi Bold" ? 600 : errorFontWeight === "Bold" ? 700 : 400;

  const [selectedValues, setSelectedValues] = useState(["Option one"]);
  const [hoveredOption, setHoveredOption] = useState(null);
  const canInteract = interactive && !isDisabled;
  const canShowDropdown = showDropdown && !isError && !isDisabled;
  const displayValues = interactive ? selectedValues : ["Option one", "Option two"];

  const toggleValue = (opt) => {
    if (!canInteract) return;
    setSelectedValues((prev) =>
      prev.includes(opt) ? prev.filter((v) => v !== opt) : [...prev, opt]
    );
  };
  const removeValue = (opt) => {
    if (!canInteract) return;
    setSelectedValues((prev) => prev.filter((v) => v !== opt));
  };

  const renderPill = (label) => (
    <span
      key={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        backgroundColor: pillBackground,
        color: pillText,
        borderRadius: pillRadius,
        fontSize: pillFontSize,
        lineHeight: 1,
        padding: "3px 6px",
        whiteSpace: "nowrap",
        boxSizing: "border-box",
      }}
    >
      {label}
      <span
        aria-hidden
        onClick={
          canInteract
            ? (e) => {
                e.stopPropagation();
                removeValue(label);
              }
            : undefined
        }
        style={{
          color: pillRemoveIcon,
          fontSize: pillFontSize,
          lineHeight: 1,
          cursor: canInteract ? "pointer" : "default",
        }}
      >
        ×
      </span>
    </span>
  );

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
        maxHeight: dropdownMaxHeight ? `${dropdownMaxHeight}px` : undefined,
        overflowY: "auto",
      }}
    >
      {ALL_OPTIONS.map((opt) => {
        const isSelected = displayValues.includes(opt);
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
            onClick={() => toggleValue(opt)}
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
            <span
              aria-hidden
              style={{
                width: optionCheckSize,
                marginRight: 8,
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isSelected ? (
                <CheckIcon
                  width={optionCheckSize}
                  height={optionCheckSize}
                  strokeWidth={Number.isFinite(Number(iconStrokeWidth)) ? Number(iconStrokeWidth) : 2}
                  style={{ color: optionCheckColor, display: "block" }}
                />
              ) : null}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>{opt}</span>
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
          color: textColor,
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
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: pillGap, flex: 1, minWidth: 0 }}>
          {displayValues.length > 0 ? (
            displayValues.map((v) => renderPill(v))
          ) : (
            <span style={{ color: placeholderColor, whiteSpace: "nowrap" }}>{placeholder}</span>
          )}
        </div>
        <ChevronRightIcon
          width={chevronIconSize}
          height={chevronIconSize}
          strokeWidth={Number.isFinite(Number(iconStrokeWidth)) ? Number(iconStrokeWidth) : 2}
          aria-hidden
          style={{
            color: chevronColor,
            transform: canShowDropdown ? "rotate(270deg)" : "rotate(90deg)",
            display: "block",
            flexShrink: 0,
          }}
        />
      </div>
      {canShowDropdown && renderDropdown()}
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
