# Security Policy

## Supported Versions

Security fixes are made against the current published release line (1.x). Older versions already published to npm, PyPI and the Go module proxy are not withdrawn and do not receive fixes. Pin the latest release.

## Reporting a Vulnerability

Report suspected vulnerabilities privately by email to `info@snapsynapse.com`. The same contact is published at `https://hardguard25.com/.well-known/security.txt`.

Include:

- Affected package or file
- Reproduction steps
- Expected and observed behavior
- Any known impact

Expect an acknowledgement within five business days. Please do not open a public issue for exploitable vulnerabilities before disclosure coordination. Credit is given in the changelog unless the reporter asks otherwise.

## Verifying Releases

Releases from 1.3.8 onward are published through GitHub Actions OIDC trusted publishing without registry tokens. The npm package carries SLSA provenance and the PyPI distributions carry PEP 740 attestations, both bound to `snapsynapse/hardguard25` and `.github/workflows/release.yml`. Versions before 1.3.8 were published with registry tokens and have no attestation; a missing attestation on those versions is expected, not evidence of tampering. Release evidence, including artifact digests, is recorded under `ops/releases/`.

Release tags are annotated and signed. The Go module is verified through the Go checksum database like any other module.

## Security Notes

HardGuard25 provides a human-safe alphabet and optional check digit. It is not a cryptographic protocol, authentication scheme, or authorization mechanism. Use a CSPRNG for generation, choose enough length for the collision risk, and apply normal application security controls around identifiers.

The libraries report invalid input by code point and never echo the caller's input, so validation failures can be logged without leaking pasted values. The requested generation length is trusted configuration with no library maximum; bound it before it reaches the library if callers can choose it.
