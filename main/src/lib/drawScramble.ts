/**
 * Square-1 Scramble Visualizer — ported 1:1 from legacy `js/tools/draw-scramble.js`.
 * Pure SVG generation: no DOM, no window globals (cube primitives come from ./cube).
 */

import {
  applyScramble,
  invertScramble,
  shapeIndexToHex,
  stateToHex,
} from './cube';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Slot {
  type: 'corner' | 'half-corner' | 'edge';
  startLetter: number;
  lettersCount: number;
  label: string;
}

export interface DrawColorScheme {
  topColor: string;
  bottomColor: string;
  frontColor: string;
  rightColor: string;
  backColor: string;
  leftColor: string;
  dividerColor: string;
  circleColor: string;
}

interface Point {
  x: number;
  y: number;
}

const DEFAULT_DRAW_COLORS: DrawColorScheme = {
  topColor: '#000000',
  bottomColor: '#FFFFFF',
  frontColor: '#CC0000',
  rightColor: '#00AA00',
  backColor: '#FF8C00',
  leftColor: '#0066CC',
  dividerColor: '#7a0000',
  circleColor: 'transparent',
};

// ── Shape building ────────────────────────────────────────────────────────────
function buildClusters(shapeArray: number[]): Slot[] {
  const slots: Slot[] = [];
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWX'.split('');

  function processLayer(startIdx: number, endIdx: number): void {
    let i = startIdx;
    while (i < endIdx) {
      const isThisACorner = shapeArray[i] === 1;

      if (isThisACorner) {
        const nextIdx = (i - startIdx + 1) % 12 + startIdx;
        if (nextIdx < endIdx && shapeArray[nextIdx] === 1) {
          slots.push({
            type: 'corner',
            startLetter: i,
            lettersCount: 2,
            label: letters[i] + letters[nextIdx],
          });
          i += 2;
        } else {
          slots.push({
            type: 'half-corner',
            startLetter: i,
            lettersCount: 1,
            label: letters[i],
          });
          i += 1;
        }
      } else {
        slots.push({
          type: 'edge',
          startLetter: i,
          lettersCount: 1,
          label: letters[i],
        });
        i += 1;
      }
    }
  }

  processLayer(0, 12);
  processLayer(12, 24);

  return slots;
}

function parseAssignments(hexScramble: string, slotsList: Slot[]): Record<string, string> {
  const assignments: Record<string, string> = {};
  for (let i = 0; i < slotsList.length; i++) {
    const slot = slotsList[i];
    const letterIndex = slot.startLetter;

    const scrambleIdx = letterIndex < 12 ? letterIndex : 13 + (letterIndex - 12);

    assignments[slot.label] = hexScramble[scrambleIdx];
  }

  return assignments;
}

// ── Geometry helpers ──────────────────────────────────────────────────────────
function polarToCartesian(centerX: number, centerY: number, radius: number, angleDegrees: number): Point {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleRadians),
    y: centerY - radius * Math.sin(angleRadians),
  };
}

function pointsToSVG(pointsArray: Point[]): string {
  return pointsArray.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
}

function lerpPoints(pointA: Point, pointB: Point, interpolationAmount: number): Point {
  return {
    x: pointA.x + (pointB.x - pointA.x) * interpolationAmount,
    y: pointA.y + (pointB.y - pointA.y) * interpolationAmount,
  };
}

function getSlotAngle(slot: Slot, angleArray: number[]): number {
  const angles: number[] = [];
  for (let k = 0; k < slot.lettersCount; k++) {
    const globalIdx = slot.startLetter + k;
    const localIdx = globalIdx >= 12 ? globalIdx - 12 : globalIdx;
    angles.push(angleArray[localIdx]);
  }
  return angles.reduce((sum, angle) => sum + angle, 0) / angles.length;
}

// ── Color mapping ─────────────────────────────────────────────────────────────
function getEdgeColor(hexChar: string, colorScheme: DrawColorScheme): { inner: string; outer: string } {
  const { topColor, bottomColor, frontColor, rightColor, backColor, leftColor } = colorScheme;

  switch (hexChar.toLowerCase()) {
    case '0': return { inner: topColor, outer: backColor };
    case '2': return { inner: topColor, outer: leftColor };
    case '4': return { inner: topColor, outer: frontColor };
    case '6': return { inner: topColor, outer: rightColor };
    case '8': return { inner: bottomColor, outer: rightColor };
    case 'a': return { inner: bottomColor, outer: frontColor };
    case 'c': return { inner: bottomColor, outer: leftColor };
    case 'e': return { inner: bottomColor, outer: backColor };
    case 'E': return { inner: '#888888', outer: '#888888' };
    case 'R': return { inner: 'transparent', outer: 'transparent' };
    default: return { inner: '#4ecdc4', outer: '#4ecdc4' };
  }
}

