import SwitchPreview from "../src/components/previews/SwitchPreview";
import { STORYBOOK_BRANDS } from "../src/data/storybookBrands";
import CodeBlock from "./components/CodeBlock";

function buildCode(args) {
  return `import { Switch } from "@mantine/core";

<Switch
  size="${args.size}"${args.checked ? "\n  defaultChecked" : ""}
/>`;
}

export default {
  title: "Components/Switch",
  component: SwitchPreview,
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    checked: { control: "boolean" },
    readOnly: { control: "boolean" },
  },
  args: { size: "md", checked: false, readOnly: false },
  render: (args, { globals }) => (
    <div>
      <SwitchPreview
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
