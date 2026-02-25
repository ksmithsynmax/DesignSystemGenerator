import ButtonPreview from "../src/components/previews/ButtonPreview";
import { STORYBOOK_BRANDS } from "../src/data/storybookBrands";
import CodeBlock from "./components/CodeBlock";

const VARIANT_MAP = { filled: "filled", outlined: "outline", ghost: "subtle" };

function buildCode(args) {
  const mantineVariant = VARIANT_MAP[args.variant] || "filled";
  return `import { Button } from "@mantine/core";

<Button
  variant="${mantineVariant}"
  size="${args.size}"
>
  Button
</Button>`;
}

export default {
  title: "Components/Button",
  component: ButtonPreview,
  argTypes: {
    variant: { control: "select", options: ["filled", "outlined", "ghost"] },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
  },
  args: { variant: "filled", size: "sm" },
  render: (args, { globals }) => (
    <div>
      <ButtonPreview
        brands={STORYBOOK_BRANDS}
        brandId={globals.brand || "theia"}
        {...args}
      />
      <CodeBlock code={buildCode(args)} />
    </div>
  ),
};

export const Filled = { args: { variant: "filled" } };
export const Outlined = { args: { variant: "outlined" } };
export const Ghost = { args: { variant: "ghost" } };
