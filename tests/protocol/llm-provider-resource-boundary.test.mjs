import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createOpenAiResponsesLlmProvider, createOpenAiResponsesHealthProbe} from '../../dist/providers/openai/runtime.js';
import {createDeepSeekResponsesLlmProvider, createDeepSeekResponsesHealthProbe} from '../../dist/providers/deepseek/runtime.js';
import {createProviderRuntimeRegistry} from '../../dist/providers/runtime-registry.js';

test('LLM import, configured construction and registry discovery perform no guarded resource work', () => {
  const env = {...process.env};
  delete env.NODE_TEST_CONTEXT;
  execFileSync(process.execPath, [fileURLToPath(new URL('../fixtures/llm-provider-construction-probe.mjs', import.meta.url))], {
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
const request = {contractVersion: '0.1.0', messages: [{role: 'user', content: 'synthetic request'}]};
for (const [name, factory, healthFactory] of [
  ['OpenAI', createOpenAiResponsesLlmProvider, createOpenAiResponsesHealthProbe],
  ['DeepSeek', createDeepSeekResponsesLlmProvider, createDeepSeekResponsesHealthProbe]
]) {
  test(name + ' inference begins on use, concurrent calls stay independent, failure does not replay', async t => {
    const timers = trackTimers(t), calls = [];
    let failing = false;
    const provider = factory({apiKey: 'synthetic-key', model: 'synthetic-model', baseUrl: 'https://llm-resource.invalid',
      fetchImpl: async (url, init) => {
        calls.push({url, method: init.method, body: JSON.parse(init.body)});
        return new Response(JSON.stringify(failing ? {error: {message: 'synthetic inference failure'}} : {
          model: 'synthetic-model', output: [{type: 'message', content: [{type: 'output_text', text: 'ok'}]}]
        }), {status: failing ? 503 : 200});
      }});
    assert.deepEqual(calls, []); assert.deepEqual(timers.delays, []);
    await assert.rejects(provider.infer({...request, contractVersion: 'invalid'}), /LLM_INFERENCE_CONTRACT_UNSUPPORTED/);
    assert.deepEqual(calls, []); assert.deepEqual(timers.delays, []);
    const results = await Promise.all([provider.infer(request), provider.infer(request)]);
    assert.deepEqual(results.map(x => x.text), ['ok', 'ok']);
    assert.equal(calls.length, 2);
    for (const call of calls) {
      assert.equal(call.url, 'https://llm-resource.invalid/responses');
      assert.equal(call.method, 'POST'); assert.equal(call.body.model, 'synthetic-model');
    }
    failing = true;
    await assert.rejects(provider.infer(request), /synthetic inference failure/);
    assert.equal(calls.length, 3, 'failure must not automatically replay inference');
    assert.equal(timers.active.size, 0);
    failing = false;
    assert.equal((await provider.infer(request)).text, 'ok');
    assert.equal(calls.length, 4); assert.equal(timers.active.size, 0);
    assert.deepEqual(timers.delays, name === 'DeepSeek' ? [30000, 30000, 30000, 30000] : []);
  });

  test(name + ' explicit health probe owns its deadline; metadata stays passive and errors recover', async t => {
    const timers = trackTimers(t), calls = [], registry = createProviderRuntimeRegistry();
    let mode = 'ok';
    const options = {apiKey: 'synthetic-key', model: 'synthetic-model', baseUrl: 'https://llm-resource.invalid',
      fetchImpl: async (url, init) => {
        calls.push({url, method: init.method});
        assert.ok(init.signal); assert.equal(init.redirect, 'error');
        if (mode === 'abort') {
          assert.equal(timers.active.size, 1);
          [...timers.active][0].callback();
          assert.equal(init.signal.aborted, true);
          throw Error('synthetic aborted probe');
        }
        if (mode === 'throw') throw Error('synthetic network failure');
        const status = mode === 'degraded' ? 503 : mode === 'denied' ? 401 : 200;
        return new Response(JSON.stringify({data: [{id: 'synthetic-model'}]}), {status});
      }};
    const runtime = factory(options), probe = healthFactory(options);
    registry.replace(runtime.providerId, runtime); registry.setHealthProbe(runtime.providerId, probe);
    assert.equal(registry.getHealth(runtime.providerId).state, 'UNKNOWN');
    assert.deepEqual(calls, []); assert.deepEqual(timers.delays, []);
    for (const [next, state] of [['ok', 'HEALTHY'], ['degraded', 'DEGRADED'], ['denied', 'UNAVAILABLE'],
      ['throw', 'UNAVAILABLE'], ['abort', 'UNAVAILABLE'], ['ok', 'HEALTHY']]) {
      mode = next; const before = calls.length;
      const result = await registry.runHealthProbe(runtime.providerId);
      assert.equal(result.state, state); assert.ok(result.checkedAt);
      assert.equal(calls.length, before + 1); assert.equal(timers.active.size, 0);
      if (next === 'throw') assert.equal(result.message, 'synthetic network failure');
      if (next === 'abort') assert.equal(result.message, 'synthetic aborted probe');
      assert.equal(registry.getHealth(runtime.providerId).state, state);
      assert.equal(calls.length, before + 1, 'reading health must not rerun probe');
    }
    assert.deepEqual(timers.delays, Array(6).fill(5000));
    for (const call of calls) {
      assert.equal(call.method, 'GET');
      assert.equal(call.url, 'https://llm-resource.invalid/models' + (name === 'OpenAI' ? '/synthetic-model' : ''));
    }
    registry.remove(runtime.providerId);
    assert.equal((await registry.runHealthProbe(runtime.providerId)).state, 'UNAVAILABLE');
    assert.equal(calls.length, 6); assert.equal(timers.active.size, 0);
  });
}
