const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function insertBeforeIifeClose(source, injection) {
  const marker = '\n})(typeof window';
  const index = source.lastIndexOf(marker);
  if (index === -1) {
    throw new Error('Could not find tracer IIFE close for debug injection');
  }
  return `${source.slice(0, index)}\n${injection}\n${source.slice(index)}`;
}

function runBrowserScript(context, relativePath, options = {}) {
  const source = options.injectBeforeIifeClose
    ? insertBeforeIifeClose(read(relativePath), options.injectBeforeIifeClose)
    : read(relativePath);
  vm.runInContext(source, context, { filename: relativePath });
}

function createStorage(seed = {}) {
  const values = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)]));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => { values.set(key, String(value)); },
    removeItem: key => { values.delete(key); },
    clear: () => { values.clear(); }
  };
}

function createBrowserContext(storageSeed) {
  const errors = [];
  const context = {
    console: {
      ...console,
      error: (...args) => errors.push(args.map(String).join(' '))
    },
    localStorage: createStorage(storageSeed),
    document: {
      readyState: 'complete',
      addEventListener: () => {},
      createElement: () => ({ style: {}, appendChild: () => {}, addEventListener: () => {} }),
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      body: {
        appendChild: () => {},
        classList: { add: () => {}, remove: () => {} }
      },
      head: { appendChild: () => {} }
    },
    setTimeout: () => 0,
    clearTimeout: () => {},
    getComputedStyle: () => ({ getPropertyValue: () => '#ffffff' }),
    closeModalWithHistory: fn => fn(),
    pushModalState: () => {},
    scrollTo: () => {},
    Math
  };

  context.window = context;
  context.globalThis = context;
  context.__errors = errors;
  vm.createContext(context);
  return context;
}

const refactorDebugInjection = `
Cglobal.__caleParityDebug = {
    analyze(scrambleText, cornerMode) {
        currentShapePatterns = loadShapesFromStorage();
        const hex = scrambleToHex(scrambleText);
        const units = hexToUnits(hex.tlHex, hex.blHex);
        const parity = calculateParityFromHex(
            hex.tlHex,
            hex.blHex,
            z2TracingModeEnabled,
            cornerMode === 'clockwise',
            scrambleText
        );
        return {
            hex: hex.tlHex + '|' + hex.blHex,
            topTypes: units.topBits.replace(/0/g, 'E').replace(/1/g, 'C'),
            bottomTypes: units.botBits.replace(/0/g, 'E').replace(/1/g, 'C'),
            topMatch: parity.topMatch,
            bottomMatch: parity.botMatch,
            orderedTopHex: parity.topUnits.join(''),
            orderedBottomHex: parity.botUnits.join(''),
            wasSwapped: parity.wasSwapped,
            steps: parity.steps.map(step => ({
                name: step.name,
                result: step.result,
                hexPerm: Array.isArray(step.hexPerm) ? step.hexPerm.join('') : '',
                codenames: Array.isArray(step.codenames) ? step.codenames.join('') : '',
                topCount: step.topCount
            })),
            total: parity.total,
            finalParity: parity.isOdd ? 'Odd' : 'Even'
        };
    },
    renderModal(scrambleText, cornerMode) {
        const container = document.createElement('div');
        const hex = scrambleToHex(scrambleText);
        const parity = calculateParityFromHex(
            hex.tlHex,
            hex.blHex,
            z2TracingModeEnabled,
            cornerMode === 'clockwise',
            scrambleText
        );
        displayResults(container, parity, {
            backgroundColor: '#ffffff',
            tlMainCol: '#FFD700',
            tlColName: 'Yellow',
            tlColAbb: 'Y',
            blMainCol: '#FFFFFF',
            blColName: 'White',
            blColAbb: 'W',
            frontCol: '#CC0000',
            rightCol: '#00AA00',
            backCol: '#FF8C00',
            leftCol: '#0066CC'
        });
        return container.innerHTML;
    }
};
`;

