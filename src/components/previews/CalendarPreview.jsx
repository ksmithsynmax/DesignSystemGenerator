import { useMemo, useState } from "react";
import ChevronLeftIcon from "@untitledui-icons/react/line/ChevronLeftIcon";
import ChevronRightIcon from "@untitledui-icons/react/line/ChevronRightIcon";
import Edit01Icon from "@untitledui-icons/react/line/Edit01Icon";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

const TOK = COMPONENT_TOKENS.calendar;

function mapFontWeight(label) {
  if (label === "Semi Bold" || label === "Semibold") return 600;
  if (label === "Bold") return 700;
  if (label === "Medium") return 500;
  return 400;
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Monday-first 6×7 matrix for the given month (trailing all-outside week dropped). */
function buildMonthMatrix(year, month) {
  const first = new Date(year, month, 1);
  const leading = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - leading);
  const rows = [];
  for (let r = 0; r < 6; r++) {
    const week = [];
    for (let c = 0; c < 7; c++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + (r * 7 + c));
      const dow = (d.getDay() + 6) % 7;
      week.push({ date: d, day: d.getDate(), month: d.getMonth(), year: d.getFullYear(), outside: d.getMonth() !== month, weekend: dow >= 5 });
    }
    rows.push(week);
  }
  while (rows.length > 5 && rows[rows.length - 1].every((c) => c.outside)) rows.pop();
  return rows;
}

function NavChevron({ dir, color }) {
  const Icon = dir === "left" ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <Icon width={18} height={18} strokeWidth={2} aria-hidden style={{ color, display: "block", flexShrink: 0 }} />
  );
}

const WEEKDAYS_FULL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function formatFieldDate(date) {
  // Mon-first index: JS getDay() is Sun=0..Sat=6.
  const dow = WEEKDAYS_FULL[(date.getDay() + 6) % 7];
  return `${dow}, ${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatInputDate(date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${date.getFullYear()}`;
}

/** Parse "MM/DD/YYYY" (lenient), returning a valid Date or null. */
function parseInputDate(str) {
  const s = String(str).trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const mo = +m[1] - 1;
    const da = +m[2];
    const yr = +m[3];
    const d = new Date(yr, mo, da);
    if (d.getFullYear() === yr && d.getMonth() === mo && d.getDate() === da) return d;
    return null;
  }
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : new Date(t);
}

function EditIcon({ color }) {
  return (
    <Edit01Icon width={18} height={18} strokeWidth={2} aria-hidden style={{ color, display: "block", flexShrink: 0 }} />
  );
}

