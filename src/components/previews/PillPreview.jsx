import { Pill } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function PillPreview({
  brands,
  brandId,
  size = "default",
  withRemoveButton = false,
  text = "React",
}) {
  const tokens = COMPONENT_TOKENS.pill;
  const brand = brands[brandId] || {};
  const background = resolveColor(brands, brandId, tokens["pill-background"]?.semantic, "light", "pill-background");
  const borderColor = resolveColor(brands, brandId, tokens["pill-border"]?.semantic, "light", "pill-border");
  const labelColor = resolveColor(brands, brandId, tokens["pill-label"]?.semantic, "light", "pill-label");
  const removeColor = resolveColor(brands, brandId, tokens["pill-remove"]?.semantic, "light", "pill-remove");
  const borderWidth = resolveDimension(brands, brandId, "pill-border-width");
  const resolveSizedToken = (tokenName, sizeKey) => {
    const tokenDef = tokens[tokenName];
    if (!tokenDef?.sizes) return resolveDimension(brands, brandId, tokenName);
    const override = brand.dimensionOverrides?.[tokenName]?.[sizeKey];
    if (override !== undefined) return override;
    return tokenDef.sizes[sizeKey] ?? null;
  };
  const sizeKey = size || "default";

  const fontSize = resolveSizedToken("pill-font-size", sizeKey);
  const fontFamily = resolveDimension(brands, brandId, "pill-font-family");
  const fontWeight = resolveDimension(brands, brandId, "pill-font-weight");
  const lineHeight = resolveSizedToken("pill-line-height", sizeKey);
  const paddingX = resolveSizedToken("pill-padding-x", sizeKey);
  const paddingY = resolveSizedToken("pill-padding-y", sizeKey);
  const radius = resolveSizedToken("pill-radius", sizeKey);
  const gap = resolveSizedToken("pill-gap", sizeKey);
  const removeSize = resolveSizedToken("pill-remove-size", sizeKey);
  const computedMinHeight = Math.max(
    0,
    (lineHeight || fontSize || 12) + (paddingY || 0) * 2 + (borderWidth || 0) * 2
  );

  return (
    <Pill
      size={size === "default" ? "md" : size}
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
          height: "auto",
          minHeight: `${computedMinHeight}px`,
          paddingLeft: paddingX ? `${paddingX}px` : undefined,
          paddingRight: paddingX ? `${paddingX}px` : undefined,
          paddingTop: paddingY ? `${paddingY}px` : undefined,
          paddingBottom: paddingY ? `${paddingY}px` : undefined,
          borderRadius: radius ? `${radius}px` : undefined,
          fontSize: fontSize ? `${fontSize}px` : undefined,
          fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : undefined,
          fontWeight: fontWeight === "Semi Bold" ? 600 : fontWeight === "Bold" ? 700 : 400,
          lineHeight: lineHeight ? `${lineHeight}px` : undefined,
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
          marginInlineStart: gap ? `${gap}px` : undefined,
          padding: 0,
          width: removeSize ? `${removeSize}px` : undefined,
          height: removeSize ? `${removeSize}px` : undefined,
          minWidth: removeSize ? `${removeSize}px` : undefined,
          minHeight: removeSize ? `${removeSize}px` : undefined,
          "& svg": {
            width: removeSize ? `${removeSize}px` : undefined,
            height: removeSize ? `${removeSize}px` : undefined,
          },
        },
      }}
    >
      {text}
    </Pill>
  );
}
