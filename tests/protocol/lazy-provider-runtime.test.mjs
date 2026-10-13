import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createLazyProviderRuntimeV010 } from '../../dist/manager/lazy-provider-runtime.js';

const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

test('inactive provider does not load; concurrent calls share instance and stop permits fresh activation', async () => {
  let active = false, loads = 0, disposals = 0;
  const slot = createLazyProviderRuntimeV010({
    isActive: () => active, async load() { return { generation: ++loads }; },
    dispose() { disposals++; }
  });
  const use = runtime => Promise.resolve(runtime.generation);
  await assert.rejects(slot.run(use), /NOT_ACTIVE/);
  assert.equal(loads, 0);
  active = true;
  assert.deepEqual(await Promise.all([slot.run(use), slot.run(use)]), [1, 1]);
  active = false;
  await slot.stop();
  assert.equal(disposals, 1);
  await assert.rejects(slot.run(use), /NOT_ACTIVE/);
  active = true;
  assert.equal(await slot.run(use), 2);
  await slot.stop();
});

test('disable during loading prevents execution and disposes the late instance', async () => {
  const loading = deferred();
  let active = true, executed = 0, disposed = 0;
  const slot = createLazyProviderRuntimeV010({
    isActive: () => active, load: () => loading.promise,
    dispose() { disposed++; }
  });
  const call = slot.run(async () => { executed++; });
  const rejected = assert.rejects(call, /NOT_ACTIVE/);
  active = false;
  const stopping = slot.stop();
  active = true; // Immediate re-enable cannot bypass an unfinished stop.
  await assert.rejects(slot.run(async () => {}), /STOPPING/);
  loading.resolve({});
  await rejected;
  await stopping;
  assert.equal(executed, 0);
  assert.equal(disposed, 1);
});

test('stop drains accepted operations and rejects new work until disposal ends', async () => {
  const running = deferred(), entered = deferred(), disposal = deferred();
  let disposed = false;
  const slot = createLazyProviderRuntimeV010({
    isActive: () => true, async load() { return {}; },
    async dispose() { await disposal.promise; disposed = true; }
  });
  const call = slot.run(async () => { entered.resolve(); await running.promise; return 42; });
  await entered.promise;
  const stop = slot.stop();
  assert.equal(slot.stop(), stop);
  await assert.rejects(slot.run(async () => {}), /STOPPING/);
  assert.equal(disposed, false);
  running.resolve();
  assert.equal(await call, 42);
  await assert.rejects(slot.run(async () => {}), /STOPPING/);
  disposal.resolve();
  await stop;
  assert.equal(disposed, true);
});

test('loading failure retries; failed disposal blocks reuse until successful retry', async () => {
  let loads = 0, stops = 0;
  const slot = createLazyProviderRuntimeV010({
    isActive: () => true,
    async load() { if (++loads === 1) throw Error('load failed'); return {}; },
    dispose() { if (++stops === 1) throw Error('dispose failed'); }
  });
  await assert.rejects(slot.run(async () => true), /load failed/);
  assert.equal(await slot.run(async () => true), true);
  await assert.rejects(slot.stop(), /dispose failed/);
  await assert.rejects(slot.run(async () => true), /STOPPING/);
  await slot.stop();
  assert.equal(await slot.run(async () => true), true);
  assert.equal(loads, 3);
  await slot.stop();
});

test('real bottleneck analyzer remains usable through the lazy lease', async () => {
  let loads = 0;
  const slot = createLazyProviderRuntimeV010({ isActive: () => true, async load() {
    loads++;
    const module = await import('../../dist/providers/eog-bottleneck-analysis/runtime.js');
    return module.createEogBottleneckAnalysisProviderV020();
  }});
  assert.equal(loads, 0);
  const result = await slot.run(runtime => runtime.analyze({
    enterpriseId: 'test', graphId: 'empty', primaryFacts: [], comparisonFacts: [],
    timeLens: { primary: { startAt: '2026-10-01T00:00:00Z', endAt: '2026-10-02T00:00:00Z' } }
  }));
  assert.deepEqual(result, []);
  assert.equal(loads, 1);
  await slot.stop();
});

