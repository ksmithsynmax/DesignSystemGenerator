import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

function toRgba(color, opacityPercent) {
  if (!color || color === "transparent") return "transparent";
  const alpha = Math.max(0, Math.min(1, (Number(opacityPercent) || 0) / 100));
  const normalized = color.startsWith("#") ? color.slice(1) : color;
  if (normalized.length !== 6) return color;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return color;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function ModalPreview({
  brands,
  brandId,
  variant = "default",
  size = "md",
  radius = "md",
  layout = "basic",
  withOverlay = true,
  withCloseButton = true,
  centered = true,
  showSectionDividers = true,
  dividerInset = false,
  title = "Modal title",
  body = "This action cannot be undone. Please confirm you want to proceed.",
}) {
  const tokens = COMPONENT_TOKENS.modal;
  // Variant prefix selects the color token set. "filled" is the original
  // single-color modal; "default" is the new variant with a distinct header bar.
  const v = variant === "filled" ? "filled" : "default";
  const colorTok = (suffix) => `modal-${v}-${suffix}`;
  const resolveModalColor = (suffix) =>
    resolveColor(brands, brandId, tokens[colorTok(suffix)]?.semantic, "light", colorTok(suffix));

  const background = resolveModalColor("background");
  const headerBackground = resolveModalColor("header-background");
  const footerBackground = resolveModalColor("footer-background");
  const borderColor = resolveModalColor("border");
  const headerBorderColor = resolveModalColor("header-border");
  const footerBorderColor = resolveModalColor("footer-border");
  const titleColor = resolveModalColor("title");
  const bodyColor = resolveModalColor("body");
  const overlayColorBase = resolveModalColor("overlay");
  const closeColor = resolveModalColor("close");

  // Width + radius are shared across variants (driven by the Size/Radius
  // dropdowns); spacing, typography, and border-width are per-variant.
  const dimTok = (suffix) => `modal-${v}-${suffix}`;
  const width = resolveDimension(brands, brandId, "modal-width", size);
  const cornerRadius = resolveDimension(brands, brandId, "modal-radius", radius);
  const legacyPaddingX = resolveDimension(brands, brandId, dimTok("padding-x"));
  const legacyPaddingY = resolveDimension(brands, brandId, dimTok("padding-y"));
  const headerPaddingX = resolveDimension(brands, brandId, dimTok("header-padding-x")) ?? legacyPaddingX;
  const headerPaddingY = resolveDimension(brands, brandId, dimTok("header-padding-y")) ?? legacyPaddingY;
  const bodyPaddingTop = resolveDimension(brands, brandId, dimTok("body-padding-top")) ?? 0;
  const bodyPaddingRight = resolveDimension(brands, brandId, dimTok("body-padding-right")) ?? legacyPaddingX;
  const bodyPaddingBottom = resolveDimension(brands, brandId, dimTok("body-padding-bottom")) ?? legacyPaddingY;
  const bodyPaddingLeft = resolveDimension(brands, brandId, dimTok("body-padding-left")) ?? legacyPaddingX;
  const footerPaddingTop = resolveDimension(brands, brandId, dimTok("footer-padding-top")) ?? legacyPaddingY;
  const footerPaddingRight = resolveDimension(brands, brandId, dimTok("footer-padding-right")) ?? legacyPaddingX;
  const footerPaddingBottom = resolveDimension(brands, brandId, dimTok("footer-padding-bottom")) ?? legacyPaddingY;
  const footerPaddingLeft = resolveDimension(brands, brandId, dimTok("footer-padding-left")) ?? legacyPaddingX;
  const titleFontSize = resolveDimension(brands, brandId, dimTok("title-font-size"));
  const titleFontFamily = resolveDimension(brands, brandId, dimTok("title-font-family"));
  const titleFontWeight = resolveDimension(brands, brandId, dimTok("title-font-weight"));
  const titleLineHeight = resolveDimension(brands, brandId, dimTok("title-line-height"));
  const bodyFontSize = resolveDimension(brands, brandId, dimTok("body-font-size"));
  const bodyFontFamily = resolveDimension(brands, brandId, dimTok("body-font-family"));
  const bodyFontWeight = resolveDimension(brands, brandId, dimTok("body-font-weight"));
  const bodyLineHeight = resolveDimension(brands, brandId, dimTok("body-line-height"));
  const borderWidth = resolveDimension(brands, brandId, dimTok("border-width"));
  const overlayOpacity = resolveDimension(brands, brandId, "modal-overlay-opacity");

  const overlayColor = toRgba(overlayColorBase, overlayOpacity);

  // Section dividers can either span the full modal width (edge to edge) or be
  // inset within the content's horizontal padding. Rendered as a standalone line
  // so both header (below) and footer (above) dividers share one behavior.
  const sectionDivider = (color, insetLeft, insetRight) =>
    showSectionDividers ? (
      <div
        style={{
          height: `${borderWidth}px`,
          background: color,
          marginLeft: dividerInset ? `${insetLeft}px` : 0,
          marginRight: dividerInset ? `${insetRight}px` : 0,
          flexShrink: 0,
        }}
      />
    ) : null;
  const primaryColor = resolveColor(brands, brandId, "interactive-primary");
  const onPrimary = resolveColor(brands, brandId, "text-on-interactive");

  return (
    <div style={{ width: "100%", minHeight: 280, position: "relative", overflow: "hidden", borderRadius: 8 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: withOverlay ? overlayColor : "transparent",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          width: "100%",
          minHeight: 280,
          display: "flex",
          justifyContent: "center",
          alignItems: centered ? "center" : "flex-start",
          paddingTop: centered ? 0 : 16,
          boxSizing: "border-box",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: width ? `${width}px` : 420,
            maxWidth: "92%",
            background,
            borderColor,
            borderWidth: `${borderWidth}px`,
            borderStyle: "solid",
            borderRadius: `${cornerRadius}px`,
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {layout === "centered-ack" ? (
            <>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: `${headerPaddingY}px ${headerPaddingX}px`,
                  fontSize: `${titleFontSize}px`,
                  fontFamily: titleFontFamily ? `"${titleFontFamily}", sans-serif` : undefined,
                  fontWeight: titleFontWeight === "Semi Bold" ? 600 : titleFontWeight === "Bold" ? 700 : 400,
                  lineHeight: titleLineHeight ? `${titleLineHeight}px` : undefined,
                  color: titleColor,
                  background: headerBackground,
                }}
              >
                {title}
                {withCloseButton ? (
                  <div
                    style={{
                      position: "absolute",
                      right: `${headerPaddingX}px`,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 16,
                      height: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: closeColor,
                      fontSize: 16,
                      lineHeight: "16px",
                      userSelect: "none",
                    }}
                  >
                    ×
                  </div>
                ) : null}
              </div>
              {sectionDivider(headerBorderColor, headerPaddingX, headerPaddingX)}
              <div
                style={{
                  color: bodyColor,
                  fontSize: `${bodyFontSize}px`,
                  fontFamily: bodyFontFamily ? `"${bodyFontFamily}", sans-serif` : undefined,
                  fontWeight: bodyFontWeight === "Semi Bold" ? 600 : bodyFontWeight === "Bold" ? 700 : 400,
                  lineHeight: bodyLineHeight ? `${bodyLineHeight}px` : 1.35,
                  padding: `${bodyPaddingTop}px ${bodyPaddingRight}px ${bodyPaddingBottom}px ${bodyPaddingLeft}px`,
                }}
              >
                {body}
              </div>
              {sectionDivider(footerBorderColor, footerPaddingLeft, footerPaddingRight)}
              <div
                style={{
                  padding: `${footerPaddingTop}px ${footerPaddingRight}px ${footerPaddingBottom}px ${footerPaddingLeft}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  background: footerBackground,
                }}
              >
                <button
                  style={{
                    background: "transparent",
                    color: titleColor,
                    border: `${borderWidth}px solid ${borderColor}`,
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    padding: "8px 14px",
                  }}
                >
                  Decline
                </button>
                <button
                  style={{
                    background: primaryColor,
                    color: onPrimary,
                    border: "none",
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    padding: "8px 16px",
                  }}
                >
                  Accept
                </button>
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: layout === "centered-action" ? "center" : "space-between",
                  padding: `${headerPaddingY}px ${headerPaddingX}px`,
                  borderRadius: `${cornerRadius}px ${cornerRadius}px 0 0`,
                  background: headerBackground,
                }}
              >
                <div
                  style={{
                    flex: layout === "centered-action" ? "0 1 auto" : 1,
                    minWidth: 0,
                    textAlign: layout === "centered-action" ? "center" : "left",
                    color: titleColor,
                    fontSize: `${titleFontSize}px`,
                    fontFamily: titleFontFamily ? `"${titleFontFamily}", sans-serif` : undefined,
                    fontWeight: titleFontWeight === "Semi Bold" ? 600 : titleFontWeight === "Bold" ? 700 : 400,
                    lineHeight: titleLineHeight ? `${titleLineHeight}px` : undefined,
                  }}
                >
                  {title}
                </div>
                {withCloseButton ? (
                  <div
                    style={{
                      ...(layout === "centered-action"
                        ? {
                            position: "absolute",
                            right: `${headerPaddingX}px`,
                            top: "50%",
                            transform: "translateY(-50%)",
                          }
                        : { marginLeft: 12 }),
                      width: 16,
                      height: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: closeColor,
                      fontSize: 16,
                      lineHeight: "16px",
                      userSelect: "none",
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </div>
                ) : null}
              </div>
              <div
                style={{
                  color: bodyColor,
                  fontSize: `${bodyFontSize}px`,
                  fontFamily: bodyFontFamily ? `"${bodyFontFamily}", sans-serif` : undefined,
                  fontWeight: bodyFontWeight === "Semi Bold" ? 600 : bodyFontWeight === "Bold" ? 700 : 400,
                  lineHeight: bodyLineHeight ? `${bodyLineHeight}px` : 1.45,
                  padding: `${bodyPaddingTop}px ${bodyPaddingRight}px ${bodyPaddingBottom}px ${bodyPaddingLeft}px`,
                }}
              >
                {body}
              </div>
              {layout === "actions-right" && (
                <div style={{ padding: `${footerPaddingTop}px ${footerPaddingRight}px ${footerPaddingBottom}px ${footerPaddingLeft}px` }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button
                      style={{
                        background: "transparent",
                        color: titleColor,
                        border: `${borderWidth}px solid ${borderColor}`,
                        borderRadius: 6,
                        fontSize: 14,
                        fontWeight: 600,
                        padding: "8px 14px",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      style={{
                        background: primaryColor,
                        color: onPrimary,
                        border: "none",
                        borderRadius: 6,
                        fontSize: 14,
                        fontWeight: 600,
                        padding: "8px 16px",
                      }}
                    >
                      Yes
                    </button>
                  </div>
                </div>
              )}
              {layout === "centered-action" && sectionDivider(footerBorderColor, footerPaddingLeft, footerPaddingRight)}
              {layout === "centered-action" && (
                <div
                  style={{
                    padding: `${footerPaddingTop}px ${footerPaddingRight}px ${footerPaddingBottom}px ${footerPaddingLeft}px`,
                    display: "flex",
                    justifyContent: "center",
                    background: footerBackground,
                  }}
                >
                  <button
                    style={{
                      background: primaryColor,
                      color: onPrimary,
                      border: "none",
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 600,
                      padding: "8px 20px",
                    }}
                  >
                    Button
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
