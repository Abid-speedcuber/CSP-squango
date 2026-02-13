// Square-1 Parity Tracer Library - Complete Refactored Edition
// With ridiculously long variable names to avoid conflicts with parent apps
(function (globalThisWindowObjectThingyForParityTracer) {
    'use strict';

    // Color configuration with absurdly long name
    let superDuperSquareOnePuzzleColorConfigurationObjectThatWillNeverConflict = {
        topLayerMainColor: '#FFD700',
        topLayerColorFullName: 'Yellow',
        topLayerColorAbbreviation: 'Y',
        bottomLayerMainColor: '#FFFFFF',
        bottomLayerColorFullName: 'White',
        bottomLayerColorAbbreviation: 'W',
        frontFaceColorForVisualization: '#CC0000',
        rightFaceColorForVisualization: '#00AA00',
        backFaceColorForVisualization: '#FF8C00',
        leftFaceColorForVisualization: '#0066CC'
    };

    // Piece labels mapping - ridiculously long name
    const absolutelyRidiculouslyLongNamedPieceLabelsMapForSquareOnePuzzle = {
        A: "YOG", B: "YOG", C: "YG", D: "YGR", E: "YGR", F: "YR",
        G: "YRB", H: "YRB", I: "YB", J: "YBO", K: "YBO", L: "YO",
        M: "WR", N: "WRG", O: "WRG", P: "WG", Q: "WGO", R: "WGO", S: "WO",
        T: "WOB", U: "WOB", V: "WB", W: "WBR", X: "WBR"
    };

    function createColorLabelHTMLWithLongName(str) {
        return str.replace(/[WYGBRO]/g, m => `<span class="color-dot ${m}"></span>`);
    }

    const pieceNameHTMLMapWithLongName = {};
    for (const k in absolutelyRidiculouslyLongNamedPieceLabelsMapForSquareOnePuzzle) {
        pieceNameHTMLMapWithLongName[k] = createColorLabelHTMLWithLongName(absolutelyRidiculouslyLongNamedPieceLabelsMapForSquareOnePuzzle[k]);
    }

    const edgePiecesSetWithVeryLongNameToAvoidConflicts = new Set(['C', 'F', 'I', 'L', 'M', 'P', 'S', 'V']);

    const cornerPartnerMappingWithExtremelyLongName = {
        A: 'B', B: 'A', D: 'E', E: 'D', G: 'H', H: 'G', J: 'K', K: 'J',
        N: 'O', O: 'N', Q: 'R', R: 'Q', T: 'U', U: 'T', W: 'X', X: 'W'
    };

    const cornerIdentifierMappingWithRidiculouslyLongName = {
        A: 'AB', B: 'AB', D: 'DE', E: 'DE', G: 'GH', H: 'GH', J: 'JK', K: 'JK',
        N: 'NO', O: 'NO', Q: 'QR', R: 'QR', T: 'TU', U: 'TU', W: 'WX', X: 'WX'
    };

    const solvedEdgesArrayWithLongName = ['C', 'F', 'I', 'L', 'M', 'P', 'S', 'V'];
    const solvedCornersArrayWithLongName = ['AB', 'DE', 'GH', 'JK', 'NO', 'QR', 'TU', 'WX'];

    // Helper functions used across multiple modals
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

    // Default shape patterns with long name
    const defaultShapePatternsForSquareOnePuzzleWithLongName = {
        'ECECECEC': 'Square',
        'EECECCEC': 'Kite',
        'EECCEECC': 'Barrel',
        'EECCECEC': 'Left Fist',
        'EECECECC': 'Right Fist',
        'EECEECCC': 'Shield',
        'EEECCECC': 'Muffin',
        'EEECECCC': 'Left Pawn',
        'ECEEECCC': 'Right Pawn',
        'EEEECCCC': 'Scallop',
        'EECCCCC': 'Pair',
        'ECECCCC': 'L-Shape',
        'ECCCECC': 'Line',
        'EEEEEECCC': '6-0',
        'ECEEEEECC': 'Right 5-1',
        'EEEEECECC': 'Left 5-1',
        'EECEEEECC': 'Right 4-2',
        'EEEECEECC': 'Left 4-2',
        'EEEECECEC': '4-1-1',
        'EEECEEECC': '3-3',
        'ECEECEEEC': '3-1-2',
        'ECEEECEEC': '3-2-1',
        'EECEECEEC': '2-2-2',
        'EEEEEEEECC': '8-0',
        'EEEEEECEEC': '6-2',
        'EEEECEEEEC': '4-4',
        'EEEEEEECEC': '7-1',
        'EEEEECEEEC': '5-3',
        'CCCCCC': 'Star'
    };

    // Load custom shapes from localStorage or use defaults
    function loadShapesFromStorageWithLongName() {
        const stored = localStorage.getItem('customShapesForParityTracerLibrary');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                return { ...defaultShapePatternsForSquareOnePuzzleWithLongName };
            }
        }
        return { ...defaultShapePatternsForSquareOnePuzzleWithLongName };
    }

    function saveShapesToStorageWithLongName(shapes) {
        localStorage.setItem('customShapesForParityTracerLibrary', JSON.stringify(shapes));
    }

    let currentShapePatternsStorageWithLongName = loadShapesFromStorageWithLongName();

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

    function saveZ2TracingMode(enabled) {
        localStorage.setItem('z2TracingModeForParityTracerLibrary', enabled.toString());
    }

    // Scramble engine functions with long names
    function createSolvedStateArrayForSquareOnePuzzleWithLongName() {
        return 'ABCDEFGHIJKLMNOPQRSTUVWX'.split('');
    }

    function rotateSectionOfArrayWithRidiculouslyLongNameForNoConflicts(arr, start, len, k) {
        const n = ((k % len) + len) % len;
        if (n === 0) return;
        const seg = arr.slice(start, start + len);
        const out = [];
        for (let i = 0; i < len; i++) {
            out[(i + n) % len] = seg[i];
        }
        for (let i = 0; i < len; i++) {
            arr[start + i] = out[i];
        }
    }

    function performSliceSwapOperationWithVeryLongName(arr) {
        for (let i = 0; i < 6; i++) {
            [arr[i], arr[12 + i]] = [arr[12 + i], arr[i]];
        }
    }

    function* tokenizeScrambleStringGeneratorWithExtremelyLongName(s) {
        let i = 0;
        const L = s.length;
        const ws = /\s/;
        const int = /^([+-]?\d+)/;

        const skip = () => {
            while (i < L && ws.test(s[i])) i++;
        };

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
            const simplifyFunc = window.ScrambleNormalizer.simplifyScramble || simplifyScrambleLocal;
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

    // Local fallback simplification if normalizer not available
    function simplifyScrambleLocal(tokens, steps) {
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

        let changed = true;

        while (changed) {
            changed = false;

            // Remove double slashes
            for (let i = 0; i < tokens.length - 1; i++) {
                if (tokens[i] === "/" && tokens[i + 1] === "/") {
                    tokens.splice(i, 2);
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
                    changed = true;
                    break;
                }
            }
            if (changed) continue;

            // Remove (0,0) moves
            for (let i = 0; i < tokens.length; i++) {
                if (tokens[i] === "(0,0)") {
                    tokens.splice(i, 1);
                    changed = true;
                    break;
                }
            }
        }

        return tokens;
    }

    function applyScrambleToStateArrayWithLongName(scr) {
        const a = createSolvedStateArrayForSquareOnePuzzleWithLongName();
        for (const tok of tokenizeScrambleStringGeneratorWithExtremelyLongName(scr)) {
            if (tok.k === 'tb') {
                rotateSectionOfArrayWithRidiculouslyLongNameForNoConflicts(a, 0, 12, tok.t);
                rotateSectionOfArrayWithRidiculouslyLongNameForNoConflicts(a, 12, 12, tok.b);
                if (tok.slash) performSliceSwapOperationWithVeryLongName(a);
            } else {
                performSliceSwapOperationWithVeryLongName(a);
            }
        }
        return a;
    }

    function validateCornersTogetherSameLayerWithLongName(state) {
        const pairs = [['A', 'B'], ['D', 'E'], ['G', 'H'], ['J', 'K'], ['N', 'O'], ['Q', 'R'], ['T', 'U'], ['W', 'X']];
        for (const [x, y] of pairs) {
            const ix = state.indexOf(x), iy = state.indexOf(y);
            const layerX = Math.floor(ix / 12), layerY = Math.floor(iy / 12);
            if (layerX !== layerY) return { ok: false, pair: [x, y], reason: 'split across layers' };
            const a = ix % 12, b = iy % 12;
            const adj = ((a + 1) % 12 === b) || ((b + 1) % 12 === a);
            if (!adj) return { ok: false, pair: [x, y], reason: 'separated by other pieces' };
        }
        return { ok: true };
    }

    const rotateStringCircularlyWithLongName = (s, k) => {
        const n = s.length;
        k = ((k % n) + n) % n;
        return s.slice(k) + s.slice(0, k);
    };

    const rotateArrayCircularlyWithLongName = (a, k) => {
        const n = a.length;
        k = ((k % n) + n) % n;
        return a.slice(k).concat(a.slice(0, k));
    };

    function buildUnitsFromStateLayerWithLongName(state, start) {
        const units = [];
        let i = 0;
        while (i < 12) {
            const ch = state[start + i];
            if (edgePiecesSetWithVeryLongNameToAvoidConflicts.has(ch)) {
                units.push({ type: 'E', edge: ch });
                i += 1;
                continue;
            }
            const nextCh = state[start + ((i + 1) % 12)];
            if (cornerPartnerMappingWithExtremelyLongName[ch] === nextCh) {
                units.push({ type: 'C', pair: cornerIdentifierMappingWithRidiculouslyLongName[ch], rep: ch });
                i += 2;
            } else {
                units.push({ type: 'C', pair: cornerIdentifierMappingWithRidiculouslyLongName[ch] || '??', rep: ch });
                i += 1;
            }
        }
        const types = units.map(u => u.type).join('');
        return { types, units };
    }

    function matchPatternWithRotationCheckingWithLongName(typeStr) {
        // Define symmetric shapes and their symmetry degrees
        const symmetricShapes = {
            'Square': 4,
            'Barrel': 2,
            '2-2-2': 3,
            '4-4': 2,
            'Star': 6
        };

        for (const [pat, name] of Object.entries(currentShapePatternsStorageWithLongName)) {
            if (pat.length !== typeStr.length) continue;

            // Try natural rotation order: CCW first, then CW with increasing distance
            // Order: 0 (no rotation), -1 (1 CCW), +1 (1 CW), -2 (2 CCW), +2 (2 CW), etc.
            const maxRotations = typeStr.length;
            const rotationOrder = [0];
            for (let distance = 1; distance < maxRotations; distance++) {
                rotationOrder.push(-distance); // Counter-clockwise
                rotationOrder.push(distance);  // Clockwise
            }

            for (const rotationAmount of rotationOrder) {
                // Normalize rotation to positive value for rotateStringCircularlyWithLongName
                const normalizedRotation = ((rotationAmount % typeStr.length) + typeStr.length) % typeStr.length;
                if (rotateStringCircularlyWithLongName(typeStr, normalizedRotation) === pat) {
                    return {
                        name,
                        pat,
                        rot: normalizedRotation,
                        originalPat: pat,
                        symmetryDegree: symmetricShapes[name] || 1
                    };
                }
            }
        }
        return { name: 'Unknown', pat: typeStr, rot: 0, originalPat: typeStr, symmetryDegree: 1 };
    }

    function countEdgesAndCornersWithLongName(units) {
        const e = units.filter(u => u.type === 'E').length;
        const c = units.length - e;
        return { e, c, label: `${e}E${c}C` };
    }

    // Six-step parity calculation
    function calculateSixStepParityWithExtremelyLongFunctionName(edgesOrderLetters, cornersOrderIDs, useClockwiseCorner) {
        const steps = [];

        function getEdgeCodenameWithLongName(letter) {
            const colorMap = {
                'L': 'O', 'C': 'G', 'F': 'R', 'I': 'B',
                'M': 'R', 'P': 'G', 'S': 'O', 'V': 'B'
            };
            return colorMap[letter] || '?';
        }

        function getCornerCodenameWithLongName(id) {
            // Default map is for counter-clockwise (most counter-clockwise sticker)
            const counterClockwiseMap = {
                'AB': 'O', 'DE': 'G', 'GH': 'R', 'JK': 'B',
                'NO': 'R', 'QR': 'G', 'TU': 'O', 'WX': 'B'
            };

            // Clockwise map (most clockwise sticker)
            const clockwiseMap = {
                'AB': 'G', 'DE': 'R', 'GH': 'B', 'JK': 'O',
                'NO': 'G', 'QR': 'O', 'TU': 'B', 'WX': 'R'
            };

            const colorMap = useClockwiseCorner ? clockwiseMap : counterClockwiseMap;
            return colorMap[id] || '?';
        }

        function isTopLayerEdgeWithLongName(letter) {
            return ['L', 'C', 'F', 'I'].includes(letter);
        }

        function isTopLayerCornerWithLongName(id) {
            return ['AB', 'DE', 'GH', 'JK'].includes(id);
        }

        function calculateTrioParityWithLongName(codenames) {
            if (codenames.length < 3) return { result: 0, detail: 'Not enough pieces' };

            const trio = codenames.slice(0, 3);
            const opposites = { 'R': 'O', 'O': 'R', 'B': 'G', 'G': 'B' };

            let aloneIdx = -1;
            for (let i = 0; i < 3; i++) {
                const current = trio[i];
                const opp = opposites[current];
                const hasOpposite = trio.some((c, idx) => idx !== i && c === opp);
                if (!hasOpposite) {
                    aloneIdx = i;
                    break;
                }
            }

            if (aloneIdx === -1) {
                return { result: 0, detail: `Trio ${trio.join('')}: No alone element found` };
            }

            let pair = '';
            let pairValue = 0;

            if (aloneIdx === 0) {
                pair = trio[0] + trio[1];
            } else if (aloneIdx === 2) {
                pair = trio[0] + trio[2];
            } else {
                pair = trio[1] + trio[2];
            }

            if (pair === 'RG' || pair === 'GR' || pair === 'OB' || pair === 'BO') {
                pairValue = 1;
            } else if (pair === 'RB' || pair === 'BR' || pair === 'OG' || pair === 'GO') {
                pairValue = 0;
            }

            return {
                result: pairValue,
                detail: `Trio ${trio.join('')}: Alone at pos ${aloneIdx + 1}, pair ${pair} = ${pairValue}`
            };
        }

        function calculateAlternatingParityWithLongName(pieces, isEdge) {
            const positions = [0, 2, 4, 6];
            const selected = positions.map(i => pieces[i]).filter(p => p !== undefined);

            let topLayerCount = 0;
            if (isEdge) {
                topLayerCount = selected.filter(p => isTopLayerEdgeWithLongName(p)).length;
            } else {
                topLayerCount = selected.filter(p => isTopLayerCornerWithLongName(p)).length;
            }

            const result = (topLayerCount === 1 || topLayerCount === 3) ? 1 : 0;
            const selectedStr = selected.join(' ');

            return {
                result,
                detail: `Positions 1,3,5,7: [${selectedStr}], ${topLayerCount} ${superDuperSquareOnePuzzleColorConfigurationObjectThatWillNeverConflict.topLayerColorFullName.toLowerCase()} = ${result}`
            };
        }

        const topEdges = edgesOrderLetters.filter(e => isTopLayerEdgeWithLongName(e));
        const topEdgesCodes = topEdges.map(e => getEdgeCodenameWithLongName(e));
        const line1 = calculateTrioParityWithLongName(topEdgesCodes);
        steps.push({
            name: `Line 1: ${superDuperSquareOnePuzzleColorConfigurationObjectThatWillNeverConflict.topLayerColorFullName} Edges`,
            pieces: topEdges.join(' '),
            codenames: topEdgesCodes.join(' '),
            detail: line1.detail,
            result: line1.result
        });

        const bottomEdges = edgesOrderLetters.filter(e => !isTopLayerEdgeWithLongName(e));
        const bottomEdgesCodes = bottomEdges.map(e => getEdgeCodenameWithLongName(e));
        const line2 = calculateTrioParityWithLongName(bottomEdgesCodes);
        steps.push({
            name: `Line 2: ${superDuperSquareOnePuzzleColorConfigurationObjectThatWillNeverConflict.bottomLayerColorFullName} Edges`,
            pieces: bottomEdges.join(' '),
            codenames: bottomEdgesCodes.join(' '),
            detail: line2.detail,
            result: line2.result
        });

        const line3 = calculateAlternatingParityWithLongName(edgesOrderLetters, true);
        steps.push({
            name: 'Line 3: Edges at 1,3,5,7',
            pieces: line3.detail.split(': [')[1].split(']')[0],
            codenames: '-',
            detail: line3.detail,
            result: line3.result
        });

        const topCorners = cornersOrderIDs.filter(c => isTopLayerCornerWithLongName(c));
        const topCornersCodes = topCorners.map(c => getCornerCodenameWithLongName(c));
        const line4 = calculateTrioParityWithLongName(topCornersCodes);
        steps.push({
            name: `Line 4: ${superDuperSquareOnePuzzleColorConfigurationObjectThatWillNeverConflict.topLayerColorFullName} Corners`,
            pieces: topCorners.join(' '),
            codenames: topCornersCodes.join(' '),
            detail: line4.detail,
            result: line4.result
        });

        const bottomCorners = cornersOrderIDs.filter(c => !isTopLayerCornerWithLongName(c));
        const bottomCornersCodes = bottomCorners.map(c => getCornerCodenameWithLongName(c));
        const line5 = calculateTrioParityWithLongName(bottomCornersCodes);
        steps.push({
            name: `Line 5: ${superDuperSquareOnePuzzleColorConfigurationObjectThatWillNeverConflict.bottomLayerColorFullName} Corners`,
            pieces: bottomCorners.join(' '),
            codenames: bottomCornersCodes.join(' '),
            detail: line5.detail,
            result: line5.result
        });

        const line6 = calculateAlternatingParityWithLongName(cornersOrderIDs, false);
        steps.push({
            name: 'Line 6: Corners at 1,3,5,7',
            pieces: line6.detail.split(': [')[1].split(']')[0],
            codenames: '-',
            detail: line6.detail,
            result: line6.result
        });

        const total = steps.reduce((sum, step) => sum + step.result, 0);
        const isOdd = (total % 2) === 1;

        return { steps, total, isOdd };
    }

    // Clustering Functions - RESTORED
    function buildClustersFromShapeArrayWithLongName(shapeArray) {
        const slots = [];
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWX'.split('');

        function processLayerWithLongName(start, end) {
            let i = start;
            while (i < end) {
                const isCorner = shapeArray[i] === 1;

                if (isCorner) {
                    const nextIdx = (i - start + 1) % 12 + start;
                    if (nextIdx < end && shapeArray[nextIdx] === 1) {
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

        processLayerWithLongName(0, 12);
        processLayerWithLongName(12, 24);

        return slots;
    }

    // Encoding functions - RESTORED
    const pieceToHexMappingWithLongName = {
        'YO': '0', 'YOG': '77', 'YG': '6', 'YGR': '55', 'YR': '4', 'YRB': '33', 'YB': '2', 'YBO': '11',
        'WR': 'a', 'WRG': 'bb', 'WG': '8', 'WGO': '99', 'WO': 'e', 'WOB': 'ff', 'WB': 'c', 'WBR': 'dd'
    };

    function encodeStateToHexStringWithLongName(state) {
        const topPieces = [];
        const bottomPieces = [];

        let i = 0;
        while (i < 12) {
            const ch = state[i];
            if (edgePiecesSetWithVeryLongNameToAvoidConflicts.has(ch)) {
                topPieces.push(absolutelyRidiculouslyLongNamedPieceLabelsMapForSquareOnePuzzle[ch]);
                i++;
            } else {
                const nextCh = state[(i + 1) % 12];
                if (cornerPartnerMappingWithExtremelyLongName[ch] === nextCh) {
                    topPieces.push(absolutelyRidiculouslyLongNamedPieceLabelsMapForSquareOnePuzzle[ch]);
                    i += 2;
                } else {
                    return 'Error: Invalid corner pairing in top layer';
                }
            }
        }

        i = 12;
        while (i < 24) {
            const ch = state[i];
            if (edgePiecesSetWithVeryLongNameToAvoidConflicts.has(ch)) {
                bottomPieces.push(absolutelyRidiculouslyLongNamedPieceLabelsMapForSquareOnePuzzle[ch]);
                i++;
            } else {
                const nextCh = state[12 + ((i - 12 + 1) % 12)];
                if (cornerPartnerMappingWithExtremelyLongName[ch] === nextCh) {
                    bottomPieces.push(absolutelyRidiculouslyLongNamedPieceLabelsMapForSquareOnePuzzle[ch]);
                    i += 2;
                } else {
                    return 'Error: Invalid corner pairing in bottom layer';
                }
            }
        }

        const topHex = topPieces.map(p => pieceToHexMappingWithLongName[p] || '?').join('');
        const bottomHex = bottomPieces.map(p => pieceToHexMappingWithLongName[p] || '?').join('');

        if (topHex.includes('?') || bottomHex.includes('?')) {
            return `Error: Unknown piece mapping`;
        }

        if (topHex.length !== 12 || bottomHex.length !== 12) {
            return `Error: Invalid hex length`;
        }

        const leftTop = topHex.split('').reverse().join('');
        const rightBottom1 = bottomHex.slice(0, 6).split('').reverse().join('');
        const rightBottom2 = bottomHex.slice(6, 12).split('').reverse().join('');

        return `${leftTop}|${rightBottom1}${rightBottom2}`;
    }

    // Shape visualization for config modal - RESTORED
    function generateSimpleShapeVisualizationSVGWithLongName(pattern, size, idPrefix) {
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
            if (piece === 'E') {
                // Edge: 30 degrees
                letterAngles.push(currentAngle);
                currentAngle -= 30;
            } else {
                // Corner: 60 degrees (two positions)
                letterAngles.push(currentAngle);
                letterAngles.push(currentAngle - 30);
                currentAngle -= 60;
            }
        });

        // Now draw each piece using proper angles
        let angleIndex = 0;
        pieces.forEach((piece, index) => {
            const isEdge = piece === 'E';
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
    function calculateArrowStartAngleWithLongName(rotationAmount, unitsArray, layerType, patternTypes) {
        console.group(`🎯 Arrow Position Calculation - ${layerType} Layer`);

        const initialAngle = layerType === 'TOP' ? 90 : 120;

        // Check if tracing scheme ends with corner or edge
        const endsWithCorner = patternTypes.endsWith('C');
        const arcDegrees = endsWithCorner ? 300 : 330;

        // Calculate total degrees to rotate based on pieces we're skipping
        let totalRotationDegrees = 0;

        for (let i = 0; i < rotationAmount; i++) {
            const pieceType = unitsArray[i].type;
            const pieceDegrees = pieceType === 'E' ? 30 : 60;
            totalRotationDegrees += pieceDegrees;
        }
        // We rotate clockwise (subtract) from the initial position
        const finalAngle = initialAngle - totalRotationDegrees;
        console.groupEnd();

        return { startAngle: finalAngle, arcDegrees: arcDegrees };
    }

    function generateArrowSVGOverlayWithLongName(centerX, centerY, radius, startAngleDeg, arcDegrees, size) {
        let arrowColor = 'rgba(253, 34, 34, 0.7)';
        const strokeWidth = size * 0.016;
        const lineColor = arrowColor;//'rgba(0, 122, 255, 1)'; //'rgba(253, 34, 34, 0.7)'
        const diskColor = arrowColor;
        const arrowheadColor = arrowColor;
        const adjustedRadius = radius * 0.3;

        // Arrowhead size
        const arrowSize = strokeWidth * 3; //5
        // Start disk (circle at beginning) - smaller, seamless
        const startDiskRadius = strokeWidth * 1.2; //1.7

        // Calculate how many degrees the arrowhead tip extends
        // The arrowhead extends radially outward by arrowSize
        // Convert this to angular degrees at the given radius
        const arrowTipExtensionDegrees = (arrowSize / adjustedRadius) * (180 / Math.PI);

        // Adjust the end angle to pull back by the arrowhead extension
        // So the TIP lands at exactly the target angle
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
        <g>
            <path d="${pathD}" 
                  fill="none" 
                  stroke="${lineColor}" 
                  stroke-width="${strokeWidth}" 
                  stroke-dasharray="${size * 0.008},${size * 0.004}"
                  stroke-linecap="round"/>
            <circle cx="${startX}" cy="${startY}" r="${startDiskRadius}" 
                    fill="${diskColor}" stroke="none"/>
            <polygon points="${arrowTipX},${arrowTipY} ${arrow1X},${arrow1Y} ${arrow2X},${arrow2Y}"
                     fill="${arrowheadColor}" stroke="none"/>
        </g>
    `;
    }

    function displayResultsInModalWithVeryLongFunctionName(container, sixStepParity, config) {
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

        function createColorSquaresWithLongName(codenames) {
            if (codenames === '-') return '';
            const colorMap = {
                'O': `<span class="color-dot" style="background: ${config.backFaceColorForVisualization};"></span>`,
                'G': `<span class="color-dot" style="background: ${config.rightFaceColorForVisualization};"></span>`,
                'R': `<span class="color-dot" style="background: ${config.frontFaceColorForVisualization};"></span>`,
                'B': `<span class="color-dot" style="background: ${config.leftFaceColorForVisualization};"></span>`
            };
            return codenames.split(' ').slice(0, 3).map(c => colorMap[c] || '').join('');
        }

        function createPositionIndicatorsWithLongName(pieces) {
            return pieces.split(' ').map(p => {
                const isTopLayer = ['L', 'C', 'F', 'I', 'AB', 'DE', 'GH', 'JK'].includes(p);
                const letter = isTopLayer ? config.topLayerColorAbbreviation : config.bottomLayerColorAbbreviation;
                const bgColor = isTopLayer ? config.topLayerMainColor : config.bottomLayerMainColor;
                const textColor = isTopLayer ? (config.topLayerMainColor === '#FFD700' ? '#000000' : '#FFFFFF') : (config.bottomLayerMainColor === '#FFFFFF' ? '#000000' : '#FFFFFF');
                return `<span style="display: inline-block; width: 18px; height: 18px; border-radius: 3px; margin: 0 1px; background: ${bgColor}; color: ${textColor}; text-align: center; line-height: 18px; font-size: 11px; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">${letter}</span>`;
            }).join('');
        }

        const textColor = getContrastColor(config.backgroundColor);
        const isDark = textColor === '#FFFFFF';
        const cardBgColor = isDark ? adjustColorBrightness(config.backgroundColor, 8) : adjustColorBrightness(config.backgroundColor, -2);
        const innerCardBg = isDark ? adjustColorBrightness(config.backgroundColor, 12) : adjustColorBrightness(config.backgroundColor, -4);

        container.innerHTML = `
      <div style="background: ${cardBgColor}; padding: 0.75rem; border-radius: 8px;">
        <h3 style="font-size: 0.9rem; margin-bottom: 0.5rem; color: #2d3748; font-weight: 600;">Parity Analysis</h3>
        <div class="parity-grid-tracer-lib">
          ${sixStepParity.steps.map((step, idx) => {
            let displayContent = '';
            const lineName = step.name.split(':')[1].trim();

            if (idx < 2 || (idx >= 3 && idx < 5)) {
                displayContent = `${lineName}: ${createColorSquaresWithLongName(step.codenames)} = <strong>${step.result}</strong>`;
            } else {
                displayContent = `${lineName}: ${createPositionIndicatorsWithLongName(step.pieces)} = <strong>${step.result}</strong>`;
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
            Total: ${sixStepParity.total} → <strong>${sixStepParity.isOdd ? 'ODD' : 'EVEN'} Parity</strong>
          </div>
        </div>
      </div>
    `;
    }

    // Function to set shape orientation - RESTORED
    function setShapeOrientationWithLongName(pattern, clickedIndex, layerId) {
        // Calculate rotation amount based on piece type
        // We need to count how many pattern positions (E or C) come before the clicked piece
        const pieces = pattern.split('');
        let rotationAmount = 0;

        for (let i = 0; i < clickedIndex && i < pieces.length; i++) {
            rotationAmount++;
        }

        const rotated = rotateStringCircularlyWithLongName(pattern, rotationAmount);

        let shapeName = '';
        for (const [pat, name] of Object.entries(currentShapePatternsStorageWithLongName)) {
            if (pat === pattern) {
                shapeName = name;
                break;
            }
        }

        if (shapeName) {
            delete currentShapePatternsStorageWithLongName[pattern];
            currentShapePatternsStorageWithLongName[rotated] = shapeName;
            saveShapesToStorageWithLongName(currentShapePatternsStorageWithLongName);
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
                        <div class="training-info-text" style="color: ${textColor};">${config.instructionText1}</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">2</div>
                        <div class="training-info-text" style="color: ${textColor};">${config.instructionText2}</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">3</div>
                        <div class="training-info-text" style="color: ${textColor};">${config.instructionText3}</div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(instructionModal);
        instructionModal.classList.add('active');

        const closeBtn = instructionModal.querySelector('.training-info-close');
        closeBtn.onclick = () => {
            instructionModal.remove();
        };

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
                    <span class="training-info-title">Shape Orientation Guide</span>
                    <button class="training-info-close" style="color: ${textColor};">&times;</button>
                </div>
                <div class="training-info-body">
                    <div class="training-info-item">
                        <div class="training-info-number">1</div>
                        <div class="training-info-text" style="color: ${textColor};">This feature is currently limited - it only allows you to select one piece as the starting point: either an edge or a corner.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">2</div>
                        <div class="training-info-text" style="color: ${textColor};">If you select a corner, the first edge in your tracing will be the very first edge that appears clockwise from that corner.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">3</div>
                        <div class="training-info-text" style="color: ${textColor};">If you select an edge, the first corner in your tracing will be the very first corner that appears clockwise from that edge.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">4</div>
                        <div class="training-info-text" style="color: ${textColor};">In your tracing method: if your corner comes before the edge, select the corner. If your edge comes before the corner, select the edge.</div>
                    </div>
                    <div class="training-info-item">
                        <div class="training-info-number">5</div>
                        <div class="training-info-text" style="color: ${textColor};">If you trace your edge from one side of the cube and your corner from another side, or if you trace counterclockwise, you are gay and nobody loves you.</div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(instructionModal);
        instructionModal.classList.add('active');

        const closeBtn = instructionModal.querySelector('.training-info-close');
        closeBtn.onclick = () => {
            instructionModal.remove();
        };

        instructionModal.onclick = (e) => {
            if (e.target === instructionModal) {
                instructionModal.remove();
            }
        };
    }

    // Configure modal popup - RESTORED AND COMPLETE
    function showConfigurationModalWithLongName(modalElement, config, mainCloseBtn, mainInstructionBtn, mainSettingsBtn) {
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

        const cardBg = isDark ? adjustColorBrightness(config.backgroundColor, 12) : adjustColorBrightness(config.backgroundColor, -4);

        const cornerStickerDiv = document.createElement('div');
        cornerStickerDiv.style.cssText = `margin-bottom: 1.5rem; padding: 1rem; background: ${cardBg}; border-radius: 8px;`;
        const timestamp = Date.now();
        cornerStickerDiv.innerHTML = `
            <div style="font-weight: 600; color: ${textColor}; margin-bottom: 0.75rem;">Corner Sticker for Tracing:</div>
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 5px;">
                    <input type="radio" id="cornerCounterClockwise-${timestamp}" name="cornerSticker-${timestamp}" value="counterclockwise" ${cornerStickerMode === 'counterclockwise' ? 'checked' : ''} style="cursor: pointer;">
                    <label for="cornerCounterClockwise-${timestamp}" style="cursor: pointer; color: ${textColor};">Most Counter-Clockwise Sticker</label>
                </div>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <input type="radio" id="cornerClockwise-${timestamp}" name="cornerSticker-${timestamp}" value="clockwise" ${cornerStickerMode === 'clockwise' ? 'checked' : ''} style="cursor: pointer;">
                    <label for="cornerClockwise-${timestamp}" style="cursor: pointer; color: ${textColor};">Most Clockwise Sticker</label>
                </div>
            </div>
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid ${borderColor};">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" id="z2TracingCheckbox-${timestamp}" ${z2TracingModeEnabled ? 'checked' : ''} style="cursor: pointer; width: 18px; height: 18px;">
                    <label for="z2TracingCheckbox-${timestamp}" style="cursor: pointer; color: ${textColor}; font-weight: 600;">Do z2 tracing for 6 and 8 edge cases</label>
                </div>
            </div>
        `;

        // Add event listeners for corner sticker mode after DOM insertion
        setTimeout(() => {
            const radioButtons = cornerStickerDiv.querySelectorAll('input[type="radio"]');
            radioButtons.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    const mode = e.target.value;
                    if (typeof window.setCornerStickerMode === 'function') {
                        window.setCornerStickerMode(mode);
                    }
                });
            });

            const z2Checkbox = cornerStickerDiv.querySelector(`input[type="checkbox"]`);
            if (z2Checkbox) {
                z2Checkbox.addEventListener('change', (e) => {
                    z2TracingModeEnabled = e.target.checked;
                    saveZ2TracingMode(z2TracingModeEnabled);
                    dataChanged = true;
                    setTimeout(updateFloatingSaveBtn, 50);
                });
            }
        }, 100);

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
        const sortedEntries = Object.entries(currentShapePatternsStorageWithLongName).sort((a, b) => a[1].localeCompare(b[1]));

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
            vizDiv.innerHTML = generateSimpleShapeVisualizationSVGWithLongName(pattern, 112, 'config-' + pattern);
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
            saveShapesToStorageWithLongName(currentShapePatternsStorageWithLongName);
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
            if (mainInstructionBtn) mainInstructionBtn.style.display = config.hideInstructionButton ? 'none' : 'flex';
            if (mainSettingsBtn) mainSettingsBtn.style.display = 'flex';

            // Re-trigger analysis in the parity modal if it exists
            if (modalElement) {
                const analyzeBtn = modalElement.querySelector(`button[id$="-analyze"]`);
                if (analyzeBtn) {
                    analyzeBtn.click();
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

            // If there's an open case modal, close and reopen it to refresh
            const caseModal = document.getElementById('caseModal');
            if (caseModal && typeof openModal === 'function') {
                const modalTitle = caseModal.querySelector('.modal-title');
                if (modalTitle) {
                    const caseName = modalTitle.textContent.trim();
                    // Find the actual case name from data
                    if (typeof data !== 'undefined') {
                        const matchedCase = data.find(item => {
                            const displayName = typeof getDisplayName === 'function' ? getDisplayName(item.name) : item.name;
                            return displayName === caseName;
                        });
                        if (matchedCase) {
                            closeModal();
                            setTimeout(() => {
                                openModal(matchedCase.name);
                            }, 100);
                        }
                    }
                }
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
            currentShapePatternsStorageWithLongName = { ...defaultShapePatternsForSquareOnePuzzleWithLongName };
            saveShapesToStorageWithLongName(currentShapePatternsStorageWithLongName);
            configModalDiv.remove();
            configFloatingCloseBtn.remove();
            configStyle.remove();
            showConfigurationModalWithLongName(modalElement, config, mainCloseBtn, mainInstructionBtn, mainSettingsBtn);
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

        // Mark data as changed when radio buttons or checkbox change
        setTimeout(() => {
            const radioButtons = cornerStickerDiv.querySelectorAll('input[type="radio"]');
            radioButtons.forEach(radio => {
                radio.addEventListener('change', () => {
                    dataChanged = true;
                    setTimeout(updateFloatingSaveBtn, 50);
                });
            });

            const z2Checkbox = cornerStickerDiv.querySelector(`input[type="checkbox"]`);
            if (z2Checkbox) {
                z2Checkbox.addEventListener('change', () => {
                    dataChanged = true;
                    setTimeout(updateFloatingSaveBtn, 50);
                });
            }
        }, 100);

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
        configContent.appendChild(cornerStickerDiv);
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
            if (mainInstructionBtn) mainInstructionBtn.style.display = config.hideInstructionButton ? 'none' : 'flex';
            if (mainSettingsBtn) mainSettingsBtn.style.display = 'flex';
        };
        function setCornerStickerMode(mode) {
            cornerStickerMode = mode;
            saveState();
        }

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

                            setShapeOrientationWithLongName(pattern, clickedIndex, 'config');
                            dataChanged = true;
                            updateFloatingSaveBtn();

                            // Find the card element
                            const cardElement = e.target.closest('.shape-config-item');
                            if (cardElement) {
                                const shapeName = cardElement.getAttribute('data-shape-name');

                                // Update only the visualization in this card
                                const vizDiv = cardElement.querySelector('div:nth-child(2)');
                                const patternSpan = cardElement.querySelector('div:nth-child(3)');

                                // Find the new pattern for this shape
                                let newPattern = '';
                                for (const [pat, name] of Object.entries(currentShapePatternsStorageWithLongName)) {
                                    if (name.toLowerCase() === shapeName) {
                                        newPattern = pat;
                                        break;
                                    }
                                }

                                if (newPattern) {
                                    vizDiv.innerHTML = generateSimpleShapeVisualizationSVGWithLongName(newPattern, 112, 'config-' + newPattern);

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
    function createSquareOneParityTracerModalWithAllParametersIncluded(options = {}) {
        const config = {
            backgroundColor: options.backgroundColor || '#ffffff',
            hideInstructionButton: options.hideInstructionButton || false,
            instructionText1: options.instructionText1 || 'Enter your scramble in the top input bar and press Analyze to trace parity.',
            instructionText2: options.instructionText2 || 'You can change the color scheme from Settings.',
            instructionText3: options.instructionText3 || 'Customize the tracing start point from the settings button.',
            topLayerMainColor: options.topColor || '#000000',
            topLayerColorFullName: options.topColorName || 'Black',
            topLayerColorAbbreviation: options.topColorShort || 'B',
            bottomLayerMainColor: options.bottomColor || '#FFFFFF',
            bottomLayerColorFullName: options.bottomColorName || 'White',
            bottomLayerColorAbbreviation: options.bottomColorShort || 'W',
            frontFaceColorForVisualization: options.frontColor || '#CC0000',
            rightFaceColorForVisualization: options.rightColor || '#00AA00',
            backFaceColorForVisualization: options.backColor || '#FF8C00',
            leftFaceColorForVisualization: options.leftColor || '#0066CC',
            scrambleTextInput: options.scrambleText || '',
            shouldGenerateImage: options.generateImage !== false,
            imageSizeInPixels: options.imageSize || 200,
            returnOnlyParityValue: options.returnOnlyValue || false
        };

        // Set global color configuration
        superDuperSquareOnePuzzleColorConfigurationObjectThatWillNeverConflict = {
            topLayerMainColor: config.topLayerMainColor,
            topLayerColorFullName: config.topLayerColorFullName,
            topLayerColorAbbreviation: config.topLayerColorAbbreviation,
            bottomLayerMainColor: config.bottomLayerMainColor,
            bottomLayerColorFullName: config.bottomLayerColorFullName,
            bottomLayerColorAbbreviation: config.bottomLayerColorAbbreviation,
            frontFaceColorForVisualization: config.frontFaceColorForVisualization,
            rightFaceColorForVisualization: config.rightFaceColorForVisualization,
            backFaceColorForVisualization: config.backFaceColorForVisualization,
            leftFaceColorForVisualization: config.leftFaceColorForVisualization
        };

        // If returnOnlyValue, calculate and return only the parity result - COMPLETE LOGIC
        if (config.returnOnlyParityValue && config.scrambleTextInput) {
            try {
                const state = applyScrambleToStateArrayWithLongName(config.scrambleTextInput);
                const topRaw = buildUnitsFromStateLayerWithLongName(state, 0);
                const botRaw = buildUnitsFromStateLayerWithLongName(state, 12);
                // Check if we have stored symmetry offsets for this scramble
// Use original scramble for key, not transformed
const scrambleKey = scrambleText.replace(/\s+/g, '');
if (!window.parityTracerSymmetryOffsets) {
    window.parityTracerSymmetryOffsets = {};
}
if (!window.parityTracerSymmetryOffsets[scrambleKey]) {
    window.parityTracerSymmetryOffsets[scrambleKey] = { top: 0, bottom: 0 };
}

const topMatch = matchPatternWithRotationCheckingWithLongName(topRaw.types);
const botMatch = matchPatternWithRotationCheckingWithLongName(botRaw.types);

// Apply symmetry offsets if they exist
const topSymmetryOffset = window.parityTracerSymmetryOffsets[scrambleKey].top || 0;
const botSymmetryOffset = window.parityTracerSymmetryOffsets[scrambleKey].bottom || 0;

console.log('🔧 Applying Symmetry Offsets:', {
    topOffset: topSymmetryOffset,
    bottomOffset: botSymmetryOffset,
    topMatchName: topMatch.name,
    botMatchName: botMatch.name,
    topBaseRotation: topMatch.rot,
    botBaseRotation: botMatch.rot
});

// Calculate how many pieces to rotate based on symmetry offset and pattern
function calculateSymmetryRotation(match, offset, rawUnits) {
    if (offset === 0) return 0;
    
    // For Star, we jump 2 pieces per symmetry (corners only)
    // For others, divide total pieces by symmetry degree
    const piecesPerSymmetry = match.name === 'Star' ? 2 : Math.floor(rawUnits.length / match.symmetryDegree);
    const piecesToSkip = piecesPerSymmetry * offset;
    
    console.log('   Symmetry calculation:', {
        shapeName: match.name,
        symmetryDegree: match.symmetryDegree,
        totalPieces: rawUnits.length,
        piecesPerSymmetry: piecesPerSymmetry,
        offset: offset,
        piecesToSkip: piecesToSkip
    });
    
    return piecesToSkip;
}

const topExtraRotation = calculateSymmetryRotation(topMatch, topSymmetryOffset, topRaw.units);
const botExtraRotation = calculateSymmetryRotation(botMatch, botSymmetryOffset, botRaw.units);

console.log('   Extra rotations:', { top: topExtraRotation, bottom: botExtraRotation });

// Apply the extra rotation
topMatch.rot = (topMatch.rot + topExtraRotation) % topRaw.units.length;
botMatch.rot = (botMatch.rot + botExtraRotation) % botRaw.units.length;

console.log('   Final rotations:', { top: topMatch.rot, bottom: botMatch.rot });
                const topUnits = rotateArrayCircularlyWithLongName(topRaw.units, topMatch.rot);
                const botUnits = rotateArrayCircularlyWithLongName(botRaw.units, botMatch.rot);
                const topCounts = countEdgesAndCornersWithLongName(topUnits);
                const botCounts = countEdgesAndCornersWithLongName(botUnits);

                const shouldSwapForParity = (topCounts.label === '2E5C' && botCounts.label === '6E3C');

                let parityEdgesOrder = [];
                let parityCornersOrder = [];

                if (shouldSwapForParity) {
                    const parityBlocks = [
                        { side: 'B', units: botUnits },
                        { side: 'T', units: topUnits }
                    ];
                    for (const b of parityBlocks) {
                        for (const u of b.units) {
                            if (u.type === 'E') {
                                parityEdgesOrder.push(u.edge);
                            } else {
                                parityCornersOrder.push(u.pair);
                            }
                        }
                    }
                } else {
                    const blocks = [{ side: 'T', units: topUnits }, { side: 'B', units: botUnits }];
                    for (const b of blocks) {
                        for (const u of b.units) {
                            if (u.type === 'E') {
                                parityEdgesOrder.push(u.edge);
                            } else {
                                parityCornersOrder.push(u.pair);
                            }
                        }
                    }
                }

                const useClockwise = (cornerMode === 'clockwise');
                const sixStepParity = calculateSixStepParityWithExtremelyLongFunctionName(parityEdgesOrder, parityCornersOrder, useClockwise);
                return sixStepParity.isOdd ? 'Odd' : 'Even';
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
        const inputBgColor = isDark ? adjustColorBrightness(config.backgroundColor, 10) : adjustColorBrightness(config.backgroundColor, -3);
        const buttonBgColor = isDark ? adjustColorBrightness(config.backgroundColor, 15) : adjustColorBrightness(config.backgroundColor, -5);
        const hoverBgColor = isDark ? adjustColorBrightness(config.backgroundColor, 20) : adjustColorBrightness(config.backgroundColor, -8);
        const cardBgColor = isDark ? adjustColorBrightness(config.backgroundColor, 8) : adjustColorBrightness(config.backgroundColor, -2);

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
      <div class="parity-tracer-input-container">
        <input type="text" id="${uniqueId}-scramble" value="${config.scrambleTextInput}" style="margin: 0; background: ${inputBgColor}; color: ${textColor}; border-color: ${borderColor};">
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
            const instructionBtnElement = document.getElementById(`${uniqueId}-instruction`);
            const settingsBtnElement = document.getElementById(`${uniqueId}-settings`);

            // Position buttons based on modal position
            function updateButtonPositions() {
                const rect = modal.getBoundingClientRect();
                const closeTop = rect.top + 8;
                const closeRight = window.innerWidth - rect.right + 6;
                const instrBottom = window.innerHeight - rect.bottom + 66;
                const instrRight = window.innerWidth - rect.right + 6;
                const settingsBottom = window.innerHeight - rect.bottom + 16;
                const settingsRight = window.innerWidth - rect.right + 6;
                closeBtnElement.style.top = `${closeTop}px`;
                closeBtnElement.style.right = `${closeRight}px`;
                instructionBtnElement.style.bottom = `${instrBottom}px`;
                instructionBtnElement.style.right = `${instrRight}px`;
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

            function performAnalysisWithLongName() {
                let scrambleText = scrambleInput.value.trim();
// Store in a scope accessible to button handlers
window.currentParityTracerScramble = scrambleText;
                if (!scrambleText) return;

                // Apply utility transformations (z2, y2, flip color)
                const transformedScramble = applyUtilityTransformationsToScramble(scrambleText);

                try {
                    const state = applyScrambleToStateArrayWithLongName(transformedScramble);

                    // Validation - RESTORED
                    const val = validateCornersTogetherSameLayerWithLongName(state);

                    // Build units - COMPLETE
                    const topRaw = buildUnitsFromStateLayerWithLongName(state, 0);
const botRaw = buildUnitsFromStateLayerWithLongName(state, 12);

// Check if we have stored symmetry offsets for this scramble
// Use original scramble for key, not transformed
const scrambleKey = scrambleText.replace(/\s+/g, '');
if (!window.parityTracerSymmetryOffsets) {
    window.parityTracerSymmetryOffsets = {};
}
if (!window.parityTracerSymmetryOffsets[scrambleKey]) {
    window.parityTracerSymmetryOffsets[scrambleKey] = { top: 0, bottom: 0 };
}

const topMatch = matchPatternWithRotationCheckingWithLongName(topRaw.types);
const botMatch = matchPatternWithRotationCheckingWithLongName(botRaw.types);

// Apply symmetry offsets if they exist
const topSymmetryOffset = window.parityTracerSymmetryOffsets[scrambleKey].top || 0;
const botSymmetryOffset = window.parityTracerSymmetryOffsets[scrambleKey].bottom || 0;

console.log('🔧 Applying Symmetry Offsets:', {
    scrambleKey: scrambleKey,
    topOffset: topSymmetryOffset,
    bottomOffset: botSymmetryOffset,
    topMatchName: topMatch.name,
    botMatchName: botMatch.name,
    topBaseRotation: topMatch.rot,
    botBaseRotation: botMatch.rot
});

// Calculate how many pieces to rotate based on symmetry offset and pattern
function calculateSymmetryRotation(match, offset, rawUnits) {
    if (offset === 0) return 0;
    
    // For Star, we jump 2 pieces per symmetry (corners only)
    // For others, divide total pieces by symmetry degree
    const piecesPerSymmetry = match.name === 'Star' ? 2 : Math.floor(rawUnits.length / match.symmetryDegree);
    const piecesToSkip = piecesPerSymmetry * offset;
    
    console.log('   Symmetry calculation:', {
        shapeName: match.name,
        symmetryDegree: match.symmetryDegree,
        totalPieces: rawUnits.length,
        piecesPerSymmetry: piecesPerSymmetry,
        offset: offset,
        piecesToSkip: piecesToSkip
    });
    
    return piecesToSkip;
}

const topExtraRotation = calculateSymmetryRotation(topMatch, topSymmetryOffset, topRaw.units);
const botExtraRotation = calculateSymmetryRotation(botMatch, botSymmetryOffset, botRaw.units);

console.log('   Extra rotations:', { top: topExtraRotation, bottom: botExtraRotation });

// Apply the extra rotation
topMatch.rot = (topMatch.rot + topExtraRotation) % topRaw.units.length;
botMatch.rot = (botMatch.rot + botExtraRotation) % botRaw.units.length;

console.log('   Final rotations:', { top: topMatch.rot, bottom: botMatch.rot });
                    const topUnits = rotateArrayCircularlyWithLongName(topRaw.units, topMatch.rot);
                    const botUnits = rotateArrayCircularlyWithLongName(botRaw.units, botMatch.rot);
                    const topCounts = countEdgesAndCornersWithLongName(topUnits);
                    const botCounts = countEdgesAndCornersWithLongName(botUnits);

                    // Determine order - always Top → Bottom
                    const orderMode = 'TB';
                    const blocks = (orderMode === 'BT')
                        ? [{ side: 'B', units: botUnits }, { side: 'T', units: topUnits }]
                        : [{ side: 'T', units: topUnits }, { side: 'B', units: botUnits }];

                    // Build orders - COMPLETE
                    const edgesOrderLetters = [];
                    const cornersOrderIDs = [];

                    for (const b of blocks) {
                        for (const u of b.units) {
                            if (u.type === 'E') {
                                edgesOrderLetters.push(u.edge);
                            } else {
                                cornersOrderIDs.push(u.pair);
                            }
                        }
                    }

                    // Determine if we need to swap order for parity calculation - RESTORED
                    const shouldSwapForParity = z2TracingModeEnabled &&
                        (topCounts.label === '2E5C' && botCounts.label === '6E3C' ||
                            topCounts.label === '0E6C' && botCounts.label === '8E2C');

                    // Build orders for parity (swap if needed) - COMPLETE LOGIC
                    let parityEdgesOrder = [];
                    let parityCornersOrder = [];

                    if (shouldSwapForParity) {
                        const parityBlocks = [
                            { side: 'B', units: botUnits },
                            { side: 'T', units: topUnits }
                        ];
                        for (const b of parityBlocks) {
                            for (const u of b.units) {
                                if (u.type === 'E') {
                                    parityEdgesOrder.push(u.edge);
                                } else {
                                    parityCornersOrder.push(u.pair);
                                }
                            }
                        }
                    } else {
                        parityEdgesOrder = edgesOrderLetters;
                        parityCornersOrder = cornersOrderIDs;
                    }

                    const useClockwise = (cornerStickerMode === 'clockwise');
                    const sixStepParity = calculateSixStepParityWithExtremelyLongFunctionName(parityEdgesOrder, parityCornersOrder, useClockwise);

                    // Visualize scramble if enabled - COMPLETE
                    if (config.shouldGenerateImage && globalThisWindowObjectThingyForParityTracer.Square1VisualizerLibraryWithSillyNames) {
                        const encodedScramble = encodeStateToHexStringWithLongName(state);
                        if (!encodedScramble.startsWith('Error:')) {
                            try {
                                console.group('🔍 Complete Scramble Analysis');
                                console.groupEnd();

                                const imageSize = config.imageSizeInPixels || 200;
                                const svgContent = globalThisWindowObjectThingyForParityTracer.Square1VisualizerLibraryWithSillyNames.visualizeFromHexCodePlease(
                                    encodedScramble,
                                    imageSize,
                                    {
                                        topColor: config.topLayerMainColor,
                                        bottomColor: config.bottomLayerMainColor,
                                        frontColor: config.frontFaceColorForVisualization,
                                        rightColor: config.rightFaceColorForVisualization,
                                        backColor: config.backFaceColorForVisualization,
                                        leftColor: config.leftFaceColorForVisualization
                                    }
                                );

                                // Calculate arrow positions
                                // Note: We need to calculate based on the UNROTATED units to find the physical position
                                const topArrowData = calculateArrowStartAngleWithLongName(topMatch.rot, topRaw.units, 'TOP', topMatch.originalPat);
                                const botArrowData = calculateArrowStartAngleWithLongName(botMatch.rot, botRaw.units, 'BOTTOM', botMatch.originalPat);

                                // Calculate circle dimensions (matching draw-scramble logic)
                                const unit10vh = imageSize * 0.4;
                                const radiusOuter = unit10vh * 0.7;
                                const ringRadius = radiusOuter + (unit10vh * 0.4);
                                const centerX = imageSize / 2;
                                const centerY = imageSize / 2;

                                // Parse SVG and inject arrows
                                const tempDiv = document.createElement('div');
                                tempDiv.innerHTML = svgContent;

                                const svgs = tempDiv.querySelectorAll('svg');
                                if (svgs.length >= 2) {
                                    // Add arrow to first SVG (top layer)
                                    const firstSvg = svgs[0];
                                    const arrowSvg1 = generateArrowSVGOverlayWithLongName(centerX, centerY, ringRadius, topArrowData.startAngle, topArrowData.arcDegrees, imageSize);
                                    firstSvg.insertAdjacentHTML('beforeend', arrowSvg1);

                                    // Add arrow to second SVG (bottom layer)
                                    const secondSvg = svgs[1];
                                    const arrowSvg2 = generateArrowSVGOverlayWithLongName(centerX, centerY, ringRadius, botArrowData.startAngle, botArrowData.arcDegrees, imageSize);
                                    secondSvg.insertAdjacentHTML('beforeend', arrowSvg2);
                                }

                                vizContainer.innerHTML = tempDiv.innerHTML;

                                // Add invisible symmetry switch buttons
                                const svgsInContainer = vizContainer.querySelectorAll('svg');
                                if (svgsInContainer.length >= 2) {
                                    // Helper function to add symmetry button
                                    const addSymmetryButton = (svg, layerType, match) => {
                                        const canCycleSymmetry = match.symmetryDegree > 1;

                                        // Create invisible circle button in the center
                                        const svgNS = "http://www.w3.org/2000/svg";
                                        const buttonCircle = document.createElementNS(svgNS, 'circle');

                                        buttonCircle.setAttribute('cx', centerX);
                                        buttonCircle.setAttribute('cy', centerY);
                                        buttonCircle.setAttribute('r', ringRadius * 0.3);
                                        buttonCircle.setAttribute('fill', 'transparent');
                                        buttonCircle.setAttribute('style', `cursor: ${canCycleSymmetry ? 'pointer' : 'default'};`);

                                        if (canCycleSymmetry) {
    buttonCircle.addEventListener('click', () => {
        console.group('🔄 Symmetry Button Clicked');
        console.log('Layer Type:', layerType);
        console.log('Match Name:', match.name);
        console.log('Symmetry Degree:', match.symmetryDegree);
        
        const currentScramble = window.currentParityTracerScramble || scrambleInput.value.trim();
        console.log('Current Scramble:', currentScramble);
        
        const scrambleKey = currentScramble.replace(/\s+/g, '');
        console.log('Scramble Key:', scrambleKey);
        
        console.log('Current symmetryOffsets object:', window.parityTracerSymmetryOffsets);
        
        if (!window.parityTracerSymmetryOffsets) {
            console.warn('⚠️ symmetryOffsets was undefined, initializing...');
            window.parityTracerSymmetryOffsets = {};
        }
        
        if (!window.parityTracerSymmetryOffsets[scrambleKey]) {
            console.log('📝 Creating new entry for scramble key');
            window.parityTracerSymmetryOffsets[scrambleKey] = { top: 0, bottom: 0 };
        }
        
        console.log('symmetryOffsets for this scramble:', window.parityTracerSymmetryOffsets[scrambleKey]);
        
        const currentOffset = window.parityTracerSymmetryOffsets[scrambleKey][layerType] || 0;
        console.log('Current Offset:', currentOffset);
        
        const maxSymmetries = match.name === 'Star' ? 3 : match.symmetryDegree;
        console.log('Max Symmetries:', maxSymmetries);
        
        const newOffset = (currentOffset + 1) % maxSymmetries;
        console.log('New Offset:', newOffset);
        
        window.parityTracerSymmetryOffsets[scrambleKey][layerType] = newOffset;
        console.log('Updated symmetryOffsets:', window.parityTracerSymmetryOffsets);
        
        console.log('🔄 Re-running analysis...');
        console.groupEnd();
        
        // Re-run analysis
        performAnalysisWithLongName();
    });
}

                                        svg.appendChild(buttonCircle);
                                    };

                                    // Add button to top layer (first SVG)
                                    addSymmetryButton(svgsInContainer[0], 'top', topMatch);

                                    // Add button to bottom layer (second SVG)
                                    addSymmetryButton(svgsInContainer[1], 'bottom', botMatch);
                                }
                            } catch (err) {
                                vizContainer.innerHTML = `<div style="color: #e53e3e;">Visualization error: ${err.message}</div>`;
                            }
                        } else {
                            vizContainer.innerHTML = `<div style="color: #e53e3e; font-family: monospace;">${encodedScramble}</div>`;
                        }
                    }

                    // Display results
                    displayResultsInModalWithVeryLongFunctionName(resultsContainer, sixStepParity, config);

                } catch (err) {
                    console.error(err);
                    resultsContainer.innerHTML = '<div style="color: #e53e3e; padding: 1rem;">Error parsing scramble. Please check the format.</div>';
                }
            }

            scrambleInput.addEventListener('input', () => {
                performAnalysisWithLongName();
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
                performAnalysisWithLongName();
            });

            y2Btn.addEventListener('click', () => {
                utilityY2Enabled = !utilityY2Enabled;
                y2Btn.classList.toggle('active', utilityY2Enabled);
                performAnalysisWithLongName();
            });

            flipBtn.addEventListener('click', () => {
                utilityFlipColorEnabled = !utilityFlipColorEnabled;
                flipBtn.classList.toggle('active', utilityFlipColorEnabled);
                performAnalysisWithLongName();
            });

            const closeMainModal = () => {
                // Reset utility states when closing
                utilityZ2Enabled = false;
                utilityY2Enabled = false;
                utilityFlipColorEnabled = false;

                window.removeEventListener('resize', updateButtonPositions);
                backdrop.remove();
                closeBtnElement.remove();
                instructionBtnElement.remove();
                settingsBtnElement.remove();
                document.body.classList.remove('modal-open');
                document.body.style.top = '';
                window.scrollTo(0, window.modalScrollY || 0);
            };

            // Use unified back button handler
            if (typeof pushModalState !== 'undefined') {
                pushModalState('parityTracerModal', closeMainModal);
            }

            closeBtnElement.addEventListener('click', closeMainModal);

            instructionBtnElement.addEventListener('click', () => {
                showParityTracerInstructionModal(config);
            });

            settingsBtnElement.addEventListener('click', () => {
                closeBtnElement.style.display = 'none';
                instructionBtnElement.style.display = 'none';
                settingsBtnElement.style.display = 'none';
                // Push another state for config on top of main modal
                showConfigurationModalWithLongName(modal, config, closeBtnElement, instructionBtnElement, settingsBtnElement);
            });

            // Close on backdrop click
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    closeMainModal();
                }
            });

            // Auto-analyze if scramble is provided, otherwise use (0,0)
            if (config.scrambleTextInput) {
                performAnalysisWithLongName();
            } else {
                scrambleInput.value = '(0,0)';
                performAnalysisWithLongName();
            }
        }, 0);
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'parity-tracer-close-btn';
        closeBtn.id = `${uniqueId}-close`;
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText += `background: ${buttonBgColor}; color: ${textColor};`;

        // Create settings button
        // Create instruction button if not hidden
        const instructionBtn = document.createElement('button');
        instructionBtn.className = 'parity-tracer-instruction-btn';
        instructionBtn.id = `${uniqueId}-instruction`;
        instructionBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>`;
        instructionBtn.style.cssText = `background: ${buttonBgColor}; color: ${textColor}; position: fixed; width: 36px; height: 36px; border-radius: 50%; display: ${config.hideInstructionButton ? 'none' : 'flex'}; align-items: center; justify-content: center; cursor: pointer; font-size: 1.25rem; transition: all 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10007; border: none;`;

        const settingsIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16" style="display: block; transform: scale(0.7); transform-origin: center;"><path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/><path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z"/></svg>`;
        const settingsBtn = document.createElement('button');
        settingsBtn.className = 'parity-tracer-settings-btn';
        settingsBtn.id = `${uniqueId}-settings`;
        settingsBtn.innerHTML = settingsIcon;
        settingsBtn.style.cssText += `background: ${buttonBgColor}; color: ${textColor};`;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);
        document.body.appendChild(closeBtn);
        document.body.appendChild(instructionBtn);
        document.body.appendChild(settingsBtn);

        window.modalScrollY = window.scrollY;
        document.body.style.top = `-${window.modalScrollY}px`;
        document.body.classList.add('modal-open');

        return backdrop;
    }

    // Export the single function
    globalThisWindowObjectThingyForParityTracer.ParityTracerLibrary = {
        createModal: createSquareOneParityTracerModalWithAllParametersIncluded,
        openConfigModal: showConfigurationModalWithLongName,
        version: '2.0.0'
    };

    // Export parity analysis function for use by other parts of the app
    globalThisWindowObjectThingyForParityTracer.Square1ParityAnalyzerLibraryWithSillyNames = {
        getParityTextFromScramblePlease: function (scrambleText, colorConfig, cornerMode, customRotation) {
            try {
                const state = applyScrambleToStateArrayWithLongName(scrambleText);
                const topRaw = buildUnitsFromStateLayerWithLongName(state, 0);
                const botRaw = buildUnitsFromStateLayerWithLongName(state, 12);
                const topMatch = matchPatternWithRotationCheckingWithLongName(topRaw.types);
                const botMatch = matchPatternWithRotationCheckingWithLongName(botRaw.types);
                const topUnits = rotateArrayCircularlyWithLongName(topRaw.units, topMatch.rot);
                const botUnits = rotateArrayCircularlyWithLongName(botRaw.units, botMatch.rot);
                const topCounts = countEdgesAndCornersWithLongName(topUnits);
                const botCounts = countEdgesAndCornersWithLongName(botUnits);

                const shouldSwapForParity = (topCounts.label === '2E5C' && botCounts.label === '6E3C');

                let parityEdgesOrder = [];
                let parityCornersOrder = [];

                if (shouldSwapForParity) {
                    const parityBlocks = [
                        { side: 'B', units: botUnits },
                        { side: 'T', units: topUnits }
                    ];
                    for (const b of parityBlocks) {
                        for (const u of b.units) {
                            if (u.type === 'E') {
                                parityEdgesOrder.push(u.edge);
                            } else {
                                parityCornersOrder.push(u.pair);
                            }
                        }
                    }
                } else {
                    const blocks = [{ side: 'T', units: topUnits }, { side: 'B', units: botUnits }];
                    for (const b of blocks) {
                        for (const u of b.units) {
                            if (u.type === 'E') {
                                parityEdgesOrder.push(u.edge);
                            } else {
                                parityCornersOrder.push(u.pair);
                            }
                        }
                    }
                }

                const useClockwise = (cornerMode === 'clockwise');
                const sixStepParity = calculateSixStepParityWithExtremelyLongFunctionName(parityEdgesOrder, parityCornersOrder, useClockwise);
                return sixStepParity.isOdd ? 'Odd' : 'Even';
            } catch (err) {
                console.error('Parity analysis error:', err);
                return 'Error';
            }
        }
    };

})(typeof window !== 'undefined' ? window : this);