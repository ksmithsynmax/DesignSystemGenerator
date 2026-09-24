import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";
import KeyValuePairPreview from "../previews/KeyValuePairPreview";

export const KEYVALUEPAIR_SIZE_OPTIONS = ["sm", "md", "lg"];

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

export function KeyValuePairPreviewContent({
  brands,
  activeBrand,
  activeColorToken,
  previewTheme,
  size,
  showIcon,
  keyText,
  valueText,
}) {
  const matrixRows = KEYVALUEPAIR_SIZE_OPTIONS.map((s) => ({ label: s, sizeValue: s }));
  return (
    <div>
      <PreviewStage label={activeColorToken}>
        <KeyValuePairPreview
          brands={brands}
          brandId={activeBrand}
          theme={previewTheme}
          size={size}
          showIcon={showIcon}
          keyText={keyText}
          valueText={valueText}
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Sizes</SectionLabel>
      <PreviewMatrix
        sizeKeys={[size]}
        rows={matrixRows}
        renderCell={(row) => (
          <KeyValuePairPreview
            brands={brands}
            brandId={activeBrand}
            theme={previewTheme}
            size={row.sizeValue}
            showIcon={showIcon}
            keyText={keyText}
            valueText={valueText}
          />
        )}
      />
    </div>
  );
}

export function KeyValuePairPropertiesPanel({
  size,
  setSize,
  showIcon,
  setShowIcon,
  keyText,
  setKeyText,
  valueText,
  setValueText,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow label="Size" value={size} onChange={setSize} options={KEYVALUEPAIR_SIZE_OPTIONS} />
      <PropertyRow
        label="Trailing icon"
        value={showIcon ? "on" : "off"}
        onChange={(v) => setShowIcon(v === "on")}
        options={["off", "on"]}
      />
      <div>
        <SectionLabel mb={6}>Key</SectionLabel>
        <input type="text" value={keyText} onChange={(e) => setKeyText(e.target.value)} style={textFieldStyle} />
      </div>
      <div>
        <SectionLabel mb={6}>Value</SectionLabel>
        <input type="text" value={valueText} onChange={(e) => setValueText(e.target.value)} style={textFieldStyle} />
      </div>
    </div>
  );
}
