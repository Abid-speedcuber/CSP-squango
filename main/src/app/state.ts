import { CASES } from '../data/cases';
import { SHAPE_INDEX, SHAPE_INDEX_MAP } from '../data/shapeIndex';
import type { AlgCase } from '../data/types';
import { algToShapeIndex, invertScramble } from '../lib/cube';
import { getParityText } from '../lib/parityAnalyzer';
import {
  applyHomepageSVGsLive,
  getHomepageShapeSVGs,
  loadHomepageImageSettings,
  resetHomepageImageSettings as resetHomepageImageSettingsDefaults,
  saveHomepageImageSettings,
  type HomepageImageSettings,
} from '../lib/homepageShapes';
import { notify } from './store';

export const data: AlgCase[] = CASES;
export const shapeIndex = SHAPE_INDEX;
export const shapeIndexMap = SHAPE_INDEX_MAP;

export type SortMode = 'priority' | 'probability' | 'antiProbability';
export type LearnFilter = 'all' | 'learned' | 'unlearned';
export type CornerMode = 'counterclockwise' | 'clockwise';

export interface ColorScheme {
  topColor: string;
  bottomColor: string;
  frontColor: string;
  rightColor: string;
  backColor: string;
  leftColor: string;
  dividerColor: string;
  circleColor: string;
}

const DEFAULT_COLOR_SCHEME: ColorScheme = {
  topColor: '#000000',
  bottomColor: '#FFFFFF',
  frontColor: '#CC0000',
  rightColor: '#00AA00',
  backColor: '#FF8C00',
  leftColor: '#0066CC',
  dividerColor: '#7a0000',
  circleColor: 'transparent',
};

// ── Preset configuration (mirrors legacy window.PRESET_CONFIG) ─────────────
export const PRESET_CONFIG: Record<string, string> = {
  "Matt's_Preset": "presets/Matt's_Preset.json",
  'Empty_Preset': 'presets/Empty_Preset.json',
};

// ── Default display names for all 90 cases (fresh installs) ────────────────
const defaultDisplayNames: Record<string, string> = {
  '8/Star': '8/Star',
  '7-1/Star': '7-1/Star',
  '6-2/Star': '6-2/Star',
  '5-3/Star': '5-3/Star',
  '4-4/Star': '4-4/Star',
  '2-2-2/Paired Edges': '2-2-2/Pair',
  '2-2-2/Parallel Edges': '2-2-2/Line',
  '2-2-2/Perpendicular Edges': '2-2-2/L',
  '3-1-2/Paired Edges': '3-1-2/Pair',
  '3-1-2/Parallel Edges': '3-1-2/Line',
  '3-1-2/Perpendicular Edges': '3-1-2/L',
  '3-2-1/Paired Edges': '3-2-1/Pair',
  '3-2-1/Parallel Edges': '3-2-1/Line',
  '3-2-1/Perpendicular Edges': '3-2-1/L',
  '3-3/Paired Edges': '3-3/Pair',
  '3-3/Parallel Edges': '3-3/Line',
  '3-3/Perpendicular Edges': '3-3/L',
  '4-1-1/Paired Edges': '4-1-1/Pair',
  '4-1-1/Parallel Edges': '4-1-1/Line',
  '4-1-1/Perpendicular Edges': '4-1-1/L',
  'Left 4-2/Paired Edges': 'Left 4-2/Pair',
  'Left 4-2/Parallel Edges': 'Left 4-2/Line',
  'Left 4-2/Perpendicular Edges': 'Left 4-2/L',
  'Right 4-2/Paired Edges': 'Right 4-2/Pair',
  'Right 4-2/Parallel Edges': 'Right 4-2/Line',
  'Right 4-2/Perpendicular Edges': 'Right 4-2/L',
  'Left 5-1/Paired Edges': 'Left 5-1/Pair',
  'Left 5-1/Parallel Edges': 'Left 5-1/Line',
  'Left 5-1/Perpendicular Edges': 'Left 5-1/L',
  'Right 5-1/Paired Edges': 'Right 5-1/Pair',
  'Right 5-1/Parallel Edges': 'Right 5-1/Line',
  'Right 5-1/Perpendicular Edges': 'Right 5-1/L',
  '6/Paired Edges': '6/Pair',
  '6/Parallel Edges': '6/Line',
  '6/Perpendicular Edges': '6/L',
  'Barrel/Barrel': 'Barrel/Barrel',
  'Barrel/Square': 'Barrel/Square',
  'Barrel/Left Fist': 'Barrel/Left Fist',
  'Barrel/Right Fist': 'Barrel/Right Fist',
  'Kite/Barrel': 'Kite/Barrel',
  'Kite/Kite': 'Kite/Kite',
  'Kite/Square': 'kite/Square',
  'Kite/Left Fist': 'Kite/Left Fist',
  'Kite/Right Fist': 'Kite/Right Fist',
  'Muffin/Barrel': 'Muffin/Barrel',
  'Muffin/Kite': 'Muffin/Kite',
  'Muffin/Muffin': 'Muffin/Muffin',
  'Muffin/Square': 'Muffin/Square',
  'Muffin/Left Fist': 'Muffin/Left Fist',
  'Muffin/Right Fist': 'Muffin/Right Fist',
  'Shield/Barrel': 'Shield/Barrel',
  'Shield/Kite': 'Shield/Kite',
  'Shield/Muffin': 'Shield/Muffin',
  'Shield/Shield': 'Shield/Shield',
  'Shield/Square': 'Shield/Square',
  'Shield/Left Fist': 'Shield/Left Fist',
  'Shield/Right Fist': 'Shield/Right Fist',
  'Scallop/Barrel': 'Scallop/Barrel',
  'Scallop/Kite': 'Scallop/Kite',
  'Scallop/Muffin': 'Scallop/Muffin',
  'Scallop/Shield': 'Scallop/Shield',
  'Scallop/Scallop': 'Scallop/Scallop',
  'Scallop/Square': 'Scallop/Square',
  'Scallop/Left Fist': 'Scallop/Left Fist',
  'Scallop/Right Fist': 'Scallop/Right Fist',
  'Scallop/Left Pawn': 'Scallop/Left Pawn',
  'Scallop/Right Pawn': 'Scallop/Right Pawn',
  'Square/Square': 'Square/Square',
  'Left Fist/Square': 'Left Fist/Square',
  'Left Fist/Left Fist': 'Left Fist/Left Fist',
  'Left Fist/Right Fist': 'Left Fist/Right Fist',
  'Right Fist/Square': 'Right Fist/Square',
  'Right Fist/Right Fist': 'Right Fist/Right Fist',
  'Left Pawn/Barrel': 'Left Pawn/Barrel',
  'Left Pawn/Kite': 'Left Pawn/Kite',
  'Left Pawn/Muffin': 'Left Pawn/Muffin',
  'Left Pawn/Shield': 'Left Pawn/Shield',
  'Left Pawn/Square': 'Left Pawn/Square',
  'Left Pawn/Left Fist': 'Left Pawn/Left Fist',
  'Left Pawn/Right Fist': 'Left Pawn/Right Fist',
  'Left Pawn/Left Pawn': 'Left Pawn/Left Pawn',
  'Left Pawn/Right Pawn': 'Left Pawn/Right Pawn',
  'Right Pawn/Barrel': 'Right Pawn/Barrel',
  'Right Pawn/Kite': 'Right Pawn/Kite',
  'Right Pawn/Muffin': 'Right Pawn/Muffin',
  'Right Pawn/Shield': 'Right Pawn/Shield',
  'Right Pawn/Square': 'Right Pawn/Square',
  'Right Pawn/Left Fist': 'Right Pawn/Left Fist',
  'Right Pawn/Right Fist': 'Right Pawn/Right Fist',
  'Right Pawn/Right Pawn': 'Right Pawn/Right Pawn',
};

