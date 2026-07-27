import { useMemo, useState } from "react";
import AlertTriangleIcon from "@untitledui-icons/react/line/AlertTriangleIcon";
import ArrowCircleRightIcon from "@untitledui-icons/react/line/ArrowCircleRightIcon";
import CheckCircleIcon from "@untitledui-icons/react/line/CheckCircleIcon";
import BadgePreview from "./BadgePreview";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

const TOK = COMPONENT_TOKENS.table;

function mapFontWeight(label) {
  if (label === "Semi Bold" || label === "Semibold") return 600;
  if (label === "Bold") return 700;
  if (label === "Medium") return 500;
  return 400;
}

function SortGlyph({ color, strokeWidth = 1.25 }) {
  const sw = Number.isFinite(Number(strokeWidth)) ? strokeWidth : 1.25;
  return (
    <svg width="16" height="16" viewBox="0 0 12 12" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <path d="M3 4L6 1L9 4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 8L6 11L9 8" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeaderLabel({ children, sortIconColor, sortIconStrokeWidth, fontSize, fontWeight, color, headerIconGap, showSort = true }) {
  const gapPx = Number(headerIconGap);
  const gap = showSort && Number.isFinite(gapPx) ? gapPx : showSort ? 4 : 0;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap,
        fontSize,
        fontWeight,
        color,
        whiteSpace: "nowrap",
      }}
    >
      {children}
      {showSort ? <SortGlyph color={sortIconColor} strokeWidth={sortIconStrokeWidth} /> : null}
    </span>
  );
}

function ProgressCell({ pct, track, fill, height, radius, labelColor }) {
  const h = Number(height) || 6;
  const r = Number(radius) || 8;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
      <div
        style={{
          width: 120,
          flexShrink: 0,
          height: h,
          borderRadius: r,
          background: track,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div style={{ width: `${pct}%`, height: "100%", background: fill, borderRadius: r }} />
      </div>
      <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", flexShrink: 0, color: labelColor }}>{pct}%</span>
    </div>
  );
}

function StatusCell({ kind, color, textColor }) {
  const iconProps = { width: 16, height: 16, style: { color, flexShrink: 0 } };
  let icon = <ArrowCircleRightIcon {...iconProps} />;
  if (kind === "pending") icon = <AlertTriangleIcon {...iconProps} />;
  if (kind === "complete") icon = <CheckCircleIcon {...iconProps} />;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: textColor }}>
      {icon}
      <span style={{ textTransform: "capitalize" }}>
        {kind === "complete" ? "Complete" : kind === "pending" ? "Pending" : "Queued"}
      </span>
    </span>
  );
}

/**
 * Generic demo rows — only illustrates patterns (text, composite, id, badge, progress, status).
 * Real apps swap in any column set; tokens still drive surfaces, borders, and accents.
 */
const DEMO_ROWS = [
  { title: "Quarterly review", description: "Consolidated metrics and narrative", region: "United Kingdom", regionEmoji: "🇬🇧", reference: "REQ-18402", priority: "high", progressPct: 60, status: "pending" },
  { title: "API migration", description: "Deprecate legacy auth endpoints", region: "China", regionEmoji: "🇨🇳", reference: "REQ-18403", priority: "medium", progressPct: 40, status: "pending" },
  { title: "Design tokens audit", description: "Align semantic colors across themes", region: "United States", regionEmoji: "🇺🇸", reference: "REQ-91021", priority: "low", progressPct: 80, status: "pending" },
  { title: "Mobile release", description: "Regression pass on checkout flows", region: "Germany", regionEmoji: "🇩🇪", reference: "REL-22041", priority: "high", progressPct: 40, status: "complete" },
  { title: "Data export", description: "Customer-requested CSV bundle", region: "Japan", regionEmoji: "🇯🇵", reference: "OPS-55102", priority: "high", progressPct: 65, status: "queued" },
  { title: "Incident follow-up", description: "Postmortem actions and owners", region: "United States", regionEmoji: "🇺🇸", reference: "INC-9033", priority: "medium", progressPct: 85, status: "pending" },
  { title: "Accessibility sweep", description: "Keyboard traps in settings modals", region: "United Kingdom", regionEmoji: "🇬🇧", reference: "A11Y-1204", priority: "high", progressPct: 40, status: "pending" },
  { title: "Partner integration", description: "Webhook signing verification", region: "Canada", regionEmoji: "🇨🇦", reference: "INT-7741", priority: "medium", progressPct: 60, status: "pending" },
];

// "Data export" — the row rendered in the active/selected state for illustration.
const ACTIVE_ROW_INDEX = 4;

