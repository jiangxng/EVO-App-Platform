import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHostContextMemoryReaderV010} from '../../dist/providers/context-memory/runtime.js';
import {createRemoteContextMemorySemanticRetrieverV010} from '../../dist/providers/context-memory-semantic/runtime.js';
import {createMemoryCredentialFetchV010} from '../../dist/manager/memory-credential-fetch.js';
import {createProviderRuntimeRegistry} from '../../dist/providers/runtime-registry.js';
import {createMemoryProviderBindingStoreV010, resolveProviderRuntimeV010} from '../../dist/manager/provider-resolution.js';
import {createEncryptedFileSecretStoreV010} from '../../dist/manager/secret-store.js';

const context = {contractVersion: '0.1.0', kind: 'PERSONAL', contextId: 'personal:synthetic'};
const item = (memoryId, extra = {}) => ({contractVersion: '0.1.0', memoryId, context, kind: 'FACT', summary: 'synthetic fact',
  provenance: {contractVersion: '0.1.0', origin: 'DIRECT', sourceContext: context, evidenceRefs: []},
  attribution: {contractVersion: '0.1.0', recordedBySubjectId: 'synthetic', recordedByActorType: 'HUMAN', recordedAt: '2026-10-01T00:00:00.000Z'}, ...extra});
const request = {contractVersion: '0.1.0', context, query: 'synthetic', strategy: 'SEMANTIC'};
const store = {snapshot: () => ({contractVersion: '0.1.0', items: [item('m1')]})};
const result = (memoryId = 'm1') => ({contractVersion: '0.1.0', ranking: [{contractVersion: '0.1.0', memoryId, score: 1, signals: ['synthetic']}]});

test('reader construction, lexical and invalid semantic input never resolve a semantic runtime', async () => {
  let resolutions = 0;
  const reader = createHostContextMemoryReaderV010(store, {resolveSemanticRetriever() {resolutions++; throw Error('must not resolve');}});
  assert.equal(resolutions, 0);
  assert.equal((await reader.read({...request, strategy: 'LEXICAL'})).items.length, 1);
  await assert.rejects(reader.read({...request, query: ''}), /CONTEXT_MEMORY_SEMANTIC_QUERY_REQUIRED/);
  await assert.rejects(reader.read({...request, contractVersion: 'invalid'}), /CONTEXT_MEMORY_READ_CONTRACT_UNSUPPORTED/);
  assert.equal(resolutions, 0);
});

test('each semantic/hybrid read selects the current runtime after governance/context filtering', async () => {
  const calls = []; let selected = 'a';
  const readers = Object.fromEntries(['a', 'b'].map(id => [id, {providerId: 'synthetic.' + id, search(input) {
    calls.push({id, input}); return result();
  }}]));
  const reader = createHostContextMemoryReaderV010({snapshot: () => ({contractVersion: '0.1.0', items: [
    item('m1'), item('restricted'), item('other', {context: {...context, contextId: 'other'}})
  ]})}, {resolveSemanticRetriever: () => readers[selected], governance: {get(memoryId) {
    return memoryId === 'restricted' ? {state: 'ACTIVE', privacyClass: 'RESTRICTED'} : undefined;
  }}});
  assert.deepEqual((await reader.read(request)).items.map(x => x.memoryId), ['m1']);
  selected = 'b'; const hybrid = await reader.read({...request, strategy: 'HYBRID'});
  assert.equal(hybrid.strategyUsed, 'HYBRID'); assert.deepEqual(hybrid.items.map(x => x.memoryId), ['m1']);
  assert.deepEqual(calls.map(x => x.id), ['a', 'b']);
  for (const call of calls) assert.deepEqual(call.input.candidates.map(x => x.memoryId), ['m1']);
});

