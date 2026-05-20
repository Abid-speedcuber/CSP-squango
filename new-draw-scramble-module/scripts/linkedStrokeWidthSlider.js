export class LinkedStrokeWidthSlider {
    constructor(root, options = {}) {
        this.root = root;
        this.parts = {
            top: options.parts?.top,
            middle: options.parts?.middle,
            bottom: options.parts?.bottom,
        };
        this.onChange = options.onChange ?? (() => {});

        const scope = root.closest('[data-linked-width-control]') ?? root;

        this.el = {
            top: root.querySelector('[data-width-part="top"]'),
            middle: root.querySelector('[data-width-part="middle"]'),
            bottom: root.querySelector('[data-width-part="bottom"]'),
            bridge: root.querySelector('[data-width-bridge]'),
            topVal: scope.querySelector('[data-width-value="top"]'),
            middleVal: scope.querySelector('[data-width-value="middle"]'),
            bottomVal: scope.querySelector('[data-width-value="bottom"]'),
        };

        this.min = 0;
        this.max = 100;

        this.state = {
            top: this.valueToPercent(this.parts.top.value, this.parts.top),
            middle: this.valueToPercent(this.parts.middle.value, this.parts.middle),
            bottom: this.valueToPercent(this.parts.bottom.value, this.parts.bottom),

            selected: null,
            dragging: null,
            dragMode: null,

            startX: 0,
            startTop: 0,
            startMiddle: 0,
            startBottom: 0,

            groupGap: 0,
            clickTime: 0,
            clickMoved: false,
        };

        this.snapDistance = 3.5;

        this.bind();
        this.render(false);
    }

    bind() {
        for (const part of ['top', 'bottom']) {
            this.el[part].addEventListener('pointerdown', e => this.downMain(e, part));
        }

        this.el.middle.addEventListener('pointerdown', e => this.downMiddle(e));

        this.onPointerMove = e => this.move(e);
        this.onPointerUp = () => this.up();
        this.onDocumentDown = e => {
            if (!e.target.closest?.('.linked-width-handle')) {
                this.state.selected = null;
                this.render(false);
            }
        };

        window.addEventListener('pointermove', this.onPointerMove);
        window.addEventListener('pointerup', this.onPointerUp);
        document.addEventListener('pointerdown', this.onDocumentDown);

        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => this.render(false));
            this.resizeObserver.observe(this.root);
        }
    }

    destroy() {
        window.removeEventListener('pointermove', this.onPointerMove);
        window.removeEventListener('pointerup', this.onPointerUp);
        document.removeEventListener('pointerdown', this.onDocumentDown);
        this.resizeObserver?.disconnect();
    }

    get linked() {
        return this.state.top === this.state.bottom;
    }

    downMain(e, part) {
        e.preventDefault();
        e.stopPropagation();

        this.state.dragging = part;
        this.state.startX = e.clientX;
        this.state.startTop = this.state.top;
        this.state.startBottom = this.state.bottom;
        this.state.startMiddle = this.state.middle;
        this.state.clickTime = performance.now();
        this.state.clickMoved = false;

        if (this.linked) {
            this.state.dragMode = this.state.selected ? 'single' : 'linked';
        } else {
            this.state.dragMode = e.shiftKey ? 'spaced-group' : 'single';
            this.state.groupGap = this.state.bottom - this.state.top;
        }

        e.currentTarget.setPointerCapture(e.pointerId);
    }

    downMiddle(e) {
        e.preventDefault();
        e.stopPropagation();

        this.state.dragging = 'middle';
        this.state.dragMode = 'middle';

        this.state.startX = e.clientX;
        this.state.startMiddle = this.state.middle;
        this.state.clickMoved = true;

        e.currentTarget.setPointerCapture(e.pointerId);
    }

    move(e) {
        if (!this.state.dragging) return;

        const delta = this.pxToValue(e.clientX - this.state.startX);
        if (Math.abs(delta) > 0.7) this.state.clickMoved = true;

        if (this.state.dragMode === 'linked') {
            this.moveLinked(delta);
        }

        if (this.state.dragMode === 'single') {
            this.moveSingle(delta);
        }

        if (this.state.dragMode === 'spaced-group') {
            this.moveSpacedGroup(delta);
        }

        if (this.state.dragMode === 'middle') {
            this.moveMiddle(delta);
        }

        this.render();
    }

    up() {
        if (!this.state.dragging) return;

        const wasClick =
            !this.state.clickMoved &&
            performance.now() - this.state.clickTime < 250;

        if (wasClick && this.linked && this.state.dragging !== 'middle') {
            this.state.selected =
                this.state.selected === this.state.dragging
                    ? null
                    : this.state.dragging;
        }

        this.state.dragging = null;
        this.state.dragMode = null;
        this.render();
    }

    moveLinked(delta) {
        const next = this.clamp(this.state.startTop + delta);
        this.state.top = next;
        this.state.bottom = next;
    }

    moveSingle(delta) {
        const part = this.state.dragging;
        const other = part === 'top' ? 'bottom' : 'top';
        const startKey = `start${this.cap(part)}`;

        const next = this.clamp(this.state[startKey] + delta);
        const distance = Math.abs(next - this.state[other]);

        if (distance <= this.snapDistance) {
            this.state[part] = this.state[other];
            this.state.selected = null;
        } else {
            this.state[part] = next;
        }
    }

    moveSpacedGroup(delta) {
        this.state.top = this.clamp(this.state.startTop + delta);
        this.state.bottom = this.clamp(this.state.startBottom + delta);
    }

    moveMiddle(delta) {
        this.state.middle = this.clamp(this.state.startMiddle + delta);
    }

    render(emit = true) {
        const topX = this.valueToPx(this.state.top);
        const middleX = this.valueToPx(this.state.middle);
        const bottomX = this.valueToPx(this.state.bottom);

        this.el.top.style.left = `${topX}px`;
        this.el.middle.style.left = `${middleX}px`;
        this.el.bottom.style.left = `${bottomX}px`;

        const a = Math.min(topX, bottomX);
        const b = Math.max(topX, bottomX);

        this.el.bridge.style.left = `${a}px`;
        this.el.bridge.style.width = `${Math.max(2, b - a)}px`;

        if (this.el.topVal) this.el.topVal.textContent = this.formatPart('top');
        if (this.el.middleVal) this.el.middleVal.textContent = this.formatPart('middle');
        if (this.el.bottomVal) this.el.bottomVal.textContent = this.formatPart('bottom');

        for (const part of ['top', 'bottom']) {
            this.el[part].classList.toggle('linked', this.linked && !this.state.selected);
            this.el[part].classList.toggle('selected', this.state.selected === part);
            this.el[part].classList.toggle('grouping', this.state.dragMode === 'spaced-group');
        }

        if (emit) this.emitChange();
    }

    emitChange() {
        this.onChange({
            [this.parts.top.id]: this.percentToValue(this.state.top, this.parts.top),
            [this.parts.middle.id]: this.percentToValue(this.state.middle, this.parts.middle),
            [this.parts.bottom.id]: this.percentToValue(this.state.bottom, this.parts.bottom),
        });
    }

    formatPart(part) {
        const config = this.parts[part];
        return this.percentToValue(this.state[part], config).toFixed(config.decimals ?? 4);
    }

    valueToPercent(value, config) {
        return ((value - config.min) / (config.max - config.min)) * 100;
    }

    percentToValue(percent, config) {
        const raw = config.min + (percent / 100) * (config.max - config.min);
        return this.snapToStep(raw, config);
    }

    snapToStep(value, config) {
        const step = config.step ?? 1;
        const snapped = Math.round((value - config.min) / step) * step + config.min;
        return Math.max(config.min, Math.min(config.max, Number(snapped.toFixed(8))));
    }

    valueToPx(v) {
        return ((v - this.min) / (this.max - this.min)) * this.getTrackWidth();
    }

    pxToValue(px) {
        return (px / this.getTrackWidth()) * (this.max - this.min);
    }

    getTrackWidth() {
        return this.root.clientWidth || this.root.getBoundingClientRect().width || 1;
    }

    clamp(v) {
        return Math.max(this.min, Math.min(this.max, v));
    }

    cap(s) {
        return s[0].toUpperCase() + s.slice(1);
    }
}
