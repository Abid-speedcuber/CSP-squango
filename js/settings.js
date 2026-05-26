/*
╔═══════════════════════════════════════════════════════════════════════════╗
║                        UNIFIED SETTINGS MODAL                             ║
╚═══════════════════════════════════════════════════════════════════════════╝
*/

const SETTINGS_TABS = [
    { id: 'homescreen', label: 'Personalization', icon: 'res/settings.svg' },
    { id: 'parity', label: 'Parity Tracer Settings', icon: 'res/tracing.svg' },
    { id: 'trainer', label: 'Trainer Settings', icon: 'res/training.svg' },
    { id: 'animate', label: 'Animate Algs Settings', icon: 'res/animate_alg_settings.svg' },
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
        case 'parity': _renderParityTab(panel); break;
        case 'trainer': _renderTrainerTab(panel); break;
        case 'animate': _renderAnimateTab(panel); break;
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
        topLayerMainColor: colorScheme.topColor,
        topLayerColorFullName: typeof getColorName === 'function' ? getColorName(colorScheme.topColor) : 'Top',
        topLayerColorAbbreviation: (typeof getColorName === 'function' ? getColorName(colorScheme.topColor) : 'T').charAt(0),
        bottomLayerMainColor: colorScheme.bottomColor,
        bottomLayerColorFullName: typeof getColorName === 'function' ? getColorName(colorScheme.bottomColor) : 'Bottom',
        bottomLayerColorAbbreviation: (typeof getColorName === 'function' ? getColorName(colorScheme.bottomColor) : 'B').charAt(0),
        frontFaceColorForVisualization: colorScheme.frontColor,
        rightFaceColorForVisualization: colorScheme.rightColor,
        backFaceColorForVisualization: colorScheme.backColor,
        leftFaceColorForVisualization: colorScheme.leftColor,
    };
}