test('a supplied resolver cannot fall back to a captured provider after absence or failure; the same reader recovers', async () => {
  let legacyCalls = 0, current, error;
  const legacy = {providerId: 'synthetic.legacy', search() {legacyCalls++; return result();}};
  const reader = createHostContextMemoryReaderV010(store, {semanticRetriever: legacy, resolveSemanticRetriever() {if (error) throw error; return current;}});
  await assert.rejects(reader.read(request), /CONTEXT_MEMORY_RETRIEVAL_STRATEGY_UNSUPPORTED/);
  error = Error('PROVIDER_BINDING_UNAVAILABLE');
  await assert.rejects(reader.read(request), /PROVIDER_BINDING_UNAVAILABLE/); assert.equal(legacyCalls, 0);
  error = undefined; current = {providerId: 'synthetic.current', search: () => result()};
  assert.equal((await reader.read(request)).items[0].memoryId, 'm1'); assert.equal(legacyCalls, 0);
  assert.equal((await createHostContextMemoryReaderV010(store, {semanticRetriever: legacy}).read(request)).items.length, 1);
  assert.equal(legacyCalls, 1, 'old direct injection remains supported when no resolver is supplied');
});

test('original registry, remote runtime, reader and encrypted store resolve optional semantic credentials per valid use', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'semantic-credential-contract-'));
  try {
    const secrets = createEncryptedFileSecretStoreV010(path.join(root, 'secrets.json'), path.join(root, 'master.key'));
    const reference = {contractVersion: '0.1.0', namespace: 'remote-context-memory-semantic-provider', key: 'apiToken', scope: 'INSTALLATION', scopeId: 'default'};
    secrets.put(reference, 'synthetic-semantic-v1');
    const registry = createProviderRuntimeRegistry(), bindings = createMemoryProviderBindingStoreV010();
    const capability = 'context.memory.semantic-retrieval', providerId = 'remote.context-memory-semantic';
    let active = true, epoch = 0, describes = 0, decryptions = 0, failing = false;
    const calls = [];
    const resolve = () => resolveProviderRuntimeV010(registry, active ? [{providerId, capability}] : [], bindings, capability, {installationId: 'default'})?.runtime;
    const managed = {describe: async ref => {describes++; return secrets.describe(ref);}, resolve: async ref => {
      decryptions++; if (failing) throw Error('synthetic-credential-failure'); return secrets.resolve(ref);
    }};
    const runtime = createRemoteContextMemorySemanticRetrieverV010({endpoint: 'https://semantic-credential.invalid/query',
      fetchImpl: createMemoryCredentialFetchV010({reference, resolveSecrets: () => managed, epoch: () => epoch,
        isCurrent: () => resolve()?.providerId === providerId, fetchImpl: async (_url, init) => {
          calls.push(new Headers(init.headers).get('authorization'));
          assert.equal(init.redirect, 'error'); assert.deepEqual(JSON.parse(init.body).candidates.map(x => x.memoryId), ['m1']);
          return new Response(JSON.stringify(result()));
        }})});
    registry.replace(providerId, runtime);
    const reader = createHostContextMemoryReaderV010(store, {resolveSemanticRetriever: resolve});
    assert.equal(describes, 0); assert.equal(decryptions, 0);
    await reader.read({...request, strategy: 'LEXICAL'}); assert.equal(describes, 0);
    active = false; epoch++;
    await assert.rejects(reader.read(request), /CONTEXT_MEMORY_RETRIEVAL_STRATEGY_UNSUPPORTED/); assert.equal(decryptions, 0);
    active = true; epoch++;
    await Promise.all([reader.read(request), reader.read(request)]);
    assert.equal(decryptions, 2); assert.deepEqual(calls, ['Bearer synthetic-semantic-v1', 'Bearer synthetic-semantic-v1']);
    bindings.save({contractVersion: '0.1.0', capability, providerId: 'synthetic.missing', scope: 'SYSTEM'}); epoch++;
    await assert.rejects(reader.read(request), /PROVIDER_BINDING_UNAVAILABLE/); assert.equal(decryptions, 2);
    bindings.delete(capability, 'SYSTEM'); epoch++;
    secrets.put(reference, 'synthetic-semantic-v2'); await reader.read(request);
    assert.equal(calls.at(-1), 'Bearer synthetic-semantic-v2');
    failing = true; await assert.rejects(reader.read(request), /synthetic-credential-failure/); assert.equal(calls.length, 3);
    failing = false; await reader.read(request); assert.equal(calls.length, 4);
    secrets.remove(reference); await reader.read(request); assert.equal(calls.at(-1), null, 'explicit removal preserves optional anonymous semantics');
    assert.ok(!fs.readFileSync(path.join(root, 'secrets.json'), 'utf8').includes('synthetic-semantic'));
  } finally {fs.rmSync(root, {recursive: true, force: true});}
});
