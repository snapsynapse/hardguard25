# HardGuard25 Human-Factors Benchmark Protocol

## Status and claim boundary

Status: proposed protocol. No pilot has been run, no participants have been recruited, and no comparative result has been established.

This document makes the planned evaluation reproducible before observations are collected. It is not evidence that HardGuard25 outperforms Crockford Base32. Pilot data must not be used for marketing or comparative performance claims. Public claims may change only after a reviewed full study supports them and its limitations are published with the results.

## Research questions

The benchmark asks four separate questions:

1. Does HardGuard25 change character or identifier error rates in machine OCR?
2. Does it change error rates when people visually transcribe identifiers?
3. Does it change error rates when people hear and enter identifiers?
4. Do results differ for participants who self-identify as dyslexic or as having another relevant reading or visual-processing condition?

The lanes must remain separate. A result in one lane does not establish a result in another.

## Hypotheses

- H1: Removing common visual confusables reduces substitutions under at least some fonts or degradations.
- H2: The extra characters required at matched entropy may offset character-level improvements at the whole-identifier level.
- H3: Font, degradation, OCR engine, speaking convention, and participant characteristics may interact with alphabet choice.
- H0: There is no reliable difference at the identifier level under the tested conditions.

The analysis must report null and adverse results as readily as favorable results.

## Comparison design

Compare the fixed HardGuard25 alphabet with the canonical Crockford Base32 data alphabet. Generate identifiers independently from uniformly sampled symbol indices. Do not translate identifiers between alphabets.

Compare at matched entropy. The minimum HardGuard25 length is `ceil(crockford_length * log2(32) / log2(25))`.

| Crockford length | HardGuard25 length | Minimum entropy represented |
|---:|---:|---:|
| 8 | 9 | 40 bits |
| 12 | 13 | 60 bits |
| 16 | 18 | 80 bits |
| 20 | 22 | 100 bits |
| 22 | 24 | 110 bits |

The pilot should use at most two matched-entropy pairs. A full study may use more only when the additional conditions answer a named research question.

### OCR lane

Preselect fonts, point sizes, rasterization resolution, contrast, and degradation recipes. Candidate font categories are OCR-oriented monospace, common system monospace, proportional sans serif, and a deliberately difficult display face. Record exact font file hashes and licenses.

Each image fixture must record the source identifier, alphabet, font, font hash, size, rendering engine, resolution, degradation configuration, random seed, and expected text. OCR output must be stored verbatim before normalization or scoring. Record the OCR engine, exact version or model identifier, configuration, execution date, and whether processing was local or remote.

### Visual-transcription lane

Present one identifier at a time under predetermined display conditions. Record the shown fixture, entered text, elapsed time, corrections made before submission, device class, and accessibility accommodations. Randomize condition order using a recorded seed. Avoid collecting names or unrelated personal information.

### Spoken-transcription lane

Use prerecorded prompts generated from a published speaking convention. Balance speaker, pace, noise, and alphabet condition. Store the prompt identifier rather than participant identity. Score raw entry before normalization and normalized entry separately.

### Dyslexia-sensitive lane

Do not infer dyslexia from errors. Participation in this subgroup must be voluntary and self-described. Report the subgroup definition, recruitment limits, accommodations, and sample size. Do not make clinical claims.

## Reproducibility requirements

- Publish the corpus generator and its exact seed.
- Record the runtime, dependency, font, OCR engine, and model versions.
- Hash generated fixtures and raw-result files.
- Preserve raw observations separately from normalized and derived data.
- Validate every result row against the schema before analysis.
- Keep exclusions in an append-only ledger with reasons.
- Run analysis from a clean checkout using one documented command.
- Publish synthetic golden fixtures that exercise every scoring branch.

The corpus generator must verify alphabet membership, requested length, uniqueness within a condition, and matched-entropy calculations. Random generation for the study is deterministic from the recorded study seed and is not the production CSPRNG reference algorithm.

## Result schema

Each observation should contain:

| Field | Meaning |
|---|---|
| `study_version` | Protocol and schema version |
| `observation_id` | Non-identifying stable row ID |
| `lane` | `ocr`, `visual`, or `spoken` |
| `alphabet` | `hardguard25` or `crockford32` |
| `condition_id` | Reference to the locked condition configuration |
| `fixture_sha256` | Hash of the presented fixture or audio |
| `expected_raw` | Expected identifier |
| `observed_raw` | Verbatim OCR or participant entry |
| `observed_normalized` | Result after the alphabet-specific published normalization rule |
| `elapsed_ms` | Completion time when applicable |
| `excluded` | Whether the row is excluded from primary analysis |
| `exclusion_reason` | Predefined or reviewed reason |
| `tool_version` | OCR or collection software identity |

Participant-facing data must use a separate, randomly assigned participant ID. The public dataset should omit information that could reasonably identify a participant.

## Analysis plan

Report both character-level and whole-identifier outcomes:

- Character error rate: insertions plus deletions plus substitutions divided by expected characters.
- Identifier error rate: proportion of identifiers with at least one raw error.
- Normalized identifier error rate: proportion still incorrect after the published normalization rule.
- Completion time distribution for human lanes.
- Confusion matrix for expected and observed characters.
- Results by predefined condition and matched-entropy pair.

Report counts, denominators, effect sizes, uncertainty intervals, and exclusions. Do not pool lanes or conditions unless the protocol defines that aggregation before data review. Exploratory findings must be labeled exploratory.

## Participant safeguards

- Obtain informed consent appropriate to the collection method.
- Explain what is recorded, retained, and published.
- Permit withdrawal before de-identification and aggregation.
- Collect the minimum demographic and accessibility information needed for the named questions.
- Provide requested reasonable accommodations and record their effect as a study limitation, not a participant defect.
- Keep contact information separate from observations.
- Establish retention and deletion periods before recruitment.
- Review whether formal ethics or institutional review is required before a full study.

## Pilot decision gate

The pilot exists only to test the protocol, tooling, burden, and data quality. Before a pilot, lock the conditions, schema, corpus seed, scoring implementation, privacy notice, and stop criteria.

After a pilot, choose one outcome:

1. Proceed to a full study because collection and scoring were coherent.
2. Revise and rerun the pilot because a named methodological defect was found.
3. Stop because the study cannot produce decision-grade evidence at reasonable cost or risk.

No full benchmark, paid service, external model, participant recruitment, or public result is authorized by this document.
