import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createFileIdentityUserDirectoryStoreV010,
  createMemoryIdentityUserDirectoryStoreV010
} from "../../dist/manager/identity-user-directory-store.js";
import {
  createHostIdentityUserDirectoryServiceV010
} from "../../dist/providers/identity-directory/runtime.js";

function principal(overrides = {}) {
  return {
    contractVersion: "0.1.0",
    subjectId: "alice",
    actorType: "HUMAN",
    identityProviderId: "generic.oidc",
    displayName: "Alice",
    claims: {
      email: "alice@example.com",
      emailVerified: true
    },
    ...overrides
  };
}

test("identity user directory records and refreshes bounded current Human Principal", () => {
  let now = new Date("2026-09-30T10:00:00.000Z");
  const service = createHostIdentityUserDirectoryServiceV010({
    store: createMemoryIdentityUserDirectoryStoreV010(),
    now: () => now
  });

  const first = service.recordAuthenticatedPrincipal(
    principal({ sessionId: "browser-session-1" })
  );
  assert.equal(first.state, "ACTIVE");
  assert.equal(first.firstSeenAt, "2026-09-30T10:00:00.000Z");
  assert.equal(first.lastAuthenticatedAt, "2026-09-30T10:00:00.000Z");
  assert.equal("sessionId" in first.principal && first.principal.sessionId, undefined);

  now = new Date("2026-09-30T11:00:00.000Z");
  const refreshed = service.recordAuthenticatedPrincipal(
    principal({ displayName: "Alice Updated", sessionId: "browser-session-2" })
  );
  assert.equal(refreshed.firstSeenAt, first.firstSeenAt);
  assert.equal(refreshed.lastAuthenticatedAt, "2026-09-30T11:00:00.000Z");
  assert.equal(refreshed.principal.displayName, "Alice Updated");
  assert.equal(service.provider.get("alice")?.principal.displayName, "Alice Updated");
  assert.equal(service.provider.list().length, 1);
});

test("identity user directory does not allow another IdP to seize an existing subject", () => {
  const service = createHostIdentityUserDirectoryServiceV010({
    store: createMemoryIdentityUserDirectoryStoreV010()
  });
  service.recordAuthenticatedPrincipal(principal());

  assert.throws(
    () => service.recordAuthenticatedPrincipal(
      principal({ identityProviderId: "other.oidc" })
    ),
    /IDENTITY_USER_DIRECTORY_PROVIDER_MISMATCH/
  );
});

test("disablement is terminal and successful re-authentication cannot self-reactivate", () => {
  let now = new Date("2026-09-30T10:00:00.000Z");
  const service = createHostIdentityUserDirectoryServiceV010({
    store: createMemoryIdentityUserDirectoryStoreV010(),
    now: () => now
  });
  service.recordAuthenticatedPrincipal(principal());

  now = new Date("2026-09-30T10:30:00.000Z");
  const disabled = service.disable("alice", "admin-1");
  assert.equal(disabled.state, "DISABLED");
  assert.equal(disabled.disabledAt, "2026-09-30T10:30:00.000Z");
  assert.equal(disabled.disabledBySubjectId, "admin-1");

  now = new Date("2026-09-30T11:00:00.000Z");
  assert.throws(
    () => service.recordAuthenticatedPrincipal(principal()),
    /IDENTITY_USER_DIRECTORY_PRINCIPAL_DISABLED/
  );
  assert.equal(service.provider.get("alice")?.state, "DISABLED");
});

test("file identity directory survives restart without persisting browser Session credentials", () => {
  const dir = mkdtempSync(join(tmpdir(), "evo-user-directory-"));
  const path = join(dir, "identity-user-directory.json");
  const first = createHostIdentityUserDirectoryServiceV010({
    store: createFileIdentityUserDirectoryStoreV010(path),
    now: () => new Date("2026-09-30T10:00:00.000Z")
  });
  first.recordAuthenticatedPrincipal(
    principal({ sessionId: "must-not-persist" })
  );

  const restarted = createHostIdentityUserDirectoryServiceV010({
    store: createFileIdentityUserDirectoryStoreV010(path)
  });
  const current = restarted.provider.get("alice");
  assert.equal(current?.state, "ACTIVE");
  assert.equal(current?.principal.identityProviderId, "generic.oidc");
  assert.equal(current?.principal.sessionId, undefined);
});

test("directory rejects non-Human current principals", () => {
  const service = createHostIdentityUserDirectoryServiceV010({
    store: createMemoryIdentityUserDirectoryStoreV010()
  });
  assert.throws(
    () => service.recordAuthenticatedPrincipal(
      principal({ actorType: "SERVICE" })
    ),
    /IDENTITY_USER_DIRECTORY_PRINCIPAL_INVALID/
  );
});

