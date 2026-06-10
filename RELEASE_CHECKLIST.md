# Release Checklist

Use this checklist for npm, PyPI, Go module, docs, and skill updates.

## Before Tagging

- Update version strings in JavaScript, Python, conformance vectors, skill metadata, and changelog when applicable.
- Run all test suites locally.
- Run `node scripts/check-agent-surfaces.mjs` for assistant-facing ASCII and hash checks.
- Confirm CI passes on `main`.
- Review README, SPEC, Python README, docs site, and skill examples for API drift.
- Update `CONFORMANCE.md` when fixture coverage or results change.

## Package Checks

```bash
cd js && npm pack --dry-run
cd python && python -m build
cd go && GOCACHE="$(pwd)/../.gocache" go test ./...
```

## Publication

Pushing a `vX.Y.Z` tag triggers `.github/workflows/release.yml`, which verifies version strings match the tag, then publishes to npm (trusted publishing via OIDC, configured on the npm package settings page; no token) and PyPI (`PYPI_API_TOKEN` repo secret), and pushes the `go/vX.Y.Z` tag for Go consumers.

- Push the `vX.Y.Z` git tag and confirm the Release workflow passes.
- Confirm GitHub Pages deploy completed.
- Confirm `https://hardguard25.com/` and `https://hardguard25.com/generator/` load after deploy.

## After Release

- Create GitHub release notes from `CHANGELOG.md`.
- Verify package pages link back to the repository and canonical homepage.
- Confirm sponsor and security links still resolve.
