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

function linearGradientTransformFromCssAngleDeg(angleDeg) {
  var angleInRadians = (angleDeg * Math.PI) / 180;
  var transformedAngle = angleInRadians - Math.PI / 2;
  var sin = Math.sin(transformedAngle);
  var cos = Math.cos(transformedAngle);
  var primary = cos;
  var secondary = sin;
  return [
    [primary, secondary, 0.5 - primary * 0.5 - secondary * 0.5],
    [-secondary, primary, 0.5 + secondary * 0.5 - primary * 0.5],
  ];
}

function figmaGradientPaintFromSpec(spec) {
  if (!spec || !spec.stops || spec.stops.length < 2) return null;
  var stops = [];
  for (var gi = 0; gi < spec.stops.length; gi++) {
    var s = spec.stops[gi];
    stops.push({
      position: s.position,
      color: { r: s.r, g: s.g, b: s.b, a: s.a != null ? s.a : 1 },
    });
  }
  if (spec.kind === "radial") {
    return {
      type: "GRADIENT_RADIAL",
      gradientStops: stops,
      gradientTransform: [
        [1, 0, 0.5],
        [0, 1, 0.5],
      ],
      opacity: 1,
    };
  }
  var angle = spec.angleDeg != null ? Number(spec.angleDeg) : 90;
  if (!isFinite(angle)) angle = 90;
  return {
    type: "GRADIENT_LINEAR",
    gradientStops: stops,
    gradientTransform: linearGradientTransformFromCssAngleDeg(angle),
    opacity: 1,
  };
}

function dsgGradientPaintStyleName(brandId, gradientId) {
  var cap = brandId.charAt(0).toUpperCase() + brandId.slice(1);
  var safeId = String(gradientId).replace(/\//g, "-");
  return "Gradient / " + cap + " / " + safeId;
}

/**
 * Create/update local paint styles from payload[brand].gradientExports (multi-stop).
 * Marks styles with pluginData dsgGradient = "brandId|gradientId" for idempotent sync and stale removal.
 */
function syncGradientPaintStyles(payload, syncBrands) {
  var desiredKeys = {};
  var created = 0;
  var updated = 0;
  var touchedNames = [];
  for (var bi = 0; bi < syncBrands.length; bi++) {
    var bid = syncBrands[bi];
    var pack = payload[bid];
    if (!pack || !pack.gradientExports) continue;
    var gx = pack.gradientExports;
    var gkeys = Object.keys(gx);
    for (var gki = 0; gki < gkeys.length; gki++) {
      var gid = gkeys[gki];
      var spec = gx[gid];
      var paint = figmaGradientPaintFromSpec(spec);
      if (!paint) continue;
      var key = bid + "|" + gid;
      desiredKeys[key] = true;
      var styleName = dsgGradientPaintStyleName(bid, gid);
      var existing = null;
      var allStyles = figma.getLocalPaintStyles();
      for (var si = 0; si < allStyles.length; si++) {
        try {
          if (allStyles[si].getPluginData("dsgGradient") === key) {
            existing = allStyles[si];
            break;
          }
        } catch (_pluginDataRead) {}
      }
      if (existing) {
        existing.name = styleName;
        existing.paints = [paint];
        updated++;
        touchedNames.push(styleName);
      } else {
        var st = figma.createPaintStyle();
        st.name = styleName;
        st.paints = [paint];
        try {
          st.setPluginData("dsgGradient", key);
        } catch (_pd) {}
        created++;
        touchedNames.push(styleName);
      }
    }
  }
  var removed = 0;
  var allPaint = figma.getLocalPaintStyles();
  for (var ri = allPaint.length - 1; ri >= 0; ri--) {
    try {
      var marker = allPaint[ri].getPluginData("dsgGradient");
      if (!marker || marker.indexOf("|") < 0) continue;
      if (!desiredKeys[marker]) {
        allPaint[ri].remove();
        removed++;
      }
    } catch (_remErr) {}
  }
  if (touchedNames.length === 0) {
    progress(
      "Gradient paint styles: none synced. Payload needs gradientExports (named gradient with 2+ stops per brand). Rebuild the app and sync again."
    );
  } else {
    progress(
      "Gradient paint styles: " +
        created +
        " created, " +
        updated +
        " updated, " +
        removed +
        " removed — " +
        touchedNames.join(" · ") +
        " (variable fills stay solid; detach Fill variable then apply these as styles if needed)"
    );
  }
}

async function syncTokens(payload) {
  var buildOptions = payload.__buildOptions || {};
  var preserveExistingVariables = Boolean(buildOptions && buildOptions.preserveExistingVariables);

  // Extract globalPrimitives and brand IDs from payload
  var globalPrimitives = payload.globalPrimitives || {};
  var globalSpacing = payload.globalSpacing || [];
  var globalRadii = payload.globalRadii || [];
  var allKeys = Object.keys(payload);
  var brandIds = [];
  for (var ki = 0; ki < allKeys.length; ki++) {
    if (
      allKeys[ki] !== "globalPrimitives" && 
      allKeys[ki] !== "globalSpacing" && 
      allKeys[ki] !== "globalRadii" && 
      allKeys[ki] !== "globalFonts" && 
      allKeys[ki] !== "globalWeights" && 
      allKeys[ki] !== "globalBorderWidths" && 
      allKeys[ki] !== "globalFontSizes" &&
      allKeys[ki] !== "globalLineHeights" &&
      allKeys[ki] !== "__buildOptions"
    ) {
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
        name: meCapBrand + capTheme,
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
    }
  }

  // ── Clean up accidental collections ──
  var accidentalCollections = ["Primitive/GlobalFonts", "Primitive/GlobalWeights", "Primitive/GlobalBorderWidths"];
  for (var oci = 0; oci < collections.length; oci++) {
    if (accidentalCollections.indexOf(collections[oci].name) !== -1) {
      progress("Removing accidental collection: " + collections[oci].name);
      var oldCol = collections[oci];
      for (var ovi = 0; ovi < allVars.length; ovi++) {
        if (allVars[ovi].variableCollectionId === oldCol.id) {
          allVars[ovi].remove();
        }
      }
      oldCol.remove();
    }
  }

  var firstBrand = payload[syncBrands[0]];
  var totalCreated = 0;
  var totalAliases = 0;

  // ══════════════════════════════════════════════════════════════
  // PHASE 1a: Primitive/Global — single mode, raw COLOR + FLOAT values
  // ══════════════════════════════════════════════════════════════
  progress("Phase 1a: Syncing Primitive/Global...");
  var globalModeId = globalPrimCol.modes[0].modeId;
  var globalPaletteNames = Object.keys(globalPrimitives);
  for (var gpi = 0; gpi < globalPaletteNames.length; gpi++) {
    var gPalette = globalPaletteNames[gpi];
    var gPaletteArr = globalPrimitives[gPalette];
    for (var gIdx = 0; gIdx < gPaletteArr.length; gIdx++) {
      var gVarName = gPalette === "transparent" ? "transparent" : (gPalette + "/" + gIdx);
      var gVar = globalPrimVarMap[gVarName];
      if (!gVar) {
        try {
          gVar = figma.variables.createVariable(gVarName, globalPrimCol, "COLOR");
        } catch (e) {
          throw new Error("Failed to create global color var: '" + gVarName + "' - " + String(e));
        }
        globalPrimVarMap[gVarName] = gVar;
        totalCreated++;
      }
      gVar.setValueForMode(globalModeId, hexToFigmaRgb(gPaletteArr[gIdx]));
    }
  }

  // Global spacing scale (FLOAT)
  for (var gsi = 0; gsi < globalSpacing.length; gsi++) {
    var spacingValue = Number(globalSpacing[gsi]);
    if (!isFinite(spacingValue)) continue;
    var spacingVarName = "spacing/" + spacingValue;
    var spacingVar = globalPrimVarMap[spacingVarName];
    if (!spacingVar) {
      try {
        spacingVar = figma.variables.createVariable(spacingVarName, globalPrimCol, "FLOAT");
      } catch (e) {
        throw new Error("Failed to create spacing var: '" + spacingVarName + "' - " + String(e));
      }
      globalPrimVarMap[spacingVarName] = spacingVar;
      totalCreated++;
    }
    spacingVar.setValueForMode(globalModeId, spacingValue);
  }

  // Global radius scale (FLOAT)
  for (var gri = 0; gri < globalRadii.length; gri++) {
    var radiusEntry = globalRadii[gri];
    if (!radiusEntry || typeof radiusEntry !== "object") continue;
    var radiusName = String(radiusEntry.name || "");
    var radiusValue = Number(radiusEntry.value);
    if (!radiusName || !isFinite(radiusValue)) continue;
    var radiusVarName = "radius/" + radiusName;
    var radiusVar = globalPrimVarMap[radiusVarName];
    if (!radiusVar) {
      try {
        radiusVar = figma.variables.createVariable(radiusVarName, globalPrimCol, "FLOAT");
      } catch (e) {
        throw new Error("Failed to create radius var: '" + radiusVarName + "' - " + String(e));
      }
      globalPrimVarMap[radiusVarName] = radiusVar;
      totalCreated++;
    }
    radiusVar.setValueForMode(globalModeId, radiusValue);
  }

  // Global fonts (STRING)
  var globalFonts = payload.globalFonts || {};
  var fontKeys = Object.keys(globalFonts);
  for (var fi = 0; fi < fontKeys.length; fi++) {
    var fontKey = fontKeys[fi];
    var fontVal = globalFonts[fontKey];
    var fontVarName = "typography/font-family/" + fontKey;
    var fontVar = globalPrimVarMap[fontVarName];
    if (!fontVar) {
      try {
        fontVar = figma.variables.createVariable(fontVarName, globalPrimCol, "STRING");
      } catch (e) {
        throw new Error("Failed to create font var: '" + fontVarName + "' - " + String(e));
      }
      globalPrimVarMap[fontVarName] = fontVar;
      totalCreated++;
    }
    fontVar.setValueForMode(globalModeId, fontVal);
  }

  // Global weights (STRING)
  var globalWeights = payload.globalWeights || {};
  var weightKeys = Object.keys(globalWeights);
  for (var wi = 0; wi < weightKeys.length; wi++) {
    var weightKey = weightKeys[wi];
    var weightVal = globalWeights[weightKey];
    var weightVarName = "typography/font-weight/" + weightKey;
    var weightVar = globalPrimVarMap[weightVarName];
    if (!weightVar) {
      try {
        weightVar = figma.variables.createVariable(weightVarName, globalPrimCol, "STRING");
      } catch (e) {
        throw new Error("Failed to create weight var: '" + weightVarName + "' - " + String(e));
      }
      globalPrimVarMap[weightVarName] = weightVar;
      totalCreated++;
    }
    weightVar.setValueForMode(globalModeId, weightVal);
  }

  // Global border widths (FLOAT)
  var globalBorderWidths = payload.globalBorderWidths || [];
  for (var bi = 0; bi < globalBorderWidths.length; bi++) {
    var bwVal = Number(globalBorderWidths[bi]);
    if (!isFinite(bwVal)) continue;
    var bwVarName = "border-width/" + String(bwVal).replace('.', '_');
    var bwVar = globalPrimVarMap[bwVarName];
    if (!bwVar) {
      try {
        bwVar = figma.variables.createVariable(bwVarName, globalPrimCol, "FLOAT");
      } catch (e) {
        throw new Error("Failed to create border width var: '" + bwVarName + "' - " + String(e));
      }
      globalPrimVarMap[bwVarName] = bwVar;
      totalCreated++;
    }
    bwVar.setValueForMode(globalModeId, bwVal);
  }

  // Global typography font sizes (FLOAT)
  var globalFontSizes = payload.globalFontSizes || [];
  for (var fsi = 0; fsi < globalFontSizes.length; fsi++) {
    var fsVal = Number(globalFontSizes[fsi]);
    if (!isFinite(fsVal)) continue;
    var fsVarName = "font-size-" + String(fsVal).replace('.', '_');
    var fsVar = globalPrimVarMap[fsVarName];
    if (!fsVar) {
      try {
        fsVar = figma.variables.createVariable(fsVarName, globalPrimCol, "FLOAT");
      } catch (e) {
        throw new Error("Failed to create font size var: '" + fsVarName + "' - " + String(e));
      }
      globalPrimVarMap[fsVarName] = fsVar;
      totalCreated++;
    }
    fsVar.setValueForMode(globalModeId, fsVal);
  }

  // Global typography line heights (FLOAT)
  var globalLineHeights = payload.globalLineHeights || [];
  for (var lhi = 0; lhi < globalLineHeights.length; lhi++) {
    var lhVal = Number(globalLineHeights[lhi]);
    if (!isFinite(lhVal)) continue;
    var lhVarName = "typography/line-height/" + String(lhVal).replace('.', '_');
    var lhVar = globalPrimVarMap[lhVarName];
    if (!lhVar) {
      try {
        lhVar = figma.variables.createVariable(lhVarName, globalPrimCol, "FLOAT");
      } catch (e) {
        throw new Error("Failed to create line height var: '" + lhVarName + "' - " + String(e));
      }
      globalPrimVarMap[lhVarName] = lhVar;
      totalCreated++;
    }
    lhVar.setValueForMode(globalModeId, lhVal);
  }

  if (!preserveExistingVariables) {
    // Remove stale global primitive variables (from previous syncs with different palettes)
    var globalExpected = {};
    for (var gei = 0; gei < globalPaletteNames.length; gei++) {
      var gePalette = globalPaletteNames[gei];
      for (var geIdx = 0; geIdx < globalPrimitives[gePalette].length; geIdx++) {
        var expectedName = gePalette === "transparent" ? "transparent" : (gePalette + "/" + geIdx);
        globalExpected[expectedName] = true;
      }
    }
    for (var gex = 0; gex < globalSpacing.length; gex++) {
      var expectedSpacing = Number(globalSpacing[gex]);
      if (isFinite(expectedSpacing)) globalExpected["spacing/" + expectedSpacing] = true;
    }
    for (var gre = 0; gre < globalRadii.length; gre++) {
      var expectedRadiusEntry = globalRadii[gre];
      if (!expectedRadiusEntry || typeof expectedRadiusEntry !== "object") continue;
      var expectedRadiusName = String(expectedRadiusEntry.name || "");
      if (expectedRadiusName) globalExpected["radius/" + expectedRadiusName] = true;
    }
    for (var fi = 0; fi < fontKeys.length; fi++) globalExpected["typography/font-family/" + fontKeys[fi]] = true;
    for (var wi = 0; wi < weightKeys.length; wi++) globalExpected["typography/font-weight/" + weightKeys[wi]] = true;
    for (var bi = 0; bi < globalBorderWidths.length; bi++) globalExpected["border-width/" + String(globalBorderWidths[bi]).replace('.', '_')] = true;
    for (var fsi = 0; fsi < globalFontSizes.length; fsi++) globalExpected["font-size-" + String(globalFontSizes[fsi]).replace('.', '_')] = true;
    for (var lhi = 0; lhi < globalLineHeights.length; lhi++) globalExpected["typography/line-height/" + String(globalLineHeights[lhi]).replace('.', '_')] = true;
    var globalStale = 0;
    var globalVarNames = Object.keys(globalPrimVarMap);
    for (var gsvi = 0; gsvi < globalVarNames.length; gsvi++) {
      if (!globalExpected[globalVarNames[gsvi]]) {
        globalPrimVarMap[globalVarNames[gsvi]].remove();
        delete globalPrimVarMap[globalVarNames[gsvi]];
        globalStale++;
      }
    }
    if (globalStale > 0) progress("  Removed " + globalStale + " stale Primitive/Global variables");
  }
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
          try {
            bpVar = figma.variables.createVariable(bpVarName, bpCol, "COLOR");
          } catch (e) {
            throw new Error("Failed to create brand prim var: '" + bpVarName + "' - " + String(e));
          }
          brandPrimVarMaps[bpId][bpVarName] = bpVar;
          totalCreated++;
        }
        bpVar.setValueForMode(bpModeId, hexToFigmaRgb(bpArr[bpIdx]));
      }
    }
    if (!preserveExistingVariables) {
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
    }
    progress("Primitive/" + bpName + ": " + Object.keys(brandPrimVarMaps[bpId]).length + " variables");
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE 2: Semantic — alias to Primitive variables (brand × theme modes)
  // ══════════════════════════════════════════════════════════════
  progress("Phase 2: Syncing Semantic tokens...");
  // Get semantic keys from union of all brand/theme semantic maps
  var semanticKeySet = {};
  for (var skb = 0; skb < syncBrands.length; skb++) {
    var skBrandId = syncBrands[skb];
    var skBrandPayload = payload[skBrandId];
    if (!skBrandPayload || !skBrandPayload.semantic) continue;
    var skLight = skBrandPayload.semantic.light || {};
    var skDark = skBrandPayload.semantic.dark || {};
    var skLightKeys = Object.keys(skLight);
    for (var slk = 0; slk < skLightKeys.length; slk++) {
      semanticKeySet[skLightKeys[slk]] = true;
    }
    var skDarkKeys = Object.keys(skDark);
    for (var sdk = 0; sdk < skDarkKeys.length; sdk++) {
      semanticKeySet[skDarkKeys[sdk]] = true;
    }
  }
  var semanticKeys = Object.keys(semanticKeySet);
  for (var si = 0; si < semanticKeys.length; si++) {
    var semKey = semanticKeys[si];
    var semVar = semanticVarMap[semKey];
      if (!semVar) {
        try {
          semVar = figma.variables.createVariable(semKey, semanticCol, "COLOR");
        } catch (e) {
          throw new Error("Failed to create semantic var: '" + semKey + "' - " + String(e));
        }
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

  function syncSemanticScalars(fieldName, fallbackType) {
    var keySet = {};
    for (var bi2 = 0; bi2 < syncBrands.length; bi2++) {
      var bId2 = syncBrands[bi2];
      var brandPayload = payload[bId2];
      if (!brandPayload || !brandPayload[fieldName]) continue;
      var light = brandPayload[fieldName].light || {};
      var dark = brandPayload[fieldName].dark || {};
      var lightKeys = Object.keys(light);
      for (var lk = 0; lk < lightKeys.length; lk++) keySet[lightKeys[lk]] = true;
      var darkKeys = Object.keys(dark);
      for (var dk = 0; dk < darkKeys.length; dk++) keySet[darkKeys[dk]] = true;
    }
    var keys = Object.keys(keySet);
    for (var ki3 = 0; ki3 < keys.length; ki3++) {
      var key = keys[ki3];
      var type = fallbackType;
      for (var tm = 0; tm < syncModes.length; tm++) {
        var tMode = syncModes[tm];
        var tokenMap = payload[tMode.brandId][fieldName] && payload[tMode.brandId][fieldName][tMode.theme];
        var token = tokenMap && tokenMap[key];
        if (token && token.type) {
          type = token.type;
          break;
        }
      }

      var semScalarVar = semanticVarMap[key];
      if (semScalarVar && semScalarVar.resolvedType !== type) {
        try { semScalarVar.remove(); } catch (_removeErr) {}
        semScalarVar = null;
        delete semanticVarMap[key];
      }
      if (!semScalarVar) {
        semScalarVar = figma.variables.createVariable(key, semanticCol, type);
        semanticVarMap[key] = semScalarVar;
        totalCreated++;
      }

      for (var sm = 0; sm < syncModes.length; sm++) {
        var mode2 = syncModes[sm];
        var modeTokenMap = payload[mode2.brandId][fieldName] && payload[mode2.brandId][fieldName][mode2.theme];
        if (!modeTokenMap) continue;
        var modeToken = modeTokenMap[key];
        if (!modeToken) continue;
        var modeId = semModes.modeMap[mode2.key];
        if (!modeId) continue;

        var aliasTarget = null;
        if (modeToken.alias) {
          aliasTarget = globalPrimVarMap[modeToken.alias] || (brandPrimVarMaps[mode2.brandId] && brandPrimVarMaps[mode2.brandId][modeToken.alias]) || null;
        }

        if (aliasTarget) {
          semScalarVar.setValueForMode(modeId, figma.variables.createVariableAlias(aliasTarget));
          totalAliases++;
        } else if (type === "FLOAT") {
          semScalarVar.setValueForMode(modeId, (modeToken.value != null) ? Number(modeToken.value) : 0);
        } else if (type === "STRING") {
          semScalarVar.setValueForMode(modeId, (modeToken.value != null) ? String(modeToken.value) : "");
        }
      }
    }
    return keys;
  }

  var semanticRadiusKeys = syncSemanticScalars("semanticRadius", "FLOAT");
  var semanticSpacingKeys = syncSemanticScalars("semanticSpacing", "FLOAT");
  var semanticTypographyKeys = syncSemanticScalars("semanticTypography", "STRING");
  // Remove stale semantic variables from previous syncs.
  // Also explicitly purge any legacy component/* semantic bridge tokens.
  if (!preserveExistingVariables) {
    var semanticExpected = {};
    for (var sei = 0; sei < semanticKeys.length; sei++) {
      semanticExpected[semanticKeys[sei]] = true;
    }
    for (var srei = 0; srei < semanticRadiusKeys.length; srei++) semanticExpected[semanticRadiusKeys[srei]] = true;
    for (var ssei = 0; ssei < semanticSpacingKeys.length; ssei++) semanticExpected[semanticSpacingKeys[ssei]] = true;
    for (var stei = 0; stei < semanticTypographyKeys.length; stei++) semanticExpected[semanticTypographyKeys[stei]] = true;
    var semanticStale = 0;
    var semanticVarNames = Object.keys(semanticVarMap);
    for (var ssi = 0; ssi < semanticVarNames.length; ssi++) {
      var existingSemName = semanticVarNames[ssi];
      var isLegacyComponentBridge = existingSemName.indexOf("component/") === 0;
      if (!semanticExpected[existingSemName] || isLegacyComponentBridge) {
        semanticVarMap[existingSemName].remove();
        delete semanticVarMap[existingSemName];
        semanticStale++;
      }
    }
    if (semanticStale > 0) progress("  Removed " + semanticStale + " stale Semantic variables");
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
    var resolvedType = "FLOAT";
    if (tokenDef.type === "COLOR") resolvedType = "COLOR";
    else if (tokenDef.type === "STRING") resolvedType = "STRING";

    if (compVar && compVar.resolvedType !== resolvedType) {
      // Type mismatch (e.g. changed from FLOAT to STRING). Delete and recreate.
      compVar.remove();
      compVar = null;
    }

    if (!compVar) {
      try {
        compVar = figma.variables.createVariable(figmaPath, componentsCol, resolvedType);
      } catch (e) {
        throw new Error("Failed to create component var: '" + figmaPath + "' - " + String(e));
      }
      componentVarMap[figmaPath] = compVar;
      compCreated++;
    }

    for (var cmi = 0; cmi < syncModes.length; cmi++) {
      var cMode = syncModes[cmi];
      var brandToken = payload[cMode.brandId].components[figmaPath];
      if (!brandToken) continue;

      var cModeId = compModes.modeMap[cMode.key];

      if (brandToken.type === "COLOR") {
        var themedColorToken = brandToken;
        if (brandToken[cMode.theme] && brandToken[cMode.theme].value !== undefined) {
          themedColorToken = brandToken[cMode.theme];
        }
        var semanticAliasTarget = null;
        if (themedColorToken.alias && semanticVarMap[themedColorToken.alias]) {
          semanticAliasTarget = semanticVarMap[themedColorToken.alias];
        }
        if (semanticAliasTarget) {
          compVar.setValueForMode(cModeId, figma.variables.createVariableAlias(semanticAliasTarget));
          compAliases++;
        } else {
          var primitiveAliasTarget = null;
          if (themedColorToken.primitiveAlias) {
            if (brandPrimVarMaps[cMode.brandId] && brandPrimVarMaps[cMode.brandId][themedColorToken.primitiveAlias]) {
              primitiveAliasTarget = brandPrimVarMaps[cMode.brandId][themedColorToken.primitiveAlias];
            } else {
              primitiveAliasTarget = globalPrimVarMap[themedColorToken.primitiveAlias];
            }
          }
          if (primitiveAliasTarget) {
            compVar.setValueForMode(cModeId, figma.variables.createVariableAlias(primitiveAliasTarget));
            compAliases++;
          } else {
            compVar.setValueForMode(cModeId, hexToFigmaRgb(themedColorToken.value));
          }
        }
        } else if (brandToken.type === "FLOAT") {
          var floatAliasTarget = null;
          if (brandToken.alias) {
            if (brandPrimVarMaps[cMode.brandId] && brandPrimVarMaps[cMode.brandId][brandToken.alias]) {
              floatAliasTarget = brandPrimVarMaps[cMode.brandId][brandToken.alias];
            } else {
              floatAliasTarget = globalPrimVarMap[brandToken.alias];
            }
          }
          if (floatAliasTarget) {
            compVar.setValueForMode(cModeId, figma.variables.createVariableAlias(floatAliasTarget));
            compAliases++;
          } else {
            if (brandToken.value != null) {
              compVar.setValueForMode(cModeId, brandToken.value);
            }
          }
        } else if (brandToken.type === "STRING") {
          var stringAliasTarget = null;
          if (brandToken.alias) {
            if (brandPrimVarMaps[cMode.brandId] && brandPrimVarMaps[cMode.brandId][brandToken.alias]) {
              stringAliasTarget = brandPrimVarMaps[cMode.brandId][brandToken.alias];
            } else {
              stringAliasTarget = globalPrimVarMap[brandToken.alias];
            }
          }
          if (stringAliasTarget) {
            compVar.setValueForMode(cModeId, figma.variables.createVariableAlias(stringAliasTarget));
            compAliases++;
          } else {
            compVar.setValueForMode(cModeId, (brandToken.value != null) ? brandToken.value : "");
          }
        }
    }
  }

  // Pass 2: -default alias tokens (within Components collection)
  for (var ai = 0; ai < componentKeys.length; ai++) {
    var aliasPath = componentKeys[ai];
    var aliasDef = firstBrand.components[aliasPath];
    if (!aliasDef.aliasOf) continue;

    var aliasVar = componentVarMap[aliasPath];
    var aliasType = (aliasDef.type === "STRING") ? "STRING" : "FLOAT";

    if (aliasVar && aliasVar.resolvedType !== aliasType) {
      aliasVar.remove();
      aliasVar = null;
    }

    if (!aliasVar) {
      try {
        aliasVar = figma.variables.createVariable(aliasPath, componentsCol, aliasType);
      } catch (e) {
        throw new Error("Failed to create alias var: '" + aliasPath + "' - " + String(e));
      }
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

  // Remove stale component variables (covers renamed figmaPath entries,
  // including legacy button/ghost-* paths).
  if (!preserveExistingVariables) {
    var componentExpected = {};
    for (var cei = 0; cei < componentKeys.length; cei++) {
      componentExpected[componentKeys[cei]] = true;
    }
    var componentStale = 0;
    var componentVarNames = Object.keys(componentVarMap);
    for (var csi = 0; csi < componentVarNames.length; csi++) {
      var existingCompName = componentVarNames[csi];
      if (!componentExpected[existingCompName]) {
        componentVarMap[existingCompName].remove();
        delete componentVarMap[existingCompName];
        componentStale++;
      }
    }
    if (componentStale > 0) progress("  Removed " + componentStale + " stale Components variables");
  }

  totalCreated += compCreated;
  totalAliases += compAliases;
  progress("Components: " + compCreated + " created, " + compAliases + " aliases");

  try {
    syncGradientPaintStyles(payload, syncBrands);
  } catch (gradStyleErr) {
    progress("Gradient paint styles skipped: " + String(gradStyleErr));
  }

  // ── Foundations-doc-only path ──
  // Variables are already synced above (idempotent), so the doc has live
  // variables to bind to. We skip rebuilding component sets entirely.
  if (buildOptions.foundationsDocOnly) {
    var foundationsFont = await loadFont();
    var foundationsSummary;
    try {
      foundationsSummary = await buildFoundationsDocsPage(payload, foundationsFont);
    } catch (foundationsErr) {
      progress("Foundations doc failed: " + String(foundationsErr));
      foundationsSummary = { created: 0, skipped: 1 };
    }
    var foundationsMsg =
      "Foundations doc built. " + totalCreated + " vars synced, " + totalAliases + " aliases.";
    if (foundationsSummary && Number(foundationsSummary.skipped || 0) > 0) {
      foundationsMsg += " (doc skipped)";
    }
    progress(foundationsMsg);
    figma.ui.postMessage({ type: "sync-complete", success: true, message: foundationsMsg });
    return;
  }

  // ── Build visual components ──
  progress("Building visual components...");
  var componentBuild = await buildComponents(componentVarMap, buildOptions.componentsToBuild || null, buildOptions, {
    syncBrands: syncBrands,
    compModes: compModes,
    semModes: semModes,
    componentsCol: componentsCol,
    semanticCol: semanticCol,
    // Resolved component FLOAT/COLOR/STRING from first synced brand (for props Figma cannot bind, e.g. ellipse cornerRadius).
    componentPayload: payload[syncBrands[0]] && payload[syncBrands[0]].components ? payload[syncBrands[0]].components : null,
  });
  var componentFailures = (componentBuild && componentBuild.failures) ? componentBuild.failures : [];
  var docsSummary = (componentBuild && componentBuild.docs) ? componentBuild.docs : null;

  // Always (re)build the Foundations doc alongside the component docs.
  var foundationsSummary = null;
  try {
    var foundationsFontFull = await loadFont();
    foundationsSummary = await buildFoundationsDocsPage(payload, foundationsFontFull);
  } catch (foundationsFullErr) {
    progress("Foundations doc failed: " + String(foundationsFullErr));
  }

  var doneMsg = "Sync complete! " + totalCreated + " vars, " + totalAliases + " aliases, " + syncModes.length + " modes, components built.";
  if (syncModes.length < modeEntries.length) {
    doneMsg += " (" + (modeEntries.length - syncModes.length) + " modes skipped)";
  }
  if (componentFailures.length > 0) {
    doneMsg += " Component build failures: " + componentFailures.join(" | ");
  }
  if (docsSummary) {
    doneMsg += " Docs: " + String(docsSummary.created || 0) + " created";
    if (Number(docsSummary.skipped || 0) > 0) {
      doneMsg += ", " + String(docsSummary.skipped) + " skipped";
    }
    doneMsg += ".";
  }
  if (foundationsSummary && Number(foundationsSummary.created || 0) > 0) {
    doneMsg += " Foundations doc built.";
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

function normalizeComponentKey(name) {
  return String(name || "").toLowerCase().replace(/[^a-z]/g, "");
}

function resolveManagedComponentKeyFromName(name) {
  var normalized = normalizeComponentKey(name);
  if (!normalized) return null;
  if (normalized === "popup") return "popover";
  // Renamed chart sets ("Bar Chart", "Line Chart", ...) must still resolve to the
  // original managed keys so sync matching and cleanup of old "Chart*" sets work.
  var chartAliases = {
    barchart: "chart",
    linechart: "chartline",
    areachart: "chartarea",
    stackedbarchart: "chartstackedbar",
    combochart: "chartcombo",
    donutchart: "chartdonut",
  };
  if (chartAliases[normalized]) return chartAliases[normalized];
  var managedKeys = [
    "button", "switch", "burger", "segmentedcontrol", "slider", "rangeslider", "checkbox", "radio",
    "chip", "notification", "alert", "modal", "tooltip", "popover", "menu", "divider", "list", "loader",
    "progress",
    "chartstackedbar",
    "chartcombo",
    "chartdonut",
    "chartline",
    "chartarea",
    "chart",
    "avatar",
    "pill", "badge", "textinput", "multiselect", "select", "card", "actionicon",
    "tabs", "accordionitem", "accordion", "anchor", "title", "text", "image",
    "table"
  ];
  // Longest keys first so e.g. "textinput" matches before the "text" prefix rule.
  var sorted = managedKeys.slice().sort(function (a, b) {
    return b.length - a.length;
  });
  for (var i = 0; i < sorted.length; i++) {
    var key = sorted[i];
    if (normalized === key || normalized.indexOf(key) === 0) {
      return key;
    }
  }
  return null;
}

function isLegacyTabsDisabledArtifact(node) {
  if (!node || (node.type !== "COMPONENT" && node.type !== "COMPONENT_SET")) return false;
  var normalized = normalizeComponentKey(node.name);
  if (!normalized) return false;
  var nameLooksLikeDisabledTabs =
    normalized === "disabled" ||
    normalized === "tabsdisabled" ||
    normalized === "disabledtabs" ||
    normalized.indexOf("tabsdisabled") === 0 ||
    normalized.indexOf("disabledtabs") === 0;
  if (!nameLooksLikeDisabledTabs) return false;
  // Guard against removing unrelated components named "Disabled":
  // require tabs-like structure/content.
  try {
    var hasTabsLikeLayer = false;
    var hasTabText = false;
    var desc = typeof node.findAll === "function"
      ? node.findAll(function () { return true; })
      : [];
    for (var i = 0; i < desc.length; i++) {
      var d = desc[i];
      if (!hasTabsLikeLayer && typeof d.name === "string" && (d.name === "List" || d.name.indexOf("Tab/") === 0)) {
        hasTabsLikeLayer = true;
      }
      if (!hasTabText && d.type === "TEXT" && typeof d.characters === "string" && d.characters.indexOf("Tab") >= 0) {
        hasTabText = true;
      }
      if (hasTabsLikeLayer && hasTabText) return true;
    }
  } catch (_legacyTabsScanErr) {}
  return false;
}

async function buildComponents(varMap, componentsToBuild, buildOptions, collectionsCtx) {
  if (!buildComponents._allPagesLoaded) {
    try {
      if (typeof figma.loadAllPagesAsync === "function") {
        await figma.loadAllPagesAsync();
      }
      buildComponents._allPagesLoaded = true;
    } catch (loadAllPagesErr) {
      progress("Could not preload all pages: " + String(loadAllPagesErr));
    }
  }
  var page = figma.currentPage;
  if (page && page.name === "Component Documentation") {
    page = null;
    for (var pgi = 0; pgi < figma.root.children.length; pgi++) {
      var rootNode = figma.root.children[pgi];
      if (rootNode.type === "PAGE" && rootNode.name === "Components") {
        page = rootNode;
        break;
      }
    }
    if (!page) {
      page = figma.createPage();
      page.name = "Components";
    }
  }
  // With documentAccess: "dynamic-page", nodes are created on `page` while the editor can
  // stay on another page — switch and load so the user actually sees the new component sets.
  try {
    await page.loadAsync();
  } catch (loadPageErr) {
    progress("Components target page load: " + String(loadPageErr));
  }
  try {
    if (typeof figma.setCurrentPageAsync === "function") {
      await figma.setCurrentPageAsync(page);
    } else if (page && figma.currentPage && figma.currentPage.id !== page.id) {
      figma.currentPage = page;
    }
  } catch (navErr) {
    progress("Could not switch to components page: " + String(navErr));
  }
  var buildFailures = [];
  var requestedSet = null;

  // Defensive normalization:
  // - null/empty list => build all components
  // - ["all"] / ["all components"] / ["*"] => build all components
  // - otherwise build only selected normalized component keys
  if (Array.isArray(componentsToBuild)) {
    var normalizedRequested = {};
    var hasSelection = false;
    var buildAllSentinel = false;
    var unknownSelections = [];
    for (var rci = 0; rci < componentsToBuild.length; rci++) {
      var normalizedKey = normalizeComponentKey(componentsToBuild[rci]);
      if (!normalizedKey) continue;
      if (
        normalizedKey === "all" ||
        normalizedKey === "allcomponents" ||
        normalizedKey === "components" ||
        normalizedKey === "everything"
      ) {
        buildAllSentinel = true;
        break;
      }
      // Canonicalize aliases/subcomponent labels to the managed root key.
      // Example: "tableheader"/"tablebody" should still build the "table" set.
      var managedKey = resolveManagedComponentKeyFromName(normalizedKey);
      if (managedKey) {
        normalizedRequested[managedKey] = true;
        hasSelection = true;
      } else {
        unknownSelections.push(normalizedKey);
      }
    }
    if (!buildAllSentinel && hasSelection) {
      requestedSet = normalizedRequested;
    } else if (!buildAllSentinel && unknownSelections.length > 0 && !hasSelection) {
      progress(
        "No recognized components in selection (" +
          unknownSelections.join(", ") +
          "). Falling back to building all components."
      );
    }
  }

  if (requestedSet) {
    // Modal previews depend on these sets during generation.
    if (requestedSet.modal) {
      requestedSet.button = true;
      requestedSet.title = true;
      requestedSet.text = true;
    }
    if (requestedSet.notification) {
      requestedSet.loader = true;
    }
    if (requestedSet.accordion) {
      requestedSet.accordionitem = true;
    }
    if (requestedSet.tabs) {
      requestedSet.tabsitem = true;
    }
    if (requestedSet.table) {
      requestedSet.badge = true;
      requestedSet.progress = true;
      requestedSet.text = true;
      requestedSet.avatar = true;
    }
    progress("Building selected components: " + Object.keys(requestedSet).join(", "));
  } else {
    progress("Building all components.");
  }

  // Remove previously generated sets for selected components only.
  await cleanupExistingComponents(page, requestedSet);

  // Load font for button text and switch labels
  var font = await loadFont();
  var componentPayload =
    collectionsCtx && collectionsCtx.componentPayload ? collectionsCtx.componentPayload : null;

  function resolvedComponentFloat(figmaPathKey, fallback) {
    if (!componentPayload || !figmaPathKey) return fallback;
    var t = componentPayload[figmaPathKey];
    if (!t || t.value == null) return fallback;
    var n = Number(t.value);
    return Number.isFinite(n) ? n : fallback;
  }

  function resolvedComponentColor(figmaPathKey, fallback) {
    if (!componentPayload || !figmaPathKey) return fallback;
    var t = componentPayload[figmaPathKey];
    if (!t || !t.value) return fallback;
    return hexToFigmaRgb(String(t.value));
  }

  function resolvedComponentString(figmaPathKey, fallback) {
    if (!componentPayload || !figmaPathKey) return fallback;
    var t = componentPayload[figmaPathKey];
    if (!t || t.value == null) return fallback;
    return String(t.value);
  }

  var compSetGap = 300;
  var buttonFocusRingStyle = (buildOptions && buildOptions.buttonFocusRingStyle === "attached") ? "attached" : "offset";
  var actionIconFocusRingStyle = (buildOptions && buildOptions.actionIconFocusRingStyle === "attached") ? "attached" : "offset";
  var titleSampleText = (buildOptions && typeof buildOptions.titleText === "string" && buildOptions.titleText.trim().length > 0)
    ? buildOptions.titleText
    : "Why guess when you can know.";
  var textSampleText = (buildOptions && typeof buildOptions.textText === "string" && buildOptions.textText.trim().length > 0)
    ? buildOptions.textText
    : "Why guess when you can know.";
  function resolveVariantList(selected, allowed) {
    if (!Array.isArray(selected) || selected.length === 0) return allowed.slice();
    var allowedSet = {};
    for (var ai = 0; ai < allowed.length; ai++) {
      allowedSet[allowed[ai]] = true;
    }
    var next = [];
    for (var si = 0; si < selected.length; si++) {
      var key = String(selected[si] || "").toLowerCase();
      if (allowedSet[key] && next.indexOf(key) < 0) {
        next.push(key);
      }
    }
    return next.length > 0 ? next : allowed.slice();
  }
  var buttonVariants = resolveVariantList(buildOptions && buildOptions.buttonVariants, ["filled", "outlined", "ghost"]);
  var actionIconVariants = resolveVariantList(buildOptions && buildOptions.actionIconVariants, ["default", "filled", "light", "outlined", "transparent"]);
  var tabsVariants = resolveVariantList(buildOptions && buildOptions.tabsVariants, ["default", "outlined", "pills"]);
  async function buildSet(name, builder) {
    var setKey = normalizeComponentKey(name);
    if (requestedSet && !requestedSet[setKey]) {
      progress("Skipping " + name + " component set...");
      return null;
    }
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
    return buildButtonComponentSet(varMap, page, font, buttonFocusRingStyle, buttonVariants);
  });
  var switchSet = await buildSet("Switch", function () {
    return buildSwitchComponentSet(varMap, page, font);
  });
  var burgerSet = await buildSet("Burger", function () {
    return buildBurgerComponentSet(varMap, page, font);
  });
  var segmentedControlSet = await buildSet("SegmentedControl", function () {
    return buildSegmentedControlComponentSet(varMap, page, font);
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
  var loaderSet = await buildSet("Loader", function () {
    return buildLoaderComponentSet(varMap, page, font, resolvedComponentFloat);
  });
  var progressSet = await buildSet("Progress", function () {
    return buildProgressComponentSet(varMap, page, font, resolvedComponentFloat);
  });
  var chartSet = await buildSet("Chart", function () {
    return buildChartComponentSet(varMap, page, font, resolvedComponentFloat, resolvedComponentString);
  });
  var chartLineSet = await buildSet("Chart Line", function () {
    return buildChartLineComponentSet(varMap, page, font, resolvedComponentFloat, resolvedComponentString);
  });
  var chartAreaSet = await buildSet("Chart Area", function () {
    return buildChartAreaComponentSet(varMap, page, font, resolvedComponentFloat, resolvedComponentString);
  });
  var chartStackedBarSet = await buildSet("Chart Stacked Bar", function () {
    return buildChartStackedBarComponentSet(varMap, page, font, resolvedComponentFloat, resolvedComponentString);
  });
  var chartComboSet = await buildSet("Chart Combo", function () {
    return buildChartComboComponentSet(varMap, page, font, resolvedComponentFloat, resolvedComponentString);
  });
  var chartDonutSet = await buildSet("Chart Donut", function () {
    return buildChartDonutComponentSet(varMap, page, font, resolvedComponentFloat, resolvedComponentString);
  });
  var notificationSet = await buildSet("Notification", function () {
    return buildNotificationComponentSet(varMap, page, font, loaderSet, resolvedComponentFloat);
  });
  var alertSet = await buildSet("Alert", function () {
    return buildAlertComponentSet(varMap, page, font);
  });
  var tooltipSet = await buildSet("Tooltip", function () {
    return buildTooltipComponentSet(varMap, page, font);
  });
  var popoverSet = await buildSet("Popover", function () {
    return buildPopoverComponentSet(varMap, page, font);
  });
  var menuSet = await buildSet("Menu", function () {
    return buildMenuComponentSet(varMap, page, font);
  });
  var dividerSet = await buildSet("Divider", function () {
    return buildDividerComponentSet(varMap, page);
  });
  var listSet = await buildSet("List", function () {
    return buildListComponentSet(varMap, page, font);
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
  var multiSelectSet = await buildSet("MultiSelect", function () {
    return buildMultiSelectComponentSet(varMap, page, font);
  });
  var cardSet = await buildSet("Card", function () {
    return buildCardComponentSet(varMap, page, font, { compact: true });
  });
  var actionIconSet = await buildSet("ActionIcon", function () {
    return buildActionIconComponentSet(varMap, page, actionIconFocusRingStyle, actionIconVariants);
  });
  var tabsSet = await buildSet("Tabs", function () {
    return buildTabsComponentSet(varMap, page, font, tabsVariants);
  });
  var accordionItemSet = await buildSet("Accordion Item", function () {
    return buildAccordionItemComponentSet(varMap, page, font);
  });
  var accordionSet = await buildSet("Accordion", function () {
    return buildAccordionComponentSet(varMap, page, font, accordionItemSet);
  });
  var tabsItemSet = await buildSet("Tabs Item", function () {
    return buildTabsItemComponentSet(varMap, page, font, tabsVariants);
  });
  var anchorSet = await buildSet("Anchor", function () {
    return buildAnchorComponentSet(varMap, page, font);
  });
  var titleSet = await buildSet("Title", function () {
    return buildTitleComponentSet(varMap, page, font, titleSampleText);
  });
  var textSet = await buildSet("Text", function () {
    return buildTextComponentSet(varMap, page, font, textSampleText);
  });
  var imageSet = await buildSet("Image", function () {
    return buildImageComponentSet(varMap, page, font);
  });
  var avatarSet = await buildSet("Avatar", async function () {
    return await buildAvatarComponentSet(varMap, page, font);
  });
  var tableBuildResult = await buildSet("Table", async function () {
    return await buildTableComponentSet(varMap, page, font, {
      badgeSet: badgeSet,
      progressSet: progressSet,
      textSet: textSet,
      avatarSet: avatarSet,
    });
  });
  var tableFlatten = [];
  if (tableBuildResult) {
    if (Array.isArray(tableBuildResult)) {
      for (var tfi = 0; tfi < tableBuildResult.length; tfi++) {
        if (tableBuildResult[tfi]) tableFlatten.push(tableBuildResult[tfi]);
      }
    } else {
      tableFlatten.push(tableBuildResult);
    }
  }
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
    burgerSet,
    segmentedControlSet,
    sliderSet,
    rangeSliderSet,
    checkboxSet,
    radioSet,
    chipSet,
    loaderSet,
    progressSet,
    chartSet,
    chartLineSet,
    chartAreaSet,
    chartStackedBarSet,
    chartComboSet,
    chartDonutSet,
    notificationSet,
    alertSet,
    modalSet,
    tooltipSet,
    popoverSet,
    menuSet,
    dividerSet,
    listSet,
    pillSet,
    badgeSet,
    textInputSet,
    selectSet,
    multiSelectSet,
    cardSet,
    actionIconSet,
    tabsItemSet,
    accordionItemSet,
    accordionSet,
    tabsSet,
    anchorSet,
    titleSet,
    textSet,
    imageSet,
    avatarSet,
  ].concat(tableFlatten);
  var validSets = generatedSets.filter(function (set) { return Boolean(set); });
  try {
    var clearModeCollections = await figma.variables.getLocalVariableCollectionsAsync();
    var clearModeCollectionIds = clearModeCollections.map(function (c) { return c.id; });
    function clearModesNode(node) {
      if (!node || typeof node.clearExplicitVariableModeForCollection !== "function") return;
      for (var cmi = 0; cmi < clearModeCollectionIds.length; cmi++) {
        try {
          node.clearExplicitVariableModeForCollection(clearModeCollectionIds[cmi]);
        } catch (_e) {}
      }
    }
    function clearModesTree(root) {
      if (!root) return;
      clearModesNode(root);
      if (typeof root.findAll !== "function") return;
      var nodes = [];
      try { nodes = root.findAll(function () { return true; }); } catch (_scanErr) { nodes = []; }
      for (var ni = 0; ni < nodes.length; ni++) clearModesNode(nodes[ni]);
    }
    for (var vsi = 0; vsi < validSets.length; vsi++) {
      clearModesTree(validSets[vsi]);
    }
  } catch (_clearSetModesErr) {}

  // Match generated component visuals to the app preview theme/brand when provided.
  try {
    var ctx = collectionsCtx || {};
    var ctxSyncBrands = ctx.syncBrands;
    var ctxCompModes = ctx.compModes;
    var ctxSemModes = ctx.semModes;
    var ctxComponentsCol = ctx.componentsCol;
    var ctxSemanticCol = ctx.semanticCol;
    if (!ctxCompModes || !ctxSemModes || !ctxComponentsCol || !ctxSemanticCol || !ctxSyncBrands || !ctxSyncBrands.length) {
      progress("Skipping explicit variable modes (sync context not passed to component build).");
    } else {
    var preferredTheme = (buildOptions && buildOptions.previewTheme === "dark") ? "dark" : "light";
    var preferredBrand = buildOptions && typeof buildOptions.activeBrand === "string"
      ? String(buildOptions.activeBrand).toLowerCase()
      : ctxSyncBrands[0];
    var preferredModeKey = preferredBrand + "-" + preferredTheme;
    var preferredCompModeId = ctxCompModes.modeMap[preferredModeKey];
    var preferredSemModeId = ctxSemModes.modeMap[preferredModeKey];

    if (preferredCompModeId || preferredSemModeId) {
      function applyModesNode(node) {
        if (!node || typeof node.setExplicitVariableModeForCollection !== "function") return;
        if (preferredCompModeId) {
          try { node.setExplicitVariableModeForCollection(ctxComponentsCol.id, preferredCompModeId); } catch (_e1) {}
        }
        if (preferredSemModeId) {
          try { node.setExplicitVariableModeForCollection(ctxSemanticCol.id, preferredSemModeId); } catch (_e2) {}
        }
      }
      function applyModesTree(root) {
        if (!root) return;
        applyModesNode(root);
        if (typeof root.findAll !== "function") return;
        var nodes = [];
        try { nodes = root.findAll(function () { return true; }); } catch (_scanErr) { nodes = []; }
        for (var ni = 0; ni < nodes.length; ni++) applyModesNode(nodes[ni]);
      }
      applyModesNode(page);
      for (var msi = 0; msi < validSets.length; msi++) {
        applyModesTree(validSets[msi]);
      }
      progress("Applied component mode: " + preferredModeKey);
    }
    }
  } catch (_applySetModesErr) {}

  positionComponentSets(validSets, compSetGap);

  var docsSourceSets = validSets;
  if (!docsSourceSets || docsSourceSets.length === 0) {
    docsSourceSets = collectManagedComponentSetsFromPage(page, null);
    progress("Docs fallback set scan found " + docsSourceSets.length + " component sets.");
  }
  // Docs should focus on public components. Keep Accordion Item generated,
  // and include subcomponents like TableHeader/TableBody and Accordion Item.
  docsSourceSets = (docsSourceSets || []).filter(function (set) {
    if (!set) return false;
    if (set.type === "COMPONENT") {
      var keyFromComponentName = resolveManagedComponentKeyFromName(set.name);
      if (keyFromComponentName) {
        if (requestedSet && !requestedSet[keyFromComponentName]) return false;
        return true;
      }
      var cn = normalizeComponentKey(set.name);
      if (cn === "table" || cn === "tableheader" || cn === "tablebody") return true;
      return false;
    }
    if (set.type !== "COMPONENT_SET") return false;
    return true;
  });

  if (!docsSourceSets || docsSourceSets.length === 0) {
    progress("Docs source list empty after filtering. Falling back to page scan.");
    docsSourceSets = collectManagedComponentSetsFromPage(page, null);
  }
  if (!docsSourceSets || docsSourceSets.length === 0) {
    docsSourceSets = collectManagedComponentSetsFromRoot(null);
    progress("Docs root scan found " + docsSourceSets.length + " component sets.");
  }

  if ((!docsSourceSets || docsSourceSets.length === 0) && buildFailures.length > 0) {
    progress("No component sets available for docs. Creating failure summary doc.");
    try {
      var failureDocsSummary = await createFailureSummaryDocsPage(buildFailures, font);
      if (failureDocsSummary) {
        docsBuildSummary = failureDocsSummary;
        progress("Components created.");
        return { failures: buildFailures, docs: docsBuildSummary };
      }
    } catch (failureDocErr) {
      progress("Could not create failure summary docs: " + String(failureDocErr));
    }
  }

  try {
    var docsBuildSummary = await buildUsageDocsPage(docsSourceSets, font);
    if (!docsBuildSummary) docsBuildSummary = { created: 0, skipped: 0 };
  } catch (docsErr) {
    buildFailures.push("Usage docs: " + String(docsErr));
    progress("Failed to build usage docs: " + String(docsErr));
    docsBuildSummary = { created: 0, skipped: (docsSourceSets && docsSourceSets.length) ? docsSourceSets.length : 0 };
  }

  // Keep docs page in the same brand/theme mode as preview.
  try {
    var docsPageForModes = null;
    for (var dpi = 0; dpi < figma.root.children.length; dpi++) {
      var docsRootPage = figma.root.children[dpi];
      if (docsRootPage && docsRootPage.type === "PAGE" && docsRootPage.name === "Component Documentation") {
        docsPageForModes = docsRootPage;
        break;
      }
    }
    var docsCtx = collectionsCtx || {};
    if (docsPageForModes && docsCtx.compModes && docsCtx.semModes && docsCtx.componentsCol && docsCtx.semanticCol) {
      var docsSyncBrands = docsCtx.syncBrands || [];
      if (docsSyncBrands.length > 0) {
        var docsPreferredTheme = (buildOptions && buildOptions.previewTheme === "dark") ? "dark" : "light";
        var docsPreferredBrand = buildOptions && typeof buildOptions.activeBrand === "string"
          ? String(buildOptions.activeBrand).toLowerCase()
          : docsSyncBrands[0];
        var docsPreferredModeKey = docsPreferredBrand + "-" + docsPreferredTheme;
        var docsPreferredCompModeId = docsCtx.compModes.modeMap[docsPreferredModeKey];
        var docsPreferredSemModeId = docsCtx.semModes.modeMap[docsPreferredModeKey];

        if (docsPreferredCompModeId || docsPreferredSemModeId) {
          if (typeof docsPageForModes.setExplicitVariableModeForCollection === "function") {
            if (docsPreferredCompModeId) {
              try { docsPageForModes.setExplicitVariableModeForCollection(docsCtx.componentsCol.id, docsPreferredCompModeId); } catch (_docsModeCompErr) {}
            }
            if (docsPreferredSemModeId) {
              try { docsPageForModes.setExplicitVariableModeForCollection(docsCtx.semanticCol.id, docsPreferredSemModeId); } catch (_docsModeSemErr) {}
            }
          }
          if (typeof docsPageForModes.findAll === "function") {
            var docsNodes = [];
            try { docsNodes = docsPageForModes.findAll(function () { return true; }); } catch (_docsScanErr) { docsNodes = []; }
            for (var dni = 0; dni < docsNodes.length; dni++) {
              var docsNode = docsNodes[dni];
              if (!docsNode || typeof docsNode.setExplicitVariableModeForCollection !== "function") continue;
              if (docsPreferredCompModeId) {
                try { docsNode.setExplicitVariableModeForCollection(docsCtx.componentsCol.id, docsPreferredCompModeId); } catch (_docsNodeCompErr) {}
              }
              if (docsPreferredSemModeId) {
                try { docsNode.setExplicitVariableModeForCollection(docsCtx.semanticCol.id, docsPreferredSemModeId); } catch (_docsNodeSemErr) {}
              }
            }
          }
          progress("Applied docs mode: " + docsPreferredModeKey);
        }
      }
    }
  } catch (_applyDocsModesErr) {}

  // Scroll viewport to show all component sets
  if (validSets.length > 0) {
    try {
      figma.viewport.scrollAndZoomIntoView(validSets);
    } catch (scrollErr) {
      progress("Viewport scroll: " + String(scrollErr));
    }
  }

  if (buildFailures.length > 0) {
    progress("Component set failures: " + buildFailures.join(" | "));
  }

  progress("Components created.");
  return { failures: buildFailures, docs: docsBuildSummary || { created: 0, skipped: 0 } };
}

function collectManagedComponentSetsFromPage(page, requestedSet) {
  if (!page || !page.children) return [];
  var sets = [];
  for (var i = 0; i < page.children.length; i++) {
    var node = page.children[i];
    if (!node) continue;
    if (node.type === "COMPONENT") {
      var cn2 = normalizeComponentKey(node.name);
      if ((cn2 === "table" || cn2 === "tableheader" || cn2 === "tablebody") && (!requestedSet || requestedSet.table)) {
        sets.push(node);
      }
      continue;
    }
    if (node.type !== "COMPONENT_SET") continue;
    var key = resolveManagedComponentKeyFromName(node.name);
    if (!key) continue;
    if (requestedSet && !requestedSet[key]) continue;
    sets.push(node);
  }
  return sets;
}

function collectManagedComponentSetsFromRoot(requestedSet) {
  var seen = {};
  var sets = [];
  if (!figma || !figma.root || !figma.root.children) return sets;
  for (var pi = 0; pi < figma.root.children.length; pi++) {
    var page = figma.root.children[pi];
    if (!page || page.type !== "PAGE" || !page.children) continue;
    var pageSets = collectManagedComponentSetsFromPage(page, requestedSet);
    for (var si = 0; si < pageSets.length; si++) {
      var set = pageSets[si];
      if (!set || seen[set.id]) continue;
      seen[set.id] = true;
      sets.push(set);
    }
  }
  return sets;
}

async function createFailureSummaryDocsPage(buildFailures, titleFont) {
  if (!buildFailures || buildFailures.length === 0) return { created: 0, skipped: 0 };
  var docsPage = null;
  for (var pi = 0; pi < figma.root.children.length; pi++) {
    var p = figma.root.children[pi];
    if (p && p.type === "PAGE" && p.name === "Component Documentation") {
      docsPage = p;
      break;
    }
  }
  if (!docsPage) {
    docsPage = figma.createPage();
    docsPage.name = "Component Documentation";
  }
  try { await docsPage.loadAsync(); } catch (_e) {}

  for (var ci = docsPage.children.length - 1; ci >= 0; ci--) {
    var child = docsPage.children[ci];
    if (child && String(child.name || "") === "__AUTO_DOCS__ - Build Failures") {
      try { child.remove(); } catch (_removeErr) {}
    }
  }

  var frame = figma.createFrame();
  frame.name = "__AUTO_DOCS__ - Build Failures";
  frame.layoutMode = "VERTICAL";
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "AUTO";
  frame.counterAxisAlignItems = "MIN";
  frame.itemSpacing = 8;
  frame.paddingLeft = 24;
  frame.paddingRight = 24;
  frame.paddingTop = 24;
  frame.paddingBottom = 24;
  frame.fills = [{ type: "SOLID", color: { r: 0.094, g: 0.098, b: 0.149 } }];
  frame.strokes = [{ type: "SOLID", color: { r: 0.224, g: 0.235, b: 0.337 } }];
  frame.strokeAlign = "INSIDE";
  frame.cornerRadius = 8;

  var heading = figma.createText();
  heading.name = "Failure Heading";
  heading.fontName = titleFont;
  heading.fontSize = 24;
  heading.characters = "Component docs were not generated";
  heading.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  frame.appendChild(heading);

  for (var fi = 0; fi < buildFailures.length; fi++) {
    var line = figma.createText();
    line.name = "Failure " + (fi + 1);
    line.fontName = titleFont;
    line.fontSize = 12;
    line.characters = "• " + String(buildFailures[fi]);
    line.fills = [{ type: "SOLID", color: { r: 0.651, g: 0.671, b: 0.718 } }];
    frame.appendChild(line);
  }

  docsPage.appendChild(frame);
  frame.x = 0;
  frame.y = 0;
  return { created: 1, skipped: 0 };
}

async function buildUsageDocsPage(componentSets, titleFont) {
  if (!componentSets || componentSets.length === 0) {
    progress("Usage docs skipped: no component sets available.");
    return { created: 0, skipped: 0 };
  }

  var DOC_COLORS = {
    pageBg: { r: 0.094, g: 0.098, b: 0.149 },       // #181926
    panelBg: { r: 0.141, g: 0.149, b: 0.235 },      // #24263C
    panelStroke: { r: 0.224, g: 0.235, b: 0.337 },  // #393C56
    title: { r: 1, g: 1, b: 1 },                    // #FFFFFF
    sectionHeading: { r: 0, g: 0.424, b: 0.843 },   // #006CD7
    subtitle: { r: 0.651, g: 0.671, b: 0.718 },     // #A6ABB7
    variantSubtitle: { r: 0.725, g: 0.722, b: 0.769 }, // #B9B8C4
    panelHeading: { r: 0.929, g: 0.941, b: 0.949 }, // #EDF0F2
    panelBody: { r: 0.639, g: 0.671, b: 0.729 },    // #A3ABBA
    cellLabel: { r: 0.651, g: 0.69, b: 0.749 },     // #A6B0BF
  };

  var DOC_COLOR_VAR_NAMES = {
    pageBg: ["surface-primary", "surface/primary", "surface primary", "subtle-primary", "subtle/primary", "subtle primary"],
    panelBg: ["surface-secondary", "surface/secondary", "surface secondary", "subtle-secondary", "subtle/secondary", "subtle secondary"],
    panelStroke: ["border-primary", "border/primary", "border primary"],
    sectionHeading: ["interactive-primary", "interactive/primary", "interactive primary"],
    title: ["text-default", "text/default", "text default"],
    textSubtle: ["text-subtle", "text/subtle", "text subtle"],
  };

  var docsColorVars = {};
  var docsCollectionNamesById = {};
  try {
    var docsCollections = await figma.variables.getLocalVariableCollectionsAsync();
    for (var dci = 0; dci < docsCollections.length; dci++) {
      docsCollectionNamesById[docsCollections[dci].id] = String(docsCollections[dci].name || "");
    }
  } catch (_docsCollectionErr) {}
  try {
    var localColorVars = await figma.variables.getLocalVariablesAsync("COLOR");
    for (var lvi = 0; lvi < localColorVars.length; lvi++) {
      var lVar = localColorVars[lvi];
      if (!lVar || !lVar.name) continue;
      var existing = docsColorVars[lVar.name];
      if (!existing) {
        docsColorVars[lVar.name] = lVar;
        continue;
      }
      var existingCollectionName = String(docsCollectionNamesById[existing.variableCollectionId] || "");
      var nextCollectionName = String(docsCollectionNamesById[lVar.variableCollectionId] || "");
      // Prefer Semantic collection when duplicate variable names exist.
      if (existingCollectionName.toLowerCase() !== "semantic" && nextCollectionName.toLowerCase() === "semantic") {
        docsColorVars[lVar.name] = lVar;
      }
    }
  } catch (_docsVarErr) {}

  function normalizeVarLookupName(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function resolveDocColorVar(role) {
    var candidates = DOC_COLOR_VAR_NAMES[role] || [];
    for (var ci = 0; ci < candidates.length; ci++) {
      if (docsColorVars[candidates[ci]]) return docsColorVars[candidates[ci]];
    }
    var normalizedCandidates = [];
    for (var nci = 0; nci < candidates.length; nci++) {
      normalizedCandidates.push(normalizeVarLookupName(candidates[nci]));
    }
    var allNames = Object.keys(docsColorVars);
    for (var ai = 0; ai < allNames.length; ai++) {
      var varName = allNames[ai];
      var varNorm = normalizeVarLookupName(varName);
      for (var cni = 0; cni < normalizedCandidates.length; cni++) {
        var candNorm = normalizedCandidates[cni];
        if (!candNorm) continue;
        if (varNorm === candNorm || varNorm.endsWith(candNorm)) {
          return docsColorVars[varName];
        }
      }
    }
    return null;
  }

  var docsResolvedColorVars = {
    pageBg: resolveDocColorVar("pageBg"),
    panelBg: resolveDocColorVar("panelBg"),
    panelStroke: resolveDocColorVar("panelStroke"),
    sectionHeading: resolveDocColorVar("sectionHeading"),
    title: resolveDocColorVar("title"),
    textSubtle: resolveDocColorVar("textSubtle"),
  };

  var docsVariableCollectionIds = [];
  try {
    var docsCollections = await figma.variables.getLocalVariableCollectionsAsync();
    for (var dci = 0; dci < docsCollections.length; dci++) {
      docsVariableCollectionIds.push(docsCollections[dci].id);
    }
  } catch (_docsCollectionErr) {}

  function clearExplicitModesForNode(node) {
    if (!node || typeof node.clearExplicitVariableModeForCollection !== "function") return;
    for (var cmi = 0; cmi < docsVariableCollectionIds.length; cmi++) {
      try {
        node.clearExplicitVariableModeForCollection(docsVariableCollectionIds[cmi]);
      } catch (_clearModeErr) {}
    }
  }

  function clearExplicitModesInSubtree(root) {
    if (!root) return;
    clearExplicitModesForNode(root);
    if (typeof root.findAll !== "function") return;
    var descendants = [];
    try {
      descendants = root.findAll(function () { return true; });
    } catch (_scanErr) {
      descendants = [];
    }
    for (var di = 0; di < descendants.length; di++) {
      clearExplicitModesForNode(descendants[di]);
    }
  }

  function normalizeName(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  function appendText(node, font, text, size, color, name, colorVarRole) {
    var t = figma.createText();
    t.name = name || "Text";
    t.fontName = font;
    t.fontSize = size;
    t.characters = text;
    t.fills = [{ type: "SOLID", color: color }];
    if (colorVarRole && docsResolvedColorVars[colorVarRole]) {
      bindPaintVar(t, "fills", 0, docsResolvedColorVars[colorVarRole]);
    }
    node.appendChild(t);
    return t;
  }

  function createPanel(name, itemSpacing) {
    var panel = figma.createFrame();
    panel.name = name;
    panel.layoutMode = "VERTICAL";
    panel.primaryAxisSizingMode = "AUTO";
    panel.counterAxisSizingMode = "AUTO";
    panel.counterAxisAlignItems = "CENTER";
    panel.itemSpacing = itemSpacing;
    panel.paddingLeft = 16;
    panel.paddingRight = 16;
    panel.paddingTop = 24;
    panel.paddingBottom = 24;
    panel.cornerRadius = 4;
    panel.clipsContent = false;
    panel.fills = [{ type: "SOLID", color: DOC_COLORS.panelBg }];
    panel.strokes = [{ type: "SOLID", color: DOC_COLORS.panelStroke }];
    panel.strokeWeight = 1;
    if (docsResolvedColorVars.panelBg) {
      bindPaintVar(panel, "fills", 0, docsResolvedColorVars.panelBg);
    }
    if (docsResolvedColorVars.panelStroke) {
      bindPaintVar(panel, "strokes", 0, docsResolvedColorVars.panelStroke);
    }
    return panel;
  }

  function createStack(name, spacing) {
    var frame = figma.createFrame();
    frame.name = name || "Stack";
    frame.layoutMode = "VERTICAL";
    frame.primaryAxisSizingMode = "AUTO";
    frame.counterAxisSizingMode = "AUTO";
    frame.counterAxisAlignItems = "MIN";
    frame.itemSpacing = spacing;
    frame.clipsContent = false;
    frame.fills = [];
    return frame;
  }

  function createSectionHeader(title, subtitle, subtitleColor) {
    var block = createStack("Section Header", 8);
    appendText(block, titleFont, title, 20, DOC_COLORS.sectionHeading, "Section Heading", "sectionHeading");
    appendText(block, bodyFont, subtitle, 14, subtitleColor || DOC_COLORS.subtitle, "Section Subtitle", "textSubtle");
    return block;
  }

  function docTextIsUnderInstance(node) {
    var current = node;
    while (current && current.parent) {
      current = current.parent;
      if (current && current.type === "INSTANCE") return true;
    }
    return false;
  }

  /** Template files often use centered headings; match code-built docs (left body copy). */
  function leftAlignTemplateDocHeadings(root) {
    if (!root || typeof root.findAll !== "function") return;
    var texts = [];
    try {
      texts = root.findAll(function (n) {
        return n.type === "TEXT";
      });
    } catch (_findTextErr) {
      return;
    }
    var leftAlignByLayerName = {
      "Component Title": true,
      "Component Subtitle": true,
      "Section Heading": true,
      "Section Subtitle": true,
      "Variant Heading": true,
      "Variant Description": true,
    };
    for (var lai = 0; lai < texts.length; lai++) {
      var tn = texts[lai];
      if (!tn || tn.type !== "TEXT") continue;
      if (docTextIsUnderInstance(tn)) continue;
      var layer = String(tn.name || "");
      if (!leftAlignByLayerName[layer]) continue;
      try {
        tn.textAlignHorizontal = "LEFT";
      } catch (_taErr) {}
    }
  }

  function bindTextRole(textNode, role) {
    if (!textNode || textNode.type !== "TEXT") return;
    if (!docsResolvedColorVars[role]) return;
    bindPaintVar(textNode, "fills", 0, docsResolvedColorVars[role]);
  }

  function bindPanelRole(frameNode) {
    if (!frameNode || frameNode.type !== "FRAME") return;
    if (docsResolvedColorVars.panelBg) bindPaintVar(frameNode, "fills", 0, docsResolvedColorVars.panelBg);
    if (docsResolvedColorVars.panelStroke) bindPaintVar(frameNode, "strokes", 0, docsResolvedColorVars.panelStroke);
  }

  function applyDocVariableBindings(docNode) {
    if (!docNode || typeof docNode.findAll !== "function") return;
    if (docsResolvedColorVars.pageBg) bindPaintVar(docNode, "fills", 0, docsResolvedColorVars.pageBg);

    function getSolidPaintColor(paint) {
      if (!paint || paint.type !== "SOLID" || !paint.color) return null;
      return paint.color;
    }

    function approxColor(a, b) {
      if (!a || !b) return false;
      return (
        Math.abs((a.r || 0) - (b.r || 0)) <= 0.01 &&
        Math.abs((a.g || 0) - (b.g || 0)) <= 0.01 &&
        Math.abs((a.b || 0) - (b.b || 0)) <= 0.01
      );
    }

    function isInsideInstance(node) {
      var current = node;
      while (current && current.parent) {
        current = current.parent;
        if (current && current.type === "INSTANCE") return true;
      }
      return false;
    }

    var textNodes = [];
    var frameNodes = [];
    try {
      textNodes = docNode.findAll(function (n) { return n.type === "TEXT"; });
      frameNodes = docNode.findAll(function (n) { return n.type === "FRAME"; });
    } catch (_bindScanErr) {
      return;
    }

    var titleBound = 0;
    var headingBound = 0;
    var subtleBound = 0;
    var panelFillBound = 0;
    var panelStrokeBound = 0;

    for (var ti = 0; ti < textNodes.length; ti++) {
      var t = textNodes[ti];
      if (isInsideInstance(t)) continue;
      var tName = String(t.name || "");
      var tText = String(t.characters || "");
      var tFill = (t.fills && t.fills.length > 0) ? getSolidPaintColor(t.fills[0]) : null;
      var isSectionHeading =
        tName === "Section Heading" ||
        tText === "Variants" || tText === "Size" || tText === "States" || tText === "With Icons" ||
        approxColor(tFill, DOC_COLORS.sectionHeading);
      var isSubtleText =
        tName === "Section Subtitle" ||
        tName === "Component Subtitle" ||
        tName === "Variant Description" ||
        approxColor(tFill, DOC_COLORS.subtitle) ||
        approxColor(tFill, DOC_COLORS.panelBody) ||
        approxColor(tFill, DOC_COLORS.variantSubtitle);
      var isComponentTitle =
        tName === "Component Title" ||
        (typeof t.fontSize === "number" && t.fontSize >= 26 && String(t.parent && t.parent.name || "") === "Intro Block");

      if (isSectionHeading && docsResolvedColorVars.sectionHeading) {
        bindTextRole(t, "sectionHeading");
        headingBound++;
        continue;
      }
      if (isComponentTitle && docsResolvedColorVars.title) {
        bindTextRole(t, "title");
        titleBound++;
        continue;
      }
      if (isSubtleText && docsResolvedColorVars.textSubtle) {
        bindTextRole(t, "textSubtle");
        subtleBound++;
      }
    }

    for (var fi = 0; fi < frameNodes.length; fi++) {
      var f = frameNodes[fi];
      if (!f || f.type !== "FRAME") continue;
      if (isInsideInstance(f)) continue;
      var fName = String(f.name || "");
      var isPanelByName = fName.indexOf("slot:") === 0 || fName.indexOf("variant-section-") === 0;

      var fillColor = (f.fills && f.fills.length > 0) ? getSolidPaintColor(f.fills[0]) : null;
      var strokeColor = (f.strokes && f.strokes.length > 0) ? getSolidPaintColor(f.strokes[0]) : null;
      var isPageBg = approxColor(fillColor, DOC_COLORS.pageBg);
      var isPanelBg = approxColor(fillColor, DOC_COLORS.panelBg);
      var isPanelStroke = approxColor(strokeColor, DOC_COLORS.panelStroke);

      if ((isPanelByName || isPanelBg) && docsResolvedColorVars.panelBg) {
        bindPaintVar(f, "fills", 0, docsResolvedColorVars.panelBg);
        panelFillBound++;
      }
      if ((isPanelByName || isPanelStroke) && docsResolvedColorVars.panelStroke) {
        bindPaintVar(f, "strokes", 0, docsResolvedColorVars.panelStroke);
        panelStrokeBound++;
      }
      if (isPageBg && docsResolvedColorVars.pageBg) {
        bindPaintVar(f, "fills", 0, docsResolvedColorVars.pageBg);
      }
    }

  }

  function getPropValues(variantProps, name) {
    var keys = Object.keys(variantProps || {});
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].toLowerCase() === String(name).toLowerCase()) {
        return (variantProps[keys[i]] && variantProps[keys[i]].values) ? variantProps[keys[i]].values.slice() : [];
      }
    }
    return [];
  }

  function getPropKey(variantProps, name) {
    var keys = Object.keys(variantProps || {});
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].toLowerCase() === String(name).toLowerCase()) return keys[i];
    }
    return null;
  }

  function pickOrdered(values, preferred) {
    var out = [];
    for (var pi = 0; pi < preferred.length; pi++) {
      for (var vi = 0; vi < values.length; vi++) {
        if (String(values[vi]).toLowerCase() === String(preferred[pi]).toLowerCase()) {
          out.push(values[vi]);
          break;
        }
      }
    }
    for (var rv = 0; rv < values.length; rv++) {
      if (out.indexOf(values[rv]) < 0) out.push(values[rv]);
    }
    return out;
  }

  function badgeDocVariantIsFilledOrOutline(variantName) {
    var n = String(variantName || "").toLowerCase();
    return n === "filled" || n === "outline";
  }

  function pickDefaultSizeValue(values) {
    if (!values || values.length === 0) return null;
    for (var i = 0; i < values.length; i++) {
      if (String(values[i]).toLowerCase() === "default") return values[i];
    }
    for (var j = 0; j < values.length; j++) {
      if (String(values[j]).toLowerCase() === "sm") return values[j];
    }
    return values[0];
  }

  function reorderSizesByDefaultVisualMatch(sizeValues, createSizeInstance) {
    if (!Array.isArray(sizeValues) || sizeValues.length <= 1 || typeof createSizeInstance !== "function") {
      return Array.isArray(sizeValues) ? sizeValues.slice() : [];
    }

    var ordered = sizeValues.slice();
    var defaultIdx = -1;
    for (var i = 0; i < ordered.length; i++) {
      if (String(ordered[i] || "").toLowerCase() === "default") {
        defaultIdx = i;
        break;
      }
    }
    if (defaultIdx < 0) return ordered;

    var defaultSizeValue = ordered[defaultIdx];
    var defaultInst = null;
    try {
      defaultInst = createSizeInstance(defaultSizeValue);
    } catch (_defaultSizeCreateErr) {
      return ordered;
    }
    if (!defaultInst) return ordered;

    var defaultW = Number(defaultInst.width || 0);
    var defaultH = Number(defaultInst.height || 0);

    var bestIdx = -1;
    var bestScore = Number.POSITIVE_INFINITY;
    var candidates = [];
    for (var c = 0; c < ordered.length; c++) {
      if (c === defaultIdx) continue;
      candidates.push({ value: ordered[c], index: c });
    }

    for (var ci = 0; ci < candidates.length; ci++) {
      var candidate = candidates[ci];
      var candidateInst = null;
      try {
        candidateInst = createSizeInstance(candidate.value);
      } catch (_candidateSizeCreateErr) {
        candidateInst = null;
      }
      if (!candidateInst) continue;

      var candidateW = Number(candidateInst.width || 0);
      var candidateH = Number(candidateInst.height || 0);
      var score = Math.abs(defaultW - candidateW) + Math.abs(defaultH - candidateH);
      if (score < bestScore) {
        bestScore = score;
        bestIdx = candidate.index;
      }

      try { candidateInst.remove(); } catch (_candidateRemoveErr) {}
    }

    try { defaultInst.remove(); } catch (_defaultRemoveErr) {}

    if (bestIdx < 0 || bestIdx === defaultIdx) return ordered;

    ordered.splice(defaultIdx, 1);
    if (defaultIdx < bestIdx) bestIdx -= 1;
    ordered.splice(bestIdx + 1, 0, defaultSizeValue);
    return ordered;
  }

  function clearChildren(node) {
    for (var i = node.children.length - 1; i >= 0; i--) {
      node.children[i].remove();
    }
  }

  function findFirstByNames(root, names) {
    if (!root || !names || names.length === 0 || typeof root.findOne !== "function") return null;
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      var hit = null;
      try {
        hit = root.findOne(function (n) { return String(n.name || "") === name; });
      } catch (e) {}
      if (hit) return hit;
    }
    return null;
  }

  async function setNamedText(root, textNodeName, value) {
    var target = findFirstByNames(root, [textNodeName]);
    if (!target || target.type !== "TEXT") return false;
    try {
      if (target.fontName !== figma.mixed) {
        await figma.loadFontAsync(target.fontName);
      }
      target.characters = String(value);
      return true;
    } catch (e) {
      return false;
    }
  }

  function removeSectionOrSlot(root, slug, key) {
    var section = findFirstByNames(root, ["section:" + key, "section:" + slug + ":" + key]);
    if (section) {
      section.remove();
      return true;
    }
    var slot = findFirstByNames(root, ["slot:" + key, "slot:" + slug + ":" + key]);
    if (slot) {
      slot.remove();
      return true;
    }
    return false;
  }

  function getTemplateSlot(root, slug, key) {
    return findFirstByNames(root, ["slot:" + slug + ":" + key, "slot:" + key]);
  }

  function resolveBaseComponent(set) {
    if (!set) return null;
    if (set.type === "COMPONENT") return set;
    if (set.type !== "COMPONENT_SET") return null;
    for (var i = 0; i < set.children.length; i++) {
      if (set.children[i].type === "COMPONENT") return set.children[i];
    }
    return null;
  }

  function addInstancesRow(target, title, labels, createInstanceForLabel, showTitle, titleConfig) {
    var shouldShowTitle = showTitle !== false;
    var rowTitleFont = (titleConfig && titleConfig.font) ? titleConfig.font : titleFont;
    var rowTitleSize = (titleConfig && titleConfig.size) ? titleConfig.size : 18;
    var rowItemSpacing = (titleConfig && titleConfig.rowItemSpacing != null) ? titleConfig.rowItemSpacing : 12;
    var instancePaddingX = (titleConfig && titleConfig.instancePaddingX != null) ? Math.max(0, Number(titleConfig.instancePaddingX) || 0) : 0;
    var instancePaddingY = (titleConfig && titleConfig.instancePaddingY != null) ? Math.max(0, Number(titleConfig.instancePaddingY) || 0) : 0;
    var fillCellWidth = Boolean(titleConfig && titleConfig.fillCellWidth);
    var itemsPerRow = 0;
    if (titleConfig && titleConfig.itemsPerRow != null) {
      var ipr = Number(titleConfig.itemsPerRow);
      if (Number.isFinite(ipr) && ipr >= 1) itemsPerRow = Math.min(12, Math.floor(ipr));
    }

    function appendLabelCells(rowFrame, labelSlice) {
      for (var i = 0; i < labelSlice.length; i++) {
        var label = labelSlice[i];
        var cell = figma.createFrame();
        cell.layoutMode = "VERTICAL";
        cell.primaryAxisSizingMode = "AUTO";
        cell.counterAxisSizingMode = "AUTO";
        cell.counterAxisAlignItems = "CENTER";
        cell.itemSpacing = 6;
        cell.clipsContent = false;
        cell.fills = [];
        if (fillCellWidth) {
          try { cell.layoutAlign = "STRETCH"; } catch (_cellStretchErr) {}
          try { cell.layoutSizingHorizontal = "FILL"; } catch (_cellFillErr) {}
        }
        if (label != null && String(label).trim().length > 0) {
          var labelNode = appendText(cell, bodyFont, String(label), 10, DOC_COLORS.cellLabel, "Cell Label");
          try { labelNode.textAlignHorizontal = "CENTER"; } catch (_labelAlignErr) {}
        }
        var inst = null;
        try {
          inst = createInstanceForLabel(label);
        } catch (instErr) {
          progress("Docs instance creation failed (" + String(label) + "): " + String(instErr));
        }
        if (inst) {
          if (instancePaddingX > 0 || instancePaddingY > 0) {
            var instWrap = figma.createFrame();
            instWrap.layoutMode = "VERTICAL";
            instWrap.primaryAxisSizingMode = "AUTO";
            instWrap.counterAxisSizingMode = "AUTO";
            instWrap.primaryAxisAlignItems = "CENTER";
            instWrap.counterAxisAlignItems = "CENTER";
            instWrap.paddingLeft = instancePaddingX;
            instWrap.paddingRight = instancePaddingX;
            instWrap.paddingTop = instancePaddingY;
            instWrap.paddingBottom = instancePaddingY;
            instWrap.itemSpacing = 0;
            instWrap.fills = [];
            instWrap.strokes = [];
            instWrap.clipsContent = false;
            instWrap.appendChild(inst);
            cell.appendChild(instWrap);
          } else {
            cell.appendChild(inst);
          }
        }
        rowFrame.appendChild(cell);
      }
    }

    var rowWrap = figma.createFrame();
    rowWrap.layoutMode = "VERTICAL";
    rowWrap.primaryAxisSizingMode = "AUTO";
    rowWrap.counterAxisSizingMode = "AUTO";
    rowWrap.counterAxisAlignItems = "CENTER";
    rowWrap.layoutAlign = "STRETCH";
    rowWrap.itemSpacing = 8;
    rowWrap.clipsContent = false;
    rowWrap.fills = [];

    if (shouldShowTitle) {
      appendText(rowWrap, rowTitleFont, title, rowTitleSize, DOC_COLORS.panelHeading, "Row Title");
    }

    if (itemsPerRow > 0) {
      for (var start = 0; start < labels.length; start += itemsPerRow) {
        var slice = labels.slice(start, start + itemsPerRow);
        var rowChunk = figma.createFrame();
        rowChunk.layoutMode = "HORIZONTAL";
        rowChunk.primaryAxisSizingMode = "AUTO";
        rowChunk.counterAxisSizingMode = "AUTO";
        rowChunk.counterAxisAlignItems = "MIN";
        rowChunk.primaryAxisAlignItems = "CENTER";
        rowChunk.layoutAlign = "STRETCH";
        rowChunk.itemSpacing = rowItemSpacing;
        rowChunk.clipsContent = false;
        rowChunk.fills = [];
        appendLabelCells(rowChunk, slice);
        rowWrap.appendChild(rowChunk);
      }
    } else {
      var row = figma.createFrame();
      row.layoutMode = "HORIZONTAL";
      row.primaryAxisSizingMode = "AUTO";
      row.counterAxisSizingMode = "AUTO";
      row.counterAxisAlignItems = "MIN";
      row.primaryAxisAlignItems = "CENTER";
      row.layoutAlign = "STRETCH";
      row.itemSpacing = rowItemSpacing;
      row.clipsContent = false;
      row.fills = [];
      appendLabelCells(row, labels);
      rowWrap.appendChild(row);
    }

    target.appendChild(rowWrap);
  }

  function renderDividerDocsRows(target, labels, createInstanceForLabel) {
    clearChildren(target);
    target.layoutMode = "VERTICAL";
    target.primaryAxisSizingMode = "AUTO";
    target.counterAxisSizingMode = "AUTO";
    target.counterAxisAlignItems = "MIN";
    target.layoutAlign = "STRETCH";
    target.itemSpacing = 18;
    target.clipsContent = false;
    target.fills = target.fills || [];
    target.strokes = target.strokes || [];
    try { target.layoutSizingHorizontal = "FILL"; } catch (_dividerTargetFillErr) {}

    for (var i = 0; i < labels.length; i++) {
      var label = labels[i];
      var row = figma.createFrame();
      row.name = "divider-doc-row";
      row.layoutMode = "VERTICAL";
      row.primaryAxisSizingMode = "AUTO";
      row.counterAxisSizingMode = "AUTO";
      row.counterAxisAlignItems = "CENTER";
      row.layoutAlign = "STRETCH";
      row.itemSpacing = 8;
      row.fills = [];
      row.strokes = [];
      row.clipsContent = false;

      if (label != null && String(label).trim().length > 0) {
        var labelNode = appendText(row, bodyFont, String(label), 10, DOC_COLORS.cellLabel, "Cell Label");
        try { labelNode.textAlignHorizontal = "CENTER"; } catch (_dividerLabelAlignErr) {}
      }

      var inst = null;
      try {
        inst = createInstanceForLabel(label);
      } catch (_dividerInstanceErr) {
        inst = null;
      }
      if (inst) {
        var host = figma.createFrame();
        host.name = "divider-doc-host";
        host.layoutMode = "HORIZONTAL";
        host.primaryAxisSizingMode = "AUTO";
        host.counterAxisSizingMode = "AUTO";
        host.primaryAxisAlignItems = "CENTER";
        host.counterAxisAlignItems = "CENTER";
        host.layoutAlign = "STRETCH";
        host.paddingLeft = 0;
        host.paddingRight = 0;
        host.paddingTop = 14;
        host.paddingBottom = 14;
        host.itemSpacing = 0;
        host.fills = [];
        host.strokes = [];
        host.clipsContent = false;
        try { host.layoutSizingHorizontal = "FILL"; } catch (_dividerHostFillErr) {}
        host.appendChild(inst);
        row.appendChild(host);
      }

      target.appendChild(row);
    }
  }

  function renderListDocsRows(target, labels, createInstanceForLabel) {
    clearChildren(target);
    target.layoutMode = "VERTICAL";
    target.primaryAxisSizingMode = "AUTO";
    target.counterAxisSizingMode = "AUTO";
    target.counterAxisAlignItems = "CENTER";
    target.layoutAlign = "STRETCH";
    target.itemSpacing = 16;
    target.clipsContent = false;
    target.fills = target.fills || [];
    target.strokes = target.strokes || [];
    try { target.layoutSizingHorizontal = "FILL"; } catch (_listTargetFillErr) {}

    for (var i = 0; i < labels.length; i++) {
      var label = labels[i];
      var row = figma.createFrame();
      row.name = "list-doc-row";
      row.layoutMode = "VERTICAL";
      row.primaryAxisSizingMode = "AUTO";
      row.counterAxisSizingMode = "AUTO";
      row.counterAxisAlignItems = "CENTER";
      row.layoutAlign = "STRETCH";
      row.itemSpacing = 8;
      row.fills = [];
      row.strokes = [];
      row.clipsContent = false;

      if (label != null && String(label).trim().length > 0) {
        var labelNode = appendText(row, bodyFont, String(label), 10, DOC_COLORS.cellLabel, "Cell Label");
        try { labelNode.textAlignHorizontal = "CENTER"; } catch (_listLabelAlignErr) {}
      }

      var inst = null;
      try {
        inst = createInstanceForLabel(label);
      } catch (_listInstanceErr) {
        inst = null;
      }
      if (inst) {
        var host = figma.createFrame();
        host.name = "list-doc-host";
        host.layoutMode = "HORIZONTAL";
        host.primaryAxisSizingMode = "AUTO";
        host.counterAxisSizingMode = "AUTO";
        host.primaryAxisAlignItems = "CENTER";
        host.counterAxisAlignItems = "CENTER";
        host.layoutAlign = "STRETCH";
        host.paddingLeft = 0;
        host.paddingRight = 0;
        host.paddingTop = 0;
        host.paddingBottom = 0;
        host.itemSpacing = 0;
        host.fills = [];
        host.strokes = [];
        host.clipsContent = false;
        try { host.layoutSizingHorizontal = "FILL"; } catch (_listHostFillErr) {}
        host.appendChild(inst);
        row.appendChild(host);
      }

      target.appendChild(row);
    }
  }

  function getVariantDescription(componentName, variantName) {
    var comp = String(componentName || "").toLowerCase();
    var variant = String(variantName || "").toLowerCase();
    if (comp === "list") {
      if (variant === "unordered") return "Use for casual item lists with bullet markers or visual emphasis via icons.";
      if (variant === "ordered") return "Use when sequence matters and list item order should be communicated clearly.";
    }
    if (comp === "button") {
      if (variant === "filled") return "Serves as the primary button and CTA, representing the most important action to move forward in the flow.";
      if (variant === "outlined") return "Provides a medium level of emphasis, guiding user to take action on functions and features.";
      if (variant === "ghost" || variant === "transparent") return "Low-emphasis action used for tertiary interactions and secondary moments.";
    }
    if (comp === "badge") {
      if (variant === "filled") {
        return "Filled emphasis for labels and counts. Default, success, warning, and error colors set semantic tone.";
      }
      if (variant === "outline") {
        return "Outlined style for lighter emphasis. Default, success, warning, and error colors set semantic tone.";
      }
    }
    return "Use this variant when that level of visual emphasis is needed.";
  }

  var docsPage = null;
  for (var pi = 0; pi < figma.root.children.length; pi++) {
    if (figma.root.children[pi].type === "PAGE" && figma.root.children[pi].name === "Component Documentation") {
      docsPage = figma.root.children[pi];
      break;
    }
  }
  if (!docsPage) {
    docsPage = figma.createPage();
    docsPage.name = "Component Documentation";
  }

  try { await docsPage.loadAsync(); } catch (e) {}

  try {
    for (var ci = docsPage.children.length - 1; ci >= 0; ci--) {
      var childName = String(docsPage.children[ci].name || "");
      if (childName.indexOf("__AUTO_DOCS__") === 0) docsPage.children[ci].remove();
    }
  } catch (clearErr) {
    progress("Docs cleanup warning: " + String(clearErr));
  }

  var bodyFont = { family: titleFont.family, style: "Regular" };
  try {
    await figma.loadFontAsync(bodyFont);
  } catch (e) {
    bodyFont = titleFont;
  }
  var mediumFont = { family: titleFont.family, style: "Medium" };
  try {
    await figma.loadFontAsync(mediumFont);
  } catch (e) {
    mediumFont = titleFont;
  }

  var docsX = 0;
  var docsY = 0;
  var docsGap = 80;
  var docsCreated = 0;
  var docsSkipped = 0;

  var docsTemplate = null;
  try {
    for (var tp = 0; tp < figma.root.children.length; tp++) {
      var rootPage = figma.root.children[tp];
      if (!rootPage || rootPage.type !== "PAGE") continue;
      try { await rootPage.loadAsync(); } catch (e) {}
      if (typeof rootPage.findOne !== "function") continue;
      docsTemplate = rootPage.findOne(function (n) {
        return (
          String(n.name || "") === "__AUTO_DOCS_TEMPLATE__" &&
          n.type === "FRAME"
        );
      });
      if (docsTemplate) break;
    }
  } catch (templateErr) {
    progress("Docs template lookup warning: " + String(templateErr));
  }
  if (docsTemplate) {
    progress("Using docs template: __AUTO_DOCS_TEMPLATE__");
  }

  for (var si = 0; si < componentSets.length; si++) {
    var set = componentSets[si];
    if (!set) continue;
    try {

    var setName = set.name || ("Component " + (si + 1));
    var slug = normalizeName(setName);
    var lowerSetName = String(setName || "").toLowerCase();
    var normalizedSetName = normalizeComponentKey(setName);
    var stackSizeRows = lowerSetName === "title" || lowerSetName === "text" || lowerSetName === "modal";
    var variantProps = set.variantGroupProperties || {};
    var variants = getPropValues(variantProps, "Variant");
    var variantPropName = "Variant";
    if (lowerSetName === "modal" && variants.length === 0) {
      var modalLayouts = getPropValues(variantProps, "Layout");
      if (modalLayouts.length > 0) {
        variants = modalLayouts.slice();
        variantPropName = "Layout";
      }
    }
    if (variants.length === 0) {
      var typeVariants = getPropValues(variantProps, "Type");
      if (typeVariants.length > 0) {
        variants = typeVariants.slice();
        variantPropName = "Type";
      }
    }
    var states = getPropValues(variantProps, "State");
    var sizes = getPropValues(variantProps, "Size");
    var textWeights = getPropValues(variantProps, "Weight");
    var textColors = getPropValues(variantProps, "Color");
    var hasTextWeights = textWeights.length > 0;
    var hasTextColors = textColors.length > 0;
    var hasVariants = variants.length > 0;
    var hasSizes = sizes.length > 0;
    var hasStates = states.length > 0;
    var hasIcons = getPropValues(variantProps, "LeftIcon").length > 0 || getPropValues(variantProps, "RightIcon").length > 0;

    var useTemplateForSet =
      Boolean(docsTemplate) &&
      lowerSetName !== "text" &&
      lowerSetName !== "image" &&
      lowerSetName !== "popover";
    if (useTemplateForSet) {
      var templatedDoc = docsTemplate.clone();
      templatedDoc.name = "__AUTO_DOCS__ - " + setName;
      templatedDoc.clipsContent = false;
      clearExplicitModesInSubtree(templatedDoc);
      // Match programmatic docs (see non-template doc frame): left-align intro and section
      // headers on the cross axis; preview panels (e.g. createPanel slots) keep inner CENTER.
      try {
        if (templatedDoc.layoutMode === "VERTICAL") {
          templatedDoc.counterAxisAlignItems = "MIN";
        }
      } catch (_docRootAlignErr) {}

      await setNamedText(templatedDoc, "Component Title", setName);
      await setNamedText(
        templatedDoc,
        "Component Subtitle",
        "Guidelines for implementing " + setName.toLowerCase() + " consistently across the platform."
      );

      var templateVariantsSlot = getTemplateSlot(templatedDoc, slug, "variants");
      var templateSizeSlot = getTemplateSlot(templatedDoc, slug, "size");
      var templateStatesSlot = getTemplateSlot(templatedDoc, slug, "states");
      var templateLeftSlot = getTemplateSlot(templatedDoc, slug, "icons-left");
      var templateRightSlot = getTemplateSlot(templatedDoc, slug, "icons-right");
      var templateBothSlot = getTemplateSlot(templatedDoc, slug, "icons-both");
      var templateListIconsSlot = getTemplateSlot(templatedDoc, slug, "icons");
      var templateOverflowDefaultSlot = null;
      var templateOverflowOutlinedSlot = null;
      if (hasIcons && !templateBothSlot) {
        var templateBothIconsBlock = createStack("icons-both-block", 8);
        appendText(templateBothIconsBlock, titleFont, "Both Icons", 18, DOC_COLORS.panelHeading, "Both Icons Heading", "title");
        templateBothSlot = createPanel("slot:" + slug + ":icons-both", 10);
        templateBothSlot.resize(1192, templateBothSlot.height);
        templateBothIconsBlock.appendChild(templateBothSlot);
        var insertedAfterRight = false;
        if (templateRightSlot && templateRightSlot.parent && templateRightSlot.parent.parent === templatedDoc) {
          var templateRightBlock = templateRightSlot.parent;
          var rightIndex = templatedDoc.children.indexOf(templateRightBlock);
          if (rightIndex >= 0) {
            templatedDoc.insertChild(rightIndex + 1, templateBothIconsBlock);
            insertedAfterRight = true;
          }
        }
        if (!insertedAfterRight) templatedDoc.appendChild(templateBothIconsBlock);
      }
      if (lowerSetName === "tabs") {
        templatedDoc.appendChild(createSectionHeader("Overflow Controls", "Arrow and menu controls used for overflow tabs.", DOC_COLORS.subtitle));
        var templateOverflowDefaultBlock = createStack("overflow-default-block", 8);
        appendText(templateOverflowDefaultBlock, titleFont, "Default", 18, DOC_COLORS.panelHeading, "Overflow Default Heading", "title");
        templateOverflowDefaultSlot = createPanel("slot:" + slug + ":overflow-default", 10);
        templateOverflowDefaultSlot.resize(1192, templateOverflowDefaultSlot.height);
        templateOverflowDefaultBlock.appendChild(templateOverflowDefaultSlot);
        templatedDoc.appendChild(templateOverflowDefaultBlock);

        var templateOverflowOutlinedBlock = createStack("overflow-outlined-block", 8);
        appendText(templateOverflowOutlinedBlock, titleFont, "Outlined", 18, DOC_COLORS.panelHeading, "Overflow Outlined Heading", "title");
        templateOverflowOutlinedSlot = createPanel("slot:" + slug + ":overflow-outlined", 10);
        templateOverflowOutlinedSlot.resize(1192, templateOverflowOutlinedSlot.height);
        templateOverflowOutlinedBlock.appendChild(templateOverflowOutlinedSlot);
        templatedDoc.appendChild(templateOverflowOutlinedBlock);
      }

      var templateVariantKey = getPropKey(variantProps, variantPropName);
      var templateStateKey = getPropKey(variantProps, "State");
      var templateSizeKey = getPropKey(variantProps, "Size");
      var templateRadiusKey = getPropKey(variantProps, "Radius");
      var templateSectionKey = getPropKey(variantProps, "Section");
      var templateCheckedKey = getPropKey(variantProps, "Checked");
      var templateLeftIconKey = getPropKey(variantProps, "LeftIcon");
      var templateRightIconKey = getPropKey(variantProps, "RightIcon");
      var templateLeftArrowKey = getPropKey(variantProps, "LeftArrow");
      var templateRightArrowKey = getPropKey(variantProps, "RightArrow");
      var templateMenuKey = getPropKey(variantProps, "Menu");
      var templateIconModeKey = getPropKey(variantProps, "Icon");
      if (lowerSetName === "list" && templateIconModeKey && !templateListIconsSlot) {
        templatedDoc.appendChild(createSectionHeader("With Icons", "Preview list content with and without icon markers.", DOC_COLORS.subtitle));
        var templateListIconsBlock = createStack("list-icons-block", 8);
        appendText(templateListIconsBlock, titleFont, "With Icons", 18, DOC_COLORS.panelHeading, "List Icons Heading", "title");
        templateListIconsSlot = createPanel("slot:" + slug + ":icons", 10);
        templateListIconsSlot.resize(1192, templateListIconsSlot.height);
        templateListIconsBlock.appendChild(templateListIconsSlot);
        templatedDoc.appendChild(templateListIconsBlock);
      }

      var templateVariantOrder = ["Filled", "Outlined", "Outline", "Ghost", "Default", "Light", "Transparent", "Pills", "Oval", "Bars", "Dots"];
      var templateVariantLimit = lowerSetName === "tablebody"
        ? Math.max(6, variants.length)
        : (lowerSetName === "badge" ? 4 : (lowerSetName === "card" ? 5 : 3));
      var templateOrderedVariants = pickOrdered(variants, templateVariantOrder).slice(0, templateVariantLimit);
      var templateOrderedStates = pickOrdered(states, ["Default", "Hover", "Focus", "Pressed", "Active", "Disabled"]).slice(0, 5);
      var templateOrderedSizesAll = pickOrdered(sizes, ["Default", "Label", "Caption", "XXS", "XS", "SM", "MD", "LG", "XL"]).slice(0, 8);
      var templateOrderedTextWeights = pickOrdered(textWeights, ["Regular", "Medium", "Semibold", "Bold"]).slice(0, 6);
      var templateOrderedTextColors = pickOrdered(textColors, [
        "Default",
        "Dimmed",
        "Brand",
        "Success",
        "Warning",
        "Error",
      ]).slice(0, 8);
      var templateRadii = getPropValues(variantProps, "Radius");
      var templateOrderedRadiiAll = pickOrdered(templateRadii, ["Default", "XXS", "XS", "SM", "MD", "LG", "XL"]).slice(0, 6);
      var templateOrderedSizes = templateOrderedSizesAll.slice();
      if (templateOrderedSizes.length > 1 && lowerSetName !== "badge") {
        templateOrderedSizes = templateOrderedSizes.filter(function (s) { return String(s).toLowerCase() !== "default"; });
      }
      if (lowerSetName === "badge" && templateOrderedSizes.length > 1) {
        var templateDefaultSizeIdx = -1;
        var templateMdSizeIdx = -1;
        for (var tsi = 0; tsi < templateOrderedSizes.length; tsi++) {
          var templateSizeName = String(templateOrderedSizes[tsi] || "").toLowerCase();
          if (templateSizeName === "default") templateDefaultSizeIdx = tsi;
          if (templateSizeName === "md") templateMdSizeIdx = tsi;
        }
        if (templateDefaultSizeIdx >= 0 && templateMdSizeIdx >= 0 && templateDefaultSizeIdx !== templateMdSizeIdx + 1) {
          var templateDefaultSizeValue = templateOrderedSizes[templateDefaultSizeIdx];
          templateOrderedSizes.splice(templateDefaultSizeIdx, 1);
          if (templateDefaultSizeIdx < templateMdSizeIdx) templateMdSizeIdx -= 1;
          templateOrderedSizes.splice(templateMdSizeIdx + 1, 0, templateDefaultSizeValue);
        }
      }

      var templateDefaultVariant = templateOrderedVariants.length > 0 ? templateOrderedVariants[0] : null;
      if (lowerSetName === "card" && templateOrderedVariants.length > 0) {
        for (var tdvi = 0; tdvi < templateOrderedVariants.length; tdvi++) {
          if (String(templateOrderedVariants[tdvi]).toLowerCase() === "default") {
            templateDefaultVariant = templateOrderedVariants[tdvi];
            break;
          }
        }
      }
      var templateDefaultState = templateOrderedStates.length > 0 ? templateOrderedStates[0] : null;
      var templateDefaultSize = pickDefaultSizeValue(templateOrderedSizesAll);
      var templateDefaultRadius = pickDefaultSizeValue(templateOrderedRadiiAll);

      var templateColorKey = getPropKey(variantProps, "Color");
      var templateColorValues = templateColorKey ? getPropValues(variantProps, "Color") : [];
      var templateDefaultColor = null;
      var templatePrimaryColor = null;
      var templateErrorColor = null;
      if (templateColorValues.length > 0) {
        for (var tci = 0; tci < templateColorValues.length; tci++) {
          var lowerTemplateColor = String(templateColorValues[tci]).toLowerCase();
          if (lowerTemplateColor === "default") {
            templateDefaultColor = templateColorValues[tci];
          }
          if (lowerTemplateColor === "primary") {
            templatePrimaryColor = templateColorValues[tci];
          }
          if (lowerTemplateColor === "error") {
            templateErrorColor = templateColorValues[tci];
          }
        }
        if (templateDefaultColor == null) templateDefaultColor = templateColorValues[0];
        if (templatePrimaryColor == null) templatePrimaryColor = templateDefaultColor;
      }

      var templateBadgeSemanticColors = (lowerSetName === "badge" && templateColorKey && templateColorValues.length > 0)
        ? pickOrdered(templateColorValues, ["Default", "Success", "Warning", "Error"])
        : [];

      var templateLeftValues = templateLeftIconKey ? getPropValues(variantProps, templateLeftIconKey) : [];
      var templateRightValues = templateRightIconKey ? getPropValues(variantProps, templateRightIconKey) : [];
      var templateLeftArrowValues = templateLeftArrowKey ? getPropValues(variantProps, templateLeftArrowKey) : [];
      var templateRightArrowValues = templateRightArrowKey ? getPropValues(variantProps, templateRightArrowKey) : [];
      var templateMenuValues = templateMenuKey ? getPropValues(variantProps, templateMenuKey) : [];
      var templateIconModeValues = templateIconModeKey ? getPropValues(variantProps, templateIconModeKey) : [];
      var templateSectionValues = templateSectionKey ? getPropValues(variantProps, templateSectionKey) : [];
      var templateCheckedValues = templateCheckedKey ? getPropValues(variantProps, templateCheckedKey) : [];
      var templateLeftOn = templateLeftValues.indexOf("On") >= 0 ? "On" : (templateLeftValues.indexOf("True") >= 0 ? "True" : (templateLeftValues[0] || null));
      var templateLeftOff = templateLeftValues.indexOf("Off") >= 0 ? "Off" : (templateLeftValues.indexOf("False") >= 0 ? "False" : (templateLeftValues[0] || null));
      var templateRightOn = templateRightValues.indexOf("On") >= 0 ? "On" : (templateRightValues.indexOf("True") >= 0 ? "True" : (templateRightValues[0] || null));
      var templateRightOff = templateRightValues.indexOf("Off") >= 0 ? "Off" : (templateRightValues.indexOf("False") >= 0 ? "False" : (templateRightValues[0] || null));
      var templateLeftArrowOn = templateLeftArrowValues.indexOf("On") >= 0 ? "On" : (templateLeftArrowValues.indexOf("True") >= 0 ? "True" : (templateLeftArrowValues[0] || null));
      var templateLeftArrowOff = templateLeftArrowValues.indexOf("Off") >= 0 ? "Off" : (templateLeftArrowValues.indexOf("False") >= 0 ? "False" : (templateLeftArrowValues[0] || null));
      var templateRightArrowOn = templateRightArrowValues.indexOf("On") >= 0 ? "On" : (templateRightArrowValues.indexOf("True") >= 0 ? "True" : (templateRightArrowValues[0] || null));
      var templateRightArrowOff = templateRightArrowValues.indexOf("Off") >= 0 ? "Off" : (templateRightArrowValues.indexOf("False") >= 0 ? "False" : (templateRightArrowValues[0] || null));
      var templateMenuOn = templateMenuValues.indexOf("On") >= 0 ? "On" : (templateMenuValues.indexOf("True") >= 0 ? "True" : (templateMenuValues[0] || null));
      var templateMenuOff = templateMenuValues.indexOf("Off") >= 0 ? "Off" : (templateMenuValues.indexOf("False") >= 0 ? "False" : (templateMenuValues[0] || null));
      var templateIconModeOn = templateIconModeValues.indexOf("On") >= 0
        ? "On"
        : (templateIconModeValues.indexOf("True") >= 0 ? "True" : (templateIconModeValues[0] || null));
      var templateIconModeOff = templateIconModeValues.indexOf("Off") >= 0
        ? "Off"
        : (templateIconModeValues.indexOf("False") >= 0 ? "False" : (templateIconModeValues[0] || null));
      var templateSectionOff = templateSectionValues.indexOf("Off") >= 0
        ? "Off"
        : (templateSectionValues.indexOf("False") >= 0 ? "False" : (templateSectionValues[0] || null));
      var templateCheckedOn = templateCheckedValues.indexOf("On") >= 0
        ? "On"
        : (templateCheckedValues.indexOf("True") >= 0
            ? "True"
            : (templateCheckedValues.indexOf("Checked") >= 0 ? "Checked" : (templateCheckedValues[0] || null)));
      var templateCheckedOff = templateCheckedValues.indexOf("Off") >= 0
        ? "Off"
        : (templateCheckedValues.indexOf("False") >= 0
            ? "False"
            : (templateCheckedValues.indexOf("Unchecked") >= 0 ? "Unchecked" : (templateCheckedValues[0] || null)));
      var templateCheckedUnchecked = templateCheckedValues.indexOf("Unchecked") >= 0
        ? "Unchecked"
        : templateCheckedOff;
      var templateCheckedOnValue = templateCheckedValues.indexOf("Checked") >= 0
        ? "Checked"
        : templateCheckedOn;
      var templateCheckedIndeterminate = templateCheckedValues.indexOf("Indeterminate") >= 0
        ? "Indeterminate"
        : null;

      var templateBaseComponent = resolveBaseComponent(set);
      if (templateBaseComponent) {
        function makeTemplateInstance(propPatch) {
          var inst = templateBaseComponent.createInstance();
          var props = {};
          if (templateVariantKey && templateDefaultVariant != null) props[templateVariantKey] = templateDefaultVariant;
          if (templateStateKey && templateDefaultState != null) props[templateStateKey] = templateDefaultState;
          if (templateSizeKey && templateDefaultSize != null) props[templateSizeKey] = templateDefaultSize;
          if (templateRadiusKey && templateDefaultRadius != null) props[templateRadiusKey] = templateDefaultRadius;
          if (templateColorKey && templateDefaultColor != null) props[templateColorKey] = templateDefaultColor;
          if (lowerSetName === "card" && templateSectionKey && templateSectionOff != null) props[templateSectionKey] = templateSectionOff;
          if (templateCheckedKey && templateCheckedOff != null) props[templateCheckedKey] = templateCheckedOff;
          if (templateLeftIconKey && templateLeftOff != null) props[templateLeftIconKey] = templateLeftOff;
          if (templateRightIconKey && templateRightOff != null) props[templateRightIconKey] = templateRightOff;
          if (templateLeftArrowKey && templateLeftArrowOff != null) props[templateLeftArrowKey] = templateLeftArrowOff;
          if (templateRightArrowKey && templateRightArrowOff != null) props[templateRightArrowKey] = templateRightArrowOff;
          if (templateMenuKey && templateMenuOff != null) props[templateMenuKey] = templateMenuOff;
          if (lowerSetName === "list" && templateIconModeKey && templateIconModeOff != null) {
            props[templateIconModeKey] = templateIconModeOff;
          }
          var patchKeys = Object.keys(propPatch || {});
          for (var p = 0; p < patchKeys.length; p++) {
            var userKey = patchKeys[p];
            var resolvedKey = getPropKey(variantProps, userKey);
            if (resolvedKey) props[resolvedKey] = propPatch[userKey];
          }
          try { inst.setProperties(props); } catch (e) {}
          clearExplicitModesInSubtree(inst);
          return inst;
        }

        if (templateSizeKey && templateOrderedSizes.length > 1) {
          templateOrderedSizes = reorderSizesByDefaultVisualMatch(templateOrderedSizes, function (sizeName) {
            return makeTemplateInstance({ Size: sizeName });
          });
        }

        if (hasVariants && templateVariantsSlot && templateOrderedVariants.length > 0) {
          clearChildren(templateVariantsSlot);
          if (templateVariantsSlot.layoutMode === "VERTICAL") {
            templateVariantsSlot.itemSpacing = 16;
          }
          var templateVariantStateValues = templateOrderedStates.length > 0 ? templateOrderedStates : [null];
          for (var tv = 0; tv < templateOrderedVariants.length; tv++) {
            var templateVariantName = templateOrderedVariants[tv];

            if (lowerSetName === "button" && templateColorKey && templatePrimaryColor) {
              (function (vName, stateValues) {
                function appendButtonColorVariantBlock(colorLabel, colorValue) {
                  var colorVariantBlock = createStack(
                    "variant-block-" + normalizeName(vName) + "-" + normalizeName(colorLabel),
                    8
                  );
                  var colorVariantHeader = createStack(
                    "variant-header-" + normalizeName(vName) + "-" + normalizeName(colorLabel),
                    6
                  );
                  appendText(
                    colorVariantHeader,
                    titleFont,
                    String(vName) + " - " + String(colorLabel),
                    18,
                    DOC_COLORS.panelHeading,
                    "Variant Heading",
                    "title"
                  );
                  appendText(
                    colorVariantHeader,
                    bodyFont,
                    getVariantDescription(setName, vName),
                    12,
                    DOC_COLORS.panelBody,
                    "Variant Description"
                  );
                  colorVariantBlock.appendChild(colorVariantHeader);

                  var colorVariantSection = createPanel(
                    "variant-section-" + normalizeName(vName) + "-" + normalizeName(colorLabel),
                    10
                  );
                  colorVariantSection.counterAxisSizingMode = "FIXED";
                  colorVariantSection.resize(1192, colorVariantSection.height);

                  var colorVariantStatesPanel = createStack(
                    "variant-states-" + normalizeName(vName) + "-" + normalizeName(colorLabel),
                    10
                  );
                  colorVariantStatesPanel.paddingLeft = 12;
                  colorVariantStatesPanel.paddingRight = 12;
                  colorVariantStatesPanel.paddingTop = 12;
                  colorVariantStatesPanel.paddingBottom = 12;
                  addInstancesRow(
                    colorVariantStatesPanel,
                    "States",
                    stateValues,
                    function (stateName) {
                      var patch = {};
                      patch[variantPropName] = vName;
                      patch.Color = colorValue;
                      if (stateName != null) patch.State = stateName;
                      return makeTemplateInstance(patch);
                    },
                    false
                  );
                  colorVariantSection.appendChild(colorVariantStatesPanel);
                  colorVariantBlock.appendChild(colorVariantSection);
                  templateVariantsSlot.appendChild(colorVariantBlock);
                }

                appendButtonColorVariantBlock("Primary", templatePrimaryColor);
                if (templateErrorColor) {
                  appendButtonColorVariantBlock("Danger", templateErrorColor);
                }
              })(templateVariantName, templateVariantStateValues);
              continue;
            }

            var templateVariantBlock = createStack("variant-block-" + normalizeName(templateVariantName), 8);
            var templateVariantHeader = createStack("variant-header-" + normalizeName(templateVariantName), 6);
            appendText(templateVariantHeader, titleFont, String(templateVariantName), 18, DOC_COLORS.panelHeading, "Variant Heading", "title");
            appendText(templateVariantHeader, bodyFont, getVariantDescription(setName, templateVariantName), 12, DOC_COLORS.panelBody, "Variant Description");
            templateVariantBlock.appendChild(templateVariantHeader);

            var templateVariantSection = createPanel("variant-section-" + normalizeName(templateVariantName), 10);
            templateVariantSection.counterAxisSizingMode = "FIXED";
            templateVariantSection.resize(1192, templateVariantSection.height);

            var templateBadgeColorStrip =
              lowerSetName === "badge" &&
              templateColorKey &&
              templateBadgeSemanticColors.length > 0 &&
              badgeDocVariantIsFilledOrOutline(templateVariantName);

            if (templateBadgeColorStrip) {
              var templateVariantColorsPanel = createStack("variant-colors-" + normalizeName(templateVariantName), 10);
              templateVariantColorsPanel.paddingLeft = 12;
              templateVariantColorsPanel.paddingRight = 12;
              templateVariantColorsPanel.paddingTop = 12;
              templateVariantColorsPanel.paddingBottom = 12;
              addInstancesRow(
                templateVariantColorsPanel,
                "Color",
                templateBadgeSemanticColors,
                (function (vName) {
                  return function (colorName) {
                    var variantColorPatch = {};
                    variantColorPatch[variantPropName] = vName;
                    variantColorPatch.Color = colorName;
                    return makeTemplateInstance(variantColorPatch);
                  };
                })(templateVariantName),
                false
              );
              templateVariantSection.appendChild(templateVariantColorsPanel);
            } else {
              var templateVariantStatesPanel = createStack("variant-states-" + normalizeName(templateVariantName), 10);
              templateVariantStatesPanel.paddingLeft = 12;
              templateVariantStatesPanel.paddingRight = 12;
              templateVariantStatesPanel.paddingTop = 12;
              templateVariantStatesPanel.paddingBottom = 12;
              if (lowerSetName === "button" && templateColorKey && templatePrimaryColor) {
                addInstancesRow(
                  templateVariantStatesPanel,
                  "Primary",
                  templateVariantStateValues,
                  (function (vName, cName) {
                    return function (stateName) {
                      var patch = {};
                      patch[variantPropName] = vName;
                      patch.Color = cName;
                      if (stateName != null) patch.State = stateName;
                      return makeTemplateInstance(patch);
                    };
                  })(templateVariantName, templatePrimaryColor),
                  false
                );
                if (templateErrorColor) {
                  addInstancesRow(
                    templateVariantStatesPanel,
                    "Error",
                    templateVariantStateValues,
                    (function (vName, cName) {
                      return function (stateName) {
                        var patch = {};
                        patch[variantPropName] = vName;
                        patch.Color = cName;
                        if (stateName != null) patch.State = stateName;
                        return makeTemplateInstance(patch);
                      };
                    })(templateVariantName, templateErrorColor),
                    false
                  );
                }
              } else {
                addInstancesRow(
                  templateVariantStatesPanel,
                  "States",
                  templateVariantStateValues,
                  (function (vName) {
                    return function (stateName) {
                      var patch = {};
                      patch[variantPropName] = vName;
                      if (stateName != null) patch.State = stateName;
                      if ((lowerSetName === "checkbox" || lowerSetName === "radio") && templateCheckedOnValue != null) {
                        patch.Checked = templateCheckedOnValue;
                      }
                      return makeTemplateInstance(patch);
                    };
                  })(templateVariantName),
                  false,
                  lowerSetName === "card"
                    ? { itemsPerRow: 3 }
                    : (lowerSetName === "tabs"
                        ? { itemsPerRow: 2, rowItemSpacing: 20 }
                        : (lowerSetName === "list"
                            ? { itemsPerRow: 1, rowItemSpacing: 12 }
                            : (normalizedSetName === "accordionitem"
                                ? { itemsPerRow: 1, rowItemSpacing: 12 }
                                : null)))
                );
              }
              templateVariantSection.appendChild(templateVariantStatesPanel);
            }

            templateVariantBlock.appendChild(templateVariantSection);
            templateVariantsSlot.appendChild(templateVariantBlock);
          }
        } else if (!hasVariants) {
          removeSectionOrSlot(templatedDoc, slug, "variants");
        }

        if (hasSizes && templateSizeSlot && templateOrderedSizes.length > 0) {
          clearChildren(templateSizeSlot);
          if (stackSizeRows && templateSizeSlot.layoutMode === "VERTICAL") {
            templateSizeSlot.counterAxisAlignItems = "CENTER";
          }
          if (lowerSetName === "switch") {
            templateSizeSlot.fills = [];
            templateSizeSlot.strokes = [];
            templateSizeSlot.strokeWeight = 0;
            templateSizeSlot.paddingLeft = 0;
            templateSizeSlot.paddingRight = 0;
            templateSizeSlot.paddingTop = 0;
            templateSizeSlot.paddingBottom = 0;
            templateSizeSlot.cornerRadius = 0;
            templateSizeSlot.itemSpacing = 12;
            templateSizeSlot.counterAxisAlignItems = "MIN";
          }
          if (stackSizeRows) {
            if (lowerSetName === "modal" && templateOrderedSizes.length === 5) {
              addInstancesRow(
                templateSizeSlot,
                "Sizes",
                templateOrderedSizes,
                function (sizeName) {
                  return makeTemplateInstance({ Size: sizeName });
                },
                false,
                { itemsPerRow: 3 }
              );
            } else if (lowerSetName === "image" && templateOrderedSizes.length === 5) {
              addInstancesRow(
                templateSizeSlot,
                "Sizes",
                templateOrderedSizes,
                function (sizeName) {
                  return makeTemplateInstance({ Size: sizeName });
                },
                false,
                { itemsPerRow: 4 }
              );
            } else {
              for (var tsi = 0; tsi < templateOrderedSizes.length; tsi++) {
                (function (sizeName) {
                  addInstancesRow(templateSizeSlot, "Sizes", [sizeName], function (innerSizeName) {
                    return makeTemplateInstance({ Size: innerSizeName });
                  }, false);
                })(templateOrderedSizes[tsi]);
              }
            }
          } else if ((lowerSetName === "slider" || lowerSetName === "rangeslider") && templateOrderedSizes.length > 3) {
            var templateSliderFirstRow = templateOrderedSizes.slice(0, 3);
            var templateSliderSecondRow = templateOrderedSizes.slice(3);
            addInstancesRow(templateSizeSlot, "Sizes", templateSliderFirstRow, function (sizeName) {
              return makeTemplateInstance({ Size: sizeName });
            }, false);
            if (templateSliderSecondRow.length > 0) {
              addInstancesRow(templateSizeSlot, "Sizes", templateSliderSecondRow, function (sizeName) {
                return makeTemplateInstance({ Size: sizeName });
              }, false);
            }
          } else if (lowerSetName === "card" && templateOrderedSizes.length > 3) {
            var templateCardFirstRow = templateOrderedSizes.slice(0, 3);
            var templateCardSecondRow = templateOrderedSizes.slice(3);
            addInstancesRow(templateSizeSlot, "Sizes", templateCardFirstRow, function (sizeName) {
              return makeTemplateInstance({ Size: sizeName });
            }, false);
            if (templateCardSecondRow.length > 0) {
              addInstancesRow(templateSizeSlot, "Sizes", templateCardSecondRow, function (sizeName) {
                return makeTemplateInstance({ Size: sizeName });
              }, false);
            }
          } else if (lowerSetName === "image" && templateOrderedSizes.length === 5) {
            addInstancesRow(
              templateSizeSlot,
              "Sizes",
              templateOrderedSizes,
              function (sizeName) {
                return makeTemplateInstance({ Size: sizeName });
              },
              false,
              { itemsPerRow: 4 }
            );
          } else if ((lowerSetName === "checkbox" || lowerSetName === "radio") && templateCheckedKey && templateCheckedOnValue != null) {
            addInstancesRow(templateSizeSlot, "Sizes", templateOrderedSizes, function (sizeName) {
              return makeTemplateInstance({ Size: sizeName, Checked: templateCheckedOnValue });
            }, false);
          } else if (lowerSetName === "switch" && templateCheckedKey && templateCheckedOn != null) {
            var templateSwitchSizeOffPanel = createPanel("switch-size-checked-off-panel", 10);
            templateSwitchSizeOffPanel.resize(1192, templateSwitchSizeOffPanel.height);
            templateSizeSlot.appendChild(templateSwitchSizeOffPanel);
            addInstancesRow(templateSwitchSizeOffPanel, "Checked Off", templateOrderedSizes, function (sizeName) {
              return makeTemplateInstance({ Size: sizeName, Checked: templateCheckedOff });
            }, true, { font: mediumFont, size: 14 });
            var templateSwitchSizeOnPanel = createPanel("switch-size-checked-on-panel", 10);
            templateSwitchSizeOnPanel.resize(1192, templateSwitchSizeOnPanel.height);
            templateSizeSlot.appendChild(templateSwitchSizeOnPanel);
            addInstancesRow(templateSwitchSizeOnPanel, "Checked On", templateOrderedSizes, function (sizeName) {
              return makeTemplateInstance({ Size: sizeName, Checked: templateCheckedOn });
            }, true, { font: mediumFont, size: 14 });
          } else if (lowerSetName === "divider") {
            renderDividerDocsRows(templateSizeSlot, templateOrderedSizes, function (sizeName) {
              return makeTemplateInstance({ Size: sizeName });
            });
          } else if (lowerSetName === "list") {
            renderListDocsRows(templateSizeSlot, templateOrderedSizes, function (sizeName) {
              return makeTemplateInstance({ Size: sizeName });
            });
          } else {
            addInstancesRow(templateSizeSlot, "Sizes", templateOrderedSizes, function (sizeName) {
              return makeTemplateInstance({ Size: sizeName });
            }, false, lowerSetName === "divider" ? { itemsPerRow: 3, rowItemSpacing: 56, instancePaddingX: 22, instancePaddingY: 10 } : null);
          }
        } else if (!hasSizes) {
          removeSectionOrSlot(templatedDoc, slug, "size");
        }

        if (hasStates && templateStatesSlot && templateOrderedStates.length > 0) {
          clearChildren(templateStatesSlot);
          if (lowerSetName === "switch" || lowerSetName === "checkbox" || lowerSetName === "radio") {
            templateStatesSlot.fills = [];
            templateStatesSlot.strokes = [];
            templateStatesSlot.strokeWeight = 0;
            templateStatesSlot.paddingLeft = 0;
            templateStatesSlot.paddingRight = 0;
            templateStatesSlot.paddingTop = 0;
            templateStatesSlot.paddingBottom = 0;
            templateStatesSlot.cornerRadius = 0;
            templateStatesSlot.itemSpacing = 12;
            templateStatesSlot.counterAxisAlignItems = "MIN";
          }
          if (lowerSetName === "switch" && templateCheckedKey && templateCheckedOn != null) {
            var templateSwitchStatesOffPanel = createPanel("switch-states-checked-off-panel", 10);
            templateSwitchStatesOffPanel.resize(1192, templateSwitchStatesOffPanel.height);
            templateStatesSlot.appendChild(templateSwitchStatesOffPanel);
            addInstancesRow(templateSwitchStatesOffPanel, "Checked Off", templateOrderedStates, function (stateName) {
              return makeTemplateInstance({ State: stateName, Checked: templateCheckedOff });
            }, true, { font: mediumFont, size: 14 });
            var templateSwitchStatesOnPanel = createPanel("switch-states-checked-on-panel", 10);
            templateSwitchStatesOnPanel.resize(1192, templateSwitchStatesOnPanel.height);
            templateStatesSlot.appendChild(templateSwitchStatesOnPanel);
            addInstancesRow(templateSwitchStatesOnPanel, "Checked On", templateOrderedStates, function (stateName) {
              return makeTemplateInstance({ State: stateName, Checked: templateCheckedOn });
            }, true, { font: mediumFont, size: 14 });
          } else if (lowerSetName === "checkbox" && templateCheckedKey && templateCheckedUnchecked != null) {
            var templateCheckboxVariants = (templateVariantKey && templateOrderedVariants.length > 0)
              ? templateOrderedVariants.slice(0, 2)
              : [null];
            for (var tcvi = 0; tcvi < templateCheckboxVariants.length; tcvi++) {
              (function (templateCheckboxVariantName) {
                var templateVariantPatch = {};
                if (templateCheckboxVariantName) templateVariantPatch.Variant = templateCheckboxVariantName;
                var templateVariantStatesBlock = createStack("checkbox-states-block-" + normalizeName(templateCheckboxVariantName || "default"), 8);
                if (templateCheckboxVariantName) {
                  var templateVariantStatesHeader = createStack("checkbox-states-header-" + normalizeName(templateCheckboxVariantName), 6);
                  appendText(templateVariantStatesHeader, titleFont, String(templateCheckboxVariantName), 18, DOC_COLORS.panelHeading, "Checkbox States Variant Heading", "title");
                  templateVariantStatesBlock.appendChild(templateVariantStatesHeader);
                }

                var templateCheckboxStatesUncheckedPanel = createPanel("checkbox-states-" + normalizeName((templateCheckboxVariantName || "default") + "-unchecked") + "-panel", 10);
                templateCheckboxStatesUncheckedPanel.resize(1192, templateCheckboxStatesUncheckedPanel.height);
                templateVariantStatesBlock.appendChild(templateCheckboxStatesUncheckedPanel);
                addInstancesRow(templateCheckboxStatesUncheckedPanel, "Unchecked", templateOrderedStates, function (stateName) {
                  var patch = { State: stateName, Checked: templateCheckedUnchecked };
                  var patchKeys = Object.keys(templateVariantPatch);
                  for (var pui = 0; pui < patchKeys.length; pui++) patch[patchKeys[pui]] = templateVariantPatch[patchKeys[pui]];
                  return makeTemplateInstance(patch);
                }, true, { font: mediumFont, size: 14 });

                if (templateCheckedOnValue != null) {
                  var templateCheckboxStatesCheckedPanel = createPanel("checkbox-states-" + normalizeName((templateCheckboxVariantName || "default") + "-checked") + "-panel", 10);
                  templateCheckboxStatesCheckedPanel.resize(1192, templateCheckboxStatesCheckedPanel.height);
                  templateVariantStatesBlock.appendChild(templateCheckboxStatesCheckedPanel);
                  addInstancesRow(templateCheckboxStatesCheckedPanel, "Checked", templateOrderedStates, function (stateName) {
                    var patch = { State: stateName, Checked: templateCheckedOnValue };
                    var patchKeys = Object.keys(templateVariantPatch);
                    for (var pui = 0; pui < patchKeys.length; pui++) patch[patchKeys[pui]] = templateVariantPatch[patchKeys[pui]];
                    return makeTemplateInstance(patch);
                  }, true, { font: mediumFont, size: 14 });
                }

                if (templateCheckedIndeterminate != null) {
                  var templateCheckboxStatesIndeterminatePanel = createPanel("checkbox-states-" + normalizeName((templateCheckboxVariantName || "default") + "-indeterminate") + "-panel", 10);
                  templateCheckboxStatesIndeterminatePanel.resize(1192, templateCheckboxStatesIndeterminatePanel.height);
                  templateVariantStatesBlock.appendChild(templateCheckboxStatesIndeterminatePanel);
                  addInstancesRow(templateCheckboxStatesIndeterminatePanel, "Indeterminate", templateOrderedStates, function (stateName) {
                    var patch = { State: stateName, Checked: templateCheckedIndeterminate };
                    var patchKeys = Object.keys(templateVariantPatch);
                    for (var pui = 0; pui < patchKeys.length; pui++) patch[patchKeys[pui]] = templateVariantPatch[patchKeys[pui]];
                    return makeTemplateInstance(patch);
                  }, true, { font: mediumFont, size: 14 });
                }
                templateStatesSlot.appendChild(templateVariantStatesBlock);
              })(templateCheckboxVariants[tcvi]);
            }
          } else if (lowerSetName === "radio" && templateCheckedKey && templateCheckedOn != null) {
            var templateRadioVariants = (templateVariantKey && templateOrderedVariants.length > 0)
              ? templateOrderedVariants.slice(0, 2)
              : [null];
            for (var trvi = 0; trvi < templateRadioVariants.length; trvi++) {
              (function (templateRadioVariantName) {
                var templateVariantPatch = {};
                if (templateRadioVariantName) templateVariantPatch.Variant = templateRadioVariantName;
                var templateVariantStatesBlock = createStack("radio-states-block-" + normalizeName(templateRadioVariantName || "default"), 8);
                if (templateRadioVariantName) {
                  var templateVariantStatesHeader = createStack("radio-states-header-" + normalizeName(templateRadioVariantName), 6);
                  appendText(templateVariantStatesHeader, titleFont, String(templateRadioVariantName), 18, DOC_COLORS.panelHeading, "Radio States Variant Heading", "title");
                  templateVariantStatesBlock.appendChild(templateVariantStatesHeader);
                }

                var templateRadioStatesOffPanel = createPanel("radio-states-" + normalizeName((templateRadioVariantName || "default") + "-checked-off") + "-panel", 10);
                templateRadioStatesOffPanel.resize(1192, templateRadioStatesOffPanel.height);
                templateVariantStatesBlock.appendChild(templateRadioStatesOffPanel);
                addInstancesRow(templateRadioStatesOffPanel, "Checked Off", templateOrderedStates, function (stateName) {
                  var patch = { State: stateName, Checked: templateCheckedOff };
                  var patchKeys = Object.keys(templateVariantPatch);
                  for (var pui = 0; pui < patchKeys.length; pui++) patch[patchKeys[pui]] = templateVariantPatch[patchKeys[pui]];
                  return makeTemplateInstance(patch);
                }, true, { font: mediumFont, size: 14 });

                var templateRadioStatesOnPanel = createPanel("radio-states-" + normalizeName((templateRadioVariantName || "default") + "-checked-on") + "-panel", 10);
                templateRadioStatesOnPanel.resize(1192, templateRadioStatesOnPanel.height);
                templateVariantStatesBlock.appendChild(templateRadioStatesOnPanel);
                addInstancesRow(templateRadioStatesOnPanel, "Checked On", templateOrderedStates, function (stateName) {
                  var patch = { State: stateName, Checked: templateCheckedOn };
                  var patchKeys = Object.keys(templateVariantPatch);
                  for (var pui = 0; pui < patchKeys.length; pui++) patch[patchKeys[pui]] = templateVariantPatch[patchKeys[pui]];
                  return makeTemplateInstance(patch);
                }, true, { font: mediumFont, size: 14 });

                templateStatesSlot.appendChild(templateVariantStatesBlock);
              })(templateRadioVariants[trvi]);
            }
          } else if (lowerSetName === "divider") {
            renderDividerDocsRows(templateStatesSlot, templateOrderedStates, function (stateName) {
              return makeTemplateInstance({ State: stateName });
            });
          } else {
            addInstancesRow(templateStatesSlot, "States", templateOrderedStates, function (stateName) {
              return makeTemplateInstance({ State: stateName });
            }, false, lowerSetName === "card"
              ? { itemsPerRow: 3 }
              : (lowerSetName === "tabs"
                  ? { itemsPerRow: 2, rowItemSpacing: 20 }
                  : (lowerSetName === "divider"
                      ? { itemsPerRow: 2, rowItemSpacing: 84, instancePaddingX: 22, instancePaddingY: 10 }
                  : (normalizedSetName === "accordionitem"
                      ? { itemsPerRow: 1, rowItemSpacing: 12 }
                      : null))));
          }
        } else if (!hasStates) {
          removeSectionOrSlot(templatedDoc, slug, "states");
        }

        // Progress does not expose radius as a standalone axis in the default template flow,
        // so render an explicit radius strip when Radius values are available.
        if (lowerSetName === "progress" && templateRadiusKey && templateOrderedRadiiAll.length > 1) {
          templatedDoc.appendChild(createSectionHeader("Radius", "Corner radius scale.", DOC_COLORS.subtitle));
          var progressTplRadiusPanel = createPanel("progress-template-radius", 10);
          progressTplRadiusPanel.resize(1192, progressTplRadiusPanel.height);
          templatedDoc.appendChild(progressTplRadiusPanel);
          addInstancesRow(
            progressTplRadiusPanel,
            "Radius",
            templateOrderedRadiiAll,
            function (rName) {
              return makeTemplateInstance({ Radius: rName });
            },
            false,
            { itemsPerRow: 3 }
          );
        }

        // Avatar documents Radius, Color, and Content in addition to Size.
        if (lowerSetName === "avatar") {
          var avatarTplRadii = pickOrdered(getPropValues(variantProps, "Radius"), ["Default", "XXS", "XS", "SM", "MD", "LG", "XL"]).slice(0, 6);
          if (avatarTplRadii.length > 1) {
            templatedDoc.appendChild(createSectionHeader("Radius", "Corner radius scale, from circle to square.", DOC_COLORS.subtitle));
            var avatarTplRadiusPanel = createPanel("avatar-template-radius", 10);
            avatarTplRadiusPanel.resize(1192, avatarTplRadiusPanel.height);
            templatedDoc.appendChild(avatarTplRadiusPanel);
            addInstancesRow(avatarTplRadiusPanel, "Radius", avatarTplRadii, function (rName) {
              return makeTemplateInstance({ Radius: rName });
            }, false, { itemsPerRow: 6 });
          }
          var avatarTplColors = getPropValues(variantProps, "Color");
          if (avatarTplColors.length > 1) {
            templatedDoc.appendChild(createSectionHeader("Color", "Brand palette colors available for the avatar.", DOC_COLORS.subtitle));
            var avatarTplColorPanel = createPanel("avatar-template-color", 10);
            avatarTplColorPanel.resize(1192, avatarTplColorPanel.height);
            templatedDoc.appendChild(avatarTplColorPanel);
            addInstancesRow(avatarTplColorPanel, "Color", avatarTplColors, function (cName) {
              return makeTemplateInstance({ Color: cName });
            }, false, { itemsPerRow: 6 });
          }
          var avatarTplContents = getPropValues(variantProps, "Content");
          if (avatarTplContents.length > 1) {
            templatedDoc.appendChild(createSectionHeader("Content", "Initials or a swappable icon.", DOC_COLORS.subtitle));
            var avatarTplContentPanel = createPanel("avatar-template-content", 10);
            avatarTplContentPanel.resize(1192, avatarTplContentPanel.height);
            templatedDoc.appendChild(avatarTplContentPanel);
            addInstancesRow(avatarTplContentPanel, "Content", avatarTplContents, function (ctName) {
              return makeTemplateInstance({ Content: ctName });
            }, false);
          }
        }

        // Select / MultiSelect document the open dropdown menu in addition to
        // the (closed) state row, so the spec shows what the open menu looks like.
        if (lowerSetName === "select" || lowerSetName === "multiselect") {
          var selectTplDropdownKey = getPropKey(variantProps, "Dropdown");
          if (selectTplDropdownKey) {
            var selectTplDropdownValues = pickOrdered(getPropValues(variantProps, "Dropdown"), ["Closed", "Open"]);
            var selectTplHasOpen = false;
            for (var sdvi = 0; sdvi < selectTplDropdownValues.length; sdvi++) {
              if (String(selectTplDropdownValues[sdvi]).toLowerCase() === "open") { selectTplHasOpen = true; break; }
            }
            if (selectTplHasOpen && selectTplDropdownValues.length > 0) {
              templatedDoc.appendChild(createSectionHeader("Dropdown", "Closed control and the open menu with selectable options.", DOC_COLORS.subtitle));
              var selectTplDropdownPanel = createPanel(lowerSetName + "-template-dropdown", 10);
              selectTplDropdownPanel.resize(1192, selectTplDropdownPanel.height);
              templatedDoc.appendChild(selectTplDropdownPanel);
              addInstancesRow(
                selectTplDropdownPanel,
                "Dropdown",
                selectTplDropdownValues,
                function (dropdownName) {
                  return makeTemplateInstance({ Dropdown: dropdownName });
                },
                false,
                { itemsPerRow: 2, rowItemSpacing: 24 }
              );
            }
          }
        }

        // Burger documents the open (X / close) state alongside the closed icon.
        if (lowerSetName === "burger") {
          var burgerTplOpenedKey = getPropKey(variantProps, "Opened");
          if (burgerTplOpenedKey) {
            var burgerTplOpenedValues = pickOrdered(getPropValues(variantProps, "Opened"), ["False", "True"]);
            if (burgerTplOpenedValues.length > 1) {
              templatedDoc.appendChild(createSectionHeader("Open & Close", "Closed menu icon and the open (close) state.", DOC_COLORS.subtitle));
              var burgerTplOpenedPanel = createPanel("burger-template-opened", 10);
              burgerTplOpenedPanel.resize(1192, burgerTplOpenedPanel.height);
              templatedDoc.appendChild(burgerTplOpenedPanel);
              addInstancesRow(
                burgerTplOpenedPanel,
                "Opened",
                burgerTplOpenedValues,
                function (openedName) {
                  return makeTemplateInstance({ Opened: openedName });
                },
                false,
                { itemsPerRow: 2, rowItemSpacing: 24 }
              );
            }
          }
        }

        if (lowerSetName === "text") {
          if (hasTextWeights && templateOrderedTextWeights.length > 0) {
            var templateWeightSlot = getTemplateSlot(templatedDoc, slug, "weight");
            if (!templateWeightSlot) {
              templatedDoc.appendChild(createSectionHeader("Weight", "Weight options for this component.", DOC_COLORS.subtitle));
              templateWeightSlot = createPanel("slot:" + slug + ":weight", 10);
              templateWeightSlot.resize(1192, templateWeightSlot.height);
              templatedDoc.appendChild(templateWeightSlot);
            } else {
              clearChildren(templateWeightSlot);
            }
            for (var twi = 0; twi < templateOrderedTextWeights.length; twi++) {
              (function (weightName) {
                addInstancesRow(templateWeightSlot, "Weight", [weightName], function (innerWeightName) {
                  return makeTemplateInstance({ Weight: innerWeightName });
                }, false);
              })(templateOrderedTextWeights[twi]);
            }
          } else {
            removeSectionOrSlot(templatedDoc, slug, "weight");
          }

          if (hasTextColors && templateOrderedTextColors.length > 0) {
            var templateColorSlot = getTemplateSlot(templatedDoc, slug, "color");
            if (!templateColorSlot) {
              templatedDoc.appendChild(createSectionHeader("Color", "Color options for this component.", DOC_COLORS.subtitle));
              templateColorSlot = createPanel("slot:" + slug + ":color", 10);
              templateColorSlot.resize(1192, templateColorSlot.height);
              templatedDoc.appendChild(templateColorSlot);
            } else {
              clearChildren(templateColorSlot);
            }
            for (var tci = 0; tci < templateOrderedTextColors.length; tci++) {
              (function (colorName) {
                addInstancesRow(templateColorSlot, "Color", [colorName], function (innerColorName) {
                  return makeTemplateInstance({ Color: innerColorName });
                }, false);
              })(templateOrderedTextColors[tci]);
            }
          } else {
            removeSectionOrSlot(templatedDoc, slug, "color");
          }
        }

        var templateIconLabels = templateOrderedSizes.length > 0 ? templateOrderedSizes : [""];
        if (hasIcons && templateLeftSlot && templateLeftIconKey && templateIconLabels.length > 0) {
          clearChildren(templateLeftSlot);
          addInstancesRow(templateLeftSlot, "Left Icon", templateIconLabels, function (sizeName) {
            var patch = {};
            if (templateSizeKey) patch.Size = sizeName;
            patch[templateLeftIconKey] = templateLeftOn;
            if (templateRightIconKey && templateRightOff != null) patch[templateRightIconKey] = templateRightOff;
            return makeTemplateInstance(patch);
          }, false);
        } else if (!hasIcons) {
          removeSectionOrSlot(templatedDoc, slug, "icons-left");
        }

        if (hasIcons && templateRightSlot && templateRightIconKey && templateIconLabels.length > 0) {
          clearChildren(templateRightSlot);
          addInstancesRow(templateRightSlot, "Right Icon", templateIconLabels, function (sizeName) {
            var patch = {};
            if (templateSizeKey) patch.Size = sizeName;
            patch[templateRightIconKey] = templateRightOn;
            if (templateLeftIconKey && templateLeftOff != null) patch[templateLeftIconKey] = templateLeftOff;
            return makeTemplateInstance(patch);
          }, false);
        } else if (!hasIcons) {
          removeSectionOrSlot(templatedDoc, slug, "icons-right");
        }

        if (lowerSetName === "list" && templateListIconsSlot && templateIconModeKey) {
          clearChildren(templateListIconsSlot);
          var templateListIconLabels = [];
          if (templateIconModeOff != null) templateListIconLabels.push("Without icons");
          if (templateIconModeOn != null) templateListIconLabels.push("With icons");
          addInstancesRow(
            templateListIconsSlot,
            "Icon mode",
            templateListIconLabels,
            function (iconLabel) {
              var patch = {};
              patch.Icon = String(iconLabel).toLowerCase().indexOf("without") >= 0 ? templateIconModeOff : templateIconModeOn;
              return makeTemplateInstance(patch);
            },
            false,
            { itemsPerRow: 2, rowItemSpacing: 24 }
          );
        } else if (lowerSetName === "list") {
          removeSectionOrSlot(templatedDoc, slug, "icons");
        }


        if (lowerSetName === "tabs" && (templateOverflowDefaultSlot || templateOverflowOutlinedSlot)) {
          if (templateOverflowDefaultSlot) clearChildren(templateOverflowDefaultSlot);
          if (templateOverflowOutlinedSlot) clearChildren(templateOverflowOutlinedSlot);
          var templateOverflowDefaultVariant = null;
          var templateOverflowOutlinedVariant = null;
          for (var tovi = 0; tovi < templateOrderedVariants.length; tovi++) {
            var vLabel = String(templateOrderedVariants[tovi] || "").toLowerCase();
            if (vLabel === "default" && templateOverflowDefaultVariant == null) templateOverflowDefaultVariant = templateOrderedVariants[tovi];
            if (vLabel === "outlined" && templateOverflowOutlinedVariant == null) templateOverflowOutlinedVariant = templateOrderedVariants[tovi];
          }
          if (templateOverflowDefaultVariant == null && templateDefaultVariant != null) templateOverflowDefaultVariant = templateDefaultVariant;
          if (templateOverflowOutlinedVariant == null) templateOverflowOutlinedVariant = templateOverflowDefaultVariant;
          function makeOverflowTemplatePatch(variantName) {
            var patch = {};
            if (templateVariantKey && variantName != null) patch[variantPropName] = variantName;
            if (templateRadiusKey && templateDefaultRadius != null) patch.Radius = templateDefaultRadius;
            if (templateLeftArrowKey && templateLeftArrowOn != null) patch[templateLeftArrowKey] = templateLeftArrowOn;
            if (templateRightArrowKey && templateRightArrowOn != null) patch[templateRightArrowKey] = templateRightArrowOn;
            if (
              templateMenuKey &&
              templateMenuOn != null &&
              (String(variantName || "").toLowerCase() === "default" ||
                String(variantName || "").toLowerCase() === "outlined")
            ) {
              patch[templateMenuKey] = templateMenuOn;
            }
            return patch;
          }
          if (templateOverflowDefaultSlot && templateOverflowDefaultVariant != null) {
            addInstancesRow(templateOverflowDefaultSlot, "Overflow Controls", [templateOverflowDefaultVariant], function () {
              return makeTemplateInstance(makeOverflowTemplatePatch(templateOverflowDefaultVariant));
            }, false);
          }
          if (templateOverflowOutlinedSlot && templateOverflowOutlinedVariant != null) {
            addInstancesRow(templateOverflowOutlinedSlot, "Overflow Controls", [templateOverflowOutlinedVariant], function () {
              return makeTemplateInstance(makeOverflowTemplatePatch(templateOverflowOutlinedVariant));
            }, false);
          }
        }

        if (
          hasIcons &&
          templateBothSlot &&
          templateLeftIconKey &&
          templateRightIconKey &&
          templateIconLabels.length > 0 &&
          templateLeftOn != null &&
          templateRightOn != null
        ) {
          clearChildren(templateBothSlot);
          addInstancesRow(templateBothSlot, "Both Icons", templateIconLabels, function (sizeName) {
            var patch = {};
            if (templateSizeKey) patch.Size = sizeName;
            patch[templateLeftIconKey] = templateLeftOn;
            patch[templateRightIconKey] = templateRightOn;
            return makeTemplateInstance(patch);
          }, false);
        } else if (!hasIcons) {
          removeSectionOrSlot(templatedDoc, slug, "icons-both");
        }

        // Components without Variant/Size/State/Icon axes (e.g. TableHeader) still need
        // a concrete preview instance in docs.
        if (
          !hasVariants &&
          !hasSizes &&
          !hasStates &&
          !hasIcons &&
          lowerSetName !== "notification" &&
          lowerSetName !== "tooltip" &&
          lowerSetName !== "text"
        ) {
          var templateSingleExampleSlot = getTemplateSlot(templatedDoc, slug, "example");
          if (!templateSingleExampleSlot) {
            templatedDoc.appendChild(createSectionHeader("Example", "Default component preview.", DOC_COLORS.subtitle));
            templateSingleExampleSlot = createPanel("slot:" + slug + ":example", 10);
            templateSingleExampleSlot.resize(1192, templateSingleExampleSlot.height);
            templatedDoc.appendChild(templateSingleExampleSlot);
          } else {
            clearChildren(templateSingleExampleSlot);
          }
          function createSingleExampleInstance() {
            try {
              return makeTemplateInstance({});
            } catch (singleExampleErr) {
              progress("Docs single example creation failed (" + lowerSetName + "): " + String(singleExampleErr));
              try {
                if (set && set.type === "COMPONENT") {
                  return set.createInstance();
                }
              } catch (_singleExampleFallbackErr) {}
              return null;
            }
          }
          addInstancesRow(
            templateSingleExampleSlot,
            "Example",
            [""],
            function () { return createSingleExampleInstance(); },
            false
          );
        }

        // Notification has no Variant/Size/State axes in the template flow; fill Color + Radius explicitly.
        if (lowerSetName === "notification" && templateBaseComponent) {
          var notifTplColorKey = getPropKey(variantProps, "Color");
          var notifTplColorVals = notifTplColorKey ? getPropValues(variantProps, "Color") : [];
          var notifTplRadiusKey = getPropKey(variantProps, "Radius");
          var notifTplRadiusVals = notifTplRadiusKey ? getPropValues(variantProps, "Radius") : [];
          var notifTplBorderKey = getPropKey(variantProps, "Border") ? "Border" : (getPropKey(variantProps, "WithBorder") ? "WithBorder" : null);
          var notifTplCloseKey = getPropKey(variantProps, "Close") ? "Close" : (getPropKey(variantProps, "WithCloseButton") ? "WithCloseButton" : null);
          var notifTplIconKey = getPropKey(variantProps, "Icon") ? "Icon" : (getPropKey(variantProps, "WithIcon") ? "WithIcon" : null);
          var notifTplLoadingKey = getPropKey(variantProps, "Loading") ? "Loading" : null;
          var notifTplAccentKey = getPropKey(variantProps, "Accent") ? "Accent" : null;
          var notifTplBorderVals = notifTplBorderKey ? getPropValues(variantProps, notifTplBorderKey) : [];
          var notifTplCloseVals = notifTplCloseKey ? getPropValues(variantProps, notifTplCloseKey) : [];
          var notifTplIconVals = notifTplIconKey ? getPropValues(variantProps, notifTplIconKey) : [];
          var notifTplLoadingVals = notifTplLoadingKey ? getPropValues(variantProps, notifTplLoadingKey) : [];
          var notifTplAccentVals = notifTplAccentKey ? getPropValues(variantProps, notifTplAccentKey) : [];
          function notifTplToggleOn(values) {
            if (!values || !values.length) return null;
            for (var i = 0; i < values.length; i++) {
              var v = String(values[i] || "").toLowerCase();
              if (v === "on" || v === "true") return values[i];
            }
            return values[0];
          }
          function notifTplToggleOff(values) {
            if (!values || !values.length) return null;
            for (var i = 0; i < values.length; i++) {
              var v = String(values[i] || "").toLowerCase();
              if (v === "off" || v === "false") return values[i];
            }
            return values[0];
          }
          var notifTplColorDefault = null;
          if (notifTplColorVals.length > 0) {
            for (var ntci = 0; ntci < notifTplColorVals.length; ntci++) {
              if (String(notifTplColorVals[ntci] || "").toLowerCase() === "primary") {
                notifTplColorDefault = notifTplColorVals[ntci];
                break;
              }
            }
            if (notifTplColorDefault == null) notifTplColorDefault = notifTplColorVals[0];
          }
          var notifTplRadiusDefault = pickDefaultSizeValue(notifTplRadiusVals);
          var notifTplBorderOn = notifTplToggleOn(notifTplBorderVals);
          var notifTplBorderOff = notifTplToggleOff(notifTplBorderVals);
          var notifTplCloseOn = notifTplToggleOn(notifTplCloseVals);
          var notifTplCloseOff = notifTplToggleOff(notifTplCloseVals);
          var notifTplIconOn = notifTplToggleOn(notifTplIconVals);
          var notifTplIconOff = notifTplToggleOff(notifTplIconVals);
          var notifTplLoadingOn = notifTplToggleOn(notifTplLoadingVals);
          var notifTplLoadingOff = notifTplToggleOff(notifTplLoadingVals);
          var notifTplAccentOn = notifTplToggleOn(notifTplAccentVals);
          var notifTplAccentOff = notifTplToggleOff(notifTplAccentVals);
          var notifTplPanel = getTemplateSlot(templatedDoc, slug, "variants") || getTemplateSlot(templatedDoc, slug, "size");
          if (!notifTplPanel) {
            templatedDoc.appendChild(createSectionHeader("Examples", "Semantic colors and radius scale.", DOC_COLORS.subtitle));
            notifTplPanel = createPanel("slot:" + slug + ":notification-examples", 10);
            notifTplPanel.resize(1192, notifTplPanel.height);
            templatedDoc.appendChild(notifTplPanel);
          } else {
            clearChildren(notifTplPanel);
            try {
              if (notifTplPanel.layoutMode === "VERTICAL") notifTplPanel.itemSpacing = 16;
            } catch (_eNotifTpl) {}
          }
          if (notifTplColorVals.length > 0) {
            addInstancesRow(
              notifTplPanel,
              "Color",
              notifTplColorVals,
              function (cName) {
                return makeTemplateInstance({ Color: cName });
              },
              false,
              { itemsPerRow: 3 }
            );
          }
          var notifTplHasToggles =
            notifTplBorderVals.length > 1 ||
            notifTplCloseVals.length > 1 ||
            notifTplIconVals.length > 1 ||
            notifTplLoadingVals.length > 1 ||
            notifTplAccentVals.length > 1;
          if (notifTplHasToggles) {
            function makeNotifTplBasePatch() {
              var patch = {};
              if (notifTplColorDefault != null) patch.Color = notifTplColorDefault;
              if (notifTplRadiusDefault != null) patch.Radius = notifTplRadiusDefault;
              if (notifTplBorderKey && notifTplBorderOff != null) patch[notifTplBorderKey] = notifTplBorderOff;
              if (notifTplCloseKey && notifTplCloseOff != null) patch[notifTplCloseKey] = notifTplCloseOff;
              if (notifTplIconKey && notifTplIconOff != null) patch[notifTplIconKey] = notifTplIconOff;
              if (notifTplLoadingKey && notifTplLoadingOff != null) patch[notifTplLoadingKey] = notifTplLoadingOff;
              if (notifTplAccentKey && notifTplAccentOff != null) patch[notifTplAccentKey] = notifTplAccentOff;
              return patch;
            }
            function appendNotifTplOptionCard(cardName, cardSubtitle, labels, patchForLabel, itemsPerRow) {
              if (!labels || !labels.length) return;
              var block = createStack("notification-template-option-block-" + normalizeName(cardName), 8);
              appendText(block, titleFont, cardName, 18, DOC_COLORS.panelHeading, "Notification Option Heading", "title");
              appendText(block, bodyFont, cardSubtitle, 12, DOC_COLORS.panelBody, "Notification Option Subtitle");
              var panel = createPanel("notification-template-option-card-" + normalizeName(cardName), 10);
              panel.resize(1192, panel.height);
              block.appendChild(panel);
              notifTplPanel.appendChild(block);
              addInstancesRow(
                panel,
                cardName,
                labels,
                function (label) { return makeTemplateInstance(patchForLabel(label)); },
                false,
                itemsPerRow ? { itemsPerRow: itemsPerRow } : null
              );
            }
            var notifTplOrderedColors = notifTplColorVals.length > 0
              ? pickOrdered(notifTplColorVals, ["Primary", "Dark", "Error", "Warning", "Success"])
              : [];
            if (notifTplBorderVals.length > 1 && notifTplBorderKey && notifTplOrderedColors.length > 0) {
              appendNotifTplOptionCard(
                "Border",
                "Bordered notifications across semantic colors.",
                notifTplOrderedColors,
                function (colorName) {
                  var patch = makeNotifTplBasePatch();
                  patch.Color = colorName;
                  if (notifTplBorderOn != null) patch[notifTplBorderKey] = notifTplBorderOn;
                  if (notifTplAccentKey && notifTplAccentOn != null) patch[notifTplAccentKey] = notifTplAccentOn;
                  return patch;
                },
                3
              );
            }
            if (notifTplCloseVals.length > 1 && notifTplCloseKey && notifTplColorDefault != null) {
              appendNotifTplOptionCard(
                "Close",
                "Primary notification with close control enabled.",
                [notifTplColorDefault],
                function () {
                  var patch = makeNotifTplBasePatch();
                  if (notifTplCloseOn != null) patch[notifTplCloseKey] = notifTplCloseOn;
                  return patch;
                },
                1
              );
            }
            if (notifTplIconVals.length > 1 && notifTplIconKey && notifTplColorDefault != null) {
              appendNotifTplOptionCard(
                "Icon",
                "Primary notification with leading icon enabled.",
                [notifTplColorDefault],
                function () {
                  var patch = makeNotifTplBasePatch();
                  if (notifTplIconOn != null) patch[notifTplIconKey] = notifTplIconOn;
                  return patch;
                },
                1
              );
            }
            if (notifTplLoadingVals.length > 1 && notifTplLoadingKey && notifTplColorDefault != null) {
              appendNotifTplOptionCard(
                "Loader",
                "Primary notification with loading state enabled.",
                [notifTplColorDefault],
                function () {
                  var patch = makeNotifTplBasePatch();
                  if (notifTplLoadingOn != null) patch[notifTplLoadingKey] = notifTplLoadingOn;
                  return patch;
                },
                1
              );
            }
            if (notifTplAccentVals.length > 1 && notifTplAccentKey && notifTplColorDefault != null) {
              appendNotifTplOptionCard(
                "No Accent",
                "Primary notification with accent bar disabled.",
                [notifTplColorDefault],
                function () {
                  var patch = makeNotifTplBasePatch();
                  if (notifTplAccentOff != null) patch[notifTplAccentKey] = notifTplAccentOff;
                  if (notifTplLoadingKey && notifTplLoadingOff != null) patch[notifTplLoadingKey] = notifTplLoadingOff;
                  return patch;
                },
                1
              );
            }
          }
          if (notifTplRadiusVals.length > 1) {
            var notifTplRadiusPanel = createPanel("notification-template-radius-row", 10);
            notifTplRadiusPanel.resize(1192, notifTplRadiusPanel.height);
            notifTplPanel.appendChild(notifTplRadiusPanel);
            addInstancesRow(
              notifTplRadiusPanel,
              "Radius",
              pickOrdered(notifTplRadiusVals, ["Default", "XS", "SM", "MD", "LG", "XL"]).slice(0, 6),
              function (rName) {
                return makeTemplateInstance({ Radius: rName });
              },
              false,
              { itemsPerRow: 3 }
            );
          }
        }

        // Tooltip uses Direction + Arrow only (no Variant/Size); template flow would otherwise leave the page empty.
        if (lowerSetName === "tooltip" && templateBaseComponent) {
          var ttTplDirKey = getPropKey(variantProps, "Direction");
          var ttTplArrowKey = getPropKey(variantProps, "Arrow");
          var ttTplDirs = ttTplDirKey ? getPropValues(variantProps, "Direction") : [];
          var ttTplArrows = ttTplArrowKey ? getPropValues(variantProps, "Arrow") : [];
          var ttTplDefArrow = null;
          var ttTplDefDir = null;
          for (var tta = 0; tta < ttTplArrows.length; tta++) {
            var al = String(ttTplArrows[tta] || "").toLowerCase();
            if (al.indexOf("without") < 0 && al.indexOf("with") >= 0) {
              ttTplDefArrow = ttTplArrows[tta];
              break;
            }
          }
          if (ttTplDefArrow == null && ttTplArrows.length > 0) ttTplDefArrow = ttTplArrows[0];
          for (var ttd = 0; ttd < ttTplDirs.length; ttd++) {
            if (String(ttTplDirs[ttd] || "").toLowerCase() === "top") {
              ttTplDefDir = ttTplDirs[ttd];
              break;
            }
          }
          if (ttTplDefDir == null && ttTplDirs.length > 0) ttTplDefDir = ttTplDirs[0];

          var ttTplPanel = getTemplateSlot(templatedDoc, slug, "variants") || getTemplateSlot(templatedDoc, slug, "size");
          if (!ttTplPanel) {
            templatedDoc.appendChild(createSectionHeader("Examples", "Placement direction and arrow visibility.", DOC_COLORS.subtitle));
            ttTplPanel = createPanel("slot:" + slug + ":tooltip-examples", 10);
            ttTplPanel.resize(1192, ttTplPanel.height);
            templatedDoc.appendChild(ttTplPanel);
          } else {
            clearChildren(ttTplPanel);
            try {
              if (ttTplPanel.layoutMode === "VERTICAL") ttTplPanel.itemSpacing = 16;
            } catch (_eTtTpl) {}
          }
          if (ttTplDirs.length > 0 && ttTplDefArrow != null) {
            var ttOrderedDirs = pickOrdered(ttTplDirs, ["top", "bottom", "left", "right"]);
            addInstancesRow(
              ttTplPanel,
              "Direction",
              ttOrderedDirs,
              function (dirName) {
                var ttPatch = {};
                if (ttTplDirKey) ttPatch.Direction = dirName;
                if (ttTplArrowKey) ttPatch.Arrow = ttTplDefArrow;
                return makeTemplateInstance(ttPatch);
              },
              false,
              { itemsPerRow: 4 }
            );
          }
          if (ttTplArrows.length > 1 && ttTplDefDir != null) {
            var ttTplArrowStrip = createPanel("tooltip-template-arrow-row", 10);
            ttTplArrowStrip.resize(1192, ttTplArrowStrip.height);
            ttTplPanel.appendChild(ttTplArrowStrip);
            var ttOrderedArrows = pickOrdered(ttTplArrows, ["with-arrow", "without-arrow"]);
            addInstancesRow(
              ttTplArrowStrip,
              "Arrow",
              ttOrderedArrows,
              function (arrowName) {
                var ttPatch2 = {};
                if (ttTplDirKey) ttPatch2.Direction = ttTplDefDir;
                if (ttTplArrowKey) ttPatch2.Arrow = arrowName;
                return makeTemplateInstance(ttPatch2);
              },
              false,
              { itemsPerRow: 2 }
            );
          }
        }
      } else {
        progress("Docs template base component unresolved for " + setName + " (" + String(set && set.type) + ")");
        if (!hasVariants && !hasSizes && !hasStates && !hasIcons) {
          var unresolvedExampleSlot = getTemplateSlot(templatedDoc, slug, "example");
          if (!unresolvedExampleSlot) {
            templatedDoc.appendChild(createSectionHeader("Example", "Default component preview.", DOC_COLORS.subtitle));
            unresolvedExampleSlot = createPanel("slot:" + slug + ":example", 10);
            unresolvedExampleSlot.resize(1192, unresolvedExampleSlot.height);
            templatedDoc.appendChild(unresolvedExampleSlot);
          } else {
            clearChildren(unresolvedExampleSlot);
          }
          function createDirectExampleInstance() {
            try {
              if (set && set.type === "COMPONENT") return set.createInstance();
              if (set && set.type === "COMPONENT_SET" && set.children && set.children.length > 0) {
                for (var sii = 0; sii < set.children.length; sii++) {
                  if (set.children[sii] && set.children[sii].type === "COMPONENT") {
                    return set.children[sii].createInstance();
                  }
                }
              }
            } catch (_directExampleErr) {}
            return null;
          }
          addInstancesRow(
            unresolvedExampleSlot,
            "Example",
            [""],
            function () { return createDirectExampleInstance(); },
            false
          );
        }
      }

      clearExplicitModesInSubtree(templatedDoc);
      leftAlignTemplateDocHeadings(templatedDoc);
      applyDocVariableBindings(templatedDoc);

      docsPage.appendChild(templatedDoc);
      templatedDoc.x = docsX;
      templatedDoc.y = docsY;
      docsY += nodeRenderedHeight(templatedDoc) + docsGap;
      docsCreated++;
      continue;
    }

    var doc = figma.createFrame();
    doc.name = "__AUTO_DOCS__ - " + setName;
    doc.layoutMode = "VERTICAL";
    doc.primaryAxisSizingMode = "AUTO";
    doc.counterAxisSizingMode = "AUTO";
    doc.counterAxisAlignItems = "MIN";
    doc.itemSpacing = 16;
    doc.paddingLeft = 64;
    doc.paddingRight = 64;
    doc.paddingTop = 64;
    doc.paddingBottom = 64;
    doc.fills = [{ type: "SOLID", color: DOC_COLORS.pageBg }];
    if (docsResolvedColorVars.pageBg) {
      bindPaintVar(doc, "fills", 0, docsResolvedColorVars.pageBg);
    }
    doc.cornerRadius = 0;
    doc.clipsContent = false;
    doc.resize(1320, doc.height);

    var introBlock = createStack("Intro Block", 12);
    appendText(introBlock, titleFont, setName, 28, DOC_COLORS.title, "Component Title", "title");
    appendText(
      introBlock,
      bodyFont,
      "Guidelines for implementing " + setName.toLowerCase() + " consistently across the platform.",
      16,
      DOC_COLORS.subtitle,
      "Component Subtitle"
    );
    doc.appendChild(introBlock);

    var variantsSlot = null;
    if (hasVariants) {
      var variantsSubtitle =
        String(setName || "").toLowerCase() === "button"
          ? "Buttons are available in two variants that establish visual hierarchy and guide user actions throughout the interface."
          : "Visual variants available for this component.";
      doc.appendChild(createSectionHeader("Variants", variantsSubtitle, DOC_COLORS.variantSubtitle));
      variantsSlot = createStack("slot:" + slug + ":variants", 16);
      doc.appendChild(variantsSlot);
    }

    var sizeSlot = null;
    if (hasSizes) {
      doc.appendChild(createSectionHeader("Size", "Size options for this component.", DOC_COLORS.subtitle));
      sizeSlot = createPanel("slot:" + slug + ":size", 10);
      sizeSlot.resize(1192, sizeSlot.height);
      doc.appendChild(sizeSlot);
    }

    var statesSlot = null;
    if (hasStates) {
      doc.appendChild(createSectionHeader("States", "Interactive states used in documentation examples.", DOC_COLORS.subtitle));
      statesSlot = createPanel("slot:" + slug + ":states", 10);
      statesSlot.resize(1192, statesSlot.height);
      doc.appendChild(statesSlot);
    }

    var weightSlot = null;
    var colorSlot = null;
    if (lowerSetName === "text" && hasTextWeights) {
      doc.appendChild(createSectionHeader("Weight", "Weight options for this component.", DOC_COLORS.subtitle));
      weightSlot = createPanel("slot:" + slug + ":weight", 10);
      weightSlot.resize(1192, weightSlot.height);
      doc.appendChild(weightSlot);
    }
    if (lowerSetName === "text" && hasTextColors) {
      doc.appendChild(createSectionHeader("Color", "Color options for this component.", DOC_COLORS.subtitle));
      colorSlot = createPanel("slot:" + slug + ":color", 10);
      colorSlot.resize(1192, colorSlot.height);
      doc.appendChild(colorSlot);
    }

    // Avatar documents Radius, Color, and Content in addition to Size.
    var avatarRadiusSlot = null;
    var avatarColorSlot = null;
    var avatarContentSlot = null;
    if (lowerSetName === "avatar") {
      if (getPropValues(variantProps, "Radius").length > 1) {
        doc.appendChild(createSectionHeader("Radius", "Corner radius scale, from circle to square.", DOC_COLORS.subtitle));
        avatarRadiusSlot = createPanel("slot:" + slug + ":radius", 10);
        avatarRadiusSlot.resize(1192, avatarRadiusSlot.height);
        doc.appendChild(avatarRadiusSlot);
      }
      if (getPropValues(variantProps, "Color").length > 1) {
        doc.appendChild(createSectionHeader("Color", "Brand palette colors available for the avatar.", DOC_COLORS.subtitle));
        avatarColorSlot = createPanel("slot:" + slug + ":color", 10);
        avatarColorSlot.resize(1192, avatarColorSlot.height);
        doc.appendChild(avatarColorSlot);
      }
      if (getPropValues(variantProps, "Content").length > 1) {
        doc.appendChild(createSectionHeader("Content", "Initials or a swappable icon.", DOC_COLORS.subtitle));
        avatarContentSlot = createPanel("slot:" + slug + ":content", 10);
        avatarContentSlot.resize(1192, avatarContentSlot.height);
        doc.appendChild(avatarContentSlot);
      }
    }

    // Select / MultiSelect document the open dropdown menu in addition to states.
    var selectDropdownSlot = null;
    if ((lowerSetName === "select" || lowerSetName === "multiselect") && getPropKey(variantProps, "Dropdown")) {
      var selectDocDropdownValues = pickOrdered(getPropValues(variantProps, "Dropdown"), ["Closed", "Open"]);
      var selectDocHasOpen = false;
      for (var sddi = 0; sddi < selectDocDropdownValues.length; sddi++) {
        if (String(selectDocDropdownValues[sddi]).toLowerCase() === "open") { selectDocHasOpen = true; break; }
      }
      if (selectDocHasOpen && selectDocDropdownValues.length > 0) {
        doc.appendChild(createSectionHeader("Dropdown", "Closed control and the open menu with selectable options.", DOC_COLORS.subtitle));
        selectDropdownSlot = createPanel("slot:" + slug + ":dropdown", 10);
        selectDropdownSlot.resize(1192, selectDropdownSlot.height);
        doc.appendChild(selectDropdownSlot);
      }
    }

    // Burger documents the open (X / close) state alongside the closed menu icon.
    var burgerOpenedSlot = null;
    if (lowerSetName === "burger" && getPropKey(variantProps, "Opened")) {
      var burgerDocOpenedValues = pickOrdered(getPropValues(variantProps, "Opened"), ["False", "True"]);
      if (burgerDocOpenedValues.length > 1) {
        doc.appendChild(createSectionHeader("Open & Close", "Closed menu icon and the open (close) state.", DOC_COLORS.subtitle));
        burgerOpenedSlot = createPanel("slot:" + slug + ":opened", 10);
        burgerOpenedSlot.resize(1192, burgerOpenedSlot.height);
        doc.appendChild(burgerOpenedSlot);
      }
    }

    var leftSlot = null;
    var rightSlot = null;
    var bothSlot = null;
    var listIconsSlot = null;
    var overflowDefaultSlot = null;
    var overflowOutlinedSlot = null;
    if (hasIcons) {
      doc.appendChild(createSectionHeader("With Icons", "Examples with optional icon placements.", DOC_COLORS.panelBody));
      var leftIconsBlock = createStack("icons-left-block", 8);
      appendText(leftIconsBlock, titleFont, "Left Icon", 18, DOC_COLORS.panelHeading, "Left Icon Heading", "title");
      leftSlot = createPanel("slot:" + slug + ":icons-left", 10);
      leftSlot.resize(1192, leftSlot.height);
      leftIconsBlock.appendChild(leftSlot);
      doc.appendChild(leftIconsBlock);

      var rightIconsBlock = createStack("icons-right-block", 8);
      appendText(rightIconsBlock, titleFont, "Right Icon", 18, DOC_COLORS.panelHeading, "Right Icon Heading", "title");
      rightSlot = createPanel("slot:" + slug + ":icons-right", 10);
      rightSlot.resize(1192, rightSlot.height);
      rightIconsBlock.appendChild(rightSlot);
      doc.appendChild(rightIconsBlock);

      var bothIconsBlock = createStack("icons-both-block", 8);
      appendText(bothIconsBlock, titleFont, "Both Icons", 18, DOC_COLORS.panelHeading, "Both Icons Heading", "title");
      bothSlot = createPanel("slot:" + slug + ":icons-both", 10);
      bothSlot.resize(1192, bothSlot.height);
      bothIconsBlock.appendChild(bothSlot);
      doc.appendChild(bothIconsBlock);
    }
    if (lowerSetName === "tabs") {
      doc.appendChild(createSectionHeader("Overflow Controls", "Arrow and menu controls used for overflow tabs.", DOC_COLORS.subtitle));
      var overflowDefaultBlock = createStack("overflow-default-block", 8);
      appendText(overflowDefaultBlock, titleFont, "Default", 18, DOC_COLORS.panelHeading, "Overflow Default Heading", "title");
      overflowDefaultSlot = createPanel("slot:" + slug + ":overflow-default", 10);
      overflowDefaultSlot.resize(1192, overflowDefaultSlot.height);
      overflowDefaultBlock.appendChild(overflowDefaultSlot);
      doc.appendChild(overflowDefaultBlock);

      var overflowOutlinedBlock = createStack("overflow-outlined-block", 8);
      appendText(overflowOutlinedBlock, titleFont, "Outlined", 18, DOC_COLORS.panelHeading, "Overflow Outlined Heading", "title");
      overflowOutlinedSlot = createPanel("slot:" + slug + ":overflow-outlined", 10);
      overflowOutlinedSlot.resize(1192, overflowOutlinedSlot.height);
      overflowOutlinedBlock.appendChild(overflowOutlinedSlot);
      doc.appendChild(overflowOutlinedBlock);
    }

    if (set.type === "COMPONENT_SET" || set.type === "COMPONENT") {
      var baseComponent = resolveBaseComponent(set);
      if (!baseComponent) {
        docsPage.appendChild(doc);
        doc.x = docsX;
        doc.y = docsY;
        docsY += nodeRenderedHeight(doc) + docsGap;
        continue;
      }

      var variantKey = getPropKey(variantProps, variantPropName);
      var stateKey = getPropKey(variantProps, "State");
      var sizeKey = getPropKey(variantProps, "Size");
      var radiusKey = getPropKey(variantProps, "Radius");
      var sectionKey = getPropKey(variantProps, "Section");
      var checkedKey = getPropKey(variantProps, "Checked");
      var leftIconKey = getPropKey(variantProps, "LeftIcon");
      var rightIconKey = getPropKey(variantProps, "RightIcon");
      var leftArrowKey = getPropKey(variantProps, "LeftArrow");
      var rightArrowKey = getPropKey(variantProps, "RightArrow");
      var menuKey = getPropKey(variantProps, "Menu");
      var iconModeKey = getPropKey(variantProps, "Icon");
      var orientationKey = getPropKey(variantProps, "Orientation");
      var insetKey = getPropKey(variantProps, "Inset");
      var colorKey = getPropKey(variantProps, "Color");

      var variantOrder = ["Filled", "Outlined", "Outline", "Ghost", "Default", "Light", "Transparent", "Pills"];
      var variantLimit = lowerSetName === "tablebody"
        ? Math.max(6, variants.length)
        : (lowerSetName === "badge" ? 4 : (lowerSetName === "card" ? 5 : 3));
      var orderedVariants = pickOrdered(variants, variantOrder).slice(0, variantLimit);
      var orderedStates = pickOrdered(states, ["Default", "Hover", "Focus", "Pressed", "Active", "Disabled"]).slice(0, 5);
      var orderedSizesAll = pickOrdered(sizes, ["Default", "Label", "Caption", "XXS", "XS", "SM", "MD", "LG", "XL"]).slice(0, 8);
      var orderedTextWeights = pickOrdered(textWeights, ["Regular", "Medium", "Semibold", "Bold"]).slice(0, 6);
      var orderedTextColors = pickOrdered(textColors, [
        "Default",
        "Dimmed",
        "Brand",
        "Success",
        "Warning",
        "Error",
      ]).slice(0, 8);
      var radii = getPropValues(variantProps, "Radius");
      var orderedRadiiAll = pickOrdered(radii, ["Default", "XXS", "XS", "SM", "MD", "LG", "XL"]).slice(0, 6);
      var orderedSizes = orderedSizesAll.slice();
      if (orderedSizes.length > 1 && lowerSetName !== "badge") {
        orderedSizes = orderedSizes.filter(function (s) { return String(s).toLowerCase() !== "default"; });
      }
      if (lowerSetName === "badge" && orderedSizes.length > 1) {
        var defaultSizeIdx = -1;
        var mdSizeIdx = -1;
        for (var osi = 0; osi < orderedSizes.length; osi++) {
          var sizeName = String(orderedSizes[osi] || "").toLowerCase();
          if (sizeName === "default") defaultSizeIdx = osi;
          if (sizeName === "md") mdSizeIdx = osi;
        }
        if (defaultSizeIdx >= 0 && mdSizeIdx >= 0 && defaultSizeIdx !== mdSizeIdx + 1) {
          var defaultSizeValue = orderedSizes[defaultSizeIdx];
          orderedSizes.splice(defaultSizeIdx, 1);
          if (defaultSizeIdx < mdSizeIdx) mdSizeIdx -= 1;
          orderedSizes.splice(mdSizeIdx + 1, 0, defaultSizeValue);
        }
      }

      var defaultVariant = orderedVariants.length > 0 ? orderedVariants[0] : null;
      if (lowerSetName === "card" && orderedVariants.length > 0) {
        for (var dvi = 0; dvi < orderedVariants.length; dvi++) {
          if (String(orderedVariants[dvi]).toLowerCase() === "default") {
            defaultVariant = orderedVariants[dvi];
            break;
          }
        }
      }
      var defaultState = orderedStates.length > 0 ? orderedStates[0] : null;
      var defaultSize = pickDefaultSizeValue(orderedSizesAll);
      var defaultRadius = pickDefaultSizeValue(orderedRadiiAll);

      var colorValuesAll = colorKey ? getPropValues(variantProps, "Color") : [];
      var defaultColor = null;
      var primaryColor = null;
      var errorColor = null;
      if (colorValuesAll.length > 0) {
        for (var cci = 0; cci < colorValuesAll.length; cci++) {
          var lowerColorName = String(colorValuesAll[cci]).toLowerCase();
          if (lowerColorName === "default") {
            defaultColor = colorValuesAll[cci];
          }
          if (lowerColorName === "primary") {
            primaryColor = colorValuesAll[cci];
          }
          if (lowerColorName === "error") {
            errorColor = colorValuesAll[cci];
          }
        }
        if (defaultColor == null) defaultColor = colorValuesAll[0];
        if (primaryColor == null) primaryColor = defaultColor;
      }

      var badgeDocSemanticColors = (lowerSetName === "badge" && colorKey && colorValuesAll.length > 0)
        ? pickOrdered(colorValuesAll, ["Default", "Success", "Warning", "Error"])
        : [];

      var leftValues = leftIconKey ? getPropValues(variantProps, leftIconKey) : [];
      var rightValues = rightIconKey ? getPropValues(variantProps, rightIconKey) : [];
      var leftArrowValues = leftArrowKey ? getPropValues(variantProps, leftArrowKey) : [];
      var rightArrowValues = rightArrowKey ? getPropValues(variantProps, rightArrowKey) : [];
      var menuValues = menuKey ? getPropValues(variantProps, menuKey) : [];
      var iconModeValues = iconModeKey ? getPropValues(variantProps, iconModeKey) : [];
      var orientationValues = orientationKey ? getPropValues(variantProps, orientationKey) : [];
      var insetValues = insetKey ? getPropValues(variantProps, insetKey) : [];
      var sectionValues = sectionKey ? getPropValues(variantProps, sectionKey) : [];
      var checkedValues = checkedKey ? getPropValues(variantProps, checkedKey) : [];
      var leftOn = leftValues.indexOf("On") >= 0 ? "On" : (leftValues.indexOf("True") >= 0 ? "True" : (leftValues[0] || null));
      var leftOff = leftValues.indexOf("Off") >= 0 ? "Off" : (leftValues.indexOf("False") >= 0 ? "False" : (leftValues[0] || null));
      var rightOn = rightValues.indexOf("On") >= 0 ? "On" : (rightValues.indexOf("True") >= 0 ? "True" : (rightValues[0] || null));
      var rightOff = rightValues.indexOf("Off") >= 0 ? "Off" : (rightValues.indexOf("False") >= 0 ? "False" : (rightValues[0] || null));
      var leftArrowOn = leftArrowValues.indexOf("On") >= 0 ? "On" : (leftArrowValues.indexOf("True") >= 0 ? "True" : (leftArrowValues[0] || null));
      var leftArrowOff = leftArrowValues.indexOf("Off") >= 0 ? "Off" : (leftArrowValues.indexOf("False") >= 0 ? "False" : (leftArrowValues[0] || null));
      var rightArrowOn = rightArrowValues.indexOf("On") >= 0 ? "On" : (rightArrowValues.indexOf("True") >= 0 ? "True" : (rightArrowValues[0] || null));
      var rightArrowOff = rightArrowValues.indexOf("Off") >= 0 ? "Off" : (rightArrowValues.indexOf("False") >= 0 ? "False" : (rightArrowValues[0] || null));
      var menuOn = menuValues.indexOf("On") >= 0 ? "On" : (menuValues.indexOf("True") >= 0 ? "True" : (menuValues[0] || null));
      var menuOff = menuValues.indexOf("Off") >= 0 ? "Off" : (menuValues.indexOf("False") >= 0 ? "False" : (menuValues[0] || null));
      var iconModeOn = iconModeValues.indexOf("On") >= 0
        ? "On"
        : (iconModeValues.indexOf("True") >= 0 ? "True" : (iconModeValues[0] || null));
      var iconModeOff = iconModeValues.indexOf("Off") >= 0
        ? "Off"
        : (iconModeValues.indexOf("False") >= 0 ? "False" : (iconModeValues[0] || null));
      var orientationHorizontal = orientationValues.indexOf("Horizontal") >= 0 ? "Horizontal" : (orientationValues[0] || null);
      var insetOn = insetValues.indexOf("On") >= 0 ? "On" : (insetValues.indexOf("True") >= 0 ? "True" : (insetValues[0] || null));
      var insetOff = insetValues.indexOf("Off") >= 0 ? "Off" : (insetValues.indexOf("False") >= 0 ? "False" : (insetValues[0] || null));
      var sectionOff = sectionValues.indexOf("Off") >= 0
        ? "Off"
        : (sectionValues.indexOf("False") >= 0 ? "False" : (sectionValues[0] || null));
      var checkedOn = checkedValues.indexOf("On") >= 0
        ? "On"
        : (checkedValues.indexOf("True") >= 0
            ? "True"
            : (checkedValues.indexOf("Checked") >= 0 ? "Checked" : (checkedValues[0] || null)));
      var checkedOff = checkedValues.indexOf("Off") >= 0
        ? "Off"
        : (checkedValues.indexOf("False") >= 0
            ? "False"
            : (checkedValues.indexOf("Unchecked") >= 0 ? "Unchecked" : (checkedValues[0] || null)));
      var checkedUnchecked = checkedValues.indexOf("Unchecked") >= 0
        ? "Unchecked"
        : checkedOff;
      var checkedOnValue = checkedValues.indexOf("Checked") >= 0
        ? "Checked"
        : checkedOn;
      var checkedIndeterminate = checkedValues.indexOf("Indeterminate") >= 0
        ? "Indeterminate"
        : null;
      if (lowerSetName === "list" && iconModeKey) {
        doc.appendChild(createSectionHeader("With Icons", "Preview list content with and without icon markers.", DOC_COLORS.panelBody));
        var listIconsBlock = createStack("list-icons-block", 8);
        appendText(listIconsBlock, titleFont, "With Icons", 18, DOC_COLORS.panelHeading, "List Icons Heading", "title");
        listIconsSlot = createPanel("slot:" + slug + ":icons", 10);
        listIconsSlot.resize(1192, listIconsSlot.height);
        listIconsBlock.appendChild(listIconsSlot);
        doc.appendChild(listIconsBlock);
      }

      function makeInstance(propPatch) {
        var inst = baseComponent.createInstance();
        var props = {};
        if (variantKey && defaultVariant != null) props[variantKey] = defaultVariant;
        if (stateKey && defaultState != null) props[stateKey] = defaultState;
        if (sizeKey && defaultSize != null) props[sizeKey] = defaultSize;
        if (radiusKey && defaultRadius != null) props[radiusKey] = defaultRadius;
        if (colorKey && defaultColor != null) props[colorKey] = defaultColor;
        if (lowerSetName === "card" && sectionKey && sectionOff != null) props[sectionKey] = sectionOff;
        if (checkedKey && checkedOff != null) props[checkedKey] = checkedOff;
        if (leftIconKey && leftOff != null) props[leftIconKey] = leftOff;
        if (rightIconKey && rightOff != null) props[rightIconKey] = rightOff;
        if (leftArrowKey && leftArrowOff != null) props[leftArrowKey] = leftArrowOff;
        if (rightArrowKey && rightArrowOff != null) props[rightArrowKey] = rightArrowOff;
        if (menuKey && menuOff != null) props[menuKey] = menuOff;
        if (lowerSetName === "list" && iconModeKey && iconModeOff != null) {
          props[iconModeKey] = iconModeOff;
        }
        if (lowerSetName === "divider") {
          if (orientationKey && orientationHorizontal != null) props[orientationKey] = orientationHorizontal;
          if (insetKey && insetOn != null) props[insetKey] = insetOn;
        } else if (insetKey && insetOff != null) {
          props[insetKey] = insetOff;
        }
        var patchKeys = Object.keys(propPatch || {});
        for (var p = 0; p < patchKeys.length; p++) {
          var userKey = patchKeys[p];
          var resolvedKey = getPropKey(variantProps, userKey);
          if (resolvedKey) props[resolvedKey] = propPatch[userKey];
        }
        try { inst.setProperties(props); } catch (e) {}
        clearExplicitModesInSubtree(inst);
        return inst;
      }

      if (sizeKey && orderedSizes.length > 1) {
        orderedSizes = reorderSizesByDefaultVisualMatch(orderedSizes, function (sizeName) {
          return makeInstance({ Size: sizeName });
        });
      }

      if (variantsSlot && orderedVariants.length > 0) {
        clearChildren(variantsSlot);
        var variantStateValues = orderedStates.length > 0 ? orderedStates : [null];
        for (var v = 0; v < orderedVariants.length; v++) {
          var variantName = orderedVariants[v];

          if (lowerSetName === "button" && colorKey && primaryColor) {
            (function (vName, stateValues) {
              function appendButtonColorVariantBlock(colorLabel, colorValue) {
                var colorVariantBlock = createStack(
                  "variant-block-" + normalizeName(vName) + "-" + normalizeName(colorLabel),
                  8
                );
                var colorVariantHeader = createStack(
                  "variant-header-" + normalizeName(vName) + "-" + normalizeName(colorLabel),
                  6
                );
                appendText(
                  colorVariantHeader,
                  titleFont,
                  String(vName) + " - " + String(colorLabel),
                  18,
                  DOC_COLORS.panelHeading,
                  "Variant Heading",
                  "title"
                );
                appendText(
                  colorVariantHeader,
                  bodyFont,
                  getVariantDescription(setName, vName),
                  12,
                  DOC_COLORS.panelBody,
                  "Variant Description"
                );
                colorVariantBlock.appendChild(colorVariantHeader);

                var colorVariantSection = createPanel(
                  "variant-section-" + normalizeName(vName) + "-" + normalizeName(colorLabel),
                  10
                );
                colorVariantSection.counterAxisSizingMode = "FIXED";
                colorVariantSection.resize(1192, colorVariantSection.height);

                var colorVariantStatesPanel = createStack(
                  "variant-states-" + normalizeName(vName) + "-" + normalizeName(colorLabel),
                  10
                );
                colorVariantStatesPanel.paddingLeft = 12;
                colorVariantStatesPanel.paddingRight = 12;
                colorVariantStatesPanel.paddingTop = 12;
                colorVariantStatesPanel.paddingBottom = 12;
                addInstancesRow(
                  colorVariantStatesPanel,
                  "States",
                  stateValues,
                  function (stateName) {
                    var patch = {};
                    patch[variantPropName] = vName;
                    patch.Color = colorValue;
                    if (stateName != null) patch.State = stateName;
                    return makeInstance(patch);
                  },
                  false
                );
                colorVariantSection.appendChild(colorVariantStatesPanel);
                colorVariantBlock.appendChild(colorVariantSection);
                variantsSlot.appendChild(colorVariantBlock);
              }

              appendButtonColorVariantBlock("Primary", primaryColor);
              if (errorColor) {
                appendButtonColorVariantBlock("Danger", errorColor);
              }
            })(variantName, variantStateValues);
            continue;
          }

          var variantBlock = createStack("variant-block-" + normalizeName(variantName), 8);
          var variantHeader = createStack("variant-header-" + normalizeName(variantName), 6);
          appendText(variantHeader, titleFont, String(variantName), 18, DOC_COLORS.panelHeading, "Variant Heading", "title");
          appendText(variantHeader, bodyFont, getVariantDescription(setName, variantName), 12, DOC_COLORS.panelBody, "Variant Description");
          variantBlock.appendChild(variantHeader);

          var variantSection = createPanel("variant-section-" + normalizeName(variantName), 10);
          variantSection.counterAxisSizingMode = "FIXED";
          variantSection.resize(1192, variantSection.height);

          var badgeColorStrip =
            lowerSetName === "badge" &&
            colorKey &&
            badgeDocSemanticColors.length > 0 &&
            badgeDocVariantIsFilledOrOutline(variantName);

          if (badgeColorStrip) {
            var variantColorsPanel = createStack("variant-colors-" + normalizeName(variantName), 10);
            variantColorsPanel.paddingLeft = 12;
            variantColorsPanel.paddingRight = 12;
            variantColorsPanel.paddingTop = 12;
            variantColorsPanel.paddingBottom = 12;
            addInstancesRow(
              variantColorsPanel,
              "Color",
              badgeDocSemanticColors,
              (function (vName) {
                return function (colorName) {
                  var variantColorPatch = {};
                  variantColorPatch[variantPropName] = vName;
                  variantColorPatch.Color = colorName;
                  return makeInstance(variantColorPatch);
                };
              })(variantName),
              false
            );
            variantSection.appendChild(variantColorsPanel);
          } else {
            var variantStatesPanel = createStack("variant-states-" + normalizeName(variantName), 10);
            variantStatesPanel.paddingLeft = 12;
            variantStatesPanel.paddingRight = 12;
            variantStatesPanel.paddingTop = 12;
            variantStatesPanel.paddingBottom = 12;
            if (lowerSetName === "button" && colorKey && primaryColor) {
              addInstancesRow(
                variantStatesPanel,
                "Primary",
                variantStateValues,
                (function (vName, cName) {
                  return function (stateName) {
                    var patch = {};
                    patch[variantPropName] = vName;
                    patch.Color = cName;
                    if (stateName != null) patch.State = stateName;
                    return makeInstance(patch);
                  };
                })(variantName, primaryColor),
                false
              );
              if (errorColor) {
                addInstancesRow(
                  variantStatesPanel,
                  "Error",
                  variantStateValues,
                  (function (vName, cName) {
                    return function (stateName) {
                      var patch = {};
                      patch[variantPropName] = vName;
                      patch.Color = cName;
                      if (stateName != null) patch.State = stateName;
                      return makeInstance(patch);
                    };
                  })(variantName, errorColor),
                  false
                );
              }
            } else {
              addInstancesRow(
                variantStatesPanel,
                "States",
                variantStateValues,
                (function (vName) {
                  return function (stateName) {
                    var patch = {};
                    patch[variantPropName] = vName;
                    if (stateName != null) patch.State = stateName;
                    if ((lowerSetName === "checkbox" || lowerSetName === "radio") && checkedOnValue != null) {
                      patch.Checked = checkedOnValue;
                    }
                    return makeInstance(patch);
                  };
                })(variantName),
                false,
                  lowerSetName === "card"
                    ? { itemsPerRow: 3 }
                    : (lowerSetName === "tabs"
                        ? { itemsPerRow: 2, rowItemSpacing: 20 }
                        : (lowerSetName === "list"
                            ? { itemsPerRow: 1, rowItemSpacing: 12 }
                            : (normalizedSetName === "accordionitem"
                                ? { itemsPerRow: 1, rowItemSpacing: 12 }
                                : null)))
              );
            }
            variantSection.appendChild(variantStatesPanel);
          }

          variantBlock.appendChild(variantSection);
          variantsSlot.appendChild(variantBlock);
        }
      }

      if (sizeSlot && orderedSizes.length > 0) {
        clearChildren(sizeSlot);
        if (lowerSetName === "switch") {
          sizeSlot.fills = [];
          sizeSlot.strokes = [];
          sizeSlot.strokeWeight = 0;
          sizeSlot.paddingLeft = 0;
          sizeSlot.paddingRight = 0;
          sizeSlot.paddingTop = 0;
          sizeSlot.paddingBottom = 0;
          sizeSlot.cornerRadius = 0;
          sizeSlot.itemSpacing = 12;
          sizeSlot.counterAxisAlignItems = "MIN";
        }
        if (stackSizeRows) {
          if (lowerSetName === "modal" && orderedSizes.length === 5) {
            addInstancesRow(
              sizeSlot,
              "Sizes",
              orderedSizes,
              function (sizeName) {
                return makeInstance({ Size: sizeName });
              },
              false,
              { itemsPerRow: 3 }
            );
          } else if (lowerSetName === "image" && orderedSizes.length === 5) {
            addInstancesRow(
              sizeSlot,
              "Sizes",
              orderedSizes,
              function (sizeName) {
                return makeInstance({ Size: sizeName });
              },
              false,
              { itemsPerRow: 4 }
            );
          } else {
            for (var osi = 0; osi < orderedSizes.length; osi++) {
              (function (sizeName) {
                addInstancesRow(sizeSlot, "Sizes", [sizeName], function (innerSizeName) {
                  return makeInstance({ Size: innerSizeName });
                }, false);
              })(orderedSizes[osi]);
            }
          }
        } else if ((lowerSetName === "slider" || lowerSetName === "rangeslider") && orderedSizes.length > 3) {
          var sliderFirstRow = orderedSizes.slice(0, 3);
          var sliderSecondRow = orderedSizes.slice(3);
          addInstancesRow(sizeSlot, "Sizes", sliderFirstRow, function (sizeName) {
            return makeInstance({ Size: sizeName });
          }, false);
          if (sliderSecondRow.length > 0) {
            addInstancesRow(sizeSlot, "Sizes", sliderSecondRow, function (sizeName) {
              return makeInstance({ Size: sizeName });
            }, false);
          }
        } else if (lowerSetName === "card" && orderedSizes.length > 3) {
          var cardFirstRow = orderedSizes.slice(0, 3);
          var cardSecondRow = orderedSizes.slice(3);
          addInstancesRow(sizeSlot, "Sizes", cardFirstRow, function (sizeName) {
            return makeInstance({ Size: sizeName });
          }, false);
          if (cardSecondRow.length > 0) {
            addInstancesRow(sizeSlot, "Sizes", cardSecondRow, function (sizeName) {
              return makeInstance({ Size: sizeName });
            }, false);
          }
        } else if (lowerSetName === "image" && orderedSizes.length === 5) {
          addInstancesRow(
            sizeSlot,
            "Sizes",
            orderedSizes,
            function (sizeName) {
              return makeInstance({ Size: sizeName });
            },
            false,
            { itemsPerRow: 4 }
          );
        } else if ((lowerSetName === "checkbox" || lowerSetName === "radio") && checkedKey && checkedOnValue != null) {
          addInstancesRow(sizeSlot, "Sizes", orderedSizes, function (sizeName) {
            return makeInstance({ Size: sizeName, Checked: checkedOnValue });
          }, false);
        } else if (lowerSetName === "switch" && checkedKey && checkedOn != null) {
          var switchSizeOffPanel = createPanel("switch-size-checked-off-panel", 10);
          switchSizeOffPanel.resize(1192, switchSizeOffPanel.height);
          sizeSlot.appendChild(switchSizeOffPanel);
          addInstancesRow(switchSizeOffPanel, "Checked Off", orderedSizes, function (sizeName) {
            return makeInstance({ Size: sizeName, Checked: checkedOff });
          }, true, { font: mediumFont, size: 14 });
          var switchSizeOnPanel = createPanel("switch-size-checked-on-panel", 10);
          switchSizeOnPanel.resize(1192, switchSizeOnPanel.height);
          sizeSlot.appendChild(switchSizeOnPanel);
          addInstancesRow(switchSizeOnPanel, "Checked On", orderedSizes, function (sizeName) {
            return makeInstance({ Size: sizeName, Checked: checkedOn });
          }, true, { font: mediumFont, size: 14 });
        } else if (lowerSetName === "divider") {
          renderDividerDocsRows(sizeSlot, orderedSizes, function (sizeName) {
            return makeInstance({ Size: sizeName });
          });
        } else if (lowerSetName === "list") {
          renderListDocsRows(sizeSlot, orderedSizes, function (sizeName) {
            return makeInstance({ Size: sizeName });
          });
        } else {
          addInstancesRow(sizeSlot, "Sizes", orderedSizes, function (sizeName) {
            return makeInstance({ Size: sizeName });
          }, false, lowerSetName === "divider"
            ? { itemsPerRow: 3, rowItemSpacing: 56, instancePaddingX: 22, instancePaddingY: 10 }
            : null);
        }
      }

      // Avatar-only: Radius, Color, and Content showcase rows.
      if (avatarRadiusSlot) {
        clearChildren(avatarRadiusSlot);
        var avatarDocRadii = pickOrdered(getPropValues(variantProps, "Radius"), ["Default", "XXS", "XS", "SM", "MD", "LG", "XL"]).slice(0, 6);
        addInstancesRow(avatarRadiusSlot, "Radius", avatarDocRadii, function (rName) {
          return makeInstance({ Radius: rName });
        }, false);
      }
      if (avatarColorSlot) {
        clearChildren(avatarColorSlot);
        var avatarDocColors = getPropValues(variantProps, "Color");
        addInstancesRow(avatarColorSlot, "Color", avatarDocColors, function (cName) {
          return makeInstance({ Color: cName });
        }, false, { itemsPerRow: 6 });
      }
      if (avatarContentSlot) {
        clearChildren(avatarContentSlot);
        var avatarDocContents = getPropValues(variantProps, "Content");
        addInstancesRow(avatarContentSlot, "Content", avatarDocContents, function (ctName) {
          return makeInstance({ Content: ctName });
        }, false);
      }

      var iconLabels = orderedSizes.length > 0 ? orderedSizes : [""];
      if (leftSlot && leftIconKey && iconLabels.length > 0) {
        clearChildren(leftSlot);
        addInstancesRow(leftSlot, "Left Icon", iconLabels, function (sizeName) {
          var patch = {};
          if (sizeKey) patch.Size = sizeName;
          patch[leftIconKey] = leftOn;
          if (rightIconKey && rightOff != null) patch[rightIconKey] = rightOff;
          return makeInstance(patch);
        }, false);
      }

      if (rightSlot && rightIconKey && iconLabels.length > 0) {
        clearChildren(rightSlot);
        addInstancesRow(rightSlot, "Right Icon", iconLabels, function (sizeName) {
          var patch = {};
          if (sizeKey) patch.Size = sizeName;
          patch[rightIconKey] = rightOn;
          if (leftIconKey && leftOff != null) patch[leftIconKey] = leftOff;
          return makeInstance(patch);
        }, false);
      }
      if (lowerSetName === "list" && listIconsSlot && iconModeKey) {
        clearChildren(listIconsSlot);
        var listIconLabels = [];
        if (iconModeOff != null) listIconLabels.push("Without icons");
        if (iconModeOn != null) listIconLabels.push("With icons");
        addInstancesRow(
          listIconsSlot,
          "Icon mode",
          listIconLabels,
          function (iconLabel) {
            var patch = {};
            patch.Icon = String(iconLabel).toLowerCase().indexOf("without") >= 0 ? iconModeOff : iconModeOn;
            return makeInstance(patch);
          },
          false,
          { itemsPerRow: 2, rowItemSpacing: 24 }
        );
      }


      if (lowerSetName === "tabs" && (overflowDefaultSlot || overflowOutlinedSlot)) {
        if (overflowDefaultSlot) clearChildren(overflowDefaultSlot);
        if (overflowOutlinedSlot) clearChildren(overflowOutlinedSlot);
        var overflowDefaultVariant = null;
        var overflowOutlinedVariant = null;
        for (var ovi = 0; ovi < orderedVariants.length; ovi++) {
          var overflowVariantLabel = String(orderedVariants[ovi] || "").toLowerCase();
          if (overflowVariantLabel === "default" && overflowDefaultVariant == null) overflowDefaultVariant = orderedVariants[ovi];
          if (overflowVariantLabel === "outlined" && overflowOutlinedVariant == null) overflowOutlinedVariant = orderedVariants[ovi];
        }
        if (overflowDefaultVariant == null && defaultVariant != null) overflowDefaultVariant = defaultVariant;
        if (overflowOutlinedVariant == null) overflowOutlinedVariant = overflowDefaultVariant;
        function makeOverflowPatch(variantName) {
          var patch = {};
          if (variantKey && variantName != null) patch[variantPropName] = variantName;
          if (radiusKey && defaultRadius != null) patch.Radius = defaultRadius;
          if (leftArrowKey && leftArrowOn != null) patch[leftArrowKey] = leftArrowOn;
          if (rightArrowKey && rightArrowOn != null) patch[rightArrowKey] = rightArrowOn;
          if (
            menuKey &&
            menuOn != null &&
            (String(variantName || "").toLowerCase() === "default" ||
              String(variantName || "").toLowerCase() === "outlined")
          ) {
            patch[menuKey] = menuOn;
          }
          return patch;
        }
        if (overflowDefaultSlot && overflowDefaultVariant != null) {
          addInstancesRow(overflowDefaultSlot, "Overflow Controls", [overflowDefaultVariant], function () {
            return makeInstance(makeOverflowPatch(overflowDefaultVariant));
          }, false);
        }
        if (overflowOutlinedSlot && overflowOutlinedVariant != null) {
          addInstancesRow(overflowOutlinedSlot, "Overflow Controls", [overflowOutlinedVariant], function () {
            return makeInstance(makeOverflowPatch(overflowOutlinedVariant));
          }, false);
        }
      }

      if (
        bothSlot &&
        leftIconKey &&
        rightIconKey &&
        iconLabels.length > 0 &&
        leftOn != null &&
        rightOn != null
      ) {
        clearChildren(bothSlot);
        addInstancesRow(bothSlot, "Both Icons", iconLabels, function (sizeName) {
          var patch = {};
          if (sizeKey) patch.Size = sizeName;
          patch[leftIconKey] = leftOn;
          patch[rightIconKey] = rightOn;
          return makeInstance(patch);
        }, false);
      }

      if (statesSlot && states.length > 0) {
        clearChildren(statesSlot);
        if (lowerSetName === "switch" || lowerSetName === "checkbox" || lowerSetName === "radio") {
          statesSlot.fills = [];
          statesSlot.strokes = [];
          statesSlot.strokeWeight = 0;
          statesSlot.paddingLeft = 0;
          statesSlot.paddingRight = 0;
          statesSlot.paddingTop = 0;
          statesSlot.paddingBottom = 0;
          statesSlot.cornerRadius = 0;
          statesSlot.itemSpacing = 12;
          statesSlot.counterAxisAlignItems = "MIN";
        }
        if (lowerSetName === "switch" && checkedKey && checkedOn != null) {
          var switchStatesOffPanel = createPanel("switch-states-checked-off-panel", 10);
          switchStatesOffPanel.resize(1192, switchStatesOffPanel.height);
          statesSlot.appendChild(switchStatesOffPanel);
          addInstancesRow(switchStatesOffPanel, "Checked Off", orderedStates, function (stateName) {
            return makeInstance({ State: stateName, Checked: checkedOff });
          }, true, { font: mediumFont, size: 14 });
          var switchStatesOnPanel = createPanel("switch-states-checked-on-panel", 10);
          switchStatesOnPanel.resize(1192, switchStatesOnPanel.height);
          statesSlot.appendChild(switchStatesOnPanel);
          addInstancesRow(switchStatesOnPanel, "Checked On", orderedStates, function (stateName) {
            return makeInstance({ State: stateName, Checked: checkedOn });
          }, true, { font: mediumFont, size: 14 });
        } else if (lowerSetName === "checkbox" && checkedKey && checkedUnchecked != null) {
          var checkboxVariants = (variantKey && orderedVariants.length > 0)
            ? orderedVariants.slice(0, 2)
            : [null];
          for (var cvi = 0; cvi < checkboxVariants.length; cvi++) {
            (function (checkboxVariantName) {
              var variantPatch = {};
              if (checkboxVariantName) variantPatch.Variant = checkboxVariantName;
              var variantStatesBlock = createStack("checkbox-states-block-" + normalizeName(checkboxVariantName || "default"), 8);
              if (checkboxVariantName) {
                var variantStatesHeader = createStack("checkbox-states-header-" + normalizeName(checkboxVariantName), 6);
                appendText(variantStatesHeader, titleFont, String(checkboxVariantName), 18, DOC_COLORS.panelHeading, "Checkbox States Variant Heading", "title");
                variantStatesBlock.appendChild(variantStatesHeader);
              }

              var checkboxStatesUncheckedPanel = createPanel("checkbox-states-" + normalizeName((checkboxVariantName || "default") + "-unchecked") + "-panel", 10);
              checkboxStatesUncheckedPanel.resize(1192, checkboxStatesUncheckedPanel.height);
              variantStatesBlock.appendChild(checkboxStatesUncheckedPanel);
              addInstancesRow(checkboxStatesUncheckedPanel, "Unchecked", orderedStates, function (stateName) {
                var patch = { State: stateName, Checked: checkedUnchecked };
                var patchKeys = Object.keys(variantPatch);
                for (var pui = 0; pui < patchKeys.length; pui++) patch[patchKeys[pui]] = variantPatch[patchKeys[pui]];
                return makeInstance(patch);
              }, true, { font: mediumFont, size: 14 });

              if (checkedOnValue != null) {
                var checkboxStatesCheckedPanel = createPanel("checkbox-states-" + normalizeName((checkboxVariantName || "default") + "-checked") + "-panel", 10);
                checkboxStatesCheckedPanel.resize(1192, checkboxStatesCheckedPanel.height);
                variantStatesBlock.appendChild(checkboxStatesCheckedPanel);
                addInstancesRow(checkboxStatesCheckedPanel, "Checked", orderedStates, function (stateName) {
                  var patch = { State: stateName, Checked: checkedOnValue };
                  var patchKeys = Object.keys(variantPatch);
                  for (var pui = 0; pui < patchKeys.length; pui++) patch[patchKeys[pui]] = variantPatch[patchKeys[pui]];
                  return makeInstance(patch);
                }, true, { font: mediumFont, size: 14 });
              }

              if (checkedIndeterminate != null) {
                var checkboxStatesIndeterminatePanel = createPanel("checkbox-states-" + normalizeName((checkboxVariantName || "default") + "-indeterminate") + "-panel", 10);
                checkboxStatesIndeterminatePanel.resize(1192, checkboxStatesIndeterminatePanel.height);
                variantStatesBlock.appendChild(checkboxStatesIndeterminatePanel);
                addInstancesRow(checkboxStatesIndeterminatePanel, "Indeterminate", orderedStates, function (stateName) {
                  var patch = { State: stateName, Checked: checkedIndeterminate };
                  var patchKeys = Object.keys(variantPatch);
                  for (var pui = 0; pui < patchKeys.length; pui++) patch[patchKeys[pui]] = variantPatch[patchKeys[pui]];
                  return makeInstance(patch);
                }, true, { font: mediumFont, size: 14 });
              }
              statesSlot.appendChild(variantStatesBlock);
            })(checkboxVariants[cvi]);
          }
        } else if (lowerSetName === "radio" && checkedKey && checkedOn != null) {
          var radioVariants = (variantKey && orderedVariants.length > 0)
            ? orderedVariants.slice(0, 2)
            : [null];
          for (var rvi = 0; rvi < radioVariants.length; rvi++) {
            (function (radioVariantName) {
              var variantPatch = {};
              if (radioVariantName) variantPatch.Variant = radioVariantName;
              var variantStatesBlock = createStack("radio-states-block-" + normalizeName(radioVariantName || "default"), 8);
              if (radioVariantName) {
                var variantStatesHeader = createStack("radio-states-header-" + normalizeName(radioVariantName), 6);
                appendText(variantStatesHeader, titleFont, String(radioVariantName), 18, DOC_COLORS.panelHeading, "Radio States Variant Heading", "title");
                variantStatesBlock.appendChild(variantStatesHeader);
              }

              var radioStatesOffPanel = createPanel("radio-states-" + normalizeName((radioVariantName || "default") + "-checked-off") + "-panel", 10);
              radioStatesOffPanel.resize(1192, radioStatesOffPanel.height);
              variantStatesBlock.appendChild(radioStatesOffPanel);
              addInstancesRow(radioStatesOffPanel, "Checked Off", orderedStates, function (stateName) {
                var patch = { State: stateName, Checked: checkedOff };
                var patchKeys = Object.keys(variantPatch);
                for (var pui = 0; pui < patchKeys.length; pui++) patch[patchKeys[pui]] = variantPatch[patchKeys[pui]];
                return makeInstance(patch);
              }, true, { font: mediumFont, size: 14 });

              var radioStatesOnPanel = createPanel("radio-states-" + normalizeName((radioVariantName || "default") + "-checked-on") + "-panel", 10);
              radioStatesOnPanel.resize(1192, radioStatesOnPanel.height);
              variantStatesBlock.appendChild(radioStatesOnPanel);
              addInstancesRow(radioStatesOnPanel, "Checked On", orderedStates, function (stateName) {
                var patch = { State: stateName, Checked: checkedOn };
                var patchKeys = Object.keys(variantPatch);
                for (var pui = 0; pui < patchKeys.length; pui++) patch[patchKeys[pui]] = variantPatch[patchKeys[pui]];
                return makeInstance(patch);
              }, true, { font: mediumFont, size: 14 });

              statesSlot.appendChild(variantStatesBlock);
            })(radioVariants[rvi]);
          }
        } else if (lowerSetName === "divider") {
          renderDividerDocsRows(statesSlot, orderedStates, function (stateName) {
            return makeInstance({ State: stateName });
          });
        } else {
          addInstancesRow(statesSlot, "States", orderedStates, function (stateName) {
              return makeInstance({ State: stateName });
            }, false, lowerSetName === "card"
              ? { itemsPerRow: 3 }
              : (lowerSetName === "tabs"
                  ? { itemsPerRow: 2, rowItemSpacing: 20 }
                  : (lowerSetName === "divider"
                      ? { itemsPerRow: 2, rowItemSpacing: 84, instancePaddingX: 22, instancePaddingY: 10 }
                  : (normalizedSetName === "accordionitem"
                      ? { itemsPerRow: 1, rowItemSpacing: 12 }
                      : null))));
        }
      }

      if (selectDropdownSlot) {
        clearChildren(selectDropdownSlot);
        var selectDocDropdownFillValues = pickOrdered(getPropValues(variantProps, "Dropdown"), ["Closed", "Open"]);
        addInstancesRow(
          selectDropdownSlot,
          "Dropdown",
          selectDocDropdownFillValues,
          function (dropdownName) {
            return makeInstance({ Dropdown: dropdownName });
          },
          false,
          { itemsPerRow: 2, rowItemSpacing: 24 }
        );
      }

      if (burgerOpenedSlot) {
        clearChildren(burgerOpenedSlot);
        var burgerDocOpenedFill = pickOrdered(getPropValues(variantProps, "Opened"), ["False", "True"]);
        addInstancesRow(
          burgerOpenedSlot,
          "Opened",
          burgerDocOpenedFill,
          function (openedName) {
            return makeInstance({ Opened: openedName });
          },
          false,
          { itemsPerRow: 2, rowItemSpacing: 24 }
        );
      }

      if (weightSlot && orderedTextWeights.length > 0) {
        clearChildren(weightSlot);
        for (var wsi = 0; wsi < orderedTextWeights.length; wsi++) {
          (function (weightName) {
            addInstancesRow(weightSlot, "Weight", [weightName], function (innerWeightName) {
              return makeInstance({ Weight: innerWeightName });
            }, false);
          })(orderedTextWeights[wsi]);
        }
      }

      if (colorSlot && orderedTextColors.length > 0) {
        clearChildren(colorSlot);
        for (var csi = 0; csi < orderedTextColors.length; csi++) {
          (function (colorName) {
            addInstancesRow(colorSlot, "Color", [colorName], function (innerColorName) {
              return makeInstance({ Color: innerColorName });
            }, false);
          })(orderedTextColors[csi]);
        }
      }

      if (lowerSetName === "notification" && baseComponent) {
        var notifProgColors = colorKey ? getPropValues(variantProps, "Color") : [];
        var notifProgRadii = radiusKey ? getPropValues(variantProps, "Radius") : [];
        var notifProgBorderKey = getPropKey(variantProps, "Border") ? "Border" : (getPropKey(variantProps, "WithBorder") ? "WithBorder" : null);
        var notifProgCloseKey = getPropKey(variantProps, "Close") ? "Close" : (getPropKey(variantProps, "WithCloseButton") ? "WithCloseButton" : null);
        var notifProgIconKey = getPropKey(variantProps, "Icon") ? "Icon" : (getPropKey(variantProps, "WithIcon") ? "WithIcon" : null);
        var notifProgLoadingKey = getPropKey(variantProps, "Loading") ? "Loading" : null;
        var notifProgAccentKey = getPropKey(variantProps, "Accent") ? "Accent" : null;
        var notifProgBorderVals = notifProgBorderKey ? getPropValues(variantProps, notifProgBorderKey) : [];
        var notifProgCloseVals = notifProgCloseKey ? getPropValues(variantProps, notifProgCloseKey) : [];
        var notifProgIconVals = notifProgIconKey ? getPropValues(variantProps, notifProgIconKey) : [];
        var notifProgLoadingVals = notifProgLoadingKey ? getPropValues(variantProps, notifProgLoadingKey) : [];
        var notifProgAccentVals = notifProgAccentKey ? getPropValues(variantProps, notifProgAccentKey) : [];
        function notifProgToggleOn(values) {
          if (!values || !values.length) return null;
          for (var i = 0; i < values.length; i++) {
            var v = String(values[i] || "").toLowerCase();
            if (v === "on" || v === "true") return values[i];
          }
          return values[0];
        }
        function notifProgToggleOff(values) {
          if (!values || !values.length) return null;
          for (var i = 0; i < values.length; i++) {
            var v = String(values[i] || "").toLowerCase();
            if (v === "off" || v === "false") return values[i];
          }
          return values[0];
        }
        var notifProgDefaultColor = null;
        if (notifProgColors.length > 0) {
          for (var npci = 0; npci < notifProgColors.length; npci++) {
            if (String(notifProgColors[npci] || "").toLowerCase() === "primary") {
              notifProgDefaultColor = notifProgColors[npci];
              break;
            }
          }
          if (notifProgDefaultColor == null) notifProgDefaultColor = notifProgColors[0];
        }
        var notifProgDefaultRadius = pickDefaultSizeValue(notifProgRadii);
        var notifProgBorderOn = notifProgToggleOn(notifProgBorderVals);
        var notifProgBorderOff = notifProgToggleOff(notifProgBorderVals);
        var notifProgCloseOn = notifProgToggleOn(notifProgCloseVals);
        var notifProgCloseOff = notifProgToggleOff(notifProgCloseVals);
        var notifProgIconOn = notifProgToggleOn(notifProgIconVals);
        var notifProgIconOff = notifProgToggleOff(notifProgIconVals);
        var notifProgLoadingOn = notifProgToggleOn(notifProgLoadingVals);
        var notifProgLoadingOff = notifProgToggleOff(notifProgLoadingVals);
        var notifProgAccentOn = notifProgToggleOn(notifProgAccentVals);
        var notifProgAccentOff = notifProgToggleOff(notifProgAccentVals);
        if (notifProgColors.length > 0) {
          doc.appendChild(createSectionHeader("Colors", "Semantic tones for accent, border, and indicators.", DOC_COLORS.subtitle));
          var notifProgColorPanel = createPanel("notification-programmatic-colors", 10);
          notifProgColorPanel.resize(1192, notifProgColorPanel.height);
          doc.appendChild(notifProgColorPanel);
          addInstancesRow(
            notifProgColorPanel,
            "Color",
            notifProgColors,
            function (cName) {
              return makeInstance({ Color: cName });
            },
            false,
            { itemsPerRow: 3 }
          );
        }
        var notifProgHasToggles =
          notifProgBorderVals.length > 1 ||
          notifProgCloseVals.length > 1 ||
          notifProgIconVals.length > 1 ||
          notifProgLoadingVals.length > 1 ||
          notifProgAccentVals.length > 1;
        if (notifProgHasToggles) {
          doc.appendChild(createSectionHeader("Variants", "Curated notification configurations for common use cases.", DOC_COLORS.subtitle));
          function makeNotifProgBasePatch() {
            var patch = {};
            if (notifProgDefaultColor != null) patch.Color = notifProgDefaultColor;
            if (notifProgDefaultRadius != null) patch.Radius = notifProgDefaultRadius;
            if (notifProgBorderKey && notifProgBorderOff != null) patch[notifProgBorderKey] = notifProgBorderOff;
            if (notifProgCloseKey && notifProgCloseOff != null) patch[notifProgCloseKey] = notifProgCloseOff;
            if (notifProgIconKey && notifProgIconOff != null) patch[notifProgIconKey] = notifProgIconOff;
            if (notifProgLoadingKey && notifProgLoadingOff != null) patch[notifProgLoadingKey] = notifProgLoadingOff;
            if (notifProgAccentKey && notifProgAccentOff != null) patch[notifProgAccentKey] = notifProgAccentOff;
            return patch;
          }
          function appendNotifProgOptionCard(cardName, cardSubtitle, labels, patchForLabel, itemsPerRow) {
            if (!labels || !labels.length) return;
            var block = createStack("notification-programmatic-option-block-" + normalizeName(cardName), 8);
            appendText(block, titleFont, cardName, 18, DOC_COLORS.panelHeading, "Notification Option Heading", "title");
            appendText(block, bodyFont, cardSubtitle, 12, DOC_COLORS.panelBody, "Notification Option Subtitle");
            var panel = createPanel("notification-programmatic-option-card-" + normalizeName(cardName), 10);
            panel.resize(1192, panel.height);
            block.appendChild(panel);
            doc.appendChild(block);
            addInstancesRow(
              panel,
              cardName,
              labels,
              function (label) { return makeInstance(patchForLabel(label)); },
              false,
              itemsPerRow ? { itemsPerRow: itemsPerRow } : null
            );
          }
          var notifProgOrderedColors = notifProgColors.length > 0
            ? pickOrdered(notifProgColors, ["Primary", "Dark", "Error", "Warning", "Success"])
            : [];
          if (notifProgBorderVals.length > 1 && notifProgBorderKey && notifProgOrderedColors.length > 0) {
            appendNotifProgOptionCard(
              "Border",
              "Bordered notifications across semantic colors.",
              notifProgOrderedColors,
              function (colorName) {
                var patch = makeNotifProgBasePatch();
                patch.Color = colorName;
                if (notifProgBorderOn != null) patch[notifProgBorderKey] = notifProgBorderOn;
                if (notifProgAccentKey && notifProgAccentOn != null) patch[notifProgAccentKey] = notifProgAccentOn;
                return patch;
              },
              3
            );
          }
          if (notifProgCloseVals.length > 1 && notifProgCloseKey && notifProgDefaultColor != null) {
            appendNotifProgOptionCard(
              "Close",
              "Primary notification with close control enabled.",
              [notifProgDefaultColor],
              function () {
                var patch = makeNotifProgBasePatch();
                if (notifProgCloseOn != null) patch[notifProgCloseKey] = notifProgCloseOn;
                return patch;
              },
              1
            );
          }
          if (notifProgIconVals.length > 1 && notifProgIconKey && notifProgDefaultColor != null) {
            appendNotifProgOptionCard(
              "Icon",
              "Primary notification with leading icon enabled.",
              [notifProgDefaultColor],
              function () {
                var patch = makeNotifProgBasePatch();
                if (notifProgIconOn != null) patch[notifProgIconKey] = notifProgIconOn;
                return patch;
              },
              1
            );
          }
          if (notifProgLoadingVals.length > 1 && notifProgLoadingKey && notifProgDefaultColor != null) {
            appendNotifProgOptionCard(
              "Loader",
              "Primary notification with loading state enabled.",
              [notifProgDefaultColor],
              function () {
                var patch = makeNotifProgBasePatch();
                if (notifProgLoadingOn != null) patch[notifProgLoadingKey] = notifProgLoadingOn;
                return patch;
              },
              1
            );
          }
          if (notifProgAccentVals.length > 1 && notifProgAccentKey && notifProgDefaultColor != null) {
            appendNotifProgOptionCard(
              "No Accent",
              "Primary notification with accent bar disabled.",
              [notifProgDefaultColor],
              function () {
                var patch = makeNotifProgBasePatch();
                if (notifProgAccentOff != null) patch[notifProgAccentKey] = notifProgAccentOff;
                if (notifProgLoadingKey && notifProgLoadingOff != null) patch[notifProgLoadingKey] = notifProgLoadingOff;
                return patch;
              },
              1
            );
          }
        }
        if (notifProgRadii.length > 1) {
          doc.appendChild(createSectionHeader("Radius", "Corner radius scale.", DOC_COLORS.subtitle));
          var notifProgRadPanel = createPanel("notification-programmatic-radii", 10);
          notifProgRadPanel.resize(1192, notifProgRadPanel.height);
          doc.appendChild(notifProgRadPanel);
          addInstancesRow(
            notifProgRadPanel,
            "Radius",
            pickOrdered(notifProgRadii, ["Default", "XS", "SM", "MD", "LG", "XL"]).slice(0, 6),
            function (rName) {
              return makeInstance({ Radius: rName });
            },
            false,
            { itemsPerRow: 3 }
          );
        }
      }

      // Progress docs should include radius examples explicitly.
      if (lowerSetName === "progress" && radiusKey && orderedRadiiAll.length > 1) {
        doc.appendChild(createSectionHeader("Radius", "Corner radius scale.", DOC_COLORS.subtitle));
        var progressRadPanel = createPanel("progress-programmatic-radii", 10);
        progressRadPanel.resize(1192, progressRadPanel.height);
        doc.appendChild(progressRadPanel);
        addInstancesRow(
          progressRadPanel,
          "Radius",
          orderedRadiiAll,
          function (rName) {
            return makeInstance({ Radius: rName });
          },
          false,
          { itemsPerRow: 3 }
        );
      }

      if ((lowerSetName === "tooltip" || lowerSetName === "popover") && baseComponent) {
        var ttProgDirKey = getPropKey(variantProps, "Direction");
        var ttProgArrowKey = getPropKey(variantProps, "Arrow");
        var ttProgDirs = ttProgDirKey ? getPropValues(variantProps, "Direction") : [];
        var ttProgArrows = ttProgArrowKey ? getPropValues(variantProps, "Arrow") : [];
        var ttProgDefArrow = null;
        var ttProgDefDir = null;
        for (var tpa = 0; tpa < ttProgArrows.length; tpa++) {
          var al2 = String(ttProgArrows[tpa] || "").toLowerCase();
          if (al2.indexOf("without") < 0 && al2.indexOf("with") >= 0) {
            ttProgDefArrow = ttProgArrows[tpa];
            break;
          }
        }
        if (ttProgDefArrow == null && ttProgArrows.length > 0) ttProgDefArrow = ttProgArrows[0];
        for (var tpd = 0; tpd < ttProgDirs.length; tpd++) {
          if (String(ttProgDirs[tpd] || "").toLowerCase() === "top") {
            ttProgDefDir = ttProgDirs[tpd];
            break;
          }
        }
        if (ttProgDefDir == null && ttProgDirs.length > 0) ttProgDefDir = ttProgDirs[0];

        if (ttProgDirs.length > 0 && ttProgDefArrow != null) {
          doc.appendChild(createSectionHeader("Direction", "Tooltip placement relative to the trigger.", DOC_COLORS.subtitle));
          var ttProgDirPanel = createPanel("tooltip-programmatic-direction", 10);
          ttProgDirPanel.resize(1192, ttProgDirPanel.height);
          doc.appendChild(ttProgDirPanel);
          var ttProgOrderedDirs = pickOrdered(ttProgDirs, ["top", "bottom", "left", "right"]);
          addInstancesRow(
            ttProgDirPanel,
            "Direction",
            ttProgOrderedDirs,
            function (dirName) {
              var p = {};
              if (ttProgDirKey) p.Direction = dirName;
              if (ttProgArrowKey) p.Arrow = ttProgDefArrow;
              return makeInstance(p);
            },
            false,
            { itemsPerRow: 4 }
          );
        }
        if (ttProgArrows.length > 1 && ttProgDefDir != null) {
          doc.appendChild(createSectionHeader("Arrow", "Pointer on or off for each placement.", DOC_COLORS.subtitle));
          var ttProgArrowPanel = createPanel("tooltip-programmatic-arrow", 10);
          ttProgArrowPanel.resize(1192, ttProgArrowPanel.height);
          doc.appendChild(ttProgArrowPanel);
          var ttProgOrderedArrows = pickOrdered(ttProgArrows, ["with-arrow", "without-arrow"]);
          addInstancesRow(
            ttProgArrowPanel,
            "Arrow",
            ttProgOrderedArrows,
            function (arrowName) {
              var p2 = {};
              if (ttProgDirKey) p2.Direction = ttProgDefDir;
              if (ttProgArrowKey) p2.Arrow = arrowName;
              return makeInstance(p2);
            },
            false,
            { itemsPerRow: 2 }
          );
        }
      }

      // Components without Variant/Size/State/Icon axes (e.g. Table, TableHeader)
      // still need at least one concrete preview instance.
      if (!hasVariants && !hasSizes && !hasStates && !hasIcons) {
        doc.appendChild(createSectionHeader("Example", "Default component preview.", DOC_COLORS.subtitle));
        var plainExamplePanel = createPanel("plain-example", 10);
        plainExamplePanel.resize(1192, plainExamplePanel.height);
        doc.appendChild(plainExamplePanel);
        addInstancesRow(
          plainExamplePanel,
          "Example",
          [""],
          function () { return makeInstance({}); },
          false
        );
      }
    }

    clearExplicitModesInSubtree(doc);
    applyDocVariableBindings(doc);

    docsPage.appendChild(doc);
    doc.x = docsX;
    doc.y = docsY;
    docsY += nodeRenderedHeight(doc) + docsGap;
    docsCreated++;
    } catch (docErr) {
      var safeSetName = (set && set.name) ? set.name : ("Component " + (si + 1));
      progress("Docs component skipped (" + safeSetName + "): " + String(docErr));
      docsSkipped++;
      try {
        var fallback = figma.createFrame();
        fallback.name = "__AUTO_DOCS__ - " + safeSetName + " (fallback)";
        fallback.layoutMode = "VERTICAL";
        fallback.primaryAxisSizingMode = "AUTO";
        fallback.counterAxisSizingMode = "AUTO";
        fallback.counterAxisAlignItems = "MIN";
        fallback.itemSpacing = 8;
        fallback.paddingLeft = 24;
        fallback.paddingRight = 24;
        fallback.paddingTop = 24;
        fallback.paddingBottom = 24;
        fallback.cornerRadius = 8;
        fallback.fills = [{ type: "SOLID", color: { r: 0.09, g: 0.1, b: 0.14 } }];
        appendText(fallback, titleFont, safeSetName, 26, { r: 0.91, g: 0.92, b: 0.94 }, "Fallback Title");
        appendText(
          fallback,
          bodyFont,
          "Docs auto-generation skipped for this component. See sync progress logs for details.",
          12,
          { r: 0.85, g: 0.45, b: 0.45 },
          "Fallback Message"
        );
        docsPage.appendChild(fallback);
        fallback.x = docsX;
        fallback.y = docsY;
        docsY += nodeRenderedHeight(fallback) + docsGap;
      } catch (fallbackErr) {
        progress("Docs fallback failed (" + safeSetName + "): " + String(fallbackErr));
      }
    }
  }
  progress("Usage docs generated on page: Component Documentation (created: " + docsCreated + ", skipped: " + docsSkipped + ")");
  return { created: docsCreated, skipped: docsSkipped };
}

async function cleanupExistingComponents(page, requestedSet) {
  var pageNodes = figma.root.children;
  for (var pi = 0; pi < pageNodes.length; pi++) {
    var p = pageNodes[pi];
    if (p.type !== "PAGE") continue;
    try {
      await p.loadAsync();
    } catch (loadErr) {
      progress("Skipping cleanup for page '" + p.name + "': " + String(loadErr));
      continue;
    }
    var children = p.children;
    for (var i = children.length - 1; i >= 0; i--) {
      var child = children[i];
      var childNormalizedName = normalizeComponentKey(child.name);
      if (child.type === "COMPONENT_SET") {
        var componentKey = resolveManagedComponentKeyFromName(child.name);
        if (componentKey && (!requestedSet || requestedSet[componentKey])) {
          child.remove();
          continue;
        }
      }
      // Single-component exports (e.g. TableHeader with boolean props, not a variant set).
      if (child.type === "COMPONENT") {
        var singleKey = resolveManagedComponentKeyFromName(child.name);
        var singleNorm = normalizeComponentKey(child.name);
        if (
          singleKey === "table" &&
          (singleNorm === "table" || singleNorm === "tableheader" || singleNorm === "tablebody") &&
          (!requestedSet || requestedSet.table)
        ) {
          child.remove();
          continue;
        }
      }
      // Legacy: old table shipped as a FRAME named "Table — library".
      if (child.type === "FRAME" && normalizeComponentKey(child.name) === "tablelibrary") {
        if (!requestedSet || requestedSet.table) {
          child.remove();
          continue;
        }
      }
      // Legacy cleanup: older Tabs exports could leave stray top-level "Disabled" assets.
      if (isLegacyTabsDisabledArtifact(child)) {
        child.remove();
        continue;
      }
      // Also clean up standalone components from failed previous runs
      if (child.type === "COMPONENT" && (
        child.name.indexOf("Variant=") === 0 || child.name.indexOf("State=") === 0 ||
        child.name.indexOf("Size=") === 0 || child.name.indexOf("Checked=") === 0 ||
        child.name.indexOf("Label=") === 0 || child.name.indexOf("Direction=") === 0 ||
        child.name.indexOf("Circle=") === 0
      )) {
        child.remove();
      }
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
// Foundations documentation (colors, radius, spacing, typography)
// ---------------------------------------------------------------------------

async function buildFoundationsDocsPage(payload, titleFont) {
  var bodyFont = { family: titleFont.family, style: "Regular" };
  try { await figma.loadFontAsync(bodyFont); } catch (_bfErr) { bodyFont = titleFont; }
  var mediumFont = { family: titleFont.family, style: "Medium" };
  try { await figma.loadFontAsync(mediumFont); } catch (_mfErr) { mediumFont = bodyFont; }

  var DOC = {
    pageBg: { r: 0.094, g: 0.098, b: 0.149 },
    panelBg: { r: 0.141, g: 0.149, b: 0.235 },
    panelStroke: { r: 0.224, g: 0.235, b: 0.337 },
    title: { r: 1, g: 1, b: 1 },
    heading: { r: 0, g: 0.424, b: 0.843 },
    subtitle: { r: 0.651, g: 0.671, b: 0.718 },
    body: { r: 0.639, g: 0.671, b: 0.729 },
    label: { r: 0.651, g: 0.69, b: 0.749 },
    accent: { r: 0.302, g: 0.671, b: 0.969 }
  };

  // ── Variable lookups for binding ──
  var collections = [];
  try { collections = await figma.variables.getLocalVariableCollectionsAsync(); } catch (_colErr) {}
  var colNameById = {};
  for (var ci = 0; ci < collections.length; ci++) {
    colNameById[collections[ci].id] = String(collections[ci].name || "");
  }
  var colorVars = [];
  try { colorVars = await figma.variables.getLocalVariablesAsync("COLOR"); } catch (_cvErr) {}
  var floatVars = [];
  try { floatVars = await figma.variables.getLocalVariablesAsync("FLOAT"); } catch (_fvErr) {}
  var stringVars = [];
  try { stringVars = await figma.variables.getLocalVariablesAsync("STRING"); } catch (_svErr) {}

  var semScalarByName = {};
  for (var fvi = 0; fvi < floatVars.length; fvi++) {
    if ((colNameById[floatVars[fvi].variableCollectionId] || "") === "Semantic") {
      semScalarByName[String(floatVars[fvi].name)] = floatVars[fvi];
    }
  }
  for (var svi = 0; svi < stringVars.length; svi++) {
    if ((colNameById[stringVars[svi].variableCollectionId] || "") === "Semantic") {
      semScalarByName[String(stringVars[svi].name)] = stringVars[svi];
    }
  }

  function cap(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }

  // ── Resolve Semantic surface/text vars so doc chrome matches (and switches with) the rest of the docs ──
  var docColorVarByName = {};
  for (var dcv = 0; dcv < colorVars.length; dcv++) {
    var dcvVar = colorVars[dcv];
    if (!dcvVar || !dcvVar.name) continue;
    var dcvName = String(dcvVar.name);
    var dcvCol = (colNameById[dcvVar.variableCollectionId] || "").toLowerCase();
    if (!docColorVarByName[dcvName] || dcvCol === "semantic") docColorVarByName[dcvName] = dcvVar;
  }
  function normName(v) { return String(v || "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
  function resolveDocVar(cands) {
    for (var i = 0; i < cands.length; i++) { if (docColorVarByName[cands[i]]) return docColorVarByName[cands[i]]; }
    var allN = Object.keys(docColorVarByName);
    for (var a = 0; a < allN.length; a++) {
      var vn = normName(allN[a]);
      for (var c = 0; c < cands.length; c++) {
        var cn = normName(cands[c]); if (!cn) continue;
        if (vn === cn || vn.endsWith(cn)) return docColorVarByName[allN[a]];
      }
    }
    return null;
  }
  var docVars = {
    pageBg: resolveDocVar(["surface-primary", "surface/primary", "surface primary", "subtle-primary", "subtle/primary", "subtle primary"]),
    panelBg: resolveDocVar(["surface-secondary", "surface/secondary", "surface secondary", "subtle-secondary", "subtle/secondary", "subtle secondary"]),
    panelStroke: resolveDocVar(["border-primary", "border/primary", "border primary"]),
    heading: resolveDocVar(["interactive-primary", "interactive/primary", "interactive primary"]),
    title: resolveDocVar(["text-default", "text/default", "text default"]),
    textSubtle: resolveDocVar(["text-subtle", "text/subtle", "text subtle"])
  };

  // ── Node helpers ──
  function appendText(parent, font, text, size, color, name) {
    var t = figma.createText();
    t.name = name || "Text";
    t.fontName = font;
    t.fontSize = size;
    t.characters = String(text);
    t.fills = [{ type: "SOLID", color: color }];
    parent.appendChild(t);
    return t;
  }
  function fixedText(parent, font, text, size, color, name, width) {
    var t = appendText(parent, font, text, size, color, name);
    try { t.textAutoResize = "HEIGHT"; } catch (_tarErr) {}
    try { t.layoutSizingHorizontal = "FIXED"; } catch (_lshErr) {}
    try { t.resize(width, t.height); } catch (_resErr) {}
    return t;
  }
  function stack(name, dir, spacing, align) {
    var f = figma.createFrame();
    f.name = name || "Stack";
    f.layoutMode = dir;
    f.primaryAxisSizingMode = "AUTO";
    f.counterAxisSizingMode = "AUTO";
    f.counterAxisAlignItems = align || "MIN";
    f.itemSpacing = spacing;
    f.clipsContent = false;
    f.fills = [];
    return f;
  }
  function panel(name, spacing) {
    var p = stack(name, "VERTICAL", spacing, "MIN");
    p.paddingLeft = 16; p.paddingRight = 16; p.paddingTop = 16; p.paddingBottom = 16;
    p.cornerRadius = 6;
    p.fills = [{ type: "SOLID", color: DOC.panelBg }];
    p.strokes = [{ type: "SOLID", color: DOC.panelStroke }];
    p.strokeWeight = 1;
    return p;
  }
  // Match the width of the other component docs (content area = 1192 inside 64 padding).
  var CONTENT_WIDTH = 1192;
  function fillWidth(node) {
    try { node.counterAxisSizingMode = "FIXED"; } catch (_caErr) {}
    try { node.resize(CONTENT_WIDTH, node.height); } catch (_fwErr) {}
    return node;
  }
  function sectionHeader(parent, title, subtitle) {
    var h = stack("Section Header", "VERTICAL", 6, "MIN");
    appendText(h, titleFont, title, 20, DOC.heading, "Section Heading");
    if (subtitle) appendText(h, bodyFont, subtitle, 13, DOC.subtitle, "Section Subtitle");
    parent.appendChild(h);
    return h;
  }
  function swatch(size, hex, radius) {
    var r = figma.createFrame();
    r.name = "Swatch";
    r.resize(size, size);
    r.cornerRadius = radius || 4;
    r.fills = [{ type: "SOLID", color: hexToFigmaRgb(hex) }];
    r.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0.08 }];
    r.strokeWeight = 1;
    return r;
  }

  // ── Find / reset docs page ──
  var docsPage = null;
  for (var pi = 0; pi < figma.root.children.length; pi++) {
    var pg = figma.root.children[pi];
    if (pg && pg.type === "PAGE" && pg.name === "Component Documentation") { docsPage = pg; break; }
  }
  if (!docsPage) {
    docsPage = figma.createPage();
    docsPage.name = "Component Documentation";
  }
  try { await docsPage.loadAsync(); } catch (_lpErr) {}

  var minY = 0; var haveChildren = false;
  for (var ei = docsPage.children.length - 1; ei >= 0; ei--) {
    var existing = docsPage.children[ei];
    if (existing && String(existing.name || "") === "__AUTO_DOCS__ - Foundations") {
      try { existing.remove(); } catch (_reErr) {}
      continue;
    }
    if (existing && typeof existing.y === "number") {
      if (!haveChildren || existing.y < minY) { minY = existing.y; haveChildren = true; }
    }
  }

  // ── Build frame ──
  var doc = figma.createFrame();
  doc.name = "__AUTO_DOCS__ - Foundations";
  doc.layoutMode = "VERTICAL";
  doc.primaryAxisSizingMode = "AUTO";
  doc.counterAxisSizingMode = "AUTO";
  doc.counterAxisAlignItems = "MIN";
  doc.itemSpacing = 36;
  doc.paddingLeft = 64; doc.paddingRight = 64; doc.paddingTop = 64; doc.paddingBottom = 64;
  doc.cornerRadius = 0;
  doc.clipsContent = false;
  doc.fills = [{ type: "SOLID", color: DOC.pageBg }];
  docsPage.appendChild(doc);
  doc.resize(CONTENT_WIDTH + 128, doc.height);

  var intro = stack("Intro", "VERTICAL", 8, "MIN");
  appendText(intro, titleFont, "Foundations", 28, DOC.title, "Component Title");
  appendText(intro, bodyFont, "Color, radius, spacing, and typography primitives. All sections switch with the brand/theme appearance, like the rest of the docs.", 14, DOC.subtitle, "Component Subtitle");
  doc.appendChild(intro);

  // ── Determine the current brand (matches the page's preview brand) ──
  var buildOpts = payload.__buildOptions || {};
  var requestedBrand = String(buildOpts.activeBrand || "").toLowerCase();
  var brandIds = [];
  var pkeys = Object.keys(payload);
  for (var bki = 0; bki < pkeys.length; bki++) {
    var key0 = pkeys[bki];
    if (key0 === "__buildOptions") continue;
    if (payload[key0] && payload[key0].primitives) brandIds.push(key0);
  }
  var currentBrandId = (requestedBrand && payload[requestedBrand] && payload[requestedBrand].primitives)
    ? requestedBrand
    : (brandIds.length ? brandIds[0] : null);

  // ── Multi-mode primitives collection ──
  // Mirrors how the rest of the docs switch brand/theme: a collection with one
  // mode per brand+theme, so the appearance dropdown drives the color swatches.
  var THEMES = ["light", "dark"];
  var primModeEntries = [];
  for (var pmi = 0; pmi < brandIds.length; pmi++) {
    var pmBrand = brandIds[pmi];
    var pmCap = cap(pmBrand);
    for (var pti = 0; pti < THEMES.length; pti++) {
      primModeEntries.push({ key: pmBrand + "-" + THEMES[pti], name: pmCap + cap(THEMES[pti]) });
    }
  }
  var primCol = null;
  var primModes = { modeMap: {} };
  var primVarByName = {};   // "family/index" -> COLOR var
  var hexVarByName = {};    // "family/index" -> STRING var (hex label, switches per brand)
  var presentVarByFam = {}; // "family" -> BOOLEAN var (true when brand has the family)
  var famUnion = [];        // ordered families across all brands
  var famMaxLen = {};       // family -> longest ramp across brands
  if (brandIds.length) {
    try {
      primCol = findOrCreateCollection(collections, "Primitive/Brands");
      primModes = ensureCollectionModes(primCol, primModeEntries);
      var existingByName = {};
      for (var pcv = 0; pcv < colorVars.length; pcv++) {
        if ((colNameById[colorVars[pcv].variableCollectionId] || "") === "Primitive/Brands") {
          primVarByName[String(colorVars[pcv].name)] = colorVars[pcv];
        }
      }
      var allLocalVars = [];
      try { allLocalVars = await figma.variables.getLocalVariablesAsync(); } catch (_alvErr) { allLocalVars = []; }
      for (var alv = 0; alv < allLocalVars.length; alv++) {
        if ((colNameById[allLocalVars[alv].variableCollectionId] || "") === "Primitive/Brands") {
          existingByName[String(allLocalVars[alv].name)] = allLocalVars[alv];
        }
      }
      function ensurePrimVar(name, type) {
        var v = existingByName[name];
        if (v && v.resolvedType === type) return v;
        try { v = figma.variables.createVariable(name, primCol, type); existingByName[name] = v; return v; }
        catch (_epvErr) { return null; }
      }

      // Union of families + per-family presence map across brands.
      var presenceByFam = {}; // family -> { brandId: true }
      for (var pbi = 0; pbi < brandIds.length; pbi++) {
        var pbId = brandIds[pbi];
        var pbPalettes = payload[pbId].primitives || {};
        var pbFams = Object.keys(pbPalettes);
        for (var pfi = 0; pfi < pbFams.length; pfi++) {
          var pbFam = pbFams[pfi];
          var pbRamp = pbPalettes[pbFam];
          if (!pbRamp || !pbRamp.length) continue;
          if (famUnion.indexOf(pbFam) < 0) famUnion.push(pbFam);
          famMaxLen[pbFam] = Math.max(famMaxLen[pbFam] || 0, pbRamp.length);
          if (!presenceByFam[pbFam]) presenceByFam[pbFam] = {};
          presenceByFam[pbFam][pbId] = true;
        }
      }

      // Color + hex string vars per family/index, set per mode.
      for (var pbi2 = 0; pbi2 < brandIds.length; pbi2++) {
        var pbId2 = brandIds[pbi2];
        var pbPalettes2 = payload[pbId2].primitives || {};
        for (var fu = 0; fu < famUnion.length; fu++) {
          var fuFam = famUnion[fu];
          var fuRamp = pbPalettes2[fuFam];
          var fuLen = famMaxLen[fuFam] || 0;
          for (var fri = 0; fri < fuLen; fri++) {
            var hex = (fuRamp && fuRamp[fri]) ? fuRamp[fri] : null;
            var colorV = ensurePrimVar(fuFam + "/" + fri, "COLOR");
            var hexV = ensurePrimVar(fuFam + "/" + fri + "/hex", "STRING");
            if (colorV) primVarByName[fuFam + "/" + fri] = colorV;
            if (hexV) hexVarByName[fuFam + "/" + fri] = hexV;
            for (var pthi = 0; pthi < THEMES.length; pthi++) {
              var pmId = primModes.modeMap[pbId2 + "-" + THEMES[pthi]];
              if (!pmId) continue;
              if (colorV && hex) { try { colorV.setValueForMode(pmId, hexToFigmaRgb(hex)); } catch (_cvmErr) {} }
              if (hexV) { try { hexV.setValueForMode(pmId, hex ? String(hex).toUpperCase() : ""); } catch (_hvmErr) {} }
            }
          }
        }
      }

      // Presence boolean per family, set per mode (true only when that brand has the family).
      for (var fu2 = 0; fu2 < famUnion.length; fu2++) {
        var fuFam2 = famUnion[fu2];
        var presV = ensurePrimVar(fuFam2 + "/present", "BOOLEAN");
        if (!presV) continue;
        presentVarByFam[fuFam2] = presV;
        for (var pbi3 = 0; pbi3 < brandIds.length; pbi3++) {
          var pbId3 = brandIds[pbi3];
          var has = !!(presenceByFam[fuFam2] && presenceByFam[fuFam2][pbId3]);
          for (var pthi2 = 0; pthi2 < THEMES.length; pthi2++) {
            var pmId2 = primModes.modeMap[pbId3 + "-" + THEMES[pthi2]];
            if (pmId2) { try { presV.setValueForMode(pmId2, has); } catch (_pvbErr) {} }
          }
        }
      }
    } catch (_primColErr) { progress("Foundations primitives collection failed: " + String(_primColErr)); }
  }
  function primVar(family, index) { return primVarByName[family + "/" + index] || null; }
  function hexVar(family, index) { return hexVarByName[family + "/" + index] || null; }

  // ── PRIMITIVE COLORS (union of brands; families a brand lacks auto-hide via the present/* boolean) ──
  var maxRampW = 0;
  if (famUnion.length) {
    var brandName = cap(currentBrandId || (brandIds.length ? brandIds[0] : ""));
    sectionHeader(doc, "Primitive Colors", "Base color ramps. Colors and labels switch with the brand/theme appearance, and families a brand doesn't define are hidden automatically.");
    var fallbackPalettes = (currentBrandId && payload[currentBrandId]) ? payload[currentBrandId].primitives : {};
    for (var fni = 0; fni < famUnion.length; fni++) {
      var family = famUnion[fni];
      var len = famMaxLen[family] || 0;
      if (!len) continue;
      // Representative ramp for the static structure (prefer current brand, else first brand that has it).
      var ramp = fallbackPalettes[family] || null;
      if (!ramp) {
        for (var rb = 0; rb < brandIds.length; rb++) {
          var cand = payload[brandIds[rb]].primitives ? payload[brandIds[rb]].primitives[family] : null;
          if (cand && cand.length) { ramp = cand; break; }
        }
      }
      var famPanel = panel("Family " + family, 14);
      famPanel.counterAxisAlignItems = "CENTER";
      var famInner = stack("Family Inner", "VERTICAL", 14, "MIN");
      appendText(famInner, mediumFont, cap(family), 14, DOC.title, "Family Name");
      var rampRow = stack("Ramp", "HORIZONTAL", 8, "MIN");
      for (var rmi = 0; rmi < len; rmi++) {
        var rampCell = stack("Ramp Cell", "VERTICAL", 6, "CENTER");
        var rSw = swatch(44, (ramp && ramp[rmi]) ? ramp[rmi] : "#FFFFFF", 6);
        rampCell.appendChild(rSw);
        bindPaintVar(rSw, "fills", 0, primVar(family, rmi));
        appendText(rampCell, mediumFont, String(rmi), 11, DOC.title, "Ramp Index");
        var hexLabel = appendText(rampCell, bodyFont, (ramp && ramp[rmi]) ? String(ramp[rmi]).toUpperCase() : "", 10, DOC.body, "Ramp Hex");
        bindVar(hexLabel, "characters", hexVar(family, rmi));
        rampRow.appendChild(rampCell);
      }
      famInner.appendChild(rampRow);
      famPanel.appendChild(famInner);
      doc.appendChild(famPanel);
      fillWidth(famPanel);
      bindVar(famPanel, "visible", presentVarByFam[family]);
      try { if (rampRow.width > maxRampW) maxRampW = rampRow.width; } catch (_rwErr) {}
    }
  }

  // ── SEMANTIC COLORS (roles bound to Semantic vars; switch per brand/theme) ──
  var semColorByName = {};
  for (var scc = 0; scc < colorVars.length; scc++) {
    if ((colNameById[colorVars[scc].variableCollectionId] || "") === "Semantic") {
      semColorByName[String(colorVars[scc].name)] = colorVars[scc];
    }
  }
  var semColorSource = (currentBrandId && payload[currentBrandId] && payload[currentBrandId].semantic)
    ? (payload[currentBrandId].semantic.light || {}) : {};
  var SEMANTIC_GROUPS = [
    ["Interactive", ["interactive-primary", "interactive-primary-hover", "interactive-primary-pressed", "interactive-secondary", "interactive-secondary-hover", "interactive-disabled"]],
    ["Text", ["text-default", "text-subtle", "text-on-interactive", "text-placeholder", "text-disabled", "text-inverse"]],
    ["Surface", ["surface-primary", "surface-secondary", "subtle-primary", "subtle-secondary", "surface-default", "surface-inverse"]],
    ["Border", ["border-primary", "border-default", "border-subtle", "border-focus", "border-disabled"]],
    ["Feedback", ["feedback-error", "feedback-success", "feedback-warning"]]
  ];
  var groupedSet = {};
  for (var sg0 = 0; sg0 < SEMANTIC_GROUPS.length; sg0++) {
    var sg0Keys = SEMANTIC_GROUPS[sg0][1];
    for (var sg0k = 0; sg0k < sg0Keys.length; sg0k++) groupedSet[sg0Keys[sg0k]] = true;
  }
  var leftoverRoles = [];
  var allSemRoleKeys = Object.keys(semColorSource);
  for (var ark = 0; ark < allSemRoleKeys.length; ark++) {
    var rkRole = allSemRoleKeys[ark];
    if (rkRole === "transparent") continue;
    if (!groupedSet[rkRole]) leftoverRoles.push(rkRole);
  }
  var groupsToRender = SEMANTIC_GROUPS.slice();
  if (leftoverRoles.length) groupsToRender.push(["Other", leftoverRoles]);

  function semSwatchCell(role) {
    var cell = stack("Sem Cell", "HORIZONTAL", 12, "CENTER");
    var srcHex = (semColorSource[role] && semColorSource[role].value) ? semColorSource[role].value : "#FFFFFF";
    var sw = figma.createFrame();
    sw.name = "Swatch";
    sw.resize(44, 44);
    sw.cornerRadius = 6;
    sw.fills = [{ type: "SOLID", color: hexToFigmaRgb(srcHex) }];
    sw.strokes = [{ type: "SOLID", color: DOC.panelStroke }];
    sw.strokeWeight = 1;
    bindPaintVar(sw, "fills", 0, semColorByName[role]);
    if (semColorByName["border-primary"]) bindPaintVar(sw, "strokes", 0, semColorByName["border-primary"]);
    cell.appendChild(sw);
    appendText(cell, mediumFont, role, 11, DOC.title, "Sem Role");
    return cell;
  }

  var hasAnySemantic = false;
  for (var has = 0; has < groupsToRender.length && !hasAnySemantic; has++) {
    var hasKeys = groupsToRender[has][1];
    for (var hask = 0; hask < hasKeys.length; hask++) {
      if (semColorByName[hasKeys[hask]]) { hasAnySemantic = true; break; }
    }
  }

  if (hasAnySemantic) {
    sectionHeader(doc, "Semantic Colors", "Role-based colors mapped from the primitives. These switch with the brand/theme appearance.");
    for (var sgi = 0; sgi < groupsToRender.length; sgi++) {
      var groupName = groupsToRender[sgi][0];
      var groupKeys = groupsToRender[sgi][1];
      var present = [];
      for (var gpi = 0; gpi < groupKeys.length; gpi++) {
        if (semColorByName[groupKeys[gpi]]) present.push(groupKeys[gpi]);
      }
      if (!present.length) continue;
      var gPanel = panel("Semantic " + groupName, 14);
      gPanel.counterAxisAlignItems = "CENTER";
      var gInner = stack("Sem Inner", "VERTICAL", 14, "MIN");
      appendText(gInner, mediumFont, groupName, 14, DOC.title, "Group Name");
      var gRow = stack("Sem Cols", "HORIZONTAL", 24, "MIN");
      var semCol0 = stack("Sem Col", "VERTICAL", 10, "MIN");
      var semCol1 = stack("Sem Col", "VERTICAL", 10, "MIN");
      var semHalf = Math.ceil(present.length / 2);
      for (var pgi = 0; pgi < present.length; pgi++) {
        (pgi < semHalf ? semCol0 : semCol1).appendChild(semSwatchCell(present[pgi]));
      }
      gRow.appendChild(semCol0);
      gRow.appendChild(semCol1);
      gInner.appendChild(gRow);
      gPanel.appendChild(gInner);
      doc.appendChild(gPanel);
      fillWidth(gPanel);
      // Match the two-column block width to the primitive ramps so edges line up.
      if (maxRampW > 0) {
        try {
          gInner.counterAxisSizingMode = "FIXED";
          gInner.resize(maxRampW, gInner.height);
          gRow.layoutSizingHorizontal = "FILL";
          semCol0.layoutSizingHorizontal = "FILL";
          semCol1.layoutSizingHorizontal = "FILL";
        } catch (_semColErr) {}
      }
    }
  }

  var primaryBrand = currentBrandId;
  function scalarEntries(field, theme) {
    if (!primaryBrand) return [];
    var node = payload[primaryBrand][field];
    var map = node ? (node[theme] || node.light) : null;
    if (!map) return [];
    var out = [];
    var keys = Object.keys(map);
    for (var i = 0; i < keys.length; i++) out.push([keys[i], map[keys[i]]]);
    return out;
  }
  function labelOf(key) { var parts = String(key).split("/"); return parts[parts.length - 1]; }

  // ── Per-mode px labels ──
  // The radius/spacing visuals are bound to Semantic FLOAT vars (they switch per
  // brand/theme), but the "Npx" text is static. Bind the text to a Semantic STRING
  // var so the label switches with the same mode as the bar/box it describes.
  var semColForLabels = null;
  for (var slc = 0; slc < collections.length; slc++) {
    if (collections[slc].name === "Semantic") { semColForLabels = collections[slc]; break; }
  }
  var semLabelModeId = {};
  if (semColForLabels) {
    for (var slb = 0; slb < brandIds.length; slb++) {
      for (var slt = 0; slt < THEMES.length; slt++) {
        var wantName = cap(brandIds[slb]) + cap(THEMES[slt]);
        for (var slm = 0; slm < semColForLabels.modes.length; slm++) {
          if (semColForLabels.modes[slm].name === wantName) {
            semLabelModeId[brandIds[slb] + "-" + THEMES[slt]] = semColForLabels.modes[slm].modeId;
            break;
          }
        }
      }
    }
  }
  function pxLabelVar(payloadField, groupName, key) {
    if (!semColForLabels) return null;
    var nm = "Doc Labels/" + groupName + "/" + labelOf(key);
    var v = semScalarByName[nm];
    if (!v) {
      try { v = figma.variables.createVariable(nm, semColForLabels, "STRING"); semScalarByName[nm] = v; }
      catch (_lvErr) { return null; }
    }
    for (var lb = 0; lb < brandIds.length; lb++) {
      var bId = brandIds[lb];
      var node = payload[bId] ? payload[bId][payloadField] : null;
      for (var lt = 0; lt < THEMES.length; lt++) {
        var mId = semLabelModeId[bId + "-" + THEMES[lt]];
        if (!mId) continue;
        var map = node ? (node[THEMES[lt]] || node.light) : null;
        var def = map ? map[key] : null;
        var val = def ? (typeof def === "object" ? def.value : def) : null;
        try { v.setValueForMode(mId, (val != null ? Number(val) + "px" : "")); } catch (_lvmErr) {}
      }
    }
    return v;
  }

  // ── RADIUS ──
  var radiusEntries = scalarEntries("semanticRadius", "light");
  if (radiusEntries.length) {
    sectionHeader(doc, "Radius", "Corner radius scale. Bound to Semantic radius variables.");
    var radiusPanel = panel("Radius Panel", 0);
    radiusPanel.counterAxisAlignItems = "CENTER";
    var radiusRow = stack("Radius Row", "HORIZONTAL", 18, "MIN");
    for (var rdi = 0; rdi < radiusEntries.length; rdi++) {
      var rKey = radiusEntries[rdi][0];
      var rVal = Number(radiusEntries[rdi][1] && radiusEntries[rdi][1].value) || 0;
      var rCell = stack("Radius Cell", "VERTICAL", 6, "CENTER");
      var rBox = figma.createFrame();
      rBox.name = "Radius Box";
      rBox.resize(56, 56);
      rBox.fills = [{ type: "SOLID", color: DOC.panelBg }];
      rBox.strokes = [{ type: "SOLID", color: DOC.accent }];
      rBox.strokeWeight = 1.5;
      bindPaintVar(rBox, "strokes", 0, docVars.heading); // brand primary, switches per brand/theme
      var visualRadius = Math.min(rVal, 28);
      rBox.topLeftRadius = visualRadius; rBox.topRightRadius = visualRadius;
      rBox.bottomLeftRadius = visualRadius; rBox.bottomRightRadius = visualRadius;
      rCell.appendChild(rBox);
      var rVar = semScalarByName[rKey];
      if (rVar) {
        bindVar(rBox, "topLeftRadius", rVar); bindVar(rBox, "topRightRadius", rVar);
        bindVar(rBox, "bottomLeftRadius", rVar); bindVar(rBox, "bottomRightRadius", rVar);
      }
      appendText(rCell, mediumFont, labelOf(rKey), 11, DOC.title, "Radius Label");
      var rValText = appendText(rCell, bodyFont, rVal + "px", 10, DOC.body, "Radius Value");
      bindVar(rValText, "characters", pxLabelVar("semanticRadius", "radius", rKey));
      radiusRow.appendChild(rCell);
    }
    radiusPanel.appendChild(radiusRow);
    doc.appendChild(radiusPanel);
    fillWidth(radiusPanel);
  }

  // ── SPACING ──
  var spacingEntries = scalarEntries("semanticSpacing", "light");
  if (spacingEntries.length) {
    sectionHeader(doc, "Spacing", "Spacing scale. Bars bound to Semantic spacing variables.");
    var spacingPanel = panel("Spacing Panel", 0);
    spacingPanel.counterAxisAlignItems = "CENTER";
    var spacingCol = stack("Spacing Col", "HORIZONTAL", 24, "CENTER");
    for (var spi = 0; spi < spacingEntries.length; spi++) {
      var spKey = spacingEntries[spi][0];
      var spVal = Number(spacingEntries[spi][1] && spacingEntries[spi][1].value) || 0;
      var spRow = stack("Spacing Row", "HORIZONTAL", 8, "CENTER");
      appendText(spRow, mediumFont, labelOf(spKey), 11, DOC.title, "Spacing Label");
      var spBar = figma.createRectangle();
      spBar.name = "Spacing Bar";
      spBar.resize(Math.max(2, spVal), 14);
      spBar.cornerRadius = 3;
      spBar.fills = [{ type: "SOLID", color: DOC.accent }];
      bindPaintVar(spBar, "fills", 0, docVars.heading); // brand primary, switches per brand/theme
      spRow.appendChild(spBar);
      var spVar = semScalarByName[spKey];
      if (spVar) bindVar(spBar, "width", spVar);
      var spValText = appendText(spRow, bodyFont, spVal + "px", 10, DOC.body, "Spacing Value");
      bindVar(spValText, "characters", pxLabelVar("semanticSpacing", "spacing", spKey));
      spacingCol.appendChild(spRow);
    }
    spacingPanel.appendChild(spacingCol);
    doc.appendChild(spacingPanel);
    fillWidth(spacingPanel);
  }

  // Typography intentionally omitted from Foundations — the Text and Title
  // components own the type scale.

  // ── Bind doc chrome (background, panels, text) to Semantic vars so it matches and switches with the rest of the docs ──
  function fdSolid(paint) { return (paint && paint.type === "SOLID") ? paint.color : null; }
  function fdApprox(a, b) {
    if (!a || !b) return false;
    return Math.abs(a.r - b.r) < 0.02 && Math.abs(a.g - b.g) < 0.02 && Math.abs(a.b - b.b) < 0.02;
  }
  try {
    if (docVars.pageBg) bindPaintVar(doc, "fills", 0, docVars.pageBg);
    var fdNodes = doc.findAll(function () { return true; });
    for (var fdi = 0; fdi < fdNodes.length; fdi++) {
      var nd = fdNodes[fdi];
      if (!nd) continue;
      if (nd.type === "TEXT") {
        var tc = (nd.fills && nd.fills.length) ? fdSolid(nd.fills[0]) : null;
        if (fdApprox(tc, DOC.heading) && docVars.heading) bindPaintVar(nd, "fills", 0, docVars.heading);
        else if (fdApprox(tc, DOC.title) && docVars.title) bindPaintVar(nd, "fills", 0, docVars.title);
        else if ((fdApprox(tc, DOC.subtitle) || fdApprox(tc, DOC.body) || fdApprox(tc, DOC.label)) && docVars.textSubtle) bindPaintVar(nd, "fills", 0, docVars.textSubtle);
        continue;
      }
      if (nd.type === "FRAME") {
        if (String(nd.name || "") === "Swatch") continue; // swatch fills are brand colors
        var fc = (nd.fills && nd.fills.length) ? fdSolid(nd.fills[0]) : null;
        var sc = (nd.strokes && nd.strokes.length) ? fdSolid(nd.strokes[0]) : null;
        if (fdApprox(fc, DOC.panelBg) && docVars.panelBg) bindPaintVar(nd, "fills", 0, docVars.panelBg);
        else if (fdApprox(fc, DOC.pageBg) && docVars.pageBg) bindPaintVar(nd, "fills", 0, docVars.pageBg);
        if (fdApprox(sc, DOC.panelStroke) && docVars.panelStroke) bindPaintVar(nd, "strokes", 0, docVars.panelStroke);
      }
    }
  } catch (_chromeErr) { progress("Foundations chrome bind: " + String(_chromeErr)); }

  // ── Initial appearance = current brand/theme (colors via Primitive/Brands, scalars via Semantic) ──
  var prefTheme = (buildOpts.previewTheme === "dark") ? "dark" : "light";
  var prefBrand = currentBrandId || (brandIds.length ? brandIds[0] : "");
  if (prefBrand && typeof doc.setExplicitVariableModeForCollection === "function") {
    var prefKey = prefBrand + "-" + prefTheme;
    if (primCol && primModes.modeMap[prefKey]) {
      try { doc.setExplicitVariableModeForCollection(primCol.id, primModes.modeMap[prefKey]); } catch (_primModeErr) {}
    }
    var semColObj = null;
    for (var sci = 0; sci < collections.length; sci++) {
      if (collections[sci].name === "Semantic") { semColObj = collections[sci]; break; }
    }
    if (semColObj) {
      var prefName = cap(prefBrand) + cap(prefTheme);
      var semModeId = null;
      for (var smo = 0; smo < semColObj.modes.length; smo++) {
        if (semColObj.modes[smo].name === prefName) { semModeId = semColObj.modes[smo].modeId; break; }
      }
      if (semModeId) { try { doc.setExplicitVariableModeForCollection(semColObj.id, semModeId); } catch (_semModeErr) {} }
    }
  }

  // ── Position above existing docs ──
  doc.x = 0;
  doc.y = haveChildren ? (minY - doc.height - 120) : 0;

  return { created: 1, skipped: 0 };
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

async function buildButtonComponentSet(varMap, page, font, focusRingStyle, selectedVariants) {
  var variants = (selectedVariants && selectedVariants.length > 0)
    ? selectedVariants.slice()
    : ["filled", "outlined", "ghost"];
  var colors = ["primary", "error"];
  var sizes = ["default", "xxs", "xs", "sm", "md", "lg", "xl"];
  var states = ["default", "hover", "focus", "pressed", "disabled"];
  var leftIconModes = ["off", "on"];
  var rightIconModes = ["off", "on"];
  var components = [];
  var iconComponents = await findButtonIconComponents();

  // Known button heights per size for accurate spacing
  var sizeHeights = { default: 36, xxs: 24, xs: 28, sm: 36, md: 42, lg: 50, xl: 60 };
  var gap = 30;
  var sizeGroupGap = 22;
  var colGap = 44;

  // Pre-calculate y offset for each (size, state) row
  var rowYOffsets = [];
  var runningY = 0;
  for (var rsi = 0; rsi < sizes.length; rsi++) {
    for (var rsti = 0; rsti < states.length; rsti++) {
      rowYOffsets.push(runningY);
      runningY += sizeHeights[sizes[rsi]] + gap;
    }
    // Add extra breathing room between size groups.
    runningY += sizeGroupGap;
  }

  // Allocate extra width when icon combinations are enabled.
  var colWidth = 280 + colGap;

  for (var vi = 0; vi < variants.length; vi++) {
    var variant = variants[vi];
    var capVariant = variant === "ghost" ? "Transparent" : (variant.charAt(0).toUpperCase() + variant.slice(1));
    for (var ci = 0; ci < colors.length; ci++) {
      var color = colors[ci];
      var capColor = color.charAt(0).toUpperCase() + color.slice(1);

      for (var si = 0; si < sizes.length; si++) {
        var size = sizes[si];
        var capSize = size === "default" ? "Default" : size.toUpperCase();

        for (var li = 0; li < leftIconModes.length; li++) {
          var leftMode = leftIconModes[li];
          var hasLeftIcon = leftMode === "on";
          var capLeftIcon = hasLeftIcon ? "On" : "Off";

          for (var ri = 0; ri < rightIconModes.length; ri++) {
            var rightMode = rightIconModes[ri];
            var hasRightIcon = rightMode === "on";
            var capRightIcon = hasRightIcon ? "On" : "Off";

            for (var sti = 0; sti < states.length; sti++) {
              var state = states[sti];
              var capState = state.charAt(0).toUpperCase() + state.slice(1);
              var isGhostVariant = variant === "ghost";

              var comp = figma.createComponent();
              comp.name =
                "Variant=" + capVariant +
                ", Color=" + capColor +
                ", Size=" + capSize +
                ", LeftIcon=" + capLeftIcon +
                ", RightIcon=" + capRightIcon +
                ", State=" + capState;

            // Auto-layout: horizontal, center-aligned
            comp.layoutMode = "HORIZONTAL";
            comp.primaryAxisAlignItems = "CENTER";
            comp.counterAxisAlignItems = "CENTER";
            comp.primaryAxisSizingMode = "AUTO";
            comp.counterAxisSizingMode = "AUTO";
            comp.itemSpacing = 8;
            comp.clipsContent = false;
            var buttonNode = comp;

            if (state === "focus" && focusRingStyle !== "attached") {
              // Focus wrapper: configurable outer ring with spacing around the real button surface.
              comp.itemSpacing = 0;
              comp.paddingLeft = isGhostVariant ? 1 : 3;
              comp.paddingRight = isGhostVariant ? 1 : 3;
              comp.paddingTop = isGhostVariant ? 1 : 3;
              comp.paddingBottom = isGhostVariant ? 1 : 3;
              comp.fills = [];
              comp.strokes = [{
                type: "SOLID",
                color: { r: 0.17, g: 0.63, b: 0.98 },
                opacity: isGhostVariant ? 0.65 : 1
              }];
              comp.strokeAlign = "OUTSIDE";
              comp.strokeWeight = isGhostVariant ? 1 : 2;
              comp.cornerRadius = 11;
              bindPaintVar(comp, "strokes", 0, varMap["button/focus-ring"]);
              if (isGhostVariant) {
                bindVar(comp, "strokeWeight", null);
                bindVar(comp, "paddingLeft", null);
                bindVar(comp, "paddingRight", null);
                bindVar(comp, "paddingTop", null);
                bindVar(comp, "paddingBottom", null);
              } else {
                bindVar(comp, "strokeWeight", varMap["button/focus-ring-width"]);
                bindVar(comp, "paddingLeft", varMap["button/focus-ring-spacing"]);
                bindVar(comp, "paddingRight", varMap["button/focus-ring-spacing"]);
                bindVar(comp, "paddingTop", varMap["button/focus-ring-spacing"]);
                bindVar(comp, "paddingBottom", varMap["button/focus-ring-spacing"]);
              }
              bindVar(comp, "topLeftRadius", varMap["button/focus-ring-radius"]);
              bindVar(comp, "topRightRadius", varMap["button/focus-ring-radius"]);
              bindVar(comp, "bottomLeftRadius", varMap["button/focus-ring-radius"]);
              bindVar(comp, "bottomRightRadius", varMap["button/focus-ring-radius"]);

              buttonNode = figma.createFrame();
              buttonNode.name = "ButtonSurface";
              buttonNode.layoutMode = "HORIZONTAL";
              buttonNode.primaryAxisAlignItems = "CENTER";
              buttonNode.counterAxisAlignItems = "CENTER";
              buttonNode.primaryAxisSizingMode = "AUTO";
              buttonNode.counterAxisSizingMode = "AUTO";
              buttonNode.itemSpacing = 8;
              buttonNode.clipsContent = false;
              comp.appendChild(buttonNode);
            }

            // Initial dimensions (overridden by variable bindings)
            buttonNode.paddingLeft = 14;
            buttonNode.paddingRight = 14;
            buttonNode.paddingTop = 6;
            buttonNode.paddingBottom = 6;
            buttonNode.cornerRadius = 8;

            // --- Color variable paths for this state ---
            // Attached focus keeps the base button visual and only adds ring treatment.
            var colorState = (state === "focus" && focusRingStyle === "attached") ? "default" : state;
            var bgPath = btnColorPath(variant, color, "background", colorState);
            var textPath = btnColorPath(variant, color, "text", colorState);
            var borderPath = btnColorPath(variant, color, "border", colorState);

            // Background fill — COLOR variable (gradient tokens resolve to first-stop in payload).
            var bgVar = varMap[bgPath];
            if (variant === "ghost" && (colorState === "default" || colorState === "focus" || colorState === "disabled")) {
              buttonNode.fills = [];
            } else {
              buttonNode.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
              bindPaintVar(buttonNode, "fills", 0, bgVar);
            }

            // Stroke/border
            var borderVar = varMap[borderPath];
            if (variant === "outlined" && borderVar) {
              buttonNode.strokes = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
              buttonNode.strokeWeight = 1.5;
              bindPaintVar(buttonNode, "strokes", 0, borderVar);
            } else {
              buttonNode.strokes = [];
            }

            // Bind SIZE-SPECIFIC dimensions
            bindVar(buttonNode, "paddingLeft", varMap["button/padding-x-" + size]);
            bindVar(buttonNode, "paddingRight", varMap["button/padding-x-" + size]);
            bindVar(buttonNode, "paddingTop", varMap["button/padding-y-" + size]);
            bindVar(buttonNode, "paddingBottom", varMap["button/padding-y-" + size]);
            bindVar(buttonNode, "itemSpacing", varMap["button/icon-spacing-" + size]);
            bindVar(buttonNode, "topLeftRadius", varMap["button/border-radius"]);
            bindVar(buttonNode, "topRightRadius", varMap["button/border-radius"]);
            bindVar(buttonNode, "bottomLeftRadius", varMap["button/border-radius"]);
            bindVar(buttonNode, "bottomRightRadius", varMap["button/border-radius"]);
            bindVar(buttonNode, "strokeWeight", varMap["button/border-width"]);

            function appendIcon(iconComp, iconName) {
              if (!iconComp) return;
              var iconInst = iconComp.createInstance();
              iconInst.name = iconName;
              try { iconInst.resize(16, 16); } catch (e) {}
              bindVar(iconInst, "width", varMap["button/icon-size-" + size]);
              bindVar(iconInst, "height", varMap["button/icon-size-" + size]);
              var vectors = iconInst.findAll(function(n) { return n.type === "VECTOR"; });
              for (var vci = 0; vci < vectors.length; vci++) {
                bindVar(vectors[vci], "strokeWeight", varMap["button/icon-stroke-width-" + size]);
                if (vectors[vci].strokes && vectors[vci].strokes.length > 0) {
                  vectors[vci].strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
                  bindPaintVar(vectors[vci], "strokes", 0, varMap[textPath]);
                }
                if (vectors[vci].fills && vectors[vci].fills.length > 0) {
                  vectors[vci].fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
                  bindPaintVar(vectors[vci], "fills", 0, varMap[textPath]);
                }
              }
              buttonNode.appendChild(iconInst);
            }

            if (hasLeftIcon) {
              appendIcon(iconComponents.left || iconComponents.fallback, "LeftIcon");
            }

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
            bindVar(textNode, "fontFamily", varMap["button/font-family"]);
            bindVar(textNode, "fontStyle", varMap["button/font-weight"]);
            bindVar(textNode, "lineHeight", varMap["button/line-height-" + size]);

            buttonNode.appendChild(textNode);

            if (hasRightIcon) {
              appendIcon(iconComponents.right || iconComponents.fallback, "RightIcon");
            }

            if (state === "focus" && focusRingStyle === "attached") {
              // Attached focus: single halo ring.
              var attachedHalo = figma.createRectangle();
              attachedHalo.name = "FocusHalo";
              attachedHalo.fills = [];
              attachedHalo.strokes = [{
                type: "SOLID",
                color: { r: 0.2, g: 0.53, b: 0.9 },
                opacity: isGhostVariant ? 0.3 : 0.4
              }];
              attachedHalo.strokeAlign = "OUTSIDE";
              attachedHalo.strokeWeight = isGhostVariant ? 2 : 3;
              attachedHalo.cornerRadius = 8;
              try {
                attachedHalo.resize(buttonNode.width, buttonNode.height);
              } catch (resizeErr) {}
              bindPaintVar(attachedHalo, "strokes", 0, varMap["button/focus-ring"]);
              if (isGhostVariant) {
                bindVar(attachedHalo, "strokeWeight", null);
              } else {
                bindVar(attachedHalo, "strokeWeight", varMap["button/focus-ring-width"]);
              }
              bindVar(attachedHalo, "topLeftRadius", varMap["button/border-radius"]);
              bindVar(attachedHalo, "topRightRadius", varMap["button/border-radius"]);
              bindVar(attachedHalo, "bottomLeftRadius", varMap["button/border-radius"]);
              bindVar(attachedHalo, "bottomRightRadius", varMap["button/border-radius"]);

              comp.appendChild(attachedHalo);
              attachedHalo.layoutPositioning = "ABSOLUTE";
              attachedHalo.x = 0;
              attachedHalo.y = 0;
              attachedHalo.constraints = { horizontal: "STRETCH", vertical: "STRETCH" };
              comp.insertChild(0, attachedHalo);
            }

            // Disabled visuals come from disabled tokens; avoid extra opacity wash.

            // Grid layout: columns = variants × icon modes, rows = size groups × states
            var variantColorIndex = vi * colors.length + ci;
            var colIndex = ((variantColorIndex * leftIconModes.length + li) * rightIconModes.length) + ri;
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
  }

  progress("Created " + components.length + " button variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Button";
  return componentSet;
}

// Build the figmaPath for a button color token given variant, property, and state
function btnColorPath(variant, color, property, state) {
  var resolvedVariant = variant === "ghost" ? "transparent" : variant;
  var isError = color === "error";
  var colorSegment = isError ? "-error" : "";
  if (state === "default") {
    return "button/" + resolvedVariant + colorSegment + "-" + property;
  }
  return "button/" + resolvedVariant + colorSegment + "-" + property + "-" + state;
}

async function findButtonIconComponents() {
  var result = { left: null, right: null, fallback: null };
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
        if (setChildren[ci].type === "COMPONENT") {
          iconCandidates.push(setChildren[ci]);
        }
      }
    }
  }

  for (var j = 0; j < iconCandidates.length; j++) {
    var name = String(iconCandidates[j].name || "").toLowerCase();
    var normalized = name.replace(/[\s_\-\/]+/g, "");
    if (!result.left && (normalized.indexOf("check") >= 0 || normalized.indexOf("plus") >= 0 || normalized.indexOf("add") >= 0)) {
      result.left = iconCandidates[j];
    }
    if (!result.right && (normalized.indexOf("chevronright") >= 0 || normalized.indexOf("arrowright") >= 0 || normalized.indexOf("right") >= 0)) {
      result.right = iconCandidates[j];
    }
  }

  if (iconCandidates.length > 0) {
    var sorted = iconCandidates.slice().sort(function(a, b) {
      return a.name.localeCompare(b.name);
    });
    result.fallback = sorted[0];
  }

  if (result.left) progress("[Button] Left icon source: " + result.left.name);
  if (result.right) progress("[Button] Right icon source: " + result.right.name);
  if (!result.left || !result.right) {
    progress("[Button] Warning: could not find both icon sources; using fallback when needed.");
  }

  return result;
}

// ---------------------------------------------------------------------------
// Switch
// ---------------------------------------------------------------------------

function buildSwitchComponentSet(varMap, page, font) {
  var sizes = ["default", "xs", "sm", "md", "lg", "xl"];
  var checkedStates = [false, true];
  var states = ["default", "hover", "focus", "pressed", "disabled"];
  var labelModes = ["hide", "show"];
  var components = [];

  // Known switch heights per size for dynamic grid spacing
  var sizeHeights = { default: 22, xs: 16, sm: 18, md: 22, lg: 28, xl: 34 };
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
        var capSize = size === "default" ? "Default" : size.toUpperCase();

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
          var trackBorderPath = switchTrackBorderPath(varMap, isChecked, state);
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
            bindVar(labelNode, "fontFamily", varMap["switch/label-font-family"]);
            bindVar(labelNode, "fontStyle", varMap["switch/label-font-weight"]);
            bindVar(labelNode, "lineHeight", varMap["switch/label-line-height-" + size]);
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
function switchTrackBorderPath(varMap, isChecked, state) {
  if (state === "default") {
    return pickExistingPath(varMap, [
      isChecked ? "switch/track-border-checked" : null,
      "switch/track-border"
    ].filter(Boolean));
  }
  return pickExistingPath(varMap, [
    isChecked ? "switch/track-border-checked-" + state : null,
    "switch/track-border-" + state,
    isChecked ? "switch/track-border-checked" : null,
    "switch/track-border"
  ].filter(Boolean));
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
// Burger
// ---------------------------------------------------------------------------
function buildBurgerComponentSet(varMap, page, font) {
  var sizes = ["default", "xs", "sm", "md", "lg", "xl"];
  var openedStates = [false, true];
  var states = ["default", "hover", "focus", "disabled"];
  var components = [];

  // Static geometry snapshots per size (variables drive the live values).
  var burgerSizes = { default: 24, xs: 12, sm: 18, md: 24, lg: 34, xl: 42 };
  var lineSizes = { default: 2, xs: 1, sm: 2, md: 2, lg: 3, xl: 4 };
  var lineGaps = { default: 6, xs: 3, sm: 5, md: 6, lg: 9, xl: 11 };
  var paddings = { default: 8, xs: 4, sm: 6, md: 8, lg: 10, xl: 12 };
  var radii = { default: 8, xs: 4, sm: 6, md: 8, lg: 12, xl: 16 };

  var cellW = 96;
  var cellH = 96;

  for (var oi = 0; oi < openedStates.length; oi++) {
    var isOpened = openedStates[oi];
    var capOpened = isOpened ? "True" : "False";

    for (var si = 0; si < sizes.length; si++) {
      var size = sizes[si];
      var capSize = size === "default" ? "Default" : size.toUpperCase();
      var sizePx = burgerSizes[size];
      var lineSz = lineSizes[size];
      var gapPx = lineGaps[size];
      var pad = paddings[size];
      var rad = radii[size];
      // Square content box so the X and hover background are not stretched.
      var box = sizePx;

      for (var sti = 0; sti < states.length; sti++) {
        var state = states[sti];
        var capState = state.charAt(0).toUpperCase() + state.slice(1);

        var comp = figma.createComponent();
        comp.name = "Size=" + capSize + ", Opened=" + capOpened + ", State=" + capState;
        // Auto-layout so the frame hugs the (size-driven) content + padding.
        comp.layoutMode = "HORIZONTAL";
        comp.primaryAxisSizingMode = "AUTO";
        comp.counterAxisSizingMode = "AUTO";
        comp.primaryAxisAlignItems = "CENTER";
        comp.counterAxisAlignItems = "CENTER";
        comp.paddingLeft = pad;
        comp.paddingRight = pad;
        comp.paddingTop = pad;
        comp.paddingBottom = pad;
        comp.cornerRadius = rad;
        comp.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0 }];

        var bgPath = state === "default" ? "burger/background" : "burger/background-" + state;
        if (varMap[bgPath]) bindPaintVar(comp, "fills", 0, varMap[bgPath]);
        if (varMap["burger/radius-" + size]) {
          bindVar(comp, "topLeftRadius", varMap["burger/radius-" + size]);
          bindVar(comp, "topRightRadius", varMap["burger/radius-" + size]);
          bindVar(comp, "bottomLeftRadius", varMap["burger/radius-" + size]);
          bindVar(comp, "bottomRightRadius", varMap["burger/radius-" + size]);
        }
        if (varMap["burger/padding-" + size]) {
          bindVar(comp, "paddingLeft", varMap["burger/padding-" + size]);
          bindVar(comp, "paddingRight", varMap["burger/padding-" + size]);
          bindVar(comp, "paddingTop", varMap["burger/padding-" + size]);
          bindVar(comp, "paddingBottom", varMap["burger/padding-" + size]);
        }

        var colorPath = state === "default" ? "burger/color" : "burger/color-" + state;
        var sizeVar = varMap["burger/size-" + size];
        var lineVar = varMap["burger/line-size-" + size];
        var gapVar = varMap["burger/line-gap-" + size];
        var lineRadiusVar = varMap["burger/line-radius"];
        var colorVar = varMap[colorPath];

        // Hamburger bar: a rectangle that FILLS the size-driven frame width and
        // binds its thickness (height) to line-size. (The X state is drawn as a
        // stroked vector instead, so its thickness can bind to line-size without
        // the rotated-rectangle distortion.) bindWidth is kept for completeness
        // but the hamburger bars fill via auto-layout rather than binding width.
        function makeBurgerBar(bindWidth, bindThickness) {
          var bar = figma.createRectangle();
          bar.name = "Bar";
          bar.resize(box, lineSz);
          bar.cornerRadius = lineSz / 2;
          bar.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
          if (colorVar) bindPaintVar(bar, "fills", 0, colorVar);
          if (bindWidth && sizeVar) bindVar(bar, "width", sizeVar);
          if (bindThickness && lineVar) bindVar(bar, "height", lineVar);
          if (lineRadiusVar) {
            bindVar(bar, "topLeftRadius", lineRadiusVar);
            bindVar(bar, "topRightRadius", lineRadiusVar);
            bindVar(bar, "bottomLeftRadius", lineRadiusVar);
            bindVar(bar, "bottomRightRadius", lineRadiusVar);
          }
          return bar;
        }

        var lines;
        if (isOpened) {
          // X: a single stroked vector with two crossing diagonals. Rotated
          // rectangles fan into a ">" shape when their width is bound to a
          // variable (the resize anchors the rotated corner), so instead we draw
          // the X as a vector: the stroke WEIGHT binds to line-size (exact, never
          // distorts the shape) and the geometry scales with the size-driven
          // frame. This keeps the bar thickness identical to the hamburger and the
          // bounding box identical (size x size).
          lines = figma.createFrame();
          lines.name = "Lines";
          lines.layoutMode = "NONE";
          lines.clipsContent = false;
          lines.resize(box, box);
          lines.fills = [];

          var xBar = figma.createVector();
          xBar.name = "Bar";
          // The X is INSCRIBED in the box: each arm is the same length as a
          // hamburger bar (= size), rotated 45° about the center. A line of length
          // L rotated 45° only spans L/√2 on each axis, so the arms stay inside
          // the box (they do NOT reach the corners) and the stroke is contained.
          // Do NOT resize the vector (that would stretch the geometry to the
          // corners) — center it instead and let it scale with the frame.
          var xc = box / 2;
          var xd = box / (2 * Math.SQRT2); // half arm-length projected on each axis
          xBar.vectorPaths = [{
            windingRule: "NONE",
            data:
              "M " + (xc - xd) + " " + (xc - xd) + " L " + (xc + xd) + " " + (xc + xd) +
              " M " + (xc - xd) + " " + (xc + xd) + " L " + (xc + xd) + " " + (xc - xd),
          }];
          xBar.fills = [];
          xBar.strokes = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
          xBar.strokeWeight = lineSz;
          xBar.strokeCap = "ROUND";
          xBar.strokeJoin = "ROUND";
          if (colorVar) bindPaintVar(xBar, "strokes", 0, colorVar);
          if (lineVar) bindVar(xBar, "strokeWeight", lineVar);
          lines.appendChild(xBar);
          // Center the X in the box and let it scale with the size-driven frame;
          // the stroke weight is bound separately so thickness stays line-size.
          try { xBar.x = (box - xBar.width) / 2; } catch (_burgerXPosXErr) {}
          try { xBar.y = (box - xBar.height) / 2; } catch (_burgerXPosYErr) {}
          try { xBar.constraints = { horizontal: "SCALE", vertical: "SCALE" }; } catch (_burgerXScaleErr) {}
          // Bind the frame size to the size variable so the bounding box matches
          // the hamburger state exactly.
          if (sizeVar) {
            bindVar(lines, "width", sizeVar);
            bindVar(lines, "height", sizeVar);
          }
        } else {
          // Hamburger: three stacked bars centered in a fixed square frame.
          // Use the same static box x box size as the open (X) state so both
          // variants share an identical bounding box.
          lines = figma.createFrame();
          lines.name = "Lines";
          lines.layoutMode = "VERTICAL";
          lines.primaryAxisSizingMode = "FIXED";
          lines.counterAxisSizingMode = "FIXED";
          lines.primaryAxisAlignItems = "CENTER";
          lines.counterAxisAlignItems = "CENTER";
          lines.itemSpacing = gapPx;
          lines.clipsContent = false;
          lines.fills = [];
          lines.resize(box, box);
          if (gapVar) bindVar(lines, "itemSpacing", gapVar);
          // Size variable drives the square bounding box, identical to the X state.
          if (sizeVar) {
            bindVar(lines, "width", sizeVar);
            bindVar(lines, "height", sizeVar);
          }
          for (var bi = 0; bi < 3; bi++) {
            var bar = makeBurgerBar(false, true);
            lines.appendChild(bar);
            try { bar.layoutGrow = 0; } catch (_burgerBarGrowErr) {}
            // Fill the frame width (= size) instead of binding the bar width;
            // keep the thickness fixed (driven by the line-size variable).
            try { bar.layoutSizingHorizontal = "FILL"; } catch (_burgerBarFillErr) {}
            try { bar.layoutSizingVertical = "FIXED"; } catch (_burgerBarFixedErr) {}
          }
        }

        comp.appendChild(lines);
        try { lines.layoutGrow = 0; } catch (_burgerGrowErr) {}
        try { lines.layoutAlign = "INHERIT"; } catch (_burgerAlignErr) {}

        if (state === "focus") {
          comp.effects = [{
            type: "DROP_SHADOW",
            color: { r: 0.2, g: 0.53, b: 0.9, a: 0.4 },
            offset: { x: 0, y: 0 },
            radius: 0,
            spread: 3,
            visible: true,
            blendMode: "NORMAL",
          }];
        }
        if (state === "disabled") comp.opacity = 0.6;

        var colIndex = oi * states.length + sti;
        comp.x = colIndex * cellW;
        comp.y = si * cellH;
        page.appendChild(comp);
        components.push(comp);
      }
    }
  }

  progress("Created " + components.length + " burger variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Burger";
  return componentSet;
}

// ---------------------------------------------------------------------------
// SegmentedControl
// ---------------------------------------------------------------------------

function buildSegmentedControlComponentSet(varMap, page, font) {
  var sizes = ["default", "xs", "sm", "md", "lg", "xl"];
  var orientations = ["horizontal", "vertical"];
  var fullWidths = [false, true];
  var states = ["default", "hover", "disabled"];
  var segments = ["React", "Angular", "Vue"];
  var activeIndex = 0;
  var components = [];
  // Column cursor that only advances for orientation/full-width pairs we
  // actually build, so skipped combinations don't leave gaps in the layout.
  var pairCol = 0;

  // Static geometry snapshots per size (variables drive the live values).
  var fontSizes = { default: 14, xs: 12, sm: 13, md: 14, lg: 16, xl: 18 };
  var padXs = { default: 12, xs: 8, sm: 10, md: 12, lg: 16, xl: 20 };
  var padYs = { default: 7, xs: 4, sm: 6, md: 7, lg: 9, xl: 11 };
  var radii = { default: 8, xs: 4, sm: 6, md: 8, lg: 12, xl: 16 };
  var indicatorRadii = { default: 6, xs: 2, sm: 4, md: 6, lg: 10, xl: 14 };
  var rootPad = 4;
  var rootBorderW = 1;
  var indicatorBorderW = 1;
  var fullWidthHPx = 320;
  var fullWidthVPx = 220;

  var cellW = 380;
  var cellH = 150;

  for (var oi = 0; oi < orientations.length; oi++) {
    var orientation = orientations[oi];
    var isVertical = orientation === "vertical";
    var capOrientation = orientation.charAt(0).toUpperCase() + orientation.slice(1);

    for (var fwi = 0; fwi < fullWidths.length; fwi++) {
      var isFullWidth = fullWidths[fwi];
      var capFullWidth = isFullWidth ? "True" : "False";

      // Vertical segmented controls are only used at full width — skip the
      // vertical, non-full-width combinations entirely.
      if (isVertical && !isFullWidth) continue;

      for (var si = 0; si < sizes.length; si++) {
        var size = sizes[si];
        var capSize = size === "default" ? "Default" : size.toUpperCase();
        var fontSz = fontSizes[size];
        var padX = padXs[size];
        var padY = padYs[size];
        var rad = radii[size];
        var indicatorRad = indicatorRadii[size];

        for (var sti = 0; sti < states.length; sti++) {
          var state = states[sti];
          var capState = state.charAt(0).toUpperCase() + state.slice(1);
          var isDisabled = state === "disabled";
          var isHover = state === "hover";

          var rootBgPath = isDisabled ? "segmentedcontrol/root-background-disabled" : "segmentedcontrol/root-background";
          var rootBorderPath = isDisabled ? "segmentedcontrol/root-border-disabled" : "segmentedcontrol/root-border";
          var indicatorBgPath = isDisabled ? "segmentedcontrol/indicator-background-disabled" : "segmentedcontrol/indicator-background";
          var indicatorBorderPath = isDisabled ? "segmentedcontrol/indicator-border-disabled" : "segmentedcontrol/indicator-border";
          var labelActivePath = isDisabled ? "segmentedcontrol/label-text-disabled" : "segmentedcontrol/label-text-active";
          var labelInactivePath = isDisabled
            ? "segmentedcontrol/label-text-disabled"
            : (isHover ? "segmentedcontrol/label-text-hover" : "segmentedcontrol/label-text");

          var comp = figma.createComponent();
          comp.name =
            "Size=" + capSize +
            ", Orientation=" + capOrientation +
            ", FullWidth=" + capFullWidth +
            ", State=" + capState;
          comp.layoutMode = isVertical ? "VERTICAL" : "HORIZONTAL";
          comp.primaryAxisSizingMode = (isFullWidth && !isVertical) ? "FIXED" : "AUTO";
          comp.counterAxisSizingMode = (isFullWidth && isVertical) ? "FIXED" : "AUTO";
          // NOTE: counterAxisAlignItems only accepts MIN/CENTER/MAX/BASELINE.
          // Equal-size segments on the counter axis come from each child's
          // layoutAlign = "STRETCH" below, not from the parent.
          comp.counterAxisAlignItems = "CENTER";
          comp.itemSpacing = 0;
          comp.paddingLeft = rootPad;
          comp.paddingRight = rootPad;
          comp.paddingTop = rootPad;
          comp.paddingBottom = rootPad;
          comp.cornerRadius = rad;
          comp.fills = [{ type: "SOLID", color: { r: 0.95, g: 0.95, b: 0.96 } }];
          comp.strokes = [{ type: "SOLID", color: { r: 0.85, g: 0.85, b: 0.87 } }];
          comp.strokeWeight = rootBorderW;
          comp.strokeAlign = "INSIDE";
          if (varMap[rootBgPath]) bindPaintVar(comp, "fills", 0, varMap[rootBgPath]);
          if (varMap[rootBorderPath]) bindPaintVar(comp, "strokes", 0, varMap[rootBorderPath]);
          if (varMap["segmentedcontrol/root-border-width"]) bindVar(comp, "strokeWeight", varMap["segmentedcontrol/root-border-width"]);
          if (varMap["segmentedcontrol/root-padding"]) {
            bindVar(comp, "paddingLeft", varMap["segmentedcontrol/root-padding"]);
            bindVar(comp, "paddingRight", varMap["segmentedcontrol/root-padding"]);
            bindVar(comp, "paddingTop", varMap["segmentedcontrol/root-padding"]);
            bindVar(comp, "paddingBottom", varMap["segmentedcontrol/root-padding"]);
          }
          if (varMap["segmentedcontrol/radius-" + size]) {
            bindVar(comp, "topLeftRadius", varMap["segmentedcontrol/radius-" + size]);
            bindVar(comp, "topRightRadius", varMap["segmentedcontrol/radius-" + size]);
            bindVar(comp, "bottomLeftRadius", varMap["segmentedcontrol/radius-" + size]);
            bindVar(comp, "bottomRightRadius", varMap["segmentedcontrol/radius-" + size]);
          }

          // For full-width variants, fix the track's main dimension BEFORE adding
          // segments so each segment can reliably FILL the available space.
          if (isFullWidth && !isVertical) {
            try { comp.resize(fullWidthHPx, comp.height); } catch (_scResizeHErr) {}
          } else if (isFullWidth && isVertical) {
            try { comp.resize(fullWidthVPx, comp.height); } catch (_scResizeVErr) {}
          }

          for (var segIdx = 0; segIdx < segments.length; segIdx++) {
            var isActive = segIdx === activeIndex;
            var seg = figma.createFrame();
            seg.name = isActive ? "Segment (Active)" : "Segment";
            seg.layoutMode = "HORIZONTAL";
            seg.primaryAxisSizingMode = "AUTO";
            seg.counterAxisSizingMode = "AUTO";
            seg.primaryAxisAlignItems = "CENTER";
            seg.counterAxisAlignItems = "CENTER";
            seg.paddingLeft = padX;
            seg.paddingRight = padX;
            seg.paddingTop = padY;
            seg.paddingBottom = padY;
            seg.cornerRadius = indicatorRad;
            seg.itemSpacing = 0;
            seg.clipsContent = false;

            if (isActive) {
              seg.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
              seg.strokes = [{ type: "SOLID", color: { r: 0.85, g: 0.85, b: 0.87 } }];
              seg.strokeWeight = indicatorBorderW;
              seg.strokeAlign = "INSIDE";
              if (varMap[indicatorBgPath]) bindPaintVar(seg, "fills", 0, varMap[indicatorBgPath]);
              if (varMap[indicatorBorderPath]) bindPaintVar(seg, "strokes", 0, varMap[indicatorBorderPath]);
              if (varMap["segmentedcontrol/indicator-border-width"]) bindVar(seg, "strokeWeight", varMap["segmentedcontrol/indicator-border-width"]);
            } else {
              seg.fills = [];
            }
            if (varMap["segmentedcontrol/padding-x-" + size]) {
              bindVar(seg, "paddingLeft", varMap["segmentedcontrol/padding-x-" + size]);
              bindVar(seg, "paddingRight", varMap["segmentedcontrol/padding-x-" + size]);
            }
            if (varMap["segmentedcontrol/padding-y-" + size]) {
              bindVar(seg, "paddingTop", varMap["segmentedcontrol/padding-y-" + size]);
              bindVar(seg, "paddingBottom", varMap["segmentedcontrol/padding-y-" + size]);
            }
            if (varMap["segmentedcontrol/indicator-radius-" + size]) {
              bindVar(seg, "topLeftRadius", varMap["segmentedcontrol/indicator-radius-" + size]);
              bindVar(seg, "topRightRadius", varMap["segmentedcontrol/indicator-radius-" + size]);
              bindVar(seg, "bottomLeftRadius", varMap["segmentedcontrol/indicator-radius-" + size]);
              bindVar(seg, "bottomRightRadius", varMap["segmentedcontrol/indicator-radius-" + size]);
            }

            var labelNode = figma.createText();
            labelNode.fontName = font;
            labelNode.characters = segments[segIdx];
            labelNode.fontSize = fontSz;
            labelNode.fills = [{ type: "SOLID", color: isActive ? { r: 0.13, g: 0.13, b: 0.13 } : { r: 0.5, g: 0.5, b: 0.5 } }];
            var labelPath = isActive ? labelActivePath : labelInactivePath;
            if (varMap[labelPath]) bindPaintVar(labelNode, "fills", 0, varMap[labelPath]);
            if (varMap["segmentedcontrol/font-size-" + size]) bindVar(labelNode, "fontSize", varMap["segmentedcontrol/font-size-" + size]);
            if (varMap["segmentedcontrol/font-family"]) bindVar(labelNode, "fontFamily", varMap["segmentedcontrol/font-family"]);
            if (varMap["segmentedcontrol/font-weight"]) bindVar(labelNode, "fontStyle", varMap["segmentedcontrol/font-weight"]);
            if (varMap["segmentedcontrol/line-height-" + size]) bindVar(labelNode, "lineHeight", varMap["segmentedcontrol/line-height-" + size]);
            seg.appendChild(labelNode);

            comp.appendChild(seg);
            // Sizing rules (using the explicit layoutSizing API, which is far more
            // reliable than layoutAlign alone for filling a track):
            //  - Vertical: segments always fill the track width (counter axis).
            //  - Horizontal full-width: segments share the track width equally.
            //  - Otherwise segments hug their label.
            if (isVertical) {
              if (isFullWidth) {
                // Parent width is FIXED, so segments can fill it exactly.
                try { seg.layoutSizingHorizontal = "FILL"; } catch (_scSegHErr) {}
              } else {
                // Parent width hugs the widest segment; STRETCH equalizes them.
                try { seg.layoutAlign = "STRETCH"; } catch (_scSegAlignErr) {}
              }
              try { seg.layoutSizingVertical = "HUG"; } catch (_scSegVErr) {}
            } else {
              try { seg.layoutSizingHorizontal = isFullWidth ? "FILL" : "HUG"; } catch (_scSegHErr2) {}
              try { seg.layoutSizingVertical = "HUG"; } catch (_scSegVErr2) {}
            }
          }

          if (isDisabled) comp.opacity = 0.6;

          var colIndex = pairCol * states.length + sti;
          comp.x = colIndex * cellW;
          comp.y = si * cellH;
          page.appendChild(comp);
          components.push(comp);
        }
      }
      pairCol++;
    }
  }

  progress("Created " + components.length + " segmented control variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "SegmentedControl";
  return componentSet;
}

// ---------------------------------------------------------------------------
// Slider
// ---------------------------------------------------------------------------

function buildSliderComponentSet(varMap, page, font) {
  var sizes = ["default", "xs", "sm", "md", "lg", "xl"];
  var radii = ["default", "xs", "sm", "md", "lg", "xl"];
  var states = ["default", "focus", "disabled"];
  var markModes = ["off", "on"];
  var components = [];

  var trackWidth = 260;
  var sliderValuePercent = 40;
  var gap = 18;
  var colGap = 28;

  var sizeThumb = { default: 16, xs: 12, sm: 14, md: 16, lg: 20, xl: 24 };
  var sizeTrack = { default: 6, xs: 2, sm: 4, md: 6, lg: 8, xl: 10 };

  var rowYOffsets = [];
  var runningY = 0;
  for (var rsi = 0; rsi < sizes.length; rsi++) {
    for (var rsti = 0; rsti < states.length; rsti++) {
      rowYOffsets.push(runningY);
      var rowThumb = sizeThumb[sizes[rsi]] != null ? sizeThumb[sizes[rsi]] : sizeThumb.default;
      var rowH = rowThumb + 34;
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

          var thumbPx = sizeThumb[size] != null ? sizeThumb[size] : sizeThumb.default;
          var trackPx = sizeTrack[size] != null ? sizeTrack[size] : sizeTrack.default;
          var trackY = (thumbPx - trackPx) / 2;

          var track = figma.createRectangle();
          track.name = "Track";
          track.resize(trackWidth, trackPx);
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
          bar.resize(Math.round((trackWidth * sliderValuePercent) / 100), trackPx);
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
          thumb.resize(thumbPx, thumbPx);
          thumb.x = Math.round((trackWidth * sliderValuePercent) / 100) - Math.round(thumbPx / 2);
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
              mark.y = trackY + Math.round(trackPx / 2) - 4;
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
              bindVar(labelNode, "fontFamily", varMap["slider/mark-label-font-family"]);
              bindVar(labelNode, "fontStyle", varMap["slider/mark-label-font-weight"]);
              bindVar(labelNode, "lineHeight", varMap["slider/mark-label-line-height-" + size]);
              labelNode.x = markX - 12;
              labelNode.y = trackY + trackPx + 10;
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
  var sizes = ["default", "xs", "sm", "md", "lg", "xl"];
  var radii = ["default", "xs", "sm", "md", "lg", "xl"];
  var states = ["default", "focus", "disabled"];
  var markModes = ["off", "on"];
  var components = [];

  var trackWidth = 260;
  var rangeValues = [20, 60];
  var gap = 18;
  var colGap = 28;

  var sizeThumb = { default: 16, xs: 12, sm: 14, md: 16, lg: 20, xl: 24 };
  var sizeTrack = { default: 6, xs: 2, sm: 4, md: 6, lg: 8, xl: 10 };

  var rowYOffsets = [];
  var runningY = 0;
  for (var rsi = 0; rsi < sizes.length; rsi++) {
    for (var rsti = 0; rsti < states.length; rsti++) {
      rowYOffsets.push(runningY);
      var rowThumb = sizeThumb[sizes[rsi]] != null ? sizeThumb[sizes[rsi]] : sizeThumb.default;
      var rowH = rowThumb + 34;
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

          var thumbPx = sizeThumb[size] != null ? sizeThumb[size] : sizeThumb.default;
          var trackPx = sizeTrack[size] != null ? sizeTrack[size] : sizeTrack.default;
          var trackY = (thumbPx - trackPx) / 2;
          var fromX = Math.round((trackWidth * rangeValues[0]) / 100);
          var toX = Math.round((trackWidth * rangeValues[1]) / 100);

          var track = figma.createRectangle();
          track.name = "Track";
          track.resize(trackWidth, trackPx);
          track.x = 0;
          track.y = trackY;
          track.cornerRadius = 999;
          track.fills = [{ type: "SOLID", color: { r: 0.22, g: 0.24, b: 0.28 } }];
          bindPaintVar(track, "fills", 0, varMap[rangeSliderTrackBgPath(varMap, state)]);
          bindVar(track, "height", varMap["rangeslider/track-height-" + size]);
          bindVar(track, "topLeftRadius", varMap["rangeslider/radius-" + radius]);
          bindVar(track, "topRightRadius", varMap["rangeslider/radius-" + radius]);
          bindVar(track, "bottomLeftRadius", varMap["rangeslider/radius-" + radius]);
          bindVar(track, "bottomRightRadius", varMap["rangeslider/radius-" + radius]);
          comp.appendChild(track);

          var bar = figma.createRectangle();
          bar.name = "Bar";
          bar.resize(toX - fromX, trackPx);
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
          thumbFrom.resize(thumbPx, thumbPx);
          thumbFrom.x = fromX - Math.round(thumbPx / 2);
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
          thumbTo.resize(thumbPx, thumbPx);
          thumbTo.x = toX - Math.round(thumbPx / 2);
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
              mark.y = trackY + Math.round(trackPx / 2) - 4;
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
              bindVar(labelNode, "fontFamily", varMap["rangeslider/mark-label-font-family"]);
              bindVar(labelNode, "fontStyle", varMap["rangeslider/mark-label-font-weight"]);
              bindVar(labelNode, "lineHeight", varMap["rangeslider/mark-label-line-height-" + size]);
              labelNode.x = markX - 12;
              labelNode.y = trackY + trackPx + 10;
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

function rangeSliderTrackBgPath(varMap, state) {
  if (state === "disabled") {
    return pickExistingPath(varMap, [
      "rangeslider/track-background-disabled",
      "rangeslider/track-background"
    ]);
  }
  if (state !== "default") {
    return pickExistingPath(varMap, [
      "rangeslider/track-background-" + state,
      "rangeslider/track-background"
    ]);
  }
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
  var sizes = ["default", "xs", "sm", "md", "lg", "xl"];
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
    var capSize = size === "default" ? "Default" : size.toUpperCase();

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
          bindVar(anchorText, "fontFamily", varMap["anchor/font-family"]);
          bindVar(anchorText, "lineHeight", varMap["anchor/line-height-" + size]);
          bindVar(anchorText, "fontStyle", varMap["anchor/font-weight-" + weight]);
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

async function buildImageComponentSet(varMap, page, font) {
  var sizes = ["default", "xs", "sm", "md", "lg", "xl"];
  var radii = ["default", "xs", "sm", "md", "lg", "xl"];
  var components = [];
  var checkerImageHash = null;

  try {
    // Tiny embedded checkerboard tile used as image placeholder.
    // Keep as raw bytes (not atob) so it works reliably in Figma plugin runtime.
    var checkerPngBytes = new Uint8Array([
      137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
      0, 0, 0, 16, 0, 0, 0, 16, 8, 6, 0, 0, 0, 31, 243, 255,
      97, 0, 0, 0, 40, 73, 68, 65, 84, 120, 218, 99, 248, 244, 249, 219,
      127, 100, 124, 230, 194, 13, 20, 76, 72, 158, 97, 24, 24, 64, 170, 6,
      116, 249, 225, 96, 192, 104, 58, 24, 77, 7, 64, 12, 0, 116, 134, 166,
      174, 194, 155, 157, 69, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
    ]);
    checkerImageHash = figma.createImage(checkerPngBytes).hash;
  } catch (checkerErr) {
    progress("Image placeholder creation failed: " + String(checkerErr));
  }

  var defaultWidthBySize = {
    default: 360,
    xs: 120,
    sm: 180,
    md: 240,
    lg: 360,
    xl: 480,
  };
  var defaultHeightBySize = {
    default: 220,
    xs: 80,
    sm: 120,
    md: 160,
    lg: 220,
    xl: 280,
  };

  for (var si = 0; si < sizes.length; si++) {
    var size = sizes[si];
    var capSize = size === "default" ? "Default" : size.toUpperCase();
    var widthVar = varMap["image/width-" + size] || varMap["image/width"];
    var heightVar = varMap["image/height-" + size] || varMap["image/height"];
    var baseW = defaultWidthBySize[size] || 360;
    var baseH = defaultHeightBySize[size] || 220;

    for (var ri = 0; ri < radii.length; ri++) {
      var radius = radii[ri];
      var capRadius = radius === "default" ? "Default" : radius.toUpperCase();
      var radiusVar = varMap["image/radius-" + radius] || varMap["image/radius"];

      var comp = figma.createComponent();
      comp.name = "Size=" + capSize + ", Radius=" + capRadius;
      comp.layoutMode = "NONE";
      comp.clipsContent = true;
      comp.resize(baseW, baseH);
      comp.fills = [];
      comp.strokes = [];
      // Ensure variants do not overlap before combineAsVariants.
      // Figma uses pre-combine positions to derive the variant matrix layout.
      comp.x = si * 560;
      comp.y = ri * 320;

      var imageSurface = figma.createRectangle();
      imageSurface.name = "Image Surface";
      imageSurface.resize(baseW, baseH);
      imageSurface.x = 0;
      imageSurface.y = 0;
      imageSurface.constraints = { horizontal: "STRETCH", vertical: "STRETCH" };
      if (checkerImageHash) {
        imageSurface.fills = [{
          type: "IMAGE",
          imageHash: checkerImageHash,
          scaleMode: "TILE",
          scalingFactor: 1,
        }];
      } else {
        // Fallback if image creation fails.
        imageSurface.fills = [{ type: "SOLID", color: { r: 0.90, g: 0.91, b: 0.93 } }];
      }
      imageSurface.strokes = [];
      imageSurface.cornerRadius = 8;

      bindVar(comp, "width", widthVar);
      bindVar(comp, "height", heightVar);
      bindVar(imageSurface, "width", widthVar);
      bindVar(imageSurface, "height", heightVar);

      bindVar(comp, "topLeftRadius", radiusVar);
      bindVar(comp, "topRightRadius", radiusVar);
      bindVar(comp, "bottomLeftRadius", radiusVar);
      bindVar(comp, "bottomRightRadius", radiusVar);
      bindVar(imageSurface, "topLeftRadius", radiusVar);
      bindVar(imageSurface, "topRightRadius", radiusVar);
      bindVar(imageSurface, "bottomLeftRadius", radiusVar);
      bindVar(imageSurface, "bottomRightRadius", radiusVar);

      comp.appendChild(imageSurface);
      page.appendChild(comp);
      components.push(comp);
    }
  }

  progress("Created " + components.length + " image variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Image";
  return componentSet;
}

/**
 * Find a default + candidate list of icon components for the Avatar "Icon" content
 * INSTANCE_SWAP. Prefers user/person/account/profile glyphs, falls back to any icon.
 */
async function findAvatarIconSources() {
  var iconsPage = null;
  for (var pi = 0; pi < figma.root.children.length; pi++) {
    var p = figma.root.children[pi];
    if (p.type !== "PAGE") continue;
    await p.loadAsync();
    if (!iconsPage && p.name && p.name.toLowerCase() === "icons") iconsPage = p;
  }
  var searchScope = iconsPage || figma.root;
  var nodes = [];
  try {
    nodes = searchScope.findAll(function (n) {
      return n.type === "COMPONENT" || n.type === "COMPONENT_SET";
    });
  } catch (_eFa) {
    nodes = [];
  }
  var candidates = [];
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].type === "COMPONENT") {
      candidates.push(nodes[i]);
    } else {
      var children = nodes[i].children || [];
      for (var ci = 0; ci < children.length; ci++) {
        if (children[ci].type === "COMPONENT") candidates.push(children[ci]);
      }
    }
  }
  function score(c) {
    var n = String(c.name || "").toLowerCase().replace(/[\s_\-\/]+/g, "");
    if (!n) return 0;
    if (n.indexOf("usercircle") >= 0) return 110;
    if (n.indexOf("user") >= 0) return 100;
    if (n.indexOf("person") >= 0) return 95;
    if (n.indexOf("account") >= 0) return 90;
    if (n.indexOf("profile") >= 0) return 85;
    if (n.indexOf("avatar") >= 0) return 80;
    if (n.indexOf("contact") >= 0) return 60;
    return 0;
  }
  var best = null;
  var bestScore = 0;
  for (var j = 0; j < candidates.length; j++) {
    var s = score(candidates[j]);
    if (s > bestScore) {
      bestScore = s;
      best = candidates[j];
    }
  }
  // Always fall back to the first available icon (alphabetical) so the swap is
  // created whenever ANY icon component exists — the user can swap from there.
  if (!best && candidates.length > 0) {
    var sorted = candidates.slice().sort(function (a, b) {
      return String(a.name).localeCompare(String(b.name));
    });
    best = sorted[0];
  }
  if (best) progress("[Avatar] Icon swap default: " + best.name + " (from " + candidates.length + " candidates)");
  else progress("[Avatar] No icon component found; using drawn person placeholder.");
  return { defaultIcon: best, candidates: candidates };
}

async function buildAvatarComponentSet(varMap, page, font) {
  var sizes = ["default", "xs", "sm", "md", "lg", "xl"];
  var radii = ["default", "xs", "sm", "md", "lg", "xl"];
  var paletteColors = ["red", "green", "blue", "purple", "orange", "yellow", "pink", "cyan", "navy"];
  var components = [];
  var colWidth = 100;
  var rowHeight = 100;
  var gap = 16;
  var defaultSizeByKey = { default: 40, xs: 24, sm: 32, md: 40, lg: 48, xl: 56 };

  var iconSources = await findAvatarIconSources();
  var iconDefaultComp = iconSources.defaultIcon;

  function capKey(k) {
    return k === "default" ? "Default" : (k.charAt(0).toUpperCase() + k.slice(1));
  }

  // Drawn fallback person glyph (used only when no icon component exists in the file).
  function makePersonGlyph(sz, colorVar) {
    var svg =
      '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/>' +
      '<path d="M3 21a9 9 0 0 1 18 0v1H3z"/></svg>';
    var node = figma.createNodeFromSvg(svg);
    node.name = "Icon";
    try { node.resize(sz, sz); } catch (_pgSz) {}
    var vecs = node.findAll ? node.findAll(function (n) { return n.type === "VECTOR"; }) : [];
    for (var vi = 0; vi < vecs.length; vi++) {
      vecs[vi].fills = [{ type: "SOLID", color: { r: 0.12, g: 0.12, b: 0.14 } }];
      if (colorVar) bindPaintVar(vecs[vi], "fills", 0, colorVar);
    }
    return node;
  }

  // colorName === "default" → neutral token surface; otherwise a palette color token.
  // content: "initials" (AC text) or "icon" (swappable icon instance / drawn glyph).
  function makeAvatar(sizeKey, radiusKey, colorName, content) {
    var isDefaultColor = colorName === "default";
    var isIcon = content === "icon";
    var baseS = defaultSizeByKey[sizeKey] || 40;
    var bgKey = isDefaultColor ? "avatar/background" : "avatar/color-" + colorName;
    var textKey = isDefaultColor ? "avatar/text" : "avatar/on-color-" + colorName;

    var comp = figma.createComponent();
    comp.name =
      "Size=" + (sizeKey === "default" ? "Default" : sizeKey.toUpperCase()) +
      ", Radius=" + (radiusKey === "default" ? "Default" : radiusKey.toUpperCase()) +
      ", Color=" + capKey(colorName) +
      ", Content=" + (isIcon ? "Icon" : "Initials");
    comp.layoutMode = "VERTICAL";
    comp.primaryAxisSizingMode = "AUTO";
    comp.counterAxisSizingMode = "AUTO";
    comp.primaryAxisAlignItems = "CENTER";
    comp.counterAxisAlignItems = "CENTER";
    comp.itemSpacing = 0;
    comp.fills = [];
    comp.strokes = [];

    var shell = figma.createFrame();
    shell.name = "Face";
    shell.layoutMode = "HORIZONTAL";
    shell.primaryAxisSizingMode = "FIXED";
    shell.counterAxisSizingMode = "FIXED";
    shell.primaryAxisAlignItems = "CENTER";
    shell.counterAxisAlignItems = "CENTER";
    shell.resize(baseS, baseS);
    shell.fills = [{ type: "SOLID", color: { r: 0.88, g: 0.9, b: 0.94 } }];
    shell.strokeAlign = "INSIDE";
    shell.itemSpacing = 0;
    shell.paddingTop = 0;
    shell.paddingBottom = 0;
    shell.paddingLeft = 0;
    shell.paddingRight = 0;
    shell.clipsContent = true;

    bindPaintVar(shell, "fills", 0, varMap[bgKey]);
    if (isDefaultColor) {
      shell.strokes = [{ type: "SOLID", color: { r: 0.75, g: 0.78, b: 0.84 } }];
      shell.strokeWeight = 1;
      bindVar(shell, "strokeWeight", varMap["avatar/border-width"]);
      bindPaintVar(shell, "strokes", 0, varMap["avatar/border"]);
    } else {
      // Filled palette avatars have no border so the color reads as a solid swatch.
      shell.strokes = [];
    }
    bindVar(shell, "width", varMap["avatar/size-" + sizeKey]);
    bindVar(shell, "height", varMap["avatar/size-" + sizeKey]);
    bindVar(shell, "topLeftRadius", varMap["avatar/radius-" + radiusKey]);
    bindVar(shell, "topRightRadius", varMap["avatar/radius-" + radiusKey]);
    bindVar(shell, "bottomLeftRadius", varMap["avatar/radius-" + radiusKey]);
    bindVar(shell, "bottomRightRadius", varMap["avatar/radius-" + radiusKey]);

    var iconNode = null;
    if (isIcon) {
      var glyphSize = Math.max(12, Math.round(baseS * 0.58));
      if (iconDefaultComp) {
        try {
          iconNode = iconDefaultComp.createInstance();
          iconNode.name = "Icon";
          try { iconNode.resize(glyphSize, glyphSize); } catch (_riSz) {}
          var iconColorVar = varMap[textKey];
          var ivecs = iconNode.findAll(function (n) { return n.type === "VECTOR"; });
          for (var ivi = 0; ivi < ivecs.length; ivi++) {
            var iv = ivecs[ivi];
            if (iv.strokes && iv.strokes.length > 0 && iconColorVar) bindPaintVar(iv, "strokes", 0, iconColorVar);
            if (iv.fills && iv.fills.length > 0 && iconColorVar) bindPaintVar(iv, "fills", 0, iconColorVar);
          }
          shell.appendChild(iconNode);
        } catch (_eIcon) {
          iconNode = null;
        }
      }
      if (!iconNode) {
        var glyph = makePersonGlyph(glyphSize, varMap[textKey]);
        shell.appendChild(glyph);
      }
    } else {
      var initials = figma.createText();
      initials.name = "Initials";
      initials.fontName = font;
      initials.characters = "AC";
      initials.textAlignHorizontal = "CENTER";
      initials.fontSize = 14;
      initials.fills = [{ type: "SOLID", color: { r: 0.12, g: 0.12, b: 0.14 } }];
      bindPaintVar(initials, "fills", 0, varMap[textKey]);
      bindVar(initials, "fontSize", varMap["avatar/font-size-" + sizeKey]);
      bindVar(initials, "fontFamily", varMap["avatar/font-family"]);
      bindVar(initials, "fontStyle", varMap["avatar/font-weight"]);
      shell.appendChild(initials);
    }

    comp.appendChild(shell);
    page.appendChild(comp);
    return comp;
  }

  // Emit a full Size × Radius matrix for one (color, content) combination as a
  // stacked block. Blocks are placed top-to-bottom in emission order.
  var blockHeight = sizes.length * (rowHeight + gap);
  var blockGap = gap * 3;
  var blockIndex = 0;
  function emitBlock(colorName, content) {
    var blockY = blockIndex * (blockHeight + blockGap);
    for (var bs = 0; bs < sizes.length; bs++) {
      for (var br = 0; br < radii.length; br++) {
        var c = makeAvatar(sizes[bs], radii[br], colorName, content);
        c.x = br * (colWidth + gap);
        c.y = blockY + bs * (rowHeight + gap);
        components.push(c);
      }
    }
    blockIndex++;
  }

  // Initials: neutral matrix, then a full matrix per palette color.
  emitBlock("default", "initials");
  for (var ci = 0; ci < paletteColors.length; ci++) {
    if (!varMap["avatar/color-" + paletteColors[ci]]) continue;
    emitBlock(paletteColors[ci], "initials");
  }

  // Icon: neutral matrix, then a full matrix per palette color.
  emitBlock("default", "icon");
  for (var ici = 0; ici < paletteColors.length; ici++) {
    if (!varMap["avatar/color-" + paletteColors[ici]]) continue;
    emitBlock(paletteColors[ici], "icon");
  }

  progress("Created " + components.length + " avatar variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Avatar";
  return componentSet;
}

// ---------------------------------------------------------------------------
// Table — TableHeader (Show sort + sort INSTANCE_SWAP) + TableBody COMPONENT_SET
// with Variant = Badge | Progress | Text | Flag | Icon | Avatar (nested component instances; no slots).
// ---------------------------------------------------------------------------

async function findTableSortIconSources() {
  var iconCandidates = [];
  var iconsPage = null;
  for (var pi = 0; pi < figma.root.children.length; pi++) {
    var p = figma.root.children[pi];
    if (p.type !== "PAGE") continue;
    await p.loadAsync();
    if (!iconsPage && p.name && p.name.toLowerCase() === "icons") iconsPage = p;
  }
  var searchScope = iconsPage || figma.root;
  var nodes = searchScope.findAll(function (n) {
    return n.type === "COMPONENT" || n.type === "COMPONENT_SET";
  });
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].type === "COMPONENT") {
      iconCandidates.push(nodes[i]);
    } else if (nodes[i].type === "COMPONENT_SET") {
      var sc = nodes[i].children || [];
      for (var ci = 0; ci < sc.length; ci++) {
        if (sc[ci].type === "COMPONENT") iconCandidates.push(sc[ci]);
      }
    }
  }

  function normName(n) {
    return String(n || "")
      .toLowerCase()
      .replace(/[\s_\-\/]+/g, "");
  }

  function sortIconScore(c) {
    var n = normName(c.name);
    if (!n) return 0;
    if (n.indexOf("switchvertical") >= 0) return 100;
    if (n.indexOf("switch") >= 0 && n.indexOf("vertical") >= 0) return 99;
    if (n.indexOf("arrowswitch") >= 0) return 98;
    if (n.indexOf("sort") >= 0 && (n.indexOf("vertical") >= 0 || n.indexOf("both") >= 0)) return 95;
    if (n.indexOf("selector") >= 0 || n.indexOf("unfold") >= 0) return 88;
    if (n.indexOf("chevron") >= 0 && n.indexOf("up") >= 0 && n.indexOf("down") >= 0) return 82;
    if (n.indexOf("arrow") >= 0 && n.indexOf("up") >= 0 && n.indexOf("down") >= 0) return 80;
    if (n.indexOf("sort") >= 0) return 55;
    if (n.indexOf("chevron") >= 0 && (n.indexOf("expand") >= 0 || n.indexOf("double") >= 0)) return 40;
    return 0;
  }

  var defaultIcon = null;
  var best = 0;
  for (var j = 0; j < iconCandidates.length; j++) {
    var s = sortIconScore(iconCandidates[j]);
    if (s > best) {
      best = s;
      defaultIcon = iconCandidates[j];
    }
  }
  if (!defaultIcon && iconCandidates.length > 0) {
    var sorted = iconCandidates.slice().sort(function (a, b) {
      return String(a.name).localeCompare(String(b.name));
    });
    defaultIcon = sorted[0];
  }

  if (defaultIcon) progress("[TableHeader] Sort icon default: " + defaultIcon.name);
  else progress("[TableHeader] Warning: no icon components found; using vector fallback for sort.");

  return { defaultIcon: defaultIcon, candidates: iconCandidates };
}

/** Normalize variant name strings for case/spacing-insensitive substring checks. */
function tableNormToken(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s*,\s*/g, ",")
    .replace(/\s+/g, "");
}

/**
 * Prefer the live COMPONENT_SET from `buildComponents`, but if Table is built alone
 * (or refs are stale), find "Badge" / "Progress" / "Text" on the current page.
 */
function tableResolveComponentSetFromPage(preferred, pageNode, setName) {
  if (preferred && preferred.type === "COMPONENT_SET") return preferred;
  if (!pageNode) return null;
  var want = String(setName || "").toLowerCase().trim();
  try {
    var found = pageNode.findAll(function (n) {
      return n.type === "COMPONENT_SET" && String(n.name || "").toLowerCase().trim() === want;
    });
    return found && found.length ? found[0] : null;
  } catch (_eFa) {
    return null;
  }
}

/** First COMPONENT child in a set matching all fragments (case-insensitive). */
function tableFindComponentByNameParts(componentSet, nameParts) {
  if (!componentSet || componentSet.type !== "COMPONENT_SET") return null;
  var reqs = [];
  for (var ri = 0; ri < nameParts.length; ri++) {
    reqs.push(tableNormToken(nameParts[ri]));
  }
  var ch = componentSet.children || [];
  for (var i = 0; i < ch.length; i++) {
    if (ch[i].type !== "COMPONENT") continue;
    var nm = tableNormToken(ch[i].name);
    var ok = true;
    for (var pj = 0; pj < reqs.length; pj++) {
      if (!reqs[pj]) continue;
      if (nm.indexOf(reqs[pj]) < 0) {
        ok = false;
        break;
      }
    }
    if (ok) return ch[i];
  }
  return null;
}

function tableFirstComponentChild(componentSet) {
  if (!componentSet || componentSet.type !== "COMPONENT_SET") return null;
  var ch = componentSet.children || [];
  for (var fi = 0; fi < ch.length; fi++) {
    if (ch[fi].type === "COMPONENT") return ch[fi];
  }
  return null;
}

/** Best Outline + Error badge; prefers XS + XL radius + Circle=Off. */
function tablePickBestBadge(componentSet) {
  if (!componentSet || componentSet.type !== "COMPONENT_SET") return null;
  var outline = tableNormToken("Variant=Outline");
  var errCol = tableNormToken("Color=Error");
  var ch = componentSet.children || [];
  var best = null;
  var bestScore = -1;
  for (var bi = 0; bi < ch.length; bi++) {
    if (ch[bi].type !== "COMPONENT") continue;
    var nm = tableNormToken(ch[bi].name);
    if (nm.indexOf(outline) < 0 || nm.indexOf(errCol) < 0) continue;
    var score = 100;
    if (nm.indexOf(tableNormToken("Size=XS")) >= 0) score += 30;
    if (nm.indexOf(tableNormToken("Radius=XL")) >= 0) score += 20;
    if (nm.indexOf(tableNormToken("Circle=Off")) >= 0) score += 10;
    if (score > bestScore) {
      bestScore = score;
      best = ch[bi];
    }
  }
  return best;
}

/** Prefer Size=SM + Radius=Default; else any SM row; else first variant. */
function tablePickBestProgress(componentSet) {
  if (!componentSet || componentSet.type !== "COMPONENT_SET") return null;
  var ch = componentSet.children || [];
  var best = null;
  var bestScore = -1;
  for (var pi = 0; pi < ch.length; pi++) {
    if (ch[pi].type !== "COMPONENT") continue;
    var nm = tableNormToken(ch[pi].name);
    var hasSm = nm.indexOf("size=sm") >= 0;
    var hasDefRad = nm.indexOf("radius=default") >= 0;
    var score = 0;
    if (hasSm && hasDefRad) score = 100;
    else if (hasSm) score = 60;
    else if (hasDefRad && nm.indexOf("size=default") >= 0) score = 40;
    if (score > bestScore) {
      bestScore = score;
      best = ch[pi];
    }
  }
  if (best && bestScore >= 60) return best;
  return tableFirstComponentChild(componentSet);
}

/** Germany flag chip (~21×16) for TableBody Flag variant (no raster assets). */
function tableMakeGermanyFlagFrame() {
  var wrap = figma.createFrame();
  wrap.name = "de";
  wrap.layoutMode = "NONE";
  wrap.clipsContent = true;
  wrap.resize(21.333, 16);
  wrap.fills = [];
  var bandH = 16 / 3;
  var palette = [
    { r: 0, g: 0, b: 0 },
    { r: 0.86, g: 0.08, b: 0.12 },
    { r: 1, g: 0.8, b: 0.15 },
  ];
  for (var bi = 0; bi < 3; bi++) {
    var rect = figma.createRectangle();
    rect.resize(21.333, bandH);
    rect.x = 0;
    rect.y = bi * bandH;
    rect.fills = [{ type: "SOLID", color: palette[bi] }];
    rect.strokes = [];
    wrap.appendChild(rect);
  }
  return wrap;
}

/**
 * Find a default + candidate list of icon components for the TableBody Icon variant
 * INSTANCE_SWAP. Prefers alert-triangle / warning / info, falls back to any icon component.
 */
async function findTableBodyIconSources() {
  var iconsPage = null;
  for (var pi = 0; pi < figma.root.children.length; pi++) {
    var p = figma.root.children[pi];
    if (p.type !== "PAGE") continue;
    await p.loadAsync();
    if (!iconsPage && p.name && p.name.toLowerCase() === "icons") iconsPage = p;
  }
  var searchScope = iconsPage || figma.root;
  var nodes = [];
  try {
    nodes = searchScope.findAll(function (n) {
      return n.type === "COMPONENT" || n.type === "COMPONENT_SET";
    });
  } catch (_eFa) {
    nodes = [];
  }
  var candidates = [];
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].type === "COMPONENT") {
      candidates.push(nodes[i]);
    } else {
      var children = nodes[i].children || [];
      for (var ci = 0; ci < children.length; ci++) {
        if (children[ci].type === "COMPONENT") candidates.push(children[ci]);
      }
    }
  }

  function swapDefaultRefs(componentNode) {
    var refs = [];
    if (!componentNode) return refs;
    if (componentNode.id) refs.push(componentNode.id);
    if (componentNode.key && refs.indexOf(componentNode.key) < 0) refs.push(componentNode.key);
    return refs;
  }

  function score(c) {
    var n = String(c.name || "").toLowerCase().replace(/[\s_\-\/]+/g, "");
    if (!n) return 0;
    if (n.indexOf("alerttriangle") >= 0) return 100;
    if (n.indexOf("alert") >= 0 && n.indexOf("triangle") >= 0) return 99;
    if (n.indexOf("warning") >= 0) return 95;
    if (n.indexOf("alertcircle") >= 0) return 90;
    if (n.indexOf("infocircle") >= 0) return 80;
    if (n.indexOf("info") >= 0) return 70;
    if (n.indexOf("alert") >= 0) return 60;
    return 0;
  }

  var best = null;
  var bestScore = 0;
  for (var j = 0; j < candidates.length; j++) {
    var s = score(candidates[j]);
    if (s > bestScore) {
      bestScore = s;
      best = candidates[j];
    }
  }
  if (!best && candidates.length > 0) {
    var sorted = candidates.slice().sort(function (a, b) {
      return String(a.name).localeCompare(String(b.name));
    });
    best = sorted[0];
  }

  if (best) progress("[TableBody] Icon swap default: " + best.name);
  else progress("[TableBody] Warning: no icon components found; using vector fallback for Icon variant.");

  return { defaultIcon: best, candidates: candidates };
}

/**
 * Find a default + candidate list of flag components for TableBody Flag variant
 * INSTANCE_SWAP.
 *
 * Priority:
 * 1) Components inside a COMPONENT_SET named exactly "Flag"
 * 2) Components whose names include "flag"
 * 3) Any component fallback
 */
async function findTableBodyFlagSources(pageNode) {
  // 1) Hard-priority: component set named exactly Flag / Flags on current page.
  try {
    var scoped = (pageNode && pageNode.findAll)
      ? pageNode.findAll(function (n) {
          return n.type === "COMPONENT_SET";
        })
      : [];
    for (var si = 0; si < scoped.length; si++) {
      var setName = String(scoped[si].name || "").toLowerCase().trim();
      if (setName === "flag" || setName === "flags") {
        var setChildren = scoped[si].children || [];
        var directCandidates = [];
        for (var dci = 0; dci < setChildren.length; dci++) {
          if (setChildren[dci].type === "COMPONENT") directCandidates.push(setChildren[dci]);
        }
        if (directCandidates.length > 0) {
          var directDefault = directCandidates[0];
          progress(
            "[TableBody] Flag swap default: " +
              directDefault.name +
              " (from set '" +
              scoped[si].name +
              "', candidates: " +
              String(directCandidates.length) +
              ")"
          );
          return { defaultFlag: directDefault, candidates: directCandidates };
        }
      }
    }
  } catch (_eScoped) {}

  // 2) Fallback: search entire local document for anything flag-like.
  var searchScope = figma.root;
  var nodes = [];
  try {
    nodes = searchScope.findAll(function (n) {
      return n.type === "COMPONENT" || n.type === "COMPONENT_SET";
    });
  } catch (_eFa) {
    nodes = [];
  }
  var candidates = [];
  var explicitFlagSetChildren = [];
  var nameMatchedFlagComponents = [];
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].type === "COMPONENT") {
      candidates.push(nodes[i]);
      var compNameNorm = String(nodes[i].name || "").toLowerCase().replace(/[\s_\-\/]+/g, "");
      if (compNameNorm.indexOf("flag") >= 0) nameMatchedFlagComponents.push(nodes[i]);
    } else {
      var children = nodes[i].children || [];
      var setNameNorm = String(nodes[i].name || "").toLowerCase().replace(/[\s_\-\/]+/g, "");
      if (setNameNorm.indexOf("flag") >= 0) {
        for (var sci = 0; sci < children.length; sci++) {
          if (children[sci].type === "COMPONENT") explicitFlagSetChildren.push(children[sci]);
        }
      }
      for (var ci = 0; ci < children.length; ci++) {
        if (children[ci].type === "COMPONENT") candidates.push(children[ci]);
      }
    }
  }

  function score(c) {
    var n = String(c.name || "").toLowerCase().replace(/[\s_\-\/]+/g, "");
    if (!n) return 0;
    var s = 0;
    if (n.indexOf("flag") >= 0) s += 100;
    if (n === "de" || n.indexOf("germany") >= 0 || n.indexOf("deutschland") >= 0) s += 50;
    if (n.indexOf("country") >= 0) s += 20;
    return s;
  }

  var best = null;
  var bestScore = 0;
  if (explicitFlagSetChildren.length > 0) {
    candidates = explicitFlagSetChildren.slice();
    for (var esi = 0; esi < explicitFlagSetChildren.length; esi++) {
      var es = score(explicitFlagSetChildren[esi]);
      if (es > bestScore) {
        bestScore = es;
        best = explicitFlagSetChildren[esi];
      }
    }
  } else if (nameMatchedFlagComponents.length > 0) {
    candidates = nameMatchedFlagComponents.slice();
    for (var nmi = 0; nmi < nameMatchedFlagComponents.length; nmi++) {
      var ns = score(nameMatchedFlagComponents[nmi]);
      if (ns > bestScore) {
        bestScore = ns;
        best = nameMatchedFlagComponents[nmi];
      }
    }
  } else {
    for (var j = 0; j < candidates.length; j++) {
      var s = score(candidates[j]);
      if (s > bestScore) {
        bestScore = s;
        best = candidates[j];
      }
    }
  }
  if (!best && candidates.length > 0) {
    var sorted = candidates.slice().sort(function (a, b) {
      return String(a.name).localeCompare(String(b.name));
    });
    best = sorted[0];
  }

  if (best) {
    progress(
      "[TableBody] Flag swap default: " +
        best.name +
        " (candidates: " +
        String(candidates.length) +
        ")"
    );
  } else {
    progress("[TableBody] Warning: no flag components found (looked for set/component names containing 'flag').");
  }

  return { defaultFlag: best, candidates: candidates };
}

/** Outline warning triangle vector for fallback when no icon components exist. */
function tableMakeWarningTriangleVector() {
  var v = figma.createVector();
  v.name = "alert-triangle";
  v.resize(20, 20);
  v.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  v.strokeWeight = 1.25;
  v.strokeCap = "ROUND";
  v.strokeJoin = "ROUND";
  try {
    v.vectorPaths = [
      { windingRule: "NONZERO", data: "M 10 3.5 L 17.5 17 H 2.5 Z M 10 7.5 V 11 M 10 13.5 H 10.01" },
    ];
  } catch (_eTri) {
    try {
      v.remove();
    } catch (_eRm) {}
    return null;
  }
  return v;
}

async function tableTrySetTextOnInstance(inst, preferredNames, characters) {
  if (!inst || inst.type !== "INSTANCE") return;
  try {
    await inst.loadAsync();
  } catch (_eLd) {}
  var texts = [];
  try {
    texts = inst.findAll(function (n) {
      return n.type === "TEXT";
    });
  } catch (_eFa) {
    texts = [];
  }
  var target = null;
  for (var ti = 0; ti < texts.length; ti++) {
    var nm = String(texts[ti].name || "");
    for (var pi = 0; pi < preferredNames.length; pi++) {
      if (nm === preferredNames[pi]) {
        target = texts[ti];
        break;
      }
    }
    if (target) break;
  }
  if (!target && texts.length > 0) target = texts[0];
  if (!target || typeof target.characters !== "string") return;
  try {
    await figma.loadFontAsync(target.fontName);
  } catch (_eFont) {}
  try {
    target.characters = characters;
  } catch (_eCh) {}
}

async function buildTableComponentSet(varMap, page, font, nestedSets) {
  nestedSets = nestedSets || {};
  var pad16 = 16;
  var iconGapDefault = 4;
  var sortSources = await findTableSortIconSources();
  var sortDefaultComp = sortSources.defaultIcon;
  var sortCandidateList = sortSources.candidates || [];
  /** Figma steel/9 fallback #181926 */
  var headerBgFallback = { r: 24 / 255, g: 25 / 255, b: 38 / 255 };

  function swapDefaultRef(componentNode) {
    if (!componentNode) return null;
    if (componentNode.key) return componentNode.key;
    if (componentNode.id) return componentNode.id;
    return null;
  }

  function bindTableHeaderPadding(node) {
    if (varMap["table/header-padding-x"]) {
      bindVar(node, "paddingLeft", varMap["table/header-padding-x"]);
      bindVar(node, "paddingRight", varMap["table/header-padding-x"]);
    } else {
      node.paddingLeft = pad16;
      node.paddingRight = pad16;
    }
    if (varMap["table/header-padding-y"]) {
      bindVar(node, "paddingTop", varMap["table/header-padding-y"]);
      bindVar(node, "paddingBottom", varMap["table/header-padding-y"]);
    } else {
      node.paddingTop = pad16;
      node.paddingBottom = pad16;
    }
  }

  function makeText(content, colorVar, opts) {
    var t = figma.createText();
    t.name = (opts && opts.name) || "text";
    t.fontName = font;
    t.characters = content;
    t.fontSize = (opts && opts.fontSize) || 13;
    t.textAutoResize = "WIDTH_AND_HEIGHT";
    t.textAlignHorizontal = (opts && opts.align) || "LEFT";
    t.fills = [{ type: "SOLID", color: { r: 0.92, g: 0.93, b: 0.95 } }];
    if (colorVar) bindPaintVar(t, "fills", 0, colorVar);
    if (opts && opts.useHeaderFont) {
      try {
        t.fontName = { family: font.family, style: "Semi Bold" };
      } catch (_eFw) {}
      if (varMap["table/header-font-family"]) bindVar(t, "fontFamily", varMap["table/header-font-family"]);
      if (varMap["table/header-font-size"]) bindVar(t, "fontSize", varMap["table/header-font-size"]);
      if (varMap["table/header-font-weight"]) bindVar(t, "fontStyle", varMap["table/header-font-weight"]);
      if (varMap["table/header-line-height"]) bindVar(t, "lineHeight", varMap["table/header-line-height"]);
      try {
        t.letterSpacing = { value: 0, unit: "PERCENT" };
      } catch (_eLs) {}
    } else {
      if (opts && opts.fontWeight === 600) {
        try {
          t.fontName = { family: font.family, style: "Semi Bold" };
        } catch (_eFw2) {}
      }
      if (varMap["table/cell-font-size"] && (!opts || !opts.skipCellFont)) {
        bindVar(t, "fontSize", varMap["table/cell-font-size"]);
      }
    }
    return t;
  }

  function findTableBodyVariantComponent(bodySetNode, variantName) {
    if (!bodySetNode || bodySetNode.type !== "COMPONENT_SET") return null;
    var target = "variant=" + String(variantName || "").toLowerCase();
    var children = bodySetNode.children || [];
    for (var i = 0; i < children.length; i++) {
      if (children[i].type !== "COMPONENT") continue;
      var nm = String(children[i].name || "").toLowerCase();
      if (nm.indexOf(target) >= 0) return children[i];
    }
    return null;
  }

  /** TableBody (Figma 774:1936): uniform inset `table/body-padding`, default 16. */
  function bindTableBodyInset(node) {
    var inset = 16;
    if (varMap["table/body-padding"]) {
      bindVar(node, "paddingLeft", varMap["table/body-padding"]);
      bindVar(node, "paddingRight", varMap["table/body-padding"]);
      bindVar(node, "paddingTop", varMap["table/body-padding"]);
      bindVar(node, "paddingBottom", varMap["table/body-padding"]);
    } else {
      node.paddingLeft = inset;
      node.paddingRight = inset;
      node.paddingTop = inset;
      node.paddingBottom = inset;
    }
  }

  /** Minimal double-chevron sort icon (~16px); Figma shows white; table/sort-icon overrides when bound. */
  function makeSortIcon() {
    var v = figma.createVector();
    v.name = "switch-vertical-01";
    v.resize(16, 16);
    v.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    v.strokeWeight = 1.25;
    if (varMap["table/header-icon-stroke-width"]) bindVar(v, "strokeWeight", varMap["table/header-icon-stroke-width"]);
    v.strokeCap = "ROUND";
    v.strokeJoin = "ROUND";
    if (varMap["table/header-text"]) bindPaintVar(v, "strokes", 0, varMap["table/header-text"]);
    else if (varMap["table/sort-icon"]) bindPaintVar(v, "strokes", 0, varMap["table/sort-icon"]);
    try {
      v.vectorPaths = [
        { windingRule: "NONZERO", data: "M 4 6 L 8 2 L 12 6 M 4 10 L 8 14 L 12 10" },
      ];
    } catch (_eVec) {
      try {
        v.remove();
      } catch (_eRm) {}
      return null;
    }
    return v;
  }

  var tableChromeDefaultW = 132;
  var comp = figma.createComponent();
  comp.name = "TableHeader";
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "AUTO";
  comp.primaryAxisAlignItems = "MIN";
  comp.counterAxisAlignItems = "CENTER";
  comp.itemSpacing = iconGapDefault;
  if (varMap["table/header-icon-gap"]) bindVar(comp, "itemSpacing", varMap["table/header-icon-gap"]);
  comp.clipsContent = true;
  comp.fills = [{ type: "SOLID", color: headerBgFallback }];
  comp.strokes = [];
  if (varMap["table/header-background"]) bindPaintVar(comp, "fills", 0, varMap["table/header-background"]);
  try {
    comp.cornerRadius = 0;
  } catch (_eHdrRad) {}
  try {
    comp.clipsContent = false;
  } catch (_eClip) {}
  bindTableHeaderPadding(comp);

  comp.appendChild(
    makeText("Header Title ", varMap["table/header-text"], {
      name: "title",
      fontSize: 12,
      fontWeight: 600,
      skipCellFont: true,
      useHeaderFont: true,
    })
  );

  var sortWrap = figma.createFrame();
  sortWrap.name = "Sort icon slot";
  sortWrap.layoutMode = "HORIZONTAL";
  sortWrap.primaryAxisSizingMode = "FIXED";
  sortWrap.counterAxisSizingMode = "FIXED";
  sortWrap.resize(16, 16);
  sortWrap.primaryAxisAlignItems = "CENTER";
  sortWrap.counterAxisAlignItems = "CENTER";
  sortWrap.fills = [];
  sortWrap.clipsContent = false;

  var iconInst = null;
  if (sortDefaultComp) {
    try {
      iconInst = sortDefaultComp.createInstance();
      iconInst.name = "Sort icon";
      try {
        iconInst.resize(16, 16);
      } catch (_eSz) {}
      var headerTextPath = varMap["table/header-text"];
      var vectors = iconInst.findAll(function (n) {
        return n.type === "VECTOR";
      });
      for (var vci = 0; vci < vectors.length; vci++) {
        try {
          bindVar(vectors[vci], "strokeWeight", varMap["table/header-icon-stroke-width"]);
        } catch (_eSw) {}
        if (vectors[vci].strokes && vectors[vci].strokes.length > 0) {
          vectors[vci].strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
          if (headerTextPath) bindPaintVar(vectors[vci], "strokes", 0, headerTextPath);
        }
        if (vectors[vci].fills && vectors[vci].fills.length > 0) {
          vectors[vci].fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
          if (headerTextPath) bindPaintVar(vectors[vci], "fills", 0, headerTextPath);
        }
      }
      sortWrap.appendChild(iconInst);
    } catch (_eInst) {
      iconInst = null;
    }
  }
  if (!iconInst) {
    var sortGlyph = makeSortIcon();
    if (sortGlyph) sortWrap.appendChild(sortGlyph);
  }

  comp.appendChild(sortWrap);

  try {
    comp.resize(tableChromeDefaultW, Math.max(1, Math.ceil(comp.height || 1)));
  } catch (_hdrW) {}

  page.appendChild(comp);

  try {
    var sortVisProp = comp.addComponentProperty("Show sort", "BOOLEAN", true);
    sortWrap.componentPropertyReferences = { visible: sortVisProp };
  } catch (eProp) {
    progress("TableHeader Show sort property: " + String(eProp));
  }

  if (iconInst && sortDefaultComp) {
    var preferred = [];
    var seen = {};
    if (sortDefaultComp.key) {
      seen[sortDefaultComp.key] = true;
      preferred.push({ type: "COMPONENT", key: sortDefaultComp.key });
    }
    for (var pci = 0; pci < sortCandidateList.length && preferred.length < 24; pci++) {
      var cnd = sortCandidateList[pci];
      if (!cnd || cnd.type !== "COMPONENT") continue;
      var k = cnd.key;
      if (!k || seen[k]) continue;
      seen[k] = true;
      preferred.push({ type: "COMPONENT", key: k });
    }
    try {
      var sortSwapRefs = swapDefaultRefs(sortDefaultComp);
      if (!sortSwapRefs.length) throw new Error("Sort icon default component key/id unavailable");
      var swapOpts = preferred.length > 0 ? { preferredValues: preferred } : undefined;
      var swapPropName = null;
      var sortSwapErr = null;
      for (var sri = 0; sri < sortSwapRefs.length; sri++) {
        try {
          swapPropName = comp.addComponentProperty("Sort icon", "INSTANCE_SWAP", sortSwapRefs[sri], swapOpts);
          break;
        } catch (eTrySortSwap) {
          sortSwapErr = eTrySortSwap;
        }
      }
      if (!swapPropName) throw sortSwapErr || new Error("Sort icon INSTANCE_SWAP creation failed");
      iconInst.componentPropertyReferences = { mainComponent: swapPropName };
    } catch (eSwap) {
      progress("TableHeader Sort icon INSTANCE_SWAP (with preferred list): " + String(eSwap));
      try {
        var sortSwapRefsFallback = swapDefaultRefs(sortDefaultComp);
        if (!sortSwapRefsFallback.length) throw new Error("Sort icon default component key/id unavailable");
        var swapPropOnly = null;
        var sortSwapFallbackErr = null;
        for (var srf = 0; srf < sortSwapRefsFallback.length; srf++) {
          try {
            swapPropOnly = comp.addComponentProperty("Sort icon", "INSTANCE_SWAP", sortSwapRefsFallback[srf]);
            break;
          } catch (eTrySortSwapFallback) {
            sortSwapFallbackErr = eTrySortSwapFallback;
          }
        }
        if (!swapPropOnly) throw sortSwapFallbackErr || new Error("Sort icon INSTANCE_SWAP fallback failed");
        iconInst.componentPropertyReferences = { mainComponent: swapPropOnly };
      } catch (eSwap2) {
        progress("TableHeader Sort icon INSTANCE_SWAP: " + String(eSwap2));
      }
    }
  }

  var TABLE_BODY_BUILD = "tablebody-variant-set-nested-v4";
  var bodyBgFallback = { r: 36 / 255, g: 38 / 255, b: 60 / 255 };
  var badgeSet = tableResolveComponentSetFromPage(nestedSets.badgeSet, page, "Badge");
  var progressSet = tableResolveComponentSetFromPage(nestedSets.progressSet, page, "Progress");
  var textSet = tableResolveComponentSetFromPage(nestedSets.textSet, page, "Text");
  var avatarSet = tableResolveComponentSetFromPage(nestedSets.avatarSet, page, "Avatar");
  if (badgeSet) {
    try {
      await badgeSet.loadAsync();
    } catch (_lb) {}
  }
  if (progressSet) {
    try {
      await progressSet.loadAsync();
    } catch (_lp) {}
  }
  if (textSet) {
    try {
      await textSet.loadAsync();
    } catch (_lt) {}
  }
  if (avatarSet) {
    try {
      await avatarSet.loadAsync();
    } catch (_la) {}
  }
  if (badgeSet) {
    progress(
      "[TableBody] Resolved Badge set: " +
        badgeSet.name +
        " (" +
        String((badgeSet.children && badgeSet.children.length) || 0) +
        " variants)"
    );
  } else {
    progress("[TableBody] Badge COMPONENT_SET missing — cannot nest Badge instance.");
  }
  if (progressSet) {
    progress(
      "[TableBody] Resolved Progress set: " +
        progressSet.name +
        " (" +
        String((progressSet.children && progressSet.children.length) || 0) +
        " variants)"
    );
  } else {
    progress("[TableBody] Progress COMPONENT_SET missing — cannot nest Progress instance.");
  }
  if (avatarSet) {
    progress(
      "[TableBody] Resolved Avatar set: " +
        avatarSet.name +
        " (" +
        String((avatarSet.children && avatarSet.children.length) || 0) +
        " variants)"
    );
  } else {
    progress("[TableBody] Avatar COMPONENT_SET missing — cannot nest Avatar instance.");
  }
  var iconSources = await findTableBodyIconSources();
  var flagSources = await findTableBodyFlagSources(page);
  var iconDefaultComp = iconSources.defaultIcon;
  var iconCandidates = iconSources.candidates || [];
  var flagDefaultComp = flagSources.defaultFlag;
  var flagCandidates = flagSources.candidates || [];

  function bindTableBodyBottomRule(node) {
    try {
      node.strokes = [{ type: "SOLID", color: { r: 0.22, g: 0.24, b: 0.34 } }];
      if (varMap["table/border"]) bindPaintVar(node, "strokes", 0, varMap["table/border"]);
      node.strokeWeight = 1;
      node.strokeTopWeight = 0;
      node.strokeRightWeight = 0;
      node.strokeLeftWeight = 0;
      node.strokeBottomWeight = 1;
    } catch (_eBr) {
      try {
        node.strokes = [];
      } catch (_eS) {}
    }
  }

  /**
   * TableContentSlot per Figma dev export: HUG W, HUG H, items-start, overflow-clip, shrink-0.
   * No FILL sizing — let nested instances dictate width so Badge / Progress / Text render at intrinsic size.
   */
  function appendTableContentSlot(parent) {
    var slot = figma.createFrame();
    slot.name = "TableContentSlot";
    slot.layoutMode = "HORIZONTAL";
    slot.primaryAxisSizingMode = "AUTO";
    slot.counterAxisSizingMode = "AUTO";
    slot.primaryAxisAlignItems = "MIN";
    slot.counterAxisAlignItems = "MIN";
    slot.clipsContent = true;
    slot.itemSpacing = 0;
    slot.fills = [];
    slot.strokes = [];
    try {
      slot.paddingLeft = 0;
      slot.paddingRight = 0;
      slot.paddingTop = 0;
      slot.paddingBottom = 0;
    } catch (_slp) {}
    parent.appendChild(slot);
    try {
      slot.layoutSizingHorizontal = "HUG";
      slot.layoutSizingVertical = "HUG";
    } catch (_sls) {}
    return slot;
  }

  var tableBodyMinHeightDefault = 52;
  var tableBodyBadgeFixedWidth = 62;

  /**
   * TableBody variant shell: HUG W, HUG H by default with a minimum height floor.
   * Some variants opt into FIXED height via `fixedHeight`.
   */
  function createTableBodyVariantShell(capVariant, layoutOpts) {
    layoutOpts = layoutOpts || {};
    var bc = figma.createComponent();
    bc.name = "Variant=" + capVariant;
    bc.layoutMode = "HORIZONTAL";
    bc.primaryAxisSizingMode = "AUTO";
    bc.counterAxisSizingMode = "AUTO";
    bc.primaryAxisAlignItems = layoutOpts.primaryAxisAlignItems || "MIN";
    bc.counterAxisAlignItems = layoutOpts.counterAxisAlignItems || "CENTER";
    bc.itemSpacing = typeof layoutOpts.itemSpacing === "number" ? layoutOpts.itemSpacing : 0;
    bc.fills = [{ type: "SOLID", color: bodyBgFallback }];
    if (varMap["table/body-background"]) bindPaintVar(bc, "fills", 0, varMap["table/body-background"]);
    bc.strokes = [];
    bindTableBodyBottomRule(bc);
    try {
      bc.cornerRadius = 0;
    } catch (_bcr) {}
    bc.clipsContent = false;
    bindTableBodyInset(bc);
    try {
      bc.minHeight = tableBodyMinHeightDefault;
    } catch (_bminh) {}
    return bc;
  }

  function finalizeVariantSizing(bc, fixedHeight) {
    if (typeof fixedHeight === "number") {
      var resolvedFixedHeight = Math.max(tableBodyMinHeightDefault, fixedHeight);
      try {
        bc.counterAxisSizingMode = "FIXED";
      } catch (_csm) {}
      try {
        bc.resize(Math.max(1, Math.ceil(bc.width || 1)), resolvedFixedHeight);
      } catch (_r) {}
    }
  }

  function enforceTableBadgeWidth(node) {
    if (!node) return;
    try {
      node.primaryAxisAlignItems = "CENTER";
      node.counterAxisAlignItems = "CENTER";
    } catch (_bwAlign) {}
    try {
      node.minWidth = tableBodyBadgeFixedWidth;
    } catch (_bwMin) {}
    try {
      node.layoutSizingHorizontal = "AUTO";
    } catch (_bwSizing) {}
    try {
      if (node.width < tableBodyBadgeFixedWidth) {
        node.resize(tableBodyBadgeFixedWidth, Math.max(1, Math.ceil(node.height || 1)));
      }
    } catch (_bwResize) {}
  }

  function centerBadgeLabelText(node) {
    if (!node || typeof node.findAll !== "function") return;
    var texts = [];
    try {
      texts = node.findAll(function (n) {
        return n.type === "TEXT";
      });
    } catch (_bTxtFindErr) {
      texts = [];
    }
    for (var ti = 0; ti < texts.length; ti++) {
      try {
        texts[ti].textAlignHorizontal = "CENTER";
      } catch (_bTxtAlignErr) {}
      try {
        texts[ti].textAutoResize = "WIDTH_AND_HEIGHT";
      } catch (_bTxtAutoErr) {}
    }
  }

  function placeTableBodyVariant(bc, variantIndex) {
    var rowGap = 16;
    var rowHeight = 64;
    bc.x = 0;
    bc.y = variantIndex * (rowHeight + rowGap);
  }

  var badgeTemplate =
    tableFindComponentByNameParts(badgeSet, ["Variant=Outline", "Color=Error", "Size=XS", "Radius=XL", "Circle=Off"]) ||
    tableFindComponentByNameParts(badgeSet, ["Variant=Outline", "Color=Error", "Circle=Off"]) ||
    tableFindComponentByNameParts(badgeSet, ["Variant=Outline", "Color=Error"]) ||
    tablePickBestBadge(badgeSet) ||
    tableFirstComponentChild(badgeSet);
  var progressTemplate =
    tableFindComponentByNameParts(progressSet, ["Size=SM", "Radius=Default"]) ||
    tableFindComponentByNameParts(progressSet, ["Size=SM"]) ||
    tablePickBestProgress(progressSet);
  var textTemplate =
    tableFindComponentByNameParts(textSet, ["Size=Default", "Weight=Regular", "Color=Default"]) ||
    tableFindComponentByNameParts(textSet, ["Size=Default", "Weight=Regular"]) ||
    tableFirstComponentChild(textSet);
  var avatarTemplate =
    tableFindComponentByNameParts(avatarSet, ["Size=SM", "Radius=Default"]) ||
    tableFindComponentByNameParts(avatarSet, ["Size=Default", "Radius=Default"]) ||
    tableFirstComponentChild(avatarSet);

  if (!badgeTemplate) progress("[TableBody] Badge template unresolved — using plain text.");
  else progress("[TableBody] Badge template: " + badgeTemplate.name);
  if (!progressTemplate) progress("[TableBody] Progress template unresolved — using plain text.");
  else progress("[TableBody] Progress template: " + progressTemplate.name);
  if (!textTemplate) progress("[TableBody] Text template unresolved — using plain text.");
  else progress("[TableBody] Text template: " + textTemplate.name);
  if (!avatarTemplate) progress("[TableBody] Avatar template unresolved — using text fallback.");
  else progress("[TableBody] Avatar template: " + avatarTemplate.name);

  var bodyComponents = [];
  var badgeCandidates = [];
  if (badgeSet && badgeSet.type === "COMPONENT_SET" && badgeSet.children) {
    for (var bci = 0; bci < badgeSet.children.length; bci++) {
      if (badgeSet.children[bci].type === "COMPONENT") badgeCandidates.push(badgeSet.children[bci]);
    }
  }

  // ── Badge variant ────────────────────────────────────────────────────────
  var vBadge = createTableBodyVariantShell("Badge", { counterAxisAlignItems: "CENTER" });
  var slotBadge = appendTableContentSlot(vBadge);
  if (badgeTemplate) {
    var badgeInst = badgeTemplate.createInstance();
    badgeInst.name = "Badge";
    try {
      await badgeInst.loadAsync();
    } catch (_bLd) {}
    enforceTableBadgeWidth(badgeInst);
    slotBadge.appendChild(badgeInst);
    await tableTrySetTextOnInstance(badgeInst, ["Label"], "High");
    centerBadgeLabelText(badgeInst);
    // INSTANCE_SWAP for Badge so composed Table can pick warning/success/error rows.
    if (badgeTemplate) {
      var badgePreferred = [];
      var seenBadge = {};
      if (badgeTemplate.key) {
        seenBadge[badgeTemplate.key] = true;
        badgePreferred.push({ type: "COMPONENT", key: badgeTemplate.key });
      }
      for (var bpi = 0; bpi < badgeCandidates.length && badgePreferred.length < 64; bpi++) {
        var bc = badgeCandidates[bpi];
        if (!bc || bc.type !== "COMPONENT") continue;
        var bk = bc.key;
        if (!bk || seenBadge[bk]) continue;
        seenBadge[bk] = true;
        badgePreferred.push({ type: "COMPONENT", key: bk });
      }
      try {
      var badgeSwapRefs = swapDefaultRefs(badgeTemplate);
      if (!badgeSwapRefs.length) throw new Error("Badge default component key/id unavailable");
        var badgeSwapOpts = badgePreferred.length > 0 ? { preferredValues: badgePreferred } : undefined;
      var badgeSwapPropName = null;
      var badgeSwapErr = null;
      for (var bri = 0; bri < badgeSwapRefs.length; bri++) {
        try {
          badgeSwapPropName = vBadge.addComponentProperty("Badge", "INSTANCE_SWAP", badgeSwapRefs[bri], badgeSwapOpts);
          break;
        } catch (eTryBadgeSwap) {
          badgeSwapErr = eTryBadgeSwap;
        }
      }
      if (!badgeSwapPropName) throw badgeSwapErr || new Error("Badge INSTANCE_SWAP creation failed");
        badgeInst.componentPropertyReferences = { mainComponent: badgeSwapPropName };
      } catch (eBadgeSwap) {
        progress("TableBody Badge INSTANCE_SWAP (with preferred list): " + String(eBadgeSwap));
        try {
        var badgeSwapRefsFallback = swapDefaultRefs(badgeTemplate);
        if (!badgeSwapRefsFallback.length) throw new Error("Badge default component key/id unavailable");
        var badgeSwapPropOnly = null;
        var badgeSwapFallbackErr = null;
        for (var brf = 0; brf < badgeSwapRefsFallback.length; brf++) {
          try {
            badgeSwapPropOnly = vBadge.addComponentProperty("Badge", "INSTANCE_SWAP", badgeSwapRefsFallback[brf]);
            break;
          } catch (eTryBadgeSwapFallback) {
            badgeSwapFallbackErr = eTryBadgeSwapFallback;
          }
        }
        if (!badgeSwapPropOnly) throw badgeSwapFallbackErr || new Error("Badge INSTANCE_SWAP fallback failed");
          badgeInst.componentPropertyReferences = { mainComponent: badgeSwapPropOnly };
        } catch (eBadgeSwap2) {
          progress("TableBody Badge INSTANCE_SWAP: " + String(eBadgeSwap2));
        }
      }
    }
  } else {
    var badgeFallback = figma.createFrame();
    badgeFallback.name = "Badge";
    badgeFallback.layoutMode = "HORIZONTAL";
    badgeFallback.primaryAxisSizingMode = "FIXED";
    badgeFallback.counterAxisSizingMode = "AUTO";
    badgeFallback.primaryAxisAlignItems = "CENTER";
    badgeFallback.counterAxisAlignItems = "CENTER";
    badgeFallback.itemSpacing = 0;
    badgeFallback.paddingLeft = 16;
    badgeFallback.paddingRight = 16;
    badgeFallback.paddingTop = 4;
    badgeFallback.paddingBottom = 4;
    badgeFallback.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0 }];
    badgeFallback.strokes = [{ type: "SOLID", color: { r: 0.97, g: 0.33, b: 0.29 } }];
    badgeFallback.strokeWeight = 1;
    badgeFallback.strokeAlign = "INSIDE";
    try { badgeFallback.cornerRadius = 32; } catch (_bfr) {}
    var badgeFallbackLabel = makeText("High", varMap["table/priority-high"] || varMap["table/cell-text"], { fontSize: 12, fontWeight: 600 });
    badgeFallback.appendChild(badgeFallbackLabel);
    enforceTableBadgeWidth(badgeFallback);
    slotBadge.appendChild(badgeFallback);
  }
  page.appendChild(vBadge);
  finalizeVariantSizing(vBadge);
  placeTableBodyVariant(vBadge, 0);
  bodyComponents.push(vBadge);

  // ── Progress variant ─────────────────────────────────────────────────────
  var vProgress = createTableBodyVariantShell("Progress", { counterAxisAlignItems: "CENTER" });
  var slotProgress = appendTableContentSlot(vProgress);
  if (progressTemplate) {
    var progressInst = progressTemplate.createInstance();
    progressInst.name = "Progress";
    try {
      await progressInst.loadAsync();
    } catch (_pLd) {}
    slotProgress.appendChild(progressInst);
  } else {
    slotProgress.appendChild(makeText("60%", varMap["table/cell-text"], { fontSize: 12, fontWeight: 600 }));
  }
  page.appendChild(vProgress);
  finalizeVariantSizing(vProgress, 52);
  placeTableBodyVariant(vProgress, 1);
  bodyComponents.push(vProgress);

  // ── Text variant ─────────────────────────────────────────────────────────
  var vText = createTableBodyVariantShell("Text", { counterAxisAlignItems: "CENTER" });
  var slotText = appendTableContentSlot(vText);
  if (textTemplate) {
    var textInst = textTemplate.createInstance();
    textInst.name = "Text";
    try {
      await textInst.loadAsync();
    } catch (_tLd) {}
    slotText.appendChild(textInst);
    await tableTrySetTextOnInstance(textInst, ["text"], "Text goes here");
  } else {
    slotText.appendChild(makeText("Text goes here", varMap["table/cell-text"], { fontSize: 12 }));
  }
  page.appendChild(vText);
  finalizeVariantSizing(vText, 52);
  placeTableBodyVariant(vText, 2);
  bodyComponents.push(vText);

  // ── Flag variant: INSTANCE_SWAP flag + Text instance ─────────────────────
  var vFlag = createTableBodyVariantShell("Flag", {
    itemSpacing: 6,
    counterAxisAlignItems: "CENTER",
  });
  var flagInst = null;
  if (flagDefaultComp) {
    try {
      flagInst = flagDefaultComp.createInstance();
      flagInst.name = "Flag";
      try {
        await flagInst.loadAsync();
      } catch (_fLd) {}
      try {
        flagInst.resize(21.333, 16);
      } catch (_fSz) {}
      vFlag.appendChild(flagInst);
    } catch (_fIns) {
      flagInst = null;
    }
  }
  // No legacy DE fallback here; if no flag instance resolves, keep the slot empty.
  var slotFlag = appendTableContentSlot(vFlag);
  if (textTemplate) {
    var textInstFlag = textTemplate.createInstance();
    textInstFlag.name = "Text";
    try {
      await textInstFlag.loadAsync();
    } catch (_tfLd) {}
    slotFlag.appendChild(textInstFlag);
    await tableTrySetTextOnInstance(textInstFlag, ["text"], "Text goes here");
  } else {
    slotFlag.appendChild(makeText("Text goes here", varMap["table/cell-text"], { fontSize: 12 }));
  }
  page.appendChild(vFlag);
  finalizeVariantSizing(vFlag, 52);
  placeTableBodyVariant(vFlag, 3);

  // INSTANCE_SWAP for the Flag variant only — must be added before combineAsVariants.
  if (flagInst && flagDefaultComp) {
    var flagPreferred = [];
    var seenFlag = {};
    if (flagDefaultComp.key) {
      seenFlag[flagDefaultComp.key] = true;
      flagPreferred.push({ type: "COMPONENT", key: flagDefaultComp.key });
    }
    for (var fpi = 0; fpi < flagCandidates.length && flagPreferred.length < 32; fpi++) {
      var fcand = flagCandidates[fpi];
      if (!fcand || fcand.type !== "COMPONENT") continue;
      var fk = fcand.key;
      if (!fk || seenFlag[fk]) continue;
      seenFlag[fk] = true;
      flagPreferred.push({ type: "COMPONENT", key: fk });
    }
    try {
      var flagSwapRefs = swapDefaultRefs(flagDefaultComp);
      if (!flagSwapRefs.length) throw new Error("Flag default component key/id unavailable");
      var flagSwapOpts = flagPreferred.length > 0 ? { preferredValues: flagPreferred } : undefined;
      var flagSwapPropName = null;
      var flagSwapErr = null;
      for (var fri = 0; fri < flagSwapRefs.length; fri++) {
        try {
          flagSwapPropName = vFlag.addComponentProperty("Flag", "INSTANCE_SWAP", flagSwapRefs[fri], flagSwapOpts);
          break;
        } catch (eTryFlagSwap) {
          flagSwapErr = eTryFlagSwap;
        }
      }
      if (!flagSwapPropName) throw flagSwapErr || new Error("Flag INSTANCE_SWAP creation failed");
      flagInst.componentPropertyReferences = { mainComponent: flagSwapPropName };
    } catch (eFlagSwap) {
      progress("TableBody Flag INSTANCE_SWAP (with preferred list): " + String(eFlagSwap));
      try {
        var flagSwapRefsFallback = swapDefaultRefs(flagDefaultComp);
        if (!flagSwapRefsFallback.length) throw new Error("Flag default component key/id unavailable");
        var flagSwapPropOnly = null;
        var flagSwapFallbackErr = null;
        for (var frf = 0; frf < flagSwapRefsFallback.length; frf++) {
          try {
            flagSwapPropOnly = vFlag.addComponentProperty("Flag", "INSTANCE_SWAP", flagSwapRefsFallback[frf]);
            break;
          } catch (eTryFlagSwapFallback) {
            flagSwapFallbackErr = eTryFlagSwapFallback;
          }
        }
        if (!flagSwapPropOnly) throw flagSwapFallbackErr || new Error("Flag INSTANCE_SWAP fallback failed");
        flagInst.componentPropertyReferences = { mainComponent: flagSwapPropOnly };
      } catch (eFlagSwap2) {
        progress("TableBody Flag INSTANCE_SWAP: " + String(eFlagSwap2));
      }
    }
  }

  bodyComponents.push(vFlag);

  // ── Avatar variant: Avatar instance + Text instance ──────────────────────
  var vAvatar = createTableBodyVariantShell("Avatar", {
    itemSpacing: 8,
    counterAxisAlignItems: "CENTER",
  });
  if (avatarTemplate) {
    var avatarInst = avatarTemplate.createInstance();
    avatarInst.name = "Avatar";
    try {
      await avatarInst.loadAsync();
    } catch (_avLd) {}
    vAvatar.appendChild(avatarInst);
  } else {
    vAvatar.appendChild(makeText("AC", varMap["table/cell-text"], { fontSize: 12, fontWeight: 600 }));
  }
  var slotAvatar = appendTableContentSlot(vAvatar);
  if (textTemplate) {
    var textInstAvatar = textTemplate.createInstance();
    textInstAvatar.name = "Text";
    try {
      await textInstAvatar.loadAsync();
    } catch (_taLd) {}
    slotAvatar.appendChild(textInstAvatar);
    await tableTrySetTextOnInstance(textInstAvatar, ["text"], "Text goes here");
  } else {
    slotAvatar.appendChild(makeText("Text goes here", varMap["table/cell-text"], { fontSize: 12 }));
  }
  page.appendChild(vAvatar);
  finalizeVariantSizing(vAvatar, 52);
  placeTableBodyVariant(vAvatar, 4);
  bodyComponents.push(vAvatar);

  // ── Icon variant: INSTANCE_SWAP icon + Text instance ─────────────────────
  var vIcon = createTableBodyVariantShell("Icon", {
    itemSpacing: 6,
    counterAxisAlignItems: "CENTER",
  });
  var iconInst = null;
  if (iconDefaultComp) {
    try {
      iconInst = iconDefaultComp.createInstance();
      iconInst.name = "Icon";
      try {
        await iconInst.loadAsync();
      } catch (_iLd) {}
      try {
        iconInst.resize(20, 20);
      } catch (_iSz) {}
      var iconStrokeVar = varMap["table/cell-text"];
      var iconVectors = iconInst.findAll(function (n) {
        return n.type === "VECTOR";
      });
      for (var ivi = 0; ivi < iconVectors.length; ivi++) {
        var vec = iconVectors[ivi];
        if (vec.strokes && vec.strokes.length > 0 && iconStrokeVar) {
          bindPaintVar(vec, "strokes", 0, iconStrokeVar);
        }
        if (vec.fills && vec.fills.length > 0 && iconStrokeVar) {
          bindPaintVar(vec, "fills", 0, iconStrokeVar);
        }
      }
      vIcon.appendChild(iconInst);
    } catch (_eIns) {
      iconInst = null;
    }
  }
  if (!iconInst) {
    var warnVec = tableMakeWarningTriangleVector();
    if (warnVec) {
      if (varMap["table/cell-text"]) bindPaintVar(warnVec, "strokes", 0, varMap["table/cell-text"]);
      vIcon.appendChild(warnVec);
    }
  }
  var slotIcon = appendTableContentSlot(vIcon);
  if (textTemplate) {
    var textInstIcon = textTemplate.createInstance();
    textInstIcon.name = "Text";
    try {
      await textInstIcon.loadAsync();
    } catch (_tiLd) {}
    slotIcon.appendChild(textInstIcon);
    await tableTrySetTextOnInstance(textInstIcon, ["text"], "Text goes here");
  } else {
    slotIcon.appendChild(makeText("Text goes here", varMap["table/cell-text"], { fontSize: 12 }));
  }
  page.appendChild(vIcon);
  finalizeVariantSizing(vIcon, 52);
  placeTableBodyVariant(vIcon, 5);

  // INSTANCE_SWAP for the Icon variant only — must be added before combineAsVariants.
  if (iconInst && iconDefaultComp) {
    var iconPreferred = [];
    var seenIcon = {};
    if (iconDefaultComp.key) {
      seenIcon[iconDefaultComp.key] = true;
      iconPreferred.push({ type: "COMPONENT", key: iconDefaultComp.key });
    }
    for (var ipi = 0; ipi < iconCandidates.length && iconPreferred.length < 32; ipi++) {
      var cand = iconCandidates[ipi];
      if (!cand || cand.type !== "COMPONENT") continue;
      var ck = cand.key;
      if (!ck || seenIcon[ck]) continue;
      seenIcon[ck] = true;
      iconPreferred.push({ type: "COMPONENT", key: ck });
    }
    try {
      var iconSwapRefs = swapDefaultRefs(iconDefaultComp);
      if (!iconSwapRefs.length) throw new Error("Icon default component key/id unavailable");
      var iconSwapOpts = iconPreferred.length > 0 ? { preferredValues: iconPreferred } : undefined;
      var iconSwapPropName = null;
      var iconSwapErr = null;
      for (var iri = 0; iri < iconSwapRefs.length; iri++) {
        try {
          iconSwapPropName = vIcon.addComponentProperty("Icon", "INSTANCE_SWAP", iconSwapRefs[iri], iconSwapOpts);
          break;
        } catch (eTryIconSwap) {
          iconSwapErr = eTryIconSwap;
        }
      }
      if (!iconSwapPropName) throw iconSwapErr || new Error("Icon INSTANCE_SWAP creation failed");
      iconInst.componentPropertyReferences = { mainComponent: iconSwapPropName };
    } catch (eIconSwap) {
      progress("TableBody Icon INSTANCE_SWAP (with preferred list): " + String(eIconSwap));
      try {
        var iconSwapRefsFallback = swapDefaultRefs(iconDefaultComp);
        if (!iconSwapRefsFallback.length) throw new Error("Icon default component key/id unavailable");
        var iconSwapPropOnly = null;
        var iconSwapFallbackErr = null;
        for (var irf = 0; irf < iconSwapRefsFallback.length; irf++) {
          try {
            iconSwapPropOnly = vIcon.addComponentProperty("Icon", "INSTANCE_SWAP", iconSwapRefsFallback[irf]);
            break;
          } catch (eTryIconSwapFallback) {
            iconSwapFallbackErr = eTryIconSwapFallback;
          }
        }
        if (!iconSwapPropOnly) throw iconSwapFallbackErr || new Error("Icon INSTANCE_SWAP fallback failed");
        iconInst.componentPropertyReferences = { mainComponent: iconSwapPropOnly };
      } catch (eIconSwap2) {
        progress("TableBody Icon INSTANCE_SWAP: " + String(eIconSwap2));
      }
    }
  }

  bodyComponents.push(vIcon);

  var bodySet = null;
  try {
    bodySet = figma.combineAsVariants(bodyComponents, page);
    bodySet.name = "TableBody";
  } catch (eComb) {
    progress("TableBody combineAsVariants failed: " + String(eComb));
    if (bodyComponents[0]) bodySet = bodyComponents[0];
  }
  if (bodySet) {
    try {
      bodySet.setPluginData("dsTableBodyBuild", TABLE_BODY_BUILD);
    } catch (_pd) {}
  }

  // Full composed table component so consumers can use a ready-made table,
  // while still keeping TableHeader and TableBody building blocks available.
  function tableSetInstanceProps(instance, propPatch) {
    if (!instance || typeof instance.setProperties !== "function") return;
    var meta = instance.componentProperties || {};
    var keys = Object.keys(meta);
    if (!keys.length) return;
    var patchKeys = Object.keys(propPatch || {});
    for (var pi = 0; pi < patchKeys.length; pi++) {
      var propName = patchKeys[pi];
      var propValue = propPatch[propName];
      var resolvedKey = null;
      for (var ki = 0; ki < keys.length; ki++) {
        var baseName = String(keys[ki]).split("#")[0];
        if (baseName === propName || baseName.toLowerCase() === String(propName).toLowerCase()) {
          resolvedKey = keys[ki];
          break;
        }
      }
      if (!resolvedKey) continue;
      var metaEntry = meta[resolvedKey] || {};
      var isInstanceSwap = String(metaEntry.type || "").toUpperCase() === "INSTANCE_SWAP";
      if (isInstanceSwap && propValue && typeof propValue === "object" && propValue.__instanceSwapTarget) {
        var target = propValue.__instanceSwapTarget;
        var swapAttempts = [];
        if (target.key) swapAttempts.push(target.key);
        if (target.id) swapAttempts.push(target.id);
        if (target.name) swapAttempts.push(target.name);
        for (var sai = 0; sai < swapAttempts.length; sai++) {
          try {
            var oneSwap = {};
            oneSwap[resolvedKey] = swapAttempts[sai];
            instance.setProperties(oneSwap);
            break;
          } catch (_tableInstSwapErr) {}
        }
      } else {
        try {
          var oneProp = {};
          oneProp[resolvedKey] = propValue;
          instance.setProperties(oneProp);
        } catch (_tableInstPropsErr) {}
      }
    }
  }

  async function makeTableHeaderCell(label, width, showSort) {
    var inst = null;
    try {
      inst = comp.createInstance();
      inst.name = "TableHeader";
      try { await inst.loadAsync(); } catch (_eLdHdr) {}
      tableSetInstanceProps(inst, { "Show sort": showSort ? "true" : "false" });
      try { await tableTrySetTextOnInstance(inst, ["title", "text"], label); } catch (_eHdrText) {}
      try { inst.resize(width, Math.max(1, Math.ceil(inst.height || 1))); } catch (_eHdrSize) {}
    } catch (_eHdrInst) {
      inst = null;
    }
    return inst;
  }

  function tablePickFlagComponentForCountry(countryName) {
    var candidates = flagCandidates || [];
    if (!candidates.length) return flagDefaultComp || null;
    var n = String(countryName || "").toLowerCase();
    function scoreFlag(comp) {
      var nm = String((comp && comp.name) || "").toLowerCase().replace(/[\s_\-\/]+/g, "");
      if (!nm) return 0;
      var score = 0;
      if (n.indexOf("united kingdom") >= 0 || n === "uk" || n === "gb") {
        if (nm.indexOf("unitedkingdom") >= 0 || nm === "uk" || nm === "gb" || nm.indexOf("greatbritain") >= 0) score += 120;
      }
      if (n.indexOf("united states") >= 0 || n === "us" || n === "usa") {
        if (nm.indexOf("unitedstates") >= 0 || nm === "us" || nm === "usa" || nm.indexOf("america") >= 0) score += 120;
      }
      if (n.indexOf("japan") >= 0 || n === "jp") {
        if (nm.indexOf("japan") >= 0 || nm === "jp") score += 120;
      }
      if (score === 0 && n.indexOf("united kingdom") >= 0 && nm.indexOf("kingdom") >= 0) score += 80;
      if (score === 0 && n.indexOf("united states") >= 0 && nm.indexOf("states") >= 0) score += 80;
      if (score === 0 && n.indexOf("japan") >= 0 && nm.indexOf("japan") >= 0) score += 80;
      if (nm.indexOf("flag") >= 0) score += 5;
      return score;
    }
    var best = null;
    var bestScore = -1;
    for (var i = 0; i < candidates.length; i++) {
      var s = scoreFlag(candidates[i]);
      if (s > bestScore) {
        bestScore = s;
        best = candidates[i];
      }
    }
    if (best && bestScore > 0) return best;
    return flagDefaultComp || best || null;
  }

  function tableSetFirstInstanceSwap(instance, targetComponent) {
    if (!instance || typeof instance.setProperties !== "function" || !targetComponent) return false;
    var meta = instance.componentProperties || {};
    var keys = Object.keys(meta);
    if (!keys.length) return false;
    var targetKey = null;
    for (var i = 0; i < keys.length; i++) {
      var entry = meta[keys[i]] || {};
      if (String(entry.type || "").toUpperCase() === "INSTANCE_SWAP") {
        targetKey = keys[i];
        break;
      }
    }
    if (!targetKey) return false;

    var attempts = [];
    if (targetComponent.key) attempts.push(targetComponent.key);
    if (targetComponent.id) attempts.push(targetComponent.id);
    if (targetComponent.name) attempts.push(targetComponent.name);
    for (var ai = 0; ai < attempts.length; ai++) {
      try {
        var patch = {};
        patch[targetKey] = attempts[ai];
        instance.setProperties(patch);
        return true;
      } catch (_swapTryErr) {}
    }
    return false;
  }

  function tablePickBadgeComponentForPriority(priorityText) {
    var candidates = badgeCandidates || [];
    if (!candidates.length) return badgeTemplate || null;
    var p = String(priorityText || "").toLowerCase();
    var targetColor = "error";
    if (p.indexOf("medium") >= 0) targetColor = "warning";
    else if (p.indexOf("low") >= 0) targetColor = "success";
    function scoreBadge(comp) {
      var nm = String((comp && comp.name) || "").toLowerCase().replace(/[\s_\-\/]+/g, "");
      if (!nm) return 0;
      var score = 0;
      if (nm.indexOf("color=" + targetColor) >= 0) score += 150;
      if (nm.indexOf(targetColor) >= 0) score += 80;
      if (nm.indexOf("variant=outline") >= 0) score += 30;
      if (nm.indexOf("circle=off") >= 0) score += 10;
      return score;
    }
    var best = null;
    var bestScore = -1;
    for (var i = 0; i < candidates.length; i++) {
      var s = scoreBadge(candidates[i]);
      if (s > bestScore) {
        bestScore = s;
        best = candidates[i];
      }
    }
    if (best && bestScore > 0) return best;
    return badgeTemplate || best || null;
  }

  async function makeTableBodyCell(variantName, width, textOverride) {
    if (!bodySet || bodySet.type !== "COMPONENT_SET") return null;
    var variantComp = findTableBodyVariantComponent(bodySet, variantName);
    if (!variantComp) variantComp = bodySet.children && bodySet.children.length ? bodySet.children[0] : null;
    if (!variantComp) return null;
    var inst = null;
    try {
      inst = variantComp.createInstance();
      inst.name = "TableBody";
      try { await inst.loadAsync(); } catch (_eLdBody) {}
      if (String(variantName || "").toLowerCase() === "flag") {
        var countryFlagComp = tablePickFlagComponentForCountry(textOverride);
        if (countryFlagComp) {
          var didSetFlag = tableSetFirstInstanceSwap(inst, countryFlagComp);
          if (!didSetFlag) {
            tableSetInstanceProps(inst, { "Flag": { __instanceSwapTarget: countryFlagComp } });
          }
        }
      } else if (String(variantName || "").toLowerCase() === "badge") {
        var priorityBadgeComp = tablePickBadgeComponentForPriority(textOverride);
        if (priorityBadgeComp) {
          var didSetBadge = tableSetFirstInstanceSwap(inst, priorityBadgeComp);
          if (!didSetBadge) {
            tableSetInstanceProps(inst, { "Badge": { __instanceSwapTarget: priorityBadgeComp } });
          }
        }
      }
      if (typeof textOverride === "string" && textOverride.length > 0) {
        try { await tableTrySetTextOnInstance(inst, ["text", "Label", "Value"], textOverride); } catch (_eBodyText) {}
      }
      try { inst.resize(width, Math.max(1, Math.ceil(inst.height || 52))); } catch (_eBodySize) {}
    } catch (_eBodyInst) {
      inst = null;
    }
    return inst;
  }

  var tableComp = figma.createComponent();
  tableComp.name = "Table";
  tableComp.layoutMode = "VERTICAL";
  tableComp.primaryAxisSizingMode = "AUTO";
  tableComp.counterAxisSizingMode = "AUTO";
  tableComp.primaryAxisAlignItems = "MIN";
  tableComp.counterAxisAlignItems = "MIN";
  tableComp.itemSpacing = 0;
  tableComp.clipsContent = false;
  tableComp.fills = [];
  tableComp.strokes = [{ type: "SOLID", color: { r: 0.22, g: 0.24, b: 0.34 } }];
  tableComp.strokeWeight = 1;
  tableComp.strokeAlign = "INSIDE";
  if (varMap["table/border"]) bindPaintVar(tableComp, "strokes", 0, varMap["table/border"]);
  try { tableComp.cornerRadius = 4; } catch (_eTableCorner) {}

  var tableHeaderDefs = [
    { label: "Vessel", width: 180, sort: true },
    { label: "Reason Tag", width: 203, sort: false },
    { label: "Flag", width: 163, sort: true },
    { label: "MMSI", width: 98, sort: true },
    { label: "Priority", width: 98, sort: true },
    { label: "Confidence", width: 190, sort: true },
    { label: "Status", width: 128, sort: true },
  ];

  var headerRow = figma.createFrame();
  headerRow.name = "HeaderRow";
  headerRow.layoutMode = "HORIZONTAL";
  headerRow.primaryAxisSizingMode = "AUTO";
  headerRow.counterAxisSizingMode = "AUTO";
  headerRow.primaryAxisAlignItems = "MIN";
  headerRow.counterAxisAlignItems = "MIN";
  headerRow.itemSpacing = 0;
  headerRow.fills = [];
  headerRow.strokes = [];
  for (var hdi = 0; hdi < tableHeaderDefs.length; hdi++) {
    var hd = tableHeaderDefs[hdi];
    var hInst = await makeTableHeaderCell(hd.label, hd.width, hd.sort);
    if (hInst) headerRow.appendChild(hInst);
  }
  tableComp.appendChild(headerRow);

  var tableRows = [
    ["Astra Voyager", "AIS spoofing pattern", "United Kingdom", "636019287", "High", "60%", "Pending"],
    ["Atlantic Horizon", "Sanctions-linked port call", "United States", "367823456", "Medium", "60%", "Investigating"],
    ["North Star", "Identity mismatch", "Japan", "431002198", "Low", "60%", "Monitoring"],
  ];

  var bodyRowsWrap = figma.createFrame();
  bodyRowsWrap.name = "BodyRows";
  bodyRowsWrap.layoutMode = "VERTICAL";
  bodyRowsWrap.primaryAxisSizingMode = "AUTO";
  bodyRowsWrap.counterAxisSizingMode = "AUTO";
  bodyRowsWrap.primaryAxisAlignItems = "MIN";
  bodyRowsWrap.counterAxisAlignItems = "MIN";
  bodyRowsWrap.itemSpacing = 0;
  bodyRowsWrap.fills = [];
  bodyRowsWrap.strokes = [];

  for (var ri = 0; ri < tableRows.length; ri++) {
    var row = tableRows[ri];
    var rowFrame = figma.createFrame();
    rowFrame.name = "Row " + String(ri + 1);
    rowFrame.layoutMode = "HORIZONTAL";
    rowFrame.primaryAxisSizingMode = "AUTO";
    rowFrame.counterAxisSizingMode = "AUTO";
    rowFrame.primaryAxisAlignItems = "MIN";
    rowFrame.counterAxisAlignItems = "MIN";
    rowFrame.itemSpacing = 0;
    rowFrame.fills = [];
    rowFrame.strokes = [];

    var c1 = await makeTableBodyCell("Text", 180, row[0]);
    var c2 = await makeTableBodyCell("Text", 203, row[1]);
    var c3 = await makeTableBodyCell("Flag", 163, row[2]);
    var c4 = await makeTableBodyCell("Text", 98, row[3]);
    var c5 = await makeTableBodyCell("Badge", 98, row[4]);
    var c6 = await makeTableBodyCell("Progress", 190, row[5]);
    var c7 = await makeTableBodyCell("Icon", 128, row[6]);
    if (c1) rowFrame.appendChild(c1);
    if (c2) rowFrame.appendChild(c2);
    if (c3) rowFrame.appendChild(c3);
    if (c4) rowFrame.appendChild(c4);
    if (c5) rowFrame.appendChild(c5);
    if (c6) rowFrame.appendChild(c6);
    if (c7) rowFrame.appendChild(c7);
    bodyRowsWrap.appendChild(rowFrame);
  }

  tableComp.appendChild(bodyRowsWrap);
  try {
    tableComp.resize(1060, Math.max(1, Math.ceil(tableComp.height || 1)));
  } catch (_tableResize) {}
  page.appendChild(tableComp);

  progress(
    "Table: TableHeader (132px; INSTANCE_SWAP sort; Show sort). TableBody: COMPONENT_SET Variant=Badge|Progress|Text|Flag|Avatar|Icon [" +
      TABLE_BODY_BUILD +
      "] — nested Badge / Progress / Text / Avatar instances; Flag and Icon variants use INSTANCE_SWAP. Also exported composed Table component."
  );
  // Keep output order aligned with docs/navigation expectations.
  // Desired sequence: TableHeader -> TableBody -> Table.
  return [comp, bodySet, tableComp];
}

function buildTitleComponentSet(varMap, page, font, sampleText) {
  var orders = [1, 2, 3, 4, 5, 6];
  var sizeModes = ["h1", "h2", "h3", "h4", "h5", "h6"];
  var wrapModes = ["wrap", "balance", "nowrap"];
  var clampModes = ["off", "2", "3"];
  var components = [];
  var defaultTitleWidth = 380;

  var colGap = 16;
  var rowGap = 16;
  var rowHeight = 150 + rowGap;
  var rowXOffsets = [];

  var defaultFontSizeByOrder = { 1: 34, 2: 28, 3: 24, 4: 20, 5: 16, 6: 14 };

  for (var oi = 0; oi < orders.length; oi++) {
    var order = orders[oi];
    for (var si = 0; si < sizeModes.length; si++) {
      var sizeMode = sizeModes[si];
      var capSize = sizeMode.toUpperCase();
      for (var wmi = 0; wmi < wrapModes.length; wmi++) {
        var wrapMode = wrapModes[wmi];
        var capWrap = wrapMode.charAt(0).toUpperCase() + wrapMode.slice(1);
        for (var cmi = 0; cmi < clampModes.length; cmi++) {
          var clampMode = clampModes[cmi];
          var capClamp = clampMode === "off" ? "Off" : clampMode;

          var comp = figma.createComponent();
          comp.name =
            "Order=" + order +
            ", Size=" + capSize +
            ", Wrap=" + capWrap +
            ", Clamp=" + capClamp;
          comp.layoutMode = "HORIZONTAL";
          comp.primaryAxisSizingMode = "FIXED";
          comp.counterAxisSizingMode = "AUTO";
          comp.primaryAxisAlignItems = "MIN";
          comp.counterAxisAlignItems = "CENTER";
          comp.itemSpacing = 0;
          comp.fills = [];
          comp.clipsContent = false;
          try { comp.layoutSizingHorizontal = "FILL"; } catch (_titleRootSizeErr) {}
          try { comp.layoutSizingVertical = "FILL"; } catch (_titleRootSizeVerticalErr) {}

          var textNode = figma.createText();
          textNode.name = "title";
          textNode.fontName = font;
          textNode.characters = sampleText || "Why guess when you can know.";
          textNode.fills = [{ type: "SOLID", color: { r: 0.85, g: 0.86, b: 0.88 } }];
          textNode.fontSize = defaultFontSizeByOrder[order] || 20;
          textNode.textAutoResize = "WIDTH_AND_HEIGHT";
          textNode.textAlignHorizontal = "LEFT";
          textNode.layoutGrow = 1;
          try {
            var titleNaturalHeight = Math.max(1, Math.ceil(textNode.height || 1));
            textNode.textAutoResize = "HEIGHT";
            textNode.resize(defaultTitleWidth, titleNaturalHeight);
          } catch (_titleTextResizeErr) {}

          var sizeKey = sizeMode;
          var tokenVar = varMap["title/font-size-" + sizeKey];
          bindVar(textNode, "fontSize", tokenVar);
          bindVar(textNode, "fontFamily", varMap["title/font-family"]);
          bindVar(textNode, "fontStyle", varMap["title/font-weight"]);
          bindVar(textNode, "lineHeight", varMap["title/line-height-" + sizeKey]);
          bindPaintVar(textNode, "fills", 0, varMap["title/color"]);

          // Figma currently has limited direct API support for text-wrap modes.
          // Keep all modes as variant properties; clamp is best-effort when supported.
          if (clampMode !== "off") {
            try {
              textNode.textTruncation = "ENDING";
              textNode.maxLines = parseInt(clampMode, 10);
            } catch (e) {}
          }

          var titleContent = figma.createFrame();
          titleContent.name = "Content";
          titleContent.layoutMode = "HORIZONTAL";
          titleContent.primaryAxisSizingMode = "FIXED";
          titleContent.counterAxisSizingMode = "AUTO";
          titleContent.primaryAxisAlignItems = "MIN";
          titleContent.counterAxisAlignItems = "MIN";
          titleContent.itemSpacing = 0;
          titleContent.fills = [];
          titleContent.strokes = [];
          titleContent.layoutGrow = 1;
          titleContent.layoutAlign = "STRETCH";
          try { titleContent.layoutSizingHorizontal = "FILL"; } catch (_titleContentSizeErr) {}
          try {
            var titleContentHeight = Math.max(1, Math.ceil(textNode.height || 1));
            titleContent.resize(defaultTitleWidth, titleContentHeight);
          } catch (_titleContentResizeErr) {}
          titleContent.appendChild(textNode);
          comp.appendChild(titleContent);
          try { comp.resize(defaultTitleWidth, comp.height); } catch (_titleCompResizeErr) {}

          if (typeof rowXOffsets[oi] === "undefined") rowXOffsets[oi] = 0;
          page.appendChild(comp);
          comp.x = rowXOffsets[oi];
          comp.y = oi * rowHeight;
          rowXOffsets[oi] += Math.ceil(nodeRenderedWidth(comp)) + colGap;
          components.push(comp);
        }
      }
    }
  }

  progress("Created " + components.length + " title variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Title";
  return componentSet;
}

async function buildTextComponentSet(varMap, page, fallbackFont, sampleText) {
  var sizes = ["default", "label", "caption", "xs", "sm", "md", "lg", "xl"];
  var weights = ["regular", "medium", "semibold", "bold"];
  var colors = ["default", "dimmed", "brand", "success", "warning", "error"];
  var components = [];
  var defaultTextWidth = 320;

  var colGap = 18;
  var rowGap = 16;
  var rowHeight = 130 + rowGap;
  var rowXOffsets = [];

  var fontByWeight = {
    regular: fallbackFont,
    medium: fallbackFont,
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
  var mediumCandidates = [
    { family: "Inter", style: "Medium" },
    { family: "Inter", style: "Regular" },
  ];
  var semiboldCandidates = [
    { family: "Inter", style: "Semi Bold" },
    { family: "Inter", style: "SemiBold" },
    { family: "Inter", style: "Medium" },
  ];

  for (var rci = 0; rci < regularCandidates.length; rci++) {
    try {
      await figma.loadFontAsync(regularCandidates[rci]);
      fontByWeight.regular = regularCandidates[rci];
      break;
    } catch (e) {}
  }
  for (var mci = 0; mci < mediumCandidates.length; mci++) {
    try {
      await figma.loadFontAsync(mediumCandidates[mci]);
      fontByWeight.medium = mediumCandidates[mci];
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
    var capSize = size === "default"
      ? "Default"
      : (size === "label" || size === "caption"
        ? size.charAt(0).toUpperCase() + size.slice(1)
        : size.toUpperCase());
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
        comp.layoutMode = "HORIZONTAL";
        comp.primaryAxisSizingMode = "AUTO";
        comp.counterAxisSizingMode = "AUTO";
        comp.primaryAxisAlignItems = "MIN";
        comp.counterAxisAlignItems = "CENTER";
        comp.itemSpacing = 0;
        comp.fills = [];
        comp.clipsContent = false;

        var textNode = figma.createText();
        textNode.name = "text";
        textNode.fontName = fontByWeight[weight] || fallbackFont;
        textNode.characters = sampleText || "Why guess when you can know.";
        textNode.fontSize = 16;
        textNode.textAutoResize = "WIDTH_AND_HEIGHT";
        textNode.textAlignHorizontal = "LEFT";
        textNode.layoutGrow = 0;
        textNode.fills = [{ type: "SOLID", color: { r: 0.85, g: 0.86, b: 0.88 } }];

        bindVar(textNode, "fontSize", varMap["text/font-size-" + size]);
        bindVar(textNode, "fontFamily", varMap["text/font-family"]);
        bindVar(textNode, "fontStyle", varMap["text/font-weight-" + weight]);
        bindVar(textNode, "lineHeight", varMap["text/line-height-" + size]);
        bindPaintVar(textNode, "fills", 0, varMap[textColorPath(color)]);

        var textContent = figma.createFrame();
        textContent.name = "Content";
        textContent.layoutMode = "HORIZONTAL";
        textContent.primaryAxisSizingMode = "AUTO";
        textContent.counterAxisSizingMode = "AUTO";
        textContent.primaryAxisAlignItems = "MIN";
        textContent.counterAxisAlignItems = "MIN";
        textContent.itemSpacing = 0;
        textContent.fills = [];
        textContent.strokes = [];
        textContent.layoutGrow = 0;
        textContent.layoutAlign = "MIN";
        textContent.appendChild(textNode);
        comp.appendChild(textContent);

        page.appendChild(comp);
        if (typeof rowXOffsets[si] === "undefined") rowXOffsets[si] = 0;
        comp.x = rowXOffsets[si];
        comp.y = si * rowHeight;
        rowXOffsets[si] += Math.ceil(nodeRenderedWidth(comp)) + colGap;
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
  if (mode === "success") return "text/color-success";
  if (mode === "warning") return "text/color-warning";
  if (mode === "error") return "text/color-error";
  return "text/color";
}

// ---------------------------------------------------------------------------
// Checkbox
// ---------------------------------------------------------------------------

async function buildCheckboxComponentSet(varMap, page, font) {
  var variants = ["filled", "outlined"];
  var sizes = ["default", "xs", "sm", "md", "lg", "xl"];
  var radii = ["default", "xs", "sm", "md", "lg", "xl"];
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
  var sizeBoxSizes = { default: 20, xs: 16, sm: 18, md: 20, lg: 24, xl: 28 };
  var sizeIconSizes = { default: 14, xs: 10, sm: 12, md: 14, lg: 16, xl: 18 };
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

  for (var vi = 0; vi < variants.length; vi++) {
    var variant = variants[vi];
    var capVariant = variant.charAt(0).toUpperCase() + variant.slice(1);

    for (var chi = 0; chi < checkedStates.length; chi++) {
      var checkedState = checkedStates[chi];
      var capChecked = checkedState.charAt(0).toUpperCase() + checkedState.slice(1);
      var isActive = (checkedState !== "unchecked"); // checked or indeterminate

      for (var ri = 0; ri < radii.length; ri++) {
        var rad = radii[ri];
        var capRadius = (rad === "default")
          ? "Default"
          : (rad.charAt(0).toUpperCase() + rad.slice(1));

        for (var li = 0; li < labelModes.length; li++) {
          var showLabel = (labelModes[li] === "show");
          var capLabel = showLabel ? "Show" : "Hide";

          for (var si = 0; si < sizes.length; si++) {
            var size = sizes[si];
            var capSize = size === "default" ? "Default" : size.toUpperCase();
            var boxSize = sizeBoxSizes[size];
            var iconSize = sizeIconSizes[size];

            for (var sti = 0; sti < states.length; sti++) {
              var state = states[sti];
              var capState = state.charAt(0).toUpperCase() + state.slice(1);

              var comp = figma.createComponent();
              comp.name = "Variant=" + capVariant + ", Size=" + capSize + ", Radius=" + capRadius + ", Checked=" + capChecked +
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
          bindVar(box, "topLeftRadius", varMap["checkbox/radius-" + rad] || varMap["checkbox/border-radius-" + size]);
          bindVar(box, "topRightRadius", varMap["checkbox/radius-" + rad] || varMap["checkbox/border-radius-" + size]);
          bindVar(box, "bottomLeftRadius", varMap["checkbox/radius-" + rad] || varMap["checkbox/border-radius-" + size]);
          bindVar(box, "bottomRightRadius", varMap["checkbox/radius-" + rad] || varMap["checkbox/border-radius-" + size]);

          // Box fill — checked/indeterminate use checked bg, unchecked uses unchecked bg
          var boxBgPath = checkboxBgPath(varMap, variant, checkedState, state);
          if (isActive) {
            box.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
          } else {
            box.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
          }
          bindPaintVar(box, "fills", 0, varMap[boxBgPath]);

          // Box border
          var boxBorderPath = checkboxBorderPath(varMap, variant, checkedState, state);
          box.strokes = [{ type: "SOLID", color: { r: 0.78, g: 0.78, b: 0.78 } }];
          box.strokeWeight = 1.5;
          box.strokeAlign = "INSIDE";
          bindPaintVar(box, "strokes", 0, varMap[boxBorderPath]);
          bindVar(box, "strokeWeight", varMap["checkbox/border-width"]);

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
            var iconColorPath = checkboxIconColorPath(varMap, variant, state);
            var vectors = checkInst.findAll(function(n) { return n.type === "VECTOR"; });
            for (var vci = 0; vci < vectors.length; vci++) {
                bindVar(vectors[vci], "strokeWeight", varMap["checkbox/icon-stroke-width-" + size]);
              if (vectors[vci].strokes && vectors[vci].strokes.length > 0) {
                vectors[vci].strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
                bindPaintVar(vectors[vci], "strokes", 0, varMap[iconColorPath]);
              }
              if (vectors[vci].fills && vectors[vci].fills.length > 0) {
                vectors[vci].fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
                bindPaintVar(vectors[vci], "fills", 0, varMap[iconColorPath]);
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
            var dashColorPath = checkboxIconColorPath(varMap, variant, state);
            var dashVectors = minusInst.findAll(function(n) { return n.type === "VECTOR"; });
            for (var dvi = 0; dvi < dashVectors.length; dvi++) {
              bindVar(dashVectors[dvi], "strokeWeight", varMap["checkbox/icon-stroke-width-" + size]);
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

            var labelTextPath = checkboxLabelTextPath(varMap, state);
            labelNode.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
            bindPaintVar(labelNode, "fills", 0, varMap[labelTextPath]);
            bindVar(labelNode, "fontSize", varMap["checkbox/label-font-size-" + size]);
            bindVar(labelNode, "fontFamily", varMap["checkbox/label-font-family"]);
            bindVar(labelNode, "fontStyle", varMap["checkbox/label-font-weight"]);
            bindVar(labelNode, "lineHeight", varMap["checkbox/label-line-height-" + size]);
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

          // Grid placement: columns = (checkedState × label), rows = (size × state)
            var colIndex = ((((vi * checkedStates.length + chi) * radii.length + ri) * labelModes.length) + li);
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
  }

  progress("Created " + components.length + " checkbox variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Checkbox";
  return componentSet;
}

// Helper: build figmaPath for checkbox background
function pickExistingPath(varMap, paths) {
  for (var i = 0; i < paths.length; i++) {
    if (varMap[paths[i]]) return paths[i];
  }
  return paths[paths.length - 1];
}

function checkboxBgPath(varMap, variant, checkedState, state) {
  var isActive = (checkedState !== "unchecked");
  if (state === "disabled") {
    return pickExistingPath(varMap, [
      "checkbox/" + variant + "-background-disabled",
      isActive ? "checkbox/background-checked-disabled" : "checkbox/background-disabled"
    ]);
  }
  if (state === "default") {
    return pickExistingPath(varMap, [
      isActive
        ? "checkbox/" + variant + "-background-checked"
        : "checkbox/" + variant + "-background",
      isActive ? "checkbox/background-checked" : "checkbox/background"
    ]);
  }
  return pickExistingPath(varMap, [
    isActive
      ? "checkbox/" + variant + "-background-checked-" + state
      : "checkbox/" + variant + "-background-" + state,
    isActive
      ? "checkbox/background-checked-" + state
      : "checkbox/background-" + state
  ]);
}

// Helper: build figmaPath for checkbox border
function checkboxBorderPath(varMap, variant, checkedState, state) {
  var isActive = (checkedState !== "unchecked");
  if (state === "disabled") {
    return pickExistingPath(varMap, [
      isActive ? "checkbox/" + variant + "-border-checked-disabled" : null,
      "checkbox/" + variant + "-border-disabled",
      "checkbox/border-disabled"
    ].filter(Boolean));
  }
  if (isActive) {
    return pickExistingPath(varMap, [
      "checkbox/" + variant + "-border-checked-" + state,
      "checkbox/" + variant + "-border-checked",
      "checkbox/" + variant + "-border-" + state,
      "checkbox/" + variant + "-border",
      state === "default" ? "checkbox/border" : "checkbox/border-" + state
    ]);
  }
  if (state === "default") {
    return pickExistingPath(varMap, ["checkbox/" + variant + "-border", "checkbox/border"]);
  }
  return pickExistingPath(varMap, [
    "checkbox/" + variant + "-border-" + state,
    "checkbox/" + variant + "-border",
    "checkbox/border-" + state
  ]);
}

// Helper: build figmaPath for checkbox icon color
function checkboxIconColorPath(varMap, variant, state) {
  if (state === "disabled") {
    return pickExistingPath(varMap, [
      "checkbox/" + variant + "-icon-color-disabled"
    ]);
  }
  if (state !== "default") {
    return pickExistingPath(varMap, [
      "checkbox/" + variant + "-icon-color-" + state,
      "checkbox/" + variant + "-icon-color"
    ]);
  }
  return pickExistingPath(varMap, ["checkbox/" + variant + "-icon-color"]);
}

// Helper: build figmaPath for checkbox label text
function checkboxLabelTextPath(varMap, state) {
  if (state === "disabled") return pickExistingPath(varMap, ["checkbox/label-text-disabled", "checkbox/label-text"]);
  return pickExistingPath(varMap, ["checkbox/label-text"]);
}

// ---------------------------------------------------------------------------
// Radio
// ---------------------------------------------------------------------------

function buildRadioComponentSet(varMap, page, font) {
  var sizes = ["default", "xs", "sm", "md", "lg", "xl"];
  var variants = ["filled", "outline"];
  var checkedStates = ["unchecked", "checked"];
  var states = ["default", "hover", "focus", "pressed", "disabled"];
  var labelModes = ["hide", "show"];
  var components = [];

  // Known radio sizes for layout
  // Include `default` because this builder emits Default size variants.
  var sizeRadioSizes = { default: 24, xs: 16, sm: 20, md: 24, lg: 28, xl: 32 };
  var sizeIconSizes = { default: 10, xs: 6, sm: 8, md: 10, lg: 12, xl: 14 };
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
          var radioSize = sizeRadioSizes[size] != null ? sizeRadioSizes[size] : sizeRadioSizes.default;
          var iconSize = sizeIconSizes[size] != null ? sizeIconSizes[size] : sizeIconSizes.default;

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

            // Radio fill: mirror preview behavior exactly.
            // - Filled + checked uses checked background token.
            // - Outline always uses unchecked background token for circle fill.
            var uncheckedBgPath = radioBgPath(varMap, variant, "unchecked", state);
            var checkedBgPath = radioBgPath(varMap, variant, "checked", state);
            var bgPath = (isChecked && variant === "filled") ? checkedBgPath : uncheckedBgPath;
            if (isChecked && variant === "filled") {
              circle.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
            } else {
              circle.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
            }
            bindPaintVar(circle, "fills", 0, varMap[bgPath]);

            // Radio border
            var borderPath = radioBorderPath(varMap, variant, checkedState, state);
            if (!isChecked || variant === "outline") {
              // Unchecked: always show border. Outline checked: also show border
              circle.strokes = [{ type: "SOLID", color: { r: 0.78, g: 0.78, b: 0.78 } }];
              circle.strokeWeight = 1.5;
              circle.strokeAlign = "INSIDE";
              bindPaintVar(circle, "strokes", 0, varMap[borderPath]);
              bindVar(circle, "strokeWeight", varMap["radio/border-width"]);
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

              var iconColorPath = radioIconColorPath(varMap, variant, state);
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
              bindVar(labelNode, "fontFamily", varMap["radio/label-font-family"]);
              bindVar(labelNode, "fontStyle", varMap["radio/label-font-weight"]);
              bindVar(labelNode, "lineHeight", varMap["radio/label-line-height-" + size]);
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
function radioBgPath(varMap, variant, checkedState, state) {
  if (checkedState === "unchecked") {
    if (state === "default") {
      return pickExistingPath(varMap, [
        "radio/" + variant + "-background",
        "radio/background"
      ]);
    }
    return pickExistingPath(varMap, [
      "radio/" + variant + "-background-" + state,
      "radio/background-" + state
    ]);
  }
  // checked
  var prefix = "radio/" + variant + "-background-checked";
  if (state === "default") return prefix;
  return prefix + "-" + state;
}

// Helper: build figmaPath for radio border
function radioBorderPath(varMap, variant, checkedState, state) {
  var isChecked = checkedState === "checked";
  if (state === "default") {
    if (isChecked) {
      return pickExistingPath(varMap, [
        "radio/" + variant + "-border-checked",
        "radio/" + variant + "-border"
      ]);
    }
    return "radio/" + variant + "-border";
  }
  if (isChecked) {
    return pickExistingPath(varMap, [
      "radio/" + variant + "-border-checked-" + state,
      "radio/" + variant + "-border-checked",
      "radio/" + variant + "-border-" + state,
      "radio/" + variant + "-border"
    ]);
  }
  return pickExistingPath(varMap, [
    "radio/" + variant + "-border-" + state,
    "radio/" + variant + "-border"
  ]);
}

// Helper: build figmaPath for radio icon (dot) color
function radioIconColorPath(varMap, variant, state) {
  if (state === "default") {
    return pickExistingPath(varMap, [
      "radio/" + variant + "-icon-color-checked"
    ]);
  }
  return pickExistingPath(varMap, [
    "radio/" + variant + "-icon-color-checked-" + state,
    "radio/" + variant + "-icon-color-checked"
  ]);
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
  var sizes = ["default", "xs", "sm", "md", "lg", "xl"];
  var radii = ["default", "xs", "sm", "md", "lg", "xl"];
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
  var sizeHeights = { default: 32, xs: 23, sm: 28, md: 32, lg: 36, xl: 40 };
  var sizeIconSizes = { default: 14, xs: 9, sm: 12, md: 14, lg: 16, xl: 18 };
  var gap = 16;
  var colGap = 16;

  // Pre-calculate y offsets: rows = (radius × size × state)
  var rowYOffsets = [];
  var runningY = 0;
  for (var rri = 0; rri < radii.length; rri++) {
    for (var rsi = 0; rsi < sizes.length; rsi++) {
      for (var rsti = 0; rsti < states.length; rsti++) {
        rowYOffsets.push(runningY);
        var rowH = sizeHeights[sizes[rsi]] != null ? sizeHeights[sizes[rsi]] : sizeHeights.default;
        if (rowH < 24) rowH = 24;
        runningY += rowH + gap;
      }
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

      for (var ri = 0; ri < radii.length; ri++) {
        var radius = radii[ri];
        var capRadius = radius === "default" ? "Default" : radius.toUpperCase();

        for (var si = 0; si < sizes.length; si++) {
          var size = sizes[si];
          var capSize = size === "default" ? "Default" : size.toUpperCase();
          var chipHeight = sizeHeights[size] != null ? sizeHeights[size] : sizeHeights.default;
          var iconSize = sizeIconSizes[size] != null ? sizeIconSizes[size] : sizeIconSizes.default;

          for (var sti = 0; sti < states.length; sti++) {
            var state = states[sti];
            var capState = state.charAt(0).toUpperCase() + state.slice(1);

            var comp = figma.createComponent();
            comp.name = "Variant=" + capVariant + ", Size=" + capSize + ", Radius=" + capRadius +
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
          var paddingX = isChecked ? 10 : 16;
          var paddingY = 4;
          comp.paddingLeft = paddingX;
          comp.paddingRight = paddingX;
          comp.paddingTop = paddingY;
          comp.paddingBottom = paddingY;
          comp.itemSpacing = 6;

          // Bind dimensions
          bindVar(comp, "minHeight", varMap["chip/height-" + size]);
          if (isChecked) {
            bindVar(comp, "paddingLeft", varMap["chip/checked-padding-x-" + size] || varMap["chip/checked-padding-" + size]);
            bindVar(comp, "paddingRight", varMap["chip/checked-padding-x-" + size] || varMap["chip/checked-padding-" + size]);
            bindVar(comp, "paddingTop", varMap["chip/checked-padding-y-" + size] || varMap["chip/checked-padding-" + size]);
            bindVar(comp, "paddingBottom", varMap["chip/checked-padding-y-" + size] || varMap["chip/checked-padding-" + size]);
          } else {
            bindVar(comp, "paddingLeft", varMap["chip/padding-x-" + size] || varMap["chip/padding-" + size]);
            bindVar(comp, "paddingRight", varMap["chip/padding-x-" + size] || varMap["chip/padding-" + size]);
            bindVar(comp, "paddingTop", varMap["chip/padding-y-" + size] || varMap["chip/padding-" + size]);
            bindVar(comp, "paddingBottom", varMap["chip/padding-y-" + size] || varMap["chip/padding-" + size]);
          }
            var radiusPath = chipRadiusPath(varMap, variant, radius);
            bindVar(comp, "topLeftRadius", varMap[radiusPath]);
            bindVar(comp, "topRightRadius", varMap[radiusPath]);
            bindVar(comp, "bottomLeftRadius", varMap[radiusPath]);
            bindVar(comp, "bottomRightRadius", varMap[radiusPath]);
            bindVar(comp, "itemSpacing", varMap["chip/spacing-" + size]);

          // Background fill
            var bgPath = chipBgPath(varMap, variant, isChecked, state);
            if (isChecked && variant === "filled") {
              comp.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
            } else if (isChecked && variant === "light") {
              comp.fills = [{ type: "SOLID", color: { r: 0.92, g: 0.92, b: 0.95 } }];
            } else {
              comp.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
            }
            bindPaintVar(comp, "fills", 0, varMap[bgPath]);

          // Border
            var borderPath = chipBorderPath(varMap, variant, isChecked, state);
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
              bindVar(vectors[vci], "strokeWeight", varMap["chip/icon-stroke-width-" + size]);
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

            var textColorPath = chipTextColorPath(varMap, variant, isChecked, state);
            textNode.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
            bindPaintVar(textNode, "fills", 0, varMap[textColorPath]);
            bindVar(textNode, "fontSize", varMap["chip/font-size-" + size]);
            bindVar(textNode, "fontFamily", varMap["chip/font-family"]);
            bindVar(textNode, "fontStyle", varMap["chip/font-weight"]);
            bindVar(textNode, "lineHeight", varMap["chip/line-height-" + size]);
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
            var rowIndex = ((ri * sizes.length + si) * states.length) + sti;
            comp.x = colIndex * colWidth;
            comp.y = rowYOffsets[rowIndex];
            page.appendChild(comp);
            components.push(comp);
          }
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
function chipBgPath(varMap, variant, isChecked, state) {
  if (!isChecked) {
    var resolvedState = state || "default";
    var variantBase = "chip/" + variant + "-background";
    var variantState = resolvedState === "default" ? variantBase : variantBase + "-" + resolvedState;
    if (varMap && varMap[variantState]) return variantState;
    if (varMap && varMap[variantBase]) return variantBase;
    var sharedBase = "chip/background";
    if (resolvedState === "default") return sharedBase;
    return sharedBase + "-" + resolvedState;
  }
  // checked — variant-specific
  var prefix = "chip/" + variant + "-background-checked";
  if (state === "default") return prefix;
  return prefix + "-" + state;
}

// Helper: build figmaPath for chip border
function chipBorderPath(varMap, variant, isChecked, state) {
  var resolvedState = state || "default";
  if (!isChecked) {
    var variantBasePath = "chip/" + variant + "-border";
    var variantStatePath = resolvedState === "default" ? variantBasePath : variantBasePath + "-" + resolvedState;
    if (varMap && varMap[variantStatePath]) return variantStatePath;
    if (varMap && varMap[variantBasePath]) return variantBasePath;
    if (resolvedState === "default") return "chip/border";
    return "chip/border-" + resolvedState;
  }
  if (isChecked) {
    var variantCheckedBasePath = "chip/" + variant + "-border-checked";
    var variantCheckedStatePath = resolvedState === "default" ? variantCheckedBasePath : variantCheckedBasePath + "-" + resolvedState;
    if (varMap && varMap[variantCheckedStatePath]) return variantCheckedStatePath;
    if (varMap && varMap[variantCheckedBasePath]) return variantCheckedBasePath;
    var checkedStatePath = resolvedState === "default" ? "chip/checked-border" : "chip/checked-border-" + resolvedState;
    if (varMap && varMap[checkedStatePath]) return checkedStatePath;
    if (varMap && varMap["chip/checked-border"]) return "chip/checked-border";
  }
  if (resolvedState === "default") return "chip/border";
  return "chip/border-" + resolvedState;
}

function chipRadiusPath(varMap, variant, radius) {
  var resolvedRadius = radius || "default";
  if (resolvedRadius === "default") {
    var variantPath = "chip/" + variant + "-radius";
    if (varMap && varMap[variantPath]) return variantPath;
  }
  return "chip/radius-" + resolvedRadius;
}

// Helper: build figmaPath for chip text color
function chipTextColorPath(varMap, variant, isChecked, state) {
  var resolvedState = state || "default";
  var uncheckedStatePath = resolvedState === "default" ? "chip/text" : "chip/text-" + resolvedState;
  if (!isChecked) {
    var variantBasePath = "chip/" + variant + "-text";
    var variantStatePath = resolvedState === "default" ? variantBasePath : variantBasePath + "-" + resolvedState;
    if (varMap && varMap[variantStatePath]) return variantStatePath;
    if (varMap && varMap[variantBasePath]) return variantBasePath;
    if (varMap && varMap[uncheckedStatePath]) return uncheckedStatePath;
    return "chip/text";
  }
  // Checked — variant-specific text (stateful when available)
  var checkedBasePath = "chip/" + variant + "-text-checked";
  var checkedStatePath = resolvedState === "default" ? checkedBasePath : checkedBasePath + "-" + resolvedState;
  if (varMap && varMap[checkedStatePath]) return checkedStatePath;
  if (varMap && varMap[checkedBasePath]) return checkedBasePath;
  if (varMap && varMap[uncheckedStatePath]) return uncheckedStatePath;
  return "chip/text";
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

function bindNotificationIconTokenVectors(iconInst, varMap) {
  bindNotificationGraphicNodesToIconToken(iconInst, varMap);
}

function bindNotificationGraphicNodesToIconToken(root, varMap) {
  if (!root || !varMap) return;
  bindNotificationGraphicNodesToPaintVar(
    root,
    varMap["notification/icon"],
    varMap["notification/icon-stroke-width"]
  );
}

/** Binds vector/ellipse strokes + fills on a close icon instance to `notification/close` (tone-aware). */
function bindNotificationCloseIconGraphicNodes(root, varMap, colorTone) {
  if (!root || !varMap) return;
  var paintVar = notificationResolvedVar(varMap, "close", colorTone) || varMap["notification/icon"];
  if (paintVar) {
    bindNotificationGraphicNodesToPaintVar(root, paintVar, varMap["notification/close-stroke-width"]);
  }
}

function bindNotificationGraphicNodesToPaintVar(root, paintVar, strokeWidthVar) {
  if (!root || !paintVar) return;
  var base = { r: 0.2, g: 0.53, b: 0.87 };
  var nodes = root.findAll(function(n) {
    return n.type === "VECTOR" || n.type === "ELLIPSE" || n.type === "RECTANGLE";
  });
  for (var ni = 0; ni < nodes.length; ni++) {
    var v = nodes[ni];
    if (v.strokes && v.strokes.length > 0) {
      v.strokes = [{ type: "SOLID", color: base }];
      bindPaintVar(v, "strokes", 0, paintVar);
      if (strokeWidthVar) bindVar(v, "strokeWeight", strokeWidthVar);
    }
    if (v.fills && v.fills.length > 0) {
      v.fills = [{ type: "SOLID", color: base }];
      bindPaintVar(v, "fills", 0, paintVar);
    }
  }
}

function notificationResolvedVar(varMap, suffix, colorTone) {
  var t = String(colorTone || "primary").toLowerCase();
  var darkLayers = { background: true, title: true, description: true, icon: true, close: true, accent: true };
  if (t === "dark" && darkLayers[suffix]) {
    var darkPath = "notification/dark-" + suffix;
    if (varMap[darkPath]) return varMap[darkPath];
  }
  return varMap["notification/" + suffix];
}

function notificationIndicatorVarForTone(varMap, tone, colorTone) {
  var t = String(tone || "").toLowerCase();
  var pathSuffix =
    t === "primary"
      ? "indicator-primary"
      : t === "dark"
        ? "indicator-dark"
        : t === "error"
          ? "indicator-error"
          : t === "warning"
            ? "indicator-warning"
            : t === "success"
              ? "indicator-success"
              : "indicator-primary";
  var hit = notificationResolvedVar(varMap, pathSuffix, colorTone);
  if (hit) return hit;
  var accentHit = notificationResolvedVar(varMap, "accent", colorTone);
  if (accentHit) return accentHit;
  return varMap["notification/accent"] || varMap["notification/icon"];
}

function notificationBorderVarForTone(varMap, tone, colorTone) {
  var t = String(tone || "").toLowerCase();
  var pathSuffix =
    t === "primary"
      ? "border-primary"
      : t === "dark"
        ? "border-dark"
        : t === "error"
          ? "border-error"
          : t === "warning"
            ? "border-warning"
            : t === "success"
              ? "border-success"
              : "border-primary";
  var hit = notificationResolvedVar(varMap, pathSuffix, colorTone);
  if (hit) return hit;
  var defBorder = notificationResolvedVar(varMap, "border-default", colorTone);
  if (defBorder) return defBorder;
  return notificationResolvedVar(varMap, "border-primary", colorTone);
}

/** Binds Loader shapes to `loader/color` (strokes + fills). Stroke-only arcs get a matching fill to remove inner seam/white line. */
function bindLoaderGraphicNodesToLoaderColor(root, varMap) {
  if (!root || !varMap) return;
  var colorVar = varMap["loader/color"];
  var base = { r: 0.13, g: 0.55, b: 0.9 };
  var nodes = root.findAll(function(n) {
    return (
      n.type === "VECTOR" ||
      n.type === "ELLIPSE" ||
      n.type === "RECTANGLE" ||
      n.type === "POLYGON" ||
      n.type === "STAR"
    );
  });
  for (var ni = 0; ni < nodes.length; ni++) {
    var v = nodes[ni];
    if (v.strokes && v.strokes.length > 0) {
      v.strokes = [{ type: "SOLID", color: base }];
      if (colorVar) bindPaintVar(v, "strokes", 0, colorVar);
    }
    if (v.fills && v.fills.length > 0) {
      v.fills = [{ type: "SOLID", color: base }];
      if (colorVar) bindPaintVar(v, "fills", 0, colorVar);
    } else if (v.strokes && v.strokes.length > 0) {
      v.fills = [{ type: "SOLID", color: base }];
      if (colorVar) bindPaintVar(v, "fills", 0, colorVar);
    }
  }
}

function findLoaderOvalComponent(loaderSet) {
  if (!loaderSet || loaderSet.type !== "COMPONENT_SET" || !loaderSet.children) return null;
  var children = loaderSet.children;
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    if (child.type !== "COMPONENT") continue;
    var nn = String(child.name || "").toLowerCase().replace(/\s+/g, "");
    if (nn.indexOf("type=oval") >= 0 && nn.indexOf("size=default") >= 0) return child;
  }
  for (var i0 = 0; i0 < children.length; i0++) {
    var ch0 = children[i0];
    if (ch0.type !== "COMPONENT") continue;
    var n0 = String(ch0.name || "").toLowerCase().replace(/\s+/g, "");
    if (n0.indexOf("type=oval") >= 0 && n0.indexOf("size=md") >= 0) return ch0;
  }
  for (var j = 0; j < children.length; j++) {
    var c2 = children[j];
    if (c2.type !== "COMPONENT") continue;
    var n2 = String(c2.name || "").toLowerCase().replace(/\s+/g, "");
    if (n2.indexOf("type=oval") >= 0) return c2;
  }
  return null;
}

function resolveNotificationLoaderSource(loaderSet, page) {
  var fromSet = findLoaderOvalComponent(loaderSet);
  if (fromSet) return fromSet;
  if (!page || !page.children) return null;
  for (var pi = 0; pi < page.children.length; pi++) {
    var ch = page.children[pi];
    if (ch.type === "COMPONENT_SET" && String(ch.name || "") === "Loader") {
      var hit = findLoaderOvalComponent(ch);
      if (hit) return hit;
    }
  }
  return null;
}

async function buildNotificationComponentSet(varMap, page, font, loaderSet, resolvedComponentFloat) {
  var resolveCompFloat =
    typeof resolvedComponentFloat === "function"
      ? resolvedComponentFloat
      : function (_path, fallback) {
          return fallback;
        };
  var radii = ["default", "xs", "sm", "md", "lg", "xl"];
  var borderStates = ["off", "on"];
  var closeStates = ["off", "on"];
  var iconStates = ["off", "on"];
  var loadingStates = ["off", "on"];
  var accentStates = ["on", "off"];
  var colorTones = ["primary", "dark", "error", "warning", "success"];
  var gap = 24;
  var colWidth = 420;
  var rowHeight = 130;

  var notificationIcons = await findNotificationIconComponents();
  if (notificationIcons.leading) {
    progress("[Notification] Icon source: " + notificationIcons.leading.name);
  } else {
    progress("[Notification] Warning: no matching icon on Icons page; using placeholder when Icon=On.");
  }
  if (notificationIcons.close) {
    progress("[Notification] Close icon source: " + notificationIcons.close.name);
  } else {
    progress("[Notification] Warning: no close icon on Icons page; Close=On uses × text (add X/Close icon to Icons for instance swap).");
  }

  var loaderSource = resolveNotificationLoaderSource(loaderSet, page);
  if (loaderSource) {
    progress("[Notification] Loading state uses Loader: " + loaderSource.name);
  } else {
    progress("[Notification] Warning: no Loader set (Oval/MD) found; loading state uses stroke ellipse.");
  }

  function appendNotificationVariant(targetComponents, layout, variantSpec) {
    var radius = variantSpec.radius;
    var withBorder = variantSpec.withBorder;
    var withClose = variantSpec.withClose;
    var withIcon = variantSpec.withIcon;
    var isLoading = variantSpec.isLoading;
    var withAccent = variantSpec.withAccent;
    var colorTone = variantSpec.colorTone;
    var compName = variantSpec.compName;
    var strokeOn = withBorder;
    var hasAccent = withAccent && !isLoading;
    var indicatorVar = notificationIndicatorVarForTone(varMap, colorTone, colorTone);

    var comp = figma.createComponent();
    comp.name = compName;
    comp.resize(360, 110);
    comp.clipsContent = false;
    comp.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    comp.strokes = strokeOn ? [{ type: "SOLID", color: { r: 0.84, g: 0.84, b: 0.84 } }] : [];
    comp.strokeWeight = strokeOn ? 1 : 0;
    comp.strokeAlign = "INSIDE";
    comp.cornerRadius = 8;

    var nBg = notificationResolvedVar(varMap, "background", colorTone);
    if (nBg) bindPaintVar(comp, "fills", 0, nBg);
    if (strokeOn) {
      var borderVar = notificationBorderVarForTone(varMap, colorTone, colorTone);
      if (borderVar) bindPaintVar(comp, "strokes", 0, borderVar);
    }
    if (strokeOn && varMap["notification/border-width"]) bindVar(comp, "strokeWeight", varMap["notification/border-width"]);
    if (varMap["notification/radius-" + radius]) {
      bindVar(comp, "topLeftRadius", varMap["notification/radius-" + radius]);
      bindVar(comp, "topRightRadius", varMap["notification/radius-" + radius]);
      bindVar(comp, "bottomLeftRadius", varMap["notification/radius-" + radius]);
      bindVar(comp, "bottomRightRadius", varMap["notification/radius-" + radius]);
    }

    function appendNotificationCloseControl() {
      if (!withClose) return;
      var notifW = 360;
      var closeIconW = 16;
      var closePadRight = resolveCompFloat("notification/padding-x", 12);
      var closeTop = resolveCompFloat("notification/padding-y", 10);
      var closeX = notifW - closeIconW - closePadRight;
      var closeComp = notificationIcons.close;
      if (closeComp && closeComp.type === "COMPONENT") {
        var closeInst = closeComp.createInstance();
        closeInst.name = "close";
        try {
          closeInst.resize(closeIconW, closeIconW);
        } catch (_eCloseResize) {}
        bindNotificationCloseIconGraphicNodes(closeInst, varMap, colorTone);
        closeInst.x = closeX;
        closeInst.y = closeTop;
        comp.appendChild(closeInst);
      } else {
        var closeNode = figma.createText();
        closeNode.name = "close";
        closeNode.fontName = font;
        closeNode.characters = "×";
        closeNode.fontSize = 14;
        closeNode.fills = [{ type: "SOLID", color: { r: 0.35, g: 0.37, b: 0.4 } }];
        var nCloseFallback = notificationResolvedVar(varMap, "close", colorTone);
        if (nCloseFallback) bindPaintVar(closeNode, "fills", 0, nCloseFallback);
        closeNode.x = closeX;
        closeNode.y = closeTop;
        comp.appendChild(closeNode);
      }
    }

    if (isLoading) {
      // Same layer stack as non-loading: accent exists but stays hidden while loading (no left bar).
      var accentLoad = figma.createRectangle();
      accentLoad.name = "accent";
      accentLoad.resize(6, 94);
      accentLoad.x = 8;
      accentLoad.y = 8;
      accentLoad.cornerRadius = 3;
      accentLoad.visible = false;
      accentLoad.fills = [{ type: "SOLID", color: { r: 0.2, g: 0.53, b: 0.87 } }];
      if (indicatorVar) bindPaintVar(accentLoad, "fills", 0, indicatorVar);
      else if (notificationResolvedVar(varMap, "accent", colorTone))
        bindPaintVar(accentLoad, "fills", 0, notificationResolvedVar(varMap, "accent", colorTone));
      else if (notificationResolvedVar(varMap, "icon", colorTone))
        bindPaintVar(accentLoad, "fills", 0, notificationResolvedVar(varMap, "icon", colorTone));
      comp.appendChild(accentLoad);

      // Row: loader left (vertically centered vs copy), title + description right, left-aligned.
      var loadingBody = figma.createFrame();
      loadingBody.name = "body";
      loadingBody.resize(360, 110);
      loadingBody.x = 0;
      loadingBody.y = 0;
      loadingBody.clipsContent = false;
      loadingBody.layoutMode = "HORIZONTAL";
      loadingBody.primaryAxisSizingMode = "FIXED";
      loadingBody.counterAxisSizingMode = "FIXED";
      loadingBody.primaryAxisAlignItems = "MIN";
      loadingBody.counterAxisAlignItems = "CENTER";
      loadingBody.itemSpacing = 12;
      loadingBody.paddingLeft = 20;
      loadingBody.paddingRight = withClose ? 46 : 20;
      loadingBody.paddingTop = 12;
      loadingBody.paddingBottom = 12;
      loadingBody.fills = [];

      var loaderW = 18;
      if (loaderSource) {
        var loaderInst = loaderSource.createInstance();
        loaderInst.name = "loader";
        try {
          var lw = loaderSource.width;
          var lh = loaderSource.height;
          var target = 22;
          var scale = target / Math.max(lw || 72, lh || 56);
          loaderInst.resize(
            Math.max(1, Math.round((lw || 72) * scale)),
            Math.max(1, Math.round((lh || 56) * scale))
          );
        } catch (eLoaderResize) {}
        loaderW = loaderInst.width;
        try {
          loaderInst.layoutGrow = 0;
          loaderInst.layoutSizingHorizontal = "FIXED";
          loaderInst.layoutSizingVertical = "FIXED";
        } catch (eLoaderLayout) {}
        bindLoaderGraphicNodesToLoaderColor(loaderInst, varMap);
        loadingBody.appendChild(loaderInst);
      } else {
        var loaderNode = figma.createEllipse();
        loaderNode.name = "loader";
        loaderNode.resize(18, 18);
        loaderW = 18;
        loaderNode.strokeAlign = "CENTER";
        loaderNode.arcData = { startingAngle: 0, endingAngle: Math.PI * 1.55, innerRadius: 0.72 };
        loaderNode.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
        loaderNode.strokes = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
        loaderNode.strokeWeight = Math.max(2, Math.round(18 * 0.14));
        loaderNode.cornerRadius = resolveCompFloat("loader/oval-corner-radius-sm", 0);
        bindVar(loaderNode, "strokeWeight", varMap["loader/stroke-width-sm"]);
        if (varMap["loader/color"]) {
          bindPaintVar(loaderNode, "fills", 0, varMap["loader/color"]);
          bindPaintVar(loaderNode, "strokes", 0, varMap["loader/color"]);
        } else if (notificationResolvedVar(varMap, "icon", colorTone)) {
          var nIconL = notificationResolvedVar(varMap, "icon", colorTone);
          bindPaintVar(loaderNode, "fills", 0, nIconL);
          bindPaintVar(loaderNode, "strokes", 0, nIconL);
        }
        loadingBody.appendChild(loaderNode);
      }

      var padL = 20;
      var padR = withClose ? 46 : 20;
      var rowGap = 12;
      var loadColW = Math.max(
        160,
        Math.floor(360 - padL - padR - rowGap - loaderW)
      );

      var textColumn = figma.createFrame();
      textColumn.name = "content";
      textColumn.layoutMode = "VERTICAL";
      textColumn.primaryAxisSizingMode = "AUTO";
      textColumn.counterAxisSizingMode = "FIXED";
      textColumn.primaryAxisAlignItems = "MIN";
      textColumn.counterAxisAlignItems = "MIN";
      textColumn.itemSpacing = 4;
      textColumn.fills = [];
      textColumn.resize(loadColW, 40);

      var titleNode = figma.createText();
      titleNode.name = "title";
      titleNode.fontName = font;
      titleNode.characters = "We notify you that";
      titleNode.fontSize = 14;
      titleNode.textAutoResize = "HEIGHT";
      titleNode.textAlignHorizontal = "LEFT";
      titleNode.resize(loadColW, titleNode.height);
      titleNode.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
      var nTitleL = notificationResolvedVar(varMap, "title", colorTone);
      if (nTitleL) bindPaintVar(titleNode, "fills", 0, nTitleL);
      if (varMap["notification/title-font-size"]) bindVar(titleNode, "fontSize", varMap["notification/title-font-size"]);
      bindVar(titleNode, "fontFamily", varMap["notification/title-font-family"]);
      bindVar(titleNode, "fontStyle", varMap["notification/title-font-weight"]);
      bindVar(titleNode, "lineHeight", varMap["notification/title-line-height"]);
      try {
        titleNode.layoutSizingHorizontal = "FIXED";
        titleNode.layoutSizingVertical = "HUG";
        titleNode.layoutGrow = 0;
      } catch (eTitleLayout) {}
      textColumn.appendChild(titleNode);

      var descNode = figma.createText();
      descNode.name = "description";
      descNode.fontName = font;
      descNode.characters = "You are now obligated to give a star to Mantine project on GitHub";
      descNode.fontSize = 13;
      descNode.textAutoResize = "HEIGHT";
      descNode.textAlignHorizontal = "LEFT";
      descNode.resize(loadColW, descNode.height);
      descNode.fills = [{ type: "SOLID", color: { r: 0.35, g: 0.37, b: 0.4 } }];
      var nDescL = notificationResolvedVar(varMap, "description", colorTone);
      if (nDescL) bindPaintVar(descNode, "fills", 0, nDescL);
      if (varMap["notification/description-font-size"]) bindVar(descNode, "fontSize", varMap["notification/description-font-size"]);
      bindVar(descNode, "fontFamily", varMap["notification/description-font-family"]);
      bindVar(descNode, "fontStyle", varMap["notification/description-font-weight"]);
      bindVar(descNode, "lineHeight", varMap["notification/description-line-height"]);
      try {
        descNode.layoutSizingHorizontal = "FIXED";
        descNode.layoutSizingVertical = "HUG";
        descNode.layoutGrow = 0;
      } catch (eDescLayout) {}
      textColumn.appendChild(descNode);

      try {
        textColumn.layoutSizingHorizontal = "FIXED";
        textColumn.layoutSizingVertical = "HUG";
      } catch (eColLayout) {}
      loadingBody.appendChild(textColumn);

      comp.appendChild(loadingBody);

      appendNotificationCloseControl();
    } else {
      var accent = figma.createRectangle();
      accent.name = "accent";
      accent.resize(6, 94);
      accent.x = 8;
      accent.y = 8;
      accent.cornerRadius = 3;
      accent.visible = hasAccent;
      accent.fills = [{ type: "SOLID", color: { r: 0.2, g: 0.53, b: 0.87 } }];
      if (indicatorVar) bindPaintVar(accent, "fills", 0, indicatorVar);
      else if (notificationResolvedVar(varMap, "accent", colorTone))
        bindPaintVar(accent, "fills", 0, notificationResolvedVar(varMap, "accent", colorTone));
      else if (notificationResolvedVar(varMap, "icon", colorTone))
        bindPaintVar(accent, "fills", 0, notificationResolvedVar(varMap, "icon", colorTone));
      comp.appendChild(accent);

      if (withIcon) {
        var iconSource = notificationIcons.leading || notificationIcons.fallback;
        var iconX = hasAccent ? 24 : 16;
        if (iconSource) {
          var iconInst = iconSource.createInstance();
          iconInst.name = "icon";
          try { iconInst.resize(16, 16); } catch (eIconResize) {}
          iconInst.x = iconX;
          iconInst.y = 14;
          bindNotificationIconTokenVectors(iconInst, varMap);
          comp.appendChild(iconInst);
        } else {
          var iconFallback = figma.createEllipse();
          iconFallback.name = "icon";
          iconFallback.resize(14, 14);
          iconFallback.x = iconX;
          iconFallback.y = 16;
          iconFallback.fills = [{ type: "SOLID", color: { r: 0.2, g: 0.53, b: 0.87 } }];
          var nIconF = notificationResolvedVar(varMap, "icon", colorTone);
          if (nIconF) bindPaintVar(iconFallback, "fills", 0, nIconF);
          comp.appendChild(iconFallback);
        }
      }

      var textLeft = hasAccent ? (withIcon ? 48 : 24) : (withIcon ? 40 : 16);
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
      var nTitle = notificationResolvedVar(varMap, "title", colorTone);
      if (nTitle) bindPaintVar(titleNode, "fills", 0, nTitle);
      if (varMap["notification/title-font-size"]) bindVar(titleNode, "fontSize", varMap["notification/title-font-size"]);
      bindVar(titleNode, "fontFamily", varMap["notification/title-font-family"]);
      bindVar(titleNode, "fontStyle", varMap["notification/title-font-weight"]);
      bindVar(titleNode, "lineHeight", varMap["notification/title-line-height"]);
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
      var nDesc = notificationResolvedVar(varMap, "description", colorTone);
      if (nDesc) bindPaintVar(descNode, "fills", 0, nDesc);
      if (varMap["notification/description-font-size"]) bindVar(descNode, "fontSize", varMap["notification/description-font-size"]);
      bindVar(descNode, "fontFamily", varMap["notification/description-font-family"]);
      bindVar(descNode, "fontStyle", varMap["notification/description-font-weight"]);
      bindVar(descNode, "lineHeight", varMap["notification/description-line-height"]);
      comp.appendChild(descNode);

      appendNotificationCloseControl();
    }

    comp.x = layout.colIndex * (colWidth + gap);
    comp.y = layout.rowIndex * (rowHeight + gap);

    page.appendChild(comp);
    targetComponents.push(comp);
  }

  var components = [];
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
            for (var ai = 0; ai < accentStates.length; ai++) {
              var withAccent = accentStates[ai] === "on";
              for (var ti = 0; ti < colorTones.length; ti++) {
                var colorTone = colorTones[ti];
                var capTone = colorTone.charAt(0).toUpperCase() + colorTone.slice(1);
                var compNameDefault =
                  "Radius=" +
                  capRadius +
                  ", Border=" +
                  borderStates[bi] +
                  ", Close=" +
                  closeStates[ci] +
                  ", Icon=" +
                  iconStates[ii] +
                  ", Loading=" +
                  loadingStates[li] +
                  ", Accent=" +
                  accentStates[ai] +
                  ", Color=" +
                  capTone;
                var colIndexDefault = ri * borderStates.length + bi;
                var rowIndexDefault =
                  (((ci * iconStates.length + ii) * loadingStates.length + li) * accentStates.length + ai) *
                    colorTones.length +
                  ti;
                appendNotificationVariant(
                  components,
                  { colIndex: colIndexDefault, rowIndex: rowIndexDefault },
                  {
                    radius: radius,
                    withBorder: withBorder,
                    withClose: withClose,
                    withIcon: withIcon,
                    isLoading: isLoading,
                    withAccent: withAccent,
                    colorTone: colorTone,
                    compName: compNameDefault,
                  }
                );
              }
            }
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
    return String(str || "")
      .split("-")
      .map(function(part) { return part.charAt(0).toUpperCase() + part.slice(1); })
      .join("-");
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
              var warningVectors = warningInst.findAll(function(n) { return n.type === "VECTOR"; });
              for (var wvi = 0; wvi < warningVectors.length; wvi++) {
                bindVar(warningVectors[wvi], "strokeWeight", varMap["alert/icon-stroke-width"]);
              }
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
          bindVar(titleNode, "fontFamily", varMap["alert/title-font-family"]);
          bindVar(titleNode, "fontStyle", varMap["alert/title-font-weight"]);
          bindVar(titleNode, "lineHeight", varMap["alert/title-line-height"]);
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
          bindVar(messageNode, "fontFamily", varMap["alert/message-font-family"]);
          bindVar(messageNode, "fontStyle", varMap["alert/message-font-weight"]);
          bindVar(messageNode, "lineHeight", varMap["alert/message-line-height"]);
          messageWrap.appendChild(messageNode);

          if (withClose) {
            var closeSource = alertIcons.close || alertIcons.fallback;
            if (closeSource) {
              var closeInst = closeSource.createInstance();
              closeInst.name = "close";
              try { closeInst.resize(16, 16); } catch (e) {}
              var closeVectors = closeInst.findAll(function(n) { return n.type === "VECTOR"; });
              for (var cvi = 0; cvi < closeVectors.length; cvi++) {
                bindVar(closeVectors[cvi], "strokeWeight", varMap["alert/icon-stroke-width"]);
              }
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
  var sizes = ["default", "xs", "sm", "md", "lg", "xl"];
  var radii = ["default", "xs", "sm", "md", "lg", "xl"];
  var overlayStates = ["off", "on"];
  var closeStates = ["off", "on"];
  var layouts = ["action-right", "basic", "centered-arch"];
  var components = [];
  var headerOnly = false;
  var buttonSet = sourceSets && sourceSets.buttonSet ? sourceSets.buttonSet : null;
  var titleSet = sourceSets && sourceSets.titleSet ? sourceSets.titleSet : null;
  var textSet = sourceSets && sourceSets.textSet ? sourceSets.textSet : null;
  var useLinkedTextComponents = false;
  var modalTitleCopy = "Modal Title";
  var modalBodyCopy = "This action cannot be undone. Please confirm you want to proceed.";
  var headerPaddingXVar = varMap["modal/header-padding-x"] || varMap["modal/padding-x"];
  var headerPaddingYVar = varMap["modal/header-padding-y"] || varMap["modal/padding-y"];
  var bodyPaddingTopVar = varMap["modal/body-padding-top"] || null;
  var bodyPaddingRightVar = varMap["modal/body-padding-right"] || varMap["modal/padding-x"];
  var bodyPaddingBottomVar = varMap["modal/body-padding-bottom"] || varMap["modal/padding-y"];
  var bodyPaddingLeftVar = varMap["modal/body-padding-left"] || varMap["modal/padding-x"];
  var footerPaddingXVar = varMap["modal/footer-padding-x"] || varMap["modal/padding-x"];
  var footerPaddingYVar = varMap["modal/footer-padding-y"] || varMap["modal/padding-y"];

  var widthBySize = { default: 420, xs: 280, sm: 340, md: 420, lg: 520, xl: 640 };
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

  var titleVariant = findVariantComponent(titleSet, { Order: "4", Size: "H4" });
  var bodyTextVariant = findVariantComponent(textSet, { Size: "Default", Weight: "Regular", Color: "Default" });
  var cancelButtonVariant = findVariantComponent(buttonSet, { Variant: "Outlined", Size: "Default", State: "Default" });
  var confirmButtonVariant = findVariantComponent(buttonSet, { Variant: "Filled", Size: "Default", State: "Default" });
  var alertIcons = await findAlertIconComponents();
  var modalCloseIconSource = alertIcons.close || alertIcons.fallback;

  for (var si = 0; si < sizes.length; si++) {
    var size = sizes[si];
    var capSize = size === "default" ? "Default" : size.toUpperCase();
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
            var capLayout = cap(layout);
            var isCenteredArch = layout === "centered-arch";

            var comp = figma.createComponent();
            comp.name =
              "Size=" + capSize +
              ", Radius=" + capRadius +
              ", Overlay=" + capOverlay +
              ", Close=" + capClose +
              ", Layout=" + capLayout;
            comp.layoutMode = "VERTICAL";
            comp.primaryAxisSizingMode = "AUTO";
            comp.counterAxisSizingMode = "FIXED";
            comp.counterAxisAlignItems = "MIN";
            comp.itemSpacing = 0;
            comp.resize(panelW, 200);
            try { comp.layoutSizingVertical = "HUG"; } catch (_modalHugErr) {}
            comp.fills = [{ type: "SOLID", color: { r: 0.14, g: 0.15, b: 0.24 } }];
            comp.strokes = [{ type: "SOLID", color: { r: 0.22, g: 0.24, b: 0.34 } }];
            comp.strokeWeight = 1;
            comp.strokeAlign = "INSIDE";
            comp.cornerRadius = 4;
            comp.clipsContent = true;
            bindVar(comp, "minWidth", varMap["modal/width-" + size]);
            bindVar(comp, "maxWidth", varMap["modal/width-" + size]);
            bindPaintVar(comp, "fills", 0, varMap["modal/background"]);
            bindPaintVar(comp, "strokes", 0, varMap["modal/border"]);
            bindVar(comp, "strokeWeight", varMap["modal/border-width"]);
            bindVar(comp, "topLeftRadius", varMap["modal/radius-" + radius]);
            bindVar(comp, "topRightRadius", varMap["modal/radius-" + radius]);
            bindVar(comp, "bottomLeftRadius", varMap["modal/radius-" + radius]);
            bindVar(comp, "bottomRightRadius", varMap["modal/radius-" + radius]);

            var header = figma.createFrame();
            header.name = "header";
            header.layoutMode = "HORIZONTAL";
            header.primaryAxisSizingMode = "FIXED";
            header.counterAxisSizingMode = "AUTO";
            header.primaryAxisAlignItems = isCenteredArch ? "MIN" : "SPACE_BETWEEN";
            header.counterAxisAlignItems = "CENTER";
            header.resize(panelW, isCenteredArch ? 48 : 44);
            header.paddingLeft = 16;
            header.paddingRight = 16;
            header.paddingTop = 12;
            header.paddingBottom = 12;
            header.fills = [{ type: "SOLID", color: { r: 0.14, g: 0.15, b: 0.24 } }];
            header.strokes = [];
            bindVar(header, "paddingLeft", headerPaddingXVar);
            bindVar(header, "paddingRight", headerPaddingXVar);
            bindVar(header, "paddingTop", headerPaddingYVar);
            bindVar(header, "paddingBottom", headerPaddingYVar);
            bindPaintVar(header, "fills", 0, varMap["modal/background"]);
            if (isCenteredArch) {
              var leftCloseSpacer = figma.createFrame();
              leftCloseSpacer.name = "close-spacer";
              leftCloseSpacer.layoutMode = "NONE";
              leftCloseSpacer.resize(16, 16);
              leftCloseSpacer.fills = [];
              header.appendChild(leftCloseSpacer);
            }

            var titleNode = null;
            if (titleVariant && useLinkedTextComponents) {
              titleNode = titleVariant.createInstance();
              titleNode.name = "title";
              try { await setNamedText(titleNode, "title", modalTitleCopy); } catch (_modalTitleNamedTitleErr) {}
              try { await setNamedText(titleNode, "text", modalTitleCopy); } catch (_modalTitleNamedTextErr) {}
              try { await setNamedText(titleNode, "Content", modalTitleCopy); } catch (_modalTitleNamedContentErr) {}
              try { await setNamedText(titleNode, "Contents", modalTitleCopy); } catch (_modalTitleNamedContentsErr) {}
              try {
                titleNode.resize(Math.max(120, panelW - (withClose ? 88 : 32)), titleNode.height);
              } catch (e) {}
              try {
                titleNode.layoutSizingVertical = "HUG";
              } catch (_layoutErr) {}
            } else {
              titleNode = figma.createText();
              titleNode.name = "title";
              titleNode.fontName = font;
              titleNode.characters = modalTitleCopy;
              titleNode.fontSize = 18;
              titleNode.textAutoResize = "HEIGHT";
              titleNode.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
              bindPaintVar(titleNode, "fills", 0, varMap["modal/title"]);
              bindVar(titleNode, "fontSize", varMap["modal/title-font-size"]);
              bindVar(titleNode, "fontFamily", varMap["modal/title-font-family"]);
              bindVar(titleNode, "fontStyle", varMap["modal/title-font-weight"]);
              bindVar(titleNode, "lineHeight", varMap["modal/title-line-height"]);
            }
            if (isCenteredArch) {
              try {
                if (titleNode.type === "TEXT") {
                  titleNode.textAutoResize = "WIDTH_AND_HEIGHT";
                } else {
                  titleNode.layoutGrow = 0;
                  titleNode.layoutAlign = "CENTER";
                  try { titleNode.layoutSizingHorizontal = "HUG"; } catch (_centeredTitleHugWidthErr) {}
                  try { titleNode.layoutSizingVertical = "HUG"; } catch (_centeredTitleHugHeightErr) {}
                }
              } catch (_centeredTitleHugErr) {}
              var centeredTitleSlot = figma.createFrame();
              centeredTitleSlot.name = "title-slot";
              centeredTitleSlot.layoutMode = "HORIZONTAL";
              centeredTitleSlot.primaryAxisSizingMode = "FIXED";
              centeredTitleSlot.counterAxisSizingMode = "AUTO";
              centeredTitleSlot.primaryAxisAlignItems = "CENTER";
              centeredTitleSlot.counterAxisAlignItems = "CENTER";
              centeredTitleSlot.layoutGrow = 1;
              centeredTitleSlot.fills = [];
              centeredTitleSlot.strokes = [];
              centeredTitleSlot.resize(Math.max(1, panelW - 72), 24);
              centeredTitleSlot.appendChild(titleNode);
              header.appendChild(centeredTitleSlot);
            } else {
              titleNode.layoutGrow = 1;
              titleNode.layoutAlign = "STRETCH";
              try { titleNode.layoutSizingHorizontal = "FILL"; } catch (_modalTitleFillErr) {}
              header.appendChild(titleNode);
            }

            if (withClose) {
              if (modalCloseIconSource) {
                var closeIconInst = modalCloseIconSource.createInstance();
                closeIconInst.name = "close";
                try { closeIconInst.resize(16, 16); } catch (e) {}
                var modalCloseNodes = closeIconInst.findAll(function(n) {
                  return (
                    n.type === "VECTOR" ||
                    n.type === "ELLIPSE" ||
                    n.type === "RECTANGLE" ||
                    n.type === "POLYGON" ||
                    n.type === "STAR" ||
                    n.type === "LINE"
                  );
                });
                for (var mcvi = 0; mcvi < modalCloseNodes.length; mcvi++) {
                  var modalCloseNode = modalCloseNodes[mcvi];
                  if (modalCloseNode.strokes && modalCloseNode.strokes.length > 0) {
                    bindPaintVar(modalCloseNode, "strokes", 0, varMap["modal/close"]);
                    bindVar(modalCloseNode, "strokeWeight", varMap["modal/close-icon-stroke-width"]);
                  }
                  if (modalCloseNode.fills && modalCloseNode.fills.length > 0) {
                    bindPaintVar(modalCloseNode, "fills", 0, varMap["modal/close"]);
                  }
                }
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
            } else if (isCenteredArch) {
              var rightCloseSpacer = figma.createFrame();
              rightCloseSpacer.name = "close-spacer";
              rightCloseSpacer.layoutMode = "NONE";
              rightCloseSpacer.resize(16, 16);
              rightCloseSpacer.fills = [];
              header.appendChild(rightCloseSpacer);
            }
            comp.appendChild(header);

            if (!headerOnly) {
              var bodyWrap = figma.createFrame();
              bodyWrap.name = "body-wrap";
              bodyWrap.layoutMode = "HORIZONTAL";
              bodyWrap.primaryAxisSizingMode = "FIXED";
              bodyWrap.counterAxisSizingMode = "AUTO";
              bodyWrap.primaryAxisAlignItems = "MIN";
              bodyWrap.counterAxisAlignItems = "CENTER";
              bodyWrap.resize(panelW, 1);
              try { bodyWrap.layoutSizingVertical = "HUG"; } catch (_modalBodyHugErr) {}
              bodyWrap.paddingLeft = 16;
              bodyWrap.paddingRight = 16;
              bodyWrap.paddingBottom = 12;
              bodyWrap.itemSpacing = 0;
              bodyWrap.fills = [{ type: "SOLID", color: { r: 0.14, g: 0.15, b: 0.24 } }];
              bodyWrap.strokes = [];
              bindVar(bodyWrap, "paddingTop", bodyPaddingTopVar);
              bindVar(bodyWrap, "paddingRight", bodyPaddingRightVar);
              bindVar(bodyWrap, "paddingBottom", bodyPaddingBottomVar);
              bindVar(bodyWrap, "paddingLeft", bodyPaddingLeftVar);
              bindPaintVar(bodyWrap, "fills", 0, varMap["modal/background"]);
              comp.appendChild(bodyWrap);

              var bodyNode = null;
              if (bodyTextVariant && useLinkedTextComponents) {
                bodyNode = bodyTextVariant.createInstance();
                bodyNode.name = "body";
                try {
                  if (bodyNode.componentProperties && typeof bodyNode.setProperties === "function") {
                    var bodyTextPropPatch = {};
                    var bodyPropKeys = Object.keys(bodyNode.componentProperties);
                    for (var bpi = 0; bpi < bodyPropKeys.length; bpi++) {
                      var bodyPropKey = bodyPropKeys[bpi];
                      var bodyPropMeta = bodyNode.componentProperties[bodyPropKey];
                      if (bodyPropMeta && bodyPropMeta.type === "TEXT") {
                        bodyTextPropPatch[bodyPropKey] = modalBodyCopy;
                      }
                    }
                    if (Object.keys(bodyTextPropPatch).length > 0) {
                      bodyNode.setProperties(bodyTextPropPatch);
                    }
                  }
                } catch (_modalBodyTextOverrideErr) {}
                try { await setNamedText(bodyNode, "text", modalBodyCopy); } catch (_modalBodyNamedTextErr) {}
                try { await setNamedText(bodyNode, "Content", modalBodyCopy); } catch (_modalBodyNamedContentErr) {}
                try { await setNamedText(bodyNode, "Contents", modalBodyCopy); } catch (_modalBodyNamedContentsErr) {}
                try {
                  bodyNode.resize(panelW - 32, 58);
                } catch (e) {}
              } else {
                bodyNode = figma.createText();
                bodyNode.name = "body";
                bodyNode.fontName = font;
                bodyNode.characters = modalBodyCopy;
                bodyNode.fontSize = 12;
                bodyNode.textAutoResize = "HEIGHT";
                bodyNode.resize(panelW - 32, bodyNode.height);
                bodyNode.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
                bindPaintVar(bodyNode, "fills", 0, varMap["modal/body"]);
                bindVar(bodyNode, "fontSize", varMap["modal/body-font-size"]);
                bindVar(bodyNode, "fontFamily", varMap["modal/body-font-family"]);
                bindVar(bodyNode, "fontStyle", varMap["modal/body-font-weight"]);
                bindVar(bodyNode, "lineHeight", varMap["modal/body-line-height"]);
              }
              bodyWrap.appendChild(bodyNode);

              if (layout === "action-right" || layout === "centered-arch") {
              var actionRow = figma.createFrame();
              actionRow.name = "actions";
              actionRow.layoutMode = "HORIZONTAL";
              actionRow.primaryAxisSizingMode = "FIXED";
              actionRow.counterAxisSizingMode = "AUTO";
              actionRow.primaryAxisAlignItems = layout === "centered-arch" ? "SPACE_BETWEEN" : "MAX";
              actionRow.counterAxisAlignItems = "CENTER";
              actionRow.itemSpacing = 12;
              actionRow.resize(panelW, 58);
              actionRow.paddingLeft = 16;
              actionRow.paddingRight = 16;
              actionRow.paddingTop = 12;
              actionRow.paddingBottom = 12;
              actionRow.fills = [{ type: "SOLID", color: { r: 0.14, g: 0.15, b: 0.24 } }];
              actionRow.strokes = [];
              bindVar(actionRow, "paddingLeft", footerPaddingXVar);
              bindVar(actionRow, "paddingRight", footerPaddingXVar);
              bindVar(actionRow, "paddingTop", footerPaddingYVar);
              bindVar(actionRow, "paddingBottom", footerPaddingYVar);
              bindPaintVar(actionRow, "fills", 0, varMap["modal/background"]);
              comp.appendChild(actionRow);

              if (cancelButtonVariant && confirmButtonVariant) {
                var cancelBtnInstance = cancelButtonVariant.createInstance();
                cancelBtnInstance.name = "Cancel";
                actionRow.appendChild(cancelBtnInstance);

                var yesBtnInstance = confirmButtonVariant.createInstance();
                yesBtnInstance.name = "Submit";
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
                yesBtn.name = "Submit";
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
                yesTxt.characters = "Submit";
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
              divider.y = comp.height - 56;
              comp.appendChild(divider);

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
              comp.appendChild(footer);

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

async function collectFigmaIconCandidates() {
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

  return iconCandidates;
}

function normalizeIconCandidateName(name) {
  return String(name || "").toLowerCase().replace(/[\s_\-\/]+/g, "");
}

async function findAlertIconComponents() {
  var iconCandidates = await collectFigmaIconCandidates();

  function pickBest(target) {
    if (!iconCandidates.length) return null;
    var scored = [];
    for (var j = 0; j < iconCandidates.length; j++) {
      var raw = String(iconCandidates[j].name || "").toLowerCase();
      var n = normalizeIconCandidateName(raw);
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

async function findNotificationIconComponents() {
  var iconCandidates = await collectFigmaIconCandidates();

  function pickBestLeading() {
    if (!iconCandidates.length) return null;
    var scored = [];
    for (var j = 0; j < iconCandidates.length; j++) {
      var raw = String(iconCandidates[j].name || "").toLowerCase();
      var n = normalizeIconCandidateName(raw);
      var score = 0;
      if (n.indexOf("messagenotification") >= 0) score += 120;
      if (n.indexOf("notificationmessage") >= 0) score += 115;
      if (n.indexOf("notificationbox") >= 0) score += 110;
      if (n.indexOf("notificationtext") >= 0) score += 105;
      if (n.indexOf("notification") >= 0 && n.indexOf("message") >= 0) score += 95;
      if (n.indexOf("notification") >= 0) score += 80;
      if (n.indexOf("bell") >= 0) score += 75;
      if (n.indexOf("megaphone") >= 0) score += 50;
      if (n.indexOf("alertcircle") >= 0) score += 40;
      if (n.indexOf("infocircle") >= 0) score += 38;
      if (n.indexOf("info") >= 0) score += 35;
      if (n.indexOf("alerttriangle") >= 0) score += 25;
      if (raw.indexOf("icon") >= 0 || raw.indexOf("line") >= 0) score += 10;
      if (score > 0) scored.push({ comp: iconCandidates[j], score: score });
    }
    if (!scored.length) return null;
    scored.sort(function(a, b) { return b.score - a.score; });
    return scored[0].comp;
  }

  function pickBestClose() {
    if (!iconCandidates.length) return null;
    var scored = [];
    for (var jc = 0; jc < iconCandidates.length; jc++) {
      var rawC = String(iconCandidates[jc].name || "").toLowerCase();
      var nc = normalizeIconCandidateName(rawC);
      var scoreC = 0;
      if (nc.indexOf("xclose") >= 0) scoreC += 100;
      if (nc.indexOf("close") >= 0) scoreC += 70;
      if (nc.indexOf("x") >= 0) scoreC += 15;
      if (rawC.indexOf("icon") >= 0 || rawC.indexOf("line") >= 0) scoreC += 10;
      if (scoreC > 0) scored.push({ comp: iconCandidates[jc], score: scoreC });
    }
    if (!scored.length) return null;
    scored.sort(function (a, b) {
      return b.score - a.score;
    });
    return scored[0].comp;
  }

  var leadingIcon = pickBestLeading();
  var closeIcon = pickBestClose();
  var fallbackIcon = iconCandidates.length
    ? iconCandidates.slice().sort(function(a, b) { return a.name.localeCompare(b.name); })[0]
    : null;

  return { leading: leadingIcon, close: closeIcon, fallback: fallbackIcon };
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
        bindVar(textNode, "fontFamily", varMap["tooltip/font-family"]);
        bindVar(textNode, "fontStyle", varMap["tooltip/font-weight"]);
        bindVar(textNode, "lineHeight", varMap["tooltip/line-height"]);
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
// Popover Component Set
// ---------------------------------------------------------------------------

function buildPopoverComponentSet(varMap, page, font) {
  var directions = ["top", "bottom", "left", "right"];
  var arrowStates = ["with-arrow", "without-arrow"];
  var components = [];
  var gap = 16;
  var colWidth = 170;
  var rowHeight = 70;
  var fallbackArrowSize = 8;

  for (var di = 0; di < directions.length; di++) {
    for (var ai = 0; ai < arrowStates.length; ai++) {
      var direction = directions[di];
      var hasArrow = arrowStates[ai] === "with-arrow";
      var isVertical = direction === "top" || direction === "bottom";
      var capDirection = direction.charAt(0).toUpperCase() + direction.slice(1);
      var capArrow = hasArrow ? "WithArrow" : "WithoutArrow";

      var comp = figma.createComponent();
      comp.name = "Direction=" + capDirection + ", Arrow=" + capArrow;
      comp.layoutMode = isVertical ? "VERTICAL" : "HORIZONTAL";
      comp.primaryAxisAlignItems = "CENTER";
      comp.counterAxisAlignItems = "CENTER";
      comp.primaryAxisSizingMode = "AUTO";
      comp.counterAxisSizingMode = "AUTO";
      comp.itemSpacing = 0;
      comp.fills = [];

      var body = figma.createFrame();
      body.name = "body";
      body.layoutMode = "HORIZONTAL";
      body.primaryAxisAlignItems = "CENTER";
      body.counterAxisAlignItems = "CENTER";
      body.primaryAxisSizingMode = "FIXED";
      body.counterAxisSizingMode = "AUTO";
      body.itemSpacing = 0;
      body.paddingTop = 10;
      body.paddingBottom = 10;
      body.paddingLeft = 12;
      body.paddingRight = 12;
      body.resize(280, 38);
      body.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
      body.strokes = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
      body.strokeAlign = "INSIDE";
      body.cornerRadius = 8;

      var bgVar = varMap["popover/background"];
      var borderVar = varMap["popover/border"];
      var textVar = varMap["popover/text"];
      var arrowVar = varMap["popover/arrow"] || bgVar;
      var widthVar = varMap["popover/width-default"];
      var radiusVar = varMap["popover/radius-default"];
      var padXVar = varMap["popover/padding-x"];
      var padYVar = varMap["popover/padding-y"];
      var borderWidthVar = varMap["popover/border-width"];
      var arrowSizeVar = varMap["popover/arrow-size"];
      if (bgVar) bindPaintVar(body, "fills", 0, bgVar);
      if (borderVar) bindPaintVar(body, "strokes", 0, borderVar);
      if (widthVar) bindVar(body, "width", widthVar);
      if (radiusVar) {
        bindVar(body, "topLeftRadius", radiusVar);
        bindVar(body, "topRightRadius", radiusVar);
        bindVar(body, "bottomLeftRadius", radiusVar);
        bindVar(body, "bottomRightRadius", radiusVar);
      }
      if (padXVar) {
        bindVar(body, "paddingLeft", padXVar);
        bindVar(body, "paddingRight", padXVar);
      }
      if (padYVar) {
        bindVar(body, "paddingTop", padYVar);
        bindVar(body, "paddingBottom", padYVar);
      }
      if (borderWidthVar) bindVar(body, "strokeWeight", borderWidthVar);

      var textNode = figma.createText();
      textNode.fontName = font;
      textNode.characters = "Additional context and actions can live here.";
      textNode.fontSize = 13;
      textNode.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
      if (textVar) bindPaintVar(textNode, "fills", 0, textVar);
      if (varMap["popover/text-font-size"]) {
        bindVar(textNode, "fontSize", varMap["popover/text-font-size"]);
        bindVar(textNode, "fontFamily", varMap["popover/text-font-family"]);
        bindVar(textNode, "fontStyle", varMap["popover/text-font-weight"]);
        bindVar(textNode, "lineHeight", varMap["popover/text-line-height"]);
      }
      body.appendChild(textNode);

      var arrow = null;
      if (hasArrow) {
        arrow = figma.createVector();
        arrow.name = "arrow";
        var half = fallbackArrowSize / 2;
        if (direction === "top") {
          arrow.vectorPaths = [{ windingRule: "NONZERO", data: "M 0 0 L " + half + " " + half + " L " + fallbackArrowSize + " 0 Z" }];
          arrow.resize(fallbackArrowSize, half);
        } else if (direction === "bottom") {
          arrow.vectorPaths = [{ windingRule: "NONZERO", data: "M 0 " + half + " L " + half + " 0 L " + fallbackArrowSize + " " + half + " Z" }];
          arrow.resize(fallbackArrowSize, half);
        } else if (direction === "left") {
          arrow.vectorPaths = [{ windingRule: "NONZERO", data: "M 0 0 L " + half + " " + half + " L 0 " + fallbackArrowSize + " Z" }];
          arrow.resize(half, fallbackArrowSize);
        } else {
          arrow.vectorPaths = [{ windingRule: "NONZERO", data: "M " + half + " 0 L 0 " + half + " L " + half + " " + fallbackArrowSize + " Z" }];
          arrow.resize(half, fallbackArrowSize);
        }
        arrow.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
        arrow.strokes = [];
        if (arrowVar) bindPaintVar(arrow, "fills", 0, arrowVar);
        if (arrowSizeVar) {
          if (direction === "top" || direction === "bottom") bindVar(arrow, "width", arrowSizeVar);
          else bindVar(arrow, "height", arrowSizeVar);
        }
      }

      if (direction === "bottom" || direction === "right") {
        if (arrow) comp.appendChild(arrow);
        comp.appendChild(body);
      } else {
        comp.appendChild(body);
        if (arrow) comp.appendChild(arrow);
      }

      comp.x = ai * (colWidth + gap);
      comp.y = di * (rowHeight + gap);
      page.appendChild(comp);
      components.push(comp);
    }
  }

  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Popover";
  return componentSet;
}

async function findMenuIconComponents() {
  var result = { check: null, plus: null, alert: null, fallback: null, candidates: [] };
  var iconPages = [];
  for (var i = 0; i < figma.root.children.length; i++) {
    var p = figma.root.children[i];
    if (p.type === "PAGE" && String(p.name || "").toLowerCase() === "icons") iconPages.push(p);
  }
  if (iconPages.length === 0) iconPages = figma.root.children.filter(function (p) { return p.type === "PAGE"; });

  for (var pi = 0; pi < iconPages.length; pi++) {
    var pageNode = iconPages[pi];
    try { if (typeof pageNode.loadAsync === "function") await pageNode.loadAsync(); } catch (_e) {}
    if (!pageNode || typeof pageNode.findAll !== "function") continue;
    var nodes = [];
    try {
      nodes = pageNode.findAll(function (n) {
        return n.type === "COMPONENT" || n.type === "COMPONENT_SET";
      });
    } catch (_scanErr) {
      nodes = [];
    }
    for (var ni = 0; ni < nodes.length; ni++) {
      var node = nodes[ni];
      if (node.type === "COMPONENT") {
        result.candidates.push(node);
      } else if (node.type === "COMPONENT_SET" && node.children && node.children.length > 0) {
        for (var ci = 0; ci < node.children.length; ci++) {
          if (node.children[ci].type === "COMPONENT") result.candidates.push(node.children[ci]);
        }
      }
    }
  }

  function pickByName(matchers) {
    for (var i = 0; i < result.candidates.length; i++) {
      var n = String(result.candidates[i].name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      for (var m = 0; m < matchers.length; m++) {
        if (n.indexOf(matchers[m]) >= 0) return result.candidates[i];
      }
    }
    return null;
  }

  result.check = pickByName(["check", "checkcircle"]);
  result.plus = pickByName(["plus", "add"]);
  result.alert = pickByName(["alerttriangle", "alert", "warningtriangle", "warning"]);
  if (!result.fallback) {
    result.fallback = result.check || result.plus || result.alert || (result.candidates.length > 0 ? result.candidates[0] : null);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Menu Component Set
// ---------------------------------------------------------------------------

async function buildMenuComponentSet(varMap, page, font) {
  var states = ["default", "hover", "disabled"];
  var sectionModes = ["on", "off"];
  var iconModes = ["on", "off"];
  var components = [];
  var gap = 24;
  var colWidth = 280;
  var rowHeight = 210;
  var iconComponents = await findMenuIconComponents();

  function itemBgVarForState(state) {
    if (state === "hover") return varMap["menu/item-background-hover"];
    if (state === "disabled") return varMap["menu/item-background-disabled"];
    return varMap["menu/item-background"];
  }

  function menuBgVarForState(state) {
    if (state === "disabled") return varMap["menu/background-disabled"] || varMap["menu/background"];
    return varMap["menu/background"];
  }

  function menuBorderVarForState(state) {
    if (state === "disabled") return varMap["menu/border-disabled"] || varMap["menu/border"];
    return varMap["menu/border"];
  }

  function menuDividerVarForState(state) {
    if (state === "disabled") return varMap["menu/divider-disabled"] || varMap["menu/divider"];
    return varMap["menu/divider"];
  }

  function menuSectionLabelVarForState(state) {
    if (state === "disabled") return varMap["menu/section-label-disabled"] || varMap["menu/section-label"];
    return varMap["menu/section-label"];
  }

  function itemTextVarForState(state) {
    if (state === "hover") return varMap["menu/item-text-hover"];
    if (state === "disabled") return varMap["menu/item-text-disabled"];
    return varMap["menu/item-text"];
  }

  function itemIconVarForState(state) {
    if (state === "hover") return varMap["menu/item-icon-hover"];
    if (state === "disabled") return varMap["menu/item-icon-disabled"];
    return varMap["menu/item-icon"];
  }

  function createSwapPropertyRefs(iconComp) {
    var refs = [];
    if (!iconComp) return refs;
    if (iconComp.key) refs.push(iconComp.key);
    if (iconComp.id) refs.push(iconComp.id);
    return refs;
  }

  function createSwapPreferredValues(candidates) {
    var preferred = [];
    var seen = {};
    for (var i = 0; i < candidates.length && preferred.length < 32; i++) {
      var c = candidates[i];
      if (!c || !c.key || seen[c.key]) continue;
      seen[c.key] = true;
      preferred.push({ type: "COMPONENT", key: c.key, name: c.name });
    }
    return preferred;
  }

  function bindMenuIconColor(iconInst, colorVar) {
    if (!iconInst || !colorVar) return;
    var vectors = [];
    try { vectors = iconInst.findAll(function (n) { return n.type === "VECTOR"; }); } catch (_scanErr) {}
    for (var vi = 0; vi < vectors.length; vi++) {
      bindVar(vectors[vi], "strokeWeight", varMap["menu/icon-stroke-width"]);
      if (vectors[vi].strokes && vectors[vi].strokes.length > 0) {
        vectors[vi].strokes = [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }];
        bindPaintVar(vectors[vi], "strokes", 0, colorVar);
      }
      if (vectors[vi].fills && vectors[vi].fills.length > 0) {
        vectors[vi].fills = [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }];
        bindPaintVar(vectors[vi], "fills", 0, colorVar);
      }
    }
  }

  function attachMenuItemSwap(component, itemMeta) {
    if (!component || !itemMeta || !itemMeta.iconInst || !itemMeta.iconComp || !itemMeta.swapLabel) return;
    if (typeof component.addComponentProperty !== "function") return;
    var swapRefs = createSwapPropertyRefs(itemMeta.iconComp);
    var swapPreferred = createSwapPreferredValues(iconComponents.candidates || []);
    var swapOpts = swapPreferred.length > 0 ? { preferredValues: swapPreferred } : undefined;
    var swapPropName = null;
    var lastErr = null;
    for (var sri = 0; sri < swapRefs.length; sri++) {
      try {
        swapPropName = component.addComponentProperty(itemMeta.swapLabel, "INSTANCE_SWAP", swapRefs[sri], swapOpts);
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!swapPropName && swapRefs.length > 0) {
      for (var srf = 0; srf < swapRefs.length; srf++) {
        try {
          swapPropName = component.addComponentProperty(itemMeta.swapLabel, "INSTANCE_SWAP", swapRefs[srf]);
          break;
        } catch (e2) {
          lastErr = e2;
        }
      }
    }
    if (swapPropName) {
      try {
        itemMeta.iconInst.componentPropertyReferences = { mainComponent: swapPropName };
      } catch (eSetRef) {
        progress("[Menu] " + itemMeta.swapLabel + " set_componentPropertyReferences failed: " + String(eSetRef));
      }
    } else if (lastErr) {
      progress("[Menu] " + itemMeta.swapLabel + " INSTANCE_SWAP create failed: " + String(lastErr));
    }
  }

  function createMenuItem(swapLabel, label, state, iconOn, defaultIconComp) {
    var row = figma.createFrame();
    row.layoutMode = "HORIZONTAL";
    row.primaryAxisSizingMode = "AUTO";
    row.counterAxisSizingMode = "FIXED";
    row.primaryAxisAlignItems = "MIN";
    row.counterAxisAlignItems = "CENTER";
    row.itemSpacing = 8;
    row.paddingLeft = 10;
    row.paddingRight = 10;
    row.paddingTop = 6;
    row.paddingBottom = 6;
    row.resize(8, 32);
    row.layoutAlign = "STRETCH";
    row.cornerRadius = 6;
    row.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    bindPaintVar(row, "fills", 0, itemBgVarForState(state));
    bindVar(row, "paddingLeft", varMap["menu/item-padding-x"]);
    bindVar(row, "paddingRight", varMap["menu/item-padding-x"]);
    bindVar(row, "paddingTop", varMap["menu/item-padding-y"]);
    bindVar(row, "paddingBottom", varMap["menu/item-padding-y"]);
    bindVar(row, "height", varMap["menu/item-height-default"]);
    var menuItemRadiusVar = varMap["menu/item-border-radius-default"];
    if (menuItemRadiusVar) {
      bindVar(row, "topLeftRadius", menuItemRadiusVar);
      bindVar(row, "topRightRadius", menuItemRadiusVar);
      bindVar(row, "bottomLeftRadius", menuItemRadiusVar);
      bindVar(row, "bottomRightRadius", menuItemRadiusVar);
    }

    var iconInstRef = null;
    var iconCompRef = null;
    if (iconOn) {
      var iconComp = defaultIconComp || iconComponents.fallback;
      if (iconComp && typeof iconComp.createInstance === "function") {
        var iconInst = iconComp.createInstance();
        iconInst.name = "icon";
        iconInst.layoutPositioning = "AUTO";
        iconInst.resize(14, 14);
        bindMenuIconColor(iconInst, itemIconVarForState(state));

        iconInstRef = iconInst;
        iconCompRef = iconComp;
        row.appendChild(iconInst);
      } else {
        var icon = figma.createRectangle();
        icon.name = "icon";
        icon.resize(12, 12);
        icon.cornerRadius = 3;
        icon.fills = [{ type: "SOLID", color: { r: 0.6, g: 0.6, b: 0.6 } }];
        bindPaintVar(icon, "fills", 0, itemIconVarForState(state));
        row.appendChild(icon);
      }
    }

    var textNode = figma.createText();
    textNode.name = "label";
    textNode.fontName = font;
    textNode.characters = label;
    textNode.fontSize = 13;
    textNode.fills = [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1 } }];
    bindPaintVar(textNode, "fills", 0, itemTextVarForState(state));
    bindVar(textNode, "fontSize", varMap["menu/font-size-default"]);
    bindVar(textNode, "fontFamily", varMap["menu/font-family"]);
    bindVar(textNode, "fontStyle", varMap["menu/font-weight"]);
    bindVar(textNode, "lineHeight", varMap["menu/line-height-default"]);
    row.appendChild(textNode);

    return { row: row, iconInst: iconInstRef, iconComp: iconCompRef, swapLabel: swapLabel };
  }

  for (var si = 0; si < states.length; si++) {
    for (var sci = 0; sci < sectionModes.length; sci++) {
      for (var ii = 0; ii < iconModes.length; ii++) {
        var state = states[si];
        var sectionOn = sectionModes[sci] === "on";
        var iconOn = iconModes[ii] === "on";

        var component = figma.createComponent();
        component.name =
          "State=" + state.charAt(0).toUpperCase() + state.slice(1) +
          ", Section=" + (sectionOn ? "On" : "Off") +
          ", Icon=" + (iconOn ? "On" : "Off");
        component.layoutMode = "VERTICAL";
        component.primaryAxisSizingMode = "AUTO";
        component.counterAxisSizingMode = "AUTO";
        component.primaryAxisAlignItems = "MIN";
        component.counterAxisAlignItems = "MIN";
        component.itemSpacing = 4;
        component.paddingLeft = 6;
        component.paddingRight = 6;
        component.paddingTop = 6;
        component.paddingBottom = 6;
        component.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
        component.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
        component.strokeAlign = "INSIDE";
        component.cornerRadius = 8;

        bindPaintVar(component, "fills", 0, menuBgVarForState(state));
        bindPaintVar(component, "strokes", 0, menuBorderVarForState(state));
        bindVar(component, "paddingLeft", varMap["menu/padding"]);
        bindVar(component, "paddingRight", varMap["menu/padding"]);
        bindVar(component, "paddingTop", varMap["menu/padding"]);
        bindVar(component, "paddingBottom", varMap["menu/padding"]);
        bindVar(component, "width", varMap["menu/width-default"]);
        bindVar(component, "strokeWeight", varMap["menu/border-width"]);
        var menuRadiusVar = varMap["menu/border-radius-default"] || varMap["menu/radius-default"];
        if (menuRadiusVar) {
          bindVar(component, "topLeftRadius", menuRadiusVar);
          bindVar(component, "topRightRadius", menuRadiusVar);
          bindVar(component, "bottomLeftRadius", menuRadiusVar);
          bindVar(component, "bottomRightRadius", menuRadiusVar);
        }

        if (sectionOn) {
          var sectionWrap = figma.createFrame();
          sectionWrap.name = "section-wrap";
          sectionWrap.layoutMode = "VERTICAL";
          sectionWrap.primaryAxisSizingMode = "AUTO";
          sectionWrap.counterAxisSizingMode = "AUTO";
          sectionWrap.layoutAlign = "STRETCH";
          sectionWrap.primaryAxisAlignItems = "MIN";
          sectionWrap.counterAxisAlignItems = "MIN";
          sectionWrap.itemSpacing = 0;
          sectionWrap.paddingLeft = 8;
          sectionWrap.paddingRight = 8;
          sectionWrap.paddingTop = 4;
          sectionWrap.paddingBottom = 4;
          sectionWrap.fills = [];
          bindVar(sectionWrap, "paddingBottom", varMap["menu/label-divider-gap"]);

          var section = figma.createText();
          section.name = "section";
          section.fontName = font;
          section.characters = "Actions";
          section.fontSize = 11;
          section.fills = [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }];
          bindPaintVar(section, "fills", 0, menuSectionLabelVarForState(state));
          sectionWrap.appendChild(section);
          component.appendChild(sectionWrap);

          var divider = figma.createRectangle();
          divider.name = "divider";
          divider.resize(8, 1);
          divider.cornerRadius = 999;
          divider.layoutAlign = "STRETCH";
          divider.fills = [{ type: "SOLID", color: { r: 0.75, g: 0.75, b: 0.75 } }];
          bindPaintVar(divider, "fills", 0, menuDividerVarForState(state));
          bindVar(divider, "height", varMap["menu/divider-width"]);
          if (varMap["menu/divider-radius"]) {
            bindVar(divider, "topLeftRadius", varMap["menu/divider-radius"]);
            bindVar(divider, "topRightRadius", varMap["menu/divider-radius"]);
            bindVar(divider, "bottomLeftRadius", varMap["menu/divider-radius"]);
            bindVar(divider, "bottomRightRadius", varMap["menu/divider-radius"]);
          }
          component.appendChild(divider);
        }

        var isDisabledState = state === "disabled";
        var item1State = state;
        var item2State = isDisabledState ? "disabled" : "default";
        var item3State = isDisabledState ? "disabled" : "default";

        var itemsWrap = figma.createFrame();
        itemsWrap.name = "items";
        itemsWrap.layoutMode = "VERTICAL";
        itemsWrap.primaryAxisSizingMode = "AUTO";
        itemsWrap.counterAxisSizingMode = "AUTO";
        itemsWrap.primaryAxisAlignItems = "MIN";
        itemsWrap.counterAxisAlignItems = "MIN";
        itemsWrap.layoutAlign = "STRETCH";
        itemsWrap.itemSpacing = 2;
        itemsWrap.paddingLeft = 8;
        itemsWrap.paddingRight = 8;
        itemsWrap.paddingTop = 6;
        itemsWrap.paddingBottom = 6;
        itemsWrap.fills = [];
        bindVar(itemsWrap, "itemSpacing", varMap["menu/item-gap"]);
        bindVar(itemsWrap, "paddingLeft", varMap["menu/content-padding-x"]);
        bindVar(itemsWrap, "paddingRight", varMap["menu/content-padding-x"]);
        bindVar(itemsWrap, "paddingTop", varMap["menu/content-padding-y"]);
        bindVar(itemsWrap, "paddingBottom", varMap["menu/content-padding-y"]);
        component.appendChild(itemsWrap);

        var item1 = createMenuItem("Item 1 Icon", "Open details", item1State, iconOn, iconComponents.check || iconComponents.fallback);
        itemsWrap.appendChild(item1.row);
        attachMenuItemSwap(component, item1);

        var item2 = createMenuItem("Item 2 Icon", "Duplicate", item2State, iconOn, iconComponents.plus || iconComponents.fallback);
        itemsWrap.appendChild(item2.row);
        attachMenuItemSwap(component, item2);

        var item3 = createMenuItem("Item 3 Icon", "Archive", item3State, iconOn, iconComponents.alert || iconComponents.fallback);
        itemsWrap.appendChild(item3.row);
        attachMenuItemSwap(component, item3);

        component.x = ii * (colWidth + gap) + sci * ((iconModes.length * (colWidth + gap)) + gap);
        component.y = si * (rowHeight + gap);
        page.appendChild(component);
        components.push(component);
      }
    }
  }

  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Menu";
  return componentSet;
}

// ---------------------------------------------------------------------------
// Divider Component Set
// ---------------------------------------------------------------------------

function buildDividerComponentSet(varMap, page) {
  var orientations = ["horizontal", "vertical"];
  var insetModes = ["off", "on"];
  var sizes = ["default", "xs", "sm", "md", "lg", "xl"];
  var states = ["default", "disabled"];
  var components = [];
  var gap = 20;
  var colWidth = 280;
  var rowHeight = 120;

  function dividerColorVarForState(state) {
    if (state === "disabled") return varMap["divider/color-disabled"] || varMap["divider/color"];
    return varMap["divider/color"];
  }

  for (var oi = 0; oi < orientations.length; oi++) {
    var orientation = orientations[oi];
    var capOrientation = orientation.charAt(0).toUpperCase() + orientation.slice(1);
    for (var ii = 0; ii < insetModes.length; ii++) {
      var insetMode = insetModes[ii];
      var insetOn = insetMode === "on";
      var capInset = insetOn ? "On" : "Off";
      for (var si = 0; si < sizes.length; si++) {
        var size = sizes[si];
        var capSize = size === "default" ? "Default" : size.toUpperCase();
        for (var sti = 0; sti < states.length; sti++) {
          var state = states[sti];
          var capState = state.charAt(0).toUpperCase() + state.slice(1);

          var component = figma.createComponent();
          component.name =
            "Orientation=" + capOrientation +
            ", Inset=" + capInset +
            ", Size=" + capSize +
            ", State=" + capState;
          component.layoutMode = "HORIZONTAL";
          component.primaryAxisSizingMode = "AUTO";
          component.counterAxisSizingMode = "AUTO";
          component.primaryAxisAlignItems = "CENTER";
          component.counterAxisAlignItems = "CENTER";
          component.fills = [];
          component.strokes = [];
          component.clipsContent = false;
          try { component.layoutSizingHorizontal = "HUG"; } catch (_dividerCompHugWidthErr) {}
          try { component.layoutSizingVertical = "HUG"; } catch (_dividerCompHugHeightErr) {}

          var container = figma.createFrame();
          container.name = "DividerContainer";
          container.fills = [];
          container.strokes = [];
          container.clipsContent = false;
          container.layoutPositioning = "AUTO";

          if (orientation === "horizontal") {
            container.layoutMode = "VERTICAL";
            container.primaryAxisSizingMode = "AUTO";
            container.counterAxisSizingMode = "FIXED";
            container.primaryAxisAlignItems = "CENTER";
            container.counterAxisAlignItems = "MIN";
            container.itemSpacing = 0;
            container.paddingTop = 0;
            container.paddingBottom = 0;
            try { container.resizeWithoutConstraints(240, 3); } catch (_dividerHorizontalInitSizeErr) {}
            if (insetOn) {
              bindVar(container, "paddingLeft", varMap["divider/inset"]);
              bindVar(container, "paddingRight", varMap["divider/inset"]);
            } else {
              container.paddingLeft = 0;
              container.paddingRight = 0;
            }
            bindVar(container, "width", varMap["divider/length"]);
          } else {
            container.layoutMode = "HORIZONTAL";
            container.primaryAxisSizingMode = "FIXED";
            container.counterAxisSizingMode = "AUTO";
            container.primaryAxisAlignItems = "MIN";
            container.counterAxisAlignItems = "CENTER";
            container.itemSpacing = 0;
            container.paddingLeft = 0;
            container.paddingRight = 0;
            try { container.resizeWithoutConstraints(3, 240); } catch (_dividerVerticalInitSizeErr) {}
            if (insetOn) {
              bindVar(container, "paddingTop", varMap["divider/inset"]);
              bindVar(container, "paddingBottom", varMap["divider/inset"]);
            } else {
              container.paddingTop = 0;
              container.paddingBottom = 0;
            }
            bindVar(container, "height", varMap["divider/length"]);
          }

          var line = figma.createRectangle();
          line.name = "Line";
          line.fills = [{ type: "SOLID", color: { r: 0.4, g: 0.4, b: 0.4 } }];
          line.strokes = [];
          line.layoutPositioning = "AUTO";
          if (orientation === "horizontal") {
            line.resize(240, 3);
          } else {
            line.resize(3, 240);
          }
          bindPaintVar(line, "fills", 0, dividerColorVarForState(state));
          bindVar(line, "topLeftRadius", varMap["divider/radius"]);
          bindVar(line, "topRightRadius", varMap["divider/radius"]);
          bindVar(line, "bottomLeftRadius", varMap["divider/radius"]);
          bindVar(line, "bottomRightRadius", varMap["divider/radius"]);
          if (orientation === "horizontal") {
            line.layoutAlign = "STRETCH";
            bindVar(line, "height", varMap["divider/thickness-" + size]);
          } else {
            line.layoutAlign = "STRETCH";
            bindVar(line, "width", varMap["divider/thickness-" + size]);
          }

          if (state === "disabled") {
            line.opacity = 0.7;
          }

          container.appendChild(line);
          component.appendChild(container);

          var colIndex = ((oi * insetModes.length + ii) * sizes.length) + si;
          var rowIndex = sti;
          component.x = colIndex * (colWidth + gap);
          component.y = rowIndex * (rowHeight + gap);
          page.appendChild(component);
          components.push(component);
        }
      }
    }
  }

  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Divider";
  return componentSet;
}

// ---------------------------------------------------------------------------
// List Component Set
// ---------------------------------------------------------------------------

async function buildListComponentSet(varMap, page, font) {
  var sizes = ["default", "xs", "sm", "md", "lg", "xl"];
  var types = ["unordered", "ordered"];
  var iconModes = ["on", "off"];
  var paddingModes = ["off", "on"];
  var components = [];
  var gap = 20;
  var colWidth = 320;
  var rowHeight = 140;
  var iconComponents = await findMenuIconComponents();

  function bindListIconColor(iconInst, colorVar, strokeVar) {
    if (!iconInst) return;
    var vectors = [];
    try { vectors = iconInst.findAll(function (n) { return n.type === "VECTOR"; }); } catch (_scanErr) {}
    for (var vi = 0; vi < vectors.length; vi++) {
      if (strokeVar) bindVar(vectors[vi], "strokeWeight", strokeVar);
      if (vectors[vi].strokes && vectors[vi].strokes.length > 0) {
        vectors[vi].strokes = [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }];
        bindPaintVar(vectors[vi], "strokes", 0, colorVar);
      }
      if (vectors[vi].fills && vectors[vi].fills.length > 0) {
        vectors[vi].fills = [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }];
        bindPaintVar(vectors[vi], "fills", 0, colorVar);
      }
    }
  }

  function createListItem(label, iconOn, iconComp, size, markerText) {
    var row = figma.createFrame();
    row.layoutMode = "HORIZONTAL";
    row.primaryAxisSizingMode = "AUTO";
    row.counterAxisSizingMode = "FIXED";
    row.primaryAxisAlignItems = "MIN";
    row.counterAxisAlignItems = "CENTER";
    row.itemSpacing = 8;
    row.resize(8, 24);
    row.layoutAlign = "STRETCH";
    row.fills = [];

    if (iconOn) {
      var itemIconComp = iconComp || iconComponents.fallback;
      if (itemIconComp && typeof itemIconComp.createInstance === "function") {
        var iconInst = itemIconComp.createInstance();
        iconInst.name = "icon";
        iconInst.layoutPositioning = "AUTO";
        iconInst.resize(14, 14);
        bindVar(iconInst, "width", varMap["list/icon-size-" + size]);
        bindVar(iconInst, "height", varMap["list/icon-size-" + size]);
        bindListIconColor(
          iconInst,
          varMap["list/icon-color"],
          varMap["list/icon-stroke-width-" + size]
        );
        row.appendChild(iconInst);
      } else {
        var iconFallback = figma.createRectangle();
        iconFallback.name = "icon";
        iconFallback.resize(12, 12);
        iconFallback.cornerRadius = 3;
        iconFallback.fills = [{ type: "SOLID", color: { r: 0.6, g: 0.6, b: 0.6 } }];
        bindPaintVar(iconFallback, "fills", 0, varMap["list/icon-color"]);
        row.appendChild(iconFallback);
      }
    } else {
      var marker = figma.createText();
      marker.name = "marker";
      marker.fontName = font;
      marker.characters = markerText;
      marker.fontSize = 13;
      marker.fills = [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }];
      bindPaintVar(marker, "fills", 0, varMap["list/marker-color"]);
      bindVar(marker, "fontSize", varMap["list/font-size-" + size]);
      bindVar(marker, "fontFamily", varMap["list/font-family"]);
      bindVar(marker, "fontStyle", varMap["list/font-weight"]);
      bindVar(marker, "lineHeight", varMap["list/line-height-" + size]);
      row.appendChild(marker);
    }

    var textNode = figma.createText();
    textNode.name = "label";
    textNode.fontName = font;
    textNode.characters = label;
    textNode.fontSize = 13;
    textNode.fills = [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1 } }];
    bindPaintVar(textNode, "fills", 0, varMap["list/item-color"]);
    bindVar(textNode, "fontSize", varMap["list/font-size-" + size]);
    bindVar(textNode, "fontFamily", varMap["list/font-family"]);
    bindVar(textNode, "fontStyle", varMap["list/font-weight"]);
    bindVar(textNode, "lineHeight", varMap["list/line-height-" + size]);
    row.appendChild(textNode);

    return row;
  }

  for (var si = 0; si < sizes.length; si++) {
    var size = sizes[si];
    var capSize = size === "default" ? "Default" : size.toUpperCase();
    for (var ti = 0; ti < types.length; ti++) {
      var type = types[ti];
      var capType = type === "unordered" ? "Unordered" : "Ordered";
      for (var ii = 0; ii < iconModes.length; ii++) {
        var iconMode = iconModes[ii];
        var iconOn = iconMode === "on";
        var capIcon = iconOn ? "On" : "Off";
        for (var pi = 0; pi < paddingModes.length; pi++) {
          var paddingMode = paddingModes[pi];
          var withPadding = paddingMode === "on";
          var capPadding = withPadding ? "On" : "Off";

          var component = figma.createComponent();
          component.name =
            "Size=" + capSize +
            ", Type=" + capType +
            ", Icon=" + capIcon +
            ", Padding=" + capPadding;
          component.layoutMode = "VERTICAL";
          component.primaryAxisSizingMode = "AUTO";
          component.counterAxisSizingMode = "AUTO";
          component.primaryAxisAlignItems = "MIN";
          component.counterAxisAlignItems = "MIN";
          component.itemSpacing = 4;
          component.fills = [];
          component.strokes = [];
          bindVar(component, "itemSpacing", varMap["list/spacing-" + size]);

          if (withPadding) {
            bindVar(component, "paddingLeft", varMap["list/item-padding-left-" + size]);
          } else {
            component.paddingLeft = 0;
          }

          component.appendChild(
            createListItem(
              "Clone or download repository from GitHub",
              iconOn,
              iconComponents.check || iconComponents.fallback,
              size,
              type === "ordered" ? "1." : "\u2022"
            )
          );
          component.appendChild(
            createListItem(
              "Install dependencies with yarn",
              iconOn,
              iconComponents.plus || iconComponents.fallback,
              size,
              type === "ordered" ? "2." : "\u2022"
            )
          );
          component.appendChild(
            createListItem(
              "Run tests before opening your pull request",
              iconOn,
              iconComponents.alert || iconComponents.fallback,
              size,
              type === "ordered" ? "3." : "\u2022"
            )
          );

          var colIndex = pi + ii * paddingModes.length + ti * (iconModes.length * paddingModes.length);
          var rowIndex = si;
          component.x = colIndex * (colWidth + gap);
          component.y = rowIndex * (rowHeight + gap);
          page.appendChild(component);
          components.push(component);
        }
      }
    }
  }

  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "List";
  return componentSet;
}

// ---------------------------------------------------------------------------
// Loader Component Set
// ---------------------------------------------------------------------------

function buildLoaderComponentSet(varMap, page, font, resolvedComponentFloat) {
  var resolveCompFloat =
    typeof resolvedComponentFloat === "function"
      ? resolvedComponentFloat
      : function (_path, fallback) {
          return fallback;
        };
  var types = ["oval", "bars", "dots"];
  var sizes = ["default", "xs", "sm", "md", "lg", "xl"];
  var components = [];
  var sizePx = { xs: 14, sm: 18, md: 22, lg: 28, xl: 34 };
  sizePx.default = sizePx.md;
  var gap = 22;
  var colWidth = 120;
  var rowHeight = 80;

  for (var ti = 0; ti < types.length; ti++) {
    var type = types[ti];
    var capType = type.charAt(0).toUpperCase() + type.slice(1);
    for (var si = 0; si < sizes.length; si++) {
      var size = sizes[si];
      var capSize = size === "default" ? "Default" : size.toUpperCase();
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
        ring.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
        ring.strokes = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
        ring.strokeWeight = Math.max(2, Math.round(s * 0.14));
        ring.strokeAlign = "CENTER";
        ring.arcData = { startingAngle: 0, endingAngle: Math.PI * 1.55, innerRadius: 0.72 };
        // Figma VariableBindableNodeField has no "cornerRadius" — variables cannot link here; use literal from synced payload.
        ring.cornerRadius = resolveCompFloat("loader/oval-corner-radius-" + size, 0);
        bindPaintVar(ring, "fills", 0, varMap["loader/color"]);
        bindPaintVar(ring, "strokes", 0, varMap["loader/color"]);
        bindVar(ring, "strokeWeight", varMap["loader/stroke-width-" + size]);
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
// Progress Component Set
// ---------------------------------------------------------------------------

function buildProgressComponentSet(varMap, page, font, resolvedComponentFloat) {
  var resolveCompFloat =
    typeof resolvedComponentFloat === "function"
      ? resolvedComponentFloat
      : function (_path, fallback) {
          return fallback;
        };
  var sizes = ["default", "xs", "sm", "md", "lg", "xl"];
  var radii = ["default", "xs", "sm", "md", "lg", "xl"];
  var components = [];
  var colWidth = 280;
  var rowHeight = 56;
  var gap = 20;

  for (var si = 0; si < sizes.length; si++) {
    var size = sizes[si];
    var capSize = size === "default" ? "Default" : size.toUpperCase();
    var tw = resolveCompFloat("progress/track-width-" + size, 160);
    var th = resolveCompFloat("progress/height-" + size, 8);
    var fillW = Math.max(2, Math.round(tw * 0.6));

    for (var ri = 0; ri < radii.length; ri++) {
      var radiusKey = radii[ri];
      var capRadius = radiusKey === "default" ? "Default" : radiusKey.toUpperCase();

      var comp = figma.createComponent();
      comp.name = "Size=" + capSize + ", Radius=" + capRadius;
      comp.layoutMode = "HORIZONTAL";
      comp.primaryAxisSizingMode = "AUTO";
      comp.counterAxisSizingMode = "AUTO";
      comp.primaryAxisAlignItems = "CENTER";
      comp.counterAxisAlignItems = "CENTER";
      comp.itemSpacing = 8;
      comp.fills = [];

      bindVar(comp, "itemSpacing", varMap["progress/gap-" + size]);

      var trackShell = figma.createFrame();
      trackShell.name = "Track";
      trackShell.layoutMode = "NONE";
      trackShell.clipsContent = true;
      trackShell.primaryAxisSizingMode = "FIXED";
      trackShell.counterAxisSizingMode = "FIXED";
      trackShell.layoutSizingHorizontal = "FIXED";
      trackShell.layoutSizingVertical = "FIXED";
      trackShell.resize(tw, th);
      trackShell.fills = [{ type: "SOLID", color: { r: 0.85, g: 0.87, b: 0.91 } }];
      trackShell.strokes = [];
      bindPaintVar(trackShell, "fills", 0, varMap["progress/track"]);
      bindVar(trackShell, "width", varMap["progress/track-width-" + size]);
      bindVar(trackShell, "height", varMap["progress/height-" + size]);
      bindVar(trackShell, "topLeftRadius", varMap["progress/radius-" + radiusKey]);
      bindVar(trackShell, "topRightRadius", varMap["progress/radius-" + radiusKey]);
      bindVar(trackShell, "bottomLeftRadius", varMap["progress/radius-" + radiusKey]);
      bindVar(trackShell, "bottomRightRadius", varMap["progress/radius-" + radiusKey]);

      var fillRect = figma.createRectangle();
      fillRect.name = "Fill";
      fillRect.resize(fillW, th);
      fillRect.x = 0;
      fillRect.y = 0;
      fillRect.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
      fillRect.strokes = [];
      bindPaintVar(fillRect, "fills", 0, varMap["progress/fill"]);
      bindVar(fillRect, "topLeftRadius", varMap["progress/radius-" + radiusKey]);
      bindVar(fillRect, "topRightRadius", varMap["progress/radius-" + radiusKey]);
      bindVar(fillRect, "bottomLeftRadius", varMap["progress/radius-" + radiusKey]);
      bindVar(fillRect, "bottomRightRadius", varMap["progress/radius-" + radiusKey]);
      trackShell.appendChild(fillRect);

      var label = figma.createText();
      label.name = "Value";
      label.fontName = font;
      label.characters = "60%";
      label.fontSize = 13;
      label.fills = [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.12 } }];
      bindPaintVar(label, "fills", 0, varMap["progress/label"]);
      bindVar(label, "fontSize", varMap["progress/font-size-" + size]);

      comp.appendChild(trackShell);
      comp.appendChild(label);

      comp.x = ri * (colWidth + gap);
      comp.y = si * (rowHeight + gap);
      page.appendChild(comp);
      components.push(comp);
    }
  }

  progress("Created " + components.length + " progress variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Progress";
  return componentSet;
}

// ---------------------------------------------------------------------------
// Chart Component Set (Bar)
// ---------------------------------------------------------------------------
// Bars/axes/gridlines are built from native shapes. Chart *data* (bar heights,
// category labels) is baked in as representative sample content — only the
// styling surfaces (series colors, axis, grid, label typography, bar radius)
// are bound to design-system variables so they stay live.

function buildChartComponentSet(varMap, page, font, resolvedComponentFloat, resolvedComponentString) {
  var resolveCompFloat =
    typeof resolvedComponentFloat === "function"
      ? resolvedComponentFloat
      : function (_path, fallback) {
          return fallback;
        };
  var resolveCompString =
    typeof resolvedComponentString === "function"
      ? resolvedComponentString
      : function (_path, fallback) {
          return fallback;
        };
  var gridDashed = resolveCompString("chart/grid-style", "solid") === "dashed";
  var gridDash = resolveCompFloat("chart/grid-dash", 4);

  // Fixed sample data — not a design-system concern.
  var SAMPLE = [
    { label: "Jan", value: 42 },
    { label: "Feb", value: 58 },
    { label: "Mar", value: 35 },
    { label: "Apr", value: 71 },
    { label: "May", value: 49 },
    { label: "Jun", value: 63 },
  ];
  var Y_TICKS = [0, 20, 40, 60, 80];
  var MAX_SCALE = 80;

  // Structural gutters for tick labels (geometry, not tokens).
  var Y_GUTTER = 34;
  var X_GUTTER = 20;

  var seriesPaths = [
    "chart/series-1", "chart/series-2", "chart/series-3",
    "chart/series-4", "chart/series-5", "chart/series-6",
  ];
  var seriesFallback = [
    { r: 0.13, g: 0.55, b: 0.9 }, { r: 0.0, g: 0.74, b: 0.83 },
    { r: 0.22, g: 0.74, b: 0.33 }, { r: 0.98, g: 0.62, b: 0.11 },
    { r: 0.61, g: 0.35, b: 0.86 }, { r: 0.92, g: 0.28, b: 0.6 },
  ];
  // Dedicated shade ramp (dark -> light) used by the "Shades" color variant.
  var shadePaths = [
    "chart/shade-1", "chart/shade-2", "chart/shade-3",
    "chart/shade-4", "chart/shade-5", "chart/shade-6",
  ];
  var shadeFallback = [
    { r: 0.05, g: 0.28, b: 0.63 }, { r: 0.08, g: 0.40, b: 0.78 },
    { r: 0.13, g: 0.55, b: 0.90 }, { r: 0.35, g: 0.67, b: 0.94 },
    { r: 0.55, g: 0.78, b: 0.97 }, { r: 0.72, g: 0.86, b: 0.99 },
  ];
  var axisFallback = { r: 0.78, g: 0.82, b: 0.87 };
  var gridFallback = { r: 0.88, g: 0.9, b: 0.93 };
  var labelFallback = { r: 0.4, g: 0.44, b: 0.52 };

  var sizes = ["default"];
  var colorModes = ["single", "palette", "shades"];
  var components = [];
  var colGap = 60;
  var rowGap = 60;
  var maxColWidth = 0;
  var maxRowHeight = 0;

  for (var ci = 0; ci < colorModes.length; ci++) {
    var colorMode = colorModes[ci];
    var capColor = colorMode === "single" ? "Single" : colorMode === "palette" ? "Palette" : "Shades";

    for (var si = 0; si < sizes.length; si++) {
      var size = sizes[si];
      var capSize = size === "default" ? "Default" : size.toUpperCase();

      var plotW = resolveCompFloat("chart/width-" + size, 320);
      var plotH = resolveCompFloat("chart/height-" + size, 180);
      var barGap = resolveCompFloat("chart/bar-gap-" + size, 12);
      var labelFontSize = resolveCompFloat("chart/label-font-size-" + size, 11);
      var pad = resolveCompFloat("chart/padding", 16);
      var barRadius = resolveCompFloat("chart/bar-radius", 2);
      var axisWidth = resolveCompFloat("chart/axis-width", 1);
      var gridWidth = resolveCompFloat("chart/grid-width", 1);

      var plotX = pad + Y_GUTTER;
      var plotY = pad;
      var totalW = pad * 2 + Y_GUTTER + plotW;
      var totalH = pad * 2 + X_GUTTER + plotH;
      maxColWidth = Math.max(maxColWidth, totalW);
      maxRowHeight = Math.max(maxRowHeight, totalH);

      var comp = figma.createComponent();
      comp.name = "Colors=" + capColor;
      comp.layoutMode = "NONE";
      comp.resize(totalW, totalH);
      comp.fills = [];
      comp.clipsContent = false;

      // ── Gridlines (horizontal) ──
      for (var gi = 0; gi < Y_TICKS.length; gi++) {
        var gy = plotY + plotH - (Y_TICKS[gi] / MAX_SCALE) * plotH;
        var grid = figma.createLine();
        grid.name = "Gridline";
        grid.resize(plotW, 0);
        grid.x = plotX;
        grid.y = gy;
        grid.strokeCap = "NONE";
        grid.strokes = [{ type: "SOLID", color: gridFallback }];
        grid.strokeWeight = Math.max(1, gridWidth);
        if (gridDashed) grid.dashPattern = [gridDash, gridDash];
        bindPaintVar(grid, "strokes", 0, varMap["chart/grid"]);
        bindVar(grid, "strokeWeight", varMap["chart/grid-width"]);
        comp.appendChild(grid);

        // ── Y tick labels ──
        var yLabel = figma.createText();
        yLabel.fontName = font;
        yLabel.name = "Y Label";
        yLabel.characters = String(Y_TICKS[gi]);
        yLabel.fontSize = labelFontSize;
        yLabel.textAlignHorizontal = "RIGHT";
        yLabel.resize(Y_GUTTER - 6, labelFontSize + 4);
        yLabel.x = pad;
        yLabel.y = gy - (labelFontSize + 4) / 2;
        yLabel.fills = [{ type: "SOLID", color: labelFallback }];
        bindPaintVar(yLabel, "fills", 0, varMap["chart/label"]);
        bindVar(yLabel, "fontSize", varMap["chart/label-font-size-" + size]);
        bindVar(yLabel, "fontFamily", varMap["chart/font-family"]);
        bindVar(yLabel, "fontStyle", varMap["chart/label-font-weight"]);
        comp.appendChild(yLabel);
      }

      // ── Bars + X tick labels ──
      var slot = plotW / SAMPLE.length;
      var barWidth = Math.max(2, slot - barGap);
      for (var bi = 0; bi < SAMPLE.length; bi++) {
        var datum = SAMPLE[bi];
        var barH = Math.max(2, (datum.value / MAX_SCALE) * plotH);
        var bx = plotX + bi * slot + (slot - barWidth) / 2;

        var bar = figma.createRectangle();
        bar.name = "Bar";
        bar.resize(barWidth, barH);
        bar.x = bx;
        bar.y = plotY + plotH - barH;
        var paletteArr = colorMode === "shades" ? shadePaths : seriesPaths;
        var fallbackArr = colorMode === "shades" ? shadeFallback : seriesFallback;
        var fillIdx = colorMode === "single" ? 0 : bi % paletteArr.length;
        bar.fills = [{ type: "SOLID", color: fallbackArr[fillIdx] }];
        bar.strokes = [];
        bar.topLeftRadius = barRadius;
        bar.topRightRadius = barRadius;
        bindPaintVar(bar, "fills", 0, varMap[paletteArr[fillIdx]]);
        bindVar(bar, "topLeftRadius", varMap["chart/bar-radius"]);
        bindVar(bar, "topRightRadius", varMap["chart/bar-radius"]);
        comp.appendChild(bar);

        var xLabel = figma.createText();
        xLabel.fontName = font;
        xLabel.name = "X Label";
        xLabel.characters = datum.label;
        xLabel.fontSize = labelFontSize;
        xLabel.textAlignHorizontal = "CENTER";
        xLabel.resize(slot, labelFontSize + 4);
        xLabel.x = plotX + bi * slot;
        xLabel.y = plotY + plotH + 4;
        xLabel.fills = [{ type: "SOLID", color: labelFallback }];
        bindPaintVar(xLabel, "fills", 0, varMap["chart/label"]);
        bindVar(xLabel, "fontSize", varMap["chart/label-font-size-" + size]);
        bindVar(xLabel, "fontFamily", varMap["chart/font-family"]);
        bindVar(xLabel, "fontStyle", varMap["chart/label-font-weight"]);
        comp.appendChild(xLabel);
      }

      // ── Axis lines (drawn last so they sit above gridlines) ──
      var yAxis = figma.createRectangle();
      yAxis.name = "Y Axis";
      yAxis.resize(Math.max(1, axisWidth), plotH);
      yAxis.x = plotX;
      yAxis.y = plotY;
      yAxis.fills = [{ type: "SOLID", color: axisFallback }];
      yAxis.strokes = [];
      bindPaintVar(yAxis, "fills", 0, varMap["chart/axis"]);
      bindVar(yAxis, "width", varMap["chart/axis-width"]);
      comp.appendChild(yAxis);

      var xAxis = figma.createRectangle();
      xAxis.name = "X Axis";
      xAxis.resize(plotW, Math.max(1, axisWidth));
      xAxis.x = plotX;
      xAxis.y = plotY + plotH;
      xAxis.fills = [{ type: "SOLID", color: axisFallback }];
      xAxis.strokes = [];
      bindPaintVar(xAxis, "fills", 0, varMap["chart/axis"]);
      bindVar(xAxis, "height", varMap["chart/axis-width"]);
      comp.appendChild(xAxis);

      comp.x = si * (maxColWidth + colGap);
      comp.y = ci * (maxRowHeight + rowGap);
      page.appendChild(comp);
      components.push(comp);
    }
  }

  progress("Created " + components.length + " chart variants");
  var chartSet = figma.combineAsVariants(components, page);
  chartSet.name = "Bar Chart";
  return chartSet;
}

// ---------------------------------------------------------------------------
// Chart Component Set (Line)
// ---------------------------------------------------------------------------
// Same axis/grid/label scaffold as the bar chart, but the data series is a
// stroked vector polyline with optional point markers. Shares the `chart/*`
// styling variables; line-specific stroke weight binds to `chart-line/width`.

function buildChartLineComponentSet(varMap, page, font, resolvedComponentFloat, resolvedComponentString) {
  var resolveCompFloat =
    typeof resolvedComponentFloat === "function"
      ? resolvedComponentFloat
      : function (_path, fallback) {
          return fallback;
        };
  var resolveCompString =
    typeof resolvedComponentString === "function"
      ? resolvedComponentString
      : function (_path, fallback) {
          return fallback;
        };
  var gridDashed = resolveCompString("chart/grid-style", "solid") === "dashed";
  var gridDash = resolveCompFloat("chart/grid-dash", 4);

  var SAMPLE = [
    { label: "Jan", v: [42, 24, 60, 12] },
    { label: "Feb", v: [58, 38, 30, 50] },
    { label: "Mar", v: [35, 52, 64, 22] },
    { label: "Apr", v: [71, 30, 20, 58] },
    { label: "May", v: [49, 62, 44, 28] },
    { label: "Jun", v: [63, 41, 54, 70] },
  ];
  var Y_TICKS = [0, 20, 40, 60, 80];
  var MAX_SCALE = 80;
  var Y_GUTTER = 34;
  var X_GUTTER = 20;

  var seriesPaths = [
    "chart/series-1", "chart/series-2", "chart/series-3", "chart/series-4",
  ];
  var stylePaths = [
    "chart/series-1-style", "chart/series-2-style",
    "chart/series-3-style", "chart/series-4-style",
  ];
  var styleDefaults = ["solid", "dashed", "dotted", "solid"];
  var seriesFallbacks = [
    { r: 0.13, g: 0.55, b: 0.9 }, { r: 0.0, g: 0.74, b: 0.83 },
    { r: 0.22, g: 0.74, b: 0.33 }, { r: 0.98, g: 0.62, b: 0.11 },
  ];
  var axisFallback = { r: 0.78, g: 0.82, b: 0.87 };
  var gridFallback = { r: 0.88, g: 0.9, b: 0.93 };
  var labelFallback = { r: 0.4, g: 0.44, b: 0.52 };

  // Per-series dash + curve are structural, so they're baked at build time
  // (Figma can't bind a dash pattern or curve to a variable).
  var seriesDash = resolveCompFloat("chart/series-dash", 6);
  var curveSmooth = resolveCompString("chart/line-curve", "smooth") !== "straight";

  function dashForStyle(style) {
    if (style === "dashed") return [seriesDash, seriesDash];
    if (style === "dotted") return [2, Math.max(2, seriesDash)];
    return null;
  }
  // Catmull-Rom -> cubic bezier for smooth curves; plain polyline for straight.
  function buildLinePath(pts, smooth) {
    if (!pts.length) return "";
    if (!smooth || pts.length < 3) {
      var ds = "";
      for (var k = 0; k < pts.length; k++) {
        ds += (k === 0 ? "M " : " L ") + pts[k].x + " " + pts[k].y;
      }
      return ds;
    }
    var d = "M " + pts[0].x + " " + pts[0].y;
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i];
      var p1 = pts[i];
      var p2 = pts[i + 1];
      var p3 = pts[i + 2] || p2;
      var cp1x = p1.x + (p2.x - p0.x) / 6;
      var cp1y = p1.y + (p2.y - p0.y) / 6;
      var cp2x = p2.x - (p3.x - p1.x) / 6;
      var cp2y = p2.y - (p3.y - p1.y) / 6;
      d += " C " + cp1x + " " + cp1y + " " + cp2x + " " + cp2y + " " + p2.x + " " + p2.y;
    }
    return d;
  }

  var sizes = ["default"];
  var pointModes = ["off", "on"];
  var seriesCounts = [1, 2, 3, 4];
  var legendModes = ["off", "on"];
  var components = [];
  var colGap = 60;
  var rowGap = 60;
  var maxColWidth = 0;
  var maxRowHeight = 0;
  var rowIndex = 0;

  for (var legi = 0; legi < legendModes.length; legi++) {
    var withLegend = legendModes[legi] === "on";
    var capLegend = withLegend ? "On" : "Off";

  for (var pi = 0; pi < pointModes.length; pi++) {
    var pointMode = pointModes[pi];
    var withPoints = pointMode === "on";
    var capPoints = withPoints ? "On" : "Off";

    for (var sci = 0; sci < seriesCounts.length; sci++) {
      var nSeries = seriesCounts[sci];

      for (var si = 0; si < sizes.length; si++) {
        var size = sizes[si];
        var capSize = size === "default" ? "Default" : size.toUpperCase();

      var plotW = resolveCompFloat("chart/width-" + size, 320);
      var plotH = resolveCompFloat("chart/height-" + size, 180);
      var labelFontSize = resolveCompFloat("chart/label-font-size-" + size, 11);
      var pad = resolveCompFloat("chart/padding", 16);
      var axisWidth = resolveCompFloat("chart/axis-width", 1);
      var gridWidth = resolveCompFloat("chart/grid-width", 1);
      var lineWidth = resolveCompFloat("chart-line/width", 2);
      var pointRadius = resolveCompFloat("chart-line/point-radius", 3);
      var legendFontSize = resolveCompFloat("chart/legend-font-size-" + size, 12);
      var legendSwatch = resolveCompFloat("chart/legend-swatch-size", 10);
      var legendGap = resolveCompFloat("chart/legend-gap", 16);
      var legendRowH = withLegend ? Math.max(legendSwatch, legendFontSize + 4) + 14 : 0;

      var plotX = pad + Y_GUTTER;
      var plotY = pad;
      var totalW = pad * 2 + Y_GUTTER + plotW;
      var totalH = pad * 2 + X_GUTTER + plotH + legendRowH;
      maxColWidth = Math.max(maxColWidth, totalW);
      maxRowHeight = Math.max(maxRowHeight, totalH);

      var comp = figma.createComponent();
      comp.name = "Points=" + capPoints + ", Series=" + nSeries + ", Legend=" + capLegend;
      comp.layoutMode = "NONE";
      comp.resize(totalW, totalH);
      comp.fills = [];
      comp.clipsContent = false;

      // ── Gridlines + Y tick labels ──
      for (var gi = 0; gi < Y_TICKS.length; gi++) {
        var gy = plotY + plotH - (Y_TICKS[gi] / MAX_SCALE) * plotH;
        var grid = figma.createLine();
        grid.name = "Gridline";
        grid.resize(plotW, 0);
        grid.x = plotX;
        grid.y = gy;
        grid.strokeCap = "NONE";
        grid.strokes = [{ type: "SOLID", color: gridFallback }];
        grid.strokeWeight = Math.max(1, gridWidth);
        if (gridDashed) grid.dashPattern = [gridDash, gridDash];
        bindPaintVar(grid, "strokes", 0, varMap["chart/grid"]);
        bindVar(grid, "strokeWeight", varMap["chart/grid-width"]);
        comp.appendChild(grid);

        var yLabel = figma.createText();
        yLabel.fontName = font;
        yLabel.name = "Y Label";
        yLabel.characters = String(Y_TICKS[gi]);
        yLabel.fontSize = labelFontSize;
        yLabel.textAlignHorizontal = "RIGHT";
        yLabel.resize(Y_GUTTER - 6, labelFontSize + 4);
        yLabel.x = pad;
        yLabel.y = gy - (labelFontSize + 4) / 2;
        yLabel.fills = [{ type: "SOLID", color: labelFallback }];
        bindPaintVar(yLabel, "fills", 0, varMap["chart/label"]);
        bindVar(yLabel, "fontSize", varMap["chart/label-font-size-" + size]);
        bindVar(yLabel, "fontFamily", varMap["chart/font-family"]);
        bindVar(yLabel, "fontStyle", varMap["chart/label-font-weight"]);
        comp.appendChild(yLabel);
      }

      // ── Line series (one stroked vector per series) ──
      var slot = plotW / SAMPLE.length;
      for (var li = 0; li < nSeries; li++) {
        var seriesColor = seriesFallbacks[li % seriesFallbacks.length];
        var seriesVar = varMap[seriesPaths[li % seriesPaths.length]];
        var lineCoords = [];
        for (var di = 0; di < SAMPLE.length; di++) {
          var px = plotX + di * slot + slot / 2;
          var py = plotY + plotH - (SAMPLE[di].v[li] / MAX_SCALE) * plotH;
          lineCoords.push({ x: px, y: py });
        }
        var lineVec = figma.createVector();
        lineVec.name = "Line " + (li + 1);
        comp.appendChild(lineVec);
        lineVec.x = 0;
        lineVec.y = 0;
        lineVec.vectorPaths = [{ windingRule: "NONE", data: buildLinePath(lineCoords, curveSmooth) }];
        lineVec.strokeWeight = Math.max(1, lineWidth);
        lineVec.strokeCap = "ROUND";
        lineVec.strokeJoin = "ROUND";
        lineVec.fills = [];
        lineVec.strokes = [{ type: "SOLID", color: seriesColor }];
        var dashPat = dashForStyle(resolveCompString(stylePaths[li % stylePaths.length], styleDefaults[li % styleDefaults.length]));
        if (dashPat) lineVec.dashPattern = dashPat;
        bindPaintVar(lineVec, "strokes", 0, seriesVar);
        bindVar(lineVec, "strokeWeight", varMap["chart-line/width"]);

        // ── Point markers ──
        if (withPoints) {
          for (var ci2 = 0; ci2 < lineCoords.length; ci2++) {
            var dot = figma.createEllipse();
            dot.name = "Point";
            dot.resize(pointRadius * 2, pointRadius * 2);
            dot.x = lineCoords[ci2].x - pointRadius;
            dot.y = lineCoords[ci2].y - pointRadius;
            dot.fills = [{ type: "SOLID", color: seriesColor }];
            dot.strokes = [];
            bindPaintVar(dot, "fills", 0, seriesVar);
            comp.appendChild(dot);
          }
        }
      }

      // ── X tick labels ──
      for (var xi = 0; xi < SAMPLE.length; xi++) {
        var xLabel = figma.createText();
        xLabel.fontName = font;
        xLabel.name = "X Label";
        xLabel.characters = SAMPLE[xi].label;
        xLabel.fontSize = labelFontSize;
        xLabel.textAlignHorizontal = "CENTER";
        xLabel.resize(slot, labelFontSize + 4);
        xLabel.x = plotX + xi * slot;
        xLabel.y = plotY + plotH + 4;
        xLabel.fills = [{ type: "SOLID", color: labelFallback }];
        bindPaintVar(xLabel, "fills", 0, varMap["chart/label"]);
        bindVar(xLabel, "fontSize", varMap["chart/label-font-size-" + size]);
        bindVar(xLabel, "fontFamily", varMap["chart/font-family"]);
        bindVar(xLabel, "fontStyle", varMap["chart/label-font-weight"]);
        comp.appendChild(xLabel);
      }

      // ── Axis lines ──
      var yAxis = figma.createRectangle();
      yAxis.name = "Y Axis";
      yAxis.resize(Math.max(1, axisWidth), plotH);
      yAxis.x = plotX;
      yAxis.y = plotY;
      yAxis.fills = [{ type: "SOLID", color: axisFallback }];
      yAxis.strokes = [];
      bindPaintVar(yAxis, "fills", 0, varMap["chart/axis"]);
      bindVar(yAxis, "width", varMap["chart/axis-width"]);
      comp.appendChild(yAxis);

      var xAxis = figma.createRectangle();
      xAxis.name = "X Axis";
      xAxis.resize(plotW, Math.max(1, axisWidth));
      xAxis.x = plotX;
      xAxis.y = plotY + plotH;
      xAxis.fills = [{ type: "SOLID", color: axisFallback }];
      xAxis.strokes = [];
      bindPaintVar(xAxis, "fills", 0, varMap["chart/axis"]);
      bindVar(xAxis, "height", varMap["chart/axis-width"]);
      comp.appendChild(xAxis);

      // ── Legend (swatch + label per series, centered below the plot) ──
      if (withLegend) {
        var legendItemH = Math.max(legendSwatch, legendFontSize + 4);
        var legendY = plotY + plotH + X_GUTTER + 8;
        var legendItems = [];
        var totalLegendW = 0;
        for (var lgi = 0; lgi < nSeries; lgi++) {
          var lbl = "Series " + (lgi + 1);
          var lblW = Math.ceil(lbl.length * legendFontSize * 0.6);
          var iw = legendSwatch + 6 + lblW;
          legendItems.push({ w: iw, label: lbl, labelW: lblW });
          totalLegendW += iw;
        }
        totalLegendW += legendGap * Math.max(0, nSeries - 1);
        var lx = plotX + (plotW - totalLegendW) / 2;
        if (lx < pad) lx = pad;
        for (var lgj = 0; lgj < nSeries; lgj++) {
          var sw = figma.createRectangle();
          sw.name = "Legend Swatch";
          sw.resize(legendSwatch, legendSwatch);
          sw.x = lx;
          sw.y = legendY + (legendItemH - legendSwatch) / 2;
          sw.cornerRadius = 2;
          sw.fills = [{ type: "SOLID", color: seriesFallbacks[lgj % seriesFallbacks.length] }];
          sw.strokes = [];
          bindPaintVar(sw, "fills", 0, varMap[seriesPaths[lgj % seriesPaths.length]]);
          bindVar(sw, "width", varMap["chart/legend-swatch-size"]);
          bindVar(sw, "height", varMap["chart/legend-swatch-size"]);
          comp.appendChild(sw);

          var lt = figma.createText();
          lt.fontName = font;
          lt.name = "Legend Label";
          lt.characters = legendItems[lgj].label;
          lt.fontSize = legendFontSize;
          lt.textAlignHorizontal = "LEFT";
          lt.resize(legendItems[lgj].labelW + 4, legendFontSize + 4);
          lt.x = lx + legendSwatch + 6;
          lt.y = legendY + (legendItemH - (legendFontSize + 4)) / 2;
          lt.fills = [{ type: "SOLID", color: labelFallback }];
          bindPaintVar(lt, "fills", 0, varMap["chart/label"]);
          bindVar(lt, "fontSize", varMap["chart/legend-font-size-" + size]);
          bindVar(lt, "fontFamily", varMap["chart/font-family"]);
          bindVar(lt, "fontStyle", varMap["chart/label-font-weight"]);
          comp.appendChild(lt);

          lx += legendItems[lgj].w + legendGap;
        }
      }

        comp.x = si * (maxColWidth + colGap);
        comp.y = rowIndex * (maxRowHeight + rowGap);
        page.appendChild(comp);
        components.push(comp);
      }
      rowIndex++;
    }
  }
  }

  progress("Created " + components.length + " line chart variants");
  var lineSet = figma.combineAsVariants(components, page);
  lineSet.name = "Line Chart";
  return lineSet;
}

// ---------------------------------------------------------------------------
// Chart Component Set (Area)
// ---------------------------------------------------------------------------
// Line chart plus a filled region down to the baseline. The fill and the top
// stroke both bind to chart/series-1; the fill opacity and stroke weight come
// from the chart-area/* tokens. Shares the chart/* axis/grid/label scaffold.

function buildChartAreaComponentSet(varMap, page, font, resolvedComponentFloat, resolvedComponentString) {
  var resolveCompFloat =
    typeof resolvedComponentFloat === "function"
      ? resolvedComponentFloat
      : function (_path, fallback) {
          return fallback;
        };
  var resolveCompString =
    typeof resolvedComponentString === "function"
      ? resolvedComponentString
      : function (_path, fallback) {
          return fallback;
        };
  var gridDashed = resolveCompString("chart/grid-style", "solid") === "dashed";
  var gridDash = resolveCompFloat("chart/grid-dash", 4);

  var SAMPLE = [
    { label: "Jan", value: 42 },
    { label: "Feb", value: 58 },
    { label: "Mar", value: 35 },
    { label: "Apr", value: 71 },
    { label: "May", value: 49 },
    { label: "Jun", value: 63 },
  ];
  var Y_TICKS = [0, 20, 40, 60, 80];
  var MAX_SCALE = 80;
  var Y_GUTTER = 34;
  var X_GUTTER = 20;

  var seriesFallback = { r: 0.13, g: 0.55, b: 0.9 };
  var axisFallback = { r: 0.78, g: 0.82, b: 0.87 };
  var gridFallback = { r: 0.88, g: 0.9, b: 0.93 };
  var labelFallback = { r: 0.4, g: 0.44, b: 0.52 };

  var sizes = ["default"];
  var pointModes = ["off", "on"];
  var legendModes = ["off", "on"];
  var components = [];
  var colGap = 60;
  var rowGap = 60;
  var maxColWidth = 0;
  var maxRowHeight = 0;
  var rowIndex = 0;

  for (var legi = 0; legi < legendModes.length; legi++) {
    var withLegend = legendModes[legi] === "on";
    var capLegend = withLegend ? "On" : "Off";

  for (var pi = 0; pi < pointModes.length; pi++) {
    var pointMode = pointModes[pi];
    var withPoints = pointMode === "on";
    var capPoints = withPoints ? "On" : "Off";

    for (var si = 0; si < sizes.length; si++) {
      var size = sizes[si];
      var capSize = size === "default" ? "Default" : size.toUpperCase();

      var plotW = resolveCompFloat("chart/width-" + size, 320);
      var plotH = resolveCompFloat("chart/height-" + size, 180);
      var labelFontSize = resolveCompFloat("chart/label-font-size-" + size, 11);
      var pad = resolveCompFloat("chart/padding", 16);
      var axisWidth = resolveCompFloat("chart/axis-width", 1);
      var gridWidth = resolveCompFloat("chart/grid-width", 1);
      var lineWidth = resolveCompFloat("chart-area/width", 2);
      var pointRadius = resolveCompFloat("chart-area/point-radius", 3);
      var fillOpacity = Math.max(0, Math.min(1, resolveCompFloat("chart-area/fill-opacity", 20) / 100));
      var legendFontSize = resolveCompFloat("chart/legend-font-size-" + size, 12);
      var legendSwatch = resolveCompFloat("chart/legend-swatch-size", 10);
      var legendGap = resolveCompFloat("chart/legend-gap", 16);
      var legendRowH = withLegend ? Math.max(legendSwatch, legendFontSize + 4) + 14 : 0;

      var plotX = pad + Y_GUTTER;
      var plotY = pad;
      var totalW = pad * 2 + Y_GUTTER + plotW;
      var totalH = pad * 2 + X_GUTTER + plotH + legendRowH;
      maxColWidth = Math.max(maxColWidth, totalW);
      maxRowHeight = Math.max(maxRowHeight, totalH);

      var comp = figma.createComponent();
      comp.name = "Points=" + capPoints + ", Legend=" + capLegend;
      comp.layoutMode = "NONE";
      comp.resize(totalW, totalH);
      comp.fills = [];
      comp.clipsContent = false;

      // ── Gridlines + Y tick labels ──
      for (var gi = 0; gi < Y_TICKS.length; gi++) {
        var gy = plotY + plotH - (Y_TICKS[gi] / MAX_SCALE) * plotH;
        var grid = figma.createLine();
        grid.name = "Gridline";
        grid.resize(plotW, 0);
        grid.x = plotX;
        grid.y = gy;
        grid.strokeCap = "NONE";
        grid.strokes = [{ type: "SOLID", color: gridFallback }];
        grid.strokeWeight = Math.max(1, gridWidth);
        if (gridDashed) grid.dashPattern = [gridDash, gridDash];
        bindPaintVar(grid, "strokes", 0, varMap["chart/grid"]);
        bindVar(grid, "strokeWeight", varMap["chart/grid-width"]);
        comp.appendChild(grid);

        var yLabel = figma.createText();
        yLabel.fontName = font;
        yLabel.name = "Y Label";
        yLabel.characters = String(Y_TICKS[gi]);
        yLabel.fontSize = labelFontSize;
        yLabel.textAlignHorizontal = "RIGHT";
        yLabel.resize(Y_GUTTER - 6, labelFontSize + 4);
        yLabel.x = pad;
        yLabel.y = gy - (labelFontSize + 4) / 2;
        yLabel.fills = [{ type: "SOLID", color: labelFallback }];
        bindPaintVar(yLabel, "fills", 0, varMap["chart/label"]);
        bindVar(yLabel, "fontSize", varMap["chart/label-font-size-" + size]);
        bindVar(yLabel, "fontFamily", varMap["chart/font-family"]);
        bindVar(yLabel, "fontStyle", varMap["chart/label-font-weight"]);
        comp.appendChild(yLabel);
      }

      // ── Compute series points + baseline ──
      var slot = plotW / SAMPLE.length;
      var linePath = "";
      var pointCoords = [];
      for (var di = 0; di < SAMPLE.length; di++) {
        var px = plotX + di * slot + slot / 2;
        var py = plotY + plotH - (SAMPLE[di].value / MAX_SCALE) * plotH;
        pointCoords.push({ x: px, y: py });
        linePath += (di === 0 ? "M " : " L ") + px + " " + py;
      }
      var baselineY = plotY + plotH;

      // ── Filled area (closed down to the baseline) ──
      var areaPath = "";
      for (var ai = 0; ai < pointCoords.length; ai++) {
        areaPath += (ai === 0 ? "M " : " L ") + pointCoords[ai].x + " " + pointCoords[ai].y;
      }
      areaPath +=
        " L " + pointCoords[pointCoords.length - 1].x + " " + baselineY +
        " L " + pointCoords[0].x + " " + baselineY + " Z";

      var areaVec = figma.createVector();
      areaVec.name = "Area";
      comp.appendChild(areaVec);
      areaVec.x = 0;
      areaVec.y = 0;
      areaVec.vectorPaths = [{ windingRule: "NONZERO", data: areaPath }];
      areaVec.strokes = [];
      areaVec.fills = [{ type: "SOLID", color: seriesFallback, opacity: fillOpacity }];
      bindPaintVar(areaVec, "fills", 0, varMap["chart/series-1"]);

      // ── Top stroke line ──
      var lineVec = figma.createVector();
      lineVec.name = "Line";
      comp.appendChild(lineVec);
      lineVec.x = 0;
      lineVec.y = 0;
      lineVec.vectorPaths = [{ windingRule: "NONE", data: linePath }];
      lineVec.strokeWeight = Math.max(1, lineWidth);
      lineVec.strokeCap = "ROUND";
      lineVec.strokeJoin = "ROUND";
      lineVec.fills = [];
      lineVec.strokes = [{ type: "SOLID", color: seriesFallback }];
      bindPaintVar(lineVec, "strokes", 0, varMap["chart/series-1"]);
      bindVar(lineVec, "strokeWeight", varMap["chart-area/width"]);

      // ── Point markers ──
      if (withPoints) {
        for (var ci2 = 0; ci2 < pointCoords.length; ci2++) {
          var dot = figma.createEllipse();
          dot.name = "Point";
          dot.resize(pointRadius * 2, pointRadius * 2);
          dot.x = pointCoords[ci2].x - pointRadius;
          dot.y = pointCoords[ci2].y - pointRadius;
          dot.fills = [{ type: "SOLID", color: seriesFallback }];
          dot.strokes = [];
          bindPaintVar(dot, "fills", 0, varMap["chart/series-1"]);
          comp.appendChild(dot);
        }
      }

      // ── X tick labels ──
      for (var xi = 0; xi < SAMPLE.length; xi++) {
        var xLabel = figma.createText();
        xLabel.fontName = font;
        xLabel.name = "X Label";
        xLabel.characters = SAMPLE[xi].label;
        xLabel.fontSize = labelFontSize;
        xLabel.textAlignHorizontal = "CENTER";
        xLabel.resize(slot, labelFontSize + 4);
        xLabel.x = plotX + xi * slot;
        xLabel.y = plotY + plotH + 4;
        xLabel.fills = [{ type: "SOLID", color: labelFallback }];
        bindPaintVar(xLabel, "fills", 0, varMap["chart/label"]);
        bindVar(xLabel, "fontSize", varMap["chart/label-font-size-" + size]);
        bindVar(xLabel, "fontFamily", varMap["chart/font-family"]);
        bindVar(xLabel, "fontStyle", varMap["chart/label-font-weight"]);
        comp.appendChild(xLabel);
      }

      // ── Axis lines ──
      var yAxis = figma.createRectangle();
      yAxis.name = "Y Axis";
      yAxis.resize(Math.max(1, axisWidth), plotH);
      yAxis.x = plotX;
      yAxis.y = plotY;
      yAxis.fills = [{ type: "SOLID", color: axisFallback }];
      yAxis.strokes = [];
      bindPaintVar(yAxis, "fills", 0, varMap["chart/axis"]);
      bindVar(yAxis, "width", varMap["chart/axis-width"]);
      comp.appendChild(yAxis);

      var xAxis = figma.createRectangle();
      xAxis.name = "X Axis";
      xAxis.resize(plotW, Math.max(1, axisWidth));
      xAxis.x = plotX;
      xAxis.y = plotY + plotH;
      xAxis.fills = [{ type: "SOLID", color: axisFallback }];
      xAxis.strokes = [];
      bindPaintVar(xAxis, "fills", 0, varMap["chart/axis"]);
      bindVar(xAxis, "height", varMap["chart/axis-width"]);
      comp.appendChild(xAxis);

      // ── Legend (single series, centered below the plot) ──
      if (withLegend) {
        var legendItemH = Math.max(legendSwatch, legendFontSize + 4);
        var legendY = plotY + plotH + X_GUTTER + 8;
        var legendLbl = "Series 1";
        var legendLblW = Math.ceil(legendLbl.length * legendFontSize * 0.6);
        var totalLegendW = legendSwatch + 6 + legendLblW;
        var lx = plotX + (plotW - totalLegendW) / 2;
        if (lx < pad) lx = pad;

        var sw = figma.createRectangle();
        sw.name = "Legend Swatch";
        sw.resize(legendSwatch, legendSwatch);
        sw.x = lx;
        sw.y = legendY + (legendItemH - legendSwatch) / 2;
        sw.cornerRadius = 2;
        sw.fills = [{ type: "SOLID", color: seriesFallback }];
        sw.strokes = [];
        bindPaintVar(sw, "fills", 0, varMap["chart/series-1"]);
        bindVar(sw, "width", varMap["chart/legend-swatch-size"]);
        bindVar(sw, "height", varMap["chart/legend-swatch-size"]);
        comp.appendChild(sw);

        var lt = figma.createText();
        lt.fontName = font;
        lt.name = "Legend Label";
        lt.characters = legendLbl;
        lt.fontSize = legendFontSize;
        lt.textAlignHorizontal = "LEFT";
        lt.resize(legendLblW + 4, legendFontSize + 4);
        lt.x = lx + legendSwatch + 6;
        lt.y = legendY + (legendItemH - (legendFontSize + 4)) / 2;
        lt.fills = [{ type: "SOLID", color: labelFallback }];
        bindPaintVar(lt, "fills", 0, varMap["chart/label"]);
        bindVar(lt, "fontSize", varMap["chart/legend-font-size-" + size]);
        bindVar(lt, "fontFamily", varMap["chart/font-family"]);
        bindVar(lt, "fontStyle", varMap["chart/label-font-weight"]);
        comp.appendChild(lt);
      }

      comp.x = si * (maxColWidth + colGap);
      comp.y = rowIndex * (maxRowHeight + rowGap);
      page.appendChild(comp);
      components.push(comp);
    }
    rowIndex++;
  }
  }

  progress("Created " + components.length + " area chart variants");
  var areaSet = figma.combineAsVariants(components, page);
  areaSet.name = "Area Chart";
  return areaSet;
}

// ---------------------------------------------------------------------------
// Chart Component Set (Stacked Bar)
// ---------------------------------------------------------------------------
// Bars split into stacked segments. Each segment binds to a series (palette) or
// shade (shades) variable; only the top segment gets the bar-radius rounded top.
// Shares the chart/* axis/grid/label/legend scaffold and the chart-bar-* tokens.

function buildChartStackedBarComponentSet(varMap, page, font, resolvedComponentFloat, resolvedComponentString) {
  var resolveCompFloat =
    typeof resolvedComponentFloat === "function"
      ? resolvedComponentFloat
      : function (_path, fallback) {
          return fallback;
        };
  var resolveCompString =
    typeof resolvedComponentString === "function"
      ? resolvedComponentString
      : function (_path, fallback) {
          return fallback;
        };
  var gridDashed = resolveCompString("chart/grid-style", "solid") === "dashed";
  var gridDash = resolveCompFloat("chart/grid-dash", 4);

  // Segment values are capped so each stack total stays within the 0-80 axis.
  var SAMPLE = [
    { label: "Jan", v: [18, 14, 8, 5] },
    { label: "Feb", v: [22, 16, 12, 6] },
    { label: "Mar", v: [14, 10, 7, 4] },
    { label: "Apr", v: [26, 18, 14, 8] },
    { label: "May", v: [20, 12, 9, 5] },
    { label: "Jun", v: [24, 16, 10, 6] },
  ];
  var Y_TICKS = [0, 20, 40, 60, 80];
  var MAX_SCALE = 80;
  var Y_GUTTER = 34;
  var X_GUTTER = 20;

  var seriesPaths = ["chart/series-1", "chart/series-2", "chart/series-3", "chart/series-4"];
  var shadePaths = ["chart/shade-1", "chart/shade-2", "chart/shade-3", "chart/shade-4"];
  var seriesFallbacks = [
    { r: 0.13, g: 0.55, b: 0.9 }, { r: 0.0, g: 0.74, b: 0.83 },
    { r: 0.22, g: 0.74, b: 0.33 }, { r: 0.98, g: 0.62, b: 0.11 },
  ];
  var shadeFallbacks = [
    { r: 0.05, g: 0.28, b: 0.63 }, { r: 0.13, g: 0.55, b: 0.9 },
    { r: 0.4, g: 0.7, b: 0.95 }, { r: 0.66, g: 0.83, b: 0.98 },
  ];
  var axisFallback = { r: 0.78, g: 0.82, b: 0.87 };
  var gridFallback = { r: 0.88, g: 0.9, b: 0.93 };
  var labelFallback = { r: 0.4, g: 0.44, b: 0.52 };

  var sizes = ["default"];
  var colorModes = ["palette", "shades"];
  var segmentCounts = [2, 3, 4];
  var legendModes = ["off", "on"];
  var components = [];
  var colGap = 60;
  var rowGap = 60;
  var maxColWidth = 0;
  var maxRowHeight = 0;
  var rowIndex = 0;

  for (var cmi = 0; cmi < colorModes.length; cmi++) {
    var colorMode = colorModes[cmi];
    var capColor = colorMode === "shades" ? "Shades" : "Palette";
    var colorPaths = colorMode === "shades" ? shadePaths : seriesPaths;
    var colorFallbacks = colorMode === "shades" ? shadeFallbacks : seriesFallbacks;

    for (var sgi = 0; sgi < segmentCounts.length; sgi++) {
      var nSeg = segmentCounts[sgi];

      for (var lgm = 0; lgm < legendModes.length; lgm++) {
        var withLegend = legendModes[lgm] === "on";
        var capLegend = withLegend ? "On" : "Off";

        for (var si = 0; si < sizes.length; si++) {
          var size = sizes[si];
          var capSize = size === "default" ? "Default" : size.toUpperCase();

          var plotW = resolveCompFloat("chart/width-" + size, 320);
          var plotH = resolveCompFloat("chart/height-" + size, 180);
          var labelFontSize = resolveCompFloat("chart/label-font-size-" + size, 11);
          var pad = resolveCompFloat("chart/padding", 16);
          var axisWidth = resolveCompFloat("chart/axis-width", 1);
          var gridWidth = resolveCompFloat("chart/grid-width", 1);
          var barGap = resolveCompFloat("chart/bar-gap-" + size, 12);
          var barRadius = resolveCompFloat("chart/bar-radius", 2);
          var legendFontSize = resolveCompFloat("chart/legend-font-size-" + size, 12);
          var legendSwatch = resolveCompFloat("chart/legend-swatch-size", 10);
          var legendGap = resolveCompFloat("chart/legend-gap", 16);
          var legendRowH = withLegend ? Math.max(legendSwatch, legendFontSize + 4) + 14 : 0;

          var plotX = pad + Y_GUTTER;
          var plotY = pad;
          var totalW = pad * 2 + Y_GUTTER + plotW;
          var totalH = pad * 2 + X_GUTTER + plotH + legendRowH;
          maxColWidth = Math.max(maxColWidth, totalW);
          maxRowHeight = Math.max(maxRowHeight, totalH);

          var comp = figma.createComponent();
          comp.name = "Colors=" + capColor + ", Segments=" + nSeg + ", Legend=" + capLegend;
          comp.layoutMode = "NONE";
          comp.resize(totalW, totalH);
          comp.fills = [];
          comp.clipsContent = false;

          // ── Gridlines + Y tick labels ──
          for (var gi = 0; gi < Y_TICKS.length; gi++) {
            var gy = plotY + plotH - (Y_TICKS[gi] / MAX_SCALE) * plotH;
            var grid = figma.createLine();
            grid.name = "Gridline";
            grid.resize(plotW, 0);
            grid.x = plotX;
            grid.y = gy;
            grid.strokeCap = "NONE";
            grid.strokes = [{ type: "SOLID", color: gridFallback }];
            grid.strokeWeight = Math.max(1, gridWidth);
            if (gridDashed) grid.dashPattern = [gridDash, gridDash];
            bindPaintVar(grid, "strokes", 0, varMap["chart/grid"]);
            bindVar(grid, "strokeWeight", varMap["chart/grid-width"]);
            comp.appendChild(grid);

            var yLabel = figma.createText();
            yLabel.fontName = font;
            yLabel.name = "Y Label";
            yLabel.characters = String(Y_TICKS[gi]);
            yLabel.fontSize = labelFontSize;
            yLabel.textAlignHorizontal = "RIGHT";
            yLabel.resize(Y_GUTTER - 6, labelFontSize + 4);
            yLabel.x = pad;
            yLabel.y = gy - (labelFontSize + 4) / 2;
            yLabel.fills = [{ type: "SOLID", color: labelFallback }];
            bindPaintVar(yLabel, "fills", 0, varMap["chart/label"]);
            bindVar(yLabel, "fontSize", varMap["chart/label-font-size-" + size]);
            bindVar(yLabel, "fontFamily", varMap["chart/font-family"]);
            bindVar(yLabel, "fontStyle", varMap["chart/label-font-weight"]);
            comp.appendChild(yLabel);
          }

          // ── Stacked bars + X tick labels ──
          var slot = plotW / SAMPLE.length;
          var barWidth = Math.max(2, slot - barGap);
          for (var bi = 0; bi < SAMPLE.length; bi++) {
            var bx = plotX + bi * slot + (slot - barWidth) / 2;
            var cumY = plotY + plotH;
            for (var seg = 0; seg < nSeg; seg++) {
              var segH = Math.max(1, (SAMPLE[bi].v[seg] / MAX_SCALE) * plotH);
              var rectY = cumY - segH;
              var segRect = figma.createRectangle();
              segRect.name = "Segment " + (seg + 1);
              segRect.resize(barWidth, segH);
              segRect.x = bx;
              segRect.y = rectY;
              segRect.fills = [{ type: "SOLID", color: colorFallbacks[seg % colorFallbacks.length] }];
              segRect.strokes = [];
              if (seg === nSeg - 1) {
                segRect.topLeftRadius = barRadius;
                segRect.topRightRadius = barRadius;
                bindVar(segRect, "topLeftRadius", varMap["chart/bar-radius"]);
                bindVar(segRect, "topRightRadius", varMap["chart/bar-radius"]);
              }
              bindPaintVar(segRect, "fills", 0, varMap[colorPaths[seg % colorPaths.length]]);
              comp.appendChild(segRect);
              cumY = rectY;
            }

            var xLabel = figma.createText();
            xLabel.fontName = font;
            xLabel.name = "X Label";
            xLabel.characters = SAMPLE[bi].label;
            xLabel.fontSize = labelFontSize;
            xLabel.textAlignHorizontal = "CENTER";
            xLabel.resize(slot, labelFontSize + 4);
            xLabel.x = plotX + bi * slot;
            xLabel.y = plotY + plotH + 4;
            xLabel.fills = [{ type: "SOLID", color: labelFallback }];
            bindPaintVar(xLabel, "fills", 0, varMap["chart/label"]);
            bindVar(xLabel, "fontSize", varMap["chart/label-font-size-" + size]);
            bindVar(xLabel, "fontFamily", varMap["chart/font-family"]);
            bindVar(xLabel, "fontStyle", varMap["chart/label-font-weight"]);
            comp.appendChild(xLabel);
          }

          // ── Axis lines ──
          var yAxis = figma.createRectangle();
          yAxis.name = "Y Axis";
          yAxis.resize(Math.max(1, axisWidth), plotH);
          yAxis.x = plotX;
          yAxis.y = plotY;
          yAxis.fills = [{ type: "SOLID", color: axisFallback }];
          yAxis.strokes = [];
          bindPaintVar(yAxis, "fills", 0, varMap["chart/axis"]);
          bindVar(yAxis, "width", varMap["chart/axis-width"]);
          comp.appendChild(yAxis);

          var xAxis = figma.createRectangle();
          xAxis.name = "X Axis";
          xAxis.resize(plotW, Math.max(1, axisWidth));
          xAxis.x = plotX;
          xAxis.y = plotY + plotH;
          xAxis.fills = [{ type: "SOLID", color: axisFallback }];
          xAxis.strokes = [];
          bindPaintVar(xAxis, "fills", 0, varMap["chart/axis"]);
          bindVar(xAxis, "height", varMap["chart/axis-width"]);
          comp.appendChild(xAxis);

          // ── Legend ──
          if (withLegend) {
            var legendItemH = Math.max(legendSwatch, legendFontSize + 4);
            var legendY = plotY + plotH + X_GUTTER + 8;
            var legendItems = [];
            var totalLegendW = 0;
            for (var lgi = 0; lgi < nSeg; lgi++) {
              var lbl = "Series " + (lgi + 1);
              var lblW = Math.ceil(lbl.length * legendFontSize * 0.6);
              var iw = legendSwatch + 6 + lblW;
              legendItems.push({ w: iw, label: lbl, labelW: lblW });
              totalLegendW += iw;
            }
            totalLegendW += legendGap * Math.max(0, nSeg - 1);
            var lx = plotX + (plotW - totalLegendW) / 2;
            if (lx < pad) lx = pad;
            for (var lgj = 0; lgj < nSeg; lgj++) {
              var sw = figma.createRectangle();
              sw.name = "Legend Swatch";
              sw.resize(legendSwatch, legendSwatch);
              sw.x = lx;
              sw.y = legendY + (legendItemH - legendSwatch) / 2;
              sw.cornerRadius = 2;
              sw.fills = [{ type: "SOLID", color: colorFallbacks[lgj % colorFallbacks.length] }];
              sw.strokes = [];
              bindPaintVar(sw, "fills", 0, varMap[colorPaths[lgj % colorPaths.length]]);
              bindVar(sw, "width", varMap["chart/legend-swatch-size"]);
              bindVar(sw, "height", varMap["chart/legend-swatch-size"]);
              comp.appendChild(sw);

              var lt = figma.createText();
              lt.fontName = font;
              lt.name = "Legend Label";
              lt.characters = legendItems[lgj].label;
              lt.fontSize = legendFontSize;
              lt.textAlignHorizontal = "LEFT";
              lt.resize(legendItems[lgj].labelW + 4, legendFontSize + 4);
              lt.x = lx + legendSwatch + 6;
              lt.y = legendY + (legendItemH - (legendFontSize + 4)) / 2;
              lt.fills = [{ type: "SOLID", color: labelFallback }];
              bindPaintVar(lt, "fills", 0, varMap["chart/label"]);
              bindVar(lt, "fontSize", varMap["chart/legend-font-size-" + size]);
              bindVar(lt, "fontFamily", varMap["chart/font-family"]);
              bindVar(lt, "fontStyle", varMap["chart/label-font-weight"]);
              comp.appendChild(lt);

              lx += legendItems[lgj].w + legendGap;
            }
          }

          comp.x = si * (maxColWidth + colGap);
          comp.y = rowIndex * (maxRowHeight + rowGap);
          page.appendChild(comp);
          components.push(comp);
        }
        rowIndex++;
      }
    }
  }

  progress("Created " + components.length + " stacked bar chart variants");
  var stackedSet = figma.combineAsVariants(components, page);
  stackedSet.name = "Stacked Bar Chart";
  return stackedSet;
}

// ---------------------------------------------------------------------------
// Chart Component Set (Combo: bars + line)
// ---------------------------------------------------------------------------
// Bars (series-1) plus a smooth line (series-2) on shared axes, with an optional
// secondary right-hand Y axis for the line. Bar-based subtype: keeps chart-bar-*
// and adds chart-combo/line-width. Variants: Size x Right Axis x Legend.

function buildChartComboComponentSet(varMap, page, font, resolvedComponentFloat, resolvedComponentString) {
  var resolveCompFloat =
    typeof resolvedComponentFloat === "function"
      ? resolvedComponentFloat
      : function (_path, fallback) {
          return fallback;
        };
  var resolveCompString =
    typeof resolvedComponentString === "function"
      ? resolvedComponentString
      : function (_path, fallback) {
          return fallback;
        };
  var gridDashed = resolveCompString("chart/grid-style", "solid") === "dashed";
  var gridDash = resolveCompFloat("chart/grid-dash", 4);
  var curveSmooth = resolveCompString("chart-combo/line-curve", "straight") === "smooth";
  var comboLineStyle = resolveCompString("chart-combo/line-style", "solid");
  var comboLineDash = resolveCompFloat("chart-combo/line-dash", 6);

  function comboDashPattern(style, dash) {
    var d = Math.max(2, dash || 6);
    if (style === "dashed") return [d, d];
    if (style === "dotted") return [1, d];
    return [];
  }

  var SAMPLE = [
    { label: "Jan", bar: 42, line: 24 },
    { label: "Feb", bar: 58, line: 38 },
    { label: "Mar", bar: 35, line: 52 },
    { label: "Apr", bar: 71, line: 30 },
    { label: "May", bar: 49, line: 62 },
    { label: "Jun", bar: 63, line: 41 },
  ];
  var Y_TICKS = [0, 20, 40, 60, 80];
  var MAX_SCALE = 80;
  var RIGHT_TICKS = [0, 35, 70];
  var RIGHT_MAX = 70;
  var Y_GUTTER = 34;
  var X_GUTTER = 20;

  var barFallback = { r: 0.13, g: 0.55, b: 0.9 };
  var lineFallback = { r: 0.0, g: 0.74, b: 0.83 };
  var axisFallback = { r: 0.78, g: 0.82, b: 0.87 };
  var gridFallback = { r: 0.88, g: 0.9, b: 0.93 };
  var labelFallback = { r: 0.4, g: 0.44, b: 0.52 };

  function buildLinePath(pts, smooth) {
    if (!pts.length) return "";
    if (!smooth || pts.length < 3) {
      var ds = "";
      for (var k = 0; k < pts.length; k++) {
        ds += (k === 0 ? "M " : " L ") + pts[k].x + " " + pts[k].y;
      }
      return ds;
    }
    var d = "M " + pts[0].x + " " + pts[0].y;
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i];
      var p1 = pts[i];
      var p2 = pts[i + 1];
      var p3 = pts[i + 2] || p2;
      var cp1x = p1.x + (p2.x - p0.x) / 6;
      var cp1y = p1.y + (p2.y - p0.y) / 6;
      var cp2x = p2.x - (p3.x - p1.x) / 6;
      var cp2y = p2.y - (p3.y - p1.y) / 6;
      d += " C " + cp1x + " " + cp1y + " " + cp2x + " " + cp2y + " " + p2.x + " " + p2.y;
    }
    return d;
  }

  var sizes = ["default"];
  var pointModes = ["off", "on"];
  var rightModes = ["off", "on"];
  var legendModes = ["off", "on"];
  var components = [];
  var colGap = 60;
  var rowGap = 60;
  var maxColWidth = 0;
  var maxRowHeight = 0;
  var rowIndex = 0;

  for (var pmi = 0; pmi < pointModes.length; pmi++) {
    var withPoints = pointModes[pmi] === "on";
    var capPoints = withPoints ? "On" : "Off";

  for (var rai = 0; rai < rightModes.length; rai++) {
    var withRight = rightModes[rai] === "on";
    var capRight = withRight ? "On" : "Off";

    for (var lgm = 0; lgm < legendModes.length; lgm++) {
      var withLegend = legendModes[lgm] === "on";
      var capLegend = withLegend ? "On" : "Off";

      for (var si = 0; si < sizes.length; si++) {
        var size = sizes[si];
        var capSize = size === "default" ? "Default" : size.toUpperCase();

        var plotW = resolveCompFloat("chart/width-" + size, 320);
        var plotH = resolveCompFloat("chart/height-" + size, 180);
        var labelFontSize = resolveCompFloat("chart/label-font-size-" + size, 11);
        var pad = resolveCompFloat("chart/padding", 16);
        var axisWidth = resolveCompFloat("chart/axis-width", 1);
        var gridWidth = resolveCompFloat("chart/grid-width", 1);
        var barGap = resolveCompFloat("chart/bar-gap-" + size, 12);
        var barRadius = resolveCompFloat("chart/bar-radius", 2);
        var lineWidth = resolveCompFloat("chart-combo/line-width", 2);
        var legendFontSize = resolveCompFloat("chart/legend-font-size-" + size, 12);
        var legendSwatch = resolveCompFloat("chart/legend-swatch-size", 10);
        var legendGap = resolveCompFloat("chart/legend-gap", 16);
        var legendRowH = withLegend ? Math.max(legendSwatch, legendFontSize + 4) + 14 : 0;

        var rightGutter = withRight ? Y_GUTTER : X_GUTTER / 2;
        var plotX = pad + Y_GUTTER;
        var plotY = pad;
        var totalW = pad * 2 + Y_GUTTER + plotW + rightGutter;
        var totalH = pad * 2 + X_GUTTER + plotH + legendRowH;
        maxColWidth = Math.max(maxColWidth, totalW);
        maxRowHeight = Math.max(maxRowHeight, totalH);

        var comp = figma.createComponent();
        comp.name = "Points=" + capPoints + ", RightAxis=" + capRight + ", Legend=" + capLegend;
        comp.layoutMode = "NONE";
        comp.resize(totalW, totalH);
        comp.fills = [];
        comp.clipsContent = false;

        // ── Gridlines + left Y tick labels ──
        for (var gi = 0; gi < Y_TICKS.length; gi++) {
          var gy = plotY + plotH - (Y_TICKS[gi] / MAX_SCALE) * plotH;
          var grid = figma.createLine();
          grid.name = "Gridline";
          grid.resize(plotW, 0);
          grid.x = plotX;
          grid.y = gy;
          grid.strokeCap = "NONE";
          grid.strokes = [{ type: "SOLID", color: gridFallback }];
          grid.strokeWeight = Math.max(1, gridWidth);
          if (gridDashed) grid.dashPattern = [gridDash, gridDash];
          bindPaintVar(grid, "strokes", 0, varMap["chart/grid"]);
          bindVar(grid, "strokeWeight", varMap["chart/grid-width"]);
          comp.appendChild(grid);

          var yLabel = figma.createText();
          yLabel.fontName = font;
          yLabel.name = "Y Label";
          yLabel.characters = String(Y_TICKS[gi]);
          yLabel.fontSize = labelFontSize;
          yLabel.textAlignHorizontal = "RIGHT";
          yLabel.resize(Y_GUTTER - 6, labelFontSize + 4);
          yLabel.x = pad;
          yLabel.y = gy - (labelFontSize + 4) / 2;
          yLabel.fills = [{ type: "SOLID", color: labelFallback }];
          bindPaintVar(yLabel, "fills", 0, varMap["chart/label"]);
          bindVar(yLabel, "fontSize", varMap["chart/label-font-size-" + size]);
          bindVar(yLabel, "fontFamily", varMap["chart/font-family"]);
          bindVar(yLabel, "fontStyle", varMap["chart/label-font-weight"]);
          comp.appendChild(yLabel);
        }

        // ── Right Y tick labels (line scale) ──
        if (withRight) {
          for (var ri = 0; ri < RIGHT_TICKS.length; ri++) {
            var ry = plotY + plotH - (RIGHT_TICKS[ri] / RIGHT_MAX) * plotH;
            var rLabel = figma.createText();
            rLabel.fontName = font;
            rLabel.name = "Right Y Label";
            rLabel.characters = String(RIGHT_TICKS[ri]);
            rLabel.fontSize = labelFontSize;
            rLabel.textAlignHorizontal = "LEFT";
            rLabel.resize(Y_GUTTER - 6, labelFontSize + 4);
            rLabel.x = plotX + plotW + 6;
            rLabel.y = ry - (labelFontSize + 4) / 2;
            rLabel.fills = [{ type: "SOLID", color: labelFallback }];
            bindPaintVar(rLabel, "fills", 0, varMap["chart/label"]);
            bindVar(rLabel, "fontSize", varMap["chart/label-font-size-" + size]);
            bindVar(rLabel, "fontFamily", varMap["chart/font-family"]);
            bindVar(rLabel, "fontStyle", varMap["chart/label-font-weight"]);
            comp.appendChild(rLabel);
          }
        }

        // ── Bars + X tick labels ──
        var slot = plotW / SAMPLE.length;
        var barWidth = Math.max(2, slot - barGap);
        for (var bi = 0; bi < SAMPLE.length; bi++) {
          var bx = plotX + bi * slot + (slot - barWidth) / 2;
          var barH = Math.max(1, (SAMPLE[bi].bar / MAX_SCALE) * plotH);
          var bar = figma.createRectangle();
          bar.name = "Bar";
          bar.resize(barWidth, barH);
          bar.x = bx;
          bar.y = plotY + plotH - barH;
          bar.topLeftRadius = barRadius;
          bar.topRightRadius = barRadius;
          bar.fills = [{ type: "SOLID", color: barFallback }];
          bar.strokes = [];
          bindPaintVar(bar, "fills", 0, varMap["chart/series-1"]);
          bindVar(bar, "topLeftRadius", varMap["chart/bar-radius"]);
          bindVar(bar, "topRightRadius", varMap["chart/bar-radius"]);
          comp.appendChild(bar);

          var xLabel = figma.createText();
          xLabel.fontName = font;
          xLabel.name = "X Label";
          xLabel.characters = SAMPLE[bi].label;
          xLabel.fontSize = labelFontSize;
          xLabel.textAlignHorizontal = "CENTER";
          xLabel.resize(slot, labelFontSize + 4);
          xLabel.x = plotX + bi * slot;
          xLabel.y = plotY + plotH + 4;
          xLabel.fills = [{ type: "SOLID", color: labelFallback }];
          bindPaintVar(xLabel, "fills", 0, varMap["chart/label"]);
          bindVar(xLabel, "fontSize", varMap["chart/label-font-size-" + size]);
          bindVar(xLabel, "fontFamily", varMap["chart/font-family"]);
          bindVar(xLabel, "fontStyle", varMap["chart/label-font-weight"]);
          comp.appendChild(xLabel);
        }

        // ── Line (series-2), centered over each bar slot ──
        var linePts = [];
        var lineScale = withRight ? RIGHT_MAX : MAX_SCALE;
        for (var li = 0; li < SAMPLE.length; li++) {
          var lx = plotX + li * slot + slot / 2;
          var ly = plotY + plotH - (SAMPLE[li].line / lineScale) * plotH;
          linePts.push({ x: lx, y: ly });
        }
        var lineVec = figma.createVector();
        lineVec.name = "Line";
        comp.appendChild(lineVec);
        lineVec.x = 0;
        lineVec.y = 0;
        lineVec.vectorPaths = [{ windingRule: "NONE", data: buildLinePath(linePts, curveSmooth) }];
        lineVec.fills = [];
        lineVec.strokes = [{ type: "SOLID", color: lineFallback }];
        lineVec.strokeWeight = Math.max(1, lineWidth);
        lineVec.strokeCap = comboLineStyle === "dotted" ? "ROUND" : "NONE";
        lineVec.strokeJoin = "ROUND";
        var comboDash = comboDashPattern(comboLineStyle, comboLineDash);
        if (comboDash.length) lineVec.dashPattern = comboDash;
        bindPaintVar(lineVec, "strokes", 0, varMap["chart/series-2"]);
        bindVar(lineVec, "strokeWeight", varMap["chart-combo/line-width"]);

        // ── Point markers (Points variant) ──
        if (withPoints) {
          var pointR = resolveCompFloat("chart-combo/point-radius", 3);
          for (var pdi = 0; pdi < linePts.length; pdi++) {
            var dot = figma.createEllipse();
            dot.name = "Point";
            dot.resize(pointR * 2, pointR * 2);
            dot.x = linePts[pdi].x - pointR;
            dot.y = linePts[pdi].y - pointR;
            dot.fills = [{ type: "SOLID", color: lineFallback }];
            dot.strokes = [];
            bindPaintVar(dot, "fills", 0, varMap["chart/series-2"]);
            comp.appendChild(dot);
          }
        }

        // ── Axis lines ──
        var yAxis = figma.createRectangle();
        yAxis.name = "Y Axis";
        yAxis.resize(Math.max(1, axisWidth), plotH);
        yAxis.x = plotX;
        yAxis.y = plotY;
        yAxis.fills = [{ type: "SOLID", color: axisFallback }];
        yAxis.strokes = [];
        bindPaintVar(yAxis, "fills", 0, varMap["chart/axis"]);
        bindVar(yAxis, "width", varMap["chart/axis-width"]);
        comp.appendChild(yAxis);

        if (withRight) {
          var rAxis = figma.createRectangle();
          rAxis.name = "Right Y Axis";
          rAxis.resize(Math.max(1, axisWidth), plotH);
          rAxis.x = plotX + plotW;
          rAxis.y = plotY;
          rAxis.fills = [{ type: "SOLID", color: axisFallback }];
          rAxis.strokes = [];
          bindPaintVar(rAxis, "fills", 0, varMap["chart/axis"]);
          bindVar(rAxis, "width", varMap["chart/axis-width"]);
          comp.appendChild(rAxis);
        }

        var xAxis = figma.createRectangle();
        xAxis.name = "X Axis";
        xAxis.resize(plotW, Math.max(1, axisWidth));
        xAxis.x = plotX;
        xAxis.y = plotY + plotH;
        xAxis.fills = [{ type: "SOLID", color: axisFallback }];
        xAxis.strokes = [];
        bindPaintVar(xAxis, "fills", 0, varMap["chart/axis"]);
        bindVar(xAxis, "height", varMap["chart/axis-width"]);
        comp.appendChild(xAxis);

        // ── Legend (Bars + Line) ──
        if (withLegend) {
          var legendItemH = Math.max(legendSwatch, legendFontSize + 4);
          var legendY = plotY + plotH + X_GUTTER + 8;
          var comboLegend = [
            { label: "Bars", path: "chart/series-1", fallback: barFallback },
            { label: "Line", path: "chart/series-2", fallback: lineFallback },
          ];
          var legW = [];
          var totalLegendW = 0;
          for (var lgi = 0; lgi < comboLegend.length; lgi++) {
            var lblW = Math.ceil(comboLegend[lgi].label.length * legendFontSize * 0.6);
            var iw = legendSwatch + 6 + lblW;
            legW.push({ w: iw, labelW: lblW });
            totalLegendW += iw;
          }
          totalLegendW += legendGap * (comboLegend.length - 1);
          var lx2 = plotX + (plotW - totalLegendW) / 2;
          if (lx2 < pad) lx2 = pad;
          for (var lgj = 0; lgj < comboLegend.length; lgj++) {
            var sw = figma.createRectangle();
            sw.name = "Legend Swatch";
            sw.resize(legendSwatch, legendSwatch);
            sw.x = lx2;
            sw.y = legendY + (legendItemH - legendSwatch) / 2;
            sw.cornerRadius = 2;
            sw.fills = [{ type: "SOLID", color: comboLegend[lgj].fallback }];
            sw.strokes = [];
            bindPaintVar(sw, "fills", 0, varMap[comboLegend[lgj].path]);
            bindVar(sw, "width", varMap["chart/legend-swatch-size"]);
            bindVar(sw, "height", varMap["chart/legend-swatch-size"]);
            comp.appendChild(sw);

            var lt = figma.createText();
            lt.fontName = font;
            lt.name = "Legend Label";
            lt.characters = comboLegend[lgj].label;
            lt.fontSize = legendFontSize;
            lt.textAlignHorizontal = "LEFT";
            lt.resize(legW[lgj].labelW + 4, legendFontSize + 4);
            lt.x = lx2 + legendSwatch + 6;
            lt.y = legendY + (legendItemH - (legendFontSize + 4)) / 2;
            lt.fills = [{ type: "SOLID", color: labelFallback }];
            bindPaintVar(lt, "fills", 0, varMap["chart/label"]);
            bindVar(lt, "fontSize", varMap["chart/legend-font-size-" + size]);
            bindVar(lt, "fontFamily", varMap["chart/font-family"]);
            bindVar(lt, "fontStyle", varMap["chart/label-font-weight"]);
            comp.appendChild(lt);

            lx2 += legW[lgj].w + legendGap;
          }
        }

        comp.x = si * (maxColWidth + colGap);
        comp.y = rowIndex * (maxRowHeight + rowGap);
        page.appendChild(comp);
        components.push(comp);
      }
      rowIndex++;
    }
  }
  }

  progress("Created " + components.length + " combo chart variants");
  var comboSet = figma.combineAsVariants(components, page);
  comboSet.name = "Combo Chart";
  return comboSet;
}

// ---------------------------------------------------------------------------
// Chart Component Set (Donut)
// ---------------------------------------------------------------------------
// Parts-of-a-whole. Each slice is an Ellipse with arcData (an annular sector);
// the fill binds to a series (palette) or shade (shades) variable. No axes/grid.
// inner-radius (hole size) and pad-angle (slice gap) are structural and baked in
// from the chart-donut/* tokens, like the grid dash pattern elsewhere.

function buildChartDonutComponentSet(varMap, page, font, resolvedComponentFloat, resolvedComponentString) {
  var resolveCompFloat =
    typeof resolvedComponentFloat === "function"
      ? resolvedComponentFloat
      : function (_path, fallback) {
          return fallback;
        };

  // Composition sample (proportions are computed; values need not sum to 100).
  var SAMPLE = [38, 26, 18, 12, 8, 6];

  var seriesPaths = [
    "chart/series-1", "chart/series-2", "chart/series-3",
    "chart/series-4", "chart/series-5", "chart/series-6",
  ];
  var seriesFallback = [
    { r: 0.13, g: 0.55, b: 0.9 }, { r: 0.0, g: 0.74, b: 0.83 },
    { r: 0.22, g: 0.74, b: 0.33 }, { r: 0.98, g: 0.62, b: 0.11 },
    { r: 0.61, g: 0.35, b: 0.86 }, { r: 0.92, g: 0.28, b: 0.6 },
  ];
  var shadePaths = [
    "chart/shade-1", "chart/shade-2", "chart/shade-3",
    "chart/shade-4", "chart/shade-5", "chart/shade-6",
  ];
  var shadeFallback = [
    { r: 0.05, g: 0.28, b: 0.63 }, { r: 0.08, g: 0.40, b: 0.78 },
    { r: 0.13, g: 0.55, b: 0.90 }, { r: 0.35, g: 0.67, b: 0.94 },
    { r: 0.55, g: 0.78, b: 0.97 }, { r: 0.72, g: 0.86, b: 0.99 },
  ];
  var labelFallback = { r: 0.4, g: 0.44, b: 0.52 };

  var sizes = ["default"];
  var colorModes = ["palette", "shades"];
  var sliceCounts = [2, 3, 4, 5, 6];
  var legendModes = ["off", "on"];
  var components = [];
  var colGap = 60;
  var rowGap = 60;
  var maxColWidth = 0;
  var maxRowHeight = 0;
  var rowIndex = 0;

  for (var ci = 0; ci < colorModes.length; ci++) {
    var colorMode = colorModes[ci];
    var capColor = colorMode === "palette" ? "Palette" : "Shades";
    var palettePaths = colorMode === "shades" ? shadePaths : seriesPaths;
    var paletteFallback = colorMode === "shades" ? shadeFallback : seriesFallback;

    for (var sci = 0; sci < sliceCounts.length; sci++) {
      var nSlices = sliceCounts[sci];

      for (var legi = 0; legi < legendModes.length; legi++) {
        var withLegend = legendModes[legi] === "on";
        var capLegend = withLegend ? "On" : "Off";

        for (var si = 0; si < sizes.length; si++) {
          var size = sizes[si];

          var diameter = resolveCompFloat("chart/height-" + size, 180);
          var pad = resolveCompFloat("chart/padding", 16);
          var labelFontSize = resolveCompFloat("chart/label-font-size-" + size, 11);
          var legendFontSize = resolveCompFloat("chart/legend-font-size-" + size, 12);
          var legendSwatch = resolveCompFloat("chart/legend-swatch-size", 10);
          var legendGap = resolveCompFloat("chart/legend-gap", 16);
          var innerPct = resolveCompFloat("chart-donut/inner-radius", 60);
          var padDeg = resolveCompFloat("chart-donut/pad-angle", 2);
          var legendRowH = withLegend ? Math.max(legendSwatch, legendFontSize + 4) + 14 : 0;

          var innerRatio = Math.max(0, Math.min(0.95, innerPct / 100));
          var padRad = (Math.max(0, padDeg) * Math.PI) / 180;

          var outerR = diameter / 2;
          var cx = pad + outerR;
          var cy = pad + outerR;
          var totalW = pad * 2 + diameter;
          var totalH = pad * 2 + diameter + legendRowH;
          maxColWidth = Math.max(maxColWidth, totalW);
          maxRowHeight = Math.max(maxRowHeight, totalH);

          var comp = figma.createComponent();
          comp.name = "Colors=" + capColor + ", Slices=" + nSlices + ", Legend=" + capLegend;
          comp.layoutMode = "NONE";
          comp.resize(totalW, totalH);
          comp.fills = [];
          comp.clipsContent = false;

          // ── Slices (annular sectors via ellipse arcData) ──
          var total = 0;
          for (var ti = 0; ti < nSlices; ti++) total += SAMPLE[ti];
          var startA = -Math.PI / 2;
          for (var di = 0; di < nSlices; di++) {
            var frac = SAMPLE[di] / total;
            var sweep = frac * Math.PI * 2;
            var a0 = startA + padRad / 2;
            var a1 = startA + sweep - padRad / 2;
            if (a1 <= a0) a1 = a0 + 0.0001;

            var slice = figma.createEllipse();
            slice.name = "Slice " + (di + 1);
            slice.resize(diameter, diameter);
            slice.x = cx - outerR;
            slice.y = cy - outerR;
            slice.arcData = { startingAngle: a0, endingAngle: a1, innerRadius: innerRatio };
            slice.fills = [{ type: "SOLID", color: paletteFallback[di % paletteFallback.length] }];
            slice.strokes = [];
            bindPaintVar(slice, "fills", 0, varMap[palettePaths[di % palettePaths.length]]);
            comp.appendChild(slice);

            startA += sweep;
          }

          // ── Legend (swatch + label per slice, centered below the donut) ──
          if (withLegend) {
            var legendItemH = Math.max(legendSwatch, legendFontSize + 4);
            var legendY = pad + diameter + 8;
            var legendItems = [];
            var totalLegendW = 0;
            for (var lgi = 0; lgi < nSlices; lgi++) {
              var lbl = "Series " + (lgi + 1);
              var lblW = Math.ceil(lbl.length * legendFontSize * 0.6);
              var iw = legendSwatch + 6 + lblW;
              legendItems.push({ w: iw, label: lbl, labelW: lblW });
              totalLegendW += iw;
            }
            totalLegendW += legendGap * Math.max(0, nSlices - 1);
            var lx = cx - totalLegendW / 2;
            if (lx < pad) lx = pad;
            for (var lgj = 0; lgj < nSlices; lgj++) {
              var sw = figma.createRectangle();
              sw.name = "Legend Swatch";
              sw.resize(legendSwatch, legendSwatch);
              sw.x = lx;
              sw.y = legendY + (legendItemH - legendSwatch) / 2;
              sw.cornerRadius = 2;
              sw.fills = [{ type: "SOLID", color: paletteFallback[lgj % paletteFallback.length] }];
              sw.strokes = [];
              bindPaintVar(sw, "fills", 0, varMap[palettePaths[lgj % palettePaths.length]]);
              bindVar(sw, "width", varMap["chart/legend-swatch-size"]);
              bindVar(sw, "height", varMap["chart/legend-swatch-size"]);
              comp.appendChild(sw);

              var lt = figma.createText();
              lt.fontName = font;
              lt.name = "Legend Label";
              lt.characters = legendItems[lgj].label;
              lt.fontSize = legendFontSize;
              lt.textAlignHorizontal = "LEFT";
              lt.resize(legendItems[lgj].labelW + 4, legendFontSize + 4);
              lt.x = lx + legendSwatch + 6;
              lt.y = legendY + (legendItemH - (legendFontSize + 4)) / 2;
              lt.fills = [{ type: "SOLID", color: labelFallback }];
              bindPaintVar(lt, "fills", 0, varMap["chart/label"]);
              bindVar(lt, "fontSize", varMap["chart/legend-font-size-" + size]);
              bindVar(lt, "fontFamily", varMap["chart/font-family"]);
              bindVar(lt, "fontStyle", varMap["chart/label-font-weight"]);
              comp.appendChild(lt);

              lx += legendItems[lgj].w + legendGap;
            }
          }

          comp.x = si * (maxColWidth + colGap);
          comp.y = rowIndex * (maxRowHeight + rowGap);
          page.appendChild(comp);
          components.push(comp);
        }
        rowIndex++;
      }
    }
  }

  progress("Created " + components.length + " donut chart variants");
  var donutSet = figma.combineAsVariants(components, page);
  donutSet.name = "Donut Chart";
  return donutSet;
}

// ---------------------------------------------------------------------------
// Pill Component Set
// ---------------------------------------------------------------------------

function buildPillComponentSet(varMap, page, font) {
  var sizes = ["default", "xs", "sm", "md", "lg", "xl"];
  var removeModes = ["off", "on"];
  var components = [];
  var colWidth = 200;
  var rowHeight = 70;
  var gap = 20;

  for (var ri = 0; ri < removeModes.length; ri++) {
    var removeMode = removeModes[ri];
    var withRemove = removeMode === "on";
    var capRemove = withRemove ? "On" : "Off";

    for (var si = 0; si < sizes.length; si++) {
      var size = sizes[si];
      var capSize = size === "default" ? "Default" : size.toUpperCase();
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
      comp.paddingTop = 4;
      comp.paddingBottom = 4;
      comp.cornerRadius = 12;
      comp.fills = [{ type: "SOLID", color: { r: 0.92, g: 0.96, b: 1 } }];
      comp.strokes = [{ type: "SOLID", color: { r: 0.78, g: 0.82, b: 0.87 } }];
      comp.strokeWeight = 1;
      comp.strokeAlign = "INSIDE";

      bindPaintVar(comp, "fills", 0, varMap["pill/background"]);
      bindPaintVar(comp, "strokes", 0, varMap["pill/border"]);
      bindVar(comp, "strokeWeight", varMap["pill/border-width"]);
      bindVar(comp, "paddingLeft", varMap["pill/padding-x-" + size]);
      bindVar(comp, "paddingRight", varMap["pill/padding-x-" + size]);
      bindVar(comp, "paddingTop", varMap["pill/padding-y-" + size]);
      bindVar(comp, "paddingBottom", varMap["pill/padding-y-" + size]);
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
      bindVar(label, "fontFamily", varMap["pill/font-family"]);
      bindVar(label, "fontStyle", varMap["pill/font-weight"]);
      bindVar(label, "lineHeight", varMap["pill/line-height-" + size]);
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
  var variantColorPairs = [];
  variantColorPairs.push({ variant: "default", color: "default" });
  variantColorPairs.push({ variant: "light", color: "default" });
  var filledOutlineColors = ["default", "success", "warning", "error"];
  for (var foci = 0; foci < filledOutlineColors.length; foci++) {
    variantColorPairs.push({ variant: "filled", color: filledOutlineColors[foci] });
  }
  for (var ooci = 0; ooci < filledOutlineColors.length; ooci++) {
    variantColorPairs.push({ variant: "outline", color: filledOutlineColors[ooci] });
  }

  // 10 (variant×color) × 2 (circle) × 6 sizes × 6 radii = 720 — matches badge token scales in componentTokens.
  // If combineAsVariants fails on very large files, trim sizes/radii arrays here (variables still carry full scales).
  var sizes = ["default", "xs", "sm", "md", "lg", "xl"];
  var radii = ["default", "xs", "sm", "md", "lg", "xl"];
  var circles = ["off", "on"];
  var components = [];

  var circleSizeBySize = { default: 20, xs: 16, sm: 18, md: 20, lg: 24, xl: 28 };
  var colWidth = 260;
  var rowHeight = 72;
  var gap = 18;

  function cap(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function formatBadgeColorLabel(c) {
    return c === "default" ? "Default" : cap(c);
  }

  function colorPath(variant, color, property) {
    if ((variant === "filled" || variant === "outline") && color && color !== "default") {
      return "badge/" + variant + "-" + color + "-" + property;
    }
    return "badge/" + variant + "-" + property;
  }

  for (var vi = 0; vi < variantColorPairs.length; vi++) {
    var pair = variantColorPairs[vi];
    var variant = pair.variant;
    var color = pair.color;
    var capVariant = cap(variant);
    var capColor = formatBadgeColorLabel(color);

    for (var ci = 0; ci < circles.length; ci++) {
      var circleMode = circles[ci];
      var isCircle = circleMode === "on";
      var capCircle = isCircle ? "On" : "Off";

      for (var si = 0; si < sizes.length; si++) {
        var size = sizes[si];
        var capSize = size === "default" ? "Default" : size.toUpperCase();
        var circleSize = circleSizeBySize[size];

        for (var ri = 0; ri < radii.length; ri++) {
          var radius = radii[ri];
          var capRadius = radius === "default" ? "Default" : radius.toUpperCase();

          var comp = figma.createComponent();
          comp.name =
            "Variant=" + capVariant +
            ", Color=" + capColor +
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
          comp.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
          comp.strokes = [{ type: "SOLID", color: { r: 0.13, g: 0.55, b: 0.9 } }];
          comp.strokeWeight = 1;
          comp.strokeAlign = "INSIDE";

          bindPaintVar(comp, "fills", 0, varMap[colorPath(variant, color, "background")]);
          bindPaintVar(comp, "strokes", 0, varMap[colorPath(variant, color, "border")]);
          bindVar(comp, "strokeWeight", varMap["badge/border-width"]);
          bindVar(comp, "paddingLeft", varMap["badge/padding-x-" + size]);
          bindVar(comp, "paddingRight", varMap["badge/padding-x-" + size]);
          if (!isCircle) {
            bindVar(comp, "paddingTop", varMap["badge/padding-y-" + size]);
            bindVar(comp, "paddingBottom", varMap["badge/padding-y-" + size]);
          }
          bindVar(comp, "topLeftRadius", varMap["badge/radius-" + radius]);
          bindVar(comp, "topRightRadius", varMap["badge/radius-" + radius]);
          bindVar(comp, "bottomLeftRadius", varMap["badge/radius-" + radius]);
          bindVar(comp, "bottomRightRadius", varMap["badge/radius-" + radius]);

          if (isCircle) {
            comp.minWidth = circleSize;
            comp.maxWidth = circleSize;
            comp.minHeight = circleSize;
            comp.maxHeight = circleSize;
          }

          var label = figma.createText();
          label.name = "Label";
          label.fontName = font;
          label.characters = isCircle ? "8" : "Badge";
          label.fontSize = 12;
          label.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
          bindPaintVar(label, "fills", 0, varMap[colorPath(variant, color, "text")]);
          bindVar(label, "fontSize", varMap["badge/font-size-" + size]);
          bindVar(label, "fontFamily", varMap["badge/font-family"]);
          bindVar(label, "fontStyle", varMap["badge/font-weight"]);
          bindVar(label, "lineHeight", varMap["badge/line-height-" + size]);
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
  var componentSet;
  try {
    componentSet = figma.combineAsVariants(components, page);
  } catch (combineErr) {
    progress("Badge combineAsVariants failed: " + String(combineErr));
    throw combineErr;
  }
  componentSet.name = "Badge";
  return componentSet;
}

// ---------------------------------------------------------------------------
// TextInput
// ---------------------------------------------------------------------------

async function buildTextInputComponentSet(varMap, page, font) {
  var variants = ["default", "filled"];
  var sizes = ["default", "xs", "sm", "md", "lg", "xl"];
  var radii = ["default", "xs", "sm", "md", "lg", "xl"];
  var states = ["default", "hover", "focus", "error", "disabled"];
  var labelModes = ["none", "label", "required"];
  var leftIconModes = ["off", "on"];
  var rightIconModes = ["off", "on"];
  var components = [];
  var iconComponents = await findTextInputIconComponents();

  var sizeHeights = { default: 36, xs: 30, sm: 36, md: 42, lg: 50, xl: 60 };
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

      for (var lii = 0; lii < leftIconModes.length; lii++) {
        var leftMode = leftIconModes[lii];
        var hasLeftIcon = leftMode === "on";
        var capLeftIcon = hasLeftIcon ? "On" : "Off";

        for (var rii = 0; rii < rightIconModes.length; rii++) {
          var rightMode = rightIconModes[rii];
          var hasRightIcon = rightMode === "on";
          var capRightIcon = hasRightIcon ? "On" : "Off";

      for (var si = 0; si < sizes.length; si++) {
        var size = sizes[si];
        var capSize = size === "default" ? "Default" : size.toUpperCase();

      var variantRadii = variant === "default" ? ["default"] : radii;
      for (var ri = 0; ri < variantRadii.length; ri++) {
        var rad = variantRadii[ri];
          var capRad = rad === "default" ? "Default" : rad.toUpperCase();

          for (var sti = 0; sti < states.length; sti++) {
            var state = states[sti];
            var capState = state.charAt(0).toUpperCase() + state.slice(1);

            var comp = figma.createComponent();
            comp.name =
              "Variant=" + capVariant +
              ", Size=" + capSize +
              ", Radius=" + capRad +
              ", State=" + capState +
              ", Label=" + capLabelMode +
              ", LeftIcon=" + capLeftIcon +
              ", RightIcon=" + capRightIcon;

            // Root: vertical auto-layout
            comp.layoutMode = "VERTICAL";
            comp.primaryAxisSizingMode = "AUTO";
            comp.counterAxisSizingMode = "FIXED";
            comp.itemSpacing = 4;
            comp.fills = [];
            try { comp.layoutSizingHorizontal = "FIXED"; } catch (_sizeModeErr) {}

            var textInputLabelGapVar =
              varMap["textinput/label-gap-" + size] ||
              varMap["textinput/label-gap-default"] ||
              varMap["textinput/label-gap"];
            if (textInputLabelGapVar) {
              bindVar(comp, "itemSpacing", textInputLabelGapVar);
            }

            // --- Optional label row ---
            if (hasLabel) {
              var labelRow = figma.createFrame();
              labelRow.name = "LabelRow";
              labelRow.layoutMode = "HORIZONTAL";
              labelRow.primaryAxisSizingMode = "AUTO";
              labelRow.counterAxisSizingMode = "AUTO";
              labelRow.layoutAlign = "STRETCH";
              labelRow.itemSpacing = 2;
              labelRow.fills = [];
              try { labelRow.layoutSizingHorizontal = "FILL"; } catch (_labelSizeModeErr) {}

              var labelNode = figma.createText();
              labelNode.name = "Label";
              labelNode.fontName = font;
              labelNode.characters = "Label";
              labelNode.fontSize = 14;
              labelNode.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
              if (state === "disabled" && varMap["textinput/label-color-disabled"]) {
                bindPaintVar(labelNode, "fills", 0, varMap["textinput/label-color-disabled"]);
              } else if (varMap["textinput/label-color"]) {
                bindPaintVar(labelNode, "fills", 0, varMap["textinput/label-color"]);
              }
              var textInputLabelFontSizeVar =
                varMap["textinput/label-font-size-" + size] ||
                varMap["textinput/label-font-size-default"] ||
                varMap["textinput/label-font-size"];
              if (textInputLabelFontSizeVar) {
                bindVar(labelNode, "fontSize", textInputLabelFontSizeVar);
                bindVar(labelNode, "fontFamily", varMap["textinput/label-font-family"]);
                bindVar(labelNode, "fontStyle", varMap["textinput/label-font-weight"]);
                bindVar(labelNode, "lineHeight", varMap["textinput/label-line-height"]);
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
                if (textInputLabelFontSizeVar) {
                  bindVar(asteriskNode, "fontSize", textInputLabelFontSizeVar);
                  bindVar(asteriskNode, "fontFamily", varMap["textinput/label-font-family"]);
                  bindVar(asteriskNode, "fontStyle", varMap["textinput/label-font-weight"]);
                  bindVar(asteriskNode, "lineHeight", varMap["textinput/label-line-height"]);
                }
                labelRow.appendChild(asteriskNode);
              }

              comp.appendChild(labelRow);
            }

            // --- Input frame ---
            var input = figma.createFrame();
            input.name = "Input";
            input.layoutMode = "HORIZONTAL";
            input.primaryAxisSizingMode = "AUTO";
            input.counterAxisSizingMode = "AUTO";
            input.layoutAlign = "STRETCH";
            input.primaryAxisAlignItems = "MIN";
            input.counterAxisAlignItems = "CENTER";
            input.resize(colWidth, sizeHeights[size]);
            try { input.layoutSizingHorizontal = "FILL"; } catch (_inputSizeModeErr) {}
            input.cornerRadius = 4;
            input.paddingLeft = 10;
            input.paddingRight = 10;
            input.paddingTop = 0;
            input.paddingBottom = 0;
            input.minHeight = sizeHeights[size];
            input.itemSpacing = 8;

            // Bind input dimensions (size-based)
            if (varMap["textinput/height-" + size]) {
              bindVar(input, "minHeight", varMap["textinput/height-" + size]);
            }
            if (varMap["textinput/padding-x-" + size]) {
              bindVar(input, "paddingLeft", varMap["textinput/padding-x-" + size]);
              bindVar(input, "paddingRight", varMap["textinput/padding-x-" + size]);
            }
            var textInputPaddingYVar =
              varMap["textinput/padding-y-" + size] ||
              varMap["textinput/padding-y-default"] ||
              varMap["textinput/padding-y"];
            if (textInputPaddingYVar) {
              bindVar(input, "paddingTop", textInputPaddingYVar);
              bindVar(input, "paddingBottom", textInputPaddingYVar);
            }
            var textInputIconGapVar =
              varMap["textinput/icon-gap-" + size] ||
              varMap["textinput/icon-gap-default"] ||
              varMap["textinput/icon-gap"];
            if (textInputIconGapVar) {
              bindVar(input, "itemSpacing", textInputIconGapVar);
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

            var textInputIconColorPath = state === "disabled"
              ? "textinput/text-disabled"
              : (state === "focus" ? "textinput/text" : "textinput/placeholder");

            function appendTextInputIcon(iconComp, iconName) {
              if (!iconComp) return null;
              var iconInst = iconComp.createInstance();
              iconInst.name = iconName;
              try { iconInst.resize(16, 16); } catch (_resizeErr) {}
              var vectors = iconInst.findAll(function(n) { return n.type === "VECTOR"; });
              for (var vci = 0; vci < vectors.length; vci++) {
                if (vectors[vci].strokes && vectors[vci].strokes.length > 0 && varMap[textInputIconColorPath]) {
                  vectors[vci].strokes = [{ type: "SOLID", color: { r: 0.4, g: 0.4, b: 0.4 } }];
                  bindPaintVar(vectors[vci], "strokes", 0, varMap[textInputIconColorPath]);
                }
                if (vectors[vci].fills && vectors[vci].fills.length > 0 && varMap[textInputIconColorPath]) {
                  vectors[vci].fills = [{ type: "SOLID", color: { r: 0.4, g: 0.4, b: 0.4 } }];
                  bindPaintVar(vectors[vci], "fills", 0, varMap[textInputIconColorPath]);
                }
              }
              return iconInst;
            }

            if (hasLeftIcon) {
              var leftIconNode = appendTextInputIcon(iconComponents.left || iconComponents.fallback, "LeftIcon");
              if (leftIconNode) input.appendChild(leftIconNode);
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
              bindVar(textNode, "fontFamily", varMap["textinput/font-family"]);
              bindVar(textNode, "fontStyle", varMap["textinput/font-weight"]);
              bindVar(textNode, "lineHeight", varMap["textinput/line-height-" + size]);
            }

            // Keep text independent from icon instances.
            textNode.layoutGrow = 1;
            input.appendChild(textNode);

            if (hasRightIcon) {
              var rightIconNode = appendTextInputIcon(iconComponents.right || iconComponents.fallback, "RightIcon");
              if (rightIconNode) input.appendChild(rightIconNode);
            }

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
                bindVar(errorNode, "fontFamily", varMap["textinput/error-font-family"]);
                bindVar(errorNode, "fontStyle", varMap["textinput/error-font-weight"]);
                bindVar(errorNode, "lineHeight", varMap["textinput/error-line-height"]);
              }
              comp.appendChild(errorNode);
            }

            // Keep a fixed-width root with auto-computed height from children,
            // so the instance bounds match the full visible rectangle.
            try {
              comp.resize(colWidth, comp.height);
            } catch (_rootResizeErr) {}

            // Grid placement
            var colIndex = (((vi * labelModes.length + li) * leftIconModes.length + lii) * rightIconModes.length + rii);
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

async function findTextInputIconComponents() {
  var result = { left: null, right: null, fallback: null };
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

  for (var j = 0; j < iconCandidates.length; j++) {
    var name = String(iconCandidates[j].name || "").toLowerCase();
    var normalized = name.replace(/[\s_\-\/]+/g, "");
    if (!result.left && (
      normalized.indexOf("search") >= 0 ||
      normalized.indexOf("mail") >= 0 ||
      normalized.indexOf("user") >= 0 ||
      normalized.indexOf("check") >= 0
    )) {
      result.left = iconCandidates[j];
    }
    if (!result.right && (
      normalized.indexOf("xclose") >= 0 ||
      normalized.indexOf("close") >= 0 ||
      normalized.indexOf("eye") >= 0 ||
      normalized.indexOf("chevrondown") >= 0 ||
      normalized.indexOf("chevronright") >= 0
    )) {
      result.right = iconCandidates[j];
    }
  }

  if (iconCandidates.length > 0) {
    var sorted = iconCandidates.slice().sort(function(a, b) {
      return a.name.localeCompare(b.name);
    });
    result.fallback = sorted[0];
  }

  if (result.left) progress("[TextInput] Left icon source: " + result.left.name);
  if (result.right) progress("[TextInput] Right icon source: " + result.right.name);
  if (!result.left || !result.right) {
    progress("[TextInput] Warning: could not find both icon sources; using fallback when needed.");
  }

  return result;
}

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

async function buildSelectComponentSet(varMap, page, font) {
  function createSelectSwapRefs(iconComp) {
    var refs = [];
    if (!iconComp) return refs;
    try {
      var mainComp = iconComp.mainComponent || iconComp;
      if (mainComp && mainComp.key) refs.push(mainComp.key);
    } catch (_err) {}
    if (iconComp.key) refs.push(iconComp.key);
    if (iconComp.id) refs.push(iconComp.id);
    return refs;
  }

  var variants = ["default", "filled"];
  var sizes = ["default", "xs", "sm", "md", "lg", "xl"];
  var radii = ["default", "xs", "sm", "md", "lg", "xl"];
  var states = ["default", "hover", "focus", "error", "disabled"];
  var dropdownModes = ["closed", "open"];
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

  var sizeHeights = { default: 36, xs: 30, sm: 36, md: 42, lg: 50, xl: 60 };
  var gap = 20;
  var colWidth = 220;
  // Dense vertical packing: each column tracks its own running Y so short
  // (closed) and tall (open) variants sit flush with a uniform gap instead of
  // leaving large empty reserved rows. This matches the clean TextInput grid.
  var selectColYCursors = {};
  var rowGap = 20;

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
        var capSize = size === "default" ? "Default" : size.toUpperCase();

        for (var ri = 0; ri < radii.length; ri++) {
          var rad = radii[ri];
          var capRad = rad === "default" ? "Default" : rad.toUpperCase();

          for (var sti = 0; sti < states.length; sti++) {
            var state = states[sti];
            var capState = state.charAt(0).toUpperCase() + state.slice(1);
            for (var dmi = 0; dmi < dropdownModes.length; dmi++) {
              var dropdownMode = dropdownModes[dmi];
              if ((state === "disabled" || state === "error") && dropdownMode === "open") continue;
              var capDropdown = dropdownMode === "open" ? "Open" : "Closed";
              var activeOptionIndices = [-1];
              var hoverOptionIndices = [-1];
              if (dropdownMode === "open" && state === "default") {
                // Figma default open state: option one is active; no hover row.
                activeOptionIndices = [0];
                hoverOptionIndices = [-1];
                // Memory guard: full Active/Hover controls only on default size + default radius.
                if (size === "default" && rad === "default") {
                  activeOptionIndices = [0, -1, 1, 2];
                  hoverOptionIndices = [-1, 0, 1, 2];
                }
              }
              for (var aoi = 0; aoi < activeOptionIndices.length; aoi++) {
                var activeOptionIndex = activeOptionIndices[aoi];
                var activeOptionName = activeOptionIndex < 0 ? "Off" : activeOptionIndex === 0 ? "One" : activeOptionIndex === 1 ? "Two" : "Three";
                for (var hoi = 0; hoi < hoverOptionIndices.length; hoi++) {
                  var hoverOptionIndex = hoverOptionIndices[hoi];
                  var hoverOptionName = hoverOptionIndex < 0 ? "Off" : hoverOptionIndex === 0 ? "One" : hoverOptionIndex === 1 ? "Two" : "Three";
                  var comp = figma.createComponent();
                  comp.name =
                    "Variant=" + capVariant +
                    ", Size=" + capSize +
                    ", Radius=" + capRad +
                    ", State=" + capState +
                    ", Label=" + capLabelMode +
                    ", Dropdown=" + capDropdown +
                    ", Active=" + activeOptionName +
                    ", Hover=" + hoverOptionName;
            comp.layoutMode = "VERTICAL";
            comp.primaryAxisSizingMode = "AUTO";
            comp.counterAxisSizingMode = "AUTO";
            comp.itemSpacing = 4;
            comp.fills = [];

            var selectLabelGapVar =
              varMap["select/label-gap-" + size] ||
              varMap["select/label-gap-default"] ||
              varMap["select/label-gap"];
            if (selectLabelGapVar) {
              bindVar(comp, "itemSpacing", selectLabelGapVar);
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
              var selectLabelFontSizeVar =
                varMap["select/label-font-size-" + size] ||
                varMap["select/label-font-size-default"] ||
                varMap["select/label-font-size"];
              if (selectLabelFontSizeVar) {
                bindVar(labelNode, "fontSize", selectLabelFontSizeVar);
                bindVar(labelNode, "fontFamily", varMap["select/label-font-family"]);
                bindVar(labelNode, "fontStyle", varMap["select/label-font-weight"]);
                bindVar(labelNode, "lineHeight", varMap["select/label-line-height"]);
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
                if (selectLabelFontSizeVar) {
                  bindVar(asteriskNode, "fontSize", selectLabelFontSizeVar);
                  bindVar(asteriskNode, "fontFamily", varMap["select/label-font-family"]);
                  bindVar(asteriskNode, "fontStyle", varMap["select/label-font-weight"]);
                  bindVar(asteriskNode, "lineHeight", varMap["select/label-line-height"]);
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
            input.primaryAxisAlignItems = variant === "default" ? "MIN" : "SPACE_BETWEEN";
            input.counterAxisAlignItems = "CENTER";
            input.resize(colWidth, sizeHeights[size] || 36);
            input.cornerRadius = 4;
            input.paddingLeft = 10;
            input.paddingRight = 10;
            input.paddingTop = 8;
            input.paddingBottom = 8;
            input.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
            input.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
            input.strokeWeight = 1;
            input.strokeAlign = "INSIDE";

            var selectPaddingXVar =
              varMap["select/" + variant + "-padding-x-" + size] ||
              varMap["select/" + variant + "-padding-x-default"] ||
              varMap["select/" + variant + "-padding-x"];
            var selectPaddingYVar =
              varMap["select/" + variant + "-padding-y-" + size] ||
              varMap["select/" + variant + "-padding-y-default"] ||
              varMap["select/" + variant + "-padding-y"];
            var selectSectionSizeVar =
              varMap["select/icon-size-" + size] ||
              varMap["select/icon-size-default"] ||
              varMap["select/icon-size"] ||
              varMap["select/section-size-" + size] ||
              varMap["select/section-size-default"] ||
              varMap["select/section-size"];

            if (selectPaddingXVar) {
              bindVar(input, "paddingLeft", selectPaddingXVar);
              bindVar(input, "paddingRight", selectPaddingXVar);
            }
            if (selectPaddingYVar) {
              bindVar(input, "paddingTop", selectPaddingYVar);
              bindVar(input, "paddingBottom", selectPaddingYVar);
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
              var placeholderPath = "select/" + variant + "-placeholder" + (state === "error" ? "-error" : "");
              var placeholderVar = selectVarWithFallback(varMap, [
                placeholderPath,
                state === "error" ? "select/placeholder-error" : null,
                "select/" + variant + "-placeholder",
              ]);
              if (placeholderVar) {
                bindPaintVar(valueNode, "fills", 0, placeholderVar);
              } else {
                var placeholderFallback = resolvedComponentColor(
                  placeholderPath,
                  resolvedComponentColor(
                    state === "error" ? "select/placeholder-error" : null,
                    { r: 0.6, g: 0.6, b: 0.6, a: 1 }
                  )
                );
                valueNode.fills = [{
                  type: "SOLID",
                  color: {
                    r: placeholderFallback.r,
                    g: placeholderFallback.g,
                    b: placeholderFallback.b,
                  },
                  opacity: placeholderFallback.a,
                }];
              }
            }
            var selectFontFamilyVar = selectVarWithFallback(varMap, [
              "select/" + variant + "-font-family",
              "select/font-family-default",
              "select/font-family",
            ]);
            var selectFontWeightVar = selectVarWithFallback(varMap, [
              "select/" + variant + "-font-weight",
              "select/font-weight-default",
              "select/font-weight",
            ]);
            var selectLineHeightVar =
              varMap["select/line-height-" + size] ||
              varMap["select/line-height-default"] ||
              varMap["select/line-height"];
            if (varMap["select/font-size-" + size]) {
              bindVar(valueNode, "fontSize", varMap["select/font-size-" + size]);
              if (selectFontFamilyVar) bindVar(valueNode, "fontFamily", selectFontFamilyVar);
              if (selectFontWeightVar) bindVar(valueNode, "fontStyle", selectFontWeightVar);
              if (selectLineHeightVar) bindVar(valueNode, "lineHeight", selectLineHeightVar);
            }
            var isDefaultVariant = variant === "default";
            var triggerContent = null;
            if (isDefaultVariant) {
              triggerContent = figma.createFrame();
              triggerContent.name = "TriggerContent";
              triggerContent.layoutMode = "HORIZONTAL";
              triggerContent.primaryAxisSizingMode = "AUTO";
              triggerContent.counterAxisSizingMode = "AUTO";
              triggerContent.primaryAxisAlignItems = "MIN";
              triggerContent.counterAxisAlignItems = "CENTER";
              triggerContent.itemSpacing = 8;
              triggerContent.fills = [];
              triggerContent.strokes = [];
              input.appendChild(triggerContent);
              triggerContent.appendChild(valueNode);
            } else {
              input.appendChild(valueNode);
            }

            var chevronSlot = figma.createFrame();
            chevronSlot.name = "ChevronSlot";
            chevronSlot.layoutMode = "HORIZONTAL";
            chevronSlot.primaryAxisSizingMode = "AUTO";
            chevronSlot.counterAxisSizingMode = "AUTO";
            chevronSlot.primaryAxisAlignItems = "CENTER";
            chevronSlot.counterAxisAlignItems = "CENTER";
            chevronSlot.fills = [];
            chevronSlot.strokes = [];
            if (isDefaultVariant && triggerContent) triggerContent.appendChild(chevronSlot);
            else input.appendChild(chevronSlot);

            var selectIconPaintVar =
              state === "disabled" && varMap["select/icon-disabled"]
                ? varMap["select/icon-disabled"]
                : state === "error" && varMap["select/icon-error"]
                  ? varMap["select/icon-error"]
                  : varMap["select/icon"];
            var selectIconStrokeVar =
              varMap["select/icon-stroke-width-" + size] ||
              varMap["select/icon-stroke-width-default"] ||
              varMap["select/icon-stroke-width"];

            if (chevronIconComp) {
              var chevronInstance = chevronIconComp.createInstance();
              chevronInstance.name = "Chevron";
              try {
                chevronInstance.resizeWithoutConstraints(12, 12);
              } catch (e) {
                // Keep default icon size if resize is not allowed.
              }
              if (selectSectionSizeVar) {
                bindVar(chevronInstance, "width", selectSectionSizeVar);
                bindVar(chevronInstance, "height", selectSectionSizeVar);
              }
              chevronSlot.appendChild(chevronInstance);
              try { chevronInstance.layoutGrow = 0; } catch (_growErr) {}
              try { chevronInstance.layoutAlign = "CENTER"; } catch (_alignErr) {}

              // Mirror other components: expose icon as INSTANCE_SWAP on each Select variant.
              if (typeof comp.addComponentProperty === "function") {
                var selectSwapRefs = createSelectSwapRefs(chevronIconComp);
                var selectSwapProp = null;
                var selectSwapErr = null;
                for (var ssri = 0; ssri < selectSwapRefs.length; ssri++) {
                  try {
                    selectSwapProp = comp.addComponentProperty("Chevron", "INSTANCE_SWAP", selectSwapRefs[ssri]);
                    break;
                  } catch (eSwap) {
                    selectSwapErr = eSwap;
                  }
                }
                if (selectSwapProp) {
                  try {
                    chevronInstance.componentPropertyReferences = { mainComponent: selectSwapProp };
                  } catch (_swapRefErr) {}
                } else if (selectSwapErr) {
                  progress("[Select] Chevron INSTANCE_SWAP create failed: " + String(selectSwapErr));
                }
              }
              if (selectIconPaintVar && typeof chevronInstance.findAll === "function") {
                var chevronVectors = chevronInstance.findAll(function (n) {
                  return n.type === "VECTOR";
                });
                for (var cvi = 0; cvi < chevronVectors.length; cvi++) {
                  try {
                    if (selectIconStrokeVar) {
                      bindVar(chevronVectors[cvi], "strokeWeight", selectIconStrokeVar);
                    }
                    if (chevronVectors[cvi].strokes && chevronVectors[cvi].strokes.length > 0) {
                      bindPaintVar(chevronVectors[cvi], "strokes", 0, selectIconPaintVar);
                    }
                  } catch (_cv) {}
                }
              }
            } else {
              var chevronVector = figma.createVector();
              chevronVector.name = "Chevron";
              chevronVector.vectorPaths = [{ windingRule: "NONZERO", data: "M 1 1 L 6 6 L 11 1" }];
              chevronVector.resize(12, 6);
              if (selectSectionSizeVar) {
                bindVar(chevronVector, "width", selectSectionSizeVar);
                bindVar(chevronVector, "height", selectSectionSizeVar);
              }
              chevronVector.fills = [];
              chevronVector.strokes = [{ type: "SOLID", color: { r: 0.45, g: 0.45, b: 0.45 } }];
              chevronVector.strokeWeight = 1.5;
              if (selectIconStrokeVar) bindVar(chevronVector, "strokeWeight", selectIconStrokeVar);
              chevronVector.strokeJoin = "ROUND";
              chevronVector.strokeCap = "ROUND";
              if (selectIconPaintVar) bindPaintVar(chevronVector, "strokes", 0, selectIconPaintVar);
              chevronSlot.appendChild(chevronVector);
            }

            if (isDefaultVariant) {
              var trailingSpacer = figma.createFrame();
              trailingSpacer.name = "Spacer";
              trailingSpacer.layoutMode = "NONE";
              trailingSpacer.primaryAxisSizingMode = "FIXED";
              trailingSpacer.counterAxisSizingMode = "AUTO";
              trailingSpacer.fills = [];
              trailingSpacer.strokes = [];
              trailingSpacer.resize(1, 1);
              try { trailingSpacer.layoutGrow = 1; } catch (_selectSpacerGrowErr) {}
              input.appendChild(trailingSpacer);
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

            if (dropdownMode === "open") {
              var dropdown = figma.createFrame();
              dropdown.name = "Dropdown";
              dropdown.layoutMode = "VERTICAL";
              dropdown.primaryAxisSizingMode = "AUTO";
              dropdown.counterAxisSizingMode = "FIXED";
              dropdown.counterAxisAlignItems = "MIN";
              dropdown.itemSpacing = 0;
              dropdown.paddingLeft = 8;
              dropdown.paddingRight = 8;
              dropdown.paddingTop = 8;
              dropdown.paddingBottom = 8;
              dropdown.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
              dropdown.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
              dropdown.strokeWeight = 1;
              dropdown.strokeAlign = "INSIDE";
              dropdown.cornerRadius = 4;
              dropdown.resize(colWidth, 1);
              try { dropdown.layoutSizingVertical = "HUG"; } catch (_selectDropdownHugErr) {}
              var dropdownBackgroundVar = selectVarWithFallback(varMap, [
                "select/" + variant + "-dropdown-background",
              ]);
              var dropdownBorderVar = selectVarWithFallback(varMap, [
                "select/" + variant + "-dropdown-border",
              ]);
              if (dropdownBackgroundVar) bindPaintVar(dropdown, "fills", 0, dropdownBackgroundVar);
              if (dropdownBorderVar) bindPaintVar(dropdown, "strokes", 0, dropdownBorderVar);
              if (varMap["select/radius-" + rad]) {
                bindVar(dropdown, "topLeftRadius", varMap["select/radius-" + rad]);
                bindVar(dropdown, "topRightRadius", varMap["select/radius-" + rad]);
                bindVar(dropdown, "bottomLeftRadius", varMap["select/radius-" + rad]);
                bindVar(dropdown, "bottomRightRadius", varMap["select/radius-" + rad]);
              }

              var optionHeight = sizeHeights[size] || 36;
              var optionLabels = ["Option one", "Option two", "Option three"];
              for (var oi = 0; oi < optionLabels.length; oi++) {
                var option = figma.createFrame();
                option.name = "Option/" + optionLabels[oi];
                option.layoutMode = "HORIZONTAL";
                option.primaryAxisSizingMode = "FIXED";
                option.counterAxisSizingMode = "FIXED";
                option.primaryAxisAlignItems = "MIN";
                option.counterAxisAlignItems = "CENTER";
                option.itemSpacing = 8;
                option.paddingLeft = 10;
                option.paddingRight = 10;
                option.cornerRadius = 4;
                if (varMap["select/radius-" + rad]) {
                  bindVar(option, "topLeftRadius", varMap["select/radius-" + rad]);
                  bindVar(option, "topRightRadius", varMap["select/radius-" + rad]);
                  bindVar(option, "bottomLeftRadius", varMap["select/radius-" + rad]);
                  bindVar(option, "bottomRightRadius", varMap["select/radius-" + rad]);
                }
                option.resize(184, optionHeight);
                option.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0 }];

                var isSelectedOption = oi === activeOptionIndex;
                var isHoverOption = oi === hoverOptionIndex;
                var optionBgVar = null;
                if (isSelectedOption) {
                  optionBgVar = selectVarWithFallback(varMap, [
                    "select/" + variant + "-option-selected-background",
                  ]);
                } else if (isHoverOption) {
                  optionBgVar = selectVarWithFallback(varMap, [
                    "select/" + variant + "-option-hover-background",
                  ]);
                }
                if (optionBgVar) {
                  option.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
                  bindPaintVar(option, "fills", 0, optionBgVar);
                }

                var optionText = figma.createText();
                optionText.name = "Label";
                optionText.fontName = font;
                optionText.characters = optionLabels[oi];
                optionText.fontSize = 14;
                optionText.fills = [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }];
                if (isHoverOption) {
                  var optionHoverTextVar = selectVarWithFallback(varMap, [
                    "select/" + variant + "-option-hover-text",
                  ]);
                  if (optionHoverTextVar) bindPaintVar(optionText, "fills", 0, optionHoverTextVar);
                } else if (varMap["select/text"]) {
                  bindPaintVar(optionText, "fills", 0, varMap["select/text"]);
                }
                if (varMap["select/font-size-" + size]) {
                  bindVar(optionText, "fontSize", varMap["select/font-size-" + size]);
                  if (selectFontFamilyVar) bindVar(optionText, "fontFamily", selectFontFamilyVar);
                  if (selectFontWeightVar) bindVar(optionText, "fontStyle", selectFontWeightVar);
                  if (selectLineHeightVar) bindVar(optionText, "lineHeight", selectLineHeightVar);
                }
                option.appendChild(optionText);
                dropdown.appendChild(option);
                try { option.layoutSizingHorizontal = "FILL"; } catch (_optionFillErr) {}
              }

              comp.appendChild(dropdown);
            }

            if (state === "error") {
              var errorNode = figma.createText();
              errorNode.name = "Error";
              errorNode.fontName = font;
              errorNode.characters = "Error message";
              errorNode.fontSize = 12;
              errorNode.fills = [{ type: "SOLID", color: { r: 0.97, g: 0.33, b: 0.29 } }];
              if (varMap["select/error-color"]) bindPaintVar(errorNode, "fills", 0, varMap["select/error-color"]);
              if (varMap["select/error-font-size"]) {
                bindVar(errorNode, "fontSize", varMap["select/error-font-size"]);
                bindVar(errorNode, "fontFamily", varMap["select/error-font-family"]);
                bindVar(errorNode, "fontStyle", varMap["select/error-font-weight"]);
                bindVar(errorNode, "lineHeight", varMap["select/error-line-height"]);
              }
              comp.appendChild(errorNode);
            }

            if (state === "disabled") comp.opacity = 0.6;

            // Pack radius variants horizontally to prevent excessively tall stacks.
            var columnsPerRadius = variants.length * labelModes.length;
            var colIndex = (ri * columnsPerRadius) + (vi * labelModes.length + li);
            // Stack each column densely by the component's actual height plus a
            // uniform gap, so there are no empty reserved rows / large vertical
            // separations between variant clusters.
            comp.x = colIndex * (colWidth + gap);
            comp.y = selectColYCursors[colIndex] || 0;
            selectColYCursors[colIndex] = comp.y + comp.height + rowGap;
            page.appendChild(comp);
            components.push(comp);
            }
          }
        }
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

async function buildMultiSelectComponentSet(varMap, page, font) {
  function createMultiSelectSwapRefs(iconComp) {
    var refs = [];
    if (!iconComp) return refs;
    try {
      var mainComp = iconComp.mainComponent || iconComp;
      if (mainComp && mainComp.key) refs.push(mainComp.key);
    } catch (_err) {}
    if (iconComp.key) refs.push(iconComp.key);
    if (iconComp.id) refs.push(iconComp.id);
    return refs;
  }

  function msColorPath(variant, property, state) {
    if (state === "default") return "multiselect/" + variant + "-" + property;
    return "multiselect/" + variant + "-" + property + "-" + state;
  }

  var variants = ["default", "filled"];
  var sizes = ["default", "xs", "sm", "md", "lg", "xl"];
  var radii = ["default", "xs", "sm", "md", "lg", "xl"];
  var states = ["default", "hover", "focus", "error", "disabled"];
  var dropdownModes = ["closed", "open"];
  var labelModes = ["none", "label", "required"];
  var pillLabels = ["Option one"];
  var optionLabels = ["Option one", "Option two", "Option three"];
  var selectedOptionIndices = { 0: true };
  var hoverOptionIndex = 2;
  var components = [];

  var chevronIconComp = await findSelectChevronIconComponent();
  if (chevronIconComp) {
    progress("[MultiSelect] Right icon source: " + chevronIconComp.name);
  } else {
    progress("[MultiSelect] Warning: no icon component found, using vector fallback");
  }

  var sizeHeights = { default: 36, xs: 30, sm: 36, md: 42, lg: 50, xl: 60 };
  var gap = 20;
  var colWidth = 220;
  var rowHeight = 220;

  function stateDropdownRow(state, dropdownMode) {
    if (state === "default") return dropdownMode === "open" ? 1 : 0;
    if (state === "hover") return dropdownMode === "open" ? 3 : 2;
    if (state === "focus") return dropdownMode === "open" ? 5 : 4;
    if (state === "error") return 6;
    if (state === "disabled") return 7;
    return 0;
  }

  for (var vi = 0; vi < variants.length; vi++) {
    var variant = variants[vi];
    var capVariant = variant.charAt(0).toUpperCase() + variant.slice(1);
    var isDefaultVariant = variant === "default";

    for (var li = 0; li < labelModes.length; li++) {
      var labelMode = labelModes[li];
      var capLabelMode = labelMode.charAt(0).toUpperCase() + labelMode.slice(1);
      var hasLabel = (labelMode !== "none");
      var hasAsterisk = (labelMode === "required");

      for (var si = 0; si < sizes.length; si++) {
        var size = sizes[si];
        var capSize = size === "default" ? "Default" : size.toUpperCase();

        for (var ri = 0; ri < radii.length; ri++) {
          var rad = radii[ri];
          var capRad = rad === "default" ? "Default" : rad.toUpperCase();
          var effectiveRad = isDefaultVariant ? "default" : rad;

          for (var sti = 0; sti < states.length; sti++) {
            var state = states[sti];
            var capState = state.charAt(0).toUpperCase() + state.slice(1);

            for (var dmi = 0; dmi < dropdownModes.length; dmi++) {
              var dropdownMode = dropdownModes[dmi];
              if ((state === "disabled" || state === "error") && dropdownMode === "open") continue;
              var capDropdown = dropdownMode === "open" ? "Open" : "Closed";

              var comp = figma.createComponent();
              comp.name =
                "Variant=" + capVariant +
                ", Size=" + capSize +
                ", Radius=" + capRad +
                ", State=" + capState +
                ", Label=" + capLabelMode +
                ", Dropdown=" + capDropdown;
              comp.layoutMode = "VERTICAL";
              comp.primaryAxisSizingMode = "AUTO";
              comp.counterAxisSizingMode = "AUTO";
              comp.itemSpacing = 4;
              comp.fills = [];

              var labelGapVar =
                varMap["multiselect/label-gap-" + size] ||
                varMap["multiselect/label-gap-default"] ||
                varMap["multiselect/label-gap"];
              if (labelGapVar) bindVar(comp, "itemSpacing", labelGapVar);

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
                if (varMap["multiselect/label-color"]) {
                  bindPaintVar(labelNode, "fills", 0, varMap["multiselect/label-color"]);
                }
                var labelFontSizeVar =
                  varMap["multiselect/label-font-size-" + size] ||
                  varMap["multiselect/label-font-size-default"] ||
                  varMap["multiselect/label-font-size"];
                if (labelFontSizeVar) {
                  bindVar(labelNode, "fontSize", labelFontSizeVar);
                  bindVar(labelNode, "fontFamily", varMap["multiselect/label-font-family"]);
                  bindVar(labelNode, "fontStyle", varMap["multiselect/label-font-weight"]);
                  bindVar(labelNode, "lineHeight", varMap["multiselect/label-line-height"]);
                }
                labelRow.appendChild(labelNode);

                if (hasAsterisk) {
                  var asteriskNode = figma.createText();
                  asteriskNode.name = "Asterisk";
                  asteriskNode.fontName = font;
                  asteriskNode.characters = " *";
                  asteriskNode.fontSize = 14;
                  asteriskNode.fills = [{ type: "SOLID", color: { r: 0.97, g: 0.33, b: 0.29 } }];
                  if (varMap["multiselect/asterisk-color"]) {
                    bindPaintVar(asteriskNode, "fills", 0, varMap["multiselect/asterisk-color"]);
                  }
                  if (labelFontSizeVar) {
                    bindVar(asteriskNode, "fontSize", labelFontSizeVar);
                    bindVar(asteriskNode, "fontFamily", varMap["multiselect/label-font-family"]);
                    bindVar(asteriskNode, "fontStyle", varMap["multiselect/label-font-weight"]);
                    bindVar(asteriskNode, "lineHeight", varMap["multiselect/label-line-height"]);
                  }
                  labelRow.appendChild(asteriskNode);
                }
                comp.appendChild(labelRow);
              }

              var input = figma.createFrame();
              input.name = "MultiSelectInput";
              input.layoutMode = "HORIZONTAL";
              input.primaryAxisSizingMode = "FIXED";
              input.counterAxisSizingMode = "AUTO";
              input.primaryAxisAlignItems = "SPACE_BETWEEN";
              input.counterAxisAlignItems = "CENTER";
              input.resize(colWidth, sizeHeights[size] || 36);
              input.cornerRadius = 4;
              input.paddingLeft = 10;
              input.paddingRight = 10;
              input.paddingTop = 8;
              input.paddingBottom = 8;
              input.itemSpacing = 8;
              input.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
              input.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
              input.strokeWeight = 1;
              input.strokeAlign = "INSIDE";

              var paddingXVar =
                varMap["multiselect/" + variant + "-padding-x-" + size] ||
                varMap["multiselect/" + variant + "-padding-x-default"] ||
                varMap["multiselect/" + variant + "-padding-x"];
              var paddingYVar =
                varMap["multiselect/" + variant + "-padding-y-" + size] ||
                varMap["multiselect/" + variant + "-padding-y-default"] ||
                varMap["multiselect/" + variant + "-padding-y"];
              var sectionSizeVar =
                varMap["multiselect/icon-size-" + size] ||
                varMap["multiselect/icon-size-default"] ||
                varMap["multiselect/icon-size"];
              if (paddingXVar) {
                bindVar(input, "paddingLeft", paddingXVar);
                bindVar(input, "paddingRight", paddingXVar);
              }
              if (paddingYVar) {
                bindVar(input, "paddingTop", paddingYVar);
                bindVar(input, "paddingBottom", paddingYVar);
              }
              if (varMap["multiselect/radius-" + effectiveRad]) {
                bindVar(input, "topLeftRadius", varMap["multiselect/radius-" + effectiveRad]);
                bindVar(input, "topRightRadius", varMap["multiselect/radius-" + effectiveRad]);
                bindVar(input, "bottomLeftRadius", varMap["multiselect/radius-" + effectiveRad]);
                bindVar(input, "bottomRightRadius", varMap["multiselect/radius-" + effectiveRad]);
              }
              if (varMap["multiselect/border-width"]) bindVar(input, "strokeWeight", varMap["multiselect/border-width"]);

              var bgPath = msColorPath(variant, "background", state);
              if (varMap[bgPath]) bindPaintVar(input, "fills", 0, varMap[bgPath]);
              var borderPath = msColorPath(variant, "border", state);
              if (varMap[borderPath]) bindPaintVar(input, "strokes", 0, varMap[borderPath]);

              var fontFamilyVar = selectVarWithFallback(varMap, [
                "multiselect/" + variant + "-font-family",
                "multiselect/font-family-default",
                "multiselect/font-family",
              ]);
              var fontWeightVar = selectVarWithFallback(varMap, [
                "multiselect/" + variant + "-font-weight",
                "multiselect/font-weight-default",
                "multiselect/font-weight",
              ]);
              var lineHeightVar =
                varMap["multiselect/line-height-" + size] ||
                varMap["multiselect/line-height-default"] ||
                varMap["multiselect/line-height"];
              var pillFontSizeVar =
                varMap["multiselect/pill-font-size-" + size] ||
                varMap["multiselect/pill-font-size-default"] ||
                varMap["multiselect/pill-font-size"];
              var pillGapVar =
                varMap["multiselect/pill-gap-" + size] ||
                varMap["multiselect/pill-gap-default"] ||
                varMap["multiselect/pill-gap"];
              var pillRadiusVar =
                varMap["multiselect/pill-radius-" + effectiveRad] ||
                varMap["multiselect/pill-radius-default"] ||
                varMap["multiselect/pill-radius"];
              var basePillBackgroundVar = varMap["multiselect/" + variant + "-pill-background"];
              var pillBackgroundVar = state === "disabled"
                ? (varMap["multiselect/pill-background-disabled"] || basePillBackgroundVar)
                : state === "error"
                  ? (varMap["multiselect/pill-background-error"] || basePillBackgroundVar)
                  : basePillBackgroundVar;
              var pillTextVar = state === "disabled"
                ? (varMap["multiselect/pill-text-disabled"] || varMap["multiselect/pill-text"])
                : state === "error"
                  ? (varMap["multiselect/pill-text-error"] || varMap["multiselect/pill-text"])
                  : varMap["multiselect/pill-text"];
              var pillRemoveIconVar = state === "disabled"
                ? (varMap["multiselect/pill-remove-icon-disabled"] || varMap["multiselect/pill-remove-icon"])
                : state === "error"
                  ? (varMap["multiselect/pill-remove-icon-error"] || varMap["multiselect/pill-remove-icon"])
                  : varMap["multiselect/pill-remove-icon"];

              // Selected-value pills shown in the trigger.
              var pillsFrame = figma.createFrame();
              pillsFrame.name = "Pills";
              pillsFrame.layoutMode = "HORIZONTAL";
              pillsFrame.primaryAxisSizingMode = "AUTO";
              pillsFrame.counterAxisSizingMode = "AUTO";
              pillsFrame.counterAxisAlignItems = "CENTER";
              pillsFrame.itemSpacing = 4;
              pillsFrame.fills = [];
              if (pillGapVar) bindVar(pillsFrame, "itemSpacing", pillGapVar);

              for (var pli = 0; pli < pillLabels.length; pli++) {
                var pill = figma.createFrame();
                pill.name = "Pill/" + pillLabels[pli];
                pill.layoutMode = "HORIZONTAL";
                pill.primaryAxisSizingMode = "AUTO";
                pill.counterAxisSizingMode = "AUTO";
                pill.counterAxisAlignItems = "CENTER";
                pill.itemSpacing = 4;
                pill.paddingLeft = 6;
                pill.paddingRight = 6;
                pill.paddingTop = 3;
                pill.paddingBottom = 3;
                pill.cornerRadius = 4;
                pill.fills = [{ type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.92 } }];
                if (pillBackgroundVar) bindPaintVar(pill, "fills", 0, pillBackgroundVar);
                if (pillRadiusVar) {
                  bindVar(pill, "topLeftRadius", pillRadiusVar);
                  bindVar(pill, "topRightRadius", pillRadiusVar);
                  bindVar(pill, "bottomLeftRadius", pillRadiusVar);
                  bindVar(pill, "bottomRightRadius", pillRadiusVar);
                }

                var pillTextNode = figma.createText();
                pillTextNode.name = "Label";
                pillTextNode.fontName = font;
                pillTextNode.characters = pillLabels[pli];
                pillTextNode.fontSize = 12;
                pillTextNode.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
                if (pillTextVar) bindPaintVar(pillTextNode, "fills", 0, pillTextVar);
                if (pillFontSizeVar) {
                  bindVar(pillTextNode, "fontSize", pillFontSizeVar);
                  if (fontFamilyVar) bindVar(pillTextNode, "fontFamily", fontFamilyVar);
                  if (fontWeightVar) bindVar(pillTextNode, "fontStyle", fontWeightVar);
                }
                pill.appendChild(pillTextNode);

                var pillRemoveNode = figma.createText();
                pillRemoveNode.name = "Remove";
                pillRemoveNode.fontName = font;
                pillRemoveNode.characters = "\u00d7";
                pillRemoveNode.fontSize = 12;
                pillRemoveNode.fills = [{ type: "SOLID", color: { r: 0.6, g: 0.6, b: 0.6 } }];
                if (pillRemoveIconVar) bindPaintVar(pillRemoveNode, "fills", 0, pillRemoveIconVar);
                if (pillFontSizeVar) bindVar(pillRemoveNode, "fontSize", pillFontSizeVar);
                pill.appendChild(pillRemoveNode);

                pillsFrame.appendChild(pill);
              }

              input.appendChild(pillsFrame);

              var chevronSlot = figma.createFrame();
              chevronSlot.name = "ChevronSlot";
              chevronSlot.layoutMode = "HORIZONTAL";
              chevronSlot.primaryAxisSizingMode = "AUTO";
              chevronSlot.counterAxisSizingMode = "AUTO";
              chevronSlot.primaryAxisAlignItems = "CENTER";
              chevronSlot.counterAxisAlignItems = "CENTER";
              chevronSlot.fills = [];
              chevronSlot.strokes = [];
              input.appendChild(chevronSlot);

              var iconPaintVar =
                state === "disabled" && varMap["multiselect/icon-disabled"]
                  ? varMap["multiselect/icon-disabled"]
                  : state === "error" && varMap["multiselect/icon-error"]
                    ? varMap["multiselect/icon-error"]
                    : varMap["multiselect/icon"];
              var iconStrokeVar =
                varMap["multiselect/icon-stroke-width-" + size] ||
                varMap["multiselect/icon-stroke-width-default"] ||
                varMap["multiselect/icon-stroke-width"];

              if (chevronIconComp) {
                var chevronInstance = chevronIconComp.createInstance();
                chevronInstance.name = "Chevron";
                try { chevronInstance.resizeWithoutConstraints(12, 12); } catch (e) {}
                if (sectionSizeVar) {
                  bindVar(chevronInstance, "width", sectionSizeVar);
                  bindVar(chevronInstance, "height", sectionSizeVar);
                }
                chevronSlot.appendChild(chevronInstance);
                try { chevronInstance.layoutGrow = 0; } catch (_growErr) {}
                try { chevronInstance.layoutAlign = "CENTER"; } catch (_alignErr) {}

                if (typeof comp.addComponentProperty === "function") {
                  var swapRefs = createMultiSelectSwapRefs(chevronIconComp);
                  var swapProp = null;
                  var swapErr = null;
                  for (var ssri = 0; ssri < swapRefs.length; ssri++) {
                    try {
                      swapProp = comp.addComponentProperty("Chevron", "INSTANCE_SWAP", swapRefs[ssri]);
                      break;
                    } catch (eSwap) {
                      swapErr = eSwap;
                    }
                  }
                  if (swapProp) {
                    try {
                      chevronInstance.componentPropertyReferences = { mainComponent: swapProp };
                    } catch (_swapRefErr) {}
                  } else if (swapErr) {
                    progress("[MultiSelect] Chevron INSTANCE_SWAP create failed: " + String(swapErr));
                  }
                }
                if (iconPaintVar && typeof chevronInstance.findAll === "function") {
                  var chevronVectors = chevronInstance.findAll(function (n) {
                    return n.type === "VECTOR";
                  });
                  for (var cvi = 0; cvi < chevronVectors.length; cvi++) {
                    try {
                      if (iconStrokeVar) bindVar(chevronVectors[cvi], "strokeWeight", iconStrokeVar);
                      if (chevronVectors[cvi].strokes && chevronVectors[cvi].strokes.length > 0) {
                        bindPaintVar(chevronVectors[cvi], "strokes", 0, iconPaintVar);
                      }
                    } catch (_cv) {}
                  }
                }
              } else {
                var chevronVector = figma.createVector();
                chevronVector.name = "Chevron";
                chevronVector.vectorPaths = [{ windingRule: "NONZERO", data: "M 1 1 L 6 6 L 11 1" }];
                chevronVector.resize(12, 6);
                if (sectionSizeVar) {
                  bindVar(chevronVector, "width", sectionSizeVar);
                  bindVar(chevronVector, "height", sectionSizeVar);
                }
                chevronVector.fills = [];
                chevronVector.strokes = [{ type: "SOLID", color: { r: 0.45, g: 0.45, b: 0.45 } }];
                chevronVector.strokeWeight = 1.5;
                if (iconStrokeVar) bindVar(chevronVector, "strokeWeight", iconStrokeVar);
                chevronVector.strokeJoin = "ROUND";
                chevronVector.strokeCap = "ROUND";
                if (iconPaintVar) bindPaintVar(chevronVector, "strokes", 0, iconPaintVar);
                chevronSlot.appendChild(chevronVector);
              }

              if (isDefaultVariant) {
                var trailingSpacer = figma.createFrame();
                trailingSpacer.name = "Spacer";
                trailingSpacer.layoutMode = "NONE";
                trailingSpacer.primaryAxisSizingMode = "FIXED";
                trailingSpacer.counterAxisSizingMode = "AUTO";
                trailingSpacer.fills = [];
                trailingSpacer.strokes = [];
                trailingSpacer.resize(1, 1);
                try { trailingSpacer.layoutGrow = 1; } catch (_spacerGrowErr) {}
                input.appendChild(trailingSpacer);
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

              if (dropdownMode === "open") {
                var dropdown = figma.createFrame();
                dropdown.name = "Dropdown";
                dropdown.layoutMode = "VERTICAL";
                dropdown.primaryAxisSizingMode = "AUTO";
                dropdown.counterAxisSizingMode = "FIXED";
                dropdown.counterAxisAlignItems = "MIN";
                dropdown.itemSpacing = 0;
                dropdown.paddingLeft = 8;
                dropdown.paddingRight = 8;
                dropdown.paddingTop = 8;
                dropdown.paddingBottom = 8;
                dropdown.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
                dropdown.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
                dropdown.strokeWeight = 1;
                dropdown.strokeAlign = "INSIDE";
                dropdown.cornerRadius = 4;
                dropdown.resize(colWidth, 1);
                try { dropdown.layoutSizingVertical = "HUG"; } catch (_dropdownHugErr) {}
                var dropdownBackgroundVar = varMap["multiselect/" + variant + "-dropdown-background"];
                var dropdownBorderVar = varMap["multiselect/" + variant + "-dropdown-border"];
                if (dropdownBackgroundVar) bindPaintVar(dropdown, "fills", 0, dropdownBackgroundVar);
                if (dropdownBorderVar) bindPaintVar(dropdown, "strokes", 0, dropdownBorderVar);
                if (varMap["multiselect/radius-" + effectiveRad]) {
                  bindVar(dropdown, "topLeftRadius", varMap["multiselect/radius-" + effectiveRad]);
                  bindVar(dropdown, "topRightRadius", varMap["multiselect/radius-" + effectiveRad]);
                  bindVar(dropdown, "bottomLeftRadius", varMap["multiselect/radius-" + effectiveRad]);
                  bindVar(dropdown, "bottomRightRadius", varMap["multiselect/radius-" + effectiveRad]);
                }

                var optionHeight = sizeHeights[size] || 36;
                for (var oi = 0; oi < optionLabels.length; oi++) {
                  var option = figma.createFrame();
                  option.name = "Option/" + optionLabels[oi];
                  option.layoutMode = "HORIZONTAL";
                  option.primaryAxisSizingMode = "FIXED";
                  option.counterAxisSizingMode = "FIXED";
                  option.primaryAxisAlignItems = "MIN";
                  option.counterAxisAlignItems = "CENTER";
                  option.itemSpacing = 8;
                  option.paddingLeft = 10;
                  option.paddingRight = 10;
                  option.cornerRadius = 4;
                  if (varMap["multiselect/radius-" + effectiveRad]) {
                    bindVar(option, "topLeftRadius", varMap["multiselect/radius-" + effectiveRad]);
                    bindVar(option, "topRightRadius", varMap["multiselect/radius-" + effectiveRad]);
                    bindVar(option, "bottomLeftRadius", varMap["multiselect/radius-" + effectiveRad]);
                    bindVar(option, "bottomRightRadius", varMap["multiselect/radius-" + effectiveRad]);
                  }
                  option.resize(184, optionHeight);
                  option.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0 }];

                  var isSelectedOption = selectedOptionIndices[oi] === true;
                  var isHoverOption = oi === hoverOptionIndex;
                  var optionBgVar = null;
                  if (isSelectedOption) {
                    optionBgVar = varMap["multiselect/" + variant + "-option-selected-background"];
                  } else if (isHoverOption) {
                    optionBgVar = varMap["multiselect/" + variant + "-option-hover-background"];
                  }
                  if (optionBgVar) {
                    option.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
                    bindPaintVar(option, "fills", 0, optionBgVar);
                  }

                  var optionText = figma.createText();
                  optionText.name = "Label";
                  optionText.fontName = font;
                  optionText.characters = optionLabels[oi];
                  optionText.fontSize = 14;
                  optionText.fills = [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }];
                  if (isHoverOption && varMap["multiselect/" + variant + "-option-hover-text"]) {
                    bindPaintVar(optionText, "fills", 0, varMap["multiselect/" + variant + "-option-hover-text"]);
                  } else if (varMap["multiselect/text"]) {
                    bindPaintVar(optionText, "fills", 0, varMap["multiselect/text"]);
                  }
                  if (varMap["multiselect/font-size-" + size]) {
                    bindVar(optionText, "fontSize", varMap["multiselect/font-size-" + size]);
                    if (fontFamilyVar) bindVar(optionText, "fontFamily", fontFamilyVar);
                    if (fontWeightVar) bindVar(optionText, "fontStyle", fontWeightVar);
                    if (lineHeightVar) bindVar(optionText, "lineHeight", lineHeightVar);
                  }
                  option.appendChild(optionText);
                  dropdown.appendChild(option);
                  try { option.layoutSizingHorizontal = "FILL"; } catch (_optionFillErr) {}
                }

                comp.appendChild(dropdown);
              }

              if (state === "error") {
                var errorNode = figma.createText();
                errorNode.name = "Error";
                errorNode.fontName = font;
                errorNode.characters = "Error message";
                errorNode.fontSize = 12;
                errorNode.fills = [{ type: "SOLID", color: { r: 0.97, g: 0.33, b: 0.29 } }];
                if (varMap["multiselect/error-color"]) bindPaintVar(errorNode, "fills", 0, varMap["multiselect/error-color"]);
                if (varMap["multiselect/error-font-size"]) {
                  bindVar(errorNode, "fontSize", varMap["multiselect/error-font-size"]);
                  bindVar(errorNode, "fontFamily", varMap["multiselect/error-font-family"]);
                  bindVar(errorNode, "fontStyle", varMap["multiselect/error-font-weight"]);
                  bindVar(errorNode, "lineHeight", varMap["multiselect/error-line-height"]);
                }
                comp.appendChild(errorNode);
              }

              if (state === "disabled") comp.opacity = 0.6;

              var columnsPerRadius = variants.length * labelModes.length;
              var colIndex = (ri * columnsPerRadius) + (vi * labelModes.length + li);
              var rowIndex = (si * 8) + stateDropdownRow(state, dropdownMode);
              comp.x = colIndex * (colWidth + gap);
              comp.y = rowIndex * rowHeight;
              page.appendChild(comp);
              components.push(comp);
            }
          }
        }
      }
    }
  }

  progress("Created " + components.length + " multiselect variants");
  var multiSelectComponentSet = figma.combineAsVariants(components, page);
  multiSelectComponentSet.name = "MultiSelect";
  return multiSelectComponentSet;
}

function selectColorPath(variant, property, state) {
  if (state === "default") return "select/" + variant + "-" + property;
  return "select/" + variant + "-" + property + "-" + state;
}

function selectVarWithFallback(varMap, paths) {
  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (!path) continue;
    if (varMap[path]) return varMap[path];
  }
  return null;
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

function buildCardComponentSet(varMap, page, font, options) {
  var useCompactMatrix = Boolean(options && options.compact);
  var variants = ["default", "dark", "outlined", "brand", "transparent"];
  var sizes = ["default", "xs", "sm", "md", "lg", "xl"];
  var radii = useCompactMatrix
    ? ["default"]
    : ["default", "xs", "sm", "md", "lg", "xl"];
  var states = ["default", "hover", "focus", "pressed", "disabled"];
  var borderModes = ["on", "off"];
  var shadowModes = ["off", "on"];
  var sectionModes = ["on", "off"];
  var components = [];

  var rowGap = 24;
  var colGap = 28;
  var colWidth = 360 + colGap;
  var rowHeight = 280 + rowGap;

  for (var vi = 0; vi < variants.length; vi++) {
    var variant = variants[vi];
    var capVariant = variant.charAt(0).toUpperCase() + variant.slice(1);
    for (var si = 0; si < sizes.length; si++) {
      var size = sizes[si];
      var capSize = size === "default" ? "Default" : size.toUpperCase();
      for (var ri = 0; ri < radii.length; ri++) {
        var radius = radii[ri];
        var capRadius = radius === "default" ? "Default" : radius.toUpperCase();
        for (var bi = 0; bi < borderModes.length; bi++) {
          var withBorder = borderModes[bi] === "on";
          for (var shi = 0; shi < shadowModes.length; shi++) {
            var withShadow = shadowModes[shi] === "on";
            for (var sti = 0; sti < states.length; sti++) {
              var state = states[sti];
              var capState = state.charAt(0).toUpperCase() + state.slice(1);
              for (var seci = 0; seci < sectionModes.length; seci++) {
                var withSection = sectionModes[seci] === "on";
                var variantSupportsSection = variant === "default" || variant === "dark";
                if (withSection && !variantSupportsSection) continue;
            var comp = figma.createComponent();
            comp.name =
              "Variant=" + capVariant +
              ", " +
              "Size=" + capSize +
              ", Radius=" + capRadius +
              ", Border=" + (withBorder ? "On" : "Off") +
              ", Shadow=" + (withShadow ? "On" : "Off") +
              ", Section=" + (withSection ? "On" : "Off") +
              ", State=" + capState;

            comp.layoutMode = "VERTICAL";
            comp.primaryAxisSizingMode = "AUTO";
            comp.counterAxisSizingMode = "FIXED";
            comp.counterAxisAlignItems = "MIN";
            comp.itemSpacing = 0;
            comp.resize(320, 180);
            comp.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
            comp.clipsContent = true;
            var backgroundVar = cardColorVar(varMap, variant, "background", state);
            var borderVar = cardColorVar(varMap, variant, "border", state);
            var titleVar = cardColorVar(varMap, variant, "title", state);
            var descriptionVar = cardColorVar(varMap, variant, "description", state);
            var sectionBackgroundVar = cardColorVar(varMap, variant, "section-background", state);

            if (withSection) {
              // Section-on layout: keep outer shell transparent so media + body reads as two blocks.
              comp.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0 }];
            } else if (backgroundVar) {
              bindPaintVar(comp, "fills", 0, backgroundVar);
            }
            if (varMap["card/radius-" + radius]) {
              bindVar(comp, "topLeftRadius", varMap["card/radius-" + radius]);
              bindVar(comp, "topRightRadius", varMap["card/radius-" + radius]);
              bindVar(comp, "bottomLeftRadius", varMap["card/radius-" + radius]);
              bindVar(comp, "bottomRightRadius", varMap["card/radius-" + radius]);
            }
            if (withSection) {
              // No shell padding when section is on; body handles content padding.
              comp.paddingLeft = 0;
              comp.paddingRight = 0;
              comp.paddingTop = 0;
              comp.paddingBottom = 0;
            } else if (varMap["card/padding-" + size]) {
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
            if (borderVar) bindPaintVar(comp, "strokes", 0, borderVar);
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

            if (withSection) {
              var section = figma.createFrame();
              section.name = "Section";
              section.layoutMode = "NONE";
              section.primaryAxisSizingMode = "FIXED";
              section.counterAxisSizingMode = "FIXED";
              section.layoutAlign = "STRETCH";
              section.resize(320, 110);
              section.fills = [{ type: "SOLID", color: { r: 0.93, g: 0.95, b: 0.98 } }];
              if (sectionBackgroundVar) bindPaintVar(section, "fills", 0, sectionBackgroundVar);
              if (varMap["card/section-height"]) bindVar(section, "minHeight", varMap["card/section-height"]);
              comp.appendChild(section);
            }

            var body = figma.createFrame();
            body.name = "Body";
            body.layoutMode = "VERTICAL";
            body.primaryAxisSizingMode = "AUTO";
            body.counterAxisSizingMode = "AUTO";
            body.counterAxisAlignItems = "MIN";
            body.itemSpacing = 8;
            body.layoutAlign = "STRETCH";
            body.fills = [];
            if (withSection) {
              body.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
              if (backgroundVar) bindPaintVar(body, "fills", 0, backgroundVar);
              if (varMap["card/padding-" + size]) {
                bindVar(body, "paddingLeft", varMap["card/padding-" + size]);
                bindVar(body, "paddingRight", varMap["card/padding-" + size]);
                bindVar(body, "paddingTop", varMap["card/padding-" + size]);
                bindVar(body, "paddingBottom", varMap["card/padding-" + size]);
              } else {
                body.paddingLeft = 16;
                body.paddingRight = 16;
                body.paddingTop = 16;
                body.paddingBottom = 16;
              }
            }
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
            if (titleVar) bindPaintVar(titleNode, "fills", 0, titleVar);
            if (varMap["card/title-font-size-" + size]) bindVar(titleNode, "fontSize", varMap["card/title-font-size-" + size]);
            bindVar(titleNode, "fontFamily", varMap["card/title-font-family"]);
            bindVar(titleNode, "fontStyle", varMap["card/title-font-weight"]);
            if (varMap["card/title-line-height-" + size]) bindVar(titleNode, "lineHeight", varMap["card/title-line-height-" + size]);
            topRow.appendChild(titleNode);

            var descriptionNode = figma.createText();
            descriptionNode.name = "Description";
            descriptionNode.fontName = font;
            descriptionNode.characters = "Detected vessel metadata and imagery details from latest satellite capture.";
            descriptionNode.fontSize = 12;
            descriptionNode.fills = [{ type: "SOLID", color: { r: 0.4, g: 0.4, b: 0.4 } }];
            descriptionNode.textAutoResize = "HEIGHT";
            descriptionNode.resize(288, descriptionNode.height);
            if (descriptionVar) bindPaintVar(descriptionNode, "fills", 0, descriptionVar);
            if (varMap["card/description-font-size-" + size]) bindVar(descriptionNode, "fontSize", varMap["card/description-font-size-" + size]);
            bindVar(descriptionNode, "fontFamily", varMap["card/description-font-family"]);
            bindVar(descriptionNode, "fontStyle", varMap["card/description-font-weight"]);
            if (varMap["card/description-line-height-" + size]) bindVar(descriptionNode, "lineHeight", varMap["card/description-line-height-" + size]);
            body.appendChild(descriptionNode);

            // Ensure card height hugs content (section on/off variants)
            // while width remains fixed to 320.
            comp.primaryAxisSizingMode = "AUTO";
            comp.counterAxisSizingMode = "FIXED";

            var colIndex = vi * radii.length * borderModes.length * shadowModes.length * sectionModes.length +
              ri * borderModes.length * shadowModes.length * sectionModes.length +
              bi * shadowModes.length * sectionModes.length +
              shi * sectionModes.length +
              seci;
            var rowIndex = si * states.length + sti;
            comp.x = colIndex * colWidth;
            comp.y = rowIndex * rowHeight;
            page.appendChild(comp);
            components.push(comp);
              }
            }
          }
        }
      }
    }
  }

  progress("Created " + components.length + " card variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Card";
  return componentSet;
}

function cardColorVar(varMap, variant, slot, state) {
  var resolvedState = state || "default";
  var variantStatePath = resolvedState === "default"
    ? "card/" + variant + "-" + slot
    : "card/" + variant + "-" + slot + "-" + resolvedState;
  if (varMap[variantStatePath]) return varMap[variantStatePath];
  var variantBasePath = "card/" + variant + "-" + slot;
  if (varMap[variantBasePath]) return varMap[variantBasePath];
  var defaultStatePath = resolvedState === "default"
    ? "card/default-" + slot
    : "card/default-" + slot + "-" + resolvedState;
  if (varMap[defaultStatePath]) return varMap[defaultStatePath];
  var defaultBasePath = "card/default-" + slot;
  if (varMap[defaultBasePath]) return varMap[defaultBasePath];
  return varMap["card/" + slot] || null;
}

// ---------------------------------------------------------------------------
// ActionIcon
// ---------------------------------------------------------------------------

async function buildActionIconComponentSet(varMap, page, focusRingStyle, selectedVariants) {
  var variants = (selectedVariants && selectedVariants.length > 0)
    ? selectedVariants.slice()
    : ["default", "filled", "light", "outlined", "transparent"];
  var sizes = ["default", "xs", "sm", "md", "lg", "xl"];
  var radii = ["xs", "sm", "md", "lg", "xl"];
  var states = ["default", "hover", "focus", "pressed", "disabled"];
  var icons = ["check"];
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

  var sizePx = { default: 36, xs: 28, sm: 32, md: 36, lg: 42, xl: 48 };
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
          var capSize = size === "default" ? "Default" : size.toUpperCase();

        for (var ri = 0; ri < radii.length; ri++) {
          var rad = radii[ri];
          var capRadius = rad === "default" ? "Default" : rad.toUpperCase();

          for (var sti = 0; sti < states.length; sti++) {
            var state = states[sti];
            var capState = state.charAt(0).toUpperCase() + state.slice(1);

            var comp = figma.createComponent();
            comp.name = "Variant=" + capVariant + ", Size=" + capSize +
                        ", Radius=" + capRadius + ", State=" + capState +
                        (icons.length > 1 ? ", Icon=" + capIcon : "");
            var isOffsetFocus = state === "focus" && focusRingStyle !== "attached";
            var isAttachedFocus = state === "focus" && focusRingStyle === "attached";
            var surfaceNode = comp;
            var focusRingNode = null;
            var attachedHaloNode = null;
            var focusRingWidthVar = varMap["actionicon/focus-ring-width-" + rad] || varMap["actionicon/focus-ring-width"];
            var focusRingSpacingVar = varMap["actionicon/focus-ring-spacing-" + rad] || varMap["actionicon/focus-ring-spacing"];

            comp.layoutMode = "HORIZONTAL";
            comp.primaryAxisAlignItems = "CENTER";
            comp.counterAxisAlignItems = "CENTER";
            comp.itemSpacing = 0;

            if (isOffsetFocus) {
              comp.primaryAxisSizingMode = "AUTO";
              comp.counterAxisSizingMode = "AUTO";
              comp.paddingTop = 3;
              comp.paddingRight = 3;
              comp.paddingBottom = 3;
              comp.paddingLeft = 3;
              comp.fills = [];
              comp.strokes = [{ type: "SOLID", color: { r: 0.2, g: 0.53, b: 0.9 } }];
              comp.strokeAlign = "OUTSIDE";
              comp.strokeWeight = 2;
              comp.cornerRadius = 11;
              comp.clipsContent = false;
              bindPaintVar(comp, "strokes", 0, varMap["actionicon/focus-ring"]);
              bindVar(comp, "strokeWeight", focusRingWidthVar);
              bindVar(comp, "paddingTop", focusRingSpacingVar);
              bindVar(comp, "paddingRight", focusRingSpacingVar);
              bindVar(comp, "paddingBottom", focusRingSpacingVar);
              bindVar(comp, "paddingLeft", focusRingSpacingVar);
              bindVar(comp, "topLeftRadius", varMap["actionicon/focus-ring-radius-" + rad]);
              bindVar(comp, "topRightRadius", varMap["actionicon/focus-ring-radius-" + rad]);
              bindVar(comp, "bottomLeftRadius", varMap["actionicon/focus-ring-radius-" + rad]);
              bindVar(comp, "bottomRightRadius", varMap["actionicon/focus-ring-radius-" + rad]);
              surfaceNode = figma.createFrame();
              surfaceNode.name = "Surface";
              surfaceNode.layoutMode = "HORIZONTAL";
              surfaceNode.primaryAxisSizingMode = "FIXED";
              surfaceNode.counterAxisSizingMode = "FIXED";
              surfaceNode.primaryAxisAlignItems = "CENTER";
              surfaceNode.counterAxisAlignItems = "CENTER";
              surfaceNode.itemSpacing = 0;
              surfaceNode.resize(sizePx[size], sizePx[size]);
              surfaceNode.cornerRadius = 8;
              surfaceNode.clipsContent = true;
              comp.appendChild(surfaceNode);
            } else {
              comp.primaryAxisSizingMode = "FIXED";
              comp.counterAxisSizingMode = "FIXED";
              comp.resize(sizePx[size], sizePx[size]);
              comp.cornerRadius = 8;
              comp.clipsContent = !isAttachedFocus;
            }

            var colorState = (state === "focus" && focusRingStyle === "attached") ? "default" : state;
            var bgPath = actionIconColorPath(variant, "background", colorState);
            var iconPath = actionIconColorPath(variant, "icon", colorState);
            var borderPath = actionIconColorPath(variant, "border", colorState);

            surfaceNode.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
            bindPaintVar(surfaceNode, "fills", 0, varMap[bgPath]);

            surfaceNode.strokes = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 0 }];
            surfaceNode.strokeAlign = "INSIDE";
            bindPaintVar(surfaceNode, "strokes", 0, varMap[borderPath]);

            bindVar(surfaceNode, "width", varMap["actionicon/size-" + size]);
            bindVar(surfaceNode, "height", varMap["actionicon/size-" + size]);
            bindVar(surfaceNode, "topLeftRadius", varMap["actionicon/radius-" + rad]);
            bindVar(surfaceNode, "topRightRadius", varMap["actionicon/radius-" + rad]);
            bindVar(surfaceNode, "bottomLeftRadius", varMap["actionicon/radius-" + rad]);
            bindVar(surfaceNode, "bottomRightRadius", varMap["actionicon/radius-" + rad]);
            bindVar(surfaceNode, "strokeWeight", varMap["actionicon/border-width"]);

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
                bindVar(vectors[vci], "strokeWeight", varMap["actionicon/icon-stroke-width-" + size]);
                if (vectors[vci].strokes && vectors[vci].strokes.length > 0) {
                  vectors[vci].strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
                  bindPaintVar(vectors[vci], "strokes", 0, varMap[iconPath]);
                }
                if (vectors[vci].fills && vectors[vci].fills.length > 0) {
                  vectors[vci].fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
                  bindPaintVar(vectors[vci], "fills", 0, varMap[iconPath]);
                }
              }
              surfaceNode.appendChild(iconInst);
            }

            if (isAttachedFocus) {
              // Attached focus: token-bound halo ring, no hardcoded shadow color.
              attachedHaloNode = figma.createRectangle();
              attachedHaloNode.name = "FocusHalo";
              attachedHaloNode.fills = [];
              attachedHaloNode.strokes = [{ type: "SOLID", color: { r: 0.2, g: 0.53, b: 0.9 } }];
              attachedHaloNode.strokeAlign = "OUTSIDE";
              attachedHaloNode.strokeWeight = 2;
              attachedHaloNode.cornerRadius = 8;
              bindPaintVar(attachedHaloNode, "strokes", 0, varMap["actionicon/focus-ring"]);
              bindVar(attachedHaloNode, "strokeWeight", focusRingWidthVar);
              bindVar(attachedHaloNode, "topLeftRadius", varMap["actionicon/focus-ring-radius-" + rad]);
              bindVar(attachedHaloNode, "topRightRadius", varMap["actionicon/focus-ring-radius-" + rad]);
              bindVar(attachedHaloNode, "bottomLeftRadius", varMap["actionicon/focus-ring-radius-" + rad]);
              bindVar(attachedHaloNode, "bottomRightRadius", varMap["actionicon/focus-ring-radius-" + rad]);
              comp.appendChild(attachedHaloNode);
              attachedHaloNode.layoutPositioning = "ABSOLUTE";
              attachedHaloNode.x = 0;
              attachedHaloNode.y = 0;
              attachedHaloNode.resize(comp.width, comp.height);
              attachedHaloNode.constraints = { horizontal: "STRETCH", vertical: "STRETCH" };
              comp.insertChild(0, attachedHaloNode);
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
// Accordion
// ---------------------------------------------------------------------------

function accordionColorPath(variant, property, state) {
  var base = "accordion/" + variant + "-" + property;
  if (!state || state === "default") return base;
  return base + "-" + state;
}

function capTokenValue(value) {
  var normalized = String(value || "");
  if (!normalized) return "";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function accordionRadiusPath(variant) {
  return "accordion/" + String(variant || "default") + "-radius";
}

function applyAccordionPositionRadii(node, varMap, variant, position) {
  var pos = String(position || "single").toLowerCase();
  var topOn = pos === "single" || pos === "first";
  var bottomOn = pos === "single" || pos === "last";
  var radiusPath = accordionRadiusPath(variant);
  node.topLeftRadius = topOn ? 4 : 0;
  node.topRightRadius = topOn ? 4 : 0;
  node.bottomLeftRadius = bottomOn ? 4 : 0;
  node.bottomRightRadius = bottomOn ? 4 : 0;
  bindVar(node, "topLeftRadius", topOn ? varMap[radiusPath] : null);
  bindVar(node, "topRightRadius", topOn ? varMap[radiusPath] : null);
  bindVar(node, "bottomLeftRadius", bottomOn ? varMap[radiusPath] : null);
  bindVar(node, "bottomRightRadius", bottomOn ? varMap[radiusPath] : null);
}

function applyAccordionHeaderRadii(node, varMap, variant, position, expanded) {
  var pos = String(position || "single").toLowerCase();
  var topOn = pos === "single" || pos === "first";
  var bottomOn = !expanded && (pos === "single" || pos === "last");
  var radiusPath = accordionRadiusPath(variant);
  node.topLeftRadius = topOn ? 4 : 0;
  node.topRightRadius = topOn ? 4 : 0;
  node.bottomLeftRadius = bottomOn ? 4 : 0;
  node.bottomRightRadius = bottomOn ? 4 : 0;
  bindVar(node, "topLeftRadius", topOn ? varMap[radiusPath] : null);
  bindVar(node, "topRightRadius", topOn ? varMap[radiusPath] : null);
  bindVar(node, "bottomLeftRadius", bottomOn ? varMap[radiusPath] : null);
  bindVar(node, "bottomRightRadius", bottomOn ? varMap[radiusPath] : null);
}

function applyAccordionPanelRadii(node, varMap, variant, position, expanded) {
  var pos = String(position || "single").toLowerCase();
  var bottomOn = expanded && (pos === "single" || pos === "last");
  var radiusPath = accordionRadiusPath(variant);
  node.topLeftRadius = 0;
  node.topRightRadius = 0;
  node.bottomLeftRadius = bottomOn ? 4 : 0;
  node.bottomRightRadius = bottomOn ? 4 : 0;
  bindVar(node, "topLeftRadius", null);
  bindVar(node, "topRightRadius", null);
  bindVar(node, "bottomLeftRadius", bottomOn ? varMap[radiusPath] : null);
  bindVar(node, "bottomRightRadius", bottomOn ? varMap[radiusPath] : null);
}

function createAccordionChevron(varMap, colorPath) {
  var icon = figma.createFrame();
  icon.name = "Chevron";
  icon.layoutMode = "NONE";
  icon.resizeWithoutConstraints(20, 20);
  icon.fills = [];
  icon.strokes = [];

  var chevron = figma.createVector();
  chevron.name = "Chevron Path";
  chevron.resizeWithoutConstraints(10, 6);
  chevron.x = 5;
  chevron.y = 7;
  chevron.fills = [];
  chevron.strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  chevron.strokeWeight = 1.8;
  chevron.strokeCap = "ROUND";
  chevron.strokeJoin = "ROUND";
  chevron.vectorPaths = [{ windingRule: "NONE", data: "M 1 1 L 5 5 L 9 1" }];
  bindPaintVar(chevron, "strokes", 0, varMap[colorPath]);
  bindVar(chevron, "strokeWeight", varMap["accordion/icon-stroke-width"]);
  icon.appendChild(chevron);
  return icon;
}

async function findAccordionChevronIconComponent() {
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

  var down = null;
  var fallback = null;
  for (var j = 0; j < iconCandidates.length; j++) {
    var name = String(iconCandidates[j].name || "").toLowerCase();
    if (!fallback) fallback = iconCandidates[j];
    if (!down && (
      name.indexOf("chevrondown") >= 0 ||
      name.indexOf("arrowdown") >= 0 ||
      name.indexOf("down") >= 0
    )) {
      down = iconCandidates[j];
      break;
    }
  }

  var resolved = down || fallback || null;
  if (resolved) progress("[Accordion] Chevron source: " + resolved.name);
  return resolved;
}

function setAccordionInstanceProps(instance, propPatch) {
  if (!instance || typeof instance.setProperties !== "function") return;
  var meta = instance.componentProperties || {};
  var keys = Object.keys(meta);
  if (!keys.length) return;
  var props = {};
  var patchKeys = Object.keys(propPatch || {});
  for (var pi = 0; pi < patchKeys.length; pi++) {
    var propName = patchKeys[pi];
    var propValue = propPatch[propName];
    if (propValue == null) continue;
    var resolvedKey = null;
    for (var ki = 0; ki < keys.length; ki++) {
      var baseName = String(keys[ki]).split("#")[0];
      if (baseName === propName || baseName.toLowerCase() === String(propName).toLowerCase()) {
        resolvedKey = keys[ki];
        break;
      }
    }
    if (resolvedKey) props[resolvedKey] = propValue;
  }
  if (Object.keys(props).length > 0) {
    try { instance.setProperties(props); } catch (_accordionInstancePropsErr) {}
  }
}

function findAccordionSlotHost(instance) {
  if (!instance || typeof instance.findAll !== "function") return null;
  var slots = [];
  try {
    slots = instance.findAll(function (n) {
      return (n.type === "SLOT" || n.type === "FRAME") && n.name === "AccordionContent";
    });
  } catch (_accordionFindSlotErr) {
    slots = [];
  }
  return slots.length > 0 ? slots[0] : null;
}

function buildAccordionComponentSet(varMap, page, font, accordionItemSet) {
  var itemComponent = null;
  if (accordionItemSet && accordionItemSet.type === "COMPONENT_SET" && accordionItemSet.children && accordionItemSet.children.length > 0) {
    itemComponent = accordionItemSet.children[0];
  } else if (accordionItemSet && accordionItemSet.type === "COMPONENT") {
    itemComponent = accordionItemSet;
  }
  if (!itemComponent) {
    progress("[Accordion] Accordion Item set missing; skipping Accordion component set.");
    return null;
  }

  var variants = ["default", "contained", "filled"];
  var rows = [
    { position: "first", expanded: "off" },
    { position: "middle", expanded: "on" },
    { position: "middle", expanded: "off" },
    { position: "last", expanded: "off" }
  ];
  var components = [];

  for (var vi = 0; vi < variants.length; vi++) {
    var variant = variants[vi];
    var comp = figma.createComponent();
    comp.name = "Variant=" + capTokenValue(variant);
    comp.layoutMode = "VERTICAL";
    comp.primaryAxisSizingMode = "AUTO";
    comp.counterAxisSizingMode = "FIXED";
    comp.itemSpacing = 0;
    comp.fills = [];
    comp.strokes = [];
    comp.resizeWithoutConstraints(468, 195);

    for (var ri = 0; ri < rows.length; ri++) {
      var row = rows[ri];
      var item = itemComponent.createInstance();
      setAccordionInstanceProps(item, {
        Variant: capTokenValue(variant),
        Position: capTokenValue(row.position),
        State: "Default",
        Expanded: row.expanded === "on" ? "On" : "Off"
      });
      comp.appendChild(item);
      try { item.layoutAlign = "STRETCH"; } catch (_accordionCompItemAlignErr) {}
      try { item.layoutSizingHorizontal = "FILL"; } catch (_accordionCompItemFillErr) {}

      if (row.expanded === "on") {
        var slotHost = findAccordionSlotHost(item);
        if (slotHost) {
          try {
            for (var ci = slotHost.children.length - 1; ci >= 0; ci--) {
              slotHost.children[ci].remove();
            }
          } catch (_accordionCompSlotClearErr) {}
          var contentText = figma.createText();
          contentText.name = "Content";
          contentText.fontName = font;
          contentText.characters = "Expand each section to view more details and relevant information. Everything you need, neatly tucked away until you need it.";
          contentText.textAutoResize = "HEIGHT";
          contentText.resizeWithoutConstraints(444, contentText.height);
          contentText.fontSize = 14;
          contentText.fills = [{ type: "SOLID", color: { r: 0.78, g: 0.79, b: 0.83 } }];
          bindPaintVar(contentText, "fills", 0, varMap["accordion/" + variant + "-content-text"]);
          bindVar(contentText, "fontSize", varMap["accordion/content-font-size"]);
          bindVar(contentText, "fontFamily", varMap["accordion/content-font-family"]);
          bindVar(contentText, "fontStyle", varMap["accordion/content-font-weight"]);
          bindVar(contentText, "lineHeight", varMap["accordion/content-line-height"]);
          slotHost.appendChild(contentText);
          try { contentText.layoutAlign = "STRETCH"; } catch (_accordionCompTextAlignErr) {}
          try { contentText.layoutSizingHorizontal = "FILL"; } catch (_accordionCompTextFillErr) {}
        }
      }
    }

    comp.x = vi * 560;
    comp.y = 0;
    page.appendChild(comp);
    components.push(comp);
  }

  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Accordion";
  return componentSet;
}

async function buildAccordionItemComponentSet(varMap, page, font) {
  var variants = ["default", "contained", "filled"];
  var positions = ["single", "first", "middle", "last"];
  var states = ["default", "hover", "focus", "disabled"];
  var expandedModes = ["off", "on"];
  var components = [];
  var colWidth = 520;
  var rowHeight = 120;
  var gap = 22;
  var chevronIconComp = await findAccordionChevronIconComponent();

  for (var vi = 0; vi < variants.length; vi++) {
    var variant = variants[vi];
    var capVariant = capTokenValue(variant);
    for (var pi = 0; pi < positions.length; pi++) {
      var position = positions[pi];
      var capPosition = capTokenValue(position);
      for (var si = 0; si < states.length; si++) {
        var state = states[si];
        var capState = capTokenValue(state);
        for (var ei = 0; ei < expandedModes.length; ei++) {
          var expandedMode = expandedModes[ei];
          if (state === "disabled" && expandedMode === "on") continue;
          var expanded = expandedMode === "on";
          var capExpanded = expanded ? "On" : "Off";
          var isDefaultVariant = variant === "default";
          var removeHeaderTopBorder = position === "middle" || position === "last";
          var headerTopWeight = isDefaultVariant || removeHeaderTopBorder ? 0 : 1;
          var headerSideWeight = isDefaultVariant ? 0 : 1;

          var comp = figma.createComponent();
          comp.name =
            "Variant=" + capVariant +
            ", Position=" + capPosition +
            ", State=" + capState +
            ", Expanded=" + capExpanded;
          comp.layoutMode = "VERTICAL";
          comp.primaryAxisSizingMode = "AUTO";
          comp.counterAxisSizingMode = "FIXED";
          comp.resizeWithoutConstraints(468, expanded ? 87 : 36);
          comp.itemSpacing = 0;
          comp.fills = [];
          comp.strokes = [];

          var headerRow = figma.createFrame();
          headerRow.name = "AccordionItem";
          headerRow.layoutMode = "HORIZONTAL";
          headerRow.primaryAxisSizingMode = "FIXED";
          headerRow.counterAxisSizingMode = "AUTO";
          try { headerRow.layoutSizingHorizontal = "FILL"; } catch (_accordionHeaderFillErr) {}
          headerRow.resizeWithoutConstraints(468, 36);
          headerRow.fills = [{ type: "SOLID", color: { r: 0.14, g: 0.15, b: 0.24 } }];
          headerRow.strokes = [{ type: "SOLID", color: { r: 0.22, g: 0.24, b: 0.34 } }];
          headerRow.strokeAlign = "INSIDE";
          headerRow.strokeTopWeight = headerTopWeight;
          headerRow.strokeRightWeight = headerSideWeight;
          headerRow.strokeBottomWeight = 1;
          headerRow.strokeLeftWeight = headerSideWeight;
          headerRow.paddingLeft = 12;
          headerRow.paddingRight = 12;
          headerRow.paddingTop = 8;
          headerRow.paddingBottom = 8;
          headerRow.primaryAxisAlignItems = "SPACE_BETWEEN";
          headerRow.counterAxisAlignItems = "CENTER";
          headerRow.clipsContent = true;
          bindPaintVar(headerRow, "fills", 0, varMap[accordionColorPath(variant, "header-background", state)]);
          bindPaintVar(headerRow, "strokes", 0, varMap[accordionColorPath(variant, "header-border", state)]);
          bindVar(headerRow, "strokeTopWeight", headerTopWeight ? varMap["accordion/border-width"] : null);
          bindVar(headerRow, "strokeRightWeight", headerSideWeight ? varMap["accordion/border-width"] : null);
          bindVar(headerRow, "strokeBottomWeight", varMap["accordion/border-width"]);
          bindVar(headerRow, "strokeLeftWeight", headerSideWeight ? varMap["accordion/border-width"] : null);
          bindVar(headerRow, "paddingLeft", varMap["accordion/header-padding-x"]);
          bindVar(headerRow, "paddingRight", varMap["accordion/header-padding-x"]);
          bindVar(headerRow, "paddingTop", varMap["accordion/header-padding-y"]);
          bindVar(headerRow, "paddingBottom", varMap["accordion/header-padding-y"]);
          applyAccordionHeaderRadii(headerRow, varMap, variant, position, expanded);
          comp.appendChild(headerRow);

          var label = figma.createText();
          label.name = "Label";
          label.fontName = font;
          label.characters = "Title";
          label.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
          label.fontSize = 14;
          bindPaintVar(label, "fills", 0, varMap[accordionColorPath(variant, "header-text", state)]);
          bindVar(label, "fontSize", varMap["accordion/label-font-size"]);
          bindVar(label, "fontFamily", varMap["accordion/label-font-family"]);
          bindVar(label, "fontStyle", varMap["accordion/label-font-weight"]);
          bindVar(label, "lineHeight", varMap["accordion/label-line-height"]);
          headerRow.appendChild(label);

          var icon = null;
          if (chevronIconComp) {
            icon = chevronIconComp.createInstance();
            icon.name = "Chevron";
            try { icon.layoutPositioning = "AUTO"; } catch (_accordionChevronPositionErr) {}
            icon.resize(20, 20);
            bindVar(icon, "width", varMap["accordion/icon-size"]);
            bindVar(icon, "height", varMap["accordion/icon-size"]);
            var iconVectors = icon.findAll(function(n) { return n.type === "VECTOR"; });
            for (var iv = 0; iv < iconVectors.length; iv++) {
              bindVar(iconVectors[iv], "strokeWeight", varMap["accordion/icon-stroke-width"]);
              if (iconVectors[iv].strokes && iconVectors[iv].strokes.length > 0) {
                iconVectors[iv].strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
                bindPaintVar(iconVectors[iv], "strokes", 0, varMap[accordionColorPath(variant, "header-icon", state)]);
              }
              if (iconVectors[iv].fills && iconVectors[iv].fills.length > 0) {
                iconVectors[iv].fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
                bindPaintVar(iconVectors[iv], "fills", 0, varMap[accordionColorPath(variant, "header-icon", state)]);
              }
            }
          } else {
            icon = createAccordionChevron(varMap, accordionColorPath(variant, "header-icon", state));
          }
          headerRow.appendChild(icon);

          if (expanded) {
            var panel = figma.createFrame();
            panel.name = "Panel";
            panel.layoutMode = "VERTICAL";
            panel.primaryAxisSizingMode = "AUTO";
            panel.counterAxisSizingMode = "FIXED";
            panel.itemSpacing = 0;
            panel.paddingLeft = 12;
            panel.paddingRight = 12;
            panel.paddingTop = 12;
            panel.paddingBottom = 12;
            panel.fills = [{ type: "SOLID", color: { r: 0.09, g: 0.1, b: 0.15 } }];
            panel.strokes = [{ type: "SOLID", color: { r: 0.22, g: 0.24, b: 0.34 } }];
            panel.strokeAlign = "INSIDE";
            panel.strokeTopWeight = 0;
            panel.strokeRightWeight = isDefaultVariant ? 0 : 1;
            panel.strokeBottomWeight = 1;
            panel.strokeLeftWeight = isDefaultVariant ? 0 : 1;
            bindPaintVar(panel, "fills", 0, varMap["accordion/" + variant + "-panel-background"]);
            bindPaintVar(panel, "strokes", 0, varMap["accordion/" + variant + "-panel-border"]);
            bindVar(panel, "strokeRightWeight", isDefaultVariant ? null : varMap["accordion/border-width"]);
            bindVar(panel, "strokeBottomWeight", varMap["accordion/border-width"]);
            bindVar(panel, "strokeLeftWeight", isDefaultVariant ? null : varMap["accordion/border-width"]);
            bindVar(panel, "paddingLeft", varMap["accordion/panel-padding-x"]);
            bindVar(panel, "paddingRight", varMap["accordion/panel-padding-x"]);
            bindVar(panel, "paddingTop", varMap["accordion/panel-padding-y"]);
            bindVar(panel, "paddingBottom", varMap["accordion/panel-padding-y"]);
            applyAccordionPanelRadii(panel, varMap, variant, position, expanded);
            panel.clipsContent = true;
            comp.appendChild(panel);
            try { panel.layoutAlign = "STRETCH"; } catch (_accordionPanelStretchErr) {}
            try { panel.layoutSizingHorizontal = "FILL"; } catch (_accordionPanelFillErr) {}
            panel.resizeWithoutConstraints(468, 51);

            var slotHost = null;
            if (typeof comp.createSlot === "function") {
              slotHost = comp.createSlot();
            } else {
              slotHost = figma.createFrame();
            }
            slotHost.name = "AccordionContent";
            slotHost.layoutMode = "VERTICAL";
            slotHost.primaryAxisSizingMode = "AUTO";
            slotHost.counterAxisSizingMode = "FIXED";
            slotHost.itemSpacing = 0;
            slotHost.paddingLeft = 0;
            slotHost.paddingRight = 0;
            slotHost.paddingTop = 0;
            slotHost.paddingBottom = 0;
            slotHost.fills = [];
            slotHost.strokes = [];
            slotHost.resizeWithoutConstraints(444, 27);
            panel.appendChild(slotHost);
            try { slotHost.layoutPositioning = "AUTO"; } catch (_accordionSlotHostPositionErr) {}
            try { slotHost.layoutAlign = "STRETCH"; } catch (_accordionSlotHostAlignErr) {}
            try { slotHost.layoutSizingHorizontal = "FILL"; } catch (_accordionSlotHostFillErr) {}
          }

          var colIndex = vi * positions.length + pi;
          var rowIndex = si * expandedModes.length + ei;
          comp.x = colIndex * (colWidth + gap);
          comp.y = rowIndex * (rowHeight + gap);
          page.appendChild(comp);
          components.push(comp);
        }
      }
    }
  }

  progress("Created " + components.length + " accordion item variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Accordion Item";
  return componentSet;
}

function buildAccordionContentTextComponentSet(varMap, page, font) {
  var states = ["default", "disabled"];
  var components = [];
  for (var si = 0; si < states.length; si++) {
    var state = states[si];
    var comp = figma.createComponent();
    comp.name = "State=" + capTokenValue(state);
    comp.layoutMode = "VERTICAL";
    comp.primaryAxisSizingMode = "AUTO";
    comp.counterAxisSizingMode = "FIXED";
    comp.resizeWithoutConstraints(320, 80);
    comp.paddingLeft = 16;
    comp.paddingRight = 16;
    comp.paddingTop = 12;
    comp.paddingBottom = 12;
    comp.fills = [{ type: "SOLID", color: { r: 0.98, g: 0.99, b: 1 } }];
    bindPaintVar(comp, "fills", 0, varMap["accordion/default-panel-background"]);
    bindVar(comp, "paddingLeft", varMap["accordion/panel-padding-x"]);
    bindVar(comp, "paddingRight", varMap["accordion/panel-padding-x"]);
    bindVar(comp, "paddingTop", varMap["accordion/panel-padding-y"]);
    bindVar(comp, "paddingBottom", varMap["accordion/panel-padding-y"]);

    var text = figma.createText();
    text.name = "Content";
    text.fontName = font;
    text.characters = "Text content slot. Use for paragraph details.";
    text.fontSize = 14;
    text.fills = [{ type: "SOLID", color: { r: 0.31, g: 0.35, b: 0.4 } }];
    bindPaintVar(text, "fills", 0, varMap["accordion/default-content-text"]);
    bindVar(text, "fontSize", varMap["accordion/content-font-size"]);
    bindVar(text, "fontFamily", varMap["accordion/content-font-family"]);
    bindVar(text, "fontStyle", varMap["accordion/content-font-weight"]);
    bindVar(text, "lineHeight", varMap["accordion/content-line-height"]);
    comp.appendChild(text);
    if (state === "disabled") comp.opacity = 0.65;

    comp.x = si * 380;
    comp.y = 0;
    page.appendChild(comp);
    components.push(comp);
  }
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Accordion Content / Text";
  return componentSet;
}

function buildAccordionContentDataGridComponentSet(varMap, page, font) {
  var states = ["default", "disabled"];
  var components = [];
  for (var si = 0; si < states.length; si++) {
    var state = states[si];
    var comp = figma.createComponent();
    comp.name = "State=" + capTokenValue(state);
    comp.layoutMode = "VERTICAL";
    comp.primaryAxisSizingMode = "AUTO";
    comp.counterAxisSizingMode = "FIXED";
    comp.resizeWithoutConstraints(320, 124);
    comp.paddingLeft = 16;
    comp.paddingRight = 16;
    comp.paddingTop = 12;
    comp.paddingBottom = 12;
    comp.itemSpacing = 8;
    comp.fills = [{ type: "SOLID", color: { r: 0.98, g: 0.99, b: 1 } }];
    bindPaintVar(comp, "fills", 0, varMap["accordion/default-panel-background"]);

    var headers = figma.createText();
    headers.name = "Headers";
    headers.fontName = font;
    headers.characters = "Name           Value          Status";
    headers.fontSize = 13;
    headers.fills = [{ type: "SOLID", color: { r: 0.31, g: 0.35, b: 0.4 } }];
    bindPaintVar(headers, "fills", 0, varMap["accordion/default-content-text"]);
    bindVar(headers, "fontFamily", varMap["accordion/content-font-family"]);
    comp.appendChild(headers);

    var row1 = figma.createText();
    row1.name = "Row 1";
    row1.fontName = font;
    row1.characters = "Bandwidth      120ms          Healthy";
    row1.fontSize = 14;
    row1.fills = [{ type: "SOLID", color: { r: 0.31, g: 0.35, b: 0.4 } }];
    bindPaintVar(row1, "fills", 0, varMap["accordion/default-content-text"]);
    bindVar(row1, "fontSize", varMap["accordion/content-font-size"]);
    bindVar(row1, "fontFamily", varMap["accordion/content-font-family"]);
    bindVar(row1, "fontStyle", varMap["accordion/content-font-weight"]);
    bindVar(row1, "lineHeight", varMap["accordion/content-line-height"]);
    comp.appendChild(row1);

    var row2 = figma.createText();
    row2.name = "Row 2";
    row2.fontName = font;
    row2.characters = "Latency        32ms           Healthy";
    row2.fontSize = 14;
    row2.fills = [{ type: "SOLID", color: { r: 0.31, g: 0.35, b: 0.4 } }];
    bindPaintVar(row2, "fills", 0, varMap["accordion/default-content-text"]);
    bindVar(row2, "fontSize", varMap["accordion/content-font-size"]);
    bindVar(row2, "fontFamily", varMap["accordion/content-font-family"]);
    bindVar(row2, "fontStyle", varMap["accordion/content-font-weight"]);
    bindVar(row2, "lineHeight", varMap["accordion/content-line-height"]);
    comp.appendChild(row2);

    if (state === "disabled") comp.opacity = 0.65;
    comp.x = si * 380;
    comp.y = 180;
    page.appendChild(comp);
    components.push(comp);
  }
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Accordion Content / DataGrid";
  return componentSet;
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

async function buildTabsComponentSet(varMap, page, font, selectedVariants) {
  validateTabsVariables(varMap);

  var variants = (selectedVariants && selectedVariants.length > 0)
    ? selectedVariants.slice()
    : ["default", "outlined", "pills"];
  var orientations = ["horizontal", "vertical"];
  var leftIconModes = ["off", "on"];
  var rightIconModes = ["off", "on"];
  var leftArrowModes = ["off", "on"];
  var rightArrowModes = ["off", "on"];
  var menuModes = ["off", "on"];
  var radii = ["default", "xs", "sm", "md", "lg", "xl"];
  var states = ["default", "hover", "focus", "disabled"];
  var components = [];

  var gap = 24;
  var placements = [];
  var colWidths = [];
  var rowHeights = [];

  var iconComponents = await findTabsIconComponents();
  var tabsMenuTemplate = findTabsMenuTemplateComponent(page);
  var menuIconComponents = null;
  if (!tabsMenuTemplate) {
    menuIconComponents = await findMenuIconComponents();
    progress("[Tabs] Warning: Menu component template not found; using inline menu fallback.");
  }
  if (!iconComponents.image) progress("[Tabs] Warning: Image icon component not found on icons page");
  if (!iconComponents.message) progress("[Tabs] Warning: Message icon component not found on icons page");
  if (!iconComponents.settings) progress("[Tabs] Warning: Settings icon component not found on icons page");
  if (!iconComponents.chevronLeft) progress("[Tabs] Warning: Left arrow icon component not found on icons page");
  if (!iconComponents.chevronRight) progress("[Tabs] Warning: Right arrow icon component not found on icons page");
  if (!iconComponents.menu) progress("[Tabs] Warning: Menu icon component not found on icons page");

  for (var vi = 0; vi < variants.length; vi++) {
    var variant = variants[vi];
    var visualVariant = tabsVisualVariant(variant);
    var capVariant = variant.charAt(0).toUpperCase() + variant.slice(1);

    for (var oi = 0; oi < orientations.length; oi++) {
      var orientation = orientations[oi];
      var capOrientation = orientation.charAt(0).toUpperCase() + orientation.slice(1);

      for (var li = 0; li < leftIconModes.length; li++) {
        var leftIconMode = leftIconModes[li];
        var showLeftIcon = leftIconMode === "on";
        var capLeftIcon = showLeftIcon ? "On" : "Off";

        for (var rmi = 0; rmi < rightIconModes.length; rmi++) {
          var rightIconMode = rightIconModes[rmi];
          var showRightIcon = rightIconMode === "on";
          var capRightIcon = showRightIcon ? "On" : "Off";

          var supportsArrowControls =
            orientation === "horizontal" && (variant === "default" || variant === "outlined");
          var leftArrowModesForVariant = supportsArrowControls
            ? leftArrowModes
            : ["off"];
          var rightArrowModesForVariant = supportsArrowControls
            ? rightArrowModes
            : ["off"];
          for (var lai = 0; lai < leftArrowModesForVariant.length; lai++) {
            var leftArrowMode = leftArrowModesForVariant[lai];
            var showLeftArrow = leftArrowMode === "on";
            var capLeftArrow = showLeftArrow ? "On" : "Off";
            for (var rai = 0; rai < rightArrowModesForVariant.length; rai++) {
              var rightArrowMode = rightArrowModesForVariant[rai];
              var showRightArrow = rightArrowMode === "on";
              var capRightArrow = showRightArrow ? "On" : "Off";
              var menuModesForVariant =
                orientation === "horizontal" && (variant === "default" || variant === "outlined")
                  ? menuModes
                  : ["off"];
              for (var mi = 0; mi < menuModesForVariant.length; mi++) {
                var menuMode = menuModesForVariant[mi];
                var showMenu = menuMode === "on";
                var capMenu = showMenu ? "On" : "Off";

              // Default tabs do not visually use corner radius, so avoid redundant radius variants.
              var radiiForVariant = variant === "default" ? ["default"] : radii;
              for (var ri = 0; ri < radiiForVariant.length; ri++) {
                var rad = radiiForVariant[ri];
                var capRadius = rad === "default" ? "Default" : rad.toUpperCase();
                var overflowControlsAllowed = rad === "default";
                var effectiveShowLeftArrow = showLeftArrow && overflowControlsAllowed;
                var effectiveShowRightArrow = showRightArrow && overflowControlsAllowed;
                var effectiveShowMenu = showMenu && overflowControlsAllowed;
                for (var si = 0; si < states.length; si++) {
                  var state = states[si];
                  var capState = state.charAt(0).toUpperCase() + state.slice(1);

                  var comp = figma.createComponent();
                  comp.name = "Variant=" + capVariant + ", Orientation=" + capOrientation +
                              ", LeftIcon=" + capLeftIcon + ", RightIcon=" + capRightIcon +
                              ", LeftArrow=" + capLeftArrow + ", RightArrow=" + capRightArrow +
                              ", Menu=" + capMenu + ", Radius=" + capRadius + ", State=" + capState;
              comp.layoutMode = "VERTICAL";
              comp.primaryAxisSizingMode = "AUTO";
              comp.counterAxisSizingMode = "AUTO";
              comp.itemSpacing = effectiveShowMenu ? 6 : 0;
              comp.fills = [];
              comp.clipsContent = false;
              try { comp.layoutSizingHorizontal = "HUG"; } catch (_tabsCompHugWidthErr) {}
              try { comp.layoutSizingVertical = "HUG"; } catch (_tabsCompHugHeightErr) {}

              var list = figma.createFrame();
              list.name = "List";
              list.layoutMode = orientation === "horizontal" ? "HORIZONTAL" : "VERTICAL";
              list.primaryAxisSizingMode = "AUTO";
              list.counterAxisSizingMode = "AUTO";
              list.layoutPositioning = "AUTO";
              list.primaryAxisAlignItems = "MIN";
              list.counterAxisAlignItems = "MIN";
              list.itemSpacing = 8;
              list.paddingLeft = 0;
              list.paddingRight = 0;
              list.paddingTop = 0;
              list.paddingBottom = 0;
              list.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
              list.strokes = visualVariant === "pills" ? [] : [{ type: "SOLID", color: { r: 0.78, g: 0.78, b: 0.78 } }];
              list.strokeAlign = "INSIDE";
              list.clipsContent = false;
              try { list.layoutSizingHorizontal = "HUG"; } catch (_tabsListHugWidthErr) {}
              try { list.layoutSizingVertical = "HUG"; } catch (_tabsListHugHeightErr) {}
              var radiusVar = varMap["tabs/" + variant + "-radius-" + rad];

              bindPaintVar(list, "fills", 0, varMap["tabs/" + variant + "-list-background"]);
              if (visualVariant !== "pills") {
                bindPaintVar(list, "strokes", 0, varMap["tabs/" + variant + "-list-border"]);
              }
              if (variant === "default") {
                list.strokeTopWeight = 0;
                list.strokeLeftWeight = 0;
                list.strokeBottomWeight = 0;
                list.strokeRightWeight = 0;
                if (orientation === "horizontal") {
                  bindVar(list, "strokeBottomWeight", varMap["tabs/list-border-width"]);
                } else {
                  bindVar(list, "strokeRightWeight", varMap["tabs/list-border-width"]);
                }
              } else if (visualVariant === "pills") {
                list.strokeWeight = 0;
              } else {
                // Match preview behavior: outlined list border is a single edge (bottom/right),
                // not a full rectangular border.
                list.strokeTopWeight = 0;
                list.strokeLeftWeight = 0;
                list.strokeBottomWeight = 0;
                list.strokeRightWeight = 0;
                if (orientation === "horizontal") {
                  bindVar(list, "strokeBottomWeight", varMap["tabs/list-border-width"]);
                } else {
                  bindVar(list, "strokeRightWeight", varMap["tabs/list-border-width"]);
                }
              }
              bindVar(list, "paddingLeft", varMap["tabs/" + variant + "-list-padding"]);
              bindVar(list, "paddingRight", varMap["tabs/" + variant + "-list-padding"]);
              bindVar(list, "paddingTop", varMap["tabs/" + variant + "-list-padding"]);
              bindVar(list, "paddingBottom", varMap["tabs/" + variant + "-list-padding"]);
              bindVar(list, "itemSpacing", varMap["tabs/" + variant + "-list-gap"]);
              if (variant === "default") {
                list.topLeftRadius = 0;
                list.topRightRadius = 0;
                list.bottomLeftRadius = 0;
                list.bottomRightRadius = 0;
              } else {
                bindVar(list, "topLeftRadius", radiusVar);
                bindVar(list, "topRightRadius", radiusVar);
                bindVar(list, "bottomLeftRadius", radiusVar);
                bindVar(list, "bottomRightRadius", radiusVar);
              }

              var tabDefs = [
                { label: "Tab", active: false, icon: "image" },
                { label: "Tab", active: true, icon: "message" },
                { label: "Tab", active: false, icon: "settings" },
                { label: "Tab", active: false, icon: "image" },
              ];

              for (var ti = 0; ti < tabDefs.length; ti++) {
                var tabDef = tabDefs[ti];
                var tab = figma.createFrame();
                tab.name = "Tab/" + tabDef.label;
                tab.layoutMode = "HORIZONTAL";
                tab.primaryAxisSizingMode = "AUTO";
                tab.counterAxisSizingMode = "AUTO";
                tab.layoutPositioning = "AUTO";
                tab.primaryAxisAlignItems = "CENTER";
                tab.counterAxisAlignItems = "CENTER";
                tab.paddingLeft = 12;
                tab.paddingRight = 12;
                tab.paddingTop = 8;
                tab.paddingBottom = 8;
                tab.fills = variant === "default" ? [] : [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
                tab.strokes = variant === "default" ? [] : [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
                tab.strokeAlign = "INSIDE";
                tab.clipsContent = false;
                try { tab.layoutSizingHorizontal = "HUG"; } catch (_tabsTabHugWidthErr) {}
                try { tab.layoutSizingVertical = "HUG"; } catch (_tabsTabHugHeightErr) {}
                var tabContent = tab;

                if (variant === "default") {
                  tab.layoutMode = orientation === "horizontal" ? "VERTICAL" : "HORIZONTAL";
                  tab.primaryAxisAlignItems = "MIN";
                  tab.counterAxisAlignItems = "MIN";
                  tab.itemSpacing = 0;
                  tab.paddingLeft = 0;
                  tab.paddingRight = 0;
                  tab.paddingTop = 0;
                  tab.paddingBottom = 0;

                  tabContent = figma.createFrame();
                  tabContent.name = "Content";
                  tabContent.layoutMode = "HORIZONTAL";
                  tabContent.primaryAxisSizingMode = "AUTO";
                  tabContent.counterAxisSizingMode = "AUTO";
                  tabContent.layoutPositioning = "AUTO";
                  tabContent.primaryAxisAlignItems = "CENTER";
                  tabContent.counterAxisAlignItems = "CENTER";
                  tabContent.paddingLeft = 12;
                  tabContent.paddingRight = 12;
                  tabContent.paddingTop = 8;
                  tabContent.paddingBottom = 8;
                  tabContent.fills = [];
                  tabContent.strokes = [];
                  tabContent.clipsContent = false;
                  try { tabContent.layoutSizingHorizontal = "HUG"; } catch (_tabsContentHugWidthErr) {}
                  try { tabContent.layoutSizingVertical = "HUG"; } catch (_tabsContentHugHeightErr) {}

                  bindVar(tabContent, "paddingLeft", varMap["tabs/" + variant + "-tab-padding-x"]);
                  bindVar(tabContent, "paddingRight", varMap["tabs/" + variant + "-tab-padding-x"]);
                  bindVar(tabContent, "paddingTop", varMap["tabs/" + variant + "-tab-padding-y"]);
                  bindVar(tabContent, "paddingBottom", varMap["tabs/" + variant + "-tab-padding-y"]);

                  tab.appendChild(tabContent);
                } else {
                  bindVar(tab, "paddingLeft", varMap["tabs/" + variant + "-tab-padding-x"]);
                  bindVar(tab, "paddingRight", varMap["tabs/" + variant + "-tab-padding-x"]);
                  bindVar(tab, "paddingTop", varMap["tabs/" + variant + "-tab-padding-y"]);
                  bindVar(tab, "paddingBottom", varMap["tabs/" + variant + "-tab-padding-y"]);
                }

                if (variant !== "default") {
                  bindVar(tab, "topLeftRadius", radiusVar);
                  bindVar(tab, "topRightRadius", radiusVar);
                  bindVar(tab, "bottomLeftRadius", radiusVar);
                  bindVar(tab, "bottomRightRadius", radiusVar);
                }

                var visualState = "default";
                if (state === "disabled") visualState = "disabled";
                else if (state === "hover") visualState = tabDef.active ? "hover" : "default";
                else if (state === "active" || state === "default" || state === "focus") {
                  visualState = tabDef.active ? "active" : "default";
                }

                var tabBgPath = tabsTabColorPath(variant, "background", visualState);
                var tabTextPath = tabsTabColorPath(variant, "text", visualState);
                var tabBorderPath = tabsTabColorPath(variant, "border", visualState);
                var tabBorderWidthActiveVar =
                  varMap["tabs/" + variant + "-tab-border-width-active"] ||
                  varMap["tabs/tab-border-width-active"];

                if (variant !== "default") {
                  bindPaintVar(tab, "fills", 0, varMap[tabBgPath]);
                }
                if (variant === "default" && visualState === "active") {
                  tabContent.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
                  bindPaintVar(tabContent, "fills", 0, varMap[tabBgPath]);
                }
                if (variant !== "default") {
                  var tabBorderWidthVar = visualState === "active"
                    ? tabBorderWidthActiveVar
                    : varMap["tabs/tab-border-width"];
                  bindVar(tab, "strokeWeight", tabBorderWidthVar);
                  bindPaintVar(tab, "strokes", 0, varMap[tabBorderPath]);
                  if (variant === "outlined" && orientation === "horizontal" && visualState === "active") {
                    tab.strokeBottomWeight = 0;
                  }
                  if (variant === "outlined" && orientation === "horizontal" && ti > 0) {
                    tab.strokeLeftWeight = 0;
                  } else if (variant === "outlined" && orientation === "vertical" && ti > 0) {
                    tab.strokeTopWeight = 0;
                  }
                }

                if (showLeftIcon) {
                  var iconComp = iconComponents[tabDef.icon] || null;
                  if (iconComp) {
                    var iconInst = iconComp.createInstance();
                    iconInst.name = "LeftIcon";
                    iconInst.layoutPositioning = "AUTO";
                    iconInst.resize(16, 16);
                    bindVar(iconInst, "width", varMap["tabs/icon-size"]);
                    bindVar(iconInst, "height", varMap["tabs/icon-size"]);

                    var vectors = iconInst.findAll(function(n) { return n.type === "VECTOR"; });
                    for (var vci = 0; vci < vectors.length; vci++) {
                      bindVar(vectors[vci], "strokeWeight", varMap["tabs/icon-stroke-width"]);
                      if (vectors[vci].strokes && vectors[vci].strokes.length > 0) {
                        vectors[vci].strokes = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
                        bindPaintVar(vectors[vci], "strokes", 0, varMap[tabTextPath]);
                      }
                      if (vectors[vci].fills && vectors[vci].fills.length > 0) {
                        vectors[vci].fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
                        bindPaintVar(vectors[vci], "fills", 0, varMap[tabTextPath]);
                      }
                    }
                    tabContent.appendChild(iconInst);
                  }
                }

                var labelNode = figma.createText();
                labelNode.name = "Label";
                labelNode.layoutPositioning = "AUTO";
                labelNode.fontName = font;
                labelNode.characters = tabDef.label;
                labelNode.fontSize = 14;
                labelNode.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
                bindVar(labelNode, "fontSize", varMap["tabs/font-size"]);
                bindVar(labelNode, "fontFamily", varMap["tabs/font-family"]);
                bindVar(labelNode, "fontStyle", varMap["tabs/font-weight"]);
                bindVar(labelNode, "lineHeight", varMap["tabs/line-height"]);
                bindPaintVar(labelNode, "fills", 0, varMap[tabTextPath]);
                tabContent.appendChild(labelNode);

                if (showRightIcon) {
                  var closeComp = iconComponents.close || iconComponents.settings || iconComponents.message || null;
                  if (closeComp) {
                    var closeInst = closeComp.createInstance();
                    closeInst.name = "RightIcon";
                    closeInst.layoutPositioning = "AUTO";
                    closeInst.resize(16, 16);
                    bindVar(closeInst, "width", varMap["tabs/icon-size"]);
                    bindVar(closeInst, "height", varMap["tabs/icon-size"]);
                    var closeVectors = closeInst.findAll(function(n) { return n.type === "VECTOR"; });
                    for (var cvi = 0; cvi < closeVectors.length; cvi++) {
                      bindVar(closeVectors[cvi], "strokeWeight", varMap["tabs/icon-stroke-width"]);
                      if (closeVectors[cvi].strokes && closeVectors[cvi].strokes.length > 0) {
                        closeVectors[cvi].strokes = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
                        bindPaintVar(closeVectors[cvi], "strokes", 0, varMap[tabTextPath]);
                      }
                      if (closeVectors[cvi].fills && closeVectors[cvi].fills.length > 0) {
                        closeVectors[cvi].fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
                        bindPaintVar(closeVectors[cvi], "fills", 0, varMap[tabTextPath]);
                      }
                    }
                    tabContent.appendChild(closeInst);
                  }
                }

                if (showLeftIcon || showRightIcon) {
                  bindVar(tabContent, "itemSpacing", varMap["tabs/icon-gap"]);
                }

                if (variant === "default" && tabDef.active && (visualState === "active" || visualState === "hover" || visualState === "disabled")) {
                  var indicator = figma.createRectangle();
                  indicator.name = "ActiveIndicator";
                  indicator.layoutPositioning = "AUTO";
                  indicator.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
                  indicator.strokes = [];
                  bindPaintVar(indicator, "fills", 0, varMap[tabBorderPath]);
                  indicator.resize(1, 1);
                  indicator.layoutAlign = "STRETCH";
                  if (orientation === "horizontal") {
                    bindVar(indicator, "height", tabBorderWidthActiveVar);
                  } else {
                    bindVar(indicator, "width", tabBorderWidthActiveVar);
                  }
                  tab.appendChild(indicator);
                }

                if (state === "focus" && tabDef.active) {
                  var focusRing = figma.createRectangle();
                  focusRing.name = "FocusRing";
                  focusRing.fills = [];
                  focusRing.strokes = [{ type: "SOLID", color: { r: 0.2, g: 0.53, b: 0.9 } }];
                  focusRing.strokeAlign = "INSIDE";
                  focusRing.strokeWeight = 2;
                  bindPaintVar(focusRing, "strokes", 0, varMap["tabs/focus-ring"]);
                  bindVar(focusRing, "strokeWeight", tabBorderWidthActiveVar);

                  if (variant !== "default") {
                    bindVar(focusRing, "topLeftRadius", radiusVar);
                    bindVar(focusRing, "topRightRadius", radiusVar);
                    bindVar(focusRing, "bottomLeftRadius", radiusVar);
                    bindVar(focusRing, "bottomRightRadius", radiusVar);
                  }

                  tab.appendChild(focusRing);
                  focusRing.layoutPositioning = "ABSOLUTE";
                  focusRing.x = 0;
                  focusRing.y = 0;
                  try {
                    focusRing.resize(tab.width, tab.height);
                  } catch (focusResizeErr) {}
                  focusRing.constraints = { horizontal: "STRETCH", vertical: "STRETCH" };
                }

                list.appendChild(tab);
              }

              var rootNode = list;
              if (orientation === "horizontal" && (effectiveShowLeftArrow || effectiveShowRightArrow || effectiveShowMenu)) {
                var arrowsRow = figma.createFrame();
                arrowsRow.name = "TabsWithArrows";
                arrowsRow.layoutMode = "HORIZONTAL";
                arrowsRow.primaryAxisSizingMode = "AUTO";
                arrowsRow.counterAxisSizingMode = "AUTO";
                arrowsRow.primaryAxisAlignItems = "MIN";
                arrowsRow.counterAxisAlignItems = "MIN";
                arrowsRow.itemSpacing = 0;
                arrowsRow.fills = [];
                arrowsRow.strokes = [];
                arrowsRow.clipsContent = false;
                try { arrowsRow.layoutSizingHorizontal = "HUG"; } catch (_tabsArrowsRowHugWidthErr) {}
                try { arrowsRow.layoutSizingVertical = "HUG"; } catch (_tabsArrowsRowHugHeightErr) {}

                if (effectiveShowLeftArrow) {
                  arrowsRow.appendChild(
                    createTabsOverflowControl({
                      kind: "left-arrow",
                      variant: variant,
                      state: state,
                      iconComponents: iconComponents,
                      varMap: varMap,
                    })
                  );
                }
                var centerNode = list;
                if (variant === "outlined") {
                  var viewport = figma.createFrame();
                  viewport.name = "OverflowViewport";
                  viewport.layoutMode = "HORIZONTAL";
                  viewport.primaryAxisSizingMode = "AUTO";
                  viewport.counterAxisSizingMode = "AUTO";
                  viewport.primaryAxisAlignItems = "MIN";
                  viewport.counterAxisAlignItems = "MIN";
                  viewport.itemSpacing = 0;
                  viewport.fills = [];
                  viewport.strokes = [];
                  viewport.clipsContent = true;
                  try { viewport.layoutSizingHorizontal = "HUG"; } catch (_tabsViewportHugWidthErr) {}
                  try { viewport.layoutSizingVertical = "HUG"; } catch (_tabsViewportHugHeightErr) {}
                  viewport.appendChild(list);

                  var fadeHeight = Math.max(1, Math.round(list.height || 52));
                  if (effectiveShowLeftArrow) {
                    var leftFade = createTabsFadeCap({
                      side: "left",
                      variant: variant,
                      state: state,
                      height: fadeHeight,
                      varMap: varMap,
                    });
                    viewport.appendChild(leftFade);
                    leftFade.layoutPositioning = "ABSOLUTE";
                    leftFade.x = 0;
                    leftFade.y = 0;
                  }
                  if (effectiveShowRightArrow || effectiveShowMenu) {
                    var rightFade = createTabsFadeCap({
                      side: "right",
                      variant: variant,
                      state: state,
                      height: fadeHeight,
                      varMap: varMap,
                    });
                    viewport.appendChild(rightFade);
                    rightFade.layoutPositioning = "ABSOLUTE";
                    rightFade.x = Math.max(0, Math.round(list.width || 0) - Math.round(rightFade.width || 32));
                    rightFade.y = 0;
                  }
                  centerNode = viewport;
                }

                arrowsRow.appendChild(centerNode);
                if (effectiveShowRightArrow) {
                  arrowsRow.appendChild(
                    createTabsOverflowControl({
                      kind: "right-arrow",
                      variant: variant,
                      state: state,
                      iconComponents: iconComponents,
                      varMap: varMap,
                    })
                  );
                }
                if (effectiveShowMenu) {
                  arrowsRow.appendChild(
                    createTabsOverflowControl({
                      kind: "menu",
                      side: "left",
                      variant: variant,
                      state: state,
                      iconComponents: iconComponents,
                      varMap: varMap,
                    })
                  );
                }
                rootNode = arrowsRow;
              }

              comp.appendChild(rootNode);
              if (effectiveShowMenu && orientation === "horizontal") {
                var menuDropdown = createTabsMenuDropdown({
                  page: page,
                  varMap: varMap,
                  font: font,
                  state: state,
                  templateComponent: tabsMenuTemplate,
                  iconComponents: menuIconComponents,
                });
                if (menuDropdown) {
                  var menuWrap = figma.createFrame();
                  menuWrap.name = "MenuAnchor";
                  menuWrap.layoutMode = "HORIZONTAL";
                  menuWrap.primaryAxisSizingMode = "FIXED";
                  menuWrap.counterAxisSizingMode = "AUTO";
                  menuWrap.primaryAxisAlignItems = "MAX";
                  menuWrap.counterAxisAlignItems = "MIN";
                  menuWrap.itemSpacing = 0;
                  menuWrap.fills = [];
                  menuWrap.strokes = [];
                  menuWrap.layoutPositioning = "AUTO";
                  menuWrap.clipsContent = false;
                  var menuAnchorWidth = Math.max(1, Math.ceil(nodeRenderedWidth(rootNode)));
                  var menuAnchorHeight = Math.max(1, Math.ceil(nodeRenderedHeight(menuDropdown)));
                  try { menuWrap.resizeWithoutConstraints(menuAnchorWidth, menuAnchorHeight); } catch (_tabsMenuWrapResizeErr) {}
                  try { menuWrap.layoutSizingHorizontal = "FIXED"; } catch (_tabsMenuWrapFixedWidthErr) {}
                  try { menuWrap.layoutSizingVertical = "HUG"; } catch (_tabsMenuWrapHugErr) {}
                  menuWrap.appendChild(menuDropdown);
                  comp.appendChild(menuWrap);
                }
              }

              page.appendChild(comp);
              var colIndex =
                ((((((vi * orientations.length + oi) * leftIconModes.length + li) * rightIconModes.length + rmi)
                  * leftArrowModes.length + lai)
                  * rightArrowModes.length + rai)
                  * menuModes.length + mi);
              var rowIndex = ri * states.length + si;
              var renderedWidth = Math.ceil(nodeRenderedWidth(comp));
              var renderedHeight = Math.ceil(nodeRenderedHeight(comp));
              colWidths[colIndex] = Math.max(colWidths[colIndex] || 0, renderedWidth);
              rowHeights[rowIndex] = Math.max(rowHeights[rowIndex] || 0, renderedHeight);
              placements.push({ comp: comp, colIndex: colIndex, rowIndex: rowIndex });
              components.push(comp);
            }
            }
          }
        }
      }
    }
  }
  }
}

  // Place variants using measured dimensions so larger token values do not overlap.
  var colOffsets = [];
  var rowOffsets = [];
  var xCursor = 0;
  for (var c = 0; c < colWidths.length; c++) {
    colOffsets[c] = xCursor;
    xCursor += (colWidths[c] || 0) + gap;
  }
  var yCursor = 0;
  for (var r = 0; r < rowHeights.length; r++) {
    rowOffsets[r] = yCursor;
    yCursor += (rowHeights[r] || 0) + gap;
  }
  for (var pi = 0; pi < placements.length; pi++) {
    var placement = placements[pi];
    placement.comp.x = colOffsets[placement.colIndex] || 0;
    placement.comp.y = rowOffsets[placement.rowIndex] || 0;
  }

  progress("Created " + components.length + " tabs variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Tabs";
  return componentSet;
}

function findTabsMenuTemplateComponent(page) {
  if (!page || typeof page.findOne !== "function") return null;
  var menuSet = null;
  try {
    menuSet = page.findOne(function (n) {
      return n && n.type === "COMPONENT_SET" && String(n.name || "").toLowerCase() === "menu";
    });
  } catch (_tabsMenuSetFindErr) {
    menuSet = null;
  }
  if (!menuSet || !menuSet.children || !menuSet.children.length) return null;

  var firstComp = null;
  var defaultComp = null;
  for (var i = 0; i < menuSet.children.length; i++) {
    var child = menuSet.children[i];
    if (!child || child.type !== "COMPONENT") continue;
    if (!firstComp) firstComp = child;
    var lowerName = String(child.name || "").toLowerCase();
    var hasDefaultState = lowerName.indexOf("state=default") >= 0;
    var hasSectionOn = lowerName.indexOf("section=on") >= 0;
    var hasIconOn = lowerName.indexOf("icon=on") >= 0;
    if (hasDefaultState && hasSectionOn && hasIconOn) return child;
    if (!defaultComp && hasDefaultState) defaultComp = child;
  }
  return defaultComp || firstComp;
}

function setInstancePropertyByBaseName(instance, baseName, value) {
  if (!instance || typeof instance.setProperties !== "function") return;
  var meta = instance.componentProperties || {};
  var keys = Object.keys(meta);
  var targetKey = null;
  for (var i = 0; i < keys.length; i++) {
    var base = String(keys[i] || "").split("#")[0];
    if (base.toLowerCase() === String(baseName || "").toLowerCase()) {
      targetKey = keys[i];
      break;
    }
  }
  if (!targetKey) return;
  var patch = {};
  patch[targetKey] = value;
  try { instance.setProperties(patch); } catch (_tabsSetInstPropErr) {}
}

function createTabsMenuDropdown(options) {
  var varMap = (options && options.varMap) || {};
  var font = (options && options.font) || { family: "Inter", style: "Regular" };
  var state = (options && options.state) || "default";
  var templateComponent = options && options.templateComponent;
  var iconComponents = (options && options.iconComponents) || {};

  var effectiveMenuState = state === "disabled" ? "Disabled" : "Default";

  if (templateComponent && templateComponent.type === "COMPONENT") {
    var inst = null;
    try {
      inst = templateComponent.createInstance();
      inst.name = "Menu";
      inst.layoutPositioning = "AUTO";
      setInstancePropertyByBaseName(inst, "State", effectiveMenuState);
      setInstancePropertyByBaseName(inst, "Section", "On");
      setInstancePropertyByBaseName(inst, "Icon", "On");
      return inst;
    } catch (_tabsMenuTemplateErr) {
      inst = null;
    }
  }

  var menu = figma.createFrame();
  menu.name = "Menu";
  menu.layoutMode = "VERTICAL";
  menu.primaryAxisSizingMode = "AUTO";
  menu.counterAxisSizingMode = "AUTO";
  menu.primaryAxisAlignItems = "MIN";
  menu.counterAxisAlignItems = "MIN";
  menu.itemSpacing = 4;
  menu.layoutPositioning = "AUTO";
  menu.clipsContent = false;
  menu.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  menu.strokes = [{ type: "SOLID", color: { r: 0.22, g: 0.24, b: 0.34 } }];
  menu.strokeAlign = "INSIDE";
  menu.paddingLeft = 8;
  menu.paddingRight = 8;
  menu.paddingTop = 8;
  menu.paddingBottom = 8;
  try { menu.layoutSizingHorizontal = "HUG"; } catch (_tabsMenuHugWidthErr) {}
  try { menu.layoutSizingVertical = "HUG"; } catch (_tabsMenuHugHeightErr) {}

  var menuBgVar = effectiveMenuState === "Disabled"
    ? (varMap["menu/background-disabled"] || varMap["menu/background"])
    : varMap["menu/background"];
  var menuBorderVar = effectiveMenuState === "Disabled"
    ? (varMap["menu/border-disabled"] || varMap["menu/border"])
    : varMap["menu/border"];
  var menuDividerVar = effectiveMenuState === "Disabled"
    ? (varMap["menu/divider-disabled"] || varMap["menu/divider"])
    : varMap["menu/divider"];
  var menuSectionVar = effectiveMenuState === "Disabled"
    ? (varMap["menu/section-label-disabled"] || varMap["menu/section-label"])
    : varMap["menu/section-label"];
  bindPaintVar(menu, "fills", 0, menuBgVar);
  bindPaintVar(menu, "strokes", 0, menuBorderVar);
  bindVar(menu, "paddingLeft", varMap["menu/padding"]);
  bindVar(menu, "paddingRight", varMap["menu/padding"]);
  bindVar(menu, "paddingTop", varMap["menu/padding"]);
  bindVar(menu, "paddingBottom", varMap["menu/padding"]);
  bindVar(menu, "width", varMap["menu/width-default"]);
  bindVar(menu, "strokeWeight", varMap["menu/border-width"]);
  var menuRadiusVar = varMap["menu/border-radius-default"] || varMap["menu/radius-default"];
  if (menuRadiusVar) {
    bindVar(menu, "topLeftRadius", menuRadiusVar);
    bindVar(menu, "topRightRadius", menuRadiusVar);
    bindVar(menu, "bottomLeftRadius", menuRadiusVar);
    bindVar(menu, "bottomRightRadius", menuRadiusVar);
  }

  var sectionWrap = figma.createFrame();
  sectionWrap.name = "section-wrap";
  sectionWrap.layoutMode = "VERTICAL";
  sectionWrap.primaryAxisSizingMode = "AUTO";
  sectionWrap.counterAxisSizingMode = "AUTO";
  sectionWrap.primaryAxisAlignItems = "MIN";
  sectionWrap.counterAxisAlignItems = "MIN";
  sectionWrap.paddingLeft = 8;
  sectionWrap.paddingRight = 8;
  sectionWrap.paddingTop = 4;
  sectionWrap.paddingBottom = 4;
  sectionWrap.fills = [];
  sectionWrap.strokes = [];
  try { sectionWrap.layoutSizingHorizontal = "FILL"; } catch (_tabsMenuSectionFillErr) {}
  try { sectionWrap.layoutSizingVertical = "HUG"; } catch (_tabsMenuSectionHugErr) {}
  bindVar(sectionWrap, "paddingBottom", varMap["menu/label-divider-gap"]);

  var section = figma.createText();
  section.name = "Section";
  section.fontName = { family: "Inter", style: "Semi Bold" };
  section.characters = "Actions";
  section.fontSize = 11;
  section.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  bindPaintVar(section, "fills", 0, menuSectionVar);
  sectionWrap.appendChild(section);
  menu.appendChild(sectionWrap);

  var divider = figma.createRectangle();
  divider.name = "divider";
  divider.resize(10, 1);
  divider.layoutAlign = "STRETCH";
  divider.fills = [{ type: "SOLID", color: { r: 0.22, g: 0.24, b: 0.34 } }];
  divider.strokes = [];
  bindPaintVar(divider, "fills", 0, menuDividerVar);
  bindVar(divider, "height", varMap["menu/divider-width"]);
  if (varMap["menu/divider-radius"]) {
    bindVar(divider, "topLeftRadius", varMap["menu/divider-radius"]);
    bindVar(divider, "topRightRadius", varMap["menu/divider-radius"]);
    bindVar(divider, "bottomLeftRadius", varMap["menu/divider-radius"]);
    bindVar(divider, "bottomRightRadius", varMap["menu/divider-radius"]);
  }
  menu.appendChild(divider);

  var items = figma.createFrame();
  items.name = "items";
  items.layoutMode = "VERTICAL";
  items.primaryAxisSizingMode = "AUTO";
  items.counterAxisSizingMode = "AUTO";
  items.primaryAxisAlignItems = "MIN";
  items.counterAxisAlignItems = "MIN";
  items.itemSpacing = 2;
  items.fills = [];
  items.strokes = [];
  items.clipsContent = false;
  try { items.layoutSizingHorizontal = "FILL"; } catch (_tabsMenuItemsFillErr) {}
  try { items.layoutSizingVertical = "HUG"; } catch (_tabsMenuItemsHugErr) {}
  bindVar(items, "itemSpacing", varMap["menu/item-gap"]);
  bindVar(items, "paddingLeft", varMap["menu/content-padding-x"]);
  bindVar(items, "paddingRight", varMap["menu/content-padding-x"]);
  bindVar(items, "paddingTop", varMap["menu/content-padding-y"]);
  bindVar(items, "paddingBottom", varMap["menu/content-padding-y"]);

  var rowState = effectiveMenuState === "Disabled" ? "disabled" : "default";
  var rowBgVar = rowState === "disabled"
    ? varMap["menu/item-background-disabled"]
    : varMap["menu/item-background"];
  var rowTextVar = rowState === "disabled"
    ? varMap["menu/item-text-disabled"]
    : varMap["menu/item-text"];
  var rowIconVar = rowState === "disabled"
    ? varMap["menu/item-icon-disabled"]
    : varMap["menu/item-icon"];
  var itemRadiusVar = varMap["menu/item-border-radius-default"];
  var iconList = [iconComponents.check, iconComponents.plus, iconComponents.alert];
  var labels = ["Open details", "Duplicate", "Archive"];

  for (var ri = 0; ri < labels.length; ri++) {
    var row = figma.createFrame();
    row.name = "Frame";
    row.layoutMode = "HORIZONTAL";
    row.primaryAxisSizingMode = "AUTO";
    row.counterAxisSizingMode = "AUTO";
    row.primaryAxisAlignItems = "MIN";
    row.counterAxisAlignItems = "CENTER";
    row.layoutAlign = "STRETCH";
    row.itemSpacing = 8;
    row.paddingLeft = 10;
    row.paddingRight = 10;
    row.paddingTop = 6;
    row.paddingBottom = 6;
    row.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0, a: 0 } }];
    row.strokes = [];
    row.clipsContent = true;
    bindPaintVar(row, "fills", 0, rowBgVar);
    bindVar(row, "paddingLeft", varMap["menu/item-padding-x"]);
    bindVar(row, "paddingRight", varMap["menu/item-padding-x"]);
    bindVar(row, "paddingTop", varMap["menu/item-padding-y"]);
    bindVar(row, "paddingBottom", varMap["menu/item-padding-y"]);
    bindVar(row, "height", varMap["menu/item-height-default"]);
    if (itemRadiusVar) {
      bindVar(row, "topLeftRadius", itemRadiusVar);
      bindVar(row, "topRightRadius", itemRadiusVar);
      bindVar(row, "bottomLeftRadius", itemRadiusVar);
      bindVar(row, "bottomRightRadius", itemRadiusVar);
    }
    try { row.layoutSizingHorizontal = "FILL"; } catch (_tabsMenuRowFillErr) {}
    try { row.layoutSizingVertical = "HUG"; } catch (_tabsMenuRowHugErr) {}

    var iconComp = iconList[ri] || iconComponents.fallback || null;
    if (iconComp) {
      var iconInst = iconComp.createInstance();
      iconInst.name = "icon";
      iconInst.layoutPositioning = "AUTO";
      try { iconInst.resize(14, 14); } catch (_tabsMenuIconResizeErr) {}
      var vectors = iconInst.findAll(function (n) { return n.type === "VECTOR"; });
      for (var vi = 0; vi < vectors.length; vi++) {
        bindVar(vectors[vi], "strokeWeight", varMap["menu/icon-stroke-width"]);
        if (vectors[vi].strokes && vectors[vi].strokes.length > 0) {
          vectors[vi].strokes = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
          bindPaintVar(vectors[vi], "strokes", 0, rowIconVar);
        }
        if (vectors[vi].fills && vectors[vi].fills.length > 0) {
          vectors[vi].fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
          bindPaintVar(vectors[vi], "fills", 0, rowIconVar);
        }
      }
      row.appendChild(iconInst);
    }

    var label = figma.createText();
    label.name = "Label";
    label.fontName = font;
    label.characters = labels[ri];
    label.fontSize = 13;
    label.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    bindVar(label, "fontSize", varMap["menu/font-size-default"]);
    bindVar(label, "fontFamily", varMap["menu/font-family"]);
    bindVar(label, "fontStyle", varMap["menu/font-weight"]);
    bindVar(label, "lineHeight", varMap["menu/line-height-default"]);
    bindPaintVar(label, "fills", 0, rowTextVar);
    row.appendChild(label);

    items.appendChild(row);
  }

  menu.appendChild(items);
  return menu;
}

async function buildTabsItemComponentSet(varMap, page, font, selectedVariants) {
  validateTabsVariables(varMap);

  var variants = (selectedVariants && selectedVariants.length > 0)
    ? selectedVariants.slice()
    : ["default", "outlined", "pills"];
  var orientations = ["horizontal", "vertical"];
  var leftIconModes = ["off", "on"];
  var rightIconModes = ["off", "on"];
  var radii = ["default", "xs", "sm", "md", "lg", "xl"];
  var states = ["default", "active", "hover", "focus", "disabled"];
  var components = [];

  var gap = 24;
  var placements = [];
  var colWidths = [];
  var rowHeights = [];

  var iconComponents = await findTabsIconComponents();
  if (!iconComponents.image) progress("[Tabs Item] Warning: Image icon component not found on icons page");
  if (!iconComponents.close) progress("[Tabs Item] Warning: Close icon component not found on icons page");

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

        for (var rmi = 0; rmi < rightIconModes.length; rmi++) {
          var rightIconMode = rightIconModes[rmi];
          var showRightIcon = rightIconMode === "on";
          var capRightIcon = showRightIcon ? "On" : "Off";

          var radiiForVariant = variant === "default" ? ["default"] : radii;
          for (var ri = 0; ri < radiiForVariant.length; ri++) {
            var rad = radiiForVariant[ri];
            var capRadius = rad === "default" ? "Default" : rad.toUpperCase();
            for (var si = 0; si < states.length; si++) {
              var state = states[si];
              var capState = state.charAt(0).toUpperCase() + state.slice(1);

              var comp = figma.createComponent();
              comp.name =
                "Variant=" + capVariant +
                ", Orientation=" + capOrientation +
                ", LeftIcon=" + capLeftIcon +
                ", RightIcon=" + capRightIcon +
                ", Radius=" + capRadius +
                ", State=" + capState;
              comp.layoutMode = "HORIZONTAL";
              comp.primaryAxisSizingMode = "AUTO";
              comp.counterAxisSizingMode = "AUTO";
              comp.layoutPositioning = "AUTO";
              comp.primaryAxisAlignItems = "CENTER";
              comp.counterAxisAlignItems = "CENTER";
              comp.paddingLeft = 12;
              comp.paddingRight = 12;
              comp.paddingTop = 8;
              comp.paddingBottom = 8;
              comp.fills = variant === "default" ? [] : [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
              comp.strokes = variant === "default" ? [] : [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
              comp.strokeAlign = "INSIDE";
              comp.clipsContent = false;
              try { comp.layoutSizingHorizontal = "HUG"; } catch (_tabsItemCompHugWidthErr) {}
              try { comp.layoutSizingVertical = "HUG"; } catch (_tabsItemCompHugHeightErr) {}

              var radiusVar = varMap["tabs/" + variant + "-radius-" + rad];

              var tabContent = comp;
              if (variant === "default") {
                comp.layoutMode = orientation === "horizontal" ? "VERTICAL" : "HORIZONTAL";
                comp.primaryAxisAlignItems = "MIN";
                comp.counterAxisAlignItems = "MIN";
                comp.itemSpacing = 0;
                comp.paddingLeft = 0;
                comp.paddingRight = 0;
                comp.paddingTop = 0;
                comp.paddingBottom = 0;

                tabContent = figma.createFrame();
                tabContent.name = "Content";
                tabContent.layoutMode = "HORIZONTAL";
                tabContent.primaryAxisSizingMode = "AUTO";
                tabContent.counterAxisSizingMode = "AUTO";
                tabContent.layoutPositioning = "AUTO";
                tabContent.primaryAxisAlignItems = "CENTER";
                tabContent.counterAxisAlignItems = "CENTER";
                tabContent.paddingLeft = 12;
                tabContent.paddingRight = 12;
                tabContent.paddingTop = 8;
                tabContent.paddingBottom = 8;
                tabContent.fills = [];
                tabContent.strokes = [];
                tabContent.clipsContent = false;
                try { tabContent.layoutSizingHorizontal = "HUG"; } catch (_tabsItemContentHugWidthErr) {}
                try { tabContent.layoutSizingVertical = "HUG"; } catch (_tabsItemContentHugHeightErr) {}

                bindVar(tabContent, "paddingLeft", varMap["tabs/" + variant + "-tab-padding-x"]);
                bindVar(tabContent, "paddingRight", varMap["tabs/" + variant + "-tab-padding-x"]);
                bindVar(tabContent, "paddingTop", varMap["tabs/" + variant + "-tab-padding-y"]);
                bindVar(tabContent, "paddingBottom", varMap["tabs/" + variant + "-tab-padding-y"]);

                comp.appendChild(tabContent);
              } else {
                bindVar(comp, "paddingLeft", varMap["tabs/" + variant + "-tab-padding-x"]);
                bindVar(comp, "paddingRight", varMap["tabs/" + variant + "-tab-padding-x"]);
                bindVar(comp, "paddingTop", varMap["tabs/" + variant + "-tab-padding-y"]);
                bindVar(comp, "paddingBottom", varMap["tabs/" + variant + "-tab-padding-y"]);
              }

              if (variant !== "default") {
                bindVar(comp, "topLeftRadius", radiusVar);
                bindVar(comp, "topRightRadius", radiusVar);
                bindVar(comp, "bottomLeftRadius", radiusVar);
                bindVar(comp, "bottomRightRadius", radiusVar);
              }

              var visualState = state === "focus" ? "active" : state;
              var tabBgPath = tabsTabColorPath(variant, "background", visualState);
              var tabTextPath = tabsTabColorPath(variant, "text", visualState);
              var tabBorderPath = tabsTabColorPath(variant, "border", visualState);
              var tabBorderWidthActiveVar =
                varMap["tabs/" + variant + "-tab-border-width-active"] ||
                varMap["tabs/tab-border-width-active"];

              if (variant !== "default") {
                bindPaintVar(comp, "fills", 0, varMap[tabBgPath]);
              } else if (visualState === "active") {
                tabContent.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
                bindPaintVar(tabContent, "fills", 0, varMap[tabBgPath]);
              }

              if (variant !== "default") {
                var tabBorderWidthVar = visualState === "active"
                  ? tabBorderWidthActiveVar
                  : varMap["tabs/tab-border-width"];
                bindVar(comp, "strokeWeight", tabBorderWidthVar);
                bindPaintVar(comp, "strokes", 0, varMap[tabBorderPath]);
              }

              if (showLeftIcon) {
                var iconComp = iconComponents.image || iconComponents.message || iconComponents.settings || null;
                if (iconComp) {
                  var iconInst = iconComp.createInstance();
                  iconInst.name = "LeftIcon";
                  iconInst.layoutPositioning = "AUTO";
                  iconInst.resize(16, 16);
                  bindVar(iconInst, "width", varMap["tabs/icon-size"]);
                  bindVar(iconInst, "height", varMap["tabs/icon-size"]);

                  var vectors = iconInst.findAll(function(n) { return n.type === "VECTOR"; });
                  for (var vci = 0; vci < vectors.length; vci++) {
                    bindVar(vectors[vci], "strokeWeight", varMap["tabs/icon-stroke-width"]);
                    if (vectors[vci].strokes && vectors[vci].strokes.length > 0) {
                      vectors[vci].strokes = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
                      bindPaintVar(vectors[vci], "strokes", 0, varMap[tabTextPath]);
                    }
                    if (vectors[vci].fills && vectors[vci].fills.length > 0) {
                      vectors[vci].fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
                      bindPaintVar(vectors[vci], "fills", 0, varMap[tabTextPath]);
                    }
                  }
                  tabContent.appendChild(iconInst);
                }
              }

              var labelNode = figma.createText();
              labelNode.name = "Label";
              labelNode.layoutPositioning = "AUTO";
              labelNode.fontName = font;
              labelNode.characters = "Tab";
              labelNode.fontSize = 14;
              labelNode.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
              bindVar(labelNode, "fontSize", varMap["tabs/font-size"]);
              bindVar(labelNode, "fontFamily", varMap["tabs/font-family"]);
              bindVar(labelNode, "fontStyle", varMap["tabs/font-weight"]);
              bindVar(labelNode, "lineHeight", varMap["tabs/line-height"]);
              bindPaintVar(labelNode, "fills", 0, varMap[tabTextPath]);
              tabContent.appendChild(labelNode);

              if (showRightIcon) {
                var closeComp = iconComponents.close || iconComponents.settings || iconComponents.message || null;
                if (closeComp) {
                  var closeInst = closeComp.createInstance();
                  closeInst.name = "RightIcon";
                  closeInst.layoutPositioning = "AUTO";
                  closeInst.resize(16, 16);
                  bindVar(closeInst, "width", varMap["tabs/icon-size"]);
                  bindVar(closeInst, "height", varMap["tabs/icon-size"]);
                  var closeVectors = closeInst.findAll(function(n) { return n.type === "VECTOR"; });
                  for (var cvi = 0; cvi < closeVectors.length; cvi++) {
                    bindVar(closeVectors[cvi], "strokeWeight", varMap["tabs/icon-stroke-width"]);
                    if (closeVectors[cvi].strokes && closeVectors[cvi].strokes.length > 0) {
                      closeVectors[cvi].strokes = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
                      bindPaintVar(closeVectors[cvi], "strokes", 0, varMap[tabTextPath]);
                    }
                    if (closeVectors[cvi].fills && closeVectors[cvi].fills.length > 0) {
                      closeVectors[cvi].fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
                      bindPaintVar(closeVectors[cvi], "fills", 0, varMap[tabTextPath]);
                    }
                  }
                  tabContent.appendChild(closeInst);
                }
              }

              if (showLeftIcon || showRightIcon) {
                bindVar(tabContent, "itemSpacing", varMap["tabs/icon-gap"]);
              }

              if (variant === "default" && visualState === "active") {
                var indicator = figma.createRectangle();
                indicator.name = "ActiveIndicator";
                indicator.layoutPositioning = "AUTO";
                indicator.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
                indicator.strokes = [];
                bindPaintVar(indicator, "fills", 0, varMap[tabBorderPath]);
                indicator.resize(1, 1);
                indicator.layoutAlign = "STRETCH";
                if (orientation === "horizontal") {
                  bindVar(indicator, "height", tabBorderWidthActiveVar);
                } else {
                  bindVar(indicator, "width", tabBorderWidthActiveVar);
                }
                comp.appendChild(indicator);
              }

              if (state === "focus") {
                var focusRing = figma.createRectangle();
                focusRing.name = "FocusRing";
                focusRing.fills = [];
                focusRing.strokes = [{ type: "SOLID", color: { r: 0.2, g: 0.53, b: 0.9 } }];
                focusRing.strokeAlign = "INSIDE";
                focusRing.strokeWeight = 2;
                bindPaintVar(focusRing, "strokes", 0, varMap["tabs/focus-ring"]);
                bindVar(focusRing, "strokeWeight", tabBorderWidthActiveVar);

                if (variant !== "default") {
                  bindVar(focusRing, "topLeftRadius", radiusVar);
                  bindVar(focusRing, "topRightRadius", radiusVar);
                  bindVar(focusRing, "bottomLeftRadius", radiusVar);
                  bindVar(focusRing, "bottomRightRadius", radiusVar);
                }

                comp.appendChild(focusRing);
                focusRing.layoutPositioning = "ABSOLUTE";
                focusRing.x = 0;
                focusRing.y = 0;
                try {
                  focusRing.resize(comp.width, comp.height);
                } catch (_tabsItemFocusResizeErr) {}
                focusRing.constraints = { horizontal: "STRETCH", vertical: "STRETCH" };
              }

              page.appendChild(comp);
              var colIndex = (((vi * orientations.length + oi) * leftIconModes.length + li) * rightIconModes.length) + rmi;
              var rowIndex = ri * states.length + si;
              var renderedWidth = Math.ceil(nodeRenderedWidth(comp));
              var renderedHeight = Math.ceil(nodeRenderedHeight(comp));
              colWidths[colIndex] = Math.max(colWidths[colIndex] || 0, renderedWidth);
              rowHeights[rowIndex] = Math.max(rowHeights[rowIndex] || 0, renderedHeight);
              placements.push({ comp: comp, colIndex: colIndex, rowIndex: rowIndex });
              components.push(comp);
            }
          }
        }
      }
    }
  }

  var colOffsets = [];
  var rowOffsets = [];
  var xCursor = 0;
  for (var c = 0; c < colWidths.length; c++) {
    colOffsets[c] = xCursor;
    xCursor += (colWidths[c] || 0) + gap;
  }
  var yCursor = 0;
  for (var r = 0; r < rowHeights.length; r++) {
    rowOffsets[r] = yCursor;
    yCursor += (rowHeights[r] || 0) + gap;
  }
  for (var pi = 0; pi < placements.length; pi++) {
    var placement = placements[pi];
    placement.comp.x = colOffsets[placement.colIndex] || 0;
    placement.comp.y = rowOffsets[placement.rowIndex] || 0;
  }

  progress("Created " + components.length + " tabs item variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Tabs Item";
  return componentSet;
}

function tabsTabColorPath(variant, property, state) {
  var base = "tabs/" + variant + "-tab-" + property;
  if (state === "default") return base;
  return base + "-" + state;
}

function tabsVisualVariant(variant) {
  if (variant === "outlined") return "outlined";
  if (variant === "pills") return "pills";
  return variant;
}

function createTabsOverflowControl(options) {
  var kind = (options && options.kind) || "left-arrow";
  var side = kind === "left-arrow" ? "left" : "right";
  var variant = (options && options.variant) || "default";
  var state = (options && options.state) || "default";
  var iconComponents = (options && options.iconComponents) || {};
  var varMap = (options && options.varMap) || {};

  var control = figma.createFrame();
  control.name = kind === "menu"
    ? "MenuControl"
    : (side === "left" ? "LeftArrowControl" : "RightArrowControl");
  control.layoutMode = "HORIZONTAL";
  control.primaryAxisSizingMode = "AUTO";
  control.counterAxisSizingMode = "AUTO";
  control.primaryAxisAlignItems = "CENTER";
  control.counterAxisAlignItems = "CENTER";
  control.paddingLeft = variant === "outlined" ? 16 : 4;
  control.paddingRight = variant === "outlined" ? 16 : 4;
  control.paddingTop = variant === "outlined" ? 16 : 11;
  control.paddingBottom = variant === "outlined" ? 16 : 11;
  control.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  control.strokes = [{ type: "SOLID", color: { r: 0.78, g: 0.78, b: 0.78 } }];
  control.strokeAlign = "INSIDE";
  control.clipsContent = false;
  try { control.layoutSizingHorizontal = "HUG"; } catch (_tabsArrowControlHugWidthErr) {}
  try { control.layoutSizingVertical = "HUG"; } catch (_tabsArrowControlHugHeightErr) {}

  var textPath = tabsOverflowColorPath(variant, "text", state);
  var controlFillPath = tabsOverflowColorPath(variant, "background", state);
  var controlBorderPath = tabsOverflowColorPath(variant, "border", state);
  bindPaintVar(control, "fills", 0, varMap[controlFillPath]);
  bindPaintVar(control, "strokes", 0, varMap[controlBorderPath]);
  if (variant === "default") {
    control.strokeTopWeight = 0;
    control.strokeLeftWeight = 0;
    control.strokeBottomWeight = 0;
    control.strokeRightWeight = 0;
    bindVar(control, "strokeBottomWeight", varMap["tabs/list-border-width"]);
  } else {
    bindVar(control, "paddingLeft", varMap["tabs/outlined-overflow-control-padding-x"]);
    bindVar(control, "paddingRight", varMap["tabs/outlined-overflow-control-padding-x"]);
    bindVar(control, "paddingTop", varMap["tabs/outlined-overflow-control-padding-y"]);
    bindVar(control, "paddingBottom", varMap["tabs/outlined-overflow-control-padding-y"]);
    control.strokeTopWeight = 1;
    control.strokeBottomWeight = 1;
    control.strokeLeftWeight = 1;
    control.strokeRightWeight = 1;
    bindVar(control, "strokeTopWeight", varMap["tabs/tab-border-width"]);
    bindVar(control, "strokeBottomWeight", varMap["tabs/tab-border-width"]);
    bindVar(control, "strokeLeftWeight", varMap["tabs/tab-border-width"]);
    bindVar(control, "strokeRightWeight", varMap["tabs/tab-border-width"]);
    if (kind === "left-arrow") {
      // LeftArrowControl keeps full border in outlined overflow.
    } else if (kind === "right-arrow") {
      // RightArrowControl has no right border in outlined overflow.
      control.strokeRightWeight = 0;
    } else if (kind === "menu") {
      // Menu keeps the full border from strokeWeight.
    }
  }

  var iconSource = null;
  if (kind === "menu") {
    iconSource = iconComponents.menu || iconComponents.settings || iconComponents.close || null;
  } else if (side === "left") {
    iconSource = iconComponents.chevronLeft || iconComponents.message || iconComponents.settings || null;
  } else {
    iconSource = iconComponents.chevronRight || iconComponents.close || iconComponents.settings || null;
  }
  if (iconSource) {
    var arrowInst = iconSource.createInstance();
    arrowInst.name = kind === "menu"
      ? "MenuIcon"
      : (side === "left" ? "LeftArrowIcon" : "RightArrowIcon");
    arrowInst.layoutPositioning = "AUTO";
    try { arrowInst.resize(16, 16); } catch (_tabsArrowResizeErr) {}
    bindVar(arrowInst, "width", varMap["tabs/icon-size"]);
    bindVar(arrowInst, "height", varMap["tabs/icon-size"]);
    var arrowVectors = arrowInst.findAll(function (n) { return n.type === "VECTOR"; });
    for (var avi = 0; avi < arrowVectors.length; avi++) {
      bindVar(arrowVectors[avi], "strokeWeight", varMap["tabs/icon-stroke-width"]);
      if (arrowVectors[avi].strokes && arrowVectors[avi].strokes.length > 0) {
        arrowVectors[avi].strokes = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
        bindPaintVar(arrowVectors[avi], "strokes", 0, varMap[textPath]);
      }
      if (arrowVectors[avi].fills && arrowVectors[avi].fills.length > 0) {
        arrowVectors[avi].fills = [{ type: "SOLID", color: { r: 0.13, g: 0.13, b: 0.13 } }];
        bindPaintVar(arrowVectors[avi], "fills", 0, varMap[textPath]);
      }
    }
    control.appendChild(arrowInst);
  }

  return control;
}

function createTabsFadeCap(options) {
  var side = options && options.side === "left" ? "left" : "right";
  var variant = (options && options.variant) || "outlined";
  var state = (options && options.state) || "default";
  var varMap = (options && options.varMap) || {};
  var height = Math.max(1, Number((options && options.height) || 52));
  var backgroundPath = tabsOverflowColorPath(variant, "background", state);
  var baseRgb = state === "disabled"
    ? { r: 166 / 255, g: 171 / 255, b: 183 / 255 } // #A6ABB7 per approved disabled fade spec
    : resolveVariableSolidRgb(
        varMap[backgroundPath],
        { r: 0.141, g: 0.149, b: 0.235 },
        { preferLightest: false }
      );

  var cap = figma.createRectangle();
  cap.name = side === "left" ? "LeftFadeCap" : "RightFadeCap";
  cap.resize(32, height);
  cap.fills = [{
    type: "GRADIENT_LINEAR",
    gradientTransform: side === "left"
      ? [[1, 0, 0], [0, 1, 0]]
      : [[-1, 0, 1], [0, 1, 0]],
    gradientStops: [
      { position: 0, color: { r: baseRgb.r, g: baseRgb.g, b: baseRgb.b, a: 1 } },
      { position: 0.890625, color: { r: baseRgb.r, g: baseRgb.g, b: baseRgb.b, a: 0.6 } },
      { position: 1, color: { r: baseRgb.r, g: baseRgb.g, b: baseRgb.b, a: 0 } },
    ],
  }];
  cap.strokes = [{ type: "SOLID", color: { r: 0.224, g: 0.235, b: 0.337 } }];
  cap.strokeAlign = "INSIDE";
  cap.strokeTopWeight = 1;
  cap.strokeBottomWeight = 1;
  cap.strokeLeftWeight = 0;
  cap.strokeRightWeight = 0;
  bindPaintVar(cap, "strokes", 0, varMap[tabsOverflowColorPath(variant, "border", state)]);
  bindVar(cap, "strokeTopWeight", varMap["tabs/tab-border-width"]);
  bindVar(cap, "strokeBottomWeight", varMap["tabs/tab-border-width"]);
  return cap;
}

function tabsOverflowColorPath(variant, slot, state) {
  var normalizedVariant = variant || "default";
  var normalizedState = state || "default";
  if (slot === "background") {
    if (normalizedVariant === "default") return "tabs/default-list-background";
    if (normalizedState === "disabled") return "tabs/" + normalizedVariant + "-tab-background-disabled";
    return "tabs/" + normalizedVariant + "-tab-background";
  }
  if (slot === "border") {
    if (normalizedVariant === "default") {
      if (normalizedState === "disabled") return "tabs/default-tab-border-disabled";
      return "tabs/default-list-border";
    }
    if (normalizedState === "disabled") return "tabs/" + normalizedVariant + "-tab-border-disabled";
    return "tabs/" + normalizedVariant + "-tab-border";
  }
  if (slot === "text") {
    if (normalizedState === "disabled") return "tabs/" + normalizedVariant + "-tab-text-disabled";
    return "tabs/" + normalizedVariant + "-tab-text";
  }
  return "tabs/" + normalizedVariant + "-tab-" + slot;
}

function resolveVariableSolidRgb(variable, fallbackRgb, options) {
  var fallback = fallbackRgb || { r: 0, g: 0, b: 0 };
  var preferLightest = Boolean(options && options.preferLightest);
  if (preferLightest && variable && variable.valuesByMode) {
    var lightest = null;
    var modeIdsAll = Object.keys(variable.valuesByMode);
    var rootCollection = null;
    try { rootCollection = figma.variables.getVariableCollectionById(variable.variableCollectionId); } catch (_rootCollectionErr) {}
    for (var mi = 0; mi < modeIdsAll.length; mi++) {
      var modeNameHint = null;
      if (rootCollection && rootCollection.modes) {
        for (var rmi = 0; rmi < rootCollection.modes.length; rmi++) {
          if (rootCollection.modes[rmi].modeId === modeIdsAll[mi]) {
            modeNameHint = rootCollection.modes[rmi].name;
            break;
          }
        }
      }
      var rgbCandidate = resolveVariableSolidRgbForMode(variable, modeIdsAll[mi], 0, modeNameHint);
      if (!rgbCandidate) continue;
      var lum = rgbCandidate.r * 0.2126 + rgbCandidate.g * 0.7152 + rgbCandidate.b * 0.0722;
      if (!lightest || lum > lightest.lum) lightest = { rgb: rgbCandidate, lum: lum };
    }
    if (lightest) return lightest.rgb;
  }
  var current = variable || null;
  for (var depth = 0; depth < 4; depth++) {
    if (!current || !current.valuesByMode) break;
    var modeIds = Object.keys(current.valuesByMode);
    if (!modeIds.length) break;
    var preferredModeId = modeIds[0];
    try {
      var collection = figma.variables.getVariableCollectionById(current.variableCollectionId);
      if (collection && collection.modes && collection.modes.length > 0) {
        for (var mi = 0; mi < collection.modes.length; mi++) {
          var modeName = String(collection.modes[mi].name || "").toLowerCase();
          if (modeName.indexOf("light") >= 0 && current.valuesByMode[collection.modes[mi].modeId] != null) {
            preferredModeId = collection.modes[mi].modeId;
            break;
          }
        }
      }
    } catch (_resolveModeErr) {}
    var value = current.valuesByMode[preferredModeId];
    if (!value) break;
    if (typeof value.r === "number" && typeof value.g === "number" && typeof value.b === "number") {
      return { r: value.r, g: value.g, b: value.b };
    }
    if (value.type === "VARIABLE_ALIAS" && value.id) {
      try {
        current = figma.variables.getVariableById(value.id);
        continue;
      } catch (_aliasResolveErr) {
        break;
      }
    }
    break;
  }
  return fallback;
}

function resolveVariableSolidRgbForMode(variable, modeId, depth) {
  if (!variable || !variable.valuesByMode || depth > 4) return null;
  var modeNameHint = arguments.length > 3 ? arguments[3] : null;
  var value = variable.valuesByMode[modeId];
  if (value == null && modeNameHint) {
    try {
      var collection = figma.variables.getVariableCollectionById(variable.variableCollectionId);
      if (collection && collection.modes) {
        for (var cmi = 0; cmi < collection.modes.length; cmi++) {
          var candidateName = String(collection.modes[cmi].name || "").toLowerCase();
          if (candidateName === String(modeNameHint || "").toLowerCase()) {
            value = variable.valuesByMode[collection.modes[cmi].modeId];
            if (value != null) break;
          }
        }
      }
    } catch (_modeNameResolveErr) {}
  }
  if (value == null) {
    var modeIds = Object.keys(variable.valuesByMode);
    if (!modeIds.length) return null;
    value = variable.valuesByMode[modeIds[0]];
  }
  if (!value) return null;
  if (typeof value.r === "number" && typeof value.g === "number" && typeof value.b === "number") {
    return { r: value.r, g: value.g, b: value.b };
  }
  if (value.type === "VARIABLE_ALIAS" && value.id) {
    try {
      var aliased = figma.variables.getVariableById(value.id);
      if (!aliased) return null;
      return resolveVariableSolidRgbForMode(aliased, modeId, depth + 1, modeNameHint);
    } catch (_aliasResolveErr) {
      return null;
    }
  }
  return null;
}

async function findTabsIconComponents() {
  var result = { image: null, message: null, settings: null, close: null, chevronLeft: null, chevronRight: null, menu: null };
  var iconCandidates = [];
  var iconsPage = null;
  var arrowLeftFallback = null;
  var arrowRightFallback = null;
  if (!findTabsIconComponents._allPagesLoaded) {
    try {
      if (typeof figma.loadAllPagesAsync === "function") {
        await figma.loadAllPagesAsync();
      }
      findTabsIconComponents._allPagesLoaded = true;
    } catch (loadAllPagesErr) {
      progress("[Tabs] Could not preload all pages: " + String(loadAllPagesErr));
    }
  }

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
    var compactName = name.replace(/[^a-z0-9]/g, "");
    var hasCircleWord = compactName.indexOf("circle") >= 0;
    if (!result.image && (name.indexOf("image") >= 0 || name.indexOf("gallery") >= 0 || name.indexOf("photo") >= 0)) {
      result.image = iconCandidates[j];
    }
    if (!result.message && (name.indexOf("message") >= 0 || name.indexOf("chat") >= 0)) {
      result.message = iconCandidates[j];
    }
    if (!result.settings && (name.indexOf("settings") >= 0 || name.indexOf("cog") >= 0 || name.indexOf("gear") >= 0)) {
      result.settings = iconCandidates[j];
    }
    if (!result.close && (name.indexOf("close") >= 0 || name.indexOf("x") >= 0 || name.indexOf("cancel") >= 0)) {
      result.close = iconCandidates[j];
    }
    if (!result.chevronLeft && compactName.indexOf("chevronleft") >= 0) {
      result.chevronLeft = iconCandidates[j];
    }
    if (!result.chevronRight && compactName.indexOf("chevronright") >= 0) {
      result.chevronRight = iconCandidates[j];
    }
    if (!arrowLeftFallback && compactName.indexOf("arrowleft") >= 0 && !hasCircleWord) {
      arrowLeftFallback = iconCandidates[j];
    }
    if (!arrowRightFallback && compactName.indexOf("arrowright") >= 0 && !hasCircleWord) {
      arrowRightFallback = iconCandidates[j];
    }
    if (!result.menu && (name.indexOf("menu") >= 0 || name.indexOf("hamburger") >= 0 || name.indexOf("menu03") >= 0 || name.indexOf("more") >= 0)) {
      result.menu = iconCandidates[j];
    }
  }

  // Fallback: if naming does not match expected keywords, use first 3 components so LeftIcon=On always renders.
  if ((!result.image || !result.message || !result.settings || !result.close) && iconCandidates.length >= 3) {
    var sorted = iconCandidates.slice().sort(function(a, b) {
      return a.name.localeCompare(b.name);
    });
    if (!result.image) result.image = sorted[0];
    if (!result.message) result.message = sorted[1];
    if (!result.settings) result.settings = sorted[2];
    if (!result.close) result.close = sorted[3] || sorted[2];
  }
  if (!result.chevronLeft) result.chevronLeft = arrowLeftFallback || result.image || result.message || result.settings || null;
  if (!result.chevronRight) result.chevronRight = arrowRightFallback || result.close || result.settings || result.message || null;
  if (!result.menu) result.menu = result.settings || result.close || result.message || null;

  if (result.image) progress("[Tabs] LeftIcon image source: " + result.image.name);
  if (result.message) progress("[Tabs] LeftIcon message source: " + result.message.name);
  if (result.settings) progress("[Tabs] LeftIcon settings source: " + result.settings.name);
  if (result.close) progress("[Tabs] RightIcon close source: " + result.close.name);
  if (result.chevronLeft) progress("[Tabs] LeftArrow source: " + result.chevronLeft.name);
  if (result.chevronRight) progress("[Tabs] RightArrow source: " + result.chevronRight.name);
  if (result.menu) progress("[Tabs] Menu source: " + result.menu.name);

  return result;
}

function validateTabsVariables(varMap) {
  var variants = ["default", "outlined", "pills"];
  var radii = ["default", "xs", "sm", "md", "lg", "xl"];
  var states = ["default", "hover", "active", "disabled"];
  var required = [
    "tabs/font-size",
    "tabs/list-border-width",
    "tabs/tab-border-width",
    "tabs/tab-border-width-active",
    "tabs/icon-size",
    "tabs/icon-stroke-width",
    "tabs/icon-gap",
    "tabs/focus-ring",
    "tabs/outlined-overflow-control-padding-x",
    "tabs/outlined-overflow-control-padding-y"
  ];

  for (var vi = 0; vi < variants.length; vi++) {
    var variant = variants[vi];
    for (var ri = 0; ri < radii.length; ri++) {
      required.push("tabs/" + variant + "-radius-" + radii[ri]);
    }
    required.push("tabs/" + variant + "-list-background");
    required.push("tabs/" + variant + "-list-padding");
    required.push("tabs/" + variant + "-list-gap");
    required.push("tabs/" + variant + "-tab-padding-x");
    required.push("tabs/" + variant + "-tab-padding-y");
    required.push("tabs/" + variant + "-list-border");
    for (var si = 0; si < states.length; si++) {
      var state = states[si];
      var suffix = state === "default" ? "" : "-" + state;
      if (variant !== "default") {
        required.push("tabs/" + variant + "-tab-background" + suffix);
      }
      if (variant === "default" && state === "active") {
        required.push("tabs/default-tab-background-active");
        required.push("tabs/default-tab-border-active");
      }
      if (variant === "default" && state === "hover") {
        required.push("tabs/default-tab-border-hover");
      }
      required.push("tabs/" + variant + "-tab-text" + suffix);
      if (variant !== "default") {
        required.push("tabs/" + variant + "-tab-border" + suffix);
      }
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
