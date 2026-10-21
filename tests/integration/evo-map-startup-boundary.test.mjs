import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fork} from 'node:child_process';
import {createPersonalAgentExperienceProfileV010} from '../../dist/manager/local-experience-profile.js';
import {createEnterpriseApplicationRuntimeBindingProviderV010} from '../../dist/providers/application-runtime-binding/runtime.js';
import {createFileEnterpriseApplicationRuntimeBindingStoreV010} from '../../dist/providers/application-runtime-binding/store.js';

const bindingPackage = 'evo-application-runtime-binding-provider';
const bindingFeature = bindingPackage + '.default';
const observatoryPackage = 'evo-runtime-observatory-provider';
const map = id => JSON.stringify({'synthetic-enterprise': {'synthetic-host-app': id}});
async function boot(root, {enabled, profile = 'compatible', mapping = map('synthetic-runtime-v1')} = {}) {
  const target = path.join(root, 'application-bindings.json'), stateFile = path.join(root, 'state.json');
  const env = createPersonalAgentExperienceProfileV010({PATH: process.env.PATH, NODE_ENV: 'test', PORT: '0',
    APP_PLATFORM_STATE_FILE: stateFile, APP_PLATFORM_STARTUP_PROFILE: profile,
    APP_PLATFORM_MANAGED_SESSION_ENABLED: String(profile === 'minimal'), APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_MS: '0',
    APP_PLATFORM_APPLICATION_RUNTIME_BINDING_FILE: target, APP_PLATFORM_EVO_OBSERVATORY_APPLICATION_MAP_JSON: mapping,
    EVO_BASE_URL: 'https://evo-map-startup.invalid',
    ...(enabled === undefined ? {} : {APP_PLATFORM_EVO_OBSERVATORY_ENABLED: String(enabled)})}).environment;
  const child = fork(path.resolve('dist/manager/server.js'), [], {execArgv: [
    '--import', path.resolve('tools/plugin-loading-audit-probe.mjs'),
    '--import', path.resolve('tests/fixtures/evo-map-startup-probe.mjs')], env,
    stdio: ['ignore', 'pipe', 'pipe', 'ipc']});
  child.stdout.resume(); let stderr = ''; child.stderr.on('data', chunk => {stderr += chunk;});
  const exit = new Promise(resolve => child.once('exit', resolve)); let timer;
  const sample = await new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(Error('EVO_MAP_BOOT_TIMEOUT:' + stderr)), 30000);
    child.once('error', reject); child.once('exit', code => resolve({failure: true, code}));
    child.on('message', message => {if (message.kind === 'host-baseline') resolve(message);});
  }).finally(() => clearTimeout(timer)).catch(async error => {child.kill('SIGKILL'); await exit; throw error;});
  if (sample.failure) return {failure: true, code: sample.code, stderr};
  assert.equal(sample.blockedOutbound, 0);
  return {
    state: () => JSON.parse(fs.readFileSync(stateFile, 'utf8')),
    async lifecycle(operation) {
      const response = await fetch(`http://127.0.0.1:${sample.port}/v1/${operation}`, {method: 'POST',
        headers: {'content-type': 'application/json'}, body: JSON.stringify({packageId: bindingPackage,
          trustApproved: true, approvedPermissions: []}), signal: AbortSignal.timeout(10000)});
      const body = await response.json(); assert.equal(response.status, 200, JSON.stringify(body));
    },
    snapshot: () => new Promise((resolve, reject) => {
      const id = crypto.randomUUID(); const timer = setTimeout(() => {child.off('message', receive); reject(Error('EVO_MAP_SNAPSHOT_TIMEOUT'));}, 5000);
      const receive = message => {if (message.id === id) {clearTimeout(timer); child.off('message', receive); resolve(message);}};
      child.on('message', receive); child.send({kind: 'evo-map-startup-snapshot', id});
    }),
    async stop() {child.kill('SIGTERM'); const kill = setTimeout(() => child.kill('SIGKILL'), 7000);
      try {assert.equal(await exit, 0, stderr); assert.equal(stderr, '');} finally {clearTimeout(kill);}}
  };
}

for (const profile of ['compatible', 'minimal']) test('disabled EVO map does not install packages or write bindings in ' + profile, {timeout: 30000}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'disabled-evo-map-')); let host;
  try {
    host = await boot(root, {profile, ...(profile === 'minimal' ? {enabled: false} : {})});
    assert.equal(host.failure, undefined, host.stderr);
    const state = host.state();
    assert.equal(state.installedPackages.some(item => item.packageId === bindingPackage || item.packageId === observatoryPackage), false);
    const snapshot = await host.snapshot(); assert.deepEqual(snapshot.writes, []); assert.equal(snapshot.requests, 0);
    assert.equal(fs.existsSync(path.join(root, 'application-bindings.json')), false);
  } finally {await host?.stop?.(); fs.rmSync(root, {recursive: true, force: true});}
});

