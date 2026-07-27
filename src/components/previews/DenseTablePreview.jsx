import { useMemo, useState } from "react";
import SwitchVertical01Icon from "@untitledui-icons/react/line/SwitchVertical01Icon";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

const TOK = COMPONENT_TOKENS.densetable;

function mapFontWeight(label) {
  if (label === "Semi Bold" || label === "Semibold") return 600;
  if (label === "Bold") return 700;
  if (label === "Medium") return 500;
  return 400;
}

// Header sort/filter affordance — Untitled UI "switch-vertical-01".
function SortGlyph({ color, size = 12, strokeWidth = 1.25 }) {
  const sw = Number.isFinite(Number(strokeWidth)) ? strokeWidth : 1.25;
  // The icon uses a 24px viewBox, so scale the token (rendered-px) stroke width
  // up to viewBox units to keep it visually consistent at the display size.
  const viewBoxStroke = size ? sw * (24 / size) : sw;
  return (
    <SwitchVertical01Icon
      width={size}
      height={size}
      strokeWidth={viewBoxStroke}
      style={{ color, flexShrink: 0 }}
      aria-hidden
    />
  );
}

// "list" icon (collapsed) — a small unordered-list glyph.
function ListIcon({ color, size = 10, strokeWidth = 1.25 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <path d="M5.5 4h7M5.5 8h7M5.5 12h7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M2.5 4h.01M2.5 8h.01M2.5 12h.01" stroke={color} strokeWidth={strokeWidth * 1.4} strokeLinecap="round" />
    </svg>
  );
}

// "x-close" icon (expanded).
function CloseIcon({ color, size = 10, strokeWidth = 1.25 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <path d="M12 4L4 12M4 4l8 8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Flag cell — a small country flag (no label), compact for a dense table.
// This is only a neutral stand-in; in Figma the Flag variant auto-swaps to the
// real flag component from the file's "Flags" set.
function FlagCell({ w, h, radius }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        overflow: "hidden",
        boxSizing: "border-box",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
      }}
      aria-hidden
    >
      <div style={{ flex: 1, background: "#000000" }} />
      <div style={{ flex: 1, background: "#D80027" }} />
      <div style={{ flex: 1, background: "#FFDA44" }} />
    </div>
  );
}

