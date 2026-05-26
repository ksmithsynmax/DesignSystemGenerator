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
    ? resolveColor(brands, brandId, tokens["select-text-disabled"]?.semantic, "light", "select-text-disabled")
    : resolveColor(brands, brandId, tokens["select-text"]?.semantic, "light", "select-text");
  const placeholderColor = resolveColor(brands, brandId, tokens["select-placeholder"]?.semantic, "light", "select-placeholder");
  const labelColor = resolveColor(brands, brandId, tokens["select-label-color"]?.semantic, "light", "select-label-color");
  const asteriskColor = resolveColor(brands, brandId, tokens["select-asterisk-color"]?.semantic, "light", "select-asterisk-color");
  const errorColor = resolveColor(brands, brandId, tokens["select-error-color"]?.semantic, "light", "select-error-color");
  const iconSemantic = isDisabled
    ? tokens["select-icon-disabled"]?.semantic ?? tokens["select-chevron-color"]?.semantic
    : isError
      ? tokens["select-icon-error"]?.semantic ??
        tokens["select-icon"]?.semantic ??
        tokens["select-chevron-color"]?.semantic
      : tokens["select-icon"]?.semantic ?? tokens["select-chevron-color"]?.semantic;
  const iconColorKey = isDisabled ? "select-icon-disabled" : isError ? "select-icon-error" : "select-icon";
  const chevronColor = resolveColor(brands, brandId, iconSemantic, "light", iconColorKey);
  const focusRingColor = resolveColor(brands, brandId, tokens["select-focus-ring"]?.semantic, "light", "select-focus-ring");
  const dropdownBackground = resolveColor(
    brands,
    brandId,
    tokens["select-dropdown-background"]?.semantic,
    "light",
    "select-dropdown-background"
  );
  const dropdownBorderColor = resolveColor(
    brands,
    brandId,
    tokens["select-dropdown-border"]?.semantic,
    "light",
    "select-dropdown-border"
  );
  const optionSelectedBackground = resolveColor(
    brands,
    brandId,
    tokens["select-option-selected-background"]?.semantic,
    "light",
    "select-option-selected-background"
  );
  const optionHoverBackground = resolveColor(
    brands,
    brandId,
    tokens["select-option-hover-background"]?.semantic,
    "light",
    "select-option-hover-background"
  );
  const optionHoverText = resolveColor(
    brands,
    brandId,
    tokens["select-option-hover-text"]?.semantic,
    "light",
    "select-option-hover-text"
  );

  const fontSize = resolveDimension(brands, brandId, "select-font-size", size);
  const fontFamily = resolveDimension(brands, brandId, "select-font-family", size);
  const fontWeight = resolveDimension(brands, brandId, "select-font-weight", size);
  const lineHeight = resolveDimension(brands, brandId, "select-line-height", size);
  const paddingX = resolveDimension(brands, brandId, "select-padding-x", size);
  const paddingY = resolveDimension(brands, brandId, "select-padding-y", size);
  const borderRadius = resolveDimension(brands, brandId, "select-radius", radius);
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
  const sectionSize = resolveDimension(brands, brandId, "select-section-size", size);

  const mantineVariant = variant === "filled" ? "filled" : "default";
  const bdValue = `${borderWidth}px solid ${borderColor}`;
  const dropdownBdValue = `${borderWidth}px solid ${dropdownBorderColor}`;
  const chevronIconSize = Math.max(14, Math.round((Number(sectionSize) || 36) * 0.45));

  return (
    <Select
      size={size}
      radius={radius}
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
          fontWeight: labelFontWeight === "Semi Bold" ? 600 : labelFontWeight === "Bold" ? 700 : 400,
          lineHeight: labelLineHeight ? `${labelLineHeight}px` : undefined,
          marginBottom: labelGap,
        },
        input: {
          backgroundColor: bg,
          color: textColor,
          border: bdValue,
          "--input-placeholder-color": isError ? errorColor : placeholderColor,
          paddingLeft: paddingX,
          paddingRight: paddingX,
          paddingTop: paddingY,
          paddingBottom: paddingY,
          fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : undefined,
          fontWeight: fontWeight === "Semi Bold" ? 600 : fontWeight === "Bold" ? 700 : 400,
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
          fontWeight: errorFontWeight === "Semi Bold" ? 600 : errorFontWeight === "Bold" ? 700 : 400,
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
        },
        option: {
          "--dsg-select-option-selected-background": optionSelectedBackground,
          "--dsg-select-option-hover-background": optionHoverBackground,
          "--dsg-select-option-hover-text": optionHoverText,
        },
      }}
    />
  );
}
