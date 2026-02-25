import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { STORYBOOK_BRANDS } from "../src/data/storybookBrands";

const brandItems = Object.entries(STORYBOOK_BRANDS).map(([id, brand]) => ({
  value: id,
  title: brand.name,
}));

export const globalTypes = {
  brand: {
    description: "Brand theme",
    toolbar: {
      title: "Brand",
      icon: "paintbrush",
      items: brandItems,
      dynamicTitle: true,
    },
  },
};

export const initialGlobals = {
  brand: Object.keys(STORYBOOK_BRANDS)[0] || "theia",
};

export const decorators = [
  (Story) => (
    <MantineProvider>
      <Story />
    </MantineProvider>
  ),
];
