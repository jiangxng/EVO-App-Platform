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
