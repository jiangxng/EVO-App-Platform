import test from 'node:test';
import assert from 'node:assert/strict';
import { createLedgerRuntimeConfiguratorResolver, createLedgerRuntimeConfiguratorActionHandler } from '../../dist/apps/ledger-runtime-configurator/action-handler.js';
import { createLedgerRuntimeConfiguratorCapabilityActionHandlers } from '../../dist/apps/ledger-runtime-configurator/capability-action-handlers.js';
import { createLedgerRuntimeConfiguratorService } from '../../dist/apps/ledger-runtime-configurator/service.js';
import { createAppActionRouter } from '../../dist/actions/router.js';
const request = code => ({ contractVersion: '0.1.0', type: 'command', command: { code, inputVersion: '0.1.0' }, values: {}, sourceInteractionId: 'lazy-test', actionId: 'test', requiresConfirmation: false });
function fixture() {
  let active = false, loads = 0, creates = 0;
  const resolve = createLedgerRuntimeConfiguratorResolver({ isActive: () => active,
    loadFactory: async () => { loads++; return () => { creates++; return createLedgerRuntimeConfiguratorService(); }; } });
  const handlers = [createLedgerRuntimeConfiguratorActionHandler(resolve), ...createLedgerRuntimeConfiguratorCapabilityActionHandlers(resolve)];
  return { resolve, handlers, enable: value => { active = value; }, counts: () => ({ loads, creates }) };
}

test('inactive and authorization-denied actions never load the compatibility service', async () => {
  const f = fixture();
  const inactive = createAppActionRouter(f.handlers, () => false);
  for (const h of f.handlers) assert.equal((await inactive.execute(request(h.commandCode))).error.code, 'ACTION_FEATURE_NOT_ACTIVE');
  await assert.rejects(f.resolve(), /NOT_ACTIVE/);
  f.enable(true);
  const denied = createAppActionRouter(f.handlers, () => true, () => ({ ok: false, error: { code: 'TEST_DENIED', message: 'denied' } }));
  for (const h of f.handlers) assert.equal((await denied.execute(request(h.commandCode))).error.code, 'TEST_DENIED');
  assert.deepEqual(f.counts(), { loads: 0, creates: 0 });
});

test('concurrent first callers share the original service and preserve state across disable/re-enable', async () => {
  const f = fixture(); f.enable(true);
  assert.deepEqual(f.counts(), { loads: 0, creates: 0 });
  const [first, second] = await Promise.all([f.resolve(), f.resolve()]);
  assert.equal(first, second);
  const changed = first.getCurrent(); changed.configurationId = 'preserved-compatibility-draft';
  assert.equal(first.importConfiguration(changed).ok, true);
  const before = first.exportTemplate();
  const router = createAppActionRouter(f.handlers, () => true);
  assert.equal((await router.execute(request(f.handlers[0].commandCode))).ok, true);
  assert.equal((await router.execute(request(f.handlers[1].commandCode))).ok, true);
  assert.deepEqual((await f.resolve()).exportTemplate(), before);
  f.enable(false); await assert.rejects(f.resolve(), /NOT_ACTIVE/);
  f.enable(true); assert.equal(await f.resolve(), first);
  assert.equal((await f.resolve()).getCurrent().configurationId, changed.configurationId);
  assert.deepEqual(f.counts(), { loads: 1, creates: 1 });
});

test('disable during import prevents late construction; reactivation can retry', async () => {
  let active = true, release, creates = 0, loads = 0;
  const wait = new Promise(resolve => { release = resolve; });
  const resolve = createLedgerRuntimeConfiguratorResolver({ isActive: () => active, loadFactory: async () => {
    loads++; await wait; return () => { creates++; return createLedgerRuntimeConfiguratorService(); };
  } });
  const one = resolve(), two = resolve();
  active = false; release();
  const results = await Promise.allSettled([one, two]);
  assert.ok(results.every(r => r.status === 'rejected' && /NOT_ACTIVE/.test(r.reason.message)));
  assert.equal(creates, 0);
  active = true; assert.ok(await resolve()); assert.equal(creates, 1); assert.equal(loads, 2);
});

test('import and constructor failure do not poison later first use', async () => {
  let attempts = 0;
  const resolve = createLedgerRuntimeConfiguratorResolver({ isActive: () => true, loadFactory: async () => {
    attempts++;
    if (attempts === 1) throw new Error('import failed');
    return () => { if (attempts === 2) throw new Error('construction failed'); return createLedgerRuntimeConfiguratorService(); };
  } });
  await assert.rejects(resolve(), /import failed/);
  await assert.rejects(resolve(), /construction failed/);
  const service = await resolve(); assert.equal(await resolve(), service); assert.equal(attempts, 3);
});

test('invalid capability requests do not initialize the service', async () => {
  const f = fixture(); f.enable(true);
  for (const h of f.handlers.slice(1)) {
    const bad = request(h.commandCode); bad.command.inputVersion = 'unsupported';
    assert.equal((await h.execute(bad)).ok, false);
  }
  assert.equal((await f.handlers[2].execute(request(f.handlers[2].commandCode))).ok, false);
  assert.deepEqual(f.counts(), { loads: 0, creates: 0 });
});
