import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";

import {
  createMemoryPluginIntegrityTrustStoreV010,
  createPluginIntegrityV010,
  sha256DigestV010,
  verifyPackageIntegrityV010
} from "../../dist/manager/package-integrity.js";
import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";

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


test("install planning rejects a package whose signed publisher key is not trusted", () => {
  const { privateKey } = generateKeyPairSync("ed25519");
  const pkg = basePackage();
  pkg.features[0].defaultActivation = true;
  pkg.integrity = createPluginIntegrityV010(pkg, privateKey, { keyId: "unknown-key" });

  const trust = createMemoryPluginIntegrityTrustStoreV010();
  const manager = createAppManagerService(
    createPackageCatalog([pkg]),
    createMemoryLifecycleStore(),
    () => new Date("2026-09-25T00:00:00Z"),
    new Map(),
    () => {},
    candidate => verifyPackageIntegrityV010(candidate, trust)
  );

  const plan = manager.planInstall("signed-plugin");
  assert.ok(plan.blockers.some(x => x.code === "PACKAGE_INTEGRITY_REJECTED"));
});


test("SLSA provenance binds artifact digest and trusted builder expectations", () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  const artifact = Buffer.from("slsa artifact bytes");
  const digest = sha256DigestV010(artifact);
  const pkg = basePackage();
  pkg.integrity = createPluginIntegrityV010(pkg, privateKey, {
    keyId: "release-slsa",
    artifact: {
      scope: "PACKAGE_BUNDLE",
      digest
    },
    provenance: {
      type: "SLSA_PROVENANCE",
      statement: {
        _type: "https://in-toto.io/Statement/v1",
        subject: [{
          name: "signed-plugin-1.0.0.tgz",
          digest: { sha256: digest.replace("sha256:", "") }
        }],
        predicateType: "https://slsa.dev/provenance/v1",
        predicate: {
          buildDefinition: {
            buildType: "https://github.com/jiangxng/EVO-App-Platform/.github/workflows/release.yml@v1",
            externalParameters: { ref: "refs/tags/v1.0.0" }
          },
          runDetails: {
            builder: {
              id: "https://github.com/actions/runner"
            }
          }
        }
      }
    }
  });

  const trust = createMemoryPluginIntegrityTrustStoreV010([{
    publisherId: "evo",
    keyId: "release-slsa",
    algorithm: "Ed25519",
    publicKeyPem,
    status: "TRUSTED",
    provenancePolicy: {
      allowedBuilderIds: ["https://github.com/actions/runner"],
      allowedBuildTypes: [
        "https://github.com/jiangxng/EVO-App-Platform/.github/workflows/release.yml@v1"
      ]
    }
  }]);

  assert.equal(verifyPackageIntegrityV010(pkg, trust, artifact).state, "VERIFIED");
});

test("SLSA provenance fails closed when builder identity is outside Host root of trust", () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  const artifact = Buffer.from("slsa artifact bytes");
  const digest = sha256DigestV010(artifact);
  const pkg = basePackage();
  pkg.integrity = createPluginIntegrityV010(pkg, privateKey, {
    keyId: "release-slsa",
    artifact: { scope: "PACKAGE_BUNDLE", digest },
    provenance: {
      type: "SLSA_PROVENANCE",
      statement: {
        _type: "https://in-toto.io/Statement/v1",
        subject: [{
          name: "signed-plugin.tgz",
          digest: { sha256: digest.replace("sha256:", "") }
        }],
        predicateType: "https://slsa.dev/provenance/v1",
        predicate: {
          buildDefinition: {
            buildType: "https://example.invalid/build",
            externalParameters: {}
          },
          runDetails: {
            builder: { id: "https://untrusted-builder.invalid" }
          }
        }
      }
    }
  });

  const trust = createMemoryPluginIntegrityTrustStoreV010([{
    publisherId: "evo",
    keyId: "release-slsa",
    algorithm: "Ed25519",
    publicKeyPem,
    status: "TRUSTED",
    provenancePolicy: {
      allowedBuilderIds: ["https://github.com/actions/runner"]
    }
  }]);

  const result = verifyPackageIntegrityV010(pkg, trust, artifact);
  assert.equal(result.state, "UNTRUSTED");
  assert.match(result.message, /builder/i);
});

test("SLSA provenance subject must match the signed artifact digest", () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  const artifact = Buffer.from("slsa artifact bytes");
  const digest = sha256DigestV010(artifact);
  const pkg = basePackage();
  pkg.integrity = createPluginIntegrityV010(pkg, privateKey, {
    keyId: "release-slsa",
    artifact: { scope: "PACKAGE_BUNDLE", digest },
    provenance: {
      type: "SLSA_PROVENANCE",
      statement: {
        _type: "https://in-toto.io/Statement/v1",
        subject: [{
          name: "signed-plugin.tgz",
          digest: { sha256: "f".repeat(64) }
        }],
        predicateType: "https://slsa.dev/provenance/v1",
        predicate: {
          buildDefinition: {
            buildType: "https://example.invalid/build",
            externalParameters: {}
          },
          runDetails: {
            builder: { id: "https://builder.example" }
          }
        }
      }
    }
  });

  const trust = createMemoryPluginIntegrityTrustStoreV010([{
    publisherId: "evo",
    keyId: "release-slsa",
    algorithm: "Ed25519",
    publicKeyPem,
    status: "TRUSTED"
  }]);

  const result = verifyPackageIntegrityV010(pkg, trust, artifact);
  assert.equal(result.state, "INVALID");
  assert.match(result.message, /subject/i);
});
