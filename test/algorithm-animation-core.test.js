const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

function runBrowserScript(context, relativePath) {
  const absolutePath = path.join(root, relativePath);
  const source = fs.readFileSync(absolutePath, 'utf8');
  vm.runInContext(source, context, { filename: relativePath });
}

function createBrowserContext() {
  const context = {
    console,
    localStorage: {
      getItem: () => null,
      setItem: () => {}
    },
    document: {
      readyState: 'complete',
      addEventListener: () => {}
    }
  };

  context.window = context;
  vm.createContext(context);
  return context;
}

function fromBrowser(value) {
  return JSON.parse(JSON.stringify(value));
}

const browser = createBrowserContext();
runBrowserScript(browser, 'refactor/js/app-core.js');
runBrowserScript(browser, 'refactor/js/utils.js');
runBrowserScript(browser, 'refactor/js/tools/algorithm-animation-core.js');

const core = browser.SQG.algAnimation;

assert.deepStrictEqual(fromBrowser(core.getSolvedHex()), {
  tlHex: '011233455677',
  blHex: '998bbaddcffe'
});

assert.deepStrictEqual(
  fromBrowser(core.parseAnimationScramble('(3,-3)/', false)),
  [
    { type: 'turn', top: 3, bottom: 0 },
    { type: 'turn', top: 0, bottom: -3 },
    { type: 'twist' }
  ]
);

assert.deepStrictEqual(
  fromBrowser(core.parseAnimationScramble('(3,-3)/', true)),
  [
    { type: 'turn', top: 3, bottom: -3 },
    { type: 'twist' }
  ]
);

const bothLayerSteps = core.generateSteps('(0,0)/(3,-3)/', true);
assert.deepStrictEqual(
  fromBrowser(bothLayerSteps.map(step => step.description)),
  ['Slash (twist)', 'Both layers turn', 'Slash (twist)', 'Solved state']
);

const legacySteps = core.generateSteps('(3,-3)/', false);
assert.deepStrictEqual(
  fromBrowser(legacySteps.map(step => step.description)),
  ['Top layer turn', 'Bottom layer turn', 'Slash (twist)', 'Solved state']
);

assert.strictEqual(core.isZeroMove({
  highlightStart: 0,
  highlightEnd: 5
}, '(0,0)', true), true);

assert.deepStrictEqual(
  fromBrowser(core.scrambleToHex('(3,-3)/', true)),
  fromBrowser(browser.scrambleToHex('(3,-3)/'))
);

const solvedStep = bothLayerSteps[bothLayerSteps.length - 1];
assert.deepStrictEqual(
  fromBrowser(core.getHexForStep(solvedStep, true)),
  fromBrowser(core.getSolvedHex())
);

assert.strictEqual(
  browser.SQG.dom.escapeHTML('<img src=x onerror=alert(1)>'),
  '&lt;img src=x onerror=alert(1)&gt;'
);

console.log('algorithm-animation-core tests passed.');
