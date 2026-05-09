/* ==== FILE: js/utils.js ==== */

function parseScramble(scramble) {
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
}


// ── SCRAMBLE TO HEX ───────────────────────────────────────

function hexTwist(tlHex, blHex) {
    return {
        tlHex: tlHex.slice(0, 6) + blHex.slice(0, 6),
        blHex: tlHex.slice(6)    + blHex.slice(6)
    };
}

function hexCycleLeft(hex, places) {
    const n = ((places % 12) + 12) % 12;
    return hex.slice(n) + hex.slice(0, n);
}

function scrambleToHex(scramble) {
    let tlHex = '011233455677';
    let blHex = '998bbaddcffe';
    for (const move of parseScramble(scramble)) {
        if (move.type === 'twist') {
            ({ tlHex, blHex } = hexTwist(tlHex, blHex));
        } else if (move.type === 'turn') {
            tlHex = hexCycleLeft(tlHex, move.top);
            blHex = hexCycleLeft(blHex, move.bottom);
        }
    }
    return { tlHex, blHex };
}


// ── 3. INVERT SCRAMBLE ───────────────────────────────────────
function invertScramble(s) {
    if (!s) return s;
    let str = String(s).trim();

    const invertNum = (v) => {
        const num = parseInt(v);
        if (isNaN(num)) return v;
        const inv = ((-num) % 12 + 12) % 12;
        return String(inv > 6 ? inv - 12 : inv);
    };

    return str.split('/').reverse().map(part => {
        part = part.trim();
        const turnMatch = part.match(/\(([^)]+)\)/);
        if (turnMatch) {
            const vals = turnMatch[1].split(',').map(v => v.trim());
            return '(' + vals.map(invertNum).join(',') + ')';
        }
        if (part.includes(',')) {
            return part.split(',').map(v => invertNum(v.trim())).join(',');
        }
        return part;
    }).join('/');
}


// ── 4. CUBE STATE HELPERS & HEX ENCODING ─────────────────────
function getSolvedState() {
    return 'ABCDEFGHIJKLMNOPQRSTUVWX'.split('');
}

function rotateLayer(arr, start, len, k) {
    const n = ((k % len) + len) % len;
    if (n === 0) return;
    const seg = arr.slice(start, start + len);
    const out = [];
    for (let i = 0; i < len; i++) out[(i + n) % len] = seg[i];
    for (let i = 0; i < len; i++) arr[start + i] = out[i];
}

function doSlice(arr) {
    for (let i = 0; i < 6; i++) [arr[i], arr[12 + i]] = [arr[12 + i], arr[i]];
}

const EDGE_PIECES = new Set(['C', 'F', 'I', 'L', 'M', 'P', 'S', 'V']);

const CORNER_PARTNER = {
    A: 'B', B: 'A', D: 'E', E: 'D', G: 'H', H: 'G', J: 'K', K: 'J',
    N: 'O', O: 'N', Q: 'R', R: 'Q', T: 'U', U: 'T', W: 'X', X: 'W'
};

const PIECE_LABELS = {
    A: 'YOG', B: 'YOG', C: 'YG',  D: 'YGR', E: 'YGR', F: 'YR',
    G: 'YRB', H: 'YRB', I: 'YB',  J: 'YBO', K: 'YBO', L: 'YO',
    M: 'WR',  N: 'WRG', O: 'WRG', P: 'WG',  Q: 'WGO', R: 'WGO',
    S: 'WO',  T: 'WOB', U: 'WOB', V: 'WB',  W: 'WBR', X: 'WBR'
};

const PIECE_TO_HEX = {
    'YO': '0', 'YOG': '77', 'YG': '6', 'YGR': '55', 'YR': '4', 'YRB': '33',
    'YB': '2', 'YBO': '11', 'WR': 'a', 'WRG': 'bb', 'WG': '8', 'WGO': '99',
    'WO': 'e', 'WOB': 'ff', 'WB': 'c', 'WBR': 'dd'
};

function applyScrambleToCubeState(scramble) {
    const state = getSolvedState();
    for (const move of parseScramble(scramble)) {
        if (move.type === 'turn') {
            rotateLayer(state, 0,  12, move.top);
            rotateLayer(state, 12, 12, move.bottom);
            if (move.hasSlash) doSlice(state);
        } else {
            doSlice(state);
        }
    }
    return state;
}

