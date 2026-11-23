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

These are also minor versions:

- a new non-normative public API, package surface, hosted surface or agent-facing surface, such as type declarations, a discovery file or a skill bundle (1.3.0 precedent; 1.3.7 and 1.3.8 shipped such additions as patches, and later releases do not follow them);
- removing or renaming a published URL, hosted file or other public surface (1.3.4 shipped such a removal as a patch, and later releases do not follow it); and
- changing error message wording, including wording that still meets the error message requirements below.

### Patch

Changes that keep the normative contract and the public surface unchanged are patches. Precedent: the 1.3.x line. This covers:

- library fixes that bring a runtime into line with the existing specification or with the other runtimes;
- security and correctness hardening, packaging, CI and release-process changes;
- raising the minimum supported runtime or toolchain version (1.3.10 precedent: the Python source-build floor rose to 3.10);
- new or expanded conformance vectors that pin behavior the specification already requires; and
- documentation, site and skill content changes that do not expand the standard's claims or add or remove a surface.

### Error message text

`SPEC.md` and the `rejection_messages` vectors require each invalid-input error to name a `U+XXXX` code point and never echo the input. Any change to error message wording is a minor version, whether it implements a new requirement (as in 1.4.0) or only rewords a message that already meets the requirements. A change that breaks those requirements is not a valid minor or patch.

### Releases before INTENT.md

1.2.0 changed the alphabet from 26 to 25 characters as a minor version. That release predates `INTENT.md` (2026-06-03). It is not a precedent: any alphabet change from 1.2.0 onward is a major version.

## Pull Request Checklist

- Tests pass in all three runtimes.
- Public docs and examples match actual API behavior.
- Conformance report is updated when fixture behavior changes.
- Changelog entry is added for release-facing changes.
- Hosted-site accessibility changes pass the Playwright/axe browser smoke tests.
