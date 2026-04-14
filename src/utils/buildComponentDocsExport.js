import { buildExportPayload } from "./buildExportPayload";
import { COMPONENT_TOKENS, TOKEN_TYPES } from "../data/componentTokens";

const INTERACTIVE_STATES = [
  "default",
  "hover",
  "focus",
  "pressed",
  "active",
  "disabled",
  "error",
  "visited",
  "checked",
  "indeterminate",
];

const EXTRA_FIGMA_PROPERTIES = {
  button: [
    { name: "Label", values: ["Any text"], notes: "Visible button label." },
    { name: "LeftIcon", values: ["ChevronLeft"], notes: "Icon glyph for left slot." },
    { name: "ShowLeftIcon", values: ["False", "True"], notes: "Left icon visibility toggle." },
    { name: "RightIcon", values: ["ChevronRight"], notes: "Icon glyph for right slot." },
    { name: "ShowRightIcon", values: ["False", "True"], notes: "Right icon visibility toggle." },
  ],
  actionicon: [
    { name: "Radius", values: ["Default", "Xs", "Sm", "Md", "Lg", "Xl"], notes: "Corner radius variant." },
  ],
  tabs: [
    { name: "Radius", values: ["Default", "Xs", "Sm", "Md", "Lg", "Xl"], notes: "Tab/list corner radius." },
    { name: "Orientation", values: ["Horizontal", "Vertical"], notes: "Layout direction." },
    { name: "WithPanel", values: ["Off", "On"], notes: "Tab panel content visibility." },
    { name: "LeftIcon", values: ["Off", "On"], notes: "Left icon visibility." },
    { name: "RightIcon", values: ["Off", "On"], notes: "Right icon visibility." },
  ],
  checkbox: [
    { name: "Checked", values: ["Unchecked", "Checked", "Indeterminate"], notes: "Selection state visual." },
  ],
  radio: [{ name: "Checked", values: ["Off", "On"], notes: "Selection state toggle." }],
  chip: [{ name: "Checked", values: ["Off", "On"], notes: "Selection state toggle." }],
  tooltip: [
    { name: "Position", values: ["Top", "Bottom", "Left", "Right"], notes: "Tooltip placement." },
    { name: "WithArrow", values: ["Off", "On"], notes: "Arrow pointer visibility." },
  ],
  notification: [
    { name: "WithBorder", values: ["Off", "On"], notes: "Border visibility." },
    { name: "WithCloseButton", values: ["Off", "On"], notes: "Close action visibility." },
    { name: "WithIcon", values: ["Off", "On"], notes: "Leading icon visibility." },
    { name: "Loading", values: ["Off", "On"], notes: "Loading visual state." },
  ],
  alert: [
    { name: "WithCloseButton", values: ["Off", "On"], notes: "Close action visibility." },
    { name: "WithIcon", values: ["Off", "On"], notes: "Leading icon visibility." },
  ],
  modal: [
    { name: "Centered", values: ["Off", "On"], notes: "Viewport centering." },
    { name: "WithOverlay", values: ["Off", "On"], notes: "Overlay visibility." },
    { name: "WithCloseButton", values: ["Off", "On"], notes: "Close icon visibility." },
  ],
  card: [
    { name: "Variant", values: ["Default", "Dark", "Outlined", "Brand", "Transparent"], notes: "Card visual style variant." },
    { name: "WithBorder", values: ["Off", "On"], notes: "Card border visibility." },
    { name: "WithShadow", values: ["Off", "On"], notes: "Shadow visibility." },
    { name: "ShowSection", values: ["Off", "On"], notes: "Media/section block visibility." },
  ],
  pill: [{ name: "WithRemoveButton", values: ["Off", "On"], notes: "Remove affordance visibility." }],
  badge: [
    { name: "Circle", values: ["Off", "On"], notes: "Circular badge mode." },
    { name: "FullWidth", values: ["Off", "On"], notes: "Stretch badge width." },
  ],
  textinput: [
    { name: "ShowLabel", values: ["Off", "On"], notes: "Label visibility." },
    { name: "WithAsterisk", values: ["Off", "On"], notes: "Required indicator visibility." },
    { name: "ShowError", values: ["Off", "On"], notes: "Error message visibility." },
  ],
  select: [
    { name: "ShowLabel", values: ["Off", "On"], notes: "Label visibility." },
    { name: "WithAsterisk", values: ["Off", "On"], notes: "Required indicator visibility." },
    { name: "ShowError", values: ["Off", "On"], notes: "Error message visibility." },
    { name: "Searchable", values: ["Off", "On"], notes: "Search field behavior." },
    { name: "Clearable", values: ["Off", "On"], notes: "Clear action visibility." },
  ],
};

