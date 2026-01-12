// Defines all aliases and UI options
const shapeAliases = {
    "Muffin": { aliases: ["muffin", "mushroom"], options: ["Muffin", "Mushroom"] },
    "6": { aliases: ["6", "6-0", "60"], options: ["6", "6-0", "60"] },
    "8": { aliases: ["8", "8-0", "80", "dome"], options: ["8", "8-0", "80", "Dome"] },
    "4-4": { aliases: ["4-4", "44", "eye", "seashell"], options: ["4-4", "44", "Eye", "Seashell"] },
    "7-1": { aliases: ["7-1", "71", "observatory"], options: ["7-1", "71", "Observatory"] },
    "5-3": { aliases: ["5-3", "53"], options: ["5-3", "53"] },
    "2-2-2": { aliases: ["2-2-2", "222", "fan", "trefoil", "radioactive"], options: ["2-2-2", "222", "Fan", "Trefoil", "Radioactive"] },
    "6-2": { aliases: ["6-2", "62"], options: ["6-2", "62"] },
    "Perpendicular Edges": { aliases: ["perpendicular edges", "l-shape", "l shape", "arrow"], options: ["Perpendicular Edges", "L-Shape", "Arrow"] },
    "Parallel Edges": { aliases: ["parallel edges", "line", "crown"], options: ["Parallel Edges", "Line", "Crown"] },
    "Paired Edges": { aliases: ["paired edges", "pair"], options: ["Paired Edges", "Pair"] },
    "5-1": { aliases: ["5-1", "51", "tree"], options: ["5-1", "51", "Tree"] },
    "4-2": { aliases: ["4-2", "42", "knight"], options: ["4-2", "42", "Knight"] },
    "3-3": { aliases: ["3-3", "33", "missile"], options: ["3-3", "33", "Missile"] },
    "4-1-1": { aliases: ["4-1-1", "411", "squid", "jellyfish"], options: ["4-1-1", "411", "Squid", "Jellyfish"] },
    "3-1-2": { aliases: ["3-1-2", "312"], options: ["3-1-2", "312"] },
    "3-2-1": { aliases: ["3-2-1", "321"], options: ["3-2-1", "321"] },
    "Pawn": { aliases: ["pawn", "paw"], options: ["Pawn", "Paw"] },
    "Kite": { aliases: ["kite"], options: ["Kite"] },
    "Square": { aliases: ["square"], options: ["Square"] },
    "Star": { aliases: ["star"], options: ["Star"] },
    "Barrel": { aliases: ["barrel"], options: ["Barrel"] },
    "Scallop": { aliases: ["scallop"], options: ["Scallop"] },
    "Shield": { aliases: ["shield"], options: ["Shield"] },
    "Fist": { aliases: ["fist"], options: ["Fist"] }
};

// Alphabetized list of base shapes for the settings UI
const baseShapes = [
    "2-2-2", "3-1-2", "3-2-1", "3-3", "4-1-1", "4-2", "4-4", "5-1", "5-3", "6", "6-2", "7-1", "8",
    "Barrel", "Fist", "Kite", "Muffin", "Paired Edges", "Parallel Edges", "Pawn",
    "Perpendicular Edges", "Scallop", "Shield", "Square", "Star"
];
// Shapes that can have Left/Right prefix
const shapesWithLR = ["Pawn", "Fist", "4-2", "5-1"];

let filteredData = [...data];
let learnedCases = new Set();
let learningCases = new Set();
let plannedCases = new Set();
let comments = new Map(); // stores {caseName: "comment text"}
let plannedLevels = new Map(); // stores {caseName: 1-6}
let perCaseSwapLR = new Map(); // stores {caseName: true/false} for per-case L/R swap
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

// User's saved preferences
let caseNameSettings = new Map(); // Stores {shape: "SelectedName"}
let customCaseNames = new Map();  // Stores {shape: "CustomText"}
let swapShapeLR = new Map();      // Stores {shape: true/false} for swapping L/R at the base shape level
let perCaseCustomNames = new Map(); // Stores {caseName: "CustomName"}
let showPaths = true;         // Shape paths always shown
let lrPosition = 'front';         // Position of L/R prefix: 'front' or 'back'
let enablePriorityLearning = true; // Priority learning always enabled
let hideInstructions = false; // Toggle for hiding instruction buttons
let generalNotes = ''; // HTML content for general notes
// --- End New Case Name Settings ---
let useShortLR = false;
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

