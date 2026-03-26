import CheckboxPreview from "../previews/CheckboxPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

export const CHECKBOX_VARIANTS = ["filled", "outlined"];
export const CHECKBOX_RADIUS_KEYS = ["xs", "sm", "md", "lg", "xl"];
export const CHECKBOX_STATES = ["default", "hover", "focus", "pressed", "disabled"];
export const CHECKBOX_SELECTIONS = ["unchecked", "checked", "indeterminate"];

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

export function CheckboxPreviewContent({
  brands,
  activeBrand,
  activeVariant,
  activeCheckboxSize,
  activeCheckboxRadius,
  sizeKeys,
  activeColorToken,
  selectedSelection,
  selectedState,
}) {
  const selectedChecked = selectedSelection === "checked";
  const selectedIndeterminate = selectedSelection === "indeterminate";

  const matrixRows = [
    { label: "Unchecked", checked: false, indeterminate: false },
    { label: "Checked", checked: true, indeterminate: false },
    { label: "Indeterminate", checked: false, indeterminate: true },
  ];

  return (
    <div>
      <PreviewStage padding={24} label={activeColorToken}>
        <CheckboxPreview
          brands={brands}
          brandId={activeBrand}
          variant={activeVariant}
          size={activeCheckboxSize}
          radius={activeCheckboxRadius}
          label="Checkbox label"
          checked={selectedChecked}
          indeterminate={selectedIndeterminate}
          state={selectedState === "default" ? undefined : selectedState}
          readOnly
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Sizes &amp; States</SectionLabel>
      <PreviewMatrix
        sizeKeys={sizeKeys}
        rows={matrixRows}
        renderCell={(row, s) => (
          <CheckboxPreview
            brands={brands}
            brandId={activeBrand}
            variant={activeVariant}
            size={s}
            radius={activeCheckboxRadius}
            label="Checkbox label"
            checked={row.checked}
            indeterminate={row.indeterminate}
            state={selectedState === "default" ? undefined : selectedState}
            readOnly
          />
        )}
      />

    </div>
  );
}

export function CheckboxPropertiesPanel({
  activeVariant,
  setActiveVariant,
  activeCheckboxSize,
  setActiveCheckboxSize,
  activeCheckboxRadius,
  setActiveCheckboxRadius,
  sizeKeys,
  selectedSelection,
  setSelectedSelection,
  selectedState,
  setSelectedState,
  forcedChecked,
  forcedIndeterminate,
  forcedState,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow label="Variant" value={activeVariant} onChange={setActiveVariant} options={CHECKBOX_VARIANTS} />
      <PropertyRow label="Size" value={activeCheckboxSize} onChange={setActiveCheckboxSize} options={sizeKeys} />
      <PropertyRow label="Radius" value={activeCheckboxRadius} onChange={setActiveCheckboxRadius} options={CHECKBOX_RADIUS_KEYS} />
      <PropertyRow
        label="Selection"
        value={selectedSelection}
        onChange={setSelectedSelection}
        options={CHECKBOX_SELECTIONS}
        disabled={forcedChecked != null || forcedIndeterminate}
      />
      <PropertyRow
        label="State"
        value={selectedState}
        onChange={setSelectedState}
        options={CHECKBOX_STATES}
        disabled={Boolean(forcedState)}
      />
    </div>
  );
}

export default function CheckboxPreviewPanel(props) {
  return (
    <div>
      <CheckboxPropertiesPanel
        activeVariant={props.activeVariant}
        setActiveVariant={props.setActiveVariant}
        activeCheckboxSize={props.activeCheckboxSize}
        setActiveCheckboxSize={props.setActiveCheckboxSize}
        activeCheckboxRadius={props.activeCheckboxRadius}
        setActiveCheckboxRadius={props.setActiveCheckboxRadius}
        sizeKeys={props.sizeKeys}
        selectedSelection={props.selectedSelection}
        setSelectedSelection={props.setSelectedSelection}
        selectedState={props.selectedState}
        setSelectedState={props.setSelectedState}
        forcedChecked={props.forcedChecked}
        forcedIndeterminate={props.forcedIndeterminate}
        forcedState={props.forcedState}
      />
      <div style={{ marginTop: 24 }}>
        <CheckboxPreviewContent
          brands={props.brands}
          activeBrand={props.activeBrand}
          activeVariant={props.activeVariant}
          activeCheckboxSize={props.activeCheckboxSize}
          activeCheckboxRadius={props.activeCheckboxRadius}
          sizeKeys={props.sizeKeys}
          activeColorToken={props.activeColorToken}
          selectedSelection={props.selectedSelection}
          selectedState={props.selectedState}
        />
      </div>
    </div>
  );
}
