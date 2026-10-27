# HardGuard25 security and documentation review

Review and remediation date: 2026-10-26, America/Denver. Base commit: `aebe8c21f157cf8f53475b57ef3dc11d7de3909b` on `main`. Sam authorized the fixes, environment refresh and checks, then authorized final diff review, staging, commit and push. Tagging and release publication remain separate from the requested release preparation. Output: Markdown only.

## Current remediation state

All ten repository findings passed local remediation verification. All eleven distinct advisory/package pairs identified in the local Python environment are resolved by the refreshed environment's advisory scan. The checks below describe the pre-publication validation snapshot; subsequent Git, CI and deployment evidence is recorded in the release-preparation record. The initial review evidence is retained below as a dated baseline.

| Finding | Current status | Resolution and evidence |
|---|---|---|
| SEC-001 | Fixed locally | ASCII-only case folding in JavaScript, Python and Go; shared non-ASCII cases include ligature expansion and verification inputs; all 469 parity cases pass |
| SEC-002 | Fixed locally | Separator selector offers only hyphen, underscore, dot and space; the formatter safely falls back to hyphen for an unsupported injected selection; canonical/checksum round trips and clipboard paths pass |
| SEC-003 | Fixed locally, not deployed | Pages deploy depends on a same-workflow validation job running both canonical and browser verifiers; deployment authority is scoped to the dependent job |
| SEC-004 | Fixed locally, not exercised against registries | Existing npm/PyPI artifacts stop publication; Go helper accepts only a tag identifying the expected commit; mismatches and malformed/failed remote evidence stop it; recovery limits are documented |
| SEC-005 | Fixed locally | All action references in all four workflows are pinned to full upstream commit hashes resolved from their existing version lines; Dependabot remains configured |
| COR-001 | Fixed locally | JavaScript entropy batches are capped at 65,536 bytes; deterministic cases at lengths 54,614, 65,537 and 70,000 force refills/rejections and retain valid checksums |
| DOC-001 | Fixed locally | All three spec examples use complete shared byte streams and outputs; documentation verification independently applies acceptance/modulo mapping and checks fixture parity |
| DOC-002 | Fixed locally | Source checksum examples use Y for 3KMN7FUA9CD1; documentation checks execute checksum, verification and generated-length examples |
| DOC-003 | Fixed locally | Lookup identifiers are distinguished from bearer/authentication secrets across the spec, READMEs, implementation guide, site, briefings, assistant-guide mirrors and skill; ambiguous token use cases were replaced |
| DOC-004 | Fixed locally | Agent guidance accurately states that npm tools are locked while Python test/build requirements resolve at run time; deterministic inputs are distinguished from a pinned toolchain |

The minor copy-label observation was also addressed in the edited README, implementation, package README and skill examples. The guide metadata and sidecars, briefing mirrors, skill file version 9 and manifest hash were refreshed. Parent package/spec/bundle release versions remain 1.3.8; changes are recorded under Unreleased and are not a published 1.3.9 release.

## Local Python environment refresh

The refresh targeted this repository's existing ignored `.venv`, using the patched system pip 26.2.2 to perform the download and install into that environment. Other projects and the global Python environment were not upgraded by this task.

| Package | Before | After |
|---|---|---|
| pip | 25.3 | 26.2.2 |
| certifi | 2026.5.20 | 2026.10.23 |
| Pygments | 2.19.2 | 2.21.0 |
| pytest | 9.0.2 | 9.1.1 |
| urllib3 | 2.7.0 | 2.8.0 |

`pip check` reports no broken requirements. pip-audit 2.10.0 scanned all 28 installed distribution entries and reported no known vulnerabilities. Thus DEP-001 through DEP-005, representing eleven distinct advisories, are resolved in this local environment. This does not attest to future CI resolutions, another virtual environment, or bundled tools inside third-party publishing containers.

## Checks after remediation