function getCornerColorLetters(hexChar: string): { top: string; left: string; right: string } {
  switch ((hexChar || '').toLowerCase()) {
    case '1': return { top: 'y', left: 'b', right: 'o' };
    case '3': return { top: 'y', left: 'r', right: 'b' };
    case '5': return { top: 'y', left: 'g', right: 'r' };
    case '7': return { top: 'y', left: 'o', right: 'g' };
    case '9': return { top: 'w', left: 'g', right: 'o' };
    case 'b': return { top: 'w', left: 'r', right: 'g' };
    case 'd': return { top: 'w', left: 'b', right: 'r' };
    case 'f': return { top: 'w', left: 'o', right: 'b' };
    case 'C': return { top: '#888888', left: '#888888', right: '#888888' };
    default: return { top: '#4ecdc4', left: '#4ecdc4', right: '#4ecdc4' };
  }
}

function colorLetterToHex(colorLetter: string, colorScheme: DrawColorScheme): string {
  if (!colorLetter) return '#cccccc';
  const { topColor, bottomColor, frontColor, rightColor, backColor, leftColor } = colorScheme;

  switch (colorLetter.toLowerCase()) {
    case 'y': return topColor;
    case 'w': return bottomColor;
    case 'o': return backColor;
    case 'b': return leftColor;
    case 'r': return frontColor;
    case 'g': return rightColor;
    default: return '#cccccc';
  }
}

function getCornerColors(hexChar: string, colorScheme: DrawColorScheme): { top: string; left: string; right: string } {
  const colorTriplet = getCornerColorLetters(hexChar);
  const leftColor = colorLetterToHex(colorTriplet.left, colorScheme);
  const rightColor = colorLetterToHex(colorTriplet.right, colorScheme);
  const topColor = colorLetterToHex(colorTriplet.top, colorScheme);

  return { top: topColor, left: leftColor, right: rightColor };
}

function getHalfCornerColor(): string {
  return 'fill="#ff9999"';
}

