import { Text, Title } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

// Map the KeyValuePair size scale to a Mantine Title `order` so the value reads
// as a real heading element (semantics), while the exact font-size/line-height
// still come from the resolved tokens.
const VALUE_ORDER_BY_SIZE = { sm: 4, md: 3, lg: 2 };

function fontWeightToNumber(weight) {
  if (weight === "Bold") return 700;
  if (weight === "Semi Bold") return 600;
  if (weight === "Medium") return 500;
  return 400;
}

export default function KeyValuePairPreview({
  brands,
  brandId,
  theme = "light",
  size = "md",
  showIcon = false,
  keyText = "IMO",
  valueText = "9456123",
}) {
  const tokens = COMPONENT_TOKENS.keyvaluepair;

  const keyColor = resolveColor(brands, brandId, tokens["keyvaluepair-key-color"]?.semantic, theme, "keyvaluepair-key-color");
  const valueColor = resolveColor(brands, brandId, tokens["keyvaluepair-value-color"]?.semantic, theme, "keyvaluepair-value-color");
  const iconColor = resolveColor(brands, brandId, tokens["keyvaluepair-icon-color"]?.semantic, theme, "keyvaluepair-icon-color");

  const keyFontSize = resolveDimension(brands, brandId, "keyvaluepair-key-font-size", size);
  const keyLineHeight = resolveDimension(brands, brandId, "keyvaluepair-key-line-height", size);
  const keyFontWeight = resolveDimension(brands, brandId, "keyvaluepair-key-font-weight");
  const keyFontFamily = resolveDimension(brands, brandId, "keyvaluepair-key-font-family");

  const valueFontSize = resolveDimension(brands, brandId, "keyvaluepair-value-font-size", size);
  const valueLineHeight = resolveDimension(brands, brandId, "keyvaluepair-value-line-height", size);
  const valueFontWeight = resolveDimension(brands, brandId, "keyvaluepair-value-font-weight");
  const valueFontFamily = resolveDimension(brands, brandId, "keyvaluepair-value-font-family");

  const gap = resolveDimension(brands, brandId, "keyvaluepair-gap", size);
  const iconGap = resolveDimension(brands, brandId, "keyvaluepair-icon-gap");
  const iconSize = resolveDimension(brands, brandId, "keyvaluepair-icon-size", size);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: gap ? `${gap}px` : undefined }}>
      <Text
        component="span"
        style={{
          color: keyColor,
          fontSize: keyFontSize ? `${keyFontSize}px` : undefined,
          lineHeight: keyLineHeight ? `${keyLineHeight}px` : undefined,
          fontFamily: keyFontFamily ? `"${keyFontFamily}", sans-serif` : undefined,
          fontWeight: fontWeightToNumber(keyFontWeight),
        }}
      >
        {keyText}
      </Text>

      <div style={{ display: "flex", alignItems: "center", gap: iconGap ? `${iconGap}px` : undefined }}>
        <Title
          order={VALUE_ORDER_BY_SIZE[size] || 3}
          style={{
            color: valueColor,
            fontSize: valueFontSize ? `${valueFontSize}px` : undefined,
            lineHeight: valueLineHeight ? `${valueLineHeight}px` : undefined,
            fontFamily: valueFontFamily ? `"${valueFontFamily}", sans-serif` : undefined,
            fontWeight: fontWeightToNumber(valueFontWeight),
            margin: 0,
          }}
        >
          {valueText}
        </Title>

        {showIcon && (
          <svg
            width={iconSize || 22}
            height={iconSize || 22}
            viewBox="0 0 24 24"
            fill="none"
            stroke={iconColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        )}
      </div>
    </div>
  );
}
