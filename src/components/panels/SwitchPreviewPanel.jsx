import SwitchPreview from "../previews/SwitchPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

export const SWITCH_STATES = ["default", "hover", "focus", "pressed", "disabled"];

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

export function SwitchPreviewContent({
  brands,
  activeBrand,
  activeSwitchSize,
  sizeKeys,
  activeColorToken,
  selectedChecked,
  selectedState,
}) {
  const matrixRows = [
    { label: "off", checked: false },
    { label: "on", checked: true },
  ];

  return (
    <div>
      <PreviewStage label={activeColorToken}>
        <SwitchPreview
          brands={brands}
          brandId={activeBrand}
          size={activeSwitchSize}
          label="Switch label"
          checked={selectedChecked}
          readOnly
          state={selectedState === "default" ? undefined : selectedState}
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Sizes — Off & On States</SectionLabel>
      <PreviewMatrix
        sizeKeys={sizeKeys}
        rows={matrixRows}
        renderCell={(row, s) => (
          <SwitchPreview
            brands={brands}
            brandId={activeBrand}
            size={s}
            label="Switch label"
            checked={row.checked}
            readOnly
            state={selectedState === "default" ? undefined : selectedState}
          />
        )}
      />
    </div>
  );
}

export function SwitchPropertiesPanel({
  activeSwitchSize,
  setActiveSwitchSize,
  sizeKeys,
  selectedChecked,
  setSelectedChecked,
  selectedState,
  setSelectedState,
  forcedChecked,
  forcedState,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow
        label="Size"
        value={activeSwitchSize}
        onChange={setActiveSwitchSize}
        options={sizeKeys}
      />
      <PropertyRow
        label="Checked"
        value={selectedChecked ? "on" : "off"}
        onChange={(v) => setSelectedChecked(v === "on")}
        options={["off", "on"]}
        disabled={forcedChecked != null}
      />
      <PropertyRow
        label="State"
        value={selectedState}
        onChange={setSelectedState}
        options={SWITCH_STATES}
        disabled={Boolean(forcedState)}
      />
    </div>
  );
}

export default function SwitchPreviewPanel(props) {
  return (
    <div>
      <SwitchPropertiesPanel
        activeSwitchSize={props.activeSwitchSize}
        setActiveSwitchSize={props.setActiveSwitchSize}
        sizeKeys={props.sizeKeys}
        selectedChecked={props.selectedChecked}
        setSelectedChecked={props.setSelectedChecked}
        selectedState={props.selectedState}
        setSelectedState={props.setSelectedState}
        forcedChecked={props.forcedChecked}
        forcedState={props.forcedState}
      />
      <div style={{ marginTop: 24 }}>
        <SwitchPreviewContent
          brands={props.brands}
          activeBrand={props.activeBrand}
          activeSwitchSize={props.activeSwitchSize}
          sizeKeys={props.sizeKeys}
          activeColorToken={props.activeColorToken}
          selectedChecked={props.selectedChecked}
          selectedState={props.selectedState}
        />
      </div>
    </div>
  );
}
