# HardGuard25 security audit, enterprise and adversarial scope

Date: 2026-11-22, America/Denver. Base: `a65970b` on `codex/verify-go-1.3.10` (one commit ahead of and one behind `origin/main`; the delta is release evidence only). Scope: the three reference libraries, conformance vectors, the static site and generator, agent-discovery surfaces, verification scripts, four GitHub workflows, the live GitHub repository configuration, live registry state (npm, PyPI, Go proxy and checksum database), live site headers and DNS. This report is read-only. No source, configuration, dependency, registry, DNS or publication state was changed. The canonical verifier was not executed in this pass per repository guidance; code claims below come from reading source and from targeted probes, not from a fresh verifier run.

Goal stated by the owner: reach a posture where a quarterly review is sufficient. The closing section defines that state and the one-time work that reaches it.

## Assessment

No critical or high vulnerability, leaked credential, weak entropy path, or compromised artifact was found. The 2026-11-18 code review's 23 findings (AUD-01 to AUD-13, SEC-001 to SEC-005, COR-001, DOC-001 to DOC-004) are all present as implemented mitigations in the audited source. This pass found no regression of any of them.

Four medium and nine low findings remain. None is an exploitable defect in the libraries. Three of the four mediums are about what an enterprise adopter inherits from the project (integrity claims, log hygiene, single-account trust) and one is about what must run unattended between quarterly reviews. The project is close to the target state; the gap is configuration and documentation, not code rewrites.

## Automated evidence

| Check | Result |
|---|---|
| Bandit 1.9.4 on `python/hardguard25` and `scripts/check-python-package.py` | 295 lines, 6 low / 0 medium / 0 high. All six are subprocess and venv observations in the build checker with fixed argument arrays. |
| pip-audit 2.10.0 on both hash-pinned build lockfiles | No known vulnerabilities. |
| npm audit 11.20.0 | Advisory endpoint unreachable from this host (same transport fault recorded on 2026-11-18). Four dev dependencies, all pinned exact with lockfile integrity hashes; zero open Dependabot alerts on GitHub, which runs the same advisory database. |
| govulncheck | Not run (sandbox blocked module download). The Go module imports only the standard library; the only reachable class of advisory is a Go toolchain stdlib issue, which is the consumer's toolchain, not this module. |
| gitleaks 8.30.1, full history | 79 commits, 1.28 MB, no leaks. No `.env`, key, `.npmrc` or `.pypirc` file was ever added. |
| Live GitHub settings | Secret scanning and push protection on; Dependabot alerts and security updates on; non-provider secret patterns off; code scanning not configured; `allowed_actions: all`; `sha_pinning_required: false`; one ruleset on the default branch (block deletion and force push, no bypass actors); no tag ruleset; `github-pages` environment restricted to `main`; `pypi` environment has no protection rules and no branch or tag policy; no repository secrets; no deploy keys; no webhooks; one collaborator (owner, admin). |
| Live registries | npm `hardguard25@1.3.10` carries SLSA v1 provenance, no dependencies, no install scripts, one maintainer. PyPI 1.3.10 wheel has a PEP 740 attestation bundle. Go proxy lists v1.3.4 to v1.3.10; sum.golang.org has the v1.3.10 entry. PyPI also still serves 1.3.0 to 1.3.3 and npm 1.3.4 to 1.3.7, which predate attested publication. |
| Typosquat neighbors | `hard-guard25`, `hardguard-25`, `hardguard`, `hard_guard25`, `hardguard25-js`, `hardgaurd25` on npm and `hard-guard25`, `hardguard`, `hardgaurd25`, `hardguard25-py` on PyPI all return 404. Nothing hostile registered; nothing defensive registered either. |
| Live site | GitHub Pages serves correct content types for HTML, text and JSON. No `Strict-Transport-Security`, no `Content-Security-Policy`, no `X-Content-Type-Options` response headers (GitHub Pages does not allow custom headers). The only CSP is `<meta http-equiv>` `upgrade-insecure-requests` on the landing page; the generator page has none. `/.well-known/security.txt` returns 404. Assistant guide and SHA-256 sidecar return 200. |
| DNS | Apex A records point at GitHub Pages; `www` CNAME to `snapsynapse.github.io`. SPF present (`~all`). MX records point at registrar mail forwarding. No DMARC record. No CAA record. |
| Tag signature | `v1.3.10` is an annotated tag with an SSH signature; local verification requires an allowed-signers file, so the signature was observed but not verified here. |

