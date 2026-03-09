---
name: hardguard25
description: Use this skill whenever the user needs to generate, validate, or work with human-friendly unique identifiers. Trigger when the user mentions HardGuard25, unambiguous IDs, human-readable codes, or needs identifiers for order numbers, ticket codes, serial numbers, license keys, promo codes, booking references, tracking numbers, patient IDs, device IDs, short codes, or any scenario where an ID will be read, typed, printed, or spoken by a human. Also trigger when the user asks about ID alphabet design, character ambiguity, or compares encoding schemes like Crockford Base32.
metadata:
  author: Snap Synapse (snapsynapse.com)
  source: https://github.com/snapsynapse/hardguard25
  skill_bundle: hardguard25
  file_role: skill
  version: 1
  version_date: 2026-03-09
  previous_version: null
  change_summary: >
    Initial skill definition. Covers alphabet, exclusion rationale,
    length selection, code examples (JS, Python, Go), normalization,
    check digit, formatting, and comparison to alternatives.
---

# HardGuard25

An open standard for human-safe identifiers.

## The Alphabet

```
0 1 2 3 4 5 6 7 8 9 A C D F G H J K M N P R U W Y
```

25 characters. 10 digits + 15 letters. Every symbol is visually distinct in any typeface, at any size, for any reader — including those with dyslexia.

**Regex:** `^[0-9ACDFGHJKMNPRUWY]+$`

## Excluded Characters and Why

| Removed | Reason |
|---------|--------|
| O | Looks like 0 |
| I | Looks like 1 and lowercase L |
| L | Looks like 1 and uppercase I |
| B | Looks like 8; dyslexia mirror of D |
| S | Looks like 5 |
| Z | Looks like 2 |
| E | Looks like 3 for dyslexic readers |
| V | Looks like U in many typefaces |
| T | Resembles + in some contexts |
| X | Collides with multiplication sign |
| Q | Looks like O; dyslexia mirror of P |

Rule: when a letter and a digit compete, the digit wins.

## Quick Reference: Length Selection

| Length | Unique IDs | Use For |
|-------:|-----------:|---------|
| 4 | 390,625 | Small inventory, tickets |
| 6 | 244 million | Medium businesses |
| 8 | 152 billion | Large systems |
| 12 | 59.6 trillion | Internal tokens |
| 16 | 3.55 x 10^22 | Cross-system IDs |
| 20 | 2.11 x 10^27 | Public tokens |

Each character = 4.64 bits of entropy (log2 25).

## Generating IDs

### JavaScript
```js
import { generate, validate, normalize, checkDigit, verifyCheckDigit } from '@snapsynapse/hardguard25';

generate(8);                          // e.g. "AC3H7PUW"
generate(8, { checkDigit: true });    // appends check character
validate("AC3H-7PUW");               // true
normalize("ac3h-7puw");              // "AC3H7PUW"
checkDigit("AC3H7PUW");              // compute check char
verifyCheckDigit("AC3H7PUWR");       // true/false
```

### Python
```python
from hardguard25 import generate, validate, normalize, check_digit, verify_check_digit

generate(8)                           # e.g. "AC3H7PUW"
generate(8, check_digit=True)         # appends check character
validate("AC3H-7PUW")                # True
normalize("ac3h-7puw")               # "AC3H7PUW"
check_digit("AC3H7PUW")              # compute check char
verify_check_digit("AC3H7PUWR")      # True/False
```

### Go
```go
import "github.com/snapsynapse/hardguard25/go"

id, _ := hardguard25.Generate(8)
id, _ = hardguard25.GenerateWithCheck(8)
ok := hardguard25.Validate("AC3H-7PUW")
s := hardguard25.Normalize("ac3h-7puw")
ch, _ := hardguard25.CheckDigit("AC3H7PUW")
ok = hardguard25.VerifyCheckDigit("AC3H7PUWR")
```

### No Library — Just Use the Alphabet

If the user doesn't need a library, they can use the character set directly in any language:

```
ALPHABET = "0123456789ACDFGHJKMNPRUWY"
```

Generate by picking random indices (0-24) from a CSPRNG. Use rejection sampling: accept random bytes < 225, compute `byte % 25`.

## Normalization Rules

1. Trim whitespace
2. Remove separators (hyphens, spaces, underscores, dots)
3. Uppercase all letters
4. Reject characters outside the alphabet

Normalizer must be idempotent: `normalize(normalize(x)) === normalize(x)`.

## Check Digit (Optional)

Mod-25 weighted checksum, appended as the last character.

**Algorithm:**
1. Map each character to index 0-24 by position in the alphabet
2. `sum = sum of (index[i] * (i + 1))` for each position i
3. Check digit = alphabet character at `sum % 25`

Catches all single-character substitution errors and most transpositions.

## Human Formatting

- Display chunked in groups of 4 or 5: `ACDF-0G7H-J2KM-NP3R`
- Store and transmit without separators
- Use monospaced or semi-monospaced typefaces
- High contrast for screen and print

## When NOT to Use HardGuard25

- Cryptographic keys — use proper key derivation
- Blockchain consensus — use domain-specific formats
- Global UUID guarantees — use UUIDv7 or ULID
- Machine-only contexts where no human sees the ID

## Comparison to Alternatives

| Scheme | Characters | Bits/char | Exclusions |
|--------|----------:|----------:|------------|
| **HardGuard25** | 25 | 4.64 | 11 letters removed |
| Crockford Base32 | 32 | 5.00 | 4 removed (I, L, O, U) |
| z-base-32 | 32 | 5.00 | Reordered, drops 0/2 |
| Canadian Postal | 30 | 4.91 | 6 removed |
| Nintendo Base-31 | 31 | 4.95 | 5 removed |

HardGuard25 trades 1-2 extra characters per ID for significantly lower error rates when humans handle the ID.

## Full Specification

For collision guidance tables, test vectors, and detailed rationale, read `SPEC.md` in the repository root.
