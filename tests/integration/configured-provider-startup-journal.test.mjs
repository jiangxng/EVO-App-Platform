import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fork} from 'node:child_process';
import {createPersonalAgentExperienceProfileV010} from '../../dist/manager/local-experience-profile.js';

const packages = ['evo-runtime-observatory-provider', 'host-memory-intake-provider',
  'remote-context-memory-semantic-provider', 'remote-context-memory-dlp-provider',
  'experience-compiler-memory-intake-provider'];
const namespace = 'host.startup-defaults.v1';
const configuration = {
  APP_PLATFORM_EVO_OBSERVATORY_ENABLED: 'true',
  EVO_BASE_URL: 'https://configured-provider.invalid',
  APP_PLATFORM_MEMORY_INTAKE_JSON: JSON.stringify({contractVersion: '0.1.0',
    source: {sourceId: 'synthetic-local', sourceType: 'DOCUMENT', trustLevel: 'DECLARED'}, records: []}),
  APP_PLATFORM_MEMORY_SEMANTIC_URL: 'https://configured-provider.invalid/semantic',
  APP_PLATFORM_MEMORY_DLP_URL: 'https://configured-provider.invalid/dlp',
  APP_PLATFORM_EC_MEMORY_INTAKE_JSON: JSON.stringify({contractVersion: '0.1.0',
    endpoint: 'https://configured-provider.invalid/ec', source: {sourceId: 'synthetic-ec', trustLevel: 'DECLARED'}})
};
const journalFile = root => path.join(root, 'startup-defaults.json');
const journal = root => fs.existsSync(journalFile(root))
  ? JSON.parse(fs.readFileSync(journalFile(root), 'utf8')).namespaces[namespace] ?? {} : {};
function assertPackages(host, state) {
  const snapshot = host.state();
  for (const packageId of packages) {
    assert.equal(snapshot.installedPackages.some(item => item.packageId === packageId), state !== 'absent', packageId);
    assert.equal(snapshot.activeFeatures.some(item => item.packageId === packageId), state === 'active', packageId);
  }
}
async function boot(root, profile, configured = true, overrides = {}) {
  const env = createPersonalAgentExperienceProfileV010({PATH: process.env.PATH, NODE_ENV: 'test', PORT: '0',
    APP_PLATFORM_STATE_FILE: path.join(root, 'state.json'), APP_PLATFORM_STARTUP_PROFILE: profile,
    APP_PLATFORM_MANAGED_SESSION_ENABLED: String(profile === 'minimal'), APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_MS: '0',
    ...(configured ? configuration : {}), ...overrides}).environment;
  const child = fork(path.resolve('dist/manager/server.js'), [], {execArgv: [
    '--import', path.resolve('tools/plugin-loading-audit-probe.mjs'),
    '--import', path.resolve('tests/fixtures/configured-provider-startup-probe.mjs')], env,
    stdio: ['ignore', 'pipe', 'pipe', 'ipc']});
  child.stdout.resume(); let stderr = ''; child.stderr.on('data', chunk => {stderr += chunk;});
  const exited = new Promise(resolve => child.once('exit', resolve)); let timer;
  try {
    const sample = await new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(Error('CONFIGURED_PROVIDER_BOOT_TIMEOUT:' + stderr)), 30000);
      child.once('error', reject);
      child.once('exit', code => reject(Error('CONFIGURED_PROVIDER_BOOT_EXIT:' + code + ':' + stderr)));
      child.on('message', message => {if (message.kind === 'host-baseline') resolve(message);});
    }).finally(() => clearTimeout(timer));
    assert.equal(sample.blockedOutbound, 0); assert.deepEqual(sample.registeredIntervals, []);
    return {
      state: () => JSON.parse(fs.readFileSync(path.join(root, 'state.json'), 'utf8')),
      async lifecycle(operation) {
        for (const packageId of packages) {
          const response = await fetch(`http://127.0.0.1:${sample.port}/v1/${operation}`, {method: 'POST',
            headers: {'content-type': 'application/json'}, body: JSON.stringify({packageId,
              trustApproved: true, approvedPermissions: []}), signal: AbortSignal.timeout(10000)});
          assert.equal(response.status, 200, JSON.stringify(await response.json()));
        }
      },
      snapshot: () => new Promise((resolve, reject) => {
        const id = crypto.randomUUID();
        const receive = message => {if (message.id === id) {clearTimeout(timeout); child.off('message', receive); resolve(message);}};
        const timeout = setTimeout(() => {child.off('message', receive); reject(Error('CONFIGURED_PROVIDER_SNAPSHOT_TIMEOUT'));}, 5000);
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

for (const profile of ['compatible', 'minimal']) {
  test('configured optional providers defer until ready and preserve legacy inactive packages in ' + profile, {timeout: 120000}, async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'configured-provider-inactive-')); let host;
    try {
      host = await boot(root, profile, false); assertPackages(host, 'absent');
      for (const packageId of packages) assert.equal(journal(root)[packageId], undefined);
      await host.stop(); host = undefined;
      host = await boot(root, profile); assertPackages(host, 'active');
      for (const packageId of packages) assert.equal(journal(root)[packageId], true);
      await host.lifecycle('disable'); assertPackages(host, 'inactive'); await host.stop(); host = undefined;
      // Upgrade fixture: old bootstrap had installed these packages before they
      // participated in the existing journal. Disable itself uses the real API.
      const historical = JSON.parse(fs.readFileSync(journalFile(root), 'utf8'));
      for (const packageId of packages) delete historical.namespaces[namespace][packageId];
      fs.writeFileSync(journalFile(root), JSON.stringify(historical));
      host = await boot(root, profile); assertPackages(host, 'inactive');
      for (const packageId of packages) assert.equal(journal(root)[packageId], true);
      await host.stop(); host = undefined;
      const recorded = fs.readFileSync(journalFile(root));
      host = await boot(root, profile, false); assertPackages(host, 'inactive'); await host.stop(); host = undefined;
      host = await boot(root, profile); assertPackages(host, 'inactive');
      assert.deepEqual(fs.readFileSync(journalFile(root)), recorded);
      await host.lifecycle('enable'); assertPackages(host, 'active'); await host.stop(); host = undefined;
      host = await boot(root, profile); assertPackages(host, 'active');
      assert.deepEqual(fs.readFileSync(journalFile(root)), recorded);
    } finally {await host?.stop(); fs.rmSync(root, {recursive: true, force: true});}
  });

  test('configured optional providers remember uninstall and allow explicit reinstall in ' + profile, {timeout: 120000}, async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'configured-provider-uninstall-')); let host;
    const memoryFile = path.join(root, 'context-memory.json');
    try {
      const original = JSON.stringify({contractVersion: '0.1.0', items: []}); fs.writeFileSync(memoryFile, original);
      host = await boot(root, profile); assertPackages(host, 'active'); await host.lifecycle('uninstall');
      assertPackages(host, 'absent'); await host.stop(); host = undefined;
      const recorded = fs.readFileSync(journalFile(root));
      host = await boot(root, profile); assertPackages(host, 'absent');
      assert.deepEqual(fs.readFileSync(journalFile(root)), recorded);
      assert.equal(fs.readFileSync(memoryFile, 'utf8'), original);
      await host.lifecycle('install'); assertPackages(host, 'active'); await host.stop(); host = undefined;
      host = await boot(root, profile); assertPackages(host, 'active');
      assert.deepEqual(fs.readFileSync(journalFile(root)), recorded);
      assert.equal(fs.readFileSync(memoryFile, 'utf8'), original);
    } finally {await host?.stop(); fs.rmSync(root, {recursive: true, force: true});}
  });
}

