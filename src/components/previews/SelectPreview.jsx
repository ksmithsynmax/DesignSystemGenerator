import { Select } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

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
  const chevronColor = resolveColor(brands, brandId, tokens["select-chevron-color"]?.semantic, "light", "select-chevron-color");
  const focusRingColor = resolveColor(brands, brandId, tokens["select-focus-ring"]?.semantic, "light", "select-focus-ring");

  const height = resolveDimension(brands, brandId, "select-height", size);
  const fontSize = resolveDimension(brands, brandId, "select-font-size", size);
  const fontFamily = resolveDimension(brands, brandId, "select-font-family");
  const fontWeight = resolveDimension(brands, brandId, "select-font-weight");
  const lineHeight = resolveDimension(brands, brandId, "select-line-height", size);
  const paddingX = resolveDimension(brands, brandId, "select-padding-x", size);
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
      data={["Option one", "Option two", "Option three"]}
      value="Option one"
      comboboxProps={{ withinPortal: false }}
      vars={() => ({
        root: {
          "--input-height": `${height}px`,
          "--input-fz": `${fontSize}px`,
          "--input-padding-x": `${paddingX}px`,
          "--input-radius": `${borderRadius}px`,
          "--input-bd": bdValue,
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
          "--input-placeholder-color": isError ? errorColor : placeholderColor,
          fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : undefined,
          fontWeight: fontWeight === "Semi Bold" ? 600 : fontWeight === "Bold" ? 700 : 400,
          lineHeight: lineHeight ? `${lineHeight}px` : undefined,
          ...(isFocus
            ? {
                boxShadow: `0 0 0 2px ${focusRingColor}40`,
              }
            : {}),
        },
        section: {
          color: chevronColor,
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
  );
}
