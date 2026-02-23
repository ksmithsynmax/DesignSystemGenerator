figma.showUI(__html__, { visible: true, width: 320, height: 220 });

figma.ui.onmessage = async function (msg) {
  if (msg.type === "sync-tokens") {
    try {
      await syncTokens(msg.payload);
    } catch (err) {
      figma.ui.postMessage({ type: "sync-complete", success: false, error: String(err) });
    }
  }
};

async function syncTokens(payload) {
  var brandIds = Object.keys(payload);
  if (brandIds.length === 0) throw new Error("No brands in payload");

  progress("Starting sync for brands: " + brandIds.join(", "));

  // Step 1: Find or create the "Components" collection
  progress("Step 1: Finding or creating Components collection...");
  var collections = await figma.variables.getLocalVariableCollectionsAsync();
  var collection = null;
  for (var ci = 0; ci < collections.length; ci++) {
    if (collections[ci].name === "Components") {
      collection = collections[ci];
      break;
    }
  }
  if (!collection) {
    collection = figma.variables.createVariableCollection("Components");
    progress("Created new Components collection");
  } else {
    progress("Found existing Components collection");
  }

  // Step 2: Ensure one mode per brand
  progress("Step 2: Setting up modes...");
  var modeMap = {};
  var existingModes = collection.modes;
  var syncBrands = [];

  for (var i = 0; i < brandIds.length; i++) {
    var brandId = brandIds[i];
    var brandName = brandId.charAt(0).toUpperCase() + brandId.slice(1);
    var existingMode = null;

    for (var mi = 0; mi < existingModes.length; mi++) {
      if (existingModes[mi].name === brandName) {
        existingMode = existingModes[mi];
        break;
      }
    }

    if (existingMode) {
      modeMap[brandId] = existingMode.modeId;
      syncBrands.push(brandId);
    } else if (i === 0 && existingModes.length === 1 && existingModes[0].name === "Mode 1") {
      collection.renameMode(existingModes[0].modeId, brandName);
      modeMap[brandId] = existingModes[0].modeId;
      syncBrands.push(brandId);
    } else {
      try {
        var newModeId = collection.addMode(brandName);
        modeMap[brandId] = newModeId;
        syncBrands.push(brandId);
      } catch (modeErr) {
        progress("Could not add mode for " + brandName + " (plan limit?) - skipping");
      }
    }
  }

  if (syncBrands.length === 0) throw new Error("No brand modes could be created");
  progress("Syncing brands: " + syncBrands.join(", "));

  // Step 3: Build variable lookup map
  progress("Step 3: Building variable lookup...");
  var allVars = await figma.variables.getLocalVariablesAsync();
  var varMap = {};
  for (var vi = 0; vi < allVars.length; vi++) {
    if (allVars[vi].variableCollectionId === collection.id) {
      varMap[allVars[vi].name] = allVars[vi];
    }
  }

  // Step 4: Get component tokens from first synced brand
  var firstBrand = payload[syncBrands[0]];
  if (!firstBrand || !firstBrand.components) {
    throw new Error("No components found in payload for " + syncBrands[0]);
  }
  var componentKeys = Object.keys(firstBrand.components);
  progress("Step 4: Processing " + componentKeys.length + " component tokens...");

  var created = 0;
  var updated = 0;

  // Step 5: First pass — create/update non-alias variables
  for (var ki = 0; ki < componentKeys.length; ki++) {
    var figmaPath = componentKeys[ki];
    var tokenDef = firstBrand.components[figmaPath];
    if (tokenDef.aliasOf) continue;

    var variable = varMap[figmaPath];
    if (!variable) {
      var resolvedType = "FLOAT";
      if (tokenDef.type === "COLOR") resolvedType = "COLOR";
      else if (tokenDef.type === "STRING") resolvedType = "STRING";

      variable = figma.variables.createVariable(figmaPath, collection, resolvedType);
      varMap[figmaPath] = variable;
      created++;
    } else {
      updated++;
    }

    for (var bi = 0; bi < syncBrands.length; bi++) {
      var bId = syncBrands[bi];
      var brandToken = payload[bId].components[figmaPath];
      if (!brandToken) continue;

      var modeId = modeMap[bId];
      if (brandToken.type === "COLOR") {
        variable.setValueForMode(modeId, hexToFigmaRgb(brandToken.value));
      } else if (brandToken.type === "FLOAT") {
        variable.setValueForMode(modeId, (brandToken.value != null) ? brandToken.value : 0);
      } else if (brandToken.type === "STRING") {
        variable.setValueForMode(modeId, (brandToken.value != null) ? brandToken.value : "");
      }
    }
  }

  progress("Variables: " + created + " created, " + updated + " updated. Wiring aliases...");

  // Step 6: Second pass — handle -default alias tokens
  var aliases = 0;
  for (var ai = 0; ai < componentKeys.length; ai++) {
    var aliasPath = componentKeys[ai];
    var aliasDef = firstBrand.components[aliasPath];
    if (!aliasDef.aliasOf) continue;

    var aliasVar = varMap[aliasPath];
    if (!aliasVar) {
      var aliasType = (aliasDef.type === "STRING") ? "STRING" : "FLOAT";
      aliasVar = figma.variables.createVariable(aliasPath, collection, aliasType);
      varMap[aliasPath] = aliasVar;
    }

    for (var abi = 0; abi < syncBrands.length; abi++) {
      var abId = syncBrands[abi];
      var abToken = payload[abId].components[aliasPath];
      if (!abToken || !abToken.aliasOf) continue;

      var targetVar = varMap[abToken.aliasOf];
      if (targetVar) {
        var abModeId = modeMap[abId];
        var alias = figma.variables.createVariableAlias(targetVar);
        aliasVar.setValueForMode(abModeId, alias);
        aliases++;
      }
    }
  }

  progress("Variables done: " + created + " created, " + updated + " updated, " + aliases + " aliases.");

  // Step 7: Build visual components
  progress("Step 7: Building visual components...");
  await buildComponents(varMap);

  var doneMsg = "Sync complete! " + created + " vars, " + aliases + " aliases, components built.";
  if (syncBrands.length < brandIds.length) {
    doneMsg += " (" + (brandIds.length - syncBrands.length) + " brands skipped)";
  }
  progress(doneMsg);
  figma.ui.postMessage({ type: "sync-complete", success: true, message: doneMsg });
}

