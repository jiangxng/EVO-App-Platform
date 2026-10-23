import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fork} from 'node:child_process';
import {createPersonalAgentExperienceProfileV010} from '../../dist/manager/local-experience-profile.js';
import {createFileIdentityUserDirectoryStoreV010} from '../../dist/manager/identity-user-directory-store.js';
import {createHostIdentityUserDirectoryServiceV010} from '../../dist/providers/identity-directory/runtime.js';

const packageId = 'host-identity-user-directory-provider';
const directoryFile = (root, explicit) => explicit ? path.join(root, 'directory-boundary', 'directory.json') : path.join(root, 'identity-user-directory.json');
async function boot(root, {minimal = false, explicit = true, forbid = false} = {}) {
  const file = directoryFile(root, explicit);
  const profile = createPersonalAgentExperienceProfileV010({PATH: process.env.PATH, NODE_ENV: 'test', PORT: '0',
    APP_PLATFORM_STATE_FILE: path.join(root, 'state.json'), APP_PLATFORM_STARTUP_PROFILE: minimal ? 'minimal' : 'compatible',
    APP_PLATFORM_MANAGED_SESSION_ENABLED: String(minimal), APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_MS: '0',
    ...(explicit ? {APP_PLATFORM_IDENTITY_USER_DIRECTORY_FILE: file} : {}),
    TEST_IDENTITY_DIRECTORY_FILE: file, TEST_IDENTITY_DIRECTORY_FORBID: String(forbid)});
  const child = fork(path.resolve('dist/manager/server.js'), [], {execArgv: [
    '--import', path.resolve('tools/plugin-loading-audit-probe.mjs'),
    '--import', path.resolve('tests/fixtures/configured-provider-startup-probe.mjs'),
    '--import', path.resolve('tests/fixtures/identity-directory-file-access-probe.mjs')],
    env: profile.environment, stdio: ['ignore', 'pipe', 'pipe', 'ipc']});
  child.stdout.resume(); let stderr = ''; child.stderr.on('data', part => {stderr += part;});
  const exited = new Promise(resolve => child.once('exit', resolve)); let timer;
  try {
    const sample = await new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(Error('DIRECTORY_HOST_TIMEOUT:' + stderr)), 30000);
      child.once('error', reject); child.once('exit', code => reject(Error('DIRECTORY_HOST_EXIT:' + code + ':' + stderr)));
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
      const timeout = setTimeout(() => {child.off('message', receive); reject(Error('DIRECTORY_SNAPSHOT_TIMEOUT'));}, 5000);
      child.on('message', receive); child.send({kind, id});
    });
    return {accesses: async () => (await snapshot('identity-directory-file-access')).accesses,
      async lifecycle(operation) {
        const result = await post('/v1/' + operation, {packageId, trustApproved: true, approvedPermissions: []});
        assert.equal(result.status, 200, JSON.stringify(result.body));
      },
      probe(authorized = true) {return post('/v1/providers/health/probe', {providerId: 'host.identity-user-directory',
        capability: 'identity.user-directory', ...(authorized ? {adminToken: profile.bootstrapAdminToken} : {})});},
      async stop() {
        try {assert.equal((await snapshot('configured-provider-snapshot')).requests, 0);} finally {
          child.kill('SIGTERM'); const kill = setTimeout(() => child.kill('SIGKILL'), 7000);
          try {assert.equal(await exited, 0, stderr); assert.equal(stderr, '');} finally {clearTimeout(kill);}
        }
      }
    };
  } catch (error) {child.kill('SIGKILL'); await exited; throw error;}
}

for (const malformed of [false, true]) test('dormant directory with ' + (malformed ? 'corrupt' : 'missing') + ' file stays unread in compatible/minimal and explicit/derived paths', {timeout: 120000}, async () => {
  for (const minimal of [false, true]) for (const explicit of [false, true]) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'directory-dormant-')); let host;
    const file = directoryFile(root, explicit);
    try {
      if (malformed) {fs.mkdirSync(path.dirname(file), {recursive: true}); fs.writeFileSync(file, '{invalid-directory');}
      host = await boot(root, {minimal, explicit, forbid: true});
      assert.deepEqual(await host.accesses(), []); assert.equal((await host.probe(false)).status, 403);
      assert.deepEqual(await host.accesses(), []);
      if (malformed) assert.equal(fs.readFileSync(file, 'utf8'), '{invalid-directory');
      else {assert.equal(fs.existsSync(file), false); if (explicit) assert.equal(fs.existsSync(path.dirname(file)), false);}
    } finally {await host?.stop(); fs.rmSync(root, {recursive: true, force: true});}
  }
});

for (const minimal of [false, true]) test('first directory management use repairs corrupt data, retains independent disabled identity and inactive restart: ' + (minimal ? 'minimal' : 'compatible'), {timeout: 90000}, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'directory-first-use-')); let host;
  const file = directoryFile(root, true);
  try {
    fs.mkdirSync(path.dirname(file)); fs.writeFileSync(file, '{invalid-directory');
    host = await boot(root, {minimal});
    if (!minimal) await host.lifecycle('install');
    assert.deepEqual(await host.accesses(), []);
    await host.lifecycle('disable'); assert.equal((await host.probe()).status, 404); assert.deepEqual(await host.accesses(), []);
    await host.lifecycle('enable'); assert.equal((await host.probe(false)).status, 403); assert.deepEqual(await host.accesses(), []);
    const failed = await host.probe(); assert.equal(failed.status, 200); assert.equal(failed.body.health.state, 'UNAVAILABLE');
    assert.equal(fs.readFileSync(file, 'utf8'), '{invalid-directory'); assert.equal(fs.existsSync(file + '.tmp'), false);
    // Operator repair outside Host; use original service to produce valid revoked data.
    fs.unlinkSync(file);
    const seed = createHostIdentityUserDirectoryServiceV010({store: createFileIdentityUserDirectoryStoreV010(file)});
    seed.recordAuthenticatedPrincipal({contractVersion: '0.1.0', subjectId: 'synthetic-offline-human', actorType: 'HUMAN', identityProviderId: 'synthetic.identity'});
    seed.disable('synthetic-offline-human', 'synthetic-admin'); const disabled = fs.readFileSync(file);
    const recovered = await host.probe(); assert.equal(recovered.body.health.state, 'HEALTHY');
    assert.match(recovered.body.health.message, /1 principal\(s\), 0 active/);
    const accesses = await host.accesses(); assert.equal(accesses.filter(x => x === 'readFileSync').length, 2);
    assert.equal(accesses.filter(x => ['writeFileSync', 'renameSync', 'unlinkSync', 'appendFileSync'].includes(x)).length, 0);
    await host.lifecycle('disable'); await host.stop(); host = undefined;
    host = await boot(root, {minimal}); assert.deepEqual(await host.accesses(), []);
    assert.equal((await host.probe()).status, 404); assert.deepEqual(await host.accesses(), []);
    await host.lifecycle('enable'); assert.equal((await host.probe()).body.health.state, 'HEALTHY');
    assert.equal((await host.accesses()).filter(x => x === 'readFileSync').length, 1);
    assert.deepEqual(fs.readFileSync(file), disabled);
    assert.equal((await host.probe()).body.health.state, 'HEALTHY');
    assert.equal((await host.accesses()).filter(x => x === 'readFileSync').length, 1, 'successful snapshot reused across probes');
  } finally {await host?.stop(); fs.rmSync(root, {recursive: true, force: true});}
});
