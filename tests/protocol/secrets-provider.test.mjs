import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createEncryptedFileSecretStoreV010,
  createMemorySecretStoreV010
} from "../../dist/manager/secret-store.js";
import {
  createHostEncryptedSecretsProviderV010
} from "../../dist/providers/secrets/runtime.js";
import {
  HOST_ENCRYPTED_SECRETS_PROVIDER_ID,
  SECRETS_RESOLVE_CAPABILITY,
  hostEncryptedSecretsProviderPackage
} from "../../dist/providers/secrets/package.js";

const reference = {
  contractVersion: "0.1.0",
  namespace: "openai-llm-provider",
  key: "apiKey",
  scope: "INSTALLATION",
  scopeId: "default"
};

test("Host Secrets Provider exposes only the generic secrets.resolve capability", () => {
  const feature = hostEncryptedSecretsProviderPackage.features[0];
  assert.deepEqual(feature.providesCapabilities, [SECRETS_RESOLVE_CAPABILITY]);
  const contribution = feature.contributions.find(item => item.kind === "platform.service-provider");
  assert.equal(contribution.provider.providerId, HOST_ENCRYPTED_SECRETS_PROVIDER_ID);
  assert.equal(contribution.provider.capability, "secrets.resolve");
});

test("memory Secret store never returns plaintext through metadata", async () => {
  const store = createMemorySecretStoreV010(() => new Date("2026-09-26T00:00:00.000Z"));
  const provider = createHostEncryptedSecretsProviderV010(store);

  assert.equal((await provider.describe(reference)).configured, false);
  const descriptor = await provider.put(reference, "sk-test-secret");
  assert.equal(descriptor.configured, true);
  assert.equal(descriptor.updatedAt, "2026-09-26T00:00:00.000Z");
  assert.equal(Object.hasOwn(descriptor, "value"), false);
  assert.equal(await provider.resolve(reference), "sk-test-secret");

  await provider.remove(reference);
  assert.equal((await provider.describe(reference)).configured, false);
  await assert.rejects(async () => provider.resolve(reference), /SECRET_NOT_FOUND/);
});

