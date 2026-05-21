# HardGuard25 Implementation Guide
HardGuard25 is an alphabet and implementation contract for identifiers humans handle directly. Use it for order numbers, ticket codes, booking references, serial numbers, license keys, promo codes, printed labels, support codes, and other IDs that may be read, typed, printed, scanned, or spoken.
Do not use HardGuard25 as a password, encryption key, private key, session secret, blockchain consensus identifier, or a replacement for UUIDv7 or ULID when global distributed uniqueness semantics are required.
## Core decisions
Before adding HardGuard25 to a project, make these decisions explicitly:
- Where will the ID be generated?
- Where will it be stored in canonical form?
- Where will user input be normalized and validated?
- Does the workflow include manual entry?
- How many IDs may be generated over the lifetime of the system?
- Is the ID public, internal, temporary, or long-lived?
## Alphabet
```text
0123456789ACDFGHJKMNPRUWY
```
Regex:
```text
^[0-9ACDFGHJKMNPRUWY]+$
```
Excluded characters:
```text
B E I L O Q S T V X Z
```
Rule: when a letter and a digit compete for the same visual slot, the digit wins.
## Length selection
Each character carries `log2(25) = 4.64` bits of entropy.
| Length | Bits | Unique IDs | Typical use |
|-------:|-----:|-----------:|-------------|
| 4 | 18.6 | 390,625 | Small inventory, ticket queues |
| 6 | 27.9 | 244 million | Medium operational systems |
| 8 | 37.2 | 152.6 billion | Large operational systems |
| 12 | 55.7 | 5.96 x 10^16 | Internal tokens |
| 16 | 74.2 | 3.55 x 10^22 | Cross-system IDs |
| 20 | 92.8 | 2.11 x 10^27 | Public tokens |
| 22 | 102.1 | 1.32 x 10^30 | Long-lived internet-scale IDs |
Recommended defaults:
- Use 8 for operational IDs that are not security tokens and do not need internet-scale collision resistance.
- Use 16 for internal cross-system identifiers.
- Use 20 for public tokens or cross-organization identifiers.
- Use 22 for long-lived, internet-scale identifiers.
## Check digit
Use the optional Mod-25 weighted check digit when IDs are manually entered, read over the phone, printed on labels, copied from paper, or handled by support staff.
Do not use the check digit for security. It catches common transcription mistakes; it does not prove authenticity.
## Storage and display
Store and transmit canonical IDs:
```text
ACDF0G7HJ2KMNP3R
```
Display grouped IDs for humans:
```text
ACDF-0G7H-J2KM-NP3R
```
Accept lowercase and grouped input only when it normalizes cleanly to canonical form.
## Normalization
Normalize at input boundaries:
1. Trim leading and trailing whitespace.
2. Remove separators: hyphens, underscores, dots, and whitespace.
3. Uppercase all letters.
4. Reject anything outside the HardGuard25 alphabet.
The normalizer must be idempotent: `normalize(normalize(x)) === normalize(x)`.
## JavaScript
Install:
```bash
npm install @snapsynapse/hardguard25
```
Use:
```js
import { generate, validate, normalize, checkDigit, verifyCheckDigit } from '@snapsynapse/hardguard25';

const id = generate(16);
const manualEntryId = generate(8, { checkDigit: true });

validate('acdf-0g7h');
normalize('acdf-0g7h');
checkDigit('ACDF0G7H');
verifyCheckDigit(manualEntryId);
```
## Python
Install:
```bash
pip install hardguard25
```
Use:
```python
from hardguard25 import generate, validate, normalize, check_digit, verify_check_digit

id = generate(16)
manual_entry_id = generate(8, check_digit=True)

validate("acdf-0g7h")
normalize("acdf-0g7h")
check_digit("ACDF0G7H")
verify_check_digit(manual_entry_id)
```
## Go
Install:
```bash
go get github.com/snapsynapse/hardguard25/go
```
Use:
```go
import "github.com/snapsynapse/hardguard25/go"

id, err := hardguard25.Generate(16)
manualEntryID, err := hardguard25.GenerateWithCheck(8)
ok := hardguard25.Validate("acdf-0g7h")
canonical, err := hardguard25.Normalize("acdf-0g7h")
check, err := hardguard25.CheckDigit("ACDF0G7H")
ok, err = hardguard25.VerifyCheckDigit(manualEntryID)
```
Handle errors according to the surrounding project conventions.
## No-library implementation
When a package is not appropriate, use the alphabet directly with a cryptographically secure random source and unbiased rejection sampling.
Do not use `byte % 25` on every random byte. Since 256 is not divisible by 25, direct modulo mapping introduces bias.
Algorithm:
1. Read random bytes from a CSPRNG.
2. Accept only bytes less than 225.
3. Convert each accepted byte with `byte % 25`.
4. Map the result to the alphabet.
5. Continue until the requested length is reached.
## Testing checklist
- Generated IDs never contain `B E I L O Q S T V X Z`.
- Generated IDs match `^[0-9ACDFGHJKMNPRUWY]+$`.
- Normalization accepts lowercase and grouped input.
- Normalization rejects characters outside the alphabet.
- Normalization is idempotent.
- Check digit generation and verification match `conformance/vectors.json`.
- Storage keeps canonical uppercase IDs without separators.
- UI, email, PDF, label, and support views display grouped IDs when helpful.
## AI-assisted implementation
For ChatGPT, Claude, Codex, or another local coding assistant, use the plain-text implementation guide:
```text
https://hardguard25.com/ai-assisted-implementation.txt
```
That file includes a copy-paste prompt, approval checklist, and safety guidance for adding HardGuard25 to an existing project.
