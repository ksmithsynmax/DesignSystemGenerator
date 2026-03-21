import LoaderPreview from "../src/components/previews/LoaderPreview";
import { STORYBOOK_BRANDS } from "../src/data/storybookBrands";
import CodeBlock from "./components/CodeBlock";

function buildCode(args) {
  const props = [];
  props.push(`  type="${args.type}"`);
  props.push(`  size="${args.size}"`);

  return `import { Loader } from "@mantine/core";

<Loader
${props.join("\n")}
/>`;
}

export default {
  title: "Components/Loader",
  component: LoaderPreview,
  argTypes: {
    type: { control: "select", options: ["oval", "bars", "dots"] },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
  },
  args: {
    type: "oval",
    size: "md",
  },
  render: (args, { globals }) => (
    <div>
      <LoaderPreview
        brands={STORYBOOK_BRANDS}
        brandId={globals.brand || "theia"}
        {...args}
      />
      <CodeBlock code={buildCode(args)} />
    </div>
  ),
};

export const Oval = { args: { type: "oval" } };
export const Bars = { args: { type: "bars" } };
export const Dots = { args: { type: "dots" } };