// ── SVG generation for individual pieces ──────────────────────────────────────
function createPieceSVG(
  slot: Slot,
  pieceHex: string,
  centerX: number,
  centerY: number,
  centerAngle: number,
  radiusInner: number,
  radiusOuter: number,
  radiusApex: number,
  strokeThin: number,
  strokeMedium: number,
  colorScheme: DrawColorScheme,
): string {
  let svgMarkup = '';
  const halfAngle = slot.type === 'corner' ? 30 : 15;

  if (slot.type === 'edge') {
    const pointInner = polarToCartesian(centerX, centerY, radiusInner, centerAngle);
    const pointA = polarToCartesian(centerX, centerY, radiusOuter, centerAngle - halfAngle);
    const pointB = polarToCartesian(centerX, centerY, radiusOuter, centerAngle + halfAngle);

    const midRadius = radiusInner + (radiusOuter - radiusInner) * 0.8;
    const pointMidA = polarToCartesian(centerX, centerY, midRadius, centerAngle - halfAngle);
    const pointMidB = polarToCartesian(centerX, centerY, midRadius, centerAngle + halfAngle);

    const edgeColors = getEdgeColor(pieceHex, colorScheme);

    svgMarkup += `<polygon points="${pointsToSVG([pointMidA, pointA, pointB, pointMidB])}" fill="${edgeColors.outer}" stroke="#333" stroke-width="${strokeMedium}"/>`;
    svgMarkup += `<polygon points="${pointsToSVG([pointInner, pointMidA, pointMidB])}" fill="${edgeColors.inner}" stroke="#333" stroke-width="${strokeThin}"/>`;
  } else if (slot.type === 'corner') {
    const pointInner = polarToCartesian(centerX, centerY, radiusInner, centerAngle);
    const pointOuterRight = polarToCartesian(centerX, centerY, radiusOuter, centerAngle - halfAngle);
    const pointApex = polarToCartesian(centerX, centerY, radiusApex, centerAngle);
    const pointOuterLeft = polarToCartesian(centerX, centerY, radiusOuter, centerAngle + halfAngle);

    const scaleFactor = 0.8;
    const pointSmallLeft = lerpPoints(pointInner, pointOuterLeft, scaleFactor);
    const pointSmallRight = lerpPoints(pointInner, pointOuterRight, scaleFactor);
    const pointSmallBottom = lerpPoints(pointInner, pointApex, scaleFactor);

    const colors = getCornerColors(pieceHex, colorScheme);

    svgMarkup += `<polygon points="${pointsToSVG([pointInner, pointOuterLeft, pointApex, pointSmallBottom, pointSmallLeft])}" fill="${colors.left}" stroke="#333" stroke-width="${strokeMedium}"/>`;
    svgMarkup += `<polygon points="${pointsToSVG([pointInner, pointSmallRight, pointSmallBottom, pointApex, pointOuterRight])}" fill="${colors.right}" stroke="#333" stroke-width="${strokeMedium}"/>`;
    svgMarkup += `<polygon points="${pointsToSVG([pointInner, pointSmallLeft, pointSmallBottom, pointSmallRight])}" fill="${colors.top}" stroke="#333" stroke-width="${strokeThin}"/>`;
    svgMarkup += `<polygon points="${pointsToSVG([pointInner, pointOuterLeft, pointApex, pointOuterRight])}" fill="none" stroke="#333" stroke-width="${strokeMedium}"/>`;
    svgMarkup += `<line x1="${pointApex.x.toFixed(2)}" y1="${pointApex.y.toFixed(2)}" x2="${pointSmallBottom.x.toFixed(2)}" y2="${pointSmallBottom.y.toFixed(2)}" stroke="#333" stroke-width="${strokeMedium}" stroke-linecap="round" class="corner-detail"/>`;
  } else if (slot.type === 'half-corner') {
    const halfInnerAngle = 15;
    const pointInner = polarToCartesian(centerX, centerY, radiusInner, centerAngle);
    const pointOuterRight = polarToCartesian(centerX, centerY, radiusOuter, centerAngle - halfInnerAngle);
    const pointApex = polarToCartesian(centerX, centerY, radiusApex, centerAngle);
    const pointOuterLeft = polarToCartesian(centerX, centerY, radiusOuter, centerAngle + halfInnerAngle);

    const fillAttribute = getHalfCornerColor();
    svgMarkup += `<polygon points="${pointsToSVG([pointInner, pointOuterRight, pointApex, pointOuterLeft])}" ${fillAttribute} stroke="#333" stroke-width="${strokeThin}"/>`;
  }

  return svgMarkup;
}

// ── Shape layout shared by full + outline renderers ───────────────────────────
function getShapeLayout(hexScrambleCode: string, desiredSize: number, ringDistance: number) {
  const shapeArray = new Array<number>(24);
  let scrambleIdx = 0;

  for (let i = 0; i < 12; i++) {
    if (scrambleIdx === 12) scrambleIdx++;
    const piece = hexScrambleCode[scrambleIdx];
    const isCorner = ['1', '3', '5', '7', '9', 'b', 'd', 'f'].includes(piece.toLowerCase());
    shapeArray[i] = isCorner ? 1 : 0;
    scrambleIdx++;
  }

  scrambleIdx = 13;
  for (let i = 12; i < 24; i++) {
    const piece = hexScrambleCode[scrambleIdx];
    const isCorner = ['1', '3', '5', '7', '9', 'b', 'd', 'f'].includes(piece.toLowerCase());
    shapeArray[i] = isCorner ? 1 : 0;
    scrambleIdx++;
  }

  const slots = buildClusters(shapeArray);

  const svgSize = desiredSize;
  const unit10vh = desiredSize * 0.4;
  const centerX = svgSize / 2;
  const centerY = svgSize / 2;

  const radiusInner = 0;
  const radiusOuter = unit10vh * 0.7;
  const radiusApex = radiusOuter * 1.366025404;
  const ringRadius = radiusOuter + unit10vh * 0.4;

  const strokeLine = desiredSize * 0.008;
  const sliceTrim = 0.7;

  const centerToCenterDistance = ringRadius * (2 + ringDistance / 100);
  const marginLeft = centerToCenterDistance - svgSize;

  return {
    slots,
    svgSize,
    unit10vh,
    centerX,
    centerY,
    radiusInner,
    radiusOuter,
    radiusApex,
    ringRadius,
    strokeLine,
    sliceTrim,
    marginLeft,
  };
}