// ── Mutable app state ───────────────────────────────────────────────────────
export let displayNames: Record<string, string> = {};
export const svgData: Record<string, string> = {};
export let homepageImageSettings: HomepageImageSettings = loadHomepageImageSettings();

export const learnedCases = new Set<string>();
export const learningCases = new Set<string>();
export const plannedCases = new Set<string>();
export const comments = new Map<string, string>();
export const plannedLevels = new Map<string, number>();
export const parityOrientations = new Map<string, number>();
export const perCaseSubtitles = new Map<string, string>();
export const customAlgorithms = new Map<string, { odd?: string[]; even?: string[] }>();
export const cachedParityAlgorithms = new Map<string, { odd: string[]; even: string[] }>();
export const algVariables = new Map<string, string>();

export let cornerStickerMode: CornerMode = 'counterclockwise';
export let evilnessFactor = false;
export let evilnessStringReturn = false;
export let evilnessMap: Record<string, boolean> = {};
export let showPaths = true;
export let enablePriorityLearning = true;
export let hideInstructions = false;
export let hideParenthesis = false;
export let algorithmFontSize = parseInt(localStorage.getItem('algorithmFontSize') || '', 10) || 14;
export let generalNotes = '';
export let enhancedAccess = localStorage.getItem('enhancedAccess') === 'true';
export let showHints =
  localStorage.getItem('showHints') !== null
    ? localStorage.getItem('showHints') === 'true'
    : true;
export let currentSortMode: SortMode =
  (localStorage.getItem('sortMode') as SortMode) || 'probability';
export let needsReorder = false;

export let colorScheme: ColorScheme = { ...DEFAULT_COLOR_SCHEME };
export let scrambleImageSize = 200;
export let profileName = localStorage.getItem('profileName') || 'Profile';
export let profileAvatar = localStorage.getItem('profileAvatar') || 'res/avatar.svg';
export let currentPreset = localStorage.getItem('currentPreset') || "Matt's_Preset";
export let presetData: Record<string, unknown> | null = null;

export const isFirstLoad = !localStorage.getItem('sq1-parity-progress');

// ── Shape index → case name lookup ──────────────────────────────────────────
function buildShapeIndexToCaseMap(): Record<number, string> {
  const map: Record<number, string> = {};
  for (const [caseName, idxStr] of Object.entries(shapeIndexMap)) {
    const idx = parseInt(String(idxStr), 10);
    map[idx] = caseName;
  }
  for (const entry of shapeIndex) {
    const allIndices = [...(entry.org || []), ...(entry.mir || [])];
    for (const idx of allIndices) {
      if (!map[idx]) map[idx] = entry.name;
    }
  }
  return map;
}

