import SectionLabel from "../shared/SectionLabel";
import PreviewStage from "../shared/PreviewStage";
import PreviewMatrix from "../shared/PreviewMatrix";
import SkeletonPreview from "../previews/SkeletonPreview";
import { resolveDimension } from "../../utils/resolveToken";

export const SKELETON_SIZE_OPTIONS = ["default", "xs", "sm", "md", "lg", "xl"];
export const SKELETON_RADIUS_OPTIONS = ["default", "xs", "sm", "md", "lg", "xl"];

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

function ToggleRow({ label, checked, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ cursor: "pointer" }}
      />
      <SectionLabel mb={0}>{label}</SectionLabel>
    </label>
  );
}

export function SkeletonPreviewContent({
  brands,
  activeBrand,
  previewTheme,
  size,
  radius,
  circle,
  animate,
}) {
  const tokenWidth = resolveDimension(brands, activeBrand, "skeleton-width", size);
  const tokenHeight = resolveDimension(brands, activeBrand, "skeleton-height", size);
  const tokenRadius = resolveDimension(brands, activeBrand, "skeleton-radius", radius);
  const resolvedWidth = Math.max(1, parseFloat(String(tokenWidth ?? "")) || 240);
  const resolvedHeight = Math.max(1, parseFloat(String(tokenHeight ?? "")) || 16);
  const resolvedRadius = Math.max(0, parseFloat(String(tokenRadius ?? "")) || 0);

  const shapeRows = [
    { label: "block", circle: false },
    { label: "circle", circle: true },
  ];

  return (
    <div>
      <PreviewStage label="skeleton" padding={40}>
        <SkeletonPreview
          brands={brands}
          brandId={activeBrand}
          previewTheme={previewTheme}
          width={resolvedWidth}
          height={resolvedHeight}
          radius={resolvedRadius}
          circle={circle}
          animate={animate}
        />
      </PreviewStage>

      <div style={{ borderTop: "1px solid #2C2E33", marginTop: 40 }} />
      <SectionLabel mt={20}>Shape x Size Tokens</SectionLabel>
      <PreviewMatrix
        sizeKeys={SKELETON_SIZE_OPTIONS}
        rows={shapeRows}
        renderCell={(row, s) => (
          <SkeletonPreview
            brands={brands}
            brandId={activeBrand}
            previewTheme={previewTheme}
            width={Math.max(1, parseFloat(String(resolveDimension(brands, activeBrand, "skeleton-width", s) ?? "")) || 240)}
            height={Math.max(1, parseFloat(String(resolveDimension(brands, activeBrand, "skeleton-height", s) ?? "")) || 16)}
            radius={Math.max(0, parseFloat(String(resolveDimension(brands, activeBrand, "skeleton-radius", s) ?? "")) || 0)}
            circle={row.circle}
            animate={animate}
          />
        )}
      />
    </div>
  );
}

export function SkeletonPropertiesPanel({
  size,
  setSize,
  radius,
  setRadius,
  circle,
  setCircle,
  animate,
  setAnimate,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PropertyRow label="Size Preset" value={size} onChange={setSize} options={SKELETON_SIZE_OPTIONS} />
      <div style={{ fontSize: 11, color: "#868E96", marginTop: -4 }}>
        Width and height are controlled by `skeleton-width` and `skeleton-height` tokens for the selected size.
      </div>
      <PropertyRow label="Radius" value={radius} onChange={setRadius} options={SKELETON_RADIUS_OPTIONS} />
      <ToggleRow label="Circle" checked={circle} onChange={setCircle} />
      <ToggleRow label="Animate" checked={animate} onChange={setAnimate} />
    </div>
  );
}
