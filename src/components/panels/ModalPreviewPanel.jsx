import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";
import ModalPreview from "../previews/ModalPreview";

export const MODAL_SIZE_OPTIONS = ["default", "xs", "sm", "md", "lg", "xl"];
export const MODAL_RADIUS_OPTIONS = ["default", "xs", "sm", "md", "lg", "xl"];
export const MODAL_VARIANT_OPTIONS = ["default", "filled"];
export const MODAL_LAYOUT_OPTIONS = ["basic", "actions-right", "centered-ack", "centered-action"];

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

export function ModalPreviewContent({
  brands,
  activeBrand,
  activeColorToken,
  variant,
  size,
  radius,
  layout,
  withOverlay,
  withCloseButton,
  centered,
  showSectionDividers,
  dividerInset,
  title,
  body,
}) {
  const rows = [
    { label: "overlay off", withOverlay: false },
    { label: "overlay on", withOverlay: true },
  ];

  return (
    <div>
      <PreviewStage label={activeColorToken} padding={32}>
        <ModalPreview
          brands={brands}
          brandId={activeBrand}
          variant={variant}
          size={size}
          radius={radius}
          layout={layout}
          withOverlay={withOverlay}
          withCloseButton={withCloseButton}
          centered={centered}
          showSectionDividers={showSectionDividers}
          dividerInset={dividerInset}
          title={title}
          body={body}
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Sizes</SectionLabel>
      <PreviewMatrix
        sizeKeys={MODAL_SIZE_OPTIONS}
        rows={rows}
        renderCell={(row, s) => (
          <ModalPreview
            brands={brands}
            brandId={activeBrand}
            variant={variant}
            size={s}
            radius={radius}
            layout={layout}
            withOverlay={row.withOverlay}
            withCloseButton={withCloseButton}
            centered={centered}
            showSectionDividers={showSectionDividers}
            dividerInset={dividerInset}
            title={title}
            body={body}
          />
        )}
      />
    </div>
  );
}

export function ModalPropertiesPanel({
  variant,
  setVariant,
  size,
  setSize,
  radius,
  setRadius,
  layout,
  setLayout,
  withOverlay,
  setWithOverlay,
  withCloseButton,
  setWithCloseButton,
  centered,
  setCentered,
  showSectionDividers,
  setShowSectionDividers,
  dividerInset,
  setDividerInset,
  title,
  setTitle,
  body,
  setBody,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow label="Variant" value={variant} onChange={setVariant} options={MODAL_VARIANT_OPTIONS} />
      <PropertyRow label="Size" value={size} onChange={setSize} options={MODAL_SIZE_OPTIONS} />
      <PropertyRow label="Radius" value={radius} onChange={setRadius} options={MODAL_RADIUS_OPTIONS} />
      <PropertyRow label="Layout" value={layout} onChange={setLayout} options={MODAL_LAYOUT_OPTIONS} />
      <PropertyRow
        label="Overlay"
        value={withOverlay ? "on" : "off"}
        onChange={(v) => setWithOverlay(v === "on")}
        options={["off", "on"]}
      />
      <PropertyRow
        label="Close Button"
        value={withCloseButton ? "on" : "off"}
        onChange={(v) => setWithCloseButton(v === "on")}
        options={["off", "on"]}
      />
      <PropertyRow
        label="Centered"
        value={centered ? "on" : "off"}
        onChange={(v) => setCentered(v === "on")}
        options={["off", "on"]}
      />
      <PropertyRow
        label="Dividers"
        value={showSectionDividers ? "on" : "off"}
        onChange={(v) => setShowSectionDividers(v === "on")}
        options={["off", "on"]}
        disabled={layout !== "centered-ack" && layout !== "centered-action"}
      />
      <PropertyRow
        label="Divider Width"
        value={dividerInset ? "inset" : "full"}
        onChange={(v) => setDividerInset(v === "inset")}
        options={["full", "inset"]}
        disabled={
          !showSectionDividers ||
          (layout !== "centered-ack" && layout !== "centered-action")
        }
      />
      <div>
        <SectionLabel mb={6}>Title</SectionLabel>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={textFieldStyle} />
      </div>
      <div>
        <SectionLabel mb={6}>Body</SectionLabel>
        <input type="text" value={body} onChange={(e) => setBody(e.target.value)} style={textFieldStyle} />
      </div>
    </div>
  );
}
