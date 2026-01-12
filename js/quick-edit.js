// Quick Edit System for batch editing cases

let quickEditState = {
    currentTab: 'general', // 'general' or 'algorithms'
    findReplaceOpen: false,
    findReplaceScope: null, // 'name', 'subtitle', 'notes' for general tab, null for algorithms
    currentFindIndex: -1,
    findMatches: [],
    lastFocusedCell: null
};

function openQuickEditModal() {
    // Close settings modal if open
    closeSettingsModal();
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'quickEditModal';
    modal.style.background = 'rgba(0, 0, 0, 0.5)';
    
    modal.innerHTML = `
        <div class="quick-edit-screen">
            <div class="quick-edit-header">
                <h2>Quick Edit - All Cases</h2>
                <button class="close-btn" onclick="closeQuickEditModal()">&times;</button>
            </div>
            
            <div class="quick-edit-tabs">
                <button class="quick-edit-tab active" data-tab="general" onclick="switchQuickEditTab('general')">General Info</button>
                <button class="quick-edit-tab" data-tab="algorithms" onclick="switchQuickEditTab('algorithms')">Algorithms</button>
            </div>
            
            <div class="quick-edit-find-replace" id="quickEditFindReplace" style="display: none;">
                <div class="find-replace-content">
                    <input type="text" id="quickEditFindInput" placeholder="Find">
                    <input type="text" id="quickEditReplaceInput" placeholder="Replace">
                    <div class="find-replace-buttons">
                        <button onclick="findNextQuickEdit()">Next</button>
                        <button onclick="replaceQuickEdit()">Replace</button>
                        <button onclick="replaceAllQuickEdit()">Replace All</button>
                        <button onclick="closeQuickEditFindReplace()">Close</button>
                    </div>
                    <div class="find-replace-info">
                        <span id="quickEditMatchCount">0 matches</span>
                        <span id="quickEditScopeInfo"></span>
                    </div>
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
            
            <div class="quick-edit-footer">
                <button class="quick-edit-save-btn" onclick="saveQuickEditChanges()">Save All Changes</button>
                <button class="quick-edit-cancel-btn" onclick="closeQuickEditModal()">Cancel</button>
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
        const displayName = perCaseCustomNames.has(item.name) ? perCaseCustomNames.get(item.name) : 'default';
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
        
        // Handle blur for algorithm cells to update parity color
        if (cell.classList.contains('alg-cell')) {
            cell.addEventListener('blur', function() {
                updateAlgorithmCellParity(this);
            });
            
            // Initial parity update
            if (this.textContent.trim()) {
                updateAlgorithmCellParity(cell);
            }
        }
    });
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
    const scopeInfo = document.getElementById('quickEditScopeInfo');
    
    if (!quickEditState.lastFocusedCell) {
        showToast('Please select a cell first', 2000, 'info');
        return;
    }
    
    findReplace.style.display = 'block';
    quickEditState.findReplaceOpen = true;
    
    // Update scope info
    if (quickEditState.currentTab === 'general') {
        const scopeNames = {
            'name': 'Display Name',
            'subtitle': 'Subtitle',
            'notes': 'Notes'
        };
        scopeInfo.textContent = `Scope: ${scopeNames[quickEditState.findReplaceScope] || 'All'}`;
    } else {
        scopeInfo.textContent = 'Scope: All Algorithms';
    }
    
    findInput.focus();
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

function clearFindHighlights() {
    const modal = document.getElementById('quickEditModal');
    if (!modal) return;
    
    const cells = modal.querySelectorAll('.editable');
    cells.forEach(cell => {
        cell.style.background = '';
    });
}

function findNextQuickEdit() {
    const findInput = document.getElementById('quickEditFindInput');
    const searchTerm = findInput.value;
    
    if (!searchTerm) return;
    
    // Get all cells in scope
    const modal = document.getElementById('quickEditModal');
    let cells;
    
    if (quickEditState.currentTab === 'general') {
        const fieldMap = {
            'name': 'displayName',
            'subtitle': 'subtitle',
            'notes': 'notes'
        };
        const field = fieldMap[quickEditState.findReplaceScope];
        cells = Array.from(modal.querySelectorAll(`.editable[data-field="${field}"]`));
    } else {
        cells = Array.from(modal.querySelectorAll('.alg-cell'));
    }
    
    // Find matches
    quickEditState.findMatches = cells.filter(cell => 
        cell.textContent.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (quickEditState.findMatches.length === 0) {
        document.getElementById('quickEditMatchCount').textContent = '0 matches';
        return;
    }
    
    // Move to next match
    quickEditState.currentFindIndex = (quickEditState.currentFindIndex + 1) % quickEditState.findMatches.length;
    const currentMatch = quickEditState.findMatches[quickEditState.currentFindIndex];
    
    // Clear previous highlights
    clearFindHighlights();
    
    // Highlight current match
    currentMatch.style.background = '#fff3cd';
    currentMatch.focus();
    
    // Update match count
    document.getElementById('quickEditMatchCount').textContent = 
        `${quickEditState.currentFindIndex + 1} of ${quickEditState.findMatches.length} matches`;
    
    // Scroll into view
    currentMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    
    // Move to next match
    findNextQuickEdit();
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
        const fieldMap = {
            'name': 'displayName',
            'subtitle': 'subtitle',
            'notes': 'notes'
        };
        const field = fieldMap[quickEditState.findReplaceScope];
        cells = Array.from(modal.querySelectorAll(`.editable[data-field="${field}"]`));
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
    closeQuickEditFindReplace();
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
        if (displayName && displayName !== 'default') {
            perCaseCustomNames.set(caseName, displayName);
        } else {
            perCaseCustomNames.delete(caseName);
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
    
    // Recalculate parity
    calculateAndCacheAllParity();
    
    // Save state and re-render
    saveState();
    render();
    
    closeQuickEditModal();
    showToast('All changes saved successfully!', 2000, 'success');
}

function closeQuickEditModal() {
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
        lastFocusedCell: null
    };
}

// Make functions globally accessible
window.openQuickEditModal = openQuickEditModal;
window.closeQuickEditModal = closeQuickEditModal;
window.switchQuickEditTab = switchQuickEditTab;
window.findNextQuickEdit = findNextQuickEdit;
window.replaceQuickEdit = replaceQuickEdit;
window.replaceAllQuickEdit = replaceAllQuickEdit;
window.saveQuickEditChanges = saveQuickEditChanges;
window.openQuickEditFindReplace = openQuickEditFindReplace;
window.closeQuickEditFindReplace = closeQuickEditFindReplace;