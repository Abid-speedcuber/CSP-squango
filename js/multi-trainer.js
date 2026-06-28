// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                        MULTI-CASE TRAINING SELECTOR                     ║
// ╚══════════════════════════════════════════════════════════════════════════╝

let selectorSelectedCases = new Set();
let selectorSearchTerm = '';
let selectorFilteredData = [];

// ─── Persistence ──────────────────────────────────────────────────────────────

function saveSelectorSelection(key) {
    try {
        const storageKey = key || window._selectorStorageKey || 'sq1-selector-cases';
        localStorage.setItem(storageKey, JSON.stringify([...selectorSelectedCases]));
    } catch (e) { }
}

function loadSelectorSelection(key) {
    try {
        const storageKey = key || window._selectorStorageKey || 'sq1-selector-cases';
        const raw = localStorage.getItem(storageKey);
        if (raw) {
            const arr = JSON.parse(raw);
            selectorSelectedCases = new Set(arr.filter(n => data.some(d => d.name === n)));
        }
    } catch (e) { }
    if (selectorSelectedCases.size === 0) {
        data.forEach(item => selectorSelectedCases.add(item.name));
        saveSelectorSelection(key);
    }
}

// Call once data is ready (after DOMContentLoaded / window.load)
document.addEventListener('DOMContentLoaded', () => {
    // Wait a tick so `data` is populated
    setTimeout(loadSelectorSelection, 0);
});

// ─── Per-trainer "go through each case" setting ──────────────────────────────
// Keyed by each trainer's selector storage key so the timer and evilness trainers
// keep independent toggles (just like their independent case selections).
const TIMER_SELECTOR_KEY = 'sq1-selector-cases';
function _goThroughKey(selectorKey) {
    return 'goThroughEachCase:' + (selectorKey || window._selectorStorageKey || TIMER_SELECTOR_KEY);
}
window._isGoThroughEnabled = function (selectorKey) {
    const v = localStorage.getItem(_goThroughKey(selectorKey));
    if (v !== null) return v === 'true';
    // Legacy fallback to the old shared key so existing users keep their setting.
    return localStorage.getItem('trainingGoThroughEachCase') === 'true';
};

// ─── Open selector as a modal overlay (not fullscreen) ───────────────────────

window.openTrainingSelector = function () {
    window._selectorStorageKey = 'sq1-selector-cases';
    if (selectorSelectedCases.size === 0) loadSelectorSelection('sq1-selector-cases');
    openMultiCaseTrainingModal([...selectorSelectedCases]);
};

function openSelectorModal(storageKey, onCloseCallback) {
    if (storageKey) window._selectorStorageKey = storageKey;
    else if (!window._selectorStorageKey) window._selectorStorageKey = 'sq1-selector-cases';

    if (onCloseCallback) window._selectorCloseCallback = onCloseCallback;
    else window._selectorCloseCallback = null;

    loadSelectorSelection(window._selectorStorageKey);

    createSelectorModal();
    const modal = document.getElementById('trainingSelectorModal');
    if (!modal) return;

    pushModalState('trainingSelectorModal', closeSelectorModal);

    renderSelectorCases();
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');

    const inp = document.getElementById('selectorSearchInput');
    if (inp) inp.value = selectorSearchTerm;

    // Reflect THIS trainer's go-through setting (the modal is cached/reused).
    const gt = document.getElementById('selectorGoThrough');
    if (gt) gt.checked = window._isGoThroughEnabled(window._selectorStorageKey);
}

window.closeSelectorModal = function () {
    closeModalWithHistory(() => {
        const modal = document.getElementById('trainingSelectorModal');
        if (!modal) return;
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    });
};

// ─── Modal Creation ───────────────────────────────────────────────────────────

