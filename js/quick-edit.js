// Quick Edit System for batch editing cases

let quickEditState = {
    currentTab: 'general',
    findReplaceOpen: false,
    findReplaceScope: null,
    currentFindIndex: -1,
    findMatches: [],
    lastFocusedCell: null,
    allMatchRanges: [] // Store all text ranges for multiple matches per cell
};

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
                    <h2>Quick Edit - All Cases</h2>
                    <div class="quick-edit-tabs">
                        <button class="quick-edit-tab active" data-tab="general" onclick="switchQuickEditTab('general')">General Info</button>
                        <button class="quick-edit-tab" data-tab="algorithms" onclick="switchQuickEditTab('algorithms')">Algorithms</button>
                    </div>
                </div>
                <div class="quick-edit-header-right">
                    <button class="quick-edit-icon-btn" onclick="openQuickEditFindReplace()" title="Find and Replace (Ctrl+F)">
                        <img src="res/search.svg" alt="Find">
                    </button>
                    <button class="quick-edit-icon-btn" onclick="revertQuickEditChanges()" title="Revert to last save">
                        <img src="res/revert.svg" alt="Revert">
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
                    <table class="quick-edit-table">
                        <thead>
                            <tr>
                                <th style="width: 15%;">Case Name</th>
                                <th style="width: 14%;">Alg 1</th>
                                <th style="width: 14%;">Alg 2</th>
                                <th style="width: 14%;">Alg 3</th>
                                <th style="width: 14%;">Alg 4</th>
                                <th style="width: 14%;">Alg 5</th>
                                <th style="width: 14%;">Alg 6</th>
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
    return data.map(item => {
        const displayName = getDisplayName(item.name);
        const subtitle = perCaseSubtitles.get(item.name) || '';
        const note = comments.get(item.name) || '';
        
        return `
            <tr data-case="${item.name}">
                <td class="uneditable">${item.name}</td>
                <td class="editable" contenteditable="true" data-field="displayName" data-original="${displayName}">${displayName}</td>
                <td class="editable" contenteditable="true" data-field="subtitle" data-original="${subtitle}">${subtitle}</td>
                <td class="editable" contenteditable="true" data-field="notes" data-original="${note}">${note}</td>
            </tr>
        `;
    }).join('');
}

function generateAlgorithmsTableRows() {
    return data.map(item => {
        const customAlgs = customAlgorithms.get(item.name);
        let allAlgs = [];
        
        if (customAlgs) {
            allAlgs = [...(customAlgs.odd || []), ...(customAlgs.even || [])];
        } else {
            allAlgs = [...(item.odd || []), ...(item.even || [])];
        }
        
        // Pad to 6 columns
        while (allAlgs.length < 6) {
            allAlgs.push('');
        }
        
        return `
            <tr data-case="${item.name}">
                <td class="uneditable">${item.name}</td>
                ${allAlgs.slice(0, 6).map((alg, idx) => `
                    <td class="editable alg-cell" contenteditable="true" data-field="alg${idx}" data-original="${alg}">${alg}</td>
                `).join('')}
            </tr>
        `;
    }).join('');
}

function setupQuickEditCellHandlers() {
    const modal = document.getElementById('quickEditModal');
    if (!modal) return;
    
    // Handle cell focus for text selection
    const editableCells = modal.querySelectorAll('.editable');
    editableCells.forEach(cell => {
        cell.addEventListener('focus', function() {
            // Select all text when cell is focused
            const range = document.createRange();
            range.selectNodeContents(this);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
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
        cell.addEventListener('keydown', function(e) {
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
        
        // Handle blur for algorithm cells to update parity color
        if (cell.classList.contains('alg-cell')) {
            cell.addEventListener('blur', function() {
                updateAlgorithmCellParity(this);
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

function updateAlgorithmCellParity(cell) {
    const alg = cell.textContent.trim();
    if (!alg || alg === 'Done!') {
        cell.style.color = '';
        return;
    }
    
    if (typeof window.Square1ParityAnalyzerLibraryWithSillyNames === 'undefined') {
        cell.style.color = '';
        return;
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
        
        cell.style.color = parityText === 'Odd' ? '#dc3545' : '#006400';
        cell.style.fontWeight = '600';
    } catch (error) {
        cell.style.color = '';
    }
}

function setupQuickEditKeyboardShortcuts() {
    const modal = document.getElementById('quickEditModal');
    if (!modal) return;
    
    modal.addEventListener('keydown', function(e) {
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
    
    // Show/hide content
    const generalTab = document.getElementById('quickEditGeneralTab');
    const algorithmsTab = document.getElementById('quickEditAlgorithmsTab');
    
    if (tab === 'general') {
        generalTab.style.display = 'block';
        algorithmsTab.style.display = 'none';
    } else {
        generalTab.style.display = 'none';
        algorithmsTab.style.display = 'block';
    }
    
    // Close find/replace when switching tabs
    if (quickEditState.findReplaceOpen) {
        closeQuickEditFindReplace();
    }
}

function openQuickEditFindReplace() {
    const findReplace = document.getElementById('quickEditFindReplace');
    const findInput = document.getElementById('quickEditFindInput');
    const scopeSelector = document.getElementById('quickEditScopeSelector');
    
    findReplace.style.display = 'block';
    quickEditState.findReplaceOpen = true;
    
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
}

function liveSearchQuickEdit() {
    const findInput = document.getElementById('quickEditFindInput');
    const searchTerm = findInput.value;
    
    // Clear previous highlights
    clearFindHighlights();
    quickEditState.findMatches = [];
    quickEditState.allMatchRanges = [];
    quickEditState.currentFindIndex = -1;
    
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
    
    // Find all matches with their positions
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
    quickEditState.allMatchRanges.forEach(range => {
        const span = document.createElement('span');
        span.className = 'find-match-highlight';
        
        const text = range.cell.textContent;
        range.cell.innerHTML = 
            text.substring(0, range.start) +
            `<span class="find-match-highlight">${text.substring(range.start, range.end)}</span>` +
            text.substring(range.end);
    });
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
        if (cell.querySelector('.find-match-highlight')) {
            cell.textContent = cell.textContent; // Removes all HTML, keeps just text
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
        const scopeSelector= document.getElementById('quickEditScopeSelector');
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
        const notes = notesCell.textContent.trim();
        
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
            const current = cell.textContent.trim();
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
        allMatchRanges: []
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

// Make functions globally accessible
window.openQuickEditModal = openQuickEditModal;
window.revertQuickEditChanges = revertQuickEditChanges;
window.closeQuickEditModal = closeQuickEditModal;
window.switchQuickEditTab = switchQuickEditTab;
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