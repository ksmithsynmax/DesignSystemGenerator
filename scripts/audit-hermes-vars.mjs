// READ-ONLY audit: which --component-* CSS vars used in hermes are missing from
// the generated tokens.ts. Helps size the blast radius of the ghost prune.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const HERMES = "/Users/kevinsmith/Desktop/hermes";
const tokensPath = path.join(HERMES, "tokens/generated/tokens.ts");
const tokens = fs.readFileSync(tokensPath, "utf8");

// Collect every var(--component-XXX) reference across CSS files.
const cssList = execSync(`find "${HERMES}/src" -name '*.css'`, { encoding: "utf8" })
  .split("\n").filter(Boolean);

const used = new Set();
const re = /var\(\s*--component-([a-z0-9-]+)/g;
for (const f of cssList) {
  const txt = fs.readFileSync(f, "utf8");
  let m;
  while ((m = re.exec(txt))) used.add(m[1]);
}

const present = (name) => tokens.includes(`"components-${name}"`);
const missing = [...used].filter((n) => !present(n)).sort();

console.log(`CSS files scanned: ${cssList.length}`);
console.log(`Unique --component-* vars used: ${used.size}`);
console.log(`MISSING from tokens.ts: ${missing.length}\n`);

const byComp = {};
for (const n of missing) {
  const comp = n.split("-")[0];
  (byComp[comp] ||= []).push(n);
}
for (const comp of Object.keys(byComp).sort((a, b) => byComp[b].length - byComp[a].length)) {
  console.log(`${comp} (${byComp[comp].length}): ${byComp[comp].join(", ")}`);
}
