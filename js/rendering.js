// Helper function to wrap algorithm tokens to prevent breaking inside parentheses
function wrapAlgorithmTokens(algo) {
    if (!algo || typeof algo !== 'string') return algo;
    
    // Replace (number,number) patterns with non-breaking spans
    // This regex captures patterns like (0,3), (-1,2), etc.
    return algo.replace(/(\([^)]+\))/g, '<span style="white-space: nowrap;">$1</span>');
}

/*
╔════════════════════════════════════════════════════════════════════════════╗
║                                NAME DISPLAY                                ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

// --- Naming Helper Functions ---

/**
 * Gets the display name for a single part (e.g., "Left Pawn")
 * based on user settings.
 */
function getDisplayPart(part, caseName = null) {
    let prefix = '';
    let base = part;

    if (part.startsWith('Left ')) {
        prefix = 'Left ';
        base = part.substring(5);
    } else if (part.startsWith('Right ')) {
        prefix = 'Right ';
        base = part.substring(6);
    }

    // Apply shape-level L/R swap if toggled for this base shape
    const shouldSwap = swapShapeLR.get(base) || false;
    if (shouldSwap && prefix) {
        if (prefix === 'Left ') prefix = 'Right ';
        else if (prefix === 'Right ') prefix = 'Left ';
    }

    // Apply short notation if enabled
    if (useShortLR && prefix) {
        if (prefix === 'Left ') prefix = 'L. ';
        else if (prefix === 'Right ') prefix = 'R. ';
    }

    // Get the user's chosen name for the base shape
    const baseSetting = caseNameSettings.get(base) || base; // Default to canonical
    let finalBaseName;

    if (baseSetting === 'Custom') {
        finalBaseName = customCaseNames.get(base) || base; // Fallback to base
    } else {
        finalBaseName = baseSetting;
    }

    // Apply position setting (front or back)
    if (lrPosition === 'back' && prefix) {
        return finalBaseName + ' ' + prefix.trim();
    }

    return prefix + finalBaseName;
}

/**
 * Gets the full display name for a case (e.g., "Muffin/Square")
 * based on user settings.
 */
function getDisplayName(originalName) {
    // Check for per-case custom name first
    if (perCaseCustomNames.has(originalName)) {
        return perCaseCustomNames.get(originalName);
    }
    
    const parts = originalName.split('/');
    if (parts.length === 2) {
        const [top, bottom] = parts;
        return `${getDisplayPart(top, originalName)}/${getDisplayPart(bottom, originalName)}`;
    }
    return originalName; // Fallback
}

/**
 * Gets all possible aliases for a single part for searching.
 * Includes L/R swapped versions.
 */
function getAliases(part) {
    let base = part;
    let prefixes = ['']; // Default for non-prefixed shapes

    if (part.startsWith('Left ')) {
        base = part.substring(5);
        prefixes = ['left ', 'right ']; // Search for both
    } else if (part.startsWith('Right ')) {
        base = part.substring(6);
        prefixes = ['left ', 'right ']; // Search for both
    }

    const config = shapeAliases[base];
    if (!config) return [part.toLowerCase()]; // Fallback

    const baseAliases = config.aliases;
    let results = [];

    for (const p of prefixes) {
        for (const alias of baseAliases) {
            results.push((p + alias).trim()); // .trim() for the '' prefix case
        }
    }
    return results;
}

// --- End New Naming Helper Functions ---

