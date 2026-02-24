export default function PreviewStage({ children, padding = 32, gap = 16 }) {
  return (
    <div
      style={{
        background: "#1A1B1E",
        borderRadius: 8,
        padding,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap,
        marginBottom: 24,
      }}
    >
      {children}
    </div>
  );
}
