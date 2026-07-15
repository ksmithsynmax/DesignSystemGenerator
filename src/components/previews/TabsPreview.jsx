import { useState } from "react";
import { Tabs } from "@mantine/core";
import Image01Icon from "@untitledui-icons/react/line/Image01Icon";
import MessageCircle01Icon from "@untitledui-icons/react/line/MessageCircle01Icon";
import Settings01Icon from "@untitledui-icons/react/line/Settings01Icon";
import XCloseIcon from "@untitledui-icons/react/line/XCloseIcon";
import ChevronLeftIcon from "@untitledui-icons/react/line/ChevronLeftIcon";
import ChevronRightIcon from "@untitledui-icons/react/line/ChevronRightIcon";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";
import MenuPreview from "./MenuPreview";

const TAB_ITEMS = [
  { key: "overview", label: "Overview", Icon: Image01Icon },
  { key: "details", label: "Details", Icon: MessageCircle01Icon },
  { key: "settings", label: "Settings", Icon: Settings01Icon },
  { key: "analytics", label: "Analytics", Icon: Image01Icon },
];

function getColor(brands, brandId, key, tokens) {
  return resolveColor(brands, brandId, tokens[key]?.semantic, "light", key);
}

function weightToCss(weight, isActive) {
  if (!isActive) return 400;
  if (weight === "Bold") return 700;
  if (weight === "Semi Bold") return 600;
  return 500;
}

function resolveTabsStyleVariant(variant) {
  if (variant === "outlined") return "outlined";
  if (variant === "pills") return "pills";
  return variant;
}

