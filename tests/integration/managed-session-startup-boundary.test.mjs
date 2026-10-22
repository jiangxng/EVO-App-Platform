import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fork} from 'node:child_process';
import {createJsonlManagedIdentitySessionEventStoreV010, createManagedIdentitySessionServiceV010} from '../../dist/manager/identity-session-store.js';
import {createPersonalAgentExperienceProfileV010} from '../../dist/manager/local-experience-profile.js';

async function launch(root, {enabled = false, explicit = true, durable = true} = {}) {
  const target = path.join(root, explicit ? 'explicit-sessions.jsonl' : 'identity-sessions.jsonl');
  const profile = createPersonalAgentExperienceProfileV010({PATH: process.env.PATH, NODE_ENV: 'test', PORT: '0',
    APP_PLATFORM_STATE_FILE: path.join(root, 'state.json'), APP_PLATFORM_MANAGED_SESSION_ENABLED: String(enabled),
    APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_MS: '0', TEST_MANAGED_SESSION_TARGET: target,
    ...(explicit ? {APP_PLATFORM_MANAGED_SESSION_FILE: target} : {})});
  if (!durable) delete profile.environment.APP_PLATFORM_STATE_FILE;
  const child = fork(path.resolve('dist/manager/server.js'), [], {execArgv: [
    '--import', path.resolve('tools/plugin-loading-audit-probe.mjs'),
    '--import', path.resolve('tests/fixtures/managed-session-file-probe.mjs')], env: profile.environment,
    stdio: ['ignore', 'pipe', 'pipe', 'ipc']});
  child.stdout.resume(); let stderr = ''; child.stderr.on('data', part => {stderr += part;});
  const exited = new Promise(resolve => child.once('exit', resolve)); let timer;
  const sample = await new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(Error('MANAGED_SESSION_BOOT_TIMEOUT:' + stderr)), 30000);
    child.once('error', reject);
    child.once('exit', code => resolve({failure: true, code}));
    child.on('message', message => {if (message.kind === 'host-baseline') resolve(message);});
  }).finally(() => clearTimeout(timer)).catch(async error => {child.kill('SIGKILL'); await exited; throw error;});
  if (sample.failure) return {failure: true, code: sample.code, stderr};
  assert.equal(sample.blockedOutbound, 0);
  return {
    async session(token) {
      const response = await fetch(`http://127.0.0.1:${sample.port}/auth/session`, {signal: AbortSignal.timeout(10000),
        ...(token ? {headers: {authorization: 'Bearer ' + token}} : {})});
      return {status: response.status, body: await response.json()};
    },
    accesses: () => new Promise((resolve, reject) => {
      const id = crypto.randomUUID(); const timeout = setTimeout(() => {child.off('message', receive); reject(Error('SESSION_ACCESS_TIMEOUT'));}, 5000);
      const receive = message => {if (message.id === id) {clearTimeout(timeout); child.off('message', receive); resolve(message.attempts);}};
      child.on('message', receive); child.send({kind: 'managed-session-file-access', id});
    }),
    async stop() {child.kill('SIGTERM'); const kill = setTimeout(() => child.kill('SIGKILL'), 7000);
      try {assert.equal(await exited, 0, stderr); assert.equal(stderr, '');} finally {clearTimeout(kill);}}
  };
}
function seed(file) {
  let index = 0;
  const service = createManagedIdentitySessionServiceV010({store: createJsonlManagedIdentitySessionEventStoreV010(file),
    token: () => 'synthetic-session-token-' + ++index});
  const input = {principal: {contractVersion: '0.1.0', actorType: 'HUMAN', subjectId: 'synthetic-session-human', identityProviderId: 'synthetic'}, ttlSeconds: 600};
  const active = service.issue(input), revoked = service.issue(input);
  service.revoke(revoked.session.sessionId, 'synthetic-revocation');
  return {active, revoked};
}

test('disabled managed mode ignores explicit malformed/missing Session files and keeps auth disabled', {timeout: 60000}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'disabled-session-startup-')); let host;
  const file = path.join(root, 'explicit-sessions.jsonl');
  try {
    fs.writeFileSync(file, '{invalid-session-json\n'); const original = fs.readFileSync(file);
    host = await launch(root); assert.equal(host.failure, undefined, host.stderr);
    assert.deepEqual(await host.accesses(), []); assert.equal((await host.session()).status, 404);
    assert.deepEqual(fs.readFileSync(file), original); await host.stop(); host = undefined;
    fs.unlinkSync(file); host = await launch(root);
    assert.equal(host.failure, undefined, host.stderr); assert.deepEqual(await host.accesses(), []);
    assert.equal((await host.session()).status, 404); assert.equal(fs.existsSync(file), false);
    await host.stop(); host = undefined;
    fs.writeFileSync(file, '{invalid-session-json\n'); const failed = await launch(root, {enabled: true});
    assert.equal(failed.failure, true); assert.notEqual(failed.code, 0); assert.match(failed.stderr, /IDENTITY_SESSION_EVENT_INVALID/);
    assert.deepEqual(fs.readFileSync(file), original);
  } finally {await host?.stop?.(); fs.rmSync(root, {recursive: true, force: true});}
});

for (const explicit of [true, false]) test('enabled managed mode replays ' + (explicit ? 'explicit' : 'derived') + ' file once and retains active/revoked authority', {timeout: 60000}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'enabled-session-startup-')); let host;
  const file = path.join(root, explicit ? 'explicit-sessions.jsonl' : 'identity-sessions.jsonl');
  try {
    const {active, revoked} = seed(file); const original = fs.readFileSync(file);
    for (let restart = 0; restart < (explicit ? 2 : 1); restart++) {
      host = await launch(root, {enabled: true, explicit}); assert.equal(host.failure, undefined, host.stderr);
      const reads = await host.accesses(); assert.deepEqual(reads, ['existsSync', 'readFileSync']);
      const current = await host.session(active.token); assert.equal(current.status, 200, JSON.stringify(current.body));
      assert.equal(current.body.principal.subjectId, active.session.principal.subjectId);
      assert.equal((await host.session(revoked.token)).status, 401);
      assert.equal((await host.session('synthetic-invalid')).status, 401);
      assert.equal((await host.session()).status, 401);
      assert.deepEqual(await host.accesses(), reads, 'HTTP credential lookup must not replay or append log');
      assert.deepEqual(fs.readFileSync(file), original);
      assert.equal(original.toString().includes(active.token), false);
      await host.stop(); host = undefined;
    }
  } finally {await host?.stop?.(); fs.rmSync(root, {recursive: true, force: true});}
});

test('enabled managed mode without explicit file or lifecycle persistence still refuses startup', {timeout: 30000}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'missing-session-durability-'));
  try {
    const failed = await launch(root, {enabled: true, explicit: false, durable: false});
    assert.equal(failed.failure, true); assert.notEqual(failed.code, 0);
    assert.match(failed.stderr, /IDENTITY_SESSION_DURABLE_STORE_REQUIRED/);
    assert.equal(fs.existsSync(path.join(root, 'identity-sessions.jsonl')), false);
  } finally {fs.rmSync(root, {recursive: true, force: true});}
});
