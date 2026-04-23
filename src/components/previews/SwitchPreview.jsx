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
  previewTheme = "light",
}) {
  const [internalChecked, setInternalChecked] = useState(false);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const tokens = COMPONENT_TOKENS.switch;
  const getTokenColor = (baseName, checkedOverride = checked, stateOverride = state) => {
    const suffix = stateOverride && stateOverride !== "default" ? `-${stateOverride}` : "";
    const checkedKey = `${baseName}-checked${suffix}`;
    const checkedBaseKey = `${baseName}-checked`;
    const stateKey = `${baseName}${suffix}`;
    const baseKey = baseName;

    if (checkedOverride) {
      if (tokens[checkedKey]) {
        return resolveColor(brands, brandId, tokens[checkedKey]?.semantic, previewTheme, checkedKey);
      }
      if (tokens[checkedBaseKey]) {
        return resolveColor(brands, brandId, tokens[checkedBaseKey]?.semantic, previewTheme, checkedBaseKey);
      }
    }

    if (tokens[stateKey]) {
      return resolveColor(brands, brandId, tokens[stateKey]?.semantic, previewTheme, stateKey);
    }
    return resolveColor(brands, brandId, tokens[baseKey]?.semantic, previewTheme, baseKey);
  };

  const getTrackBorderColor = () => {
    const suffix = state && state !== "default" ? `-${state}` : "";
    const checkedStateKey = `switch-track-border-checked${suffix}`;
    const stateKey = `switch-track-border${suffix}`;
    const checkedBaseKey = "switch-track-border-checked";
    const baseKey = "switch-track-border";

    if (checked && state !== "default" && tokens[checkedStateKey]) {
      return resolveColor(brands, brandId, tokens[checkedStateKey]?.semantic, previewTheme, checkedStateKey);
    }
    if (tokens[stateKey]) {
      return resolveColor(brands, brandId, tokens[stateKey]?.semantic, previewTheme, stateKey);
    }
    if (checked && tokens[checkedBaseKey]) {
      return resolveColor(brands, brandId, tokens[checkedBaseKey]?.semantic, previewTheme, checkedBaseKey);
    }
    return resolveColor(brands, brandId, tokens[baseKey]?.semantic, previewTheme, baseKey);
  };

  const checkedBg = getTokenColor("switch-track-background", true, state);
  const uncheckedBg = getTokenColor("switch-track-background", false, state);
  const checkedDisabledBg = getTokenColor("switch-track-background", true, "disabled");
  const uncheckedDisabledBg = getTokenColor("switch-track-background", false, "disabled");
  const trackBorder = getTrackBorderColor();
  const thumbBg = getTokenColor("switch-thumb-background");
  const focusRing = resolveColor(brands, brandId, tokens["switch-focus-ring"]?.semantic, previewTheme, "switch-focus-ring");
  const isDisabled = state === "disabled";
  const labelColor = resolveColor(
    brands,
    brandId,
    tokens[isDisabled ? "switch-label-text-disabled" : "switch-label-text"]?.semantic,
    previewTheme,
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
      thumbIcon={null}
      withThumbIndicator={false}
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
          "--switch-disabled-color": checked ? checkedDisabledBg : uncheckedDisabledBg,
          "--switch-thumb-icon": "none",
          "--switch-thumb-icon-size": "0px",
        },
      })}
      styles={{
        track: {
          backgroundColor: checked ? undefined : uncheckedBg,
          borderColor: trackBorder,
        },
        thumb: {
          backgroundColor: thumbBg,
          backgroundImage: "none",
          "&::before": {
            content: "none",
            display: "none",
            backgroundImage: "none",
          },
          "&::after": {
            content: "none",
            display: "none",
            backgroundImage: "none",
          },
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
