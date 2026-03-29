/*
╔═══════════════════════════════════════════════════════════════════════════╗
║                        UNIFIED SETTINGS MODAL                             ║
╚═══════════════════════════════════════════════════════════════════════════╝
*/

const SETTINGS_TABS = [
    { id: 'homescreen',    label: 'Homescreen',    icon: 'res/settings-icons/homescreen_settings.svg' },
    { id: 'parity',        label: 'Parity Tracer', icon: 'res/settings-icons/parity_tracer_settings.svg' },
    { id: 'trainer',       label: 'Trainer',       icon: 'res/settings-icons/trainer_settings.svg' },
    { id: 'animate',       label: 'Alg Animator',  icon: 'res/settings-icons/animate_alg_settings.svg' },
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
    overlay.style.cssText = 'z-index:10002;';
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
        flex-shrink: 0; width: 140px; background: var(--surface2);
        border-right: 1px solid var(--surface-border);
        display: flex; flex-direction: column; gap: 2px; padding: 12px 8px;
        overflow-y: auto;
    `;

    SETTINGS_TABS.forEach(tab => {
        const btn = document.createElement('button');
        btn.id = `settingsTab_${tab.id}`;
        btn.dataset.tab = tab.id;
        btn.style.cssText = `
            display: flex; flex-direction: column; align-items: center; gap: 5px;
            padding: 10px 6px; border-radius: 10px; border: none; cursor: pointer;
            background: ${_settingsActiveTab === tab.id ? 'var(--surface-border)' : 'transparent'};
            color: ${_settingsActiveTab === tab.id ? 'var(--text-ui)' : 'var(--text-secondary)'};
            font-size: 0.72rem; font-weight: 600; transition: all 0.15s; width: 100%;
            line-height: 1.2;
        `;
        btn.innerHTML = `<img src="${tab.icon}" width="24" height="24" style="opacity:${_settingsActiveTab === tab.id ? '1' : '0.6'}"><span>${tab.label}</span>`;
        btn.addEventListener('click', () => _switchTab(tab.id));
        sidebar.appendChild(btn);
    });

    // Panel
    const panel = document.createElement('div');
    panel.id = 'settingsPanel';
    panel.style.cssText = 'flex:1;overflow-y:auto;padding:22px 24px;';

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
        btn.style.color = active ? 'var(--text-ui)' : 'var(--text-secondary)';
        btn.querySelector('img').style.opacity = active ? '1' : '0.6';
    });
    _renderTab(tabId);
}

function _renderTab(tabId) {
    const panel = document.getElementById('settingsPanel');
    if (!panel) return;
    panel.innerHTML = '';
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
    const modal = document.getElementById('unifiedSettingsModal');
    if (!modal) return;
    modal.remove();
    _settingsOpen = false;
    document.documentElement.classList.remove('scroll-locked');
    window.scrollTo(0, window.modalScrollY || 0);
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
               transition:all 0.2s;display:flex;align-items:center;justify-content:space-between;"
        onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
        <span>${label}</span>
        ${tipHtml ? `<span class="info-wrapper">
            <button class="settings-info-btn" aria-label="More info" onclick="event.stopPropagation()"><img src="res/info.svg"></button>
            <span class="info-box">${tipHtml}</span>
        </span>` : ''}
    </div>`;
}

// ── TAB: Homescreen ───────────────────────────────────────────────────────────

