import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

function mapWeight(label) {
  if (label === "Semi Bold" || label === "Semibold") return 600;
  if (label === "Bold") return 700;
  if (label === "Medium") return 500;
  return 400;
}

export default function PopoverPreview({
  brands,
  brandId,
  position = "bottom",
  withArrow = true,
  widthSize = "md",
  radiusSize = "md",
  body = "Additional context and actions can live here.",
}) {
  const tokens = COMPONENT_TOKENS.popover;

  const background = resolveColor(brands, brandId, tokens["popover-background"]?.semantic, "light", "popover-background");
  const borderColor = resolveColor(brands, brandId, tokens["popover-border"]?.semantic, "light", "popover-border");
  const bodyColor = resolveColor(brands, brandId, tokens["popover-text"]?.semantic, "light", "popover-text");
  const arrowColor = resolveColor(brands, brandId, tokens["popover-arrow"]?.semantic, "light", "popover-arrow");

  const width = resolveDimension(brands, brandId, "popover-width", widthSize);
  const radius = resolveDimension(brands, brandId, "popover-radius", radiusSize);
  const paddingX = resolveDimension(brands, brandId, "popover-padding-x");
  const paddingY = resolveDimension(brands, brandId, "popover-padding-y");
  const borderWidth = resolveDimension(brands, brandId, "popover-border-width");
  const arrowSize = resolveDimension(brands, brandId, "popover-arrow-size");
  const bodyFontSize = resolveDimension(brands, brandId, "popover-text-font-size");
  const bodyFontFamily = resolveDimension(brands, brandId, "popover-text-font-family");
  const bodyFontWeight = resolveDimension(brands, brandId, "popover-text-font-weight");
  const bodyLineHeight = resolveDimension(brands, brandId, "popover-text-line-height");

  const isVertical = position === "top" || position === "bottom";
  const arrowWidth = isVertical ? arrowSize : Math.max(4, Math.round(arrowSize / 2));
  const arrowHeight = isVertical ? Math.max(4, Math.round(arrowSize / 2)) : arrowSize;
  const stackDirection = position === "left" || position === "right" ? "row" : "column";
  const showArrowBeforeBody = position === "bottom" || position === "right";

  const bodyNode = (
    <div
      style={{
        background,
        border: `${borderWidth}px solid ${borderColor}`,
        borderRadius: `${radius}px`,
        padding: `${paddingY}px ${paddingX}px`,
        minWidth: `${width}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          color: bodyColor,
          fontSize: bodyFontSize,
          fontFamily: bodyFontFamily ? `"${bodyFontFamily}", sans-serif` : undefined,
          fontWeight: mapWeight(bodyFontWeight),
          lineHeight: bodyLineHeight ? `${bodyLineHeight}px` : undefined,
          whiteSpace: "nowrap",
        }}
      >
        {body}
      </div>
    </div>
  );

  const arrowNode = withArrow ? (
    <svg
      width={arrowWidth}
      height={arrowHeight}
      viewBox={`0 0 ${arrowWidth} ${arrowHeight}`}
      style={{ display: "block", flex: "0 0 auto" }}
      aria-hidden="true"
    >
      {position === "top" && <polygon points={`0,0 ${arrowWidth},0 ${arrowWidth / 2},${arrowHeight}`} fill={arrowColor} />}
      {position === "bottom" && <polygon points={`0,${arrowHeight} ${arrowWidth / 2},0 ${arrowWidth},${arrowHeight}`} fill={arrowColor} />}
      {position === "left" && <polygon points={`0,0 ${arrowWidth},${arrowHeight / 2} 0,${arrowHeight}`} fill={arrowColor} />}
      {position === "right" && <polygon points={`${arrowWidth},0 0,${arrowHeight / 2} ${arrowWidth},${arrowHeight}`} fill={arrowColor} />}
    </svg>
  ) : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: stackDirection,
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
      }}
    >
      {showArrowBeforeBody ? arrowNode : null}
      {bodyNode}
      {!showArrowBeforeBody ? arrowNode : null}
    </div>
  );
}
