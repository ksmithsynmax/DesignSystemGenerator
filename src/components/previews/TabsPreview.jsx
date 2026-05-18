import { useState } from "react";
import { Tabs } from "@mantine/core";
import Image01Icon from "@untitledui-icons/react/line/Image01Icon";
import MessageCircle01Icon from "@untitledui-icons/react/line/MessageCircle01Icon";
import Settings01Icon from "@untitledui-icons/react/line/Settings01Icon";
import XCloseIcon from "@untitledui-icons/react/line/XCloseIcon";
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
  const listPadding = resolveDimension(brands, brandId, `${prefix}-list-padding`);
  const listGap = resolveDimension(brands, brandId, `${prefix}-list-gap`);
  const listBorderWidth = resolveDimension(brands, brandId, "tabs-list-border-width");
  const tabBorderWidth = resolveDimension(brands, brandId, "tabs-tab-border-width");
  const tabBorderWidthActive =
    resolveDimension(brands, brandId, `${prefix}-tab-border-width-active`) ??
    resolveDimension(brands, brandId, "tabs-tab-border-width-active");
  const overflowControlPaddingX =
    resolveDimension(brands, brandId, "tabs-outlined-overflow-control-padding-x") ?? 16;
  const overflowControlPaddingY =
    resolveDimension(brands, brandId, "tabs-outlined-overflow-control-padding-y") ?? 16;
  const panelPadding = resolveDimension(brands, brandId, "tabs-panel-padding");
  const iconSize = resolveDimension(brands, brandId, "tabs-icon-size");
  const iconStroke = resolveDimension(brands, brandId, "tabs-icon-stroke-width");
  const iconGap = resolveDimension(brands, brandId, "tabs-icon-gap");

  const currentState = state || "default";
  const forcedFocus = currentState === "focus";
  const forcedDisabled = currentState === "disabled";
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

  const listStyle = {
    display: "flex",
    flexDirection: orientation === "vertical" ? "column" : "row",
    alignItems: "stretch",
    gap: `${listGap}px`,
    backgroundColor: listBg,
    borderBottom:
      !isPillsVariant && orientation === "horizontal"
        ? `${listBorderWidth}px solid ${listBorder}`
        : "none",
    borderRight:
      !isPillsVariant && orientation === "vertical"
        ? `${listBorderWidth}px solid ${listBorder}`
        : "none",
    padding: `${listPadding}px`,
    width: "fit-content",
  };

  const showOverflowMenuControl = orientation === "horizontal";
  const menuControlStyle = isOutlinedVariant
    ? {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: tabBg,
        border: `${tabBorderWidth}px solid ${tabBorder}`,
        borderLeftWidth: "0px",
        padding: `${overflowControlPaddingY}px ${overflowControlPaddingX}px`,
        cursor: forcedDisabled ? "not-allowed" : "pointer",
        lineHeight: 0,
      }
    : {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: listBg,
        border: "none",
        borderBottom:
          orientation === "horizontal"
            ? `${listBorderWidth}px solid ${listBorder}`
            : "none",
        padding: "11px 4px",
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
                    borderRadius: `${tabsRadius}px`,
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
          {showOverflowMenuControl && (
            <button type="button" style={menuControlStyle} aria-label="Tabs menu" disabled={forcedDisabled}>
              <MenuControlGlyph size={16} color={isDefaultVariant ? tabText : tabTextActive} strokeWidth={iconStroke || 1.75} />
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
              border: `${listBorderWidth}px solid ${listBorder}`,
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
