import '../res/shapeImages/svg.js?v=esm-20260511-2';
import '../database/shapeIndex.js?v=esm-20260511-2';
import '../database/algs.js?v=esm-20260511-2';
import './app-core.js?v=esm-20260511-2';
import './data-store.js?v=esm-20260511-2';
import './utils.js?v=esm-20260511-2';
import './tools/algorithm-animation-core.js?v=esm-20260511-2';
import './tools/scrambleNormalizer.js?v=esm-20260511-2';
import './tools/alg_to_index.js?v=esm-20260511-2';
import './tools/cales-parity-tracer.js?v=esm-20260511-2';
import './tools/svg-editor.js?v=esm-20260511-2';
import './tools/scramblegenerator.js?v=esm-20260511-2';
import './tools/draw-scramble.js?v=esm-20260511-2';
import './tools/scrambleFormatting.js?v=esm-20260511-2';
import './tools/animate-alg.js?v=esm-20260511-2';
import './restoftheapp.js?v=esm-20260511-2';
import './tools/shapeTracer.js?v=esm-20260511-2';
import './rendering.js?v=esm-20260511-2';
import './search-and-filter.js?v=esm-20260511-2';
import './settings.js?v=esm-20260511-2';
import './modals.js?v=esm-20260511-2';
import './quick-edit.js?v=esm-20260511-2';
import './training-modal.js?v=esm-20260511-2';
import './multi-trainer.js?v=esm-20260511-2';

import {
    applyPreset,
    calculateAndCacheAllParity,
    currentSortMode,
    handleFileImport,
    initializeDOMReferences,
    initializePreset,
    initializeSVGData,
    isFirstLoad,
    needsParityRecalculation,
    saveState,
    sortSelect
} from './restoftheapp.js?v=esm-20260511-2';
import { render } from './rendering.js?v=esm-20260511-2';
import { filterAndSort } from './search-and-filter.js?v=esm-20260511-2';
import {
    applyHintVisibility,
    applyInstructionVisibility,
    applyProfileUI,
    closeColorSchemeModal,
    closeProfileModalMobile,
    closeSettingsModal,
    generateModalHTML,
    openCustomizeSVGsModal,
    openNewParityAnalysis,
    openParityTracingPersonalization,
    openProfileModalMobile,
    showProfilePopup,
    showToast,
    toggleSidebar,
    updateProfileStats
} from './modals.js?v=esm-20260511-2';
import { openQuickEditModal } from './quick-edit.js?v=esm-20260511-2';
import { closeTrainingModal } from './training-modal.js?v=esm-20260511-2';

/* ==== FILE: js/index.js ==== */

(function setupModalHistory(global) {
    const modalStack = [];
    let isClosingFromPopstate = false;
    let skipNextPopstate = false;

    function entryMatchesCloseFn(entry, closeFn) {
        if (typeof entry === 'function') return entry === closeFn;
        return Array.isArray(entry) && entry[0] === closeFn;
    }

    function pushModalState(modalId, closeFn, ...args) {
        if (typeof closeFn !== 'function') return;
        modalStack.push(args.length ? [closeFn, ...args] : closeFn);
        try {
            global.history.pushState({ sqgModal: true, modalId }, '');
        } catch { }
    }

    function removeCloseModalFromStack(closeFn) {
        if (typeof closeFn !== 'function') return;
        for (let i = modalStack.length - 1; i >= 0; i--) {
            if (entryMatchesCloseFn(modalStack[i], closeFn)) {
                modalStack.splice(i, 1);
            }
        }
    }

    function popCloseModalStack() {
        if (modalStack.length === 0) return false;
        const entry = modalStack.pop();
        if (typeof entry === 'function') {
            entry();
        } else if (Array.isArray(entry)) {
            const closeFn = entry[0];
            if (typeof closeFn === 'function') {
                closeFn(...entry.slice(1));
            }
        }
        return true;
    }

    function closeModalWithHistory(closeFn, ...args) {
        if (typeof closeFn !== 'function') return;
        removeCloseModalFromStack(closeFn);

        const shouldPopHistory = !isClosingFromPopstate && global.history.state && global.history.state.sqgModal;
        if (shouldPopHistory) {
            skipNextPopstate = true;
        }

        closeFn(...args);

        if (shouldPopHistory) {
            global.history.back();
        }
    }

    global.SQG = global.SQG || {};
    global.SQG.modalHistory = Object.freeze({
        push: pushModalState,
        remove: removeCloseModalFromStack,
        pop: popCloseModalStack,
        closeWithHistory: closeModalWithHistory,
        get depth() {
            return modalStack.length;
        }
    });

    global.pushModalState = pushModalState;
    global.removeCloseModalFromStack = removeCloseModalFromStack;
    global.popCloseModalStack = popCloseModalStack;
    global.closeModalWithHistory = closeModalWithHistory;

    global.addEventListener('popstate', function () {
        if (skipNextPopstate) {
            skipNextPopstate = false;
            return;
        }

        if (modalStack.length > 0) {
            isClosingFromPopstate = true;
            popCloseModalStack();
            isClosingFromPopstate = false;
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (document.getElementById('evilnessQuizModal')) return;
            if (modalStack.length > 0) {
                popCloseModalStack();
            }
        }
    });
})(window);

