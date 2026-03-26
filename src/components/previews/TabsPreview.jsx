import { useState } from "react";
import { Tabs } from "@mantine/core";
import Image01Icon from "@untitledui-icons/react/line/Image01Icon";
import MessageCircle01Icon from "@untitledui-icons/react/line/MessageCircle01Icon";
import Settings01Icon from "@untitledui-icons/react/line/Settings01Icon";
import { resolveColor, resolveDimension } from "../../utils/resolveToken";
import { COMPONENT_TOKENS } from "../../data/componentTokens";

const VARIANT_MAP = {
  default: "default",
  outlined: "outline",
  pills: "pills",
};

function getColor(brands, brandId, key, tokens) {
  return resolveColor(brands, brandId, tokens[key]?.semantic, "light", key);
}

export default function TabsPreview({
  brands,
  brandId,
  variant = "default",
  radius = "sm",
  orientation = "horizontal",
  state,
  showPanel = false,
  showIcons = false,
  interactive = false,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const currentTab = interactive ? activeTab : "overview";
  const tokens = COMPONENT_TOKENS.tabs;
  const prefix = `tabs-${variant}`;

  const listBg = getColor(brands, brandId, `${prefix}-list-background`, tokens);
  const listBorder = getColor(brands, brandId, `${prefix}-list-border`, tokens);
  const tabBg = getColor(brands, brandId, `${prefix}-tab-background`, tokens);
  const tabBgHover = getColor(brands, brandId, `${prefix}-tab-background-hover`, tokens);
  const tabBgActive = getColor(brands, brandId, `${prefix}-tab-background-active`, tokens);
  const tabBgPressed = getColor(brands, brandId, `${prefix}-tab-background-pressed`, tokens);
  const tabBgDisabled = getColor(brands, brandId, `${prefix}-tab-background-disabled`, tokens);
  const tabText = getColor(brands, brandId, `${prefix}-tab-text`, tokens);
  const tabTextHover = getColor(brands, brandId, `${prefix}-tab-text-hover`, tokens);
  const tabTextActive = getColor(brands, brandId, `${prefix}-tab-text-active`, tokens);
  const tabTextPressed = getColor(brands, brandId, `${prefix}-tab-text-pressed`, tokens);
  const tabTextDisabled = getColor(brands, brandId, `${prefix}-tab-text-disabled`, tokens);
  const tabBorder = getColor(brands, brandId, `${prefix}-tab-border`, tokens);
  const tabBorderHover = getColor(brands, brandId, `${prefix}-tab-border-hover`, tokens);
  const tabBorderActive = getColor(brands, brandId, `${prefix}-tab-border-active`, tokens);
  const tabBorderPressed = getColor(brands, brandId, `${prefix}-tab-border-pressed`, tokens);
  const tabBorderDisabled = getColor(brands, brandId, `${prefix}-tab-border-disabled`, tokens);
  const focusRing = getColor(brands, brandId, "tabs-focus-ring", tokens);

  const tabsRadius = resolveDimension(brands, brandId, "tabs-radius", radius);
  const tabsFontSize = resolveDimension(brands, brandId, "tabs-font-size");
  const tabsFontFamily = resolveDimension(brands, brandId, "tabs-font-family");
  const tabsFontWeight = resolveDimension(brands, brandId, "tabs-font-weight");
  const tabsLineHeight = resolveDimension(brands, brandId, "tabs-line-height");
  const tabPaddingX = resolveDimension(brands, brandId, "tabs-tab-padding-x");
  const tabPaddingY = resolveDimension(brands, brandId, "tabs-tab-padding-y");
  const listGap = resolveDimension(brands, brandId, "tabs-list-gap");
  const listBorderWidth = resolveDimension(brands, brandId, "tabs-list-border-width");
  const tabBorderWidth = resolveDimension(brands, brandId, "tabs-tab-border-width");
  const panelPadding = resolveDimension(brands, brandId, "tabs-panel-padding");
  const iconSize = resolveDimension(brands, brandId, "tabs-icon-size");
  const iconGap = resolveDimension(brands, brandId, "tabs-icon-gap");

  const forcedHover = state === "hover";
  const forcedPressed = state === "pressed";
  const forcedFocus = state === "focus";
  const forcedDisabled = state === "disabled";
  const isPills = variant === "pills";

  const tabBaseBg = tabBg;
  const tabBaseText = tabText;
  const tabBaseBorder = tabBorder;
  const baseTabBg = tabBaseBg;
  const hoverTabBg = tabBgHover;
  const pressedTabBg = tabBgPressed;
  const activeTabBg = tabBgActive;

  const getTabVisual = (tabKey) => {
    const isActiveTab = tabKey === currentTab;

    if (isActiveTab && forcedDisabled) {
      return {
        backgroundColor: tabBgDisabled,
        color: tabTextDisabled,
        borderColor: tabBorderDisabled,
        cursor: "not-allowed",
        boxShadow: "none",
      };
    }

    if (isActiveTab && forcedPressed) {
      return {
        backgroundColor: pressedTabBg,
        color: tabTextPressed,
        borderColor: tabBorderPressed,
        cursor: "pointer",
        boxShadow: "none",
      };
    }

    if (isActiveTab && forcedHover) {
      return {
        backgroundColor: hoverTabBg,
        color: tabTextHover,
        borderColor: tabBorderHover,
        cursor: "pointer",
        boxShadow: "none",
      };
    }

    if (isActiveTab) {
      return {
        backgroundColor: activeTabBg,
        color: tabTextActive,
        borderColor: tabBorderActive,
        cursor: "pointer",
        boxShadow: forcedFocus ? `0 0 0 2px ${focusRing}40` : "none",
      };
    }

    return {
      backgroundColor: baseTabBg,
      color: tabBaseText,
      borderColor: tabBaseBorder,
      cursor: "pointer",
      boxShadow: "none",
    };
  };

  return (
    <div style={{ width: orientation === "vertical" ? 560 : 520 }}>
      <Tabs
        value={currentTab}
        onChange={interactive ? setActiveTab : undefined}
        orientation={orientation}
        variant={VARIANT_MAP[variant] || "default"}
        styles={{
          list: {
            backgroundColor: listBg,
            gap: `${listGap}px`,
            borderBottom: orientation === "horizontal" ? `${listBorderWidth}px solid ${listBorder}` : "none",
            borderInlineEnd: orientation === "vertical" ? `${listBorderWidth}px solid ${listBorder}` : "none",
            paddingBottom: orientation === "horizontal" ? 2 : 0,
            paddingInlineEnd: orientation === "vertical" ? 2 : 0,
          },
          tab: {
            backgroundColor: baseTabBg,
            color: tabBaseText,
            border: `${tabBorderWidth}px solid ${tabBaseBorder}`,
            borderRadius: `${tabsRadius}px`,
            padding: `${tabPaddingY}px ${tabPaddingX}px`,
            fontSize: `${tabsFontSize}px`,
            fontFamily: tabsFontFamily ? `"${tabsFontFamily}", sans-serif` : undefined,
            fontWeight: tabsFontWeight === "Semi Bold" ? 600 : tabsFontWeight === "Bold" ? 700 : 400,
            lineHeight: `${tabsLineHeight}px`,
            cursor: "pointer",
          },
          panel: {
            padding: `${panelPadding}px`,
            color: tabText,
          },
          tabSection: {
            width: `${iconSize}px`,
            minWidth: `${iconSize}px`,
            height: `${iconSize}px`,
            marginInlineEnd: `${iconGap}px`,
          },
        }}
      >
        <Tabs.List>
          <Tabs.Tab
            value="overview"
            disabled={false}
            leftSection={showIcons ? <Image01Icon width={iconSize} height={iconSize} /> : null}
            style={getTabVisual("overview")}
          >
            Overview
          </Tabs.Tab>
          <Tabs.Tab
            value="details"
            disabled={false}
            leftSection={showIcons ? <MessageCircle01Icon width={iconSize} height={iconSize} /> : null}
            style={getTabVisual("details")}
          >
            Details
          </Tabs.Tab>
          <Tabs.Tab
            value="settings"
            disabled={false}
            leftSection={showIcons ? <Settings01Icon width={iconSize} height={iconSize} /> : null}
            style={getTabVisual("settings")}
          >
            Settings
          </Tabs.Tab>
        </Tabs.List>

        {showPanel && <Tabs.Panel value="overview">Overview content</Tabs.Panel>}
        {showPanel && <Tabs.Panel value="details">Details content</Tabs.Panel>}
        {showPanel && <Tabs.Panel value="settings">Settings content</Tabs.Panel>}
      </Tabs>
    </div>
  );
}
