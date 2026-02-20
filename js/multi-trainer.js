// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                        MULTI-CASE TRAINING SELECTOR                     ║
// ╚══════════════════════════════════════════════════════════════════════════╝

let selectorSelectedCases = new Set();
let selectorSearchTerm = '';
let selectorFilteredData = [];

// ─── Persistence ──────────────────────────────────────────────────────────────

function saveSelectorSelection() {
    try {
        const arr = [...selectorSelectedCases];
        localStorage.setItem('sq1-selector-cases', JSON.stringify(arr));
    } catch (e) { }
}

function loadSelectorSelection() {
    try {
        const raw = localStorage.getItem('sq1-selector-cases');
        if (raw) {
            const arr = JSON.parse(raw);
            selectorSelectedCases = new Set(arr.filter(n => data.some(d => d.name === n)));
        }
    } catch (e) { }
    // Default: all cases selected
    if (selectorSelectedCases.size === 0) {
        data.forEach(item => selectorSelectedCases.add(item.name));
        saveSelectorSelection();
    }
}

// Call once data is ready (after DOMContentLoaded / window.load)
document.addEventListener('DOMContentLoaded', () => {
    // Wait a tick so `data` is populated
    setTimeout(loadSelectorSelection, 0);
});

// ─── Open selector as a modal overlay (not fullscreen) ───────────────────────

window.openTrainingSelector = function () {
    // Start training immediately with currently selected cases
    if (selectorSelectedCases.size === 0) loadSelectorSelection();
    openMultiCaseTrainingModal([...selectorSelectedCases]);
};

function openSelectorModal() {
    createSelectorModal();
    const modal = document.getElementById('trainingSelectorModal');
    if (!modal) return;

    pushModalState('trainingSelectorModal', closeSelectorModal);

    // Don't reset search term — but DO re-render so the list matches current term
    renderSelectorCases();

    modal.style.display = 'flex';
    document.body.classList.add('modal-open');

    // Restore search input value
    const inp = document.getElementById('selectorSearchInput');
    if (inp) inp.value = selectorSearchTerm;
}

