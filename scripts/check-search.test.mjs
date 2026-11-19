import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import { decode, parseSitemap } from './search-sitemap.mjs';

const scripts = path.dirname(fileURLToPath(import.meta.url));

for (const production of [false, true]) {
  test(`${production ? 'production' : 'offline'} search decodes sitemap and canonical entities once`, () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hardguard25-search-'));
    try {
      fs.mkdirSync(path.join(root, 'docs'));
      const origin = 'https://example.com/';
      // The nested entity must remain literal &lt;, rather than becoming <.
      const canonical = `${origin}page&amp;lt;tag&amp;gt;&amp;next=2`;
      fs.writeFileSync(path.join(root, 'search-audit.config.json'), JSON.stringify({
        contractVersion: 3, canonicalOrigin: origin, outputDir: 'docs',
        sitemaps: ['sitemap.xml'], minimumWords: 0,
      }));
      fs.writeFileSync(path.join(root, 'docs/sitemap.xml'),
        `<sitemapindex><sitemap><loc>\n ${origin}sitemap&#x2D;pages.xml \n</loc></sitemap></sitemapindex>`);
      fs.writeFileSync(path.join(root, 'docs/sitemap-pages.xml'),
        `<urlset><url><loc>${origin}</loc><lastmod>2026-01-01</lastmod></url>` +
        `<url><loc>\n ${canonical} \n</loc><lastmod>2026-01-01</lastmod></url></urlset>`);
      fs.writeFileSync(path.join(root, 'docs/index.html'),
        `<title>Home</title><meta name="description" content="Home description">` +
        `<link rel="canonical" href="${origin}"><main><a href="${canonical}">Test</a></main>`);
      fs.writeFileSync(path.join(root, 'docs/page&lt;tag&gt;&next=2'),
        `<title>Test</title><meta name="description" content="Test description">` +
        `<link rel="canonical" href="${canonical.replaceAll('&amp;', '&#38;')}"><main>Test</main>`);
      const script = path.join(scripts, production ? 'check-production-search.mjs' : 'check-search.mjs');
      // Stub transport only; run the complete production checker against the same fixture.
      const input = `
        import fs from 'node:fs';
        globalThis.fetch = async (url) => {
          const pathname = new URL(url).pathname;
          const body = fs.readFileSync('docs/' + (pathname === '/' ? 'index.html' : pathname.slice(1)), 'utf8');
          const response = new Response(body, { headers: { 'content-type': pathname.endsWith('.xml') ? 'application/xml' : 'text/html' } });
          Object.defineProperty(response, 'url', { value: String(url) });
          return response;
        };
        await import(${JSON.stringify(pathToFileURL(script).href)});
      `;
      const result = spawnSync(process.execPath,
        production ? ['--input-type=module', '-', '--json'] : [script, '--json'],
        { cwd: root, input: production ? input : undefined, encoding: 'utf8', timeout: 10000 });
      assert.equal(result.status, 0, result.stderr || result.error?.message);
      const summary = JSON.parse(result.stdout);
      assert.equal(summary.contractVersion, 3);
      assert.equal(summary.pages, 2);
      assert.equal(summary.defects, 0);
      assert.equal(summary.infrastructure, 0);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
}

test('shared decoder preserves nested and invalid references', () => {
  for (const [input, expected] of [
    ['&amp;lt;tag&amp;gt;', '&lt;tag&gt;'],
    ['a=1&amp;b=2', 'a=1&b=2'],
    ['&lt;b&gt; &quot;q&quot; &apos;s&#39; &#x27;', `<b> "q" 's' '`],
    ['&#38;amp;', '&amp;'],
    ['\n https://example.com/ \n', 'https://example.com/'],
    ['&#0; &#xD800; &#1114112; &unknown;', '&#0; &#xD800; &#1114112; &unknown;'],
    ['&#x1F600; &#X41;', '😀 A'],
  ]) assert.equal(decode(input), expected, input);
});

test('sitemap structure rejects malformed and ambiguous entries', () => {
  for (const xml of [
    '<urlset><url><loc/></url></urlset>',
    '<urlset><url/></urlset>',
    '<urlset><url><loc>a</loc><loc>b</loc></url></urlset>',
    '<urlset><url><loc><b>a</b></loc></url></urlset>',
  ]) assert.ok(parseSitemap(xml).errors.length, xml);
  for (const xml of [
    '<urlset><url></urlset>', '<urlset>', '<urlset/><urlset/>',
    '<!DOCTYPE urlset [<!ENTITY x SYSTEM "file:///etc/passwd">]><urlset/>',
    '<urlset/><!-- unclosed',
  ]) assert.throws(() => parseSitemap(xml), undefined, xml);
  const parsed = parseSitemap('<?xml version="1.0"?><s:urlset xmlns:s="https://example.com/schema">' +
    '<!-- ignored --><s:url><s:loc><![CDATA[https://example.com/?a=1&b=2]]></s:loc></s:url></s:urlset>');
  assert.deepEqual(parsed.entries, [{ loc: 'https://example.com/?a=1&b=2', lastmod: '' }]);
});
