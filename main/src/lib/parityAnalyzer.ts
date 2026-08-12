// ========================================
// Square-1 parity analysis engine.
// Pure logic extracted from the legacy
// "cales-parity-tracer" library (the DOM
// modal parts are handled by the React layer).
// ========================================

import { normalizeScramble } from './normalizer';
import { applyScramble, rotateArray, stateToHex, type CubeState } from './cube';

export interface ColorConfig {
  topLayerMainColor: string;
  topLayerColorFullName: string;
  topLayerColorAbbreviation: string;
  bottomLayerMainColor: string;
  bottomLayerColorFullName: string;
  bottomLayerColorAbbreviation: string;
  frontFaceColorForVisualization: string;
  rightFaceColorForVisualization: string;
  backFaceColorForVisualization: string;
  leftFaceColorForVisualization: string;
}

export const DEFAULT_COLOR_CONFIG: ColorConfig = {
  topLayerMainColor: '#FFD700',
  topLayerColorFullName: 'Yellow',
  topLayerColorAbbreviation: 'Y',
  bottomLayerMainColor: '#FFFFFF',
  bottomLayerColorFullName: 'White',
  bottomLayerColorAbbreviation: 'W',
  frontFaceColorForVisualization: '#CC0000',
  rightFaceColorForVisualization: '#00AA00',
  backFaceColorForVisualization: '#FF8C00',
  leftFaceColorForVisualization: '#0066CC',
};

let colorConfig: ColorConfig = { ...DEFAULT_COLOR_CONFIG };

export function getColorConfig(): ColorConfig {
  return colorConfig;
}

export function setColorConfig(config: Partial<ColorConfig>): void {
  colorConfig = { ...colorConfig, ...config };
}

export const PIECE_LABELS: Record<string, string> = {
  A: 'YOG', B: 'YOG', C: 'YG', D: 'YGR', E: 'YGR', F: 'YR',
  G: 'YRB', H: 'YRB', I: 'YB', J: 'YBO', K: 'YBO', L: 'YO',
  M: 'WR', N: 'WRG', O: 'WRG', P: 'WG', Q: 'WGO', R: 'WGO', S: 'WO',
  T: 'WOB', U: 'WOB', V: 'WB', W: 'WBR', X: 'WBR',
};

const createColorLabelHTML = (str: string): string =>
  str.replace(/[WYGBRO]/g, (m) => `<span class="color-dot ${m}"></span>`);

export const PIECE_LABEL_HTML: Record<string, string> = {};
for (const key of Object.keys(PIECE_LABELS)) {
  PIECE_LABEL_HTML[key] = createColorLabelHTML(PIECE_LABELS[key]);
}

export const EDGE_PIECES = new Set(['C', 'F', 'I', 'L', 'M', 'P', 'S', 'V']);
export const CORNER_PARTNER: Record<string, string> = {
  A: 'B', B: 'A', D: 'E', E: 'D', G: 'H', H: 'G', J: 'K', K: 'J',
  N: 'O', O: 'N', Q: 'R', R: 'Q', T: 'U', U: 'T', W: 'X', X: 'W',
};
export const CORNER_IDENTIFIER: Record<string, string> = {
  A: 'AB', B: 'AB', D: 'DE', E: 'DE', G: 'GH', H: 'GH', J: 'JK', K: 'JK',
  N: 'NO', O: 'NO', Q: 'QR', R: 'QR', T: 'TU', U: 'TU', W: 'WX', X: 'WX',
};
export const SOLVED_EDGES = ['C', 'F', 'I', 'L', 'M', 'P', 'S', 'V'];
export const SOLVED_CORNERS = ['AB', 'DE', 'GH', 'JK', 'NO', 'QR', 'TU', 'WX'];

