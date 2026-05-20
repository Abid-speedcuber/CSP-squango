import { createSquare1Visualizer, sq1vis } from './drawScrambleCustomization.js';
import { LinkedStrokeWidthSlider } from './linkedStrokeWidthSlider.js';

const PLACEHOLDER_HEX = '011233455677|998bbaddcffe';
var schemePickrs = {};
var fillPickr = null;
let styleControlInstances = [];

let isCustomMode = false;
let classicalSnapshot = null;
let customSnapshot = null;
let customMuteActive = false;
let classicalMuteActive = false;

function buildSchemeGrid() {
    if (typeof Pickr === 'undefined') { console.error('Pickr not loaded'); return; }
    // Destroy old pickr instances to avoid leaks
    for (const [id, p] of Object.entries(schemePickrs)) { try { p.destroyAndRemove(); } catch(e){} delete schemePickrs[id]; }

    const grid = document.getElementById('scheme-grid');
    grid.innerHTML = '';
    const slots = sq1vis.getColorSlots();
    const scheme = sq1vis.getColorScheme();
    slots.forEach(slot => {
        const row = document.createElement('div');
        row.className = 'scheme-row';
        row.innerHTML = `
          <span class="scheme-face-label">${slot.label}</span>
          <div class="scheme-pickr-wrap" id="pickr-wrap-${slot.id}"></div>`;
        grid.appendChild(row);

        const initial = scheme[slot.id] === 'transparent' ? 'rgba(0,0,0,0)' : scheme[slot.id];
        const p = createPickr(`#pickr-wrap-${slot.id}`, initial, (color) => {
            sq1vis.setColorScheme({ [slot.id]: color });
            paintPickrButton(p, color);
            draw();
            saveSettings();
        });
        repaintPickrButtonAfterInit(p, initial);
        schemePickrs[slot.id] = p;
    });
}

function paintPickrButton(pickr, color) {
    const btn = pickr.getRoot().button;
    if (!btn) return;
    const isTransparent = isTransparentColor(color);
    const resolved = isTransparent ? 'rgba(0,0,0,0)' : color;
    btn.style.setProperty('--pcr-color', resolved);
    btn.classList.toggle('clear', isTransparent);
}

function repaintPickrButtonAfterInit(pickr, color) {
    paintPickrButton(pickr, color);
    pickr.on('init', () => paintPickrButton(pickr, color));
    requestAnimationFrame(() => paintPickrButton(pickr, color));
    setTimeout(() => paintPickrButton(pickr, color), 50);
}

function isTransparentColor(value) {
    const color = String(value ?? '').trim().toLowerCase().replace(/\s+/g, '');
    if (!color) return true;
    if (color === 'transparent' || color === '#0000' || color === '#00000000') return true;
    return /^rgba\([^)]*,0(?:\.0+)?\)$/.test(color);
}

function isUsableColor(value) {
    const color = String(value ?? '').trim();
    if (!color) return false;
    if (isTransparentColor(color)) return true;
    if (window.CSS?.supports?.('color', color)) return true;
    const probe = document.createElement('span');
    probe.style.color = '';
    probe.style.color = color;
    return !!probe.style.color;
}

function sanitizeSavedScheme(saved) {
    const sanitized = {};
    let hasVisibleColor = false;

    for (const slot of sq1vis.getColorSlots()) {
        const savedColor = saved?.[slot.id];
        const color = isUsableColor(savedColor) ? savedColor : slot.default;
        sanitized[slot.id] = color;
        if (!isTransparentColor(color)) hasVisibleColor = true;
    }

    return hasVisibleColor ? sanitized : null;
}

function createPlaceholderVisualizer(showSides) {
    const placeholderVis = createSquare1Visualizer();
    placeholderVis.setActiveStyle(sq1vis.getActiveStyleIndex());
    placeholderVis.setShowSideColors(showSides);
    placeholderVis.setStyleSettings(sq1vis.getStyleSettings());
    return placeholderVis;
}

function getPlaceholderSVG(size, gap, isVertical, showSlice, showSides) {
    const placeholderVis = createPlaceholderVisualizer(showSides);
    return placeholderVis.getSVG(PLACEHOLDER_HEX, size, gap, true, isVertical, showSlice, showSides);
}

// ── Style dropdown ──────────────────────────────────────
function buildStyleDropdown() {
    const styles = sq1vis.getStyles();
    const select = document.getElementById('svg-style-select');
    select.innerHTML = '';
    styles.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.index;
        opt.textContent = s.name;
        select.appendChild(opt);
    });
    select.value = sq1vis.getActiveStyleIndex();
    select.addEventListener('change', () => {
        sq1vis.setActiveStyle(parseInt(select.value));
        updateStyleToggles();
        buildSchemeGrid();
        draw();
    });
}

function updateStyleToggles() {
    const style = sq1vis.getActiveStyle();
    const hideSidesRow = document.getElementById('hide-sides-row');
    const hideSliceRow = document.getElementById('hide-slice-row');
    hideSidesRow.style.display = style.hidableSideColor  ? '' : 'none';
    hideSliceRow.style.display = style.hasSliceIndicator ? '' : 'none';
    if (!style.hidableSideColor) {
        document.getElementById('hide-sides').checked = false;
        sq1vis.setShowSideColors(true);
    }
    buildStyleSliderControls();
}

function buildStyleSliderControls() {
    const container = document.getElementById('style-slider-controls');
    const controls = sq1vis.getStyleControls();
    const settings = sq1vis.getStyleSettings();
    styleControlInstances.forEach(instance => instance.destroy?.());
    styleControlInstances = [];
    container.innerHTML = '';

    controls.forEach(control => {
        if (control.type === 'linkedStrokeWidthSlider') {
            buildLinkedStrokeWidthControl(container, control, settings);
            return;
        }

        const value = settings[control.id] ?? control.default;
        const decimals = control.decimals ?? decimalPlaces(control.step);
        const field = document.createElement('div');
        field.className = 'field';
        field.innerHTML = `
          <label class="field-label">${control.label}</label>
          <div class="slider-combo">
            <input type="range" id="style-slider-${control.id}" min="${control.min}" max="${control.max}" step="${control.step}" value="${value}" />
            <input type="number" id="style-input-${control.id}" min="${control.min}" max="${control.max}" step="${control.step}" value="${Number(value).toFixed(decimals)}" />
          </div>`;
        container.appendChild(field);

        const slider = field.querySelector(`#style-slider-${control.id}`);
        const input = field.querySelector(`#style-input-${control.id}`);
        const apply = rawValue => {
            const next = Number(rawValue);
            if (Number.isNaN(next)) return;
            slider.value = next;
            input.value = next.toFixed(decimals);
            sq1vis.setStyleSettings({ [control.id]: next });
            draw();
            saveSettings();
        };
        slider.addEventListener('input', () => apply(slider.value));
        input.addEventListener('input', () => apply(input.value));
    });
}

function buildLinkedStrokeWidthControl(container, control, settings) {
    const partConfigs = {};
    for (const part of ['top', 'middle', 'bottom']) {
        const config = control.parts[part];
        partConfigs[part] = {
            ...config,
            value: settings[config.id] ?? config.default,
            decimals: config.decimals ?? decimalPlaces(config.step),
        };
    }

    const field = document.createElement('div');
    field.className = 'field';
    field.dataset.linkedWidthControl = '';
    field.innerHTML = `
      <label class="field-label">${control.label}</label>
      <div class="linked-width-slider" title="${control.tooltip ?? control.label}">
        <div class="linked-width-track"><div class="linked-width-ticks"></div></div>
        <div class="linked-width-bridge" data-width-bridge></div>
        <div class="linked-width-handle linked-width-handle-top linked" data-width-part="top" title="${partConfigs.top.tooltip}">
          <div class="linked-width-shape"></div>
        </div>
        <div class="linked-width-handle linked-width-handle-middle" data-width-part="middle" title="${partConfigs.middle.tooltip}">
          <div class="linked-width-middle-shape"></div>
        </div>
        <div class="linked-width-handle linked-width-handle-bottom linked" data-width-part="bottom" title="${partConfigs.bottom.tooltip}">
          <div class="linked-width-shape"></div>
        </div>
      </div>`;
    container.appendChild(field);

    const instance = new LinkedStrokeWidthSlider(field.querySelector('.linked-width-slider'), {
        parts: partConfigs,
        onChange: next => {
            sq1vis.setStyleSettings(next);
            draw();
            saveSettings();
        },
    });
    styleControlInstances.push(instance);
}

function decimalPlaces(step) {
    const text = String(step);
    return text.includes('.') ? text.split('.')[1].length : 0;
}

    // ── Build sidebar DOM dynamically (prevents flash of wrong content) ──
function buildSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = `
      <div class="section">
        <div class="section-title">Designs</div>
        <div class="field">
          <select id="svg-style-select" class="style-select"></select>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Display</div>

        <div class="field">
          <label class="field-label">Image Size</label>
          <div class="slider-combo">
            <input type="range" id="size-slider" min="100" max="750" step="5" value="400" />
            <input type="number" id="size-input" min="100" max="750" value="400" />
          </div>
        </div>

        <div class="field">
          <label class="field-label">Layer Distance</label>
          <div class="slider-combo">
            <input type="range" id="gap-slider" min="0" max="200" step="1" value="100" />
            <input type="number" id="gap-input" min="0" max="200" value="100" />
          </div>
        </div>

        <div id="style-slider-controls"></div>

        <div class="field">
          <label class="field-label">Orientation</label>
          <div class="seg-control">
            <label>
              <input type="radio" name="orientation" value="horizontal" checked />
              <span class="seg-icon">\u21D4</span> Horizontal
            </label>
            <label>
              <input type="radio" name="orientation" value="vertical" />
              <span class="seg-icon">\u21D5</span> Vertical
            </label>
          </div>
        </div>

        <div class="toggle-row" id="hide-slice-row">
          <span class="toggle-label">Hide slice indicator</span>
          <label class="toggle-switch">
            <input type="checkbox" id="hide-slice" />
            <span class="toggle-track"></span>
          </label>
        </div>
        <div class="toggle-row" id="hide-sides-row">
          <span class="toggle-label">Hide side colors</span>
          <label class="toggle-switch">
            <input type="checkbox" id="hide-sides" />
            <span class="toggle-track"></span>
          </label>
        </div>

        <button class="btn btn-secondary" id="display-reset-default">Reset to Default</button>
      </div>

      <div class="section">
        <div class="section-title section-title-toggle" id="color-scheme-toggle">
          Color Scheme <span class="section-arrow">\u25B2</span>
        </div>
        <div id="color-scheme-body">
          <div class="scheme-mode-seg">
            <button class="scheme-mode-btn active" id="scheme-mode-classical" data-mode="classical">Classical</button>
            <button class="scheme-mode-btn" id="scheme-mode-custom" data-mode="custom">Custom</button>
          </div>
          <div id="scheme-classical-panel">
            <div id="scheme-grid"></div>
            <button class="btn btn-secondary" id="scheme-reset-default" style="margin-top:.75rem;font-size:.7rem;padding:.45rem .8rem;letter-spacing:.04em;">Reset to Default</button>
          </div>
          <div id="scheme-custom-panel" style="display:none;"></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Export</div>

        <div class="export-tab-group">
          <div class="export-tab-label">Layers</div>
          <div class="export-tab-row">
            <button class="export-tab active" data-group="layer" data-val="both">Both</button>
            <button class="export-tab" data-group="layer" data-val="top">Top</button>
            <button class="export-tab" data-group="layer" data-val="bottom">Bottom</button>
          </div>
        </div>

        <div class="export-tab-group">
          <div class="export-tab-label">Format</div>
          <div class="export-tab-row">
            <button class="export-tab" data-group="fmt" data-val="svg">SVG</button>
            <button class="export-tab active" data-group="fmt" data-val="png">PNG</button>
            <button class="export-tab" data-group="fmt" data-val="jpeg">JPEG</button>
            <button class="export-tab" data-group="fmt" data-val="bmp">BMP</button>
          </div>
        </div>

        <div class="export-action-row">
          <button class="btn btn-export" id="do-export">Download Image</button>
          <button class="btn btn-export" id="do-copy">Copy to Clipboard</button>
        </div>
      </div>
    `;

    // Prevent sidebar flash — if sidebar should be open, remove hidden immediately without transition
    try {
        const s = JSON.parse(localStorage.getItem('sq1vis_settings'));
        const isMobile = window.innerWidth <= 768;
        const shouldHide = s && s.sidebarHidden != null ? s.sidebarHidden : isMobile;
        if (!shouldHide) {
            sidebar.classList.add('no-transition');
            sidebar.classList.remove('hidden');
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    sidebar.classList.remove('no-transition');
                });
            });
        }
    } catch (e) {}
}

buildSidebar();

document.getElementById('color-scheme-toggle').addEventListener('click', () => {
    const body = document.getElementById('color-scheme-body');
    const arrow = document.querySelector('#color-scheme-toggle .section-arrow');
    const open = body.style.display !== 'none';
    body.style.display = open ? 'none' : 'block';
    arrow.textContent = open ? '▲' : '▼';
});

/* fill piece color stuff */
// ── Classical / Custom toggle ──────────────────────────
const classicalBtn = document.getElementById('scheme-mode-classical');
const customBtn = document.getElementById('scheme-mode-custom');
const classicalPanel = document.getElementById('scheme-classical-panel');
const customPanel = document.getElementById('scheme-custom-panel');
const toolbar = document.getElementById('custom-toolbar');

function setSchemeMode(isCustom, { redraw = true, persist = true } = {}) {
    classicalBtn.classList.toggle('active', !isCustom);
    customBtn.classList.toggle('active', isCustom);
    classicalPanel.style.display = isCustom ? 'none' : '';
    customPanel.style.display    = isCustom ? '' : 'none';
    toolbar.style.display        = isCustom ? '' : 'none';

    if (isCustom && !isCustomMode) {
        // Switching TO custom: save classical state, restore custom state
        // Only overwrite classicalSnapshot if it hasn't already been seeded by loadSettings
        if (!classicalSnapshot) {
            classicalSnapshot = {
                piecesColors: JSON.parse(JSON.stringify(sq1vis.getPiecesColors())),
                mute: muteActive,
            };
        }
        classicalMuteActive = classicalSnapshot.mute;
        if (customSnapshot) {
            sq1vis.setPiecesColors(customSnapshot.piecesColors);
            muteActive = customSnapshot.mute;
        } else {
            muteActive = customMuteActive;
        }
        muteBtn.classList.toggle('active', muteActive);
        isCustomMode = true;
    } else if (!isCustom && isCustomMode) {
        // Switching TO classical: save custom state, restore classical
        customSnapshot = {
            piecesColors: JSON.parse(JSON.stringify(sq1vis.getPiecesColors())),
            mute: muteActive,
        };
        customMuteActive = muteActive;
        if (fillModeActive) fillModeBtn.click();
        if (fillResetActive) unfillBtn.click();
        if (classicalSnapshot) {
            sq1vis.setPiecesColors(classicalSnapshot.piecesColors);
            muteActive = classicalSnapshot.mute;
            muteBtn.classList.toggle('active', muteActive);
        }
        isCustomMode = false;
    }

    if (redraw) draw();
    if (persist) saveSettings();
}

[classicalBtn, customBtn].forEach(btn => {
    btn.addEventListener('click', () => {
        setSchemeMode(btn.dataset.mode === 'custom');
    });
});

// Keys 1/2/3 select recent colors
document.addEventListener('keydown', e => {
    if (['1','2','3'].includes(e.key) && !e.ctrlKey && !e.metaKey && isCustomMode) {
        const idx = parseInt(e.key) - 1;
        if (lastUsedColors[idx]) {
            const slot = document.getElementById(`ctb-recent-${idx}`);
            selectRecentColor(lastUsedColors[idx], slot);
        }
    }
});

// ── Undo / Redo disabled state helpers ────────────────
// ── Undo / Redo history ────────────────────────────
const undoStack = [];
const redoStack = [];

function snapshotColors() {
    const pc = sq1vis.getPiecesColors();
    return JSON.stringify({
        edgeColors:   pc.edgeColors,
        cornerColors: pc.cornerColors,
        sliceColors:  pc.sliceColors,
    });
}

function pushUndo() {
    undoStack.push(snapshotColors());
    redoStack.length = 0;
    updateUndoRedo(true, false);
}

function applySnapshot(snap) {
    sq1vis.setPiecesColors(JSON.parse(snap));
}

function updateUndoRedo(canUndo, canRedo) {
    document.getElementById('ctb-undo').disabled = !canUndo;
    document.getElementById('ctb-redo').disabled = !canRedo;
}

document.getElementById('ctb-undo').addEventListener('click', doUndo);
document.getElementById('ctb-redo').addEventListener('click', doRedo);

function doUndo() {
    if (!undoStack.length) return;
    redoStack.push(snapshotColors());
    applySnapshot(undoStack.pop());
    updateUndoRedo(!!undoStack.length, true);
    draw();
}

function doRedo() {
    if (!redoStack.length) return;
    undoStack.push(snapshotColors());
    applySnapshot(redoStack.pop());
    updateUndoRedo(true, !!redoStack.length);
    draw();
}

document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); doUndo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); doRedo(); }
});

const sidebar = document.querySelector('.sidebar');
const fillModeBtn = document.getElementById('fill-mode-btn');
const unfillBtn = document.getElementById('fill-unfill-btn');
const resetBtn = document.getElementById('fill-reset-btn');
const muteBtn = document.getElementById('fill-mute-btn');
const fillColorInput = { value: '#CC0000', _transparent: false };
const fillColorSwitch = { style: {} }; // replaced by Pickr

let fillModeActive = false;
let fillResetActive = false;
let muteActive = false;

function setFillColor(hex) {
    fillColorInput.value = hex;
    if (fillPickr) fillPickr.setColor(hex);
}

// Init fill Pickr (deferred so DOM is ready)
setTimeout(() => {
    fillPickr = createPickr('#fill-pickr-el', '#CC0000', (color) => {
        fillColorInput.value = color;
        updateLastUsed();
        if (!fillModeActive) activateFill();
    });
}, 0);
let exportLayer = 'both';
let exportFmt = 'png';
let febMode = 'download'; // 'download' or 'copy'
let lastUsedColors = [];
const lastUsedLimit = 3;

const canvasInner = document.getElementById('canvas-inner');
const viewportCanvas = document.getElementById('viewport-canvas');
const DEFAULT_LOADING_TIPS = [
    /*'Tip: right-click the mode button to cycle backward.',
    'Fun fact: Draw-a-Squan understands karn notation too.',
    'Hidden feature: Ctrl+S downloads the current image.',
    'Hidden feature: press Ctrl+C outside the input to copy the image.',
    'Tip: double-click the floating export button to switch between copy and download.',
    'Fun fact: bulk export can place squans directly into an XLSX file.',
    'Tip: turn on Fill Piece, then click stickers to recolor individual pieces.',
    'Hidden feature: recent fill colors can be reused with the 1, 2, and 3 keys.',*/
    ''
];
const LOADING_TIPS = Array.isArray(window.SQ1_LOADING_TIPS) && window.SQ1_LOADING_TIPS.some(t => t.trim())
    ? window.SQ1_LOADING_TIPS.filter(t => t.trim())
    : DEFAULT_LOADING_TIPS;
let initialWindowLoaded = document.readyState === 'complete';
let appInitialized = false;

function getInitialLoadingTip() {
    const existingTip = canvasInner.querySelector('.loading-placeholder .placeholder-text')?.textContent?.trim();
    return existingTip || getLoadingTip();
}

function getLoadingTip() {
    return LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)];
}

function showLoadingPlaceholder() {
    canvasInner.innerHTML = `
        <div class="placeholder loading-placeholder">
            <div class="placeholder-title">Loading...</div>
            <div class="placeholder-text">${getInitialLoadingTip()}</div>
        </div>`;
}

if (!initialWindowLoaded) {
    window.addEventListener('load', () => {
        initialWindowLoaded = true;
        draw();
    }, { once: true });
}