// Icon cell — a compact leading icon (alert-triangle) + short text.
function IconCell({ iconColor, textColor, iconSize, gap, fontSize, fontWeight }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap, minWidth: 0 }}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }} aria-hidden>
        <path
          d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"
          stroke={iconColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        style={{
          fontSize,
          fontWeight,
          color: textColor,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        Text
      </span>
    </span>
  );
}

// Detection cell — the real detection glyph (multi-color, not recolored) used as
// the preview stand-in. In Figma the Detection variant auto-swaps to the file's
// "Detection" component; the source SVG is 14×22, so we keep that aspect ratio.
function DetectionCell({ iconSize }) {
  const h = Math.max(16, Number(iconSize) + 4);
  const w = (h * 14) / 22;
  return (
    <svg width={w} height={h} viewBox="0 0 14 22" fill="none" style={{ flexShrink: 0 }} aria-hidden>
      <path
        d="M6.57363 20.9492L12.3973 20.9492L12.3973 16.1905C12.3972 5.46517 6.57362 0.949219 6.57362 0.949219C6.57362 0.949219 0.750003 5.46517 0.750009 16.1905L0.750012 20.9492H6.57363Z"
        fill="#FFA500"
      />
      <path
        d="M11.6475 16.1904C11.6474 10.9711 10.2316 7.29123 8.83887 4.92871C8.14112 3.74515 7.44669 2.88749 6.93262 2.33105C6.79977 2.18727 6.67877 2.0639 6.57324 1.95996C6.46784 2.0638 6.34749 2.18749 6.21485 2.33105C5.70074 2.88752 5.00542 3.74503 4.30762 4.92871C2.91489 7.29124 1.50003 10.9711 1.50001 16.1904L1.50001 20.1992L11.6475 20.1992L11.6475 16.1904ZM13.1475 21.6992L1.33129e-05 21.6992L9.93316e-06 16.1904C2.67762e-05 10.6846 1.49659 6.74375 3.01563 4.16699C3.77373 2.88101 4.53546 1.93892 5.11328 1.31348C5.40213 1.00084 5.6449 0.766613 5.81934 0.608398C5.90657 0.529278 5.97732 0.469597 6.02734 0.427734C6.05232 0.406836 6.07229 0.389703 6.08691 0.37793C6.09401 0.37222 6.1 0.36781 6.10449 0.364258C6.10679 0.362444 6.10875 0.360625 6.11035 0.359375L6.1123 0.357422H6.11328L6.11426 0.356445L6.57324 0L7.0332 0.356445L7.03418 0.357422H7.03516L7.03711 0.359375C7.0387 0.360616 7.0407 0.362469 7.04297 0.364258C7.04747 0.367818 7.05346 0.372228 7.06055 0.37793C7.07519 0.389718 7.0951 0.406798 7.12012 0.427734C7.17015 0.469603 7.24089 0.529279 7.32813 0.608398C7.50258 0.766631 7.74534 1.00084 8.03418 1.31348C8.61201 1.93892 9.37373 2.88101 10.1318 4.16699C11.6509 6.74376 13.1474 10.6846 13.1475 16.1904L13.1475 21.6992Z"
        fill="#111326"
      />
      <path
        d="M8.56826 15.648L8.27415 15.3468L8.62802 14.9621C9.05435 14.4908 9.24555 14.1002 9.33583 13.5178C9.45686 12.6857 9.18094 11.8568 8.58488 11.2464L8.27509 10.9292L8.57628 10.6351L8.87746 10.341L9.16372 10.6341C9.81468 11.3007 10.1729 12.2139 10.1576 13.1703C10.1423 14.1267 9.85998 14.8338 9.2123 15.5604L8.86236 15.9492L8.56826 15.648Z"
        fill="#111326"
      />
      <path
        d="M4.58116 15.648L4.87526 15.3468L4.5214 14.9621C4.09506 14.4908 3.90387 14.1002 3.81359 13.5178C3.69256 12.6857 3.96848 11.8568 4.56453 11.2464L4.87432 10.9292L4.57314 10.6351L4.27195 10.341L3.98569 10.6341C3.33474 11.3007 2.97647 12.2139 2.99181 13.1703C3.00715 14.1267 3.28943 14.8338 3.93711 15.5604L4.28705 15.9492L4.58116 15.648Z"
        fill="#111326"
      />
      <path
        d="M8.57324 13.1992C8.57324 14.3038 7.67781 15.1992 6.57324 15.1992C5.46867 15.1992 4.57324 14.3038 4.57324 13.1992C4.57324 12.0946 5.46867 11.1992 6.57324 11.1992C7.67781 11.1992 8.57324 12.0946 8.57324 13.1992Z"
        fill="#111326"
      />
    </svg>
  );
}

// Per (content) column cell type for the demo. The last column is the action
// column, handled separately.
const COLUMN_TYPES = ["text", "flag", "text", "text", "detection"];

const COLS = 6;
const DEMO_ROWS = 4;

export default function DenseTablePreview({
  brands,
  brandId,
  previewTheme = "dark",
  showAction = true,
  showRowHover = true,
  showRowActive = true,
}) {
  const colorTheme = previewTheme === "dark" ? "dark" : "light";
  const [hoveredRow, setHoveredRow] = useState(null);
  const [expanded, setExpanded] = useState({ 2: true });
  // Clicking a row selects it as the active/highlighted row.
  const [activeRow, setActiveRow] = useState(1);

  const colors = useMemo(() => {
    const pick = (key) => resolveColor(brands, brandId, TOK[key]?.semantic, colorTheme, key);
    return {
      bg: pick("densetable-background"),
      headerCellBg: pick("densetable-header-cell-background"),
      headerText: pick("densetable-header-text"),
      sortIcon: pick("densetable-sort-icon"),
      cellText: pick("densetable-cell-text"),
      rowDivider: pick("densetable-row-divider"),
      rowHover: pick("densetable-row-hover"),
      rowHoverText: pick("densetable-row-hover-text"),
      rowActive: pick("densetable-row-active"),
      rowActiveText: pick("densetable-row-active-text"),
      actionBg: pick("densetable-action-background"),
      actionIcon: pick("densetable-action-icon"),
      expansionBg: pick("densetable-expansion-background"),
      expansionBorder: pick("densetable-expansion-border"),
      expansionText: pick("densetable-expansion-text"),
      iconColor: pick("densetable-icon-color"),
      iconText: pick("densetable-icon-text"),
      detectionIcon: pick("densetable-detection-icon"),
    };
  }, [brands, brandId, colorTheme]);

  const dim = (key, fallback) => {
    const v = Number(resolveDimension(brands, brandId, key));
    return Number.isFinite(v) ? v : fallback;
  };

  const headPadX = dim("densetable-header-padding-x", 8);
  const headPadY = dim("densetable-header-padding-y", 4);
  const headFont = dim("densetable-header-font-size", 10);
  const headWeight = mapFontWeight(resolveDimension(brands, brandId, "densetable-header-font-weight"));
  const headIconGap = dim("densetable-header-icon-gap", 4);
  const headIconSize = dim("densetable-header-icon-size", 12);
  const sortStroke = dim("densetable-sort-icon-stroke-width", 1.25);
  const cellPadX = dim("densetable-cell-padding-x", 8);
  const cellPadY = dim("densetable-cell-padding-y", 6);
  const cellFont = dim("densetable-cell-font-size", 12);
  const cellWeight = mapFontWeight(resolveDimension(brands, brandId, "densetable-cell-font-weight"));
  const cellFamily = resolveDimension(brands, brandId, "densetable-cell-font-family") || "Inter";
  const actionIconSize = dim("densetable-action-icon-size", 10);
  const actionPad = dim("densetable-action-padding", 4);
  const actionRadius = dim("densetable-action-radius", 2);
  const expPadX = dim("densetable-expansion-padding-x", 12);
  const expPadY = dim("densetable-expansion-padding-y", 12);
  const expRadius = dim("densetable-expansion-radius", 6);
  const expGap = dim("densetable-expansion-gap", 2);
  const flagW = dim("densetable-flag-width", 18);
  const flagH = dim("densetable-flag-height", 13);
  const flagRadius = dim("densetable-flag-radius", 2);
  const iconSize = dim("densetable-icon-size", 12);
  const iconGap = dim("densetable-icon-gap", 6);
  const detIconSize = dim("densetable-detection-icon-size", 14);
  // Caret pointer sizing / horizontal placement (centered under the action button).
  const caretSize = 12;
  const caretRightCenter = 2 * actionPad + actionIconSize / 2;
  const caretRight = Math.max(2, caretRightCenter - caretSize / 2);

  const toggleRow = (i) => setExpanded((prev) => ({ ...prev, [i]: !prev[i] }));

  const cols = Array.from({ length: COLS });
  const rows = Array.from({ length: DEMO_ROWS });

  return (
    <div
      style={{
        fontFamily: `'${cellFamily}', sans-serif`,
        background: colors.bg,
        overflow: "hidden",
        maxWidth: "100%",
      }}
    >
      <div style={{ overflowX: "auto", width: "100%" }}>
        <div style={{ minWidth: 360, width: "100%" }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "stretch" }}>
            {cols.map((_, c) => {
              // The last column hosts the action button, so when actions are
              // shown its header carries no title or sort/filter icon.
              const isActionCol = c === COLS - 1 && showAction;
              return (
                <div
                  key={`h-${c}`}
                  style={{
                    flex: "1 1 0",
                    minWidth: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: headIconGap,
                    background: colors.headerCellBg,
                    padding: `${headPadY}px ${headPadX}px`,
                    boxSizing: "border-box",
                  }}
                >
                  {isActionCol ? null : (
                    <>
                      <span
                        style={{
                          fontSize: headFont,
                          fontWeight: headWeight,
                          color: colors.headerText,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        Label
                      </span>
                      <SortGlyph color={colors.sortIcon} size={headIconSize} strokeWidth={sortStroke} />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Body rows */}
          {rows.map((_, r) => {
            const isExpanded = Boolean(expanded[r]);
            const isActiveRow = showRowActive && r === activeRow;
            // The row directly above an active row hides its divider, so the
            // active highlight has no stray border cutting across its top edge.
            const nextRowActive = showRowActive && r + 1 === activeRow;
            // Hover takes precedence over the persistent active highlight.
            const isHoveredRow = showRowHover && hoveredRow === r;
            const rowBg = isHoveredRow
              ? colors.rowHover
              : isActiveRow
              ? colors.rowActive
              : "transparent";
            // Cell text follows the same precedence: hover > active > default.
            const cellTextColor = isHoveredRow
              ? colors.rowHoverText
              : isActiveRow
              ? colors.rowActiveText
              : colors.cellText;
            return (
              <div key={`row-${r}`}>
                <div
                  onMouseEnter={() => showRowHover && setHoveredRow(r)}
                  onMouseLeave={() => showRowHover && setHoveredRow(null)}
                  onClick={() => showRowActive && setActiveRow(r)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: rowBg,
                    cursor: showRowActive ? "pointer" : "default",
                    // Hide the divider when the row's expansion card is open (so the
                    // row connects to the card below it) or when the next row is
                    // active (so no border sits on top of the active highlight).
                    borderBottom:
                      isExpanded || nextRowActive ? "none" : `1px solid ${colors.rowDivider}`,
                    boxSizing: "border-box",
                  }}
                >
                  {cols.map((__, c) => {
                    const isLast = c === COLS - 1;
                    const showBtn = isLast && showAction;
                    const cellType = isLast ? "action" : COLUMN_TYPES[c] || "text";
                    return (
                      <div
                        key={`c-${r}-${c}`}
                        style={{
                          flex: "1 1 0",
                          minWidth: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: showBtn ? "flex-end" : "flex-start",
                          padding: showBtn
                            ? `${cellPadY}px ${actionPad}px ${cellPadY}px ${cellPadX}px`
                            : `${cellPadY}px ${cellPadX}px`,
                          boxSizing: "border-box",
                        }}
                      >
                        {showBtn ? (
                          <button
                            type="button"
                            onClick={() => toggleRow(r)}
                            aria-label={isExpanded ? "Collapse row" : "Expand row"}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: colors.actionBg,
                              border: "none",
                              borderRadius: actionRadius,
                              padding: actionPad,
                              cursor: "pointer",
                              lineHeight: 0,
                            }}
                          >
                            {isExpanded ? (
                              <CloseIcon color={colors.actionIcon} size={actionIconSize} strokeWidth={sortStroke} />
                            ) : (
                              <ListIcon color={colors.actionIcon} size={actionIconSize} strokeWidth={sortStroke} />
                            )}
                          </button>
                        ) : cellType === "flag" ? (
                          <FlagCell w={flagW} h={flagH} radius={flagRadius} />
                        ) : cellType === "icon" ? (
                          <IconCell
                            iconColor={colors.iconColor}
                            textColor={colors.iconText}
                            iconSize={iconSize}
                            gap={iconGap}
                            fontSize={cellFont}
                            fontWeight={cellWeight}
                          />
                        ) : cellType === "detection" ? (
                          <DetectionCell iconSize={detIconSize} />
                        ) : (
                          <span
                            style={{
                              fontSize: cellFont,
                              fontWeight: cellWeight,
                              color: cellTextColor,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            Text
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Inline expansion card */}
                {showAction && isExpanded ? (
                  <div style={{ position: "relative", marginTop: expGap, marginBottom: expGap }}>
                    <div
                      style={{
                        position: "relative",
                        zIndex: 0,
                        background: colors.expansionBg,
                        border: `1px solid ${colors.expansionBorder}`,
                        borderRadius: expRadius,
                        padding: `${expPadY}px ${expPadX}px`,
                        color: colors.expansionText,
                        fontSize: cellFont,
                        boxSizing: "border-box",
                      }}
                    >
                      Card content goes here
                    </div>
                    {/* Caret pointing up toward the action button. A square rotated
                        45° with a border on its two upper edges, painted ON TOP of the
                        card so its fill hides the card's straight top-border segment —
                        the outline then reads as one continuous shape routing up and
                        over the notch. */}
                    <div
                      style={{
                        position: "absolute",
                        zIndex: 1,
                        top: -(caretSize / 2),
                        right: caretRight,
                        width: caretSize,
                        height: caretSize,
                        background: colors.expansionBg,
                        borderTop: `1px solid ${colors.expansionBorder}`,
                        borderLeft: `1px solid ${colors.expansionBorder}`,
                        transform: "rotate(45deg)",
                        boxSizing: "border-box",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