| Check | Result |
|---|---|
| Canonical `npm run verify` | Passed: 469 cross-runtime cases, 77 JavaScript tests, 47 Python tests, Go tests, two Go release-tag tests, docs/examples/numeric/URL/search/metadata/agent/protocol checks, installed npm/TypeScript consumer, exact wheel/sdist and clean wheel consumer |
| Local `npm run verify:browser` | All 10 Playwright/axe tests passed, including the new separator selection/display/clipboard case |
| npm audit | Zero advisories in the locked development tree |
| pip-audit on refreshed .venv | Zero advisories across 28 distribution entries |
| pip check | No broken requirements |
| Bandit 1.9.4 | No medium/high findings; the package-verifier subprocess observations remain low and were assessed as before |
| Gitleaks 8.30.1 on current source snapshot | No leaks found; snapshot includes tracked and non-ignored untracked files, excludes ignored dependency/build caches; approximately 485,176 bytes scanned at this checkpoint |
| actionlint 1.7.12 | All four edited workflows pass; shellcheck integration disabled because shellcheck is not installed |
| Actionlint tool integrity | Downloaded temporary binary archive matched upstream asset SHA-256 aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f |
| Local Markdown file targets and Git whitespace | No missing tracked local file-link targets; git diff --check passes |

The regression tests reproduced the JavaScript Unicode/entropy-batch failures before the runtime fixes. The refreshed Python environment passes its normal package suite. An initial focused Python command from the repository root failed import collection; rerunning it from the package directory, as the canonical verifier does, passed. No product defect was inferred from that invocation error.

The independent workflow adversarial pass found no publication bypass: matching lightweight/annotated tags and absent tags are accepted; mismatched tags, orphaned/duplicate/extra refs, malformed output and Git failure with partial stdout are rejected. A mocked npm existing-version case exits nonzero without publishing. Its recovery-documentation finding was corrected in both release documents: rerun publishers only for genuinely absent artifacts; a job that uploaded before failing needs separately authorized downstream recovery. No mock was run against a real registry or pushed tag.

The final independent runtime/generator pass also found no actionable residual. JavaScript and Python rejected 93 targeted Unicode, case-expansion, format-character and surrogate variants. All pinned separators retained legitimate ASCII normalization and checksum verification. Entropy quota/refill cases through 131,073 payload characters passed, including a fully rejected first batch and entropy failure propagation. The production generator VM passed 176 upper/lower, grouping, separator and copy combinations, including tampered invalid separator selections, without canonical-identity or checksum drift. One initial reviewer test-oracle checksum expectation was corrected by independent arithmetic; it was not a product defect. The final canonical verifier rerun after metadata/example-check changes passed again.

## Delivery state and residual limits

At the remediation-validation checkpoint, all source, workflow, tests, documentation and report changes were local and uncommitted, with HEAD at the reviewed base. The final diff review found no blocking issue and confirmed the ten findings, regression coverage, guide/skill integrity and reviewed file scope. Sam has now authorized staging, commit and push of that tranche. No package tag, registry publication or GitHub Release is authorized by release preparation alone.

SEC-003 and SEC-005 describe locally fixed workflow definitions; GitHub has not run this candidate and the live service still uses the published workflow/site. Registry rerun behavior has local and static validation, not a production publication trial. Repository-wide SHA enforcement, branch requirements and environment protections remain unchanged; the local fixes do not claim those external settings were altered.

The initial header-hardening observations remain defense-in-depth considerations rather than unresolved items among the ten findings. No hosting migration or new global identifier/authentication feature was introduced. Minimum-runtime and Windows checks have not been freshly executed for this uncommitted candidate; they remain part of future CI. No live exploitation or new human-factors study was performed.

## Initial review evidence, before remediation

The following sections describe the original review of the base commit and original local environment. Their open findings, scan counts, line references and delivery statements are historical; the tables above govern current local remediation status.

## Executive assessment

The runtime entropy sources and rejection sampling are sound in the paths inspected. No critical or high vulnerability was confirmed in HardGuard25's own code. The review found ten repository findings: five medium and five low, spanning conformance, generator correctness, publication integrity, and documentation. The canonical verifier passes despite these findings, demonstrating specific coverage gaps.

The existing ignored Python development environment separately contains eleven distinct advisory/package pairs across five packages. Upstream advisory severity is one critical, two high, six medium, and two low. These are local tooling findings, not dependencies shipped in the HardGuard25 packages. They deserve remediation before further development or publication work uses the affected environment.

