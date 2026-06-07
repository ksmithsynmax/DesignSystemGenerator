import ChartPreview, { MAX_CHART_SERIES, MAX_DONUT_SLICES } from "../previews/ChartPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";

// Charts match Recharts: no size scale. Width fills the container, height is the
// single tokenized knob, so there's just one size.
export const CHART_SIZE_KEYS = ["default"];
// In palette/shades mode a single series isn't meaningful, so the count starts at 2.
const SERIES_COUNT_OPTIONS = Array.from({ length: MAX_CHART_SERIES - 1 }, (_, i) => String(i + 2));
// Donut slices have their own (higher) cap, also starting at 2.
const DONUT_SLICE_OPTIONS = Array.from({ length: MAX_DONUT_SLICES - 1 }, (_, i) => String(i + 2));
const COLOR_MODE_OPTIONS = ["single", "palette", "shades"];
const formatColorMode = (opt) =>
  opt === "single" ? "Single (series 1)" : opt === "palette" ? "Palette" : "Shades";

function PropertyRow({ label, value, onChange, options, disabled = false, formatOption }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <SectionLabel mb={0}>{label}</SectionLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          background: disabled ? "#2A2C31" : "#25262B",
          color: disabled ? "#868E96" : "#E9ECEF",
          border: "1px solid #373A40",
          borderRadius: 6,
          padding: "6px 28px 6px 12px",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "monospace",
          outline: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          appearance: "none",
          WebkitAppearance: "none",
          textTransform: "capitalize",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%235C5F66' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {formatOption ? formatOption(opt) : opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ChartPreviewContent({
  brands,
  activeBrand,
  activeColorToken,
  previewTheme,
  type = "bar",
  size,
  colorMode,
  seriesCount,
  showPoints,
  showGrid,
  showAxis,
  showLegend,
  showRightAxis,
}) {
  const sharedProps = {
    brands,
    brandId: activeBrand,
    type,
    colorMode,
    seriesCount,
    showPoints,
    showGrid,
    showAxis,
    showLegend,
    showRightAxis,
    previewTheme,
  };

  return (
    <div>
      <PreviewStage label={activeColorToken} padding={40}>
        <ChartPreview {...sharedProps} size={size} />
      </PreviewStage>
    </div>
  );
}

export function ChartPropertiesPanel({
  type = "bar",
  colorMode,
  setColorMode,
  seriesCount,
  setSeriesCount,
  showPoints,
  setShowPoints,
  showGrid,
  setShowGrid,
  showAxis,
  setShowAxis,
  showLegend,
  setShowLegend,
  showRightAxis,
  setShowRightAxis,
}) {
  const isMultiSeries = type === "line" || type === "area";
  const isStacked = type === "stacked-bar";
  const isCombo = type === "combo";
  const isDonut = type === "donut";
  const hasSeries = isMultiSeries || isStacked;
  // Combo is a fixed 2-series scheme (bar = series-1, line = series-2), so it has
  // no color-mode / series-count controls.
  // Area only offers single + shades (palette isn't used for stacked areas).
  // Donut is always multi-slice, so it drops the single mode.
  const colorModeOptions =
    type === "area"
      ? COLOR_MODE_OPTIONS.filter((m) => m !== "palette")
      : isDonut
      ? COLOR_MODE_OPTIONS.filter((m) => m !== "single")
      : COLOR_MODE_OPTIONS;
  // Area is capped at 2 series; donut uses its own slice range; others the full range.
  const seriesCountOptions = isDonut
    ? DONUT_SLICE_OPTIONS
    : type === "area"
    ? SERIES_COUNT_OPTIONS.filter((n) => Number(n) <= 2)
    : SERIES_COUNT_OPTIONS;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {!isCombo && (
        <PropertyRow
          label={isDonut ? "Slice colors" : hasSeries ? "Color" : "Bar colors"}
          value={colorMode}
          onChange={setColorMode}
          options={colorModeOptions}
          formatOption={formatColorMode}
        />
      )}
      {((hasSeries && colorMode !== "single") || isDonut) && (
        <PropertyRow
          label={isStacked ? "Segments" : isDonut ? "Slices" : "Series"}
          value={String(seriesCount)}
          onChange={(v) => setSeriesCount(Number(v))}
          options={seriesCountOptions}
        />
      )}
      {(isMultiSeries || isCombo) && (
        <PropertyRow
          label="Points"
          value={showPoints ? "on" : "off"}
          onChange={(v) => setShowPoints(v === "on")}
          options={["off", "on"]}
        />
      )}
      {isCombo && (
        <PropertyRow
          label="Right axis"
          value={showRightAxis ? "on" : "off"}
          onChange={(v) => setShowRightAxis(v === "on")}
          options={["off", "on"]}
        />
      )}
      {(hasSeries || isCombo || isDonut) && (
        <PropertyRow
          label="Legend"
          value={showLegend ? "on" : "off"}
          onChange={(v) => setShowLegend(v === "on")}
          options={["off", "on"]}
        />
      )}
      {/* Donut has no cartesian axes/grid. */}
      {!isDonut && (
        <PropertyRow
          label="Grid"
          value={showGrid ? "on" : "off"}
          onChange={(v) => setShowGrid(v === "on")}
          options={["off", "on"]}
        />
      )}
      {!isDonut && (
        <PropertyRow
          label="Axis"
          value={showAxis ? "on" : "off"}
          onChange={(v) => setShowAxis(v === "on")}
          options={["off", "on"]}
        />
      )}
    </div>
  );
}