test("encrypted file Secret store persists ciphertext and reloads with Host master key", () => {
  const dir = mkdtempSync(join(tmpdir(), "evo-secrets-"));
  try {
    const stateFile = join(dir, "secrets.enc.json");
    const keyFile = join(dir, "secrets.master.key");
    const store = createEncryptedFileSecretStoreV010(
      stateFile,
      keyFile,
      () => new Date("2026-09-26T01:02:03.000Z")
    );

    store.put(reference, "sk-super-sensitive-value");

    const stateBytes = readFileSync(stateFile, "utf8");
    const keyBytes = readFileSync(keyFile, "utf8");
    assert.doesNotMatch(stateBytes, /sk-super-sensitive-value/);
    assert.doesNotMatch(keyBytes, /sk-super-sensitive-value/);
    assert.match(stateBytes, /aes-256-gcm/);

    const reloaded = createEncryptedFileSecretStoreV010(stateFile, keyFile);
    assert.equal(reloaded.resolve(reference), "sk-super-sensitive-value");
    const metadata = reloaded.listMetadata("openai-llm-provider");
    assert.equal(metadata.length, 1);
    assert.equal(metadata[0].configured, true);
    assert.equal(metadata[0].reference.key, "apiKey");
    assert.equal(Object.hasOwn(metadata[0], "value"), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Secret reference scope fails closed when a required scope id is missing", () => {
  const store = createMemorySecretStoreV010();
  assert.throws(
    () => store.put({
      contractVersion: "0.1.0",
      namespace: "pkg",
      key: "credential",
      scope: "INSTALLATION"
    }, "value"),
    /SECRET_SCOPE_ID_REQUIRED/
  );
});

test("encrypted store construction and invalid requests touch no files or randomness", async t => {
  const fs = await import('node:fs');
  const crypto = await import('node:crypto');
  const {syncBuiltinESMExports} = await import('node:module');
  const attempts = [];
  const guard = name => () => {attempts.push(name); throw Error('UNEXPECTED_SECRET_CONSTRUCTION_RESOURCE:' + name);};
  for (const name of ['existsSync', 'mkdirSync', 'readFileSync', 'writeFileSync', 'chmodSync', 'renameSync']) t.mock.method(fs.default, name, guard(name));
  t.mock.method(crypto.default, 'randomBytes', guard('randomBytes'));
  syncBuiltinESMExports();
  t.after(() => {t.mock.restoreAll(); syncBuiltinESMExports();});
  const store = createEncryptedFileSecretStoreV010('/synthetic-secrets/state.json', '/synthetic-secrets/key');
  const provider = createHostEncryptedSecretsProviderV010(store);
  const invalid = {...reference, scopeId: undefined};
  assert.throws(() => provider.describe(invalid), /SECRET_SCOPE_ID_REQUIRED/);
  assert.throws(() => provider.resolve(invalid), /SECRET_SCOPE_ID_REQUIRED/);
  assert.throws(() => provider.put(invalid, 'synthetic'), /SECRET_SCOPE_ID_REQUIRED/);
  assert.throws(() => provider.remove(invalid), /SECRET_SCOPE_ID_REQUIRED/);
  assert.throws(() => provider.put(reference, '  '), /SECRET_VALUE_EMPTY/);
  assert.deepEqual(attempts, []);
});

test("first metadata initializes once; shared consumers retain synchronous scope isolation and original snapshot", async () => {
  const fs = await import('node:fs');
  const dir = mkdtempSync(join(tmpdir(), 'evo-secrets-first-use-'));
  try {
    const state = join(dir, 'nested', 'state.json'), key = join(dir, 'nested', 'key');
    const store = createEncryptedFileSecretStoreV010(state, key);
    const one = createHostEncryptedSecretsProviderV010(store), two = createHostEncryptedSecretsProviderV010(store);
    assert.equal(fs.existsSync(join(dir, 'nested')), false);
    assert.equal(one.describe(reference).configured, false);
    const originalKey = readFileSync(key);
    assert.equal(fs.existsSync(state), false, 'metadata must not create encrypted state');
    assert.throws(() => one.resolve(reference), /SECRET_NOT_FOUND/);
    const second = {...reference, namespace: 'deepseek-llm-provider'};
    await Promise.all([Promise.resolve().then(() => one.put(reference, 'synthetic-one')),
      Promise.resolve().then(() => two.put(second, 'synthetic-two'))]);
    assert.equal(one.resolve(reference), 'synthetic-one'); assert.equal(two.resolve(second), 'synthetic-two');
    assert.throws(() => one.resolve({...reference, scopeId: 'other'}), /SECRET_NOT_FOUND/);
    assert.equal(store.listMetadata().length, 2); assert.equal(store.listMetadata(reference.namespace).length, 1);
    assert.deepEqual(readFileSync(key), originalKey);
    const bytes = readFileSync(state);
    fs.writeFileSync(state, '{external-edit-is-not-a-refresh');
    assert.equal(two.resolve(second), 'synthetic-two', 'retain original in-process snapshot contract');
    fs.writeFileSync(state, bytes);
    one.remove(reference); assert.equal(two.describe(reference).configured, false);
    assert.equal(two.resolve(second), 'synthetic-two');
    const reopened = createEncryptedFileSecretStoreV010(state, key);
    assert.equal(reopened.resolve(second), 'synthetic-two'); assert.equal(reopened.describe(reference).configured, false);
    assert.doesNotMatch(readFileSync(state, 'utf8'), /synthetic-one|synthetic-two/);
    if (process.platform !== 'win32') {
      assert.equal(fs.statSync(key).mode & 0o777, 0o600); assert.equal(fs.statSync(state).mode & 0o777, 0o600);
    }
  } finally {rmSync(dir, {recursive: true, force: true});}
});

for (const malformed of ['{invalid', '{"contractVersion":"wrong","records":{}}', '{"contractVersion":"0.1.0","records":[]}']) {
  test("bad state rejects all initial operations without generating key, then same store recovers: " + malformed, async () => {
    const fs = await import('node:fs');
    const dir = mkdtempSync(join(tmpdir(), 'evo-secrets-bad-state-'));
    try {
      const state = join(dir, 'state.json'), key = join(dir, 'key'); fs.writeFileSync(state, malformed);
      const store = createEncryptedFileSecretStoreV010(state, key);
      for (const call of [() => store.describe(reference), () => store.resolve(reference),
        () => store.put(reference, 'synthetic-new'), () => store.remove(reference), () => store.listMetadata()]) {
        assert.throws(call); assert.equal(readFileSync(state, 'utf8'), malformed); assert.equal(fs.existsSync(key), false);
      }
      fs.writeFileSync(state, '{"contractVersion":"0.1.0","records":{}}');
      store.put(reference, 'synthetic-recovered'); assert.equal(store.resolve(reference), 'synthetic-recovered');
    } finally {rmSync(dir, {recursive: true, force: true});}
  });
}

test("invalid or missing master key never replaces existing ciphertext; repair retries the original store", async () => {
  const fs = await import('node:fs');
  const dir = mkdtempSync(join(tmpdir(), 'evo-secrets-bad-key-'));
  try {
    const state = join(dir, 'state.json'), key = join(dir, 'key');
    createEncryptedFileSecretStoreV010(state, key).put(reference, 'synthetic-existing');
    const originalState = readFileSync(state), originalKey = readFileSync(key);
    for (const mode of ['invalid', 'missing']) {
      if (mode === 'invalid') fs.writeFileSync(key, 'invalid-key'); else fs.unlinkSync(key);
      const store = createEncryptedFileSecretStoreV010(state, key);
      const error = mode === 'invalid' ? /SECRETS_MASTER_KEY_INVALID/ : /SECRETS_MASTER_KEY_MISSING/;
      for (const call of [() => store.describe(reference), () => store.resolve(reference),
        () => store.put(reference, 'synthetic-replacement'), () => store.remove(reference), () => store.listMetadata()]) {
        assert.throws(call, error); assert.deepEqual(readFileSync(state), originalState);
        if (mode === 'missing') assert.equal(fs.existsSync(key), false);
        else assert.equal(readFileSync(key, 'utf8'), 'invalid-key');
      }
      fs.writeFileSync(key, originalKey);
      assert.equal(store.resolve(reference), 'synthetic-existing'); assert.deepEqual(readFileSync(state), originalState);
    }
  } finally {rmSync(dir, {recursive: true, force: true});}
});

test("a well-formed wrong key fails GCM authentication without changing ciphertext; restored key requires a fresh snapshot", async () => {
  const fs = await import('node:fs');
  const dir = mkdtempSync(join(tmpdir(), 'evo-secrets-wrong-key-'));
  try {
    const state = join(dir, 'state.json'), key = join(dir, 'key');
    createEncryptedFileSecretStoreV010(state, key).put(reference, 'synthetic-existing');
    const bytes = readFileSync(state), master = readFileSync(key);
    const wrong = Buffer.from(master.toString().trim(), 'base64'); wrong[0] ^= 0xff;
    fs.writeFileSync(key, wrong.toString('base64'));
    const store = createEncryptedFileSecretStoreV010(state, key);
    assert.equal(store.describe(reference).configured, true, 'metadata is not a decrypt/health guarantee');
    assert.throws(() => store.resolve(reference)); assert.deepEqual(readFileSync(state), bytes);
    fs.writeFileSync(key, master); assert.throws(() => store.resolve(reference), 'successful initialization retains its snapshot');
    assert.equal(createEncryptedFileSecretStoreV010(state, key).resolve(reference), 'synthetic-existing');
    assert.deepEqual(readFileSync(state), bytes);
  } finally {rmSync(dir, {recursive: true, force: true});}
});
