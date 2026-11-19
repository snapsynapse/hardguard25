# HardGuard25 code review and security audit

Date: 2026-11-18, America/Denver. Base: `76b8c37f46427ee9af9cf449e42e9c92e837804f`. Reviewed the uncommitted decoder maintenance candidate on `codex/process-maintenance-handoffs`, all three reference libraries, the static generator, verification scripts, package checks and four GitHub workflows. This report is repository-scoped. No source fixes, dependency upgrades, commits, pushes, provider changes or publication actions were performed during the audit.

## Assessment

No critical/high vulnerability, leaked credential, weak entropy fallback or current package compromise was confirmed. Thirteen findings are listed: four medium and nine low. Priority reflects remediation order; a P2 correctness finding is not necessarily a medium security vulnerability. Several findings concern acceptance gates and failure handling rather than an externally exploitable service. The project has no hosted authentication or data API.

The decoder correction itself passes its focused regression suite; no new decoder behavior defect was found in the reviewed patch. The surrounding production checker still has pre-existing safety and reporting gaps. Passing the canonical verifier does not exclude the independently reproduced defects below.

## Automated evidence

| Check | Result and scope |
|---|---|
| Bandit 1.9.4 | Scanned Python library and Python scripts, 257 lines: zero medium/high; four low subprocess/import observations in `check-python-package.py`. Fixed argument arrays and trusted repository paths do not establish command injection. |
| npm advisory service | The npm 11.20.0 audit CLI failed through local Node transport. A curl POST to the official npm bulk-advisory endpoint for all six locked package/version pairs returned an empty advisory object. No known advisories reported; no claim of a successful npm CLI audit. |
| pip-audit 2.10.0 | Zero known advisories across 28 distributions in this repo's existing `.venv`. These are development tools, not shipped runtime dependencies. |
| Gitleaks 8.30.1, current snapshot | Zero findings across tracked and nonignored untracked files, approximately 530,628 bytes. Ignored dependencies, caches and local credentials were not copied into the snapshot. |
| Gitleaks 8.30.1, history | Zero findings across 61 reachable commits, approximately 772,412 bytes. Filename history checks also found no committed env/private-key files. This is scanner coverage, not proof that every possible secret format is detectable. |
| Existing candidate verification | Four new search regressions pass and all four fail against original scripts. The canonical verifier passed earlier in this session, including 469 parity cases, 77 JavaScript tests, 47 Python tests, Go and clean package consumers. It was not rerun merely to audit unchanged source. |
| Isolated adversarial proofs | Exercised actual library APIs, checker scripts and generator script with controlled input/transport/DOM; used temporary copies for artifact and publication-branch probes. No hostile requests were sent to live services. |

Tool readiness was confirmed before automated scanning: Bandit 1.9.4, pip-audit 2.10.0, npm 11.20.0 and Gitleaks 8.30.1 were already available. No scanner installation was required. Browser UI automation and a new hosted browser test run were not performed.

## Findings

### AUD-01: Checksum accumulation exceeds runtime integer limits

Priority P2; medium correctness/availability risk. Locations: `js/index.js:162-171`, `go/hardguard25.go:161-174`. OWASP A04:2021.

The weighted checksum accumulates its entire sum before reducing modulo 25. The actual JavaScript API returned `6` for 28,000,001 repetitions of `W`; the independent BigInt expression `23*n*(n+1)/2 % 25` yields index 23, `W`. Floating-point precision has changed the published checksum contract.

For 32-bit Go, 13,377 repetitions of `Y` produce exact sum 2,147,490,072, which wraps to -2,147,477,224. Its Go remainder is -24, making the alphabet indexing operation panic. The Go architecture effect is established by exact/int32 arithmetic modeling, not execution on a 32-bit runtime. A consumer accepting that much hostile input on a 32-bit target could suffer a panic. Neither behavior is an authentication bypass; the checksum is noncryptographic.

