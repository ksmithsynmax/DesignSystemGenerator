import { Notification } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function NotificationPreview({
  brands,
  brandId,
  radius = "md",
  color = "blue",
  title = "We notify you that",
  description = "You are now obligated to give a star to Mantine project on GitHub",
  withBorder = false,
  withCloseButton = false,
  withIcon = false,
  loading = false,
}) {
  const tokens = COMPONENT_TOKENS.notification;

  const background = resolveColor(
    brands,
    brandId,
    tokens["notification-background"]?.semantic,
    "light",
    "notification-background"
  );
  const borderColor = resolveColor(
    brands,
    brandId,
    tokens["notification-border"]?.semantic,
    "light",
    "notification-border"
  );
  const titleColor = resolveColor(
    brands,
    brandId,
    tokens["notification-title"]?.semantic,
    "light",
    "notification-title"
  );
  const descriptionColor = resolveColor(
    brands,
    brandId,
    tokens["notification-description"]?.semantic,
    "light",
    "notification-description"
  );
  const iconColor = resolveColor(
    brands,
    brandId,
    tokens["notification-icon"]?.semantic,
    "light",
    "notification-icon"
  );
  const closeColor = resolveColor(
    brands,
    brandId,
    tokens["notification-close"]?.semantic,
    "light",
    "notification-close"
  );

  const borderWidth = resolveDimension(brands, brandId, "notification-border-width");
  const cornerRadius = resolveDimension(brands, brandId, "notification-radius", radius);
  const paddingX = resolveDimension(brands, brandId, "notification-padding-x");
  const paddingY = resolveDimension(brands, brandId, "notification-padding-y");
  const titleFontSize = resolveDimension(brands, brandId, "notification-title-font-size");
  const titleFontFamily = resolveDimension(brands, brandId, "notification-title-font-family");
  const titleFontWeight = resolveDimension(brands, brandId, "notification-title-font-weight");
  const titleLineHeight = resolveDimension(brands, brandId, "notification-title-line-height");
  const descriptionFontSize = resolveDimension(
    brands,
    brandId,
    "notification-description-font-size"
  );
  const descriptionFontFamily = resolveDimension(brands, brandId, "notification-description-font-family");
  const descriptionFontWeight = resolveDimension(brands, brandId, "notification-description-font-weight");
  const descriptionLineHeight = resolveDimension(brands, brandId, "notification-description-line-height");

  const iconNode = withIcon ? (
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: 999,
        background: iconColor,
      }}
    />
  ) : null;

  return (
    <Notification
      title={title}
      color={color}
      icon={iconNode}
      loading={loading}
      withCloseButton={withCloseButton}
      withBorder={withBorder}
      styles={{
        root: {
          background: background,
          borderColor: withBorder ? borderColor : "transparent",
          borderWidth: withBorder ? borderWidth : 0,
          borderRadius: cornerRadius,
          padding: `${paddingY}px ${paddingX}px`,
          width: 360,
        },
        title: {
          color: titleColor,
          fontSize: titleFontSize,
          fontFamily: titleFontFamily ? `"${titleFontFamily}", sans-serif` : undefined,
          fontWeight: titleFontWeight === "Semi Bold" ? 600 : titleFontWeight === "Bold" ? 700 : 400,
          lineHeight: titleLineHeight ? `${titleLineHeight}px` : undefined,
        },
        description: {
          color: descriptionColor,
          fontSize: descriptionFontSize,
          fontFamily: descriptionFontFamily ? `"${descriptionFontFamily}", sans-serif` : undefined,
          fontWeight: descriptionFontWeight === "Semi Bold" ? 600 : descriptionFontWeight === "Bold" ? 700 : 400,
          lineHeight: descriptionLineHeight ? `${descriptionLineHeight}px` : undefined,
        },
        closeButton: {
          color: closeColor,
        },
      }}
    >
      {description}
    </Notification>
  );
}
