/* ==== FILE: js/restoftheapp.js ==== */
/* exported filteredData algorithmFontSize getCaseNameFromScramble isCaseEvil initializeSVGData getPresetDefaults handleFileImport searchInput sortSelect learnFilterSelect grid initializeDOMReferences getPlannedPriorityLevel getPriorityVisualLevel setCasePriorityLevel isCaseLearned isCaseLearning isCasePlanned getPrioritySortValue */

﻿// Modular preset configuration - add new presets here
import { data } from '../database/algs.js?v=esm-20260511-2';
import { shapeIndex, shapeIndexMap } from '../database/shapeIndex.js?v=esm-20260511-2';
import { CSPData } from './data-store.js?v=esm-20260511-2';
import { invertScramble } from './utils.js?v=esm-20260511-2';
import { algToShapeIndex } from './tools/alg_to_index.js?v=esm-20260511-2';
import { caleTracer, ParityTracerLibrary } from './tools/cales-parity-tracer.js?v=esm-20260511-2';

window.PRESET_CONFIG = {
    'Default_Preset': 'presets/Default_Preset.json',
    'Matt\'s_Preset': 'presets/Matt\'s_Preset.json'
    // Add more presets here:
    // 'Preset_Name': 'presets/preset_file.json',
};

// Default display names for all 90 cases (used for fresh installs)
export const defaultDisplayNames = {
    "8/Star": "8/Star",
    "7-1/Star": "7-1/Star",
    "6-2/Star": "6-2/Star",
    "5-3/Star": "5-3/Star",
    "4-4/Star": "4-4/Star",
    "2-2-2/Paired Edges": "2-2-2/Pair",
    "2-2-2/Parallel Edges": "2-2-2/Line",
    "2-2-2/Perpendicular Edges": "2-2-2/L",
    "3-1-2/Paired Edges": "3-1-2/Pair",
    "3-1-2/Parallel Edges": "3-1-2/Line",
    "3-1-2/Perpendicular Edges": "3-1-2/L",
    "3-2-1/Paired Edges": "3-2-1/Pair",
    "3-2-1/Parallel Edges": "3-2-1/Line",
    "3-2-1/Perpendicular Edges": "3-2-1/L",
    "3-3/Paired Edges": "3-3/Pair",
    "3-3/Parallel Edges": "3-3/Line",
    "3-3/Perpendicular Edges": "3-3/L",
    "4-1-1/Paired Edges": "4-1-1/Pair",
    "4-1-1/Parallel Edges": "4-1-1/Line",
    "4-1-1/Perpendicular Edges": "4-1-1/L",
    "Left 4-2/Paired Edges": "Left 4-2/Pair",
    "Left 4-2/Parallel Edges": "Left 4-2/Line",
    "Left 4-2/Perpendicular Edges": "Left 4-2/L",
    "Right 4-2/Paired Edges": "Right 4-2/Pair",
    "Right 4-2/Parallel Edges": "Right 4-2/Line",
    "Right 4-2/Perpendicular Edges": "Right 4-2/L",
    "Left 5-1/Paired Edges": "Left 5-1/Pair",
    "Left 5-1/Parallel Edges": "Left 5-1/Line",
    "Left 5-1/Perpendicular Edges": "Left 5-1/L",
    "Right 5-1/Paired Edges": "Right 5-1/Pair",
    "Right 5-1/Parallel Edges": "Right 5-1/Line",
    "Right 5-1/Perpendicular Edges": "Right 5-1/L",
    "6/Paired Edges": "6/Pair",
    "6/Parallel Edges": "6/Line",
    "6/Perpendicular Edges": "6/L",
    "Barrel/Barrel": "Barrel/Barrel",
    "Barrel/Square": "Barrel/Square",
    "Barrel/Left Fist": "Barrel/Left Fist",
    "Barrel/Right Fist": "Barrel/Right Fist",
    "Kite/Barrel": "Kite/Barrel",
    "Kite/Kite": "Kite/Kite",
    "Kite/Square": "kite/Square",
    "Kite/Left Fist": "Kite/Left Fist",
    "Kite/Right Fist": "Kite/Right Fist",
    "Muffin/Barrel": "Muffin/Barrel",
    "Muffin/Kite": "Muffin/Kite",
    "Muffin/Muffin": "Muffin/Muffin",
    "Muffin/Square": "Muffin/Square",
    "Muffin/Left Fist": "Muffin/Left Fist",
    "Muffin/Right Fist": "Muffin/Right Fist",
    "Shield/Barrel": "Shield/Barrel",
    "Shield/Kite": "Shield/Kite",
    "Shield/Muffin": "Shield/Muffin",
    "Shield/Shield": "Shield/Shield",
    "Shield/Square": "Shield/Square",
    "Shield/Left Fist": "Shield/Left Fist",
    "Shield/Right Fist": "Shield/Right Fist",
    "Scallop/Barrel": "Scallop/Barrel",
    "Scallop/Kite": "Scallop/Kite",
    "Scallop/Muffin": "Scallop/Muffin",
    "Scallop/Shield": "Scallop/Shield",
    "Scallop/Scallop": "Scallop/Scallop",
    "Scallop/Square": "Scallop/Square",
    "Scallop/Left Fist": "Scallop/Left Fist",
    "Scallop/Right Fist": "Scallop/Right Fist",
    "Scallop/Left Pawn": "Scallop/Left Pawn",
    "Scallop/Right Pawn": "Scallop/Right Pawn",
    "Square/Square": "Square/Square",
    "Left Fist/Square": "Left Fist/Square",
    "Left Fist/Left Fist": "Left Fist/Left Fist",
    "Left Fist/Right Fist": "Left Fist/Right Fist",
    "Right Fist/Square": "Right Fist/Square",
    "Right Fist/Right Fist": "Right Fist/Right Fist",
    "Left Pawn/Barrel": "Left Pawn/Barrel",
    "Left Pawn/Kite": "Left Pawn/Kite",
    "Left Pawn/Muffin": "Left Pawn/Muffin",
    "Left Pawn/Shield": "Left Pawn/Shield",
    "Left Pawn/Square": "Left Pawn/Square",
    "Left Pawn/Left Fist": "Left Pawn/Left Fist",
    "Left Pawn/Right Fist": "Left Pawn/Right Fist",
    "Left Pawn/Left Pawn": "Left Pawn/Left Pawn",
    "Left Pawn/Right Pawn": "Left Pawn/Right Pawn",
    "Right Pawn/Barrel": "Right Pawn/Barrel",
    "Right Pawn/Kite": "Right Pawn/Kite",
    "Right Pawn/Muffin": "Right Pawn/Muffin",
    "Right Pawn/Shield": "Right Pawn/Shield",
    "Right Pawn/Square": "Right Pawn/Square",
    "Right Pawn/Left Fist": "Right Pawn/Left Fist",
    "Right Pawn/Right Fist": "Right Pawn/Right Fist",
    "Right Pawn/Right Pawn": "Right Pawn/Right Pawn",
};

// Display names - THE single source of truth (initialized from defaults or loaded from save)
export let displayNames = {};

export let filteredData = [...data];
export let comments = new Map(); // stores {caseName: "comment text"}
export let plannedLevels = new Map(); // stores {caseName: 0 learned, 1-7 planned priority, 8 learning}
export let parityOrientations = new Map(); // stores {shapePattern: rotationAmount}
export let cornerStickerMode = 'counterclockwise'; // 'counterclockwise' or 'clockwise'
export let evilnessFactor = false; // Toggle evilness factor on/off
export let evilnessStringReturn = false; // Toggle if string return uses evilness
export let evilnessMap = {}; // {caseName: boolean} - true = evil

