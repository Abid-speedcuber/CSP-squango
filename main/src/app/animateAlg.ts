/**
 * Three.js Square-1 algorithm viewer.
 *
 * Replaces the SVG/fade legacy animator with a real 3D Square-1 model. The
 * public bridge stays compatible with the rest of the port:
 * `openAnimateAlgModal(algorithm, caseName, parity)`.
 */
import * as THREE from 'three';
import { invertScramble } from '../lib/cube';
import { getParityText } from '../lib/parityAnalyzer';
import { closeModalWithHistory, pushModalState } from './modal';
import { colorScheme, cornerStickerMode } from './state';

type ViewerToken =
  | { type: 'turn'; top: number; bottom: number; text: string }
  | { type: 'slash'; text: string }
  | { type: 'rotation'; axis: 'y2' | 'z2'; text: string };

const LEN = 150;
const INTERNAL_COL = 0x0f0f0f;
const BLUE = 0x0433ff;
const RED = 0xff2600;
const GREEN = 0x60d937;
const ORANGE = 0xff9300;
const POLES = [0xffffff, 0x1e1e1e];
const EDGE_RIGHT_COLORS = [ORANGE, BLUE, RED, GREEN, RED, BLUE, ORANGE, GREEN];
const LEFT_COLORS = [BLUE, RED, GREEN, ORANGE, BLUE, ORANGE, GREEN, RED];
const INITIAL_UP = [1, -1, 0.02, 2, -2, 0.03, 3, -3, 0.04, 4, -4, 0.01];
const INITIAL_DOWN = [0.05, 5, -5, 0.06, 6, -6, 0.07, 7, -7, 0.08, 8, -8];

function escapeHTML(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[ch]!);
}

function parseAlgorithm(algorithm: string): ViewerToken[] {
  const tokens: ViewerToken[] = [];
  const re = /y2|z2|\((-?\d+)\s*,\s*(-?\d+)\)|\/|\\/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(algorithm))) {
    const raw = match[0];
    if (raw === '/' || raw === '\\') {
      tokens.push({ type: 'slash', text: raw });
    } else if (raw.toLowerCase() === 'y2' || raw.toLowerCase() === 'z2') {
      tokens.push({ type: 'rotation', axis: raw.toLowerCase() as 'y2' | 'z2', text: raw });
    } else {
      tokens.push({ type: 'turn', top: Number(match[1]), bottom: Number(match[2]), text: raw });
    }
  }
  return tokens;
}

function ease(start: number, end: number, t: number): number {
  const e = 6 * t ** 5 - 15 * t ** 4 + 10 * t ** 3;
  return start + (end - start) * e;
}

function turnLayer(layer: number[], move: number): number[] {
  const out = layer.slice();
  const count = Math.abs(move);
  for (let i = 0; i < count; i++) {
    if (move > 0) out.unshift(out.pop()!);
    else out.push(out.shift()!);
  }
  return out;
}

class ImmediateRenderer {
  positions = new Float32Array(6000 * 3 * 3);
  colors = new Float32Array(6000 * 3 * 3);
  linePositions = new Float32Array(4000 * 2 * 3);
  count = 0;
  lineCount = 0;
  private matrix = new THREE.Matrix4();
  private stack: THREE.Matrix4[] = [];
  private verts: THREE.Vector3[] = [];
  private mode = 'POLY';
  private color = [1, 1, 1];
  private colorObj = new THREE.Color();

  reset(): void {
    this.count = 0;
    this.lineCount = 0;
    this.matrix.identity();
    this.stack.length = 0;
    this.verts.length = 0;
  }

