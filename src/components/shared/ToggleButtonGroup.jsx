export default function ToggleButtonGroup({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            background: value === opt ? "#373A40" : "transparent",
            color: value === opt ? "#E9ECEF" : "#5C5F66",
            border: "1px solid #373A40",
            borderRadius: 4,
            padding: "4px 12px",
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "monospace",
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
