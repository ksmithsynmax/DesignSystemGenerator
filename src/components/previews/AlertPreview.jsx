import { Alert } from "@mantine/core";
import AlertTriangleIcon from "@untitledui-icons/react/line/AlertTriangleIcon";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";
import { GLOBAL_PRIMITIVES } from "../../data/brands";

export default function AlertPreview({
  brands,
  brandId,
  variant = "light",
  color = "blue",
  radius = "md",
  withCloseButton = false,
  withIcon = true,
  title = "Alert title",
  message = "Lorem ipsum dolor sit, amet consectetur adipisicing elit. At officiis, quae tempore necessitatibus placeat saepe.",
}) {
  const tokens = COMPONENT_TOKENS.alert;
  const bgKey = `alert-${variant}-background`;
  const textKey = `alert-${variant}-text`;
  const borderKey = `alert-${variant}-border`;

  const background = resolveColor(brands, brandId, tokens[bgKey]?.semantic, "light", bgKey);
  const textColor = resolveColor(brands, brandId, tokens[textKey]?.semantic, "light", textKey);
  const borderColor = resolveColor(brands, brandId, tokens[borderKey]?.semantic, "light", borderKey);
  const iconColor = resolveColor(brands, brandId, tokens["alert-icon"]?.semantic, "light", "alert-icon");
  const closeColor = resolveColor(brands, brandId, tokens["alert-close"]?.semantic, "light", "alert-close");

  const borderWidth = resolveDimension(brands, brandId, "alert-border-width");
  const cornerRadius = resolveDimension(brands, brandId, "alert-radius", radius);
  const paddingX = resolveDimension(brands, brandId, "alert-padding-x");
  const paddingY = resolveDimension(brands, brandId, "alert-padding-y");
  const titleFontSize = resolveDimension(brands, brandId, "alert-title-font-size");
  const messageFontSize = resolveDimension(brands, brandId, "alert-message-font-size");
  const iconTitleGap = resolveDimension(brands, brandId, "alert-icon-title-gap") ?? 8;
  const titleMessageGap = resolveDimension(brands, brandId, "alert-title-message-gap") ?? 6;

  const brand = brands[brandId];
  const palette = brand?.primitives?.[color] || GLOBAL_PRIMITIVES[color] || null;
  const toneSoft = palette?.[1] || null;
  const toneStrong = palette?.[6] || null;
  const toneBorder = palette?.[4] || null;
  const hasTokenOverride = (tokenName) => Boolean(brand?.componentOverrides?.[tokenName]);
  const iconOverride = hasTokenOverride("alert-icon");
  const closeOverride = hasTokenOverride("alert-close");

  const variantBackground =
    hasTokenOverride(bgKey)
      ? background
      : variant === "filled"
        ? (toneStrong || background)
        : variant === "light"
          ? (toneSoft || background)
          : variant === "outline"
            ? "transparent"
            : variant === "transparent"
              ? "transparent"
              : background;

  const variantTextColor =
    hasTokenOverride(textKey)
      ? textColor
      : variant === "filled"
        ? "#FFFFFF"
        : (toneStrong || textColor);

  const variantBorderColor =
    hasTokenOverride(borderKey)
      ? borderColor
      : variant === "filled"
        ? (toneStrong || borderColor)
        : variant === "light"
          ? (toneSoft || borderColor)
          : variant === "outline"
            ? (toneBorder || toneStrong || borderColor)
            : variant === "transparent"
              ? "transparent"
              : borderColor;

  const variantIconColor =
    iconOverride
      ? iconColor
      : variant === "filled"
        ? "#FFFFFF"
        : (toneStrong || iconColor);

  const variantCloseColor =
    closeOverride
      ? closeColor
      : variant === "filled"
        ? "#FFFFFF"
        : closeColor;

  const iconNode = withIcon ? (
    <AlertTriangleIcon width={16} height={16} style={{ color: variantIconColor }} />
  ) : null;

  return (
    <Alert
      variant={variant}
      color={color}
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
          fontWeight: 600,
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
