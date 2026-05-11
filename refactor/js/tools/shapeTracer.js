/* ==== FILE: js/tools/shapeTracer.js ==== */

import {
  hexCycleLeft,
  hexTwist,
  invertScramble,
  parseScramble
} from '../utils.js?v=esm-20260511-2';

// Square-1 shape path tracer.
// Shape recognition is delegated to Cale's parity tracer so both popups and
// parity analysis use the same shape patterns, rotations, and custom schemes.

export const shortShapeNamesForTracing = {
  Square: 'sq',
  Kite: 'kt',
  Barrel: 'br',
  'Left Fist': 'lfist',
  'Right Fist': 'rfist',
  Shield: 'sh',
  Muffin: 'mf',
  'Left Pawn': 'lpw',
  'Right Pawn': 'rpw',
  Scallop: 'sc',
  Pair: 'pr',
  'L-Shape': 'l',
  Line: 'ln',
  '6-0': '6',
  'Right 5-1': 'r51',
  'Left 5-1': 'l51',
  'Right 4-2': 'r42',
  'Left 4-2': 'l42',
  '4-1-1': '411',
  '3-3': '33',
  '3-1-2': '312',
  '3-2-1': '321',
  '2-2-2': '222',
  '8-0': '8',
  '6-2': '62',
  '4-4': '44',
  '7-1': '71',
  '5-3': '53',
  Star: 'star'
};

export function StandardizeThisScramble(scrambleString) {
  if (!scrambleString) return '';
  return String(scrambleString).trim();
}

export function getShortShapeNameForTracing(shapeName) {
  return shortShapeNamesForTracing[shapeName] || shapeName;
}

function getCaleShapeDetector() {
  const detector = window.ParityTracerLibrary && window.ParityTracerLibrary.detectShapesFromHex;
  if (typeof detector !== 'function') {
    throw new Error('Cale parity tracer shape detector is unavailable');
  }
  return detector;
}

export function traceTheShapePathThroughThisScramble(scrambleString) {
  const shapePath = [];
  const detectShapesFromHex = getCaleShapeDetector();
  let tlHex = '011233455677';
  let blHex = '998bbaddcffe';

  for (const token of parseScramble(scrambleString)) {
    if (token.type === 'turn') {
      tlHex = hexCycleLeft(tlHex, token.top);
      blHex = hexCycleLeft(blHex, token.bottom);
      continue;
    }

    shapePath.push(detectShapesFromHex(tlHex, blHex));
    ({ tlHex, blHex } = hexTwist(tlHex, blHex));
  }

  shapePath.push(detectShapesFromHex(tlHex, blHex));
  return shapePath;
}

export function formatShapePathAsString(shapePath) {
  return shapePath
    .map(step => `${getShortShapeNameForTracing(step.topShape)}/${getShortShapeNameForTracing(step.bottomShape)}`)
    .join(' → ');
}

export function traceScrambleToScrambleShapePath(scramble) {
  const standardized = StandardizeThisScramble(scramble);
  const shapePath = traceTheShapePathThroughThisScramble(standardized);
  return formatShapePathAsString(shapePath);
}

export function traceScrambleToSolutionShapePath(scramble) {
  const standardized = StandardizeThisScramble(scramble);
  const shapePath = traceTheShapePathThroughThisScramble(standardized);
  return formatShapePathAsString(shapePath.slice().reverse());
}

export function traceSolutionToScrambleShapePath(solution) {
  const invertedScramble = invertScramble(solution);
  const standardized = StandardizeThisScramble(invertedScramble);
  const shapePath = traceTheShapePathThroughThisScramble(standardized);
  return formatShapePathAsString(shapePath);
}

export function traceSolutionToSolutionShapePath(solution) {
  const invertedScramble = invertScramble(solution);
  const standardized = StandardizeThisScramble(invertedScramble);
  const shapePath = traceTheShapePathThroughThisScramble(standardized);
  return formatShapePathAsString(shapePath.slice().reverse());
}

if (typeof window !== 'undefined') {
  window.Square1ShapePathTracer = {
    traceScrambleToScrambleShapePath,
    traceScrambleToSolutionShapePath,
    traceSolutionToScrambleShapePath,
    traceSolutionToSolutionShapePath,
    shortShapeNamesForTracing
  };
  window.Square1ShapePathTracerLibraryWithSillyNames = window.Square1ShapePathTracer;

  for (const [name, descriptor] of Object.entries({
    StandardizeThisScramble: { get: () => StandardizeThisScramble, set: value => { Object.defineProperty(window, 'StandardizeThisScramble', { configurable: true, enumerable: true, writable: true, value }); } },
    shortShapeNamesForTracing: { get: () => shortShapeNamesForTracing, set: value => { Object.defineProperty(window, 'shortShapeNamesForTracing', { configurable: true, enumerable: true, writable: true, value }); } },
    getShortShapeNameForTracing: { get: () => getShortShapeNameForTracing, set: value => { Object.defineProperty(window, 'getShortShapeNameForTracing', { configurable: true, enumerable: true, writable: true, value }); } },
    traceTheShapePathThroughThisScramble: { get: () => traceTheShapePathThroughThisScramble, set: value => { Object.defineProperty(window, 'traceTheShapePathThroughThisScramble', { configurable: true, enumerable: true, writable: true, value }); } },
    formatShapePathAsString: { get: () => formatShapePathAsString, set: value => { Object.defineProperty(window, 'formatShapePathAsString', { configurable: true, enumerable: true, writable: true, value }); } },
    traceScrambleToScrambleShapePath: { get: () => traceScrambleToScrambleShapePath, set: value => { Object.defineProperty(window, 'traceScrambleToScrambleShapePath', { configurable: true, enumerable: true, writable: true, value }); } },
    traceScrambleToSolutionShapePath: { get: () => traceScrambleToSolutionShapePath, set: value => { Object.defineProperty(window, 'traceScrambleToSolutionShapePath', { configurable: true, enumerable: true, writable: true, value }); } },
    traceSolutionToScrambleShapePath: { get: () => traceSolutionToScrambleShapePath, set: value => { Object.defineProperty(window, 'traceSolutionToScrambleShapePath', { configurable: true, enumerable: true, writable: true, value }); } },
    traceSolutionToSolutionShapePath: { get: () => traceSolutionToSolutionShapePath, set: value => { Object.defineProperty(window, 'traceSolutionToSolutionShapePath', { configurable: true, enumerable: true, writable: true, value }); } }
  })) {
    Object.defineProperty(window, name, {
      configurable: true,
      enumerable: true,
      get: descriptor.get,
      set: descriptor.set
    });
  }
}
