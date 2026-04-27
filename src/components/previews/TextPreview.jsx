import { Text } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

const WEIGHT_TOKEN_BY_MODE = {
  regular: "text-font-weight-regular",
  medium: "text-font-weight-medium",
  semibold: "text-font-weight-semibold",
  bold: "text-font-weight-bold",
};

export default function TextPreview({
  brands,
  brandId,
  size = "md",
  weightMode = "regular",
  styleMode = "normal",
  decoration = "none",
  align = "left",
  transform = "none",
  colorMode = "default",
  lineClamp = 0,
  truncate = "off",
  text = "Why guess when you can know.",
}) {
  const tokens = COMPONENT_TOKENS.text;
  const TEXT_COLOR_TOKEN = {
    brand: "text-color-brand",
    dimmed: "text-color-dimmed",
    default: "text-color",
    success: "text-color-success",
    warning: "text-color-warning",
    error: "text-color-error",
  };
  const colorToken = TEXT_COLOR_TOKEN[colorMode] || TEXT_COLOR_TOKEN.default;

  const color = resolveColor(brands, brandId, tokens[colorToken]?.semantic, "light", colorToken);
  const fontSize = resolveDimension(brands, brandId, "text-font-size", size);
  const lineHeight = resolveDimension(brands, brandId, "text-line-height", size);
  const fontWeight = resolveDimension(brands, brandId, WEIGHT_TOKEN_BY_MODE[weightMode]);
  const fontFamily = resolveDimension(brands, brandId, "text-font-family");

  return (
    <div style={{ width: "100%" }}>
      <Text
        fs={styleMode === "italic" ? "italic" : "normal"}
        td={decoration}
        ta={align}
        tt={transform}
        c={color}
        lineClamp={lineClamp > 0 ? lineClamp : undefined}
        truncate={truncate === "off" ? undefined : truncate}
        style={{
          fontSize: fontSize ? `${fontSize}px` : undefined,
          lineHeight: lineHeight ? `${lineHeight}px` : undefined,
          fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : undefined,
          fontWeight:
            fontWeight === "Bold"
              ? 700
              : fontWeight === "Semi Bold"
                ? 600
                : fontWeight === "Medium"
                  ? 500
                  : 400,
        }}
      >
        {text}
      </Text>
    </div>
  );
}