// Global function to set corner sticker mode
window.setCornerStickerMode = function (mode) {
    cornerStickerMode = mode;
    markParityAlgorithmsDirty();
    saveState();
};
export let customAlgorithms = new Map(); // stores {caseName: [algorithm, ...]}
// svgData is now the source of truth, initialized from DEFAULT_SVGS in svg.js
export let parityAlgorithmsByCase = new Map(); // runtime-only {caseName: {odd: [...], even: [...]}}
export let parityAlgorithmsDirty = true;

export let perCaseSubtitles = new Map(); // Stores {caseName: "Subtitle"}
export let hideInstructions = false; // Toggle for hiding instruction buttons
export let hideParenthesis = false; // Toggle for hiding parenthesis in algorithms
export let algorithmFontSize = parseInt(localStorage.getItem('algorithmFontSize')) || 14; // Default 14px, stored in localStorage only
export let generalNotes = ''; // HTML content for general notes
export let algVariables = new Map();
window.enhancedAccess = localStorage.getItem('enhancedAccess') === 'true'; // Toggle for enhanced access (not exported)
export let showHints = localStorage.getItem('showHints') !== null ? localStorage.getItem('showHints') === 'true' : true; // Default to true
export let currentSortMode = localStorage.getItem('sortMode') || 'probability';
export let colorScheme = {
    topColor: '#000000',
    bottomColor: '#FFFFFF',
    frontColor: '#CC0000',
    rightColor: '#00AA00',
    backColor: '#FF8C00',
    leftColor: '#0066CC',
    dividerColor: '#7a0000',
    circleColor: 'transparent'
};

export const LEARNED_PRIORITY_LEVEL = 0;
export const MIN_PLANNED_PRIORITY_LEVEL = 1;
export const DEFAULT_PRIORITY_LEVEL = 4;
export const MAX_PLANNED_PRIORITY_LEVEL = 7;
export const LEARNING_PRIORITY_LEVEL = 8;

export function normalizePriorityLevel(level, fallback = DEFAULT_PRIORITY_LEVEL) {
    const parsed = Number(level);
    if (!Number.isFinite(parsed)) return fallback;
    const rounded = Math.round(parsed);
    if (rounded < LEARNED_PRIORITY_LEVEL) return LEARNED_PRIORITY_LEVEL;
    if (rounded > LEARNING_PRIORITY_LEVEL) return LEARNING_PRIORITY_LEVEL;
    return rounded;
}

export function getCasePriorityLevel(caseName) {
    if (!plannedLevels.has(caseName)) return DEFAULT_PRIORITY_LEVEL;
    return normalizePriorityLevel(plannedLevels.get(caseName));
}

export function getPlannedPriorityLevel(caseName) {
    const level = getCasePriorityLevel(caseName);
    return (level >= MIN_PLANNED_PRIORITY_LEVEL && level <= MAX_PLANNED_PRIORITY_LEVEL)
        ? level
        : DEFAULT_PRIORITY_LEVEL;
}

export function getPriorityVisualLevel(caseName) {
    return (MAX_PLANNED_PRIORITY_LEVEL + MIN_PLANNED_PRIORITY_LEVEL) - getPlannedPriorityLevel(caseName);
}

export function setCasePriorityLevel(caseName, level) {
    plannedLevels.set(caseName, normalizePriorityLevel(level));
}

export function isCaseLearned(caseName) {
    return getCasePriorityLevel(caseName) === LEARNED_PRIORITY_LEVEL;
}

export function isCaseLearning(caseName) {
    return getCasePriorityLevel(caseName) === LEARNING_PRIORITY_LEVEL;
}

export function isCasePlanned(caseName) {
    const level = getCasePriorityLevel(caseName);
    return level >= MIN_PLANNED_PRIORITY_LEVEL && level <= MAX_PLANNED_PRIORITY_LEVEL;
}

export function getPrioritySortValue(caseName) {
    return getCasePriorityLevel(caseName);
}

export function normalizeAlgorithmList(rawAlgorithms) {
    let algorithms = rawAlgorithms;
    if (typeof algorithms === 'string') {
        try {
            algorithms = JSON.parse(algorithms);
        } catch {
            return [algorithms].filter(alg => alg.trim());
        }
    }

    if (Array.isArray(algorithms)) {
        return algorithms
            .filter(alg => typeof alg === 'string')
            .map(alg => alg.trim())
            .filter(Boolean);
    }

    if (algorithms && typeof algorithms === 'object') {
        return [
            ...normalizeAlgorithmList(algorithms.odd || []),
            ...normalizeAlgorithmList(algorithms.even || [])
        ];
    }

    return [];
}

export function parseLegacyAlgorithmSnapshot(rawSnapshot) {
    if (!rawSnapshot) return undefined;
    if (typeof rawSnapshot !== 'string') return rawSnapshot;
    try {
        return Object.fromEntries(JSON.parse(rawSnapshot));
    } catch {
        return undefined;
    }
}

export function hydrateCustomAlgorithms(rawAlgorithms, legacySnapshot) {
    const source = rawAlgorithms || parseLegacyAlgorithmSnapshot(legacySnapshot) || {};
    const hydrated = new Map();

    for (const [caseName, algorithms] of Object.entries(source)) {
        const normalized = normalizeAlgorithmList(algorithms);
        if (normalized.length > 0) hydrated.set(caseName, normalized);
    }

    customAlgorithms = hydrated;
    markParityAlgorithmsDirty();
}

export function getCaseAlgorithmList(itemOrCaseName) {
    const caseName = typeof itemOrCaseName === 'string' ? itemOrCaseName : itemOrCaseName.name;
    const item = typeof itemOrCaseName === 'string'
        ? CSPData.getCase(caseName)
        : itemOrCaseName;

    if (customAlgorithms.has(caseName)) return [...customAlgorithms.get(caseName)];
    if (!item) return [];
    return normalizeAlgorithmList([...(item.odd || []), ...(item.even || [])]);
}

export function getParityAlgorithmsForCase(caseName) {
    if (parityAlgorithmsDirty) calculateAndCacheAllParity();
    return parityAlgorithmsByCase.get(caseName) || { odd: [], even: [] };
}

export function markParityAlgorithmsDirty() {
    parityAlgorithmsDirty = true;
}

export function ensurePriorityLevelsForAllCases() {
    const validCaseNames = new Set(data.map(item => item.name));
    plannedLevels = new Map(
        [...plannedLevels.entries()]
            .filter(([caseName]) => validCaseNames.has(caseName))
            .map(([caseName, level]) => [caseName, normalizePriorityLevel(level)])
    );

    for (const item of data) {
        if (!plannedLevels.has(item.name)) {
            plannedLevels.set(item.name, DEFAULT_PRIORITY_LEVEL);
        }
    }
}

export function hydratePriorityLevels(state = {}) {
    const levels = new Map();
    if (state.plannedLevels && typeof state.plannedLevels === 'object') {
        for (const [caseName, level] of Object.entries(state.plannedLevels)) {
            levels.set(caseName, normalizePriorityLevel(level));
        }
    }

    // Legacy migration: old progress arrays become priority levels.
    for (const caseName of state.planned || []) {
        if (!levels.has(caseName)) levels.set(caseName, DEFAULT_PRIORITY_LEVEL);
    }
    for (const caseName of state.learned || []) {
        levels.set(caseName, LEARNED_PRIORITY_LEVEL);
    }
    for (const caseName of state.learning || []) {
        levels.set(caseName, LEARNING_PRIORITY_LEVEL);
    }

    plannedLevels = levels;
    ensurePriorityLevelsForAllCases();
}

window.SQG = window.SQG || {};
window.SQG.progress = Object.freeze({
    getPriorityLevel: getCasePriorityLevel,
    getPlannedPriorityLevel,
    getPriorityVisualLevel,
    setPriorityLevel: setCasePriorityLevel,
    isLearned: isCaseLearned,
    isLearning: isCaseLearning,
    isPlanned: isCasePlanned,
    getSortValue: getPrioritySortValue
});

