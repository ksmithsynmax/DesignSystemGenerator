# Hermes token-consumption fixes — handoff

You are working in the **hermes** repo on a branch stacked off another dev's token-test branch. Goal: make the token test pass and fix the broken `ConfirmationDialog` storybook, **without touching the design-token generator** (a separate repo — its output is the source of truth and is already correct). All changes are hermes-side.

**Context:** A design-token sync recently pruned stale ("ghost") Figma variables. This exposed two pre-existing bugs in how hermes *consumes* tokens. The generator only ever emits **variant-specific** modal tokens (`modal-default-*`, `modal-filled-*`) plus a few shared ones (`modal-radius`, `modal-width`, `modal-icon-*`, `modal-close-icon-*`). Unprefixed names like `modal-title`, `modal-body`, `modal-border-width`, `modal-header-padding-x` were never real tokens.

Do the fixes in this order.

---

## FIX 1 — `scripts/generate-tokens.ts`: stop dropping value-0 tokens

There are two identical guards (one in the Semantic loop ~line 408, one in the Components loop ~line 449) that skip any numeric token whose value is `0`. `0` is a legitimate token value (zero padding/gap), and these tokens resolve to a primitive reference (e.g. `spacing/0`), so they must not be dropped. **Delete both guard blocks:**

```ts
// DELETE this block in BOTH the Semantic and Components forEach loops:
const rawValue = variable.valuesByMode[modeId];
if (typeof rawValue === "number" && rawValue === 0) {
  continue; // Skip this token for this product
}
```

(If `rawValue` is used later in that scope, keep the `const rawValue = ...` line and delete only the `if (... === 0) { continue; }`. It is not used elsewhere, so deleting the whole block is fine.)

Then regenerate: run the repo's token-generation script (e.g. `npm run generate-tokens`). This restores zero-valued tokens like `tabs-*-list-gap`, `tabs-outlined-list-padding`, `list-spacing-*`.

---

## FIX 2 — `src/components/confirmation-dialog/confirmation-dialog.module.css`: replace the whole file with the version below

Rationale: base selectors default to the `default` variant tokens; the `[data-variant="filled"]` block overrides. Two `/* VERIFY */` lines are best-guess mappings where the `filled` variant has no matching side token — eyeball those against the Figma modal after building.

