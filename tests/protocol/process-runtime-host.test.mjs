import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { generateKeyPairSync } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createMemoryPluginStorageService,
  createPluginEventBus
} from "../../dist/manager/plugin-host-services.js";
import {
  createProcessPluginRuntimeHostV010,
  inspectPluginRuntimeV010
} from "../../dist/manager/plugin-runtime-host.js";
import {
  createMemoryPluginIntegrityTrustStoreV010,
  createPluginIntegrityV010,
  sha256DigestV010
} from "../../dist/manager/package-integrity.js";
import {
  createPluginRuntimeObservabilityV010
} from "../../dist/manager/plugin-runtime-observability.js";

const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
const trustStore = createMemoryPluginIntegrityTrustStoreV010([{
  publisherId: "evo",
  keyId: "release-key-1",
  algorithm: "Ed25519",
  publicKeyPem,
  status: "TRUSTED",
  source: "test"
}]);

function processPackage(overrides = {}) {
  const entrypoint = fileURLToPath(new URL("../fixtures/process-plugin.mjs", import.meta.url));
  const base = {
    contractVersion: "0.1.0",
    packageId: "process-plugin",
    displayName: "Process Plugin",
    version: "0.1.0",
    type: "RUNTIME_EXTENSION",
    publisher: {
      id: "evo",
      displayName: "EVO",
      trust: "VERIFIED"
    },
    permissions: [{
      id: "workspace.read",
      label: "Read workspace",
      risk: "LOW",
      required: true
    }],
    runtime: {
      kind: "PROCESS",
      isolation: "PROCESS",
      entrypoint,
      limits: {
        invocationTimeoutMs: 250,
        memoryMb: 32
      }
    },
    storage: {
      scope: "PACKAGE",
      quotaBytes: 4096
    },
    events: {
      publish: ["process-plugin.changed"],
      subscribe: []
    },
    features: [{
      contractVersion: "0.1.0",
      featureId: "process-plugin.default",
      packageId: "process-plugin",
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true
    }],
    ...overrides
  };

  if (!Object.prototype.hasOwnProperty.call(overrides, "integrity")) {
    base.integrity = createPluginIntegrityV010(base, privateKey, {
      keyId: "release-key-1",
      artifact: {
        scope: "PROCESS_ENTRYPOINT",
        digest: sha256DigestV010(readFileSync(entrypoint))
      },
      provenance: {
        type: "INTERNAL_CI",
        reference: "test://process-runtime"
      }
    });
  }
  return base;
}

function installed() {
  return {
    packageId: "process-plugin",
    version: "0.1.0",
    installedAt: "2026-09-25T00:00:00.000Z",
    trustApproved: true,
    grantedPermissions: ["workspace.read"]
  };
}

test("verified PROCESS runtime executes through scoped Host API in a supervised child process", async () => {
  const pkg = processPackage();
  assert.equal(inspectPluginRuntimeV010(pkg).status, "READY");

  const storage = createMemoryPluginStorageService();
  const eventBus = createPluginEventBus(() => new Date("2026-09-25T00:00:00Z"));
  const observed = [];
  const unsubscribe = eventBus.subscribe("observer", "process-plugin.changed", event => {
    observed.push(event);
  });
  const host = createProcessPluginRuntimeHostV010({
    storageService: storage,
    eventBus,
    integrityTrustStore: trustStore
  });

  try {
    const echo = await host.invoke(pkg, installed(), {
      method: "echo",
      input: { value: 7 }
    });
    assert.deepEqual(echo, {
      input: { value: 7 },
      packageId: "process-plugin"
    });

    const permission = await host.invoke(pkg, installed(), {
      method: "permission",
      input: "workspace.read"
    });
    assert.deepEqual(permission, {
      allowed: true,
      granted: ["workspace.read"]
    });

    const stored = await host.invoke(pkg, installed(), {
      method: "storage",
      input: { count: 3 }
    });
    assert.deepEqual(stored, { count: 3 });
    assert.deepEqual(storage.get("process-plugin", "state"), { count: 3 });

    await host.invoke(pkg, installed(), {
      method: "publish",
      input: { id: 1 }
    });
    assert.equal(observed.length, 1);
    assert.equal(observed[0].publisherPackageId, "process-plugin");
  } finally {
    unsubscribe();
    await host.shutdown();
  }
});

