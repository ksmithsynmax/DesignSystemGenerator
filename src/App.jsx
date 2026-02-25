import { useState, useCallback, useRef } from "react";
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
import TokenChainCard from "./components/editors/TokenChainCard";
import DimensionTokenRow from "./components/editors/DimensionTokenRow";
import ButtonPreviewPanel from "./components/panels/ButtonPreviewPanel";
import SwitchPreviewPanel from "./components/panels/SwitchPreviewPanel";
import CheckboxPreviewPanel from "./components/panels/CheckboxPreviewPanel";
import RadioPreviewPanel from "./components/panels/RadioPreviewPanel";
import ChipPreviewPanel from "./components/panels/ChipPreviewPanel";
import TooltipPreviewPanel from "./components/panels/TooltipPreviewPanel";
import TextInputPreviewPanel from "./components/panels/TextInputPreviewPanel";
import FigmaSyncButton from "./components/FigmaSyncButton";
import { buildMarkdownExport } from "./utils/buildMarkdownExport";
import { GLOBAL_PRIMITIVES } from "./data/brands";

export default function App() {
  const [brands, setBrands] = useState(INITIAL_BRANDS);
  const [activeBrand, setActiveBrand] = useState("theia");
  const [activeComponent, setActiveComponent] = useState("button");
  const [activeVariant, setActiveVariant] = useState("filled");
  const [activeTab, setActiveTab] = useState("preview");
  const [storybookLoading, setStorybookLoading] = useState(false);
  const [storybookError, setStorybookError] = useState(null);
  const [panelWidth, setPanelWidth] = useState(460);
  const [activeColorToken, setActiveColorToken] = useState(null);
  const [activeDimensionToken, setActiveDimensionToken] = useState(null);

  const panelWidthRef = useRef(460);
  const handlePanelDrag = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = panelWidthRef.current;
    const onMove = (ev) => {
      const next = Math.min(700, Math.max(300, startWidth + ev.clientX - startX));
      panelWidthRef.current = next;
      setPanelWidth(next);
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

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
    setActiveColorToken(null);
    setActiveDimensionToken(null);
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

  // Parse forced state/checked/variant from the active token card
  const INTERACTIVE_STATES = ["hover", "focus", "pressed", "disabled", "error"];
  let forcedState = null;
  let forcedChecked = null;
  let forcedIndeterminate = false;
  let forcedVariant = null;

  if (activeColorToken) {
    const parts = activeColorToken.split("-");
    const last = parts[parts.length - 1];

    // Detect interactive state suffix
    if (INTERACTIVE_STATES.includes(last)) {
      forcedState = last;
    }

    // Detect checked/indeterminate
    if (parts.includes("checked")) {
      forcedChecked = true;
    }
    if (parts.includes("indeterminate")) {
      forcedIndeterminate = true;
    }

    // Extract variant from token name (e.g., "button-filled-background-hover" → "filled")
    // Pattern: component-variant-property[-state]
    // Variant is the second segment for components that have variants
    if (["button", "chip", "radio", "textinput"].includes(activeComponent)) {
      const variantSegment = parts[1];
      // Validate it's actually a variant, not a property
      const knownVariants = {
        button: ["filled", "outlined", "ghost"],
        chip: ["filled", "light", "outline"],
        radio: ["filled", "outline"],
        textinput: ["default", "filled"],
      };
      if (knownVariants[activeComponent]?.includes(variantSegment)) {
        forcedVariant = variantSegment;
      }
    }
  }

  const tabStyle = (t) => ({
    background: activeTab === t ? "#25262B" : "transparent",
    color: activeTab === t ? "#C1C2C5" : "#5C5F66",
    border: "none",
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    borderRadius: 6,
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
    setStorybookLoading(true);
    setStorybookError(null);
    try {
      const response = await fetch("http://localhost:9001/api/launch-storybook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brands, globalPrimitives: GLOBAL_PRIMITIVES }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Server error");
      }
      const data = await response.json();
      window.open(data.url, "_blank");
    } catch (err) {
      setStorybookError(
        err.message === "Failed to fetch"
          ? "Server not running. Start it with: npm run relay"
          : err.message
      );
    } finally {
      setStorybookLoading(false);
    }
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
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setActiveTab("preview")} style={tabStyle("preview")}>
            Preview
          </button>
          <button onClick={() => setActiveTab("export")} style={tabStyle("export")}>
            Export
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Left Panel — Token Layers (Preview tab only) */}
        {activeTab === "preview" && (
          <div
            style={{
              width: panelWidth,
              borderRight: "1px solid #2C2E33",
              overflowY: "auto",
              overflowX: "hidden",
              padding: "16px 20px",
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: 11, color: "#5C5F66", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 8 }}>
              Brand
            </div>
            <ComponentSelect
              options={brandNames}
              value={activeBrand}
              displayValue={brand.name}
              onChange={handleBrandChange}
              placeholder="Search brands..."
              onAdd={addBrand}
              addLabel="+ New brand"
            />
            <div style={{ marginTop: 20 }} />
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

            <Section title={`Color Tokens — ${activeComponent}`}>
              {Object.entries(colorTokens).map(([token, def]) => {
                const semantic = def.semantic;
                const mapping = brand.semanticMap[semantic];
                if (!mapping) return null;
                const isActive = activeColorToken === token;
                return (
                  <TokenChainCard
                    key={token}
                    componentToken={token}
                    semanticToken={semantic}
                    mapping={mapping}
                    resolvedColor={resolveColor(brands, activeBrand, semantic)}
                    isActive={isActive}
                    onClick={() => setActiveColorToken(isActive ? null : token)}
                    onUpdate={updateSemantic}
                    colors={colorNames}
                  />
                );
              })}
            </Section>

            <Section title={`Dimension Tokens — ${activeComponent}`}>
              {Object.entries(dimensionTokens).map(([token, def]) => {
                const isActive = activeDimensionToken === token;
                return (
                  <DimensionTokenRow
                    key={token}
                    tokenName={token}
                    tokenDef={def}
                    brands={brands}
                    brandId={activeBrand}
                    sizeKeys={sizeKeys}
                    onUpdateDimension={updateDimensionOverride}
                    isActive={isActive}
                    onClick={() => setActiveDimensionToken(isActive ? null : token)}
                  />
                );
              })}
            </Section>
          </div>
        )}

        {/* Drag Handle */}
        {activeTab === "preview" && (
          <div
            onMouseDown={handlePanelDrag}
            style={{
              width: 4,
              cursor: "col-resize",
              flexShrink: 0,
              background: "transparent",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#373A40")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          />
        )}

        {/* Center Panel — Preview */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          <div
            style={{
              background: "#25262B",
              borderRadius: 8,
              padding: 24,
            }}
          >
            {activeTab === "preview" && activeComponent === "button" && (
              <ButtonPreviewPanel
                brands={brands}
                activeBrand={activeBrand}
                activeVariant={forcedVariant || activeVariant}
                setActiveVariant={setActiveVariant}
                activeSize={activeSize}
                setActiveSize={setActiveSize}
                sizeKeys={sizeKeys}
                forcedState={forcedState}
                activeColorToken={activeColorToken}
              />
            )}

            {activeTab === "preview" && activeComponent === "switch" && (
              <SwitchPreviewPanel
                brands={brands}
                activeBrand={activeBrand}
                activeSwitchSize={activeSwitchSize}
                setActiveSwitchSize={setActiveSwitchSize}
                sizeKeys={sizeKeys}
                forcedChecked={forcedChecked}
                activeColorToken={activeColorToken}
              />
            )}

            {activeTab === "preview" && activeComponent === "checkbox" && (
              <CheckboxPreviewPanel
                brands={brands}
                activeBrand={activeBrand}
                activeCheckboxSize={activeCheckboxSize}
                setActiveCheckboxSize={setActiveCheckboxSize}
                sizeKeys={sizeKeys}
                forcedChecked={forcedChecked}
                forcedIndeterminate={forcedIndeterminate}
                activeColorToken={activeColorToken}
              />
            )}

            {activeTab === "preview" && activeComponent === "radio" && (
              <RadioPreviewPanel
                brands={brands}
                activeBrand={activeBrand}
                activeVariant={forcedVariant || activeVariant}
                setActiveVariant={setActiveVariant}
                activeRadioSize={activeRadioSize}
                setActiveRadioSize={setActiveRadioSize}
                sizeKeys={sizeKeys}
                forcedChecked={forcedChecked}
                activeColorToken={activeColorToken}
              />
            )}

            {activeTab === "preview" && activeComponent === "chip" && (
              <ChipPreviewPanel
                brands={brands}
                activeBrand={activeBrand}
                activeVariant={forcedVariant || activeVariant}
                setActiveVariant={setActiveVariant}
                activeChipSize={activeChipSize}
                setActiveChipSize={setActiveChipSize}
                activeChipRadius={activeChipRadius}
                setActiveChipRadius={setActiveChipRadius}
                sizeKeys={sizeKeys}
                forcedChecked={forcedChecked}
                activeColorToken={activeColorToken}
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
                activeVariant={forcedVariant || activeVariant}
                setActiveVariant={setActiveVariant}
                activeTextInputSize={activeTextInputSize}
                setActiveTextInputSize={setActiveTextInputSize}
                activeTextInputRadius={activeTextInputRadius}
                setActiveTextInputRadius={setActiveTextInputRadius}
                sizeKeys={sizeKeys}
                forcedState={forcedState}
                activeColorToken={activeColorToken}
              />
            )}

            {/* EXPORT TAB */}
            {activeTab === "export" && (
              <div>
                <div style={{ fontSize: 11, color: "#5C5F66", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                  Figma Sync
                </div>
                <p style={{ fontSize: 13, color: "#868E96", marginBottom: 16, lineHeight: 1.5 }}>
                  Sync resolved token data to Figma variables via the relay server.
                </p>
                <FigmaSyncButton brands={brands} />

                <div style={{ borderTop: "1px solid #2C2E33", marginTop: 20, paddingTop: 20 }}>
                  <div style={{ fontSize: 11, color: "#5C5F66", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                    Markdown Export
                  </div>
                  <p style={{ fontSize: 13, color: "#868E96", marginBottom: 16, lineHeight: 1.5 }}>
                    Download a markdown reference of all tokens, brand primitives, semantic mappings, and component definitions.
                  </p>
                  <button
                    onClick={handleMarkdownExport}
                    style={{ background: "#25262B", border: "1px solid #373A40", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#C1C2C5", cursor: "pointer", fontFamily: "monospace" }}
                  >
                    Download Markdown
                  </button>
                </div>

                <div style={{ borderTop: "1px solid #2C2E33", marginTop: 20, paddingTop: 20 }}>
                  <div style={{ fontSize: 11, color: "#5C5F66", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                    Storybook Export
                  </div>
                  <p style={{ fontSize: 13, color: "#868E96", marginBottom: 16, lineHeight: 1.5 }}>
                    Launch a live Storybook with all components, tokens, and a brand switcher toolbar.
                  </p>
                  <button
                    onClick={handleStorybookExport}
                    disabled={storybookLoading}
                    style={{ background: storybookLoading ? "#1971C2" : "#228BE6", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#fff", cursor: storybookLoading ? "wait" : "pointer", fontFamily: "monospace", opacity: storybookLoading ? 0.8 : 1 }}
                  >
                    {storybookLoading ? "Launching Storybook..." : "Launch Storybook"}
                  </button>
                  {storybookError && (
                    <p style={{ fontSize: 12, color: "#FA5252", marginTop: 8 }}>{storybookError}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Nav — Component List (Preview tab only) */}
        {activeTab === "preview" && (
          <div
          style={{
            width: 180,
            borderLeft: "1px solid #2C2E33",
            overflowY: "auto",
            padding: "16px 12px",
            flexShrink: 0,
          }}
        >
          <div>
            {COMPONENT_NAMES.map((name) => (
              <button
                key={name}
                onClick={() => handleComponentChange(name)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: activeComponent === name ? "#25262B" : "transparent",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 12px",
                  fontSize: 13,
                  fontWeight: activeComponent === name ? 600 : 400,
                  color: activeComponent === name ? "#E9ECEF" : "#909296",
                  cursor: "pointer",
                  textTransform: "capitalize",
                  marginBottom: 2,
                }}
                onMouseEnter={(e) => {
                  if (activeComponent !== name)
                    e.currentTarget.style.background = "#2C2E33";
                }}
                onMouseLeave={(e) => {
                  if (activeComponent !== name)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
