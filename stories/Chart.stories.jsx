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
      strokeWidth={2} fill="var(--chart-series-1)" fillOpacity={0.2}
      dot={${args.showPoints ? "{ r: 3 }" : "false"}} />
  </AreaChart>`
    );
  }
  if (args.type === "line") {
    return wrap(
      "LineChart, Line, XAxis, YAxis, CartesianGrid",
      `  <LineChart data={data}>
${grid}${axes}    <Line type="monotone" dataKey="value" stroke="var(--chart-series-1)"
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
    type: { control: "select", options: ["bar", "line", "area", "stacked-bar", "combo", "donut"] },
    colorMode: { control: "select", options: ["single", "palette", "shades"] },
    seriesCount: { control: { type: "range", min: 1, max: 6, step: 1 } },
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