// ── Main SVG generation ───────────────────────────────────────────────────────
function generateFullSVG(
  hexScrambleCode: string,
  desiredSize: number,
  colorScheme: DrawColorScheme,
  ringDistance = 5,
): string {
  if (hexScrambleCode.length !== 25) {
    throw new Error('Invalid scramble format - needs 25 characters!');
  }

  const layout = getShapeLayout(hexScrambleCode, desiredSize, ringDistance);
  const { slots, svgSize, centerX, centerY, radiusInner, radiusOuter, radiusApex, ringRadius } = layout;
  const pieceAssignments = parseAssignments(hexScrambleCode, slots);

  const strokeThin = desiredSize * 0.003;
  const strokeMedium = desiredSize * 0.004;

  let htmlOutput = '<div style="display: flex; align-items: center;">';

  // LEFT SVG (top layer)
  htmlOutput += `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">`;
  htmlOutput += `<circle cx="${centerX}" cy="${centerY}" r="${ringRadius}" fill="${colorScheme.circleColor}" stroke="rgba(0,0,0,0.08)" stroke-width="0"/>`;

  const linePoint1Left = polarToCartesian(centerX, centerY, (ringRadius + 6) * layout.sliceTrim, 75);
  const linePoint2Left = polarToCartesian(centerX, centerY, (ringRadius + 6) * layout.sliceTrim, 255);
  htmlOutput += `<line x1="${linePoint1Left.x}" y1="${linePoint1Left.y}" x2="${linePoint2Left.x}" y2="${linePoint2Left.y}" stroke="${colorScheme.dividerColor}" stroke-width="${layout.strokeLine}"/>`;
  htmlOutput += `<circle cx="${centerX}" cy="${centerY}" r="${layout.unit10vh * 0.05}" fill="rgba(0,0,0,0.06)"/>`;

  const leftLayerAngles = Array.from({ length: 12 }, (_, j) => 90 + j * 30);

  slots.forEach((slot) => {
    if (slot.startLetter < 12) {
      const piece = pieceAssignments[slot.label];
      const angle = getSlotAngle(slot, leftLayerAngles);
      htmlOutput += createPieceSVG(slot, piece, centerX, centerY, angle, radiusInner, radiusOuter, radiusApex, strokeThin, strokeMedium, colorScheme);
    }
  });

  htmlOutput += '</svg>';

  // RIGHT SVG (bottom layer)
  htmlOutput += `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" style="margin-left: ${layout.marginLeft}px;">`;
  htmlOutput += `<circle cx="${centerX}" cy="${centerY}" r="${ringRadius}" fill="${colorScheme.circleColor}" stroke="rgba(0,0,0,0.08)" stroke-width="0"/>`;

  const linePoint1Right = polarToCartesian(centerX, centerY, (ringRadius + 6) * layout.sliceTrim, 105);
  const linePoint2Right = polarToCartesian(centerX, centerY, (ringRadius + 6) * layout.sliceTrim, 285);
  htmlOutput += `<line x1="${linePoint1Right.x}" y1="${linePoint1Right.y}" x2="${linePoint2Right.x}" y2="${linePoint2Right.y}" stroke="${colorScheme.dividerColor}" stroke-width="${layout.strokeLine}"/>`;
  htmlOutput += `<circle cx="${centerX}" cy="${centerY}" r="${layout.unit10vh * 0.05}" fill="rgba(0,0,0,0.06)"/>`;

  const rightLayerAngles = Array.from({ length: 12 }, (_, j) => 300 + j * 30);

  slots.forEach((slot) => {
    if (slot.startLetter >= 12) {
      const piece = pieceAssignments[slot.label];
      const angle = getSlotAngle(slot, rightLayerAngles);
      htmlOutput += createPieceSVG(slot, piece, centerX, centerY, angle, radiusInner, radiusOuter, radiusApex, strokeThin, strokeMedium, colorScheme);
    }
  });

  htmlOutput += '</svg></div>';

  return htmlOutput;
}

