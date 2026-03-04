import test from 'node:test';
import assert from 'node:assert';
import {
  ALPHABET,
  ALPHABET_SET,
  CHAR_TO_INDEX,
  generate,
  validate,
  normalize,
  checkDigit,
  verifyCheckDigit
} from './index.js';

// Test suite
test('HardGuard25 Alphabet', async (t) => {
  await t.test('alphabet is exactly 25 characters', () => {
    assert.strictEqual(ALPHABET.length, 25, 'ALPHABET should have 25 characters');
  });

  await t.test('alphabet matches expected character set', () => {
    const expected = '0123456789ACDFGHJKMNPRUWY';
    assert.strictEqual(ALPHABET, expected, 'ALPHABET should match expected set');
  });

  await t.test('no excluded characters appear in alphabet', () => {
    const excluded = ['B', 'E', 'I', 'L', 'O', 'Q', 'S', 'T', 'V', 'X', 'Z'];
    for (const char of excluded) {
      assert.strictEqual(
        ALPHABET.includes(char),
        false,
        `Excluded character '${char}' should not appear in ALPHABET`
      );
    }
  });

  await t.test('ALPHABET_SET contains exactly 25 characters', () => {
    assert.strictEqual(ALPHABET_SET.size, 25, 'ALPHABET_SET should have 25 members');
  });

  await t.test('ALPHABET_SET matches ALPHABET', () => {
    for (const char of ALPHABET) {
      assert.strictEqual(
        ALPHABET_SET.has(char),
        true,
        `Character '${char}' should be in ALPHABET_SET`
      );
    }
  });

  await t.test('CHAR_TO_INDEX has 25 entries', () => {
    assert.strictEqual(CHAR_TO_INDEX.size, 25, 'CHAR_TO_INDEX should have 25 entries');
  });

  await t.test('CHAR_TO_INDEX maps characters to correct indices', () => {
    for (let i = 0; i < ALPHABET.length; i++) {
      const char = ALPHABET[i];
      assert.strictEqual(
        CHAR_TO_INDEX.get(char),
        i,
        `Character '${char}' should map to index ${i}`
      );
    }
  });
});

test('generate()', async (t) => {
  await t.test('returns string of correct length', () => {
    for (const length of [8, 12, 16, 32]) {
      const id = generate(length);
      assert.strictEqual(id.length, length, `Generated ID should have length ${length}`);
    }
  });

  await t.test('returns only valid characters (500 samples)', () => {
    for (let i = 0; i < 500; i++) {
      const id = generate(12);
      for (const char of id) {
        assert.strictEqual(
          ALPHABET_SET.has(char),
          true,
          `Generated character '${char}' should be in ALPHABET`
        );
      }
    }
  });

  await t.test('returns uppercase characters', () => {
    for (let i = 0; i < 50; i++) {
      const id = generate(16);
      assert.strictEqual(id, id.toUpperCase(), 'Generated ID should be uppercase');
    }
  });

  await t.test('with checkDigit option returns length+1', () => {
    for (const length of [8, 12, 16]) {
      const id = generate(length, { checkDigit: true });
      assert.strictEqual(id.length, length + 1, `ID with check digit should have length ${length + 1}`);
    }
  });

  await t.test('with checkDigit option returns valid check digit', () => {
    for (let i = 0; i < 50; i++) {
      const id = generate(12, { checkDigit: true });
      assert.strictEqual(
        ALPHABET_SET.has(id[id.length - 1]),
        true,
        'Check digit should be a valid character'
      );
    }
  });

  await t.test('throws on invalid length parameter', () => {
    assert.throws(() => generate(0), /positive integer/);
    assert.throws(() => generate(-5), /positive integer/);
    assert.throws(() => generate(3.5), /positive integer/);
    assert.throws(() => generate('10'), /positive integer/);
  });

  await t.test('distribution: all 25 characters appear in large sample', () => {
    const seen = new Set();
    let totalChars = 0;

    for (let i = 0; i < 500; i++) {
      const id = generate(10);
      for (const char of id) {
        seen.add(char);
        totalChars++;
      }
    }

    assert.strictEqual(
      seen.size,
      25,
      `All 25 characters should appear in 5000 generated characters (got ${seen.size})`
    );
  });

  await t.test('distribution: characters appear with reasonable frequency', () => {
    const counts = new Map();
    for (const char of ALPHABET) {
      counts.set(char, 0);
    }

    // Generate 5000 characters
    for (let i = 0; i < 500; i++) {
      const id = generate(10);
      for (const char of id) {
        counts.set(char, counts.get(char) + 1);
      }
    }

    const totalChars = 5000;
    const expectedFrequency = totalChars / 25;
    const tolerance = expectedFrequency * 0.5; // Allow 50% deviation

    let allReasonable = true;
    for (const [char, count] of counts) {
      const deviation = Math.abs(count - expectedFrequency);
      if (deviation > tolerance) {
        allReasonable = false;
        console.log(`Character '${char}' frequency ${count} deviates by ${deviation.toFixed(0)}`);
      }
    }

    assert.strictEqual(allReasonable, true, 'Character distribution should be reasonably uniform');
  });
});

