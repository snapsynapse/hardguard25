# Maintenance queue

Scope: HardGuard25 repository maintenance. `INTENT.md` governs the fixed standard and maintenance-only posture. This queue records work and evidence; it grants no commit, push, PR, merge, release, deployment, provider change, or benchmark authority.

## Search decoder correction

Status: locally implemented and verified as part of the audit-mitigation candidate, 2026-11-18, based on `76b8c37f46427ee9af9cf449e42e9c92e837804f`. Delivery remains open.

- Both search scripts previously decoded `&amp;lt;` twice into `<`. The candidate backports the single-pass decoder from `snapsynapse/skills` commit `5d94121`, portfolio-search-indexing-audit asset v7, dated 2026-11-08.
- Retain this repository's contract v3, configuration and local adaptations. Do not replace the scripts wholesale with upstream contract v4 assets. Header comments identify the decoder backport without claiming full asset equivalence.
- The decoder handles the five named XML entities, decimal and hexadecimal numeric references, preserves invalid code points and unknown references, and trims sitemap locations. Production child-sitemap URLs, page locations and HTML canonical links use the same decoder. Its constant is initialized before any top-level caller.
- The original four regressions proved the decoder failure. The expanded shared-parser and production scenario suites now cover XML structure, encoded canonical links, request confinement, redirect hops and failure classification. Their transport is stubbed; live verification is recorded separately below.
- `npm run verify` passed on 2026-11-18, including 469 cross-runtime cases, 77 JavaScript tests, 47 Python tests, Go, packed consumers, and Python package consumers. The sandboxed first attempt failed fetching isolated Python build dependencies; the network-enabled rerun passed.
- A direct production check on 2026-11-18 exited 2 with 19 infrastructure failures and zero fetched pages. Its two missing-deployment-URL reports follow failed sitemap collection and do not establish a deployment defect. A separate curl HEAD request returned HTTP 200 for the homepage. After using the supported Node 22.23.5 runtime, the hardened full production check passed: two pages, complete collection, zero defects and zero infrastructure failures. The earlier Node v26.13.0 failure was local transport evidence, not a deployment defect.
- Delivery authority: Sam authorized commit, push, PR creation, CI monitoring and CI repairs on 2026-11-18. Run the required independent review before PR creation; merge authority remains separate. After delivery, rerun the production search check, preferably through the Pages workflow if local Node fetch remains unavailable. Record the exact deployed commit and outcome before marking this item complete. No package publication is required solely for this repository-tooling fix.

## Dependency PR review

Observed 2026-11-18; both PRs remain open. No PR, check run or dependency was changed in this pass.

