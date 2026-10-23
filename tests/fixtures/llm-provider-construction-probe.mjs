import assert from 'node:assert/strict';

// Reuse the existing test-only guard/native unmodified-JS loader. It runs
// before any project import, and remains installed through construction.
process.argv.splice(2, process.argv.length - 2, 'imports',
  'providers/openai/runtime.js', 'providers/deepseek/runtime.js',
  'providers/runtime-registry.js', 'manager/provider-resolution.js');
const {assertNoGuardedResourceAttempts} = await import('./eog-retained-import-probe.mjs');
const openai = await import('../../dist/providers/openai/runtime.js');
const deepseek = await import('../../dist/providers/deepseek/runtime.js');
const {createProviderRuntimeRegistry} = await import('../../dist/providers/runtime-registry.js');
const {createMemoryProviderBindingStoreV010, resolveProviderRuntimeV010} = await import('../../dist/manager/provider-resolution.js');
const registry = createProviderRuntimeRegistry();
for (const [factory, health] of [
  [openai.createOpenAiResponsesLlmProvider, openai.createOpenAiResponsesHealthProbe],
  [deepseek.createDeepSeekResponsesLlmProvider, deepseek.createDeepSeekResponsesHealthProbe]
]) {
  // Omit fetchImpl deliberately: the factory captures the guarded global fetch.
  const options = {apiKey: 'synthetic-resource-probe', model: 'synthetic-model', baseUrl: 'https://llm-resource.invalid'};
  const runtime = factory(options);
  registry.replace(runtime.providerId, runtime);
  registry.setHealthProbe(runtime.providerId, health(options));
  registry.setHealth(runtime.providerId, {state: 'UNKNOWN'});
  assert.equal(registry.getHealth(runtime.providerId).state, 'UNKNOWN');
  assert.equal(registry.get(runtime.providerId), runtime);
  assert.equal(registry.has(runtime.providerId), true);
  assert.equal(resolveProviderRuntimeV010(registry,
    [{providerId: runtime.providerId, capability: 'llm.inference'}],
    createMemoryProviderBindingStoreV010(), 'llm.inference').runtime, runtime);
  // Constructing a configured closure and discovering it is not a probe/use.
  assert.throws(() => factory({...options, apiKey: ''}), /API_KEY_REQUIRED/);
  registry.remove(runtime.providerId);
}
assertNoGuardedResourceAttempts();
