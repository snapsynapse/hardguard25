# Agent-Readiness Assessment: hardguard25.com

Reviewed: 2026-10-03 America/Denver

## Site overview

HardGuard25 is a static GitHub Pages site for an open identifier standard. The public surface has two HTML pages: the canonical overview and an interactive browser-local generator. The repository also publishes a standalone LLM briefing, a human-verifiable assistant guide, crawler policy, sitemap, packages for JavaScript and Python, and a Go module. The current published release is 1.3.7. This assessment distinguishes deployed evidence from the repository candidate because local checks do not establish deployment.

The site does not publish a news, blog, or event collection. RSS, Atom, and JSON feeds are therefore not applicable at this time.

## What agents currently see

### Strengths

- The homepage and generator return complete server-rendered HTML without bot blocking.
- The homepage exposes canonical metadata, Open Graph tags, JSON-LD for the standard, and cross-property identity links.
- `robots.txt` explicitly permits major AI and search crawlers and names the canonical sitemap.
- `sitemap.xml` names both indexable HTML pages.
- `llms.txt` is a comprehensive standalone summary rather than a link-only stub.
- The canonical assistant guide and its convenience mirror return plain text, have a SHA-256 sidecar, declare the GuideCheck profile, and require verification and human confirmation before action.
- The site and repository state evidence limits directly: comparative OCR and transcription superiority has not been established.

### Gaps

- The deployed `llm.txt` and `agents.json` paths returned 404 during this review.
- The deployed generator had no Open Graph metadata or JSON-LD, so agents could parse it but had weaker product-level context.
- The deployed agent summaries described generic whitespace removal while the normative specification and candidate runtimes pin an exact Unicode White_Space set. That wording could cause a non-conformant implementation.
- The normative specification is version-controlled on GitHub rather than reproduced as a full first-party HTML document. The homepage and text briefing carry the core definition, so this is a bounded authority tradeoff rather than a discovery blocker.

### Surface scoring

| Surface | Deployed status | Repository candidate | Notes |
|---|---|---|---|
| Server access | Present | Present | HTTP 200 without WAF or bot denial |
| Server-side rendering | Present | Present | Both HTML routes contain substantive content |
| `llms.txt` or `llm.txt` | Partial | Present | Live `llms.txt` exists; candidate adds a byte-identical `llm.txt` mirror |
| `agents.json` | Absent | Present | Candidate defines fit, non-fit, tasks, packages, and no-API boundary |
| JSON-LD structured data | Partial | Present | Live homepage only; candidate adds WebApplication data to the generator |
| Open Graph tags | Partial | Present | Live homepage only; candidate adds generator tags |
| RSS, Atom, or JSON feed | Absent | Absent | Not applicable without a changing content collection |
| `robots.txt` with AI policy | Present | Present | Explicit allow rules for major AI crawlers |
| Sitemap | Present | Present | Covers the two canonical HTML routes |
| Cross-site identity | Present | Present | Homepage structured data links repository and package identities |
| Content on primary domain | Partial | Partial | Core definition is present; normative Markdown remains on GitHub by design |
| Individual content addressability | Present | Present | Homepage sections have anchors and the generator has its own route |

## Agent scenarios and current performance

| Scenario | What an agent finds today | What it should find after deployment |
|---|---|---|
| Direct lookup: What is HardGuard25? | A clear definition, alphabet, evidence limits, packages, and canonical site | The same definition plus explicit structured task and fit metadata |
| Need-based discovery: I need identifiers people can read over the phone | Relevant use cases and exclusions in HTML and `llms.txt` | Fit and non-fit signals in `agents.json` that support honest recommendation |
| Comparison: Should I use HardGuard25 or Crockford Base32? | A comparison and explicit statement that comparative error rates are unproven | The same evidence boundary, reinforced in structured discovery data |
| Implementation: Add HardGuard25 to a Python, JavaScript, or Go project | Package links, examples, and an approval-gated assistant guide | The exact Unicode White_Space contract in every agent-facing surface |
| Edge-case verification: Should U+FEFF be stripped? | The deployed guide can be read as allowing generic whitespace removal | Candidate surfaces state that U+FEFF and U+200B are invalid |
| Generator privacy: Does the demo send or retain generated codes? | Agents must infer behavior from source | Candidate HTML and `agents.json` state browser-local execution and no hosted agent API |

