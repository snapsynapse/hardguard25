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
