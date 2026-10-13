import test from 'node:test';
import assert from 'node:assert/strict';
import { createLazyProviderRuntimeV010 } from '../../dist/manager/lazy-provider-runtime.js';
import { createProviderLifecycleAdministrationV010 } from '../../dist/manager/provider-lifecycle-administration.js';
import { createMemoryProviderBindingAuditStoreV010, authenticateBootstrapAdministratorV010,
  authorizeProviderAdministrationV010 } from '../../dist/manager/provider-governance.js';

function setup({ policyAllowed = true, audit, slot } = {}) {
  const store = audit ?? createMemoryProviderBindingAuditStoreV010();
  const actions = [];
  let loads = 0, disposals = 0;
  const runtime = slot ?? createLazyProviderRuntimeV010({ isActive: () => true,
    async load() { loads++; return {}; }, dispose() { disposals++; } });
  const admin = createProviderLifecycleAdministrationV010({ entries: new Map([['test', runtime]]), audit: store,
    authorize(token, action, resource) {
      actions.push(action);
      return authorizeProviderAdministrationV010(authenticateBootstrapAdministratorV010(token, 'secret'), {
        providerId: 'policy', contractVersion: '0.1.0', async check() { return { allowed: policyAllowed, reasonCodes: ['policy'], policyProviderId: 'policy' }; }
      }, { action, resource });
    } });
  return { admin, runtime, store, actions, counts: () => ({ loads, disposals }) };
}

test('lifecycle reads require authentication and policy even for unknown packages; reads do not load', async () => {
  const f = setup();
  for (const token of [undefined, 'wrong']) {
    assert.equal((await f.admin.handle({ operation: 'read', token, packageId: 'unknown' })).status, 403);
  }
  assert.equal((await setup({ policyAllowed: false }).admin.handle({ operation: 'read', token: 'secret' })).status, 403);
  assert.equal((await f.admin.handle({ operation: 'read', token: 'secret', packageId: 'unknown' })).status, 404);
  const read = await f.admin.handle({ operation: 'read', token: 'secret' });
  assert.equal(read.status, 200);
  assert.equal(read.body.runtimes[0].phase, 'IDLE');
  assert.deepEqual(f.counts(), { loads: 0, disposals: 0 });
  assert.ok(!JSON.stringify(f.store.list()).includes('secret'));
});

test('retry cannot initiate stop on an idle or running provider', async () => {
  const f = setup();
  for (let i = 0; i < 2; i++) {
    const result = await f.admin.handle({ operation: 'retry-stop', token: 'secret', packageId: 'test' });
    assert.equal(result.status, 409);
    await f.runtime.run(async () => {});
  }
  assert.equal(f.counts().disposals, 0);
  assert.equal((await f.admin.handle({ operation: 'retry-stop', token: 'secret' })).status, 400);
  await f.runtime.stop();
});

test('failed cleanup is retryable through authorized API with result audit', async () => {
  let stops = 0;
  const slot = createLazyProviderRuntimeV010({ isActive: () => true, async load() { return {}; },
    dispose() { if (++stops === 1) throw Error('private failure'); } });
  await slot.run(async () => {});
  await assert.rejects(slot.stop());
  const f = setup({ slot });
  assert.equal((await f.admin.handle({ operation: 'retry-stop', packageId: 'test' })).status, 403);
  assert.equal(stops, 1);
  const result = await f.admin.handle({ operation: 'retry-stop', token: 'secret', packageId: 'test' });
  assert.equal(result.status, 200);
  assert.equal(result.body.phase, 'STOPPED');
  assert.equal(stops, 2);
  assert.ok(f.store.list().some(e => e.action === 'PROVIDER_STOP_RESULT' && e.packageId === 'test' && e.reason === 'PROVIDER_STOPPED'));
  assert.ok(f.actions.includes('provider.lifecycle.retry-stop'));
});

test('audit failure prevents retry; timeout retains blocked lease and reports 504 without leaking errors', async () => {
  let calls = 0;
  const slot = { diagnostics: () => ({ blocked: true, phase: 'STOP_TIMEOUT', cleanupPending: true }),
    async stop() { calls++; throw Error('PROVIDER_STOP_TIMEOUT'); } };
  const blocked = setup({ slot, audit: { append() { throw Error('audit unavailable'); } } });
  await assert.rejects(blocked.admin.handle({ operation: 'retry-stop', token: 'secret', packageId: 'test' }), /audit unavailable/);
  assert.equal(calls, 0);
  const f = setup({ slot });
  const result = await f.admin.handle({ operation: 'retry-stop', token: 'secret', packageId: 'test' });
  assert.equal(result.status, 504);
  assert.equal(result.body.blocked, true);
  slot.stop = async () => { throw Error('private database connection string'); };
  const failed = await f.admin.handle({ operation: 'retry-stop', token: 'secret', packageId: 'test' });
  assert.equal(failed.status, 500);
  assert.ok(!JSON.stringify(failed).includes('private'));
});