function createPickr(el, initialColor, onChange) {
    const safeInitialColor = initialColor || '#CC0000';
    const p = Pickr.create({
        el,
        theme: 'nano',
        default: safeInitialColor,
        defaultRepresentation: 'RGBA',
        components: {
            preview: true, opacity: true, hue: true,
            interaction: { hex: false, rgba: false, input: true, save: false, clear: false },
        },
    });
    p.on('change', (color) => {
        if (!color) { onChange('transparent'); return; }
        const rgba = color.toRGBA();
        const a = Math.round(rgba[3] * 100) / 100;
        const resolved = a === 0 ? 'transparent' : `rgba(${Math.round(rgba[0])},${Math.round(rgba[1])},${Math.round(rgba[2])},${a})`;
        p.applyColor(true);
        onChange(resolved);
    });
    p.on('show', () => {
        const btn = p.getRoot().button;
        console.log('[pickr show]', 'btn:', btn, 'classes before:', btn?.className);
        if (btn) {
            btn.classList.add('pcr-open');
            console.log('[pickr show]', 'classes after:', btn.className);
        } else {
            console.warn('[pickr show] no button found!');
        }
    });
    p.on('hide', () => {
        const c = p.getColor();
        if (!c) { onChange('transparent'); return; }
        const rgba = c.toRGBA();
        const a = Math.round(rgba[3] * 100) / 100;
        const resolved = a === 0 ? 'transparent' : `rgba(${Math.round(rgba[0])},${Math.round(rgba[1])},${Math.round(rgba[2])},${a})`;
        onChange(resolved);
        const btn = p.getRoot().button;
        console.log('[pickr hide]', 'btn:', btn, 'classes before:', btn?.className);
        if (btn) {
            btn.classList.remove('pcr-open');
            console.log('[pickr hide]', 'classes after:', btn.className);
        }
    });
    try { p.setColor(safeInitialColor, true); } catch (e) {}
    repaintPickrButtonAfterInit(p, safeInitialColor);
    return p;
}

function updateCanvasCursor() {
    if (fillModeActive) {
        const encoded = 'url("data:image/svg+xml,' + encodeURIComponent(window.CURSOR_SVG.fill.replace(/\n\s*/g, '')) + '") 1 31, crosshair';
        viewportCanvas.style.cursor = encoded;
    } else if (fillResetActive) {
        const encoded = 'url("data:image/svg+xml,' + encodeURIComponent(window.CURSOR_SVG.unfill.replace(/\n\s*/g, '')) + '") 1 7, crosshair';
        viewportCanvas.style.cursor = encoded;
    } else {
        viewportCanvas.style.cursor = '';
    }
}
/* ─── Sidebar toggle ──────────────────────────────── */
const hamburgerBtn = document.getElementById('hamburger-btn');
const floatingBtn = document.getElementById('floating-export-btn');
const febActionBtn = document.getElementById('feb-action-btn');
const febActionIcon = document.getElementById('feb-action-icon');
const febSplitBtn = document.getElementById('feb-split-btn');
const febDropdown = document.getElementById('feb-dropdown');

const isMobile = () => window.innerWidth <= 768;

function setSidebarOpen(open) {
    if (open) {
        sidebar.classList.remove('hidden');
        if (isMobile()) floatingBtn.style.display = 'none';
        else floatingBtn.style.display = 'none';
    } else {
        sidebar.classList.add('hidden');
        floatingBtn.style.display = 'flex';
    }
}

hamburgerBtn.addEventListener('click', () => {
    setSidebarOpen(sidebar.classList.contains('hidden'));
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', e => {
    if (!isMobile()) return;
    if (!sidebar.classList.contains('hidden') &&
        !sidebar.contains(e.target) &&
        e.target !== hamburgerBtn &&
        !hamburgerBtn.contains(e.target)) {
        setSidebarOpen(false);
    }
});

/* ─── Local Storage persistence ───────────────────── */
const LS_KEY = 'sq1vis_settings';

function saveSettings() {
    const settings = {
        // Display
        size: document.getElementById('size-input').value,
        gap: document.getElementById('gap-input').value,
        orientation: document.querySelector('input[name=orientation]:checked').value,
        hideSlice: document.getElementById('hide-slice').checked,
        hideSides: document.getElementById('hide-sides').checked,
        // Style
        styleIndex: sq1vis.getActiveStyleIndex(),
        styleSettings: (() => {
            const obj = {};
            const prevIdx = sq1vis.getActiveStyleIndex();
            const prevSides = sq1vis.getShowSideColors();
            for (const style of sq1vis.getStyles()) {
                sq1vis.setActiveStyle(style.index);
                obj[style.source] = sq1vis.getStyleSettings();
            }
            sq1vis.setActiveStyle(prevIdx);
            sq1vis.setShowSideColors(prevSides);
            return obj;
        })(),
        // Color scheme — save all overrides for all style/variant combos
        colorOverrides: (() => {
            const obj = {};
            for (const style of sq1vis.getStyles()) {
                for (const withSides of [true, false]) {
                    const key = `${style.source}_${withSides ? 'with' : 'without'}`;
                    // temporarily switch to read resolved colors
                    const prevIdx = sq1vis.getActiveStyleIndex();
                    const prevSides = sq1vis.getShowSideColors();
                    sq1vis.setActiveStyle(style.index);
                    sq1vis.setShowSideColors(withSides);
                    obj[key] = sq1vis.getColorScheme();
                    sq1vis.setActiveStyle(prevIdx);
                    sq1vis.setShowSideColors(prevSides);
                }
            }
            return obj;
        })(),
        // Piece fill colors — save separately per mode
        classicalPiecesColors: isCustomMode ? (classicalSnapshot ? classicalSnapshot.piecesColors : null) : sq1vis.getPiecesColors(),
        customPiecesColors: isCustomMode ? sq1vis.getPiecesColors() : (customSnapshot ? customSnapshot.piecesColors : null),
        // Export settings
        exportLayer,
        exportFmt,
        // Floating button mode
        febMode,
        // Sidebar state
        sidebarHidden: sidebar.classList.contains('hidden'),
        // Mute
        muteActive,
        // Color scheme panel mode (classical/custom)
        schemeMode: customBtn.classList.contains('active') ? 'custom' : 'classical',
        // Recent colors
        lastUsedColors,
        // Fill/unfill mode active states (save as inactive — don't restore active tool states)
    };
    try { localStorage.setItem(LS_KEY, JSON.stringify(settings)); } catch (e) { }
}

function loadSettings() {
    let s;
    try { s = JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) { }
    if (!s) return;

    // Display
    if (s.size != null) {
        document.getElementById('size-input').value = s.size;
        document.getElementById('size-slider').value = s.size;
    }
    if (s.gap != null) {
        document.getElementById('gap-input').value = s.gap;
        document.getElementById('gap-slider').value = s.gap;
    }
    if (s.orientation) {
        const r = document.querySelector(`input[name=orientation][value="${s.orientation}"]`);
        if (r) r.checked = true;
    }
    if (s.hideSlice != null) document.getElementById('hide-slice').checked = s.hideSlice;
    if (s.hideSides != null) {
        document.getElementById('hide-sides').checked = s.hideSides;
        sq1vis.setShowSideColors(!s.hideSides);
    }

    // Style
    if (s.styleIndex != null) {
        sq1vis.setActiveStyle(s.styleIndex);
        document.getElementById('svg-style-select').value = s.styleIndex;
    }
    if (s.styleSettings) {
        const prevIdx = sq1vis.getActiveStyleIndex();
        const prevSides = sq1vis.getShowSideColors();
        for (const style of sq1vis.getStyles()) {
            const saved = s.styleSettings[style.source];
            if (!saved) continue;
            sq1vis.setActiveStyle(style.index);
            sq1vis.setStyleSettings(saved);
        }
        sq1vis.setActiveStyle(prevIdx);
        sq1vis.setShowSideColors(prevSides);
    }

    // Color overrides — apply all saved overrides
    if (s.colorOverrides) {
        for (const style of sq1vis.getStyles()) {
            for (const withSides of [true, false]) {
                const key = `${style.source}_${withSides ? 'with' : 'without'}`;
                const saved = s.colorOverrides[key];
                if (!saved) continue;
                const prevIdx = sq1vis.getActiveStyleIndex();
                const prevSides = sq1vis.getShowSideColors();
                sq1vis.setActiveStyle(style.index);
                sq1vis.setShowSideColors(withSides);
                const sanitized = sanitizeSavedScheme(saved);
                if (sanitized) sq1vis.setColorScheme(sanitized);
                sq1vis.setActiveStyle(prevIdx);
                sq1vis.setShowSideColors(prevSides);
            }
        }
    }

    // Piece fill colors — restore classical only on load; custom restored on mode switch
    if (s.classicalPiecesColors) sq1vis.setPiecesColors(s.classicalPiecesColors);
    if (s.customPiecesColors) customSnapshot = { piecesColors: s.customPiecesColors, mute: s.muteActive || false };

    // Export
    if (s.exportLayer) {
        exportLayer = s.exportLayer;
        document.querySelectorAll('.export-tab[data-group="layer"]').forEach(b => {
            b.classList.toggle('active', b.dataset.val === exportLayer);
        });
    }
    if (s.exportFmt) {
        exportFmt = s.exportFmt;
        document.querySelectorAll('.export-tab[data-group="fmt"]').forEach(b => {
            b.classList.toggle('active', b.dataset.val === exportFmt);
        });
        updateCopyVisibility();
    }

    // Floating button mode
    if (s.febMode) setFebMode(s.febMode);

    // Sidebar state; this is just to change the floating btn.
    // Sidebar is already open due to the script in the html
    if (s.sidebarHidden != null) setSidebarOpen(!s.sidebarHidden);

    // Mute
    if (s.muteActive != null) {
        muteActive = s.muteActive;
        muteBtn.classList.toggle('active', muteActive);
    }

    // Scheme mode panel
    if (s.schemeMode === 'custom') {
        customBtn.classList.add("no-transition");
        // Seed classicalSnapshot so switching back to classical works correctly
        if (s.classicalPiecesColors) classicalSnapshot = { piecesColors: s.classicalPiecesColors, mute: false };
        // Restore custom snapshot before clicking so the switch finds it
        if (s.customPiecesColors) customSnapshot = { piecesColors: s.customPiecesColors, mute: s.muteActive || false };
        setSchemeMode(true, { redraw: false, persist: false });
        customBtn.classList.remove("no-transition");
    }

    // Recent colors
    if (s.lastUsedColors) {
        lastUsedColors = s.lastUsedColors;
        renderRecentSlots();
    }

    // UI dependent on loaded state is built once after loadSettings().
}

loadSettings();

