# Changelog

## 1.3.2 -- 2026-04-23

### Added
- Shared cross-language conformance vectors in `conformance/vectors.json` covering normalization, validation, check digits, and verification

### Changed
- Aligned JS, Python, and Go API contract documentation for normalization, validation, checksum generation, and checksum verification
- Clarified in the spec that normalization removes any whitespace separator and that verification runs on normalized input
- Synced package versions after the checksum and normalization compatibility fixes

### Fixed
- Verification now accepts grouped and lowercase human input consistently across all three runtimes
- Go and Python normalization now match JavaScript for tab and newline separators
- Go checksum helpers now match JS and Python case-handling behavior

## 1.3.1 -- 2026-04-14

### Added (Python package)
- Full PyPI landing page: install, quickstart, API reference table, sizing table, "When NOT to use" guardrails
- SPDX license expression (PEP 639) and expanded classifier set
- Explicit setuptools package discovery config
- `LICENSE` symlink in `python/` so sdist/wheel include it

### Changed (root README)
- Fixed excluded-letter pairings to cover all 11 removed letters (added `L/1`, removed duplicate `B/D`)
- Expanded sizing table from 6 rows to the full 9-row spec set with entropy column and recommended defaults

### Published
- `hardguard25` on PyPI: https://pypi.org/project/hardguard25/

## 1.3.0 -- 2026-03-09

### Added
- Claude Code skill (Agent Skills format) with full alphabet reference, code examples, and comparison matrix
- Skill Provenance metaskill for version tracking across sessions and platforms
- Plugin metadata (.claude-plugin/plugin.json) for Claude Code integration
- Use case table in README covering 10 domains (orders, tickets, logistics, manufacturing, licensing, healthcare, promos, education, IoT, short links)
- "No Library Needed" section in README for direct alphabet usage
- npm and PyPI badges in README

### Changed
- Repositioned README as an open standard for human-safe identifiers, not just a token library
- Reorganized README flow: what it is → use cases → install → sizing → spec

## 1.2.0 -- 2025-10-03

### Added
- E excluded from alphabet (E/3 dyslexia confusable; digits take priority), bringing set from 26 to 25 characters
- Optional Mod-25 weighted check digit (ISO 7064 style)
- Reference implementations in JavaScript, Python, and Go
- Interactive generator app (GitHub Pages)
- Collision guidance tables
- Entropy and recommended length tables
- Comparison matrix against Crockford Base32, z-base-32, Canadian Postal, Nintendo Base-31, RFC 4648

### Changed
- Alphabet reduced from 26 to 25 characters
- Renamed project to HardGuard25
- Updated all entropy calculations to base 25

## 1.0.0 -- 2019-11-14

### Added
- Original 26-character unambiguous ID alphabet
- Published as LinkedIn article
