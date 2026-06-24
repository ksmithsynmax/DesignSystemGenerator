import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

// Fixed, representative sample data. Chart *data* is not a design-system concern —
// only the styling (colors, axis, grid, typography) is token-driven. Extra series
// (value2..value4) are only used when a chart renders multiple series.
const SAMPLE_DATA = [
  { name: "Jan", value: 42, value2: 24, value3: 60, value4: 12 },
  { name: "Feb", value: 58, value2: 38, value3: 30, value4: 50 },
  { name: "Mar", value: 35, value2: 52, value3: 64, value4: 22 },
  { name: "Apr", value: 71, value2: 30, value3: 20, value4: 58 },
  { name: "May", value: 49, value2: 62, value3: 44, value4: 28 },
  { name: "Jun", value: 63, value2: 41, value3: 54, value4: 70 },
];

// Data keys per series, paired index-for-index with SERIES_KEYS.
const SERIES_DATA_KEYS = ["value", "value2", "value3", "value4"];
export const MAX_CHART_SERIES = SERIES_DATA_KEYS.length;

// Donut composition sample (parts-of-a-whole). Slice count is driven by the
// series/slice control; values need not sum to 100 — proportions are computed.
const DONUT_DATA = [
  { name: "Series 1", value: 38 },
  { name: "Series 2", value: 26 },
  { name: "Series 3", value: 18 },
  { name: "Series 4", value: 12 },
  { name: "Series 5", value: 8 },
  { name: "Series 6", value: 6 },
];
export const MAX_DONUT_SLICES = DONUT_DATA.length;

// Radar (spider) sample: one row per axis/category, with up to 4 comparable series.
const RADAR_DATA = [
  { name: "Speed", value: 78, value2: 52, value3: 64, value4: 40 },
  { name: "Power", value: 62, value2: 70, value3: 38, value4: 55 },
  { name: "Range", value: 84, value2: 44, value3: 60, value4: 30 },
  { name: "Agility", value: 48, value2: 66, value3: 52, value4: 72 },
  { name: "Defense", value: 70, value2: 36, value3: 46, value4: 58 },
  { name: "Stealth", value: 55, value2: 60, value3: 70, value4: 42 },
];
export const MAX_RADAR_SERIES = SERIES_DATA_KEYS.length;

const SERIES_KEYS = [
  "chart-series-1",
  "chart-series-2",
  "chart-series-3",
  "chart-series-4",
  "chart-series-5",
  "chart-series-6",
];

// "shades" mode draws from its own dedicated, editable token set (separate from
// the series palette) so the variables align 1:1 with what the chart renders.
const SHADE_KEYS = [
  "chart-shade-1",
  "chart-shade-2",
  "chart-shade-3",
  "chart-shade-4",
  "chart-shade-5",
  "chart-shade-6",
];

// Per-series line style tokens (line/combo only): solid | dashed | dotted.
const SERIES_STYLE_KEYS = [
  "chart-series-1-style",
  "chart-series-2-style",
  "chart-series-3-style",
  "chart-series-4-style",
  "chart-series-5-style",
  "chart-series-6-style",
];

/** SVG dash pattern for a per-series line style (undefined = solid). */
function dashArrayFor(style, dash) {
  const d = Math.max(2, Number(dash) || 6);
  if (style === "dashed") return `${d} ${d}`;
  if (style === "dotted") return `2 ${d}`;
  return undefined;
}

// SVG presentation attributes are happiest with 6-digit hex; drop a fully-opaque
// alpha suffix (#RRGGBBFF -> #RRGGBB) while preserving real transparency.
function svgColor(hex) {
  if (typeof hex === "string" && /^#[0-9a-fA-F]{8}$/.test(hex) && hex.slice(7).toUpperCase() === "FF") {
    return hex.slice(0, 7);
  }
  return hex;
}

