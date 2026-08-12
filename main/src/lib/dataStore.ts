/**
 * Central data-store for the case/shape datasets.
 *
 * Ported from the Refactor branch's `js/data-store.js`. Builds lookup maps for
 * the algorithm cases and shape-index entries, resolves aliases (shape entries
 * that share a canonical index with a case but have no case of their own), and
 * validates the datasets at startup.
 */
import { CASES } from '../data/cases';
import { SHAPE_INDEX, SHAPE_INDEX_MAP } from '../data/shapeIndex';
import type { AlgCase, ShapeIndexEntry } from '../data/types';

const caseList: AlgCase[] = Array.isArray(CASES) ? CASES : [];
const shapeList: ShapeIndexEntry[] = Array.isArray(SHAPE_INDEX) ? SHAPE_INDEX : [];

const canonicalShapeIndex: Record<string, number> = SHAPE_INDEX_MAP || {};

const casesByName = new Map(caseList.map((item) => [item.name, item]));
const shapeEntriesByName = new Map(shapeList.map((item) => [item.name, item]));
const canonicalIndexByCase = new Map(
  Object.entries(canonicalShapeIndex).map(([name, index]) => [name, Number(index)]),
);
const caseNameByShapeIndex = new Map<number, string>();

for (const [caseName, index] of canonicalIndexByCase) {
  if (Number.isFinite(index)) caseNameByShapeIndex.set(index, caseName);
}

for (const entry of shapeList) {
  for (const index of [...(entry.org || []), ...(entry.mir || [])]) {
    if (!caseNameByShapeIndex.has(index)) {
      caseNameByShapeIndex.set(index, entry.name);
    }
  }
}

for (const [caseName, index] of canonicalIndexByCase) {
  if (shapeEntriesByName.has(caseName) || !Number.isFinite(index)) continue;

  const aliasedEntry = shapeList.find(
    (entry) =>
      (entry.org && entry.org.includes(index)) || (entry.mir && entry.mir.includes(index)),
  );

  if (aliasedEntry) {
    shapeEntriesByName.set(caseName, aliasedEntry);
  }
}

function validateData(): string[] {
  const errors: string[] = [];
  const seenNames = new Set<string>();

  for (const item of caseList) {
    if (!item || typeof item.name !== 'string' || !item.name.trim()) {
      errors.push('Case is missing a valid name.');
      continue;
    }
    if (seenNames.has(item.name)) errors.push(`Duplicate case name: ${item.name}`);
    seenNames.add(item.name);

    if (!Array.isArray(item.odd)) errors.push(`${item.name} is missing odd algorithms.`);
    if (!Array.isArray(item.even)) errors.push(`${item.name} is missing even algorithms.`);
    if (!Number.isFinite(item.probability)) errors.push(`${item.name} has an invalid probability.`);
    if (!shapeEntriesByName.has(item.name)) errors.push(`${item.name} is missing shape-index data.`);
    if (!canonicalIndexByCase.has(item.name))
      errors.push(`${item.name} is missing a canonical shape index.`);
  }

  for (const entry of shapeList) {
    if (!entry || typeof entry.name !== 'string') continue;
    const hasCaseOrAlias =
      casesByName.has(entry.name) ||
      [...canonicalIndexByCase.keys()].some((caseName) => shapeEntriesByName.get(caseName) === entry);
    if (!hasCaseOrAlias) errors.push(`${entry.name} has shape-index data but no algorithm case.`);
  }

  return errors;
}

export const CSPData = Object.freeze({
  cases: caseList,
  shapeEntries: shapeList,
  casesByName,
  shapeEntriesByName,
  canonicalIndexByCase,
  caseNameByShapeIndex,
  getCase: (name: string): AlgCase | null => casesByName.get(name) || null,
  getShapeEntry: (name: string): ShapeIndexEntry | null => shapeEntriesByName.get(name) || null,
  getCanonicalShapeIndex: (name: string): number | null =>
    canonicalIndexByCase.get(name) ?? null,
  getCaseNameByShapeIndex: (index: number): string | null =>
    caseNameByShapeIndex.get(Number(index)) || null,
  hasCase: (name: string): boolean => casesByName.has(name),
  getCaseNames: (): string[] => caseList.map((item) => item.name),
  validate: validateData,
});

const validationErrors = validateData();
if (validationErrors.length > 0) {
  console.warn('[CSPData] Data validation found issues:', validationErrors);
}
