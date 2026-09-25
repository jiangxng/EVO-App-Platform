import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";

import {
  createMemoryPluginIntegrityTrustStoreV010,
  createPluginIntegrityV010,
  sha256DigestV010,
  verifyPackageIntegrityV010
} from "../../dist/manager/package-integrity.js";

function basePackage() {
  return {
    contractVersion: "0.1.0",
    packageId: "signed-plugin",
    displayName: "Signed Plugin",
    version: "1.0.0",
    type: "APPLICATION",
    publisher: {
      id: "evo",
      displayName: "EVO",
      trust: "VERIFIED"
    },
    features: [{
      contractVersion: "0.1.0",
      featureId: "signed-plugin.default",
      packageId: "signed-plugin",
      version: "1.0.0",
      activationScope: "INSTALLATION"
    }]
  };
}

test("Ed25519 package signature verifies trusted publisher and artifact digest", () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  const artifact = Buffer.from("signed artifact bytes");
  const pkg = basePackage();
  pkg.integrity = createPluginIntegrityV010(pkg, privateKey, {
    keyId: "release-1",
    artifact: {
      scope: "PACKAGE_BUNDLE",
      digest: sha256DigestV010(artifact)
    },
    provenance: {
      type: "INTERNAL_CI",
      reference: "ci://release/123"
    }
  });

  const trust = createMemoryPluginIntegrityTrustStoreV010([{
    publisherId: "evo",
    keyId: "release-1",
    algorithm: "Ed25519",
    publicKeyPem,
    status: "TRUSTED"
  }]);

  assert.equal(verifyPackageIntegrityV010(pkg, trust).state, "PENDING_ARTIFACT");
  assert.equal(verifyPackageIntegrityV010(pkg, trust, artifact).state, "VERIFIED");
  assert.equal(
    verifyPackageIntegrityV010(pkg, trust, Buffer.from("tampered")).state,
    "INVALID"
  );
});

test("package signature binds manifest identity and version", () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  const pkg = basePackage();
  pkg.integrity = createPluginIntegrityV010(pkg, privateKey, { keyId: "release-1" });

  const trust = createMemoryPluginIntegrityTrustStoreV010([{
    publisherId: "evo",
    keyId: "release-1",
    algorithm: "Ed25519",
    publicKeyPem,
    status: "TRUSTED"
  }]);

  assert.equal(verifyPackageIntegrityV010(pkg, trust).state, "VERIFIED");

  const tampered = structuredClone(pkg);
  tampered.version = "1.0.1";
  assert.equal(verifyPackageIntegrityV010(tampered, trust).state, "INVALID");
});

test("unknown or revoked signing keys fail closed", () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  const pkg = basePackage();
  pkg.integrity = createPluginIntegrityV010(pkg, privateKey, { keyId: "release-1" });

  assert.equal(
    verifyPackageIntegrityV010(
      pkg,
      createMemoryPluginIntegrityTrustStoreV010()
    ).state,
    "UNTRUSTED"
  );

  assert.equal(
    verifyPackageIntegrityV010(
      pkg,
      createMemoryPluginIntegrityTrustStoreV010([{
        publisherId: "evo",
        keyId: "release-1",
        algorithm: "Ed25519",
        publicKeyPem,
        status: "REVOKED"
      }])
    ).state,
    "UNTRUSTED"
  );
});
