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

  actionicon: {
    // ── DEFAULT VARIANT (all states) ──
    "actionicon-default-background":          { type: "COLOR", semantic: "surface-default",             figmaPath: "actionicon/default-background" },
    "actionicon-default-background-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "actionicon/default-background-hover" },
    "actionicon-default-background-focus":    { type: "COLOR", semantic: "surface-default",             figmaPath: "actionicon/default-background-focus" },
    "actionicon-default-background-pressed":  { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "actionicon/default-background-pressed" },
    "actionicon-default-background-disabled": { type: "COLOR", semantic: "interactive-disabled",        figmaPath: "actionicon/default-background-disabled" },
    "actionicon-default-icon":                { type: "COLOR", semantic: "text-default",                figmaPath: "actionicon/default-icon" },
    "actionicon-default-icon-hover":          { type: "COLOR", semantic: "text-default",                figmaPath: "actionicon/default-icon-hover" },
    "actionicon-default-icon-focus":          { type: "COLOR", semantic: "text-default",                figmaPath: "actionicon/default-icon-focus" },
    "actionicon-default-icon-pressed":        { type: "COLOR", semantic: "text-default",                figmaPath: "actionicon/default-icon-pressed" },
    "actionicon-default-icon-disabled":       { type: "COLOR", semantic: "text-disabled",               figmaPath: "actionicon/default-icon-disabled" },
    "actionicon-default-border":              { type: "COLOR", semantic: "border-default",              figmaPath: "actionicon/default-border" },
    "actionicon-default-border-hover":        { type: "COLOR", semantic: "border-default",              figmaPath: "actionicon/default-border-hover" },
    "actionicon-default-border-focus":        { type: "COLOR", semantic: "border-focus",                figmaPath: "actionicon/default-border-focus" },
    "actionicon-default-border-pressed":      { type: "COLOR", semantic: "border-default",              figmaPath: "actionicon/default-border-pressed" },
    "actionicon-default-border-disabled":     { type: "COLOR", semantic: "border-disabled",             figmaPath: "actionicon/default-border-disabled" },

    // ── FILLED VARIANT (all states) ──
    "actionicon-filled-background":          { type: "COLOR", semantic: "interactive-primary",         figmaPath: "actionicon/filled-background" },
    "actionicon-filled-background-hover":    { type: "COLOR", semantic: "interactive-primary-hover",   figmaPath: "actionicon/filled-background-hover" },
    "actionicon-filled-background-focus":    { type: "COLOR", semantic: "interactive-primary",         figmaPath: "actionicon/filled-background-focus" },
    "actionicon-filled-background-pressed":  { type: "COLOR", semantic: "interactive-primary-pressed", figmaPath: "actionicon/filled-background-pressed" },
    "actionicon-filled-background-disabled": { type: "COLOR", semantic: "interactive-disabled",        figmaPath: "actionicon/filled-background-disabled" },
    "actionicon-filled-icon":                { type: "COLOR", semantic: "text-on-interactive",         figmaPath: "actionicon/filled-icon" },
    "actionicon-filled-icon-hover":          { type: "COLOR", semantic: "text-on-interactive",         figmaPath: "actionicon/filled-icon-hover" },
    "actionicon-filled-icon-focus":          { type: "COLOR", semantic: "text-on-interactive",         figmaPath: "actionicon/filled-icon-focus" },
    "actionicon-filled-icon-pressed":        { type: "COLOR", semantic: "text-on-interactive",         figmaPath: "actionicon/filled-icon-pressed" },
    "actionicon-filled-icon-disabled":       { type: "COLOR", semantic: "text-disabled",               figmaPath: "actionicon/filled-icon-disabled" },
    "actionicon-filled-border":              { type: "COLOR", semantic: null,                          figmaPath: "actionicon/filled-border" },
    "actionicon-filled-border-hover":        { type: "COLOR", semantic: null,                          figmaPath: "actionicon/filled-border-hover" },
    "actionicon-filled-border-focus":        { type: "COLOR", semantic: null,                          figmaPath: "actionicon/filled-border-focus" },
    "actionicon-filled-border-pressed":      { type: "COLOR", semantic: null,                          figmaPath: "actionicon/filled-border-pressed" },
    "actionicon-filled-border-disabled":     { type: "COLOR", semantic: null,                          figmaPath: "actionicon/filled-border-disabled" },

    // ── LIGHT VARIANT (all states) ──
    "actionicon-light-background":          { type: "COLOR", semantic: "interactive-secondary",       figmaPath: "actionicon/light-background" },
    "actionicon-light-background-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "actionicon/light-background-hover" },
    "actionicon-light-background-focus":    { type: "COLOR", semantic: "interactive-secondary",       figmaPath: "actionicon/light-background-focus" },
    "actionicon-light-background-pressed":  { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "actionicon/light-background-pressed" },
    "actionicon-light-background-disabled": { type: "COLOR", semantic: "interactive-disabled",        figmaPath: "actionicon/light-background-disabled" },
    "actionicon-light-icon":                { type: "COLOR", semantic: "interactive-primary",         figmaPath: "actionicon/light-icon" },
    "actionicon-light-icon-hover":          { type: "COLOR", semantic: "interactive-primary",         figmaPath: "actionicon/light-icon-hover" },
    "actionicon-light-icon-focus":          { type: "COLOR", semantic: "interactive-primary",         figmaPath: "actionicon/light-icon-focus" },
    "actionicon-light-icon-pressed":        { type: "COLOR", semantic: "interactive-primary",         figmaPath: "actionicon/light-icon-pressed" },
    "actionicon-light-icon-disabled":       { type: "COLOR", semantic: "text-disabled",               figmaPath: "actionicon/light-icon-disabled" },
    "actionicon-light-border":              { type: "COLOR", semantic: null,                          figmaPath: "actionicon/light-border" },
    "actionicon-light-border-hover":        { type: "COLOR", semantic: null,                          figmaPath: "actionicon/light-border-hover" },
    "actionicon-light-border-focus":        { type: "COLOR", semantic: null,                          figmaPath: "actionicon/light-border-focus" },
    "actionicon-light-border-pressed":      { type: "COLOR", semantic: null,                          figmaPath: "actionicon/light-border-pressed" },
    "actionicon-light-border-disabled":     { type: "COLOR", semantic: null,                          figmaPath: "actionicon/light-border-disabled" },

    // ── OUTLINED VARIANT (all states) ──
    "actionicon-outlined-background":          { type: "COLOR", semantic: "surface-default",             figmaPath: "actionicon/outlined-background" },
    "actionicon-outlined-background-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "actionicon/outlined-background-hover" },
    "actionicon-outlined-background-focus":    { type: "COLOR", semantic: "surface-default",             figmaPath: "actionicon/outlined-background-focus" },
    "actionicon-outlined-background-pressed":  { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "actionicon/outlined-background-pressed" },
    "actionicon-outlined-background-disabled": { type: "COLOR", semantic: "surface-default",             figmaPath: "actionicon/outlined-background-disabled" },
    "actionicon-outlined-icon":                { type: "COLOR", semantic: "interactive-primary",          figmaPath: "actionicon/outlined-icon" },
    "actionicon-outlined-icon-hover":          { type: "COLOR", semantic: "interactive-primary",          figmaPath: "actionicon/outlined-icon-hover" },
    "actionicon-outlined-icon-focus":          { type: "COLOR", semantic: "interactive-primary",          figmaPath: "actionicon/outlined-icon-focus" },
    "actionicon-outlined-icon-pressed":        { type: "COLOR", semantic: "interactive-primary",          figmaPath: "actionicon/outlined-icon-pressed" },
    "actionicon-outlined-icon-disabled":       { type: "COLOR", semantic: "text-disabled",               figmaPath: "actionicon/outlined-icon-disabled" },
    "actionicon-outlined-border":              { type: "COLOR", semantic: "interactive-primary",          figmaPath: "actionicon/outlined-border" },
    "actionicon-outlined-border-hover":        { type: "COLOR", semantic: "interactive-primary-hover",    figmaPath: "actionicon/outlined-border-hover" },
    "actionicon-outlined-border-focus":        { type: "COLOR", semantic: "interactive-primary",          figmaPath: "actionicon/outlined-border-focus" },
    "actionicon-outlined-border-pressed":      { type: "COLOR", semantic: "interactive-primary-pressed",  figmaPath: "actionicon/outlined-border-pressed" },
    "actionicon-outlined-border-disabled":     { type: "COLOR", semantic: "border-disabled",             figmaPath: "actionicon/outlined-border-disabled" },

    // ── TRANSPARENT VARIANT (all states) ──
    "actionicon-transparent-background":          { type: "COLOR", semantic: null,                          figmaPath: "actionicon/transparent-background" },
    "actionicon-transparent-background-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "actionicon/transparent-background-hover" },
    "actionicon-transparent-background-focus":    { type: "COLOR", semantic: null,                          figmaPath: "actionicon/transparent-background-focus" },
    "actionicon-transparent-background-pressed":  { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "actionicon/transparent-background-pressed" },
    "actionicon-transparent-background-disabled": { type: "COLOR", semantic: null,                          figmaPath: "actionicon/transparent-background-disabled" },
    "actionicon-transparent-icon":                { type: "COLOR", semantic: "interactive-primary",          figmaPath: "actionicon/transparent-icon" },
    "actionicon-transparent-icon-hover":          { type: "COLOR", semantic: "interactive-primary",          figmaPath: "actionicon/transparent-icon-hover" },
    "actionicon-transparent-icon-focus":          { type: "COLOR", semantic: "interactive-primary",          figmaPath: "actionicon/transparent-icon-focus" },
    "actionicon-transparent-icon-pressed":        { type: "COLOR", semantic: "interactive-primary",          figmaPath: "actionicon/transparent-icon-pressed" },
    "actionicon-transparent-icon-disabled":       { type: "COLOR", semantic: "text-disabled",               figmaPath: "actionicon/transparent-icon-disabled" },
    "actionicon-transparent-border":              { type: "COLOR", semantic: null,                          figmaPath: "actionicon/transparent-border" },
    "actionicon-transparent-border-hover":        { type: "COLOR", semantic: null,                          figmaPath: "actionicon/transparent-border-hover" },
    "actionicon-transparent-border-focus":        { type: "COLOR", semantic: null,                          figmaPath: "actionicon/transparent-border-focus" },
    "actionicon-transparent-border-pressed":      { type: "COLOR", semantic: null,                          figmaPath: "actionicon/transparent-border-pressed" },
    "actionicon-transparent-border-disabled":     { type: "COLOR", semantic: null,                          figmaPath: "actionicon/transparent-border-disabled" },

    // ── SHARED COLOR TOKEN ──
    "actionicon-focus-ring": { type: "COLOR", semantic: "border-focus", figmaPath: "actionicon/focus-ring" },

    // ── FLOAT TOKENS (size variants: xs, sm, md, lg, xl) ──
    "actionicon-size":      { type: "FLOAT", unit: "px", sizes: { xs: 28, sm: 32, md: 36, lg: 42, xl: 48 }, figmaPath: "actionicon/size" },
    "actionicon-icon-size": { type: "FLOAT", unit: "px", sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 }, figmaPath: "actionicon/icon-size" },
    "actionicon-radius":    { type: "FLOAT", unit: "px", sizes: { xs: 2, sm: 4, md: 8, lg: 16, xl: 32 },    figmaPath: "actionicon/radius" },

    // ── FLOAT TOKENS (single value, shared across all sizes) ──
    "actionicon-border-width": { type: "FLOAT", unit: "px", value: 1.5, figmaPath: "actionicon/border-width" },
  },

  tabs: {
    // ── DEFAULT VARIANT ──
    "tabs-default-list-background": { type: "COLOR", semantic: "surface-default", figmaPath: "tabs/default-list-background" },
    "tabs-default-list-border": { type: "COLOR", semantic: "border-default", figmaPath: "tabs/default-list-border" },
    "tabs-default-tab-background": { type: "COLOR", semantic: "surface-default", figmaPath: "tabs/default-tab-background" },
    "tabs-default-tab-background-hover": { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "tabs/default-tab-background-hover" },
    "tabs-default-tab-background-active": { type: "COLOR", semantic: "surface-default", figmaPath: "tabs/default-tab-background-active" },
    "tabs-default-tab-background-pressed": { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "tabs/default-tab-background-pressed" },
    "tabs-default-tab-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "tabs/default-tab-background-disabled" },
    "tabs-default-tab-text": { type: "COLOR", semantic: "text-default", figmaPath: "tabs/default-tab-text" },
    "tabs-default-tab-text-hover": { type: "COLOR", semantic: "text-default", figmaPath: "tabs/default-tab-text-hover" },
    "tabs-default-tab-text-active": { type: "COLOR", semantic: "interactive-primary", figmaPath: "tabs/default-tab-text-active" },
    "tabs-default-tab-text-pressed": { type: "COLOR", semantic: "interactive-primary", figmaPath: "tabs/default-tab-text-pressed" },
    "tabs-default-tab-text-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "tabs/default-tab-text-disabled" },
    "tabs-default-tab-border": { type: "COLOR", semantic: "border-subtle", figmaPath: "tabs/default-tab-border" },
    "tabs-default-tab-border-hover": { type: "COLOR", semantic: "border-default", figmaPath: "tabs/default-tab-border-hover" },
    "tabs-default-tab-border-active": { type: "COLOR", semantic: "interactive-primary", figmaPath: "tabs/default-tab-border-active" },
    "tabs-default-tab-border-pressed": { type: "COLOR", semantic: "interactive-primary", figmaPath: "tabs/default-tab-border-pressed" },
    "tabs-default-tab-border-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "tabs/default-tab-border-disabled" },

    // ── OUTLINED VARIANT ──
    "tabs-outlined-list-background": { type: "COLOR", semantic: "surface-default", figmaPath: "tabs/outlined-list-background" },
    "tabs-outlined-list-border": { type: "COLOR", semantic: "border-default", figmaPath: "tabs/outlined-list-border" },
    "tabs-outlined-tab-background": { type: "COLOR", semantic: "surface-default", figmaPath: "tabs/outlined-tab-background" },
    "tabs-outlined-tab-background-hover": { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "tabs/outlined-tab-background-hover" },
    "tabs-outlined-tab-background-active": { type: "COLOR", semantic: "surface-default", figmaPath: "tabs/outlined-tab-background-active" },
    "tabs-outlined-tab-background-pressed": { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "tabs/outlined-tab-background-pressed" },
    "tabs-outlined-tab-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "tabs/outlined-tab-background-disabled" },
    "tabs-outlined-tab-text": { type: "COLOR", semantic: "text-default", figmaPath: "tabs/outlined-tab-text" },
    "tabs-outlined-tab-text-hover": { type: "COLOR", semantic: "interactive-primary", figmaPath: "tabs/outlined-tab-text-hover" },
    "tabs-outlined-tab-text-active": { type: "COLOR", semantic: "interactive-primary", figmaPath: "tabs/outlined-tab-text-active" },
    "tabs-outlined-tab-text-pressed": { type: "COLOR", semantic: "interactive-primary", figmaPath: "tabs/outlined-tab-text-pressed" },
    "tabs-outlined-tab-text-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "tabs/outlined-tab-text-disabled" },
    "tabs-outlined-tab-border": { type: "COLOR", semantic: "border-default", figmaPath: "tabs/outlined-tab-border" },
    "tabs-outlined-tab-border-hover": { type: "COLOR", semantic: "border-default", figmaPath: "tabs/outlined-tab-border-hover" },
    "tabs-outlined-tab-border-active": { type: "COLOR", semantic: "interactive-primary", figmaPath: "tabs/outlined-tab-border-active" },
    "tabs-outlined-tab-border-pressed": { type: "COLOR", semantic: "interactive-primary", figmaPath: "tabs/outlined-tab-border-pressed" },
    "tabs-outlined-tab-border-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "tabs/outlined-tab-border-disabled" },

    // ── PILLS VARIANT ──
    "tabs-pills-list-background": { type: "COLOR", semantic: "surface-default", figmaPath: "tabs/pills-list-background" },
    "tabs-pills-list-border": { type: "COLOR", semantic: "border-subtle", figmaPath: "tabs/pills-list-border" },
    "tabs-pills-tab-background": { type: "COLOR", semantic: "surface-default", figmaPath: "tabs/pills-tab-background" },
    "tabs-pills-tab-background-hover": { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "tabs/pills-tab-background-hover" },
    "tabs-pills-tab-background-active": { type: "COLOR", semantic: "interactive-primary", figmaPath: "tabs/pills-tab-background-active" },
    "tabs-pills-tab-background-pressed": { type: "COLOR", semantic: "interactive-primary-pressed", figmaPath: "tabs/pills-tab-background-pressed" },
    "tabs-pills-tab-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "tabs/pills-tab-background-disabled" },
    "tabs-pills-tab-text": { type: "COLOR", semantic: "text-default", figmaPath: "tabs/pills-tab-text" },
    "tabs-pills-tab-text-hover": { type: "COLOR", semantic: "interactive-primary", figmaPath: "tabs/pills-tab-text-hover" },
    "tabs-pills-tab-text-active": { type: "COLOR", semantic: "text-on-interactive", figmaPath: "tabs/pills-tab-text-active" },
    "tabs-pills-tab-text-pressed": { type: "COLOR", semantic: "text-on-interactive", figmaPath: "tabs/pills-tab-text-pressed" },
    "tabs-pills-tab-text-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "tabs/pills-tab-text-disabled" },
    "tabs-pills-tab-border": { type: "COLOR", semantic: "border-subtle", figmaPath: "tabs/pills-tab-border" },
    "tabs-pills-tab-border-hover": { type: "COLOR", semantic: "border-default", figmaPath: "tabs/pills-tab-border-hover" },
    "tabs-pills-tab-border-active": { type: "COLOR", semantic: "interactive-primary", figmaPath: "tabs/pills-tab-border-active" },
    "tabs-pills-tab-border-pressed": { type: "COLOR", semantic: "interactive-primary", figmaPath: "tabs/pills-tab-border-pressed" },
    "tabs-pills-tab-border-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "tabs/pills-tab-border-disabled" },

    // ── SHARED COLOR TOKEN ──
    "tabs-focus-ring": { type: "COLOR", semantic: "border-focus", figmaPath: "tabs/focus-ring" },

    // ── FLOAT TOKENS ──
    "tabs-radius": { type: "FLOAT", unit: "px", sizes: { xs: 2, sm: 4, md: 8, lg: 16, xl: 32 }, figmaPath: "tabs/radius" },
    "tabs-font-size": { type: "FLOAT", unit: "px", value: 14, figmaPath: "tabs/font-size" },
    "tabs-tab-padding-x": { type: "FLOAT", unit: "px", value: 12, figmaPath: "tabs/tab-padding-x" },
    "tabs-tab-padding-y": { type: "FLOAT", unit: "px", value: 8, figmaPath: "tabs/tab-padding-y" },
    "tabs-list-gap": { type: "FLOAT", unit: "px", value: 8, figmaPath: "tabs/list-gap" },
    "tabs-list-border-width": { type: "FLOAT", unit: "px", value: 1, figmaPath: "tabs/list-border-width" },
    "tabs-tab-border-width": { type: "FLOAT", unit: "px", value: 1, figmaPath: "tabs/tab-border-width" },
    "tabs-panel-padding": { type: "FLOAT", unit: "px", value: 12, figmaPath: "tabs/panel-padding" },
    "tabs-icon-size": { type: "FLOAT", unit: "px", value: 16, figmaPath: "tabs/icon-size" },
    "tabs-icon-gap": { type: "FLOAT", unit: "px", value: 8, figmaPath: "tabs/icon-gap" },
  },

  switch: {
    // ── TRACK BACKGROUND — UNCHECKED (per state) ──
    "switch-track-background":          { type: "COLOR", semantic: "surface-default",            figmaPath: "switch/track-background" },
    "switch-track-background-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "switch/track-background-hover" },
    "switch-track-background-focus":    { type: "COLOR", semantic: "surface-default",            figmaPath: "switch/track-background-focus" },
    "switch-track-background-pressed":  { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "switch/track-background-pressed" },
    "switch-track-background-disabled": { type: "COLOR", semantic: "interactive-disabled",        figmaPath: "switch/track-background-disabled" },

    // ── TRACK BACKGROUND — CHECKED (per state) ──
    "switch-track-background-checked":          { type: "COLOR", semantic: "interactive-primary",         figmaPath: "switch/track-background-checked" },
    "switch-track-background-checked-hover":    { type: "COLOR", semantic: "interactive-primary-hover",   figmaPath: "switch/track-background-checked-hover" },
    "switch-track-background-checked-focus":    { type: "COLOR", semantic: "interactive-primary",         figmaPath: "switch/track-background-checked-focus" },
    "switch-track-background-checked-pressed":  { type: "COLOR", semantic: "interactive-primary-pressed", figmaPath: "switch/track-background-checked-pressed" },
    "switch-track-background-checked-disabled": { type: "COLOR", semantic: "interactive-disabled",        figmaPath: "switch/track-background-checked-disabled" },

    // ── TRACK BORDER (per state) ──
    "switch-track-border":          { type: "COLOR", semantic: "border-default",  figmaPath: "switch/track-border" },
    "switch-track-border-hover":    { type: "COLOR", semantic: "border-default",  figmaPath: "switch/track-border-hover" },
    "switch-track-border-focus":    { type: "COLOR", semantic: "border-default",  figmaPath: "switch/track-border-focus" },
    "switch-track-border-pressed":  { type: "COLOR", semantic: "border-default",  figmaPath: "switch/track-border-pressed" },
    "switch-track-border-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "switch/track-border-disabled" },

    // ── THUMB BACKGROUND ──
    "switch-thumb-background":          { type: "COLOR", semantic: "surface-default", figmaPath: "switch/thumb-background" },
    "switch-thumb-background-disabled": { type: "COLOR", semantic: "surface-default", figmaPath: "switch/thumb-background-disabled" },

    // ── LABEL TEXT ──
    "switch-label-text":          { type: "COLOR", semantic: "text-default",  figmaPath: "switch/label-text" },
    "switch-label-text-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "switch/label-text-disabled" },

    // ── SHARED COLOR TOKEN ──
    "switch-focus-ring": { type: "COLOR", semantic: "border-focus", figmaPath: "switch/focus-ring" },

    // ── FLOAT TOKENS (size variants: xs, sm, md, lg, xl) ──
    "switch-width":              { type: "FLOAT", unit: "px", sizes: { xs: 28, sm: 34, md: 42, lg: 52, xl: 64 },           figmaPath: "switch/width" },
    "switch-height":             { type: "FLOAT", unit: "px", sizes: { xs: 16, sm: 18, md: 22, lg: 28, xl: 34 },           figmaPath: "switch/height" },
    "switch-thumb-size":         { type: "FLOAT", unit: "px", sizes: { xs: 12, sm: 14, md: 18, lg: 24, xl: 30 },           figmaPath: "switch/thumb-size" },
    "switch-border-radius":      { type: "FLOAT", unit: "px", sizes: { xs: 8,  sm: 9,  md: 11, lg: 14, xl: 17 },           figmaPath: "switch/border-radius" },
    "switch-label-font-size":    { type: "FLOAT", unit: "px", sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 },           figmaPath: "switch/label-font-size" },
    "switch-label-line-height":  { type: "FLOAT", unit: "px", sizes: { xs: 14.4, sm: 16.8, md: 19.2, lg: 21.6, xl: 24 },   figmaPath: "switch/label-line-height" },
    "switch-label-gap":          { type: "FLOAT", unit: "px", sizes: { xs: 6, sm: 8, md: 10, lg: 12, xl: 14 },             figmaPath: "switch/label-gap" },

    // ── FLOAT TOKENS (single value, shared across all sizes) ──
    "switch-track-border-width": { type: "FLOAT", unit: "px", value: 1.5, figmaPath: "switch/track-border-width" },
  },

  checkbox: {
    // ── FILLED VARIANT ──
    "checkbox-filled-background":          { type: "COLOR", semantic: "surface-default",      figmaPath: "checkbox/filled-background" },
    "checkbox-filled-background-checked":  { type: "COLOR", semantic: "interactive-primary",   figmaPath: "checkbox/filled-background-checked" },
    "checkbox-filled-background-disabled": { type: "COLOR", semantic: "interactive-disabled",  figmaPath: "checkbox/filled-background-disabled" },
    "checkbox-filled-border":              { type: "COLOR", semantic: "border-default",        figmaPath: "checkbox/filled-border" },
    "checkbox-filled-border-checked":      { type: "COLOR", semantic: "interactive-primary",   figmaPath: "checkbox/filled-border-checked" },
    "checkbox-filled-border-disabled":     { type: "COLOR", semantic: "border-disabled",       figmaPath: "checkbox/filled-border-disabled" },
    "checkbox-filled-icon-color":          { type: "COLOR", semantic: "text-on-interactive",   figmaPath: "checkbox/filled-icon-color" },
    "checkbox-filled-icon-color-disabled": { type: "COLOR", semantic: "text-disabled",         figmaPath: "checkbox/filled-icon-color-disabled" },

    // ── OUTLINED VARIANT ──
    "checkbox-outlined-background":          { type: "COLOR", semantic: "surface-default",      figmaPath: "checkbox/outlined-background" },
    "checkbox-outlined-background-checked":  { type: "COLOR", semantic: "surface-default",      figmaPath: "checkbox/outlined-background-checked" },
    "checkbox-outlined-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "checkbox/outlined-background-disabled" },
    "checkbox-outlined-border":              { type: "COLOR", semantic: "border-default",       figmaPath: "checkbox/outlined-border" },
    "checkbox-outlined-border-checked":      { type: "COLOR", semantic: "interactive-primary",  figmaPath: "checkbox/outlined-border-checked" },
    "checkbox-outlined-border-disabled":     { type: "COLOR", semantic: "border-disabled",      figmaPath: "checkbox/outlined-border-disabled" },
    "checkbox-outlined-icon-color":          { type: "COLOR", semantic: "interactive-primary",  figmaPath: "checkbox/outlined-icon-color" },
    "checkbox-outlined-icon-color-disabled": { type: "COLOR", semantic: "text-disabled",        figmaPath: "checkbox/outlined-icon-color-disabled" },

    // ── BOX BACKGROUND — UNCHECKED (per state) ──
    "checkbox-background":          { type: "COLOR", semantic: "surface-default",            figmaPath: "checkbox/background" },
    "checkbox-background-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "checkbox/background-hover" },
    "checkbox-background-focus":    { type: "COLOR", semantic: "surface-default",            figmaPath: "checkbox/background-focus" },
    "checkbox-background-pressed":  { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "checkbox/background-pressed" },
    "checkbox-background-disabled": { type: "COLOR", semantic: "interactive-disabled",        figmaPath: "checkbox/background-disabled" },

    // ── BOX BACKGROUND — CHECKED (per state, shared with indeterminate) ──
    "checkbox-background-checked":          { type: "COLOR", semantic: "interactive-primary",         figmaPath: "checkbox/background-checked" },
    "checkbox-background-checked-hover":    { type: "COLOR", semantic: "interactive-primary-hover",   figmaPath: "checkbox/background-checked-hover" },
    "checkbox-background-checked-focus":    { type: "COLOR", semantic: "interactive-primary",         figmaPath: "checkbox/background-checked-focus" },
    "checkbox-background-checked-pressed":  { type: "COLOR", semantic: "interactive-primary-pressed", figmaPath: "checkbox/background-checked-pressed" },
    "checkbox-background-checked-disabled": { type: "COLOR", semantic: "interactive-disabled",        figmaPath: "checkbox/background-checked-disabled" },

    // ── BOX BORDER (per state) ──
    "checkbox-border":          { type: "COLOR", semantic: "border-default",  figmaPath: "checkbox/border" },
    "checkbox-border-hover":    { type: "COLOR", semantic: "border-default",  figmaPath: "checkbox/border-hover" },
    "checkbox-border-focus":    { type: "COLOR", semantic: "border-default",  figmaPath: "checkbox/border-focus" },
    "checkbox-border-pressed":  { type: "COLOR", semantic: "border-default",  figmaPath: "checkbox/border-pressed" },
    "checkbox-border-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "checkbox/border-disabled" },

    // ── ICON COLOR ──
    "checkbox-icon-color":          { type: "COLOR", semantic: "text-on-interactive", figmaPath: "checkbox/icon-color" },
    "checkbox-icon-color-disabled": { type: "COLOR", semantic: "text-disabled",       figmaPath: "checkbox/icon-color-disabled" },

    // ── LABEL TEXT ──
    "checkbox-label-text":          { type: "COLOR", semantic: "text-default",  figmaPath: "checkbox/label-text" },
    "checkbox-label-text-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "checkbox/label-text-disabled" },

    // ── SHARED COLOR TOKEN ──
    "checkbox-focus-ring": { type: "COLOR", semantic: "border-focus", figmaPath: "checkbox/focus-ring" },

    // ── FLOAT TOKENS (size variants: xs, sm, md, lg, xl) ──
    "checkbox-size":              { type: "FLOAT", unit: "px", sizes: { xs: 16, sm: 18, md: 20, lg: 24, xl: 28 },           figmaPath: "checkbox/size" },
    "checkbox-border-radius":     { type: "FLOAT", unit: "px", sizes: { xs: 4,  sm: 4,  md: 5,  lg: 6,  xl: 7 },            figmaPath: "checkbox/border-radius" },
    "checkbox-radius":            { type: "FLOAT", unit: "px", sizes: { xs: 2, sm: 4, md: 8, lg: 16, xl: 32 },              figmaPath: "checkbox/radius" },
    "checkbox-icon-size":         { type: "FLOAT", unit: "px", sizes: { xs: 10, sm: 12, md: 14, lg: 16, xl: 18 },           figmaPath: "checkbox/icon-size" },
    "checkbox-label-font-size":   { type: "FLOAT", unit: "px", sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 },           figmaPath: "checkbox/label-font-size" },
    "checkbox-label-line-height": { type: "FLOAT", unit: "px", sizes: { xs: 14.4, sm: 16.8, md: 19.2, lg: 21.6, xl: 24 },   figmaPath: "checkbox/label-line-height" },
    "checkbox-label-gap":         { type: "FLOAT", unit: "px", sizes: { xs: 6, sm: 8, md: 10, lg: 12, xl: 14 },             figmaPath: "checkbox/label-gap" },

    // ── FLOAT TOKENS (single value, shared across all sizes) ──
    "checkbox-border-width": { type: "FLOAT", unit: "px", value: 1.5, figmaPath: "checkbox/border-width" },
  },

  radio: {
    // ── RADIO BACKGROUND — UNCHECKED (per state) ──
    "radio-background":          { type: "COLOR", semantic: "surface-default",            figmaPath: "radio/background" },
    "radio-background-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "radio/background-hover" },
    "radio-background-focus":    { type: "COLOR", semantic: "surface-default",            figmaPath: "radio/background-focus" },
    "radio-background-pressed":  { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "radio/background-pressed" },
    "radio-background-disabled": { type: "COLOR", semantic: "interactive-disabled",        figmaPath: "radio/background-disabled" },

    // ── RADIO BACKGROUND — CHECKED — FILLED (per state) ──
    "radio-filled-background-checked":          { type: "COLOR", semantic: "interactive-primary",         figmaPath: "radio/filled-background-checked" },
    "radio-filled-background-checked-hover":    { type: "COLOR", semantic: "interactive-primary-hover",   figmaPath: "radio/filled-background-checked-hover" },
    "radio-filled-background-checked-focus":    { type: "COLOR", semantic: "interactive-primary",         figmaPath: "radio/filled-background-checked-focus" },
    "radio-filled-background-checked-pressed":  { type: "COLOR", semantic: "interactive-primary-pressed", figmaPath: "radio/filled-background-checked-pressed" },
    "radio-filled-background-checked-disabled": { type: "COLOR", semantic: "interactive-disabled",        figmaPath: "radio/filled-background-checked-disabled" },

    // ── RADIO BACKGROUND — CHECKED — OUTLINE (per state) ──
    "radio-outline-background-checked":          { type: "COLOR", semantic: "surface-default", figmaPath: "radio/outline-background-checked" },
    "radio-outline-background-checked-hover":    { type: "COLOR", semantic: "surface-default", figmaPath: "radio/outline-background-checked-hover" },
    "radio-outline-background-checked-focus":    { type: "COLOR", semantic: "surface-default", figmaPath: "radio/outline-background-checked-focus" },
    "radio-outline-background-checked-pressed":  { type: "COLOR", semantic: "surface-default", figmaPath: "radio/outline-background-checked-pressed" },
    "radio-outline-background-checked-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "radio/outline-background-checked-disabled" },

    // ── RADIO BORDER (per state) ──
    "radio-border":          { type: "COLOR", semantic: "border-default",  figmaPath: "radio/border" },
    "radio-border-hover":    { type: "COLOR", semantic: "border-default",  figmaPath: "radio/border-hover" },
    "radio-border-focus":    { type: "COLOR", semantic: "border-default",  figmaPath: "radio/border-focus" },
    "radio-border-pressed":  { type: "COLOR", semantic: "border-default",  figmaPath: "radio/border-pressed" },
    "radio-border-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "radio/border-disabled" },

    // ── RADIO ICON (dot) COLOR ──
    "radio-icon-color":          { type: "COLOR", semantic: "text-on-interactive", figmaPath: "radio/icon-color" },
    "radio-icon-color-disabled": { type: "COLOR", semantic: "text-disabled",       figmaPath: "radio/icon-color-disabled" },

    // ── LABEL TEXT ──
    "radio-label-text":          { type: "COLOR", semantic: "text-default",  figmaPath: "radio/label-text" },
    "radio-label-text-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "radio/label-text-disabled" },

    // ── SHARED COLOR TOKEN ──
    "radio-focus-ring": { type: "COLOR", semantic: "border-focus", figmaPath: "radio/focus-ring" },

    // ── FLOAT TOKENS (size variants: xs, sm, md, lg, xl) ──
    "radio-size":              { type: "FLOAT", unit: "px", sizes: { xs: 16, sm: 20, md: 24, lg: 28, xl: 32 },           figmaPath: "radio/size" },
    "radio-icon-size":         { type: "FLOAT", unit: "px", sizes: { xs: 6,  sm: 8,  md: 10, lg: 12, xl: 14 },           figmaPath: "radio/icon-size" },
    "radio-label-font-size":   { type: "FLOAT", unit: "px", sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 },           figmaPath: "radio/label-font-size" },
    "radio-label-line-height": { type: "FLOAT", unit: "px", sizes: { xs: 14.4, sm: 16.8, md: 19.2, lg: 21.6, xl: 24 },   figmaPath: "radio/label-line-height" },
    "radio-label-gap":         { type: "FLOAT", unit: "px", sizes: { xs: 6, sm: 8, md: 10, lg: 12, xl: 14 },             figmaPath: "radio/label-gap" },

    // ── FLOAT TOKENS (single value, shared across all sizes) ──
    "radio-border-width": { type: "FLOAT", unit: "px", value: 1.5, figmaPath: "radio/border-width" },
  },

  chip: {
    // ── CHIP BACKGROUND — UNCHECKED (per state) ──
    "chip-background":          { type: "COLOR", semantic: "surface-default",            figmaPath: "chip/background" },
    "chip-background-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "chip/background-hover" },
    "chip-background-focus":    { type: "COLOR", semantic: "surface-default",            figmaPath: "chip/background-focus" },
    "chip-background-pressed":  { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "chip/background-pressed" },
    "chip-background-disabled": { type: "COLOR", semantic: "interactive-disabled",        figmaPath: "chip/background-disabled" },

    // ── CHIP BACKGROUND — CHECKED — FILLED (per state) ──
    "chip-filled-background-checked":          { type: "COLOR", semantic: "interactive-primary",         figmaPath: "chip/filled-background-checked" },
    "chip-filled-background-checked-hover":    { type: "COLOR", semantic: "interactive-primary-hover",   figmaPath: "chip/filled-background-checked-hover" },
    "chip-filled-background-checked-focus":    { type: "COLOR", semantic: "interactive-primary",         figmaPath: "chip/filled-background-checked-focus" },
    "chip-filled-background-checked-pressed":  { type: "COLOR", semantic: "interactive-primary-pressed", figmaPath: "chip/filled-background-checked-pressed" },
    "chip-filled-background-checked-disabled": { type: "COLOR", semantic: "interactive-disabled",        figmaPath: "chip/filled-background-checked-disabled" },

    // ── CHIP BACKGROUND — CHECKED — LIGHT (per state) ──
    "chip-light-background-checked":          { type: "COLOR", semantic: "interactive-secondary",       figmaPath: "chip/light-background-checked" },
    "chip-light-background-checked-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "chip/light-background-checked-hover" },
    "chip-light-background-checked-focus":    { type: "COLOR", semantic: "interactive-secondary",       figmaPath: "chip/light-background-checked-focus" },
    "chip-light-background-checked-pressed":  { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "chip/light-background-checked-pressed" },
    "chip-light-background-checked-disabled": { type: "COLOR", semantic: "interactive-disabled",        figmaPath: "chip/light-background-checked-disabled" },

    // ── CHIP BACKGROUND — CHECKED — OUTLINE (per state) ──
    "chip-outline-background-checked":          { type: "COLOR", semantic: "surface-default",            figmaPath: "chip/outline-background-checked" },
    "chip-outline-background-checked-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "chip/outline-background-checked-hover" },
    "chip-outline-background-checked-focus":    { type: "COLOR", semantic: "surface-default",            figmaPath: "chip/outline-background-checked-focus" },
    "chip-outline-background-checked-pressed":  { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "chip/outline-background-checked-pressed" },
    "chip-outline-background-checked-disabled": { type: "COLOR", semantic: "interactive-disabled",        figmaPath: "chip/outline-background-checked-disabled" },

    // ── CHIP BORDER ──
    "chip-border":          { type: "COLOR", semantic: "border-default",  figmaPath: "chip/border" },
    "chip-border-hover":    { type: "COLOR", semantic: "border-default",  figmaPath: "chip/border-hover" },
    "chip-border-focus":    { type: "COLOR", semantic: "border-default",  figmaPath: "chip/border-focus" },
    "chip-border-pressed":  { type: "COLOR", semantic: "border-default",  figmaPath: "chip/border-pressed" },
    "chip-border-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "chip/border-disabled" },

    // ── CHIP TEXT ──
    "chip-text":                 { type: "COLOR", semantic: "text-default",        figmaPath: "chip/text" },
    "chip-text-disabled":        { type: "COLOR", semantic: "text-disabled",       figmaPath: "chip/text-disabled" },
    "chip-filled-text-checked":  { type: "COLOR", semantic: "text-on-interactive", figmaPath: "chip/filled-text-checked" },
    "chip-light-text-checked":   { type: "COLOR", semantic: "interactive-primary", figmaPath: "chip/light-text-checked" },
    "chip-outline-text-checked": { type: "COLOR", semantic: "interactive-primary", figmaPath: "chip/outline-text-checked" },

    // ── CHIP ICON COLOR ──
    "chip-icon-color":          { type: "COLOR", semantic: "text-on-interactive", figmaPath: "chip/icon-color" },
    "chip-icon-color-disabled": { type: "COLOR", semantic: "text-disabled",       figmaPath: "chip/icon-color-disabled" },

    // ── SHARED COLOR TOKEN ──
    "chip-focus-ring": { type: "COLOR", semantic: "border-focus", figmaPath: "chip/focus-ring" },

    // ── FLOAT TOKENS (size variants: xs, sm, md, lg, xl) ──
    "chip-height":          { type: "FLOAT", unit: "px", sizes: { xs: 23, sm: 28, md: 32, lg: 36, xl: 40 },              figmaPath: "chip/height" },
    "chip-padding":         { type: "FLOAT", unit: "px", sizes: { xs: 16, sm: 20, md: 24, lg: 28, xl: 32 },              figmaPath: "chip/padding" },
    "chip-checked-padding": { type: "FLOAT", unit: "px", sizes: { xs: 8.2, sm: 10, md: 11.7, lg: 13.5, xl: 15.7 },      figmaPath: "chip/checked-padding" },
    "chip-icon-size":       { type: "FLOAT", unit: "px", sizes: { xs: 9, sm: 12, md: 14, lg: 16, xl: 18 },               figmaPath: "chip/icon-size" },
    "chip-font-size":       { type: "FLOAT", unit: "px", sizes: { xs: 10, sm: 12, md: 14, lg: 16, xl: 18 },              figmaPath: "chip/font-size" },
    "chip-radius":          { type: "FLOAT", unit: "px", sizes: { xs: 2, sm: 4, md: 8, lg: 16, xl: 32 },                 figmaPath: "chip/radius" },
    "chip-spacing":         { type: "FLOAT", unit: "px", sizes: { xs: 2, sm: 4, md: 4, lg: 6, xl: 8 },                 figmaPath: "chip/spacing" },

    // ── FLOAT TOKENS (single value, shared across all sizes) ──
    "chip-border-width": { type: "FLOAT", unit: "px", value: 1.5, figmaPath: "chip/border-width" },
  },

  slider: {
    // ── TRACK BACKGROUND ──
    "slider-track-background": { type: "COLOR", semantic: "surface-default", figmaPath: "slider/track-background" },
    "slider-track-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "slider/track-background-disabled" },

    // ── FILLED BAR BACKGROUND (per state) ──
    "slider-bar-background": { type: "COLOR", semantic: "interactive-primary", figmaPath: "slider/bar-background" },
    "slider-bar-background-hover": { type: "COLOR", semantic: "interactive-primary-hover", figmaPath: "slider/bar-background-hover" },
    "slider-bar-background-focus": { type: "COLOR", semantic: "interactive-primary", figmaPath: "slider/bar-background-focus" },
    "slider-bar-background-pressed": { type: "COLOR", semantic: "interactive-primary-pressed", figmaPath: "slider/bar-background-pressed" },
    "slider-bar-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "slider/bar-background-disabled" },

    // ── THUMB ──
    "slider-thumb-background": { type: "COLOR", semantic: "surface-default", figmaPath: "slider/thumb-background" },
    "slider-thumb-background-disabled": { type: "COLOR", semantic: "surface-default", figmaPath: "slider/thumb-background-disabled" },
    "slider-thumb-border": { type: "COLOR", semantic: "interactive-primary", figmaPath: "slider/thumb-border" },
    "slider-thumb-border-hover": { type: "COLOR", semantic: "interactive-primary-hover", figmaPath: "slider/thumb-border-hover" },
    "slider-thumb-border-focus": { type: "COLOR", semantic: "interactive-primary", figmaPath: "slider/thumb-border-focus" },
    "slider-thumb-border-pressed": { type: "COLOR", semantic: "interactive-primary-pressed", figmaPath: "slider/thumb-border-pressed" },
    "slider-thumb-border-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "slider/thumb-border-disabled" },

    // ── MARKS & LABELS ──
    "slider-mark-color": { type: "COLOR", semantic: "border-default", figmaPath: "slider/mark-color" },
    "slider-mark-color-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "slider/mark-color-disabled" },
    "slider-mark-label-color": { type: "COLOR", semantic: "text-default", figmaPath: "slider/mark-label-color" },
    "slider-mark-label-color-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "slider/mark-label-color-disabled" },

    // ── SHARED COLOR TOKEN ──
    "slider-focus-ring": { type: "COLOR", semantic: "border-focus", figmaPath: "slider/focus-ring" },

    // ── FLOAT TOKENS (size variants) ──
    "slider-track-height": { type: "FLOAT", unit: "px", sizes: { xs: 2, sm: 4, md: 6, lg: 8, xl: 10 }, figmaPath: "slider/track-height" },
    "slider-thumb-size": { type: "FLOAT", unit: "px", sizes: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }, figmaPath: "slider/thumb-size" },
    "slider-mark-label-font-size": { type: "FLOAT", unit: "px", sizes: { xs: 10, sm: 11, md: 12, lg: 13, xl: 14 }, figmaPath: "slider/mark-label-font-size" },
    "slider-radius": { type: "FLOAT", unit: "px", sizes: { xs: 2, sm: 4, md: 8, lg: 16, xl: 32 }, figmaPath: "slider/radius" },

    // ── FLOAT TOKENS (single value) ──
    "slider-thumb-border-width": { type: "FLOAT", unit: "px", value: 2, figmaPath: "slider/thumb-border-width" },
    "slider-mark-size": { type: "FLOAT", unit: "px", value: 8, figmaPath: "slider/mark-size" },
  },

  rangeslider: {
    // ── TRACK BACKGROUND ──
    "rangeslider-track-background": { type: "COLOR", semantic: "surface-default", figmaPath: "rangeslider/track-background" },
    "rangeslider-track-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "rangeslider/track-background-disabled" },

    // ── FILLED RANGE BAR ──
    "rangeslider-bar-background": { type: "COLOR", semantic: "interactive-primary", figmaPath: "rangeslider/bar-background" },
    "rangeslider-bar-background-focus": { type: "COLOR", semantic: "interactive-primary", figmaPath: "rangeslider/bar-background-focus" },
    "rangeslider-bar-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "rangeslider/bar-background-disabled" },

    // ── THUMB ──
    "rangeslider-thumb-background": { type: "COLOR", semantic: "surface-default", figmaPath: "rangeslider/thumb-background" },
    "rangeslider-thumb-background-disabled": { type: "COLOR", semantic: "surface-default", figmaPath: "rangeslider/thumb-background-disabled" },
    "rangeslider-thumb-border": { type: "COLOR", semantic: "interactive-primary", figmaPath: "rangeslider/thumb-border" },
    "rangeslider-thumb-border-focus": { type: "COLOR", semantic: "interactive-primary", figmaPath: "rangeslider/thumb-border-focus" },
    "rangeslider-thumb-border-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "rangeslider/thumb-border-disabled" },

    // ── MARKS & LABELS ──
    "rangeslider-mark-color": { type: "COLOR", semantic: "border-default", figmaPath: "rangeslider/mark-color" },
    "rangeslider-mark-color-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "rangeslider/mark-color-disabled" },
    "rangeslider-mark-label-color": { type: "COLOR", semantic: "text-default", figmaPath: "rangeslider/mark-label-color" },
    "rangeslider-mark-label-color-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "rangeslider/mark-label-color-disabled" },

    // ── SHARED COLOR TOKEN ──
    "rangeslider-focus-ring": { type: "COLOR", semantic: "border-focus", figmaPath: "rangeslider/focus-ring" },

    // ── FLOAT TOKENS (size variants) ──
    "rangeslider-track-height": { type: "FLOAT", unit: "px", sizes: { xs: 2, sm: 4, md: 6, lg: 8, xl: 10 }, figmaPath: "rangeslider/track-height" },
    "rangeslider-thumb-size": { type: "FLOAT", unit: "px", sizes: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }, figmaPath: "rangeslider/thumb-size" },
    "rangeslider-mark-label-font-size": { type: "FLOAT", unit: "px", sizes: { xs: 10, sm: 11, md: 12, lg: 13, xl: 14 }, figmaPath: "rangeslider/mark-label-font-size" },
    "rangeslider-radius": { type: "FLOAT", unit: "px", sizes: { xs: 2, sm: 4, md: 8, lg: 16, xl: 32 }, figmaPath: "rangeslider/radius" },

    // ── FLOAT TOKENS (single value) ──
    "rangeslider-thumb-border-width": { type: "FLOAT", unit: "px", value: 2, figmaPath: "rangeslider/thumb-border-width" },
    "rangeslider-mark-size": { type: "FLOAT", unit: "px", value: 8, figmaPath: "rangeslider/mark-size" },
  },

  notification: {
    // ── COLOR TOKENS ──
    "notification-background": { type: "COLOR", semantic: "surface-default", figmaPath: "notification/background" },
    "notification-border": { type: "COLOR", semantic: "border-default", figmaPath: "notification/border" },
    "notification-title": { type: "COLOR", semantic: "text-default", figmaPath: "notification/title" },
    "notification-description": { type: "COLOR", semantic: "text-default", figmaPath: "notification/description" },
    "notification-icon": { type: "COLOR", semantic: "interactive-primary", figmaPath: "notification/icon" },
    "notification-close": { type: "COLOR", semantic: "text-default", figmaPath: "notification/close" },

    // ── FLOAT TOKENS ──
    "notification-radius": { type: "FLOAT", unit: "px", sizes: { xs: 2, sm: 4, md: 8, lg: 16, xl: 32 }, figmaPath: "notification/radius" },
    "notification-padding-x": { type: "FLOAT", unit: "px", value: 12, figmaPath: "notification/padding-x" },
    "notification-padding-y": { type: "FLOAT", unit: "px", value: 10, figmaPath: "notification/padding-y" },
    "notification-title-font-size": { type: "FLOAT", unit: "px", value: 14, figmaPath: "notification/title-font-size" },
    "notification-description-font-size": { type: "FLOAT", unit: "px", value: 13, figmaPath: "notification/description-font-size" },
    "notification-border-width": { type: "FLOAT", unit: "px", value: 1, figmaPath: "notification/border-width" },
  },

  tooltip: {
    // ── COLOR TOKENS ──
    "tooltip-background": { type: "COLOR", semantic: "surface-inverse", figmaPath: "tooltip/background" },
    "tooltip-color":      { type: "COLOR", semantic: "text-inverse",    figmaPath: "tooltip/color" },

    // ── FLOAT TOKENS (single value, no size variants) ──
    "tooltip-radius":     { type: "FLOAT", unit: "px", value: 4,  figmaPath: "tooltip/radius" },
    "tooltip-padding-x":  { type: "FLOAT", unit: "px", value: 8,  figmaPath: "tooltip/padding-x" },
    "tooltip-padding-y":  { type: "FLOAT", unit: "px", value: 4,  figmaPath: "tooltip/padding-y" },
    "tooltip-font-size":  { type: "FLOAT", unit: "px", value: 12, figmaPath: "tooltip/font-size" },
    "tooltip-arrow-size": { type: "FLOAT", unit: "px", value: 7,  figmaPath: "tooltip/arrow-size" },
  },

  textinput: {
    // ── DEFAULT VARIANT — BACKGROUND (per state) ──
    "textinput-default-background":          { type: "COLOR", semantic: "surface-default",      figmaPath: "textinput/default-background" },
    "textinput-default-background-hover":    { type: "COLOR", semantic: "surface-default",      figmaPath: "textinput/default-background-hover" },
    "textinput-default-background-focus":    { type: "COLOR", semantic: "surface-default",      figmaPath: "textinput/default-background-focus" },
    "textinput-default-background-error":    { type: "COLOR", semantic: "surface-default",      figmaPath: "textinput/default-background-error" },
    "textinput-default-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "textinput/default-background-disabled" },

    // ── DEFAULT VARIANT — BORDER (per state) ──
    "textinput-default-border":          { type: "COLOR", semantic: "border-default",  figmaPath: "textinput/default-border" },
    "textinput-default-border-hover":    { type: "COLOR", semantic: "border-default",  figmaPath: "textinput/default-border-hover" },
    "textinput-default-border-focus":    { type: "COLOR", semantic: "border-focus",    figmaPath: "textinput/default-border-focus" },
    "textinput-default-border-error":    { type: "COLOR", semantic: "feedback-error",  figmaPath: "textinput/default-border-error" },
    "textinput-default-border-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "textinput/default-border-disabled" },

    // ── FILLED VARIANT — BACKGROUND (per state) ──
    "textinput-filled-background":          { type: "COLOR", semantic: "interactive-secondary",       figmaPath: "textinput/filled-background" },
    "textinput-filled-background-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "textinput/filled-background-hover" },
    "textinput-filled-background-focus":    { type: "COLOR", semantic: "interactive-secondary",       figmaPath: "textinput/filled-background-focus" },
    "textinput-filled-background-error":    { type: "COLOR", semantic: "interactive-secondary",       figmaPath: "textinput/filled-background-error" },
    "textinput-filled-background-disabled": { type: "COLOR", semantic: "interactive-disabled",        figmaPath: "textinput/filled-background-disabled" },

    // ── FILLED VARIANT — BORDER (per state) ──
    "textinput-filled-border":          { type: "COLOR", semantic: "interactive-secondary",       figmaPath: "textinput/filled-border" },
    "textinput-filled-border-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "textinput/filled-border-hover" },
    "textinput-filled-border-focus":    { type: "COLOR", semantic: "border-focus",                figmaPath: "textinput/filled-border-focus" },
    "textinput-filled-border-error":    { type: "COLOR", semantic: "feedback-error",              figmaPath: "textinput/filled-border-error" },
    "textinput-filled-border-disabled": { type: "COLOR", semantic: "interactive-disabled",        figmaPath: "textinput/filled-border-disabled" },

    // ── SHARED COLOR TOKENS ──
    "textinput-text":           { type: "COLOR", semantic: "text-default",     figmaPath: "textinput/text" },
    "textinput-text-disabled":  { type: "COLOR", semantic: "text-disabled",    figmaPath: "textinput/text-disabled" },
    "textinput-placeholder":    { type: "COLOR", semantic: "text-placeholder", figmaPath: "textinput/placeholder" },
    "textinput-label-color":    { type: "COLOR", semantic: "text-default",     figmaPath: "textinput/label-color" },
    "textinput-asterisk-color": { type: "COLOR", semantic: "feedback-error",   figmaPath: "textinput/asterisk-color" },
    "textinput-error-color":    { type: "COLOR", semantic: "feedback-error",   figmaPath: "textinput/error-color" },
    "textinput-focus-ring":     { type: "COLOR", semantic: "border-focus",     figmaPath: "textinput/focus-ring" },

    // ── FLOAT TOKENS (size variants: xs, sm, md, lg, xl) ──
    "textinput-height":    { type: "FLOAT", unit: "px", sizes: { xs: 30, sm: 36, md: 42, lg: 50, xl: 60 },  figmaPath: "textinput/height" },
    "textinput-font-size": { type: "FLOAT", unit: "px", sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 },  figmaPath: "textinput/font-size" },
    "textinput-padding-x": { type: "FLOAT", unit: "px", sizes: { xs: 8,  sm: 10, md: 12, lg: 16, xl: 20 },  figmaPath: "textinput/padding-x" },

    // ── FLOAT TOKENS (radius variants: xs, sm, md, lg, xl — independent from size) ──
    "textinput-radius": { type: "FLOAT", unit: "px", sizes: { xs: 2, sm: 4, md: 8, lg: 16, xl: 32 }, figmaPath: "textinput/radius" },

    // ── FLOAT TOKENS (single value, shared across all sizes) ──
    "textinput-border-width":    { type: "FLOAT", unit: "px", value: 1,  figmaPath: "textinput/border-width" },
    "textinput-label-font-size": { type: "FLOAT", unit: "px", value: 14, figmaPath: "textinput/label-font-size" },
    "textinput-label-gap":       { type: "FLOAT", unit: "px", value: 4,  figmaPath: "textinput/label-gap" },
    "textinput-error-font-size": { type: "FLOAT", unit: "px", value: 12, figmaPath: "textinput/error-font-size" },
    "textinput-error-gap":       { type: "FLOAT", unit: "px", value: 4,  figmaPath: "textinput/error-gap" },
  },

  title: {
    // ── COLOR TOKENS ──
    "title-color": { type: "COLOR", semantic: "text-default", figmaPath: "title/color" },

    // ── FLOAT TOKENS (order/size variants: h1-h6) ──
    "title-font-size": {
      type: "FLOAT",
      unit: "px",
      sizes: { h1: 34, h2: 28, h3: 24, h4: 20, h5: 16, h6: 14 },
      figmaPath: "title/font-size",
    },
    "title-line-height": {
      type: "FLOAT",
      unit: "px",
      sizes: { h1: 42, h2: 36, h3: 32, h4: 28, h5: 24, h6: 20 },
      figmaPath: "title/line-height",
    },

    // ── FLOAT TOKENS (single value) ──
    "title-font-weight": { type: "FLOAT", unit: "", value: 700, figmaPath: "title/font-weight" },
    "title-max-width": { type: "FLOAT", unit: "px", value: 520, figmaPath: "title/max-width" },
  },

  text: {
    // ── COLOR TOKENS ──
    "text-color": { type: "COLOR", semantic: "text-default", figmaPath: "text/color" },
    "text-color-dimmed": { type: "COLOR", semantic: "text-disabled", figmaPath: "text/color-dimmed" },
    "text-color-brand": { type: "COLOR", semantic: "interactive-primary", figmaPath: "text/color-brand" },

    // ── FLOAT TOKENS (size variants: xs, sm, md, lg, xl) ──
    "text-font-size": {
      type: "FLOAT",
      unit: "px",
      sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 },
      figmaPath: "text/font-size",
    },
    "text-line-height": {
      type: "FLOAT",
      unit: "px",
      sizes: { xs: 16, sm: 20, md: 24, lg: 28, xl: 32 },
      figmaPath: "text/line-height",
    },

    // ── FLOAT TOKENS (single value) ──
    "text-font-weight-regular": { type: "FLOAT", unit: "", value: 400, figmaPath: "text/font-weight-regular" },
    "text-font-weight-semibold": { type: "FLOAT", unit: "", value: 600, figmaPath: "text/font-weight-semibold" },
    "text-font-weight-bold": { type: "FLOAT", unit: "", value: 700, figmaPath: "text/font-weight-bold" },
    "text-max-width": { type: "FLOAT", unit: "px", value: 520, figmaPath: "text/max-width" },
  },
};

