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
  var componentBuild = await buildComponents(componentVarMap);
  var componentFailures = (componentBuild && componentBuild.failures) ? componentBuild.failures : [];

  var doneMsg = "Sync complete! " + totalCreated + " vars, " + totalAliases + " aliases, " + syncModes.length + " modes, components built.";
  if (syncModes.length < modeEntries.length) {
    doneMsg += " (" + (modeEntries.length - syncModes.length) + " modes skipped)";
  }
  if (componentFailures.length > 0) {
    doneMsg += " Component build failures: " + componentFailures.join(" | ");
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
  var buildFailures = [];

  // Remove previously generated component sets to avoid duplicates
  cleanupExistingComponents(page);

  // Load font for button text and switch labels
  var font = await loadFont();

  var compSetGap = 300;
  async function buildSet(name, builder) {
    progress("Creating " + name + " component set...");
    var preExistingChildren = page.children.slice();
    try {
      return await builder();
    } catch (e) {
      // Remove nodes created by a failed builder so they do not overlap other sets.
      var createdNodes = page.children.filter(function(node) {
        return preExistingChildren.indexOf(node) === -1;
      });
      for (var cni = 0; cni < createdNodes.length; cni++) {
        try { createdNodes[cni].remove(); } catch (removeErr) {}
      }
      buildFailures.push(name + ": " + String(e));
      progress("Failed to build " + name + " component set: " + String(e));
      return null;
    }
  }

  var buttonSet = await buildSet("Button", function () {
    return buildButtonComponentSet(varMap, page, font);
  });
  var switchSet = await buildSet("Switch", function () {
    return buildSwitchComponentSet(varMap, page, font);
  });
  var sliderSet = await buildSet("Slider", function () {
    return buildSliderComponentSet(varMap, page, font);
  });
  var rangeSliderSet = await buildSet("RangeSlider", function () {
    return buildRangeSliderComponentSet(varMap, page, font);
  });
  var checkboxSet = await buildSet("Checkbox", function () {
    return buildCheckboxComponentSet(varMap, page, font);
  });
  var radioSet = await buildSet("Radio", function () {
    return buildRadioComponentSet(varMap, page, font);
  });
  var chipSet = await buildSet("Chip", function () {
    return buildChipComponentSet(varMap, page, font);
  });
  var notificationSet = await buildSet("Notification", function () {
    return buildNotificationComponentSet(varMap, page, font);
  });
  var alertSet = await buildSet("Alert", function () {
    return buildAlertComponentSet(varMap, page, font);
  });
  var tooltipSet = await buildSet("Tooltip", function () {
    return buildTooltipComponentSet(varMap, page, font);
  });
  var loaderSet = await buildSet("Loader", function () {
    return buildLoaderComponentSet(varMap, page, font);
  });
  var pillSet = await buildSet("Pill", function () {
    return buildPillComponentSet(varMap, page, font);
  });
  var badgeSet = await buildSet("Badge", function () {
    return buildBadgeComponentSet(varMap, page, font);
  });
  var textInputSet = await buildSet("TextInput", function () {
    return buildTextInputComponentSet(varMap, page, font);
  });
  var selectSet = await buildSet("Select", function () {
    return buildSelectComponentSet(varMap, page, font);
  });
  var cardSet = await buildSet("Card", function () {
    return buildCardComponentSet(varMap, page, font);
  });
  var actionIconSet = await buildSet("ActionIcon", function () {
    return buildActionIconComponentSet(varMap, page);
  });
  var tabsSet = await buildSet("Tabs", function () {
    return buildTabsComponentSet(varMap, page, font);
  });
  var anchorSet = await buildSet("Anchor", function () {
    return buildAnchorComponentSet(varMap, page, font);
  });
  var titleSet = await buildSet("Title", function () {
    return buildTitleComponentSet(varMap, page, font);
  });
  var textSet = await buildSet("Text", function () {
    return buildTextComponentSet(varMap, page, font);
  });
  var modalSet = await buildSet("Modal", function () {
    return buildModalComponentSet(varMap, page, font, {
      buttonSet: buttonSet,
      titleSet: titleSet,
      textSet: textSet,
    });
  });

  // Position component sets in wrapped rows using rendered bounds
  var generatedSets = [
    buttonSet,
    switchSet,
    sliderSet,
    rangeSliderSet,
    checkboxSet,
    radioSet,
    chipSet,
    notificationSet,
    alertSet,
    modalSet,
    tooltipSet,
    loaderSet,
    pillSet,
    badgeSet,
    textInputSet,
    selectSet,
    cardSet,
    actionIconSet,
    tabsSet,
    anchorSet,
    titleSet,
    textSet,
  ];
  var validSets = generatedSets.filter(function (set) { return Boolean(set); });
  positionComponentSets(validSets, compSetGap);

  // Scroll viewport to show all component sets
  figma.viewport.scrollAndZoomIntoView(validSets);

  if (buildFailures.length > 0) {
    progress("Component set failures: " + buildFailures.join(" | "));
  }

  progress("Components created.");
  return { failures: buildFailures };
}

function cleanupExistingComponents(page) {
  var children = page.children;
  for (var i = children.length - 1; i >= 0; i--) {
    var child = children[i];
    if (child.type === "COMPONENT_SET" && (child.name === "Button" || child.name === "Switch" || child.name === "Slider" || child.name === "RangeSlider" || child.name === "Checkbox" || child.name === "Radio" || child.name === "Chip" || child.name === "Notification" || child.name === "Alert" || child.name === "Modal" || child.name === "Tooltip" || child.name === "Loader" || child.name === "Pill" || child.name === "Badge" || child.name === "TextInput" || child.name === "Select" || child.name === "Card" || child.name === "ActionIcon" || child.name === "Tabs" || child.name === "Anchor" || child.name === "Title" || child.name === "Text")) {
      child.remove();
    }
    // Also clean up standalone components from failed previous runs
    if (child.type === "COMPONENT" && (
      child.name.indexOf("Variant=") === 0 || child.name.indexOf("State=") === 0 ||
      child.name.indexOf("Size=") === 0 || child.name.indexOf("Checked=") === 0 ||
      child.name.indexOf("Label=") === 0 || child.name.indexOf("Direction=") === 0
    )) {
      child.remove();
    }
  }
}

function nodeRenderedWidth(node) {
  try {
    if (node && node.absoluteRenderBounds && node.absoluteRenderBounds.width) {
      return node.absoluteRenderBounds.width;
    }
  } catch (e) {}
  if (node && node.width) return node.width;
  return 0;
}

function nodeRenderedHeight(node) {
  try {
    if (node && node.absoluteRenderBounds && node.absoluteRenderBounds.height) {
      return node.absoluteRenderBounds.height;
    }
  } catch (e) {}
  if (node && node.height) return node.height;
  return 0;
}

