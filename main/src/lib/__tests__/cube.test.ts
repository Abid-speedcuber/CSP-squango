import { describe, it, expect } from 'vitest';

import { CASES, findCase } from '../../data/cases';
import { SHAPE_INDEX, SHAPE_INDEX_MAP, shapeIndexForCase } from '../../data/shapeIndex';
import { LAYER_EXPANDED_SHAPES } from '../../data/expandedShapes';
import { BOTTOM_LAYER_START_SLOT, markExpandedSlot } from '../expandedShape';
import { getMarkedExpandedForLayer, renderLayerShapeSVG } from '../homepageShapes';

import {
  algToShapeIndex,
  applyScramble,
  createSolvedState,
  cubeFromShape,
  getShapeIndexFromHex,
  invertScramble,
  scrambleToHex,
  shapeIndexToHex,
  stateToHex,
} from '../cube';
import { randomCube, scrambleFromState } from '../solver';
import { normalizeScramble } from '../normalizer';

describe('data integrity', () => {
  it('has exactly 90 cases, each with a shapeIndex entry and renderable shape SVGs', () => {
    expect(CASES.length).toBe(90);
    for (const c of CASES) {
      expect(SHAPE_INDEX_MAP[c.name]).toBeDefined();
      expect(LAYER_EXPANDED_SHAPES[c.top]).toBeDefined();
      expect(LAYER_EXPANDED_SHAPES[c.bottom]).toBeDefined();
      const topSVG = renderLayerShapeSVG(c.top);
      const bottomSVG = renderLayerShapeSVG(c.bottom);
      expect(topSVG, `no SVG generated for ${c.top}`).toBeTruthy();
      expect(bottomSVG, `no SVG generated for ${c.bottom}`).toBeTruthy();
      expect(topSVG).toContain('<svg');
      expect(c.odd.length).toBeGreaterThan(0);
      expect(c.even.length).toBeGreaterThan(0);
    }
  });

  it('every shapeIndex org/mir index is within the valid range', () => {
    for (const entry of SHAPE_INDEX) {
      for (const idx of [...(entry.org ?? []), ...(entry.mir ?? [])]) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThanOrEqual(3677);
      }
    }
  });

  it('findCase finds a case by exact name', () => {
    const first = CASES[0];
    expect(findCase(first.name)?.name).toBe(first.name);
    expect(findCase('does-not-exist')).toBeUndefined();
  });
});

describe('bottom-layer absolute tracing start (slot 6)', () => {
  it('marks character index 6 of the canonical expanded shape for every bottom layer', () => {
    for (const c of CASES) {
      const canonical = LAYER_EXPANDED_SHAPES[c.bottom];
      const marked = markExpandedSlot(canonical, BOTTOM_LAYER_START_SLOT);
      expect(marked[BOTTOM_LAYER_START_SLOT], `${c.bottom} mark at slot ${BOTTOM_LAYER_START_SLOT}`).toMatch(/[23]/);
      const bottomSVG = renderLayerShapeSVG(c.bottom, undefined, 'bottom');
      expect(bottomSVG, `no bottom SVG generated for ${c.bottom}`).toBeTruthy();
      expect(bottomSVG).toContain('<svg');
    }
  });

  it('carries the square tracing start through the display rotation', () => {
    const canonical = LAYER_EXPANDED_SHAPES.Square_bottom;
    // Trace start stays on the reference frame (character 6).
    expect(markExpandedSlot(canonical, BOTTOM_LAYER_START_SLOT)).toBe('011011211011');
    // Display rotates to the upright orientation, mark still on an edge.
    const display = getMarkedExpandedForLayer('Square_bottom', 'bottom') ?? '';
    expect(display).toBe('110112110110');
    expect(display.replace(/2/g, '0').replace(/3/g, '1')).toBe('110110110110');
    expect(display[5]).toBe('2');
  });

  it('leaves other bottom layers unrotated', () => {
    for (const c of CASES) {
      if (c.bottom === 'Square_bottom') continue;
      expect(getMarkedExpandedForLayer(c.bottom, 'bottom')).toBe(
        markExpandedSlot(LAYER_EXPANDED_SHAPES[c.bottom], BOTTOM_LAYER_START_SLOT),
      );
    }
  });
});