const PLACEHOLDER_COMPONENTS = [
  "card",
  "notification",
  "modal",
  "slider",
  "rangeslider",
  "select",
  "loader",
  "pill",
  "accordion",
  "badge",
  "anchor",
  "text",
  "title",
  "multiselect",
  "alert",
];

export const COMPONENT_NAMES = [...new Set([...Object.keys(COMPONENT_TOKENS), ...PLACEHOLDER_COMPONENTS])];

export const COMPONENT_SIZE_KEYS = {
  button: ["xs", "sm", "md", "lg", "xl"],
  actionicon: ["xs", "sm", "md", "lg", "xl"],
  tabs: ["xs", "sm", "md", "lg", "xl"],
  switch: ["xs", "sm", "md", "lg", "xl"],
  checkbox: ["xs", "sm", "md", "lg", "xl"],
  radio: ["xs", "sm", "md", "lg", "xl"],
  chip: ["xs", "sm", "md", "lg", "xl"],
  slider: ["xs", "sm", "md", "lg", "xl"],
  rangeslider: ["xs", "sm", "md", "lg", "xl"],
  notification: ["xs", "sm", "md", "lg", "xl"],
  tooltip: [],
  textinput: ["xs", "sm", "md", "lg", "xl"],
  title: ["h1", "h2", "h3", "h4", "h5", "h6"],
  text: ["xs", "sm", "md", "lg", "xl"],
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
