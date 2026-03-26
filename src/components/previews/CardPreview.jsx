import { Badge, Card, Group, Text } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function CardPreview({
  brands,
  brandId,
  size = "md",
  radius = "md",
  withBorder = true,
  withShadow = false,
  showSection = true,
  showBadge = true,
  title = "PlanetScope vessel",
  description = "Detected vessel metadata and imagery details from latest satellite capture.",
}) {
  const tokens = COMPONENT_TOKENS.card;

  const background = resolveColor(brands, brandId, tokens["card-background"]?.semantic, "light", "card-background");
  const borderColor = resolveColor(brands, brandId, tokens["card-border"]?.semantic, "light", "card-border");
  const titleColor = resolveColor(brands, brandId, tokens["card-title"]?.semantic, "light", "card-title");
  const descriptionColor = resolveColor(brands, brandId, tokens["card-description"]?.semantic, "light", "card-description");
  const sectionBackground = resolveColor(
    brands,
    brandId,
    tokens["card-section-background"]?.semantic,
    "light",
    "card-section-background"
  );
  const badgeBackground = resolveColor(
    brands,
    brandId,
    tokens["card-badge-background"]?.semantic,
    "light",
    "card-badge-background"
  );
  const badgeColor = resolveColor(brands, brandId, tokens["card-badge-color"]?.semantic, "light", "card-badge-color");

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

  return (
    <Card
      withBorder={withBorder}
      style={{
        width: 320,
        background,
        borderColor: withBorder ? borderColor : "transparent",
        borderWidth: withBorder ? borderWidth : 0,
        borderRadius: cardRadius,
        boxShadow: shadow,
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
          {showBadge && (
            <Badge
              size="sm"
              style={{
                background: badgeBackground,
                color: badgeColor,
                fontFamily: titleFontFamily ? `"${titleFontFamily}", sans-serif` : undefined,
              }}
            >
              New
            </Badge>
          )}
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
