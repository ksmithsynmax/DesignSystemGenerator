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
    "button-filled-border":              { type: "COLOR", semantic: "transparent",                          figmaPath: "button/filled-border" },
    "button-filled-border-hover":        { type: "COLOR", semantic: "transparent",                          figmaPath: "button/filled-border-hover" },
    "button-filled-border-focus":        { type: "COLOR", semantic: "transparent",                          figmaPath: "button/filled-border-focus" },
    "button-filled-border-pressed":      { type: "COLOR", semantic: "transparent",                          figmaPath: "button/filled-border-pressed" },
    "button-filled-border-disabled":     { type: "COLOR", semantic: "transparent",                          figmaPath: "button/filled-border-disabled" },

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
    "button-ghost-background":          { type: "COLOR", semantic: "transparent",                          figmaPath: "button/transparent-background" },
    "button-ghost-background-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "button/transparent-background-hover" },
    "button-ghost-background-focus":    { type: "COLOR", semantic: "transparent",                          figmaPath: "button/transparent-background-focus" },
    "button-ghost-background-pressed":  { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "button/transparent-background-pressed" },
    "button-ghost-background-disabled": { type: "COLOR", semantic: "transparent",                          figmaPath: "button/transparent-background-disabled" },
    "button-ghost-text":                { type: "COLOR", semantic: "interactive-primary",          figmaPath: "button/transparent-text" },
    "button-ghost-text-hover":          { type: "COLOR", semantic: "interactive-primary-hover",    figmaPath: "button/transparent-text-hover" },
    "button-ghost-text-focus":          { type: "COLOR", semantic: "interactive-primary",          figmaPath: "button/transparent-text-focus" },
    "button-ghost-text-pressed":        { type: "COLOR", semantic: "interactive-primary-pressed",  figmaPath: "button/transparent-text-pressed" },
    "button-ghost-text-disabled":       { type: "COLOR", semantic: "text-disabled",               figmaPath: "button/transparent-text-disabled" },
    "button-ghost-border":              { type: "COLOR", semantic: "transparent",                          figmaPath: "button/transparent-border" },
    "button-ghost-border-hover":        { type: "COLOR", semantic: "transparent",                          figmaPath: "button/transparent-border-hover" },
    "button-ghost-border-focus":        { type: "COLOR", semantic: "transparent",                          figmaPath: "button/transparent-border-focus" },
    "button-ghost-border-pressed":      { type: "COLOR", semantic: "transparent",                          figmaPath: "button/transparent-border-pressed" },
    "button-ghost-border-disabled":     { type: "COLOR", semantic: "transparent",                          figmaPath: "button/transparent-border-disabled" },

    // ── ERROR COLOR TOKENS (all states) ──
    "button-filled-error-background":          { type: "COLOR", semantic: "feedback-error",      figmaPath: "button/filled-error-background" },
    "button-filled-error-background-hover":    { type: "COLOR", semantic: "feedback-error",      figmaPath: "button/filled-error-background-hover" },
    "button-filled-error-background-focus":    { type: "COLOR", semantic: "feedback-error",      figmaPath: "button/filled-error-background-focus" },
    "button-filled-error-background-pressed":  { type: "COLOR", semantic: "feedback-error",      figmaPath: "button/filled-error-background-pressed" },
    "button-filled-error-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "button/filled-error-background-disabled" },
    "button-filled-error-text":                { type: "COLOR", semantic: "text-on-interactive", figmaPath: "button/filled-error-text" },
    "button-filled-error-text-hover":          { type: "COLOR", semantic: "text-on-interactive", figmaPath: "button/filled-error-text-hover" },
    "button-filled-error-text-focus":          { type: "COLOR", semantic: "text-on-interactive", figmaPath: "button/filled-error-text-focus" },
    "button-filled-error-text-pressed":        { type: "COLOR", semantic: "text-on-interactive", figmaPath: "button/filled-error-text-pressed" },
    "button-filled-error-text-disabled":       { type: "COLOR", semantic: "text-disabled",       figmaPath: "button/filled-error-text-disabled" },
    "button-filled-error-border":              { type: "COLOR", semantic: "transparent",         figmaPath: "button/filled-error-border" },
    "button-filled-error-border-hover":        { type: "COLOR", semantic: "transparent",         figmaPath: "button/filled-error-border-hover" },
    "button-filled-error-border-focus":        { type: "COLOR", semantic: "transparent",         figmaPath: "button/filled-error-border-focus" },
    "button-filled-error-border-pressed":      { type: "COLOR", semantic: "transparent",         figmaPath: "button/filled-error-border-pressed" },
    "button-filled-error-border-disabled":     { type: "COLOR", semantic: "transparent",         figmaPath: "button/filled-error-border-disabled" },

    "button-outlined-error-background":          { type: "COLOR", semantic: "surface-default",             figmaPath: "button/outlined-error-background" },
    "button-outlined-error-background-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "button/outlined-error-background-hover" },
    "button-outlined-error-background-focus":    { type: "COLOR", semantic: "surface-default",             figmaPath: "button/outlined-error-background-focus" },
    "button-outlined-error-background-pressed":  { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "button/outlined-error-background-pressed" },
    "button-outlined-error-background-disabled": { type: "COLOR", semantic: "surface-default",             figmaPath: "button/outlined-error-background-disabled" },
    "button-outlined-error-text":                { type: "COLOR", semantic: "feedback-error",  figmaPath: "button/outlined-error-text" },
    "button-outlined-error-text-hover":          { type: "COLOR", semantic: "feedback-error",  figmaPath: "button/outlined-error-text-hover" },
    "button-outlined-error-text-focus":          { type: "COLOR", semantic: "feedback-error",  figmaPath: "button/outlined-error-text-focus" },
    "button-outlined-error-text-pressed":        { type: "COLOR", semantic: "feedback-error",  figmaPath: "button/outlined-error-text-pressed" },
    "button-outlined-error-text-disabled":       { type: "COLOR", semantic: "text-disabled",   figmaPath: "button/outlined-error-text-disabled" },
    "button-outlined-error-border":              { type: "COLOR", semantic: "feedback-error",  figmaPath: "button/outlined-error-border" },
    "button-outlined-error-border-hover":        { type: "COLOR", semantic: "feedback-error",  figmaPath: "button/outlined-error-border-hover" },
    "button-outlined-error-border-focus":        { type: "COLOR", semantic: "feedback-error",  figmaPath: "button/outlined-error-border-focus" },
    "button-outlined-error-border-pressed":      { type: "COLOR", semantic: "feedback-error",  figmaPath: "button/outlined-error-border-pressed" },
    "button-outlined-error-border-disabled":     { type: "COLOR", semantic: "border-disabled", figmaPath: "button/outlined-error-border-disabled" },

    "button-ghost-error-background":          { type: "COLOR", semantic: "transparent",                 figmaPath: "button/transparent-error-background" },
    "button-ghost-error-background-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "button/transparent-error-background-hover" },
    "button-ghost-error-background-focus":    { type: "COLOR", semantic: "transparent",                 figmaPath: "button/transparent-error-background-focus" },
    "button-ghost-error-background-pressed":  { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "button/transparent-error-background-pressed" },
    "button-ghost-error-background-disabled": { type: "COLOR", semantic: "transparent",                 figmaPath: "button/transparent-error-background-disabled" },
    "button-ghost-error-text":                { type: "COLOR", semantic: "feedback-error", figmaPath: "button/transparent-error-text" },
    "button-ghost-error-text-hover":          { type: "COLOR", semantic: "feedback-error", figmaPath: "button/transparent-error-text-hover" },
    "button-ghost-error-text-focus":          { type: "COLOR", semantic: "feedback-error", figmaPath: "button/transparent-error-text-focus" },
    "button-ghost-error-text-pressed":        { type: "COLOR", semantic: "feedback-error", figmaPath: "button/transparent-error-text-pressed" },
    "button-ghost-error-text-disabled":       { type: "COLOR", semantic: "text-disabled",  figmaPath: "button/transparent-error-text-disabled" },
    "button-ghost-error-border":              { type: "COLOR", semantic: "transparent",    figmaPath: "button/transparent-error-border" },
    "button-ghost-error-border-hover":        { type: "COLOR", semantic: "transparent",    figmaPath: "button/transparent-error-border-hover" },
    "button-ghost-error-border-focus":        { type: "COLOR", semantic: "transparent",    figmaPath: "button/transparent-error-border-focus" },
    "button-ghost-error-border-pressed":      { type: "COLOR", semantic: "transparent",    figmaPath: "button/transparent-error-border-pressed" },
    "button-ghost-error-border-disabled":     { type: "COLOR", semantic: "transparent",    figmaPath: "button/transparent-error-border-disabled" },

    // ── SHARED COLOR TOKEN ──
    "button-focus-ring": { type: "COLOR", semantic: "border-focus", figmaPath: "button/focus-ring" },

    // ── FLOAT TOKENS (size variants: xxs, xs, sm, md, lg, xl) ──
    "button-padding-x":     { type: "FLOAT", unit: "px", sizes: { xxs: 8, xs: 10, sm: 14, md: 18, lg: 22, xl: 28 },   figmaPath: "button/padding-x" },
    "button-padding-y":     { type: "FLOAT", unit: "px", sizes: { xxs: 2, xs: 4,  sm: 6,  md: 8,  lg: 10, xl: 14 },   figmaPath: "button/padding-y" },
    "button-font-size":     { type: "FLOAT", unit: "px", sizes: { xxs: 11, xs: 12, sm: 14, md: 16, lg: 18, xl: 20 },   figmaPath: "button/font-size" },
    "button-line-height":   { type: "FLOAT", unit: "px", sizes: { xxs: 14, xs: 16, sm: 20, md: 24, lg: 28, xl: 32 }, figmaPath: "button/line-height" },
    "button-font-family":   { type: "STRING", value: "Inter", figmaPath: "button/font-family" },
    "button-icon-size":     { type: "FLOAT", unit: "px", sizes: { xxs: 10, xs: 12, sm: 14, md: 16, lg: 18, xl: 20 },   figmaPath: "button/icon-size" },
    "button-icon-spacing":  { type: "FLOAT", unit: "px", sizes: { xxs: 4, xs: 5, sm: 6, md: 8, lg: 10, xl: 12 }, figmaPath: "button/icon-spacing" },
    "button-icon-stroke-width": { type: "FLOAT", unit: "px", sizes: { xxs: 1, xs: 1.25, sm: 1.5, md: 1.75, lg: 2, xl: 2.25 }, figmaPath: "button/icon-stroke-width" },
    // ── FLOAT TOKENS (single value, shared across all sizes) ──
    "button-border-radius": { type: "FLOAT", unit: "px", value: 8,   figmaPath: "button/border-radius" },
    "button-border-width":  { type: "FLOAT", unit: "px", value: 1.5, figmaPath: "button/border-width" },
    "button-focus-ring-width": { type: "FLOAT", unit: "px", value: 2, figmaPath: "button/focus-ring-width" },
    "button-focus-ring-spacing": { type: "FLOAT", unit: "px", value: 3, figmaPath: "button/focus-ring-spacing" },
    "button-focus-ring-radius": { type: "FLOAT", unit: "px", value: 11, figmaPath: "button/focus-ring-radius" },

    // ── STRING TOKENS (single value) ──
    "button-font-weight":   { type: "STRING", value: "Semi Bold", figmaPath: "button/font-weight" },
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
    "actionicon-filled-border":              { type: "COLOR", semantic: "transparent",                          figmaPath: "actionicon/filled-border" },
    "actionicon-filled-border-hover":        { type: "COLOR", semantic: "transparent",                          figmaPath: "actionicon/filled-border-hover" },
    "actionicon-filled-border-focus":        { type: "COLOR", semantic: "transparent",                          figmaPath: "actionicon/filled-border-focus" },
    "actionicon-filled-border-pressed":      { type: "COLOR", semantic: "transparent",                          figmaPath: "actionicon/filled-border-pressed" },
    "actionicon-filled-border-disabled":     { type: "COLOR", semantic: "transparent",                          figmaPath: "actionicon/filled-border-disabled" },

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
    "actionicon-light-border":              { type: "COLOR", semantic: "transparent",                          figmaPath: "actionicon/light-border" },
    "actionicon-light-border-hover":        { type: "COLOR", semantic: "transparent",                          figmaPath: "actionicon/light-border-hover" },
    "actionicon-light-border-focus":        { type: "COLOR", semantic: "transparent",                          figmaPath: "actionicon/light-border-focus" },
    "actionicon-light-border-pressed":      { type: "COLOR", semantic: "transparent",                          figmaPath: "actionicon/light-border-pressed" },
    "actionicon-light-border-disabled":     { type: "COLOR", semantic: "transparent",                          figmaPath: "actionicon/light-border-disabled" },

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
    "actionicon-transparent-background":          { type: "COLOR", semantic: "transparent",                          figmaPath: "actionicon/transparent-background" },
    "actionicon-transparent-background-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "actionicon/transparent-background-hover" },
    "actionicon-transparent-background-focus":    { type: "COLOR", semantic: "transparent",                          figmaPath: "actionicon/transparent-background-focus" },
    "actionicon-transparent-background-pressed":  { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "actionicon/transparent-background-pressed" },
    "actionicon-transparent-background-disabled": { type: "COLOR", semantic: "transparent",                          figmaPath: "actionicon/transparent-background-disabled" },
    "actionicon-transparent-icon":                { type: "COLOR", semantic: "interactive-primary",          figmaPath: "actionicon/transparent-icon" },
    "actionicon-transparent-icon-hover":          { type: "COLOR", semantic: "interactive-primary",          figmaPath: "actionicon/transparent-icon-hover" },
    "actionicon-transparent-icon-focus":          { type: "COLOR", semantic: "interactive-primary",          figmaPath: "actionicon/transparent-icon-focus" },
    "actionicon-transparent-icon-pressed":        { type: "COLOR", semantic: "interactive-primary",          figmaPath: "actionicon/transparent-icon-pressed" },
    "actionicon-transparent-icon-disabled":       { type: "COLOR", semantic: "text-disabled",               figmaPath: "actionicon/transparent-icon-disabled" },
    "actionicon-transparent-border":              { type: "COLOR", semantic: "transparent",                          figmaPath: "actionicon/transparent-border" },
    "actionicon-transparent-border-hover":        { type: "COLOR", semantic: "transparent",                          figmaPath: "actionicon/transparent-border-hover" },
    "actionicon-transparent-border-focus":        { type: "COLOR", semantic: "transparent",                          figmaPath: "actionicon/transparent-border-focus" },
    "actionicon-transparent-border-pressed":      { type: "COLOR", semantic: "transparent",                          figmaPath: "actionicon/transparent-border-pressed" },
    "actionicon-transparent-border-disabled":     { type: "COLOR", semantic: "transparent",                          figmaPath: "actionicon/transparent-border-disabled" },

    // ── SHARED COLOR TOKEN ──
    "actionicon-focus-ring": { type: "COLOR", semantic: "border-focus", figmaPath: "actionicon/focus-ring" },

    // ── FLOAT TOKENS (size variants: xs, sm, md, lg, xl) ──
    "actionicon-size":      { type: "FLOAT", unit: "px", sizes: { xs: 28, sm: 32, md: 36, lg: 42, xl: 48 }, figmaPath: "actionicon/size" },
    "actionicon-icon-size": { type: "FLOAT", unit: "px", sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 }, figmaPath: "actionicon/icon-size" },
    "actionicon-icon-stroke-width": { type: "FLOAT", unit: "px", sizes: { xs: 1.25, sm: 1.5, md: 1.75, lg: 2, xl: 2.25 }, figmaPath: "actionicon/icon-stroke-width" },
    "actionicon-radius":    { type: "FLOAT", unit: "px", sizes: { xs: 2, sm: 4, md: 8, lg: 16, xl: 32 },    figmaPath: "actionicon/radius" },

    // ── FLOAT TOKENS (shared + focus ring by radius size) ──
    "actionicon-border-width": { type: "FLOAT", unit: "px", value: 1.5, figmaPath: "actionicon/border-width" },
    "actionicon-focus-ring-width": {
      type: "FLOAT",
      unit: "px",
      sizes: { xs: 1.5, sm: 2, md: 2, lg: 2.5, xl: 3 },
      figmaPath: "actionicon/focus-ring-width"
    },
    "actionicon-focus-ring-spacing": {
      type: "FLOAT",
      unit: "px",
      sizes: { xs: 2, sm: 3, md: 3, lg: 4, xl: 5 },
      figmaPath: "actionicon/focus-ring-spacing"
    },
    "actionicon-focus-ring-radius": {
      type: "FLOAT",
      unit: "px",
      sizes: { xs: 5, sm: 7, md: 11, lg: 19, xl: 35 },
      figmaPath: "actionicon/focus-ring-radius"
    },
  },

  tabs: {
    // ── DEFAULT VARIANT ──
    "tabs-default-list-background": { type: "COLOR", semantic: "surface-default", figmaPath: "tabs/default-list-background" },
    "tabs-default-list-border": { type: "COLOR", semantic: "border-default", figmaPath: "tabs/default-list-border" },
    "tabs-default-tab-background-active": { type: "COLOR", semantic: "surface-default", figmaPath: "tabs/default-tab-background-active" },
    "tabs-default-tab-text": { type: "COLOR", semantic: "text-default", figmaPath: "tabs/default-tab-text" },
    "tabs-default-tab-text-hover": { type: "COLOR", semantic: "text-default", figmaPath: "tabs/default-tab-text-hover" },
    "tabs-default-tab-text-active": { type: "COLOR", semantic: "interactive-primary", figmaPath: "tabs/default-tab-text-active" },
    "tabs-default-tab-text-pressed": { type: "COLOR", semantic: "interactive-primary", figmaPath: "tabs/default-tab-text-pressed" },
    "tabs-default-tab-text-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "tabs/default-tab-text-disabled" },
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
    "tabs-default-radius": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 4, xs: 2, sm: 4, md: 8, lg: 16, xl: 32 },
      figmaPath: "tabs/default-radius",
    },
    "tabs-outlined-radius": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 4, xs: 2, sm: 4, md: 8, lg: 16, xl: 32 },
      figmaPath: "tabs/outlined-radius",
    },
    "tabs-pills-radius": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 4, xs: 2, sm: 4, md: 8, lg: 16, xl: 32 },
      figmaPath: "tabs/pills-radius",
    },
    "tabs-font-size": { type: "FLOAT", unit: "px", value: 14, figmaPath: "tabs/font-size" },
    "tabs-font-family": { type: "STRING", value: "Inter", figmaPath: "tabs/font-family" },
    "tabs-font-weight": { type: "STRING", value: "Semi Bold", figmaPath: "tabs/font-weight" },
    "tabs-line-height": { type: "FLOAT", unit: "px", value: 20, figmaPath: "tabs/line-height" },
    "tabs-default-tab-padding-x": { type: "FLOAT", unit: "px", value: 12, figmaPath: "tabs/default-tab-padding-x" },
    "tabs-default-tab-padding-y": { type: "FLOAT", unit: "px", value: 8, figmaPath: "tabs/default-tab-padding-y" },
    "tabs-outlined-tab-padding-x": { type: "FLOAT", unit: "px", value: 12, figmaPath: "tabs/outlined-tab-padding-x" },
    "tabs-outlined-tab-padding-y": { type: "FLOAT", unit: "px", value: 8, figmaPath: "tabs/outlined-tab-padding-y" },
    "tabs-pills-tab-padding-x": { type: "FLOAT", unit: "px", value: 12, figmaPath: "tabs/pills-tab-padding-x" },
    "tabs-pills-tab-padding-y": { type: "FLOAT", unit: "px", value: 8, figmaPath: "tabs/pills-tab-padding-y" },
    "tabs-default-list-padding": { type: "FLOAT", unit: "px", value: 0, figmaPath: "tabs/default-list-padding" },
    "tabs-outlined-list-padding": { type: "FLOAT", unit: "px", value: 4, figmaPath: "tabs/outlined-list-padding" },
    "tabs-pills-list-padding": { type: "FLOAT", unit: "px", value: 4, figmaPath: "tabs/pills-list-padding" },
    "tabs-default-list-gap": { type: "FLOAT", unit: "px", value: 8, figmaPath: "tabs/default-list-gap" },
    "tabs-outlined-list-gap": { type: "FLOAT", unit: "px", value: 8, figmaPath: "tabs/outlined-list-gap" },
    "tabs-pills-list-gap": { type: "FLOAT", unit: "px", value: 8, figmaPath: "tabs/pills-list-gap" },
    "tabs-list-border-width": { type: "FLOAT", unit: "px", value: 1, figmaPath: "tabs/list-border-width" },
    "tabs-tab-border-width": { type: "FLOAT", unit: "px", value: 1, figmaPath: "tabs/tab-border-width" },
    "tabs-tab-border-width-active": { type: "FLOAT", unit: "px", value: 2, figmaPath: "tabs/tab-border-width-active" },
    "tabs-default-tab-border-width-active": { type: "FLOAT", unit: "px", value: 2, figmaPath: "tabs/default-tab-border-width-active" },
    "tabs-outlined-tab-border-width-active": { type: "FLOAT", unit: "px", value: 2, figmaPath: "tabs/outlined-tab-border-width-active" },
    "tabs-pills-tab-border-width-active": { type: "FLOAT", unit: "px", value: 2, figmaPath: "tabs/pills-tab-border-width-active" },
    "tabs-panel-padding": { type: "FLOAT", unit: "px", value: 12, figmaPath: "tabs/panel-padding" },
    "tabs-icon-size": { type: "FLOAT", unit: "px", value: 16, figmaPath: "tabs/icon-size" },
    "tabs-icon-stroke-width": { type: "FLOAT", unit: "px", value: 2, figmaPath: "tabs/icon-stroke-width" },
    "tabs-icon-gap": { type: "FLOAT", unit: "px", value: 8, figmaPath: "tabs/icon-gap" },
    "tabs-outlined-overflow-control-padding-x": {
      type: "FLOAT",
      unit: "px",
      value: 16,
      figmaPath: "tabs/outlined-overflow-control-padding-x",
    },
    "tabs-outlined-overflow-control-padding-y": {
      type: "FLOAT",
      unit: "px",
      value: 16,
      figmaPath: "tabs/outlined-overflow-control-padding-y",
    },
  },

  accordion: {
    // ── DEFAULT VARIANT ──
    "accordion-default-header-background": { type: "COLOR", semantic: "transparent", figmaPath: "accordion/default-header-background" },
    "accordion-default-header-background-hover": { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "accordion/default-header-background-hover" },
    "accordion-default-header-background-focus": { type: "COLOR", semantic: "surface-default", figmaPath: "accordion/default-header-background-focus" },
    "accordion-default-header-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "accordion/default-header-background-disabled" },
    "accordion-default-header-text": { type: "COLOR", semantic: "text-default", figmaPath: "accordion/default-header-text" },
    "accordion-default-header-text-hover": { type: "COLOR", semantic: "text-default", figmaPath: "accordion/default-header-text-hover" },
    "accordion-default-header-text-focus": { type: "COLOR", semantic: "text-default", figmaPath: "accordion/default-header-text-focus" },
    "accordion-default-header-text-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "accordion/default-header-text-disabled" },
    "accordion-default-header-icon": { type: "COLOR", semantic: "text-subtle", figmaPath: "accordion/default-header-icon" },
    "accordion-default-header-icon-hover": { type: "COLOR", semantic: "text-default", figmaPath: "accordion/default-header-icon-hover" },
    "accordion-default-header-icon-focus": { type: "COLOR", semantic: "text-default", figmaPath: "accordion/default-header-icon-focus" },
    "accordion-default-header-icon-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "accordion/default-header-icon-disabled" },
    "accordion-default-header-border": { type: "COLOR", semantic: "border-default", figmaPath: "accordion/default-header-border" },
    "accordion-default-header-border-hover": { type: "COLOR", semantic: "border-default", figmaPath: "accordion/default-header-border-hover" },
    "accordion-default-header-border-focus": { type: "COLOR", semantic: "border-focus", figmaPath: "accordion/default-header-border-focus" },
    "accordion-default-header-border-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "accordion/default-header-border-disabled" },

    // ── CONTAINED VARIANT ──
    "accordion-contained-header-background": { type: "COLOR", semantic: "surface-secondary", figmaPath: "accordion/contained-header-background" },
    "accordion-contained-header-background-hover": { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "accordion/contained-header-background-hover" },
    "accordion-contained-header-background-focus": { type: "COLOR", semantic: "surface-secondary", figmaPath: "accordion/contained-header-background-focus" },
    "accordion-contained-header-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "accordion/contained-header-background-disabled" },
    "accordion-contained-header-text": { type: "COLOR", semantic: "text-default", figmaPath: "accordion/contained-header-text" },
    "accordion-contained-header-text-hover": { type: "COLOR", semantic: "text-default", figmaPath: "accordion/contained-header-text-hover" },
    "accordion-contained-header-text-focus": { type: "COLOR", semantic: "text-default", figmaPath: "accordion/contained-header-text-focus" },
    "accordion-contained-header-text-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "accordion/contained-header-text-disabled" },
    "accordion-contained-header-icon": { type: "COLOR", semantic: "text-subtle", figmaPath: "accordion/contained-header-icon" },
    "accordion-contained-header-icon-hover": { type: "COLOR", semantic: "text-default", figmaPath: "accordion/contained-header-icon-hover" },
    "accordion-contained-header-icon-focus": { type: "COLOR", semantic: "text-default", figmaPath: "accordion/contained-header-icon-focus" },
    "accordion-contained-header-icon-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "accordion/contained-header-icon-disabled" },
    "accordion-contained-header-border": { type: "COLOR", semantic: "border-default", figmaPath: "accordion/contained-header-border" },
    "accordion-contained-header-border-hover": { type: "COLOR", semantic: "border-default", figmaPath: "accordion/contained-header-border-hover" },
    "accordion-contained-header-border-focus": { type: "COLOR", semantic: "border-focus", figmaPath: "accordion/contained-header-border-focus" },
    "accordion-contained-header-border-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "accordion/contained-header-border-disabled" },

    // ── FILLED VARIANT ──
    "accordion-filled-header-background": { type: "COLOR", semantic: "interactive-primary", figmaPath: "accordion/filled-header-background" },
    "accordion-filled-header-background-hover": { type: "COLOR", semantic: "interactive-primary-hover", figmaPath: "accordion/filled-header-background-hover" },
    "accordion-filled-header-background-focus": { type: "COLOR", semantic: "interactive-primary", figmaPath: "accordion/filled-header-background-focus" },
    "accordion-filled-header-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "accordion/filled-header-background-disabled" },
    "accordion-filled-header-text": { type: "COLOR", semantic: "text-on-interactive", figmaPath: "accordion/filled-header-text" },
    "accordion-filled-header-text-hover": { type: "COLOR", semantic: "text-on-interactive", figmaPath: "accordion/filled-header-text-hover" },
    "accordion-filled-header-text-focus": { type: "COLOR", semantic: "text-on-interactive", figmaPath: "accordion/filled-header-text-focus" },
    "accordion-filled-header-text-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "accordion/filled-header-text-disabled" },
    "accordion-filled-header-icon": { type: "COLOR", semantic: "text-on-interactive", figmaPath: "accordion/filled-header-icon" },
    "accordion-filled-header-icon-hover": { type: "COLOR", semantic: "text-on-interactive", figmaPath: "accordion/filled-header-icon-hover" },
    "accordion-filled-header-icon-focus": { type: "COLOR", semantic: "text-on-interactive", figmaPath: "accordion/filled-header-icon-focus" },
    "accordion-filled-header-icon-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "accordion/filled-header-icon-disabled" },
    "accordion-filled-header-border": { type: "COLOR", semantic: "interactive-primary", figmaPath: "accordion/filled-header-border" },
    "accordion-filled-header-border-hover": { type: "COLOR", semantic: "interactive-primary-hover", figmaPath: "accordion/filled-header-border-hover" },
    "accordion-filled-header-border-focus": { type: "COLOR", semantic: "interactive-primary", figmaPath: "accordion/filled-header-border-focus" },
    "accordion-filled-header-border-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "accordion/filled-header-border-disabled" },

    // ── PANEL/CONTENT COLORS BY VARIANT ──
    "accordion-default-panel-background": { type: "COLOR", semantic: "surface-default", figmaPath: "accordion/default-panel-background" },
    "accordion-default-panel-border": { type: "COLOR", semantic: "border-default", figmaPath: "accordion/default-panel-border" },
    "accordion-default-content-text": { type: "COLOR", semantic: "text-subtle", figmaPath: "accordion/default-content-text" },
    "accordion-contained-panel-background": { type: "COLOR", semantic: "surface-default", figmaPath: "accordion/contained-panel-background" },
    "accordion-contained-panel-border": { type: "COLOR", semantic: "border-default", figmaPath: "accordion/contained-panel-border" },
    "accordion-contained-content-text": { type: "COLOR", semantic: "text-subtle", figmaPath: "accordion/contained-content-text" },
    "accordion-filled-panel-background": { type: "COLOR", semantic: "surface-default", figmaPath: "accordion/filled-panel-background" },
    "accordion-filled-panel-border": { type: "COLOR", semantic: "border-default", figmaPath: "accordion/filled-panel-border" },
    "accordion-filled-content-text": { type: "COLOR", semantic: "text-subtle", figmaPath: "accordion/filled-content-text" },
    "accordion-focus-ring": { type: "COLOR", semantic: "border-focus", figmaPath: "accordion/focus-ring" },

    // ── FLOAT TOKENS ──
    "accordion-header-padding-x": { type: "FLOAT", unit: "px", value: 12, figmaPath: "accordion/header-padding-x" },
    "accordion-header-padding-y": { type: "FLOAT", unit: "px", value: 8, figmaPath: "accordion/header-padding-y" },
    "accordion-panel-padding-x": { type: "FLOAT", unit: "px", value: 12, figmaPath: "accordion/panel-padding-x" },
    "accordion-panel-padding-y": { type: "FLOAT", unit: "px", value: 12, figmaPath: "accordion/panel-padding-y" },
    "accordion-gap": { type: "FLOAT", unit: "px", value: 8, figmaPath: "accordion/gap" },
    "accordion-border-width": { type: "FLOAT", unit: "px", value: 1, figmaPath: "accordion/border-width" },
    "accordion-default-radius": { type: "FLOAT", unit: "px", value: 4, figmaPath: "accordion/default-radius" },
    "accordion-contained-radius": { type: "FLOAT", unit: "px", value: 4, figmaPath: "accordion/contained-radius" },
    "accordion-filled-radius": { type: "FLOAT", unit: "px", value: 4, figmaPath: "accordion/filled-radius" },
    "accordion-icon-size": { type: "FLOAT", unit: "px", value: 20, figmaPath: "accordion/icon-size" },
    "accordion-icon-stroke-width": { type: "FLOAT", unit: "px", value: 2, figmaPath: "accordion/icon-stroke-width" },
    "accordion-label-font-size": { type: "FLOAT", unit: "px", value: 12, figmaPath: "accordion/label-font-size" },
    "accordion-label-line-height": { type: "FLOAT", unit: "px", value: 16, figmaPath: "accordion/label-line-height" },
    "accordion-content-font-size": { type: "FLOAT", unit: "px", value: 14, figmaPath: "accordion/content-font-size" },
    "accordion-content-line-height": { type: "FLOAT", unit: "px", value: 20, figmaPath: "accordion/content-line-height" },

    // ── STRING TOKENS ──
    "accordion-label-font-family": { type: "STRING", value: "Inter", figmaPath: "accordion/label-font-family" },
    "accordion-label-font-weight": { type: "STRING", value: "Semi Bold", figmaPath: "accordion/label-font-weight" },
    "accordion-content-font-family": { type: "STRING", value: "Inter", figmaPath: "accordion/content-font-family" },
    "accordion-content-font-weight": { type: "STRING", value: "Regular", figmaPath: "accordion/content-font-weight" },
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
    "switch-track-border-checked":  { type: "COLOR", semantic: "interactive-primary", figmaPath: "switch/track-border-checked" },
    "switch-track-border-checked-hover": { type: "COLOR", semantic: "interactive-primary-hover", figmaPath: "switch/track-border-checked-hover" },
    "switch-track-border-checked-focus": { type: "COLOR", semantic: "interactive-primary", figmaPath: "switch/track-border-checked-focus" },
    "switch-track-border-checked-pressed": { type: "COLOR", semantic: "interactive-primary-pressed", figmaPath: "switch/track-border-checked-pressed" },

    // ── THUMB BACKGROUND ──
    "switch-thumb-background":          { type: "COLOR", semantic: "surface-default", figmaPath: "switch/thumb-background" },
    "switch-thumb-background-disabled": { type: "COLOR", semantic: "surface-default", figmaPath: "switch/thumb-background-disabled" },

    // ── LABEL TEXT ──
    "switch-label-text":          { type: "COLOR", semantic: "text-default",  figmaPath: "switch/label-text" },
    "switch-label-text-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "switch/label-text-disabled" },

    // ── SHARED COLOR TOKEN ──
    "switch-focus-ring": { type: "COLOR", semantic: "border-focus", figmaPath: "switch/focus-ring" },

    // ── FLOAT TOKENS (size variants: xs, sm, md, lg, xl) ──
    "switch-width":              { type: "FLOAT", unit: "px", sizes: { default: 42, xs: 28, sm: 34, md: 42, lg: 52, xl: 64 },           figmaPath: "switch/width" },
    "switch-height":             { type: "FLOAT", unit: "px", sizes: { default: 22, xs: 16, sm: 18, md: 22, lg: 28, xl: 34 },           figmaPath: "switch/height" },
    "switch-thumb-size":         { type: "FLOAT", unit: "px", sizes: { default: 18, xs: 12, sm: 14, md: 18, lg: 24, xl: 30 },           figmaPath: "switch/thumb-size" },
    "switch-border-radius":      { type: "FLOAT", unit: "px", sizes: { default: 11, xs: 8,  sm: 9,  md: 11, lg: 14, xl: 17 },           figmaPath: "switch/border-radius" },
    "switch-label-font-size":    { type: "FLOAT", unit: "px", sizes: { default: 16, xs: 12, sm: 14, md: 16, lg: 18, xl: 20 },           figmaPath: "switch/label-font-size" },
    "switch-label-line-height":  { type: "FLOAT", unit: "px", sizes: { default: 24, xs: 16, sm: 20, md: 24, lg: 28, xl: 32 },   figmaPath: "switch/label-line-height" },
    "switch-label-font-family":  { type: "STRING", value: "Inter", figmaPath: "switch/label-font-family" },
    "switch-label-font-weight":  { type: "STRING", value: "Regular", figmaPath: "switch/label-font-weight" },
    "switch-label-gap":          { type: "FLOAT", unit: "px", sizes: { default: 10, xs: 6, sm: 8, md: 10, lg: 12, xl: 14 },             figmaPath: "switch/label-gap" },

    // ── FLOAT TOKENS (single value, shared across all sizes) ──
    "switch-track-border-width": { type: "FLOAT", unit: "px", value: 1.5, figmaPath: "switch/track-border-width" },
  },

  burger: {
    // ── BUTTON BACKGROUND (per state) ──
    "burger-background":          { type: "COLOR", semantic: "transparent",                figmaPath: "burger/background" },
    "burger-background-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "burger/background-hover" },
    "burger-background-focus":    { type: "COLOR", semantic: "transparent",                figmaPath: "burger/background-focus" },
    "burger-background-disabled": { type: "COLOR", semantic: "transparent",                figmaPath: "burger/background-disabled" },

    // ── LINE COLOR (per state) ──
    "burger-color":          { type: "COLOR", semantic: "text-default",  figmaPath: "burger/color" },
    "burger-color-hover":    { type: "COLOR", semantic: "text-default",  figmaPath: "burger/color-hover" },
    "burger-color-focus":    { type: "COLOR", semantic: "text-default",  figmaPath: "burger/color-focus" },
    "burger-color-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "burger/color-disabled" },

    // ── SHARED COLOR TOKEN ──
    "burger-focus-ring": { type: "COLOR", semantic: "border-focus", figmaPath: "burger/focus-ring" },

    // ── FLOAT TOKENS (size variants: default, xs, sm, md, lg, xl) ──
    "burger-size":      { type: "FLOAT", unit: "px", sizes: { default: 24, xs: 12, sm: 18, md: 24, lg: 34, xl: 42 }, figmaPath: "burger/size" },
    "burger-line-size": { type: "FLOAT", unit: "px", sizes: { default: 2,  xs: 1,  sm: 2,  md: 2,  lg: 3,  xl: 4 },  figmaPath: "burger/line-size" },
    "burger-line-gap":  { type: "FLOAT", unit: "px", sizes: { default: 6,  xs: 3,  sm: 5,  md: 6,  lg: 9,  xl: 11 }, figmaPath: "burger/line-gap" },
    "burger-padding":   { type: "FLOAT", unit: "px", sizes: { default: 8,  xs: 4,  sm: 6,  md: 8,  lg: 10, xl: 12 }, figmaPath: "burger/padding" },
    "burger-radius":    { type: "FLOAT", unit: "px", sizes: { default: 8,  xs: 4,  sm: 6,  md: 8,  lg: 12, xl: 16 }, figmaPath: "burger/radius" },

    // ── FLOAT TOKENS (single value, shared across all sizes) ──
    "burger-line-radius":      { type: "FLOAT", unit: "px", value: 2, figmaPath: "burger/line-radius" },
    "burger-focus-ring-width": { type: "FLOAT", unit: "px", value: 2, figmaPath: "burger/focus-ring-width" },
  },

  segmentedcontrol: {
    // ── ROOT (TRACK) ──
    "segmentedcontrol-root-background":          { type: "COLOR", semantic: "interactive-secondary", figmaPath: "segmentedcontrol/root-background" },
    "segmentedcontrol-root-background-disabled": { type: "COLOR", semantic: "interactive-disabled",  figmaPath: "segmentedcontrol/root-background-disabled" },
    "segmentedcontrol-root-border":              { type: "COLOR", semantic: "border-subtle",         figmaPath: "segmentedcontrol/root-border" },
    "segmentedcontrol-root-border-disabled":     { type: "COLOR", semantic: "border-disabled",       figmaPath: "segmentedcontrol/root-border-disabled" },

    // ── INDICATOR (ACTIVE CONTROL) ──
    "segmentedcontrol-indicator-background":          { type: "COLOR", semantic: "surface-default",      figmaPath: "segmentedcontrol/indicator-background" },
    "segmentedcontrol-indicator-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "segmentedcontrol/indicator-background-disabled" },
    "segmentedcontrol-indicator-border":              { type: "COLOR", semantic: "border-default",       figmaPath: "segmentedcontrol/indicator-border" },
    "segmentedcontrol-indicator-border-disabled":     { type: "COLOR", semantic: "border-disabled",      figmaPath: "segmentedcontrol/indicator-border-disabled" },

    // ── LABEL TEXT (per state) ──
    "segmentedcontrol-label-text":          { type: "COLOR", semantic: "text-subtle",   figmaPath: "segmentedcontrol/label-text" },
    "segmentedcontrol-label-text-hover":    { type: "COLOR", semantic: "text-default",  figmaPath: "segmentedcontrol/label-text-hover" },
    "segmentedcontrol-label-text-active":   { type: "COLOR", semantic: "text-default",  figmaPath: "segmentedcontrol/label-text-active" },
    "segmentedcontrol-label-text-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "segmentedcontrol/label-text-disabled" },

    // ── FLOAT TOKENS (size variants: default, xs, sm, md, lg, xl) ──
    "segmentedcontrol-font-size":   { type: "FLOAT", unit: "px", sizes: { default: 14, xs: 12, sm: 13, md: 14, lg: 16, xl: 18 }, figmaPath: "segmentedcontrol/font-size" },
    "segmentedcontrol-line-height": { type: "FLOAT", unit: "px", sizes: { default: 20, xs: 18, sm: 18, md: 20, lg: 22, xl: 26 }, figmaPath: "segmentedcontrol/line-height" },
    "segmentedcontrol-padding-x":   { type: "FLOAT", unit: "px", sizes: { default: 12, xs: 8,  sm: 10, md: 12, lg: 16, xl: 20 }, figmaPath: "segmentedcontrol/padding-x" },
    "segmentedcontrol-padding-y":        { type: "FLOAT", unit: "px", sizes: { default: 7,  xs: 4,  sm: 6,  md: 7,  lg: 9,  xl: 11 }, figmaPath: "segmentedcontrol/padding-y" },
    "segmentedcontrol-radius":           { type: "FLOAT", unit: "px", sizes: { default: 8,  xs: 4,  sm: 6,  md: 8,  lg: 12, xl: 16 }, figmaPath: "segmentedcontrol/radius" },
    "segmentedcontrol-indicator-radius": { type: "FLOAT", unit: "px", sizes: { default: 4,  xs: 2,  sm: 2,  md: 4,  lg: 8,  xl: 12 }, figmaPath: "segmentedcontrol/indicator-radius" },

    // ── FLOAT TOKENS (single value, shared across all sizes) ──
    "segmentedcontrol-font-family":            { type: "STRING", value: "Inter", figmaPath: "segmentedcontrol/font-family" },
    "segmentedcontrol-font-weight":            { type: "STRING", value: "Semi Bold", figmaPath: "segmentedcontrol/font-weight" },
    "segmentedcontrol-root-padding":           { type: "FLOAT", unit: "px", value: 4, figmaPath: "segmentedcontrol/root-padding" },
    "segmentedcontrol-root-border-width":      { type: "FLOAT", unit: "px", value: 1, figmaPath: "segmentedcontrol/root-border-width" },
    "segmentedcontrol-indicator-border-width": { type: "FLOAT", unit: "px", value: 1, figmaPath: "segmentedcontrol/indicator-border-width" },
  },

  checkbox: {
    // ── FILLED VARIANT ──
    "checkbox-filled-background":          { type: "COLOR", semantic: "surface-default",      figmaPath: "checkbox/filled-background" },
    "checkbox-filled-background-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "checkbox/filled-background-hover" },
    "checkbox-filled-background-focus":    { type: "COLOR", semantic: "surface-default",      figmaPath: "checkbox/filled-background-focus" },
    "checkbox-filled-background-pressed":  { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "checkbox/filled-background-pressed" },
    "checkbox-filled-background-checked":  { type: "COLOR", semantic: "interactive-primary",   figmaPath: "checkbox/filled-background-checked" },
    "checkbox-filled-background-checked-hover":  { type: "COLOR", semantic: "interactive-primary-hover",   figmaPath: "checkbox/filled-background-checked-hover" },
    "checkbox-filled-background-checked-focus":  { type: "COLOR", semantic: "interactive-primary",         figmaPath: "checkbox/filled-background-checked-focus" },
    "checkbox-filled-background-checked-pressed": { type: "COLOR", semantic: "interactive-primary-pressed", figmaPath: "checkbox/filled-background-checked-pressed" },
    "checkbox-filled-background-disabled": { type: "COLOR", semantic: "interactive-disabled",  figmaPath: "checkbox/filled-background-disabled" },
    "checkbox-filled-border":              { type: "COLOR", semantic: "border-default",        figmaPath: "checkbox/filled-border" },
    "checkbox-filled-border-hover":        { type: "COLOR", semantic: "border-default",        figmaPath: "checkbox/filled-border-hover" },
    "checkbox-filled-border-focus":        { type: "COLOR", semantic: "border-default",        figmaPath: "checkbox/filled-border-focus" },
    "checkbox-filled-border-pressed":      { type: "COLOR", semantic: "border-default",        figmaPath: "checkbox/filled-border-pressed" },
    "checkbox-filled-border-checked":      { type: "COLOR", semantic: "interactive-primary",   figmaPath: "checkbox/filled-border-checked" },
    "checkbox-filled-border-checked-hover": { type: "COLOR", semantic: "interactive-primary-hover",   figmaPath: "checkbox/filled-border-checked-hover" },
    "checkbox-filled-border-checked-focus": { type: "COLOR", semantic: "interactive-primary",         figmaPath: "checkbox/filled-border-checked-focus" },
    "checkbox-filled-border-checked-pressed": { type: "COLOR", semantic: "interactive-primary-pressed", figmaPath: "checkbox/filled-border-checked-pressed" },
    "checkbox-filled-border-disabled":     { type: "COLOR", semantic: "border-disabled",       figmaPath: "checkbox/filled-border-disabled" },
    "checkbox-filled-icon-color":          { type: "COLOR", semantic: "text-on-interactive",   figmaPath: "checkbox/filled-icon-color" },
    "checkbox-filled-icon-color-disabled": { type: "COLOR", semantic: "text-disabled",         figmaPath: "checkbox/filled-icon-color-disabled" },

    // ── OUTLINED VARIANT ──
    "checkbox-outlined-background":          { type: "COLOR", semantic: "surface-default",      figmaPath: "checkbox/outlined-background" },
    "checkbox-outlined-background-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "checkbox/outlined-background-hover" },
    "checkbox-outlined-background-focus":    { type: "COLOR", semantic: "surface-default",      figmaPath: "checkbox/outlined-background-focus" },
    "checkbox-outlined-background-pressed":  { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "checkbox/outlined-background-pressed" },
    "checkbox-outlined-background-checked":  { type: "COLOR", semantic: "surface-default",      figmaPath: "checkbox/outlined-background-checked" },
    "checkbox-outlined-background-checked-hover":  { type: "COLOR", semantic: "surface-default",      figmaPath: "checkbox/outlined-background-checked-hover" },
    "checkbox-outlined-background-checked-focus":  { type: "COLOR", semantic: "surface-default",      figmaPath: "checkbox/outlined-background-checked-focus" },
    "checkbox-outlined-background-checked-pressed": { type: "COLOR", semantic: "surface-default",      figmaPath: "checkbox/outlined-background-checked-pressed" },
    "checkbox-outlined-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "checkbox/outlined-background-disabled" },
    "checkbox-outlined-border":              { type: "COLOR", semantic: "border-default",       figmaPath: "checkbox/outlined-border" },
    "checkbox-outlined-border-hover":        { type: "COLOR", semantic: "border-default",       figmaPath: "checkbox/outlined-border-hover" },
    "checkbox-outlined-border-focus":        { type: "COLOR", semantic: "border-default",       figmaPath: "checkbox/outlined-border-focus" },
    "checkbox-outlined-border-pressed":      { type: "COLOR", semantic: "border-default",       figmaPath: "checkbox/outlined-border-pressed" },
    "checkbox-outlined-border-checked":      { type: "COLOR", semantic: "interactive-primary",  figmaPath: "checkbox/outlined-border-checked" },
    "checkbox-outlined-border-checked-hover": { type: "COLOR", semantic: "interactive-primary-hover",  figmaPath: "checkbox/outlined-border-checked-hover" },
    "checkbox-outlined-border-checked-focus": { type: "COLOR", semantic: "interactive-primary",        figmaPath: "checkbox/outlined-border-checked-focus" },
    "checkbox-outlined-border-checked-pressed": { type: "COLOR", semantic: "interactive-primary-pressed", figmaPath: "checkbox/outlined-border-checked-pressed" },
    "checkbox-outlined-border-disabled":     { type: "COLOR", semantic: "border-disabled",      figmaPath: "checkbox/outlined-border-disabled" },
    "checkbox-outlined-icon-color":          { type: "COLOR", semantic: "interactive-primary",  figmaPath: "checkbox/outlined-icon-color" },
    "checkbox-outlined-icon-color-hover":    { type: "COLOR", semantic: "interactive-primary-hover",  figmaPath: "checkbox/outlined-icon-color-hover" },
    "checkbox-outlined-icon-color-focus":    { type: "COLOR", semantic: "interactive-primary",  figmaPath: "checkbox/outlined-icon-color-focus" },
    "checkbox-outlined-icon-color-pressed":  { type: "COLOR", semantic: "interactive-primary-pressed",  figmaPath: "checkbox/outlined-icon-color-pressed" },
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
    "checkbox-icon-stroke-width": { type: "FLOAT", unit: "px", sizes: { xs: 1.25, sm: 1.5, md: 1.75, lg: 2, xl: 2.25 },     figmaPath: "checkbox/icon-stroke-width" },
    "checkbox-label-font-size":   { type: "FLOAT", unit: "px", sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 },           figmaPath: "checkbox/label-font-size" },
    "checkbox-label-line-height": { type: "FLOAT", unit: "px", sizes: { xs: 16, sm: 20, md: 24, lg: 28, xl: 32 },   figmaPath: "checkbox/label-line-height" },
    "checkbox-label-font-family": { type: "STRING", value: "Inter", figmaPath: "checkbox/label-font-family" },
    "checkbox-label-font-weight": { type: "STRING", value: "Regular", figmaPath: "checkbox/label-font-weight" },
    "checkbox-label-gap":         { type: "FLOAT", unit: "px", sizes: { xs: 6, sm: 8, md: 10, lg: 12, xl: 14 },             figmaPath: "checkbox/label-gap" },

    // ── FLOAT TOKENS (single value, shared across all sizes) ──
    "checkbox-border-width": { type: "FLOAT", unit: "px", value: 1.5, figmaPath: "checkbox/border-width" },
  },

  radio: {
    // ── RADIO BACKGROUND — UNCHECKED (per state) ──
    "radio-filled-background":          { type: "COLOR", semantic: "surface-default",            figmaPath: "radio/filled-background" },
    "radio-filled-background-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "radio/filled-background-hover" },
    "radio-filled-background-focus":    { type: "COLOR", semantic: "surface-default",            figmaPath: "radio/filled-background-focus" },
    "radio-filled-background-pressed":  { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "radio/filled-background-pressed" },
    "radio-filled-background-disabled": { type: "COLOR", semantic: "interactive-disabled",        figmaPath: "radio/filled-background-disabled" },
    "radio-outline-background":          { type: "COLOR", semantic: "surface-default",            figmaPath: "radio/outline-background" },
    "radio-outline-background-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "radio/outline-background-hover" },
    "radio-outline-background-focus":    { type: "COLOR", semantic: "surface-default",            figmaPath: "radio/outline-background-focus" },
    "radio-outline-background-pressed":  { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "radio/outline-background-pressed" },
    "radio-outline-background-disabled": { type: "COLOR", semantic: "interactive-disabled",        figmaPath: "radio/outline-background-disabled" },
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

    // ── RADIO BORDER — FILLED (per state) ──
    "radio-filled-border":          { type: "COLOR", semantic: "border-default",  figmaPath: "radio/filled-border" },
    "radio-filled-border-hover":    { type: "COLOR", semantic: "border-default",  figmaPath: "radio/filled-border-hover" },
    "radio-filled-border-focus":    { type: "COLOR", semantic: "border-default",  figmaPath: "radio/filled-border-focus" },
    "radio-filled-border-pressed":  { type: "COLOR", semantic: "border-default",  figmaPath: "radio/filled-border-pressed" },
    "radio-filled-border-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "radio/filled-border-disabled" },

    // ── RADIO BORDER — OUTLINE (per state) ──
    "radio-outline-border":                  { type: "COLOR", semantic: "border-default",              figmaPath: "radio/outline-border" },
    "radio-outline-border-hover":            { type: "COLOR", semantic: "border-default",              figmaPath: "radio/outline-border-hover" },
    "radio-outline-border-focus":            { type: "COLOR", semantic: "border-default",              figmaPath: "radio/outline-border-focus" },
    "radio-outline-border-pressed":          { type: "COLOR", semantic: "border-default",              figmaPath: "radio/outline-border-pressed" },
    "radio-outline-border-disabled":         { type: "COLOR", semantic: "border-disabled",             figmaPath: "radio/outline-border-disabled" },
    "radio-outline-border-checked":          { type: "COLOR", semantic: "interactive-primary",         figmaPath: "radio/outline-border-checked" },
    "radio-outline-border-checked-hover":    { type: "COLOR", semantic: "interactive-primary-hover",   figmaPath: "radio/outline-border-checked-hover" },
    "radio-outline-border-checked-focus":    { type: "COLOR", semantic: "interactive-primary",         figmaPath: "radio/outline-border-checked-focus" },
    "radio-outline-border-checked-pressed":  { type: "COLOR", semantic: "interactive-primary-pressed", figmaPath: "radio/outline-border-checked-pressed" },
    "radio-outline-border-checked-disabled": { type: "COLOR", semantic: "border-disabled",             figmaPath: "radio/outline-border-checked-disabled" },

    // ── RADIO ICON (dot) COLOR — FILLED CHECKED (per state) ──
    "radio-filled-icon-color-checked":          { type: "COLOR", semantic: "text-on-interactive", figmaPath: "radio/filled-icon-color-checked" },
    "radio-filled-icon-color-checked-hover":    { type: "COLOR", semantic: "text-on-interactive", figmaPath: "radio/filled-icon-color-checked-hover" },
    "radio-filled-icon-color-checked-focus":    { type: "COLOR", semantic: "text-on-interactive", figmaPath: "radio/filled-icon-color-checked-focus" },
    "radio-filled-icon-color-checked-pressed":  { type: "COLOR", semantic: "text-on-interactive", figmaPath: "radio/filled-icon-color-checked-pressed" },
    "radio-filled-icon-color-checked-disabled": { type: "COLOR", semantic: "text-disabled",       figmaPath: "radio/filled-icon-color-checked-disabled" },

    // ── RADIO ICON (dot) COLOR — OUTLINE CHECKED (per state) ──
    "radio-outline-icon-color-checked":          { type: "COLOR", semantic: "interactive-primary",         figmaPath: "radio/outline-icon-color-checked" },
    "radio-outline-icon-color-checked-hover":    { type: "COLOR", semantic: "interactive-primary-hover",   figmaPath: "radio/outline-icon-color-checked-hover" },
    "radio-outline-icon-color-checked-focus":    { type: "COLOR", semantic: "interactive-primary",         figmaPath: "radio/outline-icon-color-checked-focus" },
    "radio-outline-icon-color-checked-pressed":  { type: "COLOR", semantic: "interactive-primary-pressed", figmaPath: "radio/outline-icon-color-checked-pressed" },
    "radio-outline-icon-color-checked-disabled": { type: "COLOR", semantic: "text-disabled",               figmaPath: "radio/outline-icon-color-checked-disabled" },

    // ── LABEL TEXT ──
    "radio-label-text":          { type: "COLOR", semantic: "text-default",  figmaPath: "radio/label-text" },
    "radio-label-text-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "radio/label-text-disabled" },

    // ── SHARED COLOR TOKEN ──
    "radio-focus-ring": { type: "COLOR", semantic: "border-focus", figmaPath: "radio/focus-ring" },

    // ── FLOAT TOKENS (size variants: xs, sm, md, lg, xl) ──
    "radio-size":              { type: "FLOAT", unit: "px", sizes: { xs: 16, sm: 20, md: 24, lg: 28, xl: 32 },           figmaPath: "radio/size" },
    "radio-icon-size":         { type: "FLOAT", unit: "px", sizes: { xs: 6,  sm: 8,  md: 10, lg: 12, xl: 14 },           figmaPath: "radio/icon-size" },
    "radio-label-font-size":   { type: "FLOAT", unit: "px", sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 },           figmaPath: "radio/label-font-size" },
    "radio-label-line-height": { type: "FLOAT", unit: "px", sizes: { xs: 16, sm: 20, md: 24, lg: 28, xl: 32 },   figmaPath: "radio/label-line-height" },
    "radio-label-font-family": { type: "STRING", value: "Inter", figmaPath: "radio/label-font-family" },
    "radio-label-font-weight": { type: "STRING", value: "Regular", figmaPath: "radio/label-font-weight" },
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
    "chip-filled-background":          { type: "COLOR", semantic: "surface-default",            figmaPath: "chip/filled-background" },
    "chip-filled-background-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "chip/filled-background-hover" },
    "chip-filled-background-focus":    { type: "COLOR", semantic: "surface-default",            figmaPath: "chip/filled-background-focus" },
    "chip-filled-background-pressed":  { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "chip/filled-background-pressed" },
    "chip-filled-background-disabled": { type: "COLOR", semantic: "interactive-disabled",        figmaPath: "chip/filled-background-disabled" },
    "chip-light-background":           { type: "COLOR", semantic: "surface-default",            figmaPath: "chip/light-background" },
    "chip-light-background-hover":     { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "chip/light-background-hover" },
    "chip-light-background-focus":     { type: "COLOR", semantic: "surface-default",            figmaPath: "chip/light-background-focus" },
    "chip-light-background-pressed":   { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "chip/light-background-pressed" },
    "chip-light-background-disabled":  { type: "COLOR", semantic: "interactive-disabled",        figmaPath: "chip/light-background-disabled" },
    "chip-outline-background":         { type: "COLOR", semantic: "surface-default",            figmaPath: "chip/outline-background" },
    "chip-outline-background-hover":   { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "chip/outline-background-hover" },
    "chip-outline-background-focus":   { type: "COLOR", semantic: "surface-default",            figmaPath: "chip/outline-background-focus" },
    "chip-outline-background-pressed": { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "chip/outline-background-pressed" },
    "chip-outline-background-disabled": { type: "COLOR", semantic: "interactive-disabled",       figmaPath: "chip/outline-background-disabled" },

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
    "chip-filled-border":          { type: "COLOR", semantic: "border-default",  figmaPath: "chip/filled-border" },
    "chip-filled-border-hover":    { type: "COLOR", semantic: "border-default",  figmaPath: "chip/filled-border-hover" },
    "chip-filled-border-focus":    { type: "COLOR", semantic: "border-default",  figmaPath: "chip/filled-border-focus" },
    "chip-filled-border-pressed":  { type: "COLOR", semantic: "border-default",  figmaPath: "chip/filled-border-pressed" },
    "chip-filled-border-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "chip/filled-border-disabled" },
    "chip-light-border":           { type: "COLOR", semantic: "border-default",  figmaPath: "chip/light-border" },
    "chip-light-border-hover":     { type: "COLOR", semantic: "border-default",  figmaPath: "chip/light-border-hover" },
    "chip-light-border-focus":     { type: "COLOR", semantic: "border-default",  figmaPath: "chip/light-border-focus" },
    "chip-light-border-pressed":   { type: "COLOR", semantic: "border-default",  figmaPath: "chip/light-border-pressed" },
    "chip-light-border-disabled":  { type: "COLOR", semantic: "border-disabled", figmaPath: "chip/light-border-disabled" },
    "chip-outline-border":         { type: "COLOR", semantic: "border-default",  figmaPath: "chip/outline-border" },
    "chip-outline-border-hover":   { type: "COLOR", semantic: "border-default",  figmaPath: "chip/outline-border-hover" },
    "chip-outline-border-focus":   { type: "COLOR", semantic: "border-default",  figmaPath: "chip/outline-border-focus" },
    "chip-outline-border-pressed": { type: "COLOR", semantic: "border-default",  figmaPath: "chip/outline-border-pressed" },
    "chip-outline-border-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "chip/outline-border-disabled" },
    "chip-filled-border-checked":  { type: "COLOR", semantic: "interactive-primary", figmaPath: "chip/filled-border-checked" },
    "chip-filled-border-checked-hover":  { type: "COLOR", semantic: "interactive-primary-hover", figmaPath: "chip/filled-border-checked-hover" },
    "chip-filled-border-checked-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "chip/filled-border-checked-disabled" },
    "chip-light-border-checked":   { type: "COLOR", semantic: "interactive-primary", figmaPath: "chip/light-border-checked" },
    "chip-light-border-checked-hover":   { type: "COLOR", semantic: "interactive-primary-hover", figmaPath: "chip/light-border-checked-hover" },
    "chip-light-border-checked-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "chip/light-border-checked-disabled" },
    "chip-outline-border-checked": { type: "COLOR", semantic: "interactive-primary", figmaPath: "chip/outline-border-checked" },
    "chip-outline-border-checked-hover": { type: "COLOR", semantic: "interactive-primary-hover", figmaPath: "chip/outline-border-checked-hover" },
    "chip-outline-border-checked-pressed": { type: "COLOR", semantic: "interactive-primary-pressed", figmaPath: "chip/outline-border-checked-pressed" },
    "chip-outline-border-checked-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "chip/outline-border-checked-disabled" },
    "chip-checked-border":  { type: "COLOR", semantic: "border-default",  figmaPath: "chip/checked-border" },

    // ── CHIP TEXT ──
    "chip-text":                         { type: "COLOR", semantic: "text-default",               figmaPath: "chip/text" },
    "chip-filled-text":                  { type: "COLOR", semantic: "text-default",               figmaPath: "chip/filled-text" },
    "chip-filled-text-hover":            { type: "COLOR", semantic: "text-default",               figmaPath: "chip/filled-text-hover" },
    "chip-filled-text-focus":            { type: "COLOR", semantic: "text-default",               figmaPath: "chip/filled-text-focus" },
    "chip-filled-text-pressed":          { type: "COLOR", semantic: "text-default",               figmaPath: "chip/filled-text-pressed" },
    "chip-filled-text-disabled":         { type: "COLOR", semantic: "text-disabled",              figmaPath: "chip/filled-text-disabled" },
    "chip-light-text":                   { type: "COLOR", semantic: "text-default",               figmaPath: "chip/light-text" },
    "chip-light-text-hover":             { type: "COLOR", semantic: "text-default",               figmaPath: "chip/light-text-hover" },
    "chip-light-text-focus":             { type: "COLOR", semantic: "text-default",               figmaPath: "chip/light-text-focus" },
    "chip-light-text-pressed":           { type: "COLOR", semantic: "text-default",               figmaPath: "chip/light-text-pressed" },
    "chip-light-text-disabled":          { type: "COLOR", semantic: "text-disabled",              figmaPath: "chip/light-text-disabled" },
    "chip-outline-text":                 { type: "COLOR", semantic: "text-default",               figmaPath: "chip/outline-text" },
    "chip-outline-text-hover":           { type: "COLOR", semantic: "text-default",               figmaPath: "chip/outline-text-hover" },
    "chip-outline-text-focus":           { type: "COLOR", semantic: "text-default",               figmaPath: "chip/outline-text-focus" },
    "chip-outline-text-pressed":         { type: "COLOR", semantic: "text-default",               figmaPath: "chip/outline-text-pressed" },
    "chip-outline-text-disabled":        { type: "COLOR", semantic: "text-disabled",              figmaPath: "chip/outline-text-disabled" },
    "chip-text-pressed":                 { type: "COLOR", semantic: "text-default",               figmaPath: "chip/text-pressed" },
    "chip-text-disabled":                { type: "COLOR", semantic: "text-disabled",              figmaPath: "chip/text-disabled" },
    "chip-filled-text-checked":          { type: "COLOR", semantic: "text-on-interactive",        figmaPath: "chip/filled-text-checked" },
    "chip-filled-text-checked-pressed":  { type: "COLOR", semantic: "text-on-interactive",        figmaPath: "chip/filled-text-checked-pressed" },
    "chip-filled-text-checked-disabled": { type: "COLOR", semantic: "text-disabled",              figmaPath: "chip/filled-text-checked-disabled" },
    "chip-light-text-checked":           { type: "COLOR", semantic: "interactive-primary",        figmaPath: "chip/light-text-checked" },
    "chip-light-text-checked-pressed":   { type: "COLOR", semantic: "interactive-primary-pressed", figmaPath: "chip/light-text-checked-pressed" },
    "chip-light-text-checked-disabled":  { type: "COLOR", semantic: "text-disabled",              figmaPath: "chip/light-text-checked-disabled" },
    "chip-outline-text-checked":         { type: "COLOR", semantic: "interactive-primary",        figmaPath: "chip/outline-text-checked" },
    "chip-outline-text-checked-pressed": { type: "COLOR", semantic: "interactive-primary-pressed", figmaPath: "chip/outline-text-checked-pressed" },
    "chip-outline-text-checked-disabled": { type: "COLOR", semantic: "text-disabled",             figmaPath: "chip/outline-text-checked-disabled" },

    // ── CHIP ICON COLOR ──
    "chip-icon-color":          { type: "COLOR", semantic: "text-on-interactive", figmaPath: "chip/icon-color" },
    "chip-icon-color-disabled": { type: "COLOR", semantic: "text-disabled",       figmaPath: "chip/icon-color-disabled" },

    // ── SHARED COLOR TOKEN ──
    "chip-focus-ring": { type: "COLOR", semantic: "border-focus", figmaPath: "chip/focus-ring" },

    // ── FLOAT TOKENS (size variants: xs, sm, md, lg, xl) ──
    "chip-height":          { type: "FLOAT", unit: "px", sizes: { default: 32, xs: 23, sm: 28, md: 32, lg: 36, xl: 40 },              figmaPath: "chip/height" },
    "chip-padding-x":         { type: "FLOAT", unit: "px", sizes: { default: 24, xs: 16, sm: 20, md: 24, lg: 28, xl: 32 },              figmaPath: "chip/padding-x" },
    "chip-padding-y":         { type: "FLOAT", unit: "px", sizes: { default: 4, xs: 1, sm: 3, md: 4, lg: 6, xl: 7 },                    figmaPath: "chip/padding-y" },
    "chip-checked-padding-x": { type: "FLOAT", unit: "px", sizes: { default: 12, xs: 8, sm: 10, md: 12, lg: 14, xl: 16 },               figmaPath: "chip/checked-padding-x" },
    "chip-checked-padding-y": { type: "FLOAT", unit: "px", sizes: { default: 4, xs: 1, sm: 3, md: 4, lg: 6, xl: 7 },                    figmaPath: "chip/checked-padding-y" },
    "chip-icon-size":       { type: "FLOAT", unit: "px", sizes: { default: 14, xs: 9, sm: 12, md: 14, lg: 16, xl: 18 },               figmaPath: "chip/icon-size" },
    "chip-icon-stroke-width": { type: "FLOAT", unit: "px", sizes: { default: 1.75, xs: 1.25, sm: 1.5, md: 1.75, lg: 2, xl: 2.25 },        figmaPath: "chip/icon-stroke-width" },
    "chip-font-size":       { type: "FLOAT", unit: "px", sizes: { default: 14, xs: 10, sm: 12, md: 14, lg: 16, xl: 18 },              figmaPath: "chip/font-size" },
    "chip-font-family":     { type: "STRING", value: "Inter", figmaPath: "chip/font-family" },
    "chip-font-weight":     { type: "STRING", value: "Regular", figmaPath: "chip/font-weight" },
    "chip-line-height":     { type: "FLOAT", unit: "px", sizes: { default: 20, xs: 14, sm: 16, md: 20, lg: 24, xl: 28 }, figmaPath: "chip/line-height" },
    "chip-filled-radius":   { type: "FLOAT", unit: "px", value: 8, figmaPath: "chip/filled-radius" },
    "chip-outline-radius":  { type: "FLOAT", unit: "px", value: 8, figmaPath: "chip/outline-radius" },
    "chip-light-radius":    { type: "FLOAT", unit: "px", value: 8, figmaPath: "chip/light-radius" },
    "chip-radius":          { type: "FLOAT", unit: "px", sizes: { default: 8, xs: 2, sm: 4, md: 8, lg: 16, xl: 32 },                 figmaPath: "chip/radius" },
    "chip-spacing":         { type: "FLOAT", unit: "px", sizes: { default: 4, xs: 2, sm: 4, md: 4, lg: 6, xl: 8 },                 figmaPath: "chip/spacing" },

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
    "slider-track-height": { type: "FLOAT", unit: "px", sizes: { default: 6, xs: 2, sm: 4, md: 6, lg: 8, xl: 10 }, figmaPath: "slider/track-height" },
    "slider-thumb-size": { type: "FLOAT", unit: "px", sizes: { default: 16, xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }, figmaPath: "slider/thumb-size" },
    "slider-mark-label-font-size": { type: "FLOAT", unit: "px", sizes: { default: 12, xs: 10, sm: 11, md: 12, lg: 13, xl: 14 }, figmaPath: "slider/mark-label-font-size" },
    "slider-mark-label-font-family": { type: "STRING", value: "Inter", figmaPath: "slider/mark-label-font-family" },
    "slider-mark-label-font-weight": { type: "STRING", value: "Regular", figmaPath: "slider/mark-label-font-weight" },
    "slider-mark-label-line-height": { type: "FLOAT", unit: "px", sizes: { default: 16, xs: 14, sm: 14, md: 16, lg: 16, xl: 20 }, figmaPath: "slider/mark-label-line-height" },
    "slider-radius": { type: "FLOAT", unit: "px", sizes: { default: 8, xs: 2, sm: 4, md: 8, lg: 16, xl: 32 }, figmaPath: "slider/radius" },

    // ── FLOAT TOKENS (single value) ──
    "slider-thumb-border-width": { type: "FLOAT", unit: "px", sizes: { default: 2, xs: 1.5, sm: 1.75, md: 2, lg: 2.5, xl: 3 }, figmaPath: "slider/thumb-border-width" },
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
    "rangeslider-track-height": { type: "FLOAT", unit: "px", sizes: { default: 6, xs: 2, sm: 4, md: 6, lg: 8, xl: 10 }, figmaPath: "rangeslider/track-height" },
    "rangeslider-thumb-size": { type: "FLOAT", unit: "px", sizes: { default: 16, xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }, figmaPath: "rangeslider/thumb-size" },
    "rangeslider-mark-label-font-size": { type: "FLOAT", unit: "px", sizes: { default: 12, xs: 10, sm: 11, md: 12, lg: 13, xl: 14 }, figmaPath: "rangeslider/mark-label-font-size" },
    "rangeslider-mark-label-font-family": { type: "STRING", value: "Inter", figmaPath: "rangeslider/mark-label-font-family" },
    "rangeslider-mark-label-font-weight": { type: "STRING", value: "Regular", figmaPath: "rangeslider/mark-label-font-weight" },
    "rangeslider-mark-label-line-height": { type: "FLOAT", unit: "px", sizes: { default: 16, xs: 14, sm: 14, md: 16, lg: 16, xl: 20 }, figmaPath: "rangeslider/mark-label-line-height" },
    "rangeslider-radius": { type: "FLOAT", unit: "px", sizes: { default: 8, xs: 2, sm: 4, md: 8, lg: 16, xl: 32 }, figmaPath: "rangeslider/radius" },

    // ── FLOAT TOKENS (single value) ──
    "rangeslider-thumb-border-width": { type: "FLOAT", unit: "px", sizes: { default: 2, xs: 1.5, sm: 1.75, md: 2, lg: 2.5, xl: 3 }, figmaPath: "rangeslider/thumb-border-width" },
    "rangeslider-mark-size": { type: "FLOAT", unit: "px", value: 8, figmaPath: "rangeslider/mark-size" },
  },

  card: {
    // ── COLOR TOKENS ──
    "card-default-background":         { type: "COLOR", semantic: "surface-default",       figmaPath: "card/default-background" },
    "card-default-background-hover":   { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "card/default-background-hover" },
    "card-default-background-focus":   { type: "COLOR", semantic: "surface-default",       figmaPath: "card/default-background-focus" },
    "card-default-background-pressed": { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "card/default-background-pressed" },
    "card-default-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "card/default-background-disabled" },
    "card-default-border":             { type: "COLOR", semantic: "border-default",        figmaPath: "card/default-border" },
    "card-default-border-hover":       { type: "COLOR", semantic: "border-default",        figmaPath: "card/default-border-hover" },
    "card-default-border-focus":       { type: "COLOR", semantic: "border-focus",          figmaPath: "card/default-border-focus" },
    "card-default-border-pressed":     { type: "COLOR", semantic: "border-default",        figmaPath: "card/default-border-pressed" },
    "card-default-border-disabled":    { type: "COLOR", semantic: "border-disabled",       figmaPath: "card/default-border-disabled" },
    "card-default-title":              { type: "COLOR", semantic: "text-default",          figmaPath: "card/default-title" },
    "card-default-title-hover":        { type: "COLOR", semantic: "text-default",          figmaPath: "card/default-title-hover" },
    "card-default-title-focus":        { type: "COLOR", semantic: "text-default",          figmaPath: "card/default-title-focus" },
    "card-default-title-pressed":      { type: "COLOR", semantic: "text-default",          figmaPath: "card/default-title-pressed" },
    "card-default-title-disabled":     { type: "COLOR", semantic: "text-disabled",         figmaPath: "card/default-title-disabled" },
    "card-default-description":        { type: "COLOR", semantic: "text-default",          figmaPath: "card/default-description" },
    "card-default-description-hover":  { type: "COLOR", semantic: "text-default",          figmaPath: "card/default-description-hover" },
    "card-default-description-focus":  { type: "COLOR", semantic: "text-default",          figmaPath: "card/default-description-focus" },
    "card-default-description-pressed": { type: "COLOR", semantic: "text-default",         figmaPath: "card/default-description-pressed" },
    "card-default-description-disabled": { type: "COLOR", semantic: "text-disabled",       figmaPath: "card/default-description-disabled" },
    "card-default-section-background": { type: "COLOR", semantic: "interactive-secondary", figmaPath: "card/default-section-background" },
    "card-default-section-background-hover": { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "card/default-section-background-hover" },
    "card-default-section-background-focus": { type: "COLOR", semantic: "interactive-secondary", figmaPath: "card/default-section-background-focus" },
    "card-default-section-background-pressed": { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "card/default-section-background-pressed" },
    "card-default-section-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "card/default-section-background-disabled" },

    "card-dark-background":         { type: "COLOR", semantic: "surface-inverse",   figmaPath: "card/dark-background" },
    "card-dark-background-hover":   { type: "COLOR", semantic: "surface-inverse",   figmaPath: "card/dark-background-hover" },
    "card-dark-background-focus":   { type: "COLOR", semantic: "surface-inverse",   figmaPath: "card/dark-background-focus" },
    "card-dark-background-pressed": { type: "COLOR", semantic: "surface-inverse",   figmaPath: "card/dark-background-pressed" },
    "card-dark-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "card/dark-background-disabled" },
    "card-dark-border":             { type: "COLOR", semantic: "border-default",    figmaPath: "card/dark-border" },
    "card-dark-border-hover":       { type: "COLOR", semantic: "border-default",    figmaPath: "card/dark-border-hover" },
    "card-dark-border-focus":       { type: "COLOR", semantic: "border-focus",      figmaPath: "card/dark-border-focus" },
    "card-dark-border-pressed":     { type: "COLOR", semantic: "border-default",    figmaPath: "card/dark-border-pressed" },
    "card-dark-border-disabled":    { type: "COLOR", semantic: "border-disabled",   figmaPath: "card/dark-border-disabled" },
    "card-dark-title":              { type: "COLOR", semantic: "text-inverse",      figmaPath: "card/dark-title" },
    "card-dark-title-hover":        { type: "COLOR", semantic: "text-inverse",      figmaPath: "card/dark-title-hover" },
    "card-dark-title-focus":        { type: "COLOR", semantic: "text-inverse",      figmaPath: "card/dark-title-focus" },
    "card-dark-title-pressed":      { type: "COLOR", semantic: "text-inverse",      figmaPath: "card/dark-title-pressed" },
    "card-dark-title-disabled":     { type: "COLOR", semantic: "text-disabled",     figmaPath: "card/dark-title-disabled" },
    "card-dark-description":        { type: "COLOR", semantic: "text-inverse",      figmaPath: "card/dark-description" },
    "card-dark-description-hover":  { type: "COLOR", semantic: "text-inverse",      figmaPath: "card/dark-description-hover" },
    "card-dark-description-focus":  { type: "COLOR", semantic: "text-inverse",      figmaPath: "card/dark-description-focus" },
    "card-dark-description-pressed": { type: "COLOR", semantic: "text-inverse",     figmaPath: "card/dark-description-pressed" },
    "card-dark-description-disabled": { type: "COLOR", semantic: "text-disabled",   figmaPath: "card/dark-description-disabled" },
    "card-dark-section-background": { type: "COLOR", semantic: "surface-secondary", figmaPath: "card/dark-section-background" },
    "card-dark-section-background-hover": { type: "COLOR", semantic: "surface-secondary", figmaPath: "card/dark-section-background-hover" },
    "card-dark-section-background-focus": { type: "COLOR", semantic: "surface-secondary", figmaPath: "card/dark-section-background-focus" },
    "card-dark-section-background-pressed": { type: "COLOR", semantic: "surface-secondary", figmaPath: "card/dark-section-background-pressed" },
    "card-dark-section-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "card/dark-section-background-disabled" },

    "card-outlined-background":         { type: "COLOR", semantic: "surface-default",   figmaPath: "card/outlined-background" },
    "card-outlined-background-hover":   { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "card/outlined-background-hover" },
    "card-outlined-background-focus":   { type: "COLOR", semantic: "surface-default",   figmaPath: "card/outlined-background-focus" },
    "card-outlined-background-pressed": { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "card/outlined-background-pressed" },
    "card-outlined-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "card/outlined-background-disabled" },
    "card-outlined-border":             { type: "COLOR", semantic: "interactive-primary", figmaPath: "card/outlined-border" },
    "card-outlined-border-hover":       { type: "COLOR", semantic: "interactive-primary-hover", figmaPath: "card/outlined-border-hover" },
    "card-outlined-border-focus":       { type: "COLOR", semantic: "border-focus",      figmaPath: "card/outlined-border-focus" },
    "card-outlined-border-pressed":     { type: "COLOR", semantic: "interactive-primary-pressed", figmaPath: "card/outlined-border-pressed" },
    "card-outlined-border-disabled":    { type: "COLOR", semantic: "border-disabled",   figmaPath: "card/outlined-border-disabled" },
    "card-outlined-title":              { type: "COLOR", semantic: "text-default",      figmaPath: "card/outlined-title" },
    "card-outlined-title-hover":        { type: "COLOR", semantic: "text-default",      figmaPath: "card/outlined-title-hover" },
    "card-outlined-title-focus":        { type: "COLOR", semantic: "text-default",      figmaPath: "card/outlined-title-focus" },
    "card-outlined-title-pressed":      { type: "COLOR", semantic: "text-default",      figmaPath: "card/outlined-title-pressed" },
    "card-outlined-title-disabled":     { type: "COLOR", semantic: "text-disabled",     figmaPath: "card/outlined-title-disabled" },
    "card-outlined-description":        { type: "COLOR", semantic: "text-default",      figmaPath: "card/outlined-description" },
    "card-outlined-description-hover":  { type: "COLOR", semantic: "text-default",      figmaPath: "card/outlined-description-hover" },
    "card-outlined-description-focus":  { type: "COLOR", semantic: "text-default",      figmaPath: "card/outlined-description-focus" },
    "card-outlined-description-pressed": { type: "COLOR", semantic: "text-default",     figmaPath: "card/outlined-description-pressed" },
    "card-outlined-description-disabled": { type: "COLOR", semantic: "text-disabled",   figmaPath: "card/outlined-description-disabled" },
    "card-outlined-section-background": { type: "COLOR", semantic: "subtle-secondary", figmaPath: "card/outlined-section-background" },
    "card-outlined-section-background-hover": { type: "COLOR", semantic: "subtle-secondary", figmaPath: "card/outlined-section-background-hover" },
    "card-outlined-section-background-focus": { type: "COLOR", semantic: "subtle-secondary", figmaPath: "card/outlined-section-background-focus" },
    "card-outlined-section-background-pressed": { type: "COLOR", semantic: "subtle-secondary", figmaPath: "card/outlined-section-background-pressed" },
    "card-outlined-section-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "card/outlined-section-background-disabled" },

    "card-brand-background":         { type: "COLOR", semantic: "interactive-primary",         figmaPath: "card/brand-background" },
    "card-brand-background-hover":   { type: "COLOR", semantic: "interactive-primary-hover",   figmaPath: "card/brand-background-hover" },
    "card-brand-background-focus":   { type: "COLOR", semantic: "interactive-primary",         figmaPath: "card/brand-background-focus" },
    "card-brand-background-pressed": { type: "COLOR", semantic: "interactive-primary-pressed", figmaPath: "card/brand-background-pressed" },
    "card-brand-background-disabled": { type: "COLOR", semantic: "interactive-disabled",       figmaPath: "card/brand-background-disabled" },
    "card-brand-border":             { type: "COLOR", semantic: "interactive-primary",         figmaPath: "card/brand-border" },
    "card-brand-border-hover":       { type: "COLOR", semantic: "interactive-primary-hover",   figmaPath: "card/brand-border-hover" },
    "card-brand-border-focus":       { type: "COLOR", semantic: "border-focus",                figmaPath: "card/brand-border-focus" },
    "card-brand-border-pressed":     { type: "COLOR", semantic: "interactive-primary-pressed", figmaPath: "card/brand-border-pressed" },
    "card-brand-border-disabled":    { type: "COLOR", semantic: "border-disabled",             figmaPath: "card/brand-border-disabled" },
    "card-brand-title":              { type: "COLOR", semantic: "text-on-interactive",         figmaPath: "card/brand-title" },
    "card-brand-title-hover":        { type: "COLOR", semantic: "text-on-interactive",         figmaPath: "card/brand-title-hover" },
    "card-brand-title-focus":        { type: "COLOR", semantic: "text-on-interactive",         figmaPath: "card/brand-title-focus" },
    "card-brand-title-pressed":      { type: "COLOR", semantic: "text-on-interactive",         figmaPath: "card/brand-title-pressed" },
    "card-brand-title-disabled":     { type: "COLOR", semantic: "text-disabled",               figmaPath: "card/brand-title-disabled" },
    "card-brand-description":        { type: "COLOR", semantic: "text-on-interactive",         figmaPath: "card/brand-description" },
    "card-brand-description-hover":  { type: "COLOR", semantic: "text-on-interactive",         figmaPath: "card/brand-description-hover" },
    "card-brand-description-focus":  { type: "COLOR", semantic: "text-on-interactive",         figmaPath: "card/brand-description-focus" },
    "card-brand-description-pressed": { type: "COLOR", semantic: "text-on-interactive",        figmaPath: "card/brand-description-pressed" },
    "card-brand-description-disabled": { type: "COLOR", semantic: "text-disabled",             figmaPath: "card/brand-description-disabled" },
    "card-brand-section-background": { type: "COLOR", semantic: "interactive-primary-hover",   figmaPath: "card/brand-section-background" },
    "card-brand-section-background-hover": { type: "COLOR", semantic: "interactive-primary-hover", figmaPath: "card/brand-section-background-hover" },
    "card-brand-section-background-focus": { type: "COLOR", semantic: "interactive-primary", figmaPath: "card/brand-section-background-focus" },
    "card-brand-section-background-pressed": { type: "COLOR", semantic: "interactive-primary-pressed", figmaPath: "card/brand-section-background-pressed" },
    "card-brand-section-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "card/brand-section-background-disabled" },

    "card-transparent-background":         { type: "COLOR", semantic: "transparent",  figmaPath: "card/transparent-background" },
    "card-transparent-background-hover":   { type: "COLOR", semantic: "transparent",  figmaPath: "card/transparent-background-hover" },
    "card-transparent-background-focus":   { type: "COLOR", semantic: "transparent",  figmaPath: "card/transparent-background-focus" },
    "card-transparent-background-pressed": { type: "COLOR", semantic: "transparent",  figmaPath: "card/transparent-background-pressed" },
    "card-transparent-background-disabled": { type: "COLOR", semantic: "transparent", figmaPath: "card/transparent-background-disabled" },
    "card-transparent-border":             { type: "COLOR", semantic: "transparent",  figmaPath: "card/transparent-border" },
    "card-transparent-border-hover":       { type: "COLOR", semantic: "transparent",  figmaPath: "card/transparent-border-hover" },
    "card-transparent-border-focus":       { type: "COLOR", semantic: "transparent",  figmaPath: "card/transparent-border-focus" },
    "card-transparent-border-pressed":     { type: "COLOR", semantic: "transparent",  figmaPath: "card/transparent-border-pressed" },
    "card-transparent-border-disabled":    { type: "COLOR", semantic: "transparent",  figmaPath: "card/transparent-border-disabled" },
    "card-transparent-title":              { type: "COLOR", semantic: "text-default", figmaPath: "card/transparent-title" },
    "card-transparent-title-hover":        { type: "COLOR", semantic: "text-default", figmaPath: "card/transparent-title-hover" },
    "card-transparent-title-focus":        { type: "COLOR", semantic: "text-default", figmaPath: "card/transparent-title-focus" },
    "card-transparent-title-pressed":      { type: "COLOR", semantic: "text-default", figmaPath: "card/transparent-title-pressed" },
    "card-transparent-title-disabled":     { type: "COLOR", semantic: "text-disabled", figmaPath: "card/transparent-title-disabled" },
    "card-transparent-description":        { type: "COLOR", semantic: "text-default", figmaPath: "card/transparent-description" },
    "card-transparent-description-hover":  { type: "COLOR", semantic: "text-default", figmaPath: "card/transparent-description-hover" },
    "card-transparent-description-focus":  { type: "COLOR", semantic: "text-default", figmaPath: "card/transparent-description-focus" },
    "card-transparent-description-pressed": { type: "COLOR", semantic: "text-default", figmaPath: "card/transparent-description-pressed" },
    "card-transparent-description-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "card/transparent-description-disabled" },
    "card-transparent-section-background": { type: "COLOR", semantic: "transparent",  figmaPath: "card/transparent-section-background" },
    "card-transparent-section-background-hover": { type: "COLOR", semantic: "transparent", figmaPath: "card/transparent-section-background-hover" },
    "card-transparent-section-background-focus": { type: "COLOR", semantic: "transparent", figmaPath: "card/transparent-section-background-focus" },
    "card-transparent-section-background-pressed": { type: "COLOR", semantic: "transparent", figmaPath: "card/transparent-section-background-pressed" },
    "card-transparent-section-background-disabled": { type: "COLOR", semantic: "transparent", figmaPath: "card/transparent-section-background-disabled" },

    // ── FLOAT TOKENS (size variants: default, xs, sm, md, lg, xl) ──
    "card-padding":               { type: "FLOAT", unit: "px", sizes: { default: 16, xs: 10, sm: 12, md: 16, lg: 20, xl: 24 }, figmaPath: "card/padding" },
    "card-gap":                   { type: "FLOAT", unit: "px", sizes: { default: 12, xs: 8,  sm: 10, md: 12, lg: 14, xl: 16 }, figmaPath: "card/gap" },
    "card-radius":                { type: "FLOAT", unit: "px", sizes: { default: 8, xs: 2,  sm: 4,  md: 8,  lg: 16, xl: 32 }, figmaPath: "card/radius" },
    "card-title-font-size":       { type: "FLOAT", unit: "px", sizes: { default: 14, xs: 12, sm: 13, md: 14, lg: 16, xl: 18 }, figmaPath: "card/title-font-size" },
    "card-title-font-family":     { type: "STRING", value: "Inter", figmaPath: "card/title-font-family" },
    "card-title-font-weight":     { type: "STRING", value: "Semi Bold", figmaPath: "card/title-font-weight" },
    "card-title-line-height":     { type: "FLOAT", unit: "px", sizes: { default: 20, xs: 16, sm: 20, md: 20, lg: 24, xl: 28 }, figmaPath: "card/title-line-height" },
    "card-description-font-size": { type: "FLOAT", unit: "px", sizes: { default: 12, xs: 10, sm: 11, md: 12, lg: 13, xl: 14 }, figmaPath: "card/description-font-size" },
    "card-description-font-family": { type: "STRING", value: "Inter", figmaPath: "card/description-font-family" },
    "card-description-font-weight": { type: "STRING", value: "Regular", figmaPath: "card/description-font-weight" },
    "card-description-line-height": { type: "FLOAT", unit: "px", sizes: { default: 16, xs: 14, sm: 16, md: 16, lg: 20, xl: 20 }, figmaPath: "card/description-line-height" },

    // ── FLOAT TOKENS (single value) ──
    "card-border-width":   { type: "FLOAT", unit: "px", value: 1,  figmaPath: "card/border-width" },
    "card-section-height": { type: "FLOAT", unit: "px", value: 110, figmaPath: "card/section-height" },
    "card-shadow-blur":    { type: "FLOAT", unit: "px", value: 20, figmaPath: "card/shadow-blur" },
    "card-shadow-offset-y":{ type: "FLOAT", unit: "px", value: 6,  figmaPath: "card/shadow-offset-y" },
    "card-shadow-alpha":   { type: "FLOAT", unit: "", value: 18,   figmaPath: "card/shadow-alpha" },
  },

  notification: {
    // ── COLOR TOKENS ──
    "notification-background": { type: "COLOR", semantic: "surface-default", figmaPath: "notification/background" },
    "notification-border-default": { type: "COLOR", semantic: "border-default", figmaPath: "notification/border-default" },
    "notification-border-primary": { type: "COLOR", semantic: "border-default", figmaPath: "notification/border-primary" },
    "notification-border-error": { type: "COLOR", semantic: "feedback-error", figmaPath: "notification/border-error" },
    "notification-border-warning": { type: "COLOR", semantic: "feedback-warning", figmaPath: "notification/border-warning" },
    "notification-border-success": { type: "COLOR", semantic: "feedback-success", figmaPath: "notification/border-success" },
    "notification-title": { type: "COLOR", semantic: "text-default", figmaPath: "notification/title" },
    "notification-description": { type: "COLOR", semantic: "text-default", figmaPath: "notification/description" },
    "notification-accent": { type: "COLOR", semantic: "interactive-primary", figmaPath: "notification/accent" },
    "notification-icon": { type: "COLOR", semantic: "interactive-primary", figmaPath: "notification/icon" },
    "notification-indicator-primary": { type: "COLOR", semantic: "interactive-primary", figmaPath: "notification/indicator-primary" },
    "notification-indicator-error": { type: "COLOR", semantic: "feedback-error", figmaPath: "notification/indicator-error" },
    "notification-indicator-warning": { type: "COLOR", semantic: "feedback-warning", figmaPath: "notification/indicator-warning" },
    "notification-indicator-success": { type: "COLOR", semantic: "feedback-success", figmaPath: "notification/indicator-success" },
    "notification-indicator-dark": { type: "COLOR", semantic: "interactive-primary", figmaPath: "notification/indicator-dark" },
    "notification-border-dark": { type: "COLOR", semantic: "border-default", figmaPath: "notification/border-dark" },
    "notification-close": { type: "COLOR", semantic: "text-default", figmaPath: "notification/close" },
    // Dark tone: inverse surface + copy (semantic “chrome” toast, always valid alongside primary / error / warning / success).
    "notification-dark-background": { type: "COLOR", semantic: "surface-inverse", figmaPath: "notification/dark-background" },
    "notification-dark-title": { type: "COLOR", semantic: "text-inverse", figmaPath: "notification/dark-title" },
    "notification-dark-description": { type: "COLOR", semantic: "text-subtle", figmaPath: "notification/dark-description" },
    "notification-dark-accent": { type: "COLOR", semantic: "interactive-primary", figmaPath: "notification/dark-accent" },
    "notification-dark-icon": { type: "COLOR", semantic: "text-inverse", figmaPath: "notification/dark-icon" },
    "notification-dark-close": { type: "COLOR", semantic: "text-inverse", figmaPath: "notification/dark-close" },

    // ── FLOAT TOKENS ──
    "notification-radius": { type: "FLOAT", unit: "px", sizes: { default: 8, xs: 2, sm: 4, md: 8, lg: 16, xl: 32 }, figmaPath: "notification/radius" },
    "notification-padding-x": { type: "FLOAT", unit: "px", value: 12, figmaPath: "notification/padding-x" },
    "notification-padding-y": { type: "FLOAT", unit: "px", value: 10, figmaPath: "notification/padding-y" },
    "notification-icon-stroke-width": { type: "FLOAT", unit: "px", value: 2, figmaPath: "notification/icon-stroke-width" },
    "notification-close-stroke-width": { type: "FLOAT", unit: "px", value: 2, figmaPath: "notification/close-stroke-width" },
    "notification-title-font-size": { type: "FLOAT", unit: "px", value: 14, figmaPath: "notification/title-font-size" },
    "notification-title-font-family": { type: "STRING", value: "Inter", figmaPath: "notification/title-font-family" },
    "notification-title-font-weight": { type: "STRING", value: "Semi Bold", figmaPath: "notification/title-font-weight" },
    "notification-title-line-height": { type: "FLOAT", unit: "px", value: 20, figmaPath: "notification/title-line-height" },
    "notification-description-font-size": { type: "FLOAT", unit: "px", value: 13, figmaPath: "notification/description-font-size" },
    "notification-description-font-family": { type: "STRING", value: "Inter", figmaPath: "notification/description-font-family" },
    "notification-description-font-weight": { type: "STRING", value: "Regular", figmaPath: "notification/description-font-weight" },
    "notification-description-line-height": { type: "FLOAT", unit: "px", value: 20, figmaPath: "notification/description-line-height" },
    "notification-border-width": { type: "FLOAT", unit: "px", value: 1, figmaPath: "notification/border-width" },
  },

  popover: {
    // ── COLOR TOKENS ──
    "popover-background": { type: "COLOR", semantic: "surface-inverse", figmaPath: "popover/background" },
    "popover-border": { type: "COLOR", semantic: "surface-inverse", figmaPath: "popover/border" },
    "popover-text": { type: "COLOR", semantic: "text-inverse", figmaPath: "popover/text" },
    "popover-arrow": { type: "COLOR", semantic: "surface-inverse", figmaPath: "popover/arrow" },

    // ── FLOAT / STRING TOKENS ──
    "popover-width": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 280, xs: 160, sm: 200, md: 240, lg: 280, xl: 320 },
      figmaPath: "popover/width",
    },
    "popover-radius": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 8, xs: 2, sm: 4, md: 8, lg: 16, xl: 32 },
      figmaPath: "popover/radius",
    },
    "popover-padding-x": { type: "FLOAT", unit: "px", value: 12, figmaPath: "popover/padding-x" },
    "popover-padding-y": { type: "FLOAT", unit: "px", value: 10, figmaPath: "popover/padding-y" },
    "popover-border-width": { type: "FLOAT", unit: "px", value: 1, figmaPath: "popover/border-width" },
    "popover-arrow-size": { type: "FLOAT", unit: "px", value: 8, figmaPath: "popover/arrow-size" },
    "popover-text-font-size": { type: "FLOAT", unit: "px", value: 13, figmaPath: "popover/text-font-size" },
    "popover-text-font-family": { type: "STRING", value: "Inter", figmaPath: "popover/text-font-family" },
    "popover-text-font-weight": { type: "STRING", value: "Regular", figmaPath: "popover/text-font-weight" },
    "popover-text-line-height": { type: "FLOAT", unit: "px", value: 18, figmaPath: "popover/text-line-height" },
  },

  menu: {
    // ── COLOR TOKENS ──
    "menu-background": { type: "COLOR", semantic: "surface-default", figmaPath: "menu/background" },
    "menu-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "menu/background-disabled" },
    "menu-border": { type: "COLOR", semantic: "border-default", figmaPath: "menu/border" },
    "menu-border-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "menu/border-disabled" },
    "menu-divider": { type: "COLOR", semantic: "border-default", figmaPath: "menu/divider" },
    "menu-divider-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "menu/divider-disabled" },
    "menu-section-label": { type: "COLOR", semantic: "text-subtle", figmaPath: "menu/section-label" },
    "menu-section-label-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "menu/section-label-disabled" },
    "menu-item-background": { type: "COLOR", semantic: "transparent", figmaPath: "menu/item-background" },
    "menu-item-background-hover": { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "menu/item-background-hover" },
    "menu-item-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "menu/item-background-disabled" },
    "menu-item-text": { type: "COLOR", semantic: "text-default", figmaPath: "menu/item-text" },
    "menu-item-text-hover": { type: "COLOR", semantic: "text-default", figmaPath: "menu/item-text-hover" },
    "menu-item-text-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "menu/item-text-disabled" },
    "menu-item-icon": { type: "COLOR", semantic: "text-subtle", figmaPath: "menu/item-icon" },
    "menu-item-icon-hover": { type: "COLOR", semantic: "text-default", figmaPath: "menu/item-icon-hover" },
    "menu-item-icon-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "menu/item-icon-disabled" },

    // ── FLOAT / STRING TOKENS ──
    "menu-width": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 220, xs: 180, sm: 200, md: 220, lg: 260, xl: 300 },
      figmaPath: "menu/width",
    },
    "menu-border-radius": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 8, xs: 2, sm: 4, md: 8, lg: 16, xl: 32 },
      figmaPath: "menu/border-radius",
    },
    "menu-item-border-radius": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 6, xs: 2, sm: 4, md: 6, lg: 10, xl: 14 },
      figmaPath: "menu/item-border-radius",
    },
    // Legacy fallback: kept for backward compatibility with earlier menu builds.
    "menu-radius": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 8, xs: 2, sm: 4, md: 8, lg: 16, xl: 32 },
      figmaPath: "menu/radius",
    },
    "menu-padding": { type: "FLOAT", unit: "px", value: 6, figmaPath: "menu/padding" },
    "menu-border-width": { type: "FLOAT", unit: "px", value: 1, figmaPath: "menu/border-width" },
    "menu-divider-width": { type: "FLOAT", unit: "px", value: 1, figmaPath: "menu/divider-width" },
    "menu-divider-radius": { type: "FLOAT", unit: "px", value: 999, figmaPath: "menu/divider-radius" },
    "menu-item-height": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 32, xs: 24, sm: 28, md: 32, lg: 36, xl: 40 },
      figmaPath: "menu/item-height",
    },
    "menu-content-padding-x": { type: "FLOAT", unit: "px", value: 8, figmaPath: "menu/content-padding-x" },
    "menu-content-padding-y": { type: "FLOAT", unit: "px", value: 6, figmaPath: "menu/content-padding-y" },
    "menu-label-divider-gap": { type: "FLOAT", unit: "px", value: 4, figmaPath: "menu/label-divider-gap" },
    "menu-item-gap": { type: "FLOAT", unit: "px", value: 2, figmaPath: "menu/item-gap" },
    "menu-item-padding-x": { type: "FLOAT", unit: "px", value: 10, figmaPath: "menu/item-padding-x" },
    "menu-item-padding-y": { type: "FLOAT", unit: "px", value: 6, figmaPath: "menu/item-padding-y" },
    "menu-icon-stroke-width": { type: "FLOAT", unit: "px", value: 1.75, figmaPath: "menu/icon-stroke-width" },
    "menu-font-size": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 13, xs: 11, sm: 12, md: 13, lg: 14, xl: 16 },
      figmaPath: "menu/font-size",
    },
    "menu-line-height": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 20, xs: 16, sm: 18, md: 20, lg: 22, xl: 24 },
      figmaPath: "menu/line-height",
    },
    "menu-font-family": { type: "STRING", value: "Inter", figmaPath: "menu/font-family" },
    "menu-font-weight": { type: "STRING", value: "Regular", figmaPath: "menu/font-weight" },
  },

  divider: {
    // ── COLOR TOKENS ──
    "divider-color": { type: "COLOR", semantic: "border-default", figmaPath: "divider/color" },
    "divider-color-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "divider/color-disabled" },

    // ── FLOAT TOKENS ──
    "divider-length": { type: "FLOAT", unit: "px", value: 240, figmaPath: "divider/length" },
    "divider-thickness": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 3, xs: 1, sm: 2, md: 3, lg: 4, xl: 6 },
      figmaPath: "divider/thickness",
    },
    "divider-radius": { type: "FLOAT", unit: "px", value: 999, figmaPath: "divider/radius" },
    "divider-inset": { type: "FLOAT", unit: "px", value: 16, figmaPath: "divider/inset" },
  },

  list: {
    // ── COLOR TOKENS ──
    "list-item-color": { type: "COLOR", semantic: "text-default", figmaPath: "list/item-color" },
    "list-marker-color": { type: "COLOR", semantic: "text-subtle", figmaPath: "list/marker-color" },
    "list-icon-color": { type: "COLOR", semantic: "text-subtle", figmaPath: "list/icon-color" },

    // ── FLOAT / STRING TOKENS ──
    "list-spacing": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 0, xs: 0, sm: 2, md: 4, lg: 6, xl: 10 },
      figmaPath: "list/spacing",
    },
    "list-item-padding-left": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 16, xs: 8, sm: 12, md: 16, lg: 20, xl: 24 },
      figmaPath: "list/item-padding-left",
    },
    "list-marker-gap": { type: "FLOAT", unit: "px", value: 8, figmaPath: "list/marker-gap" },
    "list-icon-gap": { type: "FLOAT", unit: "px", value: 8, figmaPath: "list/icon-gap" },
    "list-font-size": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 13, xs: 11, sm: 12, md: 13, lg: 14, xl: 16 },
      figmaPath: "list/font-size",
    },
    "list-line-height": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 20, xs: 16, sm: 18, md: 20, lg: 22, xl: 24 },
      figmaPath: "list/line-height",
    },
    "list-font-family": { type: "STRING", value: "Inter", figmaPath: "list/font-family" },
    "list-font-weight": { type: "STRING", value: "Regular", figmaPath: "list/font-weight" },
    "list-icon-size": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 14, xs: 12, sm: 13, md: 14, lg: 16, xl: 18 },
      figmaPath: "list/icon-size",
    },
    "list-icon-stroke-width": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 1.75, xs: 1.5, sm: 1.6, md: 1.75, lg: 2, xl: 2.25 },
      figmaPath: "list/icon-stroke-width",
    },
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
    "tooltip-font-family": { type: "STRING", value: "Inter", figmaPath: "tooltip/font-family" },
    "tooltip-font-weight": { type: "STRING", value: "Regular", figmaPath: "tooltip/font-weight" },
    "tooltip-line-height": { type: "FLOAT", unit: "px", value: 16, figmaPath: "tooltip/line-height" },
    "tooltip-arrow-size": { type: "FLOAT", unit: "px", value: 7,  figmaPath: "tooltip/arrow-size" },
  },

  loader: {
    // ── COLOR TOKENS ──
    "loader-color": { type: "COLOR", semantic: "interactive-primary", figmaPath: "loader/color" },

    // ── FLOAT TOKENS (size variants: xs, sm, md, lg, xl) ──
    "loader-size": { type: "FLOAT", unit: "px", sizes: { xs: 14, sm: 18, md: 22, lg: 28, xl: 34 }, figmaPath: "loader/size" },
    // Ring / arc stroke on oval loader (Figma ellipse strokeWeight); matches legacy Math.max(2, round(size * 0.14)).
    "loader-stroke-width": {
      type: "FLOAT",
      unit: "px",
      sizes: { xs: 2, sm: 3, md: 3, lg: 4, xl: 5 },
      figmaPath: "loader/stroke-width",
    },
    // Figma arc “Corner radius” on the oval loader ellipse (rounds arc ends in the UI). Per size.
    // Note: Figma’s plugin API cannot bind variables to ellipse `cornerRadius` (not in VariableBindableNodeField). Sync + component build applies the resolved numeric value from this token; re-run sync after edits.
    "loader-oval-corner-radius": {
      type: "FLOAT",
      unit: "px",
      sizes: { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 },
      figmaPath: "loader/oval-corner-radius",
    },
  },

  /** Linear progress (standalone; table cells can use the same tokens or `table/progress-*`). */
  progress: {
    "progress-track": { type: "COLOR", semantic: "surface-secondary", figmaPath: "progress/track" },
    "progress-fill": { type: "COLOR", semantic: "interactive-primary", figmaPath: "progress/fill" },
    "progress-label": { type: "COLOR", semantic: "text-default", figmaPath: "progress/label" },
    "progress-height": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 8, xs: 4, sm: 6, md: 8, lg: 10, xl: 12 },
      figmaPath: "progress/height",
    },
    "progress-radius": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 4, xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
      figmaPath: "progress/radius",
    },
    "progress-track-width": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 160, xs: 96, sm: 120, md: 160, lg: 200, xl: 240 },
      figmaPath: "progress/track-width",
    },
    "progress-font-size": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 13, xs: 11, sm: 12, md: 13, lg: 14, xl: 15 },
      figmaPath: "progress/font-size",
    },
    "progress-gap": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 8, xs: 4, sm: 6, md: 8, lg: 10, xl: 12 },
      figmaPath: "progress/gap",
    },
  },

  chart: {
    // ── SERIES PALETTE (COLOR) ──
    // Series 1 follows the brand's primary; 2-6 map to distinct palette hues.
    "chart-series-1": { type: "COLOR", semantic: "interactive-primary", figmaPath: "chart/series-1" },
    "chart-series-2": { type: "COLOR", defaultMapping: { color: "cyan", index: 5 }, figmaPath: "chart/series-2" },
    "chart-series-3": { type: "COLOR", defaultMapping: { color: "green", index: 5 }, figmaPath: "chart/series-3" },
    "chart-series-4": { type: "COLOR", defaultMapping: { color: "orange", index: 5 }, figmaPath: "chart/series-4" },
    "chart-series-5": { type: "COLOR", defaultMapping: { color: "purple", index: 5 }, figmaPath: "chart/series-5" },
    "chart-series-6": { type: "COLOR", defaultMapping: { color: "pink", index: 5 }, figmaPath: "chart/series-6" },

    // ── TRANSLUCENT FILL PALETTE (COLOR) — Area + Radar only ──
    // Area/Radar paint their filled regions with these instead of chart-series-N
    // so the solid series palette used by line/bar/etc. is never disturbed. They
    // default to the same brand-aware hues as chart-series-N; the designer sets
    // each token's opacity directly (the alpha rides along in the color value).
    "chart-series-opacity-1": { type: "COLOR", semantic: "interactive-primary", areaRadarOnly: true, figmaPath: "chart/series-opacity-1" },
    "chart-series-opacity-2": { type: "COLOR", defaultMapping: { color: "cyan", index: 5 }, areaRadarOnly: true, figmaPath: "chart/series-opacity-2" },
    "chart-series-opacity-3": { type: "COLOR", defaultMapping: { color: "green", index: 5 }, areaRadarOnly: true, figmaPath: "chart/series-opacity-3" },
    "chart-series-opacity-4": { type: "COLOR", defaultMapping: { color: "orange", index: 5 }, areaRadarOnly: true, figmaPath: "chart/series-opacity-4" },
    "chart-series-opacity-5": { type: "COLOR", defaultMapping: { color: "purple", index: 5 }, areaRadarOnly: true, figmaPath: "chart/series-opacity-5" },
    "chart-series-opacity-6": { type: "COLOR", defaultMapping: { color: "pink", index: 5 }, areaRadarOnly: true, figmaPath: "chart/series-opacity-6" },

    // ── SHADE RAMP (COLOR) ──
    // Used only by "shades" color mode. A monochromatic ramp (dark -> light) that
    // defaults to steps of the brand's primary hue but is independently editable —
    // these are distinct, editable variables, separate from the series palette.
    "chart-shade-1": { type: "COLOR", isShade: true, figmaPath: "chart/shade-1" },
    "chart-shade-2": { type: "COLOR", isShade: true, figmaPath: "chart/shade-2" },
    "chart-shade-3": { type: "COLOR", isShade: true, figmaPath: "chart/shade-3" },
    "chart-shade-4": { type: "COLOR", isShade: true, figmaPath: "chart/shade-4" },
    "chart-shade-5": { type: "COLOR", isShade: true, figmaPath: "chart/shade-5" },
    "chart-shade-6": { type: "COLOR", isShade: true, figmaPath: "chart/shade-6" },

    // ── TRANSLUCENT SHADE RAMP (COLOR) — Area + Radar only ──
    // The opacity counterpart of chart-shade-N, used to fill area/radar regions in
    // "shades" color mode. Defaults to the same ramp; the designer sets opacity per
    // token. Kept separate so lowering opacity never affects other charts' shades.
    "chart-shade-opacity-1": { type: "COLOR", isShadeOpacity: true, areaRadarOnly: true, figmaPath: "chart/shade-opacity-1" },
    "chart-shade-opacity-2": { type: "COLOR", isShadeOpacity: true, areaRadarOnly: true, figmaPath: "chart/shade-opacity-2" },
    "chart-shade-opacity-3": { type: "COLOR", isShadeOpacity: true, areaRadarOnly: true, figmaPath: "chart/shade-opacity-3" },
    "chart-shade-opacity-4": { type: "COLOR", isShadeOpacity: true, areaRadarOnly: true, figmaPath: "chart/shade-opacity-4" },
    "chart-shade-opacity-5": { type: "COLOR", isShadeOpacity: true, areaRadarOnly: true, figmaPath: "chart/shade-opacity-5" },
    "chart-shade-opacity-6": { type: "COLOR", isShadeOpacity: true, areaRadarOnly: true, figmaPath: "chart/shade-opacity-6" },

    // ── SERIES LINE STYLE (STRING) — line/combo charts only ──
    // Each series can render solid, dashed, or dotted independently. The dash
    // pattern itself is structural (baked in Figma, like the grid dash).
    "chart-series-1-style": { type: "STRING", value: "solid", allowedValues: ["solid", "dashed", "dotted"], lineOnly: true, figmaPath: "chart/series-1-style" },
    "chart-series-2-style": { type: "STRING", value: "dashed", allowedValues: ["solid", "dashed", "dotted"], lineOnly: true, figmaPath: "chart/series-2-style" },
    "chart-series-3-style": { type: "STRING", value: "dotted", allowedValues: ["solid", "dashed", "dotted"], lineOnly: true, figmaPath: "chart/series-3-style" },
    "chart-series-4-style": { type: "STRING", value: "solid", allowedValues: ["solid", "dashed", "dotted"], lineOnly: true, figmaPath: "chart/series-4-style" },
    "chart-series-5-style": { type: "STRING", value: "dashed", allowedValues: ["solid", "dashed", "dotted"], lineOnly: true, figmaPath: "chart/series-5-style" },
    "chart-series-6-style": { type: "STRING", value: "dotted", allowedValues: ["solid", "dashed", "dotted"], lineOnly: true, figmaPath: "chart/series-6-style" },

    // ── STRUCTURE (COLOR) ──
    "chart-axis": { type: "COLOR", semantic: "border-default", figmaPath: "chart/axis" },
    "chart-grid": { type: "COLOR", semantic: "border-subtle", figmaPath: "chart/grid" },
    "chart-label": { type: "COLOR", semantic: "text-subtle", figmaPath: "chart/label" },

    // ── FLOAT TOKENS (size variants: default, sm, md, lg) ──
    // Charts match Recharts: no size scale. Width fills the container (100% in
    // code; the frame width in Figma), height is the single tokenized knob. The
    // remaining values are single defaults rather than a sm/md/lg ramp.
    "chart-width": { type: "FLOAT", unit: "px", sizes: { default: 320 }, figmaPath: "chart/width" },
    "chart-height": { type: "FLOAT", unit: "px", sizes: { default: 180 }, figmaPath: "chart/height" },
    "chart-bar-gap": { type: "FLOAT", unit: "px", sizes: { default: 12 }, figmaPath: "chart/bar-gap" },
    "chart-label-font-size": { type: "FLOAT", unit: "px", sizes: { default: 11 }, figmaPath: "chart/label-font-size" },
    "chart-legend-font-size": { type: "FLOAT", unit: "px", sizes: { default: 12 }, figmaPath: "chart/legend-font-size" },

    // ── FLOAT TOKENS (single value) ──
    "chart-bar-radius": { type: "FLOAT", unit: "px", value: 2, figmaPath: "chart/bar-radius" },
    "chart-axis-width": { type: "FLOAT", unit: "px", value: 1, figmaPath: "chart/axis-width" },
    "chart-grid-width": { type: "FLOAT", unit: "px", value: 1, figmaPath: "chart/grid-width" },
    "chart-grid-dash": { type: "FLOAT", unit: "px", value: 4, figmaPath: "chart/grid-dash" },
    "chart-series-dash": { type: "FLOAT", unit: "px", value: 6, lineOnly: true, figmaPath: "chart/series-dash" },
    "chart-legend-swatch-size": { type: "FLOAT", unit: "px", value: 10, figmaPath: "chart/legend-swatch-size" },
    "chart-legend-gap": { type: "FLOAT", unit: "px", value: 16, figmaPath: "chart/legend-gap" },
    "chart-padding": { type: "FLOAT", unit: "px", value: 16, figmaPath: "chart/padding" },

    // ── STRING TOKENS ──
    "chart-grid-style": { type: "STRING", value: "solid", allowedValues: ["solid", "dashed"], figmaPath: "chart/grid-style" },
    "chart-line-curve": { type: "STRING", value: "smooth", allowedValues: ["smooth", "straight"], lineOnly: true, figmaPath: "chart/line-curve" },
    "chart-font-family": { type: "STRING", value: "Inter", figmaPath: "chart/font-family" },
    "chart-label-font-weight": { type: "STRING", value: "Regular", figmaPath: "chart/label-font-weight" },
  },

  // Line-specific tokens only. Shared chart styling (series palette, axis, grid,
  // label, typography, width/height/padding) is inherited from the `chart` group
  // and merged into this component's editor via getColorTokens/getDimensionTokens.
  "chart-line": {
    "chart-line-width": { type: "FLOAT", unit: "px", value: 2, figmaPath: "chart-line/width" },
    "chart-line-point-radius": { type: "FLOAT", unit: "px", value: 3, figmaPath: "chart-line/point-radius" },
  },

  // Time series chart. A thin variant of the line chart: it reuses the line
  // rendering AND the chart-line/* tokens (and their Figma variables) verbatim —
  // there are no time-series-specific tokens. It exists as its own catalog entry
  // (and Figma component) for spec parity and as the base for the dual-axis
  // variant. Token resolution maps it to the chart-line group (see
  // resolveComponentTokenSet) so its editor mirrors the line chart exactly.
  "chart-time-series": {},

  // Time series dual-axis chart. A fixed 2-series line chart where series-1 binds
  // to a left Y-axis and series-2 to an independent right Y-axis. Like the time
  // series, it reuses the chart-line/* tokens (and Figma variables) verbatim — no
  // dedicated tokens. Token resolution maps it to the chart-line group.
  "chart-time-series-dual-axis": {},

  // Area-specific tokens only. Shared chart styling (series palette, axis, grid,
  // label, typography, width/height/padding) is inherited from the `chart` group
  // and merged into this component's editor via getColorTokens/getDimensionTokens.
  "chart-area": {
    "chart-area-line-width": { type: "FLOAT", unit: "px", value: 2, figmaPath: "chart-area/width" },
    "chart-area-point-radius": { type: "FLOAT", unit: "px", value: 3, figmaPath: "chart-area/point-radius" },
  },

  // Stacked area chart. The area equivalent of the stacked bar: series are
  // summed (cumulative) into layered bands rather than overlaid. It reuses the
  // chart-area/* tokens (and Figma variables) verbatim, and — like the stacked
  // bar — fills with the SOLID series/shade palette (bands don't overlap, so no
  // translucency is needed). Token resolution maps it to the chart-area group.
  "chart-stacked-area": {},

  // Scatter chart. Points plotted on two numeric axes; each series is a cluster
  // colored from the solid series/shade palette. Only one subtype-specific knob:
  // the marker radius. Shares the chart/* axis/grid/label/legend scaffold.
  "chart-scatter": {
    "chart-scatter-point-radius": { type: "FLOAT", unit: "px", value: 4, figmaPath: "chart-scatter/point-radius" },
    // Hover crosshair (cursor) color — intentionally a separate, editable color
    // from the grid dashes so the cursor reads as a distinct reference line.
    "chart-scatter-cursor": { type: "COLOR", semantic: "border-default", figmaPath: "chart-scatter/cursor" },
  },

  // Candlestick (OHLC) chart. Recharts has no native candlestick — it's composed
  // from a Bar (body = open→close range) + a high→low wick via a custom shape.
  // Colors are directional (not a series palette): bullish (close ≥ open) uses
  // `up`, bearish uses `down`. Body/wick widths are the only sizing knobs.
  "chart-candlestick": {
    "chart-candlestick-up": { type: "COLOR", semantic: "feedback-success", figmaPath: "chart-candlestick/up" },
    "chart-candlestick-down": { type: "COLOR", semantic: "feedback-error", figmaPath: "chart-candlestick/down" },
    "chart-candlestick-body-width": { type: "FLOAT", unit: "px", value: 7, figmaPath: "chart-candlestick/body-width" },
    "chart-candlestick-wick-width": { type: "FLOAT", unit: "px", value: 1, figmaPath: "chart-candlestick/wick-width" },
  },

  // Stacked bar chart. A bar-based subtype: it inherits the shared chart styling
  // AND the chart-bar-* tokens (radius/gap). Stack segments are colored by the
  // active color mode (shades/palette) just like other multi-series charts.
  "chart-stacked-bar": {},

  // Combo chart (bars + line on shared/secondary axes). A bar-based subtype that
  // also draws a line, so it keeps chart-bar-* and adds its own line width.
  // Bars use series-1, the line uses series-2.
  "chart-combo": {
    "chart-combo-line-width": { type: "FLOAT", unit: "px", value: 2, figmaPath: "chart-combo/line-width" },
    // Curve defaults to straight: a clean zig-zag reads better against bars than a
    // smoothed curve. Style/dash let the line be a dashed zig-zag.
    "chart-combo-line-curve": { type: "STRING", value: "straight", allowedValues: ["smooth", "straight"], figmaPath: "chart-combo/line-curve" },
    "chart-combo-line-style": { type: "STRING", value: "dashed", allowedValues: ["solid", "dashed", "dotted"], figmaPath: "chart-combo/line-style" },
    "chart-combo-line-dash": { type: "FLOAT", unit: "px", value: 6, figmaPath: "chart-combo/line-dash" },
    "chart-combo-point-radius": { type: "FLOAT", unit: "px", value: 3, figmaPath: "chart-combo/point-radius" },
  },

  // Donut chart (parts-of-a-whole). Slices are colored by the active color mode
  // (palette/shades) using the shared series/shade ramps. It has no cartesian
  // axes or grid, so those shared tokens are hidden from its editor. The two
  // structural knobs below are baked into geometry (like the grid dash pattern):
  // inner-radius sets the hole size, pad-angle the gap between slices.
  "chart-donut": {
    "chart-donut-inner-radius": { type: "FLOAT", unit: "%", value: 60, figmaPath: "chart-donut/inner-radius" },
    "chart-donut-pad-angle": { type: "FLOAT", unit: "°", value: 2, figmaPath: "chart-donut/pad-angle" },
    "chart-donut-corner-radius": { type: "FLOAT", unit: "px", value: 8, figmaPath: "chart-donut/corner-radius" },
  },

  // Pie chart (parts-of-a-whole). The donut variant with no hole (inner radius 0):
  // slices are colored by the active color mode (palette/shades) from the shared
  // series/shade ramps, with no cartesian axes/grid. Only the slice gap + corner
  // rounding are tokenized (inner radius is fixed at 0 — that's what makes it a pie).
  "chart-pie": {
    "chart-pie-pad-angle": { type: "FLOAT", unit: "°", value: 0, figmaPath: "chart-pie/pad-angle" },
    "chart-pie-corner-radius": { type: "FLOAT", unit: "px", value: 0, figmaPath: "chart-pie/corner-radius" },
  },

  // Funnel chart. Stacked trapezoid stages tapering to a point (conversion / drop-
  // off). Stages are colored by the active color mode (palette/shades) from the
  // shared series/shade ramps; no cartesian axes/grid. Its own tokens cover the
  // centered value label (color + size) painted on each stage.
  "chart-funnel": {
    "chart-funnel-label": { type: "COLOR", semantic: "text-on-interactive", figmaPath: "chart-funnel/label" },
    "chart-funnel-label-font-size": { type: "FLOAT", unit: "px", value: 14, figmaPath: "chart-funnel/label-font-size" },
  },

  // Radial (gauge) chart. Concentric ring arcs, each ring a value 0–100 drawn over
  // a muted background track. Rings are colored by the active color mode
  // (palette/shades) from the shared series/shade ramps; no cartesian axes/grid.
  // Its own tokens cover the track color, the rounded ring ends, and the ring gap.
  "chart-radial": {
    "chart-radial-track": { type: "COLOR", semantic: "border-subtle", figmaPath: "chart-radial/track" },
    "chart-radial-corner-radius": { type: "FLOAT", unit: "px", value: 8, figmaPath: "chart-radial/corner-radius" },
    "chart-radial-ring-gap": { type: "FLOAT", unit: "px", value: 4, figmaPath: "chart-radial/ring-gap" },
  },

  // Radar (spider) chart. Shares the series/shade palette + grid/axis/label tokens
  // with the other chart subtypes; these tokens style the per-series polygons.
  "chart-radar": {
    "chart-radar-line-width": { type: "FLOAT", unit: "px", value: 2, figmaPath: "chart-radar/line-width" },
    "chart-radar-dot-radius": { type: "FLOAT", unit: "px", value: 3, figmaPath: "chart-radar/dot-radius" },
  },

  // Sparkline. A compact, chrome-free trend chart (single series, no axes / grid /
  // labels / legend) for inline use in tables, KPI cards, etc. The `style` knob
  // (line | area | bar) lives in the preview/Figma as an instance property. It
  // reuses the shared series-1 color (stroke/bar/end-dot) and series-opacity-1
  // (area fill); its own tokens cover the compact height + stroke/dot/bar sizing.
  "chart-sparkline": {
    "chart-sparkline-height": { type: "FLOAT", unit: "px", sizes: { default: 48 }, figmaPath: "chart-sparkline/height" },
    "chart-sparkline-line-width": { type: "FLOAT", unit: "px", value: 2, figmaPath: "chart-sparkline/line-width" },
    "chart-sparkline-dot-radius": { type: "FLOAT", unit: "px", value: 3.5, figmaPath: "chart-sparkline/dot-radius" },
    "chart-sparkline-bar-radius": { type: "FLOAT", unit: "px", value: 1, figmaPath: "chart-sparkline/bar-radius" },
    "chart-sparkline-bar-gap": { type: "FLOAT", unit: "px", value: 3, figmaPath: "chart-sparkline/bar-gap" },
  },

  // Horizontal (ranked) bar chart. A bar-based subtype drawn on swapped axes
  // (categories on Y, values on X) — the preferred form for long / text-heavy
  // ranked category labels. Reuses the shared chart-bar-* tokens (radius/gap) and
  // the series/shade palette; its own group is empty (resolved via the bar-based
  // subtype path, like the stacked bar).
  "chart-bar-horizontal": {},

  pill: {
    // ── COLOR TOKENS ──
    "pill-background": { type: "COLOR", semantic: "interactive-secondary", figmaPath: "pill/background" },
    "pill-border": { type: "COLOR", semantic: "border-default", figmaPath: "pill/border" },
    "pill-label": { type: "COLOR", semantic: "text-default", figmaPath: "pill/label" },
    "pill-remove": { type: "COLOR", semantic: "text-default", figmaPath: "pill/remove" },

    // ── FLOAT TOKENS (size variants: default, xs, sm, md, lg, xl) ──
    "pill-font-size": { type: "FLOAT", unit: "px", sizes: { default: 12, xs: 10, sm: 11, md: 12, lg: 13, xl: 14 }, figmaPath: "pill/font-size" },
    "pill-font-family": { type: "STRING", value: "Inter", figmaPath: "pill/font-family" },
    "pill-font-weight": { type: "STRING", value: "Regular", figmaPath: "pill/font-weight" },
    "pill-line-height": { type: "FLOAT", unit: "px", sizes: { default: 16, xs: 14, sm: 14, md: 16, lg: 16, xl: 20 }, figmaPath: "pill/line-height" },
    "pill-padding-x": { type: "FLOAT", unit: "px", sizes: { default: 10, xs: 6, sm: 8, md: 10, lg: 12, xl: 14 }, figmaPath: "pill/padding-x" },
    "pill-padding-y": { type: "FLOAT", unit: "px", sizes: { default: 4, xs: 1, sm: 3, md: 4, lg: 6, xl: 7 }, figmaPath: "pill/padding-y" },
    "pill-radius": { type: "FLOAT", unit: "px", sizes: { default: 12, xs: 8, sm: 10, md: 12, lg: 14, xl: 18 }, figmaPath: "pill/radius" },
    "pill-gap": { type: "FLOAT", unit: "px", sizes: { default: 6, xs: 4, sm: 5, md: 6, lg: 7, xl: 8 }, figmaPath: "pill/gap" },
    "pill-remove-size": { type: "FLOAT", unit: "px", sizes: { default: 14, xs: 12, sm: 13, md: 14, lg: 16, xl: 18 }, figmaPath: "pill/remove-size" },
    "pill-remove-icon-stroke-width": { type: "FLOAT", unit: "px", sizes: { default: 2, xs: 1.5, sm: 1.75, md: 2, lg: 2.25, xl: 2.5 }, figmaPath: "pill/remove-icon-stroke-width" },

    // ── FLOAT TOKENS (single value) ──
    "pill-border-width": { type: "FLOAT", unit: "px", value: 1, figmaPath: "pill/border-width" },
  },

  badge: {
    // ── COLOR TOKENS ──
    "badge-filled-background": { type: "COLOR", semantic: "interactive-primary", figmaPath: "badge/filled-background" },
    "badge-filled-text": { type: "COLOR", semantic: "text-on-interactive", figmaPath: "badge/filled-text" },
    "badge-filled-border": { type: "COLOR", semantic: "interactive-primary", figmaPath: "badge/filled-border" },

    "badge-light-background": { type: "COLOR", semantic: "interactive-secondary", figmaPath: "badge/light-background" },
    "badge-light-text": { type: "COLOR", semantic: "interactive-primary", figmaPath: "badge/light-text" },
    "badge-light-border": { type: "COLOR", semantic: "interactive-secondary", figmaPath: "badge/light-border" },

    "badge-outline-background": { type: "COLOR", semantic: "surface-default", figmaPath: "badge/outline-background" },
    "badge-outline-text": { type: "COLOR", semantic: "interactive-primary", figmaPath: "badge/outline-text" },
    "badge-outline-border": { type: "COLOR", semantic: "interactive-primary", figmaPath: "badge/outline-border" },

    "badge-default-background": { type: "COLOR", semantic: "surface-default", figmaPath: "badge/default-background" },
    "badge-default-text": { type: "COLOR", semantic: "text-default", figmaPath: "badge/default-text" },
    "badge-default-border": { type: "COLOR", semantic: "border-default", figmaPath: "badge/default-border" },

    "badge-filled-success-background": { type: "COLOR", semantic: "feedback-success", figmaPath: "badge/filled-success-background" },
    "badge-filled-success-text": { type: "COLOR", semantic: "text-on-interactive", figmaPath: "badge/filled-success-text" },
    "badge-filled-success-border": { type: "COLOR", semantic: "feedback-success", figmaPath: "badge/filled-success-border" },
    "badge-filled-warning-background": { type: "COLOR", semantic: "feedback-warning", figmaPath: "badge/filled-warning-background" },
    "badge-filled-warning-text": { type: "COLOR", semantic: "text-default", figmaPath: "badge/filled-warning-text" },
    "badge-filled-warning-border": { type: "COLOR", semantic: "feedback-warning", figmaPath: "badge/filled-warning-border" },
    "badge-filled-error-background": { type: "COLOR", semantic: "feedback-error", figmaPath: "badge/filled-error-background" },
    "badge-filled-error-text": { type: "COLOR", semantic: "text-on-interactive", figmaPath: "badge/filled-error-text" },
    "badge-filled-error-border": { type: "COLOR", semantic: "feedback-error", figmaPath: "badge/filled-error-border" },

    "badge-outline-success-background": { type: "COLOR", semantic: "surface-default", figmaPath: "badge/outline-success-background" },
    "badge-outline-success-text": { type: "COLOR", semantic: "feedback-success", figmaPath: "badge/outline-success-text" },
    "badge-outline-success-border": { type: "COLOR", semantic: "feedback-success", figmaPath: "badge/outline-success-border" },
    "badge-outline-warning-background": { type: "COLOR", semantic: "surface-default", figmaPath: "badge/outline-warning-background" },
    "badge-outline-warning-text": { type: "COLOR", semantic: "feedback-warning", figmaPath: "badge/outline-warning-text" },
    "badge-outline-warning-border": { type: "COLOR", semantic: "feedback-warning", figmaPath: "badge/outline-warning-border" },
    "badge-outline-error-background": { type: "COLOR", semantic: "surface-default", figmaPath: "badge/outline-error-background" },
    "badge-outline-error-text": { type: "COLOR", semantic: "feedback-error", figmaPath: "badge/outline-error-text" },
    "badge-outline-error-border": { type: "COLOR", semantic: "feedback-error", figmaPath: "badge/outline-error-border" },

    // ── FLOAT TOKENS (size variants: default, xs, sm, md, lg, xl) ──
    "badge-font-size": { type: "FLOAT", unit: "px", sizes: { default: 12, xs: 10, sm: 11, md: 12, lg: 13, xl: 14 }, figmaPath: "badge/font-size" },
    "badge-font-family": { type: "STRING", value: "Inter", figmaPath: "badge/font-family" },
    "badge-font-weight": { type: "STRING", value: "Semi Bold", figmaPath: "badge/font-weight" },
    "badge-line-height": { type: "FLOAT", unit: "px", sizes: { default: 16, xs: 14, sm: 14, md: 16, lg: 16, xl: 20 }, figmaPath: "badge/line-height" },
    "badge-padding-x": { type: "FLOAT", unit: "px", sizes: { default: 9, xs: 6, sm: 7, md: 9, lg: 11, xl: 13 }, figmaPath: "badge/padding-x" },
    "badge-padding-y": { type: "FLOAT", unit: "px", sizes: { default: 2, xs: 1, sm: 2, md: 2, lg: 4, xl: 4 }, figmaPath: "badge/padding-y" },
    "badge-radius": { type: "FLOAT", unit: "px", sizes: { default: 8, xs: 2, sm: 4, md: 8, lg: 16, xl: 32 }, figmaPath: "badge/radius" },

    // ── FLOAT TOKENS (single value) ──
    "badge-border-width": { type: "FLOAT", unit: "px", value: 1, figmaPath: "badge/border-width" },
  },

  alert: {
    // ── COLOR TOKENS ──
    "alert-default-background": { type: "COLOR", semantic: "surface-default", figmaPath: "alert/default-background" },
    "alert-default-text": { type: "COLOR", semantic: "text-default", figmaPath: "alert/default-text" },
    "alert-default-border": { type: "COLOR", semantic: "border-default", figmaPath: "alert/default-border" },

    "alert-filled-background": { type: "COLOR", semantic: "interactive-primary", figmaPath: "alert/filled-background" },
    "alert-filled-text": { type: "COLOR", semantic: "text-on-interactive", figmaPath: "alert/filled-text" },
    "alert-filled-border": { type: "COLOR", semantic: "interactive-primary", figmaPath: "alert/filled-border" },

    "alert-light-background": { type: "COLOR", semantic: "interactive-secondary", figmaPath: "alert/light-background" },
    "alert-light-text": { type: "COLOR", semantic: "interactive-primary", figmaPath: "alert/light-text" },
    "alert-light-border": { type: "COLOR", semantic: "interactive-secondary", figmaPath: "alert/light-border" },

    "alert-outline-background": { type: "COLOR", semantic: "surface-default", figmaPath: "alert/outline-background" },
    "alert-outline-text": { type: "COLOR", semantic: "interactive-primary", figmaPath: "alert/outline-text" },
    "alert-outline-border": { type: "COLOR", semantic: "interactive-primary", figmaPath: "alert/outline-border" },

    "alert-transparent-background": { type: "COLOR", semantic: "surface-default", figmaPath: "alert/transparent-background" },
    "alert-transparent-text": { type: "COLOR", semantic: "text-default", figmaPath: "alert/transparent-text" },
    "alert-transparent-border": { type: "COLOR", semantic: "border-default", figmaPath: "alert/transparent-border" },

    "alert-white-background": { type: "COLOR", semantic: "surface-default", figmaPath: "alert/white-background" },
    "alert-white-text": { type: "COLOR", semantic: "text-default", figmaPath: "alert/white-text" },
    "alert-white-border": { type: "COLOR", semantic: "border-default", figmaPath: "alert/white-border" },

    // ── PER-STATUS COLOR TOKENS ──
    // Alert color is a semantic status. Each status × variant has its own
    // editable tokens, defaulting to the matching feedback-* semantic.
    "alert-default-info-background": { type: "COLOR", semantic: "surface-default", figmaPath: "alert/default-info-background" },
    "alert-default-info-text": { type: "COLOR", semantic: "feedback-info", figmaPath: "alert/default-info-text" },
    "alert-default-info-border": { type: "COLOR", semantic: "border-default", figmaPath: "alert/default-info-border" },
    "alert-default-success-background": { type: "COLOR", semantic: "surface-default", figmaPath: "alert/default-success-background" },
    "alert-default-success-text": { type: "COLOR", semantic: "feedback-success", figmaPath: "alert/default-success-text" },
    "alert-default-success-border": { type: "COLOR", semantic: "border-default", figmaPath: "alert/default-success-border" },
    "alert-default-warning-background": { type: "COLOR", semantic: "surface-default", figmaPath: "alert/default-warning-background" },
    "alert-default-warning-text": { type: "COLOR", semantic: "feedback-warning", figmaPath: "alert/default-warning-text" },
    "alert-default-warning-border": { type: "COLOR", semantic: "border-default", figmaPath: "alert/default-warning-border" },
    "alert-default-error-background": { type: "COLOR", semantic: "surface-default", figmaPath: "alert/default-error-background" },
    "alert-default-error-text": { type: "COLOR", semantic: "feedback-error", figmaPath: "alert/default-error-text" },
    "alert-default-error-border": { type: "COLOR", semantic: "border-default", figmaPath: "alert/default-error-border" },

    "alert-filled-info-background": { type: "COLOR", semantic: "feedback-info", figmaPath: "alert/filled-info-background" },
    "alert-filled-info-text": { type: "COLOR", semantic: "text-on-interactive", figmaPath: "alert/filled-info-text" },
    "alert-filled-info-border": { type: "COLOR", semantic: "feedback-info", figmaPath: "alert/filled-info-border" },
    "alert-filled-success-background": { type: "COLOR", semantic: "feedback-success", figmaPath: "alert/filled-success-background" },
    "alert-filled-success-text": { type: "COLOR", semantic: "text-on-interactive", figmaPath: "alert/filled-success-text" },
    "alert-filled-success-border": { type: "COLOR", semantic: "feedback-success", figmaPath: "alert/filled-success-border" },
    "alert-filled-warning-background": { type: "COLOR", semantic: "feedback-warning", figmaPath: "alert/filled-warning-background" },
    "alert-filled-warning-text": { type: "COLOR", semantic: "text-default", figmaPath: "alert/filled-warning-text" },
    "alert-filled-warning-border": { type: "COLOR", semantic: "feedback-warning", figmaPath: "alert/filled-warning-border" },
    "alert-filled-error-background": { type: "COLOR", semantic: "feedback-error", figmaPath: "alert/filled-error-background" },
    "alert-filled-error-text": { type: "COLOR", semantic: "text-on-interactive", figmaPath: "alert/filled-error-text" },
    "alert-filled-error-border": { type: "COLOR", semantic: "feedback-error", figmaPath: "alert/filled-error-border" },

    "alert-outline-info-background": { type: "COLOR", semantic: "surface-default", figmaPath: "alert/outline-info-background" },
    "alert-outline-info-text": { type: "COLOR", semantic: "feedback-info", figmaPath: "alert/outline-info-text" },
    "alert-outline-info-border": { type: "COLOR", semantic: "feedback-info", figmaPath: "alert/outline-info-border" },
    "alert-outline-success-background": { type: "COLOR", semantic: "surface-default", figmaPath: "alert/outline-success-background" },
    "alert-outline-success-text": { type: "COLOR", semantic: "feedback-success", figmaPath: "alert/outline-success-text" },
    "alert-outline-success-border": { type: "COLOR", semantic: "feedback-success", figmaPath: "alert/outline-success-border" },
    "alert-outline-warning-background": { type: "COLOR", semantic: "surface-default", figmaPath: "alert/outline-warning-background" },
    "alert-outline-warning-text": { type: "COLOR", semantic: "feedback-warning", figmaPath: "alert/outline-warning-text" },
    "alert-outline-warning-border": { type: "COLOR", semantic: "feedback-warning", figmaPath: "alert/outline-warning-border" },
    "alert-outline-error-background": { type: "COLOR", semantic: "surface-default", figmaPath: "alert/outline-error-background" },
    "alert-outline-error-text": { type: "COLOR", semantic: "feedback-error", figmaPath: "alert/outline-error-text" },
    "alert-outline-error-border": { type: "COLOR", semantic: "feedback-error", figmaPath: "alert/outline-error-border" },

    // Per-status icon / close colors (these differ per variant and status).
    "alert-default-info-icon": { type: "COLOR", semantic: "feedback-info", figmaPath: "alert/default-info-icon" },
    "alert-default-info-close": { type: "COLOR", semantic: "feedback-info", figmaPath: "alert/default-info-close" },
    "alert-default-success-icon": { type: "COLOR", semantic: "feedback-success", figmaPath: "alert/default-success-icon" },
    "alert-default-success-close": { type: "COLOR", semantic: "feedback-success", figmaPath: "alert/default-success-close" },
    "alert-default-warning-icon": { type: "COLOR", semantic: "feedback-warning", figmaPath: "alert/default-warning-icon" },
    "alert-default-warning-close": { type: "COLOR", semantic: "feedback-warning", figmaPath: "alert/default-warning-close" },
    "alert-default-error-icon": { type: "COLOR", semantic: "feedback-error", figmaPath: "alert/default-error-icon" },
    "alert-default-error-close": { type: "COLOR", semantic: "feedback-error", figmaPath: "alert/default-error-close" },

    "alert-filled-info-icon": { type: "COLOR", semantic: "text-on-interactive", figmaPath: "alert/filled-info-icon" },
    "alert-filled-info-close": { type: "COLOR", semantic: "text-on-interactive", figmaPath: "alert/filled-info-close" },
    "alert-filled-success-icon": { type: "COLOR", semantic: "text-on-interactive", figmaPath: "alert/filled-success-icon" },
    "alert-filled-success-close": { type: "COLOR", semantic: "text-on-interactive", figmaPath: "alert/filled-success-close" },
    "alert-filled-warning-icon": { type: "COLOR", semantic: "text-default", figmaPath: "alert/filled-warning-icon" },
    "alert-filled-warning-close": { type: "COLOR", semantic: "text-default", figmaPath: "alert/filled-warning-close" },
    "alert-filled-error-icon": { type: "COLOR", semantic: "text-on-interactive", figmaPath: "alert/filled-error-icon" },
    "alert-filled-error-close": { type: "COLOR", semantic: "text-on-interactive", figmaPath: "alert/filled-error-close" },

    "alert-outline-info-icon": { type: "COLOR", semantic: "feedback-info", figmaPath: "alert/outline-info-icon" },
    "alert-outline-info-close": { type: "COLOR", semantic: "feedback-info", figmaPath: "alert/outline-info-close" },
    "alert-outline-success-icon": { type: "COLOR", semantic: "feedback-success", figmaPath: "alert/outline-success-icon" },
    "alert-outline-success-close": { type: "COLOR", semantic: "feedback-success", figmaPath: "alert/outline-success-close" },
    "alert-outline-warning-icon": { type: "COLOR", semantic: "feedback-warning", figmaPath: "alert/outline-warning-icon" },
    "alert-outline-warning-close": { type: "COLOR", semantic: "feedback-warning", figmaPath: "alert/outline-warning-close" },
    "alert-outline-error-icon": { type: "COLOR", semantic: "feedback-error", figmaPath: "alert/outline-error-icon" },
    "alert-outline-error-close": { type: "COLOR", semantic: "feedback-error", figmaPath: "alert/outline-error-close" },

    "alert-icon": { type: "COLOR", semantic: "interactive-primary", figmaPath: "alert/icon" },
    "alert-close": { type: "COLOR", semantic: "text-default", figmaPath: "alert/close" },

    // ── FLOAT TOKENS ──
    "alert-radius": { type: "FLOAT", unit: "px", sizes: { default: 8, xs: 2, sm: 4, md: 8, lg: 16, xl: 32 }, figmaPath: "alert/radius" },
    "alert-padding-x": { type: "FLOAT", unit: "px", value: 12, figmaPath: "alert/padding-x" },
    "alert-padding-y": { type: "FLOAT", unit: "px", value: 10, figmaPath: "alert/padding-y" },
    "alert-title-font-size": { type: "FLOAT", unit: "px", value: 14, figmaPath: "alert/title-font-size" },
    "alert-title-font-family": { type: "STRING", value: "Inter", figmaPath: "alert/title-font-family" },
    "alert-title-font-weight": { type: "STRING", value: "Semi Bold", figmaPath: "alert/title-font-weight" },
    "alert-title-line-height": { type: "FLOAT", unit: "px", value: 20, figmaPath: "alert/title-line-height" },
    "alert-message-font-size": { type: "FLOAT", unit: "px", value: 13, figmaPath: "alert/message-font-size" },
    "alert-message-font-family": { type: "STRING", value: "Inter", figmaPath: "alert/message-font-family" },
    "alert-message-font-weight": { type: "STRING", value: "Regular", figmaPath: "alert/message-font-weight" },
    "alert-message-line-height": { type: "FLOAT", unit: "px", value: 20, figmaPath: "alert/message-line-height" },
    "alert-icon-title-gap": { type: "FLOAT", unit: "px", value: 8, figmaPath: "alert/icon-title-gap" },
    "alert-title-message-gap": { type: "FLOAT", unit: "px", value: 6, figmaPath: "alert/title-message-gap" },
    "alert-border-width": { type: "FLOAT", unit: "px", value: 1, figmaPath: "alert/border-width" },
    "alert-icon-stroke-width": { type: "FLOAT", unit: "px", value: 2, figmaPath: "alert/icon-stroke-width" },
  },

  modal: {
    // ── COLOR TOKENS — DEFAULT VARIANT (distinct header bar + dividers) ──
    "modal-default-background": { type: "COLOR", semantic: "surface-default", figmaPath: "modal/default-background" },
    "modal-default-header-background": { type: "COLOR", semantic: "surface-secondary", figmaPath: "modal/default-header-background" },
    "modal-default-footer-background": { type: "COLOR", semantic: "surface-default", figmaPath: "modal/default-footer-background" },
    "modal-default-border": { type: "COLOR", semantic: "border-default", figmaPath: "modal/default-border" },
    "modal-default-header-border": { type: "COLOR", semantic: "border-default", figmaPath: "modal/default-header-border" },
    "modal-default-footer-border": { type: "COLOR", semantic: "border-default", figmaPath: "modal/default-footer-border" },
    "modal-default-title": { type: "COLOR", semantic: "text-default", figmaPath: "modal/default-title" },
    "modal-default-body": { type: "COLOR", semantic: "text-default", figmaPath: "modal/default-body" },
    "modal-default-overlay": { type: "COLOR", semantic: "surface-inverse", figmaPath: "modal/default-overlay" },
    "modal-default-close": { type: "COLOR", semantic: "text-default", figmaPath: "modal/default-close" },

    // ── COLOR TOKENS — FILLED VARIANT (single flat surface color; matches the
    // original modal exactly so existing usage is unchanged) ──
    "modal-filled-background": { type: "COLOR", semantic: "surface-default", figmaPath: "modal/filled-background" },
    "modal-filled-header-background": { type: "COLOR", semantic: "surface-default", figmaPath: "modal/filled-header-background" },
    "modal-filled-footer-background": { type: "COLOR", semantic: "surface-default", figmaPath: "modal/filled-footer-background" },
    "modal-filled-border": { type: "COLOR", semantic: "border-default", figmaPath: "modal/filled-border" },
    "modal-filled-header-border": { type: "COLOR", semantic: "border-default", figmaPath: "modal/filled-header-border" },
    "modal-filled-footer-border": { type: "COLOR", semantic: "border-default", figmaPath: "modal/filled-footer-border" },
    "modal-filled-title": { type: "COLOR", semantic: "text-default", figmaPath: "modal/filled-title" },
    "modal-filled-body": { type: "COLOR", semantic: "text-default", figmaPath: "modal/filled-body" },
    "modal-filled-overlay": { type: "COLOR", semantic: "surface-inverse", figmaPath: "modal/filled-overlay" },
    "modal-filled-close": { type: "COLOR", semantic: "text-default", figmaPath: "modal/filled-close" },

    // ── FLOAT TOKENS (size variants: xs, sm, md, lg, xl) ──
    "modal-width": { type: "FLOAT", unit: "px", sizes: { default: 420, xs: 280, sm: 340, md: 420, lg: 520, xl: 640 }, figmaPath: "modal/width" },
    "modal-radius": { type: "FLOAT", unit: "px", sizes: { default: 8, xs: 2, sm: 4, md: 8, lg: 16, xl: 32 }, figmaPath: "modal/radius" },

    // ── SPACING + TYPOGRAPHY + BORDER-WIDTH — DEFAULT VARIANT ──
    // These are per-variant so the two modal styles can size/space independently.
    "modal-default-padding-x": { type: "FLOAT", unit: "px", value: 16, figmaPath: "modal/default-padding-x" },
    "modal-default-padding-y": { type: "FLOAT", unit: "px", value: 14, figmaPath: "modal/default-padding-y" },
    "modal-default-header-padding-x": { type: "FLOAT", unit: "px", value: 16, figmaPath: "modal/default-header-padding-x" },
    "modal-default-header-padding-y": { type: "FLOAT", unit: "px", value: 12, figmaPath: "modal/default-header-padding-y" },
    "modal-default-body-padding-top": { type: "FLOAT", unit: "px", value: 0, figmaPath: "modal/default-body-padding-top" },
    "modal-default-body-padding-right": { type: "FLOAT", unit: "px", value: 16, figmaPath: "modal/default-body-padding-right" },
    "modal-default-body-padding-bottom": { type: "FLOAT", unit: "px", value: 12, figmaPath: "modal/default-body-padding-bottom" },
    "modal-default-body-padding-left": { type: "FLOAT", unit: "px", value: 16, figmaPath: "modal/default-body-padding-left" },
    "modal-default-footer-padding-top": { type: "FLOAT", unit: "px", value: 12, figmaPath: "modal/default-footer-padding-top" },
    "modal-default-footer-padding-right": { type: "FLOAT", unit: "px", value: 16, figmaPath: "modal/default-footer-padding-right" },
    "modal-default-footer-padding-bottom": { type: "FLOAT", unit: "px", value: 12, figmaPath: "modal/default-footer-padding-bottom" },
    "modal-default-footer-padding-left": { type: "FLOAT", unit: "px", value: 16, figmaPath: "modal/default-footer-padding-left" },
    "modal-default-title-font-size": { type: "FLOAT", unit: "px", value: 18, figmaPath: "modal/default-title-font-size" },
    "modal-default-title-font-family": { type: "STRING", value: "Inter", figmaPath: "modal/default-title-font-family" },
    "modal-default-title-font-weight": { type: "STRING", value: "Bold", figmaPath: "modal/default-title-font-weight" },
    "modal-default-title-line-height": { type: "FLOAT", unit: "px", value: 24, figmaPath: "modal/default-title-line-height" },
    "modal-default-body-font-size": { type: "FLOAT", unit: "px", value: 14, figmaPath: "modal/default-body-font-size" },
    "modal-default-body-font-family": { type: "STRING", value: "Inter", figmaPath: "modal/default-body-font-family" },
    "modal-default-body-font-weight": { type: "STRING", value: "Regular", figmaPath: "modal/default-body-font-weight" },
    "modal-default-body-line-height": { type: "FLOAT", unit: "px", value: 20, figmaPath: "modal/default-body-line-height" },
    "modal-default-border-width": { type: "FLOAT", unit: "px", value: 1, figmaPath: "modal/default-border-width" },

    // ── SPACING + TYPOGRAPHY + BORDER-WIDTH — FILLED VARIANT ──
    "modal-filled-padding-x": { type: "FLOAT", unit: "px", value: 16, figmaPath: "modal/filled-padding-x" },
    "modal-filled-padding-y": { type: "FLOAT", unit: "px", value: 14, figmaPath: "modal/filled-padding-y" },
    "modal-filled-header-padding-x": { type: "FLOAT", unit: "px", value: 16, figmaPath: "modal/filled-header-padding-x" },
    "modal-filled-header-padding-y": { type: "FLOAT", unit: "px", value: 12, figmaPath: "modal/filled-header-padding-y" },
    "modal-filled-body-padding-top": { type: "FLOAT", unit: "px", value: 0, figmaPath: "modal/filled-body-padding-top" },
    "modal-filled-body-padding-right": { type: "FLOAT", unit: "px", value: 16, figmaPath: "modal/filled-body-padding-right" },
    "modal-filled-body-padding-bottom": { type: "FLOAT", unit: "px", value: 12, figmaPath: "modal/filled-body-padding-bottom" },
    "modal-filled-body-padding-left": { type: "FLOAT", unit: "px", value: 16, figmaPath: "modal/filled-body-padding-left" },
    "modal-filled-footer-padding-top": { type: "FLOAT", unit: "px", value: 12, figmaPath: "modal/filled-footer-padding-top" },
    "modal-filled-footer-padding-right": { type: "FLOAT", unit: "px", value: 16, figmaPath: "modal/filled-footer-padding-right" },
    "modal-filled-footer-padding-bottom": { type: "FLOAT", unit: "px", value: 12, figmaPath: "modal/filled-footer-padding-bottom" },
    "modal-filled-footer-padding-left": { type: "FLOAT", unit: "px", value: 16, figmaPath: "modal/filled-footer-padding-left" },
    "modal-filled-title-font-size": { type: "FLOAT", unit: "px", value: 18, figmaPath: "modal/filled-title-font-size" },
    "modal-filled-title-font-family": { type: "STRING", value: "Inter", figmaPath: "modal/filled-title-font-family" },
    "modal-filled-title-font-weight": { type: "STRING", value: "Bold", figmaPath: "modal/filled-title-font-weight" },
    "modal-filled-title-line-height": { type: "FLOAT", unit: "px", value: 24, figmaPath: "modal/filled-title-line-height" },
    "modal-filled-body-font-size": { type: "FLOAT", unit: "px", value: 14, figmaPath: "modal/filled-body-font-size" },
    "modal-filled-body-font-family": { type: "STRING", value: "Inter", figmaPath: "modal/filled-body-font-family" },
    "modal-filled-body-font-weight": { type: "STRING", value: "Regular", figmaPath: "modal/filled-body-font-weight" },
    "modal-filled-body-line-height": { type: "FLOAT", unit: "px", value: 20, figmaPath: "modal/filled-body-line-height" },
    "modal-filled-border-width": { type: "FLOAT", unit: "px", value: 1, figmaPath: "modal/filled-border-width" },

    // ── SHARED FLOAT TOKENS (apply to both variants) ──
    "modal-overlay-opacity": { type: "FLOAT", unit: "", value: 45, figmaPath: "modal/overlay-opacity" },
    "modal-close-icon-stroke-width": { type: "FLOAT", unit: "px", value: 2, figmaPath: "modal/close-icon-stroke-width" },
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
    "textinput-default-placeholder-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "textinput/default-placeholder-disabled" },
    "textinput-filled-placeholder-disabled":  { type: "COLOR", semantic: "text-disabled", figmaPath: "textinput/filled-placeholder-disabled" },
    "textinput-label-color":    { type: "COLOR", semantic: "text-default",     figmaPath: "textinput/label-color" },
    "textinput-label-color-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "textinput/label-color-disabled" },
    "textinput-asterisk-color": { type: "COLOR", semantic: "feedback-error",   figmaPath: "textinput/asterisk-color" },
    "textinput-error-color":    { type: "COLOR", semantic: "feedback-error",   figmaPath: "textinput/error-color" },
    "textinput-focus-ring":     { type: "COLOR", semantic: "border-focus",     figmaPath: "textinput/focus-ring" },

    // ── ICON COLORS (per variant, per state) ──
    "textinput-default-icon":          { type: "COLOR", semantic: "text-placeholder", figmaPath: "textinput/default-icon" },
    "textinput-default-icon-hover":    { type: "COLOR", semantic: "text-placeholder", figmaPath: "textinput/default-icon-hover" },
    "textinput-default-icon-focus":    { type: "COLOR", semantic: "text-default",     figmaPath: "textinput/default-icon-focus" },
    "textinput-default-icon-error":    { type: "COLOR", semantic: "feedback-error",   figmaPath: "textinput/default-icon-error" },
    "textinput-default-icon-disabled": { type: "COLOR", semantic: "text-disabled",    figmaPath: "textinput/default-icon-disabled" },
    "textinput-filled-icon":           { type: "COLOR", semantic: "text-placeholder", figmaPath: "textinput/filled-icon" },
    "textinput-filled-icon-hover":     { type: "COLOR", semantic: "text-placeholder", figmaPath: "textinput/filled-icon-hover" },
    "textinput-filled-icon-focus":     { type: "COLOR", semantic: "text-default",     figmaPath: "textinput/filled-icon-focus" },
    "textinput-filled-icon-error":     { type: "COLOR", semantic: "feedback-error",   figmaPath: "textinput/filled-icon-error" },
    "textinput-filled-icon-disabled":  { type: "COLOR", semantic: "text-disabled",    figmaPath: "textinput/filled-icon-disabled" },

    // ── FLOAT TOKENS (size variants: xs, sm, md, lg, xl) ──
    "textinput-height":    { type: "FLOAT", unit: "px", sizes: { xs: 30, sm: 36, md: 42, lg: 50, xl: 60 },  figmaPath: "textinput/height" },
    "textinput-font-size": { type: "FLOAT", unit: "px", sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 },  figmaPath: "textinput/font-size" },
    "textinput-font-family": { type: "STRING", value: "Inter", figmaPath: "textinput/font-family" },
    "textinput-font-weight": { type: "STRING", value: "Regular", figmaPath: "textinput/font-weight" },
    "textinput-line-height": { type: "FLOAT", unit: "px", sizes: { xs: 16, sm: 20, md: 24, lg: 28, xl: 32 }, figmaPath: "textinput/line-height" },
    "textinput-padding-x": { type: "FLOAT", unit: "px", sizes: { xs: 8,  sm: 10, md: 12, lg: 16, xl: 20 },  figmaPath: "textinput/padding-x" },
    "textinput-padding-y": { type: "FLOAT", unit: "px", sizes: { xs: 6,  sm: 8,  md: 10, lg: 12, xl: 14 },  figmaPath: "textinput/padding-y" },
    "textinput-icon-size": { type: "FLOAT", unit: "px", sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 }, figmaPath: "textinput/icon-size" },
    "textinput-icon-gap": { type: "FLOAT", unit: "px", sizes: { xs: 4, sm: 6, md: 8, lg: 10, xl: 12 }, figmaPath: "textinput/icon-gap" },
    "textinput-section-size": { type: "FLOAT", unit: "px", sizes: { xs: 20, sm: 26, md: 32, lg: 38, xl: 44 }, figmaPath: "textinput/section-size" },

    // ── FLOAT TOKENS (radius variants: xs, sm, md, lg, xl — independent from size) ──
    "textinput-radius": { type: "FLOAT", unit: "px", sizes: { xs: 2, sm: 4, md: 8, lg: 16, xl: 32 }, figmaPath: "textinput/radius" },

    // ── FLOAT TOKENS (single value, shared across all sizes) ──
    "textinput-border-width":    { type: "FLOAT", unit: "px", value: 1,  figmaPath: "textinput/border-width" },
    "textinput-label-font-size": { type: "FLOAT", unit: "px", sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 }, figmaPath: "textinput/label-font-size" },
    "textinput-label-font-family": { type: "STRING", value: "Inter", figmaPath: "textinput/label-font-family" },
    "textinput-label-font-weight": { type: "STRING", value: "Semi Bold", figmaPath: "textinput/label-font-weight" },
    "textinput-label-line-height": { type: "FLOAT", unit: "px", value: 20, figmaPath: "textinput/label-line-height" },
    "textinput-label-gap":       { type: "FLOAT", unit: "px", sizes: { xs: 2, sm: 4, md: 6, lg: 8, xl: 10 }, figmaPath: "textinput/label-gap" },
    "textinput-error-font-size": { type: "FLOAT", unit: "px", value: 12, figmaPath: "textinput/error-font-size" },
    "textinput-error-font-family": { type: "STRING", value: "Inter", figmaPath: "textinput/error-font-family" },
    "textinput-error-font-weight": { type: "STRING", value: "Regular", figmaPath: "textinput/error-font-weight" },
    "textinput-error-line-height": { type: "FLOAT", unit: "px", value: 16, figmaPath: "textinput/error-line-height" },
    "textinput-error-gap":       { type: "FLOAT", unit: "px", value: 4,  figmaPath: "textinput/error-gap" },
  },

  select: {
    // ── DEFAULT VARIANT — BACKGROUND (per state) ──
    "select-default-background":          { type: "COLOR", semantic: "surface-default",      figmaPath: "select/default-background" },
    "select-default-background-hover":    { type: "COLOR", semantic: "surface-default",      figmaPath: "select/default-background-hover" },
    "select-default-background-focus":    { type: "COLOR", semantic: "surface-default",      figmaPath: "select/default-background-focus" },
    "select-default-background-error":    { type: "COLOR", semantic: "surface-default",      figmaPath: "select/default-background-error" },
    "select-default-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "select/default-background-disabled" },

    // ── DEFAULT VARIANT — BORDER (per state) ──
    "select-default-border":          { type: "COLOR", semantic: "border-default",  figmaPath: "select/default-border" },
    "select-default-border-hover":    { type: "COLOR", semantic: "border-default",  figmaPath: "select/default-border-hover" },
    "select-default-border-focus":    { type: "COLOR", semantic: "border-focus",    figmaPath: "select/default-border-focus" },
    "select-default-border-error":    { type: "COLOR", semantic: "feedback-error",  figmaPath: "select/default-border-error" },
    "select-default-border-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "select/default-border-disabled" },

    // ── FILLED VARIANT — BACKGROUND (per state) ──
    "select-filled-background":          { type: "COLOR", semantic: "interactive-secondary",       figmaPath: "select/filled-background" },
    "select-filled-background-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "select/filled-background-hover" },
    "select-filled-background-focus":    { type: "COLOR", semantic: "interactive-secondary",       figmaPath: "select/filled-background-focus" },
    "select-filled-background-error":    { type: "COLOR", semantic: "interactive-secondary",       figmaPath: "select/filled-background-error" },
    "select-filled-background-disabled": { type: "COLOR", semantic: "interactive-disabled",        figmaPath: "select/filled-background-disabled" },

    // ── FILLED VARIANT — BORDER (per state) ──
    "select-filled-border":          { type: "COLOR", semantic: "interactive-secondary",       figmaPath: "select/filled-border" },
    "select-filled-border-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "select/filled-border-hover" },
    "select-filled-border-focus":    { type: "COLOR", semantic: "border-focus",                figmaPath: "select/filled-border-focus" },
    "select-filled-border-error":    { type: "COLOR", semantic: "feedback-error",              figmaPath: "select/filled-border-error" },
    "select-filled-border-disabled": { type: "COLOR", semantic: "interactive-disabled",        figmaPath: "select/filled-border-disabled" },

    // ── SHARED COLOR TOKENS ──
    "select-text":           { type: "COLOR", semantic: "text-default",     figmaPath: "select/text" },
    "select-default-text-hover": { type: "COLOR", semantic: "text-default", figmaPath: "select/default-text-hover" },
    "select-filled-text-hover":  { type: "COLOR", semantic: "text-default", figmaPath: "select/filled-text-hover" },
    "select-text-error":     { type: "COLOR", semantic: "feedback-error",   figmaPath: "select/text-error" },
    "select-default-text-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "select/default-text-disabled" },
    "select-filled-text-disabled":  { type: "COLOR", semantic: "text-disabled", figmaPath: "select/filled-text-disabled" },
    "select-default-placeholder": { type: "COLOR", semantic: "text-placeholder", figmaPath: "select/default-placeholder" },
    "select-filled-placeholder": { type: "COLOR", semantic: "text-placeholder", figmaPath: "select/filled-placeholder" },
    "select-placeholder-error": { type: "COLOR", semantic: "feedback-error", figmaPath: "select/placeholder-error" },
    "select-default-placeholder-error": { type: "COLOR", semantic: "feedback-error", figmaPath: "select/default-placeholder-error" },
    "select-filled-placeholder-error": { type: "COLOR", semantic: "feedback-error", figmaPath: "select/filled-placeholder-error" },
    "select-label-color":    { type: "COLOR", semantic: "text-default",     figmaPath: "select/label-color" },
    "select-asterisk-color": { type: "COLOR", semantic: "feedback-error",   figmaPath: "select/asterisk-color" },
    "select-error-color":    { type: "COLOR", semantic: "feedback-error",   figmaPath: "select/error-color" },
    /** Right-slot / chevron icon tint (Mantine `section`). */
    "select-icon":           { type: "COLOR", semantic: "text-default",     figmaPath: "select/icon" },
    "select-default-icon-hover": { type: "COLOR", semantic: "text-default", figmaPath: "select/default-icon-hover" },
    "select-filled-icon-hover":  { type: "COLOR", semantic: "text-default", figmaPath: "select/filled-icon-hover" },
    "select-default-icon-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "select/default-icon-disabled" },
    "select-filled-icon-disabled":  { type: "COLOR", semantic: "text-disabled", figmaPath: "select/filled-icon-disabled" },
    "select-icon-error":     { type: "COLOR", semantic: "feedback-error",   figmaPath: "select/icon-error" },
    "select-focus-ring":     { type: "COLOR", semantic: "border-focus",     figmaPath: "select/focus-ring" },
    /** Listbox panel (open dropdown behind the trigger). */
    "select-default-dropdown-background": { type: "COLOR", semantic: "surface-default", figmaPath: "select/default-dropdown-background" },
    "select-default-dropdown-border":     { type: "COLOR", semantic: "border-default",  figmaPath: "select/default-dropdown-border" },
    "select-filled-dropdown-background":  { type: "COLOR", semantic: "interactive-secondary", figmaPath: "select/filled-dropdown-background" },
    "select-filled-dropdown-border":      { type: "COLOR", semantic: "border-default",  figmaPath: "select/filled-dropdown-border" },
    /** Highlight for the checked row (check icon / current value row). */
    "select-default-option-selected-background": {
      type: "COLOR",
      semantic: "subtle-primary",
      figmaPath: "select/default-option-selected-background",
    },
    "select-filled-option-selected-background": {
      type: "COLOR",
      semantic: "subtle-primary",
      figmaPath: "select/filled-option-selected-background",
    },
    /** Label text for the currently-selected row (readability vs selected BG). */
    "select-default-option-selected-text": {
      type: "COLOR",
      semantic: "text-default",
      figmaPath: "select/default-option-selected-text",
    },
    "select-filled-option-selected-text": {
      type: "COLOR",
      semantic: "text-default",
      figmaPath: "select/filled-option-selected-text",
    },
    /**
     * Hovered row (pointer) and keyboard-highlighted row (`data-combobox-selected`).
     * Default semantic is subdued so it stays off pure white vs the menu; remap in semantics as needed.
     */
    "select-default-option-hover-background": {
      type: "COLOR",
      semantic: "subtle-secondary",
      figmaPath: "select/default-option-hover-background",
    },
    "select-filled-option-hover-background": {
      type: "COLOR",
      semantic: "subtle-secondary",
      figmaPath: "select/filled-option-hover-background",
    },
    /** Label text when an option is hovered / keyboard-highlighted (readability vs hover BG). */
    "select-default-option-hover-text": {
      type: "COLOR",
      semantic: "text-default",
      figmaPath: "select/default-option-hover-text",
    },
    "select-filled-option-hover-text": {
      type: "COLOR",
      semantic: "text-default",
      figmaPath: "select/filled-option-hover-text",
    },

    // ── FLOAT TOKENS (size variants: default, xs, sm, md, lg, xl) ──
    "select-font-size":    { type: "FLOAT", unit: "px", sizes: { default: 14, xs: 12, sm: 14, md: 16, lg: 18, xl: 20 }, figmaPath: "select/font-size" },
    "select-default-font-family": { type: "STRING", value: "Inter", figmaPath: "select/default-font-family" },
    "select-default-font-weight": { type: "STRING", value: "Semi Bold", figmaPath: "select/default-font-weight" },
    "select-filled-font-family": { type: "STRING", value: "Inter", figmaPath: "select/filled-font-family" },
    "select-filled-font-weight": { type: "STRING", value: "Semi Bold", figmaPath: "select/filled-font-weight" },
    "select-line-height": { type: "FLOAT", unit: "px", sizes: { default: 18, xs: 16, sm: 20, md: 24, lg: 28, xl: 32 }, figmaPath: "select/line-height" },
    "select-default-padding-x": { type: "FLOAT", unit: "px", sizes: { default: 12, xs: 8,  sm: 10, md: 12, lg: 16, xl: 20 }, figmaPath: "select/default-padding-x" },
    "select-default-padding-y": { type: "FLOAT", unit: "px", sizes: { default: 8,  xs: 7,  sm: 8,  md: 9,  lg: 11, xl: 14 }, figmaPath: "select/default-padding-y" },
    "select-filled-padding-x":  { type: "FLOAT", unit: "px", sizes: { default: 12, xs: 8,  sm: 10, md: 12, lg: 16, xl: 20 }, figmaPath: "select/filled-padding-x" },
    "select-filled-padding-y":  { type: "FLOAT", unit: "px", sizes: { default: 8,  xs: 7,  sm: 8,  md: 9,  lg: 11, xl: 14 }, figmaPath: "select/filled-padding-y" },
    "select-icon-size": { type: "FLOAT", unit: "px", sizes: { default: 14, xs: 12, sm: 14, md: 16, lg: 18, xl: 20 }, figmaPath: "select/icon-size" },
    "select-icon-stroke-width": { type: "FLOAT", unit: "px", sizes: { default: 2, xs: 1.5, sm: 1.75, md: 2, lg: 2.25, xl: 2.5 }, figmaPath: "select/icon-stroke-width" },

    // ── FLOAT TOKENS (radius variants: default, xs, sm, md, lg, xl — independent from size) ──
    "select-radius": { type: "FLOAT", unit: "px", sizes: { default: 4, xs: 2, sm: 4, md: 8, lg: 16, xl: 32 }, figmaPath: "select/radius" },

    // ── FLOAT TOKENS (single value, shared across all sizes) ──
    "select-border-width":    { type: "FLOAT", unit: "px", value: 1,  figmaPath: "select/border-width" },
    "select-label-font-size": { type: "FLOAT", unit: "px", value: 14, figmaPath: "select/label-font-size" },
    "select-label-font-family": { type: "STRING", value: "Inter", figmaPath: "select/label-font-family" },
    "select-label-font-weight": { type: "STRING", value: "Semi Bold", figmaPath: "select/label-font-weight" },
    "select-label-line-height": { type: "FLOAT", unit: "px", value: 20, figmaPath: "select/label-line-height" },
    "select-label-gap":       { type: "FLOAT", unit: "px", value: 4,  figmaPath: "select/label-gap" },
    "select-error-font-size": { type: "FLOAT", unit: "px", value: 12, figmaPath: "select/error-font-size" },
    "select-error-font-family": { type: "STRING", value: "Inter", figmaPath: "select/error-font-family" },
    "select-error-font-weight": { type: "STRING", value: "Regular", figmaPath: "select/error-font-weight" },
    "select-error-line-height": { type: "FLOAT", unit: "px", value: 16, figmaPath: "select/error-line-height" },
    "select-error-gap":       { type: "FLOAT", unit: "px", value: 4,  figmaPath: "select/error-gap" },
  },

  multiselect: {
    // ── DEFAULT VARIANT — BACKGROUND (per state) ──
    "multiselect-default-background":          { type: "COLOR", semantic: "surface-default",      figmaPath: "multiselect/default-background" },
    "multiselect-default-background-hover":    { type: "COLOR", semantic: "surface-default",      figmaPath: "multiselect/default-background-hover" },
    "multiselect-default-background-focus":    { type: "COLOR", semantic: "surface-default",      figmaPath: "multiselect/default-background-focus" },
    "multiselect-default-background-error":    { type: "COLOR", semantic: "surface-default",      figmaPath: "multiselect/default-background-error" },
    "multiselect-default-background-disabled": { type: "COLOR", semantic: "interactive-disabled", figmaPath: "multiselect/default-background-disabled" },

    // ── DEFAULT VARIANT — BORDER (per state) ──
    "multiselect-default-border":          { type: "COLOR", semantic: "border-default",  figmaPath: "multiselect/default-border" },
    "multiselect-default-border-hover":    { type: "COLOR", semantic: "border-default",  figmaPath: "multiselect/default-border-hover" },
    "multiselect-default-border-focus":    { type: "COLOR", semantic: "border-focus",    figmaPath: "multiselect/default-border-focus" },
    "multiselect-default-border-error":    { type: "COLOR", semantic: "feedback-error",  figmaPath: "multiselect/default-border-error" },
    "multiselect-default-border-disabled": { type: "COLOR", semantic: "border-disabled", figmaPath: "multiselect/default-border-disabled" },

    // ── FILLED VARIANT — BACKGROUND (per state) ──
    "multiselect-filled-background":          { type: "COLOR", semantic: "interactive-secondary",       figmaPath: "multiselect/filled-background" },
    "multiselect-filled-background-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "multiselect/filled-background-hover" },
    "multiselect-filled-background-focus":    { type: "COLOR", semantic: "interactive-secondary",       figmaPath: "multiselect/filled-background-focus" },
    "multiselect-filled-background-error":    { type: "COLOR", semantic: "interactive-secondary",       figmaPath: "multiselect/filled-background-error" },
    "multiselect-filled-background-disabled": { type: "COLOR", semantic: "interactive-disabled",        figmaPath: "multiselect/filled-background-disabled" },

    // ── FILLED VARIANT — BORDER (per state) ──
    "multiselect-filled-border":          { type: "COLOR", semantic: "interactive-secondary",       figmaPath: "multiselect/filled-border" },
    "multiselect-filled-border-hover":    { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "multiselect/filled-border-hover" },
    "multiselect-filled-border-focus":    { type: "COLOR", semantic: "border-focus",                figmaPath: "multiselect/filled-border-focus" },
    "multiselect-filled-border-error":    { type: "COLOR", semantic: "feedback-error",              figmaPath: "multiselect/filled-border-error" },
    "multiselect-filled-border-disabled": { type: "COLOR", semantic: "interactive-disabled",        figmaPath: "multiselect/filled-border-disabled" },

    // ── SHARED COLOR TOKENS ──
    "multiselect-text":           { type: "COLOR", semantic: "text-default",     figmaPath: "multiselect/text" },
    "multiselect-text-disabled":  { type: "COLOR", semantic: "text-disabled",    figmaPath: "multiselect/text-disabled" },
    "multiselect-default-placeholder": { type: "COLOR", semantic: "text-placeholder", figmaPath: "multiselect/default-placeholder" },
    "multiselect-filled-placeholder": { type: "COLOR", semantic: "text-placeholder", figmaPath: "multiselect/filled-placeholder" },
    "multiselect-placeholder-error": { type: "COLOR", semantic: "feedback-error", figmaPath: "multiselect/placeholder-error" },
    "multiselect-default-placeholder-error": { type: "COLOR", semantic: "feedback-error", figmaPath: "multiselect/default-placeholder-error" },
    "multiselect-filled-placeholder-error": { type: "COLOR", semantic: "feedback-error", figmaPath: "multiselect/filled-placeholder-error" },
    "multiselect-label-color":    { type: "COLOR", semantic: "text-default",     figmaPath: "multiselect/label-color" },
    "multiselect-asterisk-color": { type: "COLOR", semantic: "feedback-error",   figmaPath: "multiselect/asterisk-color" },
    "multiselect-error-color":    { type: "COLOR", semantic: "feedback-error",   figmaPath: "multiselect/error-color" },
    /** Right-slot / chevron icon tint (Mantine `section`). */
    "multiselect-icon":           { type: "COLOR", semantic: "text-default",     figmaPath: "multiselect/icon" },
    "multiselect-icon-disabled":  { type: "COLOR", semantic: "text-disabled",    figmaPath: "multiselect/icon-disabled" },
    "multiselect-icon-error":     { type: "COLOR", semantic: "feedback-error",   figmaPath: "multiselect/icon-error" },
    "multiselect-focus-ring":     { type: "COLOR", semantic: "border-focus",     figmaPath: "multiselect/focus-ring" },
    /** Selected-value pill (tag) shown inside the trigger. */
    "multiselect-default-pill-background": { type: "COLOR", semantic: "subtle-secondary", figmaPath: "multiselect/default-pill-background" },
    "multiselect-filled-pill-background":  { type: "COLOR", semantic: "subtle-secondary", figmaPath: "multiselect/filled-pill-background" },
    "multiselect-pill-text":         { type: "COLOR", semantic: "text-default",     figmaPath: "multiselect/pill-text" },
    "multiselect-pill-remove-icon":  { type: "COLOR", semantic: "text-placeholder", figmaPath: "multiselect/pill-remove-icon" },
    /** Error-state pill (tag) colors — used when the field is in error. */
    "multiselect-pill-background-error":  { type: "COLOR", semantic: "feedback-error",      figmaPath: "multiselect/pill-background-error" },
    "multiselect-pill-text-error":        { type: "COLOR", semantic: "text-on-interactive", figmaPath: "multiselect/pill-text-error" },
    "multiselect-pill-remove-icon-error": { type: "COLOR", semantic: "text-on-interactive", figmaPath: "multiselect/pill-remove-icon-error" },
    /** Disabled-state pill (tag) colors — used when the field is disabled. */
    "multiselect-pill-background-disabled":  { type: "COLOR", semantic: "interactive-disabled", figmaPath: "multiselect/pill-background-disabled" },
    "multiselect-pill-text-disabled":        { type: "COLOR", semantic: "text-disabled",        figmaPath: "multiselect/pill-text-disabled" },
    "multiselect-pill-remove-icon-disabled": { type: "COLOR", semantic: "text-disabled",        figmaPath: "multiselect/pill-remove-icon-disabled" },
    /** Listbox panel (open dropdown behind the trigger). */
    "multiselect-default-dropdown-background": { type: "COLOR", semantic: "surface-default", figmaPath: "multiselect/default-dropdown-background" },
    "multiselect-default-dropdown-border":     { type: "COLOR", semantic: "border-default",  figmaPath: "multiselect/default-dropdown-border" },
    "multiselect-filled-dropdown-background":  { type: "COLOR", semantic: "interactive-secondary", figmaPath: "multiselect/filled-dropdown-background" },
    "multiselect-filled-dropdown-border":      { type: "COLOR", semantic: "border-default",  figmaPath: "multiselect/filled-dropdown-border" },
    /** Highlight for the checked row (selected options in the open list). */
    "multiselect-default-option-selected-background": {
      type: "COLOR",
      semantic: "subtle-primary",
      figmaPath: "multiselect/default-option-selected-background",
    },
    "multiselect-filled-option-selected-background": {
      type: "COLOR",
      semantic: "subtle-primary",
      figmaPath: "multiselect/filled-option-selected-background",
    },
    /**
     * Hovered row (pointer) and keyboard-highlighted row (`data-combobox-selected`).
     * Default semantic is subdued so it stays off pure white vs the menu; remap in semantics as needed.
     */
    "multiselect-default-option-hover-background": {
      type: "COLOR",
      semantic: "subtle-secondary",
      figmaPath: "multiselect/default-option-hover-background",
    },
    "multiselect-filled-option-hover-background": {
      type: "COLOR",
      semantic: "subtle-secondary",
      figmaPath: "multiselect/filled-option-hover-background",
    },
    /** Label text when an option is hovered / keyboard-highlighted (readability vs hover BG). */
    "multiselect-default-option-hover-text": {
      type: "COLOR",
      semantic: "text-default",
      figmaPath: "multiselect/default-option-hover-text",
    },
    "multiselect-filled-option-hover-text": {
      type: "COLOR",
      semantic: "text-default",
      figmaPath: "multiselect/filled-option-hover-text",
    },
    /** Checkmark icon shown on selected rows in the open list. */
    "multiselect-option-check-icon": {
      type: "COLOR",
      semantic: "text-default",
      figmaPath: "multiselect/option-check-icon",
    },

    // ── FLOAT TOKENS (size variants: default, xs, sm, md, lg, xl) ──
    "multiselect-font-size":    { type: "FLOAT", unit: "px", sizes: { default: 14, xs: 12, sm: 14, md: 16, lg: 18, xl: 20 }, figmaPath: "multiselect/font-size" },
    "multiselect-default-font-family": { type: "STRING", value: "Inter", figmaPath: "multiselect/default-font-family" },
    "multiselect-default-font-weight": { type: "STRING", value: "Semi Bold", figmaPath: "multiselect/default-font-weight" },
    "multiselect-filled-font-family": { type: "STRING", value: "Inter", figmaPath: "multiselect/filled-font-family" },
    "multiselect-filled-font-weight": { type: "STRING", value: "Semi Bold", figmaPath: "multiselect/filled-font-weight" },
    "multiselect-line-height": { type: "FLOAT", unit: "px", sizes: { default: 18, xs: 16, sm: 20, md: 24, lg: 28, xl: 32 }, figmaPath: "multiselect/line-height" },
    "multiselect-default-padding-x": { type: "FLOAT", unit: "px", sizes: { default: 12, xs: 8,  sm: 10, md: 12, lg: 16, xl: 20 }, figmaPath: "multiselect/default-padding-x" },
    "multiselect-default-padding-y": { type: "FLOAT", unit: "px", sizes: { default: 8,  xs: 7,  sm: 8,  md: 9,  lg: 11, xl: 14 }, figmaPath: "multiselect/default-padding-y" },
    "multiselect-filled-padding-x":  { type: "FLOAT", unit: "px", sizes: { default: 12, xs: 8,  sm: 10, md: 12, lg: 16, xl: 20 }, figmaPath: "multiselect/filled-padding-x" },
    "multiselect-filled-padding-y":  { type: "FLOAT", unit: "px", sizes: { default: 8,  xs: 7,  sm: 8,  md: 9,  lg: 11, xl: 14 }, figmaPath: "multiselect/filled-padding-y" },
    "multiselect-icon-size": { type: "FLOAT", unit: "px", sizes: { default: 14, xs: 12, sm: 14, md: 16, lg: 18, xl: 20 }, figmaPath: "multiselect/icon-size" },
    "multiselect-icon-stroke-width": { type: "FLOAT", unit: "px", sizes: { default: 2, xs: 1.5, sm: 1.75, md: 2, lg: 2.25, xl: 2.5 }, figmaPath: "multiselect/icon-stroke-width" },
    "multiselect-pill-font-size": { type: "FLOAT", unit: "px", sizes: { default: 12, xs: 10, sm: 12, md: 14, lg: 16, xl: 18 }, figmaPath: "multiselect/pill-font-size" },
    "multiselect-pill-gap":       { type: "FLOAT", unit: "px", value: 4, figmaPath: "multiselect/pill-gap" },
    "multiselect-pill-remove-icon-stroke-width": { type: "FLOAT", unit: "px", sizes: { default: 2, xs: 1.5, sm: 1.75, md: 2, lg: 2.25, xl: 2.5 }, figmaPath: "multiselect/pill-remove-icon-stroke-width" },

    // ── FLOAT TOKENS (radius variants: default, xs, sm, md, lg, xl — independent from size) ──
    "multiselect-radius": { type: "FLOAT", unit: "px", sizes: { default: 4, xs: 2, sm: 4, md: 8, lg: 16, xl: 32 }, figmaPath: "multiselect/radius" },
    "multiselect-pill-radius": { type: "FLOAT", unit: "px", sizes: { default: 4, xs: 2, sm: 4, md: 8, lg: 16, xl: 32 }, figmaPath: "multiselect/pill-radius" },

    // ── FLOAT TOKENS (single value, shared across all sizes) ──
    "multiselect-border-width":    { type: "FLOAT", unit: "px", value: 1,  figmaPath: "multiselect/border-width" },
    /** Caps the open option list height; the list scrolls internally past this (maps to Mantine maxDropdownHeight). */
    "multiselect-dropdown-max-height": { type: "FLOAT", unit: "px", value: 220, figmaPath: "multiselect/dropdown-max-height" },
    "multiselect-label-font-size": { type: "FLOAT", unit: "px", value: 14, figmaPath: "multiselect/label-font-size" },
    "multiselect-label-font-family": { type: "STRING", value: "Inter", figmaPath: "multiselect/label-font-family" },
    "multiselect-label-font-weight": { type: "STRING", value: "Semi Bold", figmaPath: "multiselect/label-font-weight" },
    "multiselect-label-line-height": { type: "FLOAT", unit: "px", value: 20, figmaPath: "multiselect/label-line-height" },
    "multiselect-label-gap":       { type: "FLOAT", unit: "px", value: 4,  figmaPath: "multiselect/label-gap" },
    "multiselect-error-font-size": { type: "FLOAT", unit: "px", value: 12, figmaPath: "multiselect/error-font-size" },
    "multiselect-error-font-family": { type: "STRING", value: "Inter", figmaPath: "multiselect/error-font-family" },
    "multiselect-error-font-weight": { type: "STRING", value: "Regular", figmaPath: "multiselect/error-font-weight" },
    "multiselect-error-line-height": { type: "FLOAT", unit: "px", value: 16, figmaPath: "multiselect/error-line-height" },
    "multiselect-error-gap":       { type: "FLOAT", unit: "px", value: 4,  figmaPath: "multiselect/error-gap" },
  },

  image: {
    // ── FLOAT TOKENS (size variants: default, xs, sm, md, lg, xl) ──
    "image-width": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 360, xs: 120, sm: 180, md: 240, lg: 360, xl: 480 },
      figmaPath: "image/width",
    },
    "image-height": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 220, xs: 80, sm: 120, md: 160, lg: 220, xl: 280 },
      figmaPath: "image/height",
    },
    "image-radius": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 8, xs: 2, sm: 4, md: 8, lg: 16, xl: 32 },
      figmaPath: "image/radius",
    },
  },

  /** Loading placeholder. `circle` and `animate` are preview/Figma variant props, not tokens. */
  skeleton: {
    // ── COLOR TOKENS ──
    "skeleton-fill": { type: "COLOR", semantic: "surface-secondary", figmaPath: "skeleton/fill" },
    // ── FLOAT TOKENS (size variants: default, xs, sm, md, lg, xl) ──
    "skeleton-width": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 240, xs: 120, sm: 180, md: 240, lg: 320, xl: 420 },
      figmaPath: "skeleton/width",
    },
    "skeleton-height": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 16, xs: 8, sm: 12, md: 16, lg: 24, xl: 32 },
      figmaPath: "skeleton/height",
    },
    "skeleton-radius": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 4, xs: 2, sm: 4, md: 8, lg: 16, xl: 32 },
      figmaPath: "skeleton/radius",
    },
  },

  /** User avatar (image and/or initials); Mantine `Avatar` maps to size, radius, and filled surface. */
  avatar: {
    "avatar-background": { type: "COLOR", semantic: "surface-secondary", figmaPath: "avatar/background" },
    "avatar-border": { type: "COLOR", semantic: "border-default", figmaPath: "avatar/border" },
    "avatar-text": { type: "COLOR", semantic: "text-default", figmaPath: "avatar/text" },
    "avatar-border-width": { type: "FLOAT", unit: "px", value: 1, figmaPath: "avatar/border-width" },
    "avatar-size": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 40, xs: 24, sm: 32, md: 40, lg: 48, xl: 56 },
      figmaPath: "avatar/size",
    },
    "avatar-radius": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 999, xs: 12, sm: 16, md: 20, lg: 24, xl: 28 },
      figmaPath: "avatar/radius",
    },
    "avatar-font-size": {
      type: "FLOAT",
      unit: "px",
      sizes: { default: 16, xs: 10, sm: 13, md: 16, lg: 18, xl: 22 },
      figmaPath: "avatar/font-size",
    },
    "avatar-font-family": { type: "STRING", value: "Inter", figmaPath: "avatar/font-family" },
    "avatar-font-weight": { type: "STRING", value: "Semi Bold", figmaPath: "avatar/font-weight" },
  },

  anchor: {
    // ── COLOR TOKENS ──
    "anchor-color":          { type: "COLOR", semantic: "interactive-primary",       figmaPath: "anchor/color" },
    "anchor-color-hover":    { type: "COLOR", semantic: "interactive-primary-hover", figmaPath: "anchor/color-hover" },
    "anchor-color-visited":  { type: "COLOR", semantic: "interactive-primary",       figmaPath: "anchor/color-visited" },
    "anchor-color-disabled": { type: "COLOR", semantic: "text-disabled",             figmaPath: "anchor/color-disabled" },

    // ── FLOAT TOKENS (size variants: xs, sm, md, lg, xl) ──
    "anchor-font-family": { type: "STRING", value: "Inter", figmaPath: "anchor/font-family" },
    "anchor-font-size": {
      type: "FLOAT",
      unit: "px",
      sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 },
      figmaPath: "anchor/font-size",
    },
    "anchor-line-height": {
      type: "FLOAT",
      unit: "px",
      sizes: { xs: 16, sm: 20, md: 24, lg: 28, xl: 32 },
      figmaPath: "anchor/line-height",
    },

    // ── STRING TOKENS (single value) ──
    "anchor-font-weight-regular":  { type: "STRING", value: "Regular", figmaPath: "anchor/font-weight-regular" },
    "anchor-font-weight-semibold": { type: "STRING", value: "Semi Bold", figmaPath: "anchor/font-weight-semibold" },
    "anchor-font-weight-bold":     { type: "STRING", value: "Bold", figmaPath: "anchor/font-weight-bold" },
  },

  title: {
    // ── COLOR TOKENS ──
    "title-color": { type: "COLOR", semantic: "text-default", figmaPath: "title/color" },

    // ── FLOAT TOKENS (order/size variants: h1-h6) ──
    "title-font-family": { type: "STRING", value: "Inter", figmaPath: "title/font-family" },
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

    // ── STRING TOKENS (single value) ──
    "title-font-weight": { type: "STRING", value: "Bold", figmaPath: "title/font-weight" },
  },

  text: {
    // ── COLOR TOKENS ──
    "text-color": { type: "COLOR", semantic: "text-default", figmaPath: "text/color" },
    "text-color-dimmed": { type: "COLOR", semantic: "text-disabled", figmaPath: "text/color-dimmed" },
    "text-color-brand": { type: "COLOR", semantic: "interactive-primary", figmaPath: "text/color-brand" },
    "text-color-success": { type: "COLOR", semantic: "feedback-success", figmaPath: "text/color-success" },
    "text-color-warning": { type: "COLOR", semantic: "feedback-warning", figmaPath: "text/color-warning" },
    "text-color-error": { type: "COLOR", semantic: "feedback-error", figmaPath: "text/color-error" },

    // ── FLOAT TOKENS (size variants: label, caption, xs, sm, md, lg, xl) ──
    "text-font-family": { type: "STRING", value: "Inter", figmaPath: "text/font-family" },
    "text-font-size": {
      type: "FLOAT",
      unit: "px",
      sizes: { label: 14, caption: 12, xs: 12, sm: 14, md: 16, lg: 18, xl: 20 },
      figmaPath: "text/font-size",
    },
    "text-line-height": {
      type: "FLOAT",
      unit: "px",
      sizes: { label: 20, caption: 16, xs: 16, sm: 20, md: 24, lg: 28, xl: 32 },
      figmaPath: "text/line-height",
    },

    // ── STRING TOKENS (single value) ──
    "text-font-weight-regular": { type: "STRING", value: "Regular", figmaPath: "text/font-weight-regular" },
    "text-font-weight-medium": { type: "STRING", value: "Medium", figmaPath: "text/font-weight-medium" },
    "text-font-weight-semibold": { type: "STRING", value: "Semi Bold", figmaPath: "text/font-weight-semibold" },
    "text-font-weight-bold": { type: "STRING", value: "Bold", figmaPath: "text/font-weight-bold" },
  },

  /** Default data table (dense variant later). */
  table: {
    "table-background": { type: "COLOR", semantic: "surface-default", figmaPath: "table/background" },
    /** TableBody wrapper fill (Figma steel/8 — matches `surface-secondary` on steel scales). */
    "table-body-background": { type: "COLOR", semantic: "surface-secondary", figmaPath: "table/body-background" },
    /** Uniform inset on the TableBody component (Figma dev: 16px all sides). */
    "table-body-padding": { type: "FLOAT", unit: "px", value: 16, figmaPath: "table/body-padding" },
    "table-header-background": { type: "COLOR", semantic: "surface-secondary", figmaPath: "table/header-background" },
    "table-border": { type: "COLOR", semantic: "border-default", figmaPath: "table/border" },
    "table-row-divider": { type: "COLOR", semantic: "border-default", figmaPath: "table/row-divider" },
    "table-header-text": { type: "COLOR", semantic: "text-default", figmaPath: "table/header-text" },
    "table-cell-text": { type: "COLOR", semantic: "text-default", figmaPath: "table/cell-text" },
    "table-cell-secondary": { type: "COLOR", semantic: "text-subtle", figmaPath: "table/cell-secondary" },
    "table-row-hover": { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "table/row-hover" },
    "table-progress-track": { type: "COLOR", semantic: "surface-secondary", figmaPath: "table/progress-track" },
    "table-progress-fill": { type: "COLOR", semantic: "interactive-primary", figmaPath: "table/progress-fill" },
    "table-sort-icon": { type: "COLOR", semantic: "text-subtle", figmaPath: "table/sort-icon" },
    "table-priority-high": { type: "COLOR", semantic: "feedback-error", figmaPath: "table/priority-high" },
    "table-priority-medium": { type: "COLOR", semantic: "feedback-warning", figmaPath: "table/priority-medium" },
    "table-priority-low": { type: "COLOR", semantic: "feedback-success", figmaPath: "table/priority-low" },
    "table-status-pending": { type: "COLOR", semantic: "feedback-warning", figmaPath: "table/status-pending" },
    "table-status-complete": { type: "COLOR", semantic: "feedback-success", figmaPath: "table/status-complete" },
    "table-status-queued": { type: "COLOR", semantic: "interactive-primary", figmaPath: "table/status-queued" },
    "table-checkbox-border": { type: "COLOR", semantic: "border-default", figmaPath: "table/checkbox-border" },
    "table-checkbox-fill": { type: "COLOR", semantic: "interactive-primary", figmaPath: "table/checkbox-fill" },
    "table-padding-x": { type: "FLOAT", unit: "px", value: 16, figmaPath: "table/padding-x" },
    "table-padding-y": { type: "FLOAT", unit: "px", value: 12, figmaPath: "table/padding-y" },
    "table-header-padding-x": { type: "FLOAT", unit: "px", value: 16, figmaPath: "table/header-padding-x" },
    "table-header-padding-y": { type: "FLOAT", unit: "px", value: 16, figmaPath: "table/header-padding-y" },
    /** Horizontal gap between header label and sort icon (Figma auto-layout item spacing). */
    "table-header-icon-gap": { type: "FLOAT", unit: "px", value: 4, figmaPath: "table/header-icon-gap" },
    /** Stroke width for the table header sort icon (swapped instance vectors + vector fallback). */
    "table-header-icon-stroke-width": { type: "FLOAT", unit: "px", value: 1.25, figmaPath: "table/header-icon-stroke-width" },
    "table-cell-font-size": { type: "FLOAT", unit: "px", value: 13, figmaPath: "table/cell-font-size" },
    "table-cell-font-family": { type: "STRING", value: "Inter", figmaPath: "table/cell-font-family" },
    "table-cell-font-weight": { type: "STRING", value: "Regular", figmaPath: "table/cell-font-weight" },
    "table-cell-line-height": { type: "FLOAT", unit: "px", value: 20, figmaPath: "table/cell-line-height" },
    "table-header-font-size": { type: "FLOAT", unit: "px", value: 12, figmaPath: "table/header-font-size" },
    "table-header-font-weight": { type: "STRING", value: "Semi Bold", figmaPath: "table/header-font-weight" },
    "table-header-font-family": { type: "STRING", value: "Inter", figmaPath: "table/header-font-family" },
    "table-header-line-height": { type: "FLOAT", unit: "px", value: 16, figmaPath: "table/header-line-height" },
  },

  // Calendar (month grid). Mirrors Mantine's Calendar: a header (month label +
  // prev/next nav), a weekday row, and a 6×7 grid of day cells. Day states
  // (selected, in-range, today, weekend, outside-month) each get their own
  // editable color tokens. Dimensions are single-value (no size scale).
  calendar: {
    // ── COLOR TOKENS ──
    "calendar-background": { type: "COLOR", semantic: "surface-default", figmaPath: "calendar/background" },
    "calendar-border": { type: "COLOR", semantic: "border-default", figmaPath: "calendar/border" },
    "calendar-header-text": { type: "COLOR", semantic: "text-default", figmaPath: "calendar/header-text" },
    "calendar-nav-icon": { type: "COLOR", semantic: "text-subtle", figmaPath: "calendar/nav-icon" },
    "calendar-weekday-text": { type: "COLOR", semantic: "text-subtle", figmaPath: "calendar/weekday-text" },
    "calendar-day-text": { type: "COLOR", semantic: "text-default", figmaPath: "calendar/day-text" },
    "calendar-day-weekend-text": { type: "COLOR", semantic: "text-subtle", figmaPath: "calendar/day-weekend-text" },
    "calendar-day-outside-text": { type: "COLOR", semantic: "text-disabled", figmaPath: "calendar/day-outside-text" },
    "calendar-day-hover-background": { type: "COLOR", semantic: "interactive-secondary-hover", figmaPath: "calendar/day-hover-background" },
    "calendar-day-selected-background": { type: "COLOR", semantic: "interactive-primary", figmaPath: "calendar/day-selected-background" },
    "calendar-day-selected-text": { type: "COLOR", semantic: "text-on-interactive", figmaPath: "calendar/day-selected-text" },
    "calendar-day-in-range-background": { type: "COLOR", semantic: "interactive-secondary", figmaPath: "calendar/day-in-range-background" },
    "calendar-day-today-background": { type: "COLOR", semantic: "surface-secondary", figmaPath: "calendar/day-today-background" },
    // ── DATE-FIELD HEADER (optional summary row above the grid) ──
    "calendar-field-label-text": { type: "COLOR", semantic: "text-subtle", figmaPath: "calendar/field-label-text" },
    "calendar-field-value-text": { type: "COLOR", semantic: "text-default", figmaPath: "calendar/field-value-text" },
    "calendar-field-edit-icon": { type: "COLOR", semantic: "text-subtle", figmaPath: "calendar/field-edit-icon" },
    "calendar-field-divider": { type: "COLOR", semantic: "border-default", figmaPath: "calendar/field-divider" },
    // ── DIMENSION TOKENS ──
    "calendar-radius": { type: "FLOAT", unit: "px", value: 8, figmaPath: "calendar/radius" },
    "calendar-border-width": { type: "FLOAT", unit: "px", value: 1, figmaPath: "calendar/border-width" },
    "calendar-padding": { type: "FLOAT", unit: "px", value: 16, figmaPath: "calendar/padding" },
    "calendar-day-size": { type: "FLOAT", unit: "px", value: 36, figmaPath: "calendar/day-size" },
    "calendar-day-radius": { type: "FLOAT", unit: "px", value: 8, figmaPath: "calendar/day-radius" },
    "calendar-cell-gap": { type: "FLOAT", unit: "px", value: 2, figmaPath: "calendar/cell-gap" },
    "calendar-header-font-size": { type: "FLOAT", unit: "px", value: 14, figmaPath: "calendar/header-font-size" },
    "calendar-header-font-weight": { type: "STRING", value: "Semi Bold", figmaPath: "calendar/header-font-weight" },
    "calendar-weekday-font-size": { type: "FLOAT", unit: "px", value: 12, figmaPath: "calendar/weekday-font-size" },
    "calendar-weekday-font-weight": { type: "STRING", value: "Medium", figmaPath: "calendar/weekday-font-weight" },
    "calendar-day-font-size": { type: "FLOAT", unit: "px", value: 13, figmaPath: "calendar/day-font-size" },
    "calendar-day-font-weight": { type: "STRING", value: "Regular", figmaPath: "calendar/day-font-weight" },
    "calendar-field-padding": { type: "FLOAT", unit: "px", value: 16, figmaPath: "calendar/field-padding" },
    "calendar-field-label-font-size": { type: "FLOAT", unit: "px", value: 12, figmaPath: "calendar/field-label-font-size" },
    "calendar-field-label-font-weight": { type: "STRING", value: "Medium", figmaPath: "calendar/field-label-font-weight" },
    "calendar-field-value-font-size": { type: "FLOAT", unit: "px", value: 20, figmaPath: "calendar/field-value-font-size" },
    "calendar-field-value-font-weight": { type: "STRING", value: "Semi Bold", figmaPath: "calendar/field-value-font-weight" },
    "calendar-font-family": { type: "STRING", value: "Inter", figmaPath: "calendar/font-family" },
  },

  // ── DOCS THEME ──
  // Chrome colors for the generated documentation page (Figma + in-app docs).
  // These default to the brand's surface/border semantics so existing docs keep
  // their look, but can be overridden per brand and per theme (light/dark).
  docs: {
    "docs-page-background": { type: "COLOR", semantic: "surface-primary",   figmaPath: "docs/page-background" },
    "docs-card-background": { type: "COLOR", semantic: "surface-secondary", figmaPath: "docs/card-background" },
    "docs-card-border":     { type: "COLOR", semantic: "border-primary",    figmaPath: "docs/card-border" },
    "docs-title":           { type: "COLOR", semantic: "text-default",       figmaPath: "docs/title" },
    "docs-body-text":       { type: "COLOR", semantic: "text-subtle",        figmaPath: "docs/body-text" },
    "docs-section-heading": { type: "COLOR", semantic: "interactive-primary", figmaPath: "docs/section-heading" },
  },
};

