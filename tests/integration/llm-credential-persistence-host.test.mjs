import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fork} from 'node:child_process';
import {createPersonalAgentExperienceProfileV010} from '../../dist/manager/local-experience-profile.js';
import {createEncryptedFileSecretStoreV010} from '../../dist/manager/secret-store.js';

const providers = [
  {name: 'openai', packageId: 'openai-llm-provider', id: 'openai.responses', env: 'OPENAI', model: 'gpt-5.6-luna'},
  {name: 'deepseek', packageId: 'deepseek-llm-provider', id: 'deepseek.responses', env: 'DEEPSEEK', model: 'deepseek-flash'}
];
const records = dir => {
  const file = path.join(dir, 'secrets.enc.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).records : {};
};
const reference = namespace => ({contractVersion: '0.1.0', namespace, key: 'apiKey', scope: 'INSTALLATION', scopeId: 'default'});
async function start(directory, legacy = true) {
  const environment = {PATH: process.env.PATH, PORT: '0', NODE_ENV: 'test',
    APP_PLATFORM_STATE_FILE: path.join(directory, 'state.json'),
    APP_PLATFORM_ENTERPRISE_GOVERNANCE_FILE: path.join(directory, 'governance.json'),
    APP_PLATFORM_MANAGED_SESSION_ENABLED: 'false', APP_PLATFORM_EXTERNAL_AGENT_OAUTH_ENABLED: 'false',
    APP_PLATFORM_EXTERNAL_AGENT_MCP_ENABLED: 'false'};
  for (const provider of providers) {
    if (legacy) environment[provider.env + '_API_KEY'] = 'synthetic-env-' + provider.name;
    environment[provider.env + '_MODEL'] = provider.model;
    environment[provider.env + '_BASE_URL'] = 'https://llm-credential.invalid/' + provider.name;
  }
  const profile = createPersonalAgentExperienceProfileV010(environment);
  const child = fork(path.resolve('dist/manager/server.js'), [], {execArgv: [
    '--import', path.resolve('tools/plugin-loading-audit-probe.mjs'),
    '--import', path.resolve('tests/fixtures/llm-credential-fetch-probe.mjs')],
    env: profile.environment, stdio: ['ignore', 'pipe', 'pipe', 'ipc']});
  child.stdout.resume(); let stderr = ''; child.stderr.on('data', part => stderr += part);
  const exit = new Promise(resolve => child.once('exit', resolve)); let timer;
  try {
    const sample = await new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(Error('CREDENTIAL_HOST_START_TIMEOUT')), 30000);
      child.once('error', reject); child.once('exit', code => reject(Error('CREDENTIAL_HOST_EARLY_EXIT:' + code)));
      child.on('message', message => {if (message.kind === 'host-baseline') resolve(message);});
    });
    clearTimeout(timer); assert.equal(sample.blockedOutbound, 0);
    const call = async (route, values) => {
      const response = await fetch(`http://127.0.0.1:${sample.port}${route}`, {method: 'POST',
        signal: AbortSignal.timeout(15000), headers: {'content-type': 'application/json'}, body: JSON.stringify(values)});
      return {status: response.status, body: await response.json()};
    };
    const settings = (namespace, values) => call('/v1/actions', {contractVersion: '0.1.0', type: 'command',
      command: {code: 'app-platform.update-settings', inputVersion: '0.1.0'},
      values: {namespace, settings: values}, sourceInteractionId: 'credential-resource-test', actionId: 'save', requiresConfirmation: false});
    const lifecycle = async (operation, packageId) => {
      const result = await call('/v1/' + operation, {packageId}); assert.equal(result.status, 200); return result;
    };
    const probe = provider => call('/v1/providers/health/probe', {providerId: provider.id,
      capability: 'llm.inference', adminToken: profile.bootstrapAdminToken});
    const counts = () => new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const timeout = setTimeout(() => {child.off('message', receive); reject(Error('CREDENTIAL_COUNT_TIMEOUT'));}, 5000);
      const receive = message => {if (message.kind === 'llm-credential-counts' && message.id === id) {
        clearTimeout(timeout); child.off('message', receive); resolve(message.counts);
      }};
      child.on('message', receive); child.send({kind: 'llm-credential-counts', id});
    });
    return {call, settings, lifecycle, probe, counts, adminToken: profile.bootstrapAdminToken, async stop() {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGTERM'); const kill = setTimeout(() => child.kill('SIGKILL'), 7000);
        assert.equal(await exit, 0); clearTimeout(kill);
      }
      assert.equal(stderr, '');
    }};
  } catch (error) {clearTimeout(timer); child.kill('SIGKILL'); await exit; throw error;}
}

