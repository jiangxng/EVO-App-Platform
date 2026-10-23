import assert from 'node:assert/strict';

// Reuse the pre-evaluation resource guard and native unmodified-JS loader.
const roots = ['memory-intake', 'experience-compiler-memory', 'context-memory-semantic',
  'context-memory-dlp', 'identity-directory', 'authorization', 'enterprise-context-grant',
  'enterprise-relationship', 'remote-credential'];
process.argv.splice(2, process.argv.length - 2, 'imports',
  ...roots.map(name => `providers/${name}/runtime.js`), 'providers/runtime-registry.js');
const {assertNoGuardedResourceAttempts} = await import('./eog-retained-import-probe.mjs');
const modules = await Promise.all(roots.map(name => import(`../../dist/providers/${name}/runtime.js`)));
const [memory, ec, semantic, dlp, identity, authorization, grants, relationships, credentials] = modules;
const {createProviderRuntimeRegistry} = await import('../../dist/providers/runtime-registry.js');
const registry = createProviderRuntimeRegistry();
const source = {contractVersion: '0.1.0', sourceId: 'synthetic-source', sourceType: 'APPLICATION', trustLevel: 'DECLARED'};
const context = {contractVersion: '0.1.0', kind: 'PERSONAL', contextId: 'synthetic-context'};
const config = memory.parseHostMemoryIntakeConfigV010(JSON.stringify({contractVersion: '0.1.0', source,
  records: [{sourceRecordId: 'r1', context, kind: 'FACT', summary: 'synthetic fact'}]}));
const ecConfig = ec.parseExperienceCompilerMemoryIntakeConfigV010(JSON.stringify({contractVersion: '0.1.0',
  endpoint: 'https://memory-resource.invalid/ec', source}));
let sourceReads = 0;
const forbiddenSource = () => { sourceReads++; throw Error('CONSTRUCTION_SOURCE_READ'); };
const directory = identity.createHostIdentityUserDirectoryServiceV010({store: {snapshot: forbiddenSource, save: forbiddenSource}});
const policy = authorization.parseHostStaticAuthorizationPolicyV010(JSON.stringify({contractVersion: '0.1.0', rules: []}));
const pairs = [
  [memory.createHostMemoryEvidenceSourceProviderV010(config.source), memory.createHostMemoryIntakeHealthProbeV010(config)],
  [memory.createHostMemoryIntakeSourceAdapterV010(config), memory.createHostMemoryIntakeHealthProbeV010(config)],
  [ec.createExperienceCompilerEvidenceSourceProviderV010(ecConfig), ec.createExperienceCompilerMemoryIntakeHealthProbeV010(ecConfig)],
  [ec.createExperienceCompilerMemoryIntakeSourceAdapterV010({config: ecConfig}), ec.createExperienceCompilerMemoryIntakeHealthProbeV010(ecConfig)],
  [semantic.createRemoteContextMemorySemanticRetrieverV010({endpoint: 'https://memory-resource.invalid/semantic'}),
    semantic.createRemoteContextMemorySemanticHealthProbeV010({endpoint: 'https://memory-resource.invalid/semantic'})],
  [dlp.createRemoteContextMemoryDlpClassifierV010({endpoint: 'https://memory-resource.invalid/dlp'}),
    dlp.createRemoteContextMemoryDlpHealthProbeV010({endpoint: 'https://memory-resource.invalid/dlp'})],
  [directory.provider, identity.createHostIdentityUserDirectoryHealthProbeV010(directory.provider)],
  [authorization.createHostStaticAuthorizationProviderV010(policy), authorization.createHostStaticAuthorizationHealthProbeV010(policy)],
  [grants.createHostEnterpriseContextGrantProviderV010([], forbiddenSource), grants.createHostEnterpriseContextGrantHealthProbeV010([], forbiddenSource)],
  [relationships.createHostEnterpriseRelationshipProviderV010(forbiddenSource), relationships.createHostEnterpriseRelationshipHealthProbeV010(forbiddenSource)]
];
const credential = credentials.createHostRemoteBearerCredentialProviderV010({audiences: {synthetic: 'synthetic-token'}});
registry.replace('synthetic.remote-credential', credential);
for (const [runtime, probe] of pairs) {
  registry.replace(runtime.providerId, runtime);
  registry.setHealthProbe(runtime.providerId, probe);
  assert.equal(registry.get(runtime.providerId), runtime);
  assert.equal(registry.has(runtime.providerId), true);
  assert.equal(registry.getHealth(runtime.providerId).state, 'UNKNOWN');
}
assert.equal(sourceReads, 0, 'construction and discovery must not read injected security stores');
// These memory probes describe configuration, not remote availability.
for (const [runtime] of pairs.slice(0, 6)) assert.equal((await registry.runHealthProbe(runtime.providerId)).state, 'HEALTHY');
assert.equal(memory.createHostMemoryIntakeSourceAdapterV010(config).pull({contractVersion: '0.1.0', context}).records.length, 1);
assert.equal((await credential.getBearerToken({packageId: 'synthetic', audience: 'synthetic'})), 'synthetic-token');
assert.equal(sourceReads, 0);
assertNoGuardedResourceAttempts();
