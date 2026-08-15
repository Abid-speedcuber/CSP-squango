/** A single cubeshape parity case definition. */
export interface AlgCase {
  name: string;
  top: string;
  bottom: string;
  odd: string[];
  even: string[];
  /** Indices of the odd algorithms that flip parity. */
  oddPar?: number[];
  /** Indices of the even algorithms that flip parity. */
  evenPar?: number[];
  probability: number;
}

/** Cubie permutation indices for a shape, used by the parity tracer. */
export interface ShapeIndexEntry {
  name: string;
  /** Original (non-mirrored) cubie indices. */
  org?: number[];
  /** Mirrored cubie indices. */
  mir?: number[];
}

/** Maps each case name to its canonical cubie shape index. */
export type ShapeIndexMap = Record<string, number>;
