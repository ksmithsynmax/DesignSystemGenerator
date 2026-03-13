import TabsPreview from "../src/components/previews/TabsPreview";
import { STORYBOOK_BRANDS } from "../src/data/storybookBrands";
import CodeBlock from "./components/CodeBlock";

const VARIANT_MAP = {
  default: "default",
  outlined: "outline",
  pills: "pills",
};

function buildCode(args) {
  const mantineVariant = VARIANT_MAP[args.variant] || "default";
  const iconImports = args.showIcons
    ? `import Image01Icon from "@untitledui-icons/react/line/Image01Icon";
import MessageCircle01Icon from "@untitledui-icons/react/line/MessageCircle01Icon";
import Settings01Icon from "@untitledui-icons/react/line/Settings01Icon";
`
    : "";
  const tabLines = args.showIcons
    ? `    <Tabs.Tab value="overview" leftSection={<Image01Icon size={14} />}>Overview</Tabs.Tab>
    <Tabs.Tab value="details" leftSection={<MessageCircle01Icon size={14} />}>Details</Tabs.Tab>
    <Tabs.Tab value="settings" leftSection={<Settings01Icon size={14} />}>Settings</Tabs.Tab>`
    : `    <Tabs.Tab value="overview">Overview</Tabs.Tab>
    <Tabs.Tab value="details">Details</Tabs.Tab>
    <Tabs.Tab value="settings">Settings</Tabs.Tab>`;
  const panelLines = args.showPanel
    ? `
  <Tabs.Panel value="overview">Overview content</Tabs.Panel>
  <Tabs.Panel value="details">Details content</Tabs.Panel>
  <Tabs.Panel value="settings">Settings content</Tabs.Panel>`
    : "";
  return `import { Tabs } from "@mantine/core";
${iconImports}

<Tabs
  variant="${mantineVariant}"
  orientation="${args.orientation}"
  radius="${args.radius}"
>
  <Tabs.List>
${tabLines.replace(
    '<Tabs.Tab value="settings"',
    '<Tabs.Tab value="settings" disabled'
  )}
  </Tabs.List>
${panelLines}
</Tabs>`;
}

export default {
  title: "Components/Tabs",
  component: TabsPreview,
  argTypes: {
    variant: { control: "select", options: ["default", "outlined", "pills"] },
    radius: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    orientation: { control: "select", options: ["horizontal", "vertical"] },
    showPanel: { control: "boolean" },
    showIcons: { control: "boolean" },
    interactive: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    variant: "default",
    radius: "sm",
    orientation: "horizontal",
    showPanel: false,
    showIcons: false,
    interactive: false,
    disabled: false,
  },
  render: (args, { globals }) => (
    <div>
      <TabsPreview
        brands={STORYBOOK_BRANDS}
        brandId={globals.brand || "theia"}
        variant={args.variant}
        radius={args.radius}
        orientation={args.orientation}
        showPanel={args.showPanel}
        showIcons={args.showIcons}
        interactive={args.interactive}
        state={args.disabled ? "disabled" : null}
      />
      <CodeBlock code={buildCode(args)} />
    </div>
  ),
};

export const Default = { args: { variant: "default" } };
export const Outlined = { args: { variant: "outlined" } };
export const Pills = { args: { variant: "pills" } };
export const Vertical = { args: { orientation: "vertical" } };
