// Store search matches for highlighting
window.searchMatches = new Map();

function filterAndSort(softRender = false) {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const sortType = sortSelect.value;
    const learnFilter = learnFilterSelect.value;
    
    // Clear previous search matches
    window.searchMatches.clear();
    
    // Update current sort mode
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

        const displayName = getDisplayName(item.name);
        const displayNameLower = displayName.toLowerCase();
        
        // Check if title has slash
        const titleHasSlash = displayName.includes('/');
        const searchHasSlash = searchTerm.includes('/');
        
        // Case 1: Search without slash
        if (!searchHasSlash) {
            // Simple partial match anywhere in the display name
            if (displayNameLower.includes(searchTerm)) {
                // Store match info for highlighting
                window.searchMatches.set(item.name, {
                    type: 'simple',
                    searchTerm: searchTerm
                });
                return true;
            }
            return false;
        }
        
        // Case 2: Search has slash, title has slash
        if (searchHasSlash && titleHasSlash) {
            const searchParts = searchTerm.split('/').map(p => p.trim());
            const titleParts = displayName.split('/').map(p => p.trim());
            
            // Only proceed if both have exactly 2 parts
            if (searchParts.length === 2 && titleParts.length === 2) {
                const [searchPart1, searchPart2] = searchParts;
                const [titlePart1, titlePart2] = titleParts;
                const titlePart1Lower = titlePart1.toLowerCase();
                const titlePart2Lower = titlePart2.toLowerCase();
                
                // Normal order: first matches first AND second matches second
                const normalMatch = titlePart1Lower.includes(searchPart1) && titlePart2Lower.includes(searchPart2);
                
                // Flipped order: first matches second AND second matches first
                const flippedMatch = titlePart2Lower.includes(searchPart1) && titlePart1Lower.includes(searchPart2);
                
                if (normalMatch) {
                    window.searchMatches.set(item.name, {
                        type: 'slashed-normal',
                        searchPart1: searchPart1,
                        searchPart2: searchPart2
                    });
                    return true;
                }
                
                if (flippedMatch) {
                    window.searchMatches.set(item.name, {
                        type: 'slashed-flipped',
                        searchPart1: searchPart1,
                        searchPart2: searchPart2
                    });
                    return true;
                }
            }
            return false;
        }
        
        // Case 3: Search has slash, title doesn't have slash
        if (searchHasSlash && !titleHasSlash) {
            return false;
        }
        
        return false;
    });

    // Apply sorting
    if (sortType === 'priority') {
        // First sort by probability (highest first)
        filteredData.sort((a, b) => b.probability - a.probability);
        
        // Then sort by state and priority
        filteredData.sort((a, b) => {
            const aIsLearning = learningCases.has(a.name);
            const bIsLearning = learningCases.has(b.name);
            const aIsPlanned = plannedCases.has(a.name);
            const bIsPlanned = plannedCases.has(b.name);
            const aIsLearned = learnedCases.has(a.name);
            const bIsLearned = learnedCases.has(b.name);
            
            // Learning comes first
            if (aIsLearning && !bIsLearning) return -1;
            if (!aIsLearning && bIsLearning) return 1;
            
            // Then planned (by priority level, 1=top to 7=meh)
            if (aIsPlanned && !bIsPlanned && !bIsLearning && !bIsLearned) return -1;
            if (!aIsPlanned && bIsPlanned && !aIsLearning && !aIsLearned) return 1;
            if (aIsPlanned && bIsPlanned) {
                const aPriority = plannedLevels.get(a.name) || 4;
                const bPriority = plannedLevels.get(b.name) || 4;
                return aPriority - bPriority;
            }
            
            // Then learned comes last
            if (aIsLearned && !bIsLearned) return 1;
            if (!aIsLearned && bIsLearned) return -1;
            
            return 0;
        });
    } else {
        const field = 'probability';
        filteredData.sort((a, b) => b[field] - a[field]);
        if (sortType === 'antiProbability') {
            filteredData.reverse();
        }
    }

    render(softRender);
}

// Responsive select labels
function updateSelectLabels() {
    const width = window.innerWidth;
    const selects = document.querySelectorAll('select');
    
    selects.forEach(select => {
        const options = select.querySelectorAll('option');
        options.forEach(option => {
            const fullText = option.getAttribute('data-full') || option.textContent;
            if (!option.getAttribute('data-full')) {
                option.setAttribute('data-full', fullText);
            }
            
            const shortText = option.getAttribute('data-short');
            const xsText = option.getAttribute('data-xs');
            
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

// Wait for DOM to be ready before attaching event listeners
function attachSearchListeners() {
    const searchInput = document.getElementById('search');
    const sortSelect = document.getElementById('sort');
    const learnFilterSelect = document.getElementById('learnFilter');
    const searchToggle = document.getElementById('searchToggle');
    const controls = document.querySelector('.controls');
    
    if (searchInput) {
        // Disable autocomplete
        searchInput.setAttribute('autocomplete', 'off');
        searchInput.setAttribute('autocorrect', 'off');
        searchInput.setAttribute('autocapitalize', 'off');
        searchInput.setAttribute('spellcheck', 'false');
        
        searchInput.addEventListener('input', () => {
            filterAndSort(true);
        });
    }
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            filterAndSort(true);
            hideReorderButton();
        });
    }
    if (learnFilterSelect) {
        learnFilterSelect.addEventListener('change', () => {
            filterAndSort(true);
        });
    }

if (searchToggle && controls) {
        searchToggle.addEventListener('click', () => {
            controls.classList.toggle('search-expanded');
            if (controls.classList.contains('search-expanded') && searchInput) {
                searchInput.focus();
            }
        });
    }

    // Close search when clicking outside
    if (controls && searchInput) {
        document.addEventListener('click', (e) => {
            if (!controls.contains(e.target) && controls.classList.contains('search-expanded')) {
                if (searchInput.value === '') {
                    controls.classList.remove('search-expanded');
                }
            }
        });

        // Keep expanded if there's text
        searchInput.addEventListener('input', () => {
            if (searchInput.value !== '') {
                controls.classList.add('search-expanded');
            }
        });
    }
}

// Call when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachSearchListeners);
} else {
    attachSearchListeners();
}

// Responsive select labels
function updateSelectLabels() {
    const width = window.innerWidth;
    const selects = document.querySelectorAll('select');
    
    selects.forEach(select => {
        const options = select.querySelectorAll('option');
        options.forEach(option => {
            const fullText = option.getAttribute('data-full') || option.textContent;
            if (!option.getAttribute('data-full')) {
                option.setAttribute('data-full', fullText);
            }
            
            const shortText = option.getAttribute('data-short');
            const xsText = option.getAttribute('data-xs');
            
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

// Update labels on load and resize
updateSelectLabels();
window.addEventListener('resize', updateSelectLabels);