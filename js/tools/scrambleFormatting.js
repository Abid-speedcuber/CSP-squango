// sq1ColorizerLib.js
(function (global) {
  'use strict';

  const theEdgePiecesLettersInSolvedState = new Set(['C', 'F', 'I', 'L', 'M', 'P', 'S', 'V']);
  const whichCornerPieceIsPartnerOfWhichCornerPiece = {
    A:'B', B:'A', D:'E', E:'D', G:'H', H:'G', J:'K', K:'J',
    N:'O', O:'N', Q:'R', R:'Q', T:'U', U:'T', W:'X', X:'W'
  };

  function giveBackArrayOfLettersInSolvedStatePlease() {
    return 'ABCDEFGHIJKLMNOPQRSTUVWX'.split('');
  }

  function rotateOneSectionOfArrayByKStepsPlz(arr, start, len, k) {
    const n = ((k % len) + len) % len;
    if (n === 0) return;
    const seg = arr.slice(start, start + len);
    const out = [];
    for (let i = 0; i < len; i++) out[(i + n) % len] = seg[i];
    for (let i = 0; i < len; i++) arr[start + i] = out[i];
  }

  function doTheSliceSwappingOperationNowPlease(arr) {
    for (let i = 0; i < 6; i++) [arr[i], arr[12 + i]] = [arr[12 + i], arr[i]];
  }

  function* breakScrambleIntoTokensGeneratorFunction(s) {
    let i = 0;
    const L = s.length;
    const ws = /\s/;
    const int = /^([+-]?\d+)/;

    const skip = () => { while (i < L && ws.test(s[i])) i++; };

    while (true) {
      skip();
      if (i >= L) return;

      const ch = s[i];
      if (ch === '(') {
        i++;
        skip();
        let m = s.slice(i).match(int);
        if (!m) { i++; continue; }
        const t = +m[1];
        i += m[1].length;
        skip();
        if (s[i] === ',') i++;
        skip();
        m = s.slice(i).match(int);
        if (!m) { i++; continue; }
        const b = +m[1];
        i += m[1].length;
        skip();
        if (s[i] === ')') i++;
        skip();
        const hadSlash = (s[i] === '/');
        if (hadSlash) i++;
        yield { k: 'tb', t, b, slash: hadSlash };
        continue;
      }
      if (ch === '/') {
        i++;
        yield { k: '/' };
        continue;
      }
      i++;
    }
  }

  function applyScrambleToGetResultingStateArray(scr) {
    const a = giveBackArrayOfLettersInSolvedStatePlease();
    for (const tok of breakScrambleIntoTokensGeneratorFunction(scr)) {
      if (tok.k === 'tb') {
        rotateOneSectionOfArrayByKStepsPlz(a, 0, 12, tok.t);
        rotateOneSectionOfArrayByKStepsPlz(a, 12, 12, tok.b);
        if (tok.slash) doTheSliceSwappingOperationNowPlease(a);
      } else {
        doTheSliceSwappingOperationNowPlease(a);
      }
    }
    return a;
  }

  function buildTheUnitsStringFromStateArrayStartingAtPosition(state, start) {
    const units = [];
    let i = 0;
    while (i < 12) {
      const ch = state[start + i];
      if (theEdgePiecesLettersInSolvedState.has(ch)) {
        units.push('E'); i += 1; continue;
      }
      const nextCh = state[start + ((i + 1) % 12)];
      if (whichCornerPieceIsPartnerOfWhichCornerPiece[ch] === nextCh) {
        units.push('C'); i += 2;
      } else {
        units.push('C'); i += 1;
      }
    }
    return units.join('');
  }

  function getTheShapePatternsForTopAndBottomLayersPls(state) {
    const topPattern = buildTheUnitsStringFromStateArrayStartingAtPosition(state, 0);
    const botPattern = buildTheUnitsStringFromStateArrayStartingAtPosition(state, 12);
    return { top: topPattern, bot: botPattern };
  }

  function findWhereIsTheSpecialSlashWithBackticksInScramble(scramble) {
    const match = scramble.match(/`\/`/);
    return match ? match.index : null;
  }

  function processScramble(scramble) {
    const slashIndex = findWhereIsTheSpecialSlashWithBackticksInScramble(scramble);
    if (slashIndex === null) return { color: null, html: scramble };

    const beforeSlash = scramble.substring(0, slashIndex);
    const state = applyScrambleToGetResultingStateArray(beforeSlash);
    const { top, bot } = getTheShapePatternsForTopAndBottomLayersPls(state);

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

  // Export as module or global
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { processScramble };
  } else {
    global.SQ1ColorizerLib = { processScramble };
  }

})(this);
