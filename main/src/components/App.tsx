import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../app/store';
import {
  applyPreset,
  calculateAndCacheAllParity,
  currentSortMode,
  initializePreset,
  initializeSVGData,
  isFirstLoad,
  needsParityRecalculation,
  profileAvatar,
  setSortMode,
  updateProgress,
  type SortMode,
} from '../app/state';
import { computeFilteredData, type LearnFilter } from '../app/filter';
import { installWindowShims } from '../app/shims';
import { renderCard } from '../app/cardHTML';
import { openGeneralNotesModal } from '../app/notes';
import { applyHintVisibility, applyInstructionVisibility } from '../app/visibility';
import LoadingScreen from './LoadingScreen';
import SettingsModal from './SettingsModal';

function updateSelectLabels(): void {
  const width = window.innerWidth;
  document.querySelectorAll('select').forEach((select) => {
    select.querySelectorAll('option').forEach((option) => {
      if (!option.getAttribute('data-full')) {
        option.setAttribute('data-full', option.textContent || '');
      }
      const fullText = option.getAttribute('data-full') || '';
      const shortText = option.getAttribute('data-short') || '';
      const xsText = option.getAttribute('data-xs') || '';
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

export default function App(): React.ReactNode {
  useAppStore();
  const [loaded, setLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortTypeState] = useState<SortMode>(currentSortMode);
  const [learnFilter, setLearnFilterState] = useState<LearnFilter>('all');
  const gridRef = useRef<HTMLDivElement | null>(null);

  const setSortType = useCallback((mode: SortMode) => {
    setSortTypeState(mode);
    setSortMode(mode);
  }, []);

  const setLearnFilter = useCallback((filter: LearnFilter) => {
    setLearnFilterState(filter);
  }, []);

  const filtered = useMemo(
    () => computeFilteredData(searchTerm, sortType, learnFilter),
    [searchTerm, sortType, learnFilter],
  );

  const gridHTML = useMemo(() => filtered.map((item) => renderCard(item)).join(''), [filtered]);

  // Boot: install shims, load preset, initialize SVG data, recalc parity.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loadStartTime = Date.now();
      installWindowShims();
      await initializePreset();
      if (isFirstLoad) await applyPreset("Matt's_Preset", true, true, true);
      initializeSVGData();
      if (needsParityRecalculation()) calculateAndCacheAllParity();
      const loadDuration = Date.now() - loadStartTime;
      const remainingTime = Math.max(0, 2500 - loadDuration);
      await new Promise((resolve) => setTimeout(resolve, remainingTime));
      if (cancelled) return;
      setLoaded(true);
      applyHintVisibility();
      applyInstructionVisibility();
      if (isFirstLoad) {
        setTimeout(() => openGeneralNotesModal(), 400);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loaded) {
      updateSelectLabels();
      window.addEventListener('resize', updateSelectLabels);
    }
    return () => window.removeEventListener('resize', updateSelectLabels);
  }, [loaded]);

  // Search toggle behavior
  const searchToggleRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const controlsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loaded) return;
    const controls = controlsRef.current;
    const searchToggle = searchToggleRef.current;
    const searchInput = searchRef.current;
    if (!controls || !searchToggle || !searchInput) return;

    const onSearchToggleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const isExpanded = controls.classList.toggle('search-expanded');
      if (isExpanded) {
        setTimeout(() => searchInput.focus(), 100);
      } else {
        searchInput.blur();
      }
    };

    const onDocClick = (e: MouseEvent) => {
      if (
        controls.classList.contains('search-expanded') &&
        !controls.contains(e.target as Node) &&
        !searchToggle.contains(e.target as Node)
      ) {
        controls.classList.remove('search-expanded');
        searchInput.blur();
      }
    };

    const onSearchKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        controls.classList.remove('search-expanded');
        searchInput.blur();
      }
    };

    searchToggle.addEventListener('mousedown', onSearchToggleMouseDown);
    document.addEventListener('click', onDocClick);
    searchInput.addEventListener('keydown', onSearchKeydown);
    return () => {
      searchToggle.removeEventListener('mousedown', onSearchToggleMouseDown);
      document.removeEventListener('click', onDocClick);
      searchInput.removeEventListener('keydown', onSearchKeydown);
    };
  }, [loaded]);

  // Update progress bars whenever learned state changes
  useEffect(() => {
    if (loaded) updateProgress();
  }, [loaded]);

  if (!loaded) {
    return (
      <>
        <LoadingScreen hidden={false} />
      </>
    );
  }

  const title = 'SquanGo CSP';

  return (
    <>
      <LoadingScreen hidden={true} />
      <div className={`container${loaded ? '' : ' hidden-until-loaded'}`} id="mainContainer">
        <header>
          <h1 className="desktop-title">{title}</h1>
          <h1 className="tablet-title">{title}</h1>
          <h1 className="mobile-title">{title}</h1>
          <div className="subtitle">By Abid Ibn Ashraf</div>
          <button
            id="sidebarToggleBtn"
            className="sidebar-toggle-btn"
            aria-label="Menu"
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(new CustomEvent('sqg:toggle-sidebar'));
            }}
          >
            <img src="res/menu.svg" height={24} width={24} alt="Menu" />
          </button>

          <button
            id="profileBtn"
            className="floating-profile-btn"
            aria-label="Profile"
            onClick={(e) => {
              e.stopPropagation();
              (window as unknown as { openProfileModal?: () => void }).openProfileModal?.();
            }}
          >
            <img id="profileBtnAvatar" src={profileAvatar} height={24} width={24} alt="Profile" />
          </button>
        </header>

        <div className="controls" ref={controlsRef}>
          <button
            id="searchToggle"
            ref={searchToggleRef}
            className="search-toggle-btn search-toggle-icon-btn"
            aria-label="Toggle Search"
          >
            <img src="res/search.svg" height={22} width={22} alt="Search" />
          </button>
          <input
            ref={searchRef}
            type="text"
            id="search"
            placeholder="Search cubeshapes..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value !== '' && controlsRef.current) {
                controlsRef.current.classList.add('search-expanded');
              }
            }}
          />
          <select
            id="sort"
            value={sortType}
            onChange={(e) => {
              setSortType(e.target.value as SortMode);
              const reorderBtn = document.getElementById('reorderButton');
              if (reorderBtn) reorderBtn.remove();
            }}
          >
            <option value="priority" data-short="Priority" data-xs="Priority">
              By Priority
            </option>
            <option value="probability" data-short="Highest Probability" data-xs="Highest prob.">
              Highest Probability
            </option>
            <option value="antiProbability" data-short="Lowest Probability" data-xs="Lowest Prob.">
              Lowest Probability
            </option>
          </select>
          <select
            id="learnFilter"
            value={learnFilter}
            onChange={(e) => setLearnFilter(e.target.value as LearnFilter)}
          >
            <option value="all" data-short="All" data-xs="All">
              Show All
            </option>
            <option value="learned" data-short="Learned" data-xs="✓">
              Show Only Learned
            </option>
            <option value="unlearned" data-short="Unlearned" data-xs="✗">
              Exclude Learned
            </option>
          </select>
        </div>

        <div className="grid" id="grid" ref={gridRef} dangerouslySetInnerHTML={{ __html: gridHTML }} />

        <footer>
          <p>Please contact for any edits.</p>
        </footer>
      </div>
      <SettingsModal />
    </>
  );
}
