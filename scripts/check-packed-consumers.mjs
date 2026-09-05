import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hardguard25-packed-'));
const cache = path.join(temp, 'npm-cache');

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', env: { ...process.env, npm_config_cache: cache } });
  if (result.status !== 0) {
    process.stderr.write(result.stdout || '');
    process.stderr.write(result.stderr || '');
    process.exit(result.status ?? 1);
  }
  return result.stdout.trim();
}

try {
  const tarballName = run('npm', ['pack', '--silent', '--pack-destination', temp], path.join(root, 'js'));
  const tarball = path.join(temp, tarballName.split(/\r?\n/).at(-1));
  const consumer = path.join(temp, 'consumer');
  fs.mkdirSync(consumer);
  fs.writeFileSync(path.join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball], consumer);

  fs.writeFileSync(path.join(consumer, 'runtime.mjs'), `
    import hardguard25, * as named from 'hardguard25';
    const expected = ['ALPHABET', 'ALPHABET_SET', 'CHAR_TO_INDEX', 'checkDigit', 'default', 'generate', 'normalize', 'validate', 'verifyCheckDigit'];
    if (JSON.stringify(Object.keys(named).sort()) !== JSON.stringify(expected)) process.exit(1);
    if (named.checkDigit('AC3H7PUW') !== 'N') process.exit(1);
    if (hardguard25.checkDigit !== named.checkDigit) process.exit(1);
  `);
  run(process.execPath, ['runtime.mjs'], consumer);

  fs.writeFileSync(path.join(consumer, 'consumer.ts'), `
    import hardguard25, { ALPHABET, ALPHABET_SET, CHAR_TO_INDEX, generate, validate, normalize, checkDigit, verifyCheckDigit } from 'hardguard25';
    const value: string = generate(8, { checkDigit: true });
    const alphabet: string = ALPHABET;
    const members: ReadonlySet<string> = ALPHABET_SET;
    const indices: ReadonlyMap<string, number> = CHAR_TO_INDEX;
    const valid: boolean = validate(value);
    normalize(value); checkDigit(value); verifyCheckDigit(value); hardguard25.generate(8);
    void [alphabet, members, indices, valid];
    // @ts-expect-error length must be numeric
    generate('8');
    // @ts-expect-error option name is part of the public contract
    generate(8, { checksum: true });
  `);
  const tsc = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');
  assert.ok(fs.existsSync(tsc), 'TypeScript compiler must be installed with npm ci');
  run(process.execPath, [tsc, '--noEmit', '--strict', '--target', 'ES2022', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', 'consumer.ts'], consumer);

  const installed = path.join(consumer, 'node_modules', 'hardguard25');
  for (const required of ['index.js', 'index.d.ts', 'README.md', 'LICENSE', 'package.json']) {
    assert.ok(fs.existsSync(path.join(installed, required)), `npm artifact missing ${required}`);
  }
  assert.ok(!fs.existsSync(path.join(installed, 'index.test.js')), 'npm artifact must exclude tests');
  console.log('packed npm runtime and TypeScript consumer checks passed');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
