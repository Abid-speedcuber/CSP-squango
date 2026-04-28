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

    // === SHAPE CUBIE CLASS ===
    lib.Square1Cubie = function () {
        this.ul = 0x011233;
        this.ur = 0x455677;
        this.dl = 0x998bba;
        this.dr = 0xddcffe;
        this.ml = 0;
    };

    lib.Square1Cubie.prototype.toString = function () {
        return this.ul.toString(16).padStart(6, '0') +
            this.ur.toString(16).padStart(6, '0') +
            "|/".charAt(this.ml) +
            this.dl.toString(16).padStart(6, '0') +
            this.dr.toString(16).padStart(6, '0');
    };

    lib.Square1Cubie.prototype.setPiece = function (idx, value) {
        if (idx < 6) {
            this.ul &= ~(0xf << ((5 - idx) << 2));
            this.ul |= value << ((5 - idx) << 2);
        } else if (idx < 12) {
            this.ur &= ~(0xf << ((11 - idx) << 2));
            this.ur |= value << ((11 - idx) << 2);
        } else if (idx < 18) {
            this.dl &= ~(0xf << ((17 - idx) << 2));
            this.dl |= value << ((17 - idx) << 2);
        } else {
            this.dr &= ~(0xf << ((23 - idx) << 2));
            this.dr |= value << ((23 - idx) << 2);
        }
    };

    // === SHAPE INDEX CONSTANTS ===
    lib.halfLayerShapes = [0, 3, 6, 12, 15, 24, 27, 30, 48, 51, 54, 60, 63];
    lib.validShapeIndices = [];

    lib.initShapes = function () {
        let count = 0;
        const halfShapes = lib.halfLayerShapes;
        for (let i = 0; i < 28561; i++) {
            const dr = halfShapes[i % 13];
            const dl = halfShapes[Math.floor(i / 13) % 13];
            const ur = halfShapes[Math.floor(Math.floor(i / 13) / 13) % 13];
            const ul = halfShapes[Math.floor(Math.floor(Math.floor(i / 13) / 13) / 13)];
            const value = ul << 18 | ur << 12 | dl << 6 | dr;

            let bitCount = 0;
            let temp = value;
            while (temp) {
                bitCount += temp & 1;
                temp >>= 1;
            }

            if (bitCount === 16) {
                lib.validShapeIndices[count++] = value;
            }
        }
    };

    lib.cubeFromShape = function (shapeIndex) {
        const f = new lib.Square1Cubie();
        const shape = lib.validShapeIndices[shapeIndex];
        let corner = 0x01234567 << 1 | 0x11111111;
        let edge = 0x01234567 << 1;
        let n_corner = 8, n_edge = 8;

        for (let i = 0; i < 24; i++) {
            if (((shape >> i) & 1) === 0) {
                const rnd = Math.floor(Math.random() * n_edge) << 2;
                f.setPiece(23 - i, (edge >> rnd) & 0xf);
                const m = (1 << rnd) - 1;
                edge = (edge & m) + ((edge >> 4) & ~m);
                n_edge--;
            } else {
                const rnd = Math.floor(Math.random() * n_corner) << 2;
                f.setPiece(23 - i, (corner >> rnd) & 0xf);
                f.setPiece(22 - i, (corner >> rnd) & 0xf);
                const m = (1 << rnd) - 1;
                corner = (corner & m) + ((corner >> 4) & ~m);
                n_corner--;
                i++;
            }
        }
        f.ml = Math.floor(Math.random() * 2);
        return f;
    };

    lib.shapeIndexToHex = function (shapeIndex) {
        const cube = lib.cubeFromShape(shapeIndex);
        return cube.toString().replace('/', '|');
    };

    // Initialize shapes on load
    lib.initShapes();

    // === PARSE SCRAMBLE (for alg to hex) ===
    lib.parseScramble = function (scramble) {
        const moves = [];
        let i = 0;
        while (i < scramble.length) {
            const char = scramble[i];
            if (char === '/' || char === '\\') {
                moves.push({ type: 'twist' });
                i++;
            } else if (char === '(' || char === '-' || /\d/.test(char)) {
                let moveStr = '';
                let parenDepth = 0;
                // Note: startPos is defined but not used (kept for parity with original)
                while (i < scramble.length) {
                    const c = scramble[i];
                    if (c === '(') parenDepth++;
                    if (c === ')') parenDepth--;
                    if (c === '/' || c === '\\') break;
                    if ((c === ',' || c === '-' || /\d/.test(c) || c === '(' || c === ')') && parenDepth >= 0) {
                        moveStr += c;
                    }
                    i++;
                    if (parenDepth === 0 && moveStr.includes(',')) break;
                }
                const cleaned = moveStr.replace(/[()]/g, '').trim();
                if (cleaned.includes(',')) {
                    const [top, bottom] = cleaned.split(',').map(n => parseInt(n.trim()));
                    moves.push({ type: 'turn', top, bottom });
                }
            } else if (/\s/.test(char)) {
                i++;
            } else {
                i++;
            }
        }
        return moves;
    };

    // === TWIST (slash swaps layers) ===
    lib.twist = function (tlHex, blHex) {
        const tlFirst6 = tlHex.slice(0, 6);
        const tlLast6 = tlHex.slice(6);
        const blFirst6 = blHex.slice(0, 6);
        const blLast6 = blHex.slice(6);
        return {
            tlHex: tlFirst6 + blFirst6,
            blHex: tlLast6 + blLast6
        };
    };

    // === CYCLE LEFT (rotate hex string) ===
    lib.cycleLeft = function (hex, places) {
        const normalized = ((places % 12) + 12) % 12;
        return hex.slice(normalized) + hex.slice(0, normalized);
    };

    // === SQ1 ALG TO HEX ===
    lib.sq1AlgToHex = function (scramble) {
        let tlHex = '011233455677';
        let blHex = '998bbaddcffe';
        const moves = lib.parseScramble(scramble);
        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            if (move.type === 'twist') {
                const result = lib.twist(tlHex, blHex);
                tlHex = result.tlHex;
                blHex = result.blHex;
            } else if (move.type === 'turn') {
                tlHex = lib.cycleLeft(tlHex, move.top);
                blHex = lib.cycleLeft(blHex, move.bottom);
            }
        }
        return { tlHex, blHex };
    };

    // === GET SHAPE INDEX FROM HEX ===
    lib.getShapeIndexFromHex = function (tlHex, blHex) {
        const hexScrambleCode = tlHex + '|' + blHex;
        if (hexScrambleCode.length !== 25) {
            throw new Error('Invalid hex format - needs 25 characters!');
        }
        const shapeArray = new Array(24);
        let scrambleIdx = 0;
        for (let i = 0; i < 12; i++) {
            if (scrambleIdx === 12) scrambleIdx++;
            const piece = hexScrambleCode[scrambleIdx];
            const isCorner = ['1', '3', '5', '7', '9', 'b', 'd', 'f'].includes(piece.toLowerCase());
            shapeArray[i] = isCorner ? 1 : 0;
            scrambleIdx++;
        }
        scrambleIdx = 13;
        for (let i = 12; i < 24; i++) {
            const piece = hexScrambleCode[scrambleIdx];
            const isCorner = ['1', '3', '5', '7', '9', 'b', 'd', 'f'].includes(piece.toLowerCase());
            shapeArray[i] = isCorner ? 1 : 0;
            scrambleIdx++;
        }
        let shapeValue = 0;
        for (let i = 0; i < 24; i++) {
            shapeValue |= shapeArray[23 - i] << i;
        }
        const shapeIndex = lib.validShapeIndices.indexOf(shapeValue);
        if (shapeIndex === -1) {
            throw new Error('Invalid shape - not found in shape index array');
        }
        return shapeIndex;
    };

    // === ALG TO SHAPE INDEX PIPELINE ===
    lib.algToShapeIndex = function (scrambleText) {
        const invertedScramble = lib.invertScramble(scrambleText);
        const { tlHex, blHex } = lib.sq1AlgToHex(invertedScramble);
        const shapeIndex = lib.getShapeIndexFromHex(tlHex, blHex);
        return {
            original: scrambleText,
            inverted: invertedScramble,
            tlHex: tlHex,
            blHex: blHex,
            shapeIndex: shapeIndex
        };
    };

})(typeof window !== 'undefined' ? window : global);