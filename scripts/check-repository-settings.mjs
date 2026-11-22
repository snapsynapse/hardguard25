import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// Read-only comparison of live GitHub repository settings against .github/repository-settings.json.
// Not part of npm run verify: it needs gh authentication and network. Run it during the quarterly review
// and after any owner change to repository settings, then update the declaration or the repository.
export function compareSettings(declared, live) {
  const differences = [];
  const check = (field, expected, actual) => {
    if (JSON.stringify(expected) !== JSON.stringify(actual)) differences.push({ field, expected, actual });
  };
  check('default_branch', declared.default_branch, live.repository.default_branch);
  check('visibility', declared.visibility, live.repository.visibility);
  check('delete_branch_on_merge', declared.delete_branch_on_merge, live.repository.delete_branch_on_merge);
  check('merge_methods.auto_merge', declared.merge_methods.auto_merge, live.repository.allow_auto_merge);
  check('features.wiki', declared.features.wiki, live.repository.has_wiki);
  check('features.discussions', declared.features.discussions, live.repository.has_discussions);
  check('features.projects', declared.features.projects, live.repository.has_projects);
  const security = live.repository.security_and_analysis || {};
  for (const [field, key] of [['secret_scanning', 'secret_scanning'], ['secret_scanning_push_protection', 'secret_scanning_push_protection'], ['dependabot_security_updates', 'dependabot_security_updates']]) {
    if (security[key]) check(`security.${field}`, declared.security[field], security[key].status === 'enabled');
  }
  if (live.actions) {
    check('actions.allowed_actions', declared.actions.allowed_actions, live.actions.allowed_actions);
    check('actions.sha_pinning_required', declared.actions.sha_pinning_required, live.actions.sha_pinning_required);
  }
  if (live.workflow) {
    check('actions.default_workflow_permissions', declared.actions.default_workflow_permissions, live.workflow.default_workflow_permissions);
    check('actions.can_approve_pull_request_reviews', declared.actions.can_approve_pull_request_reviews, live.workflow.can_approve_pull_request_reviews);
  }
  check('rulesets', declared.rulesets.map(r => [r.name, r.target, r.enforcement]).sort(), live.rulesets.map(r => [r.name, r.target, r.enforcement]).sort());
  check('environments', declared.environments.map(e => e.name).sort(), live.environments.map(e => e.name).sort());
  return differences;
}

function api(path) {
  try {
    return JSON.parse(execFileSync('gh', ['api', path], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch {
    return null; // 403 for token scope or missing permission: report as unverified, not as drift
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const declared = JSON.parse(fs.readFileSync('.github/repository-settings.json', 'utf8'));
  assert.match(declared.repository, /^[\w.-]+\/[\w.-]+$/);
  const base = `repos/${declared.repository}`;
  const repository = api(base);
  assert.ok(repository, 'could not read the repository through gh; authenticate first');
  const live = {
    repository,
    actions: api(`${base}/actions/permissions`),
    workflow: api(`${base}/actions/permissions/workflow`),
    rulesets: api(`${base}/rulesets`) || [],
    environments: (api(`${base}/environments`) || { environments: [] }).environments,
  };
  const unverified = ['actions', 'workflow'].filter(key => live[key] === null);
  const differences = compareSettings(declared, live);
  for (const difference of differences) console.error(`drift ${difference.field}: declared ${JSON.stringify(difference.expected)}, live ${JSON.stringify(difference.actual)}`);
  if (unverified.length) console.error(`unverified (gh token lacks scope): ${unverified.join(', ')}`);
  console.log(`repository settings: ${differences.length} differences, ${unverified.length} unverified sections`);
  process.exitCode = differences.length > 0 ? 1 : 0;
}
