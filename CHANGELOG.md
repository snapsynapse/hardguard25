# Changelog

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
