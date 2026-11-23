# Maintenance queue

Scope: HardGuard25 repository maintenance. `INTENT.md` governs the fixed standard and maintenance-only posture. This queue records open work and evidence; it grants no commit, push, PR, merge, release, deployment, provider change, or benchmark authority. Delivered work leaves this queue: its evidence lives in `CHANGELOG.md`, `audits/` and `ops/releases/`.

## 2026-11-22 security audit remediation

Status: repository changes merged as `422a08a` (#16) and `291f950` (#22); Dependabot's first `pip` PR (#20) was closed because the minimum build lock is pinned at the pyproject floor by design. Findings and the quarterly checklist are in `audits/security-audit-2026-11-22.md`.

Owner actions outside the repository, none performed by an agent:
- GitHub (HG-03, HG-04): tag ruleset for `v*` and `go/v*` blocking update and deletion; required reviewer and `v*` tag policy on the `pypi` environment; repository-level `sha_pinning_required`; `allowed_actions` set to selected (GitHub, verified creators, `pypa/gh-action-pypi-publish`, `ossf/scorecard-action`, `github/codeql-action`); CodeQL default setup; two-factor and vigilant-mode confirmation; then update `.github/repository-settings.json` and run `npm run check:settings`.
- Registrar (HG-08): `CAA 0 issue "letsencrypt.org"` and `_dmarc TXT "v=DMARC1; p=reject"`.
- Optional, adoption-driven (HG-11, HG-12): recorded in `ROADMAP.md`.

## Deferred README proposal

Status: optional presentation work, not an active implementation commitment. The 2026-11-17 queue direction prioritized correctness and required an actual correctness need before reconsidering the broader conversion. Existing README examples show fixed-looking random-generation comments, which should be corrected in a focused documentation pass; that does not require adopting the full redesign.

If renewed as a bounded adoption-doc task:

- Lead with one support-reference job and generation, accepted grouped lowercase entry, normalization and excluded-character rejection before broad domain tables and alphabet rationale. Keep Python and Go examples reachable.
- Use the current published package. Verify runtime prerequisites from package metadata; the JavaScript package is ESM, Node >=22, with Web Crypto. Root package.json is private tooling.
- Execute the trial in a clean scratch consumer with the installed package. Record runtime/package identity and genuine variable generation output if quoting a transcript. Each copyable block needs its own Literal or Customize label and explicit directory transitions.
- Fixed examples: `normalize('ac3h-7puw')` is `AC3H7PUW`; that grouped input validates; `AC3H7PUO` fails. Alphabet validation establishes neither uniqueness, authenticity nor checksum correctness. Empty/separator-only input is invalid; normalize throws and validate returns false.
- The payload `AC3H7PUW` has check digit `N`, giving `AC3H7PUWN`. A final `0` remains alphabet-valid but checksum-invalid. `generate(8, { checkDigit: true })` produces eight random payload characters plus one derived character, nine total. The check digit adds no entropy or authentication and cannot detect every edit.
- Eight characters is a demonstration, not a universal production recommendation. Retain collision budgeting, application uniqueness responsibilities, and links to `ADOPTION.md` and `docs/IMPLEMENTATION.md`. Keep identifiers distinct from authentication credentials.
- Preserve all runtime, alphabet, normalization, randomness and packaging semantics. Use design-intent wording for confusable exclusions; comparative OCR, dyslexia-sensitive and transcription improvements remain unestablished. No benchmark is active.
- Run focused installed-consumer and documentation checks. Inspect actual site ownership before propagating README changes into static docs; browser gates apply if hosted HTML changes.

## Delivered and removed from this queue

- Search decoder correction, dependency PR review (#4, #5), reconciled release baseline and the 2026-11-18 audit mitigation: shipped in 1.3.10. Evidence: `CHANGELOG.md` 1.3.10, `audits/security-code-review-2026-11-18.md`, `ops/releases/1.3.10.json`.
