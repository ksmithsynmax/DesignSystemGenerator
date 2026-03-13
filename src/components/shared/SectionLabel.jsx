export default function SectionLabel({ children, mb = 8, mt = 0 }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: "#5C5F66",
        marginBottom: mb,
        marginTop: mt,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}