// ── Cursor dev helper ─────────────────────────────────
window.CURSOR_SVG = {
    fill: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><g transform="scale(-1,1) translate(-24,0)"><path fill="#ffffff" stroke="#000000" stroke-width="3" paint-order="stroke" d="M20.911 14.216l-.411-.596-.411.596C19.74 14.72 18 17.3 18 18.5a2.5 2.5 0 0 0 5 0c0-1.2-1.74-3.78-2.089-4.284zM20.5 20a1.502 1.502 0 0 1-1.5-1.5 9.725 9.725 0 0 1 1.5-3.096A9.725 9.725 0 0 1 22 18.5a1.502 1.502 0 0 1-1.5 1.5zm-9-17.207L9.145 5.148a.476.476 0 0 0-.09-.023c-3.475-.17-5.962.425-6.743 1.59-.027.042-.07.077-.092.12a1.394 1.394 0 0 0 .118 1.522c.694.973 2.685 1.732 5.833 1.732a23.887 23.887 0 0 0 2.89-.192 1.494 1.494 0 1 0 .076-1.016c-4.77.618-7.418-.308-7.986-1.104-.812-1.14 3.1-1.71 5.044-1.679L6.32 7.973c.386.05.836.08 1.318.096L11.5 4.207l7.293 7.293-8.09 8.091a1.74 1.74 0 0 1-2.405 0l-4.889-4.888a1.702 1.702 0 0 1 0-2.405l1.514-1.514a9.152 9.152 0 0 1-1.101-.312l-1.12 1.12a2.703 2.703 0 0 0 0 3.818l4.889 4.888a2.7 2.7 0 0 0 3.818 0l8.798-8.798zM12 9.5a.5.5 0 1 1 .5.5.5.5 0 0 1-.5-.5z"/></g></svg>`,

    unfill: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="20" height="20" viewBox="0 0 488 488" xml:space="preserve">
<g>
  <g>
    <path fill="#ffffff" stroke="#000000" stroke-width="70" paint-order="stroke" d="M466.806,93.681L466.806,93.681l-72.48-72.485C380.63,7.499,362.635,0,343.74,0s-36.89,7.498-50.586,21.196l-0.1,0.1
      l-41.089,42.691L60.619,256.147l-35.89,35.093c0,0-0.1,0-0.1,0.1c-14.596,14.597-23.294,33.493-24.493,52.989
      c-1.2,19.996,5.598,38.392,19.095,51.889l72.48,72.485C104.207,481.201,120.902,488,139.197,488c1.4,0,2.899,0,4.399-0.1
      c19.595-1.1,38.389-9.798,53.085-24.495l41.888-42.691l185.449-184.662l42.688-41.092l0.1-0.1
      C480.502,181.163,488,163.167,488,144.271S480.502,107.378,466.806,93.681z M182.785,449.308
      c-11.297,10.998-25.593,17.696-40.189,18.496v0c-14.196,0.8-27.192-3.899-36.59-13.297l-72.48-72.485
      c-19.595-19.596-17.295-53.989,5.299-76.584l1.1-1.1c0,0.1,0,0.2,0,0.4c-0.2,18.896,7.198,36.792,20.694,50.29l72.48,72.485
      c13.296,13.297,30.991,20.696,49.686,20.696c0.2,0,0.4,0,0.6,0c0.1,0,0.2,0,0.4,0L182.785,449.308z M217.675,413.315l-0.1,0.1
      c-9.097,9.398-21.294,14.597-34.49,14.697c-13.496,0.1-26.293-5.099-35.99-14.797l-72.48-72.485
      c-9.697-9.698-14.896-22.395-14.796-35.993c0.1-13.097,5.299-25.395,14.696-34.393l0.1-0.1c0,0,0.1,0,0.1-0.1l115.468-115.976
      l143.46,143.471L217.675,413.315z M452.71,180.563L452.71,180.563l-42.688,41.191l-0.1,0.1l-62.083,61.887l-143.56-143.57
      l61.883-62.087l0.1-0.1l41.089-42.691c9.897-9.898,22.794-15.297,36.39-15.297c13.596,0,26.493,5.499,36.39,15.397l72.48,72.485
      c9.897,9.898,15.396,22.895,15.396,36.393C468.006,157.768,462.607,170.665,452.71,180.563z"/>
  </g>
</g>
</svg>`,
};

window.encodeCursors = function () {
    for (const [name, svg] of Object.entries(window.CURSOR_SVG)) {
        const encoded = 'url("data:image/svg+xml,' + encodeURIComponent(svg.replace(/\n\s*/g, '')) + '")';
    }
};

function activateFill() {
    if (fillResetActive && !fillModeActive) unfillBtn.click();

    fillModeActive = !fillModeActive;
    fillModeBtn.classList.toggle('active', fillModeActive);

    if (!fillModeActive) {
        document.querySelectorAll('.ctb-recent-slot').forEach(s => s.classList.remove('active-recent'));
    }
    updateCanvasCursor();
}

fillModeBtn.addEventListener('click', activateFill);

unfillBtn.addEventListener('click', () => {
    if (fillModeActive && !fillResetActive) fillModeBtn.click();

    fillResetActive = !fillResetActive;
    unfillBtn.classList.toggle('active', fillResetActive);

    updateCanvasCursor();
});

function updateLastUsed() {
    let value = fillColorInput.value;
    if (lastUsedColors.includes(value)) {
        lastUsedColors.splice(lastUsedColors.indexOf(value), 1);
        lastUsedColors.unshift(value);
    } else {
        if (lastUsedColors.length >= lastUsedLimit) lastUsedColors.pop();
        lastUsedColors.unshift(value);
    }
    renderRecentSlots();
}

function renderRecentSlots() {
    for (let i = 0; i < 3; i++) {
        const slot = document.getElementById(`ctb-recent-${i}`);
        if (lastUsedColors[i]) {
            slot.classList.remove('empty');
            slot.style.background = lastUsedColors[i];
            slot.onclick = () => selectRecentColor(lastUsedColors[i], slot);
        } else {
            slot.classList.add('empty');
            slot.style.background = '';
            slot.onclick = null;
        }
    }
}

function selectRecentColor(hex, slotEl) {
    setFillColor(hex);
    document.querySelectorAll('.ctb-recent-slot').forEach(s => s.classList.remove('active-recent'));
    slotEl.classList.add('active-recent');
    if (!fillModeActive) activateFill();
}

document.getElementById('canvas-inner').addEventListener('click', e => {
    if (fillModeActive) {
        const piece = e.target.closest('.sticker[id]');
        if (!piece || !piece.id.trim()) return;
        pushUndo();
        sq1vis.setPieceColor(piece.id, fillColorInput.value || 'transparent');
        updateLastUsed();
        draw();
        saveSettings();
    }
});

document.getElementById('canvas-inner').addEventListener('click', e => {
    if (fillResetActive) {
        const piece = e.target.closest('.sticker[id]');
        if (!piece || !piece.id.trim()) return;
        pushUndo();
        sq1vis.resetPieceColor(piece.id);
        draw();
    }
});

resetBtn.addEventListener("click", () => {
    pushUndo();
    sq1vis.resetPiecesColors();
    draw();
});

muteBtn.addEventListener("click", () => {
    muteActive = !muteActive;
    muteBtn.classList.toggle('active', muteActive);
    draw();
});

/* ─── Sync sliders ↔ number inputs ───────────────── */
function syncPair(sliderId, inputId, onChange) {
    const slider = document.getElementById(sliderId);
    const input = document.getElementById(inputId);
    slider.addEventListener('input', () => { input.value = slider.value; onChange(); });
    input.addEventListener('input', () => { slider.value = input.value; onChange(); });
}
syncPair('size-slider', 'size-input', draw);
syncPair('gap-slider', 'gap-input', draw);

/* ─── Orientation ─────────────────────────────────── */
document.querySelectorAll('input[name=orientation]').forEach(r =>
    r.addEventListener('change', draw));

/* ─── Hide-slice Hide-side color toggle ───────────────────────────── */
document.getElementById('hide-slice').addEventListener('change', draw);
document.getElementById('hide-sides').addEventListener('change', e => {
    sq1vis.setShowSideColors(!e.target.checked);
    buildSchemeGrid();
    draw();
});

document.getElementById('display-reset-default').addEventListener('click', () => {
    document.getElementById('size-input').value = 400;
    document.getElementById('size-slider').value = 400;
    document.getElementById('gap-input').value = 100;
    document.getElementById('gap-slider').value = 100;
    document.querySelector('input[name=orientation][value="horizontal"]').checked = true;
    document.getElementById('hide-slice').checked = false;
    document.getElementById('hide-sides').checked = false;
    sq1vis.setShowSideColors(true);
    const styleDefaults = {};
    for (const control of sq1vis.getStyleControls()) {
        if (control.parts) {
            for (const part of Object.values(control.parts)) {
                styleDefaults[part.id] = part.default;
            }
        } else {
            styleDefaults[control.id] = control.default;
        }
    }
    sq1vis.setStyleSettings(styleDefaults);
    updateStyleToggles();
    buildSchemeGrid();
    draw();
    saveSettings();
});

/* ─── Mode toggle ─────────────────────────────────────── */
const MODES = [
    { value: 'scramble', label: 'Scramble', placeholder: '1,0 / 3,3 / 0,-3 / ... (supports karn)' },
    { value: 'inverse', label: 'Alg', placeholder: '1,0 / 3,3 / 0,-3 / ... (supports karn)' },
    { value: 'hex', label: 'Hex', placeholder: '211033455677|99ebbaddcff8' },
];
let currentModeIndex = 0;

buildStyleDropdown();
updateStyleToggles();
buildSchemeGrid();

function setMode(index) {
    currentModeIndex = ((index % MODES.length) + MODES.length) % MODES.length;
    const m = MODES[currentModeIndex];
    document.getElementById('mode-toggle-btn').textContent = m.label;
    document.getElementById('scramble-input').placeholder = m.placeholder;
    document.querySelectorAll('.mode-dropdown-item').forEach(el => {
        el.classList.toggle('active', el.dataset.mode === m.value);
    });
    draw();
}

document.getElementById('mode-toggle-btn').addEventListener('click', () => setMode(currentModeIndex + 1));
document.getElementById('mode-toggle-btn').addEventListener('contextmenu', e => {
    e.preventDefault();
    setMode(currentModeIndex - 1);
});

