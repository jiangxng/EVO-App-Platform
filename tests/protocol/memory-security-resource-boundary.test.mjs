import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createRemoteContextMemorySemanticRetrieverV010, createRemoteContextMemorySemanticHealthProbeV010} from '../../dist/providers/context-memory-semantic/runtime.js';
import {createRemoteContextMemoryDlpClassifierV010, createRemoteContextMemoryDlpHealthProbeV010} from '../../dist/providers/context-memory-dlp/runtime.js';
import {createExperienceCompilerMemoryIntakeSourceAdapterV010, createExperienceCompilerMemoryIntakeHealthProbeV010} from '../../dist/providers/experience-compiler-memory/runtime.js';
import {createHostEnterpriseContextGrantProviderV010, createHostEnterpriseContextGrantHealthProbeV010} from '../../dist/providers/enterprise-context-grant/runtime.js';
import {createHostEnterpriseRelationshipProviderV010, createHostEnterpriseRelationshipHealthProbeV010} from '../../dist/providers/enterprise-relationship/runtime.js';
import {createHostIdentityUserDirectoryServiceV010, createHostIdentityUserDirectoryHealthProbeV010} from '../../dist/providers/identity-directory/runtime.js';
import {createHostStaticAuthorizationProviderV010} from '../../dist/providers/authorization/runtime.js';

test('memory and security imports, configured construction and discovery attempt no guarded resources', () => {
  const env = {...process.env}; delete env.NODE_TEST_CONTEXT;
  execFileSync(process.execPath, [fileURLToPath(new URL('../fixtures/memory-security-construction-probe.mjs', import.meta.url))], {
    env, stdio: ['ignore', 'ignore', 'inherit'], timeout: 15000
  });
});

function trackTimers(t) {
  const active = new Set(), delays = [];
  t.mock.method(globalThis, 'setTimeout', (callback, delay) => {
    const handle = {callback}; active.add(handle); delays.push(delay); return handle;
  });
  t.mock.method(globalThis, 'clearTimeout', handle => assert.equal(active.delete(handle), true));
  return {active, delays};
}
const context = {contractVersion: '0.1.0', kind: 'PERSONAL', contextId: 'synthetic-context'};
const ecConfig = {contractVersion: '0.1.0', endpoint: 'https://memory-resource.invalid/ec', timeoutMs: 1200,
  source: {contractVersion: '0.1.0', sourceId: 'synthetic-ec', sourceType: 'EXPERIENCE_COMPILER', trustLevel: 'DECLARED'}};