| Scope | Critical | High | Medium | Low | Total |
|---|---:|---:|---:|---:|---:|
| Repository findings | 0 | 0 | 5 | 5 | 10 |
| Local Python tooling advisories, upstream severity | 1 | 2 | 6 | 2 | 11 |

Overall assessment: moderate repository correctness and release-integrity risk, with a higher-priority local tooling cleanup. No exploitation, credential leak, or compromised release was established.

## Prioritized repository findings

| ID | Priority | Severity | Finding | Category |
|---|---|---|---|---|
| SEC-001 | P2 | Medium | Unicode case expansion produces incompatible identities across runtimes | OWASP A04:2021 |
| SEC-002 | P2 | Medium | Generator formatting can change the identifier being copied | Correctness and data integrity |
| SEC-003 | P2 | Medium | Pages publishes independently of declared blocking checks | OWASP A08:2021 |
| SEC-004 | P2 | Medium | Release reruns accept existing artifacts without checking identity | OWASP A08:2021 |
| DOC-001 | P2 | Medium | Normative generation examples contradict rejection sampling | Documentation and conformance |
| SEC-005 | P3 | Low | Privileged publishing actions use mutable references | OWASP A08:2021 |
| COR-001 | P3 | Low | JavaScript generation has an undocumented entropy-batch ceiling | Correctness |
| DOC-002 | P3 | Low | JavaScript API comments contain an incorrect checksum example | Documentation |
| DOC-003 | P3 | Low | Authentication-token guidance conflicts across surfaces | OWASP A04:2021 |
| DOC-004 | P3 | Low | CI tooling is described as pinned but Python tools are unbounded | Documentation and reproducibility |

### SEC-001: Unicode case expansion breaks the cross-runtime identity contract

Evidence: [JavaScript normalization](/Users/snap/Git/hardguard25/js/index.js:129), [Python normalization](/Users/snap/Git/hardguard25/python/hardguard25/__init__.py:120), [Python checksum](/Users/snap/Git/hardguard25/python/hardguard25/__init__.py:148), [Go normalization](/Users/snap/Git/hardguard25/go/hardguard25.go:128), and [JavaScript checksum](/Users/snap/Git/hardguard25/js/index.js:163).

JavaScript and Python apply Unicode uppercase conversion before checking alphabet membership. U+FB00, LATIN SMALL LIGATURE FF (`ﬀ`), expands to `FF` in both. Go's uppercase conversion does not perform that expansion. JavaScript's checksum uppercases individual code units and also disagrees with Python's checksum.

| Operation | JavaScript | Python | Go |
|---|---|---|---|
| Normalize `ﬀ` | `FF` | `FF` | Error |
| Validate `ﬀ` | true | true | false |
| Calculate checksum of `ﬀ` | Error | `G` | Error |
| Verify `ﬀG` | true | true | Error |

This violates the shared behavioral contract and the documented non-ASCII rejection expectations. Mixed-runtime services can disagree about valid identifiers. This repository contains no authorization layer, so a direct authentication bypass is not established.

Remediation: specify ASCII letter case folding explicitly, preserve the permitted Unicode separator set, reject other non-ASCII input consistently, and add `ﬀ` and `ﬀG` cases to every public parsing/checksum API's shared fixtures. The current 459-case parity corpus does not cover case expansion. Validate the intended normative wording before changing the contract; the existing invariant is ASCII identifiers.

### SEC-002: Generator separators can alter identifier identity

Evidence: [separator input](/Users/snap/Git/hardguard25/docs/generator/index.html:238), [formatCode](/Users/snap/Git/hardguard25/docs/generator/index.html:391), and [displayed copy target](/Users/snap/Git/hardguard25/docs/generator/index.html:467).

The separator field accepts any character. The formatter inserts it into a generated payload, and individual-copy operations use that displayed value. The library removes only the specified punctuation and Unicode separators.

Executing the production formatter in Node's VM with payload `ACDF0G7H` and grouping of four reproduced:

| Separator | Displayed value | Library normalization |
|---|---|---|
| `-` | `ACDF-0G7H` | `ACDF0G7H` |
| `/` | `ACDF/0G7H` | Rejected |
| `0` | `ACDF00G7H` | `ACDF00G7H`, a different identifier |

