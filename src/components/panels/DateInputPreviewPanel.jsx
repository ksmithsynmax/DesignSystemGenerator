import DateInputPreview from "../previews/DateInputPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

export const DATEINPUT_VARIANTS = ["default"];
export const DATEINPUT_RADIUS_KEYS = ["default", "xs", "sm", "md", "lg", "xl"];
export const DATEINPUT_STATES = ["default", "hover", "focus", "error", "disabled"];

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

export function DateInputPreviewContent({
  brands,
  activeBrand,
  activeVariant,
  activeDateInputSize,
  activeDateInputRadius,
  sizeKeys,
  activeColorToken,
  selectedState,
  showLabel,
  labelText,
  withAsterisk,
  showError,
  errorText,
  showDropdown,
  onToggleDropdown,
}) {
  const matrixRows = DATEINPUT_VARIANTS.flatMap((v) => [
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
          <DateInputPreview
            brands={brands}
            brandId={activeBrand}
            variant={activeVariant}
            size={activeDateInputSize}
            radius={activeDateInputRadius}
            showLabel={showLabel}
            labelText={labelText}
            withAsterisk={withAsterisk}
            showError={selectedState === "error" || showError}
            errorText={errorText}
            state={selectedState === "default" ? undefined : selectedState}
            showDropdown={showDropdown}
            onToggleDropdown={onToggleDropdown}
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
            <DateInputPreview
              brands={brands}
              brandId={activeBrand}
              variant={row.variant}
              size={s}
              radius={activeDateInputRadius}
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

export function DateInputPropertiesPanel({
  activeDateInputSize,
  setActiveDateInputSize,
  activeDateInputRadius,
  setActiveDateInputRadius,
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
  showDropdown,
  setShowDropdown,
  forcedState,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow label="Size" value={activeDateInputSize} onChange={setActiveDateInputSize} options={sizeKeys} />
      <PropertyRow label="Radius" value={activeDateInputRadius} onChange={setActiveDateInputRadius} options={DATEINPUT_RADIUS_KEYS} />
      <PropertyRow
        label="State"
        value={selectedState}
        onChange={setSelectedState}
        options={DATEINPUT_STATES}
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
      <PropertyRow
        label="Calendar Dropdown"
        value={showDropdown ? "open" : "closed"}
        onChange={(v) => setShowDropdown(v === "open")}
        options={["closed", "open"]}
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
    </div>
  );
}