```css
.content {
  display: flex;
  flex-direction: column;
  max-width: 100%;
  border: var(--component-modal-default-border-width) solid transparent;
  border-radius: var(--component-modal-radius-default);
  overflow: hidden;

  /* Widths */
  &[data-size="xs"] { width: var(--component-modal-width-xs); }
  &[data-size="sm"] { width: var(--component-modal-width-sm); }
  &[data-size="md"] { width: var(--component-modal-width-md); }
  &[data-size="lg"] { width: var(--component-modal-width-lg); }
  &[data-size="xl"] { width: var(--component-modal-width-xl); }

  /* Filled: unified surface, emphasised bold title. */
  &[data-variant="filled"] {
    background-color: var(--component-modal-filled-background);
    border-color: var(--component-modal-filled-border);
    border-width: var(--component-modal-filled-border-width);

    & .header {
      /* VERIFY vs Figma: filled has no header left/right tokens; using filled-padding-x for inline */
      padding-inline: var(--component-modal-filled-padding-x);
      padding-block: var(--component-modal-filled-header-padding-top)
        var(--component-modal-filled-header-padding-bottom);
    }

    & .title {
      color: var(--component-modal-filled-title);
      font-family: var(--component-modal-filled-title-font-family);
      font-size: var(--component-modal-filled-title-font-size);
      font-weight: var(--component-modal-filled-title-font-weight);
      line-height: var(--component-modal-filled-title-line-height);
    }

    & .close {
      color: var(--component-modal-filled-close);
    }

    & .body {
      color: var(--component-modal-filled-body);
      font-family: var(--component-modal-filled-body-font-family);
      font-size: var(--component-modal-filled-body-font-size);
      font-weight: var(--component-modal-filled-body-font-weight);
      line-height: var(--component-modal-filled-body-line-height);
      /* filled body top padding is intentionally 0 */
      padding: 0 var(--component-modal-filled-body-padding-right)
        var(--component-modal-filled-body-padding-bottom)
        var(--component-modal-filled-body-padding-left);
    }

    & .footer {
      /* VERIFY vs Figma: filled has no footer top token; reusing bottom for top */
      padding: var(--component-modal-filled-footer-padding-bottom)
        var(--component-modal-filled-footer-padding-right)
        var(--component-modal-filled-footer-padding-bottom)
        var(--component-modal-filled-footer-padding-left);
    }
  }

  /* Default: distinct header surface over a darker body, footer divider. */
  &[data-variant="default"] {
    background-color: var(--component-modal-default-background);
    border-color: var(--component-modal-default-border);

    & .header {
      padding-block: var(--component-modal-default-header-padding-top)
        var(--component-modal-default-header-padding-bottom);
      background-color: var(--component-modal-default-header-background);
    }

    & .title {
      font-size: var(--component-modal-default-title-font-size);
      font-weight: var(--component-modal-default-title-font-weight);
    }

    & .body {
      padding: var(--component-modal-default-body-padding-top)
        var(--component-modal-default-body-padding-right)
        var(--component-modal-default-body-padding-bottom)
        var(--component-modal-default-body-padding-left);
    }

    /* Inset divider: spans the footer content width, not the card edges. */
    & .footer::before {
      content: "";
      position: absolute;
      inset-block-start: 0;
      inset-inline: var(--component-modal-default-footer-padding-left)
        var(--component-modal-default-footer-padding-right);
      height: var(--component-modal-default-border-width);
      background-color: var(--component-modal-default-footer-border);
    }
  }

  /* Layout: title alignment and footer button distribution. */
  &[data-layout="centered-arch"] .title,
  &[data-layout="centered-action"] .title { text-align: center; }
  &[data-layout="action-right"] .footer { justify-content: flex-end; }
  &[data-layout="centered-arch"] .footer { justify-content: space-between; }
  &[data-layout="centered-action"] .footer { justify-content: center; }
}

/* Base selectors default to the "default" variant tokens; filled overrides above. */
.header {
  display: flex;
  align-items: center;
  padding-inline: var(--component-modal-default-header-padding-left)
    var(--component-modal-default-header-padding-right);
}

.title {
  flex: 1 1 0;
  min-width: 0;
  color: var(--component-modal-default-title);
  font-family: var(--component-modal-default-title-font-family);
  line-height: var(--component-modal-default-title-line-height);
}

.close {
  flex-shrink: 0;
  color: var(--component-modal-default-close);

  & svg { stroke-width: var(--component-modal-close-icon-stroke-width); }
}

/* Balances the trailing close button so centered titles stay optically centered. */
.closeSpacer {
  flex-shrink: 0;
  inline-size: 16px;
}

.body {
  color: var(--component-modal-default-body);
  font-family: var(--component-modal-default-body-font-family);
  font-size: var(--component-modal-default-body-font-size);
  font-weight: var(--component-modal-default-body-font-weight);
  line-height: var(--component-modal-default-body-line-height);
}

.footer {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: var(--component-modal-default-footer-padding-top)
    var(--component-modal-default-footer-padding-right)
    var(--component-modal-default-footer-padding-bottom)
    var(--component-modal-default-footer-padding-left);
}
```

---

## FIX 3 — slider & range-slider: use the size-agnostic default border-width

The generator models thumb border-width per size (`-default/-sm/-md/-lg/-xl/-xs`); there is no unprefixed base token.

- In `src/components/slider/*.css`, replace both occurrences of `var(--component-slider-thumb-border-width)` with `var(--component-slider-thumb-border-width-default)`.
- In `src/components/range-slider/*.css`, replace both occurrences of `var(--component-rangeslider-thumb-border-width)` with `var(--component-rangeslider-thumb-border-width-default)`.

---

## FIX 4 — progress: no change needed

`src/components/progress/*.css` uses `var(--component-progress-font-family, var(--mantine-font-family))`, which already falls back gracefully. Leave it.

---

## VERIFY

1. Run the token-generation script, then run the token test suite (e.g. `tokens/generated/tokens.test.ts`) — it must pass with no literal-value failures.
2. Build/run Storybook and visually check the `ConfirmationDialog` in both `default` and `filled` variants; confirm the two `/* VERIFY */` padding lines look right vs the Figma modal.
3. Do **not** edit any file outside hermes.

**Note on `tabs-outlined-list-padding`:** the generator now defines this (value 0), but it only reaches hermes after the design owner re-syncs Figma and re-exports `variables.json`. Until that new `variables.json` lands, `tabs-outlined-list-padding` will still be absent even with Fix 1. That's expected; don't work around it in CSS.
