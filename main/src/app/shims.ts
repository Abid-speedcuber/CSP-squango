/**
 * Window shims backing the inline `on*` handlers emitted by ported HTML
 * generators (cardHTML.ts, algDisplay.ts, notes.ts). The markup is produced as
 * static strings, so it cannot close over module functions — hence the
 * `window.*` bridge.
 */
import { getShapePath, stripParenthesisIfNeeded } from './algDisplay';
import { algToShapeIndex, invertScramble } from '../lib/cube';
import { normalizeScramble } from '../lib/normalizer';
import { getParityText } from '../lib/parityAnalyzer';
import {
  visualizeFromHex,
  visualizeFromScramble,
  visualizeFromSolution,
  visualizeShapes,
} from '../lib/drawScramble';
import {
  adjustPriority,
  enhancedAccess,
  evilnessMap,
  getDisplayName,
  hideParenthesis,
  learnedCases,
  learningCases,
  plannedLevels,
  saveState,
  toggleLearned,
} from './state';
import {
  attemptCloseGeneralNotesModal,
  attemptCloseNotesModal,
  closeGeneralNotesInfoModal,
  closeNotesInfoModal,
  openNotesModal,
  saveGeneralNotes,
  saveNotes,
  showGeneralNotesInfoModal,
  showNotesInfoModal,
  toggleEditGeneralNotes,
} from './notes';
import { openUnifiedSettings } from './settingsUI';
import { installSidebarShims } from './sidebar';
import { installEditCaseShims, openEditCaseModal } from './editCase';
import { installTrainingShims, openTrainingModal } from './training';
import { installParityTracerShims } from './parityTracer';
import { scrambleFromState } from '../lib/solver';
import { installAnimateAlgShims, openAnimateAlgModal } from './animateAlg';
import { installQuickEditShims } from './quickEdit';

// ── Algo popup (legacy rendering.js showAlgoPopup/hideAlgoPopup) ─────────────
let activePopup: HTMLElement | null = null;
let activePopupElement: HTMLElement | null = null;
let popupHoverTimeout: ReturnType<typeof setTimeout> | null = null;

function closeAlgoPopup(isPermanent: boolean): void {
  if (isPermanent) {
    if (activePopup) {
      activePopup.remove();
      activePopup = null;
      activePopupElement = null;
    }
  } else {
    const hoverPopup = document.querySelector('.algo-popup:not(.permanent)');
    if (hoverPopup) hoverPopup.remove();
    if (popupHoverTimeout) {
      clearTimeout(popupHoverTimeout);
      popupHoverTimeout = null;
    }
  }
}