Mitigation: reduce the accumulator and positional weight modulo 25 on every iteration, preserving the existing mathematical contract. Keep application ingress budgets separate from the standard's no-length-mandate invariant. Add high-index, nonzero long vectors, an independent integer oracle and executable Linux GOARCH=386 coverage. Current large JavaScript entropy tests generate zeros, so their checksum terms never grow.

### AUD-02: Rejected sitemap origins still trigger outbound requests

Priority P2; medium tooling security risk, conditional on untrusted sitemap content. Locations: `scripts/check-production-search.mjs:144-147`, `:221-243`, `:62-65`. OWASP A10:2021.

The checker records a defect for an off-origin page location, then adds it to the page-fetch queue anyway. A transport-stub proof confirmed a request to `https://outside.invalid/private` after that URL was rejected as noncanonical. With production mode, a compromised/misconfigured sitemap could direct the checker to an internal or unrelated HTTP endpoint reachable by its runner. No credential forwarding or successful data exfiltration was demonstrated. Redirects are also followed before the final target is checked, so a same-origin redirect can escape initial origin validation.

Mitigation: do not enqueue invalid locations. Constrain ordinary sitemap/page requests and their redirect hops to the authorized origin. Preserve intentionally configured host/protocol redirect checks as a separate explicit allowlist. For preview mode, map only already accepted canonical locations to the approved preview base. Test that forbidden targets and redirect hops are never requested, rather than merely asserting a nonzero exit.

### AUD-03: npm acceptance gate does not prove runtime payload identity

Priority P2; medium verification/integrity gap. Locations: `scripts/check-packed-consumers.mjs:36-42`, `:63-77`. OWASP A08:2021.

The installed-package gate checks inventory, license bytes, selected metadata, exports and a single checksum. It does not compare `index.js`, `index.d.ts` or README bytes with their reviewed source. In an isolated copy, a scratch-only prepack hook changed `normalize()` to always return `WRONG`, and postpack restored the source. The checker still exited zero and printed success. No such lifecycle hook or altered package exists in the reviewed candidate; the proof establishes a gate blind spot, not current compromise.

Mitigation: snapshot reviewed payload bytes before packaging and compare every installed payload file, with explicit handling for intentional metadata transformations. Run shared public-API conformance cases against the installed tarball. Permanently add mutation tests proving altered implementation, declarations and metadata fail acceptance. Retain lifecycle-script disabling during consumer installation.

### AUD-04: Entropy failure leaves a partial generated batch with stale success state

Priority P2; medium output/recovery correctness. Location: `docs/generator/index.html:461-481`. OWASP A04:2021.

The UI clears old output and publishes each chip before the batch finishes. Injecting an entropy exception on the second requested code left one partial chip, Copy All visible and the old success message `Generated 1 code.`. The exception is not caught or announced. This does not weaken generated randomness, but the displayed batch and status are inconsistent.

Mitigation: construct a complete batch in temporary data before publishing it; catch entropy failures and either retain the previous batch or clear all state coherently with an accessible error. Never substitute Math.random. Extend deterministic tests to invoke the actual `generate()` state transition with throw-first and throw-midbatch entropy sources.

### AUD-05: Malformed sitemap entries can disappear from production validation

Priority P2; low checker correctness risk. Locations: `scripts/check-production-search.mjs:139`, `:183`. OWASP A04:2021.

Both parsers match only complete entries with a nonempty loc. A valid sitemap plus `<url><loc></loc></url>` returned exit zero, one page and zero defects in an isolated proof. The malformed extra entry was ignored. The current regression fixture includes only valid entries, so it does not catch this false acceptance.

Mitigation: enumerate url blocks first and require exactly one nonempty valid loc for each, or use an appropriate XML parser with explicit schema checks. Add empty, missing, duplicate and malformed loc fixtures and assert consistent offline/production rejection. Preserve one-pass decoding.

### AUD-06: Collection failures produce misleading defects or no machine summary

Priority P2; low evidence-integrity/reliability risk. Locations: `scripts/check-production-search.mjs:90-103`, `:198-207`, `:254-263`. OWASP A09:2021.

