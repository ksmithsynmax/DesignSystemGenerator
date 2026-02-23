export default function Swatch({ color, size = 16 }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: 3,
        background: color,
        border: "1px solid rgba(0,0,0,0.12)",
        flexShrink: 0,
        verticalAlign: "middle",
      }}
    />
  );
}