function showAlgoPopup(element: HTMLElement, algo: string, isPermanent: boolean): void {
  if (popupHoverTimeout) {
    clearTimeout(popupHoverTimeout);
    popupHoverTimeout = null;
  }

  if (isPermanent && activePopupElement === element) {
    closeAlgoPopup(true);
    return;
  }

  if (isPermanent && activePopup) {
    activePopup.remove();
    activePopup = null;
    activePopupElement = null;
  }

  if (!isPermanent && activePopup && activePopupElement !== element) {
    return;
  }

  if (!isPermanent) {
    const existingHover = document.querySelector('.algo-popup:not(.permanent)');
    if (existingHover) existingHover.remove();
  }

  if (algo === 'Done!' || !algo || algo.trim() === '') return;

  const setup = invertScramble(algo);
  const shapePath = getShapePath(algo);

  const popup = document.createElement('div');
  popup.className = 'algo-popup' + (isPermanent ? ' permanent' : '');
  popup.dataset.isPermanent = String(isPermanent);

  const setupId = 'popup-setup-' + Math.random().toString(36).substr(2, 9);

  const popupFontFamily = hideParenthesis ? 'Arial, sans-serif' : 'monospace';
  const displaySetup = stripParenthesisIfNeeded(setup);
  popup.innerHTML = `
        <div class="popup-label">Setup:</div>
        <div id="${setupId}" class="popup-setup" style="font-family: ${popupFontFamily}; font-size: 0.8rem; margin-bottom: 8px;" title="Click to analyze parity">${displaySetup}</div>
        ${shapePath ? `
            <div class="popup-label">Shape Path:</div>
            <div id="${setupId}_shapepath" style="font-size: 0.75rem; line-height: 1.6; cursor: pointer; padding: 4px; border-radius: 3px; transition: background 0.15s;" title="Click to animate algorithm">
                ${shapePath
                  .map((step, idx) => {
                    const arrow = idx < shapePath.length - 1 ? ' → ' : '';
                    return `<span class="popup-step-span">${step.top}/${step.bottom}</span>${arrow}`;
                  })
                  .join('')}
            </div>
        ` : ''}
    `;

  document.body.appendChild(popup);

  const setupElement = document.getElementById(setupId);
  if (setupElement) {
    setupElement.onclick = (e) => {
      e.stopPropagation();
      closeAlgoPopup(isPermanent);
      const opener = (window as unknown as Record<string, unknown>).openNewParityAnalysis;
      if (typeof opener === 'function') (opener as (s: string) => void)(setup);
    };
    setupElement.onmouseenter = () => {
      setupElement.style.background = 'var(--hover-bg)';
    };
    setupElement.onmouseleave = () => {
      setupElement.style.background = 'var(--surface2)';
    };
  }

  const shapePathElement = document.getElementById(setupId + '_shapepath');
  if (shapePathElement) {
    shapePathElement.onclick = (e) => {
      e.stopPropagation();
      closeAlgoPopup(isPermanent);

      const caseName = element.getAttribute('data-case') || '';
      const parityType = element.getAttribute('data-parity') || '';
      const displayName = getDisplayName(caseName);

      openAnimateAlgModal(algo, displayName, parityType);
    };
    shapePathElement.onmouseenter = () => {
      shapePathElement.style.background = 'var(--hover-bg)';
    };
    shapePathElement.onmouseleave = () => {
      shapePathElement.style.background = 'transparent';
    };
  }

  // Position popup
  const rect = element.getBoundingClientRect();
  const popupRect = popup.getBoundingClientRect();

  let top = rect.bottom + 10;
  let left = rect.left;

  if (top < rect.top + rect.height + 5 || top + popupRect.height > window.innerHeight - 10) {
    top = rect.top - popupRect.height - 10;
  }

  if (top < rect.bottom && top + popupRect.height > rect.top) {
    top = rect.top;

    if (left < window.innerWidth - rect.right) {
      left = rect.right + 10;
    } else {
      left = rect.left - popupRect.width - 10;
    }

    if (left + popupRect.width > window.innerWidth - 10) {
      left = rect.left - popupRect.width - 10;
    }
  }

  if (left + popupRect.width > window.innerWidth - 10) {
    left = window.innerWidth - popupRect.width - 10;
  }
  if (left < 10) left = 10;
  if (top < 10) top = 10;

  if (left === rect.left || left === window.innerWidth - popupRect.width - 10) {
    if (top > rect.top && top < rect.bottom) {
      top = rect.top - popupRect.height - 10;
      if (top < 10) {
        top = rect.bottom + 10;
      }
    }
  }

  popup.style.top = top + 'px';
  popup.style.left = left + 'px';

  const scrollHandler = () => {
    closeAlgoPopup(isPermanent);
    window.removeEventListener('scroll', scrollHandler, true);
    if (clickHandler) document.removeEventListener('mousedown', clickHandler);
  };
  window.addEventListener('scroll', scrollHandler, true);

  let clickHandler: ((e: MouseEvent) => void) | null = null;
  if (isPermanent) {
    activePopup = popup;
    activePopupElement = element;

    setTimeout(() => {
      clickHandler = (e) => {
        if (!popup.contains(e.target as Node) && e.target !== element) {
          closeAlgoPopup(true);
          document.removeEventListener('mousedown', clickHandler!);
          window.removeEventListener('scroll', scrollHandler, true);
        }
      };
      document.addEventListener('mousedown', clickHandler);
    }, 100);
  }
}

