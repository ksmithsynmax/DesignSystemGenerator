import ActionIconPreview from "../src/components/previews/ActionIconPreview";
import { STORYBOOK_BRANDS } from "../src/data/storybookBrands";
import CodeBlock from "./components/CodeBlock";

const VARIANT_MAP = {
  default: "default",
  filled: "filled",
  light: "light",
  outlined: "outline",
  transparent: "transparent",
};

function buildCode(args) {
  const mantineVariant = VARIANT_MAP[args.variant] || "default";
  const iconImport =
    args.iconName === "minus"
      ? 'import MinusIcon from "@untitledui-icons/react/line/MinusIcon";'
      : 'import CheckIcon from "@untitledui-icons/react/line/CheckIcon";';
  const iconTag = args.iconName === "minus" ? "<MinusIcon />" : "<CheckIcon />";
  return `import { ActionIcon } from "@mantine/core";
${iconImport}

<ActionIcon
  variant="${mantineVariant}"
  size="${args.size}"
  radius="${args.radius}"${args.disabled ? "\n  disabled" : ""}
>
  ${iconTag}
</ActionIcon>`;
}

export default {
  title: "Components/ActionIcon",
  component: ActionIconPreview,
  argTypes: {
    variant: { control: "select", options: ["default", "filled", "light", "outlined", "transparent"] },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    radius: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    iconName: { control: "select", options: ["check", "minus"] },
    disabled: { control: "boolean" },
  },
  args: {
    variant: "default",
    size: "sm",
    radius: "sm",
    iconName: "check",
    disabled: false,
  },
  render: (args, { globals }) => (
    <div>
      <ActionIconPreview
        brands={STORYBOOK_BRANDS}
        brandId={globals.brand || "theia"}
        variant={args.variant}
        size={args.size}
        radius={args.radius}
        iconName={args.iconName}
        state={args.disabled ? "disabled" : null}
      />
      <CodeBlock code={buildCode(args)} />
    </div>
  ),
};

export const Default = { args: { variant: "default" } };
export const Filled = { args: { variant: "filled" } };
export const Light = { args: { variant: "light" } };
export const Outlined = { args: { variant: "outlined" } };
export const Transparent = { args: { variant: "transparent" } };
