// Parse a comma-separated list of step labels (e.g. "0, 25, 50, 75, 100")
// into an array of trimmed, non-empty strings. Kept in its own module so the
// preview component file only exports a React component (keeps Vite Fast
// Refresh working).
export function parseSteps(steps) {
  if (Array.isArray(steps)) return steps.map((s) => String(s).trim()).filter(Boolean);
  return String(steps || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
