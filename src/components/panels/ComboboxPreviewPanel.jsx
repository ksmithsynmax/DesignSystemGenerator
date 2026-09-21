import ComboboxPreview from "../previews/ComboboxPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

export const COMBOBOX_VARIANTS = ["list", "grid"];
export const COMBOBOX_RADIUS_KEYS = ["default", "xs", "sm", "md", "lg", "xl"];
export const COMBOBOX_STATES = ["default", "hover", "focus", "error", "disabled"];
// The grid variant is a SLOT: the design system styles the row container; the
// dev supplies the layout inside. These are example slot contents to preview
// with. "custom" is the empty placeholder the slot starts from.
export const COMBOBOX_SLOT_LAYOUTS = ["custom", "vessel", "user", "simple"];

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

export function ComboboxPreviewContent({
  brands,
  activeBrand,
  activeVariant,
  activeComboboxSize,
  activeComboboxRadius,
  sizeKeys,
  activeColorToken,
  selectedState,
  selectionMode,
  slotLayout,
  showLabel,
  labelText,
  withAsterisk,
  showError,
  errorText,
  showDropdown,
  onToggleDropdown,
}) {
  const matrixRows = COMBOBOX_VARIANTS.flatMap((v) => [
    { label: `${v}`, variant: v, state: "default" },
    { label: `${v} / hover`, variant: v, state: "hover" },
    { label: `${v} / focus`, variant: v, state: "focus" },
    { label: `${v} / error`, variant: v, state: "error" },
    { label: `${v} / disabled`, variant: v, state: "disabled" },
  ]);

  return (
    <div>
      <PreviewStage label={activeColorToken}>
        <div style={{ width: activeVariant === "grid" ? 420 : 300 }}>
          <ComboboxPreview
            brands={brands}
            brandId={activeBrand}
            variant={activeVariant}
            size={activeComboboxSize}
            radius={activeComboboxRadius}
            selectionMode={selectionMode}
            slotLayout={slotLayout}
            showLabel={showLabel}
            labelText={labelText}
            withAsterisk={withAsterisk}
            showError={selectedState === "error" || showError}
            errorText={errorText}
            state={selectedState === "default" ? undefined : selectedState}
            showDropdown={showDropdown}
            onToggleDropdown={onToggleDropdown}
            interactive
          />
        </div>
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Variants x States x Sizes</SectionLabel>
      <PreviewMatrix
        sizeKeys={sizeKeys}
        rows={matrixRows}
        renderCell={(row, s) => (
          <div style={{ width: row.variant === "grid" ? 320 : 200, textAlign: "left", display: "inline-block" }}>
            <ComboboxPreview
              brands={brands}
              brandId={activeBrand}
              variant={row.variant}
              size={s}
              radius={activeComboboxRadius}
              selectionMode={selectionMode}
              slotLayout={slotLayout}
              state={row.state}
              showLabel={false}
              showError={row.state === "error"}
              errorText="Error"
              showDropdown
            />
          </div>
        )}
      />
    </div>
  );
}

export function ComboboxPropertiesPanel({
  activeVariant,
  setActiveVariant,
  activeComboboxSize,
  setActiveComboboxSize,
  activeComboboxRadius,
  setActiveComboboxRadius,
  sizeKeys,
  selectedState,
  setSelectedState,
  selectionMode,
  setSelectionMode,
  slotLayout,
  setSlotLayout,
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
  const isGrid = activeVariant === "grid";
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow label="Variant" value={activeVariant} onChange={setActiveVariant} options={COMBOBOX_VARIANTS} />
      <PropertyRow
        label="Selection"
        value={selectionMode}
        onChange={setSelectionMode}
        options={["single", "multi"]}
      />
      <PropertyRow label="Size" value={activeComboboxSize} onChange={setActiveComboboxSize} options={sizeKeys} />
      <PropertyRow
        label="Radius"
        value={activeComboboxRadius}
        onChange={setActiveComboboxRadius}
        options={COMBOBOX_RADIUS_KEYS}
      />
      <PropertyRow
        label="Slot layout (example content)"
        value={slotLayout}
        onChange={setSlotLayout}
        options={COMBOBOX_SLOT_LAYOUTS}
        disabled={!isGrid}
      />
      {isGrid && (
        <div style={{ fontSize: 11, color: "#5C5F66", lineHeight: 1.5, marginTop: -2 }}>
          The grid row is a slot — the design system styles the container (background,
          divider, padding, radius); the dev renders any layout inside. These presets
          just preview example content.
        </div>
      )}
      <PropertyRow
        label="State"
        value={selectedState}
        onChange={setSelectedState}
        options={COMBOBOX_STATES}
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
        label="Dropdown"
        value={showDropdown ? "on" : "off"}
        onChange={(v) => setShowDropdown(v === "on")}
        options={["off", "on"]}
      />
    </div>
  );
}