window.SQG.algorithms = Object.freeze({
    getCaseAlgorithmList,
    getParityAlgorithmsForCase,
    markParityAlgorithmsDirty
});

export let scrambleImageSize = 200; // Default size
export let profileName = localStorage.getItem('profileName') || 'Profile';
export let profileAvatar = localStorage.getItem('profileAvatar') || 'res/avatar.svg';
export let currentPreset = localStorage.getItem('currentPreset') || 'Default_Preset';
export let presetData = null; // Will store loaded preset data

// Check if this is first load BEFORE loading state
export const isFirstLoad = !localStorage.getItem('sq1-parity-progress');

// If first load, we'll apply default preset after initialization

// Function to calculate and cache parity for all cases
export function calculateAndCacheAllParity() {

    if (!caleTracer) {
        console.warn('Parity analyzer not available, skipping parity calculation');
        return;
    }

    const calculated = new Map();

    for (const item of data) {
        const allAlgorithms = getCaseAlgorithmList(item);

        let dynamicOddAlgs = [];
        let dynamicEvenAlgs = [];

        for (const alg of allAlgorithms) {
            if (!alg || alg.trim() === '') continue;

            if (alg === 'Done!') {
                dynamicEvenAlgs.push(alg);
                continue;
            }

            try {
                const setup = invertScramble(alg);
                const parityText = caleTracer.getParityTextFromScramble(setup, {
                    topColor: colorScheme.topColor,
                    bottomColor: colorScheme.bottomColor,
                    frontColor: colorScheme.frontColor,
                    rightColor: colorScheme.rightColor,
                    backColor: colorScheme.backColor,
                    leftColor: colorScheme.leftColor
                }, cornerStickerMode);

                if (parityText === 'Odd') {
                    dynamicOddAlgs.push(alg);
                } else if (parityText === 'Even') {
                    dynamicEvenAlgs.push(alg);
                }
            } catch (error) {
                console.error('Error testing algorithm:', alg, error);
            }
        }

        calculated.set(item.name, {
            odd: dynamicOddAlgs,
            even: dynamicEvenAlgs
        });
    }

    parityAlgorithmsByCase = calculated;
    parityAlgorithmsDirty = false;
}

// Build shape index → caseName lookup (computed once)
export function buildShapeIndexToCaseMap() {
    const map = Object.fromEntries(CSPData.caseNameByShapeIndex);
    if (typeof shapeIndexMap === 'undefined') return map;
    for (const [caseName, idxStr] of Object.entries(shapeIndexMap)) {
        const idx = parseInt(idxStr);
        map[idx] = caseName;
        // Also map all org/mir indices for robustness
    }
    // Map org and mir arrays too
    if (typeof shapeIndex !== 'undefined') {
        for (const entry of shapeIndex) {
            const name = entry.name;
            const allIndices = [...(entry.org || []), ...(entry.mir || [])];
            for (const idx of allIndices) {
                if (!map[idx]) map[idx] = name;
            }
        }
    }
    return map;
}

export let _shapeIndexToCaseMap = null;
export function getShapeIndexToCaseMap() {
    if (!_shapeIndexToCaseMap) _shapeIndexToCaseMap = buildShapeIndexToCaseMap();
    return _shapeIndexToCaseMap;
}

// Get case name from a scramble string using shape index
export function getCaseNameFromScramble(scramble) {
    if (!scramble) return null;
    try {
        const setup = invertScramble(scramble);
        const result = algToShapeIndex(setup);
        return CSPData.getCaseNameByShapeIndex(result.shapeIndex) ||
            getShapeIndexToCaseMap()[result.shapeIndex] ||
            null;
    } catch {
        return null;
    }
}

// Check if a case is evil
export function isCaseEvil(caseName) {
    if (!evilnessFactor) return false;
    return evilnessMap[caseName] === true;
}

// Function to check if parity needs recalculation
export function needsParityRecalculation() {
    return parityAlgorithmsDirty;
}

export function normalizeTracingSchemePatterns(rawSchemes) {
    if (!rawSchemes) return rawSchemes;

    let schemes = rawSchemes;
    let wasString = typeof rawSchemes === 'string';
    if (wasString) {
        try {
            schemes = JSON.parse(rawSchemes);
        } catch {
            return rawSchemes;
        }
    }

    if (!schemes || typeof schemes !== 'object' || Array.isArray(schemes)) {
        return rawSchemes;
    }

    let changed = false;
    const normalized = {};
    for (const [pattern, shapeName] of Object.entries(schemes)) {
        const normalizedPattern = /^[EC]+$/.test(pattern)
            ? pattern.replace(/E/g, '0').replace(/C/g, '1')
            : pattern;
        if (normalizedPattern !== pattern) changed = true;
        normalized[normalizedPattern] = shapeName;
    }

    if (!changed && !wasString) return rawSchemes;
    return wasString ? JSON.stringify(normalized) : normalized;
}

export function storeCustomTracingSchemes(rawSchemes) {
    if (!rawSchemes) return;
    const normalized = normalizeTracingSchemePatterns(rawSchemes);
    const serialized = typeof normalized === 'string' ? normalized : JSON.stringify(normalized);
    localStorage.setItem('customTracingSchemes', serialized);
    markParityAlgorithmsDirty();
}

export function getCustomTracingSchemesFromState(state) {
    return state && (state.customTracingSchemes || state.customShapesForParityTracerLibrary);
}

export function migrateLegacyTracingSchemesFromStorage() {
    const currentSchemes = localStorage.getItem('customTracingSchemes');
    if (currentSchemes) {
        storeCustomTracingSchemes(currentSchemes);
        return;
    }

    const legacySchemes = localStorage.getItem('customShapesForParityTracerLibrary');
    if (legacySchemes) {
        storeCustomTracingSchemes(legacySchemes);
    }
}

migrateLegacyTracingSchemesFromStorage();

// Load evilness settings from localStorage
export const storedEvilnessFactor = localStorage.getItem('evilnessFactor');
if (storedEvilnessFactor !== null) evilnessFactor = storedEvilnessFactor === 'true';
export const storedEvilnessStringReturn = localStorage.getItem('evilnessStringReturn');
if (storedEvilnessStringReturn !== null) evilnessStringReturn = storedEvilnessStringReturn === 'true';
export const storedEvilnessMap = localStorage.getItem('evilnessMap');
if (storedEvilnessMap !== null) evilnessMap = JSON.parse(storedEvilnessMap);

// Load saved state
try {
    const saved = localStorage.getItem('sq1-parity-progress');
    if (saved) {
        const state = JSON.parse(saved);
        hydratePriorityLevels(state);
        comments = new Map(Object.entries(state.comments || {}));
        parityOrientations = new Map(Object.entries(state.parityOrientations || {}));
        hideInstructions = state.hideInstructions || false;
        hideParenthesis = state.hideParenthesis || false;
        colorScheme = state.colorScheme || colorScheme;
        scrambleImageSize = state.scrambleImageSize || 200;
        const customTracingSchemes = getCustomTracingSchemesFromState(state);
        if (customTracingSchemes) {
            storeCustomTracingSchemes(customTracingSchemes);
        }
        perCaseSubtitles = new Map(Object.entries(state.perCaseSubtitles || {}));
        cornerStickerMode = state.cornerStickerMode || 'counterclockwise';
        hydrateCustomAlgorithms(
            state.customAlgorithms,
            state.lastParityCalculationSettings && state.lastParityCalculationSettings.customAlgorithms
        );
        generalNotes = state.generalNotes || '';
        algVariables = new Map(Object.entries(state.algVariables || {}));

        // Load display names
        if (state.displayNames) {
            displayNames = state.displayNames;
            // Add any new cases from defaults (for app updates)
            for (const caseName in defaultDisplayNames) {
                if (!displayNames[caseName]) {
                    displayNames[caseName] = defaultDisplayNames[caseName];
                }
            }
        } else {
            // Legacy migration: if no displayNames, initialize from defaults
            displayNames = { ...defaultDisplayNames };
        }

        // Load custom SVG data
        if (state.svgData) {
            window.svgData = state.svgData;
        }

    }

    // Load enhancedAccess separately (not part of export/import)
    const enhancedAccessSaved = localStorage.getItem('enhancedAccess');
    if (enhancedAccessSaved !== null) {
        window.enhancedAccess = enhancedAccessSaved === 'true';
    }

    ensurePriorityLevelsForAllCases();
    saveState();
} catch (e) {
    console.error('Error loading saved state:', e);
}

