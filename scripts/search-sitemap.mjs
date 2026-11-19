// Shared, bounded XML 1.0 sitemap parsing for repository and production checks.
export const MAX_SITEMAP_BYTES = 50 * 1024 * 1024;
export const MAX_SITEMAP_NODES = 500000;
const MAX_ATTRIBUTES = 512;
const XML_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace';
const XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/';
const NAME_START = /[A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u{10000}-\u{EFFFF}]/u;
const NAME_CHAR = /[A-Z_a-z0-9.\-\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0300-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u{10000}-\u{EFFFF}]/u;
const SPACE = /[ \t\n]/;

export function decode(value) {
  return String(value ?? '').replace(/&(?:(amp|lt|gt|quot|apos)|#(\d+)|#[xX]([0-9a-fA-F]+));/g, (entity, name, decimal, hex) => {
    if (name) return XML_ENTITIES[name];
    const code = decimal ? Number(decimal) : parseInt(hex, 16);
    return code > 0 && code <= 0x10ffff && (code < 0xd800 || code > 0xdfff) ? String.fromCodePoint(code) : entity;
  }).trim();
}

function xmlCharacter(code) {
  return code === 9 || code === 10 || code === 13 || (code >= 0x20 && code <= 0xd7ff)
    || (code >= 0xe000 && code <= 0xfffd) || (code >= 0x10000 && code <= 0x10ffff);
}

