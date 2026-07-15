import { useState, useCallback, useEffect, useRef } from "react";
import {
  Switch as MantineSwitch,
  Modal,
  Button,
  TextInput,
  Stack,
  Text,
  Group,
} from "@mantine/core";
import { INITIAL_BRANDS, BRAND_STARTER_SEMANTIC_MAP } from "./data/brands";
import { STORYBOOK_BRANDS } from "./data/storybookBrands";
import { createNewBrand } from "./utils/createNewBrand";
import {
  COMPONENT_NAMES,
  COMPONENT_SIZE_KEYS,
  CHART_COMPONENTS,
  getColorTokens,
  getDimensionTokens,
} from "./data/componentTokens";
import {
  resolveColor,
  getComponentDefaultSize,
  getDefaultSizeKey,
  mergeLightSemanticsForBrand,
  mergeDarkSemanticsForBrand,
  availableAvatarColors,
  readableTextOn,
  chartSeriesMappingForToken,
  chartSeriesOpacityMappingForToken,
  chartShadeMappingForToken,
  chartShadeOpacityMappingForToken,
} from "./utils/resolveToken";
import { resolveGradientCss } from "./utils/resolveGradient";
import Section from "./components/shared/Section";
import ComponentSelect from "./components/shared/ComponentSelect";
import PrimitiveScale from "./components/editors/PrimitiveScale";
import TokenChainCard from "./components/editors/TokenChainCard";
import DimensionTokenRow from "./components/editors/DimensionTokenRow";
import AddPrimitiveForm from "./components/editors/AddPrimitiveForm";
import BrandGradientsSection from "./components/editors/BrandGradientsSection";
import SemanticColorEditor from "./components/editors/SemanticColorEditor";
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
  BurgerPreviewContent,
  BurgerPropertiesPanel,
} from "./components/panels/BurgerPreviewPanel";
import {
  SegmentedControlPreviewContent,
  SegmentedControlPropertiesPanel,
} from "./components/panels/SegmentedControlPreviewPanel";
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
  PopoverPreviewContent,
  PopoverPropertiesPanel,
} from "./components/panels/PopoverPreviewPanel";
import {
  MenuPreviewContent,
  MenuPropertiesPanel,
} from "./components/panels/MenuPreviewPanel";
import {
  DividerPreviewContent,
  DividerPropertiesPanel,
} from "./components/panels/DividerPreviewPanel";
import {
  ListPreviewContent,
  ListPropertiesPanel,
} from "./components/panels/ListPreviewPanel";
import {
  LoaderPreviewContent,
  LoaderPropertiesPanel,
} from "./components/panels/LoaderPreviewPanel";
import {
  ProgressPreviewContent,
  ProgressPropertiesPanel,
} from "./components/panels/ProgressPreviewPanel";
import {
  ChartPreviewContent,
  ChartPropertiesPanel,
} from "./components/panels/ChartPreviewPanel";
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
  MultiSelectPreviewContent,
  MultiSelectPropertiesPanel,
} from "./components/panels/MultiSelectPreviewPanel";
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
  AccordionPreviewContent,
  AccordionPropertiesPanel,
} from "./components/panels/AccordionPreviewPanel";
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
import {
  ImagePreviewContent,
  ImagePropertiesPanel,
} from "./components/panels/ImagePreviewPanel";
import {
  AvatarPreviewContent,
  AvatarPropertiesPanel,
} from "./components/panels/AvatarPreviewPanel";
import {
  SkeletonPreviewContent,
  SkeletonPropertiesPanel,
} from "./components/panels/SkeletonPreviewPanel";
import { TablePreviewContent, TablePropertiesPanel } from "./components/panels/TablePreviewPanel";
import { CalendarPreviewContent, CalendarPropertiesPanel } from "./components/panels/CalendarPreviewPanel";
import { FoundationsPreviewContent } from "./components/panels/FoundationsPreviewPanel";
import { DocsThemePreviewContent } from "./components/panels/DocsThemePreviewPanel";
import FigmaSyncButton from "./components/FigmaSyncButton";
import { buildMarkdownExport } from "./utils/buildMarkdownExport";
import { buildComponentDocsExport } from "./utils/buildComponentDocsExport";
import { GLOBAL_PRIMITIVES } from "./data/brands";

const VARIANTS_BY_COMPONENT = {
  button: ["filled", "outlined", "ghost"],
  actionicon: ["default", "filled", "light", "outlined", "transparent"],
  tabs: ["default", "outlined", "pills"],
  accordion: ["default", "contained", "filled"],
  checkbox: ["filled", "outlined"],
  chip: ["filled", "light", "outline"],
  badge: ["default", "filled", "light", "outline"],
  card: ["default", "dark", "outlined", "brand", "transparent"],
  alert: ["default", "filled", "light", "outline", "transparent", "white"],
  notification: ["default"],
  radio: ["filled", "outline"],
  textinput: ["default", "filled"],
  select: ["default", "filled"],
  multiselect: ["default", "filled"],
  modal: ["default", "filled"],
  table: ["default"],
  progress: ["default"],
  avatar: ["filled"],
};

const APP_STORAGE_KEY = "design-system-generator:v1";
// Durable, origin-independent persistence. localStorage is per-origin (per dev
// port) and can be cleared by the browser, which is why edits appeared to
// "reset" between sessions. The relay also writes brands to disk so they
// survive port changes, browser clears, and multiple tabs.
const RELAY_HTTP = "http://localhost:9001";
const DEFAULT_TITLE_TEXT = "Why guess when you can know.";

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

