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
  createContextMemorySchedulerV010,
  createMemoryContextMemorySchedulerLeaseV010,
  parseContextMemoryScheduleContextsV010
} from "../../dist/manager/context-memory-scheduler.js";
import {
  createRemoteContextMemoryDlpClassifierV010
} from "../../dist/providers/context-memory-dlp/runtime.js";
import {
  createMemoryGovernancePageV010,
  createMemorySearchPageV010
} from "../../dist/manager/memory-governance-page.js";
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


test("remote DLP Provider uses bearer credential and validates classification response", async () => {
  let request;
  const classifier = createRemoteContextMemoryDlpClassifierV010({
    endpoint: "https://dlp.example.test/classify",
    bearerToken: "dlp-token",
    fetchImpl: async (url, init) => {
      request = { url, init };
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            contractVersion: "0.1.0",
            privacyClass: "SENSITIVE",
            labels: ["PERSONAL_DATA"],
            confidence: 0.94,
            reasonCodes: ["PERSONAL_DATA"]
          };
        }
      };
    }
  });
  const result = await classifier.classify({
    contractVersion: "0.1.0",
    context: personal,
    memoryId: "memory:remote-dlp",
    kind: "FACT",
    summary: "Customer contact information"
  });
  assert.equal(request.url, "https://dlp.example.test/classify");
  assert.equal(request.init.headers.authorization, "Bearer dlp-token");
  assert.equal(result.privacyClass, "SENSITIVE");
  assert.deepEqual(result.labels, ["PERSONAL_DATA"]);
});

test("scheduler lease prevents overlapping execution and intake contexts are explicit", async () => {
  const operationLog = createMemoryContextMemoryOperationLogV010();
  const lease = createMemoryContextMemorySchedulerLeaseV010();
  let retentionRuns = 0;
  let dlpRuns = 0;
  let intakeRuns = 0;
  let releaseFirst;
  const blocker = new Promise(resolve => { releaseFirst = resolve; });

  const scheduler = createContextMemorySchedulerV010({
    operationLog,
    lease,
    operations: {
      runRetention(context) {
        retentionRuns++;
        return {
          contractVersion: "0.1.0",
          operationId: "retention:" + retentionRuns,
          kind: "RETENTION_EVALUATION",
          context,
          state: "SUCCEEDED",
          startedAt: "2026-09-27T00:00:00.000Z",
          completedAt: "2026-09-27T00:00:01.000Z",
          examined: 1,
          changed: 0,
          skipped: 1
        };
      },
      async runDlp(context) {
        dlpRuns++;
        if (dlpRuns === 1) await blocker;
        return {
          contractVersion: "0.1.0",
          operationId: "dlp:" + dlpRuns,
          kind: "DLP_RECLASSIFICATION",
          context,
          state: "SUCCEEDED",
          startedAt: "2026-09-27T00:00:00.000Z",
          completedAt: "2026-09-27T00:00:01.000Z",
          examined: 1,
          changed: 0,
          skipped: 1
        };
      }
    },
    listGovernanceContexts() {
      return [personal, personal];
    },
    listIntakeContexts() {
      return parseContextMemoryScheduleContextsV010(JSON.stringify([personal]));
    },
    async runSourceIntake() {
      intakeRuns++;
      return { examined: 1, changed: 1, skipped: 0 };
    },
    now: () => new Date("2026-09-27T05:00:00.000Z"),
    id: () => "scheduled-intake"
  });

  const first = scheduler.tick();
  await new Promise(resolve => setImmediate(resolve));
  const overlapping = await scheduler.tick();
  assert.equal(overlapping.acquired, false);
  releaseFirst();
  const completed = await first;
  assert.equal(completed.acquired, true);
  assert.equal(completed.governanceRuns, 1);
  assert.equal(completed.intakeRuns, 1);
  assert.equal(retentionRuns, 1);
  assert.equal(dlpRuns, 1);
  assert.equal(intakeRuns, 1);
  assert.equal(operationLog.list().filter(event => event.kind === "SOURCE_INTAKE").length, 1);
});