test('directory construction, adapter/probe registration and invalid input perform no file access', async t => {
  const fs = await import('node:fs'); const {syncBuiltinESMExports} = await import('node:module');
  const {createHostIdentityUserDirectoryHealthProbeV010} = await import('../../dist/providers/identity-directory/runtime.js');
  const attempts = [];
  for (const name of ['readFileSync', 'mkdirSync', 'writeFileSync', 'renameSync']) t.mock.method(fs.default, name, () => {
    attempts.push(name); throw Error('UNEXPECTED_DIRECTORY_CONSTRUCTION_ACCESS:' + name);
  });
  syncBuiltinESMExports(); t.after(() => {t.mock.restoreAll(); syncBuiltinESMExports();});
  const store = createFileIdentityUserDirectoryStoreV010('/synthetic-directory/state.json');
  const service = createHostIdentityUserDirectoryServiceV010({store});
  assert.equal(typeof createHostIdentityUserDirectoryHealthProbeV010(service.provider), 'function');
  assert.throws(() => store.save({contractVersion: 'wrong', entries: []}), /SNAPSHOT_INVALID/);
  assert.throws(() => service.recordAuthenticatedPrincipal(principal({actorType: 'SERVICE'})), /PRINCIPAL_INVALID/);
  assert.throws(() => service.disable('', 'admin'), /REVOCATION_INVALID/);
  assert.deepEqual(attempts, []);
});

test('first directory snapshot reads once, keeps clone isolation and shares terminal disablement across consumers/restart', async t => {
  const fs = (await import('node:fs')).default; const {syncBuiltinESMExports} = await import('node:module');
  const dir = mkdtempSync(join(tmpdir(), 'directory-first-read-')), file = join(dir, 'directory.json');
  try {
    const seed = createHostIdentityUserDirectoryServiceV010({store: createFileIdentityUserDirectoryStoreV010(file)});
    seed.recordAuthenticatedPrincipal(principal()); const bytes = fs.readFileSync(file);
    const read = fs.readFileSync; let reads = 0;
    t.mock.method(fs, 'readFileSync', (path, ...args) => {if (path === file) reads++; return read(path, ...args);});
    syncBuiltinESMExports();
    const store = createFileIdentityUserDirectoryStoreV010(file);
    const one = createHostIdentityUserDirectoryServiceV010({store}), two = createHostIdentityUserDirectoryServiceV010({store});
    assert.equal(reads, 0); const snapshot = store.snapshot(); assert.equal(reads, 1);
    snapshot.entries[0].state = 'DISABLED'; assert.equal(two.provider.get('alice').state, 'ACTIVE');
    fs.writeFileSync(file, '{external-edit-not-a-refresh');
    assert.equal(one.provider.list()[0].state, 'ACTIVE'); assert.equal(reads, 1);
    fs.writeFileSync(file, bytes);
    one.disable('alice', 'synthetic-admin'); assert.equal(two.provider.get('alice').state, 'DISABLED');
    assert.throws(() => two.recordAuthenticatedPrincipal(principal()), /PRINCIPAL_DISABLED/); assert.equal(reads, 1);
    t.mock.restoreAll(); syncBuiltinESMExports();
    const restarted = createHostIdentityUserDirectoryServiceV010({store: createFileIdentityUserDirectoryStoreV010(file)});
    assert.equal(restarted.provider.get('alice').state, 'DISABLED');
    assert.throws(() => restarted.recordAuthenticatedPrincipal(principal()), /PRINCIPAL_DISABLED/);
    assert.equal(restarted.provider.get('alice').disabledBySubjectId, 'synthetic-admin');
  } finally {t.mock.restoreAll(); syncBuiltinESMExports(); fs.rmSync(dir, {recursive: true, force: true});}
});