// ── Cube shape visualizer ─────────────────────────────────────────────────────
function createShapeOutlineSVG(
  slot: Slot,
  centerX: number,
  centerY: number,
  centerAngle: number,
  radiusInner: number,
  radiusOuter: number,
  radiusApex: number,
  edgeFill: string,
  cornerFill: string,
  strokeWidth: number,
): string {
  let svgMarkup = '';
  const halfAngle = slot.type === 'corner' ? 30 : 15;

  if (slot.type === 'edge') {
    const pointInner = polarToCartesian(centerX, centerY, radiusInner, centerAngle);
    const pointA = polarToCartesian(centerX, centerY, radiusOuter, centerAngle - halfAngle);
    const pointB = polarToCartesian(centerX, centerY, radiusOuter, centerAngle + halfAngle);

    svgMarkup += `<polygon points="${pointsToSVG([pointInner, pointA, pointB])}" fill="${edgeFill}" stroke="#333" stroke-width="${strokeWidth}"/>`;
  } else if (slot.type === 'corner') {
    const pointInner = polarToCartesian(centerX, centerY, radiusInner, centerAngle);
    const pointOuterRight = polarToCartesian(centerX, centerY, radiusOuter, centerAngle - halfAngle);
    const pointApex = polarToCartesian(centerX, centerY, radiusApex, centerAngle);
    const pointOuterLeft = polarToCartesian(centerX, centerY, radiusOuter, centerAngle + halfAngle);

    svgMarkup += `<polygon points="${pointsToSVG([pointInner, pointOuterLeft, pointApex, pointOuterRight])}" fill="${cornerFill}" stroke="#333" stroke-width="${strokeWidth}"/>`;
  } else if (slot.type === 'half-corner') {
    const halfInnerAngle = 15;
    const pointInner = polarToCartesian(centerX, centerY, radiusInner, centerAngle);
    const pointOuterRight = polarToCartesian(centerX, centerY, radiusOuter, centerAngle - halfInnerAngle);
    const pointApex = polarToCartesian(centerX, centerY, radiusApex, centerAngle);
    const pointOuterLeft = polarToCartesian(centerX, centerY, radiusOuter, centerAngle + halfInnerAngle);

    svgMarkup += `<polygon points="${pointsToSVG([pointInner, pointOuterRight, pointApex, pointOuterLeft])}" fill="${cornerFill}" stroke="#333" stroke-width="${strokeWidth}"/>`;
  }

  return svgMarkup;
}

function generateShapeSVG(
  hexScrambleCode: string,
  size: number,
  edgeFill: string,
  cornerFill: string,
  strokeWidthBase: number,
  ringDistance = 5,
): string {
  if (hexScrambleCode.length !== 25) {
    throw new Error('Invalid scramble format - needs 25 characters!');
  }

  const layout = getShapeLayout(hexScrambleCode, size, ringDistance);
  const { slots, svgSize, centerX, centerY, radiusInner, radiusOuter, radiusApex, ringRadius } = layout;

  const strokeWidth = (size / 200) * strokeWidthBase;

  let htmlOutput = '<div style="display: flex; align-items: center;">';

  // LEFT SVG (top layer)
  htmlOutput += `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">`;
  htmlOutput += `<circle cx="${centerX}" cy="${centerY}" r="${ringRadius}" fill="transparent" stroke="rgba(0,0,0,0.08)" stroke-width="0"/>`;

  const linePoint1Left = polarToCartesian(centerX, centerY, (ringRadius + 6) * layout.sliceTrim, 75);
  const linePoint2Left = polarToCartesian(centerX, centerY, (ringRadius + 6) * layout.sliceTrim, 255);
  htmlOutput += `<line x1="${linePoint1Left.x}" y1="${linePoint1Left.y}" x2="${linePoint2Left.x}" y2="${linePoint2Left.y}" stroke="#7a0000" stroke-width="${layout.strokeLine}"/>`;
  htmlOutput += `<circle cx="${centerX}" cy="${centerY}" r="${layout.unit10vh * 0.05}" fill="rgba(0,0,0,0.06)"/>`;

  const leftLayerAngles = Array.from({ length: 12 }, (_, j) => 90 + j * 30);

  slots.forEach((slot) => {
    if (slot.startLetter < 12) {
      const angle = getSlotAngle(slot, leftLayerAngles);
      htmlOutput += createShapeOutlineSVG(slot, centerX, centerY, angle, radiusInner, radiusOuter, radiusApex, edgeFill, cornerFill, strokeWidth);
    }
  });

  htmlOutput += '</svg>';

  // RIGHT SVG (bottom layer)
  htmlOutput += `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" style="margin-left: ${layout.marginLeft}px;">`;
  htmlOutput += `<circle cx="${centerX}" cy="${centerY}" r="${ringRadius}" fill="transparent" stroke="rgba(0,0,0,0.08)" stroke-width="0"/>`;

  const linePoint1Right = polarToCartesian(centerX, centerY, (ringRadius + 6) * layout.sliceTrim, 105);
  const linePoint2Right = polarToCartesian(centerX, centerY, (ringRadius + 6) * layout.sliceTrim, 285);
  htmlOutput += `<line x1="${linePoint1Right.x}" y1="${linePoint1Right.y}" x2="${linePoint2Right.x}" y2="${linePoint2Right.y}" stroke="#7a0000" stroke-width="${layout.strokeLine}"/>`;
  htmlOutput += `<circle cx="${centerX}" cy="${centerY}" r="${layout.unit10vh * 0.05}" fill="rgba(0,0,0,0.06)"/>`;

  const rightLayerAngles = Array.from({ length: 12 }, (_, j) => 300 + j * 30);

  slots.forEach((slot) => {
    if (slot.startLetter >= 12) {
      const angle = getSlotAngle(slot, rightLayerAngles);
      htmlOutput += createShapeOutlineSVG(slot, centerX, centerY, angle, radiusInner, radiusOuter, radiusApex, edgeFill, cornerFill, strokeWidth);
    }
  });

  htmlOutput += '</svg></div>';

  return htmlOutput;
}