// ---------------------------------------------------------------------------
// Component builders
// ---------------------------------------------------------------------------

async function buildComponents(varMap) {
  var page = figma.currentPage;

  // Remove previously generated component sets to avoid duplicates
  cleanupExistingComponents(page);

  // Load font for button text
  var font = await loadFont();

  progress("Creating Button component set...");
  buildButtonComponentSet(varMap, page, font);

  progress("Creating Switch component set...");
  buildSwitchComponentSet(varMap, page);

  progress("Components created.");
}

function cleanupExistingComponents(page) {
  var children = page.children;
  for (var i = children.length - 1; i >= 0; i--) {
    var child = children[i];
    if (child.type === "COMPONENT_SET" && (child.name === "Button" || child.name === "Switch")) {
      child.remove();
    }
    // Also clean up standalone components from failed previous runs
    if (child.type === "COMPONENT" && (
      child.name.indexOf("Variant=") === 0 || child.name.indexOf("State=") === 0
    )) {
      child.remove();
    }
  }
}

async function loadFont() {
  // Try Inter Semi Bold first, then Regular, then Roboto as fallback
  var fonts = [
    { family: "Inter", style: "Semi Bold" },
    { family: "Inter", style: "SemiBold" },
    { family: "Inter", style: "Medium" },
    { family: "Inter", style: "Regular" },
    { family: "Roboto", style: "Regular" }
  ];
  for (var fi = 0; fi < fonts.length; fi++) {
    try {
      await figma.loadFontAsync(fonts[fi]);
      return fonts[fi];
    } catch (e) {
      // try next
    }
  }
  throw new Error("Could not load any font");
}

// Helper: safely bind a variable to a scalar node property (padding, radius, etc.)
function bindVar(node, field, variable) {
  if (!variable) return;
  try {
    node.setBoundVariable(field, variable);
  } catch (e) {
    progress("Bind failed: " + field + " — " + String(e));
  }
}

