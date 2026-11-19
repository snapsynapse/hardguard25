import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { releaseArtifactNames, writeReleaseManifest, verifyReleaseManifest } from './check-release-artifacts.mjs';

test('release acceptance binds exact artifacts, source and commit', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hardguard25-release-'));
  const commit = 'a'.repeat(40);
  try {
    const files = releaseArtifactNames(process.cwd());
    for (const file of files) fs.writeFileSync(path.join(directory, file), file);
    let anchor = writeReleaseManifest(process.cwd(), directory, commit);
    verifyReleaseManifest(process.cwd(), directory, commit, anchor);
    assert.throws(() => verifyReleaseManifest(process.cwd(), directory, commit), /trusted preflight manifest digest/);
    assert.throws(() => verifyReleaseManifest(process.cwd(), directory, 'b'.repeat(40), anchor), /mismatch/);
    fs.appendFileSync(path.join(directory, files[0]), 'changed');
    assert.throws(() => verifyReleaseManifest(process.cwd(), directory, commit, anchor), /mismatch/);
    fs.writeFileSync(path.join(directory, files[0]), files[0]);
    const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json')));
    manifest.sources['js/index.js'] = '0'.repeat(64);
    fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify(manifest));
    assert.throws(() => verifyReleaseManifest(process.cwd(), directory, commit, anchor), /trusted preflight digest/);
    anchor = writeReleaseManifest(process.cwd(), directory, commit);
    fs.appendFileSync(path.join(directory, files[0]), 'replacement');
    writeReleaseManifest(process.cwd(), directory, commit);
    assert.throws(() => verifyReleaseManifest(process.cwd(), directory, commit, anchor), /trusted preflight digest/);
    fs.writeFileSync(path.join(directory, files[0]), files[0]);
    anchor = writeReleaseManifest(process.cwd(), directory, commit);
    fs.unlinkSync(path.join(directory, files[0]));
    assert.throws(() => verifyReleaseManifest(process.cwd(), directory, commit, anchor), /inventory/);
    fs.writeFileSync(path.join(directory, files[0]), files[0]);
    fs.writeFileSync(path.join(directory, 'unexpected.tgz'), 'extra');
    assert.throws(() => verifyReleaseManifest(process.cwd(), directory, commit, anchor), /inventory/);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
