import { useState } from "react";
import { COMPONENT_TOKENS } from "../../data/componentTokens";
import { buildResolvedVars } from "../../utils/buildResolvedVars";
import RadioPreview from "../previews/RadioPreview";
import SectionLabel from "../shared/SectionLabel";
import ToggleButtonGroup from "../shared/ToggleButtonGroup";
import CodeSnippet from "../shared/CodeSnippet";
import ResolvedVarsTable from "../shared/ResolvedVarsTable";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

const RADIO_VARIANTS = ["filled", "outline"];

export default function RadioPreviewPanel({
  brands,
  activeBrand,
  activeVariant,
  setActiveVariant,
  activeRadioSize,
  setActiveRadioSize,
  sizeKeys,
}) {
  const [showLabel, setShowLabel] = useState(true);
  const tokens = COMPONENT_TOKENS.radio;

  const codeString = `import { Radio } from "@mantine/core";

<Radio variant="${activeVariant}" size="${activeRadioSize}"${showLabel ? ' label="Radio label"' : ""} />`;

  const resolvedVars = buildResolvedVars(tokens, brands, activeBrand, activeRadioSize);

  const matrixRows = RADIO_VARIANTS.flatMap((v) => [
    { label: `${v} / unchecked`, variant: v, checked: false },
    { label: `${v} / checked`, variant: v, checked: true },
  ]);

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
        <div>
          <SectionLabel mb={6}>Variant</SectionLabel>
          <ToggleButtonGroup
            options={RADIO_VARIANTS}
            value={activeVariant}
            onChange={setActiveVariant}
          />
        </div>
        <div>
          <SectionLabel mb={6}>Size</SectionLabel>
          <ToggleButtonGroup
            options={sizeKeys}
            value={activeRadioSize}
            onChange={setActiveRadioSize}
          />
        </div>
        <div>
          <SectionLabel mb={6}>Label</SectionLabel>
          <button
            onClick={() => setShowLabel((v) => !v)}
            style={{
              background: showLabel ? "#373A40" : "transparent",
              color: showLabel ? "#E9ECEF" : "#5C5F66",
              border: "1px solid #373A40",
              borderRadius: 4,
              padding: "4px 12px",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "monospace",
            }}
          >
            {showLabel ? "on" : "off"}
          </button>
        </div>
      </div>

      <PreviewStage>
        <RadioPreview
          brands={brands}
          brandId={activeBrand}
          variant={activeVariant}
          size={activeRadioSize}
          label={showLabel ? "Radio label" : undefined}
        />
      </PreviewStage>

      <SectionLabel>All Variants x Sizes</SectionLabel>
      <PreviewMatrix
        sizeKeys={sizeKeys}
        rows={matrixRows}
        renderCell={(row, s) => (
          <RadioPreview
            brands={brands}
            brandId={activeBrand}
            variant={row.variant}
            size={s}
            checked={row.checked}
            readOnly
          />
        )}
      />

      <SectionLabel>Component Code — {activeVariant} / {activeRadioSize}</SectionLabel>
      <CodeSnippet code={codeString} />

      <SectionLabel>Resolved Variables — {activeVariant} / {activeRadioSize}</SectionLabel>
      <ResolvedVarsTable resolvedVars={resolvedVars} />
    </div>
  );
}