// ── Public API (the three magical functions) ──────────────────────────────────

/** From a 25-character hex code like "6e0cc804a2a6|0e8c64ee20c4". */
export function visualizeFromHex(hexCode: string, size = 200, colors: Partial<DrawColorScheme> = {}, ringDistance = 5): string {
  const colorScheme: DrawColorScheme = { ...DEFAULT_DRAW_COLORS, ...colors };
  return generateFullSVG(hexCode, size, colorScheme, ringDistance);
}

/** From a scramble notation like "(1,0) / (3,3) / (1,0) / ...". */
export function visualizeFromScramble(scramble: string, size = 200, colors: Partial<DrawColorScheme> = {}, ringDistance = 5): string {
  const colorScheme: DrawColorScheme = { ...DEFAULT_DRAW_COLORS, ...colors };

  const cubeState = applyScramble(scramble);
  const hexCode = stateToHex(cubeState);

  if (hexCode.startsWith('Error:')) {
    return `<div style="color: #e53e3e; font-family: monospace; padding: 1rem;">${hexCode}</div>`;
  }

  return generateFullSVG(hexCode, size, colorScheme, ringDistance);
}

/** From a solution notation (inverted to show the scrambled state). */
export function visualizeFromSolution(solution: string, size = 200, colors: Partial<DrawColorScheme> = {}, ringDistance = 5): string {
  const invertedScramble = invertScramble(solution);
  return visualizeFromScramble(invertedScramble, size, colors, ringDistance);
}

/**
 * Visualize cube shape outlines only.
 * Input can be a shape index (number), a hex code (string containing '|'),
 * or a scramble notation (string).
 */
export function visualizeShapes(
  input: number | string,
  size = 200,
  edgeFill = 'transparent',
  cornerFill = 'transparent',
  strokeWidth = 2,
  ringDistance = 5,
): string {
  let hexCode: string;

  if (typeof input === 'number') {
    hexCode = shapeIndexToHex(input);
  } else if (typeof input === 'string' && input.includes('|')) {
    hexCode = input;
  } else if (typeof input === 'string') {
    const cubeState = applyScramble(input);
    hexCode = stateToHex(cubeState);

    if (hexCode.startsWith('Error:')) {
      return `<div style="color: #e53e3e; font-family: monospace; padding: 1rem;">${hexCode}</div>`;
    }
  } else {
    return `<div style="color: #e53e3e; font-family: monospace; padding: 1rem;">Error: Invalid input type</div>`;
  }

  return generateShapeSVG(hexCode, size, edgeFill, cornerFill, strokeWidth, ringDistance);
}
