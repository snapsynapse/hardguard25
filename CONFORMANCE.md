# Conformance Report

Report date: 2026-06-03

Fixture version: `1.3.3` (unchanged — no normative conformance vector changes in v1.3.4)

## Implementations

| Runtime | Package version | Fixture coverage | Status |
|---|---:|---|---|
| JavaScript | 1.3.4 | normalize, validate, excluded chars, separators, check digit, verify, substitution profile, transposition profile, deterministic generation | Passing locally |
| Python | 1.3.4 | normalize, validate, excluded chars, separators, check digit, verify, substitution profile, transposition profile, deterministic generation | Passing locally |
| Go | module package | normalize, validate, excluded chars, separators, check digit, verify, substitution profile, transposition profile, deterministic generation | Passing locally |

## Check Digit Profile

The Mod-25 weighted check digit is a lightweight human-entry aid. Current vectors profile observed detection behavior instead of claiming complete edit detection.

| Code | Check digit | Single substitutions caught | Adjacent transpositions caught |
|---|---:|---:|---:|
| `ACDF0G7HJ2KMNP3R` | `W` | 372 / 384 | 15 / 15 |
| `0123456789` | `5` | 232 / 240 | n/a |
| `123456789ACDF` | `N` | 304 / 312 | 12 / 12 |
| `ACDFGHJKMNPRUWY` | `P` | 348 / 360 | 14 / 14 |

## Local Verification Commands

```bash
cd js && npm test
cd python && ../.venv/bin/python -m pytest
cd go && GOCACHE="$(pwd)/../.gocache" go test ./...
```

CI runs equivalent checks on GitHub Actions for pull requests and pushes to `main`.