let _shapeIndexToCaseMap: Record<number, string> | null = null;
function getShapeIndexToCaseMap(): Record<number, string> {
  if (!_shapeIndexToCaseMap) _shapeIndexToCaseMap = buildShapeIndexToCaseMap();
  return _shapeIndexToCaseMap;
}

export function getCaseNameFromScramble(scramble: string): string | null {
  if (!scramble) return null;
  try {
    // Same double-inversion as legacy getCaseNameFromScramble: algToShapeIndex
    // inverts internally, so inverting first nets the position's shape.
    const setup = invertScramble(scramble);
    const result = algToShapeIndex(setup);
    const map = getShapeIndexToCaseMap();
    return map[result.shapeIndex] || null;
  } catch {
    return null;
  }
}

export function isCaseEvil(caseName: string): boolean {
  if (!evilnessFactor) return false;
  return evilnessMap[caseName] === true;
}

export function isScrambleEvil(scramble: string): boolean {
  if (!evilnessFactor) return false;
  const caseName = getCaseNameFromScramble(scramble);
  if (!caseName) return false;
  return isCaseEvil(caseName);
}

// ── Parity caching ──────────────────────────────────────────────────────────
let lastParityCalculationSettings: Record<string, unknown> | null = null;

export function calculateAndCacheAllParity(): void {
  lastParityCalculationSettings = {
    colorScheme: JSON.stringify(colorScheme),
    cornerStickerMode,
    customShapes: localStorage.getItem('customShapesForParityTracerLibrary'),
    customAlgorithms: JSON.stringify(Array.from(customAlgorithms.entries())),
  };

  for (const item of data) {
    const customAlgs = customAlgorithms.get(item.name);
    const oddAlgos = customAlgs && customAlgs.odd ? customAlgs.odd : item.odd || [];
    const evenAlgos = customAlgs && customAlgs.even ? customAlgs.even : item.even || [];
    const allAlgorithms = [...oddAlgos, ...evenAlgos];

    const dynamicOddAlgos: string[] = [];
    const dynamicEvenAlgos: string[] = [];

    for (const alg of allAlgorithms) {
      if (!alg || alg.trim() === '') continue;
      if (alg === 'Done!') {
        dynamicEvenAlgos.push(alg);
        continue;
      }
      try {
        const setup = invertScramble(alg);
        const parityText = getParityText(
          setup,
          {
            topColor: colorScheme.topColor,
            bottomColor: colorScheme.bottomColor,
            frontColor: colorScheme.frontColor,
            rightColor: colorScheme.rightColor,
            backColor: colorScheme.backColor,
            leftColor: colorScheme.leftColor,
          },
          cornerStickerMode,
        );
        if (parityText === 'Odd') {
          dynamicOddAlgos.push(alg);
        } else if (parityText === 'Even') {
          dynamicEvenAlgos.push(alg);
        }
      } catch (error) {
        console.error('Error testing algorithm:', alg, error);
      }
    }

    cachedParityAlgorithms.set(item.name, { odd: dynamicOddAlgos, even: dynamicEvenAlgos });
  }
}

export function needsParityRecalculation(): boolean {
  if (!lastParityCalculationSettings) return true;
  const current = {
    colorScheme: JSON.stringify(colorScheme),
    cornerStickerMode,
    customShapes: localStorage.getItem('customShapesForParityTracerLibrary'),
    customAlgorithms: JSON.stringify(Array.from(customAlgorithms.entries())),
  };
  return (
    current.colorScheme !== lastParityCalculationSettings.colorScheme ||
    current.cornerStickerMode !== lastParityCalculationSettings.cornerStickerMode ||
    current.customShapes !== lastParityCalculationSettings.customShapes ||
    current.customAlgorithms !== lastParityCalculationSettings.customAlgorithms
  );
}

/** Invalidate the parity cache and recalculate from scratch (legacy behavior). */
export function recalculateAllParity(): void {
  lastParityCalculationSettings = null;
  calculateAndCacheAllParity();
  notify();
}

// ── Persistence ─────────────────────────────────────────────────────────────
function mergeDisplayNames(source: Record<string, string>): void {
  displayNames = { ...source };
  for (const caseName in defaultDisplayNames) {
    if (!displayNames[caseName]) displayNames[caseName] = defaultDisplayNames[caseName];
  }
}

function ensureAllCasesHaveState(): void {
  data.forEach((item) => {
    if (
      !learnedCases.has(item.name) &&
      !learningCases.has(item.name) &&
      !plannedCases.has(item.name)
    ) {
      plannedCases.add(item.name);
      plannedLevels.set(item.name, 4);
    }
    if (!plannedLevels.has(item.name) && plannedCases.has(item.name)) {
      plannedLevels.set(item.name, 4);
    }
  });
}

export function initializeSVGData(): void {
  getHomepageShapeSVGs(homepageImageSettings, svgData);
}

