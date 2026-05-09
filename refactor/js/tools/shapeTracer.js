/* ==== FILE: js/tools/shapeTracer.js ==== */

// ========================================
// Square-1 Shape Path Tracer Library
// With  funny names to avoid conflicts!
// Traces the shape journey through every slash!
// ========================================

// EDGE_PIECES, CORNER_PARTNER, getSolvedState, rotateLayer, doSlice → defined in utils.js

// cornerID map (shapeTracer-specific — not duplicated elsewhere)
const CORNER_ID = {
  A: 'AB', B: 'AB', D: 'DE', E: 'DE', G: 'GH', H: 'GH', J: 'JK', K: 'JK',
  N: 'NO', O: 'NO', Q: 'QR', R: 'QR', T: 'TU', U: 'TU', W: 'WX', X: 'WX'
};

// Default shape patterns
const defaultShapePatternsForTracing = {
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

function rotateStringForPatternSearch(str, rotAmount) {
  const len = str.length;
  const n = ((rotAmount % len) + len) % len;
  return str.slice(n) + str.slice(0, n);
}

// === SCRAMBLE STANDARDIZATION ===
function StandardizeThisScramble(scrambleString) {
  if (!scrambleString) return '';
  let str = scrambleString.trim();
  if (str.startsWith('/')) str = '(0,0)' + str;
  if (str.endsWith('/'))   str = str + '(0,0)';
  return str;
}

// === BUILD UNITS FROM CUBE STATE ===
function buildUnitsFromCubeStateForShapeTracing(cubeState, startIdx) {
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
function matchThisPatternToFindTheShapeName(typeStr, shapePatterns) {
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
function traceTheShapePathThroughThisScramble(scrambleString, shapePatterns) {
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
function formatShapePathAsString(shapePath) {
  return shapePath.map(step => `${step.topShape}/${step.bottomShape}`).join(' → ');
}

// ========================================
// === THE FOUR MAGICAL FUNCTIONS!!! ===
// ========================================

/**
 * Option 1: Scramble input → Scramble shape path output
 */
function traceScrambleToScrambleShapePath(scramble, options = {}) {
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
function traceScrambleToSolutionShapePath(scramble, options = {}) {
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
function traceSolutionToScrambleShapePath(solution, options = {}) {
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
function traceSolutionToSolutionShapePath(solution, options = {}) {
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
