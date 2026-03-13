export default function PreviewStage({
  children,
  label,
  padding = 32,
  gap = 16,
  contentAlignItems = "center",
  contentJustifyContent = "center",
}) {
  return (
    <div
      style={{
        background: "#1A1B1E",
        borderRadius: 8,
        padding,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginBottom: 24,
        minHeight: "calc(100vh - 250px)",
      }}
    >
      {label && (
        <div style={{ fontSize: 13, fontFamily: "monospace", color: "#868E96", marginBottom: 16 }}>
          {label}
        </div>
      )}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: contentAlignItems,
          justifyContent: contentJustifyContent,
          gap,
          width: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}
