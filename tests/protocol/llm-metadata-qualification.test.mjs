import test from 'node:test';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {stripTypeScriptTypes} from 'node:module';
// Execute the original private functions and bounded lifecycle fragment. Only
// descriptor, metadata, registry and cheap factory ports are mocked. This is
// component/race evidence; real filesystem/HTTP behavior is covered by Host CI.
function harness(file) {
  const source=fs.readFileSync(file,'utf8');
  const sections=[['function openAiApiKeyReference()', 'await refreshOpenAiProviderRuntime();'],['function deepSeekApiKeyReference()', 'await refreshDeepSeekProviderRuntime();']].map(([a,b])=>source.slice(source.indexOf(a),source.indexOf(b)));
  const start=source.indexOf('    const llmProviderId = event.packageId',source.indexOf('const manager = createAppManagerService'));
  const callback=source.slice(start,source.indexOf('    refreshContextMemorySchedule();',start));
  let active=false,available=true,configured=true,paused=false,fail=false;const pending=[],reads=[],registered=new Map();
  const dependencies={OPENAI_LLM_PACKAGE_ID:'openai-llm-provider',OPENAI_LLM_PROVIDER_ID:'openai.responses',DEEPSEEK_LLM_PACKAGE_ID:'deepseek-llm-provider',DEEPSEEK_LLM_PROVIDER_ID:'deepseek.responses',SECRETS_RESOLVE_CAPABILITY:'secrets.resolve',
    llmCredentialEpochs:new Map(),llmConfigurationEpochs:new Map(),llmSettingsWrites:new Map(),memoryCredentialOwners:new Map(),invalidateMemoryCredential(){},invalidateMemoryBinding(){},
    manager:{listEffectiveServiceProviders:()=>active?[{providerId:'openai.responses'},{providerId:'deepseek.responses'}]:[]},
    catalog:{get:id=>id==='host-encrypted-secrets-provider'?{features:[{providesCapabilities:['secrets.resolve']}]}:{features:[]}},
    settingsStore:{getNamespace:()=>({})},process:{env:{}},console:{error(){}},
    resolveManagedSecretsProvider:()=>available?{describe(ref){reads.push(ref.namespace);if(fail)throw Error('synthetic-metadata-read-failure');return paused?new Promise(resolve=>pending.push(()=>resolve({configured}))):{configured};}}:undefined,
    providerRuntimeRegistry:{replace:(id,value)=>registered.set(id,value),remove:id=>registered.delete(id),setHealthProbe(){},setHealth(){}},
    createLlmCredentialFetchV010:()=>()=>{},createOpenAiResponsesLlmProvider:()=>({}),createDeepSeekResponsesLlmProvider:()=>({}),createOpenAiResponsesHealthProbe:()=>()=>{},createDeepSeekResponsesHealthProbe:()=>()=>{}};
  const code=stripTypeScriptTypes('function prepare(){\n'+sections.join('\n')+'\nreturn {refresh:()=>Promise.all([refreshOpenAiProviderRuntime(),refreshDeepSeekProviderRuntime()]),event(event){'+callback+'}}}',{mode:'strip'})+'\nreturn prepare();';
  const functions=new Function(...Object.keys(dependencies),code)(...Object.values(dependencies));
  return {reads,registered,functions,set:(values)=>{if('active'in values)active=values.active;if('available'in values)available=values.available;if('configured'in values)configured=values.configured;if('paused'in values)paused=values.paused;if('fail'in values)fail=values.fail;if('legacy'in values){dependencies.process.env.OPENAI_API_KEY=values.legacy;dependencies.process.env.DEEPSEEK_API_KEY=values.legacy;}},release:()=>{paused=false;for(const f of pending.splice(0))f();},event(id='openai-llm-provider'){functions.event({packageId:id});}};
}
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
const expected = {'uninstalled-persisted':[0,0],'inactive-legacy':[0,0],'no-secrets':[0,0],'active-cold':[2,2],
  'first-activation':[2,2],'restored-secrets':[2,2],'late-stop':[2,0],'read-failure-repair':[4,2]};
for (const name of Object.keys(expected)) test('original LLM refresh/lifecycle qualification: ' + name, async () => {
  const h = harness(new URL('../../manager/server.ts', import.meta.url));
  if(name==='inactive-legacy')h.set({legacy:'synthetic-legacy'});
  if(name==='no-secrets')h.set({available:false});
  if(name==='active-cold')h.set({active:true});
  if(['uninstalled-persisted','inactive-legacy','no-secrets','active-cold'].includes(name))await h.functions.refresh();
  if(name==='first-activation'){h.set({active:true});h.event();h.event('deepseek-llm-provider');await flush();}
  if(name==='restored-secrets'){h.set({active:true,available:true});h.event('host-encrypted-secrets-provider');await flush();}
  if(name==='late-stop') {h.set({active:true,paused:true});const p=h.functions.refresh();h.set({active:false});h.event();h.event('deepseek-llm-provider');h.release();await p;await flush();}
  if(name==='read-failure-repair'){h.set({active:true,fail:true});await h.functions.refresh();assert.equal(h.registered.size,0);h.set({fail:false});h.event();h.event('deepseek-llm-provider');await flush();}
  assert.deepEqual([h.reads.length,h.registered.size],expected[name]);
});
