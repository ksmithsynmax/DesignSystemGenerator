import { useState } from "react";
import { Checkbox } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function CheckboxPreview({ brands, brandId, size, checked: controlledChecked, indeterminate, readOnly }) {
  const [internalChecked, setInternalChecked] = useState(false);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const tokens = COMPONENT_TOKENS.checkbox;

  const checkedBg = resolveColor(brands, brandId, tokens["checkbox-background-checked"]?.semantic);
  const uncheckedBg = resolveColor(brands, brandId, tokens["checkbox-background"]?.semantic);
  const borderColor = resolveColor(brands, brandId, tokens["checkbox-border"]?.semantic);
  const iconColor = resolveColor(brands, brandId, tokens["checkbox-icon-color"]?.semantic);

  const boxSize = resolveDimension(brands, brandId, "checkbox-size", size);
  const borderRadius = resolveDimension(brands, brandId, "checkbox-border-radius", size);

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
          "--checkbox-color": checkedBg,
          "--checkbox-icon-color": iconColor,
        },
      })}
      styles={{
        input: {
          backgroundColor: (checked || indeterminate) ? undefined : uncheckedBg,
          borderColor: (checked || indeterminate) ? "transparent" : borderColor,
        },
      }}
    />
  );
}
