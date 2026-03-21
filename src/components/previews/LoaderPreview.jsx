import { Loader } from "@mantine/core";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function LoaderPreview({
  brands,
  brandId,
  type = "oval",
  size = "md",
}) {
  const tokens = COMPONENT_TOKENS.loader;
  const color = resolveColor(brands, brandId, tokens["loader-color"]?.semantic, "light", "loader-color");
  const loaderSize = resolveDimension(brands, brandId, "loader-size", size);

  return <Loader type={type} color={color} size={loaderSize} />;
}
