import { hideInstructions, setHideInstructions, setHideParenthesis, setShowHints } from './state';

/** Port of legacy `applyHintVisibility` (modals.js). */
export function applyHintVisibility(): void {
  if (showHintsValue()) {
    document.body.classList.remove('hide-hints');
  } else {
    document.body.classList.add('hide-hints');
  }
}

function showHintsValue(): boolean {
  return localStorage.getItem('showHints') !== null
    ? localStorage.getItem('showHints') === 'true'
    : true;
}

/** Port of legacy `applyInstructionVisibility` (modals.js). */
export function applyInstructionVisibility(): void {
  const instructionBtns = document.querySelectorAll(
    '.settings-info-btn, .homepage-info-btn, .training-info-btn, .case-detail-info-btn, .instruction-btn',
  );
  instructionBtns.forEach((btn) => {
    (btn as HTMLElement).style.display = hideInstructions ? 'none' : 'flex';
  });
}

/** Port of legacy `toggleHints` (modals.js). */
export function toggleHints(isChecked: boolean): void {
  setShowHints(isChecked);
  applyHintVisibility();
}

/** Port of legacy `toggleHideInstructions` (modals.js). */
export function toggleHideInstructions(isChecked: boolean): void {
  setHideInstructions(isChecked);
  applyInstructionVisibility();
}

/** Port of legacy `toggleHideParenthesis` (modals.js). */
export function toggleHideParenthesis(isChecked: boolean): void {
  setHideParenthesis(isChecked);
}

/** Port of legacy `applyAlgorithmFontSize` (modals.js). */
export function applyAlgorithmFontSize(size: number): void {
  const style = document.getElementById('algorithm-font-size-style') || document.createElement('style');
  style.id = 'algorithm-font-size-style';
  style.textContent = `
        .algo-line, .algo-interactive {
            font-size: ${size}px !important;
        }
    `;
  if (!style.parentNode) {
    document.head.appendChild(style);
  }
}