function encodeCubeStateToHex(state) {
    function processLayer(startIdx) {
        const pieces = [];
        let i = 0;
        while (i < 12) {
            const ch = state[startIdx + i];
            if (EDGE_PIECES.has(ch)) {
                pieces.push(PIECE_LABELS[ch]);
                i++;
            } else {
                const nextCh = state[startIdx + ((i + 1) % 12)];
                if (CORNER_PARTNER[ch] === nextCh) {
                    pieces.push(PIECE_LABELS[ch]);
                    i += 2;
                } else {
                    return null; // invalid
                }
            }
        }
        return pieces;
    }

    const topPieces = processLayer(0);
    const botPieces  = processLayer(12);
    if (!topPieces || !botPieces) return 'Error: Invalid corner pairing';

    const topHex = topPieces.map(p => PIECE_TO_HEX[p] || '?').join('');
    const botHex  = botPieces.map(p => PIECE_TO_HEX[p] || '?').join('');
    if (topHex.includes('?') || botHex.includes('?')) return 'Error: Unknown piece mapping';
    if (topHex.length !== 12 || botHex.length !== 12)  return 'Error: Invalid hex length';

    const left  = topHex.split('').reverse().join('');
    const right1 = botHex.slice(0, 6).split('').reverse().join('');
    const right2 = botHex.slice(6, 12).split('').reverse().join('');
    return `${left}|${right1}${right2}`;
}

const HALF_LAYER = [0, 3, 6, 12, 15, 24, 27, 30, 48, 51, 54, 60, 63];
const SHAPE_INDEX_ARRAY = [];
(function buildShapeIndexArray() {
    let count = 0;
    for (let i = 0; i < 28561; i++) {
        const dr = HALF_LAYER[i % 13];
        const dl = HALF_LAYER[Math.floor(i / 13) % 13];
        const ur = HALF_LAYER[Math.floor(Math.floor(i / 13) / 13) % 13];
        const ul = HALF_LAYER[Math.floor(Math.floor(Math.floor(i / 13) / 13) / 13)];
        const value = ul << 18 | ur << 12 | dl << 6 | dr;
        let bits = 0, tmp = value;
        while (tmp) { bits += tmp & 1; tmp >>= 1; }
        if (bits === 16) SHAPE_INDEX_ARRAY[count++] = value;
    }
})();

function hexToShapeIndex(tlHex, blHex) {
    const code = tlHex + '|' + blHex;
    if (code.length !== 25) throw new Error('Invalid hex format — needs 25 characters');

    const shapeArray = new Array(24);
    const CORNERS = new Set(['1','3','5','7','9','b','d','f']);
    let ci = 0;
    for (let i = 0; i < 12; i++) {
        if (ci === 12) ci++;
        shapeArray[i] = CORNERS.has(code[ci].toLowerCase()) ? 1 : 0;
        ci++;
    }
    ci = 13;
    for (let i = 12; i < 24; i++) {
        shapeArray[i] = CORNERS.has(code[ci].toLowerCase()) ? 1 : 0;
        ci++;
    }

    let shapeValue = 0;
    for (let i = 0; i < 24; i++) shapeValue |= shapeArray[23 - i] << i;

    const idx = SHAPE_INDEX_ARRAY.indexOf(shapeValue);
    if (idx === -1) throw new Error('Invalid shape — not found in shape index array');
    return idx;
}

function shapeIndexToHex(shapeIndex) {
    const shape = SHAPE_INDEX_ARRAY[shapeIndex];
    const f = { ul: 0x011233, ur: 0x455677, dl: 0x998bba, dr: 0xddcffe, ml: 0 };

    function setPiece(idx, value) {
        if (idx < 6)       { f.ul &= ~(0xf << ((5  - idx) << 2)); f.ul |= value << ((5  - idx) << 2); }
        else if (idx < 12) { f.ur &= ~(0xf << ((11 - idx) << 2)); f.ur |= value << ((11 - idx) << 2); }
        else if (idx < 18) { f.dl &= ~(0xf << ((17 - idx) << 2)); f.dl |= value << ((17 - idx) << 2); }
        else               { f.dr &= ~(0xf << ((23 - idx) << 2)); f.dr |= value << ((23 - idx) << 2); }
    }

    const rnd = (n) => Math.floor(Math.random() * n);
    let corner = 0x01234567 << 1 | 0x11111111;
    let edge   = 0x01234567 << 1;
    let n_corner = 8, n_edge = 8;

    for (let i = 0; i < 24; i++) {
        if (((shape >> i) & 1) === 0) {
            const r = rnd(n_edge) << 2;
            setPiece(23 - i, (edge >> r) & 0xf);
            const m = (1 << r) - 1;
            edge = (edge & m) + ((edge >> 4) & ~m);
            n_edge--;
        } else {
            const r = rnd(n_corner) << 2;
            setPiece(23 - i, (corner >> r) & 0xf);
            setPiece(22 - i, (corner >> r) & 0xf);
            const m = (1 << r) - 1;
            corner = (corner & m) + ((corner >> 4) & ~m);
            n_corner--;
            i++;
        }
    }
    f.ml = rnd(2);

    const hex = f.ul.toString(16).padStart(6,'0') +
                f.ur.toString(16).padStart(6,'0') + '|' +
                f.dl.toString(16).padStart(6,'0') +
                f.dr.toString(16).padStart(6,'0');
    return hex;
}

