/**
 * Homepage case-shape SVG generation.
 *
 * Replaces the hardcoded SVGs (previously in shapeSvgs.json) with images
 * generated at runtime from the canonical expanded layer shapes, marked with
 * the live parity-tracer tracing-start piece. Rendered with the draw-scramble
 * style system (Abid, layer ratio fixed at 1), compressed with svgo and cached
 * in localStorage. Regenerated whenever the homepage image settings change.
 */

import { createConfiguredCore, renderExpandedLayerSVG, type Square1RenderOptions } from './drawScrambleCore';
import { getMarkedLayerExpanded } from './expandedShape';
import { LAYER_EXPANDED_SHAPES } from '../data/expandedShapes';
import { CASES } from '../data/cases';
import type { AlgCase } from '../data/types';

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
const SVG_CACHE_HASH_KEY = 'sq1-homepage-svg-cache-settings';
const SVG_CACHE_ITEM_PREFIX = 'sq1-homepage-svg-cache-item';
const SVG_CACHE_VERSION = 5;
const HOMEPAGE_SLICE_STROKE_SCALE = 0.22;
const HOMEPAGE_SLICE_RADIUS_SCALE = 0.9;

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
  layer: 'top' | 'bottom' = 'top',
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
      sliceStrokeWidth: settings.sliceStrokeWidth * HOMEPAGE_SLICE_STROKE_SCALE,
      strokeWidthInner: settings.strokeWidthInner,
      sliceRadiusScale: HOMEPAGE_SLICE_RADIUS_SCALE,
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
    layer,
  };
  return renderExpandedLayerSVG(marked, options);
}

export function homepageShapeSVGKey(layer: 'top' | 'bottom', layerName: string): string {
  return `${layer}:${layerName}`;
}

export interface HomepageShapeSVGCachePayload {
  hash: string;
  shapes: Record<string, string>;
}

function splitHomepageShapeSVGKey(key: string): { layer: 'top' | 'bottom'; layerName: string } | null {
  const separator = key.indexOf(':');
  if (separator === -1) return null;
  const layer = key.slice(0, separator);
  if (layer !== 'top' && layer !== 'bottom') return null;
  return { layer, layerName: key.slice(separator + 1) };
}

