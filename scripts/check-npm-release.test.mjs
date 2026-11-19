import assert from 'node:assert/strict';
import test from 'node:test';
import { assertNpmVersionAbsent } from './check-npm-release.mjs';

test('npm publication preflight accepts only authoritative absence', async () => {
  await assertNpmVersionAbsent('1.3.10', async () => new Response('{}', { status: 404 }));
  for (const status of [401, 403, 429, 500, 503, 302]) {
    await assert.rejects(assertNpmVersionAbsent('1.3.10', async () => new Response('{}', { status })));
  }
  for (const body of ['invalid json', '{}', '{"name":"other","version":"1.3.10"}', '{"name":"hardguard25","version":"1.3.10"}']) {
    await assert.rejects(assertNpmVersionAbsent('1.3.10', async () => new Response(body)));
  }
  await assert.rejects(assertNpmVersionAbsent('1.3.10', async () => { throw new Error('DNS/timeout'); }));
  await assert.rejects(assertNpmVersionAbsent('../latest', () => assert.fail('must not request invalid version')));
});
