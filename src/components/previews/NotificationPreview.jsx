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
  const descriptionFontSize = resolveDimension(
    brands,
    brandId,
    "notification-description-font-size"
  );

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
          fontWeight: 600,
        },
        description: {
          color: descriptionColor,
          fontSize: descriptionFontSize,
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
