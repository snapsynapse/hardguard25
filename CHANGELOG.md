# Changelog

## Unreleased

### Documentation
- Added a tracked post-1.3.5 opportunities handoff with prerequisites, preservation constraints, and a no-change rule when no adopter or evidence plan exists.
- Removed the fully actioned June 3 stewardship-return handoff.

## 1.3.5 -- 2026-07-21

### Changed
- npm package renamed from `@snapsynapse/hardguard25` (never published) to unscoped `hardguard25`, matching the PyPI package name. Updated README, implementation guide, assistant guide (all three copies plus SHA-256 sidecars), docs site, llms.txt, and agent skill.
- Declared the core standard stable and narrowed future roadmap work to evidence-driven evaluation, adoption documentation, and maintenance.
- Synchronized specification, runtime, conformance, docs-site, and skill-bundle release metadata at 1.3.5.
- Added canonical homepage, issue, changelog, security, and funding metadata to the npm and PyPI packages; limited the npm tarball to runtime files.
- Added an npm-package README and license plus a Go package-reference badge and install command.
- Aligned package descriptions with the specification boundary: HardGuard25 is an identifier alphabet, not a global uniqueness protocol.
- Simplified JavaScript and Go validation by removing redundant post-normalization regex checks and removed JavaScript's private checksum wrapper.

### Added
- Release automation workflow (`.github/workflows/release.yml`): pushing a `vX.Y.Z` tag verifies version strings, publishes to npm and PyPI, and pushes the matching `go/vX.Y.Z` tag for Go module versioning.
- Shared non-ASCII rejection vectors covering Unicode lookalikes and low-byte collisions across JavaScript, Python, and Go.
- Release-version alignment check covering both package manifests, Python runtime metadata, conformance fixtures and report, specification, skill bundle, and docs site.
- Conformance-backed check for public check-digit examples in the README, Python package README, and bundled skill.
- CI, npm, and PyPI status badges in the README.
- OG-image integrity coverage for the root source and deployed docs copy.
- Clean-environment smoke tests for the packed npm tarball and built Python wheel.

### Fixed
- `conformance/vectors.json` version string updated from 1.3.3 to 1.3.4 to match the release (vectors themselves unchanged).
- `scripts/check-agent-surfaces.mjs` still referenced the pre-1.3.4 `ai-assisted-implementation.txt` filename and failed; it now verifies all three `assistant-guide.txt` copies are byte-identical with matching SHA-256 sidecars, and runs in CI.
- Go normalization and check-digit helpers now reject non-ASCII runes before byte lookup, preventing Unicode code points such as `U+0141` from being treated as ASCII characters with the same low byte.
- Python generation now rejects booleans and non-integer lengths instead of silently producing an unexpected length or raising an incidental type error.
- Python `__version__` and the conformance report fixture version now match release metadata.
- npm, PyPI, and Go publication steps are rerun-safe after a partial release.
- Corrected the public `AC3H7PUW` quickstart check digit from `R` to `N` across JavaScript, Python, Go, and skill examples.
- Removed the non-portable `skills/skill-provenance` sibling-repository symlink; Skill Provenance remains referenced by its canonical public project.

## 1.3.4 -- 2026-06-03

### Changed
- Renamed agent guide from `ai-assisted-implementation.txt` to `assistant-guide.txt` to conform to the GuideCheck canonical filename. The previous URLs (`https://hardguard25.com/ai-assisted-implementation.txt` and `.sha256`) no longer resolve. The guide is now served at the canonical well-known path: `https://hardguard25.com/.well-known/assistant-guide.txt`, with a sibling sidecar at `assistant-guide.txt.sha256`. A convenience copy at `https://hardguard25.com/assistant-guide.txt` is byte-identical to the well-known copy. A repository-root copy at `/assistant-guide.txt` is now committed per the GuideCheck recommendation; integrators cloning the repo see the guide next to the README.
- Recomputed and propagated the SHA-256 sidecar to all three locations (repo root, `docs/`, `docs/.well-known/`) after the internal canonical URLs inside the guide were updated.
- Updated README, `python/README.md`, `docs/IMPLEMENTATION.md`, `docs/index.html`, and `docs/llms.txt` to reference the new filename and canonical URL.

