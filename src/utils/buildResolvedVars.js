import { TOKEN_TYPES } from "../data/componentTokens";
import { resolveColor, resolveDimension } from "./resolveToken";

export function buildResolvedVars(tokens, brands, activeBrand, activeSize) {
  const resolvedVars = [];
  for (const [name, def] of Object.entries(tokens)) {
    if (def.type === TOKEN_TYPES.COLOR) {
      const resolved = resolveColor(brands, activeBrand, def.semantic);
      resolvedVars.push({ name, type: "COLOR", value: resolved, figmaPath: def.figmaPath });
    } else if (def.type === TOKEN_TYPES.FLOAT || def.type === TOKEN_TYPES.STRING) {
      const hasSizes = !!def.sizes;
      const resolved = hasSizes
        ? resolveDimension(brands, activeBrand, name, activeSize)
        : resolveDimension(brands, activeBrand, name);
      const display = def.unit ? `${resolved}${def.unit}` : String(resolved);
      const displayName = hasSizes ? `${name}-${activeSize}` : name;
      const displayPath = hasSizes ? `${def.figmaPath}-${activeSize}` : def.figmaPath;
      resolvedVars.push({ name: displayName, type: def.type, value: display, figmaPath: displayPath });
    }
  }
  return resolvedVars;
}
