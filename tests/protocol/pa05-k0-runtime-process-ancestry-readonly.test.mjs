import test from "node:test";
import assert from "node:assert/strict";
import {observeK0LinuxRuntimeAncestryReadOnly}
  from "../fixtures/pa05-k0-runtime-process-ancestry-readonly.mjs";

test("K0 R5-02: read-only /proc PID1 ancestry without claims of signal authority", {
  skip:process.platform !== "linux" && "Linux procfs required"
}, () => {
  const r=observeK0LinuxRuntimeAncestryReadOnly();
  assert.equal(r.scope,"single-linux-procfs-namespace-readonly");
  assert.equal(r.requestedPid,process.pid);
  assert.equal(r.chain[0].pid,process.pid);
  assert.ok(r.chain[0].startTicks);
  assert.ok(["node","npm","shell","init","other-or-unknown"]
    .includes(r.chain[0].executableClass));
  assert.ok(r.chain.length<=16);
  assert.ok(r.pid1Identity?.startTicks);
  for(const row of r.chain) {
    assert.equal(typeof row.ppid,"number");
    assert.ok(/^\d+$/.test(row.startTicks));
    assert.ok(!Object.hasOwn(row,"cmdline"));
    assert.ok(!Object.hasOwn(row,"environment"));
  }
  for(const key of ["runtimeSigtermDelivered",
    "effectiveRailwayDrainingVerified","independentSupervisorVerified",
    "productionOperatorAttestationPresent","permittedToAuthorizeStop",
    "globalStopCertified","secretDataRead","signalSent"])
    assert.equal(r[key],false,key);
  console.log("PA05_K0_R5_PID1_READONLY_OBSERVATION="+JSON.stringify({
    scope:r.scope,
    chainLength:r.chain.length,
    pid1Identified:Boolean(r.pid1Identity),
    selfStartIdentityVerified:true,
    runtimeSigtermDelivered:false,
    effectiveRailwayDrainingVerified:false,
    productionOperatorAttestationPresent:false,
    globalStopCertified:false,
    secretDataRead:false,
    signalSent:false
  }));
});

test("K0 R5-02: invalid PID/too-deep probes are rejected", {
  skip:process.platform !== "linux" && "Linux procfs required"
}, () => {
  for(const pid of [0,-1,1.5,Number.MAX_SAFE_INTEGER+1]){
    assert.throws(()=>observeK0LinuxRuntimeAncestryReadOnly({pid}),
      /PA05_K0_INVALID_PROBE_ARGS/);
  }
  for(const maxDepth of [0,-1,33,1.5]){
    assert.throws(()=>observeK0LinuxRuntimeAncestryReadOnly({maxDepth}),
      /PA05_K0_INVALID_PROBE_ARGS/);
  }
  console.log("PA05_K0_R5_PROBE_INVALID_ARGS_DENIED="
    +JSON.stringify({scope:"non-production-runner",denied:true,
      globalStopCertified:false}));
});
