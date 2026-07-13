import { useState, useMemo } from "react";
import { gradientCssFromDef, resolveGradientCss } from "../../utils/resolveGradient";

const INDEX_OPTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Use global palette names only — `blue` is not global, so new brands used to preview as #FF00FF. */
const defaultStops = () => [
  { color: "navy", index: 2, position: 0, opacity: 100 },
  { color: "navy", index: 8, position: 100, opacity: 100 },
];

function slugifyName(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function BrandGradientsSection({ brand, paletteColorNames, onUpsert, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [nameInput, setNameInput] = useState("");
  const [gradientType, setGradientType] = useState("linear");
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState(defaultStops);

  const gradientIds = useMemo(() => {
    if (!brand.gradients || typeof brand.gradients !== "object") return [];
    return Object.keys(brand.gradients).sort();
  }, [brand.gradients]);

  const draftDef = useMemo(
    () => ({
      type: gradientType === "radial" ? "radial" : "linear",
      angle: Number.isFinite(Number(angle)) ? Number(angle) : 0,
      stops,
    }),
    [gradientType, angle, stops]
  );

  const draftPreviewCss = useMemo(() => gradientCssFromDef(brand, draftDef), [brand, draftDef]);

  const resetForm = () => {
    setNameInput("");
    setGradientType("linear");
    setAngle(135);
    setStops(defaultStops());
    setEditingId(null);
  };

  const loadIntoForm = (id) => {
    const def = brand.gradients[id];
    if (!def) return;
    setEditingId(id);
    setNameInput(id);
    setGradientType(def.type === "radial" ? "radial" : "linear");
    setAngle(Number.isFinite(Number(def.angle)) ? Number(def.angle) : 90);
    setStops(
      Array.isArray(def.stops) && def.stops.length >= 2
        ? def.stops.map((s) => ({
            color: s.color,
            index: Math.min(9, Math.max(0, Number(s.index) || 0)),
            position: Math.min(100, Math.max(0, Number(s.position) || 0)),
            opacity: Math.min(100, Math.max(0, Number(s.opacity) ?? 100)),
          }))
        : defaultStops()
    );
    setExpanded(true);
  };

  const updateStop = (i, field, value) => {
    setStops((prev) => {
      const next = [...prev];
      if (!next[i]) return prev;
      if (field === "color") next[i] = { ...next[i], color: value };
      if (field === "index") next[i] = { ...next[i], index: Number(value) };
      if (field === "position") next[i] = { ...next[i], position: Number(value) };
      if (field === "opacity") next[i] = { ...next[i], opacity: Number(value) };
      return next;
    });
  };

  const addStop = () => {
    setStops((prev) => [
      ...prev,
      {
        color: prev[prev.length - 1]?.color || paletteColorNames[0] || "neutral",
        index: 5,
        position: 100,
        opacity: 100,
      },
    ]);
  };

  const removeStop = (i) => {
    if (stops.length <= 2) return;
    setStops((prev) => prev.filter((_, j) => j !== i));
  };

  const handleSave = () => {
    const id = editingId || slugifyName(nameInput);
    if (!id || stops.length < 2) return;
    const normalizedStops = stops.map((s) => ({
      color: s.color,
      index: Math.min(9, Math.max(0, Number(s.index) || 0)),
      position: Math.min(100, Math.max(0, Number(s.position) || 0)),
      opacity: Math.min(100, Math.max(0, Number(s.opacity) ?? 100)),
    }));
    onUpsert(id, {
      type: gradientType === "radial" ? "radial" : "linear",
      angle: Math.min(360, Math.max(-360, Number(angle) || 0)),
      stops: normalizedStops,
    });
    resetForm();
    setExpanded(false);
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

  const labelStyle = {
    fontSize: 10,
    color: "#5C5F66",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: 600,
    marginBottom: 6,
  };

  return (
    <div>
      <div style={{ fontSize: 11, color: "#868E96", lineHeight: 1.45, marginBottom: 10 }}>
        Linear or radial gradients from palette steps (0–9). Assign under <strong style={{ color: "#C1C2C5" }}>Color
        Tokens</strong> → open a token → palette dropdown → <strong style={{ color: "#C1C2C5" }}>Gradients</strong>{" "}
        group. The Properties &quot;Filled background&quot; control is a quick preview only (not saved on the token).
        {" "}
        Figma sync creates matching <strong style={{ color: "#C1C2C5" }}>local paint styles</strong> under{" "}
        <strong style={{ color: "#C1C2C5" }}>Gradient / [Brand] / [id]</strong> (apply manually where you need the full gradient).
      </div>

      {gradientIds.map((id) => {
        const css = resolveGradientCss(brand, id);
        return (
          <div
            key={id}
            style={{
              marginBottom: 10,
              padding: 10,
              background: "#25262B",
              border: "1px solid #373A40",
              borderRadius: 6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div
                title={css || ""}
                style={{
                  flex: 1,
                  height: 28,
                  borderRadius: 4,
                  background: css || "#333",
                  border: "1px solid #2C2E33",
                }}
              />
              <span style={{ fontSize: 12, fontFamily: "monospace", color: "#C1C2C5", minWidth: 0 }}>
                {id}
                <span style={{ color: "#5C5F66", marginLeft: 6 }}>
                  · {brand.gradients[id]?.type === "radial" ? "radial" : "linear"}
                </span>
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => loadIntoForm(id)}
                style={{
                  background: "transparent",
                  border: "1px solid #373A40",
                  borderRadius: 4,
                  color: "#868E96",
                  fontSize: 11,
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontFamily: "monospace",
                }}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onRemove(id)}
                style={{
                  background: "transparent",
                  border: "1px solid #862E2E",
                  borderRadius: 4,
                  color: "#FA5252",
                  fontSize: 11,
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontFamily: "monospace",
                }}
              >
                Remove
              </button>
            </div>
          </div>
        );
      })}

      {!expanded ? (
        <button
          type="button"
          onClick={() => {
            resetForm();
            setExpanded(true);
          }}
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
        >
          + Add gradient
        </button>
      ) : (
        <div
          style={{
            background: "#25262B",
            borderRadius: 6,
            border: "1px solid #373A40",
            padding: "12px 10px",
            marginTop: 8,
          }}
        >
          <div style={labelStyle}>{editingId ? "Edit gradient" : "New gradient"}</div>
          {!editingId && (
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="id e.g. hero-cta"
              style={{ ...inputStyle, marginBottom: 10 }}
            />
          )}
          {editingId && (
            <div style={{ fontSize: 12, fontFamily: "monospace", color: "#868E96", marginBottom: 10 }}>
              id: <span style={{ color: "#C1C2C5" }}>{editingId}</span>
            </div>
          )}
          <div style={labelStyle}>Live preview</div>
          <div
            style={{
              position: "relative",
              height: 56,
              borderRadius: 6,
              border: "1px solid #373A40",
              marginBottom: 12,
              background: draftPreviewCss || "#1A1B1E",
              overflow: "hidden",
            }}
            title={draftPreviewCss || ""}
          >
            {!draftPreviewCss && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: "#5C5F66",
                  textAlign: "center",
                  padding: "0 12px",
                }}
              >
                Add at least two stops with valid palette names to preview
              </div>
            )}
          </div>
          <div style={labelStyle}>Type</div>
          <select
            value={gradientType}
            onChange={(e) => setGradientType(e.target.value === "radial" ? "radial" : "linear")}
            style={{ ...inputStyle, marginBottom: 12 }}
          >
            <option value="linear">Linear</option>
            <option value="radial">Radial (circle at center)</option>
          </select>
          {gradientType === "linear" && (
            <>
              <div style={labelStyle}>Angle (deg)</div>
              <input
                type="number"
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                onWheel={(e) => e.currentTarget.blur()}
                style={{ ...inputStyle, marginBottom: 12 }}
              />
            </>
          )}
          {gradientType === "radial" && (
            <div style={{ fontSize: 11, color: "#5C5F66", marginBottom: 12, lineHeight: 1.45 }}>
              Radial uses <span style={{ fontFamily: "monospace", color: "#868E96" }}>circle at center</span>. Stop
              positions are distance from the center (0% = center, 100% = edge).
            </div>
          )}
          <div style={labelStyle}>Stops (palette / step / % / opacity)</div>
          {stops.map((s, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 52px 52px 52px 28px",
                gap: 6,
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <select
                value={s.color}
                onChange={(e) => updateStop(i, "color", e.target.value)}
                style={inputStyle}
              >
                {paletteColorNames.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={s.index}
                onChange={(e) => updateStop(i, "index", e.target.value)}
                style={inputStyle}
              >
                {INDEX_OPTS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={s.position}
                onChange={(e) => updateStop(i, "position", e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                title="Position %"
                style={inputStyle}
              />
              <input
                type="number"
                value={s.opacity}
                onChange={(e) => updateStop(i, "opacity", e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                title="Opacity %"
                style={inputStyle}
              />
              <button
                type="button"
                disabled={stops.length <= 2}
                onClick={() => removeStop(i)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: stops.length <= 2 ? "#5C5F66" : "#FA5252",
                  cursor: stops.length <= 2 ? "not-allowed" : "pointer",
                  fontSize: 16,
                  lineHeight: 1,
                }}
                title="Remove stop"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addStop}
            style={{
              background: "transparent",
              border: "1px dashed #373A40",
              borderRadius: 4,
              color: "#868E96",
              fontSize: 11,
              padding: "6px 10px",
              cursor: "pointer",
              fontFamily: "monospace",
              width: "100%",
              marginBottom: 12,
            }}
          >
            + Add stop
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={(!editingId && !slugifyName(nameInput)) || stops.length < 2}
              style={{
                background: !editingId && !slugifyName(nameInput) ? "#373A40" : "#228BE6",
                border: "none",
                borderRadius: 4,
                color: "#fff",
                fontSize: 11,
                fontWeight: 600,
                padding: "6px 14px",
                cursor: !editingId && !slugifyName(nameInput) ? "default" : "pointer",
                fontFamily: "monospace",
              }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setExpanded(false);
              }}
              style={{
                background: "transparent",
                border: "1px solid #373A40",
                borderRadius: 4,
                color: "#868E96",
                fontSize: 11,
                padding: "6px 14px",
                cursor: "pointer",
                fontFamily: "monospace",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
