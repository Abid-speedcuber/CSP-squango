/* ==== FILE: js/tools/animate-alg.js ==== */

import { SQG } from '../browser-api.js?v=esm-20260511-2';

(function () {
    'use strict';

    const algorithmCore = SQG.algAnimation;
    const escapeHTML = SQG.dom
        ? SQG.dom.escapeHTML
        : value => String(value ?? '');

    if (!algorithmCore) {
        console.error('[Square1AlgorithmViewer] Missing SQG.algAnimation core module.');
        return;
    }

    const generateSteps = algorithmCore.generateSteps;
    const getHexForStep = algorithmCore.getHexForStep;
    const isZeroMove = algorithmCore.isZeroMove;

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
                html += escapeHTML(originalAlg.substring(position, s.highlightStart));
            }

            const tokenText = originalAlg.substring(s.highlightStart, s.highlightEnd);
            const tokenHTML = escapeHTML(tokenText);
            const isCurrent = index === currentStepIndex;
            const isZero = isZeroMove(s, originalAlg, animateBothLayers);

            // Make token clickable unless it's a zero move
            if (!isZero) {
                html += `<span class="clickable-token ${isCurrent ? 'current-token' : ''}" data-step-index="${index}" style="cursor: pointer; padding: 2px 4px; border-radius: 2px; ${isCurrent ? 'background: var(--hover-bg); color: var(--text-primary);' : ''} display: inline-block; margin: 0 1px;">${tokenHTML}</span>`;
            } else {
                // Zero moves are not clickable
                html += `<span style="padding: 2px 4px; opacity: 0.4; display: inline-block; margin: 0 1px;">${tokenHTML}</span>`;
            }

            position = s.highlightEnd;
        });

        // Add any remaining text
        if (position < originalAlg.length) {
            html += escapeHTML(originalAlg.substring(position));
        }

        return html;
    }

    function renderVisualization(hex, colorScheme, imageSize) {
        const visualizer = window.Square1Visualizer || window.Square1VisualizerLibraryWithSillyNames;
        if (!visualizer) {
            return '<div style="color: var(--alg-invalid-color); font-style: italic;">draw-scramble.js not found</div>';
        }

        try {
            const hexCode = hex.tlHex + '|' + hex.blHex;
            const svgHtml = visualizer.visualizeFromHexCode(
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
            return '<div style="color: var(--alg-invalid-color); font-style: italic;">Error rendering: ' + escapeHTML(e.message) + '</div>';
        }
    }

    function getSvgOrigin(svg, fallbackSize) {
        const originX = parseFloat(svg.getAttribute('data-origin-x'));
        const originY = parseFloat(svg.getAttribute('data-origin-y'));
        if (Number.isFinite(originX) && Number.isFinite(originY)) {
            return { x: originX, y: originY };
        }

        const viewBox = (svg.getAttribute('viewBox') || '').trim().split(/\s+/).map(Number);
        if (viewBox.length === 4 && viewBox.every(Number.isFinite)) {
            return { x: viewBox[0] + viewBox[2] / 2, y: viewBox[1] + viewBox[3] / 2 };
        }

        const size = parseFloat(svg.getAttribute('width')) || fallbackSize;
        return { x: size / 2, y: size / 2 };
    }

    // ========================================
    // MAIN VIEWER CREATION FUNCTION
    // ========================================
    function createViewer(algorithm, colors = {}, caseName = '', parity = '') {
        const modalId = 'sq1-viewer-modal-' + Date.now();

        const colorScheme = {
            topColor: colors.topColor || '#474747',
            bottomColor: colors.bottomColor || '#FFFFFF',
            frontColor: colors.frontColor || '#CC0000',
            rightColor: colors.rightColor || '#00AA00',
            backColor: colors.backColor || '#FF8C00',
            leftColor: colors.leftColor || '#0080FF'
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
        <div id="${modalId}">
            <div class="modal-content">
                <div class="modal-header">
    <div style="display: flex; align-items: center; gap: 12px;">
        <button class="menu-btn" id="${modalId}-menu-btn">☰</button>
        <div style="display: flex; flex-direction: column; gap: 2px;">
            ${caseName && parity ? `
                <div style="font-size: 16px; font-weight: bold; color: var(--text-primary);">${escapeHTML(caseName)} (${escapeHTML(parity)})</div>
                <div style="font-size: 11px; color: var(--text-muted); font-family: monospace;">${escapeHTML(algorithm.length > 50 ? algorithm.substring(0, 50) + '...' : algorithm)}</div>
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
            const modalRoot = document.getElementById(modalId);
            const close = () => {
                closeModalWithHistory(() => {
                    modalRoot.remove();
                    document.body.classList.remove('modal-open');
                    document.body.style.top = '';
                    window.scrollTo(0, window.modalScrollY || 0);
                });
            };
            closeBtn.onclick = close;
            modalRoot.addEventListener('click', (event) => {
                if (event.target === modalRoot) close();
            });
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

                            const topOrigin = getSvgOrigin(topSvg, state.imageSize);
                            const bottomOrigin = getSvgOrigin(bottomSvg, state.imageSize);
                            const topCenterX = topOrigin.x;
                            const topCenterY = topOrigin.y;
                            const bottomCenterX = bottomOrigin.x;
                            const bottomCenterY = bottomOrigin.y;

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

                if (topSvg && bottomSvg) {
                    const topPieces = topSvg.querySelectorAll('polygon, line.corner-detail');
                    const bottomPieces = bottomSvg.querySelectorAll('polygon, line.corner-detail');

                    const topOrigin = getSvgOrigin(topSvg, state.imageSize);
                    const bottomOrigin = getSvgOrigin(bottomSvg, state.imageSize);
                    const topCenterX = topOrigin.x;
                    const topCenterY = topOrigin.y;
                    const bottomCenterX = bottomOrigin.x;
                    const bottomCenterY = bottomOrigin.y;

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
