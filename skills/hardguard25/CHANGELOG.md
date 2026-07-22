# Changelog

## 1.3.5 -- 2026-07-21
- SKILL.md: Renamed the npm package from `@snapsynapse/hardguard25` to
  unscoped `hardguard25` and corrected the `AC3H7PUW` verification examples
  to use the conformance check digit `N`. File version advanced from 3 to 4
  and the hash was refreshed.
- MANIFEST.yaml: Parent-release-coupled bundle version and date advanced to
  1.3.5 and 2026-07-21. This repository preserves its established SemVer
  coupling rather than converting the bundle field to an unrelated integer.

## 1.3.4 -- 2026-06-03
- Version coupling bump to track parent spec release 1.3.4. SKILL.md content
  unchanged; hash unchanged.
- MANIFEST.yaml: bundle_version + bundle_date refreshed.

## 1.3.3 -- 2026-05-31
- SKILL.md: Aligned check-digit wording with measured conformance
  profiles and refreshed skill metadata for the current repo release.
- MANIFEST.yaml: Updated bundle version, bundle date, file version, and
  compatibility notes.

## 1.0.0 -- 2026-03-09
- SKILL.md: Initial skill definition. Covers the 25-character alphabet,
  exclusion rationale for all 11 removed letters, length/entropy selection
  table, code examples in JavaScript, Python, and Go, normalization rules,
  Mod-25 check digit algorithm, human formatting guidance, comparison to
  Crockford Base32 and others, and when not to use HardGuard25.
- MANIFEST.yaml: Bootstrap with skill-provenance conventions.
- CHANGELOG.md: Created.
