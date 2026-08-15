/**
 * Expanded layer shapes + tracing-start marking.
 *
 * Expanded notation: 12 characters per half, one per sticker slot.
 *   '0' = edge slot, '2' = edge slot that is the tracing start,
 *   '11' = corner slot pair (or '3' on the first slot when marked).
 *
 * The tracing start is the FIRST unit of the shape's parity-tracer pattern
 * (binary: 0=edge, 1=corner). Marking maps that unit into the canonical
 * expanded form (derived from the half-shape-index hex) by reversing the
 * pattern and rotating it to align with the canonical orientation.
 */

import { LAYER_EXPANDED_SHAPES } from '../data/expandedShapes';
import { getShapePatterns } from './parityAnalyzer';

const EDGE_HEX_CHARS = new Set(['0', '2', '4', '6', '8', 'a', 'c', 'e']);

/** Expand a 12-char hex layer into expanded form (edge='0', corner='11'). */
export function expandHexLayer(layer: string): string {
  let out = '';
  for (const ch of layer) out += EDGE_HEX_CHARS.has(ch) ? '0' : '1';
  return out;
}

export interface ExpandedToken {
  piece: '0' | '1' | '2' | '3';
  type: 'edge' | 'corner';
  position: number;
}

/** Parse an expanded layer string into tokens (1-based slot positions). */
export function parseExpandedLayer(expanded: string): ExpandedToken[] {
  const tokens: ExpandedToken[] = [];
  let slotPos = 1;
  let i = 0;
  while (i < expanded.length) {
    const ch = expanded[i];
    if (ch === '0' || ch === '2') {
      tokens.push({ piece: ch, type: 'edge', position: slotPos });
      slotPos += 1;
      i += 1;
    } else {
      tokens.push({ piece: ch === '3' ? '3' : '1', type: 'corner', position: slotPos });
      slotPos += 2;
      i += 2;
    }
  }
  return tokens;
}

type UnitType = 'E' | 'C';

/** Units (E=edge, C=corner) of an expanded layer string. */
export function unitsOfExpanded(expanded: string): UnitType[] {
  const units: UnitType[] = [];
  let i = 0;
  while (i < expanded.length) {
    if (expanded[i] === '0' || expanded[i] === '2') {
      units.push('E');
      i += 1;
    } else {
      units.push('C');
      i += 2;
    }
  }
  return units;
}

function rotateRight<T>(arr: T[], r: number): T[] {
  const n = arr.length;
  const k = ((r % n) + n) % n;
  return arr.slice(n - k).concat(arr.slice(0, n - k));
}

/** Canonical expanded form of a layer shape (from the pregenerated data). */
export function getLayerExpanded(layerName: string): string | undefined {
  return LAYER_EXPANDED_SHAPES[layerName];
}

/**
 * Find the live parity-tracer pattern (from getShapePatterns) whose reversed
 * unit string is a rotation of the given canonical expanded layer.
 */
export function findLayerPattern(canonical: string): { pattern: string; name: string } | null {
  const canonUnits = unitsOfExpanded(canonical);
  const patterns = getShapePatterns();
  for (const [pattern, name] of Object.entries(patterns)) {
    const patUnits = pattern.split('').map((c): UnitType => (c === '1' ? 'C' : 'E'));
    if (patUnits.length !== canonUnits.length) continue;
    const rev = [...patUnits].reverse();
    for (let k = 0; k < canonUnits.length; k++) {
      if (rotateRight(rev, k).join('') === canonUnits.join('')) {
        return { pattern, name };
      }
    }
  }
  return null;
}

/**
 * Mark the tracing start (the pattern's FIRST unit) in a canonical expanded
 * layer: edge slot → '2', corner first slot → '3'.
 */
export function markTracingStart(canonical: string, pattern: string): string {
  const canonUnits = unitsOfExpanded(canonical);
  const patUnits = pattern.split('').map((c): UnitType => (c === '1' ? 'C' : 'E'));
  if (patUnits.length !== canonUnits.length) return canonical;

  const rev = [...patUnits].reverse();
  const n = canonUnits.length;
  let r = -1;
  for (let k = 0; k < n; k++) {
    if (rotateRight(rev, k).join('') === canonUnits.join('')) {
      r = k;
      break;
    }
  }
  if (r === -1) return canonical;

  const startUnit = ((patUnits.length - 1) + r) % patUnits.length;
  let slot = 0;
  for (let u = 0; u < startUnit; u++) slot += canonUnits[u] === 'E' ? 1 : 2;

  const out = canonical.split('');
  out[slot] = canonUnits[startUnit] === 'C' ? '3' : '2';
  return out.join('');
}

/**
 * Marked canonical expanded layer for a homepage layer shape name,
 * using the current live parity-tracer patterns.
 */
export function getMarkedLayerExpanded(layerName: string): string | undefined {
  const canonical = LAYER_EXPANDED_SHAPES[layerName];
  if (!canonical) return undefined;
  const match = findLayerPattern(canonical);
  if (!match) return canonical;
  return markTracingStart(canonical, match.pattern);
}
