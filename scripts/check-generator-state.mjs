import assert from 'node:assert/strict';
import { normalize, verifyCheckDigit } from '../js/index.js';
import { generatorHarness } from './generator-test-harness.mjs';

let scenarios = 0;
function checkPrivacy(harness) {
  assert.deepEqual(harness.privacyCalls, [], 'generation and copying must use neither network/storage nor weak randomness');
  scenarios++;
}

for (const failAt of [1, 2]) {
  const h = generatorHarness();
  h.context.generate();
  const previous = h.displayed();
  const previousCount = h.element('generated').textContent;
  let call = 0;
  h.setEntropy(buffer => { if (++call === failAt) throw new Error('Entropy unavailable'); return buffer.fill(11); });
  h.context.generate();
  assert.deepEqual(h.displayed(), previous, 'an entropy failure must preserve the entire previous batch');
  assert.equal(h.element('generated').textContent, previousCount);
  assert.match(h.element('resultsStatus').textContent, /Generation failed/);
  assert.equal(h.element('generationError').hidden, false);
  assert.equal(h.element('copyAllBtn').style.display, 'block');
  h.setEntropy(buffer => buffer.fill(12));
  h.context.generate();
  assert.equal(h.chips().length, 2);
  assert.equal(h.element('generationError').hidden, true);
  assert.equal(h.element('generated').textContent, 4);
  checkPrivacy(h);
}

{
  const h = generatorHarness();
  h.setEntropy(() => { throw new Error('Entropy unavailable'); });
  h.context.generate();
  assert.equal(h.chips().length, 0);
  assert.equal(h.element('copyAllBtn').style.display, 'none');
  assert.match(h.element('resultsStatus').textContent, /Generation failed/);
  checkPrivacy(h);
}

{
  const h = generatorHarness();
  h.context.crypto = undefined;
  h.context.generate();
  assert.equal(h.chips().length, 0);
  assert.equal(h.element('copyAllBtn').style.display, 'none');
  assert.match(h.element('resultsStatus').textContent, /Generation failed/);
  checkPrivacy(h);
}

{
  const h = generatorHarness();
  h.element('checkDigit').checked = true;
  h.context.generate();
  const originals = h.displayed().map(normalize);
  h.context.setCase('lower', h.element('lowerButton'));
  for (const [group, separator] of [['0', '-'], ['3', '.'], ['4', ' ']]) {
    h.element('groupSize').value = group;
    h.element('groupSize').dispatch('input');
    h.element('separator').value = separator;
    h.element('separator').dispatch('change');
    assert.deepEqual(h.displayed().map(normalize), originals);
    for (const chip of h.chips()) {
      assert.equal(chip.getAttribute('aria-label'), 'Copy code ' + chip.textContent);
      assert.equal(verifyCheckDigit(chip.textContent), true);
    }
    await h.context.copyAll();
    assert.equal(h.writes.at(-1), h.displayed().join('\n'));
    await h.context.copyOne(h.chips()[0]);
    assert.equal(h.writes.at(-1), h.displayed()[0]);
  }
  const before = h.displayed();
  h.element('quantity').value = '0';
  h.context.generate();
  assert.deepEqual(h.displayed(), before);
  h.element('quantity').value = '1';
  h.context.generate();
  assert.equal(h.chips().length, 1);
  checkPrivacy(h);
}

for (const unavailable of [false, true]) {
  const h = generatorHarness();
  h.context.generate();
  if (unavailable) h.context.navigator.clipboard = undefined;
  else h.setClipboard(() => Promise.reject(new Error('Permission denied')));
  await h.context.copyAll();
  assert.equal(h.element('manualCopy').hidden, false);
  assert.equal(h.element('manualCopyText').value, h.displayed().join('\n'));
  assert.equal(h.focused, h.element('manualCopyText'));
  assert.equal(h.element('manualCopyText').selected, true);
  assert.match(h.element('toast').textContent, /Copy failed/);
  h.context.navigator.clipboard = { writeText() { return Promise.resolve(); } };
  await h.context.copyOne(h.chips()[0]);
  assert.equal(h.element('manualCopy').hidden, true);
  assert.equal(h.element('manualCopyText').value, '');
  assert.match(h.element('toast').textContent, /Copied:/);
  checkPrivacy(h);
}

{
  const h = generatorHarness();
  h.context.generate();
  h.setClipboard(() => { throw new Error('Clipboard failed synchronously'); });
  await h.context.copyOne(h.chips()[0]);
  assert.equal(h.element('manualCopyText').value, h.displayed()[0]);
  assert.match(h.element('toast').textContent, /Copy failed/);
  h.context.clearOutput();
  assert.equal(h.element('manualCopy').hidden, true);
  assert.equal(h.element('manualCopyText').value, '');
  checkPrivacy(h);
}

for (const action of ['clear', 'regenerate', 'reformat']) {
  for (const rejected of [false, true]) {
    const h = generatorHarness();
    h.context.generate();
    let complete;
    h.setClipboard(() => new Promise((resolve, reject) => { complete = rejected ? () => reject(new Error('Denied')) : resolve; }));
    const pending = h.context.copyAll();
    if (action === 'clear') h.context.clearOutput();
    else if (action === 'regenerate') { h.element('quantity').value = '1'; h.context.generate(); }
    else { h.element('groupSize').value = '0'; h.element('groupSize').dispatch('input'); }
    const status = h.element('resultsStatus').textContent;
    complete();
    await pending;
    assert.equal(h.element('toast').textContent, '', 'stale copy completion must not replace current feedback');
    assert.equal(h.element('manualCopy').hidden, true);
    assert.equal(h.element('resultsStatus').textContent, status);
    checkPrivacy(h);
  }
}

{
  const h = generatorHarness();
  h.context.generate();
  let first;
  h.setClipboard(() => new Promise(resolve => { first = resolve; }));
  const pending = h.context.copyAll();
  h.setClipboard(() => Promise.resolve());
  await h.context.copyOne(h.chips()[0]);
  const newest = h.element('toast').textContent;
  first();
  await pending;
  assert.equal(h.element('toast').textContent, newest, 'older copy must not overwrite latest completion');
  checkPrivacy(h);
}

{
  const h = generatorHarness();
  h.context.showToast('First');
  const firstTimer = h.timers.at(-1);
  h.context.showToast('Second');
  firstTimer();
  assert.equal(h.element('toast').classList.contains('show'), true);
  h.timers.at(-1)();
  assert.equal(h.element('toast').classList.contains('show'), false);
  checkPrivacy(h);
}

{
  const h = generatorHarness();
  h.context.generate();
  const chip = h.chips()[0];
  await h.context.copyOne(chip);
  const firstTimer = h.timers.at(-2);
  await h.context.copyOne(chip);
  firstTimer();
  assert.equal(chip.classList.contains('copied'), true);
  h.timers.at(-2)();
  assert.equal(chip.classList.contains('copied'), false);
  checkPrivacy(h);
}

console.log(`generator state/privacy checks passed (${scenarios} deterministic scenarios)`);
