import TooltipPreview from "../previews/TooltipPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

export const TOOLTIP_POSITIONS = ["top", "bottom", "left", "right"];

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

export function TooltipPreviewContent({ brands, activeBrand, activePosition, withArrow }) {

  const matrixRows = TOOLTIP_POSITIONS.map((pos) => ({ label: pos, position: pos }));

  return (
    <div>
      <PreviewStage padding={60}>
        <TooltipPreview
          brands={brands}
          brandId={activeBrand}
          position={activePosition}
          withArrow={withArrow}
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Positions</SectionLabel>
      <PreviewMatrix
        sizeKeys={["with arrow", "without arrow"]}
        rows={matrixRows}
        renderCell={(row, arrowCol) => (
          <div style={{ padding: "20px 10px" }}>
            <TooltipPreview
              brands={brands}
              brandId={activeBrand}
              position={row.position}
              withArrow={arrowCol === "with arrow"}
            />
          </div>
        )}
      />

    </div>
  );
}

export function TooltipPropertiesPanel({
  activePosition,
  setActivePosition,
  withArrow,
  setWithArrow,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow
        label="Position"
        value={activePosition}
        onChange={setActivePosition}
        options={TOOLTIP_POSITIONS}
      />
      <PropertyRow
        label="Arrow"
        value={withArrow ? "on" : "off"}
        onChange={(v) => setWithArrow(v === "on")}
        options={["off", "on"]}
      />
    </div>
  );
}
