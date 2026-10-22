import test from "node:test";
import assert from "node:assert/strict";
import {generateKeyPairSync, sign} from "node:crypto";
import {reconcileK0OfflineFixture} from "../fixtures/pa05-k0-synthetic-inventory-reconciliation.mjs";

// Entirely offline, synthetic, TEST-ONLY. No real PID, external supervisor,
// trusted public key, production HTTP, SQL, secrets or process signals.
const {publicKey, privateKey} = generateKeyPairSync("ed25519");
const nowIso = "2026-10-21T03:15:00.000Z";
const base = Object.freeze({
  operationId: "synthetic-maint-001",
  scopeId: "synthetic-test-cgroup-001",
  inventoryRevision: "synthetic-revision-004",
  fencingEpoch: "epoch-test-009"
});
const instances = [
  {instanceId:"worker-a",startNonce:"start-a-001",supervisorId:"test-supervisor-a",keyId:"test-pubkey"},
  {instanceId:"worker-b",startNonce:"start-b-001",supervisorId:"test-supervisor-a",keyId:"test-pubkey"}
];
function makeReceipt(item, changes = {}) {
  const body = {
    contractVersion: "PA05-K0-TEST-STOP-RECEIPT-v0",
    ...base, ...item, observedAt: nowIso,
    event:"EXTERNAL_PROCESS_EXIT_OBSERVED",cgroupPopulated:"0",...changes
  };
  const payloadBytes = Buffer.from(JSON.stringify(body));
  return {
    instanceId:item.instanceId,
    envelope:{payloadBytes,signatureBytes:sign(null,payloadBytes,privateKey),trustKey:publicKey}
  };
}
function sample() {
  return {
    freeze:{...base,completeForScope:true,admissionFrozen:true,
      instances:instances.map(x=>({...x}))},
    postFreeze:{...base,completeForScope:true,liveInstances:[]},
    receipts:instances.map(i=>makeReceipt(i)),
    knownCallerIds:["browser", "ci-runner", "maintenance-cli"],
    callerDecisions:["browser", "ci-runner", "maintenance-cli"].map(callerId=>({
      callerId,fencingEpoch:base.fencingEpoch,decision:"DENY"
    })),
    dbSessionObservation:{...base,state:"SYNTHETIC_NO_PROTECTED_SESSIONS"}
  };
}
function deny(f, code) {
  assert.throws(f, new RegExp("PA05_K0_RECONCILE_DENIED: " + code));
}
const check = (value, options={}) =>
  reconcileK0OfflineFixture(value,{nowIso,...options});

test("K0 offline reconciliation: exact two-worker fixtures remain untrusted", () => {
  const result=check(sample());
  assert.equal(result.locallyConsistentUntrustedFixture,true);
  assert.equal(result.syntheticInstanceCount,2);
  assert.equal(result.syntheticCallerCount,3);
  for(const k of ["independentInventoryCompletenessVerified",
    "externalStopAuthorityVerified","realCallerAdmissionVerified",
    "realDbSessionAbsenceVerified","humanAndDbaAuthorityVerified",
    "parentSigkillAuthorized","productionMaterialWriteEnabled",
    "globalStopCertified"]) assert.equal(result[k],false,k);
  console.log("PA05_K0_SYNTHETIC_MULTIWORKER_RECONCILIATION="
    +JSON.stringify(result));
});