test('validate()', async (t) => {
  await t.test('accepts valid HardGuard25 IDs', () => {
    const validIds = [
      '0',
      '123456789',
      '3KMN7FUA9CD1',
      'ACDFGHJKMNPRUWY',
      '0123456789ACDFGHJKMNPRUWY'
    ];

    for (const id of validIds) {
      assert.strictEqual(validate(id), true, `Should validate '${id}'`);
    }
  });

  await t.test('rejects IDs with excluded characters', () => {
    const excluded = ['B', 'E', 'I', 'L', 'O', 'Q', 'S', 'T', 'V', 'X', 'Z'];

    for (const char of excluded) {
      const invalidId = `3KMN${char}7FUA`;
      assert.strictEqual(validate(invalidId), false, `Should reject '${invalidId}' (contains '${char}')`);
    }
  });

  await t.test('accepts lowercase input (normalizes to uppercase)', () => {
    assert.strictEqual(validate('3kmn7fua9cd1'), true, 'Should accept lowercase');
    assert.strictEqual(validate('acdfghjkmnpruwy'), true, 'Should accept lowercase alphabet');
  });

  await t.test('accepts IDs with separators', () => {
    assert.strictEqual(validate('3KMN-7FUA-9CD1'), true, 'Should accept hyphens');
    assert.strictEqual(validate('3KMN 7FUA 9CD1'), true, 'Should accept spaces');
    assert.strictEqual(validate('3KMN_7FUA_9CD1'), true, 'Should accept underscores');
    assert.strictEqual(validate('3KMN.7FUA.9CD1'), true, 'Should accept dots');
    assert.strictEqual(validate('3KMN-7FUA_9CD.1'), true, 'Should accept mixed separators');
  });

  await t.test('handles leading/trailing whitespace', () => {
    assert.strictEqual(validate('  3KMN7FUA9CD1  '), true, 'Should trim whitespace');
    assert.strictEqual(validate('\t3KMN7FUA9CD1\n'), true, 'Should trim tabs and newlines');
  });

  await t.test('rejects non-string input', () => {
    assert.strictEqual(validate(null), false, 'Should reject null');
    assert.strictEqual(validate(undefined), false, 'Should reject undefined');
    assert.strictEqual(validate(123), false, 'Should reject number');
    assert.strictEqual(validate({}), false, 'Should reject object');
  });

  await t.test('rejects empty string', () => {
    assert.strictEqual(validate(''), false, 'Should reject empty string');
    assert.strictEqual(validate('   '), false, 'Should reject whitespace-only string');
  });

  await t.test('rejects IDs with completely invalid characters', () => {
    assert.strictEqual(validate('3KMN7FUA!'), false, 'Should reject special characters');
    assert.strictEqual(validate('3KMN7FUA@'), false, 'Should reject @');
    assert.strictEqual(validate('hello world'), false, 'Should reject non-HG25 chars');
  });
});

