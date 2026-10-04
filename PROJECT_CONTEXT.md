# PROJECT_CONTEXT

Context for content and documentation work in this repository.

For standards assessment or changes to published surfaces, read [repo-standards.yaml](repo-standards.yaml) for applicability, adoption, surface ownership, and verification expectations. [INTENT.md](INTENT.md) remains authoritative for purpose, scope, and exceptions; the declaration records expectations, not passing results.

## What this project is

HardGuard25 is an open standard: a 25-character alphabet (`0123456789ACDFGHJKMNPRUWY`) for human-safe identifiers. It is designed to exclude common visual confusables, including patterns relevant to dyslexia-sensitive and OCR workflows. It removes 11 commonly confused characters (O/0, I/1, L/1, S/5, Z/2, B/8, E/3, Q/P, V/U, T/+, X/*), with digits winning any visual tie against a letter. The repo ships the normative spec plus small reference implementations (JavaScript, Python, Go), a conformance test suite, a static docs/landing site, and an agent-facing implementation skill. Comparative OCR and transcription error rates have not yet been established empirically.

It is one standard within a broader PAICE portfolio of open standards (see also GuideCheck and Skill Provenance, which HardGuard25 optionally integrates with).

## Audience

- Developers and engineers designing identifiers that humans will actually handle: order numbers, tracking codes, license keys, support ticket IDs, patient/case numbers, promo codes, device IDs, short links, and similar.
- Teams currently using base32/Crockford base32/ULID/KSUID/NanoID/ad hoc alphanumeric IDs who need a human-readability-first alternative, not a byte-efficiency or machine-sortability competitor.
- AI coding assistants and agents helping a developer adopt the standard (hence the plain-text `assistant-guide.txt` designed to resist prompt-injection via presentation tricks).

## Style / tone

Precise, standards-document register: short declarative sentences, explicit scope boundaries, explicit non-claims (e.g. "does not assert collision-resistance guarantees beyond the alphabet and recommended lengths"). Documentation favors concrete before/after examples over marketing language. Security- and provenance-conscious: the assistant guide explicitly names prompt-injection risk and instructs assistants to treat the guide as data, not as a higher-priority instruction. Author/maintainer is Sam Rogers ("Snap") of Snap Synapse.

## Key URLs

- Canonical site: https://hardguard25.com/
- Repository: https://github.com/snapsynapse/hardguard25
- LLM briefing: https://hardguard25.com/llms.txt
- Compatibility briefing mirror: https://hardguard25.com/llm.txt
- Structured agent discovery: https://hardguard25.com/agents.json
- Assistant guide (canonical, well-known path): https://hardguard25.com/.well-known/assistant-guide.txt
- npm package: `hardguard25`
- PyPI package: `hardguard25`
- Go module: `github.com/snapsynapse/hardguard25/go`

## Current status

Stable and maintenance-only. Prepared spec version 1.3.8, dated October 2026, remains unreleased until it is tagged, published, and independently verified. The current published version is 1.3.7. The alphabet and checksum algorithm are unchanged. Local validation, a pushed commit, a successful Pages workflow, and package publication are separate claims.

Routine work is limited to security, correctness, conformance, compatibility, accessibility, dependency, release-process, and evidence-backed documentation maintenance. New runtimes, hosted services, identifier capabilities, benchmark execution, comparative claims, and feature expansion require renewed owner authorization under `INTENT.md`.

## Documentation audit contract

### Folder taxonomy and indexes

| Scope | Category | Index or inventory |
|---|---|---|
| Repository-root Markdown | Reference and governance | This document's authoritative-doc map and `README.md` |
| `docs/` | Hosted reference and application output | `repo-standards.yaml` `surfaces.website`, `search-audit.config.json`, and `docs/sitemap.xml` |
| `skills/hardguard25/` | Agent-facing reference bundle | `skills/hardguard25/MANIFEST.yaml` |
| `ops/search/` and `ops/releases/` | Dated evidence and release records | `ops/search-indexing.md` and the directory inventories |
| `handoffs/` | Temporary continuity queue | The directory inventory; a nonempty directory means work remains unprocessed |

The repository does not use general document frontmatter. Root reference documents use stable headings and repository history. The bundled skill uses version metadata in `SKILL.md`, a matching file version and hash in `MANIFEST.yaml`, and an append-only bundle changelog. Handoffs are dated in filenames and are deleted after durable facts and unresolved work are migrated to their owning files.

### Anchor facts

- Use the current session date in America/Denver for factual review dates.
- `INTENT.md` owns purpose, scope, invariants, and repository-standard exceptions.
- `SPEC.md` owns normative behavior. `conformance/vectors.json` and runtime tests prove executable behavior.
- `repo-standards.yaml` owns surface inventory, delivery paths, checks, and claim boundaries.
- Version 1.3.8 is the prepared release; version 1.3.7 remains the current published release until registry, tag, and deployment evidence confirms the transition.
- Comparative OCR and transcription superiority remains unestablished until a reviewed study supports a stronger claim.
- GitHub Pages deploys tracked `docs/` bytes after a push to `main`; repository-local checks do not establish live deployment.

### Authoritative document map

| Question | Authority |
|---|---|
| Why the standard exists and what is out of scope | `INTENT.md` |
| Alphabet, normalization, checksum, and conformance requirements | `SPEC.md` |
| Current deterministic coverage | `CONFORMANCE.md`, tests, and `scripts/verify.mjs` |
| Published-site and package delivery routes | `repo-standards.yaml` and `.github/workflows/` |
| Release status and procedure | `CHANGELOG.md`, `RELEASE_CHECKLIST.md`, tags, and release records |
| Future work | `ROADMAP.md` |
| Human-factors evidence limits | `HUMAN_FACTORS.md` |
| Adoption and migration choices | `ADOPTION.md` |
| Public agent summaries | `docs/llms.txt`, `docs/llm.txt`, `docs/agents.json`, and the assistant-guide mirrors |

### Verification hints

- Run `npm run verify` for deterministic repository, runtime, package, metadata, search, and agent-surface checks.
- Run `npm run verify:browser` for the bounded landing-page and generator accessibility suite.
- Use `npm run test:search:production` only after an authorized deployment to verify hosted bytes.
- Exclude `.git/`, `.gocache/`, `node_modules/`, and temporary build directories from documentation searches.
