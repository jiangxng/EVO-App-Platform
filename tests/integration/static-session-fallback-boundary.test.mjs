import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fork} from 'node:child_process';

const packageId = 'host-static-session-provider';
const compatibilityActor = 'synthetic-compatibility-must-not-replace-configured-user';
const session = subjectId => ({contractVersion: '0.1.0', sessionId: 'synthetic-session:' + subjectId,
  principal: {contractVersion: '0.1.0', subjectId, actorType: 'HUMAN', identityProviderId: 'synthetic.identity'},
  issuedAt: '2026-10-01T00:00:00.000Z'});
const staticSession = session('synthetic-static-user');
async function boot(root, {configured = false, bindings = [], bearer = false} = {}) {
  const bindingFile = path.join(root, 'provider-bindings.json');
  fs.writeFileSync(bindingFile, JSON.stringify({contractVersion: '0.1.0', bindings}));
  const child = fork(path.resolve('dist/manager/server.js'), [], {execArgv: [
    '--import', path.resolve('tools/plugin-loading-audit-probe.mjs'),
    '--import', path.resolve('tests/fixtures/configured-provider-startup-probe.mjs')],
    env: {PATH: process.env.PATH, NODE_ENV: 'test', PORT: '0',
      APP_PLATFORM_STATE_FILE: path.join(root, 'state.json'), APP_PLATFORM_STARTUP_PROFILE: 'compatible',
      APP_PLATFORM_MANAGED_SESSION_ENABLED: 'false', APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_MS: '0',
      APP_PLATFORM_PROVIDER_BINDINGS_FILE: bindingFile, EVO_ACTOR_ID: compatibilityActor, EVO_ACTOR_TYPE: 'HUMAN',
      ...(configured ? {APP_PLATFORM_STATIC_SESSION_JSON: JSON.stringify(staticSession)} : {}),
      ...(bearer ? {APP_PLATFORM_BEARER_SESSIONS_JSON: JSON.stringify({contractVersion: '0.1.0',
        sessions: [{token: 'synthetic-request-token', session: session('synthetic-request-user')}]})} : {})},
    stdio: ['ignore', 'pipe', 'pipe', 'ipc']});
  child.stdout.resume(); let stderr = ''; child.stderr.on('data', chunk => {stderr += chunk;});
  const exited = new Promise(resolve => child.once('exit', resolve)); let timer;
  try {
    const sample = await new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(Error('STATIC_SESSION_BOOT_TIMEOUT:' + stderr)), 30000);
      child.once('error', reject); child.once('exit', code => reject(Error('STATIC_SESSION_BOOT_EXIT:' + code + ':' + stderr)));
      child.on('message', message => {if (message.kind === 'host-baseline') resolve(message);});
    }).finally(() => clearTimeout(timer));
    assert.equal(sample.blockedOutbound, 0);
    const request = async (route = '/v1/contexts/effective', headers = {}) => {
      const response = await fetch(`http://127.0.0.1:${sample.port}${route}`, {headers, signal: AbortSignal.timeout(10000)});
      return {status: response.status, body: await response.json()};
    };
    return {request,
      state: () => JSON.parse(fs.readFileSync(path.join(root, 'state.json'), 'utf8')),
      async lifecycle(operation) {
        const response = await fetch(`http://127.0.0.1:${sample.port}/v1/${operation}`, {method: 'POST',
          headers: {'content-type': 'application/json'}, body: JSON.stringify({packageId, trustApproved: true, approvedPermissions: []}),
          signal: AbortSignal.timeout(10000)});
        assert.equal(response.status, 200, JSON.stringify(await response.json()));
      },
      snapshot: () => new Promise((resolve, reject) => {
        const id = crypto.randomUUID();
        const receive = message => {if (message.id === id) {clearTimeout(timeout); child.off('message', receive); resolve(message);}};
        const timeout = setTimeout(() => {child.off('message', receive); reject(Error('STATIC_SESSION_SNAPSHOT_TIMEOUT'));}, 5000);
        child.on('message', receive); child.send({kind: 'configured-provider-snapshot', id});
      }),
      async stop() {
        try {assert.equal((await this.snapshot()).requests, 0);} finally {
          child.kill('SIGTERM'); const kill = setTimeout(() => child.kill('SIGKILL'), 7000);
          try {assert.equal(await exited, 0, stderr); assert.equal(stderr, '');} finally {clearTimeout(kill);}
        }
      }
    };
  } catch (error) {child.kill('SIGKILL'); await exited; throw error;}
}
async function assertUnavailable(host) {
  for (const route of ['/v1/contexts/effective', '/v1/web-performance/diagnostics']) {
    const result = await host.request(route);
    assert.equal(result.status, 503, JSON.stringify(result.body));
    assert.equal(result.body.code, 'AUTHENTICATION_UNAVAILABLE');
    for (const identity of [compatibilityActor, staticSession.principal.subjectId, 'host.compatibility-local']) {
      assert.equal(JSON.stringify(result.body).includes(identity), false);
    }
  }
}
async function assertPrincipal(host, expected, headers) {
  const result = await host.request('/v1/contexts/effective', headers);
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.equal(result.body.session.principal.subjectId, expected);
  return result.body.session;
}

