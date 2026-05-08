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
    "tabs-radius": { type: "FLOAT", unit: "px", sizes: { xs: 2, sm: 4, md: 8, lg: 16, xl: 32 }, figmaPath: "tabs/radius" },
    "tabs-default-radius-default": { type: "FLOAT", unit: "px", value: 4, figmaPath: "tabs/default-radius-default" },
    "tabs-outlined-radius-default": { type: "FLOAT", unit: "px", value: 4, figmaPath: "tabs/outlined-radius-default" },
    "tabs-pills-radius-default": { type: "FLOAT", unit: "px", value: 4, figmaPath: "tabs/pills-radius-default" },
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
    "slider-track-height": { type: "FLOAT", unit: "px", sizes: { xs: 2, sm: 4, md: 6, lg: 8, xl: 10 }, figmaPath: "slider/track-height" },
    "slider-thumb-size": { type: "FLOAT", unit: "px", sizes: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 }, figmaPath: "slider/thumb-size" },
    "slider-mark-label-font-size": { type: "FLOAT", unit: "px", sizes: { xs: 10, sm: 11, md: 12, lg: 13, xl: 14 }, figmaPath: "slider/mark-label-font-size" },
    "slider-mark-label-font-family": { type: "STRING", value: "Inter", figmaPath: "slider/mark-label-font-family" },
    "slider-mark-label-font-weight": { type: "STRING", value: "Regular", figmaPath: "slider/mark-label-font-weight" },
    "slider-mark-label-line-height": { type: "FLOAT", unit: "px", sizes: { xs: 14, sm: 14, md: 16, lg: 16, xl: 20 }, figmaPath: "slider/mark-label-line-height" },
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
    "rangeslider-mark-label-font-family": { type: "STRING", value: "Inter", figmaPath: "rangeslider/mark-label-font-family" },
    "rangeslider-mark-label-font-weight": { type: "STRING", value: "Regular", figmaPath: "rangeslider/mark-label-font-weight" },
    "rangeslider-mark-label-line-height": { type: "FLOAT", unit: "px", sizes: { xs: 14, sm: 14, md: 16, lg: 16, xl: 20 }, figmaPath: "rangeslider/mark-label-line-height" },
    "rangeslider-radius": { type: "FLOAT", unit: "px", sizes: { default: 8, xs: 2, sm: 4, md: 8, lg: 16, xl: 32 }, figmaPath: "rangeslider/radius" },

    // ── FLOAT TOKENS (single value) ──
    "rangeslider-thumb-border-width": { type: "FLOAT", unit: "px", value: 2, figmaPath: "rangeslider/thumb-border-width" },
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

    "alert-icon": { type: "COLOR", semantic: "interactive-primary", figmaPath: "alert/icon" },
    "alert-close": { type: "COLOR", semantic: "text-default", figmaPath: "alert/close" },

    // ── FLOAT TOKENS ──
    "alert-radius": { type: "FLOAT", unit: "px", sizes: { xs: 2, sm: 4, md: 8, lg: 16, xl: 32 }, figmaPath: "alert/radius" },
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
    // ── COLOR TOKENS ──
    "modal-background": { type: "COLOR", semantic: "surface-default", figmaPath: "modal/background" },
    "modal-header-background": { type: "COLOR", semantic: "surface-default", figmaPath: "modal/header-background" },
    "modal-footer-background": { type: "COLOR", semantic: "surface-default", figmaPath: "modal/footer-background" },
    "modal-border": { type: "COLOR", semantic: "border-default", figmaPath: "modal/border" },
    "modal-title": { type: "COLOR", semantic: "text-default", figmaPath: "modal/title" },
    "modal-body": { type: "COLOR", semantic: "text-default", figmaPath: "modal/body" },
    "modal-overlay": { type: "COLOR", semantic: "surface-inverse", figmaPath: "modal/overlay" },
    "modal-close": { type: "COLOR", semantic: "text-default", figmaPath: "modal/close" },

    // ── FLOAT TOKENS (size variants: xs, sm, md, lg, xl) ──
    "modal-width": { type: "FLOAT", unit: "px", sizes: { default: 420, xs: 280, sm: 340, md: 420, lg: 520, xl: 640 }, figmaPath: "modal/width" },
    "modal-radius": { type: "FLOAT", unit: "px", sizes: { default: 8, xs: 2, sm: 4, md: 8, lg: 16, xl: 32 }, figmaPath: "modal/radius" },

    // ── FLOAT TOKENS (single value) ──
    "modal-padding-x": { type: "FLOAT", unit: "px", value: 16, figmaPath: "modal/padding-x" },
    "modal-padding-y": { type: "FLOAT", unit: "px", value: 14, figmaPath: "modal/padding-y" },
    "modal-header-padding-x": { type: "FLOAT", unit: "px", value: 16, figmaPath: "modal/header-padding-x" },
    "modal-header-padding-y": { type: "FLOAT", unit: "px", value: 12, figmaPath: "modal/header-padding-y" },
    "modal-body-padding-top": { type: "FLOAT", unit: "px", value: 0, figmaPath: "modal/body-padding-top" },
    "modal-body-padding-right": { type: "FLOAT", unit: "px", value: 16, figmaPath: "modal/body-padding-right" },
    "modal-body-padding-bottom": { type: "FLOAT", unit: "px", value: 12, figmaPath: "modal/body-padding-bottom" },
    "modal-body-padding-left": { type: "FLOAT", unit: "px", value: 16, figmaPath: "modal/body-padding-left" },
    "modal-footer-padding-x": { type: "FLOAT", unit: "px", value: 16, figmaPath: "modal/footer-padding-x" },
    "modal-footer-padding-y": { type: "FLOAT", unit: "px", value: 12, figmaPath: "modal/footer-padding-y" },
    "modal-title-font-size": { type: "FLOAT", unit: "px", value: 18, figmaPath: "modal/title-font-size" },
    "modal-title-font-family": { type: "STRING", value: "Inter", figmaPath: "modal/title-font-family" },
    "modal-title-font-weight": { type: "STRING", value: "Bold", figmaPath: "modal/title-font-weight" },
    "modal-title-line-height": { type: "FLOAT", unit: "px", value: 24, figmaPath: "modal/title-line-height" },
    "modal-body-font-size": { type: "FLOAT", unit: "px", value: 14, figmaPath: "modal/body-font-size" },
    "modal-body-font-family": { type: "STRING", value: "Inter", figmaPath: "modal/body-font-family" },
    "modal-body-font-weight": { type: "STRING", value: "Regular", figmaPath: "modal/body-font-weight" },
    "modal-body-line-height": { type: "FLOAT", unit: "px", value: 20, figmaPath: "modal/body-line-height" },
    "modal-border-width": { type: "FLOAT", unit: "px", value: 1, figmaPath: "modal/border-width" },
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
    "textinput-label-color":    { type: "COLOR", semantic: "text-default",     figmaPath: "textinput/label-color" },
    "textinput-label-color-disabled": { type: "COLOR", semantic: "text-disabled", figmaPath: "textinput/label-color-disabled" },
    "textinput-asterisk-color": { type: "COLOR", semantic: "feedback-error",   figmaPath: "textinput/asterisk-color" },
    "textinput-error-color":    { type: "COLOR", semantic: "feedback-error",   figmaPath: "textinput/error-color" },
    "textinput-focus-ring":     { type: "COLOR", semantic: "border-focus",     figmaPath: "textinput/focus-ring" },

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
    "select-text-disabled":  { type: "COLOR", semantic: "text-disabled",    figmaPath: "select/text-disabled" },
    "select-placeholder":    { type: "COLOR", semantic: "text-placeholder", figmaPath: "select/placeholder" },
    "select-label-color":    { type: "COLOR", semantic: "text-default",     figmaPath: "select/label-color" },
    "select-asterisk-color": { type: "COLOR", semantic: "feedback-error",   figmaPath: "select/asterisk-color" },
    "select-error-color":    { type: "COLOR", semantic: "feedback-error",   figmaPath: "select/error-color" },
    "select-chevron-color":  { type: "COLOR", semantic: "text-default",     figmaPath: "select/chevron-color" },
    /** Right-slot / chevron icon tint (Mantine `section`); preferred over `select-chevron-color` for new files. */
    "select-icon":           { type: "COLOR", semantic: "text-default",     figmaPath: "select/icon" },
    "select-icon-disabled":  { type: "COLOR", semantic: "text-disabled",    figmaPath: "select/icon-disabled" },
    "select-icon-error":     { type: "COLOR", semantic: "feedback-error",   figmaPath: "select/icon-error" },
    "select-focus-ring":     { type: "COLOR", semantic: "border-focus",     figmaPath: "select/focus-ring" },
    /** Listbox panel (open dropdown behind the trigger). */
    "select-dropdown-background": { type: "COLOR", semantic: "surface-default", figmaPath: "select/dropdown-background" },
    "select-dropdown-border":     { type: "COLOR", semantic: "border-default",  figmaPath: "select/dropdown-border" },
    /** Highlight for the checked row (check icon / current value row). */
    "select-option-selected-background": {
      type: "COLOR",
      semantic: "subtle-primary",
      figmaPath: "select/option-selected-background",
    },
    /**
     * Hovered row (pointer) and keyboard-highlighted row (`data-combobox-selected`).
     * Default semantic is subdued so it stays off pure white vs the menu; remap in semantics as needed.
     */
    "select-option-hover-background": {
      type: "COLOR",
      semantic: "subtle-secondary",
      figmaPath: "select/option-hover-background",
    },
    /** Label text when an option is hovered / keyboard-highlighted (readability vs hover BG). */
    "select-option-hover-text": {
      type: "COLOR",
      semantic: "text-default",
      figmaPath: "select/option-hover-text",
    },

    // ── FLOAT TOKENS (size variants: xs, sm, md, lg, xl) ──
    "select-height":       { type: "FLOAT", unit: "px", sizes: { xs: 30, sm: 36, md: 42, lg: 50, xl: 60 }, figmaPath: "select/height" },
    "select-font-size":    { type: "FLOAT", unit: "px", sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 }, figmaPath: "select/font-size" },
    "select-font-family": {
      type: "STRING",
      sizes: { xs: "Inter", sm: "Inter", md: "Inter", lg: "Inter", xl: "Inter" },
      figmaPath: "select/font-family",
    },
    "select-font-weight": {
      type: "STRING",
      sizes: { xs: "Regular", sm: "Regular", md: "Regular", lg: "Regular", xl: "Regular" },
      figmaPath: "select/font-weight",
    },
    "select-line-height": { type: "FLOAT", unit: "px", sizes: { xs: 16, sm: 20, md: 24, lg: 28, xl: 32 }, figmaPath: "select/line-height" },
    "select-padding-x":    { type: "FLOAT", unit: "px", sizes: { xs: 8,  sm: 10, md: 12, lg: 16, xl: 20 }, figmaPath: "select/padding-x" },
    "select-section-size": { type: "FLOAT", unit: "px", sizes: { xs: 28, sm: 32, md: 36, lg: 40, xl: 44 }, figmaPath: "select/section-size" },

    // ── FLOAT TOKENS (radius variants: xs, sm, md, lg, xl — independent from size) ──
    "select-radius": { type: "FLOAT", unit: "px", sizes: { xs: 2, sm: 4, md: 8, lg: 16, xl: 32 }, figmaPath: "select/radius" },

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
  button: ["xxs", "xs", "sm", "md", "lg", "xl"],
  actionicon: ["xs", "sm", "md", "lg", "xl"],
  tabs: ["xs", "sm", "md", "lg", "xl"],
  accordion: ["default", "xs", "sm", "md", "lg", "xl"],
  switch: ["default", "xs", "sm", "md", "lg", "xl"],
  checkbox: ["xs", "sm", "md", "lg", "xl"],
  radio: ["xs", "sm", "md", "lg", "xl"],
  chip: ["default", "xs", "sm", "md", "lg", "xl"],
  slider: ["xs", "sm", "md", "lg", "xl"],
  rangeslider: ["xs", "sm", "md", "lg", "xl"],
  card: ["default", "xs", "sm", "md", "lg", "xl"],
  notification: ["default", "xs", "sm", "md", "lg", "xl"],
  tooltip: [],
  loader: ["default", "xs", "sm", "md", "lg", "xl"],
  pill: ["default", "xs", "sm", "md", "lg", "xl"],
  badge: ["default", "xs", "sm", "md", "lg", "xl"],
  alert: ["xs", "sm", "md", "lg", "xl"],
  modal: ["default", "xs", "sm", "md", "lg", "xl"],
  image: ["default", "xs", "sm", "md", "lg", "xl"],
  anchor: ["xs", "sm", "md", "lg", "xl"],
  textinput: ["default", "xs", "sm", "md", "lg", "xl"],
  select: ["xs", "sm", "md", "lg", "xl"],
  title: ["h1", "h2", "h3", "h4", "h5", "h6"],
  text: ["default", "label", "caption", "xs", "sm", "md", "lg", "xl"],
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
