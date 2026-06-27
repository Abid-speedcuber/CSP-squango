// Store search matches for highlighting
window.searchMatches = new Map();

// Always a soft render: filterAndSort only handles search/sort/filter changes,
// which never alter parity. Callers that change parity recalc it first, then
// call this (or call render() directly for a hard render).
function filterAndSort() {
    const searchTerm    = searchInput.value.toLowerCase().trim();
    const sortType      = sortSelect.value;
    const learnFilter   = learnFilterSelect.value;

    window.searchMatches.clear();

    currentSortMode = sortType;
    localStorage.setItem('sortMode', currentSortMode);

    filteredData = data.filter(item => {
        let matchesLearnFilter = true;
        if (learnFilter === 'learned') {
            matchesLearnFilter = learnedCases.has(item.name);
        } else if (learnFilter === 'unlearned') {
            matchesLearnFilter = !learnedCases.has(item.name);
        }

        if (!matchesLearnFilter) return false;
        if (!searchTerm) return true;

        const displayName      = getDisplayName(item.name);
        const displayNameLower = displayName.toLowerCase();
        const titleHasSlash    = displayName.includes('/');
        const searchHasSlash   = searchTerm.includes('/');

        // Case 1: Search without slash — simple partial match
        if (!searchHasSlash) {
            if (displayNameLower.includes(searchTerm)) {
                window.searchMatches.set(item.name, { type: 'simple', searchTerm });
                return true;
            }
            return false;
        }

        // Case 2: Both search and title have slash
        if (searchHasSlash && titleHasSlash) {
            const searchParts = searchTerm.split('/').map(p => p.trim());
            const titleParts  = displayName.split('/').map(p => p.trim());

            if (searchParts.length === 2 && titleParts.length === 2) {
                const [searchPart1, searchPart2] = searchParts;
                const [titlePart1,  titlePart2]  = titleParts;
                const t1 = titlePart1.toLowerCase();
                const t2 = titlePart2.toLowerCase();

                const normalMatch  = t1.includes(searchPart1) && t2.includes(searchPart2);
                const flippedMatch = t2.includes(searchPart1) && t1.includes(searchPart2);

                if (normalMatch) {
                    window.searchMatches.set(item.name, { type: 'slashed-normal', searchPart1, searchPart2 });
                    return true;
                }
                if (flippedMatch) {
                    window.searchMatches.set(item.name, { type: 'slashed-flipped', searchPart1, searchPart2 });
                    return true;
                }
            }
            return false;
        }

        // Case 3: Search has slash but title does not
        return false;
    });

    // Apply sorting
    if (sortType === 'priority') {
        filteredData.sort((a, b) => b.probability - a.probability);
        filteredData.sort((a, b) => {
            const aIsLearning = learningCases.has(a.name);
            const bIsLearning = learningCases.has(b.name);
            const aIsPlanned  = plannedCases.has(a.name);
            const bIsPlanned  = plannedCases.has(b.name);
            const aIsLearned  = learnedCases.has(a.name);
            const bIsLearned  = learnedCases.has(b.name);

            if (aIsLearning && !bIsLearning) return -1;
            if (!aIsLearning && bIsLearning) return 1;

            if (aIsPlanned && !bIsPlanned && !bIsLearning && !bIsLearned) return -1;
            if (!aIsPlanned && bIsPlanned && !aIsLearning && !aIsLearned) return 1;
            if (aIsPlanned && bIsPlanned) {
                const aPriority = plannedLevels.get(a.name) || 4;
                const bPriority = plannedLevels.get(b.name) || 4;
                return aPriority - bPriority;
            }

            if (aIsLearned && !bIsLearned) return 1;
            if (!aIsLearned && bIsLearned) return -1;
            return 0;
        });
    } else {
        filteredData.sort((a, b) => b.probability - a.probability);
        if (sortType === 'antiProbability') filteredData.reverse();
    }

    render(true);
}

// ── Responsive select labels ─────────────────────────────────
function updateSelectLabels() {
    const width   = window.innerWidth;
    const selects = document.querySelectorAll('select');

    selects.forEach(select => {
        select.querySelectorAll('option').forEach(option => {
            // Cache the full text on first call
            if (!option.getAttribute('data-full')) {
                option.setAttribute('data-full', option.textContent);
            }
            const fullText  = option.getAttribute('data-full');
            const shortText = option.getAttribute('data-short');
            const xsText    = option.getAttribute('data-xs');

            if (width <= 400 && xsText) {
                option.textContent = xsText;
            } else if (width <= 570 && shortText) {
                option.textContent = shortText;
            } else {
                option.textContent = fullText;
            }
        });
    });
}

// ── Attach event listeners ───────────────────────────────────
function attachSearchListeners() {
    const searchInputEl      = document.getElementById('search');
    const sortSelectEl       = document.getElementById('sort');
    const learnFilterSelectEl = document.getElementById('learnFilter');
    const searchToggleEl     = document.getElementById('searchToggle');
    const controlsEl         = document.querySelector('.controls');

    if (searchInputEl) {
        searchInputEl.setAttribute('autocomplete',   'off');
        searchInputEl.setAttribute('autocorrect',    'off');
        searchInputEl.setAttribute('autocapitalize', 'off');
        searchInputEl.setAttribute('spellcheck',     'false');

        searchInputEl.addEventListener('input', () => {
            filterAndSort(true);
            // Keep search bar open while there is text
            if (searchInputEl.value !== '' && controlsEl) {
                controlsEl.classList.add('search-expanded');
            }
        });
    }

    if (sortSelectEl) {
        sortSelectEl.addEventListener('change', () => {
            filterAndSort(true);
            hideReorderButton();
        });
    }

    if (learnFilterSelectEl) {
        learnFilterSelectEl.addEventListener('change', () => filterAndSort(true));
    }

    if (searchToggleEl && controlsEl) {
        searchToggleEl.addEventListener('click', () => {
            controlsEl.classList.toggle('search-expanded');
            if (controlsEl.classList.contains('search-expanded') && searchInputEl) {
                searchInputEl.focus();
            }
        });
    }

    // Close search when clicking outside and the field is empty
    if (controlsEl && searchInputEl) {
        document.addEventListener('click', (e) => {
            if (!controlsEl.contains(e.target) &&
                controlsEl.classList.contains('search-expanded') &&
                searchInputEl.value === '') {
                controlsEl.classList.remove('search-expanded');
            }
        });
    }
}

// ── Boot ─────────────────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachSearchListeners);
} else {
    attachSearchListeners();
}

updateSelectLabels();
window.addEventListener('resize', updateSelectLabels);
