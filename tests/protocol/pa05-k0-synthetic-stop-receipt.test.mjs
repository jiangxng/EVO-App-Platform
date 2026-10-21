import test from "node:test";
import assert from "node:assert/strict";
import {generateKeyPairSync, sign} from "node:crypto";
import {checkK0SyntheticStopReceipt} from "../fixtures/pa05-k0-supervisor-receipt-proof.mjs";

// All keys are freshly generated in CI. NOT a real supervisor identity,
// production credential, system attestor, or authorization gate.
const signer = generateKeyPairSync("ed25519");
const outsider = generateKeyPairSync("ed25519");
const nowIso = "2026-10-21T02:55:00.000Z";
const expected = Object.freeze({
  operationId: "test-only-operation-001",
  scopeId: "test-only-cgroup-run-001",
  inventoryRevision: "snapshot-test-001",
  fencingEpoch: "epoch-test-003",
  instanceId: "test-only-worker-001",
  startNonce: "test-only-nonce-001",
  supervisorId: "non-production-test-supervisor",
  keyId: "ephemeral-test-key"
});
function payload(overrides = {}) {
  return {
    contractVersion: "PA05-K0-TEST-STOP-RECEIPT-v0",
    operationId: expected.operationId,
    scopeId: expected.scopeId,
    inventoryRevision: expected.inventoryRevision,
    fencingEpoch: expected.fencingEpoch,
    instanceId: expected.instanceId,
    startNonce: expected.startNonce,
    supervisorId: expected.supervisorId,
    observedAt: nowIso,
    event: "EXTERNAL_PROCESS_EXIT_OBSERVED",
    cgroupPopulated: "0",
    keyId: expected.keyId,
    ...overrides
  };
}
function envelope(body, {key = signer.privateKey, bytes} = {}) {
  const payloadBytes = bytes ?? Buffer.from(JSON.stringify(body), "utf8");
  return {
    payloadBytes, signatureBytes: sign(null, payloadBytes, key),
    trustKey: signer.publicKey
  };
}
function check(env, scope = expected, options = {}) {
  return checkK0SyntheticStopReceipt(env, scope, {nowIso, ...options});
}
function rejectsCode(fn, code) {
  assert.throws(fn, new RegExp("PA05_K0_RECEIPT_DENIED: " + code));
}

test("K0 synthetic evidence: signed matching offline receipt cannot authorize SIGKILL", () => {
  const receipt = check(envelope(payload()));
  assert.equal(receipt.signatureMatchesSuppliedTestKey, true);
  assert.equal(receipt.payloadBoundToExpectedInstance, true);
  assert.equal(receipt.independentSupervisorIdentityVerified, false);
  assert.equal(receipt.completeInventoryVerified, false);
  assert.equal(receipt.mayRunParentSigkill, false);
  assert.equal(receipt.globalStopCertified, false);
  assert.equal(receipt.productionMaterialWriteEnabled, false);
  console.log("PA05_K0_SYNTHETIC_RECEIPT_CRYPTO_BOUND=" + JSON.stringify(receipt));
});

test("K0 synthetic evidence: reject forged key, mutated bytes and no pinned key", () => {
  rejectsCode(() => check(envelope(payload(), {key: outsider.privateKey})), "BAD_SIGNATURE");
  const signed = envelope(payload());
  signed.payloadBytes = Buffer.from(JSON.stringify(payload({instanceId: "attacker-worker"})));
  rejectsCode(() => check(signed), "SCOPE_MISMATCH_instanceId");
  const noKey = envelope(payload());
  noKey.trustKey = undefined;
  rejectsCode(() => check(noKey), "NO_PINNED_TEST_KEY");
});

test("K0 synthetic evidence: deny stale, future and altered operation or epoch", () => {
  rejectsCode(() => check(envelope(payload({observedAt: "2026-10-21T02:50:00.000Z"}))), "STALE_OR_FUTURE_OBSERVATION");
  rejectsCode(() => check(envelope(payload({observedAt: "2026-10-21T02:55:01.000Z"}))), "STALE_OR_FUTURE_OBSERVATION");
  for (const field of ["operationId", "scopeId", "inventoryRevision", "fencingEpoch", "instanceId", "startNonce", "supervisorId", "keyId"]) {
    rejectsCode(() => check(envelope(payload({[field]: "different"}))), "SCOPE_MISMATCH_" + field);
  }
});

test("K0 synthetic evidence: deny incomplete stop, unknown fields or data injection", () => {
  rejectsCode(() => check(envelope(payload({cgroupPopulated: "1"}))), "NOT_EMPTY_CGROUP");
  rejectsCode(() => check(envelope(payload({event: "HEARTBEAT_MISSING"}))), "WRONG_EVENT");
  rejectsCode(() => check(envelope(payload({stopAuthorityVerified: true}))), "SCHEMA_OR_EXTRA_FIELD");
  rejectsCode(() => check(envelope(payload({productionSecret: "should-never-be-in-receipt"}))), "SCHEMA_OR_EXTRA_FIELD");
  const p = payload(); delete p.startNonce;
  rejectsCode(() => check(envelope(p)), "SCHEMA_OR_EXTRA_FIELD");
});

test("K0 synthetic evidence: deny duplicate JSON keys, noncanonical bytes and bad encoding", () => {
  let raw = JSON.stringify(payload()).replace('"instanceId":"test-only-worker-001",',
    '"instanceId":"test-only-worker-001","instanceId":"test-only-worker-001",');
  rejectsCode(() => check(envelope(payload(), {bytes: Buffer.from(raw)})), "NON_CANONICAL_JSON");
  rejectsCode(() => check(envelope(payload(), {bytes: Buffer.from(JSON.stringify(payload())+"  ")})), "NON_CANONICAL_JSON");
  const invalid = envelope(payload());
  invalid.signatureBytes = Buffer.alloc(12);
  rejectsCode(() => check(invalid), "INVALID_ED25519_SIGNATURE_BYTES");
});

test("K0 synthetic evidence: local replay cache denies second use (not a distributed guarantee)", () => {
  const receipts = new Set();
  const receipt = envelope(payload());
  const first = check(receipt, expected, {usedDigests: receipts});
  assert.equal(first.testOnlyReplayCacheChecked, true);
  rejectsCode(() => check(receipt, expected, {usedDigests: receipts}), "LOCAL_REPLAY");
  console.log("PA05_K0_SYNTHETIC_RECEIPT_REPLAY_DENIED="
    + JSON.stringify({scope:"offline-fixture",replayDenied:true,globalStopCertified:false}));
});
