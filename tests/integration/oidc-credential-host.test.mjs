import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fork} from 'node:child_process';
import {createEncryptedFileSecretStoreV010} from '../../dist/manager/secret-store.js';
import {createPersonalAgentExperienceProfileV010} from '../../dist/manager/local-experience-profile.js';

const packageId = 'generic-oidc-identity-provider', providerId = 'generic.oidc', issuer = 'https://oidc-credential.invalid';
const reference = {contractVersion: '0.1.0', namespace: packageId, key: 'clientSecret', scope: 'INSTALLATION', scopeId: 'default'};
async function boot(root, managed = false) {
  const profile = createPersonalAgentExperienceProfileV010({PATH: process.env.PATH, PORT: '0', NODE_ENV: 'test',
    APP_PLATFORM_STATE_FILE: path.join(root, 'state.json'), APP_PLATFORM_MANAGED_SESSION_ENABLED: String(managed),
    APP_PLATFORM_PUBLIC_BASE_URL: 'https://oidc-host.invalid', APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_MS: '0'});
  const child = fork(path.resolve('dist/manager/server.js'), [], {execArgv: [
    '--import', path.resolve('tools/plugin-loading-audit-probe.mjs'),
    '--import', path.resolve('tests/fixtures/oidc-credential-host-probe.mjs')], env: profile.environment,
    stdio: ['ignore', 'pipe', 'pipe', 'ipc']});
  child.stdout.resume(); let stderr = ''; child.stderr.on('data', data => {stderr += data;});
  const exit = new Promise(resolve => child.once('exit', resolve)); let timer;
  try {
    const sample = await new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(Error('OIDC_HOST_BOOT_TIMEOUT:' + stderr)), 30000);
      child.once('error', reject); child.once('exit', code => reject(Error('OIDC_HOST_BOOT_EXIT:' + code + ':' + stderr)));
      child.on('message', message => {if (message.kind === 'host-baseline') resolve(message);});
    }).finally(() => clearTimeout(timer));
    assert.equal(sample.blockedOutbound, 0);
    const call = async (route, body, cookie) => {
      const response = await fetch(`http://127.0.0.1:${sample.port}${route}`, {method: body === undefined ? 'GET' : 'POST',
        redirect: 'manual', signal: AbortSignal.timeout(15000), headers: {'content-type': 'application/json',
          ...(cookie ? {cookie, origin: 'https://oidc-host.invalid'} : {})},
        ...(body === undefined ? {} : {body: JSON.stringify(body)})});
      const text = await response.text(); let value; try {value = JSON.parse(text);} catch {value = text;}
      return {status: response.status, body: value, location: response.headers.get('location'), cookie: response.headers.get('set-cookie')};
    };
    const action = (code, values, cookie) => call('/v1/actions', {contractVersion: '0.1.0', type: 'command',
      command: {code, inputVersion: '0.1.0'}, values, sourceInteractionId: 'oidc-credential-test',
      actionId: crypto.randomUUID(), requiresConfirmation: false}, cookie);
    const ipc = message => new Promise((resolve, reject) => {
      const id = crypto.randomUUID(); const timer = setTimeout(() => {child.off('message', receive); reject(Error('OIDC_IPC_TIMEOUT'));}, 5000);
      const receive = reply => {if (reply.id === id) {clearTimeout(timer); child.off('message', receive); resolve(reply);}};
      child.on('message', receive); child.send({...message, id});
    });
    return {call, adminToken: profile.bootstrapAdminToken,
      settings: (settings, cookie) => action('app-platform.update-settings', {namespace: packageId, settings}, cookie),
      bind: (id = providerId, cookie, priority = 0) => action('app-platform.update-provider-binding', {namespace: 'provider-binding:identity.authenticate',
        settings: {providerId: id, scope: 'SYSTEM', priority, adminToken: profile.bootstrapAdminToken}}, cookie),
      lifecycle: async operation => {const result = await call('/v1/' + operation, {packageId, trustApproved: true, approvedPermissions: []});
        assert.equal(result.status, 200, JSON.stringify(result.body));},
      snapshot: () => ipc({kind: 'oidc-credential-snapshot'}),
      hold: value => ipc({kind: 'oidc-hold', value}),
      held: () => new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {child.off('message', receive); reject(Error('OIDC_HOLD_TIMEOUT'));}, 5000);
        const receive = message => {if (message.kind === 'oidc-token-held') {clearTimeout(timeout); child.off('message', receive); resolve();}};
        child.on('message', receive);
      }),
      async begin() {const start = await call('/auth/login'); assert.equal(start.status, 302, JSON.stringify(start.body));
        const url = new URL(start.location); return '/auth/callback?state=' + encodeURIComponent(url.searchParams.get('state'))
          + '&code=' + encodeURIComponent(url.searchParams.get('nonce'));},
      async stop() {child.kill('SIGTERM'); const kill = setTimeout(() => child.kill('SIGKILL'), 7000);
        try {assert.equal(await exit, 0, stderr); assert.equal(stderr, '');} finally {clearTimeout(kill);}}
    };
  } catch (error) {child.kill('SIGKILL'); await exit; throw error;}
}

