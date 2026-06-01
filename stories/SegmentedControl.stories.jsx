import SegmentedControlPreview from "../src/components/previews/SegmentedControlPreview";
import { STORYBOOK_BRANDS } from "../src/data/storybookBrands";
import CodeBlock from "./components/CodeBlock";

function buildCode(args) {
  return `import { SegmentedControl } from "@mantine/core";

<SegmentedControl
  size="${args.size}"
  orientation="${args.orientation}"${args.fullWidth ? "\n  fullWidth" : ""}${args.disabled ? "\n  disabled" : ""}
  defaultValue="React"
  data={["React", "Angular", "Vue"]}
/>`;
}

export default {
  title: "Components/SegmentedControl",
  component: SegmentedControlPreview,
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    orientation: { control: "select", options: ["horizontal", "vertical"] },
    fullWidth: { control: "boolean" },
    disabled: { control: "boolean" },
    interactive: { control: "boolean" },
  },
  args: {
    size: "md",
    orientation: "horizontal",
    fullWidth: false,
    disabled: false,
    interactive: true,
  },
  render: (args, { globals }) => (
    <div>
      <SegmentedControlPreview
        brands={STORYBOOK_BRANDS}
        brandId={globals.brand || "theia"}
        size={args.size}
        orientation={args.orientation}
        fullWidth={args.fullWidth}
        interactive={args.interactive}
        state={args.disabled ? "disabled" : null}
      />
      <CodeBlock code={buildCode(args)} />
    </div>
  ),
};

export const Horizontal = { args: { orientation: "horizontal" } };
export const Vertical = { args: { orientation: "vertical" } };
export const FullWidth = { args: { fullWidth: true } };
export const Disabled = { args: { disabled: true } };
