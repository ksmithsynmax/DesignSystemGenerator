import ChartPreview from "../src/components/previews/ChartPreview";
import { STORYBOOK_BRANDS } from "../src/data/storybookBrands";
import CodeBlock from "./components/CodeBlock";

// Charts match Recharts' responsive model: fill the container width via
// ResponsiveContainer, with a single fixed height (no size scale).
function buildCode(args) {
  const grid = args.showGrid ? "    <CartesianGrid vertical={false} stroke=\"var(--chart-grid)\" />\n" : "";
  const axes = args.showAxis
    ? "    <XAxis dataKey=\"name\" stroke=\"var(--chart-axis)\" />\n    <YAxis stroke=\"var(--chart-axis)\" />\n"
    : "";
  const wrap = (imports, inner) =>
    `import { ResponsiveContainer, ${imports} } from "recharts";

<ResponsiveContainer width="100%" height={180}>
${inner}
</ResponsiveContainer>`;

  if (args.type === "area") {
    return wrap(
      "AreaChart, Area, XAxis, YAxis, CartesianGrid",
      `  <AreaChart data={data}>
${grid}${axes}    <Area type="monotone" dataKey="value" stroke="var(--chart-series-1)"
      strokeWidth={2} fill="var(--chart-series-opacity-1)" fillOpacity={1}
      dot={${args.showPoints ? "{ r: 3 }" : "false"}} />
  </AreaChart>`
    );
  }
  if (args.type === "stacked-area") {
    const ramp = args.colorMode === "shades" ? "shade" : "series";
    return wrap(
      "AreaChart, Area, XAxis, YAxis, CartesianGrid",
      `  <AreaChart data={data}>
${grid}${axes}    <Area type="monotone" dataKey="value" stackId="s"
      stroke={\`var(--chart-${ramp}-1)\`} strokeWidth={2} fill={\`var(--chart-${ramp}-opacity-1)\`} fillOpacity={1}
      dot={${args.showPoints ? "{ r: 3 }" : "false"}} />
    <Area type="monotone" dataKey="value2" stackId="s"
      stroke={\`var(--chart-${ramp}-2)\`} strokeWidth={2} fill={\`var(--chart-${ramp}-opacity-2)\`} fillOpacity={1}
      dot={${args.showPoints ? "{ r: 3 }" : "false"}} />
    <Area type="monotone" dataKey="value3" stackId="s"
      stroke={\`var(--chart-${ramp}-3)\`} strokeWidth={2} fill={\`var(--chart-${ramp}-opacity-3)\`} fillOpacity={1}
      dot={${args.showPoints ? "{ r: 3 }" : "false"}} />
  </AreaChart>`
    );
  }
  if (args.type === "line" || args.type === "time-series") {
    return wrap(
      "LineChart, Line, XAxis, YAxis, CartesianGrid",
      `  <LineChart data={data}>
${grid}${axes}    <Line type="monotone" dataKey="value" stroke="var(--chart-series-1)"
      strokeWidth={2} dot={${args.showPoints ? "{ r: 3 }" : "false"}} />
  </LineChart>`
    );
  }
  if (args.type === "time-series-dual-axis") {
    return wrap(
      "LineChart, Line, XAxis, YAxis, CartesianGrid",
      `  <LineChart data={data}>
${grid}    <XAxis dataKey="name" stroke="var(--chart-axis)" />
    <YAxis yAxisId="left" stroke="var(--chart-axis)" />
    <YAxis yAxisId="right" orientation="right" stroke="var(--chart-axis)" />
    <Line yAxisId="left" type="monotone" dataKey="value" stroke="var(--chart-series-1)"
      strokeWidth={2} dot={${args.showPoints ? "{ r: 3 }" : "false"}} />
    <Line yAxisId="right" type="monotone" dataKey="value2" stroke="var(--chart-series-2)"
      strokeWidth={2} dot={${args.showPoints ? "{ r: 3 }" : "false"}} />
  </LineChart>`
    );
  }
  if (args.type === "combo") {
    const right = args.showRightAxis
      ? "    <YAxis yAxisId=\"right\" orientation=\"right\" stroke=\"var(--chart-axis)\" />\n"
      : "";
    return wrap(
      "ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid",
      `  <ComposedChart data={data}>
${grid}${axes}${right}    <Bar dataKey="value" radius={[2, 2, 0, 0]} fill="var(--chart-series-1)" />
    <Line type="linear" dataKey="value2"${args.showRightAxis ? " yAxisId=\"right\"" : ""}
      stroke="var(--chart-series-2)" strokeWidth={2} strokeDasharray="6 6"
      dot={${args.showPoints ? "{ r: 3 }" : "false"}} />
  </ComposedChart>`
    );
  }
  if (args.type === "stacked-bar") {
    return wrap(
      "BarChart, Bar, XAxis, YAxis, CartesianGrid",
      `  <BarChart data={data}>
${grid}${axes}    <Bar dataKey="value" stackId="s" fill="var(--chart-shade-1)" />
    <Bar dataKey="value2" stackId="s" fill="var(--chart-shade-2)" />
    <Bar dataKey="value3" stackId="s" radius={[2, 2, 0, 0]} fill="var(--chart-shade-3)" />
  </BarChart>`
    );
  }
  if (args.type === "candlestick") {
    return wrap(
      "ComposedChart, Bar, XAxis, YAxis, CartesianGrid",
      `  <ComposedChart data={data}>
${grid}${axes}    {/* Candle body (open→close) + high→low wick via a custom Bar shape. */}
    <Bar dataKey="hl" isAnimationActive={false} legendType="none"
      shape={(p) => {
        const { open, close, high, low } = p.payload;
        const color = close >= open
          ? "var(--chart-candlestick-up)"
          : "var(--chart-candlestick-down)";
        const k = p.height / ((high - low) || 1);
        const top = p.y + (high - Math.max(open, close)) * k;
        const h = Math.max(1, Math.abs(close - open) * k);
        const cx = p.x + p.width / 2;
        return (
          <g>
            <line x1={cx} y1={p.y} x2={cx} y2={p.y + p.height}
              stroke={color} strokeWidth={1} />
            <rect x={cx - 3.5} y={top} width={7} height={h} fill={color} />
          </g>
        );
      }} />
  </ComposedChart>`
    );
  }
  if (args.type === "scatter") {
    const ramp = args.colorMode === "shades" ? "shade" : "series";
    return wrap(
      "ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip",
      `  <ScatterChart>
${grid}    <XAxis type="number" dataKey="x" domain={[0, 100]} stroke="var(--chart-axis)" />
    <YAxis type="number" dataKey="y" domain={[0, 100]} stroke="var(--chart-axis)" />
    <Tooltip cursor={{ stroke: "var(--chart-scatter-cursor)", strokeDasharray: "4 4" }}
      content={() => null} />
    <Scatter data={series1} fill={\`var(--chart-${ramp}-1)\`} />
    <Scatter data={series2} fill={\`var(--chart-${ramp}-2)\`} />
    <Scatter data={series3} fill={\`var(--chart-${ramp}-3)\`} />
  </ScatterChart>`
    );
  }
  if (args.type === "radar") {
    const ramp = args.colorMode === "shades" ? "shade" : "series";
    const fillRamp = args.colorMode === "shades" ? "shade-1" : "series-opacity-1";
    return wrap(
      "RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis",
      `  <RadarChart data={data}>
${args.showGrid ? "    <PolarGrid stroke=\"var(--chart-grid)\" />\n" : ""}    <PolarAngleAxis dataKey="name" />
${args.showAxis ? "    <PolarRadiusAxis stroke=\"var(--chart-axis)\" />\n" : ""}    <Radar dataKey="value" stroke={\`var(--chart-${ramp}-1)\`}
      strokeWidth={2} fill={\`var(--chart-${fillRamp})\`} fillOpacity={1}
      dot={${args.showPoints ? "{ r: 3 }" : "false"}} />
  </RadarChart>`
    );
  }
  if (args.type === "donut") {
    const ramp = args.colorMode === "shades" ? "shade" : "series";
    return wrap(
      "PieChart, Pie, Cell",
      `  <PieChart>
    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
      innerRadius="48%" outerRadius="80%" paddingAngle={2}
      startAngle={90} endAngle={-270} stroke="none">
      {data.map((_, i) => (
        <Cell key={i} fill={\`var(--chart-${ramp}-\${i + 1})\`} />
      ))}
    </Pie>
  </PieChart>`
    );
  }
  if (args.type === "pie") {
    const ramp = args.colorMode === "shades" ? "shade" : "series";
    return wrap(
      "PieChart, Pie, Cell",
      `  <PieChart>
    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
      innerRadius={0} outerRadius="80%" paddingAngle={0}
      startAngle={90} endAngle={-270} stroke="none">
      {data.map((_, i) => (
        <Cell key={i} fill={\`var(--chart-${ramp}-\${i + 1})\`} />
      ))}
    </Pie>
  </PieChart>`
    );
  }
  if (args.type === "funnel") {
    const ramp = args.colorMode === "shades" ? "shade" : "series";
    return wrap(
      "FunnelChart, Funnel, LabelList, Cell",
      `  <FunnelChart>
    <Funnel dataKey="value" data={data} isAnimationActive={false} stroke="none">
      {data.map((_, i) => (
        <Cell key={i} fill={\`var(--chart-${ramp}-\${i + 1})\`} />
      ))}
      <LabelList position="center" dataKey="value"
        fill="var(--chart-funnel-label)" stroke="none" />
    </Funnel>
  </FunnelChart>`
    );
  }
  if (args.type === "radial") {
    const ramp = args.colorMode === "shades" ? "shade" : "series";
    return wrap(
      "RadialBarChart, RadialBar, PolarAngleAxis, Cell",
      `  <RadialBarChart data={data} innerRadius="30%" outerRadius="100%"
    startAngle={90} endAngle={-270} barCategoryGap={4}>
    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
    <RadialBar dataKey="value" cornerRadius={8}
      background={{ fill: "var(--chart-radial-track)" }} isAnimationActive={false}>
      {data.map((_, i) => (
        <Cell key={i} fill={\`var(--chart-${ramp}-\${i + 1})\`} />
      ))}
    </RadialBar>
  </RadialBarChart>`
    );
  }
  if (args.type === "sparkline") {
    const inner =
      args.sparklineStyle === "bar"
        ? `  <BarChart data={data} barCategoryGap={3}>
    <Bar dataKey="value" fill="var(--chart-series-1)" radius={[1, 1, 0, 0]} />
  </BarChart>`
        : args.sparklineStyle === "area"
        ? `  <AreaChart data={data} margin={{ top: 5, right: 6, bottom: 2, left: 2 }}>
    <Area type="monotone" dataKey="value" stroke="var(--chart-series-1)" strokeWidth={2}
      fill="var(--chart-series-opacity-1)" fillOpacity={1}
      dot={${args.showPoints ? "{ r: 3.5, fill: 'var(--chart-series-1)' } /* end dot only */" : "false"}} />
  </AreaChart>`
        : `  <LineChart data={data} margin={{ top: 5, right: 6, bottom: 2, left: 2 }}>
    <Line type="monotone" dataKey="value" stroke="var(--chart-series-1)" strokeWidth={2}
      dot={${args.showPoints ? "{ r: 3.5, fill: 'var(--chart-series-1)' } /* end dot only */" : "false"}} />
  </LineChart>`;
    const imports =
      args.sparklineStyle === "bar"
        ? "BarChart, Bar"
        : args.sparklineStyle === "area"
        ? "AreaChart, Area"
        : "LineChart, Line";
    return `import { ResponsiveContainer, ${imports} } from "recharts";

<ResponsiveContainer width="100%" height={48}>
${inner}
</ResponsiveContainer>`;
  }
  if (args.type === "bar-horizontal") {
    const ramp = args.colorMode === "shades" ? "shade" : "series";
    const cell =
      args.colorMode === "single"
        ? '      <Cell key={i} fill="var(--chart-series-1)" />'
        : "      <Cell key={i} fill={`var(--chart-" + ramp + "-${i + 1})`} />";
    const g = args.showGrid ? '    <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />\n' : "";
    const ax = args.showAxis
      ? '    <XAxis type="number" stroke="var(--chart-axis)" />\n    <YAxis type="category" dataKey="name" width={84} stroke="var(--chart-axis)" />\n'
      : "";
    return wrap(
      "BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid",
      `  <BarChart layout="vertical" data={data}>
${g}${ax}    <Bar dataKey="value" radius={[0, 2, 2, 0]}>
      {data.map((_, i) => (
${cell}
      ))}
    </Bar>
  </BarChart>`
    );
  }
  const fill = args.colorMode === "palette" ? "{seriesPalette}" : "var(--chart-series-1)";
  return wrap(
    "BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid",
    `  <BarChart data={data}>
${grid}${axes}    <Bar dataKey="value" radius={[2, 2, 0, 0]} fill="${fill}" />
  </BarChart>`
  );
}

