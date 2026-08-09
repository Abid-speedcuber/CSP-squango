/**
 * SVG Tracing Guide Editor — ported 1:1 from legacy `js/tools/svg-editor.js`.
 * Lets preset creators drag the small tracing labels on case images.
 */

import {
  currentPreset,
  getPresetDefaults,
  saveState,
  svgData,
} from './state';
import { DEFAULT_SHAPE_SVGS } from '../data/shapes';
import { showToast } from './toast';
import { showConfirmation, showSaveDiscardConfirmation } from './confirm';
import { closeModalWithHistory, pushModalState } from './modal';
import { notify } from './store';

interface Point {
  x: number;
  y: number;
}

interface EditorState {
  currentSvg: string | null;
  selectedElements: Set<SVGElement>;
  dragging: boolean;
  dragStart: Point;
  elementStarts: Map<SVGElement, { attributes: Record<string, string>; tagName: string }>;
  histories: Record<string, SVGElement[]>;
  historyIndices: Record<string, number>;
  isSidebarCollapsed: boolean;
  touchStartPos: { x: number; y: number; time: number } | null;
  currentZoom: number;
  keysPressed: Set<string>;
  keyMoveInterval: ReturnType<typeof setInterval> | null;
  unsavedSvgs: Set<string>;
}

function captureElementState(el: SVGElement): { attributes: Record<string, string>; tagName: string } {
  const attrs: Record<string, string> = {};
  ['x', 'y', 'd'].forEach((attr) => {
    if (el.hasAttribute(attr)) {
      attrs[attr] = el.getAttribute(attr) || '';
    }
  });
  return { attributes: attrs, tagName: el.tagName.toLowerCase() };
}