  push(): void { this.stack.push(this.matrix.clone()); }
  pop(): void { this.matrix = this.stack.pop() || new THREE.Matrix4(); }
  translate(x: number, y: number, z: number): void { this.matrix.multiply(new THREE.Matrix4().makeTranslation(x, y, z)); }
  rotateX(a: number): void { this.matrix.multiply(new THREE.Matrix4().makeRotationX(a)); }
  rotateY(a: number): void { this.matrix.multiply(new THREE.Matrix4().makeRotationY(a)); }
  rotateZ(a: number): void { this.matrix.multiply(new THREE.Matrix4().makeRotationZ(a)); }
  fill(hex: number): void {
    this.colorObj.set(hex);
    this.color = [this.colorObj.r, this.colorObj.g, this.colorObj.b];
  }
  begin(mode = 'POLY'): void {
    this.mode = mode;
    this.verts = [];
  }
  vertex(x: number, y: number, z = 0): void {
    this.verts.push(new THREE.Vector3(x, y, z).applyMatrix4(this.matrix));
  }
  end(): void {
    if (this.mode === 'QUADS') {
      for (let i = 0; i + 3 < this.verts.length; i += 4) {
        this.tri(this.verts[i], this.verts[i + 1], this.verts[i + 2]);
        this.tri(this.verts[i], this.verts[i + 2], this.verts[i + 3]);
        this.outline([this.verts[i], this.verts[i + 1], this.verts[i + 2], this.verts[i + 3]]);
      }
    } else {
      for (let i = 1; i + 1 < this.verts.length; i++) this.tri(this.verts[0], this.verts[i], this.verts[i + 1]);
      this.outline(this.verts);
    }
  }
  private tri(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3): void {
    if (this.count + 3 > 6000 * 3) return;
    const pts = [a, b, c];
    const base = this.count * 3;
    for (let i = 0; i < 3; i++) {
      this.positions[base + i * 3] = pts[i].x;
      this.positions[base + i * 3 + 1] = pts[i].y;
      this.positions[base + i * 3 + 2] = pts[i].z;
      this.colors[base + i * 3] = this.color[0];
      this.colors[base + i * 3 + 1] = this.color[1];
      this.colors[base + i * 3 + 2] = this.color[2];
    }
    this.count += 3;
  }
  private line(a: THREE.Vector3, b: THREE.Vector3): void {
    if (this.lineCount + 2 > 4000 * 2) return;
    const base = this.lineCount * 3;
    this.linePositions[base] = a.x;
    this.linePositions[base + 1] = a.y;
    this.linePositions[base + 2] = a.z;
    this.linePositions[base + 3] = b.x;
    this.linePositions[base + 4] = b.y;
    this.linePositions[base + 5] = b.z;
    this.lineCount += 2;
  }
  private outline(verts: THREE.Vector3[]): void {
    for (let i = 0; i < verts.length; i++) this.line(verts[i], verts[(i + 1) % verts.length]);
  }
}

class Square1ThreeViewer {
  private up = INITIAL_UP.slice();
  private down = INITIAL_DOWN.slice();
  private bar = false;
  private rotated = false;
  private step = 0;
  private progress = 0;
  private playing = false;
  private runningToken: ViewerToken | null = null;
  private frame = 0;
  private speed = Number(localStorage.getItem('sq1ThreeAnimSpeed') || '1') || 1;
  private readonly im = new ImmediateRenderer();
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(45, 1, 1, 5000);
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  private readonly rig = new THREE.Group();
  private readonly geometry = new THREE.BufferGeometry();
  private readonly lineGeometry = new THREE.BufferGeometry();
  private readonly mesh: THREE.Mesh;
  private readonly lineMesh: THREE.LineSegments;
  private readonly initialCameraVector = new THREE.Vector3(320, 260, 420);
  private readonly initialCameraDistance = this.initialCameraVector.length();
  private dragging = false;
  private lastMouse = { x: 0, y: 0 };
  private dragZone = 1;

