window.closeModalStack = [];
window._sqgModalPopstateClosing = false;
window._sqgModalSkipPopstate = false;

window.pushModalState = function (modalId, closeFn, ...args) {
    if (typeof closeFn !== 'function') return;
    const entry = args.length ? [closeFn, ...args] : closeFn;
    window.closeModalStack.push(entry);
    try {
        window.history.pushState({ sqgModal: true, modalId }, '');
    } catch (e) {
        // Some browsers may reject pushState in unusual contexts; ignore silently.
    }
};

window.removeCloseModalFromStack = function (closeFn) {
    if (typeof closeFn !== 'function') return;
    window.closeModalStack = window.closeModalStack.filter((entry) => {
        if (typeof entry === 'function') return entry !== closeFn;
        if (Array.isArray(entry) && typeof entry[0] === 'function') return entry[0] !== closeFn;
        return true;
    });
};

window.popCloseModalStack = function () {
    if (window.closeModalStack.length === 0) return false;
    const entry = window.closeModalStack.pop();
    if (typeof entry === 'function') {
        entry();
    } else if (Array.isArray(entry)) {
        const closeFn = entry[0];
        if (typeof closeFn === 'function') {
            closeFn(...entry.slice(1));
        }
    }
    return true;
};

window.closeModalWithHistory = function (closeFn, ...args) {
    if (typeof closeFn !== 'function') return;
    window.removeCloseModalFromStack(closeFn);

    const shouldPopHistory = !window._sqgModalPopstateClosing && window.history.state && window.history.state.sqgModal;
    if (shouldPopHistory) {
        window._sqgModalSkipPopstate = true;
    }

    closeFn(...args);

    if (shouldPopHistory) {
        window.history.back();
    }
};

window.addEventListener('popstate', function () {
    if (window._sqgModalSkipPopstate) {
        window._sqgModalSkipPopstate = false;
        return;
    }

    if (window.closeModalStack.length > 0) {
        window._sqgModalPopstateClosing = true;
        window.popCloseModalStack();
        window._sqgModalPopstateClosing = false;
    }
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        if (document.getElementById('evilnessQuizModal')) return;
        if (window.closeModalStack.length > 0) {
            window.popCloseModalStack();
        }
    }
});

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
        const profileModal = document.getElementById('profileModal');

        if (event.target == settingsModal) {
            closeSettingsModal();
        }
        if (event.target == caseNameModal) {
            closeCaseNameModal();
        }
        if (event.target == colorSchemeModal) {
            closeColorSchemeModal();
        }
        if (trainingModal && event.target == trainingModal) {
            closeTrainingModal();
        }

        if (event.target == suggestModal) {
            closeSuggestModal();
        }
        if (event.target == confessionModal) {
            closeConfessionModal();
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
function initializeApp() {
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
const loadingTips = {
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
function adjustLoadingScreen() {
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
const tipElement = document.createElement('p');
tipElement.id = 'loadingTip';
tipElement.className = 'loading-tip';
const tips = isFirstLoad ? loadingTips.firstLoad : loadingTips.general;
const randomTip = tips[Math.floor(Math.random() * tips.length)];
tipElement.textContent = randomTip;
document.getElementById('loadingTipContainer').appendChild(tipElement);

// Add Eva Kato credit
const evaCredit = document.createElement('p');
evaCredit.id = 'evaCredit';
evaCredit.className = 'loading-credit';
evaCredit.textContent = 'inspired from hashtagcuber.com/csp/ by Eva Kato';
document.getElementById('loadingScreen').appendChild(evaCredit);

// Add Matt credit
const mattCredit = document.createElement('p');
mattCredit.id = 'mattCredit';
mattCredit.className = 'loading-credit loading-credit--matt';
mattCredit.textContent = 'credit goes to Matt (@this_is_not_matt) for helping me out in this project';
document.getElementById('loadingScreen').appendChild(mattCredit);

// Apply initial sizing
adjustLoadingScreen();
window.addEventListener('resize', adjustLoadingScreen);

// Loading screen progress simulation
let loadProgress = 0;
const progressBar = document.getElementById('loadingProgress');
const loadingInterval = setInterval(() => {
    loadProgress += Math.random() * 30;
    if (loadProgress > 90) loadProgress = 90;
    progressBar.style.width = loadProgress + '%';
}, 100);

// Wait for DOM before calling these functions
function finalizeInitialization() {

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
    if (hideInstructions) {
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
        if (typeof updateProgress === 'function') updateProgress();
        filterAndSort(); // Soft render on initialization
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
        if (isFirstLoad) await applyPreset('Matt\'s_Preset', true, true, true);
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
        if (isFirstLoad) await applyPreset('Matt\'s_Preset', true, true, true);
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

        // Show general notes on first load
        if (isFirstLoad && typeof openGeneralNotesModal === 'function') {
            setTimeout(() => openGeneralNotesModal(), 400);
        }
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Check if Alt key is pressed
    if (e.altKey) {
        switch (e.key.toLowerCase()) {
            case 't': // Alt+T - Show tracing guides
                e.preventDefault();
                showHints = !showHints;
                localStorage.setItem('showHints', showHints);
                applyHintVisibility();
                const hintToggle = document.getElementById('hintToggle');
                if (hintToggle) hintToggle.checked = showHints;
                showToast(`Tracing guides ${showHints ? 'enabled' : 'disabled'}`, 2000, 'info');
                break;
            case 'h': // Alt+H - Hide instructions
                e.preventDefault();
                hideInstructions = !hideInstructions;
                saveState();
                applyInstructionVisibility();
                const hideInstructionsToggle = document.getElementById('hideInstructionsToggle');
                if (hideInstructionsToggle) hideInstructionsToggle.checked = hideInstructions;
                showToast(`Instruction buttons ${hideInstructions ? 'hidden' : 'shown'}`, 2000, 'info');
                break;
            case 'p': // Alt+P - Hide parenthesis
                e.preventDefault();
                hideParenthesis = !hideParenthesis;
                saveState();
                render();
                const hideParenthesisToggle = document.getElementById('hideParenthesisToggle');
                if (hideParenthesisToggle) hideParenthesisToggle.checked = hideParenthesis;
                showToast(`Parenthesis ${hideParenthesis ? 'hidden' : 'shown'}`, 2000, 'info');
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
function checkURLScramble() {
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