test("K0 offline reconciliation: missing stop receipt is denied", () => {
  const x=sample();x.receipts.pop();
  deny(()=>check(x),"RECEIPT_COUNT_MISMATCH");
});
test("K0 offline reconciliation: duplicate, unknown and extra receipt denied", () => {
  const duplicate=sample();duplicate.receipts[1]=duplicate.receipts[0];
  deny(()=>check(duplicate),"DUPLICATE_STOP_RECEIPT");
  const extra=sample();extra.receipts.push(makeReceipt({
    instanceId:"worker-z",startNonce:"new",
    supervisorId:"test-supervisor-a",keyId:"test-pubkey"
  }));
  deny(()=>check(extra),"RECEIPT_COUNT_MISMATCH");
  const unknown=sample();
  const forgedIdentity={...instances[1],instanceId:"worker-z"};
  unknown.receipts[1]=makeReceipt(forgedIdentity);
  deny(()=>check(unknown),"UNKNOWN_STOP_RECEIPT_INSTANCE");
});
test("K0 offline reconciliation: duplicate instance and incomplete claimed inventory denied", () => {
  const duplicate=sample();duplicate.freeze.instances[1].instanceId="worker-a";
  deny(()=>check(duplicate),"DUPLICATE_INSTANCE_ID");
  const empty=sample();empty.freeze.instances=[];
  deny(()=>check(empty),"EMPTY_OR_INVALID_FROZEN_INVENTORY");
  const incomplete=sample();incomplete.freeze.completeForScope=false;
  deny(()=>check(incomplete),"UNTRUSTED_OR_INCOMPLETE_FREEZE");
  const unfrozen=sample();unfrozen.freeze.admissionFrozen=false;
  deny(()=>check(unfrozen),"UNTRUSTED_OR_INCOMPLETE_FREEZE");
});
test("K0 offline reconciliation: replacement, live child and snapshot mismatch denied", () => {
  const replacement=sample();
  replacement.postFreeze.liveInstances=[{instanceId:"worker-a",startNonce:"start-a-REPLACED"}];
  deny(()=>check(replacement),"LIVE_OR_RESTARTED_INSTANCE");
  const alive=sample();alive.postFreeze.liveInstances=[{...instances[0]}];
  deny(()=>check(alive),"LIVE_OR_RESTARTED_INSTANCE");
  const badRevision=sample();badRevision.postFreeze.inventoryRevision="another-revision";
  deny(()=>check(badRevision),"POST_FREEZE_INVENTORY_NOT_COMPARABLE");
  const badEpoch=sample();badEpoch.postFreeze.fencingEpoch="prior-epoch";
  deny(()=>check(badEpoch),"POST_FREEZE_INVENTORY_NOT_COMPARABLE");
});
test("K0 offline reconciliation: old instance nonce and stale epoch signatures denied", () => {
  const oldNonce=sample();oldNonce.receipts[0]=makeReceipt(instances[0],{startNonce:"stale-nonce"});
  deny(()=>check(oldNonce),"INVALID_SIGNED_STOP_RECEIPT");
  const oldEpoch=sample();oldEpoch.receipts[1]=makeReceipt(instances[1],{fencingEpoch:"old-epoch"});
  deny(()=>check(oldEpoch),"INVALID_SIGNED_STOP_RECEIPT");
});
test("K0 offline reconciliation: missing, duplicate, unknown and ALLOW caller denied", () => {
  const missing=sample();missing.callerDecisions.pop();
  deny(()=>check(missing),"CALLER_DENIAL_COUNT_MISMATCH");
  const duplicate=sample();duplicate.callerDecisions[2]={...duplicate.callerDecisions[0]};
  deny(()=>check(duplicate),"DUPLICATE_CALLER_CLAIM");
  const unknown=sample();unknown.callerDecisions[2].callerId="unknown-actor";
  deny(()=>check(unknown),"UNKNOWN_CALLER_CLAIM");
  const allow=sample();allow.callerDecisions[0].decision="ALLOW";
  deny(()=>check(allow),"CALLER_NOT_FENCED");
  const oldEpoch=sample();oldEpoch.callerDecisions[1].fencingEpoch="old-epoch";
  deny(()=>check(oldEpoch),"CALLER_NOT_FENCED");
});
test("K0 offline reconciliation: unknown caller scope or sessions denies", () => {
  const noCallers=sample();noCallers.knownCallerIds=[];
  noCallers.callerDecisions=[];
  deny(()=>check(noCallers),"INCOMPLETE_KNOWN_CALLERS");
  const duplicate=sample();duplicate.knownCallerIds[2]="browser";
  deny(()=>check(duplicate),"INCOMPLETE_KNOWN_CALLERS");
  const dbUnknown=sample();dbUnknown.dbSessionObservation.state="UNVERIFIED";
  deny(()=>check(dbUnknown),"DB_SESSION_NOT_CONFIRMED_IN_FIXTURE");
  const dbLive=sample();dbLive.dbSessionObservation.state="PROTECTED_SESSIONS_PRESENT";
  deny(()=>check(dbLive),"DB_SESSION_NOT_CONFIRMED_IN_FIXTURE");
  const dbWrongEpoch=sample();dbWrongEpoch.dbSessionObservation.fencingEpoch="old-epoch";
  deny(()=>check(dbWrongEpoch),"DB_SESSION_NOT_CONFIRMED_IN_FIXTURE");
});
test("K0 offline reconciliation: invalid attestor test key denied", () => {
  const wrong=sample();const bad=generateKeyPairSync("ed25519");
  wrong.receipts[0].envelope.trustKey=bad.publicKey;
  deny(()=>check(wrong),"INVALID_SIGNED_STOP_RECEIPT");
});
test("K0 offline reconciliation: local replay cache commits atomically after all checks", () => {
  const seen=new Set();
  const bad=sample();bad.callerDecisions[0].decision="ALLOW";
  deny(()=>check(bad,{usedDigests:seen}),"CALLER_NOT_FENCED");
  assert.equal(seen.size,0,"failed synthetic reconciliation must not consume receipts");
  const good=sample();check(good,{usedDigests:seen});
  assert.equal(seen.size,2);
  deny(()=>check(sample(),{usedDigests:seen}),"INVALID_SIGNED_STOP_RECEIPT");
  console.log("PA05_K0_SYNTHETIC_MULTIWORKER_REPLAY="
    +JSON.stringify({transactionalTestCache:true,localReplayDenied:true,globalStopCertified:false}));
});
