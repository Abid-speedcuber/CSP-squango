// Training modal variables
let currentTrainingCase = null;
let trainingScrambles = [];
let currentScrambleIndex = 0;
let timerRunning = false;
let timerStartTime = 0;
let timerInterval = null;
let timerElapsed = 0;
let isHolding = false;
let preGeneratedScrambles = [];
let currentScrambleText = '';
let trainingModalElement = null;
let scrambleHistory = [];
let currentHistoryIndex = -1;
let trainingScrambleImageSize = 200;
let trainingScrambleTextSize = 16;
let trainingHoldToStart = 0.22;
let holdStartTime = 0;
let isHoldReady = false;

// Create the training modal dynamically
function createTrainingModal() {
    if (trainingModalElement) return;

    const modal = document.createElement('div');
    modal.id = 'trainingModal';
    modal.className = 'training-modal';
    modal.innerHTML = `
        <div class="training-modal-header">
            <div style="display: flex; gap: 10px; align-items: center;">
                <button class="training-modal-title" id="trainingCaseName" style="background: none; border: none; cursor: pointer; padding: 0; font: inherit; text-align: left; color: #007bff; text-decoration: underline;" title="Click to select angles to train">Training: Case Name</button>
                <button class="training-modal-info training-info-btn" id="trainingInfoBtn" title="Training mode help">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                </button>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <button class="training-modal-refresh" id="trainingPrevBtn" title="Previous scramble">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <button class="training-modal-refresh" id="trainingRefreshBtn" title="Regenerate scramble">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                    </svg>
                </button>
                <button class="training-modal-refresh" id="trainingSettingsBtn" title="Training settings">
                    <img src="res/training-settings.svg" height="20 px" width="20 px">
                </button>
                <button class="training-modal-close" id="trainingCloseBtn" title="Close training">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
        <div class="training-modal-scramble" id="trainingScramble" title="Click to analyze parity">Loading...</div>
        <div class="training-modal-timer-zone" id="trainingTimerZone">
            <div class="training-modal-image-container">
                <div class="training-modal-image" id="trainingScrambleImage"></div>
            </div>
            <div class="training-modal-timer" id="trainingTimer">0.000</div>
        </div>
    <div id="prevScrambleBar" style="position:fixed; bottom:0; left:0; width:100%; display:none; padding:8px 16px; background:#f0f0f0; border-top:1px solid #e0e0e0; font-family:Consolas,Monaco,'Courier New',monospace; color:#666; text-align:center; z-index:10001; box-sizing:border-box;"><span style="color:#bbb; font-style:italic;">No previous scramble to show</span></div>
    `;
    
    document.body.appendChild(modal);
    trainingModalElement = modal;

    // Add event listeners
    document.getElementById('trainingRefreshBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        nextScrambleManual();
    });

    document.getElementById('trainingPrevBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        previousScramble();
    });

    document.getElementById('trainingCloseBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        closeTrainingModal();
    });

    document.getElementById('trainingScramble').addEventListener('click', (e) => {
        e.stopPropagation();
        openParityAnalysisFromTraining();
    });

    document.getElementById('trainingCaseName').addEventListener('click', (e) => {
        e.stopPropagation();
        openShapeIndexSelector();
    });

    document.getElementById('trainingInfoBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        openTrainingInfoModal();
    });

    document.getElementById('trainingSettingsBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        openTrainingSettingsModal();
    });

    const timerZone = document.getElementById('trainingTimerZone');

    // Mouse events for timer zone
    timerZone.addEventListener('mousedown', handleTimerMouseDown);
    timerZone.addEventListener('mouseup', handleTimerMouseUp);
    timerZone.addEventListener('mouseleave', handleTimerMouseLeave);

    // Touch events for timer zone
    timerZone.addEventListener('touchstart', handleTimerTouchStart);
    timerZone.addEventListener('touchend', handleTimerTouchEnd);
}

