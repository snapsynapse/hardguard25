import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as api from 'hardguard25';

const vectors = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const alphabet = '0123456789ACDFGHJKMNPRUWY';
assert.equal(api.ALPHABET, alphabet);
for (const { input, output } of [...vectors.normalize, ...vectors.separators]) assert.equal(api.normalize(input), output);
for (const input of [...vectors.normalize_rejection, ...vectors.non_ascii_rejection]) {
  assert.throws(() => api.normalize(input));
  assert.equal(api.validate(input), false);
}
for (const { input, valid } of vectors.validate) assert.equal(api.validate(input), valid);
for (const { code, digit } of vectors.check_digit) assert.equal(api.checkDigit(code), digit);
for (const input of vectors.check_digit_rejection) assert.throws(() => api.checkDigit(input));
for (const { input, valid } of vectors.verify) assert.equal(api.verifyCheckDigit(input), valid);
for (const { character, count, digit } of vectors.checksum_repeated || []) {
  const n = BigInt(count);
  const expected = alphabet[Number(BigInt(alphabet.indexOf(character)) * n * (n + 1n) / 2n % 25n)];
  assert.equal(digit, expected);
  assert.equal(api.checkDigit(character.repeat(count)), expected);
}
for (const length of [1, 8, 65537]) {
  const value = api.generate(length, { checkDigit: true });
  assert.equal(value.length, length + 1);
  assert.equal(api.validate(value), true);
  assert.equal(api.verifyCheckDigit(value), true);
}
const members = [...api.ALPHABET_SET], indices = [...api.CHAR_TO_INDEX];
try {
  api.ALPHABET_SET.clear(); api.ALPHABET_SET.add('B');
  api.CHAR_TO_INDEX.clear(); api.CHAR_TO_INDEX.set('A', 0);
  assert.equal(api.normalize('ac3h-7puw'), 'AC3H7PUW');
  assert.equal(api.validate('B'), false);
  assert.equal(api.checkDigit('AC3H7PUW'), 'N');
} finally {
  api.ALPHABET_SET.clear(); for (const value of members) api.ALPHABET_SET.add(value);
  api.CHAR_TO_INDEX.clear(); for (const entry of indices) api.CHAR_TO_INDEX.set(...entry);
}
console.log('installed npm conformance, independent checksum oracle, and lookup isolation passed');