function MenuControlGlyph({ size, color, strokeWidth = 1.75 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M2.5 4.5H13.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M4.5 8H13.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M7 11.5H13.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export default function TabsPreview({
  brands,
  brandId,
  variant = "default",
  radius = "sm",
  orientation = "horizontal",
  state,
  showPanel = false,
  showMenu = false,
  showLeftIcon = false,
  showRightIcon = false,
  showLeftArrow = false,
  showRightArrow = false,
  interactive = false,
}) {
  const [activeTab, setActiveTab] = useState("details");
  const currentTab = interactive ? activeTab : "details";
  const tokens = COMPONENT_TOKENS.tabs;
  const styleVariant = resolveTabsStyleVariant(variant);
  const prefix = `tabs-${styleVariant}`;
  const isDefaultVariant = styleVariant === "default";
  const isPillsVariant = styleVariant === "pills";
  const isOutlinedVariant = styleVariant === "outlined";

  const listBg = getColor(brands, brandId, `${prefix}-list-background`, tokens);
  const listBorder = getColor(brands, brandId, `${prefix}-list-border`, tokens);
  const listBorderDisabled = getColor(brands, brandId, `${prefix}-list-border-disabled`, tokens);
  const tabBg = isDefaultVariant ? "transparent" : getColor(brands, brandId, `${prefix}-tab-background`, tokens);
  const tabBgHover = isDefaultVariant ? "transparent" : getColor(brands, brandId, `${prefix}-tab-background-hover`, tokens);
  const tabBgActive = getColor(brands, brandId, `${prefix}-tab-background-active`, tokens);
  const tabBgDisabled = isDefaultVariant ? "transparent" : getColor(brands, brandId, `${prefix}-tab-background-disabled`, tokens);
  const tabText = getColor(brands, brandId, `${prefix}-tab-text`, tokens);
  const tabTextHover = getColor(brands, brandId, `${prefix}-tab-text-hover`, tokens);
  const tabTextActive = getColor(brands, brandId, `${prefix}-tab-text-active`, tokens);
  const tabTextDisabled = getColor(brands, brandId, `${prefix}-tab-text-disabled`, tokens);
  const tabBorder = isDefaultVariant ? listBorder : getColor(brands, brandId, `${prefix}-tab-border`, tokens);
  const tabBorderHover = getColor(brands, brandId, `${prefix}-tab-border-hover`, tokens);
  const tabBorderActive = getColor(brands, brandId, `${prefix}-tab-border-active`, tokens);
  const tabBorderDisabled = getColor(brands, brandId, `${prefix}-tab-border-disabled`, tokens);
  const focusRing = getColor(brands, brandId, "tabs-focus-ring", tokens);

  const tabsRadius = resolveDimension(brands, brandId, `${prefix}-radius`, radius);
  const tabsFontSize = resolveDimension(brands, brandId, "tabs-font-size");
  const tabsFontFamily = resolveDimension(brands, brandId, "tabs-font-family");
  const tabsFontWeight = resolveDimension(brands, brandId, "tabs-font-weight");
  const tabsLineHeight = resolveDimension(brands, brandId, "tabs-line-height");
  const tabPaddingX = resolveDimension(brands, brandId, `${prefix}-tab-padding-x`);
  const tabPaddingY = resolveDimension(brands, brandId, `${prefix}-tab-padding-y`);
  // The outlined variant no longer has a list-padding token (tabs sit flush
  // against the list edge); default/pills still resolve their own value.
  const listPadding = isOutlinedVariant
    ? 0
    : resolveDimension(brands, brandId, `${prefix}-list-padding`) ?? 0;
  const listGap = resolveDimension(brands, brandId, `${prefix}-list-gap`);
  const listBorderWidth = resolveDimension(brands, brandId, "tabs-list-border-width");
  const tabBorderWidth = resolveDimension(brands, brandId, "tabs-tab-border-width");
  const tabBorderWidthActive =
    resolveDimension(brands, brandId, `${prefix}-tab-border-width-active`) ??
    resolveDimension(brands, brandId, "tabs-tab-border-width-active");
  const overflowControlPaddingX =
    resolveDimension(brands, brandId, "tabs-outlined-overflow-control-padding-x") ?? 16;
  // NOTE: overflow-control-padding-y is intentionally not used for the preview
  // height. The arrow/menu controls stretch to match the tab height instead, so
  // they always line up with the tabs regardless of the padding-y token value.
  const panelPadding = resolveDimension(brands, brandId, "tabs-panel-padding");
  const iconSize = resolveDimension(brands, brandId, "tabs-icon-size");
  const iconStroke = resolveDimension(brands, brandId, "tabs-icon-stroke-width");
  const iconGap = resolveDimension(brands, brandId, "tabs-icon-gap");

  const currentState = state || "default";
  const forcedFocus = currentState === "focus";
  const forcedDisabled = currentState === "disabled";
  // Disabled state can recolor the list border via a dedicated token (only
  // default has one today); otherwise the normal list border is used.
  const effectiveListBorder =
    forcedDisabled && listBorderDisabled ? listBorderDisabled : listBorder;
  const activeDemoKey = currentTab;

  const getVisualState = (tabKey) => {
    if (currentState === "disabled") return "disabled";
    if (currentState === "hover") return tabKey === activeDemoKey ? "hover" : "default";
    if (currentState === "focus") return tabKey === activeDemoKey ? "active" : "default";
    if (currentState === "active" || currentState === "default") {
      return tabKey === activeDemoKey ? "active" : "default";
    }
    return tabKey === activeDemoKey ? "active" : "default";
  };

  const getTabVisual = (tabKey) => {
    const visualState = getVisualState(tabKey);
    const bgMap = {
      default: tabBg,
      hover: tabBgHover,
      active: tabBgActive,
      disabled: tabBgDisabled,
    };
    const textMap = {
      default: tabText,
      hover: tabTextHover,
      active: tabTextActive,
      disabled: tabTextDisabled,
    };
    const borderMap = {
      default: tabBorder,
      hover: tabBorderHover,
      active: tabBorderActive,
      disabled: tabBorderDisabled,
    };
    return {
      bg: bgMap[visualState],
      text: textMap[visualState],
      border: borderMap[visualState],
      visualState,
    };
  };

  // Use an inset box-shadow for the list edge line instead of a real border so
  // it doesn't add to the list's box height (mirrors Figma's INSIDE stroke).
  // Otherwise the arrow/menu controls, which stretch to the list height, render
  // ~1px taller than the tabs.
  const listEdgeShadow = isPillsVariant
    ? "none"
    : orientation === "horizontal"
      ? `inset 0 -${listBorderWidth}px 0 0 ${effectiveListBorder}`
      : `inset -${listBorderWidth}px 0 0 0 ${effectiveListBorder}`;
  // Whether an overflow control is attached to each end of the tab list. When a
  // control is attached we drop the list's padding on that side so the control
  // sits flush against the end tab (no gap), and the overflow menu is always
  // present for horizontal non-pills tabs.
  const hasLeftControl =
    orientation === "horizontal" && !isPillsVariant && showLeftArrow;
  const hasRightControl = orientation === "horizontal" && !isPillsVariant;
  const listStyle = {
    display: "flex",
    flexDirection: orientation === "vertical" ? "column" : "row",
    alignItems: "stretch",
    gap: `${listGap}px`,
    backgroundColor: listBg,
    boxShadow: listEdgeShadow,
    paddingTop: listPadding,
    paddingBottom: listPadding,
    paddingLeft: hasLeftControl ? 0 : listPadding,
    paddingRight: hasRightControl ? 0 : listPadding,
    width: "fit-content",
  };

  const showOverflowMenuControl = orientation === "horizontal" && !isPillsVariant;
  // Overflow arrow controls (chevron left/right) mirror the Figma Tabs
  // LeftArrow / RightArrow variant props: only default & outlined, horizontal.
  const showArrowControls = orientation === "horizontal" && !isPillsVariant;
  const overflowIconColor =
    (forcedDisabled
      ? getColor(brands, brandId, `${prefix}-overflow-control-icon-disabled`, tokens)
      : null) ||
    getColor(brands, brandId, `${prefix}-overflow-control-icon`, tokens) ||
    (isDefaultVariant ? tabText : tabTextActive);
  // The overflow controls share the tab background/border, including the
  // disabled state, so they read as disabled alongside the tabs.
  const overflowControlBg = forcedDisabled ? tabBgDisabled : tabBg;
  // Default controls share the list's bottom rule, so match the dedicated
  // disabled list-border color; other variants use their tab border.
  const overflowControlBorder = forcedDisabled
    ? isDefaultVariant
      ? effectiveListBorder
      : tabBorderDisabled
    : tabBorder;
  const makeArrowControlStyle = (side) =>
    isOutlinedVariant
      ? {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: overflowControlBg,
          // Use pure per-side longhand border props (no `border` shorthand).
          // Mixing the shorthand with a longhand override is fragile in React:
          // when the shorthand re-applies on a re-render it resets the "removed"
          // side back to a full border, doubling up against the adjacent tab.
          borderStyle: "solid",
          borderColor: overflowControlBorder,
          borderTopWidth: `${tabBorderWidth}px`,
          borderBottomWidth: `${tabBorderWidth}px`,
          // Shared-edge model (matches Figma): the left arrow only draws its
          // outer (left) border; its right edge is the first tab's left border.
          // The right arrow draws neither side border when a menu follows (the
          // last tab owns its left edge, the menu owns their shared edge); if it
          // is the rightmost control it draws its own right border.
          borderRightWidth:
            side === "left"
              ? "0px"
              : showOverflowMenuControl
                ? "0px"
                : `${tabBorderWidth}px`,
          borderLeftWidth: side === "right" ? "0px" : `${tabBorderWidth}px`,
          // Round only the outer corners; the side facing the tabs stays square.
          borderTopLeftRadius: side === "left" ? tabsRadius : 0,
          borderBottomLeftRadius: side === "left" ? tabsRadius : 0,
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          // Vertical padding is 0 and the control stretches to the row height;
          // the margins cancel out the list's padding so the control lands at
          // the exact tab-cell height (not the taller padded list box).
          paddingTop: 0,
          paddingBottom: 0,
          paddingLeft: `${overflowControlPaddingX}px`,
          paddingRight: `${overflowControlPaddingX}px`,
          marginTop: listPadding,
          marginBottom: listPadding,
          cursor: forcedDisabled ? "not-allowed" : "pointer",
          lineHeight: 0,
        }
      : {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: listBg,
          border: "none",
          boxShadow: listEdgeShadow,
          paddingTop: 0,
          paddingBottom: 0,
          paddingLeft: 4,
          paddingRight: 4,
          marginTop: listPadding,
          marginBottom: listPadding,
          cursor: forcedDisabled ? "not-allowed" : "pointer",
          lineHeight: 0,
        };
  const renderArrowControl = (side) => {
    const Icon = side === "left" ? ChevronLeftIcon : ChevronRightIcon;
    return (
      <button
        type="button"
        style={makeArrowControlStyle(side)}
        aria-label={side === "left" ? "Previous tabs" : "Next tabs"}
        disabled={forcedDisabled}
      >
        <Icon
          width={iconSize}
          height={iconSize}
          strokeWidth={iconStroke || 2}
          style={{ color: overflowIconColor, display: "block" }}
        />
      </button>
    );
  };
  const menuControlStyle = isOutlinedVariant
    ? {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: overflowControlBg,
        // Pure per-side longhand (see arrow control note): avoids the shorthand
        // re-applying and resurrecting the merged-away left border.
        borderStyle: "solid",
        borderColor: overflowControlBorder,
        borderTopWidth: `${tabBorderWidth}px`,
        borderBottomWidth: `${tabBorderWidth}px`,
        borderRightWidth: `${tabBorderWidth}px`,
        // Menu owns its left border when a right arrow precedes it (the arrow
        // drops its right border). If the menu follows the list directly, the
        // last tab already owns that edge, so the menu drops its left border.
        borderLeftWidth:
          showArrowControls && showRightArrow ? `${tabBorderWidth}px` : "0px",
        // Menu is the rightmost control: round its right corners, square left.
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        borderTopRightRadius: tabsRadius,
        borderBottomRightRadius: tabsRadius,
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: `${overflowControlPaddingX}px`,
        paddingRight: `${overflowControlPaddingX}px`,
        marginTop: listPadding,
        marginBottom: listPadding,
        cursor: forcedDisabled ? "not-allowed" : "pointer",
        lineHeight: 0,
      }
    : {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: listBg,
        border: "none",
        boxShadow: listEdgeShadow,
        paddingTop: 0,
        paddingBottom: 0,
        marginTop: listPadding,
        marginBottom: listPadding,
        paddingLeft: 4,
        paddingRight: 4,
        cursor: forcedDisabled ? "not-allowed" : "pointer",
        lineHeight: 0,
      };

  return (
    <div
      style={{
        width: orientation === "vertical" ? 620 : 580,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: showMenu ? 6 : 0,
      }}
    >
      <Tabs
        unstyled
        orientation={orientation}
        value={currentTab}
        onChange={(value) => {
          if (interactive && !forcedDisabled && value) setActiveTab(value);
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "stretch", width: "fit-content" }}>
          {showArrowControls && showLeftArrow && renderArrowControl("left")}
          <Tabs.List style={listStyle}>
            {TAB_ITEMS.map(({ key, label, Icon }, tabIndex) => {
              const tabVisual = getTabVisual(key);
              const interactiveDisabled = forcedDisabled;
              const isFocusedPreviewTab = forcedFocus && key === activeDemoKey;
              const isWouldBeActiveTab = key === activeDemoKey;
              const isDefaultUnderlineState =
                tabVisual.visualState === "active" ||
                tabVisual.visualState === "hover" ||
                (tabVisual.visualState === "disabled" && isWouldBeActiveTab);
              const resolvedTabBorderWidth =
                isDefaultUnderlineState ? tabBorderWidthActive : tabBorderWidth;
              const tabStyle = isDefaultVariant
                ? {
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: tabVisual.bg,
                    border: "none",
                    borderBottom:
                      orientation === "horizontal" && isDefaultUnderlineState
                        ? `${resolvedTabBorderWidth}px solid ${tabVisual.border}`
                        : "none",
                    borderRight:
                      orientation === "vertical" && isDefaultUnderlineState
                        ? `${resolvedTabBorderWidth}px solid ${tabVisual.border}`
                        : "none",
                    borderRadius: 0,
                    padding: `${tabPaddingY}px ${tabPaddingX}px`,
                    color: tabVisual.text,
                    cursor: interactiveDisabled ? "not-allowed" : "pointer",
                    outline: isFocusedPreviewTab ? `2px solid ${focusRing}` : "none",
                    outlineOffset: isFocusedPreviewTab ? "2px" : "0px",
                    whiteSpace: "nowrap",
                  }
                : {
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: tabVisual.bg,
                    borderStyle: "solid",
                    borderColor: tabVisual.border,
                    borderTopWidth: `${resolvedTabBorderWidth}px`,
                    // Every tab draws its own right border (Figma model). The
                    // left edge of each tab is provided by the previous tab's
                    // right border, so only the first tab draws a left border.
                    // This means an active tab's left edge is the previous
                    // (default-colored) tab's right border, while its own top
                    // and right borders use the active color/width.
                    borderRightWidth: `${resolvedTabBorderWidth}px`,
                    borderBottomWidth: `${resolvedTabBorderWidth}px`,
                    borderLeftWidth:
                      isOutlinedVariant && orientation === "horizontal"
                        ? tabIndex === 0
                          ? `${resolvedTabBorderWidth}px`
                          : "0px"
                        : `${resolvedTabBorderWidth}px`,
                    ...(isOutlinedVariant && orientation === "vertical" && tabIndex > 0
                      ? { borderTopWidth: "0px" }
                      : {}),
                    ...(isOutlinedVariant &&
                    orientation === "horizontal" &&
                    tabVisual.visualState === "active"
                      ? {
                          borderBottomWidth: "0px",
                        }
                      : {}),
                    // Square the outer corner where an overflow control attaches
                    // so the control's rounded corner completes the group edge.
                    borderTopLeftRadius:
                      isOutlinedVariant && hasLeftControl && tabIndex === 0 ? 0 : tabsRadius,
                    borderBottomLeftRadius:
                      isOutlinedVariant && hasLeftControl && tabIndex === 0 ? 0 : tabsRadius,
                    borderTopRightRadius:
                      isOutlinedVariant && hasRightControl && tabIndex === TAB_ITEMS.length - 1
                        ? 0
                        : tabsRadius,
                    borderBottomRightRadius:
                      isOutlinedVariant && hasRightControl && tabIndex === TAB_ITEMS.length - 1
                        ? 0
                        : tabsRadius,
                    padding: `${tabPaddingY}px ${tabPaddingX}px`,
                    color: tabVisual.text,
                    cursor: interactiveDisabled ? "not-allowed" : "pointer",
                    outline: isFocusedPreviewTab ? `2px solid ${focusRing}` : "none",
                    outlineOffset: isFocusedPreviewTab ? "2px" : "0px",
                    whiteSpace: "nowrap",
                  };

              return (
                <Tabs.Tab
                  key={key}
                  value={key}
                  disabled={interactiveDisabled}
                  style={tabStyle}
                  styles={{
                    tabLabel: {
                      display: "contents",
                    },
                  }}
                >
                  <span style={{ display: "inline-grid", gridAutoFlow: "column", alignItems: "center", columnGap: `${iconGap}px` }}>
                    {showLeftIcon && (
                      <span
                        style={{
                          width: `${iconSize}px`,
                          height: `${iconSize}px`,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          lineHeight: 0,
                        }}
                      >
                        <Icon
                          width={iconSize}
                          height={iconSize}
                          strokeWidth={iconStroke || 2}
                          style={{ color: tabVisual.text, display: "block" }}
                        />
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: `${tabsFontSize}px`,
                        fontFamily: tabsFontFamily ? `"${tabsFontFamily}", sans-serif` : undefined,
                        fontWeight: weightToCss(
                          tabsFontWeight,
                          tabVisual.visualState === "active" || tabVisual.visualState === "hover"
                        ),
                        lineHeight: `${tabsLineHeight}px`,
                        color: tabVisual.text,
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      {label}
                    </span>
                    {showRightIcon && (
                      <span
                        style={{
                          width: `${iconSize}px`,
                          height: `${iconSize}px`,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          lineHeight: 0,
                        }}
                      >
                        <XCloseIcon
                          width={iconSize}
                          height={iconSize}
                          strokeWidth={iconStroke || 2}
                          style={{ color: tabVisual.text, display: "block" }}
                        />
                      </span>
                    )}
                  </span>
                </Tabs.Tab>
              );
            })}
          </Tabs.List>
          {showArrowControls && showRightArrow && renderArrowControl("right")}
          {showOverflowMenuControl && (
            <button type="button" style={menuControlStyle} aria-label="Tabs menu" disabled={forcedDisabled}>
              <MenuControlGlyph size={16} color={overflowIconColor} strokeWidth={iconStroke || 1.75} />
            </button>
          )}
        </div>
        {showPanel && (
          <Tabs.Panel
            value={currentTab}
            style={{
              marginTop: `${panelPadding}px`,
              padding: `${panelPadding}px`,
              color: tabText,
              border: `${listBorderWidth}px solid ${effectiveListBorder}`,
              borderRadius: `${tabsRadius}px`,
              width: "fit-content",
              minWidth: 260,
            }}
          >
            {currentTab.charAt(0).toUpperCase() + currentTab.slice(1)} content
          </Tabs.Panel>
        )}
      </Tabs>
      {showMenu && (
        <div style={{ display: "flex", justifyContent: "flex-end", width: "100%", minWidth: 156 }}>
          <MenuPreview
            brands={brands}
            brandId={brandId}
            state={forcedDisabled ? "disabled" : "default"}
            withSection
            withIcons
          />
        </div>
      )}
    </div>
  );
}
