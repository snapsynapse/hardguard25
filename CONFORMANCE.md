# Conformance Report

Report date: 2026-09-05

Fixture version: `1.3.7`

## Implementations

| Runtime | Package version | Fixture coverage | Status |
|---|---:|---|---|
| JavaScript | 1.3.7 | normalize, validation, rejection boundaries, excluded chars, non-ASCII rejection, separators, check digit, verification, substitution profile, transposition profile, deterministic generation, packed TypeScript consumer | Passing locally |
| Python | 1.3.7 | normalize, validation, rejection boundaries, excluded chars, non-ASCII rejection, separators, check digit, verification, substitution profile, transposition profile, deterministic generation, wheel consumer | Passing locally |
| Go | module package | normalize, validation, rejection boundaries, excluded chars, non-ASCII rejection, separators, check digit, verification, substitution profile, transposition profile, deterministic generation | Passing locally |

## Check Digit Profile

The Mod-25 weighted check digit is a lightweight human-entry aid. Current vectors profile observed detection behavior instead of claiming complete edit detection.

| Code | Check digit | Single substitutions caught | Adjacent transpositions caught |
|---|---:|---:|---:|
| `ACDF0G7HJ2KMNP3R` | `W` | 372 / 384 | 15 / 15 |
| `0123456789` | `5` | 232 / 240 | n/a |
| `123456789ACDF` | `N` | 304 / 312 | 12 / 12 |
| `ACDFGHJKMNPRUWY` | `P` | 348 / 360 | 14 / 14 |

## Local Verification Commands

Literal
```bash
npm run verify
```

Browser accessibility checks require installed Playwright Chromium.

Literal
```bash
npm run verify:browser
```

CI runs equivalent checks on GitHub Actions for pull requests and pushes to `main`.
