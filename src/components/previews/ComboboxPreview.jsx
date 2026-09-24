import { useState } from "react";
import ChevronRightIcon from "@untitledui-icons/react/line/ChevronRightIcon";
import CheckIcon from "@untitledui-icons/react/line/CheckIcon";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

const LIST_OPTIONS = ["Apples", "Bananas", "Broccoli", "Carrots", "Chocolate"];

// The `grid` variant is a SLOT: the design system styles the row CONTAINER
// (background/hover/selected, divider, radius, padding, gap) and the consumer
// composes whatever layout they want inside each row. These presets are just
// example slot contents so the tool can demonstrate that the same container
// styling works for any layout — none of this is a fixed contract.
const GRID_PRESETS = {
  vessel: {
    label: "Vessel row",
    rows: [
      { id: "INVICTUS", label: "INVICTUS", media: "🇺🇸", meta: [["IMO", "9381653"], ["MMSI", "338070829"]] },
      { id: "OCEAN MOON", label: "OCEAN MOON", media: "🇲🇭", meta: [["IMO", "9381653"], ["MMSI", "338070829"]] },
      { id: "UBC STOCKHOLM", label: "UBC STOCKHOLM", media: "🇨🇾", meta: [["IMO", "9381653"], ["MMSI", "338070829"]] },
      { id: "VIRGEN DE CORO…", label: "VIRGEN DE CORO…", media: "🇻🇪", meta: [["IMO", "9381653"], ["MMSI", "338070829"]] },
      { id: "KERKYRA", label: "KERKYRA", media: "🇵🇦", meta: [["IMO", "9381653"], ["MMSI", "338070829"]] },
    ],
    default: ["KERKYRA"],
    media: "emoji",
  },
  user: {
    label: "User row",
    rows: [
      { id: "ava", label: "Ava Chen", sub: "ava@acme.io", media: "AC", meta: [["Role", "Admin"]] },
      { id: "liam", label: "Liam Ford", sub: "liam@acme.io", media: "LF", meta: [["Role", "Editor"]] },
      { id: "noah", label: "Noah Kim", sub: "noah@acme.io", media: "NK", meta: [["Role", "Viewer"]] },
      { id: "mia", label: "Mia Ross", sub: "mia@acme.io", media: "MR", meta: [["Role", "Admin"]] },
    ],
    default: ["ava"],
    media: "avatar",
  },
  simple: {
    label: "Simple text",
    rows: [
      { id: "apples", label: "Apples" },
      { id: "bananas", label: "Bananas" },
      { id: "broccoli", label: "Broccoli" },
      { id: "carrots", label: "Carrots" },
    ],
    default: ["bananas"],
    media: "none",
  },
  custom: {
    label: "Custom (your content)",
    rows: [{ id: "row-1" }, { id: "row-2" }, { id: "row-3" }],
    default: [],
    media: "none",
  },
};

