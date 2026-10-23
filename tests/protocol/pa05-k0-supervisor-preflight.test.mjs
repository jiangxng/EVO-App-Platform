import test from "node:test";
import assert from "node:assert/strict";
import {
  observeK0LocalCgroupHints,
  assertK0IndependentSupervisorReady
} from "../fixtures/pa05-k0-external-supervisor-preflight.mjs";

// No process kill, fork, cgroup modification, production traffic or
// privileged reads. This is a preflight DENIAL / instrumentation test only,
// deliberately separate from the 11 bounded PROCESS lifecycle regressions.
test("K0 external supervisor: inspect local cgroup hints without claiming authority", () => {
  const report = observeK0LocalCgroupHints();
  assert.equal(report.scope, "test-runner-local-readonly");
  assert.equal(typeof report.linux, "boolean");
  assert.equal(typeof report.cgroupV2Detected, "boolean");
  assert.equal(typeof report.ownCgroupLocated, "boolean");
  assert.equal(typeof report.cgroupKillPresent, "boolean");
  assert.equal(typeof report.eventsReadable, "boolean");
  assert.ok(report.observedPopulated === null
    || report.observedPopulated === "0"
    || report.observedPopulated === "1");
  for (const key of [
    "dedicatedCgroupOwnershipVerified",
    "independentSupervisorLifetimeVerified",
    "childTreeTerminationAuthorityVerified",
    "emergencyReaperAndTtlVerified",
    "independentlySignedExitReceiptVerified",
    "parentSigkillExperimentAuthorized",
    "globalStopCertified"
  ]) assert.equal(report[key], false, key);
  assert.throws(() => assertK0IndependentSupervisorReady(), /PA05_K0_PARENT_SIGKILL_DENIED/);
  console.log("PA05_K0_EXTERNAL_SUPERVISOR_PREFLIGHT=" + JSON.stringify(report));
});

test("K0 external supervisor: operator assertions cannot bypass independent proof", () => {
  assert.throws(() => assertK0IndependentSupervisorReady({
    parentSigkillExperimentAuthorized: true,
    cgroupKillPresent: true,
    dedicatedCgroupOwnershipVerified: true,
    independentSupervisorLifetimeVerified: true,
    childTreeTerminationAuthorityVerified: true,
    emergencyReaperAndTtlVerified: true,
    independentlySignedExitReceiptVerified: true,
    // Even all untrusted 'true' claims must fail closed.
    globalStopCertified: true
  }), /PA05_K0_PARENT_SIGKILL_DENIED/);
  console.log("PA05_K0_EXTERNAL_SUPERVISOR_UNTRUSTED_CLAIMS_DENIED="
    + JSON.stringify({scope:"local-test-only",denied:true,globalStopCertified:false}));
});