const cases = [
  {name: 'semantic', method: 'search', factory: createRemoteContextMemorySemanticRetrieverV010,
    options: {endpoint: 'https://memory-resource.invalid/semantic', timeoutMs: 1200},
    input: {contractVersion: '0.1.0', context, query: 'synthetic', limit: 5, candidates: [{contractVersion: '0.1.0', memoryId: 'm1', kind: 'FACT', summary: 'synthetic candidate', evidenceRefs: []}]},
    result: {contractVersion: '0.1.0', ranking: [{memoryId: 'm1', score: 0.5, signals: ['synthetic']}]},
    unsupported: /CONTEXT_MEMORY_SEMANTIC_CONTRACT_UNSUPPORTED/, http: /CONTEXT_MEMORY_SEMANTIC_HTTP_ERROR/, invalid: /CONTEXT_MEMORY_SEMANTIC_RESPONSE_INVALID/},
  {name: 'DLP', method: 'classify', factory: createRemoteContextMemoryDlpClassifierV010,
    options: {endpoint: 'https://memory-resource.invalid/dlp', timeoutMs: 1200},
    input: {contractVersion: '0.1.0', context, kind: 'FACT', summary: 'synthetic'},
    result: {contractVersion: '0.1.0', privacyClass: 'STANDARD', labels: [], reasonCodes: []},
    unsupported: /CONTEXT_MEMORY_DLP_CONTRACT_UNSUPPORTED/, http: /CONTEXT_MEMORY_DLP_HTTP_ERROR/, invalid: /CONTEXT_MEMORY_DLP_RESPONSE_INVALID/},
  {name: 'EC', method: 'pull', factory: createExperienceCompilerMemoryIntakeSourceAdapterV010,
    options: {config: ecConfig}, input: {contractVersion: '0.1.0', context},
    result: {contractVersion: '0.1.0', records: []}, unsupported: /EC_MEMORY_INTAKE_CONTRACT_UNSUPPORTED/,
    http: /EC_MEMORY_INTAKE_HTTP_ERROR/, invalid: /EC_MEMORY_INTAKE_RESPONSE_INVALID/}
];
for (const item of cases) {
  test(item.name + ' requests start on use; concurrency, HTTP/body failures clean deadlines without replay', async t => {
    const timers = trackTimers(t), calls = [];
    let mode = 'ok';
    const runtime = item.factory({...item.options, bearerToken: 'synthetic-token', fetchImpl: async (url, init) => {
      calls.push({url, init});
      if (mode === 'network') throw Error('synthetic-network-failure');
      return {ok: mode !== 'http', status: mode === 'http' ? 503 : 200,
        async json() { if (mode === 'json') throw Error('synthetic-json-failure'); return mode === 'invalid' ? {} : item.result; }};
    }});
    const invoke = input => runtime[item.method](input);
    assert.equal(calls.length, 0); assert.equal(timers.active.size, 0);
    await assert.rejects(invoke({...item.input, contractVersion: 'unsupported'}), item.unsupported);
    assert.equal(calls.length, 0); assert.equal(timers.delays.length, 0);
    assert.equal((await Promise.all([invoke(item.input), invoke(item.input)])).length, 2);
    assert.equal(calls.length, 2); assert.equal(timers.active.size, 0);
    assert.notEqual(calls[0].init.signal, calls[1].init.signal);
    for (const [next, error] of [['http', item.http], ['json', /synthetic-json-failure/],
      ['invalid', item.invalid], ['network', /synthetic-network-failure/]]) {
      mode = next; const before = calls.length;
      await assert.rejects(invoke(item.input), error);
      assert.equal(calls.length, before + 1, 'no automatic replay'); assert.equal(timers.active.size, 0);
    }
    mode = 'ok'; await invoke(item.input);
    assert.equal(calls.length, 7); assert.equal(timers.active.size, 0);
    assert.deepEqual(timers.delays, Array(7).fill(1200));
    for (const {url, init} of calls) {
      assert.equal(url, item.options.endpoint ?? ecConfig.endpoint);
      assert.equal(init.method, 'POST'); assert.equal(init.redirect, 'error');
      assert.equal(new Headers(init.headers).get('authorization'), 'Bearer synthetic-token');
      assert.deepEqual(JSON.parse(init.body), item.input);
    }
  });

  test(item.name + ' deadline covers pending response body, abort cleans up and next explicit call recovers', async t => {
    const timers = trackTimers(t);
    let bodyEntered, calls = 0, signal, shouldBlock = true;
    const entered = new Promise(resolve => { bodyEntered = resolve; });
    const runtime = item.factory({...item.options, fetchImpl: async (_url, init) => {
      calls++; signal = init.signal;
      return {ok: true, json() {
        if (!shouldBlock) return item.result;
        bodyEntered();
        return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(Error('synthetic-body-abort')), {once: true}));
      }};
    }});
    const pending = runtime[item.method](item.input);
    await entered;
    assert.equal(calls, 1); assert.equal(timers.active.size, 1); assert.equal(signal.aborted, false);
    const rejected = assert.rejects(pending, /synthetic-body-abort/);
    [...timers.active][0].callback(); await rejected;
    assert.equal(signal.aborted, true); assert.equal(timers.active.size, 0); assert.equal(calls, 1);
    shouldBlock = false; await runtime[item.method](item.input);
    assert.equal(calls, 2); assert.equal(timers.active.size, 0); assert.equal(signal.aborted, false);
  });
}

test('memory endpoint probes only describe transport configuration, including HTTP degradation', async t => {
  const timers = trackTimers(t); let calls = 0;
  const fetchImpl = async () => { calls++; throw Error('must not contact endpoint'); };
  for (const protocol of ['https', 'http']) {
    const endpoint = protocol + '://memory-resource.invalid/endpoint';
    const probes = [createRemoteContextMemorySemanticHealthProbeV010({endpoint, fetchImpl}),
      createRemoteContextMemoryDlpHealthProbeV010({endpoint, fetchImpl}),
      createExperienceCompilerMemoryIntakeHealthProbeV010({...ecConfig, endpoint})];
    for (const probe of probes) assert.equal((await probe()).state, protocol === 'https' ? 'HEALTHY' : 'DEGRADED');
  }
  assert.equal(calls, 0); assert.deepEqual(timers.delays, []);
});

