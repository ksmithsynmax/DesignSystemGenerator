import CardPreview from "../previews/CardPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

export const CARD_SIZE_KEYS = ["xs", "sm", "md", "lg", "xl"];
export const CARD_RADIUS_KEYS = ["xs", "sm", "md", "lg", "xl"];

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

export function CardPreviewContent({
  brands,
  activeBrand,
  activeColorToken,
  size,
  radius,
  withBorder,
  withShadow,
  showSection,
  showBadge,
  title,
  description,
}) {
  const rows = [
    { label: "border / no shadow", withBorder: true, withShadow: false },
    { label: "border / shadow", withBorder: true, withShadow: true },
    { label: "no border / no shadow", withBorder: false, withShadow: false },
    { label: "no border / shadow", withBorder: false, withShadow: true },
  ];

  return (
    <div>
      <PreviewStage label={activeColorToken}>
        <CardPreview
          brands={brands}
          brandId={activeBrand}
          size={size}
          radius={radius}
          withBorder={withBorder}
          withShadow={withShadow}
          showSection={showSection}
          showBadge={showBadge}
          title={title}
          description={description}
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Sizes x Border/Shadow</SectionLabel>
      <PreviewMatrix
        sizeKeys={CARD_SIZE_KEYS}
        rows={rows}
        renderCell={(row, s) => (
          <CardPreview
            brands={brands}
            brandId={activeBrand}
            size={s}
            radius={radius}
            withBorder={row.withBorder}
            withShadow={row.withShadow}
            showSection={showSection}
            showBadge={showBadge}
            title="Card title"
            description="Card content preview."
          />
        )}
      />
    </div>
  );
}

export function CardPropertiesPanel({
  size,
  setSize,
  radius,
  setRadius,
  withBorder,
  setWithBorder,
  withShadow,
  setWithShadow,
  showSection,
  setShowSection,
  showBadge,
  setShowBadge,
  title,
  setTitle,
  description,
  setDescription,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow label="Size" value={size} onChange={setSize} options={CARD_SIZE_KEYS} />
      <PropertyRow label="Radius" value={radius} onChange={setRadius} options={CARD_RADIUS_KEYS} />
      <PropertyRow
        label="Border"
        value={withBorder ? "on" : "off"}
        onChange={(v) => setWithBorder(v === "on")}
        options={["off", "on"]}
      />
      <PropertyRow
        label="Shadow"
        value={withShadow ? "on" : "off"}
        onChange={(v) => setWithShadow(v === "on")}
        options={["off", "on"]}
      />
      <PropertyRow
        label="Section"
        value={showSection ? "on" : "off"}
        onChange={(v) => setShowSection(v === "on")}
        options={["off", "on"]}
      />
      <PropertyRow
        label="Badge"
        value={showBadge ? "on" : "off"}
        onChange={(v) => setShowBadge(v === "on")}
        options={["off", "on"]}
      />
      <div>
        <SectionLabel mb={6}>Title</SectionLabel>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={textFieldStyle} />
      </div>
      <div>
        <SectionLabel mb={6}>Description</SectionLabel>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={textFieldStyle}
        />
      </div>
    </div>
  );
}
