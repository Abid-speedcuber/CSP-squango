(function (global) {
  'use strict';

  function algToShapeIndex(scrambleText) {

    // ========================================
    // SHAPE INITIALIZATION (from getSpecificHex.js)
    // ========================================
    const Shape_halflayer = [0, 3, 6, 12, 15, 24, 27, 30, 48, 51, 54, 60, 63];
    const Shape_ShapeIdx = [];

    function initShapes() {
      let count = 0;
      for (let i = 0; i < 28561; i++) {
        const dr = Shape_halflayer[i % 13];
        const dl = Shape_halflayer[Math.floor(i / 13) % 13];
        const ur = Shape_halflayer[Math.floor(Math.floor(i / 13) / 13) % 13];
        const ul = Shape_halflayer[Math.floor(Math.floor(Math.floor(i / 13) / 13) / 13)];
        const value = ul << 18 | ur << 12 | dl << 6 | dr;

        let bitCount = 0;
        let temp = value;
        while (temp) {
          bitCount += temp & 1;
          temp >>= 1;
        }

        if (bitCount === 16) {
          Shape_ShapeIdx[count++] = value;
        }
      }
    }

    initShapes();

    // ========================================
    // MAIN PIPELINE
    // ========================================

    // Step 1: Invert the scramble (use consolidated from utils.js)
    const invertedScramble = window.invertScramble(scrambleText);

    // Step 2: Hexify the inverted scramble (use consolidated from utils.js)
    const { tlHex, blHex } = window.sq1AlgToHex(invertedScramble);

    // Step 3: Get shape index from hex (use consolidated from utils.js)
    const shapeIndex = window.getShapeIndexFromHex(tlHex, blHex);

    return {
      original: scrambleText,
      inverted: invertedScramble,
      tlHex: tlHex,
      blHex: blHex,
      shapeIndex: shapeIndex
    };
  }

  

})(window);