// ── Context menu (legacy rendering.js showContextMenu) ───────────────────────
function showContextMenu(caseName: string, event: MouseEvent): void {
  event.stopPropagation();

  const existingMenu = document.getElementById('caseContextMenu');
  if (existingMenu) existingMenu.remove();

  const isLearned = learnedCases.has(caseName);
  const isLearning = learningCases.has(caseName);
  const priorityLevel = plannedLevels.get(caseName) || 4;
  const priorityNames = ['Highest', 'Higher', 'High', 'Normal', 'Low', 'Lower', 'Lowest'];

  const menu = document.createElement('div');
  menu.id = 'caseContextMenu';
  menu.style.cssText = `
        position: fixed;
        background: var(--surface);
        border-bottom: 1px solid var(--surface-border);
        border-radius: 6px;
        box-shadow: 0 4px 12px var(--card-shadow);
        z-index: 10000;
        padding: 4px 0;
        min-width: 180px;
        max-width: 200px;
    `;

  const statusIndicator = document.createElement('div');
  statusIndicator.style.cssText = `
        padding: 6px 16px;
        font-size: 0.75rem;
        color: var(--text-secondary);
        border-bottom: 1px solid var(--surface-border);
        margin-bottom: 4px;
        text-align: center;
        font-weight: 600;
    `;

  if (isLearned) {
    statusIndicator.textContent = 'Learned';
  } else if (isLearning) {
    statusIndicator.textContent = 'Learning';
  } else {
    statusIndicator.textContent = `Priority: ${priorityNames[priorityLevel - 1]}`;
  }
  menu.appendChild(statusIndicator);

  type MenuItem = { divider?: boolean; label?: string; action?: () => void; disabled?: boolean };
  const menuItems: MenuItem[] = [];

  if (!isLearned && !isLearning) {
    menuItems.push(
      {
        label: 'Move Up in Priority',
        action: () => {
          adjustPriority(caseName, -1);
          const newPriority = plannedLevels.get(caseName) || 4;
          statusIndicator.textContent = `Priority: ${priorityNames[newPriority - 1]}`;
        },
        disabled: priorityLevel === 1,
      },
      {
        label: 'Move Down in Priority',
        action: () => {
          adjustPriority(caseName, 1);
          const newPriority = plannedLevels.get(caseName) || 4;
          statusIndicator.textContent = `Priority: ${priorityNames[newPriority - 1]}`;
        },
        disabled: priorityLevel === 7,
      },
      { divider: true },
    );
  }

  menuItems.push(
    {
      label: 'Add/Edit Notes',
      action: () => {
        menu.remove();
        openNotesModal(caseName);
      },
    },
    {
      label: 'Train This Case',
      action: () => {
        menu.remove();
        openTrainingModal(caseName);
      },
    },
    {
      label: 'Edit Case',
      action: () => {
        menu.remove();
        openEditCaseModal(caseName);
      },
    },
  );

  menuItems.push(
    { divider: true },
    {
      label: 'Close',
      action: () => {
        menu.remove();
      },
    },
  );

  menuItems.forEach((item) => {
    if (item.divider) {
      const divider = document.createElement('div');
      divider.style.cssText = 'height: 1px; background: var(--surface-border); margin: 4px 0;';
      menu.appendChild(divider);
    } else {
      const option = document.createElement('div');
      option.textContent = item.label || '';
      option.style.cssText = `
                padding: 8px 16px;
                cursor: ${item.disabled ? 'not-allowed' : 'pointer'};
                font-size: 0.9rem;
                color: ${item.disabled ? 'var(--text-muted)' : 'var(--text-ui)'};
                opacity: ${item.disabled ? '0.5' : '1'};
            `;

      if (!item.disabled) {
        option.onmouseover = () => {
          option.style.background = 'var(--sidebar-item-hover)';
        };
        option.onmouseout = () => {
          option.style.background = 'transparent';
        };
        option.onclick = item.disabled ? null : (item.action as () => void);
      }

      menu.appendChild(option);
    }
  });

  document.body.appendChild(menu);

  const rect = (event.target as HTMLElement).closest('.icon-btn')?.getBoundingClientRect();
  let top = rect ? rect.bottom + 5 : event.clientY;
  let left = rect ? rect.right - 180 : event.clientX;

  setTimeout(() => {
    const menuRect = menu.getBoundingClientRect();

    if (top + menuRect.height > window.innerHeight - 10) {
      top = (rect ? rect.top : event.clientY) - menuRect.height - 5;
    }

    if (top < 10) {
      top = 10;
    }

    left = rect ? rect.right - menuRect.width : event.clientX;

    if (left + menuRect.width > window.innerWidth - 10) {
      left = window.innerWidth - menuRect.width - 10;
    }

    if (left < 10) {
      left = 10;
    }

    menu.style.top = top + 'px';
    menu.style.left = left + 'px';
  }, 0);

  setTimeout(() => {
    const closeMenu = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node) && e.target !== event.target) {
        menu.remove();
        document.removeEventListener('mousedown', closeMenu);
        window.removeEventListener('scroll', scrollCloseMenu, true);
      }
    };

    const scrollCloseMenu = () => {
      menu.remove();
      document.removeEventListener('mousedown', closeMenu);
      window.removeEventListener('scroll', scrollCloseMenu, true);
    };

    document.addEventListener('mousedown', closeMenu);
    window.addEventListener('scroll', scrollCloseMenu, true);
  }, 100);
}

