import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { normalize, verifyCheckDigit } from '../js/index.js';

const html = fs.readFileSync(new URL('../docs/generator/index.html', import.meta.url), 'utf8');
const conformance = JSON.parse(
  fs.readFileSync(new URL('../conformance/vectors.json', import.meta.url), 'utf8')
);

const scriptMatch = html.match(/<script>([\s\S]*)<\/script>\s*<\/body>/);
assert.ok(scriptMatch, 'docs generator script block should be present');
assert.ok(html.includes('Payload Length'), 'generator must identify the selected length as payload length');
assert.ok(html.includes('Possible payload strings'), 'generator must label namespace statistics as payload strings');
assert.ok(html.includes('Payload entropy'), 'generator must label entropy as payload entropy');
assert.ok(html.includes('adds no random entropy'), 'generator must explain the check digit entropy boundary');

let activeBytes = [];

const elements = new Map();
function element(id) {
  if (!elements.has(id)) {
    elements.set(id, {
      value: id === 'codeLength' ? '8' : '',
      get valueAsNumber() { return this.value === '' ? Number.NaN : Number(this.value); },
      textContent: '',
      hidden: false,
      classList: { add() {}, remove() {}, toggle() {} },
      addEventListener() {},
      setAttribute() {},
      removeAttribute() {},
      focus() {},
      querySelectorAll() { return []; },
      style: {},
    });
  }
  return elements.get(id);
}

const context = {
  Uint8Array,
  Math,
  parseInt,
  setTimeout() {},
  console,
  crypto: {
    getRandomValues(buffer) {
      assert.ok(activeBytes.length >= buffer.length, 'deterministic vector should provide enough bytes');
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = activeBytes.shift();
      }
      return buffer;
    },
  },
  document: {
    getElementById: element,
    querySelectorAll() { return []; },
    createElement() {
      return element(`created-${elements.size}`);
    },
  },
  navigator: {
    clipboard: {
      writeText() {
        return Promise.resolve();
      },
    },
  },
};

vm.createContext(context);
vm.runInContext(scriptMatch[1], context, { filename: 'docs/generator/index.html' });

for (const vector of conformance.deterministic_generation) {
  const bytes = vector.bytes_hex.split(/\s+/).map((hex) => Number.parseInt(hex, 16));
  activeBytes = [...bytes, ...new Array(vector.length + 16).fill(0)];
  assert.equal(context.generateCode(vector.length), vector.output);
}

for (const vector of conformance.check_digit) {
  assert.equal(context.computeCheckDigit(vector.code), vector.digit);
}

context.setCase('lower', {
  classList: { add() {} },
  setAttribute() {},
});

for (const vector of conformance.deterministic_generation) {
  const bytes = vector.bytes_hex.split(/\s+/).map((hex) => Number.parseInt(hex, 16));
  activeBytes = [...bytes, ...new Array(vector.length + 16).fill(0)];
  assert.equal(context.generateCode(vector.length), vector.output.toLowerCase());
}

for (const vector of conformance.check_digit) {
  assert.equal(context.computeCheckDigit(vector.code), vector.digit.toLowerCase());
}

context.updateStats(16);
assert.equal(element('permutations').textContent, '2.33e+22');
assert.equal(element('bitsEntropy').textContent, '74.3 bits');

for (const separator of ['-', '_', '.', ' ', '/', '0', '<', 'ff', '\u200b', '\ufeff', '']) {
  element('separator').value = separator;
  for (const group of ['0', '1', '4', '16']) {
    element('groupSize').value = group;
    for (const payload of ['ACDF0G7H', 'ac3h7puw']) {
      const raw = payload + context.computeCheckDigit(payload);
      const formatted = context.formatCode(raw);
      assert.equal(normalize(formatted), normalize(raw), 'formatting must preserve canonical identity');
      assert.equal(verifyCheckDigit(formatted), true, 'formatting must preserve checksum validity');
    }
  }
}

// Content Security Policy: both hosted pages must declare a meta CSP whose script and style
// hashes match the inline blocks exactly, and must carry no inline handlers or style attributes.
import crypto from 'node:crypto';
function expectedPolicy(page) {
  const source = fs.readFileSync(new URL(`../${page}`, import.meta.url), 'utf8');
  const hash = (text) => `'sha256-${crypto.createHash('sha256').update(text).digest('base64')}'`;
  const scripts = [...source.matchAll(/<script(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const styles = [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  assert.ok(styles.length > 0, `${page}: expected an inline style block`);
  assert.doesNotMatch(source, /\son[a-z]+="/i, `${page}: inline event handler attributes are not allowed under the CSP`);
  assert.doesNotMatch(source, /\sstyle="/i, `${page}: inline style attributes are not allowed under the CSP`);
  assert.doesNotMatch(source, /<(script|img|iframe)[^>]*\ssrc="https?:/i, `${page}: external resources are not allowed under the CSP`);
  assert.doesNotMatch(source, /<link[^>]*rel="(stylesheet|preload|modulepreload|icon|manifest)"[^>]*href="https?:/i, `${page}: external fetched link resources are not allowed under the CSP`);
  const parts = ["default-src 'none'"];
  if (scripts.length > 0) parts.push(`script-src ${scripts.map(hash).join(' ')}`);
  parts.push(`style-src ${styles.map(hash).join(' ')}`);
  parts.push("img-src 'self' data:", "manifest-src 'self'", "base-uri 'none'", "form-action 'none'", 'upgrade-insecure-requests');
  const declared = source.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
  assert.ok(declared, `${page}: missing meta Content-Security-Policy`);
  assert.equal(declared[1], parts.join('; '), `${page}: CSP hashes must match the inline script and style blocks`);
  assert.ok(source.indexOf(declared[0]) < source.indexOf('<style'), `${page}: CSP meta must precede inline blocks`);
}
for (const page of ['docs/index.html', 'docs/generator/index.html']) expectedPolicy(page);
console.log('hosted page Content Security Policy check passed');

console.log('docs generator conformance check passed');
await import('./check-generator-state.mjs');
