import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import {
  ALPHABET,
  checkDigit,
  normalize,
  validate,
  verifyCheckDigit,
} from '../js/index.js';

const root = path.resolve(import.meta.dirname, '..');
const vectors = JSON.parse(fs.readFileSync(path.join(root, 'conformance', 'vectors.json'), 'utf8'));
const expectedWhitespace = [
  ...Array.from({ length: 5 }, (_, index) => String.fromCodePoint(0x0009 + index)),
  ...[0x0020, 0x0085, 0x00a0, 0x1680].map((codePoint) => String.fromCodePoint(codePoint)),
  ...Array.from({ length: 11 }, (_, index) => String.fromCodePoint(0x2000 + index)),
  ...[0x2028, 0x2029, 0x202f, 0x205f, 0x3000].map((codePoint) => String.fromCodePoint(codePoint)),
];
assert.deepEqual(vectors.unicode_whitespace, expectedWhitespace, 'fixture must pin the exact Unicode White_Space set');
const python = process.env.PYTHON
  || (fs.existsSync(path.join(root, '.venv', 'bin', 'python')) ? path.join(root, '.venv', 'bin', 'python') : 'python3');

function outcome(callback) {
  try {
    return { ok: true, value: callback() };
  } catch {
    return { ok: false };
  }
}

function javascriptTranscript(inputs) {
  return inputs.map((input) => ({
    normalize: outcome(() => normalize(input)),
    validate: validate(input),
    checkDigit: outcome(() => checkDigit(input)),
    verify: verifyCheckDigit(input),
  }));
}

const inputs = new Set([
  ...vectors.normalize.map((entry) => entry.input),
  ...vectors.normalize_rejection,
  ...vectors.validate.map((entry) => entry.input),
  ...vectors.separators.map((entry) => entry.input),
  ...vectors.unicode_whitespace.map((whitespace) => `AC${whitespace}DF`),
  ...vectors.check_digit.map((entry) => entry.code),
  ...vectors.check_digit_rejection,
  ...vectors.verify.map((entry) => entry.input),
]);

for (let codePoint = 0; codePoint <= 0x7f; codePoint++) {
  inputs.add(`AC${String.fromCodePoint(codePoint)}DF`);
}
for (const codePoint of [0x0085, 0x00a0, 0x1680, 0x2000, 0x200a, 0x200b, 0x2028, 0x2029, 0x202f, 0x205f, 0x3000, 0xfeff]) {
  inputs.add(`AC${String.fromCodePoint(codePoint)}DF`);
}

const corpusCharacters = `${ALPHABET}${ALPHABET.toLowerCase()}BEILOQSTVXZ-_. \t\n\u0085\u00a0\u2003\u200b\ufeff`;
let state = 0x25c0ffee;
function nextIndex(limit) {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return state % limit;
}
for (let caseIndex = 0; caseIndex < 256; caseIndex++) {
  const length = 1 + nextIndex(32);
  let value = '';
  for (let index = 0; index < length; index++) value += corpusCharacters[nextIndex(corpusCharacters.length)];
  inputs.add(value);
}

const cases = [...inputs];
const expected = javascriptTranscript(cases);
assert.ok(
  fs.readFileSync(path.join(root, 'CONFORMANCE.md'), 'utf8').includes(`contains ${cases.length} deterministic cases`),
  'CONFORMANCE.md must report the current cross-runtime case count'
);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    input: JSON.stringify(cases),
    env: { ...process.env, GOCACHE: path.join(root, '.gocache'), GOWORK: 'off' },
    ...options,
  });
  if (result.status !== 0) {
    process.stderr.write(result.stdout || '');
    process.stderr.write(result.stderr || '');
    process.exit(result.status ?? 1);
  }
  return JSON.parse(result.stdout);
}

const pythonSource = String.raw`
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(sys.argv[1])))
import hardguard25

def outcome(callback):
    try:
        return {"ok": True, "value": callback()}
    except Exception:
        return {"ok": False}

rows = []
for value in json.load(sys.stdin):
    rows.append({
        "normalize": outcome(lambda value=value: hardguard25.normalize(value)),
        "validate": hardguard25.validate(value),
        "checkDigit": outcome(lambda value=value: hardguard25.check_digit(value)),
        "verify": hardguard25.verify_check_digit(value),
    })
json.dump(rows, sys.stdout, ensure_ascii=False)
`;

const pythonObserved = run(python, ['-c', pythonSource, path.join(root, 'python')]);
assert.deepEqual(pythonObserved, expected, 'Python public API transcript must match JavaScript');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hardguard25-cross-runtime-'));
try {
  fs.writeFileSync(path.join(temp, 'go.mod'), `module hardguard25-conformance-check\n\ngo 1.21\n\nrequire github.com/snapsynapse/hardguard25/go v0.0.0\n\nreplace github.com/snapsynapse/hardguard25/go => ${path.join(root, 'go')}\n`);
  fs.writeFileSync(path.join(temp, 'main.go'), String.raw`package main

import (
    "encoding/json"
    "os"

    hardguard25 "github.com/snapsynapse/hardguard25/go"
)

type outcome struct {
    OK bool ` + '`json:"ok"`' + `
    Value string ` + '`json:"value,omitempty"`' + `
}

type row struct {
    Normalize outcome ` + '`json:"normalize"`' + `
    Validate bool ` + '`json:"validate"`' + `
    CheckDigit outcome ` + '`json:"checkDigit"`' + `
    Verify bool ` + '`json:"verify"`' + `
}

func main() {
    var inputs []string
    if err := json.NewDecoder(os.Stdin).Decode(&inputs); err != nil {
        panic(err)
    }
    rows := make([]row, 0, len(inputs))
    for _, input := range inputs {
        normalized, normalizeErr := hardguard25.Normalize(input)
        digit, digitErr := hardguard25.CheckDigit(input)
        verified, verifyErr := hardguard25.VerifyCheckDigit(input)
        digitOutcome := outcome{OK: digitErr == nil}
        if digitErr == nil {
            digitOutcome.Value = string(digit)
        }
        rows = append(rows, row{
            Normalize: outcome{OK: normalizeErr == nil, Value: normalized},
            Validate: hardguard25.Validate(input),
            CheckDigit: digitOutcome,
            Verify: verifyErr == nil && verified,
        })
    }
    if err := json.NewEncoder(os.Stdout).Encode(rows); err != nil {
        panic(err)
    }
}
`);
  const goObserved = run('go', ['run', '.'], { cwd: temp });
  assert.deepEqual(goObserved, expected, 'Go public API transcript must match JavaScript');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

console.log(`cross-runtime public API parity passed (${cases.length} deterministic cases)`);
