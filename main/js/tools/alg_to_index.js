/* ==== FILE: js/tools/alg_to_index.js ==== */

import {
  hexToShapeIndex,
  invertScramble,
  scrambleToHex
} from '../utils.js?v=esm-20260511-2';

export function algToShapeIndex(scrambleText) {

  // MAIN PIPELINE: Invert -> hexify -> get shape index
  const invertedScramble = invertScramble(scrambleText);
  const { tlHex, blHex } = scrambleToHex(invertedScramble);
  const shapeIndex = hexToShapeIndex(tlHex, blHex);

  return {
    original: scrambleText,
    inverted: invertedScramble,
    tlHex,
    blHex,
    shapeIndex
  };
}

if (typeof window !== 'undefined') {
  window.algToShapeIndex = algToShapeIndex;
}

