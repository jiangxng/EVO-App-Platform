import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fork} from 'node:child_process';
import {createEncryptedFileSecretStoreV010} from '../../dist/manager/secret-store.js';

const providers = [{name: 'dlp', packageId: 'remote-context-memory-dlp-provider', id: 'remote.context-memory-dlp', capability: 'context.memory.dlp-classification'},
  {name: 'ec', packageId: 'experience-compiler-memory-intake-provider', id: 'experience-compiler.memory-intake', capability: 'context.memory.intake-source'}];
const context = {contractVersion: '0.1.0', kind: 'PERSONAL', contextId: 'personal:credential-fixture'};
const reference = namespace => ({contractVersion: '0.1.0', namespace, key: 'apiToken', scope: 'INSTALLATION', scopeId: 'default'});
const adminToken = 'synthetic-memory-credential-admin';
async function boot(root, local = false) {
  const child = fork(path.resolve('dist/manager/server.js'), [], {execArgv: [
    '--import', path.resolve('tools/plugin-loading-audit-probe.mjs'),
    '--import', path.resolve('tests/fixtures/memory-credential-host-probe.mjs')],
    env: {PATH: process.env.PATH, PORT: '0', NODE_ENV: 'test', APP_PLATFORM_STARTUP_PROFILE: 'minimal',
      APP_PLATFORM_STATE_FILE: path.join(root, 'state.json'), APP_PLATFORM_MANAGED_SESSION_ENABLED: 'true',
      APP_PLATFORM_BOOTSTRAP_ADMIN_TOKEN: adminToken,
      APP_PLATFORM_AUTHORIZATION_POLICY_JSON: JSON.stringify({contractVersion: '0.1.0', rules: [
        {id: 'synthetic-admin', effect: 'ALLOW', actions: ['secret.value.manage', 'provider.health.probe', 'provider.binding.update'], subjectIds: ['bootstrap-admin']}
      ]}),
      APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_MS: '60000', APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_CONTEXTS_JSON: JSON.stringify([context]),
      APP_PLATFORM_MEMORY_DLP_URL: 'https://memory-credential.invalid/dlp',
      APP_PLATFORM_EC_MEMORY_INTAKE_JSON: JSON.stringify({contractVersion: '0.1.0', endpoint: 'https://memory-credential.invalid/ec', source: {sourceId: 'synthetic-ec', trustLevel: 'DECLARED'}}),
      ...(local ? {APP_PLATFORM_MEMORY_INTAKE_JSON: JSON.stringify({contractVersion: '0.1.0', source: {sourceId: 'synthetic-local', sourceType: 'DOCUMENT', trustLevel: 'DECLARED'}, records: []})} : {})
    }, stdio: ['ignore', 'pipe', 'pipe', 'ipc']});
  child.stdout.resume(); let stderr = ''; child.stderr.on('data', part => stderr += part);
  const exited = new Promise(resolve => child.once('exit', resolve)); let timer;
  try {
    const sample = await new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(Error('MEMORY_CREDENTIAL_BOOT_TIMEOUT:' + stderr)), 30000);
      child.once('error', reject); child.once('exit', code => reject(Error('MEMORY_CREDENTIAL_BOOT_EXIT:' + code + ':' + stderr)));
      child.on('message', message => {if (message.kind === 'host-baseline') resolve(message);});
    }).finally(() => clearTimeout(timer));
    assert.equal(sample.blockedOutbound, 0);
    const ipc = (kind, values = {}) => new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const timeout = setTimeout(() => {child.off('message', receive); reject(Error('MEMORY_CREDENTIAL_IPC_TIMEOUT'));}, 5000);
      const receive = message => {if (message.id === id) {clearTimeout(timeout); child.off('message', receive); resolve(message);}};
      child.on('message', receive); child.send({kind, id, ...values});
    });
    const post = async (route, body) => {
      const response = await fetch(`http://127.0.0.1:${sample.port}${route}`, {method: 'POST', headers: {'content-type': 'application/json'},
        body: JSON.stringify(body), signal: AbortSignal.timeout(10000)});
      return {status: response.status, body: await response.json()};
    };
    const action = (code, values) => post('/v1/actions', {contractVersion: '0.1.0', type: 'command', command: {code, inputVersion: '0.1.0'},
      values, sourceInteractionId: 'memory-credential-test', actionId: crypto.randomUUID(), requiresConfirmation: false});
    return {post, ipc, snapshot: () => ipc('memory-credential-snapshot'),
      settings: (provider, settings) => action('app-platform.update-settings', {namespace: provider.packageId, settings}),
      bind: async (capability, providerId) => {
        const result = await action('app-platform.update-provider-binding', {namespace: 'provider-binding:' + capability, settings: {providerId, scope: 'SYSTEM', adminToken}});
        assert.equal(result.status, 200, JSON.stringify(result.body));
      },
      lifecycle: async (operation, provider) => {
        const result = await post('/v1/' + operation, {packageId: provider.packageId, trustApproved: true, approvedPermissions: []});
        assert.equal(result.status, 200, JSON.stringify(result.body));
      },
      async stop() {child.kill('SIGTERM'); const kill = setTimeout(() => child.kill('SIGKILL'), 7000);
        try {assert.equal(await exited, 0, stderr); assert.equal(stderr, '');} finally {clearTimeout(kill);}}
    };
  } catch (error) {child.kill('SIGKILL'); await exited; throw error;}
}
async function log(root) {
  try {return (await fs.readFile(path.join(root, 'context-memory-operations.jsonl'), 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);}
  catch (error) {if (error.code === 'ENOENT') return []; throw error;}
}
async function tick(host, root, count = 3) {
  const before = (await log(root)).length; await host.ipc('memory-credential-fire');
  for (let i = 0; i < 500; i++) {
    const entries = await log(root);
    if (entries.length >= before + count) return entries.slice(before);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw Error('MEMORY_CREDENTIAL_TICK_TIMEOUT');
}

test('real Host decrypts DLP/EC only at use; settings, lifecycle, failures, bindings and restart preserve optional-token semantics', {timeout: 90000}, async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'memory-request-credential-')); let host;
  try {
    const store = createEncryptedFileSecretStoreV010(path.join(root, 'secrets.enc.json'), path.join(root, 'secrets.master.key'));
    for (const provider of providers) await store.put(reference(provider.packageId), 'synthetic-' + provider.name + '-v1');
    const memory = {contractVersion: '0.1.0', memoryId: 'synthetic:memory', context, kind: 'FACT', summary: 'Synthetic retained fact',
      provenance: {contractVersion: '0.1.0', origin: 'DIRECT', sourceContext: context, evidenceRefs: []},
      attribution: {contractVersion: '0.1.0', recordedBySubjectId: 'synthetic', recordedByActorType: 'HUMAN', recordedAt: '2026-10-01T00:00:00.000Z'}};
    await fs.writeFile(path.join(root, 'context-memory.json'), JSON.stringify({contractVersion: '0.1.0', items: [memory]}));
    host = await boot(root); assert.equal((await host.snapshot()).decryptions, 0, 'persisted tokens must not decrypt at startup');
    for (const provider of providers) {
      const result = await host.post('/v1/providers/health/probe', {providerId: provider.id, capability: provider.capability, adminToken});
      assert.equal(result.body.health.state, 'HEALTHY');
      assert.equal((await host.settings(provider, {})).status, 200);
    }
    assert.equal((await host.snapshot()).decryptions, 0, 'configuration probes and ordinary saves are not token use');
    assert.equal((await host.settings(providers[0], {'secret:apiToken': 'synthetic-dlp-denied'})).status, 403);
    await fs.mkdir(path.join(root, 'secrets.enc.json.tmp'));
    assert.equal((await host.settings(providers[1], {'secret:apiToken': 'synthetic-ec-v2', adminToken})).status, 422);
    assert.equal((await host.snapshot()).decryptions, 0);
    await fs.rmdir(path.join(root, 'secrets.enc.json.tmp'));
    for (const provider of providers) assert.equal((await host.settings(provider, {'secret:apiToken': 'synthetic-' + provider.name + '-v2', adminToken})).status, 200);
    assert.equal((await host.snapshot()).decryptions, 0);
    assert.ok(!(await fs.readFile(path.join(root, 'secrets.enc.json'), 'utf8')).includes('synthetic-'));
    await tick(host, root);
    assert.equal((await host.snapshot()).decryptions, 2, 'failed-write gate must recover before any restart');
    assert.deepEqual((await host.snapshot()).revisions, {dlp: 2, ec: 2});
    await host.stop(); host = await boot(root);
    assert.equal((await host.snapshot()).decryptions, 0);
    assert.ok((await tick(host, root)).every(entry => entry.state === 'SUCCEEDED'));
    let sample = await host.snapshot(); assert.equal(sample.decryptions, 2); assert.deepEqual(sample.counts, {dlp: 1, ec: 1});
    await host.ipc('memory-credential-fail', {fail: true});
    assert.ok((await tick(host, root)).some(entry => entry.kind === 'DLP_RECLASSIFICATION' && entry.state === 'FAILED'));
    await host.ipc('memory-credential-fail', {fail: false});
    assert.ok((await tick(host, root)).every(entry => entry.state === 'SUCCEEDED'));
    for (const provider of providers) await host.lifecycle('disable', provider);
    sample = await host.snapshot(); const beforeDisable = sample.decryptions;
    await tick(host, root, 2); assert.equal((await host.snapshot()).decryptions, beforeDisable);
    await host.stop(); host = await boot(root);
    assert.equal((await host.snapshot()).decryptions, 0); await tick(host, root, 2); assert.equal((await host.snapshot()).decryptions, 0);
    for (const provider of providers) await host.lifecycle('enable', provider);
    assert.equal((await host.snapshot()).decryptions, 0); await tick(host, root); assert.equal((await host.snapshot()).decryptions, 2);
    for (const provider of providers) await host.lifecycle('uninstall', provider);
    await tick(host, root, 2); assert.equal((await host.snapshot()).decryptions, 2);
    await host.stop(); host = await boot(root);
    assert.equal((await host.snapshot()).decryptions, 0);
    const unavailable = await tick(host, root, 2);
    assert.ok(unavailable.some(entry => entry.kind === 'DLP_RECLASSIFICATION'
      && entry.state === 'FAILED' && entry.failureCode === 'CONTEXT_MEMORY_DLP_PROVIDER_REQUIRED'));
    assert.equal((await host.snapshot()).decryptions, 0, 'configured but removed providers stay unavailable after restart');
    for (const provider of providers) await host.lifecycle('install', provider);
    assert.equal((await host.snapshot()).decryptions, 0);
    for (const provider of providers) assert.equal((await host.settings(provider, {'secret-remove:apiToken': true, adminToken})).status, 200);
    await tick(host, root); sample = await host.snapshot();
    assert.equal(sample.decryptions, 0); assert.deepEqual(sample.anonymous, {dlp: 1, ec: 1});
    for (const provider of providers) assert.equal((await host.settings(provider, {'secret:apiToken': 'synthetic-' + provider.name + '-v3', adminToken})).status, 200);
    await tick(host, root);
    assert.equal((await host.snapshot()).decryptions, 2, 'newly saved tokens are used without restart');
    assert.deepEqual((await host.snapshot()).revisions, {dlp: 3, ec: 3});
    await host.stop(); host = await boot(root, true); // Add an existing local source for a real binding switch.
    assert.equal((await host.snapshot()).decryptions, 0);
    await host.bind('context.memory.intake-source', providers[1].id);
    await host.bind('context.memory.evidence-source', 'experience-compiler.evidence-source');
    await tick(host, root); sample = await host.snapshot(); assert.equal(sample.decryptions, 2);
    await host.bind('context.memory.intake-source', 'host.memory-intake-source');
    await host.bind('context.memory.evidence-source', 'host.memory-evidence-source');
    await tick(host, root); sample = await host.snapshot(); assert.equal(sample.decryptions, 3); assert.deepEqual(sample.counts, {dlp: 2, ec: 1});
    await host.bind('context.memory.intake-source', providers[1].id);
    await host.bind('context.memory.evidence-source', 'experience-compiler.evidence-source');
    await tick(host, root); assert.equal((await host.snapshot()).decryptions, 5);
  } finally {await host?.stop(); await fs.rm(root, {recursive: true, force: true});}
});
