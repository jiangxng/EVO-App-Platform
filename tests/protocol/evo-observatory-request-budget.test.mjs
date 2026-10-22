import test from 'node:test';
import assert from 'node:assert/strict';
import {createEvoRuntimeObservatoryProviderV020 as create, createEvoRuntimeObservatoryHealthProbeV010 as health} from '../../dist/providers/evo-runtime-observatory/runtime.js';
import {createProviderRuntimeRegistry} from '../../dist/providers/runtime-registry.js';
import {createMemoryProviderBindingStoreV010} from '../../dist/manager/provider-resolution.js';
import {createEnterpriseOperatingGraphObservatoryProviderResolverV020} from '../../dist/manager/enterprise-operating-graph-observatory-provider.js';
import {EOG_RUNTIME_FACT_PROVIDER_CAPABILITY_V020 as capability} from '../../dist/contracts/enterprise-operating-graph-observatory-runtime.js';

const request = () => ({contractVersion: '0.2.0', enterpriseId: 'host', graphId: 'graph',
  window: {startAt: '2026-10-21T00:00:00Z', endAt: '2026-10-22T00:00:00Z'},
  semanticTargets: [
    {target: {kind: 'NODE', nodeId: 'ledger'}, node: {nodeId: 'ledger', kind: 'LEDGER',
      semanticRef: {authority: 'EVO', kind: 'LEDGER_DEFINITION', refId: 'ledger:stock'}}},
    {target: {kind: 'NODE', nodeId: 'app'}, node: {nodeId: 'app', kind: 'APPLICATION',
      semanticRef: {authority: 'HOST', kind: 'APPLICATION', refId: 'host-app'}}}
  ], metricCodes: ['event.count', 'sop.transition.count']});
const options = fetchImpl => ({baseUrl: 'https://evo.invalid/', resolveEnterpriseCode: () => 'code',
  resolveApplicationId: () => 'runtime-app', fetchImpl});
const bodyFor = url => String(url).includes('/enterprises/') ? {id: 'evo-enterprise'}
  : String(url).includes('/runtime-traces/') ? {traces: []} : {observations: []};
function clock(t) {
  const timers = new Set(), delays = [];
  t.mock.method(globalThis, 'setTimeout', (callback, delay) => {const timer = {callback}; timers.add(timer); delays.push(delay); return timer;});
  t.mock.method(globalThis, 'clearTimeout', timer => assert.equal(timers.delete(timer), true));
  return {timers, delays, expire: timer => (timer ?? [...timers][0]).callback()};
}
function deferred() {let resolve; const promise = new Promise(r => {resolve = r;}); return {promise, resolve};}
function aborted(signal) {
  signal.throwIfAborted();
  return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), {once: true}));
}

test('EVO factories and passive registration create no deadline or network; invalid budgets fail before use', t => {
  const c = clock(t); let calls = 0;
  const config = options(async () => {calls++; throw Error('unexpected-fetch');});
  const registry = createProviderRuntimeRegistry(); registry.register('evo.runtime-observatory', create(config));
  registry.setHealthProbe('evo.runtime-observatory', health(config));
  assert.equal(registry.has('evo.runtime-observatory'), true); assert.equal(c.timers.size, 0); assert.equal(calls, 0);
  for (const timeoutMs of [0, -1, 0.5, NaN, Infinity, 2147483648]) {
    assert.throws(() => create({...config, timeoutMs}), /EVO_OBSERVATORY_TIMEOUT_INVALID/);
    assert.throws(() => health({...config, timeoutMs}), /EVO_OBSERVATORY_TIMEOUT_INVALID/);
  }
  assert.equal(c.timers.size, 0);
});

test('missing enterprise mapping rejects before creating a timer or request', async t => {
  const c = clock(t); let calls = 0;
  const runtime = create({...options(async () => {calls++;}), resolveEnterpriseCode: () => undefined});
  await assert.rejects(runtime.query(request()), /EVO_OBSERVATORY_ENTERPRISE_MAPPING_REQUIRED/);
  assert.equal(calls, 0); assert.equal(c.timers.size, 0);
});