function getShortDisplayName(canonicalName) {
    // Get the full display name first (respects user settings)
    const fullName = getDisplayPart(canonicalName);
    
    // Apply short name rules
    let shortName = fullName;
    
    // Handle Left/Right prefixes
    if (shortName.startsWith('Left ')) {
        shortName = 'L. ' + shortName.substring(5);
    } else if (shortName.startsWith('Right ')) {
        shortName = 'R. ' + shortName.substring(6);
    }
    
    // Apply specific replacements (case-insensitive matching)
    const replacements = {
        'Paired Edges': 'Pair',
        'Pair': 'Pair', // In case user renamed it
        'Perpendicular Edges': 'L',
        'L-Shape': 'L',
        'Arrow': 'L',
        'Parallel Edges': 'Line',
        'Crown': 'Line',
        'Square': 'Sq',
        'Muffin': 'Muff',
        'Mushroom': 'Muff',
        'Barrel': 'Barr',
        'Scallop': 'Scal'
    };
    
    // Check each replacement
    for (const [pattern, replacement] of Object.entries(replacements)) {
        const regex = new RegExp(pattern, 'gi');
        shortName = shortName.replace(regex, replacement);
    }
    
    // Remove hyphens from numbers (e.g., 3-2-1 → 321, 4-4 → 44)
    shortName = shortName.replace(/(\d)-(\d)/g, '$1$2');
    
    return shortName;
}


