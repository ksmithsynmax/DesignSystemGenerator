import { Image } from "@mantine/core";

export default function ImagePreview({
  src,
  alt,
  fallbackSrc,
  width = 320,
  height = 180,
  radius = "md",
  fit = "cover",
}) {
  const radiusPx = Math.max(0, parseFloat(String(radius ?? "")) || 0);

  return (
    <div
      style={{
        width,
        height,
        borderRadius: radiusPx,
        overflow: "hidden",
      }}
    >
      <Image
        src={src}
        alt={alt}
        fallbackSrc={fallbackSrc || undefined}
        w="100%"
        h="100%"
        radius={0}
        fit={fit}
      />
    </div>
  );
}
