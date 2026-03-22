import ModalPreview from "../src/components/previews/ModalPreview";
import { STORYBOOK_BRANDS } from "../src/data/storybookBrands";
import CodeBlock from "./components/CodeBlock";

function buildCode(args) {
  const props = [];
  props.push("  opened");
  props.push("  onClose={() => {}}");
  props.push(`  size="${args.size}"`);
  props.push(`  radius="${args.radius}"`);
  props.push(`  title="${args.title}"`);
  if (!args.withCloseButton) props.push("  withCloseButton={false}");
  if (args.centered) props.push("  centered");

  return `import { Modal } from "@mantine/core";

<Modal
${props.join("\n")}
>
  ${args.body}
</Modal>`;
}

export default {
  title: "Components/Modal",
  component: ModalPreview,
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    radius: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    layout: { control: "select", options: ["basic", "actions-right", "centered-ack"] },
    withOverlay: { control: "boolean" },
    withCloseButton: { control: "boolean" },
    centered: { control: "boolean" },
    title: { control: "text" },
    body: { control: "text" },
  },
  args: {
    size: "md",
    radius: "md",
    layout: "basic",
    withOverlay: true,
    withCloseButton: true,
    centered: true,
    title: "Modal title",
    body: "This action cannot be undone. Please confirm you want to proceed.",
  },
  render: (args, { globals }) => (
    <div>
      <ModalPreview
        brands={STORYBOOK_BRANDS}
        brandId={globals.brand || "theia"}
        {...args}
      />
      <CodeBlock code={buildCode(args)} />
    </div>
  ),
};

export const Default = { args: {} };
export const WithoutOverlay = { args: { withOverlay: false } };
export const ActionsRight = { args: { layout: "actions-right" } };
export const CenteredAcknowledgement = { args: { layout: "centered-ack", withCloseButton: false } };