export default {
  title: "Components/Chart",
  component: ChartPreview,
  argTypes: {
    type: { control: "select", options: ["bar", "bar-horizontal", "line", "time-series", "time-series-dual-axis", "area", "stacked-area", "stacked-bar", "combo", "donut", "pie", "funnel", "radial", "radar", "scatter", "candlestick", "sparkline"] },
    colorMode: { control: "select", options: ["single", "palette", "shades"] },
    seriesCount: { control: { type: "range", min: 1, max: 6, step: 1 } },
    sparklineStyle: { control: "select", options: ["line", "area", "bar"] },
    showPoints: { control: "boolean" },
    showGrid: { control: "boolean" },
    showAxis: { control: "boolean" },
    showLegend: { control: "boolean" },
    showRightAxis: { control: "boolean" },
  },
  args: {
    type: "bar",
    colorMode: "single",
    seriesCount: 1,
    sparklineStyle: "line",
    showPoints: true,
    showGrid: true,
    showAxis: true,
    showLegend: false,
    showRightAxis: false,
  },
  render: (args, { globals }) => (
    <div>
      <ChartPreview
        brands={STORYBOOK_BRANDS}
        brandId={globals.brand || "theia"}
        {...args}
      />
      <CodeBlock code={buildCode(args)} />
    </div>
  ),
};