The issue is output integrity, not XSS. User-influenced content is assigned through `textContent`. With checksums enabled, unsupported separators can also invalidate the copied code's checksum.

Remediation: constrain the separator to the normalization contract and validate the field before generation. Add a round-trip assertion that normalizing a formatted code returns the original canonical code. Cover individual copy and Copy All so their representations remain equivalent.

### SEC-003: Pages deployment does not depend on blocking validation

Evidence: [Pages deployment](/Users/snap/Git/hardguard25/.github/workflows/pages.yml:22), [post-deployment search check](/Users/snap/Git/hardguard25/.github/workflows/pages.yml:32), and [declared blocking checks](/Users/snap/Git/hardguard25/repo-standards.yaml:62).

Every push to `main` starts Pages deployment independently of Test and Accessibility. A change that breaks generator conformance or guide hashes can be published while the corresponding validation workflow fails. The search job runs after publication and does not establish runtime, guide-integrity, or accessibility acceptance.

The live ruleset currently prevents default-branch deletion and non-fast-forward updates. It does not require status checks. Direct fast-forward maintenance is an intentional existing policy, so the absence of mandatory PRs is not independently classified as a defect.

Remediation: make deployment depend on validation of the same commit, either through a shared workflow or a validated artifact and explicit commit identity. Keep post-deployment search verification as an additional check. If checks are intentionally procedural, qualify the declaration so it does not imply an enforced deployment gate. No failed deployment was demonstrated against production.

### SEC-004: Existing-release handling checks existence rather than identity

Evidence: [npm existence check](/Users/snap/Git/hardguard25/.github/workflows/release.yml:62), [PyPI skip-existing](/Users/snap/Git/hardguard25/.github/workflows/release.yml:91), [Go tag existence check](/Users/snap/Git/hardguard25/.github/workflows/release.yml:103), and [rerun-safe claim](/Users/snap/Git/hardguard25/CLAUDE.md:71).

If `go/vX.Y.Z` already exists at a different commit, the workflow skips it and succeeds without comparing the peeled commit to `GITHUB_SHA`. npm/PyPI skipping similarly does not prove that an existing package corresponds to the reviewed release source. An accidental pre-existing tag or partially reconciled release can therefore finish green with inconsistent consumer artifacts.

This is a future rerun integrity gap. Current local `v1.3.8` and `go/v1.3.8` both peel to `9ead0a5ad76ede45f8c8149754c54e2917808054`; no current mismatch was found. Registry content/provenance was not re-audited in this session.

Remediation: fail when an existing Go tag points elsewhere. For existing registry artifacts, verify source/provenance/content identity or stop for explicit reconciliation. Describe current behavior as idempotent existence handling until identity verification is enforced.

### DOC-001: Normative generation vectors are incorrect and incomplete

Evidence: [SPEC test vectors](/Users/snap/Git/hardguard25/SPEC.md:176).

All three printed byte/output pairs contradict the specified acceptance threshold and modulo mapping. Recomputing the displayed byte prefixes gives:

| Example | Printed output | Actual accepted prefix |
|---|---|---|
| First | `AC0G7HJK2MNPR3UW` | `69MCFYAM578UUN4` |
| Second | `D7H2GJ0KMW1PRUYA` | `D1NR77KA3YYKND9` |
| Third | `0CNG5J7KM2PRUWAH` | `1N3K9116DCK9KRN` |

For example, the first byte `0x6a` is accepted and maps to alphabet index 6, so the first output cannot be `A`. Each displayed 16-byte prefix contains only 15 accepted bytes; the ellipses prevent complete standalone reproduction. The shared fixture correctly maps the complete first stream to `69MCFYAM578UUN47`.

These examples are expressly presented as cross-language verification material. A conformant independent implementation would appear to fail them.

Remediation: publish complete input streams and exact outputs from the shared fixture. Extend documentation verification to compare the normative prose vectors with the executable fixture, rather than checking only selected README examples.

### SEC-005: Publishing actions use mutable upstream references

Evidence: [PyPI publishing action](/Users/snap/Git/hardguard25/.github/workflows/release.yml:88) and its job's `id-token: write` permission at line 74. Checkout and setup actions also use mutable major-version tags. Current repository action settings allow all actions and do not require SHA pinning.

