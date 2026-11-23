import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { checkBuildLocks, checkWorkflows, parseWorkflow, readWorkflows } from './check-workflows.mjs';

test('workflow policy accepts current structure and rejects protection removal', () => {
  const current = readWorkflows();
  checkWorkflows(current);
  const mutations = [
    value => { value['test.yml'].jobs['minimum-runtimes']['runs-on'] = 'ubuntu-latest'; },
    value => { value['release.yml'].jobs['publish-npm'].steps.unshift({ name: 'Bypass', run: 'npm publish ./js' }); },
    value => { value['release.yml'].jobs['publish-npm'].steps.find(s => s.name === 'Verify and publish exact npm artifact').shell = 'bash +e {0}'; },
    value => { const steps = value['release.yml'].jobs.preflight.steps; steps.unshift(steps.pop()); },
    value => { value['test.yml'].jobs['minimum-python-backend'].if = false; },
    value => { value['test.yml'].jobs['minimum-python-backend'].steps.find(s => s.uses?.startsWith('actions/setup-python@')).with['python-version'] = '3.12'; },
    value => { value['release.yml'].jobs.preflight.if = 'always()'; },
    value => { value['release.yml'].jobs.preflight['continue-on-error'] = '${{ true }}'; },
    value => { value['test.yml'].jobs['minimum-runtimes'].steps.find(s => s.name === 'Execute 32-bit checksum and lookup regressions').run = 'echo skipped'; },
    value => { value['release.yml'].jobs['publish-npm'].steps.find(s => s.name === 'Verify and publish exact npm artifact').env = {}; },
    value => { value['release.yml'].jobs.preflight.steps[0].uses = 'actions/checkout@main'; },
    value => { delete value['release.yml'].jobs.preflight.steps[0].with; },
    value => { value['test.yml'].jobs.repository.steps[0].with = { 'persist-credentials': true }; },
    value => { value['release.yml'].jobs.preflight.permissions = { contents: 'write' }; },
    value => { value['pages.yml'].jobs.deploy.needs = []; },
    value => { value['pages.yml'].jobs.deploy.needs = ['validate']; },
    value => { value['pages.yml'].jobs.build.needs = []; },
    value => { delete value['pages.yml'].on.workflow_dispatch; },
    value => { value['pages.yml'].jobs.build.steps.find(s => s.uses?.startsWith('actions/upload-pages-artifact@')).with['include-hidden-files'] = false; },
    value => { value['pages.yml'].jobs.deploy.steps.unshift(structuredClone(value['pages.yml'].jobs.build.steps.at(-1))); },
    value => { value['pages.yml'].jobs.validate.steps.find(s => s.name === 'Verify the exact deployment commit').run = 'npm run verify'; },
    value => { value['release.yml'].jobs['publish-npm'].needs = []; },
    value => { value['release.yml'].jobs.preflight.steps.find(s => s.name === 'Build and verify exact release artifacts').env = {}; },
    value => { value['release.yml'].jobs['publish-pypi'].steps.push({ run: 'python -m build' }); },
    value => { value['release.yml'].jobs['publish-npm'].steps.find(s => s.name === 'Verify and publish exact npm artifact').run = 'npm publish'; },
    value => { value['release.yml'].jobs.preflight.steps.find(s => s.name === 'Bind artifacts to reviewed source and commit')['continue-on-error'] = true; },
    value => { value['test.yml'].jobs['minimum-runtimes'].steps.find(s => s.name === 'Execute 32-bit checksum and lookup regressions').env = {}; },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(current); mutate(changed);
    assert.throws(() => checkWorkflows(changed));
  }
  assert.throws(() => parseWorkflow('jobs: {}\njobs: {}\n'), /duplicate keys/);
});

test('build locks require exact complete inventories and matching supported backend floor', () => {
  const paths = ['scripts/python-build-requirements.txt', 'scripts/python-build-minimum-requirements.txt'];
  const locks = Object.fromEntries(paths.map(file => [file, fs.readFileSync(file, 'utf8')]));
  const project = fs.readFileSync('python/pyproject.toml', 'utf8');
  checkBuildLocks(locks, project);
  for (const mutate of [
    value => { value[paths[0]] = '# no tools\n'; },
    value => { value[paths[1]] = value[paths[1]].replace(/^setuptools.*$/m, ''); },
    value => { value[paths[0]] = value[paths[0]].replace('build==', 'build>='); },
    value => { value[paths[0]] = value[paths[0]].replace(/ --hash=sha256:[0-9a-f]{64}/, ''); },
    value => { value[paths[0]] = value[paths[0]].replace(/ --hash=sha256:([0-9a-f]{64})/, ' --hash=sha256:$1 --hash=md5:0123456789abcdef'); },
    value => { value[paths[1]] = value[paths[1]].replace(/^setuptools==84\.1\.0/m, 'setuptools==84.2.1'); },
  ]) { const changed = { ...locks }; mutate(changed); assert.throws(() => checkBuildLocks(changed, project)); }
  const twoHashes = { ...locks, [paths[0]]: locks[paths[0]].replace(/^(build==[\d.]+ --hash=sha256:[0-9a-f]{64})$/m, '$1 --hash=sha256:' + 'a'.repeat(64)) };
  assert.notEqual(twoHashes[paths[0]], locks[paths[0]]);
  checkBuildLocks(twoHashes, project);
  for (const version of ['68.0', '77.0.3', '82.0.1']) {
    assert.throws(() => checkBuildLocks(locks, project.replace(/setuptools>=[\d.]+/, `setuptools>=${version}`)));
  }
});
