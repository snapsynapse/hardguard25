# CLAUDE.md

Agent guidance for working in this repository. Keep this file concise and update it rather than replacing it wholesale when the repo evolves.

## Purpose

HardGuard25 is an open standard defining a 25-character alphabet (`0 1 2 3 4 5 6 7 8 9 A C D F G H J K M N P R U W Y`) optimized for human-safe identifiers — visually distinct in dyslexia-sensitive and high-error-cost contexts. The repo ships the spec plus reference implementations in JavaScript, Python, and Go, a static docs/landing site, an in-repo agent skill, and a shared conformance test suite.

Canonical URL: https://hardguard25.com/
Repo: https://github.com/snapsynapse/hardguard25

## Tech stack

- **Spec**: Markdown (`SPEC.md`, `CONFORMANCE.md`, `INTENT.md`) — CC BY 4.0 licensed.
- **JavaScript**: ESM, no runtime deps, Node's built-in `node:test` runner (`js/`).
- **Python**: `hardguard25` package, pytest, `pyproject.toml`, built with `python -m build` (`python/`).
- **Go**: Go module, standard `go test` (`go/`), tagged separately as `go/vX.Y.Z`.
- **Docs site**: static HTML/CSS/JS under `docs/`, deployed to GitHub Pages (custom domain via `docs/CNAME`).
- **Conformance vectors**: `conformance/vectors.json`, versioned in lockstep with releases.
- **Agent skill**: `skills/hardguard25/` (SKILL.md + MANIFEST.yaml + CHANGELOG.md) — canonical in-repo skill bundle per the project's skill-bundle-in-repo exception.
- **CI**: GitHub Actions (see below).

## Directory layout

```
SPEC.md, CONFORMANCE.md          normative spec + conformance report
INTENT.md                        standards-level strategy, design invariants, scope boundaries
ROADMAP.md, CHANGELOG.md         planned work / release history
CONTRIBUTING.md, SECURITY.md     contribution and disclosure process
HUMAN_FACTORS.md                 human-readability rationale
assistant-guide.txt(+.sha256)    plain-text agent implementation guide (also mirrored in docs/)
js/                               JavaScript reference implementation + tests
python/                           Python reference implementation + tests
go/                               Go reference implementation + tests
conformance/vectors.json          shared cross-language test vectors
docs/                             static docs/landing site (deployed to GitHub Pages)
docs/generator/                   interactive ID generator on the site
scripts/                          Node-based CI conformance checkers (docs generator, URL conventions, agent-surface integrity)
skills/hardguard25/               canonical agent skill bundle for this standard
conformance/                      shared conformance vectors
```

## Conventions

- Keep JavaScript, Python, Go, README examples, the docs site, and the agent skill aligned — a behavior change must be reflected everywhere.
- Update `conformance/vectors.json` whenever generation/validation/check-digit behavior changes; this file is the cross-language source of truth.
- Do not weaken CSPRNG or rejection-sampling behavior in generators.
- Do not broaden normalization beyond documented separator handling without a spec update.
- The three copies of `assistant-guide.txt` (repo root, `docs/`, `docs/.well-known/`) must stay byte-identical with matching `.sha256` sidecars — this is enforced by `scripts/check-agent-surfaces.mjs` in CI.
- Alphabet changes are major-version decisions (see `INTENT.md` design invariants) — do not treat them as routine edits.
- Every release-facing change needs a `CHANGELOG.md` entry; normative spec changes follow SemVer per `CONTRIBUTING.md`.
- `INTENT.md` is authoritative for standards-level scope decisions; portfolio-level strategy lives one level up (PAICE Foundation INTENT), which wins on portfolio questions only.

## Build / test (from docs only — do not execute without asking)

Per `CONTRIBUTING.md`, all three suites should pass before a PR:

```bash
cd js && npm test
cd python && ../.venv/bin/python -m pytest   # adjust venv path as needed
cd go && GOCACHE="$(pwd)/../.gocache" go test ./...
```

CI (`.github/workflows/`) additionally runs:
- `test.yml` (push to main + PRs): JS test + `npm pack --dry-run`, docs-generator/URL-convention/agent-surface checks, Python test + `python -m build`, Go test.
- `release.yml` (on `vX.Y.Z` tag push): verifies package, runtime, spec, conformance, docs, and skill versions match the tag, re-runs the full preflight suite, then publishes to npm (OIDC trusted publishing) and PyPI (`PYPI_API_TOKEN` secret), and tags the Go submodule. Publication steps are rerun-safe.
- `pages.yml` (push to main): deploys `docs/` to GitHub Pages.

## Current state (as of 2026-07-21)

- Latest release line: 1.3.5 (July 2026). The standard/spec content is stable.
- The 1.3.5 stabilization pass fixed Go non-ASCII lookup truncation, aligned Python length validation and runtime version metadata, added shared Unicode rejection vectors, and hardened release-version and rerun checks.
- No TODO/FIXME markers found in tracked source or docs.
- `ROADMAP.md` lists only evidence-driven, adoption-driven, and maintenance follow-ups. None represents broken or unfinished core functionality.
