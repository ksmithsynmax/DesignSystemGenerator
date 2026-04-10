import { useState } from "react";
import ActionIconPreview from "../previews/ActionIconPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

export const ACTIONICON_VARIANTS = ["default", "filled", "light", "outlined", "transparent"];
export const ACTIONICON_RADIUS_KEYS = ["xs", "sm", "md", "lg", "xl"];
export const ACTIONICON_STATES = ["default", "hover", "focus", "pressed", "disabled"];
const ACTIONICON_ICONS = ["check", "minus"];
const FOCUS_RING_STYLE_OPTIONS = ["offset", "attached"];

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

function VariantBuildRow({ options, selectedOptions, onToggle }) {
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
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ActionIconPreviewContent({
  brands,
  activeBrand,
  activeVariant,
  activeActionIconSize,
  activeActionIconRadius,
  activeActionIconIcon,
  focusRingStyle,
  selectedState,
  activeColorToken,
  sizeKeys,
}) {
  const matrixRows = ACTIONICON_VARIANTS.map((variant) => ({ label: variant, variant }));
  const matrixSizeKeys = sizeKeys.includes("default") ? sizeKeys : ["default", ...sizeKeys];
  return (
    <div>
      <PreviewStage label={activeColorToken}>
        <ActionIconPreview
          brands={brands}
          brandId={activeBrand}
          variant={activeVariant}
          size={activeActionIconSize}
          radius={activeActionIconRadius}
          state={selectedState === "default" ? undefined : selectedState}
          focusRingStyle={focusRingStyle}
          iconName={activeActionIconIcon}
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Variants x Sizes</SectionLabel>
      <PreviewMatrix
        sizeKeys={matrixSizeKeys}
        rows={matrixRows}
        renderCell={(row, s) => (
          <ActionIconPreview
            brands={brands}
            brandId={activeBrand}
            variant={row.variant}
            size={s}
            radius={activeActionIconRadius}
            focusRingStyle={focusRingStyle}
            iconName={activeActionIconIcon}
          />
        )}
      />
    </div>
  );
}

export function ActionIconPropertiesPanel({
  activeVariant,
  setActiveVariant,
  activeActionIconSize,
  setActiveActionIconSize,
  activeActionIconRadius,
  setActiveActionIconRadius,
  activeActionIconIcon,
  setActiveActionIconIcon,
  focusRingStyle,
  setFocusRingStyle,
  sizeKeys,
  selectedState,
  setSelectedState,
  forcedState,
  buildVariants = ACTIONICON_VARIANTS,
  setBuildVariants = () => {},
}) {
  const actionIconSizeOptions = sizeKeys.includes("default") ? sizeKeys : ["default", ...sizeKeys];
  const actionIconRadiusOptions = ACTIONICON_RADIUS_KEYS.includes("default")
    ? ACTIONICON_RADIUS_KEYS
    : ["default", ...ACTIONICON_RADIUS_KEYS];
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
        options={ACTIONICON_VARIANTS}
      />
      {/* <VariantBuildRow
        options={ACTIONICON_VARIANTS}
        selectedOptions={buildVariants}
        onToggle={toggleBuildVariant}
      /> */}
      <PropertyRow
        label="Size"
        value={activeActionIconSize}
        onChange={setActiveActionIconSize}
        options={actionIconSizeOptions}
      />
      <PropertyRow
        label="Radius"
        value={activeActionIconRadius}
        onChange={setActiveActionIconRadius}
        options={actionIconRadiusOptions}
      />
      <PropertyRow
        label="Icon"
        value={activeActionIconIcon}
        onChange={setActiveActionIconIcon}
        options={ACTIONICON_ICONS}
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
        label="State"
        value={selectedState}
        onChange={setSelectedState}
        options={ACTIONICON_STATES}
        disabled={Boolean(forcedState)}
      />
    </div>
  );
}

export default function ActionIconPreviewPanel({
  brands,
  activeBrand,
  activeVariant,
  setActiveVariant,
  activeActionIconSize,
  setActiveActionIconSize,
  activeActionIconRadius,
  setActiveActionIconRadius,
  activeActionIconIcon,
  setActiveActionIconIcon,
  focusRingStyle,
  setFocusRingStyle,
  sizeKeys,
  forcedState,
  activeColorToken,
}) {
  const [activeState, setActiveState] = useState("default");
  const matrixRows = ACTIONICON_VARIANTS.map((variant) => ({ label: variant, variant }));
  const matrixSizeKeys = sizeKeys.includes("default") ? sizeKeys : ["default", ...sizeKeys];
  const selectedState = forcedState || activeState;

  return (
    <div>
      <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
        <ActionIconPropertiesPanel
          activeVariant={activeVariant}
          setActiveVariant={setActiveVariant}
          activeActionIconSize={activeActionIconSize}
          setActiveActionIconSize={setActiveActionIconSize}
          activeActionIconRadius={activeActionIconRadius}
          setActiveActionIconRadius={setActiveActionIconRadius}
          activeActionIconIcon={activeActionIconIcon}
          setActiveActionIconIcon={setActiveActionIconIcon}
          focusRingStyle={focusRingStyle}
          setFocusRingStyle={setFocusRingStyle}
          sizeKeys={sizeKeys}
          selectedState={selectedState}
          setSelectedState={setActiveState}
          forcedState={forcedState}
        />
      </div>

      <PreviewStage label={activeColorToken}>
        <ActionIconPreview
          brands={brands}
          brandId={activeBrand}
          variant={activeVariant}
          size={activeActionIconSize}
          radius={activeActionIconRadius}
          state={selectedState === "default" ? undefined : selectedState}
          focusRingStyle={focusRingStyle}
          iconName={activeActionIconIcon}
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Variants x Sizes</SectionLabel>
      <PreviewMatrix
        sizeKeys={matrixSizeKeys}
        rows={matrixRows}
        renderCell={(row, s) => (
          <ActionIconPreview
            brands={brands}
            brandId={activeBrand}
            variant={row.variant}
            size={s}
            radius={activeActionIconRadius}
            focusRingStyle={focusRingStyle}
            iconName={activeActionIconIcon}
          />
        )}
      />
    </div>
  );
}