for (const [stage, expectedCalls] of [['enterprise', 1], ['observations', 2], ['traces', 4]]) {
  for (const phase of ['headers', 'body']) test(`EVO ${stage} ${phase} timeout aborts the whole query, releases it and allows explicit recovery`, async t => {
    const c = clock(t), entered = deferred(); const calls = []; let block = true;
    const runtime = create(options(async (url, init) => {
      const name = String(url).includes('/enterprises/') ? 'enterprise' : String(url).includes('/runtime-traces/') ? 'traces' : 'observations';
      calls.push({url: String(url), signal: init.signal}); assert.ok(init.signal instanceof AbortSignal);
      if (block && stage === name) {
        if (phase === 'headers') {entered.resolve(); return aborted(init.signal);}
        return {ok: true, json() {entered.resolve(); return aborted(init.signal);}};
      }
      return new Response(JSON.stringify(bodyFor(url)));
    }));
    const pending = runtime.query(request()); await entered.promise;
    assert.equal(calls.length, expectedCalls); assert.equal(c.timers.size, 1); assert.deepEqual(c.delays, [8000]);
    const rejected = assert.rejects(pending, /EVO_OBSERVATORY_REQUEST_TIMEOUT/); c.expire(); await rejected;
    assert.equal(c.timers.size, 0); assert.ok(calls.every(call => call.signal === calls[0].signal && call.signal.aborted));
    const oldCalls = calls.length; block = false; assert.deepEqual(await runtime.query(request()), []);
    assert.equal(calls.length, oldCalls + 4, 'no implicit replay; a fresh explicit call executes each stage once');
    assert.deepEqual(c.delays, [8000, 8000]); assert.equal(c.timers.size, 0);
    assert.notEqual(calls[oldCalls].signal, calls[0].signal);
  });
}

test('all targets and trace reads share one total query budget and release it on success', async t => {
  const c = clock(t), signals = [];
  const runtime = create({...options(async (url, init) => {signals.push(init.signal); assert.equal(c.timers.size, 1); return new Response(JSON.stringify(bodyFor(url)));}), timeoutMs: 1234});
  assert.deepEqual(await runtime.query(request()), []);
  assert.equal(signals.length, 4); assert.ok(signals.every(signal => signal === signals[0] && signal.aborted));
  assert.deepEqual(c.delays, [1234]); assert.equal(c.timers.size, 0);
});

for (const failure of ['network', 'http', 'json', 'invalid-observation']) test(`EVO ${failure} preserves failure semantics, cleans resources and recovers`, async t => {
  const c = clock(t); let fail = true, calls = 0, signal;
  const runtime = create(options(async (url, init) => {
    calls++; signal = init.signal;
    if (fail && !String(url).includes('/enterprises/')) {
      if (failure === 'network') throw Error('synthetic-network');
      if (failure === 'http') return new Response(JSON.stringify({error: {code: 'SYNTHETIC_REMOTE_REJECTION'}}), {status: 503});
      if (failure === 'json') return new Response('{invalid-json');
      return new Response(JSON.stringify({observations: [{}]}));
    }
    return new Response(JSON.stringify(bodyFor(url)));
  }));
  const expected = failure === 'network' ? /synthetic-network/ : failure === 'http' ? /SYNTHETIC_REMOTE_REJECTION/
    : failure === 'invalid-observation' ? /EVO_OBSERVATORY_OBSERVATION_INVALID/ : SyntaxError;
  await assert.rejects(runtime.query(request()), expected);
  assert.equal(calls, 2); assert.equal(signal.aborted, true); assert.equal(c.timers.size, 0);
  fail = false; assert.deepEqual(await runtime.query(request()), []); assert.equal(calls, 6); assert.equal(c.timers.size, 0);
});

test('late body completion after deadline is rejected before another stage or facts are returned', async t => {
  const c = clock(t), entered = deferred(), body = deferred(); let calls = 0, signal;
  const runtime = create(options(async (_url, init) => {calls++; signal = init.signal; return {ok: true, json() {entered.resolve(); return body.promise;}};}));
  const pending = runtime.query(request()); await entered.promise; c.expire(); assert.equal(signal.aborted, true);
  const rejected = assert.rejects(pending, /EVO_OBSERVATORY_REQUEST_TIMEOUT/); body.resolve({id: 'late-id'}); await rejected;
  assert.equal(calls, 1); assert.equal(c.timers.size, 0);
});

test('two concurrent queries and an explicit probe have independent controllers and deadlines', async t => {
  const c = clock(t), entered = deferred(), responses = [];
  const fetchImpl = async (url, init) => {
    if (!String(url).includes('/enterprises/') && !String(url).endsWith('/health/ready')) return new Response(JSON.stringify(bodyFor(url)));
    const response = deferred(); responses.push({response, signal: init.signal});
    if (responses.length === 3) entered.resolve();
    return Promise.race([response.promise, aborted(init.signal)]);
  };
  const runtime = create(options(fetchImpl)), probe = health(options(fetchImpl));
  const first = runtime.query(request()), second = runtime.query(request()), third = probe(); await entered.promise;
  assert.equal(c.timers.size, 3); assert.equal(new Set(responses.map(x => x.signal)).size, 3);
  const rejected = assert.rejects(first, /EVO_OBSERVATORY_REQUEST_TIMEOUT/); c.expire([...c.timers][0]); await rejected;
  assert.equal(responses[1].signal.aborted, false); assert.equal(responses[2].signal.aborted, false); assert.equal(c.timers.size, 2);
  responses[1].response.resolve(new Response(JSON.stringify({id: 'evo-enterprise'}))); assert.deepEqual(await second, []);
  responses[2].response.resolve(new Response('{}')); assert.equal((await third).state, 'HEALTHY'); assert.equal(c.timers.size, 0);
});

