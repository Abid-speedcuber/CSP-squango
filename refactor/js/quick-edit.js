/* ==== FILE: js/quick-edit.js ==== */

﻿// Quick Edit System for batch editing cases
import { data } from '../database/algs.js?v=esm-20260511-2';
import { shapeIndex } from '../database/shapeIndex.js?v=esm-20260511-2';
import { CSPData } from './data-store.js?v=esm-20260511-2';
import { algToShapeIndex } from './tools/alg_to_index.js?v=esm-20260511-2';
import { caleTracer } from './tools/cales-parity-tracer.js?v=esm-20260511-2';
import { normalizeScramble } from './tools/scrambleNormalizer.js?v=esm-20260511-2';
import { invertScramble } from './utils.js?v=esm-20260511-2';
import {
    algVariables,
    colorScheme,
    comments,
    cornerStickerMode,
    customAlgorithms,
    displayNames,
    evilnessFactor,
    evilnessMap,
    getCaseAlgorithmList,
    markParityAlgorithmsDirty,
    perCaseSubtitles,
    saveState
} from './restoftheapp.js?v=esm-20260511-2';
import {
    getDisplayName,
    sanitizeNoteHTML
} from './rendering.js?v=esm-20260511-2';

export let quickEditState = {
    currentTab: 'general',
    findReplaceOpen: false,
    findReplaceScope: null,
    currentFindIndex: -1,
    findMatches: [],
    lastFocusedCell: null,
    allMatchRanges: [], // Store all text ranges for multiple matches per cell
    visibleAlgColumns: 6 // Number of visible algorithm columns
};

// Load auto-select setting from localStorage
export let autoSelectTextOnFocus = localStorage.getItem('autoSelectTextOnFocus') !== 'false'; // Default true

// Expand :varName: tokens in an alg string using algVariables map
export function expandAlgVariables(alg) {
    if (!alg || !algVariables || algVariables.size === 0) return alg;
    return alg.replace(/:([a-zA-Z_][a-zA-Z0-9_]*):/g, (match, name) => {
        return algVariables.has(name) ? algVariables.get(name) : match;
    });
}

// Expand variables then normalize — used on defocus
export function expandAndNormalize(alg) {
    if (!alg || alg === 'Done!') return alg;
    const expanded = expandAlgVariables(alg);
    return normalizeScramble(expanded) || expanded;
}

// Expand variables then normalize for live color coding only (don't mutate cell)
export function expandForColorCheck(alg) {
    if (!alg || alg === 'Done!') return alg;
    return expandAlgVariables(alg);
}

export function getGeneralTableRows() {
    const sortedData = [...data].sort((a, b) => getDisplayName(a.name).localeCompare(getDisplayName(b.name)));
    return sortedData.map(item => `<tr data-case="${item.name}" class="qe-lazy-row" data-tab="general"><td colspan="${evilnessFactor ? 5 : 4}" style="height:41px;"></td></tr>`).join('');
}

export function getAlgTableRows() {
    const sortedData = [...data].sort((a, b) => getDisplayName(a.name).localeCompare(getDisplayName(b.name)));
    return sortedData.map(item => `<tr data-case="${item.name}" class="qe-lazy-row" data-tab="algorithms"><td colspan="7" style="height:41px;"></td></tr>`).join('');
}

export function hydrateGeneralRow(row) {
    const item = CSPData.getCase(row.dataset.case);
    if (!item) return;
    const displayName = getDisplayName(item.name);
    const subtitle = perCaseSubtitles.get(item.name) || '';
    const note = comments.get(item.name) || '';
    const formattedNote = sanitizeNoteHTML(note);
    const isEvil = evilnessMap[item.name] === true;
    row.classList.remove('qe-lazy-row');
    row.innerHTML = `
        <td class="uneditable">${displayName}</td>
        <td class="editable" contenteditable="true" data-field="displayName" data-original="${displayName}">${displayName}</td>
        <td class="editable" contenteditable="true" data-field="subtitle" data-original="${subtitle}">${subtitle}</td>
        <td class="editable notes-cell" contenteditable="true" data-field="notes" data-original="${note.replace(/"/g, '&quot;')}" data-raw-html="${note.replace(/"/g, '&quot;')}">${formattedNote}</td>
        ${evilnessFactor ? `<td style="text-align:center;vertical-align:middle;"><label style="position:relative;display:inline-block;width:36px;height:20px;"><input type="checkbox" class="evil-qe-toggle" data-case="${item.name}" ${isEvil ? 'checked' : ''} style="opacity:0;width:0;height:0;" onchange="evilnessMap[this.dataset.case]=this.checked;saveState();const k=this.nextElementSibling;k.style.background=this.checked?'var(--parity-invalid,#c00)':'var(--surface-border)';k.querySelector('span').style.left=this.checked?'18px':'2px';"><span style="position:absolute;top:0;left:0;right:0;bottom:0;background:${isEvil ? 'var(--parity-invalid,#c00)' : 'var(--surface-border)'};border-radius:20px;cursor:pointer;transition:.3s;"><span style="position:absolute;height:16px;width:16px;left:${isEvil ? '18px' : '2px'};bottom:2px;background:white;border-radius:50%;transition:.3s;display:block;"></span></span></label></td>` : ''}
    `;
    setupRowHandlers(row, 'general');
}

export function hydrateAlgorithmsRow(row) {
    const item = CSPData.getCase(row.dataset.case);
    if (!item) return;
    const visibleCols = quickEditState.visibleAlgColumns || 6;
    const displayName = getDisplayName(item.name);
    let allAlgs = getCaseAlgorithmList(item);
    const totalCols = Math.max(visibleCols, 6);
    while (allAlgs.length < totalCols) allAlgs.push('');
    row.classList.remove('qe-lazy-row');
    row.innerHTML = `
        <td class="uneditable display-name-col">${displayName}</td>
        ${allAlgs.slice(0, totalCols).map((alg, idx) => `<td class="editable alg-cell" contenteditable="true" data-field="alg${idx}" data-original="${alg}" style="${idx >= visibleCols ? 'display:none;' : ''}">${alg}</td>`).join('')}
    `;
    setupRowHandlers(row, 'algorithms');
    row.querySelectorAll('.alg-cell').forEach(cell => { if (cell.textContent.trim()) updateAlgorithmCellParity(cell); });
}

export function setupRowHandlers(row, tab) {
    row.querySelectorAll('.editable').forEach(cell => {
        cell.addEventListener('focus', function() {
            if (this.classList.contains('notes-cell')) { const r = this.dataset.rawHtml || ''; this.textContent = r; }
            if (autoSelectTextOnFocus) { const range = document.createRange(); range.selectNodeContents(this); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); }
            quickEditState.lastFocusedCell = this;
            if (tab === 'general') { const f = this.dataset.field; quickEditState.findReplaceScope = f === 'displayName' ? 'name' : f === 'subtitle' ? 'subtitle' : f === 'notes' ? 'notes' : null; }
        });
        cell.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.shiftKey && this.dataset.field === 'notes') { e.preventDefault(); document.execCommand('insertLineBreak'); return; }
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const nr = this.closest('tr').nextElementSibling; if (nr) { if (nr.classList.contains('qe-lazy-row')) { tab === 'general' ? hydrateGeneralRow(nr) : hydrateAlgorithmsRow(nr); } const sc = nr.querySelector(`[data-field="${this.dataset.field}"]`); if (sc) sc.focus(); } return; }
            if (e.key === 'Tab') { e.preventDefault(); const cells = Array.from(this.closest('tr').querySelectorAll('.editable')); const ci = cells.indexOf(this); if (e.shiftKey) { if (ci > 0) cells[ci-1].focus(); } else { if (ci < cells.length-1) cells[ci+1].focus(); } return; }
        });
        cell.addEventListener('blur', function() {
            if (this.classList.contains('notes-cell')) { const r = this.textContent.trim(); this.dataset.rawHtml = r; this.innerHTML = sanitizeNoteHTML(r); }
        });
        if (cell.classList.contains('alg-cell')) {
            cell.addEventListener('input', function() { updateAlgorithmCellParityLive(this); });
            cell.addEventListener('blur', function() { const t = this.textContent.trim(); if (t && t !== 'Done!') this.textContent = expandAndNormalize(t); updateAlgorithmCellParity(this); });
            cell.addEventListener('paste', function(e) { e.preventDefault(); const t = (e.clipboardData||window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, t); });
        }
    });
}

