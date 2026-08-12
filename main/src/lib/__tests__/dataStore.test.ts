import { test, expect } from 'vitest';
import { CSPData } from '../dataStore';
import { CASES } from '../../data/cases';

test('data store exposes all 90 cases', () => {
  expect(CSPData.cases.length).toBe(90);
  expect(CSPData.cases).toBe(CASES);
  expect(CSPData.getCaseNames().length).toBe(90);
});

test('data store validates cleanly', () => {
  expect(CSPData.validate()).toEqual([]);
});

test('getCase resolves cases by name', () => {
  expect(CSPData.getCase('Kite/Square')?.name).toBe('Kite/Square');
  expect(CSPData.getCase('Does Not Exist')).toBeNull();
  expect(CSPData.hasCase('Kite/Square')).toBe(true);
  expect(CSPData.hasCase('nope')).toBe(false);
});

test('canonical shape index lookups resolve', () => {
  expect(CSPData.getCanonicalShapeIndex('8/Star')).toBe(58);
  expect(CSPData.getCaseNameByShapeIndex(58)).toBe('8/Star');
  expect(CSPData.getCanonicalShapeIndex('missing')).toBeNull();
});

test('shape entries resolve directly or via alias', () => {
  const direct = CSPData.getShapeEntry('6/Paired Edges');
  expect(direct).not.toBeNull();
  expect(direct?.org).toBeTruthy();

  // A case whose shape entry must be found via its canonical index.
  const byAlias = CSPData.getShapeEntry('Kite/Square');
  expect(byAlias).not.toBeNull();
  expect(byAlias?.org).toContain(CSPData.getCanonicalShapeIndex('Kite/Square') as number);
});
