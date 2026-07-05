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
  FunnelChart,
  Funnel,
  LabelList,
  RadialBarChart,
  RadialBar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

// Categorical sample for the (non-time) line chart — labels are categories, not
// dates, so the line chart reads distinctly from the time series chart.
const LINE_CATEGORY_DATA = [
  { name: "Page A", value: 42, value2: 24, value3: 60, value4: 12 },
  { name: "Page B", value: 58, value2: 38, value3: 30, value4: 50 },
  { name: "Page C", value: 35, value2: 52, value3: 64, value4: 22 },
  { name: "Page D", value: 71, value2: 30, value3: 20, value4: 58 },
  { name: "Page E", value: 49, value2: 62, value3: 44, value4: 28 },
  { name: "Page F", value: 63, value2: 41, value3: 54, value4: 70 },
];

// Time-stamped sample for the time series charts — a continuous date X-axis is
// what distinguishes a time series from a generic (categorical) line chart.
const TIME_SERIES_DATA = [
  { name: "Jan 1", value: 42, value2: 24, value3: 60, value4: 12 },
  { name: "Jan 8", value: 58, value2: 38, value3: 30, value4: 50 },
  { name: "Jan 15", value: 35, value2: 52, value3: 64, value4: 22 },
  { name: "Jan 22", value: 71, value2: 30, value3: 20, value4: 58 },
  { name: "Jan 29", value: 49, value2: 62, value3: 44, value4: 28 },
  { name: "Feb 5", value: 63, value2: 41, value3: 54, value4: 70 },
];

// Scatter sample: one cluster of {x, y} points per series, on a 0–100 / 0–100
// numeric grid. Each series occupies a distinct region so colors read apart.
const SCATTER_DATA = [
  [{ x: 12, y: 22 }, { x: 22, y: 35 }, { x: 30, y: 28 }, { x: 41, y: 48 }, { x: 52, y: 42 }, { x: 63, y: 58 }, { x: 72, y: 52 }],
  [{ x: 15, y: 60 }, { x: 26, y: 72 }, { x: 35, y: 64 }, { x: 46, y: 81 }, { x: 56, y: 73 }, { x: 67, y: 88 }, { x: 79, y: 80 }],
  [{ x: 18, y: 40 }, { x: 28, y: 30 }, { x: 38, y: 52 }, { x: 49, y: 37 }, { x: 59, y: 50 }, { x: 69, y: 43 }, { x: 81, y: 57 }],
  [{ x: 20, y: 12 }, { x: 32, y: 23 }, { x: 43, y: 16 }, { x: 54, y: 29 }, { x: 64, y: 19 }, { x: 75, y: 34 }, { x: 86, y: 26 }],
];

