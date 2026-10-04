# PyPI Trusted Publishing Migration

## Current state

PyPI Trusted Publishing is configured and verified for this project. The 1.3.8 release published successfully through GitHub Actions OIDC with provenance attestations. The workflow does not pass an API token or password to PyPI, and the legacy `PYPI_API_TOKEN` repository secret was removed after verification.

## Publisher identity

- PyPI project: `hardguard25`
- GitHub owner: `snapsynapse`
- GitHub repository: `hardguard25`
- Workflow filename: `release.yml`
- Environment: `pypi`

PyPI displayed this exact publisher identity on 2026-10-03. GitHub environment `pypi` exists and the workflow job declares the same environment.

## Activation and verification

The activation configuration is:

1. The `publish-pypi` job grants `id-token: write` and retains read-only repository contents access.
2. The job targets the `pypi` GitHub environment.
3. The publish action receives no password input.
4. `packages-dir: python/dist` and `skip-existing: true` remain explicit.

For each authorized release:

1. Review the exact workflow diff and run the repository and workflow validators.
2. Publish the version tag only after exact-head main checks and deployment verification pass.
3. Confirm the PyPI file, version, hashes, and provenance attestations.
4. Inspect rerun behavior to confirm an existing version is handled safely.
5. Preserve the tokenless workflow. If a recovery credential is ever introduced, record its purpose and remove it after the bounded recovery is complete.

If publisher verification or publication fails, stop before another release attempt and reconcile the PyPI publisher, GitHub environment, workflow permissions, and immutable registry state. Do not combine troubleshooting with unrelated package changes or reintroduce a long-lived credential without separate authorization.
