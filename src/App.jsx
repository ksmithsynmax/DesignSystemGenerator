import { useState, useCallback } from "react";
import { INITIAL_BRANDS } from "./data/brands";
import {
  COMPONENT_NAMES,
  COMPONENT_SIZE_KEYS,
  getColorTokens,
  getDimensionTokens,
} from "./data/componentTokens";
import { resolveColor, getComponentDefaultSize } from "./utils/resolveToken";
import Section from "./components/shared/Section";
import ComponentSelect from "./components/shared/ComponentSelect";
import PrimitiveScale from "./components/editors/PrimitiveScale";
import SemanticRow from "./components/editors/SemanticRow";
import ComponentTokenRow from "./components/editors/ComponentTokenRow";
import DimensionTokenRow from "./components/editors/DimensionTokenRow";
import ButtonPreviewPanel from "./components/panels/ButtonPreviewPanel";
import SwitchPreviewPanel from "./components/panels/SwitchPreviewPanel";
import CheckboxPreviewPanel from "./components/panels/CheckboxPreviewPanel";
import RadioPreviewPanel from "./components/panels/RadioPreviewPanel";
import ChipPreviewPanel from "./components/panels/ChipPreviewPanel";
import TooltipPreviewPanel from "./components/panels/TooltipPreviewPanel";
import TextInputPreviewPanel from "./components/panels/TextInputPreviewPanel";
import TokenChain from "./components/TokenChain";
import FigmaSyncButton from "./components/FigmaSyncButton";
import { buildMarkdownExport } from "./utils/buildMarkdownExport";
import { buildStorybookZip } from "./utils/buildStorybookZip";
import { GLOBAL_PRIMITIVES } from "./data/brands";

