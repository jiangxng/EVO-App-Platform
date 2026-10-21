import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fork} from 'node:child_process';
import {createPersonalAgentExperienceProfileV010} from '../../dist/manager/local-experience-profile.js';
import {createEncryptedFileSecretStoreV010} from '../../dist/manager/secret-store.js';

const secretFiles = root => ({state: path.join(root, 'secret-boundary', 'state.json'), key: path.join(root, 'secret-boundary', 'key')});
const reference = namespace => ({contractVersion: '0.1.0', namespace, key: 'apiKey', scope: 'INSTALLATION', scopeId: 'default'});
async function boot(root, {minimal = false, forbid = false} = {}) {
  const files = secretFiles(root);
  const profile = createPersonalAgentExperienceProfileV010({PATH: process.env.PATH, NODE_ENV: 'test', PORT: '0',
    APP_PLATFORM_STATE_FILE: path.join(root, 'state.json'), APP_PLATFORM_STARTUP_PROFILE: minimal ? 'minimal' : 'compatible',
    APP_PLATFORM_MANAGED_SESSION_ENABLED: String(minimal), APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_MS: '0',
    APP_PLATFORM_SECRETS_FILE: files.state, APP_PLATFORM_SECRETS_KEY_FILE: files.key,
    TEST_SECRETS_FORBID_ACCESS: String(forbid)});
  const child = fork(path.resolve('dist/manager/server.js'), [], {execArgv: [
    '--import', path.resolve('tools/plugin-loading-audit-probe.mjs'),
    '--import', path.resolve('tests/fixtures/configured-provider-startup-probe.mjs'),
    '--import', path.resolve('tests/fixtures/secrets-file-access-probe.mjs')], env: profile.environment,
    stdio: ['ignore', 'pipe', 'pipe', 'ipc']});
  child.stdout.resume(); let stderr = ''; child.stderr.on('data', part => {stderr += part;});
  const exited = new Promise(resolve => child.once('exit', resolve)); let timer;
  try {
    const sample = await new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(Error('SECRETS_HOST_TIMEOUT:' + stderr)), 30000);
      child.once('error', reject); child.once('exit', code => reject(Error('SECRETS_HOST_EXIT:' + code + ':' + stderr)));
      child.on('message', message => {if (message.kind === 'host-baseline') resolve(message);});
    }).finally(() => clearTimeout(timer));
    assert.equal(sample.blockedOutbound, 0); assert.deepEqual(sample.registeredIntervals, []);
    const post = async (route, body) => {
      const response = await fetch(`http://127.0.0.1:${sample.port}${route}`, {method: 'POST',
        headers: {'content-type': 'application/json'}, body: JSON.stringify(body), signal: AbortSignal.timeout(15000)});
      return {status: response.status, body: await response.json()};
    };
    const snapshot = kind => new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const receive = message => {if (message.id === id) {clearTimeout(timeout); child.off('message', receive); resolve(message);}};
      const timeout = setTimeout(() => {child.off('message', receive); reject(Error('SECRETS_SNAPSHOT_TIMEOUT'));}, 5000);
      child.on('message', receive); child.send({kind, id});
    });
    return {files, post, counts: () => snapshot('secrets-file-access'),
      async lifecycle(operation, packageId) {
        const result = await post('/v1/' + operation, {packageId, trustApproved: true, approvedPermissions: []});
        assert.equal(result.status, 200, JSON.stringify(result.body));
      },
      probe(authorized = true) {return post('/v1/providers/health/probe', {providerId: 'host.encrypted-secrets',
        capability: 'secrets.resolve', ...(authorized ? {adminToken: profile.bootstrapAdminToken} : {})});},
      settings(namespace, values, authorized = true) {return post('/v1/actions', {contractVersion: '0.1.0', type: 'command',
        command: {code: 'app-platform.update-settings', inputVersion: '0.1.0'}, values: {namespace,
          settings: {...values, ...(authorized ? {adminToken: profile.bootstrapAdminToken} : {})}},
        sourceInteractionId: 'secret-initialization-regression', actionId: 'save', requiresConfirmation: false});},
      async stop() {
        try {assert.equal((await snapshot('configured-provider-snapshot')).requests, 0);} finally {
          child.kill('SIGTERM'); const kill = setTimeout(() => child.kill('SIGKILL'), 7000);
          try {assert.equal(await exited, 0, stderr); assert.equal(stderr, '');} finally {clearTimeout(kill);}
        }
      }
    };
  } catch (error) {child.kill('SIGKILL'); await exited; throw error;}
}

