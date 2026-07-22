import assert from 'node:assert/strict';
import fs from 'node:fs';

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

console.log('documentation example check passed');
