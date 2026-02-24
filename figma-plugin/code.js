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
  // Extract globalPrimitives and brand IDs from payload
  var globalPrimitives = payload.globalPrimitives || {};
  var allKeys = Object.keys(payload);
  var brandIds = [];
  for (var ki = 0; ki < allKeys.length; ki++) {
    if (allKeys[ki] !== "globalPrimitives") {
      brandIds.push(allKeys[ki]);
    }
  }
  if (brandIds.length === 0) throw new Error("No brands in payload");

  progress("Starting sync for brands: " + brandIds.join(", "));

  // ── Step 1: Find or create collections ──
  progress("Step 1: Finding or creating collections...");
  var collections = await figma.variables.getLocalVariableCollectionsAsync();

  // Primitive collections: Global (single mode) + one per brand (single mode)
  var globalPrimCol = findOrCreateCollection(collections, "Primitive/Global");
  var brandPrimCols = {};
  for (var bci = 0; bci < brandIds.length; bci++) {
    var bId = brandIds[bci];
    var brandName = bId.charAt(0).toUpperCase() + bId.slice(1);
    brandPrimCols[bId] = findOrCreateCollection(collections, "Primitive/" + brandName);
  }

  // Semantic + Components: brand × theme modes
  var semanticCol = findOrCreateCollection(collections, "Semantic");
  var componentsCol = findOrCreateCollection(collections, "Components");

  // ── Step 2: Build mode entries (brand × theme) and set up modes ──
  progress("Step 2: Setting up brand × theme modes...");
  var themes = ["light", "dark"];
  var modeEntries = [];
  for (var mei = 0; mei < brandIds.length; mei++) {
    var meBrandId = brandIds[mei];
    var meCapBrand = meBrandId.charAt(0).toUpperCase() + meBrandId.slice(1);
    for (var ti = 0; ti < themes.length; ti++) {
      var capTheme = themes[ti].charAt(0).toUpperCase() + themes[ti].slice(1);
      modeEntries.push({
        key: meBrandId + "-" + themes[ti],
        name: meCapBrand + " " + capTheme,
        brandId: meBrandId,
        theme: themes[ti],
      });
    }
  }

  var semModes = ensureCollectionModes(semanticCol, modeEntries);
  var compModes = ensureCollectionModes(componentsCol, modeEntries);

  // Build syncModes — modes that succeeded on both collections
  var syncModes = [];
  for (var smi = 0; smi < modeEntries.length; smi++) {
    var smEntry = modeEntries[smi];
    if (semModes.modeMap[smEntry.key] && compModes.modeMap[smEntry.key]) {
      syncModes.push(smEntry);
    }
  }
  if (syncModes.length === 0) throw new Error("No modes could be created");

  // Extract unique brand IDs from successful modes
  var syncBrands = [];
  var syncBrandSet = {};
  for (var sbi = 0; sbi < syncModes.length; sbi++) {
    var sbId = syncModes[sbi].brandId;
    if (!syncBrandSet[sbId]) {
      syncBrands.push(sbId);
      syncBrandSet[sbId] = true;
    }
  }
  progress("Syncing " + syncModes.length + " modes across " + syncBrands.length + " brands");

  // ── Step 3: Build variable lookup maps ──
  progress("Step 3: Building variable lookups...");
  var allVars = await figma.variables.getLocalVariablesAsync();
  var globalPrimVarMap = {};   // variables in Primitive/Global
  var brandPrimVarMaps = {};   // { brandId: { varName: var } }
  var semanticVarMap = {};
  var componentVarMap = {};

  for (var bmi = 0; bmi < syncBrands.length; bmi++) {
    brandPrimVarMaps[syncBrands[bmi]] = {};
  }

  for (var vi = 0; vi < allVars.length; vi++) {
    var v = allVars[vi];
    if (v.variableCollectionId === globalPrimCol.id) {
      globalPrimVarMap[v.name] = v;
    } else if (v.variableCollectionId === semanticCol.id) {
      semanticVarMap[v.name] = v;
    } else if (v.variableCollectionId === componentsCol.id) {
      componentVarMap[v.name] = v;
    } else {
      // Check brand primitive collections
      for (var bvi = 0; bvi < syncBrands.length; bvi++) {
        var bvId = syncBrands[bvi];
        if (brandPrimCols[bvId] && v.variableCollectionId === brandPrimCols[bvId].id) {
          brandPrimVarMaps[bvId][v.name] = v;
          break;
        }
      }
    }
  }

  // ── Clean up old "Primitives" collection (replaced by Primitive/Global + Primitive/[Brand]) ──
  for (var oci = 0; oci < collections.length; oci++) {
    if (collections[oci].name === "Primitives") {
      progress("Removing old 'Primitives' collection...");
      var oldPrimCol = collections[oci];
      // Remove variables in the old collection first
      for (var ovi = 0; ovi < allVars.length; ovi++) {
        if (allVars[ovi].variableCollectionId === oldPrimCol.id) {
          allVars[ovi].remove();
        }
      }
      oldPrimCol.remove();
      progress("Old 'Primitives' collection removed.");
      break;
    }
  }

  var firstBrand = payload[syncBrands[0]];
  var totalCreated = 0;
  var totalAliases = 0;

  // ══════════════════════════════════════════════════════════════
  // PHASE 1a: Primitive/Global — single mode, raw COLOR values
  // ══════════════════════════════════════════════════════════════
  progress("Phase 1a: Syncing Primitive/Global...");
  var globalModeId = globalPrimCol.modes[0].modeId;
  var globalPaletteNames = Object.keys(globalPrimitives);
  for (var gpi = 0; gpi < globalPaletteNames.length; gpi++) {
    var gPalette = globalPaletteNames[gpi];
    var gPaletteArr = globalPrimitives[gPalette];
    for (var gIdx = 0; gIdx < gPaletteArr.length; gIdx++) {
      var gVarName = gPalette + "/" + gIdx;
      var gVar = globalPrimVarMap[gVarName];
      if (!gVar) {
        gVar = figma.variables.createVariable(gVarName, globalPrimCol, "COLOR");
        globalPrimVarMap[gVarName] = gVar;
        totalCreated++;
      }
      gVar.setValueForMode(globalModeId, hexToFigmaRgb(gPaletteArr[gIdx]));
    }
  }
  // Remove stale global primitive variables (from previous syncs with different palettes)
  var globalExpected = {};
  for (var gei = 0; gei < globalPaletteNames.length; gei++) {
    var gePalette = globalPaletteNames[gei];
    for (var geIdx = 0; geIdx < globalPrimitives[gePalette].length; geIdx++) {
      globalExpected[gePalette + "/" + geIdx] = true;
    }
  }
  var globalStale = 0;
  var globalVarNames = Object.keys(globalPrimVarMap);
  for (var gsi = 0; gsi < globalVarNames.length; gsi++) {
    if (!globalExpected[globalVarNames[gsi]]) {
      globalPrimVarMap[globalVarNames[gsi]].remove();
      delete globalPrimVarMap[globalVarNames[gsi]];
      globalStale++;
    }
  }
  if (globalStale > 0) progress("  Removed " + globalStale + " stale Primitive/Global variables");
  progress("Primitive/Global: " + Object.keys(globalPrimVarMap).length + " variables");

  // ══════════════════════════════════════════════════════════════
  // PHASE 1b: Primitive/[Brand] — single mode per brand, raw COLOR values
  // ══════════════════════════════════════════════════════════════
  for (var bpi = 0; bpi < syncBrands.length; bpi++) {
    var bpId = syncBrands[bpi];
    var bpName = bpId.charAt(0).toUpperCase() + bpId.slice(1);
    progress("Phase 1b: Syncing Primitive/" + bpName + "...");
    var bpCol = brandPrimCols[bpId];
    var bpModeId = bpCol.modes[0].modeId;
    var bpPalettes = payload[bpId].primitives;
    var bpPaletteNames = Object.keys(bpPalettes);
    for (var bppi = 0; bppi < bpPaletteNames.length; bppi++) {
      var bpPalette = bpPaletteNames[bppi];
      var bpArr = bpPalettes[bpPalette];
      for (var bpIdx = 0; bpIdx < bpArr.length; bpIdx++) {
        var bpVarName = bpPalette + "/" + bpIdx;
        var bpVar = brandPrimVarMaps[bpId][bpVarName];
        if (!bpVar) {
          bpVar = figma.variables.createVariable(bpVarName, bpCol, "COLOR");
          brandPrimVarMaps[bpId][bpVarName] = bpVar;
          totalCreated++;
        }
        bpVar.setValueForMode(bpModeId, hexToFigmaRgb(bpArr[bpIdx]));
      }
    }
    // Remove stale brand primitive variables (e.g. old white/gray from previous syncs)
    var bpExpected = {};
    for (var bei = 0; bei < bpPaletteNames.length; bei++) {
      var bePalette = bpPaletteNames[bei];
      for (var beIdx = 0; beIdx < bpPalettes[bePalette].length; beIdx++) {
        bpExpected[bePalette + "/" + beIdx] = true;
      }
    }
    var bpStale = 0;
    var bpVarNames = Object.keys(brandPrimVarMaps[bpId]);
    for (var bsi = 0; bsi < bpVarNames.length; bsi++) {
      if (!bpExpected[bpVarNames[bsi]]) {
        brandPrimVarMaps[bpId][bpVarNames[bsi]].remove();
        delete brandPrimVarMaps[bpId][bpVarNames[bsi]];
        bpStale++;
      }
    }
    if (bpStale > 0) progress("  Removed " + bpStale + " stale Primitive/" + bpName + " variables");
    progress("Primitive/" + bpName + ": " + Object.keys(brandPrimVarMaps[bpId]).length + " variables");
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE 2: Semantic — alias to Primitive variables (brand × theme modes)
  // ══════════════════════════════════════════════════════════════
  progress("Phase 2: Syncing Semantic tokens...");
  // Get semantic keys from first mode's light theme
  var firstBrandSemantic = firstBrand.semantic.light || firstBrand.semantic;
  var semanticKeys = Object.keys(firstBrandSemantic);
  for (var si = 0; si < semanticKeys.length; si++) {
    var semKey = semanticKeys[si];
    var semVar = semanticVarMap[semKey];
    if (!semVar) {
      semVar = figma.variables.createVariable(semKey, semanticCol, "COLOR");
      semanticVarMap[semKey] = semVar;
      totalCreated++;
    }
    for (var smi2 = 0; smi2 < syncModes.length; smi2++) {
      var mode = syncModes[smi2];
      var modeSemantic = payload[mode.brandId].semantic[mode.theme];
      if (!modeSemantic) continue;
      var semToken = modeSemantic[semKey];
      if (!semToken) continue;
      // semToken.alias is e.g. "blue/5" — look up in brand primitives first, then global
      var primTarget = brandPrimVarMaps[mode.brandId][semToken.alias] || globalPrimVarMap[semToken.alias];
      if (primTarget) {
        var semAlias = figma.variables.createVariableAlias(primTarget);
        semVar.setValueForMode(semModes.modeMap[mode.key], semAlias);
        totalAliases++;
      } else {
        // Fallback: set raw value if primitive not found
        progress("  Warning: primitive " + semToken.alias + " not found for " + mode.key + ", using raw value");
        semVar.setValueForMode(semModes.modeMap[mode.key], hexToFigmaRgb(semToken.value));
      }
    }
  }
  progress("Semantic: " + Object.keys(semanticVarMap).length + " variables, " + totalAliases + " aliases");

  // ══════════════════════════════════════════════════════════════
  // PHASE 3: Components — alias to Semantic (COLOR) or raw (FLOAT/STRING)
  // ══════════════════════════════════════════════════════════════
  progress("Phase 3: Syncing Component tokens...");
  var componentKeys = Object.keys(firstBrand.components);
  var compCreated = 0;
  var compAliases = 0;

  // Pass 1: Non-alias variables
  for (var ki2 = 0; ki2 < componentKeys.length; ki2++) {
    var figmaPath = componentKeys[ki2];
    var tokenDef = firstBrand.components[figmaPath];
    if (tokenDef.aliasOf) continue;

    var compVar = componentVarMap[figmaPath];
    if (!compVar) {
      var resolvedType = "FLOAT";
      if (tokenDef.type === "COLOR") resolvedType = "COLOR";
      else if (tokenDef.type === "STRING") resolvedType = "STRING";

      compVar = figma.variables.createVariable(figmaPath, componentsCol, resolvedType);
      componentVarMap[figmaPath] = compVar;
      compCreated++;
    }

    for (var cmi = 0; cmi < syncModes.length; cmi++) {
      var cMode = syncModes[cmi];
      var brandToken = payload[cMode.brandId].components[figmaPath];
      if (!brandToken) continue;

      var cModeId = compModes.modeMap[cMode.key];

      if (brandToken.type === "COLOR") {
        // Try to alias to semantic variable
        if (brandToken.alias && semanticVarMap[brandToken.alias]) {
          var compAlias = figma.variables.createVariableAlias(semanticVarMap[brandToken.alias]);
          compVar.setValueForMode(cModeId, compAlias);
          compAliases++;
        } else {
          // No semantic (transparent/null) — set raw value
          compVar.setValueForMode(cModeId, hexToFigmaRgb(brandToken.value));
        }
      } else if (brandToken.type === "FLOAT") {
        compVar.setValueForMode(cModeId, (brandToken.value != null) ? brandToken.value : 0);
      } else if (brandToken.type === "STRING") {
        compVar.setValueForMode(cModeId, (brandToken.value != null) ? brandToken.value : "");
      }
    }
  }

  // Pass 2: -default alias tokens (within Components collection)
  for (var ai = 0; ai < componentKeys.length; ai++) {
    var aliasPath = componentKeys[ai];
    var aliasDef = firstBrand.components[aliasPath];
    if (!aliasDef.aliasOf) continue;

    var aliasVar = componentVarMap[aliasPath];
    if (!aliasVar) {
      var aliasType = (aliasDef.type === "STRING") ? "STRING" : "FLOAT";
      aliasVar = figma.variables.createVariable(aliasPath, componentsCol, aliasType);
      componentVarMap[aliasPath] = aliasVar;
      compCreated++;
    }

    for (var ami = 0; ami < syncModes.length; ami++) {
      var aMode = syncModes[ami];
      var abToken = payload[aMode.brandId].components[aliasPath];
      if (!abToken || !abToken.aliasOf) continue;

      var targetVar = componentVarMap[abToken.aliasOf];
      if (targetVar) {
        var abModeId = compModes.modeMap[aMode.key];
        var defaultAlias = figma.variables.createVariableAlias(targetVar);
        aliasVar.setValueForMode(abModeId, defaultAlias);
        compAliases++;
      }
    }
  }

  totalCreated += compCreated;
  totalAliases += compAliases;
  progress("Components: " + compCreated + " created, " + compAliases + " aliases");

  // ── Build visual components ──
  progress("Building visual components...");
  await buildComponents(componentVarMap);

  var doneMsg = "Sync complete! " + totalCreated + " vars, " + totalAliases + " aliases, " + syncModes.length + " modes, components built.";
  if (syncModes.length < modeEntries.length) {
    doneMsg += " (" + (modeEntries.length - syncModes.length) + " modes skipped)";
  }
  progress(doneMsg);
  figma.ui.postMessage({ type: "sync-complete", success: true, message: doneMsg });
}

