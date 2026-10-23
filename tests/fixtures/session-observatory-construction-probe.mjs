import assert from 'node:assert/strict';

// Guard BEFORE evaluating any project module, including supplied fetch ports.
const roots = ['session/runtime', 'request-session/runtime', 'managed-session/runtime',
  'oidc/runtime', 'oidc/host-runtime', 'evo-runtime-observatory/runtime'];
process.argv.splice(2, process.argv.length - 2, 'imports',
  ...roots.map(name => `providers/${name}.js`), 'providers/runtime-registry.js');
const {assertNoGuardedResourceAttempts} = await import('./eog-retained-import-probe.mjs');
const [session, bearer, managed, oidc, host, evo] = await Promise.all(
  roots.map(name => import(`../../dist/providers/${name}.js`)));
const {createProviderRuntimeRegistry} = await import('../../dist/providers/runtime-registry.js');
const registry = createProviderRuntimeRegistry();
let attempts = 0;
const forbidden = () => { attempts++; throw Error('CONSTRUCTION_DEPENDENCY_CALL'); };
const value = {contractVersion: '0.1.0', sessionId: 'synthetic-session', issuedAt: '2026-01-01T00:00:00Z',
  principal: {contractVersion: '0.1.0', subjectId: 'synthetic', actorType: 'HUMAN', identityProviderId: 'synthetic'}};
const staticProvider = session.createHostStaticSessionProviderV010(session.parseHostStaticSessionV010(JSON.stringify(value)));
const entries = bearer.parseHostBearerSessionsV010(JSON.stringify({contractVersion: '0.1.0', sessions: [{token: 'synthetic-token', session: value}]}));
const service = {resolveToken: forbidden, list: forbidden};
const oidcOptions = {issuer: 'https://authority.invalid', clientId: 'synthetic', clientSecret: 'synthetic-secret',
  fetchImpl: forbidden, randomBytesImpl: forbidden};
const evoOptions = {baseUrl: 'https://observatory.invalid', fetchImpl: forbidden,
  resolveEnterpriseCode: forbidden, resolveApplicationId: forbidden};
const pairs = [
  [staticProvider, session.createHostStaticSessionHealthProbeV010(staticProvider)],
  [bearer.createHostBearerSessionProviderV010(entries), bearer.createHostBearerSessionHealthProbeV010(entries)],
  [managed.createHostManagedSessionProviderV010(service), managed.createHostManagedSessionHealthProbeV010(service)],
  [oidc.createGenericOidcIdentityAuthenticationProviderV010(oidcOptions), oidc.createGenericOidcIdentityHealthProbeV010(oidcOptions)],
  [evo.createEvoRuntimeObservatoryProviderV020(evoOptions), evo.createEvoRuntimeObservatoryHealthProbeV010(evoOptions)]
];
for (const [runtime, probe] of pairs) {
  registry.replace(runtime.providerId, runtime);
  registry.setHealthProbe(runtime.providerId, probe);
  assert.equal(registry.get(runtime.providerId), runtime);
  assert.equal(registry.has(runtime.providerId), true);
  assert.equal(registry.getHealth(runtime.providerId).state, 'UNKNOWN');
}
assert.equal(staticProvider.current().sessionId, value.sessionId);
assert.equal(pairs[1][0].resolve({contractVersion: '0.1.0', bearerToken: 'synthetic-token'}).sessionId, value.sessionId);
assert.equal(pairs[2][0].resolve({contractVersion: '0.1.0'}), undefined);
assert.equal(pairs[2][0].resolve({contractVersion: '0.1.0', sessionToken: 'a', bearerToken: 'b'}), undefined);
// Configured Secret providers must also stay untouched during refresh.
await host.configureGenericOidcProviderRuntimeV010({settings: {issuer: oidcOptions.issuer,
  clientId: oidcOptions.clientId}, registry, fetchImpl: forbidden,
  secrets: {describe: forbidden, resolve: forbidden}});
assert.equal(attempts, 0);
assertNoGuardedResourceAttempts();