test('normalize()', async (t) => {
  await t.test('returns normalized uppercase string', () => {
    assert.strictEqual(normalize('3kmn7fua9cd1'), '3KMN7FUA9CD1');
    assert.strictEqual(normalize('ACDFGHJKMNPRUWY'), 'ACDFGHJKMNPRUWY');
  });

  await t.test('removes separators', () => {
    assert.strictEqual(normalize('3KMN-7FUA-9CD1'), '3KMN7FUA9CD1');
    assert.strictEqual(normalize('3KMN 7FUA 9CD1'), '3KMN7FUA9CD1');
    assert.strictEqual(normalize('3KMN_7FUA_9CD1'), '3KMN7FUA9CD1');
    assert.strictEqual(normalize('3KMN.7FUA.9CD1'), '3KMN7FUA9CD1');
  });

  await t.test('handles mixed separators', () => {
    assert.strictEqual(normalize('3KMN-7FUA_9CD.1'), '3KMN7FUA9CD1');
  });

  await t.test('trims whitespace', () => {
    assert.strictEqual(normalize('  3KMN7FUA9CD1  '), '3KMN7FUA9CD1');
    assert.strictEqual(normalize('\t3KMN7FUA9CD1\n'), '3KMN7FUA9CD1');
  });

  await t.test('is idempotent', () => {
    const input = '3KMN-7FUA_9CD.1';
    const first = normalize(input);
    const second = normalize(first);
    assert.strictEqual(first, second, 'normalize() should be idempotent');
  });

  await t.test('throws on invalid characters', () => {
    assert.throws(() => normalize('3KMN7FUA!'), /Invalid character/);
    assert.throws(() => normalize('3KMNBFUA'), /Invalid character.*B/);
    assert.throws(() => normalize('3KMNEFUA'), /Invalid character.*E/);
  });

  await t.test('throws on completely invalid input', () => {
    assert.throws(() => normalize('!!!'), /Invalid character/);
    assert.throws(() => normalize('hello world'), /Invalid character/);
  });

  await t.test('returns empty string for empty input', () => {
    assert.strictEqual(normalize(''), '');
  });

  await t.test('throws on non-string input', () => {
    assert.throws(() => normalize(null), /must be a string/);
    assert.throws(() => normalize(undefined), /must be a string/);
    assert.throws(() => normalize(123), /must be a string/);
  });
});

test('checkDigit()', async (t) => {
  await t.test('returns a single character', () => {
    const digit = checkDigit('3KMN7FUA9CD1');
    assert.strictEqual(typeof digit, 'string');
    assert.strictEqual(digit.length, 1);
  });

  await t.test('returns a valid HardGuard25 character', () => {
    for (let i = 0; i < 50; i++) {
      const code = generate(12);
      const digit = checkDigit(code);
      assert.strictEqual(ALPHABET_SET.has(digit), true, `Check digit should be valid`);
    }
  });

  await t.test('is consistent', () => {
    const code = '3KMN7FUA9CD1';
    const digit1 = checkDigit(code);
    const digit2 = checkDigit(code);
    assert.strictEqual(digit1, digit2, 'Check digit should be consistent');
  });

  await t.test('produces different digits for different codes', () => {
    const code1 = '0000000000000';
    const code2 = '1111111111111';
    const digit1 = checkDigit(code1);
    const digit2 = checkDigit(code2);
    assert.notStrictEqual(digit1, digit2, 'Different codes should produce different check digits');
  });

  await t.test('is case-insensitive', () => {
    const code = '3KMN7FUA9CD1';
    const digit1 = checkDigit(code);
    const digit2 = checkDigit(code.toLowerCase());
    assert.strictEqual(digit1, digit2, 'Check digit should work with lowercase input');
  });

  await t.test('is case-insensitive (uppercase)', () => {
    const code = '3kmn7fua9cd1';
    const digit1 = checkDigit(code);
    const digit2 = checkDigit(code.toUpperCase());
    assert.strictEqual(digit1, digit2, 'Check digit should work with uppercase input');
  });

  await t.test('throws on empty string', () => {
    assert.throws(() => checkDigit(''), /non-empty string/);
  });

  await t.test('throws on invalid characters', () => {
    assert.throws(() => checkDigit('3KMNBFUA'), /Invalid character/);
  });

  await t.test('throws on non-string input', () => {
    assert.throws(() => checkDigit(null), /non-empty string/);
    assert.throws(() => checkDigit(123), /non-empty string/);
  });
});