A simulated DNS outage returned exit 2 but also reported a missing deployment URL as a defect, despite fetching no sitemap. This also occurred in the earlier live attempt. Separately, a successful fetch whose body read rejected terminated with exit 1 and no JSON summary because `response.text()` is outside the request catch. A consumer cannot reliably distinguish a site defect from incomplete observation.

Mitigation: catch and classify response-body failures, retain structured summaries, and track completeness per sitemap subtree. Compare deployment inventories only when the relevant collection is complete; otherwise report unknown/infrastructure rather than missing. Add all-failed, partial-failed, aborted-body, 404, 429 and successful-empty-response scenarios with exact counters and exit-code assertions.

### AUD-07: Star-link accessible name blocks the pending axe update

Priority P2; low security exposure, accessibility defect. Location: `docs/index.html:471-475`.

The visible `Star on GitHub` phrase is interrupted by repository text in `aria-label="Star snapsynapse/hardguard25 on GitHub"`. PR #5's previously inspected axe 4.14 run reports serious label-content-name-mismatch at 320, 390 and 768 pixels, including retries. This is already tracked in `ops/maintenance.md`, not a new decoder regression.

Mitigation: include the visible phrase contiguously in the accessible name, then pass the upgraded axe/browser gate. Do not suppress the rule. Keep PR #5 held until the exact candidate passes.

### AUD-08: Public mutable lookups control internal conformance

Priority P2; low security exposure, correctness risk. Locations: `js/index.js:138`, `:168`, `:205-209`; `js/index.d.ts:6-7`; `go/hardguard25.go:17`, `:144`. OWASP A04:2021.

In a fresh JavaScript process, `ALPHABET_SET.add('O')` made validate accept O; setting A's index to 25 changed its checksum from A to 0. TypeScript's ReadonlySet/ReadonlyMap annotations do not protect runtime collection contents. Go's exported map similarly drives validation. Exploitation requires code already running inside the consumer process; this is not a standalone remote-code boundary.

Mitigation: use private internal lookups and expose detached snapshots or actually immutable views while preserving API compatibility. Object.freeze alone does not freeze Set/Map contents. Add isolated-process mutation tests against source and installed packages; address Go map races if shared mutation remains supported.

### AUD-09: Clipboard failure has no accessible recovery

Priority P3; low UI reliability risk. Location: `docs/generator/index.html:508-521`.

Both copy paths assume the Clipboard API exists and handle only successful writes. Missing API or permission rejection produces an exception/rejection without a failure announcement or manual recovery path.

Mitigation: handle unavailable/rejected clipboard writes, announce failure and offer selection/manual copy. Add clipboard rejection/unavailability tests and browser pageerror/unhandled-rejection assertions. Cover clearing/regenerating while a copy promise is pending so success counts refer to the copied snapshot.

### AUD-10: Post-generation settings make display, clipboard and accessible names disagree

Priority P3; low UI consistency/accessibility risk. Locations: `docs/generator/index.html:361-365`, `:474`, `:517-520`.

After generating a chip, switching case updates its visible text but retains the old aria-label. Changing grouping before Copy All reformats raw codes using the new setting without updating visible chips. An isolated proof displayed `acdf-ghjk` while copying `acdfghjk`. Canonical identity is preserved; this is not identifier corruption.

Mitigation: render visible text, accessible name and copy values from a single current representation, or freeze batch formatting and copy that representation. Add stateful generate/change-case/change-grouping/copy-one/copy-all sequences; current tests mainly select settings before generation.

### AUD-11: Unknown npm lookup failure permits a publication attempt

Priority P2; low release-process risk. Location: `.github/workflows/release.yml:62-66`. OWASP A08:2021.

Any nonzero `npm view` status enters `npm publish`, including DNS, authentication, rate-limit and server failures. A fake-npm proof of the exact shell branch simulated EAI_AGAIN and confirmed publication was attempted. Registry immutability prevents this from being an overwrite exploit, and the proof did not call a real publisher.

