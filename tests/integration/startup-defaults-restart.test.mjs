import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fork } from 'node:child_process';

async function boot(stateFile) {
  const child = fork(path.resolve('dist/manager/server.js'), [], {
    execArgv: ['--import', path.resolve('tools/lightweight-host-probe.mjs')],
    env: { PATH: process.env.PATH, PORT: '0', NODE_ENV: 'test',
      APP_PLATFORM_STATE_FILE: stateFile, APP_PLATFORM_MANAGED_SESSION_ENABLED: 'true' },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc']
  });
  child.stdout.resume();
  let stderr = '';
  child.stderr.on('data', chunk => { stderr += chunk; });
  const exited = new Promise(resolve => child.once('exit', code => resolve(code)));
  let timeout;
  try {
    const sample = await new Promise((resolve, reject) => {
      timeout = setTimeout(() => reject(new Error('startup timed out')), 30000);
      child.once('error', reject);
      child.once('exit', code => reject(new Error('early exit ' + code + ': ' + stderr)));
      child.on('message', value => { if (value.kind === 'host-baseline') resolve(value); });
    });
    clearTimeout(timeout);
    assert.equal(sample.blockedOutbound, 0);
    child.kill('SIGTERM');
    timeout = setTimeout(() => child.kill('SIGKILL'), 7000);
    assert.equal(await exited, 0);
    assert.equal(stderr, '');
    return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } finally {
    clearTimeout(timeout);
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL');
      await exited;
    }
  }
}

test('real host restart preserves inactive and removed optional defaults', { timeout: 60000 }, async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'evo-startup-restart-'));
  const stateFile = path.join(directory, 'state.json');
  const packages = new Set(['evo-eog-3d', 'evo-enterprise-observatory',
    'eog-bottleneck-analysis-provider', 'evo-counterparty', 'evo-object-extension', 'evo-data-import']);
  const save = state => fs.writeFileSync(stateFile, JSON.stringify(state));
  try {
    const initial = await boot(stateFile);
    for (const id of packages) assert.ok(initial.installedPackages.some(item => item.packageId === id), id);
    // Persisted-state fixtures test restoration, not uninstall permission/dependency APIs.
    initial.activeFeatures = initial.activeFeatures.filter(item => !packages.has(item.packageId));
    save(initial);
    // Emulate an existing instance upgrading before any startup journal existed.
    fs.rmSync(path.join(directory, 'startup-defaults.json'));
    const disabled = await boot(stateFile);
    assert.ok(disabled.activeFeatures.every(item => !packages.has(item.packageId)));
    disabled.installedPackages = disabled.installedPackages.filter(item => !packages.has(item.packageId));
    save(disabled);
    const removed = await boot(stateFile);
    assert.ok(removed.installedPackages.every(item => !packages.has(item.packageId)));
    assert.ok(removed.activeFeatures.every(item => !packages.has(item.packageId)));
    assert.ok(removed.installedPackages.some(item => item.packageId === 'host-managed-session-provider'));
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
