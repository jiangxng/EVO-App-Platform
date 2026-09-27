import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryContextMemoryStoreV010
} from "../../dist/manager/context-memory-store.js";
import {
  createMemoryContextMemoryGovernanceStoreV010
} from "../../dist/manager/context-memory-governance-store.js";
import {
  createMemoryContextMemoryRetentionPolicyStoreV010
} from "../../dist/manager/context-memory-retention-policy-store.js";
import {
  createMemoryContextMemoryLegalHoldStoreV010
} from "../../dist/manager/context-memory-legal-hold-store.js";
import {
  createContextMemoryScheduledOperationsV010,
  createMemoryContextMemoryOperationLogV010
} from "../../dist/manager/context-memory-operations.js";
import {
  createHostContextMemoryGovernanceProviderV010
} from "../../dist/providers/context-memory/governance.js";
import {
  createHostContextMemoryReaderV010
} from "../../dist/providers/context-memory/runtime.js";

const personal = {
  contractVersion: "0.1.0",
  kind: "PERSONAL",
  contextId: "personal:alice"
};

function item(memoryId, summary, recordedAt = "2026-01-01T00:00:00.000Z") {
  return {
    contractVersion: "0.1.0",
    memoryId,
    context: personal,
    kind: "FACT",
    summary,
    provenance: {
      contractVersion: "0.1.0",
      origin: "DIRECT",
      sourceContext: personal,
      evidenceRefs: []
    },
    attribution: {
      contractVersion: "0.1.0",
      recordedBySubjectId: "alice",
      recordedByActorType: "HUMAN",
      recordedAt
    }
  };
}

test("retention policy is append-only and scheduled evaluation emits governance expiry", () => {
  const memoryStore = createMemoryContextMemoryStoreV010({
    contractVersion: "0.1.0",
    items: [item("memory:old", "Old operational note")]
  });
  const governanceStore = createMemoryContextMemoryGovernanceStoreV010();
  const retentionPolicies = createMemoryContextMemoryRetentionPolicyStoreV010();
  const legalHolds = createMemoryContextMemoryLegalHoldStoreV010();
  const operationLog = createMemoryContextMemoryOperationLogV010();

  retentionPolicies.append({
    contractVersion: "0.1.0",
    eventId: "rp:1",
    policyId: "policy:standard-30d",
    context: personal,
    state: "ACTIVE",
    retainForDays: 30,
    privacyClasses: ["STANDARD"],
    occurredAt: "2026-09-27T00:00:00.000Z",
    actorSubjectId: "alice"
  });

  let n = 0;
  const operations = createContextMemoryScheduledOperationsV010({
    memoryStore,
    governanceStore,
    retentionPolicies,
    legalHolds,
    operationLog,
    now: () => new Date("2026-09-27T05:00:00.000Z"),
    id: () => String(++n)
  });

  const result = operations.runRetention(personal);
  assert.equal(result.state, "SUCCEEDED");
  assert.equal(result.examined, 1);
  assert.equal(result.changed, 1);
  assert.equal(governanceStore.snapshot().events.length, 1);
  assert.equal(governanceStore.decision("memory:old", new Date("2026-09-27T05:00:00.000Z")).state, "EXPIRED");
  assert.equal(operationLog.list().length, 1);
  assert.equal(memoryStore.snapshot().items.length, 1);
});

