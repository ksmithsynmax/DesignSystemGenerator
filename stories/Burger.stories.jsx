import BurgerPreview from "../src/components/previews/BurgerPreview";
import { STORYBOOK_BRANDS } from "../src/data/storybookBrands";
import CodeBlock from "./components/CodeBlock";

function buildCode(args) {
  return `import { Burger } from "@mantine/core";

<Burger
  size="${args.size}"${args.opened ? "\n  opened" : ""}
  aria-label="Toggle navigation"
/>`;
}

export default {
  title: "Components/Burger",
  component: BurgerPreview,
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    opened: { control: "boolean" },
    readOnly: { control: "boolean" },
  },
  args: { size: "md", opened: false, readOnly: false },
  render: (args, { globals }) => (
    <div>
      <BurgerPreview
        brands={STORYBOOK_BRANDS}
        brandId={globals.brand || "theia"}
        {...args}
      />
      <CodeBlock code={buildCode(args)} />
    </div>
  ),
};

export const Closed = { args: { opened: false } };
export const Opened = { args: { opened: true } };