const publicDebugInjection = `
globalThisWindowObjectThingyForParityTracer.__caleParityDebug = {
    analyze(scrambleText, cornerMode) {
        currentShapePatternsStorageWithLongName = loadShapesFromStorageWithLongName();
        const state = applyScrambleToStateArrayWithLongName(scrambleText);
        const encoded = encodeStateToHexStringWithLongName(state);
        const topRaw = buildUnitsFromStateLayerWithLongName(state, 0);
        const botRaw = buildUnitsFromStateLayerWithLongName(state, 12);
        const topMatch = matchPatternWithRotationCheckingWithLongName(topRaw.types);
        const botMatch = matchPatternWithRotationCheckingWithLongName(botRaw.types);
        const topUnits = rotateArrayCircularlyWithLongName(topRaw.units, topMatch.rot);
        const botUnits = rotateArrayCircularlyWithLongName(botRaw.units, botMatch.rot);
        const topCounts = countEdgesAndCornersWithLongName(topUnits);
        const botCounts = countEdgesAndCornersWithLongName(botUnits);
        const shouldSwapForParity = z2TracingModeEnabled &&
            (topCounts.label === '2E5C' && botCounts.label === '6E3C' ||
                topCounts.label === '0E6C' && botCounts.label === '8E2C');

        const blocks = shouldSwapForParity
            ? [{ side: 'B', units: botUnits }, { side: 'T', units: topUnits }]
            : [{ side: 'T', units: topUnits }, { side: 'B', units: botUnits }];
        const parityEdgesOrder = [];
        const parityCornersOrder = [];
        for (const block of blocks) {
            for (const unit of block.units) {
                if (unit.type === 'E') parityEdgesOrder.push(unit.edge);
                else parityCornersOrder.push(unit.pair);
            }
        }

        const parity = calculateSixStepParityWithExtremelyLongFunctionName(
            parityEdgesOrder,
            parityCornersOrder,
            cornerMode === 'clockwise',
            scrambleText
        );

        return {
            hex: encoded,
            topTypes: topRaw.types,
            bottomTypes: botRaw.types,
            topMatch,
            bottomMatch: botMatch,
            orderedTopHex: topUnits.map(unit => unit.type === 'E' ? unit.edge : unit.pair).join(' '),
            orderedBottomHex: botUnits.map(unit => unit.type === 'E' ? unit.edge : unit.pair).join(' '),
            wasSwapped: shouldSwapForParity,
            parityEdgesOrder: parityEdgesOrder.join(' '),
            parityCornersOrder: parityCornersOrder.join(' '),
            steps: parity.steps.map(step => ({
                name: step.name,
                result: step.result,
                pieces: step.pieces,
                codenames: step.codenames
            })),
            total: parity.total,
            finalParity: parity.isOdd ? 'Odd' : 'Even'
        };
    },
    renderModal(scrambleText, cornerMode) {
        const container = document.createElement('div');
        const state = applyScrambleToStateArrayWithLongName(scrambleText);
        const topRaw = buildUnitsFromStateLayerWithLongName(state, 0);
        const botRaw = buildUnitsFromStateLayerWithLongName(state, 12);
        const topMatch = matchPatternWithRotationCheckingWithLongName(topRaw.types);
        const botMatch = matchPatternWithRotationCheckingWithLongName(botRaw.types);
        const topUnits = rotateArrayCircularlyWithLongName(topRaw.units, topMatch.rot);
        const botUnits = rotateArrayCircularlyWithLongName(botRaw.units, botMatch.rot);
        const topCounts = countEdgesAndCornersWithLongName(topUnits);
        const botCounts = countEdgesAndCornersWithLongName(botUnits);
        const shouldSwapForParity = z2TracingModeEnabled &&
            (topCounts.label === '2E5C' && botCounts.label === '6E3C' ||
                topCounts.label === '0E6C' && botCounts.label === '8E2C');
        const blocks = shouldSwapForParity
            ? [{ units: botUnits }, { units: topUnits }]
            : [{ units: topUnits }, { units: botUnits }];
        const edges = [];
        const corners = [];
        for (const block of blocks) {
            for (const unit of block.units) {
                if (unit.type === 'E') edges.push(unit.edge);
                else corners.push(unit.pair);
            }
        }
        const parity = calculateSixStepParityWithExtremelyLongFunctionName(edges, corners, cornerMode === 'clockwise', scrambleText);
        displayResultsInModalWithVeryLongFunctionName(container, parity, {
            backgroundColor: '#ffffff',
            topLayerMainColor: '#FFD700',
            topLayerColorFullName: 'Yellow',
            topLayerColorAbbreviation: 'Y',
            bottomLayerMainColor: '#FFFFFF',
            bottomLayerColorFullName: 'White',
            bottomLayerColorAbbreviation: 'W',
            frontFaceColorForVisualization: '#CC0000',
            rightFaceColorForVisualization: '#00AA00',
            backFaceColorForVisualization: '#FF8C00',
            leftFaceColorForVisualization: '#0066CC'
        });
        return container.innerHTML;
    }
};
`;

