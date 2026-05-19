import CheckIcon from "@untitledui-icons/react/line/CheckIcon";
import Dotpoints01Icon from "@untitledui-icons/react/line/Dotpoints01Icon";
import AlertCircleIcon from "@untitledui-icons/react/line/AlertCircleIcon";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

function mapWeight(label) {
  if (label === "Semi Bold" || label === "Semibold") return 600;
  if (label === "Bold") return 700;
  if (label === "Medium") return 500;
  return 400;
}

function getRowIcon(iconName, color, size, strokeWidth) {
  const iconProps = { width: size, height: size, strokeWidth, style: { color } };
  if (iconName === "dot") return <Dotpoints01Icon {...iconProps} />;
  if (iconName === "alert") return <AlertCircleIcon {...iconProps} />;
  return <CheckIcon {...iconProps} />;
}

function getMarkerLabel(type, index) {
  if (type === "ordered") return `${index + 1}.`;
  return "\u2022";
}

export default function ListPreview({
  brands,
  brandId,
  size = "default",
  type = "unordered",
  withIcons = true,
  withPadding = false,
}) {
  const tokens = COMPONENT_TOKENS.list;
  const itemSpacing = resolveDimension(brands, brandId, "list-spacing", size);
  const paddingLeft = resolveDimension(brands, brandId, "list-item-padding-left", size);
  const markerGap = resolveDimension(brands, brandId, "list-marker-gap");
  const fontSize = resolveDimension(brands, brandId, "list-font-size", size);
  const lineHeight = resolveDimension(brands, brandId, "list-line-height", size);
  const fontFamily = resolveDimension(brands, brandId, "list-font-family");
  const fontWeight = resolveDimension(brands, brandId, "list-font-weight");
  const iconSize = resolveDimension(brands, brandId, "list-icon-size", size);
  const iconStrokeWidth = resolveDimension(brands, brandId, "list-icon-stroke-width", size);
  const iconGap = resolveDimension(brands, brandId, "list-icon-gap");
  const itemColor = resolveColor(brands, brandId, tokens["list-item-color"]?.semantic, "light", "list-item-color");
  const markerColor = resolveColor(brands, brandId, tokens["list-marker-color"]?.semantic, "light", "list-marker-color");
  const iconColor = resolveColor(brands, brandId, tokens["list-icon-color"]?.semantic, "light", "list-icon-color");

  const rowItems = [
    { label: "Clone or download repository from GitHub", icon: "check" },
    { label: "Install dependencies with yarn", icon: "dot" },
    { label: "Run tests before opening your pull request", icon: "alert" },
  ];

  return (
    <div
      style={{
        width: "max-content",
        maxWidth: "100%",
      }}
    >
      <div style={{ display: "grid", gap: `${itemSpacing}px`, paddingLeft: withPadding ? `${paddingLeft}px` : 0 }}>
        {rowItems.map((row, index) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: withIcons ? `${iconGap}px` : `${markerGap}px`,
            }}
          >
            {withIcons ? (
              <span
                style={{
                  width: `${iconSize}px`,
                  minWidth: `${iconSize}px`,
                  height: `${lineHeight}px`,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {getRowIcon(row.icon, iconColor, iconSize, iconStrokeWidth)}
              </span>
            ) : (
              <span
                style={{
                  color: markerColor,
                  fontSize: `${fontSize}px`,
                  lineHeight: `${lineHeight}px`,
                  minWidth: type === "ordered" ? "20px" : "12px",
                  textAlign: type === "ordered" ? "right" : "center",
                  fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : undefined,
                  fontWeight: mapWeight(fontWeight),
                }}
              >
                {getMarkerLabel(type, index)}
              </span>
            )}
            <span
              style={{
                color: itemColor,
                fontSize: `${fontSize}px`,
                lineHeight: `${lineHeight}px`,
                fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : undefined,
                fontWeight: mapWeight(fontWeight),
              }}
            >
              {row.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
