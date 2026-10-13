import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fork } from 'node:child_process';

async function boot(stateFile, profile, check, extraEnv = {}) {
  const child = fork(path.resolve('dist/manager/server.js'), [], {
    execArgv: ['--import', path.resolve('tools/lightweight-host-probe.mjs')],
    env: { PATH: process.env.PATH, PORT: '0', NODE_ENV: 'test',
      APP_PLATFORM_STATE_FILE: stateFile, APP_PLATFORM_MANAGED_SESSION_ENABLED: 'true',
      ...(profile ? { APP_PLATFORM_STARTUP_PROFILE: profile } : {}), ...extraEnv },
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
    if (check) await check(sample.port);
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


test('minimal fresh boot omits business defaults and still rejects anonymous access', { timeout: 60000 }, async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'evo-minimal-'));
  try {
    const file = path.join(directory, 'state.json');
    const initial = await boot(file, 'minimal', async port => {
      const session = await fetch(`http://127.0.0.1:${port}/auth/session`);
      assert.equal(session.status, 401);
      const home = await fetch(`http://127.0.0.1:${port}/`, { redirect: 'manual' });
      assert.equal(home.status, 303);
      assert.match(home.headers.get('location'), /^\/login/);
    });
    const ids = initial.installedPackages.map(item => item.packageId).sort();
    for (const required of ['host-managed-session-provider', 'host-static-authorization-provider',
      'host-identity-user-directory-provider', 'host-enterprise-context-grant-provider']) {
      assert.ok(ids.includes(required), required);
    }
    assert.ok(ids.every(id => id.startsWith('host-') || id === 'evo.external-agent-governance'));
    assert.ok(!ids.includes('host-context-memory-provider'));
    const again = await boot(file, 'minimal');
    assert.deepEqual(again.installedPackages.map(item => item.packageId).sort(), ids);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});


test('completed 2D cutover does not reactivate an intentionally disabled Designer', { timeout: 60000 }, async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'evo-designer-migration-'));
  try {
    const file = path.join(directory, 'state.json');
    const initial = await boot(file);
    assert.ok(initial.activeFeatures.some(item => item.featureId === 'evo-eog-2d.designer'));
    initial.activeFeatures = initial.activeFeatures.filter(item => item.featureId !== 'evo-eog-2d.designer');
    fs.writeFileSync(file, JSON.stringify(initial));
    const restarted = await boot(file);
    assert.ok(!restarted.activeFeatures.some(item => item.featureId === 'evo-eog-2d.designer'));
    assert.ok(restarted.activeFeatures.some(item => item.featureId === 'evo-eog-2d.viewer'));
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});


test('real Host lifecycle API denies anonymous access and rejects retry of an idle runtime', { timeout: 30000 }, async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'evo-lifecycle-admin-'));
  try {
    await boot(path.join(directory, 'state.json'), 'minimal', async port => {
      const base = `http://127.0.0.1:${port}/v1/providers/lifecycle`;
      assert.equal((await fetch(base)).status, 403);
      const headers = { authorization: 'Bearer isolated-test-admin' };
      const read = await fetch(base, { headers });
      assert.equal(read.status, 200);
      const value = await read.json();
      assert.equal(value.runtimes.length, 1);
      assert.equal(value.runtimes[0].phase, 'IDLE');
      const retry = await fetch(base + '/retry-stop?packageId=' + value.runtimes[0].packageId,
        { method: 'POST', headers });
      assert.equal(retry.status, 409);
    }, {
      APP_PLATFORM_BOOTSTRAP_ADMIN_TOKEN: 'isolated-test-admin',
      APP_PLATFORM_AUTHORIZATION_POLICY_JSON: JSON.stringify({ contractVersion: '0.1.0', rules: [{
        id: 'isolated-admin', effect: 'ALLOW', subjectIds: ['bootstrap-admin'], actorTypes: ['HUMAN'],
        actions: ['provider.lifecycle.read', 'provider.lifecycle.retry-stop']
      }] })
    });
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