test('legacy keys stay ephemeral across lifecycle; only explicit secret settings persist and removal survives refresh', {timeout: 90000}, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'llm-credential-')); let host;
  try {
    host = await start(dir);
    assert.deepEqual(records(dir), {}); assert.deepEqual(await host.counts(), {openai: 0, deepseek: 0});
    for (const provider of providers) {
      assert.equal((await host.probe(provider)).body.error.code, 'PROVIDER_NOT_ACTIVE');
      await host.lifecycle('install', provider.packageId);
      await host.lifecycle('disable', provider.packageId);
      assert.equal((await host.probe(provider)).body.error.code, 'PROVIDER_NOT_ACTIVE');
      assert.deepEqual(records(dir), {});
      await host.lifecycle('enable', provider.packageId);
      assert.equal((await host.probe(provider)).body.health.state, 'HEALTHY', 'legacy runtime remains usable');
      const ordinary = await host.settings(provider.packageId, {model: provider.model});
      assert.equal(ordinary.status, 200); assert.equal(ordinary.body.ok, true);
      assert.deepEqual(records(dir), {}, 'ordinary settings save must not persist an environment key');
    }
    assert.deepEqual(await host.counts(), {openai: 1, deepseek: 1});
    for (const provider of providers) await host.lifecycle('disable', provider.packageId);
    await host.stop(); host = await start(dir);
    assert.deepEqual(records(dir), {}); assert.deepEqual(await host.counts(), {openai: 0, deepseek: 0});
    for (const provider of providers) {
      assert.equal((await host.probe(provider)).body.error.code, 'PROVIDER_NOT_ACTIVE');
      await host.lifecycle('enable', provider.packageId);
    }
    for (const provider of providers) {
      const before = JSON.stringify(records(dir));
      const denied = await host.settings(provider.packageId, {'secret:apiKey': 'synthetic-denied'});
      assert.equal(denied.status, 403); assert.equal(JSON.stringify(records(dir)), before, 'unauthorized secret save cannot migrate credentials');
      const saved = await host.settings(provider.packageId, {'secret:apiKey': 'synthetic-saved-' + provider.name, adminToken: host.adminToken});
      assert.equal(saved.status, 200); assert.equal(saved.body.ok, true);
      assert.equal(createEncryptedFileSecretStoreV010(path.join(dir, 'secrets.enc.json'), path.join(dir, 'secrets.master.key')).resolve(reference(provider.packageId)), 'synthetic-saved-' + provider.name);
    }
    const persisted = fs.readFileSync(path.join(dir, 'secrets.enc.json'), 'utf8');
    assert.ok(!persisted.includes('synthetic-saved-')); assert.ok(!persisted.includes('synthetic-env-'));
    await host.stop(); host = await start(dir, false);
    for (const provider of providers) assert.equal((await host.probe(provider)).body.health.state, 'HEALTHY');
    assert.equal(fs.readFileSync(path.join(dir, 'secrets.enc.json'), 'utf8'), persisted, 'restart must preserve existing ciphertext');
    await host.stop(); host = await start(dir);
    for (const provider of providers) {
      const removed = await host.settings(provider.packageId, {'secret-remove:apiKey': true, adminToken: host.adminToken});
      assert.equal(removed.status, 200); assert.equal(removed.body.ok, true);
      assert.equal(createEncryptedFileSecretStoreV010(path.join(dir, 'secrets.enc.json'), path.join(dir, 'secrets.master.key')).describe(reference(provider.packageId)).configured, false);
      assert.equal((await host.probe(provider)).body.health.state, 'HEALTHY', 'environment fallback remains; removal is not environment revocation');
      await host.lifecycle('uninstall', provider.packageId); await host.lifecycle('install', provider.packageId);
    }
    assert.deepEqual(records(dir), {});
    await host.stop(); host = await start(dir, false);
    for (const provider of providers) assert.equal((await host.probe(provider)).body.health.state, 'UNAVAILABLE');
    assert.deepEqual(await host.counts(), {openai: 0, deepseek: 0}); assert.deepEqual(records(dir), {});
    const audit = fs.readFileSync(path.join(dir, 'secret-audit.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
    assert.equal(audit.filter(x => x.action === 'PUT_SECRET' && x.outcome === 'ALLOWED').length, 2);
    assert.equal(audit.filter(x => x.action === 'REMOVE_SECRET' && x.outcome === 'ALLOWED').length, 2);
  } finally {await host?.stop(); fs.rmSync(dir, {recursive: true, force: true});}
});
