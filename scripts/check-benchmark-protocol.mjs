import assert from 'node:assert/strict';
import fs from 'node:fs';

const protocol = fs.readFileSync('docs/HUMAN_FACTORS_BENCHMARK_PROTOCOL.md', 'utf8');
const hardGuardBits = Math.log2(25);
const pairs = [8, 12, 16, 20, 22].map((crockfordLength) => ({
  crockfordLength,
  hardGuardLength: Math.ceil((crockfordLength * 5) / hardGuardBits),
}));

for (const { crockfordLength, hardGuardLength } of pairs) {
  assert.ok(
    protocol.includes(`| ${crockfordLength} | ${hardGuardLength} |`),
    `protocol missing matched-entropy pair ${crockfordLength}/${hardGuardLength}`
  );
}

for (const heading of [
  '## Status and claim boundary',
  '## Research questions',
  '## Comparison design',
  '## Reproducibility requirements',
  '## Result schema',
  '## Analysis plan',
  '## Participant safeguards',
  '## Pilot decision gate',
]) {
  assert.ok(protocol.includes(heading), `protocol missing ${heading}`);
}

assert.ok(protocol.includes('No pilot has been run'), 'protocol must state that no pilot has been run');
console.log('human-factors benchmark protocol check passed');
