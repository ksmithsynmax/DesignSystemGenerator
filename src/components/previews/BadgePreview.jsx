import { Badge } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function BadgePreview({
  brands,
  brandId,
  variant = "filled",
  size = "md",
  radius = "md",
  circle = false,
  fullWidth = false,
  text = "Badge",
}) {
  const tokens = COMPONENT_TOKENS.badge;

  const bgKey = `badge-${variant}-background`;
  const textKey = `badge-${variant}-text`;
  const borderKey = `badge-${variant}-border`;

  const background = resolveColor(brands, brandId, tokens[bgKey]?.semantic, "light", bgKey);
  const color = resolveColor(brands, brandId, tokens[textKey]?.semantic, "light", textKey);
  const borderColor = resolveColor(brands, brandId, tokens[borderKey]?.semantic, "light", borderKey);
  const dotColor = resolveColor(brands, brandId, tokens["badge-dot-color"]?.semantic, "light", "badge-dot-color");

  const height = resolveDimension(brands, brandId, "badge-height", size);
  const fontSize = resolveDimension(brands, brandId, "badge-font-size", size);
  const paddingX = resolveDimension(brands, brandId, "badge-padding-x", size);
  const borderRadius = resolveDimension(brands, brandId, "badge-radius", radius);
  const borderWidth = resolveDimension(brands, brandId, "badge-border-width");
  const dotSize = resolveDimension(brands, brandId, "badge-dot-size", size);

  const content = circle ? "8" : text;

  return (
    <div style={{ width: fullWidth ? 220 : "auto" }}>
      <Badge
        variant={variant}
        size={size}
        radius={radius}
        circle={circle}
        fullWidth={fullWidth}
        styles={{
          root: {
            backgroundColor: background,
            color,
            border: `${borderWidth}px solid ${borderColor}`,
            minHeight: `${height}px`,
            borderRadius: `${borderRadius}px`,
            paddingInline: circle ? undefined : `${paddingX}px`,
            fontSize: `${fontSize}px`,
            fontWeight: 600,
            ...(variant === "dot" && !circle
              ? {
                  "&::before": {
                    backgroundColor: dotColor,
                    width: `${dotSize}px`,
                    height: `${dotSize}px`,
                  },
                }
              : {}),
          },
          label: {
            color,
            fontSize: `${fontSize}px`,
            display: "inline-flex",
            alignItems: "center",
            gap: variant === "dot" ? 6 : 0,
          },
        }}
      >
        {content}
      </Badge>
    </div>
  );
}