export function initQuickEditLazyLoad() {
    const modal = document.getElementById('quickEditModal');
    if (!modal) return;

    // Hydrate first ~8 visible rows immediately
    const generalRows = Array.from(document.querySelectorAll('#quickEditGeneralBody .qe-lazy-row'));
    const algRows = Array.from(document.querySelectorAll('#quickEditAlgorithmsBody .qe-lazy-row'));
    generalRows.slice(0, 8).forEach(hydrateGeneralRow);
    algRows.slice(0, 8).forEach(hydrateAlgorithmsRow);

    // REPLACE:
    // Render all remaining rows in small batches so the UI stays responsive
    const remainingGeneral = generalRows.slice(8);
    const remainingAlg = algRows.slice(8);
    const allRemaining = [...remainingGeneral, ...remainingAlg];
    let idx = 0;
    function renderNextBatch() {
        const batchSize = 10;
        const end = Math.min(idx + batchSize, allRemaining.length);
        for (; idx < end; idx++) {
            const row = allRemaining[idx];
            if (row.classList.contains('qe-lazy-row')) {
                row.dataset.tab === 'general' ? hydrateGeneralRow(row) : hydrateAlgorithmsRow(row);
            }
        }
        if (idx < allRemaining.length) {
            requestAnimationFrame(renderNextBatch);
        }
    }
    if (allRemaining.length > 0) requestAnimationFrame(renderNextBatch);
    modal._lazyObserver = null;
}

