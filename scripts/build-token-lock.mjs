// Regenerates tokens.lock.json from the seed brands (INITIAL_BRANDS).
//
// This is the CI / no-browser fallback baseline. The authoritative baseline is
// normally written from the app ("Save token lock" / on Figma sync), which uses
// your live, edited brands. Use this script to (re)seed a baseline or to
// regenerate in CI where there is no browser/localStorage.
//
// Usage: npm run tokens:lock
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { INITIAL_BRANDS } from "../src/data/brands.js";
import { buildTokenLock } from "../src/utils/buildTokenLock.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");

const lock = buildTokenLock(INITIAL_BRANDS);
const lockPath = join(PROJECT_ROOT, "tokens.lock.json");
writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n", "utf-8");
console.log(`Wrote tokens.lock.json (version ${lock.version}, ${Object.keys(lock.brands).length} brands).`);