test('shared grant/relationship adapters defer source reads, observe current revocation, and recover from source failure', () => {
  const principal = {contractVersion: '0.1.0', subjectId: 'synthetic-person', actorType: 'HUMAN', identityProviderId: 'synthetic'};
  let reads = 0, fail = false;
  const grantRows = [{contractVersion: '0.1.0', grantId: 'g1', subjectId: principal.subjectId, contextId: 'c1', state: 'ACTIVE'}];
  const relationRows = [{contractVersion: '0.1.0', relationshipId: 'r1', subjectId: principal.subjectId, contextId: 'c1', state: 'ACTIVE'}];
  const source = rows => () => { reads++; if (fail) throw Error('synthetic-store-failure'); return rows; };
  const grantSource = source(grantRows), relationSource = source(relationRows);
  const grants = createHostEnterpriseContextGrantProviderV010([], grantSource);
  const relationships = createHostEnterpriseRelationshipProviderV010(relationSource);
  const probes = [createHostEnterpriseContextGrantHealthProbeV010([], grantSource), createHostEnterpriseRelationshipHealthProbeV010(relationSource)];
  assert.equal(reads, 0);
  assert.equal(grants.listForPrincipal(principal).length, 1);
  assert.equal(relationships.listForPrincipal(principal).length, 1);
  assert.equal(relationships.listForContext('c1').length, 1);
  grantRows[0].state = 'REVOKED'; relationRows[0].state = 'REVOKED';
  assert.deepEqual(grants.listForPrincipal(principal), []); assert.deepEqual(relationships.listForPrincipal(principal), []);
  assert.deepEqual(relationships.listForContext('c1'), []);
  fail = true;
  assert.throws(() => grants.listForPrincipal(principal), /synthetic-store-failure/);
  assert.throws(() => relationships.listForContext('c1'), /synthetic-store-failure/);
  for (const probe of probes) assert.throws(probe, /synthetic-store-failure/);
  fail = false;
  for (const probe of probes) assert.equal(probe().state, 'HEALTHY');
  assert.deepEqual(grants.listForPrincipal(principal), []); assert.deepEqual(relationships.listForContext('c1'), []);
  const auth = createHostStaticAuthorizationProviderV010({contractVersion: '0.1.0', rules: [
    {id: 'allow', effect: 'ALLOW', actions: ['read']}, {id: 'deny', effect: 'DENY', actions: ['read'], subjectIds: [principal.subjectId]}
  ]});
  assert.equal(auth.check({contractVersion: '0.1.0', principal, action: 'read', resource: {type: 'synthetic'}, scope: {contractVersion: '0.1.0'}}).allowed, false);
});

test('identity adapter construction reads nothing; directory/probe reads and authenticated writes keep one shared authority', () => {
  let reads = 0, writes = 0, fail = false;
  let state = {contractVersion: '0.1.0', entries: []};
  const service = createHostIdentityUserDirectoryServiceV010({store: {
    snapshot() { reads++; if (fail) throw Error('synthetic-store-failure'); return structuredClone(state); },
    save(next) { writes++; state = structuredClone(next); }
  }});
  const probe = createHostIdentityUserDirectoryHealthProbeV010(service.provider);
  assert.equal(reads, 0); assert.equal(writes, 0);
  probe(); service.provider.list(); assert.equal(reads, 2); assert.equal(writes, 0);
  const principal = {contractVersion: '0.1.0', subjectId: 'synthetic-person', actorType: 'HUMAN', identityProviderId: 'synthetic'};
  fail = true; assert.throws(() => service.recordAuthenticatedPrincipal(principal), /synthetic-store-failure/); assert.equal(writes, 0);
  fail = false; service.recordAuthenticatedPrincipal(principal); assert.equal(writes, 1);
  service.disable(principal.subjectId, 'synthetic-admin'); assert.equal(writes, 2);
  assert.equal(service.provider.get(principal.subjectId).state, 'DISABLED');
  assert.throws(() => service.recordAuthenticatedPrincipal(principal), /IDENTITY_USER_DIRECTORY_PRINCIPAL_DISABLED/);
  assert.equal(writes, 2);
});
