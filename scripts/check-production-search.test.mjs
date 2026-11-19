import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const script = pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.url)), 'check-production-search.mjs')).href;
const origin = 'https://example.com/';
const page = '<link rel="canonical" href="https://example.com/"><title>Home</title>';
const entry = loc => `<url><loc>${loc}</loc><lastmod>2026-01-01</lastmod></url>`;
const sitemap = `<urlset>${entry(origin)}</urlset>`;

function run(overrides = {}, config = {}, files = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hg25-production-'));
  try {
    fs.mkdirSync(path.join(root, 'docs'));
    fs.writeFileSync(path.join(root, 'docs/sitemap.xml'), sitemap);
    for (const [file, body] of Object.entries(files)) fs.writeFileSync(path.join(root, 'docs', file), body);
    fs.writeFileSync(path.join(root, 'search-audit.config.json'), JSON.stringify({
      contractVersion: 3, canonicalOrigin: origin, outputDir: 'docs', sitemaps: ['sitemap.xml'], ...config,
    }));
    const routes = { [origin]: { body: page }, [`${origin}sitemap.xml`]: { body: sitemap }, ...overrides };
    const input = `
      import fs from 'node:fs';
      const routes = ${JSON.stringify(routes)};
      const requests = [];
      process.on('exit', () => fs.writeFileSync('requests.json', JSON.stringify(requests)));
      globalThis.fetch = async (input, options) => {
        const url = String(input);
        requests.push(url);
        if (options.redirect !== 'manual') throw new Error('redirects must be checked before following');
        const route = routes[url];
        if (!route || route.fail) throw new Error('simulated transport failure');
        const headers = new Headers({ 'content-type': url.endsWith('.xml') ? 'application/xml' : 'text/html', ...route.headers });
        if (route.bodyError) return { ok: true, headers, body: null, text: async () => { throw new Error('simulated body abort'); } };
        const response = new Response(route.status >= 300 && route.status < 400 ? null : route.body || '', { status: route.status || 200, headers });
        if (route.cancelError) Object.defineProperty(response, 'body', { value: { cancel: async () => { throw new Error('simulated cancel failure'); } } });
        return response;
      };
      await import(${JSON.stringify(script)});
    `;
    const result = spawnSync(process.execPath, ['--input-type=module', '-', '--json'], {
      cwd: root, input, encoding: 'utf8', timeout: 10000,
    });
    assert.ok(result.stdout.trim(), result.stderr || result.error?.message);
    return { status: result.status, summary: JSON.parse(result.stdout), stderr: result.stderr,
      requests: JSON.parse(fs.readFileSync(path.join(root, 'requests.json'), 'utf8')) };
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
}

test('production scenario matrix separates observed defects from incomplete collection', () => {
  for (const [name, route, expected] of [
    ['healthy', { body: sitemap }, [0, 0, 0, true]],
    ['DNS failure', { fail: true }, [2, 0, 1, false]],
    ['body abort', { bodyError: true }, [2, 0, 1, false]],
    ['404', { status: 404 }, [1, 1, 0, false]],
    ['429', { status: 429 }, [2, 0, 1, false]],
    ['503', { status: 503 }, [2, 0, 1, false]],
    ['empty body', { body: '' }, [1, 1, 0, false]],
    ['empty sitemap', { body: '<urlset/>' }, [1, 1, 0, false]],
    ['empty loc', { body: `<urlset>${entry(origin)}${entry('')}</urlset>` }, [1, 1, 0, false]],
    ['missing loc', { body: `<urlset>${entry(origin)}<url/></urlset>` }, [1, 1, 0, false]],
    ['duplicate loc', { body: `<urlset>${entry(origin)}<url><loc>a</loc><loc>b</loc></url></urlset>` }, [1, 1, 0, false]],
    ['mismatched XML', { body: '<urlset><url></urlset>' }, [1, 1, 0, false]],
  ]) {
    const { status, summary } = run({ [`${origin}sitemap.xml`]: route });
    assert.deepEqual([status, summary.defects, summary.infrastructure, summary.collectionComplete], expected, name);
  }
});

test('rejected page locations never reach the transport', () => {
  for (const target of [
    'https://outside.invalid/private', 'http://127.0.0.1/private', '//outside.invalid/private',
    'ftp://example.com/private', 'https://user:password@example.com/private',
    'https://example.com/private#fragment', 'https:\\outside.invalid\\private',
  ]) {
    const result = run({ [`${origin}sitemap.xml`]: { body: `<urlset>${entry(origin)}${entry(target)}</urlset>` } });
    assert.equal(result.status, 1, target);
    assert.equal(result.summary.defects, 1, target);
    assert.deepEqual(result.requests, [`${origin}sitemap.xml`, origin], target);
  }
});

test('redirect hops are checked before requests, with loop and same-origin handling', () => {
  const outside = 'https://outside.invalid/private';
  const escaped = run({ [origin]: { status: 302, headers: { location: outside } } });
  assert.equal(escaped.status, 1);
  assert.ok(!escaped.requests.includes(outside));
  const loop = run({ [origin]: { status: 302, headers: { location: origin } } });
  assert.equal(loop.status, 1);
  assert.equal(loop.requests.filter(url => url === origin).length, 1);
  const redirected = run({ [origin]: { status: 302, headers: { location: '/moved/' } },
    [`${origin}moved/`]: { body: page } });
  assert.equal(redirected.status, 1, 'same-origin canonical page redirect is observed as a defect');
  assert.ok(redirected.requests.includes(`${origin}moved/`));
});

test('explicit redirect probes retain their configured authority without arbitrary hops', () => {
  const from = 'http://example.com/';
  const result = run({ [from]: { status: 301, headers: { location: origin } } }, { redirects: [{ from, to: origin }] });
  assert.equal(result.status, 0);
  assert.ok(result.requests.includes(from));
  const outside = 'https://outside.invalid/private';
  const rejected = run({ [from]: { status: 301, headers: { location: outside } } }, { redirects: [{ from, to: origin }] });
  assert.equal(rejected.status, 1);
  assert.ok(!rejected.requests.includes(outside));
});

test('partial child-sitemap outage suppresses unobserved inventory differences', () => {
  const index = `<sitemapindex><sitemap><loc>${origin}good.xml</loc></sitemap><sitemap><loc>${origin}failed.xml</loc></sitemap></sitemapindex>`;
  const result = run({ [`${origin}sitemap.xml`]: { body: index }, [`${origin}good.xml`]: { body: sitemap },
    [`${origin}failed.xml`]: { fail: true } }, {}, { 'sitemap.xml': index, 'good.xml': sitemap,
    'failed.xml': `<urlset>${entry(`${origin}unobserved/`)}</urlset>` });
  assert.equal(result.status, 2);
  assert.equal(result.summary.defects, 0);
  assert.equal(result.summary.infrastructure, 1);
  assert.equal(result.summary.collectionComplete, false);
  assert.ok(!result.stderr.includes('missing repository URL'));
});

test('complete inventory differences remain actionable defects', () => {
  const result = run({ [`${origin}sitemap.xml`]: { body: `<urlset>${entry(origin)}${entry(`${origin}extra/`)}</urlset>` },
    [`${origin}extra/`]: { body: `<link rel="canonical" href="${origin}extra/">` } });
  assert.equal(result.status, 1);
  assert.equal(result.summary.collectionComplete, true);
  assert.equal(result.summary.defects, 1);
  assert.ok(result.stderr.includes('absent from repository'));
});

test('malformed redirect configuration retains a structured setup failure', () => {
  for (const redirects of [[{ from: 'broken', to: origin }], [{ from: origin, to: 'file:///private' }]]) {
    const result = run({}, { redirects });
    assert.equal(result.status, 2);
    assert.equal(result.summary.infrastructure, 1);
    assert.equal(result.summary.defects, 0);
    assert.deepEqual(result.requests, []);
  }
});

test('failed cancellation does not erase an already observed response', () => {
  const missing = run({ [`${origin}sitemap.xml`]: { status: 404, cancelError: true } });
  assert.equal(missing.status, 1);
  assert.equal(missing.summary.defects, 1);
  const redirected = run({ [origin]: { status: 302, cancelError: true, headers: { location: '/moved/' } },
    [`${origin}moved/`]: { body: page } });
  assert.equal(redirected.status, 1);
  assert.equal(redirected.summary.defects, 1);
  assert.ok(redirected.requests.includes(`${origin}moved/`));
});