for (const malformed of ['{invalid', '{"contractVersion":"wrong","entries":[]}', '{"contractVersion":"0.1.0","entries":{}}']) {
  test('bad directory first snapshot/save never overwrites data; same store retries after repair: ' + malformed, async () => {
    const fs = (await import('node:fs')).default;
    const dir = mkdtempSync(join(tmpdir(), 'directory-bad-state-')), file = join(dir, 'directory.json');
    try {
      fs.writeFileSync(file, malformed); const store = createFileIdentityUserDirectoryStoreV010(file);
      const service = createHostIdentityUserDirectoryServiceV010({store});
      for (const invoke of [() => store.snapshot(), () => store.save({contractVersion: '0.1.0', entries: []}),
        () => service.recordAuthenticatedPrincipal(principal()), () => service.disable('alice', 'admin')]) {
        assert.throws(invoke); assert.equal(fs.readFileSync(file, 'utf8'), malformed); assert.equal(fs.existsSync(file + '.tmp'), false);
      }
      fs.writeFileSync(file, '{"contractVersion":"0.1.0","entries":[]}');
      service.recordAuthenticatedPrincipal(principal()); assert.equal(service.provider.get('alice').state, 'ACTIVE');
    } finally {fs.rmSync(dir, {recursive: true, force: true});}
  });
}

test('non-ENOENT directory read failure never becomes an empty snapshot and can be retried', async t => {
  const fs = (await import('node:fs')).default; const {syncBuiltinESMExports} = await import('node:module');
  const dir = mkdtempSync(join(tmpdir(), 'directory-read-error-')), file = join(dir, 'directory.json');
  const read = fs.readFileSync;
  try {
    fs.writeFileSync(file, '{"contractVersion":"0.1.0","entries":[]}');
    t.mock.method(fs, 'readFileSync', (path, ...args) => {if (path === file) throw Object.assign(Error('synthetic-permission-denied'), {code: 'EACCES'}); return read(path, ...args);});
    syncBuiltinESMExports(); const store = createFileIdentityUserDirectoryStoreV010(file);
    assert.throws(() => store.snapshot(), /synthetic-permission-denied/);
    assert.throws(() => store.save({contractVersion: '0.1.0', entries: []}), /synthetic-permission-denied/);
    assert.equal(fs.existsSync(file + '.tmp'), false);
    t.mock.restoreAll(); syncBuiltinESMExports(); assert.deepEqual(store.snapshot().entries, []);
  } finally {t.mock.restoreAll(); syncBuiltinESMExports(); fs.rmSync(dir, {recursive: true, force: true});}
});

for (const failure of ['bad-file', 'write-failure']) test('directory ' + failure + ' prevents Session issuance; repair succeeds before issue and persisted disablement remains terminal', async () => {
  const fs = (await import('node:fs')).default;
  const {createAuthenticationFlowV010} = await import('../../dist/manager/authentication-flow.js');
  const {createMemoryManagedIdentitySessionEventStoreV010, createManagedIdentitySessionServiceV010} = await import('../../dist/manager/identity-session-store.js');
  const dir = mkdtempSync(join(tmpdir(), 'directory-before-session-')), file = join(dir, 'directory.json');
  try {
    if (failure === 'bad-file') fs.writeFileSync(file, '{invalid'); else fs.mkdirSync(file + '.tmp');
    const store = createFileIdentityUserDirectoryStoreV010(file), directory = createHostIdentityUserDirectoryServiceV010({store});
    const events = createMemoryManagedIdentitySessionEventStoreV010(); let issued = 0;
    const sessions = createManagedIdentitySessionServiceV010({store: events, token: () => 'synthetic-issued-' + ++issued});
    const flow = createAuthenticationFlowV010({provider: {providerId: 'synthetic.identity',
      complete() {return {contractVersion: '0.1.0', principal: principal()};}}, sessions,
      publicBaseUrl: 'https://directory.invalid', sessionTtlSeconds: 600,
      onAuthenticatedPrincipal: current => directory.recordAuthenticatedPrincipal(current)});
    const complete = () => flow.complete('https://directory.invalid/auth/callback?code=synthetic');
    await assert.rejects(complete); assert.equal(issued, 0); assert.deepEqual(events.list(), []);
    if (failure === 'bad-file') {assert.equal(fs.readFileSync(file, 'utf8'), '{invalid'); fs.writeFileSync(file, '{"contractVersion":"0.1.0","entries":[]}');}
    else {assert.deepEqual(store.snapshot().entries, []); assert.equal(fs.existsSync(file), false); fs.rmSync(file + '.tmp', {recursive: true});}
    const success = await complete(); assert.equal(issued, 1); assert.equal(success.session.principal.subjectId, 'alice'); assert.equal(events.list().length, 1);
    assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).entries[0].state, 'ACTIVE');
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /synthetic-issued-/);
    directory.disable('alice', 'synthetic-admin'); const disabled = fs.readFileSync(file);
    await assert.rejects(complete, /PRINCIPAL_DISABLED/); assert.equal(issued, 1); assert.deepEqual(fs.readFileSync(file), disabled);
  } finally {fs.rmSync(dir, {recursive: true, force: true});}
});
