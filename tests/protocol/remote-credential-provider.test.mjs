import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { validatePluginManifestV010 } from "../../dist/contracts/plugin-protocol.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { inspectPluginRuntimeV010 } from "../../dist/manager/plugin-runtime-host.js";
import { createProviderRuntimeRegistry } from "../../dist/providers/runtime-registry.js";
import {
  HOST_REMOTE_CREDENTIAL_PROVIDER_FEATURE_ID,
  HOST_REMOTE_CREDENTIAL_PROVIDER_ID,
  REMOTE_CREDENTIAL_CAPABILITY,
  hostRemoteCredentialProviderPackage
} from "../../dist/providers/remote-credential/package.js";
import {
  createHostRemoteBearerCredentialProviderV010,
  parseHostRemoteBearerTokenMapV010
} from "../../dist/providers/remote-credential/runtime.js";

function remotePackage() {
  return {
    contractVersion: "0.1.0",
    packageId: "remote-consumer",
    displayName: "Remote Consumer",
    version: "0.1.0",
    type: "RUNTIME_EXTENSION",
    publisher: {
      id: "evo",
      displayName: "EVO",
      trust: "VERIFIED"
    },
    runtime: {
      kind: "REMOTE",
      isolation: "REMOTE",
      remote: {
        protocol: "EVO-REMOTE-RUNTIME-v0.1",
        endpoint: "https://runtime.example.invalid/invoke",
        hostAccess: "NONE",
        auth: {
          scheme: "HOST_BEARER",
          audience: "remote-consumer"
        }
      }
    },
    integrity: {
      format: "EVO-SIGNATURE-v0.1",
      algorithm: "Ed25519",
      keyId: "fixture",
      signature: "x".repeat(32)
    },
    features: [{
      contractVersion: "0.1.0",
      featureId: "remote-consumer.default",
      packageId: "remote-consumer",
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true
    }]
  };
}

test("Host Remote Credential Provider is a normal PLATFORM_PROVIDER and carries no secret", () => {
  assert.equal(hostRemoteCredentialProviderPackage.type, "PLATFORM_PROVIDER");
  assert.equal(validatePluginManifestV010(hostRemoteCredentialProviderPackage).ok, true);

  const serialized = JSON.stringify(hostRemoteCredentialProviderPackage);
  assert.equal(serialized.includes("Bearer "), false);
  assert.equal(serialized.includes("token-value"), false);

  const provider = hostRemoteCredentialProviderPackage.features[0].contributions
    .find(item => item.kind === "platform.service-provider");
  assert.equal(provider.provider.capability, REMOTE_CREDENTIAL_CAPABILITY);
  assert.equal(provider.provider.providerId, HOST_REMOTE_CREDENTIAL_PROVIDER_ID);
});

test("Host bearer credential runtime resolves package+audience before broader fallbacks", async () => {
  const parsed = parseHostRemoteBearerTokenMapV010(JSON.stringify({
    audiences: { shared: "audience-token" },
    packages: { "remote-consumer": "package-token" },
    packageAudiences: { "remote-consumer::shared": "specific-token" }
  }));
  assert.ok(parsed);

  const provider = createHostRemoteBearerCredentialProviderV010(parsed);
  assert.equal(
    await provider.getBearerToken({
      packageId: "remote-consumer",
      audience: "shared",
      endpoint: "https://runtime.example.invalid"
    }),
    "specific-token"
  );
  assert.equal(
    await provider.getBearerToken({
      packageId: "other",
      audience: "shared",
      endpoint: "https://runtime.example.invalid"
    }),
    "audience-token"
  );
  assert.equal(
    await provider.getBearerToken({
      packageId: "remote-consumer",
      audience: "other",
      endpoint: "https://runtime.example.invalid"
    }),
    "package-token"
  );
});

test("REMOTE install remains fail-closed until Provider Package is active and Provider Runtime is registered", () => {
  const remote = remotePackage();
  const catalog = createPackageCatalog([
    hostRemoteCredentialProviderPackage,
    remote
  ]);
  const store = createMemoryLifecycleStore();
  const registry = createProviderRuntimeRegistry();

  const descriptors = () => {
    const active = store.snapshot().activeFeatures;
    const result = [];
    for (const item of active) {
      const pkg = catalog.get(item.packageId);
      const feature = pkg?.features.find(value => value.featureId === item.featureId);
      for (const contribution of feature?.contributions ?? []) {
        if (
          contribution.kind === "platform.service-provider"
          && contribution.provider.capability === REMOTE_CREDENTIAL_CAPABILITY
        ) {
          result.push(contribution.provider);
        }
      }
    }
    return result;
  };

  const evaluateRuntime = pkg => {
    const status = inspectPluginRuntimeV010(pkg);
    if (
      pkg.runtime?.kind === "REMOTE"
      && status.status === "INACTIVE"
      && registry.resolve(descriptors(), REMOTE_CREDENTIAL_CAPABILITY)
    ) {
      return { ...status, status: "READY", message: "credential Provider available" };
    }
    return status;
  };

  const manager = createAppManagerService(
    catalog,
    store,
    () => new Date("2026-09-25T00:00:00Z"),
    new Map(),
    () => {},
    () => ({ state: "VERIFIED", message: "fixture integrity" }),
    evaluateRuntime
  );

  assert.ok(
    manager.planInstall("remote-consumer").blockers
      .some(item => item.code === "PLUGIN_RUNTIME_UNSUPPORTED")
  );

  store.saveInstalledPackage({
    packageId: hostRemoteCredentialProviderPackage.packageId,
    version: hostRemoteCredentialProviderPackage.version,
    installedAt: "2026-09-25T00:00:00.000Z"
  });
  store.saveActiveFeature({
    featureId: HOST_REMOTE_CREDENTIAL_PROVIDER_FEATURE_ID,
    packageId: hostRemoteCredentialProviderPackage.packageId,
    version: hostRemoteCredentialProviderPackage.version,
    activatedAt: "2026-09-25T00:00:00.000Z"
  });

  assert.ok(
    manager.planInstall("remote-consumer").blockers
      .some(item => item.code === "PLUGIN_RUNTIME_UNSUPPORTED")
  );

  registry.replace(
    HOST_REMOTE_CREDENTIAL_PROVIDER_ID,
    createHostRemoteBearerCredentialProviderV010({
      audiences: { "remote-consumer": "token" }
    })
  );

  assert.equal(
    manager.planInstall("remote-consumer").blockers
      .some(item => item.code === "PLUGIN_RUNTIME_UNSUPPORTED"),
    false
  );
});
