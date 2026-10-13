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
