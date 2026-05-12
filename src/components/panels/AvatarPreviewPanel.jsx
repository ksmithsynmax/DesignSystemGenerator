import AvatarPreview from "../previews/AvatarPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

export const AVATAR_SIZE_KEYS = ["default", "xs", "sm", "md", "lg", "xl"];

function PropertyRow({ label, value, onChange, options, formatOption }) {
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
            {formatOption ? formatOption(opt) : opt}
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

export function AvatarPreviewContent({
  brands,
  activeBrand,
  activeColorToken,
  previewTheme,
  size,
  radiusSize,
  name,
  src,
  usePhoto,
}) {
  const rows = AVATAR_SIZE_KEYS.map((s) => ({ label: s, sizeKey: s }));

  return (
    <div>
      <PreviewStage label={activeColorToken} padding={48}>
        <AvatarPreview
          brands={brands}
          brandId={activeBrand}
          size={size}
          radiusSize={radiusSize}
          name={name}
          src={src}
          usePhoto={usePhoto}
          previewTheme={previewTheme}
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>Size × radius</SectionLabel>
      <PreviewMatrix
        sizeKeys={AVATAR_SIZE_KEYS}
        rows={rows}
        renderCell={(row, r) => (
          <div style={{ padding: 16, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <AvatarPreview
              brands={brands}
              brandId={activeBrand}
              size={row.sizeKey}
              radiusSize={r}
              name="Jamie Lee"
              src={src}
              usePhoto={false}
              previewTheme={previewTheme}
            />
          </div>
        )}
      />
    </div>
  );
}

export function AvatarPropertiesPanel({
  size,
  setSize,
  radius,
  setRadius,
  name,
  setName,
  src,
  setSrc,
  usePhoto,
  setUsePhoto,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow
        label="Size"
        value={size}
        onChange={setSize}
        options={AVATAR_SIZE_KEYS}
        formatOption={(opt) => (opt === "default" ? "Default" : opt.toUpperCase())}
      />
      <PropertyRow
        label="Radius"
        value={radius}
        onChange={setRadius}
        options={AVATAR_SIZE_KEYS}
        formatOption={(opt) => (opt === "default" ? "Default" : opt.toUpperCase())}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <SectionLabel mb={0}>Name (initials)</SectionLabel>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={textFieldStyle}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <SectionLabel mb={0}>Image URL</SectionLabel>
        <input
          type="text"
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          style={textFieldStyle}
          disabled={!usePhoto}
        />
      </div>
      <PropertyRow
        label="Photo"
        value={usePhoto ? "on" : "off"}
        onChange={(v) => setUsePhoto(String(v) === "on")}
        options={["off", "on"]}
      />
    </div>
  );
}