function openTrainingModal(caseName) {
    createTrainingModal();

    const modal = document.getElementById('trainingModal');
    const titleEl = document.getElementById('trainingCaseName');

    currentTrainingCase = caseName;

    pushModalState('trainingModal', closeTrainingModal);

    // Find the original data item to get the canonical name
    const dataItem = data.find(d => d.name === caseName);
    if (!dataItem) {
        alert('Case not found.');
        return;
    }

    // Use the canonical name from the data item to look up in shapeIndex
    const shapeIndexItem = shapeIndex.find(s => s.name === dataItem.name);
    if (!shapeIndexItem) {
        alert('Case not found in shape index.');
        return;
    }

    // Get all available scrambles (org + mir)
    const allScrambles = [...(shapeIndexItem.org || []), ...(shapeIndexItem.mir || [])];

    // Use selected indices if they exist in memory, otherwise use all
    const selectedKey = `training_selected_${caseName}`;
    if (window.trainingSelections && window.trainingSelections[selectedKey]) {
        trainingScrambles = window.trainingSelections[selectedKey];
    } else {
        trainingScrambles = allScrambles;
        // Initialize selection storage
        if (!window.trainingSelections) window.trainingSelections = {};
        window.trainingSelections[selectedKey] = allScrambles;
    }

    if (trainingScrambles.length === 0) {
        alert('No training scrambles available for this case.');
        return;
    }

    titleEl.textContent = `Training: ${getDisplayName(caseName)}`;
    currentScrambleIndex = 0;
    preGeneratedScrambles = [];
    timerElapsed = 0;
    scrambleHistory = [];
    currentHistoryIndex = -1;
    isHoldReady = false;

    // Load training-specific settings
    const savedTrainingImageSize = localStorage.getItem('trainingScrambleImageSize');
    const savedTrainingTextSize = localStorage.getItem('trainingScrambleTextSize');
    const savedTrainingHoldToStart = localStorage.getItem('trainingHoldToStart');

    trainingScrambleImageSize = savedTrainingImageSize ? parseInt(savedTrainingImageSize) : 200;
    trainingScrambleTextSize = savedTrainingTextSize ? parseInt(savedTrainingTextSize) : 16;
    trainingHoldToStart = savedTrainingHoldToStart ? parseFloat(savedTrainingHoldToStart) : 0.22;

    // Pre-generate 3 scrambles
    for (let i = 0; i < 3; i++) {
        preGeneratedScrambles.push(generateNextScrambleData());
    }

    displayNextScramble();
    
    modal.classList.add('active');
    document.body.classList.add('modal-open');
    applyPrevScrambleBar();
}

function closeTrainingModal() {
    const modal = document.getElementById('trainingModal');
    if (!modal) return;

    modal.classList.remove('active');
    document.body.classList.remove('modal-open');

    // Stop timer if running
    if (timerRunning) {
        stopTimerOnly();
    }

    // Reset all training state
    preGeneratedScrambles = [];
    timerElapsed = 0;
    scrambleHistory = [];
    currentHistoryIndex = -1;
    currentTrainingCase = null;
    isHoldReady = false;

    // Soft render when coming back from training
    filterAndSort(true);
}

window.generateNextScrambleData = generateNextScrambleData;
window._origGenerateNextScrambleData_ref = null; // will be set by selector
function generateNextScrambleData() {
    if (trainingScrambles.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * trainingScrambles.length);
    const scramble = trainingScrambles[randomIndex];
    const hexCode = generateHexFromShapeIndex(scramble);

    let scrambleText = hexCode;
    try {
        const state = parseHexFormat(hexCode);
        scrambleText = window.sq1Tools.scrambleFromState(state) || hexCode;

        // Apply scramble styling
        if (typeof SQ1ColorizerLib !== 'undefined' && SQ1ColorizerLib.processScramble) {
            const processed = SQ1ColorizerLib.processScramble(scrambleText);
            scrambleText = processed.html || scrambleText;
        }
    } catch (error) {
        console.error('Error generating scramble:', error);
    }

    let scrambleImage = '<div style="color: #999;">Image unavailable</div>';
    try {
        // Use training-specific image size
        if (typeof visualizeFromScrambleNotationPlease !== 'undefined') {
            const scrambleNotation = hexCode;
            try {
                const state = parseHexFormat(hexCode);
                const notation = window.sq1Tools.scrambleFromState(state) || hexCode;
                scrambleImage = visualizeFromScrambleNotationPlease(notation, trainingScrambleImageSize, colorScheme);
            } catch (e) {
                console.error('Error with new visualizer:', e);
                scrambleImage = generateScrambleSVGFromHex(hexCode);
            }
        } else {
            scrambleImage = generateScrambleSVGFromHex(hexCode);
        }
    } catch (error) {
        console.error('Error generating scramble image:', error);
    }

    return { text: scrambleText, image: scrambleImage };
}

