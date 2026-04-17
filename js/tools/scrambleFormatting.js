// sq1ColorizerLib.js
(function (window) {
  'use strict';

  // === USE CONSOLIDATED FUNCTIONS FROM utils.js ===
  const theEdgePiecesLettersInSolvedState = window.edgePieces;
  const whichCornerPieceIsPartnerOfWhichCornerPiece = window.cornerPartner;
  const applyScrambleToGetResultingStateArray = window.applyScramble;

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

  window.SQ1ColorizerLib = { processScramble };

})(window);