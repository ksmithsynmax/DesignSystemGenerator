import { Anchor } from "@mantine/core";
import { getDefaultSizeKey, resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

const WEIGHT_TOKEN_BY_MODE = {
  regular: "anchor-font-weight-regular",
  semibold: "anchor-font-weight-semibold",
  bold: "anchor-font-weight-bold",
};

export default function AnchorPreview({
  brands,
  brandId,
  size = "md",
  underline = "always",
  weightMode = "regular",
  state = "default",
  text = "View documentation",
}) {
  const tokens = COMPONENT_TOKENS.anchor;
  const colorToken =
    state === "hover"
      ? "anchor-color-hover"
      : state === "visited"
        ? "anchor-color-visited"
        : state === "disabled"
          ? "anchor-color-disabled"
          : "anchor-color";

  const color = resolveColor(brands, brandId, tokens[colorToken]?.semantic, "light", colorToken);
  const resolvedSize = size === "default"
    ? (getDefaultSizeKey(brands, brandId, "anchor-font-size") || "md")
    : size;
  const fontSize = resolveDimension(brands, brandId, "anchor-font-size", resolvedSize);
  const lineHeight = resolveDimension(brands, brandId, "anchor-line-height", resolvedSize);
  const fontWeight = resolveDimension(brands, brandId, WEIGHT_TOKEN_BY_MODE[weightMode]);
  const fontFamily = resolveDimension(brands, brandId, "anchor-font-family");

  const textDecoration =
    underline === "always"
      ? "underline"
      : underline === "hover"
        ? state === "hover"
          ? "underline"
          : "none"
        : "none";

  return (
    <Anchor
      href="#"
      onClick={(e) => e.preventDefault()}
      style={{
        color,
        fontSize: `${fontSize}px`,
        lineHeight: lineHeight ? `${lineHeight}px` : undefined,
        fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : undefined,
        fontWeight: fontWeight === "Semi Bold" ? 600 : fontWeight === "Bold" ? 700 : 400,
        textDecoration,
        opacity: state === "disabled" ? 0.7 : 1,
        pointerEvents: state === "disabled" ? "none" : "auto",
        cursor: state === "disabled" ? "default" : "pointer",
      }}
    >
      {text}
    </Anchor>
  );
}
