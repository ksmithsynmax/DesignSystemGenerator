import { Avatar } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

function cssFontWeightFromFigmaStyle(weightStr) {
  if (weightStr === "Bold") return 700;
  if (weightStr === "Semi Bold") return 600;
  if (weightStr === "Medium") return 500;
  return 400;
}

const DEFAULT_PHOTO = "https://picsum.photos/id/64/256/256";

export default function AvatarPreview({
  brands,
  brandId,
  size = "md",
  radiusSize = size,
  name = "Alex Carter",
  src = null,
  content = "initials",
  colorKey = "default",
  previewTheme = "dark",
}) {
  const tokens = COMPONENT_TOKENS.avatar;
  const theme = previewTheme === "dark" ? "dark" : "light";
  const tokenBg = resolveColor(brands, brandId, tokens["avatar-background"]?.semantic, theme, "avatar-background");
  const tokenBorder = resolveColor(brands, brandId, tokens["avatar-border"]?.semantic, theme, "avatar-border");
  const tokenText = resolveColor(brands, brandId, tokens["avatar-text"]?.semantic, theme, "avatar-text");
  const px = Number(resolveDimension(brands, brandId, "avatar-size", size)) || 40;
  const radiusPx = Number(resolveDimension(brands, brandId, "avatar-radius", radiusSize)) || 20;
  const fontPx = Number(resolveDimension(brands, brandId, "avatar-font-size", size)) || 16;
  const fontFamilyName = resolveDimension(brands, brandId, "avatar-font-family");
  const fontWeightToken = resolveDimension(brands, brandId, "avatar-font-weight");
  const borderW = Number(resolveDimension(brands, brandId, "avatar-border-width"));
  const borderWidthPx = Number.isFinite(borderW) && borderW >= 0 ? borderW : 1;
  const fontFamilyCss =
    typeof fontFamilyName === "string" && fontFamilyName.trim()
      ? `'${fontFamilyName.trim()}', sans-serif`
      : "'Inter', sans-serif";
  const fontWeightCss = cssFontWeightFromFigmaStyle(
    typeof fontWeightToken === "string" ? fontWeightToken : "",
  );

  // When a palette color is chosen, resolve fill + text through the per-color
  // tokens (so overrides + auto-contrast apply); otherwise use the neutral tokens.
  const isPaletteColor = colorKey && colorKey !== "default";
  const colorBg = isPaletteColor ? resolveColor(brands, brandId, null, theme, `avatar-color-${colorKey}`) : null;
  const colorText = isPaletteColor ? resolveColor(brands, brandId, null, theme, `avatar-on-color-${colorKey}`) : null;
  const bg = colorBg || tokenBg;
  const text = isPaletteColor ? colorText : tokenText;
  const border = colorBg || tokenBorder;
  const rootBorder = `${borderWidthPx}px solid ${border}`;

  // Content forms: image (src), icon (default placeholder), initials (name).
  const isImage = content === "image";
  const isIcon = content === "icon";
  const resolvedSrc = isImage ? (src || DEFAULT_PHOTO) : null;
  const resolvedName = isIcon ? undefined : name;

  return (
    <Avatar
      src={resolvedSrc}
      alt={name}
      name={resolvedName}
      size={px}
      radius={radiusPx}
      variant="filled"
      vars={() => ({
        root: {
          "--avatar-bg": bg,
          "--avatar-color": text,
          "--avatar-bd": rootBorder,
        },
      })}
      style={{
        background: bg,
        color: text,
        border: rootBorder,
      }}
      styles={{
        root: {
          border: rootBorder,
        },
        placeholder: {
          color: text,
          fontSize: fontPx,
          fontFamily: fontFamilyCss,
          fontWeight: fontWeightCss,
        },
        image: {},
      }}
    />
  );
}
