import { Tooltip } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function TooltipPreview({
  brands,
  brandId,
  position = "top",
  withArrow = true,
  label = "Tooltip text",
  opened = true,
}) {
  const tokens = COMPONENT_TOKENS.tooltip;

  const bg = resolveColor(brands, brandId, tokens["tooltip-background"]?.semantic);
  const color = resolveColor(brands, brandId, tokens["tooltip-color"]?.semantic);
  const radius = resolveDimension(brands, brandId, "tooltip-radius");
  const paddingX = resolveDimension(brands, brandId, "tooltip-padding-x");
  const paddingY = resolveDimension(brands, brandId, "tooltip-padding-y");
  const fontSize = resolveDimension(brands, brandId, "tooltip-font-size");
  const arrowSize = resolveDimension(brands, brandId, "tooltip-arrow-size");

  return (
    <Tooltip
      label={label}
      position={position}
      withArrow={withArrow}
      arrowSize={arrowSize}
      opened={opened}
      vars={() => ({
        tooltip: {
          "--tooltip-bg": bg,
          "--tooltip-color": color,
          "--tooltip-radius": `${radius}px`,
        },
      })}
      styles={{
        tooltip: {
          backgroundColor: bg,
          color: color,
          borderRadius: radius,
          padding: `${paddingY}px ${paddingX}px`,
          fontSize: fontSize,
        },
        arrow: {
          backgroundColor: bg,
        },
      }}
    >
      <button
        style={{
          background: "#373A40",
          color: "#C1C2C5",
          border: "1px solid #4A4D52",
          borderRadius: 4,
          padding: "6px 14px",
          fontSize: 12,
          cursor: "default",
          fontFamily: "monospace",
        }}
      >
        Trigger
      </button>
    </Tooltip>
  );
}
