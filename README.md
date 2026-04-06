[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/snapsynapse/hardguard25/blob/main/LICENSE)
[![Latest release](https://img.shields.io/github/v/release/snapsynapse/hardguard25)](https://github.com/snapsynapse/hardguard25/releases/latest)

# HardGuard25

<p align="center">
  <img src="/.github/assets/social-preview.jpg" alt="HardGuard25 — 25 characters. Zero confusion." width="100%">
</p>

**An open standard for human-safe identifiers.**

HardGuard25 is a 25-character alphabet designed so that every symbol is visually distinct in any typeface, at any size, for any reader — including those with dyslexia. Use it anywhere humans read, type, print, or say an identifier out loud.

```
0 1 2 3 4 5 6 7 8 9 A C D F G H J K M N P R U W Y
```

It removes 11 letters that cause real-world errors (O/0, I/1, S/5, Z/2, B/8, E/3, B/D, Q/P, V/U, T/+, X/\*). When a letter and a digit compete for the same visual slot, the digit always wins.

## Use Cases

HardGuard25 is not just for tokens. It's for any identifier a human will touch.

| Domain | Examples |
|--------|----------|
| **Order & Invoicing** | Order numbers, invoice IDs, receipt codes |
| **Ticketing & Reservations** | Booking references, event tickets, support tickets |
| **Logistics & Shipping** | Tracking numbers, parcel IDs, container codes |
| **Manufacturing & Inventory** | Serial numbers, SKUs, asset tags, bin locations |
| **Software & Licensing** | License keys, activation codes, API tokens |
| **Healthcare & Legal** | Patient IDs, case numbers, specimen labels |
| **Promotions & Loyalty** | Promo codes, referral codes, vouchers, gift cards |
| **Education** | Student IDs, course codes, exam identifiers |
| **IoT & Hardware** | Device IDs, firmware version tags, sensor labels |
| **Short Links & Codes** | URL shorteners, QR payloads, one-time passcodes |

If it gets printed on a label, read over the phone, entered by hand, or scanned by OCR — it should be HardGuard25.

## Install

### JavaScript

```bash
npm install @snapsynapse/hardguard25
```

```js
import { generate, validate, normalize, checkDigit } from '@snapsynapse/hardguard25';

generate(8);                          // "AC3H7PUW"
generate(8, { checkDigit: true });    // "AC3H7PUW" + check char
validate("AC3H-7PUW");               // true
normalize("ac3h-7puw");              // "AC3H7PUW"
checkDigit("AC3H7PUW");              // "R" (example)
```

### Python

```bash
pip install hardguard25
```

```python
from hardguard25 import generate, validate, normalize, check_digit

generate(8)                           # "AC3H7PUW"
generate(8, check_digit=True)         # "AC3H7PUW" + check char
validate("AC3H-7PUW")                # True
normalize("ac3h-7puw")               # "AC3H7PUW"
check_digit("AC3H7PUW")              # "R" (example)
```

### Go

```go
import "github.com/snapsynapse/hardguard25/go"

id, _ := hardguard25.Generate(8)             // "AC3H7PUW"
id, _ = hardguard25.GenerateWithCheck(8)     // "AC3H7PUW" + check char
ok := hardguard25.Validate("AC3H-7PUW")      // true
s := hardguard25.Normalize("ac3h-7puw")      // "AC3H7PUW"
ch, _ := hardguard25.CheckDigit("AC3H7PUW")  // 'R' (example)
```

### No Library Needed

The alphabet is the standard. If you just need the character set, use it directly:

```
0123456789ACDFGHJKMNPRUWY
```

Regex: `^[0-9ACDFGHJKMNPRUWY]+$`

## How Many IDs Can I Make?

| Length | Unique IDs | Sweet Spot For |
|-------:|-----------:|----------------|
| 4 | 390,625 | Small inventory, tickets |
| 6 | 244 million | Medium businesses |
| 8 | 152 billion | Large systems |
| 12 | 59.6 trillion | Internal tokens |
| 16 | 3.55 x 10^22 | Cross-system identifiers |
| 20 | 2.11 x 10^27 | Public tokens |

Each character provides 4.64 bits of entropy (log2 25).

## Check Digit

All three libraries include an optional Mod-25 weighted check digit (ISO 7064 style) that catches every single-character substitution error and most transpositions. Enable it when IDs are manually entered.

## Why Not Crockford Base32?

Crockford Base32 removes 4 characters. HardGuard25 removes 11. The tradeoff: HardGuard25 codes are 1-2 characters longer for the same entropy, but significantly harder to misread. If your IDs are printed on labels, read over the phone, or entered by hand, that tradeoff pays for itself.

See the full [comparison matrix in the spec](SPEC.md#comparison-matrix).

## When NOT to Use HardGuard25

- Cryptographic keys (use proper key derivation)
- Blockchain consensus (use domain-specific formats)
- Systems requiring global UUID guarantees (use UUIDv7 or ULID)
- Machine-only contexts where no human ever sees the ID

## Agent Skill

HardGuard25 includes a Claude Code skill in the [Agent Skills](https://agentskills.io) format. Install the plugin or drop `skills/hardguard25/SKILL.md` into your agent's skill directory. It provides:

- Full alphabet reference and exclusion rationale
- Length/entropy selection table
- Code examples in all three languages
- Normalization rules, check digit algorithm, and formatting guidance

The skill is versioned with [Skill Provenance](https://github.com/snapsynapse/skill-provenance) for tracking across sessions and platforms.

## Specification

The full specification is in [SPEC.md](SPEC.md), covering:

- Rationale for every excluded character
- Entropy math and collision guidance tables
- Normalization rules
- Check digit algorithm and test vectors
- Formatting and accessibility guidelines

The spec is licensed [CC BY 4.0](LICENSE-SPEC) — reference it freely.

## Live Demo

Try the interactive generator: **[hardguard25 generator](https://snapsynapse.github.io/hardguard25/)**

## Development

```bash
cd js && npm test
cd python && ../.venv/bin/python -m pytest
cd go && GOCACHE=../.gocache go test ./...
```

## Sponsor

HardGuard25 is free and open. If you use this encoding, consider [sponsoring its maintenance](https://github.com/sponsors/snapsynapse). See [SPONSORS.md](SPONSORS.md).

## License

- **Specification:** [CC BY 4.0](LICENSE-SPEC) — cite, adapt, and redistribute
- **Code:** [MIT](LICENSE) — use in any project

## Origin

HardGuard25 started as a simple question: why do we keep using characters that look the same in IDs?

- [An unambiguous ID code character set that makes your life less confusing](https://sam-rogers.com/blog/best-unique-ids/) (canonical)
- [Original LinkedIn article](https://www.linkedin.com/pulse/unambigious-id-code-character-set-makes-your-life-less-sam-rogers/)

## Credits

Created by [Sam Rogers](https://linkedin.com/in/samrogers) at [Snap Synapse](https://snapsynapse.com).
