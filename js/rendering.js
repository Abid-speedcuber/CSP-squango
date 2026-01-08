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
        let inversed = invertScramble(scramble);
        
        // Handle algorithms that start with / (which end with / before inversion)
        // Treat starting / as (0,0)/ but we'll skip adding the initial state twice
        const startsWithSlash = inversed.trim().startsWith('/');
        if (startsWithSlash) {
            inversed = '(0,0)' + inversed;
        }
        
        const moves = inversed.split('/').filter(m => m.trim() !== '');
        const path = [];
        
        // Get initial state (solved square) - only add if doesn't start with slash
        if (!startsWithSlash) {
            let currentState = solved();
            const initialTop = buildUnits(currentState, 0);
            const initialBot = buildUnits(currentState, 12);
            const initialTopCanonical = findCanonicalPattern(initialTop.types);
            const initialBotCanonical = findCanonicalPattern(initialBot.types);
            
            path.push({
                top: getShortDisplayName(initialTopCanonical.name),
                bottom: getShortDisplayName(initialBotCanonical.name)
            });
        }
        
        // Apply each move and track shape changes
        let moveStr = '';
        for (let i = 0; i < moves.length; i++) {
            moveStr += (moveStr ? '/' : '') + moves[i];
            let currentState = applyScramble(moveStr);
            
            const topRaw = buildUnits(currentState, 0);
            const botRaw = buildUnits(currentState, 12);
            const topCanonical = findCanonicalPattern(topRaw.types);
            const botCanonical = findCanonicalPattern(botRaw.types);
            
            path.push({
                top: getShortDisplayName(topCanonical.name),
                bottom: getShortDisplayName(botCanonical.name)
            });
        }
        
        // Reverse the path since we inverted the scramble
        return path.reverse();
    } catch (err) {
        console.error('Error generating shape path:', err);
        return null;
    }
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

function renderAlgorithm(algoArray, parArray) {
    return algoArray.map((algo, idx) => {
        const parCount = parArray[idx];
        if (parCount > 0) {
            const highlightEnd = countSlashes(algo, parCount);
            return `<div class="algo-line"><mark>${algo.substring(0, highlightEnd)}</mark>${algo.substring(highlightEnd)}</div>`;
        }
        return `<div class="algo-line">${algo}</div>`;
    }).join('');
}


