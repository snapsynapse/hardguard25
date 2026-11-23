import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseDocument } from 'yaml';

export function parseWorkflow(text) {
  const document = parseDocument(text, { uniqueKeys: true });
  assert.deepEqual(document.errors, [], 'workflow YAML must parse without duplicate keys');
  return document.toJS();
}
const needs = job => [].concat(job.needs || []);
const commands = step => (step?.run || '').split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
function step(job, name) {
  const matches = job.steps.filter(value => value.name === name);
  assert.equal(matches.length, 1, `required workflow step: ${name}`);
  assert.equal(matches[0].if, undefined, `blocking step must be unconditional: ${name}`);
  assert.equal(matches[0]['continue-on-error'], undefined, `blocking step cannot ignore failure: ${name}`);
  return matches[0];
}
function transfer(job, action) {
  const matches = job.steps.filter(value => value.uses?.startsWith(`actions/${action}@`));
  assert.equal(matches.length, 1, `required artifact transfer ${action}`);
  assert.equal(matches[0].with?.name, 'release-artifacts');
  assert.equal(matches[0].with?.path, 'release-artifacts/');
  assert.equal(matches[0].if, undefined);
  assert.equal(matches[0]['continue-on-error'], undefined);
  return matches[0];
}
export function checkWorkflows(workflows) {
  for (const [name, workflow] of Object.entries(workflows)) {
    assert.deepEqual(workflow.permissions, { contents: 'read' }, `${name}: default permissions`);
    assert.equal(workflow.defaults?.run?.shell, undefined, 'workflow shell override is not allowed');
    assert.equal(workflow.on?.pull_request_target, undefined, 'no privileged untrusted PR workflow');
    for (const [id, job] of Object.entries(workflow.jobs)) {
      assert.equal(job.if, undefined, 'validation/publication jobs must be unconditional');
      assert.equal(job.defaults?.run?.shell, undefined, 'job shell override is not allowed');
      for (const value of job.steps) {
        assert.equal(value.shell, undefined, 'step shell override is not allowed');
        assert.equal(value['continue-on-error'], undefined, 'step failure must propagate');
        if (name === 'release.yml') assert.equal(value.if, undefined, 'release steps must be unconditional');
      }
      for (const value of job.steps) if (value.uses) assert.match(value.uses, /^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/, `${name}/${id}: full action SHA required`);
      for (const value of job.steps) {
        if (!value.uses?.startsWith('actions/checkout@')) continue;
        const keepsToken = name === 'release.yml' && id === 'tag-go';
        assert.equal(value.with?.['persist-credentials'], keepsToken ? undefined : false, `${name}/${id}: checkout must not persist credentials unless the job pushes`);
      }
      const allowed = name === 'release.yml' && ['publish-npm', 'publish-pypi'].includes(id)
        ? { contents: 'read', 'id-token': 'write' }
        : name === 'release.yml' && id === 'tag-go' ? { contents: 'write' }
          : name === 'pages.yml' && id === 'deploy' ? { contents: 'read', pages: 'write', 'id-token': 'write' }
            : name === 'scorecard.yml' && id === 'analysis' ? { contents: 'read', 'security-events': 'write', 'id-token': 'write' }
              : { contents: 'read' };
      assert.deepEqual(job.permissions || workflow.permissions, allowed, `${name}/${id}: least privilege`);
      assert.equal(job['continue-on-error'], undefined);
    }
  }
  const release = workflows['release.yml'].jobs;
  assert.deepEqual(needs(release.preflight), ['verify']);
  const build = step(release.preflight, 'Build and verify exact release artifacts');
  assert.deepEqual(commands(build), ['npm run verify']);
  assert.equal(build.env?.HG25_RELEASE_ARTIFACTS, '${{ github.workspace }}/release-artifacts');
  assert.deepEqual(commands(step(release.preflight, 'Bind artifacts to reviewed source and commit')), ['node scripts/check-release-artifacts.mjs write release-artifacts']);
  const upload = transfer(release.preflight, 'upload-artifact');
  assert.equal(upload.with['if-no-files-found'], 'error');
  const manifest = step(release.preflight, 'Bind artifacts to reviewed source and commit');
  assert.equal(manifest.id, 'manifest');
  assert.deepEqual(release.preflight.outputs, { 'manifest-sha256': '${{ steps.manifest.outputs.sha256 }}' });
  assert.ok(release.preflight.steps.indexOf(build) < release.preflight.steps.indexOf(manifest));
  assert.ok(release.preflight.steps.indexOf(manifest) < release.preflight.steps.indexOf(upload));
  for (const publisher of ['publish-npm', 'publish-pypi']) {
    assert.deepEqual(needs(release[publisher]), ['preflight']);
    const download = transfer(release[publisher], 'download-artifact');
    const allowedRunNames = publisher === 'publish-npm'
      ? ['Install npm for OIDC trusted publishing', 'Verify and publish exact npm artifact']
      : ['Verify exact Python artifacts and select publication files'];
    assert.deepEqual(release[publisher].steps.filter(s => s.run).map(s => s.name), allowedRunNames, 'publisher run-step allowlist');
    const publication = step(release[publisher], allowedRunNames.at(-1));
    assert.equal(publication.env?.HG25_EXPECTED_MANIFEST_SHA256, '${{ needs.preflight.outputs.manifest-sha256 }}');
    assert.ok(release[publisher].steps.indexOf(download) < release[publisher].steps.indexOf(publication));
    for (const value of release[publisher].steps) {
      assert.doesNotMatch(value.run || '', /(?:python\s+-m\s+build|npm\s+pack|pip\s+install)/, 'publishers must not rebuild or install Python build code');
    }
  }
  assert.deepEqual(commands(step(release['publish-npm'], 'Install npm for OIDC trusted publishing')), ['npm install -g npm@11.5.1']);
  assert.deepEqual(commands(step(release['publish-npm'], 'Verify and publish exact npm artifact')), [
    'node scripts/check-release-artifacts.mjs verify release-artifacts',
    'node scripts/check-npm-release.mjs "${GITHUB_REF_NAME#v}"',
    'npm publish "./release-artifacts/hardguard25-${GITHUB_REF_NAME#v}.tgz" --ignore-scripts',
  ]);
  assert.equal(release['publish-pypi'].environment, 'pypi');
  assert.deepEqual(commands(step(release['publish-pypi'], 'Verify exact Python artifacts and select publication files')), [
    'node scripts/check-release-artifacts.mjs verify release-artifacts', 'mkdir python-publish',
    'cp release-artifacts/*.whl release-artifacts/*.tar.gz python-publish/',
  ]);
  const pypi = step(release['publish-pypi'], 'Publish to PyPI');
  assert.match(pypi.uses, /^pypa\/gh-action-pypi-publish@/);
  assert.equal(pypi.with['packages-dir'], 'python-publish');
  assert.equal(pypi.with['skip-existing'], false);
  assert.ok(release['publish-pypi'].steps.indexOf(step(release['publish-pypi'], 'Verify exact Python artifacts and select publication files')) < release['publish-pypi'].steps.indexOf(pypi));
  assert.deepEqual(needs(release['tag-go']), ['publish-npm', 'publish-pypi']);
  assert.match(step(release['tag-go'], 'Tag Go submodule').run, /check-go-release-tag\.mjs/);
  const pages = workflows['pages.yml'].jobs;
  assert.ok(workflows['pages.yml'].on.workflow_dispatch !== undefined, 'pages.yml: manual redeploy trigger required');
  assert.deepEqual(needs(pages.build), ['validate']);
  assert.deepEqual(needs(pages.deploy), ['build']);
  const pagesUpload = pages.build.steps.filter(s => s.uses?.startsWith('actions/upload-pages-artifact@'));
  assert.equal(pagesUpload.length, 1, 'pages.yml: build uploads exactly one Pages artifact');
  assert.deepEqual(pagesUpload[0].with, { path: 'docs', 'include-hidden-files': true }, 'pages.yml: artifact must be docs/ including .well-known');
  assert.ok(!pages.deploy.steps.some(s => s.uses?.startsWith('actions/upload-pages-artifact@')), 'pages.yml: upload must not share the deploy job');
  assert.equal(pages.deploy.steps.filter(s => s.uses?.startsWith('actions/deploy-pages@')).length, 1, 'pages.yml: deploy job runs deploy-pages once');
  assert.deepEqual(commands(step(pages.validate, 'Verify the exact deployment commit')), ['npm run verify', 'npm run verify:browser']);
  assert.deepEqual(needs(pages['verify-search']), ['deploy']);
  const surfaces = workflows['surfaces.yml'];
  assert.ok(surfaces.on.schedule?.length === 1 && surfaces.on.workflow_dispatch !== undefined, 'surfaces.yml: weekly schedule and manual trigger required');
  assert.deepEqual(surfaces.jobs.audit.steps.filter(s => s.run).map(s => s.name), [
    'Install locked repository tools', 'Audit Python build locks', 'Audit npm lockfile', 'Verify deployed search surfaces', 'Verify deployed agent and disclosure surfaces',
  ], 'surfaces.yml: read-only audit step allowlist');
  for (const value of surfaces.jobs.audit.steps) assert.doesNotMatch(value.run || '', /(?:npm publish|git push|gh release|twine)/, 'surfaces.yml must stay read-only');
  const scorecard = workflows['scorecard.yml'];
  assert.ok(scorecard.on.schedule?.length === 1, 'scorecard.yml: weekly schedule required');
  const scorecardStep = scorecard.jobs.analysis.steps.find(s => s.uses?.startsWith('ossf/scorecard-action@'));
  assert.ok(scorecardStep && scorecardStep.with?.publish_results === true, 'scorecard.yml: results must be published to the Security tab');
  const tests = workflows['test.yml'].jobs;
  assert.deepEqual(commands(step(tests.repository, 'Run canonical repository verifier')), ['npm run verify']);
  assert.equal(tests['minimum-runtimes']['runs-on'], 'ubuntu-24.04', 'Python 3.9 compatibility must use a supported runner image');
  const go386 = step(tests['minimum-runtimes'], 'Execute 32-bit checksum and lookup regressions');
  assert.equal(go386.env?.GOARCH, '386');
  assert.equal(go386['working-directory'], 'go');
  assert.deepEqual(commands(go386), ['go test ./...']);
  const minimumPython = tests['minimum-python-backend'].steps.find(s => s.uses?.startsWith('actions/setup-python@'));
  assert.equal(minimumPython?.with?.['python-version'], '3.10', 'source builds must run on the declared Python minimum');
  assert.deepEqual(commands(step(tests['minimum-python-backend'], 'Verify oldest supported build backend artifacts')), ['python scripts/check-python-package.py --minimum-backend']);
}
export function readWorkflows(directory = '.github/workflows') {
  return Object.fromEntries(fs.readdirSync(directory).filter(file => file.endsWith('.yml')).map(file => [file, parseWorkflow(fs.readFileSync(path.join(directory, file), 'utf8'))]));
}
export function checkBuildLocks(locks, pyproject) {
  const expected = ['build', 'colorama', 'importlib-metadata', 'packaging', 'pyproject-hooks', 'setuptools', 'tomli', 'wheel', 'zipp'];
  const floor = pyproject.match(/requires\s*=\s*\["setuptools>=(84\.1\.0)", "wheel"\]/)?.[1];
  assert.equal(floor, '84.1.0', 'Python backend floor must use the approved patched release');
  for (const [file, contents] of Object.entries(locks)) {
    const rows = contents.split('\n').filter(row => row && !row.startsWith('#'));
    const entries = rows.map(row => {
      const match = row.match(/^([\w-]+)==([\d.]+)(?: ; [^\n]+)?((?: --hash=sha256:[0-9a-f]{64})+)$/);
      assert.ok(match, `${file}: exact reviewed version/hash required`);
      return [match[1], match[2]];
    });
    assert.deepEqual(entries.map(([name]) => name).sort(), expected, `${file}: complete build-tool inventory required`);
    if (file.includes('minimum')) assert.equal(new Map(entries).get('setuptools'), floor);
    else assert.equal(new Map(entries).get('setuptools'), '84.2.1', 'release backend must use reviewed current pin');
  }
  assert.equal(Object.keys(locks).length, 2, 'both minimum and release locks are required');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  checkWorkflows(readWorkflows());
  checkBuildLocks(Object.fromEntries(['scripts/python-build-requirements.txt', 'scripts/python-build-minimum-requirements.txt'].map(file => [file, fs.readFileSync(file, 'utf8')])), fs.readFileSync('python/pyproject.toml', 'utf8'));
  console.log('workflow structure, publication boundaries and build locks passed');
}
