import { Progress } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function ProgressPreview({
  brands,
  brandId,
  size = "md",
  /** Size key for `progress-radius` (independent from `size` / height scale). */
  radiusSize = size,
  value = 60,
  showLabel = true,
  previewTheme = "dark",
}) {
  const tokens = COMPONENT_TOKENS.progress;
  const theme = previewTheme === "dark" ? "dark" : "light";
  const track = resolveColor(brands, brandId, tokens["progress-track"]?.semantic, theme, "progress-track");
  const fill = resolveColor(brands, brandId, tokens["progress-fill"]?.semantic, theme, "progress-fill");
  const labelColor = resolveColor(brands, brandId, tokens["progress-label"]?.semantic, theme, "progress-label");
  const height = Number(resolveDimension(brands, brandId, "progress-height", size)) || 8;
  const radius = Number(resolveDimension(brands, brandId, "progress-radius", radiusSize)) || 4;
  const trackWidth = Number(resolveDimension(brands, brandId, "progress-track-width", size)) || 160;
  const fontSize = Number(resolveDimension(brands, brandId, "progress-font-size", size)) || 13;
  const gap = Number(resolveDimension(brands, brandId, "progress-gap", size)) || 8;
  const pct = Math.min(100, Math.max(0, Number(value) || 0));

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap,
        minWidth: 0,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ width: trackWidth, flexShrink: 0 }}>
        <Progress
          value={pct}
          size={height}
          radius={radius}
          transitionDuration={150}
          color="blue"
          styles={{
            root: {
              backgroundColor: track,
            },
            section: {
              backgroundColor: fill,
            },
          }}
        />
      </div>
      {showLabel ? (
        <span
          style={{
            fontSize,
            fontWeight: 600,
            color: labelColor,
            fontVariantNumeric: "tabular-nums",
            flexShrink: 0,
            lineHeight: 1.2,
          }}
        >
          {Math.round(pct)}%
        </span>
      ) : null}
    </div>
  );
}