document.getElementById('mode-dropdown-btn').addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('mode-dropdown-menu').classList.toggle('open');
});

document.querySelectorAll('.mode-dropdown-item').forEach(el => {
    el.addEventListener('click', () => {
        const idx = MODES.findIndex(m => m.value === el.dataset.mode);
        document.getElementById('mode-dropdown-menu').classList.remove('open');
        setMode(idx);
    });
});

document.addEventListener('click', () => {
    document.getElementById('mode-dropdown-menu').classList.remove('open');
});

/* ─── Input reactive ──────────────────────────────────── */
document.getElementById('scramble-input').addEventListener('focus', () => {
    document.getElementById('bulk-export-btn').style.borderColor = 'var(--accent)';
});
document.getElementById('scramble-input').addEventListener('blur', () => {
    document.getElementById('bulk-export-btn').style.borderColor = '';
});

document.getElementById('scramble-input').addEventListener('input', (e) => {
    const currentInput = e.target.value;
    setTimeout(() => {
        if (currentInput === document.getElementById('scramble-input').value) draw();
    }, 200)
});

function draw() {
    if (!appInitialized || !initialWindowLoaded) {
        showLoadingPlaceholder();
        return;
    }

    const input = document.getElementById('scramble-input').value;
    const size = parseInt(document.getElementById('size-input').value, 10);
    const gap = parseInt(document.getElementById('gap-input').value, 10);
    const mode = MODES[currentModeIndex].value;
    const isVertical = document.querySelector('input[name=orientation]:checked').value === 'vertical';
    const showSlice = !document.getElementById("hide-slice").checked;
    const showSides = !document.getElementById("hide-sides").checked;

    if (!input) {
        // Draw placeholder cube with muted gray scheme
        const html = getPlaceholderSVG(size, gap, isVertical, showSlice, showSides);
        canvasInner.innerHTML = html;
        updateCanvasCursor();
        return;
    }

    try {
        let hex;
        if (mode === 'hex') {
            hex = input;
        } else if (mode === 'inverse') {
            const { tlHex, blHex } = sq1vis.algToHex(sq1vis.invertScramble(sq1vis.unkarnify(input)));
            hex = `${tlHex}|${blHex}`;
        } else {
            // mode = "scramble"
            const { tlHex, blHex } = sq1vis.algToHex(sq1vis.unkarnify(input));
            hex = `${tlHex}|${blHex}`;
        }
        const hasLoneCorner = (halfLayer) => {
            for (let c of ['1', '3', '5', '7', '9', 'b', 'd', 'f']) {
                // if the half layer contains an odd number of this corner
                if (halfLayer.split(c).length % 2 !== 1) return true;
            }
            return false;
        }
        if (hasLoneCorner(hex.slice(0, 6)) ||
            hasLoneCorner(hex.slice(6, 12)) ||
            hasLoneCorner(hex.slice(13, 19)) ||
            hasLoneCorner(hex.slice(19, 25))) throw new Error("Invalid position. Double check your scramble!")

        const html = sq1vis.getSVG(hex, size, gap, muteActive, isVertical, showSlice, showSides);
        canvasInner.innerHTML = html;
        updateCanvasCursor();

    } catch (err) {
        canvasInner.innerHTML = `<div class="error-banner">⚠ ${err.message}</div>`;
        console.error(err);
    }
}

/* ─── Export state ────────────────────────────────────── */
document.querySelectorAll('.export-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        const grp = btn.dataset.group;
        document.querySelectorAll(`.export-tab[data-group="${grp}"]`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (grp === 'layer') exportLayer = btn.dataset.val;
        if (grp === 'fmt') {exportFmt = btn.dataset.val;  updateCopyVisibility();}
    });
});

document.getElementById('do-export').addEventListener('click', () => doExport('download'));
document.getElementById('do-copy').addEventListener('click', () => doExport('clipboard'));

/* ─── Keyboard shortcuts ──────────────────────────────── */
document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); doExport('download'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && document.activeElement !== document.getElementById('scramble-input')) {
        e.preventDefault(); doExport('clipboard');
    }
});

/* ─── Core export ─────────────────────────────────────── */
function getExportSVGString(layer) {
    const size = parseInt(document.getElementById('size-input').value, 10);
    const gap = parseInt(document.getElementById('gap-input').value, 10);
    const isVertical = document.querySelector('input[name=orientation]:checked').value === 'vertical';
    const showSlice = !document.getElementById('hide-slice').checked;
    const showSides = !document.getElementById("hide-sides").checked;
    const input = document.getElementById('scramble-input').value.trim();
    const mode = MODES[currentModeIndex].value;

    let muted, hex, renderVis;
    if (!input) {
        muted = true;
        hex = PLACEHOLDER_HEX;
        renderVis = createPlaceholderVisualizer(showSides);
    }
    else {
        muted = muteActive
        renderVis = sq1vis;
        if (mode === 'hex') {
            hex = input;
        } else if (mode === 'inverse') {
            const { tlHex, blHex } = sq1vis.algToHex(sq1vis.invertScramble(sq1vis.unkarnify(input)));
            hex = `${tlHex}|${blHex}`;
        } else {
            // mode = "scramble"
            const { tlHex, blHex } = sq1vis.algToHex(sq1vis.unkarnify(input));
            hex = `${tlHex}|${blHex}`;
        }
    }

    // Render to a temp div so we can grab individual SVGs
    const scaledSize = size * (220 / 400);
    const PAD = Math.round(scaledSize * 0.28);
    const tmp = document.createElement('div');
    tmp.innerHTML = renderVis.getSVG(hex, size, gap, muted, isVertical, showSlice, showSides, PAD);
    const svgs = tmp.querySelectorAll('svg');

    let svgEl;
    if (layer === 'both') {
        const svg0 = svgs[0], svg1 = svgs[1];
        const vb = svg0.getAttribute('viewBox').split(' ').map(parseFloat);
        const vbX = vb[0], vbY = vb[1], vbW = vb[2], vbH = vb[3];

        // The logical (content) size before padding — matches what getSVG uses internally
        const s = Math.round(size * (220 / 400));
        const PAD_TOP = -vbY;           // how far viewBox extends above 0
        const PAD_OTHER = -vbX;           // how far it extends left/right/bottom

        // Recompute margin the same way getSVG does so it matches the preview exactly
        const margin = s * (0.44 * (2 + gap / 100) - 1);

        const inner0 = svg0.innerHTML;
        const inner1 = svg1.innerHTML;

        // Shift content so negative viewBox space becomes positive canvas space
        const g0shift = `translate(${PAD_OTHER}, ${PAD_TOP})`;
        const g1shift = isVertical
            ? `translate(${PAD_OTHER}, ${PAD_TOP + s + margin})`
            : `translate(${PAD_OTHER + s + margin}, ${PAD_TOP})`;

        const totalW = isVertical ? vbW : PAD_OTHER + s + margin + s + PAD_OTHER;
        const totalH = isVertical ? PAD_TOP + s + margin + s + PAD_OTHER : vbH;

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">` +
            `<g transform="${g0shift}">${inner0}</g><g transform="${g1shift}">${inner1}</g></svg>`;
    } else {
        const scaledSize = size * (220 / 400);
        const PAD = Math.round(scaledSize * 0.28);
        return renderVis.getSingleLayerSVG(hex, size, muted, showSlice, layer, PAD);
    }
}

let svgoOptimizeModulePromise = null;

async function optimizeSvgForExport(svgStr) {
    try {
        svgoOptimizeModulePromise ||= import('svgo/browser');
        const { optimize } = await svgoOptimizeModulePromise;

        const result = optimize(svgStr, {
            multipass: true,
            js2svg: {
                pretty: false,
            },
            plugins: [
                {
                    name: 'preset-default',
                },
                {
                    name: 'removeViewBox',
                    active: false,
                },
                {
                    name: 'cleanupIds',
                    active: false,
                },
            ],
        });

        return result.data || svgStr;
    } catch (err) {
        svgoOptimizeModulePromise = null;
        console.warn('SVGO optimization failed; using original SVG.', err);
        return svgStr;
    }
}

async function doExport(methodOverride) {
    const method = methodOverride || 'download';

    let svgStr = getExportSVGString(exportLayer);
    if (!svgStr) return;

    const fname = `sq1-${exportLayer}`;

    if (exportFmt === 'svg') {
        svgStr = await optimizeSvgForExport(svgStr);
        const blob = new Blob([svgStr], { type: 'image/svg+xml' });
        if (method === 'clipboard') {
            await navigator.clipboard.writeText(svgStr);
            flashBtn('Copied to clipboard!');
        } else {
            triggerDownload(blob, `${fname}.svg`);
        }
        return;
    }

    function rasterize(svgStr, fmt) {
        return new Promise((resolve, reject) => {
            const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            const img = new Image();
            img.onload = () => {
                // wait a tick to ensure full paint
                setTimeout(() => {
                    const canvas = document.createElement('canvas');
                    canvas.width  = img.naturalWidth  || img.width  || 800;
                    canvas.height = img.naturalHeight || img.height || 400;
                    const ctx = canvas.getContext('2d');
                    if (fmt === 'jpeg' || fmt === 'bmp') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
                    ctx.drawImage(img, 0, 0);
                    URL.revokeObjectURL(url);
                    resolve(canvas);
                }, 100);
            };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img load failed')); };
            img.src = url;
        });
    }

    function canvasToBlob(canvas, mime) {
        return new Promise((resolve, reject) => {
            canvas.toBlob(blob => {
                if (blob) resolve(blob);
                else reject(new Error('canvas blob failed'));
            }, mime);
        });
    }

    try {
        if (method === 'clipboard') {
            if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
                flashBtn('Clipboard images are not supported here');
                return;
            }

            const pngBlobPromise = rasterize(svgStr, exportFmt).then(canvas => canvasToBlob(canvas, 'image/png'));
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlobPromise })]);
            if (exportFmt === 'png') flashBtn('Copied to clipboard!');
            else flashBtn(`Browser copying ${exportFmt.toLocaleUpperCase()}s isn't possible. Copied PNG instead.`);
            return;
        }

        const canvas = await rasterize(svgStr, exportFmt);
        const mimeMap = { png: 'image/png', jpeg: 'image/jpeg', bmp: 'image/png' };
        const extMap  = { png: 'png', jpeg: 'jpg', bmp: 'bmp' };
        const mime = mimeMap[exportFmt] || 'image/png';
        const ext  = extMap[exportFmt]  || 'png';

        if (exportFmt === 'bmp' && method !== 'clipboard') {
            triggerDownload(createBMP32(canvas), `${fname}.bmp`);
            return;
        }

        canvas.toBlob(blob => triggerDownload(blob, `${fname}.${ext}`), mime);
    } catch (err) {
        flashBtn(method === 'clipboard' ? 'Failed to copy to clipboard' : 'Export failed');
        console.error(err);
    }
}

