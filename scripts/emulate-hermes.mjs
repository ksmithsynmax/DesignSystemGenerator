// Emulates the figma-plugin resolution + hermes AST test on a FRESH export,
// so we can predict which tokens will pass/fail before actually re-syncing.
// Run: npx --yes vite-node scripts/emulate-hermes.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildExportPayload } from "../src/utils/buildExportPayload.js";
import {
  GLOBAL_PRIMITIVES,
  GLOBAL_SPACING,
  GLOBAL_SIZES,
  GLOBAL_ENUMS,
  GLOBAL_FONTS,
  GLOBAL_WEIGHTS,
  GLOBAL_BORDER_WIDTHS,
  GLOBAL_FONT_SIZES,
  GLOBAL_LINE_HEIGHTS,
} from "../src/data/brands.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "brands.local.json"), "utf8"));
const brands = root.brands;
const payload = buildExportPayload(brands, {});

const norm = (v) => String(v).replace(".", "_");

// Build the set of valid primitive keys visible to a brand (brand + global).
function primKeySet(brandOut) {
  const s = new Set();
  const addPalettes = (prims) => {
    for (const [pal, arr] of Object.entries(prims || {})) {
      if (pal === "transparent") { s.add("transparent"); continue; }
      if (Array.isArray(arr)) arr.forEach((_, i) => s.add(`${pal}/${i}`));
    }
  };
  addPalettes(brandOut.primitives);
  addPalettes(GLOBAL_PRIMITIVES);
  GLOBAL_SPACING.forEach((n) => s.add(`spacing/${n}`));
  GLOBAL_SIZES.forEach((n) => s.add(`size/${n}`));
  payload.globalRadii.forEach((r) => s.add(`radius/${r.name}`));
  GLOBAL_BORDER_WIDTHS.forEach((n) => s.add(`border-width/${norm(n)}`));
  GLOBAL_FONT_SIZES.forEach((n) => s.add(`font-size-${norm(n)}`));
  GLOBAL_LINE_HEIGHTS.forEach((n) => s.add(`typography/line-height/${norm(n)}`));
  Object.keys(GLOBAL_FONTS).forEach((k) => s.add(`typography/font-family/${k}`));
  Object.keys(GLOBAL_WEIGHTS).forEach((k) => s.add(`typography/font-weight/${k}`));
  Object.entries(GLOBAL_ENUMS).forEach(([g, vals]) => vals.forEach((v) => s.add(`enum/${g}/${v}`)));
  return s;
}

let totalFail = 0;
const failsByBrand = {};

for (const [brandId, bo] of Object.entries(payload)) {
  if (!bo || typeof bo !== "object" || !bo.components) continue; // skip global* keys
  const keys = primKeySet(bo);
  const comps = bo.components;

  // A component token references a primitive (pass), a semantic (pass), another
  // component via aliasOf (pass iff target passes), or emits a raw literal (fail).
  const directPass = (name, t) => {
    if (!t || typeof t !== "object") return true;
    if (t.type === "COLOR") {
      if (t.alias) return true;                    // semantic ref -> semanticTokens[...]
      if (t.primitiveAlias && keys.has(t.primitiveAlias)) return true;
      if (t.aliasOf) return "defer";
      return false;                                 // raw color literal
    }
    // FLOAT / STRING
    if (t.alias && keys.has(t.alias)) return true;
    if (t.aliasOf) return "defer";
    return false;
  };

  const status = {};
  for (const [name, t] of Object.entries(comps)) status[name] = directPass(name, t);
  // Resolve aliasOf chains transitively.
  const resolve = (name, seen = new Set()) => {
    const st = status[name];
    if (st !== "defer") return st;
    if (seen.has(name)) return false;
    seen.add(name);
    const target = comps[name].aliasOf;
    return status[target] === undefined ? false : resolve(target, seen);
  };

  const brandFails = [];
  for (const name of Object.keys(comps)) {
    const ok = resolve(name);
    if (ok !== true) brandFails.push({ name, ...comps[name] });
  }

  // Semantic COLOR/radius/spacing/typography tokens (semantic-* file): must alias a primitive.
  const checkSemantic = (grp, kind) => {
    for (const theme of ["light", "dark"]) {
      const m = bo[grp]?.[theme] || {};
      for (const [k, v] of Object.entries(m)) {
        if (!v) continue;
        const ok = v.alias && (keys.has(v.alias) || v.alias === "transparent");
        if (!ok) brandFails.push({ name: `${kind}:${theme}:${k}`, ...v });
      }
    }
  };
  checkSemantic("semantic", "sem-color");
  checkSemantic("semanticRadius", "sem-radius");
  checkSemantic("semanticSpacing", "sem-spacing");
  checkSemantic("semanticTypography", "sem-typo");

  failsByBrand[brandId] = brandFails;
  totalFail += brandFails.length;
}

console.log("=== Predicted hermes failures (post fresh re-sync) ===");
for (const [b, fails] of Object.entries(failsByBrand)) {
  console.log(`\n[${b}] ${fails.length} fail(s)`);
  fails.slice(0, 200).forEach((f) => {
    const detail = f.type === "COLOR" ? (f.value || "") : `${f.value}`;
    console.log(`   ${f.name}  (${f.type}) value=${JSON.stringify(detail)} alias=${f.alias ?? "-"} primAlias=${f.primitiveAlias ?? "-"} aliasOf=${f.aliasOf ?? "-"}`);
  });
}
console.log(`\nTOTAL predicted failures: ${totalFail}`);
