export default function SectionLabel({ children, mb = 8 }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: "#5C5F66",
        marginBottom: mb,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}