window.displayNextScramble = displayNextScramble;
function displayNextScramble() {
    // Show/hide case subtitle for multi-case mode
    const sub = document.getElementById('multiCaseSub');
    if (sub) sub.style.display = window._multiCaseMode ? 'block' : 'none';

    if (preGeneratedScrambles.length === 0) return;

    // Get the next pre-generated scramble
    const scrambleData = preGeneratedScrambles.shift();

    if (scrambleData) {
        currentScrambleText = scrambleData.text.replace(/<[^>]*>/g, ''); // Strip HTML for clipboard
        const scrambleEl = document.getElementById('trainingScramble');
        scrambleEl.innerHTML = scrambleData.text;
        scrambleEl.style.fontSize = trainingScrambleTextSize + 'px';
        document.getElementById('trainingScrambleImage').innerHTML = scrambleData.image;

        // Add to history
        scrambleHistory.push(scrambleData);
        currentHistoryIndex = scrambleHistory.length - 1;

        // Limit history to 50 scrambles
        if (scrambleHistory.length > 50) {
            scrambleHistory.shift();
            currentHistoryIndex--;
        }
    }

    // Generate a new scramble to keep the queue full (async, won't block)
    setTimeout(() => {
        preGeneratedScrambles.push(generateNextScrambleData());
    }, 0);

    applyPrevScrambleBar();
}

function previousScramble() {
    if (currentHistoryIndex <= 0) return; // No previous scramble
    
    stopTimerOnly();
    currentHistoryIndex--;
    
    const scrambleData = scrambleHistory[currentHistoryIndex];
    currentScrambleText = scrambleData.text.replace(/<[^>]*>/g, '');
    const scrambleEl = document.getElementById('trainingScramble');
    scrambleEl.innerHTML = scrambleData.text;
    scrambleEl.style.fontSize = trainingScrambleTextSize + 'px';
    document.getElementById('trainingScrambleImage').innerHTML = scrambleData.image;
    applyPrevScrambleBar();
}

function nextScrambleManual() {
    stopTimerOnly();
    displayNextScramble();
}

function applyPrevScrambleBar() {
    const bar = document.getElementById('prevScrambleBar');
    if (!bar) return;
    const trainingActive = document.getElementById('trainingModal')?.classList.contains('active');
    const enabled = localStorage.getItem('trainingShowPrevScramble') === 'true';
    bar.style.fontSize = Math.max(10, trainingScrambleTextSize - 2) + 'px';
    if (!enabled || !trainingActive) { bar.style.display = 'none'; return; }
    bar.style.display = 'block';
    const prevIdx = currentHistoryIndex - 1;
    if (prevIdx < 0 || !scrambleHistory[prevIdx]) {
        bar.innerHTML = '<span style="color:#bbb; font-style:italic; font-family:inherit;">No previous scramble to show</span>';
    } else {
        bar.innerHTML = `<span style="color:#999; font-family:inherit;">Previous scramble: </span>${scrambleHistory[prevIdx].text}`;
    }
}

function regenerateScrambleLookaheadLegacy() {
    preGeneratedScrambles = [];
    for (let i = 0; i < 3; i++) {
        preGeneratedScrambles.push(generateNextScrambleData());
    }
    if (currentHistoryIndex === scrambleHistory.length - 1 || scrambleHistory.length === 0) {
        displayNextScramble();
    }
}

function copyScrambleToClipboard() {
    navigator.clipboard.writeText(currentScrambleText).catch(err => {
        console.error('Failed to copy scramble:', err);
    });
}

