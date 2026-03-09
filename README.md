[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/snapsynapse/hardguard25/blob/main/LICENSE)
[![Latest release](https://img.shields.io/github/v/release/snapsynapse/hardguard25)](https://github.com/snapsynapse/hardguard25/releases/latest)
# HardGuard25

<p align="center">
  <img src="/.github/assets/social-preview.jpg" alt="HardGuard25 — 25 characters. Zero confusion." width="100%">
</p>

A human-friendly unique ID alphabet. 25 characters, zero ambiguity.

```
0 1 2 3 4 5 6 7 8 9 A C D F G H J K M N P R U W Y
```

HardGuard25 removes every letter that competes with a digit (O/0, I/1, S/5, Z/2, B/8), eliminates dyslexia mirror pairs (B/D, Q/P, E/3), and drops characters that cause trouble in specific contexts (V/U, T/+, X/*). What remains is a 25-character set where every symbol is visually distinct in any typeface, at any size, for any reader.

## Quickstart

### JavaScript

```bash
npm install @snapsynapse/hardguard25
```

```js
import { generate, validate, checkDigit } from '@snapsynapse/hardguard25';

generate(8);                          // "AC3H7PUW"
generate(8, { checkDigit: true });    // "AC3H7PUW" + check char
validate("AC3H-7PUW");               // true
checkDigit("AC3H7PUW");              // "R" (example)
```

### Python

```bash
pip install hardguard25
```

```python
from hardguard25 import generate, validate, check_digit

generate(8)                           # "AC3H7PUW"
generate(8, check_digit=True)         # "AC3H7PUW" + check char
validate("AC3H-7PUW")                # True
check_digit("AC3H7PUW")              # "R" (example)
```

### Go

```go
import "github.com/snapsynapse/hardguard25/go"

id, _ := hardguard25.Generate(8)             // "AC3H7PUW"
id, _ = hardguard25.GenerateWithCheck(8)     // "AC3H7PUW" + check char
ok := hardguard25.Validate("AC3H-7PUW")      // true
ch, _ := hardguard25.CheckDigit("AC3H7PUW")  // 'R' (example)
```

## How Many IDs Can I Make?

| Length | Unique IDs | Use Case |
|-------:|-----------:|----------|
| 4 | 390,625 | Small inventory, tickets |
| 6 | 244 million | Medium businesses |
| 8 | 152 billion | Large systems |
| 16 | 3.55 x 10^22 | Cross-system identifiers |
| 20 | 2.11 x 10^27 | Public tokens |

Rule of thumb: 4-5 characters for small business, 6-7 for medium scale, 8+ for large systems, 16-22 for tokens and cross-org use.

## When to Use HardGuard25

- Inventory and asset management
- Ticketing and reservation systems
- Project and task codes
- Course and product identifiers
- Short-lived application tokens
- Anything where humans read, type, or dictate IDs

## When NOT to Use HardGuard25

- Cryptographic keys (use proper key derivation)
- Blockchain consensus (use domain-specific formats)
- Systems requiring global UUID guarantees (use UUIDv7 or ULID)

## Why Not Crockford Base32?

Crockford Base32 is the most common "unambiguous" encoding. It removes I, L, O, and U -- four characters. HardGuard25 removes eleven. The tradeoff: HardGuard25 codes are 1-2 characters longer for the same entropy, but significantly harder to misread. If your IDs are printed on labels, read over the phone, or entered by hand, that tradeoff pays for itself.

## Specification

The full specification is in [SPEC.md](SPEC.md), covering entropy math, collision guidance, normalization rules, check digit algorithm, test vectors, and accessibility notes.

## Live Demo

Try the interactive generator: [hardguard25 generator](https://snapsynapse.github.io/hardguard25/)

## Development

Local verification commands:

```bash
cd js && npm test
cd python && ../.venv/bin/python -m pytest
cd go && GOCACHE=../.gocache go test ./...
```

Notes:

- Python tests assume a repo-local virtualenv at `.venv`
- Go tests may need `GOCACHE` pointed at a writable project directory in sandboxed environments

## License

- Specification: [CC BY 4.0](LICENSE-SPEC)
- Code: [MIT](LICENSE)

## Origin

HardGuard25 grew out of a simple observation: why do we keep using characters that look the same in IDs? The original article is here:

- [An unambiguous ID code character set that makes your life less confusing](https://sam-rogers.com/blog/best-unique-ids/) (canonical)
- [Original LinkedIn article](https://www.linkedin.com/pulse/unambigious-id-code-character-set-makes-your-life-less-sam-rogers/)

## Credits

Created by [Sam Rogers](https://linkedin.com/in/samrogers) at [Snap Synapse](https://snapsynapse.com).
