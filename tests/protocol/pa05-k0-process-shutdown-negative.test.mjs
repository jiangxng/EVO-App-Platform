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

// K0 NEGATIVE EVIDENCE, NOT A SAFETY ACCEPTANCE TEST.
// These disposable local-child tests intentionally characterize the CURRENT
// missing admission barrier and the runtime-map-before-exit window.
// A PASS here means the negative condition was reproduced, not STOP_CONFIRMED.
// Keep this Draft branch unmerged; replace with fail-closed regression tests
// when a separately reviewed engineering change addresses the behavior.

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

function fixturePackage() {
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
      limits: {invocationTimeoutMs: 3000, memoryMb: 32}
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

test("K0 NEGATIVE: stop drops map entry before OS child exit; shutdown snapshot misses pending stop", {timeout: 12000}, async () => {
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
    assert.equal(shutdownReturnedWithChildAlive, true);
    assert.equal(shutdownSkippedInFlightStop, true);
    await stopPending;
    assert.equal(stopSettled, true);
    console.log("PA05_K0_NEGATIVE_STOP_SNAPSHOT=" + JSON.stringify({
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

test("K0 NEGATIVE: PROCESS host permits a new child invocation after its shutdown() resolved", {timeout: 12000}, async () => {
  const host = localRuntime(), pkg = fixturePackage();
  try {
    await host.shutdown();
    const reply = await host.invoke(pkg, installed(), {method: "pid", input: null});
    const spawnedAfterShutdown = Number.isSafeInteger(reply.pid) && pidAlive(reply.pid);
    console.log("PA05_K0_NEGATIVE_START_AFTER_SHUTDOWN=" + JSON.stringify({
      scope: "isolated-local-child",
      spawnedAfterShutdown,
      globalStopCertified: false
    }));
    assert.equal(spawnedAfterShutdown, true);
  } finally {
    await host.shutdown();
  }
});
