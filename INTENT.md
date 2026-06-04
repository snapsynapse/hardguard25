# INTENT

Status: Authoritative for the HardGuard25 standard.
Scope: Standards-level strategy for this component. Portfolio-level strategy lives in the PAICE Foundation INTENT. Where this document and a higher-scope document disagree, the higher scope wins for portfolio questions and this document wins for standard-level questions.

## What this standard is

HardGuard25 defines a 25-character alphabet optimized for human readability and low error rates: `0 1 2 3 4 5 6 7 8 9 A C D F G H J K M N P R U W Y`. It specifies the character set, normalization rules, recommended lengths by risk profile, an optional check digit, and formatting guidelines. It does not define a global ID format or a distributed generation protocol. It does not assert collision-resistance guarantees beyond what the alphabet and recommended lengths support.

The standard solves one problem: identifiers that humans read, type, print, or say aloud get misread when the alphabet contains visually confusable characters. HardGuard25 removes the 11 letters that compete with digits (O/0, I/1, L/1, S/5, Z/2, B/8, E/3, Q/P, V/U, T/+, X/*) and prefers digits when a letter and a digit would occupy the same visual slot.

## Why it exists

Existing identifier conventions (base32, Crockford base32, ULID, KSUID, NanoID) optimize for byte-efficiency, lexical sortability, or URL safety. None centers the human reading the identifier. HardGuard25 is what the author actually used for token management 12 years ago, formalized into an open spec because PAICE-internal contributors needed to encode it consistently for LLM token budgeting and downstream tools wanted a reference to cite. It is offered as a working proposal, not as a competing entrant against ULID/KSUID for machine-internal use.

## Design invariants

These are the non-negotiable commitments of the standard. Changing any of them is a major-version decision.

1. The 25-character alphabet is fixed. Any change to the set is a major version. Adding characters undoes the "digit wins ties" property; removing characters reduces address space without proportional confusion-reduction gain.
2. Uppercase only. Lowercase doubles the alphabet without adding clarity; case-insensitive normalization is the simpler answer.
3. ASCII only. Non-ASCII confusables (e.g. Cyrillic A) are out of scope by design.
4. No length mandate. Recommended lengths exist for risk profiles; consumers pick.
5. No global ID protocol. HardGuard25 is an alphabet, not an identifier scheme. Distributed coordination is out of scope.
6. Check digit is optional. Mandating it would force the spec into a specific generation/validation contract that does not apply to all use cases.

## Scope boundaries

In scope: the alphabet, normalization rules, recommended lengths by risk profile, the optional check digit algorithm, formatting guidelines, and conformance language.

Out of scope: distributed ID coordination, collision avoidance protocols, signing or sealing of identifiers, encryption, time-ordering guarantees, URL safety claims beyond what ASCII gives, embedded metadata. The standard is one ingredient in an identifier scheme. It is not a scheme.

## Conformance philosophy

A producer-conformant identifier uses only the 25 alphabet characters in uppercase, normalized per section 4. A consumer-conformant parser accepts those identifiers without modification and rejects others. A check-digit-conformant implementation follows section 6 exactly. Conformance is verifiable from the artifact alone — no network calls, no central registry.

The spec ships a conformance test suite. Implementations claim conformance by passing the suite, not by being approved by a body.

## Admission criteria for changes

A proposed change is admitted only if it satisfies all of the following.

1. It does not weaken a design invariant without an explicit, documented threat-model or use-case justification.
2. It updates `SPEC.md`, `CONFORMANCE.md`, the conformance suite, and `CHANGELOG.md` in the same change.
3. It records a `CHANGELOG.md` entry and, for normative changes, follows SemVer rules in `CONTRIBUTING.md`.
4. It does not introduce a central registry, an oracle, a single point of trust, or a dependency on one hosted service.

## Relationship to other PAICE standards

- **GuideCheck**: HardGuard25 is the recommended alphabet for identifiers embedded in `assistant-guide.txt` artifacts when an ID must be human-readable.
- **Skill Provenance**: skill manifests use HardGuard25 for human-readable bundle IDs where applicable.
- **Graceful Boundaries**: refusal codes and limit identifiers in GB-formatted responses MAY use HardGuard25 for the human-facing portion.

These are non-binding integrations; each downstream standard decides whether to adopt.

## Exceptions to Repo Standards

Per `0_Across/Repo Standards.md`, the following deviations are recorded:

- `skills/hardguard25/` ships the full skill bundle in-repo. Reason: hardguard25 is the canonical home for the HardGuard25 skill. Per the skill-bundle-in-repo exception, full bundle tracking is correct here.
- `skills/hardguard25/` ships the full skill bundle in-repo. Reason: hardguard25 is the canonical home for the HardGuard25 skill. Per the skill-bundle-in-repo exception in the standards doc, full bundle tracking is correct here.
- `docs/llms-full.txt` not present. Reason: `docs/llms.txt` is comprehensive standalone per the v0.3 criterion (inlines all referenced content); no separate `llms-full.txt` needed. Re-evaluate if `llms.txt` later becomes link-only.
- Assistant guide is served at three paths (per file-location principle, trust-anchored category): `/assistant-guide.txt` at repo root, `docs/assistant-guide.txt` (served at https://hardguard25.com/assistant-guide.txt), and `docs/.well-known/assistant-guide.txt` (canonical served path per GuideCheck spec). All three byte-identical. SHA-256 sidecar mirrored in same locations.

## Changelog

- 2026-06-03 — Initial INTENT.md per `0_Across/Repo Standards.md` v0.3 layout matrix.
