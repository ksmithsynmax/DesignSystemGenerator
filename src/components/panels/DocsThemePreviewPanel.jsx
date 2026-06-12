import { resolveColor } from "../../utils/resolveToken";

// A small mock of the generated documentation page so designers can see how the
// page background, card background, and card border resolve for the active brand
// and theme. Only the three docs-chrome tokens are configurable; the text colors
// here are pulled from the brand's text semantics purely for a realistic preview.
export function DocsThemePreviewContent({ brands, activeBrand, previewTheme = "light" }) {
  const brand = brands?.[activeBrand];
  const theme = previewTheme === "dark" ? "dark" : "light";

  const pageBg = resolveColor(brands, activeBrand, "surface-primary", theme, "docs-page-background");
  const cardBg = resolveColor(brands, activeBrand, "surface-secondary", theme, "docs-card-background");
  const cardBorder = resolveColor(brands, activeBrand, "border-primary", theme, "docs-card-border");
  const titleColor = resolveColor(brands, activeBrand, "text-default", theme, "docs-title");
  const subtleColor = resolveColor(brands, activeBrand, "text-subtle", theme, "docs-body-text");
  const headingColor = resolveColor(brands, activeBrand, "interactive-primary", theme, "docs-section-heading");

  const card = (title, subtitle) => (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 8,
        padding: 16,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: titleColor, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: subtleColor, lineHeight: 1.5 }}>{subtitle}</div>
    </div>
  );

  return (
    <div>
      <div
        style={{
          fontSize: 13,
          fontFamily: "monospace",
          color: "#868E96",
          marginBottom: 18,
        }}
      >
        {brand?.name || activeBrand} — docs theme ({theme})
      </div>

      <div
        style={{
          background: pageBg,
          borderRadius: 10,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: headingColor }}>
          Section heading
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: titleColor }}>Documentation</div>
        <div style={{ fontSize: 13, color: subtleColor, marginBottom: 4 }}>
          Page background, cards, borders, and text below use the Docs Theme tokens.
        </div>
        {card("Overview", "This card uses docs-card-background and docs-card-border.")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {card("Primitives", "Cards sit on docs-page-background.")}
          {card("Semantics", "Borders use docs-card-border.")}
        </div>
      </div>
    </div>
  );
}

export default DocsThemePreviewContent;