function positionComponentSets(sets, gap) {
  var x = 0;
  for (var i = 0; i < sets.length; i++) {
    var set = sets[i];
    if (!set) continue;
    var w = nodeRenderedWidth(set);
    set.x = x;
    set.y = 0;
    x += w + gap;
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
// Slider
// ---------------------------------------------------------------------------

function buildSliderComponentSet(varMap, page, font) {
  var sizes = ["xs", "sm", "md", "lg", "xl"];
  var radii = ["xs", "sm", "md", "lg", "xl"];
  var states = ["default", "focus", "disabled"];
  var markModes = ["off", "on"];
  var components = [];

  var trackWidth = 260;
  var sliderValuePercent = 40;
  var gap = 18;
  var colGap = 28;

  var sizeThumb = { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 };
  var sizeTrack = { xs: 2, sm: 4, md: 6, lg: 8, xl: 10 };

  var rowYOffsets = [];
  var runningY = 0;
  for (var rsi = 0; rsi < sizes.length; rsi++) {
    for (var rsti = 0; rsti < states.length; rsti++) {
      rowYOffsets.push(runningY);
      var rowH = sizeThumb[sizes[rsi]] + 34;
      runningY += rowH + gap;
    }
  }

  var colWidth = trackWidth + colGap;

  for (var mi = 0; mi < markModes.length; mi++) {
    var withMarks = markModes[mi] === "on";
    var capMarks = withMarks ? "On" : "Off";

    for (var ri = 0; ri < radii.length; ri++) {
      var radius = radii[ri];
      var capRadius = radius.toUpperCase();

      for (var si = 0; si < sizes.length; si++) {
        var size = sizes[si];
        var capSize = size.toUpperCase();

        for (var sti = 0; sti < states.length; sti++) {
          var state = states[sti];
          var capState = state.charAt(0).toUpperCase() + state.slice(1);

          var comp = figma.createComponent();
          comp.name =
            "Size=" + capSize +
            ", Radius=" + capRadius +
            ", State=" + capState +
            ", Marks=" + capMarks;
          comp.resize(trackWidth, withMarks ? 58 : 28);
          comp.fills = [];

          var trackY = (sizeThumb[size] - sizeTrack[size]) / 2;

          var track = figma.createRectangle();
          track.name = "Track";
          track.resize(trackWidth, sizeTrack[size]);
          track.x = 0;
          track.y = trackY;
          track.cornerRadius = 999;
          track.fills = [{ type: "SOLID", color: { r: 0.22, g: 0.24, b: 0.28 } }];
          bindPaintVar(track, "fills", 0, varMap[sliderTrackBgPath(state)]);
          bindVar(track, "height", varMap["slider/track-height-" + size]);
          bindVar(track, "topLeftRadius", varMap["slider/radius-" + radius]);
          bindVar(track, "topRightRadius", varMap["slider/radius-" + radius]);
          bindVar(track, "bottomLeftRadius", varMap["slider/radius-" + radius]);
          bindVar(track, "bottomRightRadius", varMap["slider/radius-" + radius]);
          comp.appendChild(track);

          var bar = figma.createRectangle();
          bar.name = "Bar";
          bar.resize(Math.round((trackWidth * sliderValuePercent) / 100), sizeTrack[size]);
          bar.x = 0;
          bar.y = trackY;
          bar.cornerRadius = 999;
          bar.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
          bindPaintVar(bar, "fills", 0, varMap[sliderBarBgPath(state)]);
          bindVar(bar, "height", varMap["slider/track-height-" + size]);
          bindVar(bar, "topLeftRadius", varMap["slider/radius-" + radius]);
          bindVar(bar, "topRightRadius", varMap["slider/radius-" + radius]);
          bindVar(bar, "bottomLeftRadius", varMap["slider/radius-" + radius]);
          bindVar(bar, "bottomRightRadius", varMap["slider/radius-" + radius]);
          comp.appendChild(bar);

          var thumb = figma.createEllipse();
          thumb.name = "Thumb";
          thumb.resize(sizeThumb[size], sizeThumb[size]);
          thumb.x = Math.round((trackWidth * sliderValuePercent) / 100) - Math.round(sizeThumb[size] / 2);
          thumb.y = 0;
          thumb.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
          thumb.strokes = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
          thumb.strokeWeight = 2;
          bindPaintVar(thumb, "fills", 0, varMap[sliderThumbBgPath(state)]);
          bindPaintVar(thumb, "strokes", 0, varMap[sliderThumbBorderPath(state)]);
          bindVar(thumb, "width", varMap["slider/thumb-size-" + size]);
          bindVar(thumb, "height", varMap["slider/thumb-size-" + size]);
          bindVar(thumb, "strokeWeight", varMap["slider/thumb-border-width"]);
          if (state === "focus") {
            thumb.effects = [{
              type: "DROP_SHADOW",
              color: { r: 0.2, g: 0.53, b: 0.9, a: 0.35 },
              offset: { x: 0, y: 0 },
              radius: 0,
              spread: 3,
              visible: true,
              blendMode: "NORMAL"
            }];
          }
          comp.appendChild(thumb);

          if (withMarks) {
            var markValues = [20, 50, 80];
            var labels = ["20%", "50%", "80%"];
            for (var mki = 0; mki < markValues.length; mki++) {
              var markX = Math.round((trackWidth * markValues[mki]) / 100);
              var mark = figma.createEllipse();
              mark.name = "Mark-" + labels[mki];
              mark.resize(8, 8);
              mark.x = markX - 4;
              mark.y = trackY + Math.round(sizeTrack[size] / 2) - 4;
              mark.fills = [{ type: "SOLID", color: { r: 0.5, g: 0.52, b: 0.56 } }];
              bindPaintVar(mark, "fills", 0, varMap[sliderMarkColorPath(state)]);
              bindVar(mark, "width", varMap["slider/mark-size"]);
              bindVar(mark, "height", varMap["slider/mark-size"]);
              comp.appendChild(mark);

              var labelNode = figma.createText();
              labelNode.name = "MarkLabel-" + labels[mki];
              labelNode.fontName = font;
              labelNode.characters = labels[mki];
              labelNode.fontSize = 12;
              labelNode.fills = [{ type: "SOLID", color: { r: 0.7, g: 0.72, b: 0.75 } }];
              bindPaintVar(labelNode, "fills", 0, varMap[sliderMarkLabelColorPath(state)]);
              bindVar(labelNode, "fontSize", varMap["slider/mark-label-font-size-" + size]);
              labelNode.x = markX - 12;
              labelNode.y = trackY + sizeTrack[size] + 10;
              comp.appendChild(labelNode);
            }
          }

          if (state === "disabled") {
            comp.opacity = 0.65;
          }

          var colIndex = mi * radii.length + ri;
          var rowIndex = (si * states.length) + sti;
          comp.x = colIndex * colWidth;
          comp.y = rowYOffsets[rowIndex];
          page.appendChild(comp);
          components.push(comp);
        }
      }
    }
  }

  progress("Created " + components.length + " slider variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Slider";
  return componentSet;
}

function sliderTrackBgPath(state) {
  if (state === "disabled") return "slider/track-background-disabled";
  return "slider/track-background";
}

function sliderBarBgPath(state) {
  if (state === "default") return "slider/bar-background";
  return "slider/bar-background-" + state;
}

function sliderThumbBgPath(state) {
  if (state === "disabled") return "slider/thumb-background-disabled";
  return "slider/thumb-background";
}

function sliderThumbBorderPath(state) {
  if (state === "default") return "slider/thumb-border";
  return "slider/thumb-border-" + state;
}

function sliderMarkColorPath(state) {
  if (state === "disabled") return "slider/mark-color-disabled";
  return "slider/mark-color";
}

function sliderMarkLabelColorPath(state) {
  if (state === "disabled") return "slider/mark-label-color-disabled";
  return "slider/mark-label-color";
}

function buildRangeSliderComponentSet(varMap, page, font) {
  var sizes = ["xs", "sm", "md", "lg", "xl"];
  var radii = ["xs", "sm", "md", "lg", "xl"];
  var states = ["default", "focus", "disabled"];
  var markModes = ["off", "on"];
  var components = [];

  var trackWidth = 260;
  var rangeValues = [20, 60];
  var gap = 18;
  var colGap = 28;

  var sizeThumb = { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 };
  var sizeTrack = { xs: 2, sm: 4, md: 6, lg: 8, xl: 10 };

  var rowYOffsets = [];
  var runningY = 0;
  for (var rsi = 0; rsi < sizes.length; rsi++) {
    for (var rsti = 0; rsti < states.length; rsti++) {
      rowYOffsets.push(runningY);
      var rowH = sizeThumb[sizes[rsi]] + 34;
      runningY += rowH + gap;
    }
  }

  var colWidth = trackWidth + colGap;

  for (var mi = 0; mi < markModes.length; mi++) {
    var withMarks = markModes[mi] === "on";
    var capMarks = withMarks ? "On" : "Off";

    for (var ri = 0; ri < radii.length; ri++) {
      var radius = radii[ri];
      var capRadius = radius.toUpperCase();

      for (var si = 0; si < sizes.length; si++) {
        var size = sizes[si];
        var capSize = size.toUpperCase();

        for (var sti = 0; sti < states.length; sti++) {
          var state = states[sti];
          var capState = state.charAt(0).toUpperCase() + state.slice(1);

          var comp = figma.createComponent();
          comp.name =
            "Size=" + capSize +
            ", Radius=" + capRadius +
            ", State=" + capState +
            ", Marks=" + capMarks;
          comp.resize(trackWidth, withMarks ? 58 : 28);
          comp.fills = [];

          var trackY = (sizeThumb[size] - sizeTrack[size]) / 2;
          var fromX = Math.round((trackWidth * rangeValues[0]) / 100);
          var toX = Math.round((trackWidth * rangeValues[1]) / 100);

          var track = figma.createRectangle();
          track.name = "Track";
          track.resize(trackWidth, sizeTrack[size]);
          track.x = 0;
          track.y = trackY;
          track.cornerRadius = 999;
          track.fills = [{ type: "SOLID", color: { r: 0.22, g: 0.24, b: 0.28 } }];
          bindPaintVar(track, "fills", 0, varMap[rangeSliderTrackBgPath(state)]);
          bindVar(track, "height", varMap["rangeslider/track-height-" + size]);
          bindVar(track, "topLeftRadius", varMap["rangeslider/radius-" + radius]);
          bindVar(track, "topRightRadius", varMap["rangeslider/radius-" + radius]);
          bindVar(track, "bottomLeftRadius", varMap["rangeslider/radius-" + radius]);
          bindVar(track, "bottomRightRadius", varMap["rangeslider/radius-" + radius]);
          comp.appendChild(track);

          var bar = figma.createRectangle();
          bar.name = "Bar";
          bar.resize(toX - fromX, sizeTrack[size]);
          bar.x = fromX;
          bar.y = trackY;
          bar.cornerRadius = 999;
          bar.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
          bindPaintVar(bar, "fills", 0, varMap[rangeSliderBarBgPath(state)]);
          bindVar(bar, "height", varMap["rangeslider/track-height-" + size]);
          bindVar(bar, "topLeftRadius", varMap["rangeslider/radius-" + radius]);
          bindVar(bar, "topRightRadius", varMap["rangeslider/radius-" + radius]);
          bindVar(bar, "bottomLeftRadius", varMap["rangeslider/radius-" + radius]);
          bindVar(bar, "bottomRightRadius", varMap["rangeslider/radius-" + radius]);
          comp.appendChild(bar);

          var thumbFrom = figma.createEllipse();
          thumbFrom.name = "ThumbFrom";
          thumbFrom.resize(sizeThumb[size], sizeThumb[size]);
          thumbFrom.x = fromX - Math.round(sizeThumb[size] / 2);
          thumbFrom.y = 0;
          thumbFrom.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
          thumbFrom.strokes = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
          thumbFrom.strokeWeight = 2;
          bindPaintVar(thumbFrom, "fills", 0, varMap[rangeSliderThumbBgPath(state)]);
          bindPaintVar(thumbFrom, "strokes", 0, varMap[rangeSliderThumbBorderPath(state)]);
          bindVar(thumbFrom, "width", varMap["rangeslider/thumb-size-" + size]);
          bindVar(thumbFrom, "height", varMap["rangeslider/thumb-size-" + size]);
          bindVar(thumbFrom, "strokeWeight", varMap["rangeslider/thumb-border-width"]);
          comp.appendChild(thumbFrom);

          var thumbTo = figma.createEllipse();
          thumbTo.name = "ThumbTo";
          thumbTo.resize(sizeThumb[size], sizeThumb[size]);
          thumbTo.x = toX - Math.round(sizeThumb[size] / 2);
          thumbTo.y = 0;
          thumbTo.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
          thumbTo.strokes = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
          thumbTo.strokeWeight = 2;
          bindPaintVar(thumbTo, "fills", 0, varMap[rangeSliderThumbBgPath(state)]);
          bindPaintVar(thumbTo, "strokes", 0, varMap[rangeSliderThumbBorderPath(state)]);
          bindVar(thumbTo, "width", varMap["rangeslider/thumb-size-" + size]);
          bindVar(thumbTo, "height", varMap["rangeslider/thumb-size-" + size]);
          bindVar(thumbTo, "strokeWeight", varMap["rangeslider/thumb-border-width"]);
          if (state === "focus") {
            thumbTo.effects = [{
              type: "DROP_SHADOW",
              color: { r: 0.2, g: 0.53, b: 0.9, a: 0.35 },
              offset: { x: 0, y: 0 },
              radius: 0,
              spread: 3,
              visible: true,
              blendMode: "NORMAL"
            }];
          }
          comp.appendChild(thumbTo);

          if (withMarks) {
            var markValues = [20, 50, 80];
            var labels = ["20%", "50%", "80%"];
            for (var mki = 0; mki < markValues.length; mki++) {
              var markX = Math.round((trackWidth * markValues[mki]) / 100);
              var mark = figma.createEllipse();
              mark.name = "Mark-" + labels[mki];
              mark.resize(8, 8);
              mark.x = markX - 4;
              mark.y = trackY + Math.round(sizeTrack[size] / 2) - 4;
              mark.fills = [{ type: "SOLID", color: { r: 0.5, g: 0.52, b: 0.56 } }];
              bindPaintVar(mark, "fills", 0, varMap[rangeSliderMarkColorPath(state)]);
              bindVar(mark, "width", varMap["rangeslider/mark-size"]);
              bindVar(mark, "height", varMap["rangeslider/mark-size"]);
              comp.appendChild(mark);

              var labelNode = figma.createText();
              labelNode.name = "MarkLabel-" + labels[mki];
              labelNode.fontName = font;
              labelNode.characters = labels[mki];
              labelNode.fontSize = 12;
              labelNode.fills = [{ type: "SOLID", color: { r: 0.7, g: 0.72, b: 0.75 } }];
              bindPaintVar(labelNode, "fills", 0, varMap[rangeSliderMarkLabelColorPath(state)]);
              bindVar(labelNode, "fontSize", varMap["rangeslider/mark-label-font-size-" + size]);
              labelNode.x = markX - 12;
              labelNode.y = trackY + sizeTrack[size] + 10;
              comp.appendChild(labelNode);
            }
          }

          if (state === "disabled") {
            comp.opacity = 0.65;
          }

          var colIndex = mi * radii.length + ri;
          var rowIndex = (si * states.length) + sti;
          comp.x = colIndex * colWidth;
          comp.y = rowYOffsets[rowIndex];
          page.appendChild(comp);
          components.push(comp);
        }
      }
    }
  }

  progress("Created " + components.length + " range slider variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "RangeSlider";
  return componentSet;
}

function rangeSliderTrackBgPath(state) {
  if (state === "disabled") return "rangeslider/track-background-disabled";
  return "rangeslider/track-background";
}

function rangeSliderBarBgPath(state) {
  if (state === "default") return "rangeslider/bar-background";
  return "rangeslider/bar-background-" + state;
}

function rangeSliderThumbBgPath(state) {
  if (state === "disabled") return "rangeslider/thumb-background-disabled";
  return "rangeslider/thumb-background";
}

function rangeSliderThumbBorderPath(state) {
  if (state === "default") return "rangeslider/thumb-border";
  return "rangeslider/thumb-border-" + state;
}

function rangeSliderMarkColorPath(state) {
  if (state === "disabled") return "rangeslider/mark-color-disabled";
  return "rangeslider/mark-color";
}

function rangeSliderMarkLabelColorPath(state) {
  if (state === "disabled") return "rangeslider/mark-label-color-disabled";
  return "rangeslider/mark-label-color";
}

async function buildAnchorComponentSet(varMap, page, font) {
  var sizes = ["xs", "sm", "md", "lg", "xl"];
  var underlines = ["always", "hover", "never"];
  var weights = ["regular", "semibold", "bold"];
  var states = ["default", "hover", "visited", "disabled"];
  var components = [];

  var colGap = 16;
  var rowGap = 16;
  var colWidth = 460 + colGap;
  var rowHeight = 86 + rowGap;

  function cap(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function anchorColorPath(state) {
    if (state === "hover") return "anchor/color-hover";
    if (state === "visited") return "anchor/color-visited";
    if (state === "disabled") return "anchor/color-disabled";
    return "anchor/color";
  }

  var fontByWeight = {
    regular: font,
    semibold: font,
    bold: font,
  };

  var regularCandidates = [
    { family: "Inter", style: "Regular" },
    { family: "Inter", style: "Medium" },
  ];
  var semiboldCandidates = [
    { family: "Inter", style: "Semi Bold" },
    { family: "Inter", style: "SemiBold" },
    { family: "Inter", style: "Medium" },
  ];
  var boldCandidates = [
    { family: "Inter", style: "Bold" },
    { family: "Inter", style: "Extra Bold" },
  ];

  for (var rci = 0; rci < regularCandidates.length; rci++) {
    try {
      await figma.loadFontAsync(regularCandidates[rci]);
      fontByWeight.regular = regularCandidates[rci];
      break;
    } catch (e) {}
  }
  for (var sci = 0; sci < semiboldCandidates.length; sci++) {
    try {
      await figma.loadFontAsync(semiboldCandidates[sci]);
      fontByWeight.semibold = semiboldCandidates[sci];
      break;
    } catch (e) {}
  }
  for (var bci = 0; bci < boldCandidates.length; bci++) {
    try {
      await figma.loadFontAsync(boldCandidates[bci]);
      fontByWeight.bold = boldCandidates[bci];
      break;
    } catch (e) {}
  }

  for (var si = 0; si < sizes.length; si++) {
    var size = sizes[si];
    var capSize = size.toUpperCase();

    for (var ui = 0; ui < underlines.length; ui++) {
      var underline = underlines[ui];
      var capUnderline = cap(underline);

      for (var wi = 0; wi < weights.length; wi++) {
        var weight = weights[wi];
        var capWeight = cap(weight);

        for (var sti = 0; sti < states.length; sti++) {
          var state = states[sti];
          var capState = cap(state);

          var comp = figma.createComponent();
          comp.name =
            "Size=" + capSize +
            ", Underline=" + capUnderline +
            ", Weight=" + capWeight +
            ", State=" + capState;
          comp.layoutMode = "HORIZONTAL";
          comp.primaryAxisSizingMode = "AUTO";
          comp.counterAxisSizingMode = "AUTO";
          comp.primaryAxisAlignItems = "MIN";
          comp.counterAxisAlignItems = "CENTER";
          comp.itemSpacing = 0;
          comp.fills = [];
          comp.clipsContent = false;

          var anchorText = figma.createText();
          anchorText.name = "anchor";
          anchorText.fontName = fontByWeight[weight] || font;
          anchorText.characters = "View documentation";
          anchorText.fontSize = 16;
          anchorText.textAutoResize = "WIDTH_AND_HEIGHT";
          anchorText.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];

          bindVar(anchorText, "fontSize", varMap["anchor/font-size-" + size]);
          bindVar(anchorText, "lineHeight", varMap["anchor/line-height-" + size]);
          bindVar(anchorText, "fontWeight", varMap["anchor/font-weight-" + weight]);
          bindPaintVar(anchorText, "fills", 0, varMap[anchorColorPath(state)]);

          if (underline === "always" || (underline === "hover" && state === "hover")) {
            anchorText.textDecoration = "UNDERLINE";
          } else {
            anchorText.textDecoration = "NONE";
          }
          if (state === "disabled") anchorText.opacity = 0.7;

          comp.appendChild(anchorText);

          var colIndex = (ui * weights.length) + wi;
          var rowIndex = (si * states.length) + sti;
          comp.x = colIndex * colWidth;
          comp.y = rowIndex * rowHeight;
          page.appendChild(comp);
          components.push(comp);
        }
      }
    }
  }

  progress("Created " + components.length + " anchor variants");
  try {
    var componentSet = figma.combineAsVariants(components, page);
    componentSet.name = "Anchor";
    return componentSet;
  } catch (err) {
    // Retry with simpler variant keys to avoid parser edge-cases.
    for (var ci = 0; ci < components.length; ci++) {
      var n = components[ci].name;
      n = n.replace("Size=", "Sz=");
      n = n.replace("Underline=", "Ul=");
      n = n.replace("Weight=", "Wt=");
      n = n.replace("State=", "St=");
      components[ci].name = n;
    }
    try {
      var retrySet = figma.combineAsVariants(components, page);
      retrySet.name = "Anchor";
      progress("Anchor combine retry succeeded with simplified variant keys.");
      return retrySet;
    } catch (retryErr) {
      throw new Error("Anchor combine failed. First error: " + String(err) + " | Retry error: " + String(retryErr));
    }
  }
}

function buildTitleComponentSet(varMap, page, font) {
  var orders = [1, 2, 3, 4, 5, 6];
  var sizeModes = ["auto", "h1", "h2", "h3", "h4", "h5", "h6"];
  var components = [];

  var colGap = 16;
  var rowGap = 16;
  var colWidth = 560 + colGap;
  var rowHeight = 150 + rowGap;

  var defaultFontSizeByOrder = { 1: 34, 2: 28, 3: 24, 4: 20, 5: 16, 6: 14 };

  for (var oi = 0; oi < orders.length; oi++) {
    var order = orders[oi];
    for (var si = 0; si < sizeModes.length; si++) {
      var sizeMode = sizeModes[si];
      var capSize = sizeMode === "auto" ? "Auto" : sizeMode.toUpperCase();

      var comp = figma.createComponent();
      comp.name = "Order=" + order + ", Size=" + capSize;
      comp.resize(560, 150);
      comp.fills = [];
      comp.clipsContent = true;

      var textNode = figma.createText();
      textNode.name = "title";
      textNode.fontName = font;
      textNode.characters = "Build fully functional accessible web applications faster than ever";
      textNode.fills = [{ type: "SOLID", color: { r: 0.85, g: 0.86, b: 0.88 } }];
      textNode.fontSize = defaultFontSizeByOrder[order] || 20;
      textNode.resize(520, 100);
      textNode.textAutoResize = "HEIGHT";

      var sizeKey = sizeMode === "auto" ? "h" + order : sizeMode;
      var tokenVar = varMap["title/font-size-" + sizeKey];
      bindVar(textNode, "fontSize", tokenVar);
      bindVar(textNode, "lineHeight", varMap["title/line-height-" + sizeKey]);
      bindPaintVar(textNode, "fills", 0, varMap["title/color"]);

      comp.appendChild(textNode);

      var colIndex = si;
      var rowIndex = oi;
      comp.x = colIndex * colWidth;
      comp.y = rowIndex * rowHeight;
      page.appendChild(comp);
      components.push(comp);
    }
  }

  progress("Created " + components.length + " title variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Title";
  return componentSet;
}

async function buildTextComponentSet(varMap, page, fallbackFont) {
  var sizes = ["xs", "sm", "md", "lg", "xl"];
  var weights = ["regular", "semibold", "bold"];
  var colors = ["default", "dimmed", "brand"];
  var components = [];

  var colGap = 18;
  var rowGap = 16;
  var colWidth = 560 + colGap;
  var rowHeight = 130 + rowGap;

  var fontByWeight = {
    regular: fallbackFont,
    semibold: fallbackFont,
    bold: fallbackFont,
  };

  var regularCandidates = [
    { family: "Inter", style: "Regular" },
    { family: "Inter", style: "Medium" },
  ];
  var boldCandidates = [
    { family: "Inter", style: "Bold" },
    { family: "Inter", style: "Semi Bold" },
    { family: "Inter", style: "SemiBold" },
  ];

  for (var rci = 0; rci < regularCandidates.length; rci++) {
    try {
      await figma.loadFontAsync(regularCandidates[rci]);
      fontByWeight.regular = regularCandidates[rci];
      break;
    } catch (e) {}
  }
  for (var bci = 0; bci < boldCandidates.length; bci++) {
    try {
      await figma.loadFontAsync(boldCandidates[bci]);
      fontByWeight.bold = boldCandidates[bci];
      break;
    } catch (e) {}
  }

  for (var si = 0; si < sizes.length; si++) {
    var size = sizes[si];
    var capSize = size.toUpperCase();
    for (var wi = 0; wi < weights.length; wi++) {
      var weight = weights[wi];
      var capWeight = weight.charAt(0).toUpperCase() + weight.slice(1);
      for (var ci = 0; ci < colors.length; ci++) {
        var color = colors[ci];
        var capColor = color.charAt(0).toUpperCase() + color.slice(1);

        var comp = figma.createComponent();
        comp.name =
          "Size=" + capSize +
          ", Weight=" + capWeight +
          ", Color=" + capColor;
        comp.resize(560, 130);
        comp.fills = [];
        comp.clipsContent = true;

        var textNode = figma.createText();
        textNode.name = "text";
        textNode.fontName = fontByWeight[weight] || fallbackFont;
        textNode.characters = "Build fully functional accessible web applications faster than ever.";
        textNode.fontSize = 16;
        textNode.resize(520, 90);
        textNode.textAutoResize = "HEIGHT";
        textNode.fills = [{ type: "SOLID", color: { r: 0.85, g: 0.86, b: 0.88 } }];

        bindVar(textNode, "fontSize", varMap["text/font-size-" + size]);
        bindVar(textNode, "lineHeight", varMap["text/line-height-" + size]);
        bindPaintVar(textNode, "fills", 0, varMap[textColorPath(color)]);

        comp.appendChild(textNode);

        var colIndex = (wi * colors.length) + ci;
        var rowIndex = si;
        comp.x = colIndex * colWidth;
        comp.y = rowIndex * rowHeight;
        page.appendChild(comp);
        components.push(comp);
      }
    }
  }

  progress("Created " + components.length + " text variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Text";
  return componentSet;
}

function textColorPath(mode) {
  if (mode === "dimmed") return "text/color-dimmed";
  if (mode === "brand") return "text/color-brand";
  return "text/color";
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
// Notification Component Set
// ---------------------------------------------------------------------------

function buildNotificationComponentSet(varMap, page, font) {
  var radii = ["xs", "sm", "md", "lg", "xl"];
  var borderStates = ["off", "on"];
  var closeStates = ["off", "on"];
  var iconStates = ["off", "on"];
  var loadingStates = ["off", "on"];
  var components = [];
  var gap = 24;
  var colWidth = 420;
  var rowHeight = 130;

  for (var ri = 0; ri < radii.length; ri++) {
    var radius = radii[ri];
    var capRadius = radius.toUpperCase();
    for (var bi = 0; bi < borderStates.length; bi++) {
      var withBorder = borderStates[bi] === "on";
      for (var ci = 0; ci < closeStates.length; ci++) {
        var withClose = closeStates[ci] === "on";
        for (var ii = 0; ii < iconStates.length; ii++) {
          var withIcon = iconStates[ii] === "on";
          for (var li = 0; li < loadingStates.length; li++) {
            var isLoading = loadingStates[li] === "on";

            var comp = figma.createComponent();
            comp.name =
              "Radius=" + capRadius +
              ", Border=" + borderStates[bi] +
              ", Close=" + closeStates[ci] +
              ", Icon=" + iconStates[ii] +
              ", Loading=" + loadingStates[li];
            comp.resize(360, 110);
            comp.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
            comp.strokes = withBorder ? [{ type: "SOLID", color: { r: 0.84, g: 0.84, b: 0.84 } }] : [];
            comp.strokeWeight = withBorder ? 1 : 0;
            comp.strokeAlign = "INSIDE";
            comp.cornerRadius = 8;

            if (varMap["notification/background"]) bindPaintVar(comp, "fills", 0, varMap["notification/background"]);
            if (withBorder && varMap["notification/border"]) bindPaintVar(comp, "strokes", 0, varMap["notification/border"]);
            if (varMap["notification/border-width"]) bindVar(comp, "strokeWeight", varMap["notification/border-width"]);
            if (varMap["notification/radius-" + radius]) {
              bindVar(comp, "topLeftRadius", varMap["notification/radius-" + radius]);
              bindVar(comp, "topRightRadius", varMap["notification/radius-" + radius]);
              bindVar(comp, "bottomLeftRadius", varMap["notification/radius-" + radius]);
              bindVar(comp, "bottomRightRadius", varMap["notification/radius-" + radius]);
            }

            var accent = figma.createRectangle();
            accent.name = "accent";
            accent.resize(6, 94);
            accent.x = 8;
            accent.y = 8;
            accent.cornerRadius = 3;
            accent.fills = [{ type: "SOLID", color: { r: 0.2, g: 0.53, b: 0.87 } }];
            if (varMap["notification/icon"]) bindPaintVar(accent, "fills", 0, varMap["notification/icon"]);
            comp.appendChild(accent);

            if (withIcon || isLoading) {
              var iconNode = figma.createEllipse();
              iconNode.name = isLoading ? "loader" : "icon";
              iconNode.resize(14, 14);
              iconNode.x = 24;
              iconNode.y = 16;
              if (isLoading) {
                iconNode.fills = [];
                iconNode.strokes = [{ type: "SOLID", color: { r: 0.2, g: 0.53, b: 0.87 } }];
                iconNode.strokeWeight = 2;
                if (varMap["notification/icon"]) bindPaintVar(iconNode, "strokes", 0, varMap["notification/icon"]);
              } else {
                iconNode.fills = [{ type: "SOLID", color: { r: 0.2, g: 0.53, b: 0.87 } }];
                if (varMap["notification/icon"]) bindPaintVar(iconNode, "fills", 0, varMap["notification/icon"]);
              }
              comp.appendChild(iconNode);
            }

            var textLeft = (withIcon || isLoading) ? 46 : 24;
            var textWidth = withClose ? 280 : 305;

            var titleNode = figma.createText();
            titleNode.name = "title";
            titleNode.fontName = font;
            titleNode.characters = "We notify you that";
            titleNode.fontSize = 14;
            titleNode.x = textLeft;
            titleNode.y = 12;
            titleNode.textAutoResize = "HEIGHT";
            titleNode.resize(textWidth, titleNode.height);
            titleNode.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
            if (varMap["notification/title"]) bindPaintVar(titleNode, "fills", 0, varMap["notification/title"]);
            if (varMap["notification/title-font-size"]) bindVar(titleNode, "fontSize", varMap["notification/title-font-size"]);
            comp.appendChild(titleNode);

            var descNode = figma.createText();
            descNode.name = "description";
            descNode.fontName = font;
            descNode.characters = "You are now obligated to give a star to Mantine project on GitHub";
            descNode.fontSize = 13;
            descNode.x = textLeft;
            descNode.y = 44;
            descNode.textAutoResize = "HEIGHT";
            descNode.resize(textWidth, descNode.height);
            descNode.fills = [{ type: "SOLID", color: { r: 0.35, g: 0.37, b: 0.4 } }];
            if (varMap["notification/description"]) bindPaintVar(descNode, "fills", 0, varMap["notification/description"]);
            if (varMap["notification/description-font-size"]) bindVar(descNode, "fontSize", varMap["notification/description-font-size"]);
            comp.appendChild(descNode);

            if (withClose) {
              var closeNode = figma.createText();
              closeNode.name = "close";
              closeNode.fontName = font;
              closeNode.characters = "×";
              closeNode.fontSize = 14;
              closeNode.x = 338;
              closeNode.y = 12;
              closeNode.fills = [{ type: "SOLID", color: { r: 0.35, g: 0.37, b: 0.4 } }];
              if (varMap["notification/close"]) bindPaintVar(closeNode, "fills", 0, varMap["notification/close"]);
              comp.appendChild(closeNode);
            }

            var colIndex = ri * borderStates.length + bi;
            var rowIndex = ((ci * iconStates.length + ii) * loadingStates.length) + li;
            comp.x = colIndex * (colWidth + gap);
            comp.y = rowIndex * (rowHeight + gap);

            page.appendChild(comp);
            components.push(comp);
          }
        }
      }
    }
  }

  progress("Created " + components.length + " notification variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Notification";
  return componentSet;
}

// ---------------------------------------------------------------------------
// Alert Component Set
// ---------------------------------------------------------------------------

async function buildAlertComponentSet(varMap, page, font) {
  var variants = ["default", "filled", "light", "outline", "transparent", "white"];
  var radii = ["xs", "sm", "md", "lg", "xl"];
  var closeStates = ["off", "on"];
  var iconStates = ["off", "on"];
  var components = [];
  var gap = 24;
  var colWidth = 420;
  var rowHeight = 130;

  function cap(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  var alertIcons = await findAlertIconComponents();
  if (alertIcons.warning) progress("[Alert] Icon source: " + alertIcons.warning.name);
  else progress("[Alert] Warning icon not found");
  if (alertIcons.close) progress("[Alert] Close source: " + alertIcons.close.name);
  else progress("[Alert] Close icon not found");

  for (var vi = 0; vi < variants.length; vi++) {
    var variant = variants[vi];
    var capVariant = cap(variant);

    for (var ri = 0; ri < radii.length; ri++) {
      var radius = radii[ri];
      var capRadius = radius.toUpperCase();

      for (var ci = 0; ci < closeStates.length; ci++) {
        var withClose = closeStates[ci] === "on";
        var capClose = withClose ? "On" : "Off";

        for (var ii = 0; ii < iconStates.length; ii++) {
          var withIcon = iconStates[ii] === "on";
          var capIcon = withIcon ? "On" : "Off";

          var comp = figma.createComponent();
          comp.name =
            "Variant=" + capVariant +
            ", Radius=" + capRadius +
            ", Close=" + capClose +
            ", Icon=" + capIcon;
          comp.resize(380, 110);
          comp.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
          comp.strokes = [{ type: "SOLID", color: { r: 0.84, g: 0.84, b: 0.84 } }];
          comp.strokeWeight = 1;
          comp.strokeAlign = "INSIDE";
          comp.cornerRadius = 8;

          bindPaintVar(comp, "fills", 0, varMap["alert/" + variant + "-background"]);
          bindPaintVar(comp, "strokes", 0, varMap["alert/" + variant + "-border"]);
          bindVar(comp, "strokeWeight", varMap["alert/border-width"]);
          bindVar(comp, "topLeftRadius", varMap["alert/radius-" + radius]);
          bindVar(comp, "topRightRadius", varMap["alert/radius-" + radius]);
          bindVar(comp, "bottomLeftRadius", varMap["alert/radius-" + radius]);
          bindVar(comp, "bottomRightRadius", varMap["alert/radius-" + radius]);

          var textWidth = withClose ? 316 : 340;
          var body = figma.createFrame();
          body.name = "body";
          body.layoutMode = "VERTICAL";
          body.primaryAxisSizingMode = "AUTO";
          body.counterAxisSizingMode = "AUTO";
          body.primaryAxisAlignItems = "MIN";
          body.counterAxisAlignItems = "MIN";
          body.itemSpacing = 0;
          body.fills = [];
          body.x = 14;
          body.y = 10;
          comp.appendChild(body);

          var titleRow = figma.createFrame();
          titleRow.name = "title-row";
          titleRow.layoutMode = "HORIZONTAL";
          titleRow.primaryAxisSizingMode = "AUTO";
          titleRow.counterAxisSizingMode = "AUTO";
          titleRow.primaryAxisAlignItems = "MIN";
          titleRow.counterAxisAlignItems = "CENTER";
          titleRow.itemSpacing = 8;
          titleRow.fills = [];
          bindVar(titleRow, "itemSpacing", varMap["alert/icon-title-gap"]);
          body.appendChild(titleRow);

          if (withIcon) {
            var warningSource = alertIcons.warning || alertIcons.fallback;
            if (warningSource) {
              var warningInst = warningSource.createInstance();
              warningInst.name = "icon";
              try { warningInst.resize(16, 16); } catch (e) {}
              titleRow.appendChild(warningInst);
            }
          }

          var titleNode = figma.createText();
          titleNode.name = "title";
          titleNode.fontName = font;
          titleNode.characters = "Alert title";
          titleNode.fontSize = 14;
          titleNode.textAutoResize = "HEIGHT";
          titleNode.resize(textWidth, titleNode.height);
          titleNode.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
          bindPaintVar(titleNode, "fills", 0, varMap["alert/" + variant + "-text"]);
          bindVar(titleNode, "fontSize", varMap["alert/title-font-size"]);
          titleRow.appendChild(titleNode);

          var messageWrap = figma.createFrame();
          messageWrap.name = "message-wrap";
          messageWrap.layoutMode = "VERTICAL";
          messageWrap.primaryAxisSizingMode = "AUTO";
          messageWrap.counterAxisSizingMode = "AUTO";
          messageWrap.primaryAxisAlignItems = "MIN";
          messageWrap.counterAxisAlignItems = "MIN";
          messageWrap.paddingTop = 6;
          messageWrap.fills = [];
          bindVar(messageWrap, "paddingTop", varMap["alert/title-message-gap"]);
          body.appendChild(messageWrap);

          var messageNode = figma.createText();
          messageNode.name = "message";
          messageNode.fontName = font;
          messageNode.characters = "Lorem ipsum dolor sit amet consectetur adipiscing elit.";
          messageNode.fontSize = 13;
          messageNode.textAutoResize = "HEIGHT";
          messageNode.resize(textWidth, messageNode.height);
          messageNode.fills = [{ type: "SOLID", color: { r: 0.35, g: 0.37, b: 0.4 } }];
          bindPaintVar(messageNode, "fills", 0, varMap["alert/" + variant + "-text"]);
          bindVar(messageNode, "fontSize", varMap["alert/message-font-size"]);
          messageWrap.appendChild(messageNode);

          if (withClose) {
            var closeSource = alertIcons.close || alertIcons.fallback;
            if (closeSource) {
              var closeInst = closeSource.createInstance();
              closeInst.name = "close";
              try { closeInst.resize(16, 16); } catch (e) {}
              closeInst.x = 356;
              closeInst.y = 10;
              comp.appendChild(closeInst);
            }
          }

          var colIndex = vi * radii.length + ri;
          var rowIndex = ci * iconStates.length + ii;
          comp.x = colIndex * (colWidth + gap);
          comp.y = rowIndex * (rowHeight + gap);
          page.appendChild(comp);
          components.push(comp);
        }
      }
    }
  }

  progress("Created " + components.length + " alert variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Alert";
  return componentSet;
}

async function buildModalComponentSet(varMap, page, font, sourceSets) {
  var sizes = ["xs", "sm", "md", "lg", "xl"];
  var radii = ["xs", "sm", "md", "lg", "xl"];
  var overlayStates = ["off", "on"];
  var closeStates = ["off", "on"];
  var layouts = ["basic", "actions-right", "centered-ack"];
  var components = [];
  var buttonSet = sourceSets && sourceSets.buttonSet ? sourceSets.buttonSet : null;
  var titleSet = sourceSets && sourceSets.titleSet ? sourceSets.titleSet : null;
  var textSet = sourceSets && sourceSets.textSet ? sourceSets.textSet : null;

  var widthBySize = { xs: 280, sm: 340, md: 420, lg: 520, xl: 640 };
  var colGap = 28;
  var rowGap = 22;
  var colWidth = 700 + colGap;
  var rowHeight = 420 + rowGap;

  function cap(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function findVariantComponent(componentSet, criteria) {
    if (!componentSet || !componentSet.children || !criteria) return null;
    var children = componentSet.children;
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child.type !== "COMPONENT") continue;
      var normalizedName = child.name.toLowerCase().replace(/\s+/g, "");
      var matches = true;
      for (var key in criteria) {
        if (!Object.prototype.hasOwnProperty.call(criteria, key)) continue;
        var token = (String(key) + "=" + String(criteria[key])).toLowerCase().replace(/\s+/g, "");
        if (normalizedName.indexOf(token) === -1) {
          matches = false;
          break;
        }
      }
      if (matches) return child;
    }
    return null;
  }

  var titleVariant = findVariantComponent(titleSet, { Order: "4", Size: "Auto" });
  var bodyTextVariant = findVariantComponent(textSet, { Size: "MD", Weight: "Regular", Color: "Default" });
  var cancelButtonVariant = findVariantComponent(buttonSet, { Variant: "Outlined", Size: "MD", State: "Default" });
  var confirmButtonVariant = findVariantComponent(buttonSet, { Variant: "Filled", Size: "MD", State: "Default" });
  var alertIcons = await findAlertIconComponents();
  var modalCloseIconSource = alertIcons.close || alertIcons.fallback;

  for (var si = 0; si < sizes.length; si++) {
    var size = sizes[si];
    var capSize = size.toUpperCase();
    var panelW = widthBySize[size] || 420;

    for (var ri = 0; ri < radii.length; ri++) {
      var radius = radii[ri];
      var capRadius = radius.toUpperCase();

      for (var oi = 0; oi < overlayStates.length; oi++) {
        var withOverlay = overlayStates[oi] === "on";
        var capOverlay = withOverlay ? "On" : "Off";

        for (var ci = 0; ci < closeStates.length; ci++) {
          var withClose = closeStates[ci] === "on";
          var capClose = withClose ? "On" : "Off";

          for (var li = 0; li < layouts.length; li++) {
            var layout = layouts[li];
            var centered = layout === "centered-ack";
            var capLayout = cap(layout);

            var comp = figma.createComponent();
            comp.name =
              "Size=" + capSize +
              ", Radius=" + capRadius +
              ", Overlay=" + capOverlay +
              ", Close=" + capClose +
              ", Layout=" + capLayout;
            comp.resize(700, 420);
            comp.fills = [];

            var overlay = figma.createRectangle();
            overlay.name = "overlay";
            overlay.resize(700, 420);
            overlay.x = 0;
            overlay.y = 0;
            overlay.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
            overlay.opacity = withOverlay ? 0.45 : 0;
            bindPaintVar(overlay, "fills", 0, varMap["modal/overlay"]);
            bindVar(overlay, "opacity", varMap["modal/overlay-opacity"]);
            comp.appendChild(overlay);

            var panel = figma.createFrame();
            panel.name = "modal";
            panel.layoutMode = "VERTICAL";
            panel.primaryAxisSizingMode = "AUTO";
            panel.counterAxisSizingMode = "FIXED";
            panel.counterAxisAlignItems = "MIN";
            panel.itemSpacing = 0;
            panel.resize(panelW, 220);
            panel.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
            panel.strokes = [{ type: "SOLID", color: { r: 0.86, g: 0.86, b: 0.86 } }];
            panel.strokeWeight = 1;
            panel.strokeAlign = "INSIDE";
            panel.cornerRadius = 8;
            panel.clipsContent = true;
            bindPaintVar(panel, "fills", 0, varMap["modal/background"]);
            bindPaintVar(panel, "strokes", 0, varMap["modal/border"]);
            bindVar(panel, "strokeWeight", varMap["modal/border-width"]);
            bindVar(panel, "minWidth", varMap["modal/width-" + size]);
            bindVar(panel, "maxWidth", varMap["modal/width-" + size]);
            bindVar(panel, "topLeftRadius", varMap["modal/radius-" + radius]);
            bindVar(panel, "topRightRadius", varMap["modal/radius-" + radius]);
            bindVar(panel, "bottomLeftRadius", varMap["modal/radius-" + radius]);
            bindVar(panel, "bottomRightRadius", varMap["modal/radius-" + radius]);

            panel.x = Math.round((700 - panelW) / 2);
            panel.y = centered ? 104 : 28;
            comp.appendChild(panel);

            var header = figma.createFrame();
            header.name = "header";
            header.layoutMode = "HORIZONTAL";
            header.primaryAxisSizingMode = "FIXED";
            header.counterAxisSizingMode = "AUTO";
            header.primaryAxisAlignItems = layout === "centered-ack" ? "CENTER" : "SPACE_BETWEEN";
            header.counterAxisAlignItems = "CENTER";
            header.resize(panelW, 56);
            header.paddingLeft = 16;
            header.paddingRight = 16;
            header.paddingTop = 14;
            header.paddingBottom = 14;
            header.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
            bindVar(header, "paddingLeft", varMap["modal/padding-x"]);
            bindVar(header, "paddingRight", varMap["modal/padding-x"]);
            bindVar(header, "paddingTop", varMap["modal/padding-y"]);
            bindVar(header, "paddingBottom", varMap["modal/padding-y"]);
            bindPaintVar(header, "fills", 0, varMap["modal/header-background"]);
            panel.appendChild(header);

            var titleNode = null;
            if (titleVariant) {
              titleNode = titleVariant.createInstance();
              titleNode.name = "title";
              try {
                titleNode.resize(Math.max(120, panelW - (withClose ? 88 : 32)), 28);
              } catch (e) {}
            } else {
              titleNode = figma.createText();
              titleNode.name = "title";
              titleNode.fontName = font;
              titleNode.characters = "Modal title";
              titleNode.fontSize = 18;
              titleNode.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
              bindPaintVar(titleNode, "fills", 0, varMap["modal/title"]);
              bindVar(titleNode, "fontSize", varMap["modal/title-font-size"]);
            }
            header.appendChild(titleNode);

            if (withClose) {
              if (modalCloseIconSource) {
                var closeIconInst = modalCloseIconSource.createInstance();
                closeIconInst.name = "close";
                try { closeIconInst.resize(16, 16); } catch (e) {}
                header.appendChild(closeIconInst);
              } else {
                var closeNode = figma.createText();
                closeNode.name = "close";
                closeNode.fontName = font;
                closeNode.characters = "×";
                closeNode.fontSize = 18;
                closeNode.fills = [{ type: "SOLID", color: { r: 0.35, g: 0.37, b: 0.4 } }];
                bindPaintVar(closeNode, "fills", 0, varMap["modal/close"]);
                header.appendChild(closeNode);
              }
            }

            var bodyWrap = figma.createFrame();
            bodyWrap.name = "body-wrap";
            bodyWrap.layoutMode = "VERTICAL";
            bodyWrap.primaryAxisSizingMode = "FIXED";
            bodyWrap.counterAxisSizingMode = "AUTO";
            bodyWrap.counterAxisAlignItems = "MIN";
            bodyWrap.resize(panelW, layout === "actions-right" ? 130 : 100);
            bodyWrap.paddingLeft = 16;
            bodyWrap.paddingRight = 16;
            bodyWrap.paddingBottom = 14;
            bodyWrap.itemSpacing = 10;
            bodyWrap.fills = [];
            bindVar(bodyWrap, "paddingLeft", varMap["modal/padding-x"]);
            bindVar(bodyWrap, "paddingRight", varMap["modal/padding-x"]);
            bindVar(bodyWrap, "paddingBottom", varMap["modal/padding-y"]);
            panel.appendChild(bodyWrap);

            var bodyNode = null;
            if (bodyTextVariant) {
              bodyNode = bodyTextVariant.createInstance();
              bodyNode.name = "body";
              try {
                bodyNode.resize(panelW - 32, layout === "actions-right" ? 68 : 58);
              } catch (e) {}
            } else {
              bodyNode = figma.createText();
              bodyNode.name = "body";
              bodyNode.fontName = font;
              bodyNode.characters = "This action cannot be undone. Please confirm you want to proceed.";
              bodyNode.fontSize = 14;
              bodyNode.textAutoResize = "HEIGHT";
              bodyNode.resize(panelW - 32, bodyNode.height);
              bodyNode.fills = [{ type: "SOLID", color: { r: 0.35, g: 0.37, b: 0.4 } }];
              bindPaintVar(bodyNode, "fills", 0, varMap["modal/body"]);
              bindVar(bodyNode, "fontSize", varMap["modal/body-font-size"]);
            }
            bodyWrap.appendChild(bodyNode);

            if (layout === "actions-right") {
              var actionRow = figma.createFrame();
              actionRow.name = "actions";
              actionRow.layoutMode = "HORIZONTAL";
              actionRow.primaryAxisSizingMode = "FIXED";
              actionRow.counterAxisSizingMode = "AUTO";
              actionRow.primaryAxisAlignItems = "MAX";
              actionRow.counterAxisAlignItems = "CENTER";
              actionRow.itemSpacing = 10;
              actionRow.resize(panelW - 32, 34);
              actionRow.fills = [];
              bodyWrap.appendChild(actionRow);

              if (cancelButtonVariant && confirmButtonVariant) {
                var cancelBtnInstance = cancelButtonVariant.createInstance();
                cancelBtnInstance.name = "Cancel";
                actionRow.appendChild(cancelBtnInstance);

                var yesBtnInstance = confirmButtonVariant.createInstance();
                yesBtnInstance.name = "Yes";
                actionRow.appendChild(yesBtnInstance);
              } else {
                var cancelBtn = figma.createFrame();
                cancelBtn.name = "Cancel";
                cancelBtn.layoutMode = "HORIZONTAL";
                cancelBtn.primaryAxisSizingMode = "AUTO";
                cancelBtn.counterAxisSizingMode = "AUTO";
                cancelBtn.primaryAxisAlignItems = "CENTER";
                cancelBtn.counterAxisAlignItems = "CENTER";
                cancelBtn.paddingLeft = 14;
                cancelBtn.paddingRight = 14;
                cancelBtn.paddingTop = 8;
                cancelBtn.paddingBottom = 8;
                cancelBtn.cornerRadius = 6;
                cancelBtn.fills = [];
                cancelBtn.strokes = [{ type: "SOLID", color: { r: 0.75, g: 0.75, b: 0.75 } }];
                actionRow.appendChild(cancelBtn);

                var cancelTxt = figma.createText();
                cancelTxt.fontName = font;
                cancelTxt.characters = "Cancel";
                cancelTxt.fontSize = 14;
                cancelTxt.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
                cancelBtn.appendChild(cancelTxt);

                var yesBtn = figma.createFrame();
                yesBtn.name = "Yes";
                yesBtn.layoutMode = "HORIZONTAL";
                yesBtn.primaryAxisSizingMode = "AUTO";
                yesBtn.counterAxisSizingMode = "AUTO";
                yesBtn.primaryAxisAlignItems = "CENTER";
                yesBtn.counterAxisAlignItems = "CENTER";
                yesBtn.paddingLeft = 16;
                yesBtn.paddingRight = 16;
                yesBtn.paddingTop = 8;
                yesBtn.paddingBottom = 8;
                yesBtn.cornerRadius = 6;
                yesBtn.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
                actionRow.appendChild(yesBtn);

                var yesTxt = figma.createText();
                yesTxt.fontName = font;
                yesTxt.characters = "Yes";
                yesTxt.fontSize = 14;
                yesTxt.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
                yesBtn.appendChild(yesTxt);
              }
            }

            if (layout === "centered-ack") {
              var divider = figma.createLine();
              divider.name = "divider";
              divider.resize(panelW - 32, 1);
              divider.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
              divider.strokeWeight = 1;
              divider.x = 16;
              divider.y = panel.height - 56;
              panel.appendChild(divider);

              var footer = figma.createFrame();
              footer.name = "footer";
              footer.layoutMode = "HORIZONTAL";
              footer.primaryAxisSizingMode = "FIXED";
              footer.counterAxisSizingMode = "AUTO";
              footer.primaryAxisAlignItems = "SPACE_BETWEEN";
              footer.counterAxisAlignItems = "CENTER";
              footer.resize(panelW, 56);
              footer.paddingLeft = 16;
              footer.paddingRight = 16;
              footer.paddingTop = 10;
              footer.paddingBottom = 10;
              footer.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
              bindPaintVar(footer, "fills", 0, varMap["modal/footer-background"]);
              panel.appendChild(footer);

              if (cancelButtonVariant && confirmButtonVariant) {
                var declineBtnInstance = cancelButtonVariant.createInstance();
                declineBtnInstance.name = "Decline";
                footer.appendChild(declineBtnInstance);

                var acceptBtnInstance = confirmButtonVariant.createInstance();
                acceptBtnInstance.name = "Accept";
                footer.appendChild(acceptBtnInstance);
              } else {
                var decline = figma.createText();
                decline.fontName = font;
                decline.characters = "Decline";
                decline.fontSize = 14;
                decline.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
                footer.appendChild(decline);

                var accept = figma.createText();
                accept.fontName = font;
                accept.characters = "Accept";
                accept.fontSize = 14;
                accept.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
                footer.appendChild(accept);
              }
            }

            var colIndex = (ri * overlayStates.length + oi) * closeStates.length + ci;
            var rowIndex = si * layouts.length + li;
            comp.x = colIndex * colWidth;
            comp.y = rowIndex * rowHeight;
            page.appendChild(comp);
            components.push(comp);
          }
        }
      }
    }
  }

  progress("Created " + components.length + " modal variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Modal";
  return componentSet;
}

async function findAlertIconComponents() {
  var iconCandidates = [];
  var iconsPage = null;

  for (var pi = 0; pi < figma.root.children.length; pi++) {
    var page = figma.root.children[pi];
    if (page.type !== "PAGE") continue;
    await page.loadAsync();
    if (!iconsPage && page.name && page.name.toLowerCase() === "icons") {
      iconsPage = page;
    }
  }

  var searchScope = iconsPage || figma.root;
  var nodes = searchScope.findAll(function(n) {
    return n.type === "COMPONENT" || n.type === "COMPONENT_SET";
  });

  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].type === "COMPONENT") {
      iconCandidates.push(nodes[i]);
    } else if (nodes[i].type === "COMPONENT_SET") {
      var setChildren = nodes[i].children || [];
      for (var ci = 0; ci < setChildren.length; ci++) {
        if (setChildren[ci].type === "COMPONENT") iconCandidates.push(setChildren[ci]);
      }
    }
  }

  function normalizeName(name) {
    return String(name || "").toLowerCase().replace(/[\s_\-\/]+/g, "");
  }

  function pickBest(target) {
    if (!iconCandidates.length) return null;
    var scored = [];
    for (var j = 0; j < iconCandidates.length; j++) {
      var raw = String(iconCandidates[j].name || "").toLowerCase();
      var n = normalizeName(raw);
      var score = 0;
      if (target === "warning") {
        if (n.indexOf("alerttriangle") >= 0) score += 100;
        if (n.indexOf("warning") >= 0) score += 70;
        if (n.indexOf("alert") >= 0) score += 30;
        if (n.indexOf("triangle") >= 0) score += 20;
      } else if (target === "close") {
        if (n.indexOf("xclose") >= 0) score += 100;
        if (n.indexOf("close") >= 0) score += 70;
        if (n.indexOf("x") >= 0) score += 15;
      }
      // Prefer line/icon sets over random components.
      if (raw.indexOf("icon") >= 0 || raw.indexOf("line") >= 0) score += 10;
      if (score > 0) scored.push({ comp: iconCandidates[j], score: score });
    }
    if (!scored.length) return null;
    scored.sort(function(a, b) { return b.score - a.score; });
    return scored[0].comp;
  }

  var warningIcon = pickBest("warning");
  var closeIcon = pickBest("close");
  var fallbackIcon = iconCandidates.length
    ? iconCandidates.slice().sort(function(a, b) { return a.name.localeCompare(b.name); })[0]
    : null;

  return { warning: warningIcon, close: closeIcon, fallback: fallbackIcon };
}

// ---------------------------------------------------------------------------
// Tooltip Component Set
// ---------------------------------------------------------------------------

function buildTooltipComponentSet(varMap, page, font) {
  var directions = ["top", "bottom", "left", "right"];
  var arrowStates = ["with-arrow", "without-arrow"];
  var components = [];
  var arrowSize = 7;
  var gap = 16;

  for (var di = 0; di < directions.length; di++) {
    for (var ai = 0; ai < arrowStates.length; ai++) {
      var direction = directions[di];
      var hasArrow = arrowStates[ai] === "with-arrow";
      var isVertical = (direction === "top" || direction === "bottom");

      // Outer component wraps body + optional arrow
      var comp = figma.createComponent();
      comp.name = "Direction=" + direction + ", Arrow=" + arrowStates[ai];
      comp.layoutMode = isVertical ? "VERTICAL" : "HORIZONTAL";
      comp.primaryAxisAlignItems = "CENTER";
      comp.counterAxisAlignItems = "CENTER";
      comp.primaryAxisSizingMode = "AUTO";
      comp.counterAxisSizingMode = "AUTO";
      comp.itemSpacing = 0;
      comp.fills = [];

      // Tooltip body frame
      var body = figma.createFrame();
      body.name = "body";
      body.layoutMode = "HORIZONTAL";
      body.primaryAxisAlignItems = "CENTER";
      body.counterAxisAlignItems = "CENTER";
      body.primaryAxisSizingMode = "AUTO";
      body.counterAxisSizingMode = "AUTO";
      body.paddingTop = 4;
      body.paddingBottom = 4;
      body.paddingLeft = 8;
      body.paddingRight = 8;
      body.itemSpacing = 0;
      body.fills = [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }];
      body.cornerRadius = 4;

      if (varMap["tooltip/background"]) {
        bindPaintVar(body, "fills", 0, varMap["tooltip/background"]);
      }
      if (varMap["tooltip/radius"]) {
        bindVar(body, "topLeftRadius", varMap["tooltip/radius"]);
        bindVar(body, "topRightRadius", varMap["tooltip/radius"]);
        bindVar(body, "bottomLeftRadius", varMap["tooltip/radius"]);
        bindVar(body, "bottomRightRadius", varMap["tooltip/radius"]);
      }
      if (varMap["tooltip/padding-x"]) {
        bindVar(body, "paddingLeft", varMap["tooltip/padding-x"]);
        bindVar(body, "paddingRight", varMap["tooltip/padding-x"]);
      }
      if (varMap["tooltip/padding-y"]) {
        bindVar(body, "paddingTop", varMap["tooltip/padding-y"]);
        bindVar(body, "paddingBottom", varMap["tooltip/padding-y"]);
      }

      // Text label
      var textNode = figma.createText();
      textNode.fontName = font;
      textNode.characters = "Tooltip";
      textNode.fontSize = 12;
      textNode.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
      if (varMap["tooltip/color"]) {
        bindPaintVar(textNode, "fills", 0, varMap["tooltip/color"]);
      }
      if (varMap["tooltip/font-size"]) {
        bindVar(textNode, "fontSize", varMap["tooltip/font-size"]);
      }
      body.appendChild(textNode);

      // Arrow triangle (only for with-arrow)
      // Use createVector with explicit path data so bounds match the triangle
      // exactly — no rotation needed, no bounding-box gaps.
      var arrow = null;
      if (hasArrow) {
        arrow = figma.createVector();
        arrow.name = "arrow";
        var half = arrowSize / 2;

        if (direction === "top") {
          // Arrow points down (tooltip above trigger)
          arrow.vectorPaths = [{ windingRule: "NONZERO", data: "M 0 0 L " + half + " " + half + " L " + arrowSize + " 0 Z" }];
          arrow.resize(arrowSize, half);
        } else if (direction === "bottom") {
          // Arrow points up (tooltip below trigger)
          arrow.vectorPaths = [{ windingRule: "NONZERO", data: "M 0 " + half + " L " + half + " 0 L " + arrowSize + " " + half + " Z" }];
          arrow.resize(arrowSize, half);
        } else if (direction === "left") {
          // Arrow points right (tooltip left of trigger)
          arrow.vectorPaths = [{ windingRule: "NONZERO", data: "M 0 0 L " + half + " " + half + " L 0 " + arrowSize + " Z" }];
          arrow.resize(half, arrowSize);
        } else {
          // Arrow points left (tooltip right of trigger)
          arrow.vectorPaths = [{ windingRule: "NONZERO", data: "M " + half + " 0 L 0 " + half + " L " + half + " " + arrowSize + " Z" }];
          arrow.resize(half, arrowSize);
        }

        arrow.fills = [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }];
        arrow.strokes = [];
        if (varMap["tooltip/background"]) {
          bindPaintVar(arrow, "fills", 0, varMap["tooltip/background"]);
        }
      }

      // Assemble: arrow placement depends on direction
      // "top" = tooltip above trigger → body first, arrow below
      // "bottom" = tooltip below → arrow on top, body below
      // "left" = tooltip left → body first, arrow right
      // "right" = tooltip right → arrow left, body right
      if (direction === "bottom" || direction === "right") {
        if (arrow) comp.appendChild(arrow);
        comp.appendChild(body);
      } else {
        comp.appendChild(body);
        if (arrow) comp.appendChild(arrow);
      }

      // Grid position
      var colWidth = 100;
      var rowHeight = 50;
      comp.x = ai * (colWidth + gap);
      comp.y = di * (rowHeight + gap);

      page.appendChild(comp);
      components.push(comp);
    }
  }

  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Tooltip";
  return componentSet;
}

// ---------------------------------------------------------------------------
// Loader Component Set
// ---------------------------------------------------------------------------

function buildLoaderComponentSet(varMap, page, font) {
  var types = ["oval", "bars", "dots"];
  var sizes = ["xs", "sm", "md", "lg", "xl"];
  var components = [];
  var sizePx = { xs: 14, sm: 18, md: 22, lg: 28, xl: 34 };
  var gap = 22;
  var colWidth = 120;
  var rowHeight = 80;

  for (var ti = 0; ti < types.length; ti++) {
    var type = types[ti];
    var capType = type.charAt(0).toUpperCase() + type.slice(1);
    for (var si = 0; si < sizes.length; si++) {
      var size = sizes[si];
      var capSize = size.toUpperCase();
      var s = sizePx[size];

      var comp = figma.createComponent();
      comp.name = "Type=" + capType + ", Size=" + capSize;
      comp.layoutMode = "HORIZONTAL";
      comp.primaryAxisSizingMode = "FIXED";
      comp.counterAxisSizingMode = "FIXED";
      comp.primaryAxisAlignItems = "CENTER";
      comp.counterAxisAlignItems = "CENTER";
      comp.resize(72, 56);
      comp.fills = [];

      if (type === "oval") {
        var ring = figma.createEllipse();
        ring.name = "Loader";
        ring.resize(s, s);
        ring.fills = [];
        ring.strokes = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
        ring.strokeWeight = Math.max(2, Math.round(s * 0.14));
        ring.strokeAlign = "CENTER";
        ring.arcData = { startingAngle: 0, endingAngle: Math.PI * 1.55, innerRadius: 0.72 };
        bindPaintVar(ring, "strokes", 0, varMap["loader/color"]);
        bindVar(ring, "width", varMap["loader/size-" + size]);
        bindVar(ring, "height", varMap["loader/size-" + size]);
        comp.appendChild(ring);
      } else if (type === "bars") {
        var bars = figma.createFrame();
        bars.name = "Loader";
        bars.layoutMode = "HORIZONTAL";
        bars.primaryAxisSizingMode = "AUTO";
        bars.counterAxisSizingMode = "AUTO";
        bars.primaryAxisAlignItems = "CENTER";
        bars.counterAxisAlignItems = "MAX";
        bars.itemSpacing = Math.max(2, Math.round(s * 0.12));
        bars.fills = [];
        comp.appendChild(bars);

        var barW = Math.max(2, Math.round(s * 0.14));
        var heights = [Math.round(s * 0.45), Math.round(s * 0.8), Math.round(s * 0.62)];
        for (var bi = 0; bi < 3; bi++) {
          var bar = figma.createRectangle();
          bar.name = "Bar " + (bi + 1);
          bar.resize(barW, heights[bi]);
          bar.cornerRadius = Math.max(1, Math.round(barW / 2));
          bar.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
          bindPaintVar(bar, "fills", 0, varMap["loader/color"]);
          bars.appendChild(bar);
        }
      } else {
        var dots = figma.createFrame();
        dots.name = "Loader";
        dots.layoutMode = "HORIZONTAL";
        dots.primaryAxisSizingMode = "AUTO";
        dots.counterAxisSizingMode = "AUTO";
        dots.primaryAxisAlignItems = "CENTER";
        dots.counterAxisAlignItems = "CENTER";
        dots.itemSpacing = Math.max(3, Math.round(s * 0.18));
        dots.fills = [];
        comp.appendChild(dots);

        var dotSize = Math.max(3, Math.round(s * 0.22));
        for (var di = 0; di < 3; di++) {
          var dot = figma.createEllipse();
          dot.name = "Dot " + (di + 1);
          dot.resize(dotSize, dotSize);
          dot.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
          bindPaintVar(dot, "fills", 0, varMap["loader/color"]);
          dot.opacity = di === 0 ? 1 : 0.45;
          dots.appendChild(dot);
        }
      }

      var colIndex = ti;
      var rowIndex = si;
      comp.x = colIndex * (colWidth + gap);
      comp.y = rowIndex * (rowHeight + gap);
      page.appendChild(comp);
      components.push(comp);
    }
  }

  progress("Created " + components.length + " loader variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Loader";
  return componentSet;
}

// ---------------------------------------------------------------------------
// Pill Component Set
// ---------------------------------------------------------------------------

function buildPillComponentSet(varMap, page, font) {
  var sizes = ["xs", "sm", "md", "lg", "xl"];
  var removeModes = ["off", "on"];
  var components = [];
  var heightBySize = { xs: 18, sm: 22, md: 26, lg: 30, xl: 36 };
  var colWidth = 200;
  var rowHeight = 70;
  var gap = 20;

  for (var ri = 0; ri < removeModes.length; ri++) {
    var removeMode = removeModes[ri];
    var withRemove = removeMode === "on";
    var capRemove = withRemove ? "On" : "Off";

    for (var si = 0; si < sizes.length; si++) {
      var size = sizes[si];
      var capSize = size.toUpperCase();
      var h = heightBySize[size];

      var comp = figma.createComponent();
      comp.name = "Size=" + capSize + ", Remove=" + capRemove;
      comp.layoutMode = "HORIZONTAL";
      comp.primaryAxisSizingMode = "AUTO";
      comp.counterAxisSizingMode = "AUTO";
      comp.primaryAxisAlignItems = "CENTER";
      comp.counterAxisAlignItems = "CENTER";
      comp.itemSpacing = 6;
      comp.paddingLeft = 10;
      comp.paddingRight = 10;
      comp.paddingTop = 0;
      comp.paddingBottom = 0;
      comp.minHeight = h;
      comp.cornerRadius = 12;
      comp.fills = [{ type: "SOLID", color: { r: 0.92, g: 0.96, b: 1 } }];
      comp.strokes = [{ type: "SOLID", color: { r: 0.78, g: 0.82, b: 0.87 } }];
      comp.strokeWeight = 1;
      comp.strokeAlign = "INSIDE";

      bindPaintVar(comp, "fills", 0, varMap["pill/background"]);
      bindPaintVar(comp, "strokes", 0, varMap["pill/border"]);
      bindVar(comp, "strokeWeight", varMap["pill/border-width"]);
      bindVar(comp, "minHeight", varMap["pill/height-" + size]);
      bindVar(comp, "paddingLeft", varMap["pill/padding-x-" + size]);
      bindVar(comp, "paddingRight", varMap["pill/padding-x-" + size]);
      bindVar(comp, "itemSpacing", varMap["pill/gap-" + size]);
      bindVar(comp, "topLeftRadius", varMap["pill/radius-" + size]);
      bindVar(comp, "topRightRadius", varMap["pill/radius-" + size]);
      bindVar(comp, "bottomLeftRadius", varMap["pill/radius-" + size]);
      bindVar(comp, "bottomRightRadius", varMap["pill/radius-" + size]);

      var label = figma.createText();
      label.name = "Label";
      label.fontName = font;
      label.characters = "React";
      label.fontSize = 12;
      label.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
      bindPaintVar(label, "fills", 0, varMap["pill/label"]);
      bindVar(label, "fontSize", varMap["pill/font-size-" + size]);
      comp.appendChild(label);

      if (withRemove) {
        var remove = figma.createText();
        remove.name = "Remove";
        remove.fontName = font;
        remove.characters = "×";
        remove.fontSize = 12;
        remove.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
        bindPaintVar(remove, "fills", 0, varMap["pill/remove"]);
        bindVar(remove, "fontSize", varMap["pill/remove-size-" + size]);
        comp.appendChild(remove);
      }

      var colIndex = ri;
      var rowIndex = si;
      comp.x = colIndex * (colWidth + gap);
      comp.y = rowIndex * (rowHeight + gap);
      page.appendChild(comp);
      components.push(comp);
    }
  }

  progress("Created " + components.length + " pill variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Pill";
  return componentSet;
}

// ---------------------------------------------------------------------------
// Badge Component Set
// ---------------------------------------------------------------------------

function buildBadgeComponentSet(varMap, page, font) {
  var variants = ["filled", "light", "outline", "dot"];
  var sizes = ["xs", "sm", "md", "lg", "xl"];
  var radii = ["xs", "sm", "md", "lg", "xl"];
  var circles = ["off", "on"];
  var components = [];

  var heightBySize = { xs: 16, sm: 18, md: 20, lg: 24, xl: 28 };
  var colWidth = 260;
  var rowHeight = 72;
  var gap = 18;

  function cap(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function colorPath(variant, property) {
    return "badge/" + variant + "-" + property;
  }

  for (var vi = 0; vi < variants.length; vi++) {
    var variant = variants[vi];
    var capVariant = cap(variant);
    var hasDot = variant === "dot";

    for (var ci = 0; ci < circles.length; ci++) {
      var circleMode = circles[ci];
      var isCircle = circleMode === "on";
      var capCircle = isCircle ? "On" : "Off";

      for (var si = 0; si < sizes.length; si++) {
        var size = sizes[si];
        var capSize = size.toUpperCase();
        var height = heightBySize[size];

        for (var ri = 0; ri < radii.length; ri++) {
          var radius = radii[ri];
          var capRadius = radius.toUpperCase();

          var comp = figma.createComponent();
          comp.name =
            "Variant=" + capVariant +
            ", Size=" + capSize +
            ", Radius=" + capRadius +
            ", Circle=" + capCircle;
          comp.layoutMode = "HORIZONTAL";
          comp.primaryAxisSizingMode = "AUTO";
          comp.counterAxisSizingMode = "AUTO";
          comp.primaryAxisAlignItems = "CENTER";
          comp.counterAxisAlignItems = "CENTER";
          comp.itemSpacing = 6;
          comp.paddingLeft = isCircle ? 0 : 10;
          comp.paddingRight = isCircle ? 0 : 10;
          comp.paddingTop = 0;
          comp.paddingBottom = 0;
          comp.minHeight = height;
          comp.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
          comp.strokes = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
          comp.strokeWeight = 1;
          comp.strokeAlign = "INSIDE";

          bindPaintVar(comp, "fills", 0, varMap[colorPath(variant, "background")]);
          bindPaintVar(comp, "strokes", 0, varMap[colorPath(variant, "border")]);
          bindVar(comp, "strokeWeight", varMap["badge/border-width"]);
          bindVar(comp, "minHeight", varMap["badge/height-" + size]);
          bindVar(comp, "paddingLeft", varMap["badge/padding-x-" + size]);
          bindVar(comp, "paddingRight", varMap["badge/padding-x-" + size]);
          bindVar(comp, "topLeftRadius", varMap["badge/radius-" + radius]);
          bindVar(comp, "topRightRadius", varMap["badge/radius-" + radius]);
          bindVar(comp, "bottomLeftRadius", varMap["badge/radius-" + radius]);
          bindVar(comp, "bottomRightRadius", varMap["badge/radius-" + radius]);

          if (isCircle) {
            var circleSize = Math.max(16, height);
            comp.minWidth = circleSize;
            comp.maxWidth = circleSize;
          }

          if (hasDot && !isCircle) {
            var dot = figma.createEllipse();
            dot.name = "Dot";
            dot.resize(6, 6);
            dot.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
            bindPaintVar(dot, "fills", 0, varMap["badge/dot-color"]);
            bindVar(dot, "minWidth", varMap["badge/dot-size-" + size]);
            bindVar(dot, "maxWidth", varMap["badge/dot-size-" + size]);
            bindVar(dot, "minHeight", varMap["badge/dot-size-" + size]);
            bindVar(dot, "maxHeight", varMap["badge/dot-size-" + size]);
            comp.appendChild(dot);
          }

          var label = figma.createText();
          label.name = "Label";
          label.fontName = font;
          label.characters = isCircle ? "8" : "Badge";
          label.fontSize = 12;
          label.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
          bindPaintVar(label, "fills", 0, varMap[colorPath(variant, "text")]);
          bindVar(label, "fontSize", varMap["badge/font-size-" + size]);
          comp.appendChild(label);

          var colIndex = vi * circles.length + ci;
          var rowIndex = si * radii.length + ri;
          comp.x = colIndex * (colWidth + gap);
          comp.y = rowIndex * (rowHeight + gap);
          page.appendChild(comp);
          components.push(comp);
        }
      }
    }
  }

  progress("Created " + components.length + " badge variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Badge";
  return componentSet;
}

// ---------------------------------------------------------------------------
// TextInput
// ---------------------------------------------------------------------------

function buildTextInputComponentSet(varMap, page, font) {
  var variants = ["default", "filled"];
  var sizes = ["xs", "sm", "md", "lg", "xl"];
  var radii = ["xs", "sm", "md", "lg", "xl"];
  var states = ["default", "hover", "focus", "error", "disabled"];
  var labelModes = ["none", "label", "required"];
  var components = [];

  var sizeHeights = { xs: 30, sm: 36, md: 42, lg: 50, xl: 60 };
  var gap = 20;
  var colWidth = 220;

  for (var vi = 0; vi < variants.length; vi++) {
    var variant = variants[vi];
    var capVariant = variant.charAt(0).toUpperCase() + variant.slice(1);

    for (var li = 0; li < labelModes.length; li++) {
      var labelMode = labelModes[li];
      var capLabelMode = labelMode.charAt(0).toUpperCase() + labelMode.slice(1);
      var hasLabel = (labelMode !== "none");
      var hasAsterisk = (labelMode === "required");

      for (var si = 0; si < sizes.length; si++) {
        var size = sizes[si];
        var capSize = size.toUpperCase();

        for (var ri = 0; ri < radii.length; ri++) {
          var rad = radii[ri];
          var capRad = rad.toUpperCase();

          for (var sti = 0; sti < states.length; sti++) {
            var state = states[sti];
            var capState = state.charAt(0).toUpperCase() + state.slice(1);

            var comp = figma.createComponent();
            comp.name = "Variant=" + capVariant + ", Size=" + capSize + ", Radius=" + capRad + ", State=" + capState + ", Label=" + capLabelMode;

            // Root: vertical auto-layout
            comp.layoutMode = "VERTICAL";
            comp.primaryAxisSizingMode = "AUTO";
            comp.counterAxisSizingMode = "AUTO";
            comp.itemSpacing = 4;
            comp.fills = [];

            if (varMap["textinput/label-gap"]) {
              bindVar(comp, "itemSpacing", varMap["textinput/label-gap"]);
            }

            // --- Optional label row ---
            if (hasLabel) {
              var labelRow = figma.createFrame();
              labelRow.name = "LabelRow";
              labelRow.layoutMode = "HORIZONTAL";
              labelRow.primaryAxisSizingMode = "AUTO";
              labelRow.counterAxisSizingMode = "AUTO";
              labelRow.itemSpacing = 2;
              labelRow.fills = [];

              var labelNode = figma.createText();
              labelNode.name = "Label";
              labelNode.fontName = font;
              labelNode.characters = "Label";
              labelNode.fontSize = 14;
              labelNode.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
              if (varMap["textinput/label-color"]) {
                bindPaintVar(labelNode, "fills", 0, varMap["textinput/label-color"]);
              }
              if (varMap["textinput/label-font-size"]) {
                bindVar(labelNode, "fontSize", varMap["textinput/label-font-size"]);
              }
              labelRow.appendChild(labelNode);

              if (hasAsterisk) {
                var asteriskNode = figma.createText();
                asteriskNode.name = "Asterisk";
                asteriskNode.fontName = font;
                asteriskNode.characters = " *";
                asteriskNode.fontSize = 14;
                asteriskNode.fills = [{ type: "SOLID", color: { r: 0.97, g: 0.33, b: 0.29 } }];
                if (varMap["textinput/asterisk-color"]) {
                  bindPaintVar(asteriskNode, "fills", 0, varMap["textinput/asterisk-color"]);
                }
                if (varMap["textinput/label-font-size"]) {
                  bindVar(asteriskNode, "fontSize", varMap["textinput/label-font-size"]);
                }
                labelRow.appendChild(asteriskNode);
              }

              comp.appendChild(labelRow);
            }

            // --- Input frame ---
            var input = figma.createFrame();
            input.name = "Input";
            input.layoutMode = "HORIZONTAL";
            input.primaryAxisSizingMode = "FIXED";
            input.counterAxisSizingMode = "AUTO";
            input.primaryAxisAlignItems = "MIN";
            input.counterAxisAlignItems = "CENTER";
            input.resize(200, sizeHeights[size]);
            input.cornerRadius = 4;
            input.paddingLeft = 10;
            input.paddingRight = 10;
            input.paddingTop = 0;
            input.paddingBottom = 0;
            input.minHeight = sizeHeights[size];

            // Bind input dimensions (size-based)
            if (varMap["textinput/height-" + size]) {
              bindVar(input, "minHeight", varMap["textinput/height-" + size]);
            }
            if (varMap["textinput/padding-x-" + size]) {
              bindVar(input, "paddingLeft", varMap["textinput/padding-x-" + size]);
              bindVar(input, "paddingRight", varMap["textinput/padding-x-" + size]);
            }
            // Bind radius (independent from size)
            if (varMap["textinput/radius-" + rad]) {
              bindVar(input, "topLeftRadius", varMap["textinput/radius-" + rad]);
              bindVar(input, "topRightRadius", varMap["textinput/radius-" + rad]);
              bindVar(input, "bottomLeftRadius", varMap["textinput/radius-" + rad]);
              bindVar(input, "bottomRightRadius", varMap["textinput/radius-" + rad]);
            }

            // Input background
            var bgPath = textInputColorPath(variant, "background", state);
            if (variant === "filled") {
              input.fills = [{ type: "SOLID", color: { r: 0.95, g: 0.95, b: 0.95 } }];
            } else {
              input.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
            }
            if (varMap[bgPath]) {
              bindPaintVar(input, "fills", 0, varMap[bgPath]);
            }

            // Input border
            var borderPath = textInputColorPath(variant, "border", state);
            input.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
            input.strokeWeight = 1;
            input.strokeAlign = "INSIDE";
            if (varMap[borderPath]) {
              bindPaintVar(input, "strokes", 0, varMap[borderPath]);
            }
            if (varMap["textinput/border-width"]) {
              bindVar(input, "strokeWeight", varMap["textinput/border-width"]);
            }

            // Text inside input
            var textNode = figma.createText();
            textNode.name = (state === "focus") ? "InputText" : "Placeholder";
            textNode.fontName = font;
            textNode.characters = (state === "focus") ? "Input text" : "Placeholder";
            textNode.fontSize = 14;

            if (state === "disabled") {
              textNode.fills = [{ type: "SOLID", color: { r: 0.6, g: 0.6, b: 0.6 } }];
              if (varMap["textinput/text-disabled"]) {
                bindPaintVar(textNode, "fills", 0, varMap["textinput/text-disabled"]);
              }
            } else if (state === "focus") {
              textNode.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
              if (varMap["textinput/text"]) {
                bindPaintVar(textNode, "fills", 0, varMap["textinput/text"]);
              }
            } else {
              textNode.fills = [{ type: "SOLID", color: { r: 0.6, g: 0.6, b: 0.6 } }];
              if (varMap["textinput/placeholder"]) {
                bindPaintVar(textNode, "fills", 0, varMap["textinput/placeholder"]);
              }
            }
            if (varMap["textinput/font-size-" + size]) {
              bindVar(textNode, "fontSize", varMap["textinput/font-size-" + size]);
            }

            input.appendChild(textNode);

            // Focus ring effect
            if (state === "focus") {
              input.effects = [{
                type: "DROP_SHADOW",
                color: { r: 0.2, g: 0.53, b: 0.87, a: 0.25 },
                offset: { x: 0, y: 0 },
                radius: 0,
                spread: 3,
                visible: true,
                blendMode: "NORMAL"
              }];
            }

            comp.appendChild(input);

            // --- Error text (only for error state) ---
            if (state === "error") {
              var errorNode = figma.createText();
              errorNode.name = "Error";
              errorNode.fontName = font;
              errorNode.characters = "Error message";
              errorNode.fontSize = 12;
              errorNode.fills = [{ type: "SOLID", color: { r: 0.97, g: 0.33, b: 0.29 } }];
              if (varMap["textinput/error-color"]) {
                bindPaintVar(errorNode, "fills", 0, varMap["textinput/error-color"]);
              }
              if (varMap["textinput/error-font-size"]) {
                bindVar(errorNode, "fontSize", varMap["textinput/error-font-size"]);
              }
              comp.appendChild(errorNode);
            }

            // Disabled opacity
            if (state === "disabled") {
              comp.opacity = 0.6;
            }

            // Grid placement
            var colIndex = vi * labelModes.length + li;
            var rowIndex = (si * radii.length + ri) * states.length + sti;
            comp.x = colIndex * (colWidth + gap);
            comp.y = rowIndex * 80;

            page.appendChild(comp);
            components.push(comp);
          }
        }
      }
    }
  }

  progress("Created " + components.length + " text input variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "TextInput";
  return componentSet;
}

function textInputColorPath(variant, property, state) {
  if (state === "default") {
    return "textinput/" + variant + "-" + property;
  }
  return "textinput/" + variant + "-" + property + "-" + state;
}

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

async function buildSelectComponentSet(varMap, page, font) {
  var variants = ["default", "filled"];
  var sizes = ["xs", "sm", "md", "lg", "xl"];
  var radii = ["xs", "sm", "md", "lg", "xl"];
  var states = ["default", "hover", "focus", "error", "disabled"];
  var labelModes = ["none", "label", "required"];
  var components = [];

  // Find a chevron/down icon component from icon components or icon sets.
  var chevronIconComp = await findSelectChevronIconComponent();
  if (chevronIconComp) {
    console.log("[Select] Icon source: " + chevronIconComp.name);
    progress("[Select] Right icon source: " + chevronIconComp.name);
  } else {
    console.log("[Select] WARNING: no icon component found, using vector fallback");
    progress("[Select] Warning: no icon component found, using vector fallback");
  }

  var sizeHeights = { xs: 30, sm: 36, md: 42, lg: 50, xl: 60 };
  var gap = 20;
  var colWidth = 220;

  for (var vi = 0; vi < variants.length; vi++) {
    var variant = variants[vi];
    var capVariant = variant.charAt(0).toUpperCase() + variant.slice(1);

    for (var li = 0; li < labelModes.length; li++) {
      var labelMode = labelModes[li];
      var capLabelMode = labelMode.charAt(0).toUpperCase() + labelMode.slice(1);
      var hasLabel = (labelMode !== "none");
      var hasAsterisk = (labelMode === "required");

      for (var si = 0; si < sizes.length; si++) {
        var size = sizes[si];
        var capSize = size.toUpperCase();

        for (var ri = 0; ri < radii.length; ri++) {
          var rad = radii[ri];
          var capRad = rad.toUpperCase();

          for (var sti = 0; sti < states.length; sti++) {
            var state = states[sti];
            var capState = state.charAt(0).toUpperCase() + state.slice(1);

            var comp = figma.createComponent();
            comp.name = "Variant=" + capVariant + ", Size=" + capSize + ", Radius=" + capRad + ", State=" + capState + ", Label=" + capLabelMode;
            comp.layoutMode = "VERTICAL";
            comp.primaryAxisSizingMode = "AUTO";
            comp.counterAxisSizingMode = "AUTO";
            comp.itemSpacing = 4;
            comp.fills = [];

            if (varMap["select/label-gap"]) {
              bindVar(comp, "itemSpacing", varMap["select/label-gap"]);
            }

            if (hasLabel) {
              var labelRow = figma.createFrame();
              labelRow.name = "LabelRow";
              labelRow.layoutMode = "HORIZONTAL";
              labelRow.primaryAxisSizingMode = "AUTO";
              labelRow.counterAxisSizingMode = "AUTO";
              labelRow.itemSpacing = 2;
              labelRow.fills = [];

              var labelNode = figma.createText();
              labelNode.name = "Label";
              labelNode.fontName = font;
              labelNode.characters = "Label";
              labelNode.fontSize = 14;
              labelNode.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
              if (varMap["select/label-color"]) {
                bindPaintVar(labelNode, "fills", 0, varMap["select/label-color"]);
              }
              if (varMap["select/label-font-size"]) {
                bindVar(labelNode, "fontSize", varMap["select/label-font-size"]);
              }
              labelRow.appendChild(labelNode);

              if (hasAsterisk) {
                var asteriskNode = figma.createText();
                asteriskNode.name = "Asterisk";
                asteriskNode.fontName = font;
                asteriskNode.characters = " *";
                asteriskNode.fontSize = 14;
                asteriskNode.fills = [{ type: "SOLID", color: { r: 0.97, g: 0.33, b: 0.29 } }];
                if (varMap["select/asterisk-color"]) {
                  bindPaintVar(asteriskNode, "fills", 0, varMap["select/asterisk-color"]);
                }
                if (varMap["select/label-font-size"]) {
                  bindVar(asteriskNode, "fontSize", varMap["select/label-font-size"]);
                }
                labelRow.appendChild(asteriskNode);
              }

              comp.appendChild(labelRow);
            }

            var input = figma.createFrame();
            input.name = "SelectInput";
            input.layoutMode = "HORIZONTAL";
            input.primaryAxisSizingMode = "FIXED";
            input.counterAxisSizingMode = "AUTO";
            input.primaryAxisAlignItems = "SPACE_BETWEEN";
            input.counterAxisAlignItems = "CENTER";
            input.resize(200, sizeHeights[size]);
            input.cornerRadius = 4;
            input.paddingLeft = 10;
            input.paddingRight = 10;
            input.minHeight = sizeHeights[size];
            input.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
            input.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
            input.strokeWeight = 1;
            input.strokeAlign = "INSIDE";

            if (varMap["select/height-" + size]) bindVar(input, "minHeight", varMap["select/height-" + size]);
            if (varMap["select/padding-x-" + size]) {
              bindVar(input, "paddingLeft", varMap["select/padding-x-" + size]);
              bindVar(input, "paddingRight", varMap["select/padding-x-" + size]);
            }
            if (varMap["select/radius-" + rad]) {
              bindVar(input, "topLeftRadius", varMap["select/radius-" + rad]);
              bindVar(input, "topRightRadius", varMap["select/radius-" + rad]);
              bindVar(input, "bottomLeftRadius", varMap["select/radius-" + rad]);
              bindVar(input, "bottomRightRadius", varMap["select/radius-" + rad]);
            }
            if (varMap["select/border-width"]) bindVar(input, "strokeWeight", varMap["select/border-width"]);

            var bgPath = selectColorPath(variant, "background", state);
            if (varMap[bgPath]) bindPaintVar(input, "fills", 0, varMap[bgPath]);
            var borderPath = selectColorPath(variant, "border", state);
            if (varMap[borderPath]) bindPaintVar(input, "strokes", 0, varMap[borderPath]);

            var valueNode = figma.createText();
            valueNode.name = (state === "focus") ? "Value" : "Placeholder";
            valueNode.fontName = font;
            valueNode.characters = (state === "focus") ? "Option one" : "Pick one";
            valueNode.fontSize = 14;
            valueNode.fills = [{ type: "SOLID", color: { r: 0.6, g: 0.6, b: 0.6 } }];
            if (state === "focus") {
              if (varMap["select/text"]) bindPaintVar(valueNode, "fills", 0, varMap["select/text"]);
            } else if (state === "disabled") {
              if (varMap["select/text-disabled"]) bindPaintVar(valueNode, "fills", 0, varMap["select/text-disabled"]);
            } else {
              if (varMap["select/placeholder"]) bindPaintVar(valueNode, "fills", 0, varMap["select/placeholder"]);
            }
            if (varMap["select/font-size-" + size]) bindVar(valueNode, "fontSize", varMap["select/font-size-" + size]);
            input.appendChild(valueNode);

            var chevronSlot = figma.createFrame();
            chevronSlot.name = "ChevronSlot";
            chevronSlot.layoutMode = "HORIZONTAL";
            chevronSlot.primaryAxisSizingMode = "FIXED";
            chevronSlot.counterAxisSizingMode = "FIXED";
            chevronSlot.primaryAxisAlignItems = "CENTER";
            chevronSlot.counterAxisAlignItems = "CENTER";
            chevronSlot.fills = [];
            chevronSlot.strokes = [];
            chevronSlot.resize(20, 20);
            input.appendChild(chevronSlot);

            if (chevronIconComp) {
              var chevronInstance = chevronIconComp.createInstance();
              chevronInstance.name = "Chevron";
              try {
                chevronInstance.resize(12, 12);
              } catch (e) {
                // Keep default icon size if resize is not allowed.
              }
              chevronSlot.appendChild(chevronInstance);
            } else {
              var chevronVector = figma.createVector();
              chevronVector.name = "Chevron";
              chevronVector.vectorPaths = [{ windingRule: "NONZERO", data: "M 1 1 L 6 6 L 11 1" }];
              chevronVector.resize(12, 6);
              chevronVector.fills = [];
              chevronVector.strokes = [{ type: "SOLID", color: { r: 0.45, g: 0.45, b: 0.45 } }];
              chevronVector.strokeWeight = 1.5;
              chevronVector.strokeJoin = "ROUND";
              chevronVector.strokeCap = "ROUND";
              if (varMap["select/chevron-color"]) bindPaintVar(chevronVector, "strokes", 0, varMap["select/chevron-color"]);
              chevronSlot.appendChild(chevronVector);
            }

            if (state === "focus") {
              input.effects = [{
                type: "DROP_SHADOW",
                color: { r: 0.2, g: 0.53, b: 0.87, a: 0.25 },
                offset: { x: 0, y: 0 },
                radius: 0,
                spread: 3,
                visible: true,
                blendMode: "NORMAL"
              }];
            }

            comp.appendChild(input);

            if (state === "error") {
              var errorNode = figma.createText();
              errorNode.name = "Error";
              errorNode.fontName = font;
              errorNode.characters = "Error message";
              errorNode.fontSize = 12;
              errorNode.fills = [{ type: "SOLID", color: { r: 0.97, g: 0.33, b: 0.29 } }];
              if (varMap["select/error-color"]) bindPaintVar(errorNode, "fills", 0, varMap["select/error-color"]);
              if (varMap["select/error-font-size"]) bindVar(errorNode, "fontSize", varMap["select/error-font-size"]);
              comp.appendChild(errorNode);
            }

            if (state === "disabled") comp.opacity = 0.6;

            var colIndex = vi * labelModes.length + li;
            var rowIndex = (si * radii.length + ri) * states.length + sti;
            comp.x = colIndex * (colWidth + gap);
            comp.y = rowIndex * 80;
            page.appendChild(comp);
            components.push(comp);
          }
        }
      }
    }
  }

  progress("Created " + components.length + " select variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Select";
  return componentSet;
}

function selectColorPath(variant, property, state) {
  if (state === "default") return "select/" + variant + "-" + property;
  return "select/" + variant + "-" + property + "-" + state;
}

async function findSelectChevronIconComponent() {
  var iconCandidates = [];
  var iconsPage = null;

  for (var pi = 0; pi < figma.root.children.length; pi++) {
    var page = figma.root.children[pi];
    if (page.type !== "PAGE") continue;
    await page.loadAsync();
    if (!iconsPage && page.name && page.name.toLowerCase() === "icons") {
      iconsPage = page;
    }
  }

  var searchScope = iconsPage || figma.root;
  var nodes = searchScope.findAll(function(n) {
    return n.type === "COMPONENT" || n.type === "COMPONENT_SET";
  });

  // Expand component sets so we can instance-swap from their child components.
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].type === "COMPONENT") {
      iconCandidates.push(nodes[i]);
    } else if (nodes[i].type === "COMPONENT_SET") {
      var setChildren = nodes[i].children || [];
      for (var ci = 0; ci < setChildren.length; ci++) {
        if (setChildren[ci].type === "COMPONENT") {
          iconCandidates.push(setChildren[ci]);
        }
      }
    }
  }

  var preferred = null;
  for (var j = 0; j < iconCandidates.length; j++) {
    var name = iconCandidates[j].name.toLowerCase();
    if (
      name.indexOf("chevron-down") >= 0 ||
      (name.indexOf("chevron") >= 0 && name.indexOf("down") >= 0) ||
      name.indexOf("caret-down") >= 0 ||
      (name.indexOf("caret") >= 0 && name.indexOf("down") >= 0) ||
      name.indexOf("angle-down") >= 0 ||
      name.indexOf("arrow-down") >= 0
    ) {
      preferred = iconCandidates[j];
      break;
    }
  }
  if (preferred) return preferred;

  // Fallback: check/minus icons are known to exist in repos where
  // Checkbox instancing works, so prefer those before generic matches.
  for (var m = 0; m < iconCandidates.length; m++) {
    var knownName = iconCandidates[m].name.toLowerCase();
    if (
      knownName.indexOf("check") >= 0 ||
      knownName.indexOf("minus") >= 0
    ) {
      return iconCandidates[m];
    }
  }

  // Fallback: any chevron/caret/arrow-style icon.
  for (var k = 0; k < iconCandidates.length; k++) {
    var fallbackName = iconCandidates[k].name.toLowerCase();
    if (
      fallbackName.indexOf("chevron") >= 0 ||
      fallbackName.indexOf("caret") >= 0 ||
      fallbackName.indexOf("arrow") >= 0
    ) {
      return iconCandidates[k];
    }
  }

  // Last-resort fallback to first available icon component.
  if (iconCandidates.length > 0) {
    var sorted = iconCandidates.slice().sort(function(a, b) {
      return a.name.localeCompare(b.name);
    });
    return sorted[0];
  }

  return null;
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function buildCardComponentSet(varMap, page, font) {
  var sizes = ["xs", "sm", "md", "lg", "xl"];
  var radii = ["xs", "sm", "md", "lg", "xl"];
  var borderModes = ["on", "off"];
  var shadowModes = ["off", "on"];
  var components = [];

  var rowGap = 24;
  var colGap = 28;
  var colWidth = 360 + colGap;
  var rowHeight = 280 + rowGap;

  for (var si = 0; si < sizes.length; si++) {
    var size = sizes[si];
    var capSize = size.toUpperCase();
    for (var ri = 0; ri < radii.length; ri++) {
      var radius = radii[ri];
      var capRadius = radius.toUpperCase();
      for (var bi = 0; bi < borderModes.length; bi++) {
        var withBorder = borderModes[bi] === "on";
        for (var shi = 0; shi < shadowModes.length; shi++) {
          var withShadow = shadowModes[shi] === "on";
          var comp = figma.createComponent();
          comp.name =
            "Size=" + capSize +
            ", Radius=" + capRadius +
            ", Border=" + (withBorder ? "On" : "Off") +
            ", Shadow=" + (withShadow ? "On" : "Off") +
            ", Section=On, Badge=On";

          comp.layoutMode = "VERTICAL";
          comp.primaryAxisSizingMode = "AUTO";
          comp.counterAxisSizingMode = "FIXED";
          comp.counterAxisAlignItems = "MIN";
          comp.itemSpacing = 0;
          comp.resize(320, 180);
          comp.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
          comp.clipsContent = true;
          if (varMap["card/background"]) bindPaintVar(comp, "fills", 0, varMap["card/background"]);
          if (varMap["card/radius-" + radius]) {
            bindVar(comp, "topLeftRadius", varMap["card/radius-" + radius]);
            bindVar(comp, "topRightRadius", varMap["card/radius-" + radius]);
            bindVar(comp, "bottomLeftRadius", varMap["card/radius-" + radius]);
            bindVar(comp, "bottomRightRadius", varMap["card/radius-" + radius]);
          }
          if (varMap["card/padding-" + size]) {
            bindVar(comp, "paddingLeft", varMap["card/padding-" + size]);
            bindVar(comp, "paddingRight", varMap["card/padding-" + size]);
            bindVar(comp, "paddingTop", varMap["card/padding-" + size]);
            bindVar(comp, "paddingBottom", varMap["card/padding-" + size]);
          } else {
            comp.paddingLeft = 16;
            comp.paddingRight = 16;
            comp.paddingTop = 16;
            comp.paddingBottom = 16;
          }

          comp.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
          if (varMap["card/border"]) bindPaintVar(comp, "strokes", 0, varMap["card/border"]);
          if (withBorder) {
            comp.strokeWeight = 1;
            if (varMap["card/border-width"]) bindVar(comp, "strokeWeight", varMap["card/border-width"]);
          } else {
            comp.strokeWeight = 0;
          }

          if (withShadow) {
            comp.effects = [{
              type: "DROP_SHADOW",
              color: { r: 0, g: 0, b: 0, a: 0.18 },
              offset: { x: 0, y: 6 },
              radius: 20,
              spread: 0,
              visible: true,
              blendMode: "NORMAL"
            }];
          }

          var section = figma.createFrame();
          section.name = "Section";
          section.layoutMode = "NONE";
          section.primaryAxisSizingMode = "FIXED";
          section.counterAxisSizingMode = "FIXED";
          section.layoutAlign = "STRETCH";
          section.resize(320, 110);
          section.fills = [{ type: "SOLID", color: { r: 0.93, g: 0.95, b: 0.98 } }];
          if (varMap["card/section-background"]) bindPaintVar(section, "fills", 0, varMap["card/section-background"]);
          if (varMap["card/section-height"]) bindVar(section, "minHeight", varMap["card/section-height"]);
          comp.appendChild(section);

          var body = figma.createFrame();
          body.name = "Body";
          body.layoutMode = "VERTICAL";
          body.primaryAxisSizingMode = "AUTO";
          body.counterAxisSizingMode = "AUTO";
          body.counterAxisAlignItems = "MIN";
          body.itemSpacing = 8;
          body.layoutAlign = "STRETCH";
          body.fills = [];
          if (varMap["card/gap-" + size]) bindVar(body, "itemSpacing", varMap["card/gap-" + size]);
          comp.appendChild(body);

          var topRow = figma.createFrame();
          topRow.name = "TopRow";
          topRow.layoutMode = "HORIZONTAL";
          topRow.primaryAxisSizingMode = "AUTO";
          topRow.counterAxisSizingMode = "AUTO";
          topRow.primaryAxisAlignItems = "SPACE_BETWEEN";
          topRow.counterAxisAlignItems = "CENTER";
          topRow.layoutAlign = "STRETCH";
          topRow.fills = [];
          body.appendChild(topRow);

          var titleNode = figma.createText();
          titleNode.name = "Title";
          titleNode.fontName = font;
          titleNode.characters = "PlanetScope vessel";
          titleNode.fontSize = 14;
          titleNode.fills = [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1 } }];
          if (varMap["card/title"]) bindPaintVar(titleNode, "fills", 0, varMap["card/title"]);
          if (varMap["card/title-font-size-" + size]) bindVar(titleNode, "fontSize", varMap["card/title-font-size-" + size]);
          topRow.appendChild(titleNode);

          var badge = figma.createFrame();
          badge.name = "Badge";
          badge.layoutMode = "HORIZONTAL";
          badge.primaryAxisSizingMode = "AUTO";
          badge.counterAxisSizingMode = "AUTO";
          badge.paddingLeft = 8;
          badge.paddingRight = 8;
          badge.paddingTop = 4;
          badge.paddingBottom = 4;
          badge.cornerRadius = 999;
          badge.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
          if (varMap["card/badge-background"]) bindPaintVar(badge, "fills", 0, varMap["card/badge-background"]);

          var badgeText = figma.createText();
          badgeText.name = "BadgeText";
          badgeText.fontName = font;
          badgeText.characters = "New";
          badgeText.fontSize = 12;
          badgeText.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
          if (varMap["card/badge-color"]) bindPaintVar(badgeText, "fills", 0, varMap["card/badge-color"]);
          badge.appendChild(badgeText);
          topRow.appendChild(badge);

          var descriptionNode = figma.createText();
          descriptionNode.name = "Description";
          descriptionNode.fontName = font;
          descriptionNode.characters = "Detected vessel metadata and imagery details from latest satellite capture.";
          descriptionNode.fontSize = 12;
          descriptionNode.fills = [{ type: "SOLID", color: { r: 0.4, g: 0.4, b: 0.4 } }];
          descriptionNode.textAutoResize = "HEIGHT";
          descriptionNode.resize(288, descriptionNode.height);
          if (varMap["card/description"]) bindPaintVar(descriptionNode, "fills", 0, varMap["card/description"]);
          if (varMap["card/description-font-size-" + size]) bindVar(descriptionNode, "fontSize", varMap["card/description-font-size-" + size]);
          body.appendChild(descriptionNode);

          var colIndex = ri * borderModes.length * shadowModes.length + bi * shadowModes.length + shi;
          var rowIndex = si;
          comp.x = colIndex * colWidth;
          comp.y = rowIndex * rowHeight;
          page.appendChild(comp);
          components.push(comp);
        }
      }
    }
  }

  progress("Created " + components.length + " card variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Card";
  return componentSet;
}

// ---------------------------------------------------------------------------
// ActionIcon
// ---------------------------------------------------------------------------

async function buildActionIconComponentSet(varMap, page) {
  var variants = ["default", "filled", "light", "outlined", "transparent"];
  var sizes = ["xs", "sm", "md", "lg", "xl"];
  var radii = ["xs", "sm", "md", "lg", "xl"];
  var states = ["default", "hover", "focus", "pressed", "disabled"];
  var icons = ["check", "minus"];
  var components = [];

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
  if (checkIconComp) console.log("[ActionIcon] Found check icon: " + checkIconComp.name);
  else console.log("[ActionIcon] WARNING: check icon not found on icons page");
  if (minusIconComp) console.log("[ActionIcon] Found minus icon: " + minusIconComp.name);
  else console.log("[ActionIcon] WARNING: minus icon not found on icons page");

  var sizePx = { xs: 28, sm: 32, md: 36, lg: 42, xl: 48 };
  var gap = 18;
  var colGap = 24;

  var rowYOffsets = [];
  var runningY = 0;
  for (var rsi = 0; rsi < sizes.length; rsi++) {
    for (var rri = 0; rri < radii.length; rri++) {
      for (var rsti = 0; rsti < states.length; rsti++) {
        rowYOffsets.push(runningY);
        runningY += sizePx[sizes[rsi]] + gap;
      }
    }
  }

  var colWidth = 90 + colGap;

  for (var vi = 0; vi < variants.length; vi++) {
    var variant = variants[vi];
    var capVariant = variant.charAt(0).toUpperCase() + variant.slice(1);

    for (var ii = 0; ii < icons.length; ii++) {
      var iconName = icons[ii];
      var capIcon = iconName.charAt(0).toUpperCase() + iconName.slice(1);

      for (var si = 0; si < sizes.length; si++) {
        var size = sizes[si];
        var capSize = size.toUpperCase();

        for (var ri = 0; ri < radii.length; ri++) {
          var rad = radii[ri];
          var capRadius = rad.toUpperCase();

          for (var sti = 0; sti < states.length; sti++) {
            var state = states[sti];
            var capState = state.charAt(0).toUpperCase() + state.slice(1);

            var comp = figma.createComponent();
            comp.name = "Variant=" + capVariant + ", Size=" + capSize +
                        ", Radius=" + capRadius + ", State=" + capState +
                        ", Icon=" + capIcon;

            comp.layoutMode = "HORIZONTAL";
            comp.primaryAxisSizingMode = "FIXED";
            comp.counterAxisSizingMode = "FIXED";
            comp.primaryAxisAlignItems = "CENTER";
            comp.counterAxisAlignItems = "CENTER";
            comp.resize(sizePx[size], sizePx[size]);
            comp.cornerRadius = 8;
            comp.clipsContent = true;

            var bgPath = actionIconColorPath(variant, "background", state);
            var iconPath = actionIconColorPath(variant, "icon", state);
            var borderPath = actionIconColorPath(variant, "border", state);

            comp.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
            bindPaintVar(comp, "fills", 0, varMap[bgPath]);

            comp.strokes = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 0 }];
            comp.strokeAlign = "INSIDE";
            bindPaintVar(comp, "strokes", 0, varMap[borderPath]);

            bindVar(comp, "width", varMap["actionicon/size-" + size]);
            bindVar(comp, "height", varMap["actionicon/size-" + size]);
            bindVar(comp, "topLeftRadius", varMap["actionicon/radius-" + rad]);
            bindVar(comp, "topRightRadius", varMap["actionicon/radius-" + rad]);
            bindVar(comp, "bottomLeftRadius", varMap["actionicon/radius-" + rad]);
            bindVar(comp, "bottomRightRadius", varMap["actionicon/radius-" + rad]);
            bindVar(comp, "strokeWeight", varMap["actionicon/border-width"]);

            var iconInst = null;
            if (iconName === "check" && checkIconComp) {
              iconInst = checkIconComp.createInstance();
            } else if (iconName === "minus" && minusIconComp) {
              iconInst = minusIconComp.createInstance();
            }

            if (iconInst) {
              iconInst.name = "Icon";
              iconInst.resize(16, 16);
              bindVar(iconInst, "width", varMap["actionicon/icon-size-" + size]);
              bindVar(iconInst, "height", varMap["actionicon/icon-size-" + size]);

              var vectors = iconInst.findAll(function(n) { return n.type === "VECTOR"; });
              for (var vci = 0; vci < vectors.length; vci++) {
                if (vectors[vci].strokes && vectors[vci].strokes.length > 0) {
                  vectors[vci].strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
                  bindPaintVar(vectors[vci], "strokes", 0, varMap[iconPath]);
                }
                if (vectors[vci].fills && vectors[vci].fills.length > 0) {
                  vectors[vci].fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
                  bindPaintVar(vectors[vci], "fills", 0, varMap[iconPath]);
                }
              }
              comp.appendChild(iconInst);
            }

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

            if (state === "disabled") {
              comp.opacity = 0.6;
            }

            var colIndex = vi * icons.length + ii;
            var rowIndex = (si * radii.length + ri) * states.length + sti;
            comp.x = colIndex * colWidth;
            comp.y = rowYOffsets[rowIndex];
            page.appendChild(comp);
            components.push(comp);
          }
        }
      }
    }
  }

  progress("Created " + components.length + " action icon variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "ActionIcon";
  return componentSet;
}

function actionIconColorPath(variant, property, state) {
  var base = "actionicon/" + variant + "-" + property;
  if (state === "default") return base;
  return base + "-" + state;
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

async function buildTabsComponentSet(varMap, page, font) {
  validateTabsVariables(varMap);

  var variants = ["default", "outlined", "pills"];
  var orientations = ["horizontal", "vertical"];
  var leftIconModes = ["off", "on"];
  var radii = ["xs", "sm", "md", "lg", "xl"];
  var states = ["default", "hover", "focus", "pressed", "disabled"];
  var components = [];

  var colWidth = 340;
  var rowHeight = 120;
  var gap = 24;

  var iconComponents = await findTabsIconComponents();
  if (!iconComponents.image) progress("[Tabs] Warning: Image icon component not found on icons page");
  if (!iconComponents.message) progress("[Tabs] Warning: Message icon component not found on icons page");
  if (!iconComponents.settings) progress("[Tabs] Warning: Settings icon component not found on icons page");

  for (var vi = 0; vi < variants.length; vi++) {
    var variant = variants[vi];
    var capVariant = variant.charAt(0).toUpperCase() + variant.slice(1);

    for (var oi = 0; oi < orientations.length; oi++) {
      var orientation = orientations[oi];
      var capOrientation = orientation.charAt(0).toUpperCase() + orientation.slice(1);

      for (var li = 0; li < leftIconModes.length; li++) {
        var leftIconMode = leftIconModes[li];
        var showLeftIcon = leftIconMode === "on";
        var capLeftIcon = showLeftIcon ? "On" : "Off";

        for (var ri = 0; ri < radii.length; ri++) {
          var rad = radii[ri];
          var capRadius = rad.toUpperCase();

          for (var si = 0; si < states.length; si++) {
            var state = states[si];
            var capState = state.charAt(0).toUpperCase() + state.slice(1);

            var comp = figma.createComponent();
            comp.name = "Variant=" + capVariant + ", Orientation=" + capOrientation +
                        ", LeftIcon=" + capLeftIcon + ", Radius=" + capRadius + ", State=" + capState;
            comp.layoutMode = "VERTICAL";
            comp.primaryAxisSizingMode = "AUTO";
            comp.counterAxisSizingMode = "AUTO";
            comp.itemSpacing = 0;
            comp.fills = [];

            var list = figma.createFrame();
            list.name = "List";
            list.layoutMode = orientation === "horizontal" ? "HORIZONTAL" : "VERTICAL";
            list.primaryAxisSizingMode = "AUTO";
            list.counterAxisSizingMode = "AUTO";
            list.primaryAxisAlignItems = "MIN";
            list.counterAxisAlignItems = "MIN";
            list.itemSpacing = 8;
            list.paddingLeft = 4;
            list.paddingRight = 4;
            list.paddingTop = 4;
            list.paddingBottom = 4;
            list.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
            list.strokes = [{ type: "SOLID", color: { r: 0.78, g: 0.78, b: 0.78 } }];
            list.strokeAlign = "INSIDE";

            bindPaintVar(list, "fills", 0, varMap["tabs/" + variant + "-list-background"]);
            bindPaintVar(list, "strokes", 0, varMap["tabs/" + variant + "-list-border"]);
            bindVar(list, "strokeWeight", varMap["tabs/list-border-width"]);
            bindVar(list, "itemSpacing", varMap["tabs/list-gap"]);
            bindVar(list, "topLeftRadius", varMap["tabs/radius-" + rad]);
            bindVar(list, "topRightRadius", varMap["tabs/radius-" + rad]);
            bindVar(list, "bottomLeftRadius", varMap["tabs/radius-" + rad]);
            bindVar(list, "bottomRightRadius", varMap["tabs/radius-" + rad]);

            var tabDefs = [
              { label: "Overview", active: true, disabled: false, icon: "image" },
              { label: "Details", active: false, disabled: false, icon: "message" },
              { label: "Settings", active: false, disabled: true, icon: "settings" },
            ];

            for (var ti = 0; ti < tabDefs.length; ti++) {
              var tabDef = tabDefs[ti];
              var tab = figma.createFrame();
              tab.name = "Tab/" + tabDef.label;
              tab.layoutMode = "HORIZONTAL";
              tab.primaryAxisSizingMode = "AUTO";
              tab.counterAxisSizingMode = "AUTO";
              tab.primaryAxisAlignItems = "CENTER";
              tab.counterAxisAlignItems = "CENTER";
              tab.paddingLeft = 12;
              tab.paddingRight = 12;
              tab.paddingTop = 8;
              tab.paddingBottom = 8;
              tab.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
              tab.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
              tab.strokeAlign = "INSIDE";

              bindVar(tab, "paddingLeft", varMap["tabs/tab-padding-x"]);
              bindVar(tab, "paddingRight", varMap["tabs/tab-padding-x"]);
              bindVar(tab, "paddingTop", varMap["tabs/tab-padding-y"]);
              bindVar(tab, "paddingBottom", varMap["tabs/tab-padding-y"]);
              bindVar(tab, "strokeWeight", varMap["tabs/tab-border-width"]);
              bindVar(tab, "topLeftRadius", varMap["tabs/radius-" + rad]);
              bindVar(tab, "topRightRadius", varMap["tabs/radius-" + rad]);
              bindVar(tab, "bottomLeftRadius", varMap["tabs/radius-" + rad]);
              bindVar(tab, "bottomRightRadius", varMap["tabs/radius-" + rad]);

              var visualState = "default";
              if (state === "disabled" || tabDef.disabled) visualState = "disabled";
              else if (tabDef.active) visualState = "active";
              else if (state === "hover") visualState = "hover";
              else if (state === "pressed") visualState = "pressed";

              var tabBgPath = tabsTabColorPath(variant, "background", visualState);
              var tabTextPath = tabsTabColorPath(variant, "text", visualState);
              var tabBorderPath = tabsTabColorPath(variant, "border", visualState);

              bindPaintVar(tab, "fills", 0, varMap[tabBgPath]);
              bindPaintVar(tab, "strokes", 0, varMap[tabBorderPath]);

              if (showLeftIcon) {
                var iconComp = iconComponents[tabDef.icon] || null;
                if (iconComp) {
                  var iconInst = iconComp.createInstance();
                  iconInst.name = "LeftIcon";
                  iconInst.resize(16, 16);
                  bindVar(iconInst, "width", varMap["tabs/icon-size"]);
                  bindVar(iconInst, "height", varMap["tabs/icon-size"]);

                  var vectors = iconInst.findAll(function(n) { return n.type === "VECTOR"; });
                  for (var vci = 0; vci < vectors.length; vci++) {
                    if (vectors[vci].strokes && vectors[vci].strokes.length > 0) {
                      vectors[vci].strokes = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
                      bindPaintVar(vectors[vci], "strokes", 0, varMap[tabTextPath]);
                    }
                    if (vectors[vci].fills && vectors[vci].fills.length > 0) {
                      vectors[vci].fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
                      bindPaintVar(vectors[vci], "fills", 0, varMap[tabTextPath]);
                    }
                  }
                  tab.appendChild(iconInst);
                }
                bindVar(tab, "itemSpacing", varMap["tabs/icon-gap"]);
              }

              var labelNode = figma.createText();
              labelNode.name = "Label";
              labelNode.fontName = font;
              labelNode.characters = tabDef.label;
              labelNode.fontSize = 14;
              labelNode.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
              bindVar(labelNode, "fontSize", varMap["tabs/font-size"]);
              bindPaintVar(labelNode, "fills", 0, varMap[tabTextPath]);

              tab.appendChild(labelNode);

              if (state === "focus" && ti === 1 && visualState !== "disabled") {
                tab.effects = [{
                  type: "DROP_SHADOW",
                  color: { r: 0.2, g: 0.53, b: 0.9, a: 0.4 },
                  offset: { x: 0, y: 0 },
                  radius: 0,
                  spread: 3,
                  visible: true,
                  blendMode: "NORMAL"
                }];
                bindPaintVar(tab, "strokes", 0, varMap["tabs/focus-ring"]);
              }

              list.appendChild(tab);
            }

            comp.appendChild(list);

            if (state === "disabled") {
              comp.opacity = 0.6;
            }

            var colIndex = (vi * orientations.length + oi) * leftIconModes.length + li;
            var rowIndex = ri * states.length + si;
            comp.x = colIndex * (colWidth + gap);
            comp.y = rowIndex * (rowHeight + gap);
            page.appendChild(comp);
            components.push(comp);
          }
        }
      }
    }
  }

  progress("Created " + components.length + " tabs variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Tabs";
  return componentSet;
}

function tabsTabColorPath(variant, property, state) {
  var base = "tabs/" + variant + "-tab-" + property;
  if (state === "default") return base;
  return base + "-" + state;
}

async function findTabsIconComponents() {
  var result = { image: null, message: null, settings: null };
  var iconCandidates = [];
  var iconsPage = null;

  for (var pi = 0; pi < figma.root.children.length; pi++) {
    var page = figma.root.children[pi];
    if (page.type !== "PAGE") continue;
    await page.loadAsync();
    if (!iconsPage && page.name && page.name.toLowerCase() === "icons") {
      iconsPage = page;
    }
  }

  var searchScope = iconsPage || figma.root;
  var nodes = searchScope.findAll(function(n) {
    return n.type === "COMPONENT" || n.type === "COMPONENT_SET";
  });

  // Expand COMPONENT_SET into its child COMPONENT nodes for instance swap support.
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].type === "COMPONENT") {
      iconCandidates.push(nodes[i]);
    } else if (nodes[i].type === "COMPONENT_SET") {
      var setChildren = nodes[i].children || [];
      for (var ci = 0; ci < setChildren.length; ci++) {
        if (setChildren[ci].type === "COMPONENT") {
          iconCandidates.push(setChildren[ci]);
        }
      }
    }
  }

  for (var j = 0; j < iconCandidates.length; j++) {
    var name = iconCandidates[j].name.toLowerCase();
    if (!result.image && (name.indexOf("image") >= 0 || name.indexOf("gallery") >= 0 || name.indexOf("photo") >= 0)) {
      result.image = iconCandidates[j];
    }
    if (!result.message && (name.indexOf("message") >= 0 || name.indexOf("chat") >= 0)) {
      result.message = iconCandidates[j];
    }
    if (!result.settings && (name.indexOf("settings") >= 0 || name.indexOf("cog") >= 0 || name.indexOf("gear") >= 0)) {
      result.settings = iconCandidates[j];
    }
  }

  // Fallback: if naming does not match expected keywords, use first 3 components so LeftIcon=On always renders.
  if ((!result.image || !result.message || !result.settings) && iconCandidates.length >= 3) {
    var sorted = iconCandidates.slice().sort(function(a, b) {
      return a.name.localeCompare(b.name);
    });
    if (!result.image) result.image = sorted[0];
    if (!result.message) result.message = sorted[1];
    if (!result.settings) result.settings = sorted[2];
  }

  if (result.image) progress("[Tabs] LeftIcon image source: " + result.image.name);
  if (result.message) progress("[Tabs] LeftIcon message source: " + result.message.name);
  if (result.settings) progress("[Tabs] LeftIcon settings source: " + result.settings.name);

  return result;
}

function validateTabsVariables(varMap) {
  var variants = ["default", "outlined", "pills"];
  var radii = ["xs", "sm", "md", "lg", "xl"];
  var states = ["default", "hover", "active", "pressed", "disabled"];
  var required = [
    "tabs/font-size",
    "tabs/tab-padding-x",
    "tabs/tab-padding-y",
    "tabs/list-gap",
    "tabs/list-border-width",
    "tabs/tab-border-width",
    "tabs/icon-size",
    "tabs/icon-gap",
    "tabs/focus-ring"
  ];

  for (var ri = 0; ri < radii.length; ri++) {
    required.push("tabs/radius-" + radii[ri]);
  }

  for (var vi = 0; vi < variants.length; vi++) {
    var variant = variants[vi];
    required.push("tabs/" + variant + "-list-background");
    required.push("tabs/" + variant + "-list-border");
    for (var si = 0; si < states.length; si++) {
      var state = states[si];
      var suffix = state === "default" ? "" : "-" + state;
      required.push("tabs/" + variant + "-tab-background" + suffix);
      required.push("tabs/" + variant + "-tab-text" + suffix);
      required.push("tabs/" + variant + "-tab-border" + suffix);
    }
  }

  var missing = [];
  for (var i = 0; i < required.length; i++) {
    if (!varMap[required[i]]) missing.push(required[i]);
  }
  if (missing.length > 0) {
    throw new Error("Tabs sync missing required variables: " + missing.slice(0, 12).join(", ") + (missing.length > 12 ? " ..." : ""));
  }
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
