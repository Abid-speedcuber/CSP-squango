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
        'ECEEEEECC': '5-1 Right',
        'EEEEECECC': '5-1 Left',
        'EECEEEECC': '4-2 Right',
        'EEEECEECC': '4-2 Left',
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
        for (const [pat, name] of Object.entries(currentShapePatternsStorageWithLongName)) {
            if (pat.length !== typeStr.length) continue;
            for (let k = 0; k < typeStr.length; k++) {
                if (rotateStringCircularlyWithLongName(typeStr, k) === pat) {
                    return { name, pat, rot: k, originalPat: pat };
                }
            }
        }
        return { name: 'Unknown', pat: typeStr, rot: 0, originalPat: typeStr };
    }

    function countEdgesAndCornersWithLongName(units) {
        const e = units.filter(u => u.type === 'E').length;
        const c = units.length - e;
        return { e, c, label: `${e}E${c}C` };
    }

    // Six-step parity calculation
    function calculateSixStepParityWithExtremelyLongFunctionName(edgesOrderLetters, cornersOrderIDs) {
        const steps = [];

        function getEdgeCodenameWithLongName(letter) {
            const colorMap = {
                'L': 'O', 'C': 'G', 'F': 'R', 'I': 'B',
                'M': 'R', 'P': 'G', 'S': 'O', 'V': 'B'
            };
            return colorMap[letter] || '?';
        }

        function getCornerCodenameWithLongName(id) {
            const colorMap = {
                'AB': 'O', 'DE': 'G', 'GH': 'R', 'JK': 'B',
                'NO': 'R', 'QR': 'G', 'TU': 'O', 'WX': 'B'
            };
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
            <h2 style="font-size: 1.5rem; color: ${textColor}; margin: 0;">Configure Shape Orientations</h2>
            <button class="config-info-btn" style="background: rgba(255, 255, 255, 0.1); border: none; color: ${textColor}; cursor: pointer; padding: 6px; border-radius: 6px; display: ${config.hideInstructionButton ? 'none' : 'flex'}; align-items: center; justify-content: center; transition: background 0.2s; width: 32px; height: 32px;" title="Configuration Guide">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
            </button>
        `;
        
        headerDiv.appendChild(headerTitle);
        
        const cornerStickerDiv = document.createElement('div');
        cornerStickerDiv.style.cssText = `margin-bottom: 1.5rem; padding: 1rem; background: ${cardBg}; border-radius: 8px;`;
        cornerStickerDiv.innerHTML = `
            <div style="font-weight: 600; color: ${textColor}; margin-bottom: 0.75rem;">Corner Sticker for Tracing:</div>
            <div style="display: flex; gap: 15px;">
                <div style="display: flex; align-items: center; gap: 5px;">
                    <input type="radio" id="cornerCounterClockwise" name="cornerSticker" value="counterclockwise" ${cornerStickerMode === 'counterclockwise' ? 'checked' : ''} onchange="setCornerStickerMode('counterclockwise')" style="cursor: pointer;">
                    <label for="cornerCounterClockwise" style="cursor: pointer; color: ${textColor};">Most Counter-Clockwise Sticker</label>
                </div>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <input type="radio" id="cornerClockwise" name="cornerSticker" value="clockwise" ${cornerStickerMode === 'clockwise' ? 'checked' : ''} onchange="setCornerStickerMode('clockwise')" style="cursor: pointer;">
                    <label for="cornerClockwise" style="cursor: pointer; color: ${textColor};">Most Clockwise Sticker</label>
                </div>
            </div>
        `;

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

        const resetDiv = document.createElement('div');
        resetDiv.style.cssText = `grid-column: 1 / -1; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 2px solid ${borderColor}; text-align: center;`;

        const resetBtnBg = isDark ? adjustColorBrightness(config.backgroundColor, 15) : adjustColorBrightness(config.backgroundColor, -8);
        const resetBtnHover = isDark ? adjustColorBrightness(config.backgroundColor, 20) : adjustColorBrightness(config.backgroundColor, -12);
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Reset All to Default';
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
            showConfigurationModalWithLongName(modalElement, config, mainCloseBtn, mainSettingsBtn);
        };

        // Setup config info button handler
        setTimeout(() => {
            const configInfoBtn = configContent.querySelector('.config-info-btn');
            if (configInfoBtn) {
                configInfoBtn.onclick = () => {
                    showConfigOrientationInstructionModal(config);
                };
            }
        }, 100);

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

        const closeConfigModal = () => {
            configModalDiv.remove();
            configFloatingCloseBtn.remove();
            configStyle.remove();
            window.removeEventListener('resize', resizeHandler);
            configModalDiv.removeEventListener('scroll', scrollHandler);
            const backdrop = document.querySelector('.parity-tracer-backdrop');
            if (backdrop) {
                backdrop.removeEventListener('scroll', scrollHandler);
            }
            if (mainCloseBtn) mainCloseBtn.style.display = 'flex';
            if (mainInstructionBtn) mainInstructionBtn.style.display = config.hideInstructionButton ? 'none' : 'flex';
            if (mainSettingsBtn) mainSettingsBtn.style.display = 'flex';
        };
        function setCornerStickerMode(mode) {
    cornerStickerMode = mode;
    saveState();
    console.log('Corner sticker mode set to:', mode);
}

        // Back button handler for config modal using unified system
        if (typeof pushModalState !== 'undefined') {
            pushModalState('parityConfigModal', closeConfigModal);
        }

        configFloatingCloseBtn.onclick = closeConfigModal;

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

                const sixStepParity = calculateSixStepParityWithExtremelyLongFunctionName(parityEdgesOrder, parityCornersOrder);
                return sixStepParity.isOdd ? 'odd' : 'even';
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
    `;

        // Create modal structure
        const modal = document.createElement('div');
        modal.className = 'parity-tracer-modal-container';
        modal.style.cssText = `
      position: relative;
      background: ${config.backgroundColor};
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 600px;
      width: 90%;
      height: 540px;
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
        <button id="${uniqueId}-analyze" style="margin: 0; background: ${buttonBgColor}; color: ${textColor}; border-color: ${borderColor}; font-weight: 600;">
          Analyze
        </button>
      </div>
      <div id="${uniqueId}-visualization" style="display: flex; justify-content: center; margin-bottom: 1rem;"></div>
      <div id="${uniqueId}-results" class="results-section"></div>
    `;

        // Attach event handlers - COMPLETE LOGIC
        setTimeout(() => {
            const analyzeBtn = modal.querySelector(`#${uniqueId}-analyze`);
            const scrambleInput = modal.querySelector(`#${uniqueId}-scramble`);
            const vizContainer = modal.querySelector(`#${uniqueId}-visualization`);
            const resultsContainer = modal.querySelector(`#${uniqueId}-results`);
            const closeBtnElement = document.getElementById(`${uniqueId}-close`);
            const instructionBtnElement = document.getElementById(`${uniqueId}-instruction`);
            const settingsBtnElement = document.getElementById(`${uniqueId}-settings`);

            // Position buttons based on modal position
            function updateButtonPositions() {
                const rect = modal.getBoundingClientRect();
                closeBtnElement.style.top = `${rect.top + 8}px`;
                closeBtnElement.style.right = `${window.innerWidth - rect.right + 6}px`;
                instructionBtnElement.style.bottom = `${window.innerHeight - rect.bottom + 66}px`;
                instructionBtnElement.style.right = `${window.innerWidth - rect.right + 6}px`;
                settingsBtnElement.style.bottom = `${window.innerHeight - rect.bottom + 16}px`;
                settingsBtnElement.style.right = `${window.innerWidth - rect.right + 6}px`;
            }

            updateButtonPositions();
            window.addEventListener('resize', updateButtonPositions);
            backdrop.addEventListener('scroll', updateButtonPositions);

            function performAnalysisWithLongName() {
                const scrambleText = scrambleInput.value.trim();
                if (!scrambleText) return;

                try {
                    const state = applyScrambleToStateArrayWithLongName(scrambleText);

                    // Validation - RESTORED
                    const val = validateCornersTogetherSameLayerWithLongName(state);

                    // Build units - COMPLETE
                    const topRaw = buildUnitsFromStateLayerWithLongName(state, 0);
                    const botRaw = buildUnitsFromStateLayerWithLongName(state, 12);
                    const topMatch = matchPatternWithRotationCheckingWithLongName(topRaw.types);
                    const botMatch = matchPatternWithRotationCheckingWithLongName(botRaw.types);
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
                    const shouldSwapForParity = (topCounts.label === '2E5C' && botCounts.label === '6E3C');

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

                    const sixStepParity = calculateSixStepParityWithExtremelyLongFunctionName(parityEdgesOrder, parityCornersOrder);

                    // Visualize scramble if enabled - COMPLETE
                    if (config.shouldGenerateImage && globalThisWindowObjectThingyForParityTracer.Square1VisualizerLibraryWithSillyNames) {
                        const encodedScramble = encodeStateToHexStringWithLongName(state);
                        if (!encodedScramble.startsWith('Error:')) {
                            try {
                                const svgContent = globalThisWindowObjectThingyForParityTracer.Square1VisualizerLibraryWithSillyNames.visualizeFromHexCodePlease(
                                    encodedScramble,
                                    config.imageSizeInPixels || 200,
                                    {
                                        topColor: config.topLayerMainColor,
                                        bottomColor: config.bottomLayerMainColor,
                                        frontColor: config.frontFaceColorForVisualization,
                                        rightColor: config.rightFaceColorForVisualization,
                                        backColor: config.backFaceColorForVisualization,
                                        leftColor: config.leftFaceColorForVisualization
                                    }
                                );
                                vizContainer.innerHTML = svgContent;
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

            analyzeBtn.addEventListener('click', performAnalysisWithLongName);

            scrambleInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    performAnalysisWithLongName();
                }
            });

            const closeMainModal = () => {
                window.removeEventListener('resize', updateButtonPositions);
                backdrop.remove();
                closeBtnElement.remove();
                instructionBtnElement.remove();
                settingsBtnElement.remove();
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

        return backdrop;
    }

    // Export the single function
    globalThisWindowObjectThingyForParityTracer.ParityTracerLibrary = {
        createModal: createSquareOneParityTracerModalWithAllParametersIncluded,
        version: '2.0.0'
    };

})(typeof window !== 'undefined' ? window : this);