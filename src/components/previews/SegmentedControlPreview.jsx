import { useState } from "react";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

const SEGMENTS = ["React", "Angular", "Vue"];

function weightToCss(weight) {
  if (weight === "Bold") return 700;
  if (weight === "Semi Bold") return 600;
  if (weight === "Medium") return 500;
  return 400;
}

export default function SegmentedControlPreview({
  brands,
  brandId,
  size = "md",
  orientation = "horizontal",
  fullWidth = false,
  state,
  previewTheme = "light",
  interactive = false,
}) {
  const [activeValue, setActiveValue] = useState(SEGMENTS[0]);
  const tokens = COMPONENT_TOKENS.segmentedcontrol;
  const isDisabled = state === "disabled";
  const isHover = state === "hover";
  const isVertical = orientation === "vertical";
  const current = interactive ? activeValue : SEGMENTS[0];

  const colorKey = (base) => {
    const stateKey = isDisabled ? `${base}-disabled` : base;
    return tokens[stateKey] ? stateKey : base;
  };
  const getColor = (key) =>
    resolveColor(brands, brandId, tokens[key]?.semantic, previewTheme, key);

  const rootBg = getColor(colorKey("segmentedcontrol-root-background"));
  const rootBorder = getColor(colorKey("segmentedcontrol-root-border"));
  const indicatorBg = getColor(colorKey("segmentedcontrol-indicator-background"));
  const indicatorBorder = getColor(colorKey("segmentedcontrol-indicator-border"));
  const labelText = getColor("segmentedcontrol-label-text");
  const labelTextHover = getColor("segmentedcontrol-label-text-hover");
  const labelTextActive = getColor("segmentedcontrol-label-text-active");
  const labelTextDisabled = getColor("segmentedcontrol-label-text-disabled");

  // Pass the raw size through so resolveDimension resolves each token's own
  // "default" entry (and any brand override at the default size). Pre-mapping
  // to a single shared size key meant edits to e.g. `segmentedcontrol-radius-default`
  // never reached the preview because it was reading the `md` entry instead.
  // Use ?? (not ||) so an explicit 0 isn't treated as falsy and replaced by the fallback.
  const fontSize = resolveDimension(brands, brandId, "segmentedcontrol-font-size", size) ?? 14;
  const lineHeight = resolveDimension(brands, brandId, "segmentedcontrol-line-height", size) ?? 20;
  const paddingX = resolveDimension(brands, brandId, "segmentedcontrol-padding-x", size) ?? 12;
  const paddingY = resolveDimension(brands, brandId, "segmentedcontrol-padding-y", size) ?? 7;
  const radius = resolveDimension(brands, brandId, "segmentedcontrol-radius", size) ?? 8;
  const indicatorRadius = resolveDimension(brands, brandId, "segmentedcontrol-indicator-radius", size) ?? Math.max(0, radius - 4);
  const fontFamily = resolveDimension(brands, brandId, "segmentedcontrol-font-family");
  const fontWeight = resolveDimension(brands, brandId, "segmentedcontrol-font-weight");
  const rootPadding = resolveDimension(brands, brandId, "segmentedcontrol-root-padding") ?? 4;
  const rootBorderWidth = resolveDimension(brands, brandId, "segmentedcontrol-root-border-width") ?? 1;
  const indicatorBorderWidth = resolveDimension(brands, brandId, "segmentedcontrol-indicator-border-width") ?? 1;

  const rootStyle = {
    display: fullWidth ? "flex" : "inline-flex",
    flexDirection: isVertical ? "column" : "row",
    alignItems: "stretch",
    gap: 0,
    padding: rootPadding,
    backgroundColor: rootBg,
    border: `${rootBorderWidth}px solid ${rootBorder}`,
    borderRadius: radius,
    boxSizing: "border-box",
    width: fullWidth ? "100%" : undefined,
    opacity: isDisabled ? 0.6 : 1,
  };

  const labelColorFor = (isActive) => {
    if (isDisabled) return labelTextDisabled;
    if (isActive) return labelTextActive;
    if (isHover) return labelTextHover;
    return labelText;
  };

  return (
    <div style={{ width: fullWidth ? 360 : undefined }}>
      <div role="radiogroup" style={rootStyle}>
        {SEGMENTS.map((segment) => {
          const isActive = segment === current;
          return (
            <button
              key={segment}
              type="button"
              role="radio"
              aria-checked={isActive}
              disabled={isDisabled}
              onClick={
                interactive && !isDisabled ? () => setActiveValue(segment) : undefined
              }
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flex: fullWidth ? 1 : "0 0 auto",
                padding: `${paddingY}px ${paddingX}px`,
                border: isActive
                  ? `${indicatorBorderWidth}px solid ${indicatorBorder}`
                  : `${indicatorBorderWidth}px solid transparent`,
                borderRadius: indicatorRadius,
                backgroundColor: isActive ? indicatorBg : "transparent",
                color: labelColorFor(isActive),
                fontSize,
                lineHeight: `${lineHeight}px`,
                fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : undefined,
                fontWeight: weightToCss(fontWeight),
                cursor: isDisabled ? "not-allowed" : interactive ? "pointer" : "default",
                outline: "none",
                whiteSpace: "nowrap",
                boxSizing: "border-box",
              }}
            >
              {segment}
            </button>
          );
        })}
      </div>
    </div>
  );
}