export function openQuickEditModal() {
    // Close settings modal if open
    closeSettingsModal();

    // Store initial state for reverting
    window.quickEditInitialState = {
        displayNames: { ...displayNames },
        perCaseSubtitles: new Map(perCaseSubtitles),
        comments: new Map(comments),
        customAlgorithms: new Map(customAlgorithms)
    };

    const modal = document.createElement('div');
    modal.className = 'quick-edit-fullscreen';
    modal.id = 'quickEditModal';

    modal.innerHTML = `
        <div class="quick-edit-screen">
            <div class="quick-edit-header">
                <div class="quick-edit-header-left">
                    <div class="quick-edit-title-wrapper">
                        <h2 onclick="toggleQuickEditTab()">Quick Edit</h2>
                        <button class="quick-edit-icon-btn instruction-btn" onclick="showQuickEditInfoModal()" title="Help">
                            <img src="res/info.svg" alt="Help">
                        </button>
                    </div>
                    <div class="quick-edit-subtitle" id="quickEditSubtitle">General Info</div>
                    <div class="quick-edit-tabs">
                        <button class="quick-edit-tab active" data-tab="general" onclick="switchQuickEditTab('general')">General Info</button>
                        <button class="quick-edit-tab" data-tab="algorithms" onclick="switchQuickEditTab('algorithms')">Algorithms</button>
                    </div>
                </div>
                <div class="quick-edit-header-right">
                    <button class="quick-edit-icon-btn add-columns-btn-header" onclick="addAlgorithmColumns()" title="Show 2 more columns" style="display: none;">
                        +2
                    </button>
                    <button class="quick-edit-icon-btn alg-variables-btn-header" onclick="openAlgVariablesModal()" title="Algorithm Variables" style="display: none;">
                        <img src="res/var.svg" alt="Variables">
                    </button>
                    <button class="quick-edit-icon-btn" onclick="openQuickEditFindReplace()" title="Find and Replace (Ctrl+F)">
                        <img src="res/search.svg" alt="Find">
                    </button>
                    <button class="quick-edit-icon-btn" onclick="saveQuickEditChanges()" title="Save changes">
                        <img src="res/save.svg" alt="Save">
                    </button>
                    <button class="quick-edit-icon-btn" onclick="closeQuickEditModal()" title="Exit">
                        <img src="res/exit.svg" alt="Exit">
                    </button>
                </div>
            </div>

 <div class="quick-edit-find-replace-popup" id="quickEditFindReplace" style="display: none;">
    <div class="find-replace-header">
        <span>Find and Replace</span>
        <button class="close-find-btn" onclick="closeQuickEditFindReplace()" title="Close (Esc)">×</button>
    </div>
    <div class="find-replace-inputs">
        <div class="find-input-row">
            <input type="text" id="quickEditFindInput" placeholder="Find" oninput="liveSearchQuickEdit()">
            <div class="find-nav-buttons">
                <button onclick="findPreviousQuickEdit()" title="Previous match">
                    <img src="res/previous.svg" alt="Previous">
                </button>
                <button onclick="findNextQuickEdit()" title="Next match">
                    <img src="res/next.svg" alt="Next">
                </button>
            </div>
        </div>
        <div class="replace-input-row">
            <input type="text" id="quickEditReplaceInput" placeholder="Replace" onkeypress="handleReplaceEnter(event)">
            <div class="replace-buttons">
                <button onclick="replaceQuickEdit()" title="Replace (Enter)">Replace</button>
                <button onclick="replaceAllQuickEdit()" title="Replace All">Replace All</button>
            </div>
        </div>
    </div>
    <div class="find-replace-footer">
        <div class="scope-selector">
            <label>Scope:</label>
            <select id="quickEditScopeSelector" onchange="changeFindScope()">
                <option value="name">Display Name</option>
                <option value="subtitle">Subtitle</option>
                <option value="notes">Notes</option>
                <option value="global">Global (All General)</option>
                <option value="all">All Algorithms</option>
            </select>
        </div>
        <span id="quickEditMatchCount">No matches</span>
    </div>
</div>

            <div class="quick-edit-body">
                <div class="quick-edit-content" id="quickEditGeneralTab">
                    <table class="quick-edit-table">
                        <thead>
                            <tr>
                                <th>Case Name</th>
                                <th>Display Name</th>
                                <th>Subtitle</th>
                                <th class="notes-header">Notes</th>
                                ${evilnessFactor ? '<th style="text-align:center;">Evil</th>' : ''}
                            </tr>
                        </thead>
                        <tbody id="quickEditGeneralBody">
                            ${getGeneralTableRows()}
                        </tbody>
                    </table>
                </div>

                <div class="quick-edit-content" id="quickEditAlgorithmsTab" style="display: none;">
                    <table class="quick-edit-table algorithms-table">
                        <thead>
                            <tr id="algorithmTableHeader">
                                <th class="display-name-header" style="white-space:nowrap;">Display Name</th>
                            </tr>
                        </thead>
                        <tbody id="quickEditAlgorithmsBody">
                            ${getAlgTableRows()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    pushModalState('quickEditModal', closeQuickEditModal);

    // Keep modal in sync with theme changes
    modal._themeObserver = new MutationObserver(() => {
        modal.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') || '');
    });
    modal._themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    modal.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') || '');

    // Add keyboard shortcuts
    setupQuickEditKeyboardShortcuts();

    // Lazy load rows
    initQuickEditLazyLoad();
}

export function addAlgorithmColumns() {
    const tbody = document.getElementById('quickEditAlgorithmsBody');
    if (!tbody) return;

    quickEditState.visibleAlgColumns += 2;

    // For each row, ensure we have enough cells
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        const existingCells = row.querySelectorAll('.alg-cell');
        const currentCellCount = existingCells.length;

        // If we need more cells than we have, create them
        if (currentCellCount < quickEditState.visibleAlgColumns) {
            for (let idx = currentCellCount; idx < quickEditState.visibleAlgColumns; idx++) {
                const td = document.createElement('td');
                td.className = 'editable alg-cell';
                td.contentEditable = 'true';
                td.dataset.field = `alg${idx}`;
                td.dataset.original = '';
                td.dataset.colIndex = idx;
                td.textContent = '';

                // Add event listeners
                td.addEventListener('focus', function () {
                    if (autoSelectTextOnFocus) {
                        const range = document.createRange();
                        range.selectNodeContents(this);
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                    quickEditState.lastFocusedCell = this;
                });

                td.addEventListener('input', function () {
                    updateAlgorithmCellParityLive(this);
                });

                td.addEventListener('blur', function () {
                    const rawText = this.textContent.trim();
                    if (rawText && rawText !== 'Done!') {
                        this.textContent = expandAndNormalize(rawText);
                    }
                    updateAlgorithmCellParity(this);
                });

                td.addEventListener('paste', function (e) {
                    e.preventDefault();
                    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
                    document.execCommand('insertText', false, text);
                });

                td.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const currentRow = this.closest('tr');
                        const nextRow = currentRow.nextElementSibling;
                        if (nextRow) {
                            const sameFieldCell = nextRow.querySelector(`[data-field="${this.dataset.field}"]`);
                            if (sameFieldCell) {
                                sameFieldCell.focus();
                            }
                        }
                        return;
                    }

                    if (e.key === 'Tab') {
                        e.preventDefault();
                        const currentRow = this.closest('tr');
                        const cells = Array.from(currentRow.querySelectorAll('.editable'));
                        const currentIndex = cells.indexOf(this);

                        if (e.shiftKey) {
                            if (currentIndex > 0) {
                                cells[currentIndex - 1].focus();
                            }
                        } else {
                            if (currentIndex < cells.length - 1) {
                                cells[currentIndex + 1].focus();
                            }
                        }
                        return;
                    }
                });

                row.appendChild(td);
            }
        }
    });

    updateAlgorithmTableHeaders();
    updateAlgorithmTableCells();
    document.getElementById('visibleColumnCount').textContent = quickEditState.visibleAlgColumns;
}

export function updateAlgorithmTableHeaders() {
    const headerRow = document.getElementById('algorithmTableHeader');
    if (!headerRow) return;

    // Clear existing headers except first one
    while (headerRow.children.length > 1) {
        headerRow.removeChild(headerRow.lastChild);
    }

    // Add headers for visible columns
    for (let i = 0; i < quickEditState.visibleAlgColumns; i++) {
        const th = document.createElement('th');
        th.className = 'alg-header';
        th.textContent = `Alg ${i + 1}`;
        headerRow.appendChild(th);
    }
}

export function updateAlgorithmTableCells() {
    const tbody = document.getElementById('quickEditAlgorithmsBody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('.alg-cell');
        cells.forEach((cell, idx) => {
            if (idx < quickEditState.visibleAlgColumns) {
                cell.style.display = '';
            } else {
                cell.style.display = 'none';
            }
        });
    });
}

export function getCaseShapeData(caseName) {
    const directMatch = CSPData.getShapeEntry(caseName);
    if (directMatch) return directMatch;

    const canonicalIdx = CSPData.getCanonicalShapeIndex(caseName);
    if (canonicalIdx === null) return null;
    return shapeIndex.find(shapeData => shapeData.org && shapeData.org.includes(canonicalIdx)) || null;
}

export function getCanonicalCaseNameForCell(cell) {
    const row = cell.closest('tr');
    if (!row) return null;
    return row.dataset.case || null;
}

export const ALL_LEGAL_TOPS = [0,1,2,3,4,5,-1,-2,-3,-4,-5,-6];
export const ALL_LEGAL_BOTTOMS = [0,1,2,3,4,5,-1,-2,-3,-4,-5,-6];

export function tryFixAngle(algBody, canonicalShapeIdx) {
    // algBody is everything from first / onward
    for (const t of ALL_LEGAL_TOPS) {
        for (const b of ALL_LEGAL_BOTTOMS) {
            const candidate = `(${t},${b})` + algBody;
            const result = algToShapeIndex(candidate);
            if (result.shapeIndex === canonicalShapeIdx) {
                return candidate;
            }
        }
    }
    return null;
}

export function tryFixMirroredAngle(algBody, canonicalShapeIdx) {
    for (const t of ALL_LEGAL_TOPS) {
        for (const b of ALL_LEGAL_BOTTOMS) {
            const candidate = `/(6,6)/(${t},${b})` + algBody;
            const result = algToShapeIndex(candidate);
            if (result.shapeIndex === canonicalShapeIdx) {
                return `(${t},${b})` + algBody;
            }
        }
    }
    return null;
}

export function stripBeforeFirstSlash(alg) {
    // If starts with /, keep as is. Otherwise strip everything before first /
    const firstSlash = alg.indexOf('/');
    if (firstSlash <= 0) return alg; // starts with / or no slash found
    return alg.slice(firstSlash);
}

export function updateAlgorithmCellParity(cell) {
    const alg = cell.textContent.trim();
    if (!alg || alg === 'Done!') {
        cell.style.color = '';
        cell.style.fontWeight = '';
        return;
    }

    if (!caleTracer) {
        cell.style.color = '';
        cell.style.fontWeight = '';
        return;
    }

    const caseName = getCanonicalCaseNameForCell(cell);
    const canonicalIdx = caseName ? CSPData.getCanonicalShapeIndex(caseName) : null;
    const caseShapeData = caseName ? getCaseShapeData(caseName) : null;

    try {
        const result = algToShapeIndex(alg);
        const resultShapeIndex = result.shapeIndex;

        const isDirectMatch = canonicalIdx !== null && resultShapeIndex === canonicalIdx;
        const isInOrg = caseShapeData && caseShapeData.org && caseShapeData.org.includes(resultShapeIndex);
        const isInMir = caseShapeData && caseShapeData.mir && caseShapeData.mir.includes(resultShapeIndex);

        if (isDirectMatch || isInOrg) {
            // Correct case - check parity
            const setup = invertScramble(alg);
            const parityText = caleTracer.getParityTextFromScramble(setup, {
                topColor: colorScheme.topColor, bottomColor: colorScheme.bottomColor,
                frontColor: colorScheme.frontColor, rightColor: colorScheme.rightColor,
                backColor: colorScheme.backColor, leftColor: colorScheme.leftColor
            }, cornerStickerMode);

            if (isDirectMatch) {
                // Canonical angle - fix angle if needed
                cell.style.color = parityText === 'Odd' ? 'var(--parity-odd)' : 'var(--parity-even)';
            } else {
                // Org match but not canonical - try to fix angle
                if (canonicalIdx !== null) {
                    const algBody = stripBeforeFirstSlash(alg);
                    const fixed = tryFixAngle(algBody, canonicalIdx);
                    if (fixed) {
                        cell.textContent = normalizeScramble(fixed);
                    }
                }
                cell.style.color = parityText === 'Odd' ? 'var(--parity-odd)' : 'var(--parity-even)';
            }
            cell.style.fontWeight = '600';

        } else if (isInMir) {
            const setup = invertScramble(alg);
            const parityText = caleTracer.getParityTextFromScramble(setup, {
                topColor: colorScheme.topColor, bottomColor: colorScheme.bottomColor,
                frontColor: colorScheme.frontColor, rightColor: colorScheme.rightColor,
                backColor: colorScheme.backColor, leftColor: colorScheme.leftColor
            }, cornerStickerMode);

            if (canonicalIdx !== null) {
                const algBody = stripBeforeFirstSlash(alg);
                const fixed = tryFixMirroredAngle(algBody, canonicalIdx);
                if (fixed) {
                    cell.textContent = normalizeScramble(fixed);
                }
            }
            cell.style.color = parityText === 'Odd' ? 'var(--parity-odd-mirror)' : 'var(--parity-even-mirror)';
            cell.style.fontWeight = '600';

        } else {
            cell.style.color = 'var(--parity-invalid)';
            cell.style.fontWeight = '600';
        }
    } catch {
        cell.style.color = 'var(--parity-invalid)';
        cell.style.fontWeight = '600';
    }
}

export function updateAlgorithmCellParityLive(cell) {
    const alg = cell.textContent.trim();
    if (!alg || alg === 'Done!') {
        cell.style.color = '';
        cell.style.fontWeight = '';
        return;
    }

    if (!caleTracer) {
        cell.style.color = '';
        cell.style.fontWeight = '';
        return;
    }

    const caseName = getCanonicalCaseNameForCell(cell);
    const canonicalIdx = caseName ? CSPData.getCanonicalShapeIndex(caseName) : null;
    const caseShapeData = caseName ? getCaseShapeData(caseName) : null;

    try {
        const normalized = normalizeScramble(expandForColorCheck(alg));
        const result = algToShapeIndex(normalized);
        const resultShapeIndex = result.shapeIndex;

        const isDirectMatch = canonicalIdx !== null && resultShapeIndex === canonicalIdx;
        const isInOrg = caseShapeData && caseShapeData.org && caseShapeData.org.includes(resultShapeIndex);
        const isInMir = caseShapeData && caseShapeData.mir && caseShapeData.mir.includes(resultShapeIndex);

        if (isDirectMatch || isInOrg) {
            const setup = invertScramble(normalized);
            const parityText = caleTracer.getParityTextFromScramble(setup, {
                topColor: colorScheme.topColor, bottomColor: colorScheme.bottomColor,
                frontColor: colorScheme.frontColor, rightColor: colorScheme.rightColor,
                backColor: colorScheme.backColor, leftColor: colorScheme.leftColor
            }, cornerStickerMode);
            cell.style.color = parityText === 'Odd' ? 'var(--parity-odd)' : 'var(--parity-even)';
            cell.style.fontWeight = '600';
        } else if (isInMir) {
            const setup = invertScramble(normalized);
            const parityText = caleTracer.getParityTextFromScramble(setup, {
                topColor: colorScheme.topColor, bottomColor: colorScheme.bottomColor,
                frontColor: colorScheme.frontColor, rightColor: colorScheme.rightColor,
                backColor: colorScheme.backColor, leftColor: colorScheme.leftColor
            }, cornerStickerMode);
            cell.style.color = parityText === 'Odd' ? 'var(--parity-odd-mirror)' : 'var(--parity-even-mirror)';
            cell.style.fontWeight = '600';
        } else {
            cell.style.color = 'var(--parity-invalid)';
            cell.style.fontWeight = '600';
        }
    } catch {
        cell.style.color = 'var(--parity-invalid)';
        cell.style.fontWeight = '600';
    }
}

export function setupQuickEditKeyboardShortcuts() {
    const modal = document.getElementById('quickEditModal');
    if (!modal) return;

    modal.addEventListener('keydown', function (e) {
        // Ctrl/Cmd + F to open find/replace
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            openQuickEditFindReplace();
        }

        // Escape to close find/replace
        if (e.key === 'Escape' && quickEditState.findReplaceOpen) {
            closeQuickEditFindReplace();
        }
    });
}

export function switchQuickEditTab(tab) {
    // Check enhanced access for algorithms tab
    if (tab === 'algorithms' && !window.enhancedAccess) {
        showToast('Enable Enhanced Access in Settings to edit algorithms', 2000, 'error');
        return;
    }

    quickEditState.currentTab = tab;

    // Update tab buttons
    const tabs = document.querySelectorAll('.quick-edit-tab');
    tabs.forEach(t => {
        if (t.dataset.tab === tab) {
            t.classList.add('active');
        } else {
            t.classList.remove('active');
        }
    });

    // Update subtitle
    const subtitle = document.getElementById('quickEditSubtitle');
    if (subtitle) {
        subtitle.textContent = tab === 'general' ? 'General Info' : 'Algorithms';
    }

    // Show/hide content
    const generalTab = document.getElementById('quickEditGeneralTab');
    const algorithmsTab = document.getElementById('quickEditAlgorithmsTab');
    const addColumnsBtn = document.querySelector('.add-columns-btn-header');

    const varBtn = document.querySelector('.alg-variables-btn-header');
    if (tab === 'general') {
        generalTab.style.display = 'block';
        algorithmsTab.style.display = 'none';
        if (addColumnsBtn) addColumnsBtn.style.display = 'none';
        if (varBtn) varBtn.style.display = 'none';
    } else {
        generalTab.style.display = 'none';
        algorithmsTab.style.display = 'block';
        if (addColumnsBtn) addColumnsBtn.style.display = '';
        if (varBtn) varBtn.style.display = '';
        // Initialize algorithm table headers when switching to algorithm tab
        updateAlgorithmTableHeaders();
    }

    // Close find/replace when switching tabs
    if (quickEditState.findReplaceOpen) {
        closeQuickEditFindReplace();
    }
}

export function toggleQuickEditTab() {
    // Only toggle on mobile (when tabs are hidden)
    if (window.innerWidth > 630) return;

    const newTab = quickEditState.currentTab === 'general' ? 'algorithms' : 'general';
    switchQuickEditTab(newTab);
}

export function openQuickEditFindReplace() {
    const findReplace = document.getElementById('quickEditFindReplace');
    const findInput = document.getElementById('quickEditFindInput');
    const scopeSelector = document.getElementById('quickEditScopeSelector');

    findReplace.style.display = 'block';
    quickEditState.findReplaceOpen = true;

    // Initialize drag functionality if not already done
    if (!findReplace.dataset.dragInitialized) {
        initializeFindReplaceDrag(findReplace);
        findReplace.dataset.dragInitialized = 'true';
    }

    // Reset position to top right
    if (findReplace.resetPosition) {
        findReplace.resetPosition();
    }

    // Switch notes to raw text mode and keep them in raw mode
    const notesCells = document.querySelectorAll('.notes-cell');
    notesCells.forEach(cell => {
        const rawHTML = cell.dataset.rawHtml || '';
        cell.textContent = rawHTML;
    });

    // Set scope selector based on current tab
    if (quickEditState.currentTab === 'general') {
        scopeSelector.disabled = false;
        if (quickEditState.lastFocusedCell) {
            const field = quickEditState.lastFocusedCell.dataset.field;
            const scopeMap = {
                'displayName': 'name',
                'subtitle': 'subtitle',
                'notes': 'notes'
            };
            scopeSelector.value = scopeMap[field] || 'global';
        } else {
            scopeSelector.value = 'global';
        }
    } else {
        scopeSelector.disabled = false;
        scopeSelector.value = 'all';
    }

    findInput.focus();
    findInput.select();
}

export function closeQuickEditFindReplace() {
    const findReplace = document.getElementById('quickEditFindReplace');
    findReplace.style.display = 'none';
    quickEditState.findReplaceOpen = false;
    quickEditState.currentFindIndex = -1;
    quickEditState.findMatches = [];

    // Clear highlights
    clearFindHighlights();

    // Switch notes back to formatted mode
    const notesCells = document.querySelectorAll('.notes-cell');
    notesCells.forEach(cell => {
        const rawHTML = cell.dataset.rawHtml || cell.textContent.trim();
        cell.dataset.rawHtml = rawHTML;
        const formattedHTML = sanitizeNoteHTML(rawHTML);
        cell.innerHTML = formattedHTML;
    });
}

export function liveSearchQuickEdit() {
    const findInput = document.getElementById('quickEditFindInput');
    const searchTerm = findInput.value;

    // Clear previous highlights
    clearFindHighlights();
    quickEditState.findMatches = [];
    quickEditState.allMatchRanges = [];
    quickEditState.currentFindIndex = -1;

    // Ensure notes cells show raw text and stay in raw text mode
    const notesCells = document.querySelectorAll('.notes-cell');
    notesCells.forEach(cell => {
        const rawHTML = cell.dataset.rawHtml || '';
        cell.textContent = rawHTML;
    });

    if (!searchTerm) {
        document.getElementById('quickEditMatchCount').textContent = 'No matches';
        return;
    }

    // Get all cells in scope
    const modal = document.getElementById('quickEditModal');
    let cells;

    if (quickEditState.currentTab === 'general') {
        const scopeSelector = document.getElementById('quickEditScopeSelector');
        const scope = scopeSelector ? scopeSelector.value : 'global';

        if (scope === 'global') {
            // Search all general fields
            cells = Array.from(modal.querySelectorAll('#quickEditGeneralTab .editable'));
        } else {
            const fieldMap = {
                'name': 'displayName',
                'subtitle': 'subtitle',
                'notes': 'notes'
            };
            const field = fieldMap[scope];
            cells = Array.from(modal.querySelectorAll(`.editable[data-field="${field}"]`));
        }
    } else {
        cells = Array.from(modal.querySelectorAll('.alg-cell'));
    }

    // Find all matches with their positions (case-insensitive)
    const searchLower = searchTerm.toLowerCase();
    cells.forEach(cell => {
        const text = cell.textContent;
        const textLower = text.toLowerCase();
        let pos = 0;

        while ((pos = textLower.indexOf(searchLower, pos)) !== -1) {
            quickEditState.findMatches.push(cell);
            quickEditState.allMatchRanges.push({ cell, start: pos, end: pos + searchTerm.length });
            pos += searchTerm.length;
        }
    });

    if (quickEditState.findMatches.length === 0) {
        document.getElementById('quickEditMatchCount').textContent = 'No matches';
        return;
    }

    // Highlight all matches
    highlightAllMatches();

    // Select first match
    quickEditState.currentFindIndex = 0;
    highlightCurrentMatch();

    // Update count
    document.getElementById('quickEditMatchCount').textContent =
        `${quickEditState.currentFindIndex + 1} of ${quickEditState.findMatches.length}`;
}

export function highlightAllMatches() {
    // Store the current HTML state before highlighting
    quickEditState.allMatchRanges.forEach(range => {
        // For notes cells, work with text content (raw HTML)
        if (range.cell.classList.contains('notes-cell')) {
            const rawText = range.cell.textContent;
            const before = rawText.substring(0, range.start);
            const match = rawText.substring(range.start, range.end);
            const after = rawText.substring(range.end);
            range.cell.textContent = before + match + after;

            // Create a text node structure with mark element
            range.cell.innerHTML =
                escapeHtml(before) +
                `<mark class="find-match-highlight">${escapeHtml(match)}</mark>` +
                escapeHtml(after);
        } else {
            const text = range.cell.textContent;
            range.cell.innerHTML =
                text.substring(0, range.start) +
                `<span class="find-match-highlight">${text.substring(range.start, range.end)}</span>` +
                text.substring(range.end);
        }
    });
}

// Helper function to escape HTML for display
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function highlightCurrentMatch() {
    // Remove previous current highlight
    document.querySelectorAll('.find-match-current').forEach(el => {
        el.classList.remove('find-match-current');
    });

    if (quickEditState.currentFindIndex >= 0 && quickEditState.currentFindIndex < quickEditState.findMatches.length) {
        const currentCell = quickEditState.findMatches[quickEditState.currentFindIndex];
        const highlights = currentCell.querySelectorAll('.find-match-highlight');

        // Find which highlight in this cell corresponds to this match
        let cellMatchIndex = 0;
        for (let i = 0; i < quickEditState.currentFindIndex; i++) {
            if (quickEditState.findMatches[i] === currentCell) {
                cellMatchIndex++;
            }
        }

        if (highlights[cellMatchIndex]) {
            highlights[cellMatchIndex].classList.add('find-match-current');
            highlights[cellMatchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

export function clearFindHighlights() {
    const modal = document.getElementById('quickEditModal');
    if (!modal) return;

    // Restore original text content for all cells that have highlights
    const cells = modal.querySelectorAll('.editable');
    cells.forEach(cell => {
        if (cell.querySelector('.find-match-highlight') || cell.querySelector('mark.find-match-highlight')) {
            // For notes cells, restore raw HTML
            if (cell.classList.contains('notes-cell')) {
                const rawHtml = cell.dataset.rawHtml || '';
                cell.textContent = rawHtml;
            } else {
                cell.textContent = cell.textContent; // Removes all HTML, keeps just text
            }
        }
    });
}

export function findNextQuickEdit() {
    if (quickEditState.findMatches.length === 0) return;

    quickEditState.currentFindIndex = (quickEditState.currentFindIndex + 1) % quickEditState.findMatches.length;
    highlightCurrentMatch();

    document.getElementById('quickEditMatchCount').textContent =
        `${quickEditState.currentFindIndex + 1} of ${quickEditState.findMatches.length}`;
}

export function findPreviousQuickEdit() {
    if (quickEditState.findMatches.length === 0) return;

    quickEditState.currentFindIndex = quickEditState.currentFindIndex - 1;
    if (quickEditState.currentFindIndex < 0) {
        quickEditState.currentFindIndex = quickEditState.findMatches.length - 1;
    }

    highlightCurrentMatch();

    document.getElementById('quickEditMatchCount').textContent =
        `${quickEditState.currentFindIndex + 1} of ${quickEditState.findMatches.length}`;
}

export function replaceQuickEdit() {
    const findInput = document.getElementById('quickEditFindInput');
    const replaceInput = document.getElementById('quickEditReplaceInput');
    const searchTerm = findInput.value;
    const replaceTerm = replaceInput.value;

    if (!searchTerm || quickEditState.findMatches.length === 0) return;

    const currentMatch = quickEditState.findMatches[quickEditState.currentFindIndex];
    const text = currentMatch.textContent;
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    currentMatch.textContent = text.replace(regex, replaceTerm);

    // Update parity if it's an algorithm cell
    if (currentMatch.classList.contains('alg-cell')) {
        updateAlgorithmCellParity(currentMatch);
    }

    // Re-run search to update matches without closing
    liveSearchQuickEdit();
}

export function replaceAllQuickEdit() {
    const findInput = document.getElementById('quickEditFindInput');
    const replaceInput = document.getElementById('quickEditReplaceInput');
    const searchTerm = findInput.value;
    const replaceTerm = replaceInput.value;

    if (!searchTerm) return;

    // Get all cells in scope
    const modal = document.getElementById('quickEditModal');
    let cells;

    if (quickEditState.currentTab === 'general') {
        const scopeSelector = document.getElementById('quickEditScopeSelector');
        const scope = scopeSelector ? scopeSelector.value : 'global';
        if (scope === 'global') {
            cells = Array.from(modal.querySelectorAll('#quickEditGeneralTab .editable'));
        } else {
            const fieldMap = {
                'name': 'displayName',
                'subtitle': 'subtitle',
                'notes': 'notes'
            };
            const field = fieldMap[scope];
            cells = Array.from(modal.querySelectorAll(`.editable[data-field="${field}"]`));
        }
    } else {
        cells = Array.from(modal.querySelectorAll('.alg-cell'));
    }

    let replaceCount = 0;
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

    cells.forEach(cell => {
        const text = cell.textContent;
        if (regex.test(text)) {
            cell.textContent = text.replace(regex, replaceTerm);
            replaceCount++;

            // Update parity if it's an algorithm cell
            if (cell.classList.contains('alg-cell')) {
                updateAlgorithmCellParity(cell);
            }
        }
    });

    showToast(`Replaced ${replaceCount} occurrences`, 2000, 'success');

    // Re-run search to update display
    liveSearchQuickEdit();
}

export function handleReplaceEnter(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        replaceQuickEdit();
    }
}

export function changeFindScope() {
    const scopeSelector = document.getElementById('quickEditScopeSelector');
    if (!scopeSelector) return;

    const newScope = scopeSelector.value;
    quickEditState.findReplaceScope = newScope;

    // Re-run search with new scope
    liveSearchQuickEdit();
}

export function saveQuickEditChanges() {
    const modal = document.getElementById('quickEditModal');
    if (!modal) return;

    // Save general info
    const generalRows = modal.querySelectorAll('#quickEditGeneralBody tr');
    generalRows.forEach(row => {
        const caseName = row.dataset.case;
        const displayNameCell = row.querySelector('[data-field="displayName"]');
        const subtitleCell = row.querySelector('[data-field="subtitle"]');
        const notesCell = row.querySelector('[data-field="notes"]');

        const displayName = displayNameCell.textContent.trim();
        const subtitle = subtitleCell.textContent.trim();
        // For notes, get the raw HTML from data attribute (updated on blur)
        const notes = notesCell.dataset.rawHtml || notesCell.textContent.trim();

        // Save display name
        if (displayName) {
            displayNames[caseName] = displayName;
        }

        // Save subtitle
        if (subtitle) {
            perCaseSubtitles.set(caseName, subtitle);
        } else {
            perCaseSubtitles.delete(caseName);
        }

        // Save notes
        if (notes) {
            comments.set(caseName, notes);
        } else {
            comments.delete(caseName);
        }

        // Update data-original attributes for general tab
        displayNameCell.dataset.original = displayName;
        subtitleCell.dataset.original = subtitle;
        notesCell.dataset.original = notes;
        notesCell.dataset.rawHtml = notes; // Also update rawHtml
    });

    // Save algorithms
    const algRows = modal.querySelectorAll('#quickEditAlgorithmsBody tr');
    algRows.forEach(row => {
        const caseName = row.dataset.case;
        const algCells = row.querySelectorAll('.alg-cell');

        const algs = Array.from(algCells)
            .map(cell => cell.textContent.trim())
            .filter(alg => alg);

        if (algs.length > 0) {
            customAlgorithms.set(caseName, algs);
        } else {
            customAlgorithms.delete(caseName);
        }

        // Update data-original attributes for algorithm cells
        algCells.forEach(cell => {
            cell.dataset.original = cell.textContent.trim();
        });
    });

    // Update initial state checkpoint
    window.quickEditInitialState = {
        displayNames: { ...displayNames },
        perCaseSubtitles: new Map(perCaseSubtitles),
        comments: new Map(comments),
        customAlgorithms: new Map(customAlgorithms)
    };

    // Recalculate parity
    markParityAlgorithmsDirty();
    calculateAndCacheAllParity();

    // Save state and re-render
    saveState();
    render();

    showToast('All changes saved successfully!', 2000, 'success');
}

export function closeQuickEditModal() {
    // Check for unsaved changes
    const modal = document.getElementById('quickEditModal');
    if (!modal) return;

    // Check if any data has changed
    let hasChanges = false;

    // Check general tab changes
    const generalRows = modal.querySelectorAll('#quickEditGeneralBody tr');
    generalRows.forEach(row => {
        const cells = row.querySelectorAll('.editable');
        cells.forEach(cell => {
            const original = cell.dataset.original || '';
            let current;

            // For notes cells, use raw HTML
            if (cell.classList.contains('notes-cell')) {
                current = cell.dataset.rawHtml || '';
            } else {
                current = cell.textContent.trim();
            }

            if (original !== current) {
                hasChanges = true;
            }
        });
    });

    // Check algorithms tab changes
    const algRows = modal.querySelectorAll('#quickEditAlgorithmsBody tr');
    algRows.forEach(row => {
        const cells = row.querySelectorAll('.alg-cell');
        cells.forEach(cell => {
            const original = cell.dataset.original || '';
            const current = cell.textContent.trim();
            if (original !== current) {
                hasChanges = true;
            }
        });
    });

    if (hasChanges) {
        showSaveDiscardConfirmation(
            'You have unsaved changes. What would you like to do?',
            () => {
                // Save
                saveQuickEditChanges();
                forceCloseQuickEditModal();
            },
            () => {
                // Discard
                forceCloseQuickEditModal();
            },
            () => {
                // Cancel - do nothing
            }
        );
        return;
    }

    forceCloseQuickEditModal();
}

export function forceCloseQuickEditModal() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('quickEditModal');
        if (modal) {
            if (modal._lazyObserver) modal._lazyObserver.disconnect();
            if (modal._themeObserver) modal._themeObserver.disconnect();
            modal.remove();
            document.body.classList.remove('modal-open');
        }

        // Reset state
        quickEditState = {
            currentTab: 'general',
            findReplaceOpen: false,
            findReplaceScope: null,
            currentFindIndex: -1,
            findMatches: [],
            lastFocusedCell: null,
            allMatchRanges: [],
            visibleAlgColumns: 6
        };
    });
}

export function revertQuickEditChanges() {
    if (!window.quickEditInitialState) return;

    showConfirmation('Are you sure you want to revert all changes to the last save point?', () => {
        // Restore initial state
        displayNames = { ...window.quickEditInitialState.displayNames };
        perCaseSubtitles = new Map(window.quickEditInitialState.perCaseSubtitles);
        comments = new Map(window.quickEditInitialState.comments);
        customAlgorithms = new Map(window.quickEditInitialState.customAlgorithms);
        markParityAlgorithmsDirty();

        // Close and reopen modal to refresh
        closeQuickEditModal();
        openQuickEditModal();

        showToast('Reverted to last save point', 2000, 'info');
    });
}

window.showQuickEditInfoModal = function () {
    let infoModal = document.getElementById('quickEditInfoModal');
    if (!infoModal) {
        infoModal = document.createElement('div');
        infoModal.id = 'quickEditInfoModal';
        infoModal.className = 'training-info-modal';
        infoModal.innerHTML = `
            <div class="training-info-content">
                <div class="training-info-header">
                    <span class="training-info-title">Quick Edit Guide</span>
                    <button class="training-info-close" onclick="closeQuickEditInfoModal()">&times;</button>
                </div>
                <div class="training-info-body">
                    <div class="training-info-item">
                        <div class="training-info-text"><b>Quick Edit</b> is a place for you to bulk edit cases.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">1</div>
                        <div class="training-info-text"><strong>General Info Tab:</strong> <b>Edit</b> display names, subtitles, and notes for all cases. Notes support HTML formatting, but you don't have to use it. If you do, you will be writing without syntax support, but when you click away from the cell, the HTML will render.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">2</div>
                        <div class="training-info-text"><strong>Algorithms Tab:</strong> <b>Edit</b> algorithms for all cases. Algorithms are auto-normalized when you click away from the cell <span style="font-weight:500">(so you can write 1043'2'1'-3-3 as algorithm and the cell will fix itself)</span>. They are also color-coded in real time by parity and validity: <span style="color: var(--parity-odd); font-weight: 600;">green = odd</span>, <span style="color: var(--parity-even); font-weight: 600;">blue = even</span>, <span style="color: var(--parity-odd-mirror); font-weight: 600;">dark-green = odd (mirrored)</span>, <span style="color: var(--parity-even-mirror); font-weight: 600;">dark-blue = even (mirrored)</span>, <span style="color: var(--parity-invalid); font-weight: 600;">red = invalid</span> (either doesn't solve the case or does not lead to valid squan position at all).</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">3</div>
                        <div class="training-info-text"><strong>Switch Tabs:</strong> To switch between the <b>General Info</b> tab and the <b>Algorithms</b>, directly click on their names. for smaller screens like phones, the tab switch might not be obvious. You have to click on the title "<b>Quick Edit</b>" to change tabs.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">4</div>
                        <div class="training-info-text"><strong>Reveal Columns:</strong> It is not hardcoded that you can have at most 6 algorithms for a case. Click +2 in the Algorithms tab to reveal more columns as needed.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">5</div>
                        <div class="training-info-text"><strong>Navigation:</strong> Use Tab to move one cell to the right, Shift+Tab for one cell to the left. Use Enter to move one cell down.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">6</div>
                        <div class="training-info-text"><strong>Find and Replace:</strong> Press Ctrl+F (or Cmd+F on Mac) or directly press the search button on top to open find and replace popup. You can move the popup around by clicking and dragging. Select scope to search in specific fields, e.g. only in titles. Use Previous/Next arrow keys to navigate matches.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">7</div>
                        <div class="training-info-text"><strong>Variable Table:</strong> While in the algorithm tab, press the <b>"var"</b> button on the toolbar to access variable table. There you can store commonly use algorithm parts <b>(</b>like, <span style="font-weight:500">scal-kite=/(-1,-2)/(-3,0)/</span><b>)</b> and you can reuse them anywhere. To reuse the variable, wrap it around two colons (:variableName:). (ie, the algorithm for <span style="font-weight:500">left 5-1/pair</span> can be written as <span style="font-weight:500">/(-2,3):scal-kite:</span> provided that you have scal-kite saved in the variable table.). The variable will expand when you click away. The color-coding works even with variables.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">7</div>
                        <div class="training-info-text"><strong>Save:</strong> Click Save to apply all changes. Exit without saving to <b>discard all the changes</b></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(infoModal);
    }

    infoModal.classList.add('active');
    if (typeof pushModalState === 'function') pushModalState('quickEditInfoModal', closeQuickEditInfoModal);
};