test('host binds the lazy facade and lifecycle stop rather than an eager analyzer', () => {
  const host = readFileSync('manager/server.ts', 'utf8');
  assert.doesNotMatch(host, /from\s+["']\.\.\/providers\/eog-bottleneck-analysis\/runtime\.js/);
  assert.match(host, /analyze: request => bottleneckRuntime\.run/);
  assert.match(host, /event\.packageId === EOG_BOTTLENECK_ANALYSIS_PACKAGE_ID[\s\S]*?bottleneckRuntime\.stop\(\)/);
});

test('drain timeout is observable, retains the lease and retries the same cleanup', async () => {
  const entered = deferred(), running = deferred();
  let disposals = 0, loads = 0;
  const slot = createLazyProviderRuntimeV010({ isActive: () => true, stopTimeoutMs: 20,
    async load() { loads++; return {}; }, dispose() { disposals++; } });
  assert.equal(slot.diagnostics().phase, 'IDLE');
  const call = slot.run(async () => { entered.resolve(); await running.promise; return 42; });
  await entered.promise;
  await assert.rejects(slot.stop(), /PROVIDER_STOP_TIMEOUT/);
  assert.deepEqual(slot.diagnostics(), { phase: 'STOP_TIMEOUT', activeCalls: 1,
    blocked: true, cleanupPending: true, stopAttempts: 1 });
  await assert.rejects(slot.run(async () => {}), /STOPPING/);
  assert.equal(disposals, 0);
  const retry = slot.stop();
  assert.equal(slot.stop(), retry);
  running.resolve();
  assert.equal(await call, 42);
  await retry;
  assert.equal(disposals, 1);
  assert.equal(slot.diagnostics().phase, 'STOPPED');
  assert.equal(slot.diagnostics().cleanupPending, false);
  await slot.run(async () => {});
  assert.equal(loads, 2);
  await slot.stop();
});

test('timed-out disposal may fail later; retry retains and disposes the same instance', async () => {
  const disposing = deferred(), entered = deferred();
  const instance = {};
  let disposals = 0;
  const slot = createLazyProviderRuntimeV010({ isActive: () => true, stopTimeoutMs: 20,
    async load() { return instance; }, async dispose(value) {
      assert.equal(value, instance);
      if (++disposals === 1) { entered.resolve(); await disposing.promise; throw Error('late failure'); }
    } });
  await slot.run(async () => {});
  const first = assert.rejects(slot.stop(), /TIMEOUT/);
  await entered.promise;
  await first;
  assert.equal(slot.diagnostics().phase, 'STOP_TIMEOUT');
  const observing = slot.stop();
  disposing.resolve();
  await assert.rejects(observing, /late failure/);
  assert.equal(slot.diagnostics().phase, 'STOP_FAILED');
  assert.equal(slot.diagnostics().blocked, true);
  assert.equal(slot.diagnostics().cleanupPending, false);
  await assert.rejects(slot.run(async () => {}), /STOPPING/);
  await slot.stop();
  assert.equal(disposals, 2);
  assert.equal(slot.diagnostics().phase, 'STOPPED');
});

test('load completion after timeout never executes the rejected operation', async () => {
  const loading = deferred();
  let executed = 0, disposed = 0;
  const slot = createLazyProviderRuntimeV010({ isActive: () => true, stopTimeoutMs: 20,
    load: () => loading.promise, dispose() { disposed++; } });
  const call = assert.rejects(slot.run(async () => { executed++; }), /STOPPING/);
  assert.equal(slot.diagnostics().phase, 'LOADING');
  await assert.rejects(slot.stop(), /TIMEOUT/);
  loading.resolve({});
  await call;
  await slot.stop();
  assert.equal(executed, 0);
  assert.equal(disposed, 1);
  assert.equal(slot.diagnostics().phase, 'STOPPED');
});

test('stop validates its timeout and immediately stopping an empty lease is safe', async () => {
  for (const stopTimeoutMs of [0, -1, NaN, Infinity, 1.5, 2_147_483_648]) {
    assert.throws(() => createLazyProviderRuntimeV010({ isActive: () => true,
      async load() { return {}; }, stopTimeoutMs }), /TIMEOUT_INVALID/);
  }
  const slot = createLazyProviderRuntimeV010({ isActive: () => true, async load() { return {}; } });
  await slot.stop();
  assert.deepEqual(slot.diagnostics(), { phase: 'STOPPED', activeCalls: 0,
    blocked: false, cleanupPending: false, stopAttempts: 1 });
  await slot.run(async () => {});
  assert.equal(slot.diagnostics().phase, 'READY');
  await slot.stop();
});
