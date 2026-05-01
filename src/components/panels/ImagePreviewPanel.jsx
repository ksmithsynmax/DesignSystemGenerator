import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";
import ImagePreview from "../previews/ImagePreview";
import { resolveDimension } from "../../utils/resolveToken";

export const IMAGE_SIZE_OPTIONS = ["default", "xs", "sm", "md", "lg", "xl"];
export const IMAGE_RADIUS_OPTIONS = ["default", "xs", "sm", "md", "lg", "xl"];
export const IMAGE_FIT_OPTIONS = ["contain", "cover", "fill", "none", "scale-down"];

function PropertyRow({ label, value, onChange, options }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <SectionLabel mb={0}>{label}</SectionLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "#25262B",
          color: "#E9ECEF",
          border: "1px solid #373A40",
          borderRadius: 6,
          padding: "6px 28px 6px 12px",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "monospace",
          outline: "none",
          cursor: "pointer",
          appearance: "none",
          WebkitAppearance: "none",
          textTransform: "capitalize",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%235C5F66' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

const textFieldStyle = {
  background: "#1A1B1E",
  border: "1px solid #373A40",
  borderRadius: 4,
  padding: "6px 8px",
  fontSize: 12,
  color: "#C1C2C5",
  fontFamily: "monospace",
  width: "100%",
  boxSizing: "border-box",
};

export function ImagePreviewContent({
  brands,
  activeBrand,
  src,
  alt,
  fallbackSrc,
  size,
  radius,
  fit,
}) {
  const tokenWidth = resolveDimension(brands, activeBrand, "image-width", size);
  const tokenHeight = resolveDimension(brands, activeBrand, "image-height", size);
  const tokenRadius = resolveDimension(brands, activeBrand, "image-radius", radius);
  const resolvedWidth = Math.max(1, parseFloat(String(tokenWidth ?? "")) || 360);
  const resolvedHeight = Math.max(1, parseFloat(String(tokenHeight ?? "")) || 220);
  const resolvedRadius = Math.max(0, parseFloat(String(tokenRadius ?? "")) || 0);

  const fitRows = IMAGE_FIT_OPTIONS.map((v) => ({ label: v, fit: v }));

  return (
    <div>
      <PreviewStage label="image" padding={40}>
        <ImagePreview
          src={src}
          alt={alt}
          fallbackSrc={fallbackSrc}
          width={resolvedWidth}
          height={resolvedHeight}
          radius={resolvedRadius}
          fit={fit}
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>Fit Modes x Radius Tokens</SectionLabel>
      <PreviewMatrix
        sizeKeys={IMAGE_RADIUS_OPTIONS}
        rows={fitRows}
        renderCell={(row, r) => (
          <ImagePreview
            src={src}
            alt={alt}
            fallbackSrc={fallbackSrc}
            width={160}
            height={100}
            fit={row.fit}
            radius={Math.max(0, parseFloat(String(resolveDimension(brands, activeBrand, "image-radius", r) ?? "")) || 0)}
          />
        )}
      />
    </div>
  );
}

export function ImagePropertiesPanel({
  size,
  setSize,
  src,
  setSrc,
  alt,
  setAlt,
  fallbackSrc,
  setFallbackSrc,
  radius,
  setRadius,
  fit,
  setFit,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow label="Size Preset" value={size} onChange={setSize} options={IMAGE_SIZE_OPTIONS} />
      <div>
        <SectionLabel mb={6}>Source URL</SectionLabel>
        <input type="text" value={src} onChange={(e) => setSrc(e.target.value)} style={textFieldStyle} />
      </div>
      <div>
        <SectionLabel mb={6}>Alt Text</SectionLabel>
        <input type="text" value={alt} onChange={(e) => setAlt(e.target.value)} style={textFieldStyle} />
      </div>
      <div>
        <SectionLabel mb={6}>Fallback URL</SectionLabel>
        <input
          type="text"
          value={fallbackSrc}
          onChange={(e) => setFallbackSrc(e.target.value)}
          style={textFieldStyle}
          placeholder="Optional fallback image URL"
        />
      </div>
      <div style={{ fontSize: 11, color: "#868E96", marginTop: -4 }}>
        Width and height are controlled by `image-width` and `image-height` tokens for the selected size.
      </div>
      <PropertyRow label="Radius" value={radius} onChange={setRadius} options={IMAGE_RADIUS_OPTIONS} />
      <PropertyRow label="Fit" value={fit} onChange={setFit} options={IMAGE_FIT_OPTIONS} />
    </div>
  );
}
