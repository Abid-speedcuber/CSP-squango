import { beforeAll, expect, test, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() {
    return store.size;
  },
});

type PresetPayload = Record<string, unknown>;
let presetPayload: PresetPayload | null = null;

vi.stubGlobal(
  'fetch',
  vi.fn(async () => ({
    ok: true,
    json: async () => presetPayload,
  })),
);

let state: typeof import('../state');

beforeAll(async () => {
  state = await import('../state');
});

function loadPresetFile(name: string): PresetPayload {
  return JSON.parse(readFileSync(join(process.cwd(), 'public', 'presets', name), 'utf-8'));
}

test('slimmed presets contain no redundant derived fields', () => {
  for (const file of ["Matt's_Preset.json", 'Empty_Preset.json']) {
    const p = loadPresetFile(file);
    for (const key of [
      'learned',
      'learning',
      'planned',
      'plannedLevels',
      'cachedParityAlgorithms',
      'lastParityCalculationSettings',
    ]) {
      expect(p, `${file} should not contain ${key}`).not.toHaveProperty(key);
    }
  }
});

test("Matt's_Preset applies cleanly after slimming and rebuilds the parity cache", async () => {
  presetPayload = loadPresetFile("Matt's_Preset.json");
  await state.applyPreset("Matt's_Preset", true, true, true);

  expect(state.currentPreset).toBe("Matt's_Preset");
  expect(Object.keys(state.getPresetDefaults() ?? {})).not.toContain('cachedParityAlgorithms');
  expect(state.getPlannedLevel('Kite/Square')).toBeGreaterThan(0);
  expect(state.getPlannedLevel('8/Star')).toBeGreaterThan(0);
  expect(state.cachedParityAlgorithms.size).toBe(90);
  const kite = state.cachedParityAlgorithms.get('Kite/Square');
  expect(kite).toBeTruthy();
  expect((kite?.odd.length ?? 0) + (kite?.even.length ?? 0)).toBeGreaterThan(0);
});

test('legacy-format presets with redundant fields still load (backward compatible)', async () => {
  const slim = loadPresetFile("Matt's_Preset.json");
  presetPayload = {
    ...slim,
    learned: ['Kite/Square'],
    learning: [],
    planned: Object.keys(slim.displayNames ?? {}),
    plannedLevels: Object.fromEntries(Object.keys(slim.displayNames ?? {}).map((k) => [k, 4])),
    cachedParityAlgorithms: Object.fromEntries(
      Object.keys(slim.displayNames ?? {}).map((k) => [k, { odd: [], even: ['Done!'] }]),
    ),
    lastParityCalculationSettings: { colorScheme: 'legacy' },
  };
  await state.applyPreset("Matt's_Preset", true, true, true);

  expect(state.currentPreset).toBe("Matt's_Preset");
  expect(state.getPlannedLevel('Kite/Square')).toBeGreaterThan(0);
  expect(state.cachedParityAlgorithms.size).toBe(90);
});
