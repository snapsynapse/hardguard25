# PyPI Trusted Publishing Migration

## Current state

The release workflow currently publishes with `PYPI_API_TOKEN`. Keep that working path until the PyPI trusted publisher has been created and verified. Preparing this migration does not authorize changing PyPI configuration, deleting a secret, or publishing a release.

## Publisher identity

- PyPI project: `hardguard25`
- GitHub owner: `snapsynapse`
- GitHub repository: `hardguard25`
- Workflow filename: `release.yml`
- Environment: none under the current workflow design

The maintainer must confirm these values in PyPI before the workflow changes.

## Coordinated activation

After the publisher exists:

1. Grant `id-token: write` to the `publish-pypi` job.
2. Remove `password: ${{ secrets.PYPI_API_TOKEN }}` from the publish action.
3. Preserve `packages-dir: python/dist` and `skip-existing: true`.
4. Review the exact workflow diff.
5. Publish the next authorized patch release.
6. Confirm the PyPI file, version, hashes, and provenance attestations.
7. Rerun or inspect rerun behavior to confirm an existing version is handled safely.
8. Remove the repository secret only after successful trusted publication is proven.

If publisher verification or publication fails, retain or restore the last known working release path before another release attempt. Do not combine troubleshooting with unrelated package changes.