export function saveState(): void {
  localStorage.setItem('sortMode', currentSortMode);
  localStorage.setItem('enhancedAccess', enhancedAccess.toString());
  localStorage.setItem('currentPreset', currentPreset);
  localStorage.setItem('evilnessFactor', evilnessFactor.toString());
  localStorage.setItem('evilnessStringReturn', evilnessStringReturn.toString());
  localStorage.setItem('evilnessMap', JSON.stringify(evilnessMap));
  try {
    localStorage.setItem(
      'sq1-parity-progress',
      JSON.stringify({
        learned: Array.from(learnedCases),
        learning: Array.from(learningCases),
        planned: Array.from(plannedCases),
        comments: Object.fromEntries(comments),
        plannedLevels: Object.fromEntries(plannedLevels),
        parityOrientations: Object.fromEntries(parityOrientations),
        showPaths: true,
        enablePriorityLearning: true,
        displayNames,
        hideInstructions,
        hideParenthesis,
        colorScheme,
        scrambleImageSize,
        customShapesForParityTracerLibrary: localStorage.getItem(
          'customShapesForParityTracerLibrary',
        ),
        perCaseSubtitles: Object.fromEntries(perCaseSubtitles),
        cornerStickerMode,
        customAlgorithms: Object.fromEntries(customAlgorithms),
        cachedParityAlgorithms: Object.fromEntries(cachedParityAlgorithms),
        lastParityCalculationSettings,
        generalNotes,
        algVariables: Object.fromEntries(algVariables),
        evilnessFactor,
        evilnessStringReturn,
        evilnessMap,
      }),
    );
  } catch (e) {
    console.error('Error saving state:', e);
  }
}

function loadSavedState(): void {
  try {
    const saved = localStorage.getItem('sq1-parity-progress');
    if (saved) {
      const state = JSON.parse(saved);
      learnedCases.clear();
      learningCases.clear();
      plannedCases.clear();
      comments.clear();
      plannedLevels.clear();
      parityOrientations.clear();
      perCaseSubtitles.clear();
      customAlgorithms.clear();
      cachedParityAlgorithms.clear();
      algVariables.clear();

      new Set<string>(state.learned || []).forEach((v) => learnedCases.add(v));
      new Set<string>(state.learning || []).forEach((v) => learningCases.add(v));
      new Set<string>(state.planned || []).forEach((v) => plannedCases.add(v));
      Object.entries(state.comments || {}).forEach(([k, v]) => comments.set(k, String(v)));
      Object.entries(state.plannedLevels || {}).forEach(([k, v]) => plannedLevels.set(k, Number(v)));
      Object.entries(state.parityOrientations || {}).forEach(([k, v]) =>
        parityOrientations.set(k, Number(v)),
      );
      showPaths = true;
      enablePriorityLearning = true;
      hideInstructions = !!state.hideInstructions;
      hideParenthesis = !!state.hideParenthesis;
      colorScheme = { ...DEFAULT_COLOR_SCHEME, ...(state.colorScheme || {}) };
      scrambleImageSize = state.scrambleImageSize || 200;
      if (state.customShapesForParityTracerLibrary) {
        localStorage.setItem(
          'customShapesForParityTracerLibrary',
          state.customShapesForParityTracerLibrary,
        );
      }
      Object.entries(state.perCaseSubtitles || {}).forEach(([k, v]) =>
        perCaseSubtitles.set(k, String(v)),
      );
      cornerStickerMode =
        (state.cornerStickerMode as CornerMode) || 'counterclockwise';
      Object.entries(state.customAlgorithms || {}).forEach(([k, v]) =>
        customAlgorithms.set(k, v as { odd?: string[]; even?: string[] }),
      );
      generalNotes = state.generalNotes || '';
      Object.entries(state.algVariables || {}).forEach(([k, v]) =>
        algVariables.set(k, String(v)),
      );

      if (state.displayNames) {
        mergeDisplayNames(state.displayNames);
      } else {
        displayNames = { ...defaultDisplayNames };
      }

      if (state.cachedParityAlgorithms) {
        cachedParityAlgorithms.clear();
        Object.entries(state.cachedParityAlgorithms).forEach(([k, v]) =>
          cachedParityAlgorithms.set(k, v as { odd: string[]; even: string[] }),
        );
      }
      if (state.lastParityCalculationSettings) {
        lastParityCalculationSettings = state.lastParityCalculationSettings as Record<
          string,
          unknown
        >;
      }
    }

    const enhancedAccessSaved = localStorage.getItem('enhancedAccess');
    if (enhancedAccessSaved !== null) {
      enhancedAccess = enhancedAccessSaved === 'true';
    }

    const storedEvilnessFactor = localStorage.getItem('evilnessFactor');
    if (storedEvilnessFactor !== null) {
      evilnessFactor = storedEvilnessFactor === 'true';
    }

    const storedEvilnessMap = localStorage.getItem('evilnessMap');
    if (storedEvilnessMap !== null) {
      try {
        evilnessMap = JSON.parse(storedEvilnessMap) as Record<string, boolean>;
      } catch {
        // ignore malformed stored map
      }
    }

    ensureAllCasesHaveState();
    saveState();
  } catch (e) {
    console.error('Error loading saved state:', e);
  }
}

if (isFirstLoad) {
  showHints = true;
  localStorage.setItem('showHints', 'true');
  showPaths = true;
  enablePriorityLearning = true;
  displayNames = { ...defaultDisplayNames };
  saveState();
}

loadSavedState();

// ── Presets ─────────────────────────────────────────────────────────────────
async function loadPresetData(presetName: string): Promise<Record<string, unknown> | null> {
  try {
    const presetPath = PRESET_CONFIG[presetName];
    if (!presetPath) {
      throw new Error(`Preset "${presetName}" not found in configuration`);
    }
    const response = await fetch(presetPath);
    if (!response.ok) throw new Error('Preset file not found');
    return await response.json();
  } catch (error) {
    console.error('Error loading preset:', error);
    return null;
  }
}

