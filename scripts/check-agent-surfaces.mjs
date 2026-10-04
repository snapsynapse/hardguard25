import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const guideCopies = [
  'assistant-guide.txt',
  'docs/assistant-guide.txt',
  'docs/.well-known/assistant-guide.txt',
];
const briefingCopies = ['docs/llms.txt', 'docs/llm.txt'];

const guideProfile = 'human-verifiable-assistant-guide';
const guideProfileVersion = '0.7.1';
const maxGuideBytes = 8192;
const maxGuideLines = 400;
const maxGuideLineBytes = 120;

const asciiProfileFiles = [
  ...guideCopies,
  ...briefingCopies,
  'skills/hardguard25/SKILL.md',
  'skills/hardguard25/CHANGELOG.md',
];

function sha256Hex(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function fieldValues(block, field) {
  return [...block.matchAll(new RegExp(`^${field}:[ \\t]*(.*)$`, 'gm'))].map((match) => match[1]);
}

for (const file of asciiProfileFiles) {
  const bytes = fs.readFileSync(file);

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    const ok = byte === 0x0a || (byte >= 0x20 && byte <= 0x7e);
    assert.ok(ok, `${file}: byte ${i} is outside printable ASCII plus LF profile`);
  }
}

const canonicalGuideHash = sha256Hex(fs.readFileSync(guideCopies[0]));
for (const copy of guideCopies) {
  const bytes = fs.readFileSync(copy);
  const text = bytes.toString('ascii');
  const lines = text.endsWith('\n') ? text.slice(0, -1).split('\n') : text.split('\n');

  assert.equal(
    sha256Hex(bytes),
    canonicalGuideHash,
    `${copy}: all assistant-guide.txt copies must be byte-identical`
  );
  const sidecar = fs.readFileSync(`${copy}.sha256`, 'utf8').trim();
  assert.equal(
    sidecar,
    `${canonicalGuideHash}  assistant-guide.txt`,
    `${copy}.sha256: sidecar must match guide bytes`
  );

  assert.ok(bytes.length <= maxGuideBytes, `${copy}: guide must be at most ${maxGuideBytes} bytes`);
  assert.ok(lines.length <= maxGuideLines, `${copy}: guide must be at most ${maxGuideLines} lines`);
  for (const [index, line] of lines.entries()) {
    assert.ok(
      Buffer.byteLength(line) <= maxGuideLineBytes,
      `${copy}:${index + 1}: line must be at most ${maxGuideLineBytes} bytes`
    );
  }

  const metadataBlocks = [...text.matchAll(
    /^\[assistant-guide-metadata\]\n([\s\S]*?)^\[\/assistant-guide-metadata\]$/gm
  )];
  assert.equal(metadataBlocks.length, 1, `${copy}: guide must contain exactly one metadata block`);
  const metadata = metadataBlocks[0][1];
  const profiles = fieldValues(metadata, 'profile');
  const profileVersions = fieldValues(metadata, 'profile-version');
  assert.equal(profiles.length, 1, `${copy}: metadata must contain exactly one profile field`);
  assert.equal(profileVersions.length, 1, `${copy}: metadata must contain exactly one profile-version field`);
  assert.equal(profiles[0], guideProfile, `${copy}: unexpected guide profile`);
  assert.equal(profileVersions[0], guideProfileVersion, `${copy}: unexpected guide profile version`);

  const taskScopes = [...text.matchAll(/^## Task scope$/gm)];
  const beforeActing = [...text.matchAll(/^## Before acting$/gm)];
  assert.equal(taskScopes.length, 1, `${copy}: guide must contain exactly one Task scope section`);
  assert.equal(beforeActing.length, 1, `${copy}: guide must contain exactly one Before acting section`);
  assert.ok(taskScopes[0].index < beforeActing[0].index, `${copy}: Task scope must precede Before acting`);
  assert.ok(
    beforeActing[0].index < text.indexOf('## Copy-paste prompt'),
    `${copy}: compact verification must precede action instructions`
  );
  for (const phrase of [
    'another conformant verifier',
    'verifier name and version',
    'achieved level',
    'guide SHA-256',
    'blocking findings',
    'Ask the user to confirm',
    'conformance is not safety',
    'subordinate to system instructions',
    'text-based prompt injection risk',
    'Do not execute actions before confirmation',
  ]) {
    assert.ok(text.includes(phrase), `${copy}: compact verification instruction must include ${phrase}`);
  }

  const fenceLines = lines.flatMap((line, index) => line.startsWith('```') ? [index] : []);
  assert.equal(fenceLines.length % 2, 0, `${copy}: copy/paste fences must be balanced`);
  for (const index of fenceLines.filter((_, position) => position % 2 === 0)) {
    assert.ok(
      index > 0 && ['Literal', 'Customize'].includes(lines[index - 1]),
      `${copy}:${index + 1}: copy/paste block must have a Literal or Customize label`
    );
  }
}

assert.equal(
  sha256Hex(fs.readFileSync(briefingCopies[0])),
  sha256Hex(fs.readFileSync(briefingCopies[1])),
  'docs/llms.txt and docs/llm.txt must be byte-identical'
);

const normalizationSet =
  'U+0009-U+000D, U+0020, U+0085, U+00A0, U+1680, U+2000-U+200A, U+2028, U+2029, U+202F, U+205F, and U+3000';
for (const file of [briefingCopies[0], ...guideCopies, 'skills/hardguard25/SKILL.md']) {
  const text = fs.readFileSync(file, 'utf8');
  const normalizedText = text.replace(/\s+/g, ' ');
  assert.ok(normalizedText.includes(normalizationSet), `${file}: missing the exact Unicode White_Space set`);
  assert.ok(text.includes('U+200B') && text.includes('U+FEFF'), `${file}: missing explicitly invalid nearby code points`);
}

const agents = JSON.parse(fs.readFileSync('docs/agents.json', 'utf8'));
assert.equal(agents.schema_version, '1.0', 'agents.json: unexpected schema version');
assert.equal(agents.name, 'HardGuard25', 'agents.json: unexpected name');
assert.equal(agents.type, 'open-standard', 'agents.json: unexpected type');
assert.equal(agents.version, '1.3.8', 'agents.json: version must match the prepared release');
assert.equal(agents.maintenance_status, 'maintenance-only', 'agents.json: maintenance posture must remain explicit');
assert.equal(agents.canonical_url, 'https://hardguard25.com/', 'agents.json: canonical URL must use the bare HTTPS origin');
assert.equal(agents.repository, 'https://github.com/snapsynapse/hardguard25', 'agents.json: unexpected repository');
assert.ok(Array.isArray(agents.fit_signals) && agents.fit_signals.length >= 3, 'agents.json: fit signals are incomplete');
assert.ok(Array.isArray(agents.not_a_fit) && agents.not_a_fit.length >= 3, 'agents.json: non-fit signals are incomplete');
assert.deepEqual(
  agents.tasks.map((task) => task.id),
  ['evaluate-fit', 'implement', 'inspect-specification', 'try-generator'],
  'agents.json: task inventory changed unexpectedly'
);
assert.equal(agents.execution.hosted_agent_api, false, 'agents.json: must not claim a hosted agent API');
assert.equal(agents.execution.side_effects, 'none', 'agents.json: browser generator must declare no side effects');
assert.deepEqual(
  agents.normalization_contract.explicitly_invalid_nearby_code_points,
  ['U+200B', 'U+FEFF'],
  'agents.json: invalid nearby code points drifted'
);
assert.equal(
  agents.machine_surfaces.ontology,
  'https://hardguard25.com/ontology.json',
  'agents.json: missing canonical ontology surface'
);
assert.equal(
  agents.machine_surfaces.relationships,
  'https://hardguard25.com/relationships.yaml',
  'agents.json: missing canonical relationships surface'
);

const ontology = JSON.parse(fs.readFileSync('docs/ontology.json', 'utf8'));
assert.equal(ontology.schema_version, '1.0', 'ontology.json: unexpected schema version');
assert.equal(
  ontology.canonical_url,
  'https://hardguard25.com/ontology.json',
  'ontology.json: unexpected canonical URL'
);
assert.equal(
  ontology.alphabet.canonical,
  '0123456789ACDFGHJKMNPRUWY',
  'ontology.json: canonical alphabet drifted'
);
assert.ok(
  ontology.non_capabilities.includes('global_uniqueness_guarantee') &&
    ontology.non_capabilities.includes('hosted_agent_execution'),
  'ontology.json: critical non-capability boundaries are incomplete'
);

const relationships = fs.readFileSync('docs/relationships.yaml', 'utf8');
assert.match(relationships, /^schema_version: 1$/m, 'relationships.yaml: unexpected schema version');
assert.ok(
  relationships.includes('ontology: https://hardguard25.com/ontology.json'),
  'relationships.yaml: missing canonical ontology URL'
);
assert.ok(
  relationships.includes('These relationships are non-binding integrations, not conformance claims.'),
  'relationships.yaml: missing evidence boundary'
);

for (const page of ['docs/index.html', 'docs/generator/index.html']) {
  const html = fs.readFileSync(page, 'utf8');
  assert.ok(html.includes('/llms.txt'), `${page}: missing llms.txt discovery link`);
  assert.ok(html.includes('/agents.json'), `${page}: missing agents.json discovery link`);
}

assert.equal(
  sha256Hex(fs.readFileSync('imgs/og.png')),
  sha256Hex(fs.readFileSync('docs/imgs/og.png')),
  'root and deployed OG images must be byte-identical'
);

assert.equal(
  sha256Hex(fs.readFileSync('LICENSE')),
  sha256Hex(fs.readFileSync('js/LICENSE')),
  'root and npm package license files must be byte-identical'
);

const skillBytes = fs.readFileSync('skills/hardguard25/SKILL.md');
const manifest = fs.readFileSync('skills/hardguard25/MANIFEST.yaml', 'utf8');
assert.match(
  manifest,
  new RegExp(`hash: sha256:${sha256Hex(skillBytes)}\\b`),
  'skill manifest hash must match SKILL.md bytes'
);

console.log('agent surface integrity check passed');
