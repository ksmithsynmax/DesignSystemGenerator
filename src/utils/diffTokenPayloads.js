// Compares two resolved token payloads (from buildExportPayload) and produces a
// human-readable changelog of what moved — the artifact you hand to a dev so they
// know exactly which token values changed since the last export.

function fmt(v) {
  if (v === null || v === undefined) return "none";
  return String(v);
}

// The payload's brand entries are the objects that carry a `.components` map.
function brandIdsOf(payload) {
  return Object.keys(payload || {}).filter(
    (k) => payload[k] && typeof payload[k] === "object" && payload[k].components
  );
}

// Flattens one brand's resolved tokens into a flat { label: scalarValue } map so
// two brands can be diffed key-by-key. Colors expand to (light)/(dark) since they
// can differ per theme; scale maps mirror across themes so we list them once.
// Adds a light/dark pair to the flat map, collapsing to one row when they match
// so identical themes don't double the changelog noise.
function addThemed(flat, key, lightVal, darkVal) {
  const hasLight = lightVal !== undefined;
  const hasDark = darkVal !== undefined;
  if (hasLight && hasDark) {
    if (fmt(lightVal) === fmt(darkVal)) flat[key] = lightVal;
    else {
      flat[`${key} (light)`] = lightVal;
      flat[`${key} (dark)`] = darkVal;
    }
  } else if (hasLight) {
    flat[key] = lightVal;
  } else if (hasDark) {
    flat[`${key} (dark)`] = darkVal;
  }
}

function flattenBrand(brand) {
  const flat = {};
  if (!brand || typeof brand !== "object") return flat;

  const prims = brand.primitives || {};
  Object.keys(prims).forEach((color) => {
    const arr = prims[color];
    if (Array.isArray(arr)) arr.forEach((hex, i) => { flat[`primitives/${color}/${i}`] = hex; });
  });

  // Semantic colors can differ light vs dark — split only when they actually do.
  const sLight = (brand.semantic && brand.semantic.light) || {};
  const sDark = (brand.semantic && brand.semantic.dark) || {};
  new Set([...Object.keys(sLight), ...Object.keys(sDark)]).forEach((key) => {
    addThemed(flat, `semantic/${key}`, sLight[key] && sLight[key].value, sDark[key] && sDark[key].value);
  });

  // Scale maps (radius/spacing/typography) mirror across themes — list once.
  [
    ["semanticRadius", "radius"],
    ["semanticSpacing", "spacing"],
    ["semanticTypography", "typography"],
  ].forEach(([section, label]) => {
    const m = brand[section] && brand[section].light;
    if (!m) return;
    Object.keys(m).forEach((key) => { flat[`${label}/${key}`] = m[key] && m[key].value; });
  });

  const comps = brand.components || {};
  Object.keys(comps).forEach((key) => {
    const e = comps[key];
    if (e && (e.light || e.dark)) {
      addThemed(flat, key, e.light && e.light.value, e.dark && e.dark.value);
    } else {
      flat[key] = e && e.value;
    }
  });

  return flat;
}

function diffFlat(oldFlat, newFlat) {
  const added = [];
  const removed = [];
  const changed = [];
  const keys = new Set([...Object.keys(oldFlat), ...Object.keys(newFlat)]);
  [...keys].sort().forEach((key) => {
    const inOld = Object.prototype.hasOwnProperty.call(oldFlat, key);
    const inNew = Object.prototype.hasOwnProperty.call(newFlat, key);
    if (inOld && !inNew) { removed.push({ key, from: oldFlat[key] }); return; }
    if (!inOld && inNew) { added.push({ key, to: newFlat[key] }); return; }
    if (fmt(oldFlat[key]) !== fmt(newFlat[key])) {
      changed.push({ key, from: oldFlat[key], to: newFlat[key] });
    }
  });
  return { added, removed, changed };
}

/**
 * Diffs two full payloads. Returns:
 *   { brands: { [brandId]: { added, removed, changed } }, totals: { added, removed, changed } }
 */
export function diffTokenPayloads(oldPayload, newPayload) {
  const ids = new Set([...brandIdsOf(oldPayload), ...brandIdsOf(newPayload)]);
  const brands = {};
  const totals = { added: 0, removed: 0, changed: 0 };
  [...ids].sort().forEach((id) => {
    const d = diffFlat(
      flattenBrand(oldPayload && oldPayload[id]),
      flattenBrand(newPayload && newPayload[id])
    );
    if (d.added.length || d.removed.length || d.changed.length) {
      brands[id] = d;
      totals.added += d.added.length;
      totals.removed += d.removed.length;
      totals.changed += d.changed.length;
    }
  });
  return { brands, totals };
}

export function isEmptyDiff(diff) {
  return !diff || (diff.totals.added === 0 && diff.totals.removed === 0 && diff.totals.changed === 0);
}

function formatDate(d) {
  return d
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    .toUpperCase();
}

/**
 * Renders a diff into a plain-text changelog suitable for pasting/sending.
 * `brandNames` is an optional { brandId: "Display Name" } map.
 */
export function formatTokenChangelog(diff, options) {
  const opts = options || {};
  const date = opts.date instanceof Date ? opts.date : new Date();
  const brandNames = opts.brandNames || {};

  const lines = [];
  lines.push(`Token changes — ${formatDate(date)}`);
  lines.push("=".repeat(40));

  if (isEmptyDiff(diff)) {
    lines.push("");
    lines.push("No token changes since the last saved baseline.");
    return lines.join("\n") + "\n";
  }

  const t = diff.totals;
  lines.push(`${t.changed} changed · ${t.added} added · ${t.removed} removed`);

  Object.keys(diff.brands).sort().forEach((id) => {
    const d = diff.brands[id];
    lines.push("");
    lines.push(brandNames[id] || id);

    if (d.changed.length) {
      lines.push(`  Changed (${d.changed.length})`);
      d.changed.forEach((c) => lines.push(`    ~ ${c.key}    ${fmt(c.from)} → ${fmt(c.to)}`));
    }
    if (d.added.length) {
      lines.push(`  Added (${d.added.length})`);
      d.added.forEach((c) => lines.push(`    + ${c.key}    ${fmt(c.to)}`));
    }
    if (d.removed.length) {
      lines.push(`  Removed (${d.removed.length})`);
      d.removed.forEach((c) => lines.push(`    - ${c.key}    (was ${fmt(c.from)})`));
    }
  });

  return lines.join("\n") + "\n";
}
