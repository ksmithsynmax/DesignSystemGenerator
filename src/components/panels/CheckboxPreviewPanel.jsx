import CheckboxPreview from "../previews/CheckboxPreview";
import SectionLabel from "../shared/SectionLabel";
import ToggleButtonGroup from "../shared/ToggleButtonGroup";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

const CHECKBOX_VARIANTS = ["filled", "outlined"];
const CHECKBOX_RADIUS_KEYS = ["xs", "sm", "md", "lg", "xl"];

export default function CheckboxPreviewPanel({
  brands,
  activeBrand,
  activeVariant,
  setActiveVariant,
  activeCheckboxSize,
  setActiveCheckboxSize,
  activeCheckboxRadius,
  setActiveCheckboxRadius,
  sizeKeys,
  forcedChecked,
  forcedIndeterminate,
  activeColorToken,
}) {
  const matrixRows = [
    { label: "Unchecked", checked: false, indeterminate: false },
    { label: "Checked", checked: true, indeterminate: false },
    { label: "Indeterminate", checked: false, indeterminate: true },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
        <div>
          <SectionLabel mb={6}>Variant</SectionLabel>
          <ToggleButtonGroup
            options={CHECKBOX_VARIANTS}
            value={activeVariant}
            onChange={setActiveVariant}
          />
        </div>
        <div>
          <SectionLabel mb={6}>Size</SectionLabel>
          <ToggleButtonGroup
            options={sizeKeys}
            value={activeCheckboxSize}
            onChange={setActiveCheckboxSize}
          />
        </div>
        <div>
          <SectionLabel mb={6}>Radius</SectionLabel>
          <ToggleButtonGroup
            options={CHECKBOX_RADIUS_KEYS}
            value={activeCheckboxRadius}
            onChange={setActiveCheckboxRadius}
          />
        </div>
      </div>

      <PreviewStage padding={24} label={activeColorToken}>
        <CheckboxPreview
          brands={brands}
          brandId={activeBrand}
          variant={activeVariant}
          size={activeCheckboxSize}
          radius={activeCheckboxRadius}
          checked={forcedChecked != null ? forcedChecked : undefined}
          indeterminate={forcedIndeterminate || undefined}
          readOnly={forcedChecked != null || forcedIndeterminate}
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Sizes &amp; States</SectionLabel>
      <PreviewMatrix
        sizeKeys={sizeKeys}
        rows={matrixRows}
        renderCell={(row, s) => (
          <CheckboxPreview
            brands={brands}
            brandId={activeBrand}
            variant={activeVariant}
            size={s}
            radius={activeCheckboxRadius}
            checked={row.checked}
            indeterminate={row.indeterminate}
            readOnly
          />
        )}
      />

    </div>
  );
}
