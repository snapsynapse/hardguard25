export interface GenerateOptions {
  readonly checkDigit?: boolean;
}

export const ALPHABET: string;
export const ALPHABET_SET: ReadonlySet<string>;
export const CHAR_TO_INDEX: ReadonlyMap<string, number>;

export function generate(length: number, options?: GenerateOptions): string;
export function validate(input: unknown): boolean;
export function normalize(input: string): string;
export function checkDigit(code: string): string;
export function verifyCheckDigit(codeWithCheck: unknown): boolean;

declare const hardguard25: {
  readonly ALPHABET: typeof ALPHABET;
  readonly ALPHABET_SET: typeof ALPHABET_SET;
  readonly CHAR_TO_INDEX: typeof CHAR_TO_INDEX;
  readonly generate: typeof generate;
  readonly validate: typeof validate;
  readonly normalize: typeof normalize;
  readonly checkDigit: typeof checkDigit;
  readonly verifyCheckDigit: typeof verifyCheckDigit;
};

export default hardguard25;
