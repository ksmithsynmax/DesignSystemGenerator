import { Slider } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";
import { parseSteps } from "../../utils/sliderSteps";

export default function SliderPreview({
  brands,
  brandId,
  size = "md",
  radius = "md",
  state,
  value = 40,
  showMarks = true,
  labelMode = "hover",
  variant = "default",
  steps = "0, 25, 50, 75, 100",
  stepIndex = 0,
}) {
  const tokens = COMPONENT_TOKENS.slider;
  const effectiveState = state || "default";
  const isStepped = variant === "stepped";
  const isDisabled = effectiveState === "disabled";

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

  // Stepped variant colors: a 7-stop scale ramp + a dedicated dot color.
  const resolveTokenColor = (key) => resolveColor(brands, brandId, tokens[key]?.semantic, "light", key);
  const scaleColors = [1, 2, 3, 4, 5, 6, 7].map((n) => resolveTokenColor(`slider-scale-${n}`));
  // When disabled, the dots drop the interactive blue and go to the neutral
  // disabled mark color so the scale reads inert (matches the default variant's
  // disabled treatment). The bands are additionally muted via opacity below.
  const dotColor = isStepped && isDisabled
    ? resolveStateColor("slider-mark-color")
    : resolveTokenColor("slider-scale-dot-color");

  const trackHeight = resolveDimension(brands, brandId, "slider-track-height", size);
  const thumbSize = resolveDimension(brands, brandId, "slider-thumb-size", size);
  const labelFontSize = resolveDimension(brands, brandId, "slider-mark-label-font-size", size);
  const labelFontFamily = resolveDimension(brands, brandId, "slider-mark-label-font-family");
  const labelFontWeight = resolveDimension(brands, brandId, "slider-mark-label-font-weight");
  const labelLineHeight = resolveDimension(brands, brandId, "slider-mark-label-line-height", size);
  const sliderRadius = resolveDimension(brands, brandId, "slider-radius", radius);
  const thumbBorderWidth = resolveDimension(brands, brandId, "slider-thumb-border-width", size);
  const markSize = resolveDimension(brands, brandId, "slider-mark-size");

  // Continuous (default) variant marks.
  const continuousMarks = showMarks
    ? [
        { value: 20, label: "20%" },
        { value: 50, label: "50%" },
        { value: 80, label: "80%" },
      ]
    : undefined;

  // Stepped variant: each user-defined stop is a segment. Dots + labels sit at
  // the CENTER of each segment and the thumb snaps to those centers. Stop
  // labels are fully editable.
  const stepList = parseSteps(steps);
  const segCount = stepList.length;
  const steppedMarks = stepList.map((label, i) => ({
    value: segCount > 0 ? ((i + 0.5) / segCount) * 100 : 0,
    label,
  }));
  const safeStepIndex = Math.min(Math.max(stepIndex, 0), Math.max(segCount - 1, 0));
  const steppedValue = steppedMarks.length ? steppedMarks[safeStepIndex].value : 0;
  const labelForValue = (val) => {
    if (!steppedMarks.length) return val;
    const nearest = steppedMarks.reduce(
      (best, m) => (Math.abs(m.value - val) < Math.abs(best.value - val) ? m : best),
      steppedMarks[0]
    );
    return nearest.label;
  };

  const marks = isStepped ? steppedMarks : continuousMarks;

  // Stepped reads as a segmented grayscale scale (no colored fill). Build a
  // hard-stop gradient so each segment is a solid band sampled from the scale
  // ramp, then hide the colored bar.
  const sampleScale = (i) => {
    if (segCount <= 1) return scaleColors[0];
    const t = i / (segCount - 1);
    return scaleColors[Math.round(t * (scaleColors.length - 1))];
  };
  const steppedTrackBg = segCount
    ? `linear-gradient(90deg, ${stepList
        .map((_, i) => {
          const c = sampleScale(i);
          return `${c} ${(i / segCount) * 100}%, ${c} ${((i + 1) / segCount) * 100}%`;
        })
        .join(", ")})`
    : trackBg;

  return (
    <div style={{ width: 340, padding: "4px 6px" }}>
      {/* Mantine paints the track groove via a ::before pseudo-element using
          background-color, which can't hold a gradient. Override its
          background-image (opaque, so it covers the color) with our per-segment
          scale gradient, scoped to the stepped variant only. */}
      <style>{`.dsg-stepped-track::before{background-image:var(--dsg-scale-gradient)!important;background-repeat:no-repeat!important;}`}</style>
      <Slider
        value={isStepped ? steppedValue : value}
        onChange={() => {}}
        disabled={effectiveState === "disabled"}
        marks={marks}
        restrictToMarks={isStepped}
        classNames={{ track: isStepped ? "dsg-stepped-track" : undefined }}
        label={
          labelMode === "off"
            ? null
            : isStepped
              ? labelForValue
              : undefined
        }
        labelAlwaysOn={labelMode === "always"}
        vars={() => ({
          root: {
            "--slider-track-bg": trackBg,
          },
        })}
        styles={{
          track: {
            background: isStepped ? "transparent" : trackBg,
            height: trackHeight,
            borderRadius: sliderRadius,
            // Fed to the ::before override above (see <style> tag).
            ...(isStepped ? { "--dsg-scale-gradient": steppedTrackBg } : {}),
            // Mute the scale ramp when disabled so it reads inactive.
            ...(isStepped && isDisabled ? { opacity: 0.5 } : {}),
          },
          bar: {
            background: isStepped ? "transparent" : barBg,
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
            // Mantine hides the thumb (display: none) when the slider is
            // disabled, which would hide the disabled thumb background/border
            // tokens. Keep it visible so the preview matches Figma.
            ...(effectiveState === "disabled" ? { display: "flex" } : {}),
          },
          mark: {
            background: isStepped ? dotColor : markColor,
            borderColor: isStepped ? dotColor : markColor,
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
