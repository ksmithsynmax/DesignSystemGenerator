import { useState } from "react";
import { COMPONENT_TOKENS } from "../../data/componentTokens";
import { buildResolvedVars } from "../../utils/buildResolvedVars";
import TextInputPreview from "../previews/TextInputPreview";
import SectionLabel from "../shared/SectionLabel";
import ToggleButtonGroup from "../shared/ToggleButtonGroup";
import CodeSnippet from "../shared/CodeSnippet";
import ResolvedVarsTable from "../shared/ResolvedVarsTable";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";

const TEXTINPUT_VARIANTS = ["default", "filled"];
const TEXTINPUT_RADIUS_KEYS = ["xs", "sm", "md", "lg", "xl"];

export default function TextInputPreviewPanel({
  brands,
  activeBrand,
  activeVariant,
  setActiveVariant,
  activeTextInputSize,
  setActiveTextInputSize,
  activeTextInputRadius,
  setActiveTextInputRadius,
  sizeKeys,
}) {
  const [showLabel, setShowLabel] = useState(true);
  const [labelText, setLabelText] = useState("Label");
  const [withAsterisk, setWithAsterisk] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorText, setErrorText] = useState("Error message");

  const tokens = COMPONENT_TOKENS.textinput;

  const mantineVariant = activeVariant === "filled" ? "filled" : "default";
  const codeString = `import { TextInput } from "@mantine/core";

<TextInput
  variant="${mantineVariant}"
  size="${activeTextInputSize}"
  radius="${activeTextInputRadius}"${showLabel ? `\n  label="${labelText}"` : ""}${withAsterisk && showLabel ? "\n  withAsterisk" : ""}${showError ? `\n  error="${errorText}"` : ""}
  placeholder="Placeholder"
/>`;

  const resolvedVars = buildResolvedVars(tokens, brands, activeBrand, activeTextInputSize);

  const matrixRows = TEXTINPUT_VARIANTS.flatMap((v) => [
    { label: `${v}`, variant: v, state: "default" },
    { label: `${v} / hover`, variant: v, state: "hover" },
    { label: `${v} / focus`, variant: v, state: "focus" },
    { label: `${v} / error`, variant: v, state: "error" },
    { label: `${v} / disabled`, variant: v, state: "disabled" },
  ]);

  const toggleStyle = (active) => ({
    background: active ? "#373A40" : "transparent",
    color: active ? "#E9ECEF" : "#5C5F66",
    border: "1px solid #373A40",
    borderRadius: 4,
    padding: "4px 10px",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "monospace",
  });

  const inputFieldStyle = {
    background: "#1A1B1E",
    border: "1px solid #373A40",
    borderRadius: 4,
    padding: "2px 8px",
    fontSize: 12,
    color: "#C1C2C5",
    width: 100,
    fontFamily: "monospace",
  };

  return (
    <div>
      {/* Row 1: Variant, Size, Radius */}
      <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
        <div>
          <SectionLabel mb={6}>Variant</SectionLabel>
          <ToggleButtonGroup
            options={TEXTINPUT_VARIANTS}
            value={activeVariant}
            onChange={setActiveVariant}
          />
        </div>
        <div>
          <SectionLabel mb={6}>Size</SectionLabel>
          <ToggleButtonGroup
            options={sizeKeys}
            value={activeTextInputSize}
            onChange={setActiveTextInputSize}
          />
        </div>
        <div>
          <SectionLabel mb={6}>Radius</SectionLabel>
          <ToggleButtonGroup
            options={TEXTINPUT_RADIUS_KEYS}
            value={activeTextInputRadius}
            onChange={setActiveTextInputRadius}
          />
        </div>
      </div>

      {/* Row 2: Label, Asterisk, Error toggles */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setShowLabel((v) => !v)}
            style={toggleStyle(showLabel)}
          >
            Label
          </button>
          {showLabel && (
            <input
              type="text"
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              style={inputFieldStyle}
            />
          )}
        </div>

        {showLabel && (
          <button
            onClick={() => setWithAsterisk((v) => !v)}
            style={toggleStyle(withAsterisk)}
          >
            Required *
          </button>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setShowError((v) => !v)}
            style={toggleStyle(showError)}
          >
            Error
          </button>
          {showError && (
            <input
              type="text"
              value={errorText}
              onChange={(e) => setErrorText(e.target.value)}
              style={inputFieldStyle}
            />
          )}
        </div>
      </div>

      <PreviewStage>
        <div style={{ width: 280 }}>
          <TextInputPreview
            brands={brands}
            brandId={activeBrand}
            variant={activeVariant}
            size={activeTextInputSize}
            radius={activeTextInputRadius}
            showLabel={showLabel}
            labelText={labelText}
            withAsterisk={withAsterisk}
            showError={showError}
            errorText={errorText}
          />
        </div>
      </PreviewStage>

      <SectionLabel>All Variants x States x Sizes</SectionLabel>
      <PreviewMatrix
        sizeKeys={sizeKeys}
        rows={matrixRows}
        renderCell={(row, s) => (
          <div style={{ width: 160, textAlign: "left", display: "inline-block" }}>
            <TextInputPreview
              brands={brands}
              brandId={activeBrand}
              variant={row.variant}
              size={s}
              radius={activeTextInputRadius}
              state={row.state}
              showLabel={false}
              showError={row.state === "error"}
              errorText="Error"
            />
          </div>
        )}
      />

      <SectionLabel>Component Code — {activeVariant} / {activeTextInputSize}</SectionLabel>
      <CodeSnippet code={codeString} />

      <SectionLabel>Resolved Variables — {activeVariant} / {activeTextInputSize}</SectionLabel>
      <ResolvedVarsTable resolvedVars={resolvedVars} />
    </div>
  );
}
