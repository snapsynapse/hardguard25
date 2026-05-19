# Release Checklist

Use this checklist for npm, PyPI, Go module, docs, and skill updates.

## Before Tagging

- Update version strings in JavaScript, Python, conformance vectors, skill metadata, and changelog when applicable.
- Run all test suites locally.
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

- Publish npm package if JavaScript changed.
- Publish PyPI package if Python changed.
- Push git tag for Go consumers.
- Confirm GitHub Pages deploy completed.
- Confirm `https://hardguard25.com/` and `https://hardguard25.com/generator/` load after deploy.

## After Release

- Create GitHub release notes from `CHANGELOG.md`.
- Verify package pages link back to the repository and canonical homepage.
- Confirm sponsor and security links still resolve.