window.closeQuickEditInfoModal = function () {
    closeModalWithHistory(() => {
        const modal = document.getElementById('quickEditInfoModal');
        if (modal) {
            modal.classList.remove('active');
        }
    });
};

// REPLACE:
export function openAlgVariablesModal() {
    const existing = document.getElementById('algVariablesModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'algVariablesModal';
    modal.style.cssText = `
        position: fixed; inset: 0; z-index: 10100;
        display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,0.5);
    `;

    modal.innerHTML = `
        <div style="
            background: var(--surface);
            border-radius: 14px;
            width: min(560px, 95vw);
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.25);
            border: 1px solid var(--surface-border);
        ">
            <div style="
                display: flex; align-items: center; justify-content: space-between;
                padding: 18px 22px; border-bottom: 1px solid var(--surface-border);
                background: var(--modal-header-bg); flex-shrink: 0;
            ">
                <span style="font-size: 1.15rem; font-weight: 700; color: var(--text-ui);">Algorithm Variables</span>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button onclick="saveAlgVariables()" style="
                        padding: 7px 18px; background: var(--accent); color: white;
                        border: none; border-radius: 7px; cursor: pointer; font-weight: 600; font-size: 0.9rem;
                    ">Save</button>
                    <button onclick="closeAlgVariablesModal()" style="
                        background: none; border: none; cursor: pointer; font-size: 1.5rem;
                        color: var(--sidebar-close-color); line-height: 1; padding: 2px 6px;
                    ">&times;</button>
                </div>
            </div>
            <div style="padding: 14px 22px 6px; flex-shrink: 0; color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5; background: var(--surface);">
                Use <code style="background:var(--surface2);border:1px solid var(--border-color);padding:1px 5px;border-radius:4px;font-size:0.82rem;color:var(--text-primary);">:varName:</code> inside any algorithm to insert the variable's value at defocus.
                Variable values are normalized when you click away.
            </div>
            <div style="overflow-y: auto; flex: 1; padding: 10px 22px 18px;">
                <table style="width:100%; border-collapse: collapse;" id="algVarTable">
                    <thead style="background: var(--surface2); position: sticky; top: 0;">
                        <tr>
                            <th style="text-align:left; padding: 8px 6px; font-size:0.85rem; color:var(--text-secondary); border-bottom:1px solid var(--surface-border); width:28%;">Name</th>
                            <th style="text-align:left; padding: 8px 6px; font-size:0.85rem; color:var(--text-secondary); border-bottom:1px solid var(--surface-border);">Value</th>
                            <th style="width:36px; border-bottom:1px solid var(--surface-border); background: var(--surface2);"></th>
                        </tr>
                    </thead>
                    <tbody id="algVarTableBody">
                        ${renderAlgVarRows()}
                    </tbody>
                </table>
                <button onclick="addAlgVarRow()" style="
                    margin-top: 12px; padding: 7px 16px; background: var(--surface2);
                    border: 1px dashed var(--border-color); border-radius: 7px;
                    cursor: pointer; font-size: 0.9rem; color: var(--text-ui);
                    width: 100%; transition: background 0.15s;
                " onmouseover="this.style.background='var(--surface-border)'" onmouseout="this.style.background='var(--surface2)'">+ Add Variable</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('mousedown', e => { if (e.target === modal) closeAlgVariablesModal(); });
    if (typeof pushModalState === 'function') pushModalState('algVariablesModal', closeAlgVariablesModal);
}

export function closeAlgVariablesModal() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('algVariablesModal');
        if (modal) modal.remove();
    });
}

export function renderAlgVarRows() {
    if (!algVariables || algVariables.size === 0) return '';
    return Array.from(algVariables.entries()).map(([name, value]) => algVarRowHTML(name, value)).join('');
}

export function algVarRowHTML(name, value) {
    return `
        <tr class="alg-var-row">
            <td style="padding: 6px 6px;">
                <input class="alg-var-name" type="text" value="${name}" placeholder="name"
                    style="width:100%; padding:6px 8px; border:1px solid var(--border-color); border-radius:6px; background:var(--surface2); color:var(--text-ui); font-size:0.9rem; font-family: monospace;">
            </td>
            <td style="padding: 6px 6px;">
                <input class="alg-var-value" type="text" value="${value}" placeholder="e.g. /(3,0)/(2,2)/"
                    style="width:100%; padding:6px 8px; border:1px solid var(--border-color); border-radius:6px; background:var(--surface2); color:var(--text-ui); font-size:0.9rem; font-family: monospace;"
                    onblur="this.value = this.value.trim() && this.value.trim() !== 'Done!' && window.ScrambleNormalizer ? window.ScrambleNormalizer.normalizeScramble(this.value.trim()) : this.value.trim()">
            </td>
            <td style="padding: 6px 4px; text-align:center;">
                <button onclick="this.closest('tr').remove()" style="
                    background: var(--delete-btn-bg); border: none; border-radius: 5px;
                    cursor: pointer; width:28px; height:28px; display:flex; align-items:center; justify-content:center;
                "><img src="res/delete.svg" style="width:14px;height:14px;" alt="Delete"></button>
            </td>
        </tr>
    `;
}

export function addAlgVarRow() {
    const tbody = document.getElementById('algVarTableBody');
    if (!tbody) return;
    const tr = document.createElement('tr');
    tr.className = 'alg-var-row';
    tr.innerHTML = algVarRowHTML('', '').match(/<tr[^>]*>([\s\S]*)<\/tr>/)[1];
    tbody.appendChild(tr);
    tr.querySelector('.alg-var-name').focus();
}

export function saveAlgVariables() {
    const rows = document.querySelectorAll('#algVarTableBody .alg-var-row');
    algVariables = new Map();
    rows.forEach(row => {
        const name = row.querySelector('.alg-var-name').value.trim().replace(/[^a-zA-Z0-9_]/g, '');
        const value = row.querySelector('.alg-var-value').value.trim();
        if (name && value) algVariables.set(name, value);
    });
    saveState();
    document.getElementById('algVariablesModal').remove();
    showToast('Variables saved!', 2000, 'success');
}

// Make functions globally accessible
window.openQuickEditModal = openQuickEditModal;
window.revertQuickEditChanges = revertQuickEditChanges;
window.closeQuickEditModal = closeQuickEditModal;
window.switchQuickEditTab = switchQuickEditTab;
window.toggleQuickEditTab = toggleQuickEditTab;
window.findNextQuickEdit = findNextQuickEdit;
window.replaceQuickEdit = replaceQuickEdit;
window.replaceAllQuickEdit = replaceAllQuickEdit;
window.saveQuickEditChanges = saveQuickEditChanges;
window.openQuickEditFindReplace = openQuickEditFindReplace;
window.closeQuickEditFindReplace = closeQuickEditFindReplace;
window.findPreviousQuickEdit = findPreviousQuickEdit;
window.liveSearchQuickEdit = liveSearchQuickEdit;
window.handleReplaceEnter = handleReplaceEnter;
window.changeFindScope = changeFindScope;
window.addAlgorithmColumns = addAlgorithmColumns;
window.openAlgVariablesModal = openAlgVariablesModal;
window.saveAlgVariables = saveAlgVariables;
window.addAlgVarRow = addAlgVarRow;

// Global function to toggle auto-select text on focus
window.setAutoSelectTextOnFocus = function (enabled) {
    autoSelectTextOnFocus = enabled;
    localStorage.setItem('autoSelectTextOnFocus', enabled.toString());
};

// Drag functionality for find/replace popup
export function initializeFindReplaceDrag(popup) {
    let isDragging = false;
    let currentX = 0;
    let currentY = 0;
    let initialX;
    let initialY;

    const header = popup.querySelector('.find-replace-header');

    header.style.cursor = 'move';

    header.addEventListener('mousedown', dragStart);
    header.addEventListener('touchstart', dragStart);

    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);

    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);

    // Reset position function
    popup.resetPosition = function () {
        currentX = 0;
        currentY = 0;
        popup.style.transform = 'translate(0, 0)';
    };

    function dragStart(e) {

        if (e.type === 'touchstart') {
            initialX = e.touches[0].clientX - currentX;
            initialY = e.touches[0].clientY - currentY;
        } else {
            initialX = e.clientX - currentX;
            initialY = e.clientY - currentY;
        }

        if (e.target === header || header.contains(e.target)) {
            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();

            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            setTranslate(currentX, currentY, popup);
        }
    }

    function dragEnd() {
        isDragging = false;
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate(${xPos}px, ${yPos}px)`;
    }
}

