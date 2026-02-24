import { COMPONENT_TOKENS } from "../../data/componentTokens";
import { buildResolvedVars } from "../../utils/buildResolvedVars";
import CheckboxPreview from "../previews/CheckboxPreview";
import SectionLabel from "../shared/SectionLabel";
import ToggleButtonGroup from "../shared/ToggleButtonGroup";
import CodeSnippet from "../shared/CodeSnippet";
import ResolvedVarsTable from "../shared/ResolvedVarsTable";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

export default function CheckboxPreviewPanel({
  brands,
  activeBrand,
  activeCheckboxSize,
  setActiveCheckboxSize,
  sizeKeys,
}) {
  const tokens = COMPONENT_TOKENS.checkbox;

  const codeString = `import { Checkbox } from "@mantine/core";

<Checkbox size="${activeCheckboxSize}" />`;

  const resolvedVars = buildResolvedVars(tokens, brands, activeBrand, activeCheckboxSize);

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

      <PreviewStage padding={24}>
        <CheckboxPreview
          brands={brands}
          brandId={activeBrand}
          size={activeCheckboxSize}
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

      <SectionLabel>Code</SectionLabel>
      <CodeSnippet code={codeString} />

      <SectionLabel>Resolved Variables — {activeCheckboxSize}</SectionLabel>
      <ResolvedVarsTable resolvedVars={resolvedVars} />
    </div>
  );
}
