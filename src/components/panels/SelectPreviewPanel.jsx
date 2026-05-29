import SelectPreview from "../previews/SelectPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

export const SELECT_VARIANTS = ["default", "filled"];
export const SELECT_RADIUS_KEYS = ["default", "xs", "sm", "md", "lg", "xl"];
export const SELECT_STATES = ["default", "hover", "focus", "error", "disabled"];

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

export function SelectPreviewContent({
  brands,
  activeBrand,
  activeVariant,
  activeSelectSize,
  activeSelectRadius,
  sizeKeys,
  activeColorToken,
  selectedState,
  showLabel,
  labelText,
  withAsterisk,
  showError,
  errorText,
  searchable,
  clearable,
}) {
  const matrixRows = SELECT_VARIANTS.flatMap((v) => [
    { label: `${v}`, variant: v, state: "default" },
    { label: `${v} / hover`, variant: v, state: "hover" },
    { label: `${v} / focus`, variant: v, state: "focus" },
    { label: `${v} / error`, variant: v, state: "error" },
    { label: `${v} / disabled`, variant: v, state: "disabled" },
  ]);

  return (
    <div>
      <PreviewStage label={activeColorToken}>
        <div style={{ width: 280 }}>
          <SelectPreview
            brands={brands}
            brandId={activeBrand}
            variant={activeVariant}
            size={activeSelectSize}
            radius={activeSelectRadius}
            showLabel={showLabel}
            labelText={labelText}
            withAsterisk={withAsterisk}
            showError={selectedState === "error" || showError}
            errorText={errorText}
            state={selectedState === "default" ? undefined : selectedState}
            searchable={searchable}
            clearable={clearable}
          />
        </div>
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Variants x States x Sizes</SectionLabel>
      <PreviewMatrix
        sizeKeys={sizeKeys}
        rows={matrixRows}
        renderCell={(row, s) => (
          <div style={{ width: 160, textAlign: "left", display: "inline-block" }}>
            <SelectPreview
              brands={brands}
              brandId={activeBrand}
              variant={row.variant}
              size={s}
              radius={activeSelectRadius}
              state={row.state}
              showLabel={false}
              showError={row.state === "error"}
              errorText="Error"
            />
          </div>
        )}
      />
    </div>
  );
}

export function SelectPropertiesPanel({
  activeVariant,
  setActiveVariant,
  activeSelectSize,
  setActiveSelectSize,
  activeSelectRadius,
  setActiveSelectRadius,
  sizeKeys,
  selectedState,
  setSelectedState,
  showLabel,
  setShowLabel,
  labelText,
  setLabelText,
  withAsterisk,
  setWithAsterisk,
  showError,
  setShowError,
  errorText,
  setErrorText,
  searchable,
  setSearchable,
  clearable,
  setClearable,
  forcedState,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow label="Variant" value={activeVariant} onChange={setActiveVariant} options={SELECT_VARIANTS} />
      <PropertyRow label="Size" value={activeSelectSize} onChange={setActiveSelectSize} options={sizeKeys} />
      <PropertyRow
        label="Radius"
        value={activeSelectRadius}
        onChange={setActiveSelectRadius}
        options={SELECT_RADIUS_KEYS}
        disabled={activeVariant === "default"}
      />
      <PropertyRow
        label="State"
        value={selectedState}
        onChange={setSelectedState}
        options={SELECT_STATES}
        disabled={Boolean(forcedState)}
      />
      <PropertyRow
        label="Label"
        value={showLabel ? "on" : "off"}
        onChange={(v) => setShowLabel(v === "on")}
        options={["off", "on"]}
      />
      {showLabel && (
        <div>
          <SectionLabel mb={6}>Label Text</SectionLabel>
          <input
            type="text"
            value={labelText}
            onChange={(e) => setLabelText(e.target.value)}
            style={textFieldStyle}
          />
        </div>
      )}
      <PropertyRow
        label="Required"
        value={withAsterisk ? "on" : "off"}
        onChange={(v) => setWithAsterisk(v === "on")}
        options={["off", "on"]}
        disabled={!showLabel}
      />
      <PropertyRow
        label="Error Message"
        value={showError ? "on" : "off"}
        onChange={(v) => setShowError(v === "on")}
        options={["off", "on"]}
      />
      {showError && (
        <div>
          <SectionLabel mb={6}>Error Text</SectionLabel>
          <input
            type="text"
            value={errorText}
            onChange={(e) => setErrorText(e.target.value)}
            style={textFieldStyle}
          />
        </div>
      )}
      <PropertyRow
        label="Search"
        value={searchable ? "on" : "off"}
        onChange={(v) => setSearchable(v === "on")}
        options={["off", "on"]}
      />
      <PropertyRow
        label="Clearable"
        value={clearable ? "on" : "off"}
        onChange={(v) => setClearable(v === "on")}
        options={["off", "on"]}
      />
    </div>
  );
}