// Check if this is first load BEFORE loading state
const isFirstLoad = !localStorage.getItem('sq1-parity-progress');

// Function to calculate and cache parity for all cases
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
        perCaseSwapLR = new Map(Object.entries(state.perCaseSwapLR || {}));
        parityOrientations = new Map(Object.entries(state.parityOrientations || {}));
        // Load new name settings
        caseNameSettings = new Map(Object.entries(state.caseNameSettings || {}));
        customCaseNames = new Map(Object.entries(state.customCaseNames || {}));
        swapShapeLR = new Map(Object.entries(state.swapShapeLR || {}));
        showPaths = true; // Always true now
        useShortLR = state.useShortLR !== undefined ? state.useShortLR : true;
        lrPosition = state.lrPosition || 'front';
        enablePriorityLearning = true; // Always true now
        hideInstructions = state.hideInstructions || false;
        colorScheme = state.colorScheme || colorScheme;
        scrambleImageSize = state.scrambleImageSize || 200;
        if (state.customShapesForParityTracerLibrary) {
            localStorage.setItem('customShapesForParityTracerLibrary', state.customShapesForParityTracerLibrary);
        }
        perCaseCustomNames = new Map(Object.entries(state.perCaseCustomNames || {}));
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
    // Set showHints to true for first load
    showHints = true;
    localStorage.setItem('showHints', 'true');
    // Default case name settings
    caseNameSettings.set('Paired Edges', 'Pair');
    caseNameSettings.set('Perpendicular Edges', 'L-Shape');
    caseNameSettings.set('Parallel Edges', 'Line');

    // Default toggles
    useShortLR = true;
    lrPosition = 'front';
    showPaths = true;
    showHints = true;  // Changed to true for tracing guides
    useDynamicParity = false;
    enablePriorityLearning = true;

    // Note: sortSelect.value will be set after DOM is ready

    saveState();
}

// Apply case name defaults if not already set (for existing users too)
if (!caseNameSettings.has('Paired Edges')) {
    caseNameSettings.set('Paired Edges', 'Pair');
}
if (!caseNameSettings.has('Perpendicular Edges')) {
    caseNameSettings.set('Perpendicular Edges', 'L-Shape');
}
if (!caseNameSettings.has('Parallel Edges')) {
    caseNameSettings.set('Parallel Edges', 'Line');
}

