# Contributing

HardGuard25 is an open standard plus small reference implementations. Contributions should preserve cross-language behavior and keep the public contract simple.

## Development

Run all suites before opening a pull request:

```bash
cd js && npm test
cd python && ../.venv/bin/python -m pytest
cd go && GOCACHE="$(pwd)/../.gocache" go test ./...
```

## Change Rules

- Keep the alphabet stable unless the specification version and migration notes change together.
- Update `conformance/vectors.json` for behavior changes that should be shared across runtimes.
- Keep JavaScript, Python, Go, README examples, and the Agent Skill aligned.
- Do not weaken CSPRNG or rejection-sampling behavior.
- Do not broaden normalization beyond documented separator handling without spec updates.

## Pull Request Checklist

- Tests pass in all three runtimes.
- Public docs and examples match actual API behavior.
- Conformance report is updated when fixture behavior changes.
- Changelog entry is added for release-facing changes.
