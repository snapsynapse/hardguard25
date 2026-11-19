import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { npmPayloadFiles, snapshotNpmPayload, verifyNpmPayload } from './check-npm-payload.mjs';

test('npm byte gate rejects changed payload despite restored source, extra files and dependencies', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hardguard25-payload-'));
  try {
    for (const file of npmPayloadFiles) fs.copyFileSync(path.join('js', file), path.join(temp, file));
    const snapshot = snapshotNpmPayload('js');
    verifyNpmPayload(temp, snapshot);
    for (const file of ['index.js', 'index.d.ts', 'README.md', 'package.json']) {
      fs.appendFileSync(path.join(temp, file), '\n/* drift */');
      assert.throws(() => verifyNpmPayload(temp, snapshot), /differs from prepack source/);
      fs.writeFileSync(path.join(temp, file), snapshot.get(file));
    }
    fs.writeFileSync(path.join(temp, 'unexpected'), 'no');
    assert.throws(() => verifyNpmPayload(temp, snapshot), /inventory/);
    fs.unlinkSync(path.join(temp, 'unexpected'));
    const manifest = JSON.parse(snapshot.get('package.json'));
    manifest.dependencies = { unexpected: '1.0.0' };
    fs.writeFileSync(path.join(temp, 'package.json'), JSON.stringify(manifest));
    assert.throws(() => verifyNpmPayload(temp, snapshotNpmPayload(temp)), /dependency-free/);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});
