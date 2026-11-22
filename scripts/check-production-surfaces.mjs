import crypto from 'node:crypto';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

// Deployed agent-discovery and disclosure surfaces must be byte-identical to the tracked docs/ files.
// Exit 1 reports a defect (bytes differ); exit 2 reports infrastructure failure (nothing was established).
export const origin = 'https://hardguard25.com/';
export const surfacePaths = [
  'llms.txt', 'llm.txt', 'agents.json', 'ontology.json', 'relationships.yaml', 'robots.txt', 'sitemap.xml',
  '.well-known/assistant-guide.txt', '.well-known/assistant-guide.txt.sha256', '.well-known/security.txt',
  'assistant-guide.txt', 'assistant-guide.txt.sha256',
];
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

export async function checkProductionSurfaces(request = fetch, readTracked = path => fs.readFileSync(`docs/${path}`)) {
  const defects = [];
  const failures = [];
  for (const path of surfacePaths) {
    const url = new URL(path, origin);
    if (url.origin + '/' !== origin) throw new Error(`refusing non-canonical URL ${url}`);
    let response;
    try {
      response = await request(url.href, { redirect: 'error', signal: AbortSignal.timeout(15000), headers: { 'cache-control': 'no-cache' } });
    } catch (error) {
      failures.push(`${path}: ${error.message}`);
      continue;
    }
    if (response.status !== 200) {
      (response.status === 404 ? defects : failures).push(`${path}: HTTP ${response.status}`);
      continue;
    }
    const deployed = Buffer.from(await response.arrayBuffer());
    const tracked = readTracked(path);
    if (digest(deployed) !== digest(tracked)) defects.push(`${path}: deployed sha256 ${digest(deployed)} differs from tracked ${digest(tracked)}`);
  }
  return { checked: surfacePaths.length, defects, failures };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await checkProductionSurfaces();
  for (const line of [...result.defects, ...result.failures]) console.error(line);
  console.log(`production surfaces: ${result.checked} checked, ${result.defects.length} defects, ${result.failures.length} infrastructure failures`);
  process.exitCode = result.defects.length > 0 ? 1 : result.failures.length > 0 ? 2 : 0;
}
