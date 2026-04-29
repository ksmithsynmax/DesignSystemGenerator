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

  totalCreated += compCreated;
  totalAliases += compAliases;
  progress("Components: " + compCreated + " created, " + compAliases + " aliases");

  try {
    syncGradientPaintStyles(payload, syncBrands);
  } catch (gradStyleErr) {
    progress("Gradient paint styles skipped: " + String(gradStyleErr));
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

function normalizeComponentKey(name) {
  return String(name || "").toLowerCase().replace(/[^a-z]/g, "");
}

function resolveManagedComponentKeyFromName(name) {
  var normalized = normalizeComponentKey(name);
  if (!normalized) return null;
  var managedKeys = [
    "button", "switch", "slider", "rangeslider", "checkbox", "radio",
    "chip", "notification", "alert", "modal", "tooltip", "loader",
    "pill", "badge", "textinput", "select", "card", "actionicon",
    "tabs", "anchor", "title", "text"
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

async function buildComponents(varMap, componentsToBuild, buildOptions, collectionsCtx) {
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
      normalizedRequested[normalizedKey] = true;
      hasSelection = true;
    }
    if (!buildAllSentinel && hasSelection) {
      requestedSet = normalizedRequested;
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
  var notificationSet = await buildSet("Notification", function () {
    return buildNotificationComponentSet(varMap, page, font, loaderSet, resolvedComponentFloat);
  });
  var alertSet = await buildSet("Alert", function () {
    return buildAlertComponentSet(varMap, page, font);
  });
  var tooltipSet = await buildSet("Tooltip", function () {
    return buildTooltipComponentSet(varMap, page, font);
  });
  var pillSet = await buildSet("Pill", function () {
    return buildPillComponentSet(varMap, page, font);
  });
  var badgeSet = await buildSet("Badge", function () {
    return buildBadgeComponentSet(varMap, page, font);
  });
  var textInputSet = await buildSet("TextInput", function () {
    return buildTextInputComponentSet(
      varMap,
      page,
      font,
      Boolean(buildOptions && buildOptions.textInputDebugDefaultOnly)
    );
  });
  var selectSet = await buildSet("Select", function () {
    return buildSelectComponentSet(varMap, page, font, {
      defaultOnly: Boolean(buildOptions && buildOptions.selectDebugDefaultOnly)
    });
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
  var anchorSet = await buildSet("Anchor", function () {
    return buildAnchorComponentSet(varMap, page, font);
  });
  var titleSet = await buildSet("Title", function () {
    return buildTitleComponentSet(varMap, page, font, titleSampleText);
  });
  var textSet = await buildSet("Text", function () {
    return buildTextComponentSet(varMap, page, font, textSampleText);
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
    loaderSet,
    notificationSet,
    alertSet,
    modalSet,
    tooltipSet,
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
    docsSourceSets = collectManagedComponentSetsFromPage(page, requestedSet);
    progress("Docs fallback set scan found " + docsSourceSets.length + " component sets.");
  }

  try {
    await buildUsageDocsPage(docsSourceSets, font);
  } catch (docsErr) {
    buildFailures.push("Usage docs: " + String(docsErr));
    progress("Failed to build usage docs: " + String(docsErr));
  }

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
  return { failures: buildFailures };
}

function collectManagedComponentSetsFromPage(page, requestedSet) {
  if (!page || !page.children) return [];
  var sets = [];
  for (var i = 0; i < page.children.length; i++) {
    var node = page.children[i];
    if (!node || node.type !== "COMPONENT_SET") continue;
    var key = resolveManagedComponentKeyFromName(node.name);
    if (!key) continue;
    if (requestedSet && !requestedSet[key]) continue;
    sets.push(node);
  }
  return sets;
}

async function buildUsageDocsPage(componentSets, titleFont) {
  if (!componentSets || componentSets.length === 0) {
    progress("Usage docs skipped: no component sets available.");
    return;
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
        if (label != null && String(label).trim().length > 0) {
          appendText(cell, bodyFont, String(label), 10, DOC_COLORS.cellLabel, "Cell Label");
        }
        var inst = null;
        try {
          inst = createInstanceForLabel(label);
        } catch (instErr) {
          progress("Docs instance creation failed (" + String(label) + "): " + String(instErr));
        }
        if (inst) cell.appendChild(inst);
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

  function getVariantDescription(componentName, variantName) {
    var comp = String(componentName || "").toLowerCase();
    var variant = String(variantName || "").toLowerCase();
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
    var stackSizeRows = lowerSetName === "title" || lowerSetName === "text";
    var variantProps = set.variantGroupProperties || {};
    var variants = getPropValues(variantProps, "Variant");
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

    var useTemplateForSet = Boolean(docsTemplate) && lowerSetName !== "text";
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

      var templateVariantKey = getPropKey(variantProps, "Variant");
      var templateStateKey = getPropKey(variantProps, "State");
      var templateSizeKey = getPropKey(variantProps, "Size");
      var templateRadiusKey = getPropKey(variantProps, "Radius");
      var templateSectionKey = getPropKey(variantProps, "Section");
      var templateCheckedKey = getPropKey(variantProps, "Checked");
      var templateLeftIconKey = getPropKey(variantProps, "LeftIcon");
      var templateRightIconKey = getPropKey(variantProps, "RightIcon");

      var templateVariantOrder = ["Filled", "Outlined", "Outline", "Ghost", "Default", "Light", "Transparent", "Pills"];
      var templateVariantLimit = lowerSetName === "badge" ? 4 : (lowerSetName === "card" ? 5 : 3);
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
      if (templateOrderedSizes.length > 1) {
        templateOrderedSizes = templateOrderedSizes.filter(function (s) { return String(s).toLowerCase() !== "default"; });
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
      if (templateColorValues.length > 0) {
        for (var tci = 0; tci < templateColorValues.length; tci++) {
          if (String(templateColorValues[tci]).toLowerCase() === "default") {
            templateDefaultColor = templateColorValues[tci];
            break;
          }
        }
        if (templateDefaultColor == null) templateDefaultColor = templateColorValues[0];
      }

      var templateBadgeSemanticColors = (lowerSetName === "badge" && templateColorKey && templateColorValues.length > 0)
        ? pickOrdered(templateColorValues, ["Default", "Success", "Warning", "Error"])
        : [];

      var templateLeftValues = templateLeftIconKey ? getPropValues(variantProps, templateLeftIconKey) : [];
      var templateRightValues = templateRightIconKey ? getPropValues(variantProps, templateRightIconKey) : [];
      var templateSectionValues = templateSectionKey ? getPropValues(variantProps, templateSectionKey) : [];
      var templateCheckedValues = templateCheckedKey ? getPropValues(variantProps, templateCheckedKey) : [];
      var templateLeftOn = templateLeftValues.indexOf("On") >= 0 ? "On" : (templateLeftValues.indexOf("True") >= 0 ? "True" : (templateLeftValues[0] || null));
      var templateLeftOff = templateLeftValues.indexOf("Off") >= 0 ? "Off" : (templateLeftValues.indexOf("False") >= 0 ? "False" : (templateLeftValues[0] || null));
      var templateRightOn = templateRightValues.indexOf("On") >= 0 ? "On" : (templateRightValues.indexOf("True") >= 0 ? "True" : (templateRightValues[0] || null));
      var templateRightOff = templateRightValues.indexOf("Off") >= 0 ? "Off" : (templateRightValues.indexOf("False") >= 0 ? "False" : (templateRightValues[0] || null));
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

        if (hasVariants && templateVariantsSlot && templateOrderedVariants.length > 0) {
          clearChildren(templateVariantsSlot);
          if (templateVariantsSlot.layoutMode === "VERTICAL") {
            templateVariantsSlot.itemSpacing = 16;
          }
          var templateVariantStateValues = templateOrderedStates.length > 0 ? templateOrderedStates : [null];
          for (var tv = 0; tv < templateOrderedVariants.length; tv++) {
            var templateVariantName = templateOrderedVariants[tv];
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
                    return makeTemplateInstance({ Variant: vName, Color: colorName });
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
              addInstancesRow(
                templateVariantStatesPanel,
                "States",
                templateVariantStateValues,
                (function (vName) {
                  return function (stateName) {
                    var patch = { Variant: vName };
                    if (stateName != null) patch.State = stateName;
                    if ((lowerSetName === "checkbox" || lowerSetName === "radio") && templateCheckedOnValue != null) {
                      patch.Checked = templateCheckedOnValue;
                    }
                    return makeTemplateInstance(patch);
                  };
                })(templateVariantName),
                false,
                lowerSetName === "tabs" ? { rowItemSpacing: 20 } : null
              );
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
            for (var tsi = 0; tsi < templateOrderedSizes.length; tsi++) {
              (function (sizeName) {
                addInstancesRow(templateSizeSlot, "Sizes", [sizeName], function (innerSizeName) {
                  return makeTemplateInstance({ Size: innerSizeName });
                }, false);
              })(templateOrderedSizes[tsi]);
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
          } else {
            addInstancesRow(templateSizeSlot, "Sizes", templateOrderedSizes, function (sizeName) {
              return makeTemplateInstance({ Size: sizeName });
            }, false);
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
          } else {
            addInstancesRow(templateStatesSlot, "States", templateOrderedStates, function (stateName) {
              return makeTemplateInstance({ State: stateName });
            }, false, lowerSetName === "tabs" ? { rowItemSpacing: 20 } : null);
          }
        } else if (!hasStates) {
          removeSectionOrSlot(templatedDoc, slug, "states");
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

        // Notification has no Variant/Size/State axes in the template flow; fill Color + Radius explicitly.
        if (lowerSetName === "notification" && templateBaseComponent) {
          var notifTplColorKey = getPropKey(variantProps, "Color");
          var notifTplColorVals = notifTplColorKey ? getPropValues(variantProps, "Color") : [];
          var notifTplRadiusKey = getPropKey(variantProps, "Radius");
          var notifTplRadiusVals = notifTplRadiusKey ? getPropValues(variantProps, "Radius") : [];
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

    var leftSlot = null;
    var rightSlot = null;
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

      var variantKey = getPropKey(variantProps, "Variant");
      var stateKey = getPropKey(variantProps, "State");
      var sizeKey = getPropKey(variantProps, "Size");
      var radiusKey = getPropKey(variantProps, "Radius");
      var sectionKey = getPropKey(variantProps, "Section");
      var checkedKey = getPropKey(variantProps, "Checked");
      var leftIconKey = getPropKey(variantProps, "LeftIcon");
      var rightIconKey = getPropKey(variantProps, "RightIcon");
      var colorKey = getPropKey(variantProps, "Color");

      var variantOrder = ["Filled", "Outlined", "Outline", "Ghost", "Default", "Light", "Transparent", "Pills"];
      var variantLimit = lowerSetName === "badge" ? 4 : (lowerSetName === "card" ? 5 : 3);
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
      if (orderedSizes.length > 1) {
        orderedSizes = orderedSizes.filter(function (s) { return String(s).toLowerCase() !== "default"; });
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
      if (colorValuesAll.length > 0) {
        for (var cci = 0; cci < colorValuesAll.length; cci++) {
          if (String(colorValuesAll[cci]).toLowerCase() === "default") {
            defaultColor = colorValuesAll[cci];
            break;
          }
        }
        if (defaultColor == null) defaultColor = colorValuesAll[0];
      }

      var badgeDocSemanticColors = (lowerSetName === "badge" && colorKey && colorValuesAll.length > 0)
        ? pickOrdered(colorValuesAll, ["Default", "Success", "Warning", "Error"])
        : [];

      var leftValues = leftIconKey ? getPropValues(variantProps, leftIconKey) : [];
      var rightValues = rightIconKey ? getPropValues(variantProps, rightIconKey) : [];
      var sectionValues = sectionKey ? getPropValues(variantProps, sectionKey) : [];
      var checkedValues = checkedKey ? getPropValues(variantProps, checkedKey) : [];
      var leftOn = leftValues.indexOf("On") >= 0 ? "On" : (leftValues.indexOf("True") >= 0 ? "True" : (leftValues[0] || null));
      var leftOff = leftValues.indexOf("Off") >= 0 ? "Off" : (leftValues.indexOf("False") >= 0 ? "False" : (leftValues[0] || null));
      var rightOn = rightValues.indexOf("On") >= 0 ? "On" : (rightValues.indexOf("True") >= 0 ? "True" : (rightValues[0] || null));
      var rightOff = rightValues.indexOf("Off") >= 0 ? "Off" : (rightValues.indexOf("False") >= 0 ? "False" : (rightValues[0] || null));
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

      if (variantsSlot && orderedVariants.length > 0) {
        clearChildren(variantsSlot);
        var variantStateValues = orderedStates.length > 0 ? orderedStates : [null];
        for (var v = 0; v < orderedVariants.length; v++) {
          var variantName = orderedVariants[v];
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
                  return makeInstance({ Variant: vName, Color: colorName });
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
            addInstancesRow(
              variantStatesPanel,
              "States",
              variantStateValues,
              (function (vName) {
                return function (stateName) {
                  var patch = { Variant: vName };
                  if (stateName != null) patch.State = stateName;
                  if ((lowerSetName === "checkbox" || lowerSetName === "radio") && checkedOnValue != null) {
                    patch.Checked = checkedOnValue;
                  }
                  return makeInstance(patch);
                };
              })(variantName),
              false,
              lowerSetName === "tabs" ? { rowItemSpacing: 20 } : null
            );
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
          for (var osi = 0; osi < orderedSizes.length; osi++) {
            (function (sizeName) {
              addInstancesRow(sizeSlot, "Sizes", [sizeName], function (innerSizeName) {
                return makeInstance({ Size: innerSizeName });
              }, false);
            })(orderedSizes[osi]);
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
        } else {
          addInstancesRow(sizeSlot, "Sizes", orderedSizes, function (sizeName) {
            return makeInstance({ Size: sizeName });
          }, false);
        }
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
        } else {
          addInstancesRow(statesSlot, "States", orderedStates, function (stateName) {
              return makeInstance({ State: stateName });
          }, false, lowerSetName === "tabs" ? { rowItemSpacing: 20 } : null);
        }
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

      if (lowerSetName === "tooltip" && baseComponent) {
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
      if (child.type === "COMPONENT_SET") {
        var componentKey = resolveManagedComponentKeyFromName(child.name);
        if (componentKey && (!requestedSet || requestedSet[componentKey])) {
          child.remove();
        }
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
// Button
// ---------------------------------------------------------------------------

async function buildButtonComponentSet(varMap, page, font, focusRingStyle, selectedVariants) {
  var variants = (selectedVariants && selectedVariants.length > 0)
    ? selectedVariants.slice()
    : ["filled", "outlined", "ghost"];
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

            var comp = figma.createComponent();
            comp.name =
              "Variant=" + capVariant +
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
              comp.paddingLeft = 3;
              comp.paddingRight = 3;
              comp.paddingTop = 3;
              comp.paddingBottom = 3;
              comp.fills = [];
              comp.strokes = [{ type: "SOLID", color: { r: 0.17, g: 0.63, b: 0.98 } }];
              comp.strokeAlign = "OUTSIDE";
              comp.strokeWeight = 2;
              comp.cornerRadius = 11;
              bindPaintVar(comp, "strokes", 0, varMap["button/focus-ring"]);
              bindVar(comp, "strokeWeight", varMap["button/focus-ring-width"]);
              bindVar(comp, "paddingLeft", varMap["button/focus-ring-spacing"]);
              bindVar(comp, "paddingRight", varMap["button/focus-ring-spacing"]);
              bindVar(comp, "paddingTop", varMap["button/focus-ring-spacing"]);
              bindVar(comp, "paddingBottom", varMap["button/focus-ring-spacing"]);
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
            var bgPath = btnColorPath(variant, "background", colorState);
            var textPath = btnColorPath(variant, "text", colorState);
            var borderPath = btnColorPath(variant, "border", colorState);

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
              attachedHalo.strokes = [{ type: "SOLID", color: { r: 0.2, g: 0.53, b: 0.9 }, opacity: 0.4 }];
              attachedHalo.strokeAlign = "OUTSIDE";
              attachedHalo.strokeWeight = 3;
              attachedHalo.cornerRadius = 8;
              try {
                attachedHalo.resize(buttonNode.width, buttonNode.height);
              } catch (resizeErr) {}
              bindPaintVar(attachedHalo, "strokes", 0, varMap["button/focus-ring"]);
              bindVar(attachedHalo, "strokeWeight", varMap["button/focus-ring-width"]);
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
            var colIndex = ((vi * leftIconModes.length + li) * rightIconModes.length) + ri;
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

  progress("Created " + components.length + " button variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Button";
  return componentSet;
}

// Build the figmaPath for a button color token given variant, property, and state
function btnColorPath(variant, property, state) {
  var resolvedVariant = variant === "ghost" ? "transparent" : variant;
  if (state === "default") {
    return "button/" + resolvedVariant + "-" + property;
  }
  return "button/" + resolvedVariant + "-" + property + "-" + state;
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
// Slider
// ---------------------------------------------------------------------------

function buildSliderComponentSet(varMap, page, font) {
  var sizes = ["xs", "sm", "md", "lg", "xl"];
  var radii = ["default", "xs", "sm", "md", "lg", "xl"];
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
              bindVar(labelNode, "fontFamily", varMap["slider/mark-label-font-family"]);
              bindVar(labelNode, "fontStyle", varMap["slider/mark-label-font-weight"]);
              bindVar(labelNode, "lineHeight", varMap["slider/mark-label-line-height-" + size]);
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
  var radii = ["default", "xs", "sm", "md", "lg", "xl"];
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
          bindPaintVar(track, "fills", 0, varMap[rangeSliderTrackBgPath(varMap, state)]);
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
              bindVar(labelNode, "fontFamily", varMap["rangeslider/mark-label-font-family"]);
              bindVar(labelNode, "fontStyle", varMap["rangeslider/mark-label-font-weight"]);
              bindVar(labelNode, "lineHeight", varMap["rangeslider/mark-label-line-height-" + size]);
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

          var textColorPath = chipTextColorPath(variant, isChecked, state);
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

function bindNotificationIconTokenVectors(iconInst, varMap) {
  bindNotificationGraphicNodesToIconToken(iconInst, varMap);
}

function bindNotificationGraphicNodesToIconToken(root, varMap) {
  if (!root || !varMap) return;
  bindNotificationGraphicNodesToPaintVar(root, varMap["notification/icon"]);
}

/** Binds vector/ellipse strokes + fills on a close icon instance to `notification/close` (tone-aware). */
function bindNotificationCloseIconGraphicNodes(root, varMap, colorTone) {
  if (!root || !varMap) return;
  var paintVar = notificationResolvedVar(varMap, "close", colorTone) || varMap["notification/icon"];
  if (paintVar) bindNotificationGraphicNodesToPaintVar(root, paintVar);
}

function bindNotificationGraphicNodesToPaintVar(root, paintVar) {
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
      var closePadRight = 8;
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
        closeInst.y = 12;
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
        closeNode.y = 12;
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

  var titleVariant = findVariantComponent(titleSet, { Order: "4", Size: "H4" });
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
              bindVar(titleNode, "fontFamily", varMap["modal/title-font-family"]);
              bindVar(titleNode, "fontStyle", varMap["modal/title-font-weight"]);
              bindVar(titleNode, "lineHeight", varMap["modal/title-line-height"]);
            }
            header.appendChild(titleNode);

            if (withClose) {
              if (modalCloseIconSource) {
                var closeIconInst = modalCloseIconSource.createInstance();
                closeIconInst.name = "close";
                try { closeIconInst.resize(16, 16); } catch (e) {}
                var modalCloseVectors = closeIconInst.findAll(function(n) { return n.type === "VECTOR"; });
                for (var mcvi = 0; mcvi < modalCloseVectors.length; mcvi++) {
                  bindVar(modalCloseVectors[mcvi], "strokeWeight", varMap["modal/close-icon-stroke-width"]);
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
              bindVar(bodyNode, "fontFamily", varMap["modal/body-font-family"]);
              bindVar(bodyNode, "fontStyle", varMap["modal/body-font-weight"]);
              bindVar(bodyNode, "lineHeight", varMap["modal/body-line-height"]);
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

async function buildTextInputComponentSet(varMap, page, font, debugDefaultOnly) {
  var variants = ["default", "filled"];
  var sizes = debugDefaultOnly ? ["default"] : ["default", "xs", "sm", "md", "lg", "xl"];
  var radii = debugDefaultOnly ? ["default"] : ["default", "xs", "sm", "md", "lg", "xl"];
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

        for (var ri = 0; ri < radii.length; ri++) {
          var rad = radii[ri];
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

async function buildSelectComponentSet(varMap, page, font, options) {
  var variants = ["default", "filled"];
  var defaultOnly = Boolean(options && options.defaultOnly);
  var sizes = defaultOnly ? ["default"] : ["default", "xs", "sm", "md", "lg", "xl"];
  var radii = defaultOnly ? ["default"] : ["default", "xs", "sm", "md", "lg", "xl"];
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
              var capDropdown = dropdownMode === "open" ? "Open" : "Closed";
              var activeOptionIndices = [-1];
              var hoverOptionIndices = [-1];
              if (dropdownMode === "open" && state === "default") {
                // Keep previous default look first: no active row + hover on option two.
                activeOptionIndices = [-1, 0, 1, 2];
                hoverOptionIndices = [1, -1, 0, 2];
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
            var selectFontFamilyVar =
              varMap["select/font-family-" + size] ||
              varMap["select/font-family-default"] ||
              varMap["select/font-family"];
            var selectFontWeightVar =
              varMap["select/font-weight-" + size] ||
              varMap["select/font-weight-default"] ||
              varMap["select/font-weight"];
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

            var selectIconPaintVar =
              state === "disabled" && varMap["select/icon-disabled"]
                ? varMap["select/icon-disabled"]
                : state === "error" && varMap["select/icon-error"]
                  ? varMap["select/icon-error"]
                  : varMap["select/icon"] || varMap["select/chevron-color"];

            if (chevronIconComp) {
              var chevronInstance = chevronIconComp.createInstance();
              chevronInstance.name = "Chevron";
              try {
                chevronInstance.resize(12, 12);
              } catch (e) {
                // Keep default icon size if resize is not allowed.
              }
              chevronSlot.appendChild(chevronInstance);
              if (selectIconPaintVar && typeof chevronInstance.findAll === "function") {
                var chevronVectors = chevronInstance.findAll(function (n) {
                  return n.type === "VECTOR";
                });
                for (var cvi = 0; cvi < chevronVectors.length; cvi++) {
                  try {
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
              chevronVector.fills = [];
              chevronVector.strokes = [{ type: "SOLID", color: { r: 0.45, g: 0.45, b: 0.45 } }];
              chevronVector.strokeWeight = 1.5;
              chevronVector.strokeJoin = "ROUND";
              chevronVector.strokeCap = "ROUND";
              if (selectIconPaintVar) bindPaintVar(chevronVector, "strokes", 0, selectIconPaintVar);
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

            if (dropdownMode === "open") {
              var dropdown = figma.createFrame();
              dropdown.name = "Dropdown";
              dropdown.layoutMode = "VERTICAL";
              dropdown.primaryAxisSizingMode = "AUTO";
              dropdown.counterAxisSizingMode = "FIXED";
              dropdown.counterAxisAlignItems = "MIN";
              dropdown.itemSpacing = 0;
              dropdown.paddingTop = 4;
              dropdown.paddingBottom = 4;
              dropdown.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
              dropdown.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.8, b: 0.8 } }];
              dropdown.strokeWeight = 1;
              dropdown.strokeAlign = "INSIDE";
              dropdown.cornerRadius = 4;
              dropdown.resize(200, 120);
              if (varMap["select/dropdown-background"]) bindPaintVar(dropdown, "fills", 0, varMap["select/dropdown-background"]);
              if (varMap["select/dropdown-border"]) bindPaintVar(dropdown, "strokes", 0, varMap["select/dropdown-border"]);
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
                option.resize(200, optionHeight);
                option.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 }, opacity: 0 }];

                var isSelectedOption = oi === activeOptionIndex;
                var isHoverOption = oi === hoverOptionIndex;
                var optionBgVar = null;
                if (isSelectedOption && varMap["select/option-selected-background"]) {
                  optionBgVar = varMap["select/option-selected-background"];
                } else if (isHoverOption && varMap["select/option-hover-background"]) {
                  optionBgVar = varMap["select/option-hover-background"];
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
                if (isHoverOption && varMap["select/option-hover-text"]) {
                  bindPaintVar(optionText, "fills", 0, varMap["select/option-hover-text"]);
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

            var colIndex = vi * labelModes.length + li;
            var comboCountForState = (dropdownMode === "open" && state === "default") ? (4 * 4) : 1;
            var rowIndexBase = (si * radii.length + ri) * ((states.length - 1) + (1 * 4 * 4));
            var stateOffset = (state === "default") ? 0 : (4 * 4) + (sti - 1);
            var comboIndex = aoi * hoverOptionIndices.length + hoi;
            var rowIndex = rowIndexBase + stateOffset + comboIndex;
            comp.x = colIndex * (colWidth + gap);
            comp.y = rowIndex * 190;
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

function buildCardComponentSet(varMap, page, font, options) {
  var useCompactMatrix = Boolean(options && options.compact);
  var variants = ["default", "dark", "outlined", "brand", "transparent"];
  var sizes = ["default", "xs", "sm", "md", "lg", "xl"];
  var radii = useCompactMatrix
    ? ["default"]
    : ["default", "xs", "sm", "md", "lg", "xl"];
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
            for (var seci = 0; seci < sectionModes.length; seci++) {
              var withSection = sectionModes[seci] === "on";
            var comp = figma.createComponent();
            comp.name =
              "Variant=" + capVariant +
              ", " +
              "Size=" + capSize +
              ", Radius=" + capRadius +
              ", Border=" + (withBorder ? "On" : "Off") +
              ", Shadow=" + (withShadow ? "On" : "Off") +
              ", Section=" + (withSection ? "On" : "Off");

            comp.layoutMode = "VERTICAL";
            comp.primaryAxisSizingMode = "AUTO";
            comp.counterAxisSizingMode = "FIXED";
            comp.counterAxisAlignItems = "MIN";
            comp.itemSpacing = 0;
            comp.resize(320, 180);
            comp.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
            comp.clipsContent = true;
            var backgroundVar = varMap["card/" + variant + "-background"] || varMap["card/default-background"] || varMap["card/background"];
            var borderVar = varMap["card/" + variant + "-border"] || varMap["card/default-border"] || varMap["card/border"];
            var titleVar = varMap["card/" + variant + "-title"] || varMap["card/default-title"] || varMap["card/title"];
            var descriptionVar = varMap["card/" + variant + "-description"] || varMap["card/default-description"] || varMap["card/description"];
            var sectionBackgroundVar = varMap["card/" + variant + "-section-background"] || varMap["card/default-section-background"] || varMap["card/section-background"];

            if (backgroundVar) bindPaintVar(comp, "fills", 0, backgroundVar);
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
            var rowIndex = si;
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

  progress("Created " + components.length + " card variants");
  var componentSet = figma.combineAsVariants(components, page);
  componentSet.name = "Card";
  return componentSet;
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
  var radii = ["default", "xs", "sm", "md", "lg", "xl"];
  var states = ["default", "hover", "focus", "disabled"];
  var components = [];

  var gap = 24;
  var placements = [];
  var colWidths = [];
  var rowHeights = [];

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

        for (var rmi = 0; rmi < rightIconModes.length; rmi++) {
          var rightIconMode = rightIconModes[rmi];
          var showRightIcon = rightIconMode === "on";
          var capRightIcon = showRightIcon ? "On" : "Off";

          // Default tabs do not visually use corner radius, so avoid redundant radius variants.
          var radiiForVariant = variant === "default" ? ["default"] : radii;
          for (var ri = 0; ri < radiiForVariant.length; ri++) {
            var rad = radiiForVariant[ri];
            var capRadius = rad === "default" ? "Default" : rad.toUpperCase();
            for (var si = 0; si < states.length; si++) {
              var state = states[si];
              var capState = state.charAt(0).toUpperCase() + state.slice(1);

              var comp = figma.createComponent();
              comp.name = "Variant=" + capVariant + ", Orientation=" + capOrientation +
                          ", LeftIcon=" + capLeftIcon + ", RightIcon=" + capRightIcon +
                          ", Radius=" + capRadius + ", State=" + capState;
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
              list.paddingLeft = 0;
              list.paddingRight = 0;
              list.paddingTop = 0;
              list.paddingBottom = 0;
              list.fills = variant === "default" ? [] : [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
              list.strokes = variant === "pills" ? [] : [{ type: "SOLID", color: { r: 0.78, g: 0.78, b: 0.78 } }];
              list.strokeAlign = "INSIDE";
              list.clipsContent = false;
              var radiusVar = rad === "default"
                ? varMap["tabs/" + variant + "-radius-default"]
                : varMap["tabs/radius-" + rad];

              if (variant !== "default") {
                bindPaintVar(list, "fills", 0, varMap["tabs/" + variant + "-list-background"]);
              }
              if (variant !== "pills") {
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
              } else if (variant === "pills") {
                list.strokeWeight = 0;
              } else {
                bindVar(list, "strokeWeight", varMap["tabs/list-border-width"]);
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
                  tabContent.primaryAxisAlignItems = "CENTER";
                  tabContent.counterAxisAlignItems = "CENTER";
                  tabContent.paddingLeft = 12;
                  tabContent.paddingRight = 12;
                  tabContent.paddingTop = 8;
                  tabContent.paddingBottom = 8;
                  tabContent.fills = [];
                  tabContent.strokes = [];
                  tabContent.clipsContent = false;

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
                  if (variant === "pills" && orientation === "horizontal" && visualState === "active") {
                    tab.strokeBottomWeight = 0;
                  }
                  if (variant === "pills" && orientation === "horizontal" && ti > 0) {
                    tab.strokeLeftWeight = 0;
                  } else if (variant === "pills" && orientation === "vertical" && ti > 0) {
                    tab.strokeTopWeight = 0;
                  }
                }

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

              comp.appendChild(list);

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

function tabsTabColorPath(variant, property, state) {
  var base = "tabs/" + variant + "-tab-" + property;
  if (state === "default") return base;
  return base + "-" + state;
}

async function findTabsIconComponents() {
  var result = { image: null, message: null, settings: null, close: null };
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
    if (!result.close && (name.indexOf("close") >= 0 || name.indexOf("x") >= 0 || name.indexOf("cancel") >= 0)) {
      result.close = iconCandidates[j];
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

  if (result.image) progress("[Tabs] LeftIcon image source: " + result.image.name);
  if (result.message) progress("[Tabs] LeftIcon message source: " + result.message.name);
  if (result.settings) progress("[Tabs] LeftIcon settings source: " + result.settings.name);
  if (result.close) progress("[Tabs] RightIcon close source: " + result.close.name);

  return result;
}

function validateTabsVariables(varMap) {
  var variants = ["default", "outlined", "pills"];
  var sharedRadii = ["xs", "sm", "md", "lg", "xl"];
  var states = ["default", "hover", "active", "disabled"];
  var required = [
    "tabs/font-size",
    "tabs/list-border-width",
    "tabs/tab-border-width",
    "tabs/tab-border-width-active",
    "tabs/icon-size",
    "tabs/icon-stroke-width",
    "tabs/icon-gap",
    "tabs/focus-ring"
  ];

  for (var ri = 0; ri < sharedRadii.length; ri++) {
    required.push("tabs/radius-" + sharedRadii[ri]);
  }

  for (var vi = 0; vi < variants.length; vi++) {
    var variant = variants[vi];
    required.push("tabs/" + variant + "-radius-default");
    if (variant !== "default") {
      required.push("tabs/" + variant + "-list-background");
    }
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