| PR | Inspected head | Evidence and disposition |
|---|---|---|
| [#4, Playwright 1.63.0 to 1.64.1](https://github.com/snapsynapse/hardguard25/pull/4) | `e634ea32cd5e5efd682a97ee1d8fdf3bf218a404` | Only package.json and lockfile change. Recorded repository, minimum-runtime, Windows artifact and accessibility checks passed. Review the lockfile/runtime compatibility before an authorized merge; historical green checks are not approval. |
| [#5, axe Playwright 4.13.0 to 4.14.0](https://github.com/snapsynapse/hardguard25/pull/5) | `288669f51bec3fbf18b72223d41574219238cbe9` | Only package.json and lockfile change. Repository, minimum-runtime and Windows checks passed; accessibility failed at 320, 390 and 768 pixels, including retries. Hold pending remediation and a green exact-head browser gate. |

PR #5's [failed accessibility run](https://github.com/snapsynapse/hardguard25/actions/runs/41324918783) reports serious `label-content-name-mismatch` on `.gh-star`. Current `docs/index.html` has visible text `Star on GitHub` and `aria-label="Star snapsynapse/hardguard25 on GitHub"`, which interrupts that visible phrase. The local audit-mitigation candidate corrects the accessible name after confirming static source ownership. All 15 browser tests now pass with axe Playwright 4.14.0 / axe-core 4.14.1. The remote PR and its checks were not changed. Do not weaken the rule or conflate this with a decoder regression. No hosted HTML was edited in the decoder tranche.

## Deferred README proposal

Status: optional presentation work, not an active implementation commitment. The 2026-11-17 queue direction prioritized correctness and required an actual correctness need before reconsidering the broader conversion. Existing README examples show fixed-looking random-generation comments, which should be corrected in a focused documentation pass; that does not require adopting the full redesign.

If renewed as a bounded adoption-doc task:

- Lead with one support-reference job and generation, accepted grouped lowercase entry, normalization and excluded-character rejection before broad domain tables and alphabet rationale. Keep Python and Go examples reachable.
- Use the current published package, not the old handoff's 1.3.8 pin. Verify runtime prerequisites from package metadata; the JavaScript package is ESM, Node >=22, with Web Crypto. Root package.json is private tooling.
- Execute the trial in a clean scratch consumer with the installed package. Record runtime/package identity and genuine variable generation output if quoting a transcript. Each copyable block needs its own Literal or Customize label and explicit directory transitions.
- Fixed examples: `normalize('ac3h-7puw')` is `AC3H7PUW`; that grouped input validates; `AC3H7PUO` fails. Alphabet validation establishes neither uniqueness, authenticity nor checksum correctness. Empty/separator-only input is invalid; normalize throws and validate returns false.
- The payload `AC3H7PUW` has check digit `N`, giving `AC3H7PUWN`. A final `0` remains alphabet-valid but checksum-invalid. `generate(8, { checkDigit: true })` produces eight random payload characters plus one derived character, nine total. The check digit adds no entropy or authentication and cannot detect every edit.
- Eight characters is a demonstration, not a universal production recommendation. Retain collision budgeting, application uniqueness responsibilities, and links to `ADOPTION.md` and `docs/IMPLEMENTATION.md`. Keep identifiers distinct from authentication credentials.
- Preserve all runtime, alphabet, normalization, randomness and packaging semantics. Use design-intent wording for confusable exclusions; comparative OCR, dyslexia-sensitive and transcription improvements remain unestablished. No benchmark is active.
- Run focused installed-consumer and documentation checks. Inspect actual site ownership before propagating README changes into static docs; browser gates apply if hosted HTML changes.

## Reconciled release baseline

On 2026-11-18, fetched main and origin/main both identified `76b8c37f46427ee9af9cf449e42e9c92e837804f`, with no pre-existing tracked or untracked changes. GitHub still listed [v1.3.9](https://github.com/snapsynapse/hardguard25/releases/tag/v1.3.9) as latest. Historical publication and consumer evidence belongs in `ops/releases/1.3.9.json`; registry bytes and attestations were not reverified in this maintenance pass. The older README handoff's 1.3.8 baseline is historical.

This queue reconciles the temporary handoffs dated 2026-10-11, 2026-11-08 and 2026-11-13 (last updated 2026-11-17). Stable maintenance posture already lives in `INTENT.md`; no strategic change was needed. All three temporary handoffs were deleted after verifying this transfer; handoffs/ is empty. Remaining delivery and deferred work stay open here.

## Audit mitigation candidate

The complete discovery and remediation evidence is in `audits/security-code-review-2026-11-18.md`. All thirteen findings have implemented local mitigations. Sam approved source builds requiring Python >=3.10 with patched setuptools >=84.1.0 while installed wheels retain runtime >=3.9. Actual Python 3.10 minimum-backend builds and clean Python 3.9 installed-wheel conformance pass. Both complete build-tool lockfiles are hash-pinned and advisory-clean at the final check; no owner compatibility decision remains open.

The full local canonical verifier, independent adversarial passes, upgraded browser suite and read-only production search check pass. Linux/386 execution, hosted CI and publisher execution remain future delivery evidence. The original remediation checkpoint was uncommitted. Sam subsequently authorized committing, pushing, opening a PR and repairing CI on 2026-11-18. Current commit and check identities belong in Git and the PR record. This queue grants no merge, release/version bump or deployment authority.