// ── Install all shims ────────────────────────────────────────────────────────
export function installWindowShims(): void {
  const w = window as unknown as Record<string, unknown>;

  installSidebarShims();
  installEditCaseShims();
  installTrainingShims();
  installParityTracerShims();
  installAnimateAlgShims();
  installQuickEditShims();

  // Algorithm-analysis bridges used by edit-case, quick-edit, trainer, tracer.
  w.algToShapeIndex = algToShapeIndex;
  w.ScrambleNormalizer = { normalizeScramble };
  w.ParityAnalyzerLib = { getParityText };

  // Training / scramble-generation bridge (legacy sq1Tools).
  w.sq1Tools = { scrambleFromState };

  // Scramble visualizer bridges (training modal, tracer, animate-alg, settings).
  w.Square1Visualizer = { visualizeFromHex, visualizeFromScramble, visualizeFromSolution, visualizeShapes };
  w.visualizeFromHex = visualizeFromHex;
  w.visualizeFromScramble = visualizeFromScramble;
  w.visualizeFromSolution = visualizeFromSolution;
  w.visualizeShapes = visualizeShapes;

  // Edit-case modal state bridges referenced by inline HTML.
  Object.defineProperty(w, 'enhancedAccess', { get: () => enhancedAccess, configurable: true });
  w.evilnessMap = evilnessMap;
  w.saveState = saveState;

  w.toggleLearned = (name: string, event: MouseEvent) => {
    event.stopPropagation();
    toggleLearned(name, false);
  };

  w.showContextMenu = showContextMenu;
  w.showAlgoPopup = showAlgoPopup;
  w.hideAlgoPopup = closeAlgoPopup;

  w.showNotesInfoModal = showNotesInfoModal;
  w.closeNotesInfoModal = closeNotesInfoModal;
  w.attemptCloseNotesModal = attemptCloseNotesModal;
  w.saveNotes = saveNotes;
  w.toggleEditGeneralNotes = toggleEditGeneralNotes;
  w.saveGeneralNotes = saveGeneralNotes;
  w.attemptCloseGeneralNotesModal = attemptCloseGeneralNotesModal;
  w.showGeneralNotesInfoModal = showGeneralNotesInfoModal;
  w.closeGeneralNotesInfoModal = closeGeneralNotesInfoModal;

  w.openUnifiedSettings = (tab: string) => {
    const valid = ['homescreen', 'parity', 'trainer', 'animate'];
    openUnifiedSettings((valid.includes(tab) ? tab : 'homescreen') as 'homescreen' | 'parity' | 'trainer' | 'animate');
  };
}
