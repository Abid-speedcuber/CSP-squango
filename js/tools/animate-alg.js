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
    function parseScramble(scramble) {
        const moves = [];
        let i = 0;
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

    function sq1AlgToHex(scramble) {
        let tlHex = '011233455677';
        let blHex = '998bbaddcffe';

        const moves = parseScramble(scramble);

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
    function generateSteps(alg) {
        const steps = [];
        const chars = alg.split('');
        let position = 0;

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

        steps.push({
            position: alg.length,
            highlightStart: alg.length,
            highlightEnd: alg.length,
            currentAlg: '',
            description: 'Solved state'
        });

        let firstNonZeroIndex = 0;
        for (let i = 0; i < steps.length; i++) {
            if (!isZeroMove(steps[i], alg)) {
                firstNonZeroIndex = i;
                break;
            }
        }

        return steps.slice(firstNonZeroIndex);
    }

    function getHexForStep(step) {
        try {
            if (step.currentAlg.trim() === '' || step.currentAlg === '(0,0)') {
                return { tlHex: '011233455677', blHex: '998bbaddcffe' };
            }
            const inverted = invertScramble(step.currentAlg);
            return sq1AlgToHex(inverted);
        } catch (e) {
            return { tlHex: '011233455677', blHex: '998bbaddcffe' };
        }
    }

    function isZeroMove(step, originalAlg) {
        const highlighted = originalAlg.substring(step.highlightStart, step.highlightEnd);

        if (highlighted.includes('/')) {
            return false;
        }

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
    function renderAlgorithm(step, originalAlg) {
        if (step.highlightStart === -1) {
            return originalAlg;
        }

        const beforeHighlight = originalAlg.substring(0, step.highlightStart);
        const highlighted = originalAlg.substring(step.highlightStart, step.highlightEnd);
        const afterHighlight = originalAlg.substring(step.highlightEnd);

        return beforeHighlight + '<span style="background: #ff9800; color: #000; padding: 2px 4px; border-radius: 2px; font-weight: bold;">' + highlighted + '</span>' + afterHighlight;
    }

    function renderVisualization(hex, colorScheme) {
        if (typeof window.Square1VisualizerLibraryWithSillyNames === 'undefined') {
            return '<div style="color: #ff6b6b; font-style: italic;">draw-scramble.js not found</div>';
        }

        try {
            const hexCode = hex.tlHex + '|' + hex.blHex;
            const svgHtml = window.Square1VisualizerLibraryWithSillyNames.visualizeFromHexCodePlease(
                hexCode,
                200,
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
    function createViewer(algorithm, colors = {}) {
        const modalId = 'sq1-viewer-modal-' + Date.now();

        const colorScheme = {
            topColor: colors.topColor || '#000000',
            bottomColor: colors.bottomColor || '#FFFFFF',
            frontColor: colors.frontColor || '#CC0000',
            rightColor: colors.rightColor || '#00AA00',
            backColor: colors.backColor || '#FF8C00',
            leftColor: colors.leftColor || '#0066CC'
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
                z-index: 999999;
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: Arial, sans-serif;
            }
            #${modalId} .modal-content {
                background: white;
                border-radius: 12px;
                max-width: min(800px, 90vw);
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                position: relative;
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
                border-radius: 6px;
                padding: 8px 16px;
                cursor: pointer;
                font-size: 16px;
                transition: background 0.2s;
            }
            #${modalId} .close-btn:hover {
                background: #e0e0e0;
            }
            #${modalId} .modal-body {
                padding: 20px;
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
                margin: 20px 0;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 10px;
            }
            #${modalId} .nav-btn {
                background: #f0f0f0;
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                font-size: 20px;
                cursor: pointer;
                transition: background 0.2s;
                flex-shrink: 0;
            }
            #${modalId} .nav-btn:hover:not(:disabled) {
                background: #e0e0e0;
            }
            #${modalId} .nav-btn:disabled {
                opacity: 0.3;
                cursor: not-allowed;
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
                border-radius: 6px;
                padding: 10px 20px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
                min-width: 100px;
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
        </style>
    `;

        const html = `
        ${css}
        <div id="${modalId}">
            <div class="modal-content">
                <div class="modal-header">
                    <div style="font-size: 18px; font-weight: bold; color: #333;">Algorithm Viewer</div>
                    <button class="close-btn" onclick="document.getElementById('${modalId}').remove()">✕ Close</button>
                </div>
                <div class="modal-body" id="${modalId}-body">
                    <!-- Content will be rendered here -->
                </div>
            </div>
        </div>
    `;

        // Initialize state
        const state = {
            originalAlg: algorithm,
            steps: generateSteps(algorithm),
            currentStep: 0,
            animationSpeed: 1.0,
            autoRunDelay: 200,
            isAnimating: false,
            isAutoRunning: false,
            autoRunDirection: 'next',
            colorScheme: colorScheme
        };

        // Render function
        function render() {
            const step = state.steps[state.currentStep];
            const hex = getHexForStep(step);
            const visualization = renderVisualization(hex, state.colorScheme);
            const highlightedAlg = renderAlgorithm(step, state.originalAlg);

            const bodyHtml = `
            <div class="algorithm-display">${state.originalAlg}</div>
            
            <div class="slider-group">
                <label>Animation Speed:</label>
                <input type="range" id="${modalId}-speed" min="0.2" max="2" step="0.1" value="${state.animationSpeed}">
                <span id="${modalId}-speed-val">${state.animationSpeed.toFixed(1)}x</span>
            </div>

            <div class="slider-group">
                <label>Auto Delay:</label>
                <input type="range" id="${modalId}-delay" min="0" max="1000" step="50" value="${state.autoRunDelay}">
                <span id="${modalId}-delay-val">${state.autoRunDelay}ms</span>
            </div>

            <div class="visualization-area">
                <button class="nav-btn" id="${modalId}-prev" ${state.currentStep === 0 ? 'disabled' : ''}>◀</button>
                <div class="visualization-container">${visualization}</div>
                <button class="nav-btn" id="${modalId}-next" ${state.currentStep === state.steps.length - 1 ? 'disabled' : ''}>▶</button>
            </div>

            <div class="highlighted-alg">${highlightedAlg}</div>

            <div class="control-buttons">
                <button class="control-btn" id="${modalId}-auto-prev" ${state.isAutoRunning ? 'disabled' : ''}>◄◄ Auto Backward</button>
                <button class="control-btn" id="${modalId}-stop" ${!state.isAutoRunning ? 'disabled' : ''}>⏸ Pause</button>
                <button class="control-btn" id="${modalId}-auto-next" ${state.isAutoRunning ? 'disabled' : ''}>Auto Forward ►►</button>
            </div>

            <div class="step-counter">Step ${state.currentStep + 1} of ${state.steps.length}</div>

            <div class="step-slider-container">
                <input type="range" id="${modalId}-step-slider" min="0" max="${state.steps.length - 1}" value="${state.currentStep}">
            </div>
        `;

            document.getElementById(`${modalId}-body`).innerHTML = bodyHtml;

            // Attach event listeners
            attachEventListeners();
        }

        function attachEventListeners() {
            // Speed slider
            const speedSlider = document.getElementById(`${modalId}-speed`);
            const speedVal = document.getElementById(`${modalId}-speed-val`);
            speedSlider.oninput = (e) => {
                state.animationSpeed = parseFloat(e.target.value);
                speedVal.textContent = state.animationSpeed.toFixed(1) + 'x';
            };

            // Delay slider
            const delaySlider = document.getElementById(`${modalId}-delay`);
            const delayVal = document.getElementById(`${modalId}-delay-val`);
            delaySlider.oninput = (e) => {
                state.autoRunDelay = parseInt(e.target.value);
                delayVal.textContent = state.autoRunDelay + 'ms';
            };

            // Navigation buttons
            document.getElementById(`${modalId}-prev`).onclick = () => {
                if (state.currentStep > 0 && !state.isAnimating && !state.isAutoRunning) {
                    state.currentStep--;
                    animateStep('prev');
                }
            };

            document.getElementById(`${modalId}-next`).onclick = () => {
                if (state.currentStep < state.steps.length - 1 && !state.isAnimating && !state.isAutoRunning) {
                    state.currentStep++;
                    animateStep('next');
                }
            };

            // Auto run buttons
            document.getElementById(`${modalId}-auto-prev`).onclick = () => {
                if (!state.isAnimating && !state.isAutoRunning && state.currentStep > 0) {
                    state.isAutoRunning = true;
                    state.autoRunDirection = 'prev';
                    render();
                    autoRunNextStep();
                }
            };

            document.getElementById(`${modalId}-auto-next`).onclick = () => {
                if (!state.isAnimating && !state.isAutoRunning && state.currentStep < state.steps.length - 1) {
                    state.isAutoRunning = true;
                    state.autoRunDirection = 'next';
                    render();
                    autoRunNextStep();
                }
            };

            document.getElementById(`${modalId}-stop`).onclick = () => {
                state.isAutoRunning = false;
                render();
            };

            // Step slider
            const stepSlider = document.getElementById(`${modalId}-step-slider`);
            stepSlider.oninput = (e) => {
                if (!state.isAnimating && !state.isAutoRunning) {
                    state.currentStep = parseInt(e.target.value);
                    render();
                }
            };
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
                const topPieces = topSvg.querySelectorAll('polygon, circle:last-child');
                const bottomPieces = bottomSvg.querySelectorAll('polygon, circle:last-child');

                const svgSize = 200;
                const unit10vh = svgSize * 0.4;
                const radiusOuter = unit10vh * 0.7;
                const ringRadius = radiusOuter + (unit10vh * 0.4);

                const topCenterX = svgSize / 2;
                const topCenterY = svgSize / 2;
                const bottomCenterX = svgSize / 2;
                const bottomCenterY = svgSize / 2;

                if (isSlashToken) {
                    const duration = 500 / state.animationSpeed;

                    let beforeHex, afterHex;

                    if (direction === 'next') {
                        const prevStep = state.steps[state.currentStep - 1];
                        beforeHex = prevStep ? getHexForStep(prevStep) : getHexForStep(step);
                        afterHex = getHexForStep(step);
                    } else {
                        beforeHex = getHexForStep(step);
                        const nextStep = state.steps[state.currentStep + 1];
                        afterHex = nextStep ? getHexForStep(nextStep) : getHexForStep(step);
                    }

                    const beforeSvgHtml = renderVisualization(beforeHex, state.colorScheme);
                    const afterSvgHtml = renderVisualization(afterHex, state.colorScheme);

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

                        const currentIsZero = isZeroMove(state.steps[state.currentStep], state.originalAlg);

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

                        const currentIsZero = isZeroMove(state.steps[state.currentStep], state.originalAlg);

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

        // Insert HTML and render initial state
        setTimeout(() => {
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