test('unconfigured compatible Host retains its original local identity', {timeout: 30000}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'static-session-legacy-')); let host;
  try {
    host = await boot(root);
    assert.equal((await assertPrincipal(host, compatibilityActor)).principal.identityProviderId, 'host.compatibility-local');
  } finally {await host?.stop(); fs.rmSync(root, {recursive: true, force: true});}
});

test('configured static identity fails closed across HTTP disable/restart/uninstall and explicit recovery', {timeout: 90000}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'static-session-lifecycle-')); let host;
  try {
    host = await boot(root, {configured: true}); await assertPrincipal(host, staticSession.principal.subjectId);
    await host.lifecycle('disable'); await assertUnavailable(host); await host.stop(); host = undefined;
    host = await boot(root, {configured: true});
    assert.equal(host.state().activeFeatures.some(item => item.packageId === packageId), false);
    await assertUnavailable(host);
    await host.lifecycle('enable'); await assertPrincipal(host, staticSession.principal.subjectId);
    await host.lifecycle('uninstall'); await assertUnavailable(host);
    await host.lifecycle('install'); await assertPrincipal(host, staticSession.principal.subjectId);
  } finally {await host?.stop(); fs.rmSync(root, {recursive: true, force: true});}
});

for (const [scope, scopeId, applies] of [['SYSTEM', undefined, true], ['INSTALLATION', 'default', true],
  ['INSTALLATION', 'other-installation', false], ['ENTERPRISE', 'other-enterprise', false]]) {
  test('static identity binding applicability: ' + scope + ':' + (scopeId ?? 'system'), {timeout: 30000}, async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'static-session-binding-')); let host;
    try {
      host = await boot(root, {bindings: [{contractVersion: '0.1.0', capability: 'identity.session',
        providerId: 'synthetic-selected-missing', scope, ...(scopeId ? {scopeId} : {})}]});
      if (applies) await assertUnavailable(host);
      else await assertPrincipal(host, compatibilityActor);
    } finally {await host?.stop(); fs.rmSync(root, {recursive: true, force: true});}
  });
}

test('active request-bound Bearer remains authoritative while configured static provider is disabled', {timeout: 30000}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'static-session-request-priority-')); let host;
  try {
    host = await boot(root, {configured: true, bearer: true}); await host.lifecycle('disable');
    await assertPrincipal(host, 'synthetic-request-user', {authorization: 'Bearer synthetic-request-token'});
    for (const headers of [{}, {authorization: 'Bearer synthetic-invalid-token'}]) {
      const denied = await host.request('/v1/contexts/effective', headers);
      assert.equal(denied.status, 401); assert.equal(denied.body.code, 'AUTHENTICATION_REQUIRED');
    }
  } finally {await host?.stop(); fs.rmSync(root, {recursive: true, force: true});}
});