test("process runtime does not inherit host secrets and ordinary fs APIs are permission constrained", async () => {
  const pkg = processPackage();
  const storage = createMemoryPluginStorageService();
  const eventBus = createPluginEventBus();
  const host = createProcessPluginRuntimeHostV010({
    storageService: storage,
    eventBus,
    integrityTrustStore: trustStore
  });
  const outsideFile = join(tmpdir(), `evo-runtime-outside-${process.pid}.txt`);
  writeFileSync(outsideFile, "host-only", "utf8");
  const previous = process.env.EVO_PROCESS_TEST_SECRET;
  process.env.EVO_PROCESS_TEST_SECRET = "must-not-cross-process-boundary";

  try {
    const environment = await host.invoke(pkg, installed(), {
      method: "environment",
      input: null
    });
    assert.deepEqual(environment, { leakedSecret: null });

    const read = await host.invoke(pkg, installed(), {
      method: "read-file",
      input: outsideFile
    });
    assert.deepEqual(read, { allowed: false, code: "ERR_ACCESS_DENIED" });
  } finally {
    if (previous === undefined) delete process.env.EVO_PROCESS_TEST_SECRET;
    else process.env.EVO_PROCESS_TEST_SECRET = previous;
    unlinkSync(outsideFile);
    await host.shutdown();
  }
});

test("timeout or crash is contained and the next invocation starts a fresh plugin process", async () => {
  const pkg = processPackage();
  const storage = createMemoryPluginStorageService();
  const eventBus = createPluginEventBus();
  const observability = createPluginRuntimeObservabilityV010();
  const host = createProcessPluginRuntimeHostV010({
    storageService: storage,
    eventBus,
    integrityTrustStore: trustStore,
    onRuntimeEvent: event => observability.record(event)
  });

  try {
    await assert.rejects(
      host.invoke(pkg, installed(), { method: "hang", input: null }),
      /PLUGIN_PROCESS_TIMEOUT/
    );

    const afterTimeout = await host.invoke(pkg, installed(), {
      method: "echo",
      input: "after-timeout"
    });
    assert.deepEqual(afterTimeout, {
      input: "after-timeout",
      packageId: "process-plugin"
    });

    await assert.rejects(
      host.invoke(pkg, installed(), { method: "crash", input: null }),
      /PLUGIN_PROCESS_EXITED/
    );

    const afterCrash = await host.invoke(pkg, installed(), {
      method: "echo",
      input: "after-crash"
    });
    assert.deepEqual(afterCrash, {
      input: "after-crash",
      packageId: "process-plugin"
    });

    const diagnostics = observability.diagnostics("process-plugin");
    assert.equal(diagnostics.timeouts, 1);
    assert.ok(diagnostics.crashes >= 1);
    assert.ok(diagnostics.restarts >= 2);
    assert.ok(diagnostics.invocations >= 4);
  } finally {
    await host.shutdown();
  }
});

test("unverified executable packages remain fail-closed for local process execution", async () => {
  const pkg = processPackage({
    publisher: {
      id: "unknown",
      displayName: "Unknown",
      trust: "UNVERIFIED"
    }
  });
  const status = inspectPluginRuntimeV010(pkg);
  assert.equal(status.status, "UNSUPPORTED");

  const host = createProcessPluginRuntimeHostV010({
    storageService: createMemoryPluginStorageService(),
    eventBus: createPluginEventBus(),
    integrityTrustStore: trustStore
  });

  await assert.rejects(
    host.start(pkg, installed()),
    /PLUGIN_PROCESS_RUNTIME_NOT_ADMITTED/
  );
});
