import AlertPreview from "../previews/AlertPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

export const ALERT_VARIANTS = [
  "default",
  "filled",
  // "light",
  "outline",
  // "transparent",
  // "white",
];
export const ALERT_RADIUS_KEYS = ["default", "xs", "sm", "md", "lg", "xl"];
// Alert color is semantic status, not a raw palette hue — each maps to a
// feedback-* semantic token so it themes per brand/appearance.
export const ALERT_COLORS = ["info", "success", "warning", "error"];

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

export function AlertPreviewContent({
  brands,
  activeBrand,
  activeColorToken,
  variant,
  color,
  radius,
  withCloseButton,
  withIcon,
  title,
  message,
}) {
  const matrixRows = ALERT_VARIANTS.map((rowVariant) => ({ label: rowVariant, rowVariant }));

  return (
    <div>
      <PreviewStage label={activeColorToken}>
        <AlertPreview
          brands={brands}
          brandId={activeBrand}
          variant={variant}
          color={color}
          radius={radius}
          withCloseButton={withCloseButton}
          withIcon={withIcon}
          title={title}
          message={message}
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Variants</SectionLabel>
      <PreviewMatrix
        sizeKeys={["no icon", "with icon"]}
        rows={matrixRows}
        renderCell={(row, col) => (
          <AlertPreview
            brands={brands}
            brandId={activeBrand}
            variant={row.rowVariant}
            color={color}
            radius={radius}
            withCloseButton={false}
            withIcon={col === "with icon"}
            title="Alert title"
            message="Alert message"
          />
        )}
      />
    </div>
  );
}

export function AlertPropertiesPanel({
  variant,
  setVariant,
  color,
  setColor,
  colorOptions,
  radius,
  setRadius,
  withCloseButton,
  setWithCloseButton,
  withIcon,
  setWithIcon,
  title,
  setTitle,
  message,
  setMessage,
}) {
  const resolvedColorOptions = colorOptions && colorOptions.length > 0 ? colorOptions : ALERT_COLORS;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow label="Variant" value={variant} onChange={setVariant} options={ALERT_VARIANTS} />
      <PropertyRow label="Color" value={color} onChange={setColor} options={resolvedColorOptions} />
      <PropertyRow label="Radius" value={radius} onChange={setRadius} options={ALERT_RADIUS_KEYS} />
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
      <div>
        <SectionLabel mb={6}>Title</SectionLabel>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={textFieldStyle} />
      </div>
      <div>
        <SectionLabel mb={6}>Message</SectionLabel>
        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} style={textFieldStyle} />
      </div>
    </div>
  );
}
