import { useState } from "react";
import { Switch } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function SwitchPreview({
  brands,
  brandId,
  size,
  checked: controlledChecked,
  readOnly,
  state,
  label,
}) {
  const [internalChecked, setInternalChecked] = useState(false);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const tokens = COMPONENT_TOKENS.switch;
  const stateSuffix = state && state !== "default" ? `-${state}` : "";

  const getTokenColor = (baseName) => {
    const checkedKey = `${baseName}-checked${stateSuffix}`;
    const checkedBaseKey = `${baseName}-checked`;
    const stateKey = `${baseName}${stateSuffix}`;
    const baseKey = baseName;

    if (checked) {
      if (tokens[checkedKey]) {
        return resolveColor(brands, brandId, tokens[checkedKey]?.semantic, "light", checkedKey);
      }
      if (tokens[checkedBaseKey]) {
        return resolveColor(brands, brandId, tokens[checkedBaseKey]?.semantic, "light", checkedBaseKey);
      }
    }

    if (tokens[stateKey]) {
      return resolveColor(brands, brandId, tokens[stateKey]?.semantic, "light", stateKey);
    }
    return resolveColor(brands, brandId, tokens[baseKey]?.semantic, "light", baseKey);
  };

  const checkedBg = getTokenColor("switch-track-background");
  const uncheckedBg = getTokenColor("switch-track-background");
  const trackBorder = getTokenColor("switch-track-border");
  const thumbBg = getTokenColor("switch-thumb-background");
  const focusRing = resolveColor(brands, brandId, tokens["switch-focus-ring"]?.semantic, "light", "switch-focus-ring");
  const isDisabled = state === "disabled";
  const labelColor = resolveColor(
    brands,
    brandId,
    tokens[isDisabled ? "switch-label-text-disabled" : "switch-label-text"]?.semantic,
    "light",
    isDisabled ? "switch-label-text-disabled" : "switch-label-text"
  );

  const width = resolveDimension(brands, brandId, "switch-width", size);
  const height = resolveDimension(brands, brandId, "switch-height", size);
  const thumbSize = resolveDimension(brands, brandId, "switch-thumb-size", size);
  const borderRadius = resolveDimension(brands, brandId, "switch-border-radius", size);
  const labelFontSize = resolveDimension(brands, brandId, "switch-label-font-size", size);
  const labelFontFamily = resolveDimension(brands, brandId, "switch-label-font-family");
  const labelFontWeight = resolveDimension(brands, brandId, "switch-label-font-weight");

  return (
    <Switch
      checked={checked}
      label={label}
      onChange={readOnly ? undefined : () => setInternalChecked((v) => !v)}
      readOnly={readOnly || isDisabled}
      disabled={isDisabled}
      vars={() => ({
        root: {
          "--switch-color": checkedBg,
          "--switch-width": `${width}px`,
          "--switch-height": `${height}px`,
          "--switch-thumb-size": `${thumbSize}px`,
          "--switch-radius": `${borderRadius}px`,
          "--switch-thumb-bg": thumbBg,
        },
      })}
      styles={{
        track: {
          backgroundColor: checked ? undefined : uncheckedBg,
          borderColor: checked ? "transparent" : trackBorder,
        },
        thumb: {
          backgroundColor: thumbBg,
        },
        input: state === "focus"
          ? {
              outline: `2px solid ${focusRing}`,
              outlineOffset: 2,
            }
          : undefined,
        label: {
          color: labelColor,
          fontSize: labelFontSize ? `${labelFontSize}px` : undefined,
          fontFamily: labelFontFamily ? `"${labelFontFamily}", sans-serif` : undefined,
          fontWeight: labelFontWeight === "Semi Bold" ? 600 : labelFontWeight === "Bold" ? 700 : 400,
        }
      }}
    />
  );
}
