import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  createMemoryPluginStorageService,
  createPluginEventBus
} from "../../dist/manager/plugin-host-services.js";
import {
  createProcessPluginRuntimeHostV010
} from "../../dist/manager/plugin-runtime-host.js";
import {
  createMemoryPluginIntegrityTrustStoreV010,
  createPluginIntegrityV010,
  sha256DigestV010
} from "../../dist/manager/package-integrity.js";

// K0 BOUNDED POSITIVE REGRESSION, NOT A GLOBAL STOP CERTIFICATE.
// Disposable local-child tests must reject the two previously reproduced
// negative states; this proves only the local PROCESS lifecycle barrier.
// Nothing in these tests attests Railway, cross-Host workers, IdP or DBA.

const {publicKey, privateKey} = generateKeyPairSync("ed25519");
const trustStore = createMemoryPluginIntegrityTrustStoreV010([{
  publisherId: "evo",
  keyId: "pa05-k0-local-fixture",
  algorithm: "Ed25519",
  publicKeyPem: publicKey.export({type: "spki", format: "pem"}),
  status: "TRUSTED",
  source: "test-only"
}]);
const entrypoint = fileURLToPath(
  new URL("../fixtures/pa05-k0-delayed-process.mjs", import.meta.url)
);

function fixturePackage(invocationTimeoutMs = 3000) {
  const pkg = {
    contractVersion: "0.1.0",
    packageId: "pa05-k0-disposable-process",
    displayName: "PA05 K0 Disposable Process",
    version: "0.1.0",
    type: "RUNTIME_EXTENSION",
    publisher: {id: "evo", displayName: "EVO", trust: "VERIFIED"},
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
      limits: {invocationTimeoutMs, memoryMb: 32}
    },
    storage: {scope: "PACKAGE", quotaBytes: 4096},
    events: {publish: [], subscribe: []},
    features: [{
      contractVersion: "0.1.0",
      featureId: "pa05-k0-disposable-process.default",
      packageId: "pa05-k0-disposable-process",
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true
    }]
  };
  pkg.integrity = createPluginIntegrityV010(pkg, privateKey, {
    keyId: "pa05-k0-local-fixture",
    artifact: {
      scope: "PROCESS_ENTRYPOINT",
      digest: sha256DigestV010(readFileSync(entrypoint))
    },
    provenance: {type: "INTERNAL_CI", reference: "test://pa05-k0-local-only"}
  });
  return pkg;
}

const installed = () => ({
  packageId: "pa05-k0-disposable-process",
  version: "0.1.0",
  installedAt: "2026-10-20T00:00:00.000Z",
  trustApproved: true,
  grantedPermissions: ["workspace.read"]
});

function localRuntime() {
  return createProcessPluginRuntimeHostV010({
    storageService: createMemoryPluginStorageService(),
    eventBus: createPluginEventBus(),
    integrityTrustStore: trustStore
  });
}

function pidAlive(pid) {
  try {
    process.kill(pid, 0); // local-process read-only existence check
    return true;
  } catch (error) {
    if (error?.code === "ESRCH") return false;
    throw error;
  }
}

test("K0 bounded: shutdown awaits previously removed-but-stopping PROCESS child", {timeout: 12000}, async () => {
  const host = localRuntime(), pkg = fixturePackage();
  let stopPending;
  let stopSettled = false;
  let pid;
  try {
    const reply = await host.invoke(pkg, installed(), {method: "pid", input: null});
    pid = reply.pid;
    assert.ok(Number.isSafeInteger(pid) && pid > 0);
    assert.equal(pidAlive(pid), true);
    stopPending = host.stop(pkg.packageId).then(() => {stopSettled = true;});
    // stop() synchronously removes map entry before it awaits child exit.
    assert.equal(host.status(pkg.packageId), undefined);
    await host.shutdown();
    const shutdownReturnedWithChildAlive = pidAlive(pid);
    const shutdownSkippedInFlightStop = !stopSettled;
    assert.equal(shutdownReturnedWithChildAlive, false);
    assert.equal(shutdownSkippedInFlightStop, false);
    await stopPending;
    assert.equal(stopSettled, true);
    console.log("PA05_K0_BOUNDED_STOP_BARRIER=" + JSON.stringify({
      scope: "isolated-local-child",
      shutdownReturnedWithChildAlive,
      shutdownSkippedInFlightStop,
      stopFinishedAfterwards: stopSettled,
      globalStopCertified: false
    }));
  } finally {
    // No deliberate orphan or leaked child even when an assertion fails.
    if (stopPending) await stopPending;
    await host.shutdown();
  }
});