export default function CalendarPreview({
  brands,
  brandId,
  previewTheme = "dark",
  showOutsideDays = true,
  showHeader = true,
}) {
  const colorTheme = previewTheme === "dark" ? "dark" : "light";

  const today = useMemo(() => new Date(), []);
  // "day" → days grid · "month" → months of a year · "year" → years of a decade.
  const [level, setLevel] = useState("day");
  const [view, setView] = useState(() => ({ year: today.getFullYear(), month: today.getMonth() }));
  // Seed a selected day so the selected token is visible without interaction.
  const [selected, setSelected] = useState(() => new Date(today.getFullYear(), today.getMonth(), 16));
  const [hovered, setHovered] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const startEditing = () => {
    setDraft(selected ? formatInputDate(selected) : "");
    setEditing(true);
  };
  const commitDraft = () => {
    const d = parseInputDate(draft);
    if (d) {
      setSelected(d);
      setView({ year: d.getFullYear(), month: d.getMonth() });
      setLevel("day");
    }
    setEditing(false);
  };

  const colors = useMemo(() => {
    const pick = (key) => resolveColor(brands, brandId, TOK[key]?.semantic, colorTheme, key);
    return {
      bg: pick("calendar-background"),
      border: pick("calendar-border"),
      headerText: pick("calendar-header-text"),
      navIcon: pick("calendar-nav-icon"),
      weekdayText: pick("calendar-weekday-text"),
      dayText: pick("calendar-day-text"),
      weekendText: pick("calendar-day-weekend-text"),
      outsideText: pick("calendar-day-outside-text"),
      hoverBg: pick("calendar-day-hover-background"),
      selectedBg: pick("calendar-day-selected-background"),
      selectedText: pick("calendar-day-selected-text"),
      todayBg: pick("calendar-day-today-background"),
      fieldLabel: pick("calendar-field-label-text"),
      fieldValue: pick("calendar-field-value-text"),
      fieldEditIcon: pick("calendar-field-edit-icon"),
      fieldDivider: pick("calendar-field-divider"),
    };
  }, [brands, brandId, colorTheme]);

  const dim = (key, fallback) => {
    const v = Number(resolveDimension(brands, brandId, key));
    return Number.isFinite(v) ? v : fallback;
  };
  const radius = dim("calendar-radius", 8);
  const borderWidth = dim("calendar-border-width", 1);
  const padding = dim("calendar-padding", 16);
  const daySize = dim("calendar-day-size", 36);
  const dayRadius = dim("calendar-day-radius", 8);
  const cellGap = dim("calendar-cell-gap", 2);
  const headerFontSize = dim("calendar-header-font-size", 14);
  const weekdayFontSize = dim("calendar-weekday-font-size", 12);
  const dayFontSize = dim("calendar-day-font-size", 13);
  const fieldPadding = dim("calendar-field-padding", 16);
  const fieldLabelFontSize = dim("calendar-field-label-font-size", 12);
  const fieldValueFontSize = dim("calendar-field-value-font-size", 20);
  const fontFamily = resolveDimension(brands, brandId, "calendar-font-family") || "Inter";
  const headerWeight = mapFontWeight(resolveDimension(brands, brandId, "calendar-header-font-weight"));
  const weekdayWeight = mapFontWeight(resolveDimension(brands, brandId, "calendar-weekday-font-weight"));
  const dayWeight = mapFontWeight(resolveDimension(brands, brandId, "calendar-day-font-weight"));
  const fieldLabelWeight = mapFontWeight(resolveDimension(brands, brandId, "calendar-field-label-font-weight"));
  const fieldValueWeight = mapFontWeight(resolveDimension(brands, brandId, "calendar-field-value-font-weight"));

  const gridWidth = 7 * daySize + 6 * cellGap;
  const decadeStart = Math.floor(view.year / 10) * 10;

  const headerLabel =
    level === "day" ? `${MONTHS_FULL[view.month]} ${view.year}`
    : level === "month" ? `${view.year}`
    : `${decadeStart} – ${decadeStart + 9}`;

  const headerClickable = level !== "year";
  const onHeaderClick = () => {
    if (level === "day") setLevel("month");
    else if (level === "month") setLevel("year");
  };

  const shift = (dir) => {
    if (level === "day") {
      let m = view.month + dir;
      let y = view.year;
      if (m < 0) { m = 11; y -= 1; }
      if (m > 11) { m = 0; y += 1; }
      setView({ year: y, month: m });
    } else if (level === "month") {
      setView({ year: view.year + dir, month: view.month });
    } else {
      setView({ year: view.year + dir * 10, month: view.month });
    }
  };

  // Shared cell renderer for any clickable control (day/month/year).
  const cellVisual = ({ key, label, color, background, cursor, onClick, width, isWeekday }) => (
    <div
      key={key}
      onMouseEnter={() => !isWeekday && onClick && setHovered(key)}
      onMouseLeave={() => !isWeekday && onClick && setHovered(null)}
      onClick={onClick || undefined}
      style={{
        width: width || daySize,
        height: daySize,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: dayRadius,
        background: background || "transparent",
        color,
        fontSize: isWeekday ? weekdayFontSize : dayFontSize,
        fontWeight: isWeekday ? weekdayWeight : dayWeight,
        fontVariantNumeric: "tabular-nums",
        cursor: cursor || "default",
        boxSizing: "border-box",
        userSelect: "none",
      }}
    >
      {label}
    </div>
  );

  const stateBg = ({ key, selected: isSel, today: isToday }) => {
    if (isSel) return colors.selectedBg;
    if (isToday) return colors.todayBg;
    if (hovered === key) return colors.hoverBg;
    return "transparent";
  };

  const renderDayView = () => {
    const rows = buildMonthMatrix(view.year, view.month);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: cellGap }}>
        <div style={{ display: "flex", gap: cellGap }}>
          {WEEKDAYS.map((wd) =>
            cellVisual({ key: `wd-${wd}`, label: wd, color: colors.weekdayText, isWeekday: true })
          )}
        </div>
        {rows.map((week, ri) => (
          <div key={ri} style={{ display: "flex", gap: cellGap }}>
            {week.map((cell, ci) => {
              if (cell.outside && !showOutsideDays) {
                return <div key={ci} style={{ width: daySize, height: daySize }} />;
              }
              const key = `d-${cell.year}-${cell.month}-${cell.day}`;
              const isSel = selected && !cell.outside &&
                selected.getFullYear() === cell.year && selected.getMonth() === cell.month && selected.getDate() === cell.day;
              const isToday = !cell.outside &&
                today.getFullYear() === cell.year && today.getMonth() === cell.month && today.getDate() === cell.day;
              const background = cell.outside ? "transparent" : stateBg({ key, selected: isSel, today: isToday });
              let color = cell.outside ? colors.outsideText : cell.weekend ? colors.weekendText : colors.dayText;
              if (isSel) color = colors.selectedText;
              return cellVisual({
                key: ci,
                label: cell.day,
                color,
                background,
                cursor: cell.outside ? "default" : "pointer",
                onClick: cell.outside ? undefined : () => setSelected(new Date(cell.year, cell.month, cell.day)),
              });
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderGrid = (items) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: cellGap, width: gridWidth }}>
      {items.map((it) => {
        const background = stateBg(it);
        const color = it.selected ? colors.selectedText : it.outside ? colors.outsideText : colors.dayText;
        return cellVisual({
          key: it.key,
          label: it.label,
          color,
          background,
          width: "100%",
          cursor: "pointer",
          onClick: it.onClick,
        });
      })}
    </div>
  );

  const renderMonthView = () =>
    renderGrid(
      MONTHS_SHORT.map((label, idx) => {
        const key = `m-${view.year}-${idx}`;
        const isSel = selected && selected.getFullYear() === view.year && selected.getMonth() === idx;
        const isToday = today.getFullYear() === view.year && today.getMonth() === idx;
        return {
          key, label, selected: isSel, today: isToday,
          onClick: () => { setView({ year: view.year, month: idx }); setLevel("day"); },
        };
      })
    );

  const renderYearView = () => {
    const years = [];
    for (let y = decadeStart - 1; y <= decadeStart + 10; y++) {
      const key = `y-${y}`;
      const outside = y < decadeStart || y > decadeStart + 9;
      const isSel = selected && selected.getFullYear() === y;
      const isToday = today.getFullYear() === y;
      years.push({
        key, label: y, outside, selected: isSel, today: isToday,
        onClick: () => { setView({ year: y, month: view.month }); setLevel("month"); },
      });
    }
    return renderGrid(years);
  };

  const fieldValueText = selected ? formatFieldDate(selected) : "Select a date";

  return (
    <div
      style={{
        fontFamily: `'${fontFamily}', sans-serif`,
        background: colors.bg,
        border: `${borderWidth}px solid ${colors.border}`,
        borderRadius: radius,
        display: "inline-block",
        overflow: "hidden",
      }}
    >
      {showHeader && (
        <div style={{ borderBottom: `${borderWidth}px solid ${colors.fieldDivider}` }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              padding: fieldPadding,
            }}
          >
            <span style={{ fontSize: fieldLabelFontSize, fontWeight: fieldLabelWeight, color: colors.fieldLabel }}>
              Select date
            </span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              {editing ? (
                <input
                  autoFocus
                  value={draft}
                  placeholder="MM/DD/YYYY"
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitDraft();
                    else if (e.key === "Escape") setEditing(false);
                  }}
                  onBlur={commitDraft}
                  style={{
                    background: "transparent",
                    border: "none",
                    borderBottom: `2px solid ${colors.selectedBg}`,
                    outline: "none",
                    color: colors.fieldValue,
                    fontSize: fieldValueFontSize,
                    fontWeight: fieldValueWeight,
                    fontFamily: "inherit",
                    padding: "0 0 2px",
                    flex: 1,
                    minWidth: 0,
                  }}
                />
              ) : (
                <span
                  onClick={startEditing}
                  style={{
                    fontSize: fieldValueFontSize,
                    fontWeight: fieldValueWeight,
                    color: colors.fieldValue,
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    cursor: "pointer",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {fieldValueText}
                </span>
              )}
              <button
                type="button"
                aria-label="Edit date"
                onClick={() => (editing ? commitDraft() : startEditing())}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <EditIcon color={colors.fieldEditIcon} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: gridWidth,
          marginBottom: 10,
        }}
      >
        <button
          type="button"
          aria-label="Previous"
          onClick={() => shift(-1)}
          style={navBtnStyle(daySize, dayRadius)}
        >
          <NavChevron dir="left" color={colors.navIcon} />
        </button>
        <button
          type="button"
          onClick={headerClickable ? onHeaderClick : undefined}
          style={{
            background: "transparent",
            border: "none",
            padding: "4px 10px",
            borderRadius: dayRadius,
            fontSize: headerFontSize,
            fontWeight: headerWeight,
            color: colors.headerText,
            cursor: headerClickable ? "pointer" : "default",
            fontFamily: "inherit",
          }}
        >
          {headerLabel}
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={() => shift(1)}
          style={navBtnStyle(daySize, dayRadius)}
        >
          <NavChevron dir="right" color={colors.navIcon} />
        </button>
      </div>

      {level === "day" ? renderDayView() : level === "month" ? renderMonthView() : renderYearView()}
      </div>
    </div>
  );
}

function navBtnStyle(size, radius) {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: size,
    height: size,
    border: "none",
    background: "transparent",
    borderRadius: radius,
    cursor: "pointer",
    padding: 0,
  };
}
