import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const allowedWwwHosts = new Set([
  'w3.org',
  'sitemaps.org',
]);
const allowedExactUrls = new Set([
  'http://www.sitemaps.org/schemas/sitemap/0.9',
]);

const trackedFiles = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean);

const findings = [];

for (const file of trackedFiles) {
  const ext = path.extname(file);
  if (!['.md', '.txt', '.html', '.xml', '.json', '.yml', '.yaml'].includes(ext)) continue;

  const text = fs.readFileSync(file, 'utf8');
  const urls = text.match(/https?:\/\/[^\s"'<>)]*/g) || [];

  for (const rawUrl of urls) {
    const url = rawUrl.replace(/[.,;]+$/, '');

    if (allowedExactUrls.has(url)) {
      continue;
    }

    if (url.startsWith('http://')) {
      findings.push(`${file}: uses http URL ${url}`);
      continue;
    }

    if (url.includes('snapsynapse.github.io/hardguard25')) {
      findings.push(`${file}: uses stale GitHub Pages URL ${url}`);
    }

    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      findings.push(`${file}: invalid URL ${url}`);
      continue;
    }

    if (parsed.hostname.startsWith('www.')) {
      const bareHost = parsed.hostname.slice(4);
      if (!allowedWwwHosts.has(bareHost)) {
        findings.push(`${file}: use bare domain instead of www in ${url}`);
      }
    }
  }
}

assert.deepEqual(findings, [], findings.join('\n'));
console.log('URL convention check passed');