function _renderParityTab(panel) {
    const storedZ2 = localStorage.getItem('z2TracingModeForParityTracerLibrary');
    const z2On = storedZ2 !== null ? storedZ2 === 'true' : true;
    const ptSize = parseInt(localStorage.getItem('parityTracerImageSize') || '200');
    const showArrow = localStorage.getItem('parityTracerShowArrow') !== 'false';

    // Arrow appearance (from stored settings)
    let arrowSettings = { color: 'rgba(253,34,34,0.7)', opacity: 0.7, strokeWidth: 1.6, radius: 0.3 };
    try {
        const s = localStorage.getItem('parityTracerArrowSettings');
        if (s) arrowSettings = JSON.parse(s);
    } catch (_) { }

    const cornerMode = typeof cornerStickerMode !== 'undefined' ? cornerStickerMode : 'counterclockwise';
    const evilOn = typeof evilnessFactor !== 'undefined' && evilnessFactor;
    const evilStrOn = typeof evilnessStringReturn !== 'undefined' && evilnessStringReturn;

    panel.innerHTML += `
        ${_sectionTitle('Tracing Method')}
        ${_row('Corner Sticker for Tracing',
        `<select id="pt_cornerSticker" onchange="_ptSaveCornerSticker(this.value)"
                style="padding:5px 8px;border:1px solid var(--border-color);border-radius:6px;background:var(--surface);color:var(--text-ui);">
                <option value="counterclockwise" ${cornerMode === 'counterclockwise' ? 'selected' : ''}>Counter-clockwise sticker</option>
                <option value="clockwise" ${cornerMode === 'clockwise' ? 'selected' : ''}>Clockwise sticker</option>
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

        <div id="pt_arrowSettings" style="opacity:${showArrow ? '1' : '0.4'};pointer-events:${showArrow ? 'auto' : 'none'};">
            <div style="margin-bottom:12px;">
                <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px;">
                    <label style="font-size:0.88rem;font-weight:500;color:var(--text-secondary);">Arrow Opacity: <span id="pt_opacityVal">${Math.round(arrowSettings.opacity * 100)}%</span></label>
                </div>
                <input type="range" id="pt_opacity" min="0" max="100" value="${Math.round(arrowSettings.opacity * 100)}"
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
        ${_actionBtn('Set Tracing Positions',
                    '_closeSettingsModal();setTimeout(()=>openParityTracingPersonalization(),200)',
                    'Set the starting piece (edge or corner) for each shape. This determines the order in which pieces are traced and therefore the odds/evens assigned to your algs.')}

        ${_sectionTitle('Evilness')}
        ${_row('Enable Evilness Factor',
                        _toggle('pt_evilness', evilOn, '_ptToggleEvilness(this)'),
                        'When enabled, each case can be flagged as "evil". Evil cases add +1 to the parity total, flipping the result.')}
        <div id="pt_evilSubSettings" style="opacity:${evilOn ? '1' : '0.4'};pointer-events:${evilOn ? 'auto' : 'none'};">
            ${_row('Evilness Affects Homescreen',
                            _toggle('pt_evilStr', evilStrOn, '_ptToggleEvilStr(this)'),
                            'When ON, the parity tags (Odd/Even) shown on algs on the homescreen also factor in the evilness of each case.')}
            ${_actionBtn('Per-case Evilness Settings',
                                '_closeSettingsModal();setTimeout(()=>_openEvilnessCasesFromSettings(),200)',
                                'Mark individual cases as evil or good.')}
        </div>
    `;
}

window._ptSaveCornerSticker = function (val) {
    cornerStickerMode = val;
    if (typeof saveState === 'function') saveState();
    _triggerParityLiveUpdate();
};
window._ptSaveZ2 = function (val) {
    localStorage.setItem('z2TracingModeForParityTracerLibrary', val.toString());
    _triggerParityLiveUpdate();
};
window._ptSaveImgSize = function (val) {
    document.getElementById('pt_imgSizeVal').textContent = val + 'px';
    localStorage.setItem('parityTracerImageSize', val);
    _triggerParityLiveUpdate();
};
window._ptSaveArrow = function (val) {
    localStorage.setItem('parityTracerShowArrow', val.toString());
    const container = document.getElementById('pt_arrowSettings');
    if (container) { container.style.opacity = val ? '1' : '0.4'; container.style.pointerEvents = val ? 'auto' : 'none'; }
    _triggerParityLiveUpdate();
};
window._ptSaveArrowProp = function (prop, val, input) {
    let settings = { color: 'rgba(253,34,34,0.7)', opacity: 0.7, strokeWidth: 1.6, radius: 0.3 };
    try { const s = localStorage.getItem('parityTracerArrowSettings'); if (s) settings = JSON.parse(s); } catch (_) { }
    settings[prop] = val;
    localStorage.setItem('parityTracerArrowSettings', JSON.stringify(settings));
    // Update display span
    const displayMap = {
        opacity: ['pt_opacityVal', v => Math.round(v * 100) + '%'],
        strokeWidth: ['pt_strokeVal', v => parseFloat(v).toFixed(1)],
        radius: ['pt_radiusVal', v => parseFloat(v).toFixed(2)]
    };
    if (displayMap[prop]) {
        const el = document.getElementById(displayMap[prop][0]);
        if (el) el.textContent = displayMap[prop][1](val);
    }
    _triggerParityLiveUpdate();
};
window._ptToggleEvilness = function (checkbox) {
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
window._ptToggleEvilStr = function (checkbox) {
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
window._openEvilnessCasesFromSettings = function () {
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

window.toggleTheme = function (isDark) {
    const next = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('sqg-csp-theme', next);
    const toggle = document.getElementById('hs_themeToggle');
    if (toggle) toggle.checked = isDark;
};

// ── TAB: Trainer ──────────────────────────────────────────────────────────────

function _renderTrainerTab(panel) {
    const imgSize = parseInt(localStorage.getItem('trainingScrambleImageSize') || '200');
    const txtSize = parseInt(localStorage.getItem('trainingScrambleTextSize') || '16');
    const tmrSize = parseInt(localStorage.getItem('trainingTimerSize') || '80');
    const holdVal = parseFloat(localStorage.getItem('trainingHoldToStart') || '0.22');
    const showPrev = localStorage.getItem('trainingShowPrevScramble') === 'true';
    const insp = localStorage.getItem('trainingEnableInspection') === 'true';
    const pquiz = localStorage.getItem('trainingEnableParityQuiz') === 'true';

    const hideImg = localStorage.getItem('trainingHideScrambleImage') === 'true';

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
        ${_row('Hide Scramble Image',
        _toggle('tr_hideImg', hideImg, "_trToggleHideScrambleImage(this.checked)"),
        'Hides the scramble image and centers the timer.')}

        ${_row('Show Previous Scramble',
            _toggle('tr_showPrev', showPrev, "_trSaveBool('trainingShowPrevScramble',this.checked);_trApplyPrevBar()"),
            'Shows the previous scramble at the very bottom of the screen.')}

        ${_sectionTitle('Inspection')}
        ${_row('Enable Inspection',
                _toggle('tr_insp', insp, '_trToggleInspection(this.checked)'))}
        <div id="tr_pquizRow" style="opacity:${insp ? '1' : '0.4'};pointer-events:${insp ? 'auto' : 'none'};">
            ${_row('Parity Quiz During Inspection',
                    _toggle('tr_pquiz', pquiz, '_trTogglePQuiz(this.checked)'),
                    'During inspection, the trainer will quiz you about the parity state of the current scramble')}
        </div>
    `;
}

