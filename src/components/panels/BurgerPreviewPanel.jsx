import BurgerPreview from "../previews/BurgerPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

export const BURGER_STATES = ["default", "hover", "focus", "disabled"];

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

export function BurgerPreviewContent({
  brands,
  activeBrand,
  previewTheme,
  activeBurgerSize,
  sizeKeys,
  activeColorToken,
  selectedOpened,
  selectedState,
}) {
  const matrixRows = [
    { label: "closed", opened: false },
    { label: "opened", opened: true },
  ];

  return (
    <div>
      <PreviewStage label={activeColorToken}>
        <BurgerPreview
          brands={brands}
          brandId={activeBrand}
          previewTheme={previewTheme}
          size={activeBurgerSize}
          opened={selectedOpened}
          readOnly
          state={selectedState === "default" ? undefined : selectedState}
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Sizes — Closed &amp; Opened States</SectionLabel>
      <PreviewMatrix
        sizeKeys={sizeKeys}
        rows={matrixRows}
        renderCell={(row, s) => (
          <BurgerPreview
            brands={brands}
            brandId={activeBrand}
            previewTheme={previewTheme}
            size={s}
            opened={row.opened}
            readOnly
            state={selectedState === "default" ? undefined : selectedState}
          />
        )}
      />
    </div>
  );
}

export function BurgerPropertiesPanel({
  activeBurgerSize,
  setActiveBurgerSize,
  sizeKeys,
  selectedOpened,
  setSelectedOpened,
  selectedState,
  setSelectedState,
  forcedState,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow
        label="Size"
        value={activeBurgerSize}
        onChange={setActiveBurgerSize}
        options={sizeKeys}
      />
      <PropertyRow
        label="Opened"
        value={selectedOpened ? "on" : "off"}
        onChange={(v) => setSelectedOpened(v === "on")}
        options={["off", "on"]}
      />
      <PropertyRow
        label="State"
        value={selectedState}
        onChange={setSelectedState}
        options={BURGER_STATES}
        disabled={Boolean(forcedState)}
      />
    </div>
  );
}

export default function BurgerPreviewPanel(props) {
  return (
    <div>
      <BurgerPropertiesPanel
        activeBurgerSize={props.activeBurgerSize}
        setActiveBurgerSize={props.setActiveBurgerSize}
        sizeKeys={props.sizeKeys}
        selectedOpened={props.selectedOpened}
        setSelectedOpened={props.setSelectedOpened}
        selectedState={props.selectedState}
        setSelectedState={props.setSelectedState}
        forcedState={props.forcedState}
      />
      <div style={{ marginTop: 24 }}>
        <BurgerPreviewContent
          brands={props.brands}
          activeBrand={props.activeBrand}
          previewTheme={props.previewTheme}
          activeBurgerSize={props.activeBurgerSize}
          sizeKeys={props.sizeKeys}
          activeColorToken={props.activeColorToken}
          selectedOpened={props.selectedOpened}
          selectedState={props.selectedState}
        />
      </div>
    </div>
  );
}
