import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { CASES } from '../../data/cases';
import {
  checkForVariables,
  expandVariablesRecursive,
  generateX2Algorithm,
  normalizeScramble,
  normalizeScrambleFormat,
} from '../normalizer';

const LEGACY_PATH = fileURLToPath(
  new URL('../../../../legacy/js/tools/scrambleNormalizer.js', import.meta.url),
);

interface LegacyNormalizer {
  normalizeScramble: (input: string) => string;
  checkForVariables: (input: string) => boolean;
  expandVariablesRecursive: (input: string, table?: Record<string, string>) => string;
  normalizeScrambleFormat: (input: string) => string;
  generateX2Algorithm: (input: string) => string;
}

let legacy: LegacyNormalizer | null = null;

function getLegacy(): LegacyNormalizer {
  if (!legacy) {
    const src = readFileSync(LEGACY_PATH, 'utf8');
    const win: { ScrambleNormalizer?: LegacyNormalizer } = {};
    new Function('window', src)(win);
    legacy = win.ScrambleNormalizer!;
  }
  return legacy;
}

const legacyMod = getLegacy();

function buildCorpus(): string[] {
  const base: string[] = [];
  for (const c of CASES) {
    for (const alg of [...c.odd, ...c.even]) {
      base.push(alg);
      base.push(' ' + alg.split('/').join(' / ')); // spaced out
      base.push(alg + '/(0,0)'); // trailing no-op
      base.push('(0,0)/' + alg); // leading no-op
      base.push(alg.replace(')(', ')//(')); // doubled slash
    }
  }
  base.push('', '/', '//', '(1,0)/(1,0)', '(0,0)', '(6,6)', '(-3,2)/');
  return base;
}

describe('normalizer differential vs legacy', () => {
  const corpus = buildCorpus();

  it.each(corpus)('normalizeScramble(%j)', (input) => {
    expect(normalizeScramble(input)).toBe(legacyMod.normalizeScramble(input));
  });

  it.each(corpus)('normalizeScrambleFormat(%j)', (input) => {
    expect(normalizeScrambleFormat(input)).toBe(legacyMod.normalizeScrambleFormat(input));
  });

  it.each(corpus.filter((s) => s.includes('(')))('generateX2Algorithm(%j)', (input) => {
    expect(generateX2Algorithm(input)).toBe(legacyMod.generateX2Algorithm(input));
  });
});

describe('normalizer variable expansion vs legacy', () => {
  const table = { A: '(1,0)/(2,0)', B: '/', C: '(0,0)' };

  it.each(['*A*', '<A>', '(1,0)*A*/-', 'no vars here', '<A>*B*<A>'])(
    'expandVariablesRecursive(%j) matches legacy',
    (input) => {
      expect(expandVariablesRecursive(input, table)).toBe(
        legacyMod.expandVariablesRecursive(input, table),
      );
    },
  );

  it.each(['*A*', '<A>', '(1,0)*A*/-', 'no vars here'])(
    'checkForVariables(%j) matches legacy',
    (input) => {
      expect(checkForVariables(input)).toBe(legacyMod.checkForVariables(input));
    },
  );
});
