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
};

export const COMPONENT_NAMES = Object.keys(COMPONENT_TOKENS);

export const COMPONENT_SIZE_KEYS = {
  button: ["xs", "sm", "md", "lg", "xl"],
  switch: ["xs", "sm", "md", "lg", "xl"],
  checkbox: ["xs", "sm", "md", "lg", "xl"],
  radio: ["xs", "sm", "md", "lg", "xl"],
  chip: ["xs", "sm", "md", "lg", "xl"],
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
