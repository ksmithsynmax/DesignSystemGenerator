import { Card, Group, Text } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function CardPreview({
  brands,
  brandId,
  variant = "default",
  size = "default",
  radius = "default",
  interactiveState = "default",
  withBorder = true,
  withShadow = false,
  showSection = true,
  title = "PlanetScope vessel",
  description = "Detected vessel metadata and imagery details from latest satellite capture.",
}) {
  const tokens = COMPONENT_TOKENS.card;
  const variantKey = String(variant || "default").toLowerCase();
  const stateSuffix = interactiveState && interactiveState !== "default" ? `-${interactiveState}` : "";
  const tokenKey = (slot) =>
    tokens[`card-${variantKey}-${slot}${stateSuffix}`]
      ? `card-${variantKey}-${slot}${stateSuffix}`
      : tokens[`card-${variantKey}-${slot}`]
        ? `card-${variantKey}-${slot}`
        : tokens[`card-default-${slot}${stateSuffix}`]
          ? `card-default-${slot}${stateSuffix}`
          : tokens[`card-default-${slot}`]
            ? `card-default-${slot}`
            : tokens[`card-${slot}${stateSuffix}`]
              ? `card-${slot}${stateSuffix}`
              : `card-${slot}`;

  const backgroundToken = tokenKey("background");
  const borderToken = tokenKey("border");
  const titleToken = tokenKey("title");
  const descriptionToken = tokenKey("description");
  const sectionBackgroundToken = tokenKey("section-background");

  const background = resolveColor(brands, brandId, tokens[backgroundToken]?.semantic, "light", backgroundToken);
  const borderColor = resolveColor(brands, brandId, tokens[borderToken]?.semantic, "light", borderToken);
  const titleColor = resolveColor(brands, brandId, tokens[titleToken]?.semantic, "light", titleToken);
  const descriptionColor = resolveColor(brands, brandId, tokens[descriptionToken]?.semantic, "light", descriptionToken);
  const sectionBackground = resolveColor(
    brands,
    brandId,
    tokens[sectionBackgroundToken]?.semantic,
    "light",
    sectionBackgroundToken
  );
  const cardPadding = resolveDimension(brands, brandId, "card-padding", size);
  const cardRadius = resolveDimension(brands, brandId, "card-radius", radius);
  const titleFontSize = resolveDimension(brands, brandId, "card-title-font-size", size);
  const titleFontFamily = resolveDimension(brands, brandId, "card-title-font-family");
  const titleFontWeight = resolveDimension(brands, brandId, "card-title-font-weight");
  const titleLineHeight = resolveDimension(brands, brandId, "card-title-line-height", size);
  const descriptionFontSize = resolveDimension(brands, brandId, "card-description-font-size", size);
  const descriptionFontFamily = resolveDimension(brands, brandId, "card-description-font-family");
  const descriptionFontWeight = resolveDimension(brands, brandId, "card-description-font-weight");
  const descriptionLineHeight = resolveDimension(brands, brandId, "card-description-line-height", size);
  const sectionHeight = resolveDimension(brands, brandId, "card-section-height");
  const gap = resolveDimension(brands, brandId, "card-gap", size);
  const borderWidth = resolveDimension(brands, brandId, "card-border-width");
  const shadowBlur = resolveDimension(brands, brandId, "card-shadow-blur");
  const shadowOffsetY = resolveDimension(brands, brandId, "card-shadow-offset-y");
  const shadowAlpha = resolveDimension(brands, brandId, "card-shadow-alpha");

  const shadow =
    withShadow && shadowBlur != null && shadowOffsetY != null
      ? `0 ${shadowOffsetY}px ${shadowBlur}px rgba(0, 0, 0, ${(shadowAlpha ?? 18) / 100})`
      : "none";
  const isDisabled = interactiveState === "disabled";
  const isHovered = interactiveState === "hover";
  const isPressed = interactiveState === "pressed";
  const isFocused = interactiveState === "focus";
  const stateTransform = isPressed ? "translateY(1px)" : isHovered ? "translateY(-1px)" : "none";
  const baseShadow = shadow !== "none" ? `${shadow}` : "";
  const hoverShadow = isHovered && shadowBlur != null && shadowOffsetY != null
    ? `0 ${Math.max(1, shadowOffsetY + 1)}px ${Math.max(2, shadowBlur + 6)}px rgba(0, 0, 0, ${Math.min(0.35, ((shadowAlpha ?? 18) + 8) / 100)})`
    : "";
  const focusRing = isFocused ? "0 0 0 2px rgba(34, 139, 230, 0.35)" : "";
  const computedShadow = [baseShadow, hoverShadow, focusRing].filter(Boolean).join(", ") || "none";

  return (
    <Card
      withBorder={withBorder}
      style={{
        width: 320,
        background,
        borderColor: withBorder ? borderColor : "transparent",
        borderWidth: withBorder ? borderWidth : 0,
        borderRadius: cardRadius,
        boxShadow: computedShadow,
        transform: stateTransform,
        transition: "transform 120ms ease, box-shadow 120ms ease",
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.6 : 1,
        pointerEvents: isDisabled ? "none" : "auto",
      }}
      padding={cardPadding}
      radius={cardRadius}
    >
      {showSection && (
        <Card.Section
          style={{
            height: sectionHeight,
            background: sectionBackground,
          }}
        />
      )}
      <div style={{ paddingTop: showSection ? gap : 0 }}>
        <Group justify="space-between" align="center" mb={6}>
          <Text
            style={{
              color: titleColor,
              fontSize: titleFontSize,
              fontFamily: titleFontFamily ? `"${titleFontFamily}", sans-serif` : undefined,
              fontWeight: titleFontWeight === "Semi Bold" ? 600 : titleFontWeight === "Bold" ? 700 : 400,
              lineHeight: titleLineHeight ? `${titleLineHeight}px` : undefined,
            }}
          >
            {title}
          </Text>
        </Group>
        <Text
          style={{
            color: descriptionColor,
            fontSize: descriptionFontSize,
            fontFamily: descriptionFontFamily ? `"${descriptionFontFamily}", sans-serif` : undefined,
            fontWeight: descriptionFontWeight === "Semi Bold" ? 600 : descriptionFontWeight === "Bold" ? 700 : 400,
            lineHeight: descriptionLineHeight ? `${descriptionLineHeight}px` : undefined,
          }}
        >
          {description}
        </Text>
      </div>
    </Card>
  );
}
