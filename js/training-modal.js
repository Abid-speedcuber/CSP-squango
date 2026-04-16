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
let inspectionRunning = false;
let inspectionStartTime = 0;
let inspectionElapsed = 0;
let lastInspectionElapsed = 0;
let lastParityQuizWrong = false;
let inspectionInterval = null;
let isInspectionPhase = false;
let parityQuizPhase = false;
let parityQuizAnswer = null;
let parityQuizCorrect = false;
let trainingEnableInspection = localStorage.getItem('trainingEnableInspection') === 'true';
let trainingEnableParityQuiz = localStorage.getItem('trainingEnableParityQuiz') === 'true';

// Create the training modal dynamically
function createTrainingModal() {
    if (trainingModalElement) return;

    const modal = document.createElement('div');
    modal.id = 'trainingModal';
    modal.className = 'training-modal';
    modal.innerHTML = `
        <div class="training-modal-header">
            <div style="display: flex; gap: 10px; align-items: center;">
                <button class="training-modal-title" id="trainingCaseName" style="background: none; border: none; cursor: pointer; padding: 0; font: inherit; text-align: left; color: var(--link-color); text-decoration: underline;" title="Click to select angles to train">Training: Case Name</button>
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
            <div id="trainingTimerSubInfo" style="display:none; font-size:0.78rem;color:var(--text-muted);font-weight:500;text-align:center;line-height:1.6;width:100%;"></div>
            <div class="training-modal-timer" id="trainingTimer">0.000</div>
            <div id="trainingInspectionLabel" style="display:none; font-size:0.78rem;color:var(--accent);font-weight:600;letter-spacing:0.05em;"></div>
        </div>
    <div id="prevScrambleBar" style="position:fixed; bottom:0; left:0; width:100%; display:none; padding:8px 16px; font-family:Consolas,Monaco,'Courier New',monospace; text-align:center; z-index:10001; box-sizing:border-box;"><span style="color: var(--prevscramble-empty-color); font-style:italic;">No previous scramble to show</span></div>
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
    timerZone.addEventListener('mousedown', e => { if (parityQuizPhase) return; handleTimerMouseDown(e); });
    timerZone.addEventListener('mouseup', e => { if (parityQuizPhase) return; handleTimerMouseUp(e); });
    timerZone.addEventListener('mouseleave', e => { if (parityQuizPhase) return; handleTimerMouseLeave(e); });

    timerZone.addEventListener('touchstart', e => { if (parityQuizPhase) return; handleTimerTouchStart(e); });
    timerZone.addEventListener('touchend', e => { if (parityQuizPhase) return; handleTimerTouchEnd(e); });
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
    trainingEnableInspection = localStorage.getItem('trainingEnableInspection') === 'true';
    trainingEnableParityQuiz = localStorage.getItem('trainingEnableParityQuiz') === 'true';

    // Pre-generate 3 scrambles
    for (let i = 0; i < 3; i++) {
        preGeneratedScrambles.push(generateNextScrambleData());
    }

    displayNextScramble();

    modal.classList.add('active');
    document.body.classList.add('modal-open');
    applyPrevScrambleBar();
    applyTimerSize();
}

function closeTrainingModal() {
    closeModalWithHistory(() => {
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
        inspectionRunning = false;
        isInspectionPhase = false;
        parityQuizPhase = false;
        clearInterval(inspectionInterval);

        // Soft render when coming back from training
        filterAndSort(true);
    });
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

    let scrambleImage = '<div style="color: var(--text-muted)">Image unavailable</div>';
    try {
        // Use training-specific image size
        if (typeof visualizeFromScramble !== 'undefined') {
            const scrambleNotation = hexCode;
            try {
                const state = parseHexFormat(hexCode);
                const notation = window.sq1Tools.scrambleFromState(state) || hexCode;
                scrambleImage = visualizeFromScramble(notation, trainingScrambleImageSize, colorScheme);
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
    // Clear inspection/parity quiz state
    clearInterval(inspectionInterval);
    inspectionRunning = false;
    isInspectionPhase = false;
    parityQuizPhase = false;
    inspectionElapsed = 0;
    const overlay = document.getElementById('parityQuizOverlay');
    if (overlay) overlay.remove();
    const insLabel = document.getElementById('trainingInspectionLabel');
    if (insLabel) insLabel.style.display = 'none';
    lastParityQuizWrong = false;
    inspectionElapsed = 0;

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

function applyTimerSize() {
    const size = parseInt(localStorage.getItem('trainingTimerSize') || 80);
    const el = document.getElementById('trainingTimer');
    if (el) el.style.fontSize = size + 'px';
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
        bar.innerHTML = '<span style="color:var(--text-muted); font-style:italic; font-family:inherit;">No previous scramble to show</span>';
    } else {
        bar.innerHTML = `<span style="color: var(--text-secondary); font-family:inherit;">Previous scramble: </span>${scrambleHistory[prevIdx].text}`;
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
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#ffffff',
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
    // Start inspection immediately, no hold
    if (trainingEnableInspection && !isInspectionPhase && !parityQuizPhase) {
        if (trainingEnableParityQuiz) startParityQuizInspection();
        else startInspection();
        return;
    }
    // During inspection (non-quiz), hold to start solve
    if (isInspectionPhase && !parityQuizPhase) {
        isHolding = true;
        isHoldReady = false;
        holdStartTime = Date.now();
        document.getElementById('trainingTimer').style.color = 'var(--card-learning-border)';
        const holdCheckInterval = setInterval(() => {
            if (!isHolding) { clearInterval(holdCheckInterval); return; }
            const holdDuration = (Date.now() - holdStartTime) / 1000;
            if (holdDuration >= trainingHoldToStart && !isHoldReady) {
                isHoldReady = true;
                document.getElementById('trainingTimer').style.color = 'var(--card-learned-border)';
                clearInterval(holdCheckInterval);
            }
        }, 10);
        return;
    }
    // Normal mode (no inspection), hold to start solve
    isHolding = true;
    isHoldReady = false;
    holdStartTime = Date.now();
    document.getElementById('trainingTimer').style.color = 'var(--card-learning-border)';
    const holdCheckInterval = setInterval(() => {
        if (!isHolding) { clearInterval(holdCheckInterval); return; }
        const holdDuration = (Date.now() - holdStartTime) / 1000;
        if (holdDuration >= trainingHoldToStart && !isHoldReady) {
            isHoldReady = true;
            document.getElementById('trainingTimer').style.color = 'var(--card-learned-border)';
            clearInterval(holdCheckInterval);
        }
    }, 10);
}

function handleTimerMouseUp() {
    if (timerRunning) {
        stopTimerOnly();
        displayNextScramble();
        return;
    }
    // During inspection (non-quiz): release after hold-ready → start solve
    if (isInspectionPhase && !parityQuizPhase && isHolding && isHoldReady) {
        isHolding = false;
        isHoldReady = false;
        document.getElementById('trainingTimer').style.color = 'var(--text-primary)';
        stopInspectionAndStartTimer();
        return;
    }
    // During inspection (non-quiz): release but not ready → cancel hold, stay in inspection
    if (isInspectionPhase && !parityQuizPhase && isHolding) {
        isHolding = false;
        isHoldReady = false;
        document.getElementById('trainingTimer').style.color = 'var(--text-primary)';
        return;
    }
    // Normal mode: release after hold-ready → start timer
    if (!isInspectionPhase && isHolding && isHoldReady) {
        isHolding = false;
        isHoldReady = false;
        document.getElementById('trainingTimer').style.color = 'var(--text-primary)';
        startTimer();
        return;
    }
    if (isHolding) {
        isHolding = false;
        isHoldReady = false;
        document.getElementById('trainingTimer').style.color = 'var(--text-primary)';
    }
}

function handleTimerMouseLeave() {
    if (isHolding && !timerRunning) {
        isHolding = false;
        isHoldReady = false;
        // If in inspection, go back to blue inspection color
        if (isInspectionPhase && !parityQuizPhase) {
            document.getElementById('trainingTimer').style.color = 'var(--text-primary)';
        } else {
            document.getElementById('trainingTimer').style.color = 'var(--text-primary)';
        }
    }
}

// Touch handlers for timer zone
function handleTimerTouchStart(e) {
    e.preventDefault();
    if (timerRunning) return;
    if (trainingEnableInspection && !isInspectionPhase && !parityQuizPhase) {
        if (trainingEnableParityQuiz) startParityQuizInspection();
        else startInspection();
        return;
    }
    // During inspection (non-quiz): hold to start solve
    if (isInspectionPhase && !parityQuizPhase) {
        isHolding = true;
        isHoldReady = false;
        holdStartTime = Date.now();
        document.getElementById('trainingTimer').style.color = 'var(--card-learning-border)';
        const holdCheckInterval = setInterval(() => {
            if (!isHolding) { clearInterval(holdCheckInterval); return; }
            const holdDuration = (Date.now() - holdStartTime) / 1000;
            if (holdDuration >= trainingHoldToStart && !isHoldReady) {
                isHoldReady = true;
                document.getElementById('trainingTimer').style.color = 'var(--card-learned-border)';
                clearInterval(holdCheckInterval);
            }
        }, 10);
        return;
    }
    // Normal mode
    isHolding = true;
    isHoldReady = false;
    holdStartTime = Date.now();
    document.getElementById('trainingTimer').style.color = 'var(--card-learning-border)';
    const holdCheckInterval = setInterval(() => {
        if (!isHolding) { clearInterval(holdCheckInterval); return; }
        const holdDuration = (Date.now() - holdStartTime) / 1000;
        if (holdDuration >= trainingHoldToStart && !isHoldReady) {
            isHoldReady = true;
            document.getElementById('trainingTimer').style.color = 'var(--card-learned-border)';
            clearInterval(holdCheckInterval);
        }
    }, 10);
}

function handleTimerTouchEnd(e) {
    e.preventDefault();
    if (timerRunning) {
        stopTimerOnly();
        displayNextScramble();
        return;
    }
    if (isInspectionPhase && !parityQuizPhase && isHolding && isHoldReady) {
        isHolding = false;
        isHoldReady = false;
        document.getElementById('trainingTimer').style.color = 'var(--text-primary)';
        stopInspectionAndStartTimer();
        return;
    }
    if (isInspectionPhase && !parityQuizPhase && isHolding) {
        isHolding = false;
        isHoldReady = false;
        document.getElementById('trainingTimer').style.color = 'var(--text-primary)';
        return;
    }
    if (!isInspectionPhase && isHolding && isHoldReady) {
        isHolding = false;
        isHoldReady = false;
        document.getElementById('trainingTimer').style.color = 'var(--text-primary)';
        startTimer();
        return;
    }
    if (isHolding) {
        isHolding = false;
        isHoldReady = false;
        document.getElementById('trainingTimer').style.color = 'var(--text-primary)';
    }
}

function startInspection() {
    isInspectionPhase = true;
    inspectionRunning = true;
    inspectionElapsed = 0;
    inspectionStartTime = Date.now();
    const timerEl = document.getElementById('trainingTimer');
    timerEl.style.color = 'var(--accent)';
    timerEl.textContent = '0.000';
    const subInfo = document.getElementById('trainingTimerSubInfo');
    if (subInfo) subInfo.style.display = 'none';

    const insLabel = document.getElementById('trainingInspectionLabel');
    if (insLabel) { insLabel.textContent = 'inspecting…'; insLabel.style.display = 'block'; }

    clearInterval(inspectionInterval);
    inspectionInterval = setInterval(() => {
        inspectionElapsed = Date.now() - inspectionStartTime;
        timerEl.textContent = (inspectionElapsed / 1000).toFixed(3);
    }, 10);
}

function stopInspectionAndStartTimer() {
    clearInterval(inspectionInterval);
    inspectionElapsed = Date.now() - inspectionStartTime;
    lastInspectionElapsed = inspectionElapsed;
    inspectionRunning = false;
    isInspectionPhase = false;
    parityQuizPhase = false;
    const insLabel = document.getElementById('trainingInspectionLabel');
    if (insLabel) insLabel.style.display = 'none';
    startTimer();
}

function startParityQuizInspection() {
    const cleanScramble = currentScrambleText.replace(/<[^>]*>/g, '').trim();
    let parity = null;
    try {
        if (typeof window.ParityAnalyzerLib !== 'undefined') {
            parity = window.ParityAnalyzerLib.getParityTextFromScramblePlease(
                cleanScramble,
                typeof colorScheme !== 'undefined' ? colorScheme : {},
                typeof cornerStickerMode !== 'undefined' ? cornerStickerMode : 'counterclockwise'
            );
        }
    } catch (e) { }

    parityQuizAnswer = parity === 'Even' ? 'even' : (parity === 'Odd' ? 'odd' : null);
    parityQuizCorrect = false;
    parityQuizPhase = true;
    isInspectionPhase = true;
    inspectionRunning = true;
    inspectionElapsed = 0;
    inspectionStartTime = Date.now();

    const timerEl = document.getElementById('trainingTimer');
    timerEl.style.color = 'var(--accent)';
    timerEl.textContent = '0.000';
    const existingSubInfo = document.getElementById('trainingTimerSubInfo');
    if (existingSubInfo) existingSubInfo.style.display = 'none';

    const insLabel = document.getElementById('trainingInspectionLabel');
    if (insLabel) { insLabel.textContent = 'inspecting…'; insLabel.style.display = 'block'; }

    const timerZone = document.getElementById('trainingTimerZone');
    timerZone.style.position = 'relative';

    let overlay = document.getElementById('parityQuizOverlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'parityQuizOverlay';
    overlay.style.cssText = `
        position:absolute; top:0; left:0; width:100%; height:100%;
        display:flex; flex-direction:row; z-index:100; border-radius:inherit; overflow:hidden;
    `;

    const useEvilLabels = typeof evilnessFactor !== 'undefined' && evilnessFactor;
    const goodLabel = useEvilLabels ? 'GOOD ALG' : 'EVEN';
    const badLabel = useEvilLabels ? 'BAD ALG' : 'ODD';

    overlay.innerHTML = `
        <button id="pqGoodBtn" style="
            flex:1; border:none; cursor:pointer;
            background:rgba(45,106,45,0.10);
            transition:background 0.15s;
            display:flex; align-items:center; justify-content:center;
            font-size:1rem; font-weight:800;
            color:rgba(45,106,45,0.85); letter-spacing:0.06em;
        ">${goodLabel}</button>
        <div style="width:1px;background:rgba(0,0,0,0.07);flex-shrink:0;"></div>
        <button id="pqBadBtn" style="
            flex:1; border:none; cursor:pointer;
            background:rgba(139,0,0,0.10);
            transition:background 0.15s;
            display:flex; align-items:center; justify-content:center;
            font-size:1rem; font-weight:800;
            color:rgba(139,0,0,0.85); letter-spacing:0.06em;
        ">${badLabel}</button>
    `;

    timerZone.appendChild(overlay);

    const mq = window.matchMedia('(max-width:500px)');
    function applyLayout(narrow) {
        overlay.style.flexDirection = narrow ? 'column' : 'row';
        const divider = overlay.querySelector('div');
        if (divider) {
            divider.style.width = narrow ? '100%' : '1px';
            divider.style.height = narrow ? '1px' : '100%';
        }
    }
    applyLayout(mq.matches);
    mq.addEventListener('change', e => applyLayout(e.matches));

    clearInterval(inspectionInterval);
    inspectionInterval = setInterval(() => {
        inspectionElapsed = Date.now() - inspectionStartTime;
        timerEl.textContent = (inspectionElapsed / 1000).toFixed(3);
    }, 10);

    let firstAnswerWrong = false;

    function handlePQAnswer(userSaidGood) {
        const correctIsGood = parityQuizAnswer === 'even';
        parityQuizCorrect = userSaidGood === correctIsGood;

        if (parityQuizCorrect) {
            overlay.remove();
            parityQuizPhase = false;
            if (firstAnswerWrong) {
                lastParityQuizWrong = true;
            }
            stopInspectionAndStartTimer();
        } else {
            firstAnswerWrong = true;
            const wrongBtn = userSaidGood ? document.getElementById('pqGoodBtn') : document.getElementById('pqBadBtn');
            const origBg = wrongBtn.style.background;
            const origColor = wrongBtn.style.color;
            wrongBtn.style.background = 'rgba(200,0,0,0.22)';
            wrongBtn.style.color = 'rgba(180,0,0,0.8)';
            wrongBtn.disabled = true;
            setTimeout(() => {
                wrongBtn.style.background = origBg;
                wrongBtn.style.color = origColor;
                wrongBtn.disabled = false;
            }, 700);
        }
    }

    document.getElementById('pqGoodBtn').addEventListener('click', () => handlePQAnswer(true));
    document.getElementById('pqBadBtn').addEventListener('click', () => handlePQAnswer(false));
}

function startTimer() {
    if (timerRunning) return;

    // Reset timer to 0 when starting a new solve
    timerElapsed = 0;
    timerRunning = true;
    timerStartTime = Date.now();

    const timerEl = document.getElementById('trainingTimer');
    timerEl.style.color = 'var(--text-primary)';

    timerInterval = setInterval(() => {
        timerElapsed = Date.now() - timerStartTime;
        updateTimerDisplay();
    }, 10);
}

function stopTimerOnly() {
    if (!timerRunning) return;

    timerRunning = false;
    clearInterval(timerInterval);

    lastInspectionElapsed = inspectionElapsed;
    const wasParityWrong = lastParityQuizWrong;
    lastParityQuizWrong = false;
    const timerEl = document.getElementById('trainingTimer');
    timerEl.style.color = 'var(--text-primary)';
    timerEl.textContent = (timerElapsed / 1000).toFixed(3);

    const insLabel = document.getElementById('trainingInspectionLabel');
    if (insLabel) insLabel.style.display = 'none';

    const subInfo = document.getElementById('trainingTimerSubInfo');
    if (!subInfo) return;

    if (trainingEnableInspection && lastInspectionElapsed > 0) {
        const insTime = (lastInspectionElapsed / 1000).toFixed(3);
        const solveTime = (timerElapsed / 1000).toFixed(3);
        let html = `<span style="color:var(--accent);font-weight:700;">(${insTime}s inspection)</span>`;
        if (wasParityWrong) {
            html += `<br><span style="color:var(--bad-case);font-weight:600;">✗ wrong parity answer</span>`;
        }
        subInfo.innerHTML = html;
        subInfo.style.display = 'block';
        const r = subInfo.getBoundingClientRect();
        const midX = (r.left + r.right) / 2;
        const midY = (r.top + r.bottom) / 2;
        const topEl = document.elementFromPoint(midX, midY);
    } else {
        subInfo.style.display = 'none';
    }
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
                    style="padding: 8px; background: ${currentSelection.includes(idx) ? 'var(--surface-border)' : 'var(--surface)'}; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer; transition: all 0.2s;">
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
                    style="padding: 8px; background: ${currentSelection.includes(idx) ? 'var(--surface-border)' : 'var(--surface)'}; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                ${shapeHTML}
            </button>
        `;
    }).join('');

    body.innerHTML = `
        <div class="shape-index-section">
            <div class="shape-index-section-header">
                <span style="font-weight: 600;">Original Orientation</span>
                <div>
                    <button onclick="selectAllIndices('org')" style="padding: 3px 10px; margin-right: 5px; background: var(--surface2); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 3px; cursor: pointer; font-size: 0.8rem;">Select All</button>
                    <button onclick="deselectAllIndices('org')" style="padding: 3px 10px; background: var(--surface2); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 3px; cursor: pointer; font-size: 0.8rem;">Deselect All</button>
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
                    <button onclick="selectAllIndices('mir')" style="padding: 3px 10px; margin-right: 5px; background: var(--surface2); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 3px; cursor: pointer; font-size: 0.8rem;">Select All</button>
                    <button onclick="deselectAllIndices('mir')" style="padding: 3px 10px; background: var(--surface2); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 3px; cursor: pointer; font-size: 0.8rem;">Deselect All</button>
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
        button.style.background = button.classList.contains('active') ? 'var(--surface-border)' : 'var(--surface)';
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
        btn.style.background = 'var(--surface-border)';
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
        btn.style.background = 'var(--surface)';
    });

    trainingScrambles = window.trainingSelections[selectedKey];
    regenerateScrambleLookaheadLegacy();
}

function closeShapeIndexSelector() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('shapeIndexSelectorModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    });
}

// Keyboard events for timer
let spacePressed = false;
document.addEventListener('keydown', (e) => {
    if (document.getElementById('evilnessQuizModal')) return;
    const modal = document.getElementById('trainingModal');
    if (!modal || !modal.classList.contains('active')) return;

    // Parity quiz overlay keyboard support
    if (parityQuizPhase) {
        const leftKeys = new Set(['Tab', 'Backquote', 'Digit1', 'Digit2', 'Digit4', 'Digit5', 'Digit6', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyZ', 'KeyX', 'KeyC', 'KeyV']);
        const rightKeys = new Set(['Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'Enter', 'NumpadEnter']);
        if (leftKeys.has(e.code) || rightKeys.has(e.code)) {
            e.preventDefault();
            const goodBtn = document.getElementById('pqGoodBtn');
            const badBtn = document.getElementById('pqBadBtn');
            if (leftKeys.has(e.code) && goodBtn && !goodBtn.disabled) goodBtn.click();
            else if (rightKeys.has(e.code) && badBtn && !badBtn.disabled) badBtn.click();
            return;
        }
    }

    if (e.code === 'Escape') {
        e.preventDefault();
        const infoModal = document.getElementById('trainingInfoModal');
        const settingsModal = document.getElementById('trainingSettingsModal');
        const shapeModal = document.getElementById('shapeIndexSelectorModal');
        const selectorModal = document.getElementById('trainingSelectorModal');
        if (infoModal && infoModal.classList.contains('active')) { closeTrainingInfoModal(); return; }
        if (settingsModal && settingsModal.classList.contains('active')) { closeTrainingSettingsModal(); return; }
        if (shapeModal && shapeModal.classList.contains('active')) { closeShapeIndexSelector(); return; }
        if (selectorModal && selectorModal.style.display !== 'none') { closeSelectorModal(); return; }
        // Cancel inspection without wiping last solve display
        if (isInspectionPhase || parityQuizPhase) {
            clearInterval(inspectionInterval);
            inspectionRunning = false;
            isInspectionPhase = false;
            parityQuizPhase = false;
            isHolding = false;
            isHoldReady = false;
            inspectionElapsed = 0;
            const overlay = document.getElementById('parityQuizOverlay');
            if (overlay) overlay.remove();
            const insLabel = document.getElementById('trainingInspectionLabel');
            if (insLabel) insLabel.style.display = 'none';
            // Restore previous solve display
            const timerEl = document.getElementById('trainingTimer');
            timerEl.style.color = 'var(--text-primary)';
            if (timerElapsed > 0) {
                timerEl.textContent = (timerElapsed / 1000).toFixed(3);
            } else {
                timerEl.textContent = '0.000';
            }
            const subInfo = document.getElementById('trainingTimerSubInfo');
            if (subInfo) {
                if (trainingEnableInspection && lastInspectionElapsed > 0) {
                    subInfo.style.display = 'block';
                } else {
                    subInfo.style.display = 'none';
                }
            }
            return;
        }
        closeTrainingModal();
        return;
    }

    // Block space when parity quiz is active
    if (e.code === 'Space' && parityQuizPhase) {
        e.preventDefault();
        if (typeof showToast === 'function') showToast('Choose the correct parity option first', 2000, 'info');
        return;
    }

    // Any key stops the solve timer if running
    if (timerRunning) {
        e.preventDefault();
        if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') return;
        stopTimerOnly();
        displayNextScramble();
        spacePressed = false;
        return;
    }

    if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (!spacePressed) {
            spacePressed = true;
            // Start inspection immediately, no hold
            if (trainingEnableInspection && !isInspectionPhase && !parityQuizPhase) {
                if (trainingEnableParityQuiz) startParityQuizInspection();
                else startInspection();
                return;
            }
            // During inspection (non-quiz): begin hold to start solve
            if (isInspectionPhase && !parityQuizPhase) {
                isHolding = true;
                isHoldReady = false;
                holdStartTime = Date.now();
                document.getElementById('trainingTimer').style.color = 'var(--card-learning-border)';
                const holdCheckInterval = setInterval(() => {
                    if (!isHolding) { clearInterval(holdCheckInterval); return; }
                    const holdDuration = (Date.now() - holdStartTime) / 1000;
                    if (holdDuration >= trainingHoldToStart && !isHoldReady) {
                        isHoldReady = true;
                        document.getElementById('trainingTimer').style.color = 'var(--card-learned-border)';
                        clearInterval(holdCheckInterval);
                    }
                }, 10);
                return;
            }
            // Normal mode: hold to start solve
            document.getElementById('trainingTimer').style.color = 'var(--card-learning-border)';
            isHolding = true;
            isHoldReady = false;
            holdStartTime = Date.now();
            const holdCheckInterval = setInterval(() => {
                if (!isHolding) { clearInterval(holdCheckInterval); return; }
                const holdDuration = (Date.now() - holdStartTime) / 1000;
                if (holdDuration >= trainingHoldToStart && !isHoldReady) {
                    isHoldReady = true;
                    document.getElementById('trainingTimer').style.color = 'var(--card-learned-border)';
                    clearInterval(holdCheckInterval);
                }
            }, 10);
        }
    }
});
document.addEventListener('keydown', (e) => {
    if (document.getElementById('evilnessQuizModal')) return;
    const leftKeys = new Set(['Tab', 'Backquote', 'Digit1', 'Digit2', 'Digit4', 'Digit5', 'Digit6', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyZ', 'KeyX', 'KeyC', 'KeyV']);
    const rightKeys = new Set(['Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'Enter', 'NumpadEnter']);

    const evilModal = document.getElementById('evilnessQuizModal');
    if (evilModal) {
        const goodBtn = document.getElementById('evilQuizGood');
        const badBtn = document.getElementById('evilQuizEvil');
        if (goodBtn && !goodBtn.disabled && leftKeys.has(e.code)) { e.preventDefault(); goodBtn.click(); return; }
        if (badBtn && !badBtn.disabled && rightKeys.has(e.code)) { e.preventDefault(); badBtn.click(); return; }
    }

    const parityModal = document.getElementById('parityQuizModal');
    if (parityModal) {
        const goodBtn = document.getElementById('parityQuizGood');
        const badBtn = document.getElementById('parityQuizBad');
        if (goodBtn && !goodBtn.disabled && leftKeys.has(e.code)) { e.preventDefault(); goodBtn.click(); return; }
        if (badBtn && !badBtn.disabled && rightKeys.has(e.code)) { e.preventDefault(); badBtn.click(); return; }
    }
});

document.addEventListener('keyup', (e) => {
    if (document.getElementById('evilnessQuizModal')) return;
    const modal = document.getElementById('trainingModal');
    if (!modal || !modal.classList.contains('active')) return;

    if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (timerRunning) {
            stopTimerOnly();
            displayNextScramble();
        } else {
            nextScrambleManual();
        }
        return;
    }

    if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (timerRunning) {
            stopTimerOnly();
            displayNextScramble();
        } else {
            previousScramble();
        }
        return;
    }

    if (e.code === 'Space') {
        e.preventDefault();
        spacePressed = false;
        const timerEl = document.getElementById('trainingTimer');
        // During inspection (non-quiz): release after hold-ready → start solve
        if (isInspectionPhase && !parityQuizPhase && isHolding && isHoldReady) {
            isHolding = false;
            isHoldReady = false;
            timerEl.style.color = 'var(--text-primary)';
            stopInspectionAndStartTimer();
            return;
        }
        // During inspection (non-quiz): release but not ready → cancel hold, stay in inspection
        if (isInspectionPhase && !parityQuizPhase && isHolding) {
            isHolding = false;
            isHoldReady = false;
            timerEl.style.color = 'var(--text-primary)';
            return;
        }
        // Normal mode: release after hold-ready → start solve
        if (!isInspectionPhase && isHolding && isHoldReady) {
            isHolding = false;
            isHoldReady = false;
            timerEl.style.color = 'var(--text-primary)';
            startTimer();
            return;
        }
        if (isHolding) {
            isHolding = false;
            isHoldReady = false;
            timerEl.style.color = 'var(--text-primary)';
        }
    }
});

function regenerateScrambleLookahead() {
    regenerateScrambleLookaheadLegacy();
}

function openTrainingSettingsModal() {
    window.openUnifiedSettings('trainer');
}

function closeTrainingSettingsModal() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('trainingSettingsModal');
        if (modal) modal.classList.remove('active');
    });
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
                    <span class="training-info-title">Training Guides</span>
                    <button class="training-info-close" onclick="closeTrainingInfoModal()">&times;</button>
                </div>
                <div class="training-info-body">
                    <div class="training-info-item">
                        <div class="training-info-number">1</div>
                        <div class="training-info-text">Press on the top left corner to <b>select cases to train</b>, or to select a particular <b>angle</b> for one case <i>(for case-wise training)</i>.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">2</div>
                        <div class="training-info-text">Use <b>< button</b> or keyboard <b>left arrow</b> for previous scramble, use the 🔄 <b>button</b> or keyboard <b>right key</b> to regenerate scramble.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">3</div>
                        <div class="training-info-text">Check settings for a bunch of customizability.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">4</div>
                        <div class="training-info-text">The <b>out-of-cubeshape</b> part of the scramble is colored. <span style="color: #2196F3; font-weight: 600;">Blue</span> means the scramble goes out of CS from (0,0) alignment, <span style="color: #f44336; font-weight: 600;">red</span> means it goes out at (1,-1) alignment.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">5</div>
                        <div class="training-info-text">To use the Parity Tracer for the <b>current scramble</b>, directly <b>click</b> on the scramble.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">6</div>
                        <div class="training-info-text">Enable <b>inspection</b> and then enable <b>Parity quiz during inspection</b> to activate the <b>parity quiz</b> feature in inspection.</div>
                    </div>
                    <h3>Parity Quiz guide:</h3></br>
                    <div class="training-info-item">
                        <div class="training-info-number">1</div>
                        <div class="training-info-text">If your evilness is turned <b>off</b>, the app will ask you if the scramble is <b>even</b> or <b>odd</b> parity.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">2</div>
                        <div class="training-info-text">If your evilness is turned <b>on</b>, the app will ask you if the scramble requires <b>good alg</b> or <b>bad alg</b> (I believe you already know what those are).</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">3</div>
                        <div class="training-info-text">Click on the left side of the screen, or <b>any left side key</b> (ie. QWERASDFZXCV1234 etc) on your keyboard to answer <b>Even/ Good Alg</b>. Do the opposite to answer <b>Odd/ Bad alg</b></div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">4</div>
                        <div class="training-info-text">Time your time to trace parity, and the time to plan the algorithm for better grasp over a case.</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(infoModal);
    }

    infoModal.classList.add('active');
}

function closeTrainingInfoModal() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('trainingInfoModal');
        if (modal) modal.classList.remove('active');
    });
}

// ============================================================
// QUIZ SHARED UTILITIES
// ============================================================

function quizGetCaseNameFromScramble(hexCode) {
    // Get the scramble notation from hex, then use algToShapeIndex
    try {
        const state = parseHexFormat(hexCode);
        const notation = window.sq1Tools.scrambleFromState(state);
        if (!notation) return null;
        // algToShapeIndex inverts internally — pass notation directly to get scrambled shape
        const result = window.algToShapeIndex(notation);
        const map = typeof getShapeIndexToCaseMap === 'function' ? getShapeIndexToCaseMap() : null;
        if (!map) return null;
        return map[result.shapeIndex] || null;
    } catch (e) {
        return null;
    }
}

function quizGetParityFromHex(hexCode) {
    // Returns 'Odd' or 'Even' or null
    try {
        const state = parseHexFormat(hexCode);
        const notation = window.sq1Tools.scrambleFromState(state);
        if (!notation || typeof window.ParityAnalyzerLib === 'undefined') return null;
        return window.ParityAnalyzerLib.getParityTextFromScramblePlease(
            notation,
            typeof colorScheme !== 'undefined' ? colorScheme : {},
            typeof cornerStickerMode !== 'undefined' ? cornerStickerMode : 'counterclockwise'
        );
    } catch (e) {
        return null;
    }
}

function quizBuildCaseSelector(modalId, title, storageKey, onConfirm) {
    // Reuse the exact same modal structure as openShapeIndexSelector
    let selectorModal = document.getElementById(modalId + '_selectorModal');
    if (selectorModal) selectorModal.remove();

    selectorModal = document.createElement('div');
    selectorModal.id = modalId + '_selectorModal';
    selectorModal.className = 'shape-index-selector-modal';
    selectorModal.innerHTML = `
        <div class="shape-index-selector-content">
            <div class="shape-index-selector-header">
                <span class="shape-index-selector-title">${title}</span>
                <button class="shape-index-selector-close" id="${modalId}_selClose">&times;</button>
            </div>
            <div class="shape-index-selector-body" id="${modalId}_selBody"></div>
        </div>
    `;
    document.body.appendChild(selectorModal);

    const closeSelector = () => {
        closeModalWithHistory(() => {
            selectorModal.classList.remove('active');
            selectorModal.remove();
        });
    };

    pushModalState(modalId + '_selectorModal', closeSelector);

    const stored = (() => { try { return JSON.parse(localStorage.getItem(storageKey)) || null; } catch (e) { return null; } })();
    let selectedCases = new Set(stored ? stored : shapeIndex.map(e => e.name));

    const body = document.getElementById(modalId + '_selBody');

    // Group by top shape, same as openShapeIndexSelector groups by org/mir
    const groups = {};
    shapeIndex.forEach(entry => {
        const dispName = (typeof displayNames !== 'undefined' && displayNames[entry.name]) ? displayNames[entry.name] : entry.name;
        const top = dispName.includes('/') ? dispName.split('/')[0].trim() : dispName;
        if (!groups[top]) groups[top] = [];
        groups[top].push(entry);
    });

    let searchHTML = `<div style="padding: 0 4px 12px 4px;">
        <input type="text" id="${modalId}_selSearch" placeholder="Search cases..." style="width:100%;padding:8px 12px;border:2px solid var(--border-color);border-radius:8px;font-size:0.9rem;box-sizing:border-box;">
    </div>`;

    let sectionsHTML = Object.entries(groups).map(([groupName, entries]) => {
        const dispEntries = entries.map(entry => {
            const dispName = (typeof displayNames !== 'undefined' && displayNames[entry.name]) ? displayNames[entry.name] : entry.name;
            const bottom = dispName.includes('/') ? dispName.split('/')[1].trim() : dispName;
            const isSelected = selectedCases.has(entry.name);
            return `<button class="${modalId}_selToggle shape-index-toggle ${isSelected ? 'active' : ''}"
                        data-name="${entry.name.replace(/"/g, '&quot;')}"
                        data-dispname="${dispName.toLowerCase()}"
                        data-group="${groupName}"
                        style="padding: 8px; background: ${isSelected ? '#ebebeb' : '#ffffff'}; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer; transition: all 0.2s; font-size: 0.82rem; text-align: center; color: var(--text-ui);">
                ${bottom}
            </button>`;
        }).join('');

        return `<div class="shape-index-section ${modalId}_selGroup" data-group="${groupName}">
            <div class="shape-index-section-header">
                <span style="font-weight: 600;">${groupName}</span>
                <div>
                    <button data-group="${groupName}" data-action="all" style="padding: 3px 10px; margin-right: 5px; background: var(--surface2); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 3px; cursor: pointer; font-size: 0.8rem;">Select All</button>
                    <button data-group="${groupName}" data-action="none" style="padding: 3px 10px; background: var(--surface2); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 3px; cursor: pointer; font-size: 0.8rem;">Deselect All</button>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(112px, 1fr)); gap: 10px; margin-top: 10px;">
                ${dispEntries}
            </div>
        </div>`;
    }).join('');

    body.innerHTML = searchHTML + sectionsHTML + `
        <div style="margin-top: 20px; text-align: center;">
            <button id="${modalId}_selConfirm" style="padding: 0.7rem 2rem; background: #4299e1; color: #fff; border: none; border-radius: 8px; font-weight: 600; font-size: 0.95rem; cursor: pointer;">Start</button>
        </div>`;

    // Toggle individual
    body.querySelectorAll(`.${modalId}_selToggle`).forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.getAttribute('data-name');
            if (selectedCases.has(name)) {
                selectedCases.delete(name);
                btn.classList.remove('active');
                btn.style.background = 'var(--surface)';
            } else {
                selectedCases.add(name);
                btn.classList.add('active');
                btn.style.background = 'var(--surface-border)';
            }
        });
    });

    // Group all/none
    body.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            const group = btn.getAttribute('data-group');
            const action = btn.getAttribute('data-action');
            body.querySelectorAll(`.${modalId}_selToggle[data-group="${group}"]`).forEach(tb => {
                const name = tb.getAttribute('data-name');
                if (action === 'all') {
                    selectedCases.add(name);
                    tb.classList.add('active');
                    tb.style.background = 'var(--surface-border)';
                } else {
                    selectedCases.delete(name);
                    tb.classList.remove('active');
                    tb.style.background = 'var(--surface)';
                }
            });
        });
    });

    // Search
    document.getElementById(modalId + '_selSearch').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        body.querySelectorAll(`.${modalId}_selToggle`).forEach(btn => {
            btn.style.display = btn.getAttribute('data-dispname').includes(term) ? '' : 'none';
        });
        body.querySelectorAll(`.${modalId}_selGroup`).forEach(grp => {
            const any = Array.from(grp.querySelectorAll(`.${modalId}_selToggle`)).some(b => b.style.display !== 'none');
            grp.style.display = any ? '' : 'none';
        });
    });

    // Close
    document.getElementById(modalId + '_selClose').addEventListener('click', closeSelector);
    selectorModal.addEventListener('click', (e) => {
        if (e.target === selectorModal) closeSelector();
    });

    // Confirm
    document.getElementById(modalId + '_selConfirm').addEventListener('click', () => {
        const chosen = Array.from(selectedCases);
        if (chosen.length === 0) { if (typeof showToast === 'function') showToast('Select at least one case.', 2000, 'error'); return; }
        localStorage.setItem(storageKey, JSON.stringify(chosen));
        selectorModal.classList.remove('active');
        selectorModal.remove();
        onConfirm(chosen);
    });

    selectorModal.classList.add('active');
}

// ============================================================
// 1. EVILNESS QUIZ
// ============================================================

window.openEvilnessQuiz = function () {
    const key = 'sq1-selector-evilness';
    window._selectorStorageKey = key;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(key)); } catch (e) { }
    const chosen = (saved && saved.length > 0) ? saved.filter(n => data.some(d => d.name === n)) : data.map(d => d.name);
    startEvilnessQuiz(chosen);
};

function startEvilnessQuiz(chosenCaseNames) {
    const allIndices = [];
    function rebuildIndices(names) {
        allIndices.length = 0;
        names.forEach(cn => {
            const entry = shapeIndex.find(e => e.name === cn);
            if (entry) {
                (entry.org || []).forEach(idx => allIndices.push({ idx, caseName: cn }));
                (entry.mir || []).forEach(idx => allIndices.push({ idx, caseName: cn }));
            }
        });
    }
    rebuildIndices(chosenCaseNames);
    if (allIndices.length === 0) return;

    let quizLog = [];
    let quizStartTime = 0;
    let currentItem = null;
    let timerInt = null;
    let questionCount = 0;
    let quizRunning = false;
    let sidebarOpen = false;

    const modal = document.createElement('div');
    modal.id = 'evilnessQuizModal';
    modal.className = 'training-modal active';
    modal.innerHTML = `
        <div class="training-modal-header">
            <div style="display:flex;gap:10px;align-items:center;">
                <button class="training-modal-title" id="evilQuizCaseCount" style="background:none;border:none;cursor:pointer;padding:0;font:inherit;text-align:left;color:var(--link-color);text-decoration:underline;" title="Select cases">${chosenCaseNames.length} cases selected</button>
            </div>
            <div style="display:flex;gap:10px;align-items:center;">
                <button class="training-modal-refresh" id="evilQuizPrevBtn" title="Previous" style="display:none;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <button class="training-modal-refresh" id="evilQuizNextBtn" title="Next">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"></polyline></svg>
                </button>
                <button class="training-modal-refresh" id="evilQuizSettingsBtn" title="Settings">
                    <img src="res/training-settings.svg" height="20px" width="20px">
                </button>
                <button class="training-modal-close" id="evilQuizClose">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        </div>
        <div class="training-modal-timer-zone" id="evilQuizTimerZone" style="position:relative;flex-direction:column;gap:1rem;justify-content:center;align-items:center;cursor:default;">
            <div class="training-modal-image-container">
                <div class="training-modal-image" id="evilQuizImage"></div>
            </div>
            <div class="training-modal-timer" id="evilQuizTimer">0.000</div>
            <div id="evilQuizStartOverlay" style="position:absolute;top:0;left:0;width:100%;height:100%;background:var(--surface);display:flex;align-items:flex-start;justify-content:center;z-index:50;border-radius:inherit;padding-top:2rem;box-sizing:border-box;">
                <div style="display:flex;flex-direction:column;align-items:center;gap:1.2rem;max-width:320px;text-align:center;padding:1.5rem;">
                    <div style="font-size:1.1rem;font-weight:700;color:var(--text-ui);">Evilness Quiz</div>
                    <div style="font-size:0.88rem;color:var(--text-secondary);line-height:1.6;">
                        You'll be shown an image of a scramble. Decide if the case requires a <span style="color:#2d6a2d;font-weight:700;">Good</span> alg or an <span style="color:#8b0000;font-weight:700;">Evil</span> alg.<br><br>
                        Press the <strong>left half</strong> of the screen (or left-side keys) for Good, and the <strong>right half</strong> (or right-side keys) for Evil.
                    </div>
                    <button id="evilQuizStartBtn" style="padding:0.9rem 2.2rem;background:var(--accent);color:#fff;border:none;border-radius:12px;font-size:1.1rem;font-weight:700;cursor:pointer;">Start</button>
                </div>
            </div>
        </div>
        <div id="evilQuizSidebar" style="display:none;position:fixed;top:0;right:0;width:260px;height:100%;background:var(--surface);border-left:1px solid var(--border-color);z-index:10001;overflow-y:auto;flex-direction:column;">
            <div style="padding:14px 16px;font-weight:700;color:var(--text-ui);border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;">
                <span>Case Log</span>
                <button id="evilQuizSidebarClose" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--text-muted);line-height:1;">&times;</button>
            </div>
            <div id="evilQuizLogList" style="padding:10px 12px;font-size:0.82rem;color:var(--text-primary);display:flex;flex-direction:column;gap:6px;"></div>
        </div>
    `;

    const closeQuiz = () => {
        closeModalWithHistory(() => {
            clearInterval(timerInt);
            const sm = document.getElementById('evilQuizSettingsModal');
            if (sm) sm.remove();

            const obs = new MutationObserver((mutations) => {
            });
            obs.observe(document.body, { childList: true, subtree: false });
            modal.remove();
            setTimeout(() => obs.disconnect(), 500);
            document.body.classList.remove('modal-open');
        });
    };

    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    pushModalState('evilnessQuizModal', closeQuiz);

    // Settings modal
    function openEvilQuizSettings() {
    window.openUnifiedSettings('trainer');
    // Patch: after the settings modal opens, hook the image size slider to update the quiz image
    setTimeout(() => {
        const slider = document.getElementById('tr_imgSize');
        if (!slider) return;
        const orig = slider.oninput;
        slider.addEventListener('input', () => {
            if (currentHexCode) {
                try {
                    const state = parseHexFormat(currentHexCode);
                    const notation = window.sq1Tools.scrambleFromState(state);
                    const imgEl = document.getElementById('evilQuizImage');
                    if (imgEl) imgEl.innerHTML = visualizeFromScramble(notation, parseInt(slider.value), typeof colorScheme !== 'undefined' ? colorScheme : {});
                } catch (e) {}
            }
        });
    }, 100);
}

    function renderSidebar() {
        const list = document.getElementById('evilQuizLogList');
        if (!list) return;
        if (quizLog.length === 0) { list.innerHTML = '<span style="color:var(--text-muted);font-style:italic;">No answers yet.</span>'; return; }
        list.innerHTML = [...quizLog].reverse().map((entry, i) => {
            const icon = entry.correct ? '✓' : '✗';
            const color = entry.correct ? '#2d6a2d' : '#cc0000';
            const timeStr = (entry.timeMs / 1000).toFixed(3) + 's';
            const evilStr = entry.wasEvil ? 'Evil' : 'Good';
            return `<div style="padding:6px 8px;border-radius:6px;background:${entry.correct ? 'var(--card-learned-bg)' : 'var(--toast-error-bg)'};border:1px solid ${entry.correct ? 'var(--card-learned-border)' : 'var(--bad-case)'};">
                <span style="color:${color};font-weight:700;">${icon}</span>
                <span style="font-weight:600;margin-left:4px;">${entry.caseName}</span>
                <span style="color:var(--text-muted);margin-left:4px;">(${evilStr})</span>
                <span style="float:right;color:var(--text-muted)">${timeStr}</span>
            </div>`;
        }).join('');
    }

    function toggleSidebar() {
        sidebarOpen = !sidebarOpen;
        const sb = document.getElementById('evilQuizSidebar');
        if (sb) { sb.style.display = sidebarOpen ? 'flex' : 'none'; renderSidebar(); }
    }

    let currentHexCode = null;

    function nextQuestion() {
        clearInterval(timerInt);
        currentItem = allIndices[Math.floor(Math.random() * allIndices.length)];
        questionCount++;

        currentHexCode = generateHexFromShapeIndex(currentItem.idx);
        window._evilCurrentHexCode = currentHexCode;
        let imgHTML = '';
        try {
            const state = parseHexFormat(currentHexCode);
            const notation = window.sq1Tools.scrambleFromState(state);
            imgHTML = visualizeFromScramble(notation, trainingScrambleImageSize || 200, typeof colorScheme !== 'undefined' ? colorScheme : {});
        } catch (e) { imgHTML = '<div style="color:var(--text-muted);padding:1rem;">Image unavailable</div>'; }

        document.getElementById('evilQuizImage').innerHTML = imgHTML;
        document.getElementById('evilQuizTimer').textContent = '0.000';

        // Remove existing answer overlay if any
        const existing = document.getElementById('evilQuizAnswerOverlay');
        if (existing) existing.remove();

        // Create split answer overlay
        const timerZone = document.getElementById('evilQuizTimerZone');
        const overlay = document.createElement('div');
        overlay.id = 'evilQuizAnswerOverlay';
        overlay.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:row;z-index:100;border-radius:inherit;overflow:hidden;`;
        overlay.innerHTML = `
            <button id="evilQuizGood" style="flex:1;border:none;cursor:pointer;background:rgba(45,106,45,0.10);display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:800;color:rgba(45,106,45,0.85);letter-spacing:0.06em;transition:background 0.15s;">GOOD</button>
            <div style="width:1px;background:rgba(0,0,0,0.07);flex-shrink:0;"></div>
            <button id="evilQuizEvil" style="flex:1;border:none;cursor:pointer;background:rgba(139,0,0,0.10);display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:800;color:rgba(139,0,0,0.85);letter-spacing:0.06em;transition:background 0.15s;">EVIL</button>
        `;
        timerZone.appendChild(overlay);

        // Responsive layout
        const mq = window.matchMedia('(max-width:500px)');
        function applyLayout(narrow) {
            overlay.style.flexDirection = narrow ? 'column' : 'row';
            const div = overlay.querySelector('div');
            if (div) { div.style.width = narrow ? '100%' : '1px'; div.style.height = narrow ? '1px' : '100%'; }
        }
        applyLayout(mq.matches);
        mq.addEventListener('change', e => applyLayout(e.matches));

        quizStartTime = Date.now();
        timerInt = setInterval(() => {
            document.getElementById('evilQuizTimer').textContent = ((Date.now() - quizStartTime) / 1000).toFixed(3);
        }, 10);

        document.getElementById('evilQuizGood').addEventListener('click', () => handleAnswer(false));
        document.getElementById('evilQuizEvil').addEventListener('click', () => handleAnswer(true));
    }

    function handleAnswer(userSaidEvil) {
        clearInterval(timerInt);
        const elapsed = Date.now() - quizStartTime;
        const isEvil = (typeof isCaseEvil === 'function') ? isCaseEvil(currentItem.caseName) : false;
        const correct = userSaidEvil === isEvil;
        quizLog.push({ caseName: currentItem.caseName, wasEvil: isEvil, correct, timeMs: elapsed });
        if (sidebarOpen) renderSidebar();

        if (correct) {
            nextQuestion();
        } else {
            const wrongBtn = userSaidEvil ? document.getElementById('evilQuizEvil') : document.getElementById('evilQuizGood');
            if (wrongBtn) {
                wrongBtn.style.background = 'rgba(200,0,0,0.22)';
                wrongBtn.style.color = 'rgba(180,0,0,0.9)';
                wrongBtn.disabled = true;
                const otherBtn = userSaidEvil ? document.getElementById('evilQuizGood') : document.getElementById('evilQuizEvil');
                if (otherBtn) otherBtn.disabled = true;
            }
            setTimeout(nextQuestion, 600);
        }
    }

    document.getElementById('evilQuizClose').addEventListener('click', closeQuiz);
    document.getElementById('evilQuizNextBtn').addEventListener('click', () => { if (quizRunning) nextQuestion(); });
    document.getElementById('evilQuizCaseCount').addEventListener('click', () => {
        openSelectorModal('sq1-selector-evilness', (chosen) => {
            rebuildIndices(chosen);
            document.getElementById('evilQuizCaseCount').textContent = `${chosen.length} cases selected`;
        });
    });
    document.getElementById('evilQuizSettingsBtn').addEventListener('click', openEvilQuizSettings);
    document.getElementById('evilQuizSidebarClose').addEventListener('click', () => { sidebarOpen = false; document.getElementById('evilQuizSidebar').style.display = 'none'; });
    modal.addEventListener('click', (e) => {
        if (sidebarOpen && !document.getElementById('evilQuizSidebar').contains(e.target)) {
            sidebarOpen = false;
            document.getElementById('evilQuizSidebar').style.display = 'none';
        }
    });

    // Hamburger button — inject into header
    const header = modal.querySelector('.training-modal-header > div:first-child');
    const hamburgerBtn = document.createElement('button');
    hamburgerBtn.className = 'training-modal-refresh';
    hamburgerBtn.title = 'Case log';
    hamburgerBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
    hamburgerBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(); });
    // Insert hamburger before the close button group
    const rightDiv = modal.querySelector('.training-modal-header > div:last-child');
    rightDiv.insertBefore(hamburgerBtn, rightDiv.firstChild);

    // Keyboard support
    function handleEvilKeyDown(e) {
        if (!document.getElementById('evilnessQuizModal')) { document.removeEventListener('keydown', handleEvilKeyDown); return; }

        const leftKeys = new Set(['Tab', 'Backquote', 'Digit1', 'Digit2', 'Digit4', 'Digit5', 'Digit6', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyZ', 'KeyX', 'KeyC', 'KeyV']);
        const rightKeys = new Set(['Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'Enter', 'NumpadEnter']);

        if (e.code === 'Escape') {
            e.preventDefault(); e.stopImmediatePropagation();
            if (quizRunning) {
                quizRunning = false;
                clearInterval(timerInt);
                const existing = document.getElementById('evilQuizAnswerOverlay');
                if (existing) existing.remove();
                const timerZone = document.getElementById('evilQuizTimerZone');
                const startOverlay = document.createElement('div');
                startOverlay.id = 'evilQuizStartOverlay';
                startOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:var(--surface);display:flex;align-items:flex-start;justify-content:center;z-index:50;border-radius:inherit;padding-top:2rem;box-sizing:border-box;';
                startOverlay.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:1.2rem;max-width:320px;text-align:center;padding:1.5rem;">
        <div style="font-size:1.1rem;font-weight:700;color:var(--text-ui);">Evilness Quiz</div>
        <div style="font-size:0.88rem;color:var(--text-secondary);line-height:1.6;">
            You'll be shown a scrambled cube image. Decide if the case requires a <span style="color:#2d6a2d;font-weight:700;">Good</span> alg or a <span style="color:#8b0000;font-weight:700;">Bad</span> alg.<br><br>
            Use the <strong>left half</strong> of the screen (or left-side keys) for Good, and the <strong>right half</strong> (or right-side keys) for Evil.
        </div>
        <button id="evilQuizStartBtn" style="padding:0.9rem 2.2rem;background:var(--accent);color:#fff;border:none;border-radius:12px;font-size:1.1rem;font-weight:700;cursor:pointer;">Start</button>
    </div>`;
                timerZone.appendChild(startOverlay);
                document.getElementById('evilQuizStartBtn').addEventListener('click', () => {
                    startOverlay.remove();
                    quizRunning = true;
                    nextQuestion();
                });
                return;
            }
            closeQuiz();
            document.removeEventListener('keydown', handleEvilKeyDown);
            return;
        }

        if (!quizRunning) return;
        const goodBtn = document.getElementById('evilQuizGood');
        const evilBtn = document.getElementById('evilQuizEvil');
        if (leftKeys.has(e.code) && goodBtn && !goodBtn.disabled) { e.preventDefault(); goodBtn.click(); }
        else if (rightKeys.has(e.code) && evilBtn && !evilBtn.disabled) { e.preventDefault(); evilBtn.click(); }
    }

    document.addEventListener('keydown', handleEvilKeyDown);

    // Start button
    document.getElementById('evilQuizStartBtn').addEventListener('click', () => {
        document.getElementById('evilQuizStartOverlay').remove();
        quizRunning = true;
        nextQuestion();
    });
}

// ============================================================
// 2. PARITY QUIZ
// ============================================================

window.openParityQuiz = function () {
    const key = 'sq1-selector-parity';
    window._selectorStorageKey = key;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(key)); } catch (e) { }
    const chosen = (saved && saved.length > 0) ? saved.filter(n => data.some(d => d.name === n)) : data.map(d => d.name);
    startParityQuiz(chosen);
};

function startParityQuiz(chosenCaseNames) {
    const allIndices = [];
    chosenCaseNames.forEach(cn => {
        const entry = shapeIndex.find(e => e.name === cn);
        if (entry) {
            (entry.org || []).forEach(idx => allIndices.push({ idx, caseName: cn }));
            (entry.mir || []).forEach(idx => allIndices.push({ idx, caseName: cn }));
        }
    });
    if (allIndices.length === 0) return;

    let quizLog = [];
    let quizStartTime = 0;
    let currentItem = null;
    let currentParity = null;
    let timerInt = null;
    let questionCount = 0;

    const modal = document.createElement('div');
    modal.id = 'parityQuizModal';
    modal.className = 'training-modal active';
    modal.innerHTML = `
        <div class="training-modal-header">
            <div style="display:flex;gap:10px;align-items:center;">
                <span class="training-modal-title">Parity Quiz</span>
            </div>
            <div style="display:flex;gap:10px;align-items:center;">
                <div id="parityQuizProgress" style="font-size:0.85rem;color:var(--text-muted)">Q1 | 0/0</div>
                <button class="training-modal-refresh" id="parityQuizSelectCases" title="Select cases" style="width:auto;padding:0 12px;font-size:0.8rem;font-weight:600;">Cases</button>
                <button class="training-modal-close" id="parityQuizClose">
                <button class="training-modal-close" id="parityQuizClose">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        </div>
        <div class="training-modal-scramble" id="parityQuizScramble" style="cursor:default;"></div>
        <div class="training-modal-timer-zone" style="flex-direction:column;gap:1rem;justify-content:center;align-items:center;cursor:default;">
            <div class="training-modal-image-container">
                <div class="training-modal-image" id="parityQuizImage"></div>
            </div>
            <div style="font-size:1.1rem;font-weight:600;color:var(--text-ui);">Which alg do you need?</div>
            <div style="display:flex;gap:1rem;justify-content:center;width:100%;max-width:320px;">
                <button id="parityQuizGood" style="flex:1;padding:0.9rem;background:#2d6a2d;color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer;transition:opacity 0.2s;">Good Alg</button>
                <button id="parityQuizBad" style="flex:1;padding:0.9rem;background:#8b0000;color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer;transition:opacity 0.2s;">Bad Alg</button>
            </div>
            <div id="parityQuizFeedback" style="min-height:26px;font-size:0.95rem;font-weight:600;color:var(--text-ui);"></div>
            <div class="training-modal-timer" id="parityQuizTimer">0.000</div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    pushModalState('parityQuizModal', closeQuiz);

    function nextQuestion() {
        currentItem = allIndices[Math.floor(Math.random() * allIndices.length)];
        questionCount++;

        const hexCode = generateHexFromShapeIndex(currentItem.idx);
        let scrambleText = '';
        let imgHTML = '';

        try {
            const state = parseHexFormat(hexCode);
            const notation = window.sq1Tools.scrambleFromState(state);
            scrambleText = notation || hexCode;
            imgHTML = visualizeFromScramble(notation, trainingScrambleImageSize || 200, typeof colorScheme !== 'undefined' ? colorScheme : {});
            currentParity = quizGetParityFromHex(hexCode);
        } catch (e) {
            currentParity = null;
            imgHTML = '<div style="color:var(--text-muted);padding:1rem;">Image unavailable</div>';
        }

        document.getElementById('parityQuizScramble').textContent = scrambleText;
        document.getElementById('parityQuizImage').innerHTML = imgHTML;
        const score = quizLog.filter(l => l.correct).length;
        document.getElementById('parityQuizProgress').textContent = `Q${questionCount} | ${score}/${quizLog.length}`;
        document.getElementById('parityQuizFeedback').textContent = '';
        document.getElementById('parityQuizTimer').textContent = '0.000';
        document.getElementById('parityQuizGood').disabled = false;
        document.getElementById('parityQuizBad').disabled = false;

        quizStartTime = Date.now();
        clearInterval(timerInt);
        timerInt = setInterval(() => {
            document.getElementById('parityQuizTimer').textContent = ((Date.now() - quizStartTime) / 1000).toFixed(3);
        }, 10);
    }

    function handleAnswer(userSaidGood) {
        clearInterval(timerInt);
        const elapsed = Date.now() - quizStartTime;
        document.getElementById('parityQuizGood').disabled = true;
        document.getElementById('parityQuizBad').disabled = true;

        const correctIsGood = currentParity === 'Even';
        const correct = userSaidGood === correctIsGood;
        quizLog.push({ caseName: currentItem.caseName, parity: currentParity, correct, timeMs: elapsed });

        const fb = document.getElementById('parityQuizFeedback');
        fb.textContent = correct ? 'Correct!' : `Wrong — parity is ${currentParity}, need the ${correctIsGood ? 'Good' : 'Bad'} alg.`;
        fb.style.color = correct ? '#2d6a2d' : '#8b0000';

        setTimeout(nextQuestion, 1400);
    }

    const closeQuiz = () => {
        closeModalWithHistory(() => {
            clearInterval(timerInt);
            modal.remove();
            document.body.classList.remove('modal-open');
        });
    };

    document.getElementById('parityQuizGood').addEventListener('click', () => handleAnswer(true));
    document.getElementById('parityQuizBad').addEventListener('click', () => handleAnswer(false));
    document.getElementById('parityQuizClose').addEventListener('click', closeQuiz);
    document.getElementById('parityQuizSelectCases').addEventListener('click', () => {
        openSelectorModal('sq1-selector-parity', (chosen) => {
            allIndices.length = 0;
            chosen.forEach(cn => {
                const entry = shapeIndex.find(e => e.name === cn);
                if (entry) {
                    (entry.org || []).forEach(idx => allIndices.push({ idx, caseName: cn }));
                    (entry.mir || []).forEach(idx => allIndices.push({ idx, caseName: cn }));
                }
            });
        });
    });
    document.getElementById('parityQuizSelectCases').addEventListener('click', () => {
        openSelectorModal('sq1-selector-parity', (chosen) => {
            allIndices.length = 0;
            chosen.forEach(cn => {
                const entry = shapeIndex.find(e => e.name === cn);
                if (entry) {
                    (entry.org || []).forEach(idx => allIndices.push({ idx, caseName: cn }));
                    (entry.mir || []).forEach(idx => allIndices.push({ idx, caseName: cn }));
                }
            });
        });
    });

    nextQuestion();
}

// ============================================================
// 3. THREE-COLOR RECOGNITION PRACTICE
// ============================================================

window.openColorRecognitionPractice = function () {
    startColorRecognitionPractice();
};

function startColorRecognitionPractice() {
    const faceColors = {
        F: typeof colorScheme !== 'undefined' ? colorScheme.frontColor : '#CC0000',
        R: typeof colorScheme !== 'undefined' ? colorScheme.rightColor : '#00AA00',
        B: typeof colorScheme !== 'undefined' ? colorScheme.backColor : '#FF8C00',
        L: typeof colorScheme !== 'undefined' ? colorScheme.leftColor : '#0066CC'
    };
    const faceCodenames = { F: 'R', R: 'G', B: 'O', L: 'B' };
    const opposites = { R: 'O', O: 'R', G: 'B', B: 'G' };

    function calcTrioParity(codes) {
        const trio = codes.slice(0, 3);
        let aloneIdx = -1;
        for (let i = 0; i < 3; i++) {
            const opp = opposites[trio[i]];
            if (!trio.some((c, j) => j !== i && c === opp)) { aloneIdx = i; break; }
        }
        if (aloneIdx === -1) return null;
        let pair;
        if (aloneIdx === 0) pair = trio[0] + trio[1];
        else if (aloneIdx === 2) pair = trio[0] + trio[2];
        else pair = trio[1] + trio[2];
        if (['RG', 'GR', 'OB', 'BO'].includes(pair)) return 1;
        if (['RB', 'BR', 'OG', 'GO'].includes(pair)) return 0;
        return null;
    }

    // Color block emoji map based on actual color scheme
    function getFaceEmoji(face) {
        const col = faceColors[face];
        const r = parseInt(col.substr(1, 2), 16);
        const g = parseInt(col.substr(3, 2), 16);
        const b = parseInt(col.substr(5, 2), 16);
        // Pick closest emoji by dominant channel
        if (r > 150 && g < 100 && b < 100) return '🟥';
        if (r > 150 && g > 100 && b < 80) return '🟧';
        if (r > 150 && g > 150 && b < 80) return '🟨';
        if (r < 100 && g > 130 && b < 100) return '🟩';
        if (r < 100 && g < 100 && b > 130) return '🟦';
        return '⬜';
    }

    function trioEmoji(trio) {
        return trio.map(f => getFaceEmoji(f)).join('');
    }

    const faceKeys = ['F', 'R', 'B', 'L'];

    function permute(arr) {
        if (arr.length <= 1) return [arr];
        const res = [];
        for (let i = 0; i < arr.length; i++) {
            permute([...arr.slice(0, i), ...arr.slice(i + 1)]).forEach(p => res.push([arr[i], ...p]));
        }
        return res;
    }
    const faceComboTrios = [];
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) for (let k = j + 1; k < 4; k++)
        faceComboTrios.push([faceKeys[i], faceKeys[j], faceKeys[k]]);
    const allOrdered = [];
    faceComboTrios.forEach(trio => permute(trio).forEach(p => allOrdered.push(p)));

    function sharesTwo(a, b) {
        // Same set of faces (any order) = always blocked
        if (new Set([...a]).size === new Set([...a, ...b]).size && a.length === b.length) {
            const sa = new Set(a), sb = new Set(b);
            if ([...sa].every(x => sb.has(x))) return true;
        }
        // Same face in same position
        let samePos = 0;
        for (let i = 0; i < Math.min(a.length, b.length); i++) {
            if (a[i] === b[i]) samePos++;
        }
        return samePos >= 2;
    }
    function shufflePacket(prev) {
        const arr = [...allOrdered];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        const firstForbidden = prev ? prev[prev.length - 1] : null;
        if (firstForbidden && sharesTwo(firstForbidden, arr[0])) {
            for (let i = 1; i < arr.length; i++) {
                if (!sharesTwo(firstForbidden, arr[i])) { [arr[0], arr[i]] = [arr[i], arr[0]]; break; }
            }
        }
        for (let i = 1; i < arr.length; i++) {
            if (sharesTwo(arr[i - 1], arr[i])) {
                let swapped = false;
                for (let j = i + 1; j < arr.length; j++) {
                    if (!sharesTwo(arr[i - 1], arr[j]) && (i + 1 >= arr.length || !sharesTwo(arr[j], arr[i + 1]))) {
                        [arr[i], arr[j]] = [arr[j], arr[i]]; swapped = true; break;
                    }
                }
                if (!swapped) for (let j = i + 1; j < arr.length; j++) {
                    if (!sharesTwo(arr[i - 1], arr[j])) { [arr[i], arr[j]] = [arr[j], arr[i]]; break; }
                }
            }
        }
        return arr;
    }

    let packetHistory = [], queue = [];
    function refillQueue() {
        const prev = packetHistory.length > 0 ? packetHistory[packetHistory.length - 1] : null;
        const packet = shufflePacket(prev);
        packetHistory.push(packet);
        queue.push(...packet);
    }
    refillQueue();

    let questionCount = 0, quizLog = [], currentTrio = null, currentParityVal = null, quizStartTime = 0, timerInt = null;
    let quizRunning = false, sidebarOpen = false;

    const modal = document.createElement('div');
    modal.id = 'colorRecogModal';
    modal.className = 'training-modal active';
    modal.innerHTML = `
        <div class="training-modal-header">
            <div style="display:flex;gap:10px;align-items:center;">
                <span class="training-modal-title">Parity Quiz</span>
            </div>
            <div style="display:flex;gap:10px;align-items:center;">
                <div id="colorRecogProgress" style="font-size:0.85rem;color:var(--text-muted)">Q1 | 0/0</div>
                <button class="training-modal-refresh" id="colorRecogHamburger" title="Answer log">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                </button>
                <button class="training-modal-close" id="colorRecogClose">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        </div>
        <div class="training-modal-timer-zone" id="colorRecogTimerZone" style="position:relative;flex-direction:column;gap:1rem;justify-content:center;align-items:center;cursor:default;">
            <div id="colorRecogTrio" style="display:flex;justify-content:center;gap:1rem;"></div>
            <div class="training-modal-timer" id="colorRecogTimer">0.000</div>
            <div id="colorRecogStartOverlay" style="position:absolute;top:0;left:0;width:100%;height:100%;background:var(--surface);display:flex;align-items:flex-start;justify-content:center;z-index:50;border-radius:inherit;padding-top:2rem;box-sizing:border-box;">
                <div style="display:flex;flex-direction:column;align-items:center;gap:1.2rem;max-width:320px;text-align:center;padding:1.5rem;">
                    <div style="font-size:1.1rem;font-weight:700;color:var(--text-ui);">Parity Quiz</div>
                    <div style="font-size:0.88rem;color:var(--text-secondary);line-height:1.6;">
                        You'll see three colors. Based on their colors, determine whether the parity is <span style="color:#2d6a2d;font-weight:700;">Even</span> or <span style="color:#8b0000;font-weight:700;">Odd</span>.<br><br>
                        Press the <strong>left half</strong> of the screen (or left-side keys) for Even, and the <strong>right half</strong> (or right-side keys) for Odd.
                    </div>
                    <button id="colorRecogStartBtn" style="padding:0.9rem 2.2rem;background:var(--accent);color:#fff;border:none;border-radius:12px;font-size:1.1rem;font-weight:700;cursor:pointer;">Start</button>
                </div>
            </div>
        </div>
        <div id="colorRecogSidebar" style="display:none;position:fixed;top:0;right:0;width:260px;height:100%;background:var(--surface);border-left:1px solid var(--border-color);z-index:10001;overflow-y:auto;flex-direction:column;">
            <div style="padding:14px 16px;font-weight:700;color:var(--text-ui);border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;">
                <span>Answer Log</span>
                <button id="colorRecogSidebarClose" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--text-muted);line-height:1;">&times;</button>
            </div>
            <div id="colorRecogLogList" style="padding:10px 12px;font-size:0.82rem;color:var(--text-primary);display:flex;flex-direction:column;gap:6px;"></div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    pushModalState('colorRecogModal', closeQuiz);

    function renderTrio(trio) {
        return trio.map(face => {
            const col = faceColors[face];
            const r2 = parseInt(col.substr(1, 2), 16), g2 = parseInt(col.substr(3, 2), 16), b2 = parseInt(col.substr(5, 2), 16);
            const txtCol = ((0.299 * r2 + 0.587 * g2 + 0.114 * b2) / 255) > 0.5 ? '#000' : '#fff';
            return `<div style="width:90px;height:90px;border-radius:14px;background:${col};box-shadow:0 2px 10px rgba(0,0,0,0.2);border-radius:14px;"></div>`;
        }).join('');
    }

    function renderSidebar() {
        const list = document.getElementById('colorRecogLogList');
        if (!list) return;
        if (quizLog.length === 0) { list.innerHTML = '<span style="color:var(--text-muted);font-style:italic;">No answers yet.</span>'; return; }
        list.innerHTML = [...quizLog].reverse().map(entry => {
            const icon = entry.correct ? '✓' : '✗';
            const color = entry.correct ? '#2d6a2d' : '#cc0000';
            const timeStr = (entry.timeMs / 1000).toFixed(3) + 's';
            const answerStr = entry.correctIsEven ? 'Even' : 'Odd';
            return `<div style="padding:6px 8px;border-radius:6px;background:${entry.correct ? 'var(--card-learned-bg)' : 'var(--toast-error-bg)'};border:1px solid ${entry.correct ? 'var(--card-learned-border)' : 'var(--bad-case)'};">
                <span style="color:${color};font-weight:700;">${icon}</span>
                <span style="font-size:1.1em;margin-left:4px;">${entry.emoji}</span>
                <span style="color:#888;font-size:0.78rem;margin-left:4px;">${answerStr}</span>
                <span style="float:right;color:var(--text-muted)">${timeStr}</span>
            </div>`;
        }).join('');
    }

    function toggleSidebar() {
        sidebarOpen = !sidebarOpen;
        const sb = document.getElementById('colorRecogSidebar');
        if (sb) { sb.style.display = sidebarOpen ? 'flex' : 'none'; renderSidebar(); }
    }

    function removeAnswerOverlay() {
        const ex = document.getElementById('colorRecogAnswerOverlay');
        if (ex) ex.remove();
    }

    function nextQuestion() {
        clearInterval(timerInt);
        removeAnswerOverlay();

        if (queue.length === 0) refillQueue();
        currentTrio = queue.shift();
        currentParityVal = calcTrioParity(currentTrio.map(f => faceCodenames[f]));
        questionCount++;

        const score = quizLog.filter(l => l.correct).length;
        document.getElementById('colorRecogTrio').innerHTML = renderTrio(currentTrio);
        document.getElementById('colorRecogProgress').textContent = `Q${questionCount} | ${score}/${quizLog.length}`;
        document.getElementById('colorRecogTimer').textContent = '0.000';

        const timerZone = document.getElementById('colorRecogTimerZone');
        const overlay = document.createElement('div');
        overlay.id = 'colorRecogAnswerOverlay';
        overlay.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:row;z-index:100;border-radius:inherit;overflow:hidden;`;
        overlay.innerHTML = `
            <button id="colorRecogEven" style="flex:1;border:none;cursor:pointer;background:rgba(45,106,45,0.10);display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:800;color:rgba(45,106,45,0.85);letter-spacing:0.06em;transition:background 0.15s;">EVEN</button>
            <div style="width:1px;background:rgba(0,0,0,0.07);flex-shrink:0;"></div>
            <button id="colorRecogOdd" style="flex:1;border:none;cursor:pointer;background:rgba(139,0,0,0.10);display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:800;color:rgba(139,0,0,0.85);letter-spacing:0.06em;transition:background 0.15s;">ODD</button>
        `;
        timerZone.appendChild(overlay);

        const mq = window.matchMedia('(max-width:500px)');
        function applyLayout(narrow) {
            overlay.style.flexDirection = narrow ? 'column' : 'row';
            const div = overlay.querySelector('div');
            if (div) { div.style.width = narrow ? '100%' : '1px'; div.style.height = narrow ? '1px' : '100%'; }
        }
        applyLayout(mq.matches);
        mq.addEventListener('change', e => applyLayout(e.matches));

        quizStartTime = Date.now();
        timerInt = setInterval(() => {
            document.getElementById('colorRecogTimer').textContent = ((Date.now() - quizStartTime) / 1000).toFixed(3);
        }, 10);

        document.getElementById('colorRecogEven').addEventListener('click', () => handleAnswer(true));
        document.getElementById('colorRecogOdd').addEventListener('click', () => handleAnswer(false));
    }

    function handleAnswer(userSaidEven) {
        clearInterval(timerInt);
        const elapsed = Date.now() - quizStartTime;
        const correctIsEven = currentParityVal === 0;
        const correct = userSaidEven === correctIsEven;
        quizLog.push({ trio: currentTrio.join('/'), emoji: trioEmoji(currentTrio), correctIsEven, correct, timeMs: elapsed });
        if (sidebarOpen) renderSidebar();

        if (correct) {
            nextQuestion();
        } else {
            const wrongBtn = userSaidEven ? document.getElementById('colorRecogEven') : document.getElementById('colorRecogOdd');
            if (wrongBtn) {
                wrongBtn.style.background = 'rgba(200,0,0,0.22)';
                wrongBtn.style.color = 'rgba(180,0,0,0.9)';
                wrongBtn.disabled = true;
                const otherBtn = userSaidEven ? document.getElementById('colorRecogOdd') : document.getElementById('colorRecogEven');
                if (otherBtn) otherBtn.disabled = true;
                setTimeout(nextQuestion, 600);
            }
        }
    }

    const closeQuiz = () => {
        closeModalWithHistory(() => {
            clearInterval(timerInt);
            document.removeEventListener('keydown', handleColorKeyDown);
            modal.remove();
            document.body.classList.remove('modal-open');
        });
    };

    function handleColorKeyDown(e) {
        if (!document.getElementById('colorRecogModal')) { document.removeEventListener('keydown', handleColorKeyDown); return; }
        const leftKeys = new Set(['Tab', 'Backquote', 'Digit1', 'Digit2', 'Digit4', 'Digit5', 'Digit6', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyZ', 'KeyX', 'KeyC', 'KeyV']);
        const rightKeys = new Set(['Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'Enter', 'NumpadEnter']);

        if (e.code === 'Escape') {
            e.preventDefault(); e.stopImmediatePropagation();
            if (quizRunning) {
                quizRunning = false;
                clearInterval(timerInt);
                removeAnswerOverlay();
                showColorRecogStartOverlay();
                return;
            }
            closeQuiz();
            return;
        }

        if (!quizRunning) return;
        const evenBtn = document.getElementById('colorRecogEven');
        const oddBtn = document.getElementById('colorRecogOdd');
        if (leftKeys.has(e.code) && evenBtn && !evenBtn.disabled) { e.preventDefault(); evenBtn.click(); }
        else if (rightKeys.has(e.code) && oddBtn && !oddBtn.disabled) { e.preventDefault(); oddBtn.click(); }
    }
    document.addEventListener('keydown', handleColorKeyDown);

    document.getElementById('colorRecogClose').addEventListener('click', closeQuiz);
    document.getElementById('colorRecogHamburger').addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(); });
    document.getElementById('colorRecogSidebarClose').addEventListener('click', () => { sidebarOpen = false; document.getElementById('colorRecogSidebar').style.display = 'none'; });
    modal.addEventListener('click', (e) => {
        if (sidebarOpen && !document.getElementById('colorRecogSidebar').contains(e.target)) {
            sidebarOpen = false;
            document.getElementById('colorRecogSidebar').style.display = 'none';
        }
    });

    function showColorRecogStartOverlay() {
        let existing = document.getElementById('colorRecogStartOverlay');
        if (existing) existing.remove();
        const timerZone = document.getElementById('colorRecogTimerZone');
        const startOverlay = document.createElement('div');
        startOverlay.id = 'colorRecogStartOverlay';
        startOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:var(--surface);display:flex;align-items:flex-start;justify-content:center;z-index:50;border-radius:inherit;padding-top:2rem;box-sizing:border-box;';
        startOverlay.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:1.2rem;max-width:320px;text-align:center;padding:1.5rem;">
                <div style="font-size:1.1rem;font-weight:700;color:var(--text-ui);">Parity Quiz</div>
                <div style="font-size:0.88rem;color:var(--text-secondary);line-height:1.6;">
                    You'll see three colors. Based on their colors, determine whether the parity is <span style="color:#2d6a2d;font-weight:700;">Even</span> or <span style="color:#8b0000;font-weight:700;">Odd</span>.<br><br>
                    Press the <strong>left half</strong> of the screen (or left-side keys) for Even, and the <strong>right half</strong> (or right-side keys) for Odd.
                </div>
                <button id="colorRecogStartBtn" style="padding:0.9rem 2.2rem;background:var(--accent);color:#fff;border:none;border-radius:12px;font-size:1.1rem;font-weight:700;cursor:pointer;">Start</button>
            </div>`;
        timerZone.appendChild(startOverlay);
        document.getElementById('colorRecogStartBtn').addEventListener('click', () => {
            startOverlay.remove();
            quizRunning = true;
            nextQuestion();
        });
    }

    showColorRecogStartOverlay();
}

// ============================================================
// TRAINER PICKER
// ============================================================

window.openTrainerPickerModal = function () {
    let picker = document.getElementById('trainerPickerModal');
    if (picker) picker.remove();

    picker = document.createElement('div');
    picker.id = 'trainerPickerModal';
    picker.className = 'shape-index-selector-modal active';

    const evilnessEnabled = typeof evilnessFactor !== 'undefined' && evilnessFactor;
    const evilnessBtn = evilnessEnabled
        ? `<button onclick="trainerPickerLaunch('evilness')" class="trainer-pick-btn">Evilness Quiz</button>`
        : '';

    picker.innerHTML = `
        <div class="shape-index-selector-content" style="max-width:380px;">
            <div class="shape-index-selector-header">
                <span class="shape-index-selector-title">Choose Trainer</span>
                <button class="shape-index-selector-close" id="trainerPickerClose">&times;</button>
            </div>
            <div class="shape-index-selector-body" style="display:flex;flex-direction:column;gap:10px;">
                <button onclick="trainerPickerLaunch('timer')" class="trainer-pick-btn">Timer Training</button>
                ${evilnessBtn}
                <button onclick="trainerPickerLaunch('color')" class="trainer-pick-btn">Parity Quiz</button>
            </div>
        </div>
    `;

    const style = document.getElementById('trainerPickerStyle') || document.createElement('style');
    style.id = 'trainerPickerStyle';
    style.textContent = `.trainer-pick-btn{padding:14px 18px;background:var(--surface2);border:2px solid var(--border-color);border-radius:10px;cursor:pointer;font-size:0.95rem;font-weight:600;color:var(--text-ui);text-align:left;width:100%;transition:all 0.15s;} .trainer-pick-btn:hover{border-color:var(--accent);background:var(--hover-bg);}`;
    if (!style.parentNode) document.head.appendChild(style);

    document.body.appendChild(picker);
    pushModalState('trainerPickerModal', closeTrainerPickerModal);
    document.getElementById('trainerPickerClose').addEventListener('click', closeTrainerPickerModal);
    picker.addEventListener('click', e => { if (e.target === picker) closeTrainerPickerModal(); });
};

function closeTrainerPickerModal() {
    closeModalWithHistory(() => {
        const picker = document.getElementById('trainerPickerModal');
        if (picker) picker.remove();
    });
}

window.trainerPickerLaunch = function (type) {
    const picker = document.getElementById('trainerPickerModal');
    if (picker) picker.remove();

    const KEYS = {
        timer: 'sq1-selector-cases',
        evilness: 'sq1-selector-evilness',
        parity: 'sq1-selector-parity',
        color: 'sq1-selector-color',
    };
    const key = KEYS[type];
    window._selectorStorageKey = key;

    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(key)); } catch (e) { }
    const chosen = (saved && saved.length > 0) ? saved.filter(n => data.some(d => d.name === n)) : data.map(d => d.name);

    if (type === 'timer') {
        selectorSelectedCases = new Set(chosen);
        openMultiCaseTrainingModal(chosen);
    } else if (type === 'evilness') {
        startEvilnessQuiz(chosen);
    } else if (type === 'parity') {
        startParityQuiz(chosen);
    } else if (type === 'color') {
        startColorRecognitionPractice();
    }
};