// Drag and drop support
document.body.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.body.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].name.endsWith('.json')) {
        handleFileImport(files[0]);
    }
});

// Close modals when clicking outside (wait for modals to be generated)
window.onclick = function (event) {
    // Use setTimeout to ensure modals are generated
    setTimeout(() => {
        const settingsModal = document.getElementById('settingsModal');
        const caseNameModal = document.getElementById('caseNameModal');
        const suggestModal = document.getElementById('suggestModal');
        const confessionModal = document.getElementById('confessionModal');
        const colorSchemeModal = document.getElementById('colorSchemeModal');
        const trainingModal = document.getElementById('trainingModal');

        if (event.target == settingsModal) {
            closeSettingsModal();
        }
        if (event.target == caseNameModal && typeof window.closeCaseNameModal === 'function') {
            window.closeCaseNameModal();
        }
        if (event.target == colorSchemeModal) {
            closeColorSchemeModal();
        }
        if (trainingModal && event.target == trainingModal) {
            closeTrainingModal();
        }

        if (event.target == suggestModal && typeof window.closeSuggestModal === 'function') {
            window.closeSuggestModal();
        }
        if (event.target == confessionModal && typeof window.closeConfessionModal === 'function') {
            window.closeConfessionModal();
        }
        const profileModalMobile = document.getElementById('profileModalMobile');
        if (profileModalMobile && event.target == profileModalMobile) {
            closeProfileModalMobile();
        }
    }, 0);
}

// Wait for DOM to be ready before generating modals
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        generateModalHTML();
    });
} else {
    generateModalHTML();
}

// Ensure DOM is ready before initialization
export function initializeApp() {
    // Initialize DOM references
    initializeDOMReferences();

    // Set default sort value if first load
    if (isFirstLoad && sortSelect) {
        sortSelect.value = 'probability';
    }
}

// Call initialization after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Loading tips object
export const loadingTips = {
    firstLoad: [
        "Welcome to SquanGo CSP!!",
    ],
    general: [
        "Happy Learning.",
        "There are 3678 different sliceable positions on a squan.",
        "Square-1 was invented in 1990 by Karel Hršel and Vojtěch Kopský",
        "Square-1 notation was created by Jaap Scherphuis, the creator of sq1optim",
        "Every position on a squan can be solved under 13 slices (12 ignoring the equator) or under 31 face turns!",
        "WR: 4.63 avg — Sameer Aggarwal",
        "WR: 3.40 single — Hassan Khanani.",
        "Back to square one, literally!",
        "Parity monster is hiding under your bed!!",
        "#BanMattsMuffinTracing!!!",
        "#BanMatts5-1Tracing!!!",
        "\"Square-1\" is short for \"Back to Square 1\", one of the original names of the puzzle!",
        "The earliest names of Square-1 was \"Back to Square 1\", and \"Cube 21\"",
        "Square-1 is one of the OG events of wca, added in 2005 — one year after the creation of wca",
        "The first square-1 average world record was by Lars Vandenbergh of 33.21s at Dutch Open 2004",
        "The first square-1 world record was by Lars Vandenbergh, 41.80s single at World Championship 2003",
        "Mike Masonjones proved in 2005 that God's Number for the Square-1 is 13 in the twist metric (10.615 on average).",
        "In 2017, Chen Shuang calculated the God's Number for the Square-1 to be 31 in face turn metric (25.134 on average)",
        "csTimer was created by Chen Shuang (cs0x7f) in 2016 and stands for Chen Shuang's Timer",
        "Square-1 was patented by Karel Hrsel and Vojtech Kopsky on 16 March 1993, US 5,193,809.",
        "Some CSP's even-odd algs are mirrors of each other!",
        "meow :3 — Matt 2026",
        "You can start tracing on either shape if both are 4e4c!",
        "Parity Monster is hiding behind the curtain!!!",
        "Cale's Parity Tracing was invented by Cale Schoon (2014SCHO02), published on May 16, 2017",
        "You can change the tracing position and the even/odd will update automatically!",
        "Click in the middle of a symmetric shape in Parity Tracer to trace from a different angle!",
        "Creating stories will help you remember CSP.",
        "Free Palestine",
        "Find other SquanGo tools at: squan-go.web.app"
    ]
};

