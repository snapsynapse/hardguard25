import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const python = process.env.PYTHON || (fs.existsSync(path.join(root, '.venv', 'bin', 'python')) ? path.join(root, '.venv', 'bin', 'python') : 'python3');
const steps = [
  ['documentation generator', process.execPath, ['scripts/check-docs-generator.mjs'], root],
  ['documentation examples', process.execPath, ['scripts/check-doc-examples.mjs'], root],
  ['URL conventions', process.execPath, ['scripts/check-url-conventions.mjs'], root],
  ['search contract', process.execPath, ['scripts/check-search.mjs'], root],
  ['agent surfaces', process.execPath, ['scripts/check-agent-surfaces.mjs'], root],
  ['release versions', process.execPath, ['scripts/check-release-versions.mjs'], root],
  ['project metadata', process.execPath, ['scripts/check-project-metadata.mjs'], root],
  ['benchmark protocol', process.execPath, ['scripts/check-benchmark-protocol.mjs'], root],
  ['JavaScript tests', 'npm', ['test'], path.join(root, 'js')],
  ['Python tests', python, ['-m', 'pytest'], path.join(root, 'python')],
  ['Go tests', 'go', ['test', './...'], path.join(root, 'go')],
  ['packed consumers', process.execPath, ['scripts/check-packed-consumers.mjs'], root],
  ['Python package', python, ['scripts/check-python-package.py'], root],
];

for (const [label, command, args, cwd] of steps) {
  console.log(`\n==> ${label}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, GOCACHE: path.join(root, '.gocache') },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log('\nAll deterministic repository checks passed');
