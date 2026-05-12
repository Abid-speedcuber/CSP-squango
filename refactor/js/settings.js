/* ==== FILE: js/settings.js ==== */

import { ParityTracerLibrary } from './tools/cales-parity-tracer.js?v=esm-20260511-2';
import { enhancedAccess, updateAppState } from './restoftheapp.js?v=esm-20260511-2';
import { bindDelegatedActions, registerAction } from './browser-api.js?v=esm-20260511-2';

/*
╔═══════════════════════════════════════════════════════════════════════════╗
║                        UNIFIED SETTINGS MODAL                             ║
╚═══════════════════════════════════════════════════════════════════════════╝
*/

export const SETTINGS_TABS = [
    { id: 'homescreen',    label: 'Personalization',    icon: 'res/settings.svg' },
    { id: 'parity',        label: 'Parity Tracer Settings', icon: 'res/tracing.svg' },
    { id: 'trainer',       label: 'Trainer Settings',       icon: 'res/training.svg' },
    { id: 'animate',       label: 'Animate Algs Settings',  icon: 'res/animate_alg_settings.svg' },
];

export let _settingsActiveTab = 'homescreen';

// ── Public API ────────────────────────────────────────────────────────────────

export function openUnifiedSettings(tabId) {
    _settingsActiveTab = tabId || 'homescreen';
    _buildSettingsModal();
}

export function openSettingsModal() {
    openUnifiedSettings('homescreen');
}

export function openParityTracingPersonalization() {
    // Still delegates to the parity-tracer library's config modal
    if (ParityTracerLibrary && ParityTracerLibrary.openConfigModal) {
        const config = _buildParityConfig();
        ParityTracerLibrary.openConfigModal(null, config, null, null, null);
    } else {
        openUnifiedSettings('parity');
    }
}

// ── Build modal DOM ───────────────────────────────────────────────────────────

export function _buildSettingsModal() {
    if (document.getElementById('unifiedSettingsModal')) return;

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
        <button data-action="settings-close" style="background:none;border:none;font-size:1.7rem;cursor:pointer;color:var(--sidebar-close-color);line-height:1;padding:0;">&times;</button>
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
    _wireSettingsActions(overlay);

    _renderTab(_settingsActiveTab);

    if (typeof pushModalState === 'function') pushModalState('unifiedSettingsModal', _closeSettingsModal);
}

