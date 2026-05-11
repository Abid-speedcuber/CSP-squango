/* ==== FILE: js/tools/shapeTracer.js ==== */

// ========================================
// Square-1 Shape Path Tracer Library
// With  funny names to avoid conflicts!
// Traces the shape journey through every slash!
// ========================================

// EDGE_PIECES, CORNER_PARTNER, getSolvedState, rotateLayer, doSlice → defined in utils.js

// cornerID map (shapeTracer-specific — not duplicated elsewhere)
export const CORNER_ID = {
  A: 'AB', B: 'AB', D: 'DE', E: 'DE', G: 'GH', H: 'GH', J: 'JK', K: 'JK',
  N: 'NO', O: 'NO', Q: 'QR', R: 'QR', T: 'TU', U: 'TU', W: 'WX', X: 'WX'
};

// Default shape patterns
export const defaultShapePatternsForTracing = {
  'ECECECEC': 'Sq',
  'EECECCEC': 'Kite',
  'EECCEECC': 'Barr',
  'EECCECEC': 'L Fist',
  'EECECECC': 'R Fist',
  'EECEECCC': 'Shld',
  'EEECCECC': 'Muff',
  'EEECECCC': 'L Pawn',
  'ECEEECCC': 'R Pawn',
  'EEEECCCC': 'Scal',
  'EECCCCC': 'Pair',
  'ECECCCC': 'L',
  'ECCCECC': 'Line',
  'EEEEEECCC': '6',
  'ECEEEEECC': 'R 51',
  'EEEEECECC': 'L 51',
  'EECEEEECC': 'R 42',
  'EEEECEECC': 'L 42',
  'EEEECECEC': '411',
  'EEECEEECC': '33',
  'ECEECEEEC': '312',
  'ECEEECEEC': '321',
  'EECEECEEC': '222',
  'EEEEEEEECC': '8',
  'EEEEEECEEC': '62',
  'EEEECEEEEC': '44',
  'EEEEEEECEC': '71',
  'EEEEECEEEC': '53',
  'CCCCCC': 'Star'
};

export function rotateStringForPatternSearch(str, rotAmount) {
  const len = str.length;
  const n = ((rotAmount % len) + len) % len;
  return str.slice(n) + str.slice(0, n);
}

// === SCRAMBLE STANDARDIZATION ===
export function StandardizeThisScramble(scrambleString) {
  if (!scrambleString) return '';
  let str = scrambleString.trim();
  if (str.startsWith('/')) str = '(0,0)' + str;
  if (str.endsWith('/'))   str = str + '(0,0)';
  return str;
}

// === BUILD UNITS FROM CUBE STATE ===
export function buildUnitsFromCubeStateForShapeTracing(cubeState, startIdx) {
  const units = [];
  let i = 0;

  while (i < 12) {
    const piece = cubeState[startIdx + i];
    if (EDGE_PIECES.has(piece)) {
      units.push({ type: 'E', edge: piece });
      i += 1;
      continue;
    }

    const nextPiece = cubeState[startIdx + ((i + 1) % 12)];
    if (CORNER_PARTNER[piece] === nextPiece) {
      units.push({ type: 'C', pair: CORNER_ID[piece], rep: piece });
      i += 2;
    } else {
      units.push({ type: 'C', pair: CORNER_ID[piece] || '??', rep: piece });
      i += 1;
    }
  }

  const types = units.map(u => u.type).join('');
  return { types, units };
}

// === PATTERN MATCHING ===
export function matchThisPatternToFindTheShapeName(typeStr, shapePatterns) {
  for (const [pattern, name] of Object.entries(shapePatterns)) {
    if (pattern.length !== typeStr.length) continue;
    for (let rotation = 0; rotation < typeStr.length; rotation++) {
      if (rotateStringForPatternSearch(typeStr, rotation) === pattern) {
        return name;
      }
    }
  }
  return 'Unknown';
}

