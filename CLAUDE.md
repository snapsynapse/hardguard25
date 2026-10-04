# CLAUDE.md

Agent guidance for working in this repository. Keep this file concise and update it rather than replacing it wholesale when the repo evolves.

## Purpose

HardGuard25 is an open standard defining a 25-character alphabet (`0 1 2 3 4 5 6 7 8 9 A C D F G H J K M N P R U W Y`) designed to exclude common visual confusables in dyslexia-sensitive and other human workflows. The repo ships the spec plus reference implementations in JavaScript, Python, and Go, a static docs site, machine-readable agent-discovery surfaces, an in-repo agent skill, and a shared conformance test suite. Comparative OCR and transcription error rates have not yet been established empirically.

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
docs/llms.txt, llm.txt            byte-identical agent briefings
docs/agents.json                  structured fit, task, package, and execution boundaries
scripts/                          Node-based CI conformance and search-indexing checkers
skills/hardguard25/               canonical agent skill bundle for this standard
conformance/                      shared conformance vectors
handoffs/                         temporary session-continuity queues; empty when fully processed
```

## Conventions

- Keep JavaScript, Python, Go, README examples, the docs site, and the agent skill aligned — a behavior change must be reflected everywhere.
- Update `conformance/vectors.json` whenever generation/validation/check-digit behavior changes; this file is the cross-language source of truth.
- Do not weaken CSPRNG or rejection-sampling behavior in generators.
- Do not broaden normalization beyond documented separator handling without a spec update.
- The three copies of `assistant-guide.txt` (repo root, `docs/`, `docs/.well-known/`) must stay byte-identical with matching `.sha256` sidecars — this is enforced by `scripts/check-agent-surfaces.mjs` in CI.
- `docs/llms.txt` and `docs/llm.txt` must stay byte-identical. `docs/agents.json` must not imply a hosted agent API.
- Alphabet changes are major-version decisions (see `INTENT.md` design invariants) — do not treat them as routine edits.
- Every release-facing change needs a `CHANGELOG.md` entry; normative spec changes follow SemVer per `CONTRIBUTING.md`.
- `INTENT.md` is authoritative for standards-level scope decisions; portfolio-level strategy lives one level up (PAICE Foundation INTENT), which wins on portfolio questions only.

## Build / test (from docs only — do not execute without asking)

Per `CONTRIBUTING.md`, the canonical verifier should pass before a PR:

Literal
```bash
npm run verify
```

Hosted-site accessibility changes also require `npm ci`, a local Chromium installation through Playwright, and `npm run verify:browser` from the repository root.

CI (`.github/workflows/`) additionally runs:
- `test.yml` (push to main + PRs): installs the pinned development and build tools, then runs the canonical repository verifier across runtime, documentation, metadata, benchmark-protocol, and installed-artifact checks.
- `release.yml` (on `vX.Y.Z` tag push): verifies package, runtime, spec, conformance, docs, and skill versions match the tag, re-runs the full preflight suite, then publishes to npm and PyPI through OIDC trusted publishing, and tags the Go submodule. PyPI uses the dedicated `pypi` GitHub environment. Publication steps are rerun-safe.
- `pages.yml` (push to main): deploys `docs/` to GitHub Pages, includes the tracked `.well-known` directory, then retries the production search-indexing contract until the deployment is live.
- `accessibility.yml` (relevant PRs and main pushes, release tags, weekly production schedule, and manual runs): executes Playwright/axe checks against the landing page and static generator without adding dependencies to the reference libraries.

## Current state (as of 2026-10-03)

- Latest release line: 1.3.8 (published and verified). Exact-head CI, signed tags, GitHub Release, npm, PyPI, Go proxy, provenance, and deployed-site evidence are recorded in `ops/releases/1.3.8.json`.
- The 1.3.5 stabilization pass fixed Go non-ASCII lookup truncation, aligned Python length validation and runtime version metadata, added shared Unicode rejection vectors, and hardened release-version and rerun checks.
- Release 1.3.8 pins exact Unicode White_Space behavior across runtimes, strengthens production-generator and package-artifact verification, and adds bounded agent-discovery surfaces.
- Release 1.3.8 adds deterministic production entropy checks, cross-runtime public-API parity, exact package inventories, and expanded agent-discovery surfaces.
- No TODO/FIXME markers found in tracked source or docs.
- `ROADMAP.md` lists only evidence-driven, adoption-driven, and maintenance follow-ups. None represents broken or unfinished core functionality.