export function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export function adjustColorBrightness(hexColor: string, percent: number): string {
  const num = parseInt(hexColor.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

export const DEFAULT_SHAPE_PATTERNS: Record<string, string> = {
  ECECECEC: 'Square',
  EECECCEC: 'Kite',
  EECCEECC: 'Barrel',
  EECCECEC: 'Left Fist',
  EECECECC: 'Right Fist',
  EECEECCC: 'Shield',
  EEECCECC: 'Muffin',
  EEECECCC: 'Left Pawn',
  ECEEECCC: 'Right Pawn',
  EEEECCCC: 'Scallop',
  EECCCCC: 'Pair',
  ECECCCC: 'L-Shape',
  ECCCECC: 'Line',
  EEEEEECCC: '6-0',
  ECEEEEECC: 'Right 5-1',
  EEEEECECC: 'Left 5-1',
  EECEEEECC: 'Right 4-2',
  EEEECEECC: 'Left 4-2',
  EEEECECEC: '4-1-1',
  EEECEEECC: '3-3',
  ECEECEEEC: '3-1-2',
  ECEEECEEC: '3-2-1',
  EECEECEEC: '2-2-2',
  EEEEEEEEECC: '8-0',
  EEEEEECEEC: '6-2',
  EEEECEEEEC: '4-4',
  EEEEEEECEC: '7-1',
  EEEEEECEEEC: '5-3',
  CCCCCC: 'Star',
};

const SHAPES_STORAGE_KEY = 'customShapesForParityTracerLibrary';

export function loadShapes(): Record<string, string> {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_SHAPE_PATTERNS };
  const stored = localStorage.getItem(SHAPES_STORAGE_KEY);
  if (stored) {
    try {
      return { ...JSON.parse(stored) };
    } catch {
      return { ...DEFAULT_SHAPE_PATTERNS };
    }
  }
  return { ...DEFAULT_SHAPE_PATTERNS };
}

export function saveShapes(shapes: Record<string, string>): void {
  localStorage.setItem(SHAPES_STORAGE_KEY, JSON.stringify(shapes));
}

let shapePatterns = loadShapes();

export function getShapePatterns(): Record<string, string> {
  if (!shapePatterns || Object.keys(shapePatterns).length === 0) {
    shapePatterns = loadShapes();
  }
  return shapePatterns;
}

export function setShapePatterns(patterns: Record<string, string>): void {
  shapePatterns = { ...patterns };
  saveShapes(shapePatterns);
}

export interface UtilityState {
  z2Enabled: boolean;
  y2Enabled: boolean;
  flipColorEnabled: boolean;
}

export interface ArrowSettings {
  color: string;
  opacity: number;
  strokeWidth: number;
  radius: number;
}

const Z2_MODE_STORAGE_KEY = 'z2TracingModeForParityTracerLibrary';
const IMAGE_SIZE_STORAGE_KEY = 'parityTracerImageSize';
const SHOW_ARROW_STORAGE_KEY = 'parityTracerShowArrow';
const ARROW_SETTINGS_STORAGE_KEY = 'parityTracerArrowSettings';

let z2TracingModeEnabled = (() => {
  if (typeof localStorage === 'undefined') return true;
  const stored = localStorage.getItem(Z2_MODE_STORAGE_KEY);
  return stored === null ? true : stored === 'true';
})();

export function getZ2TracingMode(): boolean {
  return z2TracingModeEnabled;
}

export function setZ2TracingMode(enabled: boolean): void {
  z2TracingModeEnabled = enabled;
  localStorage.setItem(Z2_MODE_STORAGE_KEY, enabled.toString());
}

let parityTracerImageSize = (() => {
  if (typeof localStorage === 'undefined') return 200;
  const stored = localStorage.getItem(IMAGE_SIZE_STORAGE_KEY);
  return stored === null ? 200 : parseInt(stored, 10);
})();

export function getParityTracerImageSize(): number {
  return parityTracerImageSize;
}

export function setParityTracerImageSize(size: number): void {
  parityTracerImageSize = size;
  localStorage.setItem(IMAGE_SIZE_STORAGE_KEY, size.toString());
}

let showCircularArrow = (() => {
  if (typeof localStorage === 'undefined') return true;
  const stored = localStorage.getItem(SHOW_ARROW_STORAGE_KEY);
  return stored === null ? true : stored === 'true';
})();

export const DEFAULT_ARROW_SETTINGS: ArrowSettings = {
  color: 'rgba(253, 34, 34, 0.7)',
  opacity: 0.7,
  strokeWidth: 1.6,
  radius: 0.3,
};

let arrowSettings: ArrowSettings = (() => {
  if (typeof localStorage === 'undefined') return DEFAULT_ARROW_SETTINGS;
  const stored = localStorage.getItem(ARROW_SETTINGS_STORAGE_KEY);
  if (stored === null) return DEFAULT_ARROW_SETTINGS;
  try {
    return { ...DEFAULT_ARROW_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_ARROW_SETTINGS;
  }
})();

export function getShowCircularArrow(): boolean {
  return showCircularArrow;
}

export function setShowCircularArrow(enabled: boolean): void {
  showCircularArrow = enabled;
  localStorage.setItem(SHOW_ARROW_STORAGE_KEY, enabled.toString());
}

export function getArrowSettings(): ArrowSettings {
  return arrowSettings;
}

export function setArrowSettings(settings: Partial<ArrowSettings>): void {
  arrowSettings = { ...arrowSettings, ...settings };
  localStorage.setItem(ARROW_SETTINGS_STORAGE_KEY, JSON.stringify(arrowSettings));
}

export interface EvilnessConfig {
  factor: boolean;
  stringReturn: boolean;
  map: Record<string, boolean>;
}

const defaultEvilness: EvilnessConfig = { factor: false, stringReturn: false, map: {} };
let evilness: EvilnessConfig = { ...defaultEvilness };
let caseNameResolver: ((scramble: string) => string | null) | null = null;

export function setEvilnessConfig(config: Partial<EvilnessConfig>): void {
  evilness = { ...evilness, ...config };
}

export function getEvilnessConfig(): EvilnessConfig {
  return evilness;
}

export function setCaseNameResolver(resolver: ((scramble: string) => string | null) | null): void {
  caseNameResolver = resolver;
}

export function isScrambleEvilInternal(scramble: string): boolean {
  if (!evilness.factor) return false;
  if (!caseNameResolver) return false;
  const caseName = caseNameResolver(scramble);
  if (!caseName) return false;
  return evilness.map[caseName] === true;
}

export function applyUtilityTransformationsToScramble(scramble: string, utility: UtilityState): string {
  let normalized = scramble;
  if (normalizeScramble) {
    normalized = normalizeScramble(scramble);
  }

  let tokens = normalized
    .split(/(\/)/)
    .map((t) => t.trim())
    .filter((t) => t);

  if (utility.flipColorEnabled) tokens.unshift('(6,6)');
  if (utility.y2Enabled) tokens.push('(6,6)');
  if (utility.z2Enabled) {
    tokens.push('/');
    tokens.push('(6,6)');
    tokens.push('/');
  }

  tokens = simplifyTokens(tokens);

  const result = tokens
    .map((tok, i) => {
      if (tok === '/') return '/';
      if (i === 0) return tok;
      return ' ' + tok;
    })
    .join('')
    .replace(/\/\s*\(/g, '/(');

  return result;
}

function simplifyTokens(tokens: string[]): string[] {
  const result = [...tokens];
  let changed = true;

  while (changed) {
    changed = false;

    for (let i = 0; i < result.length - 1; i++) {
      if (result[i] === '/' && result[i + 1] === '/') {
        result.splice(i, 2);
        changed = true;
        break;
      }
    }
    if (changed) continue;

    for (let i = 0; i < result.length - 1; i++) {
      if (result[i].startsWith('(') && result[i + 1].startsWith('(')) {
        result.splice(i, 2, addSets(result[i], result[i + 1]));
        changed = true;
        break;
      }
    }
    if (changed) continue;

    for (let i = 0; i < result.length; i++) {
      if (result[i] === '(0,0)') {
        result.splice(i, 1);
        changed = true;
        break;
      }
    }
  }

  return result;
}

export function addSets(a: string, b: string): string {
  const m = /\((-?\d+),(-?\d+)\)/.exec(a);
  const n = /\((-?\d+),(-?\d+)\)/.exec(b);
  if (!m || !n) return a;
  let x = parseInt(m[1], 10) + parseInt(n[1], 10);
  let y = parseInt(m[2], 10) + parseInt(n[2], 10);

  const norm = (v: number): number => {
    if (v > 6) v -= 12;
    if (v < -6) v += 12;
    return v;
  };

  x = norm(x);
  y = norm(y);
  return `(${x},${y})`;
}

export interface CornerValidationResult {
  ok: boolean;
  pair?: [string, string];
  reason?: string;
}

export function validateCorners(state: CubeState): CornerValidationResult {
  const pairs: [string, string][] = [
    ['A', 'B'], ['D', 'E'], ['G', 'H'], ['J', 'K'], ['N', 'O'], ['Q', 'R'], ['T', 'U'], ['W', 'X'],
  ];
  for (const [x, y] of pairs) {
    const ix = state.indexOf(x);
    const iy = state.indexOf(y);
    const layerX = Math.floor(ix / 12);
    const layerY = Math.floor(iy / 12);
    if (layerX !== layerY) return { ok: false, pair: [x, y], reason: 'split across layers' };
    const a = ix % 12;
    const b = iy % 12;
    const adjacent = (a + 1) % 12 === b || (b + 1) % 12 === a;
    if (!adjacent) return { ok: false, pair: [x, y], reason: 'separated by other pieces' };
  }
  return { ok: true };
}

export interface ShapeUnit {
  type: 'E' | 'C';
  edge?: string;
  pair?: string;
  rep?: string;
}

export interface BuiltUnits {
  types: string;
  units: ShapeUnit[];
}

export function buildUnits(state: CubeState, start: number): BuiltUnits {
  const units: ShapeUnit[] = [];
  let i = 0;
  while (i < 12) {
    const ch = state[start + i];
    if (EDGE_PIECES.has(ch)) {
      units.push({ type: 'E', edge: ch });
      i += 1;
      continue;
    }
    const nextCh = state[start + ((i + 1) % 12)];
    if (CORNER_PARTNER[ch] === nextCh) {
      units.push({ type: 'C', pair: CORNER_IDENTIFIER[ch], rep: ch });
      i += 2;
    } else {
      units.push({ type: 'C', pair: CORNER_IDENTIFIER[ch] || '??', rep: ch });
      i += 1;
    }
  }
  const types = units.map((u) => u.type).join('');
  return { types, units };
}

const SYMMETRIC_SHAPES: Record<string, number> = {
  Square: 4,
  Barrel: 2,
  '2-2-2': 3,
  '4-4': 2,
  Star: 6,
};

export interface MatchedShape {
  name: string;
  pat: string;
  rot: number;
  originalPat: string;
  symmetryDegree: number;
}

export function matchPattern(typeStr: string): MatchedShape {
  const patterns = getShapePatterns();

  for (const [pat, name] of Object.entries(patterns)) {
    if (pat.length !== typeStr.length) continue;

    const maxRotations = typeStr.length;
    const rotationOrder = [0];
    for (let distance = 1; distance < maxRotations; distance++) {
      rotationOrder.push(-distance);
      rotationOrder.push(distance);
    }

    for (const rotationAmount of rotationOrder) {
      const normalizedRotation =
        ((rotationAmount % typeStr.length) + typeStr.length) % typeStr.length;
      if (rotateString(typeStr, normalizedRotation) === pat) {
        return {
          name,
          pat,
          rot: normalizedRotation,
          originalPat: pat,
          symmetryDegree: SYMMETRIC_SHAPES[name] || 1,
        };
      }
    }
  }
  return { name: 'Unknown', pat: typeStr, rot: 0, originalPat: typeStr, symmetryDegree: 1 };
}

function rotateString(s: string, k: number): string {
  const n = s.length;
  k = ((k % n) + n) % n;
  return s.slice(k) + s.slice(0, k);
}

export function countPieces(units: ShapeUnit[]): { e: number; c: number; label: string } {
  const e = units.filter((u) => u.type === 'E').length;
  const c = units.length - e;
  return { e, c, label: `${e}E${c}C` };
}

export interface ParityStep {
  name: string;
  pieces: string;
  codenames: string;
  detail: string;
  result: number;
}

export interface SixStepParity {
  steps: ParityStep[];
  total: number;
  isOdd: boolean;
  evilStep: number | null;
  isOddWithEvil: boolean;
}

const EDGE_CODENAMES: Record<string, string> = {
  L: 'O', C: 'G', F: 'R', I: 'B', M: 'R', P: 'G', S: 'O', V: 'B',
};
const CORNER_COUNTERCLOCKWISE: Record<string, string> = {
  AB: 'O', DE: 'G', GH: 'R', JK: 'B', NO: 'R', QR: 'G', TU: 'O', WX: 'B',
};
const CORNER_CLOCKWISE: Record<string, string> = {
  AB: 'G', DE: 'R', GH: 'B', JK: 'O', NO: 'G', QR: 'O', TU: 'B', WX: 'R',
};

function getEdgeCodename(letter: string): string {
  return EDGE_CODENAMES[letter] || '?';
}

function getCornerCodename(id: string, useClockwiseCorner: boolean): string {
  const colorMap = useClockwiseCorner ? CORNER_CLOCKWISE : CORNER_COUNTERCLOCKWISE;
  return colorMap[id] || '?';
}

function isTopLayerEdge(letter: string): boolean {
  return ['L', 'C', 'F', 'I'].includes(letter);
}

function isTopLayerCorner(id: string): boolean {
  return ['AB', 'DE', 'GH', 'JK'].includes(id);
}

interface TrioParityResult {
  result: number;
  detail: string;
}

function calculateTrioParity(codenames: string[]): TrioParityResult {
  if (codenames.length < 3) return { result: 0, detail: 'Not enough pieces' };

  const trio = codenames.slice(0, 3);
  const opposites: Record<string, string> = { R: 'O', O: 'R', B: 'G', G: 'B' };

  let aloneIdx = -1;
  for (let i = 0; i < 3; i++) {
    const current = trio[i];
    const opp = opposites[current];
    const hasOpposite = trio.some((c, idx) => idx !== i && c === opp);
    if (!hasOpposite) {
      aloneIdx = i;
      break;
    }
  }

  if (aloneIdx === -1) {
    return { result: 0, detail: `Trio ${trio.join('')}: No alone element found` };
  }

  let pair = '';
  if (aloneIdx === 0) pair = trio[0] + trio[1];
  else if (aloneIdx === 2) pair = trio[0] + trio[2];
  else pair = trio[1] + trio[2];

  let pairValue = 0;
  if (pair === 'RG' || pair === 'GR' || pair === 'OB' || pair === 'BO') {
    pairValue = 1;
  } else if (pair === 'RB' || pair === 'BR' || pair === 'OG' || pair === 'GO') {
    pairValue = 0;
  }

  return {
    result: pairValue,
    detail: `Trio ${trio.join('')}: Alone at pos ${aloneIdx + 1}, pair ${pair} = ${pairValue}`,
  };
}

function calculateAlternatingParity(pieces: string[], isEdge: boolean): TrioParityResult {
  const positions = [0, 2, 4, 6];
  const selected = positions.map((i) => pieces[i]).filter((p) => p !== undefined);

  let topLayerCount = 0;
  if (isEdge) {
    topLayerCount = selected.filter((p) => isTopLayerEdge(p)).length;
  } else {
    topLayerCount = selected.filter((p) => isTopLayerCorner(p)).length;
  }

  const result = topLayerCount === 1 || topLayerCount === 3 ? 1 : 0;
  const selectedStr = selected.join(' ');

  return {
    result,
    detail: `Positions 1,3,5,7: [${selectedStr}], ${colorConfig.topLayerColorFullName.toLowerCase()} = ${result}`,
  };
}

export function calculateParity(
  edgesOrderLetters: string[],
  cornersOrderIDs: string[],
  useClockwiseCorner: boolean,
  scrambleForEvil?: string,
): SixStepParity {
  const steps: ParityStep[] = [];

  const topEdges = edgesOrderLetters.filter((e) => isTopLayerEdge(e));
  const topEdgesCodes = topEdges.map((e) => getEdgeCodename(e));
  const line1 = calculateTrioParity(topEdgesCodes);
  steps.push({
    name: `Line 1: ${colorConfig.topLayerColorFullName} Edges`,
    pieces: topEdges.join(' '),
    codenames: topEdgesCodes.join(' '),
    detail: line1.detail,
    result: line1.result,
  });

  const bottomEdges = edgesOrderLetters.filter((e) => !isTopLayerEdge(e));
  const bottomEdgesCodes = bottomEdges.map((e) => getEdgeCodename(e));
  const line2 = calculateTrioParity(bottomEdgesCodes);
  steps.push({
    name: `Line 2: ${colorConfig.bottomLayerColorFullName} Edges`,
    pieces: bottomEdges.join(' '),
    codenames: bottomEdgesCodes.join(' '),
    detail: line2.detail,
    result: line2.result,
  });

  const topCorners = cornersOrderIDs.filter((c) => isTopLayerCorner(c));
  const topCornersCodes = topCorners.map((c) => getCornerCodename(c, useClockwiseCorner));
  const line3 = calculateTrioParity(topCornersCodes);
  steps.push({
    name: `Line 3: ${colorConfig.topLayerColorFullName} Corners`,
    pieces: topCorners.join(' '),
    codenames: topCornersCodes.join(' '),
    detail: line3.detail,
    result: line3.result,
  });

  const bottomCorners = cornersOrderIDs.filter((c) => !isTopLayerCorner(c));
  const bottomCornersCodes = bottomCorners.map((c) => getCornerCodename(c, useClockwiseCorner));
  const line4 = calculateTrioParity(bottomCornersCodes);
  steps.push({
    name: `Line 4: ${colorConfig.bottomLayerColorFullName} Corners`,
    pieces: bottomCorners.join(' '),
    codenames: bottomCornersCodes.join(' '),
    detail: line4.detail,
    result: line4.result,
  });

  const line5 = calculateAlternatingParity(edgesOrderLetters, true);
  steps.push({
    name: 'Line 5: Odd Edges',
    pieces: line5.detail.split(': [')[1].split(']')[0],
    codenames: '-',
    detail: line5.detail,
    result: line5.result,
  });

  const line6 = calculateAlternatingParity(cornersOrderIDs, false);
  steps.push({
    name: 'Line 6: Odd Corners',
    pieces: line6.detail.split(': [')[1].split(']')[0],
    codenames: '-',
    detail: line6.detail,
    result: line6.result,
  });

  const evilStep = evilness.factor ? isScrambleEvilInternal(scrambleForEvil || '') ? 1 : 0 : null;
  const evilnessCount = evilStep !== null ? evilStep : 0;

  const total = steps.reduce((sum, step) => sum + step.result, 0);
  const totalWithEvil = total + evilnessCount;
  const isOdd = total % 2 === 1;
  const isOddWithEvil = totalWithEvil % 2 === 1;

  return { steps, total, isOdd, evilStep, isOddWithEvil };
}

export interface ClusterSlot {
  type: 'corner' | 'half-corner' | 'edge';
  startLetter: number;
  lettersCount: number;
  label: string;
}

export function buildClusters(shapeArray: number[]): ClusterSlot[] {
  const slots: ClusterSlot[] = [];
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWX'.split('');

  function processLayer(start: number, end: number): void {
    let i = start;
    while (i < end) {
      const isCorner = shapeArray[i] === 1;

      if (isCorner) {
        const nextIdx = ((i - start + 1) % 12) + start;
        if (nextIdx < end && shapeArray[nextIdx] === 1) {
          slots.push({
            type: 'corner',
            startLetter: i,
            lettersCount: 2,
            label: letters[i] + letters[nextIdx],
          });
          i += 2;
        } else {
          slots.push({
            type: 'half-corner',
            startLetter: i,
            lettersCount: 1,
            label: letters[i],
          });
          i += 1;
        }
      } else {
        slots.push({
          type: 'edge',
          startLetter: i,
          lettersCount: 1,
          label: letters[i],
        });
        i += 1;
      }
    }
  }

  processLayer(0, 12);
  processLayer(12, 24);

  return slots;
}

export const PIECE_TO_HEX: Record<string, string> = {
  YO: '0', YOG: '77', YG: '6', YGR: '55', YR: '4', YRB: '33', YB: '2', YBO: '11',
  WR: 'a', WRG: 'bb', WG: '8', WGO: '99', WO: 'e', WOB: 'ff', WB: 'c', WBR: 'dd',
};

export function encodeState(state: CubeState): string {
  return stateToHex(state);
}

export function generateShapeSVG(pattern: string, size: number, idPrefix: string): string {
  const cx = size / 2;
  const cy = size / 2;

  const vh =
    typeof window !== 'undefined'
      ? Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
      : 800;
  const unit10vh = vh * 0.1;
  const r_inner = 0;
  const r_outer = Math.round(unit10vh * 0.7);
  const r_outer_apex = Math.round(r_outer * (Math.cos(Math.PI / 6) + Math.sin(Math.PI / 6)));

  const maxRadius = Math.max(r_outer, r_outer_apex);
  const scale = size * 0.4 / maxRadius;
  const scaled_r_outer = r_outer * scale;
  const scaled_r_outer_apex = r_outer_apex * scale;

  const p2c = (cx: number, cy: number, radius: number, angleDeg: number): { x: number; y: number } => {
    const a = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(a), y: cy - radius * Math.sin(a) };
  };

  const ptsToStr = (pts: { x: number; y: number }[]): string =>
    pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

  let svgContent = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display: inline-block;">
    <style>
      .shape-piece { cursor: pointer; transition: all 0.15s ease; }
      .shape-piece:hover { fill: #ffd700 !important; stroke-width: 3; }
    </style>`;

  const pieces = pattern.split('');
  const letterAngles: number[] = [];
  let currentAngle = 90;

  pieces.forEach((piece) => {
    if (piece === 'E') {
      letterAngles.push(currentAngle);
      currentAngle -= 30;
    } else {
      letterAngles.push(currentAngle);
      letterAngles.push(currentAngle - 30);
      currentAngle -= 60;
    }
  });

  let angleIndex = 0;
  pieces.forEach((piece, index) => {
    const isEdge = piece === 'E';
    const isFirst = index === 0;
    const fillColor = isFirst ? '#add8e6' : '#ffffff';

    if (isEdge) {
      const centerAngle = letterAngles[angleIndex];
      const half = 15;

      const pInner = p2c(cx, cy, r_inner, centerAngle);
      const pA = p2c(cx, cy, scaled_r_outer, centerAngle - half);
      const pB = p2c(cx, cy, scaled_r_outer, centerAngle + half);

      svgContent += `<polygon
            class="shape-piece shape-piece-${idPrefix}"
            data-piece-index="${index}"
            points="${ptsToStr([pInner, pA, pB])}"
            fill="${fillColor}"
            stroke="#000"
            stroke-width="2"
          />`;

      angleIndex += 1;
    } else {
      const angle1 = letterAngles[angleIndex];
      const angle2 = letterAngles[angleIndex + 1];
      const centerAngle = (angle1 + angle2) / 2;
      const half = 30;

      const pInner = p2c(cx, cy, r_inner, centerAngle);
      const pOuterR = p2c(cx, cy, scaled_r_outer, centerAngle - half);
      const pApex = p2c(cx, cy, scaled_r_outer_apex, centerAngle);
      const pOuterL = p2c(cx, cy, scaled_r_outer, centerAngle + half);

      svgContent += `<polygon
            class="shape-piece shape-piece-${idPrefix}"
            data-piece-index="${index}"
            points="${ptsToStr([pInner, pOuterR, pApex, pOuterL])}"
            fill="${fillColor}"
            stroke="#000"
            stroke-width="2"
          />`;

      angleIndex += 2;
    }
  });

  svgContent += `<circle cx="${cx}" cy="${cy}" r="2" fill="#666"/>`;
  svgContent += `</svg>`;

  return svgContent;
}

export interface ArrowAngle {
  startAngle: number;
  arcDegrees: number;
}

export function calculateArrowAngle(
  rotationAmount: number,
  unitsArray: ShapeUnit[],
  layerType: 'TOP' | 'BOTTOM',
  patternTypes: string,
): ArrowAngle {
  const initialAngle = layerType === 'TOP' ? 90 : 300;
  const endsWithCorner = patternTypes.endsWith('C');
  const arcDegrees = endsWithCorner ? 300 : 330;

  let totalRotationDegrees = 0;
  for (let i = 0; i < rotationAmount; i++) {
    const pieceType = unitsArray[i].type;
    totalRotationDegrees += pieceType === 'E' ? 30 : 60;
  }

  const finalAngle = initialAngle - totalRotationDegrees;
  return { startAngle: finalAngle, arcDegrees };
}

export function generateArrowSVG(
  centerX: number,
  centerY: number,
  radius: number,
  startAngleDeg: number,
  arcDegrees: number,
  size: number,
): string {
  if (!showCircularArrow) return '';

  const strokeWidth = size * 0.01 * arrowSettings.strokeWidth;
  const arrowColor = arrowSettings.color;
  const opacity = arrowSettings.opacity;
  const adjustedRadius = radius * arrowSettings.radius;

  const arrowSize = strokeWidth * 3;
  const startDiskRadius = strokeWidth * 1.2;

  const arrowTipExtensionDegrees = (arrowSize / adjustedRadius) * (180 / Math.PI);
  const adjustedArcDegrees = arcDegrees - arrowTipExtensionDegrees;

  const startRad = ((startAngleDeg - 15) * Math.PI) / 180;
  const endRad = ((startAngleDeg - 15 - adjustedArcDegrees) * Math.PI) / 180;

  const startX = centerX + adjustedRadius * Math.cos(startRad);
  const startY = centerY - adjustedRadius * Math.sin(startRad);
  const endX = centerX + adjustedRadius * Math.cos(endRad);
  const endY = centerY - adjustedRadius * Math.sin(endRad);

  const largeArcFlag = arcDegrees >= 180 ? 1 : 0;
  const pathD = `M ${startX} ${startY} A ${adjustedRadius} ${adjustedRadius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;

  const tangentAngle = endRad - Math.PI / 2;

  const arrowTipX = endX + arrowSize * Math.cos(tangentAngle);
  const arrowTipY = endY - arrowSize * Math.sin(tangentAngle);

  const perpAngle1 = tangentAngle + (2 * Math.PI) / 3;
  const perpAngle2 = tangentAngle - (2 * Math.PI) / 3;

  const arrow1X = endX + arrowSize * 0.5 * Math.cos(perpAngle1);
  const arrow1Y = endY - arrowSize * 0.5 * Math.sin(perpAngle1);
  const arrow2X = endX + arrowSize * 0.5 * Math.cos(perpAngle2);
  const arrow2Y = endY - arrowSize * 0.5 * Math.sin(perpAngle2);

  return `
        <g opacity="${opacity}">
            <path d="${pathD}"
                  fill="none"
                  stroke="${arrowColor}"
                  stroke-width="${strokeWidth}"
                  stroke-dasharray="${size * 0.008},${size * 0.004}"
                  stroke-linecap="round"/>
            <circle cx="${startX}" cy="${startY}" r="${startDiskRadius}"
                    fill="${arrowColor}" stroke="none"/>
            <polygon points="${arrowTipX},${arrowTipY} ${arrow1X},${arrow1Y} ${arrow2X},${arrow2Y}"
                     fill="${arrowColor}" stroke="none"/>
        </g>
    `;
}

// === FULL PARITY PIPELINE ===

export type CornerMode = 'clockwise' | 'counterclockwise';

/**
 * Full parity pipeline: applies the scramble, resolves each layer's shape
 * orientation, collects the piece orders, and runs the six-step parity check.
 * Returns 'Odd', 'Even', or 'Error'.
 */
export function analyzeParity(
  scrambleText: string,
  cornerMode: CornerMode = 'counterclockwise',
): 'Odd' | 'Even' | 'Error' {
  try {
    const state = applyScramble(scrambleText);
    const topRaw = buildUnits(state, 0);
    const botRaw = buildUnits(state, 12);
    const topMatch = matchPattern(topRaw.types);
    const botMatch = matchPattern(botRaw.types);
    const topUnits = rotateArray(topRaw.units, topMatch.rot);
    const botUnits = rotateArray(botRaw.units, botMatch.rot);
    const topCounts = countPieces(topUnits);
    const botCounts = countPieces(botUnits);

    const shouldSwapForParity =
      getZ2TracingMode() &&
      ((topCounts.label === '2E5C' && botCounts.label === '6E3C') ||
        (topCounts.label === '0E6C' && botCounts.label === '8E2C'));

    const parityEdgesOrder: string[] = [];
    const parityCornersOrder: string[] = [];

    const collect = (units: ShapeUnit[]): void => {
      for (const u of units) {
        if (u.type === 'E') parityEdgesOrder.push(u.edge!);
        else parityCornersOrder.push(u.pair!);
      }
    };

    if (shouldSwapForParity) {
      collect(botUnits);
      collect(topUnits);
    } else {
      collect(topUnits);
      collect(botUnits);
    }

    const sixStepParity = calculateParity(
      parityEdgesOrder,
      parityCornersOrder,
      cornerMode === 'clockwise',
      scrambleText,
    );
    const useEvil = getEvilnessConfig().stringReturn && sixStepParity.evilStep !== null;
    return (useEvil ? sixStepParity.isOddWithEvil : sixStepParity.isOdd) ? 'Odd' : 'Even';
  } catch {
    return 'Error';
  }
}

/**
 * Legacy-compatible `getParityText` from `ParityAnalyzerLib`.
 * Takes the legacy color object ({topColor, bottomColor, frontColor,
 * rightColor, backColor, leftColor}), maps it into the internal ColorConfig
 * and returns 'Odd' | 'Even' | 'Error'.
 *
 * NOTE: layer color NAMES are resolved via getColorName and only affect the
 * human-readable step text, never the parity result itself.
 */
export interface LegacyParityColors {
  topColor: string;
  bottomColor: string;
  frontColor: string;
  rightColor: string;
  backColor: string;
  leftColor: string;
}

export function getColorName(hexColor: string): string {
  const colorMap: Record<string, string> = {
    '#000000': 'Black',
    '#FFFFFF': 'White',
    '#FFFF00': 'Yellow',
    '#FFD700': 'Yellow',
  };
  return colorMap[hexColor.toUpperCase()] || 'Top';
}

export function getParityText(
  scrambleText: string,
  colors: LegacyParityColors,
  cornerMode: CornerMode = 'counterclockwise',
): 'Odd' | 'Even' | 'Error' {
  // Always use fresh shapes from storage (mirrors legacy behavior).
  shapePatterns = loadShapes();

  const topName = getColorName(colors.topColor);
  const bottomName = getColorName(colors.bottomColor);
  setColorConfig({
    topLayerMainColor: colors.topColor,
    topLayerColorFullName: topName,
    topLayerColorAbbreviation: topName.charAt(0),
    bottomLayerMainColor: colors.bottomColor,
    bottomLayerColorFullName: bottomName,
    bottomLayerColorAbbreviation: bottomName.charAt(0),
    frontFaceColorForVisualization: colors.frontColor,
    rightFaceColorForVisualization: colors.rightColor,
    backFaceColorForVisualization: colors.backColor,
    leftFaceColorForVisualization: colors.leftColor,
  });

  return analyzeParity(scrambleText, cornerMode);
}
