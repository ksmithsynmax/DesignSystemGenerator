import { Slider } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function SliderPreview({
  brands,
  brandId,
  size = "md",
  radius = "md",
  state,
  value = 40,
  showMarks = true,
  labelMode = "hover",
}) {
  const tokens = COMPONENT_TOKENS.slider;
  const effectiveState = state || "default";

  const resolveStateColor = (baseToken) => {
    const stateToken = `${baseToken}-${effectiveState}`;
    if (tokens[stateToken]) {
      return resolveColor(brands, brandId, tokens[stateToken]?.semantic, "light", stateToken);
    }
    return resolveColor(brands, brandId, tokens[baseToken]?.semantic, "light", baseToken);
  };

  const trackBg = resolveStateColor("slider-track-background");
  const barBg = resolveStateColor("slider-bar-background");
  const thumbBg = resolveStateColor("slider-thumb-background");
  const thumbBorder = resolveStateColor("slider-thumb-border");
  const markColor = resolveStateColor("slider-mark-color");
  const markLabelColor = resolveStateColor("slider-mark-label-color");
  const focusRing = resolveColor(brands, brandId, tokens["slider-focus-ring"]?.semantic, "light", "slider-focus-ring");

  const trackHeight = resolveDimension(brands, brandId, "slider-track-height", size);
  const thumbSize = resolveDimension(brands, brandId, "slider-thumb-size", size);
  const labelFontSize = resolveDimension(brands, brandId, "slider-mark-label-font-size", size);
  const labelFontFamily = resolveDimension(brands, brandId, "slider-mark-label-font-family");
  const labelFontWeight = resolveDimension(brands, brandId, "slider-mark-label-font-weight");
  const labelLineHeight = resolveDimension(brands, brandId, "slider-mark-label-line-height", size);
  const sliderRadius = resolveDimension(brands, brandId, "slider-radius", radius);
  const thumbBorderWidth = resolveDimension(brands, brandId, "slider-thumb-border-width");
  const markSize = resolveDimension(brands, brandId, "slider-mark-size");

  const marks = showMarks
    ? [
        { value: 20, label: "20%" },
        { value: 50, label: "50%" },
        { value: 80, label: "80%" },
      ]
    : undefined;

  return (
    <div style={{ width: 340, padding: "4px 6px" }}>
      <Slider
        value={value}
        onChange={() => {}}
        disabled={effectiveState === "disabled"}
        marks={marks}
        label={labelMode === "off" ? null : undefined}
        labelAlwaysOn={labelMode === "always"}
        vars={() => ({
          root: {
            "--slider-track-bg": trackBg,
          },
        })}
        styles={{
          track: {
            background: trackBg,
            height: trackHeight,
            borderRadius: sliderRadius,
          },
          bar: {
            background: barBg,
            height: trackHeight,
            borderRadius: sliderRadius,
          },
          thumb: {
            background: thumbBg,
            borderColor: thumbBorder,
            borderWidth: thumbBorderWidth,
            width: thumbSize,
            height: thumbSize,
            borderRadius: sliderRadius,
            boxShadow:
              effectiveState === "focus" ? `0 0 0 2px ${focusRing}` : undefined,
          },
          mark: {
            background: markColor,
            borderColor: markColor,
            width: markSize,
            height: markSize,
            marginTop: -(markSize / 2) + trackHeight / 2,
          },
          markLabel: {
            color: markLabelColor,
            fontSize: labelFontSize,
            fontFamily: labelFontFamily ? `"${labelFontFamily}", sans-serif` : undefined,
            fontWeight: labelFontWeight === "Semi Bold" ? 600 : labelFontWeight === "Bold" ? 700 : 400,
            lineHeight: labelLineHeight ? `${labelLineHeight}px` : undefined,
          },
        }}
      />
    </div>
  );
}