export default function ComboboxPreview({
  brands,
  brandId,
  variant = "list",
  size = "sm",
  radius = "sm",
  selectionMode = "multi",
  slotLayout = "custom",
  showLabel = true,
  labelText = "Label",
  withAsterisk = false,
  showError = false,
  errorText = "Error message",
  placeholder = "Search values",
  state,
  disabled,
  showDropdown = true,
  onToggleDropdown,
  interactive = false,
  previewTheme = "light",
}) {
  const tokens = COMPONENT_TOKENS.combobox;
  // Appearance is shared across variants — list vs grid is a LAYOUT change, not a
  // color change — so every color/type token is plain `combobox-*`. Only the grid
  // row CONTAINER has variant-specific tokens.
  const prefix = "combobox";
  const isGrid = variant === "grid";
  const isSingle = selectionMode === "single";
  const preset = GRID_PRESETS[slotLayout] || GRID_PRESETS.vessel;

  const isDisabled = disabled || state === "disabled";
  const isError = showError || state === "error";
  const isFocus = state === "focus";
  const isHover = state === "hover";

  const stateSuffix = isDisabled
    ? "-disabled"
    : isError
      ? "-error"
      : isFocus
        ? "-focus"
        : isHover
          ? "-hover"
          : "";

  const col = (keys, fallback = "transparent") => {
    const list = Array.isArray(keys) ? keys : [keys];
    for (const key of list) {
      const semantic = tokens[key]?.semantic;
      if (!semantic) continue;
      return resolveColor(brands, brandId, semantic, previewTheme, key);
    }
    return fallback;
  };
  const dim = (key, sizeKey) => resolveDimension(brands, brandId, key, sizeKey);

  const bg = col(`${prefix}-background${stateSuffix}`);
  const borderColor = col(`${prefix}-border${stateSuffix}`);
  const textColor = isDisabled ? col("combobox-text-disabled") : col("combobox-text");
  const placeholderColor = col(
    isDisabled
      ? [`${prefix}-placeholder-disabled`, "combobox-placeholder-disabled", `${prefix}-placeholder`]
      : isError
        ? [`${prefix}-placeholder-error`, "combobox-placeholder-error", `${prefix}-placeholder`]
        : [`${prefix}-placeholder`]
  );
  const labelColor = isDisabled
    ? col([`${prefix}-label-disabled`, "combobox-label-color"])
    : col("combobox-label-color");
  const asteriskColor = col("combobox-asterisk-color");
  const errorColor = col("combobox-error-color");
  const chevronColor = isDisabled
    ? col("combobox-icon-disabled")
    : isError
      ? col(["combobox-icon-error", "combobox-icon"])
      : col("combobox-icon");
  const focusRingColor = col("combobox-focus-ring");
  const dropdownBackground = col(`${prefix}-dropdown-background`);
  const dropdownBorderColor = col(`${prefix}-dropdown-border`);
  const optionSelectedBackground = col(`${prefix}-option-selected-background`);
  const optionSelectedText = col([`${prefix}-option-selected-text`, "combobox-text"]);
  const optionHoverBackground = col(`${prefix}-option-hover-background`);
  const optionHoverText = col([`${prefix}-option-hover-text`, "combobox-text"]);
  const optionCheckColor = col("combobox-option-check-icon");

  const pillBackground = col(
    isDisabled
      ? ["combobox-pill-background-disabled", `${prefix}-pill-background`]
      : isError
        ? ["combobox-pill-background-error", `${prefix}-pill-background`]
        : [`${prefix}-pill-background`]
  );
  const pillText = col(
    isDisabled
      ? ["combobox-pill-text-disabled", "combobox-pill-text"]
      : isError
        ? ["combobox-pill-text-error", "combobox-pill-text"]
        : ["combobox-pill-text"]
  );
  const pillRemoveIcon = col(
    isDisabled
      ? ["combobox-pill-remove-icon-disabled", "combobox-pill-remove-icon"]
      : isError
        ? ["combobox-pill-remove-icon-error", "combobox-pill-remove-icon"]
        : ["combobox-pill-remove-icon"]
  );

  // Example grid slot-content styling. The grid ROW is a dev-owned slot, so the
  // control / meta / media styling below is intentionally NOT tokenized — it's
  // illustrative content resolved straight from semantic colors so the example
  // presets render sensibly. Only the row CONTAINER (divider, padding, gap) is
  // token-driven.
  const sem = (semantic) => resolveColor(brands, brandId, semantic, previewTheme);
  const controlBorder = sem("border-primary");
  const controlBackground = sem("surface-primary");
  const controlBackgroundSelected = sem("interactive-primary");
  const controlCheck = sem("text-on-interactive");
  const metaLabelColor = sem("text-placeholder");
  const metaValueColor = sem("text-primary");
  const rowDividerColor = col("combobox-grid-row-divider");

  const fontSize = dim("combobox-font-size", size);
  const fontFamily = dim(`${prefix}-font-family`);
  const fontWeight = dim(`${prefix}-font-weight`);
  const lineHeight = dim("combobox-line-height", size);
  const paddingX = dim(`${prefix}-padding-x`, size);
  const paddingY = dim(`${prefix}-padding-y`, size);
  const borderRadius = dim("combobox-radius", radius);
  const borderWidth = dim("combobox-border-width");
  const labelFontSize = dim("combobox-label-font-size");
  const labelFontFamily = dim("combobox-label-font-family");
  const labelFontWeight = dim("combobox-label-font-weight");
  const labelLineHeight = dim("combobox-label-line-height");
  const labelGap = dim("combobox-label-gap");
  const errorFontSize = dim("combobox-error-font-size");
  const errorFontFamily = dim("combobox-error-font-family");
  const errorFontWeight = dim("combobox-error-font-weight");
  const errorLineHeight = dim("combobox-error-line-height");
  const errorGap = dim("combobox-error-gap");
  const pillFontSize = dim("combobox-pill-font-size", size);
  const pillGap = dim("combobox-pill-gap");
  const pillRadius = dim("combobox-pill-radius", radius);
  const sectionSize = dim("combobox-icon-size", size);
  const iconStrokeWidth = dim("combobox-icon-stroke-width", size);
  const dropdownMaxHeight = dim("combobox-dropdown-max-height");
  const gridRowPaddingX = dim("combobox-grid-row-padding-x", size);
  const gridRowPaddingY = dim("combobox-grid-row-padding-y", size);
  const gridColumnGap = dim("combobox-grid-column-gap", size);
  // Illustrative sizes for the example slot content (not tokenized — dev-owned).
  const gridMetaFontSize = Math.max(11, Math.round((Number(fontSize) || 14) * 0.85));
  const gridMediaSize = Math.max(14, Math.round((Number(fontSize) || 14) * 1.1));
  const gridControlSize = Math.max(14, Math.round((Number(fontSize) || 14) * 1.25));
  const gridRowDividerWidth = dim("combobox-grid-row-divider-width");

  const bdValue = `${borderWidth}px solid ${borderColor}`;
  const dropdownBdValue = `${borderWidth}px solid ${dropdownBorderColor}`;
  const chevronIconSize = Math.max(8, Math.round((Number(sectionSize) || 20) * 0.7));
  const optionCheckSize = Math.max(12, Math.round(Number(fontSize) || 16));
  const fontWeightValue = fontWeight === "Semi Bold" ? 600 : fontWeight === "Bold" ? 700 : 400;
  const labelFontWeightValue = labelFontWeight === "Semi Bold" ? 600 : labelFontWeight === "Bold" ? 700 : 400;
  const errorFontWeightValue = errorFontWeight === "Semi Bold" ? 600 : errorFontWeight === "Bold" ? 700 : 400;

  const gridRows = preset.rows;
  const labelById = (id) => {
    if (!isGrid) return id;
    const row = gridRows.find((r) => r.id === id);
    return row ? row.label || row.id : id;
  };
  const dataDefault = isGrid ? preset.default : ["Bananas", "Broccoli", "Carrots"];
  const [selectedValues, setSelectedValues] = useState(dataDefault);
  const [hoveredOption, setHoveredOption] = useState(null);
  const canInteract = interactive && !isDisabled;
  const canShowDropdown = showDropdown && !isError && !isDisabled;
  const displayValues = interactive ? selectedValues : dataDefault;

  const commitSelection = (value) => {
    if (!canInteract) return;
    if (isSingle) {
      setSelectedValues([value]);
      return;
    }
    setSelectedValues((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };
  const removeValue = (value) => {
    if (!canInteract) return;
    setSelectedValues((prev) => prev.filter((v) => v !== value));
  };

  const renderControl = (selected) => (
    <span
      aria-hidden
      style={{
        width: gridControlSize,
        height: gridControlSize,
        flexShrink: 0,
        boxSizing: "border-box",
        border: `${borderWidth}px solid ${selected ? controlBackgroundSelected : controlBorder}`,
        backgroundColor: selected ? controlBackgroundSelected : controlBackground,
        borderRadius: isSingle ? "50%" : Math.max(3, Math.round(Number(borderRadius) || 4) * 0.75),
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {selected ? (
        isSingle ? (
          <span
            style={{
              width: Math.max(6, Math.round(Number(gridControlSize) * 0.4)),
              height: Math.max(6, Math.round(Number(gridControlSize) * 0.4)),
              borderRadius: "50%",
              backgroundColor: controlCheck,
            }}
          />
        ) : (
          <CheckIcon
            width={Math.max(10, Math.round(Number(gridControlSize) * 0.7))}
            height={Math.max(10, Math.round(Number(gridControlSize) * 0.7))}
            strokeWidth={Number.isFinite(Number(iconStrokeWidth)) ? Number(iconStrokeWidth) : 2}
            style={{ color: controlCheck, display: "block" }}
          />
        )
      ) : null}
    </span>
  );

  const renderMedia = (row) => {
    if (preset.media === "emoji" && row.media) {
      return <span aria-hidden style={{ fontSize: gridMediaSize, lineHeight: 1, flexShrink: 0 }}>{row.media}</span>;
    }
    if (preset.media === "avatar") {
      const d = Math.round(Number(gridMediaSize) * 1.4);
      return (
        <span
          aria-hidden
          style={{
            width: d,
            height: d,
            flexShrink: 0,
            borderRadius: "50%",
            backgroundColor: pillBackground,
            color: pillText,
            fontSize: Math.max(9, Math.round(Number(gridMediaSize) * 0.6)),
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {row.media}
        </span>
      );
    }
    return null;
  };

  const renderMetaColumn = (header, value, key) => (
    <div key={key} style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 84, flexShrink: 0 }}>
      <span style={{ color: metaLabelColor, fontSize: gridMetaFontSize, lineHeight: 1.2 }}>{header}</span>
      <span style={{ color: metaValueColor, fontSize: gridMetaFontSize, lineHeight: 1.2, fontWeight: 600 }}>{value}</span>
    </div>
  );

  // A single row's slot CONTENT for the current preset. The design system styles
  // the container around this; the content itself is what a dev supplies.
  const renderSlotContent = (row) => {
    if (slotLayout === "custom") {
      return (
        <div
          style={{
            flex: 1,
            minWidth: 0,
            border: `1px dashed ${rowDividerColor}`,
            borderRadius: Math.max(3, Math.round(Number(borderRadius) || 4) * 0.75),
            padding: "6px 10px",
            color: metaLabelColor,
            fontSize: gridMetaFontSize,
            // Regular weight so the placeholder reads as a neutral hint instead of
            // inheriting the row's semibold token (combobox-font-weight).
            fontWeight: 400,
            whiteSpace: "nowrap",
          }}
        >
          Your slot content (control, text, columns… — anything)
        </div>
      );
    }
    return (
      <>
        <span style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
          {renderMedia(row)}
          <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{row.label}</span>
            {row.sub ? (
              <span style={{ color: metaLabelColor, fontSize: gridMetaFontSize, lineHeight: 1.2 }}>{row.sub}</span>
            ) : null}
          </span>
        </span>
        {(row.meta || []).map(([header, value], i) => renderMetaColumn(header, value, `${row.id}-${i}`))}
      </>
    );
  };

  const renderPill = (label) => (
    <span
      key={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        backgroundColor: pillBackground,
        color: pillText,
        borderRadius: pillRadius,
        fontSize: pillFontSize,
        lineHeight: 1,
        padding: "3px 6px",
        whiteSpace: "nowrap",
        boxSizing: "border-box",
      }}
    >
      {label}
      <span
        aria-hidden
        onClick={canInteract ? (e) => { e.stopPropagation(); removeValue(label); } : undefined}
        style={{ color: pillRemoveIcon, fontSize: pillFontSize, lineHeight: 1, cursor: canInteract ? "pointer" : "default" }}
      >
        ×
      </span>
    </span>
  );

  const renderListDropdown = () => (
    <div
      style={{
        marginTop: 4,
        backgroundColor: dropdownBackground,
        border: dropdownBdValue,
        borderRadius: borderRadius,
        padding: 8,
        width: "100%",
        boxSizing: "border-box",
        maxHeight: dropdownMaxHeight ? `${dropdownMaxHeight}px` : undefined,
        overflowY: "auto",
      }}
    >
      {LIST_OPTIONS.map((opt) => {
        const isSelected = displayValues.includes(opt);
        const isOptionHover = canInteract && hoveredOption === opt;
        const rowBackground = isSelected ? optionSelectedBackground : isOptionHover ? optionHoverBackground : "transparent";
        const rowColor = isOptionHover ? optionHoverText : isSelected ? optionSelectedText : textColor;
        return (
          <div
            key={opt}
            onClick={() => commitSelection(opt)}
            onMouseEnter={canInteract ? () => setHoveredOption(opt) : undefined}
            onMouseLeave={canInteract ? () => setHoveredOption(null) : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              padding: `${paddingY}px ${paddingX}px`,
              borderRadius: borderRadius,
              backgroundColor: rowBackground,
              color: rowColor,
              fontSize,
              fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : undefined,
              fontWeight: fontWeightValue,
              lineHeight: lineHeight ? `${lineHeight}px` : undefined,
              whiteSpace: "nowrap",
              cursor: canInteract ? "pointer" : "default",
            }}
          >
            <span
              aria-hidden
              style={{ width: optionCheckSize, marginRight: 8, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            >
              {isSelected ? (
                <CheckIcon
                  width={optionCheckSize}
                  height={optionCheckSize}
                  strokeWidth={Number.isFinite(Number(iconStrokeWidth)) ? Number(iconStrokeWidth) : 2}
                  style={{ color: optionCheckColor, display: "block" }}
                />
              ) : null}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>{opt}</span>
          </div>
        );
      })}
    </div>
  );

  const renderGridDropdown = () => (
    <div
      style={{
        marginTop: 4,
        backgroundColor: dropdownBackground,
        border: dropdownBdValue,
        borderRadius: borderRadius,
        width: "100%",
        boxSizing: "border-box",
        maxHeight: dropdownMaxHeight ? `${dropdownMaxHeight}px` : undefined,
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {gridRows.map((row, rowIndex) => {
        const isSelected = displayValues.includes(row.id);
        const isOptionHover = canInteract && hoveredOption === row.id;
        const rowBackground = isSelected ? optionSelectedBackground : isOptionHover ? optionHoverBackground : "transparent";
        const rowColor = isOptionHover ? optionHoverText : isSelected ? optionSelectedText : textColor;
        return (
          <div
            key={row.id}
            onClick={() => commitSelection(row.id)}
            onMouseEnter={canInteract ? () => setHoveredOption(row.id) : undefined}
            onMouseLeave={canInteract ? () => setHoveredOption(null) : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: gridColumnGap,
              padding: `${gridRowPaddingY}px ${gridRowPaddingX}px`,
              backgroundColor: rowBackground,
              color: rowColor,
              fontSize,
              fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : undefined,
              fontWeight: fontWeightValue,
              lineHeight: lineHeight ? `${lineHeight}px` : undefined,
              whiteSpace: "nowrap",
              cursor: canInteract ? "pointer" : "default",
              borderTop: rowIndex === 0 ? "none" : `${gridRowDividerWidth}px solid ${rowDividerColor}`,
            }}
          >
            {/* The selection control lives INSIDE the slot (the dev renders it),
                so the empty "custom" slot shows nothing but the content area. The
                example presets include a checkbox because they choose to. */}
            {slotLayout !== "custom" && renderControl(isSelected)}
            {renderSlotContent(row)}
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ width: "100%" }}>
      {showLabel && (
        <div
          style={{
            color: labelColor,
            fontSize: labelFontSize,
            fontFamily: labelFontFamily ? `"${labelFontFamily}", sans-serif` : undefined,
            fontWeight: labelFontWeightValue,
            lineHeight: labelLineHeight ? `${labelLineHeight}px` : undefined,
            marginBottom: labelGap,
          }}
        >
          {labelText}
          {withAsterisk ? <span style={{ color: asteriskColor }}> *</span> : null}
        </div>
      )}
      <div
        onClick={isDisabled ? undefined : onToggleDropdown}
        style={{
          backgroundColor: bg,
          color: textColor,
          border: bdValue,
          borderRadius: borderRadius,
          paddingLeft: paddingX,
          paddingRight: paddingX,
          paddingTop: paddingY,
          paddingBottom: paddingY,
          fontFamily: fontFamily ? `"${fontFamily}", sans-serif` : undefined,
          fontWeight: fontWeightValue,
          lineHeight: lineHeight ? `${lineHeight}px` : undefined,
          fontSize,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 8,
          width: "100%",
          boxSizing: "border-box",
          opacity: isDisabled ? 0.6 : 1,
          cursor: !isDisabled && onToggleDropdown ? "pointer" : "default",
          ...(isFocus ? { boxShadow: `0 0 0 2px ${focusRingColor}40` } : {}),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: pillGap, flex: 1, minWidth: 0 }}>
          {isSingle ? (
            displayValues.length > 0 ? (
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{labelById(displayValues[0])}</span>
            ) : (
              <span style={{ color: placeholderColor, whiteSpace: "nowrap" }}>{placeholder}</span>
            )
          ) : displayValues.length > 0 ? (
            <>
              {displayValues.map((v) => renderPill(labelById(v)))}
              <span style={{ color: placeholderColor, whiteSpace: "nowrap" }}>{placeholder}</span>
            </>
          ) : (
            <span style={{ color: placeholderColor, whiteSpace: "nowrap" }}>{placeholder}</span>
          )}
        </div>
        <ChevronRightIcon
          width={chevronIconSize}
          height={chevronIconSize}
          strokeWidth={Number.isFinite(Number(iconStrokeWidth)) ? Number(iconStrokeWidth) : 2}
          aria-hidden
          style={{
            color: chevronColor,
            transform: canShowDropdown ? "rotate(270deg)" : "rotate(90deg)",
            display: "block",
            flexShrink: 0,
          }}
        />
      </div>
      {canShowDropdown && (isGrid ? renderGridDropdown() : renderListDropdown())}
      {isError && (
        <div
          style={{
            color: errorColor,
            fontSize: errorFontSize,
            fontFamily: errorFontFamily ? `"${errorFontFamily}", sans-serif` : undefined,
            fontWeight: errorFontWeightValue,
            lineHeight: errorLineHeight ? `${errorLineHeight}px` : undefined,
            marginTop: errorGap,
          }}
        >
          {errorText}
        </div>
      )}
    </div>
  );
}