// Curated, per-color avatar tokens. These are semantic-less (they default to a
// palette primitive directly) and are fully overridable like any color token.
// `paletteGate` lets the app/Figma export skip colors that aren't in the palette.
// `defaultMapping` seeds the fill; `autoContrastOf` derives readable text by default.
export const AVATAR_PALETTE_COLOR_NAMES = [
  "red",
  "green",
  "blue",
  "purple",
  "orange",
  "yellow",
  "pink",
  "cyan",
  "navy",
];
AVATAR_PALETTE_COLOR_NAMES.forEach((c) => {
  COMPONENT_TOKENS.avatar[`avatar-color-${c}`] = {
    type: TOKEN_TYPES.COLOR,
    defaultMapping: { color: c, index: 5, opacity: 100 },
    paletteGate: c,
    figmaPath: `avatar/color-${c}`,
  };
  COMPONENT_TOKENS.avatar[`avatar-on-color-${c}`] = {
    type: TOKEN_TYPES.COLOR,
    autoContrastOf: `avatar-color-${c}`,
    paletteGate: c,
    figmaPath: `avatar/on-color-${c}`,
  };
});

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
  "alert",
];

// Chart types shown under the "Charts" nav section. `chart` is the Bar chart,
// `chart-line` the Line chart, `chart-area` the Area chart. Any future
// not-yet-built chart types go in CHART_PLACEHOLDER_COMPONENTS.
const CHART_PLACEHOLDER_COMPONENTS = [];
export const CHART_COMPONENTS = ["chart", "chart-line", "chart-time-series", "chart-time-series-dual-axis", "chart-area", "chart-stacked-area", "chart-stacked-bar", "chart-combo", "chart-donut", "chart-radar", "chart-scatter", "chart-candlestick", "chart-sparkline", "chart-bar-horizontal", "chart-pie", "chart-funnel", "chart-radial", ...CHART_PLACEHOLDER_COMPONENTS];

