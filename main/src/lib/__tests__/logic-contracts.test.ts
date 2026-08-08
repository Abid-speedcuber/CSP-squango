import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { CASES } from '../../data/cases';
import { applyScramble, createSolvedState } from '../cube';
import { generateScrambleFromHex, parseHexFormat } from '../scramble';
import {
  analyzeParity,
  buildClusters,
  buildUnits,
  matchPattern,
  validateCorners,
  type ShapeUnit,
} from '../parityAnalyzer';
import {
  DEFAULT_SHAPE_PATTERNS,
  traceScrambleToScrambleShapePath,
  traceScrambleToSolutionShapePath,
  traceSolutionToScrambleShapePath,
  traceSolutionToSolutionShapePath,
} from '../shapeTrace';
import { processScramble } from '../colorizer';

const LEGACY_DIR = fileURLToPath(new URL('../../../../legacy/js', import.meta.url));

function makeLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
  };
}

type LegacyParityFn = (scr: string, _: unknown, cornerMode: string) => string;

let legacyParity: LegacyParityFn | null = null;

function getLegacyParity(): LegacyParityFn {
  if (!legacyParity) {
    const win: Record<string, unknown> = {};
    const localStorage = makeLocalStorage();
    // The legacy app reads move amounts as `tok.t || tok.top` (utils.js:109-110),
    // so a (x,0)/(0,x) move becomes undefined and corrupts the traced state. We
    // compare against the logically-correct (??-fixed) computation instead; the
    // bug is intentionally NOT reproduced in main (see cube.ts applyScramble).
    const utilsSrc = readFileSync(`${LEGACY_DIR}/tools/utils.js`, 'utf8')
      .replace('const top = tok.t || tok.top;', 'const top = tok.t ?? tok.top;')
      .replace('const bot = tok.b || tok.bottom;', 'const bot = tok.b ?? tok.bottom;');
    new Function('window', utilsSrc)(win);
    new Function('window', readFileSync(`${LEGACY_DIR}/tools/alg_to_index.js`, 'utf8'))(win);
    new Function(
      'window',
      'localStorage',
      readFileSync(`${LEGACY_DIR}/tools/cales-parity-tracer.js`, 'utf8'),
    )(win, localStorage);
    legacyParity = (win as unknown as {
      ParityAnalyzerLib: { getParityText: LegacyParityFn };
    }).ParityAnalyzerLib.getParityText;
  }
  return legacyParity;
}

describe('scramble hex parser', () => {
  it('parses a real hex state and generates a scramble for it', () => {
    const hex = '011233455677|998bbaddcffe'; // solved square/square
    const cubie = parseHexFormat(hex);
    expect(cubie.ul).toBe(0x011233);
    const solvedResult = generateScrambleFromHex(hex);
    // solved state needs no scramble (legacy returns the same message)
    expect(solvedResult.scramble).toBeNull();
    expect(solvedResult.error).toBe('Could not generate scramble for this state.');
  });

  it('rejects malformed hex', () => {
    const result = generateScrambleFromHex('0123');
    expect(result.scramble).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it('rejects empty input', () => {
    const result = generateScrambleFromHex('   ');
    expect(result.error).toBe('Please enter a hex format state first.');
  });
});

describe('shapeTrace', () => {
  it('a no-op scramble stays square/square', () => {
    expect(traceScrambleToScrambleShapePath('(0,0)')).toBe('Sq/Sq');
  });

  it('solution helpers reverse the scramble path', () => {
    const scr = '(3,1)/(-1,0)/(2,0)';
    const scramblePath = traceScrambleToScrambleShapePath(scr).split(' → ');
    const solutionPath = traceScrambleToSolutionShapePath(scr).split(' → ');
    expect(solutionPath).toEqual([...scramblePath].reverse());
    expect(traceSolutionToScrambleShapePath(scr).split(' → ')).toEqual(scramblePath);
    expect(traceSolutionToSolutionShapePath(scr).split(' → ')).toEqual([...scramblePath].reverse());
    expect(scramblePath.length).toBeGreaterThan(1);
  });

  it('every step names a known shape', () => {
    const scr = '(1,0)/(-1,0)/(2,0)/(1,0)/';
    const steps = traceScrambleToScrambleShapePath(scr).split(' → ');
    expect(steps.length).toBeGreaterThan(1);
    const known = new Set(Object.values(DEFAULT_SHAPE_PATTERNS));
    for (const step of steps) {
      const [top, bottom] = step.split('/');
      expect(known.has(top) || top === 'Unknown').toBe(true);
      expect(known.has(bottom) || bottom === 'Unknown').toBe(true);
    }
  });
});

describe('colorizer', () => {
  it('passes through scrambles without the marker', () => {
    const result = processScramble('(1,0)/(-1,0)');
    expect(result.color).toBeNull();
    expect(result.html).toBe('(1,0)/(-1,0)');
  });

  it('splits around the marker even when no alignment color applies', () => {
    const result = processScramble('(1,0)/`/`(2,0)/(1,0)');
    expect(result.before).toBe('(1,0)/');
    expect(result.after).toBe('(2,0)/(1,0)');
    expect(['var(--double-align-color)', 'var(--double-misalign-color)', null]).toContain(
      result.color,
    );
    if (result.color === null) {
      expect(result.html).toBe('(1,0)/`/`(2,0)/(1,0)');
    } else {
      expect(result.html).toContain('span');
    }
  });
});

describe('parityAnalyzer', () => {
  it('a solved cube validates, builds units, and matches square', () => {
    const state = createSolvedState();
    expect(validateCorners(state).ok).toBe(true);
    const top = buildUnits(state, 0);
    expect(top.types).toBe('CECECECE');
    expect(matchPattern(top.types).name).toBe('Square');
  });

  it('buildClusters produces 8 corner + 8 edge slots for a full shape', () => {
    // solved-style layer: corner pair (2 slots) then edge (1 slot), repeated
    const fullShape = new Array(24).fill(0).map((_, i) => (i % 3 !== 2 ? 1 : 0));
    const slots = buildClusters(fullShape);
    const corners = slots.filter((s) => s.type === 'corner').length;
    const halfCorners = slots.filter((s) => s.type === 'half-corner').length;
    const edges = slots.filter((s) => s.type === 'edge').length;
    expect(corners).toBe(8);
    expect(halfCorners).toBe(0);
    expect(edges).toBe(8);
  });

  it('analyzeParity matches the legacy library on every case algorithm', () => {
    const legacyGetParity = getLegacyParity();
    for (const c of CASES) {
      for (const alg of [...c.odd, ...c.even]) {
        for (const mode of ['clockwise', 'counterclockwise'] as const) {
          expect(analyzeParity(alg, mode), `${c.name} ${alg} ${mode}`).toBe(
            legacyGetParity(alg, {}, mode),
          );        }
      }
    }
  });
});

describe('parity helpers (solved state invariants)', () => {
  it('analyzeParity of a solved cube agrees with legacy', () => {
    const legacyGetParity = getLegacyParity();
    for (const mode of ['clockwise', 'counterclockwise'] as const) {
      expect(analyzeParity('', mode)).toBe(legacyGetParity('', {}, mode));
    }
  });

  it('applyScramble leaves solved state solved for a no-op', () => {
    const state = applyScramble('(0,0)/(6,6)');
    const top: ShapeUnit[] = buildUnits(state, 0).units;
    expect(top.length).toBe(8);
  });
});