## Threat model used

Assets, in order of blast radius if compromised:

1. The maintainer's GitHub account. It is the sole trust root for the repository, both OIDC trusted publishers, the Pages deployment, and (through the registrar) the domain. A pushed `v*` tag publishes to npm, PyPI and the Go proxy within minutes with no second party.
2. Published artifacts on three registries, which enterprise consumers pin and install without reading.
3. The hosted machine-readable surfaces (`assistant-guide.txt`, `llms.txt`, `agents.json`), which AI agents fetch and partly obey.
4. The correctness and integrity claims of the specification, which adopters build identifier schemes on.

Adversaries considered: a registry or GitHub account takeover; a compromised upstream dev dependency or GitHub Action executing inside a release job; a typosquatter; a DNS or certificate misissuance attacker; a malicious or careless external contributor; an attacker feeding hostile input to an adopter's application at scale; and an attacker seeding content that an AI agent will read alongside the project's own surfaces.

Not in scope: adopter application controls around identifiers (authorization, rate limiting, enumeration resistance), which the project already disclaims correctly.

## Findings

Severity reflects impact on an enterprise adopter or on the project's supply chain. Finding IDs are new for this report; the delta table at the end maps prior IDs.

### HG-01 (Medium) The check digit has undocumented blind spots that adopters will inherit

The Mod-25 weighted checksum uses weights `(i mod 25) + 1`. Because 25 is composite and the weights wrap, the detection profile is uneven in ways the specification does not state. Measured against a 30-character payload with the shipped algorithm:

| Position (1-indexed) | Weight | Single substitutions undetected (of 24) |
|---|---|---|
| 1, 2, 3, 4, 6, 7, 8, 9, 11 to 14, 16 to 19, 21 to 24 | coprime to 25 | 0 |
| 5, 10, 15, 20 (and 30, 35, ...) | 5, 10, 15, 20 | 4 (any swap between characters whose indices agree modulo 5, for example `0` and `5`, `A` and `H`) |
| 25, 50, 75, ... | 25 | 24 (every substitution at that position is invisible) |

Adjacent transpositions were detected in all 29 tested positions. Payloads of 24 characters or fewer never reach the fully blind position; every payload of 5 or more characters has at least one one-sixth-blind position.

`SPEC.md` "Properties" says only "catches many single-character substitution errors". That is true and is not a false claim. It is incomplete for an enterprise adopter who is deciding whether a check digit on a 16 or 20 character support reference is enough control, and it hides a hard requirement: if a check digit is used, payload length must stay at or below 24, or the 25th character is unprotected. The conformance suite profiles detection counts on fixed vectors but does not assert the blind spots, so an implementer who "improves" the weights would still pass local tests and break cross-runtime verification.

Remediation (documentation and conformance, no normative change):
- State the exact detection profile in `SPEC.md` Properties: 100 percent of single substitutions at positions whose weight is coprime to 25; five-sixths at positions 5, 10, 15, 20; zero at position 25 and every 25th position after it; all adjacent transpositions of distinct characters.
- Add a normative recommendation: when the check digit is enabled, payload length SHOULD be 24 or less. Carry it into `ADOPTION.md`, `docs/IMPLEMENTATION.md`, the skill, the briefings and the assistant guide.
- Add conformance vectors that assert the known-undetected cases (a position-25 substitution and a modulo-5 substitution at position 5) so all three runtimes agree on the blind spots as well as the hits.
- Record in `INTENT.md` a parked major-version question: a Damm-style quasigroup check over 25 symbols detects all single substitutions and all adjacent transpositions and would remove the blind spots. This is a check-digit algorithm change and therefore requires renewed owner authorization under the maintenance posture; it is noted, not recommended for 1.x.

