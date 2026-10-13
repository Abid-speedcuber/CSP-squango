import type { AlgCase } from '../data/types';
import { renderCard } from './cardHTML';

/**
 * Keyed, in-place reconcile of the grid against `items`.
 *
 * Port of the legacy `_reconcileRender` (legacy/js/rendering.js). Instead of
 * tearing the whole list down with `innerHTML = ...` (which collapses the
 * document height and makes the browser clamp the scroll position back to the
 * top) this:
 *   - reuses existing card DOM nodes keyed by `data-case-name`,
 *   - only replaces a node when its freshly-generated markup actually differs,
 *   - removes nodes no longer in the result set,
 *   - and re-orders nodes to match the new sort order.
 *
 * Untouched cards keep their identity, so no repaint/flash and scroll position
 * is preserved. `renderCard` is the single source of truth for card content, so
 * comparing normalized `outerHTML` reliably catches every per-card change.
 */
export function reconcileGrid(grid: HTMLElement, items: readonly AlgCase[]): void {
  const placeholder = grid.querySelector('#_render_placeholder');
  if (placeholder) placeholder.remove();

  // Index existing cards by case name; drop anything unexpected.
  const existing = new Map<string, Element>();
  Array.from(grid.children).forEach((node) => {
    const name = node.getAttribute && node.getAttribute('data-case-name');
    if (name) existing.set(name, node);
    else node.remove();
  });

  // Remove cards that are no longer in the result set.
  const desired = new Set(items.map((item) => item.name));
  existing.forEach((node, name) => {
    if (!desired.has(name)) {
      node.remove();
      existing.delete(name);
    }
  });

  // Walk items in target order, reusing/updating/creating + positioning nodes.
  let prev: Element | null = null;
  for (const item of items) {
    const tmp = document.createElement('div');
    tmp.innerHTML = renderCard(item);
    const fresh = tmp.firstElementChild;
    if (!fresh) continue;

    let node = existing.get(item.name);
    if (node) {
      // Compare browser-normalized serializations so identical cards are left
      // in place (no DOM mutation, no repaint).
      if (node.outerHTML !== fresh.outerHTML) {
        node.replaceWith(fresh);
        node = fresh;
      }
    } else {
      node = fresh;
    }
    existing.set(item.name, node);

    // Ensure node sits immediately after the previously placed node.
    const ref: ChildNode | null = prev ? prev.nextSibling : grid.firstChild;
    if (node !== ref) grid.insertBefore(node, ref);
    prev = node;
  }
}