function createSelectorModal() {
    if (document.getElementById('trainingSelectorModal')) return;

    const modal = document.createElement('div');
    modal.id = 'trainingSelectorModal';
    modal.style.cssText = `
        display: none;
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: var(--modal-overlay);
        z-index: 10001;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
    `;

    modal.innerHTML = `
        <div style="
            background: var(--surface);
            border-radius: 14px;
            width: min(560px, 100%);
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 8px 32px rgba(0,0,0,0.25);
            overflow: hidden;
        ">
            <!-- Header -->
            <div style="flex-shrink:0; padding: 16px 20px; background: var(--modal-header-bg); border-bottom: 1px solid var(--surface-border); display:flex; align-items:center; justify-content:space-between;">
                <div style="display:flex; align-items:baseline; gap:8px; flex-wrap:wrap;">
                    <span style="font-size:1.15rem; font-weight:700; color: var(--text-primary);">Select Cases</span>
                    <span id="selectorCountBar" style="font-size:0.8rem; color:var(--text-secondary); font-weight:400;"></span>
                </div>
                <button onclick="closeSelectorModal()" style="background:none; border:none; font-size:1.6rem; cursor:pointer; color:var(--text-secondary); line-height:1; padding:0;">&times;</button>
            </div>

            <!-- Search + Custom Select bar -->
            <div style="flex-shrink:0; padding: 10px 14px; background:var(--surface2); border-bottom:1px solid var(--surface-border); display:flex; gap:8px; align-items:center;">
                <div style="position:relative; flex:1; min-width:0;">
                    <input type="text" id="selectorSearchInput"
                        placeholder="Search cases..."
                        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                        style="width:100%; padding:7px 10px 7px 32px; border: 1px solid var(--border-color); border-radius:7px; font-size:0.88rem; outline:none; box-sizing:border-box;"
                        oninput="onSelectorSearch(this.value)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        style="position:absolute; left:9px; top:50%; transform:translateY(-50%); width:15px; height:15px; pointer-events:none;">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                </div>
                <select id="selectorBulkAction"
                    style="padding:7px 8px; border: 1px solid var(--border-color); border-radius:7px; font-size:0.82rem; background:var(--surface); cursor:pointer; color:var(--text-secondary); flex-shrink:0;"
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

            <!-- Footer: Go through each case once -->
            <div style="flex-shrink:0; padding:10px 16px; background:var(--surface2); border-top:1px solid var(--surface-border); display:flex; align-items:center; gap:9px;">
                <input type="checkbox" id="selectorGoThrough" ${window._isGoThroughEnabled && window._isGoThroughEnabled(window._selectorStorageKey) ? 'checked' : ''}
                    onchange="_toggleGoThroughFromSelector(this.checked)" style="transform:scale(1.2); cursor:pointer;">
                <label for="selectorGoThrough" style="font-size:0.88rem; color:var(--text-secondary); cursor:pointer;">
                    Go through each case once
                    <span class="info-wrapper">
                        <button class="settings-info-btn" aria-label="More info" onclick="event.preventDefault();event.stopPropagation();"><img src="res/info.svg"></button>
                        <span class="info-box">Go through each selected case once, and show a message after a full pass.</span>
                    </span>
                </label>
            </div>
        </div>
    `;

    // Close on backdrop click
    if (window.attachOverlayClose) window.attachOverlayClose(modal, closeSelectorModal);
    else modal.addEventListener('click', e => { if (e.target === modal) closeSelectorModal(); });

    document.body.appendChild(modal);
}

// ─── Search ───────────────────────────────────────────────────────────────────

window.onSelectorSearch = function (val) {
    selectorSearchTerm = val.toLowerCase().trim();
    renderSelectorCases();
};