// === SHAPE PATH TRACING ===
export function traceTheShapePathThroughThisScramble(scrambleString, shapePatterns) {
  const shapePath = [];
  const cubeState = getSolvedState();

  let currentStep = null;

  // Apply moves and capture shapes after each slash
  for (const token of parseScramble(scrambleString)) {
    if (token.type === 'turn') {
      // Apply rotations
      rotateLayer(cubeState, 0, 12, token.top);
      rotateLayer(cubeState, 12, 12, token.bottom);

      // If this turn has a slash, capture the state BEFORE the slash
      if (token.hasSlash) {
        const topUnits = buildUnitsFromCubeStateForShapeTracing(cubeState, 0);
        const bottomUnits = buildUnitsFromCubeStateForShapeTracing(cubeState, 12);
        const topShape = matchThisPatternToFindTheShapeName(topUnits.types, shapePatterns);
        const bottomShape = matchThisPatternToFindTheShapeName(bottomUnits.types, shapePatterns);

        currentStep = {
          topShape: topShape,
          bottomShape: bottomShape,
          topPattern: topUnits.types,
          bottomPattern: bottomUnits.types
        };

        shapePath.push(currentStep);

        // Now do the slash
        doSlice(cubeState);
      }
    } else {
      // Standalone slash
      doSlice(cubeState);
    }
  }

  // Add the final state after all moves
  const finalTopUnits = buildUnitsFromCubeStateForShapeTracing(cubeState, 0);
  const finalBottomUnits = buildUnitsFromCubeStateForShapeTracing(cubeState, 12);
  const finalTopShape = matchThisPatternToFindTheShapeName(finalTopUnits.types, shapePatterns);
  const finalBottomShape = matchThisPatternToFindTheShapeName(finalBottomUnits.types, shapePatterns);

  shapePath.push({
    topShape: finalTopShape,
    bottomShape: finalBottomShape,
    topPattern: finalTopUnits.types,
    bottomPattern: finalBottomUnits.types
  });

  return shapePath;
}

// === FORMAT SHAPE PATH ===
export function formatShapePathAsString(shapePath) {
  return shapePath.map(step => `${step.topShape}/${step.bottomShape}`).join(' → ');
}

// ========================================
// === THE FOUR MAGICAL FUNCTIONS!!! ===
// ========================================

/**
 * Option 1: Scramble input → Scramble shape path output
 */
export function traceScrambleToScrambleShapePath(scramble, options = {}) {
  const shapePatterns = options.shapePatterns || { ...defaultShapePatternsForTracing };

  // Standardize
  const standardized = StandardizeThisScramble(scramble);

  // Trace
  const shapePath = traceTheShapePathThroughThisScramble(standardized, shapePatterns);

  // Format as string
  return formatShapePathAsString(shapePath);
}

/**
 * Option 2: Scramble input → Solution shape path output (reversed)
 */
export function traceScrambleToSolutionShapePath(scramble, options = {}) {
  const shapePatterns = options.shapePatterns || { ...defaultShapePatternsForTracing };

  // Standardize
  const standardized = StandardizeThisScramble(scramble);

  // Trace
  const shapePath = traceTheShapePathThroughThisScramble(standardized, shapePatterns);

  // Reverse the path for solution
  const reversedPath = shapePath.slice().reverse();

  // Format as string
  return formatShapePathAsString(reversedPath);
}

/**
 * Option 3: Solution input → Scramble shape path output (invert then trace)
 */
export function traceSolutionToScrambleShapePath(solution, options = {}) {
  const shapePatterns = options.shapePatterns || { ...defaultShapePatternsForTracing };

  // Invert solution to scramble
  const invertedScramble = invertScramble(solution);

  // Standardize
  const standardized = StandardizeThisScramble(invertedScramble);

  // Trace
  const shapePath = traceTheShapePathThroughThisScramble(standardized, shapePatterns);

  // Format as string
  return formatShapePathAsString(shapePath);
}

/**
 * Option 4: Solution input → Solution shape path output (invert, trace, reverse)
 */
