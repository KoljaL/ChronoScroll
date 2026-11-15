const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, '..', 'js/coverageAdvisor.js'), 'utf8'),
  context
);

function createState() {
  return {
    paperColor: '#fdfbf7',
    colorSaturdayBg: '#f8fafc',
    colorSundayBg: '#f1f5f9',
    monthLayout: 'single',
    monthSeparators: {
      single: { enabled: true, colorMode: 'custom', color: '#123456' },
      double: { enabled: false, colorMode: 'custom', color: '#654321' }
    },
    holidays: [{ id: 'holiday-1', color: '#ff0000' }]
  };
}

test('recommendations are prioritized by estimated color reduction without mutating state', () => {
  const state = createState();
  const estimate = candidate => {
    let colorPercent = 100;
    let blackPercent = 10;
    if (candidate.paperColor === '#ffffff') {
      colorPercent -= 10;
      blackPercent -= 1;
    }
    if (candidate.colorSaturdayBg === candidate.paperColor) colorPercent -= 4;
    if (candidate.colorSundayBg === candidate.paperColor) colorPercent -= 3;
    if (candidate.monthSeparators.single.colorMode === 'paper') colorPercent -= 2;
    if (candidate.holidays[0].color === '#4c4c4c') {
      colorPercent -= 7;
      blackPercent += 2;
    }
    return { colorPercent, blackPercent };
  };

  const recommendations = context.window.CronoCoverageAdvisor.analyze(state, estimate);

  assert.deepEqual(
    Array.from(recommendations, ({ id }) => id),
    ['paper-white', 'holiday-colors-grayscale', 'saturday-background', 'sunday-background', 'month-separator']
  );
  assert.equal(recommendations[1].blackChange, 2);
  assert.equal(state.paperColor, '#fdfbf7');
  assert.equal(state.holidays[0].color, '#ff0000');
});

test('recommendations with no measurable color reduction are omitted', () => {
  const recommendations = context.window.CronoCoverageAdvisor.analyze(
    createState(),
    () => ({ colorPercent: 12, blackPercent: 4 })
  );

  assert.equal(recommendations.length, 0);
});

test('applying an action changes only its corresponding setting', () => {
  const state = createState();
  const advisor = context.window.CronoCoverageAdvisor;

  assert.equal(advisor.apply(state, 'paper-white'), true);
  assert.equal(state.paperColor, '#ffffff');
  assert.equal(state.colorSaturdayBg, '#f8fafc');

  assert.equal(advisor.apply(state, 'saturday-background'), true);
  assert.equal(state.colorSaturdayBg, state.paperColor);
  assert.equal(state.colorSundayBg, '#f1f5f9');
  assert.equal(state.holidays[0].color, '#ff0000');

  assert.equal(advisor.apply(state, 'month-separator'), true);
  assert.equal(state.monthSeparators.single.colorMode, 'paper');
  assert.equal(state.monthSeparators.double.colorMode, 'custom');

  assert.equal(advisor.apply(state, 'holiday-colors-grayscale'), true);
  assert.equal(state.holidays[0].color, '#4c4c4c');
  assert.equal(advisor.apply(state, 'holiday-colors-grayscale'), false);
  assert.throws(() => advisor.apply(state, 'unknown'), /Unbekannte Farbempfehlung/);
});
