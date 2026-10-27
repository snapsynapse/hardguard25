import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// A peeled annotated tag identifies its commit; a lightweight tag identifies it directly.
export function checkGoReleaseTag(refs, tag, expectedCommit) {
  if (!/^go\/v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(tag) || !/^[0-9a-f]{40}$/.test(expectedCommit)) {
    throw new Error('Expected a Go version tag and full Git commit SHA');
  }
  const ref = `refs/tags/${tag}`;
  const entries = new Map();
  for (const line of refs.trim().split('\n').filter(Boolean)) {
    const match = line.match(/^([0-9a-f]{40})\s+(\S+)$/);
    if (!match || ![ref, `${ref}^{}`].includes(match[2]) || entries.has(match[2])) {
      throw new Error('Unexpected remote tag response');
    }
    entries.set(match[2], match[1]);
  }
  if (entries.size === 0) return 'missing';
  const observed = entries.get(`${ref}^{}`) ?? entries.get(ref);
  if (!entries.has(ref) || observed !== expectedCommit) {
    throw new Error(`${tag} already exists at a different commit; reconcile before publication`);
  }
  return 'matching';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [tag, expectedCommit] = process.argv.slice(2);
  try {
    // Validate before passing ref arguments to Git.
    checkGoReleaseTag('', tag, expectedCommit);
    const refs = execFileSync('git', ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`, `refs/tags/${tag}^{}`], {
      encoding: 'utf8',
    });
    console.log(checkGoReleaseTag(refs, tag, expectedCommit));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