Mitigation: require authoritative absent-version evidence; stop on unknown status, preserve diagnostics, and test exists/absent/401/403/429/5xx/timeout/malformed outcomes with publication-call assertions.

### AUD-12: Declared build-backend minimum cannot process current Python metadata

Priority P2; low packaging compatibility risk. Location: `python/pyproject.toml:2`, `:10-11`.

The package permits setuptools 68 while using SPDX-string license and project.license-files metadata, introduced in setuptools 77. Default latest-backend builds pass, hiding failures in supported-by-declaration constrained/no-isolation environments. This is confirmed from source and backend documentation, not an executed old-backend build. [Setuptools documents the version boundary](https://setuptools.pypa.io/en/latest/userguide/pyproject_config.html); [PyPA recommends setuptools >=77.0.3](https://packaging.python.org/en/latest/guides/writing-pyproject-toml/).

Mitigation: raise the supported minimum to a backend that implements the metadata and add both minimum-backend and current-backend wheel/sdist checks. Keep runtime Python support and build-backend support as separate claims.

### AUD-13: Published artifacts are rebuilt after preflight using newly resolved tools

Priority P3; low residual supply-chain/reproducibility risk. Locations: `.github/workflows/release.yml:40`, `:83-87`; `scripts/check-python-package.py:26`. OWASP A08:2021.

Preflight validates a temporary artifact; the publishing job resolves Python tooling again and builds a different artifact. Python build requirements remain open-ended. Source identity and successful preflight do not prove the published bytes equal the bytes tested. This was a documented residual in the prior audit; no compromised tool or release was demonstrated.

Mitigation: use reviewed build constraints, build once without publication authority, retain hashes and publish those exact validated artifacts in the narrowly authorized job. Gate missing or modified artifacts. Avoid presenting dependency pinning alone as proof of publisher identity or reproducible bytes.

## Deterministic verification priorities

| Order | Gate to add or strengthen | Acceptance evidence |
|---|---|---|
| 1 | Independent checksum oracle plus platform/length boundaries | Nonzero high-index long vectors match exact modular arithmetic; 32-bit Go executes without panic. Keep cross-runtime parity separate from the specification oracle. |
| 2 | Production search scenario matrix | Invalid targets cause zero forbidden requests; malformed entries fail; infrastructure failures retain JSON/exit 2 without invented missing-page findings; aborted bodies and redirect hops are covered. |
| 3 | Installed-artifact identity and mutation gate | Every payload byte matches the prepack snapshot; shared conformance runs against installed artifacts; intentional normalize/declaration/metadata mutations fail. Assert Python Requires-Dist remains absent under the dependency-free contract. |
| 4 | Stateful generator failure/recovery eval | Actual generate/copy transitions handle entropy and clipboard failures coherently; visible/copied/announced values agree; no unhandled rejection; generation/copy make no network or persistence calls. |
| 5 | Workflow contract checks | Parse workflows to enforce full action hashes, scoped permissions, deploy depending on validation and publication depending on preflight. Removing any protection in an isolated mutation must fail. Add Go helper CLI tests for failed ls-remote with partial stdout. |
| 6 | Build compatibility and publication identity | Declared minimum backend builds; current backend builds; the published artifact's hashes equal the validated artifact. Registry lookup uncertainty stops before publish. |

The new decoder unit tests extract the production function into a VM. They prove function behavior but do not prove every call site uses it. Retain the whole-script fixtures and extend them with negative cases; avoid replacing those with more implementation-shaped unit assertions. Fixed-seed fuzzing can broaden syntax/Unicode/URL cases, with minimized counterexamples committed as stable fixtures.

## Security coverage and existing controls

| OWASP category | Review outcome |
|---|---|
| A01 Broken Access Control | No hosted account/data routes. Workflow privileges are job-scoped; no auth bypass identified. |
| A02 Cryptographic Failures | CSPRNG sources and rejection sampling below 225 are retained. Check digit is explicitly noncryptographic. AUD-01 is arithmetic conformance/availability, not an encryption failure. |
| A03 Injection | No confirmed shell, SQL, template or DOM injection. Generated values use textContent; innerHTML assignments clear containers rather than insert untrusted text. |
| A04 Insecure Design | Arithmetic, public mutable state, malformed-input acceptance and UI failure-state findings above. |
| A05 Misconfiguration | Hosted header hardening remains defense in depth: landing-page CSP only upgrades requests and generator lacks a restrictive policy. No injection entry point or sensitive stored data was demonstrated; no hosting migration is recommended solely for this observation. |
| A06 Vulnerable Components | No known advisories in current queried scopes. Runtime libraries declare no external dependencies. Advisory results are date- and inventory-specific. |
| A07 Authentication Failures | No authentication/session API; identifiers are documented as lookup values, not bearer credentials. |
| A08 Integrity Failures | Artifact, lookup and build-identity findings above. Action SHA pins, scoped OIDC, exact Python inventories and Go tag-target checks are positive controls. |
| A09 Logging/Monitoring | Production evidence classification and missing body-failure summaries require strengthening. No secret logging was confirmed. |
| A10 SSRF | Outbound tooling request-confinement finding AUD-02; no hosted SSRF endpoint exists. |

The generator has normal UI bounds of 500 codes by 32 payload characters, allowlisted separators, no third-party executable scripts and no observed application telemetry or persistent browser storage. Libraries deliberately have no standard-wide length limit; hostile-input limits belong at consumer ingress. No new benchmark, alphabet change, hosted service or empirical human-factors claim is recommended.

## Delta and delivery

The 2026-10-26 audit's ASCII folding, entropy-batch cap, separator allowlist, pinned workflow actions, Pages validation dependency and Go tag-identity remedies remain present. Its Python tooling advisories remain absent in the current queried environment. The original decoder defect is addressed by the current local candidate. AUD-07 was already tracked; AUD-13 is a known residual rather than a newly discovered compromise. The other findings were independently identified in this review and are not evidence that the prior release was compromised.

Recommended next tranche: checksum modular arithmetic with independent regression evidence, followed by production-checker confinement/error semantics and artifact acceptance. Keep browser recovery, accessibility and release-tooling changes separately reviewable. No issue tickets were created and no mitigation was implemented by this audit. All pre-existing candidate edits remain uncommitted; this report is an additional uncommitted file. There are no local commits absent from origin/main.

## Remediation checkpoint, 2026-11-18

Sam authorized implementation of all mitigations and the recommended deterministic additions after the audit. This section describes the current local candidate; the original findings above remain the discovery record. No candidate commit, push, PR, merge, tag, release or deployment has occurred.

| Finding | Local disposition | Verification |
|---|---|---|
| AUD-01 | Implemented | Incremental exact modulo arithmetic in all three runtimes; six compact repeated-payload vectors; 79 JS and 48 Python tests; Go suite and independent specification oracle pass. Linux/386 test binary compiles locally; actual execution is configured in Linux CI and has not run here. |
| AUD-02 | Implemented | Invalid page URLs are never enqueued; manual redirect traversal validates each hop before transport; controlled probes assert no forbidden request. Explicit redirect checks retain their configured origins. |
| AUD-03 | Implemented | Prepack source snapshots are compared before executing installed code; every npm payload file is checked; installed npm/Python shared corpus and independent checksum cases pass; payload mutation tests fail as expected. |
| AUD-04 | Implemented | Full batches are staged before display. Entropy failure retains prior results and announces recovery; throw-first/midbatch and absent-Web-Crypto cases pass. |
| AUD-05 | Implemented | Shared bounded XML 1.0 sitemap parser validates every entry and preserves text segmentation; missing/empty/duplicate loc, malformed XML/entity/namespace cases reject. 128 seeded valid serializations and near-miss mutations pass. |
| AUD-06 | Implemented | Body and transport errors preserve summaries and infrastructure exit codes. Incomplete collection suppresses unsupported inventory differences. Partial outages, status codes, malformed configuration and cancellation rejection pass. |
| AUD-07 | Implemented locally | Star-link accessible name corrected. All 15 browser tests pass with axe Playwright 4.14.0 / axe-core 4.14.1. The existing remote PR remains unchanged. |
| AUD-08 | Implemented | JS/Go exported lookups are detached snapshots; source/installed mutation tests and independent reviewer probes preserve internal conformance. |
| AUD-09 | Implemented | Clipboard missing/rejected/synchronous-failure paths expose selected readonly text and accessible recovery; promise-race cases pass. |
| AUD-10 | Implemented | Reformatting updates display, copy and accessible labels together. Revision/timer guards suppress stale feedback. |
| AUD-11 | Implemented | Only an authoritative npm registry 404 permits publication; transport/auth/rate/server/malformed responses stop. Structural publisher checks and Go failed-transport CLI regression pass. |
| AUD-12 | Implemented and verified | Sam approved source builds requiring Python >=3.10 while installed wheels retain Python >=3.9 on 2026-11-18. The backend floor and minimum lock are patched setuptools 84.1.0; release builds use 84.2.1. Actual Python 3.10.20 minimum-backend wheel/sdist and installed shared conformance checks pass. The resulting wheel passes shared conformance in a clean Python 3.9.25 consumer, and source-build attempts under 3.9 stop with explicit guidance. |
| AUD-13 | Implemented | Preflight retains validated artifacts; manifest digest is transferred through preflight job outputs and required by publishers. Artifact plus manifest replacement fails against that anchor. Publishers consume the exact files without rebuilding. |

Integrated local `npm run verify` passed under official Node 22.23.5, including the 469-case independent specification/parity corpus, all library suites, 17 deterministic generator state/privacy scenarios, 17 search/parser tests, workflow/artifact mutation gates, installed-package conformance and hash-pinned release-backend builds. A separate browser run passed all 15 tests under Node 24.22.3 and upgraded axe. No new hosted browser run or GitHub CI run is claimed.

The hardened production checker passed read-only against https://hardguard25.com/: two pages, collectionComplete true, zero defects and zero infrastructure failures. This validates the existing deployed site with the candidate checker; it does not establish deployment of candidate code.

A local publication-handoff rehearsal retained npm tarball, wheel and sdist under a temporary artifact directory, wrote a source/commit/hash manifest and successfully verified it with a separately retained expected manifest digest. These are unpublished candidate artifacts still labeled 1.3.9, not replacements for immutable published 1.3.9 artifacts. They must not be uploaded as an existing version.

Independent adversarial passes found and corrected draft XML whitespace/attribute parsing errors, a self-contained-manifest replacement bypass, workflow ordering/shell/skip bypasses and vacuous empty-lock acceptance. The final re-review found no further concrete blocker in the completed scopes. Newly added draft tooling pins were advisory-scanned before acceptance: vulnerable draft wheel/setuptools/YAML pins were replaced. The final npm tree reports zero advisories. Both complete flattened build locks, nine requirements each including conditional platform dependencies, report zero known advisories. No known-vulnerable provisional backend pin remains in either lock.

Post-change Bandit scanned 297 Python lines: zero medium/high, six low fixed-argument subprocess/import observations. Git whitespace checks pass. Remaining external evidence: Linux/386 execution, minimum-runtime/Windows CI and real publisher behavior require a future authorized delivery; no publisher was invoked during these tests.

Final compatibility closeout: the approved backend floor is setuptools 84.1.0; source builds require Python >=3.10 and pure Python wheels retain runtime >=3.9. The minimum-backend CI job runs Python 3.10, enforced by the parsed workflow contract. The actual temporary Python 3.10 run uncovered a POSIX portability issue in the package verifier: copying a relocatable interpreter into its venv lost its dynamic-library path. Using symlinks on POSIX while retaining Windows copy behavior resolved that failure; the minimum build and final canonical verifier then passed. No global interpreter, executable path or settings were changed. All thirteen findings now have implemented, locally verified mitigations; no owner compatibility decision remains open. Hosted CI, Linux/386 execution and publication remain distinct future evidence.
