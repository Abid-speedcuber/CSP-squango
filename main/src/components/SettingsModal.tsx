import { useCallback, useEffect, useState } from 'react';
import {
  SETTINGS_TABS,
  closeUnifiedSettings,
  getSettingsActiveTab,
  isSettingsOpen,
  switchSettingsTab,
} from '../app/settingsUI';
import { useAppStore } from '../app/store';
import {
  attachOverlayClose,
  lockScroll,
  pushModalState,
  removeCloseModalFromStack,
  unlockScroll,
} from '../app/modal';
import { confirmExpensiveOp } from '../app/confirm';
import {
  algorithmFontSize,
  cornerStickerMode,
  enhancedAccess,
  evilnessFactor,
  evilnessStringReturn,
  hideInstructions,
  hideParenthesis,
  recalculateAllParity,
  setAlgorithmFontSize,
  setCornerStickerMode,
  setEnhancedAccess,
  setEvilnessFactor,
  setEvilnessStringReturn,
  setHideInstructions,
  setHideParenthesis,
  setShowHints,
  showHints,
  toggleTheme,
} from '../app/state';
import { applyAlgorithmFontSize, applyHintVisibility, applyInstructionVisibility } from '../app/visibility';
import { showToast } from '../app/toast';
import {
  applyHideImgLive,
  applyHoldLive,
  applyImageSizeLive,
  applyPrevBarLive,
  applyTextSizeLive,
  applyTimerSizeLive,
  setEnableInspectionLive,
  setEnableParityQuizLive,
} from '../app/training';

function _row(labelHtml: string, controlHtml: React.ReactNode, tipHtml?: string): React.ReactNode {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 }}>
        <label style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.92rem' }}>{labelHtml}</label>
        {tipHtml ? (
          <span className="info-wrapper">
            <button className="settings-info-btn" aria-label="More info">
              <img src="res/info.svg" alt="" />
            </button>
            <span className="info-box" dangerouslySetInnerHTML={{ __html: tipHtml }} />
          </span>
        ) : null}
      </div>
      <div style={{ flexShrink: 0 }}>{controlHtml}</div>
    </div>
  );
}

function _toggle(id: string, checked: boolean, onchange: (val: boolean) => void): React.ReactNode {
  return (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onchange(e.target.checked)}
      style={{ transform: 'scale(1.3)', cursor: 'pointer' }}
    />
  );
}

function _sectionTitle(text: string): React.ReactNode {
  return (
    <div
      style={{
        fontSize: '0.8rem',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
        margin: '18px 0 10px',
        paddingBottom: 4,
        borderBottom: '1px solid var(--surface-border)',
      }}
    >
      {text}
    </div>
  );
}

function _actionBtn(label: string, onAction: () => void, tipHtml?: string): React.ReactNode {
  return (
    <div
      className="settings-action-btn"
      onClick={onAction}
      style={{
        padding: '11px 16px',
        borderRadius: 10,
        cursor: 'pointer',
        width: '100%',
        marginBottom: 8,
        fontWeight: 600,
        fontSize: '0.92rem',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--surface2)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-ui)',
      }}
    >
      <span>{label}</span>
      {tipHtml ? (
        <span className="info-wrapper">
          <button
            className="settings-info-btn"
            aria-label="More info"
            onClick={(e) => e.stopPropagation()}
          >
            <img src="res/info.svg" alt="" />
          </button>
          <span className="info-box" dangerouslySetInnerHTML={{ __html: tipHtml }} />
        </span>
      ) : null}
    </div>
  );
}

function Slider(props: {
  id: string;
  min: number;
  max: number;
  step: number;
  value: number;
  displayId: string;
  onInput: (val: string) => void;
  valueLabel?: (v: string) => string;
}): React.ReactNode {
  const { id, min, max, step, value, displayId, onInput, valueLabel } = props;
  return (
    <>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ width: '100%', cursor: 'pointer' }}
        onChange={(e) => onInput(e.target.value)}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
          marginTop: 3,
        }}
      >
        <span>{min}</span>
        <span id={displayId} style={{ fontWeight: 600 }}>
          {valueLabel ? valueLabel(String(value)) : value}
        </span>
        <span>{max}</span>
      </div>
    </>
  );
}

