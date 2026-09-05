# Roadmap

The HardGuard25 core standard is stable for the 1.3.7 patch release. Future changes should be driven by interoperability defects, security or correctness findings, or adoption evidence rather than feature expansion.

## Completed Follow-Ups

- Added shared conformance checks for the static docs generator.
- Added a URL convention checker for stale GitHub Pages URLs, `http`, and non-canonical `www` forms.
- Added cross-runtime conformance vectors, agent-surface integrity checks, and release-version alignment checks.
- Added conformance-backed checks for the public check-digit examples.
- Added clean-environment smoke tests for published JavaScript and Python artifacts.
- Removed redundant runtime validation paths and non-portable repository-local links while preserving public APIs.
- Added automated npm, PyPI, and Go releases with rerun-safe publication behavior.
- Added CI, npm, PyPI, release, and license badges.
- Documented collision guidance, check-digit limitations, security boundaries, and human-factors claim limits.
- Upgraded official GitHub Actions to Node.js 24-compatible majors and disabled dependency caching for the dependency-free Go module.
- Reconciled public human-factors language with the documented evidence limits.
- Added keyboard-operable generator controls, accessible status and disclosure semantics, reduced-motion handling, and a Playwright/axe browser smoke test.
- Specified a reproducible human-factors benchmark protocol without claiming that a pilot or study has occurred.
- Added TypeScript declarations and packed-consumer compile checks for the JavaScript package.
- Prepared the coordinated PyPI Trusted Publishing migration procedure while retaining the working token path.

## Evidence-Driven Candidates

- Review and approve `docs/HUMAN_FACTORS_BENCHMARK_PROTOCOL.md` before collecting observations.
- Run the bounded pilot when an operator is available. Lock conditions, schema, corpus seed, scoring, privacy notice, and stop criteria first.
- Decide after the pilot whether to stop, revise, or authorize a full benchmark.
- Do not change comparative public claims until a reviewed full study supports them.

## External Configuration

- Configure PyPI Trusted Publishing using `docs/PYPI_TRUSTED_PUBLISHING.md` only as a coordinated maintainer action.
- Activate the prepared OIDC workflow change only after the publisher identity is confirmed.
- Remove `PYPI_API_TOKEN` only after a trusted publication and attestations are verified.

## Adoption-Driven Documentation

- Add an adoption guide for teams migrating from Crockford Base32, UUIDs, ULIDs, or ad hoc order codes.
- Expand the plain-language length-selection examples only when adopter questions show that the existing table and implementation guide are insufficient.

## Release Hygiene

- Keep `CONFORMANCE.md` updated whenever shared vectors or detection profiles change.
- Keep `HUMAN_FACTORS.md` aligned with any stronger public claims made in the README or docs site.
- Keep the accessibility workflow current with supported Playwright, axe, and GitHub Actions releases.
- Preserve the fixed alphabet and current scope boundaries unless field evidence meets the admission criteria in `INTENT.md`.
