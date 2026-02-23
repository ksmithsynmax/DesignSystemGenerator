import { useState } from "react";
import { Switch } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function SwitchPreview({ brands, brandId, size, checked: controlledChecked, readOnly }) {
  const [internalChecked, setInternalChecked] = useState(false);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const tokens = COMPONENT_TOKENS.switch;

  const checkedBg = resolveColor(brands, brandId, tokens["switch-track-background-checked"]?.semantic);
  const uncheckedBg = resolveColor(brands, brandId, tokens["switch-track-background"]?.semantic);
  const trackBorder = resolveColor(brands, brandId, tokens["switch-track-border"]?.semantic);

  const width = resolveDimension(brands, brandId, "switch-width", size);
  const height = resolveDimension(brands, brandId, "switch-height", size);
  const thumbSize = resolveDimension(brands, brandId, "switch-thumb-size", size);
  const borderRadius = resolveDimension(brands, brandId, "switch-border-radius", size);

  return (
    <Switch
      checked={checked}
      onChange={readOnly ? undefined : () => setInternalChecked((v) => !v)}
      readOnly={readOnly}
      vars={() => ({
        root: {
          "--switch-color": checkedBg,
          "--switch-width": `${width}px`,
          "--switch-height": `${height}px`,
          "--switch-thumb-size": `${thumbSize}px`,
          "--switch-radius": `${borderRadius}px`,
        },
      })}
      styles={{
        track: {
          backgroundColor: checked ? undefined : uncheckedBg,
          borderColor: checked ? "transparent" : trackBorder,
        },
      }}
    />
  );
}
