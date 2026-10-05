import { Tooltip } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

// Countries available in the generator preview, mapped to ISO 3166-1 alpha-2
// codes (lowercase) for flagcdn.com. These mirror the "Flags" set in Figma; the
// generator shows a real flag image here purely for illustration, while the
// actual production artwork comes from the Figma "Flags" set (INSTANCE_SWAP on
// sync) and the runtime API. Only the HEIGHT is tokenized — the flag image is
// rendered at the token height with width:auto so it keeps its natural ratio
// (never stretched).
const COUNTRY_CODE = {
  Singapore: "sg",
  "Hong Kong": "hk",
  Taiwan: "tw",
  Japan: "jp",
  Italy: "it",
  France: "fr",
  Russia: "ru",
  "United States": "us",
  China: "cn",
  "United Kingdom": "gb",
  Iran: "ir",
  Venezuela: "ve",
};

export const FLAG_COUNTRIES = Object.keys(COUNTRY_CODE);

export default function FlagPreview({
  brands,
  brandId,
  size = "md",
  country = FLAG_COUNTRIES[0],
  openTooltip = false,
}) {
  const h = resolveDimension(brands, brandId, "flag-height", size) || 14;
  const code = COUNTRY_CODE[country] || "sg";

  // Tooltip styling comes from the brand's tooltip-* tokens (same mapping as
  // TooltipPreview), so the flag's tooltip matches the brand's Tooltip component.
  const t = COMPONENT_TOKENS.tooltip;
  const tipBg = resolveColor(brands, brandId, t["tooltip-background"]?.semantic, "light", "tooltip-background");
  const tipColor = resolveColor(brands, brandId, t["tooltip-color"]?.semantic, "light", "tooltip-color");
  const tipRadius = resolveDimension(brands, brandId, "tooltip-radius");
  const tipPadX = resolveDimension(brands, brandId, "tooltip-padding-x");
  const tipPadY = resolveDimension(brands, brandId, "tooltip-padding-y");
  const tipFontSize = resolveDimension(brands, brandId, "tooltip-font-size");
  const tipFontFamily = resolveDimension(brands, brandId, "tooltip-font-family");
  const tipFontWeight = resolveDimension(brands, brandId, "tooltip-font-weight");
  const tipLineHeight = resolveDimension(brands, brandId, "tooltip-line-height");
  const tipArrowSize = resolveDimension(brands, brandId, "tooltip-arrow-size");

  return (
    <Tooltip
      label={country}
      position="top"
      withArrow
      arrowSize={tipArrowSize}
      opened={openTooltip ? true : undefined}
      vars={() => ({
        tooltip: {
          "--tooltip-bg": tipBg,
          "--tooltip-color": tipColor,
          "--tooltip-radius": `${tipRadius}px`,
        },
      })}
      styles={{
        tooltip: {
          backgroundColor: tipBg,
          color: tipColor,
          borderRadius: tipRadius,
          padding: `${tipPadY}px ${tipPadX}px`,
          fontSize: tipFontSize,
          fontFamily: tipFontFamily ? `"${tipFontFamily}", sans-serif` : undefined,
          fontWeight: tipFontWeight === "Semi Bold" ? 600 : tipFontWeight === "Bold" ? 700 : 400,
          lineHeight: tipLineHeight ? `${tipLineHeight}px` : undefined,
        },
        arrow: {
          backgroundColor: tipBg,
        },
      }}
    >
      <div style={{ display: "inline-flex", cursor: "default" }}>
        <img
          src={`https://flagcdn.com/${code}.svg`}
          alt={`${country} flag`}
          style={{
            height: `${h}px`,
            width: "auto",
            display: "block",
            // Hairline edge so white/light flags (e.g. Japan) read on dark.
            boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.12)",
          }}
        />
      </div>
    </Tooltip>
  );
}
