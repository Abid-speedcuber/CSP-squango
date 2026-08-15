/**
 * Homepage case-shape SVG generation.
 *
 * Replaces the hardcoded SVGs (previously in shapeSvgs.json) with images
 * generated at runtime from the canonical expanded layer shapes, marked with
 * the live parity-tracer tracing-start piece. Rendered with the draw-scramble
 * style system (Abid, layer ratio fixed at 1), compressed with svgo and cached
 * in localStorage. Regenerated whenever the homepage image settings change.
 */

import { optimize } from 'svgo/browser';
import { renderExpandedLayerSVG, type Square1RenderOptions } from './drawScrambleCore';
import { getMarkedLayerExpanded } from './expandedShape';
import { LAYER_EXPANDED_SHAPES } from '../data/expandedShapes';
import { CASES } from '../data/cases';

export interface HomepageImageSettings {
  /** Tracing-start piece color (the '2'/'3' marked slots). */
  specialPieceColor: string;
  /** Stroke color for piece outlines. Empty string = follow the theme. */
  borderColor: string;
  /** Slice indicator color. Empty string = follow the theme. */
  sliceColor: string;
  strokeWidthOuter: number;
  sliceStrokeWidth: number;
  strokeWidthInner: number;
  topColor: string;
  bottomColor: string;
  frontColor: string;
  rightColor: string;
  backColor: string;
  leftColor: string;
}

export const DEFAULT_HOMEPAGE_IMAGE_SETTINGS: HomepageImageSettings = {
  specialPieceColor: '#FFD700',
  borderColor: '',
  sliceColor: '',
  strokeWidthOuter: 0.012,
  sliceStrokeWidth: 0.012,
  strokeWidthInner: 0.01,
  topColor: 'transparent',
  bottomColor: 'transparent',
  frontColor: 'transparent',
  rightColor: 'transparent',
  backColor: 'transparent',
  leftColor: 'transparent',
};

const SETTINGS_STORAGE_KEY = 'sq1-homepage-image-settings';
const SVG_CACHE_KEY = 'sq1-homepage-svg-cache';
const SVG_CACHE_HASH_KEY = 'sq1-homepage-svg-cache-settings';

export function isDarkTheme(): boolean {
  return (
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'dark'
  );
}

export function loadHomepageImageSettings(): HomepageImageSettings {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_HOMEPAGE_IMAGE_SETTINGS };
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) return { ...DEFAULT_HOMEPAGE_IMAGE_SETTINGS, ...JSON.parse(stored) };
  } catch {
    // ignore malformed stored settings
  }
  return { ...DEFAULT_HOMEPAGE_IMAGE_SETTINGS };
}

export function saveHomepageImageSettings(settings: HomepageImageSettings): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function resetHomepageImageSettings(): HomepageImageSettings {
  const defaults = { ...DEFAULT_HOMEPAGE_IMAGE_SETTINGS };
  saveHomepageImageSettings(defaults);
  return defaults;
}

function resolveStrokeColor(color: string): string {
  if (color && color.trim() !== '') return color;
  return isDarkTheme() ? '#c0c0c0' : '#000000';
}

export function renderLayerShapeSVG(
  layerName: string,
  settings: HomepageImageSettings = DEFAULT_HOMEPAGE_IMAGE_SETTINGS,
): string | null {
  const marked = getMarkedLayerExpanded(layerName);
  if (!marked) return null;
  const border = resolveStrokeColor(settings.borderColor);
  const slice = resolveStrokeColor(settings.sliceColor);

  const options: Square1RenderOptions = {
    size: 200,
    showSlice: true,
    styleSettings: {
      layerRatio: 1,
      strokeWidthOuter: settings.strokeWidthOuter,
      sliceStrokeWidth: settings.sliceStrokeWidth,
      strokeWidthInner: settings.strokeWidthInner,
    },
    colorScheme: {
      top: settings.topColor,
      bottom: settings.bottomColor,
      front: settings.frontColor,
      right: settings.rightColor,
      back: settings.backColor,
      left: settings.leftColor,
      border,
      'slice-indicator': slice,
    },
    piecesColors: {
      edgeColors: {
        '0': { inner: 'top', outer: 'back' },
        '2': { inner: settings.specialPieceColor, outer: settings.specialPieceColor },
      },
      cornerColors: {
        '1': { top: 'top', left: 'back', right: 'left' },
        '3': {
          top: settings.specialPieceColor,
          left: settings.specialPieceColor,
          right: settings.specialPieceColor,
        },
      },
      sliceColors: { top: 'top', bottom: 'bottom' },
    },
  };
  return renderExpandedLayerSVG(marked, options);
}

