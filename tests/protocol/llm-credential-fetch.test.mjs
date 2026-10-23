import test from 'node:test';
import assert from 'node:assert/strict';
import {createLlmCredentialFetchV010} from '../../dist/manager/llm-credential-fetch.js';

const reference = {contractVersion: '0.1.0', namespace: 'synthetic-llm', key: 'apiKey', scope: 'INSTALLATION', scopeId: 'default'};
function barrier() {let release; const promise = new Promise(resolve => release = resolve); return {promise, release};}
function fixture() {
  const calls = [], errors = []; const state = {active: true, epoch: 0, current: true, configured: true};
  let describes = 0, resolves = 0;
  const secrets = {
    describe: async () => {describes++; return {configured: state.configured};},
    resolve: async () => {resolves++; return 'synthetic-stored';}
  };
  const options = {reference, resolveSecrets: () => secrets, legacyKey: () => 'synthetic-env',
    isCurrent: () => state.active && state.current, activationEpoch: () => state.epoch,
    onSecretError: error => errors.push(error), fetchImpl: async (...args) => {calls.push(args); return new Response('ok');}};
  return {calls, errors, state, secrets, options, counts: () => ({describes, resolves})};
}
const request = {method: 'POST', headers: {'authorization': 'Bearer configured-at-request', 'content-type': 'application/json'}, body: '{}'};

test('credential adapter construction and inactive calls do not resolve plaintext or send requests', async () => {
  const f = fixture(), send = createLlmCredentialFetchV010(f.options);
  assert.deepEqual(f.counts(), {describes: 0, resolves: 0});
  f.state.active = false;
  await assert.rejects(send('https://synthetic.invalid/responses', request), /LLM_CREDENTIAL_CONTEXT_CHANGED/);
  assert.deepEqual(f.counts(), {describes: 0, resolves: 0}); assert.deepEqual(f.calls, []);
});

test('each concurrent request resolves its key and preserves the original request except authorization', async () => {
  const f = fixture(), send = createLlmCredentialFetchV010(f.options), controller = new AbortController();
  await Promise.all([send('https://synthetic.invalid/responses', {...request, signal: controller.signal}), send('https://synthetic.invalid/models', {method: 'GET'})]);
  assert.deepEqual(f.counts(), {describes: 2, resolves: 2}); assert.equal(f.calls.length, 2);
  assert.equal(f.calls[0][1].headers.get('authorization'), 'Bearer synthetic-stored');
  assert.equal(f.calls[0][1].headers.get('content-type'), 'application/json');
  assert.equal(f.calls[0][1].signal, controller.signal); assert.equal(f.calls[0][1].body, '{}');
  assert.equal(request.headers.authorization, 'Bearer configured-at-request', 'do not mutate caller headers');
});

for (const stage of ['describe', 'resolve']) {
  test('disable/re-enable during ' + stage + ' refuses the stale request and allows a new request', async () => {
    const f = fixture(), entered = barrier(), release = barrier(), original = f.secrets[stage];
    f.secrets[stage] = async (...args) => {entered.release(); await release.promise; return original(...args);};
    const send = createLlmCredentialFetchV010(f.options);
    const pending = send('https://synthetic.invalid/responses', request); pending.catch(() => {});
    await entered.promise; f.state.active = false; f.state.epoch++; f.state.active = true; f.state.epoch++;
    release.release(); await assert.rejects(pending, /LLM_CREDENTIAL_CONTEXT_CHANGED/);
    assert.deepEqual(f.calls, []); assert.deepEqual(f.errors, []);
    if (stage === 'describe') assert.equal(f.counts().resolves, 0);
    f.secrets[stage] = original; await send('https://synthetic.invalid/responses', request); assert.equal(f.calls.length, 1);
  });

  test('configuration replacement during ' + stage + ' refuses the old endpoint before fetch', async () => {
    const f = fixture(), entered = barrier(), release = barrier(), original = f.secrets[stage];
    f.secrets[stage] = async (...args) => {entered.release(); await release.promise; return original(...args);};
    const send = createLlmCredentialFetchV010(f.options);
    const pending = send('https://old-endpoint.invalid/responses', request); pending.catch(() => {});
    await entered.promise; f.state.current = false; release.release();
    await assert.rejects(pending, /LLM_CREDENTIAL_CONTEXT_CHANGED/); assert.deepEqual(f.calls, []);
    assert.deepEqual(f.errors, []);
  });

  test('abort during ' + stage + ' prevents delayed decryption or network activity', async () => {
    const f = fixture(), entered = barrier(), release = barrier(), original = f.secrets[stage];
    f.secrets[stage] = async (...args) => {entered.release(); await release.promise; return original(...args);};
    const controller = new AbortController(), send = createLlmCredentialFetchV010(f.options);
    const pending = send('https://synthetic.invalid/models', {...request, signal: controller.signal}); pending.catch(() => {});
    await entered.promise; controller.abort(); release.release();
    await assert.rejects(pending, {name: 'AbortError'}); assert.deepEqual(f.calls, []); assert.deepEqual(f.errors, []);
    if (stage === 'describe') assert.equal(f.counts().resolves, 0);
  });
}

test('lookup failure retains existing environment fallback; missing keys fail without replay and recover', async () => {
  const f = fixture(), original = f.secrets.resolve;
  f.secrets.resolve = async () => {throw Error('synthetic lookup failure');};
  const send = createLlmCredentialFetchV010(f.options);
  await send('https://synthetic.invalid/responses', request);
  assert.equal(f.calls[0][1].headers.get('authorization'), 'Bearer synthetic-env'); assert.equal(f.errors.length, 1);
  f.state.configured = false; f.options.legacyKey = () => undefined;
  await assert.rejects(send('https://synthetic.invalid/responses', request), /LLM_PROVIDER_API_KEY_REQUIRED/);
  assert.equal(f.calls.length, 1);
  f.state.configured = true; f.secrets.resolve = original;
  await send('https://synthetic.invalid/responses', request); assert.equal(f.calls.length, 2);
  assert.equal(f.calls[1][1].headers.get('authorization'), 'Bearer synthetic-stored');
});