export const COMPONENT_NAMES = [
  ...new Set([
    ...Object.keys(COMPONENT_TOKENS),
    ...PLACEHOLDER_COMPONENTS,
    ...CHART_PLACEHOLDER_COMPONENTS,
  ]),
];

// Human-friendly display names. Anything not listed falls back to a capitalized
// version of its key. Single source of truth for the app, docs export, and sync UI.
export const COMPONENT_DISPLAY_NAMES = {
  actionicon: "ActionIcon",
  textinput: "TextInput",
  rangeslider: "RangeSlider",
  multiselect: "MultiSelect",
  segmentedcontrol: "SegmentedControl",
  accordionitem: "Accordion Item",
  chart: "Bar Chart",
  "chart-line": "Line Chart",
  "chart-time-series": "Time Series Chart",
  "chart-time-series-dual-axis": "Time Series Dual Axis Chart",
  "chart-area": "Area Chart",
  "chart-stacked-area": "Stacked Area Chart",
  "chart-stacked-bar": "Stacked Bar Chart",
  "chart-combo": "Combo Chart",
  "chart-donut": "Donut Chart",
  "chart-radar": "Radar Chart",
  "chart-scatter": "Scatter Chart",
  "chart-candlestick": "Candlestick Chart",
  "chart-sparkline": "Sparkline",
  "chart-bar-horizontal": "Horizontal Bar Chart",
  "chart-pie": "Pie Chart",
  "chart-funnel": "Funnel Chart",
  "chart-radial": "Radial Bar Chart",
};

