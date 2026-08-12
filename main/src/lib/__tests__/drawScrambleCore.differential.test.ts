import { test, expect, vi } from 'vitest';
import * as orig from './fixtures/drawScrambleCore.orig.js';
import * as ts from '../drawScrambleCore';

const HEXES = ['6e0cc804a2a6|0e8c64ee20c4', '011233455677|998bbaddcffe', 'f0e6d4c2b8a6|0e2c4a68f6d4'];

function deterministic<T>(fn: () => T): T {
  const spy = vi.spyOn(Math, 'random').mockReturnValue(0.42);
  try {
    return fn();
  } finally {
    spy.mockRestore();
  }
}

test('differential: TS port matches original JS output', () => {
  for (const hex of HEXES) {
    for (const [label, opts] of [
      ['default', {}],
      ['muted', { muted: true }],
      ['vertical', { isVertical: true }],
      ['noSlice', { showSlice: false }],
      ['size300', { size: 300 }],
      ['ring30', { ringDistance: 30 }],
      ['colorized', { colorScheme: { top: '#111111', front: '#ff0000' } }],
      ['noSide', { showSideColors: false }],
      ['sac2', { styleIndex: 0 }],
      ['sac2noside', { styleIndex: 0, showSideColors: false }],
    ] as [string, Record<string, unknown>][]) {
      const a = deterministic(() => orig.renderSquare1SVG(hex, opts as never));
      const b = deterministic(() => ts.renderSquare1SVG(hex, opts as never));
      expect(b, `${hex} ${label}`).toBe(a);
    }
    const a = deterministic(() => orig.renderSquare1LayerSVG(hex, {}));
    const b = deterministic(() => ts.renderSquare1LayerSVG(hex, {}));
    expect(b, `${hex} layer`).toBe(a);
  }
});

test('differential: layer + side-color variants match', () => {
  for (const hex of HEXES) {
    for (const layer of ['top', 'bottom']) {
      const a = deterministic(() => orig.renderSquare1LayerSVG(hex, { layer }));
      const b = deterministic(() => ts.renderSquare1LayerSVG(hex, { layer }));
      expect(b, `${hex} ${layer}`).toBe(a);
    }
  }
});