export function getPresetDefaults(): Record<string, unknown> | null {
  return presetData;
}

async function loadPresetAsDefaults(presetName: string): Promise<boolean> {
  const preset = await loadPresetData(presetName);
  if (!preset) return false;
  currentPreset = presetName;
  presetData = preset;
  localStorage.setItem('currentPreset', currentPreset);
  return true;
}

export async function initializePreset(): Promise<void> {
  const savedPreset = localStorage.getItem('currentPreset') || "Matt's_Preset";
  if (PRESET_CONFIG[savedPreset]) {
    await loadPresetAsDefaults(savedPreset);
  }
}

export async function applyPreset(
  presetName: string,
  _skipWarning = false,
  _silent = false,
  applyFull = false,
): Promise<void> {
  const preset = await loadPresetData(presetName);
  if (!preset) return;

  if (preset.displayNames) {
    displayNames = { ...(preset.displayNames as Record<string, string>) };
  }
  comments.clear();
  Object.entries((preset.comments as Record<string, string>) || {}).forEach(([k, v]) =>
    comments.set(k, String(v)),
  );
  colorScheme = { ...DEFAULT_COLOR_SCHEME, ...((preset.colorScheme as Partial<ColorScheme>) || {}) };

  if (preset.customShapesForParityTracerLibrary) {
    localStorage.setItem(
      'customShapesForParityTracerLibrary',
      String(preset.customShapesForParityTracerLibrary),
    );
  }

  perCaseSubtitles.clear();
  Object.entries((preset.perCaseSubtitles as Record<string, string>) || {}).forEach(([k, v]) =>
    perCaseSubtitles.set(k, String(v)),
  );
  cornerStickerMode = (preset.cornerStickerMode as CornerMode) || 'counterclockwise';

  customAlgorithms.clear();
  Object.entries((preset.customAlgorithms as Record<string, { odd?: string[]; even?: string[] }>) || {})
    .forEach(([k, v]) => customAlgorithms.set(k, v));

  if (preset.evilnessMap !== undefined) evilnessMap = preset.evilnessMap as Record<string, boolean>;
  if (preset.evilnessFactor !== undefined) evilnessFactor = Boolean(preset.evilnessFactor);
  if (preset.evilnessStringReturn !== undefined)
    evilnessStringReturn = Boolean(preset.evilnessStringReturn);

  parityOrientations.clear();
  Object.entries((preset.parityOrientations as Record<string, number>) || {}).forEach(([k, v]) =>
    parityOrientations.set(k, Number(v)),
  );
  generalNotes = (preset.generalNotes as string) || '';

  if (applyFull) {
    if (preset.scrambleImageSize != null) scrambleImageSize = Number(preset.scrambleImageSize);
    if (preset.hideInstructions !== undefined) hideInstructions = Boolean(preset.hideInstructions);
    if (preset.showHints !== undefined) {
      showHints = Boolean(preset.showHints);
      localStorage.setItem('showHints', showHints.toString());
    }
    if (preset.profileName) {
      profileName = String(preset.profileName);
      localStorage.setItem('profileName', profileName);
    }
    if (preset.profileAvatar) {
      profileAvatar = String(preset.profileAvatar);
      localStorage.setItem('profileAvatar', profileAvatar);
    }
    const personalLsKeys = [
      'parityTracerImageSize',
      'parityTracerShowArrow',
      'parityTracerArrowSettings',
      'trainingScrambleImageSize',
      'trainingScrambleTextSize',
      'trainingHoldToStart',
      'trainingTimerSize',
      'trainingShowPrevScramble',
    ];
    for (const k of personalLsKeys) {
      if ((preset as Record<string, unknown>)[k] != null) {
        localStorage.setItem(k, String((preset as Record<string, unknown>)[k]));
      }
    }
  }

  currentPreset = presetName;
  presetData = preset;
  lastParityCalculationSettings = null;
  saveState();
  notify();
  updateProgress();

  if (needsParityRecalculation()) {
    calculateAndCacheAllParity();
  }
}

