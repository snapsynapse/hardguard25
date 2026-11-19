import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const sourcePaths = ['js/package.json', 'js/index.js', 'js/index.d.ts', 'js/README.md', 'js/LICENSE',
  'python/pyproject.toml', 'python/hardguard25/__init__.py', 'python/hardguard25/py.typed', 'python/README.md', 'python/LICENSE',
  'python/MANIFEST.in', 'scripts/python-build-requirements.txt', 'scripts/python-build-minimum-requirements.txt'];
export function releaseArtifactNames(root) {
  const version = JSON.parse(fs.readFileSync(path.join(root, 'js/package.json'), 'utf8')).version;
  assert.match(version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
  return [`hardguard25-${version}-py3-none-any.whl`, `hardguard25-${version}.tar.gz`, `hardguard25-${version}.tgz`].sort();
}
function state(root, directory, commit) {
  assert.match(commit, /^[0-9a-f]{40}$/);
  const files = releaseArtifactNames(root);
  assert.deepEqual(fs.readdirSync(directory).filter(file => file !== 'manifest.json').sort(), files, 'release artifact inventory mismatch');
  return {
    schemaVersion: 1, commit,
    sources: Object.fromEntries(sourcePaths.map(file => [file, digest(fs.readFileSync(path.join(root, file)))])),
    artifacts: files.map(file => {
      const target = path.join(directory, file);
      assert.ok(fs.lstatSync(target).isFile() && !fs.lstatSync(target).isSymbolicLink(), 'artifact must be a regular file');
      const bytes = fs.readFileSync(target);
      return { file, size: bytes.length, sha256: digest(bytes) };
    }),
  };
}
export function writeReleaseManifest(root, directory, commit) {
  const manifest = state(root, directory, commit);
  const bytes = JSON.stringify(manifest, null, 2) + '\n';
  fs.writeFileSync(path.join(directory, 'manifest.json'), bytes);
  return digest(bytes);
}
export function verifyReleaseManifest(root, directory, commit, expectedDigest) {
  assert.match(expectedDigest || '', /^[0-9a-f]{64}$/, 'trusted preflight manifest digest required');
  const bytes = fs.readFileSync(path.join(directory, 'manifest.json'));
  assert.equal(digest(bytes), expectedDigest, 'downloaded manifest differs from trusted preflight digest');
  const actual = JSON.parse(bytes);
  assert.deepEqual(actual, state(root, directory, commit), 'release artifact manifest/source/commit mismatch');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [mode, directory] = process.argv.slice(2);
  const commit = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  assert.ok(['write', 'verify'].includes(mode), 'expected write or verify');
  if (mode === 'write') {
    const sha256 = writeReleaseManifest(process.cwd(), path.resolve(directory), commit);
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `sha256=${sha256}\n`);
  } else verifyReleaseManifest(process.cwd(), path.resolve(directory), commit, process.env.HG25_EXPECTED_MANIFEST_SHA256);
  console.log(`release manifest ${mode} passed`);
}
