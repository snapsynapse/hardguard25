---
skill_bundle: hardguard25
file_role: reference
version: 1
version_date: 2026-10-03
previous_version: null
change_summary: >
  Added portable project, adoption, authority, and maintenance context.
---
# HardGuard25 skill context

This file supplies portable project context for agent surfaces that install the
HardGuard25 skill bundle. It is supporting context, not a second specification.

## Canonical sources

- Project: https://hardguard25.com/
- Repository: https://github.com/snapsynapse/hardguard25
- Normative behavior: `SPEC.md` in the repository root
- Shared vectors: `conformance/vectors.json` in the repository root
- JavaScript package: `hardguard25`
- Python package: `hardguard25`
- Go module: `github.com/snapsynapse/hardguard25/go`

When the installed bundle does not include repository-relative sources, use the
canonical repository links. Do not infer unpublished behavior from a local skill
version or claim that a repository revision has been released.

## Adoption boundaries

- Use HardGuard25 for identifiers that people read, type, print, or speak.
- Prefer UUIDv7, ULID, or another purpose-built scheme when global uniqueness,
  time ordering, or distributed coordination is the primary requirement.
- Choose payload length from the consuming system's issuance volume, collision
  policy, storage constraints, and risk model. Possible-string counts are not
  safe issuance counts.
- Use a cryptographically secure random source with rejection sampling when
  identifiers must be unpredictable.
- Treat the check digit as error detection, not entropy or authentication.
- Preserve existing identifiers during migration unless the human owner has
  approved a bounded migration and rollback plan.

## Authority and verification

Inspect the consuming project's language, package manager, tests, identifier
storage, and public interfaces before proposing changes. Ask for approval before
installing dependencies, changing schemas, rewriting stored identifiers,
altering public APIs, or modifying production configuration.

Validate behavior with the consuming project's tests and the repository's
conformance vectors. Local success does not prove package publication, deployed
website state, downstream adoption, or comparative human-factors performance.

## Maintenance posture

HardGuard25 is stable and maintenance-only. New runtimes, identifier features,
hosted services, benchmark execution, and comparative performance claims require
renewed owner authorization in the canonical repository.
