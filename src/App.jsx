import { useState, useCallback, useEffect } from "react";
import { Switch as MantineSwitch } from "@mantine/core";
import { INITIAL_BRANDS } from "./data/brands";
import {
  COMPONENT_NAMES,
  COMPONENT_SIZE_KEYS,
  getColorTokens,
  getDimensionTokens,
} from "./data/componentTokens";
import { resolveColor, getComponentDefaultSize } from "./utils/resolveToken";
import Section from "./components/shared/Section";
import ComponentSelect from "./components/shared/ComponentSelect";
import PrimitiveScale from "./components/editors/PrimitiveScale";
import TokenChainCard from "./components/editors/TokenChainCard";
import DimensionTokenRow from "./components/editors/DimensionTokenRow";
import AddPrimitiveForm from "./components/editors/AddPrimitiveForm";
import {
  ButtonPreviewContent,
  ButtonPropertiesPanel,
} from "./components/panels/ButtonPreviewPanel";
import {
  ActionIconPreviewContent,
  ActionIconPropertiesPanel,
} from "./components/panels/ActionIconPreviewPanel";
import {
  TabsPreviewContent,
  TabsPropertiesPanel,
} from "./components/panels/TabsPreviewPanel";
import {
  SwitchPreviewContent,
  SwitchPropertiesPanel,
} from "./components/panels/SwitchPreviewPanel";
import {
  CheckboxPreviewContent,
  CheckboxPropertiesPanel,
} from "./components/panels/CheckboxPreviewPanel";
import {
  RadioPreviewContent,
  RadioPropertiesPanel,
} from "./components/panels/RadioPreviewPanel";
import {
  ChipPreviewContent,
  ChipPropertiesPanel,
} from "./components/panels/ChipPreviewPanel";
import {
  TooltipPreviewContent,
  TooltipPropertiesPanel,
} from "./components/panels/TooltipPreviewPanel";
import {
  LoaderPreviewContent,
  LoaderPropertiesPanel,
} from "./components/panels/LoaderPreviewPanel";
import {
  PillPreviewContent,
  PillPropertiesPanel,
} from "./components/panels/PillPreviewPanel";
import {
  BadgePreviewContent,
  BadgePropertiesPanel,
} from "./components/panels/BadgePreviewPanel";
import {
  TextInputPreviewContent,
  TextInputPropertiesPanel,
} from "./components/panels/TextInputPreviewPanel";
import {
  SelectPreviewContent,
  SelectPropertiesPanel,
} from "./components/panels/SelectPreviewPanel";
import {
  NotificationPreviewContent,
  NotificationPropertiesPanel,
} from "./components/panels/NotificationPreviewPanel";
import {
  AlertPreviewContent,
  AlertPropertiesPanel,
} from "./components/panels/AlertPreviewPanel";
import {
  CardPreviewContent,
  CardPropertiesPanel,
} from "./components/panels/CardPreviewPanel";
import {
  SliderPreviewContent,
  SliderPropertiesPanel,
} from "./components/panels/SliderPreviewPanel";
import {
  RangeSliderPreviewContent,
  RangeSliderPropertiesPanel,
} from "./components/panels/RangeSliderPreviewPanel";
import {
  TitlePreviewContent,
  TitlePropertiesPanel,
} from "./components/panels/TitlePreviewPanel";
import {
  TextPreviewContent,
  TextPropertiesPanel,
} from "./components/panels/TextPreviewPanel";
import {
  ModalPreviewContent,
  ModalPropertiesPanel,
} from "./components/panels/ModalPreviewPanel";
import {
  AnchorPreviewContent,
  AnchorPropertiesPanel,
} from "./components/panels/AnchorPreviewPanel";
import FigmaSyncButton from "./components/FigmaSyncButton";
import { buildMarkdownExport } from "./utils/buildMarkdownExport";
import { buildComponentDocsExport } from "./utils/buildComponentDocsExport";
import { GLOBAL_PRIMITIVES } from "./data/brands";

const VARIANTS_BY_COMPONENT = {
  button: ["filled", "outlined", "ghost"],
  actionicon: ["default", "filled", "light", "outlined", "transparent"],
  tabs: ["default", "outlined", "pills"],
  checkbox: ["filled", "outlined"],
  chip: ["filled", "light", "outline"],
  badge: ["filled", "light", "outline", "dot"],
  alert: ["default", "filled", "light", "outline", "transparent", "white"],
  radio: ["filled", "outline"],
  textinput: ["default", "filled"],
  select: ["default", "filled"],
};

const APP_STORAGE_KEY = "design-system-generator:v1";
const DEFAULT_TITLE_TEXT = "Why guess when you can know";

function loadPersistedAppState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(APP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (_err) {
    return null;
  }
}

function enforceTextDefaultMappings(brandsInput) {
  if (!brandsInput || typeof brandsInput !== "object") return brandsInput;
  const next = JSON.parse(JSON.stringify(brandsInput));

  const applyMappings = (brandId, mappings) => {
    if (!next[brandId]) return;
    if (!next[brandId].semanticMap) next[brandId].semanticMap = {};
    if (!next[brandId].darkSemanticOverrides) next[brandId].darkSemanticOverrides = {};
    Object.entries(mappings).forEach(([semantic, mapping]) => {
      next[brandId].semanticMap[semantic] = { ...mapping };
      next[brandId].darkSemanticOverrides[semantic] = { ...mapping };
    });
  };

  applyMappings("theia", {
    "text-default": { color: "neutral", index: 0 },
    "text-subtle": { color: "slate-gray", index: 3 },
    "surface-primary": { color: "steel", index: 9 },
    "surface-secondary": { color: "steel", index: 8 },
    "subtle-primary": { color: "steel", index: 9 },
    "subtle-secondary": { color: "steel", index: 8 },
    "border-primary": { color: "steel", index: 7 },
  });
  applyMappings("hyperion", {
    "text-default": { color: "slate-purple", index: 9 },
    "text-subtle": { color: "slate-purple", index: 6 },
    "surface-primary": { color: "slate-purple", index: 0 },
    "surface-secondary": { color: "neutral", index: 0 },
    "subtle-primary": { color: "slate-purple", index: 0 },
    "subtle-secondary": { color: "neutral", index: 0 },
    "border-primary": { color: "slate-gray", index: 0 },
    "primary-border": { color: "slate-gray", index: 0 },
  });

  return next;
}

