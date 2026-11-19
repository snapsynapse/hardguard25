# Conformance Report

Report date: 2026-11-18

Published release 1.3.9 has historical local, exact-head CI and independent registry-consumer evidence in `ops/releases/1.3.9.json`. The current unreleased maintenance candidate extends the checks below; its local results are recorded in `audits/security-code-review-2026-11-18.md`. Candidate CI and publication have not run.

Fixture version: `1.3.9`

## Implementations

| Runtime | Package version | Fixture coverage | Status |
|---|---:|---|---|
| JavaScript | 1.3.9 | normalize, validation, exact Unicode White_Space boundaries, excluded chars, non-ASCII rejection, check digit, verification, substitution profile, transposition profile, production-generator rejection sampling and entropy failure, packed TypeScript consumer | Candidate passes locally; CI pending |
| Python | 1.3.9 | normalize, validation, exact Unicode White_Space boundaries, excluded chars, non-ASCII rejection, check digit, verification, substitution profile, transposition profile, production-generator rejection sampling and entropy failure, exact wheel and sdist consumer | Candidate passes locally; CI pending |
| Go | module package | normalize, validation, exact Unicode White_Space boundaries, excluded chars, non-ASCII rejection, check digit, verification, substitution profile, transposition profile, production-generator rejection sampling and entropy failure | Candidate passes locally; CI pending |

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

Current repository verification independently computes namespace sizes, rounded payload entropy, and birthday-collision thresholds before checking every published guidance mirror. It also rejects the known stale values corrected after 1.3.7. Runtime behavior vectors in 1.3.8 pin the exact Unicode White_Space set and adjacent rejected code points.

The canonical verifier checks JavaScript, Python, and Go public-API transcripts against an independent specification oracle using exact integer checksum arithmetic and separately authored normalization, and compares their results across shared vectors, non-ASCII rejection including case expansions, every ASCII insertion boundary, Unicode separator boundaries, and a fixed-seed generated corpus. The current parity corpus contains 469 deterministic cases. Package verification enforces exact npm, wheel, and sdist inventories, metadata, source bytes, and license bytes.

## Unreleased maintenance coverage

Compact repeated-payload vectors exercise nonzero high-index checksum terms at modulo boundaries, 13,377 characters on 32-bit Go, and the JavaScript precision boundary at 28,000,001 characters. Source and installed-package checks verify that exported lookup snapshots cannot mutate internal conformance behavior. Linux/386 execution is a CI gate; a local cross-compilation alone is not an execution result.

Search regression fixtures cover one-pass entity decoding, structural sitemap validation, unauthorized URL and redirect refusal before transport, partial collection, body failures, and exact infrastructure/defect classification. Generator evals exercise atomic batches, entropy and clipboard failure recovery, pending-copy races, consistent display/copy/accessibility state, and absence of network/storage calls. Artifact mutation tests and workflow contract checks guard acceptance and publication boundaries.

Python source builds require Python 3.10+ and setuptools >=84.1.0; installed wheels retain Python 3.9+ runtime support. Both the minimum patched backend (84.1.0, executed on Python 3.10.20) and reviewed release backend (84.2.1) pass artifact/consumer checks locally. A clean Python 3.9.25 consumer passes the shared corpus using the minimum-backend wheel. Both complete nine-package build locks have zero known advisories at the 2026-11-18 check.
