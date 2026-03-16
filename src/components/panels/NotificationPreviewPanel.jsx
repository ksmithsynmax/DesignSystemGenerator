import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";
import NotificationPreview from "../previews/NotificationPreview";

export const NOTIFICATION_RADIUS_KEYS = ["xs", "sm", "md", "lg", "xl"];
export const NOTIFICATION_COLORS = ["blue", "teal", "red", "yellow", "gray"];

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

export function NotificationPreviewContent({
  brands,
  activeBrand,
  activeColorToken,
  radius,
  color,
  title,
  description,
  withBorder,
  withCloseButton,
  withIcon,
  loading,
}) {
  const matrixRows = NOTIFICATION_COLORS.map((rowColor) => ({ label: rowColor, rowColor }));
  return (
    <div>
      <PreviewStage label={activeColorToken}>
        <NotificationPreview
          brands={brands}
          brandId={activeBrand}
          radius={radius}
          color={color}
          title={title}
          description={description}
          withBorder={withBorder}
          withCloseButton={withCloseButton}
          withIcon={withIcon}
          loading={loading}
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Colors</SectionLabel>
      <PreviewMatrix
        sizeKeys={["default", "with icon"]}
        rows={matrixRows}
        renderCell={(row, col) => (
          <NotificationPreview
            brands={brands}
            brandId={activeBrand}
            radius={radius}
            color={row.rowColor}
            withBorder={withBorder}
            withCloseButton={withCloseButton}
            withIcon={col === "with icon"}
            loading={false}
          />
        )}
      />
    </div>
  );
}

export function NotificationPropertiesPanel({
  radius,
  setRadius,
  color,
  setColor,
  withBorder,
  setWithBorder,
  withCloseButton,
  setWithCloseButton,
  withIcon,
  setWithIcon,
  loading,
  setLoading,
  title,
  setTitle,
  description,
  setDescription,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow label="Color" value={color} onChange={setColor} options={NOTIFICATION_COLORS} />
      <PropertyRow label="Radius" value={radius} onChange={setRadius} options={NOTIFICATION_RADIUS_KEYS} />
      <PropertyRow
        label="Border"
        value={withBorder ? "on" : "off"}
        onChange={(v) => setWithBorder(v === "on")}
        options={["off", "on"]}
      />
      <PropertyRow
        label="Close Button"
        value={withCloseButton ? "on" : "off"}
        onChange={(v) => setWithCloseButton(v === "on")}
        options={["off", "on"]}
      />
      <PropertyRow
        label="Icon"
        value={withIcon ? "on" : "off"}
        onChange={(v) => setWithIcon(v === "on")}
        options={["off", "on"]}
      />
      <PropertyRow
        label="Loading"
        value={loading ? "on" : "off"}
        onChange={(v) => setLoading(v === "on")}
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