### HG-02 (Medium) Python error messages echo the full untrusted input

`normalize()` in `python/hardguard25/__init__.py` raises `ValueError(f"invalid characters in input: {input_str}")`. The message carries the entire caller-supplied string, including control characters and newlines. Probe:
```text
normalize('ACDF\x1b[31mINJECTED\nfake-log-line password=hunter2')
ValueError: invalid characters in input: ACDF\x1b[31mINJECTED\nfake-log-line password=hunter2
```
At enterprise scale, validation errors are logged. A user who pastes the wrong clipboard contents (a password, a token, a card number) into an identifier field puts that secret into application logs through this message, and a hostile user gets a log-injection primitive (terminal escapes, forged log lines) in any pipeline that writes exception text verbatim. JavaScript and Go echo only the first offending character, which avoids the leak but still emits a raw control character.

The three runtimes also disagree on error content, which is a parity gap the project otherwise polices closely.

Remediation (maintenance release, patch version):
- Python: report the first offending character as an escaped code point (`U+200B`) or report only the position, never the raw string.
- JavaScript and Go: format the offending character the same way so a `\x1b` or `U+200B` appears as `U+001B` or `U+200B` rather than as the raw byte.
- Add the chosen message contract to `SPEC.md` normalization rules as a SHOULD and to `conformance/vectors.json` so the cross-runtime check holds it.

### HG-03 (Medium) A single account is the whole release trust chain and GitHub-side guardrails do not reflect that

Confirmed live state: one admin collaborator; no tag ruleset (tags `v*` and `go/v*` can be created, moved or deleted by anyone with write access, and `RELEASE_CHECKLIST.md` depends on tags never moving); the `pypi` environment has no required reviewer and no branch or tag policy, so any workflow run that names `environment: pypi` can mint a PyPI OIDC token; `sha_pinning_required` is off at repository level (the workflows pin SHAs by convention and `check-workflows.mjs` enforces it in CI, but the platform does not); `allowed_actions` is `all`. The GitHub API did not expose whether two-factor authentication is enforced for the account.

The release workflow itself is well built: version checks, hash-locked Python build venv, artifact manifest bound to commit and transferred by digest, exact-artifact publication with `--ignore-scripts`, no registry tokens, existing-artifact guards. The gap is upstream of the workflow: whoever can push a tag owns three registries, and nothing between the account and the registries requires a second action.

