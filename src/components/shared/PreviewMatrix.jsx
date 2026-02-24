export default function PreviewMatrix({ sizeKeys, rows, renderCell }) {
  return (
    <div
      style={{
        background: "#1A1B1E",
        borderRadius: 8,
        padding: 20,
        overflowX: "auto",
        marginBottom: 24,
      }}
    >
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                padding: "6px 12px",
                fontSize: 11,
                color: "#5C5F66",
                fontFamily: "monospace",
              }}
            />
            {sizeKeys.map((s) => (
              <th
                key={s}
                style={{
                  textAlign: "center",
                  padding: "6px 12px",
                  fontSize: 11,
                  color: "#5C5F66",
                  fontFamily: "monospace",
                }}
              >
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td
                style={{
                  padding: "10px 12px",
                  fontSize: 12,
                  fontFamily: "monospace",
                  color: "#868E96",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                {row.label}
              </td>
              {sizeKeys.map((s) => (
                <td
                  key={s}
                  style={{ padding: "10px 12px", textAlign: "center" }}
                >
                  {renderCell(row, s)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
