# Roadmap

This roadmap tracks follow-up work that would further strengthen HardGuard25 after the trust and shareability hardening pass.

## Next Evaluation Work

- Add shared conformance tests for the static docs generator so the browser implementation is covered by the same rejection-sampling and check-digit vectors as the runtime packages.
- Add a non-flaky statistical distribution eval script for larger RNG samples. Keep it outside ordinary unit tests or run it as a scheduled/manual check.
- Add a docs link and URL convention checker that rejects stale GitHub Pages URLs, `http`, and non-canonical `www` forms except where DNS, SSL, or server configuration requires them.
- Add an accessibility smoke test for the generator covering keyboard flow, label associations, contrast-sensitive states, and copy-status announcements.
- Add snippet checks for README, skill, and docs examples so Go, JavaScript, and Python examples stay parseable as APIs evolve.

## Documentation Follow-Ups

- Add a plain-language length-selection guide that explains collision risk without requiring users to read the birthday-bound formula first.
- Add a README check-digit limits section near the quickstart and link it to the conformance report.
- Add an adoption guide for teams migrating from Crockford Base32, UUIDs, ULIDs, or ad hoc order codes.
- Add a short threat-model note that clarifies HardGuard25 improves human handling, not authorization, secrecy, or anti-enumeration by itself.
- Add CI, npm, PyPI, and license badges after the GitHub Actions workflow is active on the default branch.

## Release Hygiene

- Keep `CONFORMANCE.md` updated whenever shared vectors or detection profiles change.
- Keep `HUMAN_FACTORS.md` aligned with any stronger public claims made in the README or docs site.
- Consider adding a lightweight release automation script only after the manual checklist has been used successfully at least once.
