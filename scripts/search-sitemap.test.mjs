import assert from 'node:assert/strict';
import test from 'node:test';
import { decode, parseSitemap, MAX_SITEMAP_BYTES, MAX_SITEMAP_NODES } from './search-sitemap.mjs';

const entry = text => `<url><loc>${text}</loc></url>`;
const document = text => `<urlset>${entry(text)}</urlset>`;
const location = 'https://example.com/?a=1&b=2';

test('strict XML preserves text boundaries and accepts quote-aware attributes', () => {
  for (const [xml, expected] of [
    [document('https://example.com/a <!-- gap -->b'), 'https://example.com/a b'],
    [document('https://example.com/a<![CDATA[ b]]>c'), 'https://example.com/a bc'],
    [document('  https://example.com/a<?split ignored?> b  '), 'https://example.com/a b'],
    ['<urlset note="a > b" literal="]]>" other=\'x > y\'>' + entry('https://example.com/') + '</urlset>', 'https://example.com/'],
    [document('<![CDATA[https://example.com/?a=1&b=2]]>'), location],
    [document('https://example.com/?a=1&amp;b=2'), location],
    [document('https://example.com/?a=1&#38;b=2'), location],
    [document('https://example.com/?a=1&#x26;b=2'), location],
    [document('https://example.com/&amp;lt;'), 'https://example.com/&lt;'],
    [document('https://example.com/&#x1F600;'), 'https://example.com/😀'],
    ['\uFEFF<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + document('https://example.com/'), 'https://example.com/'],
  ]) {
    const parsed = parseSitemap(xml);
    assert.deepEqual(parsed.errors, []);
    assert.equal(parsed.entries[0].loc, expected, xml);
  }
  assert.equal(decode('&#0; &#xD800; &unknown;'), '&#0; &#xD800; &unknown;', 'permissive public decoder retains its contract');
});

test('namespace resolution supports inheritance, extension fields and Unicode names', () => {
  for (const xml of [
    '<s:urlset xmlns:s="urn:sitemap"><s:url><s:loc>https://example.com/</s:loc></s:url></s:urlset>',
    '<urlset xmlns="urn:sitemap"><url><loc>https://example.com/</loc><image xmlns="urn:extension"/></url></urlset>',
    '<ñ:urlset xmlns:ñ="urn:sitemap" 中文="valid"><ñ:url><ñ:loc>https://example.com/</ñ:loc></ñ:url></ñ:urlset>',
    '<__proto__:urlset xmlns:__proto__="urn:sitemap"><__proto__:url><__proto__:loc>https://example.com/</__proto__:loc></__proto__:url></__proto__:urlset>',
  ]) assert.deepEqual(parseSitemap(xml).entries, [{ loc: 'https://example.com/', lastmod: '' }]);
  assert.ok(parseSitemap('<urlset xmlns="urn:sitemap"><url><loc xmlns="urn:other">https://example.com/</loc></url></urlset>').errors.length);
});

test('malformed entity, namespace, declaration and lexical near misses fail closed', () => {
  for (const xml of [
    document('https://example.com/?a=1&b=2'), document('https://example.com/&bogus;'),
    document('https://example.com/&#0;'), document('https://example.com/&#xD800;'),
    document('https://example.com/&#1114112;'), document('https://example.com/&#xFFFE;'),
    document('https://example.com/&#X26;'), document('https://example.com/]]>'),
    document('https://example.com/\u0000'), document('https://example.com/\uD800'),
    document('https://example.com/\uFFFE'), document('https://example.com/<'),
    '<urlset attr="1" attr="2">' + entry('https://example.com/') + '</urlset>',
    '<urlset xmlns:a="urn:x" xmlns:b="urn:x" a:x="1" b:x="2">' + entry('https://example.com/') + '</urlset>',
    '<urlset note="one"next="two"/>', '<urlset note=unquoted/>', '<urlset note="raw <"/>',
    '<constructor:urlset/>', '<toString:urlset/>', '<__proto__:urlset/>',
    '<s:urlset xmlns:t="urn:sitemap"/>', '<urlset xmlns:s=""/>',
    '<urlset xmlns:xmlns="urn:x"/>', '<urlset xmlns:xml="urn:wrong"/>',
    '<urlset><!-- invalid -- inside -->' + entry('https://example.com/') + '</urlset>',
    '<urlset><!-- invalid end --->' + entry('https://example.com/') + '</urlset>',
    '<urlset><!-- unclosed', '<urlset><![CDATA[unclosed', '<urlset><?unclosed',
    '<?xml malformed?>' + document('https://example.com/'),
    '<?XML version="1.0"?>' + document('https://example.com/'),
    ' <?xml version="1.0"?>' + document('https://example.com/'),
    '<?xml version="1.1"?>' + document('https://example.com/'),
    '<?xml version="1.0"?><?xml version="1.0"?>' + document('https://example.com/'),
    '<!DOCTYPE urlset [<!ENTITY x SYSTEM "file:///private">]>' + document('&x;'),
    '<urlset><url><loc>https://example.com/</url></loc></urlset>',
    '<urlset/><urlset/>', 'trailing' + document('https://example.com/'),
    '&#32;' + document('https://example.com/'), document('https://example.com/') + '&#10;',
  ]) assert.throws(() => parseSitemap(xml), undefined, JSON.stringify(xml));
});

test('deterministic XML serialization corpus preserves semantic text under comments and CDATA', () => {
  let seed = 0x25c0ffee;
  const next = limit => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % limit;
  };
  const escape = text => [...text].map(char => {
    if (char === '&') return ['&amp;', '&#38;', '&#x26;'][next(3)];
    if (char === '<') return '&lt;';
    if (char === '>') return '&gt;';
    if (char === '"') return '&quot;';
    if (char === "'") return '&apos;';
    return char;
  }).join('');
  for (let index = 0; index < 128; index++) {
    const expected = `https://example.com/${index}?a=<tag>&b="q"&c='s'&d=😀`;
    const chars = [...expected];
    let serialized = '';
    for (let start = 0; start < chars.length;) {
      const width = 1 + next(8);
      const segment = chars.slice(start, start + width).join('');
      serialized += next(2) ? escape(segment) : `<![CDATA[${segment}]]>`;
      serialized += next(2) ? '<!-- split -->' : '<?split ignored?>';
      start += width;
    }
    const prefix = ['s', 'map', 'ñ'][next(3)];
    const xml = `<?xml version="1.0"?><${prefix}:urlset xmlns:${prefix}="urn:sitemap" note="left > right">` +
      `<${prefix}:url><${prefix}:loc> \n${serialized}\n </${prefix}:loc></${prefix}:url></${prefix}:urlset>`;
    assert.equal(parseSitemap(xml).entries[0].loc, expected, `corpus ${index}`);
    assert.throws(() => parseSitemap(xml.replace('note="left > right"', 'note="left > right" note="duplicate"')), undefined, `near miss ${index}`);
  }
});

