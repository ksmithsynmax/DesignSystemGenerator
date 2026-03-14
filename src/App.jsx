import { useState, useCallback, useEffect } from "react";
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
import AddPrimitiveForm from "./components/editors/AddPrimitiveForm";
import {
  ButtonPreviewContent,
  ButtonPropertiesPanel,
} from "./components/panels/ButtonPreviewPanel";
import {
  ActionIconPreviewContent,
  ActionIconPropertiesPanel,
} from "./components/panels/ActionIconPreviewPanel";
import {
  TabsPreviewContent,
  TabsPropertiesPanel,
} from "./components/panels/TabsPreviewPanel";
import SwitchPreviewPanel from "./components/panels/SwitchPreviewPanel";
import CheckboxPreviewPanel from "./components/panels/CheckboxPreviewPanel";
import RadioPreviewPanel from "./components/panels/RadioPreviewPanel";
import ChipPreviewPanel from "./components/panels/ChipPreviewPanel";
import TooltipPreviewPanel from "./components/panels/TooltipPreviewPanel";
import TextInputPreviewPanel from "./components/panels/TextInputPreviewPanel";
import FigmaSyncButton from "./components/FigmaSyncButton";
import { buildMarkdownExport } from "./utils/buildMarkdownExport";
import { GLOBAL_PRIMITIVES } from "./data/brands";

const VARIANTS_BY_COMPONENT = {
  button: ["filled", "outlined", "ghost"],
  actionicon: ["default", "filled", "light", "outlined", "transparent"],
  tabs: ["default", "outlined", "pills"],
  checkbox: ["filled", "outlined"],
  chip: ["filled", "light", "outline"],
  radio: ["filled", "outline"],
  textinput: ["default", "filled"],
};