export function getComponentDisplayName(name) {
  if (COMPONENT_DISPLAY_NAMES[name]) return COMPONENT_DISPLAY_NAMES[name];
  return typeof name === "string" && name.length
    ? name.charAt(0).toUpperCase() + name.slice(1)
    : String(name);
}

export const COMPONENT_SIZE_KEYS = {
  button: ["xxs", "xs", "sm", "md", "lg", "xl"],
  actionicon: ["xs", "sm", "md", "lg", "xl"],
  tabs: ["xs", "sm", "md", "lg", "xl"],
  accordion: ["default", "xs", "sm", "md", "lg", "xl"],
  switch: ["default", "xs", "sm", "md", "lg", "xl"],
  burger: ["default", "xs", "sm", "md", "lg", "xl"],
  segmentedcontrol: ["default", "xs", "sm", "md", "lg", "xl"],
  checkbox: ["xs", "sm", "md", "lg", "xl"],
  radio: ["xs", "sm", "md", "lg", "xl"],
  chip: ["default", "xs", "sm", "md", "lg", "xl"],
  slider: ["default", "xs", "sm", "md", "lg", "xl"],
  rangeslider: ["default", "xs", "sm", "md", "lg", "xl"],
  card: ["default", "xs", "sm", "md", "lg", "xl"],
  notification: ["default", "xs", "sm", "md", "lg", "xl"],
  tooltip: [],
  loader: ["default", "xs", "sm", "md", "lg", "xl"],
  progress: ["default", "xs", "sm", "md", "lg", "xl"],
  chart: ["default"],
  "chart-line": ["default"],
  "chart-time-series": ["default"],
  "chart-time-series-dual-axis": ["default"],
  "chart-area": ["default"],
  "chart-stacked-area": ["default"],
  "chart-stacked-bar": ["default"],
  "chart-combo": ["default"],
  "chart-donut": ["default"],
  "chart-radar": ["default"],
  "chart-scatter": ["default"],
  "chart-candlestick": ["default"],
  "chart-sparkline": ["default"],
  "chart-bar-horizontal": ["default"],
  "chart-pie": ["default"],
  "chart-funnel": ["default"],
  "chart-radial": ["default"],
  pill: ["default", "xs", "sm", "md", "lg", "xl"],
  badge: ["default", "xs", "sm", "md", "lg", "xl"],
  alert: ["xs", "sm", "md", "lg", "xl"],
  table: [],
  calendar: [],
  modal: ["default", "xs", "sm", "md", "lg", "xl"],
  image: ["default", "xs", "sm", "md", "lg", "xl"],
  avatar: ["default", "xs", "sm", "md", "lg", "xl"],
  skeleton: ["default", "xs", "sm", "md", "lg", "xl"],
  anchor: ["xs", "sm", "md", "lg", "xl"],
  textinput: ["default", "xs", "sm", "md", "lg", "xl"],
  select: ["default", "xs", "sm", "md", "lg", "xl"],
  multiselect: ["default", "xs", "sm", "md", "lg", "xl"],
  menu: ["default", "xs", "sm", "md", "lg", "xl"],
  divider: ["default", "xs", "sm", "md", "lg", "xl"],
  list: ["default", "xs", "sm", "md", "lg", "xl"],
  popover: ["default", "xs", "sm", "md", "lg", "xl"],
  title: ["h1", "h2", "h3", "h4", "h5", "h6"],
  text: ["default", "label", "caption", "xs", "sm", "md", "lg", "xl"],
};