function openParityAnalysisFromTraining() {
    // Strip HTML tags to get clean scramble text
    const cleanScramble = currentScrambleText.replace(/<[^>]*>/g, '').trim();

    if (typeof window.ParityTracerLibrary === 'undefined') {
        alert('Parity Tracer library not loaded');
        return;
    }

    window.ParityTracerLibrary.createModal({
        backgroundColor: '#ffffff',
        hideInstructionButton: hideInstructions,
        instructionText1: 'Enter your scramble in the top input bar and press Analyze to trace parity using Kale\'s method.',
        instructionText2: 'You can change the color scheme from Color Scheme Settings in the main Settings menu.',
        instructionText3: 'Customize the tracing start point from the settings button at the bottom right.',
        topColor: colorScheme.topColor,
        topColorName: getColorName(colorScheme.topColor),
        topColorShort: getColorName(colorScheme.topColor).charAt(0),
        bottomColor: colorScheme.bottomColor,
        bottomColorName: getColorName(colorScheme.bottomColor),
        bottomColorShort: getColorName(colorScheme.bottomColor).charAt(0),
        frontColor: colorScheme.frontColor,
        rightColor: colorScheme.rightColor,
        backColor: colorScheme.backColor,
        leftColor: colorScheme.leftColor,
        scrambleText: cleanScramble,
        generateImage: true,
        imageSize: trainingScrambleImageSize || 200
    });
}

// Mouse handlers for timer zone
function handleTimerMouseDown() {
    if (timerRunning) return;
    isHolding = true;
    isHoldReady = false;
    holdStartTime = Date.now();
    document.getElementById('trainingTimer').style.color = '#ffc107';

    // Check hold duration
    const holdCheckInterval = setInterval(() => {
        if (!isHolding) {
            clearInterval(holdCheckInterval);
            return;
        }
        const holdDuration = (Date.now() - holdStartTime) / 1000;
        if (holdDuration >= trainingHoldToStart && !isHoldReady) {
            isHoldReady = true;
            document.getElementById('trainingTimer').style.color = '#28a745';
            clearInterval(holdCheckInterval);
        }
    }, 10);
}

function handleTimerMouseUp() {
    if (timerRunning) {
        // Stop timer and show next scramble immediately
        displayNextScramble();
        stopTimerOnly();
    } else if (isHolding && isHoldReady) {
        isHolding = false;
        isHoldReady = false;
        document.getElementById('trainingTimer').style.color = '#2d3748';
        startTimer();
    } else if (isHolding) {
        isHolding = false;
        isHoldReady = false;
        document.getElementById('trainingTimer').style.color = '#2d3748';
    }
}

function handleTimerMouseLeave() {
    if (isHolding && !timerRunning) {
        isHolding = false;
        isHoldReady = false;
        document.getElementById('trainingTimer').style.color = '#2d3748';
    }
}

// Touch handlers for timer zone
function handleTimerTouchStart(e) {
    e.preventDefault();
    if (timerRunning) return;
    isHolding = true;
    isHoldReady = false;
    holdStartTime = Date.now();
    document.getElementById('trainingTimer').style.color = '#ffc107';

    // Check hold duration
    const holdCheckInterval = setInterval(() => {
        if (!isHolding) {
            clearInterval(holdCheckInterval);
            return;
        }
        const holdDuration = (Date.now() - holdStartTime) / 1000;
        if (holdDuration >= trainingHoldToStart && !isHoldReady) {
            isHoldReady = true;
            document.getElementById('trainingTimer').style.color = '#28a745';
            clearInterval(holdCheckInterval);
        }
    }, 10);
}

function handleTimerTouchEnd(e) {
    e.preventDefault();
    if (timerRunning) {
        displayNextScramble();
        stopTimerOnly();
    } else if (isHolding && isHoldReady) {
        isHolding = false;
        isHoldReady = false;
        document.getElementById('trainingTimer').style.color = '#2d3748';
        startTimer();
    } else if (isHolding) {
        isHolding = false;
        isHoldReady = false;
        document.getElementById('trainingTimer').style.color = '#2d3748';
    }
}

function startTimer() {
    if (timerRunning) return;

    // Reset timer to 0 when starting a new solve
    timerElapsed = 0;
    timerRunning = true;
    timerStartTime = Date.now();

    const timerEl = document.getElementById('trainingTimer');
    timerEl.style.color = '#2d3748';

    timerInterval = setInterval(() => {
        timerElapsed = Date.now() - timerStartTime;
        updateTimerDisplay();
    }, 10);
}

