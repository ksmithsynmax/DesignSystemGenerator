import { SEMANTIC_GROUPS } from "../previews/FoundationsPreview";

const TEXT = "#C1C2C5";
const TEXT_MUTED = "#909296";
const TEXT_FAINT = "#5C5F66";
const PANEL = "#1A1B1E";
const BORDER = "#2C2E33";
const MONO = "monospace";

const SELECT_STYLE = {
  background: "#1A1B1E",
  border: "1px solid #373A40",
  borderRadius: 4,
  color: "#C1C2C5",
  fontSize: 12,
  fontFamily: MONO,
  padding: "4px 6px",
};

function SemanticRow({ role, mapping, hex, brandColors, globalColors, rampLength, onUpdate }) {
  const color = mapping?.color ?? "neutral";
  const index = Number.isFinite(Number(mapping?.index)) ? Number(mapping.index) : 0;
  const isTransparent = color === "transparent";
  const maxIndex = Math.max(1, Number(rampLength) || 10);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 0",
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          flexShrink: 0,
          background: isTransparent
            ? "repeating-conic-gradient(#444 0% 25%, #222 0% 50%) 50% / 10px 10px"
            : hex || "#000",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontFamily: MONO,
            color: TEXT,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {role}
        </div>
        <div style={{ fontSize: 10, fontFamily: MONO, color: TEXT_FAINT }}>
          {isTransparent ? "transparent" : `${color} / ${index}`}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <select
          value={color}
          onChange={(e) => onUpdate(role, { color: e.target.value })}
          style={SELECT_STYLE}
        >
          <option value="transparent">transparent</option>
          {brandColors.length > 0 && (
            <optgroup label="Brand">
              {brandColors.map((c) => (
                <option key={`b-${c}`} value={c}>
                  {c}
                </option>
              ))}
            </optgroup>
          )}
          {globalColors.length > 0 && (
            <optgroup label="Global">
              {globalColors.map((c) => (
                <option key={`g-${c}`} value={c}>
                  {c}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <span style={{ color: TEXT_FAINT, fontSize: 12 }}>/</span>
        <select
          value={index}
          onChange={(e) => onUpdate(role, { index: parseInt(e.target.value, 10) })}
          disabled={isTransparent}
          style={{ ...SELECT_STYLE, width: 48, opacity: isTransparent ? 0.4 : 1 }}
        >
          {Array.from({ length: maxIndex }, (_, i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/**
 * Editor for a brand's semantic color tokens (surface-*, text-*, border-*, etc.).
 * Theme-aware: writes to semanticMap (light) or darkSemanticOverrides (dark) via onUpdate.
 */
export default function SemanticColorEditor({
  theme = "light",
  mergedMap = {},
  brandColors = [],
  globalColors = [],
  resolveHex,
  rampLengthOf,
  onUpdate,
}) {
  return (
    <div>
      <div style={{ fontSize: 11, color: TEXT_MUTED, lineHeight: 1.45, marginBottom: 12 }}>
        Editing the <strong style={{ color: TEXT }}>{theme}</strong> theme. Switch the preview
        theme to edit the other one. These mappings are shared by every component in this brand.
      </div>
      {SEMANTIC_GROUPS.map(([groupName, roles]) => (
        <div key={groupName} style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 11,
              color: TEXT_FAINT,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            {groupName}
          </div>
          {roles.map((role) => {
            const mapping = mergedMap[role] || { color: "neutral", index: 0 };
            const rampLength =
              typeof rampLengthOf === "function" ? rampLengthOf(mapping.color) : 10;
            return (
              <SemanticRow
                key={role}
                role={role}
                mapping={mapping}
                hex={typeof resolveHex === "function" ? resolveHex(role) : null}
                brandColors={brandColors}
                globalColors={globalColors}
                rampLength={rampLength}
                onUpdate={onUpdate}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
