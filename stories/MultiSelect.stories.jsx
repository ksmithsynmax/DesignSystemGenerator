import MultiSelectPreview from "../src/components/previews/MultiSelectPreview";
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
  props.push(`  placeholder="${args.placeholder || "Pick options"}"`);
  if (args.searchable) props.push("  searchable");
  if (args.clearable) props.push("  clearable");
  if (args.disabled) props.push("  disabled");

  return `import { MultiSelect } from "@mantine/core";

<MultiSelect
${props.join("\n")}
  defaultValue={["Option one", "Option two"]}
  data={["Option one", "Option two", "Option three"]}
/>`;
}

export default {
  title: "Components/MultiSelect",
  component: MultiSelectPreview,
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
    searchable: { control: "boolean" },
    clearable: { control: "boolean" },
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
    placeholder: "Pick options",
    searchable: false,
    clearable: false,
    disabled: false,
  },
  render: (args, { globals }) => (
    <div>
      <div style={{ maxWidth: 320 }}>
        <MultiSelectPreview
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
export const Searchable = { args: { searchable: true } };
