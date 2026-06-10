import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const guideCopies = [
  'assistant-guide.txt',
  'docs/assistant-guide.txt',
  'docs/.well-known/assistant-guide.txt',
];

const asciiProfileFiles = [
  ...guideCopies,
  'docs/llms.txt',
  'skills/hardguard25/SKILL.md',
  'skills/hardguard25/CHANGELOG.md',
];

function sha256Hex(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
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
  assert.equal(
    sha256Hex(fs.readFileSync(copy)),
    canonicalGuideHash,
    `${copy}: all assistant-guide.txt copies must be byte-identical`
  );
  const sidecar = fs.readFileSync(`${copy}.sha256`, 'utf8').trim();
  assert.equal(
    sidecar,
    `${canonicalGuideHash}  assistant-guide.txt`,
    `${copy}.sha256: sidecar must match guide bytes`
  );
}

const skillBytes = fs.readFileSync('skills/hardguard25/SKILL.md');
const manifest = fs.readFileSync('skills/hardguard25/MANIFEST.yaml', 'utf8');
assert.match(
  manifest,
  new RegExp(`hash: sha256:${sha256Hex(skillBytes)}\\b`),
  'skill manifest hash must match SKILL.md bytes'
);

console.log('agent surface integrity check passed');
