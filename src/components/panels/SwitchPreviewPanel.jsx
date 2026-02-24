import { COMPONENT_TOKENS } from "../../data/componentTokens";
import { buildResolvedVars } from "../../utils/buildResolvedVars";
import SwitchPreview from "../previews/SwitchPreview";
import SectionLabel from "../shared/SectionLabel";
import ToggleButtonGroup from "../shared/ToggleButtonGroup";
import CodeSnippet from "../shared/CodeSnippet";
import ResolvedVarsTable from "../shared/ResolvedVarsTable";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

export default function SwitchPreviewPanel({
  brands,
  activeBrand,
  activeSwitchSize,
  setActiveSwitchSize,
  sizeKeys,
}) {
  const tokens = COMPONENT_TOKENS.switch;

  const codeString = `import { Switch } from "@mantine/core";

<Switch size="${activeSwitchSize}" />`;

  const resolvedVars = buildResolvedVars(tokens, brands, activeBrand, activeSwitchSize);

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

      <PreviewStage>
        <SwitchPreview
          brands={brands}
          brandId={activeBrand}
          size={activeSwitchSize}
        />
        <span style={{ fontSize: 13, color: "#868E96" }}>Click to toggle</span>
      </PreviewStage>

      <SectionLabel>All Sizes — Off & On States</SectionLabel>
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

      <SectionLabel>Component Code — {activeSwitchSize}</SectionLabel>
      <CodeSnippet code={codeString} />

      <SectionLabel>Resolved Variables — {activeSwitchSize}</SectionLabel>
      <ResolvedVarsTable resolvedVars={resolvedVars} />
    </div>
  );
}
