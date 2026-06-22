import { mergeLightSemanticsForBrand } from "../../utils/resolveToken";
import { GLOBAL_PRIMITIVES } from "../../data/brands";

// Generator-UI palette (matches the rest of the app chrome, not the dashboard skill).
const TEXT = "#C1C2C5";
const TEXT_MUTED = "#909296";
const TEXT_FAINT = "#5C5F66";
const PANEL = "#1A1B1E";
const BORDER = "#2C2E33";
const MONO = "monospace";

function SwatchBox({ hex, size = 40, radius = 6 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: hex,
        border: "1px solid rgba(255,255,255,0.08)",
        flexShrink: 0,
      }}
    />
  );
}

function ColorFamilyRow({ name, ramp }) {
  if (!Array.isArray(ramp) || ramp.length === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "14px 0",
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, textTransform: "capitalize" }}>
        {name}
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
        {ramp.map((hex, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <SwatchBox hex={hex} size={28} radius={4} />
            <span style={{ fontSize: 9, fontFamily: MONO, color: TEXT_FAINT }}>{i}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const SEMANTIC_GROUPS = [
  ["Interactive", ["interactive-primary", "interactive-primary-hover", "interactive-primary-pressed", "interactive-secondary", "interactive-secondary-hover", "interactive-disabled"]],
  ["Text", ["text-default", "text-subtle", "text-on-interactive", "text-placeholder", "text-disabled", "text-inverse"]],
  ["Surface", ["surface-primary", "surface-secondary", "subtle-primary", "subtle-secondary", "surface-default", "surface-inverse"]],
  ["Border", ["border-primary", "border-default", "border-subtle", "border-focus", "border-disabled"]],
  ["Feedback", ["feedback-error", "feedback-success", "feedback-warning"]],
];

function SemanticGroup({ name, roles, resolveRole }) {
  const present = roles
    .map((role) => [role, resolveRole(role)])
    .filter(([, hex]) => hex);
  if (present.length === 0) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: TEXT, marginBottom: 8 }}>{name}</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: `repeat(${Math.ceil(present.length / 2)}, auto)`,
          gridAutoFlow: "column",
          columnGap: 24,
          rowGap: 10,
        }}
      >
        {present.map(([role, hex]) => (
          <div key={role} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                flexShrink: 0,
                borderRadius: 6,
                background: hex,
                border: `1px solid ${BORDER}`,
              }}
            />
            <span style={{ fontSize: 11, fontFamily: MONO, color: TEXT_MUTED }}>{role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScaleSection({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          fontSize: 11,
          color: TEXT_FAINT,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontWeight: 600,
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function ValueChip({ children }) {
  return (
    <span style={{ fontSize: 11, fontFamily: MONO, color: TEXT_MUTED }}>{children}</span>
  );
}

export default function FoundationsPreview({ brand }) {
  if (!brand) return null;
  const primitives = brand.primitives || {};
  const radiusMap = brand.semanticRadiusMap || {};
  const spacingMap = brand.semanticSpacingMap || {};

  // Brand primary (interactive-primary) — used as the radius/spacing accent so it
  // matches the brand instead of a fixed blue.
  const semantics = mergeLightSemanticsForBrand(brand);
  const resolveRole = (role) => {
    const m = semantics[role];
    if (!m || m.color === "transparent") return null;
    return primitives[m.color]?.[m.index] ?? GLOBAL_PRIMITIVES[m.color]?.[m.index] ?? null;
  };
  const primaryHex = resolveRole("interactive-primary") || "#4DABF7";

  const labelOf = (key) => String(key).split("/").pop();

  return (
    <div style={{ color: TEXT }}>
      <ScaleSection title="Color Palette">
        <div>
          {Object.entries(primitives).map(([name, ramp]) => (
            <ColorFamilyRow key={name} name={name} ramp={ramp} />
          ))}
          {Object.keys(primitives).length === 0 && (
            <div style={{ fontSize: 12, color: TEXT_FAINT, fontStyle: "italic" }}>
              No brand color palettes defined.
            </div>
          )}
        </div>
      </ScaleSection>

      <ScaleSection title="Semantic Colors">
        <div>
          {SEMANTIC_GROUPS.map(([name, roles]) => (
            <SemanticGroup key={name} name={name} roles={roles} resolveRole={resolveRole} />
          ))}
        </div>
      </ScaleSection>

      <ScaleSection title="Radius">
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", justifyContent: "center" }}>
          {Object.entries(radiusMap).map(([key, def]) => {
            const value = def && typeof def === "object" ? def.value : def;
            const visual = Math.min(Number(value) || 0, 28);
            return (
              <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    background: PANEL,
                    border: `1.5px solid ${primaryHex}`,
                    borderTopLeftRadius: visual,
                    borderTopRightRadius: visual,
                  }}
                />
                <span style={{ fontSize: 11, fontWeight: 600, color: TEXT }}>{labelOf(key)}</span>
                <ValueChip>{value}px</ValueChip>
              </div>
            );
          })}
        </div>
      </ScaleSection>

      <ScaleSection title="Spacing">
        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 24, alignItems: "center", justifyContent: "center" }}>
          {Object.entries(spacingMap).map(([key, def]) => {
            const value = def && typeof def === "object" ? def.value : def;
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: TEXT }}>{labelOf(key)}</span>
                <div
                  style={{
                    height: 14,
                    width: Math.max(2, Number(value) || 0),
                    background: primaryHex,
                    borderRadius: 3,
                  }}
                />
                <ValueChip>{value}px</ValueChip>
              </div>
            );
          })}
        </div>
      </ScaleSection>
    </div>
  );
}
