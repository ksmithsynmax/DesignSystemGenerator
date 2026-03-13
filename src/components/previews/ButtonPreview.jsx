import { Button } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

const VARIANT_MAP = {
  filled: "filled",
  outlined: "outline",
  ghost: "subtle",
};

const WEIGHT_TO_CSS = {
  "Thin": 100,
  "Extra Light": 200,
  "Light": 300,
  "Regular": 400,
  "Medium": 500,
  "Semi Bold": 600,
  "Bold": 700,
  "Extra Bold": 800,
  "Black": 900,
};

export default function ButtonPreview({ brands, brandId, variant, size, state }) {
  const tokens = COMPONENT_TOKENS.button;
  const prefix = `button-${variant}`;
  const suffix = state ? `-${state}` : "";

  const bgKey = suffix && tokens[`${prefix}-background${suffix}`] ? `${prefix}-background${suffix}` : `${prefix}-background`;
  const textKey = suffix && tokens[`${prefix}-text${suffix}`] ? `${prefix}-text${suffix}` : `${prefix}-text`;
  const borderKey = suffix && tokens[`${prefix}-border${suffix}`] ? `${prefix}-border${suffix}` : `${prefix}-border`;

  const bg = resolveColor(brands, brandId, tokens[bgKey]?.semantic, "light", bgKey);
  const bgHover = state
    ? bg
    : resolveColor(brands, brandId, tokens[`${prefix}-background-hover`]?.semantic, "light", `${prefix}-background-hover`);
  const text = resolveColor(brands, brandId, tokens[textKey]?.semantic, "light", textKey);
  const border = resolveColor(brands, brandId, tokens[borderKey]?.semantic, "light", borderKey);

  const height = resolveDimension(brands, brandId, "button-height", size);
  const paddingX = resolveDimension(brands, brandId, "button-padding-x", size);
  const fontSize = resolveDimension(brands, brandId, "button-font-size", size);
  const lineHeight = resolveDimension(brands, brandId, "button-line-height", size);
  const borderRadius = resolveDimension(brands, brandId, "button-border-radius");
  const borderWidth = resolveDimension(brands, brandId, "button-border-width");
  const fontWeight = resolveDimension(brands, brandId, "button-font-weight");

  const mantineVariant = VARIANT_MAP[variant] || "filled";

  const bdValue =
    border !== "transparent"
      ? `${borderWidth}px solid ${border}`
      : `${borderWidth}px solid transparent`;

  return (
    <Button
      variant={mantineVariant}
      disabled={state === "disabled"}
      style={state ? { pointerEvents: "none" } : undefined}
      vars={() => ({
        root: {
          "--button-bg": bg,
          "--button-hover": bgHover || bg,
          "--button-color": text,
          "--button-bd": bdValue,
          "--button-height": `${height}px`,
          "--button-padding-x": `${paddingX}px`,
          "--button-fz": `${fontSize}px`,
          "--button-radius": `${borderRadius}px`,
        },
      })}
      styles={{
        root: {
          fontWeight: WEIGHT_TO_CSS[fontWeight] ?? 600,
          lineHeight: lineHeight ? `${lineHeight}px` : undefined,
        },
      }}
    >
      Button
    </Button>
  );
}
