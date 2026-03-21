import PillPreview from "../src/components/previews/PillPreview";
import { STORYBOOK_BRANDS } from "../src/data/storybookBrands";
import CodeBlock from "./components/CodeBlock";

function buildCode(args) {
  const props = [];
  props.push(`  size="${args.size}"`);
  if (args.withRemoveButton) props.push("  withRemoveButton");

  return `import { Pill } from "@mantine/core";

<Pill
${props.join("\n")}
>
  ${args.text || "React"}
</Pill>`;
}

export default {
  title: "Components/Pill",
  component: PillPreview,
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    withRemoveButton: { control: "boolean" },
    text: { control: "text" },
  },
  args: {
    size: "md",
    withRemoveButton: false,
    text: "React",
  },
  render: (args, { globals }) => (
    <div>
      <PillPreview
        brands={STORYBOOK_BRANDS}
        brandId={globals.brand || "theia"}
        {...args}
      />
      <CodeBlock code={buildCode(args)} />
    </div>
  ),
};

export const Default = { args: {} };
export const WithRemoveButton = { args: { withRemoveButton: true } };
