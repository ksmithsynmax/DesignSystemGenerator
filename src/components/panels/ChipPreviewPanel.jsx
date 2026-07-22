import ChipPreview from "../previews/ChipPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

export const CHIP_VARIANTS = ["filled", "outline", "light"];
export const CHIP_RADIUS_KEYS = ["default", "xs", "sm", "md", "lg", "xl"];
// Interaction state (columns in the spec: Enabled/Hovered/Focused/Pressed) —
// "default" renders as Enabled.
export const CHIP_STATES = ["default", "hover", "focus", "pressed", "disabled"];
// Selective state (rows in the spec) collapses selection (checked) and
// availability (inactive) into one friendly control.
export const CHIP_SELECTIVE_STATES = ["active", "selected", "inactive", "selective-inactive"];

const selectiveFromFlags = (checked, inactive) =>
  inactive ? (checked ? "selective-inactive" : "inactive") : checked ? "selected" : "active";
const selectiveToChecked = (v) => v === "selected" || v === "selective-inactive";
const selectiveToInactive = (v) => v === "inactive" || v === "selective-inactive";

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

export function ChipPreviewContent({
  brands,
  activeBrand,
  activeVariant,
  activeChipSize,
  activeChipRadius,
  sizeKeys,
  activeColorToken,
  selectedChecked,
  selectedInactive,
  selectedState,
  subLabel,
  withRemove,
  showCheckmark,
}) {
  const matrixRows = CHIP_VARIANTS.flatMap((v) => [
    { label: `${v} / active`, variant: v, checked: false, inactive: false },
    { label: `${v} / selected`, variant: v, checked: true, inactive: false },
    { label: `${v} / inactive`, variant: v, checked: false, inactive: true },
    { label: `${v} / selective inactive`, variant: v, checked: true, inactive: true },
  ]);
  const subLabelText = subLabel ? "Sub-label" : undefined;

  return (
    <div>
      <PreviewStage label={activeColorToken}>
        <ChipPreview
          brands={brands}
          brandId={activeBrand}
          variant={activeVariant}
          size={activeChipSize}
          radius={activeChipRadius}
          checked={selectedChecked}
          inactive={selectedInactive}
          state={selectedState === "default" ? undefined : selectedState}
          subLabel={subLabelText}
          withRemove={withRemove}
          showCheckmark={showCheckmark}
          readOnly
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Variants x Sizes</SectionLabel>
      <PreviewMatrix
        sizeKeys={sizeKeys}
        rows={matrixRows}
        renderCell={(row, s) => (
          <ChipPreview
            brands={brands}
            brandId={activeBrand}
            variant={row.variant}
            size={s}
            radius={activeChipRadius}
            checked={row.checked}
            inactive={row.inactive}
            state={selectedState === "default" ? undefined : selectedState}
            subLabel={subLabelText}
            withRemove={withRemove}
            showCheckmark={showCheckmark}
            readOnly
          />
        )}
      />

    </div>
  );
}

export function ChipPropertiesPanel({
  activeVariant,
  setActiveVariant,
  activeChipSize,
  setActiveChipSize,
  activeChipRadius,
  setActiveChipRadius,
  sizeKeys,
  selectedChecked,
  setSelectedChecked,
  selectedInactive,
  setSelectedInactive,
  selectedState,
  setSelectedState,
  forcedSelective,
  forcedState,
  subLabel,
  setSubLabel,
  withRemove,
  setWithRemove,
  showCheckmark,
  setShowCheckmark,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow label="Variant" value={activeVariant} onChange={setActiveVariant} options={CHIP_VARIANTS} />
      <PropertyRow label="Size" value={activeChipSize} onChange={setActiveChipSize} options={sizeKeys} />
      <PropertyRow label="Radius" value={activeChipRadius} onChange={setActiveChipRadius} options={CHIP_RADIUS_KEYS} />
      <PropertyRow
        label="Selective State"
        value={selectiveFromFlags(selectedChecked, selectedInactive)}
        onChange={(v) => {
          setSelectedChecked(selectiveToChecked(v));
          setSelectedInactive(selectiveToInactive(v));
        }}
        options={CHIP_SELECTIVE_STATES}
        disabled={Boolean(forcedSelective)}
      />
      <PropertyRow
        label="State"
        value={selectedState}
        onChange={setSelectedState}
        options={CHIP_STATES}
        disabled={Boolean(forcedState)}
      />
      <PropertyRow
        label="Checkmark"
        value={showCheckmark ? "on" : "off"}
        onChange={(v) => setShowCheckmark(v === "on")}
        options={["off", "on"]}
      />
      <PropertyRow
        label="Sub-label"
        value={subLabel ? "on" : "off"}
        onChange={(v) => setSubLabel(v === "on")}
        options={["off", "on"]}
      />
      <PropertyRow
        label="Remove (×)"
        value={withRemove ? "on" : "off"}
        onChange={(v) => setWithRemove(v === "on")}
        options={["off", "on"]}
      />
    </div>
  );
}

export default function ChipPreviewPanel(props) {
  return (
    <div>
      <ChipPropertiesPanel
        activeVariant={props.activeVariant}
        setActiveVariant={props.setActiveVariant}
        activeChipSize={props.activeChipSize}
        setActiveChipSize={props.setActiveChipSize}
        activeChipRadius={props.activeChipRadius}
        setActiveChipRadius={props.setActiveChipRadius}
        sizeKeys={props.sizeKeys}
        selectedChecked={props.selectedChecked}
        setSelectedChecked={props.setSelectedChecked}
        selectedInactive={props.selectedInactive}
        setSelectedInactive={props.setSelectedInactive}
        selectedState={props.selectedState}
        setSelectedState={props.setSelectedState}
        forcedSelective={props.forcedSelective}
        forcedState={props.forcedState}
        subLabel={props.subLabel}
        setSubLabel={props.setSubLabel}
        withRemove={props.withRemove}
        setWithRemove={props.setWithRemove}
        showCheckmark={props.showCheckmark}
        setShowCheckmark={props.setShowCheckmark}
      />
      <div style={{ marginTop: 24 }}>
        <ChipPreviewContent
          brands={props.brands}
          activeBrand={props.activeBrand}
          activeVariant={props.activeVariant}
          activeChipSize={props.activeChipSize}
          activeChipRadius={props.activeChipRadius}
          sizeKeys={props.sizeKeys}
          activeColorToken={props.activeColorToken}
          selectedChecked={props.selectedChecked}
          selectedInactive={props.selectedInactive}
          selectedState={props.selectedState}
          subLabel={props.subLabel}
          withRemove={props.withRemove}
          showCheckmark={props.showCheckmark}
        />
      </div>
    </div>
  );
}
