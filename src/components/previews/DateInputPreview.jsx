import { TextInput } from "@mantine/core";
import CalendarIcon from "@untitledui-icons/react/line/CalendarIcon";
import { resolveColor, resolveDimension, getDefaultSizeKey } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";
import CalendarPreview from "./CalendarPreview";

// DateInput is a text field with a fixed calendar icon in the right section.
// It uses the core Mantine `TextInput` (no @mantine/dates dependency) driven by
// the dateinput/* token surface, mirroring TextInputPreview. Clicking the field
// opens the shared Calendar component (calendar/* tokens) as the dropdown.
export default function DateInputPreview({
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
  placeholder = "MM / DD / YYYY",
  state,
  disabled,
  showDropdown = false,
  onToggleDropdown,
}) {
  const tokens = COMPONENT_TOKENS.dateinput;
  const prefix = `dateinput-${variant}`;

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
    ? resolveColor(brands, brandId, tokens["dateinput-text-disabled"]?.semantic, "light", "dateinput-text-disabled")
    : isError
    ? resolveColor(brands, brandId, tokens["dateinput-text-error"]?.semantic, "light", "dateinput-text-error")
    : resolveColor(brands, brandId, tokens["dateinput-text"]?.semantic, "light", "dateinput-text");
  const placeholderColor = isDisabled
    ? resolveColor(
        brands,
        brandId,
        tokens[`${prefix}-placeholder-disabled`]?.semantic ?? tokens["dateinput-placeholder"]?.semantic,
        "light",
        tokens[`${prefix}-placeholder-disabled`] ? `${prefix}-placeholder-disabled` : "dateinput-placeholder"
      )
    : isError
    ? resolveColor(brands, brandId, tokens["dateinput-placeholder-error"]?.semantic, "light", "dateinput-placeholder-error")
    : resolveColor(brands, brandId, tokens["dateinput-placeholder"]?.semantic, "light", "dateinput-placeholder");
  const labelColor = isDisabled
    ? resolveColor(
        brands,
        brandId,
        tokens["dateinput-label-color-disabled"]?.semantic,
        "light",
        "dateinput-label-color-disabled"
      )
    : resolveColor(brands, brandId, tokens["dateinput-label-color"]?.semantic, "light", "dateinput-label-color");
  const asteriskColor = resolveColor(brands, brandId, tokens["dateinput-asterisk-color"]?.semantic, "light", "dateinput-asterisk-color");
  const errorColor = resolveColor(brands, brandId, tokens["dateinput-error-color"]?.semantic, "light", "dateinput-error-color");
  const focusRingColor = resolveColor(brands, brandId, tokens["dateinput-focus-ring"]?.semantic, "light", "dateinput-focus-ring");
  const calendarBackground = resolveColor(brands, brandId, tokens["dateinput-calendar-background"]?.semantic, "light", "dateinput-calendar-background");

  const height = resolveDimension(brands, brandId, "dateinput-height", size);
  const fontSize = resolveDimension(brands, brandId, "dateinput-font-size", size);
  const fontFamily = resolveDimension(brands, brandId, "dateinput-font-family");
  const fontWeight = resolveDimension(brands, brandId, "dateinput-font-weight");
  const lineHeight = resolveDimension(brands, brandId, "dateinput-line-height", size);
  const paddingX = resolveDimension(brands, brandId, "dateinput-padding-x", size);
  const paddingY = resolveDimension(brands, brandId, "dateinput-padding-y", size);
  const iconSize = resolveDimension(brands, brandId, "dateinput-icon-size", size) ?? 16;
  const iconStrokeWidth = resolveDimension(brands, brandId, "dateinput-icon-stroke-width", size);
  const iconGap = resolveDimension(brands, brandId, "dateinput-icon-gap", size) ?? 8;
  const sectionSize =
    resolveDimension(brands, brandId, "dateinput-section-size", size) ?? iconSize + iconGap * 2;
  const borderRadius = resolveDimension(brands, brandId, "dateinput-radius", radius);
  const borderWidth = resolveDimension(brands, brandId, "dateinput-border-width");
  const labelFontSize = resolveDimension(brands, brandId, "dateinput-label-font-size", size);
  const labelFontFamily = resolveDimension(brands, brandId, "dateinput-label-font-family");
  const labelFontWeight = resolveDimension(brands, brandId, "dateinput-label-font-weight");
  const labelLineHeight = resolveDimension(brands, brandId, "dateinput-label-line-height");
  const labelGap = resolveDimension(brands, brandId, "dateinput-label-gap", size);
  const errorFontSize = resolveDimension(brands, brandId, "dateinput-error-font-size");
  const errorFontFamily = resolveDimension(brands, brandId, "dateinput-error-font-family");
  const errorFontWeight = resolveDimension(brands, brandId, "dateinput-error-font-weight");
  const errorLineHeight = resolveDimension(brands, brandId, "dateinput-error-line-height");
  const errorGap = resolveDimension(brands, brandId, "dateinput-error-gap");

  const mantineVariant = variant === "filled" ? "filled" : "default";
  const bdValue = `${borderWidth}px solid ${borderColor}`;
  const mantineSize = size === "default" ? getDefaultSizeKey(brands, brandId, "dateinput-height") || "sm" : size;
  const mantineRadius = radius === "default" ? getDefaultSizeKey(brands, brandId, "dateinput-radius") || "sm" : radius;
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

  // The dropdown never shows in the error or disabled states.
  const canInteract = !isDisabled && !isError;
  const dropdownOpen = showDropdown && canInteract;

  return (
    <div style={{ width: "100%" }}>
    <TextInput
      size={mantineSize}
      radius={mantineRadius}
      label={showLabel ? labelText : undefined}
      withAsterisk={showLabel && withAsterisk}
      placeholder={placeholder}
      error={isError ? errorText : undefined}
      disabled={isDisabled}
      onClick={canInteract ? onToggleDropdown : undefined}
      rightSection={<CalendarIcon {...iconProps} />}
      rightSectionPointerEvents="none"
      variant={mantineVariant}
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
          // Height is fully padding-driven (line-height + top/bottom padding); no fixed-height floor.
          height: "auto",
          minHeight: 0,
          paddingTop: `${paddingY}px`,
          paddingBottom: `${paddingY}px`,
          // Left inset uses the padding-x token; the right inset always reserves the
          // section size because the calendar icon is always present.
          paddingLeft: `${paddingX}px`,
          paddingRight: `${sectionSize}px`,
          cursor: canInteract && onToggleDropdown ? "pointer" : undefined,
          "--input-placeholder-color": placeholderColor,
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
    {dropdownOpen && (
      <div style={{ marginTop: 4 }}>
        {/* Reuse the shared Calendar component (calendar/* tokens) as the popover.
            showHeader is off — the DateInput field replaces the calendar's own
            "Select date" field. Rendered in the light theme to match the field. */}
        <CalendarPreview
          brands={brands}
          brandId={brandId}
          previewTheme="light"
          showHeader={false}
          backgroundOverride={calendarBackground}
        />
      </div>
    )}
    </div>
  );
}