function toTitleCase(value) {
  return String(value || "")
    .split(/[-_]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function fmt(value) {
  if (value == null) return "—";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : String(value);
  return String(value);
}

function collectVariants(componentName, tokenEntries) {
  const variants = new Set();
  tokenEntries.forEach(([tokenName]) => {
    if (!tokenName.startsWith(`${componentName}-`)) return;
    const rest = tokenName.slice(componentName.length + 1);
    const first = rest.split("-")[0];
    if (
      first &&
      !["focus", "color", "border", "font", "line", "padding", "height", "width", "icon", "size", "radius"].includes(first)
    ) {
      variants.add(first);
    }
  });
  return [...variants];
}

function collectStates(tokenEntries) {
  const states = new Set();
  tokenEntries.forEach(([tokenName]) => {
    INTERACTIVE_STATES.forEach((state) => {
      if (tokenName.endsWith(`-${state}`)) states.add(state);
    });
  });
  return [...states];
}

function buildOverviewText(componentName) {
  const label = toTitleCase(componentName);
  return `Guidelines for implementing ${label.toLowerCase()} consistently across the platform. Covers variants, sizing, state behavior, and usage patterns.`;
}

function pushPropertyTable(lines, componentName, variants, states, dimTokens) {
  const hasSize = dimTokens.some(([, def]) => def.sizes);
  lines.push("### Properties");
  lines.push("");
  lines.push("| Property | Values |");
  lines.push("|----------|--------|");
  if (hasSize) {
    const sizeDef = dimTokens.find(([, def]) => def.sizes);
    const sizes = sizeDef ? Object.keys(sizeDef[1].sizes || {}) : [];
    lines.push(`| Size | ${sizes.map(toTitleCase).join(", ")} |`);
  }
  if (states.length > 0) {
    lines.push(`| State | ${states.map(toTitleCase).join(", ")} |`);
  }
  if (variants.length > 0) {
    lines.push(`| Variant | ${variants.map(toTitleCase).join(", ")} |`);
  }
  (EXTRA_FIGMA_PROPERTIES[componentName] || []).forEach((row) => {
    lines.push(`| ${row.name} | ${row.values.join(", ")} |`);
  });
  lines.push("");
}

export function buildComponentDocsExport(brands) {
  const payload = buildExportPayload(brands, null);
  const brandIds = Object.keys(brands);
  const lines = [];

  lines.push("# Component Usage Guide");
  lines.push("");
  lines.push("Generated from current token configuration and export payload.");
  lines.push("Focus: component usage and Figma variant properties.");
  lines.push("");

  Object.entries(COMPONENT_TOKENS).forEach(([componentName, tokens]) => {
    lines.push(`## ${toTitleCase(componentName)}`);
    lines.push("");

    const tokenEntries = Object.entries(tokens);
    const colorTokens = tokenEntries.filter(([, def]) => def.type === TOKEN_TYPES.COLOR);
    const dimTokens = tokenEntries.filter(([, def]) => def.type !== TOKEN_TYPES.COLOR);
    const variants = collectVariants(componentName, colorTokens);
    const states = collectStates(colorTokens);
    lines.push("### Overview");
    lines.push("");
    lines.push(buildOverviewText(componentName));
    lines.push("");
    lines.push(`Exported brands: ${brandIds.join(", ")}`);
    lines.push("");

    pushPropertyTable(lines, componentName, variants, states, dimTokens);

    if (variants.length > 0) {
      lines.push("### Variants");
      lines.push("");
      lines.push("| Variant | Guidance |");
      lines.push("|---------|----------|");
      variants.forEach((variant) => {
        lines.push(`| ${toTitleCase(variant)} | Use this visual style when that level of emphasis is needed. |`);
      });
      lines.push("");
    }

    if (states.length > 0) {
      lines.push("### States");
      lines.push("");
      lines.push("| State | Guidance |");
      lines.push("|-------|----------|");
      states.forEach((state) => {
        lines.push(`| ${toTitleCase(state)} | Represents the ${state} interaction state in Figma variants. |`);
      });
      lines.push("");
    }

    const hasSize = dimTokens.some(([, def]) => def.sizes);
    if (hasSize) {
      const sizeDef = dimTokens.find(([, def]) => def.sizes);
      const sizes = sizeDef ? Object.keys(sizeDef[1].sizes || {}) : [];
      lines.push("### Size");
      lines.push("");
      lines.push(`Available sizes: ${sizes.map(toTitleCase).join(", ")}`);
      lines.push("");
    }

    if (componentName === "button") {
      lines.push("### Buttons with Icons");
      lines.push("");
      lines.push("- Left icon support via `LeftIcon` + `ShowLeftIcon`.");
      lines.push("- Right icon support via `RightIcon` + `ShowRightIcon`.");
      lines.push("");
    }

    lines.push("### Token Mapping");
    lines.push("");

    lines.push("| Token | Figma Path | Semantic/Type |");
    lines.push("|-------|------------|---------------|");
    colorTokens.forEach(([tokenName, def]) => {
      lines.push(`| ${tokenName} | \`${def.figmaPath}\` | ${def.semantic || "—"} |`);
    });
    dimTokens.forEach(([tokenName, def]) => {
      lines.push(`| ${tokenName} | \`${def.figmaPath}\` | ${def.type} |`);
    });
    lines.push("");

    lines.push("### Brand Preview Values (Light / Dark)");
    lines.push("");
    lines.push("| Token | Brand Values |");
    lines.push("|-------|--------------|");
    colorTokens.forEach(([, def]) => {
      const perBrand = brandIds
        .map((brandId) => {
          const token = payload[brandId]?.components?.[def.figmaPath];
          const light = token?.light?.value ?? token?.value;
          const dark = token?.dark?.value ?? token?.value;
          return `${brandId}: ${fmt(light)} / ${fmt(dark)}`;
        })
        .join("<br/>");
      lines.push(`| ${def.figmaPath} | ${perBrand} |`);
    });
    lines.push("");
  });

  return lines.join("\n");
}