function loadRefactorTracer() {
  const context = createBrowserContext({
    z2TracingMode: 'true'
  });
  runBrowserScript(context, 'refactor/js/app-core.js');
  runBrowserScript(context, 'refactor/js/utils.js');
  runBrowserScript(context, 'refactor/js/tools/cales-parity-tracer.js', {
    injectBeforeIifeClose: refactorDebugInjection
  });
  return {
    label: 'refactor',
    context,
    parity(scramble, cornerMode) {
      context.parityTracerSymmetryOffsets = {};
      return context.caleTracer.getParityTextFromScramble(scramble, cornerMode);
    },
    analyze(scramble, cornerMode) {
      context.parityTracerSymmetryOffsets = {};
      return context.__caleParityDebug.analyze(scramble, cornerMode);
    },
    renderModal(scramble, cornerMode) {
      return context.__caleParityDebug.renderModal(scramble, cornerMode);
    }
  };
}

function loadPublicTracer() {
  const context = createBrowserContext({
    z2TracingModeForParityTracerLibrary: 'true'
  });
  runBrowserScript(context, 'public/js/tools/cales-parity-tracer.js', {
    injectBeforeIifeClose: publicDebugInjection
  });
  return {
    label: 'public',
    context,
    parity(scramble, cornerMode) {
      context.parityTracerSymmetryOffsets = {};
      return context.Square1ParityAnalyzerLibraryWithSillyNames
        .getParityTextFromScramblePlease(scramble, null, cornerMode);
    },
    analyze(scramble, cornerMode) {
      context.parityTracerSymmetryOffsets = {};
      return context.__caleParityDebug.analyze(scramble, cornerMode);
    },
    renderModal(scramble, cornerMode) {
      return context.__caleParityDebug.renderModal(scramble, cornerMode);
    }
  };
}

function loadAlgorithmCorpus() {
  const context = createBrowserContext();
  runBrowserScript(context, 'refactor/database/algs.js');
  const data = vm.runInContext('data', context);
  const cases = [];

  for (const item of data) {
    for (const bucket of ['odd', 'even', 'oddPar', 'evenPar']) {
      if (!Array.isArray(item[bucket])) continue;
      for (const scramble of item[bucket]) {
        if (typeof scramble === 'string' && scramble.trim()) {
          cases.push({
            source: `algs:${item.name}:${bucket}`,
            scramble: scramble.trim()
          });
        }
      }
    }
  }

  return cases;
}

