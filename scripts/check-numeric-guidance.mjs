import assert from 'node:assert/strict';
import fs from 'node:fs';

const alphabetSize = 25n;

function space(length) {
  return alphabetSize ** BigInt(length);
}

function bits(length) {
  return (length * Math.log2(Number(alphabetSize))).toFixed(1);
}

function scientific(length) {
  const value = Number(space(length));
  const exponent = Math.floor(Math.log10(value));
  const mantissa = (value / (10 ** exponent)).toFixed(2);
  return { mantissa, exponent };
}

function maxIdsBefore(length, probability) {
  const namespace = Number(space(length));
  const exponent = -2 * namespace * Math.log1p(-probability);
  const positiveRoot = (1 + Math.sqrt(1 + (4 * exponent))) / 2;
  return Math.floor(positiveRoot);
}

const guidance = [
  { length: 4, exact: '390625', bits: '18.6', display: '390,625' },
  { length: 5, exact: '9765625', bits: '23.2', display: '9,765,625' },
  { length: 6, exact: '244140625', bits: '27.9', display: '244,140,625' },
  { length: 7, exact: '6103515625', bits: '32.5', display: '6.1 billion' },
  { length: 8, exact: '152587890625', bits: '37.2', display: '152.6 billion' },
  { length: 12, exact: '59604644775390625', bits: '55.7', display: '5.96 x 10^16' },
  { length: 16, exact: '23283064365386962890625', bits: '74.3', display: '2.33 x 10^22' },
  { length: 20, exact: '9094947017729282379150390625', bits: '92.9', display: '9.09 x 10^27' },
  { length: 22, exact: '5684341886080801486968994140625', bits: '102.2', display: '5.68 x 10^30' },
];

for (const row of guidance) {
  assert.equal(space(row.length).toString(), row.exact, `unexpected namespace size for length ${row.length}`);
  assert.equal(bits(row.length), row.bits, `unexpected entropy rounding for length ${row.length}`);
  if (row.length >= 12) {
    const { mantissa, exponent } = scientific(row.length);
    assert.equal(`${mantissa} x 10^${exponent}`, row.display);
  }
}

const markdownTables = {
  'SPEC.md': guidance.map(({ length, bits: entropy, display }) =>
    `| ${length} | ${entropy} | ${display} |`),
  'README.md': guidance.map(({ length, bits: entropy, display }) =>
    `| ${length} | ${entropy} | ${display.replace(' x 10^16', ' × 10¹⁶').replace(' x 10^22', ' × 10²²').replace(' x 10^27', ' × 10²⁷').replace(' x 10^30', ' × 10³⁰')} |`),
  'python/README.md': guidance.map(({ length, bits: entropy, display }) =>
    `| ${length} | ${entropy} | ${display.replace(' x 10^16', ' × 10¹⁶').replace(' x 10^22', ' × 10²²').replace(' x 10^27', ' × 10²⁷').replace(' x 10^30', ' × 10³⁰')} |`),
  'docs/IMPLEMENTATION.md': [
    '| 4 | 18.6 | 390,625 |',
    '| 6 | 27.9 | 244 million |',
    '| 8 | 37.2 | 152.6 billion |',
    '| 12 | 55.7 | 5.96 x 10^16 |',
    '| 16 | 74.3 | 2.33 x 10^22 |',
    '| 20 | 92.9 | 9.09 x 10^27 |',
    '| 22 | 102.2 | 5.68 x 10^30 |',
  ],
};

for (const [file, rows] of Object.entries(markdownTables)) {
  const text = fs.readFileSync(file, 'utf8');
  for (const row of rows) {
    assert.equal(
      text.split(row).length - 1,
      1,
      `${file}: expected exactly one canonical numeric row prefix: ${row}`
    );
  }
}

