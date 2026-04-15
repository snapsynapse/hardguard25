# hardguard25

Python reference implementation of **HardGuard25** — an open standard for human-safe identifiers.

```
0 1 2 3 4 5 6 7 8 9 A C D F G H J K M N P R U W Y
```

HardGuard25 is a 25-character alphabet designed so every symbol is visually distinct in any typeface, at any size, for any reader — including those with dyslexia. It removes 11 letters that cause real-world errors (`I L O B S Z E T V X Q`) so IDs survive handwriting, phone calls, OCR, and support tickets without corrections. When a letter and a digit compete for the same visual slot, the digit always wins.

## Install

```bash
pip install hardguard25
```

Requires Python 3.9+.

## Quickstart

```python
from hardguard25 import generate, validate, normalize, check_digit, verify_check_digit

generate(8)                       # e.g. "AC3H7PUW"
generate(8, check_digit=True)     # e.g. "AC3H7PUWR"  (length+1)

validate("ac3h-7puw")             # True  (case and separators tolerated)
normalize("ac3h-7puw")            # "AC3H7PUW"

check_digit("AC3H7PUW")           # "R"
verify_check_digit("AC3H7PUWR")   # True
```

## API

| Function | Purpose |
|---|---|
| `generate(length, *, check_digit=False)` | Cryptographically secure random ID using rejection sampling for uniform distribution |
| `validate(s)` | `True` if `s` normalizes to a valid HardGuard25 ID; never raises |
| `normalize(s)` | Trim, uppercase, strip `-` `_` `.` and spaces; raises `ValueError` on invalid chars |
| `check_digit(code)` | Mod-25 weighted check digit (ISO 7064 style) |
| `verify_check_digit(code)` | Strip last char, recompute, compare |
| `ALPHABET` | `"0123456789ACDFGHJKMNPRUWY"` |

Type hints and `py.typed` marker included.

## Sizing

Each character carries `log2(25) = 4.64` bits of entropy.

| Length | Bits | Unique IDs | Typical Use |
|-------:|-----:|-----------:|-------------|
| 4 | 18.6 | 390,625 | Small inventory, tickets |
| 5 | 23.2 | 9,765,625 | Small business |
| 6 | 27.9 | 244,140,625 | Medium businesses |
| 7 | 32.5 | 6.1 billion | Large catalogs |
| 8 | 37.2 | 152.6 billion | Large systems |
| 12 | 55.7 | 5.96 × 10¹⁶ | Internal tokens |
| 16 | 74.2 | 3.55 × 10²² | Cross-system IDs |
| 20 | 92.8 | 2.11 × 10²⁷ | Public tokens |
| 22 | 102.1 | 1.32 × 10³⁰ | Internet-scale |

Recommended defaults:

- 16 for internal systems up to millions of IDs
- 20 for public tokens or cross-org use
- 22 for long-lived, internet-scale identifiers

See the [spec](https://github.com/snapsynapse/hardguard25/blob/main/SPEC.md) for collision-bound tables.

## When NOT to Use HardGuard25

- Cryptographic keys (use proper key derivation)
- Blockchain consensus (use domain-specific formats)
- Systems requiring global UUID guarantees (use UUIDv7 or ULID)
- Machine-only contexts where no human ever sees the ID

## Reference

- Spec: https://github.com/snapsynapse/hardguard25/blob/main/SPEC.md
- Homepage: https://hardguard25.com/
- Source: https://github.com/snapsynapse/hardguard25
- Other languages: JavaScript, Go (same repo)

## License

MIT