// Chart subtypes (chart-line, future chart-area) inherit the shared `chart`
// styling tokens, excluding bar-specific ones (chart-bar-*).
function isChartSubtype(componentName) {
  return (
    typeof componentName === "string" &&
    componentName.startsWith("chart-") &&
    Boolean(COMPONENT_TOKENS[componentName])
  );
}

// Max number of data series each chart subtype can render. Series colors beyond
// this limit are hidden from the subtype's editor panel. Line/Area support up to
// 4 series; the Bar chart (no entry) keeps the full 6-color palette.
const CHART_SERIES_LIMIT = { "chart-line": 4, "chart-time-series": 4, "chart-time-series-dual-axis": 2, "chart-area": 2, "chart-stacked-area": 4, "chart-stacked-bar": 4, "chart-combo": 2, "chart-donut": 6, "chart-radar": 4, "chart-scatter": 4, "chart-candlestick": 0, "chart-sparkline": 1, "chart-pie": 6, "chart-funnel": 6, "chart-radial": 6 };

// Subtypes that render bars (and therefore keep the chart-bar-* tokens). Line and
// area subtypes drop those bar-specific tokens.
const BAR_BASED_CHART_SUBTYPES = ["chart-stacked-bar", "chart-combo", "chart-bar-horizontal"];