// Responsive loading screen (set BEFORE creating elements)
export function adjustLoadingScreen() {
    const width = window.innerWidth;
    const title = document.getElementById('loadingTitle');
    const author = document.getElementById('loadingAuthor');
    const tip = document.getElementById('loadingTip');
    const evaCredit = document.getElementById('evaCredit');
    const mattCredit = document.getElementById('mattCredit');

    if (width <= 355) {
        if (title) title.classList.add('loading-title--xs');
        if (author) author.classList.add('loading-author--xs');
        if (tip) tip.classList.add('loading-tip--xs');
        if (evaCredit) evaCredit.classList.add('loading-credit--xs');
        if (mattCredit) mattCredit.classList.add('loading-credit--xs');
    } else if (width <= 480) {
        if (title) title.classList.add('loading-title--sm');
        if (author) author.classList.add('loading-author--sm');
        if (tip) tip.classList.add('loading-tip--sm');
        if (evaCredit) evaCredit.classList.add('loading-credit--sm');
        if (mattCredit) mattCredit.classList.add('loading-credit--sm');
    }
    // else: default sizes from CSS
}

// Select and display a random tip
export const tipElement = document.createElement('p');
tipElement.id = 'loadingTip';
tipElement.className = 'loading-tip';
export const tips = isFirstLoad ? loadingTips.firstLoad : loadingTips.general;
export const randomTip = tips[Math.floor(Math.random() * tips.length)];
tipElement.textContent = randomTip;
document.getElementById('loadingTipContainer').appendChild(tipElement);

// Add Eva Kato credit
export const evaCredit = document.createElement('p');
evaCredit.id = 'evaCredit';
evaCredit.className = 'loading-credit';
evaCredit.textContent = 'inspired from hashtagcuber.com/csp/ by Eva Kato';
document.getElementById('loadingScreen').appendChild(evaCredit);

// Add Matt credit
export const mattCredit = document.createElement('p');
mattCredit.id = 'mattCredit';
mattCredit.className = 'loading-credit loading-credit--matt';
mattCredit.textContent = 'credit goes to Matt (@this_is_not_matt) for helping me out in this project';
document.getElementById('loadingScreen').appendChild(mattCredit);

// Apply initial sizing
adjustLoadingScreen();
window.addEventListener('resize', adjustLoadingScreen);

// Loading screen progress simulation
export let loadProgress = 0;
export const progressBar = document.getElementById('loadingProgress');
export const loadingInterval = setInterval(() => {
    loadProgress += Math.random() * 30;
    if (loadProgress > 90) loadProgress = 90;
    progressBar.style.width = loadProgress + '%';
}, 100);

// Wait for DOM before calling these functions
export function finalizeInitialization() {

    // Setup sidebar
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    if (sidebarToggleBtn) {
        sidebarToggleBtn.onclick = (e) => {
            e.stopPropagation();
            toggleSidebar();
        };
    }

    // Setup profile button
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.onclick = (e) => {
            e.stopPropagation();
            if (window.innerWidth > 620) {
                showProfilePopup(true);
            } else {
                openProfileModalMobile();
            }
        };
    }

    // Setup search toggle for mobile
    const searchToggle = document.getElementById('searchToggle');
    const searchInput = document.getElementById('search');
    const controls = document.querySelector('.controls');

    if (searchToggle && controls && searchInput) {
        searchToggle.onmousedown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isExpanded = controls.classList.toggle('search-expanded');

            if (isExpanded) {
                setTimeout(() => {
                    searchInput.focus();
                }, 100);
            } else {
                searchInput.blur();
            }
        };

        // Close search when clicking outside
        document.addEventListener('click', (e) => {
            if (controls.classList.contains('search-expanded') &&
                !controls.contains(e.target) &&
                !searchToggle.contains(e.target)) {
                controls.classList.remove('search-expanded');
                searchInput.blur();
            }
        });

        // Close search on escape key
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                controls.classList.remove('search-expanded');
                searchInput.blur();
            }
        });
    }

    // Apply instruction button visibility
    if (window.hideInstructions) {
        const container = document.getElementById('floatingButtonsContainer');
        if (container) {
            container.classList.add('hide-instructions');
        }
    }
    if (typeof applyInstructionVisibility === 'function') {
        applyInstructionVisibility();
    }

    // These need to run after modal generation
    setTimeout(() => {
        updateProfileStats();
        filterAndSort(true); // Soft render on initialization
        if (typeof applyProfileUI === 'function') applyProfileUI();
    }, 100);
}

