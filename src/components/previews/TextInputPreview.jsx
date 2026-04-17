import { TextInput } from "@mantine/core";
import { resolveColor, resolveDimension, getDefaultSizeKey } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function TextInputPreview({
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
  placeholder = "Placeholder",
  state,
  disabled,
}) {
  const tokens = COMPONENT_TOKENS.textinput;
  const prefix = `textinput-${variant}`;

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
    ? resolveColor(brands, brandId, tokens["textinput-text-disabled"]?.semantic, "light", "textinput-text-disabled")
    : resolveColor(brands, brandId, tokens["textinput-text"]?.semantic, "light", "textinput-text");
  const placeholderColor = resolveColor(brands, brandId, tokens["textinput-placeholder"]?.semantic, "light", "textinput-placeholder");
  const labelColor = isDisabled
    ? resolveColor(
        brands,
        brandId,
        tokens["textinput-label-color-disabled"]?.semantic,
        "light",
        "textinput-label-color-disabled"
      )
    : resolveColor(brands, brandId, tokens["textinput-label-color"]?.semantic, "light", "textinput-label-color");
  const asteriskColor = resolveColor(brands, brandId, tokens["textinput-asterisk-color"]?.semantic, "light", "textinput-asterisk-color");
  const errorColor = resolveColor(brands, brandId, tokens["textinput-error-color"]?.semantic, "light", "textinput-error-color");
  const focusRingColor = resolveColor(brands, brandId, tokens["textinput-focus-ring"]?.semantic, "light", "textinput-focus-ring");

  const height = resolveDimension(brands, brandId, "textinput-height", size);
  const fontSize = resolveDimension(brands, brandId, "textinput-font-size", size);
  const fontFamily = resolveDimension(brands, brandId, "textinput-font-family");
  const fontWeight = resolveDimension(brands, brandId, "textinput-font-weight");
  const lineHeight = resolveDimension(brands, brandId, "textinput-line-height", size);
  const paddingX = resolveDimension(brands, brandId, "textinput-padding-x", size);
  const borderRadius = resolveDimension(brands, brandId, "textinput-radius", radius);
  const borderWidth = resolveDimension(brands, brandId, "textinput-border-width");
  const labelFontSize = resolveDimension(brands, brandId, "textinput-label-font-size", size);
  const labelFontFamily = resolveDimension(brands, brandId, "textinput-label-font-family");
  const labelFontWeight = resolveDimension(brands, brandId, "textinput-label-font-weight");
  const labelLineHeight = resolveDimension(brands, brandId, "textinput-label-line-height");
  const labelGap = resolveDimension(brands, brandId, "textinput-label-gap", size);
  const errorFontSize = resolveDimension(brands, brandId, "textinput-error-font-size");
  const errorFontFamily = resolveDimension(brands, brandId, "textinput-error-font-family");
  const errorFontWeight = resolveDimension(brands, brandId, "textinput-error-font-weight");
  const errorLineHeight = resolveDimension(brands, brandId, "textinput-error-line-height");
  const errorGap = resolveDimension(brands, brandId, "textinput-error-gap");

  const mantineVariant = variant === "filled" ? "filled" : "default";
  const bdValue = `${borderWidth}px solid ${borderColor}`;
  const mantineSize = size === "default" ? getDefaultSizeKey(brands, brandId, "textinput-height") || "sm" : size;
  const mantineRadius = radius === "default" ? getDefaultSizeKey(brands, brandId, "textinput-radius") || "sm" : radius;

  return (
    <TextInput
      size={mantineSize}
      radius={mantineRadius}
      label={showLabel ? labelText : undefined}
      withAsterisk={showLabel && withAsterisk}
      placeholder={placeholder}
      error={isError ? errorText : undefined}
      disabled={isDisabled}
      variant={mantineVariant}
      vars={() => ({
        // Mantine Input reads layout vars from the wrapper; --input-bd is color-only (see styles.css: solid var(--input-bd)).
        wrapper: {
          "--input-height": `${height}px`,
          "--input-fz": `${fontSize}px`,
          "--input-radius": `${borderRadius}px`,
          "--input-padding": `${paddingX}px`,
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
          // Mantine 8: `.input::placeholder { color: var(--input-placeholder-color) }` — set the variable so token edits win over global CSS.
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
