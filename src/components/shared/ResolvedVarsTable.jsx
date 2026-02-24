const TYPE_BADGE_COLORS = {
  COLOR: "#862E9C",
  STRING: "#5C940D",
  FLOAT: "#1971C2",
};

export default function ResolvedVarsTable({ resolvedVars }) {
  return (
    <div
      style={{
        background: "#1A1B1E",
        borderRadius: 8,
        padding: 16,
        overflowX: "auto",
      }}
    >
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            {["Token", "Type", "Value", "Figma Path"].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "6px 10px",
                  fontSize: 10,
                  color: "#5C5F66",
                  fontFamily: "monospace",
                  borderBottom: "1px solid #2C2E33",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {resolvedVars.map((v) => (
            <tr key={v.name}>
              <td
                style={{
                  padding: "5px 10px",
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: "#C1C2C5",
                  borderBottom: "1px solid #2C2E33",
                }}
              >
                {v.name}
              </td>
              <td
                style={{
                  padding: "5px 10px",
                  fontSize: 10,
                  borderBottom: "1px solid #2C2E33",
                }}
              >
                <span
                  style={{
                    background: TYPE_BADGE_COLORS[v.type] || "#1971C2",
                    color: "#fff",
                    borderRadius: 3,
                    padding: "1px 6px",
                    fontSize: 9,
                    fontWeight: 600,
                    fontFamily: "monospace",
                  }}
                >
                  {v.type}
                </span>
              </td>
              <td
                style={{
                  padding: "5px 10px",
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: "#C1C2C5",
                  borderBottom: "1px solid #2C2E33",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {v.type === "COLOR" && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      background: v.value,
                      border: "1px solid #373A40",
                      flexShrink: 0,
                    }}
                  />
                )}
                {v.value}
              </td>
              <td
                style={{
                  padding: "5px 10px",
                  fontSize: 10,
                  fontFamily: "monospace",
                  color: "#5C5F66",
                  borderBottom: "1px solid #2C2E33",
                }}
              >
                {v.figmaPath}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
