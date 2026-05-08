import { useState } from "react";
import ButtonPreview from "../previews/ButtonPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

const BUTTON_VARIANTS = ["filled", "outlined", "ghost"];
const BUTTON_COLORS = ["primary", "error"];
const BUTTON_STATES = ["default", "hover", "focus", "pressed", "disabled"];
const ON_OFF_OPTIONS = ["off", "on"];
const FOCUS_RING_STYLE_OPTIONS = ["offset", "attached"];
const BUTTON_VARIANT_LABELS = {
  filled: "filled",
  outlined: "outlined",
  ghost: "transparent",
};

function buttonVariantLabel(value) {
  return BUTTON_VARIANT_LABELS[value] || value;
}

function PropertyRow({ label, value, onChange, options, disabled = false, optionLabel = (opt) => opt }) {
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
            {optionLabel(opt)}
          </option>
        ))}
      </select>
    </div>
  );
}

function VariantBuildRow({ options, selectedOptions, onToggle, optionLabel = (opt) => opt }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <SectionLabel mb={0}>Build Variants</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map((opt) => {
          const active = selectedOptions.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              style={{
                border: "1px solid #373A40",
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "monospace",
                textTransform: "capitalize",
                cursor: "pointer",
                color: active ? "#E9ECEF" : "#909296",
                background: active ? "#2C2E33" : "#25262B",
              }}
            >
              {optionLabel(opt)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ButtonPreviewContent({
  brands,
  activeBrand,
  activeVariant,
  activeSize,
  activeColor = "primary",
  previewTheme = "light",
  selectedState,
  activeColorToken,
  sizeKeys,
  focusRingStyle,
  showLeftIcon,
  showRightIcon,
  fillGradientCss = null,
}) {
  const matrixRows = BUTTON_VARIANTS.map((v) => ({ label: buttonVariantLabel(v), variant: v }));
  return (
    <div>
      <PreviewStage label={activeColorToken}>
        <ButtonPreview
          brands={brands}
          brandId={activeBrand}
          variant={activeVariant}
          color={activeColor}
          size={activeSize}
          previewTheme={previewTheme}
          state={selectedState === "default" ? undefined : selectedState}
          focusRingStyle={focusRingStyle}
          showLeftIcon={showLeftIcon}
          showRightIcon={showRightIcon}
          fillGradientCss={activeVariant === "filled" ? fillGradientCss : null}
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
            color={activeColor}
            size={s}
            previewTheme={previewTheme}
            focusRingStyle={focusRingStyle}
            showLeftIcon={showLeftIcon}
            showRightIcon={showRightIcon}
            fillGradientCss={row.variant === "filled" ? fillGradientCss : null}
          />
        )}
      />
    </div>
  );
}

export function ButtonPropertiesPanel({
  activeVariant,
  setActiveVariant,
  activeColor,
  setActiveColor,
  activeSize,
  setActiveSize,
  sizeKeys,
  focusRingStyle,
  setFocusRingStyle,
  selectedState,
  setSelectedState,
  forcedState,
  showLeftIcon,
  setShowLeftIcon,
  showRightIcon,
  setShowRightIcon,
  buildVariants = BUTTON_VARIANTS,
  setBuildVariants = () => {},
  fillGradientId = null,
  setFillGradientId = () => {},
  gradientIds = [],
}) {
  const buttonSizeOptions = sizeKeys.includes("default") ? sizeKeys : ["default", ...sizeKeys];
  const toggleBuildVariant = (variant) => {
    if (buildVariants.includes(variant)) {
      if (buildVariants.length <= 1) return;
      setBuildVariants(buildVariants.filter((v) => v !== variant));
      return;
    }
    setBuildVariants([...buildVariants, variant]);
  };
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow
        label="Variant"
        value={activeVariant}
        onChange={setActiveVariant}
        options={BUTTON_VARIANTS}
        optionLabel={buttonVariantLabel}
      />
      <PropertyRow
        label="Color"
        value={activeColor}
        onChange={setActiveColor}
        options={BUTTON_COLORS}
      />
      {/* <VariantBuildRow
        options={BUTTON_VARIANTS}
        selectedOptions={buildVariants}
        onToggle={toggleBuildVariant}
        optionLabel={buttonVariantLabel}
      /> */}
      <PropertyRow label="Size" value={activeSize} onChange={setActiveSize} options={buttonSizeOptions} />
      <PropertyRow
        label="Filled background"
        value={fillGradientId || ""}
        onChange={(v) => setFillGradientId(v ? v : null)}
        options={["", ...gradientIds]}
        disabled={activeVariant !== "filled"}
        optionLabel={(opt) => (opt === "" ? "Solid (tokens)" : opt)}
      />
      {selectedState === "focus" && (
        <PropertyRow
          label="Focus Ring Style"
          value={focusRingStyle}
          onChange={setFocusRingStyle}
          options={FOCUS_RING_STYLE_OPTIONS}
        />
      )}
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
        activeColor={props.activeColor}
        setActiveSize={props.setActiveSize}
        setActiveColor={props.setActiveColor}
        sizeKeys={props.sizeKeys}
        focusRingStyle={props.focusRingStyle}
        setFocusRingStyle={props.setFocusRingStyle}
        selectedState={selectedState}
        setSelectedState={setActiveState}
        forcedState={props.forcedState}
        showLeftIcon={props.showLeftIcon}
        setShowLeftIcon={props.setShowLeftIcon}
        showRightIcon={props.showRightIcon}
        setShowRightIcon={props.setShowRightIcon}
        fillGradientId={props.fillGradientId ?? null}
        setFillGradientId={props.setFillGradientId ?? (() => {})}
        gradientIds={props.gradientIds ?? []}
      />
      <div style={{ marginTop: 24 }}>
        <ButtonPreviewContent
          brands={props.brands}
          activeBrand={props.activeBrand}
          activeVariant={props.activeVariant}
          activeSize={props.activeSize}
          activeColor={props.activeColor}
          selectedState={selectedState}
          activeColorToken={props.activeColorToken}
          sizeKeys={props.sizeKeys.includes("default") ? props.sizeKeys : ["default", ...props.sizeKeys]}
          focusRingStyle={props.focusRingStyle}
          showLeftIcon={props.showLeftIcon}
          showRightIcon={props.showRightIcon}
          fillGradientCss={props.fillGradientCss ?? null}
        />
      </div>
    </div>
  );
}
