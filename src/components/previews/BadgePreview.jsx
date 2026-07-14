import { Badge } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

/** Semantic tones only apply with `filled` or `outline` (see component tokens). */
export function badgeColorTokenKeys(variant, tone) {
  const t = tone === "default" ? null : tone;
  if (
    (variant === "filled" || variant === "outline") &&
    t &&
    ["success", "warning", "error"].includes(t)
  ) {
    return {
      bg: `badge-${variant}-${t}-background`,
      text: `badge-${variant}-${t}-text`,
      border: `badge-${variant}-${t}-border`,
    };
  }
  return {
    bg: `badge-${variant}-background`,
    text: `badge-${variant}-text`,
    border: `badge-${variant}-border`,
  };
}

export default function BadgePreview({
  brands,
  brandId,
  variant = "filled",
  tone = "default",
  size = "md",
  radius = "md",
  circle = false,
  fullWidth = false,
  withRemoveButton = false,
  text = "Badge",
  /** Match surrounding preview: "light" | "dark" — drives semantic color resolution. */
  previewTheme = "light",
  /** Label casing; default matches standalone badge preview. */
  textTransform = "uppercase",
}) {
  const tokens = COMPONENT_TOKENS.badge;
  const brand = brands[brandId] || {};
  const colorTheme = previewTheme === "dark" ? "dark" : "light";
  const effectiveTone =
    variant === "filled" || variant === "outline" ? tone : "default";
  const { bg: bgKey, text: textKey, border: borderKey } = badgeColorTokenKeys(variant, effectiveTone);

  const background = resolveColor(brands, brandId, tokens[bgKey]?.semantic, colorTheme, bgKey);
  const color = resolveColor(brands, brandId, tokens[textKey]?.semantic, colorTheme, textKey);
  const borderColor = resolveColor(brands, brandId, tokens[borderKey]?.semantic, colorTheme, borderKey);

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
  const radiusDef = tokens["badge-radius"];
  const borderRadiusRaw = resolveSizedToken("badge-radius", radiusKey);
  const borderRadiusPx =
    Number.isFinite(Number(borderRadiusRaw)) && Number(borderRadiusRaw) >= 0
      ? Number(borderRadiusRaw)
      : Number(radiusDef?.sizes?.[radiusKey] ?? radiusDef?.sizes?.default ?? 8);
  const borderWidth = resolveDimension(brands, brandId, "badge-border-width");
  const computedHeight = Math.max(16, (lineHeight || fontSize || 12) + (paddingY || 0) * 2 + (borderWidth || 0) * 2);

  const removeSize = resolveSizedToken("badge-remove-size", sizeKey);
  const removeStrokeWidth = resolveSizedToken("badge-remove-icon-stroke-width", sizeKey);
  const showRemove = withRemoveButton && !circle;

  const label = circle ? "8" : text;
  const content = showRemove ? (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span>{label}</span>
      <svg
        width={removeSize ?? 14}
        height={removeSize ?? 14}
        viewBox="0 0 24 24"
        fill="none"
        style={{ display: "block", flexShrink: 0 }}
        aria-hidden="true"
      >
        <path
          d="M18 6 6 18M6 6l12 12"
          stroke={color}
          strokeWidth={removeStrokeWidth ?? 2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  ) : (
    label
  );

  return (
    <div style={{ width: fullWidth ? 220 : "auto" }}>
      <Badge
        variant={
          variant === "outline" ? "outline" : variant === "light" ? "light" : "filled"
        }
        size={size === "default" ? "md" : size}
        // Omit `radius`: Mantine maps it to theme getRadius(), which overrides design-token `badge-radius-*`.
        radius={undefined}
        circle={circle}
        fullWidth={fullWidth}
        vars={() => ({
          root: {
            "--badge-radius": circle ? "9999px" : `${borderRadiusPx}px`,
          },
        })}
        style={{
          backgroundColor: background,
          color,
          border: `${borderWidth}px solid ${borderColor}`,
          minHeight: `${computedHeight}px`,
          width: fullWidth ? "100%" : circle ? `${computedHeight}px` : "fit-content",
          borderRadius: circle ? "9999px" : `${borderRadiusPx}px`,
          overflow: "hidden",
          paddingLeft: circle ? 0 : `${paddingX}px`,
          paddingRight: circle ? 0 : `${paddingX}px`,
          paddingTop: circle ? 0 : `${paddingY}px`,
          paddingBottom: circle ? 0 : `${paddingY}px`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          textTransform,
        }}
        styles={{
          root: {
            borderRadius: circle ? "9999px" : `${borderRadiusPx}px`,
            overflow: "hidden",
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