// Helper: bind a COLOR variable to fills or strokes paint array
function bindPaintVar(node, paintType, paintIndex, variable) {
  if (!variable) return;
  try {
    var paints = node[paintType].slice();
    if (!paints[paintIndex]) return;
    paints[paintIndex] = figma.variables.setBoundVariableForPaint(paints[paintIndex], "color", variable);
    node[paintType] = paints;
  } catch (e) {
    progress("Paint bind failed: " + paintType + "[" + paintIndex + "] — " + String(e));
  }
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

function buildButtonComponentSet(varMap, page, font) {
  var variants = ["filled", "outlined", "ghost"];
  var sizes = ["xs", "sm", "md", "lg", "xl"];
  var states = ["default", "hover", "focus", "pressed", "disabled"];
  var components = [];

  // Known button heights per size for accurate spacing
  var sizeHeights = { xs: 28, sm: 36, md: 42, lg: 50, xl: 60 };
  var gap = 16;
  var colGap = 16;

  // Pre-calculate y offset for each (size, state) row
  var rowYOffsets = [];
  var runningY = 0;
  for (var rsi = 0; rsi < sizes.length; rsi++) {
    for (var rsti = 0; rsti < states.length; rsti++) {
      rowYOffsets.push(runningY);
      runningY += sizeHeights[sizes[rsi]] + gap;
    }
  }

  // Estimate column width: widest button (xl) has ~28px padding each side + ~60px text
  var colWidth = 160 + colGap;

  for (var vi = 0; vi < variants.length; vi++) {
    var variant = variants[vi];
    var capVariant = variant.charAt(0).toUpperCase() + variant.slice(1);

    for (var si = 0; si < sizes.length; si++) {
      var size = sizes[si];
      var capSize = size.toUpperCase();

      for (var sti = 0; sti < states.length; sti++) {
        var state = states[sti];
        var capState = state.charAt(0).toUpperCase() + state.slice(1);

        var comp = figma.createComponent();
        comp.name = "Variant=" + capVariant + ", Size=" + capSize + ", State=" + capState;

        // Auto-layout: horizontal, center-aligned
        comp.layoutMode = "HORIZONTAL";
        comp.primaryAxisAlignItems = "CENTER";
        comp.counterAxisAlignItems = "CENTER";
        comp.primaryAxisSizingMode = "AUTO";
        comp.counterAxisSizingMode = "AUTO";

        // Initial dimensions (overridden by variable bindings)
        comp.paddingLeft = 14;
        comp.paddingRight = 14;
        comp.paddingTop = 6;
        comp.paddingBottom = 6;
        comp.cornerRadius = 8;
        comp.minHeight = 36;

        // --- Color variable paths for this state ---
        var bgPath = btnColorPath(variant, "background", state);
        var textPath = btnColorPath(variant, "text", state);
        var borderPath = btnColorPath(variant, "border", state);

        // Background fill
        var bgVar = varMap[bgPath];
        if (variant === "ghost" && (state === "default" || state === "focus" || state === "disabled")) {
          comp.fills = [];
        } else {
          comp.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
          bindPaintVar(comp, "fills", 0, bgVar);
        }

        // Stroke/border
        var borderVar = varMap[borderPath];
        if (variant === "outlined" && borderVar) {
          comp.strokes = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
          comp.strokeWeight = 1.5;
          bindPaintVar(comp, "strokes", 0, borderVar);
        } else {
          comp.strokes = [];
        }

        // Bind SIZE-SPECIFIC dimensions
        bindVar(comp, "paddingLeft", varMap["button/padding-x-" + size]);
        bindVar(comp, "paddingRight", varMap["button/padding-x-" + size]);
        bindVar(comp, "paddingTop", varMap["button/padding-y-" + size]);
        bindVar(comp, "paddingBottom", varMap["button/padding-y-" + size]);
        bindVar(comp, "topLeftRadius", varMap["button/border-radius"]);
        bindVar(comp, "topRightRadius", varMap["button/border-radius"]);
        bindVar(comp, "bottomLeftRadius", varMap["button/border-radius"]);
        bindVar(comp, "bottomRightRadius", varMap["button/border-radius"]);
        bindVar(comp, "minHeight", varMap["button/height-" + size]);
        bindVar(comp, "strokeWeight", varMap["button/border-width"]);

        // Text node
        var textNode = figma.createText();
        textNode.fontName = font;
        textNode.characters = "Button";
        textNode.fontSize = 14;

        // Text color
        if (variant === "filled" && state !== "disabled") {
          textNode.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
        } else {
          textNode.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
        }
        bindPaintVar(textNode, "fills", 0, varMap[textPath]);

        // Bind SIZE-SPECIFIC font size
        bindVar(textNode, "fontSize", varMap["button/font-size-" + size]);

        comp.appendChild(textNode);

        // Focus ring effect
        if (state === "focus") {
          comp.effects = [{
            type: "DROP_SHADOW",
            color: { r: 0.2, g: 0.53, b: 0.9, a: 0.4 },
            offset: { x: 0, y: 0 },
            radius: 0,
            spread: 3,
            visible: true,
            blendMode: "NORMAL"
          }];
        }

        // Disabled opacity
        if (state === "disabled") {
          comp.opacity = 0.6;
        }

        // Grid layout: columns = variants, rows = size groups × states
        var rowIndex = (si * states.length) + sti;
        comp.x = vi * colWidth;
        comp.y = rowYOffsets[rowIndex];
        page.appendChild(comp);
        components.push(comp);
      }
    }
  }

  progress("Created " + components.length + " button variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Button";
  componentSet.x = 0;
  componentSet.y = 0;
}

// Build the figmaPath for a button color token given variant, property, and state
function btnColorPath(variant, property, state) {
  if (state === "default") {
    return "button/" + variant + "-" + property;
  }
  return "button/" + variant + "-" + property + "-" + state;
}

// ---------------------------------------------------------------------------
// Switch
// ---------------------------------------------------------------------------

function buildSwitchComponentSet(varMap, page) {
  var states = ["Unchecked", "Checked"];
  var components = [];

  for (var si = 0; si < states.length; si++) {
    var isChecked = (states[si] === "Checked");
    var comp = figma.createComponent();
    comp.name = "State=" + states[si];

    // Track: horizontal auto-layout, fixed size
    comp.layoutMode = "HORIZONTAL";
    comp.primaryAxisSizingMode = "FIXED";
    comp.counterAxisSizingMode = "FIXED";
    comp.counterAxisAlignItems = "CENTER";
    comp.resize(42, 22);
    comp.paddingLeft = 2;
    comp.paddingRight = 2;
    comp.paddingTop = 2;
    comp.paddingBottom = 2;
    comp.cornerRadius = 11;

    // Track fill
    if (isChecked) {
      comp.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
      bindPaintVar(comp, "fills", 0, varMap["switch/track-background-checked"]);
    } else {
      comp.fills = [{ type: "SOLID", color: { r: 0.87, g: 0.87, b: 0.87 } }];
      bindPaintVar(comp, "fills", 0, varMap["switch/track-background"]);
    }

    // Track border — inside alignment keeps it crisp
    comp.strokes = [{ type: "SOLID", color: { r: 0.78, g: 0.78, b: 0.78 } }];
    comp.strokeWeight = 1.5;
    comp.strokeAlign = "INSIDE";
    bindPaintVar(comp, "strokes", 0, varMap["switch/track-border"]);

    // Bind track dimensions
    bindVar(comp, "width", varMap["switch/width-default"]);
    bindVar(comp, "height", varMap["switch/height-default"]);
    bindVar(comp, "topLeftRadius", varMap["switch/border-radius-default"]);
    bindVar(comp, "topRightRadius", varMap["switch/border-radius-default"]);
    bindVar(comp, "bottomLeftRadius", varMap["switch/border-radius-default"]);
    bindVar(comp, "bottomRightRadius", varMap["switch/border-radius-default"]);

    // Spacer + Thumb approach for alignment
    // For checked: spacer first, then thumb (pushes thumb right)
    // For unchecked: thumb first, then spacer (keeps thumb left)

    var spacer = figma.createFrame();
    spacer.fills = [];
    spacer.layoutGrow = 1;
    spacer.layoutAlign = "STRETCH";
    spacer.resize(1, 1);

    var thumb = figma.createEllipse();
    thumb.resize(18, 18);
    thumb.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    thumb.effects = [{
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.15 },
      offset: { x: 0, y: 1 },
      radius: 3,
      spread: 0,
      visible: true,
      blendMode: "NORMAL"
    }];
    bindPaintVar(thumb, "fills", 0, varMap["switch/thumb-background"]);

    // Bind thumb size
    var thumbSizeVar = varMap["switch/thumb-size-default"];
    bindVar(thumb, "width", thumbSizeVar);
    bindVar(thumb, "height", thumbSizeVar);

    if (isChecked) {
      comp.appendChild(spacer);
      comp.appendChild(thumb);
    } else {
      comp.appendChild(thumb);
      comp.appendChild(spacer);
    }

    comp.x = si * 80;
    comp.y = 0;
    page.appendChild(comp);
    components.push(comp);
  }

  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Switch";
  componentSet.x = 0;
  componentSet.y = 200;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function progress(msg) {
  figma.ui.postMessage({ type: "sync-progress", message: msg });
}

function hexToFigmaRgb(hex) {
  if (!hex || hex === "transparent") {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  var c = hex.replace("#", "");
  return {
    r: parseInt(c.substring(0, 2), 16) / 255,
    g: parseInt(c.substring(2, 4), 16) / 255,
    b: parseInt(c.substring(4, 6), 16) / 255,
    a: c.length === 8 ? parseInt(c.substring(6, 8), 16) / 255 : 1,
  };
}
