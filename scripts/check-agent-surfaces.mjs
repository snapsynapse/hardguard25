import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const guideCopies = [
  'assistant-guide.txt',
  'docs/assistant-guide.txt',
  'docs/.well-known/assistant-guide.txt',
];

const guideProfile = 'human-verifiable-assistant-guide';
const guideProfileVersion = '0.7.1';
const maxGuideBytes = 8192;
const maxGuideLines = 400;
const maxGuideLineBytes = 120;

const asciiProfileFiles = [
  ...guideCopies,
  'docs/llms.txt',
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
