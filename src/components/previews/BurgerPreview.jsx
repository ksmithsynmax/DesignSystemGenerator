import { useState } from "react";
import { getDefaultSizeKey, resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

export default function BurgerPreview({
  brands,
  brandId,
  size = "md",
  opened: controlledOpened,
  readOnly,
  state,
  previewTheme = "light",
}) {
  const [internalOpened, setInternalOpened] = useState(false);
  const isControlled = controlledOpened !== undefined;
  const opened = isControlled ? controlledOpened : internalOpened;

  const tokens = COMPONENT_TOKENS.burger;
  const isDisabled = state === "disabled";
  const isFocus = state === "focus";

  const colorKey = (base) => {
    const suffix = state && state !== "default" ? `-${state}` : "";
    const stateKey = `${base}${suffix}`;
    return tokens[stateKey] ? stateKey : base;
  };

  const lineColor = resolveColor(
    brands,
    brandId,
    tokens[colorKey("burger-color")]?.semantic,
    previewTheme,
    colorKey("burger-color")
  );
  const background = resolveColor(
    brands,
    brandId,
    tokens[colorKey("burger-background")]?.semantic,
    previewTheme,
    colorKey("burger-background")
  );
  const focusRing = resolveColor(
    brands,
    brandId,
    tokens["burger-focus-ring"]?.semantic,
    previewTheme,
    "burger-focus-ring"
  );

  const resolveSizeKey = (tokenName, requestedKey, fallbackKey = "md") => {
    if (requestedKey !== "default") return requestedKey;
    return getDefaultSizeKey(brands, brandId, tokenName) || fallbackKey;
  };
  const sizeKey = resolveSizeKey("burger-size", size, "md");

  const burgerSize = resolveDimension(brands, brandId, "burger-size", sizeKey) || 24;
  const lineSize = resolveDimension(brands, brandId, "burger-line-size", sizeKey) || 2;
  const lineGap = resolveDimension(brands, brandId, "burger-line-gap", sizeKey) || 6;
  const padding = resolveDimension(brands, brandId, "burger-padding", sizeKey) || 8;
  const radius = resolveDimension(brands, brandId, "burger-radius", sizeKey) || 8;
  const lineRadius = resolveDimension(brands, brandId, "burger-line-radius") ?? 2;
  const focusRingWidth = resolveDimension(brands, brandId, "burger-focus-ring-width") || 2;

  const barStyle = {
    width: burgerSize,
    height: lineSize,
    borderRadius: lineRadius,
    backgroundColor: lineColor,
    flex: "none",
  };

  return (
    <button
      type="button"
      aria-label="Toggle navigation"
      aria-expanded={opened}
      disabled={isDisabled}
      onClick={readOnly || isDisabled ? undefined : () => setInternalOpened((v) => !v)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding,
        border: "none",
        borderRadius: radius,
        backgroundColor: background,
        cursor: readOnly || isDisabled ? "default" : "pointer",
        opacity: isDisabled ? 0.6 : 1,
        outline: isFocus ? `${focusRingWidth}px solid ${focusRing}` : "none",
        outlineOffset: isFocus ? 2 : 0,
        pointerEvents: state && state !== "default" ? "none" : undefined,
      }}
    >
      {opened ? (
        <span
          style={{
            position: "relative",
            display: "block",
            width: burgerSize,
            height: burgerSize,
          }}
        >
          <span
            style={{
              ...barStyle,
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%) rotate(45deg)",
            }}
          />
          <span
            style={{
              ...barStyle,
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%) rotate(-45deg)",
            }}
          />
        </span>
      ) : (
        <span
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: lineGap,
            width: burgerSize,
            height: burgerSize,
          }}
        >
          <span style={barStyle} />
          <span style={barStyle} />
          <span style={barStyle} />
        </span>
      )}
    </button>
  );
}