// Subtypes with no cartesian axes/grid (e.g. donut). Their editor should not show
// the shared axis/grid styling tokens, since nothing renders them.
const AXIS_FREE_CHART_SUBTYPES = ["chart-donut", "chart-pie", "chart-funnel", "chart-radial"];

// Subtypes that paint translucent filled regions and therefore expose the
// chart-series-opacity-N palette (in addition to the solid chart-series-N used
// for their outlines). All other charts hide the opacity palette entirely.
const OPACITY_SERIES_CHART_SUBTYPES = ["chart-area", "chart-stacked-area", "chart-radar", "chart-sparkline"];

function sharedChartTokens(componentName) {
  const chart = COMPONENT_TOKENS.chart || {};
  const seriesLimit = CHART_SERIES_LIMIT[componentName];
  const isBarBased = BAR_BASED_CHART_SUBTYPES.includes(componentName);
  const isAxisFree = AXIS_FREE_CHART_SUBTYPES.includes(componentName);
  const allowsOpacitySeries = OPACITY_SERIES_CHART_SUBTYPES.includes(componentName);
  // The sparkline is chrome-free: it pulls only the single series color + its
  // translucent fill from the shared chart group (plus width/padding). All other
  // shared tokens (axis/grid/label/legend/shade/bar/height/font) are hidden, since
  // its compact sizing lives in the chart-sparkline group.
  const isSparkline = componentName === "chart-sparkline";
  const SPARKLINE_SHARED_KEEP = ["chart-series-1", "chart-series-opacity-1", "chart-width", "chart-padding"];
  return Object.fromEntries(
    Object.entries(chart).filter(([name, def]) => {
      if (isSparkline) return SPARKLINE_SHARED_KEEP.indexOf(name) !== -1;
      // Bar-specific tokens only apply to the bar + bar-based subtypes.
      if (name.startsWith("chart-bar") && !isBarBased) return false;
      // Axis/grid styling only applies to cartesian charts.
      if (isAxisFree && /^chart-(axis|grid)/.test(name)) return false;
      // The translucent fill palette is exposed only by area/radar.
      if (def && def.areaRadarOnly && !allowsOpacitySeries) return false;
      // Hide series/shade colors (and per-series styles) beyond the subtype's max.
      if (seriesLimit != null) {
        const m = /^chart-(?:series-opacity|series|shade-opacity|shade)-(\d+)(?:-style)?$/.exec(name);
        if (m && parseInt(m[1], 10) > seriesLimit) return false;
      }
      return true;
    })
  );
}

