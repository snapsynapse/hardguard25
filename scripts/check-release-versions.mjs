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
  projectContext: capture('PROJECT_CONTEXT.md', /(?:Prepared|Current published) spec version ([^,]+),/m, 'project context'),
  agentContext: capture('CLAUDE.md', /(?:Latest|Prepared) release line: ([^\s]+) \(/m, 'agent context'),
  citation: capture('CITATION.cff', /^version: ([^\s]+)$/m, 'citation'),
  agentsJson: JSON.parse(read('docs/agents.json')).version,
  generatorJsonLd: capture('docs/generator/index.html', /"softwareVersion": "([^"]+)"/, 'generator JSON-LD'),
  guideAppliesTo: capture('assistant-guide.txt', /^applies-to: hardguard25 ([^\s]+)$/m, 'guide applies-to'),
  guideVersion: capture('assistant-guide.txt', /^guide-version: ([^+\s]+)\+guide\.\d{8}$/m, 'guide version'),
  guideRelease: capture('assistant-guide.txt', /^HardGuard25 release: ([^\s]+)$/m, 'guide release line'),
  briefing: capture('docs/llms.txt', /^Current specification: ([^\s]+) \(/m, 'briefing'),
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

// Release-date parity: dated anchors must agree with the changelog entry for the current version,
// and modification dates must not run ahead of the sitemap that advertises them.
const changelogDate = capture('CHANGELOG.md', new RegExp(`^## ${escapedExpected} -- (\\d{4}-\\d{2}-\\d{2})$`, 'm'), 'changelog release date');
assert.equal(capture('CITATION.cff', /^date-released: (\d{4}-\d{2}-\d{2})$/m, 'citation date'), changelogDate, 'CITATION.cff date-released must match the changelog release date');
const sitemap = read('docs/sitemap.xml');
const lastmod = (loc) => {
  const match = sitemap.match(new RegExp(`<loc>${loc.replaceAll('.', '\\.').replaceAll('/', '\\/')}</loc>\\s*<lastmod>(\\d{4}-\\d{2}-\\d{2})</lastmod>`));
  assert.ok(match, `sitemap: missing lastmod for ${loc}`);
  return match[1];
};
const pageDates = {
  'https://hardguard25.com/': [capture('docs/index.html', /"dateModified": "(\d{4}-\d{2}-\d{2})"/, 'landing dateModified'),
    capture('docs/index.html', /article:modified_time" content="(\d{4}-\d{2}-\d{2})T/, 'landing modified_time')],
  'https://hardguard25.com/generator/': [capture('docs/generator/index.html', /"dateModified": "(\d{4}-\d{2}-\d{2})"/, 'generator dateModified')],
};
for (const [loc, dates] of Object.entries(pageDates)) {
  assert.equal(new Set(dates).size, 1, `${loc}: page modification dates disagree`);
  assert.ok(lastmod(loc) >= dates[0], `${loc}: sitemap lastmod is older than the page's declared modification date`);
}
assert.ok(capture('assistant-guide.txt', /^last-reviewed: (\d{4}-\d{2}-\d{2})$/m, 'guide review date') >= changelogDate, 'assistant guide review date predates the current release');
assert.ok(capture('docs/llms.txt', /^Last reviewed: (\d{4}-\d{2}-\d{2})\.?$/m, 'briefing review date') >= changelogDate, 'briefing review date predates the current release');

console.log(`release version check passed (${expected}, released ${changelogDate})`);
