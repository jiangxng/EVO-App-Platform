import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createPluginRuntimeDispatcherV010 } from "../../dist/manager/plugin-runtime-dispatcher.js";
import {
  createJsonlPluginRuntimeObservabilitySinkV010,
  createPluginRuntimeObservabilityV010
} from "../../dist/manager/plugin-runtime-observability.js";
import { createMemoryPluginIntegrityTrustStoreV010 } from "../../dist/manager/package-integrity.js";

function processPackage() {
  return {
    contractVersion: "0.1.0",
    packageId: "runtime-process",
    displayName: "Runtime Process",
    version: "0.1.0",
    type: "RUNTIME_EXTENSION",
    publisher: { id: "evo", trust: "VERIFIED" },
    runtime: {
      kind: "PROCESS",
      isolation: "PROCESS",
      entrypoint: "./unused.mjs"
    },
    integrity: {
      format: "EVO-SIGNATURE-v0.1",
      algorithm: "Ed25519",
      keyId: "test",
      artifact: {
        scope: "PROCESS_ENTRYPOINT",
        digest: "sha256:" + "0".repeat(64)
      },
      signature: "x".repeat(32)
    },
    features: [{
      contractVersion: "0.1.0",
      featureId: "runtime-process.default",
      packageId: "runtime-process",
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true
    }]
  };
}

function remotePackage() {
  return {
    contractVersion: "0.1.0",
    packageId: "runtime-remote",
    displayName: "Runtime Remote",
    version: "0.1.0",
    type: "RUNTIME_EXTENSION",
    publisher: { id: "evo", trust: "VERIFIED" },
    runtime: {
      kind: "REMOTE",
      isolation: "REMOTE",
      remote: {
        protocol: "EVO-REMOTE-RUNTIME-v0.1",
        endpoint: "https://runtime.example.invalid/invoke",
        hostAccess: "NONE",
        auth: {
          scheme: "HOST_BEARER",
          audience: "runtime-remote"
        }
      }
    },
    integrity: {
      format: "EVO-SIGNATURE-v0.1",
      algorithm: "Ed25519",
      keyId: "test",
      signature: "x".repeat(32)
    },
    features: [{
      contractVersion: "0.1.0",
      featureId: "runtime-remote.default",
      packageId: "runtime-remote",
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true
    }]
  };
}

function installAndActivate(store, pkg) {
  store.saveInstalledPackage({
    packageId: pkg.packageId,
    version: pkg.version,
    installedAt: "2026-09-25T00:00:00.000Z",
    trustApproved: true,
    grantedPermissions: []
  });
  store.saveActiveFeature({
    featureId: pkg.features[0].featureId,
    packageId: pkg.packageId,
    version: pkg.version,
    activatedAt: "2026-09-25T00:00:00.000Z"
  });
}

test("runtime dispatcher enforces install/activation gates and routes PROCESS through Host-owned runtime", async () => {
  const pkg = processPackage();
  const catalog = createPackageCatalog([pkg]);
  const store = createMemoryLifecycleStore();
  const calls = [];
  const processHost = {
    async start() { throw new Error("unused"); },
    async invoke(receivedPkg, installed, request) {
      calls.push({ packageId: receivedPkg.packageId, installed: installed.packageId, request });
      return { ok: true };
    },
    async stop() {},
    status() { return undefined; },
    async shutdown() {}
  };
  const dispatcher = createPluginRuntimeDispatcherV010({
    catalog,
    store,
    processHost,
    integrityTrustStore: createMemoryPluginIntegrityTrustStoreV010()
  });

  await assert.rejects(
    dispatcher.invoke({ packageId: pkg.packageId, method: "run", input: {} }),
    /PLUGIN_RUNTIME_PACKAGE_NOT_INSTALLED/
  );

  store.saveInstalledPackage({
    packageId: pkg.packageId,
    version: pkg.version,
    installedAt: "2026-09-25T00:00:00.000Z"
  });
  await assert.rejects(
    dispatcher.invoke({ packageId: pkg.packageId, method: "run", input: {} }),
    /PLUGIN_RUNTIME_PACKAGE_NOT_ACTIVE/
  );

  store.saveActiveFeature({
    featureId: pkg.features[0].featureId,
    packageId: pkg.packageId,
    version: pkg.version,
    activatedAt: "2026-09-25T00:00:00.000Z"
  });

  assert.deepEqual(
    await dispatcher.invoke({ packageId: pkg.packageId, method: "run", input: { value: 1 } }),
    { ok: true }
  );
  assert.deepEqual(calls, [{
    packageId: "runtime-process",
    installed: "runtime-process",
    request: { method: "run", input: { value: 1 } }
  }]);
});

test("runtime dispatcher keeps REMOTE fail-closed until a credential Provider runtime is resolved", async () => {
  const pkg = remotePackage();
  const catalog = createPackageCatalog([pkg]);
  const store = createMemoryLifecycleStore();
  installAndActivate(store, pkg);

  const dispatcher = createPluginRuntimeDispatcherV010({
    catalog,
    store,
    processHost: {
      async start() { throw new Error("unused"); },
      async invoke() { throw new Error("unused"); },
      async stop() {},
      status() { return undefined; },
      async shutdown() {}
    },
    integrityTrustStore: createMemoryPluginIntegrityTrustStoreV010()
  });

  await assert.rejects(
    dispatcher.invoke({ packageId: pkg.packageId, method: "run", input: {} }),
    /PLUGIN_REMOTE_CREDENTIAL_PROVIDER_UNAVAILABLE/
  );
});

test("runtime observability can export durable JSONL without changing bounded in-memory semantics", () => {
  const dir = mkdtempSync(join(tmpdir(), "evo-runtime-observability-"));
  const file = join(dir, "runtime-events.jsonl");
  const sink = createJsonlPluginRuntimeObservabilitySinkV010(file);
  const store = createPluginRuntimeObservabilityV010(10, sink);

  store.record({
    packageId: "p",
    type: "INVOCATION_STARTED",
    occurredAt: "2026-09-25T00:00:00.000Z",
    invocationId: "i-1",
    method: "run"
  });
  store.record({
    packageId: "p",
    type: "INVOCATION_SUCCEEDED",
    occurredAt: "2026-09-25T00:00:00.010Z",
    invocationId: "i-1",
    durationMs: 10
  });

  const lines = readFileSync(file, "utf8").trim().split("\n").map(line => JSON.parse(line));
  assert.equal(lines.length, 2);
  assert.equal(lines[0].type, "INVOCATION_STARTED");
  assert.equal(lines[1].durationMs, 10);
  assert.equal(store.listEvents("p").length, 2);
});

test("observability sink failure never breaks runtime fact recording", () => {
  const store = createPluginRuntimeObservabilityV010(10, {
    write() {
      throw new Error("sink unavailable");
    }
  });
  assert.doesNotThrow(() => {
    store.record({
      packageId: "p",
      type: "PROCESS_READY",
      occurredAt: "2026-09-25T00:00:00.000Z"
    });
  });
  assert.equal(store.diagnostics("p").health, "healthy");
});
