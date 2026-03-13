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
  readOnly,
}) {
  const [internalChecked, setInternalChecked] = useState(false);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const tokens = COMPONENT_TOKENS.checkbox;

  const prefix = `checkbox-${variant}`;
  const uncheckedBg = resolveColor(brands, brandId, tokens[`${prefix}-background`]?.semantic, "light", `${prefix}-background`);
  const checkedBg = resolveColor(brands, brandId, tokens[`${prefix}-background-checked`]?.semantic, "light", `${prefix}-background-checked`);
  const disabledBg = resolveColor(brands, brandId, tokens[`${prefix}-background-disabled`]?.semantic, "light", `${prefix}-background-disabled`);

  const borderColor = resolveColor(brands, brandId, tokens[`${prefix}-border`]?.semantic, "light", `${prefix}-border`);
  const checkedBorderColor = resolveColor(brands, brandId, tokens[`${prefix}-border-checked`]?.semantic, "light", `${prefix}-border-checked`);
  const disabledBorderColor = resolveColor(brands, brandId, tokens[`${prefix}-border-disabled`]?.semantic, "light", `${prefix}-border-disabled`);

  const iconColor = resolveColor(brands, brandId, tokens[`${prefix}-icon-color`]?.semantic, "light", `${prefix}-icon-color`);
  const disabledIconColor = resolveColor(brands, brandId, tokens[`${prefix}-icon-color-disabled`]?.semantic, "light", `${prefix}-icon-color-disabled`);

  const boxSize = resolveDimension(brands, brandId, "checkbox-size", size);
  const borderRadius = resolveDimension(brands, brandId, "checkbox-radius", radius || size);
  const isActive = checked || indeterminate;
  const bg = readOnly && !isActive ? disabledBg : isActive ? checkedBg : uncheckedBg;
  const bd = readOnly ? disabledBorderColor : isActive ? checkedBorderColor : borderColor;
  const ic = readOnly ? disabledIconColor : iconColor;

  return (
    <Checkbox
      checked={checked}
      indeterminate={indeterminate}
      onChange={readOnly ? undefined : () => setInternalChecked((v) => !v)}
      readOnly={readOnly}
      vars={() => ({
        root: {
          "--checkbox-size": `${boxSize}px`,
          "--checkbox-radius": `${borderRadius}px`,
          "--checkbox-color": bg,
          "--checkbox-icon-color": ic,
        },
      })}
      styles={{
        input: {
          backgroundColor: bg,
          borderColor: bd,
        },
      }}
    />
  );
}
