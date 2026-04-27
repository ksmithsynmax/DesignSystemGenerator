import { Loader } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

/** SVG arc ~77.5% of circle (matches Figma arc endingAngle π×1.55); stroke caps match Figma oval. */
function LoaderOvalSvg({ size, color, strokeWidth, strokeLinecap }) {
  const cx = size / 2;
  const cy = size / 2;
  const sw = Math.max(1, Number(strokeWidth) || 2);
  const r = Math.max(1, size / 2 - sw / 2);
  const c = 2 * Math.PI * r;
  const arcFrac = 0.775;
  const dash = arcFrac * c;
  const gap = c - dash + 0.001;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }} aria-hidden>
      <g>
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type="rotate"
          from={`0 ${cx} ${cy}`}
          to={`360 ${cx} ${cy}`}
          dur="1.2s"
          repeatCount="indefinite"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap={strokeLinecap}
          strokeDasharray={`${dash} ${gap}`}
        />
      </g>
    </svg>
  );
}

export default function LoaderPreview({
  brands,
  brandId,
  type = "oval",
  size = "md",
}) {
  const tokens = COMPONENT_TOKENS.loader;
  const color = resolveColor(brands, brandId, tokens["loader-color"]?.semantic, "light", "loader-color");
  const loaderSize = resolveDimension(brands, brandId, "loader-size", size);
  const strokeWidth = resolveDimension(brands, brandId, "loader-stroke-width", size);

  if (type === "oval" && loaderSize != null) {
    const cornerR = Number(resolveDimension(brands, brandId, "loader-oval-corner-radius", size)) || 0;
    const strokeLinecap = cornerR > 0 ? "round" : "butt";
    return (
      <LoaderOvalSvg
        size={loaderSize}
        color={color}
        strokeWidth={strokeWidth ?? 2}
        strokeLinecap={strokeLinecap}
      />
    );
  }

  return <Loader type={type} color={color} size={loaderSize} />;
}
