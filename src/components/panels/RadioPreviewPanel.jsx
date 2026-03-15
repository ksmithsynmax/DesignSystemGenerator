import RadioPreview from "../previews/RadioPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

export const RADIO_VARIANTS = ["filled", "outline"];
export const RADIO_STATES = ["default", "hover", "focus", "pressed", "disabled"];
export const RADIO_SELECTIONS = ["unchecked", "checked"];

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

export function RadioPreviewContent({
  brands,
  activeBrand,
  activeVariant,
  activeRadioSize,
  sizeKeys,
  activeColorToken,
  selectedChecked,
  selectedState,
  showLabel,
}) {
  const matrixRows = RADIO_VARIANTS.flatMap((v) => [
    { label: `${v} / unchecked`, variant: v, checked: false },
    { label: `${v} / checked`, variant: v, checked: true },
  ]);

  return (
    <div>
      <PreviewStage label={activeColorToken}>
        <RadioPreview
          brands={brands}
          brandId={activeBrand}
          variant={activeVariant}
          size={activeRadioSize}
          label={showLabel ? "Radio label" : undefined}
          checked={selectedChecked}
          state={selectedState === "default" ? undefined : selectedState}
          readOnly
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Variants x Sizes</SectionLabel>
      <PreviewMatrix
        sizeKeys={sizeKeys}
        rows={matrixRows}
        renderCell={(row, s) => (
          <RadioPreview
            brands={brands}
            brandId={activeBrand}
            variant={row.variant}
            size={s}
            checked={row.checked}
            state={selectedState === "default" ? undefined : selectedState}
            readOnly
          />
        )}
      />

    </div>
  );
}

export function RadioPropertiesPanel({
  activeVariant,
  setActiveVariant,
  activeRadioSize,
  setActiveRadioSize,
  sizeKeys,
  selectedChecked,
  setSelectedChecked,
  selectedState,
  setSelectedState,
  showLabel,
  setShowLabel,
  forcedChecked,
  forcedState,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow label="Variant" value={activeVariant} onChange={setActiveVariant} options={RADIO_VARIANTS} />
      <PropertyRow label="Size" value={activeRadioSize} onChange={setActiveRadioSize} options={sizeKeys} />
      <PropertyRow
        label="Selection"
        value={selectedChecked ? "checked" : "unchecked"}
        onChange={(v) => setSelectedChecked(v === "checked")}
        options={RADIO_SELECTIONS}
        disabled={forcedChecked != null}
      />
      <PropertyRow
        label="State"
        value={selectedState}
        onChange={setSelectedState}
        options={RADIO_STATES}
        disabled={Boolean(forcedState)}
      />
      <PropertyRow
        label="Label"
        value={showLabel ? "on" : "off"}
        onChange={(v) => setShowLabel(v === "on")}
        options={["off", "on"]}
      />
    </div>
  );
}

export default function RadioPreviewPanel(props) {
  return (
    <div>
      <RadioPropertiesPanel
        activeVariant={props.activeVariant}
        setActiveVariant={props.setActiveVariant}
        activeRadioSize={props.activeRadioSize}
        setActiveRadioSize={props.setActiveRadioSize}
        sizeKeys={props.sizeKeys}
        selectedChecked={props.selectedChecked}
        setSelectedChecked={props.setSelectedChecked}
        selectedState={props.selectedState}
        setSelectedState={props.setSelectedState}
        showLabel={props.showLabel}
        setShowLabel={props.setShowLabel}
        forcedChecked={props.forcedChecked}
        forcedState={props.forcedState}
      />
      <div style={{ marginTop: 24 }}>
        <RadioPreviewContent
          brands={props.brands}
          activeBrand={props.activeBrand}
          activeVariant={props.activeVariant}
          activeRadioSize={props.activeRadioSize}
          sizeKeys={props.sizeKeys}
          activeColorToken={props.activeColorToken}
          selectedChecked={props.selectedChecked}
          selectedState={props.selectedState}
          showLabel={props.showLabel}
        />
      </div>
    </div>
  );
}
