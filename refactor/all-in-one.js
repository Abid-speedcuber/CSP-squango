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

/* ==== FILE: js/tools/scrambleNormalizer.js ==== */

function normalizeScramble(input) {
    if (!input) return '';
    return normalizeScrambleFormat(input);
}

/**
 * Normalize scramble format (remove whitespace, combine moves)
 * @param {string} input - Raw scramble string
 * @returns {string} Normalized scramble
 */
function normalizeScrambleFormat(input) {
    if (!input) return '';

    // Remove all whitespace and normalize slashes
    let clean = normalizeInput(input);

    // SPECIAL CASE: Handle strings that are only slashes
    const onlySlashes = /^\/+$/.test(clean);
    if (onlySlashes) {
        const slashCount = clean.length;
        // Odd number of slashes = return single slash
        // Even number of slashes = return empty string
        return slashCount % 2 === 1 ? '/' : '';
    }

    // Parse into tokens
    let tokens = parseSets(clean);

    // Simplify (combine adjacent moves)
    let steps = [];
    let simplified = simplifyScramble(tokens, steps);

    // Convert back to string with proper spacing
    let output = simplified.map((tok, i) => {
        if (tok === "/") return "/";
        if (i === 0) return tok;
        return " " + tok;
    }).join("").replace(/\/\s*\(/g, "/(");

    return output;
}

/**
 * Remove whitespace and normalize basic syntax
 */
function normalizeInput(str) {
    return str
        .replace(/\\/g, "/")
        .replace(/\+\+/g, "+")
        .trim();
}

/**
 * Decode letter shortcuts and prime notation into numbers
 * @param {string} str - Input with letters/primes
 * @returns {string} Decoded string with only numbers and valid syntax
 */
function decodeScramble(str) {
    if (!str) return '';

    // Define letter mappings (case-insensitive)
    const letterMap = {
        'U': '3', 'D': '3',
        'V': '4', 'E': '4',
        'W': '6', 'B': '6',
        'X': '5', 'F': '5',
        'A': '1', 'O': '1', 'S': '1',
        'T': '2', 'C': '2'
    };

    // Define digit mappings for 7, 8, 9
    const digitMap = {
        '7': '-5',
        '8': '-4',
        '9': '-3'
    };

    // First pass: normalize all apostrophe types to standard '
    let normalized = str.replace(/[''`']/g, "'");
    let result = '';
    let i = 0;

    while (i < normalized.length) {
        const char = normalized[i];
        const upperChar = char.toUpperCase();

        // Check for minus sign BEFORE digit
        if (char === '-' && i + 1 < normalized.length && /\d/.test(normalized[i + 1])) {
            const nextDigit = normalized[i + 1];

            // Check if next digit is 7, 8, or 9
            if (digitMap[nextDigit]) {
                // -7 = 5, -8 = 4, -9 = 3 (flip the sign)
                const mappedValue = digitMap[nextDigit]; // e.g., "-5"
                const flipped = mappedValue.substring(1); // Remove the minus, so "-5" becomes "5"
                result += flipped;
                i += 2; // Skip both minus and digit
                continue;
            } else {
                // Regular digit with minus, keep the minus
                result += '-';
                i++;
                continue;
            }
        }

        // Check if it's a DIGIT
        if (/\d/.test(char)) {
            // Check if it's 7, 8, or 9 (special negative shortcuts)
            if (digitMap[char]) {
                result += digitMap[char];
            } else {
                result += char;
            }
            i++;
        }
        // Check if it's a LETTER we recognize
        else if (letterMap[upperChar]) {
            const baseValue = letterMap[upperChar];
            result += baseValue;
            i++;
        }
        // Check if it's a prime/apostrophe
        else if (char === "'") {
            result += "'";
            i++;
        }
        // Check if it's a standalone minus sign (not before a digit)
        else if (char === '-') {
            result += '-';
            i++;
        }
        // Keep structural characters
        else if (char === '/' || char === '(' || char === ')' || char === ',' || char === ' ') {
            result += char;
            i++;
        }
        // Skip everything else
        else {
            i++;
        }
    }

    return result;
}
/**
 * Parse scramble into token array
 */
function parseSets(str) {
    // Handle empty or whitespace-only input
    if (!str || str.trim() === '') {
        return [];
    }

    // SPECIAL CASE: naked slash only
    if (str.trim() === '/') {
        return ['/'];
    }

    // DECODE FIRST - convert letters and primes to numbers
    str = decodeScramble(str);

    // Check for leading/trailing slashes
    const hasLeadingSlash = str.trimStart().startsWith('/');
    const hasTrailingSlash = str.trimEnd().endsWith('/');

    // STEP 1: Parse into character array
    let chars = [...str];

    // STEP 2: Remove only whitespace
    chars = chars.filter(c => c !== ' ');

    // STEP 3: Process minus signs and primes
    let processed = [];
    let i = 0;

    while (i < chars.length) {
        const char = chars[i];

        if (char === '-') {
            // Find next number
            let j = i + 1;
            while (j < chars.length && !(/\d/.test(chars[j]))) {
                j++;
            }

            if (j < chars.length) {
                // Found a number, mark it as negative
                processed.push('-' + chars[j]);
                // Skip everything up to and including the number
                i = j + 1;
            } else {
                // No number found, skip the minus
                i++;
            }
        } else if (char === "'") {
            // Prime: negate previous number
            if (processed.length > 0) {
                const last = processed[processed.length - 1];
                if (/^-?\d+$/.test(last)) {
                    const num = parseInt(last);
                    // Special case: 6' = 6, 0' = 0
                    if (num === 0) {
                        processed[processed.length - 1] = '0';
                    } else if (Math.abs(num) === 6) {
                        processed[processed.length - 1] = '6';
                    } else if (num > 0) {
                        processed[processed.length - 1] = '-' + num;
                    } else {
                        // Already negative, make positive
                        processed[processed.length - 1] = Math.abs(num).toString();
                    }
                }
            }
            i++;
        } else if (/\d/.test(char)) {
            processed.push(char);
            i++;
        } else if (char === '/' || char === '(' || char === ')' || char === ',') {
            processed.push(char);
            i++;
        } else {
            // Skip unknown characters
            i++;
        }
    }

    // STEP 4: No additional cleaning needed, processed array is ready
    let cleaned = processed;

    // STEP 5: Extract numbers only (no slashes or other chars)
    let numbers = [];
    for (let item of cleaned) {
        if (/^-?\d+$/.test(item)) {
            numbers.push(parseInt(item));
        }
    }

    // If no numbers found, return empty array
    if (numbers.length === 0) {
        return [];
    }

    // If odd number of values, auto-pad with 0
    if (numbers.length % 2 !== 0) {
        console.warn(`Odd number of values (${numbers.length}). Auto-padding with 0.`);
        numbers.push(0);
    }

    // Group into pairs and format as tokens
    let tokens = [];

    // Add leading slash if present
    if (hasLeadingSlash) {
        tokens.push("/");
    }

    for (let i = 0; i < numbers.length; i += 2) {
        tokens.push(`(${numbers[i]},${numbers[i + 1]})`);
        // Add slash after each pair except the last
        if (i + 2 < numbers.length) {
            tokens.push("/");
        }
    }

    // Add trailing slash if present
    if (hasTrailingSlash) {
        tokens.push("/");
    }

    return tokens;
}

/**
 * Add two move sets together
 */
function addSets(a, b) {
    let m = /\((-?\d+),(-?\d+)\)/.exec(a);
    let n = /\((-?\d+),(-?\d+)\)/.exec(b);
    let x1 = parseInt(m[1]), y1 = parseInt(m[2]);
    let x2 = parseInt(n[1]), y2 = parseInt(n[2]);
    let x = x1 + x2, y = y1 + y2;

    function norm(v) {
        if (v > 6) v -= 12;
        if (v < -6) v += 12;
        return v;
    }

    x = norm(x);
    y = norm(y);
    return `(${x},${y})`;
}

/**
 * Simplify scramble by combining adjacent moves
 */
function simplifyScramble(tokens, steps) {
    let changed = true;

    while (changed) {
        changed = false;

        // Remove double slashes
        for (let i = 0; i < tokens.length - 1; i++) {
            if (tokens[i] === "/" && tokens[i + 1] === "/") {
                tokens.splice(i, 2);
                steps.push(tokens.join(""));
                changed = true;
                break;
            }
        }
        if (changed) continue;

        // Combine adjacent moves
        for (let i = 0; i < tokens.length - 1; i++) {
            if (tokens[i].startsWith("(") && tokens[i + 1].startsWith("(")) {
                let merged = addSets(tokens[i], tokens[i + 1]);
                tokens.splice(i, 2, merged);
                steps.push(tokens.join(""));
                changed = true;
                break;
            }
        }
        if (changed) continue;

        // Remove (0,0) moves
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i] === "(0,0)") {
                tokens.splice(i, 1);
                steps.push(tokens.join(""));
                changed = true;
                break;
            }
        }
    }

    return tokens;
}

// Export for use
if (typeof window !== 'undefined') {
    window.ScrambleNormalizer = {
        normalizeScramble,
        normalizeScrambleFormat,
        simplifyScramble
    };
}

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


/* ==== FILE: js/tools/cales-parity-tracer.js ==== */

(function (Cglobal) {
    'use strict';

    // Parity Tracer Core
    // Scramble to hex -> utils.js

    // ── Dark-mode brightness offsets (tweak these to restyle the modal) ──────
    // All values are % brightness adjustments relative to config.backgroundColor.
    // Positive = lighter, negative = darker.
    const DM_INPUT_BG        =  4;   // scramble input field
    const DM_CARD_BG         =  1;   // outer result card ("Parity Analysis" wrapper)
    const DM_INNER_CARD_BG   = 2;   // individual step cards inside result card
    const DM_BUTTON_BG       =  8;   // close / settings floating buttons
    const DM_HOVER_BG        = 14;   // utility btn (z2/y2/Flip) hover
    const DM_RESULT_TITLE_COLOR = '#9299b0'; // "Parity Analysis" heading color in dark mode

    // ── Light-mode brightness offsets ────────────────────────────────────────
    const LM_INPUT_BG        = -3;
    const LM_CARD_BG         = -2;
    const LM_INNER_CARD_BG   = -4;
    const LM_BUTTON_BG       = -5;
    const LM_HOVER_BG        = -8;
    const LM_RESULT_TITLE_COLOR = '#2d3748';

    // Color configuration with absurdly long name
    let C_Colors = {
        tlMainCol: '#FFD700',
        tlColName: 'Yellow',
        tlColAbb: 'Y',
        blMainCol: '#FFFFFF',
        blColName: 'White',
        blColAbb: 'W',
        frontCol: '#CC0000',
        rightCol: '#00AA00',
        backCol: '#FF8C00',
        leftCol: '#0066CC'
    };

    // scrambleToHex → defined in utils.js

    // hex digit → parity color code (CCW sticker mode)
    const HEX_TO_PARITY_CODE_CCW = {
        '0':'O','2':'B','4':'R','6':'G',          // top edges
        '8':'G','a':'R','c':'B','e':'O',          // bottom edges
        '1':'B','3':'R','5':'G','7':'O',          // top corners CCW
        '9':'G','b':'R','d':'B','f':'O'           // bottom corners CCW
    };
    // CW sticker mode
    const HEX_TO_PARITY_CODE_CW = {
        '0':'O','2':'B','4':'R','6':'G',          // top edges
        '8':'G','a':'R','c':'B','e':'O',          // bottom edges
        '1':'O','3':'B','5':'R','7':'G',          // top corners CW
        '9':'O','b':'G','d':'R','f':'B'            // bottom corners CW
    };
    const TOP_HEX = new Set(['0','1','2','3','4','5','6','7']);
    const CORNER_HEX = new Set(['1','3','5','7','9','b','d','f']);

    // Helper functions used across multiple modals
    function getContrastColor(hexColor) {
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }

    // Default shape patterns — keys are bitstrings: 0=Edge, 1=Corner
    const defaultShapePatterns_w = {
        '01010101': 'Square',
        '00101001': 'Kite',
        '00110011': 'Barrel',
        '00110101': 'Left Fist',
        '00100110': 'Right Fist',
        '00100111': 'Shield',
        '00011011': 'Muffin',
        '00010111': 'Left Pawn',
        '01000111': 'Right Pawn',
        '00001111': 'Scallop',
        '0011111': 'Pair',
        '0101111': 'L-Shape',
        '0110111': 'Line',
        '000000111': '6-0',
        '010000011': 'Right 5-1',
        '000001011': 'Left 5-1',
        '001000011': 'Right 4-2',
        '000010011': 'Left 4-2',
        '000010101': '4-1-1',
        '000100011': '3-3',
        '010010001': '3-1-2',
        '010001001': '3-2-1',
        '001001001': '2-2-2',
        '0000000011': '8-0',
        '0000001001': '6-2',
        '0000100001': '4-4',
        '0000000101': '7-1',
        '0000010001': '5-3',
        '111111': 'Star'
    };

    // Load custom shapes from localStorage or use defaults
    function loadShapesFromStorage_w() {
        const stored = localStorage.getItem('customShapesForParityTracerLibrary');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                return { ...defaultShapePatterns_w };
            }
        }
        return { ...defaultShapePatterns_w };
    }

    function saveShapesToStorage_w(shapes) {
        localStorage.setItem('customShapesForParityTracerLibrary', JSON.stringify(shapes));
    }

    let currentShapePatternsStorage_w = loadShapesFromStorage_w();

    // Utility button states (always start as false when modal opens)
    let utilityZ2Enabled = false;
    let utilityY2Enabled = false;
    let utilityFlipColorEnabled = false;

    // Load z2 tracing mode from localStorage
    let z2TracingModeEnabled = true; // default to true
    const storedZ2Mode = localStorage.getItem('z2TracingModeForParityTracerLibrary');
    if (storedZ2Mode !== null) {
        z2TracingModeEnabled = storedZ2Mode === 'true';
    }

    // Parity tracer specific image size
    let parityTracerImageSize = 200;
    const storedImageSize = localStorage.getItem('parityTracerImageSize');
    if (storedImageSize !== null) {
        parityTracerImageSize = parseInt(storedImageSize);
    }
    
    // Arrow settings
    let showCircularArrow = true;
    const storedShowArrow = localStorage.getItem('parityTracerShowArrow');
    if (storedShowArrow !== null) {
        showCircularArrow = storedShowArrow === 'true';
    }

    let arrowSettings = {
        color: 'rgba(253, 34, 34, 0.7)',
        opacity: 0.7,
        strokeWidth: 1.6,
        radius: 0.3
    };
    const storedArrowSettings = localStorage.getItem('parityTracerArrowSettings');
    if (storedArrowSettings !== null) {
        try {
            arrowSettings = JSON.parse(storedArrowSettings);
        } catch {
            // Use defaults
        }
    }

    // Evilness (loaded from parent app state, not localStorage directly - uses window references)
    function getEvilnessFactor() {
        return typeof evilnessFactor !== 'undefined' ? evilnessFactor : false;
    }
    function getEvilnessStringReturn() {
        return typeof evilnessStringReturn !== 'undefined' ? evilnessStringReturn : false;
    }
    function getEvilnessMap() {
        return typeof evilnessMap !== 'undefined' ? evilnessMap : {};
    }
    function isScrambleEvilInternal(scramble) {
        if (!getEvilnessFactor()) return false;
        if (typeof getCaseNameFromScramble === 'function') {
            const cn = getCaseNameFromScramble(scramble);
            if (!cn) return false;
            return getEvilnessMap()[cn] === true;
        }
        return false;
    }

    function applyUtilityTransformationsToScramble(scramble) {
        // First normalize the base scramble
        let normalized = scramble;
        if (typeof window.ScrambleNormalizer !== 'undefined' && window.ScrambleNormalizer.normalizeScramble) {
            normalized = window.ScrambleNormalizer.normalizeScramble(scramble);
        }

        // Parse into tokens (split by space/slash but keep structure)
        let tokens = normalized
            .split(/(\/)/)
            .map(t => t.trim())
            .filter(t => t);

        // Apply flip color (prepend (6,6) at the beginning)
        if (utilityFlipColorEnabled) {
            tokens.unshift('(6,6)');
        }

        // Apply y2 (append (6,6) at the end)
        if (utilityY2Enabled) {
            tokens.push('(6,6)');
        }

        // Apply z2 (append /(6,6)/)
        if (utilityZ2Enabled) {
            tokens.push('/');
            tokens.push('(6,6)');
            tokens.push('/');
        }

        // Simplify using the normalizer's simplification logic
        if (typeof window.ScrambleNormalizer !== 'undefined') {
            // Access internal functions if available
            const simplifyFunc = window.ScrambleNormalizer.simplifyScramble;
            const steps = [];
            tokens = simplifyFunc(tokens, steps);
        }

        // Convert back to string with proper spacing
        const result = tokens.map((tok, i) => {
            if (tok === "/") return "/";
            if (i === 0) return tok;
            return " " + tok;
        }).join("").replace(/\/\s*\(/g, "/(");

        return result;
    }

    const rotateStringCircularly_w = (s, k) => {
        const n = s.length;
        k = ((k % n) + n) % n;
        return s.slice(k) + s.slice(0, k);
    };

    // ── HEX → UNITS ──────────────────────────────────────────────────────────
    // Takes raw scrambleToHex output {tlHex, blHex} (each 12 chars, corners doubled)
    // Returns {topUnits, botUnits} as arrays of hex chars (unexpanded, variable length)
    // and {topBits, botBits} as bitstrings for shape matching
    function hexToUnits(tlHex, blHex) {
        function walkLayer(raw) {
            // raw is 12 chars from scrambleToHex, read right-to-left (undo reversal)
            const units = [];
            let bits = '';
            let i = raw.length - 1;
            while (i >= 0) {
                const c = raw[i];
                if (CORNER_HEX.has(c)) {
                    units.push(c);
                    bits += '1';
                    i -= 2; // skip the doubled char
                } else {
                    units.push(c);
                    bits += '0';
                    i -= 1;
                }
            }
            return { units, bits };
        }
        // bottom layer: blHex is stored as first6reversed + last6reversed
        // undo: reverse each half back, then read right-to-left as normal
        const blRaw = blHex.slice(0,6).split('').reverse().join('') +
                      blHex.slice(6).split('').reverse().join('');
        const top = walkLayer(tlHex);
        const bot = walkLayer(blRaw);
        return { topUnits: top.units, topBits: top.bits,
                 botUnits: bot.units, botBits: bot.bits };
    }

    // ── SHAPE MATCHING ───────────────────────────────────────────────────────
    function matchPattern(bitStr) {
        if (!currentShapePatternsStorage_w || Object.keys(currentShapePatternsStorage_w).length === 0) {
            currentShapePatternsStorage_w = loadShapesFromStorage_w();
        }
        const symmetricShapes = { 'Square':4, 'Barrel':2, '2-2-2':3, '4-4':2, 'Star':6 };
        for (const [pat, name] of Object.entries(currentShapePatternsStorage_w)) {
            if (pat.length !== bitStr.length) continue;
            const maxR = bitStr.length;
            const order = [0];
            for (let d = 1; d < maxR; d++) { order.push(-d); order.push(d); }
            for (const ra of order) {
                const nr = ((ra % maxR) + maxR) % maxR;
                if (rotateStringCircularly_w(bitStr, nr) === pat) {
                    return { name, pat, rot: nr, originalPat: pat, symmetryDegree: symmetricShapes[name] || 1 };
                }
            }
        }
        return { name: 'Unknown', pat: bitStr, rot: 0, originalPat: bitStr, symmetryDegree: 1 };
    }

    // Lookup Tables for speed
    const blackEdgeParityMap = {
        '0246':0, '0264':1, '0426':1, '0462':0, '0624':0, '0642':1, '2046':1, '2064':0, '2406':0, '2460':1, '2604':1, '2640':0, '4026':0, '4062':1, '4206':1, '4260':0, '4602':0, '4620':1, '6024':1, '6042':0, '6204':0, '6240':1, '6402':1, '6420':0
    };

    const whiteEdgeParityMap = {
        '8ace':1, '8aec':0, '8cae':0, '8cea':1, '8eac':1, '8eca':0, 'a8ce':0, 'a8ec':1, 'ac8e':1, 'ace8':0, 'ae8c':0, 'aec8':1, 'c8ae':1, 'c8ea':0, 'ca8e':0, 'cae8':1, 'ce8a':1, 'cea8':0, 'e8ac':0, 'e8ca':1, 'ea8c':1, 'eac8':0, 'ec8a':0, 'eca8':1
    };

    const blackCornerParityMap = {
        '1357':0, '1375':1, '1537':1, '1573':0, '1735':0, '1753':1, '3157':1, '3175':0, '3517':0, '3571':1, '3715':1, '3751':0, '5137':0, '5173':1, '5317':1, '5371':0, '5713':0, '5731':1, '7135':1, '7153':0, '7315':0, '7351':1, '7513':1, '7531':0
    };

    const whiteCornerParityMap = {
        '9bdf':1, '9bfd':0, '9dbf':0, '9dfb':1, '9fbd':1, '9fdb':0, 'b9df':0, 'b9fd':1, 'bd9f':1, 'bdf9':0, 'bf9d':0, 'bfd9':1, 'd9bf':1, 'd9fb':0, 'db9f':0, 'dbf9':1, 'df9b':1, 'dfb9':0, 'f9bd':0, 'f9db':1, 'fb9d':1, 'fbd9':0, 'fd9b':0, 'fdb9':1
    };

    function calculateParityFromHex(tlHex, blHex, z2Mode, useClockwise, scrambleForEvil) {
        const { topUnits, topBits, botUnits, botBits } = hexToUnits(tlHex, blHex);

        const scrambleKey = (tlHex + blHex);
        if (!window.parityTracerSymmetryOffsets) window.parityTracerSymmetryOffsets = {};
        if (!window.parityTracerSymmetryOffsets[scrambleKey])
            window.parityTracerSymmetryOffsets[scrambleKey] = { top: 0, bottom: 0 };

        const topMatch = matchPattern(topBits);
        const botMatch = matchPattern(botBits);

        const topSymOff = window.parityTracerSymmetryOffsets[scrambleKey].top || 0;
        const botSymOff = window.parityTracerSymmetryOffsets[scrambleKey].bottom || 0;

        function symRotation(match, offset, unitLen) {
            if (offset === 0) return 0;
            const pps = match.name === 'Star' ? 3 : Math.floor(unitLen / match.symmetryDegree);
            return pps * offset;
        }

        const topRot = (topMatch.rot + symRotation(topMatch, topSymOff, topUnits.length)) % topUnits.length;
        const botRot = (botMatch.rot + symRotation(botMatch, botSymOff, botUnits.length)) % botUnits.length;

        // rotate units arrays
        const tU = topUnits.slice(topRot).concat(topUnits.slice(0, topRot));
        const bU = botUnits.slice(botRot).concat(botUnits.slice(0, botRot));

        // count edges per layer for z2 swap check
        const topE = tU.filter(c => !CORNER_HEX.has(c)).length;
        const botE = bU.filter(c => !CORNER_HEX.has(c)).length;
        const topC = tU.length - topE;
        const botC = bU.length - botE;

        const shouldSwap = z2Mode &&
            ((topE===2 && topC===5 && botE===6 && botC===3) ||
             (topE===0 && topC===6 && botE===8 && botC===2));

        const orderedTop = shouldSwap ? bU : tU;
        const orderedBot = shouldSwap ? tU : bU;

        // separate edges and corners in order
        const allEdges = [], allCorners = [];
        for (const u of orderedTop) { if (CORNER_HEX.has(u)) allCorners.push(u); else allEdges.push(u); }
        for (const u of orderedBot) { if (CORNER_HEX.has(u)) allCorners.push(u); else allEdges.push(u); }

        const codeMap = useClockwise ? HEX_TO_PARITY_CODE_CW : HEX_TO_PARITY_CODE_CCW;

        // lines 1-4: trio parity via lookup tables
        const topEdges = allEdges.filter(c => TOP_HEX.has(c));
        const botEdges = allEdges.filter(c => !TOP_HEX.has(c));
        const topCorners = allCorners.filter(c => TOP_HEX.has(c));
        const botCorners = allCorners.filter(c => !TOP_HEX.has(c));

        const l1 = blackEdgeParityMap[topEdges.join('')];
        const l2 = whiteEdgeParityMap[botEdges.join('')];
        const l3 = blackCornerParityMap[topCorners.join('')];
        const l4 = whiteCornerParityMap[botCorners.join('')];

        // lines 5-6: alternating parity (positions 0,2,4,6 of full ordered arrays)
        const edgeOdd = [allEdges[0],allEdges[2],allEdges[4],allEdges[6]].filter(Boolean);
        const cornerOdd = [allCorners[0],allCorners[2],allCorners[4],allCorners[6]].filter(Boolean);
        const l5tc = edgeOdd.filter(c => TOP_HEX.has(c)).length;
        const l6tc = cornerOdd.filter(c => TOP_HEX.has(c)).length;
        const l5 = (l5tc===1||l5tc===3) ? 1 : 0;
        const l6 = (l6tc===1||l6tc===3) ? 1 : 0;

        const evilStep = getEvilnessFactor() ? (isScrambleEvilInternal(scrambleForEvil||'') ? 1 : 0) : null;
        const total = l1+l2+l3+l4+l5+l6;
        const totalWithEvil = total + (evilStep ?? 0);

        return {
            isOdd: (total%2)===1,
            isOddWithEvil: (totalWithEvil%2)===1,
            evilStep,
            total,
            steps: [
                { name: `Line 1: ${C_Colors.tlColName} Edges`,   result: l1, hexPerm: topEdges,   codenames: topEdges.map(c=>codeMap[c]) },
                { name: `Line 2: ${C_Colors.blColName} Edges`,   result: l2, hexPerm: botEdges,   codenames: botEdges.map(c=>codeMap[c]) },
                { name: `Line 3: ${C_Colors.tlColName} Corners`, result: l3, hexPerm: topCorners, codenames: topCorners.map(c=>codeMap[c]) },
                { name: `Line 4: ${C_Colors.blColName} Corners`, result: l4, hexPerm: botCorners, codenames: botCorners.map(c=>codeMap[c]) },
                { name: 'Line 5: Odd Edges',   result: l5, hexPerm: edgeOdd,   isLayer: true, topCount: l5tc },
                { name: 'Line 6: Odd Corners', result: l6, hexPerm: cornerOdd, isLayer: true, topCount: l6tc }
            ],
            topUnits: tU, botUnits: bU,
            topMatch, botMatch,
            topBits, botBits,
            wasSwapped: shouldSwap
        };
    }

    // Shape visualization for config modal - RESTORED
    function generateSimpleShapeVisualizationSVG_w(pattern, size, idPrefix) {
        const cx = size / 2;
        const cy = size / 2;

        // Use same dimensions as existing visualizer
        const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        const unit10vh = vh * 0.10;
        const r_inner = 0;
        const r_outer = Math.round(unit10vh * 0.7);
        const r_outer_apex = Math.round(r_outer * (Math.cos(Math.PI / 6) + Math.sin(Math.PI / 6)));

        // Scale to fit in the requested size
        const maxRadius = Math.max(r_outer, r_outer_apex);
        const scale = (size * 0.4) / maxRadius;
        const scaled_r_outer = r_outer * scale;
        const scaled_r_outer_apex = r_outer_apex * scale;

        function p2c(cx, cy, radius, angleDeg) {
            const a = angleDeg * Math.PI / 180;
            return { x: cx + radius * Math.cos(a), y: cy - radius * Math.sin(a) };
        }

        function ptsToStr(pts) {
            return pts.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
        }

        let svgContent = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display: inline-block;">
    <style>
      .shape-piece { cursor: pointer; transition: all 0.15s ease; }
      .shape-piece:hover { fill: #ffd700 !important; stroke-width: 3; }
    </style>`;

        // Build proper angle array matching Square-1 geometry
        const pieces = pattern.split('');
        const letterAngles = [];
        let currentAngle = 90; // Start at top

        pieces.forEach(piece => {
            if (piece === '0') {
                letterAngles.push(currentAngle);
                currentAngle -= 30;
            } else {
                letterAngles.push(currentAngle);
                letterAngles.push(currentAngle - 30);
                currentAngle -= 60;
            }
        });

        // Now draw each piece using proper angles
        let angleIndex = 0;
        pieces.forEach((piece, index) => {
            const isEdge = piece === '0';
            const isFirst = index === 0;
            const fillColor = isFirst ? '#add8e6' : '#ffffff';

            if (isEdge) {
                // Edge piece - 30 degree triangle
                const centerAngle = letterAngles[angleIndex];
                const half = 15; // Half of 30 degrees

                const pInner = p2c(cx, cy, r_inner, centerAngle);
                const pA = p2c(cx, cy, scaled_r_outer, centerAngle - half);
                const pB = p2c(cx, cy, scaled_r_outer, centerAngle + half);

                svgContent += `<polygon
            class="shape-piece shape-piece-${idPrefix}"
            data-piece-index="${index}"
            points="${ptsToStr([pInner, pA, pB])}"
            fill="${fillColor}"
            stroke="#000"
            stroke-width="2"
          />`;

                angleIndex += 1;
            } else {
                // Corner piece - 60 degree kite (using average of two 30-degree positions)
                const angle1 = letterAngles[angleIndex];
                const angle2 = letterAngles[angleIndex + 1];
                const centerAngle = (angle1 + angle2) / 2;
                const half = 30; // Half of 60 degrees

                const pInner = p2c(cx, cy, r_inner, centerAngle);
                const pOuterR = p2c(cx, cy, scaled_r_outer, centerAngle - half);
                const pApex = p2c(cx, cy, scaled_r_outer_apex, centerAngle);
                const pOuterL = p2c(cx, cy, scaled_r_outer, centerAngle + half);

                svgContent += `<polygon
            class="shape-piece shape-piece-${idPrefix}"
            data-piece-index="${index}"
            points="${ptsToStr([pInner, pOuterR, pApex, pOuterL])}"
            fill="${fillColor}"
            stroke="#000"
            stroke-width="2"
          />`;

                angleIndex += 2;
            }
        });

        // Add center dot
        svgContent += `<circle cx="${cx}" cy="${cy}" r="2" fill="#666"/>`;

        svgContent += `</svg>`;

        return svgContent;
    }

    // Display results in modal
    function calculateArrowStartAngle_w(rotationAmount, unitsArray, layerType, patternBits) {

        const initialAngle = layerType === 'TOP' ? 90 : 120;

        const endsWithCorner = patternBits.endsWith('1');
        const arcDegrees = endsWithCorner ? 300 : 330;

        let totalRotationDegrees = 0;

        for (let i = 0; i < rotationAmount; i++) {
            const pieceDegrees = CORNER_HEX.has(unitsArray[i]) ? 60 : 30;
            totalRotationDegrees += pieceDegrees;
        }
        // We rotate clockwise (subtract) from the initial position
        const finalAngle = initialAngle - totalRotationDegrees;
        console.groupEnd();

        return { startAngle: finalAngle, arcDegrees: arcDegrees };
    }

    function generateArrowSVGOverlay_w(centerX, centerY, radius, startAngleDeg, arcDegrees, size) {
        if (!showCircularArrow) {
            return '';
        }

        const strokeWidth = size * 0.01 * arrowSettings.strokeWidth;
        const arrowColor = arrowSettings.color;
        const opacity = arrowSettings.opacity;
        const adjustedRadius = radius * arrowSettings.radius;

        // Arrowhead size
        const arrowSize = strokeWidth * 3;
        // Start disk (circle at beginning) - smaller, seamless
        const startDiskRadius = strokeWidth * 1.2;

        // Calculate how many degrees the arrowhead tip extends
        const arrowTipExtensionDegrees = (arrowSize / adjustedRadius) * (180 / Math.PI);

        // Adjust the end angle to pull back by the arrowhead extension
        const adjustedArcDegrees = arcDegrees - arrowTipExtensionDegrees;

        // Convert to radians
        const startRad = (startAngleDeg - 15) * Math.PI / 180;
        const endRad = (startAngleDeg - 15 - adjustedArcDegrees) * Math.PI / 180;

        // Calculate arc path
        const startX = centerX + adjustedRadius * Math.cos(startRad);
        const startY = centerY - adjustedRadius * Math.sin(startRad);
        const endX = centerX + adjustedRadius * Math.cos(endRad);
        const endY = centerY - adjustedRadius * Math.sin(endRad);

        // Large arc flag = 1 for arcs >= 180 degrees, sweep = 1 for clockwise
        const largeArcFlag = arcDegrees >= 180 ? 1 : 0;
        const pathD = `M ${startX} ${startY} A ${adjustedRadius} ${adjustedRadius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;

        // Direction of arrow movement at end (tangent to circle, clockwise)
        const tangentAngle = endRad - Math.PI / 2;

        // Calculate arrowhead tip (extends in direction of motion)
        const arrowTipX = endX + arrowSize * Math.cos(tangentAngle);
        const arrowTipY = endY - arrowSize * Math.sin(tangentAngle);

        // Arrowhead base points (perpendicular to direction of motion)
        const perpAngle1 = tangentAngle + (2 * Math.PI / 3);
        const perpAngle2 = tangentAngle - (2 * Math.PI / 3);

        const arrow1X = endX + arrowSize * 0.5 * Math.cos(perpAngle1);
        const arrow1Y = endY - arrowSize * 0.5 * Math.sin(perpAngle1);
        const arrow2X = endX + arrowSize * 0.5 * Math.cos(perpAngle2);
        const arrow2Y = endY - arrowSize * 0.5 * Math.sin(perpAngle2);

        return `
        <g opacity="${opacity}">
            <path d="${pathD}"
                  fill="none"
                  stroke="${arrowColor}"
                  stroke-width="${strokeWidth}"
                  stroke-dasharray="${size * 0.008},${size * 0.004}"
                  stroke-linecap="round"/>
            <circle cx="${startX}" cy="${startY}" r="${startDiskRadius}"
                    fill="${arrowColor}" stroke="none"/>
            <polygon points="${arrowTipX},${arrowTipY} ${arrow1X},${arrow1Y} ${arrow2X},${arrow2Y}"
                     fill="${arrowColor}" stroke="none"/>
        </g>
    `;
    }

    function displayResultsInModal_w(container, sixStepParity, config) {
        function getContrastColor(hexColor) {
            const r = parseInt(hexColor.substr(1, 2), 16);
            const g = parseInt(hexColor.substr(3, 2), 16);
            const b = parseInt(hexColor.substr(5, 2), 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminance > 0.5 ? '#000000' : '#FFFFFF';
        }

        function adjustColorBrightness(hexColor, percent) {
            const num = parseInt(hexColor.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = Math.min(255, Math.max(0, (num >> 16) + amt));
            const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
            const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
            return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
        }

        function createColorSquares_w(codenames) {
            if (!codenames || !codenames.length) return '';
            const colorMap = {
                'O': `<span class="color-dot" style="background: ${config.backCol};"></span>`,
                'G': `<span class="color-dot" style="background: ${config.rightCol};"></span>`,
                'R': `<span class="color-dot" style="background: ${config.frontCol};"></span>`,
                'B': `<span class="color-dot" style="background: ${config.leftCol};"></span>`
            };
            return codenames.slice(0,3).map(c => colorMap[c] || '').join('');
        }

        function createPositionIndicators_w(hexPerm) {
            return hexPerm.map(h => {
                const isTop = TOP_HEX.has(h);
                const letter = isTop ? config.tlColAbb : config.blColAbb;
                const bg = isTop ? config.tlMainCol : config.blMainCol;
                const tc = isTop ? (config.tlMainCol === '#FFD700' ? '#000000' : '#FFFFFF') : (config.blMainCol === '#FFFFFF' ? '#000000' : '#FFFFFF');
                return `<span style="display:inline-block;width:18px;height:18px;border-radius:3px;margin:0 1px;background:${bg};color:${tc};text-align:center;line-height:18px;font-size:11px;font-weight:bold;box-shadow:0 1px 3px rgba(0,0,0,0.2);">${letter}</span>`;
            }).join('');
        }

        const textColor = getContrastColor(config.backgroundColor);
        const isDark = textColor === '#FFFFFF';
        const cardBgColor = isDark ? adjustColorBrightness(config.backgroundColor, DM_CARD_BG) : adjustColorBrightness(config.backgroundColor, LM_CARD_BG);
        const innerCardBg = isDark ? adjustColorBrightness(config.backgroundColor, DM_INNER_CARD_BG) : adjustColorBrightness(config.backgroundColor, LM_INNER_CARD_BG);

        const allSteps = [...sixStepParity.steps];
        if (getEvilnessFactor() && sixStepParity.evilStep !== null) {
            allSteps.push({
                name: 'Line 7: Evilness',
                pieces: '-',
                codenames: '-',
                detail: `Evilness: ${sixStepParity.evilStep}`,
                result: sixStepParity.evilStep
            });
        }

        const resultTitleColor = isDark ? DM_RESULT_TITLE_COLOR : LM_RESULT_TITLE_COLOR;
        container.innerHTML = `
      <div style="background: ${cardBgColor}; padding: 0.75rem; border-radius: 8px;">
        <h3 style="font-size: 0.9rem; margin-bottom: 0.5rem; color: ${resultTitleColor}; font-weight: 600;">Parity Analysis</h3>
        <div class="parity-grid-tracer-lib">
          ${allSteps.map((step, idx) => {
            let displayContent = '';
            const lineName = step.name.split(':')[1].trim();

            if (idx === 6) {
                const evilLabel = step.result === 1 ? '<span style="color:#8b0000;font-weight:700;">EVIL</span>' : '<span style="color:#2d6a2d;font-weight:700;">GOOD</span>';
                displayContent = `${lineName}: ${evilLabel} = <strong>${step.result}</strong>`;
            } else if (step.isLayer) {
                displayContent = `${lineName}: ${createPositionIndicators_w(step.hexPerm)} = <strong>${step.result}</strong>`;
            } else {
                displayContent = `${lineName}: ${createColorSquares_w(step.codenames)} = <strong>${step.result}</strong>`;
            }

            return `
            <div style="background: ${innerCardBg}; padding: 0.5rem; border-radius: 6px;">
              <div style="font-weight: 600; font-size: 0.85rem; color: ${textColor};">
                ${displayContent}
              </div>
            </div>
          `}).join('')}
        </div>
        <div style="background: ${innerCardBg}; margin-top: 0.5rem; padding: 0.5rem; border-radius: 6px;">
          <div style="font-weight: 600; font-size: 0.95rem; color: ${textColor};">
            Total: ${getEvilnessFactor() && sixStepParity.evilStep !== null ? sixStepParity.total + '+' + sixStepParity.evilStep + '=' + (sixStepParity.total + sixStepParity.evilStep) : sixStepParity.total} → <strong>${(getEvilnessFactor() && sixStepParity.evilStep !== null ? sixStepParity.isOddWithEvil : sixStepParity.isOdd) ? 'ODD' : 'EVEN'} Parity</strong>
          </div>
        </div>
      </div>
    `;
    }

    // Function to set shape orientation - RESTORED
    function setShapeOrientation_w(pattern, clickedIndex) {
        const rotated = rotateStringCircularly_w(pattern, clickedIndex);

        let shapeName = '';
        for (const [pat, name] of Object.entries(currentShapePatternsStorage_w)) {
            if (pat === pattern) {
                shapeName = name;
                break;
            }
        }

        if (shapeName) {
            delete currentShapePatternsStorage_w[pattern];
            currentShapePatternsStorage_w[rotated] = shapeName;
            saveShapesToStorage_w(currentShapePatternsStorage_w);
        }
    }


    // Parity Tracer Instruction Modal
    function showParityTracerInstructionModal(config) {
        const textColor = getContrastColor(config.backgroundColor);
        const isDark = textColor === '#FFFFFF';

        function adjustColorBrightness(hexColor, percent) {
            const num = parseInt(hexColor.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = Math.min(255, Math.max(0, (num >> 16) + amt));
            const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
            const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
            return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
        }

        const cardBgColor = isDark ? adjustColorBrightness(config.backgroundColor, 12) : adjustColorBrightness(config.backgroundColor, -4);

        const instructionModal = document.createElement('div');
        instructionModal.className = 'training-info-modal';
        instructionModal.style.zIndex = '10010';
        instructionModal.innerHTML = `
            <div class="training-info-content" style="background: ${config.backgroundColor};">
                <div class="training-info-header" style="background: ${cardBgColor}; color: ${textColor};">
                    <span class="training-info-title">Parity Tracer Guide</span>
                    <button class="training-info-close" style="color: ${textColor};">&times;</button>
                </div>
                <div class="training-info-body">
                    <div class="training-info-item">
                        <div class="training-info-number">1</div>
                        <div class="training-info-text" style="color: ${textColor};">Enter your scramble in the input bar to analyze the parity of the scramble using the <span style="font-weight: 550; font-style:italic;">Cale's tracing</span> method.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">2</div>
                        <div class="training-info-text" style="color: ${textColor};">You can customize your entire parity tracer from the settings button down below. If you need to change the color scheme, go the <b>Color Scheme Settings</b> under personalization tab in settings.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">3</div>
                        <div class="training-info-text" style="color: ${textColor};">Toggle the <b>z2</b> button on if you want to trace parity from the z2 orientation. Similarly toggle the <b>y2</b> button on to trace parity from y2 orientation. If you scrambled you square one with wrong color on front, toggle <b>Flip Color</b> on. </div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">4</div>
                        <div class="training-info-text" style="color: ${textColor};">Personalize your tracing methods and tracing positions from the Settings:
                            <ol>
                                <li><b>Corner sticker mode</b> determines which sticker (left-most sticker or right-most sticker) of the corner you use for tracing. This doesn't affect parity calculations, just your personal preference.</li>
                                <li><b>z2 tracing for 6 and 8 edge cases</b> means you prioritize the more edge-dense face to start your tracing, regardless of which layer it's on. This is the safest tracing mode. If you do not do z2 tracing, for 2E6E cases parity gets flipped.</li>
                                <li><b>Image size</b> determine how big the image of the square 1 appear on the parity tracer screen.</li>
                                <li><b>Tracing arrow</b> shows where your tracing starts on each layer. You can customize its appearance or hide it completely.</li>
                                <li><b>Set your tracing scheme</b> for each shape to have fully personalized parity tracing. This affets the parity of the <span style="font-weight:600; font-style:italic;">Algorithms on the Homescreen</span>, <span style="font-weight:600; font-style:italic;">Case in Trainer</span>, basically the <span style="font-weight:650; font-style:italic;">entire app</span>!</li>
                                <li><span style="font-weight:600; font-style:italic;">Evilness</span> refers to a special tracing technique where you add 1 to your tracing for certain cases to force good alg for even parity all the time. If you are a practitioner of this technique, toggle <b>Evilness Factor</b> on from the settings. If you don't want evilness factor affects the parity of an algorithm on the homescreen, you can toggle <b>Evilness Affects Homescreen</b> off.</li>
                            </ol>
                        </div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">5</div>
                        <div class="training-info-text" style="color: ${textColor};">For <b>symmetric shapes</b> (eg. square, barrel, 2-2-2, 4-4, star), click the center of the image of the shape to trace from <span style="font-weight: 550; font-style:italic;">different symmetry.</span></div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(instructionModal);
        instructionModal.classList.add('active');

        const closeBtn = instructionModal.querySelector('.training-info-close');
        const close = () => {
            closeModalWithHistory(() => {
                instructionModal.remove();
            });
        };
        closeBtn.onclick = close;
        pushModalState('instructionModal', close);

        instructionModal.onclick = (e) => {
            if (e.target === instructionModal) {
                instructionModal.remove();
            }
        };
    }

    // Configuration Orientation Instruction Modal
    function showConfigOrientationInstructionModal(config) {
        const textColor = getContrastColor(config.backgroundColor);
        const isDark = textColor === '#FFFFFF';

        function adjustColorBrightness(hexColor, percent) {
            const num = parseInt(hexColor.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = Math.min(255, Math.max(0, (num >> 16) + amt));
            const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
            const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
            return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
        }

        const cardBgColor = isDark ? adjustColorBrightness(config.backgroundColor, 12) : adjustColorBrightness(config.backgroundColor, -4);

        const instructionModal = document.createElement('div');
        instructionModal.className = 'training-info-modal';
        instructionModal.style.zIndex = '10011';
        instructionModal.innerHTML = `
            <div class="training-info-content" style="background: ${config.backgroundColor};">
                <div class="training-info-header" style="background: ${cardBgColor}; color: ${textColor};">
                    <span class="training-info-title">Setting Tracing Scheme Guide</span>
                    <button class="training-info-close" style="color: ${textColor};">&times;</button>
                </div>
                <div class="training-info-body">
                    <div class="training-info-item">
                        <div class="training-info-number">1</div>
                        <div class="training-info-text" style="color: ${textColor};">For each shape, select one piece as your starting point. When you trace CSP, you would start from this piece, and go clockwise.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">2</div>
                        <div class="training-info-text" style="color: ${textColor};"> just don't trace counterclockwise.</div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(instructionModal);
        instructionModal.classList.add('active');

        const closeBtn = instructionModal.querySelector('.training-info-close');
        const close = () => {
            closeModalWithHistory(() => {
                instructionModal.remove();
            });
        };
        closeBtn.onclick = close;
        pushModalState('configOrientationInstructionModal', close);

        instructionModal.onclick = (e) => {
            if (e.target === instructionModal) {
                close();
            }
        };
    }

    function showEvilnessCasesModal(modalElement, config, mainCloseBtn, mainSettingsBtn) {
        const textColor = getContrastColor(config.backgroundColor);
        const isDark = textColor === '#FFFFFF';

        const allCases = typeof defaultDisplayNames !== 'undefined' ? Object.keys(defaultDisplayNames) : (typeof data !== 'undefined' ? data.map(d => d.name) : []);
        const getDispName = (cn) => {
            if (typeof displayNames !== 'undefined' && displayNames[cn]) return displayNames[cn];
            if (typeof defaultDisplayNames !== 'undefined' && defaultDisplayNames[cn]) return defaultDisplayNames[cn];
            return cn;
        };

        let localEvilMap = Object.assign({}, typeof evilnessMap !== 'undefined' ? evilnessMap : {});
        let hasChanges = false;
        let evilSearchTerm = '';
        let evilFilteredCases = [...allCases];

        const evilModalDiv = document.createElement('div');
        evilModalDiv.style.cssText = `
            display:flex; position:fixed; top:0; left:0; width:100%; height:100%;
            background:rgba(0,0,0,0.55); z-index:10008;
            align-items:center; justify-content:center; padding:20px; box-sizing:border-box;
        `;

        const evilInner = document.createElement('div');
        evilInner.style.cssText = `
            background:var(--surface); border-radius:14px; width:min(560px,100%);
            max-height:80vh; display:flex; flex-direction:column;
            box-shadow:0 8px 32px rgba(0,0,0,0.25); overflow:hidden;
        `;

        evilInner.innerHTML = `
            <!-- Header -->
            <div style="flex-shrink:0; padding:16px 20px; background:var(--surface2); border-bottom:1px solid var(--surface-border); display:flex; align-items:center; justify-content:space-between;">
                <div style="display:flex; align-items:baseline; gap:8px; flex-wrap:wrap;">
                    <span style="font-size:1.15rem; font-weight:700; color:var(--text-ui);">Per-case Evilness settings</span>
                    <span id="evilCountBar" style="font-size:0.8rem; color:var(--text-secondary); font-weight:400;"></span>
                </div>
                <button id="evilModalCloseBtn" style="background:none; border:none; font-size:1.6rem; cursor:pointer; color:var(--text-secondary); line-height:1; padding:0;">&times;</button>
            </div>
            <!-- Search + Bulk action bar -->
            <div style="flex-shrink:0; padding:10px 14px; background:var(--surface2); border-bottom:1px solid var(--surface-border); display:flex; gap:8px; align-items:center;">
                <div style="position:relative; flex:1; min-width:0;">
                    <input type="text" id="evilSearchInput"
                        placeholder="Search cases..."
                        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                        style="width:100%; padding:7px 10px 7px 32px; border:1px solid var(--border-color); border-radius:7px; font-size:0.88rem; outline:none; box-sizing:border-box; background:var(--surface); color:var(--text-ui);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        style="position:absolute; left:9px; top:50%; transform:translateY(-50%); width:15px; height:15px; pointer-events:none;">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                </div>
                <select id="evilBulkAction"
                    style="padding:7px 8px; border:1px solid var(--border-color); border-radius:7px; font-size:0.82rem; background:var(--surface); cursor:pointer; color:var(--text-ui); flex-shrink:0;"
                    onchange="this.value && (() => { window._evilBulkHandler && window._evilBulkHandler(this.value); this.value=''; })()">
                    <option value="" disabled selected>Select…</option>
                    <option value="mark_all_evil">Mark All Evil</option>
                    <option value="mark_all_good">Mark All Good</option>
                    <option value="mark_these_evil">Mark These Evil</option>
                    <option value="mark_these_good">Mark These Good</option>
                </select>
            </div>
            <!-- Cases grid -->
            <div id="evilCaseGrid" style="
                flex:1; overflow-y:auto; padding:10px 12px;
                display:grid; grid-template-columns:repeat(3,1fr);
                gap:7px; align-content:start;
            "></div>
            <!-- Footer -->
            <div style="flex-shrink:0; padding:12px 16px; background:var(--surface2); border-top:1px solid var(--surface-border); display:flex; gap:8px; justify-content:flex-end; align-items:center;">
                <span id="evilUnsavedDot" style="font-size:0.8rem; color:var(--warning-color,#e08000); font-weight:600; display:none;">● Unsaved changes</span>
                <button id="evilResetBtn" style="padding:6px 14px; background:var(--surface); color:var(--text-ui); border:1px solid var(--border-color); border-radius:7px; cursor:pointer; font-size:0.85rem; font-weight:600;">Reset to Default</button>
                <button id="evilCancelBtn" style="padding:6px 14px; background:var(--surface); color:var(--text-ui); border:1px solid var(--border-color); border-radius:7px; cursor:pointer; font-size:0.85rem; font-weight:600;">Cancel</button>
                <button id="evilSaveBtn" style="padding:6px 14px; background:var(--bar-learned); color:#fff; border:none; border-radius:7px; cursor:pointer; font-size:0.85rem; font-weight:600; opacity:0.4; pointer-events:none;" disabled>Save &amp; Apply</button>
            </div>
        `;

        evilModalDiv.appendChild(evilInner);
        document.body.appendChild(evilModalDiv);

        function renderEvilGrid() {
            const grid = evilInner.querySelector('#evilCaseGrid');
            if (!grid) return;

            evilFilteredCases = evilSearchTerm
                ? allCases.filter(cn => {
                    const dn = getDispName(cn).toLowerCase();
                    const term = evilSearchTerm;
                    if (!term.includes('/')) return dn.includes(term) || cn.toLowerCase().includes(term);
                    const [p1, p2] = term.split('/').map(p => p.trim());
                    const parts = dn.split('/').map(p => p.trim());
                    if (parts.length === 2) {
                        return (parts[0].includes(p1) && parts[1].includes(p2)) ||
                            (parts[1].includes(p1) && parts[0].includes(p2));
                    }
                    return false;
                })
                : [...allCases];

            grid.innerHTML = evilFilteredCases.map(cn => {
                const isEvil = localEvilMap[cn] === true;
                const dn = getDispName(cn);
                const displayText = dn.includes('/')
                    ? dn.replace(/ /g, '\u00A0').replace('/', '/\u200B')
                    : dn;

                const bgColor = isEvil ? '#ffe0e0' : '#e8f5e9';
                const borderColor2 = isEvil ? '#e53e3e' : '#38a169';
                const textCol = isEvil ? '#7b1c1c' : '#1a4731';

                return `<div
                    data-case="${cn.replace(/'/g, "\\'")}"
                    onclick="window._evilToggleCase && window._evilToggleCase('${cn.replace(/'/g, "\\'")}')"
                    style="
                        padding:7px 8px; background:${bgColor};
                        border:2px solid ${borderColor2}; border-radius:7px;
                        cursor:pointer; display:flex; align-items:center;
                        user-select:none; box-sizing:border-box; width:100%;
                    ">
                    <span style="font-size:0.78rem; font-weight:600; color:${textCol}; line-height:1.3; word-break:break-word;">${displayText}</span>
                </div>`;
            }).join('');

            const countBar = evilInner.querySelector('#evilCountBar');
            if (countBar) {
                const evilCount = allCases.filter(cn => localEvilMap[cn] === true).length;
                countBar.textContent = `${evilCount} evil, ${allCases.length - evilCount} good` +
                    (evilSearchTerm ? ` · ${evilFilteredCases.length} shown` : '');
            }
        }

        function markChanged() {
            hasChanges = true;
            const saveBtn = evilInner.querySelector('#evilSaveBtn');
            if (saveBtn) { saveBtn.style.opacity = '1'; saveBtn.style.pointerEvents = 'auto'; saveBtn.removeAttribute('disabled'); }
            const dot = evilInner.querySelector('#evilUnsavedDot');
            if (dot) dot.style.display = 'inline';
        }

        window._evilToggleCase = (cn) => {
            localEvilMap[cn] = !localEvilMap[cn];
            renderEvilGrid();
            markChanged();
        };

        window._evilBulkHandler = (action) => {
            switch (action) {
                case 'mark_all_evil':
                    allCases.forEach(cn => { localEvilMap[cn] = true; }); break;
                case 'mark_all_good':
                    allCases.forEach(cn => { localEvilMap[cn] = false; }); break;
                case 'mark_these_evil':
                    evilFilteredCases.forEach(cn => { localEvilMap[cn] = true; }); break;
                case 'mark_these_good':
                    evilFilteredCases.forEach(cn => { localEvilMap[cn] = false; }); break;
            }
            renderEvilGrid();
            markChanged();
        };

        // Search
        evilInner.querySelector('#evilSearchInput').addEventListener('input', (e) => {
            evilSearchTerm = e.target.value.toLowerCase().trim();
            renderEvilGrid();
        });

        function performSave() {
            if (typeof evilnessMap !== 'undefined') Object.assign(evilnessMap, localEvilMap);
            if (typeof saveState === 'function') saveState();
            const useEvilInCalc = typeof evilnessStringReturn !== 'undefined' && evilnessStringReturn;
            if (useEvilInCalc) {
                if (typeof lastParityCalculationSettings !== 'undefined') lastParityCalculationSettings = null;
                if (typeof calculateAndCacheAllParity === 'function') calculateAndCacheAllParity();
                if (typeof render === 'function') render();
                if (typeof filterAndSort === 'function') filterAndSort();
            } else {
                if (typeof render === 'function') render();
            }
            if (modalElement) {
                const si = modalElement.querySelector('input[type="text"]');
                if (si) si.dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (typeof showToast === 'function') showToast('Evilness settings saved!', 3000, 'success');
            closeEvilModal(true);
        }

        function closeEvilModal(skipConfirm = false) {
            if (hasChanges && !skipConfirm) {
                const overlay = document.createElement('div');
                overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:2147483646;`;
                const box = document.createElement('div');
                box.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:24px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.4);z-index:2147483647;min-width:300px;`;
                box.innerHTML = `<h3 style="margin:0 0 12px;color:#333;font-size:1.1rem;">Unsaved Changes</h3>
                    <p style="margin:0 0 20px;color:#666;font-size:0.9rem;">You have unsaved changes. What would you like to do?</p>
                    <div style="display:flex;gap:10px;justify-content:flex-end;">
                        <button class="d-btn" style="padding:8px 16px;background:#6c757d;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;">Discard</button>
                        <button class="c-btn" style="padding:8px 16px;background:#f8f9fa;color:#333;border:1px solid #dee2e6;border-radius:6px;cursor:pointer;font-weight:600;">Cancel</button>
                        <button class="s-btn" style="padding:8px 16px;background:#28a745;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;">Save</button>
                    </div>`;
                overlay.appendChild(box);
                document.body.appendChild(overlay);
                box.querySelector('.d-btn').onclick = () => { overlay.remove(); closeEvilModal(true); };
                box.querySelector('.c-btn').onclick = () => overlay.remove();
                box.querySelector('.s-btn').onclick = () => { overlay.remove(); performSave(); };
                return;
            }
            delete window._evilToggleCase;
            delete window._evilBulkHandler;
            closeModalWithHistory(() => {
                evilModalDiv.remove();
                if (mainCloseBtn) mainCloseBtn.style.display = 'flex';
                if (mainSettingsBtn) mainSettingsBtn.style.display = 'flex';
            });
        }

        evilInner.querySelector('#evilSaveBtn').addEventListener('click', performSave);
        evilInner.querySelector('#evilCancelBtn').addEventListener('click', () => closeEvilModal(false));
        evilInner.querySelector('#evilModalCloseBtn').addEventListener('click', () => closeEvilModal(false));
        evilModalDiv.addEventListener('click', e => { if (e.target === evilModalDiv) closeEvilModal(false); });
        pushModalState('evilModal', () => closeEvilModal(false));

        evilInner.querySelector('#evilResetBtn').addEventListener('click', () => {
            const presetEvil = (typeof presetData !== 'undefined' && presetData && presetData.evilnessMap) ? presetData.evilnessMap : {};
            allCases.forEach(cn => { localEvilMap[cn] = presetEvil[cn] === true; });
            renderEvilGrid();
            markChanged();
        });

        renderEvilGrid();
    }

    function showTracingSchemeSettingsModal(modalElement, config, mainCloseBtn, mainInstructionBtn, mainSettingsBtn) {
        // Calculate contrasting colors based on background
        function getContrastColor(hexColor) {
            const r = parseInt(hexColor.substr(1, 2), 16);
            const g = parseInt(hexColor.substr(3, 2), 16);
            const b = parseInt(hexColor.substr(5, 2), 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminance > 0.5 ? '#000000' : '#FFFFFF';
        }

        function adjustColorBrightness(hexColor, percent) {
            const num = parseInt(hexColor.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = Math.min(255, Math.max(0, (num >> 16) + amt));
            const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
            const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
            return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
        }

        const textColor = getContrastColor(config.backgroundColor);
        const isDark = textColor === '#FFFFFF';
        const borderColor = isDark ? adjustColorBrightness(config.backgroundColor, 20) : adjustColorBrightness(config.backgroundColor, -10);
        const inputBgColor = isDark ? adjustColorBrightness(config.backgroundColor, 10) : adjustColorBrightness(config.backgroundColor, -3);

        const configModalDiv = document.createElement('div');
        configModalDiv.className = 'parity-tracer-config-modal';
        configModalDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10008;
            padding: 2rem;
            overflow-y: auto;
            display: flex;
            align-items: center;
            justify-content: center;
            scrollbar-width: none;
            -ms-overflow-style: none;
            overflow: hidden;
        `;

        const configContent = document.createElement('div');
        configContent.className = 'parity-tracer-config-content';
        configContent.style.cssText = `
            background: ${config.backgroundColor};
            border-radius: 16px;
            padding: 2rem;
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            position: relative;
        `;

        const headerDiv = document.createElement('div');
        headerDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;';

        const headerTitle = document.createElement('div');
        headerTitle.style.cssText = 'display: flex; align-items: center; gap: 10px;';
        headerTitle.innerHTML = `
            <h2 style="font-size: 1.5rem; color: ${textColor}; margin: 0;">Tracing Scheme Settings</h2>
            <button class="config-info-btn" style="background: rgba(255, 255, 255, 0.1); border: none; color: ${textColor}; cursor: pointer; padding: 6px; border-radius: 6px; display: ${config.hideInstructionButton ? 'none' : 'flex'}; align-items: center; justify-content: center; transition: background 0.2s; width: 32px; height: 32px;" title="Configuration Guide">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
            </button>
        `;

        headerDiv.appendChild(headerTitle);

        const searchDiv = document.createElement('div');
        searchDiv.className = 'shape-search-container';
        searchDiv.style.cssText = 'margin-bottom: 1.5rem;';
        searchDiv.innerHTML = `
            <input type="text" id="shape-search-input" placeholder="Search shapes by name..." style="width: 100%; padding: 0.75rem; border: 2px solid ${borderColor}; background: ${inputBgColor}; color: ${textColor}; border-radius: 8px; font-size: 0.9rem; transition: all 0.2s;">
        `;

        const casesListDiv = document.createElement('div');
        casesListDiv.className = 'shape-cases-grid';
        casesListDiv.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;';

        // Sort entries alphabetically by name
        const sortedEntries = Object.entries(currentShapePatternsStorage_w).sort((a, b) => a[1].localeCompare(b[1]));

        sortedEntries.forEach(([pattern, name], idx) => {
            const caseDiv = document.createElement('div');
            caseDiv.className = 'shape-config-item';
            caseDiv.setAttribute('data-shape-name', name.toLowerCase());

            // Check if this is one of the last two items
            const totalItems = sortedEntries.length;
            const isSecondToLast = idx === totalItems - 2;
            const isLast = idx === totalItems - 1;

            let gridColumn = '';
            if (totalItems % 3 === 2) {
                // shift last two cards horizontally (33% and 66% of column width)
                if (isSecondToLast) {
                    gridColumn = 'transform: translateX(calc(33% + 14px));';
                    caseDiv.classList.add('second-to-last-card');
                }
                if (isLast) {
                    gridColumn = 'transform: translateX(calc(66% - 14px));';
                    caseDiv.classList.add('last-card');
                }
            }

            // Mark the very last card if odd total for 2-column layout
            if (idx === totalItems - 1 && totalItems % 2 === 1) {
                caseDiv.classList.add('last-odd-card');
            }

            const cardBg = isDark ? adjustColorBrightness(config.backgroundColor, 12) : adjustColorBrightness(config.backgroundColor, -4);
            caseDiv.style.cssText = `
                background: ${cardBg};
                padding: 1rem;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                transition: all 0.2s;
                ${gridColumn}
            `;

            const nameSpan = document.createElement('div');
            nameSpan.style.cssText = `font-weight: 600; color: ${textColor}; font-size: 0.9rem; margin-bottom: 0.5rem; text-align: center;`;
            nameSpan.textContent = name;

            const vizDiv = document.createElement('div');
            vizDiv.innerHTML = generateSimpleShapeVisualizationSVG_w(pattern, 112, 'config-' + pattern);
            vizDiv.style.cssText = 'margin-bottom: 0.5rem;';

            caseDiv.appendChild(nameSpan);
            caseDiv.appendChild(vizDiv);
            casesListDiv.appendChild(caseDiv);
        });

        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.cssText = `grid-column: 1 / -1; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 2px solid ${borderColor}; text-align: center; display: flex; gap: 1rem; justify-content: center;`;

        const saveBtnBg = isDark ? adjustColorBrightness(config.backgroundColor, 20) : adjustColorBrightness(config.backgroundColor, -10);
        const saveBtnHover = isDark ? adjustColorBrightness(config.backgroundColor, 25) : adjustColorBrightness(config.backgroundColor, -15);
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save & Apply';
        saveBtn.id = 'configSaveBtn';
        saveBtn.style.cssText = `
            padding: 0.75rem 2rem;
            border: 2px solid ${borderColor};
            border-radius: 10px;
            font-weight: 600;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.2s;
            background: ${saveBtnBg};
            color: ${textColor};
        `;

        saveBtn.onmouseover = () => {
            saveBtn.style.background = saveBtnHover;
        };

        saveBtn.onmouseout = () => {
            saveBtn.style.background = saveBtnBg;
        };

        const performSave = () => {
            // Save shape patterns and corner sticker mode
            saveShapesToStorage_w(currentShapePatternsStorage_w);
            if (typeof saveState === 'function') {
                saveState();
            }

            // Close config modal
            configModalDiv.remove();
            configFloatingCloseBtn.remove();
            configStyle.remove();
            if (floatingSaveBtn) floatingSaveBtn.remove();
            window.removeEventListener('resize', resizeHandler);
            configModalDiv.removeEventListener('scroll', scrollHandler);
            const backdrop = document.querySelector('.parity-tracer-backdrop');
            if (backdrop) {
                backdrop.removeEventListener('scroll', scrollHandler);
            }
            if (mainCloseBtn) mainCloseBtn.style.display = 'flex';
            if (mainSettingsBtn) mainSettingsBtn.style.display = 'flex';

            // Trigger live update in the parity modal
            if (modalElement) {
                const scrambleInput = modalElement.querySelector('input[type="text"]');
                if (scrambleInput) {
                    const event = new Event('input', { bubbles: true });
                    scrambleInput.dispatchEvent(event);
                }
            }

            // Recalculate parity with new settings
            if (typeof needsParityRecalculation === 'function' && needsParityRecalculation()) {
                if (typeof calculateAndCacheAllParity === 'function') {
                    calculateAndCacheAllParity();
                }
            }

            // Re-render cards and modals
            if (typeof render === 'function') {
                render();
            }
            if (typeof filterAndSort === 'function') {
                filterAndSort();
            }

            if (typeof showToast === 'function') {
                showToast('Settings saved! All parity calculations have been updated.', 3000, 'success');
            }
        };

        saveBtn.onclick = performSave;

        const resetBtnBg = isDark ? adjustColorBrightness(config.backgroundColor, 15) : adjustColorBrightness(config.backgroundColor, -8);
        const resetBtnHover = isDark ? adjustColorBrightness(config.backgroundColor, 20) : adjustColorBrightness(config.backgroundColor, -12);
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Reset to Default';
        resetBtn.style.cssText = `
            padding: 0.75rem 2rem;
            border: 2px solid ${borderColor};
            border-radius: 10px;
            font-weight: 600;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.2s;
            background: ${resetBtnBg};
            color: ${textColor};
        `;

        resetBtn.onmouseover = () => {
            resetBtn.style.background = resetBtnHover;
        };

        resetBtn.onmouseout = () => {
            resetBtn.style.background = resetBtnBg;
        };

        resetBtn.onclick = () => {
            currentShapePatternsStorage_w = { ...defaultShapePatterns_w };
            saveShapesToStorage_w(currentShapePatternsStorage_w);
            configModalDiv.remove();
            configFloatingCloseBtn.remove();
            configStyle.remove();
            showTracingSchemeSettingsModal(modalElement, config, mainCloseBtn, mainInstructionBtn, mainSettingsBtn);
        };

        buttonsDiv.appendChild(saveBtn);
        buttonsDiv.appendChild(resetBtn);

        // Create floating save button
        const floatingSaveBtn = document.createElement('button');
        floatingSaveBtn.className = 'config-floating-save-btn';
        floatingSaveBtn.style.cssText = `
            position: fixed;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: none;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10010;
            border: none;
            background: ${saveBtnBg};
            color: ${textColor};
            transition: all 0.2s;
            padding: 0;
        `;
        floatingSaveBtn.innerHTML = '<img src="res/save.svg" style="width: 24px; height: 24px;">';

        floatingSaveBtn.onmouseover = () => {
            floatingSaveBtn.style.background = saveBtnHover;
            floatingSaveBtn.style.transform = 'scale(1.1)';
        };

        floatingSaveBtn.onmouseout = () => {
            floatingSaveBtn.style.background = saveBtnBg;
            floatingSaveBtn.style.transform = 'scale(1)';
        };

        floatingSaveBtn.onclick = performSave;

        document.body.appendChild(floatingSaveBtn);

        // Track if data has changed
        let dataChanged = false;

        // Function to update floating save button visibility
        function updateFloatingSaveBtn() {
            try {
                const contentRect = configContent.getBoundingClientRect();
                const saveBtnRect = saveBtn.getBoundingClientRect();
                const saveBtnVisible = saveBtnRect.top >= 0 && saveBtnRect.bottom <= window.innerHeight;

                if (dataChanged && !saveBtnVisible) {
                    floatingSaveBtn.style.display = 'flex';
                    // NUCLEAR: Calculate position from viewport, not relative values
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;
                    const modalRight = contentRect.right;
                    const modalBottom = contentRect.bottom;

                    const calculatedRight = viewportWidth - modalRight + 16;
                    const calculatedBottom = viewportHeight - modalBottom + 16;

                    // Fixed offset from modal edge
                    floatingSaveBtn.style.right = `${calculatedRight}px`;
                    floatingSaveBtn.style.bottom = `${calculatedBottom}px`;
                    floatingSaveBtn.style.position = 'fixed';

                } else {
                    floatingSaveBtn.style.display = 'none';
                }
            } catch (e) {
                console.error('Error updating floating save button:', e);
            }
        }

        // Listen for scroll on config content
        configContent.addEventListener('scroll', updateFloatingSaveBtn);
        window.addEventListener('resize', updateFloatingSaveBtn);

        // NUCLEAR: Continuous updates until position stabilizes
        let updateCount = 0;
        const maxUpdates = 20;
        const updateInterval = setInterval(() => {
            updateFloatingSaveBtn();
            updateCount++;
            if (updateCount >= maxUpdates) {
                clearInterval(updateInterval);
            }
        }, 100);

        // Also do immediate updates
        updateFloatingSaveBtn();
        setTimeout(updateFloatingSaveBtn, 0);

        // Setup config info button handler
        setTimeout(() => {
            const configInfoBtn = configContent.querySelector('.config-info-btn');
            if (configInfoBtn) {
                configInfoBtn.onclick = () => {
                    showConfigOrientationInstructionModal(config);
                };
            }
        }, 100);

        casesListDiv.appendChild(buttonsDiv);

        configContent.appendChild(headerDiv);
        configContent.appendChild(searchDiv);
        configContent.appendChild(casesListDiv);
        configModalDiv.appendChild(configContent);

        // Add style to hide webkit scrollbar for config modal and add responsive layout
        const configStyle = document.createElement('style');
        configStyle.textContent = `
            .parity-tracer-config-modal::-webkit-scrollbar {
                display: none;
            }
            .parity-tracer-config-content::-webkit-scrollbar {
                display: none;
            }
            .shape-search-container {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                height: auto !important;
                overflow: visible !important;
                position: relative !important;
            }
            .shape-search-container input {
                opacity: 1 !important;
                pointer-events: auto !important;
                position: relative !important;
            }
            @media (max-width: 570px) {
                .shape-search-container {
                display: block !important;
                visibility: visible !important;
                }
                .shape-search-container input {
                opacity: 1 !important;
                pointer-events: auto !important;
                position: relative !important;
                }
                .shape-cases-grid {
                grid-template-columns: repeat(2, 1fr) !important;
                }
                .shape-config-item.second-to-last-card,
                .shape-config-item.last-card {
                transform: none !important;
                }
                .shape-config-item.last-odd-card {
                grid-column: 1 / -1;
                max-width: calc(50% - 0.5rem);
                margin: 0 auto !important;
                }
            }
            @media (max-width: 420px) {
                .shape-cases-grid {
                grid-template-columns: 1fr !important;
                }
                .shape-config-item.last-odd-card {
                max-width: 100% !important;
                }
            }
        `;
        document.head.appendChild(configStyle);

        // Create floating close button for config modal
        const configFloatingCloseBtn = document.createElement('button');
        configFloatingCloseBtn.className = 'config-floating-close-btn';
        configFloatingCloseBtn.innerHTML = '×';
        configFloatingCloseBtn.style.cssText = `
            position: fixed;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 10009;
            border: none;
            background: #f7fafc;
            color: #2d3748;
            transition: transform 0.2s;
        `;

        const configCloseBg = isDark ? adjustColorBrightness(config.backgroundColor, 15) : adjustColorBrightness(config.backgroundColor, -5);
        const configCloseHover = isDark ? adjustColorBrightness(config.backgroundColor, 20) : adjustColorBrightness(config.backgroundColor, -8);

        configFloatingCloseBtn.style.background = configCloseBg;
        configFloatingCloseBtn.style.color = textColor;

        configFloatingCloseBtn.onmouseover = () => {
            configFloatingCloseBtn.style.transform = 'scale(1.1)';
            configFloatingCloseBtn.style.background = configCloseHover;
        };

        configFloatingCloseBtn.onmouseout = () => {
            configFloatingCloseBtn.style.transform = 'scale(1)';
            configFloatingCloseBtn.style.background = configCloseBg;
        };

        document.body.appendChild(configFloatingCloseBtn);

        // Position the button relative to config content - run after DOM update
        function updateConfigClosePosition() {
            const rect = configContent.getBoundingClientRect();
            configFloatingCloseBtn.style.top = `${rect.top + 8}px`;
            configFloatingCloseBtn.style.right = `${window.innerWidth - rect.right + 4}px`;
        }

        // Initial position with slight delay to ensure DOM is ready
        setTimeout(updateConfigClosePosition, 10);

        const resizeHandler = () => updateConfigClosePosition();
        const scrollHandler = () => updateConfigClosePosition();
        window.addEventListener('resize', resizeHandler);
        configModalDiv.addEventListener('scroll', scrollHandler);
        // Find the backdrop element
        const backdrop = document.querySelector('.parity-tracer-backdrop');
        if (backdrop) {
            backdrop.addEventListener('scroll', scrollHandler);
        }

        // Search functionality
        setTimeout(() => {
            const searchInput = configContent.querySelector('#shape-search-input');
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const shapeItems = configContent.querySelectorAll('.shape-config-item');

                shapeItems.forEach(item => {
                    const shapeName = item.getAttribute('data-shape-name');
                    if (shapeName.includes(searchTerm)) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });

            const focusColor = isDark ? adjustColorBrightness(config.backgroundColor, 30) : adjustColorBrightness(config.backgroundColor, -15);
            searchInput.addEventListener('focus', () => {
                searchInput.style.borderColor = focusColor;
            });

            searchInput.addEventListener('blur', () => {
                searchInput.style.borderColor = borderColor;
            });
        }, 100);

        const closeConfigModal = (skipConfirmation = false) => {
            // Check for unsaved changes
            if (dataChanged && !skipConfirmation) {
                // Prevent closing
                event?.preventDefault();
                event?.stopPropagation();

                // Show custom choice buttons using a creative approach
                const choiceContainer = document.createElement('div');
                choiceContainer.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    padding: 24px;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                    z-index: 2147483647;
                    min-width: 300px;
                `;

                choiceContainer.innerHTML = `
                    <h3 style="margin: 0 0 12px 0; color: #333; font-size: 1.1rem;">Unsaved Changes</h3>
                    <p style="margin: 0 0 20px 0; color: #666; font-size: 0.95rem;">You have unsaved changes. What would you like to do?</p>
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="discard-btn" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Discard</button>
                        <button class="cancel-btn" style="padding: 8px 16px; background: #f8f9fa; color: #333; border: 1px solid #dee2e6; border-radius: 6px; cursor: pointer; font-weight: 600;">Cancel</button>
                        <button class="save-btn" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Save</button>
                    </div>
                `;

                // Add it OUTSIDE all modal structures
                const tempContainer = document.createElement('div');
                tempContainer.id = 'temp-confirm-container-ultimate';
                tempContainer.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 2147483646; display: flex; align-items: center; justify-content: center;';
                tempContainer.appendChild(choiceContainer);
                document.body.appendChild(tempContainer);

                choiceContainer.querySelector('.discard-btn').onclick = () => {
                    tempContainer.remove();
                    closeConfigModal(true);
                };

                choiceContainer.querySelector('.cancel-btn').onclick = () => {
                    tempContainer.remove();
                };

                choiceContainer.querySelector('.save-btn').onclick = () => {
                    tempContainer.remove();
                    performSave();
                };

                return;
            }

            closeModalWithHistory(() => {
                // Clean up scroll listeners first
                configContent.removeEventListener('scroll', updateFloatingSaveBtn);
                window.removeEventListener('resize', resizeHandler);
                configModalDiv.removeEventListener('scroll', scrollHandler);
                const backdrop = document.querySelector('.parity-tracer-backdrop');
                if (backdrop) {
                    backdrop.removeEventListener('scroll', scrollHandler);
                }

                // Clear any update intervals
                if (typeof updateInterval !== 'undefined') {
                    clearInterval(updateInterval);
                }

                // Remove elements
                if (floatingSaveBtn && floatingSaveBtn.parentNode) {
                    floatingSaveBtn.remove();
                }
                configModalDiv.remove();
                configFloatingCloseBtn.remove();
                configStyle.remove();

                // Restore main modal buttons if they exist
                if (mainCloseBtn) mainCloseBtn.style.display = 'flex';
                if (mainSettingsBtn) mainSettingsBtn.style.display = 'flex';
            });
        };

        // Back button handler for config modal using unified system
        if (typeof pushModalState !== 'undefined') {
            pushModalState('parityConfigModal', closeConfigModal);
        }

        configFloatingCloseBtn.onclick = () => closeConfigModal();

        configModalDiv.onclick = (e) => {
            if (e.target === configModalDiv) {
                closeConfigModal();
            }
        };

        // Handle shape piece clicks for rotation - COMPLETE LOGIC RESTORED
        setTimeout(() => {
            configContent.querySelectorAll('[class*="shape-piece-config-"]').forEach(piece => {
                piece.style.cursor = 'pointer';
                piece.onclick = (e) => {
                    const classList = Array.from(e.target.classList);
                    const configClass = classList.find(c => c.startsWith('shape-piece-config-'));

                    if (configClass) {
                        const pattern = configClass.replace('shape-piece-config-', '');
                        const clickedIndex = parseInt(e.target.getAttribute('data-piece-index'));

                        if (!isNaN(clickedIndex)) {
                            // Save scroll position before update
                            const scrollPos = configModalDiv.scrollTop;

                            setShapeOrientation_w(pattern, clickedIndex, 'config');
                            dataChanged = true;
                            updateFloatingSaveBtn();

                            // Find the card element
                            const cardElement = e.target.closest('.shape-config-item');
                            if (cardElement) {
                                const shapeName = cardElement.getAttribute('data-shape-name');

                                // Update only the visualization in this card
                                const vizDiv = cardElement.querySelector('div:nth-child(2)');

                                // Find the new pattern for this shape
                                let newPattern = '';
                                for (const [pat, name] of Object.entries(currentShapePatternsStorage_w)) {
                                    if (name.toLowerCase() === shapeName) {
                                        newPattern = pat;
                                        break;
                                    }
                                }

                                if (newPattern) {
                                    vizDiv.innerHTML = generateSimpleShapeVisualizationSVG_w(newPattern, 112, 'config-' + newPattern);

                                    // Re-attach click handlers to new pieces
                                    vizDiv.querySelectorAll('[class*="shape-piece-config-"]').forEach(newPiece => {
                                        newPiece.style.cursor = 'pointer';
                                        newPiece.onclick = piece.onclick;
                                    });
                                }
                            }

                            // Restore scroll position
                            configModalDiv.scrollTop = scrollPos;
                        }
                    }
                };
            });
        }, 100);

        document.body.appendChild(configModalDiv);

        // Force a reflow to ensure the modal is in the DOM before we calculate positions
        configModalDiv.offsetHeight;
    }

    // Main library function - THE ONLY EXPORTED FUNCTION - COMPLETE
    function createParityTracerModal(options = {}) {
        // CRITICAL: Always reload shapes from storage when modal opens
        currentShapePatternsStorage_w = loadShapesFromStorage_w();

        const config = {
            backgroundColor: options.backgroundColor || '#ffffff',
            hideInstructionButton: options.hideInstructionButton || false,
            instructionText1: options.instructionText1 || 'Enter your scramble in the top input bar and press Analyze to trace parity.',
            instructionText2: options.instructionText2 || 'You can change the color scheme from Settings.',
            instructionText2: options.instructionText3 || 'For symmetric case, click on the very middle of the image to trace from the other symmetry.',
            instructionText3: options.instructionText4 || 'Personalize your tracing methods and tracing positions from the settings button.',
            tlMainCol: options.topColor || '#000000',
            tlColName: options.topColorName || 'Black',
            tlColAbb: options.topColorShort || 'B',
            blMainCol: options.bottomColor || '#FFFFFF',
            blColName: options.bottomColorName || 'White',
            blColAbb: options.bottomColorShort || 'W',
            frontCol: options.frontColor || '#CC0000',
            rightCol: options.rightColor || '#00AA00',
            backCol: options.backColor || '#FF8C00',
            leftCol: options.leftColor || '#0066CC',
            scrambleTextInput: options.scrambleText || '',
            shouldGenerateImage: options.generateImage !== false,
            imageSizeInPixels: options.imageSize || 200,
            returnOnlyParityValue: options.returnOnlyValue || false
        };

        // Set global color configuration
        C_Colors = {
            tlMainCol: config.tlMainCol,
            tlColName: config.tlColName,
            tlColAbb: config.tlColAbb,
            blMainCol: config.blMainCol,
            blColName: config.blColName,
            blColAbb: config.blColAbb,
            frontCol: config.frontCol,
            rightCol: config.rightCol,
            backCol: config.backCol,
            leftCol: config.leftCol
        };

        // If returnOnlyValue, calculate and return only the parity result - COMPLETE LOGIC
        if (config.returnOnlyParityValue && config.scrambleTextInput) {
            try {
                const { tlHex, blHex } = scrambleToHex(config.scrambleTextInput);
                const useClockwise = (typeof cornerMode !== 'undefined' && cornerMode === 'clockwise');
                const p = calculateParityFromHex(tlHex, blHex, z2TracingModeEnabled, useClockwise, config.scrambleTextInput);
                const useEvil = getEvilnessStringReturn() && p.evilStep !== null;
                return (useEvil ? p.isOddWithEvil : p.isOdd) ? 'Odd' : 'Even';
            } catch (err) {
                console.error('Parity calculation error:', err);
                return 'error';
            }
        }

        // Calculate contrasting colors based on background
        function getContrastColor(hexColor) {
            const r = parseInt(hexColor.substr(1, 2), 16);
            const g = parseInt(hexColor.substr(3, 2), 16);
            const b = parseInt(hexColor.substr(5, 2), 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminance > 0.5 ? '#000000' : '#FFFFFF';
        }

        function adjustColorBrightness(hexColor, percent) {
            const num = parseInt(hexColor.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = Math.min(255, Math.max(0, (num >> 16) + amt));
            const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
            const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
            return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
        }

        const textColor = getContrastColor(config.backgroundColor);
        const isDark = textColor === '#FFFFFF';
        const borderColor = isDark ? adjustColorBrightness(config.backgroundColor, 20) : adjustColorBrightness(config.backgroundColor, -10);
        const inputBgColor = isDark ? adjustColorBrightness(config.backgroundColor, DM_INPUT_BG) : adjustColorBrightness(config.backgroundColor, LM_INPUT_BG);
        const buttonBgColor = isDark ? adjustColorBrightness(config.backgroundColor, DM_BUTTON_BG) : adjustColorBrightness(config.backgroundColor, LM_BUTTON_BG);
        const hoverBgColor = isDark ? adjustColorBrightness(config.backgroundColor, DM_HOVER_BG) : adjustColorBrightness(config.backgroundColor, LM_HOVER_BG);

        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'parity-tracer-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10005;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        `;

        // Create modal structure
        const modal = document.createElement('div');
        modal.className = 'parity-tracer-modal-container';
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        const maxHeight = vh > 900 ? 'auto' : (vh > 600 ? '90vh' : '85vh');
        const padding = vw <= 420 ? '1rem' : '1.5rem';
        const borderRadius = vw <= 420 ? '12px' : '16px';
        modal.style.cssText = `
            position: relative;
            background: ${config.backgroundColor};
            border-radius: ${borderRadius};
            padding: ${padding};
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 90%;
            max-height: ${maxHeight};
            overflow-y: auto;
            z-index: 10006;
        `;

        const uniqueId = 'pt-' + Math.random().toString(36).substr(2, 9);

        modal.innerHTML = `
      <style>
        .parity-tracer-modal-container * {
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
        }
        .parity-tracer-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 1rem;
        }
        .parity-tracer-header h2 {
          font-size: 1.5rem;
          color: ${textColor};
          margin: 0;
        }
        .parity-tracer-header-info-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: ${textColor};
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          display: ${config.hideInstructionButton ? 'none' : 'flex'};
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
          width: 32px;
          height: 32px;
        }
        .parity-tracer-header-info-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .utility-buttons-container {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          margin-top: 0.75rem;
          flex-wrap: wrap;
        }
        .utility-toggle-btn {
          padding: 0.5rem 1rem;
          border: 2px solid ${borderColor};
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.85rem;
          transition: all 0.2s;
          background: ${inputBgColor};
          color: ${textColor};
          min-width: 70px;
        }
        .utility-toggle-btn:hover {
          background: ${buttonBgColor};
        }
        .utility-toggle-btn.active {
          background: ${hoverBgColor};
          border-color: ${textColor};
        }
        .parity-tracer-modal-container * {
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
        }
        .parity-tracer-modal-container::-webkit-scrollbar {
          width: 0px;
          display: none;
        }
        .parity-tracer-modal-container {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .parity-tracer-input-container {
          display: flex;
          gap: 0;
          margin-bottom: 1rem;
          position: relative;
          height: 44px;
        }
        .parity-tracer-input-container input {
          flex: 1;
          padding: 0.75rem;
          border: 2px solid;
          border-right: none;
          border-radius: 8px 0 0 8px;
          font-family: "Monaco", "Consolas", monospace;
          font-size: 0.9rem;
          transition: all 0.2s;
          height: 44px;
          margin: 0;
          min-width: 0;
        }
        @media (max-width: 570px) {
          .parity-tracer-input-container {
            height: 40px;
          }
          .parity-tracer-input-container input {
            padding: 0.5rem;
            font-size: 0.8rem;
            height: 40px;
          }
          .parity-tracer-input-container button {
            padding: 0 0.75rem;
            font-size: 0.85rem;
            height: 40px;
          }
        }
        @media (max-width: 420px) {
          .parity-tracer-input-container {
            height: 36px;
          }
          .parity-tracer-input-container input {
            padding: 0.4rem;
            font-size: 0.75rem;
            height: 36px;
          }
          .parity-tracer-input-container button {
            padding: 0 0.6rem;
            font-size: 0.8rem;
            height: 36px;
          }
        }
        .parity-tracer-input-container input:focus {
          outline: none;
        }
        .parity-tracer-input-container button {
          padding: 0 1rem;
          border: 2px solid;
          border-left: none;
          border-radius: 0 8px 8px 0;
          cursor: pointer;
          transition: all 0.2s;
          height: 44px;
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .parity-tracer-input-container button:hover {
          opacity: 0.8;
        }
        .parity-tracer-settings-btn {
          position: fixed;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.25rem;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 10007;
          border: none;
        }
        .parity-tracer-settings-btn:hover {
          transform: scale(1.1);
          opacity: 0.9;
        }
        .parity-tracer-close-btn {
          position: fixed;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.25rem;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          z-index: 10007;
          border: none;
        }
        .parity-tracer-close-btn:hover {
          transform: scale(1.1);
          opacity: 0.9;
        }

        .parity-tracer-modal-container .color-dot {
          display: inline-block;
          width: 16px;
          height: 16px;
          border-radius: 3px;
          margin: 0 2px;
          vertical-align: middle;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .parity-tracer-modal-container .W {
          background: #ffffff;
          border: 1px solid #e2e8f0;
        }
        .parity-tracer-modal-container .Y { background: #ffd700; }
        .parity-tracer-modal-container .G { background: #48bb78; }
        .parity-tracer-modal-container .B { background: #4299e1; }
        .parity-tracer-modal-container .R { background: #f56565; }
        .parity-tracer-modal-container .O { background: #ed8936; }
        .parity-tracer-modal-container .results-section {
          margin-top: 1rem;
        }
        .parity-tracer-modal-container .parity-grid-tracer-lib {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }
        @media (min-width: 600px) {
          .parity-tracer-modal-container .parity-grid-tracer-lib {
            grid-template-columns: 1fr 1fr;
          }
        }
        .shape-piece {
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .shape-piece:hover {
          fill: #ffd700 !important;
          stroke-width: 3;
        }
      </style>
      <div class="parity-tracer-header">
        <h2>Cale's Parity Tracer</h2>
        <button class="parity-tracer-header-info-btn" id="${uniqueId}-header-info" title="Parity Tracer Guide">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </button>
      </div>
      <div class="parity-tracer-input-container">
        <input type="text" id="${uniqueId}-scramble" value="${config.scrambleTextInput}" placeholder="Enter your scramble..." style="margin: 0; background: ${inputBgColor}; color: ${textColor}; border-color: ${borderColor}; border-radius:8px;">
      </div>
      <div id="${uniqueId}-visualization" style="display: flex; justify-content: center; margin-bottom: 1rem;"></div>
      <div class="utility-buttons-container">
        <button class="utility-toggle-btn" id="${uniqueId}-z2-btn">z2</button>
        <button class="utility-toggle-btn" id="${uniqueId}-y2-btn">y2</button>
        <button class="utility-toggle-btn" id="${uniqueId}-flip-btn">Flip Color</button>
      </div>
      <div id="${uniqueId}-results" class="results-section"></div>
    `;

        // Attach event handlers - COMPLETE LOGIC
        setTimeout(() => {
            const scrambleInput = modal.querySelector(`#${uniqueId}-scramble`);
            const vizContainer = modal.querySelector(`#${uniqueId}-visualization`);
            const resultsContainer = modal.querySelector(`#${uniqueId}-results`);
            const closeBtnElement = document.getElementById(`${uniqueId}-close`);
            const settingsBtnElement = document.getElementById(`${uniqueId}-settings`);

            // Position buttons based on modal position
            function updateButtonPositions() {
                const rect = modal.getBoundingClientRect();
                const closeTop = rect.top + 8;
                const closeRight = window.innerWidth - rect.right + 6;
                const settingsBottom = window.innerHeight - rect.bottom + 16;
                const settingsRight = window.innerWidth - rect.right + 6;
                closeBtnElement.style.top = `${closeTop}px`;
                closeBtnElement.style.right = `${closeRight}px`;
                settingsBtnElement.style.bottom = `${settingsBottom}px`;
                settingsBtnElement.style.right = `${settingsRight}px`;
            }

            // Force multiple updates with delays to catch layout settling
            const buttonUpdateTimings = [0, 50, 100, 200, 300, 500];
            buttonUpdateTimings.forEach(delay => {
                setTimeout(updateButtonPositions, delay);
            });

            window.addEventListener('resize', updateButtonPositions);
            backdrop.addEventListener('scroll', updateButtonPositions);

            function performAnalysis_w() {
                // Ensure we have the latest shapes before analysis
                currentShapePatternsStorage_w = loadShapesFromStorage_w();

                // Re-read all live settings from localStorage on every analysis
                const storedZ2 = localStorage.getItem('z2TracingModeForParityTracerLibrary');
                z2TracingModeEnabled = storedZ2 !== null ? storedZ2 === 'true' : true;
                const storedImgSize = localStorage.getItem('parityTracerImageSize');
                parityTracerImageSize = storedImgSize !== null ? parseInt(storedImgSize) : 200;
                const storedArrow = localStorage.getItem('parityTracerShowArrow');
                showCircularArrow = storedArrow !== null ? storedArrow === 'true' : true;
                const storedArrowSettings = localStorage.getItem('parityTracerArrowSettings');
                if (storedArrowSettings) arrowSettings = JSON.parse(storedArrowSettings);

                let scrambleText = scrambleInput.value.trim() || '(0,0)';
                if (typeof window.ScrambleNormalizer !== 'undefined' && window.ScrambleNormalizer.normalizeScramble) {
                    scrambleText = window.ScrambleNormalizer.normalizeScramble(scrambleText) || scrambleText;
                }
                // Store in a scope accessible to button handlers
                window.currentParityTracerScramble = scrambleText;

                // Apply utility transformations (z2, y2, flip color)
                const transformedScramble = applyUtilityTransformationsToScramble(scrambleText);

                try {
                    const { tlHex, blHex } = scrambleToHex(transformedScramble);
                    const useClockwise = (typeof cornerStickerMode !== 'undefined' && cornerStickerMode === 'clockwise');
                    const parity = calculateParityFromHex(tlHex, blHex, z2TracingModeEnabled, useClockwise, scrambleText);

                    // Visualize
                    if (config.shouldGenerateImage && Cglobal.Square1VisualizerLibraryWithSillyNames) {
                        const hexCode = tlHex + '|' + blHex.slice(0,6) + blHex.slice(6);
                        try {
                            const imageSize = parityTracerImageSize;
                            const svgContent = Cglobal.Square1VisualizerLibraryWithSillyNames.visualizeFromHexCode(
                                hexCode, imageSize,
                                { topColor: config.tlMainCol, bottomColor: config.blMainCol,
                                  frontColor: config.frontCol, rightColor: config.rightCol,
                                  backColor: config.backCol, leftColor: config.leftCol }
                            );

                            const { topMatch, botMatch, topUnits, botUnits, topBits, botBits } = parity;
                            // unrotated units for arrow calculation
                            const { topUnits: topRawU, botUnits: botRawU } = hexToUnits(tlHex, blHex);

                            const unit10vh = imageSize * 0.4;
                            const radiusOuter = unit10vh * 0.7;
                            const ringRadius = radiusOuter + (unit10vh * 0.4);
                            const centerX = imageSize / 2, centerY = imageSize / 2;

                            const topArrowData = calculateArrowStartAngle_w(topMatch.rot, topRawU, 'TOP', topBits);
                            const botArrowData = calculateArrowStartAngle_w(botMatch.rot, botRawU, 'BOTTOM', botBits);

                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = svgContent;
                            const svgs = tempDiv.querySelectorAll('svg');
                            if (svgs.length >= 2) {
                                svgs[0].insertAdjacentHTML('beforeend', generateArrowSVGOverlay_w(centerX, centerY, ringRadius, topArrowData.startAngle, topArrowData.arcDegrees, imageSize));
                                svgs[1].insertAdjacentHTML('beforeend', generateArrowSVGOverlay_w(centerX, centerY, ringRadius, botArrowData.startAngle, botArrowData.arcDegrees, imageSize));
                            }
                            vizContainer.innerHTML = tempDiv.innerHTML;

                            const svgsInContainer = vizContainer.querySelectorAll('svg');
                            if (svgsInContainer.length >= 2) {
                                const addSymBtn = (svg, layerType, match) => {
                                    if (match.symmetryDegree <= 1) return;
                                    const svgNS = "http://www.w3.org/2000/svg";
                                    const btn = document.createElementNS(svgNS, 'circle');
                                    btn.setAttribute('cx', centerX); btn.setAttribute('cy', centerY);
                                    btn.setAttribute('r', ringRadius * 0.3);
                                    btn.setAttribute('fill', 'transparent');
                                    btn.setAttribute('style', 'cursor:pointer;');
                                    btn.addEventListener('click', () => {
                                        const sk = (window.currentParityTracerScramble||scrambleInput.value.trim()).replace(/\s+/g,'');
                                        if (!window.parityTracerSymmetryOffsets) window.parityTracerSymmetryOffsets = {};
                                        if (!window.parityTracerSymmetryOffsets[sk]) window.parityTracerSymmetryOffsets[sk] = {top:0,bottom:0};
                                        const cur = window.parityTracerSymmetryOffsets[sk][layerType] || 0;
                                        const max = match.name==='Star' ? 2 : match.symmetryDegree;
                                        window.parityTracerSymmetryOffsets[sk][layerType] = (cur+1)%max;
                                        performAnalysis_w();
                                    });
                                    svg.appendChild(btn);
                                };
                                addSymBtn(svgsInContainer[0], 'top', parity.topMatch);
                                addSymBtn(svgsInContainer[1], 'bottom', parity.botMatch);
                            }
                        } catch (err) {
                            vizContainer.innerHTML = `<div style="color:#e53e3e;">Visualization error: ${err.message}</div>`;
                        }
                    }

                    displayResultsInModal_w(resultsContainer, parity, config);

                } catch (err) {
                    console.error(err);
                    resultsContainer.innerHTML = '<div style="color:#e53e3e;padding:1rem;">Error parsing scramble. Check the format.</div>';
                }
            }

            scrambleInput.addEventListener('input', () => {
                performAnalysis_w();
            });

            scrambleInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                }
            });

            // Utility button handlers
            const z2Btn = modal.querySelector(`#${uniqueId}-z2-btn`);
            const y2Btn = modal.querySelector(`#${uniqueId}-y2-btn`);
            const flipBtn = modal.querySelector(`#${uniqueId}-flip-btn`);

            z2Btn.addEventListener('click', () => {
                utilityZ2Enabled = !utilityZ2Enabled;
                z2Btn.classList.toggle('active', utilityZ2Enabled);
                performAnalysis_w();
            });

            y2Btn.addEventListener('click', () => {
                utilityY2Enabled = !utilityY2Enabled;
                y2Btn.classList.toggle('active', utilityY2Enabled);
                performAnalysis_w();
            });

            flipBtn.addEventListener('click', () => {
                utilityFlipColorEnabled = !utilityFlipColorEnabled;
                flipBtn.classList.toggle('active', utilityFlipColorEnabled);
                performAnalysis_w();
            });

            const closeMainModal = () => {
                closeModalWithHistory(() => {
                    // Reset utility states when closing
                    utilityZ2Enabled = false;
                    utilityY2Enabled = false;
                    utilityFlipColorEnabled = false;

                    window.removeEventListener('resize', updateButtonPositions);
                    backdrop.remove();
                    closeBtnElement.remove();
                    settingsBtnElement.remove();
                    document.body.classList.remove('modal-open');
                    document.body.style.top = '';
                    window.scrollTo(0, window.modalScrollY || 0);
                });
            };

            // Use unified back button handler
            if (typeof pushModalState !== 'undefined') {
                pushModalState('parityTracerModal', closeMainModal);
            }

            closeBtnElement.addEventListener('click', closeMainModal);

            // Header info button
            const headerInfoBtn = modal.querySelector(`#${uniqueId}-header-info`);
            if (headerInfoBtn) {
                headerInfoBtn.addEventListener('click', () => {
                    showParityTracerInstructionModal(config);
                });
            }

            settingsBtnElement.addEventListener('click', () => {
                window.openUnifiedSettings('parity');
            });

            // Close on backdrop click
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    closeMainModal();
                }
            });

            // Auto-analyze if scramble is provided, otherwise use (0,0)
            if (config.scrambleTextInput) {
                performAnalysis_w();
            } else {
                performAnalysis_w();
            }
        }, 0);
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'parity-tracer-close-btn';
        closeBtn.id = `${uniqueId}-close`;
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText += `background: ${buttonBgColor}; color: ${textColor};`;

        // Create settings button
        const settingsIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16" style="display: block; transform: scale(0.7); transform-origin: center;"><path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/><path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z"/></svg>`;
        const settingsBtn = document.createElement('button');
        settingsBtn.className = 'parity-tracer-settings-btn';
        settingsBtn.id = `${uniqueId}-settings`;
        settingsBtn.innerHTML = settingsIcon;
        settingsBtn.style.cssText += `background: ${buttonBgColor}; color: ${textColor};`;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);
        document.body.appendChild(closeBtn);
        document.body.appendChild(settingsBtn);

        window.modalScrollY = window.scrollY;
        document.body.style.top = `-${window.modalScrollY}px`;
        document.body.classList.add('modal-open');

        return backdrop;
    }

    // Export the single function
    Cglobal.ParityTracerLibrary = {
        createModal: createParityTracerModal,
        openConfigModal: showTracingSchemeSettingsModal,
        openEvilnessCasesModal: function(config) { showEvilnessCasesModal(null, config, null, null, null); },
        reloadShapesFromStorage: function () {
            // Force reload shape patterns from localStorage
            currentShapePatternsStorage_w = loadShapesFromStorage_w();
        },
        version: '2.0.0'
    };

    // Export parity analysis function for use by other parts of the app
    Cglobal.caleTracer = {
        getParityTextFromScramble: function (scrambleText, cornerMode) {
            currentShapePatternsStorage_w = loadShapesFromStorage_w();
            try {
                const { tlHex, blHex } = scrambleToHex(scrambleText);
                const useClockwise = (cornerMode === 'clockwise');
                const p = calculateParityFromHex(tlHex, blHex, z2TracingModeEnabled, useClockwise, scrambleText);
                const useEvil = getEvilnessStringReturn() && p.evilStep !== null;
                return (useEvil ? p.isOddWithEvil : p.isOdd) ? 'Odd' : 'Even';
            } catch (err) {
                console.error('Parity analysis error:', err);
                return 'Error';
            }
        }
    };

})(typeof window !== 'undefined' ? window : this);


/* ==== FILE: js/tools/svg-editor.js ==== */

/*
╔════════════════════════════════════════════════════════════════════════════╗
║                          SVG TRACING GUIDE EDITOR                          ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

const SVGEditor = {
    state: {
        currentSvg: null,
        selectedElements: new Set(),
        dragging: false,
        dragStart: { x: 0, y: 0 },
        elementStarts: new Map(),
        histories: {},
        historyIndices: {},
        isSidebarCollapsed: false,
        touchStartPos: null,
        currentZoom: 100,
        keysPressed: new Set(),
        keyMoveInterval: null,
        unsavedSvgs: new Set()
    },

    init() {
        this.createEditorHTML();
        this.setupEventListeners();
        this.loadSVGList();
    },

    createEditorHTML() {
        const editorHTML = `
            <div id="svgEditorModal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="svg-editor-header">
                        <div class="svg-editor-header-left">
                            <button id="svgEditorSidebarToggle" class="svg-editor-sidebar-toggle">☰</button>
                            <span class="svg-editor-title"><span class="svg-editor-title-text">Customize Tracing Guides</span></span>
                        </div>
                        <div class="svg-editor-header-right">
                            <button id="svgEditorInfo" class="svg-editor-btn" title="Help"><img src="res/info.svg"></button>
                            <button id="svgEditorResetAll" class="svg-editor-btn" title="Reset All to Preset"><img src="res/reset.svg"></button>
                            <button id="svgEditorSaveAll" class="svg-editor-btn" title="Save All"><img src="res/save.svg"></button>
                            <button class="svg-editor-close" onclick="SVGEditor.close()">&times;</button>
                        </div>
                    </div>
                    <div class="svg-editor-container">
                        <div id="svgEditorSidebar" class="svg-editor-sidebar">
                            <div id="svgEditorList" class="svg-editor-sidebar-list"></div>
                        </div>
                        <div class="svg-editor-overlay" onclick="SVGEditor.closeSidebar()"></div>
                        <div class="svg-editor-main">
                            <div class="svg-editor-toolbar">
                                <div class="svg-editor-toolbar-left">
                                    <span class="svg-editor-zoom-label">Zoom:</span>
                                    <input type="range" id="svgEditorZoom" min="50" max="200" value="100" step="10" class="svg-editor-zoom-slider">
                                    <span id="svgEditorZoomValue" class="svg-editor-zoom-value">100%</span>
                                </div>
                                <span id="svgEditorCurrentCase" class="svg-editor-current-case"></span>
                                <div class="svg-editor-toolbar-right">
                                    <button id="svgEditorUndo" class="svg-editor-btn" title="Undo (Ctrl+Z)"><img src="res/revert.svg"></button>
                                    <button id="svgEditorRedo" class="svg-editor-btn" title="Redo (Ctrl+Y)"><img src="res/redo.svg"></button>
                                    <button id="svgEditorReset" class="svg-editor-btn" title="Reset to Preset"><img src="res/reset.svg"></button>
                                    <button id="svgEditorSave" class="svg-editor-btn" title="Save Current"><img src="res/save.svg"></button>
                                </div>
                            </div>
                            <div id="svgEditorCanvas" class="svg-editor-canvas">
                                <div class="svg-editor-empty">
                                    <h2>Select an SVG to Edit</h2>
                                    <p>Choose a tracing guide from the list on the left</p>
                                    <p style="margin-top: 15px; font-size: 14px; color: #999;">
                                        Click on labels to select • Drag to move • Arrow keys for fine adjustments<br>
                                        Tab/Shift+Tab to cycle through labels
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', editorHTML);
    },

    setupEventListeners() {
        const saveBtn = document.getElementById('svgEditorSave');
        const saveAllBtn = document.getElementById('svgEditorSaveAll');
        const resetBtn = document.getElementById('svgEditorReset');
        const resetAllBtn = document.getElementById('svgEditorResetAll');
        const undoBtn = document.getElementById('svgEditorUndo');
        const redoBtn = document.getElementById('svgEditorRedo');
        const sidebarToggle = document.getElementById('svgEditorSidebarToggle');
        const zoomSlider = document.getElementById('svgEditorZoom');
        const infoBtn = document.getElementById('svgEditorInfo');

        if (saveBtn) saveBtn.onclick = () => this.saveCurrent();
        if (saveAllBtn) saveAllBtn.onclick = () => this.saveAll();
        if (resetBtn) resetBtn.onclick = () => this.resetCurrent();
        if (resetAllBtn) resetAllBtn.onclick = () => this.resetAll();
        if (undoBtn) undoBtn.onclick = () => this.undo();
        if (redoBtn) redoBtn.onclick = () => this.redo();
        if (sidebarToggle) sidebarToggle.onclick = () => this.toggleSidebarMobile();
        if (infoBtn) infoBtn.onclick = () => this.showInfo();
        if (zoomSlider) {
            zoomSlider.oninput = (e) => this.updateZoom(e.target.value);
        }

        // Setup zoom controls on canvas
        this.setupZoomControls();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!document.getElementById('svgEditorModal') ||
                document.getElementById('svgEditorModal').style.display === 'none') return;

            if (e.key === 'Escape') {
                this.close();
            } else if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                this.undo();
            } else if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                this.redo();
            } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                if (this.state.selectedElements.size > 0) {
                    e.preventDefault();
                    this.state.keysPressed.add(e.key);

                    // Start continuous movement if not already running
                    if (!this.state.keyMoveInterval) {
                        this.startKeyboardMovement();
                    }
                }
            } else if (e.key === 'Tab') {
                if (this.state.currentSvg !== null) {
                    e.preventDefault();
                    this.selectNextElement(e.shiftKey);
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                this.state.keysPressed.delete(e.key);

                // Stop movement if no arrow keys are pressed
                if (this.state.keysPressed.size === 0 && this.state.keyMoveInterval) {
                    clearInterval(this.state.keyMoveInterval);
                    this.state.keyMoveInterval = null;

                    // Save history after movement stops
                    const svg = document.querySelector('#svgEditorCanvas svg');
                    if (svg) {
                        this.saveHistory(this.cloneSVG(svg));
                    }
                }
            }
        });
    },

    setupZoomControls() {
        const canvas = document.getElementById('svgEditorCanvas');
        if (!canvas) return;

        // Alt + Mouse wheel zoom
        canvas.addEventListener('wheel', (e) => {
            if (e.altKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -10 : 10;
                const newZoom = Math.max(50, Math.min(200, this.state.currentZoom + delta));
                this.updateZoom(newZoom);
            }
        }, { passive: false });

        // Pinch to zoom for touch devices
        let lastDistance = 0;
        let isPinching = false;

        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                isPinching = true;
                lastDistance = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
            }
        });

        canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && isPinching) {
                e.preventDefault();
                const distance = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
                const delta = distance - lastDistance;
                const zoomChange = delta * 0.5;
                const newZoom = Math.max(50, Math.min(200, this.state.currentZoom + zoomChange));
                this.updateZoom(newZoom);
                lastDistance = distance;
            }
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) {
                isPinching = false;
            }
        });
    },

    toggleSidebar() {
        const sidebar = document.getElementById('svgEditorSidebar');
        if (window.innerWidth > 570) return; // Only works on mobile

        sidebar.classList.toggle('open');
    },

    toggleSidebarMobile() {
        this.toggleSidebar();
    },

    closeSidebar() {
        const sidebar = document.getElementById('svgEditorSidebar');
        sidebar.classList.remove('open');
    },

    updateZoom(value) {
        this.state.currentZoom = parseInt(value);
        const container = document.getElementById('svgEditorContainer');
        const zoomValue = document.getElementById('svgEditorZoomValue');

        if (container) {
            container.style.transform = `scale(${this.state.currentZoom / 100})`;
        }
        if (zoomValue) {
            zoomValue.textContent = this.state.currentZoom + '%';
        }
        const zoomSlider = document.getElementById('svgEditorZoom');
        if (zoomSlider) {
            zoomSlider.value = this.state.currentZoom;
        }
    },

    loadSVGList() {
        const listContainer = document.getElementById('svgEditorList');
        if (!listContainer || !window.svgData) return;

        listContainer.innerHTML = '';
        const svgNames = Object.keys(window.svgData).sort();

        svgNames.forEach(name => {
            const item = document.createElement('div');
            item.className = 'svg-editor-item';
            const isUnsaved = this.state.unsavedSvgs.has(name);
            if (isUnsaved) item.classList.add('unsaved');

            const itemName = document.createElement('div');
            itemName.className = 'svg-editor-item-name';
            itemName.textContent = name;

            item.appendChild(itemName);
            item.addEventListener('click', () => this.loadSVG(name));

            listContainer.appendChild(item);
        });
    },

    loadSVG(svgName) {
        // Save current if needed
        if (this.state.currentSvg !== null && this.state.currentSvg !== svgName) {
            this.saveToMemory();
        }
        this.state.currentSvg = svgName;
        this.state.selectedElements.clear();

        // Update sidebar selection
        document.querySelectorAll('.svg-editor-item').forEach(item => {
            item.classList.remove('active');
        });

        const items = document.querySelectorAll('.svg-editor-item');
        const svgNames = Object.keys(window.svgData).sort();
        const index = svgNames.indexOf(svgName);
        if (items[index]) {
            items[index].classList.add('active');
        }

        // Update current case name in toolbar (for mobile)
        const currentCaseEl = document.getElementById('svgEditorCurrentCase');
        if (currentCaseEl) {
            currentCaseEl.textContent = svgName;
        }

        // Load SVG to canvas
        const canvas = document.getElementById('svgEditorCanvas');
        canvas.innerHTML = `
    <div id="svgEditorContainer" class="svg-editor-canvas-content svg-editor-force-show-hints" style="transform: scale(${this.state.currentZoom / 100});">
        <div id="svgEditorContent">${window.svgData[svgName]}</div>
    </div>
`;

        // Update zoom display
        this.updateZoom(this.state.currentZoom);

        const svg = canvas.querySelector('svg');
        if (svg) {
            this.makeLabelsSelectable(svg);

            // Initialize history
            if (!this.state.histories[svgName]) {
                this.state.histories[svgName] = [this.cloneSVG(svg)];
                this.state.historyIndices[svgName] = 0;
            }
        }

        // Close sidebar on mobile after selection
        if (window.innerWidth <= 570) {
            this.closeSidebar();
        }
    },

    makeLabelsSelectable(svg) {
        const labels = svg.querySelectorAll('.label-toggle');

        labels.forEach(label => {
            label.style.cursor = 'move';
            label.style.outline = '2px solid transparent';
            label.style.outlineOffset = '8px';
            label.style.transition = 'outline 0.2s';
            label.style.pointerEvents = 'bounding-box';

            // Add padding attribute to increase clickable area
            const bbox = label.getBBox();
            const padding = 15;

            // Create a transparent background rect for better hit detection
            const hitRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            hitRect.setAttribute('x', bbox.x - padding);
            hitRect.setAttribute('y', bbox.y - padding);
            hitRect.setAttribute('width', bbox.width + padding * 2);
            hitRect.setAttribute('height', bbox.height + padding * 2);
            hitRect.setAttribute('fill', 'transparent');
            hitRect.setAttribute('stroke', 'none');
            hitRect.style.pointerEvents = 'all';
            hitRect.classList.add('label-hitbox');
            hitRect._targetLabel = label; // Store reference to the actual label

            // Insert hitRect as first child of parent to keep it behind
            if (label.parentNode) {
                label.parentNode.insertBefore(hitRect, label.parentNode.firstChild);
            }

            const handleMouseEnter = () => {
                if (!this.state.selectedElements.has(label)) {
                    label.style.outline = '2px solid #4a9eff';
                }
            };

            const handleMouseLeave = () => {
                if (!this.state.selectedElements.has(label)) {
                    label.style.outline = '2px solid transparent';
                }
            };

            // Attach events to both hitRect and label
            hitRect.addEventListener('mouseenter', handleMouseEnter);
            hitRect.addEventListener('mouseleave', handleMouseLeave);
            hitRect.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.handleLabelMouseDown(e, label);
            });
            hitRect.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                this.handleLabelTouchStart(e, label);
            }, { passive: false });

            label.addEventListener('mouseenter', handleMouseEnter);
            label.addEventListener('mouseleave', handleMouseLeave);
            label.addEventListener('mousedown', (e) => this.handleLabelMouseDown(e, label));
            label.addEventListener('touchstart', (e) => this.handleLabelTouchStart(e, label), { passive: false });
        });
    },

    handleLabelMouseDown(e, label) {
        e.stopPropagation();

        if (e.ctrlKey || e.metaKey) {
            if (this.state.selectedElements.has(label)) {
                this.state.selectedElements.delete(label);
                label.style.outline = '2px solid transparent';
            } else {
                this.state.selectedElements.add(label);
                label.style.outline = '2px solid #ff4a9e';
            }
        } else {
            if (!this.state.selectedElements.has(label)) {
                this.state.selectedElements.forEach(el => el.style.outline = '2px solid transparent');
                this.state.selectedElements.clear();
                this.state.selectedElements.add(label);
                label.style.outline = '2px solid #ff4a9e';
            }
        }

        if (this.state.selectedElements.size > 0) {
            this.startDrag(e);
        }
    },

    handleLabelTouchStart(e, label) {
        e.preventDefault();
        e.stopPropagation();

        const touch = e.touches[0];
        this.state.touchStartPos = { x: touch.clientX, y: touch.clientY, time: Date.now() };

        // Single tap selection
        if (!this.state.selectedElements.has(label)) {
            this.state.selectedElements.forEach(el => el.style.outline = '2px solid transparent');
            this.state.selectedElements.clear();
            this.state.selectedElements.add(label);
            label.style.outline = '2px solid #ff4a9e';
        }

        if (this.state.selectedElements.size > 0) {
            this.startDragTouch(e);
        }
    },

    startDrag(e) {
        this.state.dragging = true;

        const svg = document.querySelector('#svgEditorCanvas svg');
        if (!svg) return;

        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

        this.state.dragStart = { x: svgP.x, y: svgP.y };
        this.state.elementStarts.clear();

        this.state.selectedElements.forEach(el => {
            this.state.elementStarts.set(el, this.captureElementState(el));
        });

        document.addEventListener('mousemove', this.handleDrag.bind(this));
        document.addEventListener('mouseup', this.stopDrag.bind(this));
    },

    startDragTouch(e) {
        this.state.dragging = true;

        const svg = document.querySelector('#svgEditorCanvas svg');
        if (!svg) return;

        const touch = e.touches[0];
        const pt = svg.createSVGPoint();
        pt.x = touch.clientX;
        pt.y = touch.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

        this.state.dragStart = { x: svgP.x, y: svgP.y };
        this.state.elementStarts.clear();

        this.state.selectedElements.forEach(el => {
            this.state.elementStarts.set(el, this.captureElementState(el));
        });

        document.addEventListener('touchmove', this.handleDragTouch.bind(this), { passive: false });
        document.addEventListener('touchend', this.stopDragTouch.bind(this));
    },

    handleDrag(e) {
        if (!this.state.dragging) return;

        const svg = document.querySelector('#svgEditorCanvas svg');
        if (!svg) return;

        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

        const dx = svgP.x - this.state.dragStart.x;
        const dy = svgP.y - this.state.dragStart.y;

        this.state.selectedElements.forEach(el => {
            const startState = this.state.elementStarts.get(el);
            this.updateElementPosition(el, startState, dx, dy);
        });
    },

    handleDragTouch(e) {
        e.preventDefault();
        if (!this.state.dragging) return;

        const svg = document.querySelector('#svgEditorCanvas svg');
        if (!svg) return;

        const touch = e.touches[0];
        const pt = svg.createSVGPoint();
        pt.x = touch.clientX;
        pt.y = touch.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

        const dx = svgP.x - this.state.dragStart.x;
        const dy = svgP.y - this.state.dragStart.y;

        this.state.selectedElements.forEach(el => {
            const startState = this.state.elementStarts.get(el);
            this.updateElementPosition(el, startState, dx, dy);
        });
    },

    stopDrag() {
        if (!this.state.dragging) return;
        this.state.dragging = false;

        const svg = document.querySelector('#svgEditorCanvas svg');
        if (svg) {
            this.saveHistory(this.cloneSVG(svg));
        }

        document.removeEventListener('mousemove', this.handleDrag.bind(this));
        document.removeEventListener('mouseup', this.stopDrag.bind(this));
    },

    stopDragTouch() {
        if (!this.state.dragging) return;
        this.state.dragging = false;

        const svg = document.querySelector('#svgEditorCanvas svg');
        if (svg) {
            this.saveHistory(this.cloneSVG(svg));
        }

        document.removeEventListener('touchmove', this.handleDragTouch.bind(this));
        document.removeEventListener('touchend', this.stopDragTouch.bind(this));
    },

    captureElementState(el) {
        const attrs = {};
        ['x', 'y', 'd'].forEach(attr => {
            if (el.hasAttribute(attr)) {
                attrs[attr] = el.getAttribute(attr);
            }
        });
        return { attributes: attrs, tagName: el.tagName.toLowerCase() };
    },

    updateElementPosition(el, startState, dx, dy) {
        const tagName = startState.tagName;
        const attrs = startState.attributes;

        if (tagName === 'text' || tagName === 'tspan') {
            const originalX = parseFloat(attrs.x || 0);
            const originalY = parseFloat(attrs.y || 0);
            el.setAttribute('x', originalX + dx);
            el.setAttribute('y', originalY + dy);
        } else if (tagName === 'path') {
            const newD = this.translatePathData(attrs.d, dx, dy);
            el.setAttribute('d', newD);
        }
    },

    translatePathData(pathData, dx, dy) {
        const commands = [];
        const tokens = pathData.match(/[a-df-zA-DF-Z]|[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g);

        let i = 0;

        while (i < tokens.length) {
            const token = tokens[i];

            if (/[a-zA-Z]/.test(token)) {
                commands.push({ cmd: token, params: [] });
                i++;
            } else {
                if (commands.length === 0) {
                    i++;
                    continue;
                }
                commands[commands.length - 1].params.push(parseFloat(token));
                i++;
            }
        }

        let result = '';

        for (let cmd of commands) {
            const c = cmd.cmd;
            const p = cmd.params;

            if (c === 'M' || c === 'L' || c === 'T') {
                result += c;
                for (let j = 0; j < p.length; j += 2) {
                    result += `${p[j] + dx},${p[j + 1] + dy}`;
                    if (j < p.length - 2) result += ' ';
                }
            } else if (c === 'H') {
                result += c;
                result += p.map(x => x + dx).join(' ');
            } else if (c === 'V') {
                result += c;
                result += p.map(y => y + dy).join(' ');
            } else if (c === 'C') {
                result += c;
                for (let j = 0; j < p.length; j += 6) {
                    result += `${p[j] + dx},${p[j + 1] + dy} ${p[j + 2] + dx},${p[j + 3] + dy} ${p[j + 4] + dx},${p[j + 5] + dy}`;
                    if (j < p.length - 6) result += ' ';
                }
            } else if (c === 'Z' || c === 'z') {
                result += c;
            } else {
                result += c + p.join(',');
            }
        }

        return result;
    },

    moveSelectedWithKeyboard(key) {
        const svg = document.querySelector('#svgEditorCanvas svg');
        if (!svg || this.state.selectedElements.size === 0) return;

        let dx = 0, dy = 0;
        const step = 1;

        switch (key) {
            case 'ArrowUp': dy = -step; break;
            case 'ArrowDown': dy = step; break;
            case 'ArrowLeft': dx = -step; break;
            case 'ArrowRight': dx = step; break;
        }

        this.state.selectedElements.forEach(el => {
            const startState = this.captureElementState(el);
            this.updateElementPosition(el, startState, dx, dy);
        });

        this.saveHistory(this.cloneSVG(svg));
    },

    startKeyboardMovement() {
        this.state.keyMoveInterval = setInterval(() => {
            if (this.state.keysPressed.size === 0) return;

            const svg = document.querySelector('#svgEditorCanvas svg');
            if (!svg || this.state.selectedElements.size === 0) return;

            // Calculate vector sum of all pressed arrow keys
            let dx = 0, dy = 0;
            const step = 1;

            if (this.state.keysPressed.has('ArrowUp')) dy -= step;
            if (this.state.keysPressed.has('ArrowDown')) dy += step;
            if (this.state.keysPressed.has('ArrowLeft')) dx -= step;
            if (this.state.keysPressed.has('ArrowRight')) dx += step;

            // Move all selected elements
            this.state.selectedElements.forEach(el => {
                const startState = this.captureElementState(el);
                this.updateElementPosition(el, startState, dx, dy);
            });
        }, 50); // Update every 50ms for smooth movement
    },

    selectNextElement(reverse = false) {
        const svg = document.querySelector('#svgEditorCanvas svg');
        if (!svg) return;

        const labels = Array.from(svg.querySelectorAll('.label-toggle'));
        if (labels.length === 0) return;

        let currentIndex = -1;
        if (this.state.selectedElements.size === 1) {
            currentIndex = labels.indexOf(Array.from(this.state.selectedElements)[0]);
        }

        let nextIndex;
        if (reverse) {
            nextIndex = currentIndex <= 0 ? labels.length - 1 : currentIndex - 1;
        } else {
            nextIndex = currentIndex >= labels.length - 1 ? 0 : currentIndex + 1;
        }

        this.state.selectedElements.forEach(el => el.style.outline = '2px solid transparent');
        this.state.selectedElements.clear();
        this.state.selectedElements.add(labels[nextIndex]);
        labels[nextIndex].style.outline = '2px solid #ff4a9e';
    },

    cloneSVG(svg) {
        const clone = svg.cloneNode(true);
        clone.querySelectorAll('.label-toggle').forEach(el => {
            el.style.outline = '2px solid transparent';
        });
        // Remove hitboxes from clone to avoid duplication
        clone.querySelectorAll('.label-hitbox').forEach(el => el.remove());
        return clone;
    },

    saveHistory(svgElement) {
        const name = this.state.currentSvg;
        if (name === null) return;

        // Only keep history for current session, per SVG
        if (!this.state.histories[name]) {
            this.state.histories[name] = [];
            this.state.historyIndices[name] = -1;
        }

        this.state.histories[name] = this.state.histories[name].slice(0, this.state.historyIndices[name] + 1);
        this.state.histories[name].push(svgElement);
        this.state.historyIndices[name]++;

        // Limit history to 50 entries per SVG
        if (this.state.histories[name].length > 50) {
            this.state.histories[name].shift();
            this.state.historyIndices[name]--;
        }

        // Mark as unsaved
        this.state.unsavedSvgs.add(name);
        this.loadSVGList();
    },

    undo() {
        const name = this.state.currentSvg;
        if (name === null) return;
        if (!this.state.histories[name] || this.state.historyIndices[name] <= 0) return;

        this.state.historyIndices[name]--;
        this.restoreHistory();
    },

    redo() {
        const name = this.state.currentSvg;
        if (name === null) return;
        if (!this.state.histories[name] || this.state.historyIndices[name] >= this.state.histories[name].length - 1) return;

        this.state.historyIndices[name]++;
        this.restoreHistory();
    },

    restoreHistory() {
        const name = this.state.currentSvg;
        if (name === null || !this.state.histories[name]) return;

        const svgElement = this.state.histories[name][this.state.historyIndices[name]];
        const content = document.getElementById('svgEditorContent');
        if (!content) return;

        content.innerHTML = '';
        const newSvg = svgElement.cloneNode(true);

        // Remove any old hitboxes from cloned SVG
        newSvg.querySelectorAll('.label-hitbox').forEach(el => el.remove());

        content.appendChild(newSvg);

        this.makeLabelsSelectable(newSvg);
        this.state.selectedElements.clear();
    },

    saveToMemory() {
        const name = this.state.currentSvg;
        if (name === null) return;

        const svg = document.querySelector('#svgEditorCanvas svg');
        if (!svg) return;

        const clone = svg.cloneNode(true);
        clone.querySelectorAll('.label-toggle').forEach(el => {
            el.style.outline = '';
            el.style.cursor = '';
            el.style.transition = '';
        });

        // Store in memory but don't save to localStorage yet
        window.svgData[name] = clone.outerHTML;
    },

    saveCurrent() {
        const name = this.state.currentSvg;
        if (name === null) return;

        this.saveToMemory();

        // Save to localStorage
        saveState();

        // Re-render main app
        render(true);

        // Mark as saved
        this.state.unsavedSvgs.delete(name);
        this.loadSVGList();

        showToast(`"${name}" saved successfully!`, 2000, 'success');
    },

    saveAll() {
        if (this.state.unsavedSvgs.size === 0) {
            showToast('No unsaved changes', 2000, 'info');
            return;
        }

        const count = this.state.unsavedSvgs.size;

        // Save all unsaved SVGs
        this.state.unsavedSvgs.forEach(name => {
            const svg = document.querySelector(`#svgEditorCanvas svg[data-svg-name="${name}"]`);
            if (svg) {
                const clone = svg.cloneNode(true);
                clone.querySelectorAll('.label-toggle').forEach(el => {
                    el.style.outline = '';
                    el.style.cursor = '';
                    el.style.transition = '';
                });
                window.svgData[name] = clone.outerHTML;
            }
        });

        // Clear unsaved set
        this.state.unsavedSvgs.clear();

        // Save to localStorage
        saveState();

        // Re-render main app
        render(true);

        // Refresh sidebar
        this.loadSVGList();

        showToast(`Saved ${count} tracing guide(s) successfully!`, 2000, 'success');
    },

    resetCurrent() {
        const name = this.state.currentSvg;
        if (name === null) return;

        showConfirmation(
            `Reset "${name}" to ${currentPreset} preset? This cannot be undone.`,
            () => {

                // Reset to preset default or absolute default
                const defaults = getPresetDefaults();
                if (defaults && defaults.svgData && defaults.svgData[name]) {
                    window.svgData[name] = defaults.svgData[name];
                } else {
                    window.svgData[name] = DEFAULT_SVGS[name];
                }

                // Save and re-render
                saveState();
                render(true);

                // Reload in editor
                this.loadSVG(name);

                // Mark as saved (no longer unsaved)
                this.state.unsavedSvgs.delete(name);
                this.loadSVGList();

                showToast(`"${name}" reset to ${currentPreset} preset!`, 2000, 'success');
            }
        );
    },

    open() {
        const modal = document.getElementById('svgEditorModal');
        if (modal) {
            modal.style.display = 'block';
            document.body.classList.add('modal-open');
            document.body.style.overflow = 'hidden';
            this.loadSVGList();
            this.preventBackgroundScroll();
            pushModalState('svgEditorModal', () => this.close());
        }
    },

    showInfo() {
        let infoModal = document.getElementById('svgEditorInfoModal');
        if (!infoModal) {
            infoModal = document.createElement('div');
            infoModal.id = 'svgEditorInfoModal';
            infoModal.className = 'training-info-modal';
            infoModal.innerHTML = `
                <div class="training-info-content">
                    <div class="training-info-header">
                        <span class="training-info-title">Tracing Guide Editor Instructions</span>
                        <button class="training-info-close" onclick="document.getElementById('svgEditorInfoModal').classList.remove('active')">&times;</button>
                    </div>
                    <div class="training-info-body">
                        <div class="training-info-item">
                            <div class="training-info-text">This Tracing Guide Editor lets you change the position of the small numbers (The tracing guides) on the image of each cases. It is more useful to preset creators than normal users. There are 39 cubestate images that you need to fix to set your tracing position in the case image.</div>
                        </div>
                        <div class="training-info-item">
                            <div class="training-info-number">1</div>
                            <div class="training-info-text"><strong>Select Labels:</strong> Click on any blue or red number to select it. Hold Ctrl/Cmd to select multiple labels.</div>
                        </div>
                        <div class="training-info-item">
                            <div class="training-info-number">2</div>
                            <div class="training-info-text"><strong>Move Labels:</strong> Drag selected labels with your mouse to move it around, or use arrow keys for precise 1px adjustments.</div>
                        </div>
                        <div class="training-info-item">
                            <div class="training-info-number">3</div>
                            <div class="training-info-text"><strong>Navigate:</strong> Press Tab to select the next label, press Shift+Tab to select the previous label.</div>
                        </div>
                        <div class="training-info-item">
                            <div class="training-info-number">4</div>
                            <div class="training-info-text"><strong>Undo/Redo:</strong> Use the Undo and Redo buttons or Ctrl+Z and Ctrl+Y to undo or redo a change.</div>
                        </div>
                        <div class="training-info-item">
                            <div class="training-info-number">5</div>
                            <div class="training-info-text"><strong>Reset:</strong> Click Reset (on the toolbar) to restore the current image to your preset's default image. Press Reset All (on the header) to reset all the images to your preset default.</div>
                        </div>
                        <div class="training-info-item">
                            <div class="training-info-number">6</div>
                            <div class="training-info-text"><strong>Save:</strong> Click Save (on the toolbar) to save the current image, or Save All (on the header) to save all unsaved images at once.</div>
                        </div>
                        <div class="training-info-item">
                            <div class="training-info-number">7</div>
                            <div class="training-info-text"><strong>Zoom:</strong> Alt+Mouse wheel Up/Down to zoom in/out, or pinch with 2 fingers, or simply just use the zoom slider if you can see it.</div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(infoModal);
        }

        infoModal.classList.add('active');
    },

    resetAll() {
        showConfirmation(
            `Reset ALL tracing guides to ${currentPreset} preset? This cannot be undone.`,
            () => {
                // Reset all SVGs to preset default or absolute default
                const defaults = getPresetDefaults();
                const svgNames = Object.keys(window.svgData);

                svgNames.forEach(name => {
                    if (defaults && defaults.svgData && defaults.svgData[name]) {
                        window.svgData[name] = defaults.svgData[name];
                    } else {
                        window.svgData[name] = DEFAULT_SVGS[name];
                    }
                });

                // Clear all unsaved changes
                this.state.unsavedSvgs.clear();

                // Save and re-render
                saveState();
                render(true);

                // Reload list and current SVG if any
                this.loadSVGList();
                if (this.state.currentSvg) {
                    this.loadSVG(this.state.currentSvg);
                }

                showToast(`All tracing guides reset to ${currentPreset} preset!`, 2000, 'success');
            }
        );
    },

    close() {
        closeModalWithHistory(() => {
            // Check for unsaved changes
            if (this.state.unsavedSvgs.size > 0) {
                showSaveDiscardConfirmation(
                    `You have ${this.state.unsavedSvgs.size} unsaved image(s). What would you like to do?`,
                    () => {
                        // Save
                        this.saveAll();
                        this.forceClose();
                    },
                    () => {
                        // Discard
                        this.forceClose();
                    },
                    () => {
                        // Cancel - do nothing
                    }
                );
                return;
            }

            this.forceClose();
        });
    },

    forceClose() {
        // Save current before closing
        if (this.state.currentSvg !== null) {
            this.saveToMemory();
        }

        const modal = document.getElementById('svgEditorModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
        }

        // Clean up keyboard movement
        if (this.state.keyMoveInterval) {
            clearInterval(this.state.keyMoveInterval);
            this.state.keyMoveInterval = null;
        }

        // Reset state AND clear all history
        this.state.currentSvg = null;
        this.state.selectedElements.clear();
        this.state.isSidebarCollapsed = false;
        this.state.keysPressed.clear();
        this.state.unsavedSvgs.clear();
        this.state.histories = {};
        this.state.historyIndices = {};
    },

    preventBackgroundScroll() {
        const modal = document.getElementById('svgEditorModal');
        if (!modal) return;

        // Prevent scroll on modal overlay
        modal.addEventListener('wheel', (e) => {
            const target = e.target;
            // Only prevent if scrolling on the overlay itself (not on scrollable content)
            if (target === modal || target.classList.contains('svg-editor-overlay')) {
                e.preventDefault();
            }
        }, { passive: false });

        modal.addEventListener('touchmove', (e) => {
            const target = e.target;
            // Only prevent if touching the overlay itself (not on scrollable content)
            if (target === modal || target.classList.contains('svg-editor-overlay')) {
                e.preventDefault();
            }
        }, { passive: false });
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SVGEditor.init());
} else {
    SVGEditor.init();
}


/* ==== FILE: js/tools/scramblegenerator.js ==== */

(function () {
    // Mathlib dependencies
    function getNPerm(arr, n) {
        if (n === undefined) n = arr.length;
        var idx = 0;
        for (var i = 0; i < n; i++) {
            idx *= (n - i);
            for (var j = i + 1; j < n; j++) {
                if (arr[i] > arr[j]) {
                    idx++;
                }
            }
        }
        return idx;
    }

    function setNPerm(arr, idx, n) {
        if (n === undefined) n = arr.length;
        arr.length = n;
        for (var i = n - 1; i >= 0; i--) {
            arr[i] = idx % (n - i);
            idx = ~~(idx / (n - i));
            for (var j = i + 1; j < n; j++) {
                if (arr[j] >= arr[i]) arr[j]++;
            }
        }
    }

    function circle(arr) {
        var leng = arguments.length - 1;
        var temp = arr[arguments[leng]];
        for (var i = leng; i > 1; i--) {
            arr[arguments[i]] = arr[arguments[i - 1]];
        }
        arr[arguments[1]] = temp;
        return circle;
    }

    function rn(n) {
        return Math.floor(Math.random() * n);
    }

    function bitCount(x) {
        x -= x >> 1 & 1431655765;
        x = (x >> 2 & 858993459) + (x & 858993459);
        x = (x >> 4) + x & 252645135;
        x += x >> 8;
        x += x >> 16;
        return x & 63;
    }

    function binarySearch(sortedArray, key) {
        var high, low, mid, midVal;
        low = 0;
        high = sortedArray.length - 1;
        while (low <= high) {
            mid = low + ((high - low) >> 1);
            midVal = sortedArray[mid];
            if (midVal < key) {
                low = mid + 1;
            } else if (midVal > key) {
                high = mid - 1;
            } else {
                return mid;
            }
        }
        return -low - 1;
    }

    // Core Square-1 code
    var sq1 = (function (setNPerm, getNPerm, circle, rn) {
        "use strict";

        function SqCubie() {
            this.ul = 0x011233;
            this.ur = 0x455677;
            this.dl = 0x998bba;
            this.dr = 0xddcffe;
            this.ml = 0;
        }

        var _ = SqCubie.prototype;

        _.toString = function () {
            return this.ul.toString(16).padStart(6, 0) +
                this.ur.toString(16).padStart(6, 0) +
                "|/".charAt(this.ml) +
                this.dl.toString(16).padStart(6, 0) +
                this.dr.toString(16).padStart(6, 0);
        }

        _.pieceAt = function (idx) {
            var ret;
            if (idx < 6) {
                ret = this.ul >> ((5 - idx) << 2);
            } else if (idx < 12) {
                ret = this.ur >> ((11 - idx) << 2);
            } else if (idx < 18) {
                ret = this.dl >> ((17 - idx) << 2);
            } else {
                ret = this.dr >> ((23 - idx) << 2);
            }
            return ret & 0xf;
        }

        _.setPiece = function (idx, value) {
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
        }

        _.copy = function (c) {
            this.ul = c.ul;
            this.ur = c.ur;
            this.dl = c.dl;
            this.dr = c.dr;
            this.ml = c.ml;
        }

        _.doMove = function (move) {
            var temp;
            move <<= 2;
            if (move > 24) {
                move = 48 - move;
                temp = this.ul;
                this.ul = (this.ul >> move | this.ur << 24 - move) & 0xffffff;
                this.ur = (this.ur >> move | temp << 24 - move) & 0xffffff;
            } else if (move > 0) {
                temp = this.ul;
                this.ul = (this.ul << move | this.ur >> 24 - move) & 0xffffff;
                this.ur = (this.ur << move | temp >> 24 - move) & 0xffffff;
            } else if (move == 0) {
                temp = this.ur;
                this.ur = this.dl;
                this.dl = temp;
                this.ml = 1 - this.ml;
            } else if (move >= -24) {
                move = -move;
                temp = this.dl;
                this.dl = (this.dl << move | this.dr >> 24 - move) & 0xffffff;
                this.dr = (this.dr << move | temp >> 24 - move) & 0xffffff;
            } else if (move < -24) {
                move = 48 + move;
                temp = this.dl;
                this.dl = (this.dl >> move | this.dr << 24 - move) & 0xffffff;
                this.dr = (this.dr >> move | temp << 24 - move) & 0xffffff;
            }
        }

        function FullCube_getParity(obj) {
            var a, b, cnt, i, p, arr;
            cnt = 0;
            arr = [obj.pieceAt(0)];
            for (i = 1; i < 24; ++i) {
                if (obj.pieceAt(i) != arr[cnt]) {
                    arr[++cnt] = obj.pieceAt(i);
                }
            }
            p = 0;
            for (a = 0; a < 16; ++a) {
                for (b = a + 1; b < 16; ++b) {
                    arr[a] > arr[b] && (p ^= 1);
                }
            }
            return p;
        }

        function FullCube_getShapeIdx(obj) {
            var dlx, drx, ulx, urx;
            urx = obj.ur & 0x111111;
            urx |= urx >> 3;
            urx |= urx >> 6;
            urx = urx & 15 | urx >> 12 & 48;
            ulx = obj.ul & 0x111111;
            ulx |= ulx >> 3;
            ulx |= ulx >> 6;
            ulx = ulx & 15 | ulx >> 12 & 48;
            drx = obj.dr & 0x111111;
            drx |= drx >> 3;
            drx |= drx >> 6;
            drx = drx & 15 | drx >> 12 & 48;
            dlx = obj.dl & 0x111111;
            dlx |= dlx >> 3;
            dlx |= dlx >> 6;
            dlx = dlx & 15 | dlx >> 12 & 48;
            return Shape_getShape2Idx(FullCube_getParity(obj) << 24 | ulx << 18 | urx << 12 | dlx << 6 | drx);
        }

        function FullCube_getSquare(obj, sq) {
            var a, b;
            var prm = [];
            for (a = 0; a < 8; ++a) {
                prm[a] = obj.pieceAt(a * 3 + 1) >> 1;
            }
            sq.cornperm = getNPerm(prm, 8);
            sq.topEdgeFirst = obj.pieceAt(0) == obj.pieceAt(1);
            a = sq.topEdgeFirst ? 2 : 0;
            for (b = 0; b < 4; a += 3, ++b)
                prm[b] = obj.pieceAt(a) >> 1;
            sq.botEdgeFirst = obj.pieceAt(12) == obj.pieceAt(13);
            a = sq.botEdgeFirst ? 14 : 12;
            for (; b < 8; a += 3, ++b)
                prm[b] = obj.pieceAt(a) >> 1;
            sq.edgeperm = getNPerm(prm, 8);
            sq.ml = obj.ml;
        }

        function Search_init2(obj) {
            var corner, edge, i, j, ml, prun;
            obj.Search_d.copy(obj.Search_c);
            for (i = 0; i < obj.Search_length1; ++i) {
                obj.Search_d.doMove(obj.Search_move[i]);
            }
            FullCube_getSquare(obj.Search_d, obj.Search_sq);
            edge = obj.Search_sq.edgeperm;
            corner = obj.Search_sq.cornperm;
            ml = obj.Search_sq.ml;
            prun = Math.max(SquarePrun[obj.Search_sq.edgeperm << 1 | ml], SquarePrun[obj.Search_sq.cornperm << 1 | ml]);
            for (i = prun; i < obj.Search_maxlen2; ++i) {
                if (Search_phase2(obj, edge, corner, obj.Search_sq.topEdgeFirst, obj.Search_sq.botEdgeFirst, ml, i, obj.Search_length1, 0)) {
                    for (j = 0; j < i; ++j) {
                        obj.Search_d.doMove(obj.Search_move[obj.Search_length1 + j]);
                    }
                    obj.Search_sol_string = Search_move2string(obj, i + obj.Search_length1);
                    return true;
                }
            }
            return false;
        }

        function Search_move2string(obj, len) {
            var s = "";
            var top = 0, bottom = 0;
            for (var i = len - 1; i >= 0; i--) {
                var val = obj.Search_move[i];
                if (val > 0) {
                    val = 12 - val;
                    top = (val > 6) ? (val - 12) : val;
                } else if (val < 0) {
                    val = 12 + val;
                    bottom = (val > 6) ? (val - 12) : val;
                } else {
                    var twst = "/";
                    if (i == obj.Search_length1 - 1) {
                        twst = "`/`";
                    }
                    if (top == 0 && bottom == 0) {
                        s += twst;
                    } else {
                        s += " (" + top + "," + bottom + ")" + twst;
                    }
                    top = bottom = 0;
                }
            }
            if (top == 0 && bottom == 0) { } else {
                s += " (" + top + "," + bottom + ") ";
            }
            return s;
        }

        function Search_phase1(obj, shape, prunvalue, maxl, depth, lm) {
            var m, prunx, shapex;
            if (prunvalue == 0 && maxl < 4) {
                return maxl == 0 && Search_init2(obj);
            }
            if (lm != 0) {
                shapex = Shape_TwistMove[shape];
                prunx = ShapePrun[shapex];
                if (prunx < maxl) {
                    obj.Search_move[depth] = 0;
                    if (Search_phase1(obj, shapex, prunx, maxl - 1, depth + 1, 0)) {
                        return true;
                    }
                }
            }
            shapex = shape;
            if (lm <= 0) {
                m = 0;
                while (true) {
                    m += Shape_TopMove[shapex];
                    shapex = m >> 4;
                    m &= 15;
                    if (m >= 12) {
                        break;
                    }
                    prunx = ShapePrun[shapex];
                    if (prunx > maxl) {
                        break;
                    } else if (prunx < maxl) {
                        obj.Search_move[depth] = m;
                        if (Search_phase1(obj, shapex, prunx, maxl - 1, depth + 1, 1)) {
                            return true;
                        }
                    }
                }
            }
            shapex = shape;
            if (lm <= 1) {
                m = 0;
                while (true) {
                    m += Shape_BottomMove[shapex];
                    shapex = m >> 4;
                    m &= 15;
                    if (m >= 6) {
                        break;
                    }
                    prunx = ShapePrun[shapex];
                    if (prunx > maxl) {
                        break;
                    } else if (prunx < maxl) {
                        obj.Search_move[depth] = -m;
                        if (Search_phase1(obj, shapex, prunx, maxl - 1, depth + 1, 2)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        function Search_phase2(obj, edge, corner, topEdgeFirst, botEdgeFirst, ml, maxl, depth, lm) {
            var botEdgeFirstx, cornerx, edgex, m, prun1, prun2, topEdgeFirstx;
            if (maxl == 0 && !topEdgeFirst && botEdgeFirst) {
                return true;
            }
            if (lm != 0 && topEdgeFirst == botEdgeFirst) {
                edgex = Square_TwistMove[edge];
                cornerx = Square_TwistMove[corner];
                if (SquarePrun[edgex << 1 | 1 - ml] < maxl && SquarePrun[cornerx << 1 | 1 - ml] < maxl) {
                    obj.Search_move[depth] = 0;
                    if (Search_phase2(obj, edgex, cornerx, topEdgeFirst, botEdgeFirst, 1 - ml, maxl - 1, depth + 1, 0)) {
                        return true;
                    }
                }
            }
            if (lm <= 0) {
                topEdgeFirstx = !topEdgeFirst;
                edgex = topEdgeFirstx ? Square_TopMove[edge] : edge;
                cornerx = topEdgeFirstx ? corner : Square_TopMove[corner];
                m = topEdgeFirstx ? 1 : 2;
                prun1 = SquarePrun[edgex << 1 | ml];
                prun2 = SquarePrun[cornerx << 1 | ml];
                while (m < 12 && prun1 <= maxl && prun1 <= maxl) {
                    if (prun1 < maxl && prun2 < maxl) {
                        obj.Search_move[depth] = m;
                        if (Search_phase2(obj, edgex, cornerx, topEdgeFirstx, botEdgeFirst, ml, maxl - 1, depth + 1, 1)) {
                            return true;
                        }
                    }
                    topEdgeFirstx = !topEdgeFirstx;
                    if (topEdgeFirstx) {
                        edgex = Square_TopMove[edgex];
                        prun1 = SquarePrun[edgex << 1 | ml];
                        m += 1;
                    } else {
                        cornerx = Square_TopMove[cornerx];
                        prun2 = SquarePrun[cornerx << 1 | ml];
                        m += 2;
                    }
                }
            }
            if (lm <= 1) {
                botEdgeFirstx = !botEdgeFirst;
                edgex = botEdgeFirstx ? Square_BottomMove[edge] : edge;
                cornerx = botEdgeFirstx ? corner : Square_BottomMove[corner];
                m = botEdgeFirstx ? 1 : 2;
                prun1 = SquarePrun[edgex << 1 | ml];
                prun2 = SquarePrun[cornerx << 1 | ml];
                while (m < (maxl > 6 ? 6 : 12) && prun1 <= maxl && prun1 <= maxl) {
                    if (prun1 < maxl && prun2 < maxl) {
                        obj.Search_move[depth] = -m;
                        if (Search_phase2(obj, edgex, cornerx, topEdgeFirst, botEdgeFirstx, ml, maxl - 1, depth + 1, 2)) {
                            return true;
                        }
                    }
                    botEdgeFirstx = !botEdgeFirstx;
                    if (botEdgeFirstx) {
                        edgex = Square_BottomMove[edgex];
                        prun1 = SquarePrun[edgex << 1 | ml];
                        m += 1;
                    } else {
                        cornerx = Square_BottomMove[cornerx];
                        prun2 = SquarePrun[cornerx << 1 | ml];
                        m += 2;
                    }
                }
            }
            return false;
        }

        function Search_solution(obj, c) {
            var shape;
            obj.Search_c = c;
            shape = FullCube_getShapeIdx(c);
            for (obj.Search_length1 = ShapePrun[shape]; obj.Search_length1 < 100; ++obj.Search_length1) {
                obj.Search_maxlen2 = Math.min(32 - obj.Search_length1, 17);
                if (Search_phase1(obj, shape, ShapePrun[shape], obj.Search_length1, 0, -1)) {
                    break;
                }
            }
            return obj.Search_sol_string;
        }

        function Search_Search() {
            this.Search_move = [];
            this.Search_d = new SqCubie;
            this.Search_sq = new Square_Square;
        }

        function Search() { }

        _ = Search_Search.prototype = Search.prototype;
        _.Search_c = null;
        _.Search_length1 = 0;
        _.Search_maxlen2 = 0;
        _.Search_sol_string = null;

        function Shape_$clinit() {
            Shape_$clinit = function () { };
            Shape_halflayer = [0, 3, 6, 12, 15, 24, 27, 30, 48, 51, 54, 60, 63];
            Shape_ShapeIdx = [];
            ShapePrun = [];
            Shape_TopMove = [];
            Shape_BottomMove = [];
            Shape_TwistMove = [];
            Shape_init();
        }

        function Shape_bottomMove(obj) {
            var move, moveParity;
            move = 0;
            moveParity = 0;
            do {
                if ((obj.bottom & 2048) == 0) {
                    move += 1;
                    obj.bottom = obj.bottom << 1;
                } else {
                    move += 2;
                    obj.bottom = obj.bottom << 2 ^ 12291;
                }
                moveParity = 1 - moveParity;
            }
            while ((bitCount(obj.bottom & 63) & 1) != 0);
            (bitCount(obj.bottom) & 2) == 0 && (obj.Shape_parity ^= moveParity);
            return move;
        }

        function Shape_getIdx(obj) {
            var ret;
            ret = binarySearch(Shape_ShapeIdx, obj.top << 12 | obj.bottom) << 1 | obj.Shape_parity;
            return ret;
        }

        function Shape_setIdx(obj, idx) {
            obj.Shape_parity = idx & 1;
            obj.top = Shape_ShapeIdx[idx >> 1];
            obj.bottom = obj.top & 4095;
            obj.top >>= 12;
        }

        function Shape_topMove(obj) {
            var move, moveParity;
            move = 0;
            moveParity = 0;
            do {
                if ((obj.top & 2048) == 0) {
                    move += 1;
                    obj.top = obj.top << 1;
                } else {
                    move += 2;
                    obj.top = obj.top << 2 ^ 12291;
                }
                moveParity = 1 - moveParity;
            }
            while ((bitCount(obj.top & 63) & 1) != 0);
            (bitCount(obj.top) & 2) == 0 && (obj.Shape_parity ^= moveParity);
            return move;
        }

        function Shape_Shape() { }

        function Shape_getShape2Idx(shp) {
            var ret;
            ret = binarySearch(Shape_ShapeIdx, shp & 0xffffff) << 1 | shp >> 24;
            return ret;
        }

        function Shape_init() {
            var count, depth, dl, done, done0, dr, i, idx, m, s, ul, ur, value, p1, p3, temp;
            count = 0;
            for (i = 0; i < 28561; ++i) {
                dr = Shape_halflayer[i % 13];
                dl = Shape_halflayer[~~(i / 13) % 13];
                ur = Shape_halflayer[~~(~~(i / 13) / 13) % 13];
                ul = Shape_halflayer[~~(~~(~~(i / 13) / 13) / 13)];
                value = ul << 18 | ur << 12 | dl << 6 | dr;
                bitCount(value) == 16 && (Shape_ShapeIdx[count++] = value);
            }
            s = new Shape_Shape;
            for (i = 0; i < 7356; ++i) {
                Shape_setIdx(s, i);
                Shape_TopMove[i] = Shape_topMove(s);
                Shape_TopMove[i] |= Shape_getIdx(s) << 4;
                Shape_setIdx(s, i);
                Shape_BottomMove[i] = Shape_bottomMove(s);
                Shape_BottomMove[i] |= Shape_getIdx(s) << 4;
                Shape_setIdx(s, i);
                temp = s.top & 63;
                p1 = bitCount(temp);
                p3 = bitCount(s.bottom & 4032);
                s.Shape_parity ^= 1 & (p1 & p3) >> 1;
                s.top = s.top & 4032 | s.bottom >> 6 & 63;
                s.bottom = s.bottom & 63 | temp << 6;
                Shape_TwistMove[i] = Shape_getIdx(s);
            }
            for (i = 0; i < 7536; ++i) {
                ShapePrun[i] = -1;
            }
            ShapePrun[Shape_getShape2Idx(14378715)] = 0;
            ShapePrun[Shape_getShape2Idx(31157686)] = 0;
            ShapePrun[Shape_getShape2Idx(23967451)] = 0;
            ShapePrun[Shape_getShape2Idx(7191990)] = 0;
            done = 4;
            done0 = 0;
            depth = -1;
            while (done != done0) {
                done0 = done;
                ++depth;
                for (i = 0; i < 7536; ++i) {
                    if (ShapePrun[i] == depth) {
                        m = 0;
                        idx = i;
                        do {
                            idx = Shape_TopMove[idx];
                            m += idx & 15;
                            idx >>= 4;
                            if (ShapePrun[idx] == -1) {
                                ++done;
                                ShapePrun[idx] = depth + 1;
                            }
                        }
                        while (m != 12);
                        m = 0;
                        idx = i;
                        do {
                            idx = Shape_BottomMove[idx];
                            m += idx & 15;
                            idx >>= 4;
                            if (ShapePrun[idx] == -1) {
                                ++done;
                                ShapePrun[idx] = depth + 1;
                            }
                        }
                        while (m != 12);
                        idx = Shape_TwistMove[i];
                        if (ShapePrun[idx] == -1) {
                            ++done;
                            ShapePrun[idx] = depth + 1;
                        }
                    }
                }
            }
        }

        function Shape() { }

        _ = Shape_Shape.prototype = Shape.prototype;
        _.bottom = 0;
        _.Shape_parity = 0;
        _.top = 0;
        var Shape_BottomMove, Shape_ShapeIdx, ShapePrun, Shape_TopMove, Shape_TwistMove, Shape_halflayer;

        function Square_$clinit() {
            Square_$clinit = function () { };
            SquarePrun = [];
            Square_TwistMove = [];
            Square_TopMove = [];
            Square_BottomMove = [];
            Square_init();
        }

        function Square_Square() { }

        function Square_init() {
            var check, depth, done, find, i, idx, idxx, inv, m, ml, pos;
            pos = [];
            for (i = 0; i < 40320; ++i) {
                setNPerm(pos, i, 8);
                circle(pos, 2, 4)(pos, 3, 5);
                Square_TwistMove[i] = getNPerm(pos, 8);
                setNPerm(pos, i, 8);
                circle(pos, 0, 3, 2, 1);
                Square_TopMove[i] = getNPerm(pos, 8);
                setNPerm(pos, i, 8);
                circle(pos, 4, 7, 6, 5);
                Square_BottomMove[i] = getNPerm(pos, 8);
            }
            for (i = 0; i < 80640; ++i) {
                SquarePrun[i] = -1;
            }
            SquarePrun[0] = 0;
            depth = 0;
            done = 1;
            while (done < 80640) {
                inv = depth >= 11;
                find = inv ? -1 : depth;
                check = inv ? depth : -1;
                ++depth;
                OUT: for (i = 0; i < 80640; ++i) {
                    if (SquarePrun[i] == find) {
                        idx = i >> 1;
                        ml = i & 1;
                        idxx = Square_TwistMove[idx] << 1 | 1 - ml;
                        if (SquarePrun[idxx] == check) {
                            ++done;
                            SquarePrun[inv ? i : idxx] = depth;
                            if (inv)
                                continue OUT;
                        }
                        idxx = idx;
                        for (m = 0; m < 4; ++m) {
                            idxx = Square_TopMove[idxx];
                            if (SquarePrun[idxx << 1 | ml] == check) {
                                ++done;
                                SquarePrun[inv ? i : idxx << 1 | ml] = depth;
                                if (inv)
                                    continue OUT;
                            }
                        }
                        for (m = 0; m < 4; ++m) {
                            idxx = Square_BottomMove[idxx];
                            if (SquarePrun[idxx << 1 | ml] == check) {
                                ++done;
                                SquarePrun[inv ? i : idxx << 1 | ml] = depth;
                                if (inv)
                                    continue OUT;
                            }
                        }
                    }
                }
            }
        }

        function Square() { }

        _ = Square_Square.prototype = Square.prototype;
        _.botEdgeFirst = false;
        _.cornperm = 0;
        _.edgeperm = 0;
        _.ml = 0;
        _.topEdgeFirst = false;
        var Square_BottomMove, SquarePrun, Square_TopMove, Square_TwistMove;

        // Initialize
        Shape_$clinit();
        Square_$clinit();

        var search = new Search_Search();

        function scrambleFromState(cubie) {
            return Search_solution(search, cubie);
        }

        return {
            scrambleFromState: scrambleFromState,
            SqCubie: SqCubie
        };
    })(setNPerm, getNPerm, circle, rn);

    // Export to window
    window.sq1Tools = sq1;
})();

// Parse hex format from the random generator
function parseHexFormat(input) {
    const cubie = new window.sq1Tools.SqCubie();

    try {
        // Remove all whitespace
        input = input.replace(/\s/g, '');

        // Split by separator (| or /)
        const parts = input.split(/[\|\/]/);

        if (parts.length !== 2) {
            throw new Error('Invalid format. Expected: 12 hex digits + separator + 12 hex digits');
        }

        const upperPart = parts[0];
        const lowerPart = parts[1];

        if (upperPart.length !== 12 || lowerPart.length !== 12) {
            throw new Error('Each part must be exactly 12 hex digits');
        }

        // Extract ul (first 6 hex digits of upper part)
        cubie.ul = parseInt(upperPart.substring(0, 6), 16);

        // Extract ur (last 6 hex digits of upper part)  
        cubie.ur = parseInt(upperPart.substring(6, 12), 16);

        // Extract dl (first 6 hex digits of lower part)
        cubie.dl = parseInt(lowerPart.substring(0, 6), 16);

        // Extract dr (last 6 hex digits of lower part)
        cubie.dr = parseInt(lowerPart.substring(6, 12), 16);

        // Set ml based on separator (| = 0, / = 1)
        cubie.ml = input.includes('/') ? 1 : 0;

        return cubie;
    } catch (error) {
        throw new Error('Invalid hex format: ' + error.message);
    }
}

/* ==== FILE: js/tools/draw-scramble.js ==== */

// ========================================
// Square-1 Scramble Visualizer Library
// ========================================

// === SHAPE BUILDING ===
function clusterify(shapeArray) {
  const slots = [];
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWX'.split('');

  function processOneLayer(startIdx, endIdx) {
    let i = startIdx;
    while (i < endIdx) {
      const isThisACorner = shapeArray[i] === 1;

      if (isThisACorner) {
        const nextIdx = (i - startIdx + 1) % 12 + startIdx;
        if (nextIdx < endIdx && shapeArray[nextIdx] === 1) {
          slots.push({
            type: 'corner',
            startLetter: i,
            lettersCount: 2,
            label: letters[i] + letters[nextIdx]
          });
          i += 2;
        } else {
          slots.push({
            type: 'half-corner',
            startLetter: i,
            lettersCount: 1,
            label: letters[i]
          });
          i += 1;
        }
      } else {
        slots.push({
          type: 'edge',
          startLetter: i,
          lettersCount: 1,
          label: letters[i]
        });
        i += 1;
      }
    }
  }

  processOneLayer(0, 12);
  processOneLayer(12, 24);

  return slots;
}

function ParseScrambleAssignmentsFromHexCode(hexScramble, slotsList) {
  const assignments = {};
  for (let i = 0; i < slotsList.length; i++) {
    const slot = slotsList[i];
    const letterIndex = slot.startLetter;

    const scrambleIdx = (letterIndex < 12)
      ? letterIndex
      : 13 + (letterIndex - 12);

    assignments[slot.label] = hexScramble[scrambleIdx];
  }

  return assignments;
}

// === GEOMETRY HELPERS ===
function polarToCartesian(centerX, centerY, radius, angleDegrees) {
  const angleRadians = angleDegrees * Math.PI / 180;
  return {
    x: centerX + radius * Math.cos(angleRadians),
    y: centerY - radius * Math.sin(angleRadians)
  };
}

function pointArrayToSVGString(pointsArray) {
  return pointsArray.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
}

function lerpBetweenTwoPoints(pointA, pointB, interpolationAmount) {
  return {
    x: pointA.x + (pointB.x - pointA.x) * interpolationAmount,
    y: pointA.y + (pointB.y - pointA.y) * interpolationAmount
  };
}

function gimmeTheAngleForThisSlot(slot, angleArray) {
  const angles = [];
  for (let k = 0; k < slot.lettersCount; k++) {
    const globalIdx = slot.startLetter + k;
    const localIdx = globalIdx >= 12 ? globalIdx - 12 : globalIdx;
    angles.push(angleArray[localIdx]);
  }
  return angles.reduce((sum, angle) => sum + angle, 0) / angles.length;
}

// === COLOR MAPPING ===
function whatColorIsThisEdgePiece(hexChar, colorScheme) {
  const { topColor, bottomColor, frontColor, rightColor, backColor, leftColor } = colorScheme;

  switch (hexChar.toLowerCase()) {
    case '0': return { inner: topColor, outer: backColor };
    case '2': return { inner: topColor, outer: leftColor };
    case '4': return { inner: topColor, outer: frontColor };
    case '6': return { inner: topColor, outer: rightColor };
    case '8': return { inner: bottomColor, outer: rightColor };
    case 'a': return { inner: bottomColor, outer: frontColor };
    case 'c': return { inner: bottomColor, outer: leftColor };
    case 'e': return { inner: bottomColor, outer: backColor };
    case 'E': return { inner: '#888888', outer: '#888888' };
    case 'R': return { inner: 'transparent', outer: 'transparent' };
    default: return { inner: '#4ecdc4', outer: '#4ecdc4' };
  }
}

function whatAreTheCornerColorLetters(hexChar) {
  switch ((hexChar || '').toLowerCase()) {
    case '1': return { top: 'y', left: 'b', right: 'o' };
    case '3': return { top: 'y', left: 'r', right: 'b' };
    case '5': return { top: 'y', left: 'g', right: 'r' };
    case '7': return { top: 'y', left: 'o', right: 'g' };
    case '9': return { top: 'w', left: 'g', right: 'o' };
    case 'b': return { top: 'w', left: 'r', right: 'g' };
    case 'd': return { top: 'w', left: 'b', right: 'r' };
    case 'f': return { top: 'w', left: 'o', right: 'b' };
    case 'C': return { top: '#888888', left: '#888888', right: '#888888' };
    default: return { top: '#4ecdc4', left: '#4ecdc4', right: '#4ecdc4' };
  }
}

function convertColorLetterToHexCode(colorLetter, colorScheme) {
  if (!colorLetter) return '#cccccc';
  const { topColor, bottomColor, frontColor, rightColor, backColor, leftColor } = colorScheme;

  switch (colorLetter.toLowerCase()) {
    case 'y': return topColor;
    case 'w': return bottomColor;
    case 'o': return backColor;
    case 'b': return leftColor;
    case 'r': return frontColor;
    case 'g': return rightColor;
    default: return '#cccccc';
  }
}

function gimmeCornerColorsAsHexCodes(hexChar, isThisBottomLayer, colorScheme) {
  const colorTriplet = whatAreTheCornerColorLetters(hexChar);
  let leftColor = convertColorLetterToHexCode(colorTriplet.left, colorScheme);
  let rightColor = convertColorLetterToHexCode(colorTriplet.right, colorScheme);
  const topColor = convertColorLetterToHexCode(colorTriplet.top, colorScheme);

  if (isThisBottomLayer) {
    [leftColor, rightColor] = [leftColor, rightColor];
  }

  return { top: topColor, left: leftColor, right: rightColor };
}

function whatColorIsThisHalfCorner() {
  return 'fill="#ff9999"';
}

// === SVG GENERATION FOR INDIVIDUAL PIECES ===
function CreateOnePieceSVG(slot, pieceHex, centerX, centerY, centerAngle, radiusInner, radiusOuter, radiusApex, isBottomLayer, strokeThin, strokeMedium, colorScheme) {
  isBottomLayer = !!(slot && typeof slot.startLetter === 'number' && slot.startLetter >= 12);

  let svgMarkup = '';
  const halfAngle = slot.type === 'corner' ? 30 : 15;

  if (slot.type === 'edge') {
    const pointInner = polarToCartesian(centerX, centerY, radiusInner, centerAngle);
    const pointA = polarToCartesian(centerX, centerY, radiusOuter, centerAngle - halfAngle);
    const pointB = polarToCartesian(centerX, centerY, radiusOuter, centerAngle + halfAngle);

    const midRadius = radiusInner + (radiusOuter - radiusInner) * 0.8;
    const pointMidA = polarToCartesian(centerX, centerY, midRadius, centerAngle - halfAngle);
    const pointMidB = polarToCartesian(centerX, centerY, midRadius, centerAngle + halfAngle);

    const edgeColors = whatColorIsThisEdgePiece(pieceHex, colorScheme);

    svgMarkup += `<polygon points="${pointArrayToSVGString([pointMidA, pointA, pointB, pointMidB])}" fill="${edgeColors.outer}" stroke="#333" stroke-width="${strokeMedium}"/>`;
    svgMarkup += `<polygon points="${pointArrayToSVGString([pointInner, pointMidA, pointMidB])}" fill="${edgeColors.inner}" stroke="#333" stroke-width="${strokeThin}"/>`;

  } else if (slot.type === 'corner') {
    const pointInner = polarToCartesian(centerX, centerY, radiusInner, centerAngle);
    const pointOuterRight = polarToCartesian(centerX, centerY, radiusOuter, centerAngle - halfAngle);
    const pointApex = polarToCartesian(centerX, centerY, radiusApex, centerAngle);
    const pointOuterLeft = polarToCartesian(centerX, centerY, radiusOuter, centerAngle + halfAngle);

    const scaleFactor = 0.80;
    const pointSmallLeft = lerpBetweenTwoPoints(pointInner, pointOuterLeft, scaleFactor);
    const pointSmallRight = lerpBetweenTwoPoints(pointInner, pointOuterRight, scaleFactor);
    const pointSmallBottom = lerpBetweenTwoPoints(pointInner, pointApex, scaleFactor);

    const colors = gimmeCornerColorsAsHexCodes(pieceHex, isBottomLayer, colorScheme);

    svgMarkup += `<polygon points="${pointArrayToSVGString([pointInner, pointOuterLeft, pointApex, pointSmallBottom, pointSmallLeft])}" fill="${colors.left}" stroke="#333" stroke-width="${strokeMedium}"/>`;
    svgMarkup += `<polygon points="${pointArrayToSVGString([pointInner, pointSmallRight, pointSmallBottom, pointApex, pointOuterRight])}" fill="${colors.right}" stroke="#333" stroke-width="${strokeMedium}"/>`;
    svgMarkup += `<polygon points="${pointArrayToSVGString([pointInner, pointSmallLeft, pointSmallBottom, pointSmallRight])}" fill="${colors.top}" stroke="#333" stroke-width="${strokeThin}"/>`;
    svgMarkup += `<polygon points="${pointArrayToSVGString([pointInner, pointOuterLeft, pointApex, pointOuterRight])}" fill="none" stroke="#333" stroke-width="${strokeMedium}"/>`;
    svgMarkup += `<line x1="${pointApex.x.toFixed(2)}" y1="${pointApex.y.toFixed(2)}" x2="${pointSmallBottom.x.toFixed(2)}" y2="${pointSmallBottom.y.toFixed(2)}" stroke="#333" stroke-width="${strokeMedium}" stroke-linecap="round" class="corner-detail"/>`;

  } else if (slot.type === 'half-corner') {
    const halfInnerAngle = 15;
    const pointInner = polarToCartesian(centerX, centerY, radiusInner, centerAngle);
    const pointOuterRight = polarToCartesian(centerX, centerY, radiusOuter, centerAngle - halfInnerAngle);
    const pointApex = polarToCartesian(centerX, centerY, radiusApex, centerAngle);
    const pointOuterLeft = polarToCartesian(centerX, centerY, radiusOuter, centerAngle + halfInnerAngle);

    const fillAttribute = whatColorIsThisHalfCorner(pieceHex);
    svgMarkup += `<polygon points="${pointArrayToSVGString([pointInner, pointOuterRight, pointApex, pointOuterLeft])}" ${fillAttribute} stroke="#333" stroke-width="${strokeThin}"/>`;
  }

  return svgMarkup;
}

// === MAIN SVG GENERATION ===
function GenerateTheFullSVGFromHexNotation(hexScrambleCode, desiredSize, colorScheme, ringDistance = 5) {
  if (hexScrambleCode.length !== 25) {
    throw new Error('Invalid scramble format - needs 25 characters!');
  }

  const shapeArray = new Array(24);
  let scrambleIdx = 0;

  // Determine shape for top layer (0-11)
  for (let i = 0; i < 12; i++) {
    if (scrambleIdx === 12) scrambleIdx++;
    const piece = hexScrambleCode[scrambleIdx];
    const isCorner = ['1', '3', '5', '7', '9', 'b', 'd', 'f'].includes(piece.toLowerCase());
    shapeArray[i] = isCorner ? 1 : 0;
    scrambleIdx++;
  }

  // Determine shape for bottom layer (12-23)
  scrambleIdx = 13;
  for (let i = 12; i < 24; i++) {
    const piece = hexScrambleCode[scrambleIdx];
    const isCorner = ['1', '3', '5', '7', '9', 'b', 'd', 'f'].includes(piece.toLowerCase());
    shapeArray[i] = isCorner ? 1 : 0;
    scrambleIdx++;
  }

  const slots = clusterify(shapeArray);
  const pieceAssignments = ParseScrambleAssignmentsFromHexCode(hexScrambleCode, slots);

  // Calculate dimensions
  const svgSize = desiredSize;
  const unit10vh = desiredSize * 0.4;
  const centerX = svgSize / 2;
  const centerY = svgSize / 2;

  const radiusInner = 0;
  const radiusOuter = unit10vh * 0.7;
  const radiusApex = radiusOuter * 1.366025404;
  const ringRadius = radiusOuter + (unit10vh * 0.4);

  const strokeThin = desiredSize * 0.003;
  const strokeMedium = desiredSize * 0.004;
  const strokeRing = 0;
  const strokeLine = desiredSize * 0.008;
  const sliceTrim = 0.70;

  const centerToCenterDistance = ringRadius * (2 + ringDistance / 100);
  const marginLeft = centerToCenterDistance - svgSize;
  let htmlOutput = `<div style="display: flex; align-items: center;">`;

  // LEFT SVG (top layer)
  htmlOutput += `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">`;
  htmlOutput += `<circle cx="${centerX}" cy="${centerY}" r="${ringRadius}" fill="${colorScheme.circleColor}" stroke="rgba(0,0,0,0.08)" stroke-width="${strokeRing}"/>`;

  const linePoint1Left = polarToCartesian(centerX, centerY, (ringRadius + 6) * sliceTrim, 75);
  const linePoint2Left = polarToCartesian(centerX, centerY, (ringRadius + 6) * sliceTrim, 255);
  htmlOutput += `<line x1="${linePoint1Left.x}" y1="${linePoint1Left.y}" x2="${linePoint2Left.x}" y2="${linePoint2Left.y}" stroke="${colorScheme.dividerColor}" stroke-width="${strokeLine}"/>`;
  htmlOutput += `<circle cx="${centerX}" cy="${centerY}" r="${unit10vh * 0.05}" fill="rgba(0,0,0,0.06)"/>`;

  const leftLayerAngles = Array.from({ length: 12 }, (v, j) => 90 + j * 30);

  slots.forEach(slot => {
    if (slot.startLetter < 12) {
      const piece = pieceAssignments[slot.label];
      const angle = gimmeTheAngleForThisSlot(slot, leftLayerAngles);
      htmlOutput += CreateOnePieceSVG(slot, piece, centerX, centerY, angle, radiusInner, radiusOuter, radiusApex, false, strokeThin, strokeMedium, colorScheme);
    }
  });

  htmlOutput += `</svg>`;

  // RIGHT SVG (bottom layer)
  htmlOutput += `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" style="margin-left: ${marginLeft}px;">`;
  htmlOutput += `<circle cx="${centerX}" cy="${centerY}" r="${ringRadius}" fill="${colorScheme.circleColor}" stroke="rgba(0,0,0,0.08)" stroke-width="${strokeRing}"/>`;

  const linePoint1Right = polarToCartesian(centerX, centerY, (ringRadius + 6) * sliceTrim, 105);
  const linePoint2Right = polarToCartesian(centerX, centerY, (ringRadius + 6) * sliceTrim, 285);
  htmlOutput += `<line x1="${linePoint1Right.x}" y1="${linePoint1Right.y}" x2="${linePoint2Right.x}" y2="${linePoint2Right.y}" stroke="${colorScheme.dividerColor}" stroke-width="${strokeLine}"/>`;
  htmlOutput += `<circle cx="${centerX}" cy="${centerY}" r="${unit10vh * 0.05}" fill="rgba(0,0,0,0.06)"/>`;

  const rightLayerAngles = Array.from({ length: 12 }, (v, j) => 300 + j * 30);

  slots.forEach(slot => {
    if (slot.startLetter >= 12) {
      const piece = pieceAssignments[slot.label];
      const angle = gimmeTheAngleForThisSlot(slot, rightLayerAngles);
      htmlOutput += CreateOnePieceSVG(slot, piece, centerX, centerY, angle, radiusInner, radiusOuter, radiusApex, true, strokeThin, strokeMedium, colorScheme);
    }
  });

  htmlOutput += `</svg></div>`;

  return htmlOutput;
}

// ========================================
// === CUBE SHAPE VISUALIZER ===
// ========================================

function CreateOneShapeOutlineSVG(slot, centerX, centerY, centerAngle, radiusInner, radiusOuter, radiusApex, edgeFill, cornerFill, strokeWidth) {
  let svgMarkup = '';
  const halfAngle = slot.type === 'corner' ? 30 : 15;

  if (slot.type === 'edge') {
    const pointInner = polarToCartesian(centerX, centerY, radiusInner, centerAngle);
    const pointA = polarToCartesian(centerX, centerY, radiusOuter, centerAngle - halfAngle);
    const pointB = polarToCartesian(centerX, centerY, radiusOuter, centerAngle + halfAngle);

    svgMarkup += `<polygon points="${pointArrayToSVGString([pointInner, pointA, pointB])}" fill="${edgeFill}" stroke="#333" stroke-width="${strokeWidth}"/>`;

  } else if (slot.type === 'corner') {
    const pointInner = polarToCartesian(centerX, centerY, radiusInner, centerAngle);
    const pointOuterRight = polarToCartesian(centerX, centerY, radiusOuter, centerAngle - halfAngle);
    const pointApex = polarToCartesian(centerX, centerY, radiusApex, centerAngle);
    const pointOuterLeft = polarToCartesian(centerX, centerY, radiusOuter, centerAngle + halfAngle);

    svgMarkup += `<polygon points="${pointArrayToSVGString([pointInner, pointOuterLeft, pointApex, pointOuterRight])}" fill="${cornerFill}" stroke="#333" stroke-width="${strokeWidth}"/>`;

  } else if (slot.type === 'half-corner') {
    const halfInnerAngle = 15;
    const pointInner = polarToCartesian(centerX, centerY, radiusInner, centerAngle);
    const pointOuterRight = polarToCartesian(centerX, centerY, radiusOuter, centerAngle - halfInnerAngle);
    const pointApex = polarToCartesian(centerX, centerY, radiusApex, centerAngle);
    const pointOuterLeft = polarToCartesian(centerX, centerY, radiusOuter, centerAngle + halfInnerAngle);

    svgMarkup += `<polygon points="${pointArrayToSVGString([pointInner, pointOuterRight, pointApex, pointOuterLeft])}" fill="${cornerFill}" stroke="#333" stroke-width="${strokeWidth}"/>`;
  }

  return svgMarkup;
}

function GenerateShapeVisualizationSVG(hexScrambleCode, size, edgeFill, cornerFill, strokeWidthBase, ringDistance = 5) {
  if (hexScrambleCode.length !== 25) {
    throw new Error('Invalid scramble format - needs 25 characters!');
  }

  const shapeArray = new Array(24);
  let scrambleIdx = 0;

  // Determine shape for top layer (0-11)
  for (let i = 0; i < 12; i++) {
    if (scrambleIdx === 12) scrambleIdx++;
    const piece = hexScrambleCode[scrambleIdx];
    const isCorner = ['1', '3', '5', '7', '9', 'b', 'd', 'f'].includes(piece.toLowerCase());
    shapeArray[i] = isCorner ? 1 : 0;
    scrambleIdx++;
  }

  // Determine shape for bottom layer (12-23)
  scrambleIdx = 13;
  for (let i = 12; i < 24; i++) {
    const piece = hexScrambleCode[scrambleIdx];
    const isCorner = ['1', '3', '5', '7', '9', 'b', 'd', 'f'].includes(piece.toLowerCase());
    shapeArray[i] = isCorner ? 1 : 0;
    scrambleIdx++;
  }

  const slots = clusterify(shapeArray);

  // Calculate dimensions
  const svgSize = size;
  const unit10vh = size * 0.4;
  const centerX = svgSize / 2;
  const centerY = svgSize / 2;

  const radiusInner = 0;
  const radiusOuter = unit10vh * 0.7;
  const radiusApex = radiusOuter * 1.366025404;
  const ringRadius = radiusOuter + (unit10vh * 0.4);

  const strokeWidth = (size / 200) * strokeWidthBase;
  const strokeRing = 0;
  const strokeLine = size * 0.008;
  const sliceTrim = 0.70;

  const centerToCenterDistance = ringRadius * (2 + ringDistance / 100);
  const marginLeft = centerToCenterDistance - svgSize;
  let htmlOutput = `<div style="display: flex; align-items: center;">`;

  // LEFT SVG (top layer)
  htmlOutput += `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">`;
  htmlOutput += `<circle cx="${centerX}" cy="${centerY}" r="${ringRadius}" fill="transparent" stroke="rgba(0,0,0,0.08)" stroke-width="${strokeRing}"/>`;

  const linePoint1Left = polarToCartesian(centerX, centerY, (ringRadius + 6) * sliceTrim, 75);
  const linePoint2Left = polarToCartesian(centerX, centerY, (ringRadius + 6) * sliceTrim, 255);
  htmlOutput += `<line x1="${linePoint1Left.x}" y1="${linePoint1Left.y}" x2="${linePoint2Left.x}" y2="${linePoint2Left.y}" stroke="#7a0000" stroke-width="${strokeLine}"/>`;
  htmlOutput += `<circle cx="${centerX}" cy="${centerY}" r="${unit10vh * 0.05}" fill="rgba(0,0,0,0.06)"/>`;

  const leftLayerAngles = Array.from({ length: 12 }, (v, j) => 90 + j * 30);

  slots.forEach(slot => {
    if (slot.startLetter < 12) {
      const angle = gimmeTheAngleForThisSlot(slot, leftLayerAngles);
      htmlOutput += CreateOneShapeOutlineSVG(slot, centerX, centerY, angle, radiusInner, radiusOuter, radiusApex, edgeFill, cornerFill, strokeWidth);
    }
  });

  htmlOutput += `</svg>`;

  // RIGHT SVG (bottom layer)
  htmlOutput += `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" style="margin-left: ${marginLeft}px;">`;
  htmlOutput += `<circle cx="${centerX}" cy="${centerY}" r="${ringRadius}" fill="transparent" stroke="rgba(0,0,0,0.08)" stroke-width="${strokeRing}"/>`;

  const linePoint1Right = polarToCartesian(centerX, centerY, (ringRadius + 6) * sliceTrim, 105);
  const linePoint2Right = polarToCartesian(centerX, centerY, (ringRadius + 6) * sliceTrim, 285);
  htmlOutput += `<line x1="${linePoint1Right.x}" y1="${linePoint1Right.y}" x2="${linePoint2Right.x}" y2="${linePoint2Right.y}" stroke="#7a0000" stroke-width="${strokeLine}"/>`;
  htmlOutput += `<circle cx="${centerX}" cy="${centerY}" r="${unit10vh * 0.05}" fill="rgba(0,0,0,0.06)"/>`;

  const rightLayerAngles = Array.from({ length: 12 }, (v, j) => 300 + j * 30);

  slots.forEach(slot => {
    if (slot.startLetter >= 12) {
      const angle = gimmeTheAngleForThisSlot(slot, rightLayerAngles);
      htmlOutput += CreateOneShapeOutlineSVG(slot, centerX, centerY, angle, radiusInner, radiusOuter, radiusApex, edgeFill, cornerFill, strokeWidth);
    }
  });

  htmlOutput += `</svg></div>`;

  return htmlOutput;
}

/**
 * Visualize cube shape outlines only
 * @param {string|number} input - Can be: shapeIndex (number), hex code (string), or scramble notation (string)
 * @param {number} size - Desired size in pixels (default: 200)
 * @param {string} edgeFill - Fill color for edges (default: 'transparent')
 * @param {string} cornerFill - Fill color for corners (default: 'transparent')
 * @param {number} strokeWidth - Base stroke width (default: 2, scales with size)
 * @returns {string} HTML string containing the SVG visualization
 */

function visualizeCubeShapeOutlines(input, size = 200, edgeFill = 'transparent', cornerFill = 'transparent', strokeWidth = 2, ringDistance = 5) {
  let hexCode;

  // Check if input is a shape index (number)
  if (typeof input === 'number') {
    hexCode = shapeIndexToHex(input);
  }
  // Check if input looks like hex code (contains |)
  else if (typeof input === 'string' && input.includes('|')) {
    hexCode = input;
  }
  // Otherwise treat as scramble notation
  else if (typeof input === 'string') {
    const cubeState = applyScrambleToCubeState(input);
    hexCode = encodeCubeStateToHex(cubeState);

    if (hexCode.startsWith('Error:')) {
      return `<div style="color: #e53e3e; font-family: monospace; padding: 1rem;">${hexCode}</div>`;
    }
  }
  else {
    return `<div style="color: #e53e3e; font-family: monospace; padding: 1rem;">Error: Invalid input type</div>`;
  }

  return GenerateShapeVisualizationSVG(hexCode, size, edgeFill, cornerFill, strokeWidth, ringDistance);
}

// ========================================
// === THE THREE MAGICAL FUNCTIONS!!! ===
// ========================================

/**
 * Option 1: You already have the 25-character hex code
 * @param {string} hexCode - The 25-character scramble code (e.g., "6e0cc804a2a6|0e8c64ee20c4")
 * @param {number} size - Desired size in pixels (default: 200)
 * @param {object} colors - Color customization object with defaults
 * @returns {string} HTML string containing the SVG visualization
 */
function visualizeFromHexCode(hexCode, size = 200, colors = {}, ringDistance = 5) {
  const colorScheme = {
    topColor: colors.topColor || '#000000',
    bottomColor: colors.bottomColor || '#FFFFFF',
    frontColor: colors.frontColor || '#CC0000',
    rightColor: colors.rightColor || '#00AA00',
    backColor: colors.backColor || '#FF8C00',
    leftColor: colors.leftColor || '#0066CC',
    dividerColor: colors.dividerColor || '#7a0000',
    circleColor: colors.circleColor || 'transparent'
  };

  return GenerateTheFullSVGFromHexNotation(hexCode, size, colorScheme, ringDistance);
}

/**
 * Option 2: You have a scramble notation
 * @param {string} scramble - Scramble notation (e.g., "(1,0) / (3,3) / (1,0) / ...")
 * @param {number} size - Desired size in pixels (default: 200)
 * @param {object} colors - Color customization object
 * @returns {string} HTML string containing the SVG visualization
 */
function visualizeFromScrambleNotation(scramble, size = 200, colors = {}, ringDistance = 5) {
  const colorScheme = {
    topColor: colors.topColor || '#000000',
    bottomColor: colors.bottomColor || '#FFFFFF',
    frontColor: colors.frontColor || '#CC0000',
    rightColor: colors.rightColor || '#00AA00',
    backColor: colors.backColor || '#FF8C00',
    leftColor: colors.leftColor || '#0066CC',
    dividerColor: colors.dividerColor || '#7a0000',
    circleColor: colors.circleColor || 'transparent'
  };

  const cubeState = applyScrambleToCubeState(scramble);
  const hexCode = encodeCubeStateToHex(cubeState);

  if (hexCode.startsWith('Error:')) {
    return `<div style="color: #e53e3e; font-family: monospace; padding: 1rem;">${hexCode}</div>`;
  }

  return GenerateTheFullSVGFromHexNotation(hexCode, size, colorScheme, ringDistance);
}

/**
 * Option 3: You have a solution notation (will be inverted to show the state)
 * @param {string} solution - Solution notation (e.g., "(1,0) / (3,3) / (1,0) / ...")
 * @param {number} size - Desired size in pixels (default: 200)
 * @param {object} colors - Color customization object
 * @returns {string} HTML string containing the SVG visualization
 */
function visualizeFromSolutionNotation(solution, size = 200, colors = {}, ringDistance = 5) {
  const invertedScramble = invertScramble(solution);
  return visualizeFromScrambleNotation(invertedScramble, size, colors, ringDistance);
}

// ========================================
// === EXPORT FOR USE ===
// ========================================

// For direct browser usage, attach to window
if (typeof window !== 'undefined') {
  window.Square1VisualizerLibraryWithSillyNames = {
    visualizeFromHexCode,
    visualizeFromScrambleNotation,
    visualizeFromSolutionNotation,
    visualizeCubeShapeOutlines  // <-- This line should be here!
  };
}

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

  // Export as module or global
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { processScramble };
  } else {
    global.SQ1ColorizerLib = { processScramble };
  }

})(this);


/* ==== FILE: js/tools/animate-alg.js ==== */

(function () {
    'use strict';

    // SHAPE_INDEX_ARRAY, hexTwist, hexCycleLeft, invertScramble → utils.js

    function scrambleToHex(scramble, animateBothLayers = false) {
    const moves = animateBothLayers
        ? parseScramble(scramble)
        : parseScrambleLegacy(scramble);

    let tlHex = '011233455677';
    let blHex = '998bbaddcffe';

    for (const move of moves) {
        if (move.type === 'twist') {
            ({ tlHex, blHex } = hexTwist(tlHex, blHex));
        } else if (move.type === 'turn') {
            tlHex = hexCycleLeft(tlHex, move.top);
            blHex = hexCycleLeft(blHex, move.bottom);
        }
    }
    return { tlHex, blHex };
}


    function parseScrambleLegacy(scramble) {
    const paired = window.parseScramble(scramble);
    const moves = [];
    for (const move of paired) {
        if (move.type === 'twist') {
            moves.push(move);
        } else {
            const { top, bottom } = move;
            if (top !== 0) moves.push({ type: 'turn', top, bottom: 0 });
            if (bottom !== 0) moves.push({ type: 'turn', top: 0, bottom });
            if (top === 0 && bottom === 0) moves.push({ type: 'turn', top: 0, bottom: 0 });
        }
    }
    return moves;
}

function parseScramble(scramble, animateBothLayers = false) {
    if (animateBothLayers) return window.parseScramble(scramble);
    return parseScrambleLegacy(scramble);
}

    // ========================================
    // STEP GENERATION
    // ========================================
    function generateSteps(alg, animateBothLayers = false) {
        const steps = [];
        const chars = alg.split('');
        let position = 0;

        // Animate both layers together mode
        if (animateBothLayers) {
            while (position < chars.length) {
                const char = chars[position];

                if (char === '/') {
                    steps.push({
                        position: position,
                        highlightStart: position,
                        highlightEnd: position + 1,
                        currentAlg: alg.substring(position),
                        description: 'Slash (twist)'
                    });
                    position++;
                }
                else if (char === '(') {
                    let numEnd = position + 1;
                    while (numEnd < chars.length && (chars[numEnd] === '-' || /\d/.test(chars[numEnd]) || chars[numEnd] === ',' || chars[numEnd] === ')')) {
                        if (chars[numEnd] === ')') {
                            numEnd++;
                            break;
                        }
                        numEnd++;
                    }

                    steps.push({
                        position: position,
                        highlightStart: position,
                        highlightEnd: numEnd,
                        currentAlg: alg.substring(position),
                        description: 'Both layers turn'
                    });

                    position = numEnd;
                }
                else {
                    position++;
                }
            }
        } else {
            // LEGACY MODE: Separate layers
            while (position < chars.length) {
                const char = chars[position];

                if (char === '/') {
                    steps.push({
                        position: position,
                        highlightStart: position,
                        highlightEnd: position + 1,
                        currentAlg: alg.substring(position),
                        description: 'Slash (twist)'
                    });
                    position++;
                }
                else if (char === '(') {
                    let numEnd = position + 1;
                    while (numEnd < chars.length && (chars[numEnd] === '-' || /\d/.test(chars[numEnd]))) {
                        numEnd++;
                    }

                    steps.push({
                        position: position,
                        highlightStart: position,
                        highlightEnd: numEnd,
                        currentAlg: alg.substring(position),
                        description: 'Top layer turn'
                    });

                    position = numEnd;
                }
                else if (char === ',') {
                    let numEnd = position + 1;
                    while (numEnd < chars.length && (chars[numEnd] === '-' || /\d/.test(chars[numEnd]))) {
                        numEnd++;
                    }
                    if (numEnd < chars.length && chars[numEnd] === ')') {
                        numEnd++;
                    }

                    let moveStart = position;
                    while (moveStart > 0 && chars[moveStart - 1] !== '/') {
                        moveStart--;
                    }

                    let firstNumStart = moveStart;
                    while (firstNumStart < position && chars[firstNumStart] !== '(' && (chars[firstNumStart] === '-' || /\d/.test(chars[firstNumStart]))) {
                        firstNumStart++;
                    }
                    if (chars[firstNumStart] === '(') firstNumStart++;

                    let firstNumEnd = firstNumStart;
                    while (firstNumEnd < position && (chars[firstNumEnd] === '-' || /\d/.test(chars[firstNumEnd]))) {
                        firstNumEnd++;
                    }

                    const remainingAlg = alg.substring(position + 1);
                    const modifiedAlg = '(0,' + remainingAlg;

                    steps.push({
                        position: position,
                        highlightStart: position + 1,
                        highlightEnd: numEnd,
                        currentAlg: modifiedAlg,
                        description: 'Bottom layer turn'
                    });

                    position = numEnd;
                }
                else {
                    position++;
                }
            }
        }

        steps.push({
            position: alg.length,
            highlightStart: alg.length,
            highlightEnd: alg.length,
            currentAlg: '',
            description: 'Solved state'
        });

        let firstNonZeroIndex = 0;
        for (let i = 0; i < steps.length; i++) {
            if (!isZeroMove(steps[i], alg, animateBothLayers)) {
                firstNonZeroIndex = i;
                break;
            }
        }

        return steps.slice(firstNonZeroIndex);
    }

    function getHexForStep(step, animateBothLayers = false) {
        try {
            if (step.currentAlg.trim() === '' || step.currentAlg === '(0,0)') {
                return { tlHex: '011233455677', blHex: '998bbaddcffe' };
            }
            const inverted = invertScramble(step.currentAlg);
            return scrambleToHex(inverted, animateBothLayers);
        } catch (e) {
            return { tlHex: '011233455677', blHex: '998bbaddcffe' };
        }
    }

    function isZeroMove(step, originalAlg, animateBothLayers) {
        const highlighted = originalAlg.substring(step.highlightStart, step.highlightEnd);

        if (highlighted.includes('/')) {
            return false;
        }

        // In "both layers" mode, check if BOTH numbers are zero
        if (animateBothLayers) {
            const match = highlighted.match(/\(?\s*(-?\d+)\s*,\s*(-?\d+)\s*\)?/);
            if (match) {
                const top = parseInt(match[1]);
                const bottom = parseInt(match[2]);
                return top === 0 && bottom === 0;
            }
            return false;
        }

        // In single layer mode, check if the single number is zero
        const numberMatch = highlighted.match(/-?\d+/);
        if (numberMatch) {
            const number = parseInt(numberMatch[0]);
            return number === 0;
        }

        return false;
    }

    // ========================================
    // RENDERING FUNCTIONS
    // ========================================
    function renderAlgorithm(originalAlg, steps, currentStepIndex, animateBothLayers) {
        // Build clickable tokens
        let html = '';
        let position = 0;

        steps.forEach((s, index) => {
            if (s.highlightStart > position) {
                // Add any text between tokens (whitespace)
                html += originalAlg.substring(position, s.highlightStart);
            }

            const tokenText = originalAlg.substring(s.highlightStart, s.highlightEnd);
            const isCurrent = index === currentStepIndex;
            const isZero = isZeroMove(s, originalAlg, animateBothLayers);

            // Make token clickable unless it's a zero move
            if (!isZero) {
                html += `<span class="clickable-token ${isCurrent ? 'current-token' : ''}" data-step-index="${index}" style="cursor: pointer; padding: 2px 4px; border-radius: 2px; ${isCurrent ? 'background: var(--hover-bg); color: var(--text-primary);' : ''} display: inline-block; margin: 0 1px;">${tokenText}</span>`;
            } else {
                // Zero moves are not clickable
                html += `<span style="padding: 2px 4px; opacity: 0.4; display: inline-block; margin: 0 1px;">${tokenText}</span>`;
            }

            position = s.highlightEnd;
        });

        // Add any remaining text
        if (position < originalAlg.length) {
            html += originalAlg.substring(position);
        }

        return html;
    }

    function renderVisualization(hex, colorScheme, imageSize) {
        if (typeof window.Square1VisualizerLibraryWithSillyNames === 'undefined') {
            return '<div style="color: var(--alg-invalid-color); font-style: italic;">draw-scramble.js not found</div>';
        }

        try {
            const hexCode = hex.tlHex + '|' + hex.blHex;
            const svgHtml = window.Square1VisualizerLibraryWithSillyNames.visualizeFromHexCode(
                hexCode,
                imageSize,
                {
                    topColor: colorScheme.topColor,
                    bottomColor: colorScheme.bottomColor,
                    frontColor: colorScheme.frontColor,
                    rightColor: colorScheme.rightColor,
                    backColor: colorScheme.backColor,
                    leftColor: colorScheme.leftColor,
                    dividerColor: '#7a0000',
                    circleColor: 'transparent'
                },
                5
            );
            return svgHtml;
        } catch (e) {
            return '<div style="color: var(--alg-invalid-color); font-style: italic;">Error rendering: ' + e.message + '</div>';
        }
    }

    // ========================================
    // MAIN VIEWER CREATION FUNCTION
    // ========================================
    function createViewer(algorithm, colors = {}, caseName = '', parity = '') {
        const modalId = 'sq1-viewer-modal-' + Date.now();

        const colorScheme = {
            topColor: colors.topColor || '#000000',
            bottomColor: colors.bottomColor || '#FFFFFF',
            frontColor: colors.frontColor || '#CC0000',
            rightColor: colors.rightColor || '#00AA00',
            backColor: colors.backColor || '#FF8C00',
            leftColor: colors.leftColor || '#0066CC'
        };

        // Initialize state
        const state = {
            originalAlg: algorithm,
            steps: generateSteps(algorithm, localStorage.getItem('sq1AnimBothLayers') !== null ? localStorage.getItem('sq1AnimBothLayers') === 'true' : true),
            currentStep: 0,
            animationSpeed: parseFloat(localStorage.getItem('sq1AnimSpeed')) || 0.9,
            autoRunDelay: parseInt(localStorage.getItem('sq1AutoDelay')) || 500,
            isAnimating: false,
            isAutoRunning: false,
            autoRunDirection: 'next',
            colorScheme: colorScheme,
            imageSize: parseInt(localStorage.getItem('sq1AnimImageSize')) || 200,
            animateBothLayers: localStorage.getItem('sq1AnimBothLayers') !== null ? localStorage.getItem('sq1AnimBothLayers') === 'true' : true,
            verticalDisplay: localStorage.getItem('sq1AnimVerticalDisplay') !== null ? localStorage.getItem('sq1AnimVerticalDisplay') === 'true' : false
        };

        const css = `
        <style>
            #${modalId} {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: var(--modal-overlay);
                z-index: 10005;
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: Arial, sans-serif;
                overflow-y: auto;
                padding: 0px 20px;
                box-sizing: border-box;
            }
            #${modalId} .modal-content {
                background: var(--surface);
                border-radius: 18px;
                max-width: min(800px, 90vw);
                width: 100%;
                min-height: 20vh;
                max-height: 95vh;
                overflow: hidden;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                position: relative;
                display: flex;
                flex-direction: column;
            }
            #${modalId} .modal-body {
                padding: 0px 20px;
                overflow-y: auto;
                flex: 1;
                background: var(--surface);
                border-radius: 0 0 18px 18px;
            }
            #${modalId} .modal-body::-webkit-scrollbar {
                display: none;
            }
            #${modalId} .modal-body {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
            #${modalId} .modal-header {
                padding: 20px;
                border-bottom: 1px solid var(--surface-border);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            #${modalId} .close-btn {
                background: var(--surface2);
                border: none;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                cursor: pointer;
                font-size: 20px;
                transition: background 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                line-height: 1;
            }
            #${modalId} .close-btn:hover {
                background: var(--surface-border);
            }
            #${modalId} .menu-btn {
                background: var(--surface2);
                border: none;
                border-radius: 6px;
                width: 36px;
                height: 36px;
                cursor: pointer;
                font-size: 20px;
                transition: background 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
            }
            #${modalId} .menu-btn:hover {
                background: var(--surface-border);
            }
            #${modalId} .sidebar {
                position: absolute;
                left: 0;
                top: 0;
                width: 280px;
                height: 100%;
                background: var(--surface2);
                box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
                z-index: 100;
                border-radius: 18px 0 0 18px;
                overflow-y: auto;
                overflow-x: hidden;
                transform: translateX(-100%);
                transition: transform 0.3s ease;
            }
            #${modalId} .sidebar::-webkit-scrollbar {
                width: 6px;
            }
            #${modalId} .sidebar::-webkit-scrollbar-track {
                background: var(--surface-border);
            }
            #${modalId} .sidebar::-webkit-scrollbar-thumb {
                background: var(--scrollbar-thumb-hover);
                border-radius: 3px;
            }
            #${modalId} .sidebar.open {
                transform: translateX(0);
            }
            #${modalId} .sidebar-content {
                position: relative !important;
                transform: none !important;
                left: auto !important;
                top: auto !important;
                width: auto !important;
                height: auto !important;
                max-width: none !important;
                max-height: none !important;
                background: none !important;
                box-shadow: none !important;
                display: block !important;
                flex-direction: column !important;
                overflow-y: visible !important;
                transition: none !important;
                padding: 20px;
            }
            #${modalId} .sidebar-title {
                font-size: 18px;
                font-weight: bold;
                color: var(--text-primary) !important;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 2px solid var(--surface-border);
            }
            #${modalId} .sidebar-section {
                margin-bottom: 25px;
            }
            #${modalId} .sidebar-section label {
                display: block;
                font-size: 14px;
                color: var(--text-primary) !important;
                margin-bottom: 8px;
                font-weight: 600;
            }
            #${modalId} .sidebar-section input[type="range"] {
                width: 100%;
                height: 6px;
                border-radius: 3px;
                background: var(--surface-border);
                outline: none;
                -webkit-appearance: none;
            }
            #${modalId} .sidebar-section input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: var(--accent);
                cursor: pointer;
            }
            #${modalId} .sidebar-section input[type="range"]::-moz-range-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: var(--accent);
                cursor: pointer;
                border: none;
            }
            #${modalId} .sidebar-value {
                display: block;
                text-align: right;
                font-size: 14px;
                color: var(--text-primary) !important;
                margin-top: 4px;
                font-weight: 500;
            }
            #${modalId} .toggle-container {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            #${modalId} .toggle-container span {
                color: var(--text-primary) !important;
                font-weight: 500;
            }
            #${modalId} .toggle-switch {
                position: relative;
                width: 48px;
                height: 24px;
                background: var(--border-color);
                border-radius: 12px;
                cursor: pointer;
                transition: background 0.3s;
                flex-shrink: 0;
            }
            #${modalId} .toggle-switch.active {
                background: var(--accent);
            }
            #${modalId} .toggle-slider {
                position: absolute;
                top: 2px;
                left: 2px;
                width: 20px;
                height: 20px;
                background: var(--surface);
                border-radius: 50%;
                transition: left 0.3s;
            }
            #${modalId} .toggle-switch.active .toggle-slider {
                left: 26px;
            }
            #${modalId} .modal-body {
                padding: 0px 20px;
            }
            #${modalId} .algorithm-display {
                font-family: 'Courier New', monospace;
                font-size: 18px;
                padding: 12px;
                background: var(--surface2);
                border-radius: 6px;
                margin: 15px 0;
                text-align: center;
                color: var(--text-primary);
            }
            #${modalId} .slider-group {
                margin: 15px 0;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            #${modalId} .slider-group label {
                min-width: 140px;
                font-size: 14px;
                color: var(--text-secondary);
            }
            #${modalId} .slider-group input[type="range"] {
                flex: 1;
                height: 6px;
                border-radius: 3px;
                background: var(--surface-border);
                outline: none;
            }
            #${modalId} .slider-group input[type="range"]::-webkit-slider-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: var(--accent);
                cursor: pointer;
            }
            #${modalId} .slider-group input[type="range"]::-moz-range-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: var(--accent);
                cursor: pointer;
                border: none;
            }
            #${modalId} .slider-group span {
                min-width: 60px;
                text-align: right;
                font-size: 14px;
                color: var(--text-secondary);
            }
            #${modalId} .visualization-area {
                margin: 7px 0;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            #${modalId} .visualization-container {
                flex: 1;
                display: flex;
                justify-content: center;
            }
            #${modalId} .highlighted-alg {
                font-family: 'Courier New', monospace;
                font-size: 16px;
                padding: 10px;
                background: var(--surface2);
                border-radius: 6px;
                margin: 15px 0;
                text-align: center;
                min-height: 30px;
            }
            #${modalId} .control-buttons {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin: 15px 0;
            }
            #${modalId} .control-btn {
                background: var(--surface2);
                border: none;
                border-radius: 4px;
                padding: 4px 6px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            #${modalId} .control-btn:hover:not(:disabled) {
                background: var(--surface-border);
            }
            #${modalId} .control-btn:disabled {
                opacity: 0.3;
                cursor: not-allowed;
            }
            #${modalId} .step-slider-container {
                margin: 15px 0;
            }
            #${modalId} .step-slider-container input[type="range"] {
                width: 100%;
                height: 6px;
                border-radius: 3px;
                background: var(--surface-border);
                outline: none;
            }
            #${modalId} .step-slider-container input[type="range"]::-webkit-slider-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: var(--accent);
                cursor: pointer;
            }
            #${modalId} .step-slider-container input[type="range"]::-moz-range-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: var(--accent);
                cursor: pointer;
                border: none;
            }
            #${modalId} .step-counter {
                text-align: center;
                font-size: 14px;
                color: var(--text-secondary);
                margin: 10px 0;
            }
            #${modalId} .clickable-token:not(.current-token):hover {
                text-decoration: underline;
            }
        </style>
    `;

        const html = `
        ${css}
        <div id="${modalId}" onclick="(function(e) { if (e.target.id === '${modalId}') { document.getElementById('${modalId}').remove(); document.body.classList.remove('modal-open'); document.body.style.top = ''; window.scrollTo(0, window.modalScrollY || 0); } })(event)">
            <div class="modal-content">
                <div class="modal-header">
    <div style="display: flex; align-items: center; gap: 12px;">
        <button class="menu-btn" id="${modalId}-menu-btn">☰</button>
        <div style="display: flex; flex-direction: column; gap: 2px;">
            ${caseName && parity ? `
                <div style="font-size: 16px; font-weight: bold; color: var(--text-primary);">${caseName} (${parity})</div>
                <div style="font-size: 11px; color: var(--text-muted); font-family: monospace;">${algorithm.length > 50 ? algorithm.substring(0, 50) + '...' : algorithm}</div>
            ` : `
                <div style="font-size: 18px; font-weight: bold; color: var(--text-primary);">Algorithm Viewer</div>
            `}
        </div>
    </div>
    <button class="close-btn" id="${modalId}-close-btn">✕</button>
</div>
                <div class="modal-body" id="${modalId}-body">
                    <!-- Content will be rendered here -->
                </div>
                <div class="sidebar" id="${modalId}-sidebar">
                    <div class="sidebar-content">
                        <div class="sidebar-title">Settings</div>

                        <div class="sidebar-section">
                            <label>Animation Speed</label>
                            <input type="range" id="${modalId}-sidebar-speed" min="0.2" max="2" step="0.1" value="${state.animationSpeed}">
                            <span class="sidebar-value" id="${modalId}-sidebar-speed-val">${state.animationSpeed.toFixed(1)}x</span>
                        </div>

                        <div class="sidebar-section">
                            <label>Auto Delay</label>
                            <input type="range" id="${modalId}-sidebar-delay" min="0" max="1000" step="50" value="${state.autoRunDelay}">
                            <span class="sidebar-value" id="${modalId}-sidebar-delay-val">${state.autoRunDelay}ms</span>
                        </div>

                        <div class="sidebar-section">
                            <label>Image Size</label>
                            <input type="range" id="${modalId}-sidebar-image-size" min="100" max="400" step="10" value="${state.imageSize}">
                            <span class="sidebar-value" id="${modalId}-sidebar-image-size-val">${state.imageSize}px</span>
                        </div>

                        <div class="sidebar-section">
                            <label>Animate Both Layers Together</label>
                            <div class="toggle-container">
                                <div class="toggle-switch ${state.animateBothLayers ? 'active' : ''}" id="${modalId}-both-layers-toggle">
                                    <div class="toggle-slider"></div>
                                </div>
                                <span style="font-size: 14px; color: var(--text-secondary);" id="${modalId}-toggle-label">${state.animateBothLayers ? 'On' : 'Off'}</span>
                            </div>
                        </div>

                        <div class="sidebar-section">
                            <label>Enable Vertical Display</label>
                            <div class="toggle-container">
                                <div class="toggle-switch ${state.verticalDisplay ? 'active' : ''}" id="${modalId}-vertical-display-toggle">
                                    <div class="toggle-slider"></div>
                                </div>
                                <span style="font-size: 14px; color: var(--text-secondary);" id="${modalId}-vertical-toggle-label">${state.verticalDisplay ? 'On' : 'Off'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;



        // Render function
        function render() {
            const step = state.steps[state.currentStep];
            const hex = getHexForStep(step, state.animateBothLayers);
            let visualization = renderVisualization(hex, state.colorScheme, state.imageSize);

            // Apply vertical display transformation if enabled
            if (state.verticalDisplay) {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = visualization;
                const flexContainer = wrapper.querySelector('div[style*="display: flex"]');
                if (flexContainer) {
                    const currentStyle = flexContainer.getAttribute('style');
                    flexContainer.setAttribute('style', currentStyle.replace('display: flex', 'display: flex; flex-direction: column'));
                    const svgs = flexContainer.querySelectorAll('svg');
                    svgs.forEach((svg, index) => {
                        if (index === 1) {
                            const svgStyle = svg.getAttribute('style') || '';
                            const newStyle = svgStyle.replace(/margin-left:\s*[^;]+;?/, 'margin-top: -40px;');
                            svg.setAttribute('style', newStyle);
                        }
                    });
                }
                visualization = wrapper.innerHTML;
            }
            const highlightedAlg = renderAlgorithm(state.originalAlg, state.steps, state.currentStep, state.animateBothLayers);

            const bodyHtml = `
            <div class="visualization-area">
                <div class="visualization-container">${visualization}</div>
            </div>

            <div class="highlighted-alg">${highlightedAlg}</div>

            <div class="control-buttons">
                <button class="control-btn" id="${modalId}-first" ${state.currentStep === 0 ? 'disabled' : ''}>
                    <img src="res/anim/first.svg" alt="First" style="width: 16px; height: 16px;">
                </button>
                <button class="control-btn" id="${modalId}-prev" ${state.currentStep === 0 ? 'disabled' : ''}>
                    <img src="res/anim/prev.svg" alt="Previous" style="width: 16px; height: 16px;">
                </button>
                <button class="control-btn" id="${modalId}-play-pause">
                    <img src="res/anim/${state.isAutoRunning ? 'pause' : 'play'}.svg" alt="${state.isAutoRunning ? 'Pause' : 'Play'}" style="width: 16px; height: 16px;">
                </button>
                <button class="control-btn" id="${modalId}-next" ${state.currentStep === state.steps.length - 1 ? 'disabled' : ''}>
                    <img src="res/anim/next.svg" alt="Next" style="width: 16px; height: 16px;">
                </button>
                <button class="control-btn" id="${modalId}-last" ${state.currentStep === state.steps.length - 1 ? 'disabled' : ''}>
                    <img src="res/anim/last.svg" alt="Last" style="width: 16px; height: 16px;">
                </button>
            </div>
               `;

            document.getElementById(`${modalId}-body`).innerHTML = bodyHtml;

            // Attach event listeners
            attachEventListeners();
        }

        function applyVerticalDisplayIfEnabled(container) {
            if (!state.verticalDisplay) return;

            const flexDiv = container.querySelector('div[style*="display: flex"]');
            if (!flexDiv) return;

            const currentStyle = flexDiv.getAttribute('style');
            flexDiv.setAttribute('style', currentStyle.replace('display: flex', 'display: flex; flex-direction: column'));

            const svgs = flexDiv.querySelectorAll('svg');
            svgs.forEach((svg, index) => {
                if (index === 1) {
                    const svgStyle = svg.getAttribute('style') || '';
                    const newStyle = svgStyle.replace(/margin-left:\s*[^;]+;?/, 'margin-top: -40px;');
                    svg.setAttribute('style', newStyle);
                }
            });
        }

        function attachEventListeners() {
            // First button
            const firstBtn = document.getElementById(`${modalId}-first`);
            if (firstBtn) {
                firstBtn.onclick = () => {
                    if (state.currentStep > 0 && !state.isAnimating && !state.isAutoRunning) {
                        state.currentStep = 0;
                        render();
                    }
                };
            }

            // Last button
            const lastBtn = document.getElementById(`${modalId}-last`);
            if (lastBtn) {
                lastBtn.onclick = () => {
                    if (state.currentStep < state.steps.length - 1 && !state.isAnimating && !state.isAutoRunning) {
                        state.currentStep = state.steps.length - 1;
                        render();
                    }
                };
            }

            // Play/Pause button
            const playPauseBtn = document.getElementById(`${modalId}-play-pause`);
            if (playPauseBtn) {
                playPauseBtn.onclick = () => {
                    if (state.isAutoRunning) {
                        // Pause
                        state.isAutoRunning = false;
                        render();
                    } else {
                        // Play
                        if (state.currentStep < state.steps.length - 1 && !state.isAnimating) {
                            state.isAutoRunning = true;
                            state.autoRunDirection = 'next';
                            render();
                            autoRunNextStep();
                        }
                    }
                };
            }
            // Menu button
            const menuBtn = document.getElementById(`${modalId}-menu-btn`);
            const sidebar = document.getElementById(`${modalId}-sidebar`);
            const modalBody = document.getElementById(`${modalId}-body`);

            menuBtn.onclick = (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('open');

                const sidebarContent = sidebar.querySelector('.sidebar-content');
                if (sidebarContent) {
                    const contentStyles = window.getComputedStyle(sidebarContent);
                }
            };

            // Close sidebar when clicking outside of it
            modalBody.onclick = () => {
                if (sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                }
            };

            // Prevent sidebar clicks from bubbling
            sidebar.onclick = (e) => {
                e.stopPropagation();
            };

            // Close button
            const closeBtn = document.getElementById(`${modalId}-close-btn`);
            const close = () => {
                closeModalWithHistory(() => {
                    document.getElementById(modalId).remove();
                    document.body.classList.remove('modal-open');
                    document.body.style.top = '';
                    window.scrollTo(0, window.modalScrollY || 0);
                });
            };
            closeBtn.onclick = close;
            pushModalState(modalId, close);

            // Sidebar speed slider
            const sidebarSpeedSlider = document.getElementById(`${modalId}-sidebar-speed`);
            const sidebarSpeedVal = document.getElementById(`${modalId}-sidebar-speed-val`);
            sidebarSpeedSlider.oninput = (e) => {
                state.animationSpeed = parseFloat(e.target.value);
                sidebarSpeedVal.textContent = state.animationSpeed.toFixed(1) + 'x';
                localStorage.setItem('sq1AnimSpeed', state.animationSpeed);
            };

            // Sidebar delay slider
            const sidebarDelaySlider = document.getElementById(`${modalId}-sidebar-delay`);
            const sidebarDelayVal = document.getElementById(`${modalId}-sidebar-delay-val`);
            sidebarDelaySlider.oninput = (e) => {
                state.autoRunDelay = parseInt(e.target.value);
                sidebarDelayVal.textContent = state.autoRunDelay + 'ms';
                localStorage.setItem('sq1AutoDelay', state.autoRunDelay);
            };

            // Sidebar image size slider
            const sidebarImageSizeSlider = document.getElementById(`${modalId}-sidebar-image-size`);
            const sidebarImageSizeVal = document.getElementById(`${modalId}-sidebar-image-size-val`);
            sidebarImageSizeSlider.oninput = (e) => {
                state.imageSize = parseInt(e.target.value);
                sidebarImageSizeVal.textContent = state.imageSize + 'px';
                localStorage.setItem('sq1AnimImageSize', state.imageSize);
                render();
            };

            // Both layers toggle
            const bothLayersToggle = document.getElementById(`${modalId}-both-layers-toggle`);
            bothLayersToggle.onclick = () => {
                state.animateBothLayers = !state.animateBothLayers;
                bothLayersToggle.classList.toggle('active');
                const label = bothLayersToggle.nextElementSibling;
                label.textContent = state.animateBothLayers ? 'On' : 'Off';
                localStorage.setItem('sq1AnimBothLayers', state.animateBothLayers);

                // Regenerate steps with new mode
                state.steps = generateSteps(state.originalAlg, state.animateBothLayers);
                state.currentStep = 0;
                render();
            };

            // Vertical display toggle
            const verticalDisplayToggle = document.getElementById(`${modalId}-vertical-display-toggle`);
            verticalDisplayToggle.onclick = () => {
                state.verticalDisplay = !state.verticalDisplay;
                verticalDisplayToggle.classList.toggle('active');
                const label = verticalDisplayToggle.nextElementSibling;
                label.textContent = state.verticalDisplay ? 'On' : 'Off';
                localStorage.setItem('sq1AnimVerticalDisplay', state.verticalDisplay);

                // Re-render with new display mode
                render();
            };

            // Previous button
            const prevBtn = document.getElementById(`${modalId}-prev`);
            if (prevBtn) {
                prevBtn.onclick = () => {
                    if (state.currentStep > 0 && !state.isAnimating && !state.isAutoRunning) {
                        state.currentStep--;
                        animateStep('prev');
                    }
                };
            }

            // Next button
            const nextBtn = document.getElementById(`${modalId}-next`);
            if (nextBtn) {
                nextBtn.onclick = () => {
                    if (state.currentStep < state.steps.length - 1 && !state.isAnimating && !state.isAutoRunning) {
                        state.currentStep++;
                        animateStep('next');
                    }
                };
            }

            // Clickable tokens
            document.querySelectorAll(`#${modalId} .clickable-token`).forEach(token => {
                token.onclick = () => {
                    if (state.isAnimating || state.isAutoRunning) return;

                    const targetStep = parseInt(token.getAttribute('data-step-index'));
                    if (!isNaN(targetStep) && targetStep >= 0 && targetStep < state.steps.length) {
                        state.currentStep = targetStep;
                        render();
                    }
                };
            });
        }

        function autoRunNextStep() {
            if (!state.isAutoRunning) return;

            const direction = state.autoRunDirection;
            const canContinue = direction === 'next' ? state.currentStep < state.steps.length - 1 : state.currentStep > 0;

            if (!canContinue) {
                state.isAutoRunning = false;
                render();
                return;
            }

            setTimeout(() => {
                if (!state.isAutoRunning) return;

                state.currentStep += direction === 'next' ? 1 : -1;
                animateStep(direction);
            }, state.autoRunDelay);
        }

        function animateStep(direction = 'next') {
            state.isAnimating = true;
            const step = state.steps[state.currentStep];

            if (state.animateBothLayers) {
                // ============================================
                // ANIMATE BOTH LAYERS MODE - COMPLETELY SEPARATE LOGIC
                // ============================================
                let tokenToAnimate;

                if (direction === 'next') {
                    // Going forward: animate the PREVIOUS token
                    if (state.currentStep > 0) {
                        tokenToAnimate = state.steps[state.currentStep - 1];
                    } else {
                        state.isAnimating = false;
                        render();
                        return;
                    }
                } else {
                    // Going backward: animate the CURRENT token
                    tokenToAnimate = step;
                }

                const tokenText = state.originalAlg.substring(tokenToAnimate.highlightStart, tokenToAnimate.highlightEnd);

                if (tokenText.includes('/')) {
                    // SLASH TOKEN - Fade animation
                    const duration = 500 / state.animationSpeed;

                    let beforeHex, afterHex;

                    if (direction === 'next') {
                        const prevStep = state.steps[state.currentStep - 1];
                        beforeHex = prevStep ? getHexForStep(prevStep, true) : getHexForStep(step, true);
                        afterHex = getHexForStep(step, true);
                    } else {
                        beforeHex = getHexForStep(step, true);
                        const nextStep = state.steps[state.currentStep + 1];
                        afterHex = nextStep ? getHexForStep(nextStep, true) : getHexForStep(step, true);
                    }

                    const beforeSvgHtml = renderVisualization(beforeHex, state.colorScheme, state.imageSize);
                    const afterSvgHtml = renderVisualization(afterHex, state.colorScheme, state.imageSize);

                    const visualizationDiv = document.querySelector(`#${modalId} .visualization-container`);

                    const wrapper = document.createElement('div');
                    wrapper.style.position = 'relative';
                    wrapper.style.display = 'flex';
                    wrapper.style.flexDirection = 'column';
                    wrapper.style.alignItems = 'center';
                    wrapper.style.gap = '20 px';

                    const bottomLayer = document.createElement('div');
                    const topLayer = document.createElement('div');

                    if (direction === 'next') {
                        bottomLayer.innerHTML = afterSvgHtml;
                        bottomLayer.style.position = 'relative';
                        bottomLayer.style.opacity = '0';

                        topLayer.innerHTML = beforeSvgHtml;
                        topLayer.style.position = 'absolute';
                        topLayer.style.top = '0';
                        topLayer.style.left = '50%';
                        topLayer.style.transform = 'translateX(-50%)';
                        topLayer.style.opacity = '1';
                        topLayer.style.pointerEvents = 'none';

                        applyVerticalDisplayIfEnabled(bottomLayer);
                        applyVerticalDisplayIfEnabled(topLayer);

                        wrapper.appendChild(bottomLayer);
                        wrapper.appendChild(topLayer);

                        visualizationDiv.innerHTML = '';
                        visualizationDiv.appendChild(wrapper);

                        requestAnimationFrame(() => {
                            topLayer.style.transition = `opacity ${duration}ms linear`;
                            bottomLayer.style.transition = `opacity ${duration}ms linear`;
                            requestAnimationFrame(() => {
                                setTimeout(() => {
                                    topLayer.style.opacity = '0';
                                }, 0);
                                bottomLayer.style.opacity = '1';
                            });
                        });
                    } else {
                        bottomLayer.innerHTML = beforeSvgHtml;
                        bottomLayer.style.position = 'relative';
                        bottomLayer.style.opacity = '1';

                        topLayer.innerHTML = afterSvgHtml;
                        topLayer.style.position = 'absolute';
                        topLayer.style.top = '0';
                        topLayer.style.left = '50%';
                        topLayer.style.transform = 'translateX(-50%)';
                        topLayer.style.opacity = '1';
                        topLayer.style.transition = `opacity ${duration}ms linear`;
                        topLayer.style.pointerEvents = 'none';

                        applyVerticalDisplayIfEnabled(bottomLayer);
                        applyVerticalDisplayIfEnabled(topLayer);

                        wrapper.appendChild(bottomLayer);
                        wrapper.appendChild(topLayer);

                        visualizationDiv.innerHTML = '';
                        visualizationDiv.appendChild(wrapper);

                        requestAnimationFrame(() => {
                            topLayer.style.transition = `opacity ${duration}ms linear`;
                            bottomLayer.style.transition = `opacity ${duration}ms linear`;
                            requestAnimationFrame(() => {
                                setTimeout(() => {
                                    topLayer.style.opacity = '0';
                                }, 0);
                                bottomLayer.style.opacity = '1';
                            });
                        });
                    }

                    setTimeout(() => {
                        state.isAnimating = false;
                        render();

                        if (state.isAutoRunning) {
                            autoRunNextStep();
                        }
                    }, duration);
                } else {
                    // ROTATION TOKEN - Both layers rotate simultaneously
                    const match = tokenText.match(/\(?\s*(-?\d+)\s*,\s*(-?\d+)\s*\)?/);
                    if (match) {
                        const topRotation = parseInt(match[1]);
                        const bottomRotation = parseInt(match[2]);

                        const topSvg = document.querySelector(`#${modalId} .visualization-container > div > svg:first-child`);
                        const bottomSvg = document.querySelector(`#${modalId} .visualization-container > div > svg:last-child`);

                        if (topSvg && bottomSvg) {
                            const topPieces = topSvg.querySelectorAll('polygon, line.corner-detail');
                            const bottomPieces = bottomSvg.querySelectorAll('polygon, line.corner-detail');

                            const svgSize = state.imageSize;
                            const topCenterX = svgSize / 2;
                            const topCenterY = svgSize / 2;
                            const bottomCenterX = svgSize / 2;
                            const bottomCenterY = svgSize / 2;

                            const maxActualRotation = Math.max(Math.abs(topRotation), Math.abs(bottomRotation));
                            const duration = maxActualRotation === 0 ? 50 : (maxActualRotation * 100) / state.animationSpeed;

                            const rotationMultiplier = direction === 'prev' ? -1 : 1;

                            topPieces.forEach(piece => {
                                piece.style.transformOrigin = `${topCenterX}px ${topCenterY}px`;
                                piece.style.transition = `transform ${duration}ms ease-in-out`;
                                piece.style.transform = `rotate(${topRotation * 30 * rotationMultiplier}deg)`;
                            });

                            bottomPieces.forEach(piece => {
                                piece.style.transformOrigin = `${bottomCenterX}px ${bottomCenterY}px`;
                                piece.style.transition = `transform ${duration}ms ease-in-out`;
                                piece.style.transform = `rotate(${bottomRotation * 30 * rotationMultiplier}deg)`;
                            });

                            setTimeout(() => {
                                topPieces.forEach(piece => {
                                    piece.style.transform = '';
                                    piece.style.transition = '';
                                });
                                bottomPieces.forEach(piece => {
                                    piece.style.transform = '';
                                    piece.style.transition = '';
                                });

                                state.isAnimating = false;
                                render();

                                if (state.isAutoRunning) {
                                    autoRunNextStep();
                                }
                            }, duration);
                        } else {
                            state.isAnimating = false;
                            render();
                        }
                    } else {
                        state.isAnimating = false;
                        render();
                    }
                }
            } else {
                // ============================================
                // LEGACY MODE - COMPLETELY SEPARATE LOGIC
                // ============================================
                let topRotation = 0;
                let bottomRotation = 0;
                let shouldRotate = false;
                let isSlashToken = false;
                let analyzePosition = -1;

                if (direction === 'next') {
                    analyzePosition = step.highlightStart - 1;
                    while (analyzePosition >= 0 && /\s/.test(state.originalAlg[analyzePosition])) {
                        analyzePosition--;
                    }
                } else {
                    analyzePosition = step.highlightStart;
                }

                if (analyzePosition >= 0 && analyzePosition < state.originalAlg.length) {
                    if (state.originalAlg[analyzePosition] === '/') {
                        isSlashToken = true;
                    } else {
                        let numberStart = analyzePosition;
                        let numberEnd = analyzePosition;

                        while (numberStart > 0 && (state.originalAlg[numberStart - 1] === '-' || /\d/.test(state.originalAlg[numberStart - 1]))) {
                            numberStart--;
                        }

                        while (numberEnd < state.originalAlg.length && /\d/.test(state.originalAlg[numberEnd])) {
                            numberEnd++;
                        }

                        if (numberStart === numberEnd) {
                            numberStart = analyzePosition;
                            while (numberStart < state.originalAlg.length && !/\d/.test(state.originalAlg[numberStart]) && state.originalAlg[numberStart] !== '-') {
                                numberStart++;
                            }
                            if (numberStart < state.originalAlg.length && state.originalAlg[numberStart] === '-') {
                                numberEnd = numberStart + 1;
                            } else {
                                numberEnd = numberStart;
                            }
                            while (numberEnd < state.originalAlg.length && /\d/.test(state.originalAlg[numberEnd])) {
                                numberEnd++;
                            }
                        }

                        const numberStr = state.originalAlg.substring(numberStart, numberEnd);
                        const number = parseInt(numberStr);

                        if (!isNaN(number)) {
                            shouldRotate = true;

                            let searchStart = numberEnd;
                            let foundComma = false;

                            while (searchStart < state.originalAlg.length && /\s/.test(state.originalAlg[searchStart])) {
                                searchStart++;
                            }

                            if (searchStart < state.originalAlg.length && state.originalAlg[searchStart] === ',') {
                                foundComma = true;
                            }

                            let beforeComma = false;
                            for (let i = numberStart - 1; i >= 0; i--) {
                                if (state.originalAlg[i] === ',') {
                                    beforeComma = true;
                                    break;
                                }
                                if (state.originalAlg[i] === '(' || state.originalAlg[i] === '/') {
                                    break;
                                }
                            }
                            if (foundComma && !beforeComma) {
                                topRotation = number;
                            } else {
                                bottomRotation = number;
                            }
                        }
                    }
                }

                const topSvg = document.querySelector(`#${modalId} .visualization-container > div > svg:first-child`);
                const bottomSvg = document.querySelector(`#${modalId} .visualization-container > div > svg:last-child`);

                const maxRotation = Math.max(Math.abs(topRotation), Math.abs(bottomRotation));
                const duration = maxRotation === 0 ? 0 : (maxRotation * 100) / state.animationSpeed;

                if (topSvg && bottomSvg) {
                    const topPieces = topSvg.querySelectorAll('polygon, line.corner-detail');
                    const bottomPieces = bottomSvg.querySelectorAll('polygon, line.corner-detail');

                    const svgSize = state.imageSize;
                    const topCenterX = svgSize / 2;
                    const topCenterY = svgSize / 2;
                    const bottomCenterX = svgSize / 2;
                    const bottomCenterY = svgSize / 2;

                    if (isSlashToken) {
                        const duration = 500 / state.animationSpeed;

                        let beforeHex, afterHex;

                        if (direction === 'next') {
                            const prevStep = state.steps[state.currentStep - 1];
                            beforeHex = prevStep ? getHexForStep(prevStep, false) : getHexForStep(step, false);
                            afterHex = getHexForStep(step, false);
                        } else {
                            beforeHex = getHexForStep(step, false);
                            const nextStep = state.steps[state.currentStep + 1];
                            afterHex = nextStep ? getHexForStep(nextStep, false) : getHexForStep(step, false);
                        }

                        const beforeSvgHtml = renderVisualization(beforeHex, state.colorScheme, state.imageSize);
                        const afterSvgHtml = renderVisualization(afterHex, state.colorScheme, state.imageSize);

                        const visualizationDiv = document.querySelector(`#${modalId} .visualization-container`);

                        const wrapper = document.createElement('div');
                        wrapper.style.position = 'relative';
                        wrapper.style.display = 'flex';
                        wrapper.style.flexDirection = 'column';
                        wrapper.style.alignItems = 'center';
                        wrapper.style.gap = '0px';

                        const bottomLayer = document.createElement('div');
                        const topLayer = document.createElement('div');

                        if (direction === 'next') {
                            bottomLayer.innerHTML = afterSvgHtml;
                            bottomLayer.style.position = 'relative';
                            bottomLayer.style.opacity = '0';

                            topLayer.innerHTML = beforeSvgHtml;
                            topLayer.style.position = 'absolute';
                            topLayer.style.top = '0';
                            topLayer.style.left = '50%';
                            topLayer.style.transform = 'translateX(-50%)';
                            topLayer.style.opacity = '1';
                            topLayer.style.pointerEvents = 'none';

                            applyVerticalDisplayIfEnabled(bottomLayer);
                            applyVerticalDisplayIfEnabled(topLayer);

                            wrapper.appendChild(bottomLayer);
                            wrapper.appendChild(topLayer);

                            visualizationDiv.innerHTML = '';
                            visualizationDiv.appendChild(wrapper);

                            requestAnimationFrame(() => {
                                topLayer.style.transition = `opacity ${duration}ms linear`;
                                bottomLayer.style.transition = `opacity ${duration}ms linear`;
                                requestAnimationFrame(() => {
                                    setTimeout(() => {
                                        topLayer.style.opacity = '0';
                                    }, 0);
                                    bottomLayer.style.opacity = '1';
                                });
                            });
                        } else {
                            bottomLayer.innerHTML = beforeSvgHtml;
                            bottomLayer.style.position = 'relative';
                            bottomLayer.style.opacity = '1';

                            topLayer.innerHTML = afterSvgHtml;
                            topLayer.style.position = 'absolute';
                            topLayer.style.top = '0';
                            topLayer.style.left = '50%';
                            topLayer.style.transform = 'translateX(-50%)';
                            topLayer.style.opacity = '1';
                            topLayer.style.transition = `opacity ${duration}ms linear`;
                            topLayer.style.pointerEvents = 'none';

                            applyVerticalDisplayIfEnabled(bottomLayer);
                            applyVerticalDisplayIfEnabled(topLayer);

                            wrapper.appendChild(bottomLayer);
                            wrapper.appendChild(topLayer);

                            visualizationDiv.innerHTML = '';
                            visualizationDiv.appendChild(wrapper);

                            requestAnimationFrame(() => {
                                topLayer.style.transition = `opacity ${duration}ms linear`;
                                bottomLayer.style.transition = `opacity ${duration}ms linear`;
                                requestAnimationFrame(() => {
                                    setTimeout(() => {
                                        topLayer.style.opacity = '0';
                                    }, 0);
                                    bottomLayer.style.opacity = '1';
                                });
                            });
                        }

                        setTimeout(() => {
                            state.isAnimating = false;
                            render();

                            const currentIsZero = isZeroMove(state.steps[state.currentStep], state.originalAlg, state.animateBothLayers);

                            if (currentIsZero && direction === 'next' && state.currentStep < state.steps.length - 1) {
                                state.currentStep++;
                                setTimeout(() => animateStep('next'), 0);
                            } else if (currentIsZero && direction === 'prev' && state.currentStep > 0) {
                                state.currentStep--;
                                setTimeout(() => animateStep('prev'), 0);
                            } else if (!currentIsZero && state.isAutoRunning) {
                                autoRunNextStep();
                            }
                        }, duration);
                    } else if (shouldRotate) {
                        const duration = maxRotation === 0 ? 50 : (maxRotation * 100) / state.animationSpeed;

                        const rotationMultiplier = direction === 'prev' ? -1 : 1;

                        topPieces.forEach(piece => {
                            piece.style.transformOrigin = `${topCenterX}px ${topCenterY}px`;
                            piece.style.transition = `transform ${duration}ms ease-in-out`;
                            piece.style.transform = `rotate(${topRotation * 30 * rotationMultiplier}deg)`;
                        });

                        bottomPieces.forEach(piece => {
                            piece.style.transformOrigin = `${bottomCenterX}px ${bottomCenterY}px`;
                            piece.style.transition = `transform ${duration}ms ease-in-out`;
                            piece.style.transform = `rotate(${bottomRotation * 30 * rotationMultiplier}deg)`;
                        });

                        setTimeout(() => {
                            topPieces.forEach(piece => {
                                piece.style.transform = '';
                                piece.style.transition = '';
                            });
                            bottomPieces.forEach(piece => {
                                piece.style.transform = '';
                                piece.style.transition = '';
                            });

                            state.isAnimating = false;
                            render();

                            const currentIsZero = isZeroMove(state.steps[state.currentStep], state.originalAlg, state.animateBothLayers);

                            if (currentIsZero && direction === 'next' && state.currentStep < state.steps.length - 1) {
                                state.currentStep++;
                                setTimeout(() => animateStep('next'), 0);
                            } else if (currentIsZero && direction === 'prev' && state.currentStep > 0) {
                                state.currentStep--;
                                setTimeout(() => animateStep('prev'), 0);
                            } else if (state.isAutoRunning) {
                                autoRunNextStep();
                            }
                        }, duration);
                    } else {
                        state.isAnimating = false;
                        render();
                    }
                } else {
                    state.isAnimating = false;
                    render();

                    if (state.isAutoRunning) {
                        autoRunNextStep();
                    }
                }
            }
        }

        // Insert HTML and render initial state
        setTimeout(() => {
            window.modalScrollY = window.scrollY;
            document.body.style.top = `-${window.modalScrollY}px`;
            document.body.classList.add('modal-open');
            render();
        }, 0);

        return html;
    }
    // Export to window
    if (typeof window !== 'undefined') {
        window.Square1AlgorithmViewer = {
            createViewer: createViewer
        };
    }
})();


/* ==== FILE: js/restoftheapp.js ==== */

﻿// Modular preset configuration - add new presets here
window.PRESET_CONFIG = {
    'Default_Preset': 'presets/Default_Preset.json',
    'Matt\'s_Preset': 'presets/Matt\'s_Preset.json'
    // Add more presets here:
    // 'Preset_Name': 'presets/preset_file.json',
};

// Default display names for all 90 cases (used for fresh installs)
const defaultDisplayNames = {
    "8/Star": "8/Star",
    "7-1/Star": "7-1/Star",
    "6-2/Star": "6-2/Star",
    "5-3/Star": "5-3/Star",
    "4-4/Star": "4-4/Star",
    "2-2-2/Paired Edges": "2-2-2/Pair",
    "2-2-2/Parallel Edges": "2-2-2/Line",
    "2-2-2/Perpendicular Edges": "2-2-2/L",
    "3-1-2/Paired Edges": "3-1-2/Pair",
    "3-1-2/Parallel Edges": "3-1-2/Line",
    "3-1-2/Perpendicular Edges": "3-1-2/L",
    "3-2-1/Paired Edges": "3-2-1/Pair",
    "3-2-1/Parallel Edges": "3-2-1/Line",
    "3-2-1/Perpendicular Edges": "3-2-1/L",
    "3-3/Paired Edges": "3-3/Pair",
    "3-3/Parallel Edges": "3-3/Line",
    "3-3/Perpendicular Edges": "3-3/L",
    "4-1-1/Paired Edges": "4-1-1/Pair",
    "4-1-1/Parallel Edges": "4-1-1/Line",
    "4-1-1/Perpendicular Edges": "4-1-1/L",
    "Left 4-2/Paired Edges": "Left 4-2/Pair",
    "Left 4-2/Parallel Edges": "Left 4-2/Line",
    "Left 4-2/Perpendicular Edges": "Left 4-2/L",
    "Right 4-2/Paired Edges": "Right 4-2/Pair",
    "Right 4-2/Parallel Edges": "Right 4-2/Line",
    "Right 4-2/Perpendicular Edges": "Right 4-2/L",
    "Left 5-1/Paired Edges": "Left 5-1/Pair",
    "Left 5-1/Parallel Edges": "Left 5-1/Line",
    "Left 5-1/Perpendicular Edges": "Left 5-1/L",
    "Right 5-1/Paired Edges": "Right 5-1/Pair",
    "Right 5-1/Parallel Edges": "Right 5-1/Line",
    "Right 5-1/Perpendicular Edges": "Right 5-1/L",
    "6/Paired Edges": "6/Pair",
    "6/Parallel Edges": "6/Line",
    "6/Perpendicular Edges": "6/L",
    "Barrel/Barrel": "Barrel/Barrel",
    "Barrel/Square": "Barrel/Square",
    "Barrel/Left Fist": "Barrel/Left Fist",
    "Barrel/Right Fist": "Barrel/Right Fist",
    "Kite/Barrel": "Kite/Barrel",
    "Kite/Kite": "Kite/Kite",
    "Kite/Square": "kite/Square",
    "Kite/Left Fist": "Kite/Left Fist",
    "Kite/Right Fist": "Kite/Right Fist",
    "Muffin/Barrel": "Muffin/Barrel",
    "Muffin/Kite": "Muffin/Kite",
    "Muffin/Muffin": "Muffin/Muffin",
    "Muffin/Square": "Muffin/Square",
    "Muffin/Left Fist": "Muffin/Left Fist",
    "Muffin/Right Fist": "Muffin/Right Fist",
    "Shield/Barrel": "Shield/Barrel",
    "Shield/Kite": "Shield/Kite",
    "Shield/Muffin": "Shield/Muffin",
    "Shield/Shield": "Shield/Shield",
    "Shield/Square": "Shield/Square",
    "Shield/Left Fist": "Shield/Left Fist",
    "Shield/Right Fist": "Shield/Right Fist",
    "Scallop/Barrel": "Scallop/Barrel",
    "Scallop/Kite": "Scallop/Kite",
    "Scallop/Muffin": "Scallop/Muffin",
    "Scallop/Shield": "Scallop/Shield",
    "Scallop/Scallop": "Scallop/Scallop",
    "Scallop/Square": "Scallop/Square",
    "Scallop/Left Fist": "Scallop/Left Fist",
    "Scallop/Right Fist": "Scallop/Right Fist",
    "Scallop/Left Pawn": "Scallop/Left Pawn",
    "Scallop/Right Pawn": "Scallop/Right Pawn",
    "Square/Square": "Square/Square",
    "Left Fist/Square": "Left Fist/Square",
    "Left Fist/Left Fist": "Left Fist/Left Fist",
    "Left Fist/Right Fist": "Left Fist/Right Fist",
    "Right Fist/Square": "Right Fist/Square",
    "Right Fist/Right Fist": "Right Fist/Right Fist",
    "Left Pawn/Barrel": "Left Pawn/Barrel",
    "Left Pawn/Kite": "Left Pawn/Kite",
    "Left Pawn/Muffin": "Left Pawn/Muffin",
    "Left Pawn/Shield": "Left Pawn/Shield",
    "Left Pawn/Square": "Left Pawn/Square",
    "Left Pawn/Left Fist": "Left Pawn/Left Fist",
    "Left Pawn/Right Fist": "Left Pawn/Right Fist",
    "Left Pawn/Left Pawn": "Left Pawn/Left Pawn",
    "Left Pawn/Right Pawn": "Left Pawn/Right Pawn",
    "Right Pawn/Barrel": "Right Pawn/Barrel",
    "Right Pawn/Kite": "Right Pawn/Kite",
    "Right Pawn/Muffin": "Right Pawn/Muffin",
    "Right Pawn/Shield": "Right Pawn/Shield",
    "Right Pawn/Square": "Right Pawn/Square",
    "Right Pawn/Left Fist": "Right Pawn/Left Fist",
    "Right Pawn/Right Fist": "Right Pawn/Right Fist",
    "Right Pawn/Right Pawn": "Right Pawn/Right Pawn",
};

// Display names - THE single source of truth (initialized from defaults or loaded from save)
let displayNames = {};

let filteredData = [...data];
let learnedCases = new Set();
let learningCases = new Set();
let plannedCases = new Set();
let comments = new Map(); // stores {caseName: "comment text"}
let plannedLevels = new Map(); // stores {caseName: 1-6}
let parityOrientations = new Map(); // stores {shapePattern: rotationAmount}
let cornerStickerMode = 'counterclockwise'; // 'counterclockwise' or 'clockwise'
let evilnessFactor = false; // Toggle evilness factor on/off
let evilnessStringReturn = false; // Toggle if string return uses evilness
let evilnessMap = {}; // {caseName: boolean} - true = evil

// Global function to set corner sticker mode
window.setCornerStickerMode = function (mode) {
    cornerStickerMode = mode;
    saveState();
};
let customAlgorithms = new Map(); // stores {caseName: {odd: [...], even: [...]}}
// svgData is now the source of truth, initialized from DEFAULT_SVGS in svg.js
let cachedParityAlgorithms = new Map(); // stores {caseName: {odd: [...], even: [...]}}
let lastParityCalculationSettings = null; // Track settings that affect parity calculation

let perCaseSubtitles = new Map(); // Stores {caseName: "Subtitle"}
let showPaths = true;         // Shape paths always shown
let enablePriorityLearning = true; // Priority learning always enabled
let hideInstructions = false; // Toggle for hiding instruction buttons
let hideParenthesis = false; // Toggle for hiding parenthesis in algorithms
let algorithmFontSize = parseInt(localStorage.getItem('algorithmFontSize')) || 14; // Default 14px, stored in localStorage only
let generalNotes = ''; // HTML content for general notes
let algVariables = new Map();
window.enhancedAccess = localStorage.getItem('enhancedAccess') === 'true'; // Toggle for enhanced access (not exported)
let showHints = localStorage.getItem('showHints') !== null ? localStorage.getItem('showHints') === 'true' : true; // Default to true
let currentSortMode = localStorage.getItem('sortMode') || 'probability';
let needsReorder = false;
let colorScheme = {
    topColor: '#000000',
    bottomColor: '#FFFFFF',
    frontColor: '#CC0000',
    rightColor: '#00AA00',
    backColor: '#FF8C00',
    leftColor: '#0066CC',
    dividerColor: '#7a0000',
    circleColor: 'transparent'
};

let scrambleImageSize = 200; // Default size
let profileName = localStorage.getItem('profileName') || 'Profile';
let profileAvatar = localStorage.getItem('profileAvatar') || 'res/avatar.svg';
let currentPreset = localStorage.getItem('currentPreset') || 'Default_Preset';
let presetData = null; // Will store loaded preset data

// Check if this is first load BEFORE loading state
const isFirstLoad = !localStorage.getItem('sq1-parity-progress');

// If first load, we'll apply default preset after initialization

// Function to calculate and cache parity for all cases
function calculateAndCacheAllParity() {

    if (typeof window.caleTracer === 'undefined') {
        console.warn('Parity analyzer not available, skipping parity calculation');
        return;
    }

    // Store current settings for comparison
    lastParityCalculationSettings = {
        colorScheme: JSON.stringify(colorScheme),
        cornerStickerMode: cornerStickerMode,
        customShapes: localStorage.getItem('customShapesForParityTracerLibrary'),
        customAlgorithms: JSON.stringify(Array.from(customAlgorithms.entries()))
    };

    for (const item of data) {
        const customAlgs = customAlgorithms.get(item.name);
        const oddAlgs = customAlgs && customAlgs.odd ? customAlgs.odd : (item.odd || []);
        const evenAlgs = customAlgs && customAlgs.even ? customAlgs.even : (item.even || []);
        const allAlgorithms = [...oddAlgs, ...evenAlgs];

        let dynamicOddAlgs = [];
        let dynamicEvenAlgs = [];

        for (const alg of allAlgorithms) {
            if (!alg || alg.trim() === '') continue;

            if (alg === 'Done!') {
                dynamicEvenAlgs.push(alg);
                continue;
            }

            try {
                const setup = invertScramble(alg);
                const parityText = window.caleTracer.getParityTextFromScramble(setup, {
                    topColor: colorScheme.topColor,
                    bottomColor: colorScheme.bottomColor,
                    frontColor: colorScheme.frontColor,
                    rightColor: colorScheme.rightColor,
                    backColor: colorScheme.backColor,
                    leftColor: colorScheme.leftColor
                }, cornerStickerMode);

                if (parityText === 'Odd') {
                    dynamicOddAlgs.push(alg);
                } else if (parityText === 'Even') {
                    dynamicEvenAlgs.push(alg);
                }
            } catch (error) {
                console.error('Error testing algorithm:', alg, error);
            }
        }

        cachedParityAlgorithms.set(item.name, {
            odd: dynamicOddAlgs,
            even: dynamicEvenAlgs
        });
    }
}

// Build shape index → caseName lookup (computed once)
function buildShapeIndexToCaseMap() {
    const map = {};
    if (typeof shapeIndexMap === 'undefined') return map;
    for (const [caseName, idxStr] of Object.entries(shapeIndexMap)) {
        const idx = parseInt(idxStr);
        map[idx] = caseName;
        // Also map all org/mir indices for robustness
    }
    // Map org and mir arrays too
    if (typeof shapeIndex !== 'undefined') {
        for (const entry of shapeIndex) {
            const name = entry.name;
            const allIndices = [...(entry.org || []), ...(entry.mir || [])];
            for (const idx of allIndices) {
                if (!map[idx]) map[idx] = name;
            }
        }
    }
    return map;
}

let _shapeIndexToCaseMap = null;
function getShapeIndexToCaseMap() {
    if (!_shapeIndexToCaseMap) _shapeIndexToCaseMap = buildShapeIndexToCaseMap();
    return _shapeIndexToCaseMap;
}

// Get case name from a scramble string using shape index
function getCaseNameFromScramble(scramble) {
    if (!scramble || typeof window.algToShapeIndex === 'undefined') return null;
    try {
        const setup = invertScramble(scramble);
        const result = window.algToShapeIndex(setup);
        const map = getShapeIndexToCaseMap();
        return map[result.shapeIndex] || null;
    } catch (e) {
        return null;
    }
}

// Check if a case is evil
function isCaseEvil(caseName) {
    if (!evilnessFactor) return false;
    return evilnessMap[caseName] === true;
}

// Function to check if parity needs recalculation
function needsParityRecalculation() {
    if (!lastParityCalculationSettings) return true;

    const currentSettings = {
        colorScheme: JSON.stringify(colorScheme),
        cornerStickerMode: cornerStickerMode,
        customShapes: localStorage.getItem('customShapesForParityTracerLibrary'),
        customAlgorithms: JSON.stringify(Array.from(customAlgorithms.entries()))
    };

    return (
        currentSettings.colorScheme !== lastParityCalculationSettings.colorScheme ||
        currentSettings.cornerStickerMode !== lastParityCalculationSettings.cornerStickerMode ||
        currentSettings.customShapes !== lastParityCalculationSettings.customShapes ||
        currentSettings.customAlgorithms !== lastParityCalculationSettings.customAlgorithms
    );
}

// Load evilness settings from localStorage
const storedEvilnessFactor = localStorage.getItem('evilnessFactor');
if (storedEvilnessFactor !== null) evilnessFactor = storedEvilnessFactor === 'true';
const storedEvilnessStringReturn = localStorage.getItem('evilnessStringReturn');
if (storedEvilnessStringReturn !== null) evilnessStringReturn = storedEvilnessStringReturn === 'true';
const storedEvilnessMap = localStorage.getItem('evilnessMap');
if (storedEvilnessMap !== null) evilnessMap = JSON.parse(storedEvilnessMap);

// Load saved state
try {
    const saved = localStorage.getItem('sq1-parity-progress');
    if (saved) {
        const state = JSON.parse(saved);
        learnedCases = new Set(state.learned || []);
        learningCases = new Set(state.learning || []);
        plannedCases = new Set(state.planned || []);
        comments = new Map(Object.entries(state.comments || {}));
        plannedLevels = new Map(Object.entries(state.plannedLevels || {}));
        parityOrientations = new Map(Object.entries(state.parityOrientations || {}));
        showPaths = true; // Always true now
        enablePriorityLearning = true; // Always true now
        hideInstructions = state.hideInstructions || false;
        hideParenthesis = state.hideParenthesis || false;
        colorScheme = state.colorScheme || colorScheme;
        scrambleImageSize = state.scrambleImageSize || 200;
        if (state.customShapesForParityTracerLibrary) {
            localStorage.setItem('customShapesForParityTracerLibrary', state.customShapesForParityTracerLibrary);
        }
        perCaseSubtitles = new Map(Object.entries(state.perCaseSubtitles || {}));
        cornerStickerMode = state.cornerStickerMode || 'counterclockwise';
        customAlgorithms = new Map(Object.entries(state.customAlgorithms || {}));
        generalNotes = state.generalNotes || '';
        algVariables = new Map(Object.entries(state.algVariables || {}));

        // Load display names
        if (state.displayNames) {
            displayNames = state.displayNames;
            // Add any new cases from defaults (for app updates)
            for (const caseName in defaultDisplayNames) {
                if (!displayNames[caseName]) {
                    displayNames[caseName] = defaultDisplayNames[caseName];
                }
            }
        } else {
            // Legacy migration: if no displayNames, initialize from defaults
            displayNames = { ...defaultDisplayNames };
        }

        // Load custom SVG data
        if (state.svgData) {
            window.svgData = state.svgData;
        }

        // Load cached parity calculations
        if (state.cachedParityAlgorithms) {
            cachedParityAlgorithms = new Map(Object.entries(state.cachedParityAlgorithms));
        }
        if (state.lastParityCalculationSettings) {
            lastParityCalculationSettings = state.lastParityCalculationSettings;
        }
    }

    // Load enhancedAccess separately (not part of export/import)
    const enhancedAccessSaved = localStorage.getItem('enhancedAccess');
    if (enhancedAccessSaved !== null) {
        window.enhancedAccess = enhancedAccessSaved === 'true';
    }

    // Initialize all cases as planned with priority 4 (Normal) if not already set
    data.forEach(item => {
        if (!learnedCases.has(item.name) && !learningCases.has(item.name) && !plannedCases.has(item.name)) {
            plannedCases.add(item.name);
            plannedLevels.set(item.name, 4);
        }
        if (!plannedLevels.has(item.name) && plannedCases.has(item.name)) {
            plannedLevels.set(item.name, 4);
        }
    });
    saveState();
} catch (e) {
    console.error('Error loading saved state:', e);
}

// Function to initialize SVG data from defaults if needed
function initializeSVGData() {
    if (!window.svgData) {
        window.svgData = { ...DEFAULT_SVGS };
    }

    // Ensure all 39 SVG keys exist
    const svgKeys = Object.keys(DEFAULT_SVGS);
    svgKeys.forEach(key => {
        if (!window.svgData[key]) {
            window.svgData[key] = DEFAULT_SVGS[key];
        }
    });
}

// Set defaults if this is first load
if (isFirstLoad) {
    showHints = true;
    localStorage.setItem('showHints', 'true');
    showPaths = true;
    enablePriorityLearning = true;

    // Initialize display names from defaults
    displayNames = { ...defaultDisplayNames };

    saveState();
}

function saveState() {
    localStorage.setItem('sortMode', currentSortMode);
    localStorage.setItem('enhancedAccess', window.enhancedAccess.toString());
    localStorage.setItem('currentPreset', currentPreset);
    localStorage.setItem('evilnessFactor', evilnessFactor.toString());
    localStorage.setItem('evilnessStringReturn', evilnessStringReturn.toString());
    localStorage.setItem('evilnessMap', JSON.stringify(evilnessMap));
    try {
        localStorage.setItem('sq1-parity-progress', JSON.stringify({
            learned: Array.from(learnedCases),
            learning: Array.from(learningCases),
            planned: Array.from(plannedCases),
            comments: Object.fromEntries(comments),
            plannedLevels: Object.fromEntries(plannedLevels),
            parityOrientations: Object.fromEntries(parityOrientations),
            showPaths: true,
            enablePriorityLearning: true,
            displayNames: displayNames,
            hideInstructions: hideInstructions,
            hideParenthesis: hideParenthesis,
            colorScheme: colorScheme,
            scrambleImageSize: scrambleImageSize,
            customShapesForParityTracerLibrary: localStorage.getItem('customShapesForParityTracerLibrary'),
            perCaseSubtitles: Object.fromEntries(perCaseSubtitles),
            cornerStickerMode: cornerStickerMode,
            customAlgorithms: Object.fromEntries(customAlgorithms),
            svgData: window.svgData,
            cachedParityAlgorithms: Object.fromEntries(cachedParityAlgorithms),
            lastParityCalculationSettings: lastParityCalculationSettings,
            generalNotes: generalNotes,
            algVariables: Object.fromEntries(algVariables),
            evilnessFactor: evilnessFactor,
            evilnessStringReturn: evilnessStringReturn,
            evilnessMap: evilnessMap,
        }));
    } catch (e) {
        console.error('Error saving state:', e);
    }
}

// Load preset data
async function loadPresetData(presetName) {
    try {
        const presetPath = window.PRESET_CONFIG[presetName];
        if (!presetPath) {
            throw new Error(`Preset "${presetName}" not found in configuration`);
        }
        const response = await fetch(presetPath);
        if (!response.ok) throw new Error('Preset file not found');
        return await response.json();
    } catch (error) {
        console.error('Error loading preset:', error);
        showToast('Error loading preset', 2000, 'error');
        return null;
    }
}

// Get default values from current preset
function getPresetDefaults() {
    if (!presetData) return null;
    return presetData;
}

// Load preset data to use as defaults only (doesn't overwrite user data)
async function loadPresetAsDefaults(presetName) {
    const data = await loadPresetData(presetName);
    if (!data) return false;

    currentPreset = presetName;
    presetData = data;
    localStorage.setItem('currentPreset', currentPreset);

    return true;
}

// Apply preset (overwrites all user data - only used on first load or explicit switch)
window.applyPreset = async function (presetName, skipWarning = false, silent = false) {
    const data = await loadPresetData(presetName);
    if (!data) return;

    // PRESERVE user's learning progress AND personal UI preferences:
    // Learning Progress (DON'T overwrite):
    // - learnedCases, learningCases, plannedCases, plannedLevels
    //
    // Personal UI/UX Preferences (DON'T overwrite):
    // - hideInstructions, hideParenthesis
    // - algorithmFontSize (stored in localStorage)
    // - scrambleImageSize
    // - showHints (stored in localStorage)
    // - enhancedAccess (stored in localStorage)
    // - Training settings (all in localStorage)
    // - Animation settings (all in localStorage)
    // - Parity tracer settings (all in localStorage)

    // Apply preset configuration (algorithms, display names, shapes, etc.)
    if (data.displayNames) {
        displayNames = data.displayNames;
    }

    // Apply comments from preset (they have tutorial links)
    comments = new Map(Object.entries(data.comments || {}));

    // Apply preset color scheme
    colorScheme = data.colorScheme || colorScheme;

    // Apply shape patterns from preset
    if (data.customShapesForParityTracerLibrary) {
        localStorage.setItem('customShapesForParityTracerLibrary', data.customShapesForParityTracerLibrary);
        const verified = localStorage.getItem('customShapesForParityTracerLibrary');
    }

    // Apply preset subtitle configurations
    perCaseSubtitles = new Map(Object.entries(data.perCaseSubtitles || {}));

    // Apply preset corner sticker mode
    cornerStickerMode = data.cornerStickerMode || 'counterclockwise';

    // Apply preset algorithms
    customAlgorithms = new Map(Object.entries(data.customAlgorithms || {}));

    // Apply preset SVG data
    if (data.svgData) {
        window.svgData = data.svgData;
    }

    // Apply preset evilness settings
    if (data.evilnessMap !== undefined) evilnessMap = data.evilnessMap;
    if (data.evilnessFactor !== undefined) evilnessFactor = data.evilnessFactor;
    if (data.evilnessStringReturn !== undefined) evilnessStringReturn = data.evilnessStringReturn;

    // Apply preset parity orientations
    parityOrientations = new Map(Object.entries(data.parityOrientations || {}));

    // Apply preset general notes
    generalNotes = data.generalNotes || '';

    // Note: We explicitly DON'T apply these from preset - they're personal preferences:
    // - hideInstructions (keep user's preference)
    // - hideParenthesis (keep user's preference)
    // - algorithmFontSize (keep user's preference from localStorage)
    // - scrambleImageSize (keep user's preference)
    // - showHints (keep user's preference from localStorage)
    // - enhancedAccess (keep user's preference from localStorage)

    currentPreset = presetName;
    presetData = data;

    // Force invalidate parity cache to trigger recalculation with new settings
    lastParityCalculationSettings = null;

    saveState();
    updateProgress();

    // Recalculate parity with new settings
    if (needsParityRecalculation()) {
        calculateAndCacheAllParity();
    }

    render();

    // Force reload shape patterns in parity tracer library
    if (data.customShapesForParityTracerLibrary && typeof window.ParityTracerLibrary !== 'undefined') {
        try {
            // Force reload from localStorage after we've saved it
            setTimeout(() => {
                if (window.ParityTracerLibrary.reloadShapesFromStorage) {
                    window.ParityTracerLibrary.reloadShapesFromStorage();
                }
            }, 100);

            // Also invalidate any cached parity calculations
            setTimeout(() => {
                if (window.ParityTracerLibrary.reloadShapesFromStorage) {
                    window.ParityTracerLibrary.reloadShapesFromStorage();
                }
            }, 300);
        } catch (e) {
            console.error('❌ Error reloading shapes in parity tracer:', e);
        }
    }

    if (!skipWarning && !silent) {
        showToast(`Preset "${presetName}" applied successfully!`, 3000, 'success');
    }
}

// Initialize preset on load (just loads as defaults, doesn't overwrite user data)
window.initializePreset = async function () {
    const savedPreset = localStorage.getItem('currentPreset') || 'Default_Preset';
    const success = await loadPresetAsDefaults(savedPreset);
    if (!success) {
        // Fallback to default if saved preset doesn't exist
        await loadPresetAsDefaults('Default_Preset');
    }
}

window.exportData = function() {
    const state = {
        learned: Array.from(learnedCases),
        learning: Array.from(learningCases),
        planned: Array.from(plannedCases),
        comments: Object.fromEntries(comments),
        plannedLevels: Object.fromEntries(plannedLevels),
        parityOrientations: Object.fromEntries(parityOrientations),
        showPaths: true,
        displayNames: displayNames,
        showHints: showHints,
        hideInstructions: hideInstructions,
        colorScheme: colorScheme,
        scrambleImageSize: scrambleImageSize,
        customShapesForParityTracerLibrary: localStorage.getItem('customShapesForParityTracerLibrary'),
        perCaseSubtitles: Object.fromEntries(perCaseSubtitles),
        cachedParityAlgorithms: Object.fromEntries(cachedParityAlgorithms),
        lastParityCalculationSettings: lastParityCalculationSettings,
        cornerStickerMode: cornerStickerMode,
        customAlgorithms: Object.fromEntries(customAlgorithms),
        svgData: window.svgData,
        generalNotes: generalNotes,
        algVariables: Object.fromEntries(algVariables),
        evilnessFactor: evilnessFactor,
        evilnessStringReturn: evilnessStringReturn,
        evilnessMap: evilnessMap,
        parityTracerImageSize: localStorage.getItem('parityTracerImageSize'),
        parityTracerShowArrow: localStorage.getItem('parityTracerShowArrow'),
        parityTracerArrowSettings: localStorage.getItem('parityTracerArrowSettings'),
        trainingScrambleImageSize: localStorage.getItem('trainingScrambleImageSize'),
        trainingScrambleTextSize: localStorage.getItem('trainingScrambleTextSize'),
        trainingHoldToStart: localStorage.getItem('trainingHoldToStart'),
        trainingTimerSize: localStorage.getItem('trainingTimerSize'),
        trainingShowPrevScramble: localStorage.getItem('trainingShowPrevScramble'),
        profileName: profileName,
        profileAvatar: profileAvatar,
    };
    // Let training-selector.js add its data
    if (typeof window.selectorExportHook === 'function') window.selectorExportHook(state);
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'squango-CSP.json';
    link.click();
    URL.revokeObjectURL(url);
}

function importData(jsonStr) {
    try {
        const state = JSON.parse(jsonStr);

        // Force reload shape patterns from imported data FIRST
        if (state.customShapesForParityTracerLibrary) {
            localStorage.setItem('customShapesForParityTracerLibrary', state.customShapesForParityTracerLibrary);
            // Force the parity tracer library to reload shapes immediately
            if (typeof window.ParityTracerLibrary !== 'undefined') {
                setTimeout(() => {
                    if (window.ParityTracerLibrary.reloadShapesFromStorage) {
                        window.ParityTracerLibrary.reloadShapesFromStorage();
                    }
                }, 100);
            }
        }
        learnedCases = new Set(state.learned || []);
        learningCases = new Set(state.learning || []);
        plannedCases = new Set(state.planned || []);
        comments = new Map(Object.entries(state.comments || {}));
        plannedLevels = new Map(Object.entries(state.plannedLevels || {}));
        parityOrientations = new Map(Object.entries(state.parityOrientations || {}));
        showPaths = true;

        // Load display names
        if (state.displayNames) {
            displayNames = state.displayNames;
            // Add any new cases from defaults (for app updates)
            for (const caseName in defaultDisplayNames) {
                if (!displayNames[caseName]) {
                    displayNames[caseName] = defaultDisplayNames[caseName];
                }
            }
        } else {
            displayNames = { ...defaultDisplayNames };
        }
        hideInstructions = state.hideInstructions || false;
        hideParenthesis = false;
        colorScheme = state.colorScheme || colorScheme;
        if (state.customShapesForParityTracerLibrary) {
            localStorage.setItem('customShapesForParityTracerLibrary', state.customShapesForParityTracerLibrary);
        }
        perCaseSubtitles = new Map(Object.entries(state.perCaseSubtitles || {}));
        cornerStickerMode = state.cornerStickerMode || 'counterclockwise';
        customAlgorithms = new Map(Object.entries(state.customAlgorithms || {}));
        generalNotes = state.generalNotes || '';
        algVariables = new Map(Object.entries(state.algVariables || {}));

        // Load evilness settings
        if (state.evilnessFactor !== undefined) evilnessFactor = state.evilnessFactor;
        if (state.evilnessStringReturn !== undefined) evilnessStringReturn = state.evilnessStringReturn;
        if (state.evilnessMap !== undefined) evilnessMap = state.evilnessMap;

        // Load custom SVG data
        if (state.svgData) {
            window.svgData = state.svgData;
        }

        // Load cached parity calculations
        if (state.cachedParityAlgorithms) {
            cachedParityAlgorithms = new Map(Object.entries(state.cachedParityAlgorithms));
        }
        if (state.lastParityCalculationSettings) {
            lastParityCalculationSettings = state.lastParityCalculationSettings;
        }

        generalNotes = state.generalNotes || '';
        algVariables = new Map(Object.entries(state.algVariables || {}));
        
        // Import evilness settings
        if (state.evilnessFactor !== undefined) evilnessFactor = state.evilnessFactor;
        if (state.evilnessStringReturn !== undefined) evilnessStringReturn = state.evilnessStringReturn;
        if (state.evilnessMap !== undefined) evilnessMap = state.evilnessMap;

        // Import selector selections
        if (typeof window.selectorImportHook === 'function') window.selectorImportHook(state);

        // Force invalidate parity calculation cache to trigger recalculation
        lastParityCalculationSettings = null;

        if (state.showHints !== undefined) {
            showHints = state.showHints;
            localStorage.setItem('showHints', showHints);
            applyHintVisibility();
        }
        if (state.customShapesForParityTracerLibrary) {
            localStorage.setItem('customShapesForParityTracerLibrary', state.customShapesForParityTracerLibrary);
        }
        if (state.parityTracerImageSize) {
            localStorage.setItem('parityTracerImageSize', state.parityTracerImageSize);
        }
        if (state.parityTracerShowArrow !== undefined) {
            localStorage.setItem('parityTracerShowArrow', state.parityTracerShowArrow);
        }
        if (state.parityTracerArrowSettings) {
            localStorage.setItem('parityTracerArrowSettings', state.parityTracerArrowSettings);
        }
        if (state.trainingScrambleImageSize) {
            localStorage.setItem('trainingScrambleImageSize', state.trainingScrambleImageSize);
        }
        if (state.trainingScrambleTextSize) {
            localStorage.setItem('trainingScrambleTextSize', state.trainingScrambleTextSize);
        }
        if (state.trainingHoldToStart) {
            localStorage.setItem('trainingHoldToStart', state.trainingHoldToStart);
        }
        if (state.profileName) {
            profileName = state.profileName;
            localStorage.setItem('profileName', profileName);
        }
        if (state.profileAvatar) {
            profileAvatar = state.profileAvatar;
            localStorage.setItem('profileAvatar', profileAvatar);
        }
        if (state.trainingTimerSize) {
            localStorage.setItem('trainingTimerSize', state.trainingTimerSize);
        }
        if (state.trainingShowPrevScramble !== undefined) {
            localStorage.setItem('trainingShowPrevScramble', state.trainingShowPrevScramble);
        }
        saveState();
        updateProgress();

        // Force recalculate all parity with new settings
        if (needsParityRecalculation()) {
            calculateAndCacheAllParity();
        }

        render();
        showToast('Data imported successfully!', 3000, 'success');
    } catch (e) {
        showToast('Error importing data: ' + e.message, 3000, 'error');
    }
}

function handleFileImport(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        importData(e.target.result);
        // Reset the file input so the same file can be imported again
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.value = '';
        }
    };
    reader.readAsText(file);
}

// DOM element references - will be initialized after DOM is ready
let searchInput = null;
let sortSelect = null;
let learnFilterSelect = null;
let grid = null;

// Initialize DOM references
function initializeDOMReferences() {
    searchInput = document.getElementById('search');
    sortSelect = document.getElementById('sort');
    learnFilterSelect = document.getElementById('learnFilter');
    grid = document.getElementById('grid');
}

// Dynamic SVG scaling based on viewport width
function updateSVGScaling() {
    // No longer needed - CSS handles scaling with aspect-ratio
}

// Debounced resize handler for better performance
function handleResize() {
    // Reserved for future resize logic if needed
}

// Update on load and resize
window.addEventListener('load', updateSVGScaling);
window.addEventListener('resize', handleResize);

// Also call after rendering cards
const originalRender = window.render;
if (typeof originalRender === 'function') {
    window.render = function () {
        originalRender();
        setTimeout(updateSVGScaling, 10);
    };
}

// Initialize preset system when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize preset on app load
    await initializePreset();

    // Apply default preset silently on first load
    if (isFirstLoad) {
        await applyPreset('Default_Preset', true, true);
    }

    // Apply algorithm font size
    if (typeof applyAlgorithmFontSize === 'function') {
        applyAlgorithmFontSize();
    }
});

window.openAnimateAlgModal = function (algorithm = '', caseName = '', computedParity = '') {
    if (typeof window.Square1AlgorithmViewer === 'undefined') {
        showToast('Algorithm viewer library not loaded', 2000, 'error');
        return;
    }

    const alg = algorithm || '(0,0)';

    // Compute parity if not provided
    let parity = computedParity;
    if (!parity && algorithm && algorithm !== 'Done!') {
        try {
            const setup = invertScramble(algorithm);
            const parityText = window.caleTracer.getParityTextFromScramble(setup, {
                topColor: colorScheme.topColor,
                bottomColor: colorScheme.bottomColor,
                frontColor: colorScheme.frontColor,
                rightColor: colorScheme.rightColor,
                backColor: colorScheme.backColor,
                leftColor: colorScheme.leftColor
            }, cornerStickerMode);
            parity = parityText.toLowerCase();
        } catch (error) {
            parity = '';
        }
    }

    const html = window.Square1AlgorithmViewer.createViewer(alg, {
        topColor: colorScheme.topColor,
        bottomColor: colorScheme.bottomColor,
        frontColor: colorScheme.frontColor,
        rightColor: colorScheme.rightColor,
        backColor: colorScheme.backColor,
        leftColor: colorScheme.leftColor
    }, caseName, parity);

    document.body.insertAdjacentHTML('beforeend', html);
};

// Apply VW-based sizing to topbar on mobile
function applyTopbarVWScaling() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;

    if (window.innerWidth <= 480) {
        topbar.classList.add('topbar-vw-mode');
    } else {
        topbar.classList.remove('topbar-vw-mode');
    }
}

window.addEventListener('resize', applyTopbarVWScaling);
document.addEventListener('DOMContentLoaded', applyTopbarVWScaling);

/* ==== FILE: js/tools/shapeTracer.js ==== */

// ========================================
// Square-1 Shape Path Tracer Library
// With  funny names to avoid conflicts!
// Traces the shape journey through every slash!
// ========================================

// EDGE_PIECES, CORNER_PARTNER, getSolvedState, rotateLayer, doSlice → defined in utils.js

// cornerID map (shapeTracer-specific — not duplicated elsewhere)
const CORNER_ID = {
  A: 'AB', B: 'AB', D: 'DE', E: 'DE', G: 'GH', H: 'GH', J: 'JK', K: 'JK',
  N: 'NO', O: 'NO', Q: 'QR', R: 'QR', T: 'TU', U: 'TU', W: 'WX', X: 'WX'
};

// Default shape patterns
const defaultShapePatternsForTracing = {
  'ECECECEC': 'Sq',
  'EECECCEC': 'Kite',
  'EECCEECC': 'Barr',
  'EECCECEC': 'L Fist',
  'EECECECC': 'R Fist',
  'EECEECCC': 'Shld',
  'EEECCECC': 'Muff',
  'EEECECCC': 'L Pawn',
  'ECEEECCC': 'R Pawn',
  'EEEECCCC': 'Scal',
  'EECCCCC': 'Pair',
  'ECECCCC': 'L',
  'ECCCECC': 'Line',
  'EEEEEECCC': '6',
  'ECEEEEECC': 'R 51',
  'EEEEECECC': 'L 51',
  'EECEEEECC': 'R 42',
  'EEEECEECC': 'L 42',
  'EEEECECEC': '411',
  'EEECEEECC': '33',
  'ECEECEEEC': '312',
  'ECEEECEEC': '321',
  'EECEECEEC': '222',
  'EEEEEEEECC': '8',
  'EEEEEECEEC': '62',
  'EEEECEEEEC': '44',
  'EEEEEEECEC': '71',
  'EEEEECEEEC': '53',
  'CCCCCC': 'Star'
};

function rotateStringForPatternSearch(str, rotAmount) {
  const len = str.length;
  const n = ((rotAmount % len) + len) % len;
  return str.slice(n) + str.slice(0, n);
}

// === SCRAMBLE STANDARDIZATION ===
function StandardizeThisScramble(scrambleString) {
  if (!scrambleString) return '';
  let str = scrambleString.trim();
  if (str.startsWith('/')) str = '(0,0)' + str;
  if (str.endsWith('/'))   str = str + '(0,0)';
  return str;
}

// === BUILD UNITS FROM CUBE STATE ===
function buildUnitsFromCubeStateForShapeTracing(cubeState, startIdx) {
  const units = [];
  let i = 0;

  while (i < 12) {
    const piece = cubeState[startIdx + i];
    if (EDGE_PIECES.has(piece)) {
      units.push({ type: 'E', edge: piece });
      i += 1;
      continue;
    }

    const nextPiece = cubeState[startIdx + ((i + 1) % 12)];
    if (CORNER_PARTNER[piece] === nextPiece) {
      units.push({ type: 'C', pair: CORNER_ID[piece], rep: piece });
      i += 2;
    } else {
      units.push({ type: 'C', pair: CORNER_ID[piece] || '??', rep: piece });
      i += 1;
    }
  }

  const types = units.map(u => u.type).join('');
  return { types, units };
}

// === PATTERN MATCHING ===
function matchThisPatternToFindTheShapeName(typeStr, shapePatterns) {
  for (const [pattern, name] of Object.entries(shapePatterns)) {
    if (pattern.length !== typeStr.length) continue;
    for (let rotation = 0; rotation < typeStr.length; rotation++) {
      if (rotateStringForPatternSearch(typeStr, rotation) === pattern) {
        return name;
      }
    }
  }
  return 'Unknown';
}

// === SHAPE PATH TRACING ===
function traceTheShapePathThroughThisScramble(scrambleString, shapePatterns) {
  const shapePath = [];
  const cubeState = getSolvedState();

  let currentStep = null;

  // Apply moves and capture shapes after each slash
  for (const token of parseScramble(scrambleString)) {
    if (token.type === 'turn') {
      // Apply rotations
      rotateLayer(cubeState, 0, 12, token.top);
      rotateLayer(cubeState, 12, 12, token.bottom);

      // If this turn has a slash, capture the state BEFORE the slash
      if (token.hasSlash) {
        const topUnits = buildUnitsFromCubeStateForShapeTracing(cubeState, 0);
        const bottomUnits = buildUnitsFromCubeStateForShapeTracing(cubeState, 12);
        const topShape = matchThisPatternToFindTheShapeName(topUnits.types, shapePatterns);
        const bottomShape = matchThisPatternToFindTheShapeName(bottomUnits.types, shapePatterns);

        currentStep = {
          topShape: topShape,
          bottomShape: bottomShape,
          topPattern: topUnits.types,
          bottomPattern: bottomUnits.types
        };

        shapePath.push(currentStep);

        // Now do the slash
        doSlice(cubeState);
      }
    } else {
      // Standalone slash
      doSlice(cubeState);
    }
  }

  // Add the final state after all moves
  const finalTopUnits = buildUnitsFromCubeStateForShapeTracing(cubeState, 0);
  const finalBottomUnits = buildUnitsFromCubeStateForShapeTracing(cubeState, 12);
  const finalTopShape = matchThisPatternToFindTheShapeName(finalTopUnits.types, shapePatterns);
  const finalBottomShape = matchThisPatternToFindTheShapeName(finalBottomUnits.types, shapePatterns);

  shapePath.push({
    topShape: finalTopShape,
    bottomShape: finalBottomShape,
    topPattern: finalTopUnits.types,
    bottomPattern: finalBottomUnits.types
  });

  return shapePath;
}

// === FORMAT SHAPE PATH ===
function formatShapePathAsString(shapePath) {
  return shapePath.map(step => `${step.topShape}/${step.bottomShape}`).join(' → ');
}

// ========================================
// === THE FOUR MAGICAL FUNCTIONS!!! ===
// ========================================

/**
 * Option 1: Scramble input → Scramble shape path output
 */
function traceScrambleToScrambleShapePath(scramble, options = {}) {
  const shapePatterns = options.shapePatterns || { ...defaultShapePatternsForTracing };

  // Standardize
  const standardized = StandardizeThisScramble(scramble);

  // Trace
  const shapePath = traceTheShapePathThroughThisScramble(standardized, shapePatterns);

  // Format as string
  return formatShapePathAsString(shapePath);
}

/**
 * Option 2: Scramble input → Solution shape path output (reversed)
 */
function traceScrambleToSolutionShapePath(scramble, options = {}) {
  const shapePatterns = options.shapePatterns || { ...defaultShapePatternsForTracing };

  // Standardize
  const standardized = StandardizeThisScramble(scramble);

  // Trace
  const shapePath = traceTheShapePathThroughThisScramble(standardized, shapePatterns);

  // Reverse the path for solution
  const reversedPath = shapePath.slice().reverse();

  // Format as string
  return formatShapePathAsString(reversedPath);
}

/**
 * Option 3: Solution input → Scramble shape path output (invert then trace)
 */
function traceSolutionToScrambleShapePath(solution, options = {}) {
  const shapePatterns = options.shapePatterns || { ...defaultShapePatternsForTracing };

  // Invert solution to scramble
  const invertedScramble = invertScramble(solution);

  // Standardize
  const standardized = StandardizeThisScramble(invertedScramble);

  // Trace
  const shapePath = traceTheShapePathThroughThisScramble(standardized, shapePatterns);

  // Format as string
  return formatShapePathAsString(shapePath);
}

/**
 * Option 4: Solution input → Solution shape path output (invert, trace, reverse)
 */
function traceSolutionToSolutionShapePath(solution, options = {}) {
  const shapePatterns = options.shapePatterns || { ...defaultShapePatternsForTracing };

  // Invert solution to scramble
  const invertedScramble = invertScramble(solution);

  // Standardize
  const standardized = StandardizeThisScramble(invertedScramble);

  // Trace
  const shapePath = traceTheShapePathThroughThisScramble(standardized, shapePatterns);

  // Reverse the path for solution
  const reversedPath = shapePath.slice().reverse();

  // Format as string
  return formatShapePathAsString(reversedPath);
}

// ========================================
// === EXPORT FOR USE ===
// ========================================

// For direct browser usage, attach to window
if (typeof window !== 'undefined') {
  window.Square1ShapePathTracerLibraryWithSillyNames = {
    traceScrambleToScrambleShapePath,
    traceScrambleToSolutionShapePath,
    traceSolutionToScrambleShapePath,
    traceSolutionToSolutionShapePath,
    // Expose default shape patterns for reference
    defaultShapePatternsForTracing: defaultShapePatternsForTracing
  };
}

/* ==== FILE: js/rendering.js ==== */

﻿// Helper function to sanitize note HTML (allow various text formatting tags)
function sanitizeNoteHTML(html) {
    if (!html) return '';

    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Function to recursively process nodes
    function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();

            if (tagName === 'b' || tagName === 'strong') {
                return `<b>${Array.from(node.childNodes).map(processNode).join('')}</b>`;
            }

            if (tagName === 'u') {
                return `<u>${Array.from(node.childNodes).map(processNode).join('')}</u>`;
            }

            if (tagName === 'i' || tagName === 'em') {
                return `<i>${Array.from(node.childNodes).map(processNode).join('')}</i>`;
            }

            if (tagName === 's' || tagName === 'strike' || tagName === 'del') {
                return `<s>${Array.from(node.childNodes).map(processNode).join('')}</s>`;
            }

            if (tagName === 'sub') {
                return `<sub>${Array.from(node.childNodes).map(processNode).join('')}</sub>`;
            }

            if (tagName === 'sup') {
                return `<sup>${Array.from(node.childNodes).map(processNode).join('')}</sup>`;
            }

            if (tagName === 'big') {
                return `<big>${Array.from(node.childNodes).map(processNode).join('')}</big>`;
            }

            if (tagName === 'small') {
                return `<small>${Array.from(node.childNodes).map(processNode).join('')}</small>`;
            }

            if (tagName === 'font') {
                const color = node.getAttribute('color') || '';
                // Sanitize color to prevent malicious values
                const safeColor = color.match(/^(#[0-9A-Fa-f]{3,6}|[a-zA-Z]+)$/) ? color : '';
                if (safeColor) {
                    return `<font color="${safeColor}">${Array.from(node.childNodes).map(processNode).join('')}</font>`;
                }
                return Array.from(node.childNodes).map(processNode).join('');
            }

            if (tagName === 'span') {
                const style = node.getAttribute('style') || '';
                // Only allow color in style
                const colorMatch = style.match(/color:\s*([#a-zA-Z0-9]+)/);
                if (colorMatch) {
                    const safeColor = colorMatch[1].match(/^(#[0-9A-Fa-f]{3,6}|[a-zA-Z]+)$/) ? colorMatch[1] : '';
                    if (safeColor) {
                        return `<span style="color: ${safeColor}">${Array.from(node.childNodes).map(processNode).join('')}</span>`;
                    }
                }
                return Array.from(node.childNodes).map(processNode).join('');
            }

            if (tagName === 'a') {
                const href = node.getAttribute('href') || '';
                // Sanitize href to prevent javascript: URLs
                const safeHref = href.startsWith('javascript:') ? '' : href;
                return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${Array.from(node.childNodes).map(processNode).join('')}</a>`;
            }

            if (tagName === 'br') {
                return '<br>';
            }

            // For any other tags, just return the text content
            return Array.from(node.childNodes).map(processNode).join('');
        }

        return '';
    }

    return Array.from(temp.childNodes).map(processNode).join('');
}

// Helper function to strip parenthesis if hideParenthesis is enabled
function stripParenthesisIfNeeded(alg) {
    if (!alg || typeof alg !== 'string') return alg;
    if (hideParenthesis) {
        return alg.replace(/\(/g, ' ').replace(/\)/g, ' ');
    }
    return alg;
}

// Helper function to wrap algorithm tokens to prevent breaking inside parentheses
function wrapAlgorithmTokens(alg) {
    if (!alg || typeof alg !== 'string') return alg;

    // Strip parenthesis first if needed
    alg = stripParenthesisIfNeeded(alg);

    // If parenthesis are hidden, wrap the number,number patterns
    if (hideParenthesis) {
        return alg.replace(/([-]?\d+,[-]?\d+)/g, '<span style="white-space: nowrap;">$1</span>');
    }

    // Replace (number,number) patterns with non-breaking spans
    // This regex captures patterns like (0,3), (-1,2), etc.
    return alg.replace(/(\([^)]+\))/g, '<span style="white-space: nowrap;">$1</span>');
}

// Helper function to style algorithm with gray setup/finish moves
function styleAlgorithmWithGrayMoves(alg) {
    if (!alg || typeof alg !== 'string' || alg === 'Done!') return alg;

    const parts = alg.split('/');

    // If only one part or empty, return as is
    if (parts.length <= 1) {
        return wrapAlgorithmTokens(alg);
    }

    // Check if starts with slash (first part empty)
    const startsWithSlash = parts[0].trim() === '';
    // Check if ends with slash (last part empty)
    const endsWithSlash = parts[parts.length - 1].trim() === '';

    let styledParts = parts.map((part, idx) => {
        // Skip styling for empty parts (from leading/trailing slashes)
        if (part.trim() === '') return part;

        // First non-empty part (setup) - blue
        if (idx === 0 && !startsWithSlash) {
            return `<span style="color: var(--alg-setup-color);">${wrapAlgorithmTokens(part)}</span>`;
        }
        // Last non-empty part (finish) - light gray
        else if (idx === parts.length - 1 && !endsWithSlash) {
            return `<span style="color: var(--text-muted);">${wrapAlgorithmTokens(part)}</span>`;
        }
        // Middle parts - normal color
        else {
            return wrapAlgorithmTokens(part);
        }
    });

    return styledParts.join('/');
}

/*
╔═══════════════════════════════════════════════════════════════════════════╗
║                                NAME DISPLAY                                ║
╚═══════════════════════════════════════════════════════════════════════════╝
*/

/**
 * Gets the display name for a case.
 * Single source of truth - displayNames object.
 */
function getDisplayName(caseName) {
    return displayNames[caseName] || caseName;
}

/*
╔════════════════════════════════════════════════════════════════════════════╗
║                             ALGORITHM DISPLAY                              ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

// invertScramble → defined in utils.js

function getAlgDisplayMeta(alg, caseName) {
    if (!alg || alg === 'Done!' || typeof window.algToShapeIndex === 'undefined') {
        return { invalid: false, mirrored: false };
    }
    try {
        const canonicalIdxStr = shapeIndexMap[caseName];
        if (canonicalIdxStr === undefined) return { invalid: false, mirrored: false };
        const canonicalIdx = parseInt(canonicalIdxStr);

        const caseShapeData = (() => {
            for (const sd of shapeIndex) {
                if (sd.org && sd.org.includes(canonicalIdx)) return sd;
            }
            return null;
        })();

        const result = window.algToShapeIndex(alg);
        const idx = result.shapeIndex;

        const isDirectMatch = idx === canonicalIdx;
        const isInOrg = caseShapeData && caseShapeData.org && caseShapeData.org.includes(idx);
        const isInMir = caseShapeData && caseShapeData.mir && caseShapeData.mir.includes(idx);

        if (isDirectMatch || isInOrg) return { invalid: false, mirrored: false };
        if (isInMir) return { invalid: false, mirrored: true };
        return { invalid: true, mirrored: false };
    } catch(e) {
        return { invalid: true, mirrored: false };
    }
}

function getShapePath(scramble) {
    if (!scramble || scramble.trim() === '' || scramble === 'Done!') {
        return null;
    }

    try {
        if (typeof window.Square1ShapePathTracerLibraryWithSillyNames !== 'undefined') {
            const shapePathString = window.Square1ShapePathTracerLibraryWithSillyNames.traceSolutionToSolutionShapePath(scramble);
            if (shapePathString) {
                // Parse the shape path string "Sq/Sq → 4-2/4-2 → Sq/Sq" into array format
                const steps = shapePathString.split(' → ').map(s => s.trim());
                return steps.map(step => {
                    const [top, bottom] = step.split('/').map(s => s.trim());
                    return { top, bottom };
                });
            }
        }
    } catch (err) {
        console.error('Error generating shape path:', err);
    }

    return null;
}

function renderAlgorithmWithPopup(algArray, caseName, parityType, fontFamily) {
    const fontStyle = fontFamily ? `font-family: ${fontFamily};` : '';
    return algArray.map((alg, idx) => {
        const algId = `alg-${caseName.replace(/[^a-zA-Z0-9]/g, '_')}-${parityType}-${idx}`;
        const meta = getAlgDisplayMeta(alg, caseName);
        const prefix = meta.mirrored ? '<span style="color: var(--z2-prefix-color); margin-right:4px; display:inline; vertical-align:baseline; white-space:nowrap;"><big style="font-size:1em;">&lt;</big><small>z2</small><big style="font-size:1em;">&gt;</big></span>' : '';
        const colorStyle = meta.invalid ? 'color: var(--alg-invalid-color);' : '';
        const wrapStyle = meta.invalid
            ? 'display: flex; align-items: baseline; flex-wrap: wrap; opacity: 0.18;'
            : 'display: flex; align-items: baseline; flex-wrap: wrap;';
        return `<div class="alg-line alg-interactive"
                     id="${algId}"
                     data-alg="${alg.replace(/"/g, '&quot;')}"
                     data-case="${caseName.replace(/"/g, '&quot;')}"
                     data-parity="${parityType}"
                     onmouseenter="showAlgPopup(this, '${alg.replace(/'/g, "\\'")}', false)"
                     onmouseleave="hideAlgPopup(false)"
                     onclick="event.stopPropagation(); showAlgPopup(this, '${alg.replace(/'/g, "\\'")}', true)"
                     style="${wrapStyle} ${colorStyle} ${fontStyle}">${prefix}${styleAlgorithmWithGrayMoves(alg)}</div>`;
    }).join('');
}

let activePopup = null;
let activePopupElement = null;
let popupHoverTimeout = null;

window.showAlgPopup = function(element, alg, isPermanent) {
    // Clear any pending hide timeout
    if (popupHoverTimeout) {
        clearTimeout(popupHoverTimeout);
        popupHoverTimeout = null;
    }

    // If clicking on already active popup element, close it
    if (isPermanent && activePopupElement === element) {
        window.hideAlgPopup(true);
        return;
    }

    // Close any existing popup if opening a new permanent one
    if (isPermanent && activePopup) {
        activePopup.remove();
        activePopup = null;
        activePopupElement = null;
    }

    // Don't show hover popup if there's already a permanent popup
    if (!isPermanent && activePopup && activePopupElement !== element) {
        return;
    }

    // Remove any existing non-permanent popup
    if (!isPermanent) {
        const existingHover = document.querySelector('.alg-popup:not(.permanent)');
        if (existingHover) existingHover.remove();
    }

    if (alg === 'Done!' || !alg || alg.trim() === '') return;

    const setup = invertScramble(alg);
    const shapePath = getShapePath(alg);

    const popup = document.createElement('div');
    popup.className = 'alg-popup' + (isPermanent ? ' permanent' : '');
    popup.dataset.isPermanent = isPermanent;

    const setupId = 'popup-setup-' + Math.random().toString(36).substr(2, 9);

    const popupFontFamily = hideParenthesis ? 'Arial, sans-serif' : 'monospace';
    const displaySetup = stripParenthesisIfNeeded(setup);
    popup.innerHTML = `
        <div class="popup-label">Setup:</div>
        <div id="${setupId}" class="popup-setup" style="font-family: ${popupFontFamily}; font-size: 0.8rem; margin-bottom: 8px;" title="Click to analyze parity">${displaySetup}</div>
        ${shapePath ? `
            <div class="popup-label">Shape Path:</div>
            <div id="${setupId}_shapepath" style="font-size: 0.75rem; line-height: 1.6; cursor: pointer; padding: 4px; border-radius: 3px; transition: background 0.15s;" title="Click to animate algorithm">
                ${shapePath.map((step, idx) => {
        const arrow = idx < shapePath.length - 1 ? ' → ' : '';
        return `<span class="popup-step-span">${step.top}/${step.bottom}</span>${arrow}`;
    }).join('')}
            </div>
        ` : ''}
    `;

    document.body.appendChild(popup);

    // Add click handler to setup to open parity analysis
    const setupElement = document.getElementById(setupId);
    if (setupElement) {
        setupElement.onclick = (e) => {
            e.stopPropagation();
            window.hideAlgPopup(isPermanent);
            openNewParityAnalysis(setup);
        };
        setupElement.onmouseenter = () => {
            setupElement.style.background = 'var(--hover-bg)';
        };
        setupElement.onmouseleave = () => {
            setupElement.style.background = 'var(--surface2)';
        };
    }

    // Add click handler to shape path to open animate modal
    const shapePathElement = document.getElementById(setupId + '_shapepath');
    if (shapePathElement) {
        shapePathElement.onclick = (e) => {
            e.stopPropagation();
            window.hideAlgPopup(isPermanent);

            // Get case name and parity from the element
            const caseName = element.getAttribute('data-case') || '';
            const parityType = element.getAttribute('data-parity') || '';
            const displayName = getDisplayName(caseName);

            openAnimateAlgModal(alg, displayName, parityType);
        };
        shapePathElement.onmouseenter = () => {
            shapePathElement.style.background = 'var(--hover-bg)';
        };
        shapePathElement.onmouseleave = () => {
            shapePathElement.style.background = 'transparent';
        };
    }

    // Position popup
    const rect = element.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();

    // Calculate safe positions that won't cover the algorithm
    let top = rect.bottom + 10; // Position below with more gap
    let left = rect.left;

    // If popup would cover the element or go off bottom, position above
    if (top < rect.top + rect.height + 5 || top + popupRect.height > window.innerHeight - 10) {
        top = rect.top - popupRect.height - 10; // Position above with more gap
    }

    // If still would cover (element is too tall), try positioning to the right
    if (top < rect.bottom && top + popupRect.height > rect.top) {
        top = rect.top;
        left = rect.right + 10; // Position to the right

        // If goes off right side, try left side
        if (left + popupRect.width > window.innerWidth - 10) {
            left = rect.left - popupRect.width - 10; // Position to the left
        }
    }

    // Final boundary checks
    if (left + popupRect.width > window.innerWidth - 10) {
        left = window.innerWidth - popupRect.width - 10;
    }
    if (left < 10) left = 10;
    if (top < 10) top = 10;

    // Ensure popup doesn't overlap with the element vertically when positioned above/below
    if (left === rect.left || left === window.innerWidth - popupRect.width - 10) {
        // We're positioned above or below, ensure no overlap
        if (top > rect.top && top < rect.bottom) {
            // Overlapping, force it above
            top = rect.top - popupRect.height - 10;
            if (top < 10) {
                // Can't fit above, position below
                top = rect.bottom + 10;
            }
        }
    }

    popup.style.top = top + 'px';
    popup.style.left = left + 'px';

    // Add scroll handler - immediate close for all popups
    const scrollHandler = () => {
        window.hideAlgPopup(isPermanent);
        window.removeEventListener('scroll', scrollHandler, true);
        if (clickHandler) document.removeEventListener('mousedown', clickHandler);
    };
    window.addEventListener('scroll', scrollHandler, true);

    let clickHandler = null;
    if (isPermanent) {
        activePopup = popup;
        activePopupElement = element;

        // Add click outside handler - immediate close
        setTimeout(() => {
            clickHandler = (e) => {
                if (!popup.contains(e.target) && e.target !== element) {
                    window.hideAlgPopup(true);
                    document.removeEventListener('mousedown', clickHandler);
                    window.removeEventListener('scroll', scrollHandler, true);
                }
            };
            document.addEventListener('mousedown', clickHandler);
        }, 100);
    } else {
        // For hover popups, hide when mouse leaves the popup or element
        popup.onmouseleave = () => {
            popupHoverTimeout = setTimeout(() => {
                window.hideAlgPopup(false);
                popupHoverTimeout = null;
            }, 100);
        };
        
        popup.onmouseenter = () => {
            if (popupHoverTimeout) {
                clearTimeout(popupHoverTimeout);
                popupHoverTimeout = null;
            }
        };
        
        // Also add handlers to the element to keep popup alive
        if (element && !element._popupHandlersSet) {
            element._popupHandlersSet = true;
            element.addEventListener('mouseleave', () => {
                popupHoverTimeout = setTimeout(() => {
                    window.hideAlgPopup(false);
                    popupHoverTimeout = null;
                }, 100);
            });
            element.addEventListener('mouseenter', () => {
                if (popupHoverTimeout) {
                    clearTimeout(popupHoverTimeout);
                    popupHoverTimeout = null;
                }
            });
        }
    }
}

window.hideAlgPopup = function(isPermanent) {
    if (isPermanent) {
        if (activePopup) {
            activePopup.remove();
            activePopup = null;
            activePopupElement = null;
        }
    } else {
        // Immediately remove hover popup
        const hoverPopup = document.querySelector('.alg-popup:not(.permanent)');
        if (hoverPopup) {
            hoverPopup.remove();
        }
        if (popupHoverTimeout) {
            clearTimeout(popupHoverTimeout);
            popupHoverTimeout = null;
        }
    }
}

window.showContextMenu = function(caseName, event) {
    event.stopPropagation();

    // Close any existing context menu
    const existingMenu = document.getElementById('caseContextMenu');
    if (existingMenu) existingMenu.remove();

    const isLearned = learnedCases.has(caseName);
    const isLearning = learningCases.has(caseName);
    const priorityLevel = plannedLevels.get(caseName) || 4;
    const priorityNames = ['Highest', 'Higher', 'High', 'Normal', 'Low', 'Lower', 'Lowest'];

    const menu = document.createElement('div');
    menu.id = 'caseContextMenu';
    menu.style.cssText = `
        position: fixed;
        background: var(--surface);
        border-bottom: 1px solid var(--surface-border);
        border-radius: 6px;
        box-shadow: 0 4px 12px var(--card-shadow);
        z-index: 10000;
        padding: 4px 0;
        min-width: 180px;
        max-width: 200px;
    `;

    // Add status indicator at top
    const statusIndicator = document.createElement('div');
    statusIndicator.style.cssText = `
        padding: 6px 16px;
        font-size: 0.75rem;
        color: var(--text-secondary);
        border-bottom: 1px solid var(--surface-border);
        margin-bottom: 4px;
        text-align: center;
        font-weight: 600;
    `;

    if (isLearned) {
        statusIndicator.textContent = 'Learned';
    } else if (isLearning) {
        statusIndicator.textContent = 'Learning';
    } else {
        statusIndicator.textContent = `Priority: ${priorityNames[priorityLevel - 1]}`;
    }
    menu.appendChild(statusIndicator);

    const menuItems = [];

    // Only show priority adjustment for planned cases
    if (!isLearned && !isLearning) {
        menuItems.push(
            {
                label: 'Move Up in Priority',
                action: () => {
                    adjustPriority(caseName, -1);
                    // Don't close menu
                    const newPriority = plannedLevels.get(caseName) || 4;
                    statusIndicator.textContent = `Priority: ${priorityNames[newPriority - 1]}`;
                },
                disabled: priorityLevel === 1
            },
            {
                label: 'Move Down in Priority',
                action: () => {
                    adjustPriority(caseName, 1);
                    // Don't close menu
                    const newPriority = plannedLevels.get(caseName) || 4;
                    statusIndicator.textContent = `Priority: ${priorityNames[newPriority - 1]}`;
                },
                disabled: priorityLevel === 7
            },
            { divider: true }
        );
    }

    menuItems.push(
        {
            label: 'Add/Edit Notes',
            action: () => {
                menu.remove();
                openNotesModal(caseName);
            }
        },
        {
            label: 'Train This Case',
            action: () => {
                menu.remove();
                openTrainingModal(caseName);
            }
        },
        {
            label: 'Edit Case',
            action: () => {
                menu.remove();
                openEditCaseModal(caseName);
            }
        }
    );

    menuItems.push(
        { divider: true },
        {
            label: 'Close',
            action: () => {
                menu.remove();
            }
        }
    );

    menuItems.forEach(item => {
        if (item.divider) {
            const divider = document.createElement('div');
            divider.style.cssText = 'height: 1px; background: var(--surface-border); margin: 4px 0;';
            menu.appendChild(divider);
        } else {
            const option = document.createElement('div');
            option.textContent = item.label;
            option.style.cssText = `
                padding: 8px 16px;
                cursor: ${item.disabled ? 'not-allowed' : 'pointer'};
                font-size: 0.9rem;
                color: ${item.disabled ? 'var(--text-muted)' : 'var(--text-ui)'}
                opacity: ${item.disabled ? '0.5' : '1'};
            `;

            if (!item.disabled) {
                option.onmouseover = () => {
                    option.style.background = 'var(--sidebar-item-hover)';
                };
                option.onmouseout = () => {
                    option.style.background = 'transparent';
                };
                option.onclick = item.action;
            }

            menu.appendChild(option);
        }
    });

    document.body.appendChild(menu);

    // Position the menu with proper boundary checking
    const rect = event.target.closest('.icon-btn').getBoundingClientRect();
    let top = rect.bottom + 5;
    let left = rect.right - 180; // Align to right edge of button, accounting for menu width

    // Wait for menu to be in DOM to get accurate dimensions
    setTimeout(() => {
        const menuRect = menu.getBoundingClientRect();

        // Check bottom boundary
        if (top + menuRect.height > window.innerHeight - 10) {
            top = rect.top - menuRect.height - 5;
        }

        // Check top boundary
        if (top < 10) {
            top = 10;
        }

        // Recalculate left with actual menu width
        left = rect.right - menuRect.width;

        // Check right boundary (shouldn't be needed with right-align, but just in case)
        if (left + menuRect.width > window.innerWidth - 10) {
            left = window.innerWidth - menuRect.width - 10;
        }

        // Check left boundary
        if (left < 10) {
            left = 10;
        }

        menu.style.top = top + 'px';
        menu.style.left = left + 'px';
    }, 0);

    // Close menu when clicking outside
    setTimeout(() => {
        const closeMenu = (e) => {
            if (!menu.contains(e.target) && e.target !== event.target) {
                menu.remove();
                document.removeEventListener('mousedown', closeMenu);
                window.removeEventListener('scroll', scrollCloseMenu, true);
            }
        };

        const scrollCloseMenu = () => {
            menu.remove();
            document.removeEventListener('mousedown', closeMenu);
            window.removeEventListener('scroll', scrollCloseMenu, true);
        };

        document.addEventListener('mousedown', closeMenu);
        window.addEventListener('scroll', scrollCloseMenu, true);
    }, 100);
}


/*
╔════════════════════════════════════════════════════════════════════════════╗
║                             LEARNING STATES                                ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

function updateProgress() {
    const totalCases = data.length;
    const learnedCount = learnedCases.size;

    const totalProbability = data.reduce((sum, item) => sum + item.probability, 0);
    const learnedProbability = data
        .filter(item => learnedCases.has(item.name))
        .reduce((sum, item) => sum + item.probability, 0);

    const p = Math.round((learnedProbability / totalProbability) * 100 * 2) / 2;
    const x = learnedCount;

    // Calculate consistency level using sigmoid function
    const exp = Math.exp;
    const numerator = 1 / (1 + exp(-12 * ((x - 1) / 89 - 0.4170435672))) - 1 / (1 + exp(-12 * (0 - 0.4170435672)));
    const denominator = 1 / (1 + exp(-12 * (1 - 0.4170435672))) - 1 / (1 + exp(-12 * (0 - 0.4170435672)));
    const c = 80 + 14 * (numerator / denominator);

    // Calculate safety
    const safety = p * c / 100 + 0.5 * (100 - p);

    // Update profile modal if open
    const profileModal = document.getElementById('profileModal');
    if (profileModal && profileModal.style.display === 'block') {
        if (typeof updateProfileStats === 'function') {
            updateProfileStats();
        }
    }
}

window.toggleLearned = function(name, event = null) {
    // Close any open context menu
    const existingMenu = document.getElementById('caseContextMenu');
    if (existingMenu) existingMenu.remove();

    const isRightClick = event && event.button === 2;

    if (isRightClick) {
        event.preventDefault();
        // Right click: learned -> learning -> planned
        if (learnedCases.has(name)) {
            learnedCases.delete(name);
            learningCases.add(name);
            plannedCases.delete(name);
        } else if (learningCases.has(name)) {
            learningCases.delete(name);
            plannedCases.add(name);
            if (!plannedLevels.has(name)) plannedLevels.set(name, 4);
        } else {
            learnedCases.add(name);
            learningCases.delete(name);
            plannedCases.delete(name);
        }
    } else {
        // Left click: planned -> learning -> learned
        if (learnedCases.has(name)) {
            learnedCases.delete(name);
            learningCases.delete(name);
            plannedCases.add(name);
            if (!plannedLevels.has(name)) plannedLevels.set(name, 4);
        } else if (learningCases.has(name)) {
            learningCases.delete(name);
            learnedCases.add(name);
            plannedCases.delete(name);
        } else {
            learningCases.add(name);
            plannedCases.delete(name);
        }
    }
    saveState();
    updateProgress();

    // Re-render the specific card
    const cardElement = document.querySelector(`[data-case-name="${name}"]`);
    if (cardElement) {
        const item = data.find(d => d.name === name);
        if (item) {
            cardElement.outerHTML = renderCard(item);
        }
    }

    // Show reorder button if in priority mode
    if (currentSortMode === 'priority') {
        needsReorder = true;
        showReorderButton();
    }
}

function adjustPriority(name, delta) {
    // Ensure case is in planned state
    if (!plannedCases.has(name)) {
        plannedCases.add(name);
        learnedCases.delete(name);
        learningCases.delete(name);
    }

    const currentLevel = plannedLevels.get(name) || 4;
    let newLevel = currentLevel + delta;

    // Clamp between 1 (Top) and 7 (Meh)
    if (newLevel < 1) newLevel = 1;
    if (newLevel > 7) newLevel = 7;

    plannedLevels.set(name, newLevel);
    saveState();
    updateProgress();

    // Re-render the specific card
    const cardElement = document.querySelector(`[data-case-name="${name}"]`);
    if (cardElement) {
        const item = data.find(d => d.name === name);
        if (item) {
            cardElement.outerHTML = renderCard(item);
        }
    }

    // Show reorder button if in priority mode
    if (currentSortMode === 'priority') {
        needsReorder = true;
        showReorderButton();
    }
}

/*
╔════════════════════════════════════════════════════════════════════════════╗
║                              CARD RENDERING                                ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

function renderCard(item) {
    const prob = (item.probability / 3678 * 100).toFixed(3);
    const isLearned = learnedCases.has(item.name);
    const isLearning = learningCases.has(item.name);
    const isPlanned = plannedCases.has(item.name);
    const plannedLevel = plannedLevels.get(item.name) || 4;

    let cardClass = '';
    if (isLearned) {
        cardClass = 'learned';
    } else if (isLearning) {
        cardClass = 'learning';
    } else {
        cardClass = `planned priority-${plannedLevel}`;
    }

    const comment = comments.get(item.name) || '';

    // Use cached parity calculations
    const cachedAlgs = cachedParityAlgorithms.get(item.name);
    const oddAlgs = cachedAlgs ? cachedAlgs.odd : [];
    const evenAlgs = cachedAlgs ? cachedAlgs.even : [];

    // Fetch SVGs dynamically from svgData using string keys
    const topSVG = window.svgData[item.top] || '';
    const bottomSVG = window.svgData[item.bottom] || '';

    const algFontFamily = hideParenthesis ? 'Arial, sans-serif' : 'Consolas, Menlo, Monaco, "Courier New", monospace';
    const oddAlgDisplay = oddAlgs.length > 0 ? renderAlgorithmWithPopup(oddAlgs, item.name, 'odd', algFontFamily) : '<div class="alg-line" style="color: var(--text-muted); font-style: italic;">No algorithms available</div>';
    const evenAlgDisplay = evenAlgs.length > 0 ? renderAlgorithmWithPopup(evenAlgs, item.name, 'even', algFontFamily) : '<div class="alg-line" style="color: var(--text-muted); font-style: italic;">No algorithms available</div>';

    const learnedIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="${isLearned ? 'var(--card-learned-border)' : (isLearning ? 'var(--card-learning-border)' : 'var(--border-color)')}" stroke-width="2">
        <path d="M20 6L9 17l-5-5"/>
    </svg>`;

    const threeDotsIcon = `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;">
        <circle cx="12" cy="5" r="2"/>
        <circle cx="12" cy="12" r="2"/>
        <circle cx="12" cy="19" r="2"/>
    </svg>`;

    const displayName = getDisplayName(item.name);

    // Apply search highlighting
    let highlightedName = displayName;
    if (window.searchMatches && window.searchMatches.has(item.name)) {
        const matchInfo = window.searchMatches.get(item.name);

        if (matchInfo.type === 'simple') {
            // Simple highlighting - highlight the search term
            const searchTerm = matchInfo.searchTerm;
            const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
            highlightedName = displayName.replace(regex, '<mark style="background-color: var(--search-highlight-bg); padding: 0 2px; border-radius: 2px;">$1</mark>');
        } else if (matchInfo.type === 'slashed-normal') {
            // Normal order: highlight matching parts in their positions
            const parts = displayName.split('/');
            if (parts.length === 2) {
                const part1 = highlightPartialMatch(parts[0].trim(), matchInfo.searchPart1);
                const part2 = highlightPartialMatch(parts[1].trim(), matchInfo.searchPart2);
                highlightedName = `${part1}/${part2}`;
            }
        } else if (matchInfo.type === 'slashed-flipped') {
            // Flipped order: highlight matching parts in flipped positions
            const parts = displayName.split('/');
            if (parts.length === 2) {
                const part1 = highlightPartialMatch(parts[0].trim(), matchInfo.searchPart2);
                const part2 = highlightPartialMatch(parts[1].trim(), matchInfo.searchPart1);
                highlightedName = `${part1}/${part2}`;
            }
        }
    }

    return `
        <div class="card ${cardClass}" data-case-name="${item.name}">
            <div class="card-header">
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <div class="card-title" style="${evilnessFactor ? (isCaseEvil(item.name) ? 'color: var(--bad-case);' : 'color: var(--good-case);') : ''}">
                        ${highlightedName}
                        ${perCaseSubtitles.has(item.name) ? `<div class="card-subtitle" style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 400; margin-top: 2px;">${perCaseSubtitles.get(item.name)}</div>` : ''}
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0;">
                        <div class="probability">${prob}%</div>
                        <div class="card-header-actions">
                            <div class="icon-btn" onmousedown="event.stopPropagation(); toggleLearned('${item.name.replace(/'/g, "\\'")}', event)" oncontextmenu="event.preventDefault();">
                                ${learnedIcon}
                            </div>
                            <div class="icon-btn" onclick="event.stopPropagation(); showContextMenu('${item.name.replace(/'/g, "\\'")}', event)" style="color: var(--text-secondary);">
                                ${threeDotsIcon}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-images card-svg-container">
                <div style="width: 50%; height: auto;">${topSVG}</div>
                <div style="width: 50%; height: auto;">${bottomSVG}</div>
            </div>
            <div class="card-body">
                <div class="alg-section">
                    <span class="alg-label">Odd:</span>
                    ${oddAlgDisplay}
                </div>
                <div class="alg-section">
                    <span class="alg-label">Even:</span>
                    ${evenAlgDisplay}
                </div>
                ${comment ? `<div style="font-size: 0.65rem; color: var(--text-secondary); margin-top: 8px; white-space: pre-wrap;">${sanitizeNoteHTML(comment)}</div>` : ''}
            </div>
        </div>
    `;
}

let renderTimeout = null;

let _progressiveRenderToken = 0;

function render(softRender = false) {
    if (renderTimeout) clearTimeout(renderTimeout);

    renderTimeout = setTimeout(() => {
        if (!softRender && needsParityRecalculation()) {
            showRenderLoading();
            requestAnimationFrame(() => {
                calculateAndCacheAllParity();
                hideRenderLoading();
                _doProgressiveRender();
            });
        } else {
            _doProgressiveRender();
        }
        renderTimeout = null;
    }, 50);
}

function _doProgressiveRender() {
    const token = ++_progressiveRenderToken;
    const items = filteredData;

    // Figure out how many cards fit in the viewport
    // Estimate ~320px per card row, at least 8 cards visible
    const cardHeight = 320;
    const cols = Math.max(1, Math.floor(grid.offsetWidth / 320));
    const visibleRows = Math.ceil(window.innerHeight / cardHeight);
    const initialCount = Math.min((visibleRows + 2) * cols, items.length);

    // Render visible portion immediately
    grid.innerHTML = items.slice(0, initialCount).map(renderCard).join('');

    // Append placeholder rows for remaining items so scroll height is correct
    if (items.length > initialCount) {
        const placeholder = document.createElement('div');
        placeholder.id = '_render_placeholder';
        placeholder.style.cssText = `height:${Math.ceil((items.length - initialCount) / cols) * cardHeight}px;`;
        grid.appendChild(placeholder);
    }

    if (items.length <= initialCount) return;

    // Trickle-render the rest one card at a time in idle callbacks
    let idx = initialCount;
    function renderNext() {
        if (token !== _progressiveRenderToken) return; // stale render, abort
        if (idx >= items.length) {
            // Remove placeholder once done
            const ph = document.getElementById('_render_placeholder');
            if (ph) ph.remove();
            return;
        }

        const card = document.createElement('div');
        card.innerHTML = renderCard(items[idx]);
        const cardEl = card.firstElementChild;

        // Insert before placeholder
        const ph = document.getElementById('_render_placeholder');
        if (ph) {
            grid.insertBefore(cardEl, ph);
            // Shrink placeholder
            const remaining = items.length - idx - 1;
            ph.style.height = `${Math.ceil(remaining / cols) * cardHeight}px`;
            if (remaining === 0) ph.remove();
        } else {
            grid.appendChild(cardEl);
        }

        idx++;
        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(renderNext, { timeout: 100 });
        } else {
            setTimeout(renderNext, 8);
        }
    }

    if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(renderNext, { timeout: 100 });
    } else {
        setTimeout(renderNext, 8);
    }
}

function showRenderLoading() {
    let loadingDiv = document.getElementById('renderLoadingIndicator');
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'renderLoadingIndicator';
        loadingDiv.className = 'render-loading-indicator';
        loadingDiv.innerHTML = `
            <div class="render-loading-spinner"></div>
            <span>Updating...</span>
        `;
        document.body.appendChild(loadingDiv);
    }
    loadingDiv.style.display = 'flex';
}

function hideRenderLoading() {
    const loadingDiv = document.getElementById('renderLoadingIndicator');
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }
}

function showReorderButton() {
    let reorderBtn = document.getElementById('reorderButton');
    if (reorderBtn) return; // Already showing

    reorderBtn = document.createElement('button');
    reorderBtn.id = 'reorderButton';
    reorderBtn.className = 'reorder-btn';
    reorderBtn.textContent = 'Re-order Cases';

    reorderBtn.onclick = () => {
        filterAndSort(true);
        hideReorderButton();
        needsReorder = false;
    };

    document.body.appendChild(reorderBtn);
}

function hideReorderButton() {
    const reorderBtn = document.getElementById('reorderButton');
    if (reorderBtn) {
        reorderBtn.remove();
    }
}

// Helper function to escape regex special characters
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to highlight partial matches in a string
function highlightPartialMatch(text, searchTerm) {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
    return text.replace(regex, '<mark class="search-hl">$1</mark>');
}


/* ==== FILE: js/search-and-filter.js ==== */

﻿// Store search matches for highlighting
window.searchMatches = new Map();

function filterAndSort(softRender = false) {
    const searchTerm    = searchInput.value.toLowerCase().trim();
    const sortType      = sortSelect.value;
    const learnFilter   = learnFilterSelect.value;

    window.searchMatches.clear();

    currentSortMode = sortType;
    localStorage.setItem('sortMode', currentSortMode);

    filteredData = data.filter(item => {
        let matchesLearnFilter = true;
        if (learnFilter === 'learned') {
            matchesLearnFilter = learnedCases.has(item.name);
        } else if (learnFilter === 'unlearned') {
            matchesLearnFilter = !learnedCases.has(item.name);
        }

        if (!matchesLearnFilter) return false;
        if (!searchTerm) return true;

        const displayName      = getDisplayName(item.name);
        const displayNameLower = displayName.toLowerCase();
        const titleHasSlash    = displayName.includes('/');
        const searchHasSlash   = searchTerm.includes('/');

        // Case 1: Search without slash — simple partial match
        if (!searchHasSlash) {
            if (displayNameLower.includes(searchTerm)) {
                window.searchMatches.set(item.name, { type: 'simple', searchTerm });
                return true;
            }
            return false;
        }

        // Case 2: Both search and title have slash
        if (searchHasSlash && titleHasSlash) {
            const searchParts = searchTerm.split('/').map(p => p.trim());
            const titleParts  = displayName.split('/').map(p => p.trim());

            if (searchParts.length === 2 && titleParts.length === 2) {
                const [searchPart1, searchPart2] = searchParts;
                const [titlePart1,  titlePart2]  = titleParts;
                const t1 = titlePart1.toLowerCase();
                const t2 = titlePart2.toLowerCase();

                const normalMatch  = t1.includes(searchPart1) && t2.includes(searchPart2);
                const flippedMatch = t2.includes(searchPart1) && t1.includes(searchPart2);

                if (normalMatch) {
                    window.searchMatches.set(item.name, { type: 'slashed-normal', searchPart1, searchPart2 });
                    return true;
                }
                if (flippedMatch) {
                    window.searchMatches.set(item.name, { type: 'slashed-flipped', searchPart1, searchPart2 });
                    return true;
                }
            }
            return false;
        }

        // Case 3: Search has slash but title does not
        return false;
    });

    // Apply sorting
    if (sortType === 'priority') {
        filteredData.sort((a, b) => b.probability - a.probability);
        filteredData.sort((a, b) => {
            const aIsLearning = learningCases.has(a.name);
            const bIsLearning = learningCases.has(b.name);
            const aIsPlanned  = plannedCases.has(a.name);
            const bIsPlanned  = plannedCases.has(b.name);
            const aIsLearned  = learnedCases.has(a.name);
            const bIsLearned  = learnedCases.has(b.name);

            if (aIsLearning && !bIsLearning) return -1;
            if (!aIsLearning && bIsLearning) return 1;

            if (aIsPlanned && !bIsPlanned && !bIsLearning && !bIsLearned) return -1;
            if (!aIsPlanned && bIsPlanned && !aIsLearning && !aIsLearned) return 1;
            if (aIsPlanned && bIsPlanned) {
                const aPriority = plannedLevels.get(a.name) || 4;
                const bPriority = plannedLevels.get(b.name) || 4;
                return aPriority - bPriority;
            }

            if (aIsLearned && !bIsLearned) return 1;
            if (!aIsLearned && bIsLearned) return -1;
            return 0;
        });
    } else {
        filteredData.sort((a, b) => b.probability - a.probability);
        if (sortType === 'antiProbability') filteredData.reverse();
    }

    render(softRender);
}

// ── Responsive select labels ─────────────────────────────────
function updateSelectLabels() {
    const width   = window.innerWidth;
    const selects = document.querySelectorAll('select');

    selects.forEach(select => {
        select.querySelectorAll('option').forEach(option => {
            // Cache the full text on first call
            if (!option.getAttribute('data-full')) {
                option.setAttribute('data-full', option.textContent);
            }
            const fullText  = option.getAttribute('data-full');
            const shortText = option.getAttribute('data-short');
            const xsText    = option.getAttribute('data-xs');

            if (width <= 400 && xsText) {
                option.textContent = xsText;
            } else if (width <= 570 && shortText) {
                option.textContent = shortText;
            } else {
                option.textContent = fullText;
            }
        });
    });
}

// ── Attach event listeners ───────────────────────────────────
function attachSearchListeners() {
    const searchInputEl      = document.getElementById('search');
    const sortSelectEl       = document.getElementById('sort');
    const learnFilterSelectEl = document.getElementById('learnFilter');
    const searchToggleEl     = document.getElementById('searchToggle');
    const controlsEl         = document.querySelector('.controls');

    if (searchInputEl) {
        searchInputEl.setAttribute('autocomplete',   'off');
        searchInputEl.setAttribute('autocorrect',    'off');
        searchInputEl.setAttribute('autocapitalize', 'off');
        searchInputEl.setAttribute('spellcheck',     'false');

        searchInputEl.addEventListener('input', () => {
            filterAndSort(true);
            // Keep search bar open while there is text
            if (searchInputEl.value !== '' && controlsEl) {
                controlsEl.classList.add('search-expanded');
            }
        });
    }

    if (sortSelectEl) {
        sortSelectEl.addEventListener('change', () => {
            filterAndSort(true);
            hideReorderButton();
        });
    }

    if (learnFilterSelectEl) {
        learnFilterSelectEl.addEventListener('change', () => filterAndSort(true));
    }

    if (searchToggleEl && controlsEl) {
        searchToggleEl.addEventListener('click', () => {
            controlsEl.classList.toggle('search-expanded');
            if (controlsEl.classList.contains('search-expanded') && searchInputEl) {
                searchInputEl.focus();
            }
        });
    }

    // Close search when clicking outside and the field is empty
    if (controlsEl && searchInputEl) {
        document.addEventListener('click', (e) => {
            if (!controlsEl.contains(e.target) &&
                controlsEl.classList.contains('search-expanded') &&
                searchInputEl.value === '') {
                controlsEl.classList.remove('search-expanded');
            }
        });
    }
}

// ── Boot ─────────────────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachSearchListeners);
} else {
    attachSearchListeners();
}

updateSelectLabels();
window.addEventListener('resize', updateSelectLabels);

/* ==== FILE: js/settings.js ==== */

/*
╔═══════════════════════════════════════════════════════════════════════════╗
║                        UNIFIED SETTINGS MODAL                             ║
╚═══════════════════════════════════════════════════════════════════════════╝
*/

const SETTINGS_TABS = [
    { id: 'homescreen',    label: 'Personalization',    icon: 'res/settings.svg' },
    { id: 'parity',        label: 'Parity Tracer Settings', icon: 'res/tracing.svg' },
    { id: 'trainer',       label: 'Trainer Settings',       icon: 'res/training.svg' },
    { id: 'animate',       label: 'Animate Algs Settings',  icon: 'res/animate_alg_settings.svg' },
];

let _settingsActiveTab = 'homescreen';
let _settingsOpen = false;

// ── Public API ────────────────────────────────────────────────────────────────

window.openUnifiedSettings = function (tabId) {
    _settingsActiveTab = tabId || 'homescreen';
    _buildSettingsModal();
};

// Legacy shims so old call-sites still work
window.openSettingsModal = () => window.openUnifiedSettings('homescreen');
window.openParityTracingPersonalization = () => {
    // Still delegates to the parity-tracer library's config modal
    if (typeof window.ParityTracerLibrary !== 'undefined' && window.ParityTracerLibrary.openConfigModal) {
        const config = _buildParityConfig();
        window.ParityTracerLibrary.openConfigModal(null, config, null, null, null);
    } else {
        window.openUnifiedSettings('parity');
    }
};

// ── Build modal DOM ───────────────────────────────────────────────────────────

function _buildSettingsModal() {
    if (document.getElementById('unifiedSettingsModal')) return;
    _settingsOpen = true;

    window.modalScrollY = window.scrollY;
    document.body.style.top = `-${window.modalScrollY}px`;
    document.documentElement.classList.add('scroll-locked');

    const overlay = document.createElement('div');
    overlay.id = 'unifiedSettingsModal';
    overlay.className = 'modal active';
    overlay.style.cssText = 'z-index:10010;';
    overlay.addEventListener('click', e => { if (e.target === overlay) _closeSettingsModal(); });

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.cssText = `
        max-width: 760px; width: 96vw; max-height: 88vh; min-height: 40vh;
        display: flex; flex-direction: column; border-radius: 18px;
        overflow: hidden; background: var(--surface); padding: 0;
    `;

    // ── Header ────────────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.style.cssText = `
        flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
        padding: 20px 24px 16px; border-bottom: 2px solid var(--surface-border);
        background: var(--surface);
    `;
    header.innerHTML = `
        <span style="font-size:1.4rem;font-weight:700;color:var(--text-ui);">Settings</span>
        <button onclick="closeUnifiedSettingsModal()" style="background:none;border:none;font-size:1.7rem;cursor:pointer;color:var(--sidebar-close-color);line-height:1;padding:0;">&times;</button>
    `;

    // ── Body (sidebar + panel) ────────────────────────────────────────────────
    const body = document.createElement('div');
    body.style.cssText = 'display:flex;flex:1;overflow:hidden;';

    // Sidebar
    const sidebar = document.createElement('nav');
    sidebar.id = 'settingsSidebar';
    sidebar.style.cssText = `
        flex-shrink: 0; width: 58px; background: var(--surface2);
        border-right: 1px solid var(--surface-border);
        display: flex; flex-direction: column; gap: 2px; padding: 10px 6px;
        overflow-y: auto;
    `;

    SETTINGS_TABS.forEach(tab => {
        const btn = document.createElement('button');
        btn.id = `settingsTab_${tab.id}`;
        btn.dataset.tab = tab.id;
        btn.title = tab.label;
        btn.style.cssText = `
            display: flex; align-items: center; justify-content: center;
            padding: 9px; border-radius: 10px; border: none; cursor: pointer;
            background: ${_settingsActiveTab === tab.id ? 'var(--surface-border)' : 'transparent'};
            transition: all 0.15s; width: 100%;
        `;
        const isAnimate = tab.id === 'animate';
btn.innerHTML = `<img src="${tab.icon}" width="${isAnimate ? 30 : 24}" height="${isAnimate ? 30 : 24}" style="opacity:${_settingsActiveTab === tab.id ? '1' : '0.55'}">`;
        btn.addEventListener('click', () => _switchTab(tab.id));
        sidebar.appendChild(btn);
    });

    // Panel
    const panel = document.createElement('div');
    panel.id = 'settingsPanel';
    panel.style.cssText = 'flex:1;overflow-y:auto;padding:0 24px 22px;';

    body.appendChild(sidebar);
    body.appendChild(panel);
    content.appendChild(header);
    content.appendChild(body);
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    _renderTab(_settingsActiveTab);

    if (typeof pushModalState === 'function') pushModalState('unifiedSettingsModal', _closeSettingsModal);
}

function _switchTab(tabId) {
    _settingsActiveTab = tabId;
    SETTINGS_TABS.forEach(t => {
        const btn = document.getElementById(`settingsTab_${t.id}`);
        if (!btn) return;
        const active = t.id === tabId;
        btn.style.background = active ? 'var(--surface-border)' : 'transparent';
        btn.querySelector('img').style.opacity = active ? '1' : '0.55';
    });
    _renderTab(tabId);
}

function _renderTab(tabId) {
    const panel = document.getElementById('settingsPanel');
    if (!panel) return;
    const tab = SETTINGS_TABS.find(t => t.id === tabId);
    panel.innerHTML = `<div style="position:sticky;top:0;background:var(--surface);z-index:1;padding:18px 0 4px;margin-bottom:4px;">
        <span style="font-size:1.05rem;font-weight:700;color:var(--text-ui);">${tab ? tab.label : ''}</span>
    </div>`;
    switch (tabId) {
        case 'homescreen': _renderHomescreenTab(panel); break;
        case 'parity':     _renderParityTab(panel);     break;
        case 'trainer':    _renderTrainerTab(panel);    break;
        case 'animate':    _renderAnimateTab(panel);    break;
    }
    // Restore info-box click behavior for the new panel content
    if (typeof applyInstructionVisibility === 'function') applyInstructionVisibility();
}

window.closeUnifiedSettingsModal = _closeSettingsModal;
function _closeSettingsModal() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('unifiedSettingsModal');
        if (!modal) return;
        modal.remove();
        _settingsOpen = false;
        document.documentElement.classList.remove('scroll-locked');
        window.scrollTo(0, window.modalScrollY || 0);
    });
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function _row(labelHtml, controlHtml, tipHtml) {
    return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:12px;">
        <div style="display:flex;align-items:center;gap:7px;flex:1;min-width:0;">
            <label style="color:var(--text-secondary);font-weight:500;font-size:0.92rem;">${labelHtml}</label>
            ${tipHtml ? `<span class="info-wrapper">
                <button class="settings-info-btn" aria-label="More info"><img src="res/info.svg"></button>
                <span class="info-box">${tipHtml}</span>
            </span>` : ''}
        </div>
        <div style="flex-shrink:0;">${controlHtml}</div>
    </div>`;
}

function _toggle(id, checked, onchange) {
    return `<input type="checkbox" id="${id}" ${checked ? 'checked' : ''} onchange="${onchange}" style="transform:scale(1.3);cursor:pointer;">`;
}

function _slider(id, min, max, step, value, onInput, displayId) {
    return `
    <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}"
        style="width:100%;cursor:pointer;" oninput="${onInput}">
    <div style="display:flex;justify-content:space-between;font-size:0.78rem;color:var(--text-secondary);margin-top:3px;">
        <span>${min}</span><span id="${displayId}" style="font-weight:600;">${value}</span><span>${max}</span>
    </div>`;
}

function _sectionTitle(text) {
    return `<div style="font-size:0.8rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--text-secondary);margin:18px 0 10px;padding-bottom:4px;border-bottom:1px solid var(--surface-border);">${text}</div>`;
}

function _actionBtn(label, onclick, tipHtml) {
    return `
    <div onclick="if(event.target===this||event.target.tagName==='SPAN')${onclick}" class="settings-action-btn"
        style="padding:11px 16px;border-radius:10px;cursor:pointer;width:100%;margin-bottom:8px;font-weight:600;font-size:0.92rem;
               transition:all 0.2s;display:flex;align-items:center;justify-content:space-between;
               background:var(--surface2);border:1px solid var(--border-color);color:var(--text-ui);"
        >
        <span>${label}</span>
        ${tipHtml ? `<span class="info-wrapper">
            <button class="settings-info-btn" aria-label="More info" onclick="event.stopPropagation()"><img src="res/info.svg"></button>
            <span class="info-box">${tipHtml}</span>
        </span>` : ''}
    </div>`;
}

// ── TAB: Homescreen ───────────────────────────────────────────────────────────

function _renderHomescreenTab(panel) {
    panel.innerHTML += `
        ${_sectionTitle('Display')}
        ${_row('Dark Mode',
            _toggle('hs_themeToggle', document.documentElement.getAttribute('data-theme') === 'dark', 'toggleTheme(this.checked)'),
            'Switch between light and dark mode.')}
        ${_row('Show Tracing Guides',
            _toggle('hs_hintToggle', showHints, 'toggleHints(this.checked)'),
            'Show/hide the numbered tracing guide overlays on case images. The numbers indicate tracing order.<br><br><strong>Keyboard shortcut:</strong> Alt+T')}
        ${_row('Hide Instruction Buttons',
            _toggle('hs_hideInstructionsToggle', hideInstructions, 'toggleHideInstructions(this.checked)'),
            'Hide all ⓘ instruction buttons across the app.<br><br><strong>Keyboard shortcut:</strong> Alt+H')}
        ${_row('Hide Parentheses',
            _toggle('hs_hideParenthesisToggle', hideParenthesis, 'toggleHideParenthesis(this.checked)'),
            'Removes parentheses and switches the alg font from monospace to Arial for a cleaner look.<br><br><strong>Keyboard shortcut:</strong> Alt+P')}

        ${_sectionTitle('Algorithm Font Size')}
        <div style="margin-bottom:18px;">
            ${_slider('hs_algFontSizeSlider', 10, 20, 1, algorithmFontSize,
                'updateAlgFontSizePreview(this.value)', 'hs_algFontSizeValue')}
            <div style="display:flex;justify-content:space-between;font-size:0.78rem;color:var(--text-secondary);margin-top:2px;">
                <span>Small</span><span>Large</span>
            </div>
        </div>

        ${_sectionTitle('Tools')}
        ${_actionBtn('Color Scheme Settings',
            'openColorSchemeModal()',
            'Change your Square-1 colour scheme. This affects parity tracing and draw-scramble visualizations.')}
        ${_actionBtn('Quick Edit',
            'openQuickEditModal()',
            'Bulk-edit case algs, names and subtitles. Intended for preset creators.<br><br><strong>Keyboard shortcut:</strong> Alt+Q')}
        ${_actionBtn('Customize Tracing Guides',
            'openCustomizeSVGsModal()',
            'Drag the numbered labels to your preferred positions on each shape image.<br><br><strong>Keyboard shortcut:</strong> Alt+G')}

        ${_sectionTitle('Access')}
        ${_row('Enable Enhanced Access',
            _toggle('hs_enhancedAccessToggle', window.enhancedAccess, 'toggleEnhancedAccess(this.checked)'),
            'Unlocks alg editing inside Edit Case and Quick Edit. Keep off unless you are building a preset.')}
    `;

    // Sync slider display
    document.getElementById('hs_algFontSizeValue').textContent = algorithmFontSize + 'px';
}

// ── TAB: Parity Tracer ────────────────────────────────────────────────────────

function _buildParityConfig() {
    return {
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#ffffff',
        hideInstructionButton: hideInstructions,
        tlMainCol: colorScheme.topColor,
        tlColName: typeof getColorName === 'function' ? getColorName(colorScheme.topColor) : 'Top',
        tlColAbb: (typeof getColorName === 'function' ? getColorName(colorScheme.topColor) : 'T').charAt(0),
        blMainCol: colorScheme.bottomColor,
        blColName: typeof getColorName === 'function' ? getColorName(colorScheme.bottomColor) : 'Bottom',
        blColAbb: (typeof getColorName === 'function' ? getColorName(colorScheme.bottomColor) : 'B').charAt(0),
        frontCol: colorScheme.frontColor,
        rightCol: colorScheme.rightColor,
        backCol: colorScheme.backColor,
        leftCol: colorScheme.leftColor,
    };
}

function _renderParityTab(panel) {
    const storedZ2 = localStorage.getItem('z2TracingModeForParityTracerLibrary');
    const z2On = storedZ2 !== null ? storedZ2 === 'true' : true;
    const ptSize = parseInt(localStorage.getItem('parityTracerImageSize') || '200');
    const showArrow = localStorage.getItem('parityTracerShowArrow') !== 'false';

    // Arrow appearance (from stored settings)
    let arrowSettings = { color: 'rgba(253,34,34,0.7)', opacity: 0.7, strokeWidth: 1.6, radius: 0.3 };
    const s = localStorage.getItem('parityTracerArrowSettings');
    if (s) arrowSettings = JSON.parse(s);

    const cornerMode = typeof cornerStickerMode !== 'undefined' ? cornerStickerMode : 'counterclockwise';
    const evilOn = typeof evilnessFactor !== 'undefined' && evilnessFactor;
    const evilStrOn = typeof evilnessStringReturn !== 'undefined' && evilnessStringReturn;

    panel.innerHTML += `
        ${_sectionTitle('Tracing Method')}
        ${_row('Corner Sticker for Tracing',
            `<select id="pt_cornerSticker" onchange="_ptSaveCornerSticker(this.value)"
                style="padding:5px 8px;border:1px solid var(--border-color);border-radius:6px;background:var(--surface);color:var(--text-ui);">
                <option value="counterclockwise" ${cornerMode==='counterclockwise'?'selected':''}>Counter-clockwise sticker</option>
                <option value="clockwise" ${cornerMode==='clockwise'?'selected':''}>Clockwise sticker</option>
            </select>`,
            'Corner sticker mode determines which sticker (left-most sticker or right-most sticker) of the corner you use for tracing. This doesn not affect parity calculations, just your personal preference.')}
        ${_row('z2 Tracing for 6/8-Edge Cases',
            _toggle('pt_z2', z2On, '_ptSaveZ2(this.checked)'),
            'z2 tracing for 6 and 8 edge cases means you prioritize the more edge-dense face to start your tracing, regardless of which layer it is on. This is the safest tracing mode. If you do not do z2 tracing, for 2E6E cases parity gets flipped')}

        ${_sectionTitle('Visualization')}
        <div style="margin-bottom:18px;">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
                <label style="font-weight:500;color:var(--text-secondary);font-size:0.92rem;">Image Size: <span id="pt_imgSizeVal">${ptSize}px</span></label>
                <span class="info-wrapper">
                    <button class="settings-info-btn" aria-label="More info"><img src="res/info.svg"></button>
                    <span class="info-box">Image size controls how big the square-1 visualization appears. Adjust this based on your screen size and preference.</span>
                </span>
            </div>
            <input type="range" id="pt_imgSize" min="100" max="400" step="10" value="${ptSize}"
                style="width:100%;cursor:pointer;" oninput="_ptSaveImgSize(this.value)">
        </div>
        ${_row('Show Tracing Arrow',
            _toggle('pt_showArrow', showArrow, '_ptSaveArrow(this.checked)'),
            'The circular arrow shows where your tracing starts on each layer. You can customize its appearance or hide it completely.')}

        <div id="pt_arrowSettings" style="opacity:${showArrow?'1':'0.4'};pointer-events:${showArrow?'auto':'none'};">
            <div style="margin-bottom:12px;">
                <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px;">
                    <label style="font-size:0.88rem;font-weight:500;color:var(--text-secondary);">Arrow Opacity: <span id="pt_opacityVal">${Math.round(arrowSettings.opacity*100)}%</span></label>
                </div>
                <input type="range" id="pt_opacity" min="0" max="100" value="${Math.round(arrowSettings.opacity*100)}"
                    style="width:100%;cursor:pointer;" oninput="_ptSaveArrowProp('opacity',this.value/100,this)">
            </div>
            <div style="margin-bottom:12px;">
                <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px;">
                    <label style="font-size:0.88rem;font-weight:500;color:var(--text-secondary);">Stroke Width: <span id="pt_strokeVal">${arrowSettings.strokeWidth.toFixed(1)}</span></label>
                </div>
                <input type="range" id="pt_stroke" min="0.5" max="5" step="0.1" value="${arrowSettings.strokeWidth}"
                    style="width:100%;cursor:pointer;" oninput="_ptSaveArrowProp('strokeWidth',parseFloat(this.value),this)">
            </div>
            <div style="margin-bottom:12px;">
                <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px;">
                    <label style="font-size:0.88rem;font-weight:500;color:var(--text-secondary);">Arrow Radius: <span id="pt_radiusVal">${arrowSettings.radius.toFixed(2)}</span></label>
                </div>
                <input type="range" id="pt_radius" min="0.1" max="1.1" step="0.01" value="${arrowSettings.radius}"
                    style="width:100%;cursor:pointer;" oninput="_ptSaveArrowProp('radius',parseFloat(this.value),this)">
            </div>
        </div>

        ${_sectionTitle('Tools')}
        ${_actionBtn('Set Tracing Scheme',
            '_closeSettingsModal();setTimeout(()=>openParityTracingPersonalization(),200)',
            'Set the starting piece (edge or corner) for each shape. This determines the order in which pieces are traced and therefore the odds/evens assigned to your algs.')}

        ${_sectionTitle('Evilness')}
        ${_row('Enable Evilness Factor',
            _toggle('pt_evilness', evilOn, '_ptToggleEvilness(this)'),
            'When enabled, each case can be flagged as "evil". Evil cases add +1 to the parity total, flipping the result.')}
        <div id="pt_evilSubSettings" style="opacity:${evilOn?'1':'0.4'};pointer-events:${evilOn?'auto':'none'};">
            ${_row('Evilness Affects Homescreen',
                _toggle('pt_evilStr', evilStrOn, '_ptToggleEvilStr(this)'),
                'When ON, the parity tags (Odd/Even) shown on algs on the homescreen also factor in the evilness of each case.')}
            ${_actionBtn('Per-case Evilness Settings',
                '_closeSettingsModal();setTimeout(()=>_openEvilnessCasesFromSettings(),200)',
                'Mark individual cases as evil or good.')}
        </div>
    `;
}

window._ptSaveCornerSticker = function(val) {
    cornerStickerMode = val;
    if (typeof saveState === 'function') saveState();
    _triggerParityLiveUpdate();
};
window._ptSaveZ2 = function(val) {
    localStorage.setItem('z2TracingModeForParityTracerLibrary', val.toString());
    _triggerParityLiveUpdate();
};
window._ptSaveImgSize = function(val) {
    document.getElementById('pt_imgSizeVal').textContent = val + 'px';
    localStorage.setItem('parityTracerImageSize', val);
    _triggerParityLiveUpdate();
};
window._ptSaveArrow = function(val) {
    localStorage.setItem('parityTracerShowArrow', val.toString());
    const container = document.getElementById('pt_arrowSettings');
    if (container) { container.style.opacity = val ? '1' : '0.4'; container.style.pointerEvents = val ? 'auto' : 'none'; }
    _triggerParityLiveUpdate();
};
window._ptSaveArrowProp = function(prop, val) {
    let settings = { color: 'rgba(253,34,34,0.7)', opacity: 0.7, strokeWidth: 1.6, radius: 0.3 };
    const s = localStorage.getItem('parityTracerArrowSettings');
    if (s) settings = JSON.parse(s);
    settings[prop] = val;
    localStorage.setItem('parityTracerArrowSettings', JSON.stringify(settings));
    // Update display span
    const displayMap = { opacity: ['pt_opacityVal', v => Math.round(v*100)+'%'],
                         strokeWidth: ['pt_strokeVal', v => parseFloat(v).toFixed(1)],
                         radius: ['pt_radiusVal', v => parseFloat(v).toFixed(2)] };
    if (displayMap[prop]) {
        const el = document.getElementById(displayMap[prop][0]);
        if (el) el.textContent = displayMap[prop][1](val);
    }
    _triggerParityLiveUpdate();
};
window._ptToggleEvilness = function(checkbox) {
    const newVal = checkbox.checked;
    checkbox.checked = !newVal; // revert until confirmed
    _confirmExpensiveOp(
        `${newVal ? 'Enable' : 'Disable'} Evilness factor?`,
        'This will update the parity calculations and may freeze your page for a brief moment.',
        () => {
            checkbox.checked = newVal;
            if (typeof evilnessFactor !== 'undefined') evilnessFactor = newVal;
            if (typeof saveState === 'function') saveState();
            const sub = document.getElementById('pt_evilSubSettings');
            if (sub) { sub.style.opacity = newVal ? '1' : '0.4'; sub.style.pointerEvents = newVal ? 'auto' : 'none'; }
            if (typeof lastParityCalculationSettings !== 'undefined') lastParityCalculationSettings = null;
            if (typeof calculateAndCacheAllParity === 'function') calculateAndCacheAllParity();
            if (typeof render === 'function') render();
            if (typeof showToast === 'function') showToast(`Evilness ${newVal ? 'enabled' : 'disabled'}`, 3000, 'success');
        }
    );
};
window._ptToggleEvilStr = function(checkbox) {
    const newVal = checkbox.checked;
    checkbox.checked = !newVal;
    _confirmExpensiveOp(
        `${newVal ? 'Enable' : 'Disable'} Evilness in Parity Results?`,
        'This will update the parity calculations and may freeze your page for a brief moment.',
        () => {
            checkbox.checked = newVal;
            if (typeof evilnessStringReturn !== 'undefined') evilnessStringReturn = newVal;
            if (typeof saveState === 'function') saveState();
            if (typeof lastParityCalculationSettings !== 'undefined') lastParityCalculationSettings = null;
            if (typeof calculateAndCacheAllParity === 'function') calculateAndCacheAllParity();
            if (typeof render === 'function') render();
        }
    );
};
window._openEvilnessCasesFromSettings = function() {
    const config = _buildParityConfig();
    if (window.ParityTracerLibrary && window.ParityTracerLibrary.openEvilnessCasesModal) {
        window.ParityTracerLibrary.openEvilnessCasesModal(config);
    }
};
function _triggerParityLiveUpdate() {
    const backdrop = document.querySelector('.parity-tracer-backdrop');
    if (!backdrop) return;
    const input = backdrop.querySelector('input[type="text"]');
    if (input) input.dispatchEvent(new Event('input', { bubbles: true }));
}

window.toggleTheme = function(isDark) {
    const next = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('sqg-csp-theme', next);
    const toggle = document.getElementById('hs_themeToggle');
    if (toggle) toggle.checked = isDark;
};

// ── TAB: Trainer ──────────────────────────────────────────────────────────────

function _renderTrainerTab(panel) {
    const imgSize  = parseInt(localStorage.getItem('trainingScrambleImageSize') || '200');
    const txtSize  = parseInt(localStorage.getItem('trainingScrambleTextSize')  || '16');
    const tmrSize  = parseInt(localStorage.getItem('trainingTimerSize')         || '80');
    const holdVal  = parseFloat(localStorage.getItem('trainingHoldToStart')     || '0.22');
    const showPrev = localStorage.getItem('trainingShowPrevScramble') === 'true';
    const insp     = localStorage.getItem('trainingEnableInspection') === 'true';
    const pquiz    = localStorage.getItem('trainingEnableParityQuiz') === 'true';

    panel.innerHTML += `
        ${_sectionTitle('Scramble Display')}
        <div style="margin-bottom:18px;">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
                <label style="font-weight:500;color:var(--text-secondary);font-size:0.92rem;">Image Size: <span id="tr_imgSizeVal">${imgSize}px</span></label>
            </div>
            <input type="range" id="tr_imgSize" min="100" max="400" step="10" value="${imgSize}"
                style="width:100%;cursor:pointer;" oninput="_trSaveImgSize(this.value)">
        </div>
        <div style="margin-bottom:18px;">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
                <label style="font-weight:500;color:var(--text-secondary);font-size:0.92rem;">Scramble Text Size: <span id="tr_txtSizeVal">${txtSize}px</span></label>
            </div>
            <input type="range" id="tr_txtSize" min="10" max="24" step="1" value="${txtSize}"
                style="width:100%;cursor:pointer;" oninput="_trSave('trainingScrambleTextSize',this.value,'tr_txtSizeVal',v=>v+'px');_trApplyTextSize(this.value)">
        </div>

        ${_sectionTitle('Timer')}
        <div style="margin-bottom:18px;">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
                <label style="font-weight:500;color:var(--text-secondary);font-size:0.92rem;">Timer Text Size: <span id="tr_tmrSizeVal">${tmrSize}px</span></label>
            </div>
            <input type="range" id="tr_tmrSize" min="30" max="120" step="2" value="${tmrSize}"
                style="width:100%;cursor:pointer;" oninput="_trSave('trainingTimerSize',this.value,'tr_tmrSizeVal',v=>v+'px');_trApplyTimerSize(this.value)">
        </div>
        <div style="margin-bottom:18px;">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
                <label style="font-weight:500;color:var(--text-secondary);font-size:0.92rem;">Hold-to-Start: <span id="tr_holdVal">${holdVal.toFixed(2)}s</span></label>
                <span class="info-wrapper">
                    <button class="settings-info-btn" aria-label="More info"><img src="res/info.svg"></button>
                    <span class="info-box">How long you must hold the spacebar (or press the timer zone) before starting the timer.</span>
                </span>
            </div>
            <input type="range" id="tr_hold" min="0.1" max="0.7" step="0.01" value="${holdVal}"
                style="width:100%;cursor:pointer;" oninput="_trSave('trainingHoldToStart',this.value,'tr_holdVal',v=>parseFloat(v).toFixed(2)+'s');_trApplyHold(this.value)">
        </div>

        ${_sectionTitle('Display')}
        ${_row('Show Previous Scramble',
            _toggle('tr_showPrev', showPrev, "_trSaveBool('trainingShowPrevScramble',this.checked);_trApplyPrevBar()"),
            'Shows the previous scramble at the very bottom of the screen.')}

        ${_sectionTitle('Inspection')}
        ${_row('Enable Inspection',
            _toggle('tr_insp', insp, '_trToggleInspection(this.checked)'))}
        <div id="tr_pquizRow" style="opacity:${insp?'1':'0.4'};pointer-events:${insp?'auto':'none'};">
            ${_row('Parity Quiz During Inspection',
                _toggle('tr_pquiz', pquiz, '_trTogglePQuiz(this.checked)'),
                'During inspection, the trainer will quiz you about the parity state of the current scramble')}
        </div>
    `;
}

window._trSave = function(key, val, displayId, fmt) {
    localStorage.setItem(key, val);
    const el = document.getElementById(displayId);
    if (el) el.textContent = fmt ? fmt(val) : val;
};
window._trSaveBool = function(key, val) { localStorage.setItem(key, val.toString()); };
window._trSaveImgSize = function(val) {
    localStorage.setItem('trainingScrambleImageSize', val);
    const el = document.getElementById('tr_imgSizeVal');
    if (el) el.textContent = val + 'px';
    // Live update: if trainer is open, regenerate the scramble image
    if (typeof trainingScrambleImageSize !== 'undefined') trainingScrambleImageSize = parseInt(val);
    const modal = document.getElementById('trainingModal');
    if (modal && modal.classList.contains('active')) {
        if (typeof window._multiCaseMode !== 'undefined' && window._multiCaseMode) {
            if (typeof regenerateMultiScrambleLookahead === 'function') regenerateMultiScrambleLookahead();
        } else {
            if (typeof regenerateScrambleLookahead === 'function') regenerateScrambleLookahead();
        }
    }
    // Live update evilness quiz if open
    const evilModal = document.getElementById('evilnessQuizModal');
    if (evilModal) {
        const imgEl = document.getElementById('evilQuizImage');
        if (imgEl && typeof window._evilCurrentHexCode !== 'undefined' && window._evilCurrentHexCode) {
            const state = parseHexFormat(window._evilCurrentHexCode);
            const notation = window.sq1Tools.scrambleFromState(state);
            imgEl.innerHTML = visualizeFromScrambleNotation(notation, parseInt(val), typeof colorScheme !== 'undefined' ? colorScheme : {});
        }
    }
};
window._trApplyTextSize = function(val) {
    const el = document.getElementById('trainingScramble');
    if (el) { el.style.fontSize = val + 'px'; if (typeof trainingScrambleTextSize !== 'undefined') trainingScrambleTextSize = parseInt(val); }
    if (typeof applyPrevScrambleBar === 'function') applyPrevScrambleBar();
};
window._trApplyTimerSize = function() {
    if (typeof trainingScrambleTextSize !== 'undefined') {}
    if (typeof applyTimerSize === 'function') applyTimerSize();
};
window._trApplyHold = function(val) {
    if (typeof trainingHoldToStart !== 'undefined') trainingHoldToStart = parseFloat(val);
};
window._trApplyPrevBar = function() {
    if (typeof applyPrevScrambleBar === 'function') applyPrevScrambleBar();
};
window._trToggleInspection = function(val) {
    if (typeof trainingEnableInspection !== 'undefined') trainingEnableInspection = val;
    localStorage.setItem('trainingEnableInspection', val.toString());
    if (!val) {
        if (typeof trainingEnableParityQuiz !== 'undefined') trainingEnableParityQuiz = false;
        localStorage.setItem('trainingEnableParityQuiz', 'false');
        const pq = document.getElementById('tr_pquiz');
        if (pq) pq.checked = false;
    }
    const row = document.getElementById('tr_pquizRow');
    if (row) { row.style.opacity = val ? '1' : '0.4'; row.style.pointerEvents = val ? 'auto' : 'none'; }
};
window._trTogglePQuiz = function(val) {
    const inspOn = localStorage.getItem('trainingEnableInspection') === 'true';
    if (!inspOn) { const cb = document.getElementById('tr_pquiz'); if (cb) cb.checked = false; return; }
    if (typeof trainingEnableParityQuiz !== 'undefined') trainingEnableParityQuiz = val;
    localStorage.setItem('trainingEnableParityQuiz', val.toString());
};

// ── TAB: Alg Animator ────────────────────────────────────────────────────────

function _renderAnimateTab(panel) {
    const speed   = parseFloat(localStorage.getItem('sq1AnimSpeed')          || '0.9');
    const delay   = parseInt(localStorage.getItem('sq1AutoDelay')            || '500');
    const imgSize = parseInt(localStorage.getItem('sq1AnimImageSize')        || '200');
    const bothLay = localStorage.getItem('sq1AnimBothLayers') !== null
        ? localStorage.getItem('sq1AnimBothLayers') === 'true' : true;
    const vertDis = localStorage.getItem('sq1AnimVerticalDisplay') !== null
        ? localStorage.getItem('sq1AnimVerticalDisplay') === 'true' : false;

    panel.innerHTML += `
        ${_sectionTitle('Playback')}
        <div style="margin-bottom:18px;">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
                <label style="font-weight:500;color:var(--text-secondary);font-size:0.92rem;">Animation Speed: <span id="aa_speedVal">${speed.toFixed(1)}x</span></label>
            </div>
            <input type="range" id="aa_speed" min="0.2" max="2" step="0.1" value="${speed}"
                style="width:100%;cursor:pointer;" oninput="_aaSave('sq1AnimSpeed',this.value,'aa_speedVal',v=>parseFloat(v).toFixed(1)+'x')">
        </div>
        <div style="margin-bottom:18px;">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
                <label style="font-weight:500;color:var(--text-secondary);font-size:0.92rem;">Auto-play Delay: <span id="aa_delayVal">${delay}ms</span></label>
                <span class="info-wrapper">
                    <button class="settings-info-btn" aria-label="More info"><img src="res/info.svg"></button>
                    <span class="info-box">The pause between moves when auto-playing an algorithm.</span>
                </span>
            </div>
            <input type="range" id="aa_delay" min="0" max="1000" step="50" value="${delay}"
                style="width:100%;cursor:pointer;" oninput="_aaSave('sq1AutoDelay',this.value,'aa_delayVal',v=>v+'ms')">
        </div>

        ${_sectionTitle('Display')}
        <div style="margin-bottom:18px;">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
                <label style="font-weight:500;color:var(--text-secondary);font-size:0.92rem;">Image Size: <span id="aa_imgSizeVal">${imgSize}px</span></label>
            </div>
            <input type="range" id="aa_imgSize" min="100" max="400" step="10" value="${imgSize}"
                style="width:100%;cursor:pointer;" oninput="_aaSave('sq1AnimImageSize',this.value,'aa_imgSizeVal',v=>v+'px')">
        </div>
        ${_row('Animate Both Layers Together',
            _toggle('aa_bothLayers', bothLay, "_aaSaveBool('sq1AnimBothLayers',this.checked)"),
            null)}
        ${_row('Vertical Stack Display',
            _toggle('aa_vertDisplay', vertDis, "_aaSaveBool('sq1AnimVerticalDisplay',this.checked)"),
            'When ON, the top and bottom layer images stack vertically instead of side-by-side.')}
    `;
}

window._aaSave = function(key, val, displayId, fmt) {
    localStorage.setItem(key, val);
    const el = document.getElementById(displayId);
    if (el) el.textContent = fmt ? fmt(val) : val;
};
window._aaSaveBool = function(key, val) { localStorage.setItem(key, val.toString()); };

// ── Utility: confirm expensive operation ──────────────────────────────────────

function _confirmExpensiveOp(title, message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:20000;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = `
        <div style="background:var(--surface);padding:24px;border-radius:12px;max-width:340px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
            <h3 style="margin:0 0 10px;color:var(--text-ui);font-size:1.05rem;">${title}</h3>
            <p style="margin:0 0 18px;color:var(--text-secondary);font-size:0.9rem;line-height:1.5;">${message}</p>
            <div style="display:flex;gap:8px;justify-content:flex-end;">
                <button id="_ceo_cancel" style="padding:7px 16px;background:var(--surface2);color:var(--text-ui);border:1px solid var(--border-color);border-radius:6px;cursor:pointer;font-weight:600;">Cancel</button>
                <button id="_ceo_confirm" style="padding:7px 16px;background:var(--bar-learned);color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;">Apply</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    document.getElementById('_ceo_cancel').onclick = () => overlay.remove();
    document.getElementById('_ceo_confirm').onclick = () => { overlay.remove(); onConfirm(); };
}

// ── Wire up sidebar settings button ──────────────────────────────────────────
// The sidebar already calls openSettingsModal() which is now shimmed above.
// Nothing extra needed.


/* ==== FILE: js/modals.js ==== */

﻿/*
╔═══════════════════════════════════════════════════════════════════════════╗
║                          DYNAMIC MODAL GENERATION                         ║
╚═══════════════════════════════════════════════════════════════════════════╝
*/

// Helper function for color names
function getColorName(hexColor) {
    const colorMap = {
        '#000000': 'Black',
        '#FFFFFF': 'White',
        '#FFFF00': 'Yellow',
        '#FFD700': 'Yellow'
    };
    return colorMap[hexColor.toUpperCase()] || 'Top';
}

// Make getColorName globally accessible for training modal
window.getColorName = getColorName;

// Generate all modal HTML dynamically for lazy loading
function generateModalHTML() {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'dynamicModals';

    modalContainer.innerHTML = `
        <div id="colorSchemeModal" class="modal">
            <div class="modal-content" style="max-width: 500px; max-height: 80vh; min-height: 20vh;">
                <div class="modal-header">
                    <span class="modal-title">Color Scheme Settings</span>
                    <button class="close-btn" onclick="closeColorSchemeModal()">&times;</button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">Top Color:</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="color-btn" data-face="top" data-color="#FFFF00" style="background: #FFFF00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Yellow</button>
                            <button class="color-btn" data-face="top" data-color="#000000" style="background: #000000; color: white; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Black</button>
                            <button class="color-btn" data-face="top" data-color="#FFFFFF" style="background: #FFFFFF; color: #000000; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">White</button>
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">Bottom Color:</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="color-btn" data-face="bottom" data-color="#FFFF00" style="background: #FFFF00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Yellow</button>
                            <button class="color-btn" data-face="bottom" data-color="#000000" style="background: #000000; color: white; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Black</button>
                            <button class="color-btn" data-face="bottom" data-color="#FFFFFF" style="background: #FFFFFF; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">White</button>
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">Front Color:</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="color-btn" data-face="front" data-color="#CC0000" style="background: #CC0000; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Red</button>
                            <button class="color-btn" data-face="front" data-color="#00AA00" style="background: #00AA00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Green</button>
                            <button class="color-btn" data-face="front" data-color="#0066CC" style="background: #0066CC; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Blue</button>
                            <button class="color-btn" data-face="front" data-color="#FF8C00" style="background: #FF8C00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Orange</button>
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">Right Color:</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="color-btn" data-face="right" data-color="#CC0000" style="background: #CC0000; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Red</button>
                            <button class="color-btn" data-face="right" data-color="#00AA00" style="background: #00AA00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Green</button>
                            <button class="color-btn" data-face="right" data-color="#0066CC" style="background: #0066CC; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Blue</button>
                            <button class="color-btn" data-face="right" data-color="#FF8C00" style="background: #FF8C00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Orange</button>
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">Back Color:</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="color-btn" data-face="back" data-color="#CC0000" style="background: #CC0000; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Red</button>
                            <button class="color-btn" data-face="back" data-color="#00AA00" style="background: #00AA00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Green</button>
                            <button class="color-btn" data-face="back" data-color="#0066CC" style="background: #0066CC; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Blue</button>
                            <button class="color-btn" data-face="back" data-color="#FF8C00" style="background: #FF8C00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Orange</button>
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">Left Color:</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="color-btn" data-face="left" data-color="#CC0000" style="background: #CC0000; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Red</button>
                            <button class="color-btn" data-face="left" data-color="#00AA00" style="background: #00AA00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Green</button>
                            <button class="color-btn" data-face="left" data-color="#0066CC" style="background: #0066CC; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Blue</button>
                            <button class="color-btn" data-face="left" data-color="#FF8C00" style="background: #FF8C00; width: 60px; height: 40px; border-radius: 4px; cursor: pointer;">Orange</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

         <!-- Desktop Profile Modal (Popup style) -->
        <div id="profileModalDesktop" class="profile-popup-desktop">
            <div class="profile-popup-content">
                <!-- View Mode -->
                <div id="profileViewDesktop">
                    <div style="text-align: center; padding: 20px 20px 15px; border-bottom: 1px solid var(--surface-border);">
                        <img id="profileAvatarDesktop" src="res/avatar.svg" style="width: 56px; height: 56px; margin-bottom: 10px; border-radius: 50%; border: 3px solid var(--avatar-border-idle);">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <h3 id="profileNameDesktop" style="margin: 0; font-size: 1.2rem; color: var(--text-ui); font-weight: 600;">Profile</h3>
                            <button onclick="switchToEditProfile('Desktop')" style="background: none; border: none; cursor: pointer; padding: 2px; display: flex; align-items: center; color: var(--sidebar-close-color);" title="Edit Profile">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                        </div>
                    </div>
                    <div style="padding: 15px;">
                        <div style="margin-bottom: 12px;">
                            <div class="progress-track" style="border-radius: 8px; height: 24px; position: relative; overflow: hidden;">
                                <div id="profileLearningProgressDesktop" style="background: var(--bar-learning); height: 100%; width: 0%; transition: width 0.5s ease; border-radius: 8px; position: absolute; left: 0; top: 0;"></div>
                                <div id="profileLearnedProgressDesktop" style="background: var(--bar-learned); height: 100%; width: 0%; transition: width 0.5s ease; border-radius: 8px; position: absolute; left: 0; top: 0; z-index: 1;"></div>
                                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; padding: 0 10px; justify-content: space-between; z-index: 2;">
                                    <span style="font-size: 0.75rem; color: var(--text-ui); font-weight: 600;">Learned</span>
                                    <span id="profileLearnedTextDesktop" style="font-weight: 700; color: var(--text-ui); font-size: 0.8rem;">0/90</span>
                                </div>
                            </div>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <div class="progress-track" style="border-radius: 8px; height: 24px; position: relative; overflow: hidden;">
                                <div id="profileCoverageProgressDesktop" style="background: var(--bar-coverage); height: 100%; width: 0%; transition: width 0.5s ease; border-radius: 8px;"></div>
                                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; padding: 0 10px; justify-content: space-between;">
                                    <span style="font-size: 0.75rem; color: var(--text-ui); font-weight: 600;">Coverage</span>
                                    <span id="profileCoverageTextDesktop" style="font-weight: 700; color: var(--text-ui); font-size: 0.8rem;">0.0%</span>
                                </div>
                            </div>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <div class="progress-track" style="border-radius: 8px; height: 24px; position: relative; overflow: hidden;">
                                <div id="profileSafetyProgressDesktop" style="background: var(--bar-safety); height: 100%; width: 0%; transition: width 0.5s ease; border-radius: 8px;"></div>
                                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; padding: 0 10px; justify-content: space-between;">
                                    <span style="font-size: 0.75rem; color: var(--text-ui); font-weight: 600;">Safety</span>
                                    <span id="profileSafetyTextDesktop" style="font-weight: 700; color: var(--text-ui); font-size: 0.8rem;">0.0%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Edit Mode -->
                <div id="profileEditDesktop" style="display: none;">
                    <div style="padding: 15px 20px; border-bottom: 1px solid var(--surface-border); display: flex; align-items: center; gap: 10px;">
                        <button onclick="switchToViewProfile('Desktop')" style="background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; color: var(--sidebar-close-color);" title="Back">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        </button>
                        <span style="font-size: 1rem; font-weight: 600; color: var(--text-ui);">Edit Profile</span>
                    </div>
                    <div style="padding: 15px;">
                        <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Name</label>
                        <input id="profileNameInputDesktop" type="text" maxlength="24" style="width: 100%; padding: 8px 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.95rem; margin-bottom: 14px;" placeholder="Your name">
                        <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px;">Choose Avatar</label>
                        <div id="avatarGridDesktop" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px;"></div>
                        <button onclick="saveProfileEdit('Desktop')" style="width: 100%; padding: 9px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem;">Save</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Mobile Profile Modal (Full modal style) -->
        <div id="profileModalMobile" class="modal">
            <div class="modal-content" style="max-width: 400px;">
                <!-- View Mode -->
                <div id="profileViewMobile">
                    <div class="modal-header">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span id="profileNameMobileTitle" class="modal-title">Profile</span>
                            <button onclick="switchToEditProfile('Mobile')" style="background: none; border: none; cursor: pointer; padding: 2px; display: flex; align-items: center; color: var(--sidebar-close-color);" title="Edit Profile">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                        </div>
                        <button class="close-btn" onclick="closeProfileModalMobile()">&times;</button>
                    </div>
                    <div class="modal-body" style="padding: 20px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <img id="profileAvatarMobile" src="res/avatar.svg" style="width: 64px; height: 64px; border-radius: 50%; border: 3px solid var(--avatar-border-idle);">
                        </div>
                        <div style="margin-bottom: 12px;">
                            <div class="progress-track" style="border-radius: 8px; height: 24px; position: relative; overflow: hidden;">
                                <div id="profileLearningProgressMobile" style="background: var(--bar-learning); height: 100%; width: 0%; transition: width 0.5s ease; border-radius: 8px; position: absolute; left: 0; top: 0;"></div>
                                <div id="profileLearnedProgressMobile" style="background: var(--bar-learned); height: 100%; width: 0%; transition: width 0.5s ease; border-radius: 8px; position: absolute; left: 0; top: 0; z-index: 1;"></div>
                                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; padding: 0 10px; justify-content: space-between; z-index: 2;">
                                    <span style="font-size: 0.75rem; color: var(--text-ui); font-weight: 600;">Learned</span>
                                    <span id="profileLearnedTextMobile" style="font-weight: 700; color: var(--text-ui); font-size: 0.8rem;">0/90</span>
                                </div>
                            </div>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <div class="progress-track" style="border-radius: 8px; height: 24px; position: relative; overflow: hidden;">
                                <div id="profileCoverageProgressMobile" style="background: var(--bar-coverage); height: 100%; width: 0%; transition: width 0.5s ease; border-radius: 8px;"></div>
                                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; padding: 0 10px; justify-content: space-between;">
                                    <span style="font-size: 0.75rem; color: var(--text-ui); font-weight: 600;">Coverage</span>
                                    <span id="profileCoverageTextMobile" style="font-weight: 700; color: var(--text-ui); font-size: 0.8rem;">0.0%</span>
                                </div>
                            </div>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <div class="progress-track" style="border-radius: 8px; height: 24px; position: relative; overflow: hidden;">
                                <div id="profileSafetyProgressMobile" style="background: var(--bar-safety); height: 100%; width: 0%; transition: width 0.5s ease; border-radius: 8px;"></div>
                                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; padding: 0 10px; justify-content: space-between;">
                                    <span style="font-size: 0.75rem; color: var(--text-ui); font-weight: 600;">Safety</span>
                                    <span id="profileSafetyTextMobile" style="font-weight: 700; color: var(--text-ui); font-size: 0.8rem;">0.0%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Edit Mode -->
                <div id="profileEditMobile" style="display: none;">
                    <div class="modal-header">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <button onclick="switchToViewProfile('Mobile')" style="background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; color: var(--sidebar-close-color);" title="Back">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;"><polyline points="15 18 9 12 15 6"></polyline></svg>
                            </button>
                            <span class="modal-title">Edit Profile</span>
                        </div>
                        <button class="close-btn" onclick="closeProfileModalMobile()">&times;</button>
                    </div>
                    <div class="modal-body" style="padding: 20px;">
                        <label style="display: block; font-size: 0.9rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Name</label>
                        <input id="profileNameInputMobile" type="text" maxlength="24" style="width: 100%; padding: 9px 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 1rem; margin-bottom: 16px;" placeholder="Your name">
                        <label style="display: block; font-size: 0.9rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 10px;">Choose Avatar</label>
                        <div id="avatarGridMobile" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;"></div>
                        <button onclick="saveProfileEdit('Mobile')" style="width: 100%; padding: 11px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 1rem;">Save</button>
                    </div>
                </div>
            </div>
        </div>

        <div id="aboutModal" class="modal">
            <div class="modal-content" style="
                max-width: 700px;
                border-radius: 14px;
                overflow: hidden;
                background: var(--surface);
            ">

            <!-- Header -->
            <div style="
                background: var(--about-header-bg);
                color: #ffffff;
                padding: 22px 26px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <span style="font-size: 1.5rem; font-weight: 600;">
                    About SquanGo CSP
                </span>
                <button class="close-btn" onclick="closeAboutModal()" style="
                    color: white;
                    font-size: 1.6rem;
                    opacity: 0.9;
                ">&times;</button>
            </div>

            <!-- Body -->
            <div style="
                padding: 28px 30px;
                color: var(--text-ui);
                line-height: 1.65;
                max-height: 70vh;
                overflow-y: auto;
                background: var(--surface2);
            ">

                <!-- Intro -->
                <section style="margin-bottom: 26px;">
                    <p style="margin: 0; font-size: 1rem; color: var(--text-secondary);">
                    SquanGo CSP is a focused Square-1 CSP training tool built for speedcubers
                    who want structure, repetition, and zero fluff.
                    It started as a personal motivation tool and slowly turned into something
                    worth sharing.
                    </p>
                </section>

                <!-- Developer -->
                <section style="
                    background: var(--surface);
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 22px;
                ">
                    <p style="font-weight: 600; margin-bottom: 6px;">Developer</p>
                    <p style="margin: 0 0 10px 0; color: var(--text-secondary);">
                    Created by <strong>Abid Ibn Ashraf</strong>
                    </p>

                    <p style="margin: 0; font-size: 0.95rem; color: var(--text-secondary);">
                    Contact & feedback:
                    <strong>Discord — <span style="color: var(--text-ui);">abid_ibn_ashraf</span></strong>
                    </p>
                </section>

                <!-- Credits -->
                <section style="
                    background: var(--surface);
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 22px;
                ">
                    <p style="font-weight: 600; margin-bottom: 10px;">Credits & Inspiration</p>

                    <p style="margin: 0 0 10px 0; font-size: 0.95rem; color: var(--text-secondary);">
                    Major credit goes to <strong>Eva Kato (Hashtag Cuber)</strong>.
                    The overall Homepage layout, case images and most of the alg data are based on her work.
                    </p>

                    <p style="margin: 0; font-size: 0.95rem; color: var(--text-secondary);">
                    Additional credit to my frind<strong>Matt</strong> — the Chinese NR holder for sq1 —
                    for helping me out in this project. Matt's preset is built solemnly by him, the dark mode is also his contribution alone, and he helped me refine the site further.
                    </p>
                </section>

                <!-- Scramble -->
                <section style="
                    background: var(--surface);
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 22px;
                ">
                    <p style="font-weight: 600; margin-bottom: 8px;">Scramble Generator</p>
                    <p style="margin: 0 0 10px 0; font-size: 0.95rem; color: var(--text-secondary);">
                    Square-1 scrambles are generated using code from
                    <strong>csTimer</strong>, written by Shuang Chen (cs0x7f),
                    licensed under GPL-3.0.
                    </p>

                    <a href="https://github.com/cs0x7f/cstimer/blob/master/src/js/scramble/scramble_sq1_new.js"
                    target="_blank"
                    style="font-size: 0.95rem; font-weight: 500; color: var(--about-link-color); text-decoration: none;">
                    View source on GitHub →
                    </a>
                </section>

                <!-- Open Source -->
                <section style="
                    background: var(--surface);
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    padding: 20px;
                ">
                    <p style="font-weight: 600; margin-bottom: 8px;">Open Source</p>
                    <p style="margin: 0 0 10px 0; font-size: 0.95rem; color: var(--text-secondary);">
                    SquanGo CSP is open source. You’re free to explore the code,
                    suggest improvements, or fork it for your own use.
                    </p>

                    <a href="https://github.com/Abid-speedcuber/CSP-squango"
                        target="_blank"
                        style="font-size: 0.95rem; font-weight: 500; color: var(--about-link-color); text-decoration: none;"
                    >
                        View repository on GitHub →
                    </a>
                </section>

            </div>
        </div>
        </div>
    `;

    document.body.appendChild(modalContainer);

    // Setup color button handlers after modals are created
    document.querySelectorAll('.color-btn').forEach(btn => {
        // Set contrast-aware text color on load
        const bg = btn.getAttribute('data-color');
        if (bg) {
            const r = parseInt(bg.substr(1,2),16), g = parseInt(bg.substr(3,2),16), b = parseInt(bg.substr(5,2),16);
            btn.style.color = (0.299*r + 0.587*g + 0.114*b) > 128 ? '#000000' : '#ffffff';
        }
        btn.addEventListener('click', function () {
            const face = this.getAttribute('data-face');
            const color = this.getAttribute('data-color');

            colorScheme[face + 'Color'] = color;

            const sameFaceButtons = document.querySelectorAll(`.color-btn[data-face="${face}"]`);
            sameFaceButtons.forEach(b => {
                b.classList.toggle('selected', b === this);
            });

            // Auto-save
            saveState();

            // Recalculate parity if needed
            if (needsParityRecalculation()) {
                calculateAndCacheAllParity();
                render();
            }
        });
    });
}

/*
╔════════════════════════════════════════════════════════════════════════════╗
║                               SETTINGS MODAL                               ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

window.openSettingsModal = function() {
    window.openUnifiedSettings('homescreen');
}

function closeSettingsModal() {
    _closeSettingsModal();
}

function handlePresetChange(presetName) {
    const isSamePreset = presetName === currentPreset;

    if (isSamePreset) {
        const reloadModal = document.createElement('div');
        reloadModal.className = 'modal active';
        reloadModal.style.zIndex = '10002';
        reloadModal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header" style="background: var(--surface); border-bottom: 2px solid var(--border-color);">
                    <span class="modal-title">Reload ${presetName.replace(/_/g, ' ')}?</span>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <p style="margin: 0 0 10px 0; font-size: 1rem; line-height: 1.6; color: var(--text-primary);">
                        Reloading will <strong>keep</strong> your learning progress (learned/learning/planned states) and personal preferences (font size, hints, etc.).<br><br>
                        It will <strong>replace</strong> your algs, color scheme, tracing guides, case display names, subtitles, and notes with what's in the newest version of this preset.
                    </p>
                    <p style="font-weight: 500;">
                        We recommend exporting your data before reloading.
                    </p> <br>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <button onclick="exportData(); showToast('Data exported! You can now safely reload.', 3000, 'success');" style="padding: 10px 20px; background: transparent; color: var(--bar-learned); border: 2px solid var(--bar-learned); border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='var(--bar-learned)';this.style.color='#fff'" onmouseout="this.style.background='transparent';this.style.color='var(--bar-learned)'">Export First</button>
                        <button onclick="this.closest('.modal').remove(); document.documentElement.classList.remove('scroll-locked'); closeSidebar(); applyPreset(\`${presetName}\`, false, false).then(() => { if(typeof initializePresetSelector === 'function') initializePresetSelector(); });" style="padding: 10px 20px; background: transparent; color: var(--parity-invalid); border: 2px solid var(--parity-invalid); border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='var(--parity-invalid)';this.style.color='#fff'" onmouseout="this.style.background='transparent';this.style.color='var(--parity-invalid)'">Reload Anyway</button>
                        <button onclick="this.closest('.modal').remove();" style="padding: 10px 20px; background: transparent; color: var(--text-secondary); border: 2px solid var(--border-color); border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='var(--surface-border)'" onmouseout="this.style.background='transparent'">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        const close = (e) => {
            reloadModal.remove();
            removeCloseModalFromStack(close);
        }
        reloadModal.querySelector(".close-btn").onclick = close;
        pushModalState('reloadPresetModal', close);
        document.body.appendChild(reloadModal);
        return;
    }

    // Validate preset exists in config
    if (typeof window.PRESET_CONFIG === 'undefined' || !window.PRESET_CONFIG[presetName]) {
        showToast('Invalid preset selected', 2000, 'error');
        document.getElementById('presetSelector').value = currentPreset;
        return;
    }

    // Create a custom warning modal with export option
    const warningModal = document.createElement('div');
    warningModal.className = 'modal active';
    warningModal.style.zIndex = '10002';
    warningModal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header" style="background: var(--surface); border-bottom: 2px solid var(--border-color);">
                <span class="modal-title" style="color: var(--text-primary);">Warning: Data Loss</span>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <p style="margin: 0 0 15px 0; font-size: 1rem; line-height: 1.6; color: var(--text-primary);">
                    Switching to "<strong>${presetName.replaceAll("_", " ")}</strong>" will <strong>keep</strong> your learning progress (learned/learning/planned states) and personal preferences (font size, hints, etc.).<br><br>
                    It will <strong>replace</strong> your algs, color scheme, tracing guides, case display names, subtitles, and notes with what's in the preset.
                </p>
                <p style="font-weight: 500;">
                    We recommend exporting your data before reloading.
                </p> <br>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="exportData(); showToast('Data exported! You can now safely switch presets.', 3000, 'success');" style="padding: 10px 20px; background: transparent; color: var(--bar-learned); border: 2px solid var(--bar-learned); border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem; transition: all 0.2s;" onmouseover="this.style.background='var(--bar-learned)';this.style.color='#fff'" onmouseout="this.style.background='transparent';this.style.color='var(--bar-learned)'">
                        Export Data First
                    </button>
                    <button onclick="this.closest('.modal').remove(); document.documentElement.classList.remove('scroll-locked'); closeSidebar(); applyPreset(\`${presetName}\`, false, false).then(() => { if(typeof initializePresetSelector === 'function') initializePresetSelector(); setTimeout(() => openGeneralNotesModal(), 800); });" style="padding: 10px 20px; background: transparent; color: var(--parity-invalid); border: 2px solid var(--parity-invalid); border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem; transition: all 0.2s;" onmouseover="this.style.background='var(--parity-invalid)';this.style.color='#fff'" onmouseout="this.style.background='transparent';this.style.color='var(--parity-invalid)'">
                        Switch Anyway
                    </button>
                    <button onclick="this.closest('.modal').remove(); document.documentElement.classList.remove('scroll-locked');" style="padding: 10px 20px; background: transparent; color: var(--text-secondary); border: 2px solid var(--border-color); border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem; transition: all 0.2s;" onmouseover="this.style.background='var(--surface-border)'" onmouseout="this.style.background='transparent'">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `;

    const close = (e) => {
        warningModal.remove();
        removeCloseModalFromStack(close);
    }
    warningModal.querySelector(".close-btn").onclick = close;
    pushModalState('presetWarningModal', close);
    document.body.appendChild(warningModal);
    document.documentElement.classList.add('scroll-locked');
}

window.toggleHints = function(isChecked) {
    showHints = isChecked;
    localStorage.setItem('showHints', showHints);
    applyHintVisibility();
}

function applyHintVisibility() {
    if (showHints) {
        document.body.classList.remove('hide-hints');
    } else {
        document.body.classList.add('hide-hints');
    }
}

window.toggleShowPaths = function() {
    // Shape paths always shown now
    return;
}

window.toggleHideInstructions = function(isChecked) {
    hideInstructions = isChecked;
    saveState();
    applyInstructionVisibility();
}

function applyInstructionVisibility() {
    const instructionBtns = document.querySelectorAll('.settings-info-btn, .homepage-info-btn, .training-info-btn, .case-detail-info-btn, .instruction-btn');
    instructionBtns.forEach(btn => {
        btn.style.display = hideInstructions ? 'none' : 'flex';
    });
}

window.toggleHideParenthesis = function(isChecked) {
    hideParenthesis = isChecked;
    saveState();
    render();
}

window.toggleEnhancedAccess = function(isChecked) {
    window.enhancedAccess = isChecked;
    localStorage.setItem('enhancedAccess', isChecked.toString());
}

// Populate preset dropdown dynamically
function populatePresetDropdown(selectorId = 'presetSelector') {
    const presetSelector = document.getElementById(selectorId);
    if (!presetSelector || typeof window.PRESET_CONFIG === 'undefined') return;

    presetSelector.innerHTML = '';

    for (const presetName in window.PRESET_CONFIG) {
        const option = document.createElement('option');
        option.value = presetName;
        // Remove underscores and clean up display name
        option.textContent = presetName.replace(/_/g, ' ').replace(/'/g, "'");
        presetSelector.appendChild(option);
    }

    // Set current preset as selected
    if (typeof currentPreset !== 'undefined') {
        presetSelector.value = currentPreset;
    }
}

// Settings button click handler
document.addEventListener('DOMContentLoaded', () => {
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) settingsBtn.onclick = () => window.openUnifiedSettings('homescreen');
});

// Color Scheme Modal Functions
window.openColorSchemeModal = function() {
    const modal = document.getElementById('colorSchemeModal');

    window.modalScrollY = window.scrollY;
    document.body.style.top = `-${window.modalScrollY}px`;
    document.documentElement.classList.add('scroll-locked');
    modal.style.zIndex = '10015';
    modal.classList.add('active');

    pushModalState('colorSchemeModal', closeColorSchemeModal);

    // Highlight currently selected colors
    document.querySelectorAll('.color-btn').forEach(btn => {
        const face = btn.getAttribute('data-face');
        const color = btn.getAttribute('data-color');
        const currentColor = colorScheme[face + 'Color'];
        btn.classList.toggle('selected', color === currentColor);
    });
}

function closeColorSchemeModal() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('colorSchemeModal');
        modal.classList.remove('active');
        document.documentElement.classList.remove('scroll-locked');
    });
}

window.updateImageSizePreview = function(value) {
    document.getElementById('sizeValue').textContent = value;
    scrambleImageSize = parseInt(value);
    saveState();
}

window.updateAlgFontSizePreview = function(value) {
    document.getElementById('algFontSizeValue').textContent = value;
    algorithmFontSize = parseInt(value);
    localStorage.setItem('algorithmFontSize', value);
    applyAlgorithmFontSize();
}

function applyAlgorithmFontSize() {
    const style = document.getElementById('algorithm-font-size-style') || document.createElement('style');
    style.id = 'algorithm-font-size-style';
    style.textContent = `
        .alg-line, .alg-interactive {
            font-size: ${algorithmFontSize}px !important;
        }
    `;
    if (!style.parentNode) {
        document.head.appendChild(style);
    }
}

// Apply initial hint visibility state on load
applyHintVisibility();

// New parity analysis using ParityTracerLibrary
function openNewParityAnalysis(scramble) {
    if (typeof window.ParityTracerLibrary === 'undefined') {
        showToast('Parity Tracer library not loaded', 3000, 'error');
        return;
    }

    window.ParityTracerLibrary.createModal({
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#ffffff',
        hideInstructionButton: hideInstructions,
        instructionText1: 'Enter your scramble in the top input bar to trace parity using Cale\'s method.',
        instructionText2: 'You can change the color scheme from Color Scheme Settings in the main Settings menu.',
        instructionText3: 'Customize the tracing start point from the settings button at the bottom right.',
        topColor: colorScheme.topColor,
        topColorName: getColorName(colorScheme.topColor),
        topColorShort: getColorName(colorScheme.topColor).charAt(0),
        bottomColor: colorScheme.bottomColor,
        bottomColorName: getColorName(colorScheme.bottomColor),
        bottomColorShort: getColorName(colorScheme.bottomColor).charAt(0),
        frontColor: colorScheme.frontColor,
        rightColor: colorScheme.rightColor,
        backColor: colorScheme.backColor,
        leftColor: colorScheme.leftColor,
        scrambleText: scramble || '',
        generateImage: true,
        imageSize: scrambleImageSize || 200
    });
}

// Homepage Info Modal
window.showHomepageInfoModal = function() {
    pushModalState('homepageInfoModal', closeHomepageInfoModal);

    let infoModal = document.getElementById('homepageInfoModal');
    if (!infoModal) {
        infoModal = document.createElement('div');
        infoModal.id = 'homepageInfoModal';
        infoModal.className = 'training-info-modal';
        infoModal.innerHTML = `
            <div class="training-info-content">
                <div class="training-info-header">
                    <span class="training-info-title">App Guide</span>
                    <button class="training-info-close" onclick="closeHomepageInfoModal()">&times;</button>
                </div>
                <div class="training-info-body">
                    <div class="training-info-item">
                        <div class="training-info-number">1</div>
                        <div class="training-info-text">Click on <strong>Profile</strong> in the top right corner to see your progress stats. The <strong style="color: var(--bar-learned);">green bar (Learned)</strong> shows how many cases out of 90 you have learned. The <strong style="color: var(--accent);">blue bar (Coverage)</strong> tells you how often you will get a CSP you know. The <strong style="color: var(--bar-learning);">orange bar (Safety)</strong> tells you how often you won't get parity (this is equal to Safety + 0.5 * (1 - Safety)).</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">2</div>
                        <div class="training-info-text">Click the <b>checkmark</b> on a case to mark it as <b>learning</b>; click again to mark it as <b>learned</b>. Right click to mark the case as learned; right click again to mark as learning.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">3</div>
                        <div class="training-info-text">The three dots menu of a case lets you<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;1. change the <b>priority state</b> of a case<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;2. <b>add notes</b> for the case<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;3. <b>train the case</b> (you can choose specific angles of the case to train if you want)<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;4. <b>edit case</b> (change case title, subtitles, and the algs if you have Enhanced Access on).</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">4</div>
                        <div class="training-info-text">Sort <strong>By Priority</strong> instead of by Highest Probability to organize cases by learning priority (1-7). However the <b>Learning Cases</b> are the highest priority. Adjust priorities via the three dots menu.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">5</div>
                        <div class="training-info-text"><strong>Hover</strong> over any alg to see its setup and shape path. <strong>Click on the alg</strong> to keep the popup open. Then, you can click the setup to <b>see the parity analysis</b> of the alg, or click on the shape path to <b>watch animation</b> of the alg.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">5</div>
                        <div class="training-info-text">Use <strong>Color Scheme Settings</strong> to change the color scheme of your squan. Impacts parity tracing and "draw scramble".</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">6</div>
                        <div class="training-info-text"><strong>Export/Import Data</strong> in Menu to backup your progress or transfer between devices. Exporting will download a JSON file to your device. To import, simply select that file in the file selector.</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(infoModal);
    }

    document.documentElement.classList.add('scroll-locked');
    infoModal.classList.add('active');
}

function closeHomepageInfoModal() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('homepageInfoModal');
        if (modal) {
            modal.classList.remove('active');
        }
    });
}

function openEditCaseModal(caseName) {
    const item = data.find(d => d.name === caseName);
    if (!item) return;

    const customAlgs = customAlgorithms.get(caseName);
    const allAlgs = [];
    if (customAlgs) {
        allAlgs.push(...(customAlgs.odd || []), ...(customAlgs.even || []));
    } else {
        allAlgs.push(...(item.odd || []), ...(item.even || []));
    }

    const customName = displayNames[caseName] || '';
    const customSubtitle = perCaseSubtitles.get(caseName) || '';

    // Close any existing context menu
    const existingMenu = document.getElementById('caseContextMenu');
    if (existingMenu) existingMenu.remove();

    pushModalState('editCaseModal', closeEditCaseModal);

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'editCaseModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px; max-height: 80vh; min-height: 20vh;">
            <div class="modal-header">
                <div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="modal-title" id="editCaseTitle">${getDisplayName(caseName)}</span>
                        <button onclick="openCaseRenameModal('${caseName.replace(/'/g, "\\'")}', '${customName.replace(/'/g, "\\'")}', '${customSubtitle.replace(/'/g, "\\'")}' )" style="background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center;">
                            <img src="res/pen.svg" style="width: 20px; height: 20px;" alt="Edit name">
                        </button>
                        <button onclick="showEditCaseInfoModal()" style="background: var(--surface2); border: 1px solid var(--border-color); color: var(--text-secondary); cursor: pointer; padding: 6px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; width: 32px; height: 32px;" title="Help" onmouseover="this.style.background='var(--surface-border)'" onmouseout="this.style.background='var(--surface2)'">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                        </button>
                    </div>
                    ${perCaseSubtitles.has(caseName) ? `<div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;" id="editCaseSubtitle">${perCaseSubtitles.get(caseName)}</div>` : '<div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; display: none;" id="editCaseSubtitle"></div>'}
                </div>
                <button class="close-btn" onclick="attemptCloseEditCaseModal()">&times;</button>
            </div>
            <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                <div style="margin-bottom: 15px;" id="algorithmsSection">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-secondary);">Algs:</label>
                    <div id="editAlgsList" style="display: flex; flex-direction: column; gap: 10px;">
                        ${allAlgs.map((alg, idx) => `
                            <div style="display: flex; gap: 8px; align-items: center;" data-alg-index="${idx}">
                                <input type="text" class="alg-input" value="${alg}" data-original="${alg}" style="flex: 1; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; font-family: monospace; font-size: 0.9rem; font-weight: 600; transition: color 0.15s;">
                                <button onclick="this.parentElement.remove()" style="padding: 6px; background: var(--delete-btn-bg); color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
                                    <img src="res/delete.svg" style="width: 16px; height: 16px;" alt="Delete">
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <button id="addAlgorithmBtn" onclick="addNewAlgorithmField()" style="margin-top: 10px; padding: 8px 16px; background: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">+ Add Algorithm</button>
                </div>

                ${evilnessFactor ? `
                <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 16px; padding: 12px 0; border-top: 1px solid var(--surface-border);">
                    <label style="font-weight: 500; color: var(--text-secondary); font-size: 0.95rem;">Mark as Evil</label>
                    <label class="evil-switch" style="position:relative;display:inline-block;width:42px;height:24px;">
                        <input type="checkbox" id="evilCaseToggle" ${evilnessMap[caseName] ? 'checked' : ''} onchange="evilnessMap['${caseName.replace(/'/g, "\\'")}'] = this.checked; saveState();" style="opacity:0;width:0;height:0;">
                        <span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:${evilnessMap[caseName] ? 'var(--parity-invalid, #c00)' : 'var(--surface-border)'};border-radius:24px;transition:.3s;">
                            <span style="position:absolute;content:'';height:18px;width:18px;left:${evilnessMap[caseName] ? '21px' : '3px'};bottom:3px;background:white;border-radius:50%;transition:.3s;display:block;" id="evilSwitchKnob"></span>
                        </span>
                    </label>
                </div>
                ` : ''}
                <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--surface-border);">
                    <button onclick="saveEditedCase('${caseName.replace(/'/g, "\\'")}' )" style="padding: 10px 20px; background: var(--bar-learned); color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; font-weight: 600;">Save Changes</button>
                    <button onclick="closeEditCaseModal()" style="padding: 10px 20px; background: var(--delete-btn-bg); color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    window.modalScrollY = window.scrollY;
    document.body.style.top = `-${window.modalScrollY}px`;
    document.documentElement.classList.add('scroll-locked');

    // Wire up evil switch live animation
    if (evilnessFactor) {
        const evilToggle = modal.querySelector('#evilCaseToggle');
        if (evilToggle) {
            evilToggle.addEventListener('change', function() {
                const span = this.nextElementSibling;
                const knob = document.getElementById('evilSwitchKnob');
                span.style.background = this.checked ? 'var(--parity-invalid, #c00)' : 'var(--surface-border)';
                if (knob) knob.style.left = this.checked ? '21px' : '3px';
            });
        }
    }


    // Apply enhanced access restrictions
    if (!window.enhancedAccess) {
        const algorithmsSection = document.getElementById('algorithmsSection');
        if (algorithmsSection) {
            algorithmsSection.style.opacity = '0.5';
            algorithmsSection.style.pointerEvents = 'none';
        }

        const addAlgorithmBtn = document.getElementById('addAlgorithmBtn');
        if (addAlgorithmBtn) {
            addAlgorithmBtn.disabled = true;
            addAlgorithmBtn.style.cursor = 'not-allowed';
        }

        const algInputs = modal.querySelectorAll('.alg-input');
        algInputs.forEach(input => {
            input.contentEditable = 'false';
            input.style.cursor = 'not-allowed';
        });

        const deleteButtons = modal.querySelectorAll('#editAlgsList button');
        deleteButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.cursor = 'not-allowed';
        });
    }

    // Setup parity detection for algorithm inputs
    setTimeout(() => {
        const inputs = modal.querySelectorAll('.alg-input');
        inputs.forEach(input => {
            // Initial color coding for pre-filled values
            if (document.activeElement !== input) {
                updateInputColor(input);
            }

            input.addEventListener('focus', () => {
                // color stays, just clear on empty
            });

            input.addEventListener('blur', () => {
                const rawText = input.value.trim();
                if (rawText && rawText !== 'Done!') {
                    input.value = typeof expandAndNormalize === 'function' ? expandAndNormalize(rawText) : window.ScrambleNormalizer.normalizeScramble(rawText);
                }
                updateInputColor(input);
            });

            input.addEventListener('input', () => {
                updateInputColorLive(input);
            });

            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData('text/plain');
                const start = input.selectionStart;
                const end = input.selectionEnd;
                const currentValue = input.value;
                input.value = currentValue.substring(0, start) + text + currentValue.substring(end);
                input.selectionStart = input.selectionEnd = start + text.length;
            });
        });
    }, 200);
}

function getModalCaseShapeData(caseName) {
    const canonicalIdx = parseInt(shapeIndexMap[caseName]);
    if (isNaN(canonicalIdx)) return null;
    for (const shapeData of shapeIndex) {
        if (shapeData.org && shapeData.org.includes(canonicalIdx)) return shapeData;
    }
    return null;
}

const MODAL_LEGAL_TOPS = [0,1,2,3,4,5,-1,-2,-3,-4,-5,-6];
const MODAL_LEGAL_BOTTOMS = [0,1,2,3,4,5,-1,-2,-3,-4,-5,-6];

function modalTryFixAngle(algBody, canonicalShapeIdx) {
    for (const t of MODAL_LEGAL_TOPS) {
        for (const b of MODAL_LEGAL_BOTTOMS) {
            const candidate = `(${t},${b})` + algBody;
            const result = window.algToShapeIndex(candidate);
            if (result.shapeIndex === canonicalShapeIdx) return candidate;
        }
    }
    return null;
}

function modalTryFixMirroredAngle(algBody, canonicalShapeIdx) {
    for (const t of MODAL_LEGAL_TOPS) {
        for (const b of MODAL_LEGAL_BOTTOMS) {
            const candidate = `/(6,6)/(${t},${b})` + algBody;
            const result = window.algToShapeIndex(candidate);
            if (result.shapeIndex === canonicalShapeIdx) return `(${t},${b})` + algBody;
        }
    }
    return null;
}

function modalStripBeforeFirstSlash(alg) {
    const firstSlash = alg.indexOf('/');
    if (firstSlash <= 0) return alg;
    return alg.slice(firstSlash);
}

function updateInputColorLive(input) {
    const alg = input.value.trim();
    if (!alg || alg === 'Done!') { input.style.color = ''; input.style.fontWeight = ''; return; }
    if (typeof window.algToShapeIndex === 'undefined' || typeof window.caleTracer === 'undefined' || typeof window.ScrambleNormalizer === 'undefined') { input.style.color = ''; return; }
    const modal = document.getElementById('editCaseModal');
    if (!modal) return;
    const caseName = _getEditModalCaseName(modal);
    const canonicalIdxStr = caseName ? shapeIndexMap[caseName] : null;
    const canonicalIdx = canonicalIdxStr !== undefined ? parseInt(canonicalIdxStr) : null;
    const caseShapeData = caseName ? getModalCaseShapeData(caseName) : null;
    const expanded = typeof expandForColorCheck === 'function' ? expandForColorCheck(alg) : alg;
    const normalized = window.ScrambleNormalizer.normalizeScramble(expanded);
    const result = window.algToShapeIndex(normalized);
    const idx = result.shapeIndex;
    const isDirectMatch = canonicalIdx !== null && idx === canonicalIdx;
    const isInOrg = caseShapeData && caseShapeData.org && caseShapeData.org.includes(idx);
    const isInMir = caseShapeData && caseShapeData.mir && caseShapeData.mir.includes(idx);
    if (isDirectMatch || isInOrg) {
        const setup = invertScramble(normalized);
        const parityText = window.caleTracer.getParityTextFromScramble(setup, { topColor: colorScheme.topColor, bottomColor: colorScheme.bottomColor, frontColor: colorScheme.frontColor, rightColor: colorScheme.rightColor, backColor: colorScheme.backColor, leftColor: colorScheme.leftColor }, cornerStickerMode);
        input.style.color = parityText === 'Odd' ? 'var(--parity-odd)' : 'var(--parity-even)';
        input.style.fontWeight = '600';
    } else if (isInMir) {
        const setup = invertScramble(normalized);
        const parityText = window.caleTracer.getParityTextFromScramble(setup, { topColor: colorScheme.topColor, bottomColor: colorScheme.bottomColor, frontColor: colorScheme.frontColor, rightColor: colorScheme.rightColor, backColor: colorScheme.backColor, leftColor: colorScheme.leftColor }, cornerStickerMode);
        input.style.color = parityText === 'Odd' ? 'var(--parity-odd-mirror)' : 'var(--parity-even-mirror)';
        input.style.fontWeight = '600';
    } else {
        input.style.color = 'var(--parity-invalid)';
        input.style.fontWeight = '600';
    }
}

// Helper to get case name from the edit case modal
function _getEditModalCaseName(modal) {
    if (!modal) return null;
    const titleElement = modal.querySelector('.modal-title');
    if (!titleElement) return null;
    for (const dataItem of data) {
        if (getDisplayName(dataItem.name) === titleElement.textContent || dataItem.name === titleElement.textContent) return dataItem.name;
    }
    return null;
}

// Helper function to color-code alg input on blur (after normalization)
function updateInputColor(input) {
    updateInputColorLive(input);
}

// Helper function to update parity label (legacy - kept for compatibility)
function updateParityLabel(input) {
    const parityLabel = input.parentElement.querySelector('.parity-label');
    if (!parityLabel) return;

    let alg = input.value.trim();
    if (!alg || alg === 'Done!') {
        parityLabel.textContent = '';
        parityLabel.style.color = '';
        parityLabel.style.fontWeight = '';
        return;
    }

    if (typeof window.algToShapeIndex === 'undefined' ||
        typeof window.caleTracer === 'undefined') {
        parityLabel.textContent = '';
        parityLabel.style.color = '';
        parityLabel.style.fontWeight = '';
        return;
    }

    try {
        // Get the case name from the modal title
        const modal = document.getElementById('editCaseModal');
        if (!modal) return;
        const titleElement = modal.querySelector('.modal-title');
        if (!titleElement) return;

        // Find the actual caseName key
        let caseName = null;
        for (const dataItem of data) {
            if (getDisplayName(dataItem.name) === titleElement.textContent || dataItem.name === titleElement.textContent) {
                caseName = dataItem.name;
                break;
            }
        }

        const canonicalIdxStr = caseName ? shapeIndexMap[caseName] : null;
        const canonicalIdx = canonicalIdxStr !== undefined ? parseInt(canonicalIdxStr) : null;
        const caseShapeData = caseName ? getModalCaseShapeData(caseName) : null;

        let result
        try {
            result = window.algToShapeIndex(alg);
        } catch (error) {
            // try again with double misalign end
            result = window.algToShapeIndex(alg + "(-1,1)");
            alg += "(-1,1)";
        }
        const resultShapeIndex = result.shapeIndex;

        const isDirectMatch = canonicalIdx !== null && resultShapeIndex === canonicalIdx;
        const isInOrg = caseShapeData && caseShapeData.org && caseShapeData.org.includes(resultShapeIndex);
        const isInMir = caseShapeData && caseShapeData.mir && caseShapeData.mir.includes(resultShapeIndex);

        if (isDirectMatch || isInOrg) {
            const setup = invertScramble(alg);
            const parityText = window.caleTracer.getParityTextFromScramble(setup, {
                topColor: colorScheme.topColor, bottomColor: colorScheme.bottomColor,
                frontColor: colorScheme.frontColor, rightColor: colorScheme.rightColor,
                backColor: colorScheme.backColor, leftColor: colorScheme.leftColor
            }, cornerStickerMode);

            if (isInOrg && !isDirectMatch && canonicalIdx !== null) {
                // Auto-fix angle on blur
                const algBody = modalStripBeforeFirstSlash(alg);
                const fixed = modalTryFixAngle(algBody, canonicalIdx);
                if (fixed) {
                    input.value = window.ScrambleNormalizer.normalizeScramble(fixed);
                }
            }

            parityLabel.textContent = parityText.toLowerCase();
            parityLabel.style.color = parityText === 'Odd' ? 'var(--parity-odd)' : 'var(--parity-even)';
            parityLabel.style.fontWeight = '600';

        } else if (isInMir) {
            const setup = invertScramble(alg);
            const parityText = window.caleTracer.getParityTextFromScramble(setup, {
                topColor: colorScheme.topColor, bottomColor: colorScheme.bottomColor,
                frontColor: colorScheme.frontColor, rightColor: colorScheme.rightColor,
                backColor: colorScheme.backColor, leftColor: colorScheme.leftColor
            }, cornerStickerMode);

            if (canonicalIdx !== null) {
                const algBody = modalStripBeforeFirstSlash(alg);
                const fixed = modalTryFixMirroredAngle(algBody, canonicalIdx);
                if (fixed) {
                    input.value = window.ScrambleNormalizer.normalizeScramble(fixed);
                }
            }

            parityLabel.textContent = parityText.toLowerCase() + ' (z2)';
            parityLabel.style.color = parityText === 'Odd' ? 'var(--parity-odd-mirror)' : 'var(--parity-even-mirror)';
            parityLabel.style.fontWeight = '600';

        } else {
            parityLabel.textContent = 'invalid';
            parityLabel.style.color = 'var(--parity-invalid)';
            parityLabel.style.fontWeight = '600';
        }
    } catch (error) {
        parityLabel.textContent = 'invalid';
        parityLabel.style.color = 'var(--parity-invalid)';
        parityLabel.style.fontWeight = '600';
    }
}

// Function to add new algorithm field
window.addNewAlgorithmField = function () {
    const algsList = document.getElementById('editAlgsList');
    if (!algsList) return;

    const newField = document.createElement('div');
    newField.style.cssText = 'display: flex; gap: 8px; align-items: center;';
    newField.innerHTML = `
        <input type="text" class="alg-input" value="" placeholder="Enter algorithm" data-original="" style="flex: 1; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; font-family: monospace; font-size: 0.9rem; font-weight: 600; transition: color 0.15s;">
        <button onclick="this.parentElement.remove()" style="padding: 6px; background: var(--delete-btn-bg); color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
            <img src="res/delete.svg" style="width: 16px; height: 16px;" alt="Delete">
        </button>
    `;

    algsList.appendChild(newField);

    const input = newField.querySelector('.alg-input');
    input.addEventListener('blur', () => {
        const rawText = input.value.trim();
        if (rawText && rawText !== 'Done!') {
            input.value = typeof expandAndNormalize === 'function' ? expandAndNormalize(rawText) : window.ScrambleNormalizer.normalizeScramble(rawText);
        }
        updateInputColor(input);
    });

    input.addEventListener('input', () => {
        updateInputColorLive(input);
    });

    input.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const currentValue = input.value;
        input.value = currentValue.substring(0, start) + text + currentValue.substring(end);
        input.selectionStart = input.selectionEnd = start + text.length;
    });

    input.focus();
};

// Function to open case rename modal
window.openCaseRenameModal = function (caseName, currentName, currentSubtitle = '') {
    const renameModal = document.createElement('div');
    renameModal.className = 'modal active';
    renameModal.id = 'caseRenameModal';
    renameModal.style.zIndex = '10002';
    renameModal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;
        ">
            <div class="modal-header">
                <span class="modal-title">Edit Case Name & Subtitle</span>
                <button class="close-btn" onclick="closeCaseRenameModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Custom Name:</label>
                    <input type="text" id="caseRenameInput" value="${currentName}" placeholder="Leave empty for default name" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 1rem;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Subtitle (optional):</label>
                    <input type="text" id="caseSubtitleRenameInput" value="${currentSubtitle}" placeholder="Enter a subtitle for this case" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 1rem;">
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="applyCaseRename('${caseName.replace(/'/g, "\\'")}' )" style="padding: 10px 20px; background: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; font-weight: 600;">OK</button>
                    <button onclick="closeCaseRenameModal()" style="padding: 10px 20px; background: var(--delete-btn-bg); color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(renameModal);

    setTimeout(() => {
        const input = document.getElementById('caseRenameInput');
        if (input) {
            input.focus();
            input.select();
        }
    }, 100);
};

window.closeCaseRenameModal = function () {
    const modal = document.getElementById('caseRenameModal');
    if (modal) modal.remove();
};

window.applyCaseRename = function (caseName) {
    const nameInput = document.getElementById('caseRenameInput');
    const subtitleInput = document.getElementById('caseSubtitleRenameInput');
    if (!nameInput || !subtitleInput) return;

    const newName = nameInput.value.trim();
    const newSubtitle = subtitleInput.value.trim();

    // Store in temporary variables for parent modal to use
    window.tempCaseRename = {
        caseName: caseName,
        newName: newName,
        newSubtitle: newSubtitle
    };

    // Update the title and subtitle in edit modal immediately
    const titleElement = document.getElementById('editCaseTitle');
    const subtitleElement = document.getElementById('editCaseSubtitle');

    if (titleElement) {
        titleElement.textContent = newName || defaultDisplayNames[caseName] || caseName;
    }

    if (subtitleElement) {
        if (newSubtitle) {
            subtitleElement.textContent = newSubtitle;
            subtitleElement.style.display = 'block';
        } else {
            subtitleElement.textContent = '';
            subtitleElement.style.display = 'none';
        }
    }

    closeCaseRenameModal();
};

window.saveCaseRename = function (caseName) {
    // This function is now called from saveEditedCase
    if (window.tempCaseRename && window.tempCaseRename.caseName === caseName) {
        const newName = window.tempCaseRename.newName;
        const newSubtitle = window.tempCaseRename.newSubtitle;

        if (newName) {
            displayNames[caseName] = newName;
        } else {
            displayNames[caseName] = defaultDisplayNames[caseName] || caseName;
        }

        if (newSubtitle) {
            perCaseSubtitles.set(caseName, newSubtitle);
        } else {
            perCaseSubtitles.delete(caseName);
        }

        window.tempCaseRename = null;
    }
};

function closeEditCaseModal() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('editCaseModal');
        if (modal) {
            modal.remove();
            document.documentElement.classList.remove('scroll-locked');
        }
    });
}

window.attemptCloseEditCaseModal = function () {
    const algInputs = document.querySelectorAll('#editAlgsList .alg-input');
    const originalAlgs = [];
    const modal = document.getElementById('editCaseModal');
    if (!modal) return;

    const titleElement = modal.querySelector('.modal-title');
    if (!titleElement) {
        closeEditCaseModal();
        return;
    }

    // Find the actual case by searching through data
    let item = null;
    for (const dataItem of data) {
        if (getDisplayName(dataItem.name) === titleElement.textContent || dataItem.name === titleElement.textContent) {
            item = dataItem;
            break;
        }
    }

    if (!item) {
        closeEditCaseModal();
        return;
    }

    const customAlgs = customAlgorithms.get(item.name);
    if (customAlgs) {
        originalAlgs.push(...(customAlgs.odd || []), ...(customAlgs.even || []));
    } else {
        originalAlgs.push(...(item.odd || []), ...(item.even || []));
    }

    const currentAlgs = Array.from(algInputs).map(input => input.value.trim()).filter(v => v);

    // Check if algorithms changed
    let algsChanged = false;
    if (originalAlgs.length !== currentAlgs.length) {
        algsChanged = true;
    } else {
        for (let i = 0; i < originalAlgs.length; i++) {
            if (originalAlgs[i] !== currentAlgs[i]) {
                algsChanged = true;
                break;
            }
        }
    }

    // Check if name/subtitle changed (tempCaseRename exists means changes were made)
    const nameChanged = !!(window.tempCaseRename && window.tempCaseRename.caseName === item.name);

    if (algsChanged || nameChanged) {
        showSaveDiscardConfirmation(
            'You have unsaved changes. Do you want to save them?',
            () => saveEditedCase(item.name),
            () => {
                window.tempCaseRename = null;
                closeEditCaseModal();
            },
            null
        );
    } else {
        window.tempCaseRename = null;
        closeEditCaseModal();
    }
};

window.showEditCaseInfoModal = function () {
    let infoModal = document.getElementById('editCaseInfoModal');
    if (!infoModal) {
        infoModal = document.createElement('div');
        infoModal.id = 'editCaseInfoModal';
        infoModal.className = 'training-info-modal';
        infoModal.innerHTML = `
            <div class="training-info-content">
                <div class="training-info-header">
                    <span class="training-info-title">Edit Case Guide</span>
                    <button class="training-info-close" onclick="closeEditCaseInfoModal()">&times;</button>
                </div>
                <div class="training-info-body">
                    <div class="training-info-item">
                        <div class="training-info-number">1</div>
                        <div class="training-info-text"><strong>Parity Labels:</strong> Each alg has a colored label to its right, indicating its parity. <span style="color: var(--parity-odd); font-weight: 600;">Green = Odd</span>, <span style="color: var(--parity-even); font-weight: 600;">Blue = Even</span>. <span style="color: var(--parity-invalid); font-weight: 600;">Red = Invalid</span>. (Your alg doesn't match this case at all. Double-check your input for typos or missing slices.) The label disappears while editing and reappears when you click away.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">2</div>
                        <div class="training-info-text"><strong>Auto-Normalization:</strong> When you finish editing an alg (click away from the input), it's automatically normalized to standard notation. Formatting will be standardized, and if your alg solves the z2 case, it will be marked with a "(mirrored)" tag.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">3</div>
                        <div class="training-info-text"><strong>Remember to Save:</strong> All changes (including name/subtitle edits) are only saved when you click "Save Changes" at the bottom.</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(infoModal);
    }

    pushModalState('editCaseInfoModal', closeEditCaseInfoModal);
    infoModal.classList.add('active');
};

window.closeEditCaseInfoModal = function () {
    closeModalWithHistory(() => {
        const modal = document.getElementById('editCaseInfoModal');
        if (modal) {
            modal.classList.remove('active');
        }
    });
};

function saveEditedCase(caseName) {
    // Save name and subtitle from temp rename
    saveCaseRename(caseName);

    const algInputs = document.querySelectorAll('#editAlgsList .alg-input');

    // Collect all algorithms
    const allAlgs = Array.from(algInputs).map(input => input.value.trim()).filter(v => v);

    // Save custom algorithms
    if (allAlgs.length > 0) {
        customAlgorithms.set(caseName, {
            odd: [],
            even: allAlgs
        });
    } else {
        customAlgorithms.delete(caseName);
    }

    saveState();

    // Recalculate parity
    calculateAndCacheAllParity();

    render();
    closeEditCaseModal();
    showToast('Case updated successfully!', 2000, 'success');
}

function openCustomizeSVGsModal() {
    closeSettingsModal();
    SVGEditor.open();
}

function openNotesModal(caseName) {
    const comment = comments.get(caseName) || '';
    window.originalNoteContent = comment; // Store original for comparison

    // Close any existing context menu
    const existingMenu = document.getElementById('caseContextMenu');
    if (existingMenu) existingMenu.remove();

    pushModalState('notesModal', closeNotesModal);

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'notesModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px; max-height: 80vh; min-height: 20vh;">
            <div class="modal-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="modal-title">Notes: ${getDisplayName(caseName)}</span>
                    <button onclick="showNotesInfoModal()" style="background: var(--surface2); border: 1px solid var(--border-color); color: var(--text-secondary); cursor: pointer; padding: 6px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; width: 32px; height: 32px;" title="Help" onmouseover="this.style.background='var(--surface-border)'" onmouseout="this.style.background='var(--surface2)'">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    </button>
                </div>
                <button class="close-btn" onclick="attemptCloseNotesModal('${caseName.replace(/'/g, "\\'")}' )">&times;</button>
            </div>
            <div class="modal-body">
                <textarea id="notesTextarea" style="width: 100%; height: 200px; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; font-family: inherit; resize: vertical;">${comment}</textarea>
                <div style="text-align: center; margin-top: 15px;">
                    <button onclick="saveNotes('${caseName.replace(/'/g, "\\'")}' )" style="padding: 10px 20px; background: var(--bar-learned); color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; font-weight: 600;">Save</button>
                    <button onclick="attemptCloseNotesModal('${caseName.replace(/'/g, "\\'")}' )" style="padding: 10px 20px; background: var(--delete-btn-bg); color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                </div>
            </div>
        </div>
    `;

    // Cancel any pending render before locking scroll
    if (typeof renderTimeout !== 'undefined' && renderTimeout) {
        clearTimeout(renderTimeout);
        renderTimeout = null;
    }
    window.modalScrollY = window.scrollY;
    document.body.style.top = `-${window.modalScrollY}px`;
    document.documentElement.classList.add('scroll-locked');
    document.body.appendChild(modal);
}

window.attemptCloseNotesModal = function (caseName) {
    const textarea = document.getElementById('notesTextarea');
    const currentContent = textarea ? textarea.value.trim() : '';
    const originalContent = window.originalNoteContent || '';

    if (currentContent !== originalContent) {
        showSaveDiscardConfirmation(
            'You have unsaved changes. Do you want to save them?',
            () => saveNotes(caseName),
            () => {
                window.originalNoteContent = null;
                closeNotesModal();
            },
            null
        );
    } else {
        closeNotesModal();
    }
};

window.showNotesInfoModal = function () {
    let infoModal = document.getElementById('notesInfoModal');
    if (!infoModal) {
        infoModal = document.createElement('div');
        infoModal.id = 'notesInfoModal';
        infoModal.className = 'training-info-modal';
        infoModal.innerHTML = `
            <div class="training-info-content">
                <div class="training-info-header">
                    <span class="training-info-title">Notes Guide</span>
                    <button class="training-info-close" onclick="closeNotesInfoModal()">&times;</button>
                </div>
                <div class="training-info-body">
                    <div class="training-info-item">
                        <div class="training-info-number">1</div>
                        <div class="training-info-text"><strong>Text Formatting:</strong> Notes support basic HTML formatting:<br>
                        • <b>Bold</b>: <code>&lt;b&gt;bold&lt;/b&gt;</code> or <code>&lt;strong&gt;bold&lt;/strong&gt;</code><br>
                        • <i>Italic</i>: <code>&lt;i&gt;italic&lt;/i&gt;</code> or <code>&lt;em&gt;italic&lt;/em&gt;</code><br>
                        • <u>Underline</u>: <code>&lt;u&gt;underline&lt;/u&gt;</code><br>
                        • <s>Strikethrough</s>: <code>&lt;s&gt;strikethrough&lt;/s&gt;</code><br>
                        • <span style="color:red;">Colored Text</span>: <code>&lt;font color="red"&gt;colored text&lt;/font&gt;</code><br>
                        • <code>&lt;br&gt;</code> for line breaks<br>
                        • <code>&lt;a href="url"&gt;link&lt;/a&gt;</code> for <span role="button" tabindex="0" onclick="return false" onkeydown="return false" onmousedown="this.style.color='purple'" onmouseup="this.style.color='#00f'" onmouseleave="this.style.color='#00f'" style="color:#00f;text-decoration:underline;cursor:pointer;user-select:none;">links</span><br> <br>
                    <strong>Preset makers, write notes with text formattings!! It's so much easier to read.</strong></div>

                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">2</div>
                        <div class="training-info-text">If you want to write notes that involve <b>more than one case</b>, consider using general notes (inside the menu bar) instead.</div>
                    </div>

                    <div class="training-info-item">
                        <div class="training-info-number">3</div>
                        <div class="training-info-text"><strong>Notes suggestions:</strong><br>
                        • Something short that reminds you of either the algs or the evilness.<br>
                        • Or you can write whatever floats your boat... have fun<br></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(infoModal);
    }

    pushModalState('notesInfoModal', closeNotesInfoModal);
    infoModal.classList.add('active');
};

window.closeNotesInfoModal = function () {
    closeModalWithHistory(() => {
        const modal = document.getElementById('notesInfoModal');
        if (modal) {
            modal.classList.remove('active');
        }
    });
};

function closeNotesModal() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('notesModal');
        if (modal) {
            modal.remove();
            document.documentElement.classList.remove('scroll-locked');
        }
    });
}

function saveNotes(caseName) {
    const textarea = document.getElementById('notesTextarea');
    const noteText = textarea.value.trim();

    if (noteText) {
        // Store raw HTML
        comments.set(caseName, noteText);
    } else {
        comments.delete(caseName);
    }

    saveState();
    render();
    closeNotesModal();
}

// General Notes Modal Functions
window.openGeneralNotesModal = function() {
    const existingMenu = document.getElementById('caseContextMenu');
    if (existingMenu) existingMenu.remove();

    pushModalState('generalNotesModal', closeGeneralNotesModal);

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'generalNotesModal';
    document.body.appendChild(modal);
    // Force reflow THEN activate to ensure fixed positioning is applied before any layout
    modal.getBoundingClientRect();
    modal.classList.add('active');
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px; max-height: 85vh; height: 85vh; display: flex; flex-direction: column;">
            <div class="modal-header" style="flex-shrink: 0;">
                <span class="modal-title">General Notes</span>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button id="editGeneralNotesBtn" onclick="toggleEditGeneralNotes()" style="padding: 6px 16px; background: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">Edit</button>
                    <button id="saveGeneralNotesBtn" onclick="saveGeneralNotes()" style="padding: 6px 16px; background: var(--bar-learned); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.9rem; display: none;">Save</button>
                    <button id="generalNotesInfoBtn" onclick="showGeneralNotesInfoModal()" style="background: var(--surface2); border: 1px solid var(--border-color); color: var(--text-secondary); cursor: pointer; padding: 6px; border-radius: 8px; display: none; align-items: center; justify-content: center; transition: all 0.2s; width: 32px; height: 32px;" title="Help" onmouseover="this.style.background='var(--surface-border)'" onmouseout="this.style.background='var(--surface2)'">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    </button>
                    <button class="close-btn" onclick="attemptCloseGeneralNotesModal()">&times;</button>
                </div>
            </div>
            <div class="modal-body" style="flex: 1; overflow: hidden; display: flex; flex-direction: column; padding: 0;">
                <div id="generalNotesView" style="flex: 1; padding: 20px; overflow-y: auto;"></div>
                <div id="generalNotesEdit" style="flex: 1; display: none; flex-direction: column; padding: 20px; overflow: hidden;">
                    <textarea id="generalNotesTextarea" style="flex: 1; width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; font-family: 'Courier New', monospace; font-size: 0.9rem; resize: none; overflow-y: auto;"></textarea>
                </div>
            </div>
        </div>
    `;

    // Debug: watch for card size changes
    const firstCard = document.querySelector('.card');
    if (firstCard) {
        const ro = new ResizeObserver(entries => {
            for (const entry of entries) {
            }
        });
        ro.observe(firstCard);
        modal._resizeObserver = ro;
    }

    // Render the saved content
    renderGeneralNotes();
}

function closeGeneralNotesModal() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('generalNotesModal');
        if (modal) {
            if (modal._resizeObserver) modal._resizeObserver.disconnect();
            modal.remove();
        }
    });
}

function renderGeneralNotes() {
    const viewDiv = document.getElementById('generalNotesView');
    if (!viewDiv) return;

    if (generalNotes.trim()) {
        const isFullHTML = /<!DOCTYPE|<html/i.test(generalNotes);
        if (isFullHTML) {
            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'width: 100%; height: 100%; border: none; min-height: 400px;';
            iframe.sandbox = 'allow-same-origin allow-scripts';
            viewDiv.innerHTML = '';
            viewDiv.style.padding = '0';
            viewDiv.appendChild(iframe);
            iframe.contentDocument.open();
            iframe.contentDocument.write(generalNotes);
            iframe.contentDocument.close();

            // Stamp theme onto the iframe root and inject CSS vars
            const theme = document.documentElement.getAttribute('data-theme') || 'light';
            iframe.contentDocument.documentElement.setAttribute('data-theme', theme);

            const themeStyle = iframe.contentDocument.createElement('style');
            themeStyle.id = 'sqg-theme-vars';
            themeStyle.textContent = `
                :root {
                    --background: ${getComputedStyle(document.documentElement).getPropertyValue('--background')};
                    --surface:    ${getComputedStyle(document.documentElement).getPropertyValue('--surface')};
                    --text-primary:   ${getComputedStyle(document.documentElement).getPropertyValue('--text-primary')};
                    --text-secondary: ${getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')};
                    --accent:     ${getComputedStyle(document.documentElement).getPropertyValue('--accent')};
                    --border-color: ${getComputedStyle(document.documentElement).getPropertyValue('--border-color')};
                    --surface-border: ${getComputedStyle(document.documentElement).getPropertyValue('--surface-border')};
                }
                body {
                    background: var(--background);
                    color: var(--text-primary);
                }
                a { color: var(--accent); }
            `;
            iframe.contentDocument.head.appendChild(themeStyle);
        } else {
            viewDiv.innerHTML = generalNotes;
        }
    } else {
        viewDiv.innerHTML = '<p style="color: var(--text-muted); font-style: italic; text-align: center;">No notes yet. Click Edit to add your first note!</p>';
    }
}

window.toggleEditGeneralNotes = function() {
    const viewDiv = document.getElementById('generalNotesView');
    const editDiv = document.getElementById('generalNotesEdit');
    const textarea = document.getElementById('generalNotesTextarea');
    const editBtn = document.getElementById('editGeneralNotesBtn');
    const saveBtn = document.getElementById('saveGeneralNotesBtn');
    const infoBtn = document.getElementById('generalNotesInfoBtn');

    // Switch to edit mode
    viewDiv.style.display = 'none';
    editDiv.style.display = 'flex';
    textarea.value = generalNotes;
    window.originalGeneralNotes = generalNotes;
    editBtn.style.display = 'none';
    saveBtn.style.display = 'block';
    if (infoBtn) infoBtn.style.display = 'flex';
}

window.attemptSwitchToViewMode = function() {
    const textarea = document.getElementById('generalNotesTextarea');
    const currentContent = textarea ? textarea.value : '';
    const originalContent = window.originalGeneralNotes || '';

    if (currentContent !== originalContent) {
        showSaveDiscardConfirmation(
            'You have unsaved changes. Do you want to save them?',
            () => {
                saveGeneralNotes();
                switchToViewMode();
            },
            () => {
                window.originalGeneralNotes = null;
                switchToViewMode();
            },
            null
        );
    } else {
        switchToViewMode();
    }
}

function switchToViewMode() {
    const viewDiv = document.getElementById('generalNotesView');
    const editDiv = document.getElementById('generalNotesEdit');
    const editBtn = document.getElementById('editGeneralNotesBtn');
    const saveBtn = document.getElementById('saveGeneralNotesBtn');
    const infoBtn = document.getElementById('generalNotesInfoBtn');

    viewDiv.style.display = 'block';
    editDiv.style.display = 'none';
    if (editBtn) { editBtn.style.display = 'block'; }
    saveBtn.style.display = 'none';
    if (infoBtn) infoBtn.style.display = 'none';
    renderGeneralNotes();
}

function saveGeneralNotes() {
    const textarea = document.getElementById('generalNotesTextarea');
    generalNotes = textarea.value;
    window.originalGeneralNotes = generalNotes;
    saveState();
    switchToViewMode();
    showToast('Notes saved!', 2000, 'success');
}

window.attemptCloseGeneralNotesModal = function () {
    const viewDiv = document.getElementById('generalNotesView');
    if (viewDiv && viewDiv.style.display === 'none') {
        // In edit mode
        const textarea = document.getElementById('generalNotesTextarea');
        const currentContent = textarea ? textarea.value : '';
        const originalContent = window.originalGeneralNotes || '';

        if (currentContent !== originalContent) {
            showSaveDiscardConfirmation(
                'You have unsaved changes. Do you want to save them?',
                () => {
                    saveGeneralNotes();
                    closeGeneralNotesModal();
                },
                () => {
                    window.originalGeneralNotes = null;
                    closeGeneralNotesModal();
                },
                null
            );
        } else {
            closeGeneralNotesModal();
        }
    } else {
        closeGeneralNotesModal();
    }
};

window.showGeneralNotesInfoModal = function () {
    let infoModal = document.getElementById('generalNotesInfoModal');
    if (!infoModal) {
        infoModal = document.createElement('div');
        infoModal.id = 'generalNotesInfoModal';
        infoModal.className = 'training-info-modal';
        infoModal.innerHTML = `
            <div class="training-info-content" style="max-width: 600px;">
                <div class="training-info-header">
                    <span class="training-info-title">General Notes Edit Guild</span>
                    <button class="training-info-close" onclick="closeGeneralNotesInfoModal()">&times;</button>
                </div>
                <div class="training-info-body" style="max-height: 70vh; overflow-y: auto;">
                    <p>This editor supports <strong>HTML, CSS, Javascript &amp; SVG</strong>. If you are not sure what you are doing, Write plain text instead.</p><br>
                    <h3>Here is a quick HTML formatting guide:</h3> <br>
                    <div class="training-info-item">
                        <div class="training-info-number">1</div>
                        <div class="training-info-text"><strong>Bold Text:</strong> <code>&lt;strong&gt;Your text&lt;/strong&gt;</code> or <code>&lt;b&gt;Your text&lt;/b&gt;</code></div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">2</div>
                        <div class="training-info-text"><strong>Italic Text:</strong> <code>&lt;em&gt;Your text&lt;/em&gt;</code> or <code>&lt;i&gt;Your text&lt;/i&gt;</code></div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">3</div>
                        <div class="training-info-text"><strong>Headings:</strong> <code>&lt;h1&gt;Large Heading&lt;/h1&gt;</code>, <code>&lt;h2&gt;Medium Heading&lt;/h2&gt;</code>, <code>&lt;h3&gt;Small Heading&lt;/h3&gt;</code></div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">4</div>
                        <div class="training-info-text"><strong>Paragraphs:</strong> <code>&lt;p&gt;Your paragraph text&lt;/p&gt;</code></div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">5</div>
                        <div class="training-info-text"><strong>Line Break:</strong> <code>&lt;br&gt;</code> (no closing tag needed)</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">6</div>
                        <div class="training-info-text"><strong>Links:</strong> <code>&lt;a href="https://example.com"&gt;Link text&lt;/a&gt;</code></div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">7</div>
                        <div class="training-info-text"><strong>Lists:</strong> <code>&lt;ul&gt;&lt;li&gt;Item 1&lt;/li&gt;&lt;li&gt;Item 2&lt;/li&gt;&lt;/ul&gt;</code> for bullet points</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">8</div>
                        <div class="training-info-text"><strong>Colored Text:</strong> <code>&lt;span style="color: red;"&gt;Red text&lt;/span&gt;</code></div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">9</div>
                        <div class="training-info-text"><strong>Horizontal Line:</strong> <code>&lt;hr&gt;</code> (no closing tag needed)</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">10</div>
                        <div class="training-info-text"><strong>Code/Monospace:</strong> <code>&lt;code&gt;monospace text&lt;/code&gt;</code></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(infoModal);
    }

    pushModalState('generalNotesInfoModal', closeGeneralNotesInfoModal);
    infoModal.classList.add('active');
};

window.closeGeneralNotesInfoModal = function () {
    closeModalWithHistory(() => {
        const modal = document.getElementById('generalNotesInfoModal');
        if (modal) {
            modal.classList.remove('active');
        }
    });
};

// Info button click handlers with fixed positioning - use CAPTURE phase to intercept before parent buttons
document.addEventListener("mousedown", (e) => {
    // Check if clicking on info button or its child
    const infoBtn = e.target.closest(".settings-info-btn");

    if (infoBtn) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
    }
}, true); // TRUE = capture phase

document.addEventListener("click", (e) => {
    // If clicking on info button or its child img, handle info display
    const infoBtn = e.target.closest(".settings-info-btn");

    if (infoBtn) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Find the info box - check wrapper structure
        const wrapper = infoBtn.closest('.info-wrapper');
        let infoBox = wrapper ? wrapper.querySelector('.info-box') : infoBtn.nextElementSibling;

        if (!infoBox || !infoBox.classList.contains("info-box")) {
            return false;
        }

        // Check if this specific info box is already showing
        const isAlreadyShowing = infoBox.classList.contains("show");

        // Close all info boxes and restore them first
        document.querySelectorAll(".info-box.show").forEach(box => {
            box.classList.remove("show");

            // Restore to original parent
            if (box.dataset.originalParentId) {
                const originalParent = document.getElementById(box.dataset.originalParentId);
                if (originalParent && box.parentElement !== originalParent) {
                    originalParent.appendChild(box);
                }
            }
        });

        // If it was already showing, we're done (toggle off)
        if (isAlreadyShowing) {
            return false;
        }

        // Store original parent if not already stored
        if (!infoBox.dataset.originalParent) {
            infoBox.dataset.originalParentId = infoBox.parentElement.id || 'wrapper_' + Math.random().toString(36).substr(2, 9);
            if (!infoBox.parentElement.id) {
                infoBox.parentElement.id = infoBox.dataset.originalParentId;
            }
        }

        // Move info box to body for proper fixed positioning
        document.body.appendChild(infoBox);

        infoBox.classList.add("show");

        // Position the info box
        requestAnimationFrame(() => {
            const buttonRect = infoBtn.getBoundingClientRect();
            const infoBoxRect = infoBox.getBoundingClientRect();

            let top = buttonRect.top - infoBoxRect.height - 5;
            let left = buttonRect.right - infoBoxRect.width;

            // Adjust if goes off top of screen
            if (top < 10) {
                top = buttonRect.bottom + 5;
            }

            // Adjust if goes off left of screen
            if (left < 10) {
                left = 10;
            }

            // Adjust if goes off right of screen
            if (left + infoBoxRect.width > window.innerWidth - 10) {
                left = window.innerWidth - infoBoxRect.width - 10;
            }

            // Adjust if goes off bottom of screen
            if (top + infoBoxRect.height > window.innerHeight - 10) {
                top = window.innerHeight - infoBoxRect.height - 10;
            }

            infoBox.style.top = top + 'px';
            infoBox.style.left = left + 'px';
        });

        return false;
    }

    // If clicking on info box itself, don't close it
    if (e.target.classList.contains("info-box") || e.target.closest(".info-box")) {
        e.stopPropagation();
        return;
    }

    // Close all info boxes and restore them to original positions
    document.querySelectorAll(".info-box.show").forEach(box => {
        box.classList.remove("show");

        // Restore to original parent
        if (box.dataset.originalParentId) {
            const originalParent = document.getElementById(box.dataset.originalParentId);
            if (originalParent && box.parentElement !== originalParent) {
                originalParent.appendChild(box);
            }
        }
    });
}, true); // TRUE = capture phase

// Toast notification system
window.showToast = function (message, duration = 3000, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-notification--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('toast-notification--visible'), 10);

    setTimeout(() => {
        toast.classList.remove('toast-notification--visible');
        setTimeout(() => toast.remove(), 300);
    }, duration);
};

// Confirmation modal
window.showConfirmation = function (message, onConfirm, onCancel) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.cssText = 'z-index: 10001; display: flex; align-items: center; justify-content: center;';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px; margin: 0;">
            <div class="modal-header">
                <span class="modal-title">Confirm Action</span>
            </div>
            <div class="modal-body">
                <p style="margin: 0; font-size: 1rem; line-height: 1.6;">${message}</p>
                <div style="display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;">
                    <button id="confirmCancel" class="confirm-btn confirm-btn--neutral">Cancel</button>
                    <button id="confirmOk" class="confirm-btn confirm-btn--primary">OK</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.documentElement.classList.add('scroll-locked');

    document.getElementById('confirmOk').onclick = () => {
        modal.remove();
        document.documentElement.classList.remove('scroll-locked');
        if (onConfirm) onConfirm();
    };

    document.getElementById('confirmCancel').onclick = () => {
        modal.remove();
        document.documentElement.classList.remove('scroll-locked');
        if (onCancel) onCancel();
    };
};

// Three-button confirmation modal (Save/Discard/Cancel)
window.showSaveDiscardConfirmation = function (message, onSave, onDiscard, onCancel) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.cssText = 'z-index: 10001; display: flex; align-items: center; justify-content: center;';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px; margin: 0;">
            <div class="modal-header">
                <span class="modal-title">Unsaved Changes</span>
            </div>
            <div class="modal-body">
                <p style="margin: 0; font-size: 1rem; line-height: 1.6;">${message}</p>
                <div style="display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;">
                    <button id="confirmCancel"  class="confirm-btn confirm-btn--neutral">Cancel</button>
                    <button id="confirmDiscard" class="confirm-btn confirm-btn--neutral">Discard</button>
                    <button id="confirmSave"    class="confirm-btn confirm-btn--neutral">Save</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.documentElement.classList.add('scroll-locked');

    document.getElementById('confirmSave').onclick = () => {
        modal.remove();
        document.documentElement.classList.remove('scroll-locked');
        if (onSave) onSave();
    };

    document.getElementById('confirmDiscard').onclick = () => {
        modal.remove();
        document.documentElement.classList.remove('scroll-locked');
        if (onDiscard) onDiscard();
    };

    document.getElementById('confirmCancel').onclick = () => {
        modal.remove();
        document.documentElement.classList.remove('scroll-locked');
        if (onCancel) onCancel();
    };
};

// Desktop Profile Modal Functions (Popup style - same logic as algorithm popup)
let activeProfilePopup = null;
let activeProfilePopupElement = null;

function showProfilePopup(isPermanent) {
    const profileBtn = document.getElementById('profileBtn');
    const popup = document.getElementById('profileModalDesktop');
    if (!profileBtn || !popup) return;

    // If clicking on already active popup element, close it
    if (isPermanent && activeProfilePopupElement === profileBtn) {
        hideProfilePopup(true);
        return;
    }

    // Close any existing popup if opening a new permanent one
    if (isPermanent && activeProfilePopup) {
        activeProfilePopup.classList.remove('active');
        activeProfilePopup = null;
        activeProfilePopupElement = null;
    }

    // Don't show hover popup if there's already a permanent popup
    if (!isPermanent && activeProfilePopup && activeProfilePopupElement !== profileBtn) {
        return;
    }

    popup.classList.remove('active'); // Reset first
    popup.className = 'profile-popup-desktop' + (isPermanent ? ' permanent' : '');
    popup.classList.add('active');

    // Position the popup
    const rect = profileBtn.getBoundingClientRect();
    const popupContent = popup.querySelector('.profile-popup-content');

    setTimeout(() => {
        const popupRect = popupContent.getBoundingClientRect();

        let top = rect.bottom + 15;
        let left = window.innerWidth - popupRect.width - 20;

        if (top + popupRect.height > window.innerHeight - 10) {
            top = rect.top - popupRect.height - 15;
        }
        if (top < 10) top = 10;
        if (left < 10) left = 10;

        popupContent.style.top = top + 'px';
        popupContent.style.left = left + 'px';
    }, 0);

    updateProfileStats();
    applyProfileUI();

    const scrollHandler = () => {
        hideProfilePopup(isPermanent);
        window.removeEventListener('scroll', scrollHandler, true);
    };
    window.addEventListener('scroll', scrollHandler, true);

    if (isPermanent) {
        activeProfilePopup = popup;
        activeProfilePopupElement = profileBtn;

        setTimeout(() => {
            const clickHandler = (e) => {
                const popupContent = popup.querySelector('.profile-popup-content');
                if (!popupContent.contains(e.target) && e.target !== profileBtn) {
                    hideProfilePopup(true);
                    document.removeEventListener('mousedown', clickHandler);
                }
            };
            document.addEventListener('mousedown', clickHandler);
        }, 100);
    }
}

function hideProfilePopup(isPermanent) {
    const popup = document.getElementById('profileModalDesktop');
    if (!popup) return;

    if (isPermanent) {
        if (activeProfilePopup) {
            popup.classList.remove('active');
            activeProfilePopup = null;
            activeProfilePopupElement = null;
        }
    } else {
        if (!popup.classList.contains('permanent')) {
            popup.classList.remove('active');
        }
    }
}

// Wrapper functions for compatibility
function openProfileModalDesktop(isPermanent = false) {
    showProfilePopup(isPermanent);
}

function closeProfileModalDesktop(isPermanent = false) {
    hideProfilePopup(isPermanent);
}

// Mobile Profile Modal Functions (Full modal style)
function openProfileModalMobile() {
    const modal = document.getElementById('profileModalMobile');
    if (!modal) return;

    pushModalState('profileModalMobile', closeProfileModalMobile);

    window.modalScrollY = window.scrollY;
    document.body.style.top = `-${window.modalScrollY}px`;
    document.documentElement.classList.add('scroll-locked');
    modal.classList.add('active');

    updateProfileStats();
    applyProfileUI();
}

function closeProfileModalMobile() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('profileModalMobile');
        if (modal) {
            modal.classList.remove('active');
            document.documentElement.classList.remove('scroll-locked');
        }
    });
}

// Unified function that detects device type
function openProfileModal() {
    const isMobile = window.innerWidth <= 620;
    if (isMobile) {
        openProfileModalMobile();
    } else {
        openProfileModalDesktop(true); // Open as permanent (clicked)
    }
}

// Make functions globally accessible
window.openProfileModal = openProfileModal;
window.openProfileModalDesktop = openProfileModalDesktop;
window.closeProfileModalDesktop = closeProfileModalDesktop;
window.openProfileModalMobile = openProfileModalMobile;
window.closeProfileModalMobile = closeProfileModalMobile;

const AVATARS = [
    'res/avatar.svg',
    'res/avatar/1.svg',
    'res/avatar/2.svg',
    'res/avatar/3.svg',
    'res/avatar/4.svg',
    'res/avatar/5.svg',
    'res/avatar/6.svg',
    'res/avatar/7.svg',
    'res/avatar/8.svg',
];

let tempSelectedAvatar = null;

function applyProfileUI() {
    // Update floating button
    const btnAvatar = document.getElementById('profileBtnAvatar');
    if (btnAvatar) btnAvatar.src = profileAvatar;
    // Update desktop view
    const deskAvatar = document.getElementById('profileAvatarDesktop');
    if (deskAvatar) deskAvatar.src = profileAvatar;
    const deskName = document.getElementById('profileNameDesktop');
    if (deskName) deskName.textContent = profileName;
    // Update mobile view
    const mobAvatar = document.getElementById('profileAvatarMobile');
    if (mobAvatar) mobAvatar.src = profileAvatar;
    const mobTitle = document.getElementById('profileNameMobileTitle');
    if (mobTitle) mobTitle.textContent = profileName;
}

function buildAvatarGrid(mode) {
    const grid = document.getElementById(`avatarGrid${mode}`);
    if (!grid) return;
    grid.innerHTML = '';
    AVATARS.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'avatar-option' + ((tempSelectedAvatar || profileAvatar) === src ? ' selected' : '');
        img.onclick = () => {
            tempSelectedAvatar = src;
            grid.querySelectorAll('img').forEach(i => i.classList.remove('selected'));
            img.classList.add('selected');
        };
        grid.appendChild(img);
    });
}

window.switchToEditProfile = function(mode) {
    tempSelectedAvatar = profileAvatar;
    document.getElementById(`profileView${mode}`).style.display = 'none';
    document.getElementById(`profileEdit${mode}`).style.display = 'block';
    const nameInput = document.getElementById(`profileNameInput${mode}`);
    if (nameInput) nameInput.value = profileName === 'Profile' ? '' : profileName;
    buildAvatarGrid(mode);
};

window.switchToViewProfile = function(mode) {
    tempSelectedAvatar = null;
    document.getElementById(`profileEdit${mode}`).style.display = 'none';
    document.getElementById(`profileView${mode}`).style.display = 'block';
};

window.saveProfileEdit = function(mode) {
    const nameInput = document.getElementById(`profileNameInput${mode}`);
    const newName = nameInput ? nameInput.value.trim() : '';
    profileName = newName || 'Profile';
    profileAvatar = tempSelectedAvatar || profileAvatar;
    localStorage.setItem('profileName', profileName);
    localStorage.setItem('profileAvatar', profileAvatar);
    tempSelectedAvatar = null;
    applyProfileUI();
    switchToViewProfile(mode);
    showToast('Profile saved!', 2000, 'success');
};

function updateProfileStats() {
    const totalCases = data.length;
    const learnedCount = learnedCases.size;
    const learningCount = learningCases.size;
    const learnedPercent = (learnedCount / totalCases) * 100;
    const learningPercent = (learningCount / totalCases) * 100;

    const totalProbability = data.reduce((sum, item) => sum + item.probability, 0);
    const learnedProbability = data
        .filter(item => learnedCases.has(item.name))
        .reduce((sum, item) => sum + item.probability, 0);

    const coverage = Math.round((learnedProbability / totalProbability) * 100 * 2) / 2;
    const safety = 50 + (coverage / 2);

    // Update both desktop and mobile modals
    const modes = ['Desktop', 'Mobile'];
    modes.forEach(mode => {
        const learningBar = document.getElementById(`profileLearningProgress${mode}`);
        const learnedBar = document.getElementById(`profileLearnedProgress${mode}`);
        const learnedText = document.getElementById(`profileLearnedText${mode}`);
        const coverageProgress = document.getElementById(`profileCoverageProgress${mode}`);
        const coverageText = document.getElementById(`profileCoverageText${mode}`);
        const safetyProgress = document.getElementById(`profileSafetyProgress${mode}`);
        const safetyText = document.getElementById(`profileSafetyText${mode}`);

        if (learningBar) {
            learningBar.style.width = (learnedPercent + learningPercent) + '%';
        }

        if (learnedBar) {
            learnedBar.style.width = learnedPercent + '%';
        }

        if (learnedText) {
            learnedText.textContent = learnedCount + '/90';
        }

        if (coverageProgress) {
            coverageProgress.style.width = coverage + '%';
        }

        if (coverageText) {
            coverageText.textContent = coverage.toFixed(1) + '%';
        }

        if (safetyProgress) {
            safetyProgress.style.width = safety + '%';
        }

        if (safetyText) {
            safetyText.textContent = safety.toFixed(1) + '%';
        }
    });
}

// About Modal Functions
window.openAboutModal = function() {
    const modal = document.getElementById('aboutModal');

    window.modalScrollY = window.scrollY;
    document.body.style.top = `-${window.modalScrollY}px`;
    document.documentElement.classList.add('scroll-locked');
    modal.classList.add('active');

    pushModalState('aboutModal', closeAboutModal);
}

function closeAboutModal() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('aboutModal');
        modal.classList.remove('active');
        document.documentElement.classList.remove('scroll-locked');
    });
}

// Function to open parity tracing personalization from settings
function openParityTracingPersonalization() {
    closeSettingsModal();

    // Call the config modal directly via the exported library function
    if (typeof window.ParityTracerLibrary === 'undefined' || !window.ParityTracerLibrary.openConfigModal) {
        showToast('Configuration modal not available', 3000, 'error');
        return;
    }

    const config = {
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#ffffff',
        hideInstructionButton: hideInstructions,
        instructionText1: 'Enter your scramble in the top input bar and press Analyze to trace parity using Cale\'s method.',
        instructionText2: 'You can change the color scheme from Color Scheme Settings in the main Settings menu.',
        instructionText3: 'Customize the tracing start point from the settings button at the bottom right.',
        tlMainCol: colorScheme.topColor,
        tlColName: getColorName(colorScheme.topColor),
        tlColAbb: getColorName(colorScheme.topColor).charAt(0),
        blMainCol: colorScheme.bottomColor,
        blColName: getColorName(colorScheme.bottomColor),
        blColAbb: getColorName(colorScheme.bottomColor).charAt(0),
        frontCol: colorScheme.frontColor,
        rightCol: colorScheme.rightColor,
        backCol: colorScheme.backColor,
        leftCol: colorScheme.leftColor
    };

    window.ParityTracerLibrary.openConfigModal(null, config, null, null, null);
}

// Sidebar functions
function generateSidebarHTML() {
    let sidebar = document.getElementById('appSidebar');
    if (sidebar) return; // Already exists

    sidebar = document.createElement('div');
    sidebar.id = 'appSidebar';
    sidebar.className = 'app-sidebar';
    sidebar.innerHTML = `
        <div class="sidebar-overlay" onclick="closeSidebar()"></div>
        <div class="sidebar-content">
            <div class="sidebar-header">
                <h2 style="margin: 0; font-size: 1.3rem; font-weight: 700; color: var(--text-ui);">Menu</h2>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button class="sidebar-close-btn instruction-btn" onclick="event.stopPropagation(); showHomepageInfoModal();" aria-label="Instructions" style="color: var(--text-secondary);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    </button>
                    <button class="sidebar-close-btn" onclick="closeSidebar()" aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px;">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="sidebar-body">
                <button class="sidebar-item sidebar-mobile-only" onclick="openProfileModal(); closeSidebar();">
                    <img src="res/avatar.svg" alt="Profile">
                    <span>Profile</span>
                </button>
                <button class="sidebar-item" onclick="closeSidebar(); setTimeout(() => openGeneralNotesModal(), 350);">
                    <img src="res/notes.svg" alt="Notes">
                    <span>General Notes</span>
                </button>
                <button class="sidebar-item" onclick="closeSidebar(); setTimeout(() => openTrainerPickerModal(), 350);">
                    <img src="res/training.svg" alt="Trainer">
                    <span>Trainer</span>
                </button>
                <button class="sidebar-item" onclick="openNewParityAnalysis(null); closeSidebar();">
                    <img src="res/tracing.svg" alt="Parity Tracer">
                    <span>Parity Tracer</span>
                </button>
                <button class="sidebar-item" onclick="closeSidebar(); setTimeout(()=>window.openUnifiedSettings('homescreen'),350);">
                    <img src="res/training-settings.svg" alt="Settings">
                    <span>Settings</span>
                </button>
                <div class="sidebar-divider"></div>
                <div style="padding: 0;">
                    <div id="presetExpandBtn" onclick="togglePresetExpand()" style="padding: 14px 20px; background: transparent; border: none; width: 100%; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: background 0.2s; font-size: 0.95rem; color: var(--text-ui); font-weight: 500;" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background='transparent'">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px; flex-shrink: 0;">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        </svg>
                        <span style="flex: 1; text-align: left;" id="currentPresetName"></span>
                        <svg id="presetExpandIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px; transition: transform 0.3s; flex-shrink: 0;">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                    <div id="presetOptions" style="max-height: 0; overflow: hidden; transition: max-height 0.3s ease;"></div>
                </div>
                <div class="sidebar-divider"></div>
                <button class="sidebar-item" onclick="exportData(); closeSidebar();">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px;">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span>Export Data</span>
                </button>
                <label class="sidebar-item" style="cursor: pointer;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px;">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span>Import Data</span>
                    <input type="file" id="sidebarImportFile" accept=".json" style="display: none;" onchange="handleFileImport(this.files[0]); closeSidebar();">
                </label>
                <button class="sidebar-item" onclick="openAboutModal(); closeSidebar();">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <span>About</span>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(sidebar);

    // Populate preset dropdown
    populatePresetDropdown('sidebarPresetSelector');

    // Apply instruction visibility
    applyInstructionVisibility();

    // Initialize preset selector
    initializePresetSelector();
}

function initializePresetSelector() {
    const currentPresetName = document.getElementById('currentPresetName');
    const presetOptions = document.getElementById('presetOptions');

    if (!currentPresetName || !presetOptions) return;

    currentPresetName.textContent = currentPreset.replace(/_/g, ' ').replace(/'/g, "'");

    presetOptions.innerHTML = '';
    for (const presetName in window.PRESET_CONFIG) {
        const displayName = presetName.replace(/_/g, ' ').replace(/'/g, "'");
        const isActive = presetName === currentPreset;

        const optionDiv = document.createElement('div');
        optionDiv.className = 'preset-option' + (isActive ? ' active' : '');
        optionDiv.textContent = displayName;

        optionDiv.addEventListener('click', () => handlePresetChange(presetName));
        optionDiv.addEventListener('mouseover', () => {
            if (!isActive) optionDiv.classList.add('preset-option--hover');
        });
        optionDiv.addEventListener('mouseout', () => {
            optionDiv.classList.remove('preset-option--hover');
        });

        presetOptions.appendChild(optionDiv);
    }
}

// Make it globally accessible
window.initializePresetSelector = initializePresetSelector;

window.togglePresetExpand = function () {
    const presetOptions = document.getElementById('presetOptions');
    const expandIcon = document.getElementById('presetExpandIcon');

    if (!presetOptions || !expandIcon) return;

    if (presetOptions.style.maxHeight === '0px' || presetOptions.style.maxHeight === '') {
        // Calculate height based on number of presets
        const numPresets = Object.keys(window.PRESET_CONFIG).length;
        const height = numPresets * 48; // 48px per option
        presetOptions.style.maxHeight = height + 'px';
        expandIcon.style.transform = 'rotate(180deg)';
    } else {
        presetOptions.style.maxHeight = '0px';
        expandIcon.style.transform = 'rotate(0deg)';
    }
};

window.toggleSidebar = function () {
    generateSidebarHTML();
    const sidebar = document.getElementById('appSidebar');
    if (sidebar) {
        const isOpening = !sidebar.classList.contains('active');

        if (isOpening) {
            // Opening sidebar - lock scroll
            window.sidebarScrollY = window.scrollY;
            document.documentElement.classList.add('scroll-locked');
        }

        sidebar.classList.toggle('active');
    }
};

window.closeSidebar = function () {
    const sidebar = document.getElementById('appSidebar');
    if (sidebar) {
        sidebar.classList.remove('active');

        // Unlock scroll
        document.documentElement.classList.remove('scroll-locked');

        // Collapse preset dropdown silently while sidebar slides out
        const presetOptions = document.getElementById('presetOptions');
        const expandIcon = document.getElementById('presetExpandIcon');
        if (presetOptions) presetOptions.style.maxHeight = '0px';
        if (expandIcon) expandIcon.style.transform = 'rotate(0deg)';
    }
};

// Quick info popup function
window.showQuickInfo = function (message) {
    const existing = document.getElementById('quickInfoPopup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'quickInfoPopup';
    popup.className = 'quick-info-overlay';
    popup.innerHTML = `
        <div class="quick-info-box">
            <div>${message}</div>
            <button class="quick-info-btn" onclick="document.getElementById('quickInfoPopup').remove()">Got it</button>
        </div>
    `;

    popup.onclick = (e) => { if (e.target === popup) popup.remove(); };

    const escHandler = (e) => {
        if (e.key === 'Escape') {
            popup.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);

    document.body.appendChild(popup);
};

// Handle outside clicks for all modals
document.addEventListener('click', (e) => {
    // Training info modals
    const infoModals = ['settingsInfoModal', 'homepageInfoModal', 'editCaseInfoModal', 'notesInfoModal', 'generalNotesInfoModal'];
    infoModals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal && modal.classList.contains('active') && e.target === modal) {
            const closeFunc = window[`close${modalId.charAt(0).toUpperCase() + modalId.slice(1).replace('Modal', '')}Modal`];
            if (closeFunc) closeFunc();
        }
    });

    // Notes modal
    const notesModal = document.getElementById('notesModal');
    if (notesModal && notesModal.classList.contains('active') && e.target === notesModal) {
        const caseName = notesModal.querySelector('.modal-title').textContent.replace('Notes: ', '');
        attemptCloseNotesModal(caseName);
    }

    // General notes modal
    const generalNotesModal = document.getElementById('generalNotesModal');
    if (generalNotesModal && generalNotesModal.classList.contains('active') && e.target === generalNotesModal) {
        attemptCloseGeneralNotesModal();
    }
});

// Close info boxes on scroll
window.addEventListener('scroll', () => {
    document.querySelectorAll(".info-box.show").forEach(box => box.classList.remove("show"));
}, true);


/* ==== FILE: js/quick-edit.js ==== */

﻿// Quick Edit System for batch editing cases

let quickEditState = {
    currentTab: 'general',
    findReplaceOpen: false,
    findReplaceScope: null,
    currentFindIndex: -1,
    findMatches: [],
    lastFocusedCell: null,
    allMatchRanges: [], // Store all text ranges for multiple matches per cell
    visibleAlgColumns: 6 // Number of visible algorithm columns
};

// Load auto-select setting from localStorage
let autoSelectTextOnFocus = localStorage.getItem('autoSelectTextOnFocus') !== 'false'; // Default true

// Expand :varName: tokens in an alg string using algVariables map
function expandAlgVariables(alg) {
    if (!alg || !algVariables || algVariables.size === 0) return alg;
    return alg.replace(/:([a-zA-Z_][a-zA-Z0-9_]*):/g, (match, name) => {
        return algVariables.has(name) ? algVariables.get(name) : match;
    });
}

// Expand variables then normalize — used on defocus
function expandAndNormalize(alg) {
    if (!alg || alg === 'Done!') return alg;
    const expanded = expandAlgVariables(alg);
    return window.ScrambleNormalizer ? window.ScrambleNormalizer.normalizeScramble(expanded) : expanded;
}

// Expand variables then normalize for live color coding only (don't mutate cell)
function expandForColorCheck(alg) {
    if (!alg || alg === 'Done!') return alg;
    return expandAlgVariables(alg);
}

function generateGeneralTableRowsShell() {
    const sortedData = [...data].sort((a, b) => getDisplayName(a.name).localeCompare(getDisplayName(b.name)));
    return sortedData.map(item => `<tr data-case="${item.name}" class="qe-lazy-row" data-tab="general"><td colspan="${evilnessFactor ? 5 : 4}" style="height:41px;"></td></tr>`).join('');
}

function generateAlgorithmsTableRowsShell() {
    const sortedData = [...data].sort((a, b) => getDisplayName(a.name).localeCompare(getDisplayName(b.name)));
    return sortedData.map(item => `<tr data-case="${item.name}" class="qe-lazy-row" data-tab="algorithms"><td colspan="7" style="height:41px;"></td></tr>`).join('');
}

function hydrateGeneralRow(row) {
    const item = data.find(d => d.name === row.dataset.case);
    if (!item) return;
    const displayName = getDisplayName(item.name);
    const subtitle = perCaseSubtitles.get(item.name) || '';
    const note = comments.get(item.name) || '';
    const formattedNote = sanitizeNoteHTML(note);
    const isEvil = evilnessMap[item.name] === true;
    row.classList.remove('qe-lazy-row');
    row.innerHTML = `
        <td class="uneditable">${displayName}</td>
        <td class="editable" contenteditable="true" data-field="displayName" data-original="${displayName}">${displayName}</td>
        <td class="editable" contenteditable="true" data-field="subtitle" data-original="${subtitle}">${subtitle}</td>
        <td class="editable notes-cell" contenteditable="true" data-field="notes" data-original="${note.replace(/"/g, '&quot;')}" data-raw-html="${note.replace(/"/g, '&quot;')}">${formattedNote}</td>
        ${evilnessFactor ? `<td style="text-align:center;vertical-align:middle;"><label style="position:relative;display:inline-block;width:36px;height:20px;"><input type="checkbox" class="evil-qe-toggle" data-case="${item.name}" ${isEvil ? 'checked' : ''} style="opacity:0;width:0;height:0;" onchange="evilnessMap[this.dataset.case]=this.checked;saveState();const k=this.nextElementSibling;k.style.background=this.checked?'var(--parity-invalid,#c00)':'var(--surface-border)';k.querySelector('span').style.left=this.checked?'18px':'2px';"><span style="position:absolute;top:0;left:0;right:0;bottom:0;background:${isEvil ? 'var(--parity-invalid,#c00)' : 'var(--surface-border)'};border-radius:20px;cursor:pointer;transition:.3s;"><span style="position:absolute;height:16px;width:16px;left:${isEvil ? '18px' : '2px'};bottom:2px;background:white;border-radius:50%;transition:.3s;display:block;"></span></span></label></td>` : ''}
    `;
    setupRowHandlers(row, 'general');
}

function hydrateAlgorithmsRow(row) {
    const item = data.find(d => d.name === row.dataset.case);
    if (!item) return;
    const visibleCols = quickEditState.visibleAlgColumns || 6;
    const displayName = getDisplayName(item.name);
    const customAlgs = customAlgorithms.get(item.name);
    let allAlgs = customAlgs ? [...(customAlgs.odd || []), ...(customAlgs.even || [])] : [...(item.odd || []), ...(item.even || [])];
    const totalCols = Math.max(visibleCols, 6);
    while (allAlgs.length < totalCols) allAlgs.push('');
    row.classList.remove('qe-lazy-row');
    row.innerHTML = `
        <td class="uneditable display-name-col">${displayName}</td>
        ${allAlgs.slice(0, totalCols).map((alg, idx) => `<td class="editable alg-cell" contenteditable="true" data-field="alg${idx}" data-original="${alg}" style="${idx >= visibleCols ? 'display:none;' : ''}">${alg}</td>`).join('')}
    `;
    setupRowHandlers(row, 'algorithms');
    row.querySelectorAll('.alg-cell').forEach(cell => { if (cell.textContent.trim()) updateAlgorithmCellParity(cell); });
}

function setupRowHandlers(row, tab) {
    row.querySelectorAll('.editable').forEach(cell => {
        cell.addEventListener('focus', function() {
            if (this.classList.contains('notes-cell')) { const r = this.dataset.rawHtml || ''; this.textContent = r; }
            if (autoSelectTextOnFocus) { const range = document.createRange(); range.selectNodeContents(this); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); }
            quickEditState.lastFocusedCell = this;
            if (tab === 'general') { const f = this.dataset.field; quickEditState.findReplaceScope = f === 'displayName' ? 'name' : f === 'subtitle' ? 'subtitle' : f === 'notes' ? 'notes' : null; }
        });
        cell.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.shiftKey && this.dataset.field === 'notes') { e.preventDefault(); document.execCommand('insertLineBreak'); return; }
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const nr = this.closest('tr').nextElementSibling; if (nr) { if (nr.classList.contains('qe-lazy-row')) { tab === 'general' ? hydrateGeneralRow(nr) : hydrateAlgorithmsRow(nr); } const sc = nr.querySelector(`[data-field="${this.dataset.field}"]`); if (sc) sc.focus(); } return; }
            if (e.key === 'Tab') { e.preventDefault(); const cells = Array.from(this.closest('tr').querySelectorAll('.editable')); const ci = cells.indexOf(this); if (e.shiftKey) { if (ci > 0) cells[ci-1].focus(); } else { if (ci < cells.length-1) cells[ci+1].focus(); } return; }
        });
        cell.addEventListener('blur', function() {
            if (this.classList.contains('notes-cell')) { const r = this.textContent.trim(); this.dataset.rawHtml = r; this.innerHTML = sanitizeNoteHTML(r); }
        });
        if (cell.classList.contains('alg-cell')) {
            cell.addEventListener('input', function() { updateAlgorithmCellParityLive(this); });
            cell.addEventListener('blur', function() { const t = this.textContent.trim(); if (t && t !== 'Done!') this.textContent = expandAndNormalize(t); updateAlgorithmCellParity(this); });
            cell.addEventListener('paste', function(e) { e.preventDefault(); const t = (e.clipboardData||window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, t); });
        }
    });
}

function initQuickEditLazyLoad() {
    const modal = document.getElementById('quickEditModal');
    if (!modal) return;
    const body = modal.querySelector('.quick-edit-body');

    // Hydrate first ~8 visible rows immediately
    const generalRows = Array.from(document.querySelectorAll('#quickEditGeneralBody .qe-lazy-row'));
    const algRows = Array.from(document.querySelectorAll('#quickEditAlgorithmsBody .qe-lazy-row'));
    generalRows.slice(0, 8).forEach(hydrateGeneralRow);
    algRows.slice(0, 8).forEach(hydrateAlgorithmsRow);

    // REPLACE:
    // Render all remaining rows in small batches so the UI stays responsive
    const remainingGeneral = generalRows.slice(8);
    const remainingAlg = algRows.slice(8);
    const allRemaining = [...remainingGeneral, ...remainingAlg];
    let idx = 0;
    function renderNextBatch() {
        const batchSize = 10;
        const end = Math.min(idx + batchSize, allRemaining.length);
        for (; idx < end; idx++) {
            const row = allRemaining[idx];
            if (row.classList.contains('qe-lazy-row')) {
                row.dataset.tab === 'general' ? hydrateGeneralRow(row) : hydrateAlgorithmsRow(row);
            }
        }
        if (idx < allRemaining.length) {
            requestAnimationFrame(renderNextBatch);
        }
    }
    if (allRemaining.length > 0) requestAnimationFrame(renderNextBatch);
    modal._lazyObserver = null;
}

function openQuickEditModal() {
    // Close settings modal if open
    closeSettingsModal();

    // Store initial state for reverting
    window.quickEditInitialState = {
        displayNames: { ...displayNames },
        perCaseSubtitles: new Map(perCaseSubtitles),
        comments: new Map(comments),
        customAlgorithms: new Map(customAlgorithms)
    };

    const modal = document.createElement('div');
    modal.className = 'quick-edit-fullscreen';
    modal.id = 'quickEditModal';

    modal.innerHTML = `
        <div class="quick-edit-screen">
            <div class="quick-edit-header">
                <div class="quick-edit-header-left">
                    <div class="quick-edit-title-wrapper">
                        <h2 onclick="toggleQuickEditTab()">Quick Edit</h2>
                        <button class="quick-edit-icon-btn instruction-btn" onclick="showQuickEditInfoModal()" title="Help">
                            <img src="res/info.svg" alt="Help">
                        </button>
                    </div>
                    <div class="quick-edit-subtitle" id="quickEditSubtitle">General Info</div>
                    <div class="quick-edit-tabs">
                        <button class="quick-edit-tab active" data-tab="general" onclick="switchQuickEditTab('general')">General Info</button>
                        <button class="quick-edit-tab" data-tab="algorithms" onclick="switchQuickEditTab('algorithms')">Algorithms</button>
                    </div>
                </div>
                <div class="quick-edit-header-right">
                    <button class="quick-edit-icon-btn add-columns-btn-header" onclick="addAlgorithmColumns()" title="Show 2 more columns" style="display: none;">
                        +2
                    </button>
                    <button class="quick-edit-icon-btn alg-variables-btn-header" onclick="openAlgVariablesModal()" title="Algorithm Variables" style="display: none;">
                        <img src="res/var.svg" alt="Variables">
                    </button>
                    <button class="quick-edit-icon-btn" onclick="openQuickEditFindReplace()" title="Find and Replace (Ctrl+F)">
                        <img src="res/search.svg" alt="Find">
                    </button>
                    <button class="quick-edit-icon-btn" onclick="saveQuickEditChanges()" title="Save changes">
                        <img src="res/save.svg" alt="Save">
                    </button>
                    <button class="quick-edit-icon-btn" onclick="closeQuickEditModal()" title="Exit">
                        <img src="res/exit.svg" alt="Exit">
                    </button>
                </div>
            </div>

 <div class="quick-edit-find-replace-popup" id="quickEditFindReplace" style="display: none;">
    <div class="find-replace-header">
        <span>Find and Replace</span>
        <button class="close-find-btn" onclick="closeQuickEditFindReplace()" title="Close (Esc)">×</button>
    </div>
    <div class="find-replace-inputs">
        <div class="find-input-row">
            <input type="text" id="quickEditFindInput" placeholder="Find" oninput="liveSearchQuickEdit()">
            <div class="find-nav-buttons">
                <button onclick="findPreviousQuickEdit()" title="Previous match">
                    <img src="res/previous.svg" alt="Previous">
                </button>
                <button onclick="findNextQuickEdit()" title="Next match">
                    <img src="res/next.svg" alt="Next">
                </button>
            </div>
        </div>
        <div class="replace-input-row">
            <input type="text" id="quickEditReplaceInput" placeholder="Replace" onkeypress="handleReplaceEnter(event)">
            <div class="replace-buttons">
                <button onclick="replaceQuickEdit()" title="Replace (Enter)">Replace</button>
                <button onclick="replaceAllQuickEdit()" title="Replace All">Replace All</button>
            </div>
        </div>
    </div>
    <div class="find-replace-footer">
        <div class="scope-selector">
            <label>Scope:</label>
            <select id="quickEditScopeSelector" onchange="changeFindScope()">
                <option value="name">Display Name</option>
                <option value="subtitle">Subtitle</option>
                <option value="notes">Notes</option>
                <option value="global">Global (All General)</option>
                <option value="all">All Algorithms</option>
            </select>
        </div>
        <span id="quickEditMatchCount">No matches</span>
    </div>
</div>

            <div class="quick-edit-body">
                <div class="quick-edit-content" id="quickEditGeneralTab">
                    <table class="quick-edit-table">
                        <thead>
                            <tr>
                                <th>Case Name</th>
                                <th>Display Name</th>
                                <th>Subtitle</th>
                                <th class="notes-header">Notes</th>
                                ${evilnessFactor ? '<th style="text-align:center;">Evil</th>' : ''}
                            </tr>
                        </thead>
                        <tbody id="quickEditGeneralBody">
                            ${generateGeneralTableRowsShell()}
                        </tbody>
                    </table>
                </div>

                <div class="quick-edit-content" id="quickEditAlgorithmsTab" style="display: none;">
                    <table class="quick-edit-table algorithms-table">
                        <thead>
                            <tr id="algorithmTableHeader">
                                <th class="display-name-header" style="white-space:nowrap;">Display Name</th>
                            </tr>
                        </thead>
                        <tbody id="quickEditAlgorithmsBody">
                            ${generateAlgorithmsTableRowsShell()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    pushModalState('quickEditModal', closeQuickEditModal);

    // Keep modal in sync with theme changes
    modal._themeObserver = new MutationObserver(() => {
        modal.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') || '');
    });
    modal._themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    modal.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') || '');

    // Add keyboard shortcuts
    setupQuickEditKeyboardShortcuts();

    // Lazy load rows
    initQuickEditLazyLoad();
}

function generateGeneralTableRows() {
    const sortedData = [...data].sort((a, b) => {
        const nameA = getDisplayName(a.name);
        const nameB = getDisplayName(b.name);
        return nameA.localeCompare(nameB);
    });
    return sortedData.map(item => {
        const displayName = getDisplayName(item.name);
        const caseNameDisplay = getDisplayName(item.name);
        const subtitle = perCaseSubtitles.get(item.name) || '';
        const note = comments.get(item.name) || '';
        const formattedNote = sanitizeNoteHTML(note);

        const isEvil = evilnessMap[item.name] === true;
        return `
            <tr data-case="${item.name}">
                <td class="uneditable">${caseNameDisplay}</td>
                <td class="editable" contenteditable="true" data-field="displayName" data-original="${displayName}">${displayName}</td>
                <td class="editable" contenteditable="true" data-field="subtitle" data-original="${subtitle}">${subtitle}</td>
                <td class="editable notes-cell" contenteditable="true" data-field="notes" data-original="${note.replace(/"/g, '&quot;')}" data-raw-html="${note.replace(/"/g, '&quot;')}">${formattedNote}</td>
                ${evilnessFactor ? `<td style="text-align:center; vertical-align:middle;">
                    <label style="position:relative;display:inline-block;width:36px;height:20px;">
                        <input type="checkbox" class="evil-qe-toggle" data-case="${item.name}" ${isEvil ? 'checked' : ''} style="opacity:0;width:0;height:0;" onchange="evilnessMap[this.dataset.case]=this.checked; saveState(); const k=this.nextElementSibling; k.style.background=this.checked?'var(--parity-invalid,#c00)':'var(--surface-border)'; k.querySelector('span').style.left=this.checked?'18px':'2px';">
                        <span style="position:absolute;top:0;left:0;right:0;bottom:0;background:${isEvil ? 'var(--parity-invalid,#c00)' : 'var(--surface-border)'};border-radius:20px;cursor:pointer;transition:.3s;"><span style="position:absolute;height:16px;width:16px;left:${isEvil ? '18px' : '2px'};bottom:2px;background:white;border-radius:50%;transition:.3s;display:block;"></span></span>
                    </label>
                </td>` : ''}
            </tr>
        `;
    }).join('');
}

function generateAlgorithmsTableRows() {
    const visibleCols = quickEditState.visibleAlgColumns || 6;
    const sortedData = [...data].sort((a, b) => getDisplayName(a.name).localeCompare(getDisplayName(b.name)));

    return sortedData.map(item => {
        const displayName = getDisplayName(item.name);
        const customAlgs = customAlgorithms.get(item.name);
        let allAlgs = [];

        if (customAlgs) {
            allAlgs = [...(customAlgs.odd || []), ...(customAlgs.even || [])];
        } else {
            allAlgs = [...(item.odd || []), ...(item.even || [])];
        }

        // Pad to visible columns (minimum 6)
        const totalCols = Math.max(visibleCols, 6);
        while (allAlgs.length < totalCols) {
            allAlgs.push('');
        }

        return `
            <tr data-case="${item.name}">
                <td class="uneditable display-name-col">${displayName}</td>
                ${allAlgs.slice(0, totalCols).map((alg, idx) => `
                    <td class="editable alg-cell" contenteditable="true" data-field="alg${idx}" data-original="${alg}" style="${idx >= visibleCols ? 'display: none;' : ''}">${alg}</td>
                `).join('')}
            </tr>
        `;
    }).join('');
}

function addAlgorithmColumns() {
    const tbody = document.getElementById('quickEditAlgorithmsBody');
    if (!tbody) return;

    quickEditState.visibleAlgColumns += 2;

    // For each row, ensure we have enough cells
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        const caseName = row.dataset.case;
        const existingCells = row.querySelectorAll('.alg-cell');
        const currentCellCount = existingCells.length;

        // If we need more cells than we have, create them
        if (currentCellCount < quickEditState.visibleAlgColumns) {
            const displayNameCell = row.querySelector('.display-name-col');

            for (let idx = currentCellCount; idx < quickEditState.visibleAlgColumns; idx++) {
                const td = document.createElement('td');
                td.className = 'editable alg-cell';
                td.contentEditable = 'true';
                td.dataset.field = `alg${idx}`;
                td.dataset.original = '';
                td.dataset.colIndex = idx;
                td.textContent = '';

                // Add event listeners
                td.addEventListener('focus', function () {
                    if (autoSelectTextOnFocus) {
                        const range = document.createRange();
                        range.selectNodeContents(this);
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                    quickEditState.lastFocusedCell = this;
                });

                td.addEventListener('input', function () {
                    updateAlgorithmCellParityLive(this);
                });

                td.addEventListener('blur', function () {
                    const rawText = this.textContent.trim();
                    if (rawText && rawText !== 'Done!') {
                        this.textContent = expandAndNormalize(rawText);
                    }
                    updateAlgorithmCellParity(this);
                });

                td.addEventListener('paste', function (e) {
                    e.preventDefault();
                    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
                    document.execCommand('insertText', false, text);
                });

                td.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const currentRow = this.closest('tr');
                        const nextRow = currentRow.nextElementSibling;
                        if (nextRow) {
                            const sameFieldCell = nextRow.querySelector(`[data-field="${this.dataset.field}"]`);
                            if (sameFieldCell) {
                                sameFieldCell.focus();
                            }
                        }
                        return;
                    }

                    if (e.key === 'Tab') {
                        e.preventDefault();
                        const currentRow = this.closest('tr');
                        const cells = Array.from(currentRow.querySelectorAll('.editable'));
                        const currentIndex = cells.indexOf(this);

                        if (e.shiftKey) {
                            if (currentIndex > 0) {
                                cells[currentIndex - 1].focus();
                            }
                        } else {
                            if (currentIndex < cells.length - 1) {
                                cells[currentIndex + 1].focus();
                            }
                        }
                        return;
                    }
                });

                row.appendChild(td);
            }
        }
    });

    updateAlgorithmTableHeaders();
    updateAlgorithmTableCells();
    document.getElementById('visibleColumnCount').textContent = quickEditState.visibleAlgColumns;
}

function updateAlgorithmTableHeaders() {
    const headerRow = document.getElementById('algorithmTableHeader');
    if (!headerRow) return;

    // Clear existing headers except first one
    while (headerRow.children.length > 1) {
        headerRow.removeChild(headerRow.lastChild);
    }

    // Add headers for visible columns
    for (let i = 0; i < quickEditState.visibleAlgColumns; i++) {
        const th = document.createElement('th');
        th.className = 'alg-header';
        th.textContent = `Alg ${i + 1}`;
        headerRow.appendChild(th);
    }
}

function updateAlgorithmTableCells() {
    const tbody = document.getElementById('quickEditAlgorithmsBody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('.alg-cell');
        cells.forEach((cell, idx) => {
            if (idx < quickEditState.visibleAlgColumns) {
                cell.style.display = '';
            } else {
                cell.style.display = 'none';
            }
        });
    });
}

function setupQuickEditCellHandlers() {
    const modal = document.getElementById('quickEditModal');
    if (!modal) return;

    // Handle cell focus for text selection
    const editableCells = modal.querySelectorAll('.editable');
    editableCells.forEach(cell => {
        cell.addEventListener('focus', function () {
            // For notes cells, show raw HTML
            if (this.classList.contains('notes-cell')) {
                const rawHTML = this.dataset.rawHtml || '';
                this.textContent = rawHTML;
            }

            // Select all text when cell is focused (if setting is enabled)
            if (autoSelectTextOnFocus) {
                const range = document.createRange();
                range.selectNodeContents(this);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }

            quickEditState.lastFocusedCell = this;

            // Update scope for general tab
            if (quickEditState.currentTab === 'general') {
                const field = this.dataset.field;
                if (field === 'displayName') {
                    quickEditState.findReplaceScope = 'name';
                } else if (field === 'subtitle') {
                    quickEditState.findReplaceScope = 'subtitle';
                } else if (field === 'notes') {
                    quickEditState.findReplaceScope = 'notes';
                }
            } else {
                quickEditState.findReplaceScope = null; // No scope for algorithms tab
            }
        });

        // Handle keydown for navigation
        cell.addEventListener('keydown', function (e) {
            // Shift+Enter for line break in notes field
            if (e.key === 'Enter' && e.shiftKey && this.dataset.field === 'notes') {
                e.preventDefault();
                document.execCommand('insertLineBreak');
                return;
            }

            // Enter to move to next row
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const currentRow = this.closest('tr');
                const nextRow = currentRow.nextElementSibling;
                if (nextRow) {
                    const sameFieldCell = nextRow.querySelector(`[data-field="${this.dataset.field}"]`);
                    if (sameFieldCell) {
                        sameFieldCell.focus();
                    }
                }
                return;
            }

            // Tab to move to next column
            if (e.key === 'Tab') {
                e.preventDefault();
                const currentRow = this.closest('tr');
                const cells = Array.from(currentRow.querySelectorAll('.editable'));
                const currentIndex = cells.indexOf(this);

                if (e.shiftKey) {
                    // Shift+Tab to move to previous column
                    if (currentIndex > 0) {
                        cells[currentIndex - 1].focus();
                    }
                } else {
                    // Tab to move to next column
                    if (currentIndex < cells.length - 1) {
                        cells[currentIndex + 1].focus();
                    }
                }
                return;
            }
        });

        // Handle blur for notes cells to show formatted HTML
        cell.addEventListener('blur', function () {
            if (this.classList.contains('notes-cell')) {
                const rawHTML = this.textContent.trim();
                this.dataset.rawHtml = rawHTML;
                const formattedHTML = sanitizeNoteHTML(rawHTML);
                this.innerHTML = formattedHTML;
            }
        });

        // Handle blur for algorithm cells to normalize and update parity color
        if (cell.classList.contains('alg-cell')) {
            cell.addEventListener('input', function () {
                // Live color coding without normalization
                updateAlgorithmCellParityLive(this);
            });

            cell.addEventListener('blur', function () {
                const rawText = this.textContent.trim();
                if (rawText && rawText !== 'Done!') {
                    this.textContent = expandAndNormalize(rawText);
                }
                updateAlgorithmCellParity(this);
            });

            // Handle paste to strip formatting
            cell.addEventListener('paste', function (e) {
                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData('text/plain');
                document.execCommand('insertText', false, text);
            });
        }
    });

    // Update parity for all algorithm cells after setup
    setTimeout(() => {
        const algCells = modal.querySelectorAll('.alg-cell');
        algCells.forEach(cell => {
            if (cell.textContent.trim()) {
                updateAlgorithmCellParity(cell);
            }
        });
    }, 100);
}

function getCaseShapeData(caseName) {
    // Find the shape data for this specific case by display name or case name
    for (const shapeData of shapeIndex) {
        if (shapeData.name === caseName) return shapeData;
    }
    // Try matching by canonical shapeIndexMap
    const canonicalIdx = parseInt(shapeIndexMap[caseName]);
    if (isNaN(canonicalIdx)) return null;
    for (const shapeData of shapeIndex) {
        if (shapeData.org && shapeData.org.includes(canonicalIdx)) return shapeData;
    }
    return null;
}

function getCanonicalCaseNameForCell(cell) {
    const row = cell.closest('tr');
    if (!row) return null;
    return row.dataset.case || null;
}

const ALL_LEGAL_TOPS = [0,1,2,3,4,5,-1,-2,-3,-4,-5,-6];
const ALL_LEGAL_BOTTOMS = [0,1,2,3,4,5,-1,-2,-3,-4,-5,-6];

function tryFixAngle(algBody, canonicalShapeIdx) {
    // algBody is everything from first / onward
    for (const t of ALL_LEGAL_TOPS) {
        for (const b of ALL_LEGAL_BOTTOMS) {
            const candidate = `(${t},${b})` + algBody;
            const result = window.algToShapeIndex(candidate);
            if (result.shapeIndex === canonicalShapeIdx) {
                return candidate;
            }
        }
    }
    return null;
}

function tryFixMirroredAngle(algBody, canonicalShapeIdx) {
    for (const t of ALL_LEGAL_TOPS) {
        for (const b of ALL_LEGAL_BOTTOMS) {
            const candidate = `/(6,6)/(${t},${b})` + algBody;
            const result = window.algToShapeIndex(candidate);
            if (result.shapeIndex === canonicalShapeIdx) {
                return `(${t},${b})` + algBody;
            }
        }
    }
    return null;
}

function stripBeforeFirstSlash(alg) {
    // If starts with /, keep as is. Otherwise strip everything before first /
    const firstSlash = alg.indexOf('/');
    if (firstSlash <= 0) return alg; // starts with / or no slash found
    return alg.slice(firstSlash);
}

function updateAlgorithmCellParity(cell) {
    const alg = cell.textContent.trim();
    if (!alg || alg === 'Done!') {
        cell.style.color = '';
        cell.style.fontWeight = '';
        return;
    }

    if (typeof window.algToShapeIndex === 'undefined' ||
        typeof window.caleTracer === 'undefined') {
        cell.style.color = '';
        cell.style.fontWeight = '';
        return;
    }

    const caseName = getCanonicalCaseNameForCell(cell);
    const canonicalIdxStr = caseName ? shapeIndexMap[caseName] : null;
    const canonicalIdx = canonicalIdxStr !== undefined ? parseInt(canonicalIdxStr) : null;
    const caseShapeData = caseName ? getCaseShapeData(caseName) : null;

    try {
        const result = window.algToShapeIndex(alg);
        const resultShapeIndex = result.shapeIndex;

        const isDirectMatch = canonicalIdx !== null && resultShapeIndex === canonicalIdx;
        const isInOrg = caseShapeData && caseShapeData.org && caseShapeData.org.includes(resultShapeIndex);
        const isInMir = caseShapeData && caseShapeData.mir && caseShapeData.mir.includes(resultShapeIndex);

        if (isDirectMatch || isInOrg) {
            // Correct case - check parity
            const setup = invertScramble(alg);
            const parityText = window.caleTracer.getParityTextFromScramble(setup, {
                topColor: colorScheme.topColor, bottomColor: colorScheme.bottomColor,
                frontColor: colorScheme.frontColor, rightColor: colorScheme.rightColor,
                backColor: colorScheme.backColor, leftColor: colorScheme.leftColor
            }, cornerStickerMode);

            if (isDirectMatch) {
                // Canonical angle - fix angle if needed
                cell.style.color = parityText === 'Odd' ? 'var(--parity-odd)' : 'var(--parity-even)';
            } else {
                // Org match but not canonical - try to fix angle
                if (canonicalIdx !== null) {
                    const algBody = stripBeforeFirstSlash(alg);
                    const fixed = tryFixAngle(algBody, canonicalIdx);
                    if (fixed) {
                        cell.textContent = window.ScrambleNormalizer.normalizeScramble(fixed);
                    }
                }
                cell.style.color = parityText === 'Odd' ? 'var(--parity-odd)' : 'var(--parity-even)';
            }
            cell.style.fontWeight = '600';

        } else if (isInMir) {
            const setup = invertScramble(alg);
            const parityText = window.caleTracer.getParityTextFromScramble(setup, {
                topColor: colorScheme.topColor, bottomColor: colorScheme.bottomColor,
                frontColor: colorScheme.frontColor, rightColor: colorScheme.rightColor,
                backColor: colorScheme.backColor, leftColor: colorScheme.leftColor
            }, cornerStickerMode);

            if (canonicalIdx !== null) {
                const algBody = stripBeforeFirstSlash(alg);
                const fixed = tryFixMirroredAngle(algBody, canonicalIdx);
                if (fixed) {
                    cell.textContent = window.ScrambleNormalizer.normalizeScramble(fixed);
                }
            }
            cell.style.color = parityText === 'Odd' ? 'var(--parity-odd-mirror)' : 'var(--parity-even-mirror)';
            cell.style.fontWeight = '600';

        } else {
            cell.style.color = 'var(--parity-invalid)';
            cell.style.fontWeight = '600';
        }
    } catch (error) {
        cell.style.color = 'var(--parity-invalid)';
        cell.style.fontWeight = '600';
    }
}

function updateAlgorithmCellParityLive(cell) {
    const alg = cell.textContent.trim();
    if (!alg || alg === 'Done!') {
        cell.style.color = '';
        cell.style.fontWeight = '';
        return;
    }

    if (typeof window.algToShapeIndex === 'undefined' ||
        typeof window.caleTracer === 'undefined' ||
        typeof window.ScrambleNormalizer === 'undefined') {
        cell.style.color = '';
        cell.style.fontWeight = '';
        return;
    }

    const caseName = getCanonicalCaseNameForCell(cell);
    const canonicalIdxStr = caseName ? shapeIndexMap[caseName] : null;
    const canonicalIdx = canonicalIdxStr !== undefined ? parseInt(canonicalIdxStr) : null;
    const caseShapeData = caseName ? getCaseShapeData(caseName) : null;

    try {
        const normalized = window.ScrambleNormalizer.normalizeScramble(expandForColorCheck(alg));
        const result = window.algToShapeIndex(normalized);
        const resultShapeIndex = result.shapeIndex;

        const isDirectMatch = canonicalIdx !== null && resultShapeIndex === canonicalIdx;
        const isInOrg = caseShapeData && caseShapeData.org && caseShapeData.org.includes(resultShapeIndex);
        const isInMir = caseShapeData && caseShapeData.mir && caseShapeData.mir.includes(resultShapeIndex);

        if (isDirectMatch || isInOrg) {
            const setup = invertScramble(normalized);
            const parityText = window.caleTracer.getParityTextFromScramble(setup, {
                topColor: colorScheme.topColor, bottomColor: colorScheme.bottomColor,
                frontColor: colorScheme.frontColor, rightColor: colorScheme.rightColor,
                backColor: colorScheme.backColor, leftColor: colorScheme.leftColor
            }, cornerStickerMode);
            cell.style.color = parityText === 'Odd' ? 'var(--parity-odd)' : 'var(--parity-even)';
            cell.style.fontWeight = '600';
        } else if (isInMir) {
            const setup = invertScramble(normalized);
            const parityText = window.caleTracer.getParityTextFromScramble(setup, {
                topColor: colorScheme.topColor, bottomColor: colorScheme.bottomColor,
                frontColor: colorScheme.frontColor, rightColor: colorScheme.rightColor,
                backColor: colorScheme.backColor, leftColor: colorScheme.leftColor
            }, cornerStickerMode);
            cell.style.color = parityText === 'Odd' ? 'var(--parity-odd-mirror)' : 'var(--parity-even-mirror)';
            cell.style.fontWeight = '600';
        } else {
            cell.style.color = 'var(--parity-invalid)';
            cell.style.fontWeight = '600';
        }
    } catch (error) {
        cell.style.color = 'var(--parity-invalid)';
        cell.style.fontWeight = '600';
    }
}

function setupQuickEditKeyboardShortcuts() {
    const modal = document.getElementById('quickEditModal');
    if (!modal) return;

    modal.addEventListener('keydown', function (e) {
        // Ctrl/Cmd + F to open find/replace
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            openQuickEditFindReplace();
        }

        // Escape to close find/replace
        if (e.key === 'Escape' && quickEditState.findReplaceOpen) {
            closeQuickEditFindReplace();
        }
    });
}

function switchQuickEditTab(tab) {
    // Check enhanced access for algorithms tab
    if (tab === 'algorithms' && !window.enhancedAccess) {
        showToast('Enable Enhanced Access in Settings to edit algorithms', 2000, 'error');
        return;
    }

    quickEditState.currentTab = tab;

    // Update tab buttons
    const tabs = document.querySelectorAll('.quick-edit-tab');
    tabs.forEach(t => {
        if (t.dataset.tab === tab) {
            t.classList.add('active');
        } else {
            t.classList.remove('active');
        }
    });

    // Update subtitle
    const subtitle = document.getElementById('quickEditSubtitle');
    if (subtitle) {
        subtitle.textContent = tab === 'general' ? 'General Info' : 'Algorithms';
    }

    // Show/hide content
    const generalTab = document.getElementById('quickEditGeneralTab');
    const algorithmsTab = document.getElementById('quickEditAlgorithmsTab');
    const addColumnsBtn = document.querySelector('.add-columns-btn-header');

    const varBtn = document.querySelector('.alg-variables-btn-header');
    if (tab === 'general') {
        generalTab.style.display = 'block';
        algorithmsTab.style.display = 'none';
        if (addColumnsBtn) addColumnsBtn.style.display = 'none';
        if (varBtn) varBtn.style.display = 'none';
    } else {
        generalTab.style.display = 'none';
        algorithmsTab.style.display = 'block';
        if (addColumnsBtn) addColumnsBtn.style.display = '';
        if (varBtn) varBtn.style.display = '';
        // Initialize algorithm table headers when switching to algorithm tab
        updateAlgorithmTableHeaders();
    }

    // Close find/replace when switching tabs
    if (quickEditState.findReplaceOpen) {
        closeQuickEditFindReplace();
    }
}

function toggleQuickEditTab() {
    // Only toggle on mobile (when tabs are hidden)
    if (window.innerWidth > 630) return;

    const newTab = quickEditState.currentTab === 'general' ? 'algorithms' : 'general';
    switchQuickEditTab(newTab);
}

function openQuickEditFindReplace() {
    const findReplace = document.getElementById('quickEditFindReplace');
    const findInput = document.getElementById('quickEditFindInput');
    const scopeSelector = document.getElementById('quickEditScopeSelector');

    findReplace.style.display = 'block';
    quickEditState.findReplaceOpen = true;

    // Initialize drag functionality if not already done
    if (!findReplace.dataset.dragInitialized) {
        initializeFindReplaceDrag(findReplace);
        findReplace.dataset.dragInitialized = 'true';
    }

    // Reset position to top right
    if (findReplace.resetPosition) {
        findReplace.resetPosition();
    }

    // Switch notes to raw text mode and keep them in raw mode
    const notesCells = document.querySelectorAll('.notes-cell');
    notesCells.forEach(cell => {
        const rawHTML = cell.dataset.rawHtml || '';
        cell.textContent = rawHTML;
    });

    // Set scope selector based on current tab
    if (quickEditState.currentTab === 'general') {
        scopeSelector.disabled = false;
        if (quickEditState.lastFocusedCell) {
            const field = quickEditState.lastFocusedCell.dataset.field;
            const scopeMap = {
                'displayName': 'name',
                'subtitle': 'subtitle',
                'notes': 'notes'
            };
            scopeSelector.value = scopeMap[field] || 'global';
        } else {
            scopeSelector.value = 'global';
        }
    } else {
        scopeSelector.disabled = false;
        scopeSelector.value = 'all';
    }

    findInput.focus();
    findInput.select();
}

function closeQuickEditFindReplace() {
    const findReplace = document.getElementById('quickEditFindReplace');
    findReplace.style.display = 'none';
    quickEditState.findReplaceOpen = false;
    quickEditState.currentFindIndex = -1;
    quickEditState.findMatches = [];

    // Clear highlights
    clearFindHighlights();

    // Switch notes back to formatted mode
    const notesCells = document.querySelectorAll('.notes-cell');
    notesCells.forEach(cell => {
        const rawHTML = cell.dataset.rawHtml || cell.textContent.trim();
        cell.dataset.rawHtml = rawHTML;
        const formattedHTML = sanitizeNoteHTML(rawHTML);
        cell.innerHTML = formattedHTML;
    });
}

function liveSearchQuickEdit() {
    const findInput = document.getElementById('quickEditFindInput');
    const searchTerm = findInput.value;

    // Clear previous highlights
    clearFindHighlights();
    quickEditState.findMatches = [];
    quickEditState.allMatchRanges = [];
    quickEditState.currentFindIndex = -1;

    // Ensure notes cells show raw text and stay in raw text mode
    const notesCells = document.querySelectorAll('.notes-cell');
    notesCells.forEach(cell => {
        const rawHTML = cell.dataset.rawHtml || '';
        cell.textContent = rawHTML;
    });

    if (!searchTerm) {
        document.getElementById('quickEditMatchCount').textContent = 'No matches';
        return;
    }

    // Get all cells in scope
    const modal = document.getElementById('quickEditModal');
    let cells;

    if (quickEditState.currentTab === 'general') {
        const scopeSelector = document.getElementById('quickEditScopeSelector');
        const scope = scopeSelector ? scopeSelector.value : 'global';

        if (scope === 'global') {
            // Search all general fields
            cells = Array.from(modal.querySelectorAll('#quickEditGeneralTab .editable'));
        } else {
            const fieldMap = {
                'name': 'displayName',
                'subtitle': 'subtitle',
                'notes': 'notes'
            };
            const field = fieldMap[scope];
            cells = Array.from(modal.querySelectorAll(`.editable[data-field="${field}"]`));
        }
    } else {
        cells = Array.from(modal.querySelectorAll('.alg-cell'));
    }

    // Find all matches with their positions (case-insensitive)
    const searchLower = searchTerm.toLowerCase();
    cells.forEach(cell => {
        const text = cell.textContent;
        const textLower = text.toLowerCase();
        let pos = 0;

        while ((pos = textLower.indexOf(searchLower, pos)) !== -1) {
            quickEditState.findMatches.push(cell);
            quickEditState.allMatchRanges.push({ cell, start: pos, end: pos + searchTerm.length });
            pos += searchTerm.length;
        }
    });

    if (quickEditState.findMatches.length === 0) {
        document.getElementById('quickEditMatchCount').textContent = 'No matches';
        return;
    }

    // Highlight all matches
    highlightAllMatches();

    // Select first match
    quickEditState.currentFindIndex = 0;
    highlightCurrentMatch();

    // Update count
    document.getElementById('quickEditMatchCount').textContent =
        `${quickEditState.currentFindIndex + 1} of ${quickEditState.findMatches.length}`;
}

function highlightAllMatches() {
    // Store the current HTML state before highlighting
    quickEditState.allMatchRanges.forEach(range => {
        // For notes cells, work with text content (raw HTML)
        if (range.cell.classList.contains('notes-cell')) {
            const rawText = range.cell.textContent;
            const before = rawText.substring(0, range.start);
            const match = rawText.substring(range.start, range.end);
            const after = rawText.substring(range.end);
            range.cell.textContent = before + match + after;

            // Create a text node structure with mark element
            range.cell.innerHTML =
                escapeHtml(before) +
                `<mark class="find-match-highlight">${escapeHtml(match)}</mark>` +
                escapeHtml(after);
        } else {
            const text = range.cell.textContent;
            range.cell.innerHTML =
                text.substring(0, range.start) +
                `<span class="find-match-highlight">${text.substring(range.start, range.end)}</span>` +
                text.substring(range.end);
        }
    });
}

// Helper function to escape HTML for display
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function highlightCurrentMatch() {
    // Remove previous current highlight
    document.querySelectorAll('.find-match-current').forEach(el => {
        el.classList.remove('find-match-current');
    });

    if (quickEditState.currentFindIndex >= 0 && quickEditState.currentFindIndex < quickEditState.findMatches.length) {
        const currentCell = quickEditState.findMatches[quickEditState.currentFindIndex];
        const highlights = currentCell.querySelectorAll('.find-match-highlight');

        // Find which highlight in this cell corresponds to this match
        let cellMatchIndex = 0;
        for (let i = 0; i < quickEditState.currentFindIndex; i++) {
            if (quickEditState.findMatches[i] === currentCell) {
                cellMatchIndex++;
            }
        }

        if (highlights[cellMatchIndex]) {
            highlights[cellMatchIndex].classList.add('find-match-current');
            highlights[cellMatchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

function clearFindHighlights() {
    const modal = document.getElementById('quickEditModal');
    if (!modal) return;

    // Restore original text content for all cells that have highlights
    const cells = modal.querySelectorAll('.editable');
    cells.forEach(cell => {
        if (cell.querySelector('.find-match-highlight') || cell.querySelector('mark.find-match-highlight')) {
            // For notes cells, restore raw HTML
            if (cell.classList.contains('notes-cell')) {
                const rawHtml = cell.dataset.rawHtml || '';
                cell.textContent = rawHtml;
            } else {
                cell.textContent = cell.textContent; // Removes all HTML, keeps just text
            }
        }
    });
}

function findNextQuickEdit() {
    if (quickEditState.findMatches.length === 0) return;

    quickEditState.currentFindIndex = (quickEditState.currentFindIndex + 1) % quickEditState.findMatches.length;
    highlightCurrentMatch();

    document.getElementById('quickEditMatchCount').textContent =
        `${quickEditState.currentFindIndex + 1} of ${quickEditState.findMatches.length}`;
}

function findPreviousQuickEdit() {
    if (quickEditState.findMatches.length === 0) return;

    quickEditState.currentFindIndex = quickEditState.currentFindIndex - 1;
    if (quickEditState.currentFindIndex < 0) {
        quickEditState.currentFindIndex = quickEditState.findMatches.length - 1;
    }

    highlightCurrentMatch();

    document.getElementById('quickEditMatchCount').textContent =
        `${quickEditState.currentFindIndex + 1} of ${quickEditState.findMatches.length}`;
}

function replaceQuickEdit() {
    const findInput = document.getElementById('quickEditFindInput');
    const replaceInput = document.getElementById('quickEditReplaceInput');
    const searchTerm = findInput.value;
    const replaceTerm = replaceInput.value;

    if (!searchTerm || quickEditState.findMatches.length === 0) return;

    const currentMatch = quickEditState.findMatches[quickEditState.currentFindIndex];
    const text = currentMatch.textContent;
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    currentMatch.textContent = text.replace(regex, replaceTerm);

    // Update parity if it's an algorithm cell
    if (currentMatch.classList.contains('alg-cell')) {
        updateAlgorithmCellParity(currentMatch);
    }

    // Re-run search to update matches without closing
    liveSearchQuickEdit();
}

function replaceAllQuickEdit() {
    const findInput = document.getElementById('quickEditFindInput');
    const replaceInput = document.getElementById('quickEditReplaceInput');
    const searchTerm = findInput.value;
    const replaceTerm = replaceInput.value;

    if (!searchTerm) return;

    // Get all cells in scope
    const modal = document.getElementById('quickEditModal');
    let cells;

    if (quickEditState.currentTab === 'general') {
        const scopeSelector = document.getElementById('quickEditScopeSelector');
        const scope = scopeSelector ? scopeSelector.value : 'global';
        if (scope === 'global') {
            cells = Array.from(modal.querySelectorAll('#quickEditGeneralTab .editable'));
        } else {
            const fieldMap = {
                'name': 'displayName',
                'subtitle': 'subtitle',
                'notes': 'notes'
            };
            const field = fieldMap[scope];
            cells = Array.from(modal.querySelectorAll(`.editable[data-field="${field}"]`));
        }
    } else {
        cells = Array.from(modal.querySelectorAll('.alg-cell'));
    }

    let replaceCount = 0;
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

    cells.forEach(cell => {
        const text = cell.textContent;
        if (regex.test(text)) {
            cell.textContent = text.replace(regex, replaceTerm);
            replaceCount++;

            // Update parity if it's an algorithm cell
            if (cell.classList.contains('alg-cell')) {
                updateAlgorithmCellParity(cell);
            }
        }
    });

    showToast(`Replaced ${replaceCount} occurrences`, 2000, 'success');

    // Re-run search to update display
    liveSearchQuickEdit();
}

function handleReplaceEnter(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        replaceQuickEdit();
    }
}

function changeFindScope() {
    const scopeSelector = document.getElementById('quickEditScopeSelector');
    if (!scopeSelector) return;

    const newScope = scopeSelector.value;
    quickEditState.findReplaceScope = newScope;

    // Re-run search with new scope
    liveSearchQuickEdit();
}

function saveQuickEditChanges() {
    const modal = document.getElementById('quickEditModal');
    if (!modal) return;

    // Save general info
    const generalRows = modal.querySelectorAll('#quickEditGeneralBody tr');
    generalRows.forEach(row => {
        const caseName = row.dataset.case;
        const displayNameCell = row.querySelector('[data-field="displayName"]');
        const subtitleCell = row.querySelector('[data-field="subtitle"]');
        const notesCell = row.querySelector('[data-field="notes"]');

        const displayName = displayNameCell.textContent.trim();
        const subtitle = subtitleCell.textContent.trim();
        // For notes, get the raw HTML from data attribute (updated on blur)
        const notes = notesCell.dataset.rawHtml || notesCell.textContent.trim();

        // Save display name
        if (displayName) {
            displayNames[caseName] = displayName;
        }

        // Save subtitle
        if (subtitle) {
            perCaseSubtitles.set(caseName, subtitle);
        } else {
            perCaseSubtitles.delete(caseName);
        }

        // Save notes
        if (notes) {
            comments.set(caseName, notes);
        } else {
            comments.delete(caseName);
        }

        // Update data-original attributes for general tab
        displayNameCell.dataset.original = displayName;
        subtitleCell.dataset.original = subtitle;
        notesCell.dataset.original = notes;
        notesCell.dataset.rawHtml = notes; // Also update rawHtml
    });

    // Save algorithms
    const algRows = modal.querySelectorAll('#quickEditAlgorithmsBody tr');
    algRows.forEach(row => {
        const caseName = row.dataset.case;
        const algCells = row.querySelectorAll('.alg-cell');

        const algs = Array.from(algCells)
            .map(cell => cell.textContent.trim())
            .filter(alg => alg);

        if (algs.length > 0) {
            customAlgorithms.set(caseName, {
                odd: [],
                even: algs
            });
        } else {
            customAlgorithms.delete(caseName);
        }

        // Update data-original attributes for algorithm cells
        algCells.forEach(cell => {
            cell.dataset.original = cell.textContent.trim();
        });
    });

    // Update initial state checkpoint
    window.quickEditInitialState = {
        displayNames: { ...displayNames },
        perCaseSubtitles: new Map(perCaseSubtitles),
        comments: new Map(comments),
        customAlgorithms: new Map(customAlgorithms)
    };

    // Recalculate parity
    calculateAndCacheAllParity();

    // Save state and re-render
    saveState();
    render();

    showToast('All changes saved successfully!', 2000, 'success');
}

function closeQuickEditModal() {
    // Check for unsaved changes
    const modal = document.getElementById('quickEditModal');
    if (!modal) return;

    // Check if any data has changed
    let hasChanges = false;

    // Check general tab changes
    const generalRows = modal.querySelectorAll('#quickEditGeneralBody tr');
    generalRows.forEach(row => {
        const cells = row.querySelectorAll('.editable');
        cells.forEach(cell => {
            const original = cell.dataset.original || '';
            let current;

            // For notes cells, use raw HTML
            if (cell.classList.contains('notes-cell')) {
                current = cell.dataset.rawHtml || '';
            } else {
                current = cell.textContent.trim();
            }

            if (original !== current) {
                hasChanges = true;
            }
        });
    });

    // Check algorithms tab changes
    const algRows = modal.querySelectorAll('#quickEditAlgorithmsBody tr');
    algRows.forEach(row => {
        const cells = row.querySelectorAll('.alg-cell');
        cells.forEach(cell => {
            const original = cell.dataset.original || '';
            const current = cell.textContent.trim();
            if (original !== current) {
                hasChanges = true;
            }
        });
    });

    if (hasChanges) {
        showSaveDiscardConfirmation(
            'You have unsaved changes. What would you like to do?',
            () => {
                // Save
                saveQuickEditChanges();
                forceCloseQuickEditModal();
            },
            () => {
                // Discard
                forceCloseQuickEditModal();
            },
            () => {
                // Cancel - do nothing
            }
        );
        return;
    }

    forceCloseQuickEditModal();
}

function forceCloseQuickEditModal() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('quickEditModal');
        if (modal) {
            if (modal._lazyObserver) modal._lazyObserver.disconnect();
            if (modal._themeObserver) modal._themeObserver.disconnect();
            modal.remove();
            document.body.classList.remove('modal-open');
        }

        // Reset state
        quickEditState = {
            currentTab: 'general',
            findReplaceOpen: false,
            findReplaceScope: null,
            currentFindIndex: -1,
            findMatches: [],
            lastFocusedCell: null,
            allMatchRanges: [],
            visibleAlgColumns: 6
        };
    });
}

function revertQuickEditChanges() {
    if (!window.quickEditInitialState) return;

    showConfirmation('Are you sure you want to revert all changes to the last save point?', () => {
        // Restore initial state
        displayNames = { ...window.quickEditInitialState.displayNames };
        perCaseSubtitles = new Map(window.quickEditInitialState.perCaseSubtitles);
        comments = new Map(window.quickEditInitialState.comments);
        customAlgorithms = new Map(window.quickEditInitialState.customAlgorithms);

        // Close and reopen modal to refresh
        closeQuickEditModal();
        openQuickEditModal();

        showToast('Reverted to last save point', 2000, 'info');
    });
}

window.showQuickEditInfoModal = function () {
    let infoModal = document.getElementById('quickEditInfoModal');
    if (!infoModal) {
        infoModal = document.createElement('div');
        infoModal.id = 'quickEditInfoModal';
        infoModal.className = 'training-info-modal';
        infoModal.innerHTML = `
            <div class="training-info-content">
                <div class="training-info-header">
                    <span class="training-info-title">Quick Edit Guide</span>
                    <button class="training-info-close" onclick="closeQuickEditInfoModal()">&times;</button>
                </div>
                <div class="training-info-body">
                    <div class="training-info-item">
                        <div class="training-info-text"><b>Quick Edit</b> is a place for you to bulk edit cases.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">1</div>
                        <div class="training-info-text"><strong>General Info Tab:</strong> <b>Edit</b> display names, subtitles, and notes for all cases. Notes support HTML formatting, but you don't have to use it. If you do, you will be writing without syntax support, but when you click away from the cell, the HTML will render.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">2</div>
                        <div class="training-info-text"><strong>Algorithms Tab:</strong> <b>Edit</b> algorithms for all cases. Algorithms are auto-normalized when you click away from the cell <span style="font-weight:500">(so you can write 1043'2'1'-3-3 as algorithm and the cell will fix itself)</span>. They are also color-coded in real time by parity and validity: <span style="color: var(--parity-odd); font-weight: 600;">green = odd</span>, <span style="color: var(--parity-even); font-weight: 600;">blue = even</span>, <span style="color: var(--parity-odd-mirror); font-weight: 600;">dark-green = odd (mirrored)</span>, <span style="color: var(--parity-even-mirror); font-weight: 600;">dark-blue = even (mirrored)</span>, <span style="color: var(--parity-invalid); font-weight: 600;">red = invalid</span> (either doesn't solve the case or does not lead to valid squan position at all).</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">3</div>
                        <div class="training-info-text"><strong>Switch Tabs:</strong> To switch between the <b>General Info</b> tab and the <b>Algorithms</b>, directly click on their names. for smaller screens like phones, the tab switch might not be obvious. You have to click on the title "<b>Quick Edit</b>" to change tabs.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">4</div>
                        <div class="training-info-text"><strong>Reveal Columns:</strong> It is not hardcoded that you can have at most 6 algorithms for a case. Click +2 in the Algorithms tab to reveal more columns as needed.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">5</div>
                        <div class="training-info-text"><strong>Navigation:</strong> Use Tab to move one cell to the right, Shift+Tab for one cell to the left. Use Enter to move one cell down.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">6</div>
                        <div class="training-info-text"><strong>Find and Replace:</strong> Press Ctrl+F (or Cmd+F on Mac) or directly press the search button on top to open find and replace popup. You can move the popup around by clicking and dragging. Select scope to search in specific fields, e.g. only in titles. Use Previous/Next arrow keys to navigate matches.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">7</div>
                        <div class="training-info-text"><strong>Variable Table:</strong> While in the algorithm tab, press the <b>"var"</b> button on the toolbar to access variable table. There you can store commonly use algorithm parts <b>(</b>like, <span style="font-weight:500">scal-kite=/(-1,-2)/(-3,0)/</span><b>)</b> and you can reuse them anywhere. To reuse the variable, wrap it around two colons (:variableName:). (ie, the algorithm for <span style="font-weight:500">left 5-1/pair</span> can be written as <span style="font-weight:500">/(-2,3):scal-kite:</span> provided that you have scal-kite saved in the variable table.). The variable will expand when you click away. The color-coding works even with variables.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">7</div>
                        <div class="training-info-text"><strong>Save:</strong> Click Save to apply all changes. Exit without saving to <b>discard all the changes</b></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(infoModal);
    }

    infoModal.classList.add('active');
    if (typeof pushModalState === 'function') pushModalState('quickEditInfoModal', closeQuickEditInfoModal);
};

window.closeQuickEditInfoModal = function () {
    closeModalWithHistory(() => {
        const modal = document.getElementById('quickEditInfoModal');
        if (modal) {
            modal.classList.remove('active');
        }
    });
};

// REPLACE:
function openAlgVariablesModal() {
    const existing = document.getElementById('algVariablesModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'algVariablesModal';
    modal.style.cssText = `
        position: fixed; inset: 0; z-index: 10100;
        display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,0.5);
    `;

    modal.innerHTML = `
        <div style="
            background: var(--surface);
            border-radius: 14px;
            width: min(560px, 95vw);
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.25);
            border: 1px solid var(--surface-border);
        ">
            <div style="
                display: flex; align-items: center; justify-content: space-between;
                padding: 18px 22px; border-bottom: 1px solid var(--surface-border);
                background: var(--modal-header-bg); flex-shrink: 0;
            ">
                <span style="font-size: 1.15rem; font-weight: 700; color: var(--text-ui);">Algorithm Variables</span>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button onclick="saveAlgVariables()" style="
                        padding: 7px 18px; background: var(--accent); color: white;
                        border: none; border-radius: 7px; cursor: pointer; font-weight: 600; font-size: 0.9rem;
                    ">Save</button>
                    <button onclick="closeAlgVariablesModal()" style="
                        background: none; border: none; cursor: pointer; font-size: 1.5rem;
                        color: var(--sidebar-close-color); line-height: 1; padding: 2px 6px;
                    ">&times;</button>
                </div>
            </div>
            <div style="padding: 14px 22px 6px; flex-shrink: 0; color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5; background: var(--surface);">
                Use <code style="background:var(--surface2);border:1px solid var(--border-color);padding:1px 5px;border-radius:4px;font-size:0.82rem;color:var(--text-primary);">:varName:</code> inside any algorithm to insert the variable's value at defocus.
                Variable values are normalized when you click away.
            </div>
            <div style="overflow-y: auto; flex: 1; padding: 10px 22px 18px;">
                <table style="width:100%; border-collapse: collapse;" id="algVarTable">
                    <thead style="background: var(--surface2); position: sticky; top: 0;">
                        <tr>
                            <th style="text-align:left; padding: 8px 6px; font-size:0.85rem; color:var(--text-secondary); border-bottom:1px solid var(--surface-border); width:28%;">Name</th>
                            <th style="text-align:left; padding: 8px 6px; font-size:0.85rem; color:var(--text-secondary); border-bottom:1px solid var(--surface-border);">Value</th>
                            <th style="width:36px; border-bottom:1px solid var(--surface-border); background: var(--surface2);"></th>
                        </tr>
                    </thead>
                    <tbody id="algVarTableBody">
                        ${renderAlgVarRows()}
                    </tbody>
                </table>
                <button onclick="addAlgVarRow()" style="
                    margin-top: 12px; padding: 7px 16px; background: var(--surface2);
                    border: 1px dashed var(--border-color); border-radius: 7px;
                    cursor: pointer; font-size: 0.9rem; color: var(--text-ui);
                    width: 100%; transition: background 0.15s;
                " onmouseover="this.style.background='var(--surface-border)'" onmouseout="this.style.background='var(--surface2)'">+ Add Variable</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('mousedown', e => { if (e.target === modal) closeAlgVariablesModal(); });
    if (typeof pushModalState === 'function') pushModalState('algVariablesModal', closeAlgVariablesModal);
}

function closeAlgVariablesModal() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('algVariablesModal');
        if (modal) modal.remove();
    });
}

function renderAlgVarRows() {
    if (!algVariables || algVariables.size === 0) return '';
    return Array.from(algVariables.entries()).map(([name, value]) => algVarRowHTML(name, value)).join('');
}

function algVarRowHTML(name, value) {
    return `
        <tr class="alg-var-row">
            <td style="padding: 6px 6px;">
                <input class="alg-var-name" type="text" value="${name}" placeholder="name"
                    style="width:100%; padding:6px 8px; border:1px solid var(--border-color); border-radius:6px; background:var(--surface2); color:var(--text-ui); font-size:0.9rem; font-family: monospace;">
            </td>
            <td style="padding: 6px 6px;">
                <input class="alg-var-value" type="text" value="${value}" placeholder="e.g. /(3,0)/(2,2)/"
                    style="width:100%; padding:6px 8px; border:1px solid var(--border-color); border-radius:6px; background:var(--surface2); color:var(--text-ui); font-size:0.9rem; font-family: monospace;"
                    onblur="this.value = this.value.trim() && this.value.trim() !== 'Done!' && window.ScrambleNormalizer ? window.ScrambleNormalizer.normalizeScramble(this.value.trim()) : this.value.trim()">
            </td>
            <td style="padding: 6px 4px; text-align:center;">
                <button onclick="this.closest('tr').remove()" style="
                    background: var(--delete-btn-bg); border: none; border-radius: 5px;
                    cursor: pointer; width:28px; height:28px; display:flex; align-items:center; justify-content:center;
                "><img src="res/delete.svg" style="width:14px;height:14px;" alt="Delete"></button>
            </td>
        </tr>
    `;
}

function addAlgVarRow() {
    const tbody = document.getElementById('algVarTableBody');
    if (!tbody) return;
    const tr = document.createElement('tr');
    tr.className = 'alg-var-row';
    tr.innerHTML = algVarRowHTML('', '').match(/<tr[^>]*>([\s\S]*)<\/tr>/)[1];
    tbody.appendChild(tr);
    tr.querySelector('.alg-var-name').focus();
}

function saveAlgVariables() {
    const rows = document.querySelectorAll('#algVarTableBody .alg-var-row');
    algVariables = new Map();
    rows.forEach(row => {
        const name = row.querySelector('.alg-var-name').value.trim().replace(/[^a-zA-Z0-9_]/g, '');
        const value = row.querySelector('.alg-var-value').value.trim();
        if (name && value) algVariables.set(name, value);
    });
    saveState();
    document.getElementById('algVariablesModal').remove();
    showToast('Variables saved!', 2000, 'success');
}

// Make functions globally accessible
window.openQuickEditModal = openQuickEditModal;
window.revertQuickEditChanges = revertQuickEditChanges;
window.closeQuickEditModal = closeQuickEditModal;
window.switchQuickEditTab = switchQuickEditTab;
window.toggleQuickEditTab = toggleQuickEditTab;
window.findNextQuickEdit = findNextQuickEdit;
window.replaceQuickEdit = replaceQuickEdit;
window.replaceAllQuickEdit = replaceAllQuickEdit;
window.saveQuickEditChanges = saveQuickEditChanges;
window.openQuickEditFindReplace = openQuickEditFindReplace;
window.closeQuickEditFindReplace = closeQuickEditFindReplace;
window.findPreviousQuickEdit = findPreviousQuickEdit;
window.liveSearchQuickEdit = liveSearchQuickEdit;
window.handleReplaceEnter = handleReplaceEnter;
window.changeFindScope = changeFindScope;
window.addAlgorithmColumns = addAlgorithmColumns;
window.openAlgVariablesModal = openAlgVariablesModal;
window.saveAlgVariables = saveAlgVariables;
window.addAlgVarRow = addAlgVarRow;

// Global function to toggle auto-select text on focus
window.setAutoSelectTextOnFocus = function (enabled) {
    autoSelectTextOnFocus = enabled;
    localStorage.setItem('autoSelectTextOnFocus', enabled.toString());
};

// Drag functionality for find/replace popup
function initializeFindReplaceDrag(popup) {
    let isDragging = false;
    let currentX = 0;
    let currentY = 0;
    let initialX;
    let initialY;

    const header = popup.querySelector('.find-replace-header');

    header.style.cursor = 'move';

    header.addEventListener('mousedown', dragStart);
    header.addEventListener('touchstart', dragStart);

    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);

    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);

    // Reset position function
    popup.resetPosition = function () {
        currentX = 0;
        currentY = 0;
        popup.style.transform = 'translate(0, 0)';
    };

    function dragStart(e) {
        const rect = popup.getBoundingClientRect();

        if (e.type === 'touchstart') {
            initialX = e.touches[0].clientX - currentX;
            initialY = e.touches[0].clientY - currentY;
        } else {
            initialX = e.clientX - currentX;
            initialY = e.clientY - currentY;
        }

        if (e.target === header || header.contains(e.target)) {
            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();

            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            setTranslate(currentX, currentY, popup);
        }
    }

    function dragEnd(e) {
        isDragging = false;
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate(${xPos}px, ${yPos}px)`;
    }
}


/* ==== FILE: js/training-modal.js ==== */

﻿// Training modal variables
let currentTrainingCase = null;
let trainingScrambles = [];
let currentScrambleIndex = 0;
let timerRunning = false;
let timerStartTime = 0;
let timerInterval = null;
let timerElapsed = 0;
let isHolding = false;
let preGeneratedScrambles = [];
let currentScrambleText = '';
let trainingModalElement = null;
let scrambleHistory = [];
let currentHistoryIndex = -1;
let trainingScrambleImageSize = 200;
let trainingScrambleTextSize = 16;
let trainingHoldToStart = 0.22;
let holdStartTime = 0;
let isHoldReady = false;
let inspectionRunning = false;
let inspectionStartTime = 0;
let inspectionElapsed = 0;
let lastInspectionElapsed = 0;
let lastParityQuizWrong = false;
let inspectionInterval = null;
let isInspectionPhase = false;
let parityQuizPhase = false;
let parityQuizAnswer = null;
let parityQuizCorrect = false;
let trainingEnableInspection = localStorage.getItem('trainingEnableInspection') === 'true';
let trainingEnableParityQuiz = localStorage.getItem('trainingEnableParityQuiz') === 'true';

// Create the training modal dynamically
function createTrainingModal() {
    if (trainingModalElement) return;

    const modal = document.createElement('div');
    modal.id = 'trainingModal';
    modal.className = 'training-modal';
    modal.innerHTML = `
        <div class="training-modal-header">
            <div style="display: flex; gap: 10px; align-items: center;">
                <button class="training-modal-title" id="trainingCaseName" style="background: none; border: none; cursor: pointer; padding: 0; font: inherit; text-align: left; color: var(--link-color); text-decoration: underline;" title="Click to select angles to train">Training: Case Name</button>
                <button class="training-modal-info training-info-btn" id="trainingInfoBtn" title="Training mode help">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                </button>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <button class="training-modal-refresh" id="trainingPrevBtn" title="Previous scramble">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <button class="training-modal-refresh" id="trainingRefreshBtn" title="Regenerate scramble">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                    </svg>
                </button>
                <button class="training-modal-refresh" id="trainingSettingsBtn" title="Training settings">
                    <img src="res/training-settings.svg" height="20 px" width="20 px">
                </button>
                <button class="training-modal-close" id="trainingCloseBtn" title="Close training">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
        <div class="training-modal-scramble" id="trainingScramble" title="Click to analyze parity">Loading...</div>
        <div class="training-modal-timer-zone" id="trainingTimerZone">
            <div class="training-modal-image-container">
                <div class="training-modal-image" id="trainingScrambleImage"></div>
            </div>
            <div id="trainingTimerSubInfo" style="display:none; font-size:0.78rem;color:var(--text-muted);font-weight:500;text-align:center;line-height:1.6;width:100%;"></div>
            <div class="training-modal-timer" id="trainingTimer">0.000</div>
            <div id="trainingInspectionLabel" style="display:none; font-size:0.78rem;color:var(--accent);font-weight:600;letter-spacing:0.05em;"></div>
        </div>
    <div id="prevScrambleBar" style="position:fixed; bottom:0; left:0; width:100%; display:none; padding:8px 16px; font-family:Consolas,Monaco,'Courier New',monospace; text-align:center; z-index:10001; box-sizing:border-box;"><span style="color: var(--prevscramble-empty-color); font-style:italic;">No previous scramble to show</span></div>
    `;

    document.body.appendChild(modal);
    trainingModalElement = modal;

    // Add event listeners
    document.getElementById('trainingRefreshBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        nextScrambleManual();
    });

    document.getElementById('trainingPrevBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        previousScramble();
    });

    document.getElementById('trainingCloseBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        closeTrainingModal();
    });

    document.getElementById('trainingScramble').addEventListener('click', (e) => {
        e.stopPropagation();
        openParityAnalysisFromTraining();
    });

    document.getElementById('trainingCaseName').addEventListener('click', (e) => {
        e.stopPropagation();
        openShapeIndexSelector();
    });

    document.getElementById('trainingInfoBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        openTrainingInfoModal();
    });

    document.getElementById('trainingSettingsBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        openTrainingSettingsModal();
    });

    const timerZone = document.getElementById('trainingTimerZone');

    // Mouse events for timer zone
    timerZone.addEventListener('mousedown', e => { if (parityQuizPhase) return; handleTimerMouseDown(e); });
    timerZone.addEventListener('mouseup', e => { if (parityQuizPhase) return; handleTimerMouseUp(e); });
    timerZone.addEventListener('mouseleave', e => { if (parityQuizPhase) return; handleTimerMouseLeave(e); });

    timerZone.addEventListener('touchstart', e => { if (parityQuizPhase) return; handleTimerTouchStart(e); });
    timerZone.addEventListener('touchend', e => { if (parityQuizPhase) return; handleTimerTouchEnd(e); });
}

function openTrainingModal(caseName) {
    createTrainingModal();

    const modal = document.getElementById('trainingModal');
    const titleEl = document.getElementById('trainingCaseName');

    currentTrainingCase = caseName;

    pushModalState('trainingModal', closeTrainingModal);

    // Find the original data item to get the canonical name
    const dataItem = data.find(d => d.name === caseName);
    if (!dataItem) {
        alert('Case not found.');
        return;
    }

    // Use the canonical name from the data item to look up in shapeIndex
    const shapeIndexItem = shapeIndex.find(s => s.name === dataItem.name);
    if (!shapeIndexItem) {
        alert('Case not found in shape index.');
        return;
    }

    // Get all available scrambles (org + mir)
    const allScrambles = [...(shapeIndexItem.org || []), ...(shapeIndexItem.mir || [])];

    // Use selected indices if they exist in memory, otherwise use all
    const selectedKey = `training_selected_${caseName}`;
    if (window.trainingSelections && window.trainingSelections[selectedKey]) {
        trainingScrambles = window.trainingSelections[selectedKey];
    } else {
        trainingScrambles = allScrambles;
        // Initialize selection storage
        if (!window.trainingSelections) window.trainingSelections = {};
        window.trainingSelections[selectedKey] = allScrambles;
    }

    if (trainingScrambles.length === 0) {
        alert('No training scrambles available for this case.');
        return;
    }

    titleEl.textContent = `Training: ${getDisplayName(caseName)}`;
    currentScrambleIndex = 0;
    preGeneratedScrambles = [];
    timerElapsed = 0;
    scrambleHistory = [];
    currentHistoryIndex = -1;
    isHoldReady = false;

    // Load training-specific settings
    const savedTrainingImageSize = localStorage.getItem('trainingScrambleImageSize');
    const savedTrainingTextSize = localStorage.getItem('trainingScrambleTextSize');
    const savedTrainingHoldToStart = localStorage.getItem('trainingHoldToStart');

    trainingScrambleImageSize = savedTrainingImageSize ? parseInt(savedTrainingImageSize) : 200;
    trainingScrambleTextSize = savedTrainingTextSize ? parseInt(savedTrainingTextSize) : 16;
    trainingHoldToStart = savedTrainingHoldToStart ? parseFloat(savedTrainingHoldToStart) : 0.22;
    trainingEnableInspection = localStorage.getItem('trainingEnableInspection') === 'true';
    trainingEnableParityQuiz = localStorage.getItem('trainingEnableParityQuiz') === 'true';

    // Pre-generate 3 scrambles
    for (let i = 0; i < 3; i++) {
        preGeneratedScrambles.push(generateNextScrambleData());
    }

    displayNextScramble();

    modal.classList.add('active');
    document.body.classList.add('modal-open');
    applyPrevScrambleBar();
    applyTimerSize();
}

function closeTrainingModal() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('trainingModal');
        if (!modal) return;

        modal.classList.remove('active');
        document.body.classList.remove('modal-open');

        // Stop timer if running
        if (timerRunning) {
            stopTimerOnly();
        }

        // Reset all training state
        preGeneratedScrambles = [];
        timerElapsed = 0;
        scrambleHistory = [];
        currentHistoryIndex = -1;
        currentTrainingCase = null;
        isHoldReady = false;
        inspectionRunning = false;
        isInspectionPhase = false;
        parityQuizPhase = false;
        clearInterval(inspectionInterval);

        // Soft render when coming back from training
        filterAndSort(true);
    });
}

window.generateNextScrambleData = generateNextScrambleData;
window._origGenerateNextScrambleData_ref = null; // will be set by selector
function generateNextScrambleData() {
    if (trainingScrambles.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * trainingScrambles.length);
    const scramble = trainingScrambles[randomIndex];
    const hexCode = shapeIndexToHex(scramble);

    let scrambleText = hexCode;
    try {
        const state = parseHexFormat(hexCode);
        scrambleText = window.sq1Tools.scrambleFromState(state) || hexCode;

        // Apply scramble styling
        if (typeof SQ1ColorizerLib !== 'undefined' && SQ1ColorizerLib.processScramble) {
            const processed = SQ1ColorizerLib.processScramble(scrambleText);
            scrambleText = processed.html || scrambleText;
        }
    } catch (error) {
        console.error('Error generating scramble:', error);
    }

    let scrambleImage = '<div style="color: var(--text-muted)">Image unavailable</div>';
    try {
        // Use training-specific image size
        if (typeof visualizeFromScrambleNotation !== 'undefined') {
            const scrambleNotation = hexCode;
            try {
                const state = parseHexFormat(hexCode);
                const notation = window.sq1Tools.scrambleFromState(state) || hexCode;
                scrambleImage = visualizeFromScrambleNotation(notation, trainingScrambleImageSize, colorScheme);
            } catch (e) {
                console.error('Error with new visualizer:', e);
                scrambleImage = generateScrambleSVGFromHex(hexCode);
            }
        } else {
            scrambleImage = generateScrambleSVGFromHex(hexCode);
        }
    } catch (error) {
        console.error('Error generating scramble image:', error);
    }

    return { text: scrambleText, image: scrambleImage };
}

window.displayNextScramble = displayNextScramble;
function displayNextScramble() {
    // Clear inspection/parity quiz state
    clearInterval(inspectionInterval);
    inspectionRunning = false;
    isInspectionPhase = false;
    parityQuizPhase = false;
    inspectionElapsed = 0;
    const overlay = document.getElementById('parityQuizOverlay');
    if (overlay) overlay.remove();
    const insLabel = document.getElementById('trainingInspectionLabel');
    if (insLabel) insLabel.style.display = 'none';
    lastParityQuizWrong = false;
    inspectionElapsed = 0;

    // Show/hide case subtitle for multi-case mode
    const sub = document.getElementById('multiCaseSub');
    if (sub) sub.style.display = window._multiCaseMode ? 'block' : 'none';

    if (preGeneratedScrambles.length === 0) return;

    // Get the next pre-generated scramble
    const scrambleData = preGeneratedScrambles.shift();

    if (scrambleData) {
        currentScrambleText = scrambleData.text.replace(/<[^>]*>/g, ''); // Strip HTML for clipboard
        const scrambleEl = document.getElementById('trainingScramble');
        scrambleEl.innerHTML = scrambleData.text;
        scrambleEl.style.fontSize = trainingScrambleTextSize + 'px';
        document.getElementById('trainingScrambleImage').innerHTML = scrambleData.image;

        // Add to history
        scrambleHistory.push(scrambleData);
        currentHistoryIndex = scrambleHistory.length - 1;

        // Limit history to 50 scrambles
        if (scrambleHistory.length > 50) {
            scrambleHistory.shift();
            currentHistoryIndex--;
        }
    }

    // Generate a new scramble to keep the queue full (async, won't block)
    setTimeout(() => {
        preGeneratedScrambles.push(generateNextScrambleData());
    }, 0);

    applyPrevScrambleBar();
}

function previousScramble() {
    if (currentHistoryIndex <= 0) return; // No previous scramble

    stopTimerOnly();
    currentHistoryIndex--;

    const scrambleData = scrambleHistory[currentHistoryIndex];
    currentScrambleText = scrambleData.text.replace(/<[^>]*>/g, '');
    const scrambleEl = document.getElementById('trainingScramble');
    scrambleEl.innerHTML = scrambleData.text;
    scrambleEl.style.fontSize = trainingScrambleTextSize + 'px';
    document.getElementById('trainingScrambleImage').innerHTML = scrambleData.image;
    applyPrevScrambleBar();
}

function nextScrambleManual() {
    stopTimerOnly();
    displayNextScramble();
}

function applyTimerSize() {
    const size = parseInt(localStorage.getItem('trainingTimerSize') || 80);
    const el = document.getElementById('trainingTimer');
    if (el) el.style.fontSize = size + 'px';
}

function applyPrevScrambleBar() {
    const bar = document.getElementById('prevScrambleBar');
    if (!bar) return;
    const trainingActive = document.getElementById('trainingModal')?.classList.contains('active');
    const enabled = localStorage.getItem('trainingShowPrevScramble') === 'true';
    bar.style.fontSize = Math.max(10, trainingScrambleTextSize - 2) + 'px';
    if (!enabled || !trainingActive) { bar.style.display = 'none'; return; }
    bar.style.display = 'block';
    const prevIdx = currentHistoryIndex - 1;
    if (prevIdx < 0 || !scrambleHistory[prevIdx]) {
        bar.innerHTML = '<span style="color:var(--text-muted); font-style:italic; font-family:inherit;">No previous scramble to show</span>';
    } else {
        bar.innerHTML = `<span style="color: var(--text-secondary); font-family:inherit;">Previous scramble: </span>${scrambleHistory[prevIdx].text}`;
    }
}

function regenerateScrambleLookahead() {
    preGeneratedScrambles = [];
    for (let i = 0; i < 3; i++) {
        preGeneratedScrambles.push(generateNextScrambleData());
    }
    if (currentHistoryIndex === scrambleHistory.length - 1 || scrambleHistory.length === 0) {
        displayNextScramble();
    }
}

function openParityAnalysisFromTraining() {
    // Strip HTML tags to get clean scramble text
    const cleanScramble = currentScrambleText.replace(/<[^>]*>/g, '').trim();

    if (typeof window.ParityTracerLibrary === 'undefined') {
        alert('Parity Tracer library not loaded');
        return;
    }

    window.ParityTracerLibrary.createModal({
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#ffffff',
        hideInstructionButton: hideInstructions,
        instructionText1: 'Enter your scramble in the top input bar and press Analyze to trace parity using Kale\'s method.',
        instructionText2: 'You can change the color scheme from Color Scheme Settings in the main Settings menu.',
        instructionText3: 'Customize the tracing start point from the settings button at the bottom right.',
        topColor: colorScheme.topColor,
        topColorName: getColorName(colorScheme.topColor),
        topColorShort: getColorName(colorScheme.topColor).charAt(0),
        bottomColor: colorScheme.bottomColor,
        bottomColorName: getColorName(colorScheme.bottomColor),
        bottomColorShort: getColorName(colorScheme.bottomColor).charAt(0),
        frontColor: colorScheme.frontColor,
        rightColor: colorScheme.rightColor,
        backColor: colorScheme.backColor,
        leftColor: colorScheme.leftColor,
        scrambleText: cleanScramble,
        generateImage: true,
        imageSize: trainingScrambleImageSize || 200
    });
}

// Mouse handlers for timer zone
function handleTimerMouseDown() {
    if (timerRunning) return;
    // Start inspection immediately, no hold
    if (trainingEnableInspection && !isInspectionPhase && !parityQuizPhase) {
        if (trainingEnableParityQuiz) startParityQuizInspection();
        else startInspection();
        return;
    }
    // During inspection (non-quiz), hold to start solve
    if (isInspectionPhase && !parityQuizPhase) {
        isHolding = true;
        isHoldReady = false;
        holdStartTime = Date.now();
        document.getElementById('trainingTimer').style.color = 'var(--card-learning-border)';
        const holdCheckInterval = setInterval(() => {
            if (!isHolding) { clearInterval(holdCheckInterval); return; }
            const holdDuration = (Date.now() - holdStartTime) / 1000;
            if (holdDuration >= trainingHoldToStart && !isHoldReady) {
                isHoldReady = true;
                document.getElementById('trainingTimer').style.color = 'var(--card-learned-border)';
                clearInterval(holdCheckInterval);
            }
        }, 10);
        return;
    }
    // Normal mode (no inspection), hold to start solve
    isHolding = true;
    isHoldReady = false;
    holdStartTime = Date.now();
    document.getElementById('trainingTimer').style.color = 'var(--card-learning-border)';
    const holdCheckInterval = setInterval(() => {
        if (!isHolding) { clearInterval(holdCheckInterval); return; }
        const holdDuration = (Date.now() - holdStartTime) / 1000;
        if (holdDuration >= trainingHoldToStart && !isHoldReady) {
            isHoldReady = true;
            document.getElementById('trainingTimer').style.color = 'var(--card-learned-border)';
            clearInterval(holdCheckInterval);
        }
    }, 10);
}

function handleTimerMouseUp() {
    if (timerRunning) {
        stopTimerOnly();
        displayNextScramble();
        return;
    }
    // During inspection (non-quiz): release after hold-ready → start solve
    if (isInspectionPhase && !parityQuizPhase && isHolding && isHoldReady) {
        isHolding = false;
        isHoldReady = false;
        document.getElementById('trainingTimer').style.color = 'var(--text-primary)';
        stopInspectionAndStartTimer();
        return;
    }
    // During inspection (non-quiz): release but not ready → cancel hold, stay in inspection
    if (isInspectionPhase && !parityQuizPhase && isHolding) {
        isHolding = false;
        isHoldReady = false;
        document.getElementById('trainingTimer').style.color = 'var(--text-primary)';
        return;
    }
    // Normal mode: release after hold-ready → start timer
    if (!isInspectionPhase && isHolding && isHoldReady) {
        isHolding = false;
        isHoldReady = false;
        document.getElementById('trainingTimer').style.color = 'var(--text-primary)';
        startTimer();
        return;
    }
    if (isHolding) {
        isHolding = false;
        isHoldReady = false;
        document.getElementById('trainingTimer').style.color = 'var(--text-primary)';
    }
}

function handleTimerMouseLeave() {
    if (isHolding && !timerRunning) {
        isHolding = false;
        isHoldReady = false;
        // If in inspection, go back to blue inspection color
        if (isInspectionPhase && !parityQuizPhase) {
            document.getElementById('trainingTimer').style.color = 'var(--text-primary)';
        } else {
            document.getElementById('trainingTimer').style.color = 'var(--text-primary)';
        }
    }
}

// Touch handlers for timer zone
function handleTimerTouchStart(e) {
    e.preventDefault();
    if (timerRunning) return;
    if (trainingEnableInspection && !isInspectionPhase && !parityQuizPhase) {
        if (trainingEnableParityQuiz) startParityQuizInspection();
        else startInspection();
        return;
    }
    // During inspection (non-quiz): hold to start solve
    if (isInspectionPhase && !parityQuizPhase) {
        isHolding = true;
        isHoldReady = false;
        holdStartTime = Date.now();
        document.getElementById('trainingTimer').style.color = 'var(--card-learning-border)';
        const holdCheckInterval = setInterval(() => {
            if (!isHolding) { clearInterval(holdCheckInterval); return; }
            const holdDuration = (Date.now() - holdStartTime) / 1000;
            if (holdDuration >= trainingHoldToStart && !isHoldReady) {
                isHoldReady = true;
                document.getElementById('trainingTimer').style.color = 'var(--card-learned-border)';
                clearInterval(holdCheckInterval);
            }
        }, 10);
        return;
    }
    // Normal mode
    isHolding = true;
    isHoldReady = false;
    holdStartTime = Date.now();
    document.getElementById('trainingTimer').style.color = 'var(--card-learning-border)';
    const holdCheckInterval = setInterval(() => {
        if (!isHolding) { clearInterval(holdCheckInterval); return; }
        const holdDuration = (Date.now() - holdStartTime) / 1000;
        if (holdDuration >= trainingHoldToStart && !isHoldReady) {
            isHoldReady = true;
            document.getElementById('trainingTimer').style.color = 'var(--card-learned-border)';
            clearInterval(holdCheckInterval);
        }
    }, 10);
}

function handleTimerTouchEnd(e) {
    e.preventDefault();
    if (timerRunning) {
        stopTimerOnly();
        displayNextScramble();
        return;
    }
    if (isInspectionPhase && !parityQuizPhase && isHolding && isHoldReady) {
        isHolding = false;
        isHoldReady = false;
        document.getElementById('trainingTimer').style.color = 'var(--text-primary)';
        stopInspectionAndStartTimer();
        return;
    }
    if (isInspectionPhase && !parityQuizPhase && isHolding) {
        isHolding = false;
        isHoldReady = false;
        document.getElementById('trainingTimer').style.color = 'var(--text-primary)';
        return;
    }
    if (!isInspectionPhase && isHolding && isHoldReady) {
        isHolding = false;
        isHoldReady = false;
        document.getElementById('trainingTimer').style.color = 'var(--text-primary)';
        startTimer();
        return;
    }
    if (isHolding) {
        isHolding = false;
        isHoldReady = false;
        document.getElementById('trainingTimer').style.color = 'var(--text-primary)';
    }
}

function startInspection() {
    isInspectionPhase = true;
    inspectionRunning = true;
    inspectionElapsed = 0;
    inspectionStartTime = Date.now();
    const timerEl = document.getElementById('trainingTimer');
    timerEl.style.color = 'var(--accent)';
    timerEl.textContent = '0.000';
    const subInfo = document.getElementById('trainingTimerSubInfo');
    if (subInfo) subInfo.style.display = 'none';

    const insLabel = document.getElementById('trainingInspectionLabel');
    if (insLabel) { insLabel.textContent = 'inspecting…'; insLabel.style.display = 'block'; }

    clearInterval(inspectionInterval);
    inspectionInterval = setInterval(() => {
        inspectionElapsed = Date.now() - inspectionStartTime;
        timerEl.textContent = (inspectionElapsed / 1000).toFixed(3);
    }, 10);
}

function stopInspectionAndStartTimer() {
    clearInterval(inspectionInterval);
    inspectionElapsed = Date.now() - inspectionStartTime;
    lastInspectionElapsed = inspectionElapsed;
    inspectionRunning = false;
    isInspectionPhase = false;
    parityQuizPhase = false;
    const insLabel = document.getElementById('trainingInspectionLabel');
    if (insLabel) insLabel.style.display = 'none';
    startTimer();
}

function startParityQuizInspection() {
    const cleanScramble = currentScrambleText.replace(/<[^>]*>/g, '').trim();
    let parity = null;
    try {
        if (typeof window.caleTracer !== 'undefined') {
            parity = window.caleTracer.getParityTextFromScramble(
                cleanScramble,
                typeof colorScheme !== 'undefined' ? colorScheme : {},
                typeof cornerStickerMode !== 'undefined' ? cornerStickerMode : 'counterclockwise'
            );
        }
    } catch (e) { }

    parityQuizAnswer = parity === 'Even' ? 'even' : (parity === 'Odd' ? 'odd' : null);
    parityQuizCorrect = false;
    parityQuizPhase = true;
    isInspectionPhase = true;
    inspectionRunning = true;
    inspectionElapsed = 0;
    inspectionStartTime = Date.now();

    const timerEl = document.getElementById('trainingTimer');
    timerEl.style.color = 'var(--accent)';
    timerEl.textContent = '0.000';
    const existingSubInfo = document.getElementById('trainingTimerSubInfo');
    if (existingSubInfo) existingSubInfo.style.display = 'none';

    const insLabel = document.getElementById('trainingInspectionLabel');
    if (insLabel) { insLabel.textContent = 'inspecting…'; insLabel.style.display = 'block'; }

    const timerZone = document.getElementById('trainingTimerZone');
    timerZone.style.position = 'relative';

    let overlay = document.getElementById('parityQuizOverlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'parityQuizOverlay';
    overlay.style.cssText = `
        position:absolute; top:0; left:0; width:100%; height:100%;
        display:flex; flex-direction:row; z-index:100; border-radius:inherit; overflow:hidden;
    `;

    const useEvilLabels = typeof evilnessFactor !== 'undefined' && evilnessFactor;
    const goodLabel = useEvilLabels ? 'GOOD ALG' : 'EVEN';
    const badLabel = useEvilLabels ? 'BAD ALG' : 'ODD';

    overlay.innerHTML = `
        <button id="pqGoodBtn" style="
            flex:1; border:none; cursor:pointer;
            background:rgba(45,106,45,0.10);
            transition:background 0.15s;
            display:flex; align-items:center; justify-content:center;
            font-size:1rem; font-weight:800;
            color:rgba(45,106,45,0.85); letter-spacing:0.06em;
        ">${goodLabel}</button>
        <div style="width:1px;background:rgba(0,0,0,0.07);flex-shrink:0;"></div>
        <button id="pqBadBtn" style="
            flex:1; border:none; cursor:pointer;
            background:rgba(139,0,0,0.10);
            transition:background 0.15s;
            display:flex; align-items:center; justify-content:center;
            font-size:1rem; font-weight:800;
            color:rgba(139,0,0,0.85); letter-spacing:0.06em;
        ">${badLabel}</button>
    `;

    timerZone.appendChild(overlay);

    const mq = window.matchMedia('(max-width:500px)');
    function applyLayout(narrow) {
        overlay.style.flexDirection = narrow ? 'column' : 'row';
        const divider = overlay.querySelector('div');
        if (divider) {
            divider.style.width = narrow ? '100%' : '1px';
            divider.style.height = narrow ? '1px' : '100%';
        }
    }
    applyLayout(mq.matches);
    mq.addEventListener('change', e => applyLayout(e.matches));

    clearInterval(inspectionInterval);
    inspectionInterval = setInterval(() => {
        inspectionElapsed = Date.now() - inspectionStartTime;
        timerEl.textContent = (inspectionElapsed / 1000).toFixed(3);
    }, 10);

    let firstAnswerWrong = false;

    function handlePQAnswer(userSaidGood) {
        const correctIsGood = parityQuizAnswer === 'even';
        parityQuizCorrect = userSaidGood === correctIsGood;

        if (parityQuizCorrect) {
            overlay.remove();
            parityQuizPhase = false;
            if (firstAnswerWrong) {
                lastParityQuizWrong = true;
            }
            stopInspectionAndStartTimer();
        } else {
            firstAnswerWrong = true;
            const wrongBtn = userSaidGood ? document.getElementById('pqGoodBtn') : document.getElementById('pqBadBtn');
            const origBg = wrongBtn.style.background;
            const origColor = wrongBtn.style.color;
            wrongBtn.style.background = 'rgba(200,0,0,0.22)';
            wrongBtn.style.color = 'rgba(180,0,0,0.8)';
            wrongBtn.disabled = true;
            setTimeout(() => {
                wrongBtn.style.background = origBg;
                wrongBtn.style.color = origColor;
                wrongBtn.disabled = false;
            }, 700);
        }
    }

    document.getElementById('pqGoodBtn').addEventListener('click', () => handlePQAnswer(true));
    document.getElementById('pqBadBtn').addEventListener('click', () => handlePQAnswer(false));
}

function startTimer() {
    if (timerRunning) return;

    // Reset timer to 0 when starting a new solve
    timerElapsed = 0;
    timerRunning = true;
    timerStartTime = Date.now();

    const timerEl = document.getElementById('trainingTimer');
    timerEl.style.color = 'var(--text-primary)';

    timerInterval = setInterval(() => {
        timerElapsed = Date.now() - timerStartTime;
        updateTimerDisplay();
    }, 10);
}

function stopTimerOnly() {
    if (!timerRunning) return;

    timerRunning = false;
    clearInterval(timerInterval);

    lastInspectionElapsed = inspectionElapsed;
    const wasParityWrong = lastParityQuizWrong;
    lastParityQuizWrong = false;
    const timerEl = document.getElementById('trainingTimer');
    timerEl.style.color = 'var(--text-primary)';
    timerEl.textContent = (timerElapsed / 1000).toFixed(3);

    const insLabel = document.getElementById('trainingInspectionLabel');
    if (insLabel) insLabel.style.display = 'none';

    const subInfo = document.getElementById('trainingTimerSubInfo');
    if (!subInfo) return;

    if (trainingEnableInspection && lastInspectionElapsed > 0) {
        const insTime = (lastInspectionElapsed / 1000).toFixed(3);
        const solveTime = (timerElapsed / 1000).toFixed(3);
        let html = `<span style="color:var(--accent);font-weight:700;">(${insTime}s inspection)</span>`;
        if (wasParityWrong) {
            html += `<br><span style="color:var(--bad-case);font-weight:600;">✗ wrong parity answer</span>`;
        }
        subInfo.innerHTML = html;
        subInfo.style.display = 'block';
        const r = subInfo.getBoundingClientRect();
        const midX = (r.left + r.right) / 2;
        const midY = (r.top + r.bottom) / 2;
        const topEl = document.elementFromPoint(midX, midY);
    } else {
        subInfo.style.display = 'none';
    }
}

function updateTimerDisplay() {
    const seconds = (timerElapsed / 1000).toFixed(3);
    document.getElementById('trainingTimer').textContent = seconds;
}

// Shape Index Selector Functions
function openShapeIndexSelector() {
    if (window._multiCaseMode) return;
    const shapeIndexItem = shapeIndex.find(s => s.name === currentTrainingCase);
    if (!shapeIndexItem) return;

    pushModalState('shapeIndexSelectorModal', closeShapeIndexSelector);

    // Lock background
    document.body.classList.add('modal-open');

    // Create or get existing modal
    let selectorModal = document.getElementById('shapeIndexSelectorModal');
    if (!selectorModal) {
        selectorModal = document.createElement('div');
        selectorModal.id = 'shapeIndexSelectorModal';
        selectorModal.className = 'shape-index-selector-modal';
        selectorModal.innerHTML = `
            <div class="shape-index-selector-content">
                <div class="shape-index-selector-header">
                    <span class="shape-index-selector-title">Select Angles to Train</span>
                    <button class="shape-index-selector-close" onclick="closeShapeIndexSelector()">&times;</button>
                </div>
                <div class="shape-index-selector-body" id="shapeIndexSelectorBody"></div>
            </div>
        `;
        document.body.appendChild(selectorModal);
    }

    const selectedKey = `training_selected_${currentTrainingCase}`;
    const currentSelection = window.trainingSelections?.[selectedKey] || [];

    const body = document.getElementById('shapeIndexSelectorBody');

    // Generate shape visuals
    const orgShapes = (shapeIndexItem.org || []).map(idx => {
        const hexCode = shapeIndexToHex(idx);
        const shapeHTML = visualizeCubeShapeOutlines(hexCode, 69, '#e7e7e7ff', '#FFFFFF', 2, -4);
        return `
            <button class="shape-index-toggle ${currentSelection.includes(idx) ? 'active' : ''}"
                    data-index="${idx}"
                    data-type="org"
                    onclick="toggleShapeIndex(${idx})"
                    style="padding: 8px; background: ${currentSelection.includes(idx) ? 'var(--surface-border)' : 'var(--surface)'}; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                ${shapeHTML}
            </button>
        `;
    }).join('');

    const mirShapes = (shapeIndexItem.mir || []).map(idx => {
        const hexCode = shapeIndexToHex(idx);
        const shapeHTML = visualizeCubeShapeOutlines(hexCode, 69, '#e7e7e7ff', '#FFFFFF', 2, -4);
        return `
            <button class="shape-index-toggle ${currentSelection.includes(idx) ? 'active' : ''}"
                    data-index="${idx}"
                    data-type="mir"
                    onclick="toggleShapeIndex(${idx})"
                    style="padding: 8px; background: ${currentSelection.includes(idx) ? 'var(--surface-border)' : 'var(--surface)'}; border: 2px solid var(--border-color); border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                ${shapeHTML}
            </button>
        `;
    }).join('');

    body.innerHTML = `
        <div class="shape-index-section">
            <div class="shape-index-section-header">
                <span style="font-weight: 600;">Original Orientation</span>
                <div>
                    <button onclick="selectAllIndices('org')" style="padding: 3px 10px; margin-right: 5px; background: var(--surface2); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 3px; cursor: pointer; font-size: 0.8rem;">Select All</button>
                    <button onclick="deselectAllIndices('org')" style="padding: 3px 10px; background: var(--surface2); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 3px; cursor: pointer; font-size: 0.8rem;">Deselect All</button>
                </div>
            </div>
            <div class="shape-index-toggles" id="orgToggles" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(112px, 1fr)); max-width: 100%; gap: 10px; margin-top: 10px;">
                ${orgShapes}
            </div>
        </div>
        <div class="shape-index-section" style="margin-top: 20px;">
            <div class="shape-index-section-header">
                <span style="font-weight: 600;">Mirror Orientation</span>
                <div>
                    <button onclick="selectAllIndices('mir')" style="padding: 3px 10px; margin-right: 5px; background: var(--surface2); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 3px; cursor: pointer; font-size: 0.8rem;">Select All</button>
                    <button onclick="deselectAllIndices('mir')" style="padding: 3px 10px; background: var(--surface2); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 3px; cursor: pointer; font-size: 0.8rem;">Deselect All</button>
                </div>
            </div>
            <div class="shape-index-toggles" id="mirToggles" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(112px, 1fr)); max-width: 100%; gap: 10px; margin-top: 10px;">
                ${mirShapes}
            </div>
        </div>
    `;

    selectorModal.classList.add('active');
}

window.toggleShapeIndex = function(index) {
    const selectedKey = `training_selected_${currentTrainingCase}`;
    if (!window.trainingSelections) window.trainingSelections = {};
    if (!window.trainingSelections[selectedKey]) {
        const shapeIndexItem = shapeIndex.find(s => s.name === currentTrainingCase);
        window.trainingSelections[selectedKey] = [...(shapeIndexItem.org || []), ...(shapeIndexItem.mir || [])];
    }

    const currentSelection = window.trainingSelections[selectedKey];
    const indexPos = currentSelection.indexOf(index);

    if (indexPos > -1) {
        currentSelection.splice(indexPos, 1);
    } else {
        currentSelection.push(index);
    }

    // Update button appearance
    const button = document.querySelector(`button.shape-index-toggle[data-index="${index}"]`);
    if (button) {
        button.classList.toggle('active');
        button.style.background = button.classList.contains('active') ? 'var(--surface-border)' : 'var(--surface)';
    }

    // Update training scrambles and regenerate lookahead
    trainingScrambles = currentSelection;
    regenerateScrambleLookahead();

    // If no indices selected, show warning but don't prevent
    if (currentSelection.length === 0) {
        console.warn('No shape indices selected');
    }
}

window.selectAllIndices = function(type) {
    const shapeIndexItem = shapeIndex.find(s => s.name === currentTrainingCase);
    if (!shapeIndexItem) return;

    const selectedKey = `training_selected_${currentTrainingCase}`;
    if (!window.trainingSelections) window.trainingSelections = {};

    const indices = type === 'org' ? (shapeIndexItem.org || []) : (shapeIndexItem.mir || []);

    // Add all indices of this type to selection
    indices.forEach(idx => {
        if (!window.trainingSelections[selectedKey].includes(idx)) {
            window.trainingSelections[selectedKey].push(idx);
        }
    });

    // Update button appearances
    const buttons = document.querySelectorAll(`button.shape-index-toggle[data-type="${type}"]`);
    buttons.forEach(btn => {
        btn.classList.add('active');
        btn.style.background = 'var(--surface-border)';
    });

    trainingScrambles = window.trainingSelections[selectedKey];
    regenerateScrambleLookahead();
}

window.deselectAllIndices = function(type) {
    const shapeIndexItem = shapeIndex.find(s => s.name === currentTrainingCase);
    if (!shapeIndexItem) return;

    const selectedKey = `training_selected_${currentTrainingCase}`;
    if (!window.trainingSelections) window.trainingSelections = {};

    const indices = type === 'org' ? (shapeIndexItem.org || []) : (shapeIndexItem.mir || []);

    // Remove all indices of this type from selection
    window.trainingSelections[selectedKey] = window.trainingSelections[selectedKey].filter(idx => !indices.includes(idx));

    // Update button appearances
    const buttons = document.querySelectorAll(`button.shape-index-toggle[data-type="${type}"]`);
    buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'var(--surface)';
    });

    trainingScrambles = window.trainingSelections[selectedKey];
    regenerateScrambleLookahead();
}

function closeShapeIndexSelector() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('shapeIndexSelectorModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    });
}

// Keyboard events for timer
let spacePressed = false;
document.addEventListener('keydown', (e) => {
    if (document.getElementById('evilnessQuizModal')) return;
    const modal = document.getElementById('trainingModal');
    if (!modal || !modal.classList.contains('active')) return;

    // Parity quiz overlay keyboard support
    if (parityQuizPhase) {
        const leftKeys = new Set(['Tab', 'Backquote', 'Digit1', 'Digit2', 'Digit4', 'Digit5', 'Digit6', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyZ', 'KeyX', 'KeyC', 'KeyV']);
        const rightKeys = new Set(['Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'Enter', 'NumpadEnter']);
        if (leftKeys.has(e.code) || rightKeys.has(e.code)) {
            e.preventDefault();
            const goodBtn = document.getElementById('pqGoodBtn');
            const badBtn = document.getElementById('pqBadBtn');
            if (leftKeys.has(e.code) && goodBtn && !goodBtn.disabled) goodBtn.click();
            else if (rightKeys.has(e.code) && badBtn && !badBtn.disabled) badBtn.click();
            return;
        }
    }

    if (e.code === 'Escape') {
        e.preventDefault();
        const infoModal = document.getElementById('trainingInfoModal');
        const settingsModal = document.getElementById('trainingSettingsModal');
        const shapeModal = document.getElementById('shapeIndexSelectorModal');
        const selectorModal = document.getElementById('trainingSelectorModal');
        if (infoModal && infoModal.classList.contains('active')) { closeTrainingInfoModal(); return; }
        if (settingsModal && settingsModal.classList.contains('active')) { closeTrainingSettingsModal(); return; }
        if (shapeModal && shapeModal.classList.contains('active')) { closeShapeIndexSelector(); return; }
        if (selectorModal && selectorModal.style.display !== 'none') { closeSelectorModal(); return; }
        // Cancel inspection without wiping last solve display
        if (isInspectionPhase || parityQuizPhase) {
            clearInterval(inspectionInterval);
            inspectionRunning = false;
            isInspectionPhase = false;
            parityQuizPhase = false;
            isHolding = false;
            isHoldReady = false;
            inspectionElapsed = 0;
            const overlay = document.getElementById('parityQuizOverlay');
            if (overlay) overlay.remove();
            const insLabel = document.getElementById('trainingInspectionLabel');
            if (insLabel) insLabel.style.display = 'none';
            // Restore previous solve display
            const timerEl = document.getElementById('trainingTimer');
            timerEl.style.color = 'var(--text-primary)';
            if (timerElapsed > 0) {
                timerEl.textContent = (timerElapsed / 1000).toFixed(3);
            } else {
                timerEl.textContent = '0.000';
            }
            const subInfo = document.getElementById('trainingTimerSubInfo');
            if (subInfo) {
                if (trainingEnableInspection && lastInspectionElapsed > 0) {
                    subInfo.style.display = 'block';
                } else {
                    subInfo.style.display = 'none';
                }
            }
            return;
        }
        closeTrainingModal();
        return;
    }

    // Block space when parity quiz is active
    if (e.code === 'Space' && parityQuizPhase) {
        e.preventDefault();
        if (typeof showToast === 'function') showToast('Choose the correct parity option first', 2000, 'info');
        return;
    }

    // Any key stops the solve timer if running
    if (timerRunning) {
        e.preventDefault();
        if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') return;
        stopTimerOnly();
        displayNextScramble();
        spacePressed = false;
        return;
    }

    if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (!spacePressed) {
            spacePressed = true;
            // Start inspection immediately, no hold
            if (trainingEnableInspection && !isInspectionPhase && !parityQuizPhase) {
                if (trainingEnableParityQuiz) startParityQuizInspection();
                else startInspection();
                return;
            }
            // During inspection (non-quiz): begin hold to start solve
            if (isInspectionPhase && !parityQuizPhase) {
                isHolding = true;
                isHoldReady = false;
                holdStartTime = Date.now();
                document.getElementById('trainingTimer').style.color = 'var(--card-learning-border)';
                const holdCheckInterval = setInterval(() => {
                    if (!isHolding) { clearInterval(holdCheckInterval); return; }
                    const holdDuration = (Date.now() - holdStartTime) / 1000;
                    if (holdDuration >= trainingHoldToStart && !isHoldReady) {
                        isHoldReady = true;
                        document.getElementById('trainingTimer').style.color = 'var(--card-learned-border)';
                        clearInterval(holdCheckInterval);
                    }
                }, 10);
                return;
            }
            // Normal mode: hold to start solve
            document.getElementById('trainingTimer').style.color = 'var(--card-learning-border)';
            isHolding = true;
            isHoldReady = false;
            holdStartTime = Date.now();
            const holdCheckInterval = setInterval(() => {
                if (!isHolding) { clearInterval(holdCheckInterval); return; }
                const holdDuration = (Date.now() - holdStartTime) / 1000;
                if (holdDuration >= trainingHoldToStart && !isHoldReady) {
                    isHoldReady = true;
                    document.getElementById('trainingTimer').style.color = 'var(--card-learned-border)';
                    clearInterval(holdCheckInterval);
                }
            }, 10);
        }
    }
});
document.addEventListener('keydown', (e) => {
    if (document.getElementById('evilnessQuizModal')) return;
    const leftKeys = new Set(['Tab', 'Backquote', 'Digit1', 'Digit2', 'Digit4', 'Digit5', 'Digit6', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyZ', 'KeyX', 'KeyC', 'KeyV']);
    const rightKeys = new Set(['Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'Enter', 'NumpadEnter']);

    const evilModal = document.getElementById('evilnessQuizModal');
    if (evilModal) {
        const goodBtn = document.getElementById('evilQuizGood');
        const badBtn = document.getElementById('evilQuizEvil');
        if (goodBtn && !goodBtn.disabled && leftKeys.has(e.code)) { e.preventDefault(); goodBtn.click(); return; }
        if (badBtn && !badBtn.disabled && rightKeys.has(e.code)) { e.preventDefault(); badBtn.click(); return; }
    }

    const parityModal = document.getElementById('parityQuizModal');
    if (parityModal) {
        const goodBtn = document.getElementById('parityQuizGood');
        const badBtn = document.getElementById('parityQuizBad');
        if (goodBtn && !goodBtn.disabled && leftKeys.has(e.code)) { e.preventDefault(); goodBtn.click(); return; }
        if (badBtn && !badBtn.disabled && rightKeys.has(e.code)) { e.preventDefault(); badBtn.click(); return; }
    }
});

document.addEventListener('keyup', (e) => {
    if (document.getElementById('evilnessQuizModal')) return;
    const modal = document.getElementById('trainingModal');
    if (!modal || !modal.classList.contains('active')) return;

    if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (timerRunning) {
            stopTimerOnly();
            displayNextScramble();
        } else {
            nextScrambleManual();
        }
        return;
    }

    if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (timerRunning) {
            stopTimerOnly();
            displayNextScramble();
        } else {
            previousScramble();
        }
        return;
    }

    if (e.code === 'Space') {
        e.preventDefault();
        spacePressed = false;
        const timerEl = document.getElementById('trainingTimer');
        // During inspection (non-quiz): release after hold-ready → start solve
        if (isInspectionPhase && !parityQuizPhase && isHolding && isHoldReady) {
            isHolding = false;
            isHoldReady = false;
            timerEl.style.color = 'var(--text-primary)';
            stopInspectionAndStartTimer();
            return;
        }
        // During inspection (non-quiz): release but not ready → cancel hold, stay in inspection
        if (isInspectionPhase && !parityQuizPhase && isHolding) {
            isHolding = false;
            isHoldReady = false;
            timerEl.style.color = 'var(--text-primary)';
            return;
        }
        // Normal mode: release after hold-ready → start solve
        if (!isInspectionPhase && isHolding && isHoldReady) {
            isHolding = false;
            isHoldReady = false;
            timerEl.style.color = 'var(--text-primary)';
            startTimer();
            return;
        }
        if (isHolding) {
            isHolding = false;
            isHoldReady = false;
            timerEl.style.color = 'var(--text-primary)';
        }
    }
});

function openTrainingSettingsModal() {
    window.openUnifiedSettings('trainer');
}

function closeTrainingSettingsModal() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('trainingSettingsModal');
        if (modal) modal.classList.remove('active');
    });
}

function openTrainingInfoModal() {
    pushModalState('trainingInfoModal', closeTrainingInfoModal);

    let infoModal = document.getElementById('trainingInfoModal');
    if (!infoModal) {
        infoModal = document.createElement('div');
        infoModal.id = 'trainingInfoModal';
        infoModal.className = 'training-info-modal';
        infoModal.innerHTML = `
            <div class="training-info-content">
                <div class="training-info-header">
                    <span class="training-info-title">Training Guides</span>
                    <button class="training-info-close" onclick="closeTrainingInfoModal()">&times;</button>
                </div>
                <div class="training-info-body">
                    <div class="training-info-item">
                        <div class="training-info-number">1</div>
                        <div class="training-info-text">Press on the top left corner to <b>select cases to train</b>, or to select a particular <b>angle</b> for one case <i>(for case-wise training)</i>.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">2</div>
                        <div class="training-info-text">Use <b>< button</b> or keyboard <b>left arrow</b> for previous scramble, use the 🔄 <b>button</b> or keyboard <b>right key</b> to regenerate scramble.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">3</div>
                        <div class="training-info-text">Check settings for a bunch of customizability.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">4</div>
                        <div class="training-info-text">The <b>out-of-cubeshape</b> part of the scramble is colored. <span style="color: #2196F3; font-weight: 600;">Blue</span> means the scramble goes out of CS from (0,0) alignment, <span style="color: #f44336; font-weight: 600;">red</span> means it goes out at (1,-1) alignment.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">5</div>
                        <div class="training-info-text">To use the Parity Tracer for the <b>current scramble</b>, directly <b>click</b> on the scramble.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">6</div>
                        <div class="training-info-text">Enable <b>inspection</b> and then enable <b>Parity quiz during inspection</b> to activate the <b>parity quiz</b> feature in inspection.</div>
                    </div>
                    <h3>Parity Quiz guide:</h3></br>
                    <div class="training-info-item">
                        <div class="training-info-number">1</div>
                        <div class="training-info-text">If your evilness is turned <b>off</b>, the app will ask you if the scramble is <b>even</b> or <b>odd</b> parity.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">2</div>
                        <div class="training-info-text">If your evilness is turned <b>on</b>, the app will ask you if the scramble requires <b>good alg</b> or <b>bad alg</b> (I believe you already know what those are).</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">3</div>
                        <div class="training-info-text">Click on the left side of the screen, or <b>any left side key</b> (ie. QWERASDFZXCV1234 etc) on your keyboard to answer <b>Even/ Good Alg</b>. Do the opposite to answer <b>Odd/ Bad alg</b></div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">4</div>
                        <div class="training-info-text">Time your time to trace parity, and the time to plan the algorithm for better grasp over a case.</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(infoModal);
    }

    infoModal.classList.add('active');
}

function closeTrainingInfoModal() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('trainingInfoModal');
        if (modal) modal.classList.remove('active');
    });
}

// ============================================================
// QUIZ SHARED UTILITIES
// ============================================================

function quizGetParityFromHex(hexCode) {
    // Returns 'Odd' or 'Even' or null
    try {
        const state = parseHexFormat(hexCode);
        const notation = window.sq1Tools.scrambleFromState(state);
        if (!notation || typeof window.caleTracer === 'undefined') return null;
        return window.caleTracer.getParityTextFromScramble(
            notation,
            typeof colorScheme !== 'undefined' ? colorScheme : {},
            typeof cornerStickerMode !== 'undefined' ? cornerStickerMode : 'counterclockwise'
        );
    } catch (e) {
        return null;
    }
}

// ============================================================
// 1. EVILNESS QUIZ
// ============================================================

window.openEvilnessQuiz = function () {
    const key = 'sq1-selector-evilness';
    window._selectorStorageKey = key;
    let saved = JSON.parse(localStorage.getItem(key));
    const chosen = (saved && saved.length > 0) ? saved.filter(n => data.some(d => d.name === n)) : data.map(d => d.name);
    startEvilnessQuiz(chosen);
};

function startEvilnessQuiz(chosenCaseNames) {
    const allIndices = [];
    function rebuildIndices(names) {
        allIndices.length = 0;
        names.forEach(cn => {
            const entry = shapeIndex.find(e => e.name === cn);
            if (entry) {
                (entry.org || []).forEach(idx => allIndices.push({ idx, caseName: cn }));
                (entry.mir || []).forEach(idx => allIndices.push({ idx, caseName: cn }));
            }
        });
    }
    rebuildIndices(chosenCaseNames);
    if (allIndices.length === 0) return;

    let quizLog = [];
    let quizStartTime = 0;
    let currentItem = null;
    let timerInt = null;
    let questionCount = 0;
    let quizRunning = false;
    let sidebarOpen = false;

    const modal = document.createElement('div');
    modal.id = 'evilnessQuizModal';
    modal.className = 'training-modal active';
    modal.innerHTML = `
        <div class="training-modal-header">
            <div style="display:flex;gap:10px;align-items:center;">
                <button class="training-modal-title" id="evilQuizCaseCount" style="background:none;border:none;cursor:pointer;padding:0;font:inherit;text-align:left;color:var(--link-color);text-decoration:underline;" title="Select cases">${chosenCaseNames.length} cases selected</button>
            </div>
            <div style="display:flex;gap:10px;align-items:center;">
                <button class="training-modal-refresh" id="evilQuizPrevBtn" title="Previous" style="display:none;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <button class="training-modal-refresh" id="evilQuizNextBtn" title="Next">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"></polyline></svg>
                </button>
                <button class="training-modal-refresh" id="evilQuizSettingsBtn" title="Settings">
                    <img src="res/training-settings.svg" height="20px" width="20px">
                </button>
                <button class="training-modal-close" id="evilQuizClose">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        </div>
        <div class="training-modal-timer-zone" id="evilQuizTimerZone" style="position:relative;flex-direction:column;gap:1rem;justify-content:center;align-items:center;cursor:default;">
            <div class="training-modal-image-container">
                <div class="training-modal-image" id="evilQuizImage"></div>
            </div>
            <div class="training-modal-timer" id="evilQuizTimer">0.000</div>
            <div id="evilQuizStartOverlay" style="position:absolute;top:0;left:0;width:100%;height:100%;background:var(--surface);display:flex;align-items:flex-start;justify-content:center;z-index:50;border-radius:inherit;padding-top:2rem;box-sizing:border-box;">
                <div style="display:flex;flex-direction:column;align-items:center;gap:1.2rem;max-width:320px;text-align:center;padding:1.5rem;">
                    <div style="font-size:1.1rem;font-weight:700;color:var(--text-ui);">Evilness Quiz</div>
                    <div style="font-size:0.88rem;color:var(--text-secondary);line-height:1.6;">
                        You'll be shown an image of a scramble. Decide if the case requires a <span style="color:#2d6a2d;font-weight:700;">Good</span> alg or an <span style="color:#8b0000;font-weight:700;">Evil</span> alg.<br><br>
                        Press the <strong>left half</strong> of the screen (or left-side keys) for Good, and the <strong>right half</strong> (or right-side keys) for Evil.
                    </div>
                    <button id="evilQuizStartBtn" style="padding:0.9rem 2.2rem;background:var(--accent);color:#fff;border:none;border-radius:12px;font-size:1.1rem;font-weight:700;cursor:pointer;">Start</button>
                </div>
            </div>
        </div>
        <div id="evilQuizSidebar" style="display:none;position:fixed;top:0;right:0;width:260px;height:100%;background:var(--surface);border-left:1px solid var(--border-color);z-index:10001;overflow-y:auto;flex-direction:column;">
            <div style="padding:14px 16px;font-weight:700;color:var(--text-ui);border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;">
                <span>Case Log</span>
                <button id="evilQuizSidebarClose" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--text-muted);line-height:1;">&times;</button>
            </div>
            <div id="evilQuizLogList" style="padding:10px 12px;font-size:0.82rem;color:var(--text-primary);display:flex;flex-direction:column;gap:6px;"></div>
        </div>
    `;

    const closeQuiz = () => {
        closeModalWithHistory(() => {
            clearInterval(timerInt);
            const sm = document.getElementById('evilQuizSettingsModal');
            if (sm) sm.remove();

            const obs = new MutationObserver((mutations) => {
            });
            obs.observe(document.body, { childList: true, subtree: false });
            modal.remove();
            setTimeout(() => obs.disconnect(), 500);
            document.body.classList.remove('modal-open');
        });
    };

    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    pushModalState('evilnessQuizModal', closeQuiz);

    // Settings modal
    function openEvilQuizSettings() {
    window.openUnifiedSettings('trainer');
    // Patch: after the settings modal opens, hook the image size slider to update the quiz image
    setTimeout(() => {
        const slider = document.getElementById('tr_imgSize');
        if (!slider) return;
        const orig = slider.oninput;
        slider.addEventListener('input', () => {
            if (currentHexCode) {
                const state = parseHexFormat(currentHexCode);
                const notation = window.sq1Tools.scrambleFromState(state);
                const imgEl = document.getElementById('evilQuizImage');
                if (imgEl) imgEl.innerHTML = visualizeFromScrambleNotation(notation, parseInt(slider.value), typeof colorScheme !== 'undefined' ? colorScheme : {});
            }
        });
    }, 100);
}

    function renderSidebar() {
        const list = document.getElementById('evilQuizLogList');
        if (!list) return;
        if (quizLog.length === 0) { list.innerHTML = '<span style="color:var(--text-muted);font-style:italic;">No answers yet.</span>'; return; }
        list.innerHTML = [...quizLog].reverse().map((entry, i) => {
            const icon = entry.correct ? '✓' : '✗';
            const color = entry.correct ? '#2d6a2d' : '#cc0000';
            const timeStr = (entry.timeMs / 1000).toFixed(3) + 's';
            const evilStr = entry.wasEvil ? 'Evil' : 'Good';
            return `<div style="padding:6px 8px;border-radius:6px;background:${entry.correct ? 'var(--card-learned-bg)' : 'var(--toast-error-bg)'};border:1px solid ${entry.correct ? 'var(--card-learned-border)' : 'var(--bad-case)'};">
                <span style="color:${color};font-weight:700;">${icon}</span>
                <span style="font-weight:600;margin-left:4px;">${entry.caseName}</span>
                <span style="color:var(--text-muted);margin-left:4px;">(${evilStr})</span>
                <span style="float:right;color:var(--text-muted)">${timeStr}</span>
            </div>`;
        }).join('');
    }

    function toggleSidebar() {
        sidebarOpen = !sidebarOpen;
        const sb = document.getElementById('evilQuizSidebar');
        if (sb) { sb.style.display = sidebarOpen ? 'flex' : 'none'; renderSidebar(); }
    }

    let currentHexCode = null;

    function nextQuestion() {
        clearInterval(timerInt);
        currentItem = allIndices[Math.floor(Math.random() * allIndices.length)];
        questionCount++;

        currentHexCode = shapeIndexToHex(currentItem.idx);
        window._evilCurrentHexCode = currentHexCode;
        let imgHTML = '';
        try {
            const state = parseHexFormat(currentHexCode);
            const notation = window.sq1Tools.scrambleFromState(state);
            imgHTML = visualizeFromScrambleNotation(notation, trainingScrambleImageSize || 200, typeof colorScheme !== 'undefined' ? colorScheme : {});
        } catch (e) { imgHTML = '<div style="color:var(--text-muted);padding:1rem;">Image unavailable</div>'; }

        document.getElementById('evilQuizImage').innerHTML = imgHTML;
        document.getElementById('evilQuizTimer').textContent = '0.000';

        // Remove existing answer overlay if any
        const existing = document.getElementById('evilQuizAnswerOverlay');
        if (existing) existing.remove();

        // Create split answer overlay
        const timerZone = document.getElementById('evilQuizTimerZone');
        const overlay = document.createElement('div');
        overlay.id = 'evilQuizAnswerOverlay';
        overlay.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:row;z-index:100;border-radius:inherit;overflow:hidden;`;
        overlay.innerHTML = `
            <button id="evilQuizGood" style="flex:1;border:none;cursor:pointer;background:rgba(45,106,45,0.10);display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:800;color:rgba(45,106,45,0.85);letter-spacing:0.06em;transition:background 0.15s;">GOOD</button>
            <div style="width:1px;background:rgba(0,0,0,0.07);flex-shrink:0;"></div>
            <button id="evilQuizEvil" style="flex:1;border:none;cursor:pointer;background:rgba(139,0,0,0.10);display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:800;color:rgba(139,0,0,0.85);letter-spacing:0.06em;transition:background 0.15s;">EVIL</button>
        `;
        timerZone.appendChild(overlay);

        // Responsive layout
        const mq = window.matchMedia('(max-width:500px)');
        function applyLayout(narrow) {
            overlay.style.flexDirection = narrow ? 'column' : 'row';
            const div = overlay.querySelector('div');
            if (div) { div.style.width = narrow ? '100%' : '1px'; div.style.height = narrow ? '1px' : '100%'; }
        }
        applyLayout(mq.matches);
        mq.addEventListener('change', e => applyLayout(e.matches));

        quizStartTime = Date.now();
        timerInt = setInterval(() => {
            document.getElementById('evilQuizTimer').textContent = ((Date.now() - quizStartTime) / 1000).toFixed(3);
        }, 10);

        document.getElementById('evilQuizGood').addEventListener('click', () => handleAnswer(false));
        document.getElementById('evilQuizEvil').addEventListener('click', () => handleAnswer(true));
    }

    function handleAnswer(userSaidEvil) {
        clearInterval(timerInt);
        const elapsed = Date.now() - quizStartTime;
        const isEvil = (typeof isCaseEvil === 'function') ? isCaseEvil(currentItem.caseName) : false;
        const correct = userSaidEvil === isEvil;
        quizLog.push({ caseName: currentItem.caseName, wasEvil: isEvil, correct, timeMs: elapsed });
        if (sidebarOpen) renderSidebar();

        if (correct) {
            nextQuestion();
        } else {
            const wrongBtn = userSaidEvil ? document.getElementById('evilQuizEvil') : document.getElementById('evilQuizGood');
            if (wrongBtn) {
                wrongBtn.style.background = 'rgba(200,0,0,0.22)';
                wrongBtn.style.color = 'rgba(180,0,0,0.9)';
                wrongBtn.disabled = true;
                const otherBtn = userSaidEvil ? document.getElementById('evilQuizGood') : document.getElementById('evilQuizEvil');
                if (otherBtn) otherBtn.disabled = true;
            }
            setTimeout(nextQuestion, 600);
        }
    }

    document.getElementById('evilQuizClose').addEventListener('click', closeQuiz);
    document.getElementById('evilQuizNextBtn').addEventListener('click', () => { if (quizRunning) nextQuestion(); });
    document.getElementById('evilQuizCaseCount').addEventListener('click', () => {
        openSelectorModal('sq1-selector-evilness', (chosen) => {
            rebuildIndices(chosen);
            document.getElementById('evilQuizCaseCount').textContent = `${chosen.length} cases selected`;
        });
    });
    document.getElementById('evilQuizSettingsBtn').addEventListener('click', openEvilQuizSettings);
    document.getElementById('evilQuizSidebarClose').addEventListener('click', () => { sidebarOpen = false; document.getElementById('evilQuizSidebar').style.display = 'none'; });
    modal.addEventListener('click', (e) => {
        if (sidebarOpen && !document.getElementById('evilQuizSidebar').contains(e.target)) {
            sidebarOpen = false;
            document.getElementById('evilQuizSidebar').style.display = 'none';
        }
    });

    // Hamburger button — inject into header
    const header = modal.querySelector('.training-modal-header > div:first-child');
    const hamburgerBtn = document.createElement('button');
    hamburgerBtn.className = 'training-modal-refresh';
    hamburgerBtn.title = 'Case log';
    hamburgerBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
    hamburgerBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(); });
    // Insert hamburger before the close button group
    const rightDiv = modal.querySelector('.training-modal-header > div:last-child');
    rightDiv.insertBefore(hamburgerBtn, rightDiv.firstChild);

    // Keyboard support
    function handleEvilKeyDown(e) {
        if (!document.getElementById('evilnessQuizModal')) { document.removeEventListener('keydown', handleEvilKeyDown); return; }

        const leftKeys = new Set(['Tab', 'Backquote', 'Digit1', 'Digit2', 'Digit4', 'Digit5', 'Digit6', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyZ', 'KeyX', 'KeyC', 'KeyV']);
        const rightKeys = new Set(['Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'Enter', 'NumpadEnter']);

        if (e.code === 'Escape') {
            e.preventDefault(); e.stopImmediatePropagation();
            if (quizRunning) {
                quizRunning = false;
                clearInterval(timerInt);
                const existing = document.getElementById('evilQuizAnswerOverlay');
                if (existing) existing.remove();
                const timerZone = document.getElementById('evilQuizTimerZone');
                const startOverlay = document.createElement('div');
                startOverlay.id = 'evilQuizStartOverlay';
                startOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:var(--surface);display:flex;align-items:flex-start;justify-content:center;z-index:50;border-radius:inherit;padding-top:2rem;box-sizing:border-box;';
                startOverlay.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:1.2rem;max-width:320px;text-align:center;padding:1.5rem;">
        <div style="font-size:1.1rem;font-weight:700;color:var(--text-ui);">Evilness Quiz</div>
        <div style="font-size:0.88rem;color:var(--text-secondary);line-height:1.6;">
            You'll be shown a scrambled cube image. Decide if the case requires a <span style="color:#2d6a2d;font-weight:700;">Good</span> alg or a <span style="color:#8b0000;font-weight:700;">Bad</span> alg.<br><br>
            Use the <strong>left half</strong> of the screen (or left-side keys) for Good, and the <strong>right half</strong> (or right-side keys) for Evil.
        </div>
        <button id="evilQuizStartBtn" style="padding:0.9rem 2.2rem;background:var(--accent);color:#fff;border:none;border-radius:12px;font-size:1.1rem;font-weight:700;cursor:pointer;">Start</button>
    </div>`;
                timerZone.appendChild(startOverlay);
                document.getElementById('evilQuizStartBtn').addEventListener('click', () => {
                    startOverlay.remove();
                    quizRunning = true;
                    nextQuestion();
                });
                return;
            }
            closeQuiz();
            document.removeEventListener('keydown', handleEvilKeyDown);
            return;
        }

        if (!quizRunning) return;
        const goodBtn = document.getElementById('evilQuizGood');
        const evilBtn = document.getElementById('evilQuizEvil');
        if (leftKeys.has(e.code) && goodBtn && !goodBtn.disabled) { e.preventDefault(); goodBtn.click(); }
        else if (rightKeys.has(e.code) && evilBtn && !evilBtn.disabled) { e.preventDefault(); evilBtn.click(); }
    }

    document.addEventListener('keydown', handleEvilKeyDown);

    // Start button
    document.getElementById('evilQuizStartBtn').addEventListener('click', () => {
        document.getElementById('evilQuizStartOverlay').remove();
        quizRunning = true;
        nextQuestion();
    });
}

// ============================================================
// 2. PARITY QUIZ
// ============================================================

window.openParityQuiz = function () {
    const key = 'sq1-selector-parity';
    window._selectorStorageKey = key;
    let saved = JSON.parse(localStorage.getItem(key));
    const chosen = (saved && saved.length > 0) ? saved.filter(n => data.some(d => d.name === n)) : data.map(d => d.name);
    startParityQuiz(chosen);
};

function startParityQuiz(chosenCaseNames) {
    const allIndices = [];
    chosenCaseNames.forEach(cn => {
        const entry = shapeIndex.find(e => e.name === cn);
        if (entry) {
            (entry.org || []).forEach(idx => allIndices.push({ idx, caseName: cn }));
            (entry.mir || []).forEach(idx => allIndices.push({ idx, caseName: cn }));
        }
    });
    if (allIndices.length === 0) return;

    let quizLog = [];
    let quizStartTime = 0;
    let currentItem = null;
    let currentParity = null;
    let timerInt = null;
    let questionCount = 0;

    const modal = document.createElement('div');
    modal.id = 'parityQuizModal';
    modal.className = 'training-modal active';
    modal.innerHTML = `
        <div class="training-modal-header">
            <div style="display:flex;gap:10px;align-items:center;">
                <span class="training-modal-title">Parity Quiz</span>
            </div>
            <div style="display:flex;gap:10px;align-items:center;">
                <div id="parityQuizProgress" style="font-size:0.85rem;color:var(--text-muted)">Q1 | 0/0</div>
                <button class="training-modal-refresh" id="parityQuizSelectCases" title="Select cases" style="width:auto;padding:0 12px;font-size:0.8rem;font-weight:600;">Cases</button>
                <button class="training-modal-close" id="parityQuizClose">
                <button class="training-modal-close" id="parityQuizClose">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        </div>
        <div class="training-modal-scramble" id="parityQuizScramble" style="cursor:default;"></div>
        <div class="training-modal-timer-zone" style="flex-direction:column;gap:1rem;justify-content:center;align-items:center;cursor:default;">
            <div class="training-modal-image-container">
                <div class="training-modal-image" id="parityQuizImage"></div>
            </div>
            <div style="font-size:1.1rem;font-weight:600;color:var(--text-ui);">Which alg do you need?</div>
            <div style="display:flex;gap:1rem;justify-content:center;width:100%;max-width:320px;">
                <button id="parityQuizGood" style="flex:1;padding:0.9rem;background:#2d6a2d;color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer;transition:opacity 0.2s;">Good Alg</button>
                <button id="parityQuizBad" style="flex:1;padding:0.9rem;background:#8b0000;color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer;transition:opacity 0.2s;">Bad Alg</button>
            </div>
            <div id="parityQuizFeedback" style="min-height:26px;font-size:0.95rem;font-weight:600;color:var(--text-ui);"></div>
            <div class="training-modal-timer" id="parityQuizTimer">0.000</div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    pushModalState('parityQuizModal', closeQuiz);

    function nextQuestion() {
        currentItem = allIndices[Math.floor(Math.random() * allIndices.length)];
        questionCount++;

        const hexCode = shapeIndexToHex(currentItem.idx);
        let scrambleText = '';
        let imgHTML = '';

        try {
            const state = parseHexFormat(hexCode);
            const notation = window.sq1Tools.scrambleFromState(state);
            scrambleText = notation || hexCode;
            imgHTML = visualizeFromScrambleNotation(notation, trainingScrambleImageSize || 200, typeof colorScheme !== 'undefined' ? colorScheme : {});
            currentParity = quizGetParityFromHex(hexCode);
        } catch (e) {
            currentParity = null;
            imgHTML = '<div style="color:var(--text-muted);padding:1rem;">Image unavailable</div>';
        }

        document.getElementById('parityQuizScramble').textContent = scrambleText;
        document.getElementById('parityQuizImage').innerHTML = imgHTML;
        const score = quizLog.filter(l => l.correct).length;
        document.getElementById('parityQuizProgress').textContent = `Q${questionCount} | ${score}/${quizLog.length}`;
        document.getElementById('parityQuizFeedback').textContent = '';
        document.getElementById('parityQuizTimer').textContent = '0.000';
        document.getElementById('parityQuizGood').disabled = false;
        document.getElementById('parityQuizBad').disabled = false;

        quizStartTime = Date.now();
        clearInterval(timerInt);
        timerInt = setInterval(() => {
            document.getElementById('parityQuizTimer').textContent = ((Date.now() - quizStartTime) / 1000).toFixed(3);
        }, 10);
    }

    function handleAnswer(userSaidGood) {
        clearInterval(timerInt);
        const elapsed = Date.now() - quizStartTime;
        document.getElementById('parityQuizGood').disabled = true;
        document.getElementById('parityQuizBad').disabled = true;

        const correctIsGood = currentParity === 'Even';
        const correct = userSaidGood === correctIsGood;
        quizLog.push({ caseName: currentItem.caseName, parity: currentParity, correct, timeMs: elapsed });

        const fb = document.getElementById('parityQuizFeedback');
        fb.textContent = correct ? 'Correct!' : `Wrong — parity is ${currentParity}, need the ${correctIsGood ? 'Good' : 'Bad'} alg.`;
        fb.style.color = correct ? '#2d6a2d' : '#8b0000';

        setTimeout(nextQuestion, 1400);
    }

    const closeQuiz = () => {
        closeModalWithHistory(() => {
            clearInterval(timerInt);
            modal.remove();
            document.body.classList.remove('modal-open');
        });
    };

    document.getElementById('parityQuizGood').addEventListener('click', () => handleAnswer(true));
    document.getElementById('parityQuizBad').addEventListener('click', () => handleAnswer(false));
    document.getElementById('parityQuizClose').addEventListener('click', closeQuiz);
    document.getElementById('parityQuizSelectCases').addEventListener('click', () => {
        openSelectorModal('sq1-selector-parity', (chosen) => {
            allIndices.length = 0;
            chosen.forEach(cn => {
                const entry = shapeIndex.find(e => e.name === cn);
                if (entry) {
                    (entry.org || []).forEach(idx => allIndices.push({ idx, caseName: cn }));
                    (entry.mir || []).forEach(idx => allIndices.push({ idx, caseName: cn }));
                }
            });
        });
    });
    document.getElementById('parityQuizSelectCases').addEventListener('click', () => {
        openUniversalCaseSelector(TRAINER_STORAGE_KEYS.parity, (chosen) => {
            allIndices.length = 0;
            chosen.forEach(cn => {
                const entry = shapeIndex.find(e => e.name === cn);
                if (entry) {
                    (entry.org || []).forEach(idx => allIndices.push({ idx, caseName: cn }));
                    (entry.mir || []).forEach(idx => allIndices.push({ idx, caseName: cn }));
                }
            });
        });
    });

    nextQuestion();
}

// ============================================================
// 3. THREE-COLOR RECOGNITION PRACTICE
// ============================================================

window.openColorRecognitionPractice = function () {
    startColorRecognitionPractice();
};

function startColorRecognitionPractice() {
    const faceColors = {
        F: typeof colorScheme !== 'undefined' ? colorScheme.frontColor : '#CC0000',
        R: typeof colorScheme !== 'undefined' ? colorScheme.rightColor : '#00AA00',
        B: typeof colorScheme !== 'undefined' ? colorScheme.backColor : '#FF8C00',
        L: typeof colorScheme !== 'undefined' ? colorScheme.leftColor : '#0066CC'
    };
    const faceCodenames = { F: 'R', R: 'G', B: 'O', L: 'B' };
    const opposites = { R: 'O', O: 'R', G: 'B', B: 'G' };

    function calcTrioParity(codes) {
        const trio = codes.slice(0, 3);
        let aloneIdx = -1;
        for (let i = 0; i < 3; i++) {
            const opp = opposites[trio[i]];
            if (!trio.some((c, j) => j !== i && c === opp)) { aloneIdx = i; break; }
        }
        if (aloneIdx === -1) return null;
        let pair;
        if (aloneIdx === 0) pair = trio[0] + trio[1];
        else if (aloneIdx === 2) pair = trio[0] + trio[2];
        else pair = trio[1] + trio[2];
        if (['RG', 'GR', 'OB', 'BO'].includes(pair)) return 1;
        if (['RB', 'BR', 'OG', 'GO'].includes(pair)) return 0;
        return null;
    }

    // Color block emoji map based on actual color scheme
    function getFaceEmoji(face) {
        const col = faceColors[face];
        const r = parseInt(col.substr(1, 2), 16);
        const g = parseInt(col.substr(3, 2), 16);
        const b = parseInt(col.substr(5, 2), 16);
        // Pick closest emoji by dominant channel
        if (r > 150 && g < 100 && b < 100) return '🟥';
        if (r > 150 && g > 100 && b < 80) return '🟧';
        if (r > 150 && g > 150 && b < 80) return '🟨';
        if (r < 100 && g > 130 && b < 100) return '🟩';
        if (r < 100 && g < 100 && b > 130) return '🟦';
        return '⬜';
    }

    function trioEmoji(trio) {
        return trio.map(f => getFaceEmoji(f)).join('');
    }

    const faceKeys = ['F', 'R', 'B', 'L'];

    function permute(arr) {
        if (arr.length <= 1) return [arr];
        const res = [];
        for (let i = 0; i < arr.length; i++) {
            permute([...arr.slice(0, i), ...arr.slice(i + 1)]).forEach(p => res.push([arr[i], ...p]));
        }
        return res;
    }
    const faceComboTrios = [];
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) for (let k = j + 1; k < 4; k++)
        faceComboTrios.push([faceKeys[i], faceKeys[j], faceKeys[k]]);
    const allOrdered = [];
    faceComboTrios.forEach(trio => permute(trio).forEach(p => allOrdered.push(p)));

    function sharesTwo(a, b) {
        // Same set of faces (any order) = always blocked
        if (new Set([...a]).size === new Set([...a, ...b]).size && a.length === b.length) {
            const sa = new Set(a), sb = new Set(b);
            if ([...sa].every(x => sb.has(x))) return true;
        }
        // Same face in same position
        let samePos = 0;
        for (let i = 0; i < Math.min(a.length, b.length); i++) {
            if (a[i] === b[i]) samePos++;
        }
        return samePos >= 2;
    }
    function shufflePacket(prev) {
        const arr = [...allOrdered];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        const firstForbidden = prev ? prev[prev.length - 1] : null;
        if (firstForbidden && sharesTwo(firstForbidden, arr[0])) {
            for (let i = 1; i < arr.length; i++) {
                if (!sharesTwo(firstForbidden, arr[i])) { [arr[0], arr[i]] = [arr[i], arr[0]]; break; }
            }
        }
        for (let i = 1; i < arr.length; i++) {
            if (sharesTwo(arr[i - 1], arr[i])) {
                let swapped = false;
                for (let j = i + 1; j < arr.length; j++) {
                    if (!sharesTwo(arr[i - 1], arr[j]) && (i + 1 >= arr.length || !sharesTwo(arr[j], arr[i + 1]))) {
                        [arr[i], arr[j]] = [arr[j], arr[i]]; swapped = true; break;
                    }
                }
                if (!swapped) for (let j = i + 1; j < arr.length; j++) {
                    if (!sharesTwo(arr[i - 1], arr[j])) { [arr[i], arr[j]] = [arr[j], arr[i]]; break; }
                }
            }
        }
        return arr;
    }

    let packetHistory = [], queue = [];
    function refillQueue() {
        const prev = packetHistory.length > 0 ? packetHistory[packetHistory.length - 1] : null;
        const packet = shufflePacket(prev);
        packetHistory.push(packet);
        queue.push(...packet);
    }
    refillQueue();

    let questionCount = 0, quizLog = [], currentTrio = null, currentParityVal = null, quizStartTime = 0, timerInt = null;
    let quizRunning = false, sidebarOpen = false;

    const modal = document.createElement('div');
    modal.id = 'colorRecogModal';
    modal.className = 'training-modal active';
    modal.innerHTML = `
        <div class="training-modal-header">
            <div style="display:flex;gap:10px;align-items:center;">
                <span class="training-modal-title">Parity Quiz</span>
            </div>
            <div style="display:flex;gap:10px;align-items:center;">
                <div id="colorRecogProgress" style="font-size:0.85rem;color:var(--text-muted)">Q1 | 0/0</div>
                <button class="training-modal-refresh" id="colorRecogHamburger" title="Answer log">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                </button>
                <button class="training-modal-close" id="colorRecogClose">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        </div>
        <div class="training-modal-timer-zone" id="colorRecogTimerZone" style="position:relative;flex-direction:column;gap:1rem;justify-content:center;align-items:center;cursor:default;">
            <div id="colorRecogTrio" style="display:flex;justify-content:center;gap:1rem;"></div>
            <div class="training-modal-timer" id="colorRecogTimer">0.000</div>
            <div id="colorRecogStartOverlay" style="position:absolute;top:0;left:0;width:100%;height:100%;background:var(--surface);display:flex;align-items:flex-start;justify-content:center;z-index:50;border-radius:inherit;padding-top:2rem;box-sizing:border-box;">
                <div style="display:flex;flex-direction:column;align-items:center;gap:1.2rem;max-width:320px;text-align:center;padding:1.5rem;">
                    <div style="font-size:1.1rem;font-weight:700;color:var(--text-ui);">Parity Quiz</div>
                    <div style="font-size:0.88rem;color:var(--text-secondary);line-height:1.6;">
                        You'll see three colors. Based on their colors, determine whether the parity is <span style="color:#2d6a2d;font-weight:700;">Even</span> or <span style="color:#8b0000;font-weight:700;">Odd</span>.<br><br>
                        Press the <strong>left half</strong> of the screen (or left-side keys) for Even, and the <strong>right half</strong> (or right-side keys) for Odd.
                    </div>
                    <button id="colorRecogStartBtn" style="padding:0.9rem 2.2rem;background:var(--accent);color:#fff;border:none;border-radius:12px;font-size:1.1rem;font-weight:700;cursor:pointer;">Start</button>
                </div>
            </div>
        </div>
        <div id="colorRecogSidebar" style="display:none;position:fixed;top:0;right:0;width:260px;height:100%;background:var(--surface);border-left:1px solid var(--border-color);z-index:10001;overflow-y:auto;flex-direction:column;">
            <div style="padding:14px 16px;font-weight:700;color:var(--text-ui);border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;">
                <span>Answer Log</span>
                <button id="colorRecogSidebarClose" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--text-muted);line-height:1;">&times;</button>
            </div>
            <div id="colorRecogLogList" style="padding:10px 12px;font-size:0.82rem;color:var(--text-primary);display:flex;flex-direction:column;gap:6px;"></div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    pushModalState('colorRecogModal', closeQuiz);

    function renderTrio(trio) {
        return trio.map(face => {
            const col = faceColors[face];
            const r2 = parseInt(col.substr(1, 2), 16), g2 = parseInt(col.substr(3, 2), 16), b2 = parseInt(col.substr(5, 2), 16);
            const txtCol = ((0.299 * r2 + 0.587 * g2 + 0.114 * b2) / 255) > 0.5 ? '#000' : '#fff';
            return `<div style="width:90px;height:90px;border-radius:14px;background:${col};box-shadow:0 2px 10px rgba(0,0,0,0.2);border-radius:14px;"></div>`;
        }).join('');
    }

    function renderSidebar() {
        const list = document.getElementById('colorRecogLogList');
        if (!list) return;
        if (quizLog.length === 0) { list.innerHTML = '<span style="color:var(--text-muted);font-style:italic;">No answers yet.</span>'; return; }
        list.innerHTML = [...quizLog].reverse().map(entry => {
            const icon = entry.correct ? '✓' : '✗';
            const color = entry.correct ? '#2d6a2d' : '#cc0000';
            const timeStr = (entry.timeMs / 1000).toFixed(3) + 's';
            const answerStr = entry.correctIsEven ? 'Even' : 'Odd';
            return `<div style="padding:6px 8px;border-radius:6px;background:${entry.correct ? 'var(--card-learned-bg)' : 'var(--toast-error-bg)'};border:1px solid ${entry.correct ? 'var(--card-learned-border)' : 'var(--bad-case)'};">
                <span style="color:${color};font-weight:700;">${icon}</span>
                <span style="font-size:1.1em;margin-left:4px;">${entry.emoji}</span>
                <span style="color:#888;font-size:0.78rem;margin-left:4px;">${answerStr}</span>
                <span style="float:right;color:var(--text-muted)">${timeStr}</span>
            </div>`;
        }).join('');
    }

    function toggleSidebar() {
        sidebarOpen = !sidebarOpen;
        const sb = document.getElementById('colorRecogSidebar');
        if (sb) { sb.style.display = sidebarOpen ? 'flex' : 'none'; renderSidebar(); }
    }

    function removeAnswerOverlay() {
        const ex = document.getElementById('colorRecogAnswerOverlay');
        if (ex) ex.remove();
    }

    function nextQuestion() {
        clearInterval(timerInt);
        removeAnswerOverlay();

        if (queue.length === 0) refillQueue();
        currentTrio = queue.shift();
        currentParityVal = calcTrioParity(currentTrio.map(f => faceCodenames[f]));
        questionCount++;

        const score = quizLog.filter(l => l.correct).length;
        document.getElementById('colorRecogTrio').innerHTML = renderTrio(currentTrio);
        document.getElementById('colorRecogProgress').textContent = `Q${questionCount} | ${score}/${quizLog.length}`;
        document.getElementById('colorRecogTimer').textContent = '0.000';

        const timerZone = document.getElementById('colorRecogTimerZone');
        const overlay = document.createElement('div');
        overlay.id = 'colorRecogAnswerOverlay';
        overlay.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:row;z-index:100;border-radius:inherit;overflow:hidden;`;
        overlay.innerHTML = `
            <button id="colorRecogEven" style="flex:1;border:none;cursor:pointer;background:rgba(45,106,45,0.10);display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:800;color:rgba(45,106,45,0.85);letter-spacing:0.06em;transition:background 0.15s;">EVEN</button>
            <div style="width:1px;background:rgba(0,0,0,0.07);flex-shrink:0;"></div>
            <button id="colorRecogOdd" style="flex:1;border:none;cursor:pointer;background:rgba(139,0,0,0.10);display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:800;color:rgba(139,0,0,0.85);letter-spacing:0.06em;transition:background 0.15s;">ODD</button>
        `;
        timerZone.appendChild(overlay);

        const mq = window.matchMedia('(max-width:500px)');
        function applyLayout(narrow) {
            overlay.style.flexDirection = narrow ? 'column' : 'row';
            const div = overlay.querySelector('div');
            if (div) { div.style.width = narrow ? '100%' : '1px'; div.style.height = narrow ? '1px' : '100%'; }
        }
        applyLayout(mq.matches);
        mq.addEventListener('change', e => applyLayout(e.matches));

        quizStartTime = Date.now();
        timerInt = setInterval(() => {
            document.getElementById('colorRecogTimer').textContent = ((Date.now() - quizStartTime) / 1000).toFixed(3);
        }, 10);

        document.getElementById('colorRecogEven').addEventListener('click', () => handleAnswer(true));
        document.getElementById('colorRecogOdd').addEventListener('click', () => handleAnswer(false));
    }

    function handleAnswer(userSaidEven) {
        clearInterval(timerInt);
        const elapsed = Date.now() - quizStartTime;
        const correctIsEven = currentParityVal === 0;
        const correct = userSaidEven === correctIsEven;
        quizLog.push({ trio: currentTrio.join('/'), emoji: trioEmoji(currentTrio), correctIsEven, correct, timeMs: elapsed });
        if (sidebarOpen) renderSidebar();

        if (correct) {
            nextQuestion();
        } else {
            const wrongBtn = userSaidEven ? document.getElementById('colorRecogEven') : document.getElementById('colorRecogOdd');
            if (wrongBtn) {
                wrongBtn.style.background = 'rgba(200,0,0,0.22)';
                wrongBtn.style.color = 'rgba(180,0,0,0.9)';
                wrongBtn.disabled = true;
                const otherBtn = userSaidEven ? document.getElementById('colorRecogOdd') : document.getElementById('colorRecogEven');
                if (otherBtn) otherBtn.disabled = true;
                setTimeout(nextQuestion, 600);
            }
        }
    }

    const closeQuiz = () => {
        closeModalWithHistory(() => {
            clearInterval(timerInt);
            document.removeEventListener('keydown', handleColorKeyDown);
            modal.remove();
            document.body.classList.remove('modal-open');
        });
    };

    function handleColorKeyDown(e) {
        if (!document.getElementById('colorRecogModal')) { document.removeEventListener('keydown', handleColorKeyDown); return; }
        const leftKeys = new Set(['Tab', 'Backquote', 'Digit1', 'Digit2', 'Digit4', 'Digit5', 'Digit6', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyZ', 'KeyX', 'KeyC', 'KeyV']);
        const rightKeys = new Set(['Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'Enter', 'NumpadEnter']);

        if (e.code === 'Escape') {
            e.preventDefault(); e.stopImmediatePropagation();
            if (quizRunning) {
                quizRunning = false;
                clearInterval(timerInt);
                removeAnswerOverlay();
                showColorRecogStartOverlay();
                return;
            }
            closeQuiz();
            return;
        }

        if (!quizRunning) return;
        const evenBtn = document.getElementById('colorRecogEven');
        const oddBtn = document.getElementById('colorRecogOdd');
        if (leftKeys.has(e.code) && evenBtn && !evenBtn.disabled) { e.preventDefault(); evenBtn.click(); }
        else if (rightKeys.has(e.code) && oddBtn && !oddBtn.disabled) { e.preventDefault(); oddBtn.click(); }
    }
    document.addEventListener('keydown', handleColorKeyDown);

    document.getElementById('colorRecogClose').addEventListener('click', closeQuiz);
    document.getElementById('colorRecogHamburger').addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(); });
    document.getElementById('colorRecogSidebarClose').addEventListener('click', () => { sidebarOpen = false; document.getElementById('colorRecogSidebar').style.display = 'none'; });
    modal.addEventListener('click', (e) => {
        if (sidebarOpen && !document.getElementById('colorRecogSidebar').contains(e.target)) {
            sidebarOpen = false;
            document.getElementById('colorRecogSidebar').style.display = 'none';
        }
    });

    function showColorRecogStartOverlay() {
        let existing = document.getElementById('colorRecogStartOverlay');
        if (existing) existing.remove();
        const timerZone = document.getElementById('colorRecogTimerZone');
        const startOverlay = document.createElement('div');
        startOverlay.id = 'colorRecogStartOverlay';
        startOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:var(--surface);display:flex;align-items:flex-start;justify-content:center;z-index:50;border-radius:inherit;padding-top:2rem;box-sizing:border-box;';
        startOverlay.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:1.2rem;max-width:320px;text-align:center;padding:1.5rem;">
                <div style="font-size:1.1rem;font-weight:700;color:var(--text-ui);">Parity Quiz</div>
                <div style="font-size:0.88rem;color:var(--text-secondary);line-height:1.6;">
                    You'll see three colors. Based on their colors, determine whether the parity is <span style="color:#2d6a2d;font-weight:700;">Even</span> or <span style="color:#8b0000;font-weight:700;">Odd</span>.<br><br>
                    Press the <strong>left half</strong> of the screen (or left-side keys) for Even, and the <strong>right half</strong> (or right-side keys) for Odd.
                </div>
                <button id="colorRecogStartBtn" style="padding:0.9rem 2.2rem;background:var(--accent);color:#fff;border:none;border-radius:12px;font-size:1.1rem;font-weight:700;cursor:pointer;">Start</button>
            </div>`;
        timerZone.appendChild(startOverlay);
        document.getElementById('colorRecogStartBtn').addEventListener('click', () => {
            startOverlay.remove();
            quizRunning = true;
            nextQuestion();
        });
    }

    showColorRecogStartOverlay();
}

// ============================================================
// TRAINER PICKER
// ============================================================

window.openTrainerPickerModal = function () {
    let picker = document.getElementById('trainerPickerModal');
    if (picker) picker.remove();

    picker = document.createElement('div');
    picker.id = 'trainerPickerModal';
    picker.className = 'shape-index-selector-modal active';

    const evilnessEnabled = typeof evilnessFactor !== 'undefined' && evilnessFactor;
    const evilnessBtn = evilnessEnabled
        ? `<button onclick="trainerPickerLaunch('evilness')" class="trainer-pick-btn">Evilness Quiz</button>`
        : '';

    picker.innerHTML = `
        <div class="shape-index-selector-content" style="max-width:380px;">
            <div class="shape-index-selector-header">
                <span class="shape-index-selector-title">Choose Trainer</span>
                <button class="shape-index-selector-close" id="trainerPickerClose">&times;</button>
            </div>
            <div class="shape-index-selector-body" style="display:flex;flex-direction:column;gap:10px;">
                <button onclick="trainerPickerLaunch('timer')" class="trainer-pick-btn">Timer Training</button>
                ${evilnessBtn}
                <button onclick="trainerPickerLaunch('color')" class="trainer-pick-btn">Parity Quiz</button>
            </div>
        </div>
    `;

    const style = document.getElementById('trainerPickerStyle') || document.createElement('style');
    style.id = 'trainerPickerStyle';
    style.textContent = `.trainer-pick-btn{padding:14px 18px;background:var(--surface2);border:2px solid var(--border-color);border-radius:10px;cursor:pointer;font-size:0.95rem;font-weight:600;color:var(--text-ui);text-align:left;width:100%;transition:all 0.15s;} .trainer-pick-btn:hover{border-color:var(--accent);background:var(--hover-bg);}`;
    if (!style.parentNode) document.head.appendChild(style);

    document.body.appendChild(picker);
    pushModalState('trainerPickerModal', closeTrainerPickerModal);
    document.getElementById('trainerPickerClose').addEventListener('click', closeTrainerPickerModal);
    picker.addEventListener('click', e => { if (e.target === picker) closeTrainerPickerModal(); });
};

function closeTrainerPickerModal() {
    closeModalWithHistory(() => {
        const picker = document.getElementById('trainerPickerModal');
        if (picker) picker.remove();
    });
}

window.trainerPickerLaunch = function (type) {
    const picker = document.getElementById('trainerPickerModal');
    if (picker) picker.remove();

    const KEYS = {
        timer: 'sq1-selector-cases',
        evilness: 'sq1-selector-evilness',
        parity: 'sq1-selector-parity',
        color: 'sq1-selector-color',
    };
    const key = KEYS[type];
    window._selectorStorageKey = key;

    let saved = JSON.parse(localStorage.getItem(key));
    const chosen = (saved && saved.length > 0) ? saved.filter(n => data.some(d => d.name === n)) : data.map(d => d.name);

    if (type === 'timer') {
        selectorSelectedCases = new Set(chosen);
        openMultiCaseTrainingModal(chosen);
    } else if (type === 'evilness') {
        startEvilnessQuiz(chosen);
    } else if (type === 'parity') {
        startParityQuiz(chosen);
    } else if (type === 'color') {
        startColorRecognitionPractice();
    }
};


/* ==== FILE: js/multi-trainer.js ==== */

﻿// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                        MULTI-CASE TRAINING SELECTOR                     ║
// ╚══════════════════════════════════════════════════════════════════════════╝

let selectorSelectedCases = new Set();
let selectorSearchTerm = '';
let selectorFilteredData = [];

// ─── Persistence ──────────────────────────────────────────────────────────────

function saveSelectorSelection(key) {
    const storageKey = key || window._selectorStorageKey || 'sq1-selector-cases';
    localStorage.setItem(storageKey, JSON.stringify([...selectorSelectedCases]));
}

function loadSelectorSelection(key) {
    try {
        const storageKey = key || window._selectorStorageKey || 'sq1-selector-cases';
        const raw = localStorage.getItem(storageKey);
        if (raw) {
            const arr = JSON.parse(raw);
            selectorSelectedCases = new Set(arr.filter(n => data.some(d => d.name === n)));
        }
    } catch (e) { }
    if (selectorSelectedCases.size === 0) {
        data.forEach(item => selectorSelectedCases.add(item.name));
        saveSelectorSelection(key);
    }
}

// Call once data is ready (after DOMContentLoaded / window.load)
document.addEventListener('DOMContentLoaded', () => {
    // Wait a tick so `data` is populated
    setTimeout(loadSelectorSelection, 0);
});

// ─── Open selector as a modal overlay (not fullscreen) ───────────────────────

window.openTrainingSelector = function () {
    window._selectorStorageKey = 'sq1-selector-cases';
    if (selectorSelectedCases.size === 0) loadSelectorSelection('sq1-selector-cases');
    openMultiCaseTrainingModal([...selectorSelectedCases]);
};

function openSelectorModal(storageKey, onCloseCallback) {
    if (storageKey) window._selectorStorageKey = storageKey;
    else if (!window._selectorStorageKey) window._selectorStorageKey = 'sq1-selector-cases';

    if (onCloseCallback) window._selectorCloseCallback = onCloseCallback;
    else window._selectorCloseCallback = null;

    loadSelectorSelection(window._selectorStorageKey);

    createSelectorModal();
    const modal = document.getElementById('trainingSelectorModal');
    if (!modal) return;

    pushModalState('trainingSelectorModal', closeSelectorModal);

    renderSelectorCases();
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');

    const inp = document.getElementById('selectorSearchInput');
    if (inp) inp.value = selectorSearchTerm;
}

window.closeSelectorModal = function () {
    closeModalWithHistory(() => {
        const modal = document.getElementById('trainingSelectorModal');
        if (!modal) return;
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    });
};

// ─── Modal Creation ───────────────────────────────────────────────────────────

function createSelectorModal() {
    if (document.getElementById('trainingSelectorModal')) return;

    const modal = document.createElement('div');
    modal.id = 'trainingSelectorModal';
    modal.style.cssText = `
        display: none;
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: var(--modal-overlay);
        z-index: 10001;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
    `;

    modal.innerHTML = `
        <div style="
            background: var(--surface);
            border-radius: 14px;
            width: min(560px, 100%);
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 8px 32px rgba(0,0,0,0.25);
            overflow: hidden;
        ">
            <!-- Header -->
            <div style="flex-shrink:0; padding: 16px 20px; background: var(--modal-header-bg); border-bottom: 1px solid var(--surface-border); display:flex; align-items:center; justify-content:space-between;">
                <div style="display:flex; align-items:baseline; gap:8px; flex-wrap:wrap;">
                    <span style="font-size:1.15rem; font-weight:700; color: var(--text-primary);">Select Cases</span>
                    <span id="selectorCountBar" style="font-size:0.8rem; color:var(--text-secondary); font-weight:400;"></span>
                </div>
                <button onclick="closeSelectorModal()" style="background:none; border:none; font-size:1.6rem; cursor:pointer; color:var(--text-secondary); line-height:1; padding:0;">&times;</button>
            </div>

            <!-- Search + Custom Select bar -->
            <div style="flex-shrink:0; padding: 10px 14px; background:var(--surface2); border-bottom:1px solid var(--surface-border); display:flex; gap:8px; align-items:center;">
                <div style="position:relative; flex:1; min-width:0;">
                    <input type="text" id="selectorSearchInput"
                        placeholder="Search cases..."
                        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                        style="width:100%; padding:7px 10px 7px 32px; border: 1px solid var(--border-color); border-radius:7px; font-size:0.88rem; outline:none; box-sizing:border-box;"
                        oninput="onSelectorSearch(this.value)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        style="position:absolute; left:9px; top:50%; transform:translateY(-50%); width:15px; height:15px; pointer-events:none;">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                </div>
                <select id="selectorBulkAction"
                    style="padding:7px 8px; border: 1px solid var(--border-color); border-radius:7px; font-size:0.82rem; background:var(--surface); cursor:pointer; color:var(--text-secondary); flex-shrink:0;"
                    onchange="applySelectorBulkAction(this.value); this.value='';">
                    <option value="" disabled selected>Select…</option>
                    <option value="select_all">Select All</option>
                    <option value="select_learning">Select Learning</option>
                    <option value="select_learned">Select Learned</option>
                    <option value="select_learning_learned">Select Learning + Learned</option>
                    <option value="select_these">Select These (add to selection)</option>
                    <option value="deselect_learned">Deselect Learned</option>
                    <option value="deselect_these">Deselect These</option>
                    <option value="deselect_all">Deselect All</option>
                </select>
            </div>

            <!-- Cases grid -->
            <div id="selectorCaseGrid" style="
                flex:1; overflow-y:auto; padding:10px 12px;
                display:grid;
                grid-template-columns: repeat(3, 1fr);
                gap:7px;
                align-content:start;
            "></div>
        </div>
    `;

    // Close on backdrop click
    modal.addEventListener('click', e => { if (e.target === modal) closeSelectorModal(); });

    document.body.appendChild(modal);
}

// ─── Search ───────────────────────────────────────────────────────────────────

window.onSelectorSearch = function (val) {
    selectorSearchTerm = val.toLowerCase().trim();
    renderSelectorCases();
};

function getSelectorSorted(arr) {
    return [...arr].sort((a, b) => {
        const aLearning = learningCases.has(a.name);
        const bLearning = learningCases.has(b.name);
        const aLearned = learnedCases.has(a.name);
        const bLearned = learnedCases.has(b.name);
        const aPlanned = plannedCases.has(a.name);
        const bPlanned = plannedCases.has(b.name);
        if (aLearning && !bLearning) return -1;
        if (!aLearning && bLearning) return 1;
        if (aPlanned && bPlanned) {
            return (plannedLevels.get(a.name) || 4) - (plannedLevels.get(b.name) || 4);
        }
        if (aPlanned && !bPlanned) return -1;
        if (!aPlanned && bPlanned) return 1;
        if (aLearned && !bLearned) return 1;
        if (!aLearned && bLearned) return -1;
        return 0;
    });
}

function getSelectorFilteredData() {
    if (!selectorSearchTerm) return getSelectorSorted(data);
    return getSelectorSorted(data.filter(item => {
        const displayName = getDisplayName(item.name).toLowerCase();
        const name = item.name.toLowerCase();
        const term = selectorSearchTerm;
        if (!term.includes('/')) {
            return displayName.includes(term) || name.includes(term);
        }
        const [p1, p2] = term.split('/').map(p => p.trim());
        const parts = displayName.split('/').map(p => p.trim());
        if (parts.length === 2) {
            return (parts[0].includes(p1) && parts[1].includes(p2)) ||
                (parts[1].includes(p1) && parts[0].includes(p2));
        }
        return false;
    }));
}

// ─── Render Cases Grid ────────────────────────────────────────────────────────

function renderSelectorCases() {
    const grid = document.getElementById('selectorCaseGrid');
    if (!grid) return;

    selectorFilteredData = getSelectorFilteredData();

    grid.innerHTML = selectorFilteredData.map(item => {
        const isSelected = selectorSelectedCases.has(item.name);
        const isLearned = learnedCases.has(item.name);
        const isLearning = learningCases.has(item.name);
        const priorityLevel = plannedLevels.get(item.name) || 4;

        let bgColor, borderColor, textColor, checkColor;
        if (isLearned) {
            bgColor = isSelected ? 'var(--card-learned-header)' : 'var(--card-learned-bg)';
            borderColor = isSelected ? 'var(--card-learned-border)' : 'var(--card-learned-border)';
            textColor = 'var(--text-primary)';
            checkColor = 'var(--card-learned-border)';
        } else if (isLearning) {
            bgColor = isSelected ? 'var(--card-learning-header)' : 'var(--card-learning-bg)';
            borderColor = isSelected ? 'var(--card-learning-border)' : 'var(--card-learning-border)';
            textColor = 'var(--text-primary)';
            checkColor = 'var(--card-learning-border)';
        } else {
            const priorityBgs = [
                'var(--p1-bg)', 'var(--p2-bg)', 'var(--p3-bg)', 'var(--p4-bg)',
                'var(--p5-bg)', 'var(--p6-bg)', 'var(--p7-bg)'
            ];
            const priorityBords = [
                'var(--p1-border)', 'var(--p2-border)', 'var(--p3-border)', 'var(--p4-border)',
                'var(--p5-border)', 'var(--p6-border)', 'var(--p7-border)'
            ];
            bgColor = isSelected ? priorityBgs[priorityLevel - 1] : 'var(--surface)';
            borderColor = isSelected ? priorityBords[priorityLevel - 1] : 'var(--border-color)';
            textColor = 'var(--text-primary)';
            checkColor = 'var(--accent)';
        }

        return `
            <div onclick="toggleSelectorCase('${item.name.replace(/'/g, "\\'")}')"
                style="
                    padding: 7px 8px;
                    background: ${bgColor};
                    border: 2px solid ${borderColor};
                    border-radius: 7px;
                    cursor: pointer;
                    display: flex;
                    align-items: flex-start;
                    gap: 7px;
                    user-select: none;
                    box-sizing: border-box;
                    width: 100%;
                ">
                <div style="
                    width:16px; height:16px; border-radius:3px; flex-shrink:0; margin-top:1px;
                    border:2px solid ${isSelected ? checkColor : 'var(--border-color)'};
                    background:${isSelected ? checkColor : 'var(--surface)'};
                    display:flex; align-items:center; justify-content:center;
                ">
                    ${isSelected ? `<svg viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:9px;height:9px;"><polyline points="2 6 5 9 10 3"/></svg>` : ''}
                </div>
                <span style="font-size:0.78rem; font-weight:600; color:${textColor}; line-height:1.3; word-break:break-word;">${(() => { const n = getDisplayName(item.name); return n.includes('/') ? n.replace(/ /g, '\u00A0').replace('/', '/\u200B') : n; })()}</span>
            </div>
        `;
    }).join('');

    const countBar = document.getElementById('selectorCountBar');
    if (countBar) {
        const total = selectorSelectedCases.size;
        countBar.textContent = `${total} out of ${data.length} selected` +
            (selectorSearchTerm ? ` · ${selectorFilteredData.length} shown` : '');
    }
}

// ─── Toggle Case ──────────────────────────────────────────────────────────────

window.toggleSelectorCase = function (caseName) {
    if (selectorSelectedCases.has(caseName)) {
        selectorSelectedCases.delete(caseName);
    } else {
        selectorSelectedCases.add(caseName);
    }
    saveSelectorSelection(window._selectorStorageKey);
    renderSelectorCases();
    if (window._multiCaseMode) {
        multiTrainingCases = [...selectorSelectedCases];
        updateMultiTrainingTitle();
        // Only regenerate if the currently showing scramble's case was deselected
        const current = scrambleHistory[currentHistoryIndex];
        if (current && current.caseName === caseName && !selectorSelectedCases.has(caseName)) {
            regenerateMultiScrambleLookahead();
        }
    }
};

// ─── Bulk Actions ─────────────────────────────────────────────────────────────

window.applySelectorBulkAction = function (action) {
    switch (action) {
        case 'select_all':
            selectorSelectedCases.clear();
            data.forEach(i => selectorSelectedCases.add(i.name));
            break;
        case 'select_learning':
            selectorSelectedCases.clear();
            data.forEach(i => { if (learningCases.has(i.name)) selectorSelectedCases.add(i.name); });
            break;
        case 'select_learned':
            selectorSelectedCases.clear();
            data.forEach(i => { if (learnedCases.has(i.name)) selectorSelectedCases.add(i.name); });
            break;
        case 'select_learning_learned':
            selectorSelectedCases.clear();
            data.forEach(i => {
                if (learningCases.has(i.name) || learnedCases.has(i.name)) selectorSelectedCases.add(i.name);
            });
            break;
        case 'select_these':
            // Additive only
            selectorFilteredData.forEach(i => selectorSelectedCases.add(i.name));
            break;
        case 'deselect_learned':
            data.forEach(i => { if (learnedCases.has(i.name)) selectorSelectedCases.delete(i.name); });
            break;
        case 'deselect_these':
            selectorFilteredData.forEach(i => selectorSelectedCases.delete(i.name));
            break;
        case 'deselect_all':
            selectorSelectedCases.clear();
            break;
    }
    saveSelectorSelection(window._selectorStorageKey);
    renderSelectorCases();
    if (window._multiCaseMode) {
        multiTrainingCases = [...selectorSelectedCases];
        updateMultiTrainingTitle();
        // Only regenerate if the currently showing scramble's case is no longer selected
        const current = scrambleHistory[currentHistoryIndex];
        if (current && current.caseName && !selectorSelectedCases.has(current.caseName)) {
            regenerateMultiScrambleLookahead();
        }
    }
};

// ─── Multi-Case Training Modal ────────────────────────────────────────────────

let multiTrainingCases = [];

window.openMultiCaseTrainingModal = function (caseNames) {
    multiTrainingCases = caseNames;

    createTrainingModal();

    const modal = document.getElementById('trainingModal');
    const titleEl = document.getElementById('trainingCaseName');

    pushModalState('trainingModal', closeTrainingModal);

    titleEl.onclick = (e) => {
        e.stopPropagation();
        openSelectorModal(window._selectorStorageKey || 'sq1-selector-cases', (chosen) => {
            multiTrainingCases = chosen;
            updateMultiTrainingTitle();
            regenerateMultiScrambleLookahead();
        });
    };
    updateMultiTrainingTitle();

    const savedTrainingImageSize = localStorage.getItem('trainingScrambleImageSize');
    const savedTrainingTextSize = localStorage.getItem('trainingScrambleTextSize');
    const savedTrainingHoldToStart = localStorage.getItem('trainingHoldToStart');

    trainingScrambleImageSize = savedTrainingImageSize ? parseInt(savedTrainingImageSize) : 200;
    trainingScrambleTextSize = savedTrainingTextSize ? parseInt(savedTrainingTextSize) : 16;
    trainingHoldToStart = savedTrainingHoldToStart ? parseFloat(savedTrainingHoldToStart) : 0.22;
    trainingEnableInspection = localStorage.getItem('trainingEnableInspection') === 'true';
    trainingEnableParityQuiz = localStorage.getItem('trainingEnableParityQuiz') === 'true';

    timerElapsed = 0;
    scrambleHistory = [];
    currentHistoryIndex = -1;
    isHoldReady = false;
    preGeneratedScrambles = [];

    window._multiCaseMode = true;

    for (let i = 0; i < 3; i++) {
        preGeneratedScrambles.push(generateNextScrambleData());
    }

    displayNextScramble();

    modal.classList.add('active');
    document.body.classList.add('modal-open');
    if (typeof applyPrevScrambleBar === 'function') applyPrevScrambleBar();
    if (typeof applyTimerSize === 'function') applyTimerSize();
};

function updateMultiTrainingTitle() {
    const titleEl = document.getElementById('trainingCaseName');
    if (!titleEl) return;
    const n = multiTrainingCases.length;
    titleEl.textContent = `${n} case${n !== 1 ? 's' : ''} selected`;
}

// ─── Regenerate lookahead when cases change ───────────────────────────────────

function regenerateMultiScrambleLookahead() {
    preGeneratedScrambles = [];
    for (let i = 0; i < 3; i++) {
        preGeneratedScrambles.push(generateNextScrambleData());
    }
    // Show a fresh scramble
    if (currentHistoryIndex === scrambleHistory.length - 1 || scrambleHistory.length === 0) {
        displayNextScramble();
    }
    updateMultiTrainingTitle();
}

// ─── Scramble Generation ──────────────────────────────────────────────────────

function generateMultiCaseScrambleData() {
    if (!multiTrainingCases || multiTrainingCases.length === 0) return null;

    const caseName = multiTrainingCases[Math.floor(Math.random() * multiTrainingCases.length)];
    const shapeIndexItem = shapeIndex.find(s => s.name === caseName);
    if (!shapeIndexItem) return null;

    const selectedKey = `training_selected_${caseName}`;
    let indices = (window.trainingSelections && window.trainingSelections[selectedKey])
        ? window.trainingSelections[selectedKey]
        : [...(shapeIndexItem.org || []), ...(shapeIndexItem.mir || [])];

    if (!indices || indices.length === 0) return null;

    const scramble = indices[Math.floor(Math.random() * indices.length)];
    const hexCode = shapeIndexToHex(scramble);

    let scrambleText = hexCode;
    let scrambleImage = '<div style="color:var(--text-muted);">Image unavailable</div>';

    try {
        const state = parseHexFormat(hexCode);
        scrambleText = window.sq1Tools.scrambleFromState(state) || hexCode;
        if (typeof SQ1ColorizerLib !== 'undefined' && SQ1ColorizerLib.processScramble) {
            scrambleText = SQ1ColorizerLib.processScramble(scrambleText).html || scrambleText;
        }
    } catch (e) { console.error('Multi scramble gen error:', e); }

    try {
        if (typeof visualizeFromScrambleNotation !== 'undefined') {
            const state = parseHexFormat(hexCode);
            const notation = window.sq1Tools.scrambleFromState(state) || hexCode;
            scrambleImage = visualizeFromScrambleNotation(notation, trainingScrambleImageSize, colorScheme);
        } else {
            scrambleImage = generateScrambleSVGFromHex(hexCode);
        }
    } catch (e) { console.error('Multi image gen error:', e); }

    return { text: scrambleText, image: scrambleImage, caseName };
}

// ─── Patch generateNextScrambleData ──────────────────────────────────────────

const _origGenerateNextScrambleData = generateNextScrambleData;
window.generateNextScrambleData = function () {
    if (window._multiCaseMode) {
        const d = generateMultiCaseScrambleData();
        return d;
    }
    return _origGenerateNextScrambleData();
};

// ─── Patch closeTrainingModal ─────────────────────────────────────────────────

window.closeTrainingModal = function () {
    const modal = document.getElementById('trainingModal');
    if (!modal) return;

    modal.classList.remove('active');
    document.body.classList.remove('modal-open');

    const bar = document.getElementById('prevScrambleBar');
    if (bar) bar.style.display = 'none';

    if (timerRunning) stopTimerOnly();

    preGeneratedScrambles = [];
    timerElapsed = 0;
    scrambleHistory = [];
    currentHistoryIndex = -1;
    currentTrainingCase = null;
    isHoldReady = false;
    window._multiCaseMode = false;

    filterAndSort(true);
};

// ─── Export / Import hooks ────────────────────────────────────────────────────

window.selectorExportHook = function (stateObj) {
    stateObj.selectorSelectedCases = [...selectorSelectedCases];
    return stateObj;
};

window.selectorImportHook = function (stateObj) {
    if (stateObj.selectorSelectedCases && Array.isArray(stateObj.selectorSelectedCases)) {
        selectorSelectedCases = new Set(stateObj.selectorSelectedCases.filter(n => data.some(d => d.name === n)));
        saveSelectorSelection();
    }
};


/* ==== FILE: js/index.js ==== */

window.closeModalStack = [];
window._sqgModalPopstateClosing = false;
window._sqgModalSkipPopstate = false;

window.pushModalState = function (modalId, closeFn, ...args) {
    if (typeof closeFn !== 'function') return;
    const entry = args.length ? [closeFn, ...args] : closeFn;
    window.closeModalStack.push(entry);
    try {
        window.history.pushState({ sqgModal: true, modalId }, '');
    } catch (e) {
    }
};

window.removeCloseModalFromStack = function (closeFn) {
    if (typeof closeFn !== 'function') return;
    window.closeModalStack = window.closeModalStack.filter((entry) => {
        if (typeof entry === 'function') return entry !== closeFn;
        if (Array.isArray(entry) && typeof entry[0] === 'function') return entry[0] !== closeFn;
        return true;
    });
};

window.popCloseModalStack = function () {
    if (window.closeModalStack.length === 0) return false;
    const entry = window.closeModalStack.pop();
    if (typeof entry === 'function') {
        entry();
    } else if (Array.isArray(entry)) {
        const closeFn = entry[0];
        if (typeof closeFn === 'function') {
            closeFn(...entry.slice(1));
        }
    }
    return true;
};

window.closeModalWithHistory = function (closeFn, ...args) {
    if (typeof closeFn !== 'function') return;
    window.removeCloseModalFromStack(closeFn);

    const shouldPopHistory = !window._sqgModalPopstateClosing && window.history.state && window.history.state.sqgModal;
    if (shouldPopHistory) {
        window._sqgModalSkipPopstate = true;
    }

    closeFn(...args);

    if (shouldPopHistory) {
        window.history.back();
    }
};

window.addEventListener('popstate', function () {
    if (window._sqgModalSkipPopstate) {
        window._sqgModalSkipPopstate = false;
        return;
    }

    if (window.closeModalStack.length > 0) {
        window._sqgModalPopstateClosing = true;
        window.popCloseModalStack();
        window._sqgModalPopstateClosing = false;
    }
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        if (document.getElementById('evilnessQuizModal')) return;
        if (window.closeModalStack.length > 0) {
            window.popCloseModalStack();
        }
    }
});

// Drag and drop support
document.body.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.body.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].name.endsWith('.json')) {
        handleFileImport(files[0]);
    }
});

// Close modals when clicking outside (wait for modals to be generated)
window.onclick = function (event) {
    // Use setTimeout to ensure modals are generated
    setTimeout(() => {
        const settingsModal = document.getElementById('settingsModal');
        const caseNameModal = document.getElementById('caseNameModal');
        const suggestModal = document.getElementById('suggestModal');
        const confessionModal = document.getElementById('confessionModal');
        const colorSchemeModal = document.getElementById('colorSchemeModal');
        const trainingModal = document.getElementById('trainingModal');
        const profileModal = document.getElementById('profileModal');

        if (event.target == settingsModal) {
            closeSettingsModal();
        }
        if (event.target == caseNameModal) {
            closeCaseNameModal();
        }
        if (event.target == colorSchemeModal) {
            closeColorSchemeModal();
        }
        if (trainingModal && event.target == trainingModal) {
            closeTrainingModal();
        }

        if (event.target == suggestModal) {
            closeSuggestModal();
        }
        if (event.target == confessionModal) {
            closeConfessionModal();
        }
        const profileModalMobile = document.getElementById('profileModalMobile');
        if (profileModalMobile && event.target == profileModalMobile) {
            closeProfileModalMobile();
        }
    }, 0);
}

// Wait for DOM to be ready before generating modals
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        generateModalHTML();
    });
} else {
    generateModalHTML();
}

// Ensure DOM is ready before initialization
function initializeApp() {
    // Initialize DOM references
    initializeDOMReferences();

    // Set default sort value if first load
    if (isFirstLoad && sortSelect) {
        sortSelect.value = 'probability';
    }
}

// Call initialization after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Loading tips object
const loadingTips = {
    firstLoad: [
        "Welcome to SquanGo CSP!!",
    ],
    general: [
        "Happy Learning.",
        "There are 3678 different sliceable positions on a squan.",
        "Square-1 was invented in 1990 by Karel Hršel and Vojtěch Kopský",
        "Square-1 notation was created by Jaap Scherphuis, the creator of sq1optim",
        "Every position on a squan can be solved under 13 slices (12 ignoring the equator) or under 31 face turns!",
        "WR: 4.63 avg — Sameer Aggarwal",
        "WR: 3.40 single — Hassan Khanani.",
        "Back to square one, literally!",
        "Parity monster is hiding under your bed!!",
        "#BanMattsMuffinTracing!!!",
        "#BanMatts5-1Tracing!!!",
        "\"Square-1\" is short for \"Back to Square 1\", one of the original names of the puzzle!",
        "The earliest names of Square-1 was \"Back to Square 1\", and \"Cube 21\"",
        "Square-1 is one of the OG events of wca, added in 2005 — one year after the creation of wca",
        "The first square-1 average world record was by Lars Vandenbergh of 33.21s at Dutch Open 2004",
        "The first square-1 world record was by Lars Vandenbergh, 41.80s single at World Championship 2003",
        "Mike Masonjones proved in 2005 that God's Number for the Square-1 is 13 in the twist metric (10.615 on average).",
        "In 2017, Chen Shuang calculated the God's Number for the Square-1 to be 31 in face turn metric (25.134 on average)",
        "csTimer was created by Chen Shuang (cs0x7f) in 2016 and stands for Chen Shuang's Timer",
        "Square-1 was patented by Karel Hrsel and Vojtech Kopsky on 16 March 1993, US 5,193,809.",
        "Some CSP's even-odd algs are mirrors of each other!",
        "meow :3 — Matt 2026",
        "You can start tracing on either shape if both are 4e4c!",
        "Parity Monster is hiding behind the curtain!!!",
        "Cale's Parity Tracing was invented by Cale Schoon (2014SCHO02), published on May 16, 2017",
        "You can change the tracing position and the even/odd will update automatically!",
        "Click in the middle of a symmetric shape in Parity Tracer to trace from a different angle!",
        "Creating stories will help you remember CSP.",
        "Free Palestine",
        "Find other SquanGo tools at: squan-go.web.app"
    ]
};

// Responsive loading screen (set BEFORE creating elements)
function adjustLoadingScreen() {
    const width = window.innerWidth;
    const title = document.getElementById('loadingTitle');
    const author = document.getElementById('loadingAuthor');
    const tip = document.getElementById('loadingTip');
    const evaCredit = document.getElementById('evaCredit');
    const mattCredit = document.getElementById('mattCredit');

    if (width <= 355) {
        if (title) title.classList.add('loading-title--xs');
        if (author) author.classList.add('loading-author--xs');
        if (tip) tip.classList.add('loading-tip--xs');
        if (evaCredit) evaCredit.classList.add('loading-credit--xs');
        if (mattCredit) mattCredit.classList.add('loading-credit--xs');
    } else if (width <= 480) {
        if (title) title.classList.add('loading-title--sm');
        if (author) author.classList.add('loading-author--sm');
        if (tip) tip.classList.add('loading-tip--sm');
        if (evaCredit) evaCredit.classList.add('loading-credit--sm');
        if (mattCredit) mattCredit.classList.add('loading-credit--sm');
    }
    // else: default sizes from CSS
}

// Select and display a random tip
const tipElement = document.createElement('p');
tipElement.id = 'loadingTip';
tipElement.className = 'loading-tip';
const tips = isFirstLoad ? loadingTips.firstLoad : loadingTips.general;
const randomTip = tips[Math.floor(Math.random() * tips.length)];
tipElement.textContent = randomTip;
document.getElementById('loadingTipContainer').appendChild(tipElement);

// Add Eva Kato credit
const evaCredit = document.createElement('p');
evaCredit.id = 'evaCredit';
evaCredit.className = 'loading-credit';
evaCredit.textContent = 'inspired from hashtagcuber.com/csp/ by Eva Kato';
document.getElementById('loadingScreen').appendChild(evaCredit);

// Add Matt credit
const mattCredit = document.createElement('p');
mattCredit.id = 'mattCredit';
mattCredit.className = 'loading-credit loading-credit--matt';
mattCredit.textContent = 'credit goes to Matt (@this_is_not_matt) for helping me out in this project';
document.getElementById('loadingScreen').appendChild(mattCredit);

// Apply initial sizing
adjustLoadingScreen();
window.addEventListener('resize', adjustLoadingScreen);

// Loading screen progress simulation
let loadProgress = 0;
const progressBar = document.getElementById('loadingProgress');
const loadingInterval = setInterval(() => {
    loadProgress += Math.random() * 30;
    if (loadProgress > 90) loadProgress = 90;
    progressBar.style.width = loadProgress + '%';
}, 100);

// Wait for DOM before calling these functions
function finalizeInitialization() {

    // Setup sidebar
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    if (sidebarToggleBtn) {
        sidebarToggleBtn.onclick = (e) => {
            e.stopPropagation();
            toggleSidebar();
        };
    }

    // Setup profile button
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.onclick = (e) => {
            e.stopPropagation();
            if (window.innerWidth > 620) {
                showProfilePopup(true);
            } else {
                openProfileModalMobile();
            }
        };
    }

    // Setup search toggle for mobile
    const searchToggle = document.getElementById('searchToggle');
    const searchInput = document.getElementById('search');
    const controls = document.querySelector('.controls');

    if (searchToggle && controls && searchInput) {
        searchToggle.onmousedown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isExpanded = controls.classList.toggle('search-expanded');

            if (isExpanded) {
                setTimeout(() => {
                    searchInput.focus();
                }, 100);
            } else {
                searchInput.blur();
            }
        };

        // Close search when clicking outside
        document.addEventListener('click', (e) => {
            if (controls.classList.contains('search-expanded') &&
                !controls.contains(e.target) &&
                !searchToggle.contains(e.target)) {
                controls.classList.remove('search-expanded');
                searchInput.blur();
            }
        });

        // Close search on escape key
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                controls.classList.remove('search-expanded');
                searchInput.blur();
            }
        });
    }

    // Apply instruction button visibility
    if (hideInstructions) {
        const container = document.getElementById('floatingButtonsContainer');
        if (container) {
            container.classList.add('hide-instructions');
        }
    }
    if (typeof applyInstructionVisibility === 'function') {
        applyInstructionVisibility();
    }

    // These need to run after modal generation
    setTimeout(() => {
        updateProgress();
        filterAndSort(true); // Soft render on initialization
        if (typeof applyProfileUI === 'function') applyProfileUI();
    }, 100);
}

// Ensure this runs after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        finalizeInitialization();
        // Set saved sort mode
        const sortSelect = document.getElementById('sort');
        if (sortSelect && currentSortMode) {
            sortSelect.value = currentSortMode;
        }
    });
} else {
    finalizeInitialization();
    // Set saved sort mode
    const sortSelect = document.getElementById('sort');
    if (sortSelect && currentSortMode) {
        sortSelect.value = currentSortMode;
    }
}

window.addEventListener('load', async () => {
    const loadStartTime = Date.now();

    const hasDeepLink = (() => {
        const hash = decodeURIComponent(window.location.hash);
        return hash.startsWith('#s=') || (hash.length > 1 && hash.slice(1).includes('('));
    })();

    if (hasDeepLink) {
        // Nuke loading screen, keep container hidden until after tracer opens
        document.getElementById('loadingScreen').style.display = 'none';
        clearInterval(loadingInterval);

        // Initialize just enough to open the tracer
        await initializePreset();
        if (isFirstLoad) await applyPreset('Default_Preset', true, true);
        initializeSVGData();

        // Open tracer immediately
        checkURLScramble();

        // Now render the rest of the app in the background
        requestAnimationFrame(() => {
            const sortSelect = document.getElementById('sort');
            if (sortSelect && currentSortMode) sortSelect.value = currentSortMode;
            if (needsParityRecalculation()) calculateAndCacheAllParity();
            setTimeout(() => {
                document.getElementById('mainContainer').classList.remove('hidden-until-loaded');
            }, 500);
        });

    } else {
        // Normal load flow
        await initializePreset();
        if (isFirstLoad) await applyPreset('Default_Preset', true, true);
        initializeSVGData();

        const sortSelect = document.getElementById('sort');
        if (sortSelect && currentSortMode) sortSelect.value = currentSortMode;
        if (needsParityRecalculation()) calculateAndCacheAllParity();

        const loadDuration = Date.now() - loadStartTime;
        const remainingTime = Math.max(0, 2500 - loadDuration);
        await new Promise(resolve => setTimeout(resolve, remainingTime));

        clearInterval(loadingInterval);
        progressBar.style.width = '100%';
        await new Promise(resolve => setTimeout(resolve, 200));

        const loadingScreen = document.getElementById('loadingScreen');
        const mainContainer = document.getElementById('mainContainer');
        loadingScreen.classList.add('loading-screen--fade-out');
        mainContainer.classList.remove('hidden-until-loaded');

        await new Promise(resolve => setTimeout(resolve, 300));
        loadingScreen.style.display = 'none';
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Check if Alt key is pressed
    if (e.altKey) {
        switch (e.key.toLowerCase()) {
            case 't': // Alt+T - Show tracing guides
                e.preventDefault();
                showHints = !showHints;
                localStorage.setItem('showHints', showHints);
                applyHintVisibility();
                const hintToggle = document.getElementById('hintToggle');
                if (hintToggle) hintToggle.checked = showHints;
                showToast(`Tracing guides ${showHints ? 'enabled' : 'disabled'}`, 2000, 'info');
                break;
            case 'h': // Alt+H - Hide instructions
                e.preventDefault();
                hideInstructions = !hideInstructions;
                saveState();
                applyInstructionVisibility();
                const hideInstructionsToggle = document.getElementById('hideInstructionsToggle');
                if (hideInstructionsToggle) hideInstructionsToggle.checked = hideInstructions;
                showToast(`Instruction buttons ${hideInstructions ? 'hidden' : 'shown'}`, 2000, 'info');
                break;
            case 'p': // Alt+P - Hide parenthesis
                e.preventDefault();
                hideParenthesis = !hideParenthesis;
                saveState();
                render();
                const hideParenthesisToggle = document.getElementById('hideParenthesisToggle');
                if (hideParenthesisToggle) hideParenthesisToggle.checked = hideParenthesis;
                showToast(`Parenthesis ${hideParenthesis ? 'hidden' : 'shown'}`, 2000, 'info');
                break;
            case 'w': // Alt+W - Parity tracing personalization
                e.preventDefault();
                openParityTracingPersonalization();
                break;
            case 'g': // Alt+G - Customize tracing guides
                e.preventDefault();
                openCustomizeSVGsModal();
                break;
            case 'q': // Alt+Q - Quick edit
                e.preventDefault();
                openQuickEditModal();
                break;
        }
    }
});

// URL scramble deep-link: squan-go.web.app/csp/#s=(0,-1)/ (6,-3)/ ...
function checkURLScramble() {
    const hash = decodeURIComponent(window.location.hash);
    if (!hash || hash.length <= 1) return;

    let scramble = null;

    // Format: #s=scramble
    if (hash.startsWith('#s=')) {
        scramble = hash.slice(3).trim();
    }
    // Fallback: bare hash with parens (old format)
    else if (hash.slice(1).includes('(')) {
        scramble = hash.slice(1).trim();
    }

    if (scramble && (scramble.includes('(') || scramble.includes('/'))) {
        const tryOpen = (attempts) => {
            if (typeof window.ParityTracerLibrary !== 'undefined' && typeof openNewParityAnalysis === 'function') {
                openNewParityAnalysis(scramble);
            } else if (attempts > 0) {
                setTimeout(() => tryOpen(attempts - 1), 300);
            }
        };
        tryOpen(20);
    }
}

window.addEventListener('load', () => {
    const hasDeepLink = (() => {
        const hash = decodeURIComponent(window.location.hash);
        return hash.startsWith('#s=') || (hash.length > 1 && hash.slice(1).includes('('));
    })();
    if (!hasDeepLink) {
        setTimeout(checkURLScramble, 3000);
    }
});