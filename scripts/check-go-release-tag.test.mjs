import assert from 'node:assert/strict';
import test from 'node:test';
import { checkGoReleaseTag } from './check-go-release-tag.mjs';

const commit = 'a'.repeat(40);
const other = 'b'.repeat(40);
const tag = 'go/v1.3.8';
const ref = `refs/tags/${tag}`;

test('Go release tag identity accepts missing, matching lightweight and matching annotated tags', () => {
  assert.equal(checkGoReleaseTag('', tag, commit), 'missing');
  assert.equal(checkGoReleaseTag('', 'go/v1.4.0-rc.1', commit), 'missing');
  assert.equal(checkGoReleaseTag(`${commit}\t${ref}\n`, tag, commit), 'matching');
  assert.equal(checkGoReleaseTag(`${other}\t${ref}\n${commit}\t${ref}^{}\n`, tag, commit), 'matching');
});

test('Go release tag identity rejects mismatches and malformed remote evidence', () => {
  for (const refs of [
    `${other}\t${ref}\n`,
    `${commit}\t${ref}\n${other}\t${ref}^{}\n`,
    `${commit}\t${ref}^{}\n`,
    `${commit}\t${ref}\n${commit}\t${ref}\n`,
    `${commit}\t${ref}-other\n`,
    'malformed\n',
  ]) assert.throws(() => checkGoReleaseTag(refs, tag, commit));
  assert.throws(() => checkGoReleaseTag('', '--upload-pack=bad', commit));
  assert.throws(() => checkGoReleaseTag('', tag, 'short-sha'));
});

test('Go tag CLI rejects failed transport even with matching partial stdout', async () => {
  const fs = await import('node:fs');
  const os = await import('node:os');
  const path = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hardguard25-git-'));
  try {
    // This CLI transport fixture runs on Unix; parser cases remain portable.
    if (process.platform === 'win32') return;
    fs.writeFileSync(path.join(root, 'git'), `#!/bin/sh\nprintf '%s\\n' '${commit}\t${ref}'\nexit 1\n`, { mode: 0o755 });
    const result = spawnSync(process.execPath, ['scripts/check-go-release-tag.mjs', tag, commit], {
      encoding: 'utf8', env: { ...process.env, PATH: root + path.delimiter + process.env.PATH },
    });
    assert.equal(result.status, 1);
    assert.equal(result.stdout.trim(), '');
    assert.ok(result.stderr.length > 0);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