function stopTimerOnly() {
    if (!timerRunning) return;

    timerRunning = false;
    clearInterval(timerInterval);

    const timerEl = document.getElementById('trainingTimer');
    timerEl.style.color = '#2d3748';
}

function updateTimerDisplay() {
    const seconds = (timerElapsed / 1000).toFixed(3);
    document.getElementById('trainingTimer').textContent = seconds;
}

// Shape Index Selector Functions
function openShapeIndexSelector() {
    if (window._multiCaseMode) return;
    const shapeIndexItem = shapeIndex.find(s => s.name === currentTrainingCase);
    if (!shapeIndexItem) return;

    pushModalState('shapeIndexSelectorModal', closeShapeIndexSelector);

    // Lock background
    document.body.classList.add('modal-open');

    // Create or get existing modal
    let selectorModal = document.getElementById('shapeIndexSelectorModal');
    if (!selectorModal) {
        selectorModal = document.createElement('div');
        selectorModal.id = 'shapeIndexSelectorModal';
        selectorModal.className = 'shape-index-selector-modal';
        selectorModal.innerHTML = `
            <div class="shape-index-selector-content">
                <div class="shape-index-selector-header">
                    <span class="shape-index-selector-title">Select Angles to Train</span>
                    <button class="shape-index-selector-close" onclick="closeShapeIndexSelector()">&times;</button>
                </div>
                <div class="shape-index-selector-body" id="shapeIndexSelectorBody"></div>
            </div>
        `;
        document.body.appendChild(selectorModal);
    }

    const selectedKey = `training_selected_${currentTrainingCase}`;
    const currentSelection = window.trainingSelections?.[selectedKey] || [];

    const body = document.getElementById('shapeIndexSelectorBody');

    // Generate shape visuals
    const orgShapes = (shapeIndexItem.org || []).map(idx => {
        const hexCode = convertShapeIndexToHexPlease(idx);
        const shapeHTML = visualizeCubeShapeOutlinesPlease(hexCode, 69, '#e7e7e7ff', '#FFFFFF', 2, -4);
        return `
            <button class="shape-index-toggle ${currentSelection.includes(idx) ? 'active' : ''}" 
                    data-index="${idx}" 
                    data-type="org" 
                    onclick="toggleShapeIndex(${idx})"
                    style="padding: 8px; background: ${currentSelection.includes(idx) ? '#ebebeb' : '#ffffff'}; border: 2px solid #999; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                ${shapeHTML}
            </button>
        `;
    }).join('');

    const mirShapes = (shapeIndexItem.mir || []).map(idx => {
        const hexCode = convertShapeIndexToHexPlease(idx);
        const shapeHTML = visualizeCubeShapeOutlinesPlease(hexCode, 69, '#e7e7e7ff', '#FFFFFF', 2, -4);
        return `
            <button class="shape-index-toggle ${currentSelection.includes(idx) ? 'active' : ''}" 
                    data-index="${idx}" 
                    data-type="mir" 
                    onclick="toggleShapeIndex(${idx})"
                    style="padding: 8px; background: ${currentSelection.includes(idx) ? '#ebebeb' : '#ffffff'}; border: 2px solid #999; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                ${shapeHTML}
            </button>
        `;
    }).join('');

    body.innerHTML = `
        <div class="shape-index-section">
            <div class="shape-index-section-header">
                <span style="font-weight: 600;">Original Orientation</span>
                <div>
                    <button onclick="selectAllIndices('org')" style="padding: 3px 10px; margin-right: 5px; background: #f8f9fa; color: #495057; border: 1px solid #ced4da; border-radius: 3px; cursor: pointer; font-size: 0.8rem;">Select All</button>
                    <button onclick="deselectAllIndices('org')" style="padding: 3px 10px; background: #f8f9fa; color: #495057; border: 1px solid #ced4da; border-radius: 3px; cursor: pointer; font-size: 0.8rem;">Deselect All</button>
                </div>
            </div>
            <div class="shape-index-toggles" id="orgToggles" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(112px, 1fr)); max-width: 100%; gap: 10px; margin-top: 10px;">
                ${orgShapes}
            </div>
        </div>
        <div class="shape-index-section" style="margin-top: 20px;">
            <div class="shape-index-section-header">
                <span style="font-weight: 600;">Mirror Orientation</span>
                <div>
                    <button onclick="selectAllIndices('mir')" style="padding: 3px 10px; margin-right: 5px; background: #f8f9fa; color: #495057; border: 1px solid #ced4da; border-radius: 3px; cursor: pointer; font-size: 0.8rem;">Select All</button>
                    <button onclick="deselectAllIndices('mir')" style="padding: 3px 10px; background: #f8f9fa; color: #495057; border: 1px solid #ced4da; border-radius: 3px; cursor: pointer; font-size: 0.8rem;">Deselect All</button>
                </div>
            </div>
            <div class="shape-index-toggles" id="mirToggles" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(112px, 1fr)); max-width: 100%; gap: 10px; margin-top: 10px;">
                ${mirShapes}
            </div>
        </div>
    `;

    selectorModal.classList.add('active');
}