// ── Export / Import ─────────────────────────────────────────────────────────
export function exportData(): void {
  const state: Record<string, unknown> = {
    learned: Array.from(learnedCases),
    learning: Array.from(learningCases),
    planned: Array.from(plannedCases),
    comments: Object.fromEntries(comments),
    plannedLevels: Object.fromEntries(plannedLevels),
    parityOrientations: Object.fromEntries(parityOrientations),
    showPaths: true,
    displayNames,
    showHints,
    hideInstructions,
    hideParenthesis,
    colorScheme,
    scrambleImageSize,
    customShapesForParityTracerLibrary: localStorage.getItem(
      'customShapesForParityTracerLibrary',
    ),
    perCaseSubtitles: Object.fromEntries(perCaseSubtitles),
    cachedParityAlgorithms: Object.fromEntries(cachedParityAlgorithms),
    lastParityCalculationSettings,
    cornerStickerMode,
    customAlgorithms: Object.fromEntries(customAlgorithms),
    generalNotes,
    algVariables: Object.fromEntries(algVariables),
    evilnessFactor,
    evilnessStringReturn,
    evilnessMap,
    parityTracerImageSize: localStorage.getItem('parityTracerImageSize'),
    parityTracerShowArrow: localStorage.getItem('parityTracerShowArrow'),
    parityTracerArrowSettings: localStorage.getItem('parityTracerArrowSettings'),
    trainingScrambleImageSize: localStorage.getItem('trainingScrambleImageSize'),
    trainingScrambleTextSize: localStorage.getItem('trainingScrambleTextSize'),
    trainingHoldToStart: localStorage.getItem('trainingHoldToStart'),
    trainingTimerSize: localStorage.getItem('trainingTimerSize'),
    trainingShowPrevScramble: localStorage.getItem('trainingShowPrevScramble'),
    profileName,
    profileAvatar,
  };
  if (typeof (window as unknown as { selectorExportHook?: (s: Record<string, unknown>) => void })
    .selectorExportHook === 'function') {
    (window as unknown as { selectorExportHook: (s: Record<string, unknown>) => void })
      .selectorExportHook(state);
  }
  const dataStr = JSON.stringify(state, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'squango-CSP.json';
  link.click();
  URL.revokeObjectURL(url);
}

export function importData(jsonStr: string): void {
  try {
    const state = JSON.parse(jsonStr);

    if (state.customShapesForParityTracerLibrary) {
      localStorage.setItem(
        'customShapesForParityTracerLibrary',
        state.customShapesForParityTracerLibrary,
      );
    }

    learnedCases.clear();
    learningCases.clear();
    plannedCases.clear();
    comments.clear();
    plannedLevels.clear();
    parityOrientations.clear();
    perCaseSubtitles.clear();
    customAlgorithms.clear();
    cachedParityAlgorithms.clear();
    algVariables.clear();

    new Set<string>(state.learned || []).forEach((v) => learnedCases.add(v));
    new Set<string>(state.learning || []).forEach((v) => learningCases.add(v));
    new Set<string>(state.planned || []).forEach((v) => plannedCases.add(v));
    Object.entries(state.comments || {}).forEach(([k, v]) => comments.set(k, String(v)));
    Object.entries(state.plannedLevels || {}).forEach(([k, v]) => plannedLevels.set(k, Number(v)));
    Object.entries(state.parityOrientations || {}).forEach(([k, v]) =>
      parityOrientations.set(k, Number(v)),
    );
    showPaths = true;

    if (state.displayNames) {
      mergeDisplayNames(state.displayNames);
    } else {
      displayNames = { ...defaultDisplayNames };
    }
    hideInstructions = !!state.hideInstructions;
    hideParenthesis = !!state.hideParenthesis;
    colorScheme = { ...DEFAULT_COLOR_SCHEME, ...(state.colorScheme || {}) };
    if (state.customShapesForParityTracerLibrary) {
      localStorage.setItem(
        'customShapesForParityTracerLibrary',
        state.customShapesForParityTracerLibrary,
      );
    }
    Object.entries(state.perCaseSubtitles || {}).forEach(([k, v]) =>
      perCaseSubtitles.set(k, String(v)),
    );
    cornerStickerMode = (state.cornerStickerMode as CornerMode) || 'counterclockwise';
    Object.entries(state.customAlgorithms || {}).forEach(([k, v]) =>
      customAlgorithms.set(k, v as { odd?: string[]; even?: string[] }),
    );
    generalNotes = state.generalNotes || '';
    Object.entries(state.algVariables || {}).forEach(([k, v]) =>
      algVariables.set(k, String(v)),
    );

    if (state.evilnessFactor !== undefined) evilnessFactor = Boolean(state.evilnessFactor);
    if (state.evilnessStringReturn !== undefined)
      evilnessStringReturn = Boolean(state.evilnessStringReturn);
    if (state.evilnessMap !== undefined) evilnessMap = state.evilnessMap as Record<string, boolean>;

    if (state.cachedParityAlgorithms) {
      cachedParityAlgorithms.clear();
      Object.entries(state.cachedParityAlgorithms).forEach(([k, v]) =>
        cachedParityAlgorithms.set(k, v as { odd: string[]; even: string[] }),
      );
    }
    if (state.lastParityCalculationSettings) {
      lastParityCalculationSettings = state.lastParityCalculationSettings as Record<
        string,
        unknown
      >;
    }

    generalNotes = state.generalNotes || '';
    algVariables.clear();
    Object.entries(state.algVariables || {}).forEach(([k, v]) => algVariables.set(k, String(v)));

    if (state.evilnessFactor !== undefined) evilnessFactor = Boolean(state.evilnessFactor);
    if (state.evilnessStringReturn !== undefined)
      evilnessStringReturn = Boolean(state.evilnessStringReturn);
    if (state.evilnessMap !== undefined) evilnessMap = state.evilnessMap as Record<string, boolean>;

    if (typeof (window as unknown as { selectorImportHook?: (s: Record<string, unknown>) => void })
      .selectorImportHook === 'function') {
      (window as unknown as { selectorImportHook: (s: Record<string, unknown>) => void })
        .selectorImportHook(state);
    }

    lastParityCalculationSettings = null;

    if (state.showHints !== undefined) {
      showHints = Boolean(state.showHints);
      localStorage.setItem('showHints', showHints.toString());
    }
    if (state.customShapesForParityTracerLibrary) {
      localStorage.setItem(
        'customShapesForParityTracerLibrary',
        state.customShapesForParityTracerLibrary,
      );
    }
    if (state.parityTracerImageSize) localStorage.setItem('parityTracerImageSize', state.parityTracerImageSize);
    if (state.parityTracerShowArrow !== undefined)
      localStorage.setItem('parityTracerShowArrow', String(state.parityTracerShowArrow));
    if (state.parityTracerArrowSettings)
      localStorage.setItem('parityTracerArrowSettings', state.parityTracerArrowSettings);
    if (state.trainingScrambleImageSize)
      localStorage.setItem('trainingScrambleImageSize', state.trainingScrambleImageSize);
    if (state.trainingScrambleTextSize)
      localStorage.setItem('trainingScrambleTextSize', state.trainingScrambleTextSize);
    if (state.trainingHoldToStart)
      localStorage.setItem('trainingHoldToStart', state.trainingHoldToStart);
    if (state.profileName) {
      profileName = String(state.profileName);
      localStorage.setItem('profileName', profileName);
    }
    if (state.profileAvatar) {
      profileAvatar = String(state.profileAvatar);
      localStorage.setItem('profileAvatar', profileAvatar);
    }
    if (state.trainingTimerSize) localStorage.setItem('trainingTimerSize', state.trainingTimerSize);
    if (state.trainingShowPrevScramble !== undefined)
      localStorage.setItem('trainingShowPrevScramble', String(state.trainingShowPrevScramble));

    saveState();
    notify();
    updateProgress();

    if (needsParityRecalculation()) {
      calculateAndCacheAllParity();
    }
  } catch (e) {
    console.error('Error importing data:', e);
    throw e;
  }
}

export function handleFileImport(file: File): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    importData(String(e.target?.result));
  };
  reader.readAsText(file);
}