function createBMP32(canvas) {
    const w = canvas.width, h = canvas.height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, w, h).data;

    const fileHeaderSize = 14;
    const dibHeaderSize = 108;
    const pixelDataSize = w * h * 4;
    const fileSize = fileHeaderSize + dibHeaderSize + pixelDataSize;
    const buf = new ArrayBuffer(fileSize);
    const view = new DataView(buf);
    let o = 0;

    const u8 = (v) => {
        if (o >= fileSize) { console.error('[BMP] u8 overflow at o=', o, 'fileSize=', fileSize); throw new RangeError('u8 overflow'); }
        view.setUint8(o++, v);
    };
    const u16 = (v) => { view.setUint16(o, v, true); o += 2; };
    const u32 = (v) => { view.setUint32(o, v, true); o += 4; };
    const i32 = (v) => { view.setInt32(o, v, true); o += 4; };
    const zer = (n) => { for (let i = 0; i < n; i++) { view.setUint8(o, 0); o++; } };

    // ── File header (14 bytes) ──
    u8(0x42); u8(0x4D); // 'BM'
    u32(fileSize);
    u16(0); u16(0);     // reserved
    u32(fileHeaderSize + dibHeaderSize);

    // ── BITMAPV4HEADER (108 bytes) ──
    u32(dibHeaderSize);
    i32(w);
    i32(-h);            // negative = top-down row order
    u16(1);             // color planes
    u16(32);            // bits per pixel
    u32(3);             // BI_BITFIELDS
    u32(pixelDataSize);
    i32(2835);          // X pixels/meter
    i32(2835);          // Y pixels/meter
    u32(0);             // colors in table
    u32(0);             // important colors
    u32(0x00FF0000);    // R mask
    u32(0x0000FF00);    // G mask
    u32(0x000000FF);    // B mask
    u32(0xFF000000);    // A mask
    u32(0x57696E20);    // color space 'Win '
    zer(36);            // CIEXYZTRIPLE — 9 × FXPT2DOT30 (3 endpoints × 3 coords × 4 bytes)
    zer(12);            // gamma R, G, B (3 × 4 bytes)

    // ── Pixel data (BGRA) ──
    for (let i = 0; i < w * h; i++) {
        const base = i * 4;
        u8(imgData[base + 2]); // B
        u8(imgData[base + 1]); // G
        u8(imgData[base + 0]); // R
        u8(imgData[base + 3]); // A
    }

    return new Blob([buf], { type: 'image/bmp' });
}

if (typeof window !== 'undefined') window.createBMP32 = createBMP32;