export default function TablePreview({
  brands,
  brandId,
  previewTheme = "dark",
  showRowHover = true,
}) {
  const colorTheme = previewTheme === "dark" ? "dark" : "light";
  const [hoveredRow, setHoveredRow] = useState(null);

  const colors = useMemo(() => {
    const pick = (key) => resolveColor(brands, brandId, TOK[key]?.semantic, colorTheme, key);
    return {
      bg: pick("table-background"),
      headerBg: pick("table-header-background"),
      border: pick("table-border"),
      headerText: pick("table-header-text"),
      cellText: pick("table-cell-text"),
      cellIcon: pick("table-cell-icon"),
      rowHover: pick("table-row-hover"),
      rowHoverText: pick("table-row-hover-text"),
      rowActive: pick("table-row-active"),
      rowActiveText: pick("table-row-active-text"),
      progressTrack: pick("table-progress-track"),
      progressFill: pick("table-progress-fill"),
      progressLabel: pick("table-cell-text"),
      statusPending: pick("table-status-pending"),
      statusComplete: pick("table-status-complete"),
      statusQueued: pick("table-status-queued"),
    };
  }, [brands, brandId, colorTheme]);

  const padY = Number(resolveDimension(brands, brandId, "table-padding-y")) || 12;
  const headPadY = Number(resolveDimension(brands, brandId, "table-header-padding-y")) || 16;
  const headerIconGap = Number(resolveDimension(brands, brandId, "table-header-icon-gap")) || 4;
  const headerIconStrokeW = Number(resolveDimension(brands, brandId, "table-header-icon-stroke-width"));
  const headerIconStrokeWidth = Number.isFinite(headerIconStrokeW) ? headerIconStrokeW : 1.25;
  const cellPadY = Math.max(padY, 16);
  const headPadYResolved = Math.max(headPadY, 16);
  const padRest = 10;
  const padTitleCol = 16;
  const cellFont = 12;
  const headFont = 12;
  const headWeightLabel = resolveDimension(brands, brandId, "table-header-font-weight");
  const headWeight = mapFontWeight(headWeightLabel);
  const progBarH = 6;
  const progBarR = 8;

  const borderStyle = `1px solid ${colors.border}`;

  const cellBorderBase = {
    borderRight: borderStyle,
    borderBottom: borderStyle,
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        background: colors.bg,
        borderRadius: 0,
        overflow: "hidden",
        maxWidth: "100%",
      }}
    >
      <div style={{ overflowX: "auto", width: "100%" }}>
          <table
            style={{
              width: "100%",
              minWidth: 720,
              borderCollapse: "separate",
              borderSpacing: 0,
              fontSize: cellFont,
              color: colors.cellText,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    ...cellBorderBase,
                    borderLeft: borderStyle,
                    borderTop: borderStyle,
                    width: "18%",
                    background: colors.headerBg,
                    padding: `${headPadYResolved}px ${padTitleCol}px`,
                    textAlign: "left",
                    verticalAlign: "middle",
                  }}
                >
                  <HeaderLabel headerIconGap={headerIconGap} sortIconStrokeWidth={headerIconStrokeWidth} sortIconColor={colors.headerText} fontSize={headFont} fontWeight={headWeight} color={colors.headerText}>
                    Title
                  </HeaderLabel>
                </th>
                <th
                  style={{
                    ...cellBorderBase,
                    borderTop: borderStyle,
                    background: colors.headerBg,
                    padding: `${headPadYResolved}px ${padRest}px`,
                    textAlign: "left",
                    verticalAlign: "middle",
                  }}
                >
                  <HeaderLabel headerIconGap={headerIconGap} sortIconStrokeWidth={headerIconStrokeWidth} sortIconColor={colors.headerText} fontSize={headFont} fontWeight={headWeight} color={colors.headerText} showSort={false}>
                    Description
                  </HeaderLabel>
                </th>
                <th
                  style={{
                    ...cellBorderBase,
                    borderTop: borderStyle,
                    background: colors.headerBg,
                    padding: `${headPadYResolved}px ${padRest}px`,
                    textAlign: "left",
                    verticalAlign: "middle",
                  }}
                >
                  <HeaderLabel headerIconGap={headerIconGap} sortIconStrokeWidth={headerIconStrokeWidth} sortIconColor={colors.headerText} fontSize={headFont} fontWeight={headWeight} color={colors.headerText}>
                    Region
                  </HeaderLabel>
                </th>
                <th
                  style={{
                    ...cellBorderBase,
                    borderTop: borderStyle,
                    background: colors.headerBg,
                    padding: `${headPadYResolved}px ${padRest}px`,
                    textAlign: "left",
                    verticalAlign: "middle",
                  }}
                >
                  <HeaderLabel headerIconGap={headerIconGap} sortIconStrokeWidth={headerIconStrokeWidth} sortIconColor={colors.headerText} fontSize={headFont} fontWeight={headWeight} color={colors.headerText}>
                    Reference
                  </HeaderLabel>
                </th>
                <th
                  style={{
                    ...cellBorderBase,
                    borderTop: borderStyle,
                    background: colors.headerBg,
                    padding: `${headPadYResolved}px ${padRest}px`,
                    textAlign: "left",
                    verticalAlign: "middle",
                  }}
                >
                  <HeaderLabel headerIconGap={headerIconGap} sortIconStrokeWidth={headerIconStrokeWidth} sortIconColor={colors.headerText} fontSize={headFont} fontWeight={headWeight} color={colors.headerText}>
                    Level
                  </HeaderLabel>
                </th>
                <th
                  style={{
                    ...cellBorderBase,
                    borderTop: borderStyle,
                    background: colors.headerBg,
                    padding: `${headPadYResolved}px ${padRest}px`,
                    textAlign: "left",
                    verticalAlign: "middle",
                  }}
                >
                  <HeaderLabel headerIconGap={headerIconGap} sortIconStrokeWidth={headerIconStrokeWidth} sortIconColor={colors.headerText} fontSize={headFont} fontWeight={headWeight} color={colors.headerText}>
                    Progress
                  </HeaderLabel>
                </th>
                <th
                  style={{
                    ...cellBorderBase,
                    borderTop: borderStyle,
                    borderRight: borderStyle,
                    background: colors.headerBg,
                    padding: `${headPadYResolved}px ${padRest}px`,
                    textAlign: "left",
                    verticalAlign: "middle",
                    width: 100,
                  }}
                >
                  <HeaderLabel headerIconGap={headerIconGap} sortIconStrokeWidth={headerIconStrokeWidth} sortIconColor={colors.headerText} fontSize={headFont} fontWeight={headWeight} color={colors.headerText}>
                    Status
                  </HeaderLabel>
                </th>
              </tr>
            </thead>
            <tbody>
              {DEMO_ROWS.map((row, i) => {
                // One row is shown active to illustrate the active/selected state.
                // Active wins over hover (mutually exclusive), matching DenseTable.
                const isActive = i === ACTIVE_ROW_INDEX;
                const isHover = showRowHover && hoveredRow === i && !isActive;
                const rowBg = isActive ? colors.rowActive : isHover ? colors.rowHover : colors.bg;
                const rowText = isActive ? colors.rowActiveText : isHover ? colors.rowHoverText : colors.cellText;
                const levelLabel = row.priority.charAt(0).toUpperCase() + row.priority.slice(1);
                return (
                  <tr
                    key={`${row.reference}-${i}`}
                    onMouseEnter={() => showRowHover && setHoveredRow(i)}
                    onMouseLeave={() => showRowHover && setHoveredRow(null)}
                  >
                    <td
                      style={{
                        ...cellBorderBase,
                        borderLeft: borderStyle,
                        background: rowBg,
                        padding: `${cellPadY}px ${padTitleCol}px`,
                        verticalAlign: "middle",
                        whiteSpace: "nowrap",
                        color: rowText,
                      }}
                    >
                      {row.title}
                    </td>
                    <td
                      style={{
                        ...cellBorderBase,
                        background: rowBg,
                        padding: `${cellPadY}px ${padRest}px`,
                        verticalAlign: "middle",
                        whiteSpace: "nowrap",
                        color: rowText,
                      }}
                    >
                      {row.description}
                    </td>
                    <td
                      style={{
                        ...cellBorderBase,
                        background: rowBg,
                        padding: `${cellPadY}px ${padRest}px`,
                        verticalAlign: "middle",
                        whiteSpace: "nowrap",
                        color: rowText,
                      }}
                    >
                      <span style={{ marginRight: 10, fontSize: 14, lineHeight: 1 }}>{row.regionEmoji}</span>
                      {row.region}
                    </td>
                    <td
                      style={{
                        ...cellBorderBase,
                        background: rowBg,
                        padding: `${cellPadY}px ${padRest}px`,
                        verticalAlign: "middle",
                        fontVariantNumeric: "tabular-nums",
                        whiteSpace: "nowrap",
                        color: rowText,
                      }}
                    >
                      {row.reference}
                    </td>
                    <td
                      style={{
                        ...cellBorderBase,
                        background: rowBg,
                        padding: `${cellPadY}px ${padRest}px`,
                        verticalAlign: "middle",
                        overflow: "visible",
                      }}
                    >
                      {/*
                        Figma pitfall: do not give the cell/slot a fixed height (e.g. 16px) — it clips the badge.
                        Flex + visible overflow lets the row grow to token-driven badge height.
                      */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-start",
                          minHeight: 0,
                          overflow: "visible",
                        }}
                      >
                        <BadgePreview
                          brands={brands}
                          brandId={brandId}
                          variant="filled"
                          tone="default"
                          size="default"
                          radius="default"
                          circle={false}
                          fullWidth={false}
                          text={levelLabel}
                          previewTheme={colorTheme}
                          textTransform="capitalize"
                        />
                      </div>
                    </td>
                    <td style={{ ...cellBorderBase, background: rowBg, padding: `${cellPadY}px ${padRest}px`, verticalAlign: "middle", color: rowText }}>
                      <ProgressCell
                        pct={row.progressPct}
                        track={colors.progressTrack}
                        fill={colors.progressFill}
                        height={progBarH}
                        radius={progBarR}
                        labelColor={rowText}
                      />
                    </td>
                    <td
                      style={{
                        ...cellBorderBase,
                        borderRight: borderStyle,
                        background: rowBg,
                        padding: `${cellPadY}px ${padRest}px`,
                        verticalAlign: "middle",
                      }}
                    >
                      <StatusCell
                        kind={row.status}
                        color={isActive ? colors.rowActiveText : isHover ? colors.rowHoverText : colors.cellIcon}
                        textColor={rowText}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
      </div>
    </div>
  );
}
