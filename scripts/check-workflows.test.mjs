import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { checkBuildLocks, checkWorkflows, parseWorkflow, readWorkflows } from './check-workflows.mjs';

test('workflow policy accepts current structure and rejects protection removal', () => {
  const current = readWorkflows();
  checkWorkflows(current);
  const mutations = [
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
    value => { value['release.yml'].jobs.preflight.permissions = { contents: 'write' }; },
    value => { value['pages.yml'].jobs.deploy.needs = []; },
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
  ]) { const changed = { ...locks }; mutate(changed); assert.throws(() => checkBuildLocks(changed, project)); }
  for (const version of ['68.0', '77.0.3', '82.0.1']) {
    assert.throws(() => checkBuildLocks(locks, project.replace(/setuptools>=[\d.]+/, `setuptools>=${version}`)));
  }
});