// ---------------------------------------------------------------------------
// Collection helpers
// ---------------------------------------------------------------------------

function findOrCreateCollection(collections, name) {
  for (var i = 0; i < collections.length; i++) {
    if (collections[i].name === name) {
      return collections[i];
    }
  }
  return figma.variables.createVariableCollection(name);
}

function ensureCollectionModes(collection, modeEntries) {
  var modeMap = {};
  var existingModes = collection.modes.slice();
  var usedModeIds = {};

  // First pass: find exact name matches
  for (var i = 0; i < modeEntries.length; i++) {
    var entry = modeEntries[i];
    for (var mi = 0; mi < existingModes.length; mi++) {
      if (existingModes[mi].name === entry.name) {
        modeMap[entry.key] = existingModes[mi].modeId;
        usedModeIds[existingModes[mi].modeId] = true;
        break;
      }
    }
  }

  // Collect unused existing modes (for renaming)
  var unusedModes = [];
  for (var ui = 0; ui < existingModes.length; ui++) {
    if (!usedModeIds[existingModes[ui].modeId]) {
      unusedModes.push(existingModes[ui]);
    }
  }

  // Second pass: for unmatched entries, reuse unused modes or create new
  for (var j = 0; j < modeEntries.length; j++) {
    if (modeMap[modeEntries[j].key]) continue; // already matched

    if (unusedModes.length > 0) {
      var reuse = unusedModes.shift();
      collection.renameMode(reuse.modeId, modeEntries[j].name);
      modeMap[modeEntries[j].key] = reuse.modeId;
      usedModeIds[reuse.modeId] = true;
    } else {
      try {
        var newId = collection.addMode(modeEntries[j].name);
        modeMap[modeEntries[j].key] = newId;
        usedModeIds[newId] = true;
      } catch (modeErr) {
        progress("Could not add mode " + modeEntries[j].name + " on " + collection.name + " — skipping");
      }
    }
  }

  // Clean up leftover unused modes
  var finalModes = collection.modes;
  for (var fi = finalModes.length - 1; fi >= 0; fi--) {
    if (!usedModeIds[finalModes[fi].modeId]) {
      try {
        collection.removeMode(finalModes[fi].modeId);
        progress("Removed old mode '" + finalModes[fi].name + "' from " + collection.name);
      } catch (e) {
        // Can't remove last mode — safe to ignore
      }
    }
  }

  return { modeMap: modeMap };
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

  var compSetGap = 300;

  progress("Creating Button component set...");
  var buttonSet = buildButtonComponentSet(varMap, page, font);

  progress("Creating Switch component set...");
  var switchSet = buildSwitchComponentSet(varMap, page, font);

  progress("Creating Checkbox component set...");
  var checkboxSet = await buildCheckboxComponentSet(varMap, page, font);

  progress("Creating Radio component set...");
  var radioSet = buildRadioComponentSet(varMap, page, font);

  progress("Creating Chip component set...");
  var chipSet = await buildChipComponentSet(varMap, page, font);

  // Position component sets side by side with gaps
  buttonSet.x = 0;
  buttonSet.y = 0;
  switchSet.x = buttonSet.x + buttonSet.width + compSetGap;
  switchSet.y = 0;
  checkboxSet.x = switchSet.x + switchSet.width + compSetGap;
  checkboxSet.y = 0;
  radioSet.x = checkboxSet.x + checkboxSet.width + compSetGap;
  radioSet.y = 0;
  chipSet.x = radioSet.x + radioSet.width + compSetGap;
  chipSet.y = 0;

  // Scroll viewport to show all component sets
  figma.viewport.scrollAndZoomIntoView([buttonSet, switchSet, checkboxSet, radioSet, chipSet]);

  progress("Components created.");
}

