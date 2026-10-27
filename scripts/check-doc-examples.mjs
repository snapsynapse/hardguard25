import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ALPHABET, checkDigit, verifyCheckDigit } from '../js/index.js';

const conformance = JSON.parse(fs.readFileSync('conformance/vectors.json', 'utf8'));
const example = conformance.check_digit.find((vector) => vector.code === 'AC3H7PUW');
assert.ok(example, 'conformance fixture must include the public quickstart example');

const files = [
  'README.md',
  'js/README.md',
  'python/README.md',
  'skills/hardguard25/SKILL.md',
];

const requiredResultLines = {
  'README.md': [
    `checkDigit("${example.code}");              // "${example.digit}"`,
    `check_digit("${example.code}")              # "${example.digit}"`,
    `hardguard25.CheckDigit("${example.code}")  // '${example.digit}'`,
  ],
  'python/README.md': [
    `check_digit("${example.code}")           # "${example.digit}"`,
  ],
  'js/README.md': [
    `checkDigit("${example.code}");              // "${example.digit}"`,
  ],
};

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const fullCodes = [...text.matchAll(/AC3H7PUW([0-9ACDFGHJKMNPRUWY])/g)];
  assert.ok(fullCodes.length > 0, `${file}: expected a check-digit verification example`);
  for (const match of fullCodes) {
    assert.equal(
      match[1],
      example.digit,
      `${file}: AC3H7PUW must use conformance check digit ${example.digit}`
    );
  }
  for (const line of requiredResultLines[file] ?? []) {
    assert.ok(text.includes(line), `${file}: missing or stale result line: ${line}`);
  }
}

const spec = fs.readFileSync('SPEC.md', 'utf8');
const printedVectors = [...spec.matchAll(/Input bytes \(hex\): ([0-9a-f ]+)\nHardGuard25-(\d+):\s+([0-9ACDFGHJKMNPRUWY]+)/g)]
  .map((match) => ({ bytes_hex: match[1], length: Number(match[2]), output: match[3] }));
assert.deepEqual(printedVectors, conformance.deterministic_generation, 'spec generation examples must match complete shared fixtures');
for (const vector of printedVectors) {
  const output = vector.bytes_hex.split(' ').map((byte) => Number.parseInt(byte, 16))
    .filter((byte) => byte < 225).slice(0, vector.length).map((byte) => ALPHABET[byte % 25]).join('');
  assert.equal(output, vector.output, 'spec bytes must reproduce the stated output');
}

const source = fs.readFileSync('js/index.js', 'utf8');
const checksumExamples = [...source.matchAll(/\* checkDigit\('([^']+)'\); \/\/ '([^']+)'/g)];
assert.ok(checksumExamples.length > 0, 'source must retain an executable checksum example');
for (const [, code, digit] of checksumExamples) assert.equal(checkDigit(code), digit);
const verifyExamples = [...source.matchAll(/\* verifyCheckDigit\('([^']+)'\); \/\/ (true|false)/g)];
assert.ok(verifyExamples.length > 0, 'source must retain an executable verification example');
for (const [, code, expected] of verifyExamples) assert.equal(verifyCheckDigit(code), expected === 'true');
for (const [, code, length] of source.matchAll(/\* \/\/ '([^']+)' \(length (\d+)\)/g)) {
  assert.equal(code.length, Number(length), 'generated checksum example must have the documented length');
  assert.equal(verifyCheckDigit(code), true, 'generated checksum example must verify');
}

console.log('documentation example check passed');