describe('hex encoding round trips', () => {
  for (const c of CASES) {
    it(`shapeIndexToHex <-> getShapeIndexFromHex round trip for ${c.name}`, () => {
      const idx = shapeIndexForCase(c.name)!;
      const hex = shapeIndexToHex(idx);
      const [tl, bl] = hex.split('|');
      expect(getShapeIndexFromHex(tl, bl)).toBe(idx);
    });
  }
});

describe('case algorithms map to their recorded shapes', () => {
  for (const c of CASES) {
    it(`odd alg of ${c.name} has shape ${c.name}`, () => {
      const expected = shapeIndexForCase(c.name)!;
      for (const alg of c.odd) {
        expect(algToShapeIndex(alg).shapeIndex).toBe(expected);
      }
    });
    it(`even alg of ${c.name} has shape ${c.name}`, () => {
      const expected = shapeIndexForCase(c.name)!;
      for (const alg of c.even) {
        expect(algToShapeIndex(alg).shapeIndex).toBe(expected);
      }
    });
  }
});

describe('applyScramble / stateToHex consistency', () => {
  it('stateToHex(applyScramble(scr)) equals scrambleToHex(scr)', () => {
    for (const c of CASES) {
      for (const alg of c.odd) {
        expect(stateToHex(applyScramble(alg))).toBe(scrambleToHex(alg));
      }
    }
  });

  it('createSolvedState hexifies to a valid shape that round-trips', () => {
    const solved = createSolvedState();
    const hex = stateToHex(solved);
    const [tl, bl] = hex.split('|');
    const idx = getShapeIndexFromHex(tl, bl);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThanOrEqual(3677);
    const [tl2, bl2] = shapeIndexToHex(idx).split('|');
    expect(getShapeIndexFromHex(tl2, bl2)).toBe(idx);
  });
});

describe('invertScramble', () => {
  it('double-inversion returns an equivalent scramble', () => {
    for (const c of CASES) {
      for (const alg of [...c.odd, ...c.even]) {
        const roundTripped = invertScramble(invertScramble(alg));
        expect(normalizeScramble(roundTripped)).toBe(normalizeScramble(alg));
      }
    }
  });

  it('inverting then applying toggles back to solved', () => {
    for (const c of CASES) {
      const alg = c.odd[0];
      const scrambled = applyScramble(alg);
      const back = applyScramble(invertScramble(alg), scrambled);
      expect(stateToHex(back)).toBe(stateToHex(createSolvedState()));
    }
  });
});

describe('solver', () => {
  it(
    'generates a scramble for every case shape and it stays in that shape',
    () => {
      for (const c of CASES) {
        const idx = shapeIndexForCase(c.name)!;
        const cubie = cubeFromShape(idx);
        const scramble = scrambleFromState(cubie);
        expect(scramble, `no scramble for ${c.name}`).toBeTruthy();
        // Mirror legacy restoftheapp.js getCaseNameFromScramble: it inverts the
        // scramble and then algToShapeIndex inverts internally again, netting the
        // forward (scrambled) shape. A single algToShapeIndex(scramble) would
        // measure the inverse path's shape, which is undefined for solver scrambles.
        const hex = algToShapeIndex(invertScramble(scramble!));
        expect(hex.shapeIndex, `${c.name} scramble: ${scramble}`).toBe(idx);
      }
    },
    120000,
  );

  it(
    'random cubes can all be solved',
    () => {
      for (let i = 0; i < 25; i++) {
        const cubie = randomCube(i);
        const scramble = scrambleFromState(cubie);
        expect(scramble).toBeTruthy();
        expect(scramble!.length).toBeGreaterThan(0);
      }
    },
    120000,
  );
});
