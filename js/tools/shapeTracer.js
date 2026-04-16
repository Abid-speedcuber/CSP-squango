// ========================================
// Square-1 Shape Path Tracer Library
// With ridiculously funny names to avoid conflicts!
// Traces the shape journey through every slash!
// ========================================

// === USE CONSOLIDATED FUNCTIONS FROM utils.js ===
const theseAreTotallyEdgePiecesForShapeTracing = window.edgePieces;
const whoIsMyPartnerForShapeTracing = window.cornerPartner;
const whatIsMyCornerIDForShapeTracing = window.cornerIdentifier;

const gimmeASolvedSquareOneCubePlease = window.createSolvedState;
const pleaseRotateSectionForShapeTracing = window.rotateSection;
const doTheSliceSwapForShapeTracing = window.sliceSwap;
const rotateStringForPatternSearch = window.rotateString;

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

// === USE window.rotateString for rotation ===

// === USE CONSOLIDATED FUNCTIONS ===
const pleaseStandardizeThisScrambleForMe = (s) => s ? s.trim() : '';
const pleaseInvertThisScrambleForShapeTracing = window.invertScramble;

// === TOKENIZER (use consolidated) ===
function* pleaseTokenizeThisScrambleForShapeTracing(scrambleString) {
  let idx = 0;
  const totalLen = scrambleString.length;
  const whitespaceRegex = /\s/;
  const integerRegex = /^([+-]?\d+)/;

  const skipWhitespace = () => {
    while (idx < totalLen && whitespaceRegex.test(scrambleString[idx])) idx++;
  };

  while (true) {
    skipWhitespace();
    if (idx >= totalLen) return;

    const currentChar = scrambleString[idx];

    if (currentChar === '(') {
      idx++;
      skipWhitespace();

      let match = scrambleString.slice(idx).match(integerRegex);
      if (!match) { idx++; continue; }
      const topValue = +match[1];
      idx += match[1].length;

      skipWhitespace();
      if (scrambleString[idx] === ',') idx++;
      skipWhitespace();

      match = scrambleString.slice(idx).match(integerRegex);
      if (!match) { idx++; continue; }
      const bottomValue = +match[1];
      idx += match[1].length;

      skipWhitespace();
      if (scrambleString[idx] === ')') idx++;
      skipWhitespace();

      const hasSlashAfter = (scrambleString[idx] === '/');
      if (hasSlashAfter) idx++;

      yield { moveType: 'turn', top: topValue, bottom: bottomValue, hasSlash: hasSlashAfter };
      continue;
    }

    if (currentChar === '/') {
      idx++;
      yield { moveType: 'slash' };
      continue;
    }

    idx++;
  }
}

// === BUILD UNITS FROM CUBE STATE ===
function buildUnitsFromCubeStateForShapeTracing(cubeState, startIdx) {
  const units = [];
  let i = 0;

  while (i < 12) {
    const piece = cubeState[startIdx + i];
    if (theseAreTotallyEdgePiecesForShapeTracing.has(piece)) {
      units.push({ type: 'E', edge: piece });
      i += 1;
      continue;
    }

    const nextPiece = cubeState[startIdx + ((i + 1) % 12)];
    if (whoIsMyPartnerForShapeTracing[piece] === nextPiece) {
      units.push({ type: 'C', pair: whatIsMyCornerIDForShapeTracing[piece], rep: piece });
      i += 2;
    } else {
      units.push({ type: 'C', pair: whatIsMyCornerIDForShapeTracing[piece] || '??', rep: piece });
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
  const cubeState = gimmeASolvedSquareOneCubePlease();

  let currentStep = null;

  // Apply moves and capture shapes after each slash
  for (const token of pleaseTokenizeThisScrambleForShapeTracing(scrambleString)) {
    if (token.moveType === 'turn') {
      // Apply rotations
      pleaseRotateSectionForShapeTracing(cubeState, 0, 12, token.top);
      pleaseRotateSectionForShapeTracing(cubeState, 12, 12, token.bottom);

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
        doTheSliceSwapForShapeTracing(cubeState);
      }
    } else {
      // Standalone slash
      doTheSliceSwapForShapeTracing(cubeState);
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
function traceScrambleToScrambleShapePathPlease(scramble, options = {}) {
  const shapePatterns = options.shapePatterns || { ...defaultShapePatternsForTracing };

  // Standardize
  const standardized = pleaseStandardizeThisScrambleForMe(scramble);

  // Trace
  const shapePath = traceTheShapePathThroughThisScramble(standardized, shapePatterns);

  // Format as string
  return formatShapePathAsString(shapePath);
}

/**
 * Option 2: Scramble input → Solution shape path output (reversed)
 */
function traceScrambleToSolutionShapePathPlease(scramble, options = {}) {
  const shapePatterns = options.shapePatterns || { ...defaultShapePatternsForTracing };

  // Standardize
  const standardized = pleaseStandardizeThisScrambleForMe(scramble);

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
function traceSolutionToScrambleShapePathPlease(solution, options = {}) {
  const shapePatterns = options.shapePatterns || { ...defaultShapePatternsForTracing };

  // Invert solution to scramble
  const invertedScramble = pleaseInvertThisScrambleForShapeTracing(solution);

  // Standardize
  const standardized = pleaseStandardizeThisScrambleForMe(invertedScramble);

  // Trace
  const shapePath = traceTheShapePathThroughThisScramble(standardized, shapePatterns);

  // Format as string
  return formatShapePathAsString(shapePath);
}

/**
 * Option 4: Solution input → Solution shape path output (invert, trace, reverse)
 */
function traceSolutionToSolutionShapePathPlease(solution, options = {}) {
  const shapePatterns = options.shapePatterns || { ...defaultShapePatternsForTracing };

  // Invert solution to scramble
  const invertedScramble = pleaseInvertThisScrambleForShapeTracing(solution);

  // Standardize
  const standardized = pleaseStandardizeThisScrambleForMe(invertedScramble);

  // Trace
  const shapePath = traceTheShapePathThroughThisScramble(standardized, shapePatterns);

  // Reverse the path for solution
  const reversedPath = shapePath.slice().reverse();

  // Format as string
  return formatShapePathAsString(reversedPath);
}

// ========================================
// === EXPORT FOR USE ===
// ========================================

// For direct browser usage, attach to window
if (typeof window !== 'undefined') {
  window.Square1ShapePathTracerLibraryWithSillyNames = {
    traceScrambleToScrambleShapePathPlease,
    traceScrambleToSolutionShapePathPlease,
    traceSolutionToScrambleShapePathPlease,
    traceSolutionToSolutionShapePathPlease,
    // Expose default shape patterns for reference
    defaultShapePatternsForTracing: defaultShapePatternsForTracing
  };
}

// For module systems (Node.js, bundlers, etc.)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    traceScrambleToScrambleShapePathPlease,
    traceScrambleToSolutionShapePathPlease,
    traceSolutionToScrambleShapePathPlease,
    traceSolutionToSolutionShapePathPlease,
    defaultShapePatternsForTracing: defaultShapePatternsForTracing
  };
}