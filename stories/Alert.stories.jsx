import AlertPreview from "../src/components/previews/AlertPreview";
import { STORYBOOK_BRANDS } from "../src/data/storybookBrands";
import CodeBlock from "./components/CodeBlock";

function buildCode(args) {
  const props = [];
  props.push(`  variant="${args.variant}"`);
  props.push(`  color="${args.color}"`);
  props.push(`  radius="${args.radius}"`);
  if (args.withCloseButton) props.push("  withCloseButton");
  if (args.withIcon) props.push("  icon={<IconInfoCircle />}");

  return `import { Alert } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

<Alert
${props.join("\n")}
  title="${args.title}"
>
  ${args.message}
</Alert>`;
}

export default {
  title: "Components/Alert",
  component: AlertPreview,
  argTypes: {
    variant: { control: "select", options: ["default", "filled", "light", "outline", "transparent", "white"] },
    color: { control: "select", options: ["blue", "teal", "red", "yellow", "gray"] },
    radius: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    withCloseButton: { control: "boolean" },
    withIcon: { control: "boolean" },
    title: { control: "text" },
    message: { control: "text" },
  },
  args: {
    variant: "light",
    color: "blue",
    radius: "md",
    withCloseButton: false,
    withIcon: true,
    title: "Alert title",
    message:
      "Lorem ipsum dolor sit, amet consectetur adipisicing elit. At officiis, quae tempore necessitatibus placeat saepe.",
  },
  render: (args, { globals }) => (
    <div>
      <AlertPreview
        brands={STORYBOOK_BRANDS}
        brandId={globals.brand || "theia"}
        {...args}
      />
      <CodeBlock code={buildCode(args)} />
    </div>
  ),
};

export const Light = { args: { variant: "light" } };
export const Filled = { args: { variant: "filled" } };
export const Outline = { args: { variant: "outline" } };