function _renderHomescreenTab(panel) {
    panel.innerHTML = `
        ${_sectionTitle('Display')}
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
        ${_actionBtn('Set Tracing Positions',
            'openParityTracingPersonalization()',
            'Change where on each shape your tracing starts. These positions are used to compute odd/even parity.<br><br><strong>Keyboard shortcut:</strong> Alt+W')}
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
        backgroundColor: 'var(--surface)',
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
    } catch (_) {}

    const cornerMode = typeof cornerStickerMode !== 'undefined' ? cornerStickerMode : 'counterclockwise';
    const evilOn = typeof evilnessFactor !== 'undefined' && evilnessFactor;
    const evilStrOn = typeof evilnessStringReturn !== 'undefined' && evilnessStringReturn;

    panel.innerHTML = `
        ${_sectionTitle('Tracing Method')}
        ${_row('Corner Sticker for Tracing',
            `<select id="pt_cornerSticker" onchange="_ptSaveCornerSticker(this.value)"
                style="padding:5px 8px;border:1px solid var(--border-color);border-radius:6px;background:var(--surface);color:var(--text-ui);">
                <option value="counterclockwise" ${cornerMode==='counterclockwise'?'selected':''}>Counter-clockwise sticker</option>
                <option value="clockwise" ${cornerMode==='clockwise'?'selected':''}>Clockwise sticker</option>
            </select>`,
            'Determines which sticker of a corner piece you use for tracing. Counter-clockwise = the sticker that appears first going counter-clockwise from the "seam". This is purely personal preference and does <em>not</em> change the parity result.')}
        ${_row('z2 Tracing for 6/8-Edge Cases',
            _toggle('pt_z2', z2On, '_ptSaveZ2(this.checked)'),
            'When enabled, for cases with 6 or 8 edges the tracer automatically starts from the more edge-dense face regardless of layer. This is the safest tracing mode — without it, those cases flip parity depending on which layer the edges sit on.')}

        ${_sectionTitle('Visualization')}
        <div style="margin-bottom:18px;">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
                <label style="font-weight:500;color:var(--text-secondary);font-size:0.92rem;">Image Size: <span id="pt_imgSizeVal">${ptSize}px</span></label>
                <span class="info-wrapper">
                    <button class="settings-info-btn" aria-label="More info"><img src="res/info.svg"></button>
                    <span class="info-box">Controls the size of the scramble visualization inside the Parity Tracer modal.</span>
                </span>
            </div>
            <input type="range" id="pt_imgSize" min="100" max="400" step="10" value="${ptSize}"
                style="width:100%;cursor:pointer;" oninput="_ptSaveImgSize(this.value)">
        </div>
        ${_row('Show Tracing Arrow',
            _toggle('pt_showArrow', showArrow, '_ptSaveArrow(this.checked)'),
            'Overlays a dashed circular arrow on each layer\'s image showing where tracing begins. Useful as a visual reminder of your tracing start-point.')}

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
        ${_actionBtn('Tracing Scheme Settings',
            '_closeSettingsModal();setTimeout(()=>openParityTracingPersonalization(),200)',
            'Set the starting piece (edge or corner) for each shape. This determines the order in which pieces are traced and therefore the odds/evens assigned to your algs.')}

        ${_sectionTitle('Evilness')}
        ${_row('Enable Evilness Factor',
            _toggle('pt_evilness', evilOn, '_ptToggleEvilness(this)'),
            'When enabled, each case can be flagged as "evil". Evil cases add +1 to the parity total, flipping the result. Useful for people who separate CSP into good/evil alg sets.')}
        <div id="pt_evilSubSettings" style="opacity:${evilOn?'1':'0.4'};pointer-events:${evilOn?'auto':'none'};">
            ${_row('Evilness Affects Homescreen',
                _toggle('pt_evilStr', evilStrOn, '_ptToggleEvilStr(this)'),
                'When ON, the parity tags (Odd/Even) shown on algs on the homescreen also factor in the evilness of each case. Requires a full parity recalculation.')}
            ${_actionBtn('Per-case Evilness Settings',
                '_closeSettingsModal();setTimeout(()=>_openEvilnessCasesFromSettings(),200)',
                'Mark individual cases as evil or good. You can bulk-select and search.')}
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
window._ptSaveArrowProp = function(prop, val, input) {
    let settings = { color: 'rgba(253,34,34,0.7)', opacity: 0.7, strokeWidth: 1.6, radius: 0.3 };
    try { const s = localStorage.getItem('parityTracerArrowSettings'); if (s) settings = JSON.parse(s); } catch(_){}
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
        'This will recalculate parity for all 90 cases and may briefly freeze the page.',
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
        'This will recalculate parity for all 90 cases.',
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
    // Delegates to the parity tracer library's evilness cases modal
    const config = _buildParityConfig();
    if (window.ParityTracerLibrary && window.ParityTracerLibrary.openConfigModal) {
        // The evilness cases modal lives inside the parity tracer settings flow.
        // We open the parity tracer settings and let the user navigate there.
        window.ParityTracerLibrary.openConfigModal(null, config, null, null, null);
    }
};
function _triggerParityLiveUpdate() {
    const backdrop = document.querySelector('.parity-tracer-backdrop');
    if (!backdrop) return;
    const input = backdrop.querySelector('input[type="text"]');
    if (input) input.dispatchEvent(new Event('input', { bubbles: true }));
}

// ── TAB: Trainer ──────────────────────────────────────────────────────────────

function _renderTrainerTab(panel) {
    const imgSize  = parseInt(localStorage.getItem('trainingScrambleImageSize') || '200');
    const txtSize  = parseInt(localStorage.getItem('trainingScrambleTextSize')  || '16');
    const tmrSize  = parseInt(localStorage.getItem('trainingTimerSize')         || '80');
    const holdVal  = parseFloat(localStorage.getItem('trainingHoldToStart')     || '0.22');
    const showPrev = localStorage.getItem('trainingShowPrevScramble') === 'true';
    const insp     = localStorage.getItem('trainingEnableInspection') === 'true';
    const pquiz    = localStorage.getItem('trainingEnableParityQuiz') === 'true';

    panel.innerHTML = `
        ${_sectionTitle('Scramble Display')}
        <div style="margin-bottom:18px;">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
                <label style="font-weight:500;color:var(--text-secondary);font-size:0.92rem;">Image Size: <span id="tr_imgSizeVal">${imgSize}px</span></label>
                <span class="info-wrapper">
                    <button class="settings-info-btn" aria-label="More info"><img src="res/info.svg"></button>
                    <span class="info-box">Controls the scramble image size while training. Larger images are easier to read; smaller images leave more room for the timer.</span>
                </span>
            </div>
            <input type="range" id="tr_imgSize" min="100" max="400" step="10" value="${imgSize}"
                style="width:100%;cursor:pointer;" oninput="_trSave('trainingScrambleImageSize',this.value,'tr_imgSizeVal',v=>v+'px')">
        </div>
        <div style="margin-bottom:18px;">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
                <label style="font-weight:500;color:var(--text-secondary);font-size:0.92rem;">Scramble Text Size: <span id="tr_txtSizeVal">${txtSize}px</span></label>
                <span class="info-wrapper">
                    <button class="settings-info-btn" aria-label="More info"><img src="res/info.svg"></button>
                    <span class="info-box">Controls the font size of the scramble notation text shown below the timer.</span>
                </span>
            </div>
            <input type="range" id="tr_txtSize" min="10" max="24" step="1" value="${txtSize}"
                style="width:100%;cursor:pointer;" oninput="_trSave('trainingScrambleTextSize',this.value,'tr_txtSizeVal',v=>v+'px');_trApplyTextSize(this.value)">
        </div>

        ${_sectionTitle('Timer')}
        <div style="margin-bottom:18px;">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
                <label style="font-weight:500;color:var(--text-secondary);font-size:0.92rem;">Timer Text Size: <span id="tr_tmrSizeVal">${tmrSize}px</span></label>
                <span class="info-wrapper">
                    <button class="settings-info-btn" aria-label="More info"><img src="res/info.svg"></button>
                    <span class="info-box">Controls how large the timer digits appear. Useful if you want a big countdown-clock feel or a more compact display.</span>
                </span>
            </div>
            <input type="range" id="tr_tmrSize" min="30" max="120" step="2" value="${tmrSize}"
                style="width:100%;cursor:pointer;" oninput="_trSave('trainingTimerSize',this.value,'tr_tmrSizeVal',v=>v+'px');_trApplyTimerSize(this.value)">
        </div>
        <div style="margin-bottom:18px;">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
                <label style="font-weight:500;color:var(--text-secondary);font-size:0.92rem;">Hold-to-Start: <span id="tr_holdVal">${holdVal.toFixed(2)}s</span></label>
                <span class="info-wrapper">
                    <button class="settings-info-btn" aria-label="More info"><img src="res/info.svg"></button>
                    <span class="info-box">How long you must hold the spacebar (or press the timer zone) before the timer turns green and releases. Lower = faster start, higher = less accidental starts.</span>
                </span>
            </div>
            <input type="range" id="tr_hold" min="0.1" max="0.7" step="0.01" value="${holdVal}"
                style="width:100%;cursor:pointer;" oninput="_trSave('trainingHoldToStart',this.value,'tr_holdVal',v=>parseFloat(v).toFixed(2)+'s');_trApplyHold(this.value)">
        </div>

        ${_sectionTitle('Display')}
        ${_row('Show Previous Scramble',
            _toggle('tr_showPrev', showPrev, "_trSaveBool('trainingShowPrevScramble',this.checked);_trApplyPrevBar()"),
            'Shows the previous scramble at the very bottom of the screen while training, so you can glance back at what you just solved.')}

        ${_sectionTitle('Inspection')}
        ${_row('Enable Inspection',
            _toggle('tr_insp', insp, '_trToggleInspection(this.checked)'),
            'Adds an inspection phase before each solve. Tap / press space to start inspection, then hold again to begin the solve timer — just like in WCA competitions.')}
        <div id="tr_pquizRow" style="opacity:${insp?'1':'0.4'};pointer-events:${insp?'auto':'none'};">
            ${_row('Parity Quiz During Inspection',
                _toggle('tr_pquiz', pquiz, '_trTogglePQuiz(this.checked)'),
                'During inspection, the timer zone is split into two halves — "Even" on the left and "Odd" on the right. You must guess the parity of the scramble before the solve timer starts. Wrong guesses flash red but don\'t penalize your time.')}
        </div>
    `;
}

window._trSave = function(key, val, displayId, fmt) {
    localStorage.setItem(key, val);
    const el = document.getElementById(displayId);
    if (el) el.textContent = fmt ? fmt(val) : val;
};
window._trSaveBool = function(key, val) { localStorage.setItem(key, val.toString()); };
window._trApplyTextSize = function(val) {
    const el = document.getElementById('trainingScramble');
    if (el) { el.style.fontSize = val + 'px'; if (typeof trainingScrambleTextSize !== 'undefined') trainingScrambleTextSize = parseInt(val); }
    if (typeof applyPrevScrambleBar === 'function') applyPrevScrambleBar();
};
window._trApplyTimerSize = function(val) {
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

    panel.innerHTML = `
        ${_sectionTitle('Playback')}
        <div style="margin-bottom:18px;">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
                <label style="font-weight:500;color:var(--text-secondary);font-size:0.92rem;">Animation Speed: <span id="aa_speedVal">${speed.toFixed(1)}x</span></label>
                <span class="info-wrapper">
                    <button class="settings-info-btn" aria-label="More info"><img src="res/info.svg"></button>
                    <span class="info-box">How fast each move animates. 1.0× is the default speed; higher values speed up rotation; lower values slow it down for careful analysis.</span>
                </span>
            </div>
            <input type="range" id="aa_speed" min="0.2" max="2" step="0.1" value="${speed}"
                style="width:100%;cursor:pointer;" oninput="_aaSave('sq1AnimSpeed',this.value,'aa_speedVal',v=>parseFloat(v).toFixed(1)+'x')">
        </div>
        <div style="margin-bottom:18px;">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
                <label style="font-weight:500;color:var(--text-secondary);font-size:0.92rem;">Auto-play Delay: <span id="aa_delayVal">${delay}ms</span></label>
                <span class="info-wrapper">
                    <button class="settings-info-btn" aria-label="More info"><img src="res/info.svg"></button>
                    <span class="info-box">The pause between moves when auto-playing an algorithm. Set to 0 for no pause between moves.</span>
                </span>
            </div>
            <input type="range" id="aa_delay" min="0" max="1000" step="50" value="${delay}"
                style="width:100%;cursor:pointer;" oninput="_aaSave('sq1AutoDelay',this.value,'aa_delayVal',v=>v+'ms')">
        </div>

        ${_sectionTitle('Display')}
        <div style="margin-bottom:18px;">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
                <label style="font-weight:500;color:var(--text-secondary);font-size:0.92rem;">Image Size: <span id="aa_imgSizeVal">${imgSize}px</span></label>
                <span class="info-wrapper">
                    <button class="settings-info-btn" aria-label="More info"><img src="res/info.svg"></button>
                    <span class="info-box">Controls the size of the cube images inside the Alg Animator modal.</span>
                </span>
            </div>
            <input type="range" id="aa_imgSize" min="100" max="400" step="10" value="${imgSize}"
                style="width:100%;cursor:pointer;" oninput="_aaSave('sq1AnimImageSize',this.value,'aa_imgSizeVal',v=>v+'px')">
        </div>
        ${_row('Animate Both Layers Together',
            _toggle('aa_bothLayers', bothLay, "_aaSaveBool('sq1AnimBothLayers',this.checked)"),
            'When ON, top and bottom layer moves in a <code>(x,y)</code> token are animated simultaneously. When OFF, each layer is animated separately as two distinct steps. "Both together" is more realistic; "separate" is better for learning.')}
        ${_row('Vertical Stack Display',
            _toggle('aa_vertDisplay', vertDis, "_aaSaveBool('sq1AnimVerticalDisplay',this.checked)"),
            'When ON, the top and bottom layer images stack vertically instead of side-by-side. Useful on narrow screens or when you prefer a tall layout.')}

        <div style="margin-top:18px;padding:12px 14px;background:var(--surface2);border-radius:8px;font-size:0.82rem;color:var(--text-secondary);line-height:1.5;">
            <strong>Note:</strong> These settings apply globally. Any Alg Animator window already open will reflect changes on the next move or when re-opened.
        </div>
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