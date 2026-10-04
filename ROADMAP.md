# Roadmap

HardGuard25 is stable and maintenance-only. The core standard, reference implementations, conformance suite, packages, documentation site, accessibility checks, and agent-facing surfaces are complete for the current scope. `INTENT.md` defines the authoritative maintenance boundary.

## Release Closeout

Version 1.3.8 completed the maintenance closeout. Exact-head checks passed, the signed tag and GitHub Release are public, the site and packages were independently verified, and the release evidence is recorded in `ops/releases/1.3.8.json`. A local pass, pushed commit, deployment run, registry publication, and verified release remain separate claims for future work.

## Routine Maintenance

- Address security, correctness, conformance, packaging, and interoperability defects.
- Maintain compatibility with supported JavaScript, Python, and Go versions and their packaging toolchains.
- Keep deterministic, installed-artifact, accessibility, metadata, and agent-surface checks current.
- Keep `CONFORMANCE.md`, `HUMAN_FACTORS.md`, `ADOPTION.md`, and public discovery surfaces aligned with the normative specification and shipped behavior.
- Review dependencies and GitHub Actions on a bounded maintenance cadence. Major upgrades require compatibility review rather than automatic adoption.
- Preserve the fixed alphabet, current scope boundaries, and evidence limits.

## Maintainer Configuration

- Preserve the verified PyPI Trusted Publisher identity and matching `pypi` GitHub environment documented in `docs/PYPI_TRUSTED_PUBLISHING.md`.
- Keep PyPI publication tokenless. The legacy `PYPI_API_TOKEN` was removed after the 1.3.8 trusted publication and attestations were verified.

These are external configuration tasks, not missing standard functionality.

## Parked Work

The human-factors benchmark protocol is retained but inactive. Do not collect pilot or study observations unless a documented adopter question, sponsor commitment, or standards decision requires the evidence and the owner renews authorization for the study scope, operator, privacy terms, scoring, and stop criteria. Comparative OCR, dyslexia-sensitive, and transcription claims remain unestablished until a reviewed study supports them.

New runtimes, package ecosystems, hosted APIs, registries, managed services, identifier capabilities, and feature expansion are not roadmap commitments. Each requires renewed owner authorization and a recorded rationale under `INTENT.md`.

## Adoption Feedback

`ADOPTION.md` provides the current migration and selection guidance. Expand it only when concrete adopter questions reveal a recurring gap. Adoption feedback may justify clarification or maintenance; it does not by itself authorize a new feature or stronger claim.
