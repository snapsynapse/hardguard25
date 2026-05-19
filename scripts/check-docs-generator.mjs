import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../docs/generator/index.html', import.meta.url), 'utf8');
const conformance = JSON.parse(
  fs.readFileSync(new URL('../conformance/vectors.json', import.meta.url), 'utf8')
);

const scriptMatch = html.match(/<script>([\s\S]*)<\/script>\s*<\/body>/);
assert.ok(scriptMatch, 'docs generator script block should be present');

let activeBytes = [];

const elements = new Map();
function element(id) {
  if (!elements.has(id)) {
    elements.set(id, {
      value: id === 'codeLength' ? '8' : '',
      textContent: '',
      classList: { add() {}, remove() {}, toggle() {} },
      addEventListener() {},
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
});

for (const vector of conformance.deterministic_generation) {
  const bytes = vector.bytes_hex.split(/\s+/).map((hex) => Number.parseInt(hex, 16));
  activeBytes = [...bytes, ...new Array(vector.length + 16).fill(0)];
  assert.equal(context.generateCode(vector.length), vector.output.toLowerCase());
}

for (const vector of conformance.check_digit) {
  assert.equal(context.computeCheckDigit(vector.code), vector.digit.toLowerCase());
}

console.log('docs generator conformance check passed');
