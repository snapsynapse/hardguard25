# Release Checklist

Use this checklist for npm, PyPI, Go module, docs, and skill updates.

## Before Tagging

- Update version strings in JavaScript, Python package and runtime metadata, the specification, conformance vectors and report, docs site, skill metadata, and changelogs when applicable.
- Run the canonical deterministic verifier locally: `npm run verify`.
- Run `npm run verify:browser` after installing the root development dependencies and Playwright Chromium.
- Confirm CI passes on `main`.
- Review README, SPEC, Python README, docs site, and skill examples for API drift.
- Install and import the packed npm tarball and built Python wheel in clean temporary environments.
- Update `CONFORMANCE.md` when fixture coverage or results change.

## Package Checks

The canonical verifier builds and installs the npm tarball and Python wheel in clean temporary consumers, checks the TypeScript declarations, and runs the Go suite.

Literal
```bash
npm run verify
```

## Publication

Pushing a `vX.Y.Z` tag triggers `.github/workflows/release.yml`, which verifies version strings match the tag, then publishes to npm (trusted publishing via OIDC, configured on the npm package settings page; no token) and PyPI (`PYPI_API_TOKEN` repo secret until the coordinated migration in `docs/PYPI_TRUSTED_PUBLISHING.md` is activated), and pushes the `go/vX.Y.Z` tag for Go consumers.

- Push the `vX.Y.Z` git tag and confirm the Release workflow passes.
- Confirm GitHub Pages deploy completed.
- Confirm `https://hardguard25.com/` and `https://hardguard25.com/generator/` load after deploy.

## After Release

- Create GitHub release notes from `CHANGELOG.md`.
- Verify package pages link back to the repository and canonical homepage.
- Confirm sponsor and security links still resolve.

## Hosted-site Siteline assessment

For changes to the hosted site or its machine-readable surfaces, assess the canonical site at https://hardguard25.com/ with Siteline before delivery review and after an authorized deployment. Retrieve an existing result when appropriate; respect scan limits and cached-result timestamps.

- Retain the result ID, scan timestamp, scanner and rubric versions, grade, score, findings, and repository commit. A shareable result requires confirmed storage.
- Reconcile every finding against current source, generated output, and deployed evidence. Classify it as confirmed target work, scanner defect, deployment drift, stale or unreproduced, or informational. Record evidence and rationale for exceptions.
- Resolve confirmed defects that affect the site's promised agent tasks before declaring acceptance. Do not add irrelevant APIs, feeds, contact forms, or commerce features merely to raise the grade.
- Keep SNAP grades and passive standards panels separate from full GuideCheck, Graceful Boundaries, accessibility, or other applicable conformance checks. A high grade does not replace those checks.
- Local candidate checks do not establish live acceptance. After deployment, verify the intended bytes and reconcile a scan of those deployed surfaces; a cached scan of earlier content remains historical evidence.
