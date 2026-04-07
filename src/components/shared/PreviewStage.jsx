export default function PreviewStage({
  children,
  label,
  padding = 32,
  gap = 16,
  contentAlignItems = "center",
  contentJustifyContent = "center",
}) {
  const previewTheme =
    typeof window !== "undefined" && window.__DSG_PREVIEW_THEME === "light" ? "light" : "dark";
  const background = previewTheme === "light" ? "#F1F3F5" : "#181926";
  const labelColor = previewTheme === "light" ? "#495057" : "#868E96";

  return (
    <div
      style={{
        background,
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
        <div style={{ fontSize: 13, fontFamily: "monospace", color: labelColor, marginBottom: 16 }}>
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
