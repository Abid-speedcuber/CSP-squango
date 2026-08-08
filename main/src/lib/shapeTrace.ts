// ========================================
// Square-1 shape path tracer.
// Traces the shape journey through a scramble
// by simulating moves and matching layer
// patterns to shape names.
// ========================================

import {
  createSolvedState,
  CORNER_IDENTIFIER,
  CORNER_PARTNER,
  EDGE_PIECES,
  rotateSection,
  rotateString,
  sliceSwap,
  tokenizeScramble,
  type CubeState,
} from './cube';

export interface ShapePatterns {
  [pattern: string]: string;
}

interface ShapeUnit {
  type: 'E' | 'C';
  edge?: string;
  pair?: string;
  rep?: string;
}

export interface ShapeStep {
  topShape: string;
  bottomShape: string;
  topPattern: string;
  bottomPattern: string;
}

export const DEFAULT_SHAPE_PATTERNS: ShapePatterns = {
  ECECECEC: 'Sq',
  EECECCEC: 'Kite',
  EECCEECC: 'Barr',
  EECCECEC: 'L Fist',
  EECECECC: 'R Fist',
  EECEECCC: 'Shld',
  EEECCECC: 'Muff',
  EEECECCC: 'L Pawn',
  ECEEECCC: 'R Pawn',
  EEEECCCC: 'Scal',
  EECCCCC: 'Pair',
  ECECCCC: 'L',
  ECCECC: 'Line',
  EEEEEECCC: '6',
  ECEEEEECC: 'R 51',
  EEEEECECC: 'L 51',
  EECEEEECC: 'R 42',
  EEEECEECC: 'L 42',
  EEEECECEC: '411',
  EEECEEECC: '33',
  ECEECEEEC: '312',
  ECEEECEEC: '321',
  EECEECEEC: '222',
  EEEEEEEECC: '8',
  EEEEEECEEC: '62',
  EEEECEEEEC: '44',
  EEEEEEECEC: '71',
  EEEEEECEEEC: '53',
  CCCCCC: 'Star',
};

/** Builds the list of units (edge/corner) in one 12-slot layer of a cube state. */
function buildShapeUnits(cubeState: CubeState, startIdx: number): { types: string; units: ShapeUnit[] } {
  const units: ShapeUnit[] = [];
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
      units.push({ type: 'C', pair: CORNER_IDENTIFIER[piece], rep: piece });
      i += 2;
    } else {
      units.push({ type: 'C', pair: CORNER_IDENTIFIER[piece] || '??', rep: piece });
      i += 1;
    }
  }

  return { types: units.map((u) => u.type).join(''), units };
}

/** Finds the shape name for a type pattern under any rotation. */
function matchShapePattern(typeStr: string, shapePatterns: ShapePatterns): string {
  for (const [pattern, name] of Object.entries(shapePatterns)) {
    if (pattern.length !== typeStr.length) continue;
    for (let rotation = 0; rotation < typeStr.length; rotation++) {
      if (rotateString(typeStr, rotation) === pattern) {
        return name;
      }
    }
  }
  return 'Unknown';
}

const recordShape = (state: CubeState, shapePatterns: ShapePatterns): ShapeStep => {
  const topUnits = buildShapeUnits(state, 0);
  const bottomUnits = buildShapeUnits(state, 12);
  return {
    topShape: matchShapePattern(topUnits.types, shapePatterns),
    bottomShape: matchShapePattern(bottomUnits.types, shapePatterns),
    topPattern: topUnits.types,
    bottomPattern: bottomUnits.types,
  };
};

/**
 * Simulates a scramble and records the shape before every "/" plus the final
 * state, producing the full shape journey.
 */
function traceShapePath(scrambleString: string, shapePatterns: ShapePatterns): ShapeStep[] {
  const shapePath: ShapeStep[] = [];
  const cubeState = createSolvedState();

  for (const token of tokenizeScramble(scrambleString)) {
    if (token.type === 'turn') {
      rotateSection(cubeState, 0, 12, token.top);
      rotateSection(cubeState, 12, 12, token.bottom);
      if (token.slash) {
        shapePath.push(recordShape(cubeState, shapePatterns));
        sliceSwap(cubeState);
      }
    } else {
      sliceSwap(cubeState);
    }
  }

  shapePath.push(recordShape(cubeState, shapePatterns));
  return shapePath;
}

function formatShapePath(shapePath: ShapeStep[]): string {
  return shapePath.map((step) => `${step.topShape}/${step.bottomShape}`).join(' → ');
}

export interface ShapeTraceOptions {
  shapePatterns?: ShapePatterns;
}

/** Scramble input → scramble shape path output. */
export function traceScrambleToScrambleShapePath(scramble: string, options: ShapeTraceOptions = {}): string {
  const shapePatterns = options.shapePatterns ?? { ...DEFAULT_SHAPE_PATTERNS };
  return formatShapePath(traceShapePath(scramble.trim(), shapePatterns));
}

/** Scramble input → solution shape path output (reversed). */
export function traceScrambleToSolutionShapePath(scramble: string, options: ShapeTraceOptions = {}): string {
  const shapePatterns = options.shapePatterns ?? { ...DEFAULT_SHAPE_PATTERNS };
  const shapePath = traceShapePath(scramble.trim(), shapePatterns);
  return formatShapePath(shapePath.slice().reverse());
}

/** Solution input → scramble shape path output (invert then trace). */
export function traceSolutionToScrambleShapePath(solution: string, options: ShapeTraceOptions = {}): string {
  const shapePatterns = options.shapePatterns ?? { ...DEFAULT_SHAPE_PATTERNS };
  return formatShapePath(traceShapePath(solution.trim(), shapePatterns));
}

/** Solution input → solution shape path output (invert, trace, reverse). */
export function traceSolutionToSolutionShapePath(solution: string, options: ShapeTraceOptions = {}): string {
  const shapePatterns = options.shapePatterns ?? { ...DEFAULT_SHAPE_PATTERNS };
  const shapePath = traceShapePath(solution.trim(), shapePatterns);
  return formatShapePath(shapePath.slice().reverse());
}
