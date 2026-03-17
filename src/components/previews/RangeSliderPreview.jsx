import { RangeSlider } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function RangeSliderPreview({
  brands,
  brandId,
  size = "md",
  radius = "md",
  state,
  value = [20, 60],
  showMarks = true,
  labelMode = "hover",
}) {
  const tokens = COMPONENT_TOKENS.rangeslider;
  const effectiveState = state || "default";

  const resolveStateColor = (baseToken) => {
    const stateToken = `${baseToken}-${effectiveState}`;
    if (tokens[stateToken]) {
      return resolveColor(brands, brandId, tokens[stateToken]?.semantic, "light", stateToken);
    }
    return resolveColor(brands, brandId, tokens[baseToken]?.semantic, "light", baseToken);
  };

  const trackBg = resolveStateColor("rangeslider-track-background");
  const barBg = resolveStateColor("rangeslider-bar-background");
  const thumbBg = resolveStateColor("rangeslider-thumb-background");
  const thumbBorder = resolveStateColor("rangeslider-thumb-border");
  const markColor = resolveStateColor("rangeslider-mark-color");
  const markLabelColor = resolveStateColor("rangeslider-mark-label-color");
  const focusRing = resolveColor(
    brands,
    brandId,
    tokens["rangeslider-focus-ring"]?.semantic,
    "light",
    "rangeslider-focus-ring"
  );

  const trackHeight = resolveDimension(brands, brandId, "rangeslider-track-height", size);
  const thumbSize = resolveDimension(brands, brandId, "rangeslider-thumb-size", size);
  const labelFontSize = resolveDimension(brands, brandId, "rangeslider-mark-label-font-size", size);
  const sliderRadius = resolveDimension(brands, brandId, "rangeslider-radius", radius);
  const thumbBorderWidth = resolveDimension(brands, brandId, "rangeslider-thumb-border-width");
  const markSize = resolveDimension(brands, brandId, "rangeslider-mark-size");

  const marks = showMarks
    ? [
        { value: 20, label: "20%" },
        { value: 50, label: "50%" },
        { value: 80, label: "80%" },
      ]
    : undefined;

  return (
    <div style={{ width: 340, padding: "4px 6px" }}>
      <RangeSlider
        value={value}
        onChange={() => {}}
        disabled={effectiveState === "disabled"}
        marks={marks}
        label={labelMode === "off" ? null : undefined}
        labelAlwaysOn={labelMode === "always"}
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
          },
        }}
      />
    </div>
  );
}