export function generateAllLayerShapes(settings: HomepageImageSettings): Record<string, string> {
  const out: Record<string, string> = {};
  for (const layerName of Object.keys(LAYER_EXPANDED_SHAPES)) {
    const svg = renderLayerShapeSVG(layerName, settings);
    if (svg) out[layerName] = svg;
  }
  return out;
}

/**
 * Strip the mask machinery the style system adds around invisible transparent
 * stickers. With transparent fills the stickers produce no pixels, so the
 * masks (which only exist to keep neighbor borders off the sticker fills) are
 * pure overhead. Only the strokes, the slice line and the special/golden
 * piece remain.
 */
function stripInvisibleOverhead(svg: string): string {
  let out = svg.replace(/<defs>[\s\S]*?<\/defs>/g, '');
  out = out.replace(/\smask="url\(#[^"]*\)"/g, '');
  out = out.replace(
    /<(polygon|polyline|path|line|rect|circle)(?=[^>]*\sfill="(?:transparent|none)")(?![^>]*\bstroke=)[^>]*\/>/g,
    '',
  );
  return out;
}

export function compressShapeSVGs(shapes: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, svg] of Object.entries(shapes)) {
    try {
      const result = optimize(stripInvisibleOverhead(svg), {
        multipass: true,
        floatPrecision: 2,
        plugins: ['preset-default'],
      });
      out[name] = result.data;
    } catch {
      out[name] = svg;
    }
  }
  return out;
}

function settingsHash(settings: HomepageImageSettings): string {
  return JSON.stringify({ ...settings, __dark: isDarkTheme() });
}

/**
 * Load the cached homepage SVGs if they match the current settings + theme,
 * otherwise generate + compress + cache them.
 */
export function getHomepageShapeSVGs(
  settings: HomepageImageSettings,
  svgData: Record<string, string>,
): void {
  if (typeof localStorage === 'undefined') return;
  const currentHash = settingsHash(settings);
  try {
    const storedHash = localStorage.getItem(SVG_CACHE_HASH_KEY);
    if (storedHash === currentHash) {
      const cached = localStorage.getItem(SVG_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as Record<string, string>;
        if (parsed && Object.keys(parsed).length === Object.keys(LAYER_EXPANDED_SHAPES).length) {
          Object.keys(svgData).forEach((key) => delete svgData[key]);
          Object.assign(svgData, parsed);
          return;
        }
      }
    }
  } catch {
    // fall through to regeneration
  }
  const shapes = compressShapeSVGs(generateAllLayerShapes(settings));
  try {
    localStorage.setItem(SVG_CACHE_KEY, JSON.stringify(shapes));
    localStorage.setItem(SVG_CACHE_HASH_KEY, currentHash);
  } catch {
    // cache may be full — keep the in-memory result regardless
  }
  Object.keys(svgData).forEach((key) => delete svgData[key]);
  Object.assign(svgData, shapes);
}

/**
 * Live-update the SVGs already rendered inside the case cards, without a full
 * grid re-render. The cards read `svgData` at render time (see cardHTML.ts), so
 * after regeneration the DOM needs this targeted patch.
 */
export function applyHomepageSVGsLive(svgData: Record<string, string>): void {
  if (typeof document === 'undefined') return;
  const shapeByCase = new Map<string, { top: string; bottom: string }>();
  for (const c of CASES) shapeByCase.set(c.name, { top: c.top, bottom: c.bottom });
  document.querySelectorAll('.card[data-case-name]').forEach((card) => {
    const name = card.getAttribute('data-case-name');
    if (!name) return;
    const shapes = shapeByCase.get(name);
    if (!shapes) return;
    const container = card.querySelector('.card-images');
    if (!container) return;
    const divs = container.children;
    if (divs.length >= 2) {
      divs[0].innerHTML = svgData[shapes.top] || '';
      divs[1].innerHTML = svgData[shapes.bottom] || '';
    }
  });
}
