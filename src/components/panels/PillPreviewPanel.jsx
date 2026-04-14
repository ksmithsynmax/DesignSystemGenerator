import PillPreview from "../previews/PillPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

export const PILL_SIZE_KEYS = ["default", "xs", "sm", "md", "lg", "xl"];

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

export function PillPreviewContent({
  brands,
  activeBrand,
  activeColorToken,
  size,
  withRemoveButton,
  text,
}) {
  const rows = [
    { label: "without remove", withRemoveButton: false },
    { label: "with remove", withRemoveButton: true },
  ];

  return (
    <div>
      <PreviewStage label={activeColorToken} padding={56}>
        <PillPreview
          brands={brands}
          brandId={activeBrand}
          size={size}
          withRemoveButton={withRemoveButton}
          text={text}
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Sizes x Remove Mode</SectionLabel>
      <PreviewMatrix
        sizeKeys={PILL_SIZE_KEYS}
        rows={rows}
        renderCell={(row, s) => (
          <PillPreview
            brands={brands}
            brandId={activeBrand}
            size={s}
            withRemoveButton={row.withRemoveButton}
            text="React"
          />
        )}
      />
    </div>
  );
}

export function PillPropertiesPanel({
  size,
  setSize,
  withRemoveButton,
  setWithRemoveButton,
  text,
  setText,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow label="Size" value={size} onChange={setSize} options={PILL_SIZE_KEYS} />
      <PropertyRow
        label="Remove Button"
        value={withRemoveButton ? "on" : "off"}
        onChange={(v) => setWithRemoveButton(v === "on")}
        options={["off", "on"]}
      />
      <div>
        <SectionLabel mb={6}>Label</SectionLabel>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} style={textFieldStyle} />
      </div>
    </div>
  );
}
