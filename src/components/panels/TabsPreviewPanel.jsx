import TabsPreview from "../previews/TabsPreview";
import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";
import { useState } from "react";

export const TABS_VARIANTS = ["default", "outlined", "pills"];
export const TABS_RADIUS_KEYS = ["default", "xs", "sm", "md", "lg", "xl"];
export const TABS_ORIENTATION_KEYS = ["horizontal", "vertical"];
export const TABS_STATES = ["default", "active", "hover", "focus", "disabled"];

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

export function TabsPreviewContent({
  brands,
  activeBrand,
  activeVariant,
  activeTabsRadius,
  activeTabsOrientation,
  selectedState,
  activeColorToken,
  showPanel,
  showMenu,
  showLeftIcon,
  showRightIcon,
  showLeftArrow,
  showRightArrow,
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
          showMenu={showMenu}
          showLeftIcon={showLeftIcon}
          showRightIcon={showRightIcon}
          showLeftArrow={showLeftArrow}
          showRightArrow={showRightArrow}
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
            showMenu={showMenu}
            showLeftIcon={showLeftIcon}
            showRightIcon={showRightIcon}
            showLeftArrow={showLeftArrow}
            showRightArrow={showRightArrow}
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
  showMenu,
  setShowMenu,
  showLeftIcon,
  setShowLeftIcon,
  showRightIcon,
  setShowRightIcon,
  showLeftArrow,
  setShowLeftArrow,
  showRightArrow,
  setShowRightArrow,
  selectedState,
  setSelectedState,
  forcedState,
  buildVariants = TABS_VARIANTS,
  setBuildVariants = () => {},
}) {
  // Overflow arrows only apply to horizontal default/outlined tabs (matches Figma).
  const arrowsDisabled = activeVariant === "pills" || activeTabsOrientation === "vertical";
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
      <PropertyRow label="Variant" value={activeVariant} onChange={setActiveVariant} options={TABS_VARIANTS} />
      {/* <VariantBuildRow
        options={TABS_VARIANTS}
        selectedOptions={buildVariants}
        onToggle={toggleBuildVariant}
      /> */}
      {activeVariant !== "default" && (
        <PropertyRow label="Radius" value={activeTabsRadius} onChange={setActiveTabsRadius} options={TABS_RADIUS_KEYS} />
      )}
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
        label="Menu"
        value={showMenu ? "on" : "off"}
        onChange={(v) => setShowMenu(v === "on")}
        options={["off", "on"]}
      />
      <PropertyRow
        label="Left Icon"
        value={showLeftIcon ? "on" : "off"}
        onChange={(v) => setShowLeftIcon(v === "on")}
        options={["off", "on"]}
      />
      <PropertyRow
        label="Right Icon"
        value={showRightIcon ? "on" : "off"}
        onChange={(v) => setShowRightIcon(v === "on")}
        options={["off", "on"]}
      />
      <PropertyRow
        label="Left Arrow"
        value={showLeftArrow ? "on" : "off"}
        onChange={(v) => setShowLeftArrow(v === "on")}
        options={["off", "on"]}
        disabled={arrowsDisabled}
      />
      <PropertyRow
        label="Right Arrow"
        value={showRightArrow ? "on" : "off"}
        onChange={(v) => setShowRightArrow(v === "on")}
        options={["off", "on"]}
        disabled={arrowsDisabled}
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
  showMenu,
  setShowMenu,
  showLeftIcon,
  setShowLeftIcon,
  showRightIcon,
  setShowRightIcon,
  showLeftArrow,
  setShowLeftArrow,
  showRightArrow,
  setShowRightArrow,
}) {
  const [internalShowPanel, setInternalShowPanel] = useState(false);
  const [internalShowMenu, setInternalShowMenu] = useState(false);
  const [internalShowLeftIcon, setInternalShowLeftIcon] = useState(false);
  const [internalShowRightIcon, setInternalShowRightIcon] = useState(false);
  const [internalShowLeftArrow, setInternalShowLeftArrow] = useState(false);
  const [internalShowRightArrow, setInternalShowRightArrow] = useState(false);
  const [internalState, setInternalState] = useState("default");
  const resolvedShowPanel = typeof showPanel === "boolean" ? showPanel : internalShowPanel;
  const resolvedSetShowPanel = setShowPanel || setInternalShowPanel;
  const resolvedShowMenu = typeof showMenu === "boolean" ? showMenu : internalShowMenu;
  const resolvedSetShowMenu = setShowMenu || setInternalShowMenu;
  const resolvedShowLeftIcon = typeof showLeftIcon === "boolean" ? showLeftIcon : internalShowLeftIcon;
  const resolvedSetShowLeftIcon = setShowLeftIcon || setInternalShowLeftIcon;
  const resolvedShowRightIcon = typeof showRightIcon === "boolean" ? showRightIcon : internalShowRightIcon;
  const resolvedSetShowRightIcon = setShowRightIcon || setInternalShowRightIcon;
  const resolvedShowLeftArrow = typeof showLeftArrow === "boolean" ? showLeftArrow : internalShowLeftArrow;
  const resolvedSetShowLeftArrow = setShowLeftArrow || setInternalShowLeftArrow;
  const resolvedShowRightArrow = typeof showRightArrow === "boolean" ? showRightArrow : internalShowRightArrow;
  const resolvedSetShowRightArrow = setShowRightArrow || setInternalShowRightArrow;
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
        showMenu={resolvedShowMenu}
        setShowMenu={resolvedSetShowMenu}
        showLeftIcon={resolvedShowLeftIcon}
        setShowLeftIcon={resolvedSetShowLeftIcon}
        showRightIcon={resolvedShowRightIcon}
        setShowRightIcon={resolvedSetShowRightIcon}
        showLeftArrow={resolvedShowLeftArrow}
        setShowLeftArrow={resolvedSetShowLeftArrow}
        showRightArrow={resolvedShowRightArrow}
        setShowRightArrow={resolvedSetShowRightArrow}
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
          showMenu={resolvedShowMenu}
          showLeftIcon={resolvedShowLeftIcon}
          showRightIcon={resolvedShowRightIcon}
          showLeftArrow={resolvedShowLeftArrow}
          showRightArrow={resolvedShowRightArrow}
        />
      </div>
    </div>
  );
}
