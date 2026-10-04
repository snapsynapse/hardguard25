# Conformance Report

Report date: 2026-10-03

Fixture version: `1.3.7`

## Implementations

| Runtime | Package version | Fixture coverage | Status |
|---|---:|---|---|
| JavaScript | 1.3.7 | normalize, validation, exact Unicode White_Space boundaries, excluded chars, non-ASCII rejection, check digit, verification, substitution profile, transposition profile, production-generator rejection sampling and entropy failure, packed TypeScript consumer | Passing locally |
| Python | 1.3.7 | normalize, validation, exact Unicode White_Space boundaries, excluded chars, non-ASCII rejection, check digit, verification, substitution profile, transposition profile, production-generator rejection sampling and entropy failure, exact wheel and sdist consumer | Passing locally |
| Go | module package | normalize, validation, exact Unicode White_Space boundaries, excluded chars, non-ASCII rejection, check digit, verification, substitution profile, transposition profile, production-generator rejection sampling and entropy failure | Passing locally |

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

## Repository Guidance Checks

Current repository verification independently computes namespace sizes, rounded payload entropy, and birthday-collision thresholds before checking every published guidance mirror. It also rejects the known stale values corrected after 1.3.7. Runtime behavior vectors now pin the exact Unicode White_Space set and adjacent rejected code points while retaining fixture version 1.3.7 until the next release is selected.

The canonical verifier also compares JavaScript, Python, and Go public-API transcripts across shared vectors, every ASCII insertion boundary, Unicode separator boundaries, and a fixed-seed generated corpus. The current parity corpus contains 459 deterministic cases. Package verification enforces exact npm, wheel, and sdist inventories, metadata, source bytes, and license bytes.