function toggleShapeIndex(index) {
    const selectedKey = `training_selected_${currentTrainingCase}`;
    if (!window.trainingSelections) window.trainingSelections = {};
    if (!window.trainingSelections[selectedKey]) {
        const shapeIndexItem = shapeIndex.find(s => s.name === currentTrainingCase);
        window.trainingSelections[selectedKey] = [...(shapeIndexItem.org || []), ...(shapeIndexItem.mir || [])];
    }

    const currentSelection = window.trainingSelections[selectedKey];
    const indexPos = currentSelection.indexOf(index);

    if (indexPos > -1) {
        currentSelection.splice(indexPos, 1);
    } else {
        currentSelection.push(index);
    }

    // Update button appearance
    const button = document.querySelector(`button.shape-index-toggle[data-index="${index}"]`);
    if (button) {
        button.classList.toggle('active');
        button.style.background = button.classList.contains('active') ? '#ebebeb' : '#ffffff';
    }

    // Update training scrambles and regenerate lookahead
    trainingScrambles = currentSelection;
    regenerateScrambleLookaheadLegacy();

    // If no indices selected, show warning but don't prevent
    if (currentSelection.length === 0) {
        console.warn('No shape indices selected');
    }
}

function selectAllIndices(type) {
    const shapeIndexItem = shapeIndex.find(s => s.name === currentTrainingCase);
    if (!shapeIndexItem) return;

    const selectedKey = `training_selected_${currentTrainingCase}`;
    if (!window.trainingSelections) window.trainingSelections = {};

    const indices = type === 'org' ? (shapeIndexItem.org || []) : (shapeIndexItem.mir || []);

    // Add all indices of this type to selection
    indices.forEach(idx => {
        if (!window.trainingSelections[selectedKey].includes(idx)) {
            window.trainingSelections[selectedKey].push(idx);
        }
    });

    // Update button appearances
    const buttons = document.querySelectorAll(`button.shape-index-toggle[data-type="${type}"]`);
    buttons.forEach(btn => {
        btn.classList.add('active');
        btn.style.background = '#ebebeb';
    });

    trainingScrambles = window.trainingSelections[selectedKey];
    regenerateScrambleLookaheadLegacy();
}

function deselectAllIndices(type) {
    const shapeIndexItem = shapeIndex.find(s => s.name === currentTrainingCase);
    if (!shapeIndexItem) return;

    const selectedKey = `training_selected_${currentTrainingCase}`;
    if (!window.trainingSelections) window.trainingSelections = {};

    const indices = type === 'org' ? (shapeIndexItem.org || []) : (shapeIndexItem.mir || []);

    // Remove all indices of this type from selection
    window.trainingSelections[selectedKey] = window.trainingSelections[selectedKey].filter(idx => !indices.includes(idx));

    // Update button appearances
    const buttons = document.querySelectorAll(`button.shape-index-toggle[data-type="${type}"]`);
    buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = '#ffffff';
    });

    trainingScrambles = window.trainingSelections[selectedKey];
    regenerateScrambleLookaheadLegacy();
}

