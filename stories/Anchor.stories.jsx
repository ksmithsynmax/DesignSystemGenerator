import AnchorPreview from "../src/components/previews/AnchorPreview";
import { STORYBOOK_BRANDS } from "../src/data/storybookBrands";
import CodeBlock from "./components/CodeBlock";

function buildCode(args) {
  const props = [];
  props.push(`  size="${args.size}"`);
  if (args.underline !== "always") props.push(`  underline="${args.underline}"`);
  props.push(`  href="${args.href || "#"}"`);

  return `import { Anchor } from "@mantine/core";

<Anchor
${props.join("\n")}
>
  ${args.text || "View documentation"}
</Anchor>`;
}

export default {
  title: "Components/Anchor",
  component: AnchorPreview,
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    underline: { control: "select", options: ["always", "hover", "never"] },
    weightMode: { control: "select", options: ["regular", "semibold", "bold"] },
    state: { control: "select", options: ["default", "hover", "visited", "disabled"] },
    href: { control: "text" },
    text: { control: "text" },
  },
  args: {
    size: "md",
    underline: "always",
    weightMode: "regular",
    state: "default",
    href: "#",
    text: "View documentation",
  },
  render: (args, { globals }) => (
    <div>
      <AnchorPreview
        brands={STORYBOOK_BRANDS}
        brandId={globals.brand || "theia"}
        {...args}
      />
      <CodeBlock code={buildCode(args)} />
    </div>
  ),
};

export const Default = { args: { state: "default" } };
export const Hover = { args: { state: "hover", underline: "hover" } };
export const Visited = { args: { state: "visited" } };
