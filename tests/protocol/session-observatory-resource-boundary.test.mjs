import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHostManagedSessionProviderV010, createHostManagedSessionHealthProbeV010} from '../../dist/providers/managed-session/runtime.js';
import {createEvoRuntimeObservatoryProviderV020, createEvoRuntimeObservatoryHealthProbeV010} from '../../dist/providers/evo-runtime-observatory/runtime.js';
import {createGenericOidcIdentityAuthenticationProviderV010} from '../../dist/providers/oidc/runtime.js';
import {configureGenericOidcProviderRuntimeV010} from '../../dist/providers/oidc/host-runtime.js';
import {createProviderRuntimeRegistry} from '../../dist/providers/runtime-registry.js';

test('session/OIDC/EVO imports, configured factories and registry discovery attempt no guarded resources', () => {
  const env = {...process.env}; delete env.NODE_TEST_CONTEXT;
  execFileSync(process.execPath, [fileURLToPath(new URL('../fixtures/session-observatory-construction-probe.mjs', import.meta.url))],
    {env, stdio: ['ignore', 'ignore', 'inherit'], timeout: 15000});
});

test('managed adapter defers shared service calls, observes revocation and does not own its lifetime', () => {
  let reads = 0, probes = 0, revoked = false;
  const session = {sessionId: 'synthetic'};
  const service = {resolveToken(token) { reads++; assert.equal(token, 'token'); return revoked ? undefined : session; },
    list() { probes++; return []; }};
  const runtime = createHostManagedSessionProviderV010(service), probe = createHostManagedSessionHealthProbeV010(service);
  assert.equal(reads + probes, 0);
  assert.equal(runtime.resolve({sessionToken: 'a', bearerToken: 'b'}), undefined);
  assert.equal(runtime.resolve({}), undefined);
  assert.equal(reads, 0);
  assert.equal(runtime.resolve({sessionToken: ' token '}), session);
  revoked = true;
  assert.equal(runtime.resolve({bearerToken: 'token'}), undefined);
  assert.equal(reads, 2); assert.equal(probes, 0);
  assert.equal(probe().state, 'HEALTHY'); assert.equal(probes, 1);
});

test('EVO mapping/query and reachability probe run only on explicit use and recover without replay', async () => {
  let mapping, mappingReads = 0, fail = false;
  const calls = [];
  const options = {baseUrl: 'https://observatory.invalid/', resolveEnterpriseCode() { mappingReads++; return mapping; },
    fetchImpl: async url => { calls.push(String(url)); if (fail) throw Error('synthetic-outage');
      return new Response(JSON.stringify({id: 'synthetic-enterprise'})); }};
  const runtime = createEvoRuntimeObservatoryProviderV020(options), probe = createEvoRuntimeObservatoryHealthProbeV010(options);
  const request = {contractVersion: '0.2.0', enterpriseId: 'synthetic-host', metricCodes: ['unsupported'], resolvedTargets: []};
  assert.equal(mappingReads, 0); assert.deepEqual(calls, []);
  await assert.rejects(runtime.query(request), /EVO_OBSERVATORY_ENTERPRISE_MAPPING_REQUIRED/);
  assert.deepEqual(calls, []);
  mapping = 'synthetic-code'; fail = true;
  await assert.rejects(runtime.query(request), /synthetic-outage/);
  assert.equal(calls.length, 1);
  assert.equal((await probe()).state, 'UNAVAILABLE'); assert.equal(calls.length, 2);
  fail = false;
  assert.deepEqual(await runtime.query(request), []);
  assert.equal((await probe()).state, 'HEALTHY');
  assert.deepEqual(calls, ['https://observatory.invalid/api/v1/enterprises/synthetic-code',
    'https://observatory.invalid/health/ready', 'https://observatory.invalid/api/v1/enterprises/synthetic-code',
    'https://observatory.invalid/health/ready']);
  assert.equal(mappingReads, 3);
});

test('OIDC configured refresh does not read Secret or start discovery; absence removes the runtime', async () => {
  const registry = createProviderRuntimeRegistry(); let describes = 0, resolves = 0, requests = 0;
  const input = {settings: {issuer: 'https://authority.invalid', clientId: 'synthetic'}, registry,
    fetchImpl: async () => { requests++; throw Error('unexpected-network'); },
    secrets: {describe() { describes++; return {configured: true}; }, resolve() { resolves++; return 'synthetic-secret'; }}};
  assert.equal((await configureGenericOidcProviderRuntimeV010(input)).configured, true);
  assert.equal(describes, 0); assert.equal(resolves, 0); assert.equal(requests, 0);
  await configureGenericOidcProviderRuntimeV010({...input, settings: {}});
  assert.equal(registry.has('generic.oidc'), false);
  assert.equal(describes, 0); assert.equal(resolves, 0); assert.equal(requests, 0);
});

test('OIDC discovery deadline includes response body; abort releases timer and new explicit login recovers', async t => {
  const active = new Set(), delays = [];
  t.mock.method(globalThis, 'setTimeout', (callback, delay) => { const timer = {callback}; active.add(timer); delays.push(delay); return timer; });
  t.mock.method(globalThis, 'clearTimeout', timer => assert.equal(active.delete(timer), true));
  let enterBody, block = true, calls = 0, signal;
  const entered = new Promise(resolve => { enterBody = resolve; });
  const issuer = 'https://authority.invalid';
  const runtime = createGenericOidcIdentityAuthenticationProviderV010({issuer, clientId: 'synthetic', fetchImpl: async (_url, init) => {
    calls++; signal = init.signal; assert.equal(init.redirect, 'error');
    return {ok: true, json() {
      if (!block) return {issuer, authorization_endpoint: issuer + '/authorize', token_endpoint: issuer + '/token', jwks_uri: issuer + '/jwks'};
      enterBody();
      return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(Error('synthetic-body-abort')), {once: true}));
    }};
  }});
  const begin = () => runtime.begin({contractVersion: '0.1.0', callbackUrl: 'https://host.invalid/callback', returnTo: '/'});
  const pending = begin(); await entered;
  assert.equal(calls, 1); assert.equal(active.size, 1);
  const rejected = assert.rejects(pending, /synthetic-body-abort/);
  [...active][0].callback(); await rejected;
  assert.equal(signal.aborted, true); assert.equal(active.size, 0); assert.equal(calls, 1);
  block = false; await begin();
  assert.equal(calls, 2); assert.equal(active.size, 0); assert.deepEqual(delays, [8000, 8000]);
});
