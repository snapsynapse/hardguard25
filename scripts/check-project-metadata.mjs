import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const npmPackage = JSON.parse(read('js/package.json'));
const pythonProject = read('python/pyproject.toml');
const funding = read('.github/FUNDING.yml');

const canonicalSite = 'https://hardguard25.com/';
const repository = 'https://github.com/snapsynapse/hardguard25';
const sponsor = 'https://github.com/sponsors/snapsynapse';
const securityContact = 'info@snapsynapse.com';
const evidenceLimit = 'Comparative OCR and transcription error rates have not yet been established empirically';

assert.match(funding, /^github: snapsynapse$/m, 'GitHub funding owner must be snapsynapse');
assert.equal(npmPackage.homepage, canonicalSite);
assert.equal(npmPackage.repository?.url, repository);
assert.equal(npmPackage.funding, sponsor);
assert.equal(npmPackage.license, 'MIT');
assert.match(pythonProject, /Homepage = "https:\/\/hardguard25\.com\/"/);
assert.match(pythonProject, /Repository = "https:\/\/github\.com\/snapsynapse\/hardguard25"/);
assert.match(pythonProject, /Funding = "https:\/\/github\.com\/sponsors\/snapsynapse"/);
assert.match(pythonProject, /^license = "MIT"$/m);
assert.match(read('SECURITY.md'), new RegExp(securityContact.replace('.', '\\.')));

for (const path of ['README.md', 'PROJECT_CONTEXT.md']) {
  assert.ok(read(path).includes(evidenceLimit), `${path}: missing human-factors evidence limit`);
}

for (const path of ['README.md', 'CONTRIBUTING.md', 'CONFORMANCE.md']) {
  assert.ok(read(path).includes('npm run verify'), `${path}: missing canonical verifier`);
}

console.log('project metadata parity check passed');
