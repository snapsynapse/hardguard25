# Human Factors Evidence

HardGuard25 is a conservative identifier alphabet for codes that humans read, type, print, dictate, or inspect in support workflows. It reduces avoidable transcription risk by removing characters with common visual, phonetic, OCR, or dyslexia-relevant ambiguity.

## Design Basis

- Digits remain available because users expect numeric ordering, versions, quantities, and dates to stay recognizable.
- Letters are removed when they compete with a digit or another retained letter in common fonts or real-world contexts.
- Separators are display-only. Canonical storage remains uppercase ASCII without punctuation.
- Grouping in chunks of 4 or 5 supports scanning and verbal confirmation without changing the identifier value.

## Confusability Risks Addressed

| Removed | Primary risk |
|---|---|
| O | Confusable with zero |
| I | Confusable with one and lowercase l |
| L | Confusable with one and uppercase I |
| B | Confusable with eight |
| S | Confusable with five |
| Z | Confusable with two |
| E | Confusable with three in some handwriting, OCR, and dyslexia-sensitive contexts |
| Q | Confusable with O and P-like forms in some typefaces |
| V | Confusable with U in some typefaces and speech contexts |
| T | Can resemble plus signs or separator marks in constrained displays |
| X | Collides with multiplication marks and varies by locale/context |

## Accessibility and Print Guidance

- Use monospaced or semi-monospaced typefaces for printed IDs.
- Avoid thin, condensed, decorative, or low-contrast typography.
- Print at a size suitable for the reading distance and expected lighting.
- Preserve chunk separators in UI and print, but strip them for storage and comparison.
- Use the optional check digit when humans manually enter IDs.

## Limits

HardGuard25 reduces predictable confusion; it does not prove zero-error transcription. The check digit is a lightweight weighted checksum that catches many substitutions and most adjacent transpositions, but it is not a cryptographic integrity check and does not catch every possible edit. For security-sensitive tokens, use cryptographic randomness and appropriate authentication controls in addition to the alphabet.

## Evaluation Artifacts

The shared conformance vectors profile normalization, validation, checksum behavior, substitution detection, transposition detection, and deterministic rejection sampling. See [CONFORMANCE.md](CONFORMANCE.md) for the current cross-language status.
