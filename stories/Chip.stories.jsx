import ChipPreview from "../src/components/previews/ChipPreview";
import { STORYBOOK_BRANDS } from "../src/data/storybookBrands";
import CodeBlock from "./components/CodeBlock";

function buildCode(args) {
  return `import { Chip } from "@mantine/core";

<Chip
  variant="${args.variant}"
  size="${args.size}"
  radius="${args.radius}"${args.checked ? "\n  checked" : ""}
>
  ${args.label || "Chip"}
</Chip>`;
}

export default {
  title: "Components/Chip",
  component: ChipPreview,
  argTypes: {
    variant: { control: "select", options: ["filled", "light", "outline"] },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    radius: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    checked: { control: "boolean" },
    readOnly: { control: "boolean" },
    label: { control: "text" },
  },
  args: { variant: "filled", size: "sm", radius: "sm", checked: false, readOnly: false, label: "Chip" },
  render: (args, { globals }) => (
    <div>
      <ChipPreview
        brands={STORYBOOK_BRANDS}
        brandId={globals.brand || "theia"}
        {...args}
      />
      <CodeBlock code={buildCode(args)} />
    </div>
  ),
};

export const FilledUnchecked = { args: { variant: "filled", checked: false } };
export const FilledChecked = { args: { variant: "filled", checked: true } };
export const Light = { args: { variant: "light", checked: true } };
export const Outline = { args: { variant: "outline", checked: true } };
