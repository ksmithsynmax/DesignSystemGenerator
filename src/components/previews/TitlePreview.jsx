import { Title } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

function toOrder(sizeKey) {
  const parsed = Number(String(sizeKey).replace("h", ""));
  if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 6) return parsed;
  return 1;
}

export default function TitlePreview({
  brands,
  brandId,
  order = 1,
  sizeKey = "h1",
  textWrap = "wrap",
  lineClamp = 0,
  text = "Build fully functional accessible web applications faster than ever",
}) {
  const tokens = COMPONENT_TOKENS.title;
  const effectiveSizeKey = sizeKey;

  const color = resolveColor(
    brands,
    brandId,
    tokens["title-color"]?.semantic,
    "light",
    "title-color"
  );
  const fontSize = resolveDimension(brands, brandId, "title-font-size", effectiveSizeKey);
  const lineHeight = resolveDimension(brands, brandId, "title-line-height", effectiveSizeKey);
  const fontWeight = resolveDimension(brands, brandId, "title-font-weight");
  const fontFamily = resolveDimension(brands, brandId, "title-font-family");

  return (
    <div style={{ width: "100%" }}>
      <Title
        order={toOrder(order)}
        textWrap={textWrap}
        lineClamp={lineClamp > 0 ? lineClamp : undefined}
        style={{
          color,
          fontSize: fontSize ? `${fontSize}px` : undefined,
          lineHeight: lineHeight ? `${lineHeight}px` : undefined,
          fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : undefined,
          fontWeight: fontWeight === "Semi Bold" ? 600 : fontWeight === "Bold" ? 700 : 400,
        }}
      >
        {text}
      </Title>
    </div>
  );
}