function triggerDownload(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function flashBtn(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(flashBtn._t);
    flashBtn._t = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ─── Floating export button ──────────────────────── */
function setFebMode(mode) {
    febMode = mode;
    febActionIcon.src = mode === 'download' ? 'img/download.svg' : 'img/copy.svg';
    document.querySelectorAll('.feb-option').forEach(o => {
        o.classList.toggle('active', o.dataset.mode === mode);
    });
}
setFebMode('download');

function updateCopyVisibility() {
    const atBottom = sidebar.scrollHeight - sidebar.scrollTop - sidebar.clientHeight < 2;
    const hide = exportFmt === 'jpeg' || exportFmt === 'bmp';
    // Sidebar
    document.getElementById('do-copy').style.display = hide ? 'none' : '';
    // Context menu (added via separate snippet)
    const ctxCopy = document.getElementById('ctx-copy');
    if (ctxCopy) ctxCopy.style.display = hide ? 'none' : '';
    // Floating button dropdown option
    document.querySelectorAll('.feb-option[data-mode="copy"]').forEach(o => {
        o.style.display = hide ? 'none' : '';
    });
    // If FEB is currently in copy mode, kick it back to download
    if (hide && febMode === 'copy') setFebMode('download');
    // Hide the split arrow entirely if there's nothing left to switch to
    febSplitBtn.style.display = hide ? 'none' : '';
    if (atBottom) sidebar.scrollTop = sidebar.scrollHeight;
}

let febClickTimer = null;
febActionBtn.addEventListener('click', () => {
    const copyHidden = exportFmt === 'jpeg' || exportFmt === 'bmp';
    if (febMode === 'copy' && !copyHidden) {
        doExport('clipboard');
        return;
    }

    if (febClickTimer) return;
    febClickTimer = setTimeout(() => {
        febClickTimer = null;
        doExport('download');
    }, 250);
});

febActionBtn.addEventListener('dblclick', e => {
    e.preventDefault();
    if (febClickTimer) { clearTimeout(febClickTimer); febClickTimer = null; }
    const copyHidden = exportFmt === 'jpeg' || exportFmt === 'bmp';
    if (copyHidden) return;
    setFebMode(febMode === 'download' ? 'copy' : 'download');
});

febSplitBtn.addEventListener('click', e => {
    e.stopPropagation();
    febDropdown.style.display = febDropdown.style.display === 'none' ? 'block' : 'none';
});

document.querySelectorAll('.feb-option').forEach(opt => {
    opt.addEventListener('click', () => {
        setFebMode(opt.dataset.mode);
        febDropdown.style.display = 'none';
    });
});

document.addEventListener('click', e => {
    if (!febDropdown.contains(e.target) && e.target !== febSplitBtn) {
        febDropdown.style.display = 'none';
    }
});

/* ─── Context menu ────────────────────────────────────── */
const menu = document.getElementById('ctx-menu');

function showMenu(x, y) {
    menu.style.display = 'block';
    const vw = window.innerWidth, vh = window.innerHeight;
    const mw = menu.offsetWidth  || 180;
    const mh = menu.offsetHeight || 120;
    menu.style.left = Math.min(x, vw - mw - 8) + 'px';
    menu.style.top  = Math.min(y, vh - mh - 8) + 'px';
}

function hideMenu() {
    menu.style.display = 'none';
}

function syncFormatFromUI() {
    const active = document.querySelector('.export-tab.active[data-group="fmt"]');
    if (active) document.getElementById('ctx-format-select').value = active.dataset.val;
}

document.addEventListener('contextmenu', function (e) {
    const canvas = document.getElementById('viewport-canvas');
    if (!canvas || !canvas.contains(e.target)) return;

    if (isCustomMode && fillModeActive) {
        const piece = e.target.closest('.sticker[id]');
        if (piece && piece.id.trim()) {
            e.preventDefault();
            pushUndo();
            sq1vis.resetPieceColor(piece.id);
            draw();
            saveSettings();
            return;
        }
    }

    e.preventDefault();
    syncFormatFromUI();
    showMenu(e.clientX, e.clientY);
});

document.addEventListener('mousedown', function (e) {
    if (!menu.contains(e.target)) hideMenu();
});
document.addEventListener('scroll', hideMenu, true);
window.addEventListener('resize', hideMenu);

document.getElementById('ctx-format-select').addEventListener('change', function () {
    const matchingTab = document.querySelector(`.export-tab[data-group="fmt"][data-val="${this.value}"]`);
    if (matchingTab) matchingTab.click();
    hideMenu();
});

document.getElementById('ctx-download').addEventListener('click', function () {
    hideMenu();
    doExport('download');
});

document.getElementById('ctx-copy').addEventListener('click', function () {
    hideMenu();
    doExport('clipboard');
});

/* ─── Init ────────────────────────────────────────── */

// ═══════════════════════════════════════════════════
// ═══ BULK EXPORT ═══════════════════════════════════
// ═══════════════════════════════════════════════════

(function initBulkExport() {

    let _jszipPromise, _xlsxPromise;
    function getJSZip() {
        if (!_jszipPromise) _jszipPromise = import('./jszip.js').then(m => m.default);
        return _jszipPromise;
    }
    function getXLSX() {
        if (!_xlsxPromise) _xlsxPromise = import('./xlsx.js').then(m => m.default);
        return _xlsxPromise;
    }

    // ── helpers ──────────────────────────────────────
    function getCurrentSettings() {
        return {
            size:       parseInt(document.getElementById('size-input').value, 10),
            gap:        parseInt(document.getElementById('gap-input').value, 10),
            isVertical: document.querySelector('input[name=orientation]:checked').value === 'vertical',
            showSlice:  !document.getElementById('hide-slice').checked,
            showSides:  !document.getElementById('hide-sides').checked,
            mode:       MODES[currentModeIndex].value,
        };
    }

    function inputToHex(raw, s) {
        const input = raw.trim();
        if (!input) throw new Error('empty');
        if (s.mode === 'hex') return input;
        if (s.mode === 'inverse') {
            const { tlHex, blHex } = sq1vis.algToHex(sq1vis.invertScramble(sq1vis.unkarnify(input)));
            return `${tlHex}|${blHex}`;
        }
        const { tlHex, blHex } = sq1vis.algToHex(sq1vis.unkarnify(input));
        return `${tlHex}|${blHex}`;
    }

    function svgStringForHex(hex, s) {
        const PAD = Math.round(s.size * (220 / 400) * 0.28);
        const tmp = document.createElement('div');
        tmp.innerHTML = sq1vis.getSVG(hex, s.size, s.gap, muteActive, s.isVertical, s.showSlice, s.showSides, PAD);
        const svgs = tmp.querySelectorAll('svg');
        const svg0 = svgs[0], svg1 = svgs[1];

        const vb    = svg0.getAttribute('viewBox').split(' ').map(parseFloat);
        const vbX   = vb[0], vbY = vb[1], vbW = vb[2], vbH = vb[3];
        const sc    = Math.round(s.size * (220/400));
        const padT  = -vbY, padO = -vbX;
        const margin = sc * (0.44 * (2 + s.gap/100) - 1);

        const g0shift = `translate(${padO},${padT})`;
        const g1shift = s.isVertical
            ? `translate(${padO},${padT + sc + margin})`
            : `translate(${padO + sc + margin},${padT})`;
        const totalW = s.isVertical ? vbW : padO + sc + margin + sc + padO;
        const totalH = s.isVertical ? padT + sc + margin + sc + padO : vbH;

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">` +
               `<g transform="${g0shift}">${svg0.innerHTML}</g>` +
               `<g transform="${g1shift}">${svg1.innerHTML}</g></svg>`;
    }

    async function rasterizeBlob(svgStr, fmt) {
        return new Promise((res, rej) => {
            const img = new Image();
            const url = URL.createObjectURL(new Blob([svgStr], { type: 'image/svg+xml' }));
            img.onload = () => {
                const c = document.createElement('canvas');
                c.width = img.naturalWidth || img.width;
                c.height = img.naturalHeight || img.height;
                const ctx = c.getContext('2d');
                if (fmt === 'jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height); }
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                if (fmt === 'bmp') { res(createBMP32(c)); return; }
                const mime = fmt === 'jpeg' ? 'image/jpeg' : 'image/png';
                c.toBlob(b => b ? res(b) : rej(new Error('toBlob failed')), mime);
            };
            img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('img load failed')); };
            img.src = url;
        });
    }

    // ── modal wiring ─────────────────────────────────
    const overlay      = document.getElementById('bulk-modal-overlay');
    const closeBtn     = document.getElementById('bulk-modal-close');
    const openBtn      = document.getElementById('bulk-export-btn');
    const tabs         = document.querySelectorAll('.modal-tab');
    const panelText    = document.getElementById('bulk-tab-text');
    const panelXlsx    = document.getElementById('bulk-tab-xlsx');
    const warnOverlay  = document.getElementById('bulk-warn-overlay');
    const warnList     = document.getElementById('bulk-warn-list');
    const warnClose    = document.getElementById('bulk-warn-close');
    const warnCancel   = document.getElementById('bulk-warn-cancel');
    const warnProceed  = document.getElementById('bulk-warn-proceed');
    const dropzone     = document.getElementById('bulk-dropzone');
    const fileInput    = document.getElementById('bulk-xlsx-file');
    const dropLabel    = document.getElementById('bulk-dropzone-label');

    let pendingExportFn = null;
    let loadedXlsxFile = null;

    openBtn.addEventListener('click', () => overlay.classList.add('open'));
    closeBtn.addEventListener('click', () => overlay.classList.remove('open'));
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            panelText.style.display = tab.dataset.tab === 'text' ? '' : 'none';
            panelXlsx.style.display = tab.dataset.tab === 'xlsx' ? '' : 'none';
        });
    });

    // warn modal
    function showWarn(invalids, onProceed) {
        warnList.innerHTML = invalids.map(v => `<li>${v}</li>`).join('');
        warnOverlay.classList.add('open');
        pendingExportFn = onProceed;
    }
    warnClose.addEventListener('click',  () => { warnOverlay.classList.remove('open'); pendingExportFn = null; });
    warnCancel.addEventListener('click', () => { warnOverlay.classList.remove('open'); pendingExportFn = null; });
    warnProceed.addEventListener('click',() => { warnOverlay.classList.remove('open'); if (pendingExportFn) pendingExportFn(); });

    // ── dropzone ─────────────────────────────────────
    dropzone.addEventListener('click',      () => fileInput.click());
    dropzone.addEventListener('dragover',   e  => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave',  ()  => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', e => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        const f = e.dataTransfer.files[0];
        if (f) setXlsxFile(f);
    });
    fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) setXlsxFile(fileInput.files[0]);
    });

    function setXlsxFile(f) {
        loadedXlsxFile = f;
        dropLabel.textContent = f.name;
    }

    // ── TEXT EXPORT ───────────────────────────────────
    document.getElementById('bulk-text-export').addEventListener('click', () => {
        const lines = document.getElementById('bulk-text-input').value
            .split('\n').map(l => l.trim()).filter(Boolean);
        if (!lines.length) return flashBtn('No inputs entered.');

        const s = getCurrentSettings();
        const invalids = [];
        const valid = [];

        lines.forEach((line, i) => {
            try {
                const hex = inputToHex(line, s);
                valid.push({ label: `line-${i + 1}`, hex });
            } catch {
                invalids.push(`Line ${i + 1}: "${line}"`);
            }
        });

        const doExportZip = async () => {
            const JSZip = await getJSZip();
            const zip = new JSZip();
            for (const item of valid) {
                try {
                    const svgStr = svgStringForHex(item.hex, s);
                    const blob = await rasterizeBlob(svgStr, exportFmt === 'svg' ? 'png' : exportFmt);
                    zip.file(`${item.label}.png`, blob);
                } catch { /* skip render errors silently */ }
            }
            const blob = await zip.generateAsync({ type: 'blob' });
            triggerDownload(blob, 'bulk-export.zip');
            overlay.classList.remove('open');
        };

        if (invalids.length) showWarn(invalids, doExportZip);
        else doExportZip();
    });

    // ── XLSX EXPORT ───────────────────────────────────
    async function processXlsx(outputMode) {
        if (!loadedXlsxFile) return flashBtn('No file selected.');
        const [JSZip, XLSX] = await Promise.all([getJSZip(), getXLSX()]);
        const s   = getCurrentSettings();
        const fmt = exportFmt === 'svg' ? 'png' : exportFmt; // svg doesn't embed well in xlsx, fallback to png
        const mimeForFmt = { png: 'image/png', jpeg: 'image/jpeg', bmp: 'image/png' }; // bmp→png for xlsx compat
        const extForFmt  = { png: 'png', jpeg: 'jpeg', bmp: 'png' };
        const imgMime    = mimeForFmt[fmt] || 'image/png';
        const imgExt     = extForFmt[fmt]  || 'png';
        const imgContentType = imgMime === 'image/jpeg'
            ? 'image/jpeg'
            : 'image/png';
        const xlsxImgType = imgMime === 'image/jpeg' ? 'jpeg' : 'png';

        const arrayBuf = await loadedXlsxFile.arrayBuffer();
        const wb = XLSX.read(arrayBuf, { type: 'array' });

        const tasks = [];
        const invalids = [];

        wb.SheetNames.forEach((sheetName, si) => {
            const ws = wb.Sheets[sheetName];
            if (!ws || !ws['!ref']) return;
            const range = XLSX.utils.decode_range(ws['!ref']);
            for (let R = range.s.r; R <= range.e.r; R++) {
                for (let C = range.s.c; C <= range.e.c; C++) {
                    const addr = XLSX.utils.encode_cell({ r: R, c: C });
                    const cell = ws[addr];
                    if (!cell || cell.v === undefined || cell.v === '') continue;
                    const raw = String(cell.v).trim();
                    if (!raw) continue;
                    try {
                        const hex = inputToHex(raw, s);
                        tasks.push({ sheetIdx: si, sheetName, cellAddr: addr, row: R, col: C, hex, valid: true });
                    } catch {
                        invalids.push(`Sheet "${sheetName}" ${addr}: "${raw}"`);
                        tasks.push({ sheetIdx: si, sheetName, cellAddr: addr, row: R, col: C, hex: null, valid: false, rawVal: raw });
                    }
                }
            }
        });

        const doExport = async () => {
            // ── Render all images ──────────────────────────────
            // taskImgMap: taskIdx → { blob, uint8, w, h }
            const taskImgMap = new Map();
            for (let i = 0; i < tasks.length; i++) {
                const t = tasks[i];
                if (!t.valid) continue;
                try {
                    const svgStr = svgStringForHex(t.hex, s);
                    const blob = await rasterizeBlob(svgStr, fmt);
                    const abuf = await blob.arrayBuffer();
                    const uint8 = new Uint8Array(abuf);
                    // Read dimensions from PNG/JPEG header
                    let w = 400, h = 400;
                    if (imgExt === 'png') {
                        const dv = new DataView(abuf);
                        w = dv.getUint32(16); h = dv.getUint32(20);
                    } else if (imgExt === 'jpeg') {
                        // scan for SOF0/SOF2 marker
                        const dv = new DataView(abuf);
                        let off = 2;
                        while (off < abuf.byteLength - 8) {
                            const marker = dv.getUint16(off);
                            const len = dv.getUint16(off + 2);
                            if (marker === 0xFFC0 || marker === 0xFFC2) {
                                h = dv.getUint16(off + 5);
                                w = dv.getUint16(off + 7);
                                break;
                            }
                            off += 2 + len;
                        }
                    }
                    taskImgMap.set(i, { blob, uint8, w, h });
                } catch (e) { console.warn('render failed for task', i, e); }
            }

            if (outputMode === 'zip') {
                const zip = new JSZip();
                for (const [i, img] of taskImgMap) {
                    const t = tasks[i];
                    zip.file(`${t.sheetName}-${t.cellAddr}.${imgExt}`, img.blob);
                }
                const blob = await zip.generateAsync({ type: 'blob' });
                triggerDownload(blob, 'bulk-export.zip');
                overlay.classList.remove('open');
                return;
            }

            // ── XLSX with embedded images via raw ZIP surgery ──

            // Build clean xlsx — strip valid cell values so image shows over empty cell
            const newWb = XLSX.utils.book_new();
            for (let si = 0; si < wb.SheetNames.length; si++) {
                const sheetName = wb.SheetNames[si];
                const srcWs = wb.Sheets[sheetName];
                if (!srcWs) { XLSX.utils.book_append_sheet(newWb, {}, sheetName); continue; }
                // shallow clone all keys
                const ws = {};
                for (const key of Object.keys(srcWs)) ws[key] = srcWs[key];
                // clear valid task cells
                tasks.filter(t => t.sheetIdx === si && t.valid).forEach(t => {
                    ws[t.cellAddr] = { t: 's', v: '' };
                });
                XLSX.utils.book_append_sheet(newWb, ws, sheetName);
            }
            const xlsxBytes = XLSX.write(newWb, { bookType: 'xlsx', type: 'array' });

            // Re-open as JSZip for surgery
            const xz = await JSZip.loadAsync(xlsxBytes);

            // ── Helpers ────────────────────────────────────────
            const nsR   = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
            const nsCT  = 'http://schemas.openxmlformats.org/package/2006/content-types';
            const nsDrw = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing';
            const nsA   = 'http://schemas.openxmlformats.org/drawingml/2006/main';
            const nsRel = 'http://schemas.openxmlformats.org/package/2006/relationships';

            function xmlEscape(s) {
                return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }

            // Read workbook.xml.rels to find actual sheet filenames
            const wbRelsRaw = await xz.file('xl/_rels/workbook.xml.rels').async('string');
            // Extract all Relationship targets for worksheets
            const sheetTargets = {}; // sheetIndex (0-based) → e.g. "worksheets/sheet1.xml"
            const relMatches = [...wbRelsRaw.matchAll(/<Relationship[^>]+Id="([^"]*)"[^>]+Type="([^"]*)"[^>]+Target="([^"]*)"/g)];
            for (const m of relMatches) {
                const [, id, type, target] = m;
                if (type.endsWith('/worksheet')) {
                    // SheetJS orders sheets rId1, rId2... matching SheetNames order
                    const num = parseInt(id.replace('rId', ''), 10) - 1;
                    sheetTargets[num] = target.startsWith('/xl/') ? target.slice(4) : target.startsWith('xl/') ? target.slice(3) : target;
                }
            }

            // Group tasks by sheet
            const bySheet = new Map();
            for (let i = 0; i < tasks.length; i++) {
                const t = tasks[i];
                if (!taskImgMap.has(i)) continue;
                if (!bySheet.has(t.sheetIdx)) bySheet.set(t.sheetIdx, []);
                bySheet.get(t.sheetIdx).push({ t, imgData: taskImgMap.get(i), globalIdx: i });
            }

            // Track content-types overrides to add
            const ctOverrides = []; // { partName, contentType }
            const ctDefaults = []; // { ext, contentType }

            for (const [si, entries] of bySheet) {
                const drawingNum = si + 1;
                const drawingFile = `drawings/drawing${drawingNum}.xml`;
                const drawingPath = `xl/${drawingFile}`;
                const drawingRelsPath = `xl/drawings/_rels/drawing${drawingNum}.xml.rels`;
                const sheetFile = sheetTargets[si] || `worksheets/sheet${si + 1}.xml`;
                const sheetPath = `xl/${sheetFile}`;
                const sheetRelsPath = `xl/${sheetFile.replace('worksheets/', 'worksheets/_rels/').replace('.xml', '.xml.rels')}`;

                // ── Add media files ──────────────────────────────
                const drawingRelEntries = []; // { rId, target, imgFile }
                let rIdN = 1;
                for (const { t, imgData, globalIdx } of entries) {
                    const imgFile = `image_s${si}_${t.cellAddr}.${imgExt}`;
                    xz.file(`xl/media/${imgFile}`, imgData.uint8);
                    drawingRelEntries.push({
                        rId: `rId${rIdN++}`,
                        target: `../media/${imgFile}`,
                        t, imgData, globalIdx
                    });
                }

                // ── drawing xml ──────────────────────────────────
                let anchors = '';
                let picId = 2;
                for (const { rId, t, imgData } of drawingRelEntries) {
                    const emuW = Math.round(imgData.w * 9525);
                    const emuH = Math.round(imgData.h * 9525);
                    anchors += `<xdr:oneCellAnchor>` +
                        `<xdr:from><xdr:col>${t.col}</xdr:col><xdr:colOff>0</xdr:colOff>` +
                        `<xdr:row>${t.row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>` +
                        `<xdr:ext cx="${emuW}" cy="${emuH}"/>` +
                        `<xdr:pic>` +
                        `<xdr:nvPicPr>` +
                        `<xdr:cNvPr id="${picId++}" name="${xmlEscape('img_' + t.cellAddr)}"/>` +
                        `<xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr>` +
                        `</xdr:nvPicPr>` +
                        `<xdr:blipFill>` +
                        `<a:blip r:embed="${rId}"/>` +
                        `<a:stretch><a:fillRect/></a:stretch>` +
                        `</xdr:blipFill>` +
                        `<xdr:spPr>` +
                        `<a:xfrm><a:off x="0" y="0"/><a:ext cx="${emuW}" cy="${emuH}"/></a:xfrm>` +
                        `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>` +
                        `</xdr:spPr>` +
                        `</xdr:pic>` +
                        `<xdr:clientData/>` +
                        `</xdr:oneCellAnchor>`;
                }

                const drawingXml =
                    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
                    `<xdr:wsDr` +
                    ` xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"` +
                    ` xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"` +
                    ` xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"` +
                    `>${anchors}</xdr:wsDr>`;
                xz.file(drawingPath, drawingXml);

                // ── drawing rels ─────────────────────────────────
                const drawingRelsXml =
                    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
                    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
                    drawingRelEntries.map(({ rId, target }) =>
                        `<Relationship Id="${rId}"` +
                        ` Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"` +
                        ` Target="${xmlEscape(target)}"/>`
                    ).join('') +
                    `</Relationships>`;
                xz.file(drawingRelsPath, drawingRelsXml);

                // ── patch sheet xml ──────────────────────────────
                let sheetXml = await xz.file(sheetPath).async('string');

                // Ensure xmlns:r on worksheet element (only if not already there)
                if (!sheetXml.includes('xmlns:r=')) {
                    sheetXml = sheetXml.replace(/(<worksheet\b)/, `$1 xmlns:r="${nsR}"`);
                }
                // Remove any existing <drawing .../> tags to avoid duplicates
                sheetXml = sheetXml.replace(/<drawing\b[^>]*\/>/g, '');
                // Remove legacy pageMargins / pageSetup blocks to inject cleanly before </worksheet>
                // Inject <drawing> ref as last child of worksheet (must come after sheetData, after pageMargins etc.)
                const drawingTag = `<drawing r:id="rId_drw${drawingNum}"/>`;
                if (sheetXml.includes('</worksheet>')) {
                    sheetXml = sheetXml.replace('</worksheet>', `${drawingTag}</worksheet>`);
                } else {
                    sheetXml += drawingTag;
                }
                xz.file(sheetPath, sheetXml);

                // ── patch sheet rels ─────────────────────────────
                let sheetRelsXml;
                const sheetRelsFile = xz.file(sheetRelsPath);
                if (sheetRelsFile) {
                    sheetRelsXml = await sheetRelsFile.async('string');
                    // Remove any stale drawing relationships
                    sheetRelsXml = sheetRelsXml.replace(/<Relationship[^>]*drawing[^>]*\/>/g, '');
                } else {
                    sheetRelsXml =
                        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
                        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`;
                }
                const drawingRelEntry =
                    `<Relationship Id="rId_drw${drawingNum}"` +
                    ` Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing"` +
                    ` Target="../${drawingFile}"/>`;
                sheetRelsXml = sheetRelsXml.replace('</Relationships>', `${drawingRelEntry}</Relationships>`);
                xz.file(sheetRelsPath, sheetRelsXml);

                // Queue content type entries
                ctOverrides.push({
                    partName: `/xl/${drawingFile}`,
                    contentType: 'application/vnd.openxmlformats-officedocument.drawing+xml'
                });
            }

            // ── Patch [Content_Types].xml ────────────────────────
            let ctXml = await xz.file('[Content_Types].xml').async('string');

            // Add image extension default if missing
            if (!ctXml.includes(`Extension="${imgExt}"`)) {
                ctDefaults.push({ ext: imgExt, contentType: imgContentType });
            }
            for (const { ext, contentType } of ctDefaults) {
                ctXml = ctXml.replace(
                    '</Types>',
                    `<Default Extension="${ext}" ContentType="${contentType}"/></Types>`
                );
            }
            for (const { partName, contentType } of ctOverrides) {
                if (!ctXml.includes(`PartName="${partName}"`)) {
                    ctXml = ctXml.replace(
                        '</Types>',
                        `<Override PartName="${partName}" ContentType="${contentType}"/></Types>`
                    );
                }
            }
            xz.file('[Content_Types].xml', ctXml);

            // ── Generate final xlsx blob ─────────────────────────
            const finalBlob = await xz.generateAsync({
                type: 'blob',
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });
            triggerDownload(finalBlob, 'bulk-export.xlsx');
            overlay.classList.remove('open');
        };

        if (invalids.length) showWarn(invalids, doExport);
        else doExport();
    }

    document.getElementById('bulk-xlsx-export-zip').addEventListener('click', () => processXlsx('zip'));
    document.getElementById('bulk-xlsx-export-xlsx').addEventListener('click', () => processXlsx('xlsx'));

})();

