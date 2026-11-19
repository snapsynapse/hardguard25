# PyPI Trusted Publishing Migration

## Current state

PyPI Trusted Publishing is configured and verified for this project. The 1.3.8 and 1.3.9 releases published successfully through GitHub Actions OIDC with provenance attestations. Release 1.3.9 provenance and clean-consumer evidence is recorded in `ops/releases/1.3.9.json`. The workflow does not pass an API token or password to PyPI, and the legacy `PYPI_API_TOKEN` repository secret was removed after verification.

Source builds require Python 3.10+ and setuptools >=84.1.0. Installed wheel runtime support remains Python >=3.9. CI exercises the minimum backend on Python 3.10; publication uses the separately pinned current backend. Sam approved this build/runtime distinction on 2026-11-18.

## Publisher identity

- PyPI project: `hardguard25`
- GitHub owner: `snapsynapse`
- GitHub repository: `hardguard25`
- Workflow filename: `release.yml`
- Environment: `pypi`

PyPI displayed this exact publisher identity on 2026-10-03 and it was freshly reconfirmed in the authenticated management UI on 2026-10-26 (America/Denver). GitHub environment `pypi` exists and the workflow job declares the same environment.

## Activation and verification

The activation configuration is:

1. The `publish-pypi` job grants `id-token: write` and retains read-only repository contents access.
2. The job targets the `pypi` GitHub environment.
3. The publish action receives no password input.
4. The unreleased workflow candidate builds and verifies artifacts once in the read-only preflight job, transfers them with a commit/source/hash manifest, and checks their identity again in the publisher. Only the verified wheel and sdist are copied into `python-publish`; `packages-dir: python-publish` and `skip-existing: false` remain explicit. An existing artifact fails publication. Reconcile content and provenance before recovery; rerun a publishing job only if its artifacts are absent. If upload completed before a job failed, prepare a separately authorized recovery for downstream steps rather than rerunning that publisher.

For each authorized release:

1. Review the exact workflow diff and run the repository and workflow validators.
2. Publish the version tag only after exact-head main checks and deployment verification pass.
3. Confirm the PyPI file, version, hashes, and provenance attestations.
4. Inspect rerun behavior to confirm an existing version is handled safely.
5. Preserve the tokenless workflow. If a recovery credential is ever introduced, record its purpose and remove it after the bounded recovery is complete.

If publisher verification or publication fails, stop before another release attempt and reconcile the PyPI publisher, GitHub environment, workflow permissions, and immutable registry state. Do not combine troubleshooting with unrelated package changes or reintroduce a long-lived credential without separate authorization.
