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
    `radio-background${stateSuffix}`,
    "radio-background",
  ]);
  const borderColor = resolveFirst([
    `radio-border${stateSuffix}`,
    "radio-border",
  ]);
  const iconColor = resolveFirst([
    isDisabled ? "radio-icon-color-disabled" : "radio-icon-color",
  ]);
  const focusRing = resolveFirst(["radio-focus-ring"]);
  const labelColor = resolveFirst([isDisabled ? "radio-label-text-disabled" : "radio-label-text"]);

  const radioSize = resolveDimension(brands, brandId, "radio-size", size);
  const iconSize = resolveDimension(brands, brandId, "radio-icon-size", size);

  // --radio-color: accent color used for filled bg (when checked) and outline ring (when checked)
  // Both variants use the primary brand color for the accent
  const radioColor = filledBg;
  // For outline, the dot should match the ring color (primary); for filled, use icon-color (white)
  const radioIconColor = variant === "outline" ? filledBg : iconColor;

  const handleClick = readOnly || isDisabled ? undefined : () => setInternalChecked((v) => !v);

  return (
    <Radio
      checked={checked}
      variant={variant === "outline" ? "outline" : "filled"}
      label={label}
      onChange={() => {}}
      onClick={handleClick}
      readOnly={readOnly || isDisabled}
      disabled={isDisabled}
      vars={() => ({
        root: {
          "--radio-size": `${radioSize}px`,
          "--radio-color": radioColor,
          "--radio-icon-color": radioIconColor,
          "--radio-icon-size": `${iconSize}px`,
        },
      })}
      styles={{
        radio: {
          backgroundColor: checked && variant !== "outline" ? undefined : uncheckedBg,
          borderColor: checked && variant !== "outline" ? "transparent" : borderColor,
          boxShadow: state === "focus" ? `0 0 0 2px ${focusRing}40` : "none",
        },
        label: { color: labelColor },
      }}
    />
  );
}