// Ensure this runs after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        finalizeInitialization();
        // Set saved sort mode
        const sortSelect = document.getElementById('sort');
        if (sortSelect && currentSortMode) {
            sortSelect.value = currentSortMode;
        }
    });
} else {
    finalizeInitialization();
    // Set saved sort mode
    const sortSelect = document.getElementById('sort');
    if (sortSelect && currentSortMode) {
        sortSelect.value = currentSortMode;
    }
}

window.addEventListener('load', async () => {
    const loadStartTime = Date.now();

    const hasDeepLink = (() => {
        const hash = decodeURIComponent(window.location.hash);
        return hash.startsWith('#s=') || (hash.length > 1 && hash.slice(1).includes('('));
    })();

    if (hasDeepLink) {
        // Nuke loading screen, keep container hidden until after tracer opens
        document.getElementById('loadingScreen').style.display = 'none';
        clearInterval(loadingInterval);

        // Initialize just enough to open the tracer
        await initializePreset();
        if (isFirstLoad) await applyPreset('Default_Preset', true, true);
        initializeSVGData();

        // Open tracer immediately
        checkURLScramble();

        // Now render the rest of the app in the background
        requestAnimationFrame(() => {
            const sortSelect = document.getElementById('sort');
            if (sortSelect && currentSortMode) sortSelect.value = currentSortMode;
            if (needsParityRecalculation()) calculateAndCacheAllParity();
            setTimeout(() => {
                document.getElementById('mainContainer').classList.remove('hidden-until-loaded');
            }, 500);
        });

    } else {
        // Normal load flow
        await initializePreset();
        if (isFirstLoad) await applyPreset('Default_Preset', true, true);
        initializeSVGData();

        const sortSelect = document.getElementById('sort');
        if (sortSelect && currentSortMode) sortSelect.value = currentSortMode;
        if (needsParityRecalculation()) calculateAndCacheAllParity();

        const loadDuration = Date.now() - loadStartTime;
        const remainingTime = Math.max(0, 2500 - loadDuration);
        await new Promise(resolve => setTimeout(resolve, remainingTime));

        clearInterval(loadingInterval);
        progressBar.style.width = '100%';
        await new Promise(resolve => setTimeout(resolve, 200));

        const loadingScreen = document.getElementById('loadingScreen');
        const mainContainer = document.getElementById('mainContainer');
        loadingScreen.classList.add('loading-screen--fade-out');
        mainContainer.classList.remove('hidden-until-loaded');

        await new Promise(resolve => setTimeout(resolve, 300));
        loadingScreen.style.display = 'none';
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Check if Alt key is pressed
    if (e.altKey) {
        switch (e.key.toLowerCase()) {
            case 't': // Alt+T - Show tracing guides
                e.preventDefault();
                window.showHints = !window.showHints;
                localStorage.setItem('showHints', window.showHints);
                applyHintVisibility();
                const hintToggle = document.getElementById('hintToggle');
                if (hintToggle) hintToggle.checked = window.showHints;
                showToast(`Tracing guides ${window.showHints ? 'enabled' : 'disabled'}`, 2000, 'info');
                break;
            case 'h': // Alt+H - Hide instructions
                e.preventDefault();
                window.hideInstructions = !window.hideInstructions;
                saveState();
                applyInstructionVisibility();
                const hideInstructionsToggle = document.getElementById('hideInstructionsToggle');
                if (hideInstructionsToggle) hideInstructionsToggle.checked = window.hideInstructions;
                showToast(`Instruction buttons ${window.hideInstructions ? 'hidden' : 'shown'}`, 2000, 'info');
                break;
            case 'p': // Alt+P - Hide parenthesis
                e.preventDefault();
                window.hideParenthesis = !window.hideParenthesis;
                saveState();
                render();
                const hideParenthesisToggle = document.getElementById('hideParenthesisToggle');
                if (hideParenthesisToggle) hideParenthesisToggle.checked = window.hideParenthesis;
                showToast(`Parenthesis ${window.hideParenthesis ? 'hidden' : 'shown'}`, 2000, 'info');
                break;
            case 'w': // Alt+W - Parity tracing personalization
                e.preventDefault();
                openParityTracingPersonalization();
                break;
            case 'g': // Alt+G - Customize tracing guides
                e.preventDefault();
                openCustomizeSVGsModal();
                break;
            case 'q': // Alt+Q - Quick edit
                e.preventDefault();
                openQuickEditModal();
                break;
        }
    }
});

// URL scramble deep-link: squan-go.web.app/csp/#s=(0,-1)/ (6,-3)/ ...
export function checkURLScramble() {
    const hash = decodeURIComponent(window.location.hash);
    if (!hash || hash.length <= 1) return;

    let scramble = null;

    // Format: #s=scramble
    if (hash.startsWith('#s=')) {
        scramble = hash.slice(3).trim();
    }
    // Fallback: bare hash with parens (old format)
    else if (hash.slice(1).includes('(')) {
        scramble = hash.slice(1).trim();
    }

    if (scramble && (scramble.includes('(') || scramble.includes('/'))) {
        const tryOpen = (attempts) => {
            if (typeof window.ParityTracerLibrary !== 'undefined' && typeof openNewParityAnalysis === 'function') {
                openNewParityAnalysis(scramble);
            } else if (attempts > 0) {
                setTimeout(() => tryOpen(attempts - 1), 300);
            }
        };
        tryOpen(20);
    }
}

window.addEventListener('load', () => {
    const hasDeepLink = (() => {
        const hash = decodeURIComponent(window.location.hash);
        return hash.startsWith('#s=') || (hash.length > 1 && hash.slice(1).includes('('));
    })();
    if (!hasDeepLink) {
        setTimeout(checkURLScramble, 3000);
    }
});

// ESM live global compatibility bridge
for (const [name, descriptor] of Object.entries({
    "initializeApp": { get: () => initializeApp, set: value => { Object.defineProperty(window, "initializeApp", { configurable: true, enumerable: true, writable: true, value }); } },
    "loadingTips": { get: () => loadingTips, set: value => { Object.defineProperty(window, "loadingTips", { configurable: true, enumerable: true, writable: true, value }); } },
    "adjustLoadingScreen": { get: () => adjustLoadingScreen, set: value => { Object.defineProperty(window, "adjustLoadingScreen", { configurable: true, enumerable: true, writable: true, value }); } },
    "tipElement": { get: () => tipElement, set: value => { Object.defineProperty(window, "tipElement", { configurable: true, enumerable: true, writable: true, value }); } },
    "tips": { get: () => tips, set: value => { Object.defineProperty(window, "tips", { configurable: true, enumerable: true, writable: true, value }); } },
    "randomTip": { get: () => randomTip, set: value => { Object.defineProperty(window, "randomTip", { configurable: true, enumerable: true, writable: true, value }); } },
    "evaCredit": { get: () => evaCredit, set: value => { Object.defineProperty(window, "evaCredit", { configurable: true, enumerable: true, writable: true, value }); } },
    "mattCredit": { get: () => mattCredit, set: value => { Object.defineProperty(window, "mattCredit", { configurable: true, enumerable: true, writable: true, value }); } },
    "loadProgress": { get: () => loadProgress, set: value => { loadProgress = value; } },
    "progressBar": { get: () => progressBar, set: value => { Object.defineProperty(window, "progressBar", { configurable: true, enumerable: true, writable: true, value }); } },
    "loadingInterval": { get: () => loadingInterval, set: value => { Object.defineProperty(window, "loadingInterval", { configurable: true, enumerable: true, writable: true, value }); } },
    "finalizeInitialization": { get: () => finalizeInitialization, set: value => { Object.defineProperty(window, "finalizeInitialization", { configurable: true, enumerable: true, writable: true, value }); } },
    "checkURLScramble": { get: () => checkURLScramble, set: value => { Object.defineProperty(window, "checkURLScramble", { configurable: true, enumerable: true, writable: true, value }); } },
})) {
    Object.defineProperty(window, name, {
        configurable: true,
        enumerable: true,
        get: descriptor.get,
        set: descriptor.set
    });
}
