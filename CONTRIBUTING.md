# Contributing

HardGuard25 is an open standard plus small reference implementations. Contributions should preserve cross-language behavior and keep the public contract simple.

## Development

Python source builds require Python 3.10+; installed wheels retain Python 3.9+ runtime support. The package verifier checks the oldest supported patched setuptools backend (84.1.0) and the reviewed release backend (84.2.1) with hash-pinned build requirements.

Run all suites before opening a pull request:

Literal
```bash
npm run verify
```

For hosted-site accessibility changes, install the root development dependencies and Playwright Chromium, then run the browser verifier.

Literal
```bash
npm run verify:browser
```

## Change Rules

- Keep the alphabet stable unless the specification version and migration notes change together.
- Update `conformance/vectors.json` for behavior changes that should be shared across runtimes.
- Keep JavaScript, Python, Go, README examples, and the Agent Skill aligned.
- Do not weaken CSPRNG or rejection-sampling behavior.
- Do not broaden normalization beyond documented separator handling without spec updates.

## Versioning (SemVer)

HardGuard25 uses one `MAJOR.MINOR.PATCH` version for the specification, the JavaScript, Python and Go reference libraries, and the conformance vectors. They release in lockstep: `SPEC.md`, `conformance/vectors.json`, `CONFORMANCE.md`, the packages and the other anchors listed in `RELEASE_CHECKLIST.md` carry the same version, `scripts/check-release-versions.mjs` enforces it, and Go is tagged `go/vX.Y.Z` from the same release commit. A release takes the highest bump required by any change it contains.

### Major

A change to a design invariant in `INTENT.md` is a major version. That includes the alphabet, uppercase-only and ASCII-only scope, the check digit algorithm, and the normalization contract. It also includes any change that makes previously conformant identifiers, inputs or implementations non-conformant. Major changes need renewed owner authorization under the maintenance-only posture and ship with migration notes.

### Minor

A new normative requirement in `SPEC.md` (MUST, MUST NOT, SHOULD or SHOULD NOT) that leaves the invariants intact is a minor version. Precedent: 1.4.0 added the requirement that invalid-input errors name a code point and never echo input, and the recommendation that check-digit payloads be 24 characters or fewer. The alphabet and checksum were unchanged, and the release was minor.

Library and vector changes that implement a new normative requirement ride with that minor version.

### Patch

Changes that keep the normative contract unchanged are patches. Precedent: the 1.3.x line. This covers:

- library fixes that bring a runtime into line with the existing specification or with the other runtimes;
- security and correctness hardening, packaging, CI and release-process changes;
- new or expanded conformance vectors that pin behavior the specification already requires; and
- documentation, site, agent-surface and skill changes that do not expand the standard's claims.

### Error message text

Error message text is part of the contract only to the extent that `SPEC.md` and the `rejection_messages` vectors require it: a `U+XXXX` code point and no echo of the input. A message change needed to meet a new normative requirement is part of that requirement's minor version, as in 1.4.0. A change that breaks those requirements is not a valid patch.

## Pull Request Checklist

- Tests pass in all three runtimes.
- Public docs and examples match actual API behavior.
- Conformance report is updated when fixture behavior changes.
- Changelog entry is added for release-facing changes.
- Hosted-site accessibility changes pass the Playwright/axe browser smoke tests.