window.closeSelectorModal = function () {
    const modal = document.getElementById('trainingSelectorModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
};

// ─── Modal Creation ───────────────────────────────────────────────────────────

function createSelectorModal() {
    if (document.getElementById('trainingSelectorModal')) return;

    const modal = document.createElement('div');
    modal.id = 'trainingSelectorModal';
    modal.style.cssText = `
        display: none;
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.55);
        z-index: 10001;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
    `;

    modal.innerHTML = `
        <div style="
            background: #fff;
            border-radius: 14px;
            width: min(560px, 100%);
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 8px 32px rgba(0,0,0,0.25);
            overflow: hidden;
        ">
            <!-- Header -->
            <div style="flex-shrink:0; padding: 16px 20px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; display:flex; align-items:center; justify-content:space-between;">
                <div style="display:flex; align-items:baseline; gap:8px; flex-wrap:wrap;">
                    <span style="font-size:1.15rem; font-weight:700; color:#2d3748;">Select Cases</span>
                    <span id="selectorCountBar" style="font-size:0.8rem; color:#888; font-weight:400;"></span>
                </div>
                <button onclick="closeSelectorModal()" style="background:none; border:none; font-size:1.6rem; cursor:pointer; color:#666; line-height:1; padding:0;">&times;</button>
            </div>

            <!-- Search + Custom Select bar -->
            <div style="flex-shrink:0; padding: 10px 14px; background:#f8f9fa; border-bottom:1px solid #e9ecef; display:flex; gap:8px; align-items:center;">
                <div style="position:relative; flex:1; min-width:0;">
                    <input type="text" id="selectorSearchInput"
                        placeholder="Search cases..."
                        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                        style="width:100%; padding:7px 10px 7px 32px; border:1px solid #dee2e6; border-radius:7px; font-size:0.88rem; outline:none; box-sizing:border-box;"
                        oninput="onSelectorSearch(this.value)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        style="position:absolute; left:9px; top:50%; transform:translateY(-50%); width:15px; height:15px; pointer-events:none;">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                </div>
                <select id="selectorBulkAction"
                    style="padding:7px 8px; border:1px solid #dee2e6; border-radius:7px; font-size:0.82rem; background:white; cursor:pointer; color:#495057; flex-shrink:0;"
                    onchange="applySelectorBulkAction(this.value); this.value='';">
                    <option value="" disabled selected>Select…</option>
                    <option value="select_all">Select All</option>
                    <option value="select_learning">Select Learning</option>
                    <option value="select_learned">Select Learned</option>
                    <option value="select_learning_learned">Select Learning + Learned</option>
                    <option value="select_these">Select These (add to selection)</option>
                    <option value="deselect_learned">Deselect Learned</option>
                    <option value="deselect_these">Deselect These</option>
                    <option value="deselect_all">Deselect All</option>
                </select>
            </div>

            <!-- Cases grid -->
            <div id="selectorCaseGrid" style="
                flex:1; overflow-y:auto; padding:10px 12px;
                display:grid;
                grid-template-columns: repeat(3, 1fr);
                gap:7px;
                align-content:start;
            "></div>
        </div>
    `;

    // Close on backdrop click
    modal.addEventListener('click', e => { if (e.target === modal) closeSelectorModal(); });

    document.body.appendChild(modal);
}

// ─── Search ───────────────────────────────────────────────────────────────────

window.onSelectorSearch = function (val) {
    selectorSearchTerm = val.toLowerCase().trim();
    renderSelectorCases();
};

function getSelectorSorted(arr) {
    return [...arr].sort((a, b) => {
        const aLearning = learningCases.has(a.name);
        const bLearning = learningCases.has(b.name);
        const aLearned = learnedCases.has(a.name);
        const bLearned = learnedCases.has(b.name);
        const aPlanned = plannedCases.has(a.name);
        const bPlanned = plannedCases.has(b.name);
        if (aLearning && !bLearning) return -1;
        if (!aLearning && bLearning) return 1;
        if (aPlanned && bPlanned) {
            return (plannedLevels.get(a.name) || 4) - (plannedLevels.get(b.name) || 4);
        }
        if (aPlanned && !bPlanned) return -1;
        if (!aPlanned && bPlanned) return 1;
        if (aLearned && !bLearned) return 1;
        if (!aLearned && bLearned) return -1;
        return 0;
    });
}

function getSelectorFilteredData() {
    if (!selectorSearchTerm) return getSelectorSorted(data);
    return getSelectorSorted(data.filter(item => {
        const displayName = getDisplayName(item.name).toLowerCase();
        const name = item.name.toLowerCase();
        const term = selectorSearchTerm;
        if (!term.includes('/')) {
            return displayName.includes(term) || name.includes(term);
        }
        const [p1, p2] = term.split('/').map(p => p.trim());
        const parts = displayName.split('/').map(p => p.trim());
        if (parts.length === 2) {
            return (parts[0].includes(p1) && parts[1].includes(p2)) ||
                (parts[1].includes(p1) && parts[0].includes(p2));
        }
        return false;
    }));
}

// ─── Render Cases Grid ────────────────────────────────────────────────────────

function renderSelectorCases() {
    const grid = document.getElementById('selectorCaseGrid');
    if (!grid) return;

    selectorFilteredData = getSelectorFilteredData();

    grid.innerHTML = selectorFilteredData.map(item => {
        const isSelected = selectorSelectedCases.has(item.name);
        const isLearned = learnedCases.has(item.name);
        const isLearning = learningCases.has(item.name);
        const priorityLevel = plannedLevels.get(item.name) || 4;

        let bgColor, borderColor, textColor, checkColor;
        if (isLearned) {
            bgColor = isSelected ? '#c3e6cb' : '#f0fff4';
            borderColor = isSelected ? '#28a745' : '#a8d5b5';
            textColor = '#155724';
            checkColor = '#28a745';
        } else if (isLearning) {
            bgColor = isSelected ? '#ffeeba' : '#fffdf0';
            borderColor = isSelected ? '#ffc107' : '#ffe082';
            textColor = '#856404';
            checkColor = '#e0a800';
        } else {
            const priorityBgs = ['#e3f0ff', '#e8f4ff', '#eef7ff', '#f8f9fa', '#fff8ee', '#fff3e0', '#fdecea'];
            const priorityBords = ['#90b8f0', '#a0c4f8', '#b0d0fc', '#dee2e6', '#ffd699', '#ffb74d', '#ef9a9a'];
            bgColor = isSelected ? priorityBgs[priorityLevel - 1] : '#ffffff';
            borderColor = isSelected ? priorityBords[priorityLevel - 1] : '#dee2e6';
            textColor = '#2d3748';
            checkColor = '#007bff';
        }

        return `
            <div onclick="toggleSelectorCase('${item.name.replace(/'/g, "\\'")}')"
                style="
                    padding: 7px 8px;
                    background: ${bgColor};
                    border: 2px solid ${borderColor};
                    border-radius: 7px;
                    cursor: pointer;
                    display: flex;
                    align-items: flex-start;
                    gap: 7px;
                    user-select: none;
                    box-sizing: border-box;
                    width: 100%;
                ">
                <div style="
                    width:16px; height:16px; border-radius:3px; flex-shrink:0; margin-top:1px;
                    border:2px solid ${isSelected ? checkColor : '#ccc'};
                    background:${isSelected ? checkColor : 'white'};
                    display:flex; align-items:center; justify-content:center;
                ">
                    ${isSelected ? `<svg viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:9px;height:9px;"><polyline points="2 6 5 9 10 3"/></svg>` : ''}
                </div>
                <span style="font-size:0.78rem; font-weight:600; color:${textColor}; line-height:1.3; word-break:break-word;">${(() => { const n = getDisplayName(item.name); return n.includes('/') ? n.replace(/ /g, '\u00A0').replace('/', '/\u200B') : n; })()}</span>
            </div>
        `;
    }).join('');

    const countBar = document.getElementById('selectorCountBar');
    if (countBar) {
        const total = selectorSelectedCases.size;
        countBar.textContent = `${total} out of ${data.length} selected` +
            (selectorSearchTerm ? ` · ${selectorFilteredData.length} shown` : '');
    }
}

// ─── Toggle Case ──────────────────────────────────────────────────────────────

window.toggleSelectorCase = function (caseName) {
    if (selectorSelectedCases.has(caseName)) {
        selectorSelectedCases.delete(caseName);
    } else {
        selectorSelectedCases.add(caseName);
    }
    saveSelectorSelection();
    renderSelectorCases();
    if (window._multiCaseMode) {
        multiTrainingCases = [...selectorSelectedCases];
        updateMultiTrainingTitle();
        // Only regenerate if the currently showing scramble's case was deselected
        const current = scrambleHistory[currentHistoryIndex];
        if (current && current.caseName === caseName && !selectorSelectedCases.has(caseName)) {
            regenerateMultiScrambleLookahead();
        }
    }
};

// ─── Bulk Actions ─────────────────────────────────────────────────────────────

window.applySelectorBulkAction = function (action) {
    switch (action) {
        case 'select_all':
            selectorSelectedCases.clear();
            data.forEach(i => selectorSelectedCases.add(i.name));
            break;
        case 'select_learning':
            selectorSelectedCases.clear();
            data.forEach(i => { if (learningCases.has(i.name)) selectorSelectedCases.add(i.name); });
            break;
        case 'select_learned':
            selectorSelectedCases.clear();
            data.forEach(i => { if (learnedCases.has(i.name)) selectorSelectedCases.add(i.name); });
            break;
        case 'select_learning_learned':
            selectorSelectedCases.clear();
            data.forEach(i => {
                if (learningCases.has(i.name) || learnedCases.has(i.name)) selectorSelectedCases.add(i.name);
            });
            break;
        case 'select_these':
            // Additive only
            selectorFilteredData.forEach(i => selectorSelectedCases.add(i.name));
            break;
        case 'deselect_learned':
            data.forEach(i => { if (learnedCases.has(i.name)) selectorSelectedCases.delete(i.name); });
            break;
        case 'deselect_these':
            selectorFilteredData.forEach(i => selectorSelectedCases.delete(i.name));
            break;
        case 'deselect_all':
            selectorSelectedCases.clear();
            break;
    }
    saveSelectorSelection();
    renderSelectorCases();
    if (window._multiCaseMode) {
        multiTrainingCases = [...selectorSelectedCases];
        updateMultiTrainingTitle();
        // Only regenerate if the currently showing scramble's case is no longer selected
        const current = scrambleHistory[currentHistoryIndex];
        if (current && current.caseName && !selectorSelectedCases.has(current.caseName)) {
            regenerateMultiScrambleLookahead();
        }
    }
};

// ─── Multi-Case Training Modal ────────────────────────────────────────────────

let multiTrainingCases = [];

window.openMultiCaseTrainingModal = function (caseNames) {
    multiTrainingCases = caseNames;

    createTrainingModal();

    const modal = document.getElementById('trainingModal');
    const titleEl = document.getElementById('trainingCaseName');

    pushModalState('trainingModal', closeTrainingModal);

    titleEl.onclick = (e) => { e.stopPropagation(); openSelectorModal(); };
    updateMultiTrainingTitle();

    const savedTrainingImageSize = localStorage.getItem('trainingScrambleImageSize');
    const savedTrainingTextSize = localStorage.getItem('trainingScrambleTextSize');
    const savedTrainingHoldToStart = localStorage.getItem('trainingHoldToStart');

    trainingScrambleImageSize = savedTrainingImageSize ? parseInt(savedTrainingImageSize) : 200;
    trainingScrambleTextSize = savedTrainingTextSize ? parseInt(savedTrainingTextSize) : 16;
    trainingHoldToStart = savedTrainingHoldToStart ? parseFloat(savedTrainingHoldToStart) : 0.22;

    timerElapsed = 0;
    scrambleHistory = [];
    currentHistoryIndex = -1;
    isHoldReady = false;
    preGeneratedScrambles = [];

    window._multiCaseMode = true;

    for (let i = 0; i < 3; i++) {
        preGeneratedScrambles.push(generateNextScrambleData());
    }

    displayNextScramble();

    modal.classList.add('active');
    document.body.classList.add('modal-open');
    if (typeof applyPrevScrambleBar === 'function') applyPrevScrambleBar();
};

function updateMultiTrainingTitle() {
    const titleEl = document.getElementById('trainingCaseName');
    if (!titleEl) return;
    const n = multiTrainingCases.length;
    titleEl.textContent = `${n} case${n !== 1 ? 's' : ''} selected`;
}

// ─── Regenerate lookahead when cases change ───────────────────────────────────

function regenerateMultiScrambleLookahead() {
    preGeneratedScrambles = [];
    for (let i = 0; i < 3; i++) {
        preGeneratedScrambles.push(generateNextScrambleData());
    }
    // Show a fresh scramble
    if (currentHistoryIndex === scrambleHistory.length - 1 || scrambleHistory.length === 0) {
        displayNextScramble();
    }
    updateMultiTrainingTitle();
}

// ─── Scramble Generation ──────────────────────────────────────────────────────

function generateMultiCaseScrambleData() {
    if (!multiTrainingCases || multiTrainingCases.length === 0) return null;

    const caseName = multiTrainingCases[Math.floor(Math.random() * multiTrainingCases.length)];
    const shapeIndexItem = shapeIndex.find(s => s.name === caseName);
    if (!shapeIndexItem) return null;

    const selectedKey = `training_selected_${caseName}`;
    let indices = (window.trainingSelections && window.trainingSelections[selectedKey])
        ? window.trainingSelections[selectedKey]
        : [...(shapeIndexItem.org || []), ...(shapeIndexItem.mir || [])];

    if (!indices || indices.length === 0) return null;

    const scramble = indices[Math.floor(Math.random() * indices.length)];
    const hexCode = generateHexFromShapeIndex(scramble);

    let scrambleText = hexCode;
    let scrambleImage = '<div style="color:#999;">Image unavailable</div>';

    try {
        const state = parseHexFormat(hexCode);
        scrambleText = window.sq1Tools.scrambleFromState(state) || hexCode;
        if (typeof SQ1ColorizerLib !== 'undefined' && SQ1ColorizerLib.processScramble) {
            scrambleText = SQ1ColorizerLib.processScramble(scrambleText).html || scrambleText;
        }
    } catch (e) { console.error('Multi scramble gen error:', e); }

    try {
        if (typeof visualizeFromScrambleNotationPlease !== 'undefined') {
            const state = parseHexFormat(hexCode);
            const notation = window.sq1Tools.scrambleFromState(state) || hexCode;
            scrambleImage = visualizeFromScrambleNotationPlease(notation, trainingScrambleImageSize, colorScheme);
        } else {
            scrambleImage = generateScrambleSVGFromHex(hexCode);
        }
    } catch (e) { console.error('Multi image gen error:', e); }

    return { text: scrambleText, image: scrambleImage, caseName };
}

// ─── Patch generateNextScrambleData ──────────────────────────────────────────

const _origGenerateNextScrambleData = generateNextScrambleData;
window.generateNextScrambleData = function () {
    if (window._multiCaseMode) {
        const d = generateMultiCaseScrambleData();
        // Update subtitle with case name after display
        return d;
    }
    return _origGenerateNextScrambleData();
};

// ─── Patch closeTrainingModal ─────────────────────────────────────────────────

window.closeTrainingModal = function () {
    const modal = document.getElementById('trainingModal');
    if (!modal) return;

    modal.classList.remove('active');
    document.body.classList.remove('modal-open');

    const bar = document.getElementById('prevScrambleBar');
    if (bar) bar.style.display = 'none';

    if (timerRunning) stopTimerOnly();

    preGeneratedScrambles = [];
    timerElapsed = 0;
    scrambleHistory = [];
    currentHistoryIndex = -1;
    currentTrainingCase = null;
    isHoldReady = false;
    window._multiCaseMode = false;

    filterAndSort(true);
};

// ─── Export / Import hooks ────────────────────────────────────────────────────
// These are called from exportData() / importData() in restoftheapp.js via
// window.selectorExportHook / window.selectorImportHook

window.selectorExportHook = function (stateObj) {
    stateObj.selectorSelectedCases = [...selectorSelectedCases];
    return stateObj;
};

window.selectorImportHook = function (stateObj) {
    if (stateObj.selectorSelectedCases && Array.isArray(stateObj.selectorSelectedCases)) {
        selectorSelectedCases = new Set(stateObj.selectorSelectedCases.filter(n => data.some(d => d.name === n)));
        saveSelectorSelection();
    }
};