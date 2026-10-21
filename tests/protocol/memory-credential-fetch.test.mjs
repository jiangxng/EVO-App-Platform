import test from 'node:test';
import assert from 'node:assert/strict';
import {createMemoryCredentialFetchV010} from '../../dist/manager/memory-credential-fetch.js';

const reference = {contractVersion: '0.1.0', namespace: 'synthetic-memory', key: 'apiToken', scope: 'INSTALLATION', scopeId: 'default'};
const request = {method: 'POST', headers: {'content-type': 'application/json', authorization: 'Bearer stale-input'}, body: '{}', redirect: 'error'};
function barrier() {let release; const promise = new Promise(resolve => release = resolve); return {promise, release};}
function fixture() {
  const state = {current: true, epoch: 0, configured: true}; const calls = [];
  let describes = 0, resolves = 0, provider;
  const secrets = {describe: async () => {describes++; return {configured: state.configured};},
    resolve: async () => {resolves++; return 'synthetic-token';}};
  provider = secrets;
  const send = createMemoryCredentialFetchV010({reference, isCurrent: () => state.current, epoch: () => state.epoch,
    resolveSecrets: () => provider, fetchImpl: async (...args) => {calls.push(args); return new Response('ok');}});
  return {state, calls, secrets, send, counts: () => ({describes, resolves}), replace: value => {provider = value;}};
}

test('construction, inactive use and an already aborted request do not read credentials', async () => {
  const f = fixture(); assert.deepEqual(f.counts(), {describes: 0, resolves: 0});
  f.state.current = false;
  await assert.rejects(f.send('https://memory.invalid', request), /MEMORY_CREDENTIAL_CONTEXT_CHANGED/);
  f.state.current = true;
  const controller = new AbortController(); controller.abort();
  await assert.rejects(f.send('https://memory.invalid', {...request, signal: controller.signal}), {name: 'AbortError'});
  assert.deepEqual(f.counts(), {describes: 0, resolves: 0}); assert.deepEqual(f.calls, []);
});

test('unconfigured optional token is anonymous; configured concurrent calls bind per request without mutating inputs', async () => {
  const f = fixture(); f.state.configured = false;
  await f.send('https://memory.invalid', request);
  assert.equal(f.calls[0][1].headers.has('authorization'), false);
  assert.deepEqual(f.counts(), {describes: 1, resolves: 0});
  f.state.configured = true;
  const controller = new AbortController();
  await Promise.all([f.send('https://memory.invalid/a', {...request, signal: controller.signal}), f.send('https://memory.invalid/b', request)]);
  assert.deepEqual(f.counts(), {describes: 3, resolves: 2}); assert.equal(f.calls.length, 3);
  for (const [, init] of f.calls.slice(1)) {
    assert.equal(init.headers.get('authorization'), 'Bearer synthetic-token');
    assert.equal(init.method, request.method); assert.equal(init.body, request.body); assert.equal(init.redirect, 'error');
    assert.equal(init.headers.get('content-type'), 'application/json');
  }
  assert.equal(f.calls[1][1].signal, controller.signal);
  assert.equal(request.headers.authorization, 'Bearer stale-input');
});

test('missing, empty, failed or corrupt configured Secrets never becomes anonymous traffic; explicit retry recovers', async () => {
  const f = fixture(), original = f.secrets.resolve;
  f.replace(undefined); await assert.rejects(f.send('https://memory.invalid', request), /SECRETS_PROVIDER_REQUIRED/);
  f.replace(f.secrets);
  for (const mode of ['empty', 'throw']) {
    f.secrets.resolve = async () => {if (mode === 'throw') throw Error('synthetic-corrupt-ciphertext'); return '  ';};
    await assert.rejects(f.send('https://memory.invalid', request), mode === 'throw' ? /synthetic-corrupt-ciphertext/ : /SECRET_VALUE_EMPTY/);
  }
  const describe = f.secrets.describe;
  f.secrets.describe = async () => {throw Error('synthetic-describe-failure');};
  await assert.rejects(f.send('https://memory.invalid', request), /synthetic-describe-failure/);
  assert.deepEqual(f.calls, []);
  f.secrets.describe = describe; f.secrets.resolve = original;
  await f.send('https://memory.invalid', request); assert.equal(f.calls.length, 1);
});

for (const stage of ['describe', 'resolve']) {
  test('generation bounce during ' + stage + ' refuses late traffic and permits a fresh call', async () => {
    {
      const f = fixture(), entered = barrier(), released = barrier(), original = f.secrets[stage];
      f.secrets[stage] = async (...args) => {entered.release(); await released.promise; return original(...args);};
      const pending = f.send('https://memory.invalid', request); pending.catch(() => {});
      await entered.promise;
      f.state.current = false; f.state.epoch++; f.state.current = true; f.state.epoch++;
      released.release(); await assert.rejects(pending, /MEMORY_CREDENTIAL_CONTEXT_CHANGED/);
      assert.deepEqual(f.calls, []); if (stage === 'describe') assert.equal(f.counts().resolves, 0);
      f.secrets[stage] = original; await f.send('https://memory.invalid', request); assert.equal(f.calls.length, 1);
    }
  });

  test('Abort during ' + stage + ' prevents late plaintext or traffic, without disabling subsequent calls', async () => {
    const f = fixture(), entered = barrier(), released = barrier(), original = f.secrets[stage];
    f.secrets[stage] = async (...args) => {entered.release(); await released.promise; return original(...args);};
    const controller = new AbortController();
    const pending = f.send('https://memory.invalid', {...request, signal: controller.signal}); pending.catch(() => {});
    await entered.promise; controller.abort(); released.release();
    await assert.rejects(pending, {name: 'AbortError'}); assert.deepEqual(f.calls, []);
    if (stage === 'describe') assert.equal(f.counts().resolves, 0);
    f.secrets[stage] = original; await f.send('https://memory.invalid', request); assert.equal(f.calls.length, 1);
  });

  test('replacement of the shared Secrets runtime during ' + stage + ' is refused without anonymous fallback', async () => {
    const f = fixture(), entered = barrier(), released = barrier(), original = f.secrets[stage];
    f.secrets[stage] = async (...args) => {entered.release(); await released.promise; return original(...args);};
    const pending = f.send('https://memory.invalid', request); pending.catch(() => {});
    await entered.promise; f.replace({...f.secrets}); released.release();
    await assert.rejects(pending, /MEMORY_CREDENTIAL_CONTEXT_CHANGED/); assert.deepEqual(f.calls, []);
    if (stage === 'describe') assert.equal(f.counts().resolves, 0);
  });
}