function mulberry32(seed) {
  return function next() {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function randomInt(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function normalizeMove(n) {
  return n === 0 ? 0 : n;
}

function generateRandomCorpus(count) {
  const random = mulberry32(0xCA1E2026);
  const cases = [];

  for (let i = 0; i < count; i++) {
    const length = randomInt(random, 1, 14);
    const parts = [];
    for (let j = 0; j < length; j++) {
      const top = normalizeMove(randomInt(random, -5, 6));
      const bottom = normalizeMove(randomInt(random, -5, 6));
      parts.push(`(${top},${bottom})`);
      if (random() < 0.78 || j === length - 1) parts.push('/');
    }
    cases.push({
      source: `deterministic-random:${i + 1}`,
      scramble: parts.join('')
    });
  }

  return cases;
}

function uniqueCases(cases) {
  const seen = new Set();
  return cases.filter(testCase => {
    const key = testCase.scramble;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getOption(name, fallback) {
  const arg = process.argv.find(value => value.startsWith(`--${name}=`));
  if (arg) return arg.slice(name.length + 3);

  const envName = `CALE_PARITY_${name.replace(/-/g, '_').toUpperCase()}`;
  return process.env[envName] || fallback;
}

function normalizeStepName(name) {
  return String(name).replace(/Yellow|White/g, '').replace(/\s+/g, ' ').trim();
}

function stripHtml(html) {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getModalSummary(html) {
  const text = stripHtml(html);
  return {
    lines: Array.from(text.matchAll(/Line\s+\d+:[^=]+= \d/g)).map(match => match[0]),
    total: (text.match(/Total:[^P]+Parity/) || [''])[0]
  };
}

function firstDifferentAnalysisStage(publicTrace, refactorTrace) {
  if (refactorTrace.hex !== publicTrace.hex) {
    return {
      stage: 'scramble-to-hex',
      public: publicTrace.hex,
      refactor: refactorTrace.hex
    };
  }

  if (refactorTrace.topTypes !== publicTrace.topTypes ||
      refactorTrace.bottomTypes !== publicTrace.bottomTypes) {
    return {
      stage: 'hex-to-shape-units',
      public: `${publicTrace.topTypes} | ${publicTrace.bottomTypes}`,
      refactor: `${refactorTrace.topTypes} | ${refactorTrace.bottomTypes}`
    };
  }

  const publicTopMatch = `${publicTrace.topMatch.name}:${publicTrace.topMatch.rot}`;
  const refactorTopMatch = `${refactorTrace.topMatch.name}:${refactorTrace.topMatch.rot}`;
  const publicBottomMatch = `${publicTrace.bottomMatch.name}:${publicTrace.bottomMatch.rot}`;
  const refactorBottomMatch = `${refactorTrace.bottomMatch.name}:${refactorTrace.bottomMatch.rot}`;
  if (publicTopMatch !== refactorTopMatch || publicBottomMatch !== refactorBottomMatch) {
    return {
      stage: 'shape-pattern-match',
      public: `${publicTopMatch} | ${publicBottomMatch}`,
      refactor: `${refactorTopMatch} | ${refactorBottomMatch}`
    };
  }

  if (publicTrace.wasSwapped !== refactorTrace.wasSwapped) {
    return {
      stage: 'z2-parity-layer-order',
      public: String(publicTrace.wasSwapped),
      refactor: String(refactorTrace.wasSwapped)
    };
  }

  const stepCount = Math.max(publicTrace.steps.length, refactorTrace.steps.length);
  for (let i = 0; i < stepCount; i++) {
    const expected = publicTrace.steps[i];
    const actual = refactorTrace.steps[i];
    if (!expected || !actual) {
      return {
        stage: `parity-dictionary:line-${i + 1}`,
        public: expected ? JSON.stringify(expected) : '<missing>',
        refactor: actual ? JSON.stringify(actual) : '<missing>'
      };
    }
    if (normalizeStepName(expected.name) !== normalizeStepName(actual.name) ||
        expected.result !== actual.result) {
      return {
        stage: `parity-dictionary:line-${i + 1}`,
        public: JSON.stringify(expected),
        refactor: JSON.stringify(actual)
      };
    }
  }

  if (publicTrace.total !== refactorTrace.total ||
      publicTrace.finalParity !== refactorTrace.finalParity) {
    return {
      stage: 'parity-dictionary:total',
      public: `${publicTrace.total} ${publicTrace.finalParity}`,
      refactor: `${refactorTrace.total} ${refactorTrace.finalParity}`
    };
  }

  return {
    stage: 'same',
    public: publicTrace.finalParity,
    refactor: refactorTrace.finalParity
  };
}

function firstDifferentModalStage(publicModalHtml, refactorModalHtml) {
  const publicSummary = getModalSummary(publicModalHtml);
  const refactorSummary = getModalSummary(refactorModalHtml);
  if (JSON.stringify(publicSummary) !== JSON.stringify(refactorSummary)) {
    return {
      stage: 'modal-render',
      public: JSON.stringify(publicSummary),
      refactor: JSON.stringify(refactorSummary)
    };
  }
  return { stage: 'same', public: '', refactor: '' };
}

const refactor = loadRefactorTracer();
const stablePublic = loadPublicTracer();
const randomCount = Number(getOption('random', '100'));
const maxMismatches = Number(getOption('max-mismatches', '25'));
const modeOption = getOption('corner-mode', 'both');
const cornerModes = modeOption === 'both' ? ['counter-clockwise', 'clockwise'] : [modeOption];
const strictStages = getOption('strict-stages', 'false') === 'true';
const checkModal = getOption('check-modal', 'true') !== 'false';
const singleScramble = getOption('scramble', '').trim();

const defaultCorpus = uniqueCases([
  { source: 'smoke:empty', scramble: '' },
  { source: 'smoke:slash', scramble: '/' },
  { source: 'smoke:simple', scramble: '(3,-3)/' },
  { source: 'smoke:simple', scramble: '(-3,0)/(3,0)/' },
  ...loadAlgorithmCorpus(),
  ...generateRandomCorpus(randomCount)
]);
const corpus = singleScramble
  ? [{ source: 'cli:scramble', scramble: singleScramble }]
  : defaultCorpus;

const mismatches = [];

for (const testCase of corpus) {
  for (const cornerMode of cornerModes) {
    const expected = stablePublic.parity(testCase.scramble, cornerMode);
    const actual = refactor.parity(testCase.scramble, cornerMode);
    const expectedTrace = stablePublic.analyze(testCase.scramble, cornerMode);
    const actualTrace = refactor.analyze(testCase.scramble, cornerMode);
    const expectedModal = stablePublic.renderModal(testCase.scramble, cornerMode);
    const actualModal = refactor.renderModal(testCase.scramble, cornerMode);
    const analysisDiff = firstDifferentAnalysisStage(expectedTrace, actualTrace);
    const modalDiff = checkModal
      ? firstDifferentModalStage(expectedModal, actualModal)
      : { stage: 'same', public: '', refactor: '' };

    if (actual !== expected || modalDiff.stage !== 'same' || (strictStages && analysisDiff.stage !== 'same')) {
      const stageDiff = actual !== expected || strictStages ? analysisDiff : modalDiff;
      mismatches.push({
        ...testCase,
        cornerMode,
        public: expected,
        refactor: actual,
        stage: stageDiff.stage,
        publicStageValue: stageDiff.public,
        refactorStageValue: stageDiff.refactor
      });
      if (mismatches.length >= maxMismatches) break;
    }
  }
  if (mismatches.length >= maxMismatches) break;
}

if (mismatches.length > 0) {
  console.error(`Cale parity tracer comparison found ${mismatches.length} mismatch(es), showing up to ${maxMismatches}:`);
  for (const mismatch of mismatches) {
    console.error([
      `- ${mismatch.source}`,
      `mode=${mismatch.cornerMode}`,
      `stage=${mismatch.stage}`,
      `public=${mismatch.public}`,
      `refactor=${mismatch.refactor}`,
      `scramble=${mismatch.scramble}`,
      `publicStage=${mismatch.publicStageValue}`,
      `refactorStage=${mismatch.refactorStageValue}`
    ].join(' | '));
  }
}

assert.strictEqual(
  mismatches.length,
  0,
  `refactor Cale parity tracer must match public for ${corpus.length} scrambles x ${cornerModes.length} corner mode(s)`
);

console.log(`Cale parity tracer comparison passed: ${corpus.length} scrambles x ${cornerModes.length} corner mode(s).`);
