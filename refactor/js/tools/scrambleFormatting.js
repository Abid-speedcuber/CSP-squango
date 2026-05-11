/* ==== FILE: js/tools/scrambleFormatting.js ==== */

// sq1ColorizerLib.js
(function (global) {
  'use strict';

  // EDGE_PIECES, CORNER_PARTNER, getSolvedState, rotateLayer, doSlice, parseScramble → utils.js

  function buildUnitString(state, start) {
    const units = [];
    let i = 0;
    while (i < 12) {
      const ch = state[start + i];
      if (EDGE_PIECES.has(ch)) {
        units.push('E'); i += 1; continue;
      }
      const nextCh = state[start + ((i + 1) % 12)];
      if (CORNER_PARTNER[ch] === nextCh) {
        units.push('C'); i += 2;
      } else {
        units.push('C'); i += 1;
      }
    }
    return units.join('');
  }

  function C_getShapePattern(state) {
    const topPattern = buildUnitString(state, 0);
    const botPattern = buildUnitString(state, 12);
    return { top: topPattern, bot: botPattern };
  }

  function C_ApplyScramble(scr) {
    const a = getSolvedState();
    for (const move of parseScramble(scr)) {
      if (move.type === 'turn') {
        rotateLayer(a, 0, 12, move.top);
        rotateLayer(a, 12, 12, move.bottom);
        if (move.hasSlash) doSlice(a);
      } else {
        doSlice(a);
      }
    }
    return a;
  }

  function detectSpecialSlash(scramble) {
    const match = scramble.match(/`\/`/);
    return match ? match.index : null;
  }

  function processScramble(scramble) {
    const slashIndex = detectSpecialSlash(scramble);
    if (slashIndex === null) return { color: null, html: scramble };

    const beforeSlash = scramble.substring(0, slashIndex);
    const state = C_ApplyScramble(beforeSlash);
    const { top, bot } = C_getShapePattern(state);

    let color = null;
    if (top === 'CECECECE' && bot === 'ECECECEC') color = 'blue';
    else if (top === 'ECECECEC' && bot === 'CECECECE') color = 'red';

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