### Added
- `INTENT.md` at repository root, per LocalBrain `0_Across/Repo Standards.md` v0.3 layout matrix. Records design invariants, scope, conformance philosophy, admission criteria, relationships to other PAICE standards (GuideCheck, Skill Provenance, Graceful Boundaries), and exceptions (skills/hardguard25/ tracked as canonical skill home; `docs/llms.txt` is comprehensive standalone).
- `docs/.well-known/` directory hosting the canonical assistant-guide.txt + sidecar.

### Hygiene
- Tightened `.gitignore`: replaced partial-match `.claude/settings.local.json` with full-directory `.claude/`; added `handoffs/`, `working/`, `venv/`, `.vercel`, `!.env.example`. Reorganized by category.

## 1.3.3 -- 2026-05-31

### Added
- GitHub Actions test workflow for JavaScript, Python, and Go
- Expanded shared conformance vectors for separators, excluded characters, checksum behavior profiles, and deterministic rejection sampling
- Static docs generator conformance check, URL convention check, and agent-surface integrity check
- Conformance report, human-factors evidence notes, security policy, contribution guide, and release checklist
- Human implementation guide and plain-text AI-assisted implementation guide with approval gates, prompt-injection mitigations, SHA-256 verification instructions, and a provenance sidecar

### Changed
- Removed JavaScript's unconditional Node `crypto` import so the module loads cleanly in browser-oriented environments
- Updated public examples, canonical demo URL, and docs-site metadata
- Replaced overbroad check-digit claims with measured substitution and transposition profiles

## 1.3.2 -- 2026-04-23

### Added
- Shared cross-language conformance vectors in `conformance/vectors.json` covering normalization, validation, check digits, and verification

### Changed
- Aligned JS, Python, and Go API contract documentation for normalization, validation, checksum generation, and checksum verification
- Clarified in the spec that normalization removes any whitespace separator and that verification runs on normalized input
- Synced package versions after the checksum and normalization compatibility fixes

### Fixed
- Verification now accepts grouped and lowercase human input consistently across all three runtimes
- Go and Python normalization now match JavaScript for tab and newline separators
- Go checksum helpers now match JS and Python case-handling behavior

## 1.3.1 -- 2026-04-14

### Added (Python package)
- Full PyPI landing page: install, quickstart, API reference table, sizing table, "When NOT to use" guardrails
- SPDX license expression (PEP 639) and expanded classifier set
- Explicit setuptools package discovery config
- `LICENSE` symlink in `python/` so sdist/wheel include it

### Changed (root README)
- Fixed excluded-letter pairings to cover all 11 removed letters (added `L/1`, removed duplicate mirror-pair wording)
- Expanded sizing table from 6 rows to the full 9-row spec set with entropy column and recommended defaults

### Published
- `hardguard25` on PyPI: https://pypi.org/project/hardguard25/

## 1.3.0 -- 2026-03-09

### Added
- Claude Code skill (Agent Skills format) with full alphabet reference, code examples, and comparison matrix
- Skill Provenance metaskill for version tracking across sessions and platforms
- Plugin metadata (.claude-plugin/plugin.json) for Claude Code integration
- Use case table in README covering 10 domains (orders, tickets, logistics, manufacturing, licensing, healthcare, promos, education, IoT, short links)
- "No Library Needed" section in README for direct alphabet usage
- npm and PyPI badges in README

### Changed
- Repositioned README as an open standard for human-safe identifiers, not just a token library
- Reorganized README flow: what it is → use cases → install → sizing → spec

## 1.2.0 -- 2025-10-03

### Added
- E excluded from alphabet (E/3 dyslexia confusable; digits take priority), bringing set from 26 to 25 characters
- Optional Mod-25 weighted check digit (ISO 7064 style)
- Reference implementations in JavaScript, Python, and Go
- Interactive generator app (GitHub Pages)
- Collision guidance tables
- Entropy and recommended length tables
- Comparison matrix against Crockford Base32, z-base-32, Canadian Postal, Nintendo Base-31, RFC 4648

### Changed
- Alphabet reduced from 26 to 25 characters
- Renamed project to HardGuard25
- Updated all entropy calculations to base 25

## 1.0.0 -- 2019-11-14

### Added
- Original 26-character unambiguous ID alphabet
- Published as LinkedIn article
