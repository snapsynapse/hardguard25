import assert from 'node:assert/strict';
import test from 'node:test';
import { checkProductionSurfaces, surfacePaths } from './check-production-surfaces.mjs';

const tracked = Object.fromEntries(surfacePaths.map(path => [path, Buffer.from(`tracked ${path}\n`)]));
const respond = (status, body) => ({ status, arrayBuffer: async () => Buffer.from(body) });

test('identical deployed bytes pass and every path is requested once over the canonical origin', async () => {
  const requested = [];
  const result = await checkProductionSurfaces(async (url, options) => {
    requested.push(url);
    assert.equal(options.redirect, 'error');
    return respond(200, tracked[new URL(url).pathname.slice(1)]);
  }, path => tracked[path]);
  assert.deepEqual(result, { checked: surfacePaths.length, defects: [], failures: [] });
  assert.deepEqual(requested, surfacePaths.map(path => `https://hardguard25.com/${path}`));
});

test('changed bytes and missing files are defects; transport errors are infrastructure failures', async () => {
  const result = await checkProductionSurfaces(async url => {
    const path = new URL(url).pathname.slice(1);
    if (path === 'agents.json') return respond(200, 'tampered');
    if (path === '.well-known/security.txt') return respond(404, '');
    if (path === 'robots.txt') throw new Error('socket hang up');
    if (path === 'sitemap.xml') return respond(503, '');
    return respond(200, tracked[path]);
  }, path => tracked[path]);
  assert.equal(result.defects.length, 2);
  assert.match(result.defects[0], /^agents\.json: deployed sha256/);
  assert.match(result.defects[1], /^\.well-known\/security\.txt: HTTP 404/);
  assert.deepEqual(result.failures, ['robots.txt: socket hang up', 'sitemap.xml: HTTP 503']);
});
