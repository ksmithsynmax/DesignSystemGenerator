import ActionIconPreview from "../previews/ActionIconPreview";
import SectionLabel from "../shared/SectionLabel";
import ToggleButtonGroup from "../shared/ToggleButtonGroup";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

const ACTIONICON_VARIANTS = ["default", "filled", "light", "outlined", "transparent"];
const ACTIONICON_RADIUS_KEYS = ["xs", "sm", "md", "lg", "xl"];
const ACTIONICON_ICONS = ["check", "minus"];

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
  sizeKeys,
  forcedState,
  activeColorToken,
}) {
  const matrixRows = ACTIONICON_VARIANTS.map((variant) => ({ label: variant, variant }));

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <SectionLabel mb={6}>Variant</SectionLabel>
          <ToggleButtonGroup
            options={ACTIONICON_VARIANTS}
            value={activeVariant}
            onChange={setActiveVariant}
          />
        </div>
        <div>
          <SectionLabel mb={6}>Size</SectionLabel>
          <ToggleButtonGroup
            options={sizeKeys}
            value={activeActionIconSize}
            onChange={setActiveActionIconSize}
          />
        </div>
        <div>
          <SectionLabel mb={6}>Radius</SectionLabel>
          <ToggleButtonGroup
            options={ACTIONICON_RADIUS_KEYS}
            value={activeActionIconRadius}
            onChange={setActiveActionIconRadius}
          />
        </div>
        <div>
          <SectionLabel mb={6}>Icon</SectionLabel>
          <ToggleButtonGroup
            options={ACTIONICON_ICONS}
            value={activeActionIconIcon}
            onChange={setActiveActionIconIcon}
          />
        </div>
      </div>

      <PreviewStage label={activeColorToken}>
        <ActionIconPreview
          brands={brands}
          brandId={activeBrand}
          variant={activeVariant}
          size={activeActionIconSize}
          radius={activeActionIconRadius}
          state={forcedState}
          iconName={activeActionIconIcon}
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Variants x Sizes</SectionLabel>
      <PreviewMatrix
        sizeKeys={sizeKeys}
        rows={matrixRows}
        renderCell={(row, s) => (
          <ActionIconPreview
            brands={brands}
            brandId={activeBrand}
            variant={row.variant}
            size={s}
            radius={activeActionIconRadius}
            iconName={activeActionIconIcon}
          />
        )}
      />
    </div>
  );
}
