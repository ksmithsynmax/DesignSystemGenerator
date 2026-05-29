import { Select } from "@mantine/core";
import ChevronRightIcon from "@untitledui-icons/react/line/ChevronRightIcon";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";
import classes from "./SelectPreview.module.css";

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
  clearable = false,
  searchable = false,
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
    ? resolveColor(brands, brandId, tokens["select-text-disabled"]?.semantic, "light", "select-text-disabled")
    : resolveColor(brands, brandId, tokens["select-text"]?.semantic, "light", "select-text");
  const placeholderColor = resolveSelectColorToken(
    isError
      ? [
          `${prefix}-placeholder-error`,
          "select-placeholder-error",
          `${prefix}-placeholder`,
        ]
      : [`${prefix}-placeholder`]
  );
  const labelColor = resolveColor(brands, brandId, tokens["select-label-color"]?.semantic, "light", "select-label-color");
  const asteriskColor = resolveColor(brands, brandId, tokens["select-asterisk-color"]?.semantic, "light", "select-asterisk-color");
  const errorColor = resolveColor(brands, brandId, tokens["select-error-color"]?.semantic, "light", "select-error-color");
  const iconSemantic = isDisabled
    ? tokens["select-icon-disabled"]?.semantic
    : isError
      ? tokens["select-icon-error"]?.semantic ??
        tokens["select-icon"]?.semantic
      : tokens["select-icon"]?.semantic;
  const iconColorKey = isDisabled ? "select-icon-disabled" : isError ? "select-icon-error" : "select-icon";
  const chevronColor = resolveColor(brands, brandId, iconSemantic, "light", iconColorKey);
  const focusRingColor = resolveColor(brands, brandId, tokens["select-focus-ring"]?.semantic, "light", "select-focus-ring");
  const dropdownBackground = resolveSelectColorToken([`${prefix}-dropdown-background`]);
  const dropdownBorderColor = resolveSelectColorToken([`${prefix}-dropdown-border`]);
  const optionSelectedBackground = resolveSelectColorToken([`${prefix}-option-selected-background`]);
  const optionHoverBackground = resolveSelectColorToken([`${prefix}-option-hover-background`]);
  const optionHoverText = resolveSelectColorToken([`${prefix}-option-hover-text`]);
  const triggerTextColor = isError ? placeholderColor : textColor;

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
  const sectionSize =
    resolveDimension(brands, brandId, "select-icon-size", size) ??
    resolveDimension(brands, brandId, "select-section-size", size);
  const iconStrokeWidth = resolveDimension(brands, brandId, "select-icon-stroke-width", size);

  const mantineVariant = variant === "filled" ? "filled" : "default";
  const isDefaultVariant = variant === "default";
  const bdValue = `${borderWidth}px solid ${borderColor}`;
  const dropdownBdValue = `${borderWidth}px solid ${dropdownBorderColor}`;
  // Keep icon tied to section token so section-size changes are visible in preview.
  const chevronIconSize = Math.max(8, Math.round((Number(sectionSize) || 20) * 0.7));
  const fontWeightValue = fontWeight === "Semi Bold" ? 600 : fontWeight === "Bold" ? 700 : 400;
  const labelFontWeightValue = labelFontWeight === "Semi Bold" ? 600 : labelFontWeight === "Bold" ? 700 : 400;
  const errorFontWeightValue = errorFontWeight === "Semi Bold" ? 600 : errorFontWeight === "Bold" ? 700 : 400;

  if (isDefaultVariant) {
    const inputBody = (
      <div
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
          ...(isFocus ? { boxShadow: `0 0 0 2px ${focusRingColor}40` } : {}),
        }}
      >
        <span
          style={{
            color: state === "focus" ? textColor : placeholderColor,
            whiteSpace: "nowrap",
          }}
        >
          {state === "focus" ? "Option one" : placeholder}
        </span>
        <ChevronRightIcon
          width={chevronIconSize}
          height={chevronIconSize}
          strokeWidth={Number.isFinite(Number(iconStrokeWidth)) ? Number(iconStrokeWidth) : 2}
          aria-hidden
          style={{
            color: chevronColor,
            transform: "rotate(90deg)",
            display: "block",
            flexShrink: 0,
          }}
        />
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
        {inputBody}
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

  return (
    <Select
      size={size}
      radius={effectiveRadius}
      label={showLabel ? labelText : undefined}
      withAsterisk={showLabel && withAsterisk}
      placeholder={placeholder}
      error={isError ? errorText : undefined}
      disabled={isDisabled}
      variant={mantineVariant}
      clearable={clearable}
      searchable={searchable}
      withCheckIcon={false}
      rightSection={
        <span
          style={{
            width: "100%",
            height: "100%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: Math.max(6, Math.round((Number(paddingX) || 0) * 0.5)),
            boxSizing: "border-box",
          }}
        >
          <ChevronRightIcon
            width={chevronIconSize}
            height={chevronIconSize}
            strokeWidth={Number.isFinite(Number(iconStrokeWidth)) ? Number(iconStrokeWidth) : 2}
            aria-hidden
            style={{
              color: chevronColor,
              transform: "rotate(90deg)",
              display: "block",
              flexShrink: 0,
            }}
          />
        </span>
      }
      data={["Option one", "Option two", "Option three"]}
      value="Option one"
      comboboxProps={{ withinPortal: false }}
      classNames={{
        option: classes.option,
      }}
      vars={() => ({
        root: {
          "--input-fz": `${fontSize}px`,
          "--input-padding-x": `${paddingX}px`,
          "--input-padding-y": `${paddingY}px`,
          "--input-radius": `${borderRadius}px`,
          "--input-section-size": `${sectionSize}px`,
        },
      })}
      styles={{
        label: {
          color: labelColor,
          fontSize: labelFontSize,
          fontFamily: labelFontFamily ? `"${labelFontFamily}", sans-serif` : undefined,
          fontWeight: labelFontWeightValue,
          lineHeight: labelLineHeight ? `${labelLineHeight}px` : undefined,
          marginBottom: labelGap,
        },
        input: {
          backgroundColor: bg,
          color: triggerTextColor,
          border: bdValue,
          "--input-placeholder-color": placeholderColor,
          paddingLeft: paddingX,
          paddingRight: paddingX,
          paddingTop: paddingY,
          paddingBottom: paddingY,
          fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : undefined,
          fontWeight: fontWeightValue,
          lineHeight: lineHeight ? `${lineHeight}px` : undefined,
          ...(isFocus
            ? {
                boxShadow: `0 0 0 2px ${focusRingColor}40`,
              }
            : {}),
        },
        error: {
          color: errorColor,
          fontSize: errorFontSize,
          fontFamily: errorFontFamily ? `"${errorFontFamily}", sans-serif` : undefined,
          fontWeight: errorFontWeightValue,
          lineHeight: errorLineHeight ? `${errorLineHeight}px` : undefined,
          marginTop: errorGap,
        },
        required: {
          color: asteriskColor,
        },
        dropdown: {
          backgroundColor: dropdownBackground,
          border: dropdownBdValue,
          borderRadius: borderRadius,
          padding: 8,
        },
        option: {
          "--dsg-select-option-selected-background": optionSelectedBackground,
          "--dsg-select-option-hover-background": optionHoverBackground,
          "--dsg-select-option-hover-text": optionHoverText,
          borderRadius: borderRadius,
        },
      }}
    />
  );
}
