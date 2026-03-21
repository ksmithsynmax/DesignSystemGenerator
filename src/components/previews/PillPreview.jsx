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
        },
        label: {
          color: labelColor,
          display: "flex",
          alignItems: "center",
          lineHeight: 1,
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