function _triggerParityLiveUpdate(): void {
  const backdrop = document.querySelector('.parity-tracer-backdrop');
  if (!backdrop) return;
  const input = backdrop.querySelector('input[type="text"]');
  if (input) input.dispatchEvent(new Event('input', { bubbles: true }));
}

// ── TAB: Homescreen ───────────────────────────────────────────────────────────
function HomescreenTab(): React.ReactNode {
  useAppStore();
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const [fontPreview, setFontPreview] = useState<number>(algorithmFontSize);

  return (
    <>
      {_sectionTitle('Display')}
      {_row('Dark Mode', _toggle('hs_themeToggle', isDark, (v) => toggleTheme(v)), 'Switch between light and dark mode.')}
      {_row(
        'Show Tracing Guides',
        _toggle('hs_hintToggle', showHints, (v) => {
          setShowHints(v);
          applyHintVisibility();
        }),
        'Show/hide the numbered tracing guide overlays on case images. The numbers indicate tracing order.<br><br><strong>Keyboard shortcut:</strong> Alt+T',
      )}
      {_row(
        'Hide Instruction Buttons',
        _toggle('hs_hideInstructionsToggle', hideInstructions, (v) => {
          setHideInstructions(v);
          applyInstructionVisibility();
        }),
        'Hide all &#9432; instruction buttons across the app.<br><br><strong>Keyboard shortcut:</strong> Alt+H',
      )}
      {_row(
        'Hide Parentheses',
        _toggle('hs_hideParenthesisToggle', hideParenthesis, (v) => setHideParenthesis(v)),
        'Removes parentheses and switches the alg font from monospace to Arial for a cleaner look.<br><br><strong>Keyboard shortcut:</strong> Alt+P',
      )}

      {_sectionTitle('Algorithm Font Size')}
      <div style={{ marginBottom: 18 }}>
        <Slider
          id="hs_algFontSizeSlider"
          min={10}
          max={20}
          step={1}
          value={fontPreview}
          displayId="hs_algFontSizeValue"
          valueLabel={(v) => v + 'px'}
          onInput={(v) => {
            const size = parseInt(v, 10);
            setFontPreview(size);
            setAlgorithmFontSize(size);
            applyAlgorithmFontSize(size);
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
          <span>Small</span>
          <span>Large</span>
        </div>
      </div>

      {_sectionTitle('Tools')}
      {_actionBtn(
        'Color Scheme Settings',
        () => (window as unknown as { openColorSchemeModal?: () => void }).openColorSchemeModal?.(),
        'Change your Square-1 colour scheme. This affects parity tracing and draw-scramble visualizations.',
      )}
      {_actionBtn(
        'Quick Edit',
        () => (window as unknown as { openQuickEditModal?: () => void }).openQuickEditModal?.(),
        'Bulk-edit case algs, names and subtitles. Intended for preset creators.<br><br><strong>Keyboard shortcut:</strong> Alt+Q',
      )}
      {_actionBtn(
        'Customize Tracing Guides',
        () => (window as unknown as { openCustomizeSVGsModal?: () => void }).openCustomizeSVGsModal?.(),
        'Drag the numbered labels to your preferred positions on each shape image.<br><br><strong>Keyboard shortcut:</strong> Alt+G',
      )}

      {_sectionTitle('Access')}
      {_row(
        'Enable Enhanced Access',
        _toggle('hs_enhancedAccessToggle', enhancedAccess, (v) => setEnhancedAccess(v)),
        'Unlocks alg editing inside Edit Case and Quick Edit. Keep off unless you are building a preset.',
      )}
    </>
  );
}

// ── TAB: Parity Tracer ────────────────────────────────────────────────────────
function ParityTab(): React.ReactNode {
  useAppStore();
  const [ptSize, setPtSize] = useState<number>(parseInt(localStorage.getItem('parityTracerImageSize') || '200', 10));
  const storedZ2 = localStorage.getItem('z2TracingModeForParityTracerLibrary');
  const z2On = storedZ2 !== null ? storedZ2 === 'true' : true;
  const showArrow = localStorage.getItem('parityTracerShowArrow') !== 'false';

  let arrowSettings = { color: 'rgba(253,34,34,0.7)', opacity: 0.7, strokeWidth: 1.6, radius: 0.3 };
  try {
    const s = localStorage.getItem('parityTracerArrowSettings');
    if (s) arrowSettings = JSON.parse(s);
  } catch {
    // ignore
  }

  const [arrowOpacity, setArrowOpacity] = useState<number>(Math.round(arrowSettings.opacity * 100));
  const [arrowStroke, setArrowStroke] = useState<number>(arrowSettings.strokeWidth);
  const [arrowRadius, setArrowRadius] = useState<number>(arrowSettings.radius);

  const saveArrowProp = (prop: 'opacity' | 'strokeWidth' | 'radius', val: number) => {
    let settings = { color: 'rgba(253,34,34,0.7)', opacity: 0.7, strokeWidth: 1.6, radius: 0.3 };
    try {
      const s = localStorage.getItem('parityTracerArrowSettings');
      if (s) settings = JSON.parse(s);
    } catch {
      // ignore
    }
    settings[prop] = val;
    localStorage.setItem('parityTracerArrowSettings', JSON.stringify(settings));
    if (prop === 'opacity') setArrowOpacity(Math.round(val * 100));
    if (prop === 'strokeWidth') setArrowStroke(val);
    if (prop === 'radius') setArrowRadius(val);
    _triggerParityLiveUpdate();
  };

  const toggleEvilness = (confirmTitle: string, confirmMsg: string, apply: () => void) => {
    confirmExpensiveOp(confirmTitle, confirmMsg, () => {
      apply();
    });
  };

  return (
    <>
      {_sectionTitle('Tracing Method')}
      {_row(
        'Corner Sticker for Tracing',
        <select
          id="pt_cornerSticker"
          value={cornerStickerMode}
          onChange={(e) => {
            setCornerStickerMode(e.target.value as 'counterclockwise' | 'clockwise');
            _triggerParityLiveUpdate();
          }}
          style={{
            padding: '5px 8px',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            background: 'var(--surface)',
            color: 'var(--text-ui)',
          }}
        >
          <option value="counterclockwise">Counter-clockwise sticker</option>
          <option value="clockwise">Clockwise sticker</option>
        </select>,
        'Corner sticker mode determines which sticker (left-most sticker or right-most sticker) of the corner you use for tracing. This doesn not affect parity calculations, just your personal preference.',
      )}
      {_row(
        'z2 Tracing for 6/8-Edge Cases',
        _toggle('pt_z2', z2On, (v) => {
          localStorage.setItem('z2TracingModeForParityTracerLibrary', v.toString());
          _triggerParityLiveUpdate();
        }),
        'z2 tracing for 6 and 8 edge cases means you prioritize the more edge-dense face to start your tracing, regardless of which layer it is on. This is the safest tracing mode. If you do not do z2 tracing, for 2E6E cases parity gets flipped',
      )}

      {_sectionTitle('Visualization')}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
          <label style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Image Size: <span id="pt_imgSizeVal">{ptSize}px</span>
          </label>
          <span className="info-wrapper">
            <button className="settings-info-btn" aria-label="More info">
              <img src="res/info.svg" alt="" />
            </button>
            <span className="info-box">
              Image size controls how big the square-1 visualization appears. Adjust this based on your screen size and
              preference.
            </span>
          </span>
        </div>
        <input
          id="pt_imgSize"
          type="range"
          min={100}
          max={400}
          step={10}
          value={ptSize}
          style={{ width: '100%', cursor: 'pointer' }}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            setPtSize(val);
            localStorage.setItem('parityTracerImageSize', String(val));
            _triggerParityLiveUpdate();
          }}
        />
      </div>
      {_row(
        'Show Tracing Arrow',
        _toggle('pt_showArrow', showArrow, (v) => {
          localStorage.setItem('parityTracerShowArrow', v.toString());
          _triggerParityLiveUpdate();
        }),
        'The circular arrow shows where your tracing starts on each layer. You can customize its appearance or hide it completely.',
      )}

      <div id="pt_arrowSettings" style={{ opacity: showArrow ? '1' : '0.4', pointerEvents: showArrow ? 'auto' : 'none' }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Arrow Opacity: <span id="pt_opacityVal">{arrowOpacity}%</span>
            </label>
          </div>
          <input
            id="pt_opacity"
            type="range"
            min={0}
            max={100}
            value={arrowOpacity}
            style={{ width: '100%', cursor: 'pointer' }}
            onChange={(e) => saveArrowProp('opacity', parseInt(e.target.value, 10) / 100)}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Stroke Width: <span id="pt_strokeVal">{arrowStroke.toFixed(1)}</span>
            </label>
          </div>
          <input
            id="pt_stroke"
            type="range"
            min={0.5}
            max={5}
            step={0.1}
            value={arrowStroke}
            style={{ width: '100%', cursor: 'pointer' }}
            onChange={(e) => saveArrowProp('strokeWidth', parseFloat(e.target.value))}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Arrow Radius: <span id="pt_radiusVal">{arrowRadius.toFixed(2)}</span>
            </label>
          </div>
          <input
            id="pt_radius"
            type="range"
            min={0.1}
            max={1.1}
            step={0.01}
            value={arrowRadius}
            style={{ width: '100%', cursor: 'pointer' }}
            onChange={(e) => saveArrowProp('radius', parseFloat(e.target.value))}
          />
        </div>
      </div>

      {_sectionTitle('Tools')}
      {_actionBtn(
        'Set Tracing Positions',
        () => {
          closeUnifiedSettings();
          setTimeout(() => {
            (window as unknown as { openParityTracingPersonalization?: () => void }).openParityTracingPersonalization?.();
          }, 200);
        },
        'Set the starting piece (edge or corner) for each shape. This determines the order in which pieces are traced and therefore the odds/evens assigned to your algs.',
      )}

      {_sectionTitle('Evilness')}
      {_row(
        'Enable Evilness Factor',
        _toggle('pt_evilness', evilnessFactor, (v) =>
          toggleEvilness(
            `${v ? 'Enable' : 'Disable'} Evilness factor?`,
            'This will update the parity calculations and may freeze your page for a brief moment.',
            () => {
              setEvilnessFactor(v);
              recalculateAllParity();
              showToast(`Evilness ${v ? 'enabled' : 'disabled'}`, 3000, 'success');
            },
          ),
        ),
        'When enabled, each case can be flagged as "evil". Evil cases add +1 to the parity total, flipping the result.',
      )}
      <div id="pt_evilSubSettings" style={{ opacity: evilnessFactor ? '1' : '0.4', pointerEvents: evilnessFactor ? 'auto' : 'none' }}>
        {_row(
          'Evilness Affects Homescreen',
          _toggle('pt_evilStr', evilnessStringReturn, (v) =>
            toggleEvilness(
              `${v ? 'Enable' : 'Disable'} Evilness in Parity Results?`,
              'This will update the parity calculations and may freeze your page for a brief moment.',
              () => {
                setEvilnessStringReturn(v);
                recalculateAllParity();
              },
            ),
          ),
          'When ON, the parity tags (Odd/Even) shown on algs on the homescreen also factor in the evilness of each case.',
        )}
        {_actionBtn(
          'Per-case Evilness Settings',
          () => {
            closeUnifiedSettings();
            setTimeout(() => {
              (window as unknown as { _openEvilnessCasesFromSettings?: () => void })._openEvilnessCasesFromSettings?.();
            }, 200);
          },
          'Mark individual cases as evil or good.',
        )}
      </div>
    </>
  );
}

// ── TAB: Trainer ──────────────────────────────────────────────────────────────
function TrainerTab(): React.ReactNode {
  const [imgSize, setImgSize] = useState<number>(parseInt(localStorage.getItem('trainingScrambleImageSize') || '200', 10));
  const [txtSize, setTxtSize] = useState<number>(parseInt(localStorage.getItem('trainingScrambleTextSize') || '16', 10));
  const [tmrSize, setTmrSize] = useState<number>(parseInt(localStorage.getItem('trainingTimerSize') || '80', 10));
  const [holdVal, setHoldVal] = useState<number>(parseFloat(localStorage.getItem('trainingHoldToStart') || '0.22'));
  const [showPrev, setShowPrev] = useState<boolean>(localStorage.getItem('trainingShowPrevScramble') === 'true');
  const [insp, setInsp] = useState<boolean>(localStorage.getItem('trainingEnableInspection') === 'true');
  const [pquiz, setPquiz] = useState<boolean>(localStorage.getItem('trainingEnableParityQuiz') === 'true');
  const [beep, setBeep] = useState<boolean>(localStorage.getItem('trainingInspectionBeep') === 'true');
  const [hideImg, setHideImg] = useState<boolean>(localStorage.getItem('trainingHideScrambleImage') === 'true');

  return (
    <>
      {_sectionTitle('Scramble Display')}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
          <label style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Image Size: <span id="tr_imgSizeVal">{imgSize}px</span>
          </label>
        </div>
        <input
          id="tr_imgSize"
          type="range"
          min={100}
          max={400}
          step={10}
          value={imgSize}
          style={{ width: '100%', cursor: 'pointer' }}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            setImgSize(val);
            localStorage.setItem('trainingScrambleImageSize', String(val));
            applyImageSizeLive(val);
          }}
        />
      </div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
          <label style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Scramble Text Size: <span id="tr_txtSizeVal">{txtSize}px</span>
          </label>
        </div>
        <input
          id="tr_txtSize"
          type="range"
          min={10}
          max={24}
          step={1}
          value={txtSize}
          style={{ width: '100%', cursor: 'pointer' }}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            setTxtSize(val);
            localStorage.setItem('trainingScrambleTextSize', String(val));
            applyTextSizeLive(val);
          }}
        />
      </div>

      {_sectionTitle('Timer')}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
          <label style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Timer Text Size: <span id="tr_tmrSizeVal">{tmrSize}px</span>
          </label>
        </div>
        <input
          id="tr_tmrSize"
          type="range"
          min={30}
          max={120}
          step={2}
          value={tmrSize}
          style={{ width: '100%', cursor: 'pointer' }}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            setTmrSize(val);
            localStorage.setItem('trainingTimerSize', String(val));
            applyTimerSizeLive(val);
          }}
        />
      </div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
          <label style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Hold-to-Start: <span id="tr_holdVal">{holdVal.toFixed(2)}s</span>
          </label>
          <span className="info-wrapper">
            <button className="settings-info-btn" aria-label="More info">
              <img src="res/info.svg" alt="" />
            </button>
            <span className="info-box">
              How long you must hold the spacebar (or press the timer zone) before starting the timer.
            </span>
          </span>
        </div>
        <input
          id="tr_hold"
          type="range"
          min={0.1}
          max={0.7}
          step={0.01}
          value={holdVal}
          style={{ width: '100%', cursor: 'pointer' }}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setHoldVal(val);
            localStorage.setItem('trainingHoldToStart', String(val));
            applyHoldLive(val);
          }}
        />
      </div>

      {_sectionTitle('Display')}
      {_row(
        'Hide Scramble Image',
        _toggle('tr_hideImg', hideImg, (v) => {
          setHideImg(v);
          localStorage.setItem('trainingHideScrambleImage', v.toString());
          applyHideImgLive(v);
        }),
        'Hides the scramble image and centers the timer.',
      )}

      {_row(
        'Show Previous Scramble',
        _toggle('tr_showPrev', showPrev, (v) => {
          setShowPrev(v);
          localStorage.setItem('trainingShowPrevScramble', v.toString());
          applyPrevBarLive();
        }),
        'Shows the previous scramble at the very bottom of the screen.',
      )}

      {_sectionTitle('Inspection')}
      {_row('Enable Inspection', _toggle('tr_insp', insp, (v) => {
        setInsp(v);
        localStorage.setItem('trainingEnableInspection', v.toString());
        setEnableInspectionLive(v);
        if (!v) {
          setPquiz(false);
          localStorage.setItem('trainingEnableParityQuiz', 'false');
          setEnableParityQuizLive(false);
        }
      }))}
      <div id="tr_pquizRow" style={{ opacity: insp ? '1' : '0.4', pointerEvents: insp ? 'auto' : 'none' }}>
        {_row(
          'Parity Quiz During Inspection',
          _toggle('tr_pquiz', pquiz, (v) => {
            const inspOn = localStorage.getItem('trainingEnableInspection') === 'true';
            if (!inspOn) {
              setPquiz(false);
              return;
            }
            setPquiz(v);
            localStorage.setItem('trainingEnableParityQuiz', v.toString());
            setEnableParityQuizLive(v);
          }),
          'During inspection, the trainer will quiz you about the parity state of the current scramble',
        )}
        {_row(
          'Inspection Beep (8s / 12s)',
          _toggle('tr_beep', beep, (v) => {
            setBeep(v);
            localStorage.setItem('trainingInspectionBeep', v.toString());
          }),
          'Play a beep once at 8 seconds, a double beep at 12 seconds, and a triple beep at 15 seconds.',
        )}
      </div>
    </>
  );
}