export default function App() {
  const [brands, setBrands] = useState(INITIAL_BRANDS);
  const [activeBrand, setActiveBrand] = useState("theia");
  const [activeComponent, setActiveComponent] = useState("button");
  const [activeVariant, setActiveVariant] = useState("filled");
  const [activeTab, setActiveTab] = useState("preview");

  const brand = brands[activeBrand];
  const colorNames = Object.keys(brand.primitives);
  const sizeKeys = COMPONENT_SIZE_KEYS[activeComponent] || [];

  // Derive default size per component from brand data
  const buttonDefault = getComponentDefaultSize(brands, activeBrand, "button") || "sm";
  const switchDefault = getComponentDefaultSize(brands, activeBrand, "switch") || "md";
  const checkboxDefault = getComponentDefaultSize(brands, activeBrand, "checkbox") || "md";
  const radioDefault = getComponentDefaultSize(brands, activeBrand, "radio") || "md";
  const chipDefault = getComponentDefaultSize(brands, activeBrand, "chip") || "md";
  const textInputDefault = getComponentDefaultSize(brands, activeBrand, "textinput") || "sm";

  const [activeSize, setActiveSize] = useState(buttonDefault);
  const [activeSwitchSize, setActiveSwitchSize] = useState(switchDefault);
  const [activeCheckboxSize, setActiveCheckboxSize] = useState(checkboxDefault);
  const [activeRadioSize, setActiveRadioSize] = useState(radioDefault);
  const [activeChipSize, setActiveChipSize] = useState(chipDefault);
  const [activeChipRadius, setActiveChipRadius] = useState(chipDefault);
  const [activeTextInputSize, setActiveTextInputSize] = useState(textInputDefault);
  const [activeTextInputRadius, setActiveTextInputRadius] = useState(textInputDefault);

  // Sync active sizes when brand changes
  const handleBrandChange = useCallback((newBrand) => {
    setActiveBrand(newBrand);
    const btnDef = getComponentDefaultSize(brands, newBrand, "button") || "sm";
    const swDef = getComponentDefaultSize(brands, newBrand, "switch") || "md";
    const cbDef = getComponentDefaultSize(brands, newBrand, "checkbox") || "md";
    const rdDef = getComponentDefaultSize(brands, newBrand, "radio") || "md";
    const chDef = getComponentDefaultSize(brands, newBrand, "chip") || "md";
    setActiveSize(btnDef);
    setActiveSwitchSize(swDef);
    setActiveCheckboxSize(cbDef);
    setActiveRadioSize(rdDef);
    setActiveChipSize(chDef);
    setActiveChipRadius(chDef);
    const tiDef = getComponentDefaultSize(brands, newBrand, "textinput") || "sm";
    setActiveTextInputSize(tiDef);
    setActiveTextInputRadius(tiDef);
  }, [brands]);

  // Sync active size when component changes
  const handleComponentChange = useCallback((newComp) => {
    setActiveComponent(newComp);
    if (newComp === "button") {
      setActiveSize(buttonDefault);
    } else if (newComp === "switch") {
      setActiveSwitchSize(switchDefault);
    } else if (newComp === "checkbox") {
      setActiveCheckboxSize(checkboxDefault);
    } else if (newComp === "radio") {
      setActiveRadioSize(radioDefault);
      setActiveVariant("filled");
    } else if (newComp === "chip") {
      setActiveChipSize(chipDefault);
      setActiveChipRadius(chipDefault);
      setActiveVariant("filled");
    } else if (newComp === "textinput") {
      setActiveTextInputSize(textInputDefault);
      setActiveTextInputRadius(textInputDefault);
      setActiveVariant("default");
    }
  }, [buttonDefault, switchDefault, checkboxDefault, radioDefault, chipDefault, textInputDefault]);

  const updatePrimitive = useCallback(
    (colorName, index, value) => {
      setBrands((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        next[activeBrand].primitives[colorName][index] = value;
        return next;
      });
    },
    [activeBrand]
  );

  const updateSemantic = useCallback(
    (token, mapping) => {
      setBrands((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        next[activeBrand].semanticMap[token] = mapping;
        return next;
      });
    },
    [activeBrand]
  );

  const updateDimensionOverride = useCallback(
    (tokenName, size, value) => {
      setBrands((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        if (!next[activeBrand].dimensionOverrides) {
          next[activeBrand].dimensionOverrides = {};
        }
        if (!next[activeBrand].dimensionOverrides[tokenName]) {
          next[activeBrand].dimensionOverrides[tokenName] = {};
        }
        next[activeBrand].dimensionOverrides[tokenName][size] = value;
        return next;
      });
    },
    [activeBrand]
  );

  const addBrand = useCallback(
    (name) => {
      const id = name.toLowerCase().replace(/\s+/g, "-");
      if (brands[id]) return;
      setBrands((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        next[id] = JSON.parse(JSON.stringify(prev[activeBrand]));
        next[id].name = name;
        return next;
      });
      setActiveBrand(id);
    },
    [activeBrand, brands]
  );

  const brandNames = Object.keys(brands);
  const colorTokens = getColorTokens(activeComponent);
  const dimensionTokens = getDimensionTokens(activeComponent);

  const tabStyle = (t) => ({
    background: activeTab === t ? "#25262B" : "transparent",
    color: activeTab === t ? "#C1C2C5" : "#5C5F66",
    border: "none",
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    borderRadius: "6px 6px 0 0",
  });

  const handleMarkdownExport = () => {
    const md = buildMarkdownExport(brands, GLOBAL_PRIMITIVES);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "design-system-tokens.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStorybookExport = async () => {
    const blob = await buildStorybookZip(brands, GLOBAL_PRIMITIVES);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "design-system-storybook.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        background: "#1A1B1E",
        color: "#C1C2C5",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid #2C2E33",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 700, color: "#E9ECEF" }}>
          Design System Generator
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#5C5F66" }}>Component:</span>
            <ComponentSelect
              options={COMPONENT_NAMES}
              value={activeComponent}
              onChange={handleComponentChange}
            />
          </div>
          <div style={{ width: 1, height: 20, background: "#373A40" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#5C5F66" }}>Brand:</span>
            <ComponentSelect
              options={brandNames}
              value={activeBrand}
              displayValue={brand.name}
              onChange={handleBrandChange}
              placeholder="Search brands..."
              onAdd={addBrand}
              addLabel="+ New brand"
            />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Left Panel — Token Layers */}
        <div
          style={{
            width: 420,
            borderRight: "1px solid #2C2E33",
            overflowY: "auto",
            padding: "16px 20px",
            flexShrink: 0,
          }}
        >
          <Section title={`Primitives — ${brand.name}`}>
            {colorNames.map((c) => (
              <PrimitiveScale
                key={c}
                name={c}
                scale={brand.primitives[c]}
                onUpdate={updatePrimitive}
              />
            ))}
          </Section>

          <Section title="Semantic Tokens">
            {Object.entries(brand.semanticMap).map(([token, mapping]) => (
              <SemanticRow
                key={token}
                token={token}
                mapping={mapping}
                resolvedColor={resolveColor(brands, activeBrand, token)}
                onUpdate={updateSemantic}
                colors={colorNames}
              />
            ))}
          </Section>

          <Section title={`Color Tokens — ${activeComponent}`}>
            {Object.entries(colorTokens).map(([token, def]) => (
              <ComponentTokenRow
                key={token}
                token={token}
                tokenDef={def}
                resolvedColor={resolveColor(brands, activeBrand, def.semantic)}
              />
            ))}
          </Section>

          <Section title={`Dimension Tokens — ${activeComponent}`}>
            {Object.entries(dimensionTokens).map(([token, def]) => (
              <DimensionTokenRow
                key={token}
                tokenName={token}
                tokenDef={def}
                brands={brands}
                brandId={activeBrand}
                sizeKeys={sizeKeys}
                onUpdateDimension={updateDimensionOverride}
              />
            ))}
          </Section>
        </div>

        {/* Right Panel — Preview & Chain */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 0 }}>
            <button
              onClick={() => setActiveTab("preview")}
              style={tabStyle("preview")}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab("chain")}
              style={tabStyle("chain")}
            >
              Token Chain
            </button>
            <button
              onClick={() => setActiveTab("export")}
              style={tabStyle("export")}
            >
              Export
            </button>
          </div>

          <div
            style={{
              background: "#25262B",
              borderRadius: "0 8px 8px 8px",
              padding: 24,
            }}
          >
            {/* PREVIEW TAB */}
            {activeTab === "preview" && activeComponent === "button" && (
              <ButtonPreviewPanel
                brands={brands}
                activeBrand={activeBrand}
                activeVariant={activeVariant}
                setActiveVariant={setActiveVariant}
                activeSize={activeSize}
                setActiveSize={setActiveSize}
                sizeKeys={sizeKeys}
              />
            )}

            {activeTab === "preview" && activeComponent === "switch" && (
              <SwitchPreviewPanel
                brands={brands}
                activeBrand={activeBrand}
                activeSwitchSize={activeSwitchSize}
                setActiveSwitchSize={setActiveSwitchSize}
                sizeKeys={sizeKeys}
              />
            )}

            {activeTab === "preview" && activeComponent === "checkbox" && (
              <CheckboxPreviewPanel
                brands={brands}
                activeBrand={activeBrand}
                activeCheckboxSize={activeCheckboxSize}
                setActiveCheckboxSize={setActiveCheckboxSize}
                sizeKeys={sizeKeys}
              />
            )}

            {activeTab === "preview" && activeComponent === "radio" && (
              <RadioPreviewPanel
                brands={brands}
                activeBrand={activeBrand}
                activeVariant={activeVariant}
                setActiveVariant={setActiveVariant}
                activeRadioSize={activeRadioSize}
                setActiveRadioSize={setActiveRadioSize}
                sizeKeys={sizeKeys}
              />
            )}

            {activeTab === "preview" && activeComponent === "chip" && (
              <ChipPreviewPanel
                brands={brands}
                activeBrand={activeBrand}
                activeVariant={activeVariant}
                setActiveVariant={setActiveVariant}
                activeChipSize={activeChipSize}
                setActiveChipSize={setActiveChipSize}
                activeChipRadius={activeChipRadius}
                setActiveChipRadius={setActiveChipRadius}
                sizeKeys={sizeKeys}
              />
            )}

            {activeTab === "preview" && activeComponent === "tooltip" && (
              <TooltipPreviewPanel
                brands={brands}
                activeBrand={activeBrand}
              />
            )}

            {activeTab === "preview" && activeComponent === "textinput" && (
              <TextInputPreviewPanel
                brands={brands}
                activeBrand={activeBrand}
                activeVariant={activeVariant}
                setActiveVariant={setActiveVariant}
                activeTextInputSize={activeTextInputSize}
                setActiveTextInputSize={setActiveTextInputSize}
                activeTextInputRadius={activeTextInputRadius}
                setActiveTextInputRadius={setActiveTextInputRadius}
                sizeKeys={sizeKeys}
              />
            )}

            {/* CHAIN TAB */}
            {activeTab === "chain" && (
              <TokenChain
                brands={brands}
                brandId={activeBrand}
                componentName={activeComponent}
              />
            )}

            {/* EXPORT TAB */}
            {activeTab === "export" && (
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#5C5F66",
                    marginBottom: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontWeight: 600,
                  }}
                >
                  Resolved Tokens — All Brands
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: "#868E96",
                    marginBottom: 16,
                    lineHeight: 1.5,
                  }}
                >
                  This JSON represents the fully resolved token data for all
                  brands. Figma folder paths are used as keys. COLOR and FLOAT
                  types are included. Size variants are expanded into individual
                  entries with -default aliases.
                </p>
                <FigmaSyncButton brands={brands} />

                <div
                  style={{
                    borderTop: "1px solid #2C2E33",
                    marginTop: 20,
                    paddingTop: 20,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "#5C5F66",
                      marginBottom: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontWeight: 600,
                    }}
                  >
                    Markdown Export
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#868E96",
                      marginBottom: 16,
                      lineHeight: 1.5,
                    }}
                  >
                    Download a markdown reference of all tokens, brand primitives,
                    semantic mappings, and component definitions.
                  </p>
                  <button
                    onClick={handleMarkdownExport}
                    style={{
                      background: "#25262B",
                      border: "1px solid #373A40",
                      borderRadius: 6,
                      padding: "8px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#C1C2C5",
                      cursor: "pointer",
                      fontFamily: "monospace",
                    }}
                  >
                    Download Markdown
                  </button>
                </div>

                <div
                  style={{
                    borderTop: "1px solid #2C2E33",
                    marginTop: 20,
                    paddingTop: 20,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "#5C5F66",
                      marginBottom: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontWeight: 600,
                    }}
                  >
                    Storybook Export
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#868E96",
                      marginBottom: 16,
                      lineHeight: 1.5,
                    }}
                  >
                    Download a ready-to-run Storybook project with all components,
                    tokens, and a brand switcher toolbar. Extract, run{" "}
                    <code style={{ color: "#C1C2C5" }}>npm install && npm run storybook</code>,
                    and you're set.
                  </p>
                  <button
                    onClick={handleStorybookExport}
                    style={{
                      background: "#228BE6",
                      border: "none",
                      borderRadius: 6,
                      padding: "8px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#fff",
                      cursor: "pointer",
                      fontFamily: "monospace",
                    }}
                  >
                    Generate Storybook
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
