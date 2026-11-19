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

function skipSpace(cursor) {
  while (cursor.offset < cursor.xml.length && SPACE.test(cursor.xml[cursor.offset])) cursor.offset++;
}

function readName(cursor) {
  const start = cursor.offset;
  while (cursor.offset < cursor.xml.length) {
    const char = String.fromCodePoint(cursor.xml.codePointAt(cursor.offset));
    if (char !== ':' && !NAME_CHAR.test(char)) break;
    cursor.offset += char.length;
  }
  const result = cursor.xml.slice(start, cursor.offset);
  const parts = result.split(':');
  if (parts.length > 2 || parts.some(part => !part || !NAME_START.test(String.fromCodePoint(part.codePointAt(0))))) {
    throw new Error('invalid XML qualified name');
  }
  return result;
}

function readAttribute(cursor, attributes) {
  const name = readName(cursor);
  if (attributes.has(name)) throw new Error('duplicate XML attribute');
  if (attributes.size >= MAX_ATTRIBUTES) throw new Error('XML element exceeds 512 attributes');
  skipSpace(cursor);
  if (cursor.xml[cursor.offset++] !== '=') throw new Error('missing XML attribute equals');
  skipSpace(cursor);
  const quote = cursor.xml[cursor.offset++];
  if (quote !== '"' && quote !== "'") throw new Error('unquoted XML attribute');
  const end = cursor.xml.indexOf(quote, cursor.offset);
  if (end < 0 || cursor.xml.slice(cursor.offset, end).includes('<')) throw new Error('invalid XML attribute');
  // Literal XML attribute whitespace is normalized before reference decoding.
  const value = xmlText(cursor.xml.slice(cursor.offset, end).replace(/[\t\n]/g, ' '), true);
  cursor.offset = end + 1;
  return [name, value];
}

function readOpeningTag(cursor) {
  cursor.offset++;
  const name = readName(cursor);
  const attributes = new Map();
  while (true) {
    const before = cursor.offset;
    skipSpace(cursor);
    if (cursor.xml.startsWith('/>', cursor.offset)) {
      cursor.offset += 2;
      return { kind: 'open', name, attributes, selfClosing: true };
    }
    if (cursor.xml[cursor.offset] === '>') {
      cursor.offset++;
      return { kind: 'open', name, attributes, selfClosing: false };
    }
    if (before === cursor.offset || cursor.offset >= cursor.xml.length) throw new Error('malformed XML attributes');
    const [attribute, value] = readAttribute(cursor, attributes);
    attributes.set(attribute, value);
  }
}

function readClosingTag(cursor) {
  cursor.offset += 2;
  const name = readName(cursor);
  skipSpace(cursor);
  if (cursor.xml[cursor.offset++] !== '>') throw new Error('mismatched closing tag');
  return { kind: 'close', name };
}

function skipComment(cursor) {
  const end = cursor.xml.indexOf('-->', cursor.offset + 4);
  if (end < 0) throw new Error('unclosed XML comment');
  const content = cursor.xml.slice(cursor.offset + 4, end);
  if (content.includes('--') || content.endsWith('-')) throw new Error('invalid XML comment');
  cursor.offset = end + 3;
}

function readCDATA(cursor) {
  const end = cursor.xml.indexOf(']]>', cursor.offset + 9);
  if (end < 0) throw new Error('unclosed CDATA');
  const value = cursor.xml.slice(cursor.offset + 9, end);
  cursor.offset = end + 3;
  return { kind: 'text', value, cdata: true };
}

const XML_DECLARATION = /^xml[ \t\n]+version[ \t\n]*=[ \t\n]*(?:"1\.0"|'1\.0')(?:[ \t\n]+encoding[ \t\n]*=[ \t\n]*(?:"[A-Za-z][A-Za-z0-9._-]*"|'[A-Za-z][A-Za-z0-9._-]*'))?(?:[ \t\n]+standalone[ \t\n]*=[ \t\n]*(?:"(?:yes|no)"|'(?:yes|no)'))?[ \t\n]*$/;

function skipProcessingInstruction(cursor) {
  const start = cursor.offset;
  const end = cursor.xml.indexOf('?>', start + 2);
  if (end < 0) throw new Error('unclosed processing instruction');
  cursor.offset += 2;
  const target = readName(cursor);
  if (target.toLowerCase() === 'xml') {
    if (target !== 'xml' || start !== cursor.declarationOffset || !XML_DECLARATION.test(cursor.xml.slice(start + 2, end))) {
      throw new Error('invalid or misplaced XML declaration');
    }
  } else if (cursor.offset !== end && !SPACE.test(cursor.xml[cursor.offset])) {
    throw new Error('invalid processing instruction');
  }
  cursor.offset = end + 2;
}

function readText(cursor) {
  const next = cursor.xml.indexOf('<', cursor.offset);
  const end = next < 0 ? cursor.xml.length : next;
  const raw = cursor.xml.slice(cursor.offset, end);
  cursor.offset = end;
  return { kind: 'text', raw, value: xmlText(raw), cdata: false };
}

// Tokens are consumed one at a time; no second document-sized token array is built.
function* xmlTokens(xml) {
  const offset = xml.startsWith('\uFEFF') ? 1 : 0;
  const cursor = { xml, offset, declarationOffset: offset };
  while (cursor.offset < xml.length) {
    if (xml.startsWith('<!--', cursor.offset)) skipComment(cursor);
    else if (xml.startsWith('<![CDATA[', cursor.offset)) yield readCDATA(cursor);
    else if (xml.startsWith('<?', cursor.offset)) skipProcessingInstruction(cursor);
    else if (xml.startsWith('</', cursor.offset)) yield readClosingTag(cursor);
    else if (xml.startsWith('<!', cursor.offset)) throw new Error('DTD and declarations are unsupported');
    else if (xml[cursor.offset] === '<') yield readOpeningTag(cursor);
    else yield readText(cursor);
  }
}

