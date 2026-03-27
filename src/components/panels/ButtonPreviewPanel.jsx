import { useState } from "react";
import ButtonPreview from "../previews/ButtonPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

const BUTTON_VARIANTS = ["filled", "outlined", "ghost"];
const BUTTON_STATES = ["default", "hover", "focus", "pressed", "disabled"];
const ON_OFF_OPTIONS = ["off", "on"];

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

export function ButtonPreviewContent({
  brands,
  activeBrand,
  activeVariant,
  activeSize,
  selectedState,
  activeColorToken,
  sizeKeys,
  showLeftIcon,
  showRightIcon,
}) {
  const matrixRows = BUTTON_VARIANTS.map((v) => ({ label: v, variant: v }));
  return (
    <div>
      <PreviewStage label={activeColorToken}>
        <ButtonPreview
          brands={brands}
          brandId={activeBrand}
          variant={activeVariant}
          size={activeSize}
          state={selectedState === "default" ? undefined : selectedState}
          showLeftIcon={showLeftIcon}
          showRightIcon={showRightIcon}
        />
      </PreviewStage>
      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Variants x Sizes</SectionLabel>
      <PreviewMatrix
        sizeKeys={sizeKeys}
        rows={matrixRows}
        renderCell={(row, s) => (
          <ButtonPreview
            brands={brands}
            brandId={activeBrand}
            variant={row.variant}
            size={s}
            showLeftIcon={showLeftIcon}
            showRightIcon={showRightIcon}
          />
        )}
      />
    </div>
  );
}

export function ButtonPropertiesPanel({
  activeVariant,
  setActiveVariant,
  activeSize,
  setActiveSize,
  sizeKeys,
  selectedState,
  setSelectedState,
  forcedState,
  showLeftIcon,
  setShowLeftIcon,
  showRightIcon,
  setShowRightIcon,
}) {
  const buttonSizeOptions = sizeKeys.includes("default") ? sizeKeys : ["default", ...sizeKeys];
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow label="Variant" value={activeVariant} onChange={setActiveVariant} options={BUTTON_VARIANTS} />
      <PropertyRow label="Size" value={activeSize} onChange={setActiveSize} options={buttonSizeOptions} />
      <PropertyRow
        label="Left Icon"
        value={showLeftIcon ? "on" : "off"}
        onChange={(value) => setShowLeftIcon(value === "on")}
        options={ON_OFF_OPTIONS}
      />
      <PropertyRow
        label="Right Icon"
        value={showRightIcon ? "on" : "off"}
        onChange={(value) => setShowRightIcon(value === "on")}
        options={ON_OFF_OPTIONS}
      />
      <PropertyRow
        label="State"
        value={selectedState}
        onChange={setSelectedState}
        options={BUTTON_STATES}
        disabled={Boolean(forcedState)}
      />
    </div>
  );
}

export default function ButtonPreviewPanel(props) {
  const [activeState, setActiveState] = useState("default");
  const selectedState = props.forcedState || activeState;
  return (
    <div>
      <ButtonPropertiesPanel
        activeVariant={props.activeVariant}
        setActiveVariant={props.setActiveVariant}
        activeSize={props.activeSize}
        setActiveSize={props.setActiveSize}
        sizeKeys={props.sizeKeys}
        selectedState={selectedState}
        setSelectedState={setActiveState}
        forcedState={props.forcedState}
        showLeftIcon={props.showLeftIcon}
        setShowLeftIcon={props.setShowLeftIcon}
        showRightIcon={props.showRightIcon}
        setShowRightIcon={props.setShowRightIcon}
      />
      <div style={{ marginTop: 24 }}>
        <ButtonPreviewContent
          brands={props.brands}
          activeBrand={props.activeBrand}
          activeVariant={props.activeVariant}
          activeSize={props.activeSize}
          selectedState={selectedState}
          activeColorToken={props.activeColorToken}
          sizeKeys={props.sizeKeys.includes("default") ? props.sizeKeys : ["default", ...props.sizeKeys]}
          showLeftIcon={props.showLeftIcon}
          showRightIcon={props.showRightIcon}
        />
      </div>
    </div>
  );
}