export default function ChartPreview({
  brands,
  brandId,
  /** "bar" | "line" | "area" | "stacked-bar" | "combo" | "donut" */
  type = "bar",
  size = "md",
  /**
   * Color strategy, shared by every chart type:
   *  - "single"  : one element / series-1 color everywhere
   *  - "palette" : cycle the chart-series-N palette (distinct hues)
   *  - "shades"  : a monochromatic ramp derived from the series-1 hue
   */
  colorMode = "single",
  /** Line/Area: number of data series to render (forced to 1 in "single" mode). */
  seriesCount = 1,
  /** Line only: render data-point dots. */
  showPoints = true,
  showGrid = true,
  showAxis = true,
  /** Line/Area: render a tokenized legend (swatch + label per series) below the plot. */
  showLegend = false,
  /** Combo only: give the line its own right-hand Y axis (independent scale). */
  showRightAxis = false,
  previewTheme = "dark",
}) {
  // Shared chart styling tokens live in the `chart` group regardless of subtype.
  const tokens = COMPONENT_TOKENS.chart;
  const theme = previewTheme === "dark" ? "dark" : "light";

  const series = SERIES_KEYS.map((key) =>
    svgColor(resolveColor(brands, brandId, tokens[key]?.semantic, theme, key))
  );
  const shades = SHADE_KEYS.map((key) =>
    svgColor(resolveColor(brands, brandId, tokens[key]?.semantic, theme, key))
  );
  const axisColor = svgColor(resolveColor(brands, brandId, tokens["chart-axis"]?.semantic, theme, "chart-axis"));
  const gridColor = svgColor(resolveColor(brands, brandId, tokens["chart-grid"]?.semantic, theme, "chart-grid"));
  const labelColor = svgColor(resolveColor(brands, brandId, tokens["chart-label"]?.semantic, theme, "chart-label"));

  const width = Number(resolveDimension(brands, brandId, "chart-width", size)) || 320;
  const height = Number(resolveDimension(brands, brandId, "chart-height", size)) || 180;
  const barGap = Number(resolveDimension(brands, brandId, "chart-bar-gap", size)) || 12;
  const labelFontSize = Number(resolveDimension(brands, brandId, "chart-label-font-size", size)) || 11;
  const barRadius = Number(resolveDimension(brands, brandId, "chart-bar-radius", size)) || 2;
  const axisWidth = Number(resolveDimension(brands, brandId, "chart-axis-width", size)) || 1;
  const gridWidth = Number(resolveDimension(brands, brandId, "chart-grid-width", size)) || 1;
  const padding = Number(resolveDimension(brands, brandId, "chart-padding", size)) || 16;
  const fontFamily =
    resolveDimension(brands, brandId, "chart-font-family", size) || "Inter";
  const gridStyle = resolveDimension(brands, brandId, "chart-grid-style", size) || "solid";
  const gridDash = Number(resolveDimension(brands, brandId, "chart-grid-dash", size)) || 4;
  const gridDashArray = gridStyle === "dashed" ? `${gridDash} ${gridDash}` : undefined;

  // Line-specific tokens.
  const lineWidth = Number(resolveDimension(brands, brandId, "chart-line-width", size)) || 2;
  const pointRadius = Number(resolveDimension(brands, brandId, "chart-line-point-radius", size)) || 3;
  const lineCurve = resolveDimension(brands, brandId, "chart-line-curve", size) || "smooth";
  const curveType = lineCurve === "straight" ? "linear" : "monotone";
  const seriesDash = Number(resolveDimension(brands, brandId, "chart-series-dash", size)) || 6;
  const seriesStyles = SERIES_STYLE_KEYS.map(
    (key) => resolveDimension(brands, brandId, key, size) || "solid"
  );
  const dashAt = (i) => dashArrayFor(seriesStyles[i % seriesStyles.length], seriesDash);

  // Legend tokens (shared).
  const legendFontSize = Number(resolveDimension(brands, brandId, "chart-legend-font-size", size)) || 12;
  const legendSwatch = Number(resolveDimension(brands, brandId, "chart-legend-swatch-size", size)) || 10;
  const legendGap = Number(resolveDimension(brands, brandId, "chart-legend-gap", size)) || 16;

  // Area-specific tokens.
  const areaLineWidth = Number(resolveDimension(brands, brandId, "chart-area-line-width", size)) || 2;
  const areaFillOpacity =
    (Number(resolveDimension(brands, brandId, "chart-area-fill-opacity", size)) || 20) / 100;
  const areaPointRadius = Number(resolveDimension(brands, brandId, "chart-area-point-radius", size)) || 3;

  // Combo-specific tokens.
  const comboLineWidth = Number(resolveDimension(brands, brandId, "chart-combo-line-width", size)) || 2;
  const comboCurve = resolveDimension(brands, brandId, "chart-combo-line-curve", size);
  const comboCurveType = comboCurve === "smooth" ? "monotone" : "linear";
  const comboLineStyle = resolveDimension(brands, brandId, "chart-combo-line-style", size);
  const comboLineDashLen = Number(resolveDimension(brands, brandId, "chart-combo-line-dash", size)) || 6;
  const comboDashArray = dashArrayFor(comboLineStyle, comboLineDashLen);
  const comboPointRadius = Number(resolveDimension(brands, brandId, "chart-combo-point-radius", size)) || 3;

  // Donut-specific tokens.
  const donutInnerPct = Number(resolveDimension(brands, brandId, "chart-donut-inner-radius", size)) || 60;
  const donutPadAngle = Number(resolveDimension(brands, brandId, "chart-donut-pad-angle", size)) || 0;
  const donutCornerRadius = Math.max(0, Number(resolveDimension(brands, brandId, "chart-donut-corner-radius", size)) || 0);

  // Radar-specific tokens.
  const radarLineWidth = Number(resolveDimension(brands, brandId, "chart-radar-line-width", size)) || 2;
  const radarFillOpacity =
    (Number(resolveDimension(brands, brandId, "chart-radar-fill-opacity", size)) || 25) / 100;
  const radarDotRadius = Math.max(0, Number(resolveDimension(brands, brandId, "chart-radar-dot-radius", size)) || 0);

  const tickStyle = {
    fill: labelColor,
    fontSize: labelFontSize,
    fontFamily: `'${fontFamily}', sans-serif`,
  };

  // How many drawable elements this chart has:
  //  - bar: one per data category (colorMode tints them)
  //  - line/area: the series count, forced to 1 when colorMode is "single"
  const requestedSeries = Math.max(1, Math.min(MAX_CHART_SERIES, Number(seriesCount) || 1));
  const lineAreaCount = colorMode === "single" ? 1 : requestedSeries;
  const seriesIndexes = Array.from({ length: lineAreaCount }, (_, i) => i);
  // Donut slices use their own (higher) cap and never collapse to a single slice.
  const donutSliceCount = Math.max(2, Math.min(MAX_DONUT_SLICES, Number(seriesCount) || 4));
  const donutData = DONUT_DATA.slice(0, donutSliceCount);

  const colorAt = (i) => {
    if (colorMode === "shades") return shades[i % shades.length];
    if (colorMode === "palette") return series[i % series.length];
    return series[0];
  };

  const grid = showGrid ? (
    <CartesianGrid
      vertical={false}
      stroke={gridColor}
      strokeWidth={gridWidth}
      strokeDasharray={gridDashArray}
    />
  ) : null;
  const xAxis = (
    <XAxis
      dataKey="name"
      tick={tickStyle}
      tickLine={false}
      axisLine={showAxis ? { stroke: axisColor, strokeWidth: axisWidth } : false}
      hide={!showAxis}
    />
  );
  const yAxis = (
    <YAxis
      tick={tickStyle}
      tickLine={false}
      axisLine={showAxis ? { stroke: axisColor, strokeWidth: axisWidth } : false}
      width={40}
      hide={!showAxis}
    />
  );

  const legendItems =
    type === "combo"
      ? [
          { color: series[0], label: "Bars" },
          { color: series[1], label: "Line" },
        ]
      : type === "donut"
      ? donutData.map((_, i) => ({ color: colorAt(i), label: `Series ${i + 1}` }))
      : seriesIndexes.map((i) => ({ color: colorAt(i), label: `Series ${i + 1}` }));

  const legend =
    showLegend &&
    (type === "line" || type === "area" || type === "stacked-bar" || type === "combo" || type === "donut" || type === "radar") ? (
      <div
        style={{
          width,
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: legendGap,
          marginTop: 12,
        }}
      >
        {legendItems.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: legendSwatch,
                height: legendSwatch,
                borderRadius: 2,
                background: item.color,
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: legendFontSize,
                color: labelColor,
                fontFamily: `'${fontFamily}', sans-serif`,
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    ) : null;

  return (
    <div style={{ padding, display: "inline-block", fontFamily: `'${fontFamily}', sans-serif` }}>
      {type === "radar" ? (
        <RadarChart
          width={width}
          height={height}
          data={RADAR_DATA}
          margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
          outerRadius="72%"
        >
          {showGrid && (
            <PolarGrid stroke={gridColor} strokeWidth={gridWidth} strokeDasharray={gridDashArray} />
          )}
          <PolarAngleAxis dataKey="name" tick={tickStyle} tickLine={false} />
          {showAxis && (
            <PolarRadiusAxis
              tick={tickStyle}
              tickCount={4}
              axisLine={{ stroke: axisColor, strokeWidth: axisWidth }}
              stroke={axisColor}
            />
          )}
          {seriesIndexes.map((i) => (
            <Radar
              key={i}
              dataKey={SERIES_DATA_KEYS[i]}
              stroke={colorAt(i)}
              strokeWidth={radarLineWidth}
              fill={colorAt(i)}
              fillOpacity={radarFillOpacity}
              dot={radarDotRadius > 0 ? { r: radarDotRadius, fill: colorAt(i), strokeWidth: 0 } : false}
              isAnimationActive={false}
            />
          ))}
        </RadarChart>
      ) : type === "donut" ? (
        <PieChart width={width} height={height}>
          <Pie
            data={donutData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={`${Math.round(donutInnerPct * 0.8)}%`}
            outerRadius="80%"
            paddingAngle={donutPadAngle}
            cornerRadius={donutCornerRadius}
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive={false}
          >
            {donutData.map((_entry, i) => (
              <Cell key={i} fill={colorAt(i)} />
            ))}
          </Pie>
        </PieChart>
      ) : type === "combo" ? (
        <ComposedChart
          width={width}
          height={height}
          data={SAMPLE_DATA}
          barCategoryGap={barGap}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          {grid}
          {xAxis}
          {yAxis}
          {showRightAxis && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={tickStyle}
              tickLine={false}
              axisLine={showAxis ? { stroke: axisColor, strokeWidth: axisWidth } : false}
              width={40}
              hide={!showAxis}
            />
          )}
          <Bar
            dataKey="value"
            fill={series[0]}
            radius={[barRadius, barRadius, 0, 0]}
            isAnimationActive={false}
          />
          <Line
            type={comboCurveType}
            dataKey="value2"
            yAxisId={showRightAxis ? "right" : 0}
            stroke={series[1]}
            strokeWidth={comboLineWidth}
            strokeDasharray={comboDashArray}
            strokeLinecap={comboLineStyle === "dotted" ? "round" : "butt"}
            dot={showPoints ? { r: comboPointRadius, fill: series[1], strokeWidth: 0 } : false}
            activeDot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      ) : type === "stacked-bar" ? (
        <BarChart
          width={width}
          height={height}
          data={SAMPLE_DATA}
          barCategoryGap={barGap}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          {grid}
          {xAxis}
          {yAxis}
          {seriesIndexes.map((i) => {
            const isTop = i === seriesIndexes.length - 1;
            return (
              <Bar
                key={i}
                dataKey={SERIES_DATA_KEYS[i]}
                stackId="stack"
                fill={colorAt(i)}
                radius={isTop ? [barRadius, barRadius, 0, 0] : [0, 0, 0, 0]}
                isAnimationActive={false}
              />
            );
          })}
        </BarChart>
      ) : type === "area" ? (
        <AreaChart
          width={width}
          height={height}
          data={SAMPLE_DATA}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          {grid}
          {xAxis}
          {yAxis}
          {seriesIndexes.map((i) => (
            <Area
              key={i}
              type="monotone"
              dataKey={SERIES_DATA_KEYS[i]}
              stroke={colorAt(i)}
              strokeWidth={areaLineWidth}
              fill={colorAt(i)}
              fillOpacity={areaFillOpacity}
              dot={showPoints ? { r: areaPointRadius, fill: colorAt(i), strokeWidth: 0 } : false}
              activeDot={false}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      ) : type === "line" ? (
        <LineChart
          width={width}
          height={height}
          data={SAMPLE_DATA}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          {grid}
          {xAxis}
          {yAxis}
          {seriesIndexes.map((i) => (
            <Line
              key={i}
              type={curveType}
              dataKey={SERIES_DATA_KEYS[i]}
              stroke={colorAt(i)}
              strokeWidth={lineWidth}
              strokeDasharray={dashAt(i)}
              strokeLinecap="round"
              dot={showPoints ? { r: pointRadius, fill: colorAt(i), strokeWidth: 0 } : false}
              activeDot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      ) : (
        <BarChart
          width={width}
          height={height}
          data={SAMPLE_DATA}
          barCategoryGap={barGap}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          {grid}
          {xAxis}
          {yAxis}
          <Bar dataKey="value" radius={[barRadius, barRadius, 0, 0]} isAnimationActive={false}>
            {SAMPLE_DATA.map((_entry, index) => (
              <Cell key={index} fill={colorAt(index)} />
            ))}
          </Bar>
        </BarChart>
      )}
      {legend}
    </div>
  );
}
