<!-- Upstream template: portfolio-search-indexing-audit repository contract v5; validator schema v3 -->
---
title: "Search indexing"
purpose: "Property-specific index policy, validation commands, deployment gate, and console follow-up."
status: active
updated: 2026-08-20
owner: "Snap Synapse LLC"
open_tasks: []
---
# Search indexing

Canonical origin: `https://hardguard25.com/`

Provider property: Google Search Console `sc-domain:hardguard25.com`

Property type: website, domain property

Generated output: `docs`

The repository is authoritative for property policy, validators, sanitized dated evidence, and the console action ledger. The installed `portfolio-search-indexing-audit` skill owns the shared method and templates. LocalBrain's Search Property Queue owns only cross-property sequencing.

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
- Local HTTP test: add `--base=http://127.0.0.1:8765/` after starting the static server on port 8765

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

## Evidence governance

- Repository truth is the generated `docs` tree, `search-audit.config.json`, and the offline validator.
- Production truth is direct HTTP evidence captured after deployment by the production validator.
- Console observations are lagging provider evidence and never override a repository or production contradiction.
- Sanitized console observations live under `ops/search/GoogleSearchConsole/YYYY-MM-DD/`. Account identity, private queries, raw exports, screenshots, traces, authenticated browser state, and unreviewed downloads must remain outside Git under an ignored private-evidence path.
- Missing, stale, insufficient, unknown, and zero are distinct states. No state may be inferred from an absent report.
- Historical dated observations are append-only. Later evidence may supersede a prior classification, but must not rewrite what was observed on the earlier date.

## Current classified state

| Observation | Classification | Current disposition |
|---|---|---|
| Repository and production each expose the same two canonical sitemap pages | Policy-consistent, no defect | Passed on 2026-08-09; recheck after a material deployment |
| Both canonical pages are indexed | Policy-consistent indexed pages | No indexing request justified |
| Three HTTP or `www` examples appear as `Page with redirect` | Expected policy-consistent exclusion | Do not start `Validate fix` |
| Sitemap reports `Success` with 2 discovered pages after the repaired inventory was submitted | Console action accepted | Do not resubmit while healthy and unchanged |
| Core Web Vitals reports insufficient field data | Unknown due to insufficient provider data, not a defect | No performance remediation or `web-perf` audit justified |
| Manual actions, security issues, temporary removals, and HTTPS issues were explicitly reported clear | Policy-consistent or explicit zero | No action |
| No enhancement report was present | Missing or unavailable report surface, not an inferred zero | No action |

## Console action ledger

| Provider and property | Action and target | Accepted time | Observed confirmation | Result class | Repeat policy | Next-review condition |
|---|---|---|---|---|---|---|
| Google Search Console `sc-domain:hardguard25.com` | Submit `https://hardguard25.com/sitemap.xml` once after the deployed sitemap repair | 2026-08-09, exact time not retained | `Sitemap submitted successfully`; Submitted and Last read both 2026-08-09; `Success`; 2 discovered pages; 0 videos | Accepted console action; provider reporting current at observation time | Do not repeat while the sitemap remains healthy and its inventory is unchanged | Recheck only after a material sitemap revision, a reported sitemap error, or a later authorized maintenance review |

No indexing requests or validation batches were started because both eligible canonical pages were already indexed and the only exclusion group was intentional redirects.

## Do not repeat

- Do not resubmit the accepted sitemap unless a material verified sitemap revision or provider error justifies it.
- Do not request indexing for `/` or `/generator/` while evidence continues to show them indexed.
- Do not start `Validate fix` for the intentional HTTP and `www` redirect exclusions.
- Do not initiate performance remediation from insufficient Core Web Vitals field data alone.
- Do not recapture authenticated console state merely to restate the unchanged 2026-08-09 observation.

## Next review

The property is waiting, not actively in progress. Reopen console review only when Page indexing advances beyond its 2026-08-06 report date, a sitemap error appears, a canonical page loses indexed status, a material site or sitemap deployment occurs, or repository/production validation reports a defect. Before any console mutation, rerun repository and production gates and reconcile this ledger.

## Current baseline

On 2026-08-09, repository and direct HTTP reconciliation found two canonical HTML index targets. Both returned HTTP 200 with matching canonicals. The deployed sitemap exactly matched the four-entry repository sitemap at the start of the audit, but two entries were non-HTML machine surfaces. Both canonical `/.well-known/` files returned the custom HTTP 404 because the Pages artifact omitted hidden directories. The source files were present and linked from the homepage. The repair removes machine surfaces from the sitemap, enables hidden files in the Pages artifact, and adds deterministic offline and post-deployment production validation.

Authenticated GSC reconciliation is archived in the dated [`audit.md`](search/GoogleSearchConsole/2026-08-09/audit.md), with the original [`observations.md`](search/GoogleSearchConsole/2026-08-09/observations.md) preserved as the contemporaneous record. Both canonical HTML pages were already indexed. The only exclusion group contained the three intentional host and protocol redirects, so no validation was started. The repaired sitemap was resubmitted once and immediately reported `Success`, 2 discovered pages, and a current submitted and last-read date. No console export was captured.