export default function App() {
  const COMPONENT_LABELS = {
    actionicon: "ActionIcon",
    textinput: "TextInput",
    rangeslider: "RangeSlider",
    multiselect: "MultiSelect",
  };
  const getComponentLabel = (name) =>
    COMPONENT_LABELS[name] || name.charAt(0).toUpperCase() + name.slice(1);

  const [brands, setBrands] = useState(() => {
    const persisted = loadPersistedAppState();
    return enforceTextDefaultMappings(persisted?.brands || INITIAL_BRANDS);
  });
  useEffect(() => {
    setBrands((prev) => enforceTextDefaultMappings(prev));
  }, []);
  const [activeBrand, setActiveBrand] = useState(() => {
    const persisted = loadPersistedAppState();
    return persisted?.activeBrand || "theia";
  });
  const [activeComponent, setActiveComponent] = useState("button");
  const [activeVariant, setActiveVariant] = useState("filled");
  const [activeTab, setActiveTab] = useState("preview");
  const [previewTheme, setPreviewTheme] = useState(() => {
    const persisted = loadPersistedAppState();
    return persisted?.previewTheme === "light" ? "light" : "dark";
  });
  if (typeof window !== "undefined") {
    window.__DSG_PREVIEW_THEME = previewTheme;
  }
  const [storybookLoading, setStorybookLoading] = useState(false);
  const [storybookError, setStorybookError] = useState(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(420);
  const previewPanelWidth = 640;
  const propertiesPanelWidth = 300;
  const componentsPanelWidth = 240;
  const [activeColorToken, setActiveColorToken] = useState(null);
  const [activeDimensionToken, setActiveDimensionToken] = useState(null);
  const [activeButtonState, setActiveButtonState] = useState("default");
  const [activeButtonLeftIcon, setActiveButtonLeftIcon] = useState(false);
  const [activeButtonRightIcon, setActiveButtonRightIcon] = useState(false);
  const [activeButtonFocusRingStyle, setActiveButtonFocusRingStyle] = useState("offset");
  const [activeActionIconState, setActiveActionIconState] = useState("default");
  const [activeActionIconFocusRingStyle, setActiveActionIconFocusRingStyle] = useState("offset");
  const [buildButtonVariants, setBuildButtonVariants] = useState(() => [...VARIANTS_BY_COMPONENT.button]);
  const [buildActionIconVariants, setBuildActionIconVariants] = useState(() => [...VARIANTS_BY_COMPONENT.actionicon]);
  const [buildTabsVariants, setBuildTabsVariants] = useState(() => [...VARIANTS_BY_COMPONENT.tabs]);

  const createResizeHandler = useCallback((setter, min, max) => {
    return (e) => {
      e.preventDefault();
      const startX = e.clientX;
      let startWidth = 0;
      setter((curr) => {
        startWidth = curr;
        return curr;
      });

      const onMove = (ev) => {
        const next = Math.min(max, Math.max(min, startWidth + ev.clientX - startX));
        setter(next);
      };

      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    };
  }, []);

  const handleLeftPanelDrag = createResizeHandler(setLeftPanelWidth, 300, 760);

  const brand = brands[activeBrand];
  const colorNames = Object.keys(brand.primitives);
  const globalColorNames = Object.keys(GLOBAL_PRIMITIVES);
  const defaultBrandColor = colorNames.includes("blue") ? "blue" : (colorNames[0] || "blue");
  const sizeKeys = COMPONENT_SIZE_KEYS[activeComponent] || [];

  // Derive default size per component from brand data
  const buttonDefault = getComponentDefaultSize(brands, activeBrand, "button") || "sm";
  const actionIconDefault = getComponentDefaultSize(brands, activeBrand, "actionicon") || "sm";
  const tabsDefault = getComponentDefaultSize(brands, activeBrand, "tabs") || "sm";
  const switchDefault = getComponentDefaultSize(brands, activeBrand, "switch") || "md";
  const sliderDefault = getComponentDefaultSize(brands, activeBrand, "slider") || "md";
  const rangeSliderDefault = getComponentDefaultSize(brands, activeBrand, "rangeslider") || "md";
  const checkboxDefault = getComponentDefaultSize(brands, activeBrand, "checkbox") || "md";
  const radioDefault = getComponentDefaultSize(brands, activeBrand, "radio") || "md";
  const chipDefault = getComponentDefaultSize(brands, activeBrand, "chip") || "md";
  const textInputDefault = getComponentDefaultSize(brands, activeBrand, "textinput") || "sm";
  const selectDefault = getComponentDefaultSize(brands, activeBrand, "select") || "sm";
  const cardDefault = getComponentDefaultSize(brands, activeBrand, "card") || "md";
  const loaderDefault = getComponentDefaultSize(brands, activeBrand, "loader") || "md";
  const pillDefault = getComponentDefaultSize(brands, activeBrand, "pill") || "md";
  const badgeDefault = getComponentDefaultSize(brands, activeBrand, "badge") || "md";
  const modalDefault = getComponentDefaultSize(brands, activeBrand, "modal") || "md";
  const anchorDefault = getComponentDefaultSize(brands, activeBrand, "anchor") || "md";

  const [activeSize, setActiveSize] = useState(buttonDefault);
  const [activeActionIconSize, setActiveActionIconSize] = useState(actionIconDefault);
  const [activeActionIconRadius, setActiveActionIconRadius] = useState(actionIconDefault);
  const [activeActionIconIcon, setActiveActionIconIcon] = useState("check");
  const [activeTabsRadius, setActiveTabsRadius] = useState(tabsDefault);
  const [activeTabsOrientation, setActiveTabsOrientation] = useState("horizontal");
  const [activeTabsShowPanel, setActiveTabsShowPanel] = useState(false);
  const [activeTabsShowLeftIcon, setActiveTabsShowLeftIcon] = useState(false);
  const [activeTabsShowRightIcon, setActiveTabsShowRightIcon] = useState(false);
  const [activeTabsState, setActiveTabsState] = useState("default");
  const [activeSwitchSize, setActiveSwitchSize] = useState(switchDefault);
  const [activeSwitchChecked, setActiveSwitchChecked] = useState(false);
  const [activeSwitchState, setActiveSwitchState] = useState("default");
  const [activeSliderSize, setActiveSliderSize] = useState(sliderDefault);
  const [activeSliderRadius, setActiveSliderRadius] = useState(sliderDefault);
  const [activeSliderState, setActiveSliderState] = useState("default");
  const [activeSliderMarks, setActiveSliderMarks] = useState(true);
  const [activeSliderValue, setActiveSliderValue] = useState(40);
  const [activeSliderLabelMode, setActiveSliderLabelMode] = useState("hover");
  const [activeRangeSliderSize, setActiveRangeSliderSize] = useState(rangeSliderDefault);
  const [activeRangeSliderRadius, setActiveRangeSliderRadius] = useState(rangeSliderDefault);
  const [activeRangeSliderState, setActiveRangeSliderState] = useState("default");
  const [activeRangeSliderMarks, setActiveRangeSliderMarks] = useState(true);
  const [activeRangeSliderValue, setActiveRangeSliderValue] = useState([20, 60]);
  const [activeRangeSliderLabelMode, setActiveRangeSliderLabelMode] = useState("hover");
  const [activeTitleOrder, setActiveTitleOrder] = useState("1");
  const [activeTitleSize, setActiveTitleSize] = useState("auto");
  const [activeTitleTextWrap, setActiveTitleTextWrap] = useState("wrap");
  const [activeTitleLineClamp, setActiveTitleLineClamp] = useState(0);
  const [activeTitleText, setActiveTitleText] = useState(
    DEFAULT_TITLE_TEXT
  );
  const [activeTextSizeToken, setActiveTextSizeToken] = useState("md");
  const [activeTextWeightMode, setActiveTextWeightMode] = useState("regular");
  const [activeTextStyleMode, setActiveTextStyleMode] = useState("normal");
  const [activeTextDecoration, setActiveTextDecoration] = useState("none");
  const [activeTextAlign, setActiveTextAlign] = useState("left");
  const [activeTextTransform, setActiveTextTransform] = useState("none");
  const [activeTextColorMode, setActiveTextColorMode] = useState("default");
  const [activeTextLineClamp, setActiveTextLineClamp] = useState(0);
  const [activeTextTruncate, setActiveTextTruncate] = useState("off");
  const [activeTextText, setActiveTextText] = useState(
    DEFAULT_TITLE_TEXT
  );
  const [activeCheckboxSize, setActiveCheckboxSize] = useState(checkboxDefault);
  const [activeCheckboxRadius, setActiveCheckboxRadius] = useState(checkboxDefault);
  const [activeCheckboxSelection, setActiveCheckboxSelection] = useState("unchecked");
  const [activeCheckboxState, setActiveCheckboxState] = useState("default");
  const [activeRadioSize, setActiveRadioSize] = useState(radioDefault);
  const [activeRadioChecked, setActiveRadioChecked] = useState(false);
  const [activeRadioState, setActiveRadioState] = useState("default");
  const [activeRadioShowLabel, setActiveRadioShowLabel] = useState(true);
  const [activeChipSize, setActiveChipSize] = useState(chipDefault);
  const [activeChipRadius, setActiveChipRadius] = useState(chipDefault);
  const [activeChipChecked, setActiveChipChecked] = useState(false);
  const [activeChipState, setActiveChipState] = useState("default");
  const [activeTooltipPosition, setActiveTooltipPosition] = useState("top");
  const [activeTooltipWithArrow, setActiveTooltipWithArrow] = useState(true);
  const [activeLoaderSize, setActiveLoaderSize] = useState(loaderDefault);
  const [activeLoaderType, setActiveLoaderType] = useState("oval");
  const [activePillSize, setActivePillSize] = useState(pillDefault);
  const [activePillWithRemoveButton, setActivePillWithRemoveButton] = useState(false);
  const [activePillText, setActivePillText] = useState("React");
  const [activeBadgeSize, setActiveBadgeSize] = useState(badgeDefault);
  const [activeBadgeRadius, setActiveBadgeRadius] = useState(badgeDefault);
  const [activeBadgeCircle, setActiveBadgeCircle] = useState(false);
  const [activeBadgeFullWidth, setActiveBadgeFullWidth] = useState(false);
  const [activeBadgeText, setActiveBadgeText] = useState("Badge");
  const [activeTextInputSize, setActiveTextInputSize] = useState(textInputDefault);
  const [activeTextInputRadius, setActiveTextInputRadius] = useState(textInputDefault);
  const [activeTextInputState, setActiveTextInputState] = useState("default");
  const [activeTextInputShowLabel, setActiveTextInputShowLabel] = useState(true);
  const [activeTextInputLabelText, setActiveTextInputLabelText] = useState("Label");
  const [activeTextInputWithAsterisk, setActiveTextInputWithAsterisk] = useState(false);
  const [activeTextInputShowError, setActiveTextInputShowError] = useState(false);
  const [activeTextInputErrorText, setActiveTextInputErrorText] = useState("Error message");
  const [activeSelectSize, setActiveSelectSize] = useState(selectDefault);
  const [activeSelectRadius, setActiveSelectRadius] = useState(selectDefault);
  const [activeSelectState, setActiveSelectState] = useState("default");
  const [activeSelectShowLabel, setActiveSelectShowLabel] = useState(true);
  const [activeSelectLabelText, setActiveSelectLabelText] = useState("Label");
  const [activeSelectWithAsterisk, setActiveSelectWithAsterisk] = useState(false);
  const [activeSelectShowError, setActiveSelectShowError] = useState(false);
  const [activeSelectErrorText, setActiveSelectErrorText] = useState("Error message");
  const [activeSelectSearchable, setActiveSelectSearchable] = useState(false);
  const [activeSelectClearable, setActiveSelectClearable] = useState(false);
  const [activeCardSize, setActiveCardSize] = useState(cardDefault);
  const [activeCardRadius, setActiveCardRadius] = useState(cardDefault);
  const [activeCardWithBorder, setActiveCardWithBorder] = useState(true);
  const [activeCardWithShadow, setActiveCardWithShadow] = useState(false);
  const [activeCardShowSection, setActiveCardShowSection] = useState(true);
  const [activeCardShowBadge, setActiveCardShowBadge] = useState(true);
  const [activeCardTitle, setActiveCardTitle] = useState("PlanetScope vessel");
  const [activeCardDescription, setActiveCardDescription] = useState(
    "Detected vessel metadata and imagery details from latest satellite capture."
  );
  const [activeNotificationRadius, setActiveNotificationRadius] = useState("md");
  const [activeNotificationColor, setActiveNotificationColor] = useState(defaultBrandColor);
  const [activeNotificationWithBorder, setActiveNotificationWithBorder] = useState(false);
  const [activeNotificationWithCloseButton, setActiveNotificationWithCloseButton] = useState(false);
  const [activeNotificationWithIcon, setActiveNotificationWithIcon] = useState(false);
  const [activeNotificationLoading, setActiveNotificationLoading] = useState(false);
  const [activeNotificationTitle, setActiveNotificationTitle] = useState("We notify you that");
  const [activeNotificationDescription, setActiveNotificationDescription] = useState(
    "You are now obligated to give a star to Mantine project on GitHub"
  );
  const [activeAlertRadius, setActiveAlertRadius] = useState("md");
  const [activeAlertColor, setActiveAlertColor] = useState(defaultBrandColor);
  const [activeAlertWithCloseButton, setActiveAlertWithCloseButton] = useState(false);
  const [activeAlertWithIcon, setActiveAlertWithIcon] = useState(true);
  const [activeAlertTitle, setActiveAlertTitle] = useState("Alert title");
  const [activeAlertMessage, setActiveAlertMessage] = useState(
    "Lorem ipsum dolor sit, amet consectetur adipisicing elit. At officiis, quae tempore necessitatibus placeat saepe."
  );
  const [activeAnchorSize, setActiveAnchorSize] = useState(anchorDefault);
  const [activeAnchorUnderline, setActiveAnchorUnderline] = useState("always");
  const [activeAnchorWeightMode, setActiveAnchorWeightMode] = useState("regular");
  const [activeAnchorState, setActiveAnchorState] = useState("default");
  const [activeAnchorText, setActiveAnchorText] = useState("View documentation");
  const [activeModalSize, setActiveModalSize] = useState(modalDefault);
  const [activeModalRadius, setActiveModalRadius] = useState(modalDefault);
  const [activeModalLayout, setActiveModalLayout] = useState("basic");
  const [activeModalWithOverlay, setActiveModalWithOverlay] = useState(true);
  const [activeModalWithCloseButton, setActiveModalWithCloseButton] = useState(true);
  const [activeModalCentered, setActiveModalCentered] = useState(true);
  const [activeModalTitle, setActiveModalTitle] = useState("Modal title");
  const [activeModalBody, setActiveModalBody] = useState(
    "This action cannot be undone. Please confirm you want to proceed."
  );

  // Sync active sizes when brand changes
  const handleBrandChange = useCallback((newBrand) => {
    setActiveBrand(newBrand);
    const btnDef = getComponentDefaultSize(brands, newBrand, "button") || "sm";
    const aiDef = getComponentDefaultSize(brands, newBrand, "actionicon") || "sm";
    const tbDef = getComponentDefaultSize(brands, newBrand, "tabs") || "sm";
    const swDef = getComponentDefaultSize(brands, newBrand, "switch") || "md";
    const slDef = getComponentDefaultSize(brands, newBrand, "slider") || "md";
    const rslDef = getComponentDefaultSize(brands, newBrand, "rangeslider") || "md";
    const cbDef = getComponentDefaultSize(brands, newBrand, "checkbox") || "md";
    const rdDef = getComponentDefaultSize(brands, newBrand, "radio") || "md";
    const chDef = getComponentDefaultSize(brands, newBrand, "chip") || "md";
    const caDef = getComponentDefaultSize(brands, newBrand, "card") || "md";
    const ldDef = getComponentDefaultSize(brands, newBrand, "loader") || "md";
    const piDef = getComponentDefaultSize(brands, newBrand, "pill") || "md";
    const baDef = getComponentDefaultSize(brands, newBrand, "badge") || "md";
    const moDef = getComponentDefaultSize(brands, newBrand, "modal") || "md";
    const anDef = getComponentDefaultSize(brands, newBrand, "anchor") || "md";
    setActiveSize(btnDef);
    setActiveActionIconSize(aiDef);
    setActiveActionIconRadius(aiDef);
    setActiveTabsRadius(tbDef);
    setActiveSwitchSize(swDef);
    setActiveSliderSize(slDef);
    setActiveSliderRadius(slDef);
    setActiveRangeSliderSize(rslDef);
    setActiveRangeSliderRadius(rslDef);
    setActiveCheckboxSize(cbDef);
    setActiveCheckboxRadius(cbDef);
    setActiveRadioSize(rdDef);
    setActiveChipSize(chDef);
    setActiveChipRadius(chDef);
    const tiDef = getComponentDefaultSize(brands, newBrand, "textinput") || "sm";
    const seDef = getComponentDefaultSize(brands, newBrand, "select") || "sm";
    setActiveTextInputSize(tiDef);
    setActiveTextInputRadius(tiDef);
    setActiveSelectSize(seDef);
    setActiveSelectRadius(seDef);
    setActiveCardSize(caDef);
    setActiveCardRadius(caDef);
    setActiveLoaderSize(ldDef);
    setActivePillSize(piDef);
    setActiveBadgeSize(baDef);
    setActiveBadgeRadius(baDef);
    setActiveModalSize(moDef);
    setActiveModalRadius(moDef);
    setActiveAnchorSize(anDef);
    const nextBrandColors = Object.keys(brands[newBrand]?.primitives || {});
    const nextDefaultColor = nextBrandColors.includes("blue") ? "blue" : (nextBrandColors[0] || "blue");
    setActiveNotificationColor(nextDefaultColor);
    setActiveAlertColor(nextDefaultColor);
  }, [brands]);

  // Sync active size when component changes
  const handleComponentChange = useCallback((newComp) => {
    setActiveComponent(newComp);
    setActiveColorToken(null);
    setActiveDimensionToken(null);
    if (newComp === "button") {
      setActiveSize(buttonDefault);
      setActiveVariant("filled");
      setActiveButtonState("default");
      setActiveButtonLeftIcon(false);
      setActiveButtonRightIcon(false);
    } else if (newComp === "actionicon") {
      setActiveActionIconSize(actionIconDefault);
      setActiveActionIconRadius(actionIconDefault);
      setActiveVariant("default");
      setActiveActionIconState("default");
    } else if (newComp === "tabs") {
      setActiveTabsRadius(tabsDefault);
      setActiveTabsOrientation("horizontal");
      setActiveTabsShowPanel(false);
      setActiveTabsShowLeftIcon(false);
      setActiveTabsShowRightIcon(false);
      setActiveTabsState("default");
      setActiveVariant("default");
    } else if (newComp === "switch") {
      setActiveSwitchSize(switchDefault);
      setActiveSwitchChecked(false);
      setActiveSwitchState("default");
    } else if (newComp === "slider") {
      setActiveSliderSize(sliderDefault);
      setActiveSliderRadius(sliderDefault);
      setActiveSliderState("default");
      setActiveSliderMarks(true);
      setActiveSliderValue(40);
      setActiveSliderLabelMode("hover");
    } else if (newComp === "rangeslider") {
      setActiveRangeSliderSize(rangeSliderDefault);
      setActiveRangeSliderRadius(rangeSliderDefault);
      setActiveRangeSliderState("default");
      setActiveRangeSliderMarks(true);
      setActiveRangeSliderValue([20, 60]);
      setActiveRangeSliderLabelMode("hover");
    } else if (newComp === "title") {
      setActiveTitleOrder("1");
      setActiveTitleSize("auto");
      setActiveTitleTextWrap("wrap");
      setActiveTitleLineClamp(0);
      setActiveTitleText(DEFAULT_TITLE_TEXT);
    } else if (newComp === "text") {
      setActiveTextSizeToken("md");
      setActiveTextWeightMode("regular");
      setActiveTextStyleMode("normal");
      setActiveTextDecoration("none");
      setActiveTextAlign("left");
      setActiveTextTransform("none");
      setActiveTextColorMode("default");
      setActiveTextLineClamp(0);
      setActiveTextTruncate("off");
      setActiveTextText(DEFAULT_TITLE_TEXT);
    } else if (newComp === "anchor") {
      setActiveAnchorSize(anchorDefault);
      setActiveAnchorUnderline("always");
      setActiveAnchorWeightMode("regular");
      setActiveAnchorState("default");
      setActiveAnchorText("View documentation");
    } else if (newComp === "modal") {
      setActiveModalSize(modalDefault);
      setActiveModalRadius(modalDefault);
      setActiveModalLayout("basic");
      setActiveModalWithOverlay(true);
      setActiveModalWithCloseButton(true);
      setActiveModalCentered(true);
      setActiveModalTitle("Modal title");
      setActiveModalBody("This action cannot be undone. Please confirm you want to proceed.");
    } else if (newComp === "checkbox") {
      setActiveCheckboxSize(checkboxDefault);
      setActiveCheckboxRadius(checkboxDefault);
      setActiveCheckboxSelection("unchecked");
      setActiveCheckboxState("default");
      setActiveVariant("filled");
    } else if (newComp === "radio") {
      setActiveRadioSize(radioDefault);
      setActiveRadioChecked(false);
      setActiveRadioState("default");
      setActiveRadioShowLabel(true);
      setActiveVariant("filled");
    } else if (newComp === "chip") {
      setActiveChipSize(chipDefault);
      setActiveChipRadius(chipDefault);
      setActiveChipChecked(false);
      setActiveChipState("default");
      setActiveVariant("filled");
    } else if (newComp === "notification") {
      setActiveNotificationRadius("md");
      setActiveNotificationColor(defaultBrandColor);
      setActiveNotificationWithBorder(false);
      setActiveNotificationWithCloseButton(false);
      setActiveNotificationWithIcon(false);
      setActiveNotificationLoading(false);
      setActiveNotificationTitle("We notify you that");
      setActiveNotificationDescription("You are now obligated to give a star to Mantine project on GitHub");
    } else if (newComp === "alert") {
      setActiveAlertRadius("md");
      setActiveAlertColor(defaultBrandColor);
      setActiveAlertWithCloseButton(false);
      setActiveAlertWithIcon(true);
      setActiveAlertTitle("Alert title");
      setActiveAlertMessage("Lorem ipsum dolor sit, amet consectetur adipisicing elit. At officiis, quae tempore necessitatibus placeat saepe.");
      setActiveVariant("light");
    } else if (newComp === "textinput") {
      setActiveTextInputSize(textInputDefault);
      setActiveTextInputRadius(textInputDefault);
      setActiveTextInputState("default");
      setActiveTextInputShowLabel(true);
      setActiveTextInputLabelText("Label");
      setActiveTextInputWithAsterisk(false);
      setActiveTextInputShowError(false);
      setActiveTextInputErrorText("Error message");
      setActiveVariant("default");
    } else if (newComp === "select") {
      setActiveSelectSize(selectDefault);
      setActiveSelectRadius(selectDefault);
      setActiveSelectState("default");
      setActiveSelectShowLabel(true);
      setActiveSelectLabelText("Label");
      setActiveSelectWithAsterisk(false);
      setActiveSelectShowError(false);
      setActiveSelectErrorText("Error message");
      setActiveSelectSearchable(false);
      setActiveSelectClearable(false);
      setActiveVariant("default");
    } else if (newComp === "card") {
      setActiveCardSize(cardDefault);
      setActiveCardRadius(cardDefault);
      setActiveCardWithBorder(true);
      setActiveCardWithShadow(false);
      setActiveCardShowSection(true);
      setActiveCardShowBadge(true);
      setActiveCardTitle("PlanetScope vessel");
      setActiveCardDescription("Detected vessel metadata and imagery details from latest satellite capture.");
    } else if (newComp === "loader") {
      setActiveLoaderSize(loaderDefault);
      setActiveLoaderType("oval");
    } else if (newComp === "pill") {
      setActivePillSize(pillDefault);
      setActivePillWithRemoveButton(false);
      setActivePillText("React");
    } else if (newComp === "badge") {
      setActiveBadgeSize(badgeDefault);
      setActiveBadgeRadius(badgeDefault);
      setActiveBadgeCircle(false);
      setActiveBadgeFullWidth(false);
      setActiveBadgeText("Badge");
      setActiveVariant("filled");
    } else if (newComp === "tooltip") {
      setActiveTooltipPosition("top");
      setActiveTooltipWithArrow(true);
    }
  }, [actionIconDefault, buttonDefault, tabsDefault, switchDefault, sliderDefault, rangeSliderDefault, checkboxDefault, radioDefault, chipDefault, textInputDefault, selectDefault, cardDefault, loaderDefault, pillDefault, badgeDefault, modalDefault, anchorDefault, defaultBrandColor]);

  useEffect(() => {
    const allowedVariants = VARIANTS_BY_COMPONENT[activeComponent];
    if (!allowedVariants) return;
    if (!allowedVariants.includes(activeVariant)) {
      setActiveVariant(allowedVariants[0]);
    }
  }, [activeComponent, activeVariant]);

  const updatePrimitive = useCallback(
    (colorName, index, value) => {
      setBrands((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        next[activeBrand].primitives[colorName][index] = value;
        return next;
      });
    },
    [activeBrand]
  );

  const addPrimitive = useCallback(
    (colorName, scale) => {
      setBrands((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        next[activeBrand].primitives[colorName] = scale;
        return next;
      });
    },
    [activeBrand]
  );

  const updateComponentOverride = useCallback(
    (componentToken, mapping) => {
      setBrands((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        const brand = next[activeBrand];
        if (previewTheme === "dark") {
          if (!brand.componentOverridesDark) brand.componentOverridesDark = {};
          brand.componentOverridesDark[componentToken] = mapping;
          return next;
        }

        if (!brand.componentOverrides) brand.componentOverrides = {};
        brand.componentOverrides[componentToken] = mapping;
        return next;
      });
    },
    [activeBrand, previewTheme]
  );

  const updateDimensionOverride = useCallback(
    (tokenName, size, value) => {
      setBrands((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        if (!next[activeBrand].dimensionOverrides) {
          next[activeBrand].dimensionOverrides = {};
        }
        if (!next[activeBrand].dimensionOverrides[tokenName]) {
          next[activeBrand].dimensionOverrides[tokenName] = {};
        }
        next[activeBrand].dimensionOverrides[tokenName][size] = value;
        return next;
      });
    },
    [activeBrand]
  );

  const addBrand = useCallback(
    (name) => {
      const id = name.toLowerCase().replace(/\s+/g, "-");
      if (brands[id]) return;
      setBrands((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        next[id] = JSON.parse(JSON.stringify(prev[activeBrand]));
        next[id].name = name;
        return next;
      });
      setActiveBrand(id);
    },
    [activeBrand, brands]
  );

  const brandNames = Object.keys(brands);
  const colorTokens = getColorTokens(activeComponent);
  const dimensionTokens = getDimensionTokens(activeComponent);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        APP_STORAGE_KEY,
        JSON.stringify({
          brands,
          activeBrand,
          previewTheme,
        })
      );
    } catch (_err) {
      // Ignore storage write errors (quota/private mode).
    }
  }, [brands, activeBrand, previewTheme]);

  useEffect(() => {
    if (brands[activeBrand]) return;
    const firstBrandId = Object.keys(brands)[0];
    if (firstBrandId) {
      setActiveBrand(firstBrandId);
    }
  }, [brands, activeBrand]);

  // Parse forced state/checked/variant from the active token card
  const INTERACTIVE_STATES = ["active", "hover", "focus", "pressed", "disabled", "error", "visited"];
  let forcedState = null;
  let forcedChecked = null;
  let forcedIndeterminate = false;
  let forcedVariant = null;

  if (activeColorToken) {
    const parts = activeColorToken.split("-");
    const last = parts[parts.length - 1];

    if (INTERACTIVE_STATES.includes(last)) {
      forcedState = last;
    }

    if (parts.includes("checked")) {
      forcedChecked = true;
    }
    if (parts.includes("indeterminate")) {
      forcedIndeterminate = true;
    }

    if (["button", "actionicon", "tabs", "checkbox", "chip", "badge", "alert", "radio", "textinput", "select"].includes(activeComponent)) {
      const variantSegment = parts[1];
      const knownVariants = {
        button: ["filled", "outlined", "ghost"],
        actionicon: ["default", "filled", "light", "outlined", "transparent"],
        tabs: ["default", "outlined", "pills"],
        checkbox: ["filled", "outlined"],
        chip: ["filled", "light", "outline"],
        badge: ["filled", "light", "outline", "dot"],
        alert: ["default", "filled", "light", "outline", "transparent", "white"],
        radio: ["filled", "outline"],
        textinput: ["default", "filled"],
        select: ["default", "filled"],
      };
      if (knownVariants[activeComponent]?.includes(variantSegment)) {
        forcedVariant = variantSegment;
      }
    }
  }

  const effectiveComponentState =
    activeComponent === "button"
      ? forcedState || activeButtonState
      : activeComponent === "actionicon"
        ? forcedState || activeActionIconState
        : activeComponent === "tabs"
          ? forcedState || activeTabsState
        : activeComponent === "switch"
          ? forcedState || activeSwitchState
          : activeComponent === "slider"
            ? forcedState || activeSliderState
            : activeComponent === "rangeslider"
              ? forcedState || activeRangeSliderState
          : activeComponent === "checkbox"
            ? forcedState || activeCheckboxState
          : activeComponent === "radio"
            ? forcedState || activeRadioState
          : activeComponent === "chip"
            ? forcedState || activeChipState
          : activeComponent === "textinput"
            ? forcedState || activeTextInputState
          : activeComponent === "select"
            ? forcedState || activeSelectState
          : forcedState;

  const visibleColorTokenEntries = Object.entries(colorTokens).filter(([token]) => {
    const parts = token.split("-");
    const variantSegment = parts[1];

    if (activeComponent === "switch") {
      if (token === "switch-focus-ring") return true;

      const tokenState = INTERACTIVE_STATES.includes(parts[parts.length - 1])
        ? parts[parts.length - 1]
        : "default";
      const targetState = effectiveComponentState || "default";
      if (tokenState !== targetState) return false;

      const targetChecked = forcedChecked != null ? forcedChecked : activeSwitchChecked;
      const isTrackBackgroundToken = parts[1] === "track" && parts[2] === "background";
      const isCheckedToken = parts.includes("checked");

      if (isTrackBackgroundToken) {
        return isCheckedToken === Boolean(targetChecked);
      }
      return !isCheckedToken || Boolean(targetChecked);
    }

    if (activeComponent === "slider") {
      if (token === "slider-focus-ring") return true;
      const tokenState = INTERACTIVE_STATES.includes(parts[parts.length - 1])
        ? parts[parts.length - 1]
        : "default";
      const targetState = effectiveComponentState || "default";
      if (tokenState === targetState) return true;
      return tokenState === "default" && targetState !== "default" && !Boolean(colorTokens[`${token}-${targetState}`]);
    }

    if (activeComponent === "rangeslider") {
      if (token === "rangeslider-focus-ring") return true;
      const tokenState = INTERACTIVE_STATES.includes(parts[parts.length - 1])
        ? parts[parts.length - 1]
        : "default";
      const targetState = effectiveComponentState || "default";
      if (tokenState === targetState) return true;
      return tokenState === "default" && targetState !== "default" && !Boolean(colorTokens[`${token}-${targetState}`]);
    }

    if (activeComponent === "radio") {
      if (token === "radio-focus-ring") return true;

      const targetState = effectiveComponentState || "default";
      const tokenState = INTERACTIVE_STATES.includes(parts[parts.length - 1])
        ? parts[parts.length - 1]
        : "default";
      if (tokenState !== targetState) return false;

      const targetChecked = forcedChecked != null ? forcedChecked : activeRadioChecked;
      const isCheckedToken = parts.includes("checked");
      const isVariantToken = ["filled", "outline"].includes(variantSegment);

      if (isVariantToken) {
        if (variantSegment !== activeVariant) return false;
        return isCheckedToken === Boolean(targetChecked);
      }

      if (variantSegment === "background") {
        return isCheckedToken === Boolean(targetChecked);
      }

      if (variantSegment === "icon") {
        return Boolean(targetChecked);
      }

      return true;
    }

    if (activeComponent === "chip") {
      if (token === "chip-focus-ring") return true;

      const targetState = effectiveComponentState || "default";
      const tokenState = INTERACTIVE_STATES.includes(parts[parts.length - 1])
        ? parts[parts.length - 1]
        : "default";
      if (tokenState !== targetState) {
        const canUseDefaultFallback =
          tokenState === "default" &&
          targetState !== "default" &&
          !Boolean(colorTokens[`${token}-${targetState}`]);
        if (!canUseDefaultFallback) return false;
      }

      const targetChecked = forcedChecked != null ? forcedChecked : activeChipChecked;
      const isCheckedToken = parts.includes("checked");
      const isVariantToken = ["filled", "outline", "light"].includes(variantSegment);

      if (isVariantToken && variantSegment !== activeVariant) return false;
      // Keep active variant tokens visible even when unchecked so each variant
      // remains editable from the token list.
      if (!isVariantToken && !targetChecked && isCheckedToken) return false;
      return true;
    }

    const variantsByComponent = {
      button: ["filled", "outlined", "ghost"],
      actionicon: ["default", "filled", "light", "outlined", "transparent"],
      tabs: ["default", "outlined", "pills"],
      checkbox: ["filled", "outlined"],
      radio: ["filled", "outline"],
      chip: ["filled", "light", "outline"],
      badge: ["filled", "light", "outline", "dot"],
      alert: ["default", "filled", "light", "outline", "transparent", "white"],
      textinput: ["default", "filled"],
      select: ["default", "filled"],
    };
    const variants = variantsByComponent[activeComponent];
    if (!variants) return true;
    if (activeComponent === "checkbox") {
      const checkboxSharedSegments = ["background", "border", "icon", "label", "focus"];
      const targetState = effectiveComponentState || "default";
      const tokenState = INTERACTIVE_STATES.includes(parts[parts.length - 1])
        ? parts[parts.length - 1]
        : "default";
      const forcedSelection = forcedIndeterminate
        ? "indeterminate"
        : forcedChecked
          ? "checked"
          : null;
      const targetSelection = forcedSelection || activeCheckboxSelection;
      const isCheckedLike = targetSelection !== "unchecked";
      const isCheckedToken = parts.includes("checked");

      if (variants.includes(variantSegment)) {
        if (variantSegment !== activeVariant) return false;
        if (tokenState !== targetState) {
          if (!(targetState === "default" && tokenState === "default")) return false;
        }
        if (parts.includes("disabled")) return targetState === "disabled";
        if (isCheckedToken) return isCheckedLike;
        if (parts[2] === "background" || parts[2] === "border") return !isCheckedLike;
        return true;
      }

      if (!checkboxSharedSegments.includes(variantSegment)) return false;
      if (tokenState !== targetState) return false;
      if (variantSegment === "background") {
        return isCheckedToken === isCheckedLike;
      }
      return true;
    }
    if (
      activeComponent === "button" ||
      activeComponent === "actionicon" ||
      activeComponent === "tabs" ||
      activeComponent === "textinput"
      || activeComponent === "select"
      || activeComponent === "badge"
      || activeComponent === "alert"
    ) {
      if (!variants.includes(variantSegment)) return true;
      if (variantSegment !== activeVariant) return false;
      const tokenState = INTERACTIVE_STATES.includes(parts[parts.length - 1])
        ? parts[parts.length - 1]
        : "default";
      return tokenState === (effectiveComponentState || "default");
    }

    // Keep shared component tokens and only active variant tokens.
    if (!variants.includes(variantSegment)) return true;
    return variantSegment === activeVariant;
  });

  useEffect(() => {
    if (!activeColorToken) return;
    const parts = activeColorToken.split("-");
    const variantSegment = parts[1];
    const variantsByComponent = {
      button: ["filled", "outlined", "ghost"],
      actionicon: ["default", "filled", "light", "outlined", "transparent"],
      tabs: ["default", "outlined", "pills"],
      checkbox: ["filled", "outlined"],
      radio: ["filled", "outline"],
      badge: ["filled", "light", "outline", "dot"],
      alert: ["default", "filled", "light", "outline", "transparent", "white"],
      textinput: ["default", "filled"],
      select: ["default", "filled"],
    };
    const variants = variantsByComponent[activeComponent];
    if (!variants) return;
    if (variants.includes(variantSegment) && variantSegment !== activeVariant) {
      setActiveColorToken(null);
    }
  }, [activeComponent, activeColorToken, activeVariant]);

  const tabStyle = (t) => ({
    background: activeTab === t ? "#25262B" : "transparent",
    color: activeTab === t ? "#C1C2C5" : "#5C5F66",
    border: "none",
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    borderRadius: 6,
  });

  const activeSizeByComponent = {
    button: activeSize,
    actionicon: activeActionIconSize,
    switch: activeSwitchSize,
    slider: activeSliderSize,
    rangeslider: activeRangeSliderSize,
    title: activeTitleSize === "auto" ? `h${activeTitleOrder}` : activeTitleSize,
    text: activeTextSizeToken,
    anchor: activeAnchorSize,
    checkbox: activeCheckboxSize,
    radio: activeRadioSize,
    chip: activeChipSize,
    textinput: activeTextInputSize,
    select: activeSelectSize,
    card: activeCardSize,
    loader: activeLoaderSize,
    pill: activePillSize,
    badge: activeBadgeSize,
    modal: activeModalSize,
    alert: activeAlertRadius,
  };
  const activeDimensionSize = activeSizeByComponent[activeComponent] || sizeKeys[0];
  const getSelectedDimensionSize = (tokenName) => {
    if (activeComponent === "actionicon" && tokenName === "actionicon-radius") {
      return activeActionIconRadius;
    }
    if (activeComponent === "checkbox" && tokenName === "checkbox-radius") {
      return activeCheckboxRadius;
    }
    if (activeComponent === "textinput" && tokenName === "textinput-radius") {
      return activeTextInputRadius;
    }
    if (activeComponent === "badge" && tokenName === "badge-radius") {
      return activeBadgeRadius;
    }
    if (activeComponent === "select" && tokenName === "select-radius") {
      return activeSelectRadius;
    }
    if (activeComponent === "card" && tokenName === "card-radius") {
      return activeCardRadius;
    }
    if (activeComponent === "tabs" && tokenName === "tabs-radius") {
      return activeTabsRadius;
    }
    if (activeComponent === "chip" && tokenName === "chip-radius") {
      return activeChipRadius;
    }
    if (activeComponent === "notification" && tokenName === "notification-radius") {
      return activeNotificationRadius;
    }
    if (activeComponent === "alert" && tokenName === "alert-radius") {
      return activeAlertRadius;
    }
    if (activeComponent === "modal" && tokenName === "modal-radius") {
      return activeModalRadius;
    }
    if (activeComponent === "slider" && tokenName === "slider-radius") {
      return activeSliderRadius;
    }
    if (activeComponent === "rangeslider" && tokenName === "rangeslider-radius") {
      return activeRangeSliderRadius;
    }
    if (
      activeComponent === "title" &&
      (tokenName === "title-font-size" || tokenName === "title-line-height")
    ) {
      return activeTitleSize === "auto" ? `h${activeTitleOrder}` : activeTitleSize;
    }
    return activeDimensionSize;
  };

  const handleMarkdownExport = () => {
    const md = buildMarkdownExport(brands, GLOBAL_PRIMITIVES);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "design-system-tokens.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleComponentDocsExport = () => {
    const md = buildComponentDocsExport(brands);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "component-export-docs.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetLocalData = () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(APP_STORAGE_KEY);
      } catch (_err) {
        // Ignore storage errors and still reset in-memory state.
      }
    }
    setBrands(INITIAL_BRANDS);
    setActiveBrand("theia");
    setActiveComponent("button");
    setActiveVariant("filled");
    setPreviewTheme("dark");
    setActiveColorToken(null);
    setActiveDimensionToken(null);
  };

  const handleStorybookExport = async () => {
    setStorybookLoading(true);
    setStorybookError(null);
    try {
      const response = await fetch("http://localhost:9001/api/launch-storybook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brands, globalPrimitives: GLOBAL_PRIMITIVES }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Server error");
      }
      const data = await response.json();
      window.open(data.url, "_blank");
    } catch (err) {
      setStorybookError(
        err.message === "Failed to fetch"
          ? "Server not running. Start it with: npm run relay"
          : err.message
      );
    } finally {
      setStorybookLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "#1A1B1E",
        color: "#C1C2C5",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid #2C2E33",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 700, color: "#E9ECEF" }}>
          Design System Generator
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {activeTab === "preview" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px" }}>
              <span style={{ fontSize: 12, color: "#5C5F66", fontWeight: 500 }}>Light</span>
              <MantineSwitch
                size="md"
                color="dark"
                checked={previewTheme === "dark"}
                onChange={(event) => setPreviewTheme(event.currentTarget.checked ? "dark" : "light")}
                aria-label="Toggle preview theme"
              />
              <span style={{ fontSize: 12, color: "#C1C2C5", fontWeight: 500 }}>Dark</span>
            </div>
          )}
          <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setActiveTab("preview")} style={tabStyle("preview")}>
            Preview
          </button>
          <button onClick={() => setActiveTab("export")} style={tabStyle("export")}>
            Export
          </button>
          </div>
        </div>
      </div>

      {activeTab === "preview" ? (
        <div style={{ display: "flex", flex: 1, minHeight: 0, overflowX: "hidden" }}>
          <div
            style={{
              width: leftPanelWidth,
              borderRight: "1px solid #2C2E33",
              overflowY: "auto",
              overflowX: "hidden",
              scrollbarGutter: "stable",
              padding: "16px 20px",
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: 11, color: "#5C5F66", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 8 }}>
              Brand
            </div>
            <ComponentSelect
              options={brandNames}
              value={activeBrand}
              displayValue={brand.name}
              onChange={handleBrandChange}
              placeholder="Search brands..."
              onAdd={addBrand}
              addLabel="+ New brand"
            />
            <div style={{ marginTop: 20 }} />
            <Section title={`Primitives — ${brand.name}`}>
              {colorNames.map((c) => (
                <PrimitiveScale
                  key={c}
                  name={c}
                  scale={brand.primitives[c]}
                  onUpdate={updatePrimitive}
                />
              ))}
              <AddPrimitiveForm existingNames={colorNames} onAdd={addPrimitive} />
            </Section>
            <Section title="Primitives — Global" defaultOpen={false}>
              {globalColorNames.map((c) => (
                <PrimitiveScale key={c} name={c} scale={GLOBAL_PRIMITIVES[c]} readOnly />
              ))}
            </Section>
            <Section title={`Color Tokens — ${getComponentLabel(activeComponent)}`}>
              {visibleColorTokenEntries.map(([token, def]) => {
                const semantic = def.semantic;
                const lightMapping = brand.semanticMap[semantic];
                const darkMapping =
                  (brand.darkSemanticOverrides && brand.darkSemanticOverrides[semantic]) || lightMapping;
                const semanticMapping = previewTheme === "dark" ? darkMapping : lightMapping;
                if (!semanticMapping) return null;
                const componentOverride =
                  previewTheme === "dark"
                    ? (brand.componentOverridesDark && brand.componentOverridesDark[token]) || null
                    : (brand.componentOverrides && brand.componentOverrides[token]) || null;
                const isActive = activeColorToken === token;
                return (
                  <TokenChainCard
                    key={token}
                    componentToken={token}
                    semanticToken={semantic}
                    mapping={componentOverride || semanticMapping}
                    resolvedColor={resolveColor(brands, activeBrand, semantic, previewTheme, token)}
                    isActive={isActive}
                    onClick={() => setActiveColorToken(isActive ? null : token)}
                    onUpdate={updateComponentOverride}
                    brandColors={colorNames}
                    globalColors={globalColorNames}
                  />
                );
              })}
            </Section>
            <Section title={`Dimension Tokens — ${getComponentLabel(activeComponent)}`}>
              {Object.entries(dimensionTokens).map(([token, def]) => {
                const isActive = activeDimensionToken === token;
                return (
                  <DimensionTokenRow
                    key={token}
                    tokenName={token}
                    tokenDef={def}
                    brands={brands}
                    brandId={activeBrand}
                    sizeKeys={sizeKeys}
                    selectedSize={getSelectedDimensionSize(token)}
                    onUpdateDimension={updateDimensionOverride}
                    isActive={isActive}
                    onClick={() => setActiveDimensionToken(isActive ? null : token)}
                  />
                );
              })}
            </Section>
          </div>

          <div
            onMouseDown={handleLeftPanelDrag}
            style={{ width: 4, cursor: "col-resize", flexShrink: 0, background: "transparent", transition: "background 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#373A40")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          />

          <div
            style={{
              flexBasis: previewPanelWidth,
              flexGrow: 1,
              minWidth: 420,
              overflowY: "auto",
              scrollbarGutter: "stable",
              padding: "24px 32px",
            }}
          >
            <div style={{ background: "#25262B", borderRadius: 8, padding: 24 }}>
              {activeComponent === "button" && (
                <ButtonPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeVariant={forcedVariant || activeVariant}
                  activeSize={activeSize}
                  previewTheme={previewTheme}
                  selectedState={forcedState || activeButtonState}
                  activeColorToken={activeColorToken}
                  sizeKeys={sizeKeys}
                  focusRingStyle={activeButtonFocusRingStyle}
                  showLeftIcon={activeButtonLeftIcon}
                  showRightIcon={activeButtonRightIcon}
                />
              )}

              {activeComponent === "actionicon" && (
                <ActionIconPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeVariant={forcedVariant || activeVariant}
                  activeActionIconSize={activeActionIconSize}
                  activeActionIconRadius={activeActionIconRadius}
                  activeActionIconIcon={activeActionIconIcon}
                  focusRingStyle={activeActionIconFocusRingStyle}
                  selectedState={forcedState || activeActionIconState}
                  activeColorToken={activeColorToken}
                  sizeKeys={sizeKeys}
                />
              )}

              {activeComponent === "tabs" && (
                <TabsPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeVariant={forcedVariant || activeVariant}
                  activeTabsRadius={activeTabsRadius}
                  activeTabsOrientation={activeTabsOrientation}
                  selectedState={forcedState || activeTabsState}
                  activeColorToken={activeColorToken}
                  showPanel={activeTabsShowPanel}
                  showLeftIcon={activeTabsShowLeftIcon}
                  showRightIcon={activeTabsShowRightIcon}
                />
              )}

              {activeComponent === "switch" && (
                <SwitchPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeSwitchSize={activeSwitchSize}
                  sizeKeys={sizeKeys}
                  activeColorToken={activeColorToken}
                  selectedChecked={forcedChecked != null ? forcedChecked : activeSwitchChecked}
                  selectedState={forcedState || activeSwitchState}
                />
              )}

              {activeComponent === "slider" && (
                <SliderPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeSliderSize={activeSliderSize}
                  activeSliderRadius={activeSliderRadius}
                  sizeKeys={sizeKeys}
                  activeColorToken={activeColorToken}
                  selectedState={forcedState || activeSliderState}
                  showMarks={activeSliderMarks}
                  value={activeSliderValue}
                  labelMode={activeSliderLabelMode}
                />
              )}

              {activeComponent === "rangeslider" && (
                <RangeSliderPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeRangeSliderSize={activeRangeSliderSize}
                  activeRangeSliderRadius={activeRangeSliderRadius}
                  sizeKeys={sizeKeys}
                  activeColorToken={activeColorToken}
                  selectedState={forcedState || activeRangeSliderState}
                  showMarks={activeRangeSliderMarks}
                  value={activeRangeSliderValue}
                  labelMode={activeRangeSliderLabelMode}
                />
              )}

              {activeComponent === "title" && (
                <TitlePreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  order={activeTitleOrder}
                  sizeKey={activeTitleSize}
                  textWrap={activeTitleTextWrap}
                  lineClamp={activeTitleLineClamp}
                  text={activeTitleText}
                />
              )}

              {activeComponent === "text" && (
                <TextPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  size={activeTextSizeToken}
                  weightMode={activeTextWeightMode}
                  styleMode={activeTextStyleMode}
                  decoration={activeTextDecoration}
                  align={activeTextAlign}
                  transform={activeTextTransform}
                  colorMode={activeTextColorMode}
                  lineClamp={activeTextLineClamp}
                  truncate={activeTextTruncate}
                  text={activeTextText}
                />
              )}
              {activeComponent === "anchor" && (
                <AnchorPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  size={activeAnchorSize}
                  underline={activeAnchorUnderline}
                  weightMode={activeAnchorWeightMode}
                  state={forcedState || activeAnchorState}
                  text={activeAnchorText}
                />
              )}
              {activeComponent === "modal" && (
                <ModalPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  size={activeModalSize}
                  radius={activeModalRadius}
                  layout={activeModalLayout}
                  withOverlay={activeModalWithOverlay}
                  withCloseButton={activeModalWithCloseButton}
                  centered={activeModalCentered}
                  title={activeModalTitle}
                  body={activeModalBody}
                />
              )}

              {activeComponent === "checkbox" && (
                <CheckboxPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeVariant={forcedVariant || activeVariant}
                  activeCheckboxSize={activeCheckboxSize}
                  activeCheckboxRadius={activeCheckboxRadius}
                  sizeKeys={sizeKeys}
                  activeColorToken={activeColorToken}
                  selectedSelection={
                    forcedIndeterminate
                      ? "indeterminate"
                      : forcedChecked
                        ? "checked"
                        : activeCheckboxSelection
                  }
                  selectedState={forcedState || activeCheckboxState}
                />
              )}

              {activeComponent === "radio" && (
                <RadioPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeVariant={forcedVariant || activeVariant}
                  activeRadioSize={activeRadioSize}
                  sizeKeys={sizeKeys}
                  activeColorToken={activeColorToken}
                  selectedChecked={forcedChecked != null ? forcedChecked : activeRadioChecked}
                  selectedState={forcedState || activeRadioState}
                  showLabel={activeRadioShowLabel}
                />
              )}

              {activeComponent === "chip" && (
                <ChipPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeVariant={forcedVariant || activeVariant}
                  activeChipSize={activeChipSize}
                  activeChipRadius={activeChipRadius}
                  sizeKeys={sizeKeys}
                  activeColorToken={activeColorToken}
                  selectedChecked={forcedChecked != null ? forcedChecked : activeChipChecked}
                  selectedState={forcedState || activeChipState}
                />
              )}

              {activeComponent === "tooltip" && (
                <TooltipPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activePosition={activeTooltipPosition}
                  withArrow={activeTooltipWithArrow}
                />
              )}

              {activeComponent === "notification" && (
                <NotificationPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  radius={activeNotificationRadius}
                  color={activeNotificationColor}
                  title={activeNotificationTitle}
                  description={activeNotificationDescription}
                  withBorder={activeNotificationWithBorder}
                  withCloseButton={activeNotificationWithCloseButton}
                  withIcon={activeNotificationWithIcon}
                  loading={activeNotificationLoading}
                />
              )}
              {activeComponent === "alert" && (
                <AlertPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  variant={forcedVariant || activeVariant}
                  color={activeAlertColor}
                  radius={activeAlertRadius}
                  withCloseButton={activeAlertWithCloseButton}
                  withIcon={activeAlertWithIcon}
                  title={activeAlertTitle}
                  message={activeAlertMessage}
                />
              )}

              {activeComponent === "textinput" && (
                <TextInputPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeVariant={forcedVariant || activeVariant}
                  activeTextInputSize={activeTextInputSize}
                  activeTextInputRadius={activeTextInputRadius}
                  sizeKeys={sizeKeys}
                  activeColorToken={activeColorToken}
                  selectedState={forcedState || activeTextInputState}
                  showLabel={activeTextInputShowLabel}
                  labelText={activeTextInputLabelText}
                  withAsterisk={activeTextInputWithAsterisk}
                  showError={activeTextInputShowError}
                  errorText={activeTextInputErrorText}
                />
              )}
              {activeComponent === "select" && (
                <SelectPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeVariant={forcedVariant || activeVariant}
                  activeSelectSize={activeSelectSize}
                  activeSelectRadius={activeSelectRadius}
                  sizeKeys={sizeKeys}
                  activeColorToken={activeColorToken}
                  selectedState={forcedState || activeSelectState}
                  showLabel={activeSelectShowLabel}
                  labelText={activeSelectLabelText}
                  withAsterisk={activeSelectWithAsterisk}
                  showError={activeSelectShowError}
                  errorText={activeSelectErrorText}
                  searchable={activeSelectSearchable}
                  clearable={activeSelectClearable}
                />
              )}
              {activeComponent === "card" && (
                <CardPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  size={activeCardSize}
                  radius={activeCardRadius}
                  withBorder={activeCardWithBorder}
                  withShadow={activeCardWithShadow}
                  showSection={activeCardShowSection}
                  showBadge={activeCardShowBadge}
                  title={activeCardTitle}
                  description={activeCardDescription}
                />
              )}
              {activeComponent === "loader" && (
                <LoaderPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  size={activeLoaderSize}
                  type={activeLoaderType}
                />
              )}
              {activeComponent === "pill" && (
                <PillPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  size={activePillSize}
                  withRemoveButton={activePillWithRemoveButton}
                  text={activePillText}
                />
              )}
              {activeComponent === "badge" && (
                <BadgePreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  activeVariant={forcedVariant || activeVariant}
                  size={activeBadgeSize}
                  radius={activeBadgeRadius}
                  circle={activeBadgeCircle}
                  fullWidth={activeBadgeFullWidth}
                  text={activeBadgeText}
                />
              )}
            </div>
          </div>

          <div
            style={{
              width: propertiesPanelWidth,
              borderLeft: "1px solid #2C2E33",
              borderRight: "1px solid #2C2E33",
              overflowY: "auto",
              scrollbarGutter: "stable",
              padding: "16px 12px",
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: 11, color: "#5C5F66", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 8 }}>
              Properties
            </div>
            <div>
              {activeComponent === "button" && (
                <ButtonPropertiesPanel
                  activeVariant={forcedVariant || activeVariant}
                  setActiveVariant={setActiveVariant}
                  activeSize={activeSize}
                  setActiveSize={setActiveSize}
                  sizeKeys={sizeKeys}
                  focusRingStyle={activeButtonFocusRingStyle}
                  setFocusRingStyle={setActiveButtonFocusRingStyle}
                  selectedState={forcedState || activeButtonState}
                  setSelectedState={setActiveButtonState}
                  forcedState={forcedState}
                  showLeftIcon={activeButtonLeftIcon}
                  setShowLeftIcon={setActiveButtonLeftIcon}
                  showRightIcon={activeButtonRightIcon}
                  setShowRightIcon={setActiveButtonRightIcon}
                  buildVariants={buildButtonVariants}
                  setBuildVariants={setBuildButtonVariants}
                />
              )}
              {activeComponent === "actionicon" && (
                <ActionIconPropertiesPanel
                  activeVariant={forcedVariant || activeVariant}
                  setActiveVariant={setActiveVariant}
                  activeActionIconSize={activeActionIconSize}
                  setActiveActionIconSize={setActiveActionIconSize}
                  activeActionIconRadius={activeActionIconRadius}
                  setActiveActionIconRadius={setActiveActionIconRadius}
                  activeActionIconIcon={activeActionIconIcon}
                  setActiveActionIconIcon={setActiveActionIconIcon}
                  focusRingStyle={activeActionIconFocusRingStyle}
                  setFocusRingStyle={setActiveActionIconFocusRingStyle}
                  sizeKeys={sizeKeys}
                  selectedState={forcedState || activeActionIconState}
                  setSelectedState={setActiveActionIconState}
                  forcedState={forcedState}
                  buildVariants={buildActionIconVariants}
                  setBuildVariants={setBuildActionIconVariants}
                />
              )}
              {activeComponent === "tabs" && (
                <TabsPropertiesPanel
                  activeVariant={forcedVariant || activeVariant}
                  setActiveVariant={setActiveVariant}
                  activeTabsRadius={activeTabsRadius}
                  setActiveTabsRadius={setActiveTabsRadius}
                  activeTabsOrientation={activeTabsOrientation}
                  setActiveTabsOrientation={setActiveTabsOrientation}
                  showPanel={activeTabsShowPanel}
                  setShowPanel={setActiveTabsShowPanel}
                  showLeftIcon={activeTabsShowLeftIcon}
                  setShowLeftIcon={setActiveTabsShowLeftIcon}
                  showRightIcon={activeTabsShowRightIcon}
                  setShowRightIcon={setActiveTabsShowRightIcon}
                  selectedState={forcedState || activeTabsState}
                  setSelectedState={setActiveTabsState}
                  forcedState={forcedState}
                  buildVariants={buildTabsVariants}
                  setBuildVariants={setBuildTabsVariants}
                />
              )}
              {activeComponent === "switch" && (
                <SwitchPropertiesPanel
                  activeSwitchSize={activeSwitchSize}
                  setActiveSwitchSize={setActiveSwitchSize}
                  sizeKeys={sizeKeys}
                  selectedChecked={forcedChecked != null ? forcedChecked : activeSwitchChecked}
                  setSelectedChecked={setActiveSwitchChecked}
                  selectedState={forcedState || activeSwitchState}
                  setSelectedState={setActiveSwitchState}
                  forcedChecked={forcedChecked}
                  forcedState={forcedState}
                />
              )}
              {activeComponent === "slider" && (
                <SliderPropertiesPanel
                  activeSliderSize={activeSliderSize}
                  setActiveSliderSize={setActiveSliderSize}
                  activeSliderRadius={activeSliderRadius}
                  setActiveSliderRadius={setActiveSliderRadius}
                  sizeKeys={sizeKeys}
                  selectedState={forcedState || activeSliderState}
                  setSelectedState={setActiveSliderState}
                  showMarks={activeSliderMarks}
                  setShowMarks={setActiveSliderMarks}
                  value={activeSliderValue}
                  setValue={setActiveSliderValue}
                  labelMode={activeSliderLabelMode}
                  setLabelMode={setActiveSliderLabelMode}
                  forcedState={forcedState}
                />
              )}
              {activeComponent === "rangeslider" && (
                <RangeSliderPropertiesPanel
                  activeRangeSliderSize={activeRangeSliderSize}
                  setActiveRangeSliderSize={setActiveRangeSliderSize}
                  activeRangeSliderRadius={activeRangeSliderRadius}
                  setActiveRangeSliderRadius={setActiveRangeSliderRadius}
                  sizeKeys={sizeKeys}
                  selectedState={forcedState || activeRangeSliderState}
                  setSelectedState={setActiveRangeSliderState}
                  showMarks={activeRangeSliderMarks}
                  setShowMarks={setActiveRangeSliderMarks}
                  value={activeRangeSliderValue}
                  setValue={setActiveRangeSliderValue}
                  labelMode={activeRangeSliderLabelMode}
                  setLabelMode={setActiveRangeSliderLabelMode}
                  forcedState={forcedState}
                />
              )}
              {activeComponent === "title" && (
                <TitlePropertiesPanel
                  order={activeTitleOrder}
                  setOrder={setActiveTitleOrder}
                  sizeKey={activeTitleSize}
                  setSizeKey={setActiveTitleSize}
                  textWrap={activeTitleTextWrap}
                  setTextWrap={setActiveTitleTextWrap}
                  lineClamp={activeTitleLineClamp}
                  setLineClamp={setActiveTitleLineClamp}
                  text={activeTitleText}
                  setText={setActiveTitleText}
                />
              )}
              {activeComponent === "text" && (
                <TextPropertiesPanel
                  size={activeTextSizeToken}
                  setSize={setActiveTextSizeToken}
                  weightMode={activeTextWeightMode}
                  setWeightMode={setActiveTextWeightMode}
                  styleMode={activeTextStyleMode}
                  setStyleMode={setActiveTextStyleMode}
                  decoration={activeTextDecoration}
                  setDecoration={setActiveTextDecoration}
                  align={activeTextAlign}
                  setAlign={setActiveTextAlign}
                  transform={activeTextTransform}
                  setTransform={setActiveTextTransform}
                  colorMode={activeTextColorMode}
                  setColorMode={setActiveTextColorMode}
                  lineClamp={activeTextLineClamp}
                  setLineClamp={setActiveTextLineClamp}
                  truncate={activeTextTruncate}
                  setTruncate={setActiveTextTruncate}
                  text={activeTextText}
                  setText={setActiveTextText}
                />
              )}
              {activeComponent === "anchor" && (
                <AnchorPropertiesPanel
                  size={activeAnchorSize}
                  setSize={setActiveAnchorSize}
                  underline={activeAnchorUnderline}
                  setUnderline={setActiveAnchorUnderline}
                  weightMode={activeAnchorWeightMode}
                  setWeightMode={setActiveAnchorWeightMode}
                  state={forcedState || activeAnchorState}
                  setState={setActiveAnchorState}
                  text={activeAnchorText}
                  setText={setActiveAnchorText}
                />
              )}
              {activeComponent === "modal" && (
                <ModalPropertiesPanel
                  size={activeModalSize}
                  setSize={setActiveModalSize}
                  radius={activeModalRadius}
                  setRadius={setActiveModalRadius}
                  layout={activeModalLayout}
                  setLayout={setActiveModalLayout}
                  withOverlay={activeModalWithOverlay}
                  setWithOverlay={setActiveModalWithOverlay}
                  withCloseButton={activeModalWithCloseButton}
                  setWithCloseButton={setActiveModalWithCloseButton}
                  centered={activeModalCentered}
                  setCentered={setActiveModalCentered}
                  title={activeModalTitle}
                  setTitle={setActiveModalTitle}
                  body={activeModalBody}
                  setBody={setActiveModalBody}
                />
              )}
              {activeComponent === "checkbox" && (
                <CheckboxPropertiesPanel
                  activeVariant={forcedVariant || activeVariant}
                  setActiveVariant={setActiveVariant}
                  activeCheckboxSize={activeCheckboxSize}
                  setActiveCheckboxSize={setActiveCheckboxSize}
                  activeCheckboxRadius={activeCheckboxRadius}
                  setActiveCheckboxRadius={setActiveCheckboxRadius}
                  sizeKeys={sizeKeys}
                  selectedSelection={
                    forcedIndeterminate
                      ? "indeterminate"
                      : forcedChecked
                        ? "checked"
                        : activeCheckboxSelection
                  }
                  setSelectedSelection={setActiveCheckboxSelection}
                  selectedState={forcedState || activeCheckboxState}
                  setSelectedState={setActiveCheckboxState}
                  forcedChecked={forcedChecked}
                  forcedIndeterminate={forcedIndeterminate}
                  forcedState={forcedState}
                />
              )}
              {activeComponent === "radio" && (
                <RadioPropertiesPanel
                  activeVariant={forcedVariant || activeVariant}
                  setActiveVariant={setActiveVariant}
                  activeRadioSize={activeRadioSize}
                  setActiveRadioSize={setActiveRadioSize}
                  sizeKeys={sizeKeys}
                  selectedChecked={forcedChecked != null ? forcedChecked : activeRadioChecked}
                  setSelectedChecked={setActiveRadioChecked}
                  selectedState={forcedState || activeRadioState}
                  setSelectedState={setActiveRadioState}
                  showLabel={activeRadioShowLabel}
                  setShowLabel={setActiveRadioShowLabel}
                  forcedChecked={forcedChecked}
                  forcedState={forcedState}
                />
              )}
              {activeComponent === "chip" && (
                <ChipPropertiesPanel
                  activeVariant={forcedVariant || activeVariant}
                  setActiveVariant={setActiveVariant}
                  activeChipSize={activeChipSize}
                  setActiveChipSize={setActiveChipSize}
                  activeChipRadius={activeChipRadius}
                  setActiveChipRadius={setActiveChipRadius}
                  sizeKeys={sizeKeys}
                  selectedChecked={forcedChecked != null ? forcedChecked : activeChipChecked}
                  setSelectedChecked={setActiveChipChecked}
                  selectedState={forcedState || activeChipState}
                  setSelectedState={setActiveChipState}
                  forcedChecked={forcedChecked}
                  forcedState={forcedState}
                />
              )}
              {activeComponent === "tooltip" && (
                <TooltipPropertiesPanel
                  activePosition={activeTooltipPosition}
                  setActivePosition={setActiveTooltipPosition}
                  withArrow={activeTooltipWithArrow}
                  setWithArrow={setActiveTooltipWithArrow}
                />
              )}
              {activeComponent === "notification" && (
                <NotificationPropertiesPanel
                  radius={activeNotificationRadius}
                  setRadius={setActiveNotificationRadius}
                  color={activeNotificationColor}
                  setColor={setActiveNotificationColor}
                  withBorder={activeNotificationWithBorder}
                  setWithBorder={setActiveNotificationWithBorder}
                  withCloseButton={activeNotificationWithCloseButton}
                  setWithCloseButton={setActiveNotificationWithCloseButton}
                  withIcon={activeNotificationWithIcon}
                  setWithIcon={setActiveNotificationWithIcon}
                  loading={activeNotificationLoading}
                  setLoading={setActiveNotificationLoading}
                  title={activeNotificationTitle}
                  setTitle={setActiveNotificationTitle}
                  description={activeNotificationDescription}
                  setDescription={setActiveNotificationDescription}
                />
              )}
              {activeComponent === "alert" && (
                <AlertPropertiesPanel
                  variant={forcedVariant || activeVariant}
                  setVariant={setActiveVariant}
                  color={activeAlertColor}
                  setColor={setActiveAlertColor}
                  colorOptions={colorNames}
                  radius={activeAlertRadius}
                  setRadius={setActiveAlertRadius}
                  withCloseButton={activeAlertWithCloseButton}
                  setWithCloseButton={setActiveAlertWithCloseButton}
                  withIcon={activeAlertWithIcon}
                  setWithIcon={setActiveAlertWithIcon}
                  title={activeAlertTitle}
                  setTitle={setActiveAlertTitle}
                  message={activeAlertMessage}
                  setMessage={setActiveAlertMessage}
                />
              )}
              {activeComponent === "textinput" && (
                <TextInputPropertiesPanel
                  activeVariant={forcedVariant || activeVariant}
                  setActiveVariant={setActiveVariant}
                  activeTextInputSize={activeTextInputSize}
                  setActiveTextInputSize={setActiveTextInputSize}
                  activeTextInputRadius={activeTextInputRadius}
                  setActiveTextInputRadius={setActiveTextInputRadius}
                  sizeKeys={sizeKeys}
                  selectedState={forcedState || activeTextInputState}
                  setSelectedState={setActiveTextInputState}
                  showLabel={activeTextInputShowLabel}
                  setShowLabel={setActiveTextInputShowLabel}
                  labelText={activeTextInputLabelText}
                  setLabelText={setActiveTextInputLabelText}
                  withAsterisk={activeTextInputWithAsterisk}
                  setWithAsterisk={setActiveTextInputWithAsterisk}
                  showError={activeTextInputShowError}
                  setShowError={setActiveTextInputShowError}
                  errorText={activeTextInputErrorText}
                  setErrorText={setActiveTextInputErrorText}
                  forcedState={forcedState}
                />
              )}
              {activeComponent === "select" && (
                <SelectPropertiesPanel
                  activeVariant={forcedVariant || activeVariant}
                  setActiveVariant={setActiveVariant}
                  activeSelectSize={activeSelectSize}
                  setActiveSelectSize={setActiveSelectSize}
                  activeSelectRadius={activeSelectRadius}
                  setActiveSelectRadius={setActiveSelectRadius}
                  sizeKeys={sizeKeys}
                  selectedState={forcedState || activeSelectState}
                  setSelectedState={setActiveSelectState}
                  showLabel={activeSelectShowLabel}
                  setShowLabel={setActiveSelectShowLabel}
                  labelText={activeSelectLabelText}
                  setLabelText={setActiveSelectLabelText}
                  withAsterisk={activeSelectWithAsterisk}
                  setWithAsterisk={setActiveSelectWithAsterisk}
                  showError={activeSelectShowError}
                  setShowError={setActiveSelectShowError}
                  errorText={activeSelectErrorText}
                  setErrorText={setActiveSelectErrorText}
                  searchable={activeSelectSearchable}
                  setSearchable={setActiveSelectSearchable}
                  clearable={activeSelectClearable}
                  setClearable={setActiveSelectClearable}
                  forcedState={forcedState}
                />
              )}
              {activeComponent === "card" && (
                <CardPropertiesPanel
                  size={activeCardSize}
                  setSize={setActiveCardSize}
                  radius={activeCardRadius}
                  setRadius={setActiveCardRadius}
                  withBorder={activeCardWithBorder}
                  setWithBorder={setActiveCardWithBorder}
                  withShadow={activeCardWithShadow}
                  setWithShadow={setActiveCardWithShadow}
                  showSection={activeCardShowSection}
                  setShowSection={setActiveCardShowSection}
                  showBadge={activeCardShowBadge}
                  setShowBadge={setActiveCardShowBadge}
                  title={activeCardTitle}
                  setTitle={setActiveCardTitle}
                  description={activeCardDescription}
                  setDescription={setActiveCardDescription}
                />
              )}
              {activeComponent === "loader" && (
                <LoaderPropertiesPanel
                  size={activeLoaderSize}
                  setSize={setActiveLoaderSize}
                  type={activeLoaderType}
                  setType={setActiveLoaderType}
                />
              )}
              {activeComponent === "pill" && (
                <PillPropertiesPanel
                  size={activePillSize}
                  setSize={setActivePillSize}
                  withRemoveButton={activePillWithRemoveButton}
                  setWithRemoveButton={setActivePillWithRemoveButton}
                  text={activePillText}
                  setText={setActivePillText}
                />
              )}
              {activeComponent === "badge" && (
                <BadgePropertiesPanel
                  activeVariant={forcedVariant || activeVariant}
                  setActiveVariant={setActiveVariant}
                  size={activeBadgeSize}
                  setSize={setActiveBadgeSize}
                  radius={activeBadgeRadius}
                  setRadius={setActiveBadgeRadius}
                  circle={activeBadgeCircle}
                  setCircle={setActiveBadgeCircle}
                  fullWidth={activeBadgeFullWidth}
                  setFullWidth={setActiveBadgeFullWidth}
                  text={activeBadgeText}
                  setText={setActiveBadgeText}
                />
              )}
              {!["button", "actionicon", "tabs", "switch", "slider", "rangeslider", "title", "text", "anchor", "modal", "checkbox", "radio", "chip", "tooltip", "notification", "alert", "textinput", "select", "card", "loader", "pill", "badge"].includes(activeComponent) && (
                <div style={{ fontSize: 12, color: "#868E96", lineHeight: 1.5 }}>
                  Properties for this component are currently shown in the preview column.
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              width: componentsPanelWidth,
              overflowY: "auto",
              scrollbarGutter: "stable",
              padding: "16px 12px",
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: 11, color: "#5C5F66", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 8 }}>
              Components
            </div>
            <div>
              {COMPONENT_NAMES.map((name) => (
                <button
                  key={name}
                  onClick={() => handleComponentChange(name)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    background: activeComponent === name ? "#25262B" : "transparent",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 12px",
                    boxSizing: "border-box",
                    fontSize: 13,
                    fontWeight: activeComponent === name ? 600 : 400,
                    color: activeComponent === name ? "#E9ECEF" : "#909296",
                    cursor: "pointer",
                    marginBottom: 2,
                  }}
                  onMouseEnter={(e) => {
                    if (activeComponent !== name) e.currentTarget.style.background = "#2C2E33";
                  }}
                  onMouseLeave={(e) => {
                    if (activeComponent !== name) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {getComponentLabel(name)}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          <div
            style={{
              background: "#25262B",
              borderRadius: 8,
              padding: 24,
              maxWidth: 720,
              margin: "0 auto",
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "#5C5F66", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                Figma Sync
              </div>
              <p style={{ fontSize: 13, color: "#868E96", marginBottom: 16, lineHeight: 1.5 }}>
                Sync resolved token data to Figma variables via the relay server.
              </p>
              <FigmaSyncButton
                brands={brands}
                syncBuildOptions={{
                  buttonFocusRingStyle: activeButtonFocusRingStyle,
                  actionIconFocusRingStyle: activeActionIconFocusRingStyle,
                  buttonVariants: buildButtonVariants,
                  actionIconVariants: buildActionIconVariants,
                  tabsVariants: buildTabsVariants,
                }}
              />

              <div style={{ borderTop: "1px solid #2C2E33", marginTop: 20, paddingTop: 20 }}>
                <div style={{ fontSize: 11, color: "#5C5F66", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                  Local Data
                </div>
                <p style={{ fontSize: 13, color: "#868E96", marginBottom: 16, lineHeight: 1.5 }}>
                  Clear locally cached token edits and restore defaults.
                </p>
                <button
                disabled
                  onClick={handleResetLocalData}
                  style={{  borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600,  cursor: "pointer", }}
                >
                  Reset Local Data
                </button>
              </div>

              <div style={{ borderTop: "1px solid #2C2E33", marginTop: 20, paddingTop: 20 }}>
                <div style={{ fontSize: 11, color: "#5C5F66", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                  Markdown Export
                </div>
                <p style={{ fontSize: 13, color: "#868E96", marginBottom: 16, lineHeight: 1.5 }}>
                  Download a markdown reference of all tokens, brand primitives, semantic mappings, and component definitions.
                </p>
                <button
                  onClick={handleMarkdownExport}
                  style={{ background: "#25262B", border: "1px solid #373A40", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#C1C2C5", cursor: "pointer", fontFamily: "monospace" }}
                >
                  Download Markdown
                </button>
              </div>

              <div style={{ borderTop: "1px solid #2C2E33", marginTop: 20, paddingTop: 20 }}>
                <div style={{ fontSize: 11, color: "#5C5F66", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                  Component Docs Export
                </div>
                <p style={{ fontSize: 13, color: "#868E96", marginBottom: 16, lineHeight: 1.5 }}>
                  Download a component usage guide with Figma properties, variant/state values, and brand light/dark references.
                </p>
                <button
                  onClick={handleComponentDocsExport}
                  style={{ background: "#25262B", border: "1px solid #373A40", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#C1C2C5", cursor: "pointer", fontFamily: "monospace" }}
                >
                  Download Usage Guide
                </button>
              </div>

              <div style={{ borderTop: "1px solid #2C2E33", marginTop: 20, paddingTop: 20 }}>
                <div style={{ fontSize: 11, color: "#5C5F66", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                  Storybook Export
                </div>
                <p style={{ fontSize: 13, color: "#868E96", marginBottom: 16, lineHeight: 1.5 }}>
                  Launch a live Storybook with all components, tokens, and a brand switcher toolbar.
                </p>
                <button
                  onClick={handleStorybookExport}
                  disabled={storybookLoading}
                  style={{ background: storybookLoading ? "#1971C2" : "#228BE6", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#fff", cursor: storybookLoading ? "wait" : "pointer", fontFamily: "monospace", opacity: storybookLoading ? 0.8 : 1 }}
                >
                  {storybookLoading ? "Launching Storybook..." : "Launch Storybook"}
                </button>
                {storybookError && (
                  <p style={{ fontSize: 12, color: "#FA5252", marginTop: 8 }}>{storybookError}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