  constructor(
    private readonly host: HTMLElement,
    private readonly tokens: ViewerToken[],
    private readonly presetTokens: ViewerToken[],
    private readonly status: HTMLElement,
    private readonly algEl: HTMLElement,
  ) {
    this.scene.background = new THREE.Color(0x000000);
    this.scene.background = null;
    this.camera.position.set(0, 0, this.initialCameraDistance);
    this.rig.add(this.camera);
    this.scene.add(this.rig);
    this.rig.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      this.initialCameraVector.clone().normalize(),
    );

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.domElement.className = 'sq1-three-canvas';
    this.host.appendChild(this.renderer.domElement);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.im.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.im.colors, 3));
    this.geometry.setDrawRange(0, 0);
    const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
    material.polygonOffset = true;
    material.polygonOffsetFactor = 1;
    material.polygonOffsetUnits = 1;
    this.mesh = new THREE.Mesh(this.geometry, material);
    this.scene.add(this.mesh);

    this.lineGeometry.setAttribute('position', new THREE.BufferAttribute(this.im.linePositions, 3));
    this.lineGeometry.setDrawRange(0, 0);
    this.lineMesh = new THREE.LineSegments(this.lineGeometry, new THREE.LineBasicMaterial({ color: 0x000000 }));
    this.scene.add(this.lineMesh);

    this.bindControls();
    this.resize();
    this.setToStartState();
    this.updateAlgorithm();
    this.status.textContent = 'case ready';
    this.loop();
  }

  dispose(): void {
    cancelAnimationFrame(this.frame);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.removeEventListener('wheel', this.onWheel);
    this.geometry.dispose();
    this.lineGeometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    (this.lineMesh.material as THREE.Material).dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  play(): void {
    if (this.playing || this.step >= this.tokens.length) return;
    this.playing = true;
    this.status.textContent = 'playing';
  }

  pause(): void {
    this.playing = false;
    this.status.textContent = 'paused';
  }

  reset(): void {
    this.setToStartState();
    this.step = 0;
    this.progress = 0;
    this.playing = false;
    this.runningToken = null;
    this.updateAlgorithm();
    this.status.textContent = 'case ready';
  }

  private setToStartState(): void {
    this.up = INITIAL_UP.slice();
    this.down = INITIAL_DOWN.slice();
    this.bar = false;
    this.rotated = false;
    for (const token of this.presetTokens) this.commit(token);
  }

  next(): void {
    if (this.runningToken || this.step >= this.tokens.length) return;
    this.runningToken = this.tokens[this.step];
    this.progress = 0;
    this.playing = true;
  }

  previous(): void {
    if (this.runningToken || this.step <= 0) return;
    const targetStep = Math.max(0, this.step - 1);
    this.setToStartState();
    for (let i = 0; i < targetStep; i++) this.commit(this.tokens[i]);
    this.step = targetStep;
    this.playing = false;
    this.progress = 0;
    this.updateAlgorithm();
    this.status.textContent = targetStep === 0 ? 'case ready' : `move ${targetStep} / ${this.tokens.length}`;
  }

  setSpeed(value: number): void {
    this.speed = value;
    localStorage.setItem('sq1ThreeAnimSpeed', String(value));
  }

  private bindControls(): void {
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('resize', this.resize);
  }

  private onPointerDown = (e: PointerEvent): void => {
    this.dragging = true;
    this.lastMouse = { x: e.clientX, y: e.clientY };
    const rect = this.renderer.domElement.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const radius = Math.min(rect.width, rect.height) * 0.35;
    this.dragZone = Math.hypot(e.clientX - cx, e.clientY - cy) < radius ? 1 : 2;
  };

  private onPointerUp = (): void => { this.dragging = false; };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.dragging) return;
    const dx = e.clientX - this.lastMouse.x;
    const dy = e.clientY - this.lastMouse.y;
    const rotSpeed = 0.006;
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.rig.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.rig.quaternion);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.rig.quaternion);

    if (this.dragZone === 1) {
      q.setFromAxisAngle(up, -dx * rotSpeed);
      this.rig.quaternion.premultiply(q);
      q.setFromAxisAngle(right, -dy * rotSpeed);
      this.rig.quaternion.premultiply(q);
    } else {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const vecX = this.lastMouse.x - cx;
      const vecY = this.lastMouse.y - cy;
      const len = Math.hypot(vecX, vecY);

      if (len > 0.001) {
        const rX = vecX / len;
        const rY = vecY / len;
        const tX = -rY;
        const tY = rX;
        const centralMag = dx * rX + dy * rY;
        const tangentMag = dx * tX + dy * tY;
        const dCx = centralMag * rX;
        const dCy = centralMag * rY;

        q.setFromAxisAngle(up, -dCx * rotSpeed);
        this.rig.quaternion.premultiply(q);
        q.setFromAxisAngle(right, -dCy * rotSpeed);
        this.rig.quaternion.premultiply(q);
        q.setFromAxisAngle(forward, -tangentMag * rotSpeed);
        this.rig.quaternion.premultiply(q);
      }
    }
    this.rig.quaternion.normalize();
    this.lastMouse = { x: e.clientX, y: e.clientY };
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z * (e.deltaY > 0 ? 1.1 : 0.9), 230, 1200);
  };

  private resize = (): void => {
    const rect = this.host.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  private loop = (): void => {
    this.frame = requestAnimationFrame(this.loop);
    this.tick();
    this.draw();
    this.renderer.render(this.scene, this.camera);
  };

  private tick(): void {
    if (!this.playing) return;
    if (!this.runningToken) {
      if (this.step >= this.tokens.length) {
        this.playing = false;
        this.status.textContent = 'done';
        return;
      }
      this.runningToken = this.tokens[this.step];
      this.progress = 0;
    }
    this.progress += 0.035 * this.speed;
    if (this.progress >= 1) {
      this.commit(this.runningToken);
      this.runningToken = null;
      this.progress = 0;
      this.step++;
      this.updateAlgorithm();
      if (this.step >= this.tokens.length) {
        this.playing = false;
        this.status.textContent = 'done';
      }
    } else {
      this.status.textContent = `move ${Math.min(this.step + 1, this.tokens.length)} / ${this.tokens.length}`;
    }
  }

  private commit(token: ViewerToken): void {
    if (token.type === 'turn') {
      this.up = turnLayer(this.up, token.top);
      this.down = turnLayer(this.down, token.bottom);
    } else if (token.type === 'slash') {
      const upSection = this.up.slice(0, 6);
      const downSection = this.down.slice(0, 6);
      this.up = downSection.concat(this.up.slice(6));
      this.down = upSection.concat(this.down.slice(6));
      this.bar = !this.bar;
    } else if (token.axis === 'y2') {
      this.up = turnLayer(this.up, 6);
      this.down = turnLayer(this.down, 6);
      this.rotated = true;
    } else {
      const upRight = this.up.slice(0, 6);
      const upLeft = this.up.slice(6);
      const downRight = this.down.slice(0, 6);
      const downLeft = this.down.slice(6);
      this.up = downRight.concat(downLeft);
      this.down = upRight.concat(upLeft);
      this.up = turnLayer(this.up, 6);
      this.down = turnLayer(this.down, 6);
      this.rotated = true;
    }
  }

  private updateAlgorithm(): void {
    this.algEl.innerHTML = this.tokens.map((token, idx) => {
      const cls = idx === this.step ? 'sq1-token current' : idx < this.step ? 'sq1-token done' : 'sq1-token';
      return `<span class="${cls}">${escapeHTML(token.text)}</span>`;
    }).join('');
  }

  private draw(): void {
    this.im.reset();
    const token = this.runningToken;
    if (token?.type === 'turn') {
      this.drawEquator(true, this.bar, this.rotated);
      this.drawEquator(false, false, this.rotated);
      this.im.push();
      this.im.rotateZ(ease(0, token.top * Math.PI / 6, this.progress));
      this.drawUpLayer();
      this.im.pop();
      this.im.push();
      this.im.rotateZ(ease(0, -token.bottom * Math.PI / 6, this.progress));
      this.drawDownLayer();
      this.im.pop();
    } else if (token?.type === 'slash') {
      this.leftCube();
      this.im.push();
      this.im.rotateX(ease(0, (this.bar ? -1 : 1) * Math.PI, this.progress));
      this.rightCube();
      this.im.pop();
    } else if (token?.type === 'rotation') {
      this.im.push();
      if (token.axis === 'y2') this.im.rotateZ(ease(0, Math.PI, this.progress));
      else this.im.rotateY(ease(0, Math.PI, this.progress));
      this.restCube();
      this.im.pop();
    } else {
      this.restCube();
    }
    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    this.geometry.setDrawRange(0, this.im.count);
    (this.lineGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    this.lineGeometry.setDrawRange(0, this.im.lineCount);
  }

  private edge(col: number): void {
    this.im.fill(col);
    this.im.begin();
    this.im.vertex(0, 0, 0);
    this.im.vertex(0, -LEN / (2 * Math.cos(Math.PI / 12)), 0);
    this.im.vertex(LEN / (2 * Math.cos(Math.PI / 12)) * Math.cos(Math.PI / 3), -LEN / (2 * Math.cos(Math.PI / 12)) * Math.sin(Math.PI / 3), 0);
    this.im.end();
  }

  private corner(col: number): void {
    this.im.fill(col);
    this.im.begin();
    this.im.vertex(0, 0, 0);
    this.im.vertex(0, -LEN / (2 * Math.cos(Math.PI / 12)), 0);
    this.im.vertex(LEN / 2 * Math.sqrt(2) * Math.cos(Math.PI / 3), -LEN / 2 * Math.sqrt(2) * Math.sin(Math.PI / 3), 0);
    this.im.vertex(LEN / (2 * Math.cos(Math.PI / 12)) * Math.cos(Math.PI / 6), -LEN / (2 * Math.cos(Math.PI / 12)) * Math.sin(Math.PI / 6), 0);
    this.im.end();
  }

  private edgeFill(isTop: boolean, internal: boolean, idx: number): number {
    if (internal) return INTERNAL_COL;
    const value = isTop ? this.up[idx] : this.down[idx];
    return POLES[Math.round((100 / 8 * value - 0.01) % 1)];
  }

  private cornerFill(isTop: boolean, internal: boolean, idx: number): number {
    if (internal) return INTERNAL_COL;
    const value = isTop ? this.up[idx] : this.down[idx];
    return POLES[Math.round((Math.abs(value) / 8.5) % 1)];
  }

  private cshape(isTop: boolean, isRight: boolean, internal: boolean): void {
    this.im.push();
    const layer = isTop ? this.up : this.down;
    const start = isRight ? 0 : 6;
    this.im.translate(0, 0, isTop ? (internal ? LEN / 6 : LEN / 2) : (internal ? -LEN / 6 : -LEN / 2));
    if (!isTop) this.im.rotateZ(Math.PI);
    for (let i = start; i < start + 6; i++) {
      const value = layer[i];
      this.im.push();
      if (isTop) this.im.rotateZ(Math.PI / 6 * i);
      else this.im.rotateZ(Math.abs(value) < 1 ? -(i + 1) * Math.PI / 6 : -(i + 2) * Math.PI / 6);
      if (Math.abs(value) < 1) this.edge(this.edgeFill(isTop, internal, i));
      else if (value > 0) {
        this.corner(this.cornerFill(isTop, internal, i));
        i++;
      }
      this.im.pop();
    }
    this.im.pop();
  }

  private eadj(x: number, y: number, z: number, col: number): void {
    this.im.push();
    this.im.translate(x, y, z);
    this.im.fill(col);
    this.im.begin('QUADS');
    this.im.vertex(0, -LEN / (2 * Math.cos(Math.PI / 12)), LEN / 6);
    this.im.vertex(LEN / (2 * Math.cos(Math.PI / 12)) * Math.cos(Math.PI / 3), -LEN / (2 * Math.cos(Math.PI / 12)) * Math.sin(Math.PI / 3), LEN / 6);
    this.im.vertex(LEN / (2 * Math.cos(Math.PI / 12)) * Math.cos(Math.PI / 3), -LEN / (2 * Math.cos(Math.PI / 12)) * Math.sin(Math.PI / 3), -LEN / 6);
    this.im.vertex(0, -LEN / (2 * Math.cos(Math.PI / 12)), -LEN / 6);
    this.im.end();
    this.im.pop();
  }

  private cadj(x: number, y: number, z: number, col: number): void {
    this.im.push();
    this.im.translate(x, y, z);
    this.im.fill(col);
    this.im.begin('QUADS');
    this.im.vertex(0, -LEN / (2 * Math.cos(Math.PI / 12)), LEN / 6);
    this.im.vertex(LEN / 2 * Math.sqrt(2) * Math.cos(Math.PI / 3), -LEN / 2 * Math.sqrt(2) * Math.sin(Math.PI / 3), LEN / 6);
    this.im.vertex(LEN / 2 * Math.sqrt(2) * Math.cos(Math.PI / 3), -LEN / 2 * Math.sqrt(2) * Math.sin(Math.PI / 3), -LEN / 6);
    this.im.vertex(0, -LEN / (2 * Math.cos(Math.PI / 12)), -LEN / 6);
    this.im.end();
    this.im.pop();
  }

  private layerSides(isTop: boolean, isRight: boolean): void {
    const layer = isTop ? this.up : this.down;
    const start = isRight ? 0 : 6;
    for (let i = start; i < start + 6; i++) {
      const value = layer[i];
      this.im.push();
      if (isTop) {
        this.im.rotateZ(i * Math.PI / 6);
        if (Math.abs(value) < 1) this.eadj(0, 0, LEN / 3, EDGE_RIGHT_COLORS[Math.trunc(value * 100) - 1]);
        else if (value >= 1) this.cadj(0, 0, LEN / 3, EDGE_RIGHT_COLORS[Math.trunc(value) - 1]);
        else {
          this.im.rotateZ(Math.PI / 3);
          this.cadj(
            -LEN / 2 * Math.sqrt(2) * Math.cos(Math.PI / 6),
            LEN / (2 * Math.cos(Math.PI / 12)) - LEN / 2 * Math.sqrt(2) * Math.sin(Math.PI / 6),
            LEN / 3,
            LEFT_COLORS[Math.trunc(-value - 1)],
          );
        }
      } else {
        this.im.rotateZ(Math.PI);
        if (Math.abs(value) < 1) {
          this.im.rotateZ(-(i + 1) * Math.PI / 6);
          this.eadj(0, 0, -LEN / 3, EDGE_RIGHT_COLORS[Math.trunc(value * 100) - 1]);
        } else if (value >= 1) {
          this.im.rotateZ(-(i - 1) * Math.PI / 6);
          this.cadj(
            -LEN / 2 * Math.sqrt(2) * Math.cos(Math.PI / 6),
            LEN / (2 * Math.cos(Math.PI / 12)) - LEN / 2 * Math.sqrt(2) * Math.sin(Math.PI / 6),
            -LEN / 3,
            EDGE_RIGHT_COLORS[Math.trunc(value) - 1],
          );
        } else {
          this.im.rotateZ(-(i + 1) * Math.PI / 6);
          this.cadj(0, 0, -LEN / 3, LEFT_COLORS[Math.trunc(-value) - 1]);
        }
      }
      this.im.pop();
    }
  }

  private equatorBar(col: number): void {
    this.im.fill(col);
    this.im.begin('QUADS');
    this.im.vertex(LEN / 2 * Math.sqrt(2) * Math.cos(Math.PI / 3), -LEN / 2 * Math.sqrt(2) * Math.sin(Math.PI / 3), LEN / 6);
    this.im.vertex(LEN / 2 * Math.sqrt(2) * Math.cos(Math.PI / 6), LEN / 2 * Math.sqrt(2) * Math.sin(Math.PI / 6), LEN / 6);
    this.im.vertex(LEN / 2 * Math.sqrt(2) * Math.cos(Math.PI / 6), LEN / 2 * Math.sqrt(2) * Math.sin(Math.PI / 6), -LEN / 6);
    this.im.vertex(LEN / 2 * Math.sqrt(2) * Math.cos(Math.PI / 3), -LEN / 2 * Math.sqrt(2) * Math.sin(Math.PI / 3), -LEN / 6);
    this.im.end();
  }

  private equatorEndLong(col: number): void {
    this.im.fill(col);
    this.im.begin('QUADS');
    this.im.vertex(0, LEN / (2 * Math.cos(Math.PI / 12)), LEN / 6);
    this.im.vertex(LEN / 2 * Math.sqrt(2) * Math.cos(Math.PI / 6), LEN / 2 * Math.sqrt(2) * Math.sin(Math.PI / 6), LEN / 6);
    this.im.vertex(LEN / 2 * Math.sqrt(2) * Math.cos(Math.PI / 6), LEN / 2 * Math.sqrt(2) * Math.sin(Math.PI / 6), -LEN / 6);
    this.im.vertex(0, LEN / (2 * Math.cos(Math.PI / 12)), -LEN / 6);
    this.im.end();
  }

  private coreTops(isRight: boolean): void {
    this.im.push();
    if (isRight) this.im.rotateZ(Math.PI);
    this.im.fill(INTERNAL_COL);
    this.im.begin('QUADS');
    this.im.vertex(0, -LEN / (2 * Math.cos(Math.PI / 12)), LEN / 6);
    this.im.vertex(-LEN / 2 * Math.sqrt(2) * Math.cos(Math.PI / 6), -LEN / 2 * Math.sqrt(2) * Math.sin(Math.PI / 6), LEN / 6);
    this.im.vertex(-LEN / 2 * Math.sqrt(2) * Math.cos(Math.PI / 3), LEN / 2 * Math.sqrt(2) * Math.sin(Math.PI / 3), LEN / 6);
    this.im.vertex(0, LEN / (2 * Math.cos(Math.PI / 12)), LEN / 6);
    this.im.vertex(0, -LEN / (2 * Math.cos(Math.PI / 12)), -LEN / 6);
    this.im.vertex(-LEN / 2 * Math.sqrt(2) * Math.cos(Math.PI / 6), -LEN / 2 * Math.sqrt(2) * Math.sin(Math.PI / 6), -LEN / 6);
    this.im.vertex(-LEN / 2 * Math.sqrt(2) * Math.cos(Math.PI / 3), LEN / 2 * Math.sqrt(2) * Math.sin(Math.PI / 3), -LEN / 6);
    this.im.vertex(0, LEN / (2 * Math.cos(Math.PI / 12)), -LEN / 6);
    this.im.end();
    this.im.pop();
  }

  private drawEquator(isRight: boolean, flip: boolean, rotated: boolean): void {
    this.im.push();
    if (flip) this.im.rotateX(Math.PI);
    this.coreTops(isRight);
    if (isRight) {
      if (!rotated) {
        this.equatorBar(BLUE);
        this.equatorEndLong(RED);
        this.cadj(0, 0, 0, ORANGE);
      } else {
        this.equatorBar(GREEN);
        this.equatorEndLong(ORANGE);
        this.cadj(0, 0, 0, RED);
      }
    } else {
      this.im.push();
      this.im.rotateZ(Math.PI);
      if (!rotated) {
        this.equatorBar(GREEN);
        this.equatorEndLong(ORANGE);
        this.cadj(0, 0, 0, RED);
      } else {
        this.equatorBar(BLUE);
        this.equatorEndLong(RED);
        this.cadj(0, 0, 0, ORANGE);
      }
      this.im.pop();
    }
    this.im.pop();
  }

  private sliceInternal(): void {
    this.im.fill(INTERNAL_COL);
    this.im.begin('QUADS');
    this.im.vertex(0, -LEN / (2 * Math.cos(Math.PI / 12)), -LEN / 2 + 0.5);
    this.im.vertex(0, LEN / (2 * Math.cos(Math.PI / 12)), -LEN / 2 + 0.5);
    this.im.vertex(0, LEN / (2 * Math.cos(Math.PI / 12)), LEN / 2 - 0.5);
    this.im.vertex(0, -LEN / (2 * Math.cos(Math.PI / 12)), LEN / 2 - 0.5);
    this.im.end();
  }

  private leftCube(): void {
    this.cshape(true, false, false);
    this.cshape(false, false, false);
    this.cshape(true, false, true);
    this.cshape(false, false, true);
    this.layerSides(true, false);
    this.layerSides(false, false);
    this.drawEquator(false, false, this.rotated);
    this.sliceInternal();
  }

  private rightCube(): void {
    this.cshape(true, true, false);
    this.cshape(false, true, false);
    this.cshape(true, true, true);
    this.cshape(false, true, true);
    this.layerSides(true, true);
    this.layerSides(false, true);
    this.drawEquator(true, this.bar, this.rotated);
    this.sliceInternal();
  }

  private drawUpLayer(): void {
    this.cshape(true, false, false);
    this.cshape(true, true, false);
    this.cshape(true, false, true);
    this.cshape(true, true, true);
    this.layerSides(true, true);
    this.layerSides(true, false);
  }

  private drawDownLayer(): void {
    this.cshape(false, false, false);
    this.cshape(false, true, false);
    this.cshape(false, false, true);
    this.cshape(false, true, true);
    this.layerSides(false, true);
    this.layerSides(false, false);
  }

  private restCube(): void {
    this.leftCube();
    this.rightCube();
  }
}

function createModalHTML(modalId: string, algorithm: string, caseName: string, parity: string, speed: number): string {
  const title = caseName && parity ? `${caseName} (${parity})` : 'Algorithm Viewer';
  return `
    <div id="${modalId}" class="modal active sq1-three-modal">
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <div class="modal-title">${escapeHTML(title)}</div>
            <div class="sq1-three-subtitle">${escapeHTML(algorithm)}</div>
          </div>
          <button class="close-btn" id="${modalId}-close">×</button>
        </div>
        <div class="sq1-three-stage" id="${modalId}-stage"></div>
        <div class="sq1-three-alg" id="${modalId}-alg"></div>
        <div class="sq1-three-controls">
          <button class="control-btn" id="${modalId}-reset" title="Reset"><img src="res/anim/first.svg" alt="Reset"></button>
          <button class="control-btn" id="${modalId}-prev" title="Previous"><img src="res/anim/prev.svg" alt="Previous"></button>
          <button class="control-btn" id="${modalId}-play" title="Play"><img src="res/anim/play.svg" alt="Play"></button>
          <button class="control-btn" id="${modalId}-pause" title="Pause"><img src="res/anim/pause.svg" alt="Pause"></button>
          <button class="control-btn" id="${modalId}-next" title="Next"><img src="res/anim/next.svg" alt="Next"></button>
          <label class="sq1-speed">Speed <input id="${modalId}-speed" type="range" min="0.4" max="3" step="0.1" value="${speed}"></label>
          <span class="sq1-status" id="${modalId}-status">idle</span>
        </div>
      </div>
    </div>
  `;
}

function ensureStyles(): void {
  if (document.getElementById('sq1-three-viewer-styles')) return;
  const style = document.createElement('style');
  style.id = 'sq1-three-viewer-styles';
  style.textContent = `
    .sq1-three-modal .modal-content {
      max-width: min(920px, calc(100vw - 24px));
      width: min(920px, calc(100vw - 24px));
      max-height: min(860px, calc(100vh - 24px));
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .sq1-three-subtitle {
      margin-top: 3px;
      color: var(--text-muted);
      font: 12px/1.4 Consolas, Menlo, monospace;
      max-width: min(720px, calc(100vw - 110px));
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sq1-three-stage {
      height: clamp(320px, 58vh, 560px);
      background: radial-gradient(circle at 50% 48%, var(--surface2), var(--background));
      border-top: 1px solid var(--surface-border);
      border-bottom: 1px solid var(--surface-border);
      touch-action: none;
    }
    .sq1-three-canvas {
      width: 100%;
      height: 100%;
      display: block;
      cursor: grab;
    }
    .sq1-three-canvas:active { cursor: grabbing; }
    .sq1-three-alg {
      padding: 12px 16px 6px;
      min-height: 46px;
      font: 14px/1.8 Consolas, Menlo, monospace;
      color: var(--text-primary);
      overflow-x: auto;
      white-space: nowrap;
    }
    .sq1-token {
      display: inline-block;
      padding: 0 4px;
      border-radius: 4px;
      color: var(--text-secondary);
    }
    .sq1-token.done { color: var(--text-muted); opacity: 0.7; }
    .sq1-token.current { background: var(--step-highlight-bg); color: var(--accent); }
    .sq1-three-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px 14px;
      flex-wrap: wrap;
    }
    .sq1-three-controls .control-btn img {
      width: 16px;
      height: 16px;
    }
    .sq1-speed {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-secondary);
      font-size: 13px;
    }
    .sq1-speed input { width: 110px; accent-color: var(--accent); }
    .sq1-status {
      min-width: 78px;
      color: var(--text-muted);
      font-size: 13px;
      font-variant-numeric: tabular-nums;
      text-align: right;
    }
    @media (max-width: 570px) {
      .sq1-three-stage { height: 360px; }
      .sq1-speed { width: 100%; margin-left: 0; }
      .sq1-status { margin-left: auto; }
    }
  `;
  document.head.appendChild(style);
}

export function openAnimateAlgModal(algorithm = '', caseName = '', computedParity = ''): void {
  const alg = algorithm || '(0,0)';
  const tokens = parseAlgorithm(alg);
  const presetTokens = parseAlgorithm(invertScramble(alg));
  let parity = computedParity;
  if (!parity && algorithm && algorithm !== 'Done!') {
    try {
      parity = getParityText(
        invertScramble(algorithm),
        {
          topColor: colorScheme.topColor,
          bottomColor: colorScheme.bottomColor,
          frontColor: colorScheme.frontColor,
          rightColor: colorScheme.rightColor,
          backColor: colorScheme.backColor,
          leftColor: colorScheme.leftColor,
        },
        cornerStickerMode,
      ).toLowerCase();
    } catch {
      parity = '';
    }
  }

  ensureStyles();
  const modalId = `sq1-three-modal-${Date.now()}`;
  const speed = Number(localStorage.getItem('sq1ThreeAnimSpeed') || '1') || 1;
  document.body.insertAdjacentHTML('beforeend', createModalHTML(modalId, alg, caseName, parity, speed));
  document.body.classList.add('modal-open');

  const modal = document.getElementById(modalId)!;
  const host = document.getElementById(`${modalId}-stage`)!;
  const status = document.getElementById(`${modalId}-status`)!;
  const algEl = document.getElementById(`${modalId}-alg`)!;
  const viewer = new Square1ThreeViewer(host, tokens, presetTokens, status, algEl);
  viewer.setSpeed(speed);

  const close = () => {
    closeModalWithHistory(() => {
      viewer.dispose();
      modal.remove();
      document.body.classList.remove('modal-open');
    });
  };
  document.getElementById(`${modalId}-close`)!.onclick = close;
  modal.onclick = (event) => {
    if (event.target === modal) close();
  };
  document.getElementById(`${modalId}-play`)!.onclick = () => viewer.play();
  document.getElementById(`${modalId}-pause`)!.onclick = () => viewer.pause();
  document.getElementById(`${modalId}-reset`)!.onclick = () => viewer.reset();
  document.getElementById(`${modalId}-prev`)!.onclick = () => viewer.previous();
  document.getElementById(`${modalId}-next`)!.onclick = () => viewer.next();
  (document.getElementById(`${modalId}-speed`) as HTMLInputElement).oninput = (event) => {
    viewer.setSpeed(Number((event.target as HTMLInputElement).value));
  };
  pushModalState(modalId, close);
}

export const Square1AlgorithmViewer = {
  open: openAnimateAlgModal,
  parseAlgorithm,
};

export function installAnimateAlgShims(): void {
  const w = window as unknown as Record<string, unknown>;
  w.Square1AlgorithmViewer = Square1AlgorithmViewer;
  w.openAnimateAlgModal = openAnimateAlgModal;
}
