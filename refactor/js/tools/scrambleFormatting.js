/* ==== FILE: js/tools/scrambleFormatting.js ==== */

// sq1ColorizerLib.js
(function (global) {
  'use strict';

  function detectSpecialSlash(scramble) {
    const match = scramble.match(/`\/`/);
    return match ? match.index : null;
  }

  function getShapePattern(scramble) {
    const detector = global.ParityTracerLibrary && global.ParityTracerLibrary.detectShapesFromHex;
    if (typeof detector !== 'function') return null;

    const { tlHex, blHex } = global.scrambleToHex(scramble);
    const shape = detector(tlHex, blHex);
    return { top: shape.topPattern, bot: shape.bottomPattern };
  }

  function processScramble(scramble) {
    const slashIndex = detectSpecialSlash(scramble);
    if (slashIndex === null) return { color: null, html: scramble };

    const beforeSlash = scramble.substring(0, slashIndex);
    const shape = getShapePattern(beforeSlash);
    if (!shape) return { color: null, html: scramble };
    const { top, bot } = shape;

    let color = null;
    if (top === '10101010' && bot === '01010101') color = 'blue';
    else if (top === '01010101' && bot === '10101010') color = 'red';

    const before = scramble.substring(0, slashIndex);
    const after = scramble.substring(slashIndex + 3);

    return {
      color,
      before,
      after,
      html: color ? `${before}/<span style="color:${color}">${after}</span>` : scramble
    };
  }

  global.SQ1ColorizerLib = { processScramble };

})(globalThis);
