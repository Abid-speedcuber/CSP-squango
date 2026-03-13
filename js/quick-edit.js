// Quick Edit System for batch editing cases

let quickEditState = {
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
let autoSelectTextOnFocus = localStorage.getItem('autoSelectTextOnFocus') !== 'false'; // Default true

function openQuickEditModal() {
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
                                <th style="width: 20%;">Case Name</th>
                                <th style="width: 25%;">Display Name</th>
                                <th style="width: 20%;">Subtitle</th>
                                <th style="width: 35%;">Notes</th>
                            </tr>
                        </thead>
                        <tbody id="quickEditGeneralBody">
                            ${generateGeneralTableRows()}
                        </tbody>
                    </table>
                </div>
                
                <div class="quick-edit-content" id="quickEditAlgorithmsTab" style="display: none;">
                    <table class="quick-edit-table algorithms-table">
                        <thead>
                            <tr id="algorithmTableHeader">
                                <th class="display-name-header">Display Name</th>
                            </tr>
                        </thead>
                        <tbody id="quickEditAlgorithmsBody">
                            ${generateAlgorithmsTableRows()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.classList.add('modal-open');

    // Add keyboard shortcuts
    setupQuickEditKeyboardShortcuts();

    // Setup cell focus handlers
    setupQuickEditCellHandlers();
}

function generateGeneralTableRows() {
    const sortedData = [...data].sort((a, b) => {
        const nameA = getDisplayName(a.name);
        const nameB = getDisplayName(b.name);
        return nameA.localeCompare(nameB);
    });
    return sortedData.map(item => {
        const displayName = getDisplayName(item.name);
        const caseNameDisplay = getDisplayName(item.name);
        const subtitle = perCaseSubtitles.get(item.name) || '';
        const note = comments.get(item.name) || '';
        const formattedNote = sanitizeNoteHTML(note);

        return `
            <tr data-case="${item.name}">
                <td class="uneditable">${caseNameDisplay}</td>
                <td class="editable" contenteditable="true" data-field="displayName" data-original="${displayName}">${displayName}</td>
                <td class="editable" contenteditable="true" data-field="subtitle" data-original="${subtitle}">${subtitle}</td>
                <td class="editable notes-cell" contenteditable="true" data-field="notes" data-original="${note.replace(/"/g, '&quot;')}" data-raw-html="${note.replace(/"/g, '&quot;')}">${formattedNote}</td>
            </tr>
        `;
    }).join('');
}

function generateAlgorithmsTableRows() {
    const visibleCols = quickEditState.visibleAlgColumns || 6;
    const sortedData = [...data].sort((a, b) => getDisplayName(a.name).localeCompare(getDisplayName(b.name)));

    return sortedData.map(item => {
        const displayName = getDisplayName(item.name);
        const customAlgs = customAlgorithms.get(item.name);
        let allAlgs = [];

        if (customAlgs) {
            allAlgs = [...(customAlgs.odd || []), ...(customAlgs.even || [])];
        } else {
            allAlgs = [...(item.odd || []), ...(item.even || [])];
        }

        // Pad to visible columns (minimum 6)
        const totalCols = Math.max(visibleCols, 6);
        while (allAlgs.length < totalCols) {
            allAlgs.push('');
        }

        return `
            <tr data-case="${item.name}">
                <td class="uneditable display-name-col">${displayName}</td>
                ${allAlgs.slice(0, totalCols).map((alg, idx) => `
                    <td class="editable alg-cell" contenteditable="true" data-field="alg${idx}" data-original="${alg}" style="${idx >= visibleCols ? 'display: none;' : ''}">${alg}</td>
                `).join('')}
            </tr>
        `;
    }).join('');
}

function addAlgorithmColumns() {
    const tbody = document.getElementById('quickEditAlgorithmsBody');
    if (!tbody) return;

    quickEditState.visibleAlgColumns += 2;

    // For each row, ensure we have enough cells
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        const caseName = row.dataset.case;
        const existingCells = row.querySelectorAll('.alg-cell');
        const currentCellCount = existingCells.length;

        // If we need more cells than we have, create them
        if (currentCellCount < quickEditState.visibleAlgColumns) {
            const displayNameCell = row.querySelector('.display-name-col');

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
                        const normalized = window.ScrambleNormalizer.normalizeScramble(rawText);
                        this.textContent = normalized;
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

function updateAlgorithmTableHeaders() {
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

function updateAlgorithmTableCells() {
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

function setupQuickEditCellHandlers() {
    const modal = document.getElementById('quickEditModal');
    if (!modal) return;

    // Handle cell focus for text selection
    const editableCells = modal.querySelectorAll('.editable');
    editableCells.forEach(cell => {
        cell.addEventListener('focus', function () {
            // For notes cells, show raw HTML
            if (this.classList.contains('notes-cell')) {
                const rawHTML = this.dataset.rawHtml || '';
                this.textContent = rawHTML;
            }

            // Select all text when cell is focused (if setting is enabled)
            if (autoSelectTextOnFocus) {
                const range = document.createRange();
                range.selectNodeContents(this);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }

            quickEditState.lastFocusedCell = this;

            // Update scope for general tab
            if (quickEditState.currentTab === 'general') {
                const field = this.dataset.field;
                if (field === 'displayName') {
                    quickEditState.findReplaceScope = 'name';
                } else if (field === 'subtitle') {
                    quickEditState.findReplaceScope = 'subtitle';
                } else if (field === 'notes') {
                    quickEditState.findReplaceScope = 'notes';
                }
            } else {
                quickEditState.findReplaceScope = null; // No scope for algorithms tab
            }
        });

        // Handle keydown for navigation
        cell.addEventListener('keydown', function (e) {
            // Shift+Enter for line break in notes field
            if (e.key === 'Enter' && e.shiftKey && this.dataset.field === 'notes') {
                e.preventDefault();
                document.execCommand('insertLineBreak');
                return;
            }

            // Enter to move to next row
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

            // Tab to move to next column
            if (e.key === 'Tab') {
                e.preventDefault();
                const currentRow = this.closest('tr');
                const cells = Array.from(currentRow.querySelectorAll('.editable'));
                const currentIndex = cells.indexOf(this);

                if (e.shiftKey) {
                    // Shift+Tab to move to previous column
                    if (currentIndex > 0) {
                        cells[currentIndex - 1].focus();
                    }
                } else {
                    // Tab to move to next column
                    if (currentIndex < cells.length - 1) {
                        cells[currentIndex + 1].focus();
                    }
                }
                return;
            }
        });

        // Handle blur for notes cells to show formatted HTML
        cell.addEventListener('blur', function () {
            if (this.classList.contains('notes-cell')) {
                const rawHTML = this.textContent.trim();
                this.dataset.rawHtml = rawHTML;
                const formattedHTML = sanitizeNoteHTML(rawHTML);
                this.innerHTML = formattedHTML;
            }
        });

        // Handle blur for algorithm cells to normalize and update parity color
        if (cell.classList.contains('alg-cell')) {
            cell.addEventListener('input', function () {
                // Live color coding without normalization
                updateAlgorithmCellParityLive(this);
            });

            cell.addEventListener('blur', function () {
                const rawText = this.textContent.trim();
                if (rawText && rawText !== 'Done!') {
                    // Normalize the scramble
                    const normalized = window.ScrambleNormalizer.normalizeScramble(rawText);
                    this.textContent = normalized;
                }
                updateAlgorithmCellParity(this);
            });

            // Handle paste to strip formatting
            cell.addEventListener('paste', function (e) {
                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData('text/plain');
                document.execCommand('insertText', false, text);
            });
        }
    });

    // Update parity for all algorithm cells after setup
    setTimeout(() => {
        const algCells = modal.querySelectorAll('.alg-cell');
        algCells.forEach(cell => {
            if (cell.textContent.trim()) {
                updateAlgorithmCellParity(cell);
            }
        });
    }, 100);
}

function getCaseShapeData(caseName) {
    // Find the shape data for this specific case by display name or case name
    for (const shapeData of shapeIndex) {
        if (shapeData.name === caseName) return shapeData;
    }
    // Try matching by canonical shapeIndexMap
    const canonicalIdx = parseInt(shapeIndexMap[caseName]);
    if (isNaN(canonicalIdx)) return null;
    for (const shapeData of shapeIndex) {
        if (shapeData.org && shapeData.org.includes(canonicalIdx)) return shapeData;
    }
    return null;
}

function getCanonicalCaseNameForCell(cell) {
    const row = cell.closest('tr');
    if (!row) return null;
    return row.dataset.case || null;
}

const ALL_LEGAL_TOPS = [0,1,2,3,4,5,-1,-2,-3,-4,-5,-6];
const ALL_LEGAL_BOTTOMS = [0,1,2,3,4,5,-1,-2,-3,-4,-5,-6];

function tryFixAngle(algBody, canonicalShapeIdx) {
    // algBody is everything from first / onward
    for (const t of ALL_LEGAL_TOPS) {
        for (const b of ALL_LEGAL_BOTTOMS) {
            const candidate = `(${t},${b})` + algBody;
            try {
                const result = window.algToShapeIndex(candidate);
                if (result.shapeIndex === canonicalShapeIdx) {
                    return candidate;
                }
            } catch(e) {}
        }
    }
    return null;
}

function tryFixMirroredAngle(algBody, canonicalShapeIdx) {
    for (const t of ALL_LEGAL_TOPS) {
        for (const b of ALL_LEGAL_BOTTOMS) {
            const candidate = `/(6,6)/(${t},${b})` + algBody;
            try {
                const result = window.algToShapeIndex(candidate);
                if (result.shapeIndex === canonicalShapeIdx) {
                    return `(${t},${b})` + algBody;
                }
            } catch(e) {}
        }
    }
    return null;
}

function stripBeforeFirstSlash(alg) {
    // If starts with /, keep as is. Otherwise strip everything before first /
    const firstSlash = alg.indexOf('/');
    if (firstSlash <= 0) return alg; // starts with / or no slash found
    return alg.slice(firstSlash);
}

function updateAlgorithmCellParity(cell) {
    const alg = cell.textContent.trim();
    if (!alg || alg === 'Done!') {
        cell.style.color = '';
        cell.style.fontWeight = '';
        return;
    }

    if (typeof window.algToShapeIndex === 'undefined' ||
        typeof window.Square1ParityAnalyzerLibraryWithSillyNames === 'undefined') {
        cell.style.color = '';
        cell.style.fontWeight = '';
        return;
    }

    const caseName = getCanonicalCaseNameForCell(cell);
    const canonicalIdxStr = caseName ? shapeIndexMap[caseName] : null;
    const canonicalIdx = canonicalIdxStr !== undefined ? parseInt(canonicalIdxStr) : null;
    const caseShapeData = caseName ? getCaseShapeData(caseName) : null;

    try {
        const result = window.algToShapeIndex(alg);
        const resultShapeIndex = result.shapeIndex;

        const isDirectMatch = canonicalIdx !== null && resultShapeIndex === canonicalIdx;
        const isInOrg = caseShapeData && caseShapeData.org && caseShapeData.org.includes(resultShapeIndex);
        const isInMir = caseShapeData && caseShapeData.mir && caseShapeData.mir.includes(resultShapeIndex);

        if (isDirectMatch || isInOrg) {
            // Correct case - check parity
            const setup = invertScramble(alg);
            const parityText = window.Square1ParityAnalyzerLibraryWithSillyNames.getParityTextFromScramblePlease(setup, {
                topColor: colorScheme.topColor, bottomColor: colorScheme.bottomColor,
                frontColor: colorScheme.frontColor, rightColor: colorScheme.rightColor,
                backColor: colorScheme.backColor, leftColor: colorScheme.leftColor
            }, cornerStickerMode);

            if (isDirectMatch) {
                // Canonical angle - fix angle if needed
                cell.style.color = parityText === 'Odd' ? '#00a126ff' : '#0069d9ff';
            } else {
                // Org match but not canonical - try to fix angle
                if (canonicalIdx !== null) {
                    const algBody = stripBeforeFirstSlash(alg);
                    const fixed = tryFixAngle(algBody, canonicalIdx);
                    if (fixed) {
                        cell.textContent = window.ScrambleNormalizer.normalizeScramble(fixed);
                    }
                }
                cell.style.color = parityText === 'Odd' ? '#00a126ff' : '#0069d9ff';
            }
            cell.style.fontWeight = '600';

        } else if (isInMir) {
            const setup = invertScramble(alg);
            const parityText = window.Square1ParityAnalyzerLibraryWithSillyNames.getParityTextFromScramblePlease(setup, {
                topColor: colorScheme.topColor, bottomColor: colorScheme.bottomColor,
                frontColor: colorScheme.frontColor, rightColor: colorScheme.rightColor,
                backColor: colorScheme.backColor, leftColor: colorScheme.leftColor
            }, cornerStickerMode);

            if (canonicalIdx !== null) {
                const algBody = stripBeforeFirstSlash(alg);
                const fixed = tryFixMirroredAngle(algBody, canonicalIdx);
                if (fixed) {
                    cell.textContent = window.ScrambleNormalizer.normalizeScramble(fixed);
                }
            }
            cell.style.color = parityText === 'Odd' ? '#006b1aff' : '#004a9fff';
            cell.style.fontWeight = '600';

        } else {
            cell.style.color = '#71000bff';
            cell.style.fontWeight = '600';
        }
    } catch (error) {
        cell.style.color = '#71000bff';
        cell.style.fontWeight = '600';
    }
}

function updateAlgorithmCellParityLive(cell) {
    const alg = cell.textContent.trim();
    if (!alg || alg === 'Done!') {
        cell.style.color = '';
        cell.style.fontWeight = '';
        return;
    }

    if (typeof window.algToShapeIndex === 'undefined' ||
        typeof window.Square1ParityAnalyzerLibraryWithSillyNames === 'undefined' ||
        typeof window.ScrambleNormalizer === 'undefined') {
        cell.style.color = '';
        cell.style.fontWeight = '';
        return;
    }

    const caseName = getCanonicalCaseNameForCell(cell);
    const canonicalIdxStr = caseName ? shapeIndexMap[caseName] : null;
    const canonicalIdx = canonicalIdxStr !== undefined ? parseInt(canonicalIdxStr) : null;
    const caseShapeData = caseName ? getCaseShapeData(caseName) : null;

    try {
        const normalized = window.ScrambleNormalizer.normalizeScramble(alg);
        const result = window.algToShapeIndex(normalized);
        const resultShapeIndex = result.shapeIndex;

        const isDirectMatch = canonicalIdx !== null && resultShapeIndex === canonicalIdx;
        const isInOrg = caseShapeData && caseShapeData.org && caseShapeData.org.includes(resultShapeIndex);
        const isInMir = caseShapeData && caseShapeData.mir && caseShapeData.mir.includes(resultShapeIndex);

        if (isDirectMatch || isInOrg) {
            const setup = invertScramble(normalized);
            const parityText = window.Square1ParityAnalyzerLibraryWithSillyNames.getParityTextFromScramblePlease(setup, {
                topColor: colorScheme.topColor, bottomColor: colorScheme.bottomColor,
                frontColor: colorScheme.frontColor, rightColor: colorScheme.rightColor,
                backColor: colorScheme.backColor, leftColor: colorScheme.leftColor
            }, cornerStickerMode);
            cell.style.color = parityText === 'Odd' ? '#00a126ff' : '#0069d9ff';
            cell.style.fontWeight = '600';
        } else if (isInMir) {
            const setup = invertScramble(normalized);
            const parityText = window.Square1ParityAnalyzerLibraryWithSillyNames.getParityTextFromScramblePlease(setup, {
                topColor: colorScheme.topColor, bottomColor: colorScheme.bottomColor,
                frontColor: colorScheme.frontColor, rightColor: colorScheme.rightColor,
                backColor: colorScheme.backColor, leftColor: colorScheme.leftColor
            }, cornerStickerMode);
            cell.style.color = parityText === 'Odd' ? '#006b1aff' : '#004a9fff';
            cell.style.fontWeight = '600';
        } else {
            cell.style.color = '#71000bff';
            cell.style.fontWeight = '600';
        }
    } catch (error) {
        cell.style.color = '#71000bff';
        cell.style.fontWeight = '600';
    }
}

function setupQuickEditKeyboardShortcuts() {
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

function switchQuickEditTab(tab) {
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

    if (tab === 'general') {
        generalTab.style.display = 'block';
        algorithmsTab.style.display = 'none';
        if (addColumnsBtn) addColumnsBtn.style.display = 'none';
    } else {
        generalTab.style.display = 'none';
        algorithmsTab.style.display = 'block';
        if (addColumnsBtn) addColumnsBtn.style.display = '';
        // Initialize algorithm table headers when switching to algorithm tab
        updateAlgorithmTableHeaders();
    }

    // Close find/replace when switching tabs
    if (quickEditState.findReplaceOpen) {
        closeQuickEditFindReplace();
    }
}

function toggleQuickEditTab() {
    // Only toggle on mobile (when tabs are hidden)
    if (window.innerWidth > 630) return;

    const newTab = quickEditState.currentTab === 'general' ? 'algorithms' : 'general';
    switchQuickEditTab(newTab);
}

function openQuickEditFindReplace() {
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

function closeQuickEditFindReplace() {
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

function liveSearchQuickEdit() {
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

function highlightAllMatches() {
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
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function highlightCurrentMatch() {
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

function clearFindHighlights() {
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

function findNextQuickEdit() {
    if (quickEditState.findMatches.length === 0) return;

    quickEditState.currentFindIndex = (quickEditState.currentFindIndex + 1) % quickEditState.findMatches.length;
    highlightCurrentMatch();

    document.getElementById('quickEditMatchCount').textContent =
        `${quickEditState.currentFindIndex + 1} of ${quickEditState.findMatches.length}`;
}

function findPreviousQuickEdit() {
    if (quickEditState.findMatches.length === 0) return;

    quickEditState.currentFindIndex = quickEditState.currentFindIndex - 1;
    if (quickEditState.currentFindIndex < 0) {
        quickEditState.currentFindIndex = quickEditState.findMatches.length - 1;
    }

    highlightCurrentMatch();

    document.getElementById('quickEditMatchCount').textContent =
        `${quickEditState.currentFindIndex + 1} of ${quickEditState.findMatches.length}`;
}

function replaceQuickEdit() {
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

function replaceAllQuickEdit() {
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

function handleReplaceEnter(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        replaceQuickEdit();
    }
}

function changeFindScope() {
    const scopeSelector = document.getElementById('quickEditScopeSelector');
    if (!scopeSelector) return;

    const newScope = scopeSelector.value;
    quickEditState.findReplaceScope = newScope;

    // Re-run search with new scope
    liveSearchQuickEdit();
}

function saveQuickEditChanges() {
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
    const algoRows = modal.querySelectorAll('#quickEditAlgorithmsBody tr');
    algoRows.forEach(row => {
        const caseName = row.dataset.case;
        const algCells = row.querySelectorAll('.alg-cell');

        const algs = Array.from(algCells)
            .map(cell => cell.textContent.trim())
            .filter(alg => alg);

        if (algs.length > 0) {
            customAlgorithms.set(caseName, {
                odd: [],
                even: algs
            });
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
    calculateAndCacheAllParity();

    // Save state and re-render
    saveState();
    render();

    showToast('All changes saved successfully!', 2000, 'success');
}

function closeQuickEditModal() {
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
    const algoRows = modal.querySelectorAll('#quickEditAlgorithmsBody tr');
    algoRows.forEach(row => {
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

function forceCloseQuickEditModal() {
    const modal = document.getElementById('quickEditModal');
    if (modal) {
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
}

function revertQuickEditChanges() {
    if (!window.quickEditInitialState) return;

    showConfirmation('Are you sure you want to revert all changes to the last save point?', () => {
        // Restore initial state
        displayNames = { ...window.quickEditInitialState.displayNames };
        perCaseSubtitles = new Map(window.quickEditInitialState.perCaseSubtitles);
        comments = new Map(window.quickEditInitialState.comments);
        customAlgorithms = new Map(window.quickEditInitialState.customAlgorithms);

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
                        <div class="training-info-text"><strong>Algorithms Tab:</strong> <b>Edit</b> algorithms for all cases. Algorithms are auto-normalized when you click away from the cell (so you can write 1043'2'1'-3-3 as algorithm and the cell will fix itself). They are also color-coded in real time by parity and validity: <span style="color: #00a126ff; font-weight: 600;">green = odd</span>, <span style="color: #0069d9ff; font-weight: 600;">blue = even</span>, <span style="color: #006b1aff; font-weight: 600;">barely-noticeable dark green = odd (mirrored)</span>, <span style="color: #004a9fff; font-weight: 600;">ever-so-slightly dark blue = even (mirrored)</span>, <span style="color: #71000bff; font-weight: 600;">red = invalid</span> (either doesn't solve the case or does not lead to valid squan position at all).</div>
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
                        <div class="training-info-text"><strong>Save:</strong> Click Save to apply all changes. Exit without saving to <b>discard all the changes</b></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(infoModal);
    }

    infoModal.classList.add('active');
};

window.closeQuickEditInfoModal = function () {
    const modal = document.getElementById('quickEditInfoModal');
    if (modal) {
        modal.classList.remove('active');
    }
};

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

// Global function to toggle auto-select text on focus
window.setAutoSelectTextOnFocus = function (enabled) {
    autoSelectTextOnFocus = enabled;
    localStorage.setItem('autoSelectTextOnFocus', enabled.toString());
};

// Drag functionality for find/replace popup
function initializeFindReplaceDrag(popup) {
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
        const rect = popup.getBoundingClientRect();

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

    function dragEnd(e) {
        isDragging = false;
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate(${xPos}px, ${yPos}px)`;
    }
}