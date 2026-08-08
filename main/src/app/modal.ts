/**
 * Modal stack / history helpers — ported from legacy index.js + modals.js.
 * Modals that need Esc/back-button handling push a close function.
 */

type CloseEntry = (() => void) | [() => void, ...unknown[]];

let closeModalStack: CloseEntry[] = [];
let sqgModalPopstateClosing = false;
let sqgModalSkipPopstate = false;

export function pushModalState(modalId: string, closeFn: () => void, ...args: unknown[]): void {
  if (typeof closeFn !== 'function') return;
  const entry: CloseEntry = args.length ? [closeFn, ...args] : closeFn;
  closeModalStack.push(entry);
  try {
    window.history.pushState({ sqgModal: true, modalId }, '');
  } catch {
    // Some browsers may reject pushState in unusual contexts; ignore silently.
  }
}

export function removeCloseModalFromStack(closeFn: () => void): void {
  if (typeof closeFn !== 'function') return;
  closeModalStack = closeModalStack.filter((entry) => {
    if (typeof entry === 'function') return entry !== closeFn;
    if (Array.isArray(entry) && typeof entry[0] === 'function') return entry[0] !== closeFn;
    return true;
  });
}

export function popCloseModalStack(): boolean {
  if (closeModalStack.length === 0) return false;
  const entry = closeModalStack.pop();
  if (typeof entry === 'function') {
    entry();
  } else if (Array.isArray(entry) && typeof entry[0] === 'function') {
    const fn: (() => void) = entry[0];
    const rest = entry.slice(1) as unknown[];
    (fn as (...args: unknown[]) => void)(...rest);
  }
  return true;
}

export function closeModalWithHistory(closeFn: (...args: unknown[]) => void, ...args: unknown[]): void {
  if (typeof closeFn !== 'function') return;
  removeCloseModalFromStack(closeFn);

  const shouldPopHistory =
    !sqgModalPopstateClosing && window.history.state && window.history.state.sqgModal;
  if (shouldPopHistory) {
    sqgModalSkipPopstate = true;
  }

  closeFn(...args);

  if (shouldPopHistory) {
    window.history.back();
  }
}

export function installModalStackGlobalListeners(): void {
  window.addEventListener('popstate', () => {
    if (sqgModalSkipPopstate) {
      sqgModalSkipPopstate = false;
      return;
    }
    if (closeModalStack.length > 0) {
      sqgModalPopstateClosing = true;
      popCloseModalStack();
      sqgModalPopstateClosing = false;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.getElementById('evilnessQuizModal')) return;
      if (closeModalStack.length > 0) {
        popCloseModalStack();
      }
    }
  });
}

/** Shared backdrop-close helper (legacy `attachOverlayClose`). */
export function attachOverlayClose(overlay: HTMLElement, closeFn: (e: Event) => void): void {
  let downOnSelf = false;
  overlay.addEventListener('mousedown', (e) => {
    downOnSelf = e.target === overlay;
  });
  overlay.addEventListener('mouseup', (e) => {
    const isOutsideClick = downOnSelf && e.target === overlay;
    downOnSelf = false;
    if (isOutsideClick) closeFn(e);
  });
}

// ── Scroll lock ──────────────────────────────────────────────────────────────
export function lockScroll(): void {
  (window as unknown as { modalScrollY: number }).modalScrollY = window.scrollY;
  document.body.style.top = `-${window.scrollY}px`;
  document.documentElement.classList.add('scroll-locked');
}

export function unlockScroll(): void {
  document.documentElement.classList.remove('scroll-locked');
  const y = (window as unknown as { modalScrollY?: number }).modalScrollY || 0;
  window.scrollTo(0, y);
}
