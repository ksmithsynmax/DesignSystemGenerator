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

  // Load font for button text and switch labels
  var font = await loadFont();

  progress("Creating Button component set...");
  buildButtonComponentSet(varMap, page, font);

  progress("Creating Switch component set...");
  buildSwitchComponentSet(varMap, page, font);

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
      child.name.indexOf("Variant=") === 0 || child.name.indexOf("State=") === 0 ||
      child.name.indexOf("Size=") === 0 || child.name.indexOf("Checked=") === 0
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

function buildSwitchComponentSet(varMap, page, font) {
  var sizes = ["xs", "sm", "md", "lg", "xl"];
  var checkedStates = [false, true];
  var states = ["default", "hover", "focus", "pressed", "disabled"];
  var labelModes = ["hide", "show"];
  var components = [];

  // Known switch heights per size for dynamic grid spacing
  var sizeHeights = { xs: 16, sm: 18, md: 22, lg: 28, xl: 34 };
  var gap = 16;
  var colGap = 16;

  // Pre-calculate y offsets: rows = (size × state)
  var rowYOffsets = [];
  var runningY = 0;
  for (var rsi = 0; rsi < sizes.length; rsi++) {
    for (var rsti = 0; rsti < states.length; rsti++) {
      rowYOffsets.push(runningY);
      // Row height = max of track height vs label line-height (xl=24), plus gap
      var rowH = sizeHeights[sizes[rsi]];
      if (rowH < 24) rowH = 24;
      runningY += rowH + gap;
    }
  }

  // Column width: track (~64px max) + gap (~14px) + label (~40px) + padding
  var colWidth = 140 + colGap;

  for (var ci = 0; ci < checkedStates.length; ci++) {
    var isChecked = checkedStates[ci];
    var capChecked = isChecked ? "True" : "False";

    for (var li = 0; li < labelModes.length; li++) {
      var showLabel = (labelModes[li] === "show");
      var capLabel = showLabel ? "Show" : "Hide";

      for (var si = 0; si < sizes.length; si++) {
        var size = sizes[si];
        var capSize = size.toUpperCase();

        for (var sti = 0; sti < states.length; sti++) {
          var state = states[sti];
          var capState = state.charAt(0).toUpperCase() + state.slice(1);

          var comp = figma.createComponent();
          comp.name = "Size=" + capSize + ", Checked=" + capChecked +
                      ", State=" + capState + ", Label=" + capLabel;

          // Root: horizontal auto-layout wrapper (track + optional label)
          comp.layoutMode = "HORIZONTAL";
          comp.primaryAxisSizingMode = "AUTO";
          comp.counterAxisSizingMode = "AUTO";
          comp.counterAxisAlignItems = "CENTER";
          comp.itemSpacing = 10;
          comp.fills = [];

          // Bind label gap to size-specific variable
          bindVar(comp, "itemSpacing", varMap["switch/label-gap-" + size]);

          // --- Track child frame ---
          var track = figma.createFrame();
          track.name = "Track";
          track.layoutMode = "HORIZONTAL";
          track.primaryAxisSizingMode = "FIXED";
          track.counterAxisSizingMode = "FIXED";
          track.counterAxisAlignItems = "CENTER";
          track.resize(42, 22);
          track.paddingLeft = 2;
          track.paddingRight = 2;
          track.paddingTop = 2;
          track.paddingBottom = 2;
          track.cornerRadius = 11;

          // Bind track dimensions to size-specific variables
          bindVar(track, "width", varMap["switch/width-" + size]);
          bindVar(track, "height", varMap["switch/height-" + size]);
          bindVar(track, "topLeftRadius", varMap["switch/border-radius-" + size]);
          bindVar(track, "topRightRadius", varMap["switch/border-radius-" + size]);
          bindVar(track, "bottomLeftRadius", varMap["switch/border-radius-" + size]);
          bindVar(track, "bottomRightRadius", varMap["switch/border-radius-" + size]);

          // Track fill — state + checked specific
          var trackBgPath = switchTrackBgPath(isChecked, state);
          if (isChecked) {
            track.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
          } else {
            track.fills = [{ type: "SOLID", color: { r: 0.87, g: 0.87, b: 0.87 } }];
          }
          bindPaintVar(track, "fills", 0, varMap[trackBgPath]);

          // Track border — state specific
          var trackBorderPath = switchTrackBorderPath(state);
          track.strokes = [{ type: "SOLID", color: { r: 0.78, g: 0.78, b: 0.78 } }];
          track.strokeWeight = 1.5;
          track.strokeAlign = "INSIDE";
          bindPaintVar(track, "strokes", 0, varMap[trackBorderPath]);
          bindVar(track, "strokeWeight", varMap["switch/track-border-width"]);

          // --- Spacer + Thumb ---
          var spacer = figma.createFrame();
          spacer.name = "Spacer";
          spacer.fills = [];
          spacer.layoutGrow = 1;
          spacer.layoutAlign = "STRETCH";
          spacer.resize(1, 1);

          var thumb = figma.createEllipse();
          thumb.name = "Thumb";
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

          // Thumb background — state specific
          var thumbBgPath = switchThumbBgPath(state);
          bindPaintVar(thumb, "fills", 0, varMap[thumbBgPath]);
          bindVar(thumb, "width", varMap["switch/thumb-size-" + size]);
          bindVar(thumb, "height", varMap["switch/thumb-size-" + size]);

          // Thumb position: spacer pushes thumb to correct side
          if (isChecked) {
            track.appendChild(spacer);
            track.appendChild(thumb);
          } else {
            track.appendChild(thumb);
            track.appendChild(spacer);
          }

          comp.appendChild(track);

          // --- Optional label text node ---
          if (showLabel) {
            var labelNode = figma.createText();
            labelNode.name = "Label";
            labelNode.fontName = font;
            labelNode.characters = "Label";
            labelNode.fontSize = 14;

            // Label text color — state specific
            var labelTextPath = switchLabelTextPath(state);
            labelNode.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
            bindPaintVar(labelNode, "fills", 0, varMap[labelTextPath]);
            bindVar(labelNode, "fontSize", varMap["switch/label-font-size-" + size]);
            comp.appendChild(labelNode);
          }

          // Focus ring on the track (not root)
          if (state === "focus") {
            track.effects = [{
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

          // Grid placement: columns = (checked × label), rows = (size × state)
          var colIndex = ci * labelModes.length + li;
          var rowIndex = (si * states.length) + sti;
          comp.x = colIndex * colWidth;
          comp.y = rowYOffsets[rowIndex];
          page.appendChild(comp);
          components.push(comp);
        }
      }
    }
  }

  progress("Created " + components.length + " switch variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Switch";
  componentSet.x = 0;
  componentSet.y = 800;
}

// Helper: build figmaPath for switch track background given checked state and interaction state
function switchTrackBgPath(isChecked, state) {
  var base = isChecked ? "switch/track-background-checked" : "switch/track-background";
  if (state === "default") return base;
  return base + "-" + state;
}

// Helper: build figmaPath for switch track border given interaction state
function switchTrackBorderPath(state) {
  if (state === "default") return "switch/track-border";
  return "switch/track-border-" + state;
}

// Helper: build figmaPath for switch thumb background given interaction state
function switchThumbBgPath(state) {
  if (state === "disabled") return "switch/thumb-background-disabled";
  return "switch/thumb-background";
}

// Helper: build figmaPath for switch label text given interaction state
function switchLabelTextPath(state) {
  if (state === "disabled") return "switch/label-text-disabled";
  return "switch/label-text";
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
