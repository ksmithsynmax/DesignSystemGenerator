# Flag component — Figma integration

How the generator's new **Flag** component maps into Figma. Short version: the
generator ships **only one sizing variable** (`flag/height`); the flag artwork
stays in your Figma **"Flags"** set, and production uses the runtime API. Only
the height is a shared, tokenized contract.

---

## 1. What the generator exports

A single component variable group, written to Figma on every sync:

| Variable        | default | xs | sm | md | lg | xl | Primitive alias |
|-----------------|:------:|:--:|:--:|:--:|:--:|:--:|-----------------|
| `flag/height`   |   14   | 10 | 12 | 14 | 16 | 18 | `spacing/{n}`   |

- **No `flag/width`** and **no `flag/radius`** — intentional (see §3).
- All values sit on the spacing primitive scale, so each aliases to
  `spacing/10 … spacing/18` (never a raw literal). This keeps the downstream
  `tokens.test.ts` green.
- The variables are created automatically — the plugin writes all component
  variables on sync regardless of which components are "built".

---

## 2. Wiring it in Figma (manual, no plugin change)

1. **Sync** from the generator (creates/updates `flag/height-*` variables).
2. Select your Flag component / the frame that holds the flag image.
3. Bind the frame's **Height** to the matching `flag/height` variable
   (`default`, or `xs…xl`). 
4. Leave **Width** proportional / "Hug" — **do not** bind a fixed width. Each
   flag then keeps its own natural aspect ratio at the bound height.

That's the whole contract: **set height, width follows, nothing stretches.**

---

## 3. Why height-only (no width, no radius)

- Real flags have different native ratios (US ≈ 19:10, Japan ≈ 3:2,
  Switzerland 1:1). A shared **width** token would stretch some of them, so we
  only tokenize **height** and let width follow each flag's intrinsic ratio.
- **Radius** was removed on request — flags render with square corners.

---

## 4. Where the artwork comes from (3 worlds, 1 shared token)

| Context           | Flag image source                          | Sizing              |
|-------------------|--------------------------------------------|---------------------|
| Generator preview | `flagcdn.com` SVG (illustration only)      | `flag/height` token |
| Figma             | your existing **"Flags"** component set     | `flag/height` var   |
| Production        | the devs' runtime **API**                   | `flag/height` value |

The plugin already knows how to pull flags from your Figma file: the DenseTable
flag cell swaps in instances from a component set named **`Flag`/`Flags`**
(`findTableBodyFlagSources` in `figma-plugin/code.js`), falling back to a
hand-drawn placeholder if none is found. A standalone Flag component should
place instances from that same set.

---

## 5. Tooltip

The flag's tooltip (country name) is styled from the brand's **`tooltip-*`**
tokens, so it matches the Tooltip component per brand:

`tooltip/background`, `tooltip/color`, `tooltip/radius`, `tooltip/padding-x`,
`tooltip/padding-y`, `tooltip/font-size`, `tooltip/font-family`,
`tooltip/font-weight`, `tooltip/line-height`, `tooltip/arrow-size`.

No new tooltip tokens were added — it reuses the existing ones.

---

## 6. To push to Figma / hermes

1. Figma **Sync** (writes `flag/height-*` variables).
2. Export **`variables.json`**.
3. Bind your Flag component's height as in §2.

---

## 7. Optional (not done)

I did **not** add a `code.js` routine to auto-build a standalone, documented
"Flag" component node in Figma on sync. The variables sync and your existing
Flags set + manual binding (§2) cover the integration. If you want the plugin to
generate the Flag component for you (reusing the `Flag`/`Flags` instance-swap),
say so and I'll add it.