/*
╔════════════════════════════════════════════════════════════════════════════╗
║                             LEARNING STATES                                ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

function updateProgress() {
    const totalCases = data.length;
    const learnedCount = learnedCases.size;

    progressText.textContent = `${learnedCount} / ${totalCases}`;

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

    document.getElementById('known-parity-text').textContent = p.toFixed(1) + '%';
    safetyText.textContent = (Math.round(safety * 2) / 2).toFixed(1) + '%';
    
    // Update mobile stats
    const mobileProgress = document.getElementById('progress-text-mobile');
    const mobileKnown = document.getElementById('known-parity-text-mobile');
    const mobileSafety = document.getElementById('safety-text-mobile');
    
    if (mobileProgress) mobileProgress.textContent = `${learnedCount}/${totalCases}`;
    if (mobileKnown) mobileKnown.textContent = p.toFixed(1) + '%';
    if (mobileSafety) mobileSafety.textContent = (Math.round(safety * 2) / 2).toFixed(1) + '%';
}

function toggleLearned(name, event = null) {
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
    render();
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
    render();
}

function togglePlanned(name, level = 1, event = null) {
    if (event && event.button === 2) { // Right click
        event.preventDefault();
        // Cycle behavior
        const currentLevel = plannedLevels.get(name) || 4;
        const nextLevel = currentLevel % 7 + 1;
        plannedLevels.set(name, nextLevel);
        saveState();
        render();
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
            render();
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
        // All unlearned/unlearning cases are planned
        cardClass = `planned priority-${plannedLevel}`;
    }
    
    const isSwapped = swappedCases.get(item.name) || false;
    const comment = comments.get(item.name) || '';
    
    // Determine parity labels dynamically if enabled
    let oddLabel = 'Odd:';
    let evenLabel = 'Even:';
    
    if (useDynamicParity) {
        const oddAlgos = isSwapped ? item.even : item.odd;
        const evenAlgos = isSwapped ? item.odd : item.even;
        
        try {
            if (oddAlgos[0] && oddAlgos[0] !== 'Done!' && typeof window.Square1ParityAnalyzerLibraryWithSillyNames !== 'undefined') {
                const oddSetup = invertScramble(oddAlgos[0]);
                const parityText = window.Square1ParityAnalyzerLibraryWithSillyNames.getParityTextFromScramblePlease(oddSetup, {
                    topColor: colorScheme.topColor,
                    bottomColor: colorScheme.bottomColor,
                    frontColor: colorScheme.frontColor,
                    rightColor: colorScheme.rightColor,
                    backColor: colorScheme.backColor,
                    leftColor: colorScheme.leftColor
                });
                oddLabel = parityText + ':';
            }
        } catch (error) {
            console.error('Dynamic parity error (odd):', error);
        }
        
        try {
            if (evenAlgos[0] && evenAlgos[0] !== 'Done!' && typeof window.Square1ParityAnalyzerLibraryWithSillyNames !== 'undefined') {
                const evenSetup = invertScramble(evenAlgos[0]);
                const parityText = window.Square1ParityAnalyzerLibraryWithSillyNames.getParityTextFromScramblePlease(evenSetup, {
                    topColor: colorScheme.topColor,
                    bottomColor: colorScheme.bottomColor,
                    frontColor: colorScheme.frontColor,
                    rightColor: colorScheme.rightColor,
                    backColor: colorScheme.backColor,
                    leftColor: colorScheme.leftColor
                });
                evenLabel = parityText + ':';
            }
        } catch (error) {
            console.error('Dynamic parity error (even):', error);
        }
    }
    
    const learnedIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="${isLearned ? '#28a745' : (isLearning ? '#ffc107' : '#ccc')}" stroke-width="2">
        <path d="M20 6L9 17l-5-5"/>
    </svg>`;
    
    const priorityNames = ['Top', 'Most', 'More', 'Normal', 'Less', 'Least', 'Meh'];
    const priorityText = isPlanned ? priorityNames[plannedLevel - 1] : 'Set';
    const priorityColor = isPlanned ? '#007bff' : '#999';
    
    const priorityControls = enablePriorityLearning ? `
        <div style="display: flex; align-items: center; gap: 2px;">
            <span style="font-size: 0.75rem; font-weight: 600; color: ${priorityColor}; min-width: 42px; text-align: center;">${priorityText}</span>
            <div style="display: flex; flex-direction: column; gap: 1px;">
                <button onclick="event.stopPropagation(); adjustPriority('${item.name.replace(/'/g, "\\'")}', -1)" style="width: 16px; height: 12px; padding: 0; border: 1px solid #ccc; background: white; cursor: pointer; border-radius: 2px; display: flex; align-items: center; justify-content: center; font-size: 10px; line-height: 1;">▲</button>
                <button onclick="event.stopPropagation(); adjustPriority('${item.name.replace(/'/g, "\\'")}', 1)" style="width: 16px; height: 12px; padding: 0; border: 1px solid #ccc; background: white; cursor: pointer; border-radius: 2px; display: flex; align-items: center; justify-content: center; font-size: 10px; line-height: 1;">▼</button>
            </div>
        </div>
    ` : '';
    
    const oddAlgos = isSwapped ? item.even : item.odd;
    const oddPars = isSwapped ? item.evenPar : item.oddPar;
    const evenAlgos = isSwapped ? item.odd : item.even;
    const evenPars = isSwapped ? item.oddPar : item.evenPar;
    
const displayName = getDisplayName(item.name); // Get customized name

    return `
        <div class="card ${cardClass}">
            <div class="card-header">
                <div class="card-title" onclick="openModal('${item.name.replace(/'/g, "\\'")}')">
                    ${displayName}
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="probability">${prob}%</div>
                    <div class="card-header-actions">
                        <div class="icon-btn" onmousedown="event.stopPropagation(); toggleLearned('${item.name.replace(/'/g, "\\'")}', event)" oncontextmenu="event.preventDefault();">
                            ${learnedIcon}
                        </div>
                        ${priorityControls}
                    </div>
                </div>
            </div>
<div class="card-images card-svg-container">
    <div style="width: 50%; height: auto;">${item.top}</div>
    <div style="width: 50%; height: auto;">${item.bottom}</div>
</div>
            <div class="card-body">
                <div class="algo-section">
                    <span class="algo-label">${oddLabel}</span>
                    ${renderAlgorithm(oddAlgos, oddPars)}
                </div>
                <div class="algo-section">
                    <span class="algo-label">${evenLabel}</span>
                    ${renderAlgorithm(evenAlgos, evenPars)}
                </div>
                ${comment ? `<div style="font-size: 0.65rem; color: #666; margin-top: 8px; font-style: italic;">${comment}</div>` : ''}
            </div>
        </div>
    `;
}

function render() {
    grid.innerHTML = filteredData.map(renderCard).join('');
}

