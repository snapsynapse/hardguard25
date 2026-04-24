/**
 * HardGuard25 - A human-friendly unique ID alphabet
 * 25 unambiguous characters for easy reading and transcription
 */

import crypto from 'crypto';

const ALPHABET = '0123456789ACDFGHJKMNPRUWY';

/**
 * Set of valid HardGuard25 characters for quick membership testing
 * @type {Set<string>}
 */
const ALPHABET_SET = new Set(ALPHABET);

/**
 * Map from character to its index (0-24) in the alphabet
 * @type {Map<string, number>}
 */
const CHAR_TO_INDEX = new Map();
for (let i = 0; i < ALPHABET.length; i++) {
  CHAR_TO_INDEX.set(ALPHABET[i], i);
}

/**
 * Generate a random HardGuard25 ID
 * Uses rejection sampling to ensure uniform distribution
 *
 * @param {number} length - Length of ID to generate
 * @param {Object} options - Configuration options
 * @param {boolean} [options.checkDigit=false] - Append a check digit (returns length+1 chars)
 * @returns {string} Random HardGuard25 ID in uppercase
 *
 * @example
 * const id = generate(12);
 * // '3KMN7FUA9CD1'
 *
 * const idWithCheck = generate(12, { checkDigit: true });
 * // '3KMN7FUA9CD1K' (length 13)
 */
export function generate(length, options = {}) {
  if (!Number.isInteger(length) || length < 1) {
    throw new Error('HardGuard25: length must be a positive integer');
  }

  const { checkDigit = false } = options;
  const targetLength = length;
  let result = '';

  while (result.length < targetLength) {
    // Generate random bytes - allocate enough for rejection sampling
    // Since we accept ~88% of bytes (225/256), we need slightly more
    const needed = Math.ceil((targetLength - result.length) * 1.2);
    const bytes = new Uint8Array(needed);

    if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
      // Browser environment
      globalThis.crypto.getRandomValues(bytes);
    } else {
      // Node.js environment
      crypto.randomFillSync(bytes);
    }

    // Process bytes with rejection sampling
    for (const byte of bytes) {
      if (result.length >= targetLength) break;
      // Rejection sampling: only accept bytes < 225 (which is 25 * 9)
      if (byte < 225) {
        result += ALPHABET[byte % 25];
      }
    }
  }

  if (checkDigit) {
    result += computeCheckDigit(result);
  }

  return result;
}

/**
 * Validate that a string is a valid HardGuard25 ID
 * Normalizes input first (trims, removes separators, uppercases)
 *
 * @param {string} input - ID to validate
 * @returns {boolean} True if valid HardGuard25 ID
 *
 * @example
 * validate('3KMN-7FUA-9CD1'); // true
 * validate('3KMN7FUA9CD1'); // true
 * validate('3KMN7FUA9CDB'); // false (B is excluded)
 */
export function validate(input) {
  if (typeof input !== 'string') {
    return false;
  }

  try {
    const normalized = normalize(input);
    const regex = /^[0-9ACDFGHJKMNPRUWY]+$/;
    return regex.test(normalized);
  } catch {
    return false;
  }
}

/**
 * Normalize a HardGuard25 ID string
 * Trims whitespace, removes separators (hyphens, spaces, underscores, dots), and uppercases
 *
 * @param {string} input - ID to normalize
 * @returns {string} Normalized ID
 * @throws {Error} If input contains invalid characters after normalization
 *
 * @example
 * normalize('3kMn-7fua_9cd.1'); // '3KMN7FUA9CD1'
 */
export function normalize(input) {
  if (typeof input !== 'string') {
    throw new Error('HardGuard25: Input must be a string');
  }

  // Trim and remove separators
  let normalized = input.trim().replace(/[-\s_\.]/g, '').toUpperCase();

  // Check for invalid characters
  for (const char of normalized) {
    if (!ALPHABET_SET.has(char)) {
      throw new Error(`HardGuard25: Invalid character '${char}' in input`);
    }
  }

  return normalized;
}

/**
 * Compute a Mod-25 weighted checksum for a HardGuard25 code
 * Weighted sum: sum of (charIndex[i] * (i+1)) for i in 0..len-1
 * Returns the character at position (sum % 25) in the alphabet
 *
 * @param {string} code - HardGuard25 code (without check digit)
 * @returns {string} Single character check digit
 *
 * @example
 * checkDigit('3KMN7FUA9CD1'); // 'K'
 */
export function checkDigit(code) {
  if (typeof code !== 'string' || code.length === 0) {
    throw new Error('HardGuard25: Code must be a non-empty string');
  }

  let sum = 0;
  for (let i = 0; i < code.length; i++) {
    const char = code[i].toUpperCase();
    if (!CHAR_TO_INDEX.has(char)) {
      throw new Error(`HardGuard25: Invalid character '${char}' in code`);
    }
    sum += CHAR_TO_INDEX.get(char) * (i + 1);
  }

  return ALPHABET[sum % 25];
}

/**
 * Alias for checkDigit() for backward compatibility and clarity
 * @private
 */
function computeCheckDigit(code) {
  return checkDigit(code);
}

/**
 * Verify that a HardGuard25 code with check digit is valid
 * Strips the last character, recomputes the check digit, and compares
 *
 * @param {string} codeWithCheck - HardGuard25 code with check digit appended
 * @returns {boolean} True if check digit matches
 *
 * @example
 * verifyCheckDigit('3KMN7FUA9CD1K'); // true (assuming K is correct)
 * verifyCheckDigit('3KMN7FUA9CD1Z'); // false (Z is wrong)
 */
export function verifyCheckDigit(codeWithCheck) {
  if (typeof codeWithCheck !== 'string' || codeWithCheck.length < 2) {
    return false;
  }

  try {
    const normalized = normalize(codeWithCheck);
    if (normalized.length < 2) {
      return false;
    }

    const code = normalized.slice(0, -1);
    const providedCheck = normalized.slice(-1);
    const computedCheck = checkDigit(code);
    return providedCheck === computedCheck;
  } catch {
    return false;
  }
}

// Named exports
export {
  ALPHABET,
  ALPHABET_SET,
  CHAR_TO_INDEX
};

// Default export
export default {
  ALPHABET,
  ALPHABET_SET,
  CHAR_TO_INDEX,
  generate,
  validate,
  normalize,
  checkDigit,
  verifyCheckDigit
};
