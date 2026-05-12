import { Avatar } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

function cssFontWeightFromFigmaStyle(weightStr) {
  if (weightStr === "Bold") return 700;
  if (weightStr === "Semi Bold") return 600;
  if (weightStr === "Medium") return 500;
  return 400;
}

export default function AvatarPreview({
  brands,
  brandId,
  size = "md",
  radiusSize = size,
  name = "Alex Carter",
  src = null,
  usePhoto = false,
  previewTheme = "dark",
}) {
  const tokens = COMPONENT_TOKENS.avatar;
  const theme = previewTheme === "dark" ? "dark" : "light";
  const bg = resolveColor(brands, brandId, tokens["avatar-background"]?.semantic, theme, "avatar-background");
  const border = resolveColor(brands, brandId, tokens["avatar-border"]?.semantic, theme, "avatar-border");
  const text = resolveColor(brands, brandId, tokens["avatar-text"]?.semantic, theme, "avatar-text");
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

  const resolvedSrc = usePhoto && src ? src : null;

  // Mantine 8 Avatar resolves fills via CSS variables (--avatar-bg, --avatar-color, --avatar-bd).
  // `styles.root` alone loses to those; override vars and set root `style` so token colors always win.
  const rootBorder = `${borderWidthPx}px solid ${border}`;

  return (
    <Avatar
      src={resolvedSrc}
      alt={name}
      name={name}
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