Remediation (configuration only, no code):
- Add a tag ruleset for `refs/tags/v*` and `refs/tags/go/v*`: block update and deletion, require signed tags, no bypass actors. This makes "do not move a release tag" a platform rule rather than a checklist line.
- Add a required reviewer (the owner) to the `pypi` environment and restrict its deployment policy to tags matching `v*`. Self-approval costs one click per release and forces a fresh authenticated session before PyPI publication, which is the cheapest second factor available to a solo maintainer.
- Turn on `sha_pinning_required` at the repository level and set `allowed_actions` to `selected` (GitHub-owned, verified creators, plus `pypa/gh-action-pypi-publish`). Record both in `.github/repository-settings.json`.
- Confirm two-factor authentication with a hardware key or passkey on GitHub, npm and the registrar, and enable GitHub vigilant mode so unsigned commits show as unverified. Confirm the npm trusted publisher is scoped to `release.yml` only.
- Add the live-settings comparison (the `gh api` calls in this report's evidence table against `repository-settings.json`) to the quarterly checklist so drift is caught.

### HG-04 (Medium) Nothing scans the repository between human reviews

Dependabot covers npm and GitHub Actions monthly. It does not cover `scripts/python-build-requirements.txt` or `scripts/python-build-minimum-requirements.txt`, which are the hash-pinned inputs to every published Python artifact. Code scanning is not configured. There is no scheduled vulnerability or integrity job. The weekly scheduled accessibility run against production is the only unattended check of the live site. A quarterly cadence is only safe when the quarter in between is covered by machines.

Remediation (configuration and one workflow):
- Add a `pip` Dependabot ecosystem for directory `/scripts` so the build lockfiles get advisories and update PRs.
- Enable CodeQL default setup for actions, JavaScript, Python and Go on push and weekly schedule. The codebase is small; runs will be fast and quiet.
- Add OpenSSF Scorecard on a weekly schedule with results to the Security tab. It continuously checks the exact properties this audit checked by hand: pinned actions, token permissions, branch protection, signed releases, dangerous workflow patterns.
- Add one scheduled "surfaces" workflow, weekly, read-only: `pip-audit -r` on both lockfiles, `npm audit` on the lockfile, the existing production search check, and a byte comparison of the deployed `assistant-guide.txt`, its sidecar, `llms.txt`, `llm.txt` and `agents.json` against tracked bytes. Failure notifications go to the maintainer by email through normal workflow failure notices.

### HG-05 (Low) Generation length is unbounded in every runtime

`generate(length)` accepts any positive integer. JavaScript caps each entropy batch at 65,536 bytes but loops until done; Python reads one byte per character through `secrets.token_bytes(1)`; Go reads one byte per character from `crypto/rand`. An adopter who exposes length to a request parameter hands an attacker a CPU and entropy-consumption primitive. This is the adopter's boundary to defend and the project is right not to mandate a maximum, but the documentation does not warn about it.

Remediation: add a sentence to `SPEC.md` formatting or implementation guidance and to `docs/IMPLEMENTATION.md`: treat `length` as trusted configuration, never as user input, and bound it at the boundary. Optionally, as a maintenance performance change that preserves the byte-stream conformance contract, read entropy in batches in Python and Go the way JavaScript does; the acceptance and residue mapping are unchanged so existing deterministic vectors still hold.

### HG-06 (Low) Hosted pages have no effective Content Security Policy

Both pages inline all script and style. There is no external dependency, no form, no fetch, and no stored state, so the realistic exposure is a GitHub Pages or DNS compromise serving modified HTML, which a CSP would not stop. A `<meta>` CSP still has value as defense in depth against injected inline content through any future edit and as an enterprise procurement checkbox. `frame-ancestors` and `Strict-Transport-Security` cannot be set on GitHub Pages; the latter would need a fronting CDN, which is outside the maintenance posture.

Remediation: add to both pages a `<meta http-equiv="Content-Security-Policy">` of `default-src 'none'; script-src 'sha256-...'; style-src 'sha256-...'; img-src 'self' data:; base-uri 'none'; form-action 'none'; upgrade-insecure-requests`, with the script and style hashes computed and asserted by `check-docs-generator.mjs` so an edit that changes the inline script without updating the hash fails CI. Keep the generator's `'self'`-free policy; it loads nothing.

### HG-07 (Low) Disclosure surface is incomplete

`SECURITY.md` names a mailbox and asks for private reporting but gives no acknowledgement window, no supported-version statement beyond "current release line", and no alternate channel. `/.well-known/security.txt` is absent on the site. `.claude-plugin/plugin.json` lists `hello@snapsynapse.com` while `SECURITY.md`, `package.json` and `pyproject.toml` list `info@snapsynapse.com`.

Remediation: add `docs/.well-known/security.txt` (RFC 9116: `Contact`, `Expires`, `Policy` pointing at `SECURITY.md`, `Canonical`), extend `SECURITY.md` with an acknowledgement target (for example five business days), the statement that only the latest 1.x receives fixes and that older registry versions are not withdrawn, and the fact that releases from 1.3.8 onward carry npm provenance and PyPI attestations. Align the plugin manifest address. Add the `security.txt` path to `check-agent-surfaces.mjs` and the sitemap allowlist so it is tracked like the other well-known files.

### HG-08 (Low) DNS lacks CAA and DMARC

No CAA record means any public CA may issue for `hardguard25.com`. No DMARC record, with live MX forwarding, means mail claiming to come from `@hardguard25.com` is not rejected by receivers; the project's disclosure address is on another domain, so the risk is impersonation of the project rather than interception of reports.

Remediation at the registrar: `CAA 0 issue "letsencrypt.org"` (GitHub Pages issues through Let's Encrypt; add any other CA in use before setting it) and `_dmarc TXT "v=DMARC1; p=reject; rua=mailto:..."`. Both are reversible and have no effect on Pages.

### HG-09 (Low) CI jobs that execute third-party code keep credentials and run install scripts

`npm ci` runs without `--ignore-scripts` in `test.yml`, `pages.yml` and the release `preflight` job, so any lifecycle script in the four dev dependencies or their transitive tree executes with the checkout present. `python -m pip install pytest build` is unpinned in the same jobs (the published artifacts are built in a separate hash-locked venv, so this affects only the outer process). `actions/checkout` keeps the job token in `.git/config` by default; those jobs have `contents: read`, so the exposure is read access to a public repository, which is nil, but the pattern is still worth closing so a future permission widening does not inherit it.

Remediation: add a root `.npmrc` with `ignore-scripts=true` (the packed-consumer check already passes `--ignore-scripts` explicitly and `check-packed-consumers.mjs` asserts the TypeScript compiler is present, so confirm `tsc` still installs without scripts), set `persist-credentials: false` on every checkout except the `tag-go` job which needs to push, and pin the outer `pytest` and `build` installs with `--require-hashes` from a third small lockfile, or install only `pytest` there since `build` is already supplied by the locked venv.

### HG-10 (Low) Pre-attestation versions remain installable

PyPI serves 1.3.0 to 1.3.3 and npm serves 1.3.4 to 1.3.7 without provenance. An enterprise consumer that pins an older version and later adopts provenance verification will fail on this project and cannot tell whether that is a missing attestation or a tampered artifact.

Remediation: do not yank; yanking breaks existing pins and is a stronger action than the risk warrants. State the provenance boundary in `SECURITY.md` and the package READMEs ("verify provenance for 1.3.8 and later; earlier versions were published with tokens and have no attestation"), and recommend consumers pin 1.3.10 or later.

### HG-11 (Low) No defensive registrations on registries

Six npm and four PyPI neighbor names are unregistered. Defensive registration is a judgment call: npm permits placeholder packages; PyPI's policy discourages name squatting even by the legitimate owner. The adopter-facing mitigation already exists (canonical names are stated on every surface).

Remediation: optional. If taken, register `hard-guard25` and `hardguard-25` on npm as deprecated placeholders pointing at `hardguard25`, and leave PyPI alone. Add the probe list to the quarterly checklist either way so a hostile registration is noticed.

### HG-12 (Low) Agent-surface integrity is same-origin only

The SHA-256 sidecar for the assistant guide is served from the same origin as the guide. It detects truncation and partial tampering; it does not establish authorship, since an attacker who can change the guide can change the sidecar. `INTENT.md` already records this limit honestly. Enterprise agent operators who want authenticity need a signature from a key the site cannot mint.

Remediation: optional, and only when an adopter asks. A detached Sigstore signature produced in the Pages workflow with the workflow's OIDC identity (`cosign sign-blob`) and published next to the sidecar would give agents a verifiable binding to `snapsynapse/hardguard25` on `main` without managing a key. Record the option in `ROADMAP.md` under adoption-driven work rather than building it now.

### HG-13 (Low) Metadata drift on one agent surface

`docs/agents.json` reports `"version": "1.3.10"` and `"last_updated": "2026-10-26"`, but 1.3.10 shipped 2026-11-18. An agent that compares dates across `llms.txt` ("Last reviewed: 2026-11-18") and `agents.json` sees a contradiction.

Remediation: update the date, and have `check-agent-surfaces.mjs` assert that `agents.json` `last_updated` is not earlier than the `llms.txt` review date.

## What was checked and found sound

Recorded so the next reviewer does not repeat the work.

- Entropy: all three runtimes use the platform CSPRNG with rejection sampling at the 225 boundary and no fallback. JavaScript throws when Web Crypto is absent; the generator page stages whole batches and keeps prior output on failure.
- Normalization: the Unicode White_Space set is pinned identically in all three runtimes; case folding is ASCII only; `U+200B` and `U+FEFF` are rejected; empty and separator-only inputs are rejected; non-string input is rejected. No regular expression in any runtime has super-linear behavior.
- Checksum arithmetic: incremental modulo in all three runtimes; 32-bit Go is exercised in CI.
- Exported collections in JavaScript and Go are detached snapshots; mutating them does not alter validation.
- Packages: zero runtime dependencies on all three registries; npm `files` allowlist; wheel and sdist inventories asserted byte for byte; Python runtime remains 3.9 while source builds require 3.10 with patched setuptools.
- Workflows: every action pinned to a full SHA and asserted by `check-workflows.mjs`; `pull_request_target` absent; default token read-only; publishers consume preflight artifacts bound by a manifest digest passed through job outputs; npm publication passes `--ignore-scripts`; existing npm and PyPI artifacts stop publication; Go tag must peel to the release commit.
- Site: no external scripts, fonts or images; all outbound links use `rel="noopener"`; generator bounds length to 1 to 32 and quantity to 1 to 500 and validates both; separator selection falls back safely; `robots.txt` permits crawlers deliberately.
- Agent surfaces: `agents.json` declares no hosted API, no authentication, no side effects; the assistant guide tells agents to treat itself as untrusted data and to seek user confirmation before acting; `llms.txt` and `llm.txt` are enforced byte-identical.
- Repository: secret scanning with push protection on; Dependabot alerts on with zero open; no secrets, deploy keys or webhooks; history clean.

## Delta against the 2026-11-18 review

All 23 prior findings are implemented in the audited source. No prior finding reopened. The mapping below lists only prior findings that this report touches or extends.

| Prior ID | State on 2026-11-22 | Relation to this report |
|---|---|---|
| AUD-01, COR-001 | Resolved; incremental modulo and 65,536-byte batch cap present | HG-05 extends the length discussion from correctness to abuse |
| AUD-11, SEC-004, AUD-13 | Resolved; npm absence check, manifest binding and exact-artifact publication present | HG-03 moves upstream to account and tag controls |
| SEC-005 | Resolved; all actions SHA-pinned | HG-03 asks the platform to enforce what CI checks |
| DOC-004 | Resolved in documentation | HG-09 closes the remaining unpinned outer installs |
| DOC-003 | Resolved; lookup versus bearer distinction present everywhere | HG-01 adds the integrity-claim boundary alongside it |

New in this report and not previously tracked: HG-01, HG-02, HG-04, HG-06, HG-07, HG-08, HG-10, HG-11, HG-12, HG-13.

## Reaching the quarterly-only state

The target state has three parts: nothing on the list above that requires code is still open; every property this audit checked by hand is checked by a machine at least monthly; and the quarterly review is a fixed checklist that reads machine output and re-runs a small command set rather than rediscovering the system.

One-time work, in dependency order:

1. GitHub configuration (HG-03, HG-04): tag ruleset, `pypi` environment reviewer and tag policy, `sha_pinning_required`, `allowed_actions: selected`, CodeQL default setup, Scorecard workflow, Dependabot `pip` ecosystem, two-factor and vigilant-mode confirmation. Update `.github/repository-settings.json` to match. No release needed.
2. Registrar (HG-08): CAA and DMARC records. No release needed.
3. One maintenance release, 1.3.11 (HG-01, HG-02, HG-05, HG-07, HG-09, HG-10, HG-13): error-message contract across runtimes with conformance vectors; check-digit detection profile and the 24-character recommendation across spec, adoption, implementation guide, skill, briefings and assistant guide; blind-spot vectors; length-as-configuration guidance; `security.txt` and the extended `SECURITY.md`; `.npmrc` and `persist-credentials: false`; `agents.json` date and its check. The error message is the only runtime behavior change and it is a patch under the project's SemVer rules because validity, normalization output and checksum values are unchanged.
4. Site hardening in the same or a following Pages deployment (HG-06): meta CSP with hashes asserted in CI.
5. Scheduled surfaces workflow (HG-04): weekly read-only job described above.

Optional and adoption-driven, recorded but not scheduled: defensive npm names (HG-11), Sigstore signature for the assistant guide (HG-12), a Damm-based check digit as a parked 2.0 question (HG-01), batched entropy reads in Python and Go (HG-05).

Quarterly checklist once the above is done, expected effort under two hours:

- Read the Security tab: Dependabot alerts, CodeQL alerts, Scorecard results, secret scanning. Act on anything open.
- Read the last quarter's scheduled workflow runs: accessibility, surfaces, any Dependabot PRs still open. Merge or close dependency PRs with a green exact-head run.
- Re-run the local command set from this report's evidence table: Bandit, pip-audit on both lockfiles, gitleaks, and the `gh api` settings comparison against `repository-settings.json`. Record output in `audits/quarterly-YYYY-QN.md` or append to this file's successor.
- Check registry state: npm `dist-tags`, maintainers and provenance for latest; PyPI latest and attestation endpoint; Go proxy list; the typosquat probe list.
- Check DNS: A records still GitHub Pages, CAA and DMARC still present, no unexpected records.
- Check account hygiene: GitHub sessions, authorized OAuth applications and personal tokens; npm tokens; registrar sessions. Revoke anything unrecognized.
- Confirm `handoffs/` is empty and `ops/maintenance.md` has no delivery item older than the previous quarter.

Anything that fails the checklist becomes a maintenance item under `INTENT.md`; anything that passes is recorded with the date and the commit audited. The audit is finished when the record exists, not when the checks pass.

## Remediation state, 2026-11-22

Implemented the same day on branch `security/audit-2026-11-22-fixes`, cut from `origin/main` at `8f490ee`. Nothing was committed, pushed, merged, released or changed outside the repository in the audit session. `CHANGELOG.md` carries the entries under Unreleased; the version was not bumped because release authority is separate.

| Finding | State | Where |
|---|---|---|
| HG-01 | Implemented | `SPEC.md` Properties and the 24-character recommendation; `README.md`, `ADOPTION.md`, `docs/IMPLEMENTATION.md`, `CONFORMANCE.md`, briefings, skill v10, assistant guide; `undetected_substitutions` and `detected_substitutions` vectors with tests in all three runtimes; Damm-style 2.0 question parked in `INTENT.md` |
| HG-02 | Implemented, needs a patch release | Code-point-only messages in JavaScript, Python and Go; `rejection_messages` vectors and tests; spec API contract and package READMEs |
| HG-03 | Owner action | GitHub tag ruleset, `pypi` environment reviewer and tag policy, platform SHA pinning, allowed actions, two-factor and vigilant mode; listed in `ops/maintenance.md` |
| HG-04 | Partly implemented | Dependabot `pip` ecosystem for `/scripts`; weekly `surfaces.yml` (pip-audit, npm audit, production search and byte-identical surface checks); weekly `scorecard.yml`; workflow-contract checks for both. CodeQL default setup is an owner action |
| HG-05 | Implemented | Length-as-configuration guidance in spec, adoption, implementation guide, briefings, skill, assistant guide and `SECURITY.md` |
| HG-06 | Implemented and browser-verified | Hashed meta CSP on both pages; inline handlers and style attributes removed; `check-docs-generator.mjs` recomputes hashes and rejects inline attributes and external resources; 15 Playwright tests pass and Chromium reports no CSP violations |
| HG-07 | Implemented | `docs/.well-known/security.txt`; `SECURITY.md` acknowledgement window, version boundary and provenance guidance; plugin manifest contact aligned; enforced by `check-agent-surfaces.mjs` and required on the deployed site by `search-audit.config.json` |
| HG-08 | Owner action | CAA and DMARC at the registrar |
| HG-09 | Implemented | `.npmrc` with `ignore-scripts=true`; `persist-credentials: false` on every checkout except the Go tag push, enforced by `check-workflows.mjs`; outer `pip install pytest build` left as is because artifacts are built in the hash-locked venv |
| HG-10 | Implemented | Provenance boundary stated in `SECURITY.md` |
| HG-11 | Recorded as optional | `ROADMAP.md` |
| HG-12 | Recorded as optional | `ROADMAP.md` |
| HG-13 | Implemented | `agents.json` date refreshed; `check-agent-surfaces.mjs` requires it to be no older than the briefing review date |
