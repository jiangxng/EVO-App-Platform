import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";

import {
  createMemoryPluginIntegrityTrustStoreV010,
  createPluginIntegrityV010,
  sha256DigestV010
} from "../../dist/manager/package-integrity.js";
import { verifySigstoreBundleEvidenceV010 } from "../../dist/manager/sigstore-verifier.js";
import { validatePluginManifestV010 } from "../../dist/contracts/plugin-protocol.js";

function signedSigstorePackage(privateKey, artifact) {
  const pkg = {
    contractVersion: "0.1.0",
    packageId: "sigstore-plugin",
    displayName: "Sigstore Plugin",
    version: "1.0.0",
    type: "RUNTIME_EXTENSION",
    publisher: {
      id: "evo",
      displayName: "EVO",
      trust: "VERIFIED"
    },
    runtime: {
      kind: "PROCESS",
      isolation: "PROCESS",
      entrypoint: "./plugin.mjs"
    },
    features: [{
      contractVersion: "0.1.0",
      featureId: "sigstore-plugin.default",
      packageId: "sigstore-plugin",
      version: "1.0.0",
      activationScope: "INSTALLATION",
      defaultActivation: true
    }]
  };
  pkg.integrity = createPluginIntegrityV010(pkg, privateKey, {
    keyId: "release-sigstore",
    artifact: {
      scope: "PROCESS_ENTRYPOINT",
      digest: sha256DigestV010(artifact)
    },
    provenance: {
      type: "SIGSTORE_BUNDLE",
      reference: "sigstore://fixture",
      sigstore: {
        bundle: {
          mediaType: "application/vnd.dev.sigstore.bundle.v0.3+json",
          verificationMaterial: {},
          messageSignature: {}
        }
      }
    }
  });
  return pkg;
}

test("Sigstore adapter verifies bundle using Host-owned issuer and workflow identity policy", async () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const artifact = Buffer.from("sigstore artifact");
  const pkg = signedSigstorePackage(privateKey, artifact);
  const trust = createMemoryPluginIntegrityTrustStoreV010([{
    publisherId: "evo",
    keyId: "release-sigstore",
    algorithm: "Ed25519",
    publicKeyPem: publicKey.export({ type: "spki", format: "pem" }),
    status: "TRUSTED",
    provenancePolicy: {
      sigstore: {
        certificateIssuer: "https://token.actions.githubusercontent.com",
        certificateIdentityURI: "^https://github\\.com/jiangxng/EVO-App-Platform/.github/workflows/release\\.yml@refs/tags/v"
      }
    }
  }]);

  let observed;
  const result = await verifySigstoreBundleEvidenceV010(
    pkg,
    trust,
    artifact,
    async (bundle, data, options) => {
      observed = { bundle, data: data.toString("utf8"), options };
      return {};
    }
  );

  assert.equal(result.state, "VERIFIED");
  assert.equal(observed.data, "sigstore artifact");
  assert.equal(
    observed.options.certificateIssuer,
    "https://token.actions.githubusercontent.com"
  );
  assert.match(observed.options.certificateIdentityURI, /EVO-App-Platform/);
  assert.equal(observed.options.tlogThreshold, 1);
  assert.equal(observed.options.ctLogThreshold, 1);
});

test("Sigstore adapter fails closed without Host identity policy", async () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const artifact = Buffer.from("sigstore artifact");
  const pkg = signedSigstorePackage(privateKey, artifact);
  const trust = createMemoryPluginIntegrityTrustStoreV010([{
    publisherId: "evo",
    keyId: "release-sigstore",
    algorithm: "Ed25519",
    publicKeyPem: publicKey.export({ type: "spki", format: "pem" }),
    status: "TRUSTED"
  }]);

  const result = await verifySigstoreBundleEvidenceV010(
    pkg,
    trust,
    artifact,
    async () => ({})
  );
  assert.equal(result.state, "UNTRUSTED");
  assert.match(result.message, /Host trust store/);
});

test("Sigstore adapter converts verification failures into deterministic invalid evidence", async () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const artifact = Buffer.from("sigstore artifact");
  const pkg = signedSigstorePackage(privateKey, artifact);
  const trust = createMemoryPluginIntegrityTrustStoreV010([{
    publisherId: "evo",
    keyId: "release-sigstore",
    algorithm: "Ed25519",
    publicKeyPem: publicKey.export({ type: "spki", format: "pem" }),
    status: "TRUSTED",
    provenancePolicy: {
      sigstore: {
        certificateIssuer: "https://token.actions.githubusercontent.com",
        certificateIdentityEmail: "^release@example\\.com$"
      }
    }
  }]);

  const result = await verifySigstoreBundleEvidenceV010(
    pkg,
    trust,
    artifact,
    async () => {
      throw new Error("transparency proof invalid");
    }
  );
  assert.equal(result.state, "INVALID");
  assert.match(result.message, /transparency proof invalid/);
});

test("Plugin Protocol requires serialized bundle for SIGSTORE_BUNDLE provenance", () => {
  const { privateKey } = generateKeyPairSync("ed25519");
  const artifact = Buffer.from("sigstore artifact");
  const pkg = signedSigstorePackage(privateKey, artifact);
  delete pkg.integrity.provenance.sigstore;

  const result = validatePluginManifestV010(pkg);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some(issue => issue.code === "PLUGIN_SIGSTORE_BUNDLE_REQUIRED"));
});
