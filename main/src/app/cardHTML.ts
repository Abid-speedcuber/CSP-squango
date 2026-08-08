import type { AlgCase } from '../data/types';
import { escapeRegex, renderAlgorithmWithPopup, sanitizeNoteHTML } from './algDisplay';
import { highlightPartialMatch, searchMatches } from './filter';
import {
  cachedParityAlgorithms,
  comments,
  evilnessFactor,
  getDisplayName,
  getPlannedLevel,
  hideParenthesis,
  isCaseEvil,
  learnedCases,
  learningCases,
  perCaseSubtitles,
  svgData,
} from './state';

const algoFontFamily = () =>
  hideParenthesis ? 'Arial, sans-serif' : 'Consolas, Menlo, Monaco, "Courier New", monospace';

function highlightCaseName(displayName: string, caseName: string): string {
  if (!searchMatches.has(caseName)) return displayName;
  const matchInfo = searchMatches.get(caseName)!;

  if (matchInfo.type === 'simple') {
    const regex = new RegExp(`(${escapeRegex(matchInfo.searchTerm)})`, 'gi');
    return displayName.replace(
      regex,
      '<mark style="background-color: var(--search-highlight-bg); padding: 0 2px; border-radius: 2px;">$1</mark>',
    );
  }
  if (matchInfo.type === 'slashed-normal') {
    const parts = displayName.split('/');
    if (parts.length === 2) {
      const part1 = highlightPartialMatch(parts[0].trim(), matchInfo.searchPart1);
      const part2 = highlightPartialMatch(parts[1].trim(), matchInfo.searchPart2);
      return `${part1}/${part2}`;
    }
  }
  if (matchInfo.type === 'slashed-flipped') {
    const parts = displayName.split('/');
    if (parts.length === 2) {
      const part1 = highlightPartialMatch(parts[0].trim(), matchInfo.searchPart2);
      const part2 = highlightPartialMatch(parts[1].trim(), matchInfo.searchPart1);
      return `${part1}/${part2}`;
    }
  }
  return displayName;
}

/**
 * Port of the legacy `renderCard`. Returns the exact card markup the legacy
 * app produced, including inline event-handler attributes (the window shims in
 * `shims.ts` back those handlers).
 */
export function renderCard(item: AlgCase): string {
  const prob = ((item.probability / 3678) * 100).toFixed(3);
  const isLearned = learnedCases.has(item.name);
  const isLearning = learningCases.has(item.name);
  const plannedLevel = getPlannedLevel(item.name);

  let cardClass = '';
  if (isLearned) {
    cardClass = 'learned';
  } else if (isLearning) {
    cardClass = 'learning';
  } else {
    cardClass = `planned priority-${plannedLevel}`;
  }

  const comment = comments.get(item.name) || '';

  const cachedAlgs = cachedParityAlgorithms.get(item.name);
  const oddAlgos = cachedAlgs ? cachedAlgs.odd : [];
  const evenAlgos = cachedAlgs ? cachedAlgs.even : [];

  const topSVG = svgData[item.top] || '';
  const bottomSVG = svgData[item.bottom] || '';

  const fontFamily = algoFontFamily();
  const oddAlgoDisplay =
    oddAlgos.length > 0
      ? renderAlgorithmWithPopup(oddAlgos, item.name, 'odd', hideParenthesis, fontFamily)
      : '<div class="algo-line" style="color: var(--text-muted); font-style: italic;">No algorithms available</div>';
  const evenAlgoDisplay =
    evenAlgos.length > 0
      ? renderAlgorithmWithPopup(evenAlgos, item.name, 'even', hideParenthesis, fontFamily)
      : '<div class="algo-line" style="color: var(--text-muted); font-style: italic;">No algorithms available</div>';

  const learnedIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="${isLearned ? 'var(--card-learned-border)' : isLearning ? 'var(--card-learning-border)' : 'var(--border-color)'}" stroke-width="2">
        <path d="M20 6L9 17l-5-5"/>
    </svg>`;

  const threeDotsIcon = `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;">
        <circle cx="12" cy="5" r="2"/>
        <circle cx="12" cy="12" r="2"/>
        <circle cx="12" cy="19" r="2"/>
    </svg>`;

  const displayName = getDisplayName(item.name);
  const highlightedName = highlightCaseName(displayName, item.name);

  const subtitle = perCaseSubtitles.has(item.name)
    ? `<div class="card-subtitle" style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 400; margin-top: 2px;">${perCaseSubtitles.get(
        item.name,
      )}</div>`
    : '';

  const titleStyle = evilnessFactor
    ? isCaseEvil(item.name)
      ? 'color: var(--bad-case);'
      : 'color: var(--good-case);'
    : '';

  const escapedName = item.name.replace(/'/g, "\\'");

  return `
        <div class="card ${cardClass}" data-case-name="${item.name}">
            <div class="card-header">
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <div class="card-title" style="${titleStyle}">
                        ${highlightedName}
                        ${subtitle}
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0;">
                        <div class="probability">${prob}%</div>
                        <div class="card-header-actions">
                            <div class="icon-btn" onmousedown="event.stopPropagation(); toggleLearned('${escapedName}', event)" oncontextmenu="event.preventDefault();">
                                ${learnedIcon}
                            </div>
                            <div class="icon-btn" onclick="event.stopPropagation(); showContextMenu('${escapedName}', event)" style="color: var(--text-secondary);">
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
                <div class="algo-section">
                    <span class="algo-label">Odd:</span>
                    ${oddAlgoDisplay}
                </div>
                <div class="algo-section">
                    <span class="algo-label">Even:</span>
                    ${evenAlgoDisplay}
                </div>
                ${comment ? `<div style="font-size: 0.65rem; color: var(--text-secondary); margin-top: 8px; white-space: pre-wrap;">${sanitizeNoteHTML(comment)}</div>` : ''}
            </div>
        </div>
    `;
}
