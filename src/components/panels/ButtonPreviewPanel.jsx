import ButtonPreview from "../previews/ButtonPreview";
import SectionLabel from "../shared/SectionLabel";
import ToggleButtonGroup from "../shared/ToggleButtonGroup";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

const BUTTON_VARIANTS = ["filled", "outlined", "ghost"];

export default function ButtonPreviewPanel({
  brands,
  activeBrand,
  activeVariant,
  setActiveVariant,
  activeSize,
  setActiveSize,
  sizeKeys,
  forcedState,
  activeColorToken,
}) {
  const matrixRows = BUTTON_VARIANTS.map((v) => ({ label: v, variant: v }));

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
        <div>
          <SectionLabel mb={6}>Variant</SectionLabel>
          <ToggleButtonGroup
            options={BUTTON_VARIANTS}
            value={activeVariant}
            onChange={setActiveVariant}
          />
        </div>
        <div>
          <SectionLabel mb={6}>Size</SectionLabel>
          <ToggleButtonGroup
            options={sizeKeys}
            value={activeSize}
            onChange={setActiveSize}
          />
        </div>
      </div>

      <PreviewStage label={activeColorToken}>
        <ButtonPreview
          brands={brands}
          brandId={activeBrand}
          variant={activeVariant}
          size={activeSize}
          state={forcedState}
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
          />
        )}
      />

    </div>
  );
}
