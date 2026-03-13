import TabsPreview from "../previews/TabsPreview";
import SectionLabel from "../shared/SectionLabel";
import ToggleButtonGroup from "../shared/ToggleButtonGroup";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";
import { useState } from "react";

const TABS_VARIANTS = ["default", "outlined", "pills"];
const TABS_RADIUS_KEYS = ["xs", "sm", "md", "lg", "xl"];
const TABS_ORIENTATION_KEYS = ["horizontal", "vertical"];

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
}) {
  const [showPanel, setShowPanel] = useState(false);
  const [showIcons, setShowIcons] = useState(false);
  const matrixRows = TABS_VARIANTS.map((v) => ({ label: v, variant: v }));

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <SectionLabel mb={6}>Variant</SectionLabel>
          <ToggleButtonGroup
            options={TABS_VARIANTS}
            value={activeVariant}
            onChange={setActiveVariant}
          />
        </div>
        <div>
          <SectionLabel mb={6}>Radius</SectionLabel>
          <ToggleButtonGroup
            options={TABS_RADIUS_KEYS}
            value={activeTabsRadius}
            onChange={setActiveTabsRadius}
          />
        </div>
        <div>
          <SectionLabel mb={6}>Orientation</SectionLabel>
          <ToggleButtonGroup
            options={TABS_ORIENTATION_KEYS}
            value={activeTabsOrientation}
            onChange={setActiveTabsOrientation}
          />
        </div>
        <div>
          <SectionLabel mb={6}>Panel</SectionLabel>
          <ToggleButtonGroup
            options={["off", "on"]}
            value={showPanel ? "on" : "off"}
            onChange={(v) => setShowPanel(v === "on")}
          />
        </div>
        <div>
          <SectionLabel mb={6}>Left Icon</SectionLabel>
          <ToggleButtonGroup
            options={["off", "on"]}
            value={showIcons ? "on" : "off"}
            onChange={(v) => setShowIcons(v === "on")}
          />
        </div>
      </div>

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
          state={forcedState}
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
