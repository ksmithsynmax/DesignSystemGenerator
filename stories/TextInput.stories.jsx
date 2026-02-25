import TextInputPreview from "../src/components/previews/TextInputPreview";
import { STORYBOOK_BRANDS } from "../src/data/storybookBrands";
import CodeBlock from "./components/CodeBlock";

function buildCode(args) {
  const mantineVariant = args.variant === "filled" ? "filled" : "default";
  const props = [];
  props.push(`  variant="${mantineVariant}"`);
  props.push(`  size="${args.size}"`);
  props.push(`  radius="${args.radius}"`);
  if (args.showLabel && args.labelText) props.push(`  label="${args.labelText}"`);
  if (args.withAsterisk && args.showLabel) props.push("  withAsterisk");
  if (args.showError && args.errorText) props.push(`  error="${args.errorText}"`);
  props.push(`  placeholder="${args.placeholder || "Placeholder"}"`);
  if (args.disabled) props.push("  disabled");

  return `import { TextInput } from "@mantine/core";

<TextInput
${props.join("\n")}
/>`;
}

export default {
  title: "Components/TextInput",
  component: TextInputPreview,
  argTypes: {
    variant: { control: "select", options: ["default", "filled"] },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    radius: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    showLabel: { control: "boolean" },
    labelText: { control: "text" },
    withAsterisk: { control: "boolean" },
    showError: { control: "boolean" },
    errorText: { control: "text" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
  },
  args: {
    variant: "default",
    size: "sm",
    radius: "sm",
    showLabel: true,
    labelText: "Label",
    withAsterisk: false,
    showError: false,
    errorText: "Error message",
    placeholder: "Placeholder",
    disabled: false,
  },
  render: (args, { globals }) => (
    <div>
      <div style={{ maxWidth: 320 }}>
        <TextInputPreview
          brands={STORYBOOK_BRANDS}
          brandId={globals.brand || "theia"}
          {...args}
        />
      </div>
      <CodeBlock code={buildCode(args)} />
    </div>
  ),
};

export const Default = { args: { variant: "default" } };
export const Filled = { args: { variant: "filled" } };
export const WithError = { args: { showError: true, errorText: "This field is required" } };
export const Disabled = { args: { disabled: true } };
export const WithAsterisk = { args: { withAsterisk: true } };