// ── Progress ────────────────────────────────────────────────────────────────
export interface ProgressStats {
  totalCases: number;
  learnedCount: number;
  p: number;
  c: number;
  safety: number;
}

export function updateProgress(): ProgressStats {
  const totalCases = data.length;
  const learnedCount = learnedCases.size;

  const totalProbability = data.reduce((sum, item) => sum + item.probability, 0);
  const learnedProbability = data
    .filter((item) => learnedCases.has(item.name))
    .reduce((sum, item) => sum + item.probability, 0);

  const p = Math.round((learnedProbability / totalProbability) * 100 * 2) / 2;
  const x = learnedCount;

  const exp = Math.exp;
  const numerator =
    1 / (1 + exp(-12 * ((x - 1) / 89 - 0.4170435672))) -
    1 / (1 + exp(-12 * (0 - 0.4170435672)));
  const denominator =
    1 / (1 + exp(-12 * (1 - 0.4170435672))) - 1 / (1 + exp(-12 * (0 - 0.4170435672)));
  const c = 80 + 14 * (numerator / denominator);

  const safety = (p * c) / 100 + 0.5 * (100 - p);

  const stats = { totalCases, learnedCount, p, c, safety };
  return stats;
}

// ── Learning-state mutations ────────────────────────────────────────────────
export function toggleLearned(name: string, rightClick = false): void {
  if (rightClick) {
    if (learnedCases.has(name)) {
      learnedCases.delete(name);
      learningCases.add(name);
      plannedCases.delete(name);
    } else if (learningCases.has(name)) {
      learningCases.delete(name);
      plannedCases.add(name);
      if (!plannedLevels.has(name)) plannedLevels.set(name, 4);
    } else {
      learnedCases.add(name);
      learningCases.delete(name);
      plannedCases.delete(name);
    }
  } else {
    if (learnedCases.has(name)) {
      learnedCases.delete(name);
      learningCases.delete(name);
      plannedCases.add(name);
      if (!plannedLevels.has(name)) plannedLevels.set(name, 4);
    } else if (learningCases.has(name)) {
      learningCases.delete(name);
      learnedCases.add(name);
      plannedCases.delete(name);
    } else {
      learningCases.add(name);
      plannedCases.delete(name);
    }
  }
  saveState();
  updateProgress();
  notify();
}

export function adjustPriority(name: string, delta: number): number {
  if (!plannedCases.has(name)) {
    plannedCases.add(name);
    learnedCases.delete(name);
    learningCases.delete(name);
  }

  const currentLevel = plannedLevels.get(name) || 4;
  let newLevel = currentLevel + delta;
  if (newLevel < 1) newLevel = 1;
  if (newLevel > 7) newLevel = 7;

  plannedLevels.set(name, newLevel);
  saveState();
  updateProgress();
  notify();
  return newLevel;
}

export function setPlannedLevel(name: string, level: number): void {
  plannedLevels.set(name, level);
  saveState();
  updateProgress();
  notify();
}

// ── Display names & misc helpers ────────────────────────────────────────────
export function getDisplayName(caseName: string): string {
  return displayNames[caseName] || caseName;
}

export function getDefaultDisplayName(caseName: string): string {
  return defaultDisplayNames[caseName] || caseName;
}

export function getShortDisplayName(fullName: string): string {
  let shortName = fullName;
  const replacements: Record<string, string> = {
    'Paired Edges': 'Pair',
    'Perpendicular Edges': 'L',
    'L-Shape': 'L',
    'Parallel Edges': 'Line',
    Square: 'Sq',
    Muffin: 'Muff',
    Barrel: 'Barr',
    Scallop: 'Scal',
    Left: 'L.',
    Right: 'R.',
  };
  for (const [pattern, replacement] of Object.entries(replacements)) {
    const regex = new RegExp(pattern, 'gi');
    shortName = shortName.replace(regex, replacement);
  }
  shortName = shortName.replace(/(\d)-(\d)/g, '$1$2');
  return shortName;
}

