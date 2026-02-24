import { useState } from "react";
import { Radio } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function RadioPreview({ brands, brandId, variant = "filled", size, checked: controlledChecked, readOnly, label }) {
  const [internalChecked, setInternalChecked] = useState(false);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const tokens = COMPONENT_TOKENS.radio;

  const filledBg = resolveColor(brands, brandId, tokens["radio-filled-background-checked"]?.semantic);
  const uncheckedBg = resolveColor(brands, brandId, tokens["radio-background"]?.semantic);
  const borderColor = resolveColor(brands, brandId, tokens["radio-border"]?.semantic);
  const iconColor = resolveColor(brands, brandId, tokens["radio-icon-color"]?.semantic);

  const radioSize = resolveDimension(brands, brandId, "radio-size", size);
  const iconSize = resolveDimension(brands, brandId, "radio-icon-size", size);

  // Mantine outline variant: --radio-color controls the border ring color (not bg)
  // Mantine filled variant: --radio-color controls the background fill
  const radioColor = variant === "outline" ? filledBg : filledBg;
  // For outline, the icon (dot) should match the ring color
  const radioIconColor = variant === "outline" ? filledBg : iconColor;

  const handleClick = readOnly ? undefined : () => setInternalChecked((v) => !v);

  return (
    <Radio
      checked={checked}
      variant={variant === "outline" ? "outline" : "filled"}
      label={label}
      onChange={() => {}}
      onClick={handleClick}
      readOnly={readOnly}
      vars={() => ({
        root: {
          "--radio-size": `${radioSize}px`,
          "--radio-radius": `${radioSize}px`,
          "--radio-color": radioColor,
          "--radio-icon-color": radioIconColor,
          "--radio-icon-size": `${iconSize}px`,
        },
      })}
      styles={{
        radio: {
          backgroundColor: checked && variant !== "outline" ? undefined : uncheckedBg,
          borderColor: checked && variant !== "outline" ? "transparent" : borderColor,
        },
      }}
    />
  );
}
