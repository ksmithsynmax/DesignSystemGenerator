import { useState } from "react";
import { Radio } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function RadioPreview({
  brands,
  brandId,
  variant = "filled",
  size,
  checked: controlledChecked,
  state,
  readOnly,
  label,
}) {
  const [internalChecked, setInternalChecked] = useState(false);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const tokens = COMPONENT_TOKENS.radio;

  const stateSuffix = state && state !== "default" ? `-${state}` : "";
  const isDisabled = state === "disabled";

  const resolveFirst = (tokenKeys) => {
    const key = tokenKeys.find((k) => tokens[k]);
    if (!key) return "#FF00FF";
    return resolveColor(brands, brandId, tokens[key]?.semantic, "light", key);
  };

  const filledBg = resolveFirst([
    `radio-${variant}-background-checked${stateSuffix}`,
    `radio-${variant}-background-checked`,
  ]);
  const uncheckedBg = resolveFirst([
    `radio-${variant}-background${stateSuffix}`,
    `radio-background${stateSuffix}`,
    `radio-${variant}-background`,
    "radio-background",
  ]);
  const borderColor = resolveFirst([
    `radio-${variant}-border${checked ? "-checked" : ""}${stateSuffix}`,
    `radio-${variant}-border${stateSuffix}`,
    checked ? `radio-${variant}-border-checked` : `radio-${variant}-border`,
  ]);
  const iconColor = resolveFirst([
    `radio-${variant}-icon-color-checked${stateSuffix}`,
    `radio-${variant}-icon-color-checked`,
  ]);
  const focusRing = resolveFirst(["radio-focus-ring"]);
  const labelColor = resolveFirst([isDisabled ? "radio-label-text-disabled" : "radio-label-text"]);

  const radioSize = resolveDimension(brands, brandId, "radio-size", size);
  const iconSize = resolveDimension(brands, brandId, "radio-icon-size", size);
  const labelFontSize = resolveDimension(brands, brandId, "radio-label-font-size", size);
  const labelFontFamily = resolveDimension(brands, brandId, "radio-label-font-family");
  const labelFontWeight = resolveDimension(brands, brandId, "radio-label-font-weight");

  // --radio-color: accent color used for filled bg (when checked) and outline ring (when checked)
  // Both variants use the primary brand color for the accent
  const radioColor = filledBg;
  // Dot color is variant-specific so filled/outline can be tuned independently.
  const radioIconColor = iconColor;

  const handleClick = readOnly || isDisabled ? undefined : () => setInternalChecked((v) => !v);

  return (
    <Radio
      checked={checked}
      variant={variant === "outline" ? "outline" : "filled"}
      label={label}
      onChange={() => {}}
      onClick={handleClick}
      readOnly={readOnly || isDisabled}
      // Keep preview visuals token-driven; avoid Mantine disabled washout.
      disabled={false}
      vars={() => ({
        root: {
          "--radio-size": `${radioSize}px`,
          "--radio-color": radioColor,
          "--radio-icon-color": radioIconColor,
          "--radio-icon-size": `${iconSize}px`,
        },
      })}
      styles={{
        root: {
          opacity: 1,
        },
        body: {
          alignItems: "center",
        },
        radio: {
          backgroundColor: checked && variant !== "outline" ? undefined : uncheckedBg,
          borderColor: checked && variant !== "outline" ? "transparent" : borderColor,
          boxShadow: state === "focus" ? `0 0 0 2px ${focusRing}40` : "none",
          opacity: 1,
        },
        icon: {
          // Force the dot color from the resolved icon-color token. Mantine's
          // outline variant otherwise overrides --radio-icon-color with
          // --radio-color (the accent), which diverges from the Figma docs.
          color: radioIconColor,
          fill: radioIconColor,
          opacity: checked ? 1 : 0,
        },
        label: {
          color: labelColor,
          opacity: 1,
          fontSize: labelFontSize ? `${labelFontSize}px` : undefined,
          fontFamily: labelFontFamily ? `"${labelFontFamily}", sans-serif` : undefined,
          fontWeight: labelFontWeight === "Semi Bold" ? 600 : labelFontWeight === "Bold" ? 700 : 400,
        },
      }}
    />
  );
}