function postBrandsToDisk(stateObj) {
  if (typeof window === "undefined" || typeof fetch === "undefined") return;
  try {
    const body = JSON.stringify(stateObj);
    fetch(`${RELAY_HTTP}/api/save-brands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }).catch(() => {
      // Relay offline — localStorage remains the active fallback.
    });
  } catch (_err) {
    // Never let autosave throw into the render/effect path.
  }
}

function enforceTextDefaultMappings(brandsInput) {
  if (!brandsInput || typeof brandsInput !== "object") return brandsInput;
  const next = JSON.parse(JSON.stringify(brandsInput));
  const semanticScaleKeys = ["semanticRadiusMap", "semanticTypographyMap", "semanticSpacingMap"];

  const isValidMapping = (m) =>
    m != null && typeof m === "object" && m.color != null && Number.isFinite(Number(m.index));

  const applyMappings = (brandId, mappings) => {
    if (!next[brandId]) return;
    if (!next[brandId].semanticMap) next[brandId].semanticMap = {};
    if (!next[brandId].darkSemanticOverrides) next[brandId].darkSemanticOverrides = {};
    Object.entries(mappings).forEach(([semantic, mapping]) => {
      // Backfill-only: seed the default mapping when missing/invalid, but never
      // stomp a value the user has explicitly set. This is what makes the
      // Semantic Colors editor safe — edits to these keys now persist across
      // reloads instead of being force-reset on every load.
      if (!isValidMapping(next[brandId].semanticMap[semantic])) {
        next[brandId].semanticMap[semantic] = { ...mapping };
      }
      // Preserve any explicit dark override; only backfill if missing.
      if (!isValidMapping(next[brandId].darkSemanticOverrides[semantic])) {
        next[brandId].darkSemanticOverrides[semantic] = { ...mapping };
      }
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

  // Backfill newly introduced semantic scalar maps for users with persisted local state.
  Object.keys(INITIAL_BRANDS).forEach((brandId) => {
    if (!next[brandId]) return;
    if (!next[brandId].componentDefaults) next[brandId].componentDefaults = {};
    const initialComponentDefaults = INITIAL_BRANDS[brandId]?.componentDefaults || {};
    Object.entries(initialComponentDefaults).forEach(([defaultKey, defaultValue]) => {
      if (next[brandId].componentDefaults[defaultKey] === undefined) {
        next[brandId].componentDefaults[defaultKey] = defaultValue;
      }
    });

    semanticScaleKeys.forEach((mapKey) => {
      if (next[brandId][mapKey] && Object.keys(next[brandId][mapKey]).length > 0) return;
      const fallbackMap = INITIAL_BRANDS[brandId]?.[mapKey];
      if (fallbackMap && typeof fallbackMap === "object") {
        next[brandId][mapKey] = JSON.parse(JSON.stringify(fallbackMap));
      }
    });

    // Migrate legacy semantic typography keys from "typography/h1/font-size"
    // to "typography/h1" so Figma shows h1/h2/etc directly.
    const legacyTypography = next[brandId].semanticTypographyMap;
    if (legacyTypography && typeof legacyTypography === "object") {
      const migratedTypography = {};
      Object.entries(legacyTypography).forEach(([key, value]) => {
        if (typeof key === "string" && key.endsWith("/font-size")) {
          migratedTypography[key.slice(0, -"/font-size".length)] = value;
        } else {
          migratedTypography[key] = value;
        }
      });
      next[brandId].semanticTypographyMap = migratedTypography;
    }
  });

  Object.keys(next).forEach((brandId) => {
    if (!next[brandId].gradients || typeof next[brandId].gradients !== "object") {
      const fallback = INITIAL_BRANDS[brandId]?.gradients;
      next[brandId].gradients = fallback ? JSON.parse(JSON.stringify(fallback)) : {};
    }
  });

  // Backfill feedback-warning for persisted brands (Text success/warning/error colors).
  Object.keys(next).forEach((brandId) => {
    const b = next[brandId];
    if (!b.semanticMap) b.semanticMap = {};
    if (!b.darkSemanticOverrides) b.darkSemanticOverrides = {};
    if (!b.semanticMap["feedback-warning"]) {
      const fromInitial = INITIAL_BRANDS[brandId]?.semanticMap?.["feedback-warning"];
      b.semanticMap["feedback-warning"] = {
        ...(fromInitial || BRAND_STARTER_SEMANTIC_MAP["feedback-warning"]),
      };
    }
    if (!b.darkSemanticOverrides["feedback-warning"]) {
      const fromDark = INITIAL_BRANDS[brandId]?.darkSemanticOverrides?.["feedback-warning"];
      b.darkSemanticOverrides["feedback-warning"] = {
        ...(fromDark || b.semanticMap["feedback-warning"]),
      };
    }
  });

  // Migrate legacy/oversized Select icon sizes to Button-aligned defaults.
  // Some persisted snapshots include partial overrides (e.g. default: 31), so
  // migrate whenever we detect old or clearly oversized values.
  const legacySelectSectionSizes = { default: 32, xs: 28, sm: 32, md: 36, lg: 40, xl: 44 };
  const nextSelectSectionSizes = { default: 14, xs: 12, sm: 14, md: 16, lg: 18, xl: 20 };
  Object.keys(next).forEach((brandId) => {
    const b = next[brandId];
    if (!b || !b.dimensionOverrides) return;
    if (b.dimensionOverrides["select-section-size"] && !b.dimensionOverrides["select-icon-size"]) {
      b.dimensionOverrides["select-icon-size"] = { ...b.dimensionOverrides["select-section-size"] };
    }
    if (b.dimensionOverrides["select-section-size"]) {
      delete b.dimensionOverrides["select-section-size"];
    }
    if (!b.dimensionOverrides["select-icon-size"]) return;
    const override = b.dimensionOverrides["select-icon-size"];
    const keys = Object.keys(legacySelectSectionSizes);
    const hasAnyLegacyValue = keys.some((k) => {
      if (override[k] === undefined) return false;
      return Number(override[k]) === Number(legacySelectSectionSizes[k]);
    });
    const hasOversizedValue = keys.some((k) => {
      if (override[k] === undefined) return false;
      return Number(override[k]) > 24;
    });
    if (hasAnyLegacyValue || hasOversizedValue) {
      b.dimensionOverrides["select-icon-size"] = { ...nextSelectSectionSizes };
    }
  });

  // Migrate legacy flat modal color overrides to the "filled" variant. The
  // original modal became the `filled` variant, so any persisted overrides like
  // `modal-background` must move to `modal-filled-background` to keep the modal
  // already in use looking identical. New `modal-default-*` tokens are untouched.
  var modalColorSuffixes = [
    "background",
    "header-background",
    "footer-background",
    "border",
    "title",
    "body",
    "overlay",
    "close",
  ];
  Object.keys(next).forEach((brandId) => {
    const b = next[brandId];
    if (!b) return;
    ["componentOverrides", "componentOverridesDark"].forEach((mapKey) => {
      const map = b[mapKey];
      if (!map || typeof map !== "object") return;
      modalColorSuffixes.forEach((suffix) => {
        const oldKey = `modal-${suffix}`;
        const newKey = `modal-filled-${suffix}`;
        if (map[oldKey] && !map[newKey]) {
          map[newKey] = map[oldKey];
        }
        if (map[oldKey]) delete map[oldKey];
      });
    });
  });

  // Migrate legacy shared modal dimension overrides (spacing/typography/border-width)
  // to the "filled" variant so modals already in use keep their exact sizing. Width,
  // radius, overlay-opacity, and close-icon-stroke-width stay shared and are untouched.
  var modalDimSuffixes = [
    "padding-x",
    "padding-y",
    "header-padding-x",
    "header-padding-y",
    "body-padding-top",
    "body-padding-right",
    "body-padding-bottom",
    "body-padding-left",
    "footer-padding-x",
    "footer-padding-y",
    "title-font-size",
    "title-font-family",
    "title-font-weight",
    "title-line-height",
    "body-font-size",
    "body-font-family",
    "body-font-weight",
    "body-line-height",
    "border-width",
  ];
  Object.keys(next).forEach((brandId) => {
    const b = next[brandId];
    if (!b) return;
    const dims = b.dimensionOverrides;
    if (!dims || typeof dims !== "object") return;
    modalDimSuffixes.forEach((suffix) => {
      const oldKey = `modal-${suffix}`;
      const newKey = `modal-filled-${suffix}`;
      if (dims[oldKey] && !dims[newKey]) {
        dims[newKey] = dims[oldKey];
      }
      if (dims[oldKey]) delete dims[oldKey];
    });
    // Footer padding moved from x/y to per-side (top/right/bottom/left) to match
    // body padding. Map x -> right + left and y -> top + bottom for each variant.
    ["default", "filled"].forEach((mv) => {
      const xKey = `modal-${mv}-footer-padding-x`;
      const yKey = `modal-${mv}-footer-padding-y`;
      if (dims[xKey]) {
        if (!dims[`modal-${mv}-footer-padding-right`]) dims[`modal-${mv}-footer-padding-right`] = dims[xKey];
        if (!dims[`modal-${mv}-footer-padding-left`]) dims[`modal-${mv}-footer-padding-left`] = dims[xKey];
        delete dims[xKey];
      }
      if (dims[yKey]) {
        if (!dims[`modal-${mv}-footer-padding-top`]) dims[`modal-${mv}-footer-padding-top`] = dims[yKey];
        if (!dims[`modal-${mv}-footer-padding-bottom`]) dims[`modal-${mv}-footer-padding-bottom`] = dims[yKey];
        delete dims[yKey];
      }
    });
  });

  return next;
}

function mergeRecoveredBrands(brandsInput) {
  if (!brandsInput || typeof brandsInput !== "object") return brandsInput;
  const snapshot = STORYBOOK_BRANDS && typeof STORYBOOK_BRANDS === "object" ? STORYBOOK_BRANDS : null;
  if (!snapshot) return brandsInput;
  const merged = { ...snapshot, ...brandsInput };
  return merged;
}

export default function App() {
  const COMPONENT_LABELS = {
    foundations: "Foundations",
    docs: "Docs Theme",
    actionicon: "ActionIcon",
    textinput: "TextInput",
    rangeslider: "RangeSlider",
    chart: "Bar Chart",
    "chart-line": "Line Chart",
    "chart-time-series": "Time Series Chart",
    "chart-time-series-dual-axis": "Time Series Dual Axis Chart",
    "chart-area": "Area Chart",
    "chart-stacked-area": "Stacked Area Chart",
    "chart-stacked-bar": "Stacked Bar Chart",
    "chart-combo": "Combo Chart",
    "chart-donut": "Donut Chart",
    "chart-radar": "Radar Chart",
    "chart-scatter": "Scatter Chart",
    "chart-candlestick": "Candlestick Chart",
    "chart-sparkline": "Sparkline",
    "chart-bar-horizontal": "Horizontal Bar Chart",
    "chart-pie": "Pie Chart",
    "chart-funnel": "Funnel Chart",
    "chart-radial": "Radial Bar Chart",
    multiselect: "MultiSelect",
    segmentedcontrol: "SegmentedControl",
  };
  const getComponentLabel = (name) =>
    COMPONENT_LABELS[name] || name.charAt(0).toUpperCase() + name.slice(1);

  const [brands, setBrands] = useState(() => {
    const persisted = loadPersistedAppState();
    // When there's no saved local state (fresh browser, cleared storage, or the
    // dev server came up on a different port so localStorage is a blank store),
    // fall back to the committed STORYBOOK_BRANDS snapshot — the user's last
    // exported data — NOT the empty INITIAL_BRANDS starter. INITIAL_BRANDS has
    // zero component overrides, and because mergeRecoveredBrands lets `source`
    // win per-brand, using it would clobber the rich snapshot and wipe every
    // saved color (including the filled variants). STORYBOOK_BRANDS is the
    // durable record, so colors survive an empty store.
    const source =
      persisted?.brands && Object.keys(persisted.brands).length > 0
        ? persisted.brands
        : STORYBOOK_BRANDS;
    return enforceTextDefaultMappings(mergeRecoveredBrands(source));
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
  // Snapshot of the localStorage state as it was BEFORE this mount's first save
  // stamps a fresh timestamp. Used to decide whether the on-disk autosave is
  // newer (and should be restored) without the mount-save corrupting the
  // comparison.
  const initialLocalRef = useRef(undefined);
  if (initialLocalRef.current === undefined) {
    const p = loadPersistedAppState();
    initialLocalRef.current = {
      savedAt: Number(p?.savedAt || 0),
      hasBrands: !!(p?.brands && typeof p.brands === "object" && Object.keys(p.brands).length > 0),
    };
  }
  // Gates the disk autosave until the initial disk load has run, so stale
  // startup state can never overwrite newer on-disk data.
  const diskLoadedRef = useRef(false);
  const diskSaveTimerRef = useRef(null);
  const [brandDeleteModalOpened, setBrandDeleteModalOpened] = useState(false);
  const [brandDeleteTargetId, setBrandDeleteTargetId] = useState(null);
  const [brandDeleteConfirmInput, setBrandDeleteConfirmInput] = useState("");
  const [paletteDeleteModalOpened, setPaletteDeleteModalOpened] = useState(false);
  const [paletteDeleteTargetName, setPaletteDeleteTargetName] = useState("");
  const [paletteDeleteConfirmInput, setPaletteDeleteConfirmInput] = useState("");
  const importBrandsInputRef = useRef(null);
  const mergeBrandsInputRef = useRef(null);
  const [localDataMessage, setLocalDataMessage] = useState(null);
  // Surfaced when a localStorage write fails (quota, private mode, blocked) so
  // edits can never silently vanish without the user finding out.
  const [storageError, setStorageError] = useState(null);
  // Holds a parsed-but-not-yet-applied brand merge so the user can review/select
  // which incoming brands to add or update before anything touches their state.
  const [pendingBrandMerge, setPendingBrandMerge] = useState(null);
  if (typeof window !== "undefined") {
    window.__DSG_PREVIEW_THEME = previewTheme;
    window.__DSG_PREVIEW_BRAND = activeBrand;
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
  const [activeButtonColor, setActiveButtonColor] = useState("primary");
  const [activeButtonLeftIcon, setActiveButtonLeftIcon] = useState(false);
  const [activeButtonRightIcon, setActiveButtonRightIcon] = useState(false);
  const [activeButtonFocusRingStyle, setActiveButtonFocusRingStyle] = useState("offset");
  /** When set, filled Button preview uses this gradient instead of token solid fill. */
  const [buttonFillGradientId, setButtonFillGradientId] = useState(null);
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
  const lightSemanticMerged = brand ? mergeLightSemanticsForBrand(brand) : {};
  const darkSemanticMerged = brand ? mergeDarkSemanticsForBrand(brand) : {};
  const colorNames = Object.keys(brand.primitives);
  const globalColorNames = Object.keys(GLOBAL_PRIMITIVES);
  const gradientPaletteColorNames = [...new Set([...globalColorNames, ...colorNames])].sort((a, b) =>
    a.localeCompare(b)
  );
  const buttonFillGradientCss =
    buttonFillGradientId && brand ? resolveGradientCss(brand, buttonFillGradientId) : null;
  const defaultBrandColor = colorNames.includes("blue")
    ? "blue"
    : (colorNames[0] || globalColorNames[0] || "neutral");
  const sizeKeys = COMPONENT_SIZE_KEYS[activeComponent] || [];

  // Derive default size per component from brand data
  const buttonDefault = getComponentDefaultSize(brands, activeBrand, "button") || "sm";
  const actionIconDefault = getComponentDefaultSize(brands, activeBrand, "actionicon") || "sm";
  const tabsDefault = getComponentDefaultSize(brands, activeBrand, "tabs") || "sm";
  const switchDefault = getComponentDefaultSize(brands, activeBrand, "switch") || "md";
  const burgerDefault = getComponentDefaultSize(brands, activeBrand, "burger") || "md";
  const segmentedControlDefault = getComponentDefaultSize(brands, activeBrand, "segmentedcontrol") || "md";
  const sliderDefault = getComponentDefaultSize(brands, activeBrand, "slider") || "md";
  const rangeSliderDefault = getComponentDefaultSize(brands, activeBrand, "rangeslider") || "md";
  const checkboxDefault = getComponentDefaultSize(brands, activeBrand, "checkbox") || "md";
  const radioDefault = getComponentDefaultSize(brands, activeBrand, "radio") || "md";
  const chipDefault = getComponentDefaultSize(brands, activeBrand, "chip") || "md";
  const textInputDefault = getComponentDefaultSize(brands, activeBrand, "textinput") || "sm";
  const selectDefault = getComponentDefaultSize(brands, activeBrand, "select") || "sm";
  const multiSelectDefault = getComponentDefaultSize(brands, activeBrand, "multiselect") || "sm";
  const cardDefault = getComponentDefaultSize(brands, activeBrand, "card") || "default";
  const pillDefault = getComponentDefaultSize(brands, activeBrand, "pill") || "default";
  const badgeDefault = getComponentDefaultSize(brands, activeBrand, "badge") || "default";
  const modalDefault = getComponentDefaultSize(brands, activeBrand, "modal") || "md";
  const imageDefault = getComponentDefaultSize(brands, activeBrand, "image") || "default";
  const skeletonDefault = getComponentDefaultSize(brands, activeBrand, "skeleton") || "default";
  const skeletonRadiusDefault =
    getDefaultSizeKey(brands, activeBrand, "skeleton-radius") || skeletonDefault;
  const anchorDefault = getComponentDefaultSize(brands, activeBrand, "anchor") || "md";
  const textDefault = getComponentDefaultSize(brands, activeBrand, "text") || "md";
  const progressHeightDefault =
    getDefaultSizeKey(brands, activeBrand, "progress-height") ||
    getComponentDefaultSize(brands, activeBrand, "progress") ||
    "md";
  const progressRadiusDefault =
    getDefaultSizeKey(brands, activeBrand, "progress-radius") || "md";
  const chartSizeDefault =
    getDefaultSizeKey(brands, activeBrand, "chart-width") ||
    getComponentDefaultSize(brands, activeBrand, "chart") ||
    "md";
  const avatarSizeDefault =
    getDefaultSizeKey(brands, activeBrand, "avatar-size") ||
    getComponentDefaultSize(brands, activeBrand, "avatar") ||
    "md";
  const avatarRadiusDefault =
    getDefaultSizeKey(brands, activeBrand, "avatar-radius") || "md";
  const avatarColorOptions = ["default", ...availableAvatarColors(brands, activeBrand)];

  const [activeSize, setActiveSize] = useState(buttonDefault);
  const [activeActionIconSize, setActiveActionIconSize] = useState(actionIconDefault);
  const [activeActionIconRadius, setActiveActionIconRadius] = useState(actionIconDefault);
  const [activeActionIconIcon, setActiveActionIconIcon] = useState("check");
  const [activeTabsRadius, setActiveTabsRadius] = useState(tabsDefault);
  const [activeTabsOrientation, setActiveTabsOrientation] = useState("horizontal");
  const [activeTabsShowPanel, setActiveTabsShowPanel] = useState(false);
  const [activeTabsShowMenu, setActiveTabsShowMenu] = useState(false);
  const [activeTabsShowLeftIcon, setActiveTabsShowLeftIcon] = useState(false);
  const [activeTabsShowRightIcon, setActiveTabsShowRightIcon] = useState(false);
  const [activeTabsShowLeftArrow, setActiveTabsShowLeftArrow] = useState(false);
  const [activeTabsShowRightArrow, setActiveTabsShowRightArrow] = useState(false);
  const [activeTabsState, setActiveTabsState] = useState("default");
  const [activeAccordionVariant, setActiveAccordionVariant] = useState("default");
  const [activeAccordionPosition, setActiveAccordionPosition] = useState("single");
  const [activeAccordionState, setActiveAccordionState] = useState("default");
  const [activeAccordionExpanded, setActiveAccordionExpanded] = useState(true);
  const [activeAccordionLabel, setActiveAccordionLabel] = useState("What is included?");
  const [activeSwitchSize, setActiveSwitchSize] = useState(switchDefault);
  const [activeSwitchChecked, setActiveSwitchChecked] = useState(false);
  const [activeSwitchState, setActiveSwitchState] = useState("default");
  const [activeBurgerSize, setActiveBurgerSize] = useState(burgerDefault);
  const [activeBurgerOpened, setActiveBurgerOpened] = useState(false);
  const [activeBurgerState, setActiveBurgerState] = useState("default");
  const [activeSegmentedControlSize, setActiveSegmentedControlSize] = useState(segmentedControlDefault);
  const [activeSegmentedControlOrientation, setActiveSegmentedControlOrientation] = useState("horizontal");
  const [activeSegmentedControlFullWidth, setActiveSegmentedControlFullWidth] = useState(false);
  const [activeSegmentedControlState, setActiveSegmentedControlState] = useState("default");
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
  const [activeTitleSize, setActiveTitleSize] = useState("h1");
  const [activeTitleTextWrap, setActiveTitleTextWrap] = useState("wrap");
  const [activeTitleLineClamp, setActiveTitleLineClamp] = useState(0);
  const [activeTitleText, setActiveTitleText] = useState(
    DEFAULT_TITLE_TEXT
  );
  const [activeTextSizeToken, setActiveTextSizeToken] = useState(textDefault);
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
  const [activePopoverPosition, setActivePopoverPosition] = useState("top");
  const [activePopoverWithArrow, setActivePopoverWithArrow] = useState(true);
  const [activePopoverWidthSize, setActivePopoverWidthSize] = useState("default");
  const [activePopoverRadiusSize, setActivePopoverRadiusSize] = useState("default");
  const [activePopoverBody, setActivePopoverBody] = useState("Additional context and actions can live here.");
  const [activeMenuSize, setActiveMenuSize] = useState("default");
  const [activeMenuRadiusSize, setActiveMenuRadiusSize] = useState("default");
  const [activeMenuState, setActiveMenuState] = useState("default");
  const [activeMenuWithSection, setActiveMenuWithSection] = useState(true);
  const [activeMenuWithIcons, setActiveMenuWithIcons] = useState(true);
  const [activeDividerSize, setActiveDividerSize] = useState("default");
  const [activeDividerOrientation, setActiveDividerOrientation] = useState("horizontal");
  const [activeDividerState, setActiveDividerState] = useState("default");
  const [activeDividerInset, setActiveDividerInset] = useState(true);
  const [activeListSize, setActiveListSize] = useState("default");
  const [activeListType, setActiveListType] = useState("unordered");
  const [activeListWithIcons, setActiveListWithIcons] = useState(true);
  const [activeListWithPadding, setActiveListWithPadding] = useState(false);
  const [activeLoaderSize, setActiveLoaderSize] = useState("default");
  const [activeLoaderType, setActiveLoaderType] = useState("oval");
  const [activeProgressSize, setActiveProgressSize] = useState(progressHeightDefault);
  const [activeProgressRadius, setActiveProgressRadius] = useState(progressRadiusDefault);
  const [activeProgressValue, setActiveProgressValue] = useState(60);
  const [activeProgressShowLabel, setActiveProgressShowLabel] = useState(true);
  const [activeChartSize, setActiveChartSize] = useState(chartSizeDefault);
  const [activeChartColorMode, setActiveChartColorMode] = useState("single");
  const [activeChartSeriesCount, setActiveChartSeriesCount] = useState(1);
  // Switching a line/area chart to palette/shades implies more than one series.
  const handleChartColorMode = (mode) => {
    setActiveChartColorMode(mode);
    if (mode !== "single") {
      // Area is capped at 2 series; donut allows up to 6; others default-bump to 3.
      const max = activeComponent === "chart-area" ? 2 : activeComponent === "chart-donut" ? 6 : 4;
      const bumpTo = activeComponent === "chart-area" ? 2 : activeComponent === "chart-donut" ? 4 : 3;
      setActiveChartSeriesCount((c) => Math.min(max, c < 2 ? bumpTo : c));
    }
  };
  const [activeChartShowPoints, setActiveChartShowPoints] = useState(true);
  const [activeChartShowGrid, setActiveChartShowGrid] = useState(true);
  const [activeChartShowAxis, setActiveChartShowAxis] = useState(true);
  const [activeChartShowLegend, setActiveChartShowLegend] = useState(false);
  const [activeChartShowRightAxis, setActiveChartShowRightAxis] = useState(false);
  // Sparkline render style (line | area | bar). End-dot reuses activeChartShowPoints.
  const [activeSparklineStyle, setActiveSparklineStyle] = useState("line");
  const [activeAvatarSize, setActiveAvatarSize] = useState(avatarSizeDefault);
  const [activeAvatarRadius, setActiveAvatarRadius] = useState(avatarRadiusDefault);
  const [activeAvatarName, setActiveAvatarName] = useState("Alex Carter");
  const [activeAvatarSrc, setActiveAvatarSrc] = useState("https://picsum.photos/id/64/256/256");
  const [activeAvatarContent, setActiveAvatarContent] = useState("initials");
  const [activeAvatarColor, setActiveAvatarColor] = useState("default");
  const [activePillSize, setActivePillSize] = useState(pillDefault);
  const [activePillWithRemoveButton, setActivePillWithRemoveButton] = useState(false);
  const [activePillText, setActivePillText] = useState("React");
  const [activeBadgeSize, setActiveBadgeSize] = useState(badgeDefault);
  const [activeBadgeRadius, setActiveBadgeRadius] = useState(badgeDefault);
  const [activeBadgeCircle, setActiveBadgeCircle] = useState(false);
  const [activeBadgeFullWidth, setActiveBadgeFullWidth] = useState(false);
  const [activeBadgeWithRemoveButton, setActiveBadgeWithRemoveButton] = useState(false);
  const [activeBadgeText, setActiveBadgeText] = useState("Badge");
  const [activeBadgeColor, setActiveBadgeColor] = useState("default");
  const [activeTextInputSize, setActiveTextInputSize] = useState(textInputDefault);
  const [activeTextInputRadius, setActiveTextInputRadius] = useState(textInputDefault);
  const [activeTextInputState, setActiveTextInputState] = useState("default");
  const [activeTextInputShowLabel, setActiveTextInputShowLabel] = useState(true);
  const [activeTextInputLabelText, setActiveTextInputLabelText] = useState("Label");
  const [activeTextInputWithAsterisk, setActiveTextInputWithAsterisk] = useState(false);
  const [activeTextInputShowError, setActiveTextInputShowError] = useState(false);
  const [activeTextInputErrorText, setActiveTextInputErrorText] = useState("Error message");
  const [activeTextInputLeftIcon, setActiveTextInputLeftIcon] = useState(false);
  const [activeTextInputRightIcon, setActiveTextInputRightIcon] = useState(false);
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
  const [activeSelectShowDropdown, setActiveSelectShowDropdown] = useState(true);
  const [activeMultiSelectSize, setActiveMultiSelectSize] = useState(multiSelectDefault);
  const [activeMultiSelectRadius, setActiveMultiSelectRadius] = useState(multiSelectDefault);
  const [activeMultiSelectState, setActiveMultiSelectState] = useState("default");
  const [activeMultiSelectShowLabel, setActiveMultiSelectShowLabel] = useState(true);
  const [activeMultiSelectLabelText, setActiveMultiSelectLabelText] = useState("Label");
  const [activeMultiSelectWithAsterisk, setActiveMultiSelectWithAsterisk] = useState(false);
  const [activeMultiSelectShowError, setActiveMultiSelectShowError] = useState(false);
  const [activeMultiSelectErrorText, setActiveMultiSelectErrorText] = useState("Error message");
  const [activeMultiSelectSearchable, setActiveMultiSelectSearchable] = useState(false);
  const [activeMultiSelectClearable, setActiveMultiSelectClearable] = useState(false);
  const [activeMultiSelectShowDropdown, setActiveMultiSelectShowDropdown] = useState(true);
  const [activeCardSize, setActiveCardSize] = useState(cardDefault);
  const [activeCardRadius, setActiveCardRadius] = useState(cardDefault);
  const [activeCardWithBorder, setActiveCardWithBorder] = useState(true);
  const [activeCardWithShadow, setActiveCardWithShadow] = useState(false);
  const [activeCardShowSection, setActiveCardShowSection] = useState(true);
  const [activeCardState, setActiveCardState] = useState("default");
  const [activeCardTitle, setActiveCardTitle] = useState("PlanetScope vessel");
  const [activeCardDescription, setActiveCardDescription] = useState(
    "Detected vessel metadata and imagery details from latest satellite capture."
  );
  const [activeNotificationRadius, setActiveNotificationRadius] = useState("default");
  const [activeNotificationColor, setActiveNotificationColor] = useState("primary");
  const [activeNotificationWithBorder, setActiveNotificationWithBorder] = useState(false);
  const [activeNotificationWithCloseButton, setActiveNotificationWithCloseButton] = useState(false);
  const [activeNotificationWithIcon, setActiveNotificationWithIcon] = useState(false);
  const [activeNotificationWithAccent, setActiveNotificationWithAccent] = useState(true);
  const [activeNotificationLoading, setActiveNotificationLoading] = useState(false);
  const [activeNotificationTitle, setActiveNotificationTitle] = useState("We notify you that");
  const [activeNotificationDescription, setActiveNotificationDescription] = useState(
    "You are now obligated to give a star to Mantine project on GitHub"
  );
  const [activeTableShowRowHover, setActiveTableShowRowHover] = useState(true);
  const [activeCalendarShowOutside, setActiveCalendarShowOutside] = useState(true);
  const [activeCalendarShowHeader, setActiveCalendarShowHeader] = useState(true);
  const [activeAlertRadius, setActiveAlertRadius] = useState("default");
  const [activeAlertColor, setActiveAlertColor] = useState("info");
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
  const [activeModalShowSectionDividers, setActiveModalShowSectionDividers] = useState(true);
  const [activeModalDividerInset, setActiveModalDividerInset] = useState(false);
  const [activeModalTitle, setActiveModalTitle] = useState("Modal title");
  const [activeModalBody, setActiveModalBody] = useState(
    "This action cannot be undone. Please confirm you want to proceed."
  );
  const [activeImageSrc, setActiveImageSrc] = useState("https://picsum.photos/id/28/1200/800");
  const [activeImageAlt, setActiveImageAlt] = useState("Mountain landscape");
  const [activeImageFallbackSrc, setActiveImageFallbackSrc] = useState("https://placehold.co/1200x800/1A1B1E/C1C2C5?text=Image");
  const [activeImageSize, setActiveImageSize] = useState(imageDefault);
  const [activeImageRadius, setActiveImageRadius] = useState(imageDefault);
  const [activeImageFit, setActiveImageFit] = useState("cover");
  const [activeSkeletonSize, setActiveSkeletonSize] = useState(skeletonDefault);
  const [activeSkeletonRadius, setActiveSkeletonRadius] = useState(skeletonRadiusDefault);
  const [activeSkeletonCircle, setActiveSkeletonCircle] = useState(false);
  const [activeSkeletonAnimate, setActiveSkeletonAnimate] = useState(true);

  // Sync active sizes when brand changes
  const handleBrandChange = useCallback((newBrand) => {
    setActiveBrand(newBrand);
    const btnDef = getComponentDefaultSize(brands, newBrand, "button") || "sm";
    const aiDef = getComponentDefaultSize(brands, newBrand, "actionicon") || "sm";
    const tbDef = getComponentDefaultSize(brands, newBrand, "tabs") || "sm";
    const swDef = getComponentDefaultSize(brands, newBrand, "switch") || "md";
    const bgDef = getComponentDefaultSize(brands, newBrand, "burger") || "md";
    const scDef = getComponentDefaultSize(brands, newBrand, "segmentedcontrol") || "md";
    const slDef = getComponentDefaultSize(brands, newBrand, "slider") || "md";
    const rslDef = getComponentDefaultSize(brands, newBrand, "rangeslider") || "md";
    const cbDef = getComponentDefaultSize(brands, newBrand, "checkbox") || "md";
    const rdDef = getComponentDefaultSize(brands, newBrand, "radio") || "md";
    const chDef = getComponentDefaultSize(brands, newBrand, "chip") || "md";
    const caDef = getComponentDefaultSize(brands, newBrand, "card") || "default";
    const piDef = getComponentDefaultSize(brands, newBrand, "pill") || "default";
    const baDef = getComponentDefaultSize(brands, newBrand, "badge") || "default";
    const moDef = getComponentDefaultSize(brands, newBrand, "modal") || "md";
    const imDef = getComponentDefaultSize(brands, newBrand, "image") || "default";
    const skDef = getComponentDefaultSize(brands, newBrand, "skeleton") || "default";
    const skRDef = getDefaultSizeKey(brands, newBrand, "skeleton-radius") || skDef;
    const anDef = getComponentDefaultSize(brands, newBrand, "anchor") || "md";
    const txDef = getComponentDefaultSize(brands, newBrand, "text") || "md";
    setActiveSize(btnDef);
    setActiveActionIconSize(aiDef);
    setActiveActionIconRadius(aiDef);
    setActiveTabsRadius(tbDef);
    setActiveSwitchSize(swDef);
    setActiveBurgerSize(bgDef);
    setActiveSegmentedControlSize(scDef);
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
    const mseDef = getComponentDefaultSize(brands, newBrand, "multiselect") || "sm";
    setActiveTextInputSize(tiDef);
    setActiveTextInputRadius(tiDef);
    setActiveSelectSize(seDef);
    setActiveSelectRadius(seDef);
    setActiveMultiSelectSize(mseDef);
    setActiveMultiSelectRadius(mseDef);
    setActiveCardSize(caDef);
    setActiveCardRadius(caDef);
    setActiveLoaderSize("default");
    const prHDef =
      getDefaultSizeKey(brands, newBrand, "progress-height") ||
      getComponentDefaultSize(brands, newBrand, "progress") ||
      "md";
    const prRDef = getDefaultSizeKey(brands, newBrand, "progress-radius") || "md";
    setActiveProgressSize(prHDef);
    setActiveProgressRadius(prRDef);
    const avSDef =
      getDefaultSizeKey(brands, newBrand, "avatar-size") ||
      getComponentDefaultSize(brands, newBrand, "avatar") ||
      "md";
    const avRDef = getDefaultSizeKey(brands, newBrand, "avatar-radius") || "md";
    setActiveAvatarSize(avSDef);
    setActiveAvatarRadius(avRDef);
    setActivePillSize(piDef);
    setActiveBadgeSize(baDef);
    setActiveBadgeRadius(baDef);
    setActiveModalSize(moDef);
    setActiveModalRadius(moDef);
    setActiveImageSize(imDef);
    setActiveImageRadius(imDef);
    setActiveSkeletonSize(skDef);
    setActiveSkeletonRadius(skRDef);
    setActiveAnchorSize(anDef);
    setActiveTextSizeToken(txDef);
    const nextBrandColors = Object.keys(brands[newBrand]?.primitives || {});
    const nextDefaultColor = nextBrandColors.includes("blue") ? "blue" : (nextBrandColors[0] || "blue");
    setActiveNotificationColor(nextDefaultColor);
    // Alert color is a semantic status (info/success/warning/error), not a brand hue.
    setActiveAlertColor("info");
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
      setActiveButtonColor("primary");
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
      setActiveTabsShowMenu(false);
      setActiveTabsShowLeftIcon(false);
      setActiveTabsShowRightIcon(false);
      setActiveTabsShowLeftArrow(false);
      setActiveTabsShowRightArrow(false);
      setActiveTabsState("default");
      setActiveVariant("default");
    } else if (newComp === "accordion") {
      setActiveAccordionVariant("default");
      setActiveAccordionPosition("single");
      setActiveAccordionState("default");
      setActiveAccordionExpanded(true);
      setActiveAccordionLabel("What is included?");
    } else if (newComp === "switch") {
      setActiveSwitchSize(switchDefault);
      setActiveSwitchChecked(false);
      setActiveSwitchState("default");
    } else if (newComp === "burger") {
      setActiveBurgerSize(burgerDefault);
      setActiveBurgerOpened(false);
      setActiveBurgerState("default");
    } else if (newComp === "segmentedcontrol") {
      setActiveSegmentedControlSize(segmentedControlDefault);
      setActiveSegmentedControlOrientation("horizontal");
      setActiveSegmentedControlFullWidth(false);
      setActiveSegmentedControlState("default");
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
      setActiveTitleSize("h1");
      setActiveTitleTextWrap("wrap");
      setActiveTitleLineClamp(0);
      setActiveTitleText(DEFAULT_TITLE_TEXT);
    } else if (newComp === "text") {
      setActiveTextSizeToken(textDefault);
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
      setActiveVariant("default");
      setActiveModalSize(modalDefault);
      setActiveModalRadius(modalDefault);
      setActiveModalLayout("basic");
      setActiveModalWithOverlay(true);
      setActiveModalWithCloseButton(true);
      setActiveModalCentered(true);
      setActiveModalShowSectionDividers(true);
      setActiveModalDividerInset(false);
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
      setActiveVariant("default");
      setActiveNotificationRadius("default");
      setActiveNotificationColor("primary");
      setActiveNotificationWithBorder(false);
      setActiveNotificationWithCloseButton(false);
      setActiveNotificationWithIcon(false);
      setActiveNotificationWithAccent(true);
      setActiveNotificationLoading(false);
      setActiveNotificationTitle("We notify you that");
      setActiveNotificationDescription("You are now obligated to give a star to Mantine project on GitHub");
    } else if (newComp === "alert") {
      setActiveAlertRadius("default");
      setActiveAlertColor("info");
      setActiveAlertWithCloseButton(false);
      setActiveAlertWithIcon(true);
      setActiveAlertTitle("Alert title");
      setActiveAlertMessage("Lorem ipsum dolor sit, amet consectetur adipisicing elit. At officiis, quae tempore necessitatibus placeat saepe.");
      setActiveVariant("default");
    } else if (newComp === "textinput") {
      setActiveTextInputSize(textInputDefault);
      setActiveTextInputRadius(textInputDefault);
      setActiveTextInputState("default");
      setActiveTextInputShowLabel(true);
      setActiveTextInputLabelText("Label");
      setActiveTextInputWithAsterisk(false);
      setActiveTextInputShowError(false);
      setActiveTextInputErrorText("Error message");
      setActiveTextInputLeftIcon(false);
      setActiveTextInputRightIcon(false);
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
      setActiveSelectShowDropdown(true);
    } else if (newComp === "multiselect") {
      setActiveMultiSelectSize(multiSelectDefault);
      setActiveMultiSelectRadius(multiSelectDefault);
      setActiveMultiSelectState("default");
      setActiveMultiSelectShowLabel(true);
      setActiveMultiSelectLabelText("Label");
      setActiveMultiSelectWithAsterisk(false);
      setActiveMultiSelectShowError(false);
      setActiveMultiSelectErrorText("Error message");
      setActiveMultiSelectSearchable(false);
      setActiveMultiSelectClearable(false);
      setActiveMultiSelectShowDropdown(true);
      setActiveVariant("default");
    } else if (newComp === "card") {
      setActiveCardSize(cardDefault);
      setActiveCardRadius(cardDefault);
      setActiveCardWithBorder(true);
      setActiveCardWithShadow(false);
      setActiveCardShowSection(true);
      setActiveCardState("default");
      setActiveCardTitle("PlanetScope vessel");
      setActiveCardDescription("Detected vessel metadata and imagery details from latest satellite capture.");
    } else if (newComp === "loader") {
      setActiveLoaderSize("default");
      setActiveLoaderType("oval");
    } else if (newComp === "progress") {
      setActiveVariant("default");
      setActiveProgressSize(progressHeightDefault);
      setActiveProgressRadius(progressRadiusDefault);
      setActiveProgressValue(60);
      setActiveProgressShowLabel(true);
    } else if (
      newComp === "chart" ||
      newComp === "chart-line" ||
      newComp === "chart-time-series" ||
      newComp === "chart-time-series-dual-axis" ||
      newComp === "chart-area" ||
      newComp === "chart-stacked-area" ||
      newComp === "chart-stacked-bar" ||
      newComp === "chart-combo" ||
      newComp === "chart-donut" ||
      newComp === "chart-radar" ||
      newComp === "chart-scatter" ||
      newComp === "chart-candlestick" ||
      newComp === "chart-sparkline" ||
      newComp === "chart-bar-horizontal" ||
      newComp === "chart-pie" ||
      newComp === "chart-funnel" ||
      newComp === "chart-radial"
    ) {
      const isStacked = newComp === "chart-stacked-bar";
      const isStackedArea = newComp === "chart-stacked-area";
      const isCombo = newComp === "chart-combo";
      const isDonut = newComp === "chart-donut";
      const isDualAxis = newComp === "chart-time-series-dual-axis";
      const isScatter = newComp === "chart-scatter";
      const isCandlestick = newComp === "chart-candlestick";
      const isSparkline = newComp === "chart-sparkline";
      const isHBar = newComp === "chart-bar-horizontal";
      const isPie = newComp === "chart-pie";
      const isFunnel = newComp === "chart-funnel";
      const isRadial = newComp === "chart-radial";
      setActiveVariant("default");
      setActiveChartSize(chartSizeDefault);
      setActiveSparklineStyle("line");
      // Stacked charts need distinctly-colored layers (shades by default); ranked
      // horizontal bars read well as a shade ramp; combo + dual-axis + scatter +
      // pie + funnel are palette charts; donut is multi-slice. Candlestick uses
      // fixed directional up/down colors (no color mode / series count).
      setActiveChartColorMode(isStacked || isStackedArea || isHBar ? "shades" : isCombo || isDonut || isPie || isFunnel || isRadial || isDualAxis || isScatter ? "palette" : "single");
      setActiveChartSeriesCount(isStacked || isStackedArea || isScatter ? 3 : isCombo || isDualAxis ? 2 : isDonut || isPie || isFunnel || isRadial ? 4 : 1);
      setActiveChartShowPoints(newComp !== "chart-area" && !isStackedArea && !isDonut && !isPie && !isFunnel && !isRadial);
      setActiveChartShowGrid(true);
      setActiveChartShowAxis(true);
      // Funnel shows values on each stage, so it defaults to no legend.
      setActiveChartShowLegend(isStacked || isStackedArea || isCombo || isDonut || isPie || isRadial || isDualAxis || isScatter || isCandlestick);
      setActiveChartShowRightAxis(false);
    } else if (newComp === "avatar") {
      setActiveVariant("filled");
      setActiveAvatarSize(avatarSizeDefault);
      setActiveAvatarRadius(avatarRadiusDefault);
      setActiveAvatarName("Alex Carter");
      setActiveAvatarSrc("https://picsum.photos/id/64/256/256");
      setActiveAvatarContent("initials");
      setActiveAvatarColor("default");
    } else if (newComp === "pill") {
      setActivePillSize(pillDefault);
      setActivePillWithRemoveButton(false);
      setActivePillText("React");
    } else if (newComp === "badge") {
      setActiveBadgeSize(badgeDefault);
      setActiveBadgeRadius(badgeDefault);
      setActiveBadgeCircle(false);
      setActiveBadgeFullWidth(false);
      setActiveBadgeWithRemoveButton(false);
      setActiveBadgeText("Badge");
      setActiveBadgeColor("default");
      setActiveVariant("default");
    } else if (newComp === "tooltip") {
      setActiveTooltipPosition("top");
      setActiveTooltipWithArrow(true);
    } else if (newComp === "popover") {
      setActivePopoverPosition("bottom");
      setActivePopoverWithArrow(true);
      setActivePopoverWidthSize("md");
      setActivePopoverRadiusSize("md");
      setActivePopoverBody("Additional context and actions can live here.");
    } else if (newComp === "menu") {
      setActiveMenuSize("default");
      setActiveMenuRadiusSize("default");
      setActiveMenuState("default");
      setActiveMenuWithSection(true);
      setActiveMenuWithIcons(true);
    } else if (newComp === "divider") {
      setActiveDividerSize("default");
      setActiveDividerOrientation("horizontal");
      setActiveDividerState("default");
      setActiveDividerInset(true);
    } else if (newComp === "list") {
      setActiveListSize("default");
      setActiveListType("unordered");
      setActiveListWithIcons(true);
      setActiveListWithPadding(false);
    } else if (newComp === "image") {
      setActiveImageSrc("https://picsum.photos/id/28/1200/800");
      setActiveImageAlt("Mountain landscape");
      setActiveImageFallbackSrc("https://placehold.co/1200x800/1A1B1E/C1C2C5?text=Image");
      setActiveImageSize(imageDefault);
      setActiveImageRadius(imageDefault);
      setActiveImageFit("cover");
    } else if (newComp === "skeleton") {
      setActiveSkeletonSize(skeletonDefault);
      setActiveSkeletonRadius(skeletonRadiusDefault);
      setActiveSkeletonCircle(false);
      setActiveSkeletonAnimate(true);
    } else if (newComp === "table") {
      setActiveVariant("default");
      setActiveTableShowRowHover(true);
    } else if (newComp === "calendar") {
      setActiveVariant("default");
      setActiveCalendarShowOutside(true);
    }
  }, [actionIconDefault, buttonDefault, tabsDefault, switchDefault, burgerDefault, segmentedControlDefault, sliderDefault, rangeSliderDefault, checkboxDefault, radioDefault, chipDefault, textInputDefault, selectDefault, multiSelectDefault, cardDefault, pillDefault, badgeDefault, modalDefault, imageDefault, skeletonDefault, skeletonRadiusDefault, anchorDefault, textDefault, progressHeightDefault, progressRadiusDefault, chartSizeDefault, avatarSizeDefault, avatarRadiusDefault, defaultBrandColor]);

  useEffect(() => {
    const allowedVariants = VARIANTS_BY_COMPONENT[activeComponent];
    if (!allowedVariants) return;
    if (!allowedVariants.includes(activeVariant)) {
      setActiveVariant(allowedVariants[0]);
    }
  }, [activeComponent, activeVariant]);

  useEffect(() => {
    if (activeComponent !== "badge") return;
    if (activeVariant !== "filled" && activeVariant !== "outline") {
      setActiveBadgeColor("default");
    }
  }, [activeComponent, activeVariant]);

  useEffect(() => {
    if (activeComponent !== "badge" || !activeColorToken?.startsWith("badge-")) return;
    const p = activeColorToken.split("-");
    if (p.length < 3) return;
    const v = p[1];
    if (!["default", "filled", "light", "outline"].includes(v)) return;
    let nextColor = "default";
    if ((v === "filled" || v === "outline") && p.length >= 4 && ["success", "warning", "error"].includes(p[2])) {
      nextColor = p[2];
    }
    if (v !== activeVariant) setActiveVariant(v);
    if (v === "filled" || v === "outline") {
      setActiveBadgeColor(nextColor);
    } else {
      setActiveBadgeColor("default");
    }
  }, [activeComponent, activeColorToken]);

  useEffect(() => {
    if (activeComponent !== "alert" || !activeColorToken?.startsWith("alert-")) return;
    const p = activeColorToken.split("-");
    if (p.length < 4) return;
    const v = p[1];
    if (!["default", "filled", "outline"].includes(v)) return;
    if (!["info", "success", "warning", "error"].includes(p[2])) return;
    if (v !== activeVariant) setActiveVariant(v);
    if (p[2] !== activeAlertColor) setActiveAlertColor(p[2]);
  }, [activeComponent, activeColorToken]);

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

  const upsertBrandGradient = useCallback((id, def) => {
    const key = String(id || "").trim();
    if (!key) return;
    setBrands((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const b = next[activeBrand];
      if (!b.gradients) b.gradients = {};
      b.gradients[key] = def;
      return next;
    });
  }, [activeBrand]);

  const removeBrandGradient = useCallback((id) => {
    setBrands((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[activeBrand]?.gradients?.[id]) return prev;
      delete next[activeBrand].gradients[id];
      return next;
    });
    setButtonFillGradientId((cur) => (cur === id ? null : cur));
  }, [activeBrand]);

  const updateComponentOverride = useCallback(
    (componentToken, mapping) => {
      setBrands((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        const brand = next[activeBrand];
        if (!brand.componentOverrides) brand.componentOverrides = {};
        if (!brand.componentOverridesDark) brand.componentOverridesDark = {};
        if (previewTheme === "dark") {
          brand.componentOverridesDark[componentToken] = mapping;
        } else {
          brand.componentOverrides[componentToken] = mapping;
        }
        return next;
      });
    },
    [activeBrand, previewTheme]
  );

  const updateSemanticMapping = useCallback(
    (semanticKey, partial) => {
      setBrands((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        const b = next[activeBrand];
        if (!b) return prev;
        if (!b.semanticMap) b.semanticMap = {};
        if (!b.darkSemanticOverrides) b.darkSemanticOverrides = {};
        const mapKey = previewTheme === "dark" ? "darkSemanticOverrides" : "semanticMap";
        const merged =
          previewTheme === "dark"
            ? mergeDarkSemanticsForBrand(b)
            : mergeLightSemanticsForBrand(b);
        // Start from the effective mapping (explicit override or starter default)
        // so changing only color or only index keeps the other field intact.
        const current = b[mapKey][semanticKey] || merged[semanticKey] || { color: "neutral", index: 0 };
        b[mapKey][semanticKey] = { ...current, ...partial };
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
      const trimmed = String(name || "").trim();
      if (!trimmed) return;
      const existingIds = Object.keys(brands);
      const { id, brand } = createNewBrand(trimmed, existingIds);
      setBrands((prev) => ({
        ...prev,
        [id]: brand,
      }));
      setActiveBrand(id);
    },
    [brands]
  );

  const openBrandDeleteModal = useCallback(() => {
    const ids = Object.keys(brands);
    if (ids.length <= 1) return;
    const id = activeBrand;
    if (!brands[id]) return;
    setBrandDeleteTargetId(id);
    setBrandDeleteConfirmInput("");
    setBrandDeleteModalOpened(true);
  }, [activeBrand, brands]);

  const closeBrandDeleteModal = useCallback(() => {
    setBrandDeleteModalOpened(false);
    setBrandDeleteTargetId(null);
    setBrandDeleteConfirmInput("");
  }, []);

  const brandDeleteExpectedName =
    brandDeleteTargetId && brands[brandDeleteTargetId]
      ? String(brands[brandDeleteTargetId].name || brandDeleteTargetId).trim()
      : "";

  const canSubmitBrandDelete =
    Boolean(brandDeleteTargetId) &&
    Object.keys(brands).length > 1 &&
    brandDeleteConfirmInput.trim() === brandDeleteExpectedName;

  const executeBrandDelete = useCallback(() => {
    if (!brandDeleteTargetId) return;
    const expected = String(brands[brandDeleteTargetId]?.name || brandDeleteTargetId).trim();
    if (brandDeleteConfirmInput.trim() !== expected) return;
    if (Object.keys(brands).length <= 1) return;
    const id = brandDeleteTargetId;
    const remainingAfter = Object.keys(brands).filter((k) => k !== id);
    setBrands((prev) => {
      const keys = Object.keys(prev);
      if (keys.length <= 1 || !prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    closeBrandDeleteModal();
    if (activeBrand === id) {
      const fallbackBrand = remainingAfter.includes("theia") ? "theia" : remainingAfter[0];
      if (fallbackBrand) handleBrandChange(fallbackBrand);
    }
  }, [
    activeBrand,
    brandDeleteTargetId,
    brandDeleteConfirmInput,
    brands,
    closeBrandDeleteModal,
    handleBrandChange,
  ]);

  const countPaletteReferences = useCallback((brandData, paletteName) => {
    if (!brandData || !paletteName) return { semantic: 0, component: 0, total: 0 };
    let semantic = 0;
    let component = 0;
    Object.values(brandData.semanticMap || {}).forEach((mapping) => {
      if (mapping && mapping.color === paletteName) semantic += 1;
    });
    Object.values(brandData.darkSemanticOverrides || {}).forEach((mapping) => {
      if (mapping && mapping.color === paletteName) semantic += 1;
    });
    Object.values(brandData.componentOverrides || {}).forEach((mapping) => {
      if (mapping && mapping.color === paletteName) component += 1;
    });
    Object.values(brandData.componentOverridesDark || {}).forEach((mapping) => {
      if (mapping && mapping.color === paletteName) component += 1;
    });
    return { semantic, component, total: semantic + component };
  }, []);

  const openPaletteDeleteModal = useCallback((paletteName) => {
    if (!paletteName) return;
    setPaletteDeleteTargetName(String(paletteName));
    setPaletteDeleteConfirmInput("");
    setPaletteDeleteModalOpened(true);
  }, []);

  const closePaletteDeleteModal = useCallback(() => {
    setPaletteDeleteModalOpened(false);
    setPaletteDeleteTargetName("");
    setPaletteDeleteConfirmInput("");
  }, []);

  const canSubmitPaletteDelete =
    Boolean(paletteDeleteTargetName) &&
    paletteDeleteConfirmInput.trim().toLowerCase() === String(paletteDeleteTargetName).trim().toLowerCase();

  const executePaletteDelete = useCallback(() => {
    const target = String(paletteDeleteTargetName || "").trim();
    if (!target) return;
    if (paletteDeleteConfirmInput.trim().toLowerCase() !== target.toLowerCase()) return;
    setBrands((prev) => {
      const brandData = prev[activeBrand];
      if (!brandData || !brandData.primitives || !brandData.primitives[target]) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      const nextBrand = next[activeBrand];
      delete nextBrand.primitives[target];

      const initialBrand = INITIAL_BRANDS[activeBrand] || {};
      const fallbackStarter = BRAND_STARTER_SEMANTIC_MAP || {};

      const resetSemanticEntry = (mapObj, semanticKey, darkMode) => {
        if (!mapObj || !mapObj[semanticKey]) return;
        const fallback =
          (darkMode
            ? initialBrand.darkSemanticOverrides?.[semanticKey]
            : initialBrand.semanticMap?.[semanticKey]) ||
          initialBrand.semanticMap?.[semanticKey] ||
          fallbackStarter[semanticKey] ||
          null;
        if (fallback) {
          mapObj[semanticKey] = { ...fallback };
        } else {
          delete mapObj[semanticKey];
        }
      };

      Object.keys(nextBrand.semanticMap || {}).forEach((semanticKey) => {
        const mapping = nextBrand.semanticMap?.[semanticKey];
        if (mapping && mapping.color === target) {
          resetSemanticEntry(nextBrand.semanticMap, semanticKey, false);
        }
      });

      Object.keys(nextBrand.darkSemanticOverrides || {}).forEach((semanticKey) => {
        const mapping = nextBrand.darkSemanticOverrides?.[semanticKey];
        if (mapping && mapping.color === target) {
          resetSemanticEntry(nextBrand.darkSemanticOverrides, semanticKey, true);
        }
      });

      ["componentOverrides", "componentOverridesDark"].forEach((bucket) => {
        const overrideMap = nextBrand[bucket] || {};
        Object.keys(overrideMap).forEach((tokenKey) => {
          const mapping = overrideMap[tokenKey];
          if (mapping && mapping.color === target) {
            delete overrideMap[tokenKey];
          }
        });
      });

      return next;
    });
    closePaletteDeleteModal();
  }, [activeBrand, closePaletteDeleteModal, paletteDeleteConfirmInput, paletteDeleteTargetName]);

  const paletteDeleteUsageSummary = countPaletteReferences(brand, paletteDeleteTargetName);

  const brandNames = Object.keys(brands);
  const allColorTokens = getColorTokens(activeComponent);
  // Charts expose two mutually-exclusive color sets: the series palette
  // (single/palette modes) and the dedicated shade ramp (shades mode). Only show
  // the set that the active color mode actually drives so the panel aligns with
  // what the chart renders.
  const isChartComponent = CHART_COMPONENTS.includes(activeComponent);
  const colorTokens = isChartComponent
    ? Object.fromEntries(
        Object.entries(allColorTokens).filter(([name]) => {
          // The translucent palettes track their solid counterparts: series(+opacity)
          // show in single/palette, shade(+shade-opacity) show in shades mode.
          const isShadeToken = /^chart-shade(?:-opacity)?-\d+$/.test(name);
          const isSeriesToken = /^chart-series(?:-opacity)?-\d+$/.test(name);
          if (activeChartColorMode === "shades") return !isSeriesToken;
          return !isShadeToken;
        })
      )
    : allColorTokens;
  const dimensionTokens = getDimensionTokens(activeComponent);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stateObj = { brands, activeBrand, previewTheme, savedAt: Date.now() };
    let payload;
    try {
      payload = JSON.stringify(stateObj);
    } catch (err) {
      // A non-serializable value snuck into brands — this would otherwise drop
      // the entire save (and every edit with it) silently.
      console.error("[DSG] Could not serialize app state for persistence:", err);
      setStorageError("Your changes could not be saved (data could not be serialized). Export your brands to back them up.");
      return;
    }
    try {
      window.localStorage.setItem(APP_STORAGE_KEY, payload);
      // Verify the write actually landed; some browsers (private mode, blocked
      // storage) accept setItem but persist nothing.
      const readback = window.localStorage.getItem(APP_STORAGE_KEY);
      if (readback !== payload) {
        throw new Error("localStorage readback mismatch");
      }
      setStorageError((cur) => (cur ? null : cur));
    } catch (err) {
      console.error("[DSG] Failed to persist app state:", err);
      setStorageError(
        "Your changes are NOT being saved to this browser. Likely causes: the app is open in another tab, private/incognito mode, or storage is blocked/full. Export your brands now to avoid losing work."
      );
    }
    // Durable disk autosave (debounced). Gated until the initial disk load has
    // run so stale startup state can't overwrite newer on-disk data.
    if (diskLoadedRef.current) {
      if (diskSaveTimerRef.current) clearTimeout(diskSaveTimerRef.current);
      diskSaveTimerRef.current = setTimeout(() => postBrandsToDisk(stateObj), 600);
    }
  }, [brands, activeBrand, previewTheme]);

  // On startup, restore from the on-disk autosave when it's newer than (or
  // localStorage is empty for) this origin. This is what makes colors survive a
  // port change or browser clear — the disk file is origin-independent.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    (async () => {
      let adopted = false;
      try {
        const res = await fetch(`${RELAY_HTTP}/api/brands`);
        const data = res.ok ? await res.json() : null;
        if (!cancelled && data && !data.missing && data.brands && typeof data.brands === "object") {
          const localAt = initialLocalRef.current.savedAt;
          const localHasBrands = initialLocalRef.current.hasBrands;
          const diskAt = Number(data.savedAt || 0);
          if (!localHasBrands || diskAt >= localAt) {
            adopted = true;
            setBrands(enforceTextDefaultMappings(mergeRecoveredBrands(data.brands)));
            if (data.activeBrand) setActiveBrand(data.activeBrand);
            if (data.previewTheme === "light" || data.previewTheme === "dark") {
              setPreviewTheme(data.previewTheme);
            }
          }
        }
      } catch (_err) {
        // Relay offline — localStorage remains the source of truth.
      } finally {
        if (!cancelled) {
          diskLoadedRef.current = true;
          // If we didn't adopt disk state, flush the current (localStorage)
          // state to disk so the file exists and stays current. When we DID
          // adopt, the resulting setBrands re-render triggers the save effect,
          // which posts the adopted state.
          if (!adopted) {
            postBrandsToDisk({ brands, activeBrand, previewTheme, savedAt: Date.now() });
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep multiple open tabs in sync. Without this, a stale second tab will
  // overwrite a fresh tab's saved edits on its next write, which looks exactly
  // like "my colors keep resetting" across random brands.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e) => {
      if (e.key !== APP_STORAGE_KEY || e.newValue == null) return;
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed && parsed.brands && typeof parsed.brands === "object") {
          setBrands(enforceTextDefaultMappings(mergeRecoveredBrands(parsed.brands)));
        }
      } catch (_err) {
        // Ignore malformed cross-tab payloads.
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!buttonFillGradientId || !brand?.gradients) return;
    if (!Object.prototype.hasOwnProperty.call(brand.gradients, buttonFillGradientId)) {
      setButtonFillGradientId(null);
    }
  }, [activeBrand, brand, buttonFillGradientId]);

  useEffect(() => {
    if (brands[activeBrand]) return;
    const firstBrandId = Object.keys(brands)[0];
    if (firstBrandId) {
      setActiveBrand(firstBrandId);
    }
  }, [brands, activeBrand]);

  // Parse forced state/checked/variant from the active token card
  const INTERACTIVE_STATES = ["active", "hover", "focus", "pressed", "disabled", "error", "visited"];
  const mapTabsTokenVariant = (variantName) => variantName;
  const fromTabsTokenVariant = (variantName) => variantName;
  let forcedState = null;
  let forcedChecked = null;
  let forcedIndeterminate = false;
  let forcedVariant = null;
  let forcedButtonColor = null;

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

    if (["button", "actionicon", "tabs", "accordion", "checkbox", "chip", "badge", "alert", "radio", "textinput", "select", "multiselect", "card", "modal"].includes(activeComponent)) {
      const variantSegment = parts[1];
      const knownVariants = {
        button: ["filled", "outlined", "ghost"],
        actionicon: ["default", "filled", "light", "outlined", "transparent"],
        tabs: ["default", "outlined", "pills"],
        accordion: ["default", "contained", "filled"],
        checkbox: ["filled", "outlined"],
        chip: ["filled", "light", "outline"],
        badge: ["default", "filled", "light", "outline"],
        card: ["default", "dark", "outlined", "brand", "transparent"],
        alert: ["default", "filled", "light", "outline", "transparent", "white"],
        radio: ["filled", "outline"],
        textinput: ["default", "filled"],
        select: ["default", "filled"],
        multiselect: ["default", "filled"],
        modal: ["default", "filled"],
      };
      if (knownVariants[activeComponent]?.includes(variantSegment)) {
        forcedVariant = activeComponent === "tabs" ? fromTabsTokenVariant(variantSegment) : variantSegment;
      }
    }
    if (activeComponent === "button") {
      forcedButtonColor = parts[2] === "error" ? "error" : "primary";
    }
  }

  const activeTabsTokenVariant = mapTabsTokenVariant(activeVariant);

  const effectiveComponentState =
    activeComponent === "button"
      ? forcedState || activeButtonState
      : activeComponent === "actionicon"
        ? forcedState || activeActionIconState
        : activeComponent === "tabs"
          ? forcedState || activeTabsState
        : activeComponent === "accordion"
          ? forcedState || activeAccordionState
        : activeComponent === "switch"
          ? forcedState || activeSwitchState
          : activeComponent === "burger"
          ? forcedState || activeBurgerState
          : activeComponent === "segmentedcontrol"
          ? forcedState || activeSegmentedControlState
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
          : activeComponent === "card"
            ? forcedState || activeCardState
          : activeComponent === "textinput"
            ? forcedState || activeTextInputState
          : activeComponent === "select"
            ? forcedState || activeSelectState
          : activeComponent === "multiselect"
            ? forcedState || activeMultiSelectState
          : activeComponent === "menu"
            ? forcedState || activeMenuState
          : forcedState;

  const visibleColorTokenEntries = Object.entries(colorTokens).filter(([token, def]) => {
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
      const isTrackBorderToken = parts[1] === "track" && parts[2] === "border";
      const isCheckedToken = parts.includes("checked");

      if (isTrackBackgroundToken || isTrackBorderToken) {
        return isCheckedToken === Boolean(targetChecked);
      }
      return !isCheckedToken || Boolean(targetChecked);
    }

    if (activeComponent === "burger") {
      if (token === "burger-focus-ring") return true;

      const tokenState = INTERACTIVE_STATES.includes(parts[parts.length - 1])
        ? parts[parts.length - 1]
        : "default";
      const targetState = effectiveComponentState || "default";
      return tokenState === targetState;
    }

    if (activeComponent === "avatar") {
      const isBaseColorToken =
        token === "avatar-background" || token === "avatar-border" || token === "avatar-text";
      // When a palette color is selected, show only that color's tokens.
      if (activeAvatarColor && activeAvatarColor !== "default") {
        return (
          def.paletteGate === activeAvatarColor &&
          availableAvatarColors(brands, activeBrand).includes(def.paletteGate)
        );
      }
      // Default color: show only the neutral base tokens.
      return isBaseColorToken;
    }

    if (activeComponent === "segmentedcontrol") {
      const targetState = effectiveComponentState || "default";
      const last = parts[parts.length - 1];
      const tokenState = ["hover", "active", "disabled"].includes(last) ? last : "default";
      if (targetState === "disabled") {
        return tokenState === "disabled" || token === "segmentedcontrol-label-text-active";
      }
      if (tokenState === "disabled") return false;
      if (tokenState === "active") return true;
      if (tokenState === "hover") return targetState === "hover";
      return true;
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
        const wantsChecked = Boolean(targetChecked);
        if (isCheckedToken === wantsChecked) return true;
        // Radio filled border/background currently has no checked-specific border tokens.
        // Keep base variant tokens visible when checked-specific token is missing.
        if (wantsChecked && !isCheckedToken) {
          const tokenStateSuffix = tokenState === "default" ? "" : `-${tokenState}`;
          const baseToken = tokenState === "default" ? token : token.replace(new RegExp(`${tokenStateSuffix}$`), "");
          const checkedToken = `${baseToken}-checked${tokenStateSuffix}`;
          return !Boolean(colorTokens[checkedToken]);
        }
        return false;
      }

  if (variantSegment === "background" || variantSegment === "border") {
        return false;
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
      const hasCheckedCounterpart = (baseToken, tokenStateSuffix) => {
        const suffixStyleMatch = `${baseToken}-checked${tokenStateSuffix}`;
        if (Boolean(colorTokens[suffixStyleMatch])) return true;
        if (baseToken.startsWith("chip-")) {
          const baseWithoutPrefix = baseToken.slice("chip-".length);
          const variantStyleMatch = `chip-${activeVariant}-${baseWithoutPrefix}-checked${tokenStateSuffix}`;
          if (Boolean(colorTokens[variantStyleMatch])) return true;
          const prefixStyleMatch = `chip-checked-${baseWithoutPrefix}${tokenStateSuffix}`;
          if (Boolean(colorTokens[prefixStyleMatch])) return true;
        }
        return false;
      };
      const hasVariantUncheckedCounterpart = (baseToken, tokenStateSuffix) => {
        if (!baseToken.startsWith("chip-")) return false;
        const baseWithoutPrefix = baseToken.slice("chip-".length);
        const variantStyleMatch = `chip-${activeVariant}-${baseWithoutPrefix}${tokenStateSuffix}`;
        return Boolean(colorTokens[variantStyleMatch]);
      };

      if (isVariantToken) {
        if (variantSegment !== activeVariant) return false;
        if (!targetChecked && isCheckedToken) return false;
        if (targetChecked && !isCheckedToken) {
          const tokenStateSuffix = tokenState === "default" ? "" : `-${tokenState}`;
          const baseToken = tokenState === "default" ? token : token.replace(new RegExp(`${tokenStateSuffix}$`), "");
          // Keep base token only when no checked-specific token exists.
          return !hasCheckedCounterpart(baseToken, tokenStateSuffix);
        }
        return true;
      }
      if (!targetChecked && isCheckedToken) return false;
      if (!targetChecked && !isCheckedToken) {
        const tokenStateSuffix = tokenState === "default" ? "" : `-${tokenState}`;
        const baseToken = tokenState === "default" ? token : token.replace(new RegExp(`${tokenStateSuffix}$`), "");
        if (
          baseToken.startsWith("chip-border") ||
          baseToken.startsWith("chip-background") ||
          baseToken.startsWith("chip-text")
        ) {
          // Hide shared unchecked token when variant-specific unchecked token exists.
          return !hasVariantUncheckedCounterpart(baseToken, tokenStateSuffix);
        }
      }
      if (targetChecked && !isCheckedToken) {
        const tokenStateSuffix = tokenState === "default" ? "" : `-${tokenState}`;
        const baseToken = tokenState === "default" ? token : token.replace(new RegExp(`${tokenStateSuffix}$`), "");
        // Keep base token only when no checked-specific token exists.
        return !hasCheckedCounterpart(baseToken, tokenStateSuffix);
      }
      return true;
    }

    if (activeComponent === "card") {
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
      const cardVariants = ["default", "dark", "outlined", "brand", "transparent"];
      if (!cardVariants.includes(variantSegment)) return true;
      return variantSegment === activeVariant;
    }

    if (activeComponent === "badge") {
      const vSeg = parts[1];
      if (vSeg !== activeVariant) return false;
      const isSemanticTone = parts.length === 4 && ["success", "warning", "error"].includes(parts[2]);
      const isNeutralTriplet =
        parts.length === 3 && ["background", "text", "border"].includes(parts[2]);
      if (vSeg === "filled" || vSeg === "outline") {
        if (isSemanticTone) return parts[2] === activeBadgeColor;
        if (isNeutralTriplet) return activeBadgeColor === "default";
        return false;
      }
      if (vSeg === "default" || vSeg === "light") {
        return isNeutralTriplet;
      }
      return false;
    }

    if (activeComponent === "alert") {
      const vSeg = parts[1];
      if (vSeg !== activeVariant) return false;
      // Only the active status's per-status tokens are editable (background,
      // text, border, icon, close). The generic variant tokens are superseded.
      const isStatusToken =
        parts.length === 4 &&
        ["info", "success", "warning", "error"].includes(parts[2]);
      return isStatusToken && parts[2] === activeAlertColor;
    }

    if (activeComponent === "textinput" && token.startsWith("textinput-error-")) {
      return (effectiveComponentState || "default") === "error";
    }

    if (activeComponent === "menu" && token.endsWith("-disabled")) {
      return (effectiveComponentState || "default") === "disabled";
    }
    if (activeComponent === "menu" && token.endsWith("-hover")) {
      return (effectiveComponentState || "default") === "hover";
    }

    if (activeComponent === "select" || activeComponent === "multiselect") {
      const cp = activeComponent;
      const targetState = effectiveComponentState || "default";
      if (
        token === `${cp}-default-placeholder` ||
        token === `${cp}-filled-placeholder`
      ) {
        return targetState !== "error";
      }
      if (
        token === `${cp}-error-color` ||
        token === `${cp}-icon-error` ||
        token === `${cp}-placeholder-error` ||
        token === `${cp}-default-placeholder-error` ||
        token === `${cp}-filled-placeholder-error`
      ) {
        return targetState === "error";
      }
      if (token === `${cp}-icon-disabled`) {
        return targetState === "disabled";
      }
      if (token === `${cp}-icon` && (targetState === "error" || targetState === "disabled")) {
        return false;
      }
      if (
        token === `${cp}-pill-background-error` ||
        token === `${cp}-pill-text-error` ||
        token === `${cp}-pill-remove-icon-error`
      ) {
        return targetState === "error";
      }
      if (
        token === `${cp}-pill-background-disabled` ||
        token === `${cp}-pill-text-disabled` ||
        token === `${cp}-pill-remove-icon-disabled`
      ) {
        return targetState === "disabled";
      }
      if (
        token === `${cp}-default-pill-background` ||
        token === `${cp}-filled-pill-background`
      ) {
        const pillVariant = token.split("-")[1];
        return (
          pillVariant === activeVariant &&
          targetState !== "error" &&
          targetState !== "disabled"
        );
      }
      if (
        token === `${cp}-pill-text` ||
        token === `${cp}-pill-remove-icon`
      ) {
        return targetState !== "error" && targetState !== "disabled";
      }
    }

    const variantsByComponent = {
      button: ["filled", "outlined", "ghost"],
      actionicon: ["default", "filled", "light", "outlined", "transparent"],
      tabs: ["default", "outlined", "pills"],
      accordion: ["default", "contained", "filled"],
      checkbox: ["filled", "outlined"],
      radio: ["filled", "outline"],
      chip: ["filled", "light", "outline"],
      badge: ["default", "filled", "light", "outline"],
      card: ["default", "dark", "outlined", "brand", "transparent"],
      alert: ["default", "filled", "light", "outline", "transparent", "white"],
      textinput: ["default", "filled"],
      select: ["default", "filled"],
      multiselect: ["default", "filled"],
      modal: ["default", "filled"],
    };
    const variants = variantsByComponent[activeComponent];

    if (!variants) return true;
    if (activeComponent === "checkbox") {
      // Preview now relies on filled/outlined checkbox backgrounds only.
      // Keep shared tokens for icon/label/focus but hide legacy `checkbox-background*`.
      if (variantSegment === "background") return false;
      const checkboxSharedSegments = ["icon", "label", "focus"];
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
        if (parts[2] === "icon") return isCheckedLike;
        if (isCheckedToken) return isCheckedLike;
        if (parts[2] === "background" || parts[2] === "border") return !isCheckedLike;
        return true;
      }

      if (!checkboxSharedSegments.includes(variantSegment)) return false;
      if (tokenState !== targetState) {
        const canUseDefaultFallback =
          tokenState === "default" &&
          targetState !== "default" &&
          !Boolean(colorTokens[`${token}-${targetState}`]);
        if (!canUseDefaultFallback) return false;
      }
      if (variantSegment === "background") {
        return isCheckedToken === isCheckedLike;
      }
      if (variantSegment === "icon") {
        return isCheckedLike;
      }
      return true;
    }
    if (activeComponent === "button") {
      if (token === "button-focus-ring") return true;
      if (!variants.includes(variantSegment)) return true;
      if (variantSegment !== (forcedVariant || activeVariant)) return false;
      const tokenColor = parts[2] === "error" ? "error" : "primary";
      const selectedColor = forcedButtonColor || activeButtonColor;
      if (tokenColor !== selectedColor) return false;
      const tokenState = INTERACTIVE_STATES.includes(parts[parts.length - 1])
        ? parts[parts.length - 1]
        : "default";
      return tokenState === (effectiveComponentState || "default");
    }
    if (
      activeComponent === "actionicon" ||
      activeComponent === "tabs" ||
      activeComponent === "accordion" ||
      activeComponent === "textinput"
      || activeComponent === "select"
      || activeComponent === "multiselect"
      || activeComponent === "alert"
    ) {
      if (!variants.includes(variantSegment)) return true;
      if (activeComponent === "tabs") {
        if (variantSegment !== activeTabsTokenVariant) return false;
      } else if (activeComponent === "accordion") {
        if (variantSegment !== activeAccordionVariant) return false;
      } else if (variantSegment !== activeVariant) {
        return false;
      }
      const tokenState = INTERACTIVE_STATES.includes(parts[parts.length - 1])
        ? parts[parts.length - 1]
        : "default";
      const targetState = effectiveComponentState || "default";
      if (tokenState === targetState) return true;
      if (activeComponent === "accordion" && tokenState === "default") {
        return !Boolean(colorTokens[`${token}-${targetState}`]);
      }
      return false;
    }

    // Keep shared component tokens and only active variant tokens.
    if (!variants.includes(variantSegment)) return true;
    return variantSegment === activeVariant;
  });

  const visibleDimensionTokenEntries = Object.entries(dimensionTokens).filter(([token]) => {
    if (activeComponent === "textinput" && token.startsWith("textinput-error-")) {
      return (effectiveComponentState || "default") === "error";
    }
    if (activeComponent === "modal") {
      // Spacing/typography/border-width are per-variant; width, radius,
      // overlay-opacity, and close-icon-stroke-width are shared across variants.
      const variantMatch = token.match(/^modal-(default|filled)-/);
      if (variantMatch) return variantMatch[1] === activeVariant;
      return true;
    }
    if (activeComponent === "chip") {
      const variantRadiusMatch = token.match(/^chip-(filled|outline|light)-radius$/);
      if (variantRadiusMatch) return activeChipRadius === "default" && variantRadiusMatch[1] === activeVariant;
      if (token === "chip-radius" && activeChipRadius === "default") {
        return !Boolean(dimensionTokens[`chip-${activeVariant}-radius`]);
      }
      return true;
    }
    if (activeComponent === "select" || activeComponent === "multiselect") {
      const cp = activeComponent;
      const targetState = effectiveComponentState || "default";
      if (token.startsWith(`${cp}-error-`)) return targetState === "error";
      const defaultPadMatch = token.match(new RegExp(`^${cp}-default-padding-(x|y)$`));
      if (defaultPadMatch) return activeVariant === "default";
      const filledPadMatch = token.match(new RegExp(`^${cp}-filled-padding-(x|y)$`));
      if (filledPadMatch) return activeVariant === "filled";
      const variantFontMatch = token.match(new RegExp(`^${cp}-(default|filled)-font-(family|weight)$`));
      if (variantFontMatch) return variantFontMatch[1] === activeVariant;
      const radiusMatch = token.match(new RegExp(`^${cp}-radius-(default|xs|sm|md|lg|xl)$`));
      if (radiusMatch) {
        if (activeVariant === "default") return radiusMatch[1] === "default";
        return true;
      }
      return true;
    }
    if (activeComponent !== "tabs") return true;
    if (activeVariant === "default") {
      if (/^tabs-(default|outlined|pills)-radius$/.test(token)) return false;
    }
    const radiusMatch = token.match(/^tabs-(default|outlined|pills)-radius$/);
    if (radiusMatch) return radiusMatch[1] === activeTabsTokenVariant;
    const listPaddingMatch = token.match(/^tabs-(default|pills)-list-padding$/);
    if (listPaddingMatch) return listPaddingMatch[1] === activeTabsTokenVariant;
    const tabPadXMatch = token.match(/^tabs-(default|outlined|pills)-tab-padding-x$/);
    if (tabPadXMatch) return tabPadXMatch[1] === activeTabsTokenVariant;
    const tabPadYMatch = token.match(/^tabs-(default|outlined|pills)-tab-padding-y$/);
    if (tabPadYMatch) return tabPadYMatch[1] === activeTabsTokenVariant;
    const overflowPadMatch = token.match(/^tabs-outlined-overflow-control-padding-(x|y)$/);
    if (overflowPadMatch) return activeTabsTokenVariant === "outlined";
    const match = token.match(/^tabs-(default|outlined|pills)-list-gap$/);
    if (!match) return true;
    return match[1] === activeTabsTokenVariant;
  });

  useEffect(() => {
    if (!activeColorToken) return;
    const parts = activeColorToken.split("-");
    if (activeComponent === "select" || activeComponent === "multiselect") {
      const cp = activeComponent;
      const targetState = effectiveComponentState || "default";
      if (
        (activeColorToken === `${cp}-default-placeholder` ||
          activeColorToken === `${cp}-filled-placeholder`) &&
        targetState === "error"
      ) {
        setActiveColorToken(null);
        return;
      }
      if (
        (activeColorToken === `${cp}-placeholder-error` ||
          activeColorToken === `${cp}-default-placeholder-error` ||
          activeColorToken === `${cp}-filled-placeholder-error`) &&
        targetState !== "error"
      ) {
        setActiveColorToken(null);
        return;
      }
      if (
        (activeColorToken === `${cp}-pill-background-error` ||
          activeColorToken === `${cp}-pill-text-error` ||
          activeColorToken === `${cp}-pill-remove-icon-error`) &&
        targetState !== "error"
      ) {
        setActiveColorToken(null);
        return;
      }
      if (
        (activeColorToken === `${cp}-pill-background-disabled` ||
          activeColorToken === `${cp}-pill-text-disabled` ||
          activeColorToken === `${cp}-pill-remove-icon-disabled`) &&
        targetState !== "disabled"
      ) {
        setActiveColorToken(null);
        return;
      }
      if (
        (activeColorToken === `${cp}-default-pill-background` ||
          activeColorToken === `${cp}-filled-pill-background` ||
          activeColorToken === `${cp}-pill-text` ||
          activeColorToken === `${cp}-pill-remove-icon`) &&
        (targetState === "error" || targetState === "disabled")
      ) {
        setActiveColorToken(null);
        return;
      }
    }
    const variantSegment = parts[1];
    const variantsByComponent = {
      button: ["filled", "outlined", "ghost"],
      actionicon: ["default", "filled", "light", "outlined", "transparent"],
      tabs: ["default", "outlined", "pills"],
      checkbox: ["filled", "outlined"],
      radio: ["filled", "outline"],
      badge: ["default", "filled", "light", "outline"],
      card: ["default", "dark", "outlined", "brand", "transparent"],
      alert: ["default", "filled", "light", "outline", "transparent", "white"],
      textinput: ["default", "filled"],
      select: ["default", "filled"],
      multiselect: ["default", "filled"],
    };
    const variants = variantsByComponent[activeComponent];
    if (!variants) return;
    const expectedVariantSegment =
      activeComponent === "tabs"
        ? activeTabsTokenVariant
        : activeComponent === "accordion"
          ? activeAccordionVariant
          : activeVariant;
    if (variants.includes(variantSegment) && variantSegment !== expectedVariantSegment) {
      setActiveColorToken(null);
    }
    // Clear when the selected alert token belongs to a different status.
    if (activeComponent === "alert") {
      const p = activeColorToken.split("-");
      const isStatusToken =
        p.length === 4 && ["info", "success", "warning", "error"].includes(p[2]);
      if (isStatusToken && p[2] !== activeAlertColor) {
        setActiveColorToken(null);
      }
    }
  }, [activeAccordionVariant, activeAlertColor, activeComponent, activeColorToken, activeVariant, activeTabsTokenVariant, effectiveComponentState]);

  useEffect(() => {
    if (!activeDimensionToken) return;
    if (activeComponent === "badge") {
      const badgeRadiusMatch = activeDimensionToken.match(/^badge-radius-(default|xs|sm|md|lg|xl)$/);
      if (badgeRadiusMatch && badgeRadiusMatch[1] !== activeBadgeRadius) {
        setActiveBadgeRadius(badgeRadiusMatch[1]);
      }
      return;
    }
    if (activeComponent === "progress") {
      const progressRadiusMatch = activeDimensionToken.match(
        /^progress-radius-(default|xs|sm|md|lg|xl)$/,
      );
      if (progressRadiusMatch && progressRadiusMatch[1] !== activeProgressRadius) {
        setActiveProgressRadius(progressRadiusMatch[1]);
      }
      return;
    }
    if (activeComponent === "avatar") {
      const avatarRadiusMatch = activeDimensionToken.match(/^avatar-radius-(default|xs|sm|md|lg|xl)$/);
      if (avatarRadiusMatch && avatarRadiusMatch[1] !== activeAvatarRadius) {
        setActiveAvatarRadius(avatarRadiusMatch[1]);
      }
      return;
    }
    if (activeComponent === "chip") {
      const chipVariantRadiusMatch = activeDimensionToken.match(/^chip-(filled|outline|light)-radius$/);
      if (chipVariantRadiusMatch) {
        if (activeChipRadius !== "default" || chipVariantRadiusMatch[1] !== activeVariant) {
          setActiveDimensionToken(null);
        }
        return;
      }
      if (
        activeChipRadius === "default" &&
        activeDimensionToken === "chip-radius" &&
        dimensionTokens[`chip-${activeVariant}-radius`]
      ) {
        setActiveDimensionToken(null);
      }
      return;
    }
    if (activeComponent === "select" || activeComponent === "multiselect") {
      const cp = activeComponent;
      const targetState = effectiveComponentState || "default";
      if (activeDimensionToken.startsWith(`${cp}-error-`) && targetState !== "error") {
        setActiveDimensionToken(null);
        return;
      }
      const variantDimensionMatch = activeDimensionToken.match(
        new RegExp(`^${cp}-(default|filled)-(padding-(x|y)|font-(family|weight))$`),
      );
      if (variantDimensionMatch && variantDimensionMatch[1] !== activeVariant) {
        setActiveDimensionToken(null);
        return;
      }
      if (
        activeVariant === "default" &&
        new RegExp(`^${cp}-radius-(xs|sm|md|lg|xl)$`).test(activeDimensionToken)
      ) {
        setActiveDimensionToken(null);
      }
      return;
    }
    if (activeComponent !== "tabs") return;
    if (
      activeVariant === "default" &&
      /^tabs-(default|outlined|pills)-radius$/.test(activeDimensionToken)
    ) {
      setActiveDimensionToken(null);
      return;
    }
    const match = activeDimensionToken.match(
      /^tabs-(default|outlined|pills)-(list-gap|list-padding|tab-padding-x|tab-padding-y|radius)$|^tabs-outlined-overflow-control-padding-(x|y)$/,
    );
    if (!match) return;
    if (match[1] && match[1] !== activeTabsTokenVariant) {
      setActiveDimensionToken(null);
      return;
    }
    if (!match[1] && activeTabsTokenVariant !== "outlined") {
      setActiveDimensionToken(null);
    }
  }, [activeBadgeRadius, activeProgressRadius, activeAvatarRadius, activeChipRadius, activeComponent, activeDimensionToken, activeVariant, activeTabsRadius, dimensionTokens, activeTabsTokenVariant, effectiveComponentState]);

  useEffect(() => {
    if (activeComponent !== "select") return;
    if (activeVariant !== "default") return;
    if (activeSelectRadius !== "default") {
      setActiveSelectRadius("default");
    }
  }, [activeComponent, activeVariant, activeSelectRadius]);

  useEffect(() => {
    if (activeComponent !== "multiselect") return;
    if (activeVariant !== "default") return;
    if (activeMultiSelectRadius !== "default") {
      setActiveMultiSelectRadius("default");
    }
  }, [activeComponent, activeVariant, activeMultiSelectRadius]);

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
    burger: activeBurgerSize,
    segmentedcontrol: activeSegmentedControlSize,
    slider: activeSliderSize,
    rangeslider: activeRangeSliderSize,
    title: activeTitleSize,
    text: activeTextSizeToken,
    anchor: activeAnchorSize,
    checkbox: activeCheckboxSize,
    radio: activeRadioSize,
    chip: activeChipSize,
    textinput: activeTextInputSize,
    select: activeSelectSize,
    multiselect: activeMultiSelectSize,
    card: activeCardSize,
    loader: activeLoaderSize,
    divider: activeDividerSize,
    list: activeListSize,
    progress: activeProgressSize,
    chart: activeChartSize,
    "chart-line": activeChartSize,
    "chart-time-series": activeChartSize,
    "chart-time-series-dual-axis": activeChartSize,
    "chart-area": activeChartSize,
    "chart-stacked-area": activeChartSize,
    "chart-stacked-bar": activeChartSize,
    "chart-combo": activeChartSize,
    "chart-donut": activeChartSize,
    "chart-radar": activeChartSize,
    "chart-scatter": activeChartSize,
    "chart-candlestick": activeChartSize,
    "chart-sparkline": activeChartSize,
    "chart-bar-horizontal": activeChartSize,
    "chart-pie": activeChartSize,
    "chart-funnel": activeChartSize,
    "chart-radial": activeChartSize,
    avatar: activeAvatarSize,
    pill: activePillSize,
    badge: activeBadgeSize,
    modal: activeModalSize,
    image: activeImageSize,
    skeleton: activeSkeletonSize,
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
    if (activeComponent === "progress" && tokenName === "progress-radius") {
      return activeProgressRadius;
    }
    if (activeComponent === "avatar" && tokenName === "avatar-radius") {
      return activeAvatarRadius;
    }
    if (activeComponent === "select" && tokenName === "select-radius") {
      return activeSelectRadius;
    }
    if (activeComponent === "multiselect") {
      if (tokenName === "multiselect-radius") return activeMultiSelectRadius;
      if (tokenName === "multiselect-pill-radius") return activeMultiSelectRadius;
    }
    if (activeComponent === "card" && tokenName === "card-radius") {
      return activeCardRadius;
    }
    if (activeComponent === "tabs" && /^tabs-(default|outlined|pills)-radius$/.test(tokenName)) {
      return activeTabsRadius;
    }
    if (activeComponent === "chip" && tokenName === "chip-radius") {
      return activeChipRadius;
    }
    if (activeComponent === "chip" && /^chip-(filled|outline|light)-radius$/.test(tokenName)) {
      return undefined;
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
    if (activeComponent === "image" && tokenName === "image-radius") {
      return activeImageRadius;
    }
    if (activeComponent === "image" && (tokenName === "image-width" || tokenName === "image-height")) {
      return activeImageSize;
    }
    if (activeComponent === "skeleton" && tokenName === "skeleton-radius") {
      return activeSkeletonRadius;
    }
    if (activeComponent === "skeleton" && (tokenName === "skeleton-width" || tokenName === "skeleton-height")) {
      return activeSkeletonSize;
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
      return activeTitleSize;
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
    setLocalDataMessage({ type: "success", text: "Local data reset to defaults." });
  };

  const handleBrandsExport = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      activeBrand,
      previewTheme,
      brands,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "design-system-brands-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    setLocalDataMessage({ type: "success", text: "Brands backup downloaded." });
  };

  const handleBrandsImportClick = () => {
    if (importBrandsInputRef.current) importBrandsInputRef.current.click();
  };

  const handleBrandsImport = (event) => {
    const file = event.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result || "{}"));
        const importedBrands = raw && typeof raw === "object" && raw.brands && typeof raw.brands === "object"
          ? raw.brands
          : raw;
        if (!importedBrands || typeof importedBrands !== "object" || Array.isArray(importedBrands)) {
          throw new Error("Invalid file format");
        }
        const importedIds = Object.keys(importedBrands);
        if (importedIds.length === 0) throw new Error("No brands found");
        const normalizedBrands = enforceTextDefaultMappings(mergeRecoveredBrands(importedBrands));
        setBrands(normalizedBrands);
        const preferredBrand = typeof raw.activeBrand === "string" && normalizedBrands[raw.activeBrand]
          ? raw.activeBrand
          : (normalizedBrands[activeBrand] ? activeBrand : importedIds[0]);
        if (preferredBrand) setActiveBrand(preferredBrand);
        if (raw.previewTheme === "light" || raw.previewTheme === "dark") {
          setPreviewTheme(raw.previewTheme);
        }
        setLocalDataMessage({ type: "success", text: "Brands imported successfully." });
      } catch (err) {
        setLocalDataMessage({
          type: "error",
          text: "Import failed: " + (err && err.message ? err.message : "Invalid JSON file"),
        });
      } finally {
        if (event.target) event.target.value = "";
      }
    };
    reader.onerror = () => {
      setLocalDataMessage({ type: "error", text: "Import failed: unable to read file." });
      if (event.target) event.target.value = "";
    };
    reader.readAsText(file);
  };

  const handleMergeBrandsClick = () => {
    if (mergeBrandsInputRef.current) mergeBrandsInputRef.current.click();
  };

  // Step 1 of merge: parse the file and stage a review of what would change. Your
  // brands aren't touched yet — applyBrandMerge does that once you confirm.
  const handleMergeBrandsFile = (event) => {
    const file = event.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result || "{}"));
        const incoming = raw && typeof raw === "object" && raw.brands && typeof raw.brands === "object"
          ? raw.brands
          : raw;
        if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
          throw new Error("Invalid file format");
        }
        const incomingIds = Object.keys(incoming);
        if (incomingIds.length === 0) throw new Error("No brands found in file");
        // Default selection: every incoming brand. The user can deselect any they
        // don't want (e.g. a brand of theirs the other designer happened to include).
        setPendingBrandMerge({
          incoming,
          ids: incomingIds,
          selected: incomingIds.slice(),
        });
        setLocalDataMessage(null);
      } catch (err) {
        setPendingBrandMerge(null);
        setLocalDataMessage({
          type: "error",
          text: "Merge failed: " + (err && err.message ? err.message : "Invalid JSON file"),
        });
      } finally {
        if (event.target) event.target.value = "";
      }
    };
    reader.onerror = () => {
      setLocalDataMessage({ type: "error", text: "Merge failed: unable to read file." });
      if (event.target) event.target.value = "";
    };
    reader.readAsText(file);
  };

  const toggleMergeBrand = (id) => {
    setPendingBrandMerge((curr) => {
      if (!curr) return curr;
      const has = curr.selected.indexOf(id) >= 0;
      return {
        ...curr,
        selected: has ? curr.selected.filter((x) => x !== id) : curr.selected.concat(id),
      };
    });
  };

  const cancelBrandMerge = () => setPendingBrandMerge(null);

  // Step 2 of merge: additively fold the selected incoming brands into your state.
  // Incoming brands win on a name collision (so you get their latest), and every
  // brand you don't merge is left exactly as-is.
  const applyBrandMerge = () => {
    if (!pendingBrandMerge) return;
    const selectedIds = pendingBrandMerge.selected;
    if (selectedIds.length === 0) {
      setLocalDataMessage({ type: "error", text: "Pick at least one brand to merge." });
      return;
    }
    const added = [];
    const updated = [];
    const incomingSelected = {};
    selectedIds.forEach((id) => {
      incomingSelected[id] = pendingBrandMerge.incoming[id];
      (brands[id] ? updated : added).push(id);
    });
    const mergedBrands = enforceTextDefaultMappings(
      mergeRecoveredBrands(Object.assign({}, brands, incomingSelected))
    );
    setBrands(mergedBrands);
    const nameOf = (id) => (mergedBrands[id] && mergedBrands[id].name) || id;
    const parts = [];
    if (added.length) parts.push("added " + added.map(nameOf).join(", "));
    if (updated.length) parts.push("updated " + updated.map(nameOf).join(", "));
    const kept = Object.keys(brands).filter((id) => selectedIds.indexOf(id) < 0);
    if (kept.length) parts.push("kept " + kept.map((id) => (brands[id] && brands[id].name) || id).join(", "));
    setPendingBrandMerge(null);
    setLocalDataMessage({ type: "success", text: "Merge complete — " + parts.join("; ") + "." });
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
      {storageError && (
        <div
          role="alert"
          style={{
            background: "#3B1418",
            borderBottom: "1px solid #FA5252",
            color: "#FFC9C9",
            fontSize: 12,
            lineHeight: 1.5,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <span style={{ flex: 1 }}>{storageError}</span>
          <button
            type="button"
            onClick={() => setStorageError(null)}
            style={{
              background: "transparent",
              border: "1px solid #FA5252",
              color: "#FFC9C9",
              borderRadius: 4,
              fontSize: 11,
              padding: "4px 10px",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Dismiss
          </button>
        </div>
      )}
      <Modal
        opened={brandDeleteModalOpened}
        onClose={closeBrandDeleteModal}
        title="Delete brand"
        centered
        overlayProps={{ backgroundOpacity: 0.55 }}
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            This removes the brand from this browser (including saved local data). You cannot undo it.
          </Text>
          <Text size="sm">
            Type the brand name{" "}
            <Text component="span" fw={700} c="red.4" ff="monospace">
              {brandDeleteExpectedName}
            </Text>{" "}
            exactly to confirm.
          </Text>
          <TextInput
            label="Brand name"
            placeholder={brandDeleteExpectedName || "…"}
            value={brandDeleteConfirmInput}
            onChange={(e) => setBrandDeleteConfirmInput(e.currentTarget.value)}
            autoComplete="off"
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={closeBrandDeleteModal}>
              Cancel
            </Button>
            <Button color="red" disabled={!canSubmitBrandDelete} onClick={executeBrandDelete}>
              Delete brand
            </Button>
          </Group>
        </Stack>
      </Modal>
      <Modal
        opened={paletteDeleteModalOpened}
        onClose={closePaletteDeleteModal}
        title="Delete color scale"
        centered
        overlayProps={{ backgroundOpacity: 0.55 }}
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            This removes the full{" "}
            <Text component="span" fw={700} ff="monospace">
              {paletteDeleteTargetName}
            </Text>{" "}
            0-9 palette from this brand.
          </Text>
          {paletteDeleteUsageSummary.total > 0 ? (
            <Text size="sm" c="orange.4">
              This palette is currently referenced by {paletteDeleteUsageSummary.total} mappings ({paletteDeleteUsageSummary.semantic} semantic, {paletteDeleteUsageSummary.component} component). You may need to remap tokens after delete.
            </Text>
          ) : (
            <Text size="sm" c="dimmed">
              No semantic/component mappings currently reference this palette.
            </Text>
          )}
          <Text size="sm">
            Type the palette name{" "}
            <Text component="span" fw={700} c="red.4" ff="monospace">
              {paletteDeleteTargetName}
            </Text>{" "}
            to confirm.
          </Text>
          <TextInput
            label="Palette name"
            placeholder={paletteDeleteTargetName || "…"}
            value={paletteDeleteConfirmInput}
            onChange={(e) => setPaletteDeleteConfirmInput(e.currentTarget.value)}
            autoComplete="off"
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={closePaletteDeleteModal}>
              Cancel
            </Button>
            <Button color="red" disabled={!canSubmitPaletteDelete} onClick={executePaletteDelete}>
              Delete scale
            </Button>
          </Group>
        </Stack>
      </Modal>

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
              addPlaceholder="Brand name..."
            />
            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                lineHeight: 1.45,
                color: "#5C5F66",
              }}
            >
              New brands start with no brand color palettes — semantics point at shared global primitives until you add
              your own (e.g. blue) with + Add color, then map tokens to those names.
            </div>
            <button
              type="button"
              onClick={openBrandDeleteModal}
              disabled={brandNames.length <= 1}
              title={brandNames.length <= 1 ? "Keep at least one brand" : "Delete the selected brand"}
              style={{
                marginTop: 10,
                display: "block",
                width: "100%",
                padding: "8px 10px",
                fontSize: 12,
                fontFamily: "monospace",
                fontWeight: 600,
                color: brandNames.length <= 1 ? "#5C5F66" : "#FA5252",
                background: brandNames.length <= 1 ? "#1A1B1E" : "transparent",
                border: `1px solid ${brandNames.length <= 1 ? "#2C2E33" : "#862E2E"}`,
                borderRadius: 6,
                cursor: brandNames.length <= 1 ? "not-allowed" : "pointer",
              }}
            >
              Delete this brand…
            </button>
            <div style={{ marginTop: 20 }} />
            <Section title={`Primitives — ${brand.name}`}>
              {colorNames.map((c) => (
                <PrimitiveScale
                  key={c}
                  name={c}
                  scale={brand.primitives[c]}
                  onUpdate={updatePrimitive}
                  onDelete={openPaletteDeleteModal}
                />
              ))}
              <AddPrimitiveForm existingNames={colorNames} onAdd={addPrimitive} />
            </Section>
            <Section title={`Gradients — ${brand.name}`} defaultOpen={false}>
              <BrandGradientsSection
                brand={brand}
                paletteColorNames={gradientPaletteColorNames}
                onUpsert={upsertBrandGradient}
                onRemove={removeBrandGradient}
              />
            </Section>
            <Section title="Primitives — Global" defaultOpen={false}>
              {globalColorNames.map((c) => (
                <PrimitiveScale key={c} name={c} scale={GLOBAL_PRIMITIVES[c]} readOnly />
              ))}
            </Section>
            {activeComponent === "foundations" && (
              <Section title={`Semantic Colors — ${brand.name}`}>
                <SemanticColorEditor
                  theme={previewTheme === "dark" ? "dark" : "light"}
                  mergedMap={previewTheme === "dark" ? darkSemanticMerged : lightSemanticMerged}
                  brandColors={colorNames}
                  globalColors={globalColorNames}
                  resolveHex={(role) => resolveColor(brands, activeBrand, role, previewTheme)}
                  rampLengthOf={(c) =>
                    (brand.primitives && brand.primitives[c] && brand.primitives[c].length) ||
                    (GLOBAL_PRIMITIVES[c] && GLOBAL_PRIMITIVES[c].length) ||
                    10
                  }
                  onUpdate={updateSemanticMapping}
                />
              </Section>
            )}
            {visibleColorTokenEntries.length > 0 && (
            <Section title={`Color Tokens — ${getComponentLabel(activeComponent)}`}>
              {visibleColorTokenEntries.map(([token, def]) => {
                const semantic = def.semantic;
                const semanticMapping = semantic
                  ? (previewTheme === "dark" ? darkSemanticMerged[semantic] : lightSemanticMerged[semantic])
                  : null;
                const componentOverride =
                  previewTheme === "dark"
                    ? (brand.componentOverridesDark && brand.componentOverridesDark[token]) || null
                    : (brand.componentOverrides && brand.componentOverrides[token]) || null;

                // Semantic-less per-color tokens use a primitive default (or auto-contrast text).
                let fallbackMapping = null;
                if (!semantic) {
                  const seriesMapping =
                    chartSeriesMappingForToken(brand, token) ||
                    chartSeriesOpacityMappingForToken(brand, token);
                  const shadeMapping =
                    chartShadeMappingForToken(brand, token) ||
                    chartShadeOpacityMappingForToken(brand, token);
                  if (seriesMapping) {
                    fallbackMapping = seriesMapping;
                  } else if (shadeMapping) {
                    fallbackMapping = shadeMapping;
                  } else if (def.defaultMapping) {
                    fallbackMapping = def.defaultMapping;
                  } else if (def.autoContrastOf) {
                    const bgHex = resolveColor(brands, activeBrand, null, previewTheme, def.autoContrastOf);
                    fallbackMapping =
                      readableTextOn(bgHex) === "#000000"
                        ? { color: "neutral", index: 9, opacity: 100 }
                        : { color: "neutral", index: 0, opacity: 100 };
                  }
                }
                const baseMapping = componentOverride || semanticMapping || fallbackMapping;
                if (!baseMapping) return null;

                const isActive = activeColorToken === token;
                return (
                  <TokenChainCard
                    key={token}
                    componentToken={token}
                    semanticToken={semantic || "—"}
                    mapping={baseMapping}
                    resolvedColor={resolveColor(brands, activeBrand, semantic || null, previewTheme, token)}
                    isActive={isActive}
                    onClick={() => setActiveColorToken(isActive ? null : token)}
                    onUpdate={updateComponentOverride}
                    brandColors={colorNames}
                    globalColors={globalColorNames}
                    gradientIds={Object.keys(brand.gradients || {}).sort()}
                  />
                );
              })}
            </Section>
            )}
            {visibleDimensionTokenEntries.length > 0 && (
            <Section title={`Dimension Tokens — ${getComponentLabel(activeComponent)}`}>
              {visibleDimensionTokenEntries.map(([token, def]) => {
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
            )}
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
              {activeComponent === "foundations" && (
                <FoundationsPreviewContent brands={brands} activeBrand={activeBrand} />
              )}
              {activeComponent === "docs" && (
                <DocsThemePreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  previewTheme={previewTheme}
                />
              )}
              {activeComponent === "button" && (
                <ButtonPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeVariant={forcedVariant || activeVariant}
                  activeColor={forcedButtonColor || activeButtonColor}
                  activeSize={activeSize}
                  previewTheme={previewTheme}
                  selectedState={forcedState || activeButtonState}
                  activeColorToken={activeColorToken}
                  sizeKeys={sizeKeys}
                  focusRingStyle={activeButtonFocusRingStyle}
                  showLeftIcon={activeButtonLeftIcon}
                  showRightIcon={activeButtonRightIcon}
                  fillGradientCss={
                    (forcedVariant || activeVariant) === "filled" ? buttonFillGradientCss : null
                  }
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
                  showMenu={activeTabsShowMenu}
                  showLeftIcon={activeTabsShowLeftIcon}
                  showRightIcon={activeTabsShowRightIcon}
                  showLeftArrow={activeTabsShowLeftArrow}
                  showRightArrow={activeTabsShowRightArrow}
                />
              )}
              {activeComponent === "accordion" && (
                <AccordionPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeVariant={activeAccordionVariant}
                  activePosition={activeAccordionPosition}
                  selectedState={forcedState || activeAccordionState}
                  expanded={activeAccordionExpanded}
                  activeColorToken={activeColorToken}
                  label={activeAccordionLabel}
                />
              )}

              {activeComponent === "switch" && (
                <SwitchPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  previewTheme={previewTheme}
                  activeSwitchSize={activeSwitchSize}
                  sizeKeys={sizeKeys}
                  activeColorToken={activeColorToken}
                  selectedChecked={forcedChecked != null ? forcedChecked : activeSwitchChecked}
                  selectedState={forcedState || activeSwitchState}
                />
              )}

              {activeComponent === "burger" && (
                <BurgerPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  previewTheme={previewTheme}
                  activeBurgerSize={activeBurgerSize}
                  sizeKeys={sizeKeys}
                  activeColorToken={activeColorToken}
                  selectedOpened={activeBurgerOpened}
                  selectedState={forcedState || activeBurgerState}
                />
              )}

              {activeComponent === "segmentedcontrol" && (
                <SegmentedControlPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  previewTheme={previewTheme}
                  activeSegmentedControlSize={activeSegmentedControlSize}
                  sizeKeys={sizeKeys}
                  activeColorToken={activeColorToken}
                  selectedOrientation={activeSegmentedControlOrientation}
                  selectedFullWidth={activeSegmentedControlFullWidth}
                  selectedState={forcedState || activeSegmentedControlState}
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
                  variant={forcedVariant || activeVariant}
                  size={activeModalSize}
                  radius={activeModalRadius}
                  layout={activeModalLayout}
                  withOverlay={activeModalWithOverlay}
                  withCloseButton={activeModalWithCloseButton}
                  centered={activeModalCentered}
                  showSectionDividers={activeModalShowSectionDividers}
                  dividerInset={activeModalDividerInset}
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
              {activeComponent === "popover" && (
                <PopoverPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activePosition={activePopoverPosition}
                  withArrow={activePopoverWithArrow}
                  widthSize={activePopoverWidthSize}
                  radiusSize={activePopoverRadiusSize}
                  body={activePopoverBody}
                />
              )}
              {activeComponent === "menu" && (
                <MenuPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  size={activeMenuSize}
                  radiusSize={activeMenuRadiusSize}
                  state={activeMenuState}
                  withSection={activeMenuWithSection}
                  withIcons={activeMenuWithIcons}
                />
              )}
              {activeComponent === "divider" && (
                <DividerPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  size={activeDividerSize}
                  orientation={activeDividerOrientation}
                  state={activeDividerState}
                  inset={activeDividerInset}
                />
              )}
              {activeComponent === "list" && (
                <ListPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  size={activeListSize}
                  type={activeListType}
                  withIcons={activeListWithIcons}
                  withPadding={activeListWithPadding}
                />
              )}

              {activeComponent === "notification" && (
                <NotificationPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  previewTheme={previewTheme}
                  radius={activeNotificationRadius}
                  color={activeNotificationColor}
                  title={activeNotificationTitle}
                  description={activeNotificationDescription}
                  withBorder={activeNotificationWithBorder}
                  withCloseButton={activeNotificationWithCloseButton}
                  withIcon={activeNotificationWithIcon}
                  loading={activeNotificationLoading}
                  withAccent={activeNotificationWithAccent}
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
                  showLeftIcon={activeTextInputLeftIcon}
                  showRightIcon={activeTextInputRightIcon}
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
                  showDropdown={activeSelectShowDropdown}
                  onToggleDropdown={() => setActiveSelectShowDropdown((v) => !v)}
                  onCloseDropdown={() => setActiveSelectShowDropdown(false)}
                />
              )}
              {activeComponent === "multiselect" && (
                <MultiSelectPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeVariant={forcedVariant || activeVariant}
                  activeMultiSelectSize={activeMultiSelectSize}
                  activeMultiSelectRadius={activeMultiSelectRadius}
                  sizeKeys={sizeKeys}
                  activeColorToken={activeColorToken}
                  selectedState={forcedState || activeMultiSelectState}
                  showLabel={activeMultiSelectShowLabel}
                  labelText={activeMultiSelectLabelText}
                  withAsterisk={activeMultiSelectWithAsterisk}
                  showError={activeMultiSelectShowError}
                  errorText={activeMultiSelectErrorText}
                  searchable={activeMultiSelectSearchable}
                  clearable={activeMultiSelectClearable}
                  showDropdown={activeMultiSelectShowDropdown}
                  onToggleDropdown={() => setActiveMultiSelectShowDropdown((v) => !v)}
                />
              )}
              {activeComponent === "card" && (
                <CardPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  activeVariant={forcedVariant || activeVariant}
                  size={activeCardSize}
                  radius={activeCardRadius}
                  withBorder={activeCardWithBorder}
                  withShadow={activeCardWithShadow}
                  showSection={activeCardShowSection}
                  interactiveState={forcedState || activeCardState}
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
              {activeComponent === "progress" && (
                <ProgressPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  previewTheme={previewTheme}
                  size={activeProgressSize}
                  radiusSize={activeProgressRadius}
                  value={activeProgressValue}
                  showLabel={activeProgressShowLabel}
                />
              )}
              {activeComponent === "chart" && (
                <ChartPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  previewTheme={previewTheme}
                  type="bar"
                  size={activeChartSize}
                  colorMode={activeChartColorMode}
                  showGrid={activeChartShowGrid}
                  showAxis={activeChartShowAxis}
                />
              )}
              {activeComponent === "chart-line" && (
                <ChartPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  previewTheme={previewTheme}
                  type="line"
                  size={activeChartSize}
                  colorMode={activeChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  showPoints={activeChartShowPoints}
                  showGrid={activeChartShowGrid}
                  showAxis={activeChartShowAxis}
                  showLegend={activeChartShowLegend}
                />
              )}
              {activeComponent === "chart-time-series" && (
                <ChartPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  previewTheme={previewTheme}
                  type="time-series"
                  size={activeChartSize}
                  colorMode={activeChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  showPoints={activeChartShowPoints}
                  showGrid={activeChartShowGrid}
                  showAxis={activeChartShowAxis}
                  showLegend={activeChartShowLegend}
                />
              )}
              {activeComponent === "chart-time-series-dual-axis" && (
                <ChartPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  previewTheme={previewTheme}
                  type="time-series-dual-axis"
                  size={activeChartSize}
                  colorMode={activeChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  showPoints={activeChartShowPoints}
                  showGrid={activeChartShowGrid}
                  showAxis={activeChartShowAxis}
                  showLegend={activeChartShowLegend}
                />
              )}
              {activeComponent === "chart-area" && (
                <ChartPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  previewTheme={previewTheme}
                  type="area"
                  size={activeChartSize}
                  colorMode={activeChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  showPoints={activeChartShowPoints}
                  showGrid={activeChartShowGrid}
                  showAxis={activeChartShowAxis}
                  showLegend={activeChartShowLegend}
                />
              )}
              {activeComponent === "chart-stacked-area" && (
                <ChartPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  previewTheme={previewTheme}
                  type="stacked-area"
                  size={activeChartSize}
                  colorMode={activeChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  showPoints={activeChartShowPoints}
                  showGrid={activeChartShowGrid}
                  showAxis={activeChartShowAxis}
                  showLegend={activeChartShowLegend}
                />
              )}
              {activeComponent === "chart-stacked-bar" && (
                <ChartPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  previewTheme={previewTheme}
                  type="stacked-bar"
                  size={activeChartSize}
                  colorMode={activeChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  showGrid={activeChartShowGrid}
                  showAxis={activeChartShowAxis}
                  showLegend={activeChartShowLegend}
                />
              )}
              {activeComponent === "chart-combo" && (
                <ChartPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  previewTheme={previewTheme}
                  type="combo"
                  size={activeChartSize}
                  colorMode={activeChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  showPoints={activeChartShowPoints}
                  showGrid={activeChartShowGrid}
                  showAxis={activeChartShowAxis}
                  showLegend={activeChartShowLegend}
                  showRightAxis={activeChartShowRightAxis}
                />
              )}
              {activeComponent === "chart-donut" && (
                <ChartPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  previewTheme={previewTheme}
                  type="donut"
                  size={activeChartSize}
                  colorMode={activeChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  showLegend={activeChartShowLegend}
                />
              )}
              {activeComponent === "chart-radar" && (
                <ChartPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  previewTheme={previewTheme}
                  type="radar"
                  size={activeChartSize}
                  colorMode={activeChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  showPoints={activeChartShowPoints}
                  showGrid={activeChartShowGrid}
                  showAxis={activeChartShowAxis}
                  showLegend={activeChartShowLegend}
                />
              )}
              {activeComponent === "chart-scatter" && (
                <ChartPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  previewTheme={previewTheme}
                  type="scatter"
                  size={activeChartSize}
                  colorMode={activeChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  showGrid={activeChartShowGrid}
                  showAxis={activeChartShowAxis}
                  showLegend={activeChartShowLegend}
                />
              )}
              {activeComponent === "chart-candlestick" && (
                <ChartPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  previewTheme={previewTheme}
                  type="candlestick"
                  size={activeChartSize}
                  showGrid={activeChartShowGrid}
                  showAxis={activeChartShowAxis}
                  showLegend={activeChartShowLegend}
                />
              )}
              {activeComponent === "chart-sparkline" && (
                <ChartPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  previewTheme={previewTheme}
                  type="sparkline"
                  size={activeChartSize}
                  sparklineStyle={activeSparklineStyle}
                  showPoints={activeChartShowPoints}
                />
              )}
              {activeComponent === "chart-bar-horizontal" && (
                <ChartPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  previewTheme={previewTheme}
                  type="bar-horizontal"
                  size={activeChartSize}
                  colorMode={activeChartColorMode}
                  showGrid={activeChartShowGrid}
                  showAxis={activeChartShowAxis}
                />
              )}
              {activeComponent === "chart-pie" && (
                <ChartPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  previewTheme={previewTheme}
                  type="pie"
                  size={activeChartSize}
                  colorMode={activeChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  showLegend={activeChartShowLegend}
                />
              )}
              {activeComponent === "chart-funnel" && (
                <ChartPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  previewTheme={previewTheme}
                  type="funnel"
                  size={activeChartSize}
                  colorMode={activeChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  showLegend={activeChartShowLegend}
                />
              )}
              {activeComponent === "chart-radial" && (
                <ChartPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  previewTheme={previewTheme}
                  type="radial"
                  size={activeChartSize}
                  colorMode={activeChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  showLegend={activeChartShowLegend}
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
                  activeTone={activeBadgeColor}
                  size={activeBadgeSize}
                  radius={activeBadgeRadius}
                  circle={activeBadgeCircle}
                  fullWidth={activeBadgeFullWidth}
                  withRemoveButton={activeBadgeWithRemoveButton}
                  text={activeBadgeText}
                  previewTheme={previewTheme}
                />
              )}
              {activeComponent === "image" && (
                <ImagePreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  src={activeImageSrc}
                  alt={activeImageAlt}
                  fallbackSrc={activeImageFallbackSrc}
                  size={activeImageSize}
                  radius={activeImageRadius}
                  fit={activeImageFit}
                />
              )}
              {activeComponent === "avatar" && (
                <AvatarPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  previewTheme={previewTheme}
                  size={activeAvatarSize}
                  radiusSize={activeAvatarRadius}
                  name={activeAvatarName}
                  src={activeAvatarSrc}
                  content={activeAvatarContent}
                  colorKey={activeAvatarColor}
                />
              )}
              {activeComponent === "skeleton" && (
                <SkeletonPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  previewTheme={previewTheme}
                  size={activeSkeletonSize}
                  radius={activeSkeletonRadius}
                  circle={activeSkeletonCircle}
                  animate={activeSkeletonAnimate}
                />
              )}
              {activeComponent === "table" && (
                <TablePreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  previewTheme={previewTheme}
                  showRowHover={activeTableShowRowHover}
                />
              )}
              {activeComponent === "calendar" && (
                <CalendarPreviewContent
                  brands={brands}
                  activeBrand={activeBrand}
                  activeColorToken={activeColorToken}
                  previewTheme={previewTheme}
                  showOutsideDays={activeCalendarShowOutside}
                  showHeader={activeCalendarShowHeader}
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
                  activeColor={forcedButtonColor || activeButtonColor}
                  setActiveColor={setActiveButtonColor}
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
                  fillGradientId={buttonFillGradientId}
                  setFillGradientId={setButtonFillGradientId}
                  gradientIds={Object.keys(brands[activeBrand]?.gradients || {}).sort()}
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
                  showMenu={activeTabsShowMenu}
                  setShowMenu={setActiveTabsShowMenu}
                  showLeftIcon={activeTabsShowLeftIcon}
                  setShowLeftIcon={setActiveTabsShowLeftIcon}
                  showRightIcon={activeTabsShowRightIcon}
                  setShowRightIcon={setActiveTabsShowRightIcon}
                  showLeftArrow={activeTabsShowLeftArrow}
                  setShowLeftArrow={setActiveTabsShowLeftArrow}
                  showRightArrow={activeTabsShowRightArrow}
                  setShowRightArrow={setActiveTabsShowRightArrow}
                  selectedState={forcedState || activeTabsState}
                  setSelectedState={setActiveTabsState}
                  forcedState={forcedState}
                  buildVariants={buildTabsVariants}
                  setBuildVariants={setBuildTabsVariants}
                />
              )}
              {activeComponent === "accordion" && (
                <AccordionPropertiesPanel
                  activeVariant={activeAccordionVariant}
                  setActiveVariant={setActiveAccordionVariant}
                  activePosition={activeAccordionPosition}
                  setActivePosition={setActiveAccordionPosition}
                  selectedState={forcedState || activeAccordionState}
                  setSelectedState={setActiveAccordionState}
                  expanded={activeAccordionExpanded}
                  setExpanded={setActiveAccordionExpanded}
                  label={activeAccordionLabel}
                  setLabel={setActiveAccordionLabel}
                  forcedState={forcedState}
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
              {activeComponent === "burger" && (
                <BurgerPropertiesPanel
                  activeBurgerSize={activeBurgerSize}
                  setActiveBurgerSize={setActiveBurgerSize}
                  sizeKeys={sizeKeys}
                  selectedOpened={activeBurgerOpened}
                  setSelectedOpened={setActiveBurgerOpened}
                  selectedState={forcedState || activeBurgerState}
                  setSelectedState={setActiveBurgerState}
                  forcedState={forcedState}
                />
              )}
              {activeComponent === "segmentedcontrol" && (
                <SegmentedControlPropertiesPanel
                  activeSegmentedControlSize={activeSegmentedControlSize}
                  setActiveSegmentedControlSize={setActiveSegmentedControlSize}
                  sizeKeys={sizeKeys}
                  selectedOrientation={activeSegmentedControlOrientation}
                  setSelectedOrientation={setActiveSegmentedControlOrientation}
                  selectedFullWidth={activeSegmentedControlFullWidth}
                  setSelectedFullWidth={setActiveSegmentedControlFullWidth}
                  selectedState={forcedState || activeSegmentedControlState}
                  setSelectedState={setActiveSegmentedControlState}
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
                  variant={forcedVariant || activeVariant}
                  setVariant={setActiveVariant}
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
                  showSectionDividers={activeModalShowSectionDividers}
                  setShowSectionDividers={setActiveModalShowSectionDividers}
                  dividerInset={activeModalDividerInset}
                  setDividerInset={setActiveModalDividerInset}
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
              {activeComponent === "popover" && (
                <PopoverPropertiesPanel
                  activePosition={activePopoverPosition}
                  setActivePosition={setActivePopoverPosition}
                  withArrow={activePopoverWithArrow}
                  setWithArrow={setActivePopoverWithArrow}
                  widthSize={activePopoverWidthSize}
                  setWidthSize={setActivePopoverWidthSize}
                  radiusSize={activePopoverRadiusSize}
                  setRadiusSize={setActivePopoverRadiusSize}
                  body={activePopoverBody}
                  setBody={setActivePopoverBody}
                />
              )}
              {activeComponent === "menu" && (
                <MenuPropertiesPanel
                  size={activeMenuSize}
                  setSize={setActiveMenuSize}
                  radiusSize={activeMenuRadiusSize}
                  setRadiusSize={setActiveMenuRadiusSize}
                  state={activeMenuState}
                  setState={setActiveMenuState}
                  withSection={activeMenuWithSection}
                  setWithSection={setActiveMenuWithSection}
                  withIcons={activeMenuWithIcons}
                  setWithIcons={setActiveMenuWithIcons}
                />
              )}
              {activeComponent === "divider" && (
                <DividerPropertiesPanel
                  size={activeDividerSize}
                  setSize={setActiveDividerSize}
                  orientation={activeDividerOrientation}
                  setOrientation={setActiveDividerOrientation}
                  state={activeDividerState}
                  setState={setActiveDividerState}
                  inset={activeDividerInset}
                  setInset={setActiveDividerInset}
                />
              )}
              {activeComponent === "list" && (
                <ListPropertiesPanel
                  size={activeListSize}
                  setSize={setActiveListSize}
                  type={activeListType}
                  setType={setActiveListType}
                  withIcons={activeListWithIcons}
                  setWithIcons={setActiveListWithIcons}
                  withPadding={activeListWithPadding}
                  setWithPadding={setActiveListWithPadding}
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
                  withAccent={activeNotificationWithAccent}
                  setWithAccent={setActiveNotificationWithAccent}
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
                  showLeftIcon={activeTextInputLeftIcon}
                  setShowLeftIcon={setActiveTextInputLeftIcon}
                  showRightIcon={activeTextInputRightIcon}
                  setShowRightIcon={setActiveTextInputRightIcon}
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
                  showDropdown={activeSelectShowDropdown}
                  setShowDropdown={setActiveSelectShowDropdown}
                  forcedState={forcedState}
                />
              )}
              {activeComponent === "multiselect" && (
                <MultiSelectPropertiesPanel
                  activeVariant={forcedVariant || activeVariant}
                  setActiveVariant={setActiveVariant}
                  activeMultiSelectSize={activeMultiSelectSize}
                  setActiveMultiSelectSize={setActiveMultiSelectSize}
                  activeMultiSelectRadius={activeMultiSelectRadius}
                  setActiveMultiSelectRadius={setActiveMultiSelectRadius}
                  sizeKeys={sizeKeys}
                  selectedState={forcedState || activeMultiSelectState}
                  setSelectedState={setActiveMultiSelectState}
                  showLabel={activeMultiSelectShowLabel}
                  setShowLabel={setActiveMultiSelectShowLabel}
                  labelText={activeMultiSelectLabelText}
                  setLabelText={setActiveMultiSelectLabelText}
                  withAsterisk={activeMultiSelectWithAsterisk}
                  setWithAsterisk={setActiveMultiSelectWithAsterisk}
                  showError={activeMultiSelectShowError}
                  setShowError={setActiveMultiSelectShowError}
                  errorText={activeMultiSelectErrorText}
                  setErrorText={setActiveMultiSelectErrorText}
                  searchable={activeMultiSelectSearchable}
                  setSearchable={setActiveMultiSelectSearchable}
                  clearable={activeMultiSelectClearable}
                  setClearable={setActiveMultiSelectClearable}
                  showDropdown={activeMultiSelectShowDropdown}
                  setShowDropdown={setActiveMultiSelectShowDropdown}
                  forcedState={forcedState}
                />
              )}
              {activeComponent === "card" && (
                <CardPropertiesPanel
                  activeVariant={forcedVariant || activeVariant}
                  setActiveVariant={setActiveVariant}
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
                  interactiveState={forcedState || activeCardState}
                  setInteractiveState={setActiveCardState}
                  title={activeCardTitle}
                  setTitle={setActiveCardTitle}
                  description={activeCardDescription}
                  setDescription={setActiveCardDescription}
                  forcedVariant={forcedVariant}
                  forcedState={forcedState}
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
              {activeComponent === "progress" && (
                <ProgressPropertiesPanel
                  size={activeProgressSize}
                  setSize={setActiveProgressSize}
                  radius={activeProgressRadius}
                  setRadius={setActiveProgressRadius}
                  value={activeProgressValue}
                  setValue={setActiveProgressValue}
                  showLabel={activeProgressShowLabel}
                  setShowLabel={setActiveProgressShowLabel}
                />
              )}
              {activeComponent === "chart" && (
                <ChartPropertiesPanel
                  type="bar"
                  size={activeChartSize}
                  setSize={setActiveChartSize}
                  colorMode={activeChartColorMode}
                  setColorMode={handleChartColorMode}
                  showGrid={activeChartShowGrid}
                  setShowGrid={setActiveChartShowGrid}
                  showAxis={activeChartShowAxis}
                  setShowAxis={setActiveChartShowAxis}
                />
              )}
              {activeComponent === "chart-line" && (
                <ChartPropertiesPanel
                  type="line"
                  size={activeChartSize}
                  setSize={setActiveChartSize}
                  colorMode={activeChartColorMode}
                  setColorMode={handleChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  setSeriesCount={setActiveChartSeriesCount}
                  showPoints={activeChartShowPoints}
                  setShowPoints={setActiveChartShowPoints}
                  showGrid={activeChartShowGrid}
                  setShowGrid={setActiveChartShowGrid}
                  showAxis={activeChartShowAxis}
                  setShowAxis={setActiveChartShowAxis}
                  showLegend={activeChartShowLegend}
                  setShowLegend={setActiveChartShowLegend}
                />
              )}
              {activeComponent === "chart-time-series" && (
                <ChartPropertiesPanel
                  type="time-series"
                  size={activeChartSize}
                  setSize={setActiveChartSize}
                  colorMode={activeChartColorMode}
                  setColorMode={handleChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  setSeriesCount={setActiveChartSeriesCount}
                  showPoints={activeChartShowPoints}
                  setShowPoints={setActiveChartShowPoints}
                  showGrid={activeChartShowGrid}
                  setShowGrid={setActiveChartShowGrid}
                  showAxis={activeChartShowAxis}
                  setShowAxis={setActiveChartShowAxis}
                  showLegend={activeChartShowLegend}
                  setShowLegend={setActiveChartShowLegend}
                />
              )}
              {activeComponent === "chart-time-series-dual-axis" && (
                <ChartPropertiesPanel
                  type="time-series-dual-axis"
                  size={activeChartSize}
                  setSize={setActiveChartSize}
                  colorMode={activeChartColorMode}
                  setColorMode={handleChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  setSeriesCount={setActiveChartSeriesCount}
                  showPoints={activeChartShowPoints}
                  setShowPoints={setActiveChartShowPoints}
                  showGrid={activeChartShowGrid}
                  setShowGrid={setActiveChartShowGrid}
                  showAxis={activeChartShowAxis}
                  setShowAxis={setActiveChartShowAxis}
                  showLegend={activeChartShowLegend}
                  setShowLegend={setActiveChartShowLegend}
                />
              )}
              {activeComponent === "chart-area" && (
                <ChartPropertiesPanel
                  type="area"
                  size={activeChartSize}
                  setSize={setActiveChartSize}
                  colorMode={activeChartColorMode}
                  setColorMode={handleChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  setSeriesCount={setActiveChartSeriesCount}
                  showPoints={activeChartShowPoints}
                  setShowPoints={setActiveChartShowPoints}
                  showGrid={activeChartShowGrid}
                  setShowGrid={setActiveChartShowGrid}
                  showAxis={activeChartShowAxis}
                  setShowAxis={setActiveChartShowAxis}
                  showLegend={activeChartShowLegend}
                  setShowLegend={setActiveChartShowLegend}
                />
              )}
              {activeComponent === "chart-stacked-area" && (
                <ChartPropertiesPanel
                  type="stacked-area"
                  size={activeChartSize}
                  setSize={setActiveChartSize}
                  colorMode={activeChartColorMode}
                  setColorMode={handleChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  setSeriesCount={setActiveChartSeriesCount}
                  showPoints={activeChartShowPoints}
                  setShowPoints={setActiveChartShowPoints}
                  showGrid={activeChartShowGrid}
                  setShowGrid={setActiveChartShowGrid}
                  showAxis={activeChartShowAxis}
                  setShowAxis={setActiveChartShowAxis}
                  showLegend={activeChartShowLegend}
                  setShowLegend={setActiveChartShowLegend}
                />
              )}
              {activeComponent === "chart-stacked-bar" && (
                <ChartPropertiesPanel
                  type="stacked-bar"
                  size={activeChartSize}
                  setSize={setActiveChartSize}
                  colorMode={activeChartColorMode}
                  setColorMode={handleChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  setSeriesCount={setActiveChartSeriesCount}
                  showGrid={activeChartShowGrid}
                  setShowGrid={setActiveChartShowGrid}
                  showAxis={activeChartShowAxis}
                  setShowAxis={setActiveChartShowAxis}
                  showLegend={activeChartShowLegend}
                  setShowLegend={setActiveChartShowLegend}
                />
              )}
              {activeComponent === "chart-combo" && (
                <ChartPropertiesPanel
                  type="combo"
                  size={activeChartSize}
                  setSize={setActiveChartSize}
                  colorMode={activeChartColorMode}
                  setColorMode={handleChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  setSeriesCount={setActiveChartSeriesCount}
                  showPoints={activeChartShowPoints}
                  setShowPoints={setActiveChartShowPoints}
                  showGrid={activeChartShowGrid}
                  setShowGrid={setActiveChartShowGrid}
                  showAxis={activeChartShowAxis}
                  setShowAxis={setActiveChartShowAxis}
                  showLegend={activeChartShowLegend}
                  setShowLegend={setActiveChartShowLegend}
                  showRightAxis={activeChartShowRightAxis}
                  setShowRightAxis={setActiveChartShowRightAxis}
                />
              )}
              {activeComponent === "chart-donut" && (
                <ChartPropertiesPanel
                  type="donut"
                  size={activeChartSize}
                  setSize={setActiveChartSize}
                  colorMode={activeChartColorMode}
                  setColorMode={handleChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  setSeriesCount={setActiveChartSeriesCount}
                  showLegend={activeChartShowLegend}
                  setShowLegend={setActiveChartShowLegend}
                />
              )}
              {activeComponent === "chart-radar" && (
                <ChartPropertiesPanel
                  type="radar"
                  size={activeChartSize}
                  setSize={setActiveChartSize}
                  colorMode={activeChartColorMode}
                  setColorMode={handleChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  setSeriesCount={setActiveChartSeriesCount}
                  showPoints={activeChartShowPoints}
                  setShowPoints={setActiveChartShowPoints}
                  showGrid={activeChartShowGrid}
                  setShowGrid={setActiveChartShowGrid}
                  showAxis={activeChartShowAxis}
                  setShowAxis={setActiveChartShowAxis}
                  showLegend={activeChartShowLegend}
                  setShowLegend={setActiveChartShowLegend}
                />
              )}
              {activeComponent === "chart-scatter" && (
                <ChartPropertiesPanel
                  type="scatter"
                  size={activeChartSize}
                  setSize={setActiveChartSize}
                  colorMode={activeChartColorMode}
                  setColorMode={handleChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  setSeriesCount={setActiveChartSeriesCount}
                  showGrid={activeChartShowGrid}
                  setShowGrid={setActiveChartShowGrid}
                  showAxis={activeChartShowAxis}
                  setShowAxis={setActiveChartShowAxis}
                  showLegend={activeChartShowLegend}
                  setShowLegend={setActiveChartShowLegend}
                />
              )}
              {activeComponent === "chart-candlestick" && (
                <ChartPropertiesPanel
                  type="candlestick"
                  size={activeChartSize}
                  setSize={setActiveChartSize}
                  showGrid={activeChartShowGrid}
                  setShowGrid={setActiveChartShowGrid}
                  showAxis={activeChartShowAxis}
                  setShowAxis={setActiveChartShowAxis}
                  showLegend={activeChartShowLegend}
                  setShowLegend={setActiveChartShowLegend}
                />
              )}
              {activeComponent === "chart-sparkline" && (
                <ChartPropertiesPanel
                  type="sparkline"
                  size={activeChartSize}
                  setSize={setActiveChartSize}
                  sparklineStyle={activeSparklineStyle}
                  setSparklineStyle={setActiveSparklineStyle}
                  showPoints={activeChartShowPoints}
                  setShowPoints={setActiveChartShowPoints}
                />
              )}
              {activeComponent === "chart-bar-horizontal" && (
                <ChartPropertiesPanel
                  type="bar-horizontal"
                  size={activeChartSize}
                  setSize={setActiveChartSize}
                  colorMode={activeChartColorMode}
                  setColorMode={handleChartColorMode}
                  showGrid={activeChartShowGrid}
                  setShowGrid={setActiveChartShowGrid}
                  showAxis={activeChartShowAxis}
                  setShowAxis={setActiveChartShowAxis}
                />
              )}
              {activeComponent === "chart-pie" && (
                <ChartPropertiesPanel
                  type="pie"
                  size={activeChartSize}
                  setSize={setActiveChartSize}
                  colorMode={activeChartColorMode}
                  setColorMode={handleChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  setSeriesCount={setActiveChartSeriesCount}
                  showLegend={activeChartShowLegend}
                  setShowLegend={setActiveChartShowLegend}
                />
              )}
              {activeComponent === "chart-funnel" && (
                <ChartPropertiesPanel
                  type="funnel"
                  size={activeChartSize}
                  setSize={setActiveChartSize}
                  colorMode={activeChartColorMode}
                  setColorMode={handleChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  setSeriesCount={setActiveChartSeriesCount}
                  showLegend={activeChartShowLegend}
                  setShowLegend={setActiveChartShowLegend}
                />
              )}
              {activeComponent === "chart-radial" && (
                <ChartPropertiesPanel
                  type="radial"
                  size={activeChartSize}
                  setSize={setActiveChartSize}
                  colorMode={activeChartColorMode}
                  setColorMode={handleChartColorMode}
                  seriesCount={activeChartSeriesCount}
                  setSeriesCount={setActiveChartSeriesCount}
                  showLegend={activeChartShowLegend}
                  setShowLegend={setActiveChartShowLegend}
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
                  activeTone={activeBadgeColor}
                  setActiveTone={setActiveBadgeColor}
                  size={activeBadgeSize}
                  setSize={setActiveBadgeSize}
                  radius={activeBadgeRadius}
                  setRadius={setActiveBadgeRadius}
                  circle={activeBadgeCircle}
                  setCircle={setActiveBadgeCircle}
                  fullWidth={activeBadgeFullWidth}
                  setFullWidth={setActiveBadgeFullWidth}
                  withRemoveButton={activeBadgeWithRemoveButton}
                  setWithRemoveButton={setActiveBadgeWithRemoveButton}
                  text={activeBadgeText}
                  setText={setActiveBadgeText}
                />
              )}
              {activeComponent === "image" && (
                <ImagePropertiesPanel
                  size={activeImageSize}
                  setSize={setActiveImageSize}
                  src={activeImageSrc}
                  setSrc={setActiveImageSrc}
                  alt={activeImageAlt}
                  setAlt={setActiveImageAlt}
                  fallbackSrc={activeImageFallbackSrc}
                  setFallbackSrc={setActiveImageFallbackSrc}
                  radius={activeImageRadius}
                  setRadius={setActiveImageRadius}
                  fit={activeImageFit}
                  setFit={setActiveImageFit}
                />
              )}
              {activeComponent === "avatar" && (
                <AvatarPropertiesPanel
                  size={activeAvatarSize}
                  setSize={setActiveAvatarSize}
                  radius={activeAvatarRadius}
                  setRadius={setActiveAvatarRadius}
                  name={activeAvatarName}
                  setName={setActiveAvatarName}
                  src={activeAvatarSrc}
                  setSrc={setActiveAvatarSrc}
                  content={activeAvatarContent}
                  setContent={setActiveAvatarContent}
                  colorKey={activeAvatarColor}
                  setColorKey={setActiveAvatarColor}
                  colorOptions={avatarColorOptions}
                />
              )}
              {activeComponent === "skeleton" && (
                <SkeletonPropertiesPanel
                  size={activeSkeletonSize}
                  setSize={setActiveSkeletonSize}
                  radius={activeSkeletonRadius}
                  setRadius={setActiveSkeletonRadius}
                  circle={activeSkeletonCircle}
                  setCircle={setActiveSkeletonCircle}
                  animate={activeSkeletonAnimate}
                  setAnimate={setActiveSkeletonAnimate}
                />
              )}
              {activeComponent === "table" && (
                <TablePropertiesPanel
                  showRowHover={activeTableShowRowHover}
                  setShowRowHover={setActiveTableShowRowHover}
                />
              )}
              {activeComponent === "calendar" && (
                <CalendarPropertiesPanel
                  showOutsideDays={activeCalendarShowOutside}
                  setShowOutsideDays={setActiveCalendarShowOutside}
                  showHeader={activeCalendarShowHeader}
                  setShowHeader={setActiveCalendarShowHeader}
                />
              )}
              {!["button", "actionicon", "tabs", "accordion", "switch", "burger", "segmentedcontrol", "slider", "rangeslider", "title", "text", "anchor", "modal", "checkbox", "radio", "chip", "tooltip", "notification", "alert", "textinput", "select", "multiselect", "card", "loader", "progress", "chart", "chart-line", "chart-time-series", "chart-time-series-dual-axis", "chart-area", "chart-stacked-area", "chart-stacked-bar", "chart-combo", "chart-donut", "chart-radar", "chart-scatter", "chart-candlestick", "chart-sparkline", "chart-bar-horizontal", "chart-pie", "chart-funnel", "chart-radial", "pill", "badge", "image", "avatar", "skeleton", "table", "calendar"].includes(activeComponent) && (
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
            {[
              { label: "Foundations", names: ["foundations", "docs"] },
              {
                label: "Components",
                names: COMPONENT_NAMES.filter(
                  (name) =>
                    !CHART_COMPONENTS.includes(name) &&
                    name !== "docs" &&
                    name !== "accordion-item" &&
                    name !== "accordion-content"
                ),
              },
              { label: "Charts", names: CHART_COMPONENTS },
            ].map((section, sectionIndex) => (
              <div key={section.label} style={{ marginTop: sectionIndex === 0 ? 0 : 20 }}>
                <div style={{ fontSize: 11, color: "#5C5F66", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 8 }}>
                  {section.label}
                </div>
                <div>
                  {section.names.map((name) => (
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
            ))}
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
                  activeBrand,
                  previewTheme,
                  buttonFocusRingStyle: activeButtonFocusRingStyle,
                  actionIconFocusRingStyle: activeActionIconFocusRingStyle,
                  buttonVariants: buildButtonVariants,
                  actionIconVariants: buildActionIconVariants,
                  tabsVariants: buildTabsVariants,
                  titleText: activeTitleText,
                  textText: activeTextText,
                }}
              />

              <div style={{ borderTop: "1px solid #2C2E33", marginTop: 20, paddingTop: 20 }}>
                <div style={{ fontSize: 11, color: "#5C5F66", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                  Local Data
                </div>
                <p style={{ fontSize: 13, color: "#868E96", marginBottom: 16, lineHeight: 1.5 }}>
                  Export your brands to a JSON file to share, or merge another designer's
                  brands into your generator. Merging adds new brands and updates matching
                  ones — your other brands are left untouched.
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={handleBrandsExport}
                    style={{ background: "#25262B", border: "1px solid #373A40", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#C1C2C5", cursor: "pointer", fontFamily: "monospace" }}
                  >
                    Export Brands JSON
                  </button>
                  <button
                    onClick={handleMergeBrandsClick}
                    style={{ background: "#25262B", border: "1px solid #373A40", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#C1C2C5", cursor: "pointer", fontFamily: "monospace" }}
                  >
                    Merge Brands from File
                  </button>
                  <button
                    onClick={handleBrandsImportClick}
                    disabled
                    title="Disabled: replaces ALL your brands. Use Merge instead."
                    style={{ background: "#1F2125", border: "1px solid #2C2E33", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#5C5F66", cursor: "not-allowed", fontFamily: "monospace", opacity: 0.75 }}
                  >
                    Import Brands JSON
                  </button>
                  {/* Reset Local Data — temporarily hidden (unused). Handler retained.
                  <button
                    onClick={handleResetLocalData}
                    disabled
                    style={{ background: "#1F2125", border: "1px solid #2C2E33", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#5C5F66", cursor: "not-allowed", fontFamily: "monospace", opacity: 0.75 }}
                  >
                    Reset Local Data
                  </button>
                  */}
                </div>
                <input
                  ref={importBrandsInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleBrandsImport}
                  style={{ display: "none" }}
                />
                <input
                  ref={mergeBrandsInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleMergeBrandsFile}
                  style={{ display: "none" }}
                />
                {pendingBrandMerge && (
                  <div style={{ marginTop: 12, border: "1px solid #373A40", borderRadius: 6, padding: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#C1C2C5", marginBottom: 8 }}>
                      Review merge — pick which brands to bring in
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                      {pendingBrandMerge.ids.map((id) => {
                        const isUpdate = Boolean(brands[id]);
                        const incomingName = (pendingBrandMerge.incoming[id] && pendingBrandMerge.incoming[id].name) || id;
                        return (
                          <label key={id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#C1C2C5" }}>
                            <input
                              type="checkbox"
                              checked={pendingBrandMerge.selected.indexOf(id) >= 0}
                              onChange={() => toggleMergeBrand(id)}
                            />
                            <span>{incomingName}</span>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                color: isUpdate ? "#FAB005" : "#40C057",
                                border: `1px solid ${isUpdate ? "#FAB005" : "#40C057"}`,
                                borderRadius: 4,
                                padding: "1px 6px",
                              }}
                            >
                              {isUpdate ? "Overwrites yours" : "New"}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={applyBrandMerge}
                        style={{ background: "#228BE6", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", fontFamily: "monospace" }}
                      >
                        Apply Merge
                      </button>
                      <button
                        onClick={cancelBrandMerge}
                        style={{ background: "#25262B", border: "1px solid #373A40", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "#C1C2C5", cursor: "pointer", fontFamily: "monospace" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {localDataMessage && (
                  <p style={{ fontSize: 12, color: localDataMessage.type === "error" ? "#FA5252" : "#40C057", marginTop: 8 }}>
                    {localDataMessage.text}
                  </p>
                )}
              </div>

              {/* Markdown Export — temporarily hidden (unused). Handler retained.
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
              */}

              {/* Component Docs Export — temporarily hidden (unused). Handler retained.
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
              */}

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
