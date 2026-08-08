import type { ShapeSvgs } from './types';
import rawShapeSvgs from './shapeSvgs.json';

/** The default set of shape SVGs. Immutable source of truth. */
export const DEFAULT_SHAPE_SVGS: ShapeSvgs = rawShapeSvgs as ShapeSvgs;