// ── TAB: Alg Animator ────────────────────────────────────────────────────────
function AnimateTab(): React.ReactNode {
  const [speed, setSpeed] = useState<number>(parseFloat(localStorage.getItem('sq1AnimSpeed') || '0.9'));
  const [delay, setDelay] = useState<number>(parseInt(localStorage.getItem('sq1AutoDelay') || '500', 10));
  const [imgSize, setImgSize] = useState<number>(parseInt(localStorage.getItem('sq1AnimImageSize') || '200', 10));
  const [bothLay, setBothLay] = useState<boolean>(
    localStorage.getItem('sq1AnimBothLayers') !== null ? localStorage.getItem('sq1AnimBothLayers') === 'true' : true,
  );
  const [vertDis, setVertDis] = useState<boolean>(
    localStorage.getItem('sq1AnimVerticalDisplay') !== null
      ? localStorage.getItem('sq1AnimVerticalDisplay') === 'true'
      : false,
  );

  return (
    <>
      {_sectionTitle('Playback')}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
          <label style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Animation Speed: <span id="aa_speedVal">{speed.toFixed(1)}x</span>
          </label>
        </div>
        <input
          id="aa_speed"
          type="range"
          min={0.2}
          max={2}
          step={0.1}
          value={speed}
          style={{ width: '100%', cursor: 'pointer' }}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setSpeed(val);
            localStorage.setItem('sq1AnimSpeed', String(val));
          }}
        />
      </div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
          <label style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Auto-play Delay: <span id="aa_delayVal">{delay}ms</span>
          </label>
          <span className="info-wrapper">
            <button className="settings-info-btn" aria-label="More info">
              <img src="res/info.svg" alt="" />
            </button>
            <span className="info-box">The pause between moves when auto-playing an algorithm.</span>
          </span>
        </div>
        <input
          id="aa_delay"
          type="range"
          min={0}
          max={1000}
          step={50}
          value={delay}
          style={{ width: '100%', cursor: 'pointer' }}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            setDelay(val);
            localStorage.setItem('sq1AutoDelay', String(val));
          }}
        />
      </div>

      {_sectionTitle('Display')}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
          <label style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Image Size: <span id="aa_imgSizeVal">{imgSize}px</span>
          </label>
        </div>
        <input
          id="aa_imgSize"
          type="range"
          min={100}
          max={400}
          step={10}
          value={imgSize}
          style={{ width: '100%', cursor: 'pointer' }}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            setImgSize(val);
            localStorage.setItem('sq1AnimImageSize', String(val));
          }}
        />
      </div>
      {_row('Animate Both Layers Together', _toggle('aa_bothLayers', bothLay, (v) => {
        setBothLay(v);
        localStorage.setItem('sq1AnimBothLayers', v.toString());
      }))}
      {_row(
        'Vertical Stack Display',
        _toggle('aa_vertDisplay', vertDis, (v) => {
          setVertDis(v);
          localStorage.setItem('sq1AnimVerticalDisplay', v.toString());
        }),
        'When ON, the top and bottom layer images stack vertically instead of side-by-side.',
      )}
    </>
  );
}