function closeShapeIndexSelector() {
    const modal = document.getElementById('shapeIndexSelectorModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
}

// Keyboard events for timer
let spacePressed = false;
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('trainingModal');
    if (!modal || !modal.classList.contains('active')) return;

    if (e.code === 'Escape') {
        e.preventDefault();
        // If any sub-modal is open, close that first
        const infoModal = document.getElementById('trainingInfoModal');
        const settingsModal = document.getElementById('trainingSettingsModal');
        const shapeModal = document.getElementById('shapeIndexSelectorModal');
        const selectorModal = document.getElementById('trainingSelectorModal');
        if (infoModal && infoModal.classList.contains('active')) { closeTrainingInfoModal(); return; }
        if (settingsModal && settingsModal.classList.contains('active')) { closeTrainingSettingsModal(); return; }
        if (shapeModal && shapeModal.classList.contains('active')) { closeShapeIndexSelector(); return; }
        if (selectorModal && selectorModal.style.display !== 'none') { closeSelectorModal(); return; }
        closeTrainingModal();
        return;
    }

    // Any key stops the timer if running
    if (timerRunning) {
        e.preventDefault();
        if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') return; // handled in keyup
        displayNextScramble();
        stopTimerOnly();
        spacePressed = false;
        return;
    }

    if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (!spacePressed) {
            spacePressed = true;
            const timerEl = document.getElementById('trainingTimer');
            timerEl.style.color = '#ffc107'; // Yellow when holding
            if (!timerRunning) {
                isHolding = true;
                isHoldReady = false;
                holdStartTime = Date.now();

                // Check hold duration
                const holdCheckInterval = setInterval(() => {
                    if (!isHolding) {
                        clearInterval(holdCheckInterval);
                        return;
                    }
                    const holdDuration = (Date.now() - holdStartTime) / 1000;
                    if (holdDuration >= trainingHoldToStart && !isHoldReady) {
                        isHoldReady = true;
                        document.getElementById('trainingTimer').style.color = '#28a745';
                        clearInterval(holdCheckInterval);
                    }
                }, 10);
            }
        }
    }
});

document.addEventListener('keyup', (e) => {
    const modal = document.getElementById('trainingModal');
    if (!modal || !modal.classList.contains('active')) return;
    
    if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (timerRunning) {
            displayNextScramble();
            stopTimerOnly();
        } else {
            nextScrambleManual();
        }
        return;
    }

    if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (timerRunning) {
            displayNextScramble();
            stopTimerOnly();
        } else {
            previousScramble();
        }
        return;
    }

    if (e.code === 'Space') {
        e.preventDefault();
        if (spacePressed) {
            spacePressed = false;
            const timerEl = document.getElementById('trainingTimer');
            
            if (isHolding && isHoldReady) {
                isHolding = false;
                isHoldReady = false;
                timerEl.style.color = '#2d3748';
                startTimer();
            } else if (isHolding) {
                isHolding = false;
                isHoldReady = false;
                timerEl.style.color = '#2d3748';
            }
        }
    }
});

function regenerateScrambleLookahead() {
    regenerateScrambleLookaheadLegacy();
}