// ESM live global compatibility bridge
for (const [name, descriptor] of Object.entries({
    "quickEditState": { get: () => quickEditState, set: value => { quickEditState = value; } },
    "autoSelectTextOnFocus": { get: () => autoSelectTextOnFocus, set: value => { autoSelectTextOnFocus = value; } },
    "expandAlgVariables": { get: () => expandAlgVariables, set: value => { Object.defineProperty(window, "expandAlgVariables", { configurable: true, enumerable: true, writable: true, value }); } },
    "expandAndNormalize": { get: () => expandAndNormalize, set: value => { Object.defineProperty(window, "expandAndNormalize", { configurable: true, enumerable: true, writable: true, value }); } },
    "expandForColorCheck": { get: () => expandForColorCheck, set: value => { Object.defineProperty(window, "expandForColorCheck", { configurable: true, enumerable: true, writable: true, value }); } },
    "getGeneralTableRows": { get: () => getGeneralTableRows, set: value => { Object.defineProperty(window, "getGeneralTableRows", { configurable: true, enumerable: true, writable: true, value }); } },
    "getAlgTableRows": { get: () => getAlgTableRows, set: value => { Object.defineProperty(window, "getAlgTableRows", { configurable: true, enumerable: true, writable: true, value }); } },
    "hydrateGeneralRow": { get: () => hydrateGeneralRow, set: value => { Object.defineProperty(window, "hydrateGeneralRow", { configurable: true, enumerable: true, writable: true, value }); } },
    "hydrateAlgorithmsRow": { get: () => hydrateAlgorithmsRow, set: value => { Object.defineProperty(window, "hydrateAlgorithmsRow", { configurable: true, enumerable: true, writable: true, value }); } },
    "setupRowHandlers": { get: () => setupRowHandlers, set: value => { Object.defineProperty(window, "setupRowHandlers", { configurable: true, enumerable: true, writable: true, value }); } },
    "initQuickEditLazyLoad": { get: () => initQuickEditLazyLoad, set: value => { Object.defineProperty(window, "initQuickEditLazyLoad", { configurable: true, enumerable: true, writable: true, value }); } },
    "openQuickEditModal": { get: () => openQuickEditModal, set: value => { Object.defineProperty(window, "openQuickEditModal", { configurable: true, enumerable: true, writable: true, value }); } },
    "addAlgorithmColumns": { get: () => addAlgorithmColumns, set: value => { Object.defineProperty(window, "addAlgorithmColumns", { configurable: true, enumerable: true, writable: true, value }); } },
    "updateAlgorithmTableHeaders": { get: () => updateAlgorithmTableHeaders, set: value => { Object.defineProperty(window, "updateAlgorithmTableHeaders", { configurable: true, enumerable: true, writable: true, value }); } },
    "updateAlgorithmTableCells": { get: () => updateAlgorithmTableCells, set: value => { Object.defineProperty(window, "updateAlgorithmTableCells", { configurable: true, enumerable: true, writable: true, value }); } },
    "getCaseShapeData": { get: () => getCaseShapeData, set: value => { Object.defineProperty(window, "getCaseShapeData", { configurable: true, enumerable: true, writable: true, value }); } },
    "getCanonicalCaseNameForCell": { get: () => getCanonicalCaseNameForCell, set: value => { Object.defineProperty(window, "getCanonicalCaseNameForCell", { configurable: true, enumerable: true, writable: true, value }); } },
    "ALL_LEGAL_TOPS": { get: () => ALL_LEGAL_TOPS, set: value => { Object.defineProperty(window, "ALL_LEGAL_TOPS", { configurable: true, enumerable: true, writable: true, value }); } },
    "ALL_LEGAL_BOTTOMS": { get: () => ALL_LEGAL_BOTTOMS, set: value => { Object.defineProperty(window, "ALL_LEGAL_BOTTOMS", { configurable: true, enumerable: true, writable: true, value }); } },
    "tryFixAngle": { get: () => tryFixAngle, set: value => { Object.defineProperty(window, "tryFixAngle", { configurable: true, enumerable: true, writable: true, value }); } },
    "tryFixMirroredAngle": { get: () => tryFixMirroredAngle, set: value => { Object.defineProperty(window, "tryFixMirroredAngle", { configurable: true, enumerable: true, writable: true, value }); } },
    "stripBeforeFirstSlash": { get: () => stripBeforeFirstSlash, set: value => { Object.defineProperty(window, "stripBeforeFirstSlash", { configurable: true, enumerable: true, writable: true, value }); } },
    "updateAlgorithmCellParity": { get: () => updateAlgorithmCellParity, set: value => { Object.defineProperty(window, "updateAlgorithmCellParity", { configurable: true, enumerable: true, writable: true, value }); } },
    "updateAlgorithmCellParityLive": { get: () => updateAlgorithmCellParityLive, set: value => { Object.defineProperty(window, "updateAlgorithmCellParityLive", { configurable: true, enumerable: true, writable: true, value }); } },
    "setupQuickEditKeyboardShortcuts": { get: () => setupQuickEditKeyboardShortcuts, set: value => { Object.defineProperty(window, "setupQuickEditKeyboardShortcuts", { configurable: true, enumerable: true, writable: true, value }); } },
    "switchQuickEditTab": { get: () => switchQuickEditTab, set: value => { Object.defineProperty(window, "switchQuickEditTab", { configurable: true, enumerable: true, writable: true, value }); } },
    "toggleQuickEditTab": { get: () => toggleQuickEditTab, set: value => { Object.defineProperty(window, "toggleQuickEditTab", { configurable: true, enumerable: true, writable: true, value }); } },
    "openQuickEditFindReplace": { get: () => openQuickEditFindReplace, set: value => { Object.defineProperty(window, "openQuickEditFindReplace", { configurable: true, enumerable: true, writable: true, value }); } },
    "closeQuickEditFindReplace": { get: () => closeQuickEditFindReplace, set: value => { Object.defineProperty(window, "closeQuickEditFindReplace", { configurable: true, enumerable: true, writable: true, value }); } },
    "liveSearchQuickEdit": { get: () => liveSearchQuickEdit, set: value => { Object.defineProperty(window, "liveSearchQuickEdit", { configurable: true, enumerable: true, writable: true, value }); } },
    "highlightAllMatches": { get: () => highlightAllMatches, set: value => { Object.defineProperty(window, "highlightAllMatches", { configurable: true, enumerable: true, writable: true, value }); } },
    "escapeHtml": { get: () => escapeHtml, set: value => { Object.defineProperty(window, "escapeHtml", { configurable: true, enumerable: true, writable: true, value }); } },
    "highlightCurrentMatch": { get: () => highlightCurrentMatch, set: value => { Object.defineProperty(window, "highlightCurrentMatch", { configurable: true, enumerable: true, writable: true, value }); } },
    "clearFindHighlights": { get: () => clearFindHighlights, set: value => { Object.defineProperty(window, "clearFindHighlights", { configurable: true, enumerable: true, writable: true, value }); } },
    "findNextQuickEdit": { get: () => findNextQuickEdit, set: value => { Object.defineProperty(window, "findNextQuickEdit", { configurable: true, enumerable: true, writable: true, value }); } },
    "findPreviousQuickEdit": { get: () => findPreviousQuickEdit, set: value => { Object.defineProperty(window, "findPreviousQuickEdit", { configurable: true, enumerable: true, writable: true, value }); } },
    "replaceQuickEdit": { get: () => replaceQuickEdit, set: value => { Object.defineProperty(window, "replaceQuickEdit", { configurable: true, enumerable: true, writable: true, value }); } },
    "replaceAllQuickEdit": { get: () => replaceAllQuickEdit, set: value => { Object.defineProperty(window, "replaceAllQuickEdit", { configurable: true, enumerable: true, writable: true, value }); } },
    "handleReplaceEnter": { get: () => handleReplaceEnter, set: value => { Object.defineProperty(window, "handleReplaceEnter", { configurable: true, enumerable: true, writable: true, value }); } },
    "changeFindScope": { get: () => changeFindScope, set: value => { Object.defineProperty(window, "changeFindScope", { configurable: true, enumerable: true, writable: true, value }); } },
    "saveQuickEditChanges": { get: () => saveQuickEditChanges, set: value => { Object.defineProperty(window, "saveQuickEditChanges", { configurable: true, enumerable: true, writable: true, value }); } },
    "closeQuickEditModal": { get: () => closeQuickEditModal, set: value => { Object.defineProperty(window, "closeQuickEditModal", { configurable: true, enumerable: true, writable: true, value }); } },
    "forceCloseQuickEditModal": { get: () => forceCloseQuickEditModal, set: value => { Object.defineProperty(window, "forceCloseQuickEditModal", { configurable: true, enumerable: true, writable: true, value }); } },
    "revertQuickEditChanges": { get: () => revertQuickEditChanges, set: value => { Object.defineProperty(window, "revertQuickEditChanges", { configurable: true, enumerable: true, writable: true, value }); } },
    "openAlgVariablesModal": { get: () => openAlgVariablesModal, set: value => { Object.defineProperty(window, "openAlgVariablesModal", { configurable: true, enumerable: true, writable: true, value }); } },
    "closeAlgVariablesModal": { get: () => closeAlgVariablesModal, set: value => { Object.defineProperty(window, "closeAlgVariablesModal", { configurable: true, enumerable: true, writable: true, value }); } },
    "renderAlgVarRows": { get: () => renderAlgVarRows, set: value => { Object.defineProperty(window, "renderAlgVarRows", { configurable: true, enumerable: true, writable: true, value }); } },
    "algVarRowHTML": { get: () => algVarRowHTML, set: value => { Object.defineProperty(window, "algVarRowHTML", { configurable: true, enumerable: true, writable: true, value }); } },
    "addAlgVarRow": { get: () => addAlgVarRow, set: value => { Object.defineProperty(window, "addAlgVarRow", { configurable: true, enumerable: true, writable: true, value }); } },
    "saveAlgVariables": { get: () => saveAlgVariables, set: value => { Object.defineProperty(window, "saveAlgVariables", { configurable: true, enumerable: true, writable: true, value }); } },
    "initializeFindReplaceDrag": { get: () => initializeFindReplaceDrag, set: value => { Object.defineProperty(window, "initializeFindReplaceDrag", { configurable: true, enumerable: true, writable: true, value }); } },
})) {
    Object.defineProperty(window, name, {
        configurable: true,
        enumerable: true,
        get: descriptor.get,
        set: descriptor.set
    });
}
