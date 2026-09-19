import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useAppStore } from '../app/store';
import {
  applyPreset,
  calculateAndCacheAllParityChunked,
  calculateAndCacheParityForCases,
  currentSortMode,
  currentPreset,
  hydratePresetDetails,
  hydrateSavedStateDetails,
  initializePreset,
  initializeSVGDataForCases,
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
// LoadingScreen intentionally disabled: the app now paints the shell first and
// uses inline skeleton cards while the heavier boot work runs after first paint.
// import LoadingScreen from './LoadingScreen';
import SettingsModal from './SettingsModal';

const CARD_HEIGHT_CACHE_KEY = 'sqg-card-height-estimates-v1';
const DEFAULT_SKELETON_CARD_HEIGHT = 360;
const MATT_SKELETON_CARD_HEIGHT = 430;
const MIN_INITIAL_CARD_COUNT = 3;
const MAX_INITIAL_CARD_COUNT = 18;
type GridChunkHandle = number;

function readCardHeightCache(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(CARD_HEIGHT_CACHE_KEY) || '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

function getGridColumnCount(grid: HTMLElement): number {
  const columns = window.getComputedStyle(grid).gridTemplateColumns;
  if (!columns || columns === 'none') return 1;
  return columns.split(' ').filter(Boolean).length || 1;
}

function getCardHeightCacheKey(preset: string, columns: number): string {
  return `${preset || 'unknown'}::${columns}`;
}

function getCachedCardHeight(preset: string, columns: number): number {
  const cached = readCardHeightCache()[getCardHeightCacheKey(preset, columns)];
  if (typeof cached === 'number' && Number.isFinite(cached) && cached > 0) return cached;
  return preset === "Matt's_Preset" ? MATT_SKELETON_CARD_HEIGHT : DEFAULT_SKELETON_CARD_HEIGHT;
}

function saveCardHeightEstimate(preset: string, columns: number, height: number): void {
  if (!Number.isFinite(height) || height <= 0) return;
  const cache = readCardHeightCache();
  const key = getCardHeightCacheKey(preset, columns);
  const previous = cache[key];
  // Ease downward so a temporarily short filtered view does not make the next
  // Matt/default skeleton too small again.
  cache[key] = previous ? Math.round(previous * 0.35 + height * 0.65) : Math.round(height);
  localStorage.setItem(CARD_HEIGHT_CACHE_KEY, JSON.stringify(cache));
}

function getInitialCardCount(columns: number, estimatedCardHeight: number): number {
  const controlsReserve = 190;
  const visibleRows = Math.ceil(Math.max(1, window.innerHeight - controlsReserve) / estimatedCardHeight);
  const rowsToRender = Math.max(2, visibleRows + 1);
  return Math.min(MAX_INITIAL_CARD_COUNT, Math.max(MIN_INITIAL_CARD_COUNT, columns * rowsToRender));
}

function scheduleGridChunk(callback: () => void): GridChunkHandle {
  return window.setTimeout(callback, 16);
}

function cancelGridChunk(id: GridChunkHandle): void {
  window.clearTimeout(id);
}

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
  const storeVersion = useAppStore();
  const [bootReady, setBootReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortTypeState] = useState<SortMode>(currentSortMode);
  const [learnFilter, setLearnFilterState] = useState<LearnFilter>('all');
  const [skeletonCardHeight, setSkeletonCardHeight] = useState(MATT_SKELETON_CARD_HEIGHT);
  const [initialCardCount, setInitialCardCount] = useState(MIN_INITIAL_CARD_COUNT);
  const [gridComplete, setGridComplete] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const parityStartedRef = useRef(false);

  const setSortType = useCallback((mode: SortMode) => {
    setSortTypeState(mode);
    setSortMode(mode);
  }, []);

  const setLearnFilter = useCallback((filter: LearnFilter) => {
    setLearnFilterState(filter);
  }, []);

  const filtered = useMemo(
    () => (bootReady ? computeFilteredData(searchTerm, sortType, learnFilter) : []),
    [searchTerm, sortType, learnFilter, bootReady, storeVersion],
  );

  const gridHTML = useMemo(
    () => (bootReady ? filtered.slice(0, initialCardCount).map((item) => renderCard(item)).join('') : ''),
    [filtered, bootReady, initialCardCount, storeVersion],
  );

  // Boot: paint the responsive shell first, then run preset/SVG/parity work.
  useEffect(() => {
    let cancelled = false;
    const afterFirstPaint = () => {
      window.setTimeout(() => {
        void (async () => {
          installWindowShims();
          if (!isFirstLoad) void initializePreset();
          if (cancelled) return;
          const columns = gridRef.current ? getGridColumnCount(gridRef.current) : 1;
          const estimatedCardHeight = getCachedCardHeight(currentPreset, columns);
          setSkeletonCardHeight(estimatedCardHeight);
          const initialCount = getInitialCardCount(columns, estimatedCardHeight);
          setInitialCardCount(initialCount);
          if (isFirstLoad) await applyPreset("Matt's_Preset", true, true, true, true, true);
          if (cancelled) return;
          const initialCases = computeFilteredData(searchTerm, sortType, learnFilter).slice(0, initialCount);
          if (needsParityRecalculation()) calculateAndCacheParityForCases(initialCases);
          initializeSVGDataForCases(initialCases);
          if (cancelled) return;
          setBootReady(true);
          applyHintVisibility();
          applyInstructionVisibility();
          updateProgress();
          if (isFirstLoad) {
            window.setTimeout(() => {
              void hydratePresetDetails("Matt's_Preset").then(() => {
                if (!cancelled) window.setTimeout(() => openGeneralNotesModal(), 100);
              });
            }, 0);
          } else {
            window.setTimeout(() => {
              if (!cancelled) hydrateSavedStateDetails();
            }, 0);
          }
        })();
      }, 0);
    };
    const frame = window.requestAnimationFrame(afterFirstPaint);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    updateSelectLabels();
    window.addEventListener('resize', updateSelectLabels);
    return () => window.removeEventListener('resize', updateSelectLabels);
  }, []);

  // Search toggle behavior
  const searchToggleRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const controlsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
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
  }, []);

  // Update progress bars whenever learned state changes
  useEffect(() => {
    if (bootReady) updateProgress();
  }, [bootReady, storeVersion]);

  useEffect(() => {
    if (!bootReady || !gridRef.current) return;

    setGridComplete(false);
    if (filtered.length <= initialCardCount) {
      setGridComplete(true);
      return;
    }

    const grid = gridRef.current;
    const columns = getGridColumnCount(grid);
    const chunkSize = Math.max(columns * 4, 12);
    let nextIndex = initialCardCount;
    let cancelled = false;
    let scheduledId = 0;

    const appendChunk = () => {
      if (cancelled || !gridRef.current) return;
      const end = Math.min(filtered.length, nextIndex + chunkSize);
      const nextItems = filtered.slice(nextIndex, end);
      initializeSVGDataForCases(nextItems);
      const html = nextItems.map((item) => renderCard(item)).join('');
      if (html) gridRef.current.insertAdjacentHTML('beforeend', html);
      nextIndex = end;
      if (nextIndex < filtered.length) {
        scheduledId = scheduleGridChunk(appendChunk);
      } else {
        updateProgress();
        applyHintVisibility();
        applyInstructionVisibility();
        setGridComplete(true);
      }
    };

    scheduledId = scheduleGridChunk(appendChunk);

    return () => {
      cancelled = true;
      if (scheduledId) cancelGridChunk(scheduledId);
    };
  }, [bootReady, filtered, initialCardCount, gridHTML]);

  useEffect(() => {
    if (!bootReady || !gridComplete || parityStartedRef.current || !needsParityRecalculation()) return;
    parityStartedRef.current = true;
    void calculateAndCacheAllParityChunked(5, () => updateProgress());
  }, [bootReady, gridComplete]);

  useEffect(() => {
    if (!bootReady || !gridRef.current) return;
    const grid = gridRef.current;
    const measure = () => {
      const columns = getGridColumnCount(grid);
      const cards = Array.from(grid.querySelectorAll<HTMLElement>('.card')).slice(0, Math.max(1, columns * 2));
      if (!cards.length) return;
      const maxHeight = Math.max(...cards.map((card) => card.getBoundingClientRect().height));
      saveCardHeightEstimate(currentPreset, columns, maxHeight);
      setSkeletonCardHeight(maxHeight);
    };

    const frame = window.requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    Array.from(grid.querySelectorAll<HTMLElement>('.card'))
      .slice(0, 10)
      .forEach((card) => observer.observe(card));

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [bootReady, gridHTML, storeVersion]);

  const title = 'SquanGo CSP';

  return (
    <>
      {/* <LoadingScreen hidden={true} /> */}
      <div className="container" id="mainContainer">
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

        {bootReady ? (
          <div className="grid" id="grid" ref={gridRef} dangerouslySetInnerHTML={{ __html: gridHTML }} />
        ) : (
          <div
            className="grid sqg-skeleton-grid"
            id="grid"
            ref={gridRef}
            aria-busy="true"
            style={{ '--sqg-card-estimated-height': `${Math.round(skeletonCardHeight)}px` } as CSSProperties}
          >
            {Array.from({ length: 12 }, (_, idx) => (
              <div className="card sqg-skeleton-card" key={idx}>
                <div className="card-header">
                  <div className="sqg-skeleton-line sqg-skeleton-title" />
                  <div className="sqg-skeleton-line sqg-skeleton-prob" />
                </div>
                <div className="card-images card-svg-container">
                  <div><span className="sqg-skeleton-shape" /></div>
                  <div><span className="sqg-skeleton-shape" /></div>
                </div>
                <div className="card-body">
                  <div className="sqg-skeleton-line" />
                  <div className="sqg-skeleton-line sqg-skeleton-line-short" />
                  <div className="sqg-skeleton-line" />
                  <div className="sqg-skeleton-line sqg-skeleton-line-mid" />
                </div>
              </div>
            ))}
          </div>
        )}

        <footer>
          <p>Please contact for any edits.</p>
        </footer>
      </div>
      <SettingsModal />
    </>
  );
}
