import { useState, useEffect } from "react";

const ALL_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// Add an alpha primitive by pointing at an existing base swatch (family + index).
// The 0–9 opacity ramp is generated automatically from that swatch. Only base
// swatches that don't already have an alpha ramp are offered, so you can never
// create a duplicate.
export default function AddAlphaForm({ colorNames = [], getBaseHex, existingKeys, onAdd }) {
  const taken = existingKeys instanceof Set ? existingKeys : new Set();
  const isTaken = (c, i) => taken.has(`${c}/${i}`);
  const indicesFor = (c) => ALL_INDICES.filter((i) => !isTaken(c, i));
  // Keep a color available as long as it has at least one free index, so you can
  // add other shades later (e.g. blue/4, blue/6 for chart shades) even once
  // blue/5 exists. Taken indices are shown but disabled so it's clearly not a dup.
  const availableColors = colorNames.filter((c) => indicesFor(c).length > 0);

  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(availableColors[0] || "");
  const availableIndices = color ? indicesFor(color) : [];
  const [index, setIndex] = useState(availableIndices[0] ?? 0);

  // Keep the selected color/index valid as the available set changes.
  useEffect(() => {
    if (!availableColors.includes(color)) {
      setColor(availableColors[0] || "");
    }
  }, [availableColors, color]);
  useEffect(() => {
    if (color && !availableIndices.includes(index)) {
      setIndex(availableIndices[0] ?? 0);
    }
  }, [color, availableIndices, index]);

  const reset = () => {
    setOpen(false);
    setColor(availableColors[0] || "");
    setIndex(indicesFor(availableColors[0] || "")[0] ?? 0);
  };

  const baseHex = typeof getBaseHex === "function" ? getBaseHex(color, index) : null;
  const key = `${color}/${index}`;
  const canAdd =
    Boolean(color) && baseHex != null && availableIndices.includes(index);

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd(color, Number(index));
    reset();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
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
        + Add alpha color
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
      {availableColors.length === 0 ? (
        <div style={{ fontSize: 12, color: "#868E96", fontFamily: "monospace", marginBottom: 10 }}>
          Every base swatch already has an alpha ramp.
        </div>
      ) : (
      <>
      <div style={labelStyle}>Pick an existing primitive swatch</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <select
          value={color}
          onChange={(e) => setColor(e.target.value)}
          style={{ ...inputStyle, flex: 1, width: "auto" }}
        >
          {availableColors.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span style={{ color: "#5C5F66", fontSize: 12 }}>/</span>
        <select
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          style={{ ...inputStyle, width: 64 }}
        >
          {ALL_INDICES.map((i) => {
            const used = isTaken(color, i);
            return (
              <option key={i} value={i} disabled={used}>
                {used ? `${i} (in use)` : i}
              </option>
            );
          })}
        </select>
      </div>

      {/* Base swatch preview */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 4,
            background: baseHex || "#000",
            border: "1px solid #373A40",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 12, color: "#868E96", fontFamily: "monospace" }}>
          {baseHex ? `${key} — ${baseHex} → ${color}-${index}-alpha` : "no such swatch"}
        </span>
      </div>
      </>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        {availableColors.length > 0 && (
          <button disabled={!canAdd} onClick={handleAdd} style={primaryBtn(canAdd)}>
            Add
          </button>
        )}
        <button onClick={reset} style={ghostBtn}>
          {availableColors.length > 0 ? "Cancel" : "Close"}
        </button>
      </div>
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
