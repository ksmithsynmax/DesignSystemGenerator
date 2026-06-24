import { Alert } from "@mantine/core";
import AlertTriangleIcon from "@untitledui-icons/react/line/AlertTriangleIcon";
import AlertCircleIcon from "@untitledui-icons/react/line/AlertCircleIcon";
import CheckCircleIcon from "@untitledui-icons/react/line/CheckCircleIcon";
import InfoCircleIcon from "@untitledui-icons/react/line/InfoCircleIcon";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

// Alert color is a semantic status; each has a default status icon.
const STATUS_ICON = {
  info: InfoCircleIcon,
  success: CheckCircleIcon,
  warning: AlertTriangleIcon,
  error: AlertCircleIcon,
};

const STATUSES = ["info", "success", "warning", "error"];
const STATUS_VARIANTS = ["default", "filled", "outline"];

/**
 * Per-status, per-variant color token keys. Each status × variant has its own
 * editable tokens (defaulting to the matching feedback-* semantic). Variants
 * without a status axis fall back to the generic variant triplet.
 */
export function alertColorTokenKeys(variant, status) {
  if (STATUS_VARIANTS.includes(variant) && STATUSES.includes(status)) {
    const base = `alert-${variant}-${status}`;
    return {
      bg: `${base}-background`,
      text: `${base}-text`,
      border: `${base}-border`,
      icon: `${base}-icon`,
      close: `${base}-close`,
    };
  }
  return {
    bg: `alert-${variant}-background`,
    text: `alert-${variant}-text`,
    border: `alert-${variant}-border`,
    icon: "alert-icon",
    close: "alert-close",
  };
}

export default function AlertPreview({
  brands,
  brandId,
  variant = "default",
  color = "info",
  radius = "md",
  withCloseButton = false,
  withIcon = true,
  title = "Alert title",
  message = "Lorem ipsum dolor sit, amet consectetur adipisicing elit. At officiis, quae tempore necessitatibus placeat saepe.",
}) {
  const tokens = COMPONENT_TOKENS.alert;
  const {
    bg: bgKey,
    text: textKey,
    border: borderKey,
    icon: iconKey,
    close: closeKey,
  } = alertColorTokenKeys(variant, color);

  const variantBackground = resolveColor(brands, brandId, tokens[bgKey]?.semantic, "light", bgKey);
  const variantTextColor = resolveColor(brands, brandId, tokens[textKey]?.semantic, "light", textKey);
  const variantBorderColor = resolveColor(brands, brandId, tokens[borderKey]?.semantic, "light", borderKey);
  const variantIconColor = resolveColor(brands, brandId, tokens[iconKey]?.semantic, "light", iconKey);
  const variantCloseColor = resolveColor(brands, brandId, tokens[closeKey]?.semantic, "light", closeKey);

  const borderWidth = resolveDimension(brands, brandId, "alert-border-width");
  const cornerRadius = resolveDimension(brands, brandId, "alert-radius", radius);
  const paddingX = resolveDimension(brands, brandId, "alert-padding-x");
  const paddingY = resolveDimension(brands, brandId, "alert-padding-y");
  const titleFontSize = resolveDimension(brands, brandId, "alert-title-font-size");
  const titleFontFamily = resolveDimension(brands, brandId, "alert-title-font-family");
  const titleFontWeight = resolveDimension(brands, brandId, "alert-title-font-weight");
  const titleLineHeight = resolveDimension(brands, brandId, "alert-title-line-height");
  const messageFontSize = resolveDimension(brands, brandId, "alert-message-font-size");
  const messageFontFamily = resolveDimension(brands, brandId, "alert-message-font-family");
  const messageFontWeight = resolveDimension(brands, brandId, "alert-message-font-weight");
  const messageLineHeight = resolveDimension(brands, brandId, "alert-message-line-height");
  const iconTitleGap = resolveDimension(brands, brandId, "alert-icon-title-gap") ?? 8;
  const titleMessageGap = resolveDimension(brands, brandId, "alert-title-message-gap") ?? 6;

  const StatusIcon = STATUS_ICON[color] || AlertTriangleIcon;
  const iconNode = withIcon ? (
    <StatusIcon width={16} height={16} style={{ color: variantIconColor }} />
  ) : null;

  return (
    <Alert
      variant={variant}
      radius={radius}
      title={title}
      icon={iconNode}
      withCloseButton={withCloseButton}
      closeButtonLabel={withCloseButton ? "Dismiss alert" : undefined}
      styles={{
        root: {
          background: variantBackground,
          color: variantTextColor,
          borderColor: variantBorderColor,
          borderWidth: `${borderWidth}px`,
          borderStyle: "solid",
          borderRadius: `${cornerRadius}px`,
          padding: `${paddingY}px ${paddingX}px`,
          width: 380,
        },
        label: {
          color: variantTextColor,
          fontSize: `${titleFontSize}px`,
          fontFamily: titleFontFamily ? `"${titleFontFamily}", sans-serif` : undefined,
          fontWeight: titleFontWeight === "Semi Bold" ? 600 : titleFontWeight === "Bold" ? 700 : 400,
          lineHeight: titleLineHeight ? `${titleLineHeight}px` : undefined,
          margin: 0,
        },
        body: {
          display: "grid",
          rowGap: `${titleMessageGap}px`,
          marginLeft: 0,
        },
        message: {
          color: variantTextColor,
          fontSize: `${messageFontSize}px`,
          fontFamily: messageFontFamily ? `"${messageFontFamily}", sans-serif` : undefined,
          fontWeight: messageFontWeight === "Semi Bold" ? 600 : messageFontWeight === "Bold" ? 700 : 400,
          lineHeight: messageLineHeight ? `${messageLineHeight}px` : undefined,
          margin: 0,
        },
        icon: {
          color: variantIconColor,
          width: 16,
          minWidth: 16,
          height: 16,
          padding: 0,
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 16px",
          marginTop: 2,
        },
        wrapper: {
          columnGap: `${iconTitleGap}px`,
          alignItems: "flex-start",
        },
        closeButton: {
          color: variantCloseColor,
          alignSelf: "flex-start",
          marginTop: 2,
        },
      }}
    >
      {message}
    </Alert>
  );
}
