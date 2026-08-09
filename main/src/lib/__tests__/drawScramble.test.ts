import { describe, it, expect } from 'vitest';
import {
  visualizeFromHex,
  visualizeFromScramble,
  visualizeFromSolution,
  visualizeShapes,
} from '../drawScramble';

describe('drawScramble visualizer', () => {
  it('renders a valid two-svg layout from a hex code', () => {
    const html = visualizeFromHex('6e0cc804a2a6|0e8c64ee20c4');
    expect(html).toContain('<svg');
    expect(html).toContain('</svg>');
    expect(html).toContain('<polygon');
    expect(html).toContain('display: flex; align-items: center;');
  });

  it('applies custom colors through the color scheme', () => {
    const html = visualizeFromHex('6e0cc804a2a6|0e8c64ee20c4', 200, {
      topColor: '#123456',
    });
    expect(html).toContain('#123456');
  });

  it('supports default argument values for size', () => {
    const html = visualizeFromHex('6e0cc804a2a6|0e8c64ee20c4');
    expect(html).toContain('width="200"');
    expect(html).toContain('viewBox="0 0 200 200"');
  });

  it('renders from scramble notation', () => {
    const html = visualizeFromScramble('(1,0) / (3,3) / (-1,0)');
    expect(html).toContain('<svg');
    expect(html).toContain('<polygon');
  });

  it('renders from solution notation (inverted)', () => {
    const solutionHtml = visualizeFromSolution('(1,0) / (3,3) / (-1,0)');
    const scrambleHtml = visualizeFromScramble('(1,0) / (3,3) / (-1,0)');
    expect(solutionHtml).toContain('<svg');
    expect(scrambleHtml).toContain('<svg');
  });

  it('renders shape outlines from a shape index', () => {
    const html = visualizeShapes(0);
    expect(html).toContain('<svg');
    expect(html).toContain('<polygon');
  });

  it('renders shape outlines from a hex code with pipe separator', () => {
    const html = visualizeShapes('6e0cc804a2a6|0e8c64ee20c4');
    expect(html).toContain('<svg');
  });

  it('renders shape outlines from a scramble', () => {
    const html = visualizeShapes('(1,0) / (3,3) / (-1,0)');
    expect(html).toContain('<svg');
  });

  it('leniently ignores unrecognized tokens (legacy behavior)', () => {
    const html = visualizeFromScramble('not a scramble !!!');
    expect(html).toContain('<svg');
  });

  it('throws on malformed hex code length', () => {
    expect(() => visualizeFromHex('short')).toThrow(/25 characters/);
  });
});
