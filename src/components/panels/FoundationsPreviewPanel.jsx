import FoundationsPreview from "../previews/FoundationsPreview";

export function FoundationsPreviewContent({ brands, activeBrand }) {
  const brand = brands?.[activeBrand];
  return (
    <div>
      <div
        style={{
          fontSize: 13,
          fontFamily: "monospace",
          color: "#868E96",
          marginBottom: 18,
        }}
      >
        {brand?.name || activeBrand} — foundations
      </div>
      <FoundationsPreview brand={brand} />
    </div>
  );
}
