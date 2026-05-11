import { Notification } from "@mantine/core";
import MessageNotificationCircleIcon from "@untitledui-icons/react/line/MessageNotificationCircleIcon";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";
import { notificationSemanticToMantineColor } from "../../utils/notificationSemanticColors";

/** Matches Figma `buildNotificationComponentSet` (accent x=8, w=6; title x=24 when accent, no icon). */
const NOTIFICATION_ACCENT_LEFT = 8;
const NOTIFICATION_ACCENT_WIDTH = 6;
const NOTIFICATION_TEXT_INSET_ACCENT = 24;

export default function NotificationPreview({
  brands,
  brandId,
  previewTheme = "light",
  radius = "md",
  color = "primary",
  title = "We notify you that",
  description = "You are now obligated to give a star to Mantine project on GitHub",
  withBorder = false,
  withCloseButton = false,
  withIcon = false,
  loading = false,
  withAccent = true,
}) {
  const colorTheme = previewTheme === "dark" ? "dark" : "light";
  const tokens = COMPONENT_TOKENS.notification;
  const toneKey = String(color || "primary").toLowerCase();
  const isDarkTone = toneKey === "dark";

  const def = (suffix) => `notification-${suffix}`;
  const dark = (suffix) => `notification-dark-${suffix}`;

  const pickLayer = (suffix) => {
    const dk = dark(suffix);
    if (isDarkTone && tokens[dk]) return { key: dk, def: tokens[dk] };
    const k = def(suffix);
    return { key: k, def: tokens[k] };
  };

  const indicatorToneKey = `indicator-${toneKey}`;
  const indicatorDefKey = def(indicatorToneKey);
  let indicatorSemantic;
  let indicatorLabel;
  if (tokens[indicatorDefKey]) {
    indicatorSemantic = tokens[indicatorDefKey].semantic;
    indicatorLabel = indicatorDefKey;
  } else if (isDarkTone && tokens[dark("accent")]) {
    indicatorSemantic = tokens[dark("accent")].semantic;
    indicatorLabel = dark("accent");
  } else {
    indicatorSemantic = tokens[def("accent")]?.semantic;
    indicatorLabel = def("accent");
  }

  const accentColor = resolveColor(brands, brandId, indicatorSemantic, colorTheme, indicatorLabel);

  const borderToneKey = `border-${toneKey}`;
  const borderToneDef = def(borderToneKey);
  let borderSemantic;
  let borderTokenLabel;
  if (tokens[borderToneDef]) {
    borderSemantic = tokens[borderToneDef].semantic;
    borderTokenLabel = borderToneDef;
  } else {
    borderSemantic =
      tokens[def("border-default")]?.semantic ||
      tokens[def("border-primary")]?.semantic;
    borderTokenLabel = tokens[def("border-default")] ? def("border-default") : def("border-primary");
  }

  const bgPick = pickLayer("background");
  const titlePick = pickLayer("title");
  const descPick = pickLayer("description");
  const iconPick = pickLayer("icon");
  const closePick = pickLayer("close");

  const background = resolveColor(
    brands,
    brandId,
    bgPick.def?.semantic,
    colorTheme,
    bgPick.key
  );
  const borderColor = resolveColor(
    brands,
    brandId,
    borderSemantic,
    colorTheme,
    borderTokenLabel
  );
  const titleColor = resolveColor(brands, brandId, titlePick.def?.semantic, colorTheme, titlePick.key);
  const descriptionColor = resolveColor(
    brands,
    brandId,
    descPick.def?.semantic,
    colorTheme,
    descPick.key
  );
  const iconColor = resolveColor(brands, brandId, iconPick.def?.semantic, colorTheme, iconPick.key);
  const closeColor = resolveColor(brands, brandId, closePick.def?.semantic, colorTheme, closePick.key);

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
  const iconStrokeWidth = resolveDimension(brands, brandId, "notification-icon-stroke-width");
  const closeStrokeWidth = resolveDimension(brands, brandId, "notification-close-stroke-width");

  const iconStrokeWidthNum = Number(iconStrokeWidth);
  const closeStrokeWidthNum = Number(closeStrokeWidth);
  const iconStrokeWidthSafe = Number.isFinite(iconStrokeWidthNum) ? iconStrokeWidthNum : 2;
  const closeStrokeWidthSafe = Number.isFinite(closeStrokeWidthNum) ? closeStrokeWidthNum : 2;

  const iconNode = withIcon ? (
    <MessageNotificationCircleIcon
      width={16}
      height={16}
      strokeWidth={iconStrokeWidthSafe}
      style={{ color: iconColor }}
    />
  ) : null;

  const effectiveWithAccent = Boolean(withAccent) && !loading;
  const showAccentBar = effectiveWithAccent;
  const effectiveWithBorder = Boolean(withBorder);
  const mantineColor = notificationSemanticToMantineColor(color);

  const bw = Number(borderWidth);
  const borderW = Number.isFinite(bw) && bw > 0 ? bw : 1;
  const radiusPx = (() => {
    const n = Number(cornerRadius);
    return Number.isFinite(n) ? n : 8;
  })();
  const padX = Number(paddingX);
  const padY = Number(paddingY);
  const padXSafe = Number.isFinite(padX) ? padX : 12;
  const padYSafe = Number.isFinite(padY) ? padY : 10;

  const accentInsetY = Math.max(8, radiusPx);

  const rootPadding =
    showAccentBar && !iconNode
      ? {
          paddingTop: padYSafe,
          paddingBottom: padYSafe,
          paddingInlineStart: NOTIFICATION_TEXT_INSET_ACCENT,
          paddingInlineEnd: padXSafe,
        }
      : { padding: `${padYSafe}px ${padXSafe}px` };

  const accentBarBefore =
    showAccentBar && !iconNode
      ? {
          display: "block",
          insetInlineStart: NOTIFICATION_ACCENT_LEFT,
          width: NOTIFICATION_ACCENT_WIDTH,
          top: accentInsetY,
          bottom: accentInsetY,
          borderRadius: radiusPx,
          backgroundColor: accentColor,
        }
      : null;

  const notification = (
    <Notification
      title={title}
      color={mantineColor}
      icon={iconNode}
      loading={loading}
      withCloseButton={withCloseButton}
      withBorder={false}
      styles={{
        root: {
          background: background,
          boxSizing: "border-box",
          borderRadius: radiusPx,
          width: 360,
          ...rootPadding,
          ...(accentBarBefore ? { "&::before": accentBarBefore } : !showAccentBar ? { "&::before": { display: "none" } } : {}),
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
          "& svg": {
            strokeWidth: closeStrokeWidthSafe,
          },
        },
        icon: {
          color: iconColor,
          width: 16,
          minWidth: 16,
          height: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
        },
      }}
    >
      {description}
    </Notification>
  );

  if (!effectiveWithBorder) return notification;

  return (
    <div
      style={{
        display: "inline-block",
        borderRadius: radiusPx + borderW,
        padding: borderW,
        background: borderColor,
        boxSizing: "border-box",
        lineHeight: 0,
      }}
    >
      {notification}
    </div>
  );
}
