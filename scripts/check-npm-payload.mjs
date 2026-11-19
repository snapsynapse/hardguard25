import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export const npmPayloadFiles = ['LICENSE', 'README.md', 'index.d.ts', 'index.js', 'package.json'];
export function snapshotNpmPayload(source) {
  return new Map(npmPayloadFiles.map(file => [file, fs.readFileSync(path.join(source, file))]));
}
export function verifyNpmPayload(installed, snapshot) {
  assert.deepEqual(fs.readdirSync(installed).sort(), npmPayloadFiles, 'installed npm inventory must be exact');
  for (const [file, bytes] of snapshot) {
    assert.ok(fs.lstatSync(path.join(installed, file)).isFile(), `${file} must be a regular file`);
    assert.deepEqual(fs.readFileSync(path.join(installed, file)), bytes, `${file}: npm payload differs from prepack source snapshot`);
  }
  const manifest = JSON.parse(snapshot.get('package.json'));
  for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
    assert.equal(Object.keys(manifest[field] || {}).length, 0, `npm runtime must remain dependency-free: ${field}`);
  }
}