function createHomepageCoreOptions(settings: HomepageImageSettings): Square1RenderOptions {
  const border = resolveStrokeColor(settings.borderColor);
  const slice = resolveStrokeColor(settings.sliceColor);
  return {
    size: 200,
    showSlice: true,
    styleSettings: {
      layerRatio: 1,
      strokeWidthOuter: settings.strokeWidthOuter,
      sliceStrokeWidth: settings.sliceStrokeWidth * HOMEPAGE_SLICE_STROKE_SCALE,
      strokeWidthInner: settings.strokeWidthInner,
      sliceRadiusScale: HOMEPAGE_SLICE_RADIUS_SCALE,
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
}

function renderHomepageShapeSVGWithCore(
  core: ReturnType<typeof createConfiguredCore>,
  options: Square1RenderOptions,
  key: string,
): string | null {
  const parsed = splitHomepageShapeSVGKey(key);
  if (!parsed) return null;
  const marked = getMarkedLayerExpanded(parsed.layerName);
  if (!marked) return null;
  return core.getExpandedLayerSVG(
    marked,
    options.size,
    options.muted,
    options.showSlice,
    parsed.layer,
    options.exportPad,
  );
}

function cacheItemStorageKey(hash: string, key: string): string {
  return `${SVG_CACHE_ITEM_PREFIX}:${hash}:${key}`;
}

function yieldToBrowser(timeout = 500): Promise<void> {
  if (typeof window !== 'undefined') {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
    };
    if (w.requestIdleCallback) {
      return new Promise((resolve) => w.requestIdleCallback?.(() => resolve(), { timeout }));
    }
  }
  return new Promise((resolve) => setTimeout(resolve, 32));
}

function scheduleCompressedCacheWrite(settings: HomepageImageSettings, shapes: Record<string, string>): void {
  if (typeof localStorage === 'undefined' || typeof window === 'undefined' || Object.keys(shapes).length === 0) return;
  const hash = settingsHash(settings);
  window.setTimeout(() => {
    void (async () => {
      try {
        await yieldToBrowser(1500);
        const compressed = await compressShapeSVGs(shapes);
        for (const [key, svg] of Object.entries(compressed)) {
          await yieldToBrowser();
          localStorage.setItem(cacheItemStorageKey(hash, key), svg);
        }
        localStorage.setItem(SVG_CACHE_HASH_KEY, hash);
      } catch {
        // Cache storage/import failures should never affect visible cards.
      }
    })();
  }, 2500);
}

function ensureHomepageShapeSVGKeys(
  settings: HomepageImageSettings,
  svgData: Record<string, string>,
  keys: Iterable<string>,
): void {
  const uniqueKeys = Array.from(new Set(keys));
  const hash = settingsHash(settings);
  const missing: string[] = [];

  for (const key of uniqueKeys) {
    if (svgData[key]) continue;
    if (typeof localStorage !== 'undefined') {
      try {
        const cached = localStorage.getItem(cacheItemStorageKey(hash, key));
        if (cached) {
          svgData[key] = cached;
          continue;
        }
      } catch {
        // Fall through to raw generation.
      }
    }
    missing.push(key);
  }

  if (missing.length === 0) return;
  const coreOptions = createHomepageCoreOptions(settings);
  const core = createConfiguredCore(coreOptions);
  const generated: Record<string, string> = {};
  for (const key of missing) {
    const svg = renderHomepageShapeSVGWithCore(core, coreOptions, key);
    if (!svg) continue;
    svgData[key] = svg;
    generated[key] = svg;
  }
  scheduleCompressedCacheWrite(settings, generated);
}

export function ensureHomepageShapeSVGsForCases(
  settings: HomepageImageSettings,
  svgData: Record<string, string>,
  cases: readonly Pick<AlgCase, 'top' | 'bottom'>[],
): void {
  ensureHomepageShapeSVGKeys(
    settings,
    svgData,
    cases.flatMap((item) => [
      homepageShapeSVGKey('top', item.top),
      homepageShapeSVGKey('bottom', item.bottom),
    ]),
  );
}

export function generateAllLayerShapes(settings: HomepageImageSettings): Record<string, string> {
  const out: Record<string, string> = {};
  const keys = Object.keys(LAYER_EXPANDED_SHAPES).flatMap((layerName) => [
    homepageShapeSVGKey('top', layerName),
    homepageShapeSVGKey('bottom', layerName),
  ]);
  ensureHomepageShapeSVGKeys(settings, out, keys);
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

export async function compressShapeSVGs(shapes: Record<string, string>): Promise<Record<string, string>> {
  await yieldToBrowser(1500);
  const { optimize } = await import('svgo/browser');
  const out: Record<string, string> = {};
  for (const [name, svg] of Object.entries(shapes)) {
    await yieldToBrowser();
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
  return JSON.stringify({ ...settings, __dark: isDarkTheme(), __svgCacheVersion: SVG_CACHE_VERSION });
}

export function getHomepageShapeSVGCacheHash(settings: HomepageImageSettings): string {
  return settingsHash(settings);
}

export function seedHomepageShapeSVGs(
  settings: HomepageImageSettings,
  svgData: Record<string, string>,
  payload: HomepageShapeSVGCachePayload,
): boolean {
  const hash = settingsHash(settings);
  if (payload.hash !== hash) return false;
  for (const [key, svg] of Object.entries(payload.shapes)) {
    svgData[key] = svg;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(cacheItemStorageKey(hash, key), svg);
      } catch {
        // Seeding is an optimization only.
      }
    }
  }
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(SVG_CACHE_HASH_KEY, hash);
    } catch {
      // Seeding is an optimization only.
    }
  }
  return true;
}

/**
 * Load compressed homepage SVGs if they match the current settings + theme.
 * On a cold cache, generate raw SVGs for immediate display and compress/cache
 * them later so first meaningful paint is not blocked by svgo.
 */
export function getHomepageShapeSVGs(
  settings: HomepageImageSettings,
  svgData: Record<string, string>,
): void {
  const keys = Object.keys(LAYER_EXPANDED_SHAPES).flatMap((layerName) => [
    homepageShapeSVGKey('top', layerName),
    homepageShapeSVGKey('bottom', layerName),
  ]);
  Object.keys(svgData).forEach((key) => delete svgData[key]);
  ensureHomepageShapeSVGKeys(settings, svgData, keys);
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
      divs[0].innerHTML = svgData[homepageShapeSVGKey('top', shapes.top)] || '';
      divs[1].innerHTML = svgData[homepageShapeSVGKey('bottom', shapes.bottom)] || '';
    }
  });
}