test("schedule context parser rejects implicit or malformed Context expansion", () => {
  assert.deepEqual(parseContextMemoryScheduleContextsV010(undefined), []);
  assert.throws(
    () => parseContextMemoryScheduleContextsV010(JSON.stringify([{ kind: "PERSONAL" }])),
    /CONTEXT_MEMORY_SCHEDULE_CONTEXT_INVALID/
  );
});


test("releasing one Legal Hold does not release another active hold", () => {
  const holds = createMemoryContextMemoryLegalHoldStoreV010({
    contractVersion: "0.1.0",
    events: [
      {
        contractVersion: "0.1.0",
        eventId: "hold:a:placed",
        holdId: "case:a",
        memoryId: "memory:held",
        context: personal,
        state: "PLACED",
        reason: "Case A",
        occurredAt: "2026-09-01T00:00:00.000Z",
        actorSubjectId: "alice"
      },
      {
        contractVersion: "0.1.0",
        eventId: "hold:b:placed",
        holdId: "case:b",
        memoryId: "memory:held",
        context: personal,
        state: "PLACED",
        reason: "Case B",
        occurredAt: "2026-09-02T00:00:00.000Z",
        actorSubjectId: "alice"
      },
      {
        contractVersion: "0.1.0",
        eventId: "hold:b:released",
        holdId: "case:b",
        memoryId: "memory:held",
        context: personal,
        state: "RELEASED",
        reason: "Case B closed",
        occurredAt: "2026-09-03T00:00:00.000Z",
        actorSubjectId: "alice"
      }
    ]
  });
  const decision = holds.decision("memory:held");
  assert.equal(decision.held, true);
  assert.equal(decision.holdId, "case:a");
});

test("DLP never overrides explicit human privacy governance", async () => {
  const memoryStore = createMemoryContextMemoryStoreV010({
    contractVersion: "0.1.0",
    items: [item("memory:manual", "Human classified knowledge")]
  });
  const governanceStore = createMemoryContextMemoryGovernanceStoreV010({
    contractVersion: "0.1.0",
    events: [{
      contractVersion: "0.1.0",
      eventId: "human:classification",
      memoryId: "memory:manual",
      context: personal,
      state: "ACTIVE",
      privacyClass: "SENSITIVE",
      origin: "HUMAN",
      occurredAt: "2026-09-27T01:00:00.000Z",
      actorSubjectId: "alice"
    }]
  });
  let calls = 0;
  const operations = createContextMemoryScheduledOperationsV010({
    memoryStore,
    governanceStore,
    retentionPolicies: createMemoryContextMemoryRetentionPolicyStoreV010(),
    legalHolds: createMemoryContextMemoryLegalHoldStoreV010(),
    operationLog: createMemoryContextMemoryOperationLogV010(),
    dlpClassifier: {
      providerId: "test.dlp",
      classify() {
        calls++;
        return {
          contractVersion: "0.1.0",
          privacyClass: "STANDARD",
          labels: [],
          reasonCodes: ["NO_MATCH"]
        };
      }
    },
    now: () => new Date("2026-09-27T05:00:00.000Z"),
    id: () => "manual"
  });
  const result = await operations.runDlp(personal);
  assert.equal(result.state, "SUCCEEDED");
  assert.equal(result.changed, 0);
  assert.equal(result.skipped, 1);
  assert.equal(calls, 0);
  assert.equal(governanceStore.snapshot().events.length, 1);
  assert.equal(governanceStore.decision("memory:manual").privacyClass, "SENSITIVE");
});

