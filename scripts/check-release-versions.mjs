import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function capture(path, pattern, label) {
  const match = read(path).match(pattern);
  assert.ok(match, `${path}: could not find ${label} version`);
  return match[1];
}

const versions = {
  javascript: JSON.parse(read('js/package.json')).version,
  pythonPackage: capture('python/pyproject.toml', /^version = "([^"]+)"/m, 'package'),
  pythonRuntime: capture('python/hardguard25/__init__.py', /^__version__ = "([^"]+)"/m, 'runtime'),
  conformanceFixture: JSON.parse(read('conformance/vectors.json')).version,
  specification: capture('SPEC.md', /^\*\*Version:\*\* ([^\s]+)$/m, 'specification'),
  conformanceReport: capture('CONFORMANCE.md', /^Fixture version: `([^`]+)`/m, 'fixture'),
  skillBundle: capture('skills/hardguard25/MANIFEST.yaml', /^bundle_version: ([^\s]+)$/m, 'skill bundle'),
  changelog: capture('CHANGELOG.md', /^## ([^\s]+) --/m, 'current changelog'),
  skillChangelog: capture('skills/hardguard25/CHANGELOG.md', /^## ([^\s]+) --/m, 'skill changelog'),
  projectContext: capture('PROJECT_CONTEXT.md', /spec version ([^,]+),/m, 'project context'),
  agentContext: capture('CLAUDE.md', /Latest release line: ([^\s]+) \(/m, 'agent context'),
};

const expected = process.argv[2] ?? versions.javascript;
const mismatches = Object.entries(versions).filter(([, version]) => version !== expected);
assert.deepEqual(
  mismatches,
  [],
  `release versions must all equal ${expected}: ${JSON.stringify(Object.fromEntries(mismatches))}`
);

const docs = read('docs/index.html');
const escapedExpected = expected.replaceAll('.', '\\.');
assert.match(docs, new RegExp(`class="version">v${escapedExpected}<`));
assert.match(docs, new RegExp(`HardGuard25 v${escapedExpected}\\b`));

console.log(`release version check passed (${expected})`);
