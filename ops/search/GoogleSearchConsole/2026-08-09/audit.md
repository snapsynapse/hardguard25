---
title: "Google Search Console audit"
property: "sc-domain:hardguard25.com"
canonical_origin: "https://hardguard25.com/"
property_type: "website"
audit_date: 2026-08-09
reconciled: 2026-08-20
evidence_type: "Authenticated UI observation"
exports_captured: false
---
# Google Search Console audit

This is the normalized, public-safe audit record for the authenticated observation captured on 2026-08-09. It reconciles the contemporaneous [`observations.md`](observations.md) without claiming a new repository, production, or console check on 2026-08-20. No account identity, private query data, browser artifact, screenshot, trace, or console export is included.

## Evidence lanes at closeout

| Lane | Observed date | Result |
|---|---|---|
| Repository and generated output | 2026-08-09 | Passed with 2 canonical HTML sitemap pages |
| Production HTTP and repository-to-live sitemap parity | 2026-08-09 | Passed with 2 sitemap pages, 0 defects, and 0 infrastructure failures |
| Authenticated Google Search Console | 2026-08-09 | Both canonical pages indexed; only intentional redirects excluded; sitemap refresh accepted |

## Classified observations

| Observation | Classification | Disposition |
|---|---|---|
| `/` and `/generator/` indexed | Expected policy-consistent inclusion | No indexing request |
| HTTP bare, HTTP `www`, and HTTPS `www` examples reported as `Page with redirect` | Expected policy-consistent exclusion | No `Validate fix` |
| Sitemap `Success`, 2 discovered pages, 0 videos after accepted refresh | Console action accepted | Do not repeat while healthy and unchanged |
| Core Web Vitals had insufficient field data for mobile and desktop | Unknown because provider evidence was insufficient; not a defect | No performance remediation |
| HTTPS reported 2 HTTPS URLs, 0 non-HTTPS URLs, and no issues | Policy-consistent | No action |
| Manual actions and security issues reported none; temporary removals reported none in the preceding 6 months | Explicit zero | No action |
| No enhancement reports were present | Missing or unavailable report surface, not an inferred zero | No action |

The Page indexing report was last updated 2026-08-06. Core Web Vitals was last updated 2026-08-07, and HTTPS was last updated 2026-08-08. These timestamps remain historical observations, not current-state claims.

## Accepted-action ledger

| Provider and property | Action and target | Accepted time | Observed confirmation | Result class | Repeat policy | Next-review condition |
|---|---|---|---|---|---|---|
| Google Search Console `sc-domain:hardguard25.com` | Submit `https://hardguard25.com/sitemap.xml` once after production validation of the repaired two-page inventory | 2026-08-09, exact time not retained | `Sitemap submitted successfully`; Submitted and Last read 2026-08-09; status `Success`; 2 discovered pages; 0 videos | Accepted console action | Do not repeat while healthy and unchanged | Material sitemap revision, sitemap error, or later authorized maintenance review |

No URL Inspection indexing requests and no validation batches were initiated.

## Do not repeat

- Do not resubmit the accepted sitemap without a material verified change or provider error.
- Do not request indexing for already indexed canonical pages.
- Do not validate intentional redirect exclusions.
- Do not treat insufficient Core Web Vitals data as a defect.

## Waiting condition

Recheck only when the Page indexing report advances beyond 2026-08-06, a sitemap error appears, a canonical page loses indexed status, a material site or sitemap deployment occurs, or repository/production validation detects a defect. Any future console mutation remains gated on fresh repository and production validation.
