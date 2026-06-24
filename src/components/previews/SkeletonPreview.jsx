import { resolveColor } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function SkeletonPreview({
  brands,
  brandId,
  width = 240,
  height = 16,
  radius = 4,
  circle = false,
  animate = true,
  previewTheme = "dark",
}) {
  const tokens = COMPONENT_TOKENS.skeleton;
  const theme = previewTheme === "dark" ? "dark" : "light";
  const fill = resolveColor(brands, brandId, tokens["skeleton-fill"]?.semantic, theme, "skeleton-fill");

  const heightPx = Math.max(1, parseFloat(String(height ?? "")) || 16);
  const widthPx = circle ? heightPx : Math.max(1, parseFloat(String(width ?? "")) || 240);
  const radiusPx = circle ? heightPx / 2 : Math.max(0, parseFloat(String(radius ?? "")) || 0);

  return (
    <div
      style={{
        width: widthPx,
        height: heightPx,
        borderRadius: radiusPx,
        backgroundColor: fill,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {animate && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0) 100%)",
            animation: "skeleton-shimmer 1.4s ease-in-out infinite",
          }}
        />
      )}
      <style>{`
        @keyframes skeleton-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