A retargeted or compromised upstream action could execute with the publishing job's identity. This is a supply-chain hardening gap; no upstream compromise was found.

Remediation: pin reviewed action commits, keep readable version comments, and retain Dependabot updates for action hashes. Preserve the existing job-scoped publishing permissions.

### COR-001: JavaScript generation has an undocumented length ceiling

Evidence: [entropy-batch allocation](/Users/snap/Git/hardguard25/js/index.js:65).

The implementation passes `ceil(remainingLength * 1.2)` bytes to Web Crypto in a single call. Reproduced with the installed Node runtime: `generate(54613)` returns 54,613 characters; `generate(54614)` throws `QuotaExceededError`. The public contract accepts positive integer lengths without documenting this boundary.

The browser UI limits payloads to 32, so its ordinary UI path is unaffected. This is a low-impact library correctness issue, not evidence of weak randomness.

Remediation: cap individual entropy requests at 65,536 bytes while preserving rejection sampling, or explicitly validate and document a supported payload bound.

### DOC-002: Source API comments show the wrong checksum

Evidence: [generation example](/Users/snap/Git/hardguard25/js/index.js:51), [checksum example](/Users/snap/Git/hardguard25/js/index.js:154), and [verification example](/Users/snap/Git/hardguard25/js/index.js:181).

The comments use `K` as the checksum for `3KMN7FUA9CD1`. Executing the shipped checksum function returns `Y`. The advertised complete value ending in `K` does not verify. The existing public quickstart value `AC3H7PUW` correctly uses `N` and passes its dedicated documentation check.

Remediation: correct all three source comments together and execute checksum examples from source documentation as well as READMEs.

### DOC-003: Token terminology crosses the stated authentication boundary

Evidence: [README API-token use case](/Users/snap/Git/hardguard25/README.md:50), its one-time-passcode use case at line 55, [length guidance](/Users/snap/Git/hardguard25/README.md:170), [agent non-fit list](/Users/snap/Git/hardguard25/docs/agents.json:19), and [implementation boundary](/Users/snap/Git/hardguard25/docs/IMPLEMENTATION.md:3).

The README advertises API tokens and one-time passcodes and labels 12-character identifiers as internal tokens. Other surfaces explicitly exclude authentication and session secrets. Collision-risk guidance does not establish a bearer credential's security requirements. An assistant or developer can follow different recommendations depending on the entry point.

Remediation: consistently distinguish public lookup identifiers from bearer/authentication secrets. Qualify or replace ambiguous token examples and make the same boundary explicit in the spec, READMEs, site, briefing, assistant guide, and skill. This is a documentation inconsistency; the generator's CSPRNG is not the defect.

### DOC-004: Python build and test tools are not pinned

Evidence: [pinned-tools claim](/Users/snap/Git/hardguard25/CLAUDE.md:70), [CI installation](/Users/snap/Git/hardguard25/.github/workflows/test.yml:30), [release installation](/Users/snap/Git/hardguard25/.github/workflows/release.yml:40), and [Python build requirements](/Users/snap/Git/hardguard25/python/pyproject.toml:2).

CI installs unversioned `pytest build`; isolated package builds resolve `setuptools>=68.0` and unversioned `wheel`. The minimum-Python job constrains pytest's major version but does not pin it. Root npm development dependencies are pinned and locked. Repeatable test inputs should not be confused with a pinned toolchain.

Remediation: correct the claim or introduce reviewed build/test constraints with an update process. Audit the selected tooling versions when refreshing the environment; do not freeze the vulnerable versions identified below.

## Automated scan results

| Check | Result | Scope and limits |
|---|---|---|
| Gitleaks 8.30.1 | No leaks found | 56 commits, approximately 672,532 bytes scanned; detector result, not proof every possible secret is absent |
| Sensitive filenames | No tracked/history matches | Checked `.env`, `.env.*`, `.pem`, and `.key` paths; `.env` and `.env.*` are ignored |
| Bandit 1.9.4 | Zero medium/high; four low | Python runtime and package-check script, 256 scanned lines; low findings concern subprocess usage in the verifier |
| npm 11.20.0 audit | Zero advisories | Locked root development tree, six dependency entries; runtime JS package has no dependencies |
| pip-audit 2.10.0 | Eleven unique advisory/package pairs | Existing `.venv/lib/python3.14/site-packages`; includes development/publication tools, not the published library dependency graph |
| GitHub Dependabot alerts | No open alerts returned | Current repository API; does not inventory an ignored local virtual environment |
| Local Markdown file links | No missing local file targets found | Tracked Markdown relative file links; remote destinations and heading anchors were not exhaustively checked |