test("DLP Provider failure leaves the entire classification batch unmodified", async () => {
  const memoryStore = createMemoryContextMemoryStoreV010({
    contractVersion: "0.1.0",
    items: [
      item("memory:first", "First candidate"),
      item("memory:second", "Second candidate")
    ]
  });
  const governanceStore = createMemoryContextMemoryGovernanceStoreV010();
  let calls = 0;
  const operations = createContextMemoryScheduledOperationsV010({
    memoryStore,
    governanceStore,
    retentionPolicies: createMemoryContextMemoryRetentionPolicyStoreV010(),
    legalHolds: createMemoryContextMemoryLegalHoldStoreV010(),
    operationLog: createMemoryContextMemoryOperationLogV010(),
    dlpClassifier: {
      providerId: "test.dlp",
      classify() {
        calls++;
        if (calls === 2) throw new Error("REMOTE_DLP_FAILED");
        return {
          contractVersion: "0.1.0",
          privacyClass: "SENSITIVE",
          labels: ["TEST"],
          reasonCodes: ["TEST"]
        };
      }
    },
    now: () => new Date("2026-09-27T05:00:00.000Z"),
    id: () => "atomic"
  });
  const result = await operations.runDlp(personal);
  assert.equal(result.state, "FAILED");
  assert.equal(governanceStore.snapshot().events.length, 0);
});


test("Eidos Memory Search receives only governance-visible Memory", async () => {
  const memoryStore = createMemoryContextMemoryStoreV010({
    contractVersion: "0.1.0",
    items: [
      item("memory:visible", "Visible operating practice"),
      item("memory:hidden", "Restricted operating secret")
    ]
  });
  const governanceStore = createMemoryContextMemoryGovernanceStoreV010({
    contractVersion: "0.1.0",
    events: [{
      contractVersion: "0.1.0",
      eventId: "g:hidden",
      memoryId: "memory:hidden",
      context: personal,
      state: "ACTIVE",
      privacyClass: "RESTRICTED",
      origin: "HUMAN",
      occurredAt: "2026-09-27T01:00:00.000Z",
      actorSubjectId: "alice"
    }]
  });
  const governance = createHostContextMemoryGovernanceProviderV010(
    governanceStore,
    () => new Date("2026-09-27T05:00:00.000Z"),
    createMemoryContextMemoryLegalHoldStoreV010()
  );
  const reader = createHostContextMemoryReaderV010(memoryStore, { governance });
  const page = await createMemorySearchPageV010({ context: personal, reader });
  assert.deepEqual(page.items.map(value => value.id), ["memory:visible"]);
});

test("Eidos Enterprise Memory Governance hides detail from MEMBER", () => {
  const enterprise = {
    contractVersion: "0.1.0",
    kind: "ENTERPRISE",
    contextId: "enterprise-context:acme",
    enterpriseId: "enterprise:acme"
  };
  const enterpriseItem = {
    ...item("memory:enterprise", "Enterprise confidential memory"),
    context: enterprise,
    provenance: {
      contractVersion: "0.1.0",
      origin: "DIRECT",
      sourceContext: enterprise,
      evidenceRefs: []
    }
  };
  const page = createMemoryGovernancePageV010({
    principal: {
      contractVersion: "0.1.0",
      subjectId: "member",
      actorType: "HUMAN",
      identityProviderId: "test"
    },
    personalContext: {
      contractVersion: "0.1.0",
      kind: "PERSONAL",
      contextId: "personal:member",
      ownerSubjectId: "member"
    },
    context: enterprise,
    memoryStore: createMemoryContextMemoryStoreV010({
      contractVersion: "0.1.0",
      items: [enterpriseItem]
    }),
    governance: createHostContextMemoryGovernanceProviderV010(
      createMemoryContextMemoryGovernanceStoreV010()
    ),
    retentionPolicies: createMemoryContextMemoryRetentionPolicyStoreV010(),
    legalHolds: createMemoryContextMemoryLegalHoldStoreV010(),
    operationLog: createMemoryContextMemoryOperationLogV010(),
    relationships: {
      providerId: "test.relationships",
      listForPrincipal() {
        return [{
          contractVersion: "0.1.0",
          relationshipId: "relationship:member",
          subjectId: "member",
          contextId: enterprise.contextId,
          kind: "MEMBER",
          state: "ACTIVE",
          createdAt: "2026-09-01T00:00:00.000Z",
          createdBySubjectId: "owner"
        }];
      },
      listForContext() { return []; }
    }
  });
  assert.equal(page.items.length, 0);
  assert.match(page.emptyMessage, /authority/i);
});