function openTrainingSettingsModal() {
    pushModalState('trainingSettingsModal', closeTrainingSettingsModal);

    let settingsModal = document.getElementById('trainingSettingsModal');
    if (!settingsModal) {
        settingsModal = document.createElement('div');
        settingsModal.id = 'trainingSettingsModal';
        settingsModal.className = 'training-info-modal';
        settingsModal.innerHTML = `
            <div class="training-info-content">
                <div class="training-info-header">
                    <span class="training-info-title">Training Settings</span>
                    <button class="training-info-close" onclick="closeTrainingSettingsModal()">&times;</button>
                </div>
                <div class="training-info-body">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2d3748;">Scramble Image Size: <span id="trainingImageSizeValue">${trainingScrambleImageSize}px</span></label>
                        <input type="range" id="trainingImageSizeSlider" min="100" max="400" step="10" value="${trainingScrambleImageSize}" style="width: 100%;">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2d3748;">Scramble Text Size: <span id="trainingTextSizeValue">${trainingScrambleTextSize}px</span></label>
                        <input type="range" id="trainingTextSizeSlider" min="10" max="24" step="1" value="${trainingScrambleTextSize}" style="width: 100%;">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2d3748;">Hold to Start: <span id="trainingHoldToStartValue">${trainingHoldToStart.toFixed(2)}s</span></label>
                        <input type="range" id="trainingHoldToStartSlider" min="0.1" max="0.7" step="0.01" value="${trainingHoldToStart}" style="width: 100%;">
                    </div>
                </div>
                    <div style="margin-bottom: 20px; padding: 0 25px;">
                        <label style="display:flex; align-items:center; gap:10px; font-weight:600; color:#2d3748; cursor:pointer;">
                            <input type="checkbox" id="trainingShowPrevScramble" style="transform:scale(1.3); cursor:pointer;">
                            Show previous scramble at bottom
                        </label>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(settingsModal);

        // Restore checkbox state
        const showPrevSaved = localStorage.getItem('trainingShowPrevScramble');
        const showPrevCheckbox = document.getElementById('trainingShowPrevScramble');
        if (showPrevCheckbox) {
            showPrevCheckbox.checked = showPrevSaved === 'true';
            showPrevCheckbox.addEventListener('change', (e) => {
                localStorage.setItem('trainingShowPrevScramble', e.target.checked);
                applyPrevScrambleBar();
            });
        }
        
        // Add event listeners
        document.getElementById('trainingImageSizeSlider').addEventListener('input', (e) => {
            trainingScrambleImageSize = parseInt(e.target.value);
            document.getElementById('trainingImageSizeValue').textContent = trainingScrambleImageSize + 'px';
            localStorage.setItem('trainingScrambleImageSize', trainingScrambleImageSize);
            if (window._multiCaseMode) regenerateMultiScrambleLookahead();
            else regenerateScrambleLookaheadLegacy();
        });

        document.getElementById('trainingTextSizeSlider').addEventListener('input', (e) => {
            trainingScrambleTextSize = parseInt(e.target.value);
            document.getElementById('trainingTextSizeValue').textContent = trainingScrambleTextSize + 'px';
            localStorage.setItem('trainingScrambleTextSize', trainingScrambleTextSize);
            document.getElementById('trainingScramble').style.fontSize = trainingScrambleTextSize + 'px';
            applyPrevScrambleBar();
        });

        document.getElementById('trainingHoldToStartSlider').addEventListener('input', (e) => {
            trainingHoldToStart = parseFloat(e.target.value);
            document.getElementById('trainingHoldToStartValue').textContent = trainingHoldToStart.toFixed(2) + 's';
            localStorage.setItem('trainingHoldToStart', trainingHoldToStart);
        });
    }

    settingsModal.classList.add('active');
}

function closeTrainingSettingsModal() {
    const modal = document.getElementById('trainingSettingsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function openTrainingInfoModal() {
    pushModalState('trainingInfoModal', closeTrainingInfoModal);

    let infoModal = document.getElementById('trainingInfoModal');
    if (!infoModal) {
        infoModal = document.createElement('div');
        infoModal.id = 'trainingInfoModal';
        infoModal.className = 'training-info-modal';
        infoModal.innerHTML = `
            <div class="training-info-content">
                <div class="training-info-header">
                    <span class="training-info-title">Training Mode Guide</span>
                    <button class="training-info-close" onclick="closeTrainingInfoModal()">&times;</button>
                </div>
                <div class="training-info-body">
                    <div class="training-info-item">
                        <div class="training-info-number">1</div>
                        <div class="training-info-text">To select a particular angle or orientation, press the case name and select from there.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">2</div>
                        <div class="training-info-text">If the scramble image is too big or too small, you can change it from settings.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">3</div>
                        <div class="training-info-text">The colored part of the scramble means that's where the cubeshape starts changing. <span style="color: #2196F3; font-weight: 600;">Blue</span> means you have to scramble from (0,0) alignment, <span style="color: #f44336; font-weight: 600;">red</span> means you have to scramble from (1, -1) alignment.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">4</div>
                        <div class="training-info-text">To use the parity tracing guide, directly click on the scramble.</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(infoModal);
    }

    infoModal.classList.add('active');
}

function closeTrainingInfoModal() {
    const modal = document.getElementById('trainingInfoModal');
    if (modal) {
        modal.classList.remove('active');
    }
}