test("legal hold blocks scheduled retention and read-time retainUntil expiry", async () => {
  const memoryStore = createMemoryContextMemoryStoreV010({
    contractVersion: "0.1.0",
    items: [item("memory:held", "Held evidence")]
  });
  const governanceStore = createMemoryContextMemoryGovernanceStoreV010({
    contractVersion: "0.1.0",
    events: [{
      contractVersion: "0.1.0",
      eventId: "g:ttl",
      memoryId: "memory:held",
      context: personal,
      state: "ACTIVE",
      privacyClass: "STANDARD",
      retainUntil: "2026-02-01T00:00:00.000Z",
      occurredAt: "2026-01-01T00:00:00.000Z",
      actorSubjectId: "alice"
    }]
  });
  const retentionPolicies = createMemoryContextMemoryRetentionPolicyStoreV010({
    contractVersion: "0.1.0",
    events: [{
      contractVersion: "0.1.0",
      eventId: "rp:held",
      policyId: "policy:held",
      context: personal,
      state: "ACTIVE",
      retainForDays: 1,
      occurredAt: "2026-01-01T00:00:00.000Z",
      actorSubjectId: "alice"
    }]
  });
  const legalHolds = createMemoryContextMemoryLegalHoldStoreV010({
    contractVersion: "0.1.0",
    events: [{
      contractVersion: "0.1.0",
      eventId: "hold:1",
      holdId: "legal-case:42",
      memoryId: "memory:held",
      context: personal,
      state: "PLACED",
      reason: "Litigation preservation",
      occurredAt: "2026-01-15T00:00:00.000Z",
      actorSubjectId: "alice"
    }]
  });
  const operationLog = createMemoryContextMemoryOperationLogV010();
  const operations = createContextMemoryScheduledOperationsV010({
    memoryStore,
    governanceStore,
    retentionPolicies,
    legalHolds,
    operationLog,
    now: () => new Date("2026-09-27T05:00:00.000Z"),
    id: () => "held-run"
  });

  const run = operations.runRetention(personal);
  assert.equal(run.changed, 0);
  assert.equal(run.skipped, 1);

  const governance = createHostContextMemoryGovernanceProviderV010(
    governanceStore,
    () => new Date("2026-09-27T05:00:00.000Z"),
    legalHolds
  );
  assert.equal(governance.get("memory:held").state, "ACTIVE");

  const reader = createHostContextMemoryReaderV010(memoryStore, { governance });
  const result = await reader.read({
    contractVersion: "0.1.0",
    context: personal,
    limit: 10
  });
  assert.deepEqual(result.items.map(value => value.memoryId), ["memory:held"]);

  legalHolds.append({
    contractVersion: "0.1.0",
    eventId: "hold:2",
    holdId: "legal-case:42",
    memoryId: "memory:held",
    context: personal,
    state: "RELEASED",
    reason: "Matter closed",
    occurredAt: "2026-09-27T06:00:00.000Z",
    actorSubjectId: "alice"
  });
  const afterRelease = createHostContextMemoryGovernanceProviderV010(
    governanceStore,
    () => new Date("2026-09-27T07:00:00.000Z"),
    legalHolds
  );
  assert.equal(afterRelease.get("memory:held").state, "EXPIRED");
});

test("DLP operation fails closed without Provider and writes no governance mutation", async () => {
  const memoryStore = createMemoryContextMemoryStoreV010({
    contractVersion: "0.1.0",
    items: [item("memory:one", "Customer account secret")]
  });
  const governanceStore = createMemoryContextMemoryGovernanceStoreV010();
  const operationLog = createMemoryContextMemoryOperationLogV010();
  const operations = createContextMemoryScheduledOperationsV010({
    memoryStore,
    governanceStore,
    retentionPolicies: createMemoryContextMemoryRetentionPolicyStoreV010(),
    legalHolds: createMemoryContextMemoryLegalHoldStoreV010(),
    operationLog,
    now: () => new Date("2026-09-27T05:00:00.000Z"),
    id: () => "dlp-no-provider"
  });

  const result = await operations.runDlp(personal);
  assert.equal(result.state, "FAILED");
  assert.equal(result.failureCode, "CONTEXT_MEMORY_DLP_PROVIDER_REQUIRED");
  assert.equal(governanceStore.snapshot().events.length, 0);
});

test("DLP Provider classification becomes append-only governance overlay", async () => {
  const memoryStore = createMemoryContextMemoryStoreV010({
    contractVersion: "0.1.0",
    items: [item("memory:secret", "Bank account 1234")]
  });
  const governanceStore = createMemoryContextMemoryGovernanceStoreV010();
  const operationLog = createMemoryContextMemoryOperationLogV010();
  let n = 0;
  const operations = createContextMemoryScheduledOperationsV010({
    memoryStore,
    governanceStore,
    retentionPolicies: createMemoryContextMemoryRetentionPolicyStoreV010(),
    legalHolds: createMemoryContextMemoryLegalHoldStoreV010(),
    operationLog,
    dlpClassifier: {
      providerId: "test.dlp",
      classify(input) {
        assert.equal(input.memoryId, "memory:secret");
        return {
          contractVersion: "0.1.0",
          privacyClass: "RESTRICTED",
          labels: ["FINANCIAL_IDENTIFIER"],
          confidence: 0.99,
          reasonCodes: ["FINANCIAL_IDENTIFIER"]
        };
      }
    },
    now: () => new Date("2026-09-27T05:00:00.000Z"),
    id: () => String(++n)
  });

  const result = await operations.runDlp(personal);
  assert.equal(result.state, "SUCCEEDED");
  assert.equal(result.changed, 1);
  assert.equal(memoryStore.snapshot().items.length, 1);
  assert.equal(governanceStore.snapshot().events.length, 1);
  assert.equal(
    governanceStore.decision("memory:secret", new Date("2026-09-27T05:00:00.000Z")).privacyClass,
    "RESTRICTED"
  );
});
