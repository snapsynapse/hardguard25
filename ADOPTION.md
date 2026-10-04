# Adopting HardGuard25

HardGuard25 is an alphabet and implementation contract for identifiers that people read, type, print, scan, or say aloud. It is not a complete identifier scheme. Your application remains responsible for uniqueness, lifecycle, authorization, and any distributed coordination.

## Decide Whether It Fits

Use HardGuard25 when all of these are true:

- people handle the identifier directly;
- excluding common visual confusables is more important than maximum encoding density;
- your application can choose and enforce an appropriate payload length; and
- your application can detect and retry the rare collision if IDs are randomly generated.

Keep UUIDv7, ULID, or another scheme when you need standardized binary representation, global distributed-generation semantics, time ordering, embedded metadata, or compatibility with systems that require that format. Keep cryptographic key and token formats designed for their security protocol. HardGuard25 does not provide authenticity, secrecy, or authorization.

## Choose an Adoption Pattern

| Pattern | Use when | Data treatment |
|---|---|---|
| New records only | Existing IDs must remain stable | Generate HardGuard25 IDs only for records created after the cutover. Accept both formats where records meet. |
| Human-facing alias | Existing UUID, ULID, or database keys still provide useful system semantics | Keep the existing primary key. Add one immutable, unique HardGuard25 alias for display, search, and support workflows. |
| Full replacement | The old identifier has no required semantics or external references | Migrate only with a referential-integrity plan, a durable old-to-new mapping, rollback evidence, and explicit owner approval. |

The human-facing alias is usually the lowest-risk migration. Do not silently rewrite identifiers that customers, integrations, logs, URLs, invoices, or audit records already reference.

HardGuard25 does not define a byte encoding for UUIDs or ULIDs. Do not claim that character substitution or base conversion produces a conformant equivalent. If the old value must remain recoverable, retain it or maintain an explicit mapping.

## Make the Contract Explicit

Record these decisions before implementation:

- generation authority: which service or component creates the ID;
- payload length: the number of random HardGuard25 characters, excluding any check digit;
- check digit: enabled or disabled and whether it is stored with the payload;
- canonical storage: uppercase ASCII with no separators;
- display grouping: the chunk size used in human-facing views;
- collision policy: unique constraint, retry limit, and failure behavior;
- accepted legacy formats during migration; and
- whether the identifier is public, internal, temporary, or long-lived.

Use the namespace and birthday-bound tables in [SPEC.md](SPEC.md#entropy-and-recommended-lengths) to select a payload length from projected lifetime issuance and an explicit collision budget. Namespace size is not a safe issuance count. A check digit is derived from the payload and adds no random entropy.

## Generation and Collision Handling

Use a cryptographically secure random source and unbiased rejection sampling. The maintained JavaScript, Python, and Go packages implement that behavior. If you implement the alphabet directly, follow [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md#no-library-implementation) and verify against the shared conformance vectors.

Place a unique constraint on every stored HardGuard25 identifier or alias. On a constraint collision, generate a new value and retry within a bounded policy. Do not rely on probability alone to preserve database uniqueness, and do not increase retry budgets silently after repeated failures.

## Check Digit and Manual Entry

Use the optional check digit when identifiers are manually entered, read over the phone, copied from paper, printed on labels, or handled by support staff. It detects many substitutions and most adjacent transpositions in the current conformance profile. It is not a message authentication code and does not establish authenticity.

The check digit follows the payload as the final character. Choose the payload length first. An 8-character payload with a check digit produces a 9-character stored identifier.

## Storage, Display, and Input

- Store and compare the canonical uppercase form without separators.
- Group identifiers into chunks of four or five for display when that improves scanning.
- Normalize only at documented input boundaries.
- Accept lowercase and grouped input only when it normalizes cleanly.
- Reject empty, separator-only, and out-of-alphabet input.
- Do not broaden the separator set beyond the contract in `SPEC.md`.

The pinned separator set includes hyphens, underscores, dots, and the exact Unicode White_Space code points listed in the specification. Similar format characters such as U+200B and U+FEFF remain invalid. Use the package normalizer rather than a language's broader whitespace helper.

## Migration by Source Format

### UUID

Keep UUIDs as primary keys when external contracts or distributed generation depend on UUID semantics. Add a HardGuard25 alias for people rather than replacing the UUID in place. Preserve both in logs and support tools during the transition.

### ULID or KSUID

Keep the existing identifier when lexical time ordering or embedded timestamp behavior matters. A HardGuard25 alias can provide a shorter human-facing lookup key, but it must not be presented as preserving order or timestamp semantics.

### Crockford Base32

Choose HardGuard25 only when excluding more visual confusables is worth the lower encoding density. HardGuard25 may require one or two additional characters for similar entropy. Do not claim lower OCR or transcription error rates: no reviewed comparative study currently establishes that result.

### Ad Hoc Order or Support Codes

Inventory every accepted format and external dependency before changing generation. For a safe cutover, keep legacy validation read-only, generate HardGuard25 for new records, index both forms, and expose the format in support tooling. Retire legacy acceptance only after retention requirements and downstream references are resolved.

## Bounded Migration Sequence

1. Inventory producers, consumers, databases, URLs, exports, logs, labels, support tools, and external integrations.
2. Choose an adoption pattern and write down the contract decisions above.
3. Add the new column or alias without removing the old identifier.
4. Add uniqueness and validation constraints before backfilling.
5. Backfill in restartable batches and retain a durable mapping to the old identifier.
6. Add dual-format lookup where legacy references must continue to resolve.
7. Update user interfaces, exports, labels, and support procedures together.
8. Test mixed legacy and HardGuard25 records, collision retries, invalid input, normalization, and check-digit failures.
9. Observe the cutover before removing any legacy path.
10. Remove old behavior only with explicit approval, retention review, and rollback evidence.

## Acceptance Checks

- Generated IDs contain only `0123456789ACDFGHJKMNPRUWY`.
- Generation uses a cryptographically secure random source with unbiased mapping.
- Stored values are uppercase and ungrouped.
- Lowercase and documented separators normalize consistently across supported runtimes.
- Invalid Unicode and excluded letters are rejected.
- Empty and separator-only values are rejected.
- Check-digit behavior matches `conformance/vectors.json` when enabled.
- A database uniqueness constraint and bounded collision retry exist.
- Existing identifiers and external references remain resolvable throughout migration.
- Logs and support views clearly distinguish legacy IDs, primary keys, and HardGuard25 aliases.

Run the repository's shared conformance vectors against any independent implementation. Package-specific examples and the no-library algorithm are in [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md).

## Evidence Limits

HardGuard25 excludes a documented set of visual confusables. That design rationale does not prove a comparative reduction in OCR, dyslexia-sensitive, or manual-transcription errors. [HUMAN_FACTORS.md](HUMAN_FACTORS.md) records the current evidence boundary. The benchmark protocol is retained for possible future research, but no pilot or full study is active.