// Candlestick (OHLC) sample. `hl` is the [low, high] range the Bar maps to; the
// custom shape derives the open→close body from the datum. Mix of up/down candles.
const CANDLE_DATA = [
  { name: "Jan", open: 30, high: 42, low: 26, close: 38, hl: [26, 42] },
  { name: "Feb", open: 38, high: 46, low: 34, close: 36, hl: [34, 46] },
  { name: "Mar", open: 36, high: 40, low: 28, close: 32, hl: [28, 40] },
  { name: "Apr", open: 32, high: 50, low: 30, close: 48, hl: [30, 50] },
  { name: "May", open: 48, high: 58, low: 44, close: 52, hl: [44, 58] },
  { name: "Jun", open: 52, high: 56, low: 40, close: 44, hl: [40, 56] },
  { name: "Jul", open: 44, high: 62, low: 42, close: 60, hl: [42, 62] },
  { name: "Aug", open: 60, high: 66, low: 50, close: 54, hl: [50, 66] },
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

// Ranked horizontal-bar sample: text-heavy categories sorted high→low, the case
// where horizontal bars beat vertical ones (long labels read cleanly on the Y axis).
const RANKED_BAR_DATA = [
  { name: "Singapore", value: 92 },
  { name: "Rotterdam", value: 78 },
  { name: "Shanghai", value: 64 },
  { name: "Los Angeles", value: 51 },
  { name: "Hamburg", value: 37 },
];

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

// Funnel sample: monotonically decreasing conversion stages (drop-off). Stage
// count is driven by the slices/stages control.
const FUNNEL_DATA = [
  { name: "Visited", value: 421 },
  { name: "Signed up", value: 278 },
  { name: "Activated", value: 183 },
  { name: "Subscribed", value: 97 },
  { name: "Renewed", value: 54 },
  { name: "Advocates", value: 28 },
];
export const MAX_FUNNEL_STAGES = FUNNEL_DATA.length;

// Radial (gauge) sample: one row per concentric ring, each a 0–100 percentage
// drawn over a muted background track. Ring count is driven by the slices control.
const RADIAL_DATA = [
  { name: "Ring 1", value: 86 },
  { name: "Ring 2", value: 72 },
  { name: "Ring 3", value: 58 },
  { name: "Ring 4", value: 44 },
  { name: "Ring 5", value: 31 },
  { name: "Ring 6", value: 20 },
];
export const MAX_RADIAL_RINGS = RADIAL_DATA.length;

// Sparkline sample: a single dense series with gentle variation + an upward
// drift, so line/area/bar styles all read as a recognizable micro-trend.
const SPARK_DATA = [
  { name: "1", value: 18 },
  { name: "2", value: 22 },
  { name: "3", value: 17 },
  { name: "4", value: 26 },
  { name: "5", value: 24 },
  { name: "6", value: 31 },
  { name: "7", value: 28 },
  { name: "8", value: 36 },
  { name: "9", value: 33 },
  { name: "10", value: 42 },
  { name: "11", value: 39 },
  { name: "12", value: 48 },
];

const SERIES_KEYS = [
  "chart-series-1",
  "chart-series-2",
  "chart-series-3",
  "chart-series-4",
  "chart-series-5",
  "chart-series-6",
];

// Translucent fill palette used only by Area + Radar. The alpha is baked into
// each token's color value, so these render without a separate opacity prop.
const OPACITY_SERIES_KEYS = [
  "chart-series-opacity-1",
  "chart-series-opacity-2",
  "chart-series-opacity-3",
  "chart-series-opacity-4",
  "chart-series-opacity-5",
  "chart-series-opacity-6",
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

// Translucent counterpart of the shade ramp, used to fill Area/Radar regions in
// shades mode (alpha baked into each token; the outline keeps the solid shade).
const SHADE_OPACITY_KEYS = [
  "chart-shade-opacity-1",
  "chart-shade-opacity-2",
  "chart-shade-opacity-3",
  "chart-shade-opacity-4",
  "chart-shade-opacity-5",
  "chart-shade-opacity-6",
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
  /** "bar" | "bar-horizontal" | "line" | "time-series" | "time-series-dual-axis" | "area" | "stacked-area" | "stacked-bar" | "combo" | "donut" | "pie" | "funnel" | "radial" | "radar" | "scatter" | "candlestick" | "sparkline" */
  type = "bar",
  size = "md",
  /** Sparkline only: "line" | "area" | "bar". */
  sparklineStyle = "line",
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
  const opacitySeries = OPACITY_SERIES_KEYS.map((key) =>
    svgColor(resolveColor(brands, brandId, tokens[key]?.semantic, theme, key))
  );
  const shades = SHADE_KEYS.map((key) =>
    svgColor(resolveColor(brands, brandId, tokens[key]?.semantic, theme, key))
  );
  const shadeOpacity = SHADE_OPACITY_KEYS.map((key) =>
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

  // Pie-specific tokens (a donut with no hole). Inner radius is fixed at 0.
  const piePadAngle = Number(resolveDimension(brands, brandId, "chart-pie-pad-angle", size)) || 0;
  const pieCornerRadius = Math.max(0, Number(resolveDimension(brands, brandId, "chart-pie-corner-radius", size)) || 0);

  // Funnel-specific tokens (centered value label color + size).
  const funnelTokens = COMPONENT_TOKENS["chart-funnel"] || {};
  const funnelLabelColor = svgColor(
    resolveColor(brands, brandId, funnelTokens["chart-funnel-label"]?.semantic, theme, "chart-funnel-label")
  );
  const funnelLabelFontSize = Number(resolveDimension(brands, brandId, "chart-funnel-label-font-size", size)) || 14;

  // Radial (gauge) tokens: muted background track + rounded ring ends + ring gap.
  const radialTokens = COMPONENT_TOKENS["chart-radial"] || {};
  const radialTrackColor = svgColor(
    resolveColor(brands, brandId, radialTokens["chart-radial-track"]?.semantic, theme, "chart-radial-track")
  );
  const radialCorner = Math.max(0, Number(resolveDimension(brands, brandId, "chart-radial-corner-radius", size)) || 0);
  const radialRingGap = Math.max(0, Number(resolveDimension(brands, brandId, "chart-radial-ring-gap", size)) || 4);

  // Radar-specific tokens.
  const radarLineWidth = Number(resolveDimension(brands, brandId, "chart-radar-line-width", size)) || 2;
  const radarDotRadius = Math.max(0, Number(resolveDimension(brands, brandId, "chart-radar-dot-radius", size)) || 0);

  // Scatter-specific tokens.
  const scatterPointRadius = Math.max(1, Number(resolveDimension(brands, brandId, "chart-scatter-point-radius", size)) || 4);
  const scatterTokens = COMPONENT_TOKENS["chart-scatter"] || {};
  const scatterCursorColor = svgColor(
    resolveColor(brands, brandId, scatterTokens["chart-scatter-cursor"]?.semantic, theme, "chart-scatter-cursor")
  );

  // Candlestick-specific tokens (directional colors + body/wick sizing).
  const candleTokens = COMPONENT_TOKENS["chart-candlestick"] || {};
  const candleUpColor = svgColor(
    resolveColor(brands, brandId, candleTokens["chart-candlestick-up"]?.semantic, theme, "chart-candlestick-up")
  );
  const candleDownColor = svgColor(
    resolveColor(brands, brandId, candleTokens["chart-candlestick-down"]?.semantic, theme, "chart-candlestick-down")
  );
  const candleBodyWidth = Math.max(1, Number(resolveDimension(brands, brandId, "chart-candlestick-body-width", size)) || 7);
  const candleWickWidth = Math.max(1, Number(resolveDimension(brands, brandId, "chart-candlestick-wick-width", size)) || 1);

  // Sparkline-specific tokens (compact height + stroke/dot/bar sizing). Color
  // comes from the shared series-1 (stroke/bar/dot) + series-opacity-1 (area fill).
  const sparkHeight = Number(resolveDimension(brands, brandId, "chart-sparkline-height", size)) || 48;
  const sparkLineWidth = Number(resolveDimension(brands, brandId, "chart-sparkline-line-width", size)) || 2;
  const sparkDotRadius = Math.max(0, Number(resolveDimension(brands, brandId, "chart-sparkline-dot-radius", size)) || 3.5);
  const sparkBarRadius = Math.max(0, Number(resolveDimension(brands, brandId, "chart-sparkline-bar-radius", size)) || 1);
  const sparkBarGap = Math.max(0, Number(resolveDimension(brands, brandId, "chart-sparkline-bar-gap", size)) || 3);
  const renderCandle = (props) => {
    const { x, y, width, height, payload } = props;
    if (!payload) return null;
    const { open, close, high, low } = payload;
    const color = close >= open ? candleUpColor : candleDownColor;
    const range = high - low || 1;
    const pxPerUnit = height / range;
    const bodyTop = y + (high - Math.max(open, close)) * pxPerUnit;
    const bodyBottom = y + (high - Math.min(open, close)) * pxPerUnit;
    const bodyH = Math.max(1, bodyBottom - bodyTop);
    const cx = x + width / 2;
    const halfBody = Math.min(candleBodyWidth, width) / 2;
    return (
      <g>
        <line x1={cx} y1={y} x2={cx} y2={y + height} stroke={color} strokeWidth={candleWickWidth} />
        <rect x={cx - halfBody} y={bodyTop} width={halfBody * 2} height={bodyH} fill={color} />
      </g>
    );
  };

  // Sparkline end dot: a marker on the final data point only (last value).
  const sparkLastIndex = SPARK_DATA.length - 1;
  const sparkEndDot = (props) => {
    if (props.index !== sparkLastIndex) return null;
    return <circle key="end-dot" cx={props.cx} cy={props.cy} r={sparkDotRadius} fill={series[0]} stroke="none" />;
  };

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
  // Funnel stages reuse the slices/stages control (2..MAX_FUNNEL_STAGES).
  const funnelStageCount = Math.max(2, Math.min(MAX_FUNNEL_STAGES, Number(seriesCount) || 4));
  const funnelData = FUNNEL_DATA.slice(0, funnelStageCount);
  // Radial rings reuse the slices/stages control (2..MAX_RADIAL_RINGS).
  const radialRingCount = Math.max(2, Math.min(MAX_RADIAL_RINGS, Number(seriesCount) || 4));
  const radialData = RADIAL_DATA.slice(0, radialRingCount);

  // Dual-axis time series: the right series is scaled to a larger magnitude so
  // the two independent Y-axes (left = value, right = value2) read distinctly —
  // the whole point of a dual-axis chart vs. a multi-series one.
  const dualAxisData = TIME_SERIES_DATA.map((d) => ({
    name: d.name,
    value: d.value,
    value2: d.value2 * 12,
  }));

  const colorAt = (i) => {
    if (colorMode === "shades") return shades[i % shades.length];
    if (colorMode === "palette") return series[i % series.length];
    return series[0];
  };

  // Area/Radar fills use the translucent palettes (alpha baked into each token):
  // the opacity series in single/palette modes, the opacity shade ramp in shades.
  const fillColorAt = (i) => {
    if (colorMode === "shades") return shadeOpacity[i % shadeOpacity.length];
    if (colorMode === "palette") return opacitySeries[i % opacitySeries.length];
    return opacitySeries[0];
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
      : type === "time-series-dual-axis"
      ? [
          { color: series[0], label: "Series 1" },
          { color: series[1], label: "Series 2" },
        ]
      : type === "candlestick"
      ? [
          { color: candleUpColor, label: "Up" },
          { color: candleDownColor, label: "Down" },
        ]
      : type === "donut" || type === "pie"
      ? donutData.map((_, i) => ({ color: colorAt(i), label: `Series ${i + 1}` }))
      : type === "funnel"
      ? funnelData.map((d, i) => ({ color: colorAt(i), label: d.name }))
      : type === "radial"
      ? radialData.map((d, i) => ({ color: colorAt(i), label: d.name }))
      : seriesIndexes.map((i) => ({ color: colorAt(i), label: `Series ${i + 1}` }));

  const legend =
    showLegend &&
    (type === "line" || type === "time-series" || type === "time-series-dual-axis" || type === "area" || type === "stacked-area" || type === "stacked-bar" || type === "combo" || type === "donut" || type === "pie" || type === "funnel" || type === "radial" || type === "radar" || type === "scatter" || type === "candlestick") ? (
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
      {type === "sparkline" ? (
        sparklineStyle === "bar" ? (
          <BarChart
            width={width}
            height={sparkHeight}
            data={SPARK_DATA}
            barCategoryGap={sparkBarGap}
            margin={{ top: 2, right: 2, bottom: 0, left: 0 }}
          >
            <Bar
              dataKey="value"
              fill={series[0]}
              radius={[sparkBarRadius, sparkBarRadius, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        ) : sparklineStyle === "area" ? (
          <AreaChart
            width={width}
            height={sparkHeight}
            data={SPARK_DATA}
            margin={{ top: sparkDotRadius + 1, right: sparkDotRadius + 2, bottom: 2, left: 2 }}
          >
            <Area
              type="monotone"
              dataKey="value"
              stroke={series[0]}
              strokeWidth={sparkLineWidth}
              strokeLinecap="round"
              fill={opacitySeries[0]}
              fillOpacity={1}
              dot={showPoints ? sparkEndDot : false}
              activeDot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        ) : (
          <LineChart
            width={width}
            height={sparkHeight}
            data={SPARK_DATA}
            margin={{ top: sparkDotRadius + 1, right: sparkDotRadius + 2, bottom: 2, left: 2 }}
          >
            <Line
              type="monotone"
              dataKey="value"
              stroke={series[0]}
              strokeWidth={sparkLineWidth}
              strokeLinecap="round"
              dot={showPoints ? sparkEndDot : false}
              activeDot={false}
              isAnimationActive={false}
            />
          </LineChart>
        )
      ) : type === "bar-horizontal" ? (
        <BarChart
          layout="vertical"
          width={width}
          height={height}
          data={RANKED_BAR_DATA}
          barCategoryGap={barGap}
          margin={{ top: 8, right: 12, bottom: 0, left: 4 }}
        >
          {showGrid && (
            <CartesianGrid
              horizontal={false}
              stroke={gridColor}
              strokeWidth={gridWidth}
              strokeDasharray={gridDashArray}
            />
          )}
          <XAxis
            type="number"
            tick={tickStyle}
            tickLine={false}
            axisLine={showAxis ? { stroke: axisColor, strokeWidth: axisWidth } : false}
            hide={!showAxis}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={tickStyle}
            tickLine={false}
            axisLine={showAxis ? { stroke: axisColor, strokeWidth: axisWidth } : false}
            width={84}
            hide={!showAxis}
          />
          <Bar dataKey="value" radius={[0, barRadius, barRadius, 0]} isAnimationActive={false}>
            {RANKED_BAR_DATA.map((_entry, index) => (
              <Cell key={index} fill={colorAt(index)} />
            ))}
          </Bar>
        </BarChart>
      ) : type === "radar" ? (
        <RadarChart
          width={width}
          height={height}
          data={RADAR_DATA}
          margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
          outerRadius="72%"
        >
          {showGrid && (
            <PolarGrid stroke={gridColor} strokeWidth={gridWidth} />
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
              fill={fillColorAt(i)}
              fillOpacity={1}
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
      ) : type === "pie" ? (
        <PieChart width={width} height={height}>
          <Pie
            data={donutData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={0}
            outerRadius="80%"
            paddingAngle={piePadAngle}
            cornerRadius={pieCornerRadius}
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
      ) : type === "funnel" ? (
        <FunnelChart width={width} height={height} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <Funnel dataKey="value" data={funnelData} isAnimationActive={false} stroke="none">
            {funnelData.map((_entry, i) => (
              <Cell key={i} fill={colorAt(i)} />
            ))}
            <LabelList
              position="center"
              dataKey="value"
              fill={funnelLabelColor}
              stroke="none"
              fontSize={funnelLabelFontSize}
              fontFamily={`'${fontFamily}', sans-serif`}
            />
          </Funnel>
        </FunnelChart>
      ) : type === "radial" ? (
        <RadialBarChart
          width={width}
          height={height}
          data={radialData}
          innerRadius="30%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
          barCategoryGap={radialRingGap}
          barGap={radialRingGap}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
          <RadialBar
            dataKey="value"
            cornerRadius={radialCorner}
            background={{ fill: radialTrackColor }}
            isAnimationActive={false}
          >
            {radialData.map((_entry, i) => (
              <Cell key={i} fill={colorAt(i)} />
            ))}
          </RadialBar>
        </RadialBarChart>
      ) : type === "time-series-dual-axis" ? (
        <LineChart
          width={width}
          height={height}
          data={dualAxisData}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          {grid}
          {xAxis}
          <YAxis
            tick={tickStyle}
            tickLine={false}
            axisLine={showAxis ? { stroke: axisColor, strokeWidth: axisWidth } : false}
            width={40}
            hide={!showAxis}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={tickStyle}
            tickLine={false}
            axisLine={showAxis ? { stroke: axisColor, strokeWidth: axisWidth } : false}
            width={40}
            hide={!showAxis}
          />
          <Line
            type={curveType}
            dataKey="value"
            stroke={series[0]}
            strokeWidth={lineWidth}
            strokeLinecap="round"
            dot={showPoints ? { r: pointRadius, fill: series[0], strokeWidth: 0 } : false}
            activeDot={false}
            isAnimationActive={false}
          />
          <Line
            yAxisId="right"
            type={curveType}
            dataKey="value2"
            stroke={series[1]}
            strokeWidth={lineWidth}
            strokeLinecap="round"
            dot={showPoints ? { r: pointRadius, fill: series[1], strokeWidth: 0 } : false}
            activeDot={false}
            isAnimationActive={false}
          />
        </LineChart>
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
      ) : type === "candlestick" ? (
        <ComposedChart
          width={width}
          height={height}
          data={CANDLE_DATA}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          {grid}
          {xAxis}
          {yAxis}
          <Bar
            dataKey="hl"
            shape={renderCandle}
            isAnimationActive={false}
            legendType="none"
          />
        </ComposedChart>
      ) : type === "scatter" ? (
        <ScatterChart
          width={width}
          height={height}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          {grid}
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 100]}
            tick={tickStyle}
            tickLine={false}
            axisLine={showAxis ? { stroke: axisColor, strokeWidth: axisWidth } : false}
            hide={!showAxis}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[0, 100]}
            tick={tickStyle}
            tickLine={false}
            axisLine={showAxis ? { stroke: axisColor, strokeWidth: axisWidth } : false}
            width={40}
            hide={!showAxis}
          />
          <Tooltip
            cursor={{ stroke: scatterCursorColor, strokeWidth: 1, strokeDasharray: "4 4" }}
            content={() => null}
            isAnimationActive={false}
            wrapperStyle={{ outline: "none" }}
          />
          {seriesIndexes.map((i) => (
            <Scatter
              key={i}
              data={SCATTER_DATA[i % SCATTER_DATA.length]}
              fill={colorAt(i)}
              isAnimationActive={false}
              shape={(p) => (
                <circle cx={p.cx} cy={p.cy} r={scatterPointRadius} fill={colorAt(i)} />
              )}
            />
          ))}
        </ScatterChart>
      ) : type === "stacked-area" ? (
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
              stackId="stack"
              stroke={colorAt(i)}
              strokeWidth={areaLineWidth}
              fill={fillColorAt(i)}
              fillOpacity={1}
              dot={showPoints ? { r: areaPointRadius, fill: colorAt(i), strokeWidth: 0 } : false}
              activeDot={false}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
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
              fill={fillColorAt(i)}
              fillOpacity={1}
              dot={showPoints ? { r: areaPointRadius, fill: colorAt(i), strokeWidth: 0 } : false}
              activeDot={false}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      ) : type === "line" || type === "time-series" ? (
        <LineChart
          width={width}
          height={height}
          data={type === "time-series" ? TIME_SERIES_DATA : LINE_CATEGORY_DATA}
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
