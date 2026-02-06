// ========================================
// Square-1 Algorithm Viewer Library
// ========================================

(function () {
    'use strict';

    // ========================================
    // SHAPE INITIALIZATION
    // ========================================
    const Shape_halflayer = [0, 3, 6, 12, 15, 24, 27, 30, 48, 51, 54, 60, 63];
    const Shape_ShapeIdx = [];

    function initShapes() {
        let count = 0;
        for (let i = 0; i < 28561; i++) {
            const dr = Shape_halflayer[i % 13];
            const dl = Shape_halflayer[Math.floor(i / 13) % 13];
            const ur = Shape_halflayer[Math.floor(Math.floor(i / 13) / 13) % 13];
            const ul = Shape_halflayer[Math.floor(Math.floor(Math.floor(i / 13) / 13) / 13)];
            const value = ul << 18 | ur << 12 | dl << 6 | dr;

            let bitCount = 0;
            let temp = value;
            while (temp) {
                bitCount += temp & 1;
                temp >>= 1;
            }

            if (bitCount === 16) {
                Shape_ShapeIdx[count++] = value;
            }
        }
    }

    initShapes();

    // ========================================
    // SCRAMBLE FUNCTIONS
    // ========================================
    function parseScramble(scramble, animateBothLayers = false) {
        const moves = [];
        let i = 0;

        if (animateBothLayers) {
            // NEW MODE: Group tokens as "a,b", "/", "c,d"
            while (i < scramble.length) {
                const char = scramble[i];

                if (char === '/' || char === '\\') {
                    moves.push({ type: 'twist' });
                    i++;
                }
                else if (char === '(' || char === '-' || /\d/.test(char)) {
                    let moveStr = '';
                    let parenDepth = 0;

                    while (i < scramble.length) {
                        const c = scramble[i];
                        if (c === '(') parenDepth++;
                        if (c === ')') parenDepth--;

                        if (c === '/' || c === '\\') {
                            break;
                        }

                        if ((c === ',' || c === '-' || /\d/.test(c) || c === '(' || c === ')') && parenDepth >= 0) {
                            moveStr += c;
                        }

                        i++;

                        if (parenDepth === 0 && moveStr.includes(',')) {
                            break;
                        }
                    }

                    const cleaned = moveStr.replace(/[()]/g, '').trim();
                    if (cleaned.includes(',')) {
                        const [top, bottom] = cleaned.split(',').map(n => parseInt(n.trim()));
                        moves.push({ type: 'turn', top, bottom });
                    }
                }
                else if (/\s/.test(char)) {
                    i++;
                }
                else {
                    i++;
                }
            }
        } else {
            // LEGACY MODE: Separate tokens for each layer
            while (i < scramble.length) {
                const char = scramble[i];

                if (char === '/' || char === '\\') {
                    moves.push({ type: 'twist' });
                    i++;
                }
                else if (char === '(' || char === '-' || /\d/.test(char)) {
                    let moveStr = '';
                    let parenDepth = 0;
                    let foundComma = false;
                    const startPos = i;

                    while (i < scramble.length) {
                        const c = scramble[i];
                        if (c === '(') parenDepth++;
                        if (c === ')') parenDepth--;

                        if (c === '/' || c === '\\') {
                            break;
                        }

                        if (c === ',') foundComma = true;

                        if ((c === ',' || c === '-' || /\d/.test(c) || c === '(' || c === ')') && parenDepth >= 0) {
                            moveStr += c;
                        }

                        i++;

                        if (parenDepth === 0 && foundComma) {
                            break;
                        }
                    }

                    const cleaned = moveStr.replace(/[()]/g, '').trim();
                    if (cleaned.includes(',')) {
                        const parts = cleaned.split(',').map(n => parseInt(n.trim()));
                        const top = parts[0];
                        const bottom = parts.length > 1 ? parts[1] : 0;

                        // Emit top layer move only
                        if (top !== 0) {
                            moves.push({ type: 'turn', top, bottom: 0 });
                        }

                        // Emit bottom layer move only
                        if (bottom !== 0) {
                            moves.push({ type: 'turn', top: 0, bottom });
                        }

                        // If both are zero, still emit one move to maintain step count
                        if (top === 0 && bottom === 0) {
                            moves.push({ type: 'turn', top: 0, bottom: 0 });
                        }
                    } else if (cleaned) {
                        const num = parseInt(cleaned);
                        if (!isNaN(num)) {
                            moves.push({ type: 'turn', top: num, bottom: 0 });
                        }
                    }
                }
                else if (/\s/.test(char)) {
                    i++;
                }
                else {
                    i++;
                }
            }
        }
        return moves;
    }

    function twist(tlHex, blHex) {
        const tlFirst6 = tlHex.slice(0, 6);
        const tlLast6 = tlHex.slice(6);
        const blFirst6 = blHex.slice(0, 6);
        const blLast6 = blHex.slice(6);

        return {
            tlHex: tlFirst6 + blFirst6,
            blHex: tlLast6 + blLast6
        };
    }

    function cycleLeft(hex, places) {
        const normalized = ((places % 12) + 12) % 12;
        return hex.slice(normalized) + hex.slice(0, normalized);
    }

    function invertScramble(scrambleString) {
        if (!scrambleString) return scrambleString;
        let str = String(scrambleString).trim();

        const parts = str.split('/');
        const reversed = parts.slice().reverse();

        const inverted = reversed.map(part => {
            part = part.trim();

            const turnMatch = part.match(/\(([^)]+)\)/);
            if (turnMatch) {
                const values = turnMatch[1].split(',').map(v => v.trim());
                const invertedValues = values.map(v => {
                    const num = parseInt(v);
                    if (isNaN(num)) return v;
                    return String(-num);
                });
                return '(' + invertedValues.join(',') + ')';
            }

            if (part.includes(',')) {
                const values = part.split(',').map(v => v.trim());
                const invertedValues = values.map(v => {
                    const num = parseInt(v);
                    if (isNaN(num)) return v;
                    return String(-num);
                });
                return invertedValues.join(',');
            }

            return part;
        });

        return inverted.join('/');
    }

    function sq1AlgToHex(scramble, animateBothLayers = false) {
        let tlHex = '011233455677';
        let blHex = '998bbaddcffe';

        const moves = parseScramble(scramble, animateBothLayers);

        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];

            if (move.type === 'twist') {
                const result = twist(tlHex, blHex);
                tlHex = result.tlHex;
                blHex = result.blHex;
            } else if (move.type === 'turn') {
                tlHex = cycleLeft(tlHex, move.top);
                blHex = cycleLeft(blHex, move.bottom);
            }
        }
        return { tlHex, blHex };
    }

    function getShapeIndexFromHex(tlHex, blHex) {
        const hexScrambleCode = tlHex + '|' + blHex;

        if (hexScrambleCode.length !== 25) {
            return -1;
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

        const shapeIndex = Shape_ShapeIdx.indexOf(shapeValue);
        return shapeIndex;
    }

    // ========================================
    // STEP GENERATION
    // ========================================
    function generateSteps(alg, animateBothLayers = false) {
        const steps = [];
        const chars = alg.split('');
        let position = 0;

        if (animateBothLayers) {
            // NEW MODE: Group both layers together
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
            return sq1AlgToHex(inverted, animateBothLayers);
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
    function renderAlgorithm(step, originalAlg, steps, currentStepIndex, animateBothLayers) {
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
                html += `<span class="clickable-token ${isCurrent ? 'current-token' : ''}" data-step-index="${index}" style="cursor: pointer; padding: 2px 4px; border-radius: 2px; ${isCurrent ? 'background: #f9dfb8ff; color: #000;' : ''} display: inline-block; margin: 0 1px;">${tokenText}</span>`;
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
            return '<div style="color: #ff6b6b; font-style: italic;">draw-scramble.js not found</div>';
        }

        try {
            const hexCode = hex.tlHex + '|' + hex.blHex;
            const svgHtml = window.Square1VisualizerLibraryWithSillyNames.visualizeFromHexCodePlease(
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
            return '<div style="color: #ff6b6b; font-style: italic;">Error rendering: ' + e.message + '</div>';
        }
    }

    // ========================================
    // MAIN VIEWER CREATION FUNCTION
    // ========================================
    function createViewer(algorithm, colors = {}, imageSize = 200, caseName = '', parity = '') {
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
            imageSize: imageSize,
            animateBothLayers: localStorage.getItem('sq1AnimBothLayers') !== null ? localStorage.getItem('sq1AnimBothLayers') === 'true' : true
        };

        const css = `
        <style>
            #${modalId} {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
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
                background: white;
                border-radius: 18px;
                max-width: min(800px, 90vw);
                width: 100%;
                min-height: 20vh;
                max-height: 80vh;
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
                background: white;
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
                border-bottom: 1px solid #e0e0e0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            #${modalId} .close-btn {
                background: #f0f0f0;
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
                background: #e0e0e0;
            }
            #${modalId} .menu-btn {
                background: #f0f0f0;
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
                background: #e0e0e0;
            }
            #${modalId} .sidebar {
                position: absolute;
                left: 0;
                top: 0;
                width: 280px;
                height: 100%;
                background: #f8f9fa;
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
                background: #f1f1f1;
            }
            #${modalId} .sidebar::-webkit-scrollbar-thumb {
                background: #888;
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
                color: #000000 !important;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 2px solid #e0e0e0;
            }
            #${modalId} .sidebar-section {
                margin-bottom: 25px;
            }
            #${modalId} .sidebar-section label {
                display: block;
                font-size: 14px;
                color: #000000 !important;
                margin-bottom: 8px;
                font-weight: 600;
            }
            #${modalId} .sidebar-section input[type="range"] {
                width: 100%;
                height: 6px;
                border-radius: 3px;
                background: #e0e0e0;
                outline: none;
                -webkit-appearance: none;
            }
            #${modalId} .sidebar-section input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #2196F3;
                cursor: pointer;
            }
            #${modalId} .sidebar-section input[type="range"]::-moz-range-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #2196F3;
                cursor: pointer;
                border: none;
            }
            #${modalId} .sidebar-value {
                display: block;
                text-align: right;
                font-size: 14px;
                color: #000000 !important;
                margin-top: 4px;
                font-weight: 500;
            }
            #${modalId} .toggle-container {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            #${modalId} .toggle-container span {
                color: #000000 !important;
                font-weight: 500;
            }
            #${modalId} .toggle-switch {
                position: relative;
                width: 48px;
                height: 24px;
                background: #ccc;
                border-radius: 12px;
                cursor: pointer;
                transition: background 0.3s;
                flex-shrink: 0;
            }
            #${modalId} .toggle-switch.active {
                background: #2196F3;
            }
            #${modalId} .toggle-slider {
                position: absolute;
                top: 2px;
                left: 2px;
                width: 20px;
                height: 20px;
                background: white;
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
                background: #f5f5f5;
                border-radius: 6px;
                margin: 15px 0;
                text-align: center;
                color: #333;
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
                color: #555;
            }
            #${modalId} .slider-group input[type="range"] {
                flex: 1;
                height: 6px;
                border-radius: 3px;
                background: #e0e0e0;
                outline: none;
            }
            #${modalId} .slider-group input[type="range"]::-webkit-slider-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #2196F3;
                cursor: pointer;
            }
            #${modalId} .slider-group input[type="range"]::-moz-range-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #2196F3;
                cursor: pointer;
                border: none;
            }
            #${modalId} .slider-group span {
                min-width: 60px;
                text-align: right;
                font-size: 14px;
                color: #555;
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
                background: #fafafa;
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
                background: #f0f0f0;
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
                background: #e0e0e0;
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
                background: #e0e0e0;
                outline: none;
            }
            #${modalId} .step-slider-container input[type="range"]::-webkit-slider-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #2196F3;
                cursor: pointer;
            }
            #${modalId} .step-slider-container input[type="range"]::-moz-range-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #2196F3;
                cursor: pointer;
                border: none;
            }
            #${modalId} .step-counter {
    text-align: center;
    font-size: 14px;
    color: #666;
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
                <div style="font-size: 16px; font-weight: bold; color: #333;">${caseName} (${parity})</div>
                <div style="font-size: 11px; color: #999; font-family: monospace;">${algorithm.length > 50 ? algorithm.substring(0, 50) + '...' : algorithm}</div>
            ` : `
                <div style="font-size: 18px; font-weight: bold; color: #333;">Algorithm Viewer</div>
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
                            <label>Animate Both Layers Together</label>
                            <div class="toggle-container">
                                <div class="toggle-switch ${state.animateBothLayers ? 'active' : ''}" id="${modalId}-both-layers-toggle">
                                    <div class="toggle-slider"></div>
                                </div>
                                <span style="font-size: 14px; color: #666;" id="${modalId}-toggle-label">${state.animateBothLayers ? 'On' : 'Off'}</span>
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
            const visualization = renderVisualization(hex, state.colorScheme, state.imageSize);
            const highlightedAlg = renderAlgorithm(step, state.originalAlg, state.steps, state.currentStep, state.animateBothLayers);

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
            closeBtn.onclick = () => {
                document.getElementById(modalId).remove();
                document.body.classList.remove('modal-open');
                document.body.style.top = '';
                window.scrollTo(0, window.modalScrollY || 0);
            };

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

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
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
                    wrapper.style.gap = '20px';

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
                        wrapper.style.gap = '20px';

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