const boundedMemoryConfiguration = count => JSON.stringify({contractVersion: '0.1.0',
  source: {sourceId: 'bounded-reference', sourceType: 'DOCUMENT', trustLevel: 'DECLARED'},
  records: Array.from({length: count}, (_, i) => ({sourceRecordId: String(i),
    context: {kind: 'PERSONAL', contextId: 'p'}, kind: 'FACT', summary: 's'}))});

for (const profile of ['compatible', 'minimal']) test('reference memory record budget rejects before intake, preserves inactive journal and recovers in ' + profile, {timeout: 120000}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'memory-intake-budget-')); let host;
  const memoryFile = path.join(root, 'context-memory.json'), original = JSON.stringify({contractVersion: '0.1.0', items: []});
  const within = {APP_PLATFORM_MEMORY_INTAKE_JSON: boundedMemoryConfiguration(1000)};
  const excessive = {APP_PLATFORM_MEMORY_INTAKE_JSON: boundedMemoryConfiguration(1001)};
  const amplified = JSON.parse(within.APP_PLATFORM_MEMORY_INTAKE_JSON);
  amplified.source.sourceId = 's'.repeat(2048);
  const amplifiedInput = {APP_PLATFORM_MEMORY_INTAKE_JSON: JSON.stringify(amplified)};
  assert.ok(Buffer.byteLength(excessive.APP_PLATFORM_MEMORY_INTAKE_JSON) < 128 * 1024, 'fixture isolates record count from bytes/OS env limits');
  assert.ok(Buffer.byteLength(amplifiedInput.APP_PLATFORM_MEMORY_INTAKE_JSON) < 128 * 1024);
  try {
    fs.writeFileSync(memoryFile, original);
    host = await boot(root, profile, true, within); assertPackages(host, 'active');
    assert.equal((await host.snapshot()).requests, 0); assert.equal(fs.readFileSync(memoryFile, 'utf8'), original);
    await host.lifecycle('disable'); assertPackages(host, 'inactive'); await host.stop(); host = undefined;
    const recorded = fs.readFileSync(journalFile(root));
    host = await boot(root, profile, true, within); assertPackages(host, 'inactive');
    assert.deepEqual(fs.readFileSync(journalFile(root)), recorded); await host.stop(); host = undefined;
    // Configuration validation precedes package bootstrap, including inactive state.
    await assert.rejects(boot(root, profile, true, excessive), /MEMORY_INTAKE_RECORD_LIMIT_EXCEEDED/);
    await assert.rejects(boot(root, profile, true, amplifiedInput), /MEMORY_INTAKE_RECORD_BYTES_EXCEEDED/);
    assert.equal(fs.readFileSync(memoryFile, 'utf8'), original); assert.deepEqual(fs.readFileSync(journalFile(root)), recorded);
    host = await boot(root, profile, true, within); assertPackages(host, 'inactive');
    await host.lifecycle('enable'); assertPackages(host, 'active');
    assert.deepEqual(fs.readFileSync(journalFile(root)), recorded); assert.equal(fs.readFileSync(memoryFile, 'utf8'), original);
  } finally {await host?.stop(); fs.rmSync(root, {recursive: true, force: true});}
});
