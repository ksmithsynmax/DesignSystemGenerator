import { resolveColor } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function DefaultPreview({ brands, brandId, previewTheme = "light" }) {
  const tokens = COMPONENT_TOKENS.default;
  const borderSemantic = tokens["default-border"]?.semantic;
  const borderColor = resolveColor(brands, brandId, borderSemantic, previewTheme, "default-border");
  const surface = resolveColor(brands, brandId, "surface-default", previewTheme, null);

  return (
    <div
      style={{
        width: 280,
        minHeight: 120,
        boxSizing: "border-box",
        borderRadius: 8,
        background: surface,
        border: `2px solid ${borderColor}`,
        padding: 16,
        fontSize: 13,
        color: resolveColor(brands, brandId, "text-default", previewTheme, null),
        lineHeight: 1.5,
      }}
    >
      Neutral surface with a <span style={{ fontFamily: "monospace" }}>default-border</span> stroke (semantic:{" "}
      <span style={{ fontFamily: "monospace" }}>border-default</span>).
    </div>
  );
}
