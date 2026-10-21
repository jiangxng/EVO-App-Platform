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

function fixturePackage(invocationTimeoutMs = 3000, sigstore = false, packageId = "pa05-k0-disposable-process") {
  const pkg = {
    contractVersion: "0.1.0",
    packageId,
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
      featureId: `${packageId}.default`,
      packageId,
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
    provenance: sigstore
      ? {type: "SIGSTORE_BUNDLE", sigstore: {bundle: {
        mediaType: "application/vnd.dev.sigstore.bundle.v0.3+json"
      }}}
      : {type: "INTERNAL_CI", reference: "test://pa05-k0-local-only"}
  });
  return pkg;
}

const installed = (packageId = "pa05-k0-disposable-process") => ({
  packageId,
  version: "0.1.0",
  installedAt: "2026-10-20T00:00:00.000Z",
  trustApproved: true,
  grantedPermissions: ["workspace.read"]
});

function localRuntime(options = {}) {
  return createProcessPluginRuntimeHostV010({
    storageService: createMemoryPluginStorageService(),
    eventBus: createPluginEventBus(),
    integrityTrustStore: trustStore,
    ...options
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


test("K0 bounded: concurrent async Sigstore starts reserve exactly one child", {timeout: 12000}, async () => {
  const pkg = fixturePackage(3000, true);
  let verifyCount = 0, forks = 0, release;
  const verifierGate = new Promise(resolve => {release = resolve;});
  const host = localRuntime({
    onRuntimeEvent(event) {
      if (event.type === "PROCESS_STARTING") forks += 1;
    },
    async verifyExternalEvidence(manifest) {
      verifyCount += 1;
      await verifierGate;
      return {
        state: "VERIFIED",
        packageId: manifest.packageId,
        evidenceType: "SIGSTORE_BUNDLE",
        message: "local-only fixture"
      };
    }
  });
  let first, second;
  try {
    first = host.start(pkg, installed());
    second = host.start(pkg, installed());
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(verifyCount, 1, "a concurrent start must reuse the single verifier");
    release();
    const [one, two] = await Promise.all([first, second]);
    assert.equal(one.status, "READY");
    assert.equal(two.status, "READY");
    assert.equal(forks, 1, "a package can have only one starting generation");
    const child = await host.invoke(pkg, installed(), {method: "pid", input: null});
    assert.equal(pidAlive(child.pid), true);
    console.log("PA05_K0_BOUNDED_ASYNC_FORK_SINGLETON=" + JSON.stringify({
      scope: "isolated-local-child", verifyCount, forks,
      globalStopCertified: false
    }));
  } finally {
    release();
    await Promise.allSettled([first, second].filter(Boolean));
    await host.shutdown();
  }
});

test("K0 bounded: stop during pending verifier refuses late fork", {timeout: 12000}, async () => {
  const pkg = fixturePackage(3000, true);
  let release, entered, forks = 0;
  const gate = new Promise(resolve => {release = resolve;});
  const verifierEntered = new Promise(resolve => {entered = resolve;});
  const host = localRuntime({
    onRuntimeEvent(event) {
      if (event.type === "PROCESS_STARTING") forks += 1;
    },
    async verifyExternalEvidence(manifest) {
      entered();
      await gate;
      return {state: "VERIFIED", packageId: manifest.packageId,
        evidenceType: "SIGSTORE_BUNDLE", message: "local-only fixture"};
    }
  });
  let launching, stopping;
  try {
    launching = host.start(pkg, installed());
    await verifierEntered;
    stopping = host.stop(pkg.packageId);
    release();
    await assert.rejects(launching, /PLUGIN_PROCESS_STOP_IN_PROGRESS/);
    await stopping;
    assert.equal(forks, 0);
    console.log("PA05_K0_BOUNDED_ASYNC_STOP_FENCE=" + JSON.stringify({
      scope: "isolated-local-child", forks, lateForkDenied: true,
      globalStopCertified: false
    }));
  } finally {
    release();
    if (launching) await Promise.allSettled([launching]);
    if (stopping) await stopping;
    await host.shutdown();
  }
});


test("K0 bounded: shutdown cancels a verifier that never returns and prevents a late fork", {timeout: 12000}, async () => {
  const pkg = fixturePackage(3000, true);
  let release, entered, forks = 0;
  const gate = new Promise(resolve => {release = resolve;});
  const verifierEntered = new Promise(resolve => {entered = resolve;});
  const host = localRuntime({
    onRuntimeEvent(event) { if (event.type === "PROCESS_STARTING") forks += 1; },
    async verifyExternalEvidence(manifest) {
      entered();
      await gate;
      return {state: "VERIFIED", packageId: manifest.packageId,
        evidenceType: "SIGSTORE_BUNDLE", message: "local-only fixture"};
    }
  });
  let starting;
  try {
    starting = host.start(pkg, installed());
    await verifierEntered;
    const shutdown = host.shutdown();
    const bounded = await Promise.race([
      shutdown.then(() => true),
      new Promise(resolve => setTimeout(() => resolve(false), 1000))
    ]);
    assert.equal(bounded, true, "local Host shutdown must not await a hung verifier");
    await assert.rejects(starting, /PLUGIN_PROCESS_HOST_SHUTTING_DOWN/);
    release();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(forks, 0, "late external verifier result must never fork");
    console.log("PA05_K0_BOUNDED_VERIFIER_SHUTDOWN=" + JSON.stringify({
      scope: "isolated-local-child",
      boundedShutdown: bounded, lateForks: forks, globalStopCertified: false
    }));
  } finally {
    release();
    if (starting) await Promise.allSettled([starting]);
    await host.shutdown();
  }
});

test("K0 bounded: stop cancels a never-resolving verifier without waiting for external work", {timeout: 12000}, async () => {
  const pkg = fixturePackage(3000, true);
  let release, entered, forks = 0;
  const gate = new Promise(resolve => {release = resolve;});
  const verifierEntered = new Promise(resolve => {entered = resolve;});
  const host = localRuntime({
    onRuntimeEvent(event) { if (event.type === "PROCESS_STARTING") forks += 1; },
    async verifyExternalEvidence(manifest) {
      entered();
      await gate;
      return {state: "VERIFIED", packageId: manifest.packageId,
        evidenceType: "SIGSTORE_BUNDLE", message: "local-only fixture"};
    }
  });
  let starting, stopping;
  try {
    starting = host.start(pkg, installed());
    await verifierEntered;
    stopping = host.stop(pkg.packageId);
    const bounded = await Promise.race([
      stopping.then(() => true),
      new Promise(resolve => setTimeout(() => resolve(false), 1000))
    ]);
    assert.equal(bounded, true, "local stop must revoke pending start without external verifier response");
    await assert.rejects(starting, /PLUGIN_PROCESS_STOP_IN_PROGRESS/);
    release();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(forks, 0);
    console.log("PA05_K0_BOUNDED_VERIFIER_STOP=" + JSON.stringify({
      scope: "isolated-local-child",
      boundedStop: bounded, lateForks: forks, globalStopCertified: false
    }));
  } finally {
    release();
    if (starting) await Promise.allSettled([starting]);
    if (stopping) await stopping;
    await host.shutdown();
  }
});

test("K0 bounded: unexpected child IPC disconnect fails pending invocation and reaps local child", {timeout: 12000}, async () => {
  const pkg = fixturePackage();
  const host = localRuntime();
  let pid;
  try {
    pid = (await host.invoke(pkg, installed(), {method: "pid", input: null})).pid;
    assert.equal(pidAlive(pid), true);
    await assert.rejects(
      host.invoke(pkg, installed(), {method: "disconnect-ipc", input: null}),
      /PLUGIN_PROCESS_EXITED|PLUGIN_PROCESS_ERROR|PLUGIN_PROCESS_FATAL/
    );
    await host.shutdown();
    assert.equal(pidAlive(pid), false);
    console.log("PA05_K0_BOUNDED_IPC_DISCONNECT=" + JSON.stringify({
      scope: "isolated-local-child",
      disconnectedChildClosed: true, globalStopCertified: false
    }));
  } finally {
    await host.shutdown();
  }
});


test("K0 bounded: shutdown reaps a child observed inside hung activate()", {timeout: 12000}, async () => {
  const pkg = fixturePackage(3000, false, "pa05-k0-activate-hang-process");
  let enteredActivation;
  let activationCalls = 0;
  const activationObserved = new Promise(resolve => { enteredActivation = resolve; });
  const underlyingStorage = createMemoryPluginStorageService();
  const storageService = {
    ...underlyingStorage,
    get(packageId, key) {
      if (packageId === pkg.packageId && key === "pa05-k0-activation-entered") {
        activationCalls += 1;
        enteredActivation();
      }
      return underlyingStorage.get(packageId, key);
    }
  };
  const host = localRuntime({storageService});
  let pendingStart;
  try {
    pendingStart = host.start(pkg, installed(pkg.packageId));
    // Unlike PROCESS_STARTING, scoped IPC proves the child imported the module
    // and began activate(). No ready event is sent while activate() hangs.
    const actuallyEntered = await Promise.race([
      activationObserved.then(() => true),
      new Promise(resolve => setTimeout(() => resolve(false), 3000))
    ]);
    assert.equal(actuallyEntered, true, "child must actually enter activate() via IPC");
    assert.equal(activationCalls, 1);
    assert.equal(host.status(pkg.packageId)?.status, "INACTIVE");
    const shutdownSettled = await Promise.race([
      host.shutdown().then(() => true),
      new Promise(resolve => setTimeout(() => resolve(false), 3500))
    ]);
    assert.equal(shutdownSettled, true, "shutdown must not wait for hung activate()");
    await assert.rejects(pendingStart, /PLUGIN_PROCESS_EXITED|PLUGIN_PROCESS_ERROR|PLUGIN_PROCESS_FATAL/);
    assert.equal(host.status(pkg.packageId), undefined);
    console.log("PA05_K0_BOUNDED_ACTIVATION_SHUTDOWN=" + JSON.stringify({
      scope: "isolated-local-child",
      activationEnteredByRealHostIPC: actuallyEntered,
      activationCalls,
      boundedShutdown: shutdownSettled,
      startupSettledByChildExit: true,
      noActiveRuntime: true,
      globalStopCertified: false
    }));
  } finally {
    // The test deliberately retains its live parent; independent self-exit
    // inside the fixture is a second cleanup fuse, not parent-SIGKILL proof.
    await host.shutdown();
    if (pendingStart) await Promise.allSettled([pendingStart]);
  }
});
