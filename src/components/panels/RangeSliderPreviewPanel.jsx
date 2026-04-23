import RangeSliderPreview from "../previews/RangeSliderPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

export const RANGESLIDER_STATES = ["default", "focus", "disabled"];
export const RANGESLIDER_RADIUS_KEYS = ["default", "xs", "sm", "md", "lg", "xl"];

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

export function RangeSliderPreviewContent({
  brands,
  activeBrand,
  activeRangeSliderSize,
  activeRangeSliderRadius,
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
        <RangeSliderPreview
          brands={brands}
          brandId={activeBrand}
          size={activeRangeSliderSize}
          radius={activeRangeSliderRadius}
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
          <RangeSliderPreview
            brands={brands}
            brandId={activeBrand}
            size={s}
            radius={activeRangeSliderRadius}
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

export function RangeSliderPropertiesPanel({
  activeRangeSliderSize,
  setActiveRangeSliderSize,
  activeRangeSliderRadius,
  setActiveRangeSliderRadius,
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
      <PropertyRow
        label="Size"
        value={activeRangeSliderSize}
        onChange={setActiveRangeSliderSize}
        options={sizeKeys}
      />
      <PropertyRow
        label="Radius"
        value={activeRangeSliderRadius}
        onChange={setActiveRangeSliderRadius}
        options={RANGESLIDER_RADIUS_KEYS}
      />
      <PropertyRow
        label="State"
        value={selectedState}
        onChange={setSelectedState}
        options={RANGESLIDER_STATES}
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
        label="Range"
        value={`${value[0]}-${value[1]}`}
        onChange={(v) => {
          const [from, to] = v.split("-").map((item) => Number(item));
          setValue([from, to]);
        }}
        options={["10-40", "20-60", "30-70", "40-80"]}
      />
    </div>
  );
}
