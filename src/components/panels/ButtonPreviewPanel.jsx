import { COMPONENT_TOKENS } from "../../data/componentTokens";
import { buildResolvedVars } from "../../utils/buildResolvedVars";
import ButtonPreview from "../previews/ButtonPreview";
import SectionLabel from "../shared/SectionLabel";
import ToggleButtonGroup from "../shared/ToggleButtonGroup";
import CodeSnippet from "../shared/CodeSnippet";
import ResolvedVarsTable from "../shared/ResolvedVarsTable";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

const BUTTON_VARIANTS = ["filled", "outlined", "ghost"];
const BTN_VARIANT_MAP = { filled: "filled", outlined: "outline", ghost: "subtle" };

export default function ButtonPreviewPanel({
  brands,
  activeBrand,
  activeVariant,
  setActiveVariant,
  activeSize,
  setActiveSize,
  sizeKeys,
}) {
  const tokens = COMPONENT_TOKENS.button;
  const mantineVariant = BTN_VARIANT_MAP[activeVariant] || "filled";

  const codeString = `import { Button } from "@mantine/core";

<Button variant="${mantineVariant}" size="${activeSize}">
  Button
</Button>`;

  const resolvedVars = buildResolvedVars(tokens, brands, activeBrand, activeSize);

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

      <PreviewStage>
        <ButtonPreview
          brands={brands}
          brandId={activeBrand}
          variant={activeVariant}
          size={activeSize}
        />
      </PreviewStage>

      <SectionLabel>All Variants x Sizes</SectionLabel>
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

      <SectionLabel>Component Code — {activeVariant} / {activeSize}</SectionLabel>
      <CodeSnippet code={codeString} />

      <SectionLabel>Resolved Variables — {activeVariant} / {activeSize}</SectionLabel>
      <ResolvedVarsTable resolvedVars={resolvedVars} />
    </div>
  );
}