test('verifyCheckDigit()', async (t) => {
  await t.test('returns true for valid check digit', () => {
    for (let i = 0; i < 50; i++) {
      const code = generate(12);
      const digit = checkDigit(code);
      const codeWithCheck = code + digit;
      assert.strictEqual(verifyCheckDigit(codeWithCheck), true, 'Should verify valid check digit');
    }
  });

  await t.test('returns false for corrupted check digit', () => {
    const code = '3KMN7FUA9CD1';
    const validCheck = checkDigit(code);

    // Find a different character to use as wrong check digit
    let wrongCheck = ALPHABET[0];
    if (wrongCheck === validCheck) {
      wrongCheck = ALPHABET[1];
    }

    const corruptedId = code + wrongCheck;
    assert.strictEqual(
      verifyCheckDigit(corruptedId),
      false,
      'Should reject corrupted check digit'
    );
  });

  await t.test('is case-insensitive', () => {
    const code = '3KMN7FUA9CD1';
    const digit = checkDigit(code);
    const codeWithCheck = code + digit;

    assert.strictEqual(verifyCheckDigit(codeWithCheck.toLowerCase()), true, 'Should verify lowercase');
    assert.strictEqual(verifyCheckDigit(codeWithCheck.toUpperCase()), true, 'Should verify uppercase');
  });

  await t.test('returns false for too-short input', () => {
    assert.strictEqual(verifyCheckDigit(''), false, 'Should reject empty string');
    assert.strictEqual(verifyCheckDigit('A'), false, 'Should reject single character');
  });

  await t.test('returns false for non-string input', () => {
    assert.strictEqual(verifyCheckDigit(null), false);
    assert.strictEqual(verifyCheckDigit(undefined), false);
    assert.strictEqual(verifyCheckDigit(123), false);
  });

  await t.test('returns false for invalid characters', () => {
    assert.strictEqual(verifyCheckDigit('3KMNBFUA9CD1B'), false, 'Should reject invalid chars');
  });

  await t.test('can verify multiple digits', () => {
    const code = 'A1D2F3G4';
    const digit1 = checkDigit(code);
    const digit2 = checkDigit(code + digit1);

    const id2Check = code + digit1 + digit2;
    assert.strictEqual(verifyCheckDigit(id2Check), true, 'Should verify second check digit');
  });
});

test('Integration', async (t) => {
  await t.test('generate with checkDigit produces verifiable ID', () => {
    for (let i = 0; i < 25; i++) {
      const id = generate(12, { checkDigit: true });
      assert.strictEqual(verifyCheckDigit(id), true, 'Generated ID with check digit should verify');
    }
  });

  await t.test('normalize and validate round-trip', () => {
    const ids = [
      '3KMN-7FUA-9CD1',
      '  ACDFG-HJKMN  ',
      '0_1_2_3_4_5_6',
      '9.8.7.6.5.4.3'
    ];

    for (const id of ids) {
      const normalized = normalize(id);
      assert.strictEqual(validate(normalized), true, `Normalized '${id}' should validate`);
    }
  });

  await t.test('checkDigit and verifyCheckDigit round-trip', () => {
    for (let i = 0; i < 50; i++) {
      const code = generate(12);
      const digit = checkDigit(code);
      const withCheck = code + digit;
      assert.strictEqual(verifyCheckDigit(withCheck), true, 'Round-trip should succeed');
    }
  });
});
