import type { AlgCase } from '../data/types';
import { data, getDisplayName, learnedCases, learningCases, plannedCases, plannedLevels, type SortMode } from './state';

export type LearnFilter = 'all' | 'learned' | 'unlearned';

export type SearchMatch =
  | { type: 'simple'; searchTerm: string }
  | { type: 'slashed-normal'; searchPart1: string; searchPart2: string }
  | { type: 'slashed-flipped'; searchPart1: string; searchPart2: string };

/** Stores search matches per case name for highlight rendering. */
export const searchMatches = new Map<string, SearchMatch>();

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Port of the legacy `filterAndSort` computation. Pure: returns the filtered +
 * sorted list of cases and populates `searchMatches` for highlighting.
 */
export function computeFilteredData(
  searchTermRaw: string,
  sortType: SortMode,
  learnFilter: LearnFilter,
): AlgCase[] {
  const searchTerm = searchTermRaw.toLowerCase().trim();
  searchMatches.clear();

  const filteredData = data.filter((item) => {
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
    const titleHasSlash = displayName.includes('/');
    const searchHasSlash = searchTerm.includes('/');

    if (!searchHasSlash) {
      if (displayNameLower.includes(searchTerm)) {
        searchMatches.set(item.name, { type: 'simple', searchTerm });
        return true;
      }
      return false;
    }

    if (searchHasSlash && titleHasSlash) {
      const searchParts = searchTerm.split('/').map((p) => p.trim());
      const titleParts = displayName.split('/').map((p) => p.trim());

      if (searchParts.length === 2 && titleParts.length === 2) {
        const [searchPart1, searchPart2] = searchParts;
        const [titlePart1, titlePart2] = titleParts;
        const t1 = titlePart1.toLowerCase();
        const t2 = titlePart2.toLowerCase();

        const normalMatch = t1.includes(searchPart1) && t2.includes(searchPart2);
        const flippedMatch = t2.includes(searchPart1) && t1.includes(searchPart2);

        if (normalMatch) {
          searchMatches.set(item.name, { type: 'slashed-normal', searchPart1, searchPart2 });
          return true;
        }
        if (flippedMatch) {
          searchMatches.set(item.name, { type: 'slashed-flipped', searchPart1, searchPart2 });
          return true;
        }
      }
      return false;
    }

    return false;
  });

  if (sortType === 'priority') {
    filteredData.sort((a, b) => b.probability - a.probability);
    filteredData.sort((a, b) => {
      const aIsLearning = learningCases.has(a.name);
      const bIsLearning = learningCases.has(b.name);
      const aIsPlanned = plannedCases.has(a.name);
      const bIsPlanned = plannedCases.has(b.name);
      const aIsLearned = learnedCases.has(a.name);
      const bIsLearned = learnedCases.has(b.name);

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

  return filteredData;
}

/** Partial-match highlight used by slashed search modes. */
export function highlightPartialMatch(text: string, searchTerm: string): string {
  if (!searchTerm) return text;
  const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
  return text.replace(regex, '<mark class="search-hl">$1</mark>');
}