test('readiness header timeout reports UNAVAILABLE, releases timer and next explicit probe recovers', async t => {
  const c = clock(t), entered = deferred(); let block = true, calls = 0, signal;
  const probe = health({...options(async (_url, init) => {calls++; signal = init.signal; if (block) {entered.resolve(); return aborted(signal);} return new Response('{}');}), timeoutMs: 1500});
  const pending = probe(); await entered.promise; c.expire();
  assert.deepEqual(await pending, {state: 'UNAVAILABLE', message: 'EVO_OBSERVATORY_REQUEST_TIMEOUT'});
  assert.equal(signal.aborted, true); assert.equal(c.timers.size, 0); assert.equal(calls, 1);
  block = false; assert.equal((await probe()).state, 'HEALTHY'); assert.equal(calls, 2); assert.deepEqual(c.delays, [1500, 1500]);
});

for (const status of [200, 503]) test(`readiness HTTP ${status} uses status only and aborts unread body`, async t => {
  const c = clock(t); let signal, abortedBody = 0, parsed = 0;
  const probe = health(options(async (_url, init) => {
    signal = init.signal; signal.addEventListener('abort', () => abortedBody++, {once: true});
    return {ok: status === 200, status, json() {parsed++; throw Error('readiness-has-no-body-contract');}};
  }));
  const result = await probe(); assert.equal(result.state, status === 200 ? 'HEALTHY' : 'UNAVAILABLE');
  if (status === 503) assert.match(result.message, /HTTP 503/);
  assert.equal(signal.aborted, true); assert.equal(abortedBody, 1); assert.equal(parsed, 0); assert.equal(c.timers.size, 0);
});

test('effective selection stops new admission; already admitted query owns its finite deadline and original runtime can recover', async t => {
  const c = clock(t), entered = deferred(); let block = true, signal;
  const runtime = create(options(async (url, init) => {
    signal = init.signal;
    if (block) {entered.resolve(); return aborted(signal);}
    return new Response(JSON.stringify(bodyFor(url)));
  }));
  const registry = createProviderRuntimeRegistry(); registry.register(runtime.providerId, runtime);
  let effective = [{providerId: runtime.providerId, capability}];
  const resolver = createEnterpriseOperatingGraphObservatoryProviderResolverV020({registry,
    manager: {listEffectiveServiceProviders: () => effective}, bindings: createMemoryProviderBindingStoreV010()});
  const admitted = resolver.resolveRuntime('host'); assert.equal(admitted, runtime);
  const pending = admitted.query(request()); await entered.promise;
  effective = []; assert.equal(resolver.hasRuntimeCandidate(), false); assert.equal(resolver.resolveRuntime('host'), undefined);
  assert.throws(() => resolver.createService({enterpriseId: 'host', graphService: {}}), /EOG_RUNTIME_PROVIDER_REQUIRED/);
  assert.equal(signal.aborted, false, 'public contract does not promise lifecycle cancellation of an existing query');
  const rejected = assert.rejects(pending, /EVO_OBSERVATORY_REQUEST_TIMEOUT/); c.expire(); await rejected;
  assert.equal(c.timers.size, 0);
  effective = [{providerId: runtime.providerId, capability}]; block = false;
  assert.equal(resolver.resolveRuntime('host'), runtime); assert.deepEqual(await runtime.query(request()), []);
});

test('explicit registry probe publishes timeout health and restores health on the next explicit success', async t => {
  const c = clock(t), entered = deferred(); let block = true;
  const registry = createProviderRuntimeRegistry(), config = options(async (_url, init) => {
    if (block) {entered.resolve(); return aborted(init.signal);} return new Response('{}');
  });
  const runtime = create(config); registry.register(runtime.providerId, runtime); registry.setHealthProbe(runtime.providerId, health(config));
  assert.equal(registry.getHealth(runtime.providerId).state, 'UNKNOWN');
  const pending = registry.runHealthProbe(runtime.providerId); await entered.promise; c.expire();
  assert.equal((await pending).state, 'UNAVAILABLE'); assert.match(registry.getHealth(runtime.providerId).message, /EVO_OBSERVATORY_REQUEST_TIMEOUT/);
  assert.equal(c.timers.size, 0); block = false;
  assert.equal((await registry.runHealthProbe(runtime.providerId)).state, 'HEALTHY');
  assert.equal(registry.getHealth(runtime.providerId).state, 'HEALTHY'); assert.equal(c.timers.size, 0);
});
