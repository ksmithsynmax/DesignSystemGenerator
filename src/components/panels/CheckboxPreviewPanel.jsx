import CheckboxPreview from "../previews/CheckboxPreview";
import SectionLabel from "../shared/SectionLabel";
import ToggleButtonGroup from "../shared/ToggleButtonGroup";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

export default function CheckboxPreviewPanel({
  brands,
  activeBrand,
  activeCheckboxSize,
  setActiveCheckboxSize,
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
      <div style={{ marginBottom: 24 }}>
        <SectionLabel mb={6}>Size</SectionLabel>
        <ToggleButtonGroup
          options={sizeKeys}
          value={activeCheckboxSize}
          onChange={setActiveCheckboxSize}
        />
      </div>

      {activeColorToken && (
        <div style={{ fontSize: 12, fontFamily: "monospace", color: "#868E96", marginBottom: 8 }}>
          {activeColorToken}
        </div>
      )}
      <PreviewStage padding={24}>
        <CheckboxPreview
          brands={brands}
          brandId={activeBrand}
          size={activeCheckboxSize}
          checked={forcedChecked != null ? forcedChecked : undefined}
          indeterminate={forcedIndeterminate || undefined}
          readOnly={forcedChecked != null || forcedIndeterminate}
        />
      </PreviewStage>

      <SectionLabel>All Sizes &amp; States</SectionLabel>
      <PreviewMatrix
        sizeKeys={sizeKeys}
        rows={matrixRows}
        renderCell={(row, s) => (
          <CheckboxPreview
            brands={brands}
            brandId={activeBrand}
            size={s}
            checked={row.checked}
            indeterminate={row.indeterminate}
            readOnly
          />
        )}
      />

    </div>
  );
}
