import { COMPONENT_TOKENS } from "../../data/componentTokens";
import { buildResolvedVars } from "../../utils/buildResolvedVars";
import ChipPreview from "../previews/ChipPreview";
import SectionLabel from "../shared/SectionLabel";
import ToggleButtonGroup from "../shared/ToggleButtonGroup";
import CodeSnippet from "../shared/CodeSnippet";
import ResolvedVarsTable from "../shared/ResolvedVarsTable";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

const CHIP_VARIANTS = ["filled", "outline", "light"];
const CHIP_RADIUS_KEYS = ["xs", "sm", "md", "lg", "xl"];

export default function ChipPreviewPanel({
  brands,
  activeBrand,
  activeVariant,
  setActiveVariant,
  activeChipSize,
  setActiveChipSize,
  activeChipRadius,
  setActiveChipRadius,
  sizeKeys,
}) {
  const tokens = COMPONENT_TOKENS.chip;

  const codeString = `import { Chip } from "@mantine/core";

<Chip variant="${activeVariant}" size="${activeChipSize}" radius="${activeChipRadius}" checked>
  Chip
</Chip>`;

  const resolvedVars = buildResolvedVars(tokens, brands, activeBrand, activeChipSize);

  const matrixRows = CHIP_VARIANTS.flatMap((v) => [
    { label: `${v} / unchecked`, variant: v, checked: false },
    { label: `${v} / checked`, variant: v, checked: true },
  ]);

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
        <div>
          <SectionLabel mb={6}>Variant</SectionLabel>
          <ToggleButtonGroup
            options={CHIP_VARIANTS}
            value={activeVariant}
            onChange={setActiveVariant}
          />
        </div>
        <div>
          <SectionLabel mb={6}>Size</SectionLabel>
          <ToggleButtonGroup
            options={sizeKeys}
            value={activeChipSize}
            onChange={setActiveChipSize}
          />
        </div>
        <div>
          <SectionLabel mb={6}>Radius</SectionLabel>
          <ToggleButtonGroup
            options={CHIP_RADIUS_KEYS}
            value={activeChipRadius}
            onChange={setActiveChipRadius}
          />
        </div>
      </div>

      <PreviewStage>
        <ChipPreview
          brands={brands}
          brandId={activeBrand}
          variant={activeVariant}
          size={activeChipSize}
          radius={activeChipRadius}
        />
      </PreviewStage>

      <SectionLabel>All Variants x Sizes</SectionLabel>
      <PreviewMatrix
        sizeKeys={sizeKeys}
        rows={matrixRows}
        renderCell={(row, s) => (
          <ChipPreview
            brands={brands}
            brandId={activeBrand}
            variant={row.variant}
            size={s}
            radius={activeChipRadius}
            checked={row.checked}
            readOnly
          />
        )}
      />

      <SectionLabel>Component Code — {activeVariant} / {activeChipSize}</SectionLabel>
      <CodeSnippet code={codeString} />

      <SectionLabel>Resolved Variables — {activeVariant} / {activeChipSize}</SectionLabel>
      <ResolvedVarsTable resolvedVars={resolvedVars} />
    </div>
  );
}
