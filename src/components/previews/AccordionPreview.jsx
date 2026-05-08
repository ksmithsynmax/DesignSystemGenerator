import ChevronDownIcon from "@untitledui-icons/react/line/ChevronDownIcon";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function AccordionPreview({
  brands,
  brandId,
  variant = "default",
  position = "single",
  state = "default",
  expanded = true,
  label = "What is included?",
  content = "Accordion panel content. Use this slot for text, list, or data-grid content components in Figma.",
}) {
  const tokens = COMPONENT_TOKENS.accordion;
  const stateSuffix = state === "default" ? "" : `-${state}`;
  const key = (slot) =>
    `accordion-${variant}-${slot}${stateSuffix}` in tokens
      ? `accordion-${variant}-${slot}${stateSuffix}`
      : `accordion-${variant}-${slot}`;

  const headerBackground = resolveColor(brands, brandId, tokens[key("header-background")]?.semantic, "light", key("header-background"));
  const headerBorder = resolveColor(brands, brandId, tokens[key("header-border")]?.semantic, "light", key("header-border"));
  const headerText = resolveColor(brands, brandId, tokens[key("header-text")]?.semantic, "light", key("header-text"));
  const headerIcon = resolveColor(brands, brandId, tokens[key("header-icon")]?.semantic, "light", key("header-icon"));
  const panelBackground = resolveColor(brands, brandId, tokens[key("panel-background")]?.semantic, "light", key("panel-background"));
  const panelBorder = resolveColor(brands, brandId, tokens[key("panel-border")]?.semantic, "light", key("panel-border"));
  const contentText = resolveColor(brands, brandId, tokens[key("content-text")]?.semantic, "light", key("content-text"));
  const focusRing = resolveColor(brands, brandId, tokens["accordion-focus-ring"]?.semantic, "light", "accordion-focus-ring");

  const borderWidth = resolveDimension(brands, brandId, "accordion-border-width") ?? 1;
  const radius = resolveDimension(brands, brandId, `accordion-${variant}-radius`) ?? 8;
  const headerPaddingX = resolveDimension(brands, brandId, "accordion-header-padding-x") ?? 16;
  const headerPaddingY = resolveDimension(brands, brandId, "accordion-header-padding-y") ?? 12;
  const panelPaddingX = resolveDimension(brands, brandId, "accordion-panel-padding-x") ?? 16;
  const panelPaddingY = resolveDimension(brands, brandId, "accordion-panel-padding-y") ?? 12;
  const iconSize = resolveDimension(brands, brandId, "accordion-icon-size") ?? 18;
  const iconStrokeWidth = resolveDimension(brands, brandId, "accordion-icon-stroke-width") ?? 2;
  const labelFontSize = resolveDimension(brands, brandId, "accordion-label-font-size") ?? 14;
  const labelLineHeight = resolveDimension(brands, brandId, "accordion-label-line-height") ?? 20;
  const labelFontFamily = resolveDimension(brands, brandId, "accordion-label-font-family");
  const labelFontWeight = resolveDimension(brands, brandId, "accordion-label-font-weight");
  const contentFontSize = resolveDimension(brands, brandId, "accordion-content-font-size") ?? 14;
  const contentLineHeight = resolveDimension(brands, brandId, "accordion-content-line-height") ?? 20;
  const contentFontFamily = resolveDimension(brands, brandId, "accordion-content-font-family");
  const contentFontWeight = resolveDimension(brands, brandId, "accordion-content-font-weight");
  const gap = resolveDimension(brands, brandId, "accordion-gap") ?? 8;

  const topRadius = position === "middle" || position === "last" ? 0 : radius;
  const bottomRadius = position === "middle" || position === "first" ? 0 : radius;
  const isDisabled = state === "disabled";
  const isExpanded = isDisabled ? false : expanded;
  const disableBottomBorder = isExpanded && (position === "single" || position === "last");
  const defaultBottomOnly = variant === "default";

  return (
    <div
      style={{
        width: 520,
        borderTop: defaultBottomOnly ? "none" : `${borderWidth}px solid ${headerBorder}`,
        borderRight: defaultBottomOnly ? "none" : `${borderWidth}px solid ${headerBorder}`,
        borderBottom: `${borderWidth}px solid ${headerBorder}`,
        borderLeft: defaultBottomOnly ? "none" : `${borderWidth}px solid ${headerBorder}`,
        borderTopLeftRadius: topRadius,
        borderTopRightRadius: topRadius,
        borderBottomLeftRadius: isExpanded ? 0 : bottomRadius,
        borderBottomRightRadius: isExpanded ? 0 : bottomRadius,
        overflow: "hidden",
        boxShadow: state === "focus" ? `0 0 0 2px ${focusRing}40` : "none",
        opacity: state === "disabled" ? 0.75 : 1,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap,
          padding: `${headerPaddingY}px ${headerPaddingX}px`,
          background: headerBackground,
          borderBottom: isExpanded
            ? `${borderWidth}px solid ${panelBorder}`
            : defaultBottomOnly || disableBottomBorder
              ? "none"
              : `${borderWidth}px solid ${headerBorder}`,
        }}
      >
        <span
          style={{
            color: headerText,
            fontSize: labelFontSize,
            lineHeight: `${labelLineHeight}px`,
            fontFamily: labelFontFamily ? `"${labelFontFamily}", sans-serif` : undefined,
            fontWeight: labelFontWeight === "Bold" ? 700 : labelFontWeight === "Semi Bold" ? 600 : 400,
          }}
        >
          {label}
        </span>
        <ChevronDownIcon
          width={iconSize}
          height={iconSize}
          strokeWidth={iconStrokeWidth}
          style={{
            color: headerIcon,
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 120ms ease",
            flexShrink: 0,
          }}
        />
      </div>
      {isExpanded && (
        <div
          style={{
            padding: `${panelPaddingY}px ${panelPaddingX}px`,
            background: panelBackground,
            color: contentText,
            borderBottomLeftRadius: bottomRadius,
            borderBottomRightRadius: bottomRadius,
            fontSize: contentFontSize,
            lineHeight: `${contentLineHeight}px`,
            fontFamily: contentFontFamily ? `"${contentFontFamily}", sans-serif` : undefined,
            fontWeight: contentFontWeight === "Bold" ? 700 : contentFontWeight === "Semi Bold" ? 600 : 400,
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
