import type { ShapeIndexEntry, ShapeIndexMap } from './types';
import rawShapeIndex from './shapeIndex.json';
import rawShapeIndexMap from './shapeIndexMap.json';

export const SHAPE_INDEX: ShapeIndexEntry[] = rawShapeIndex as ShapeIndexEntry[];

/** Case name -> canonical cubie shape index (string-keyed in the source data). */
const RAW_INDEX_MAP = rawShapeIndexMap as Record<string, string>;

export const SHAPE_INDEX_MAP: ShapeIndexMap = Object.fromEntries(
  Object.entries(RAW_INDEX_MAP).map(([name, index]) => [name, Number(index)]),
);

export function shapeIndexForCase(name: string): number | undefined {
  return SHAPE_INDEX_MAP[name];
}