// Function to initialize SVG data from defaults if needed
export function initializeSVGData() {
    if (!window.svgData) {
        window.svgData = { ...DEFAULT_SVGS };
    }

    // Ensure all 39 SVG keys exist
    const svgKeys = Object.keys(DEFAULT_SVGS);
    svgKeys.forEach(key => {
        if (!window.svgData[key]) {
            window.svgData[key] = DEFAULT_SVGS[key];
        }
    });
}

// Set defaults if this is first load
if (isFirstLoad) {
    showHints = true;
    localStorage.setItem('showHints', 'true');
    // Initialize display names from defaults
    displayNames = { ...defaultDisplayNames };

    saveState();
}

export function saveState() {
    localStorage.setItem('sortMode', currentSortMode);
    localStorage.setItem('enhancedAccess', window.enhancedAccess.toString());
    localStorage.setItem('currentPreset', currentPreset);
    localStorage.setItem('evilnessFactor', evilnessFactor.toString());
    localStorage.setItem('evilnessStringReturn', evilnessStringReturn.toString());
    localStorage.setItem('evilnessMap', JSON.stringify(evilnessMap));
    try {
        localStorage.setItem('sq1-parity-progress', JSON.stringify({
            comments: Object.fromEntries(comments),
            plannedLevels: Object.fromEntries(plannedLevels),
            parityOrientations: Object.fromEntries(parityOrientations),
            displayNames: displayNames,
            hideInstructions: hideInstructions,
            hideParenthesis: hideParenthesis,
            colorScheme: colorScheme,
            scrambleImageSize: scrambleImageSize,
            customTracingSchemes: localStorage.getItem('customTracingSchemes'),
            perCaseSubtitles: Object.fromEntries(perCaseSubtitles),
            cornerStickerMode: cornerStickerMode,
            customAlgorithms: Object.fromEntries(customAlgorithms),
            svgData: window.svgData,
            generalNotes: generalNotes,
            algVariables: Object.fromEntries(algVariables),
            evilnessFactor: evilnessFactor,
            evilnessStringReturn: evilnessStringReturn,
            evilnessMap: evilnessMap,
        }));
    } catch (e) {
        console.error('Error saving state:', e);
    }
}

// Load preset data
export async function loadPresetData(presetName) {
    try {
        const presetPath = window.PRESET_CONFIG[presetName];
        if (!presetPath) {
            throw new Error(`Preset "${presetName}" not found in configuration`);
        }
        const response = await fetch(presetPath);
        if (!response.ok) throw new Error('Preset file not found');
        return await response.json();
    } catch (error) {
        console.error('Error loading preset:', error);
        showToast('Error loading preset', 2000, 'error');
        return null;
    }
}

// Get default values from current preset
export function getPresetDefaults() {
    if (!presetData) return null;
    return presetData;
}

// Load preset data to use as defaults only (doesn't overwrite user data)
export async function loadPresetAsDefaults(presetName) {
    const preset = await loadPresetData(presetName);
    if (!preset) return false;

    currentPreset = presetName;
    presetData = preset;
    localStorage.setItem('currentPreset', currentPreset);

    if (customAlgorithms.size === 0 && preset.customAlgorithms && Object.keys(preset.customAlgorithms).length > 0) {
        hydrateCustomAlgorithms(
            preset.customAlgorithms,
            preset.lastParityCalculationSettings && preset.lastParityCalculationSettings.customAlgorithms
        );
        saveState();
    }

    return true;
}

// Apply preset (overwrites all user data - only used on first load or explicit switch)
export async function applyPreset(presetName, skipWarning = false, silent = false) {
    const data = await loadPresetData(presetName);
    if (!data) return;

    // PRESERVE user's learning progress AND personal UI preferences:
    // Learning Progress (DON'T overwrite):
    // - plannedLevels
    //
    // Personal UI/UX Preferences (DON'T overwrite):
    // - hideInstructions, hideParenthesis
    // - algorithmFontSize (stored in localStorage)
    // - scrambleImageSize
    // - showHints (stored in localStorage)
    // - enhancedAccess (stored in localStorage)
    // - Training settings (all in localStorage)
    // - Animation settings (all in localStorage)
    // - Parity tracer settings (all in localStorage)

    // Apply preset configuration (algorithms, display names, shapes, etc.)
    if (data.displayNames) {
        displayNames = data.displayNames;
    }

    // Apply comments from preset (they have tutorial links)
    comments = new Map(Object.entries(data.comments || {}));

    // Apply preset color scheme
    colorScheme = data.colorScheme || colorScheme;

    // Apply shape patterns from preset
    const presetTracingSchemes = getCustomTracingSchemesFromState(data);
    if (presetTracingSchemes) {
        storeCustomTracingSchemes(presetTracingSchemes);
    }

    // Apply preset subtitle configurations
    perCaseSubtitles = new Map(Object.entries(data.perCaseSubtitles || {}));

    // Apply preset corner sticker mode
    cornerStickerMode = data.cornerStickerMode || 'counterclockwise';

    // Apply preset algorithms
    hydrateCustomAlgorithms(
        data.customAlgorithms,
        data.lastParityCalculationSettings && data.lastParityCalculationSettings.customAlgorithms
    );

    // Apply preset SVG data
    if (data.svgData) {
        window.svgData = data.svgData;
    }

    // Apply preset evilness settings
    if (data.evilnessMap !== undefined) evilnessMap = data.evilnessMap;
    if (data.evilnessFactor !== undefined) evilnessFactor = data.evilnessFactor;
    if (data.evilnessStringReturn !== undefined) evilnessStringReturn = data.evilnessStringReturn;

    // Apply preset parity orientations
    parityOrientations = new Map(Object.entries(data.parityOrientations || {}));

    // Apply preset general notes
    generalNotes = data.generalNotes || '';

    // Note: We explicitly DON'T apply these from preset - they're personal preferences:
    // - hideInstructions (keep user's preference)
    // - hideParenthesis (keep user's preference)
    // - algorithmFontSize (keep user's preference from localStorage)
    // - scrambleImageSize (keep user's preference)
    // - showHints (keep user's preference from localStorage)
    // - enhancedAccess (keep user's preference from localStorage)

    currentPreset = presetName;
    presetData = data;

    markParityAlgorithmsDirty();

    saveState();
    updateProfileStats();

    // Recalculate parity with new settings
    if (needsParityRecalculation()) {
        calculateAndCacheAllParity();
    }

    render();

    // Force reload shape patterns in parity tracer library
    if (presetTracingSchemes && ParityTracerLibrary) {
        try {
            // Force reload from localStorage after we've saved it
            setTimeout(() => {
                if (ParityTracerLibrary.reloadShapesFromStorage) {
                    ParityTracerLibrary.reloadShapesFromStorage();
                }
            }, 100);

            // Also invalidate any cached parity calculations
            setTimeout(() => {
                if (ParityTracerLibrary.reloadShapesFromStorage) {
                    ParityTracerLibrary.reloadShapesFromStorage();
                }
            }, 300);
        } catch (e) {
            console.error('❌ Error reloading shapes in parity tracer:', e);
        }
    }

    if (!skipWarning && !silent) {
        showToast(`Preset "${presetName}" applied successfully!`, 3000, 'success');
    }
}

