import BadgePreview from "../src/components/previews/BadgePreview";
import { STORYBOOK_BRANDS } from "../src/data/storybookBrands";
import CodeBlock from "./components/CodeBlock";

function buildCode(args) {
  const props = [];
  props.push(`  variant="${args.variant}"`);
  props.push(`  size="${args.size}"`);
  props.push(`  radius="${args.radius}"`);
  if (args.circle) props.push("  circle");
  if (args.fullWidth) props.push("  fullWidth");

  return `import { Badge } from "@mantine/core";

<Badge
${props.join("\n")}
>
  ${args.text || "Badge"}
</Badge>`;
}

export default {
  title: "Components/Badge",
  component: BadgePreview,
  argTypes: {
    variant: { control: "select", options: ["filled", "light", "outline", "dot"] },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    radius: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    circle: { control: "boolean" },
    fullWidth: { control: "boolean" },
    text: { control: "text" },
  },
  args: {
    variant: "filled",
    size: "md",
    radius: "md",
    circle: false,
    fullWidth: false,
    text: "Badge",
  },
  render: (args, { globals }) => (
    <div style={{ width: 260 }}>
      <BadgePreview
        brands={STORYBOOK_BRANDS}
        brandId={globals.brand || "theia"}
        {...args}
      />
      <CodeBlock code={buildCode(args)} />
    </div>
  ),
};

export const Filled = { args: { variant: "filled" } };
export const Light = { args: { variant: "light" } };
export const Outline = { args: { variant: "outline" } };
export const Dot = { args: { variant: "dot" } };
