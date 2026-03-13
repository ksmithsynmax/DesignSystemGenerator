import { useState, useRef } from "react";
import { generateScale, isValidHex, isValidScaleJson } from "../../utils/generateScale";

export default function AddPrimitiveForm({ existingNames, onAdd }) {
  const [step, setStep] = useState(0); // 0=collapsed, 1=name, 2=color, 3=preview
  const [name, setName] = useState("");
  const [baseHex, setBaseHex] = useState("#");
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState(null);
  const [scale, setScale] = useState(null);
  const pickerRef = useRef(null);

  const sanitizedName = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const isDuplicate = sanitizedName && existingNames.includes(sanitizedName);
  const nameValid = sanitizedName.length > 0 && !isDuplicate;
  const hexValid = isValidHex(baseHex);

  const reset = () => {
    setStep(0);
    setName("");
    setBaseHex("#");
    setJsonText("");
    setJsonError(null);
    setScale(null);
  };

  const handleNameNext = () => {
    if (nameValid) setStep(2);
  };

  const handleHexGenerate = () => {
    if (hexValid) {
      setScale(generateScale(baseHex));
      setStep(3);
    }
  };

  const handlePickerChange = (e) => {
    const hex = e.target.value.toUpperCase();
    setBaseHex(hex);
    setScale(generateScale(hex));
    setStep(3);
  };

  const handleJsonImport = () => {
    setJsonError(null);
    try {
      const arr = JSON.parse(jsonText);
      if (!Array.isArray(arr) || arr.length !== 10 || !arr.every(isValidHex)) {
        setJsonError("Array of exactly 10 hex colors required");
        return;
      }
      setScale(arr.map((c) => c.toUpperCase()));
      setStep(3);
    } catch {
      setJsonError("Invalid JSON");
    }
  };

  const handleAdd = () => {
    if (scale && sanitizedName) {
      onAdd(sanitizedName, scale);
      reset();
    }
  };

  // Collapsed
  if (step === 0) {
    return (
      <button
        onClick={() => setStep(1)}
        style={{
          background: "none",
          border: "none",
          color: "#228BE6",
          fontSize: 12,
          fontFamily: "monospace",
          cursor: "pointer",
          padding: "8px 0",
          display: "block",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#4DABF7")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#228BE6")}
      >
        + Add color
      </button>
    );
  }

  return (
    <div
      style={{
        background: "#25262B",
        borderRadius: 6,
        border: "1px solid #373A40",
        padding: "12px 10px",
        marginTop: 8,
      }}
    >
      {/* Step 1: Name */}
      {step === 1 && (
        <>
          <div style={labelStyle}>Name your palette</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNameNext()}
            placeholder="e.g. purple"
            autoFocus
            style={{
              ...inputStyle,
              borderColor: isDuplicate ? "#FA5252" : "#373A40",
              marginBottom: isDuplicate ? 4 : 10,
            }}
          />
          {isDuplicate && (
            <div style={{ fontSize: 11, color: "#FA5252", marginBottom: 10 }}>
              Name already exists
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              disabled={!nameValid}
              onClick={handleNameNext}
              style={primaryBtn(nameValid)}
            >
              Next
            </button>
            <button onClick={reset} style={ghostBtn}>
              Cancel
            </button>
          </div>
        </>
      )}

      {/* Step 2: Color input */}
      {step === 2 && (
        <>
          <div style={{ ...stepHeader, marginBottom: 12 }}>
            <span style={{ color: "#C1C2C5", fontFamily: "monospace", fontSize: 12, fontWeight: 600 }}>
              {sanitizedName}
            </span>
            <button
              onClick={() => setStep(1)}
              style={linkBtn}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#868E96")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#5C5F66")}
            >
              edit name
            </button>
          </div>

          <div style={labelStyle}>Choose a color</div>

          {/* Option 1: Hex input */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <input
              value={baseHex}
              onChange={(e) => {
                let v = e.target.value;
                if (!v.startsWith("#")) v = "#" + v;
                setBaseHex(v.slice(0, 7));
              }}
              onKeyDown={(e) => e.key === "Enter" && handleHexGenerate()}
              placeholder="#7C3AED"
              autoFocus
              style={{ ...inputStyle, flex: 1, width: "auto" }}
            />
            <button
              disabled={!hexValid}
              onClick={handleHexGenerate}
              style={primaryBtn(hexValid)}
            >
              Generate
            </button>
          </div>

          {/* Option 2: Color picker */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
              cursor: "pointer",
            }}
            onClick={() => pickerRef.current?.click()}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                background: hexValid ? baseHex : "linear-gradient(135deg, #FF6B6B, #4DABF7, #51CF66)",
                border: "1px solid #373A40",
                flexShrink: 0,
                position: "relative",
              }}
            >
              <input
                ref={pickerRef}
                type="color"
                value={hexValid ? baseHex : "#000000"}
                onChange={handlePickerChange}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: "pointer",
                }}
              />
            </div>
            <span style={{ fontSize: 12, color: "#868E96", fontFamily: "monospace" }}>
              Pick from color picker
            </span>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid #373A40", marginBottom: 12 }} />

          {/* Option 3: JSON */}
          <div style={labelStyle}>Or paste JSON</div>
          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setJsonError(null);
            }}
            placeholder='["#E5F0FB", "#CCE2F7", "#B2D3F3", ...]'
            rows={3}
            style={{ ...inputStyle, fontSize: 11, resize: "vertical", marginBottom: 8 }}
          />
          {jsonError && (
            <div style={{ fontSize: 11, color: "#FA5252", marginBottom: 8 }}>
              {jsonError}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              disabled={!jsonText.trim()}
              onClick={handleJsonImport}
              style={primaryBtn(!!jsonText.trim())}
            >
              Import
            </button>
            <button onClick={reset} style={ghostBtn}>
              Cancel
            </button>
          </div>
        </>
      )}

      {/* Step 3: Preview + Confirm */}
      {step === 3 && scale && (
        <>
          <div style={{ ...stepHeader, marginBottom: 12 }}>
            <span style={{ color: "#C1C2C5", fontFamily: "monospace", fontSize: 12, fontWeight: 600 }}>
              {sanitizedName}
            </span>
            <button
              onClick={() => { setScale(null); setStep(2); }}
              style={linkBtn}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#868E96")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#5C5F66")}
            >
              change color
            </button>
          </div>

          <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>
            {scale.map((c, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: 32,
                    borderRadius: 3,
                    background: c,
                  }}
                  title={`${sanitizedName}/${i} — ${c}`}
                />
                <span style={{ fontSize: 8, color: "#5C5F66", fontFamily: "monospace" }}>
                  {i}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleAdd} style={primaryBtn(true)}>
              Add palette
            </button>
            <button onClick={reset} style={ghostBtn}>
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const labelStyle = {
  fontSize: 10,
  color: "#5C5F66",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  fontWeight: 600,
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  background: "#1A1B1E",
  border: "1px solid #373A40",
  borderRadius: 4,
  color: "#C1C2C5",
  fontSize: 12,
  fontFamily: "monospace",
  padding: "6px 8px",
};

const primaryBtn = (enabled) => ({
  background: enabled ? "#228BE6" : "#373A40",
  border: "none",
  borderRadius: 4,
  color: enabled ? "#fff" : "#5C5F66",
  fontSize: 11,
  fontWeight: 600,
  padding: "6px 14px",
  cursor: enabled ? "pointer" : "default",
  fontFamily: "monospace",
});

const ghostBtn = {
  background: "transparent",
  border: "1px solid #373A40",
  borderRadius: 4,
  color: "#868E96",
  fontSize: 11,
  padding: "6px 14px",
  cursor: "pointer",
  fontFamily: "monospace",
};

const linkBtn = {
  background: "none",
  border: "none",
  color: "#5C5F66",
  fontSize: 11,
  fontFamily: "monospace",
  cursor: "pointer",
  padding: 0,
};

const stepHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};
