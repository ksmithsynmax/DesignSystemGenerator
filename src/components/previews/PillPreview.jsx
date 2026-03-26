import { Pill } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function PillPreview({
  brands,
  brandId,
  size = "md",
  withRemoveButton = false,
  text = "React",
}) {
  const tokens = COMPONENT_TOKENS.pill;
  const background = resolveColor(brands, brandId, tokens["pill-background"]?.semantic, "light", "pill-background");
  const borderColor = resolveColor(brands, brandId, tokens["pill-border"]?.semantic, "light", "pill-border");
  const labelColor = resolveColor(brands, brandId, tokens["pill-label"]?.semantic, "light", "pill-label");
  const removeColor = resolveColor(brands, brandId, tokens["pill-remove"]?.semantic, "light", "pill-remove");
  const borderWidth = resolveDimension(brands, brandId, "pill-border-width");
  const fontSize = resolveDimension(brands, brandId, "pill-font-size", size);
  const fontFamily = resolveDimension(brands, brandId, "pill-font-family");
  const fontWeight = resolveDimension(brands, brandId, "pill-font-weight");
  const lineHeight = resolveDimension(brands, brandId, "pill-line-height", size);
  const height = resolveDimension(brands, brandId, "pill-height", size);
  const paddingX = resolveDimension(brands, brandId, "pill-padding-x", size);
  const radius = resolveDimension(brands, brandId, "pill-radius", size);

  return (
    <Pill
      size={size}
      withRemoveButton={withRemoveButton}
      onRemove={withRemoveButton ? () => {} : undefined}
      styles={{
        root: {
          backgroundColor: background,
          borderColor: borderColor,
          borderWidth: `${borderWidth}px`,
          borderStyle: "solid",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          height: height ? `${height}px` : undefined,
          paddingLeft: paddingX ? `${paddingX}px` : undefined,
          paddingRight: paddingX ? `${paddingX}px` : undefined,
          borderRadius: radius ? `${radius}px` : undefined,
        },
        label: {
          color: labelColor,
          display: "flex",
          alignItems: "center",
          fontSize: fontSize ? `${fontSize}px` : undefined,
          fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : undefined,
          fontWeight: fontWeight === "Semi Bold" ? 600 : fontWeight === "Bold" ? 700 : 400,
          lineHeight: lineHeight ? `${lineHeight}px` : undefined,
        },
        remove: {
          color: removeColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginInlineStart: 4,
          padding: 0,
        },
      }}
    >
      {text}
    </Pill>
  );
}