test('disabled EVO map does not parse malformed dormant configuration', {timeout: 30000}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'invalid-disabled-evo-map-')); let host;
  try {
    host = await boot(root, {enabled: false, mapping: '{invalid-evo-map'});
    assert.equal(host.failure, undefined, host.stderr);
    const snapshot = await host.snapshot(); assert.deepEqual(snapshot.writes, []); assert.equal(snapshot.requests, 0);
  } finally {await host?.stop?.(); fs.rmSync(root, {recursive: true, force: true});}
});

test('EVO map preserves inactive binding state across off/on and applies pending configuration after explicit enable/restart', {timeout: 60000}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'evo-map-restart-')); let host;
  const file = path.join(root, 'application-bindings.json'), stateFile = path.join(root, 'state.json');
  try {
    host = await boot(root, {enabled: true}); assert.equal(host.failure, undefined, host.stderr);
    const state = host.state();
    assert.ok(state.activeFeatures.some(item => item.featureId === bindingFeature));
    assert.ok(state.installedPackages.some(item => item.packageId === observatoryPackage));
    const first = JSON.parse(fs.readFileSync(file, 'utf8')).bindings[0];
    assert.equal(first.enterpriseId, 'synthetic-enterprise'); assert.equal(first.runtimeApplicationId, 'synthetic-runtime-v1');
    assert.equal(first.runtimeProviderId, 'evo.runtime-observatory');
    const active = await host.snapshot(); assert.deepEqual(active.writes, ['writeFileSync', 'renameSync']); assert.equal(active.requests, 0);
    await host.stop(); host = undefined;
    // Persistence fixture models an already disabled package; this is a restart
    // test, not a claim about public lifecycle API dependency authorization.
    state.activeFeatures = state.activeFeatures.filter(item => item.packageId !== bindingPackage);
    fs.writeFileSync(stateFile, JSON.stringify(state)); const original = fs.readFileSync(file);
    host = await boot(root, {enabled: false, mapping: map('synthetic-runtime-v2')});
    assert.equal(host.failure, undefined, host.stderr);
    assert.equal(host.state().activeFeatures.some(item => item.featureId === bindingFeature), false);
    assert.deepEqual(fs.readFileSync(file), original);
    const dormant = await host.snapshot(); assert.deepEqual(dormant.writes, []); assert.equal(dormant.requests, 0);
    await host.stop(); host = undefined;
    host = await boot(root, {enabled: true, mapping: map('synthetic-runtime-v2')});
    assert.equal(host.failure, undefined, host.stderr);
    assert.equal(host.state().activeFeatures.some(item => item.featureId === bindingFeature), false);
    assert.deepEqual(fs.readFileSync(file), original);
    assert.deepEqual((await host.snapshot()).writes, []);
    await host.lifecycle('enable');
    assert.deepEqual((await host.snapshot()).writes, [], 'lifecycle enable alone does not run startup mapping writes');
    await host.stop(); host = undefined;
    host = await boot(root, {enabled: true, mapping: map('synthetic-runtime-v2')});
    assert.equal(host.failure, undefined, host.stderr);
    assert.ok(host.state().activeFeatures.some(item => item.featureId === bindingFeature));
    const restored = JSON.parse(fs.readFileSync(file, 'utf8')).bindings[0];
    assert.equal(restored.bindingId, first.bindingId); assert.equal(restored.createdAt, first.createdAt);
    assert.equal(restored.runtimeApplicationId, 'synthetic-runtime-v2');
    assert.equal((await host.snapshot()).requests, 0);
  } finally {await host?.stop?.(); fs.rmSync(root, {recursive: true, force: true});}
});

test('enabled EVO map still rejects malformed configuration before creating a binding file', {timeout: 30000}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'invalid-enabled-evo-map-'));
  try {
    const failed = await boot(root, {enabled: true, mapping: '{invalid-evo-map'});
    assert.equal(failed.failure, true); assert.notEqual(failed.code, 0); assert.match(failed.stderr, /SyntaxError/);
    assert.equal(fs.existsSync(path.join(root, 'application-bindings.json')), false);
  } finally {fs.rmSync(root, {recursive: true, force: true});}
});

