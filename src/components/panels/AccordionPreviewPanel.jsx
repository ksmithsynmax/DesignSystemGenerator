import AccordionPreview from "../previews/AccordionPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

export const ACCORDION_VARIANTS = ["default", "contained", "filled"];
export const ACCORDION_STATES = ["default", "hover", "focus", "disabled"];
export const ACCORDION_POSITIONS = ["single", "first", "middle", "last"];

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

export function AccordionPreviewContent({
  brands,
  activeBrand,
  activeVariant,
  activePosition,
  selectedState,
  expanded,
  activeColorToken,
  label,
}) {
  const rows = ACCORDION_VARIANTS.map((variant) => ({ label: variant, variant }));
  return (
    <div>
      <PreviewStage label={activeColorToken} contentAlignItems="flex-start">
        <AccordionPreview
          brands={brands}
          brandId={activeBrand}
          variant={activeVariant}
          position={activePosition}
          state={selectedState}
          expanded={expanded}
          label={label}
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Variants x States</SectionLabel>
      <PreviewMatrix
        sizeKeys={ACCORDION_STATES}
        rows={rows}
        renderCell={(row, state) => (
          <AccordionPreview
            brands={brands}
            brandId={activeBrand}
            variant={row.variant}
            position="single"
            state={state}
            expanded={state !== "disabled"}
            label="Section label"
          />
        )}
      />
    </div>
  );
}

export function AccordionPropertiesPanel({
  activeVariant,
  setActiveVariant,
  activePosition,
  setActivePosition,
  selectedState,
  setSelectedState,
  expanded,
  setExpanded,
  label,
  setLabel,
  forcedState,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow label="Variant" value={activeVariant} onChange={setActiveVariant} options={ACCORDION_VARIANTS} />
      <PropertyRow label="Position" value={activePosition} onChange={setActivePosition} options={ACCORDION_POSITIONS} />
      <PropertyRow
        label="State"
        value={selectedState}
        onChange={setSelectedState}
        options={ACCORDION_STATES}
        disabled={Boolean(forcedState)}
      />
      <PropertyRow
        label="Expanded"
        value={expanded ? "on" : "off"}
        onChange={(v) => setExpanded(v === "on")}
        options={["off", "on"]}
      />
      <div>
        <SectionLabel mb={6}>Label</SectionLabel>
        <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} style={textFieldStyle} />
      </div>
    </div>
  );
}
