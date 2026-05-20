/* ==== FILE: js/tools/cales-parity-tracer.js ==== */

(function (Cglobal) {
    'use strict';

    // Parity Tracer Core
    // Scramble to hex -> utils.js

    const THEME_SURFACE_OFFSETS = Object.freeze({
        dark: {
            input: 4,
            card: 1,
            innerCard: 2,
            button: 8,
            hover: 14,
            resultTitle: '#9299b0'
        },
        light: {
            input: -3,
            card: -2,
            innerCard: -4,
            button: -5,
            hover: -8,
            resultTitle: '#2d3748'
        }
    });

    const defaultTracerColors = Object.freeze({
        tlMainCol: '#FFD700',
        tlColName: 'Yellow',
        tlColAbb: 'Y',
        blMainCol: '#FFFFFF',
        blColName: 'White',
        blColAbb: 'W',
        frontCol: '#CC0000',
        rightCol: '#00AA00',
        backCol: '#FF8C00',
        leftCol: '#0080FF'
    });

    let C_Colors = { ...defaultTracerColors };

    // scrambleToHex → defined in utils.js

    // hex digit → parity color code (CCW sticker mode)
    const hexToColors_ccw = {
        '0':'O','2':'B','4':'R','6':'G',          // top edges
        '8':'G','a':'R','c':'B','e':'O',          // bottom edges
        '1':'B','3':'R','5':'G','7':'O',          // top corners CCW
        '9':'G','b':'R','d':'B','f':'O'           // bottom corners CCW
    };
    // CW sticker mode
    const hexToColors_cw = {
        '0':'O','2':'B','4':'R','6':'G',          // top edges
        '8':'G','a':'R','c':'B','e':'O',          // bottom edges
        '1':'O','3':'B','5':'R','7':'G',          // top corners CW
        '9':'O','b':'G','d':'R','f':'B'            // bottom corners CW
    };
    const TOP_HEX = new Set(['0','1','2','3','4','5','6','7']);
    const CORNER_HEX = new Set(['1','3','5','7','9','b','d','f']);

    const getContrastColor = Cglobal.SQG && Cglobal.SQG.color
        ? Cglobal.SQG.color.getContrastColor
        : function (hexColor) {
            const r = parseInt(hexColor.substr(1, 2), 16);
            const g = parseInt(hexColor.substr(3, 2), 16);
            const b = parseInt(hexColor.substr(5, 2), 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminance > 0.5 ? '#000000' : '#FFFFFF';
        };

    const adjustColorBrightness = Cglobal.SQG && Cglobal.SQG.color
        ? Cglobal.SQG.color.adjustColorBrightness
        : function (hexColor, percent) {
            const num = parseInt(hexColor.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = Math.min(255, Math.max(0, (num >> 16) + amt));
            const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
            const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
            return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
        };

    // Default shape patterns — keys are bitstrings: 0=Edge, 1=Corner
    const defaultShapePatterns = {
        '01010101': 'Square',
        '00101101': 'Kite',
        '00110011': 'Barrel',
        '00110101': 'Left Fist',
        '00101011': 'Right Fist',
        '00100111': 'Shield',
        '00011011': 'Muffin',
        '00010111': 'Left Pawn',
        '01000111': 'Right Pawn',
        '00001111': 'Scallop',
        '0011111': 'Pair',
        '0101111': 'L-Shape',
        '0111011': 'Line',
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
    function loadShapesFromStorage() {
        if (Cglobal.SQG && Cglobal.SQG.storage) {
            return Cglobal.SQG.storage.readJSON('customTracingSchemes', { ...defaultShapePatterns });
        }

        try {
            return JSON.parse(localStorage.getItem('customTracingSchemes')) || { ...defaultShapePatterns };
        } catch {
            return { ...defaultShapePatterns };
        }
    }

    function saveShapesToStorage(shapes) {
        if (Cglobal.SQG && Cglobal.SQG.storage) {
            Cglobal.SQG.storage.writeJSON('customTracingSchemes', shapes);
            return;
        }
        localStorage.setItem('customTracingSchemes', JSON.stringify(shapes));
    }

    let currentShapePatterns = loadShapesFromStorage();

    // Utility button states (always start as false when modal opens)
    let utilityZ2Enabled = false;
    let utilityY2Enabled = false;
    let utilityFlipColorEnabled = false;

    // Load z2 tracing mode from localStorage
    let z2TracingModeEnabled = Cglobal.SQG && Cglobal.SQG.storage
        ? Cglobal.SQG.storage.readBoolean('z2TracingMode', true)
        : localStorage.getItem('z2TracingMode') !== 'false';

    // Parity tracer specific image size
    let parityTracerImageSize = Cglobal.SQG && Cglobal.SQG.storage
        ? Cglobal.SQG.storage.readNumber('parityTracerImageSize', 200, { min: 80, max: 600 })
        : parseInt(localStorage.getItem('parityTracerImageSize'), 10) || 200;
    
    // Arrow settings
    let showCircularArrow = Cglobal.SQG && Cglobal.SQG.storage
        ? Cglobal.SQG.storage.readBoolean('parityTracerArrow', true)
        : localStorage.getItem('parityTracerArrow') !== 'false';

    let arrowSettings = {
        color: 'rgba(253, 34, 34, 0.7)',
        opacity: 0.7,
        strokeWidth: 1.6,
        radius: 0.3
    };
    arrowSettings = {
        ...arrowSettings,
        ...(Cglobal.SQG && Cglobal.SQG.storage
            ? Cglobal.SQG.storage.readJSON('parityTracerArrowSettings', {})
            : {})
    };

    // Evilness (loaded from parent app state, not localStorage directly - uses window references)
    function getEvilnessFactor() {
        return typeof evilnessFactor !== 'undefined' ? evilnessFactor : false;
    }
    function getEvilnessValue() {
        return typeof evilnessStringReturn !== 'undefined' ? evilnessStringReturn : false;
    }
    function getEvilnessMap() {
        return typeof evilnessMap !== 'undefined' ? evilnessMap : {};
    }
    function getScrambleEvilness(scramble) {
        if (!getEvilnessFactor()) return false;
        if (typeof getCaseNameFromScramble === 'function') {
            const cn = getCaseNameFromScramble(scramble);
            if (!cn) return false;
            return getEvilnessMap()[cn] === true;
        }
        return false;
    }

    function applyTransformation(scramble) {
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

    const rotateToMatchPattern = (s, k) => {
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
        const top = walkLayer(tlHex);
        const bot = walkLayer(blHex);
        return { topUnits: top.units, topBits: top.bits,
                 botUnits: bot.units, botBits: bot.bits };
    }

    // ── SHAPE MATCHING ───────────────────────────────────────────────────────
    function matchPattern(bitStr) {
        if (!currentShapePatterns || Object.keys(currentShapePatterns).length === 0) {
            currentShapePatterns = loadShapesFromStorage();
        }
        const symmetricShapes = { 'Square':4, 'Barrel':2, '2-2-2':3, '4-4':2, 'Star':6 };
        for (const [pat, name] of Object.entries(currentShapePatterns)) {
            if (pat.length !== bitStr.length) continue;
            const maxR = bitStr.length;
            const order = [0];
            for (let d = 1; d < maxR; d++) { order.push(-d); order.push(d); }
            for (const ra of order) {
                const nr = ((ra % maxR) + maxR) % maxR;
                if (rotateToMatchPattern(bitStr, nr) === pat) {
                    return { name, pat, rot: nr, originalPat: pat, symmetryDegree: symmetricShapes[name] || 1 };
                }
            }
        }
        return { name: 'Unknown', pat: bitStr, rot: 0, originalPat: bitStr, symmetryDegree: 1 };
    }

    function detectShapesFromHex(tlHex, blHex) {
        if (!currentShapePatterns || Object.keys(currentShapePatterns).length === 0) {
            currentShapePatterns = loadShapesFromStorage();
        }
        const { topUnits, topBits, botUnits, botBits } = hexToUnits(tlHex, blHex);
        const topMatch = matchPattern(topBits);
        const botMatch = matchPattern(botBits);

        return {
            topShape: topMatch.name,
            bottomShape: botMatch.name,
            topPattern: topBits,
            bottomPattern: botBits,
            topUnits,
            bottomUnits: botUnits,
            topMatch,
            bottomMatch: botMatch
        };
    }

    // Lookup Tables instead of algorithmic analysis for speed
    const blackEdgeParityMap = {
        '0246':0, '0264':1, '0426':1, '0462':0, '0624':0, '0642':1, '2046':1, '2064':0, '2406':0, '2460':1, '2604':1, '2640':0, '4026':0, '4062':1, '4206':1, '4260':0, '4602':0, '4620':1, '6024':1, '6042':0, '6204':0, '6240':1, '6402':1, '6420':0
    };

    const whiteEdgeParityMap = {
        '8ace':0, '8aec':1, '8cae':1, '8cea':0, '8eac':0, '8eca':1, 'a8ce':1, 'a8ec':0, 'ac8e':0, 'ace8':1, 'ae8c':1, 'aec8':0, 'c8ae':0, 'c8ea':1, 'ca8e':1, 'cae8':0, 'ce8a':0, 'cea8':1, 'e8ac':1, 'e8ca':0, 'ea8c':0, 'eac8':1, 'ec8a':1, 'eca8':0
    };

    const blackCornerParityMap = {
        '1357':0, '1375':1, '1537':1, '1573':0, '1735':0, '1753':1, '3157':1, '3175':0, '3517':0, '3571':1, '3715':1, '3751':0, '5137':0, '5173':1, '5317':1, '5371':0, '5713':0, '5731':1, '7135':1, '7153':0, '7315':0, '7351':1, '7513':1, '7531':0
    };

    const whiteCornerParityMap = {
        '9bdf':1, '9bfd':0, '9dbf':0, '9dfb':1, '9fbd':1, '9fdb':0, 'b9df':0, 'b9fd':1, 'bd9f':1, 'bdf9':0, 'bf9d':0, 'bfd9':1, 'd9bf':1, 'd9fb':0, 'db9f':0, 'dbf9':1, 'df9b':1, 'dfb9':0, 'f9bd':0, 'f9db':1, 'fb9d':1, 'fbd9':0, 'fd9b':0, 'fdb9':1
    };

    function getSymmetryOffsetKey(tlHex, blHex) {
        return `${tlHex}${blHex}`;
    }

    function calculateParityFromHex(tlHex, blHex, z2Mode, useClockwise, scrambleForEvil) {
        const { topUnits, topBits, botUnits, botBits } = hexToUnits(tlHex, blHex);

        const scrambleKey = getSymmetryOffsetKey(tlHex, blHex);
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

        const codeMap = useClockwise ? hexToColors_cw : hexToColors_ccw;

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

        const evilStep = getEvilnessFactor() ? (getScrambleEvilness(scrambleForEvil||'') ? 1 : 0) : null;
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
            topTraceRotation: topRot,
            botTraceRotation: botRot,
            topBits, botBits,
            wasSwapped: shouldSwap
        };
    }

    // Shape visualization for config modal.
    function drawSchemeSettingsImage(pattern, size, idPrefix) {
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
    function getArrowStartAngle(rotationAmount, unitsArray, layerType, patternBits) {

        const initialAngle = layerType === 'TOP' ? 90 : 300;

        const endsWithCorner = patternBits.endsWith('1');
        const arcDegrees = endsWithCorner ? 300 : 330;

        let totalRotationDegrees = 0;

        for (let i = 0; i < rotationAmount; i++) {
            const pieceDegrees = CORNER_HEX.has(unitsArray[i]) ? 60 : 30;
            totalRotationDegrees += pieceDegrees;
        }
        // We rotate clockwise (subtract) from the initial position
        const finalAngle = initialAngle - totalRotationDegrees;

        return { startAngle: finalAngle, arcDegrees: arcDegrees };
    }

    function generateArrow(centerX, centerY, radius, startAngleDeg, arcDegrees, size) {
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

    function getSvgGeometry(svg, fallbackSize) {
        const originX = parseFloat(svg.getAttribute('data-origin-x'));
        const originY = parseFloat(svg.getAttribute('data-origin-y'));
        const puzzleSize = parseFloat(svg.getAttribute('data-puzzle-size'));

        if (Number.isFinite(originX) && Number.isFinite(originY)) {
            return {
                centerX: originX,
                centerY: originY,
                puzzleSize: Number.isFinite(puzzleSize) ? puzzleSize : fallbackSize,
            };
        }

        const viewBox = (svg.getAttribute('viewBox') || '').trim().split(/\s+/).map(Number);
        if (viewBox.length === 4 && viewBox.every(Number.isFinite)) {
            return {
                centerX: viewBox[0] + viewBox[2] / 2,
                centerY: viewBox[1] + viewBox[3] / 2,
                puzzleSize: Number.isFinite(puzzleSize) ? puzzleSize : Math.min(viewBox[2], viewBox[3]),
            };
        }

        return { centerX: fallbackSize / 2, centerY: fallbackSize / 2, puzzleSize: fallbackSize };
    }

    function displayResults(container, sixStepParity, config) {
        function colorSqHTML(codenames) {
            if (!codenames || !codenames.length) return '';
            const colorMap = {
                'O': `<span class="color-dot" style="background: ${config.backCol};"></span>`,
                'G': `<span class="color-dot" style="background: ${config.rightCol};"></span>`,
                'R': `<span class="color-dot" style="background: ${config.frontCol};"></span>`,
                'B': `<span class="color-dot" style="background: ${config.leftCol};"></span>`
            };
            return codenames.slice(0,3).map(c => colorMap[c] || '').join('');
        }

        function createPositionIndicator(hexPerm) {
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
        const themeOffsets = isDark ? THEME_SURFACE_OFFSETS.dark : THEME_SURFACE_OFFSETS.light;
        const cardBgColor = adjustColorBrightness(config.backgroundColor, themeOffsets.card);
        const innerCardBg = adjustColorBrightness(config.backgroundColor, themeOffsets.innerCard);

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

        const resultTitleColor = themeOffsets.resultTitle;
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
                displayContent = `${lineName}: ${createPositionIndicator(step.hexPerm)} = <strong>${step.result}</strong>`;
            } else {
                displayContent = `${lineName}: ${colorSqHTML(step.codenames)} = <strong>${step.result}</strong>`;
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

    // Set shape orientation after the user selects a tracing start.
    function setShapeOrientation(pattern, clickedIndex) {
        const rotated = rotateToMatchPattern(pattern, clickedIndex);

        let shapeName = '';
        for (const [pat, name] of Object.entries(currentShapePatterns)) {
            if (pat === pattern) {
                shapeName = name;
                break;
            }
        }

        if (shapeName) {
            delete currentShapePatterns[pattern];
            currentShapePatterns[rotated] = shapeName;
            saveShapesToStorage(currentShapePatterns);
        }
    }


    // Parity Tracer Instruction Modal
    function showTracerInstModal(config) {
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
    function showConfigInstModal(config) {
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

    function showEvilnessCasesModal(modalElement, _config, mainCloseBtn, mainSettingsBtn) {
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
                    style="padding:7px 8px; border:1px solid var(--border-color); border-radius:7px; font-size:0.82rem; background:var(--surface); cursor:pointer; color:var(--text-ui); flex-shrink:0;">
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

        const escapeAttr = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

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
                    data-case="${escapeAttr(cn)}"
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

        const toggleEvilCase = (cn) => {
            localEvilMap[cn] = !localEvilMap[cn];
            renderEvilGrid();
            markChanged();
        };

        const applyEvilBulkAction = (action) => {
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
                if (typeof markParityAlgorithmsDirty === 'function') markParityAlgorithmsDirty();
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
            closeModalWithHistory(() => {
                evilModalDiv.remove();
                if (mainCloseBtn) mainCloseBtn.style.display = 'flex';
                if (mainSettingsBtn) mainSettingsBtn.style.display = 'flex';
            });
        }

        evilInner.querySelector('#evilSaveBtn').addEventListener('click', performSave);
        evilInner.querySelector('#evilCancelBtn').addEventListener('click', () => closeEvilModal(false));
        evilInner.querySelector('#evilModalCloseBtn').addEventListener('click', () => closeEvilModal(false));
        evilInner.querySelector('#evilBulkAction').addEventListener('change', (event) => {
            if (!event.target.value) return;
            applyEvilBulkAction(event.target.value);
            event.target.value = '';
        });
        evilInner.querySelector('#evilCaseGrid').addEventListener('click', (event) => {
            const card = event.target.closest('[data-case]');
            if (!card || !evilInner.contains(card)) return;
            toggleEvilCase(card.dataset.case);
        });
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

    function showTracingSettingsModal(modalElement, config, mainCloseBtn, mainInstructionBtn, mainSettingsBtn) {
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
        const sortedEntries = Object.entries(currentShapePatterns).sort((a, b) => a[1].localeCompare(b[1]));

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
            vizDiv.innerHTML = drawSchemeSettingsImage(pattern, 112, 'config-' + pattern);
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
            saveShapesToStorage(currentShapePatterns);
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
            currentShapePatterns = { ...defaultShapePatterns };
            saveShapesToStorage(currentShapePatterns);
            configModalDiv.remove();
            configFloatingCloseBtn.remove();
            configStyle.remove();
            showTracingSettingsModal(modalElement, config, mainCloseBtn, mainInstructionBtn, mainSettingsBtn);
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
                    // Calculate from viewport coordinates so the button follows the modal edge.
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

        // Keep position updates short-lived while layout settles.
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
                    showConfigInstModal(config);
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

        // Handle shape piece clicks for tracing rotation.
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

                            setShapeOrientation(pattern, clickedIndex, 'config');
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
                                for (const [pat, name] of Object.entries(currentShapePatterns)) {
                                    if (name.toLowerCase() === shapeName) {
                                        newPattern = pat;
                                        break;
                                    }
                                }

                                if (newPattern) {
                                    vizDiv.innerHTML = drawSchemeSettingsImage(newPattern, 112, 'config-' + newPattern);

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
        currentShapePatterns = loadShapesFromStorage();

        const config = {
            backgroundColor: options.backgroundColor || '#ffffff',
            hideInstructionButton: options.hideInstructionButton || false,
            instructionText1: options.instructionText1 || 'Enter your scramble in the top input bar and press Analyze to trace parity.',
            instructionText2: options.instructionText2 || 'You can change the color scheme from Settings.',
            instructionText3: options.instructionText3 || 'For symmetric case, click on the very middle of the image to trace from the other symmetry.',
            instructionText4: options.instructionText4 || 'Personalize your tracing methods and tracing positions from the settings button.',
            tlMainCol: options.topColor || '#474747',
            tlColName: options.topColorName || 'Gray',
            tlColAbb: options.topColorShort || 'G',
            blMainCol: options.bottomColor || '#FFFFFF',
            blColName: options.bottomColorName || 'White',
            blColAbb: options.bottomColorShort || 'W',
            frontCol: options.frontColor || '#CC0000',
            rightCol: options.rightColor || '#00AA00',
            backCol: options.backColor || '#FF8C00',
            leftCol: options.leftColor || '#0080FF',
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
                const useClockwise = (typeof cornerStickerMode !== 'undefined' && cornerStickerMode === 'clockwise');
                const p = calculateParityFromHex(tlHex, blHex, z2TracingModeEnabled, useClockwise, config.scrambleTextInput);
                const useEvil = getEvilnessValue() && p.evilStep !== null;
                return (useEvil ? p.isOddWithEvil : p.isOdd) ? 'Odd' : 'Even';
            } catch (err) {
                console.error('Parity calculation error:', err);
                return 'error';
            }
        }

        const textColor = getContrastColor(config.backgroundColor);
        const isDark = textColor === '#FFFFFF';
        const themeOffsets = isDark ? THEME_SURFACE_OFFSETS.dark : THEME_SURFACE_OFFSETS.light;
        const borderColor = isDark ? adjustColorBrightness(config.backgroundColor, 20) : adjustColorBrightness(config.backgroundColor, -10);
        const inputBgColor = adjustColorBrightness(config.backgroundColor, themeOffsets.input);
        const buttonBgColor = adjustColorBrightness(config.backgroundColor, themeOffsets.button);
        const hoverBgColor = adjustColorBrightness(config.backgroundColor, themeOffsets.hover);

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

            function performAnalysis() {
                // Ensure we have the latest shapes before analysis
                currentShapePatterns = loadShapesFromStorage();

                // Re-read all live settings from localStorage on every analysis
                const storedZ2 = localStorage.getItem('z2TracingMode');
                z2TracingModeEnabled = storedZ2 !== null ? storedZ2 === 'true' : true;
                const storedImgSize = localStorage.getItem('parityTracerImageSize');
                parityTracerImageSize = storedImgSize !== null ? parseInt(storedImgSize) : 200;
                const storedArrow = localStorage.getItem('parityTracerArrow');
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
                const transformedScramble = applyTransformation(scrambleText);

                try {
                    const { tlHex, blHex } = scrambleToHex(transformedScramble);
                    const useClockwise = (typeof cornerStickerMode !== 'undefined' && cornerStickerMode === 'clockwise');
                    const parity = calculateParityFromHex(tlHex, blHex, z2TracingModeEnabled, useClockwise, scrambleText);

                    // Visualize
                    const visualizer = Cglobal.Square1Visualizer || Cglobal.Square1VisualizerLibraryWithSillyNames;
                    if (config.shouldGenerateImage && visualizer) {
                        const hexCode = tlHex + '|' + blHex.slice(0,6) + blHex.slice(6);
                        try {
                            const imageSize = parityTracerImageSize;
                            const svgContent = visualizer.visualizeFromHexCode(
                                hexCode, imageSize,
                                { topColor: config.tlMainCol, bottomColor: config.blMainCol,
                                  frontColor: config.frontCol, rightColor: config.rightCol,
                                  backColor: config.backCol, leftColor: config.leftCol }
                            );

                            const { topBits, botBits } = parity;
                            // unrotated units for arrow calculation
                            const { topUnits: topRawU, botUnits: botRawU } = hexToUnits(tlHex, blHex);

                            const topArrowData = getArrowStartAngle(parity.topTraceRotation, topRawU, 'TOP', topBits);
                            const botArrowData = getArrowStartAngle(parity.botTraceRotation, botRawU, 'BOTTOM', botBits);

                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = svgContent;
                            const svgs = tempDiv.querySelectorAll('svg');
                            if (svgs.length >= 2) {
                                const topGeometry = getSvgGeometry(svgs[0], imageSize);
                                const botGeometry = getSvgGeometry(svgs[1], imageSize);
                                const topUnit10vh = topGeometry.puzzleSize * 0.4;
                                const botUnit10vh = botGeometry.puzzleSize * 0.4;
                                const topRingRadius = topUnit10vh * 0.7 + topUnit10vh * 0.4;
                                const botRingRadius = botUnit10vh * 0.7 + botUnit10vh * 0.4;
                                svgs[0].insertAdjacentHTML('beforeend', generateArrow(topGeometry.centerX, topGeometry.centerY, topRingRadius, topArrowData.startAngle, topArrowData.arcDegrees, topGeometry.puzzleSize));
                                svgs[1].insertAdjacentHTML('beforeend', generateArrow(botGeometry.centerX, botGeometry.centerY, botRingRadius, botArrowData.startAngle, botArrowData.arcDegrees, botGeometry.puzzleSize));
                            }
                            vizContainer.innerHTML = tempDiv.innerHTML;

                            const svgsInContainer = vizContainer.querySelectorAll('svg');
                            if (svgsInContainer.length >= 2) {
                                const addSymBtn = (svg, layerType, match) => {
                                    if (match.symmetryDegree <= 1) return;
                                    const geometry = getSvgGeometry(svg, imageSize);
                                    const unit10vh = geometry.puzzleSize * 0.4;
                                    const ringRadius = unit10vh * 0.7 + unit10vh * 0.4;
                                    const svgNS = "http://www.w3.org/2000/svg";
                                    const btn = document.createElementNS(svgNS, 'circle');
                                    btn.setAttribute('cx', geometry.centerX); btn.setAttribute('cy', geometry.centerY);
                                    btn.setAttribute('r', ringRadius * 0.3);
                                    btn.setAttribute('fill', 'transparent');
                                    btn.setAttribute('pointer-events', 'all');
                                    btn.setAttribute('aria-label', `Cycle ${layerType} symmetry start`);
                                    btn.setAttribute('style', 'cursor:pointer;');
                                    btn.addEventListener('click', () => {
                                        const sk = getSymmetryOffsetKey(tlHex, blHex);
                                        if (!window.parityTracerSymmetryOffsets) window.parityTracerSymmetryOffsets = {};
                                        if (!window.parityTracerSymmetryOffsets[sk]) window.parityTracerSymmetryOffsets[sk] = {top:0,bottom:0};
                                        const cur = window.parityTracerSymmetryOffsets[sk][layerType] || 0;
                                        const max = match.name==='Star' ? 2 : match.symmetryDegree;
                                        window.parityTracerSymmetryOffsets[sk][layerType] = (cur+1)%max;
                                        performAnalysis();
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

                    displayResults(resultsContainer, parity, config);

                } catch (err) {
                    console.error(err);
                    resultsContainer.innerHTML = '<div style="color:#e53e3e;padding:1rem;">Error parsing scramble. Check the format.</div>';
                }
            }

            scrambleInput.addEventListener('input', () => {
                performAnalysis();
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
                performAnalysis();
            });

            y2Btn.addEventListener('click', () => {
                utilityY2Enabled = !utilityY2Enabled;
                y2Btn.classList.toggle('active', utilityY2Enabled);
                performAnalysis();
            });

            flipBtn.addEventListener('click', () => {
                utilityFlipColorEnabled = !utilityFlipColorEnabled;
                flipBtn.classList.toggle('active', utilityFlipColorEnabled);
                performAnalysis();
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
                    showTracerInstModal(config);
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
                performAnalysis();
            } else {
                performAnalysis();
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
        openConfigModal: showTracingSettingsModal,
        openEvilnessCasesModal: function(config) { showEvilnessCasesModal(null, config, null, null, null); },
        reloadShapesFromStorage: function () {
            // Force reload shape patterns from localStorage
            currentShapePatterns = loadShapesFromStorage();
        },
        detectShapesFromHex,
        version: '2.0.0'
    };

    // Export parity analysis function for use by other parts of the app
    Cglobal.caleTracer = {
        getParityTextFromScramble: function (scrambleText, colorConfigOrCornerMode, cornerMode) {
            currentShapePatterns = loadShapesFromStorage();
            try {
                const { tlHex, blHex } = scrambleToHex(scrambleText);
                const resolvedCornerMode = typeof colorConfigOrCornerMode === 'string'
                    ? colorConfigOrCornerMode
                    : cornerMode;
                const useClockwise = resolvedCornerMode === 'clockwise';
                const p = calculateParityFromHex(tlHex, blHex, z2TracingModeEnabled, useClockwise, scrambleText);
                const useEvil = getEvilnessValue() && p.evilStep !== null;
                return (useEvil ? p.isOddWithEvil : p.isOdd) ? 'Odd' : 'Even';
            } catch (err) {
                console.error('Parity analysis error:', err);
                return 'Error';
            }
        }
    };

})(typeof window !== 'undefined' ? window : this);

export const ParityTracerLibrary = globalThis.ParityTracerLibrary;
export const caleTracer = globalThis.caleTracer;