test('structural ambiguities are errors and parser bounds apply during construction', () => {
  for (const xml of [
    '<urlset>unexpected' + entry('https://example.com/') + '</urlset>',
    '<urlset><url>unexpected<loc>https://example.com/</loc></url></urlset>',
    '<urlset><url><loc>https://example.com/</loc><lastmod>a</lastmod><lastmod>b</lastmod></url></urlset>',
    '<urlset><url><loc>https://example.com/</loc><lastmod><b>a</b></lastmod></url></urlset>',
  ]) assert.ok(parseSitemap(xml).errors.length);
  assert.doesNotThrow(() => parseSitemap('<urlset>' + '<n>'.repeat(127) + '</n>'.repeat(127) + '</urlset>'));
  assert.throws(() => parseSitemap('<urlset>' + '<n>'.repeat(128) + '</n>'.repeat(128) + '</urlset>'), /nesting/);
  assert.throws(() => parseSitemap(' '.repeat(MAX_SITEMAP_BYTES + 1)), /50 MiB/);
  assert.throws(() => parseSitemap('<urlset ' + Array.from({ length: 513 }, (_, n) => `a${n}="x"`).join(' ') + '/>'), /512 attributes/);
  assert.throws(() => parseSitemap('<urlset>' + '<url/>'.repeat(50001) + '</urlset>'), /50000 entries/);
  assert.throws(() => parseSitemap('<urlset><url>' + '<n/>'.repeat(MAX_SITEMAP_NODES) + '</url></urlset>'), /500000 XML nodes/);
});
