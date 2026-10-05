import DividerPreview from "../previews/DividerPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

const DIVIDER_ORIENTATIONS = ["horizontal", "vertical"];
const DIVIDER_SIZE_OPTIONS = ["default", "xs", "sm", "md", "lg", "xl"];
const DIVIDER_COLORS = ["primary", "secondary", "subtle"];

function PropertyRow({ label, value, onChange, options }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <SectionLabel mb={0}>{label}</SectionLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "#25262B",
          color: "#E9ECEF",
          border: "1px solid #373A40",
          borderRadius: 6,
          padding: "6px 28px 6px 12px",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "monospace",
          outline: "none",
          cursor: "pointer",
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

export function DividerPreviewContent({
  brands,
  activeBrand,
  size,
  orientation,
  color,
  inset,
}) {
  const colorRows = DIVIDER_COLORS.map((dividerColor) => ({ label: dividerColor, dividerColor }));
  const sizeRows = DIVIDER_SIZE_OPTIONS.map((dividerSize) => ({ label: dividerSize, dividerSize }));

  return (
    <div>
      <PreviewStage padding={60}>
        <DividerPreview
          brands={brands}
          brandId={activeBrand}
          size={size}
          orientation={orientation}
          color={color}
          inset={inset}
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>Color</SectionLabel>
      <PreviewMatrix
        sizeKeys={["preview"]}
        rows={colorRows}
        renderCell={(row) => (
          <div style={{ padding: "22px 10px" }}>
            <DividerPreview
              brands={brands}
              brandId={activeBrand}
              size={size}
              orientation={orientation}
              color={row.dividerColor}
              inset={inset}
            />
          </div>
        )}
      />

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>Size x Inset</SectionLabel>
      <PreviewMatrix
        sizeKeys={["inset on", "inset off"]}
        rows={sizeRows}
        renderCell={(row, insetMode) => (
          <div style={{ padding: "22px 10px" }}>
            <DividerPreview
              brands={brands}
              brandId={activeBrand}
              size={row.dividerSize}
              orientation={orientation}
              color={color}
              inset={insetMode === "inset on"}
            />
          </div>
        )}
      />
    </div>
  );
}

export function DividerPropertiesPanel({
  size,
  setSize,
  orientation,
  setOrientation,
  color,
  setColor,
  inset,
  setInset,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow label="Color" value={color} onChange={setColor} options={DIVIDER_COLORS} />
      <PropertyRow label="Size" value={size} onChange={setSize} options={DIVIDER_SIZE_OPTIONS} />
      <PropertyRow label="Orientation" value={orientation} onChange={setOrientation} options={DIVIDER_ORIENTATIONS} />
      <PropertyRow
        label="Inset"
        value={inset ? "on" : "off"}
        onChange={(v) => setInset(v === "on")}
        options={["on", "off"]}
      />
    </div>
  );
}
