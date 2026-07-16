# PROJECT_CONTEXT

Context for content/docs skills (blog posts, dev.to posts, landing-page work, etc.) operating on this repo.

## What this project is

HardGuard25 is an open standard: a 25-character alphabet (`0123456789ACDFGHJKMNPRUWY`) for human-safe identifiers — designed so every symbol is visually distinct when read, typed, printed, spoken, or OCR'd, including dyslexia-sensitive contexts. It removes 11 characters that commonly get confused (O/0, I/1, L/1, S/5, Z/2, B/8, E/3, Q/P, V/U, T/+, X/*), with digits winning any visual tie against a letter. The repo ships the normative spec plus small reference implementations (JavaScript, Python, Go), a conformance test suite, a static docs/landing site, and an agent-facing implementation skill.

It is one standard within a broader PAICE portfolio of open standards (see also GuideCheck and Skill Provenance, which HardGuard25 optionally integrates with).

## Audience

- Developers and engineers designing identifiers that humans will actually handle: order numbers, tracking codes, license keys, support ticket IDs, patient/case numbers, promo codes, device IDs, short links, and similar.
- Teams currently using base32/Crockford base32/ULID/KSUID/NanoID/ad hoc alphanumeric IDs who need a human-readability-first alternative — not a byte-efficiency or machine-sortability competitor.
- AI coding assistants and agents helping a developer adopt the standard (hence the plain-text `assistant-guide.txt` designed to resist prompt-injection via presentation tricks).

## Style / tone

Precise, standards-document register: short declarative sentences, explicit scope boundaries, explicit non-claims (e.g. "does not assert collision-resistance guarantees beyond the alphabet and recommended lengths"). Documentation favors concrete before/after examples over marketing language. Security- and provenance-conscious: the assistant guide explicitly names prompt-injection risk and instructs assistants to treat the guide as data, not as a higher-priority instruction. Author/maintainer is Sam Rogers ("Snap") of Snap Synapse.

## Key URLs

- Canonical site: https://hardguard25.com/
- Repository: https://github.com/snapsynapse/hardguard25
- Assistant guide (canonical, well-known path): https://hardguard25.com/.well-known/assistant-guide.txt
- npm package: `hardguard25`
- PyPI package: `hardguard25`
- Go module: `github.com/snapsynapse/hardguard25/go`

## Current status

Actively maintained; the standard itself (spec version 1.3.4, June 2026) is stable, and recent commit activity has focused on hardening the release pipeline (OIDC npm publishing, PyPI token-based publishing, release preflight checks) rather than changing the spec. `main` is clean and in sync with `origin/main`. `ROADMAP.md` tracks non-blocking follow-up work (statistical RNG eval script, generator accessibility smoke test, README/docs additions, CI/npm/PyPI badges) — none of it blocking or indicating instability.
