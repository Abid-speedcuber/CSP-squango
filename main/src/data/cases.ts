import type { AlgCase } from './types';
import rawCases from './cases.json';

export const CASES: AlgCase[] = rawCases as AlgCase[];

export function findCase(name: string): AlgCase | undefined {
  return CASES.find((c) => c.name === name);
}