const compactGuidance = {
  'docs/llms.txt': [
    '- 4 chars: 390,625 possible strings (small inventory, tickets)',
    '- 6 chars: 244 million (medium businesses)',
    '- 8 chars: 152 billion (large systems)',
    '- 12 chars: 59.6 quadrillion (internal tokens)',
    '- 16 chars: 2.33 x 10^22 (cross-system identifiers)',
    '- 20 chars: 9.09 x 10^27 (public tokens)',
  ],
  'skills/hardguard25/SKILL.md': [
    '| 4 | 390,625 | Small inventory, tickets |',
    '| 6 | 244 million | Medium businesses |',
    '| 8 | 152 billion | Large systems |',
    '| 12 | 59.6 quadrillion | Internal tokens |',
    '| 16 | 2.33 x 10^22 | Cross-system IDs |',
    '| 20 | 9.09 x 10^27 | Public tokens |',
  ],
  'docs/index.html': [
    '<tr><td>4</td><td class="num">390,625</td><td>Small inventory, tickets</td></tr>',
    '<tr><td>6</td><td class="num">244 million</td><td>Medium businesses</td></tr>',
    '<tr><td>8</td><td class="num">152 billion</td><td>Large systems</td></tr>',
    '<tr><td>12</td><td class="num">59.6 quadrillion</td><td>Internal tokens</td></tr>',
    '<tr><td>16</td><td class="num">2.33 &times; 10<sup>22</sup></td><td>Cross-system identifiers</td></tr>',
    '<tr><td>20</td><td class="num">9.09 &times; 10<sup>27</sup></td><td>Public tokens</td></tr>',
  ],
};

for (const [file, lines] of Object.entries(compactGuidance)) {
  const text = fs.readFileSync(file, 'utf8');
  for (const line of lines) {
    assert.equal(
      text.split(line).length - 1,
      1,
      `${file}: expected exactly one canonical numeric guidance line: ${line}`
    );
  }
}

const semanticLabels = {
  'SPEC.md': '| Length | Bits | Namespace Size | Typical Use |',
  'README.md': '| Length | Bits | Possible Strings | Typical Use |',
  'python/README.md': '| Length | Bits | Possible Strings | Typical Use |',
  'docs/IMPLEMENTATION.md': '| Length | Bits | Possible strings | Typical use |',
  'skills/hardguard25/SKILL.md': '| Length | Possible Strings | Use For |',
  'docs/index.html': '<th class="num">Possible payload strings</th>',
};
for (const [file, label] of Object.entries(semanticLabels)) {
  const text = fs.readFileSync(file, 'utf8');
  assert.equal(text.split(label).length - 1, 1, `${file}: expected exactly one semantic namespace label`);
}

const qualification = 'possible payload strings, not safe random issuance counts';
const checksumQualification = 'does not add random entropy';
for (const file of [...Object.keys(markdownTables), ...Object.keys(compactGuidance)]) {
  const text = fs.readFileSync(file, 'utf8');
  assert.ok(text.includes(qualification), `${file}: missing namespace versus issuance qualification`);
  assert.ok(text.includes(checksumQualification), `${file}: missing check-digit entropy qualification`);
}

const collisionLengths = [12, 14, 16, 18, 20, 22];
const spec = fs.readFileSync('SPEC.md', 'utf8');
assert.ok(
  spec.includes('p = 1 - exp(-k(k-1) / (2 * N^L))'),
  'SPEC.md: birthday-collision formula must use k(k-1) consistently with the table'
);
for (const length of collisionLengths) {
  const { mantissa, exponent } = scientific(length);
  const oneInBillion = maxIdsBefore(length, 1e-9).toLocaleString('en-US');
  const oneInTrillion = maxIdsBefore(length, 1e-12).toLocaleString('en-US');
  const row = `| ${length} | ${mantissa}e${exponent} | ${oneInBillion} | ${oneInTrillion} |`;
  assert.ok(spec.includes(row), `SPEC.md: missing canonical collision row: ${row}`);
}

const staleValues = [
  '59.6 trillion',
  '3.55 x 10^22',
  '3.55 × 10²²',
  '2.11 x 10^27',
  '2.11 × 10²⁷',
  '1.32 x 10^30',
  '1.32 × 10³⁰',
];

for (const file of [...Object.keys(markdownTables), ...Object.keys(compactGuidance)]) {
  const text = fs.readFileSync(file, 'utf8');
  for (const stale of staleValues) {
    assert.ok(!text.includes(stale), `${file}: stale numeric value remains: ${stale}`);
  }
}

console.log('numeric guidance check passed');
