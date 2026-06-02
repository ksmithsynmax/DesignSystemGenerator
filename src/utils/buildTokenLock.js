import { buildExportPayload } from "./buildExportPayload";

// Bump when the lock file shape changes.
export const TOKEN_LOCK_VERSION = 1;

/**
 * Builds the "token lock" — the saved baseline of the last exported tokens.
 *
 * It captures BOTH:
 *   - `brands`: the brand config that was exported (the inputs), and
 *   - `payload`: the fully-resolved token output for those inputs.
 *
 * The baseline is the anchor the changelog diffs against: when you re-export, the
 * app compares the current resolved tokens to `payload` and reports what changed,
 * so you can hand the dev a clean "what moved since last time" summary.
 *
 * Note: this always builds the canonical FULL payload (no build options / no
 * debug filters) so the baseline is stable regardless of sync UI toggles.
 */
export function buildTokenLock(brands) {
  return {
    version: TOKEN_LOCK_VERSION,
    brands,
    payload: buildExportPayload(brands),
  };
}
