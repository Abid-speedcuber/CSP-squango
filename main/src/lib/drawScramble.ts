/**
 * Square-1 Scramble Visualizer — public API delegating to the modular
 * style system in `./drawScrambleCore`. Pure SVG generation: no DOM.
 */

import {
  applyScramble,
  invertScramble,
  shapeIndexToHex,
  stateToHex,
} from './cube';
import { renderSquare1SVG } from './drawScrambleCore';

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── Color scheme mapping ─────────────────────────────────────────────────────
// Map the legacy DrawColorScheme slot names onto the core's color slots.
// Only explicitly-provided colors are forwarded so core defaults fill the rest.
function toCoreColorScheme(colors: Partial<DrawColorScheme>): Record<string, string> {
  const mapped: Record<string, string> = {};
  if (colors.topColor !== undefined) mapped.top = colors.topColor;
  if (colors.bottomColor !== undefined) mapped.bottom = colors.bottomColor;
  if (colors.frontColor !== undefined) mapped.front = colors.frontColor;
  if (colors.rightColor !== undefined) mapped.right = colors.rightColor;
  if (colors.backColor !== undefined) mapped.back = colors.backColor;
  if (colors.leftColor !== undefined) mapped.left = colors.leftColor;
  if (colors.dividerColor !== undefined) mapped['slice-indicator'] = colors.dividerColor;
  return mapped;
}

function errorDiv(message: string): string {
  return `<div style="color: #e53e3e; font-family: monospace; padding: 1rem;">${message}</div>`;
}

// ── Public API (the four magical functions) ──────────────────────────────────

/** From a 25-character hex code like "6e0cc804a2a6|0e8c64ee20c4". */
export function visualizeFromHex(
  hexCode: string,
  size = 200,
  colors: Partial<DrawColorScheme> = {},
  ringDistance = 5,
): string {
  return renderSquare1SVG(hexCode, {
    size,
    ringDistance,
    colorScheme: toCoreColorScheme(colors),
  });
}

/** From a scramble notation like "(1,0) / (3,3) / (1,0) / ...". */
export function visualizeFromScramble(
  scramble: string,
  size = 200,
  colors: Partial<DrawColorScheme> = {},
  ringDistance = 5,
): string {
  const cubeState = applyScramble(scramble);
  const hexCode = stateToHex(cubeState);

  if (hexCode.startsWith('Error:')) {
    return errorDiv(hexCode);
  }

  return visualizeFromHex(hexCode, size, colors, ringDistance);
}

/** From a solution notation (inverted to show the scrambled state). */
export function visualizeFromSolution(
  solution: string,
  size = 200,
  colors: Partial<DrawColorScheme> = {},
  ringDistance = 5,
): string {
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
  _strokeWidth = 2,
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
      return errorDiv(hexCode);
    }
  } else {
    return errorDiv('Error: Invalid input type');
  }

  return renderSquare1SVG(hexCode, {
    size,
    ringDistance,
    showSideColors: false,
    showSlice: true,
    colorScheme: {
      top: cornerFill,
      bottom: cornerFill,
      front: edgeFill,
      right: edgeFill,
      back: edgeFill,
      left: edgeFill,
      border: '#333333',
    },
  });
}