test('enabled EVO map is idempotent and explicit configuration owns only listed observation keys', {timeout: 60000}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'evo-map-idempotent-')); let host;
  const file = path.join(root, 'application-bindings.json');
  try {
    host = await boot(root, {enabled: true}); assert.equal(host.failure, undefined, host.stderr);
    const first = fs.readFileSync(file); await host.stop(); host = undefined;
    host = await boot(root, {enabled: true}); assert.equal(host.failure, undefined, host.stderr);
    assert.deepEqual((await host.snapshot()).writes, []); assert.deepEqual(fs.readFileSync(file), first);
    await host.stop(); host = undefined;
    const provider = createEnterpriseApplicationRuntimeBindingProviderV010({store: createFileEnterpriseApplicationRuntimeBindingStoreV010(file)});
    const shared = provider.bind({enterpriseId: 'synthetic-enterprise', hostApplicationRefId: 'synthetic-host-app',
      runtimeProviderId: 'evo-ledger-runtime', runtimeApplicationId: 'synthetic-ledger-target'});
    const unlisted = provider.bind({enterpriseId: 'synthetic-enterprise', hostApplicationRefId: 'unlisted-app',
      runtimeProviderId: 'evo.runtime-observatory', runtimeApplicationId: 'synthetic-unlisted-target'});
    const original = JSON.parse(first).bindings[0];
    provider.bind({enterpriseId: 'synthetic-enterprise', hostApplicationRefId: 'synthetic-host-app',
      runtimeProviderId: 'evo.runtime-observatory', runtimeApplicationId: 'synthetic-external-edit'});
    host = await boot(root, {enabled: true, mapping: map('synthetic-runtime-v2')});
    assert.equal(host.failure, undefined, host.stderr);
    const next = JSON.parse(fs.readFileSync(file)).bindings;
    const changed = next.find(item => item.bindingId === original.bindingId);
    assert.equal(changed.runtimeApplicationId, 'synthetic-runtime-v2'); assert.equal(changed.createdAt, original.createdAt);
    assert.deepEqual(next.find(item => item.bindingId === shared.bindingId), shared);
    assert.deepEqual(next.find(item => item.bindingId === unlisted.bindingId), unlisted);
    assert.deepEqual((await host.snapshot()).writes, ['writeFileSync', 'renameSync']);
    assert.equal((await host.snapshot()).requests, 0);
  } finally {await host?.stop?.(); fs.rmSync(root, {recursive: true, force: true});}
});

test('enabled EVO map remembers HTTP uninstall and resumes only after explicit install/restart', {timeout: 60000}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'evo-map-removed-')); let host;
  const file = path.join(root, 'application-bindings.json');
  try {
    host = await boot(root, {enabled: true}); assert.equal(host.failure, undefined, host.stderr);
    const original = fs.readFileSync(file);
    await host.lifecycle('uninstall'); await host.stop(); host = undefined;
    host = await boot(root, {enabled: true}); assert.equal(host.failure, undefined, host.stderr);
    assert.equal(host.state().installedPackages.some(item => item.packageId === bindingPackage), false);
    assert.deepEqual((await host.snapshot()).writes, []); assert.deepEqual(fs.readFileSync(file), original);
    await host.lifecycle('install'); await host.stop(); host = undefined;
    host = await boot(root, {enabled: true}); assert.equal(host.failure, undefined, host.stderr);
    assert.ok(host.state().activeFeatures.some(item => item.featureId === bindingFeature));
    assert.deepEqual((await host.snapshot()).writes, []); assert.deepEqual(fs.readFileSync(file), original);
    assert.equal((await host.snapshot()).requests, 0);
  } finally {await host?.stop?.(); fs.rmSync(root, {recursive: true, force: true});}
});

test('EVO mapping write failure preserves target and retries through the existing installed provider', {timeout: 60000}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'evo-map-write-retry-')); let host;
  const file = path.join(root, 'application-bindings.json');
  try {
    fs.mkdirSync(file + '.tmp');
    const failed = await boot(root, {enabled: true});
    assert.equal(failed.failure, true); assert.notEqual(failed.code, 0); assert.match(failed.stderr, /EISDIR/);
    assert.equal(fs.existsSync(file), false);
    fs.rmdirSync(file + '.tmp');
    host = await boot(root, {enabled: true}); assert.equal(host.failure, undefined, host.stderr);
    assert.equal(JSON.parse(fs.readFileSync(file)).bindings[0].runtimeApplicationId, 'synthetic-runtime-v1');
    const original = fs.readFileSync(file); await host.stop(); host = undefined;
    host = await boot(root, {enabled: true}); assert.equal(host.failure, undefined, host.stderr);
    assert.deepEqual((await host.snapshot()).writes, []); assert.deepEqual(fs.readFileSync(file), original);
  } finally {await host?.stop?.(); fs.rmSync(root, {recursive: true, force: true});}
});

test('active but unavailable explicit Binding Provider selection still fails closed without store fallback', {timeout: 30000}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'evo-map-bad-selection-'));
  const file = path.join(root, 'application-bindings.json');
  try {
    const provider = createEnterpriseApplicationRuntimeBindingProviderV010({store: createFileEnterpriseApplicationRuntimeBindingStoreV010(file)});
    provider.bind({enterpriseId: 'synthetic-enterprise', hostApplicationRefId: 'synthetic-host-app',
      runtimeProviderId: 'evo.runtime-observatory', runtimeApplicationId: 'synthetic-original'});
    const original = fs.readFileSync(file);
    fs.writeFileSync(path.join(root, 'provider-bindings.json'), JSON.stringify({contractVersion: '0.1.0', bindings: [{
      contractVersion: '0.1.0', capability: 'enterprise.application-runtime-binding', providerId: 'synthetic-unavailable',
      scope: 'INSTALLATION', scopeId: 'default'}]}));
    const failed = await boot(root, {enabled: true});
    assert.equal(failed.failure, true); assert.match(failed.stderr, /PROVIDER_BINDING_UNAVAILABLE/);
    assert.deepEqual(fs.readFileSync(file), original);
  } finally {fs.rmSync(root, {recursive: true, force: true});}
});
