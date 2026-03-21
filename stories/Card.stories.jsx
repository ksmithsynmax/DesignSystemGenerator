import CardPreview from "../src/components/previews/CardPreview";
import { STORYBOOK_BRANDS } from "../src/data/storybookBrands";
import CodeBlock from "./components/CodeBlock";

function buildCode(args) {
  const props = [];
  props.push(`  padding="${args.size}"`);
  props.push(`  radius="${args.radius}"`);
  if (args.withBorder) props.push("  withBorder");
  if (args.withShadow) props.push('  shadow="sm"');

  const sectionCode = args.showSection
    ? `
  <Card.Section>
    {/* media/content section */}
  </Card.Section>`
    : "";
  const badgeCode = args.showBadge ? `<Badge>New</Badge>` : "";

  return `import { Badge, Card, Group, Text } from "@mantine/core";

<Card
${props.join("\n")}
>
${sectionCode}
  <Group justify="space-between">
    <Text fw={600}>${args.title}</Text>
    ${badgeCode}
  </Group>
  <Text>${args.description}</Text>
</Card>`;
}

export default {
  title: "Components/Card",
  component: CardPreview,
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    radius: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    withBorder: { control: "boolean" },
    withShadow: { control: "boolean" },
    showSection: { control: "boolean" },
    showBadge: { control: "boolean" },
    title: { control: "text" },
    description: { control: "text" },
  },
  args: {
    size: "md",
    radius: "md",
    withBorder: true,
    withShadow: false,
    showSection: true,
    showBadge: true,
    title: "PlanetScope vessel",
    description: "Detected vessel metadata and imagery details from latest satellite capture.",
  },
  render: (args, { globals }) => (
    <div>
      <CardPreview
        brands={STORYBOOK_BRANDS}
        brandId={globals.brand || "theia"}
        {...args}
      />
      <CodeBlock code={buildCode(args)} />
    </div>
  ),
};

export const Default = { args: {} };
export const Elevated = { args: { withShadow: true } };
export const Minimal = { args: { withBorder: false, showBadge: false, showSection: false } };