function resolveNamespace(qname, namespaces, attribute = false) {
  const parts = qname.split(':');
  if (parts.length === 1) return attribute ? '' : namespaces[''] || '';
  if (parts[0] === 'xmlns' || !namespaces[parts[0]]) throw new Error('undeclared XML namespace prefix');
  return namespaces[parts[0]];
}

function isNamespaceDeclaration(attribute) {
  return attribute === 'xmlns' || attribute.startsWith('xmlns:');
}

function elementNamespaces(parentNamespaces, attributes) {
  const namespaces = Object.create(parentNamespaces);
  for (const [attribute, value] of attributes) {
    if (!isNamespaceDeclaration(attribute)) continue;
    const prefix = attribute === 'xmlns' ? '' : attribute.slice(6);
    if (prefix === 'xmlns' || value === XMLNS_NAMESPACE || (prefix === 'xml') !== (value === XML_NAMESPACE)
      || (prefix && !value)) throw new Error('invalid XML namespace binding');
    namespaces[prefix] = value;
  }
  return namespaces;
}

function checkExpandedAttributes(attributes, namespaces) {
  const expandedAttributes = new Set();
  for (const attribute of attributes.keys()) {
    if (isNamespaceDeclaration(attribute)) continue;
    const expanded = `${resolveNamespace(attribute, namespaces, true)}\u0000${attribute.split(':').at(-1)}`;
    if (expandedAttributes.has(expanded)) throw new Error('duplicate expanded XML attribute');
    expandedAttributes.add(expanded);
  }
}

function appendElement(state, token) {
  const { stack, document } = state;
  const parent = stack.at(-1);
  if (stack.length > 128) throw new Error('sitemap nesting exceeds 128 levels');
  if (++state.nodes > MAX_SITEMAP_NODES) throw new Error('sitemap exceeds 500000 XML nodes');
  if (stack.length === 1 && document.children.length) throw new Error('multiple XML roots');
  const namespaces = elementNamespaces(parent.namespaces, token.attributes);
  checkExpandedAttributes(token.attributes, namespaces);
  const node = { name: token.name, local: token.name.split(':').at(-1), namespace: resolveNamespace(token.name, namespaces), namespaces, children: [], text: '' };
  if (stack.length === 2 && ['urlset', 'sitemapindex'].includes(parent.local)) {
    if (++state.rootEntries > 50000) throw new Error('sitemap exceeds 50000 entries');
  }
  parent.children.push(node);
  if (!token.selfClosing) stack.push(node);
}

function appendText(stack, token) {
  if (stack.length === 1) {
    if (token.cdata) throw new Error('CDATA outside root');
    if (/[^ \t\n]/.test(token.raw)) throw new Error('text outside root');
  }
  stack.at(-1).text += token.value;
}

// No DTD or external entities. Structural limits apply before entries are extracted.
function buildDocument(xml) {
  const namespaces = Object.assign(Object.create(null), { xml: XML_NAMESPACE });
  const document = { name: '', children: [], text: '', namespaces };
  const state = { document, stack: [document], nodes: 0, rootEntries: 0 };
  for (const token of xmlTokens(xml)) {
    if (token.kind === 'open') appendElement(state, token);
    else if (token.kind === 'text') appendText(state.stack, token);
    else {
      if (state.stack.length === 1 || token.name !== state.stack.at(-1).name) throw new Error('mismatched closing tag');
      state.stack.pop();
    }
  }
  if (state.stack.length !== 1 || document.children.length !== 1) throw new Error('incomplete sitemap XML');
  return document.children[0];
}

function extractEntry(node, root, entryName, errors) {
  if (node.local !== entryName || node.namespace !== root.namespace) {
    errors.push(`unexpected ${node.name} entry`);
    return null;
  }
  if (node.text.trim()) errors.push(`unexpected text in ${entryName}`);
  const fields = name => node.children.filter(child => child.local === name && child.namespace === root.namespace);
  const locations = fields('loc');
  if (locations.length !== 1 || locations[0].children.length || !locations[0].text.trim()) {
    errors.push(`${entryName} must contain exactly one nonempty text loc`);
    return null;
  }
  const lastmods = fields('lastmod');
  if (lastmods.length > 1 || lastmods.some(node => node.children.length)) errors.push(`${entryName} has ambiguous lastmod`);
  return { loc: locations[0].text.trim(), lastmod: lastmods[0]?.text.trim() || '' };
}

function extractSitemap(root) {
  const kind = root.local;
  if (!['urlset', 'sitemapindex'].includes(kind)) throw new Error('expected urlset or sitemapindex root');
  const entryName = kind === 'urlset' ? 'url' : 'sitemap';
  const entries = [];
  const errors = [];
  if (root.text.trim()) errors.push('unexpected text in sitemap root');
  for (const node of root.children) {
    const entry = extractEntry(node, root, entryName, errors);
    if (entry) entries.push(entry);
  }
  if (!entries.length && !errors.length) errors.push('sitemap contains no entries');
  return { kind, entries, errors };
}

export function parseSitemap(input) {
  if (typeof input !== 'string') throw new Error('sitemap XML must be text');
  if (Buffer.byteLength(input) > MAX_SITEMAP_BYTES) throw new Error('sitemap exceeds 50 MiB');
  for (const char of input) if (!xmlCharacter(char.codePointAt(0))) throw new Error('invalid XML character');
  return extractSitemap(buildDocument(input.replace(/\r\n?/g, '\n')));
}
