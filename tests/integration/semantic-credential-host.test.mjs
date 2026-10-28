import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fork} from 'node:child_process';
import {createEncryptedFileSecretStoreV010} from '../../dist/manager/secret-store.js';
import {createPersonalAgentExperienceProfileV010} from '../../dist/manager/local-experience-profile.js';

const packageId = 'remote-context-memory-semantic-provider', providerId = 'remote.context-memory-semantic';
const capability = 'context.memory.semantic-retrieval';
const reference = {contractVersion: '0.1.0', namespace: packageId, key: 'apiToken', scope: 'INSTALLATION', scopeId: 'default'};
async function boot(root) {
  const profile = createPersonalAgentExperienceProfileV010({PATH: process.env.PATH, PORT: '0', NODE_ENV: 'test',
    APP_PLATFORM_STARTUP_PROFILE: 'compatible',
    APP_PLATFORM_STATE_FILE: path.join(root, 'state.json'), APP_PLATFORM_MANAGED_SESSION_ENABLED: 'false',
    APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_MS: '0', APP_PLATFORM_MEMORY_SEMANTIC_URL: 'https://semantic-credential.invalid/query'});
  const child = fork(path.resolve('dist/manager/server.js'), [], {execArgv: [
    '--import', path.resolve('tools/plugin-loading-audit-probe.mjs'),
    '--import', path.resolve('tests/fixtures/semantic-credential-host-probe.mjs')], env: profile.environment,
    stdio: ['ignore', 'pipe', 'pipe', 'ipc']});
  child.stdout.resume(); let stderr = ''; child.stderr.on('data', part => stderr += part);
  const exited = new Promise(resolve => child.once('exit', resolve)); let timer;
  try {
    const sample = await new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(Error('SEMANTIC_BOOT_TIMEOUT:' + stderr)), 30000);
      child.once('error', reject); child.once('exit', code => reject(Error('SEMANTIC_BOOT_EXIT:' + code + ':' + stderr)));
      child.on('message', message => {if (message.kind === 'host-baseline') resolve(message);});
    }).finally(() => clearTimeout(timer));
    assert.equal(sample.blockedOutbound, 0);
    const call = async (route, body) => {
      const response = await fetch(`http://127.0.0.1:${sample.port}${route}`, {method: body === undefined ? 'GET' : 'POST',
        headers: {'content-type': 'application/json'}, ...(body === undefined ? {} : {body: JSON.stringify(body)}), signal: AbortSignal.timeout(10000)});
      return {status: response.status, body: await response.json()};
    };
    const action = (code, values) => call('/v1/actions', {contractVersion: '0.1.0', type: 'command',
      command: {code, inputVersion: '0.1.0'}, values, sourceInteractionId: 'semantic-credential-test', actionId: crypto.randomUUID(), requiresConfirmation: false});
    return {call, adminToken: profile.bootstrapAdminToken,
      settings: values => action('app-platform.update-settings', {namespace: packageId, settings: values}),
      bind: () => action('app-platform.update-provider-binding', {namespace: 'provider-binding:' + capability,
        settings: {providerId, scope: 'SYSTEM', adminToken: profile.bootstrapAdminToken}}),
      lifecycle: async operation => {
        const result = await call('/v1/' + operation, {packageId, trustApproved: true, approvedPermissions: []});
        assert.equal(result.status, 200, JSON.stringify(result.body));
      },
      page: () => call('/v1/experience-pages?source=' + encodeURIComponent('app://evo-app-platform/pages/memory/search')),
      snapshot: () => new Promise((resolve, reject) => {
        const id = crypto.randomUUID();
        const timeout = setTimeout(() => {child.off('message', receive); reject(Error('SEMANTIC_SNAPSHOT_TIMEOUT'));}, 5000);
        const receive = message => {if (message.id === id) {clearTimeout(timeout); child.off('message', receive); resolve(message);}};
        child.on('message', receive); child.send({kind: 'semantic-credential-snapshot', id});
      }),
      async stop() {child.kill('SIGTERM'); const kill = setTimeout(() => child.kill('SIGKILL'), 7000);
        try {assert.equal(await exited, 0, stderr); assert.equal(stderr, '');} finally {clearTimeout(kill);}}
    };
  } catch (error) {child.kill('SIGKILL'); await exited; throw error;}
}
async function zero(host) {
  const snapshot = await host.snapshot(); assert.equal(snapshot.decryptions, 0); assert.equal(snapshot.requests, 0);
}
async function lexicalPage(host) {
  const page = await host.page(); assert.equal(page.status, 200, JSON.stringify(page.body));
  assert.deepEqual(page.body.items.map(item => item.id), ['synthetic:semantic-memory']);
  await zero(host);
}

