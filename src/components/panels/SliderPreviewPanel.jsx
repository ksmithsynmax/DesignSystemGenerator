import SliderPreview from "../previews/SliderPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

export const SLIDER_STATES = ["default", "focus", "disabled"];
export const SLIDER_RADIUS_KEYS = ["xs", "sm", "md", "lg", "xl"];

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

export function SliderPreviewContent({
  brands,
  activeBrand,
  activeSliderSize,
  activeSliderRadius,
  sizeKeys,
  activeColorToken,
  selectedState,
  showMarks,
  value,
  labelMode,
}) {
  const matrixRows = [
    { label: "no marks", withMarks: false },
    { label: "with marks", withMarks: true },
  ];

  return (
    <div>
      <PreviewStage label={activeColorToken}>
        <SliderPreview
          brands={brands}
          brandId={activeBrand}
          size={activeSliderSize}
          radius={activeSliderRadius}
          state={selectedState === "default" ? undefined : selectedState}
          showMarks={showMarks}
          value={value}
          labelMode={labelMode}
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Sizes x Marks</SectionLabel>
      <PreviewMatrix
        sizeKeys={sizeKeys}
        rows={matrixRows}
        renderCell={(row, s) => (
          <SliderPreview
            brands={brands}
            brandId={activeBrand}
            size={s}
            radius={activeSliderRadius}
            state={selectedState === "default" ? undefined : selectedState}
            showMarks={row.withMarks}
            value={value}
            labelMode={labelMode}
          />
        )}
      />
    </div>
  );
}

export function SliderPropertiesPanel({
  activeSliderSize,
  setActiveSliderSize,
  activeSliderRadius,
  setActiveSliderRadius,
  sizeKeys,
  selectedState,
  setSelectedState,
  showMarks,
  setShowMarks,
  value,
  setValue,
  labelMode,
  setLabelMode,
  forcedState,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow label="Size" value={activeSliderSize} onChange={setActiveSliderSize} options={sizeKeys} />
      <PropertyRow
        label="Radius"
        value={activeSliderRadius}
        onChange={setActiveSliderRadius}
        options={SLIDER_RADIUS_KEYS}
      />
      <PropertyRow
        label="State"
        value={selectedState}
        onChange={setSelectedState}
        options={SLIDER_STATES}
        disabled={Boolean(forcedState)}
      />
      <PropertyRow
        label="Marks"
        value={showMarks ? "on" : "off"}
        onChange={(v) => setShowMarks(v === "on")}
        options={["on", "off"]}
      />
      <PropertyRow
        label="Label"
        value={labelMode}
        onChange={setLabelMode}
        options={["hover", "always", "off"]}
      />
      <PropertyRow
        label="Value"
        value={String(value)}
        onChange={(v) => setValue(Number(v))}
        options={["20", "40", "60", "80"]}
      />
    </div>
  );
}
