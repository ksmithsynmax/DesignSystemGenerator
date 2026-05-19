import ListPreview from "../previews/ListPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

const LIST_SIZE_OPTIONS = ["default", "xs", "sm", "md", "lg", "xl"];
const LIST_TYPE_OPTIONS = ["unordered", "ordered"];

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

export function ListPreviewContent({
  brands,
  activeBrand,
  size,
  type,
  withIcons,
  withPadding,
}) {
  const rows = LIST_TYPE_OPTIONS.map((listType) => ({ label: listType, listType }));

  return (
    <div>
      <PreviewStage padding={60}>
        <ListPreview
          brands={brands}
          brandId={activeBrand}
          size={size}
          type={type}
          withIcons={withIcons}
          withPadding={withPadding}
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>Type x Icons</SectionLabel>
      <PreviewMatrix
        sizeKeys={["icons on", "icons off"]}
        rows={rows}
        renderCell={(row, iconMode) => (
          <div style={{ padding: "20px 10px" }}>
            <ListPreview
              brands={brands}
              brandId={activeBrand}
              size={size}
              type={row.listType}
              withIcons={iconMode === "icons on"}
              withPadding={withPadding}
            />
          </div>
        )}
      />
    </div>
  );
}

export function ListPropertiesPanel({
  size,
  setSize,
  type,
  setType,
  withIcons,
  setWithIcons,
  withPadding,
  setWithPadding,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow label="Size" value={size} onChange={setSize} options={LIST_SIZE_OPTIONS} />
      <PropertyRow label="Type" value={type} onChange={setType} options={LIST_TYPE_OPTIONS} />
      <PropertyRow
        label="Icons"
        value={withIcons ? "on" : "off"}
        onChange={(v) => setWithIcons(v === "on")}
        options={["on", "off"]}
      />
      <PropertyRow
        label="With padding"
        value={withPadding ? "on" : "off"}
        onChange={(v) => setWithPadding(v === "on")}
        options={["off", "on"]}
      />
    </div>
  );
}