for (const malformed of [false, true]) test('minimal without Secret consumers ignores ' + (malformed ? 'corrupt' : 'missing') + ' key/state paths', {timeout: 60000}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'secrets-minimal-')); let host;
  const files = secretFiles(root);
  try {
    if (malformed) {fs.mkdirSync(path.dirname(files.state)); fs.writeFileSync(files.state, '{invalid-state'); fs.writeFileSync(files.key, 'invalid-key');}
    for (let restart = 0; restart < 2; restart++) {
      host = await boot(root, {minimal: true, forbid: true});
      assert.deepEqual((await host.counts()).accesses, []);
      assert.equal((await host.probe(false)).status, 403);
      assert.equal((await host.probe()).status, 404);
      assert.deepEqual((await host.counts()).accesses, []); assert.equal((await host.counts()).decryptions, 0);
      if (malformed) {assert.equal(fs.readFileSync(files.state, 'utf8'), '{invalid-state'); assert.equal(fs.readFileSync(files.key, 'utf8'), 'invalid-key');}
      else assert.equal(fs.existsSync(path.dirname(files.state)), false);
      await host.stop(); host = undefined;
    }
  } finally {await host?.stop(); fs.rmSync(root, {recursive: true, force: true});}
});

test('authorized first health probe rejects bad state without key creation, then same Host recovers', {timeout: 60000}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'secrets-probe-repair-')); let host;
  const files = secretFiles(root);
  try {
    fs.mkdirSync(path.dirname(files.state)); fs.writeFileSync(files.state, '{invalid-state');
    host = await boot(root, {minimal: true}); await host.lifecycle('install', 'host-encrypted-secrets-provider');
    assert.deepEqual((await host.counts()).accesses, []);
    assert.equal((await host.probe(false)).status, 403); assert.deepEqual((await host.counts()).accesses, []);
    const failed = await host.probe(); assert.equal(failed.status, 200); assert.equal(failed.body.health.state, 'UNAVAILABLE');
    assert.equal(fs.readFileSync(files.state, 'utf8'), '{invalid-state'); assert.equal(fs.existsSync(files.key), false);
    const repaired = '{"contractVersion":"0.1.0","records":{}}'; fs.writeFileSync(files.state, repaired);
    assert.equal((await host.probe()).body.health.state, 'HEALTHY'); assert.equal(fs.existsSync(files.key), true);
    assert.equal(fs.readFileSync(files.state, 'utf8'), repaired); assert.equal((await host.counts()).decryptions, 0);
  } finally {await host?.stop(); fs.rmSync(root, {recursive: true, force: true});}
});

test('first authorized save shares one key across consumers; lifecycle and restart preserve ciphertext without decrypting', {timeout: 90000}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'secrets-first-save-')); let host;
  const files = secretFiles(root), packages = ['openai-llm-provider', 'deepseek-llm-provider'];
  try {
    host = await boot(root); assert.deepEqual((await host.counts()).accesses, []);
    for (const packageId of packages) await host.lifecycle('install', packageId);
    const before = await host.counts();
    const denied = await host.settings(packages[0], {'secret:apiKey': 'synthetic-denied'}, false);
    assert.equal(denied.status, 403); assert.deepEqual((await host.counts()).accesses, before.accesses);
    assert.equal(fs.existsSync(files.key), false);
    const saved = await Promise.all(packages.map((packageId, i) => host.settings(packageId, {'secret:apiKey': 'synthetic-saved-' + i})));
    for (const result of saved) {assert.equal(result.status, 200, JSON.stringify(result.body)); assert.equal(result.body.ok, true); assert.equal(JSON.stringify(result.body).includes('synthetic-saved-'), false);}
    const key = fs.readFileSync(files.key), state = fs.readFileSync(files.state);
    assert.equal((await host.counts()).decryptions, 0); assert.doesNotMatch(state.toString(), /synthetic-saved-/);
    await host.lifecycle('disable', packages[0]); await host.lifecycle('uninstall', packages[0]);
    assert.deepEqual(fs.readFileSync(files.key), key); assert.deepEqual(fs.readFileSync(files.state), state);
    await host.stop(); host = undefined; host = await boot(root);
    const counts = await host.counts();
    assert.equal(counts.accesses.filter(x => x.operation === 'readFileSync' && x.target === 'key').length, 1);
    assert.equal(counts.accesses.filter(x => x.operation === 'readFileSync' && x.target === 'state').length, 1);
    assert.equal(counts.accesses.filter(x => ['writeFileSync', 'renameSync', 'chmodSync', 'mkdirSync'].includes(x.operation)).length, 0);
    assert.equal(counts.decryptions, 0); assert.deepEqual(fs.readFileSync(files.key), key); assert.deepEqual(fs.readFileSync(files.state), state);
    const store = createEncryptedFileSecretStoreV010(files.state, files.key);
    for (let i = 0; i < packages.length; i++) assert.equal(store.resolve(reference(packages[i])), 'synthetic-saved-' + i);
    const audit = fs.readFileSync(path.join(root, 'secret-audit.jsonl'), 'utf8');
    assert.equal(audit.trim().split('\n').map(JSON.parse).filter(x => x.outcome === 'ALLOWED' && x.action === 'PUT_SECRET').length, 2);
    assert.doesNotMatch(audit, /synthetic-saved-|synthetic-denied/);
  } finally {await host?.stop(); fs.rmSync(root, {recursive: true, force: true});}
});
