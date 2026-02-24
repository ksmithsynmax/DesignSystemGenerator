import { useState, useCallback } from "react";
import { INITIAL_BRANDS } from "./data/brands";
import {
  COMPONENT_TOKENS,
  COMPONENT_NAMES,
  COMPONENT_SIZE_KEYS,
  TOKEN_TYPES,
  getColorTokens,
  getDimensionTokens,
} from "./data/componentTokens";
import { resolveColor, resolveDimension, getComponentDefaultSize } from "./utils/resolveToken";
import Section from "./components/shared/Section";
import Tag from "./components/shared/Tag";
import ComponentSelect from "./components/shared/ComponentSelect";
import PrimitiveScale from "./components/editors/PrimitiveScale";
import SemanticRow from "./components/editors/SemanticRow";
import ComponentTokenRow from "./components/editors/ComponentTokenRow";
import DimensionTokenRow from "./components/editors/DimensionTokenRow";
import ButtonPreview from "./components/previews/ButtonPreview";
import SwitchPreview from "./components/previews/SwitchPreview";
import CheckboxPreview from "./components/previews/CheckboxPreview";
import TokenChain from "./components/TokenChain";
import FigmaSyncButton from "./components/FigmaSyncButton";

const BUTTON_VARIANTS = ["filled", "outlined", "ghost"];

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

  const [activeSize, setActiveSize] = useState(buttonDefault);
  const [activeSwitchSize, setActiveSwitchSize] = useState(switchDefault);
  const [activeCheckboxSize, setActiveCheckboxSize] = useState(checkboxDefault);

  // Sync active sizes when brand changes
  const handleBrandChange = useCallback((newBrand) => {
    setActiveBrand(newBrand);
    const btnDef = getComponentDefaultSize(brands, newBrand, "button") || "sm";
    const swDef = getComponentDefaultSize(brands, newBrand, "switch") || "md";
    const cbDef = getComponentDefaultSize(brands, newBrand, "checkbox") || "md";
    setActiveSize(btnDef);
    setActiveSwitchSize(swDef);
    setActiveCheckboxSize(cbDef);
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
    }
  }, [buttonDefault, switchDefault, checkboxDefault]);

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

  return (
    <div
      style={{
        background: "#1A1B1E",
        color: "#C1C2C5",
        minHeight: "100vh",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#E9ECEF" }}>
            Token Pipeline
          </span>
          <Tag color="#868E96">POC — Button + Switch + Checkbox</Tag>
        </div>
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

      <div style={{ display: "flex", height: "calc(100vh - 57px)" }}>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Syntax Highlighting ---------- */

function highlightCode(code) {
  const tokens = [];
  let i = 0;

  while (i < code.length) {
    // Whitespace
    if (/\s/.test(code[i])) {
      let j = i;
      while (j < code.length && /\s/.test(code[j])) j++;
      tokens.push({ t: code.slice(i, j), c: null });
      i = j;
      continue;
    }
    // Strings
    if (code[i] === '"' || code[i] === "'") {
      const q = code[i];
      let j = i + 1;
      while (j < code.length && code[j] !== q) j++;
      tokens.push({ t: code.slice(i, j + 1), c: "#98C379" });
      i = j + 1;
      continue;
    }
    // JSX tag: <Component or </Component
    if (code[i] === "<" && /[A-Z/]/.test(code[i + 1] || "")) {
      let j = i + 1;
      if (code[j] === "/") j++;
      if (/[A-Z]/.test(code[j] || "")) {
        let k = j;
        while (k < code.length && /\w/.test(code[k])) k++;
        tokens.push({ t: code.slice(i, j), c: "#ABB2BF" });
        tokens.push({ t: code.slice(j, k), c: "#E06C75" });
        i = k;
        continue;
      }
    }
    // Self-closing />
    if (code[i] === "/" && code[i + 1] === ">") {
      tokens.push({ t: "/>", c: "#ABB2BF" });
      i += 2;
      continue;
    }
    // Closing >
    if (code[i] === ">") {
      tokens.push({ t: ">", c: "#ABB2BF" });
      i++;
      continue;
    }
    // Words (keywords, identifiers, attributes)
    if (/[a-zA-Z_$]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[\w$-]/.test(code[j])) j++;
      const word = code.slice(i, j);
      const keywords = ["import", "from", "export", "const", "let", "return", "true", "false", "undefined", "null"];
      if (keywords.includes(word)) {
        tokens.push({ t: word, c: "#C678DD" });
      } else {
        // Look ahead for = to detect attributes
        let k = j;
        while (k < code.length && code[k] === " ") k++;
        if (code[k] === "=") {
          tokens.push({ t: word, c: "#D19A66" });
        } else {
          tokens.push({ t: word, c: "#E06C75" });
        }
      }
      i = j;
      continue;
    }
    // Numbers
    if (/\d/.test(code[i])) {
      let j = i;
      while (j < code.length && /[\d.]/.test(code[j])) j++;
      tokens.push({ t: code.slice(i, j), c: "#D19A66" });
      i = j;
      continue;
    }
    // Punctuation
    tokens.push({ t: code[i], c: "#56B6C2" });
    i++;
  }

  return tokens.map((tk, idx) => (
    <span key={idx} style={tk.c ? { color: tk.c } : undefined}>{tk.t}</span>
  ));
}

/* ---------- Button Preview Panel ---------- */

const BTN_VARIANT_MAP = { filled: "filled", outlined: "outline", ghost: "subtle" };

function ButtonPreviewPanel({
  brands,
  activeBrand,
  activeVariant,
  setActiveVariant,
  activeSize,
  setActiveSize,
  sizeKeys,
}) {
  const [copied, setCopied] = useState(false);

  const tokens = COMPONENT_TOKENS.button;
  const mantineVariant = BTN_VARIANT_MAP[activeVariant] || "filled";

  const codeString = `import { Button } from "@mantine/core";

<Button variant="${mantineVariant}" size="${activeSize}">
  Button
</Button>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Build resolved variables list
  const resolvedVars = [];
  for (const [name, def] of Object.entries(tokens)) {
    if (def.type === TOKEN_TYPES.COLOR) {
      const resolved = resolveColor(brands, activeBrand, def.semantic);
      resolvedVars.push({ name, type: "COLOR", value: resolved, figmaPath: def.figmaPath });
    } else if (def.type === TOKEN_TYPES.FLOAT || def.type === TOKEN_TYPES.STRING) {
      const hasSizes = !!def.sizes;
      const resolved = hasSizes
        ? resolveDimension(brands, activeBrand, name, activeSize)
        : resolveDimension(brands, activeBrand, name);
      const display = def.unit ? `${resolved}${def.unit}` : String(resolved);
      const displayName = hasSizes ? `${name}-${activeSize}` : name;
      const displayPath = hasSizes ? `${def.figmaPath}-${activeSize}` : def.figmaPath;
      resolvedVars.push({ name: displayName, type: def.type, value: display, figmaPath: displayPath });
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
        <div>
          <div
            style={{
              fontSize: 11,
              color: "#5C5F66",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontWeight: 600,
            }}
          >
            Variant
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {BUTTON_VARIANTS.map((v) => (
              <button
                key={v}
                onClick={() => setActiveVariant(v)}
                style={{
                  background:
                    activeVariant === v ? "#373A40" : "transparent",
                  color: activeVariant === v ? "#E9ECEF" : "#5C5F66",
                  border: "1px solid #373A40",
                  borderRadius: 4,
                  padding: "4px 12px",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "monospace",
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              color: "#5C5F66",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontWeight: 600,
            }}
          >
            Size
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {sizeKeys.map((s) => (
              <button
                key={s}
                onClick={() => setActiveSize(s)}
                style={{
                  background:
                    activeSize === s ? "#373A40" : "transparent",
                  color: activeSize === s ? "#E9ECEF" : "#5C5F66",
                  border: "1px solid #373A40",
                  borderRadius: 4,
                  padding: "4px 10px",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "monospace",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Single button preview */}
      <div
        style={{
          background: "#1A1B1E",
          borderRadius: 8,
          padding: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <ButtonPreview
          brands={brands}
          brandId={activeBrand}
          variant={activeVariant}
          size={activeSize}
        />
      </div>

      {/* All variants x sizes matrix */}
      <div
        style={{
          fontSize: 11,
          color: "#5C5F66",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontWeight: 600,
        }}
      >
        All Variants x Sizes
      </div>
      <div
        style={{
          background: "#1A1B1E",
          borderRadius: 8,
          padding: 20,
          overflowX: "auto",
          marginBottom: 24,
        }}
      >
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "6px 12px",
                  fontSize: 11,
                  color: "#5C5F66",
                  fontFamily: "monospace",
                }}
              />
              {sizeKeys.map((s) => (
                <th
                  key={s}
                  style={{
                    textAlign: "center",
                    padding: "6px 12px",
                    fontSize: 11,
                    color: "#5C5F66",
                    fontFamily: "monospace",
                  }}
                >
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BUTTON_VARIANTS.map((v) => (
              <tr key={v}>
                <td
                  style={{
                    padding: "10px 12px",
                    fontSize: 12,
                    fontFamily: "monospace",
                    color: "#868E96",
                    fontWeight: 500,
                  }}
                >
                  {v}
                </td>
                {sizeKeys.map((s) => (
                  <td
                    key={s}
                    style={{ padding: "10px 12px", textAlign: "center" }}
                  >
                    <ButtonPreview
                      brands={brands}
                      brandId={activeBrand}
                      variant={v}
                      size={s}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Component Code */}
      <div
        style={{
          fontSize: 11,
          color: "#5C5F66",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontWeight: 600,
        }}
      >
        Component Code — {activeVariant} / {activeSize}
      </div>
      <div
        style={{
          position: "relative",
          background: "#1A1B1E",
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <button
          onClick={handleCopy}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: copied ? "#2F9E44" : "#373A40",
            color: copied ? "#fff" : "#C1C2C5",
            border: "none",
            borderRadius: 4,
            padding: "4px 10px",
            fontSize: 11,
            cursor: "pointer",
            transition: "background 0.2s",
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <pre
          style={{
            margin: 0,
            color: "#C1C2C5",
            fontSize: 12,
            fontFamily: "monospace",
            lineHeight: 1.5,
            overflowX: "auto",
            whiteSpace: "pre",
          }}
        >
          {highlightCode(codeString)}
        </pre>
      </div>

      {/* Resolved Variables */}
      <div
        style={{
          fontSize: 11,
          color: "#5C5F66",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontWeight: 600,
        }}
      >
        Resolved Variables — {activeVariant} / {activeSize}
      </div>
      <div
        style={{
          background: "#1A1B1E",
          borderRadius: 8,
          padding: 16,
          overflowX: "auto",
        }}
      >
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              {["Token", "Type", "Value", "Figma Path"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "6px 10px",
                    fontSize: 10,
                    color: "#5C5F66",
                    fontFamily: "monospace",
                    borderBottom: "1px solid #2C2E33",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resolvedVars.map((v) => (
              <tr key={v.name}>
                <td
                  style={{
                    padding: "5px 10px",
                    fontSize: 11,
                    fontFamily: "monospace",
                    color: "#C1C2C5",
                    borderBottom: "1px solid #2C2E33",
                  }}
                >
                  {v.name}
                </td>
                <td
                  style={{
                    padding: "5px 10px",
                    fontSize: 10,
                    borderBottom: "1px solid #2C2E33",
                  }}
                >
                  <span
                    style={{
                      background: v.type === "COLOR" ? "#862E9C" : v.type === "STRING" ? "#5C940D" : "#1971C2",
                      color: "#fff",
                      borderRadius: 3,
                      padding: "1px 6px",
                      fontSize: 9,
                      fontWeight: 600,
                      fontFamily: "monospace",
                    }}
                  >
                    {v.type}
                  </span>
                </td>
                <td
                  style={{
                    padding: "5px 10px",
                    fontSize: 11,
                    fontFamily: "monospace",
                    color: "#C1C2C5",
                    borderBottom: "1px solid #2C2E33",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {v.type === "COLOR" && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        borderRadius: 2,
                        background: v.value,
                        border: "1px solid #373A40",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {v.value}
                </td>
                <td
                  style={{
                    padding: "5px 10px",
                    fontSize: 10,
                    fontFamily: "monospace",
                    color: "#5C5F66",
                    borderBottom: "1px solid #2C2E33",
                  }}
                >
                  {v.figmaPath}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Switch Preview Panel ---------- */

function SwitchPreviewPanel({
  brands,
  activeBrand,
  activeSwitchSize,
  setActiveSwitchSize,
  sizeKeys,
}) {
  const [copied, setCopied] = useState(false);

  const tokens = COMPONENT_TOKENS.switch;

  const codeString = `import { Switch } from "@mantine/core";

<Switch size="${activeSwitchSize}" />`;

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Build resolved variables list
  const resolvedVars = [];
  for (const [name, def] of Object.entries(tokens)) {
    if (def.type === TOKEN_TYPES.COLOR) {
      const resolved = resolveColor(brands, activeBrand, def.semantic);
      resolvedVars.push({ name, type: "COLOR", value: resolved, figmaPath: def.figmaPath });
    } else if (def.type === TOKEN_TYPES.FLOAT || def.type === TOKEN_TYPES.STRING) {
      const hasSizes = !!def.sizes;
      const resolved = hasSizes
        ? resolveDimension(brands, activeBrand, name, activeSwitchSize)
        : resolveDimension(brands, activeBrand, name);
      const display = def.unit ? `${resolved}${def.unit}` : String(resolved);
      const displayName = hasSizes ? `${name}-${activeSwitchSize}` : name;
      const displayPath = hasSizes ? `${def.figmaPath}-${activeSwitchSize}` : def.figmaPath;
      resolvedVars.push({ name: displayName, type: def.type, value: display, figmaPath: displayPath });
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            color: "#5C5F66",
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontWeight: 600,
          }}
        >
          Size
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {sizeKeys.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSwitchSize(s)}
              style={{
                background:
                  activeSwitchSize === s ? "#373A40" : "transparent",
                color: activeSwitchSize === s ? "#E9ECEF" : "#5C5F66",
                border: "1px solid #373A40",
                borderRadius: 4,
                padding: "4px 10px",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "monospace",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Single switch preview */}
      <div
        style={{
          background: "#1A1B1E",
          borderRadius: 8,
          padding: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <SwitchPreview
          brands={brands}
          brandId={activeBrand}
          size={activeSwitchSize}
        />
        <span style={{ fontSize: 13, color: "#868E96" }}>Click to toggle</span>
      </div>

      {/* All sizes — off & on states */}
      <div
        style={{
          fontSize: 11,
          color: "#5C5F66",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontWeight: 600,
        }}
      >
        All Sizes — Off & On States
      </div>
      <div
        style={{
          background: "#1A1B1E",
          borderRadius: 8,
          padding: 20,
          overflowX: "auto",
          marginBottom: 24,
        }}
      >
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "6px 12px",
                  fontSize: 11,
                  color: "#5C5F66",
                  fontFamily: "monospace",
                }}
              />
              {sizeKeys.map((s) => (
                <th
                  key={s}
                  style={{
                    textAlign: "center",
                    padding: "6px 12px",
                    fontSize: 11,
                    color: "#5C5F66",
                    fontFamily: "monospace",
                  }}
                >
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {["off", "on"].map((state) => (
              <tr key={state}>
                <td
                  style={{
                    padding: "10px 12px",
                    fontSize: 12,
                    fontFamily: "monospace",
                    color: "#868E96",
                    fontWeight: 500,
                  }}
                >
                  {state}
                </td>
                {sizeKeys.map((s) => (
                  <td
                    key={s}
                    style={{ padding: "10px 12px", textAlign: "center" }}
                  >
                    <SwitchPreview
                      brands={brands}
                      brandId={activeBrand}
                      size={s}
                      checked={state === "on"}
                      readOnly
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Component Code */}
      <div
        style={{
          fontSize: 11,
          color: "#5C5F66",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontWeight: 600,
        }}
      >
        Component Code — {activeSwitchSize}
      </div>
      <div
        style={{
          position: "relative",
          background: "#1A1B1E",
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <button
          onClick={handleCopy}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: copied ? "#2F9E44" : "#373A40",
            color: copied ? "#fff" : "#C1C2C5",
            border: "none",
            borderRadius: 4,
            padding: "4px 10px",
            fontSize: 11,
            cursor: "pointer",
            transition: "background 0.2s",
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <pre
          style={{
            margin: 0,
            color: "#C1C2C5",
            fontSize: 12,
            fontFamily: "monospace",
            lineHeight: 1.5,
            overflowX: "auto",
            whiteSpace: "pre",
          }}
        >
          {highlightCode(codeString)}
        </pre>
      </div>

      {/* Resolved Variables */}
      <div
        style={{
          fontSize: 11,
          color: "#5C5F66",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontWeight: 600,
        }}
      >
        Resolved Variables — {activeSwitchSize}
      </div>
      <div
        style={{
          background: "#1A1B1E",
          borderRadius: 8,
          padding: 16,
          overflowX: "auto",
        }}
      >
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              {["Token", "Type", "Value", "Figma Path"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "6px 10px",
                    fontSize: 10,
                    color: "#5C5F66",
                    fontFamily: "monospace",
                    borderBottom: "1px solid #2C2E33",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resolvedVars.map((v) => (
              <tr key={v.name}>
                <td
                  style={{
                    padding: "5px 10px",
                    fontSize: 11,
                    fontFamily: "monospace",
                    color: "#C1C2C5",
                    borderBottom: "1px solid #2C2E33",
                  }}
                >
                  {v.name}
                </td>
                <td
                  style={{
                    padding: "5px 10px",
                    fontSize: 10,
                    borderBottom: "1px solid #2C2E33",
                  }}
                >
                  <span
                    style={{
                      background: v.type === "COLOR" ? "#862E9C" : "#1971C2",
                      color: "#fff",
                      borderRadius: 3,
                      padding: "1px 6px",
                      fontSize: 9,
                      fontWeight: 600,
                      fontFamily: "monospace",
                    }}
                  >
                    {v.type}
                  </span>
                </td>
                <td
                  style={{
                    padding: "5px 10px",
                    fontSize: 11,
                    fontFamily: "monospace",
                    color: "#C1C2C5",
                    borderBottom: "1px solid #2C2E33",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {v.type === "COLOR" && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        borderRadius: 2,
                        background: v.value,
                        border: "1px solid #373A40",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {v.value}
                </td>
                <td
                  style={{
                    padding: "5px 10px",
                    fontSize: 10,
                    fontFamily: "monospace",
                    color: "#5C5F66",
                    borderBottom: "1px solid #2C2E33",
                  }}
                >
                  {v.figmaPath}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CheckboxPreviewPanel({
  brands,
  activeBrand,
  activeCheckboxSize,
  setActiveCheckboxSize,
  sizeKeys,
}) {
  const [copied, setCopied] = useState(false);

  const tokens = COMPONENT_TOKENS.checkbox;

  const codeString = `import { Checkbox } from "@mantine/core";

<Checkbox size="${activeCheckboxSize}" />`;

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Build resolved variables list
  const resolvedVars = [];
  for (const [name, def] of Object.entries(tokens)) {
    if (def.type === TOKEN_TYPES.COLOR) {
      const resolved = resolveColor(brands, activeBrand, def.semantic);
      resolvedVars.push({ name, type: "COLOR", value: resolved, figmaPath: def.figmaPath });
    } else if (def.type === TOKEN_TYPES.FLOAT || def.type === TOKEN_TYPES.STRING) {
      const hasSizes = !!def.sizes;
      const resolved = hasSizes
        ? resolveDimension(brands, activeBrand, name, activeCheckboxSize)
        : resolveDimension(brands, activeBrand, name);
      const display = def.unit ? `${resolved}${def.unit}` : String(resolved);
      const displayName = hasSizes ? `${name}-${activeCheckboxSize}` : name;
      const displayPath = hasSizes ? `${def.figmaPath}-${activeCheckboxSize}` : def.figmaPath;
      resolvedVars.push({ name: displayName, type: def.type, value: display, figmaPath: displayPath });
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            color: "#5C5F66",
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontWeight: 600,
          }}
        >
          Size
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {(sizeKeys.checkbox || ["xs", "sm", "md", "lg", "xl"]).map((s) => (
            <button
              key={s}
              onClick={() => setActiveCheckboxSize(s)}
              style={{
                padding: "4px 12px",
                borderRadius: 6,
                border: "1px solid",
                borderColor: s === activeCheckboxSize ? "#228BE6" : "#373A40",
                background: s === activeCheckboxSize ? "#228BE6" : "transparent",
                color: s === activeCheckboxSize ? "#fff" : "#C1C2C5",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
                textTransform: "uppercase",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Single preview */}
      <div
        style={{
          background: "#1A1B1E",
          borderRadius: 8,
          padding: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <CheckboxPreview
          brands={brands}
          brandId={activeBrand}
          size={activeCheckboxSize}
        />
      </div>

      {/* Matrix: rows = unchecked/checked/indeterminate, cols = sizes */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            color: "#5C5F66",
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontWeight: 600,
          }}
        >
          All Sizes &amp; States
        </div>
        <div
          style={{
            background: "#1A1B1E",
            borderRadius: 8,
            padding: 16,
            overflowX: "auto",
          }}
        >
          <table style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th
                  style={{
                    padding: "4px 12px",
                    fontSize: 10,
                    color: "#5C5F66",
                    textAlign: "left",
                    fontWeight: 500,
                  }}
                >
                  State
                </th>
                {(sizeKeys.checkbox || ["xs", "sm", "md", "lg", "xl"]).map(
                  (s) => (
                    <th
                      key={s}
                      style={{
                        padding: "4px 16px",
                        fontSize: 10,
                        color: "#5C5F66",
                        textAlign: "center",
                        textTransform: "uppercase",
                        fontWeight: 500,
                      }}
                    >
                      {s}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Unchecked", checked: false, indeterminate: false },
                { label: "Checked", checked: true, indeterminate: false },
                { label: "Indeterminate", checked: false, indeterminate: true },
              ].map((row) => (
                <tr key={row.label}>
                  <td
                    style={{
                      padding: "8px 12px",
                      fontSize: 11,
                      color: "#909296",
                      fontWeight: 500,
                    }}
                  >
                    {row.label}
                  </td>
                  {(sizeKeys.checkbox || ["xs", "sm", "md", "lg", "xl"]).map(
                    (s) => (
                      <td
                        key={s}
                        style={{
                          padding: "8px 16px",
                          textAlign: "center",
                        }}
                      >
                        <CheckboxPreview
                          brands={brands}
                          brandId={activeBrand}
                          size={s}
                          checked={row.checked}
                          indeterminate={row.indeterminate}
                          readOnly
                        />
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Snippet */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#5C5F66",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontWeight: 600,
            }}
          >
            Code
          </div>
          <button
            onClick={handleCopy}
            style={{
              background: "transparent",
              border: "1px solid #373A40",
              color: copied ? "#51CF66" : "#909296",
              borderRadius: 4,
              padding: "2px 8px",
              fontSize: 10,
              cursor: "pointer",
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre
          style={{
            background: "#141517",
            borderRadius: 8,
            padding: 16,
            margin: 0,
            fontSize: 12,
            lineHeight: 1.6,
            overflowX: "auto",
            color: "#C1C2C5",
            border: "1px solid #2C2E33",
          }}
        >
          {highlightCode(codeString)}
        </pre>
      </div>

      {/* Resolved Variables */}
      <div
        style={{
          fontSize: 11,
          color: "#5C5F66",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontWeight: 600,
        }}
      >
        Resolved Variables — {activeCheckboxSize}
      </div>
      <div
        style={{
          background: "#1A1B1E",
          borderRadius: 8,
          padding: 16,
          overflowX: "auto",
        }}
      >
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              {["Token", "Type", "Value", "Figma Path"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "6px 10px",
                    fontSize: 10,
                    color: "#5C5F66",
                    fontFamily: "monospace",
                    borderBottom: "1px solid #2C2E33",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resolvedVars.map((v) => (
              <tr key={v.name}>
                <td
                  style={{
                    padding: "5px 10px",
                    fontSize: 11,
                    fontFamily: "monospace",
                    color: "#C1C2C5",
                    borderBottom: "1px solid #2C2E33",
                  }}
                >
                  {v.name}
                </td>
                <td
                  style={{
                    padding: "5px 10px",
                    fontSize: 10,
                    borderBottom: "1px solid #2C2E33",
                  }}
                >
                  <span
                    style={{
                      background: v.type === "COLOR" ? "#862E9C" : "#1971C2",
                      color: "#fff",
                      borderRadius: 3,
                      padding: "1px 6px",
                      fontSize: 9,
                      fontWeight: 600,
                      fontFamily: "monospace",
                    }}
                  >
                    {v.type}
                  </span>
                </td>
                <td
                  style={{
                    padding: "5px 10px",
                    fontSize: 11,
                    fontFamily: "monospace",
                    color: "#C1C2C5",
                    borderBottom: "1px solid #2C2E33",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {v.type === "COLOR" && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        borderRadius: 2,
                        background: v.value,
                        border: "1px solid #373A40",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {v.value}
                </td>
                <td
                  style={{
                    padding: "5px 10px",
                    fontSize: 10,
                    fontFamily: "monospace",
                    color: "#5C5F66",
                    borderBottom: "1px solid #2C2E33",
                  }}
                >
                  {v.figmaPath}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
