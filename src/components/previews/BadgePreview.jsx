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
  const brand = brands[brandId] || {};

  const bgKey = `badge-${variant}-background`;
  const textKey = `badge-${variant}-text`;
  const borderKey = `badge-${variant}-border`;

  const background = resolveColor(brands, brandId, tokens[bgKey]?.semantic, "light", bgKey);
  const color = resolveColor(brands, brandId, tokens[textKey]?.semantic, "light", textKey);
  const borderColor = resolveColor(brands, brandId, tokens[borderKey]?.semantic, "light", borderKey);

  const resolveSizedToken = (tokenName, sizeKey) => {
    const tokenDef = tokens[tokenName];
    if (!tokenDef?.sizes) return resolveDimension(brands, brandId, tokenName);
    const override = brand.dimensionOverrides?.[tokenName]?.[sizeKey];
    if (override !== undefined) return override;
    return tokenDef.sizes[sizeKey] ?? null;
  };

  const sizeKey = size || "default";
  const radiusKey = radius || "default";

  const fontSize = resolveSizedToken("badge-font-size", sizeKey);
  const fontFamily = resolveDimension(brands, brandId, "badge-font-family");
  const fontWeight = resolveDimension(brands, brandId, "badge-font-weight");
  const lineHeight = resolveSizedToken("badge-line-height", sizeKey);
  const paddingX = resolveSizedToken("badge-padding-x", sizeKey);
  const paddingY = resolveSizedToken("badge-padding-y", sizeKey);
  const borderRadius = resolveSizedToken("badge-radius", radiusKey);
  const borderWidth = resolveDimension(brands, brandId, "badge-border-width");
  const computedHeight = Math.max(16, (lineHeight || fontSize || 12) + (paddingY || 0) * 2 + (borderWidth || 0) * 2);

  const content = circle ? "8" : text;

  return (
    <div style={{ width: fullWidth ? 220 : "auto" }}>
      <Badge
        variant={variant === "default" ? "filled" : variant}
        size={size === "default" ? "md" : size}
        radius={radius === "default" ? "md" : radius}
        circle={circle}
        fullWidth={fullWidth}
        vars={() => ({
          root: {
            "--badge-radius": circle ? "999px" : `${borderRadius}px`,
          },
        })}
        style={{
          backgroundColor: background,
          color,
          border: `${borderWidth}px solid ${borderColor}`,
          minHeight: `${computedHeight}px`,
          width: fullWidth ? "100%" : circle ? `${computedHeight}px` : "fit-content",
          borderRadius: circle ? "999px" : `${borderRadius}px`,
          paddingLeft: circle ? 0 : `${paddingX}px`,
          paddingRight: circle ? 0 : `${paddingX}px`,
          paddingTop: circle ? 0 : `${paddingY}px`,
          paddingBottom: circle ? 0 : `${paddingY}px`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          textTransform: "uppercase",
        }}
        styles={{
          root: {
            borderRadius: circle ? "999px" : `${borderRadius}px`,
          },
          label: {
            color,
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : undefined,
            fontWeight: fontWeight === "Semi Bold" ? 600 : fontWeight === "Bold" ? 700 : 400,
            lineHeight: lineHeight ? `${lineHeight}px` : undefined,
            padding: 0,
          },
        }}
      >
        {content}
      </Badge>
    </div>
  );
}