window.applyPreset = applyPreset;

// Initialize preset on load (just loads as defaults, doesn't overwrite user data)
export async function initializePreset() {
    const savedPreset = localStorage.getItem('currentPreset') || 'Default_Preset';
    const success = await loadPresetAsDefaults(savedPreset);
    if (!success) {
        // Fallback to default if saved preset doesn't exist
        await loadPresetAsDefaults('Default_Preset');
    }
}

window.initializePreset = initializePreset;

export const EXPORT_FORMAT_VERSION = 4;

export function readStoredJSONSetting(key) {
    const value = localStorage.getItem(key);
    if (value === null || value === '') return undefined;
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}

export function stringifyStoredJSONSetting(value) {
    if (value === undefined || value === null || value === '') return null;
    return typeof value === 'string' ? value : JSON.stringify(value);
}

export function readStoredBooleanSetting(key) {
    const value = localStorage.getItem(key);
    if (value === null) return undefined;
    return value === 'true';
}

export function readStoredNumberSetting(key) {
    const value = localStorage.getItem(key);
    if (value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

export function buildLegacyExportState() {
    return {
        comments: Object.fromEntries(comments),
        plannedLevels: Object.fromEntries(plannedLevels),
        parityOrientations: Object.fromEntries(parityOrientations),
        displayNames: displayNames,
        showHints: showHints,
        hideInstructions: hideInstructions,
        hideParenthesis: hideParenthesis,
        colorScheme: colorScheme,
        scrambleImageSize: scrambleImageSize,
        customTracingSchemes: readStoredJSONSetting('customTracingSchemes'),
        perCaseSubtitles: Object.fromEntries(perCaseSubtitles),
        cornerStickerMode: cornerStickerMode,
        customAlgorithms: Object.fromEntries(customAlgorithms),
        svgData: window.svgData,
        generalNotes: generalNotes,
        algVariables: Object.fromEntries(algVariables),
        evilnessFactor: evilnessFactor,
        evilnessStringReturn: evilnessStringReturn,
        evilnessMap: evilnessMap,
        parityTracerImageSize: readStoredNumberSetting('parityTracerImageSize'),
        parityTracerArrow: readStoredBooleanSetting('parityTracerArrow'),
        parityTracerArrowSettings: readStoredJSONSetting('parityTracerArrowSettings'),
        trainingScrambleImageSize: readStoredNumberSetting('trainingScrambleImageSize'),
        trainingScrambleTextSize: readStoredNumberSetting('trainingScrambleTextSize'),
        trainingHoldToStart: readStoredNumberSetting('trainingHoldToStart'),
        trainingTimerSize: readStoredNumberSetting('trainingTimerSize'),
        trainingShowPrevScramble: readStoredBooleanSetting('trainingShowPrevScramble'),
        profileName: profileName,
        profileAvatar: profileAvatar,
    };
}

export function buildExportDocument() {
    const state = buildLegacyExportState();
    if (typeof window.selectorExportHook === 'function') window.selectorExportHook(state);

    return {
        app: 'SquanGo CSP',
        formatVersion: EXPORT_FORMAT_VERSION,
        exportedAt: new Date().toISOString(),
        compatibility: {
            canImportLegacyFlatFormat: true,
            note: 'This file contains your SquanGo CSP progress, notes, algorithms, trainer settings, and visual customization.'
        },
        profile: {
            name: state.profileName,
            avatar: state.profileAvatar
        },
        progress: {
            plannedLevels: state.plannedLevels
        },
        cases: {
            displayNames: state.displayNames,
            subtitles: state.perCaseSubtitles,
            comments: state.comments,
            algorithms: state.customAlgorithms,
            variables: state.algVariables,
            generalNotes: state.generalNotes
        },
        preferences: {
            showHints: state.showHints,
            hideInstructions: state.hideInstructions,
            hideParenthesis: state.hideParenthesis,
            colorScheme: state.colorScheme,
            scrambleImageSize: state.scrambleImageSize,
            cornerStickerMode: state.cornerStickerMode
        },
        parityTracing: {
            orientations: state.parityOrientations,
            customTracingSchemes: state.customTracingSchemes,
            evilnessFactor: state.evilnessFactor,
            evilnessStringReturn: state.evilnessStringReturn,
            evilnessMap: state.evilnessMap,
            imageSize: state.parityTracerImageSize,
            arrowEnabled: state.parityTracerArrow,
            arrowSettings: state.parityTracerArrowSettings
        },
        trainer: {
            scrambleImageSize: state.trainingScrambleImageSize,
            scrambleTextSize: state.trainingScrambleTextSize,
            holdToStart: state.trainingHoldToStart,
            timerSize: state.trainingTimerSize,
            showPreviousScramble: state.trainingShowPrevScramble,
            multiCaseSelectedCases: state.selectorSelectedCases || []
        },
        visuals: {
            svgData: state.svgData
        }
    };
}

export function flattenImportedState(rawState) {
    if (!rawState || typeof rawState !== 'object') {
        throw new Error('Import file must contain a JSON object.');
    }

    // Version 1 exports were flat. Keep them importable forever.
    if (!rawState.formatVersion) return rawState;

    const progress = rawState.progress || {};
    const cases = rawState.cases || {};
    const preferences = rawState.preferences || {};
    const parityTracing = rawState.parityTracing || {};
    const trainer = rawState.trainer || {};
    const visuals = rawState.visuals || {};
    const profile = rawState.profile || {};

    return {
        learned: progress.learned,
        learning: progress.learning,
        planned: progress.planned,
        plannedLevels: progress.plannedLevels,
        comments: cases.comments,
        displayNames: cases.displayNames,
        perCaseSubtitles: cases.subtitles,
        customAlgorithms: cases.algorithms,
        algVariables: cases.variables,
        generalNotes: cases.generalNotes,
        showHints: preferences.showHints,
        hideInstructions: preferences.hideInstructions,
        hideParenthesis: preferences.hideParenthesis,
        colorScheme: preferences.colorScheme,
        scrambleImageSize: preferences.scrambleImageSize,
        cornerStickerMode: preferences.cornerStickerMode,
        parityOrientations: parityTracing.orientations,
        customTracingSchemes: parityTracing.customTracingSchemes,
        customShapesForParityTracerLibrary: parityTracing.customShapesForParityTracerLibrary,
        evilnessFactor: parityTracing.evilnessFactor,
        evilnessStringReturn: parityTracing.evilnessStringReturn,
        evilnessMap: parityTracing.evilnessMap,
        parityTracerImageSize: parityTracing.imageSize,
        parityTracerArrow: parityTracing.arrowEnabled,
        parityTracerArrowSettings: parityTracing.arrowSettings,
        trainingScrambleImageSize: trainer.scrambleImageSize,
        trainingScrambleTextSize: trainer.scrambleTextSize,
        trainingHoldToStart: trainer.holdToStart,
        trainingTimerSize: trainer.timerSize,
        trainingShowPrevScramble: trainer.showPreviousScramble,
        selectorSelectedCases: trainer.multiCaseSelectedCases,
        profileName: profile.name,
        profileAvatar: profile.avatar,
        svgData: visuals.svgData
    };
}

window.exportData = function() {
    const state = buildExportDocument();
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'squango-CSP.json';
    link.click();
    URL.revokeObjectURL(url);
}

export function importData(jsonStr) {
    try {
        const state = flattenImportedState(JSON.parse(jsonStr));
        const importedTracingSchemes = getCustomTracingSchemesFromState(state);

        // Force reload shape patterns from imported data FIRST
        if (importedTracingSchemes) {
            storeCustomTracingSchemes(importedTracingSchemes);
            // Force the parity tracer library to reload shapes immediately
            if (ParityTracerLibrary) {
                setTimeout(() => {
                    if (ParityTracerLibrary.reloadShapesFromStorage) {
                        ParityTracerLibrary.reloadShapesFromStorage();
                    }
                }, 100);
            }
        }
        hydratePriorityLevels(state);
        comments = new Map(Object.entries(state.comments || {}));
        parityOrientations = new Map(Object.entries(state.parityOrientations || {}));

        // Load display names
        if (state.displayNames) {
            displayNames = state.displayNames;
            // Add any new cases from defaults (for app updates)
            for (const caseName in defaultDisplayNames) {
                if (!displayNames[caseName]) {
                    displayNames[caseName] = defaultDisplayNames[caseName];
                }
            }
        } else {
            displayNames = { ...defaultDisplayNames };
        }
        hideInstructions = state.hideInstructions || false;
        hideParenthesis = state.hideParenthesis || false;
        colorScheme = state.colorScheme || colorScheme;
        if (importedTracingSchemes) {
            storeCustomTracingSchemes(importedTracingSchemes);
        }
        perCaseSubtitles = new Map(Object.entries(state.perCaseSubtitles || {}));
        cornerStickerMode = state.cornerStickerMode || 'counterclockwise';
        hydrateCustomAlgorithms(
            state.customAlgorithms,
            state.lastParityCalculationSettings && state.lastParityCalculationSettings.customAlgorithms
        );
        generalNotes = state.generalNotes || '';
        algVariables = new Map(Object.entries(state.algVariables || {}));

        // Load evilness settings
        if (state.evilnessFactor !== undefined) evilnessFactor = state.evilnessFactor;
        if (state.evilnessStringReturn !== undefined) evilnessStringReturn = state.evilnessStringReturn;
        if (state.evilnessMap !== undefined) evilnessMap = state.evilnessMap;

        // Load custom SVG data
        if (state.svgData) {
            window.svgData = state.svgData;
        }

        // Import selector selections
        if (typeof window.selectorImportHook === 'function') window.selectorImportHook(state);

        markParityAlgorithmsDirty();

        if (state.showHints !== undefined) {
            showHints = state.showHints;
            localStorage.setItem('showHints', showHints);
            applyHintVisibility();
        }
        if (importedTracingSchemes) {
            storeCustomTracingSchemes(importedTracingSchemes);
        }
        if (state.parityTracerImageSize) {
            localStorage.setItem('parityTracerImageSize', state.parityTracerImageSize);
        }
        if (state.parityTracerArrow !== undefined) {
            localStorage.setItem('parityTracerArrow', state.parityTracerArrow);
        }
        if (state.parityTracerArrowSettings) {
            localStorage.setItem('parityTracerArrowSettings', stringifyStoredJSONSetting(state.parityTracerArrowSettings));
        }
        if (state.trainingScrambleImageSize) {
            localStorage.setItem('trainingScrambleImageSize', state.trainingScrambleImageSize);
        }
        if (state.trainingScrambleTextSize) {
            localStorage.setItem('trainingScrambleTextSize', state.trainingScrambleTextSize);
        }
        if (state.trainingHoldToStart) {
            localStorage.setItem('trainingHoldToStart', state.trainingHoldToStart);
        }
        if (state.profileName) {
            profileName = state.profileName;
            localStorage.setItem('profileName', profileName);
        }
        if (state.profileAvatar) {
            profileAvatar = state.profileAvatar;
            localStorage.setItem('profileAvatar', profileAvatar);
        }
        if (state.trainingTimerSize) {
            localStorage.setItem('trainingTimerSize', state.trainingTimerSize);
        }
        if (state.trainingShowPrevScramble !== undefined) {
            localStorage.setItem('trainingShowPrevScramble', state.trainingShowPrevScramble);
        }
        saveState();
        updateProfileStats();

        // Force recalculate all parity with new settings
        if (needsParityRecalculation()) {
            calculateAndCacheAllParity();
        }

        render();
        showToast('Data imported successfully!', 3000, 'success');
    } catch (e) {
        showToast('Error importing data: ' + e.message, 3000, 'error');
    }
}

window.SQG = window.SQG || {};
window.SQG.appState = Object.freeze({
    exportVersion: EXPORT_FORMAT_VERSION,
    createExportDocument: buildExportDocument,
    createLegacySnapshot: buildLegacyExportState,
    importFromJSON: importData,
    save: saveState
});

export function handleFileImport(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        importData(e.target.result);
        // Reset the file input so the same file can be imported again
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.value = '';
        }
    };
    reader.readAsText(file);
}

