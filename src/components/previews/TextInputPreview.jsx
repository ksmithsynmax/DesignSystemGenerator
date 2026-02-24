import { TextInput } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
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

  const bg = resolveColor(brands, brandId, tokens[`${prefix}-background${stateSuffix}`]?.semantic);
  const borderColor = resolveColor(brands, brandId, tokens[`${prefix}-border${stateSuffix}`]?.semantic);

  const textColor = isDisabled
    ? resolveColor(brands, brandId, tokens["textinput-text-disabled"]?.semantic)
    : resolveColor(brands, brandId, tokens["textinput-text"]?.semantic);
  const placeholderColor = resolveColor(brands, brandId, tokens["textinput-placeholder"]?.semantic);
  const labelColor = resolveColor(brands, brandId, tokens["textinput-label-color"]?.semantic);
  const asteriskColor = resolveColor(brands, brandId, tokens["textinput-asterisk-color"]?.semantic);
  const errorColor = resolveColor(brands, brandId, tokens["textinput-error-color"]?.semantic);
  const focusRingColor = resolveColor(brands, brandId, tokens["textinput-focus-ring"]?.semantic);

  const height = resolveDimension(brands, brandId, "textinput-height", size);
  const fontSize = resolveDimension(brands, brandId, "textinput-font-size", size);
  const paddingX = resolveDimension(brands, brandId, "textinput-padding-x", size);
  const borderRadius = resolveDimension(brands, brandId, "textinput-radius", radius);
  const borderWidth = resolveDimension(brands, brandId, "textinput-border-width");
  const labelFontSize = resolveDimension(brands, brandId, "textinput-label-font-size");
  const labelGap = resolveDimension(brands, brandId, "textinput-label-gap");
  const errorFontSize = resolveDimension(brands, brandId, "textinput-error-font-size");
  const errorGap = resolveDimension(brands, brandId, "textinput-error-gap");

  const mantineVariant = variant === "filled" ? "filled" : "default";
  const bdValue = `${borderWidth}px solid ${borderColor}`;

  return (
    <TextInput
      label={showLabel ? labelText : undefined}
      withAsterisk={showLabel && withAsterisk}
      placeholder={placeholder}
      error={isError ? errorText : undefined}
      disabled={isDisabled}
      variant={mantineVariant}
      vars={() => ({
        root: {
          "--input-height": `${height}px`,
          "--input-fz": `${fontSize}px`,
          "--input-padding-x": `${paddingX}px`,
          "--input-radius": `${borderRadius}px`,
          "--input-bd": bdValue,
        },
      })}
      styles={{
        label: {
          color: labelColor,
          fontSize: labelFontSize,
          marginBottom: labelGap,
          fontWeight: 500,
        },
        input: {
          backgroundColor: bg,
          color: textColor,
          "--_input-placeholder-color": placeholderColor,
          ...(isFocus
            ? {
                boxShadow: `0 0 0 2px ${focusRingColor}40`,
              }
            : {}),
        },
        error: {
          color: errorColor,
          fontSize: errorFontSize,
          marginTop: errorGap,
        },
        required: {
          color: asteriskColor,
        },
      }}
    />
  );
}