test("K0 bounded: PROCESS host refuses new fork after shutdown()", {timeout: 12000}, async () => {
  const host = localRuntime(), pkg = fixturePackage();
  try {
    await host.shutdown();
    await assert.rejects(
      host.invoke(pkg, installed(), {method: "pid", input: null}),
      /PLUGIN_PROCESS_HOST_SHUTTING_DOWN/
    );
    await assert.rejects(
      host.start(pkg, installed()),
      /PLUGIN_PROCESS_HOST_SHUTTING_DOWN/
    );
    console.log("PA05_K0_BOUNDED_START_DENIED=" + JSON.stringify({
      scope: "isolated-local-child",
      postShutdownForkDenied: true,
      globalStopCertified: false
    }));
  } finally {
    await host.shutdown();
  }
});


test("K0 bounded: timed-out SIGKILL child is reaped before Host shutdown completes", {timeout: 12000}, async () => {
  const host = localRuntime(), pkg = fixturePackage(80);
  let pid;
  try {
    const first = await host.invoke(pkg, installed(), {method: "pid", input: null});
    pid = first.pid;
    assert.equal(pidAlive(pid), true);
    await assert.rejects(
      host.invoke(pkg, installed(), {method: "hang", input: null}),
      /PLUGIN_PROCESS_TIMEOUT/
    );
    // The active map is empty, but the timed-out PROCESS generation is
    // still covered by the independent close-receipt inventory.
    assert.equal(host.status(pkg.packageId), undefined);
    await host.shutdown();
    assert.equal(pidAlive(pid), false);
    console.log("PA05_K0_BOUNDED_TIMEOUT_REAPED=" + JSON.stringify({
      scope: "isolated-local-child",
      timeoutChildClosedBeforeShutdown: true,
      globalStopCertified: false
    }));
  } finally {
    await host.shutdown();
  }
});

test("K0 bounded: a new PROCESS generation cannot precede timed-out child close", {timeout: 12000}, async () => {
  const host = localRuntime(), pkg = fixturePackage(80);
  try {
    const first = await host.invoke(pkg, installed(), {method: "pid", input: null});
    assert.equal(pidAlive(first.pid), true);
    await assert.rejects(
      host.invoke(pkg, installed(), {method: "hang", input: null}),
      /PLUGIN_PROCESS_TIMEOUT/
    );
    const second = await host.invoke(pkg, installed(), {method: "pid", input: null});
    assert.notEqual(second.pid, first.pid);
    assert.equal(pidAlive(first.pid), false, "old child must close before new PID is returned");
    assert.equal(pidAlive(second.pid), true);
    assert.equal(host.status(pkg.packageId)?.status, "READY");
    // Give the previous generation's exit/close callbacks an event-loop
    // turn and assert they cannot delete this newly registered record.
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(host.status(pkg.packageId)?.status, "READY");
    console.log("PA05_K0_BOUNDED_GENERATION=" + JSON.stringify({
      scope: "isolated-local-child",
      priorChildClosed: true,
      newChildReady: true,
      staleCleanupDidNotDeleteReplacement: true,
      globalStopCertified: false
    }));
  } finally {
    await host.shutdown();
  }
});
