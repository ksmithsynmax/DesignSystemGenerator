// Probe specific component tokens in the CURRENT generator output to see whether
// they resolve to an alias (pass) or a raw literal (fail).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildExportPayload } from "../src/utils/buildExportPayload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "brands.local.json"), "utf8"));
const payload = buildExportPayload(root.brands, {});

const prefix = process.argv[2] || "modal/";
const brandId = process.argv[3] || "theia";
const bo = payload[brandId];
console.log(`\n=== ${brandId} — tokens starting with "${prefix}" ===`);
const keys = Object.keys(bo.components).filter((k) => k.startsWith(prefix)).sort();
console.log(`(${keys.length} tokens)`);
for (const name of keys) {
  const t = bo.components[name];
  const detail = t.type === "COLOR"
    ? `value=${t.value} primAlias=${t.primitiveAlias ?? "-"} alias=${t.alias ?? "-"}`
    : `value=${t.value} alias=${t.alias ?? "-"} aliasOf=${t.aliasOf ?? "-"}`;
  console.log(`  ${name} (${t.type}): ${detail}`);
}
