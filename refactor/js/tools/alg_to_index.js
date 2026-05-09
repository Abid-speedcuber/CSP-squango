/* ==== FILE: js/tools/alg_to_index.js ==== */

(function () {
  'use strict';

  function algToShapeIndex(scrambleText) {

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

  // Export to browser global
  window.algToShapeIndex = algToShapeIndex;

})();