test('real Host semantic discovery, persisted disabled/active restarts, settings and original lexical page never decrypt tokens', {timeout: 90000}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'semantic-host-credential-')); let host;
  try {
    const secrets = createEncryptedFileSecretStoreV010(path.join(root, 'secrets.enc.json'), path.join(root, 'secrets.master.key'));
    secrets.put(reference, 'synthetic-semantic-v1');
    const context = {contractVersion: '0.1.0', kind: 'PERSONAL', contextId: 'personal:experience-user'};
    const memory = {contractVersion: '0.1.0', memoryId: 'synthetic:semantic-memory', context, kind: 'FACT', summary: 'Synthetic semantic boundary fact',
      provenance: {contractVersion: '0.1.0', origin: 'DIRECT', sourceContext: context, evidenceRefs: []},
      attribution: {contractVersion: '0.1.0', recordedBySubjectId: 'experience-user', recordedByActorType: 'HUMAN', recordedAt: '2026-10-01T00:00:00.000Z'}};
    fs.writeFileSync(path.join(root, 'context-memory.json'), JSON.stringify({contractVersion: '0.1.0', items: [memory]}));
    host = await boot(root); await zero(host); await lexicalPage(host);
    const probe = await host.call('/v1/providers/health/probe', {providerId, capability, adminToken: host.adminToken});
    assert.equal(probe.body.health.state, 'HEALTHY'); await zero(host);
    assert.equal((await host.settings({})).status, 200); await zero(host);
    assert.equal((await host.settings({'secret:apiToken': 'synthetic-semantic-denied'})).status, 403);
    fs.mkdirSync(path.join(root, 'secrets.enc.json.tmp'));
    assert.equal((await host.settings({'secret:apiToken': 'synthetic-semantic-v2', adminToken: host.adminToken})).status, 422);
    fs.rmdirSync(path.join(root, 'secrets.enc.json.tmp'));
    assert.equal((await host.settings({'secret:apiToken': 'synthetic-semantic-v2', adminToken: host.adminToken})).status, 200);
    await lexicalPage(host); assert.equal((await host.bind()).status, 200); await zero(host);
    await host.lifecycle('disable'); await lexicalPage(host);
    await host.stop(); host = await boot(root); await zero(host); await lexicalPage(host);
    assert.equal((await host.call('/v1/providers/health/probe', {providerId, capability, adminToken: host.adminToken})).body.error.code, 'PROVIDER_NOT_ACTIVE');
    await host.lifecycle('enable'); await lexicalPage(host);
    await host.lifecycle('uninstall'); await lexicalPage(host);
    await host.lifecycle('install'); await lexicalPage(host);
    assert.equal((await host.settings({'secret-remove:apiToken': true, adminToken: host.adminToken})).status, 200);
    await zero(host);
    assert.equal((await host.settings({'secret:apiToken': 'synthetic-semantic-v3', adminToken: host.adminToken})).status, 200);
    await host.stop(); host = await boot(root); await lexicalPage(host);
    assert.ok(!fs.readFileSync(path.join(root, 'secrets.enc.json'), 'utf8').includes('synthetic-semantic'));
  } finally {await host?.stop(); fs.rmSync(root, {recursive: true, force: true});}
});