Bandit's four low findings were assessed against the script: commands use explicit argument arrays without a shell, package archive inspection does not extract members, and the installed wheel probe uses a clean temporary environment. They were not promoted to confirmed vulnerabilities. The CLI's Python is 3.14.10; the default `python3` on this machine is 3.15.1.

### Local Python dependency findings

pip-audit returned 19 vulnerability records. Deduplicating by normalized package plus advisory ID leaves eleven, not nineteen. GitHub's advisory API was queried for each alias to confirm severity and patched versions. Severity below is upstream advisory severity; exploitability in this workstation's exact workflows was not demonstrated.

| ID | Installed tooling | Advisories | Highest upstream severity | Patched versions covering listed findings |
|---|---|---:|---|---|
| DEP-001 | certifi 2026.5.20 | 1 | Critical | 2026.10.18 first fixes it; scanner also reports 2026.10.19 |
| DEP-002 | pip 25.3 | 5 | Medium | 26.2.0 covers the listed patch thresholds |
| DEP-003 | Pygments 2.19.2 | 1 | Low | 2.20.0 |
| DEP-004 | pytest 9.0.2 | 1 | Medium | 9.0.3 |
| DEP-005 | urllib3 2.7.0 | 3 | High | 2.8.0 |

DEP-001 affects certificate trust: certifi's maintainer removed roots associated with compromised intermediate CA keys. The installed version predates that fix. Prioritize refreshing this environment before further network-facing packaging/publication activity. No interception was established. [Maintainer advisory](https://github.com/certifi/python-certifi/security/advisories/GHSA-6q48-6c7w-9gw2).

