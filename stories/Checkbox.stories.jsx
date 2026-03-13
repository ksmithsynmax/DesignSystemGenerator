import CheckboxPreview from "../src/components/previews/CheckboxPreview";
import { STORYBOOK_BRANDS } from "../src/data/storybookBrands";
import CodeBlock from "./components/CodeBlock";

function buildCode(args) {
  const variant = args.variant === "outlined" ? "outline" : "filled";
  return `import { Checkbox } from "@mantine/core";

<Checkbox
  variant="${variant}"
  size="${args.size}"
  radius="${args.radius}"${args.checked ? "\n  defaultChecked" : ""}${args.indeterminate ? "\n  indeterminate" : ""}
  label="Checkbox"
/>`;
}

export default {
  title: "Components/Checkbox",
  component: CheckboxPreview,
  argTypes: {
    variant: { control: "select", options: ["filled", "outlined"] },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    radius: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    checked: { control: "boolean" },
    indeterminate: { control: "boolean" },
    readOnly: { control: "boolean" },
  },
  args: { variant: "filled", size: "md", radius: "md", checked: false, indeterminate: false, readOnly: false },
  render: (args, { globals }) => (
    <div>
      <CheckboxPreview
        brands={STORYBOOK_BRANDS}
        brandId={globals.brand || "theia"}
        {...args}
      />
      <CodeBlock code={buildCode(args)} />
    </div>
  ),
};

export const Unchecked = { args: { checked: false } };
export const Checked = { args: { checked: true } };
export const Indeterminate = { args: { indeterminate: true } };
export const Outlined = { args: { variant: "outlined", checked: true } };
