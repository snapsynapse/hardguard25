<!-- Upstream template: portfolio-search-indexing-audit contract v3 -->
---
title: "Search indexing"
purpose: "Property-specific index policy, validation commands, deployment gate, and console follow-up."
status: active
updated: 2026-08-09
owner: "Snap Synapse LLC"
open_tasks:
  - "Deploy the hidden-file Pages fix and verify the canonical assistant guide returns HTTP 200."
  - "Reconcile the two canonical HTML URLs and sitemap in Google Search Console."
---
# Search indexing

Canonical origin: `https://hardguard25.com/`

Generated output: `docs`

## Index policy

| Surface | Policy | Reason |
|---|---|---|
| `/` | Index and include in sitemap; JSON-LD required | Canonical specification and primary reader destination |
| `/generator/` | Index and include in sitemap; JSON-LD optional | Interactive first-party reader destination |
| `/404.html` and unknown routes | `noindex` and omit from sitemap | Error surfaces are not content destinations |
| `/.well-known/assistant-guide.txt`, its SHA-256 sidecar, `/assistant-guide.txt`, `/llms.txt`, `/robots.txt`, `/sitemap.xml`, manifest, favicon, and images | Crawlable machine surfaces; omit from HTML sitemap | Machine consumption or page support, not canonical HTML index targets |
| HTTP and `www` variants | Redirect to the matching bare HTTPS canonical URL | Canonical host and protocol normalization |
| External repository, package, article, and portfolio copies | Omit from sitemap | Distribution and reference copies are not site canonical pages |

## Validation lanes

- Offline: `node scripts/check-search.mjs`
- Production after deployment: `node scripts/check-production-search.mjs`
- Machine-readable output: add `--json`
- Local HTTP test: add `--base=http://127.0.0.1:PORT/`

Exit code `0` is pass, `1` is a site defect, and `2` is configuration or infrastructure failure.

## Deployment and console sequence

1. Run the normal build and offline search contract.
2. Deploy through the repository's normal release path.
3. Wait for the deployment to complete.
4. Run the production search contract.
5. Confirm the deployed sitemap URL set matches the repository sitemap.
6. Submit or refresh discovery surfaces only after the production check passes.
7. Inspect or request indexing for canonical HTML pages.
8. Start issue-group validation only when matching production behavior is live.
9. Record console state under `ops/search/<provider>/YYYY-MM-DD/`.

## Expected noise

- `Page with redirect` for HTTP or `www` variants is intentional and must not receive `Validate fix`.
- Unknown paths and `/404.html` are intentional `noindex` exclusions.
- Machine-readable text, XML, manifest, checksum, icon, and image surfaces are crawlable but are not HTML sitemap targets.
- Decorative or support media crawl failures are harmless unless they prevent rendering or discovery of `/` or `/generator/`.

## Current baseline

On 2026-08-09, repository and direct HTTP reconciliation found two canonical HTML index targets. Both returned HTTP 200 with matching canonicals. The deployed sitemap exactly matched the four-entry repository sitemap at the start of the audit, but two entries were non-HTML machine surfaces. Both canonical `/.well-known/` files returned the custom HTTP 404 because the Pages artifact omitted hidden directories. The source files were present and linked from the homepage. The repair removes machine surfaces from the sitemap, enables hidden files in the Pages artifact, and adds deterministic offline and post-deployment production validation.

Authenticated GSC evidence is pending a shared Comet property tab. No console export has been captured yet.
