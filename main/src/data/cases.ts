import type { AlgCase } from './types';
import rawCases from './cases.json';

export const CASES: AlgCase[] = rawCases as AlgCase[];

const caseIdsByKey = new Map(CASES.map((item) => [item.key, item.id]));
const casesById = new Map(CASES.map((item) => [item.id, item]));

/** Original case names in stable numeric-ID order, for legacy-name UI surfaces. */
export const CASE_NAMES = [...CASES]
  .sort((a, b) => a.id - b.id)
  .map((item) => item.key);

/** Resolve both numeric IDs and legacy technical keys at import/UI boundaries. */
export function getCaseId(ref: unknown): number | undefined {
  if (typeof ref === 'number' && Number.isInteger(ref)) {
    return casesById.has(ref) ? ref : undefined;
  }
  if (typeof ref !== 'string') return undefined;
  const legacyId = caseIdsByKey.get(ref);
  if (legacyId !== undefined) return legacyId;
  if (!/^[1-9]\d*$/.test(ref)) return undefined;
  const id = Number(ref);
  return casesById.has(id) ? id : undefined;
}

export function getCaseKey(ref: unknown): string | undefined {
  const id = getCaseId(ref);
  return id === undefined ? undefined : casesById.get(id)?.key;
}

export function findCase(ref: number | string): AlgCase | undefined {
  const id = getCaseId(ref);
  return id === undefined ? undefined : casesById.get(id);
}
