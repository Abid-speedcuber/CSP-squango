/* ==== FILE: js/rendering.js ==== */
/* exported render */

﻿// Helper function to sanitize note HTML (allow various text formatting tags)
function sanitizeNoteHTML(html) {
    if (!html) return '';

    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Function to recursively process nodes
    function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();

            if (tagName === 'b' || tagName === 'strong') {
                return `<b>${Array.from(node.childNodes).map(processNode).join('')}</b>`;
            }

            if (tagName === 'u') {
                return `<u>${Array.from(node.childNodes).map(processNode).join('')}</u>`;
            }

            if (tagName === 'i' || tagName === 'em') {
                return `<i>${Array.from(node.childNodes).map(processNode).join('')}</i>`;
            }

            if (tagName === 's' || tagName === 'strike' || tagName === 'del') {
                return `<s>${Array.from(node.childNodes).map(processNode).join('')}</s>`;
            }

            if (tagName === 'sub') {
                return `<sub>${Array.from(node.childNodes).map(processNode).join('')}</sub>`;
            }

            if (tagName === 'sup') {
                return `<sup>${Array.from(node.childNodes).map(processNode).join('')}</sup>`;
            }

            if (tagName === 'big') {
                return `<big>${Array.from(node.childNodes).map(processNode).join('')}</big>`;
            }

            if (tagName === 'small') {
                return `<small>${Array.from(node.childNodes).map(processNode).join('')}</small>`;
            }

            if (tagName === 'font') {
                const color = node.getAttribute('color') || '';
                // Sanitize color to prevent malicious values
                const safeColor = color.match(/^(#[0-9A-Fa-f]{3,6}|[a-zA-Z]+)$/) ? color : '';
                if (safeColor) {
                    return `<font color="${safeColor}">${Array.from(node.childNodes).map(processNode).join('')}</font>`;
                }
                return Array.from(node.childNodes).map(processNode).join('');
            }

            if (tagName === 'span') {
                const style = node.getAttribute('style') || '';
                // Only allow color in style
                const colorMatch = style.match(/color:\s*([#a-zA-Z0-9]+)/);
                if (colorMatch) {
                    const safeColor = colorMatch[1].match(/^(#[0-9A-Fa-f]{3,6}|[a-zA-Z]+)$/) ? colorMatch[1] : '';
                    if (safeColor) {
                        return `<span style="color: ${safeColor}">${Array.from(node.childNodes).map(processNode).join('')}</span>`;
                    }
                }
                return Array.from(node.childNodes).map(processNode).join('');
            }

            if (tagName === 'a') {
                const href = node.getAttribute('href') || '';
                // Sanitize href to prevent javascript: URLs
                const safeHref = href.startsWith('javascript:') ? '' : href;
                return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${Array.from(node.childNodes).map(processNode).join('')}</a>`;
            }

            if (tagName === 'br') {
                return '<br>';
            }

            // For any other tags, just return the text content
            return Array.from(node.childNodes).map(processNode).join('');
        }

        return '';
    }

    return Array.from(temp.childNodes).map(processNode).join('');
}

// Helper function to strip parenthesis if hideParenthesis is enabled
function stripParenthesisIfNeeded(alg) {
    if (!alg || typeof alg !== 'string') return alg;
    if (hideParenthesis) {
        return alg.replace(/\(/g, ' ').replace(/\)/g, ' ');
    }
    return alg;
}

// Helper function to wrap algorithm tokens to prevent breaking inside parentheses
function wrapAlgorithmTokens(alg) {
    if (!alg || typeof alg !== 'string') return alg;

    // Strip parenthesis first if needed
    alg = stripParenthesisIfNeeded(alg);

    // If parenthesis are hidden, wrap the number,number patterns
    if (hideParenthesis) {
        return alg.replace(/([-]?\d+,[-]?\d+)/g, '<span style="white-space: nowrap;">$1</span>');
    }

    // Replace (number,number) patterns with non-breaking spans
    // This regex captures patterns like (0,3), (-1,2), etc.
    return alg.replace(/(\([^)]+\))/g, '<span style="white-space: nowrap;">$1</span>');
}

// Helper function to style algorithm with gray setup/finish moves
function styleAlgorithmWithGrayMoves(alg) {
    if (!alg || typeof alg !== 'string' || alg === 'Done!') return alg;

    const parts = alg.split('/');

    // If only one part or empty, return as is
    if (parts.length <= 1) {
        return wrapAlgorithmTokens(alg);
    }

    // Check if starts with slash (first part empty)
    const startsWithSlash = parts[0].trim() === '';
    // Check if ends with slash (last part empty)
    const endsWithSlash = parts[parts.length - 1].trim() === '';

    let styledParts = parts.map((part, idx) => {
        // Skip styling for empty parts (from leading/trailing slashes)
        if (part.trim() === '') return part;

        // First non-empty part (setup) - blue
        if (idx === 0 && !startsWithSlash) {
            return `<span style="color: var(--alg-setup-color);">${wrapAlgorithmTokens(part)}</span>`;
        }
        // Last non-empty part (finish) - light gray
        else if (idx === parts.length - 1 && !endsWithSlash) {
            return `<span style="color: var(--text-muted);">${wrapAlgorithmTokens(part)}</span>`;
        }
        // Middle parts - normal color
        else {
            return wrapAlgorithmTokens(part);
        }
    });

    return styledParts.join('/');
}

/*
╔═══════════════════════════════════════════════════════════════════════════╗
║                                NAME DISPLAY                                ║
╚═══════════════════════════════════════════════════════════════════════════╝
*/

/**
 * Gets the display name for a case.
 * Single source of truth - displayNames object.
 */
function getDisplayName(caseName) {
    return displayNames[caseName] || caseName;
}

/*
╔════════════════════════════════════════════════════════════════════════════╗
║                             ALGORITHM DISPLAY                              ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

// invertScramble → defined in utils.js

function getAlgDisplayMeta(alg, caseName) {
    if (!alg || alg === 'Done!' || typeof window.algToShapeIndex === 'undefined') {
        return { invalid: false, mirrored: false };
    }
    try {
        const canonicalIdx = window.CSPData.getCanonicalShapeIndex(caseName);
        if (canonicalIdx === null) return { invalid: false, mirrored: false };
        const caseShapeData = window.CSPData.getShapeEntry(caseName);

        const result = window.algToShapeIndex(alg);
        const idx = result.shapeIndex;

        const isDirectMatch = idx === canonicalIdx;
        const isInOrg = caseShapeData && caseShapeData.org && caseShapeData.org.includes(idx);
        const isInMir = caseShapeData && caseShapeData.mir && caseShapeData.mir.includes(idx);

        if (isDirectMatch || isInOrg) return { invalid: false, mirrored: false };
        if (isInMir) return { invalid: false, mirrored: true };
        return { invalid: true, mirrored: false };
    } catch {
        return { invalid: true, mirrored: false };
    }
}

function getShapePath(scramble) {
    if (!scramble || scramble.trim() === '' || scramble === 'Done!') {
        return null;
    }

    try {
        const shapePathTracer = window.Square1ShapePathTracer || window.Square1ShapePathTracerLibraryWithSillyNames;
        if (shapePathTracer) {
            const shapePathString = shapePathTracer.traceSolutionToSolutionShapePath(scramble);
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

function renderAlgorithmWithPopup(algArray, caseName, parityType, fontFamily) {
    const fontStyle = fontFamily ? `font-family: ${fontFamily};` : '';
    return algArray.map((alg, idx) => {
        const algId = `alg-${caseName.replace(/[^a-zA-Z0-9]/g, '_')}-${parityType}-${idx}`;
        const meta = getAlgDisplayMeta(alg, caseName);
        const prefix = meta.mirrored ? '<span style="color: var(--z2-prefix-color); margin-right:4px; display:inline; vertical-align:baseline; white-space:nowrap;"><big style="font-size:1em;">&lt;</big><small>z2</small><big style="font-size:1em;">&gt;</big></span>' : '';
        const colorStyle = meta.invalid ? 'color: var(--alg-invalid-color);' : '';
        const wrapStyle = meta.invalid
            ? 'display: flex; align-items: baseline; flex-wrap: wrap; opacity: 0.18;'
            : 'display: flex; align-items: baseline; flex-wrap: wrap;';
        return `<div class="alg-line alg-interactive"
                     id="${algId}"
                     data-alg="${alg.replace(/"/g, '&quot;')}"
                     data-case="${caseName.replace(/"/g, '&quot;')}"
                     data-parity="${parityType}"
                     onmouseenter="showAlgPopup(this, '${alg.replace(/'/g, "\\'")}', false)"
                     onmouseleave="hideAlgPopup(false)"
                     onclick="event.stopPropagation(); showAlgPopup(this, '${alg.replace(/'/g, "\\'")}', true)"
                     style="${wrapStyle} ${colorStyle} ${fontStyle}">${prefix}${styleAlgorithmWithGrayMoves(alg)}</div>`;
    }).join('');
}

let activePopup = null;
let activePopupElement = null;
let popupHoverTimeout = null;

window.showAlgPopup = function(element, alg, isPermanent) {
    // Clear any pending hide timeout
    if (popupHoverTimeout) {
        clearTimeout(popupHoverTimeout);
        popupHoverTimeout = null;
    }

    // If clicking on already active popup element, close it
    if (isPermanent && activePopupElement === element) {
        window.hideAlgPopup(true);
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
        const existingHover = document.querySelector('.alg-popup:not(.permanent)');
        if (existingHover) existingHover.remove();
    }

    if (alg === 'Done!' || !alg || alg.trim() === '') return;

    const setup = invertScramble(alg);
    const shapePath = getShapePath(alg);

    const popup = document.createElement('div');
    popup.className = 'alg-popup' + (isPermanent ? ' permanent' : '');
    popup.dataset.isPermanent = isPermanent;

    const setupId = 'popup-setup-' + Math.random().toString(36).substr(2, 9);

    const popupFontFamily = hideParenthesis ? 'Arial, sans-serif' : 'monospace';
    const displaySetup = stripParenthesisIfNeeded(setup);
    popup.innerHTML = `
        <div class="popup-label">Setup:</div>
        <div id="${setupId}" class="popup-setup" style="font-family: ${popupFontFamily}; font-size: 0.8rem; margin-bottom: 8px;" title="Click to analyze parity">${displaySetup}</div>
        ${shapePath ? `
            <div class="popup-label">Shape Path:</div>
            <div id="${setupId}_shapepath" style="font-size: 0.75rem; line-height: 1.6; cursor: pointer; padding: 4px; border-radius: 3px; transition: background 0.15s;" title="Click to animate algorithm">
                ${shapePath.map((step, idx) => {
        const arrow = idx < shapePath.length - 1 ? ' → ' : '';
        return `<span class="popup-step-span">${step.top}/${step.bottom}</span>${arrow}`;
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
            window.hideAlgPopup(isPermanent);
            openNewParityAnalysis(setup);
        };
        setupElement.onmouseenter = () => {
            setupElement.style.background = 'var(--hover-bg)';
        };
        setupElement.onmouseleave = () => {
            setupElement.style.background = 'var(--surface2)';
        };
    }

    // Add click handler to shape path to open animate modal
    const shapePathElement = document.getElementById(setupId + '_shapepath');
    if (shapePathElement) {
        shapePathElement.onclick = (e) => {
            e.stopPropagation();
            window.hideAlgPopup(isPermanent);

            // Get case name and parity from the element
            const caseName = element.getAttribute('data-case') || '';
            const parityType = element.getAttribute('data-parity') || '';
            const displayName = getDisplayName(caseName);

            openAnimateAlgModal(alg, displayName, parityType);
        };
        shapePathElement.onmouseenter = () => {
            shapePathElement.style.background = 'var(--hover-bg)';
        };
        shapePathElement.onmouseleave = () => {
            shapePathElement.style.background = 'transparent';
        };
    }

    // Position popup
    const rect = element.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();

    // Calculate safe positions that won't cover the algorithm
    let top = rect.bottom + 10; // Position below with more gap
    let left = rect.left;

    // If popup would cover the element or go off bottom, position above
    if (top < rect.top + rect.height + 5 || top + popupRect.height > window.innerHeight - 10) {
        top = rect.top - popupRect.height - 10; // Position above with more gap
    }

    // If still would cover (element is too tall), try positioning to the right
    if (top < rect.bottom && top + popupRect.height > rect.top) {
        top = rect.top;
        left = rect.right + 10; // Position to the right

        // If goes off right side, try left side
        if (left + popupRect.width > window.innerWidth - 10) {
            left = rect.left - popupRect.width - 10; // Position to the left
        }
    }

    // Final boundary checks
    if (left + popupRect.width > window.innerWidth - 10) {
        left = window.innerWidth - popupRect.width - 10;
    }
    if (left < 10) left = 10;
    if (top < 10) top = 10;

    // Ensure popup doesn't overlap with the element vertically when positioned above/below
    if (left === rect.left || left === window.innerWidth - popupRect.width - 10) {
        // We're positioned above or below, ensure no overlap
        if (top > rect.top && top < rect.bottom) {
            // Overlapping, force it above
            top = rect.top - popupRect.height - 10;
            if (top < 10) {
                // Can't fit above, position below
                top = rect.bottom + 10;
            }
        }
    }

    popup.style.top = top + 'px';
    popup.style.left = left + 'px';

    // Add scroll handler - immediate close for all popups
    const scrollHandler = () => {
        window.hideAlgPopup(isPermanent);
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
                    window.hideAlgPopup(true);
                    document.removeEventListener('mousedown', clickHandler);
                    window.removeEventListener('scroll', scrollHandler, true);
                }
            };
            document.addEventListener('mousedown', clickHandler);
        }, 100);
    } else {
        // For hover popups, hide when mouse leaves the popup or element
        popup.onmouseleave = () => {
            popupHoverTimeout = setTimeout(() => {
                window.hideAlgPopup(false);
                popupHoverTimeout = null;
            }, 100);
        };
        
        popup.onmouseenter = () => {
            if (popupHoverTimeout) {
                clearTimeout(popupHoverTimeout);
                popupHoverTimeout = null;
            }
        };
        
        // Also add handlers to the element to keep popup alive
        if (element && !element._popupHandlersSet) {
            element._popupHandlersSet = true;
            element.addEventListener('mouseleave', () => {
                popupHoverTimeout = setTimeout(() => {
                    window.hideAlgPopup(false);
                    popupHoverTimeout = null;
                }, 100);
            });
            element.addEventListener('mouseenter', () => {
                if (popupHoverTimeout) {
                    clearTimeout(popupHoverTimeout);
                    popupHoverTimeout = null;
                }
            });
        }
    }
}

window.hideAlgPopup = function(isPermanent) {
    if (isPermanent) {
        if (activePopup) {
            activePopup.remove();
            activePopup = null;
            activePopupElement = null;
        }
    } else {
        // Immediately remove hover popup
        const hoverPopup = document.querySelector('.alg-popup:not(.permanent)');
        if (hoverPopup) {
            hoverPopup.remove();
        }
        if (popupHoverTimeout) {
            clearTimeout(popupHoverTimeout);
            popupHoverTimeout = null;
        }
    }
}

window.showContextMenu = function(caseName, event) {
    event.stopPropagation();

    // Close any existing context menu
    const existingMenu = document.getElementById('caseContextMenu');
    if (existingMenu) existingMenu.remove();

    const isLearned = learnedCases.has(caseName);
    const isLearning = learningCases.has(caseName);
    const priorityLevel = plannedLevels.get(caseName) || 4;
    const priorityNames = ['Highest', 'Higher', 'High', 'Normal', 'Low', 'Lower', 'Lowest'];

    const menu = document.createElement('div');
    menu.id = 'caseContextMenu';
    menu.style.cssText = `
        position: fixed;
        background: var(--surface);
        border-bottom: 1px solid var(--surface-border);
        border-radius: 6px;
        box-shadow: 0 4px 12px var(--card-shadow);
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
        color: var(--text-secondary);
        border-bottom: 1px solid var(--surface-border);
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
                label: 'Move Up in Priority',
                action: () => {
                    adjustPriority(caseName, -1);
                    // Don't close menu
                    const newPriority = plannedLevels.get(caseName) || 4;
                    statusIndicator.textContent = `Priority: ${priorityNames[newPriority - 1]}`;
                },
                disabled: priorityLevel === 1
            },
            {
                label: 'Move Down in Priority',
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
            label: 'Add/Edit Notes',
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
        }
    );

    menuItems.push(
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
            divider.style.cssText = 'height: 1px; background: var(--surface-border); margin: 4px 0;';
            menu.appendChild(divider);
        } else {
            const option = document.createElement('div');
            option.textContent = item.label;
            option.style.cssText = `
                padding: 8px 16px;
                cursor: ${item.disabled ? 'not-allowed' : 'pointer'};
                font-size: 0.9rem;
                color: ${item.disabled ? 'var(--text-muted)' : 'var(--text-ui)'}
                opacity: ${item.disabled ? '0.5' : '1'};
            `;

            if (!item.disabled) {
                option.onmouseover = () => {
                    option.style.background = 'var(--sidebar-item-hover)';
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

window.toggleLearned = function(name, event = null) {
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
    updateProfileStats();

    // Re-render the specific card
    const cardElement = document.querySelector(`[data-case-name="${name}"]`);
    if (cardElement) {
        const item = window.CSPData.getCase(name);
        if (item) {
            cardElement.outerHTML = renderCard(item);
        }
    }

    // Show reorder button if in priority mode
    if (currentSortMode === 'priority') {
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
    updateProfileStats();

    // Re-render the specific card
    const cardElement = document.querySelector(`[data-case-name="${name}"]`);
    if (cardElement) {
        const item = window.CSPData.getCase(name);
        if (item) {
            cardElement.outerHTML = renderCard(item);
        }
    }

    // Show reorder button if in priority mode
    if (currentSortMode === 'priority') {
        showReorderButton();
    }
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
    const oddAlgs = cachedAlgs ? cachedAlgs.odd : [];
    const evenAlgs = cachedAlgs ? cachedAlgs.even : [];

    // Fetch SVGs dynamically from svgData using string keys
    const topSVG = window.svgData[item.top] || '';
    const bottomSVG = window.svgData[item.bottom] || '';

    const algFontFamily = hideParenthesis ? 'Arial, sans-serif' : 'Consolas, Menlo, Monaco, "Courier New", monospace';
    const oddAlgDisplay = oddAlgs.length > 0 ? renderAlgorithmWithPopup(oddAlgs, item.name, 'odd', algFontFamily) : '<div class="alg-line" style="color: var(--text-muted); font-style: italic;">No algorithms available</div>';
    const evenAlgDisplay = evenAlgs.length > 0 ? renderAlgorithmWithPopup(evenAlgs, item.name, 'even', algFontFamily) : '<div class="alg-line" style="color: var(--text-muted); font-style: italic;">No algorithms available</div>';

    const learnedIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="${isLearned ? 'var(--card-learned-border)' : (isLearning ? 'var(--card-learning-border)' : 'var(--border-color)')}" stroke-width="2">
        <path d="M20 6L9 17l-5-5"/>
    </svg>`;

    const threeDotsIcon = `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;">
        <circle cx="12" cy="5" r="2"/>
        <circle cx="12" cy="12" r="2"/>
        <circle cx="12" cy="19" r="2"/>
    </svg>`;

    const displayName = getDisplayName(item.name);

    // Apply search highlighting
    let highlightedName = displayName;
    if (window.searchMatches && window.searchMatches.has(item.name)) {
        const matchInfo = window.searchMatches.get(item.name);

        if (matchInfo.type === 'simple') {
            // Simple highlighting - highlight the search term
            const searchTerm = matchInfo.searchTerm;
            const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
            highlightedName = displayName.replace(regex, '<mark style="background-color: var(--search-highlight-bg); padding: 0 2px; border-radius: 2px;">$1</mark>');
        } else if (matchInfo.type === 'slashed-normal') {
            // Normal order: highlight matching parts in their positions
            const parts = displayName.split('/');
            if (parts.length === 2) {
                const part1 = highlightPartialMatch(parts[0].trim(), matchInfo.searchPart1);
                const part2 = highlightPartialMatch(parts[1].trim(), matchInfo.searchPart2);
                highlightedName = `${part1}/${part2}`;
            }
        } else if (matchInfo.type === 'slashed-flipped') {
            // Flipped order: highlight matching parts in flipped positions
            const parts = displayName.split('/');
            if (parts.length === 2) {
                const part1 = highlightPartialMatch(parts[0].trim(), matchInfo.searchPart2);
                const part2 = highlightPartialMatch(parts[1].trim(), matchInfo.searchPart1);
                highlightedName = `${part1}/${part2}`;
            }
        }
    }

    return `
        <div class="card ${cardClass}" data-case-name="${item.name}">
            <div class="card-header">
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <div class="card-title" style="${evilnessFactor ? (isCaseEvil(item.name) ? 'color: var(--bad-case);' : 'color: var(--good-case);') : ''}">
                        ${highlightedName}
                        ${perCaseSubtitles.has(item.name) ? `<div class="card-subtitle" style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 400; margin-top: 2px;">${perCaseSubtitles.get(item.name)}</div>` : ''}
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0;">
                        <div class="probability">${prob}%</div>
                        <div class="card-header-actions">
                            <div class="icon-btn" onmousedown="event.stopPropagation(); toggleLearned('${item.name.replace(/'/g, "\\'")}', event)" oncontextmenu="event.preventDefault();">
                                ${learnedIcon}
                            </div>
                            <div class="icon-btn" onclick="event.stopPropagation(); showContextMenu('${item.name.replace(/'/g, "\\'")}', event)" style="color: var(--text-secondary);">
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
                <div class="alg-section">
                    <span class="alg-label">Odd:</span>
                    ${oddAlgDisplay}
                </div>
                <div class="alg-section">
                    <span class="alg-label">Even:</span>
                    ${evenAlgDisplay}
                </div>
                ${comment ? `<div style="font-size: 0.65rem; color: var(--text-secondary); margin-top: 8px; white-space: pre-wrap;">${sanitizeNoteHTML(comment)}</div>` : ''}
            </div>
        </div>
    `;
}

let renderTimeout = null;

let _progressiveRenderToken = 0;

function render(softRender = false) {
    if (renderTimeout) clearTimeout(renderTimeout);

    renderTimeout = setTimeout(() => {
        if (!softRender && needsParityRecalculation()) {
            showRenderLoading();
            requestAnimationFrame(() => {
                calculateAndCacheAllParity();
                hideRenderLoading();
                _doProgressiveRender();
            });
        } else {
            _doProgressiveRender();
        }
        renderTimeout = null;
    }, 50);
}

function _doProgressiveRender() {
    const token = ++_progressiveRenderToken;
    const items = filteredData;

    // Figure out how many cards fit in the viewport
    // Estimate ~320px per card row, at least 8 cards visible
    const cardHeight = 320;
    const cols = Math.max(1, Math.floor(grid.offsetWidth / 320));
    const visibleRows = Math.ceil(window.innerHeight / cardHeight);
    const initialCount = Math.min((visibleRows + 2) * cols, items.length);

    // Render visible portion immediately
    grid.innerHTML = items.slice(0, initialCount).map(renderCard).join('');

    // Append placeholder rows for remaining items so scroll height is correct
    if (items.length > initialCount) {
        const placeholder = document.createElement('div');
        placeholder.id = '_render_placeholder';
        placeholder.style.cssText = `height:${Math.ceil((items.length - initialCount) / cols) * cardHeight}px;`;
        grid.appendChild(placeholder);
    }

    if (items.length <= initialCount) return;

    // Trickle-render the rest one card at a time in idle callbacks
    let idx = initialCount;
    function renderNext() {
        if (token !== _progressiveRenderToken) return; // stale render, abort
        if (idx >= items.length) {
            // Remove placeholder once done
            const ph = document.getElementById('_render_placeholder');
            if (ph) ph.remove();
            return;
        }

        const card = document.createElement('div');
        card.innerHTML = renderCard(items[idx]);
        const cardEl = card.firstElementChild;

        // Insert before placeholder
        const ph = document.getElementById('_render_placeholder');
        if (ph) {
            grid.insertBefore(cardEl, ph);
            // Shrink placeholder
            const remaining = items.length - idx - 1;
            ph.style.height = `${Math.ceil(remaining / cols) * cardHeight}px`;
            if (remaining === 0) ph.remove();
        } else {
            grid.appendChild(cardEl);
        }

        idx++;
        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(renderNext, { timeout: 100 });
        } else {
            setTimeout(renderNext, 8);
        }
    }

    if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(renderNext, { timeout: 100 });
    } else {
        setTimeout(renderNext, 8);
    }
}

function showRenderLoading() {
    let loadingDiv = document.getElementById('renderLoadingIndicator');
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'renderLoadingIndicator';
        loadingDiv.className = 'render-loading-indicator';
        loadingDiv.innerHTML = `
            <div class="render-loading-spinner"></div>
            <span>Updating...</span>
        `;
        document.body.appendChild(loadingDiv);
    }
    loadingDiv.style.display = 'flex';
}

function hideRenderLoading() {
    const loadingDiv = document.getElementById('renderLoadingIndicator');
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }
}

function showReorderButton() {
    let reorderBtn = document.getElementById('reorderButton');
    if (reorderBtn) return; // Already showing

    reorderBtn = document.createElement('button');
    reorderBtn.id = 'reorderButton';
    reorderBtn.className = 'reorder-btn';
    reorderBtn.textContent = 'Re-order Cases';

    reorderBtn.onclick = () => {
        filterAndSort(true);
        hideReorderButton();
    };

    document.body.appendChild(reorderBtn);
}

function hideReorderButton() {
    const reorderBtn = document.getElementById('reorderButton');
    if (reorderBtn) {
        reorderBtn.remove();
    }
}

// Helper function to escape regex special characters
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to highlight partial matches in a string
function highlightPartialMatch(text, searchTerm) {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
    return text.replace(regex, '<mark class="search-hl">$1</mark>');
}
