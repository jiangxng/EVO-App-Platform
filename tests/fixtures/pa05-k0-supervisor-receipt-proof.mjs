// K0 TEST-ONLY cryptographic evidence envelope parser.
//
// It verifies an exact, bounded, non-secret Ed25519-signed *test fixture*
// against an explicitly supplied expected instance and operation. This is
// neither an approval/authorization decision nor a production trust store.
// No child is forked, no signal sent and no cgroup or DB is modified.
// Even a valid synthetic signature can NEVER unlock parent SIGKILL or WRITE.
import {createHash, verify as verifyEd25519} from "node:crypto";

const KEYS = [
  "contractVersion", "operationId", "scopeId", "inventoryRevision",
  "fencingEpoch", "instanceId", "startNonce", "supervisorId",
  "observedAt", "event", "cgroupPopulated", "keyId"
].sort();
const EXPECTED_KEYS = [
  "operationId", "scopeId", "inventoryRevision", "fencingEpoch",
  "instanceId", "startNonce", "supervisorId", "keyId"
];
const MAX_PAYLOAD_BYTES = 4096;
const MAX_AGE_MS = 120_000;

function deny(reason) {
  throw new Error("PA05_K0_RECEIPT_DENIED: " + reason);
}
function exactFields(object, keys) {
  if (!object || typeof object !== "object" || Array.isArray(object)) return false;
  const got = Object.keys(object).sort();
  return got.length === keys.length && got.every((k, i) => k === keys[i]);
}
function nonEmpty(value) {
  return typeof value === "string"
    && value.length > 0 && value.length <= 256
    && !/[\r\n\u0000-\u001f]/.test(value);
}
export function checkK0SyntheticStopReceipt(
  {payloadBytes, signatureBytes, trustKey},
  expected,
  {nowIso = new Date().toISOString(), usedDigests = new Set()} = {}
) {
  if (!Buffer.isBuffer(payloadBytes) || payloadBytes.length < 2
    || payloadBytes.length > MAX_PAYLOAD_BYTES) deny("INVALID_PAYLOAD_BYTES");
  if (!Buffer.isBuffer(signatureBytes) || signatureBytes.length !== 64)
    deny("INVALID_ED25519_SIGNATURE_BYTES");
  if (!trustKey) deny("NO_PINNED_TEST_KEY");
  if (!expected || typeof expected !== "object") deny("NO_EXPECTED_SCOPE");
  for (const key of EXPECTED_KEYS) if (!nonEmpty(expected[key])) deny("MISSING_EXPECTED_" + key);
  let body;
  try {
    body = JSON.parse(payloadBytes.toString("utf8"));
  } catch {
    deny("INVALID_JSON");
  }
  if (!exactFields(body, KEYS)) deny("SCHEMA_OR_EXTRA_FIELD");
  // For this test-only contract, accept just compact JSON.stringify output.
  // Reject duplicate JSON object keys, noncanonical timestamps/number encodings
  // and any suspicious alternate representation before signing/verifying.
  if (JSON.stringify(body) !== payloadBytes.toString("utf8"))
    deny("NON_CANONICAL_JSON");
  if (body.contractVersion !== "PA05-K0-TEST-STOP-RECEIPT-v0")
    deny("WRONG_VERSION");
  for (const key of EXPECTED_KEYS) {
    if (!nonEmpty(body[key]) || body[key] !== expected[key])
      deny("SCOPE_MISMATCH_" + key);
  }
  if (body.event !== "EXTERNAL_PROCESS_EXIT_OBSERVED") deny("WRONG_EVENT");
  if (body.cgroupPopulated !== "0") deny("NOT_EMPTY_CGROUP");
  const observed = Date.parse(body.observedAt);
  const now = Date.parse(nowIso);
  if (!nonEmpty(body.observedAt) || !Number.isFinite(observed)
    || new Date(observed).toISOString() !== body.observedAt
    || !Number.isFinite(now) || observed > now
    || now - observed > MAX_AGE_MS) deny("STALE_OR_FUTURE_OBSERVATION");
  // A provided test public key is NOT independent proof of who operated
  // the supervisor: only cryptographic authenticity relative to that key.
  let valid = false;
  try { valid = verifyEd25519(null, payloadBytes, trustKey, signatureBytes); }
  catch { deny("INVALID_VERIFICATION_KEY"); }
  if (!valid) deny("BAD_SIGNATURE");
  const digest = createHash("sha256").update(payloadBytes).digest("hex");
  if (usedDigests.has(digest)) deny("LOCAL_REPLAY");
  // The caller may provide a local cache to reject duplicate receipts.
  // This is not a durable distributed replay service.
  usedDigests.add(digest);
  return Object.freeze({
    scope: "offline-synthetic-fixture-only",
    payloadBoundToExpectedInstance: true,
    signatureMatchesSuppliedTestKey: true,
    testOnlyReplayCacheChecked: true,
    independentSupervisorIdentityVerified: false,
    completeInventoryVerified: false,
    stopAuthorityVerified: false,
    databaseSessionsVerified: false,
    productionIdentityVerified: false,
    mayRunParentSigkill: false,
    productionMaterialWriteEnabled: false,
    globalStopCertified: false
  });
}