test('real Host OIDC keeps unused Secrets encrypted; authenticates on use and rejects lifecycle/binding late callbacks', {timeout: 120000}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'oidc-host-credential-')); let host;
  const zero = async () => {const s = await host.snapshot(); assert.equal(s.decryptions, 0); assert.equal(s.tokens, 0);};
  try {
    createEncryptedFileSecretStoreV010(path.join(root, 'secrets.enc.json'), path.join(root, 'secrets.master.key')).put(reference, 'synthetic-oidc-v1');
    host = await boot(root); await zero();
    await host.lifecycle('install');
    assert.equal((await host.settings({issuer, clientId: 'synthetic-client'})).status, 200); await zero();
    assert.equal((await host.settings({'secret:clientSecret': 'synthetic-oidc-v2'})).status, 403); await zero();
    assert.equal((await host.bind()).status, 200); await host.lifecycle('disable');
    await host.stop(); host = await boot(root, true); await zero();
    assert.equal((await host.call('/auth/login')).status, 503); await zero();
    await host.lifecycle('enable'); await zero();
    const callback = await host.begin(); await zero();
    const completed = await host.call(callback); assert.equal(completed.status, 303, JSON.stringify(completed.body));
    assert.match(completed.cookie, /^__Host-evo_session=/); const cookie = completed.cookie.split(';')[0];
    assert.equal((await host.snapshot()).decryptions, 1);
    const replay = await host.call(callback); assert.notEqual(replay.status, 303); assert.equal(replay.cookie, null);
    const before = await host.snapshot();
    assert.equal((await host.settings({'secret:clientSecret': 'synthetic-oidc-v2', adminToken: host.adminToken}, cookie)).status, 200);
    assert.equal((await host.snapshot()).decryptions, before.decryptions);
    assert.equal((await host.call(await host.begin())).status, 303);
    assert.equal((await host.snapshot()).decryptions, before.decryptions + 1);
    const stale = await host.begin(); await host.lifecycle('disable'); await host.lifecycle('enable');
    const staleResult = await host.call(stale); assert.equal(staleResult.status, 503); assert.equal(staleResult.cookie, null);
    const count = (await host.snapshot()).decryptions;
    const old = await host.begin(); await host.hold(true); const entered = host.held(); const pending = host.call(old); await entered;
    assert.equal((await host.bind(providerId, cookie, 1)).status, 200);
    assert.equal((await host.bind(providerId, cookie)).status, 200);
    await host.hold(false); const late = await pending;
    assert.equal(late.status, 503); assert.equal(late.cookie, null);
    assert.equal((await host.snapshot()).decryptions, count + 1);
    assert.equal((await host.call(await host.begin())).status, 303);
    assert.equal((await host.settings({'secret-remove:clientSecret': true, adminToken: host.adminToken}, cookie)).status, 200);
    const publicBefore = (await host.snapshot()).decryptions;
    assert.equal((await host.call(await host.begin())).status, 303);
    assert.equal((await host.snapshot()).decryptions, publicBefore);
    await host.lifecycle('disable'); await host.stop(); host = await boot(root, true); await zero();
    assert.equal((await host.call('/auth/login')).status, 503); await zero();
    assert.ok(!fs.readFileSync(path.join(root, 'secrets.enc.json'), 'utf8').includes('synthetic-oidc'));
  } finally {await host?.stop(); fs.rmSync(root, {recursive: true, force: true});}
});
