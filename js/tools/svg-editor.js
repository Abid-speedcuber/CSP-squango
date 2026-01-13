/*
╔════════════════════════════════════════════════════════════════════════════╗
║                          SVG TRACING GUIDE EDITOR                          ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

const SVGEditor = {
    state: {
    currentSvg: null,
    selectedElements: new Set(),
    dragging: false,
    dragStart: { x: 0, y: 0 },
    elementStarts: new Map(),
    histories: {},
    historyIndices: {},
    isSidebarCollapsed: false,
    touchStartPos: null,
    currentZoom: 100
},

    init() {
        this.createEditorHTML();
        this.setupEventListeners();
        this.loadSVGList();
    },

    createEditorHTML() {
        const editorHTML = `
            <div id="svgEditorModal" class="modal" style="display: none;">
                <div class="modal-content" style="max-width: 100vw; max-height: 100vh; width: 100vw; height: 100vh; margin: 0; border-radius: 0; display: flex; flex-direction: column;">
                    <div class="modal-header" style="flex-shrink: 0; background: #2d3748; color: white; padding: 15px 20px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <button id="svgEditorSidebarToggle" class="btn" style="background: rgba(255,255,255,0.2); padding: 6px 12px; display: none;">☰</button>
                                <span class="modal-title" style="font-size: 1.5rem; font-weight: 600;">Customize Tracing Guides</span>
                            </div>
                            <button class="close-btn" onclick="SVGEditor.close()" style="color: white; opacity: 0.9;">&times;</button>
                        </div>
                    </div>
                    <div style="display: flex; flex: 1; overflow: hidden;">
                        <div id="svgEditorSidebar" style="width: 280px; background: white; border-right: 1px solid #ddd; overflow-y: auto; flex-shrink: 0;">
                            <div id="svgEditorList" style="padding: 15px;"></div>
                        </div>
                        <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #f5f5f5;">

<div id="svgEditorToolbar" style="background: white; padding: 12px 20px; border-bottom: 1px solid #ddd; display: none; flex-shrink: 0;">
    <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
        <span id="svgEditorCurrentName" style="font-weight: 600; color: #2d3748; flex: 1; min-width: 150px;"></span>
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 0.9rem; color: #495057; font-weight: 500;">Zoom:</span>
            <input type="range" id="svgEditorZoom" min="50" max="200" value="100" step="10" style="width: 120px; cursor: pointer;">
            <span id="svgEditorZoomValue" style="font-size: 0.9rem; color: #495057; min-width: 45px;">100%</span>
        </div>
        <div style="display: flex; gap: 8px; margin-left: auto;">
            <button id="svgEditorUndo" class="btn" style="background: #f8f9fa; color: #495057; border: 1px solid #dee2e6; padding: 8px 12px; display: flex; align-items: center; gap: 6px;"><img src="res/revert.svg" style="width: 16px; height: 16px;">Undo</button>
            <button id="svgEditorRedo" class="btn" style="background: #f8f9fa; color: #495057; border: 1px solid #dee2e6; padding: 8px 12px; display: flex; align-items: center; gap: 6px;"><img src="res/redo.svg" style="width: 16px; height: 16px;">Redo</button>
            <button id="svgEditorReset" class="btn" style="background: #f8f9fa; color: #495057; border: 1px solid #dee2e6; padding: 8px 12px; display: flex; align-items: center; gap: 6px;"><img src="res/reset.svg" style="width: 16px; height: 16px;">Reset</button>
            <button id="svgEditorSave" class="btn" style="background: #f8f9fa; color: #495057; border: 1px solid #dee2e6; padding: 8px 12px; display: flex; align-items: center; gap: 6px;"><img src="res/save.svg" style="width: 16px; height: 16px;">Save</button>
        </div>
    </div>
</div>
                            <div id="svgEditorCanvas" style="flex: 1; display: flex; align-items: center; justify-content: center; overflow: auto; position: relative;">
                                <div class="empty-state" style="text-align: center; color: #666;">
                                    <h2 style="margin-bottom: 10px;">Select an SVG to Edit</h2>
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
        const resetBtn = document.getElementById('svgEditorReset');
        const undoBtn = document.getElementById('svgEditorUndo');
        const redoBtn = document.getElementById('svgEditorRedo');
        const sidebarToggle = document.getElementById('svgEditorSidebarToggle');
const zoomSlider = document.getElementById('svgEditorZoom');

if (saveBtn) saveBtn.onclick = () => this.saveCurrent();
if (resetBtn) resetBtn.onclick = () => this.resetCurrent();
if (undoBtn) undoBtn.onclick = () => this.undo();
if (redoBtn) redoBtn.onclick = () => this.redo();
if (sidebarToggle) sidebarToggle.onclick = () => this.toggleSidebar();
if (zoomSlider) {
    zoomSlider.oninput = (e) => this.updateZoom(e.target.value);
}

        // Handle responsive sidebar toggle button
        this.updateResponsiveUI();
        window.addEventListener('resize', () => this.updateResponsiveUI());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!document.getElementById('svgEditorModal') || 
                document.getElementById('svgEditorModal').style.display === 'none') return;

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
                    this.moveSelectedWithKeyboard(e.key);
                }
            } else if (e.key === 'Tab') {
                if (this.state.currentSvg !== null) {
                    e.preventDefault();
                    this.selectNextElement(e.shiftKey);
                }
            }
        });
    },

    updateResponsiveUI() {
        const sidebarToggle = document.getElementById('svgEditorSidebarToggle');
        const sidebar = document.getElementById('svgEditorSidebar');
        
        if (window.innerWidth < 768) {
            sidebarToggle.style.display = 'block';
            if (this.state.isSidebarCollapsed) {
                sidebar.style.transform = 'translateX(-100%)';
                sidebar.style.position = 'absolute';
                sidebar.style.zIndex = '10';
                sidebar.style.height = 'calc(100vh - 60px)';
            }
        } else {
            sidebarToggle.style.display = 'none';
            sidebar.style.transform = 'translateX(0)';
            sidebar.style.position = 'relative';
            sidebar.style.zIndex = 'auto';
            this.state.isSidebarCollapsed = false;
        }
    },

    toggleSidebar() {
    const sidebar = document.getElementById('svgEditorSidebar');
    this.state.isSidebarCollapsed = !this.state.isSidebarCollapsed;
    
    if (this.state.isSidebarCollapsed) {
        sidebar.style.transform = 'translateX(-100%)';
    } else {
        sidebar.style.transform = 'translateX(0)';
    }
},

updateZoom(value) {
    this.state.currentZoom = parseInt(value);
    const container = document.getElementById('svgEditorContainer');
    const zoomValue = document.getElementById('svgEditorZoomValue');
    
    if (container) {
        container.style.transform = `scale(${this.state.currentZoom / 100})`;
    }
    if (zoomValue) {
        zoomValue.textContent = this.state.currentZoom + '%';
    }
},

    loadSVGList() {
    const listContainer = document.getElementById('svgEditorList');
    if (!listContainer || !window.svgData) return;

    listContainer.innerHTML = '';
    const svgNames = Object.keys(window.svgData).sort();

    svgNames.forEach(name => {
        const item = document.createElement('div');
        item.className = 'svg-editor-item';
        item.style.cssText = `
            padding: 12px;
            margin-bottom: 8px;
            background: #f8f9fa;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.2s;
            border: 2px solid transparent;
        `;

        const itemName = document.createElement('div');
        itemName.style.cssText = 'font-weight: 600; color: #2d3748; font-size: 0.9rem;';
        itemName.textContent = name;

        item.appendChild(itemName);

        item.addEventListener('mouseenter', () => {
            if (!item.classList.contains('active')) {
                item.style.background = '#e9ecef';
            }
        });

        item.addEventListener('mouseleave', () => {
            if (!item.classList.contains('active')) {
                item.style.background = '#f8f9fa';
            }
        });

        item.addEventListener('click', () => this.loadSVG(name));

        listContainer.appendChild(item);
    });
},

    loadSVG(svgName) {
        // Save current if needed
        if (this.state.currentSvg !== null && this.state.currentSvg !== svgName) {
            this.saveToMemory();
        }
        this.state.currentSvg = svgName;
        this.state.selectedElements.clear();

        // Update sidebar selection
        document.querySelectorAll('.svg-editor-item').forEach(item => {
            item.classList.remove('active');
            item.style.border = '2px solid transparent';
            item.style.background = '#f8f9fa';
        });

        const items = document.querySelectorAll('.svg-editor-item');
        const svgNames = Object.keys(window.svgData).sort();
        const index = svgNames.indexOf(svgName);
        if (items[index]) {
            items[index].classList.add('active');
            items[index].style.border = '2px solid #4a9eff';
            items[index].style.background = '#e3f2fd';
        }

        // Show toolbar
        document.getElementById('svgEditorToolbar').style.display = 'flex';
        document.getElementById('svgEditorCurrentName').textContent = svgName;

        // Load SVG to canvas
const canvas = document.getElementById('svgEditorCanvas');
canvas.innerHTML = `
    <div id="svgEditorContainer" style="position: relative; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); transform: scale(${this.state.currentZoom / 100}); transition: transform 0.2s;">
        <div id="svgEditorContent">${window.svgData[svgName]}</div>
    </div>
`;

// Update zoom slider
const zoomSlider = document.getElementById('svgEditorZoom');
const zoomValue = document.getElementById('svgEditorZoomValue');
if (zoomSlider) zoomSlider.value = this.state.currentZoom;
if (zoomValue) zoomValue.textContent = this.state.currentZoom + '%';

        const svg = canvas.querySelector('svg');
        if (svg) {
            this.makeLabelsSelectable(svg);
            
            // Initialize history
            if (!this.state.histories[svgName]) {
                this.state.histories[svgName] = [this.cloneSVG(svg)];
                this.state.historyIndices[svgName] = 0;
            }
        }

        // Collapse sidebar on mobile after selection
        if (window.innerWidth < 768) {
            this.state.isSidebarCollapsed = true;
            document.getElementById('svgEditorSidebar').style.transform = 'translateX(-100%)';
        }
    },

   makeLabelsSelectable(svg) {
    const labels = svg.querySelectorAll('.label-toggle');
    
    labels.forEach(label => {
        label.style.cursor = 'move';
        label.style.outline = '2px solid transparent';
        label.style.outlineOffset = '8px';
        label.style.transition = 'outline 0.2s';
        
        // Create invisible larger hitbox
        const bbox = label.getBBox();
        const padding = 10;
        const hitbox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        hitbox.setAttribute('x', bbox.x - padding);
        hitbox.setAttribute('y', bbox.y - padding);
        hitbox.setAttribute('width', bbox.width + padding * 2);
        hitbox.setAttribute('height', bbox.height + padding * 2);
        hitbox.setAttribute('fill', 'transparent');
        hitbox.setAttribute('stroke', 'none');
        hitbox.style.cursor = 'move';
        hitbox.style.pointerEvents = 'all';
        
        label.parentNode.insertBefore(hitbox, label);
        
        const handleInteraction = (e, isTouch = false) => {
            if (!this.state.selectedElements.has(label)) {
                label.style.outline = '2px solid #4a9eff';
            }
        };
        
        const handleLeave = () => {
            if (!this.state.selectedElements.has(label)) {
                label.style.outline = '2px solid transparent';
            }
        };

        hitbox.addEventListener('mouseenter', () => handleInteraction());
        hitbox.addEventListener('mouseleave', handleLeave);
        hitbox.addEventListener('mousedown', (e) => this.handleLabelMouseDown(e, label));
        hitbox.addEventListener('touchstart', (e) => this.handleLabelTouchStart(e, label), { passive: false });

        label.addEventListener('mouseenter', () => handleInteraction());
        label.addEventListener('mouseleave', handleLeave);
        label.addEventListener('mousedown', (e) => this.handleLabelMouseDown(e, label));
        label.addEventListener('touchstart', (e) => this.handleLabelTouchStart(e, label), { passive: false });
    });
},

    handleLabelMouseDown(e, label) {
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
                this.state.selectedElements.forEach(el => el.style.outline = '2px solid transparent');
                this.state.selectedElements.clear();
                this.state.selectedElements.add(label);
                label.style.outline = '2px solid #ff4a9e';
            }
        }

        if (this.state.selectedElements.size > 0) {
            this.startDrag(e);
        }
    },

    handleLabelTouchStart(e, label) {
        e.preventDefault();
        e.stopPropagation();

        const touch = e.touches[0];
        this.state.touchStartPos = { x: touch.clientX, y: touch.clientY, time: Date.now() };

        // Single tap selection
        if (!this.state.selectedElements.has(label)) {
            this.state.selectedElements.forEach(el => el.style.outline = '2px solid transparent');
            this.state.selectedElements.clear();
            this.state.selectedElements.add(label);
            label.style.outline = '2px solid #ff4a9e';
        }

        if (this.state.selectedElements.size > 0) {
            this.startDragTouch(e);
        }
    },

    startDrag(e) {
        this.state.dragging = true;

        const svg = document.querySelector('#svgEditorCanvas svg');
        if (!svg) return;

        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

        this.state.dragStart = { x: svgP.x, y: svgP.y };
        this.state.elementStarts.clear();

        this.state.selectedElements.forEach(el => {
            this.state.elementStarts.set(el, this.captureElementState(el));
        });

        document.addEventListener('mousemove', this.handleDrag.bind(this));
        document.addEventListener('mouseup', this.stopDrag.bind(this));
    },

    startDragTouch(e) {
        this.state.dragging = true;

        const svg = document.querySelector('#svgEditorCanvas svg');
        if (!svg) return;

        const touch = e.touches[0];
        const pt = svg.createSVGPoint();
        pt.x = touch.clientX;
        pt.y = touch.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

        this.state.dragStart = { x: svgP.x, y: svgP.y };
        this.state.elementStarts.clear();

        this.state.selectedElements.forEach(el => {
            this.state.elementStarts.set(el, this.captureElementState(el));
        });

        document.addEventListener('touchmove', this.handleDragTouch.bind(this), { passive: false });
        document.addEventListener('touchend', this.stopDragTouch.bind(this));
    },

    handleDrag(e) {
        if (!this.state.dragging) return;

        const svg = document.querySelector('#svgEditorCanvas svg');
        if (!svg) return;

        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

        const dx = svgP.x - this.state.dragStart.x;
        const dy = svgP.y - this.state.dragStart.y;

        this.state.selectedElements.forEach(el => {
            const startState = this.state.elementStarts.get(el);
            this.updateElementPosition(el, startState, dx, dy);
        });
    },

    handleDragTouch(e) {
        e.preventDefault();
        if (!this.state.dragging) return;

        const svg = document.querySelector('#svgEditorCanvas svg');
        if (!svg) return;

        const touch = e.touches[0];
        const pt = svg.createSVGPoint();
        pt.x = touch.clientX;
        pt.y = touch.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

        const dx = svgP.x - this.state.dragStart.x;
        const dy = svgP.y - this.state.dragStart.y;

        this.state.selectedElements.forEach(el => {
            const startState = this.state.elementStarts.get(el);
            this.updateElementPosition(el, startState, dx, dy);
        });
    },

    stopDrag() {
        if (!this.state.dragging) return;
        this.state.dragging = false;

        const svg = document.querySelector('#svgEditorCanvas svg');
        if (svg) {
            this.saveHistory(this.cloneSVG(svg));
        }

        document.removeEventListener('mousemove', this.handleDrag.bind(this));
        document.removeEventListener('mouseup', this.stopDrag.bind(this));
    },

    stopDragTouch() {
        if (!this.state.dragging) return;
        this.state.dragging = false;

        const svg = document.querySelector('#svgEditorCanvas svg');
        if (svg) {
            this.saveHistory(this.cloneSVG(svg));
        }

        document.removeEventListener('touchmove', this.handleDragTouch.bind(this));
        document.removeEventListener('touchend', this.stopDragTouch.bind(this));
    },

    captureElementState(el) {
        const attrs = {};
        ['x', 'y', 'd'].forEach(attr => {
            if (el.hasAttribute(attr)) {
                attrs[attr] = el.getAttribute(attr);
            }
        });
        return { attributes: attrs, tagName: el.tagName.toLowerCase() };
    },

    updateElementPosition(el, startState, dx, dy) {
        const tagName = startState.tagName;
        const attrs = startState.attributes;

        if (tagName === 'text' || tagName === 'tspan') {
            const originalX = parseFloat(attrs.x || 0);
            const originalY = parseFloat(attrs.y || 0);
            el.setAttribute('x', originalX + dx);
            el.setAttribute('y', originalY + dy);
        } else if (tagName === 'path') {
            const newD = this.translatePathData(attrs.d, dx, dy);
            el.setAttribute('d', newD);
        }
    },

    translatePathData(pathData, dx, dy) {
        const commands = [];
        const tokens = pathData.match(/[a-df-zA-DF-Z]|[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g);
        
        let i = 0;
        let currentCmd = '';
        
        while (i < tokens.length) {
            const token = tokens[i];
            
            if (/[a-zA-Z]/.test(token)) {
                currentCmd = token;
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
        
        for (let cmd of commands) {
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
                result += p.map(x => x + dx).join(' ');
            } else if (c === 'V') {
                result += c;
                result += p.map(y => y + dy).join(' ');
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
    },

    moveSelectedWithKeyboard(key) {
        const svg = document.querySelector('#svgEditorCanvas svg');
        if (!svg || this.state.selectedElements.size === 0) return;

        let dx = 0, dy = 0;
        const step = 1;

        switch(key) {
            case 'ArrowUp': dy = -step; break;
            case 'ArrowDown': dy = step; break;
            case 'ArrowLeft': dx = -step; break;
            case 'ArrowRight': dx = step; break;
        }

        this.state.selectedElements.forEach(el => {
            const startState = this.captureElementState(el);
            this.updateElementPosition(el, startState, dx, dy);
        });

        this.saveHistory(this.cloneSVG(svg));
    },

    selectNextElement(reverse = false) {
        const svg = document.querySelector('#svgEditorCanvas svg');
        if (!svg) return;

        const labels = Array.from(svg.querySelectorAll('.label-toggle'));
        if (labels.length === 0) return;

        let currentIndex = -1;
        if (this.state.selectedElements.size === 1) {
            currentIndex = labels.indexOf(Array.from(this.state.selectedElements)[0]);
        }

        let nextIndex;
        if (reverse) {
            nextIndex = currentIndex <= 0 ? labels.length - 1 : currentIndex - 1;
        } else {
            nextIndex = currentIndex >= labels.length - 1 ? 0 : currentIndex + 1;
        }

        this.state.selectedElements.forEach(el => el.style.outline = '2px solid transparent');
        this.state.selectedElements.clear();
        this.state.selectedElements.add(labels[nextIndex]);
        labels[nextIndex].style.outline = '2px solid #ff4a9e';
    },

    cloneSVG(svg) {
        const clone = svg.cloneNode(true);
        clone.querySelectorAll('.label-toggle').forEach(el => {
            el.style.outline = '2px solid transparent';
        });
        return clone;
    },

    saveHistory(svgElement) {
        const name = this.state.currentSvg;
        if (name === null) return;

        if (!this.state.histories[name]) {
            this.state.histories[name] = [];
            this.state.historyIndices[name] = -1;
        }

        this.state.histories[name] = this.state.histories[name].slice(0, this.state.historyIndices[name] + 1);
        this.state.histories[name].push(svgElement);
        this.state.historyIndices[name]++;
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
        const newSvg = svgElement.cloneNode(true);
        content.appendChild(newSvg);

        this.makeLabelsSelectable(newSvg);
        this.state.selectedElements.clear();
    },

    saveToMemory() {
        const name = this.state.currentSvg;
        if (name === null) return;

        const svg = document.querySelector('#svgEditorCanvas svg');
        if (!svg) return;

        const clone = svg.cloneNode(true);
        clone.querySelectorAll('.label-toggle').forEach(el => {
            el.style.outline = '';
            el.style.cursor = '';
            el.style.transition = '';
        });

        // Store in memory but don't save to localStorage yet
        window.svgData[name] = clone.outerHTML;
    },

    saveCurrent() {
        const name = this.state.currentSvg;
        if (name === null) return;

        this.saveToMemory();

        // Save to localStorage
        saveState();

        // Re-render main app
        render(true);

        alert(`"${name}" saved successfully!`);
    },

    resetCurrent() {
        const name = this.state.currentSvg;
        if (name === null) return;

        if (!confirm(`Reset "${name}" to default? This cannot be undone.`)) {
            return;
        }

        // Reset to default
        window.svgData[name] = DEFAULT_SVGS[name];

        // Save and re-render
        saveState();
        render(true);

        // Reload in editor
        this.loadSVG(name);

        alert(`"${name}" reset to default!`);
    },

    open() {
        const modal = document.getElementById('svgEditorModal');
        if (modal) {
            modal.style.display = 'block';
            document.body.classList.add('modal-open');
            this.loadSVGList();
            pushModalState('svgEditorModal', () => this.close());
        }
    },

    close() {
        // Save current before closing
        if (this.state.currentSvg !== null) {
            this.saveToMemory();
        }

        const modal = document.getElementById('svgEditorModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }

        // Reset state
        this.state.currentSvg = null;
        this.state.selectedElements.clear();
        this.state.isSidebarCollapsed = false;
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SVGEditor.init());
} else {
    SVGEditor.init();
}