import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import DenseTablePreview from "../previews/DenseTablePreview";

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

export function DenseTablePreviewContent({
  brands,
  activeBrand,
  activeColorToken,
  previewTheme,
  showAction,
  showRowHover,
  showRowActive,
}) {
  return (
    <div>
      <PreviewStage label={activeColorToken}>
        <DenseTablePreview
          brands={brands}
          brandId={activeBrand}
          previewTheme={previewTheme}
          showAction={showAction}
          showRowHover={showRowHover}
          showRowActive={showRowActive}
        />
      </PreviewStage>
    </div>
  );
}

export function DenseTablePropertiesPanel({
  showAction,
  setShowAction,
  showRowHover,
  setShowRowHover,
  showRowActive,
  setShowRowActive,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow
        label="Action column"
        value={showAction ? "on" : "off"}
        onChange={(v) => setShowAction(v === "on")}
        options={["off", "on"]}
      />
      <PropertyRow
        label="Row hover"
        value={showRowHover ? "on" : "off"}
        onChange={(v) => setShowRowHover(v === "on")}
        options={["off", "on"]}
      />
      <PropertyRow
        label="Row active"
        value={showRowActive ? "on" : "off"}
        onChange={(v) => setShowRowActive(v === "on")}
        options={["off", "on"]}
      />
    </div>
  );
}
