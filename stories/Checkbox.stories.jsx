import CheckboxPreview from "../src/components/previews/CheckboxPreview";
import { STORYBOOK_BRANDS } from "../src/data/storybookBrands";
import CodeBlock from "./components/CodeBlock";

function buildCode(args) {
  return `import { Checkbox } from "@mantine/core";

<Checkbox
  size="${args.size}"${args.checked ? "\n  defaultChecked" : ""}${args.indeterminate ? "\n  indeterminate" : ""}
  label="Checkbox"
/>`;
}

export default {
  title: "Components/Checkbox",
  component: CheckboxPreview,
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    checked: { control: "boolean" },
    indeterminate: { control: "boolean" },
    readOnly: { control: "boolean" },
  },
  args: { size: "md", checked: false, indeterminate: false, readOnly: false },
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