// Hook all relevant inputs to save
function hookSaveListeners() {
    const ids = ['size-input', 'size-slider', 'gap-input', 'gap-slider', 'hide-slice', 'hide-sides'];
    ids.forEach(id => document.getElementById(id)?.addEventListener('input', saveSettings));
    document.querySelectorAll('input[name=orientation]').forEach(r => r.addEventListener('change', saveSettings));
    document.getElementById('svg-style-select').addEventListener('change', saveSettings);
    document.getElementById('display-reset-default').addEventListener('click', saveSettings);
    document.getElementById('fill-reset-btn').addEventListener('click', saveSettings);
    document.getElementById('fill-mute-btn').addEventListener('click', saveSettings);
    document.getElementById('ctb-undo').addEventListener('click', saveSettings);
    document.getElementById('ctb-redo').addEventListener('click', saveSettings);
    document.querySelectorAll('.export-tab').forEach(b => b.addEventListener('click', saveSettings));
    document.getElementById('canvas-inner').addEventListener('click', saveSettings);
    document.getElementById('scheme-mode-classical').addEventListener('click', saveSettings);
    document.getElementById('scheme-mode-custom').addEventListener('click', saveSettings);
    hamburgerBtn.addEventListener('click', saveSettings);
    febActionBtn.addEventListener('click', () => setTimeout(saveSettings, 300));
    document.querySelectorAll('.feb-option').forEach(o => o.addEventListener('click', saveSettings));
    febActionBtn.addEventListener('dblclick', () => setTimeout(saveSettings, 300));
    // scheme color inputs — delegate since they're rebuilt dynamically
    document.getElementById('scheme-grid').addEventListener('input', saveSettings);
}

document.getElementById('scheme-reset-default').addEventListener('click', () => {
    const slots = sq1vis.getColorSlots();
    const defaults = {};
    slots.forEach(s => { defaults[s.id] = s.default; });
    sq1vis.setColorScheme(defaults);
    buildSchemeGrid();
    draw();
    saveSettings();
});

hookSaveListeners();
appInitialized = true;
draw();
