import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function DividerPreview({
  brands,
  brandId,
  size = "default",
  orientation = "horizontal",
  state = "default",
  inset = true,
}) {
  const tokens = COMPONENT_TOKENS.divider;
  const isDisabled = state === "disabled";
  const colorKey = isDisabled ? "divider-color-disabled" : "divider-color";
  const color = resolveColor(
    brands,
    brandId,
    tokens[colorKey]?.semantic ?? tokens["divider-color"]?.semantic,
    "light",
    colorKey
  );
  const length = resolveDimension(brands, brandId, "divider-length");
  const thickness = resolveDimension(brands, brandId, "divider-thickness", size);
  const radius = resolveDimension(brands, brandId, "divider-radius");
  const insetValue = inset ? resolveDimension(brands, brandId, "divider-inset") : 0;

  if (orientation === "vertical") {
    return (
      <div
        style={{
          height: `${length}px`,
          width: `${Math.max(1, thickness)}px`,
          display: "flex",
          justifyContent: "center",
          boxSizing: "border-box",
          padding: `${insetValue}px 0`,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: color,
            borderRadius: `${radius}px`,
            opacity: isDisabled ? 0.7 : 1,
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: `${length}px`,
        height: `${Math.max(1, thickness)}px`,
        display: "flex",
        alignItems: "center",
        boxSizing: "border-box",
        padding: `0 ${insetValue}px`,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background: color,
          borderRadius: `${radius}px`,
          opacity: isDisabled ? 0.7 : 1,
        }}
      />
    </div>
  );
}
