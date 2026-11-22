import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { compareSettings } from './check-repository-settings.mjs';

const declared = JSON.parse(fs.readFileSync('.github/repository-settings.json', 'utf8'));
const live = {
  repository: {
    default_branch: 'main', visibility: 'public', delete_branch_on_merge: true, allow_auto_merge: false,
    has_wiki: false, has_discussions: true, has_projects: false,
    security_and_analysis: { secret_scanning: { status: 'enabled' }, secret_scanning_push_protection: { status: 'enabled' }, dependabot_security_updates: { status: 'enabled' } },
  },
  actions: { allowed_actions: 'all', sha_pinning_required: false },
  workflow: { default_workflow_permissions: 'read', can_approve_pull_request_reviews: false },
  rulesets: [{ name: 'Protect the default maintenance branch', target: 'branch', enforcement: 'active' }],
  environments: [{ name: 'github-pages' }, { name: 'pypi' }],
};

test('declared settings match a faithful live snapshot', () => {
  assert.deepEqual(compareSettings(declared, live), []);
});

test('each drift is reported by field', () => {
  const drifted = structuredClone(live);
  drifted.repository.allow_auto_merge = true;
  drifted.actions.sha_pinning_required = true;
  drifted.rulesets.push({ name: 'Protect release tags', target: 'tag', enforcement: 'active' });
  assert.deepEqual(compareSettings(declared, drifted).map(d => d.field).sort(), ['actions.sha_pinning_required', 'merge_methods.auto_merge', 'rulesets']);
});

test('unreadable sections are skipped rather than reported as drift', () => {
  assert.deepEqual(compareSettings(declared, { ...live, actions: null, workflow: null }), []);
});
