# PyPI Trusted Publishing Migration

## Current state

PyPI Trusted Publishing is configured for this project. The release workflow uses GitHub Actions OIDC and does not pass an API token or password to PyPI. Keep the legacy `PYPI_API_TOKEN` repository secret only as an unused recovery credential until one real trusted publication and its provenance attestations have been verified.

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

For the next authorized release:

1. Review the exact workflow diff and run the repository and workflow validators.
2. Publish the version tag only after exact-head main checks and deployment verification pass.
3. Confirm the PyPI file, version, hashes, and provenance attestations.
4. Inspect rerun behavior to confirm an existing version is handled safely.
5. Remove `PYPI_API_TOKEN` only after successful trusted publication is proven.

If publisher verification or publication fails, retain or restore the last known working release path before another release attempt. Do not combine troubleshooting with unrelated package changes.