// DOM element references - will be initialized after DOM is ready
export let searchInput = null;
export let sortSelect = null;
export let learnFilterSelect = null;
export let grid = null;

// Initialize DOM references
export function initializeDOMReferences() {
    searchInput = document.getElementById('search');
    sortSelect = document.getElementById('sort');
    learnFilterSelect = document.getElementById('learnFilter');
    grid = document.getElementById('grid');
}

// Dynamic SVG scaling based on viewport width
export function updateSVGScaling() {
    // No longer needed - CSS handles scaling with aspect-ratio
}

// Debounced resize handler for better performance
export function handleResize() {
    // Reserved for future resize logic if needed
}

// Update on load and resize
window.addEventListener('load', updateSVGScaling);
window.addEventListener('resize', handleResize);

// Also call after rendering cards
export const originalRender = window.render;
if (typeof originalRender === 'function') {
    window.render = function () {
        originalRender();
        setTimeout(updateSVGScaling, 10);
    };
}

// Initialize preset system when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize preset on app load
    await initializePreset();

    // Apply default preset silently on first load
    if (isFirstLoad) {
        await applyPreset('Default_Preset', true, true);
    }

    // Apply algorithm font size
    if (typeof applyAlgorithmFontSize === 'function') {
        applyAlgorithmFontSize();
    }
});

window.openAnimateAlgModal = function (algorithm = '', caseName = '', computedParity = '') {
    if (typeof window.Square1AlgorithmViewer === 'undefined') {
        showToast('Algorithm viewer library not loaded', 2000, 'error');
        return;
    }

    const alg = algorithm || '(0,0)';

    // Compute parity if not provided
    let parity = computedParity;
    if (!parity && algorithm && algorithm !== 'Done!') {
        try {
            const setup = invertScramble(algorithm);
            const parityText = caleTracer.getParityTextFromScramble(setup, {
                topColor: colorScheme.topColor,
                bottomColor: colorScheme.bottomColor,
                frontColor: colorScheme.frontColor,
                rightColor: colorScheme.rightColor,
                backColor: colorScheme.backColor,
                leftColor: colorScheme.leftColor
            }, cornerStickerMode);
            parity = parityText.toLowerCase();
        } catch {
            parity = '';
        }
    }

    const html = window.Square1AlgorithmViewer.createViewer(alg, {
        topColor: colorScheme.topColor,
        bottomColor: colorScheme.bottomColor,
        frontColor: colorScheme.frontColor,
        rightColor: colorScheme.rightColor,
        backColor: colorScheme.backColor,
        leftColor: colorScheme.leftColor
    }, caseName, parity);

    document.body.insertAdjacentHTML('beforeend', html);
};

// Apply VW-based sizing to topbar on mobile
export function applyTopbarVWScaling() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;

    if (window.innerWidth <= 480) {
        topbar.classList.add('topbar-vw-mode');
    } else {
        topbar.classList.remove('topbar-vw-mode');
    }
}