export const Bar_ = { name: "Bar", args: { type: "bar", colorMode: "single" } };
export const BarPalette = { name: "Bar — Palette", args: { type: "bar", colorMode: "palette" } };
export const BarShades = { name: "Bar — Shades", args: { type: "bar", colorMode: "shades" } };
export const LineChartStory = { name: "Line", args: { type: "line", showPoints: true } };
export const LineNoPoints = { name: "Line — No Points", args: { type: "line", showPoints: false } };
export const TimeSeriesStory = { name: "Time Series", args: { type: "time-series", showPoints: false } };
export const TimeSeriesMultiSeries = {
  name: "Time Series — Multi-series",
  args: { type: "time-series", colorMode: "palette", seriesCount: 3, showPoints: false, showLegend: true },
};
export const TimeSeriesDualAxis = {
  name: "Time Series — Dual Axis",
  args: { type: "time-series-dual-axis", colorMode: "palette", seriesCount: 2, showPoints: false, showLegend: true },
};
export const AreaChartStory = { name: "Area", args: { type: "area", showPoints: false } };
export const AreaWithPoints = { name: "Area — With Points", args: { type: "area", showPoints: true } };
export const LineMultiSeries = { name: "Line — Multi-series", args: { type: "line", colorMode: "palette", seriesCount: 3, showPoints: false } };
export const LineStyledShades = {
  name: "Line — Styled (per-series solid/dashed/dotted)",
  args: { type: "line", colorMode: "shades", seriesCount: 3, showPoints: false },
};
export const LineWithLegend = {
  name: "Line — With Legend",
  args: { type: "line", colorMode: "shades", seriesCount: 3, showPoints: false, showLegend: true },
};
export const LineShades = { name: "Line — Shades", args: { type: "line", colorMode: "shades", seriesCount: 4, showPoints: false } };
export const AreaMultiSeries = { name: "Area — Multi-series", args: { type: "area", colorMode: "shades", seriesCount: 3, showPoints: false } };
export const AreaShades = { name: "Area — Shades", args: { type: "area", colorMode: "shades", seriesCount: 4, showPoints: false } };
export const StackedArea = {
  name: "Stacked Area",
  args: { type: "stacked-area", colorMode: "shades", seriesCount: 3, showPoints: false, showLegend: true },
};
export const StackedAreaPalette = {
  name: "Stacked Area — Palette",
  args: { type: "stacked-area", colorMode: "palette", seriesCount: 4, showPoints: false, showLegend: true },
};
export const StackedAreaPoints = {
  name: "Stacked Area — Points",
  args: { type: "stacked-area", colorMode: "shades", seriesCount: 3, showPoints: true, showLegend: true },
};
export const StackedBar = {
  name: "Stacked Bar",
  args: { type: "stacked-bar", colorMode: "shades", seriesCount: 3, showLegend: true },
};
export const StackedBarPalette = {
  name: "Stacked Bar — Palette",
  args: { type: "stacked-bar", colorMode: "palette", seriesCount: 4, showLegend: true },
};
export const Combo = {
  name: "Combo",
  args: { type: "combo", colorMode: "palette", seriesCount: 2, showLegend: true },
};
export const ComboDualAxis = {
  name: "Combo — Dual Axis",
  args: { type: "combo", colorMode: "palette", seriesCount: 2, showLegend: true, showRightAxis: true },
};
export const Donut = {
  name: "Donut",
  args: { type: "donut", colorMode: "palette", seriesCount: 4, showLegend: true },
};
export const DonutShades = {
  name: "Donut — Shades",
  args: { type: "donut", colorMode: "shades", seriesCount: 5, showLegend: true },
};
export const Radar = {
  name: "Radar",
  args: { type: "radar", colorMode: "single", seriesCount: 1, showPoints: true },
};
export const RadarMultiSeries = {
  name: "Radar — Multi-series",
  args: { type: "radar", colorMode: "palette", seriesCount: 3, showPoints: false, showLegend: true },
};
export const Scatter = {
  name: "Scatter",
  args: { type: "scatter", colorMode: "palette", seriesCount: 3, showLegend: true },
};
export const ScatterShades = {
  name: "Scatter — Shades",
  args: { type: "scatter", colorMode: "shades", seriesCount: 4, showLegend: true },
};
export const Candlestick = {
  name: "Candlestick",
  args: { type: "candlestick", showLegend: true },
};
export const Sparkline = {
  name: "Sparkline",
  args: { type: "sparkline", sparklineStyle: "line", showPoints: true },
};
export const SparklineArea = {
  name: "Sparkline — Area",
  args: { type: "sparkline", sparklineStyle: "area", showPoints: true },
};
export const SparklineBar = {
  name: "Sparkline — Bar",
  args: { type: "sparkline", sparklineStyle: "bar", showPoints: false },
};
export const HorizontalBar = {
  name: "Horizontal Bar (Ranked)",
  args: { type: "bar-horizontal", colorMode: "shades" },
};
export const HorizontalBarPalette = {
  name: "Horizontal Bar — Palette",
  args: { type: "bar-horizontal", colorMode: "palette" },
};
export const Pie = {
  name: "Pie",
  args: { type: "pie", colorMode: "palette", seriesCount: 4, showLegend: true },
};
export const PieShades = {
  name: "Pie — Shades",
  args: { type: "pie", colorMode: "shades", seriesCount: 5, showLegend: true },
};
export const Funnel = {
  name: "Funnel",
  args: { type: "funnel", colorMode: "shades", seriesCount: 4 },
};
export const FunnelPalette = {
  name: "Funnel — Palette",
  args: { type: "funnel", colorMode: "palette", seriesCount: 5 },
};
export const Radial = {
  name: "Radial Bar",
  args: { type: "radial", colorMode: "palette", seriesCount: 4, showLegend: true },
};
export const RadialShades = {
  name: "Radial Bar — Shades",
  args: { type: "radial", colorMode: "shades", seriesCount: 5, showLegend: true },
};
