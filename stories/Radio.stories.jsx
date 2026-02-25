import RadioPreview from "../src/components/previews/RadioPreview";
import { STORYBOOK_BRANDS } from "../src/data/storybookBrands";
import CodeBlock from "./components/CodeBlock";

function buildCode(args) {
  const mantineVariant = args.variant === "outline" ? "outline" : "filled";
  return `import { Radio } from "@mantine/core";

<Radio
  variant="${mantineVariant}"
  size="${args.size}"${args.label ? `\n  label="${args.label}"` : ""}${args.checked ? "\n  defaultChecked" : ""}
/>`;
}

export default {
  title: "Components/Radio",
  component: RadioPreview,
  argTypes: {
    variant: { control: "select", options: ["filled", "outline"] },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    checked: { control: "boolean" },
    readOnly: { control: "boolean" },
    label: { control: "text" },
  },
  args: { variant: "filled", size: "md", checked: true, readOnly: false, label: "Radio option" },
  render: (args, { globals }) => (
    <div>
      <RadioPreview
        brands={STORYBOOK_BRANDS}
        brandId={globals.brand || "theia"}
        {...args}
      />
      <CodeBlock code={buildCode(args)} />
    </div>
  ),
};

export const Filled = { args: { variant: "filled", checked: true } };
export const Outline = { args: { variant: "outline", checked: true } };
export const Unchecked = { args: { variant: "filled", checked: false } };