window._trSave = function (key, val, displayId, fmt) {
    localStorage.setItem(key, val);
    const el = document.getElementById(displayId);
    if (el) el.textContent = fmt ? fmt(val) : val;
};
window._trSaveBool = function (key, val) { localStorage.setItem(key, val.toString()); };
window._trSaveImgSize = function (val) {
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
            if (typeof regenerateScrambleLookaheadLegacy === 'function') regenerateScrambleLookaheadLegacy();
        }
    }
    // Live update evilness quiz if open
    const evilModal = document.getElementById('evilnessQuizModal');
    if (evilModal) {
        const imgEl = document.getElementById('evilQuizImage');
        if (imgEl && typeof window._evilCurrentHexCode !== 'undefined' && window._evilCurrentHexCode) {
            try {
                const state = parseHexFormat(window._evilCurrentHexCode);
                const notation = window.sq1Tools.scrambleFromState(state);
                imgEl.innerHTML = visualizeFromScramble(notation, parseInt(val), typeof colorScheme !== 'undefined' ? colorScheme : {});
            } catch (e) { }
        }
    }
};
window._trApplyTextSize = function (val) {
    const el = document.getElementById('trainingScramble');
    if (el) { el.style.fontSize = val + 'px'; if (typeof trainingScrambleTextSize !== 'undefined') trainingScrambleTextSize = parseInt(val); }
    if (typeof applyPrevScrambleBar === 'function') applyPrevScrambleBar();
};
window._trApplyTimerSize = function (val) {
    if (typeof trainingScrambleTextSize !== 'undefined') { }
    if (typeof applyTimerSize === 'function') applyTimerSize();
};
window._trApplyHold = function (val) {
    if (typeof trainingHoldToStart !== 'undefined') trainingHoldToStart = parseFloat(val);
};
window._trApplyPrevBar = function () {
    if (typeof applyPrevScrambleBar === 'function') applyPrevScrambleBar();
};
window._trToggleInspection = function (val) {
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
window._trTogglePQuiz = function (val) {
    const inspOn = localStorage.getItem('trainingEnableInspection') === 'true';
    if (!inspOn) { const cb = document.getElementById('tr_pquiz'); if (cb) cb.checked = false; return; }
    if (typeof trainingEnableParityQuiz !== 'undefined') trainingEnableParityQuiz = val;
    localStorage.setItem('trainingEnableParityQuiz', val.toString());
};
window._trToggleHideScrambleImage = function (val) {
    localStorage.setItem('trainingHideScrambleImage', val.toString());
    if (typeof trainingHideScrambleImage !== 'undefined') trainingHideScrambleImage = val;
    if (typeof applyHideScrambleImage === 'function') applyHideScrambleImage();
};

// ── TAB: Alg Animator ────────────────────────────────────────────────────────

function _renderAnimateTab(panel) {
    const speed = parseFloat(localStorage.getItem('sq1AnimSpeed') || '0.9');
    const delay = parseInt(localStorage.getItem('sq1AutoDelay') || '500');
    const imgSize = parseInt(localStorage.getItem('sq1AnimImageSize') || '200');
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

window._aaSave = function (key, val, displayId, fmt) {
    localStorage.setItem(key, val);
    const el = document.getElementById(displayId);
    if (el) el.textContent = fmt ? fmt(val) : val;
};
window._aaSaveBool = function (key, val) { localStorage.setItem(key, val.toString()); };

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