DEP-002 covers [CVE-2026-1703](https://github.com/advisories/GHSA-6vgw-5pg2-w6jp), [CVE-2026-3219](https://github.com/advisories/GHSA-58qw-9mgm-455v), [CVE-2026-6357](https://github.com/advisories/GHSA-jp4c-xjxw-mgf9), [CVE-2026-8643](https://github.com/advisories/GHSA-wf93-45jw-7689), and [CVE-2026-13346](https://github.com/advisories/GHSA-qwm4-qh6w-59xr). They concern archive interpretation, installation path handling, deferred imports, and index URL processing. Malicious package/index input is relevant to several prerequisites; ordinary installation is not proof of exploitation.

DEP-003 is [CVE-2026-4539](https://github.com/advisories/GHSA-5239-wwwm-4pmq), a lexer regular-expression denial of service. DEP-004 is [CVE-2025-71176](https://github.com/advisories/GHSA-6w46-j5rx-g56g), involving local temporary-directory handling. These findings describe installed tooling, not code copied into HardGuard25 artifacts.

DEP-005 covers [unbounded chunk-size buffering](https://github.com/urllib3/urllib3/security/advisories/GHSA-vxq7-64xx-v4gw), [a Deflate streaming loop](https://github.com/urllib3/urllib3/security/advisories/GHSA-gh4c-6fx4-qh6g), and [HTTPS proxy TLS-policy confusion](https://github.com/urllib3/urllib3/security/advisories/GHSA-8988-9cw3-xx77). Exposure depends on streamed responses or the documented proxy configuration conditions. No affected proxy configuration was asserted or inspected.

Suggested remediation is an isolated, reviewed environment refresh to at least the listed fixed versions, followed by pip-audit and the repository verifier. No packages were upgraded during this review. Future CI resolves Python tools independently, so these installed versions do not establish current GitHub runner exposure.

## Code and configuration coverage

| OWASP category | Assessment |
|---|---|
| A01:2021 Broken Access Control | No backend routes, accounts, protected data store, or authorization decisions in this repository; no finding |
| A02:2021 Cryptographic Failures | Platform CSPRNGs, rejection of bytes 225-255, and entropy-failure propagation verified; no weak RNG found; local certificate-trust advisory is DEP-001 |
| A03:2021 Injection | No runtime shell execution, database queries, or dynamic evaluation; browser output uses textContent; no confirmed injection |
| A04:2021 Insecure Design | Cross-runtime identity discrepancy SEC-001 and token-boundary ambiguity DOC-003 |
| A05:2021 Security Misconfiguration | Header hardening observations below; no credentials-bearing CORS endpoint or backend configuration |
| A06:2021 Vulnerable and Outdated Components | npm tree clean; local Python tooling findings DEP-001 through DEP-005; no third-party library runtime dependencies |
| A07:2021 Identification and Authentication Failures | Authentication is outside this library/static-site scope; DOC-003 concerns adoption wording |
| A08:2021 Software and Data Integrity Failures | Deployment gating SEC-003, release identity SEC-004, mutable actions SEC-005; existing package-inventory controls are strong |
| A09:2021 Security Logging and Monitoring Failures | No hosted sensitive transaction service requiring audit logs; no finding; GitHub CI history and alerts inspected |
| A10:2021 SSRF | No user-controlled server-side fetching or hosted execution API; no finding |

The two public HTML routes returned HTTPS 200. Observed responses had no CSP response header, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, or Permissions-Policy. The landing page's meta CSP only upgrades insecure requests; the generator has no restrictive CSP. These are defense-in-depth observations, not separate exploitable findings: no injection path was identified, and the current host is GitHub Pages. A future hosting/security-policy decision should account for inline scripts and handlers rather than inserting an incompatible CSP. No host migration is proposed by this review.

The observed wildcard Access-Control-Allow-Origin is on public static documents; there is no credentialed API and it is not classified as a CORS vulnerability. Backend rate limits, session cookie controls, database encryption, and CSRF tokens are not applicable to this source scope.

## Documentation reconciliation

| Surface group | Classification and evidence |
|---|---|
| INTENT, ROADMAP, PROJECT_CONTEXT | Maintenance-only scope and authority routing are coherent; current checkout still declares 1.3.8 |
| SPEC and conformance report | Incorrect prose vectors in DOC-001; Unicode contract/parity gap in SEC-001; declared existing corpus really passes |
| README, package READMEs, implementation/adoption guides | Quickstart checksum for AC3H7PUW is correct; collision math and guidance checks pass; authentication-token terminology needs DOC-003 |
| Library source documentation | Incorrect JavaScript checksum comments in DOC-002 |
| CI/release instructions | DOC-004 pinned-tooling wording; SEC-003 enforced-versus-procedural checks; SEC-004 rerun identity |
| Agent guides, discovery JSON, skill bundle | Byte/hash/metadata checks pass; no hosted-execution API claim; propagate any token/normalization clarification across mirrors |
| Human factors and benchmark protocol | Comparative superiority remains qualified; study is explicitly parked; protocol checker passes |
| Prior agent-readiness assessment | Dated 2026-10-03 evidence of the then-live 1.3.7 state and candidate work; retain as historical evidence, not current defect inventory |
| Release evidence records | Dated 1.3.7/1.3.8 records; do not rewrite historical attestations or infer a fresh publication audit from this review |

Minor style observation outside the ten substantive findings: many existing install/example blocks in README and implementation guides lack the global Literal/Customize labels. Preserve executable examples while adding the appropriate labels in a later documentation pass. No unrelated prose rewrite is needed.

## Validation and positive controls

Fresh `npm run verify` completed successfully, including 459 deterministic cross-runtime cases, 76 JavaScript tests, 47 Python tests, Go tests, all documentation/metadata/agent/search checks, the TypeScript clean consumer, exact npm package inventory, Python wheel/sdist source and license checks, and clean wheel installation.

The local verifier used Node 26.12.1, Go 1.27.3, and the existing virtual environment's Python 3.14.10 with pytest 9.0.2 and build 1.5.0. It did not freshly retest the minimum supported runtimes. Existing exact-head [Test CI](https://github.com/snapsynapse/hardguard25/actions/runs/37174021662) passed; the latest exact-head [scheduled production Accessibility run](https://github.com/snapsynapse/hardguard25/actions/runs/40193702826) also passed on 2026-10-25 UTC. The browser suite was not rerun locally in this review.

Additional positive controls:

- JavaScript, Python, and Go packages have no third-party runtime dependencies.
- The generator has bounded ordinary UI payload/quantity inputs, uses Web Crypto, and has no observed outbound data calls or persistent browser storage.
- Guide mirrors, SHA-256 sidecars, briefing mirrors, skill hash, and version metadata pass repository integrity checks.
- npm clean-consumer installation disables lifecycle scripts; the Python wheel consumer uses no-dependency, no-index installation.
- CI defaults to read-only repository permissions; publishing grants are scoped to the relevant jobs and use OIDC.
- No privileged pull_request_target workflow or unsafe direct event-expression shell interpolation was found.
- GitHub secret scanning, push protection, and Dependabot security updates are enabled. The pypi environment exists; it currently has no protection rules. These are observed settings, not an endorsement of a new approval policy.
- The human-factors documentation preserves empirical evidence limits and does not treat the checksum as authentication.

## Remediation sequence and acceptance

1. Refresh the local Python development/publication environment and repeat its advisory audit. Keep this separate from any package release; fixed tooling is not a reason by itself to bump the runtime package version.
2. Resolve SEC-001 and SEC-002 with bounded regression cases, then correct DOC-001 and DOC-002 and extend executable-example coverage. Run the canonical verifier after those changes.
3. Enforce or accurately document the publication gates in SEC-003 and SEC-004. For Go reruns, prove both the matching-tag success path and mismatched-tag failure path without pushing a tag.
4. Pin reviewed privileged actions and correct the Python toolchain wording/constraints. Align the token-boundary language across user and agent entry points.
5. Before any later release or deployment, run the required browser suite and follow the existing release checklist. This review does not authorize a release or establish delivery of fixes.

At the initial review, all findings remained open. Current remediation status is recorded above. Effort is small for individual documentation changes, batching entropy reads, and tag comparison; medium for cross-surface normalization fixtures, generator formatting/copy checks, and workflow-gate integration. Workflow and normative changes require review of their precise behavior before publication.

## Methodology, baseline, and delivery state

The security-audit full-review workflow and doc-audit verification discipline were applied with the repository-root PROJECT_CONTEXT documentation contract. Three parallel read-only reviews covered runtime contracts, workflows/package scripts, and browser/documentation surfaces. Findings were deduplicated and the coordinator independently reproduced the Unicode, entropy-batch, formatter, normative-vector, and checksum-comment examples. Findings map to OWASP Top 10:2021 where relevant; correctness/documentation issues are identified explicitly rather than forced into unrelated web-application categories.

This is the first security-review baseline found in this checkout. The existing agent-readiness assessment is not a prior security finding ledger; no resolved/regressed security delta is claimed. No external tickets were created. At the initial review, follow-up was proposed work. Sam subsequently authorized local fixes, the environment refresh, checks, and report reconciliation while withholding commit and push.

Review commands included git fetch/status/ref comparison, the canonical verifier, npm audit, pip-audit against the existing virtual environment, Bandit on the Python runtime and package verifier, Gitleaks Git scanning, named-path source reads, local Markdown-target checks, bounded Node/Python/Go reproductions, public HEAD requests, and read-only GitHub APIs for CI/settings/advisories. Scanners' initial sandbox DNS failures were retried with network-capable execution and succeeded. No scanner installation was needed; the canonical verifier installed build requirements and local artifacts into its temporary environments.

Limits: no active exploitation against production, no cloud-account or DNS/certificate administration audit, no provider credential inspection, no comprehensive hosted-byte or package-registry re-attestation, no full remote-link crawl, and no empirical human-factors study. Static review and passing scans do not establish absence of all vulnerabilities.

At the end of the initial review, the only repository addition was this report. Source, workflows, package declarations, and documentation under review were not edited. No commit, push, PR, tag, release, deployment, credential change, environment upgrade, or external issue was made. The local verifier generated ignored caches/build metadata as part of its ordinary checks. At that initial checkpoint, no commits were ahead of origin/main and the report was untracked and uncommitted. The current local remediation state is recorded above.
