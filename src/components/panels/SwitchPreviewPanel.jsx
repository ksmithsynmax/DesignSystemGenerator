import SwitchPreview from "../previews/SwitchPreview";
import SectionLabel from "../shared/SectionLabel";
import ToggleButtonGroup from "../shared/ToggleButtonGroup";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

export default function SwitchPreviewPanel({
  brands,
  activeBrand,
  activeSwitchSize,
  setActiveSwitchSize,
  sizeKeys,
  forcedChecked,
  activeColorToken,
}) {
  const matrixRows = [
    { label: "off", checked: false },
    { label: "on", checked: true },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <SectionLabel mb={6}>Size</SectionLabel>
        <ToggleButtonGroup
          options={sizeKeys}
          value={activeSwitchSize}
          onChange={setActiveSwitchSize}
        />
      </div>

      <PreviewStage label={activeColorToken}>
        <SwitchPreview
          brands={brands}
          brandId={activeBrand}
          size={activeSwitchSize}
          checked={forcedChecked != null ? forcedChecked : undefined}
          readOnly={forcedChecked != null}
        />
        {forcedChecked == null && (
          <span style={{ fontSize: 13, color: "#868E96" }}>Click to toggle</span>
        )}
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>All Sizes — Off & On States</SectionLabel>
      <PreviewMatrix
        sizeKeys={sizeKeys}
        rows={matrixRows}
        renderCell={(row, s) => (
          <SwitchPreview
            brands={brands}
            brandId={activeBrand}
            size={s}
            checked={row.checked}
            readOnly
          />
        )}
      />

    </div>
  );
}