## Unique opportunity

HardGuard25's distinctive opportunity is not more generic discovery metadata. It is a machine-readable claim boundary. Agents should be able to recommend the alphabet while also knowing that it is not a global ID protocol, not a cryptographic primitive, not a hosted agent service, and not empirically proven superior in OCR or transcription. The candidate `agents.json`, exact normalization text, and no-API statement turn those limits into first-class discovery data instead of leaving agents to infer them from prose.

## Intervention plan

1. Deploy and verify the repository candidate.
   - Effort: 15 to 30 minutes after review and authorization.
   - Agent impact: Makes `llm.txt` and `agents.json` discoverable, adds generator JSON-LD and Open Graph metadata, and publishes the corrected normalization contract.
   - Platform feasibility: Direct GitHub Pages deployment from `docs/`; no platform migration required.
   - Acceptance: Confirm expected bytes and content types, then run `npm run test:search:production` and a fresh agent-readiness or Siteline assessment.
2. Keep both briefing paths byte-identical.
   - Effort: Complete in the repository candidate.
   - Agent impact: Supports both naming conventions without redirect ambiguity or content drift.
   - Platform feasibility: Deterministic repository checks compare the file bytes.
   - Artifact: `docs/llms.txt` and `docs/llm.txt` contain the project definition, links, evidence limits, package routes, exact normalization contract, and execution boundary.
3. Publish bounded structured discovery.
   - Effort: Complete in the repository candidate.
   - Agent impact: Enables fit-based recommendation while preventing false assumptions about a hosted API or guaranteed outcomes.
   - Platform feasibility: Static `docs/agents.json`, validated by repository checks.
   - Artifact: `docs/agents.json` includes `fit_signals`, `not_a_fit`, task entry points, package URLs, normalization boundaries, machine surfaces, and `hosted_agent_api: false`.
4. Preserve page-level structured metadata.
   - Effort: Complete in the repository candidate.
   - Agent impact: Gives the generator a typed WebApplication identity and complete share metadata.
   - Platform feasibility: Static JSON-LD and meta tags in `docs/generator/index.html`.
   - Example type: `WebApplication` with canonical URL, software version, browser requirements, creator, and parent WebSite.
5. Add a feed only if the site gains changing editorial content.
   - Effort: Deferred unless a blog, release-notes feed, news stream, or events collection is introduced.
   - Agent impact: None for the current two-page reference site.
   - Platform feasibility: A static Atom or JSON feed would be straightforward, but publishing an empty or synthetic feed would be misleading.

## Priority summary

| # | Action | Effort | Severity | Agent impact |
|---:|---|---|---|---|
| 1 | Review, deploy, and verify the candidate | 15 to 30 minutes | High | Converts the two live 404 discovery paths and stale normalization wording into current public surfaces |
| 2 | Keep `llms.txt` and `llm.txt` identical | Complete | Medium | Prevents convention-specific discovery and content drift |
| 3 | Publish bounded `agents.json` | Complete | High | Supports accurate fit-based recommendation and explicit non-fit decisions |
| 4 | Add generator JSON-LD and Open Graph | Complete | Medium | Improves page-level understanding and sharing |
| 5 | Reassess feed applicability when content model changes | Deferred | Low | Avoids inventing a feed with no changing collection |

## Next step

Review the repository diff, run the deterministic and browser suites, then commit and deploy only with explicit authorization. After deployment, verify the live bytes and rerun the production search contract. This plan is designed to be implementable directly. If implementation support is needed, [Snap Synapse](https://snapsynapse.com/) works with clients on this kind of work.
