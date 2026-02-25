import TooltipPreview from "../src/components/previews/TooltipPreview";
import { STORYBOOK_BRANDS } from "../src/data/storybookBrands";
import CodeBlock from "./components/CodeBlock";

function buildCode(args) {
  return `import { Tooltip, Button } from "@mantine/core";

<Tooltip
  label="${args.label || "Tooltip text"}"
  position="${args.position}"${args.withArrow ? "\n  withArrow" : ""}${args.opened ? "\n  opened" : ""}
>
  <Button>Hover me</Button>
</Tooltip>`;
}

export default {
  title: "Components/Tooltip",
  component: TooltipPreview,
  argTypes: {
    position: { control: "select", options: ["top", "bottom", "left", "right"] },
    withArrow: { control: "boolean" },
    label: { control: "text" },
    opened: { control: "boolean" },
  },
  args: { position: "top", withArrow: true, label: "Tooltip text", opened: true },
  render: (args, { globals }) => (
    <div>
      <div style={{ padding: 80, display: "flex", justifyContent: "center" }}>
        <TooltipPreview
          brands={STORYBOOK_BRANDS}
          brandId={globals.brand || "theia"}
          {...args}
        />
      </div>
      <CodeBlock code={buildCode(args)} />
    </div>
  ),
};

export const Top = { args: { position: "top" } };
export const Bottom = { args: { position: "bottom" } };
export const Left = { args: { position: "left" } };
export const Right = { args: { position: "right" } };