export function _switchTab(tabId) {
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

export function _renderTab(tabId) {
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

export function _closeSettingsModal() {
    closeModalWithHistory(() => {
        const modal = document.getElementById('unifiedSettingsModal');
        if (!modal) return;
        modal.remove();
        document.documentElement.classList.remove('scroll-locked');
        window.scrollTo(0, window.modalScrollY || 0);
    });
}

// ── Shared helpers ────────────────────────────────────────────────────────────

export function _row(labelHtml, controlHtml, tipHtml) {
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

export function _toggle(id, checked, action) {
    return `<input type="checkbox" id="${id}" ${checked ? 'checked' : ''} data-action="${action}" style="transform:scale(1.3);cursor:pointer;">`;
}

export function _slider(id, min, max, step, value, action, displayId, extraAttrs = '') {
    return `
    <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}"
        data-action="${action}" data-display="${displayId}" ${extraAttrs} style="width:100%;cursor:pointer;">
    <div style="display:flex;justify-content:space-between;font-size:0.78rem;color:var(--text-secondary);margin-top:3px;">
        <span>${min}</span><span id="${displayId}" style="font-weight:600;">${value}</span><span>${max}</span>
    </div>`;
}

export function _sectionTitle(text) {
    return `<div style="font-size:0.8rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--text-secondary);margin:18px 0 10px;padding-bottom:4px;border-bottom:1px solid var(--surface-border);">${text}</div>`;
}

export function _actionBtn(label, action, tipHtml) {
    return `
    <div data-action="${action}" class="settings-action-btn"
        style="padding:11px 16px;border-radius:10px;cursor:pointer;width:100%;margin-bottom:8px;font-weight:600;font-size:0.92rem;
               transition:all 0.2s;display:flex;align-items:center;justify-content:space-between;
               background:var(--surface2);border:1px solid var(--border-color);color:var(--text-ui);"
        >
        <span>${label}</span>
        ${tipHtml ? `<span class="info-wrapper" data-action-stop="true">
            <button class="settings-info-btn" aria-label="More info"><img src="res/info.svg"></button>
            <span class="info-box">${tipHtml}</span>
        </span>` : ''}
    </div>`;
}

// ── TAB: Homescreen ───────────────────────────────────────────────────────────

export function _renderHomescreenTab(panel) {
    panel.innerHTML += `
        ${_sectionTitle('Display')}
        ${_row('Dark Mode',
            _toggle('hs_themeToggle', document.documentElement.getAttribute('data-theme') === 'dark', 'settings-theme'),
            'Switch between light and dark mode.')}
        ${_row('Show Tracing Guides',
            _toggle('hs_hintToggle', showHints, 'settings-hints'),
            'Show/hide the numbered tracing guide overlays on case images. The numbers indicate tracing order.<br><br><strong>Keyboard shortcut:</strong> Alt+T')}
        ${_row('Hide Instruction Buttons',
            _toggle('hs_hideInstructionsToggle', hideInstructions, 'settings-hide-instructions'),
            'Hide all ⓘ instruction buttons across the app.<br><br><strong>Keyboard shortcut:</strong> Alt+H')}
        ${_row('Hide Parentheses',
            _toggle('hs_hideParenthesisToggle', hideParenthesis, 'settings-hide-parenthesis'),
            'Removes parentheses and switches the alg font from monospace to Arial for a cleaner look.<br><br><strong>Keyboard shortcut:</strong> Alt+P')}

        ${_sectionTitle('Algorithm Font Size')}
        <div style="margin-bottom:18px;">
            ${_slider('hs_algFontSizeSlider', 10, 20, 1, algorithmFontSize,
                'settings-alg-font-size', 'hs_algFontSizeValue')}
            <div style="display:flex;justify-content:space-between;font-size:0.78rem;color:var(--text-secondary);margin-top:2px;">
                <span>Small</span><span>Large</span>
            </div>
        </div>

        ${_sectionTitle('Tools')}
        ${_actionBtn('Color Scheme Settings',
            'settings-open-color-scheme',
            'Change your Square-1 colour scheme. This affects parity tracing and draw-scramble visualizations.')}
        ${_actionBtn('Quick Edit',
            'settings-open-quick-edit',
            'Bulk-edit case algs, names and subtitles. Intended for preset creators.<br><br><strong>Keyboard shortcut:</strong> Alt+Q')}
        ${_actionBtn('Customize Tracing Guides',
            'settings-open-svg-editor',
            'Drag the numbered labels to your preferred positions on each shape image.<br><br><strong>Keyboard shortcut:</strong> Alt+G')}

        ${_sectionTitle('Access')}
        ${_row('Enable Enhanced Access',
            _toggle('hs_enhancedAccessToggle', enhancedAccess, 'settings-enhanced-access'),
            'Unlocks alg editing inside Edit Case and Quick Edit. Keep off unless you are building a preset.')}
    `;

    // Sync slider display
    document.getElementById('hs_algFontSizeValue').textContent = algorithmFontSize + 'px';
}

// ── TAB: Parity Tracer ────────────────────────────────────────────────────────

export function _buildParityConfig() {
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

export function _renderParityTab(panel) {
    const storedZ2 = localStorage.getItem('z2TracingMode');
    const z2On = storedZ2 !== null ? storedZ2 === 'true' : true;
    const ptSize = parseInt(localStorage.getItem('parityTracerImageSize') || '200');
    const showArrow = localStorage.getItem('parityTracerArrow') !== 'false';

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
            `<select id="pt_cornerSticker" data-action="settings-pt-corner-sticker"
                style="padding:5px 8px;border:1px solid var(--border-color);border-radius:6px;background:var(--surface);color:var(--text-ui);">
                <option value="counterclockwise" ${cornerMode==='counterclockwise'?'selected':''}>Counter-clockwise sticker</option>
                <option value="clockwise" ${cornerMode==='clockwise'?'selected':''}>Clockwise sticker</option>
            </select>`,
            'Corner sticker mode determines which sticker (left-most sticker or right-most sticker) of the corner you use for tracing. This doesn not affect parity calculations, just your personal preference.')}
        ${_row('z2 Tracing for 6/8-Edge Cases',
            _toggle('pt_z2', z2On, 'settings-pt-z2'),
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
                data-action="settings-pt-img-size" style="width:100%;cursor:pointer;">
        </div>
        ${_row('Show Tracing Arrow',
            _toggle('pt_showArrow', showArrow, 'settings-pt-arrow'),
            'The circular arrow shows where your tracing starts on each layer. You can customize its appearance or hide it completely.')}

        <div id="pt_arrowSettings" style="opacity:${showArrow?'1':'0.4'};pointer-events:${showArrow?'auto':'none'};">
            <div style="margin-bottom:12px;">
                <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px;">
                    <label style="font-size:0.88rem;font-weight:500;color:var(--text-secondary);">Arrow Opacity: <span id="pt_opacityVal">${Math.round(arrowSettings.opacity*100)}%</span></label>
                </div>
                <input type="range" id="pt_opacity" min="0" max="100" value="${Math.round(arrowSettings.opacity*100)}"
                    data-action="settings-pt-arrow-prop" data-prop="opacity" style="width:100%;cursor:pointer;">
            </div>
            <div style="margin-bottom:12px;">
                <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px;">
                    <label style="font-size:0.88rem;font-weight:500;color:var(--text-secondary);">Stroke Width: <span id="pt_strokeVal">${arrowSettings.strokeWidth.toFixed(1)}</span></label>
                </div>
                <input type="range" id="pt_stroke" min="0.5" max="5" step="0.1" value="${arrowSettings.strokeWidth}"
                    data-action="settings-pt-arrow-prop" data-prop="strokeWidth" style="width:100%;cursor:pointer;">
            </div>
            <div style="margin-bottom:12px;">
                <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px;">
                    <label style="font-size:0.88rem;font-weight:500;color:var(--text-secondary);">Arrow Radius: <span id="pt_radiusVal">${arrowSettings.radius.toFixed(2)}</span></label>
                </div>
                <input type="range" id="pt_radius" min="0.1" max="1.1" step="0.01" value="${arrowSettings.radius}"
                    data-action="settings-pt-arrow-prop" data-prop="radius" style="width:100%;cursor:pointer;">
            </div>
        </div>

        ${_sectionTitle('Tools')}
        ${_actionBtn('Set Tracing Scheme',
            'settings-open-parity-personalization',
            'Set the starting piece (edge or corner) for each shape. This determines the order in which pieces are traced and therefore the odds/evens assigned to your algs.')}

        ${_sectionTitle('Evilness')}
        ${_row('Enable Evilness Factor',
            _toggle('pt_evilness', evilOn, 'settings-pt-evilness'),
            'When enabled, each case can be flagged as "evil". Evil cases add +1 to the parity total, flipping the result.')}
        <div id="pt_evilSubSettings" style="opacity:${evilOn?'1':'0.4'};pointer-events:${evilOn?'auto':'none'};">
            ${_row('Evilness Affects Homescreen',
                _toggle('pt_evilStr', evilStrOn, 'settings-pt-evil-str'),
                'When ON, the parity tags (Odd/Even) shown on algs on the homescreen also factor in the evilness of each case.')}
            ${_actionBtn('Per-case Evilness Settings',
                'settings-open-evilness-cases',
                'Mark individual cases as evil or good.')}
        </div>
    `;
}

export function _ptSaveCornerSticker(val) {
    updateAppState({ cornerStickerMode: val });
    if (typeof saveState === 'function') saveState();
    _triggerParityLiveUpdate();
};
export function _ptSaveZ2(val) {
    localStorage.setItem('z2TracingMode', val.toString());
    _triggerParityLiveUpdate();
};
export function _ptSaveImgSize(val) {
    document.getElementById('pt_imgSizeVal').textContent = val + 'px';
    localStorage.setItem('parityTracerImageSize', val);
    _triggerParityLiveUpdate();
};
export function _ptSaveArrow(val) {
    localStorage.setItem('parityTracerArrow', val.toString());
    const container = document.getElementById('pt_arrowSettings');
    if (container) { container.style.opacity = val ? '1' : '0.4'; container.style.pointerEvents = val ? 'auto' : 'none'; }
    _triggerParityLiveUpdate();
};
export function _ptSaveArrowProp(prop, val) {
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
export function _ptToggleEvilness(checkbox) {
    const newVal = checkbox.checked;
    checkbox.checked = !newVal; // revert until confirmed
    _confirmExpensiveOp(
        `${newVal ? 'Enable' : 'Disable'} Evilness factor?`,
        'This will update the parity calculations and may freeze your page for a brief moment.',
        () => {
            checkbox.checked = newVal;
            updateAppState({ evilnessFactor: newVal });
            if (typeof saveState === 'function') saveState();
            const sub = document.getElementById('pt_evilSubSettings');
            if (sub) { sub.style.opacity = newVal ? '1' : '0.4'; sub.style.pointerEvents = newVal ? 'auto' : 'none'; }
            if (typeof markParityAlgorithmsDirty === 'function') markParityAlgorithmsDirty();
            if (typeof calculateAndCacheAllParity === 'function') calculateAndCacheAllParity();
            if (typeof render === 'function') render();
            if (typeof showToast === 'function') showToast(`Evilness ${newVal ? 'enabled' : 'disabled'}`, 3000, 'success');
        }
    );
};
export function _ptToggleEvilStr(checkbox) {
    const newVal = checkbox.checked;
    checkbox.checked = !newVal;
    _confirmExpensiveOp(
        `${newVal ? 'Enable' : 'Disable'} Evilness in Parity Results?`,
        'This will update the parity calculations and may freeze your page for a brief moment.',
        () => {
            checkbox.checked = newVal;
            updateAppState({ evilnessStringReturn: newVal });
            if (typeof saveState === 'function') saveState();
            if (typeof markParityAlgorithmsDirty === 'function') markParityAlgorithmsDirty();
            if (typeof calculateAndCacheAllParity === 'function') calculateAndCacheAllParity();
            if (typeof render === 'function') render();
        }
    );
};
export function _openEvilnessCasesFromSettings() {
    const config = _buildParityConfig();
    if (ParityTracerLibrary && ParityTracerLibrary.openEvilnessCasesModal) {
        ParityTracerLibrary.openEvilnessCasesModal(config);
    }
};
export function _triggerParityLiveUpdate() {
    const backdrop = document.querySelector('.parity-tracer-backdrop');
    if (!backdrop) return;
    const input = backdrop.querySelector('input[type="text"]');
    if (input) input.dispatchEvent(new Event('input', { bubbles: true }));
}

export function toggleTheme(isDark) {
    const next = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('sqg-csp-theme', next);
    const toggle = document.getElementById('hs_themeToggle');
    if (toggle) toggle.checked = isDark;
};

// ── TAB: Trainer ──────────────────────────────────────────────────────────────

export function _renderTrainerTab(panel) {
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
                data-action="settings-tr-img-size" style="width:100%;cursor:pointer;">
        </div>
        <div style="margin-bottom:18px;">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
                <label style="font-weight:500;color:var(--text-secondary);font-size:0.92rem;">Scramble Text Size: <span id="tr_txtSizeVal">${txtSize}px</span></label>
            </div>
            <input type="range" id="tr_txtSize" min="10" max="24" step="1" value="${txtSize}"
                data-action="settings-tr-text-size" style="width:100%;cursor:pointer;">
        </div>

        ${_sectionTitle('Timer')}
        <div style="margin-bottom:18px;">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
                <label style="font-weight:500;color:var(--text-secondary);font-size:0.92rem;">Timer Text Size: <span id="tr_tmrSizeVal">${tmrSize}px</span></label>
            </div>
            <input type="range" id="tr_tmrSize" min="30" max="120" step="2" value="${tmrSize}"
                data-action="settings-tr-timer-size" style="width:100%;cursor:pointer;">
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
                data-action="settings-tr-hold" style="width:100%;cursor:pointer;">
        </div>

        ${_sectionTitle('Display')}
        ${_row('Show Previous Scramble',
            _toggle('tr_showPrev', showPrev, 'settings-tr-show-prev'),
            'Shows the previous scramble at the very bottom of the screen.')}

        ${_sectionTitle('Inspection')}
        ${_row('Enable Inspection',
            _toggle('tr_insp', insp, 'settings-tr-inspection'))}
        <div id="tr_pquizRow" style="opacity:${insp?'1':'0.4'};pointer-events:${insp?'auto':'none'};">
            ${_row('Parity Quiz During Inspection',
                _toggle('tr_pquiz', pquiz, 'settings-tr-parity-quiz'),
                'During inspection, the trainer will quiz you about the parity state of the current scramble')}
        </div>
    `;
}

export function _trSave(key, val, displayId, fmt) {
    localStorage.setItem(key, val);
    const el = document.getElementById(displayId);
    if (el) el.textContent = fmt ? fmt(val) : val;
};
export function _trSaveBool(key, val) { localStorage.setItem(key, val.toString()); };
export function _trSaveImgSize(val) {
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
export function _trApplyTextSize(val) {
    const el = document.getElementById('trainingScramble');
    if (el) { el.style.fontSize = val + 'px'; if (typeof trainingScrambleTextSize !== 'undefined') trainingScrambleTextSize = parseInt(val); }
    if (typeof applyPrevScrambleBar === 'function') applyPrevScrambleBar();
};
export function _trApplyTimerSize() {
    if (typeof trainingScrambleTextSize !== 'undefined') {}
    if (typeof applyTimerSize === 'function') applyTimerSize();
};
export function _trApplyHold(val) {
    if (typeof trainingHoldToStart !== 'undefined') trainingHoldToStart = parseFloat(val);
};
export function _trApplyPrevBar() {
    if (typeof applyPrevScrambleBar === 'function') applyPrevScrambleBar();
};
export function _trToggleInspection(val) {
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
export function _trTogglePQuiz(val) {
    const inspOn = localStorage.getItem('trainingEnableInspection') === 'true';
    if (!inspOn) { const cb = document.getElementById('tr_pquiz'); if (cb) cb.checked = false; return; }
    if (typeof trainingEnableParityQuiz !== 'undefined') trainingEnableParityQuiz = val;
    localStorage.setItem('trainingEnableParityQuiz', val.toString());
};

// ── TAB: Alg Animator ────────────────────────────────────────────────────────

export function _renderAnimateTab(panel) {
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
                data-action="settings-aa-speed" style="width:100%;cursor:pointer;">
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
                data-action="settings-aa-delay" style="width:100%;cursor:pointer;">
        </div>

        ${_sectionTitle('Display')}
        <div style="margin-bottom:18px;">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
                <label style="font-weight:500;color:var(--text-secondary);font-size:0.92rem;">Image Size: <span id="aa_imgSizeVal">${imgSize}px</span></label>
            </div>
            <input type="range" id="aa_imgSize" min="100" max="400" step="10" value="${imgSize}"
                data-action="settings-aa-img-size" style="width:100%;cursor:pointer;">
        </div>
        ${_row('Animate Both Layers Together',
            _toggle('aa_bothLayers', bothLay, 'settings-aa-both-layers'),
            null)}
        ${_row('Vertical Stack Display',
            _toggle('aa_vertDisplay', vertDis, 'settings-aa-vertical-display'),
            'When ON, the top and bottom layer images stack vertically instead of side-by-side.')}
    `;
}

export function _aaSave(key, val, displayId, fmt) {
    localStorage.setItem(key, val);
    const el = document.getElementById(displayId);
    if (el) el.textContent = fmt ? fmt(val) : val;
};
export function _aaSaveBool(key, val) { localStorage.setItem(key, val.toString()); };

const settingsClickActions = {
    'settings-close': () => _closeSettingsModal(),
    'settings-open-color-scheme': () => openColorSchemeModal(),
    'settings-open-quick-edit': () => openQuickEditModal(),
    'settings-open-svg-editor': () => openCustomizeSVGsModal(),
    'settings-open-parity-personalization': () => {
        _closeSettingsModal();
        setTimeout(() => openParityTracingPersonalization(), 200);
    },
    'settings-open-evilness-cases': () => {
        _closeSettingsModal();
        setTimeout(() => _openEvilnessCasesFromSettings(), 200);
    },
};

const settingsChangeActions = {
    'settings-theme': (_event, target) => toggleTheme(target.checked),
    'settings-hints': (_event, target) => toggleHints(target.checked),
    'settings-hide-instructions': (_event, target) => toggleHideInstructions(target.checked),
    'settings-hide-parenthesis': (_event, target) => toggleHideParenthesis(target.checked),
    'settings-enhanced-access': (_event, target) => toggleEnhancedAccess(target.checked),
    'settings-pt-corner-sticker': (_event, target) => _ptSaveCornerSticker(target.value),
    'settings-pt-z2': (_event, target) => _ptSaveZ2(target.checked),
    'settings-pt-arrow': (_event, target) => _ptSaveArrow(target.checked),
    'settings-pt-evilness': (_event, target) => _ptToggleEvilness(target),
    'settings-pt-evil-str': (_event, target) => _ptToggleEvilStr(target),
    'settings-tr-show-prev': (_event, target) => {
        _trSaveBool('trainingShowPrevScramble', target.checked);
        _trApplyPrevBar();
    },
    'settings-tr-inspection': (_event, target) => _trToggleInspection(target.checked),
    'settings-tr-parity-quiz': (_event, target) => _trTogglePQuiz(target.checked),
    'settings-aa-both-layers': (_event, target) => _aaSaveBool('sq1AnimBothLayers', target.checked),
    'settings-aa-vertical-display': (_event, target) => _aaSaveBool('sq1AnimVerticalDisplay', target.checked),
};

const settingsInputActions = {
    'settings-alg-font-size': (_event, target) => updateAlgFontSizePreview(target.value),
    'settings-pt-img-size': (_event, target) => _ptSaveImgSize(target.value),
    'settings-pt-arrow-prop': (_event, target) => {
        const raw = parseFloat(target.value);
        _ptSaveArrowProp(target.dataset.prop, target.dataset.prop === 'opacity' ? raw / 100 : raw);
    },
    'settings-tr-img-size': (_event, target) => _trSaveImgSize(target.value),
    'settings-tr-text-size': (_event, target) => {
        _trSave('trainingScrambleTextSize', target.value, 'tr_txtSizeVal', v => `${v}px`);
        _trApplyTextSize(target.value);
    },
    'settings-tr-timer-size': (_event, target) => {
        _trSave('trainingTimerSize', target.value, 'tr_tmrSizeVal', v => `${v}px`);
        _trApplyTimerSize();
    },
    'settings-tr-hold': (_event, target) => {
        _trSave('trainingHoldToStart', target.value, 'tr_holdVal', v => `${parseFloat(v).toFixed(2)}s`);
        _trApplyHold(target.value);
    },
    'settings-aa-speed': (_event, target) => _aaSave('sq1AnimSpeed', target.value, 'aa_speedVal', v => `${parseFloat(v).toFixed(1)}x`),
    'settings-aa-delay': (_event, target) => _aaSave('sq1AutoDelay', target.value, 'aa_delayVal', v => `${v}ms`),
    'settings-aa-img-size': (_event, target) => _aaSave('sq1AnimImageSize', target.value, 'aa_imgSizeVal', v => `${v}px`),
};

export function _wireSettingsActions(overlay) {
    bindDelegatedActions(overlay, settingsClickActions);
    bindDelegatedActions(overlay, settingsChangeActions, { eventType: 'change' });
    bindDelegatedActions(overlay, settingsInputActions, { eventType: 'input' });
}

// ── Utility: confirm expensive operation ──────────────────────────────────────

export function _confirmExpensiveOp(title, message, onConfirm) {
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

registerAction('openUnifiedSettings', openUnifiedSettings);
registerAction('openSettingsModal', openSettingsModal);
registerAction('openParityTracingPersonalization', openParityTracingPersonalization);
