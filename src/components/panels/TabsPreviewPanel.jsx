import TabsPreview from "../previews/TabsPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";
import { useState } from "react";

export const TABS_VARIANTS = ["default", "outlined", "pills"];
export const TABS_RADIUS_KEYS = ["xs", "sm", "md", "lg", "xl"];
export const TABS_ORIENTATION_KEYS = ["horizontal", "vertical"];
export const TABS_STATES = ["default", "active", "hover", "focus", "pressed", "disabled"];

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

export function TabsPreviewContent({
  brands,
  activeBrand,
  activeVariant,
  activeTabsRadius,
  activeTabsOrientation,
  selectedState,
  activeColorToken,
  showPanel,
  showIcons,
}) {
  const matrixRows = TABS_VARIANTS.map((v) => ({ label: v, variant: v }));
  return (
    <div>
      <PreviewStage
        label={activeColorToken}
        contentAlignItems="flex-start"
        contentJustifyContent="flex-start"
      >
        <TabsPreview
          brands={brands}
          brandId={activeBrand}
          variant={activeVariant}
          radius={activeTabsRadius}
          orientation={activeTabsOrientation}
          state={selectedState === "default" ? undefined : selectedState}
          showPanel={showPanel}
          showIcons={showIcons}
          interactive={false}
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Variants x Orientation</SectionLabel>
      <PreviewMatrix
        sizeKeys={TABS_ORIENTATION_KEYS}
        rows={matrixRows}
        renderCell={(row, orientation) => (
          <TabsPreview
            brands={brands}
            brandId={activeBrand}
            variant={row.variant}
            radius={activeTabsRadius}
            orientation={orientation}
            showPanel={showPanel}
            showIcons={showIcons}
            interactive={false}
          />
        )}
      />
    </div>
  );
}

export function TabsPropertiesPanel({
  activeVariant,
  setActiveVariant,
  activeTabsRadius,
  setActiveTabsRadius,
  activeTabsOrientation,
  setActiveTabsOrientation,
  showPanel,
  setShowPanel,
  showIcons,
  setShowIcons,
  selectedState,
  setSelectedState,
  forcedState,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow label="Variant" value={activeVariant} onChange={setActiveVariant} options={TABS_VARIANTS} />
      <PropertyRow label="Radius" value={activeTabsRadius} onChange={setActiveTabsRadius} options={TABS_RADIUS_KEYS} />
      <PropertyRow
        label="Orientation"
        value={activeTabsOrientation}
        onChange={setActiveTabsOrientation}
        options={TABS_ORIENTATION_KEYS}
      />
      <PropertyRow
        label="Panel"
        value={showPanel ? "on" : "off"}
        onChange={(v) => setShowPanel(v === "on")}
        options={["off", "on"]}
      />
      <PropertyRow
        label="Left Icon"
        value={showIcons ? "on" : "off"}
        onChange={(v) => setShowIcons(v === "on")}
        options={["off", "on"]}
      />
      <PropertyRow
        label="State"
        value={selectedState}
        onChange={setSelectedState}
        options={TABS_STATES}
        disabled={Boolean(forcedState)}
      />
    </div>
  );
}

export default function TabsPreviewPanel({
  brands,
  activeBrand,
  activeVariant,
  setActiveVariant,
  activeTabsRadius,
  setActiveTabsRadius,
  activeTabsOrientation,
  setActiveTabsOrientation,
  forcedState,
  activeColorToken,
  showPanel,
  setShowPanel,
  showIcons,
  setShowIcons,
}) {
  const [internalShowPanel, setInternalShowPanel] = useState(false);
  const [internalShowIcons, setInternalShowIcons] = useState(false);
  const [internalState, setInternalState] = useState("default");
  const resolvedShowPanel = typeof showPanel === "boolean" ? showPanel : internalShowPanel;
  const resolvedSetShowPanel = setShowPanel || setInternalShowPanel;
  const resolvedShowIcons = typeof showIcons === "boolean" ? showIcons : internalShowIcons;
  const resolvedSetShowIcons = setShowIcons || setInternalShowIcons;
  const resolvedState = forcedState || internalState;

  return (
    <div>
      <TabsPropertiesPanel
        activeVariant={activeVariant}
        setActiveVariant={setActiveVariant}
        activeTabsRadius={activeTabsRadius}
        setActiveTabsRadius={setActiveTabsRadius}
        activeTabsOrientation={activeTabsOrientation}
        setActiveTabsOrientation={setActiveTabsOrientation}
        showPanel={resolvedShowPanel}
        setShowPanel={resolvedSetShowPanel}
        showIcons={resolvedShowIcons}
        setShowIcons={resolvedSetShowIcons}
        selectedState={resolvedState}
        setSelectedState={setInternalState}
        forcedState={forcedState}
      />
      <div style={{ marginTop: 24 }}>
        <TabsPreviewContent
          brands={brands}
          activeBrand={activeBrand}
          activeVariant={activeVariant}
          activeTabsRadius={activeTabsRadius}
          activeTabsOrientation={activeTabsOrientation}
          selectedState={resolvedState}
          activeColorToken={activeColorToken}
          showPanel={resolvedShowPanel}
          showIcons={resolvedShowIcons}
        />
      </div>
    </div>
  );
}