function cleanupExistingComponents(page) {
  var children = page.children;
  for (var i = children.length - 1; i >= 0; i--) {
    var child = children[i];
    if (child.type === "COMPONENT_SET" && (child.name === "Button" || child.name === "Switch" || child.name === "Checkbox" || child.name === "Radio" || child.name === "Chip")) {
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
  return componentSet;
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
  return componentSet;
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
// Checkbox
// ---------------------------------------------------------------------------

async function buildCheckboxComponentSet(varMap, page, font) {
  var sizes = ["xs", "sm", "md", "lg", "xl"];
  var checkedStates = ["unchecked", "checked", "indeterminate"];
  var states = ["default", "hover", "focus", "pressed", "disabled"];
  var labelModes = ["hide", "show"];
  var components = [];

  // Find icon components from the "icons" page
  var checkIconComp = null;
  var minusIconComp = null;
  var iconsPage = null;
  for (var pi = 0; pi < figma.root.children.length; pi++) {
    if (figma.root.children[pi].name.toLowerCase() === "icons") {
      iconsPage = figma.root.children[pi];
      break;
    }
  }
  if (iconsPage) {
    await iconsPage.loadAsync();
    var allNodes = iconsPage.findAll(function(n) {
      return n.type === "COMPONENT";
    });
    for (var ni = 0; ni < allNodes.length; ni++) {
      var nName = allNodes[ni].name.toLowerCase();
      if (!checkIconComp && nName.indexOf("check") >= 0 && nName.indexOf("circle") < 0 && nName.indexOf("square") < 0) {
        checkIconComp = allNodes[ni];
      }
      if (!minusIconComp && nName.indexOf("minus") >= 0 && nName.indexOf("circle") < 0 && nName.indexOf("square") < 0) {
        minusIconComp = allNodes[ni];
      }
    }
  }
  if (checkIconComp) console.log("[Checkbox] Found check icon: " + checkIconComp.name);
  else console.log("[Checkbox] WARNING: check icon not found on icons page");
  if (minusIconComp) console.log("[Checkbox] Found minus icon: " + minusIconComp.name);
  else console.log("[Checkbox] WARNING: minus icon not found on icons page");

  // Known checkbox sizes for dynamic grid spacing
  var sizeBoxSizes = { xs: 16, sm: 18, md: 20, lg: 24, xl: 28 };
  var sizeIconSizes = { xs: 10, sm: 12, md: 14, lg: 16, xl: 18 };
  var gap = 16;
  var colGap = 16;

  // Pre-calculate y offsets: rows = (size × state)
  var rowYOffsets = [];
  var runningY = 0;
  for (var rsi = 0; rsi < sizes.length; rsi++) {
    for (var rsti = 0; rsti < states.length; rsti++) {
      rowYOffsets.push(runningY);
      var rowH = sizeBoxSizes[sizes[rsi]];
      if (rowH < 24) rowH = 24;
      runningY += rowH + gap;
    }
  }

  // Column width: box + gap + label text
  var colWidth = 160 + colGap;

  for (var chi = 0; chi < checkedStates.length; chi++) {
    var checkedState = checkedStates[chi];
    var capChecked = checkedState.charAt(0).toUpperCase() + checkedState.slice(1);
    var isActive = (checkedState !== "unchecked"); // checked or indeterminate

    for (var li = 0; li < labelModes.length; li++) {
      var showLabel = (labelModes[li] === "show");
      var capLabel = showLabel ? "Show" : "Hide";

      for (var si = 0; si < sizes.length; si++) {
        var size = sizes[si];
        var capSize = size.toUpperCase();
        var boxSize = sizeBoxSizes[size];
        var iconSize = sizeIconSizes[size];

        for (var sti = 0; sti < states.length; sti++) {
          var state = states[sti];
          var capState = state.charAt(0).toUpperCase() + state.slice(1);

          var comp = figma.createComponent();
          comp.name = "Size=" + capSize + ", Checked=" + capChecked +
                      ", State=" + capState + ", Label=" + capLabel;

          // Root: horizontal auto-layout wrapper (box + optional label)
          comp.layoutMode = "HORIZONTAL";
          comp.primaryAxisSizingMode = "AUTO";
          comp.counterAxisSizingMode = "AUTO";
          comp.counterAxisAlignItems = "CENTER";
          comp.itemSpacing = 10;
          comp.fills = [];

          // Bind label gap
          bindVar(comp, "itemSpacing", varMap["checkbox/label-gap-" + size]);

          // --- Checkbox box frame ---
          var box = figma.createFrame();
          box.name = "Box";
          box.layoutMode = "HORIZONTAL";
          box.primaryAxisSizingMode = "FIXED";
          box.counterAxisSizingMode = "FIXED";
          box.primaryAxisAlignItems = "CENTER";
          box.counterAxisAlignItems = "CENTER";
          box.resize(boxSize, boxSize);
          box.cornerRadius = 5;
          box.clipsContent = true;

          // Bind box dimensions
          bindVar(box, "width", varMap["checkbox/size-" + size]);
          bindVar(box, "height", varMap["checkbox/size-" + size]);
          bindVar(box, "topLeftRadius", varMap["checkbox/border-radius-" + size]);
          bindVar(box, "topRightRadius", varMap["checkbox/border-radius-" + size]);
          bindVar(box, "bottomLeftRadius", varMap["checkbox/border-radius-" + size]);
          bindVar(box, "bottomRightRadius", varMap["checkbox/border-radius-" + size]);

          // Box fill — checked/indeterminate use checked bg, unchecked uses unchecked bg
          var boxBgPath = checkboxBgPath(checkedState, state);
          if (isActive) {
            box.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
          } else {
            box.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
          }
          bindPaintVar(box, "fills", 0, varMap[boxBgPath]);

          // Box border
          var boxBorderPath = checkboxBorderPath(state);
          if (!isActive) {
            // Unchecked: visible border
            box.strokes = [{ type: "SOLID", color: { r: 0.78, g: 0.78, b: 0.78 } }];
            box.strokeWeight = 1.5;
            box.strokeAlign = "INSIDE";
            bindPaintVar(box, "strokes", 0, varMap[boxBorderPath]);
            bindVar(box, "strokeWeight", varMap["checkbox/border-width"]);
          } else {
            // Checked/indeterminate: no border (filled bg is visible)
            box.strokes = [];
          }

          // --- Icon inside box (only for checked/indeterminate) ---
          // Instances from Untitled UI icons on the "icons" page
          if (checkedState === "checked" && checkIconComp) {
            var checkInst = checkIconComp.createInstance();
            checkInst.name = "Icon";
            box.appendChild(checkInst);
            checkInst.resize(iconSize, iconSize);
            bindVar(checkInst, "width", varMap["checkbox/icon-size-" + size]);
            bindVar(checkInst, "height", varMap["checkbox/icon-size-" + size]);

            // Override icon color on the vector children
            var iconColorPath = checkboxIconColorPath(state);
            var vectors = checkInst.findAll(function(n) { return n.type === "VECTOR"; });
            for (var vi = 0; vi < vectors.length; vi++) {
              if (vectors[vi].strokes && vectors[vi].strokes.length > 0) {
                vectors[vi].strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
                bindPaintVar(vectors[vi], "strokes", 0, varMap[iconColorPath]);
              }
              if (vectors[vi].fills && vectors[vi].fills.length > 0) {
                vectors[vi].fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
                bindPaintVar(vectors[vi], "fills", 0, varMap[iconColorPath]);
              }
            }
          } else if (checkedState === "indeterminate" && minusIconComp) {
            var minusInst = minusIconComp.createInstance();
            minusInst.name = "Icon";
            box.appendChild(minusInst);
            minusInst.resize(iconSize, iconSize);
            bindVar(minusInst, "width", varMap["checkbox/icon-size-" + size]);
            bindVar(minusInst, "height", varMap["checkbox/icon-size-" + size]);

            // Override icon color on the vector children
            var dashColorPath = checkboxIconColorPath(state);
            var dashVectors = minusInst.findAll(function(n) { return n.type === "VECTOR"; });
            for (var dvi = 0; dvi < dashVectors.length; dvi++) {
              if (dashVectors[dvi].strokes && dashVectors[dvi].strokes.length > 0) {
                dashVectors[dvi].strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
                bindPaintVar(dashVectors[dvi], "strokes", 0, varMap[dashColorPath]);
              }
              if (dashVectors[dvi].fills && dashVectors[dvi].fills.length > 0) {
                dashVectors[dvi].fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
                bindPaintVar(dashVectors[dvi], "fills", 0, varMap[dashColorPath]);
              }
            }
          }

          comp.appendChild(box);

          // --- Optional label ---
          if (showLabel) {
            var labelNode = figma.createText();
            labelNode.name = "Label";
            labelNode.fontName = font;
            labelNode.characters = "Label";
            labelNode.fontSize = 14;

            var labelTextPath = checkboxLabelTextPath(state);
            labelNode.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
            bindPaintVar(labelNode, "fills", 0, varMap[labelTextPath]);
            bindVar(labelNode, "fontSize", varMap["checkbox/label-font-size-" + size]);
            comp.appendChild(labelNode);
          }

          // Focus ring on the box
          if (state === "focus") {
            box.effects = [{
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

          // Grid placement: columns = (checkedState × label), rows = (size × state)
          var colIndex = chi * labelModes.length + li;
          var rowIndex = (si * states.length) + sti;
          comp.x = colIndex * colWidth;
          comp.y = rowYOffsets[rowIndex];
          page.appendChild(comp);
          components.push(comp);
        }
      }
    }
  }

  progress("Created " + components.length + " checkbox variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Checkbox";
  return componentSet;
}

// Helper: build figmaPath for checkbox background
function checkboxBgPath(checkedState, state) {
  // checked and indeterminate share the same "checked" background tokens
  var base = (checkedState === "unchecked") ? "checkbox/background" : "checkbox/background-checked";
  if (state === "default") return base;
  return base + "-" + state;
}

// Helper: build figmaPath for checkbox border
function checkboxBorderPath(state) {
  if (state === "default") return "checkbox/border";
  return "checkbox/border-" + state;
}

// Helper: build figmaPath for checkbox icon color
function checkboxIconColorPath(state) {
  if (state === "disabled") return "checkbox/icon-color-disabled";
  return "checkbox/icon-color";
}

// Helper: build figmaPath for checkbox label text
function checkboxLabelTextPath(state) {
  if (state === "disabled") return "checkbox/label-text-disabled";
  return "checkbox/label-text";
}

// ---------------------------------------------------------------------------
// Radio
// ---------------------------------------------------------------------------

function buildRadioComponentSet(varMap, page, font) {
  var sizes = ["xs", "sm", "md", "lg", "xl"];
  var variants = ["filled", "outline"];
  var checkedStates = ["unchecked", "checked"];
  var states = ["default", "hover", "focus", "pressed", "disabled"];
  var labelModes = ["hide", "show"];
  var components = [];

  // Known radio sizes for layout
  var sizeRadioSizes = { xs: 16, sm: 20, md: 24, lg: 28, xl: 32 };
  var sizeIconSizes = { xs: 6, sm: 8, md: 10, lg: 12, xl: 14 };
  var gap = 16;
  var colGap = 16;

  // Pre-calculate y offsets: rows = (size × state)
  var rowYOffsets = [];
  var runningY = 0;
  for (var rsi = 0; rsi < sizes.length; rsi++) {
    for (var rsti = 0; rsti < states.length; rsti++) {
      rowYOffsets.push(runningY);
      var rowH = sizeRadioSizes[sizes[rsi]];
      if (rowH < 24) rowH = 24;
      runningY += rowH + gap;
    }
  }

  var colWidth = 160 + colGap;

  for (var vi = 0; vi < variants.length; vi++) {
    var variant = variants[vi];
    var capVariant = variant.charAt(0).toUpperCase() + variant.slice(1);

    for (var chi = 0; chi < checkedStates.length; chi++) {
      var checkedState = checkedStates[chi];
      var capChecked = checkedState.charAt(0).toUpperCase() + checkedState.slice(1);
      var isChecked = (checkedState === "checked");

      for (var li = 0; li < labelModes.length; li++) {
        var showLabel = (labelModes[li] === "show");
        var capLabel = showLabel ? "Show" : "Hide";

        for (var si = 0; si < sizes.length; si++) {
          var size = sizes[si];
          var capSize = size.toUpperCase();
          var radioSize = sizeRadioSizes[size];
          var iconSize = sizeIconSizes[size];

          for (var sti = 0; sti < states.length; sti++) {
            var state = states[sti];
            var capState = state.charAt(0).toUpperCase() + state.slice(1);

            var comp = figma.createComponent();
            comp.name = "Variant=" + capVariant + ", Size=" + capSize +
                        ", Checked=" + capChecked + ", State=" + capState +
                        ", Label=" + capLabel;

            // Root: horizontal auto-layout
            comp.layoutMode = "HORIZONTAL";
            comp.primaryAxisSizingMode = "AUTO";
            comp.counterAxisSizingMode = "AUTO";
            comp.counterAxisAlignItems = "CENTER";
            comp.itemSpacing = 10;
            comp.fills = [];

            // Bind label gap
            bindVar(comp, "itemSpacing", varMap["radio/label-gap-" + size]);

            // --- Radio circle frame ---
            var circle = figma.createFrame();
            circle.name = "Radio";
            circle.layoutMode = "HORIZONTAL";
            circle.primaryAxisSizingMode = "FIXED";
            circle.counterAxisSizingMode = "FIXED";
            circle.primaryAxisAlignItems = "CENTER";
            circle.counterAxisAlignItems = "CENTER";
            circle.resize(radioSize, radioSize);
            circle.cornerRadius = radioSize; // fully round
            circle.clipsContent = true;

            // Bind radio dimensions
            bindVar(circle, "width", varMap["radio/size-" + size]);
            bindVar(circle, "height", varMap["radio/size-" + size]);

            // Radio fill
            var bgPath = radioBgPath(variant, checkedState, state);
            if (isChecked && variant === "filled") {
              circle.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
            } else {
              circle.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
            }
            bindPaintVar(circle, "fills", 0, varMap[bgPath]);

            // Radio border
            var borderPath = radioBorderPath(state);
            if (!isChecked || variant === "outline") {
              // Unchecked: always show border. Outline checked: also show border
              circle.strokes = [{ type: "SOLID", color: { r: 0.78, g: 0.78, b: 0.78 } }];
              circle.strokeWeight = 1.5;
              circle.strokeAlign = "INSIDE";
              bindPaintVar(circle, "strokes", 0, varMap[borderPath]);
              bindVar(circle, "strokeWeight", varMap["radio/border-width"]);

              // For outline checked, the border should use the primary color
              if (isChecked && variant === "outline") {
                var outlineBorderPath = radioBgPath("filled", "checked", state);
                bindPaintVar(circle, "strokes", 0, varMap[outlineBorderPath]);
              }
            } else {
              // Filled checked: no border
              circle.strokes = [];
            }

            // --- Inner dot (only when checked) ---
            if (isChecked) {
              var dot = figma.createEllipse();
              dot.name = "Dot";
              dot.resize(iconSize, iconSize);
              dot.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];

              var iconColorPath = radioIconColorPath(variant, state);
              bindPaintVar(dot, "fills", 0, varMap[iconColorPath]);
              bindVar(dot, "width", varMap["radio/icon-size-" + size]);
              bindVar(dot, "height", varMap["radio/icon-size-" + size]);

              circle.appendChild(dot);
            }

            comp.appendChild(circle);

            // --- Optional label ---
            if (showLabel) {
              var labelNode = figma.createText();
              labelNode.name = "Label";
              labelNode.fontName = font;
              labelNode.characters = "Label";
              labelNode.fontSize = 14;

              var labelTextPath = radioLabelTextPath(state);
              labelNode.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
              bindPaintVar(labelNode, "fills", 0, varMap[labelTextPath]);
              bindVar(labelNode, "fontSize", varMap["radio/label-font-size-" + size]);
              comp.appendChild(labelNode);
            }

            // Focus ring
            if (state === "focus") {
              circle.effects = [{
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

            // Grid placement
            var colIndex = (vi * checkedStates.length + chi) * labelModes.length + li;
            var rowIndex = (si * states.length) + sti;
            comp.x = colIndex * colWidth;
            comp.y = rowYOffsets[rowIndex];
            page.appendChild(comp);
            components.push(comp);
          }
        }
      }
    }
  }

  progress("Created " + components.length + " radio variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Radio";
  return componentSet;
}

// Helper: build figmaPath for radio background
function radioBgPath(variant, checkedState, state) {
  if (checkedState === "unchecked") {
    if (state === "default") return "radio/background";
    return "radio/background-" + state;
  }
  // checked
  var prefix = "radio/" + variant + "-background-checked";
  if (state === "default") return prefix;
  return prefix + "-" + state;
}

// Helper: build figmaPath for radio border
function radioBorderPath(state) {
  if (state === "default") return "radio/border";
  return "radio/border-" + state;
}

// Helper: build figmaPath for radio icon (dot) color
function radioIconColorPath(variant, state) {
  if (state === "disabled") return "radio/icon-color-disabled";
  return "radio/icon-color";
}

// Helper: build figmaPath for radio label text
function radioLabelTextPath(state) {
  if (state === "disabled") return "radio/label-text-disabled";
  return "radio/label-text";
}

// ---------------------------------------------------------------------------
// Chip
// ---------------------------------------------------------------------------

async function buildChipComponentSet(varMap, page, font) {
  var sizes = ["xs", "sm", "md", "lg", "xl"];
  var variants = ["filled", "outline", "light"];
  var checkedStates = ["unchecked", "checked"];
  var states = ["default", "hover", "focus", "pressed", "disabled"];
  var components = [];

  // Find check icon from icons page
  var checkIconComp = null;
  var iconsPage = null;
  for (var pi = 0; pi < figma.root.children.length; pi++) {
    if (figma.root.children[pi].name.toLowerCase() === "icons") {
      iconsPage = figma.root.children[pi];
      break;
    }
  }
  if (iconsPage) {
    await iconsPage.loadAsync();
    var allNodes = iconsPage.findAll(function(n) {
      return n.type === "COMPONENT";
    });
    for (var ni = 0; ni < allNodes.length; ni++) {
      var nName = allNodes[ni].name.toLowerCase();
      if (!checkIconComp && nName.indexOf("check") >= 0 && nName.indexOf("circle") < 0 && nName.indexOf("square") < 0) {
        checkIconComp = allNodes[ni];
      }
    }
  }

  // Known chip heights per size for grid spacing
  var sizeHeights = { xs: 23, sm: 28, md: 32, lg: 36, xl: 40 };
  var sizeIconSizes = { xs: 9, sm: 12, md: 14, lg: 16, xl: 18 };
  var gap = 16;
  var colGap = 16;

  // Pre-calculate y offsets: rows = (size × state)
  var rowYOffsets = [];
  var runningY = 0;
  for (var rsi = 0; rsi < sizes.length; rsi++) {
    for (var rsti = 0; rsti < states.length; rsti++) {
      rowYOffsets.push(runningY);
      var rowH = sizeHeights[sizes[rsi]];
      if (rowH < 24) rowH = 24;
      runningY += rowH + gap;
    }
  }

  var colWidth = 180 + colGap;

  for (var vi = 0; vi < variants.length; vi++) {
    var variant = variants[vi];
    var capVariant = variant.charAt(0).toUpperCase() + variant.slice(1);

    for (var chi = 0; chi < checkedStates.length; chi++) {
      var checkedState = checkedStates[chi];
      var capChecked = checkedState.charAt(0).toUpperCase() + checkedState.slice(1);
      var isChecked = (checkedState === "checked");

      for (var si = 0; si < sizes.length; si++) {
        var size = sizes[si];
        var capSize = size.toUpperCase();
        var chipHeight = sizeHeights[size];
        var iconSize = sizeIconSizes[size];

        for (var sti = 0; sti < states.length; sti++) {
          var state = states[sti];
          var capState = state.charAt(0).toUpperCase() + state.slice(1);

          var comp = figma.createComponent();
          comp.name = "Variant=" + capVariant + ", Size=" + capSize +
                      ", Checked=" + capChecked + ", State=" + capState;

          // Root: horizontal auto-layout (pill shape)
          comp.layoutMode = "HORIZONTAL";
          comp.primaryAxisSizingMode = "AUTO";
          comp.counterAxisSizingMode = "AUTO";
          comp.primaryAxisAlignItems = "CENTER";
          comp.counterAxisAlignItems = "CENTER";
          comp.resize(80, chipHeight);
          comp.cornerRadius = 16;

          // Padding
          var padding = isChecked ? 10 : 16;
          comp.paddingLeft = padding;
          comp.paddingRight = padding;
          comp.paddingTop = 4;
          comp.paddingBottom = 4;
          comp.itemSpacing = 6;

          // Bind dimensions
          bindVar(comp, "minHeight", varMap["chip/height-" + size]);
          if (isChecked) {
            bindVar(comp, "paddingLeft", varMap["chip/checked-padding-" + size]);
            bindVar(comp, "paddingRight", varMap["chip/checked-padding-" + size]);
          } else {
            bindVar(comp, "paddingLeft", varMap["chip/padding-" + size]);
            bindVar(comp, "paddingRight", varMap["chip/padding-" + size]);
          }
          bindVar(comp, "topLeftRadius", varMap["chip/radius-" + size]);
          bindVar(comp, "topRightRadius", varMap["chip/radius-" + size]);
          bindVar(comp, "bottomLeftRadius", varMap["chip/radius-" + size]);
          bindVar(comp, "bottomRightRadius", varMap["chip/radius-" + size]);
          bindVar(comp, "itemSpacing", varMap["chip/spacing-" + size]);

          // Background fill
          var bgPath = chipBgPath(variant, isChecked, state);
          if (isChecked && variant === "filled") {
            comp.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
          } else if (isChecked && variant === "light") {
            comp.fills = [{ type: "SOLID", color: { r: 0.92, g: 0.92, b: 0.95 } }];
          } else {
            comp.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
          }
          bindPaintVar(comp, "fills", 0, varMap[bgPath]);

          // Border
          var borderPath = chipBorderPath(state);
          if (variant === "outline" || !isChecked) {
            comp.strokes = [{ type: "SOLID", color: { r: 0.78, g: 0.78, b: 0.78 } }];
            comp.strokeWeight = 1.5;
            comp.strokeAlign = "INSIDE";
            bindPaintVar(comp, "strokes", 0, varMap[borderPath]);
            bindVar(comp, "strokeWeight", varMap["chip/border-width"]);
          } else if (variant === "filled" && isChecked) {
            comp.strokes = [];
          } else {
            // light checked — no border
            comp.strokes = [];
          }

          // --- Check icon (only when checked) ---
          if (isChecked && checkIconComp) {
            var checkInst = checkIconComp.createInstance();
            checkInst.name = "Icon";
            checkInst.resize(iconSize, iconSize);
            bindVar(checkInst, "width", varMap["chip/icon-size-" + size]);
            bindVar(checkInst, "height", varMap["chip/icon-size-" + size]);

            // Override icon color
            var iconColorPath = chipIconColorPath(variant, state);
            var vectors = checkInst.findAll(function(n) { return n.type === "VECTOR"; });
            for (var vci = 0; vci < vectors.length; vci++) {
              if (vectors[vci].strokes && vectors[vci].strokes.length > 0) {
                vectors[vci].strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
                bindPaintVar(vectors[vci], "strokes", 0, varMap[iconColorPath]);
              }
              if (vectors[vci].fills && vectors[vci].fills.length > 0) {
                vectors[vci].fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
                bindPaintVar(vectors[vci], "fills", 0, varMap[iconColorPath]);
              }
            }

            comp.appendChild(checkInst);
          }

          // --- Label text ---
          var textNode = figma.createText();
          textNode.name = "Label";
          textNode.fontName = font;
          textNode.characters = "Chip";
          textNode.fontSize = 14;

          var textColorPath = chipTextColorPath(variant, isChecked, state);
          textNode.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
          bindPaintVar(textNode, "fills", 0, varMap[textColorPath]);
          bindVar(textNode, "fontSize", varMap["chip/font-size-" + size]);
          comp.appendChild(textNode);

          // Focus ring
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

          // Grid placement
          var colIndex = vi * checkedStates.length + chi;
          var rowIndex = (si * states.length) + sti;
          comp.x = colIndex * colWidth;
          comp.y = rowYOffsets[rowIndex];
          page.appendChild(comp);
          components.push(comp);
        }
      }
    }
  }

  progress("Created " + components.length + " chip variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Chip";
  return componentSet;
}

// Helper: build figmaPath for chip background
function chipBgPath(variant, isChecked, state) {
  if (!isChecked) {
    var base = "chip/background";
    if (state === "default") return base;
    return base + "-" + state;
  }
  // checked — variant-specific
  var prefix = "chip/" + variant + "-background-checked";
  if (state === "default") return prefix;
  return prefix + "-" + state;
}

// Helper: build figmaPath for chip border
function chipBorderPath(state) {
  if (state === "default") return "chip/border";
  return "chip/border-" + state;
}

// Helper: build figmaPath for chip text color
function chipTextColorPath(variant, isChecked, state) {
  if (state === "disabled") return "chip/text-disabled";
  if (!isChecked) return "chip/text";
  // Checked — variant-specific text
  return "chip/" + variant + "-text-checked";
}

// Helper: build figmaPath for chip icon color
// Filled uses white (text-on-interactive), outline/light use brand primary (same as their text)
function chipIconColorPath(variant, state) {
  if (state === "disabled") return "chip/icon-color-disabled";
  if (variant === "outline") return "chip/outline-text-checked";
  if (variant === "light") return "chip/light-text-checked";
  return "chip/icon-color";
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
