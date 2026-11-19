import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../docs/generator/index.html', import.meta.url), 'utf8');
const source = html.match(/<script>([\s\S]*)<\/script>\s*<\/body>/)?.[1];
if (!source) throw new Error('Generator script not found');

export function generatorHarness() {
  const nodes = new Map();
  const privacyCalls = [];
  const writes = [];
  const timers = [];
  let entropyCalls = 0;
  let entropy = buffer => buffer.fill(10);
  let clipboard = text => { writes.push(text); return Promise.resolve(); };
  let focused;
  function createNode() {
    const classes = new Set();
    const attributes = new Map();
    const listeners = new Map();
    return {
      value: '', textContent: '', checked: false, hidden: false, style: {}, children: [],
      get valueAsNumber() { return this.value === '' ? Number.NaN : Number(this.value); },
      set innerHTML(value) { if (value !== '') throw new Error('Unexpected HTML insertion'); this.children = []; },
      classList: {
        add(value) { classes.add(value); }, remove(value) { classes.delete(value); },
        contains(value) { return classes.has(value); },
        toggle(value) { if (classes.has(value)) { classes.delete(value); return false; } classes.add(value); return true; },
      },
      setAttribute(name, value) { attributes.set(name, value); },
      removeAttribute(name) { attributes.delete(name); },
      getAttribute(name) { return attributes.get(name); },
      addEventListener(name, handler) { listeners.set(name, handler); },
      dispatch(name) { listeners.get(name)?.(); },
      appendChild(child) { this.children.push(child); },
      focus() { focused = this; }, select() { this.selected = true; },
    };
  }
  function element(id) {
    if (!nodes.has(id)) nodes.set(id, createNode());
    return nodes.get(id);
  }
  element('codeLength').value = '8';
  element('quantity').value = '2';
  element('groupSize').value = '4';
  element('separator').value = '-';
  element('copyAllBtn').style.display = 'none';
  element('manualCopy').hidden = true;
  element('generationError').hidden = true;
  const forbidden = name => () => { privacyCalls.push(name); throw new Error(`Forbidden privacy operation: ${name}`); };
  const math = Object.create(Math);
  math.random = forbidden('Math.random');
  const context = vm.createContext({
    Uint8Array, Math: math, Number, parseInt, console,
    crypto: { getRandomValues(buffer) { return entropy(buffer, ++entropyCalls); } },
    document: {
      getElementById: element, createElement: createNode,
      querySelectorAll(selector) { return selector === '.code-chip' ? element('codesContainer').children : []; },
    },
    navigator: { clipboard: { writeText(text) { return clipboard(text); } }, sendBeacon: forbidden('sendBeacon') },
    fetch: forbidden('fetch'), XMLHttpRequest: forbidden('XMLHttpRequest'), WebSocket: forbidden('WebSocket'),
    setTimeout(callback) { timers.push(callback); },
  });
  for (const name of ['localStorage', 'sessionStorage', 'indexedDB', 'caches']) {
    Object.defineProperty(context, name, { get: forbidden(name) });
  }
  Object.defineProperty(context.document, 'cookie', { get: forbidden('cookie read'), set: forbidden('cookie write') });
  vm.runInContext(source, context, { timeout: 1000, filename: 'docs/generator/index.html' });
  return {
    context, element, privacyCalls, writes, timers,
    get focused() { return focused; },
    get entropyCalls() { return entropyCalls; },
    chips() { return element('codesContainer').children; },
    displayed() { return this.chips().map(chip => chip.textContent); },
    setEntropy(fn) { entropy = fn; },
    setClipboard(fn) { clipboard = fn; },
  };
}
