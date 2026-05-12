import BadgePreview from "../previews/BadgePreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

export const BADGE_VARIANTS = ["default", "filled", "light", "outline"];
export const BADGE_COLORS = ["default", "success", "warning", "error"];
export const BADGE_SIZE_KEYS = ["default", "xs", "sm", "md", "lg", "xl"];
export const BADGE_RADIUS_KEYS = ["default", "xs", "sm", "md", "lg", "xl"];

/** Matrix rows: variant + optional semantic color (only used for filled / outline). */
export const BADGE_MATRIX_ROWS = [
  { label: "default", variant: "default", color: "default" },
  { label: "light", variant: "light", color: "default" },
  { label: "filled", variant: "filled", color: "default" },
  { label: "filled · success", variant: "filled", color: "success" },
  { label: "filled · warning", variant: "filled", color: "warning" },
  { label: "filled · error", variant: "filled", color: "error" },
  { label: "outline", variant: "outline", color: "default" },
  { label: "outline · success", variant: "outline", color: "success" },
  { label: "outline · warning", variant: "outline", color: "warning" },
  { label: "outline · error", variant: "outline", color: "error" },
];

function PropertyRow({ label, value, onChange, options, disabled = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <SectionLabel mb={0}>{label}</SectionLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          background: disabled ? "#2A2C31" : "#25262B",
          color: disabled ? "#868E96" : "#E9ECEF",
          border: "1px solid #373A40",
          borderRadius: 6,
          padding: "6px 28px 6px 12px",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "monospace",
          outline: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          appearance: "none",
          WebkitAppearance: "none",
          textTransform: "capitalize",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%235C5F66' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

const textFieldStyle = {
  background: "#1A1B1E",
  border: "1px solid #373A40",
  borderRadius: 4,
  padding: "6px 8px",
  fontSize: 12,
  color: "#C1C2C5",
  fontFamily: "monospace",
  width: "100%",
  boxSizing: "border-box",
};

export function BadgePreviewContent({
  brands,
  activeBrand,
  activeColorToken,
  activeVariant,
  activeTone,
  size,
  radius,
  circle,
  fullWidth,
  text,
  previewTheme,
}) {
  return (
    <div>
      <PreviewStage label={activeColorToken} padding={56}>
        <BadgePreview
          brands={brands}
          brandId={activeBrand}
          variant={activeVariant}
          tone={activeTone}
          size={size}
          radius={radius}
          circle={circle}
          fullWidth={fullWidth}
          text={text}
          previewTheme={previewTheme}
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>Variants × colors × sizes</SectionLabel>
      <PreviewMatrix
        sizeKeys={BADGE_SIZE_KEYS}
        rows={BADGE_MATRIX_ROWS}
        renderCell={(row, s) => (
          <BadgePreview
            brands={brands}
            brandId={activeBrand}
            variant={row.variant}
            tone={row.color}
            size={s}
            radius={radius}
            circle={false}
            fullWidth={false}
            text="Badge"
            previewTheme={previewTheme}
          />
        )}
      />
    </div>
  );
}

export function BadgePropertiesPanel({
  activeVariant,
  setActiveVariant,
  activeTone,
  setActiveTone,
  size,
  setSize,
  radius,
  setRadius,
  circle,
  setCircle,
  fullWidth,
  setFullWidth,
  text,
  setText,
}) {
  const colorEnabled = activeVariant === "filled" || activeVariant === "outline";
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow label="Variant" value={activeVariant} onChange={setActiveVariant} options={BADGE_VARIANTS} />
      <PropertyRow
        label="Color"
        value={colorEnabled ? activeTone : "default"}
        onChange={setActiveTone}
        options={BADGE_COLORS}
        disabled={!colorEnabled}
      />
      <PropertyRow label="Size" value={size} onChange={setSize} options={BADGE_SIZE_KEYS} />
      <PropertyRow label="Radius" value={radius} onChange={setRadius} options={BADGE_RADIUS_KEYS} />
      <PropertyRow
        label="Circle"
        value={circle ? "on" : "off"}
        onChange={(v) => setCircle(v === "on")}
        options={["off", "on"]}
      />
      <PropertyRow
        label="Full Width"
        value={fullWidth ? "on" : "off"}
        onChange={(v) => setFullWidth(v === "on")}
        options={["off", "on"]}
        disabled={circle}
      />
      <div>
        <SectionLabel mb={6}>Label</SectionLabel>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} style={textFieldStyle} />
      </div>
    </div>
  );
}