function saveState() {
    localStorage.setItem('sortMode', currentSortMode);
    try {
        localStorage.setItem('sq1-parity-progress', JSON.stringify({
            learned: Array.from(learnedCases),
            learning: Array.from(learningCases),
            planned: Array.from(plannedCases),
            comments: Object.fromEntries(comments),
            plannedLevels: Object.fromEntries(plannedLevels),
            perCaseSwapLR: Object.fromEntries(perCaseSwapLR),
            perCaseCustomNames: Object.fromEntries(perCaseCustomNames),
            parityOrientations: Object.fromEntries(parityOrientations),
            // Save new name settings
            caseNameSettings: Object.fromEntries(caseNameSettings),
            customCaseNames: Object.fromEntries(customCaseNames),
            swapShapeLR: Object.fromEntries(swapShapeLR),
            showPaths: true,
            useShortLR: useShortLR,
            lrPosition: lrPosition,
            enablePriorityLearning: true,
            hideInstructions: hideInstructions,
            colorScheme: colorScheme,
            scrambleImageSize: scrambleImageSize,
            customShapesForParityTracerLibrary: localStorage.getItem('customShapesForParityTracerLibrary'),
            perCaseCustomNames: Object.fromEntries(perCaseCustomNames),
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

function exportData() {
    const state = {
        learned: Array.from(learnedCases),
        learning: Array.from(learningCases),
        planned: Array.from(plannedCases),
        comments: Object.fromEntries(comments),
        plannedLevels: Object.fromEntries(plannedLevels),
        perCaseSwapLR: Object.fromEntries(perCaseSwapLR),
        parityOrientations: Object.fromEntries(parityOrientations),
        caseNameSettings: Object.fromEntries(caseNameSettings),
        customCaseNames: Object.fromEntries(customCaseNames),
        swapShapeLR: Object.fromEntries(swapShapeLR),
        showPaths: true,
        showHints: showHints,
        hideInstructions: hideInstructions,
        colorScheme: colorScheme,
        scrambleImageSize: scrambleImageSize,
        customShapesForParityTracerLibrary: localStorage.getItem('customShapesForParityTracerLibrary'),
        perCaseCustomNames: Object.fromEntries(perCaseCustomNames),
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
        perCaseSwapLR = new Map(Object.entries(state.perCaseSwapLR || {}));
        parityOrientations = new Map(Object.entries(state.parityOrientations || {}));
        caseNameSettings = new Map(Object.entries(state.caseNameSettings || {}));
        customCaseNames = new Map(Object.entries(state.customCaseNames || {}));
        swapShapeLR = new Map(Object.entries(state.swapShapeLR || {}));
        showPaths = true; // Always true now
        hideInstructions = state.hideInstructions || false;
        colorScheme = state.colorScheme || colorScheme;
        if (state.customShapesForParityTracerLibrary) {
            localStorage.setItem('customShapesForParityTracerLibrary', state.customShapesForParityTracerLibrary);
        }
        perCaseCustomNames = new Map(Object.entries(state.perCaseCustomNames || {}));
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
    const viewportWidth = window.innerWidth;
    let scale;

    // Calculate scale based on viewport width
    if (viewportWidth >= 1400) {
        // Large screens: base scale
        scale = Math.min(1, viewportWidth / 1400);
    } else if (viewportWidth >= 1040) {
        // Medium-large screens (3 columns to 2 columns transition)
        scale = Math.min(1, viewportWidth / 1200);
    } else if (viewportWidth >= 1000) {
        // Transition zone: 3 col → 2 col - scale boost then decrease
        // At 1040px: scale = 1.15, gradually decreases to 1.0 at 1000px
        const boostFactor = 1.15 - ((1040 - viewportWidth) / (1040 - 1000)) * 0.15;
        scale = Math.max(1.0, boostFactor);
    } else if (viewportWidth >= 650) {
        // Medium screens (2 columns)
        scale = Math.min(1, viewportWidth / 900);
    } else if (viewportWidth >= 570) {
        // Single column mode - scale boost then decrease
        // At 649px: scale = 1.25, gradually decreases to 1.0 at 570px
        const boostFactor = 1.25 - ((649 - viewportWidth) / (649 - 570)) * 0.25;
        scale = Math.max(1.0, boostFactor);
    } else if (viewportWidth >= 400) {
        // Below 570px: continue scaling down from 1.0
        scale = Math.max(0.8, viewportWidth / 570);
    } else {
        // Extra small screens
        scale = Math.max(0.65, viewportWidth / 500);
    }

    // Apply scale to all card SVGs with will-change for better performance
    document.querySelectorAll('.card-svg-container svg').forEach(svg => {
        svg.style.transform = `scale(${scale})`;
        svg.style.transformOrigin = 'center center';
        svg.style.willChange = 'transform';
    });

    // Apply scale to modal SVGs (both in detail modal and other modals)
    document.querySelectorAll('.modal-images svg, .modal-body svg').forEach(svg => {
        // Keep modal SVGs at full size until 768px, then scale down
        let modalScale = 1;
        if (viewportWidth < 768) {
            if (viewportWidth < 400) {
                modalScale = Math.max(0.6, viewportWidth / 600);
            } else if (viewportWidth < 570) {
                modalScale = Math.max(0.75, viewportWidth / 650);
            } else {
                modalScale = Math.max(0.85, viewportWidth / 768);
            }
        }
        svg.style.transform = `scale(${modalScale})`;
        svg.style.transformOrigin = 'center center';
        svg.style.willChange = 'transform';
    });

    // Update floating buttons container size for narrow screens
    const floatingBtnsContainer = document.getElementById('floatingButtonsContainer');
    if (floatingBtnsContainer) {
        if (viewportWidth < 400) {
            const btnScale = Math.max(0.5, viewportWidth / 600);
            floatingBtnsContainer.style.transform = `scale(${btnScale})`;
            floatingBtnsContainer.style.transformOrigin = 'top right';
        } else if (viewportWidth < 570) {
            const btnScale = Math.max(0.6, viewportWidth / 700);
            floatingBtnsContainer.style.transform = `scale(${btnScale})`;
            floatingBtnsContainer.style.transformOrigin = 'top right';
        } else if (viewportWidth < 768) {
            const btnScale = Math.max(0.75, viewportWidth / 850);
            floatingBtnsContainer.style.transform = `scale(${btnScale})`;
            floatingBtnsContainer.style.transformOrigin = 'top right';
        } else {
            floatingBtnsContainer.style.transform = 'scale(1)';
        }
    }
}

// Debounced resize handler for better performance
function handleResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateSVGScaling, 50);
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