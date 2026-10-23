// PA05 K0 — OFFLINE TEST FIXTURE, NOT A RUNTIME STOP AUTHORITY.
//
// Reconciles *untrusted synthetic* freeze inventory, signed fixture receipts,
// post-freeze observations, caller-denial fixtures and DB session fixtures.
// A matching fixture can only be labelled "locally consistent"; it can never
// authorize SIGKILL, clearing a lock, maintenance or material WRITE.
//
// This module does NOT fork/kill processes, use OS or network, read production
// secrets, access a database or trust a caller-supplied "complete" flag.
import {checkK0SyntheticStopReceipt} from "./pa05-k0-supervisor-receipt-proof.mjs";

function deny(reason) {
  throw new Error("PA05_K0_RECONCILE_DENIED: " + reason);
}
const nonempty = x => typeof x === "string" && x.length > 0 && x.length <= 256
  && !/[\r\n\u0000-\u001f]/.test(x);
const fields = (v, names) => v && typeof v === "object" && !Array.isArray(v)
  && Object.keys(v).length === names.length
  && names.every(k => Object.hasOwn(v, k));
const validArray = v => Array.isArray(v) && v.length <= 32;
const baseNames = ["operationId", "scopeId", "inventoryRevision", "fencingEpoch"];
const instanceNames = ["instanceId", "startNonce", "supervisorId", "keyId"];
const freezeNames = [...baseNames, "completeForScope", "admissionFrozen", "instances"];
const currentNames = [...baseNames, "completeForScope", "liveInstances"];
const callerNames = ["callerId", "fencingEpoch", "decision"];
const sessionNames = [...baseNames, "state"];

/** Strict *synthetic* consistency check, with irreversible production DENY. */
export function reconcileK0OfflineFixture(bundle, {
  nowIso = "2026-10-21T03:15:00.000Z",
  usedDigests = new Set()
} = {}) {
  if (!fields(bundle, ["freeze", "postFreeze", "receipts", "knownCallerIds",
    "callerDecisions", "dbSessionObservation"])) deny("MISSING_OR_EXTRA_BUNDLE_FIELD");
  const {freeze, postFreeze, receipts, knownCallerIds, callerDecisions,
    dbSessionObservation} = bundle;
  if (!fields(freeze, freezeNames)) deny("INVALID_FREEZE_SCHEMA");
  for (const key of baseNames) if (!nonempty(freeze[key])) deny("INVALID_SCOPE_" + key);
  if (freeze.completeForScope !== true || freeze.admissionFrozen !== true)
    deny("UNTRUSTED_OR_INCOMPLETE_FREEZE");
  if (!validArray(freeze.instances) || freeze.instances.length === 0)
    deny("EMPTY_OR_INVALID_FROZEN_INVENTORY");
  const byId = new Map();
  for (const item of freeze.instances) {
    if (!fields(item, instanceNames)
      || instanceNames.some(k => !nonempty(item[k]))) deny("INVALID_INSTANCE");
    if (byId.has(item.instanceId)) deny("DUPLICATE_INSTANCE_ID");
    byId.set(item.instanceId, item);
  }
  if (!fields(postFreeze, currentNames)
    || postFreeze.completeForScope !== true
    || baseNames.some(k => postFreeze[k] !== freeze[k]))
    deny("POST_FREEZE_INVENTORY_NOT_COMPARABLE");
  if (!validArray(postFreeze.liveInstances)) deny("POST_FREEZE_INVENTORY_MISSING");
  // A process restart (even if it reused the same logical instance ID)
  // invalidates the synthetic claim of a fully terminated frozen set.
  if (postFreeze.liveInstances.length !== 0) deny("LIVE_OR_RESTARTED_INSTANCE");

  if (!validArray(receipts) || receipts.length !== byId.size)
    deny("RECEIPT_COUNT_MISMATCH");
  if (!(usedDigests instanceof Set)) deny("INVALID_REPLAY_CACHE");
  const stagedDigests = new Set(usedDigests); // no mutation on partial failure
  const seen = new Set();
  for (const entry of receipts) {
    if (!fields(entry, ["instanceId", "envelope"])
      || !nonempty(entry.instanceId)) deny("BAD_RECEIPT_ENTRY");
    if (seen.has(entry.instanceId)) deny("DUPLICATE_STOP_RECEIPT");
    seen.add(entry.instanceId);
    const item = byId.get(entry.instanceId);
    if (!item) deny("UNKNOWN_STOP_RECEIPT_INSTANCE");
    const expected = Object.fromEntries([
      ...baseNames.map(k => [k, freeze[k]]),
      ...instanceNames.map(k => [k, item[k]])
    ]);
    try {
      checkK0SyntheticStopReceipt(entry.envelope, expected,
        {nowIso, usedDigests: stagedDigests});
    } catch (e) {
      // Preserve a stable failure class without echoing any signed payload.
      deny("INVALID_SIGNED_STOP_RECEIPT");
    }
  }
  if (seen.size !== byId.size) deny("MISSING_STOP_RECEIPT");

  if (!validArray(knownCallerIds) || knownCallerIds.length === 0
    || knownCallerIds.some(x => !nonempty(x))
    || new Set(knownCallerIds).size !== knownCallerIds.length)
    deny("INCOMPLETE_KNOWN_CALLERS");
  if (!validArray(callerDecisions) || callerDecisions.length !== knownCallerIds.length)
    deny("CALLER_DENIAL_COUNT_MISMATCH");
  const known = new Set(knownCallerIds), denied = new Set();
  for (const claim of callerDecisions) {
    if (!fields(claim, callerNames) || !nonempty(claim.callerId))
      deny("INVALID_CALLER_CLAIM");
    if (!known.has(claim.callerId)) deny("UNKNOWN_CALLER_CLAIM");
    if (denied.has(claim.callerId)) deny("DUPLICATE_CALLER_CLAIM");
    if (claim.fencingEpoch !== freeze.fencingEpoch || claim.decision !== "DENY")
      deny("CALLER_NOT_FENCED");
    denied.add(claim.callerId);
  }
  if (denied.size !== known.size) deny("MISSING_CALLER_DENIAL");

  if (!fields(dbSessionObservation, sessionNames)
    || baseNames.some(k => dbSessionObservation[k] !== freeze[k])
    || dbSessionObservation.state !== "SYNTHETIC_NO_PROTECTED_SESSIONS")
    deny("DB_SESSION_NOT_CONFIRMED_IN_FIXTURE");

  // Commit the local replay cache only after *all* fixture consistency checks.
  for (const digest of stagedDigests) usedDigests.add(digest);
  return Object.freeze({
    scope: "offline-synthetic-reconciliation-only",
    locallyConsistentUntrustedFixture: true,
    syntheticInstanceCount: byId.size,
    syntheticCallerCount: known.size,
    testSignaturesMatched: true,
    independentInventoryCompletenessVerified: false,
    externalStopAuthorityVerified: false,
    realCallerAdmissionVerified: false,
    realDbSessionAbsenceVerified: false,
    humanAndDbaAuthorityVerified: false,
    parentSigkillAuthorized: false,
    productionMaterialWriteEnabled: false,
    globalStopCertified: false
  });
}
