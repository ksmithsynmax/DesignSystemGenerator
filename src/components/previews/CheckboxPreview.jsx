import { useState } from "react";
import { Checkbox } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function CheckboxPreview({
  brands,
  brandId,
  variant = "filled",
  size,
  radius,
  checked: controlledChecked,
  indeterminate,
  state,
  readOnly,
  label,
}) {
  const [internalChecked, setInternalChecked] = useState(false);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const tokens = COMPONENT_TOKENS.checkbox;

  const prefix = `checkbox-${variant}`;
  const stateSuffix = state && state !== "default" ? `-${state}` : "";
  const isDisabled = state === "disabled";

  const resolveFirst = (tokenKeys) => {
    const key = tokenKeys.find((k) => tokens[k]);
    if (!key) return "#FF00FF";
    return resolveColor(brands, brandId, tokens[key]?.semantic, "light", key);
  };

  const uncheckedBg = resolveFirst([
    `${prefix}-background${stateSuffix}`,
    `checkbox-background${stateSuffix}`,
    `${prefix}-background`,
  ]);
  const checkedBg = resolveFirst([
    `${prefix}-background-checked${stateSuffix}`,
    `checkbox-background-checked${stateSuffix}`,
    `${prefix}-background-checked`,
  ]);
  const disabledBg = resolveFirst([
    `${prefix}-background-disabled`,
    "checkbox-background-disabled",
  ]);

  const borderColor = resolveFirst([
    `${prefix}-border${stateSuffix}`,
    `checkbox-border${stateSuffix}`,
    `${prefix}-border`,
  ]);
  const checkedBorderColor = resolveFirst([
    `${prefix}-border-checked${stateSuffix}`,
    `${prefix}-border-checked`,
    "checkbox-border",
  ]);
  const disabledBorderColor = resolveFirst([
    `${prefix}-border-disabled`,
    "checkbox-border-disabled",
  ]);

  const iconColor = resolveFirst([
    `${prefix}-icon-color`,
    "checkbox-icon-color",
  ]);
  const disabledIconColor = resolveFirst([
    `${prefix}-icon-color-disabled`,
    "checkbox-icon-color-disabled",
  ]);
  const focusRing = resolveFirst(["checkbox-focus-ring"]);
  const labelColor = resolveFirst([isDisabled ? "checkbox-label-text-disabled" : "checkbox-label-text"]);

  const boxSize = resolveDimension(brands, brandId, "checkbox-size", size);
  const borderRadius = resolveDimension(brands, brandId, "checkbox-radius", radius || size);
  const labelFontSize = resolveDimension(brands, brandId, "checkbox-label-font-size", size);
  const labelFontFamily = resolveDimension(brands, brandId, "checkbox-label-font-family");
  const labelFontWeight = resolveDimension(brands, brandId, "checkbox-label-font-weight");
  const isActive = checked || indeterminate;
  const bg = isDisabled ? disabledBg : isActive ? checkedBg : uncheckedBg;
  const bd = isDisabled ? disabledBorderColor : isActive ? checkedBorderColor : borderColor;
  const ic = isDisabled ? disabledIconColor : iconColor;

  return (
    <Checkbox
      checked={checked}
      label={label}
      indeterminate={indeterminate}
      onChange={readOnly || isDisabled ? undefined : () => setInternalChecked((v) => !v)}
      readOnly={readOnly || isDisabled}
      disabled={isDisabled}
      vars={() => ({
        root: {
          "--checkbox-size": `${boxSize}px`,
          "--checkbox-radius": `${borderRadius}px`,
          "--checkbox-color": bg,
          "--checkbox-icon-color": ic,
        },
      })}
      styles={{
        root: {
          opacity: 1,
        },
        input: {
          backgroundColor: bg,
          borderColor: bd,
          boxShadow: state === "focus" ? `0 0 0 2px ${focusRing}40` : "none",
        },
        icon: {
          color: ic,
          opacity: 1,
        },
        label: {
          color: labelColor,
          opacity: 1,
          fontSize: labelFontSize ? `${labelFontSize}px` : undefined,
          fontFamily: labelFontFamily ? `"${labelFontFamily}", sans-serif` : undefined,
          fontWeight: labelFontWeight === "Semi Bold" ? 600 : labelFontWeight === "Bold" ? 700 : 400,
        }
      }}
    />
  );
}
