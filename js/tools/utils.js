// ========================================
// Square-1 Core Utility Functions
// Single source of truth for shared primitives
// ========================================

(function (lib) {
    'use strict';

    // === CORE CONSTANTS ===
    lib.pieceLabels = {
        A: "YOG", B: "YOG", C: "YG", D: "YGR", E: "YGR", F: "YR",
        G: "YRB", H: "YRB", I: "YB", J: "YBO", K: "YBO", L: "YO",
        M: "WR", N: "WRG", O: "WRG", P: "WG", Q: "WGO", R: "WGO", S: "WO",
        T: "WOB", U: "WOB", V: "WB", W: "WBR", X: "WBR"
    };

    lib.edgePieces = new Set(['C', 'F', 'I', 'L', 'M', 'P', 'S', 'V']);

    lib.cornerPartner = {
        A: 'B', B: 'A', D: 'E', E: 'D', G: 'H', H: 'G', J: 'K', K: 'J',
        N: 'O', O: 'N', Q: 'R', R: 'Q', T: 'U', U: 'T', W: 'X', X: 'W'
    };

    lib.pieceToHex = {
        'YO': '0', 'YOG': '77', 'YG': '6', 'YGR': '55', 'YR': '4', 'YRB': '33',
        'YB': '2', 'YBO': '11', 'WR': 'a', 'WRG': 'bb', 'WG': '8', 'WGO': '99',
        'WO': 'e', 'WOB': 'ff', 'WB': 'c', 'WBR': 'dd'
    };

    lib.hexToPiece = {
        '0': 'YO', '77': 'YOG', '6': 'YG', '55': 'YGR', '4': 'YR', '33': 'YRB',
        '2': 'YB', '11': 'YBO', 'a': 'WR', 'bb': 'WRG', '8': 'WG', '99': 'WGO',
        'e': 'WO', 'ff': 'WOB', 'c': 'WB', 'dd': 'WBR'
    };

    lib.cornerIdentifier = {
        A: 'AB', B: 'AB', D: 'DE', E: 'DE', G: 'GH', H: 'GH', J: 'JK', K: 'JK',
        N: 'NO', O: 'NO', Q: 'QR', R: 'QR', T: 'TU', U: 'TU', W: 'WX', X: 'WX'
    };

    // === ROTATION HELPERS ===
    lib.rotateString = function (str, k) {
        const n = str.length;
        const rot = ((k % n) + n) % n;
        return str.slice(rot) + str.slice(0, rot);
    };

    lib.rotateArray = function (arr, k) {
        const n = arr.length;
        const rot = ((k % n) + n) % n;
        return arr.slice(rot).concat(arr.slice(0, rot));
    };

    // === CORE FUNCTIONS ===
    lib.createSolvedState = function () {
        return 'ABCDEFGHIJKLMNOPQRSTUVWX'.split('');
    };

    lib.rotateSection = function (arr, start, len, k) {
        const n = ((k % len) + len) % len;
        if (n === 0) return;
        const seg = arr.slice(start, start + len);
        const out = [];
        for (let i = 0; i < len; i++) out[(i + n) % len] = seg[i];
        for (let i = 0; i < len; i++) arr[start + i] = out[i];
    };

    lib.sliceSwap = function (arr) {
        for (let i = 0; i < 6; i++) [arr[i], arr[12 + i]] = [arr[12 + i], arr[i]];
    };

    lib.tokenizeScramble = function* (s) {
        let i = 0, len = s.length;
        const ws = /\s/, int = /^([+-]?\d+)/;
        const skip = () => { while (i < len && ws.test(s[i])) i++; };
        while (i < len) {
            skip();
            if (i >= len) break;
            const ch = s[i];
            if (ch === '(') {
                i++; skip();
                let m = s.slice(i).match(int);
                if (!m) { i++; continue; }
                const t = +m[1];
                i += m[1].length; skip();
                if (s[i] === ',') i++; skip();
                m = s.slice(i).match(int);
                if (!m) { i++; continue; }
                const b = +m[1];
                i += m[1].length; skip();
                if (s[i] === ')') i++; skip();
                yield { k: 'tb', t, b, slash: s[i] === '/' };
                if (s[i] === '/') i++;
            } else if (ch === '/') {
                i++; yield { k: '/' };
            } else {
                i++;
            }
        }
    };

    lib.applyScramble = function (scr, state) {
        const a = state || lib.createSolvedState();
        for (const tok of lib.tokenizeScramble(scr)) {
            // Support both token formats:
            // Standard: { k: 'tb', t, b, slash } or { k: '/' }
            // Alternative: { moveType: 'turn', top, bottom, hasSlash } or { moveType: 'slash' }
            if (tok.k === 'tb' || tok.moveType === 'turn') {
                const top = tok.t || tok.top;
                const bot = tok.b || tok.bottom;
                const slash = tok.slash || tok.hasSlash;
                lib.rotateSection(a, 0, 12, top);
                lib.rotateSection(a, 12, 12, bot);
                if (slash) lib.sliceSwap(a);
            } else {
                lib.sliceSwap(a);
            }
        }
        return a;
    };

    lib.scrambleToState = function (scr) {
        return lib.applyScramble(scr);
    };

    lib.stateToHex = function (state) {
        const topPieces = [], bottomPieces = [];
        let idx = 0;

        while (idx < 12) {
            const ch = state[idx];
            if (lib.edgePieces.has(ch)) {
                topPieces.push(lib.pieceLabels[ch]);
                idx++;
            } else {
                const nextCh = state[(idx + 1) % 12];
                if (lib.cornerPartner[ch] === nextCh) {
                    topPieces.push(lib.pieceLabels[ch]);
                    idx += 2;
                } else return 'Error: Invalid corner pairing in top layer';
            }
        }

        idx = 12;
        while (idx < 24) {
            const ch = state[idx];
            if (lib.edgePieces.has(ch)) {
                bottomPieces.push(lib.pieceLabels[ch]);
                idx++;
            } else {
                const nextCh = state[12 + ((idx - 12 + 1) % 12)];
                if (lib.cornerPartner[ch] === nextCh) {
                    bottomPieces.push(lib.pieceLabels[ch]);
                    idx += 2;
                } else return 'Error: Invalid corner pairing in bottom layer';
            }
        }

        const topHex = topPieces.map(p => lib.pieceToHex[p] || '?').join('');
        const bottomHex = bottomPieces.map(p => lib.pieceToHex[p] || '?').join('');

        if (topHex.includes('?') || bottomHex.includes('?')) return 'Error: Unknown piece mapping';
        if (topHex.length !== 12 || bottomHex.length !== 12) return 'Error: Invalid hex length';

        const leftTopReversed = topHex.split('').reverse().join('');
        const rightBottom1Reversed = bottomHex.slice(0, 6).split('').reverse().join('');
        const rightBottom2Reversed = bottomHex.slice(6, 12).split('').reverse().join('');

        return `${leftTopReversed}|${rightBottom1Reversed}${rightBottom2Reversed}`;
    };

    lib.scrambleToHex = function (scr) {
        return lib.stateToHex(lib.scrambleToState(scr));
    };

    lib.invertScramble = function (scrambleString) {
        if (!scrambleString) return scrambleString;
        let str = String(scrambleString).trim();
        const parts = str.split('/');
        const reversed = parts.slice().reverse();
        const invertNum = (v) => {
            const num = parseInt(v);
            if (isNaN(num)) return v;
            const inv = ((-num) % 12 + 12) % 12;
            return String(inv > 6 ? inv - 12 : inv);
        };
        const inverted = reversed.map(part => {
            part = part.trim();
            const turnMatch = part.match(/\(([^)]+)\)/);
            if (turnMatch) {
                const values = turnMatch[1].split(',').map(v => v.trim());
                return '(' + values.map(invertNum).join(',') + ')';
            }
            if (part.includes(',')) {
                const values = part.split(',').map(v => v.trim());
                return values.map(invertNum).join(',');
            }
            return part;
        });
        return inverted.join('/');
    };

})(typeof window !== 'undefined' ? window : global);