// Toggle "go through each case once" from the selector. Saving + refreshing the
// remaining array (a fresh shuffled pass) on every check/uncheck, and rebuilding
// the live lookahead so the change takes effect immediately if training is open.
window._toggleGoThroughFromSelector = function (checked) {
    // Save against the CURRENT trainer's selector key (per-trainer setting).
    localStorage.setItem(_goThroughKey(window._selectorStorageKey), checked.toString());
    window._resetGoThroughPool();
    if (window._multiCaseMode && typeof regenerateMultiScrambleLookahead === 'function') {
        regenerateMultiScrambleLookahead();
    }
    // Refresh the evilness trainer's pass too (shares the same setting).
    if (typeof window._evilQuizOnSelectionChange === 'function') {
        window._evilQuizOnSelectionChange([...selectorSelectedCases]);
    }
    if (typeof window._parityQuizOnSelectionChange === "function") {
        window._parityQuizOnSelectionChange([...selectorSelectedCases]);
    }
    // Keep the settings-tab checkbox (if present) in sync.
    const s = document.getElementById('tr_goThrough');
    if (s) s.checked = checked;
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
            bgColor = isSelected ? 'var(--card-learned-header)' : 'var(--card-learned-bg)';
            borderColor = isSelected ? 'var(--card-learned-border)' : 'var(--card-learned-border)';
            textColor = 'var(--text-primary)';
            checkColor = 'var(--card-learned-border)';
        } else if (isLearning) {
            bgColor = isSelected ? 'var(--card-learning-header)' : 'var(--card-learning-bg)';
            borderColor = isSelected ? 'var(--card-learning-border)' : 'var(--card-learning-border)';
            textColor = 'var(--text-primary)';
            checkColor = 'var(--card-learning-border)';
        } else {
            const priorityBgs = [
                'var(--p1-bg)', 'var(--p2-bg)', 'var(--p3-bg)', 'var(--p4-bg)',
                'var(--p5-bg)', 'var(--p6-bg)', 'var(--p7-bg)'
            ];
            const priorityBords = [
                'var(--p1-border)', 'var(--p2-border)', 'var(--p3-border)', 'var(--p4-border)',
                'var(--p5-border)', 'var(--p6-border)', 'var(--p7-border)'
            ];
            bgColor = isSelected ? priorityBgs[priorityLevel - 1] : 'var(--surface)';
            borderColor = isSelected ? priorityBords[priorityLevel - 1] : 'var(--border-color)';
            textColor = 'var(--text-primary)';
            checkColor = 'var(--accent)';
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
                    border:2px solid ${isSelected ? checkColor : 'var(--border-color)'};
                    background:${isSelected ? checkColor : 'var(--surface)'};
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
    saveSelectorSelection(window._selectorStorageKey);
    renderSelectorCases();
    if (window._multiCaseMode) {
        multiTrainingCases = [...selectorSelectedCases];
        window._resetGoThroughPool();
        updateMultiTrainingTitle();
        // Only regenerate if the currently showing scramble's case was deselected
        const current = scrambleHistory[currentHistoryIndex];
        if (current && current.caseName === caseName && !selectorSelectedCases.has(caseName)) {
            regenerateMultiScrambleLookahead();
        }
    }
    // Notify the evilness trainer (same live-update mechanism) if it's listening.
    if (typeof window._evilQuizOnSelectionChange === 'function') {
        window._evilQuizOnSelectionChange([...selectorSelectedCases]);
    }
    if (typeof window._parityQuizOnSelectionChange === "function") {
        window._parityQuizOnSelectionChange([...selectorSelectedCases]);
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
    saveSelectorSelection(window._selectorStorageKey);
    renderSelectorCases();
    if (window._multiCaseMode) {
        multiTrainingCases = [...selectorSelectedCases];
        window._resetGoThroughPool();
        updateMultiTrainingTitle();
        // Only regenerate if the currently showing scramble's case is no longer selected
        const current = scrambleHistory[currentHistoryIndex];
        if (current && current.caseName && !selectorSelectedCases.has(current.caseName)) {
            regenerateMultiScrambleLookahead();
        }
    }
    if (typeof window._evilQuizOnSelectionChange === 'function') {
        window._evilQuizOnSelectionChange([...selectorSelectedCases]);
    }
    if (typeof window._parityQuizOnSelectionChange === "function") {
        window._parityQuizOnSelectionChange([...selectorSelectedCases]);
    }
};

// ─── Multi-Case Training Modal ────────────────────────────────────────────────

let multiTrainingCases = [];

// "Go through each case once" mode: a shuffled array of the cases still to do this
// pass. The FRONT case is peeked for each scramble (so regenerating keeps the same
// case) and only removed when a solve is actually TIMED (see _goThroughConsume).
// The array refreshes on selection change, on toggle, and when fully depleted.
let _goThroughRemaining = [];
window._resetGoThroughPool = function (avoidFirst = null) {
    _goThroughRemaining = [...multiTrainingCases];
    for (let i = _goThroughRemaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [_goThroughRemaining[i], _goThroughRemaining[j]] = [_goThroughRemaining[j], _goThroughRemaining[i]];
    }
    // Don't start a fresh pass with the case we just finished (avoids back-to-back).
    if (avoidFirst && _goThroughRemaining.length > 1 && _goThroughRemaining[0] === avoidFirst) {
        const k = 1 + Math.floor(Math.random() * (_goThroughRemaining.length - 1));
        [_goThroughRemaining[0], _goThroughRemaining[k]] = [_goThroughRemaining[k], _goThroughRemaining[0]];
    }
};

// Called when a scramble is actually timed: remove the just-solved case from the
// remaining pass, announce completion of a full pass, and rebuild the lookahead so
// the next scramble targets the new front case.
window._goThroughConsume = function () {
    if (!window._multiCaseMode || !window._isGoThroughEnabled(TIMER_SELECTOR_KEY)) return;
    const done = (typeof scrambleHistory !== 'undefined' && scrambleHistory[currentHistoryIndex])
        ? scrambleHistory[currentHistoryIndex].caseName : null;
    if (!done) return;
    const idx = _goThroughRemaining.indexOf(done);
    if (idx !== -1) _goThroughRemaining.splice(idx, 1);
    if (_goThroughRemaining.length === 0) {
        if (typeof showToast === 'function') showToast('Gone through each case!', 3000, 'success');
        window._resetGoThroughPool(done);
    }
    // Rebuild the lookahead queue so the next scramble is for the new front case.
    preGeneratedScrambles = [];
    for (let i = 0; i < 3; i++) preGeneratedScrambles.push(window.generateNextScrambleData());
};

window.openMultiCaseTrainingModal = function (caseNames) {
    multiTrainingCases = caseNames;
    window._resetGoThroughPool();

    createTrainingModal();

    const modal = document.getElementById('trainingModal');
    const titleEl = document.getElementById('trainingCaseName');

    pushModalState('trainingModal', closeTrainingModal);

    titleEl.onclick = (e) => {
        e.stopPropagation();
        openSelectorModal(window._selectorStorageKey || 'sq1-selector-cases', (chosen) => {
            multiTrainingCases = chosen;
            window._resetGoThroughPool();
            updateMultiTrainingTitle();
            regenerateMultiScrambleLookahead();
        });
    };
    updateMultiTrainingTitle();

    const savedTrainingImageSize = localStorage.getItem('trainingScrambleImageSize');
    const savedTrainingTextSize = localStorage.getItem('trainingScrambleTextSize');
    const savedTrainingHoldToStart = localStorage.getItem('trainingHoldToStart');

    trainingScrambleImageSize = savedTrainingImageSize ? parseInt(savedTrainingImageSize) : 200;
    trainingScrambleTextSize = savedTrainingTextSize ? parseInt(savedTrainingTextSize) : 16;
    trainingHoldToStart = savedTrainingHoldToStart ? parseFloat(savedTrainingHoldToStart) : 0.22;
    trainingEnableInspection = localStorage.getItem('trainingEnableInspection') === 'true';
    trainingEnableParityQuiz = localStorage.getItem('trainingEnableParityQuiz') === 'true';
    trainingHideScrambleImage = localStorage.getItem('trainingHideScrambleImage') === 'true';

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
    if (typeof applyTimerSize === 'function') applyTimerSize();
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

    // Pick the case: either random, or PEEK the front of the "go through each"
    // remaining array. We don't remove it here — only a timed solve consumes it
    // (see _goThroughConsume), so regenerating keeps you on the same case.
    let caseName;
    if (window._isGoThroughEnabled(TIMER_SELECTOR_KEY)) {
        if (_goThroughRemaining.length === 0) window._resetGoThroughPool();
        caseName = _goThroughRemaining[0];
    } else {
        caseName = multiTrainingCases[Math.floor(Math.random() * multiTrainingCases.length)];
    }
    if (!caseName) return null;

    const shapeIndexItem = shapeIndex.find(s => s.name === caseName);
    if (!shapeIndexItem) return null;

    const selectedKey = `training_selected_${caseName}`;
    let indices = (window.trainingSelections && window.trainingSelections[selectedKey])
        ? window.trainingSelections[selectedKey]
        : [...(shapeIndexItem.org || []), ...(shapeIndexItem.mir || [])];

    if (!indices || indices.length === 0) return null;

    const scramble = indices[Math.floor(Math.random() * indices.length)];
    const hexCode = shapeIndexToHex(scramble);

    let scrambleText = hexCode;
    let scrambleImage = '<div style="color:var(--text-muted);">Image unavailable</div>';

    try {
        const state = parseHexFormat(hexCode);
        scrambleText = window.sq1Tools.scrambleFromState(state) || hexCode;
        if (typeof SQ1ColorizerLib !== 'undefined' && SQ1ColorizerLib.processScramble) {
            scrambleText = SQ1ColorizerLib.processScramble(scrambleText).html || scrambleText;
        }
    } catch (e) { console.error('Multi scramble gen error:', e); }

    try {
        if (typeof visualizeFromScramble !== 'undefined') {
            const state = parseHexFormat(hexCode);
            const notation = window.sq1Tools.scrambleFromState(state) || hexCode;
            scrambleImage = visualizeFromScramble(notation, trainingScrambleImageSize, colorScheme);
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

    // No re-render needed: training never mutates any list-affecting state,
    // so the grid is already correct (avoids the teardown/flash on close).
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
