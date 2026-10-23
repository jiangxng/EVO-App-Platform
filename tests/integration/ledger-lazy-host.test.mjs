import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fork } from 'node:child_process';
import { createPackageCatalog } from '../../dist/catalog/catalog.js';
import { evoFoundationPackage, ledgerRuntimeConfiguratorPackage } from '../../dist/catalog/seed.js';
import { createAppManagerService } from '../../dist/manager/service.js';
import { createMemoryLifecycleStore } from '../../dist/manager/store.js';

// Real Host, isolated files, loopback only, outbound TCP blocked. Fixtures are
// persisted lifecycle state, not a claim to exercise the installation admin UI.
async function boot(mode, check) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ledger-lazy-host-'));
  const stateFile = path.join(directory, 'state.json');
  if (mode !== 'absent') {
    const manager = createAppManagerService(createPackageCatalog([evoFoundationPackage, ledgerRuntimeConfiguratorPackage]), createMemoryLifecycleStore());
    manager.install('evo-ledger-runtime-configurator');
    if (mode === 'disabled') manager.disable('evo-ledger-runtime-configurator');
    fs.writeFileSync(stateFile, JSON.stringify(manager.getSnapshot()));
  }
  const child = fork(path.resolve('dist/manager/server.js'), [], {
    execArgv: ['--import', path.resolve('tools/plugin-loading-audit-probe.mjs')],
    env: { PATH: process.env.PATH, PORT: '0', NODE_ENV: 'test', APP_PLATFORM_STATE_FILE: stateFile,
      APP_PLATFORM_STARTUP_PROFILE: 'minimal', APP_PLATFORM_MANAGED_SESSION_ENABLED: 'true' },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc']
  });
  child.stdout.resume(); let stderr = '', timer;
  child.stderr.on('data', value => { stderr += value; });
  const exited = new Promise(resolve => child.once('exit', code => resolve(code)));
  try {
    const sample = await new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error('host startup timeout')), 30000);
      child.once('error', reject);
      child.once('exit', code => reject(new Error(`early exit ${code}: ${stderr}`)));
      child.on('message', value => { if (value.kind === 'host-baseline') resolve(value); });
    });
    clearTimeout(timer); assert.equal(sample.blockedOutbound, 0);
    for (const module of ['service', 'default-library', 'expression-compiler']) {
      assert.ok(!sample.loadedModules.includes(`dist/apps/ledger-runtime-configurator/${module}.js`), `${mode}: ${module} loaded before use`);
    }
    const call = async (suffix, body) => {
      const response = await fetch(`http://127.0.0.1:${sample.port}/v1/ledger-runtime-configurator/${suffix}`, {
        signal: AbortSignal.timeout(10000), ...(body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {})
      });
      return { status: response.status, body: await response.json() };
    };
    await check(call);
    child.kill('SIGTERM'); timer = setTimeout(() => child.kill('SIGKILL'), 7000);
    assert.equal(await exited, 0); assert.equal(stderr, '');
  } finally {
    clearTimeout(timer);
    if (child.exitCode === null && child.signalCode === null) { child.kill('SIGKILL'); await exited; }
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

for (const mode of ['absent', 'disabled']) test(`real Host ${mode} compatibility plugin stays unloaded and rejects requests`, { timeout: 45000 }, async () => {
  await boot(mode, async call => {
    const response = await call('configuration');
    assert.equal(response.status, 409); assert.equal(response.body.code, 'FEATURE_NOT_ACTIVE');
  });
});

test('real Host active-but-unused stays unloaded; concurrent HTTP reads and edits share old state', { timeout: 45000 }, async () => {
  await boot('active', async call => {
    const [summary, configuration] = await Promise.all([call('summary'), call('configuration')]);
    assert.equal(summary.status, 200); assert.equal(configuration.status, 200);
    assert.equal(summary.body.counts.postingRules, 912);
    configuration.body.configurationId = 'http-preserved-draft';
    const imported = await call('import', configuration.body);
    assert.equal(imported.status, 200); assert.equal(imported.body.ok, true);
    assert.equal((await call('configuration')).body.configurationId, 'http-preserved-draft');
    const compiled = await call('compile'); assert.equal(compiled.status, 200); assert.equal(compiled.body.rules.length, 912);
    const template = await call('template'); assert.equal(template.status, 200);
    const roundtrip = await call('template/import', template.body); assert.equal(roundtrip.status, 200);
    assert.equal((await call('configuration')).body.configurationId, 'http-preserved-draft');
    const references = await call('reference-rule-sets'); assert.equal(references.status, 200); assert.equal(references.body.ruleSets[0].rules.length, 587);
  });
});
