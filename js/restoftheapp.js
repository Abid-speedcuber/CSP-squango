// Modular preset configuration - add new presets here
window.PRESET_CONFIG = {
    'Default_Preset': 'presets/Default_Preset.json',
    'Abid\'s_Preset': 'presets/Abid\'s_Preset.json',
    'Matt\'s_Preset': 'presets/Matt\'s_Preset.json'
    // Add more presets here:
    // 'Preset_Name': 'presets/preset_file.json',
};

// Default display names for all 90 cases (used for fresh installs)
const defaultDisplayNames = {
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
let displayNames = {};

let filteredData = [...data];
let learnedCases = new Set();
let learningCases = new Set();
let plannedCases = new Set();
let comments = new Map(); // stores {caseName: "comment text"}
let plannedLevels = new Map(); // stores {caseName: 1-6}
let parityOrientations = new Map(); // stores {shapePattern: rotationAmount}
let cornerStickerMode = 'counterclockwise'; // 'counterclockwise' or 'clockwise'

// Global function to set corner sticker mode
window.setCornerStickerMode = function(mode) {
    cornerStickerMode = mode;
    saveState();
};
let customAlgorithms = new Map(); // stores {caseName: {odd: [...], even: [...]}}
// svgData is now the source of truth, initialized from DEFAULT_SVGS in svg.js
let cachedParityAlgorithms = new Map(); // stores {caseName: {odd: [...], even: [...]}}
let lastParityCalculationSettings = null; // Track settings that affect parity calculation

let perCaseSubtitles = new Map(); // Stores {caseName: "Subtitle"}
let showPaths = true;         // Shape paths always shown
let enablePriorityLearning = true; // Priority learning always enabled
let hideInstructions = false; // Toggle for hiding instruction buttons
let hideParenthesis = false; // Toggle for hiding parenthesis in algorithms
let algorithmFontSize = parseInt(localStorage.getItem('algorithmFontSize')) || 14; // Default 14px, stored in localStorage only
let generalNotes = ''; // HTML content for general notes
window.allowCaseEdit = false; // Toggle for allowing case edits (not exported)
let showHints = localStorage.getItem('showHints') !== null ? localStorage.getItem('showHints') === 'true' : true; // Default to true
let currentSortMode = localStorage.getItem('sortMode') || 'probability';
let needsReorder = false;
let colorScheme = {
    topColor: '#000000',
    bottomColor: '#FFFFFF',
    frontColor: '#CC0000',
    rightColor: '#00AA00',
    backColor: '#FF8C00',
    leftColor: '#0066CC',
    dividerColor: '#7a0000',
    circleColor: 'transparent'
};

let scrambleImageSize = 200; // Default size
let currentPreset = localStorage.getItem('currentPreset') || 'Default_Preset';
let presetData = null; // Will store loaded preset data

// Check if this is first load BEFORE loading state
const isFirstLoad = !localStorage.getItem('sq1-parity-progress');

// If first load, we'll apply default preset after initialization

// Function to calculate and cache parity for all cases
function calculateAndCacheAllParity() {
    
    if (typeof window.Square1ParityAnalyzerLibraryWithSillyNames === 'undefined') {
        console.warn('Parity analyzer not available, skipping parity calculation');
        return;
    }
    
    // Store current settings for comparison
    lastParityCalculationSettings = {
        colorScheme: JSON.stringify(colorScheme),
        cornerStickerMode: cornerStickerMode,
        customShapes: localStorage.getItem('customShapesForParityTracerLibrary'),
        customAlgorithms: JSON.stringify(Array.from(customAlgorithms.entries()))
    };
    
    for (const item of data) {
        const customAlgs = customAlgorithms.get(item.name);
        const oddAlgos = customAlgs && customAlgs.odd ? customAlgs.odd : (item.odd || []);
        const evenAlgos = customAlgs && customAlgs.even ? customAlgs.even : (item.even || []);
        const allAlgorithms = [...oddAlgos, ...evenAlgos];
        
        let dynamicOddAlgos = [];
        let dynamicEvenAlgos = [];
        
        for (const alg of allAlgorithms) {
            if (!alg || alg.trim() === '') continue;
            
            if (alg === 'Done!') {
                dynamicEvenAlgos.push(alg);
                continue;
            }
            
            try {
                const setup = invertScramble(alg);
                const parityText = window.Square1ParityAnalyzerLibraryWithSillyNames.getParityTextFromScramblePlease(setup, {
                    topColor: colorScheme.topColor,
                    bottomColor: colorScheme.bottomColor,
                    frontColor: colorScheme.frontColor,
                    rightColor: colorScheme.rightColor,
                    backColor: colorScheme.backColor,
                    leftColor: colorScheme.leftColor
                }, cornerStickerMode);
                
                if (parityText === 'Odd') {
                    dynamicOddAlgos.push(alg);
                } else if (parityText === 'Even') {
                    dynamicEvenAlgos.push(alg);
                }
            } catch (error) {
                console.error('Error testing algorithm:', alg, error);
            }
        }
        
        cachedParityAlgorithms.set(item.name, {
            odd: dynamicOddAlgos,
            even: dynamicEvenAlgos
        });
    }
}

// Function to check if parity needs recalculation
function needsParityRecalculation() {
    if (!lastParityCalculationSettings) return true;
    
    const currentSettings = {
        colorScheme: JSON.stringify(colorScheme),
        cornerStickerMode: cornerStickerMode,
        customShapes: localStorage.getItem('customShapesForParityTracerLibrary'),
        customAlgorithms: JSON.stringify(Array.from(customAlgorithms.entries()))
    };
    
    return (
        currentSettings.colorScheme !== lastParityCalculationSettings.colorScheme ||
        currentSettings.cornerStickerMode !== lastParityCalculationSettings.cornerStickerMode ||
        currentSettings.customShapes !== lastParityCalculationSettings.customShapes ||
        currentSettings.customAlgorithms !== lastParityCalculationSettings.customAlgorithms
    );
}

// Load saved state
try {
    const saved = localStorage.getItem('sq1-parity-progress');
    if (saved) {
        const state = JSON.parse(saved);
        learnedCases = new Set(state.learned || []);
        learningCases = new Set(state.learning || []);
        plannedCases = new Set(state.planned || []);
        comments = new Map(Object.entries(state.comments || {}));
        plannedLevels = new Map(Object.entries(state.plannedLevels || {}));
        parityOrientations = new Map(Object.entries(state.parityOrientations || {}));
        showPaths = true; // Always true now
        enablePriorityLearning = true; // Always true now
        hideInstructions = state.hideInstructions || false;
        hideParenthesis = state.hideParenthesis || false;
        colorScheme = state.colorScheme || colorScheme;
        scrambleImageSize = state.scrambleImageSize || 200;
        if (state.customShapesForParityTracerLibrary) {
            localStorage.setItem('customShapesForParityTracerLibrary', state.customShapesForParityTracerLibrary);
        }
        perCaseSubtitles = new Map(Object.entries(state.perCaseSubtitles || {}));
        cornerStickerMode = state.cornerStickerMode || 'counterclockwise';
        customAlgorithms = new Map(Object.entries(state.customAlgorithms || {}));
        generalNotes = state.generalNotes || '';
        
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
        
        // Load cached parity calculations
        if (state.cachedParityAlgorithms) {
            cachedParityAlgorithms = new Map(Object.entries(state.cachedParityAlgorithms));
        }
        if (state.lastParityCalculationSettings) {
            lastParityCalculationSettings = state.lastParityCalculationSettings;
        }
    }
    
    // Load allowCaseEdit separately (not part of export/import)
    const allowCaseEditSaved = localStorage.getItem('allowCaseEdit');
    if (allowCaseEditSaved !== null) {
        window.allowCaseEdit = allowCaseEditSaved === 'true';
    }

    // Initialize all cases as planned with priority 4 (Normal) if not already set
    data.forEach(item => {
        if (!learnedCases.has(item.name) && !learningCases.has(item.name) && !plannedCases.has(item.name)) {
            plannedCases.add(item.name);
            plannedLevels.set(item.name, 4);
        }
        if (!plannedLevels.has(item.name) && plannedCases.has(item.name)) {
            plannedLevels.set(item.name, 4);
        }
    });
    saveState();
} catch (e) {
    console.error('Error loading saved state:', e);
}

// Function to initialize SVG data from defaults if needed
function initializeSVGData() {
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
    showPaths = true;
    enablePriorityLearning = true;
    
    // Initialize display names from defaults
    displayNames = { ...defaultDisplayNames };
    
    saveState();
}

function saveState() {
    localStorage.setItem('sortMode', currentSortMode);
    localStorage.setItem('allowCaseEdit', window.allowCaseEdit.toString());
    localStorage.setItem('currentPreset', currentPreset);
    try {
        localStorage.setItem('sq1-parity-progress', JSON.stringify({
            learned: Array.from(learnedCases),
            learning: Array.from(learningCases),
            planned: Array.from(plannedCases),
            comments: Object.fromEntries(comments),
            plannedLevels: Object.fromEntries(plannedLevels),
            parityOrientations: Object.fromEntries(parityOrientations),
            showPaths: true,
            enablePriorityLearning: true,
            displayNames: displayNames,
            hideInstructions: hideInstructions,
            hideParenthesis: hideParenthesis,
            colorScheme: colorScheme,
            scrambleImageSize: scrambleImageSize,
            customShapesForParityTracerLibrary: localStorage.getItem('customShapesForParityTracerLibrary'),
            perCaseSubtitles: Object.fromEntries(perCaseSubtitles),
            cornerStickerMode: cornerStickerMode,
            customAlgorithms: Object.fromEntries(customAlgorithms),
            svgData: window.svgData,
            cachedParityAlgorithms: Object.fromEntries(cachedParityAlgorithms),
            lastParityCalculationSettings: lastParityCalculationSettings,
            generalNotes: generalNotes,
        }));
    } catch (e) {
        console.error('Error saving state:', e);
    }
}

// Load preset data
async function loadPresetData(presetName) {
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
function getPresetDefaults() {
    if (!presetData) return null;
    return presetData;
}

// Load preset data to use as defaults only (doesn't overwrite user data)
async function loadPresetAsDefaults(presetName) {
    const data = await loadPresetData(presetName);
    if (!data) return false;
    
    currentPreset = presetName;
    presetData = data;
    localStorage.setItem('currentPreset', currentPreset);
    
    return true;
}

// Apply preset (overwrites all user data - only used on first load or explicit switch)
window.applyPreset = async function(presetName, skipWarning = false, silent = false) {
    const data = await loadPresetData(presetName);
    if (!data) return;
    
    // Apply all preset data
    learnedCases = new Set(data.learned || []);
    learningCases = new Set(data.learning || []);
    plannedCases = new Set(data.planned || []);
    comments = new Map(Object.entries(data.comments || {}));
    plannedLevels = new Map(Object.entries(data.plannedLevels || {}));
    parityOrientations = new Map(Object.entries(data.parityOrientations || {}));
    
    if (data.displayNames) {
        displayNames = data.displayNames;
    }
    
    hideInstructions = data.hideInstructions || false;
    hideParenthesis = false;
    colorScheme = data.colorScheme || colorScheme;
    scrambleImageSize = data.scrambleImageSize || 200;
    
    if (data.customShapesForParityTracerLibrary) {
        localStorage.setItem('customShapesForParityTracerLibrary', data.customShapesForParityTracerLibrary);
    }
    
    perCaseSubtitles = new Map(Object.entries(data.perCaseSubtitles || {}));
    cornerStickerMode = data.cornerStickerMode || 'counterclockwise';
    customAlgorithms = new Map(Object.entries(data.customAlgorithms || {}));
    generalNotes = data.generalNotes || '';
    
    if (data.svgData) {
        window.svgData = data.svgData;
    }
    
    if (data.cachedParityAlgorithms) {
        cachedParityAlgorithms = new Map(Object.entries(data.cachedParityAlgorithms));
    }
    
    if (data.lastParityCalculationSettings) {
        lastParityCalculationSettings = data.lastParityCalculationSettings;
    }
    
    if (data.showHints !== undefined) {
        showHints = data.showHints;
        localStorage.setItem('showHints', showHints);
        applyHintVisibility();
    }
    
    currentPreset = presetName;
    presetData = data;
    
    saveState();
    updateProgress();
    
    // Recalculate parity
    if (needsParityRecalculation()) {
        calculateAndCacheAllParity();
    }
    
    render();
    
    if (!skipWarning && !silent) {
        showToast(`Preset "${presetName}" applied successfully!`, 3000, 'success');
    }
}

// Initialize preset on load (just loads as defaults, doesn't overwrite user data)
window.initializePreset = async function() {
    const savedPreset = localStorage.getItem('currentPreset') || 'Default_Preset';
    const success = await loadPresetAsDefaults(savedPreset);
    if (!success) {
        // Fallback to default if saved preset doesn't exist
        await loadPresetAsDefaults('Default_Preset');
    }
}

function exportData() {
    const state = {
        learned: Array.from(learnedCases),
        learning: Array.from(learningCases),
        planned: Array.from(plannedCases),
        comments: Object.fromEntries(comments),
        plannedLevels: Object.fromEntries(plannedLevels),
        parityOrientations: Object.fromEntries(parityOrientations),
        showPaths: true,
        displayNames: displayNames,
        showHints: showHints,
        hideInstructions: hideInstructions,
        colorScheme: colorScheme,
        scrambleImageSize: scrambleImageSize,
        customShapesForParityTracerLibrary: localStorage.getItem('customShapesForParityTracerLibrary'),
        perCaseSubtitles: Object.fromEntries(perCaseSubtitles),
        cachedParityAlgorithms: Object.fromEntries(cachedParityAlgorithms),
        lastParityCalculationSettings: lastParityCalculationSettings,
        cornerStickerMode: cornerStickerMode,
        customAlgorithms: Object.fromEntries(customAlgorithms),
        svgData: window.svgData,
        generalNotes: generalNotes
    };
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sq1-parity-progress.json';
    link.click();
    URL.revokeObjectURL(url);
}

function importData(jsonStr) {
    try {
        const state = JSON.parse(jsonStr);
        learnedCases = new Set(state.learned || []);
        learningCases = new Set(state.learning || []);
        plannedCases = new Set(state.planned || []);
        comments = new Map(Object.entries(state.comments || {}));
        plannedLevels = new Map(Object.entries(state.plannedLevels || {}));
        parityOrientations = new Map(Object.entries(state.parityOrientations || {}));
        showPaths = true;
        
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
        hideParenthesis = false;
        colorScheme = state.colorScheme || colorScheme;
        if (state.customShapesForParityTracerLibrary) {
            localStorage.setItem('customShapesForParityTracerLibrary', state.customShapesForParityTracerLibrary);
        }
        perCaseSubtitles = new Map(Object.entries(state.perCaseSubtitles || {}));
        cornerStickerMode = state.cornerStickerMode || 'counterclockwise';
        customAlgorithms = new Map(Object.entries(state.customAlgorithms || {}));
        generalNotes = state.generalNotes || '';
        
        // Load custom SVG data
        if (state.svgData) {
            window.svgData = state.svgData;
        }
        
        // Load cached parity calculations
        if (state.cachedParityAlgorithms) {
            cachedParityAlgorithms = new Map(Object.entries(state.cachedParityAlgorithms));
        }
        if (state.lastParityCalculationSettings) {
            lastParityCalculationSettings = state.lastParityCalculationSettings;
        }
        
        generalNotes = state.generalNotes || '';
        
        if (state.showHints !== undefined) {
            showHints = state.showHints;
            localStorage.setItem('showHints', showHints);
            applyHintVisibility();
        }
        if (state.customShapesForParityTracerLibrary) {
            localStorage.setItem('customShapesForParityTracerLibrary', state.customShapesForParityTracerLibrary);
        }
        saveState();
        updateProgress();
        render();
        showToast('Data imported successfully!', 3000, 'success');
    } catch (e) {
        showToast('Error importing data: ' + e.message, 3000, 'error');
    }
}

function handleFileImport(file) {
    const reader = new FileReader();
    reader.onload = (e) => importData(e.target.result);
    reader.readAsText(file);
}

// DOM element references - will be initialized after DOM is ready
let searchInput = null;
let sortSelect = null;
let learnFilterSelect = null;
let grid = null;

// Initialize DOM references
function initializeDOMReferences() {
    searchInput = document.getElementById('search');
    sortSelect = document.getElementById('sort');
    learnFilterSelect = document.getElementById('learnFilter');
    grid = document.getElementById('grid');

    const refsFound = {
        searchInput: !!searchInput,
        sortSelect: !!sortSelect,
        learnFilterSelect: !!learnFilterSelect,
        grid: !!grid
    };
}

// Dynamic SVG scaling based on viewport width
let resizeTimer;
function updateSVGScaling() {
    // No longer needed - CSS handles scaling with aspect-ratio
}

// Debounced resize handler for better performance
function handleResize() {
    // Reserved for future resize logic if needed
}

// Update on load and resize
window.addEventListener('load', updateSVGScaling);
window.addEventListener('resize', handleResize);

// Also call after rendering cards
const originalRender = window.render;
if (typeof originalRender === 'function') {
    window.render = function () {
        originalRender();
        // Small delay to ensure SVGs are in DOM
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