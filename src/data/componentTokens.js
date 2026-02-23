export const TOKEN_TYPES = {
  COLOR: "COLOR",
  FLOAT: "FLOAT",
  STRING: "STRING",
};

export const COMPONENT_TOKENS = {
  button: {
    // ── FILLED COLOR TOKENS (all states) ──
    "button-filled-background":          { type: "COLOR", semantic: "interactive-primary",         figmaPath: "button/filled-background" },
    "button-filled-background-hover":    { type: "COLOR", semantic: "interactive-primary-hover",   figmaPath: "button/filled-background-hover" },
    "button-filled-background-focus":    { type: "COLOR", semantic: "interactive-primary",         figmaPath: "button/filled-background-focus" },
    "button-filled-background-pressed":  { type: "COLOR", semantic: "interactive-primary-pressed", figmaPath: "button/filled-background-pressed" },
    "button-filled-background-disabled": { type: "COLOR", semantic: "interactive-disabled",        figmaPath: "button/filled-background-disabled" },
    "button-filled-text":                { type: "COLOR", semantic: "text-on-interactive",         figmaPath: "button/filled-text" },
    "button-filled-text-hover":          { type: "COLOR", semantic: "text-on-interactive",         figmaPath: "button/filled-text-hover" },
    "button-filled-text-focus":          { type: "COLOR", semantic: "text-on-interactive",         figmaPath: "button/filled-text-focus" },
    "button-filled-text-pressed":        { type: "COLOR", semantic: "text-on-interactive",         figmaPath: "button/filled-text-pressed" },
    "button-filled-text-disabled":       { type: "COLOR", semantic: "text-disabled",               figmaPath: "button/filled-text-disabled" },
    "button-filled-border":              { type: "COLOR", semantic: null,                          figmaPath: "button/filled-border" },
    "button-filled-border-hover":        { type: "COLOR", semantic: null,                          figmaPath: "button/filled-border-hover" },
    "button-filled-border-focus":        { type: "COLOR", semantic: null,                          figmaPath: "button/filled-border-focus" },
    "button-filled-border-pressed":      { type: "COLOR", semantic: null,                          figmaPath: "button/filled-border-pressed" },
    "button-filled-border-disabled":     { type: "COLOR", semantic: null,                          figmaPath: "button/filled-border-disabled" },

    // ── OUTLINED COLOR TOKENS (all states) ──
    "button-outlined-background":          { type: "COLOR", semantic: "surface-default",             figmaPath: "button/outlined-background" },
    "button-outlined-background-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "button/outlined-background-hover" },
    "button-outlined-background-focus":    { type: "COLOR", semantic: "surface-default",             figmaPath: "button/outlined-background-focus" },
    "button-outlined-background-pressed":  { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "button/outlined-background-pressed" },
    "button-outlined-background-disabled": { type: "COLOR", semantic: "surface-default",             figmaPath: "button/outlined-background-disabled" },
    "button-outlined-text":                { type: "COLOR", semantic: "interactive-primary",          figmaPath: "button/outlined-text" },
    "button-outlined-text-hover":          { type: "COLOR", semantic: "interactive-primary",          figmaPath: "button/outlined-text-hover" },
    "button-outlined-text-focus":          { type: "COLOR", semantic: "interactive-primary",          figmaPath: "button/outlined-text-focus" },
    "button-outlined-text-pressed":        { type: "COLOR", semantic: "interactive-primary",          figmaPath: "button/outlined-text-pressed" },
    "button-outlined-text-disabled":       { type: "COLOR", semantic: "text-disabled",               figmaPath: "button/outlined-text-disabled" },
    "button-outlined-border":              { type: "COLOR", semantic: "interactive-primary",          figmaPath: "button/outlined-border" },
    "button-outlined-border-hover":        { type: "COLOR", semantic: "interactive-primary-hover",    figmaPath: "button/outlined-border-hover" },
    "button-outlined-border-focus":        { type: "COLOR", semantic: "interactive-primary",          figmaPath: "button/outlined-border-focus" },
    "button-outlined-border-pressed":      { type: "COLOR", semantic: "interactive-primary-pressed",  figmaPath: "button/outlined-border-pressed" },
    "button-outlined-border-disabled":     { type: "COLOR", semantic: "border-disabled",             figmaPath: "button/outlined-border-disabled" },

    // ── GHOST COLOR TOKENS (all states) ──
    "button-ghost-background":          { type: "COLOR", semantic: null,                          figmaPath: "button/ghost-background" },
    "button-ghost-background-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "button/ghost-background-hover" },
    "button-ghost-background-focus":    { type: "COLOR", semantic: null,                          figmaPath: "button/ghost-background-focus" },
    "button-ghost-background-pressed":  { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "button/ghost-background-pressed" },
    "button-ghost-background-disabled": { type: "COLOR", semantic: null,                          figmaPath: "button/ghost-background-disabled" },
    "button-ghost-text":                { type: "COLOR", semantic: "interactive-primary",          figmaPath: "button/ghost-text" },
    "button-ghost-text-hover":          { type: "COLOR", semantic: "interactive-primary",          figmaPath: "button/ghost-text-hover" },
    "button-ghost-text-focus":          { type: "COLOR", semantic: "interactive-primary",          figmaPath: "button/ghost-text-focus" },
    "button-ghost-text-pressed":        { type: "COLOR", semantic: "interactive-primary",          figmaPath: "button/ghost-text-pressed" },
    "button-ghost-text-disabled":       { type: "COLOR", semantic: "text-disabled",               figmaPath: "button/ghost-text-disabled" },
    "button-ghost-border":              { type: "COLOR", semantic: null,                          figmaPath: "button/ghost-border" },
    "button-ghost-border-hover":        { type: "COLOR", semantic: null,                          figmaPath: "button/ghost-border-hover" },
    "button-ghost-border-focus":        { type: "COLOR", semantic: null,                          figmaPath: "button/ghost-border-focus" },
    "button-ghost-border-pressed":      { type: "COLOR", semantic: null,                          figmaPath: "button/ghost-border-pressed" },
    "button-ghost-border-disabled":     { type: "COLOR", semantic: null,                          figmaPath: "button/ghost-border-disabled" },

    // ── SHARED COLOR TOKEN ──
    "button-focus-ring": { type: "COLOR", semantic: "border-focus", figmaPath: "button/focus-ring" },

    // ── FLOAT TOKENS (size variants: xs, sm, md, lg, xl) ──
    "button-padding-x":     { type: "FLOAT", unit: "px", sizes: { xs: 10, sm: 14, md: 18, lg: 22, xl: 28 },   figmaPath: "button/padding-x" },
    "button-padding-y":     { type: "FLOAT", unit: "px", sizes: { xs: 4,  sm: 6,  md: 8,  lg: 10, xl: 14 },   figmaPath: "button/padding-y" },
    "button-height":        { type: "FLOAT", unit: "px", sizes: { xs: 28, sm: 36, md: 42, lg: 50, xl: 60 },   figmaPath: "button/height" },
    "button-font-size":     { type: "FLOAT", unit: "px", sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 },   figmaPath: "button/font-size" },
    "button-line-height":   { type: "FLOAT", unit: "px", sizes: { xs: 14.4, sm: 16.8, md: 19.2, lg: 21.6, xl: 24 }, figmaPath: "button/line-height" },
    // ── FLOAT TOKENS (single value, shared across all sizes) ──
    "button-border-radius": { type: "FLOAT", unit: "px", value: 8,   figmaPath: "button/border-radius" },
    "button-border-width":  { type: "FLOAT", unit: "px", value: 1.5, figmaPath: "button/border-width" },

    // ── STRING TOKENS (single value) ──
    "button-font-weight":   { type: "STRING", value: "Semi Bold", figmaPath: "button/font-weight",
      allowedValues: ["Thin", "Extra Light", "Light", "Regular", "Medium", "Semi Bold", "Bold", "Extra Bold", "Black"] },
  },

  switch: {
    // ── COLOR TOKENS ──
    "switch-track-background":         { type: "COLOR", semantic: "surface-default",           figmaPath: "switch/track-background" },
    "switch-track-background-checked": { type: "COLOR", semantic: "interactive-primary",       figmaPath: "switch/track-background-checked" },
    "switch-track-background-hover":   { type: "COLOR", semantic: "interactive-secondary-hover",figmaPath: "switch/track-background-hover" },
    "switch-track-border":             { type: "COLOR", semantic: "border-default",            figmaPath: "switch/track-border" },
    "switch-thumb-background":         { type: "COLOR", semantic: "surface-default",           figmaPath: "switch/thumb-background" },

    // ── FLOAT TOKENS (size variants) ──
    "switch-width":         { type: "FLOAT", unit: "px", sizes: { sm: 34, md: 42, lg: 52 },  figmaPath: "switch/width" },
    "switch-height":        { type: "FLOAT", unit: "px", sizes: { sm: 18, md: 22, lg: 28 },  figmaPath: "switch/height" },
    "switch-thumb-size":    { type: "FLOAT", unit: "px", sizes: { sm: 14, md: 18, lg: 24 },  figmaPath: "switch/thumb-size" },
    "switch-border-radius": { type: "FLOAT", unit: "px", sizes: { sm: 9, md: 11, lg: 14 },   figmaPath: "switch/border-radius" },
  },
};

export const COMPONENT_NAMES = Object.keys(COMPONENT_TOKENS);

export const COMPONENT_SIZE_KEYS = {
  button: ["xs", "sm", "md", "lg", "xl"],
  switch: ["sm", "md", "lg"],
};

export function getColorTokens(componentName) {
  const tokens = COMPONENT_TOKENS[componentName];
  if (!tokens) return {};
  return Object.fromEntries(
    Object.entries(tokens).filter(([, def]) => def.type === TOKEN_TYPES.COLOR)
  );
}

export function getDimensionTokens(componentName) {
  const tokens = COMPONENT_TOKENS[componentName];
  if (!tokens) return {};
  return Object.fromEntries(
    Object.entries(tokens).filter(([, def]) => def.type === TOKEN_TYPES.FLOAT || def.type === TOKEN_TYPES.STRING)
  );
}