// Per-series line styling (dash/curve) only applies to line-based charts. Strip
// these `lineOnly` tokens from every other chart (e.g. the bar chart).
function filterLineOnly(tokens, componentName) {
  // Time series (and its dual-axis variant) are line variants, so they keep the
  // per-series style/curve tokens.
  if (
    componentName === "chart-line" ||
    componentName === "chart-time-series" ||
    componentName === "chart-time-series-dual-axis"
  )
    return tokens;
  return Object.fromEntries(
    Object.entries(tokens).filter(([, def]) => !def.lineOnly)
  );
}

function resolveComponentTokenSet(componentName) {
  if (componentName === "chart-time-series" || componentName === "chart-time-series-dual-axis") {
    // Time series (and the dual-axis variant) share the line chart's tokens (and
    // Figma variables) exactly: their own group is empty, so we merge in chart-line.
    const merged = { ...sharedChartTokens(componentName), ...(COMPONENT_TOKENS["chart-line"] || {}) };
    return filterLineOnly(merged, componentName);
  }
  if (componentName === "chart-stacked-area") {
    // Stacked area shares the area chart's tokens (and Figma variables): its own
    // group is empty, so we merge in chart-area (line-width, point-radius).
    const merged = { ...sharedChartTokens(componentName), ...(COMPONENT_TOKENS["chart-area"] || {}) };
    return filterLineOnly(merged, componentName);
  }
  if (isChartSubtype(componentName)) {
    const merged = { ...sharedChartTokens(componentName), ...(COMPONENT_TOKENS[componentName] || {}) };
    return filterLineOnly(merged, componentName);
  }
  if (componentName === "chart") {
    // The base chart (bar) never paints translucent fills, so hide the opacity palette.
    const baseChart = Object.fromEntries(
      Object.entries(COMPONENT_TOKENS[componentName] || {}).filter(([, def]) => !def.areaRadarOnly)
    );
    return filterLineOnly(baseChart, componentName);
  }
  return COMPONENT_TOKENS[componentName];
}

export function getColorTokens(componentName) {
  const tokens = resolveComponentTokenSet(componentName);
  if (!tokens) return {};
  return Object.fromEntries(
    Object.entries(tokens).filter(([, def]) => def.type === TOKEN_TYPES.COLOR)
  );
}

export function getDimensionTokens(componentName) {
  const tokens = resolveComponentTokenSet(componentName);
  if (!tokens) return {};
  return Object.fromEntries(
    Object.entries(tokens).filter(([, def]) => def.type === TOKEN_TYPES.FLOAT || def.type === TOKEN_TYPES.STRING)
  );
}
