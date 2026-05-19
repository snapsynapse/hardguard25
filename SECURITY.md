# Security Policy

## Supported Versions

Security fixes are made against the current published release line.

## Reporting a Vulnerability

Report suspected vulnerabilities privately by email to `info@snapsynapse.com`.

Include:

- Affected package or file
- Reproduction steps
- Expected and observed behavior
- Any known impact

Please do not open a public issue for exploitable vulnerabilities before disclosure coordination.

## Security Notes

HardGuard25 provides a human-safe alphabet and optional check digit. It is not a cryptographic protocol, authentication scheme, or authorization mechanism. Use a CSPRNG for generation, choose enough length for the collision risk, and apply normal application security controls around identifiers.
