export default function Tag({ children, color = "#868E96", bg }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontFamily: "monospace",
        padding: "2px 8px",
        borderRadius: 4,
        background: bg || `${color}18`,
        color,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
