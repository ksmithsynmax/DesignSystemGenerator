import MenuPreview from "../previews/MenuPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

const MENU_STATES = ["default", "hover", "disabled"];
const MENU_SIZE_OPTIONS = ["default", "xs", "sm", "md", "lg", "xl"];

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

export function MenuPreviewContent({
  brands,
  activeBrand,
  size,
  radiusSize,
  state,
  withSection,
  withIcons,
}) {
  const rows = MENU_STATES.map((menuState) => ({ label: menuState, menuState }));

  return (
    <div>
      <PreviewStage padding={60}>
        <MenuPreview
          brands={brands}
          brandId={activeBrand}
          size={size}
          radiusSize={radiusSize}
          state={state}
          withSection={withSection}
          withIcons={withIcons}
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>State Matrix</SectionLabel>
      <PreviewMatrix
        sizeKeys={["icons on", "icons off"]}
        rows={rows}
        renderCell={(row, iconMode) => (
          <div style={{ padding: "18px 10px" }}>
            <MenuPreview
              brands={brands}
              brandId={activeBrand}
              size={size}
              radiusSize={radiusSize}
              state={row.menuState}
              withSection={withSection}
              withIcons={iconMode === "icons on"}
            />
          </div>
        )}
      />
    </div>
  );
}

export function MenuPropertiesPanel({
  size,
  setSize,
  radiusSize,
  setRadiusSize,
  state,
  setState,
  withSection,
  setWithSection,
  withIcons,
  setWithIcons,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow label="Size" value={size} onChange={setSize} options={MENU_SIZE_OPTIONS} />
      <PropertyRow label="Radius" value={radiusSize} onChange={setRadiusSize} options={MENU_SIZE_OPTIONS} />
      <PropertyRow label="State" value={state} onChange={setState} options={MENU_STATES} />
      <PropertyRow
        label="Section Label"
        value={withSection ? "on" : "off"}
        onChange={(v) => setWithSection(v === "on")}
        options={["on", "off"]}
      />
      <PropertyRow
        label="Icons"
        value={withIcons ? "on" : "off"}
        onChange={(v) => setWithIcons(v === "on")}
        options={["on", "off"]}
      />
    </div>
  );
}
