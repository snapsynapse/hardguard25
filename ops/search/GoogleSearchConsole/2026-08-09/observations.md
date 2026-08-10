---
title: "Google Search Console observations"
property: "sc-domain:hardguard25.com"
audit_date: 2026-08-09
evidence_type: "Authenticated UI observation"
exports_captured: false
---
# Google Search Console observations

This record contains safely redacted UI observations for the domain property. No account identity, private query data, or console export is included.

## Page indexing

Report last update: 2026-08-06.

| Category | Count | Examples | Classification | Action |
|---|---:|---|---|---|
| Indexed | 2 | `https://hardguard25.com/`; `https://hardguard25.com/generator/` | Policy-consistent indexed canonical pages | No indexing request; both eligible pages were already indexed |
| Page with redirect | 3 | HTTP bare origin; HTTP `www` origin; HTTPS `www` origin | Expected policy-consistent exclusion | No `Validate fix`; all three redirect to `https://hardguard25.com/` |

The redirect row showed validation `Not Started`. Example last-crawl dates were July 25, July 24, and July 8, 2026 respectively. These are intentional protocol and host redirects, not defects.

## Sitemap

Before the console action, `https://hardguard25.com/sitemap.xml` showed:

- Submitted: 2026-04-09.
- Last read: 2026-04-21.
- Status: `Success`.
- Discovered pages: 2.
- Discovered videos: 0.

After final production validation passed, the same sitemap was submitted once to refresh the changed inventory. GSC displayed `Sitemap submitted successfully`, then showed:

- Submitted: 2026-08-09.
- Last read: 2026-08-09.
- Status: `Success`.
- Discovered pages: 2.
- Discovered videos: 0.

The sitemap was not removed or re-added. No RSS or Atom feed exists or is needed for this static two-page property.

## Experience and safety

- Core Web Vitals last updated 2026-08-07: not enough usage data in the last 90 days for either mobile or desktop. This is insufficient field data, not a defect; no performance audit was triggered.
- HTTPS last updated 2026-08-08: 2 HTTPS URLs, 0 non-HTTPS URLs, and no issues detected in the last 90 days.
- Manual actions: no issues detected.
- Security issues: no issues detected.
- Temporary removals: no requests submitted in the last 6 months.
- Enhancements: no enhancement reports were present on the overview.

## Actions deliberately not taken

- No URL Inspection indexing request because both canonical HTML pages were already indexed.
- No `Validate fix` for intentional redirect exclusions.
- No repeated sitemap submission after the successful refresh.
- No Core Web Vitals remediation because GSC reported insufficient field data rather than poor URL groups.