export default function App() {
  const COMPONENT_LABELS = {
    actionicon: "ActionIcon",
    textinput: "TextInput",
  };
  const getComponentLabel = (name) =>
    COMPONENT_LABELS[name] || name.charAt(0).toUpperCase() + name.slice(1);

  const [brands, setBrands] = useState(INITIAL_BRANDS);
  const [activeBrand, setActiveBrand] = useState("theia");
  const [activeComponent, setActiveComponent] = useState("button");
  const [activeVariant, setActiveVariant] = useState("filled");
  const [activeTab, setActiveTab] = useState("preview");
  const [storybookLoading, setStorybookLoading] = useState(false);
  const [storybookError, setStorybookError] = useState(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(420);
  const [previewPanelWidth, setPreviewPanelWidth] = useState(640);
  const [propertiesPanelWidth, setPropertiesPanelWidth] = useState(300);
  const componentsPanelWidth = 260;
  const [activeColorToken, setActiveColorToken] = useState(null);
  const [activeDimensionToken, setActiveDimensionToken] = useState(null);
  const [activeButtonState, setActiveButtonState] = useState("default");
  const [activeActionIconState, setActiveActionIconState] = useState("default");

  const createResizeHandler = useCallback((setter, min, max) => {
    return (e) => {
      e.preventDefault();
      const startX = e.clientX;
      let startWidth = 0;
      setter((curr) => {
        startWidth = curr;
        return curr;
      });

      const onMove = (ev) => {
        const next = Math.min(max, Math.max(min, startWidth + ev.clientX - startX));
        setter(next);
      };

      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    };
  }, []);

  const handleLeftPanelDrag = createResizeHandler(setLeftPanelWidth, 300, 760);
  const handlePreviewPanelDrag = createResizeHandler(setPreviewPanelWidth, 420, 1200);
  const handlePropertiesPanelDrag = createResizeHandler(setPropertiesPanelWidth, 240, 520);

  const brand = brands[activeBrand];
  const colorNames = Object.keys(brand.primitives);
  const globalColorNames = Object.keys(GLOBAL_PRIMITIVES);
  const sizeKeys = COMPONENT_SIZE_KEYS[activeComponent] || [];

  // Derive default size per component from brand data
  const buttonDefault = getComponentDefaultSize(brands, activeBrand, "button") || "sm";
  const actionIconDefault = getComponentDefaultSize(brands, activeBrand, "actionicon") || "sm";
  const tabsDefault = getComponentDefaultSize(brands, activeBrand, "tabs") || "sm";
  const switchDefault = getComponentDefaultSize(brands, activeBrand, "switch") || "md";
  const checkboxDefault = getComponentDefaultSize(brands, activeBrand, "checkbox") || "md";
  const radioDefault = getComponentDefaultSize(brands, activeBrand, "radio") || "md";
  const chipDefault = getComponentDefaultSize(brands, activeBrand, "chip") || "md";
  const textInputDefault = getComponentDefaultSize(brands, activeBrand, "textinput") || "sm";

  const [activeSize, setActiveSize] = useState(buttonDefault);
  const [activeActionIconSize, setActiveActionIconSize] = useState(actionIconDefault);
  const [activeActionIconRadius, setActiveActionIconRadius] = useState(actionIconDefault);
  const [activeActionIconIcon, setActiveActionIconIcon] = useState("check");
  const [activeTabsRadius, setActiveTabsRadius] = useState(tabsDefault);
  const [activeTabsOrientation, setActiveTabsOrientation] = useState("horizontal");
  const [activeTabsShowPanel, setActiveTabsShowPanel] = useState(false);
  const [activeTabsShowIcons, setActiveTabsShowIcons] = useState(false);
  const [activeTabsState, setActiveTabsState] = useState("default");
  const [activeSwitchSize, setActiveSwitchSize] = useState(switchDefault);
  const [activeCheckboxSize, setActiveCheckboxSize] = useState(checkboxDefault);
  const [activeCheckboxRadius, setActiveCheckboxRadius] = useState(checkboxDefault);
  const [activeRadioSize, setActiveRadioSize] = useState(radioDefault);
  const [activeChipSize, setActiveChipSize] = useState(chipDefault);
  const [activeChipRadius, setActiveChipRadius] = useState(chipDefault);
  const [activeTextInputSize, setActiveTextInputSize] = useState(textInputDefault);
  const [activeTextInputRadius, setActiveTextInputRadius] = useState(textInputDefault);

  // Sync active sizes when brand changes
  const handleBrandChange = useCallback((newBrand) => {
    setActiveBrand(newBrand);
    const btnDef = getComponentDefaultSize(brands, newBrand, "button") || "sm";
    const aiDef = getComponentDefaultSize(brands, newBrand, "actionicon") || "sm";
    const tbDef = getComponentDefaultSize(brands, newBrand, "tabs") || "sm";
    const swDef = getComponentDefaultSize(brands, newBrand, "switch") || "md";
    const cbDef = getComponentDefaultSize(brands, newBrand, "checkbox") || "md";
    const rdDef = getComponentDefaultSize(brands, newBrand, "radio") || "md";
    const chDef = getComponentDefaultSize(brands, newBrand, "chip") || "md";
    setActiveSize(btnDef);
    setActiveActionIconSize(aiDef);
    setActiveActionIconRadius(aiDef);
    setActiveTabsRadius(tbDef);
    setActiveSwitchSize(swDef);
    setActiveCheckboxSize(cbDef);
    setActiveCheckboxRadius(cbDef);
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
      setActiveVariant("filled");
      setActiveButtonState("default");
    } else if (newComp === "actionicon") {
      setActiveActionIconSize(actionIconDefault);
      setActiveActionIconRadius(actionIconDefault);
      setActiveVariant("default");
      setActiveActionIconState("default");
    } else if (newComp === "tabs") {
      setActiveTabsRadius(tabsDefault);
      setActiveTabsOrientation("horizontal");
      setActiveTabsShowPanel(false);
      setActiveTabsShowIcons(false);
      setActiveTabsState("default");
      setActiveVariant("default");
    } else if (newComp === "switch") {
      setActiveSwitchSize(switchDefault);
    } else if (newComp === "checkbox") {
      setActiveCheckboxSize(checkboxDefault);
      setActiveCheckboxRadius(checkboxDefault);
      setActiveVariant("filled");
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
  }, [actionIconDefault, buttonDefault, tabsDefault, switchDefault, checkboxDefault, radioDefault, chipDefault, textInputDefault]);

  useEffect(() => {
    const allowedVariants = VARIANTS_BY_COMPONENT[activeComponent];
    if (!allowedVariants) return;
    if (!allowedVariants.includes(activeVariant)) {
      setActiveVariant(allowedVariants[0]);
    }
  }, [activeComponent, activeVariant]);

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

  const addPrimitive = useCallback(
    (colorName, scale) => {
      setBrands((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        next[activeBrand].primitives[colorName] = scale;
        return next;
      });
    },
    [activeBrand]
  );

  const updateComponentOverride = useCallback(
    (componentToken, mapping) => {
      setBrands((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        if (!next[activeBrand].componentOverrides) next[activeBrand].componentOverrides = {};
        next[activeBrand].componentOverrides[componentToken] = mapping;
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
  const INTERACTIVE_STATES = ["active", "hover", "focus", "pressed", "disabled", "error"];
  let forcedState = null;
  let forcedChecked = null;
  let forcedIndeterminate = false;
  let forcedVariant = null;

  if (activeColorToken) {
    const parts = activeColorToken.split("-");
    const last = parts[parts.length - 1];

    if (INTERACTIVE_STATES.includes(last)) {
      forcedState = last;
    }

    if (parts.includes("checked")) {
      forcedChecked = true;
    }
    if (parts.includes("indeterminate")) {
      forcedIndeterminate = true;
    }

    if (["button", "actionicon", "tabs", "checkbox", "chip", "radio", "textinput"].includes(activeComponent)) {
      const variantSegment = parts[1];
      const knownVariants = {
        button: ["filled", "outlined", "ghost"],
        actionicon: ["default", "filled", "light", "outlined", "transparent"],
        tabs: ["default", "outlined", "pills"],
        checkbox: ["filled", "outlined"],
        chip: ["filled", "light", "outline"],
        radio: ["filled", "outline"],
        textinput: ["default", "filled"],
      };
      if (knownVariants[activeComponent]?.includes(variantSegment)) {
        forcedVariant = variantSegment;
      }
    }
  }

  const effectiveComponentState =
    activeComponent === "button"
      ? forcedState || activeButtonState
      : activeComponent === "actionicon"
        ? forcedState || activeActionIconState
        : activeComponent === "tabs"
          ? forcedState || activeTabsState
          : forcedState;

  const visibleColorTokenEntries = Object.entries(colorTokens).filter(([token]) => {
    const parts = token.split("-");
    const variantSegment = parts[1];
    const variantsByComponent = {
      button: ["filled", "outlined", "ghost"],
      actionicon: ["default", "filled", "light", "outlined", "transparent"],
      tabs: ["default", "outlined", "pills"],
      checkbox: ["filled", "outlined"],
    };
    const variants = variantsByComponent[activeComponent];
    if (!variants) return true;
    if (activeComponent === "checkbox") {
      const checkboxSharedSegments = ["focus", "label"];
      if (!variants.includes(variantSegment)) {
        return checkboxSharedSegments.includes(variantSegment);
      }
      return variantSegment === activeVariant;
    }
    if (activeComponent === "button" || activeComponent === "actionicon" || activeComponent === "tabs") {
      if (!variants.includes(variantSegment)) return true;
      if (variantSegment !== activeVariant) return false;
      const tokenState = INTERACTIVE_STATES.includes(parts[parts.length - 1])
        ? parts[parts.length - 1]
        : "default";
      return tokenState === (effectiveComponentState || "default");
    }

    // Keep shared component tokens and only active variant tokens.
    if (!variants.includes(variantSegment)) return true;
    return variantSegment === activeVariant;
  });

  useEffect(() => {
    if (!activeColorToken) return;
    const parts = activeColorToken.split("-");
    const variantSegment = parts[1];
    const variantsByComponent = {
      button: ["filled", "outlined", "ghost"],
      actionicon: ["default", "filled", "light", "outlined", "transparent"],
      tabs: ["default", "outlined", "pills"],
      checkbox: ["filled", "outlined"],
    };
    const variants = variantsByComponent[activeComponent];
    if (!variants) return;
    if (variants.includes(variantSegment) && variantSegment !== activeVariant) {
      setActiveColorToken(null);
    }
  }, [activeComponent, activeColorToken, activeVariant]);

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

  const activeSizeByComponent = {
    button: activeSize,
    actionicon: activeActionIconSize,
    switch: activeSwitchSize,
    checkbox: activeCheckboxSize,
    radio: activeRadioSize,
    chip: activeChipSize,
    textinput: activeTextInputSize,
  };
  const activeDimensionSize = activeSizeByComponent[activeComponent] || sizeKeys[0];
  const getSelectedDimensionSize = (tokenName) => {
    if (activeComponent === "actionicon" && tokenName === "actionicon-radius") {
      return activeActionIconRadius;
    }
    if (activeComponent === "checkbox" && tokenName === "checkbox-radius") {
      return activeCheckboxRadius;
    }
    if (activeComponent === "textinput" && tokenName === "textinput-radius") {
      return activeTextInputRadius;
    }
    if (activeComponent === "tabs" && tokenName === "tabs-radius") {
      return activeTabsRadius;
    }
    if (activeComponent === "chip" && tokenName === "chip-radius") {
      return activeChipRadius;
    }
    return activeDimensionSize;
  };

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

      {activeTab === "preview" ? (
        <div style={{ display: "flex", flex: 1, minHeight: 0, overflowX: "auto" }}>
          <div
            style={{
              width: leftPanelWidth,
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
              <AddPrimitiveForm existingNames={colorNames} onAdd={addPrimitive} />
            </Section>
            <Section title="Primitives — Global" defaultOpen={false}>
              {globalColorNames.map((c) => (
                <PrimitiveScale key={c} name={c} scale={GLOBAL_PRIMITIVES[c]} readOnly />
              ))}
            </Section>
            <Section title={`Color Tokens — ${getComponentLabel(activeComponent)}`}>
              {visibleColorTokenEntries.map(([token, def]) => {
                const semantic = def.semantic;
                const mapping = brand.semanticMap[semantic];
                if (!mapping) return null;
                const isActive = activeColorToken === token;
                return (
                  <TokenChainCard
                    key={token}
                    componentToken={token}
                    semanticToken={semantic}
                    mapping={brand.componentOverrides?.[token] ?? mapping}
                    resolvedColor={resolveColor(brands, activeBrand, semantic, "light", token)}
                    isActive={isActive}
                    onClick={() => setActiveColorToken(isActive ? null : token)}
                    onUpdate={updateComponentOverride}
                    brandColors={colorNames}
                    globalColors={globalColorNames}
                  />
                );
              })}
            </Section>
            <Section title={`Dimension Tokens — ${getComponentLabel(activeComponent)}`}>
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
                    selectedSize={getSelectedDimensionSize(token)}
                    onUpdateDimension={updateDimensionOverride}
                    isActive={isActive}
                    onClick={() => setActiveDimensionToken(isActive ? null : token)}
                  />
                );
              })}
            </Section>
          </div>

          <div
            onMouseDown={handleLeftPanelDrag}
            style={{ width: 4, cursor: "col-resize", flexShrink: 0, background: "transparent", transition: "background 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#373A40")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          />

          <div style={{ width: previewPanelWidth, overflowY: "auto", padding: "24px 32px", flexShrink: 0 }}>
            <div style={{ background: "#25262B", borderRadius: 8, padding: 24 }}>
              {activeComponent === "button" && (
                <ButtonPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeVariant={forcedVariant || activeVariant}
                  activeSize={activeSize}
                  selectedState={forcedState || activeButtonState}
                  activeColorToken={activeColorToken}
                  sizeKeys={sizeKeys}
                />
              )}

              {activeComponent === "actionicon" && (
                <ActionIconPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeVariant={forcedVariant || activeVariant}
                  activeActionIconSize={activeActionIconSize}
                  activeActionIconRadius={activeActionIconRadius}
                  activeActionIconIcon={activeActionIconIcon}
                  selectedState={forcedState || activeActionIconState}
                  activeColorToken={activeColorToken}
                  sizeKeys={sizeKeys}
                />
              )}

              {activeComponent === "tabs" && (
                <TabsPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeVariant={forcedVariant || activeVariant}
                  activeTabsRadius={activeTabsRadius}
                  activeTabsOrientation={activeTabsOrientation}
                  selectedState={forcedState || activeTabsState}
                  activeColorToken={activeColorToken}
                  showPanel={activeTabsShowPanel}
                  showIcons={activeTabsShowIcons}
                />
              )}

              {activeComponent === "switch" && (
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

              {activeComponent === "checkbox" && (
                <CheckboxPreviewPanel
                  brands={brands}
                  activeBrand={activeBrand}
                  activeVariant={forcedVariant || activeVariant}
                  setActiveVariant={setActiveVariant}
                  activeCheckboxSize={activeCheckboxSize}
                  setActiveCheckboxSize={setActiveCheckboxSize}
                  activeCheckboxRadius={activeCheckboxRadius}
                  setActiveCheckboxRadius={setActiveCheckboxRadius}
                  sizeKeys={sizeKeys}
                  forcedChecked={forcedChecked}
                  forcedIndeterminate={forcedIndeterminate}
                  activeColorToken={activeColorToken}
                />
              )}

              {activeComponent === "radio" && (
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

              {activeComponent === "chip" && (
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

              {activeComponent === "tooltip" && (
                <TooltipPreviewPanel brands={brands} activeBrand={activeBrand} />
              )}

              {activeComponent === "textinput" && (
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
            </div>
          </div>

          <div
            onMouseDown={handlePreviewPanelDrag}
            style={{ width: 4, cursor: "col-resize", flexShrink: 0, background: "transparent", transition: "background 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#373A40")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          />

          <div
            style={{
              width: propertiesPanelWidth,
              borderLeft: "1px solid #2C2E33",
              borderRight: "1px solid #2C2E33",
              overflowY: "auto",
              padding: "16px 12px",
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: 11, color: "#5C5F66", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 8 }}>
              Properties
            </div>
            <div>
              {activeComponent === "button" && (
                <ButtonPropertiesPanel
                  activeVariant={forcedVariant || activeVariant}
                  setActiveVariant={setActiveVariant}
                  activeSize={activeSize}
                  setActiveSize={setActiveSize}
                  sizeKeys={sizeKeys}
                  selectedState={forcedState || activeButtonState}
                  setSelectedState={setActiveButtonState}
                  forcedState={forcedState}
                />
              )}
              {activeComponent === "actionicon" && (
                <ActionIconPropertiesPanel
                  activeVariant={forcedVariant || activeVariant}
                  setActiveVariant={setActiveVariant}
                  activeActionIconSize={activeActionIconSize}
                  setActiveActionIconSize={setActiveActionIconSize}
                  activeActionIconRadius={activeActionIconRadius}
                  setActiveActionIconRadius={setActiveActionIconRadius}
                  activeActionIconIcon={activeActionIconIcon}
                  setActiveActionIconIcon={setActiveActionIconIcon}
                  sizeKeys={sizeKeys}
                  selectedState={forcedState || activeActionIconState}
                  setSelectedState={setActiveActionIconState}
                  forcedState={forcedState}
                />
              )}
              {activeComponent === "tabs" && (
                <TabsPropertiesPanel
                  activeVariant={forcedVariant || activeVariant}
                  setActiveVariant={setActiveVariant}
                  activeTabsRadius={activeTabsRadius}
                  setActiveTabsRadius={setActiveTabsRadius}
                  activeTabsOrientation={activeTabsOrientation}
                  setActiveTabsOrientation={setActiveTabsOrientation}
                  showPanel={activeTabsShowPanel}
                  setShowPanel={setActiveTabsShowPanel}
                  showIcons={activeTabsShowIcons}
                  setShowIcons={setActiveTabsShowIcons}
                  selectedState={forcedState || activeTabsState}
                  setSelectedState={setActiveTabsState}
                  forcedState={forcedState}
                />
              )}
              {!["button", "actionicon", "tabs"].includes(activeComponent) && (
                <div style={{ fontSize: 12, color: "#868E96", lineHeight: 1.5 }}>
                  Properties for this component are currently shown in the preview column.
                </div>
              )}
            </div>
          </div>

          <div
            onMouseDown={handlePropertiesPanelDrag}
            style={{ width: 4, cursor: "col-resize", flexShrink: 0, background: "transparent", transition: "background 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#373A40")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          />

          <div
            style={{
              width: componentsPanelWidth,
              overflowY: "auto",
              padding: "16px 12px",
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: 11, color: "#5C5F66", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 8 }}>
              Components
            </div>
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
                    boxSizing: "border-box",
                    fontSize: 13,
                    fontWeight: activeComponent === name ? 600 : 400,
                    color: activeComponent === name ? "#E9ECEF" : "#909296",
                    cursor: "pointer",
                    marginBottom: 2,
                  }}
                  onMouseEnter={(e) => {
                    if (activeComponent !== name) e.currentTarget.style.background = "#2C2E33";
                  }}
                  onMouseLeave={(e) => {
                    if (activeComponent !== name) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {getComponentLabel(name)}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          <div
            style={{
              background: "#25262B",
              borderRadius: 8,
              padding: 24,
              maxWidth: 720,
              margin: "0 auto",
            }}
          >
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
          </div>
        </div>
      )}
    </div>
  );
}