// XML decoding is strict and never trims individual text segments. CDATA bypasses it.
function xmlText(value, attribute = false) {
  if (!attribute && value.includes(']]>')) throw new Error('CDATA terminator outside CDATA');
  return value.replace(/&[^;]*;|&/g, entity => {
    if (Object.hasOwn(XML_ENTITIES, entity.slice(1, -1))) return XML_ENTITIES[entity.slice(1, -1)];
    const numeric = entity.match(/^&#(?:(\d+)|x([0-9a-fA-F]+));$/);
    if (!numeric) throw new Error('invalid or undeclared XML entity');
    const code = numeric[1] ? Number(numeric[1]) : parseInt(numeric[2], 16);
    if (!xmlCharacter(code)) throw new Error('invalid XML character reference');
    return String.fromCodePoint(code);
  });
}

// No DTD or external entities. Limits apply while building, before extracting entries.
export function parseSitemap(input) {
  if (typeof input !== 'string') throw new Error('sitemap XML must be text');
  if (Buffer.byteLength(input) > MAX_SITEMAP_BYTES) throw new Error('sitemap exceeds 50 MiB');
  for (const char of input) if (!xmlCharacter(char.codePointAt(0))) throw new Error('invalid XML character');
  const xml = input.replace(/\r\n?/g, '\n');
  const document = { name: '', children: [], text: '', namespaces: Object.assign(Object.create(null), { xml: XML_NAMESPACE }) };
  const stack = [document];
  let offset = xml.startsWith('\uFEFF') ? 1 : 0;
  const declarationOffset = offset;
  let nodes = 0;
  let rootEntries = 0;
  const space = () => { while (offset < xml.length && SPACE.test(xml[offset])) offset++; };
  function name() {
    const start = offset;
    while (offset < xml.length) {
      const char = String.fromCodePoint(xml.codePointAt(offset));
      if (char !== ':' && !NAME_CHAR.test(char)) break;
      offset += char.length;
    }
    const result = xml.slice(start, offset);
    const parts = result.split(':');
    if (parts.length > 2 || parts.some(part => !part || !NAME_START.test(String.fromCodePoint(part.codePointAt(0))))) {
      throw new Error('invalid XML qualified name');
    }
    return result;
  }
  function namespace(qname, namespaces, attribute = false) {
    const parts = qname.split(':');
    if (parts.length === 1) return attribute ? '' : namespaces[''] || '';
    if (parts[0] === 'xmlns' || !namespaces[parts[0]]) throw new Error('undeclared XML namespace prefix');
    return namespaces[parts[0]];
  }
  while (offset < xml.length) {
    const parent = stack.at(-1);
    if (xml.startsWith('<!--', offset)) {
      const end = xml.indexOf('-->', offset + 4);
      if (end < 0) throw new Error('unclosed XML comment');
      const content = xml.slice(offset + 4, end);
      if (content.includes('--') || content.endsWith('-')) throw new Error('invalid XML comment');
      offset = end + 3;
    } else if (xml.startsWith('<![CDATA[', offset)) {
      if (stack.length === 1) throw new Error('CDATA outside root');
      const end = xml.indexOf(']]>', offset + 9);
      if (end < 0) throw new Error('unclosed CDATA');
      parent.text += xml.slice(offset + 9, end);
      offset = end + 3;
    } else if (xml.startsWith('<?', offset)) {
      const start = offset;
      const end = xml.indexOf('?>', offset + 2);
      if (end < 0) throw new Error('unclosed processing instruction');
      offset += 2;
      const target = name();
      if (target.toLowerCase() === 'xml') {
        if (target !== 'xml' || start !== declarationOffset || !/^xml[ \t\n]+version[ \t\n]*=[ \t\n]*(?:"1\.0"|'1\.0')(?:[ \t\n]+encoding[ \t\n]*=[ \t\n]*(?:"[A-Za-z][A-Za-z0-9._-]*"|'[A-Za-z][A-Za-z0-9._-]*'))?(?:[ \t\n]+standalone[ \t\n]*=[ \t\n]*(?:"(?:yes|no)"|'(?:yes|no)'))?[ \t\n]*$/.test(xml.slice(start + 2, end))) {
          throw new Error('invalid or misplaced XML declaration');
        }
      } else if (offset !== end && !SPACE.test(xml[offset])) throw new Error('invalid processing instruction');
      offset = end + 2;
    } else if (xml.startsWith('</', offset)) {
      offset += 2;
      const closing = name();
      space();
      if (xml[offset++] !== '>' || stack.length === 1 || closing !== parent.name) throw new Error('mismatched closing tag');
      stack.pop();
    } else if (xml[offset] === '<') {
      if (xml[offset + 1] === '!') throw new Error('DTD and declarations are unsupported');
      offset++;
      const opening = name();
      const attributes = new Map();
      let selfClosing = false;
      while (true) {
        const before = offset;
        space();
        if (xml.startsWith('/>', offset)) { selfClosing = true; offset += 2; break; }
        if (xml[offset] === '>') { offset++; break; }
        if (before === offset || offset >= xml.length) throw new Error('malformed XML attributes');
        const attribute = name();
        if (attributes.has(attribute)) throw new Error('duplicate XML attribute');
        if (attributes.size >= MAX_ATTRIBUTES) throw new Error('XML element exceeds 512 attributes');
        space();
        if (xml[offset++] !== '=') throw new Error('missing XML attribute equals');
        space();
        const quote = xml[offset++];
        if (quote !== '"' && quote !== "'") throw new Error('unquoted XML attribute');
        const end = xml.indexOf(quote, offset);
        if (end < 0 || xml.slice(offset, end).includes('<')) throw new Error('invalid XML attribute');
        // Literal XML attribute whitespace is normalized before reference decoding.
        attributes.set(attribute, xmlText(xml.slice(offset, end).replace(/[\t\n]/g, ' '), true));
        offset = end + 1;
      }
      if (stack.length > 128) throw new Error('sitemap nesting exceeds 128 levels');
      if (++nodes > MAX_SITEMAP_NODES) throw new Error('sitemap exceeds 500000 XML nodes');
      if (stack.length === 1 && document.children.length) throw new Error('multiple XML roots');
      const namespaces = Object.create(parent.namespaces);
      for (const [attribute, value] of attributes) {
        if (attribute !== 'xmlns' && !attribute.startsWith('xmlns:')) continue;
        const prefix = attribute === 'xmlns' ? '' : attribute.slice(6);
        if (prefix === 'xmlns' || value === XMLNS_NAMESPACE || (prefix === 'xml') !== (value === XML_NAMESPACE)
          || (prefix && !value)) throw new Error('invalid XML namespace binding');
        namespaces[prefix] = value;
      }
      const expandedAttributes = new Set();
      for (const attribute of attributes.keys()) {
        if (attribute === 'xmlns' || attribute.startsWith('xmlns:')) continue;
        const expanded = `${namespace(attribute, namespaces, true)}\u0000${attribute.split(':').at(-1)}`;
        if (expandedAttributes.has(expanded)) throw new Error('duplicate expanded XML attribute');
        expandedAttributes.add(expanded);
      }
      const node = { name: opening, local: opening.split(':').at(-1), namespace: namespace(opening, namespaces), namespaces, children: [], text: '' };
      if (stack.length === 2 && ['urlset', 'sitemapindex'].includes(parent.local)) {
        if (++rootEntries > 50000) throw new Error('sitemap exceeds 50000 entries');
      }
      parent.children.push(node);
      if (!selfClosing) stack.push(node);
    } else {
      const end = xml.indexOf('<', offset);
      const raw = xml.slice(offset, end < 0 ? xml.length : end);
      if (stack.length === 1 && /[^ \t\n]/.test(raw)) throw new Error('text outside root');
      const text = xmlText(raw);
      parent.text += text;
      offset = end < 0 ? xml.length : end;
    }
  }
  if (stack.length !== 1 || document.children.length !== 1) throw new Error('incomplete sitemap XML');
  const root = document.children[0];
  const kind = root.local;
  if (!['urlset', 'sitemapindex'].includes(kind)) throw new Error('expected urlset or sitemapindex root');
  const entryName = kind === 'urlset' ? 'url' : 'sitemap';
  const entries = [];
  const errors = [];
  if (root.text.trim()) errors.push('unexpected text in sitemap root');
  for (const node of root.children) {
    if (node.local !== entryName || node.namespace !== root.namespace) { errors.push(`unexpected ${node.name} entry`); continue; }
    if (node.text.trim()) errors.push(`unexpected text in ${entryName}`);
    const locations = node.children.filter(child => child.local === 'loc' && child.namespace === root.namespace);
    if (locations.length !== 1 || locations[0].children.length || !locations[0].text.trim()) {
      errors.push(`${entryName} must contain exactly one nonempty text loc`);
      continue;
    }
    const lastmods = node.children.filter(child => child.local === 'lastmod' && child.namespace === root.namespace);
    if (lastmods.length > 1 || lastmods.some(node => node.children.length)) errors.push(`${entryName} has ambiguous lastmod`);
    entries.push({ loc: locations[0].text.trim(), lastmod: lastmods[0]?.text.trim() || '' });
  }
  if (!entries.length && !errors.length) errors.push('sitemap contains no entries');
  return { kind, entries, errors };
}
