// Perceived luminance of a #RRGGBB(AA) color; >0.6 reads as a light surface, so
// the muted stage label flips to a dark tone for contrast.
function isLightSurface(hex) {
  if (typeof hex !== "string") return false;
  const m = hex.trim().replace(/^#/, "");
  if (m.length < 6) return false;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return false;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6;
}

export default function PreviewStage({
  children,
  label,
  padding = 32,
  gap = 16,
  contentAlignItems = "center",
  contentJustifyContent = "center",
}) {
  const previewTheme =
    typeof window !== "undefined" && window.__DSG_PREVIEW_THEME === "light" ? "light" : "dark";
  const previewBrand =
    typeof window !== "undefined" ? String(window.__DSG_PREVIEW_BRAND || "").toLowerCase() : "";

  // Follow the active brand's `surface-canvas` token (per theme), exposed by App
  // on window.__DSG_PREVIEW_SURFACE, so any brand's canvas matches what it sets.
  // Fall back to the legacy constants only if a token color isn't available.
  const tokenSurface =
    typeof window !== "undefined" ? window.__DSG_PREVIEW_SURFACE : null;
  const isTheia = previewBrand === "theia";
  const isHyperion = previewBrand === "hyperion";
  const fallbackBackground = isTheia
    ? "#181926"
    : isHyperion
      ? "#F1F3F5"
      : previewTheme === "light"
        ? "#F1F3F5"
        : "#181926";
  const background =
    typeof tokenSurface === "string" && tokenSurface.startsWith("#")
      ? tokenSurface
      : fallbackBackground;
  const labelColor = isLightSurface(background) ? "#495057" : "#868E96";

  return (
    <div
      style={{
        background,
        borderRadius: 8,
        padding,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginBottom: 24,
        minHeight: "calc(100vh - 250px)",
      }}
    >
      {label && (
        <div style={{ fontSize: 13, fontFamily: "monospace", color: labelColor, marginBottom: 16 }}>
          {label}
        </div>
      )}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: contentAlignItems,
          justifyContent: contentJustifyContent,
          gap,
          width: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}
