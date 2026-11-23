# Conformance Report

Report date: 2026-11-22

Release 1.4.0 has exact-head CI and published npm/PyPI consumer evidence in `ops/releases/1.4.0.json`; the Go tag and proxy version are verified. Release 1.3.10 evidence remains in `ops/releases/1.3.10.json`, and historical 1.3.9 evidence in `ops/releases/1.3.9.json`.

Fixture version: `1.4.0`

## Implementations

| Runtime | Package version | Fixture coverage | Status |
|---|---:|---|---|
| JavaScript | 1.4.0 | normalize, validation, exact Unicode White_Space boundaries, excluded chars, non-ASCII rejection, check digit, verification, substitution profile, transposition profile, known undetected substitutions, rejection-message hygiene, production-generator rejection sampling and entropy failure, packed TypeScript consumer | Published candidate passed local and CI checks |
| Python | 1.4.0 | normalize, validation, exact Unicode White_Space boundaries, excluded chars, non-ASCII rejection, check digit, verification, substitution profile, transposition profile, known undetected substitutions, rejection-message hygiene, production-generator rejection sampling and entropy failure, exact wheel and sdist consumer | Published candidate passed local and CI checks |
| Go | module package | normalize, validation, exact Unicode White_Space boundaries, excluded chars, non-ASCII rejection, check digit, verification, substitution profile, transposition profile, known undetected substitutions, rejection-message hygiene, production-generator rejection sampling and entropy failure | Published candidate passed local and CI checks |

## Check Digit Profile

The Mod-25 weighted check digit is a lightweight human-entry aid. Current vectors profile observed detection behavior instead of claiming complete edit detection.

| Code | Check digit | Single substitutions caught | Adjacent transpositions caught |
|---|---:|---:|---:|
| `ACDF0G7HJ2KMNP3R` | `W` | 372 / 384 | 15 / 15 |
| `0123456789` | `5` | 232 / 240 | n/a |
| `123456789ACDF` | `N` | 304 / 312 | 12 / 12 |
| `ACDFGHJKMNPRUWY` | `P` | 348 / 360 | 14 / 14 |

The misses are structural, not random. Weights repeat modulo 25 and 25 is composite, so positions 5, 10, 15 and 20 (1-indexed) miss substitutions between characters whose indices agree modulo 5, and position 25 misses every substitution. `undetected_substitutions` and `detected_substitutions` vectors pin both behaviors so no runtime can silently diverge. `rejection_messages` vectors require every runtime's invalid-input error to name the offending code point and never echo the input.

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

Current repository verification independently computes namespace sizes, rounded payload entropy, and birthday-collision thresholds before checking every published guidance mirror. It also rejects the known stale values corrected after 1.3.7. Runtime behavior vectors in 1.3.8 pin the exact Unicode White_Space set and adjacent rejected code points.

The canonical verifier checks JavaScript, Python, and Go public-API transcripts against an independent specification oracle using exact integer checksum arithmetic and separately authored normalization, and compares their results across shared vectors, non-ASCII rejection including case expansions, every ASCII insertion boundary, Unicode separator boundaries, and a fixed-seed generated corpus. The current parity corpus contains 469 deterministic cases. Package verification enforces exact npm, wheel, and sdist inventories, metadata, source bytes, and license bytes.

## 1.3.10 maintenance coverage

Compact repeated-payload vectors exercise nonzero high-index checksum terms at modulo boundaries, 13,377 characters on 32-bit Go, and the JavaScript precision boundary at 28,000,001 characters. Source and installed-package checks verify that exported lookup snapshots cannot mutate internal conformance behavior. Linux/386 execution is a CI gate; a local cross-compilation alone is not an execution result.

Search regression fixtures cover one-pass entity decoding, structural sitemap validation, unauthorized URL and redirect refusal before transport, partial collection, body failures, and exact infrastructure/defect classification. Generator evals exercise atomic batches, entropy and clipboard failure recovery, pending-copy races, consistent display/copy/accessibility state, and absence of network/storage calls. Artifact mutation tests and workflow contract checks guard acceptance and publication boundaries.

Python source builds require Python 3.10+ and setuptools >=84.1.0; installed wheels retain Python 3.9+ runtime support. Both the minimum patched backend (84.1.0, executed on Python 3.10.20) and reviewed release backend (84.2.1) pass artifact/consumer checks locally. A clean Python 3.9.25 consumer passes the shared corpus using the minimum-backend wheel. Both complete nine-package build locks have zero known advisories at the 2026-11-18 check.

## 1.4.0 coverage

Merged to `main` after 1.3.10 and first published in 1.4.0. `rejection_messages` vectors require every runtime's invalid-input error to name the first offending code point and never echo the input; the three suites assert the contract for normalization and checksum entry points. `undetected_substitutions` and `detected_substitutions` vectors pin the structural blind spots of the Mod-25 weights so all runtimes agree on misses as well as hits. The hosted-page check recomputes the meta Content Security Policy hashes from the inline blocks and rejects inline handlers, style attributes and external resources; the browser suite runs under that policy. Current counts: 82 JavaScript tests, 50 Python tests, and the 469-case parity corpus unchanged.