export function traceSolutionToSolutionShapePath(solution, options = {}) {
  const shapePatterns = options.shapePatterns || { ...defaultShapePatternsForTracing };

  // Invert solution to scramble
  const invertedScramble = invertScramble(solution);

  // Standardize
  const standardized = StandardizeThisScramble(invertedScramble);

  // Trace
  const shapePath = traceTheShapePathThroughThisScramble(standardized, shapePatterns);

  // Reverse the path for solution
  const reversedPath = shapePath.slice().reverse();

  // Format as string
  return formatShapePathAsString(reversedPath);
}

if (typeof window !== 'undefined') {
  window.Square1ShapePathTracer = {
    traceScrambleToScrambleShapePath,
    traceScrambleToSolutionShapePath,
    traceSolutionToScrambleShapePath,
    traceSolutionToSolutionShapePath,
    defaultShapePatternsForTracing: defaultShapePatternsForTracing
  };
  window.Square1ShapePathTracerLibraryWithSillyNames = window.Square1ShapePathTracer;
}

// ESM live global compatibility bridge
for (const [name, descriptor] of Object.entries({
    "CORNER_ID": { get: () => CORNER_ID, set: value => { Object.defineProperty(window, "CORNER_ID", { configurable: true, enumerable: true, writable: true, value }); } },
    "defaultShapePatternsForTracing": { get: () => defaultShapePatternsForTracing, set: value => { Object.defineProperty(window, "defaultShapePatternsForTracing", { configurable: true, enumerable: true, writable: true, value }); } },
    "rotateStringForPatternSearch": { get: () => rotateStringForPatternSearch, set: value => { Object.defineProperty(window, "rotateStringForPatternSearch", { configurable: true, enumerable: true, writable: true, value }); } },
    "StandardizeThisScramble": { get: () => StandardizeThisScramble, set: value => { Object.defineProperty(window, "StandardizeThisScramble", { configurable: true, enumerable: true, writable: true, value }); } },
    "buildUnitsFromCubeStateForShapeTracing": { get: () => buildUnitsFromCubeStateForShapeTracing, set: value => { Object.defineProperty(window, "buildUnitsFromCubeStateForShapeTracing", { configurable: true, enumerable: true, writable: true, value }); } },
    "matchThisPatternToFindTheShapeName": { get: () => matchThisPatternToFindTheShapeName, set: value => { Object.defineProperty(window, "matchThisPatternToFindTheShapeName", { configurable: true, enumerable: true, writable: true, value }); } },
    "traceTheShapePathThroughThisScramble": { get: () => traceTheShapePathThroughThisScramble, set: value => { Object.defineProperty(window, "traceTheShapePathThroughThisScramble", { configurable: true, enumerable: true, writable: true, value }); } },
    "formatShapePathAsString": { get: () => formatShapePathAsString, set: value => { Object.defineProperty(window, "formatShapePathAsString", { configurable: true, enumerable: true, writable: true, value }); } },
    "traceScrambleToScrambleShapePath": { get: () => traceScrambleToScrambleShapePath, set: value => { Object.defineProperty(window, "traceScrambleToScrambleShapePath", { configurable: true, enumerable: true, writable: true, value }); } },
    "traceScrambleToSolutionShapePath": { get: () => traceScrambleToSolutionShapePath, set: value => { Object.defineProperty(window, "traceScrambleToSolutionShapePath", { configurable: true, enumerable: true, writable: true, value }); } },
    "traceSolutionToScrambleShapePath": { get: () => traceSolutionToScrambleShapePath, set: value => { Object.defineProperty(window, "traceSolutionToScrambleShapePath", { configurable: true, enumerable: true, writable: true, value }); } },
    "traceSolutionToSolutionShapePath": { get: () => traceSolutionToSolutionShapePath, set: value => { Object.defineProperty(window, "traceSolutionToSolutionShapePath", { configurable: true, enumerable: true, writable: true, value }); } },
})) {
    Object.defineProperty(window, name, {
        configurable: true,
        enumerable: true,
        get: descriptor.get,
        set: descriptor.set
    });
}