/*
╔════════════════════════════════════════════════════════════════════════════╗
║                             ALGORITHM DISPLAY                              ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

function countSlashes(str, count) {
    if (count === 0) return 0;
    const parts = str.split('/');
    return parts.slice(0, count).join('/').length + 1;
}


function invertScramble(s) {
    if (!s) return s;
    let str = String(s).trim();

    // Split by / to get individual moves and turn notations
    const parts = str.split('/');

    // Reverse the order
    const reversed = parts.slice().reverse();

    // Invert each part
    const inverted = reversed.map(part => {
        part = part.trim();

        // Handle turn notation like (0,3) or (-1,1)
        const turnMatch = part.match(/\(([^)]+)\)/);
        if (turnMatch) {
            const values = turnMatch[1].split(',').map(v => v.trim());
            const invertedValues = values.map(v => {
                const num = parseInt(v);
                if (isNaN(num)) return v;
                return String(-num);
            });
            return '(' + invertedValues.join(',') + ')';
        }

        // Handle move notation like 3,0 or -2,0
        if (part.includes(',')) {
            const values = part.split(',').map(v => v.trim());
            const invertedValues = values.map(v => {
                const num = parseInt(v);
                if (isNaN(num)) return v;
                return String(-num);
            });
            return invertedValues.join(',');
        }

        return part;
    });

    return inverted.join('/');
}

function getShapePath(scramble) {
    if (!scramble || scramble.trim() === '' || scramble === 'Done!') {
        return null;
    }
    
    try {
        if (typeof window.Square1ShapePathTracerLibraryWithSillyNames !== 'undefined') {
            const shapePathString = window.Square1ShapePathTracerLibraryWithSillyNames.traceSolutionToSolutionShapePathPlease(scramble);
            if (shapePathString) {
                // Parse the shape path string "Sq/Sq → 4-2/4-2 → Sq/Sq" into array format
                const steps = shapePathString.split(' → ').map(s => s.trim());
                return steps.map(step => {
                    const [top, bottom] = step.split('/').map(s => s.trim());
                    return { top, bottom };
                });
            }
        }
    } catch (err) {
        console.error('Error generating shape path:', err);
    }
    
    return null;
}

function renderShapePath(path) {
    if (!path || path.length === 0) return '';
    
    const pathSteps = path.map((step, idx) => {
        const arrow = idx < path.length - 1 ? ' <span style="color: #007bff; font-weight: bold;">→</span> ' : '';
        return `<span style="background: #f0f9ff; padding: 2px 6px; border-radius: 3px; white-space: nowrap;">${step.top}/${step.bottom}</span>${arrow}`;
    }).join('');
    
    return `
        <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px; border-left: 3px solid #007bff;">
            <div style="font-size: 0.85rem; color: #666; margin-bottom: 5px; font-weight: 600;">Shape Path:</div>
            <div style="font-size: 0.9rem; line-height: 1.8; overflow-x: auto; white-space: nowrap;">
                ${pathSteps}
            </div>
        </div>
    `;
}

function renderAlgorithm(algoArray) {
    return algoArray.map(algo => `<div class="algo-line">${wrapAlgorithmTokens(algo)}</div>`).join('');
}

function renderAlgorithmWithPopup(algoArray, caseName, parityType) {
    return algoArray.map((algo, idx) => {
        const algoId = `alg-${caseName.replace(/[^a-zA-Z0-9]/g, '_')}-${parityType}-${idx}`;
        return `<div class="algo-line algo-interactive" 
                     id="${algoId}" 
                     data-algo="${algo.replace(/"/g, '&quot;')}" 
                     data-case="${caseName.replace(/"/g, '&quot;')}"
                     onmouseenter="showAlgoPopup(this, '${algo.replace(/'/g, "\\'")}', false)"
                     onmouseleave="hideAlgoPopup(this, false)"
                     onclick="event.stopPropagation(); showAlgoPopup(this, '${algo.replace(/'/g, "\\'")}', true)">${wrapAlgorithmTokens(algo)}</div>`;
    }).join('');
}

let activePopup = null;
let activePopupElement = null;
let popupHoverTimeout = null;

function showAlgoPopup(element, algo, isPermanent) {
    // Clear any pending hide timeout
    if (popupHoverTimeout) {
        clearTimeout(popupHoverTimeout);
        popupHoverTimeout = null;
    }
    
    // If clicking on already active popup element, close it
    if (isPermanent && activePopupElement === element) {
        hideAlgoPopup(element, true);
        return;
    }
    
    // Close any existing popup if opening a new permanent one
    if (isPermanent && activePopup) {
        activePopup.remove();
        activePopup = null;
        activePopupElement = null;
    }
    
    // Don't show hover popup if there's already a permanent popup
    if (!isPermanent && activePopup && activePopupElement !== element) {
        return;
    }
    
    // Remove any existing non-permanent popup
    if (!isPermanent) {
        const existingHover = document.querySelector('.algo-popup:not(.permanent)');
        if (existingHover) existingHover.remove();
    }
    
    if (algo === 'Done!' || !algo || algo.trim() === '') return;
    
    const setup = invertScramble(algo);
    const shapePath = getShapePath(algo);
    
    const popup = document.createElement('div');
    popup.className = 'algo-popup' + (isPermanent ? ' permanent' : '');
    popup.dataset.isPermanent = isPermanent;
    
    const setupId = 'popup-setup-' + Math.random().toString(36).substr(2, 9);
    
    popup.innerHTML = `
        <div style="font-size: 0.75rem; color: #666; margin-bottom: 4px; font-weight: 600;">Setup:</div>
        <div id="${setupId}" style="font-family: monospace; font-size: 0.8rem; margin-bottom: 8px; padding: 4px; background: #f8f9fa; border-radius: 3px; cursor: pointer;" title="Click to analyze parity">${setup}</div>
        ${shapePath ? `
            <div style="font-size: 0.75rem; color: #666; margin-bottom: 4px; font-weight: 600;">Shape Path:</div>
            <div style="font-size: 0.75rem; line-height: 1.6;">
                ${shapePath.map((step, idx) => {
                    const arrow = idx < shapePath.length - 1 ? ' → ' : '';
                    return `<span style="background: #f0f9ff; padding: 1px 4px; border-radius: 2px; white-space: nowrap;">${step.top}/${step.bottom}</span>${arrow}`;
                }).join('')}
            </div>
        ` : ''}
    `;
    
    document.body.appendChild(popup);
    
    // Add click handler to setup to open parity analysis
    const setupElement = document.getElementById(setupId);
    if (setupElement) {
        setupElement.onclick = (e) => {
            e.stopPropagation();
            hideAlgoPopup(element, isPermanent);
            openNewParityAnalysis(setup);
        };
        setupElement.onmouseenter = () => {
            setupElement.style.background = '#e3f2fd';
        };
        setupElement.onmouseleave = () => {
            setupElement.style.background = '#f8f9fa';
        };
    }
    
    // Position popup
    const rect = element.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    
    // Try to position below first
    let top = rect.bottom + 5;
    let left = rect.left;
    
    // If popup goes off bottom of screen, position above
    if (top + popupRect.height > window.innerHeight - 10) {
        top = rect.top - popupRect.height - 5;
    }
    
    // Adjust horizontal position if needed
    if (left + popupRect.width > window.innerWidth - 10) {
        left = window.innerWidth - popupRect.width - 10;
    }
    if (left < 10) left = 10;
    
    popup.style.top = top + 'px';
    popup.style.left = left + 'px';
    
    // Add scroll handler - immediate close for all popups
    const scrollHandler = () => {
        if (isPermanent) {
            hideAlgoPopup(element, true);
        } else {
            hideAlgoPopup(element, false);
        }
        window.removeEventListener('scroll', scrollHandler, true);
        if (clickHandler) document.removeEventListener('mousedown', clickHandler);
    };
    window.addEventListener('scroll', scrollHandler, true);
    
    let clickHandler = null;
    if (isPermanent) {
        activePopup = popup;
        activePopupElement = element;
        
        // Add click outside handler - immediate close
        setTimeout(() => {
            clickHandler = (e) => {
                if (!popup.contains(e.target) && e.target !== element) {
                    hideAlgoPopup(element, true);
                    document.removeEventListener('mousedown', clickHandler);
                    window.removeEventListener('scroll', scrollHandler, true);
                }
            };
            document.addEventListener('mousedown', clickHandler);
        }, 100);
    }
}

function hideAlgoPopup(element, isPermanent) {
    if (isPermanent) {
        if (activePopup) {
            activePopup.remove();
            activePopup = null;
            activePopupElement = null;
        }
    } else {
        // Immediately remove hover popup
        const hoverPopup = document.querySelector('.algo-popup:not(.permanent)');
        if (hoverPopup) {
            hoverPopup.remove();
        }
        if (popupHoverTimeout) {
            clearTimeout(popupHoverTimeout);
            popupHoverTimeout = null;
        }
    }
}

function showContextMenu(caseName, event) {
    event.stopPropagation();
    
    // Close any existing context menu
    const existingMenu = document.getElementById('caseContextMenu');
    if (existingMenu) existingMenu.remove();
    
    const isLearned = learnedCases.has(caseName);
    const isLearning = learningCases.has(caseName);
    const priorityLevel = plannedLevels.get(caseName) || 4;
    const priorityNames = ['Top', 'Most', 'More', 'Normal', 'Less', 'Least', 'Meh'];
    
    const menu = document.createElement('div');
    menu.id = 'caseContextMenu';
    menu.style.cssText = `
        position: fixed;
        background: white;
        border: 1px solid #ddd;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        padding: 4px 0;
        min-width: 180px;
        max-width: 200px;
    `;
    
    // Add status indicator at top
    const statusIndicator = document.createElement('div');
    statusIndicator.style.cssText = `
        padding: 6px 16px;
        font-size: 0.75rem;
        color: #666;
        border-bottom: 1px solid #e9ecef;
        margin-bottom: 4px;
        text-align: center;
        font-weight: 600;
    `;
    
    if (isLearned) {
        statusIndicator.textContent = 'Learned';
    } else if (isLearning) {
        statusIndicator.textContent = 'Learning';
    } else {
        statusIndicator.textContent = `Priority: ${priorityNames[priorityLevel - 1]}`;
    }
    menu.appendChild(statusIndicator);
    
    const menuItems = [];
    
    // Only show priority adjustment for planned cases
    if (!isLearned && !isLearning) {
        menuItems.push(
            {
                label: '↑ Move Up in Priority',
                action: () => {
                    adjustPriority(caseName, -1);
                    // Don't close menu
                    const newPriority = plannedLevels.get(caseName) || 4;
                    statusIndicator.textContent = `Priority: ${priorityNames[newPriority - 1]}`;
                },
                disabled: priorityLevel === 1
            },
            {
                label: '↓ Move Down in Priority',
                action: () => {
                    adjustPriority(caseName, 1);
                    // Don't close menu
                    const newPriority = plannedLevels.get(caseName) || 4;
                    statusIndicator.textContent = `Priority: ${priorityNames[newPriority - 1]}`;
                },
                disabled: priorityLevel === 7
            },
            { divider: true }
        );
    }
    
    menuItems.push(
        {
            label: 'Add Notes',
            action: () => {
                menu.remove();
                openNotesModal(caseName);
            }
        },
        {
            label: 'Train This Case',
            action: () => {
                menu.remove();
                openTrainingModal(caseName);
            }
        },
        {
            label: 'Edit Case',
            action: () => {
                menu.remove();
                openEditCaseModal(caseName);
            }
        },
        { divider: true },
        {
            label: 'Close',
            action: () => {
                menu.remove();
            }
        }
    );
    
    menuItems.forEach(item => {
        if (item.divider) {
            const divider = document.createElement('div');
            divider.style.cssText = 'height: 1px; background: #e9ecef; margin: 4px 0;';
            menu.appendChild(divider);
        } else {
            const option = document.createElement('div');
            option.textContent = item.label;
            option.style.cssText = `
                padding: 8px 16px;
                cursor: ${item.disabled ? 'not-allowed' : 'pointer'};
                font-size: 0.9rem;
                color: ${item.disabled ? '#999' : '#333'};
                opacity: ${item.disabled ? '0.5' : '1'};
            `;
            
            if (!item.disabled) {
                option.onmouseover = () => {
                    option.style.background = '#f5f5f5';
                };
                option.onmouseout = () => {
                    option.style.background = 'transparent';
                };
                option.onclick = item.action;
            }
            
            menu.appendChild(option);
        }
    });
    
    document.body.appendChild(menu);
    
    // Position the menu with proper boundary checking
    const rect = event.target.closest('.icon-btn').getBoundingClientRect();
    let top = rect.bottom + 5;
    let left = rect.right - 180; // Align to right edge of button, accounting for menu width
    
    // Wait for menu to be in DOM to get accurate dimensions
    setTimeout(() => {
        const menuRect = menu.getBoundingClientRect();
        
        // Check bottom boundary
        if (top + menuRect.height > window.innerHeight - 10) {
            top = rect.top - menuRect.height - 5;
        }
        
        // Check top boundary
        if (top < 10) {
            top = 10;
        }
        
        // Recalculate left with actual menu width
        left = rect.right - menuRect.width;
        
        // Check right boundary (shouldn't be needed with right-align, but just in case)
        if (left + menuRect.width > window.innerWidth - 10) {
            left = window.innerWidth - menuRect.width - 10;
        }
        
        // Check left boundary
        if (left < 10) {
            left = 10;
        }
        
        menu.style.top = top + 'px';
        menu.style.left = left + 'px';
    }, 0);
    
    // Close menu when clicking outside
    setTimeout(() => {
        const closeMenu = (e) => {
            if (!menu.contains(e.target) && e.target !== event.target) {
                menu.remove();
                document.removeEventListener('mousedown', closeMenu);
                window.removeEventListener('scroll', scrollCloseMenu, true);
            }
        };
        
        const scrollCloseMenu = () => {
            menu.remove();
            document.removeEventListener('mousedown', closeMenu);
            window.removeEventListener('scroll', scrollCloseMenu, true);
        };
        
        document.addEventListener('mousedown', closeMenu);
        window.addEventListener('scroll', scrollCloseMenu, true);
    }, 100);
}


/*
╔════════════════════════════════════════════════════════════════════════════╗
║                             LEARNING STATES                                ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

function updateProgress() {
    const totalCases = data.length;
    const learnedCount = learnedCases.size;

    const totalProbability = data.reduce((sum, item) => sum + item.probability, 0);
    const learnedProbability = data
        .filter(item => learnedCases.has(item.name))
        .reduce((sum, item) => sum + item.probability, 0);

    const p = Math.round((learnedProbability / totalProbability) * 100 * 2) / 2;
    const x = learnedCount;

    // Calculate consistency level using sigmoid function
    const exp = Math.exp;
    const numerator = 1 / (1 + exp(-12 * ((x - 1) / 89 - 0.4170435672))) - 1 / (1 + exp(-12 * (0 - 0.4170435672)));
    const denominator = 1 / (1 + exp(-12 * (1 - 0.4170435672))) - 1 / (1 + exp(-12 * (0 - 0.4170435672)));
    const c = 80 + 14 * (numerator / denominator);

    // Calculate safety
    const safety = p * c / 100 + 0.5 * (100 - p);
    
    // Update profile modal if open
    const profileModal = document.getElementById('profileModal');
    if (profileModal && profileModal.style.display === 'block') {
        if (typeof updateProfileStats === 'function') {
            updateProfileStats();
        }
    }
}

function toggleLearned(name, event = null) {
    // Close any open context menu
    const existingMenu = document.getElementById('caseContextMenu');
    if (existingMenu) existingMenu.remove();
    
    const isRightClick = event && event.button === 2;
    
    if (isRightClick) {
        event.preventDefault();
        // Right click: learned -> learning -> planned
        if (learnedCases.has(name)) {
            learnedCases.delete(name);
            learningCases.add(name);
            plannedCases.delete(name);
        } else if (learningCases.has(name)) {
            learningCases.delete(name);
            plannedCases.add(name);
            if (!plannedLevels.has(name)) plannedLevels.set(name, 4);
        } else {
            learnedCases.add(name);
            learningCases.delete(name);
            plannedCases.delete(name);
        }
    } else {
        // Left click: planned -> learning -> learned
        if (learnedCases.has(name)) {
            learnedCases.delete(name);
            learningCases.delete(name);
            plannedCases.add(name);
            if (!plannedLevels.has(name)) plannedLevels.set(name, 4);
        } else if (learningCases.has(name)) {
            learningCases.delete(name);
            learnedCases.add(name);
            plannedCases.delete(name);
        } else {
            learningCases.add(name);
            plannedCases.delete(name);
        }
    }
    saveState();
    updateProgress();
    
    // Re-render the specific card
    const cardElement = document.querySelector(`[data-case-name="${name}"]`);
    if (cardElement) {
        const item = data.find(d => d.name === name);
        if (item) {
            cardElement.outerHTML = renderCard(item);
        }
    }
    
    // Show reorder button if in priority mode
    if (currentSortMode === 'priority') {
        needsReorder = true;
        showReorderButton();
    }
}

function adjustPriority(name, delta) {
    // Ensure case is in planned state
    if (!plannedCases.has(name)) {
        plannedCases.add(name);
        learnedCases.delete(name);
        learningCases.delete(name);
    }
    
    const currentLevel = plannedLevels.get(name) || 4;
    let newLevel = currentLevel + delta;
    
    // Clamp between 1 (Top) and 7 (Meh)
    if (newLevel < 1) newLevel = 1;
    if (newLevel > 7) newLevel = 7;
    
    plannedLevels.set(name, newLevel);
    saveState();
    updateProgress();
    
    // Re-render the specific card
    const cardElement = document.querySelector(`[data-case-name="${name}"]`);
    if (cardElement) {
        const item = data.find(d => d.name === name);
        if (item) {
            cardElement.outerHTML = renderCard(item);
        }
    }
    
    // Show reorder button if in priority mode
    if (currentSortMode === 'priority') {
        needsReorder = true;
        showReorderButton();
    }
}

function togglePlanned(name, level = 1, event = null) {
    if (event && event.button === 2) { // Right click
        event.preventDefault();
        // Cycle behavior
        const currentLevel = plannedLevels.get(name) || 4;
        const nextLevel = currentLevel % 7 + 1;
        plannedLevels.set(name, nextLevel);
        saveState();
        
        // Show reorder button if in priority mode
        if (currentSortMode === 'priority') {
            needsReorder = true;
            showReorderButton();
        } else {
            render(true);
        }
    } else if (event && event.button === 0) { // Left click
        event.preventDefault();
        showPriorityMenu(name, event);
    }
}

function showPriorityMenu(name, event) {
    // Remove any existing menu
    const existingMenu = document.getElementById('priorityMenu');
    if (existingMenu) existingMenu.remove();
    
    const currentLevel = plannedLevels.get(name) || 4;
    const priorityNames = ['Top', 'Most', 'More', 'Normal', 'Less', 'Least', 'Meh'];
    
    const menu = document.createElement('div');
    menu.id = 'priorityMenu';
    menu.style.cssText = `
        position: fixed;
        background: white;
        border: 2px solid #007bff;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        padding: 8px;
        min-width: 120px;
    `;
    
    priorityNames.forEach((pName, idx) => {
        const level = idx + 1;
        const option = document.createElement('div');
        option.textContent = pName;
        option.style.cssText = `
            padding: 8px 12px;
            cursor: pointer;
            border-radius: 4px;
            font-weight: ${level === currentLevel ? '700' : '500'};
            background: ${level === currentLevel ? '#e3f2fd' : 'transparent'};
            color: ${level === currentLevel ? '#007bff' : '#333'};
        `;
        option.onmouseover = () => {
            if (level !== currentLevel) option.style.background = '#f5f5f5';
        };
        option.onmouseout = () => {
            if (level !== currentLevel) option.style.background = 'transparent';
        };
        option.onclick = () => {
            plannedLevels.set(name, level);
            saveState();
            
            // Re-render the specific card
            const cardElement = document.querySelector(`[data-case-name="${name}"]`);
            if (cardElement) {
                const item = data.find(d => d.name === name);
                if (item) {
                    cardElement.outerHTML = renderCard(item);
                }
            }
            
            // Show reorder button if in priority mode
            if (currentSortMode === 'priority') {
                needsReorder = true;
                showReorderButton();
            }
            menu.remove();
        };
        menu.appendChild(option);
    });
    
    document.body.appendChild(menu);
    
    // Position the menu
    const rect = event.target.closest('.icon-btn').getBoundingClientRect();
    let top = rect.bottom + 5;
    let left = rect.left;
    
    // Adjust if menu goes off screen
    setTimeout(() => {
        const menuRect = menu.getBoundingClientRect();
        if (menuRect.bottom > window.innerHeight) {
            top = rect.top - menuRect.height - 5;
        }
        if (menuRect.right > window.innerWidth) {
            left = window.innerWidth - menuRect.width - 10;
        }
        if (left < 10) left = 10;
        if (top < 10) top = 10;
        
        menu.style.top = top + 'px';
        menu.style.left = left + 'px';
    }, 0);
    
    // Close menu when clicking outside (after a small delay to prevent immediate closure)
    setTimeout(() => {
        const closeMenu = (e) => {
            if (!menu.contains(e.target) && e.target !== event.target) {
                menu.remove();
                document.removeEventListener('mousedown', closeMenu);
            }
        };
        document.addEventListener('mousedown', closeMenu);
    }, 100);
}

/*
╔════════════════════════════════════════════════════════════════════════════╗
║                              CARD RENDERING                                ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

function renderCard(item) {
    const prob = (item.probability / 3678 * 100).toFixed(3);
    const isLearned = learnedCases.has(item.name);
    const isLearning = learningCases.has(item.name);
    const isPlanned = plannedCases.has(item.name);
    const plannedLevel = plannedLevels.get(item.name) || 4;
    
    let cardClass = '';
    if (isLearned) {
        cardClass = 'learned';
    } else if (isLearning) {
        cardClass = 'learning';
    } else {
        cardClass = `planned priority-${plannedLevel}`;
    }
    
    const comment = comments.get(item.name) || '';
    
    // Use cached parity calculations
    const cachedAlgs = cachedParityAlgorithms.get(item.name);
    const oddAlgos = cachedAlgs ? cachedAlgs.odd : [];
    const evenAlgos = cachedAlgs ? cachedAlgs.even : [];
    
    // Fetch SVGs dynamically from svgData using string keys
    const topSVG = window.svgData[item.top] || '';
    const bottomSVG = window.svgData[item.bottom] || '';
    
    const oddAlgoDisplay = oddAlgos.length > 0 ? renderAlgorithmWithPopup(oddAlgos, item.name, 'odd') : '<div class="algo-line" style="color: #999; font-style: italic;">No algorithms available</div>';
    const evenAlgoDisplay = evenAlgos.length > 0 ? renderAlgorithmWithPopup(evenAlgos, item.name, 'even') : '<div class="algo-line" style="color: #999; font-style: italic;">No algorithms available</div>';
    
    const learnedIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="${isLearned ? '#28a745' : (isLearning ? '#ffc107' : '#ccc')}" stroke-width="2">
        <path d="M20 6L9 17l-5-5"/>
    </svg>`;
    
    const threeDotsIcon = `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;">
        <circle cx="12" cy="5" r="2"/>
        <circle cx="12" cy="12" r="2"/>
        <circle cx="12" cy="19" r="2"/>
    </svg>`;
    
    const displayName = getDisplayName(item.name);

    return `
        <div class="card ${cardClass}" data-case-name="${item.name}">
            <div class="card-header">
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <div class="card-title">
                        ${displayName}
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0;">
                        <div class="probability">${prob}%</div>
                        <div class="card-header-actions">
                            <div class="icon-btn" onmousedown="event.stopPropagation(); toggleLearned('${item.name.replace(/'/g, "\\'")}', event)" oncontextmenu="event.preventDefault();">
                                ${learnedIcon}
                            </div>
                            <div class="icon-btn" onclick="event.stopPropagation(); showContextMenu('${item.name.replace(/'/g, "\\'")}', event)" style="color: #666;">
                                ${threeDotsIcon}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-images card-svg-container">
                <div style="width: 50%; height: auto;">${topSVG}</div>
                <div style="width: 50%; height: auto;">${bottomSVG}</div>
            </div>
            <div class="card-body">
                <div class="algo-section">
                    <span class="algo-label">Odd:</span>
                    ${oddAlgoDisplay}
                </div>
                <div class="algo-section">
                    <span class="algo-label">Even:</span>
                    ${evenAlgoDisplay}
                </div>
                ${comment ? `<div style="font-size: 0.65rem; color: #666; margin-top: 8px; font-style: italic;">${comment}</div>` : ''}
            </div>
        </div>
    `;
}

function render(softRender = false) {
    if (!softRender) {
        // Hard render: recalculate parity if needed
        if (needsParityRecalculation()) {
            calculateAndCacheAllParity();
        }
    }
    
    grid.innerHTML = filteredData.map(renderCard).join('');
}

function showReorderButton() {
    // Remove existing button if any
    let reorderBtn = document.getElementById('reorderButton');
    if (reorderBtn) return; // Already showing
    
    reorderBtn = document.createElement('button');
    reorderBtn.id = 'reorderButton';
    reorderBtn.textContent = 'Re-order Cases';
    reorderBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.95rem;
        box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        z-index: 1000;
        transition: all 0.2s;
    `;
    
    reorderBtn.onmouseover = () => {
        reorderBtn.style.transform = 'translateY(-2px)';
        reorderBtn.style.boxShadow = '0 6px 16px rgba(0, 123, 255, 0.4)';
        reorderBtn.style.background = '#0056b3';
    };
    
    reorderBtn.onmouseout = () => {
        reorderBtn.style.transform = 'translateY(0)';
        reorderBtn.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)';
        reorderBtn.style.background = '#007bff';
    };
    
    reorderBtn.onclick = () => {
        filterAndSort(true);
        hideReorderButton();
        needsReorder = false;
    };
    
    document.body.appendChild(reorderBtn);
}

function hideReorderButton() {
    const reorderBtn = document.getElementById('reorderButton');
    if (reorderBtn) {
        reorderBtn.remove();
    }
}