function translatePathData(pathData: string, dx: number, dy: number): string {
  const commands: { cmd: string; params: number[] }[] = [];
  const tokens = pathData.match(/[a-df-zA-DF-Z]|[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g);

  let i = 0;

  while (tokens && i < tokens.length) {
    const token = tokens[i];

    if (/[a-zA-Z]/.test(token)) {
      commands.push({ cmd: token, params: [] });
      i++;
    } else {
      if (commands.length === 0) {
        i++;
        continue;
      }
      commands[commands.length - 1].params.push(parseFloat(token));
      i++;
    }
  }

  let result = '';

  for (const cmd of commands) {
    const c = cmd.cmd;
    const p = cmd.params;

    if (c === 'M' || c === 'L' || c === 'T') {
      result += c;
      for (let j = 0; j < p.length; j += 2) {
        result += `${p[j] + dx},${p[j + 1] + dy}`;
        if (j < p.length - 2) result += ' ';
      }
    } else if (c === 'H') {
      result += c;
      result += p.map((x) => x + dx).join(' ');
    } else if (c === 'V') {
      result += c;
      result += p.map((y) => y + dy).join(' ');
    } else if (c === 'C') {
      result += c;
      for (let j = 0; j < p.length; j += 6) {
        result += `${p[j] + dx},${p[j + 1] + dy} ${p[j + 2] + dx},${p[j + 3] + dy} ${p[j + 4] + dx},${p[j + 5] + dy}`;
        if (j < p.length - 6) result += ' ';
      }
    } else if (c === 'Z' || c === 'z') {
      result += c;
    } else {
      result += c + p.join(',');
    }
  }

  return result;
}

function replaceSvgData(newData: Record<string, string>): void {
  Object.keys(svgData).forEach((key) => delete svgData[key]);
  Object.assign(svgData, newData);
}

export const SVGEditor = {
  state: {
    currentSvg: null as string | null,
    selectedElements: new Set<SVGElement>(),
    dragging: false,
    dragStart: { x: 0, y: 0 },
    elementStarts: new Map<SVGElement, { attributes: Record<string, string>; tagName: string }>(),
    histories: {} as Record<string, SVGElement[]>,
    historyIndices: {} as Record<string, number>,
    isSidebarCollapsed: false,
    touchStartPos: null as { x: number; y: number; time: number } | null,
    currentZoom: 100,
    keysPressed: new Set<string>(),
    keyMoveInterval: null as ReturnType<typeof setInterval> | null,
    unsavedSvgs: new Set<string>(),
  } as EditorState,

  init() {
    this.createEditorHTML();
    this.setupEventListeners();
    this.loadSVGList();
  },

  createEditorHTML() {
    const editorHTML = `
            <div id="svgEditorModal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="svg-editor-header">
                        <div class="svg-editor-header-left">
                            <button id="svgEditorSidebarToggle" class="svg-editor-sidebar-toggle">☰</button>
                            <span class="svg-editor-title"><span class="svg-editor-title-text">Customize Tracing Guides</span></span>
                        </div>
                        <div class="svg-editor-header-right">
                            <button id="svgEditorInfo" class="svg-editor-btn" title="Help"><img src="res/info.svg"></button>
                            <button id="svgEditorResetAll" class="svg-editor-btn" title="Reset All to Preset"><img src="res/reset.svg"></button>
                            <button id="svgEditorSaveAll" class="svg-editor-btn" title="Save All"><img src="res/save.svg"></button>
                            <button class="svg-editor-close" onclick="SVGEditor.close()">&times;</button>
                        </div>
                    </div>
                    <div class="svg-editor-container">
                        <div id="svgEditorSidebar" class="svg-editor-sidebar">
                            <div id="svgEditorList" class="svg-editor-sidebar-list"></div>
                        </div>
                        <div class="svg-editor-overlay" onclick="SVGEditor.closeSidebar()"></div>
                        <div class="svg-editor-main">
                            <div class="svg-editor-toolbar">
                                <div class="svg-editor-toolbar-left">
                                    <span class="svg-editor-zoom-label">Zoom:</span>
                                    <input type="range" id="svgEditorZoom" min="50" max="200" value="100" step="10" class="svg-editor-zoom-slider">
                                    <span id="svgEditorZoomValue" class="svg-editor-zoom-value">100%</span>
                                </div>
                                <span id="svgEditorCurrentCase" class="svg-editor-current-case"></span>
                                <div class="svg-editor-toolbar-right">
                                    <button id="svgEditorUndo" class="svg-editor-btn" title="Undo (Ctrl+Z)"><img src="res/revert.svg"></button>
                                    <button id="svgEditorRedo" class="svg-editor-btn" title="Redo (Ctrl+Y)"><img src="res/redo.svg"></button>
                                    <button id="svgEditorReset" class="svg-editor-btn" title="Reset to Preset"><img src="res/reset.svg"></button>
                                    <button id="svgEditorSave" class="svg-editor-btn" title="Save Current"><img src="res/save.svg"></button>
                                </div>
                            </div>
                            <div id="svgEditorCanvas" class="svg-editor-canvas">
                                <div class="svg-editor-empty">
                                    <h2>Select an SVG to Edit</h2>
                                    <p>Choose a tracing guide from the list on the left</p>
                                    <p style="margin-top: 15px; font-size: 14px; color: #999;">
                                        Click on labels to select • Drag to move • Arrow keys for fine adjustments<br>
                                        Tab/Shift+Tab to cycle through labels
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML('beforeend', editorHTML);
  },

  setupEventListeners() {
    const saveBtn = document.getElementById('svgEditorSave');
    const saveAllBtn = document.getElementById('svgEditorSaveAll');
    const resetBtn = document.getElementById('svgEditorReset');
    const resetAllBtn = document.getElementById('svgEditorResetAll');
    const undoBtn = document.getElementById('svgEditorUndo');
    const redoBtn = document.getElementById('svgEditorRedo');
    const sidebarToggle = document.getElementById('svgEditorSidebarToggle');
    const zoomSlider = document.getElementById('svgEditorZoom') as HTMLInputElement | null;
    const infoBtn = document.getElementById('svgEditorInfo');

    if (saveBtn) saveBtn.onclick = () => this.saveCurrent();
    if (saveAllBtn) saveAllBtn.onclick = () => this.saveAll();
    if (resetBtn) resetBtn.onclick = () => this.resetCurrent();
    if (resetAllBtn) resetAllBtn.onclick = () => this.resetAll();
    if (undoBtn) undoBtn.onclick = () => this.undo();
    if (redoBtn) redoBtn.onclick = () => this.redo();
    if (sidebarToggle) sidebarToggle.onclick = () => this.toggleSidebarMobile();
    if (infoBtn) infoBtn.onclick = () => this.showInfo();
    if (zoomSlider) {
      zoomSlider.oninput = (e) => this.updateZoom((e.target as HTMLInputElement).value);
    }

    this.setupZoomControls();

    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('svgEditorModal');
      if (!modal || modal.style.display === 'none') return;

      if (e.key === 'Escape') {
        this.close();
      } else if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        this.undo();
      } else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        this.redo();
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (this.state.selectedElements.size > 0) {
          e.preventDefault();
          this.state.keysPressed.add(e.key);

          if (!this.state.keyMoveInterval) {
            this.startKeyboardMovement();
          }
        }
      } else if (e.key === 'Tab') {
        if (this.state.currentSvg !== null) {
          e.preventDefault();
          this.selectNextElement(e.shiftKey);
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        this.state.keysPressed.delete(e.key);

        if (this.state.keysPressed.size === 0 && this.state.keyMoveInterval) {
          clearInterval(this.state.keyMoveInterval);
          this.state.keyMoveInterval = null;

          const svg = document.querySelector('#svgEditorCanvas svg');
          if (svg) {
            this.saveHistory(this.cloneSVG(svg as SVGSVGElement));
          }
        }
      }
    });
  },

  setupZoomControls() {
    const canvas = document.getElementById('svgEditorCanvas');
    if (!canvas) return;

    canvas.addEventListener(
      'wheel',
      (e) => {
        if (e.altKey) {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -10 : 10;
          const newZoom = Math.max(50, Math.min(200, this.state.currentZoom + delta));
          this.updateZoom(newZoom);
        }
      },
      { passive: false },
    );

    let lastDistance = 0;
    let isPinching = false;

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        isPinching = true;
        lastDistance = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY,
        );
      }
    });

    canvas.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches.length === 2 && isPinching) {
          e.preventDefault();
          const distance = Math.hypot(
            e.touches[0].pageX - e.touches[1].pageX,
            e.touches[0].pageY - e.touches[1].pageY,
          );
          const delta = distance - lastDistance;
          const zoomChange = delta * 0.5;
          const newZoom = Math.max(50, Math.min(200, this.state.currentZoom + zoomChange));
          this.updateZoom(newZoom);
          lastDistance = distance;
        }
      },
      { passive: false },
    );

    canvas.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        isPinching = false;
      }
    });
  },

  toggleSidebar() {
    const sidebar = document.getElementById('svgEditorSidebar');
    if (window.innerWidth > 570) return;

    sidebar?.classList.toggle('open');
  },

  toggleSidebarMobile() {
    this.toggleSidebar();
  },

  closeSidebar() {
    const sidebar = document.getElementById('svgEditorSidebar');
    sidebar?.classList.remove('open');
  },

  updateZoom(value: number | string) {
    this.state.currentZoom = parseInt(String(value), 10);
    const container = document.getElementById('svgEditorContainer');
    const zoomValue = document.getElementById('svgEditorZoomValue');

    if (container) {
      container.style.transform = `scale(${this.state.currentZoom / 100})`;
    }
    if (zoomValue) {
      zoomValue.textContent = this.state.currentZoom + '%';
    }
    const zoomSlider = document.getElementById('svgEditorZoom') as HTMLInputElement | null;
    if (zoomSlider) {
      zoomSlider.value = String(this.state.currentZoom);
    }
  },

  loadSVGList() {
    const listContainer = document.getElementById('svgEditorList');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    const svgNames = Object.keys(svgData).sort();

    svgNames.forEach((name) => {
      const item = document.createElement('div');
      item.className = 'svg-editor-item';
      const isUnsaved = this.state.unsavedSvgs.has(name);
      if (isUnsaved) item.classList.add('unsaved');

      const itemName = document.createElement('div');
      itemName.className = 'svg-editor-item-name';
      itemName.textContent = name;

      item.appendChild(itemName);
      item.addEventListener('click', () => this.loadSVG(name));

      listContainer.appendChild(item);
    });
  },

  loadSVG(svgName: string) {
    if (this.state.currentSvg !== null && this.state.currentSvg !== svgName) {
      this.saveToMemory();
    }
    this.state.currentSvg = svgName;
    this.state.selectedElements.clear();

    document.querySelectorAll('.svg-editor-item').forEach((item) => {
      item.classList.remove('active');
    });

    const items = document.querySelectorAll('.svg-editor-item');
    const svgNames = Object.keys(svgData).sort();
    const index = svgNames.indexOf(svgName);
    if (items[index]) {
      items[index].classList.add('active');
    }

    const currentCaseEl = document.getElementById('svgEditorCurrentCase');
    if (currentCaseEl) {
      currentCaseEl.textContent = svgName;
    }

    const canvas = document.getElementById('svgEditorCanvas');
    if (!canvas) return;
    canvas.innerHTML = `
    <div id="svgEditorContainer" class="svg-editor-canvas-content svg-editor-force-show-hints" style="transform: scale(${this.state.currentZoom / 100});">
        <div id="svgEditorContent">${svgData[svgName]}</div>
    </div>
`;

    this.updateZoom(this.state.currentZoom);

    const svg = canvas.querySelector('svg') as SVGSVGElement | null;
    if (svg) {
      this.makeLabelsSelectable(svg);

      if (!this.state.histories[svgName]) {
        this.state.histories[svgName] = [this.cloneSVG(svg)];
        this.state.historyIndices[svgName] = 0;
      }
    }

    if (window.innerWidth <= 570) {
      this.closeSidebar();
    }
  },

  makeLabelsSelectable(svg: SVGSVGElement) {
    const labels = svg.querySelectorAll<SVGTextElement>('.label-toggle');

    labels.forEach((label) => {
      label.style.cursor = 'move';
      label.style.outline = '2px solid transparent';
      label.style.outlineOffset = '8px';
      label.style.transition = 'outline 0.2s';
      label.style.pointerEvents = 'bounding-box';

      const bbox = label.getBBox();
      const padding = 15;

      const hitRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      hitRect.setAttribute('x', String(bbox.x - padding));
      hitRect.setAttribute('y', String(bbox.y - padding));
      hitRect.setAttribute('width', String(bbox.width + padding * 2));
      hitRect.setAttribute('height', String(bbox.height + padding * 2));
      hitRect.setAttribute('fill', 'transparent');
      hitRect.setAttribute('stroke', 'none');
      hitRect.style.pointerEvents = 'all';
      hitRect.classList.add('label-hitbox');

      if (label.parentNode) {
        label.parentNode.insertBefore(hitRect, label.parentNode.firstChild);
      }

      const handleMouseEnter = () => {
        if (!this.state.selectedElements.has(label)) {
          label.style.outline = '2px solid #4a9eff';
        }
      };

      const handleMouseLeave = () => {
        if (!this.state.selectedElements.has(label)) {
          label.style.outline = '2px solid transparent';
        }
      };

      hitRect.addEventListener('mouseenter', handleMouseEnter);
      hitRect.addEventListener('mouseleave', handleMouseLeave);
      hitRect.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        this.handleLabelMouseDown(e, label);
      });
      hitRect.addEventListener(
        'touchstart',
        (e) => {
          e.stopPropagation();
          this.handleLabelTouchStart(e, label);
        },
        { passive: false },
      );

      label.addEventListener('mouseenter', handleMouseEnter);
      label.addEventListener('mouseleave', handleMouseLeave);
      label.addEventListener('mousedown', (e) => this.handleLabelMouseDown(e, label));
      label.addEventListener('touchstart', (e) => this.handleLabelTouchStart(e, label), {
        passive: false,
      });
    });
  },

  handleLabelMouseDown(e: MouseEvent, label: SVGElement) {
    e.stopPropagation();

    if (e.ctrlKey || e.metaKey) {
      if (this.state.selectedElements.has(label)) {
        this.state.selectedElements.delete(label);
        label.style.outline = '2px solid transparent';
      } else {
        this.state.selectedElements.add(label);
        label.style.outline = '2px solid #ff4a9e';
      }
    } else {
      if (!this.state.selectedElements.has(label)) {
        this.state.selectedElements.forEach((el) => (el.style.outline = '2px solid transparent'));
        this.state.selectedElements.clear();
        this.state.selectedElements.add(label);
        label.style.outline = '2px solid #ff4a9e';
      }
    }

    if (this.state.selectedElements.size > 0) {
      this.startDrag(e);
    }
  },

  handleLabelTouchStart(e: TouchEvent, label: SVGElement) {
    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches[0];
    this.state.touchStartPos = { x: touch.clientX, y: touch.clientY, time: Date.now() };

    if (!this.state.selectedElements.has(label)) {
      this.state.selectedElements.forEach((el) => (el.style.outline = '2px solid transparent'));
      this.state.selectedElements.clear();
      this.state.selectedElements.add(label);
      label.style.outline = '2px solid #ff4a9e';
    }

    if (this.state.selectedElements.size > 0) {
      this.startDragTouch(e);
    }
  },

  startDrag(e: MouseEvent) {
    this.state.dragging = true;

    const svg = document.querySelector('#svgEditorCanvas svg') as SVGSVGElement | null;
    if (!svg) return;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());

    this.state.dragStart = { x: svgP.x, y: svgP.y };
    this.state.elementStarts.clear();

    this.state.selectedElements.forEach((el) => {
      this.state.elementStarts.set(el, captureElementState(el));
    });

    document.addEventListener('mousemove', this.handleDrag.bind(this));
    document.addEventListener('mouseup', this.stopDrag.bind(this));
  },

  startDragTouch(e: TouchEvent) {
    this.state.dragging = true;

    const svg = document.querySelector('#svgEditorCanvas svg') as SVGSVGElement | null;
    if (!svg) return;

    const touch = e.touches[0];
    const pt = svg.createSVGPoint();
    pt.x = touch.clientX;
    pt.y = touch.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());

    this.state.dragStart = { x: svgP.x, y: svgP.y };
    this.state.elementStarts.clear();

    this.state.selectedElements.forEach((el) => {
      this.state.elementStarts.set(el, captureElementState(el));
    });

    document.addEventListener('touchmove', this.handleDragTouch.bind(this), { passive: false });
    document.addEventListener('touchend', this.stopDragTouch.bind(this));
  },

  handleDrag(e: MouseEvent) {
    if (!this.state.dragging) return;

    const svg = document.querySelector('#svgEditorCanvas svg') as SVGSVGElement | null;
    if (!svg) return;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());

    const dx = svgP.x - this.state.dragStart.x;
    const dy = svgP.y - this.state.dragStart.y;

    this.state.selectedElements.forEach((el) => {
      const startState = this.state.elementStarts.get(el);
      if (startState) this.updateElementPosition(el, startState, dx, dy);
    });
  },

  handleDragTouch(e: TouchEvent) {
    e.preventDefault();
    if (!this.state.dragging) return;

    const svg = document.querySelector('#svgEditorCanvas svg') as SVGSVGElement | null;
    if (!svg) return;

    const touch = e.touches[0];
    const pt = svg.createSVGPoint();
    pt.x = touch.clientX;
    pt.y = touch.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());

    const dx = svgP.x - this.state.dragStart.x;
    const dy = svgP.y - this.state.dragStart.y;

    this.state.selectedElements.forEach((el) => {
      const startState = this.state.elementStarts.get(el);
      if (startState) this.updateElementPosition(el, startState, dx, dy);
    });
  },

  stopDrag() {
    if (!this.state.dragging) return;
    this.state.dragging = false;

    const svg = document.querySelector('#svgEditorCanvas svg');
    if (svg) {
      this.saveHistory(this.cloneSVG(svg as SVGSVGElement));
    }

    document.removeEventListener('mousemove', this.handleDrag.bind(this));
    document.removeEventListener('mouseup', this.stopDrag.bind(this));
  },

  stopDragTouch() {
    if (!this.state.dragging) return;
    this.state.dragging = false;

    const svg = document.querySelector('#svgEditorCanvas svg');
    if (svg) {
      this.saveHistory(this.cloneSVG(svg as SVGSVGElement));
    }

    document.removeEventListener('touchmove', this.handleDragTouch.bind(this));
    document.removeEventListener('touchend', this.stopDragTouch.bind(this));
  },

  updateElementPosition(
    el: SVGElement,
    startState: { attributes: Record<string, string>; tagName: string },
    dx: number,
    dy: number,
  ) {
    const tagName = startState.tagName;
    const attrs = startState.attributes;

    if (tagName === 'text' || tagName === 'tspan') {
      const originalX = parseFloat(attrs.x || '0');
      const originalY = parseFloat(attrs.y || '0');
      el.setAttribute('x', String(originalX + dx));
      el.setAttribute('y', String(originalY + dy));
    } else if (tagName === 'path') {
      const newD = translatePathData(attrs.d || '', dx, dy);
      el.setAttribute('d', newD);
    }
  },

  moveSelectedWithKeyboard(key: string) {
    const svg = document.querySelector('#svgEditorCanvas svg') as SVGSVGElement | null;
    if (!svg || this.state.selectedElements.size === 0) return;

    let dx = 0;
    let dy = 0;
    const step = 1;

    switch (key) {
      case 'ArrowUp': dy = -step; break;
      case 'ArrowDown': dy = step; break;
      case 'ArrowLeft': dx = -step; break;
      case 'ArrowRight': dx = step; break;
    }

    this.state.selectedElements.forEach((el) => {
      const startState = captureElementState(el);
      this.updateElementPosition(el, startState, dx, dy);
    });

    this.saveHistory(this.cloneSVG(svg));
  },

  startKeyboardMovement() {
    this.state.keyMoveInterval = setInterval(() => {
      if (this.state.keysPressed.size === 0) return;

      const svg = document.querySelector('#svgEditorCanvas svg') as SVGSVGElement | null;
      if (!svg || this.state.selectedElements.size === 0) return;

      let dx = 0;
      let dy = 0;
      const step = 1;

      if (this.state.keysPressed.has('ArrowUp')) dy -= step;
      if (this.state.keysPressed.has('ArrowDown')) dy += step;
      if (this.state.keysPressed.has('ArrowLeft')) dx -= step;
      if (this.state.keysPressed.has('ArrowRight')) dx += step;

      this.state.selectedElements.forEach((el) => {
        const startState = captureElementState(el);
        this.updateElementPosition(el, startState, dx, dy);
      });
    }, 50);
  },

  selectNextElement(reverse = false) {
    const svg = document.querySelector('#svgEditorCanvas svg') as SVGSVGElement | null;
    if (!svg) return;

    const labels = Array.from(svg.querySelectorAll<SVGTextElement>('.label-toggle'));
    if (labels.length === 0) return;

    let currentIndex = -1;
    if (this.state.selectedElements.size === 1) {
      currentIndex = labels.indexOf(Array.from(this.state.selectedElements)[0] as SVGTextElement);
    }

    let nextIndex: number;
    if (reverse) {
      nextIndex = currentIndex <= 0 ? labels.length - 1 : currentIndex - 1;
    } else {
      nextIndex = currentIndex >= labels.length - 1 ? 0 : currentIndex + 1;
    }

    this.state.selectedElements.forEach((el) => (el.style.outline = '2px solid transparent'));
    this.state.selectedElements.clear();
    this.state.selectedElements.add(labels[nextIndex]);
    labels[nextIndex].style.outline = '2px solid #ff4a9e';
  },

  cloneSVG(svg: SVGSVGElement): SVGSVGElement {
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.querySelectorAll<SVGTextElement>('.label-toggle').forEach((el) => {
      el.style.outline = '2px solid transparent';
    });
    clone.querySelectorAll('.label-hitbox').forEach((el) => el.remove());
    return clone;
  },

  saveHistory(svgElement: SVGSVGElement) {
    const name = this.state.currentSvg;
    if (name === null) return;

    if (!this.state.histories[name]) {
      this.state.histories[name] = [];
      this.state.historyIndices[name] = -1;
    }

    this.state.histories[name] = this.state.histories[name].slice(0, this.state.historyIndices[name] + 1);
    this.state.histories[name].push(svgElement);
    this.state.historyIndices[name]++;

    if (this.state.histories[name].length > 50) {
      this.state.histories[name].shift();
      this.state.historyIndices[name]--;
    }

    this.state.unsavedSvgs.add(name);
    this.loadSVGList();
  },

  undo() {
    const name = this.state.currentSvg;
    if (name === null) return;
    if (!this.state.histories[name] || this.state.historyIndices[name] <= 0) return;

    this.state.historyIndices[name]--;
    this.restoreHistory();
  },

  redo() {
    const name = this.state.currentSvg;
    if (name === null) return;
    if (!this.state.histories[name] || this.state.historyIndices[name] >= this.state.histories[name].length - 1) return;

    this.state.historyIndices[name]++;
    this.restoreHistory();
  },

  restoreHistory() {
    const name = this.state.currentSvg;
    if (name === null || !this.state.histories[name]) return;

    const svgElement = this.state.histories[name][this.state.historyIndices[name]];
    const content = document.getElementById('svgEditorContent');
    if (!content) return;

    content.innerHTML = '';
    const newSvg = svgElement.cloneNode(true) as SVGSVGElement;

    newSvg.querySelectorAll('.label-hitbox').forEach((el) => el.remove());

    content.appendChild(newSvg);

    this.makeLabelsSelectable(newSvg);
    this.state.selectedElements.clear();
  },

  saveToMemory() {
    const name = this.state.currentSvg;
    if (name === null) return;

    const svg = document.querySelector('#svgEditorCanvas svg') as SVGSVGElement | null;
    if (!svg) return;

    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.querySelectorAll<SVGTextElement>('.label-toggle').forEach((el) => {
      el.style.outline = '';
      el.style.cursor = '';
      el.style.transition = '';
    });

    svgData[name] = clone.outerHTML;
  },

  saveCurrent() {
    const name = this.state.currentSvg;
    if (name === null) return;

    this.saveToMemory();

    saveState();
    notify();

    this.state.unsavedSvgs.delete(name);
    this.loadSVGList();

    showToast(`"${name}" saved successfully!`, 2000, 'success');
  },

  saveAll() {
    if (this.state.unsavedSvgs.size === 0) {
      showToast('No unsaved changes', 2000, 'info');
      return;
    }

    const count = this.state.unsavedSvgs.size;

    this.state.unsavedSvgs.forEach((name) => {
      const svg = document.querySelector(`#svgEditorCanvas svg[data-svg-name="${name}"]`);
      if (svg) {
        const clone = svg.cloneNode(true) as SVGSVGElement;
        clone.querySelectorAll<SVGTextElement>('.label-toggle').forEach((el) => {
          el.style.outline = '';
          el.style.cursor = '';
          el.style.transition = '';
        });
        svgData[name] = clone.outerHTML;
      }
    });

    this.state.unsavedSvgs.clear();

    saveState();
    notify();

    this.loadSVGList();

    showToast(`Saved ${count} tracing guide(s) successfully!`, 2000, 'success');
  },

  resetCurrent() {
    const name = this.state.currentSvg;
    if (name === null) return;

    showConfirmation(
      `Reset "${name}" to ${currentPreset} preset? This cannot be undone.`,
      () => {
        const defaults = getPresetDefaults();
        if (defaults && defaults.svgData && (defaults.svgData as Record<string, string>)[name]) {
          svgData[name] = (defaults.svgData as Record<string, string>)[name];
        } else {
          svgData[name] = DEFAULT_SHAPE_SVGS[name];
        }

        saveState();
        notify();

        this.loadSVG(name);

        this.state.unsavedSvgs.delete(name);
        this.loadSVGList();

        showToast(`"${name}" reset to ${currentPreset} preset!`, 2000, 'success');
      },
      null,
    );
  },

  open() {
    const modal = document.getElementById('svgEditorModal');
    if (modal) {
      modal.style.display = 'block';
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      this.loadSVGList();
      this.preventBackgroundScroll();
      pushModalState('svgEditorModal', () => this.close());
    }
  },

  showInfo() {
    let infoModal = document.getElementById('svgEditorInfoModal');
    if (!infoModal) {
      infoModal = document.createElement('div');
      infoModal.id = 'svgEditorInfoModal';
      infoModal.className = 'training-info-modal';
      infoModal.innerHTML = `
                <div class="training-info-content">
                    <div class="training-info-header">
                        <span class="training-info-title">Tracing Guide Editor Instructions</span>
                        <button class="training-info-close" onclick="document.getElementById('svgEditorInfoModal').classList.remove('active')">&times;</button>
                    </div>
                    <div class="training-info-body">
                        <div class="training-info-item">
                            <div class="training-info-text">This Tracing Guide Editor lets you change the position of the small numbers (The tracing guides) on the image of each cases. It is more useful to preset creators than normal users. There are 39 cubestate images that you need to fix to set your tracing position in the case image.</div>
                        </div>
                        <div class="training-info-item">
                            <div class="training-info-number">1</div>
                            <div class="training-info-text"><strong>Select Labels:</strong> Click on any blue or red number to select it. Hold Ctrl/Cmd to select multiple labels.</div>
                        </div>
                        <div class="training-info-item">
                            <div class="training-info-number">2</div>
                            <div class="training-info-text"><strong>Move Labels:</strong> Drag selected labels with your mouse to move it around, or use arrow keys for precise 1px adjustments.</div>
                        </div>
                        <div class="training-info-item">
                            <div class="training-info-number">3</div>
                            <div class="training-info-text"><strong>Navigate:</strong> Press Tab to select the next label, press Shift+Tab to select the previous label.</div>
                        </div>
                        <div class="training-info-item">
                            <div class="training-info-number">4</div>
                            <div class="training-info-text"><strong>Undo/Redo:</strong> Use the Undo and Redo buttons or Ctrl+Z and Ctrl+Y to undo or redo a change.</div>
                        </div>
                        <div class="training-info-item">
                            <div class="training-info-number">5</div>
                            <div class="training-info-text"><strong>Reset:</strong> Click Reset (on the toolbar) to restore the current image to your preset's default image. Press Reset All (on the header) to reset all the images to your preset default.</div>
                        </div>
                        <div class="training-info-item">
                            <div class="training-info-number">6</div>
                            <div class="training-info-text"><strong>Save:</strong> Click Save (on the toolbar) to save the current image, or Save All (on the header) to save all unsaved images at once.</div>
                        </div>
                        <div class="training-info-item">
                            <div class="training-info-number">7</div>
                            <div class="training-info-text"><strong>Zoom:</strong> Alt+Mouse wheel Up/Down to zoom in/out, or pinch with 2 fingers, or simply just use the zoom slider if you can see it.</div>
                        </div>
                    </div>
                </div>
            `;
      document.body.appendChild(infoModal);
    }

    infoModal.classList.add('active');
  },

  resetAll() {
    showConfirmation(
      `Reset ALL tracing guides to ${currentPreset} preset? This cannot be undone.`,
      () => {
        const defaults = getPresetDefaults();
        const svgNames = Object.keys(svgData);

        svgNames.forEach((name) => {
          if (defaults && defaults.svgData && (defaults.svgData as Record<string, string>)[name]) {
            svgData[name] = (defaults.svgData as Record<string, string>)[name];
          } else {
            svgData[name] = DEFAULT_SHAPE_SVGS[name];
          }
        });

        this.state.unsavedSvgs.clear();

        saveState();
        notify();

        this.loadSVGList();
        if (this.state.currentSvg) {
          this.loadSVG(this.state.currentSvg);
        }

        showToast(`All tracing guides reset to ${currentPreset} preset!`, 2000, 'success');
      },
      null,
    );
  },

  close() {
    closeModalWithHistory(() => {
      if (this.state.unsavedSvgs.size > 0) {
        showSaveDiscardConfirmation(
          `You have ${this.state.unsavedSvgs.size} unsaved image(s). What would you like to do?`,
          () => {
            this.saveAll();
            this.forceClose();
          },
          () => {
            this.forceClose(true);
          },
          () => {
            // Cancel - do nothing
          },
        );
        return;
      }

      this.forceClose();
    });
  },

  forceClose(discard = false) {
    if (discard) {
      try {
        const saved = JSON.parse(localStorage.getItem('sq1-parity-progress') || '{}');
        if (saved && saved.svgData) {
          replaceSvgData(saved.svgData as Record<string, string>);
          notify();
        }
      } catch (e) {
        console.error('Error discarding tracing guide changes:', e);
      }
    } else if (this.state.currentSvg !== null) {
      this.saveToMemory();
    }

    const modal = document.getElementById('svgEditorModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    }

    const canvas = document.getElementById('svgEditorCanvas');
    if (canvas) {
      canvas.innerHTML = `
                <div class="svg-editor-empty">
                    <h2>Select an SVG to Edit</h2>
                    <p>Choose a tracing guide from the list on the left</p>
                    <p style="margin-top: 15px; font-size: 14px; color: #999;">
                        Click on labels to select • Drag to move • Arrow keys for fine adjustments<br>
                        Tab/Shift+Tab to cycle through labels
                    </p>
                </div>
            `;
    }
    const currentCaseEl = document.getElementById('svgEditorCurrentCase');
    if (currentCaseEl) currentCaseEl.textContent = '';

    if (this.state.keyMoveInterval) {
      clearInterval(this.state.keyMoveInterval);
      this.state.keyMoveInterval = null;
    }

    this.state.currentSvg = null;
    this.state.selectedElements.clear();
    this.state.isSidebarCollapsed = false;
    this.state.keysPressed.clear();
    this.state.unsavedSvgs.clear();
    this.state.histories = {};
    this.state.historyIndices = {};
  },

  preventBackgroundScroll() {
    const modal = document.getElementById('svgEditorModal');
    if (!modal) return;

    modal.addEventListener(
      'wheel',
      (e) => {
        const target = e.target as HTMLElement;
        if (target === modal || target.classList.contains('svg-editor-overlay')) {
          e.preventDefault();
        }
      },
      { passive: false },
    );

    modal.addEventListener(
      'touchmove',
      (e) => {
        const target = e.target as HTMLElement;
        if (target === modal || target.classList.contains('svg-editor-overlay')) {
          e.preventDefault();
        }
      },
      { passive: false },
    );
  },
};

export function installSVGEditorShims(): void {
  const w = window as unknown as Record<string, unknown>;
  w.SVGEditor = SVGEditor;
  if (!document.getElementById('svgEditorModal')) {
    SVGEditor.init();
  }
}