window.addEventListener('resize', applyTopbarVWScaling);
document.addEventListener('DOMContentLoaded', applyTopbarVWScaling);

// ESM live global compatibility bridge
for (const [name, descriptor] of Object.entries({
    "defaultDisplayNames": { get: () => defaultDisplayNames, set: value => { Object.defineProperty(window, "defaultDisplayNames", { configurable: true, enumerable: true, writable: true, value }); } },
    "displayNames": { get: () => displayNames, set: value => { displayNames = value; } },
    "filteredData": { get: () => filteredData, set: value => { filteredData = value; } },
    "comments": { get: () => comments, set: value => { comments = value; } },
    "plannedLevels": { get: () => plannedLevels, set: value => { plannedLevels = value; } },
    "parityOrientations": { get: () => parityOrientations, set: value => { parityOrientations = value; } },
    "cornerStickerMode": { get: () => cornerStickerMode, set: value => { cornerStickerMode = value; } },
    "evilnessFactor": { get: () => evilnessFactor, set: value => { evilnessFactor = value; } },
    "evilnessStringReturn": { get: () => evilnessStringReturn, set: value => { evilnessStringReturn = value; } },
    "evilnessMap": { get: () => evilnessMap, set: value => { evilnessMap = value; } },
    "customAlgorithms": { get: () => customAlgorithms, set: value => { customAlgorithms = value; } },
    "parityAlgorithmsByCase": { get: () => parityAlgorithmsByCase, set: value => { parityAlgorithmsByCase = value; } },
    "parityAlgorithmsDirty": { get: () => parityAlgorithmsDirty, set: value => { parityAlgorithmsDirty = value; } },
    "perCaseSubtitles": { get: () => perCaseSubtitles, set: value => { perCaseSubtitles = value; } },
    "hideInstructions": { get: () => hideInstructions, set: value => { hideInstructions = value; } },
    "hideParenthesis": { get: () => hideParenthesis, set: value => { hideParenthesis = value; } },
    "algorithmFontSize": { get: () => algorithmFontSize, set: value => { algorithmFontSize = value; } },
    "generalNotes": { get: () => generalNotes, set: value => { generalNotes = value; } },
    "algVariables": { get: () => algVariables, set: value => { algVariables = value; } },
    "showHints": { get: () => showHints, set: value => { showHints = value; } },
    "currentSortMode": { get: () => currentSortMode, set: value => { currentSortMode = value; } },
    "colorScheme": { get: () => colorScheme, set: value => { colorScheme = value; } },
    "LEARNED_PRIORITY_LEVEL": { get: () => LEARNED_PRIORITY_LEVEL, set: value => { Object.defineProperty(window, "LEARNED_PRIORITY_LEVEL", { configurable: true, enumerable: true, writable: true, value }); } },
    "MIN_PLANNED_PRIORITY_LEVEL": { get: () => MIN_PLANNED_PRIORITY_LEVEL, set: value => { Object.defineProperty(window, "MIN_PLANNED_PRIORITY_LEVEL", { configurable: true, enumerable: true, writable: true, value }); } },
    "DEFAULT_PRIORITY_LEVEL": { get: () => DEFAULT_PRIORITY_LEVEL, set: value => { Object.defineProperty(window, "DEFAULT_PRIORITY_LEVEL", { configurable: true, enumerable: true, writable: true, value }); } },
    "MAX_PLANNED_PRIORITY_LEVEL": { get: () => MAX_PLANNED_PRIORITY_LEVEL, set: value => { Object.defineProperty(window, "MAX_PLANNED_PRIORITY_LEVEL", { configurable: true, enumerable: true, writable: true, value }); } },
    "LEARNING_PRIORITY_LEVEL": { get: () => LEARNING_PRIORITY_LEVEL, set: value => { Object.defineProperty(window, "LEARNING_PRIORITY_LEVEL", { configurable: true, enumerable: true, writable: true, value }); } },
    "normalizePriorityLevel": { get: () => normalizePriorityLevel, set: value => { Object.defineProperty(window, "normalizePriorityLevel", { configurable: true, enumerable: true, writable: true, value }); } },
    "getCasePriorityLevel": { get: () => getCasePriorityLevel, set: value => { Object.defineProperty(window, "getCasePriorityLevel", { configurable: true, enumerable: true, writable: true, value }); } },
    "getPlannedPriorityLevel": { get: () => getPlannedPriorityLevel, set: value => { Object.defineProperty(window, "getPlannedPriorityLevel", { configurable: true, enumerable: true, writable: true, value }); } },
    "getPriorityVisualLevel": { get: () => getPriorityVisualLevel, set: value => { Object.defineProperty(window, "getPriorityVisualLevel", { configurable: true, enumerable: true, writable: true, value }); } },
    "setCasePriorityLevel": { get: () => setCasePriorityLevel, set: value => { Object.defineProperty(window, "setCasePriorityLevel", { configurable: true, enumerable: true, writable: true, value }); } },
    "isCaseLearned": { get: () => isCaseLearned, set: value => { Object.defineProperty(window, "isCaseLearned", { configurable: true, enumerable: true, writable: true, value }); } },
    "isCaseLearning": { get: () => isCaseLearning, set: value => { Object.defineProperty(window, "isCaseLearning", { configurable: true, enumerable: true, writable: true, value }); } },
    "isCasePlanned": { get: () => isCasePlanned, set: value => { Object.defineProperty(window, "isCasePlanned", { configurable: true, enumerable: true, writable: true, value }); } },
    "getPrioritySortValue": { get: () => getPrioritySortValue, set: value => { Object.defineProperty(window, "getPrioritySortValue", { configurable: true, enumerable: true, writable: true, value }); } },
    "normalizeAlgorithmList": { get: () => normalizeAlgorithmList, set: value => { Object.defineProperty(window, "normalizeAlgorithmList", { configurable: true, enumerable: true, writable: true, value }); } },
    "parseLegacyAlgorithmSnapshot": { get: () => parseLegacyAlgorithmSnapshot, set: value => { Object.defineProperty(window, "parseLegacyAlgorithmSnapshot", { configurable: true, enumerable: true, writable: true, value }); } },
    "hydrateCustomAlgorithms": { get: () => hydrateCustomAlgorithms, set: value => { Object.defineProperty(window, "hydrateCustomAlgorithms", { configurable: true, enumerable: true, writable: true, value }); } },
    "getCaseAlgorithmList": { get: () => getCaseAlgorithmList, set: value => { Object.defineProperty(window, "getCaseAlgorithmList", { configurable: true, enumerable: true, writable: true, value }); } },
    "getParityAlgorithmsForCase": { get: () => getParityAlgorithmsForCase, set: value => { Object.defineProperty(window, "getParityAlgorithmsForCase", { configurable: true, enumerable: true, writable: true, value }); } },
    "markParityAlgorithmsDirty": { get: () => markParityAlgorithmsDirty, set: value => { Object.defineProperty(window, "markParityAlgorithmsDirty", { configurable: true, enumerable: true, writable: true, value }); } },
    "ensurePriorityLevelsForAllCases": { get: () => ensurePriorityLevelsForAllCases, set: value => { Object.defineProperty(window, "ensurePriorityLevelsForAllCases", { configurable: true, enumerable: true, writable: true, value }); } },
    "hydratePriorityLevels": { get: () => hydratePriorityLevels, set: value => { Object.defineProperty(window, "hydratePriorityLevels", { configurable: true, enumerable: true, writable: true, value }); } },
    "scrambleImageSize": { get: () => scrambleImageSize, set: value => { scrambleImageSize = value; } },
    "profileName": { get: () => profileName, set: value => { profileName = value; } },
    "profileAvatar": { get: () => profileAvatar, set: value => { profileAvatar = value; } },
    "currentPreset": { get: () => currentPreset, set: value => { currentPreset = value; } },
    "presetData": { get: () => presetData, set: value => { presetData = value; } },
    "isFirstLoad": { get: () => isFirstLoad, set: value => { Object.defineProperty(window, "isFirstLoad", { configurable: true, enumerable: true, writable: true, value }); } },
    "calculateAndCacheAllParity": { get: () => calculateAndCacheAllParity, set: value => { Object.defineProperty(window, "calculateAndCacheAllParity", { configurable: true, enumerable: true, writable: true, value }); } },
    "buildShapeIndexToCaseMap": { get: () => buildShapeIndexToCaseMap, set: value => { Object.defineProperty(window, "buildShapeIndexToCaseMap", { configurable: true, enumerable: true, writable: true, value }); } },
    "_shapeIndexToCaseMap": { get: () => _shapeIndexToCaseMap, set: value => { _shapeIndexToCaseMap = value; } },
    "getShapeIndexToCaseMap": { get: () => getShapeIndexToCaseMap, set: value => { Object.defineProperty(window, "getShapeIndexToCaseMap", { configurable: true, enumerable: true, writable: true, value }); } },
    "getCaseNameFromScramble": { get: () => getCaseNameFromScramble, set: value => { Object.defineProperty(window, "getCaseNameFromScramble", { configurable: true, enumerable: true, writable: true, value }); } },
    "isCaseEvil": { get: () => isCaseEvil, set: value => { Object.defineProperty(window, "isCaseEvil", { configurable: true, enumerable: true, writable: true, value }); } },
    "needsParityRecalculation": { get: () => needsParityRecalculation, set: value => { Object.defineProperty(window, "needsParityRecalculation", { configurable: true, enumerable: true, writable: true, value }); } },
    "normalizeTracingSchemePatterns": { get: () => normalizeTracingSchemePatterns, set: value => { Object.defineProperty(window, "normalizeTracingSchemePatterns", { configurable: true, enumerable: true, writable: true, value }); } },
    "storeCustomTracingSchemes": { get: () => storeCustomTracingSchemes, set: value => { Object.defineProperty(window, "storeCustomTracingSchemes", { configurable: true, enumerable: true, writable: true, value }); } },
    "getCustomTracingSchemesFromState": { get: () => getCustomTracingSchemesFromState, set: value => { Object.defineProperty(window, "getCustomTracingSchemesFromState", { configurable: true, enumerable: true, writable: true, value }); } },
    "migrateLegacyTracingSchemesFromStorage": { get: () => migrateLegacyTracingSchemesFromStorage, set: value => { Object.defineProperty(window, "migrateLegacyTracingSchemesFromStorage", { configurable: true, enumerable: true, writable: true, value }); } },
    "storedEvilnessFactor": { get: () => storedEvilnessFactor, set: value => { Object.defineProperty(window, "storedEvilnessFactor", { configurable: true, enumerable: true, writable: true, value }); } },
    "storedEvilnessStringReturn": { get: () => storedEvilnessStringReturn, set: value => { Object.defineProperty(window, "storedEvilnessStringReturn", { configurable: true, enumerable: true, writable: true, value }); } },
    "storedEvilnessMap": { get: () => storedEvilnessMap, set: value => { Object.defineProperty(window, "storedEvilnessMap", { configurable: true, enumerable: true, writable: true, value }); } },
    "initializeSVGData": { get: () => initializeSVGData, set: value => { Object.defineProperty(window, "initializeSVGData", { configurable: true, enumerable: true, writable: true, value }); } },
    "saveState": { get: () => saveState, set: value => { Object.defineProperty(window, "saveState", { configurable: true, enumerable: true, writable: true, value }); } },
    "loadPresetData": { get: () => loadPresetData, set: value => { Object.defineProperty(window, "loadPresetData", { configurable: true, enumerable: true, writable: true, value }); } },
    "getPresetDefaults": { get: () => getPresetDefaults, set: value => { Object.defineProperty(window, "getPresetDefaults", { configurable: true, enumerable: true, writable: true, value }); } },
    "loadPresetAsDefaults": { get: () => loadPresetAsDefaults, set: value => { Object.defineProperty(window, "loadPresetAsDefaults", { configurable: true, enumerable: true, writable: true, value }); } },
    "EXPORT_FORMAT_VERSION": { get: () => EXPORT_FORMAT_VERSION, set: value => { Object.defineProperty(window, "EXPORT_FORMAT_VERSION", { configurable: true, enumerable: true, writable: true, value }); } },
    "readStoredJSONSetting": { get: () => readStoredJSONSetting, set: value => { Object.defineProperty(window, "readStoredJSONSetting", { configurable: true, enumerable: true, writable: true, value }); } },
    "stringifyStoredJSONSetting": { get: () => stringifyStoredJSONSetting, set: value => { Object.defineProperty(window, "stringifyStoredJSONSetting", { configurable: true, enumerable: true, writable: true, value }); } },
    "readStoredBooleanSetting": { get: () => readStoredBooleanSetting, set: value => { Object.defineProperty(window, "readStoredBooleanSetting", { configurable: true, enumerable: true, writable: true, value }); } },
    "readStoredNumberSetting": { get: () => readStoredNumberSetting, set: value => { Object.defineProperty(window, "readStoredNumberSetting", { configurable: true, enumerable: true, writable: true, value }); } },
    "buildLegacyExportState": { get: () => buildLegacyExportState, set: value => { Object.defineProperty(window, "buildLegacyExportState", { configurable: true, enumerable: true, writable: true, value }); } },
    "buildExportDocument": { get: () => buildExportDocument, set: value => { Object.defineProperty(window, "buildExportDocument", { configurable: true, enumerable: true, writable: true, value }); } },
    "flattenImportedState": { get: () => flattenImportedState, set: value => { Object.defineProperty(window, "flattenImportedState", { configurable: true, enumerable: true, writable: true, value }); } },
    "importData": { get: () => importData, set: value => { Object.defineProperty(window, "importData", { configurable: true, enumerable: true, writable: true, value }); } },
    "handleFileImport": { get: () => handleFileImport, set: value => { Object.defineProperty(window, "handleFileImport", { configurable: true, enumerable: true, writable: true, value }); } },
    "searchInput": { get: () => searchInput, set: value => { searchInput = value; } },
    "sortSelect": { get: () => sortSelect, set: value => { sortSelect = value; } },
    "learnFilterSelect": { get: () => learnFilterSelect, set: value => { learnFilterSelect = value; } },
    "grid": { get: () => grid, set: value => { grid = value; } },
    "initializeDOMReferences": { get: () => initializeDOMReferences, set: value => { Object.defineProperty(window, "initializeDOMReferences", { configurable: true, enumerable: true, writable: true, value }); } },
    "updateSVGScaling": { get: () => updateSVGScaling, set: value => { Object.defineProperty(window, "updateSVGScaling", { configurable: true, enumerable: true, writable: true, value }); } },
    "handleResize": { get: () => handleResize, set: value => { Object.defineProperty(window, "handleResize", { configurable: true, enumerable: true, writable: true, value }); } },
    "originalRender": { get: () => originalRender, set: value => { Object.defineProperty(window, "originalRender", { configurable: true, enumerable: true, writable: true, value }); } },
    "applyTopbarVWScaling": { get: () => applyTopbarVWScaling, set: value => { Object.defineProperty(window, "applyTopbarVWScaling", { configurable: true, enumerable: true, writable: true, value }); } },
})) {
    Object.defineProperty(window, name, {
        configurable: true,
        enumerable: true,
        get: descriptor.get,
        set: descriptor.set
    });
}
