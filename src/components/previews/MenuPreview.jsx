import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";
import CheckIcon from "@untitledui-icons/react/line/CheckIcon";
import PlusIcon from "@untitledui-icons/react/line/PlusIcon";
import AlertTriangleIcon from "@untitledui-icons/react/line/AlertTriangleIcon";

function mapWeight(label) {
  if (label === "Semi Bold" || label === "Semibold") return 600;
  if (label === "Bold") return 700;
  if (label === "Medium") return 500;
  return 400;
}

function iconColorKeyForState(state) {
  if (state === "hover") return "menu-item-icon-hover";
  if (state === "disabled") return "menu-item-icon-disabled";
  return "menu-item-icon";
}

function textColorKeyForState(state) {
  if (state === "hover") return "menu-item-text-hover";
  if (state === "disabled") return "menu-item-text-disabled";
  return "menu-item-text";
}

function backgroundKeyForState(state) {
  if (state === "hover") return "menu-item-background-hover";
  if (state === "disabled") return "menu-item-background-disabled";
  return "menu-item-background";
}

function getRowIcon(iconName, color, strokeWidth) {
  const iconProps = { width: 14, height: 14, strokeWidth, style: { color } };
  if (iconName === "plus") return <PlusIcon {...iconProps} />;
  if (iconName === "alert") return <AlertTriangleIcon {...iconProps} />;
  return <CheckIcon {...iconProps} />;
}

export default function MenuPreview({
  brands,
  brandId,
  size = "default",
  radiusSize = "default",
  state = "default",
  withSection = true,
  withIcons = true,
}) {
  const tokens = COMPONENT_TOKENS.menu;
  const isDisabledState = state === "disabled";
  const menuBackgroundToken = isDisabledState ? "menu-background-disabled" : "menu-background";
  const menuBackground = resolveColor(
    brands,
    brandId,
    tokens[menuBackgroundToken]?.semantic ?? tokens["menu-background"]?.semantic,
    "light",
    menuBackgroundToken,
  );
  const menuBorderToken = isDisabledState ? "menu-border-disabled" : "menu-border";
  const menuBorder = resolveColor(
    brands,
    brandId,
    tokens[menuBorderToken]?.semantic ?? tokens["menu-border"]?.semantic,
    "light",
    menuBorderToken,
  );
  const menuDividerToken = isDisabledState ? "menu-divider-disabled" : "menu-divider";
  const sectionLabelToken = isDisabledState ? "menu-section-label-disabled" : "menu-section-label";
  const menuDivider = resolveColor(
    brands,
    brandId,
    tokens[menuDividerToken]?.semantic ?? tokens["menu-divider"]?.semantic,
    "light",
    menuDividerToken,
  );
  const sectionLabelColor = resolveColor(
    brands,
    brandId,
    tokens[sectionLabelToken]?.semantic ?? tokens["menu-section-label"]?.semantic,
    "light",
    sectionLabelToken,
  );

  const width = resolveDimension(brands, brandId, "menu-width", size);
  const radius =
    resolveDimension(brands, brandId, "menu-border-radius", radiusSize) ??
    resolveDimension(brands, brandId, "menu-radius", radiusSize);
  const itemRadius =
    resolveDimension(brands, brandId, "menu-item-border-radius", radiusSize) ??
    Math.max(2, (Number(radius) || 8) - 2);
  const menuPadding = resolveDimension(brands, brandId, "menu-padding");
  const borderWidth = resolveDimension(brands, brandId, "menu-border-width");
  const dividerWidth = resolveDimension(brands, brandId, "menu-divider-width");
  const dividerRadius = resolveDimension(brands, brandId, "menu-divider-radius");
  const itemHeight = resolveDimension(brands, brandId, "menu-item-height", size);
  const contentPaddingX = resolveDimension(brands, brandId, "menu-content-padding-x");
  const contentPaddingY = resolveDimension(brands, brandId, "menu-content-padding-y");
  const labelDividerGap = resolveDimension(brands, brandId, "menu-label-divider-gap");
  const itemGap = resolveDimension(brands, brandId, "menu-item-gap");
  const itemPaddingX = resolveDimension(brands, brandId, "menu-item-padding-x");
  const itemPaddingY = resolveDimension(brands, brandId, "menu-item-padding-y");
  const iconStrokeWidth = resolveDimension(brands, brandId, "menu-icon-stroke-width");
  const fontSize = resolveDimension(brands, brandId, "menu-font-size", size);
  const lineHeight = resolveDimension(brands, brandId, "menu-line-height", size);
  const fontFamily = resolveDimension(brands, brandId, "menu-font-family");
  const fontWeight = resolveDimension(brands, brandId, "menu-font-weight");

  const rowItems = [
    { label: "Open details", rowState: state, icon: "check" },
    { label: "Duplicate", rowState: isDisabledState ? "disabled" : "default", icon: "plus" },
    { label: "Archive", rowState: isDisabledState ? "disabled" : "default", icon: "alert" },
  ];

  return (
    <div
      style={{
        width,
        background: menuBackground,
        border: `${borderWidth}px solid ${menuBorder}`,
        borderRadius: `${radius}px`,
        padding: `${menuPadding}px`,
        boxSizing: "border-box",
      }}
    >
      {withSection && (
        <>
          <div
            style={{
              color: sectionLabelColor,
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              padding: `4px 8px ${labelDividerGap}px`,
              fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : undefined,
            }}
          >
            Actions
          </div>
          <div
            style={{
              height: dividerWidth,
              background: menuDivider,
              margin: `0 ${contentPaddingX}px 6px`,
              borderRadius: dividerRadius,
            }}
          />
        </>
      )}

      <div style={{ display: "grid", gap: itemGap, padding: `${contentPaddingY}px ${contentPaddingX}px` }}>
        {rowItems.map((row) => {
          const rowBg = resolveColor(
            brands,
            brandId,
            tokens[backgroundKeyForState(row.rowState)]?.semantic,
            "light",
            backgroundKeyForState(row.rowState),
          );
          const rowText = resolveColor(
            brands,
            brandId,
            tokens[textColorKeyForState(row.rowState)]?.semantic,
            "light",
            textColorKeyForState(row.rowState),
          );
          const rowIcon = resolveColor(
            brands,
            brandId,
            tokens[iconColorKeyForState(row.rowState)]?.semantic,
            "light",
            iconColorKeyForState(row.rowState),
          );
          return (
            <div
              key={row.label}
              style={{
                minHeight: itemHeight,
                width: "100%",
                padding: `${itemPaddingY}px ${itemPaddingX}px`,
                borderRadius: itemRadius,
                background: rowBg,
                color: rowText,
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxSizing: "border-box",
              }}
            >
              {withIcons && (
                <span
                  style={{
                    width: 14,
                    height: 14,
                    opacity: row.rowState === "disabled" ? 0.7 : 1,
                    flexShrink: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {getRowIcon(row.icon, rowIcon, iconStrokeWidth)}
                </span>
              )}
              <span
                style={{
                  fontSize,
                  lineHeight: `${lineHeight}px`,
                  fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : undefined,
                  fontWeight: mapWeight(fontWeight),
                }}
              >
                {row.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
