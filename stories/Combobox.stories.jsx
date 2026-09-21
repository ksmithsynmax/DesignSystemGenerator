import ComboboxPreview from "../src/components/previews/ComboboxPreview";
import { STORYBOOK_BRANDS } from "../src/data/storybookBrands";
import CodeBlock from "./components/CodeBlock";

function buildCode(args) {
  const isGrid = args.variant === "grid";
  if (!isGrid) {
    return `import { Combobox, useCombobox } from "@mantine/core";

// List layout — simple text options. selection: ${args.selectionMode}
const store = useCombobox();

<Combobox store={store}>
  <Combobox.Target>{/* input / pills target */}</Combobox.Target>
  <Combobox.Dropdown>
    <Combobox.Options>
      {data.map((item) => (
        <Combobox.Option value={item} key={item}>
          {item}
        </Combobox.Option>
      ))}
    </Combobox.Options>
  </Combobox.Dropdown>
</Combobox>`;
  }
  return `import { Combobox, useCombobox } from "@mantine/core";

// Grid variant = a SLOT. The design system styles the row CONTAINER via tokens
// (background/hover/selected, divider, padding, radius); the dev renders ANY
// layout inside each row. selection: ${args.selectionMode}
const store = useCombobox();

<Combobox store={store}>
  <Combobox.Target>{/* input / pills target */}</Combobox.Target>
  <Combobox.Dropdown>
    <Combobox.Options>
      {rows.map((row) => (
        <Combobox.Option value={row.id} key={row.id}>
          <ComboboxRow>{/* ← your custom layout goes here */}</ComboboxRow>
        </Combobox.Option>
      ))}
    </Combobox.Options>
  </Combobox.Dropdown>
</Combobox>`;
}

export default {
  title: "Components/Combobox",
  component: ComboboxPreview,
  argTypes: {
    variant: { control: "select", options: ["list", "grid"] },
    selectionMode: { control: "inline-radio", options: ["single", "multi"] },
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
    variant: "list",
    selectionMode: "multi",
    size: "sm",
    radius: "sm",
    showLabel: true,
    labelText: "Label",
    withAsterisk: false,
    showError: false,
    errorText: "Error message",
    placeholder: "Search values",
    disabled: false,
  },
  render: (args, { globals }) => (
    <div>
      <div style={{ maxWidth: args.variant === "grid" ? 460 : 340 }}>
        <ComboboxPreview
          brands={STORYBOOK_BRANDS}
          brandId={globals.brand || "theia"}
          showDropdown
          interactive
          {...args}
        />
      </div>
      <CodeBlock code={buildCode(args)} />
    </div>
  ),
};

export const List = { args: { variant: "list" } };
// Grid is an empty, token-styled slot — the dev drops any component in each row.
export const GridEmptySlot = { args: { variant: "grid" } };
export const GridSingleSelect = { args: { variant: "grid", selectionMode: "single" } };
export const WithError = { args: { showError: true, errorText: "This field is required" } };
export const Disabled = { args: { disabled: true } };