// ── Modal container ───────────────────────────────────────────────────────────
export default function SettingsModal(): React.ReactNode {
  const tab = getSettingsActiveTab();
  useAppStore();
  const open = isSettingsOpen();

  const closeSettings = useCallback(() => {
    removeCloseModalFromStack(closeSettings);
    closeUnifiedSettings();
    unlockScroll();
  }, []);

  useEffect(() => {
    if (!open) return;
    lockScroll();
    pushModalState('unifiedSettingsModal', closeSettings);
    const overlay = document.getElementById('unifiedSettingsModal');
    if (overlay) attachOverlayClose(overlay, closeSettings);
    return () => {
      removeCloseModalFromStack(closeSettings);
      unlockScroll();
    };
  }, [open, closeSettings]);

  useEffect(() => {
    if (open) applyInstructionVisibility();
  }, [tab, open, applyInstructionVisibility]);

  if (!open) return null;

  const activeTab = SETTINGS_TABS.find((t) => t.id === tab);

  return (
    <div
      id="unifiedSettingsModal"
      className="modal active"
      style={{ zIndex: 10010 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeSettings();
      }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: 760,
          width: '96vw',
          maxHeight: '88vh',
          minHeight: '40vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 18,
          overflow: 'hidden',
          background: 'var(--surface)',
          padding: 0,
        }}
      >
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px 16px',
            borderBottom: '2px solid var(--surface-border)',
            background: 'var(--surface)',
          }}
        >
          <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-ui)' }}>Settings</span>
          <button
            onClick={closeSettings}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.7rem',
              cursor: 'pointer',
              color: 'var(--sidebar-close-color)',
              lineHeight: 1,
              padding: 0,
            }}
          >
            &times;
          </button>
        </div>
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <nav
            id="settingsSidebar"
            style={{
              flexShrink: 0,
              width: 58,
              background: 'var(--surface2)',
              borderRight: '1px solid var(--surface-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              padding: '10px 6px',
              overflowY: 'auto',
            }}
          >
            {SETTINGS_TABS.map((t) => {
              const active = t.id === tab;
              const isAnimate = t.id === 'animate';
              return (
                <button
                  key={t.id}
                  id={`settingsTab_${t.id}`}
                  data-tab={t.id}
                  title={t.label}
                  onClick={() => switchSettingsTab(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 9,
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    background: active ? 'var(--surface-border)' : 'transparent',
                    transition: 'all 0.15s',
                    width: '100%',
                  }}
                >
                  <img
                    src={t.icon}
                    width={isAnimate ? 30 : 24}
                    height={isAnimate ? 30 : 24}
                    style={{ opacity: active ? '1' : '0.55' }}
                    alt={t.label}
                  />
                </button>
              );
            })}
          </nav>
          <div id="settingsPanel" style={{ flex: 1, overflowY: 'auto', padding: '0 24px 22px' }}>
            <div
              style={{
                position: 'sticky',
                top: 0,
                background: 'var(--surface)',
                zIndex: 1,
                padding: '18px 0 4px',
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-ui)' }}>
                {activeTab ? activeTab.label : ''}
              </span>
            </div>
            {tab === 'homescreen' && <HomescreenTab />}
            {tab === 'parity' && <ParityTab />}
            {tab === 'trainer' && <TrainerTab />}
            {tab === 'animate' && <AnimateTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
