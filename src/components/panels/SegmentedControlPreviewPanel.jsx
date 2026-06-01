import SegmentedControlPreview from "../previews/SegmentedControlPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

export const SEGMENTED_CONTROL_STATES = ["default", "hover", "focus", "disabled"];
export const SEGMENTED_CONTROL_ORIENTATIONS = ["horizontal", "vertical"];

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

export function SegmentedControlPreviewContent({
  brands,
  activeBrand,
  previewTheme,
  activeSegmentedControlSize,
  sizeKeys,
  activeColorToken,
  selectedOrientation,
  selectedFullWidth,
  selectedState,
}) {
  const matrixRows = SEGMENTED_CONTROL_ORIENTATIONS.map((o) => ({ label: o, orientation: o }));
  return (
    <div>
      <PreviewStage
        label={activeColorToken}
        contentAlignItems="flex-start"
        contentJustifyContent="flex-start"
      >
        <SegmentedControlPreview
          brands={brands}
          brandId={activeBrand}
          previewTheme={previewTheme}
          size={activeSegmentedControlSize}
          orientation={selectedOrientation}
          fullWidth={selectedFullWidth}
          state={selectedState === "default" ? undefined : selectedState}
          interactive
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Sizes x Orientation</SectionLabel>
      <PreviewMatrix
        sizeKeys={sizeKeys}
        rows={matrixRows}
        renderCell={(row, s) => (
          <SegmentedControlPreview
            brands={brands}
            brandId={activeBrand}
            previewTheme={previewTheme}
            size={s}
            orientation={row.orientation}
            fullWidth={selectedFullWidth}
            state={selectedState === "default" ? undefined : selectedState}
          />
        )}
      />
    </div>
  );
}

export function SegmentedControlPropertiesPanel({
  activeSegmentedControlSize,
  setActiveSegmentedControlSize,
  sizeKeys,
  selectedOrientation,
  setSelectedOrientation,
  selectedFullWidth,
  setSelectedFullWidth,
  selectedState,
  setSelectedState,
  forcedState,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow
        label="Size"
        value={activeSegmentedControlSize}
        onChange={setActiveSegmentedControlSize}
        options={sizeKeys}
      />
      <PropertyRow
        label="Orientation"
        value={selectedOrientation}
        onChange={setSelectedOrientation}
        options={SEGMENTED_CONTROL_ORIENTATIONS}
      />
      <PropertyRow
        label="Full Width"
        value={selectedFullWidth ? "on" : "off"}
        onChange={(v) => setSelectedFullWidth(v === "on")}
        options={["off", "on"]}
      />
      <PropertyRow
        label="State"
        value={selectedState}
        onChange={setSelectedState}
        options={SEGMENTED_CONTROL_STATES}
        disabled={Boolean(forcedState)}
      />
    </div>
  );
}

export default function SegmentedControlPreviewPanel(props) {
  return (
    <div>
      <SegmentedControlPropertiesPanel
        activeSegmentedControlSize={props.activeSegmentedControlSize}
        setActiveSegmentedControlSize={props.setActiveSegmentedControlSize}
        sizeKeys={props.sizeKeys}
        selectedOrientation={props.selectedOrientation}
        setSelectedOrientation={props.setSelectedOrientation}
        selectedFullWidth={props.selectedFullWidth}
        setSelectedFullWidth={props.setSelectedFullWidth}
        selectedState={props.selectedState}
        setSelectedState={props.setSelectedState}
        forcedState={props.forcedState}
      />
      <div style={{ marginTop: 24 }}>
        <SegmentedControlPreviewContent
          brands={props.brands}
          activeBrand={props.activeBrand}
          previewTheme={props.previewTheme}
          activeSegmentedControlSize={props.activeSegmentedControlSize}
          sizeKeys={props.sizeKeys}
          activeColorToken={props.activeColorToken}
          selectedOrientation={props.selectedOrientation}
          selectedFullWidth={props.selectedFullWidth}
          selectedState={props.selectedState}
        />
      </div>
    </div>
  );
}
