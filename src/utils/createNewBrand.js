import {
  INITIAL_BRANDS,
  BRAND_STARTER_SEMANTIC_MAP,
  BRAND_STARTER_DARK_SEMANTIC_OVERRIDES,
} from "../data/brands";

/** Canonical template for structure (defaults, scalar maps) — not for primitive/semantic colors. */
export const NEW_BRAND_TEMPLATE_ID = "theia";

export function slugifyBrandId(displayName) {
  const raw = String(displayName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return raw || "brand";
}

export function uniqueBrandIdFromName(displayName, existingIds) {
  const base = slugifyBrandId(displayName);
  const set = new Set(existingIds);
  if (!set.has(base)) return base;
  let n = 2;
  while (set.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/**
 * New brand: same shape as INITIAL_BRANDS entries, but `primitives` starts empty.
 * Semantics resolve via GLOBAL_PRIMITIVES only until the user adds brand palettes (e.g. blue) and remaps tokens.
 */
export function createNewBrand(displayName, existingIds, templateId = NEW_BRAND_TEMPLATE_ID) {
  const template = INITIAL_BRANDS[templateId];
  if (!template) {
    throw new Error(`Unknown brand template: ${templateId}`);
  }
  const id = uniqueBrandIdFromName(displayName, existingIds);
  const brand = JSON.parse(JSON.stringify(template));
  brand.name = String(displayName).trim() || id;
  brand.primitives = {};
  brand.semanticMap = JSON.parse(JSON.stringify(BRAND_STARTER_SEMANTIC_MAP));
  brand.darkSemanticOverrides = JSON.parse(JSON.stringify(BRAND_STARTER_DARK_SEMANTIC_OVERRIDES));
  brand.gradients = {};
  return { id, brand };
}
