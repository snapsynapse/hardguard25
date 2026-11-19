import { pathToFileURL } from 'node:url';

// Only an authoritative 404 is absence. Do not turn transport/auth errors into publication.
export async function assertNpmVersionAbsent(version, request = fetch) {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) throw new Error('Invalid release version');
  const response = await request(`https://registry.npmjs.org/hardguard25/${version}`, {
    redirect: 'error', signal: AbortSignal.timeout(15000), headers: { accept: 'application/json' },
  });
  if (response.status === 404) return;
  if (response.status === 200) {
    const body = await response.json();
    if (body.name !== 'hardguard25' || body.version !== version) throw new Error('Malformed npm version response');
    throw new Error(`hardguard25@${version} exists; reconcile artifact identity before retrying`);
  }
  throw new Error(`npm absence could not be established: HTTP ${response.status}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await assertNpmVersionAbsent(process.argv[2]); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