export function getAliases(caseName: string): string[] {
  const displayName = getDisplayName(caseName);
  const aliases = [caseName.toLowerCase(), displayName.toLowerCase()];

  if (displayName.includes('/')) {
    const parts = displayName.split('/');
    aliases.push(...parts.map((p) => p.trim().toLowerCase()));
  }

  aliases.push(displayName.replace(/-/g, '').toLowerCase());
  aliases.push(caseName.replace(/-/g, '').toLowerCase());

  const variations: Record<string, string[]> = {
    perpendicular: ['l-shape', 'l shape', 'arrow'],
    'l-shape': ['perpendicular', 'arrow'],
    parallel: ['line', 'crown'],
    line: ['parallel', 'crown'],
    paired: ['pair'],
    pair: ['paired'],
    muffin: ['mushroom'],
    mushroom: ['muffin'],
  };

  for (const [key, alts] of Object.entries(variations)) {
    if (displayName.toLowerCase().includes(key)) {
      aliases.push(...alts);
    }
  }

  return [...new Set(aliases)];
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

// ── Setters (persist + notify) ──────────────────────────────────────────────
export function setSortMode(mode: SortMode): void {
  currentSortMode = mode;
  localStorage.setItem('sortMode', mode);
}

export function setCornerStickerMode(mode: CornerMode): void {
  cornerStickerMode = mode;
  saveState();
  notify();
}

export function setColorScheme(scheme: Partial<ColorScheme>): void {
  colorScheme = { ...colorScheme, ...scheme };
  saveState();
  notify();
}

export function setEvilnessFactor(value: boolean): void {
  evilnessFactor = value;
  saveState();
  notify();
}

export function setEvilnessStringReturn(value: boolean): void {
  evilnessStringReturn = value;
  saveState();
  notify();
}

export function setEvilnessMap(map: Record<string, boolean>): void {
  evilnessMap = map;
  saveState();
  notify();
}

export function setHideInstructions(value: boolean): void {
  hideInstructions = value;
  saveState();
  notify();
}

export function setHideParenthesis(value: boolean): void {
  hideParenthesis = value;
  saveState();
  notify();
}

export function setShowHints(value: boolean): void {
  showHints = value;
  localStorage.setItem('showHints', value.toString());
  notify();
}

export function setEnhancedAccess(value: boolean): void {
  enhancedAccess = value;
  localStorage.setItem('enhancedAccess', value.toString());
}

export function setAlgorithmFontSize(value: number): void {
  algorithmFontSize = value;
  localStorage.setItem('algorithmFontSize', value.toString());
  notify();
}

export function setScrambleImageSize(value: number): void {
  scrambleImageSize = value;
  saveState();
  notify();
}

export function setGeneralNotes(value: string): void {
  generalNotes = value;
  saveState();
  notify();
}

export function setProfile(name: string, avatar: string): void {
  profileName = name;
  profileAvatar = avatar;
  localStorage.setItem('profileName', name);
  localStorage.setItem('profileAvatar', avatar);
  notify();
}

export function setComment(name: string, text: string): void {
  comments.set(name, text);
  saveState();
  notify();
}

export function setSubtitle(name: string, text: string): void {
  perCaseSubtitles.set(name, text);
  saveState();
  notify();
}

export function setCustomAlgorithms(name: string, value: { odd?: string[]; even?: string[] }): void {
  customAlgorithms.set(name, value);
  saveState();
  notify();
}

export function setAlgVariable(key: string, value: string): void {
  algVariables.set(key, value);
  saveState();
  notify();
}

export function toggleTheme(isDark: boolean): void {
  const next = isDark ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('sqg-csp-theme', next);
  regenerateHomepageSVGs();
  notify();
}

export function getHomepageImageSettings(): HomepageImageSettings {
  return homepageImageSettings;
}

let homepageRegenTimer: ReturnType<typeof setTimeout> | null = null;

function regenerateHomepageSVGs(): void {
  if (homepageRegenTimer) clearTimeout(homepageRegenTimer);
  homepageRegenTimer = setTimeout(() => {
    homepageRegenTimer = null;
    getHomepageShapeSVGs(homepageImageSettings, svgData);
    applyHomepageSVGsLive(svgData);
    saveState();
    notify();
  }, 250);
}

export function updateHomepageImageSettings(patch: Partial<HomepageImageSettings>): void {
  homepageImageSettings = { ...homepageImageSettings, ...patch };
  saveHomepageImageSettings(homepageImageSettings);
  regenerateHomepageSVGs();
  notify();
}

export function resetHomepageImageSettingsState(): HomepageImageSettings {
  homepageImageSettings = resetHomepageImageSettingsDefaults();
  regenerateHomepageSVGs();
  notify();
  return homepageImageSettings;
}

export function getNeedsReorder(): boolean {
  return needsReorder;
}

export function setNeedsReorder(value: boolean): void {
  needsReorder = value;
  notify();
}

export function getPlannedLevel(caseName: string): number {
  return plannedLevels.get(caseName) || 4;
}
