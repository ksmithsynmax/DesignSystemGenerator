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
  size = "md",
  radius = "md",
  layout = "basic",
  withOverlay = true,
  withCloseButton = true,
  centered = true,
  showSectionDividers = true,
  title = "Modal title",
  body = "This action cannot be undone. Please confirm you want to proceed.",
}) {
  const tokens = COMPONENT_TOKENS.modal;
  const background = resolveColor(brands, brandId, tokens["modal-background"]?.semantic, "light", "modal-background");
  const headerBackground = resolveColor(
    brands,
    brandId,
    tokens["modal-header-background"]?.semantic,
    "light",
    "modal-header-background"
  );
  const footerBackground = resolveColor(
    brands,
    brandId,
    tokens["modal-footer-background"]?.semantic,
    "light",
    "modal-footer-background"
  );
  const borderColor = resolveColor(brands, brandId, tokens["modal-border"]?.semantic, "light", "modal-border");
  const titleColor = resolveColor(brands, brandId, tokens["modal-title"]?.semantic, "light", "modal-title");
  const bodyColor = resolveColor(brands, brandId, tokens["modal-body"]?.semantic, "light", "modal-body");
  const overlayColorBase = resolveColor(brands, brandId, tokens["modal-overlay"]?.semantic, "light", "modal-overlay");
  const closeColor = resolveColor(brands, brandId, tokens["modal-close"]?.semantic, "light", "modal-close");

  const width = resolveDimension(brands, brandId, "modal-width", size);
  const cornerRadius = resolveDimension(brands, brandId, "modal-radius", radius);
  const paddingX = resolveDimension(brands, brandId, "modal-padding-x");
  const paddingY = resolveDimension(brands, brandId, "modal-padding-y");
  const titleFontSize = resolveDimension(brands, brandId, "modal-title-font-size");
  const titleFontFamily = resolveDimension(brands, brandId, "modal-title-font-family");
  const titleFontWeight = resolveDimension(brands, brandId, "modal-title-font-weight");
  const titleLineHeight = resolveDimension(brands, brandId, "modal-title-line-height");
  const bodyFontSize = resolveDimension(brands, brandId, "modal-body-font-size");
  const bodyFontFamily = resolveDimension(brands, brandId, "modal-body-font-family");
  const bodyFontWeight = resolveDimension(brands, brandId, "modal-body-font-weight");
  const bodyLineHeight = resolveDimension(brands, brandId, "modal-body-line-height");
  const borderWidth = resolveDimension(brands, brandId, "modal-border-width");
  const overlayOpacity = resolveDimension(brands, brandId, "modal-overlay-opacity");

  const overlayColor = toRgba(overlayColorBase, overlayOpacity);
  const primaryColor = resolveColor(brands, brandId, "interactive-primary");
  const onPrimary = resolveColor(brands, brandId, "text-on-interactive");
  const dividerColor = borderColor;

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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: `${paddingY}px ${paddingX}px`,
                  borderBottom: showSectionDividers ? `${borderWidth}px solid ${dividerColor}` : "none",
                  fontSize: `${titleFontSize}px`,
                  fontFamily: titleFontFamily ? `"${titleFontFamily}", sans-serif` : undefined,
                  fontWeight: titleFontWeight === "Semi Bold" ? 600 : titleFontWeight === "Bold" ? 700 : 400,
                  lineHeight: titleLineHeight ? `${titleLineHeight}px` : undefined,
                  color: titleColor,
                  background: headerBackground,
                }}
              >
                {title}
              </div>
              <div
                style={{
                  color: bodyColor,
                  fontSize: `${bodyFontSize}px`,
                  fontFamily: bodyFontFamily ? `"${bodyFontFamily}", sans-serif` : undefined,
                  fontWeight: bodyFontWeight === "Semi Bold" ? 600 : bodyFontWeight === "Bold" ? 700 : 400,
                  lineHeight: bodyLineHeight ? `${bodyLineHeight}px` : 1.35,
                  padding: `${paddingY}px ${paddingX}px`,
                }}
              >
                {body}
              </div>
              <div
                style={{
                  borderTop: showSectionDividers ? `${borderWidth}px solid ${dividerColor}` : "none",
                  padding: `${paddingY}px ${paddingX}px`,
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: `${paddingY}px ${paddingX}px`,
                  borderRadius: `${cornerRadius}px ${cornerRadius}px 0 0`,
                  background: headerBackground,
                }}
              >
                <div style={{
                  color: titleColor,
                  fontSize: `${titleFontSize}px`,
                  fontFamily: titleFontFamily ? `"${titleFontFamily}", sans-serif` : undefined,
                  fontWeight: titleFontWeight === "Semi Bold" ? 600 : titleFontWeight === "Bold" ? 700 : 400,
                  lineHeight: titleLineHeight ? `${titleLineHeight}px` : undefined,
                }}>{title}</div>
                {withCloseButton ? (
                  <div style={{ color: closeColor, fontSize: 18, lineHeight: 1, userSelect: "none" }}>×</div>
                ) : null}
              </div>
              <div
                style={{
                  color: bodyColor,
                  fontSize: `${bodyFontSize}px`,
                  fontFamily: bodyFontFamily ? `"${bodyFontFamily}", sans-serif` : undefined,
                  fontWeight: bodyFontWeight === "Semi Bold" ? 600 : bodyFontWeight === "Bold" ? 700 : 400,
                  lineHeight: bodyLineHeight ? `${bodyLineHeight}px` : 1.45,
                  padding: `0 ${paddingX}px ${paddingY}px ${paddingX}px`,
                }}
              >
                {body}
              </div>
              {layout === "actions-right" && (
                <div style={{ padding: `0 ${paddingX}px ${paddingY}px ${paddingX}px` }}>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
