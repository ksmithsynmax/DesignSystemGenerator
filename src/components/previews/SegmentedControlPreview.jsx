import { useState } from "react";
import { getDefaultSizeKey, resolveColor, resolveDimension } from "../../utils/resolveToken";
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
  const isFocus = state === "focus";
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
  const rootBorder = getColor("segmentedcontrol-root-border");
  const indicatorBg = getColor(colorKey("segmentedcontrol-indicator-background"));
  const indicatorBorder = getColor("segmentedcontrol-indicator-border");
  const labelText = getColor("segmentedcontrol-label-text");
  const labelTextHover = getColor("segmentedcontrol-label-text-hover");
  const labelTextActive = getColor("segmentedcontrol-label-text-active");
  const labelTextDisabled = getColor("segmentedcontrol-label-text-disabled");
  const focusRing = getColor("segmentedcontrol-focus-ring");

  const sizeKey = size === "default" ? getDefaultSizeKey(brands, brandId, "segmentedcontrol-font-size") || "md" : size;

  const fontSize = resolveDimension(brands, brandId, "segmentedcontrol-font-size", sizeKey) || 14;
  const lineHeight = resolveDimension(brands, brandId, "segmentedcontrol-line-height", sizeKey) || 20;
  const paddingX = resolveDimension(brands, brandId, "segmentedcontrol-padding-x", sizeKey) || 12;
  const paddingY = resolveDimension(brands, brandId, "segmentedcontrol-padding-y", sizeKey) || 7;
  const radius = resolveDimension(brands, brandId, "segmentedcontrol-radius", sizeKey) || 8;
  const indicatorRadius = resolveDimension(brands, brandId, "segmentedcontrol-indicator-radius", sizeKey) ?? Math.max(2, radius - 2);
  const fontFamily = resolveDimension(brands, brandId, "segmentedcontrol-font-family");
  const fontWeight = resolveDimension(brands, brandId, "segmentedcontrol-font-weight");
  const rootPadding = resolveDimension(brands, brandId, "segmentedcontrol-root-padding") ?? 4;
  const rootBorderWidth = resolveDimension(brands, brandId, "segmentedcontrol-root-border-width") ?? 1;
  const indicatorBorderWidth = resolveDimension(brands, brandId, "segmentedcontrol-indicator-border-width") ?? 1;
  const focusRingWidth = resolveDimension(brands, brandId, "segmentedcontrol-focus-ring-width") || 2;

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
          const showFocus = isFocus && isActive;
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
                outline: showFocus ? `${focusRingWidth}px solid ${focusRing}` : "none",
                outlineOffset: showFocus ? 1 : 0,
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
