function filterAndSort() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const sortType = sortSelect.value;
    const learnFilter = learnFilterSelect.value;

    filteredData = data.filter(item => {
        let matchesLearnFilter = true;
        if (learnFilter === 'learned') {
            matchesLearnFilter = learnedCases.has(item.name);
        } else if (learnFilter === 'unlearned') {
            matchesLearnFilter = !learnedCases.has(item.name);
        }

        if (!matchesLearnFilter) return false;
        if (!searchTerm) return true;

        const displayName = getDisplayName(item.name).toLowerCase();
        
        // Handle '/' search (flipped matching)
        if (searchTerm.includes('/')) {
            const searchParts = searchTerm.split('/').map(p => p.trim());
            const nameParts = item.name.split('/');
            
            if (searchParts.length === 2 && nameParts.length === 2) {
                const [searchTop, searchBot] = searchParts;
                const displayTop = getDisplayPart(nameParts[0], item.name).toLowerCase();
                const displayBot = getDisplayPart(nameParts[1], item.name).toLowerCase();
                
                // Normal order: top/bottom
                const normalMatch = displayTop.includes(searchTop) && displayBot.includes(searchBot);
                
                // Flipped order: bottom/top
                const flippedMatch = displayBot.includes(searchTop) && displayTop.includes(searchBot);
                
                return normalMatch || flippedMatch;
            }
        }
        
        // Single term search - only match what's displayed
        return displayName.includes(searchTerm);
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
        const sortMap = {
            probability: 'probability',
            good: 'good',
            bad: 'bad',
            antiProbability: 'probability',
            antiGood: 'good',
            antiBad: 'bad'
        };

        const field = sortMap[sortType];
        filteredData.sort((a, b) => b[field] - a[field]);

        if (sortType.startsWith('anti') && sortType !== 'antiProbability') {
            filteredData.reverse();
        }
        if (sortType === 'antiProbability') {
            filteredData.reverse();
        }
    }

    render();
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
        searchInput.addEventListener('input', () => {
            filterAndSort();
        });
    }
    if (sortSelect) sortSelect.addEventListener('change', filterAndSort);
    if (learnFilterSelect) learnFilterSelect.addEventListener('change', filterAndSort);

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