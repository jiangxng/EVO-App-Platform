import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluatePersonalAgentQualityV010
} from "../../dist/agents/enterprise-agent/quality-evaluation.js";
import {
  simulateContextMemoryRetentionV010
} from "../../dist/manager/context-memory-retention-simulation.js";
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
  createMemoryRetentionSimulationPageV010
} from "../../dist/manager/memory-governance-page.js";

const personal = {
  contractVersion: "0.1.0",
  kind: "PERSONAL",
  contextId: "personal:alice"
};

function memory(memoryId, recordedAt) {
  return {
    contractVersion: "0.1.0",
    memoryId,
    context: personal,
    kind: "FACT",
    summary: memoryId,
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

test("Agent quality evaluator distinguishes observed metrics from unknown subjective judgments", () => {
  const evaluation = evaluatePersonalAgentQualityV010({
    contractVersion: "0.1.0",
    interactionId: "interaction:objective-only",
    toolCalls: 3,
    successfulToolCalls: 2,
    failedToolCalls: 1
  });

  assert.equal(evaluation.metrics.unnecessaryClarifications, "UNKNOWN");
  assert.equal(evaluation.metrics.avoidableChoiceMenus, "UNKNOWN");
  assert.equal(evaluation.metrics.executableStepsPushedToHuman, "UNKNOWN");
  assert.equal(evaluation.metrics.postAuthorizationContinuation, "UNKNOWN");
  assert.equal(evaluation.metrics.verifiedCompletion, "UNKNOWN");
  assert.equal(evaluation.metrics.correctionQuality, "UNKNOWN");
  assert.equal(evaluation.metrics.toolSuccessRate, 2 / 3);
  assert.deepEqual(evaluation.signals, ["TOOL_FAILURE_OBSERVED"]);
});

test("Agent quality evaluator reports responsibility regressions only when evidence is explicit", () => {
  const evaluation = evaluatePersonalAgentQualityV010({
    contractVersion: "0.1.0",
    interactionId: "interaction:labeled",
    clarificationAsked: true,
    clarificationWasNecessary: false,
    presentedEquivalentOptionsWithoutRecommendation: true,
    executableStepsReturnedToHuman: 2,
    authorizationRequired: true,
    authorizationGranted: true,
    continuedAfterAuthorization: false,
    completionVerified: false,
    correctedApproach: true,
    correctionPreservedHumanGoal: false,
    toolCalls: 1,
    successfulToolCalls: 1,
    failedToolCalls: 0
  });

  assert.equal(evaluation.metrics.unnecessaryClarifications, 1);
  assert.equal(evaluation.metrics.avoidableChoiceMenus, 1);
  assert.equal(evaluation.metrics.executableStepsPushedToHuman, 2);
  assert.equal(evaluation.metrics.postAuthorizationContinuation, "FAIL");
  assert.equal(evaluation.metrics.verifiedCompletion, false);
  assert.equal(evaluation.metrics.correctionQuality, "FAIL");
  assert.deepEqual(evaluation.signals, [
    "UNNECESSARY_CLARIFICATION",
    "AVOIDABLE_CHOICE_MENU",
    "EXECUTABLE_WORK_PUSHED_TO_HUMAN",
    "AUTHORIZATION_WITHOUT_FOLLOW_THROUGH",
    "COMPLETION_NOT_VERIFIED",
    "CORRECTION_DID_NOT_PRESERVE_GOAL"
  ]);
});

test("candidate retention policy simulation is side-effect-free and shows would-expire impact", () => {
  const memoryStore = createMemoryContextMemoryStoreV010({
    contractVersion: "0.1.0",
    items: [
      memory("memory:old", "2026-01-01T00:00:00.000Z"),
      memory("memory:new", "2026-09-20T00:00:00.000Z")
    ]
  });
  const governanceStore = createMemoryContextMemoryGovernanceStoreV010();
  const retentionPolicies = createMemoryContextMemoryRetentionPolicyStoreV010();
  const legalHolds = createMemoryContextMemoryLegalHoldStoreV010();

  const before = {
    memory: memoryStore.snapshot(),
    governance: governanceStore.snapshot(),
    policy: retentionPolicies.snapshot(),
    holds: legalHolds.snapshot()
  };

  const result = simulateContextMemoryRetentionV010({
    context: personal,
    memoryStore,
    governanceStore,
    retentionPolicies,
    legalHolds,
    candidatePolicy: {
      contractVersion: "0.1.0",
      policyId: "candidate:30d",
      retainForDays: 30
    },
    now: new Date("2026-09-27T00:00:00.000Z")
  });

  assert.equal(result.totals.examined, 2);
  assert.equal(result.totals.wouldExpire, 1);
  assert.equal(result.totals.wouldRemainActive, 1);
  assert.equal(result.items.find(item => item.memoryId === "memory:old").outcome, "WOULD_EXPIRE");
  assert.equal(result.items.find(item => item.memoryId === "memory:new").outcome, "WOULD_REMAIN_ACTIVE");

  assert.deepEqual(memoryStore.snapshot(), before.memory);
  assert.deepEqual(governanceStore.snapshot(), before.governance);
  assert.deepEqual(retentionPolicies.snapshot(), before.policy);
  assert.deepEqual(legalHolds.snapshot(), before.holds);
});

test("retention simulation preserves Legal Hold and already-expired precedence", () => {
  const memoryStore = createMemoryContextMemoryStoreV010({
    contractVersion: "0.1.0",
    items: [
      memory("memory:held", "2026-01-01T00:00:00.000Z"),
      memory("memory:expired", "2026-01-01T00:00:00.000Z")
    ]
  });
  const governanceStore = createMemoryContextMemoryGovernanceStoreV010({
    contractVersion: "0.1.0",
    events: [{
      contractVersion: "0.1.0",
      eventId: "g:expired",
      memoryId: "memory:expired",
      context: personal,
      state: "EXPIRED",
      privacyClass: "STANDARD",
      origin: "HUMAN",
      occurredAt: "2026-09-01T00:00:00.000Z",
      actorSubjectId: "alice"
    }]
  });
  const retentionPolicies = createMemoryContextMemoryRetentionPolicyStoreV010({
    contractVersion: "0.1.0",
    events: [{
      contractVersion: "0.1.0",
      eventId: "policy:1",
      policyId: "policy:30d",
      context: personal,
      state: "ACTIVE",
      retainForDays: 30,
      occurredAt: "2026-01-01T00:00:00.000Z",
      actorSubjectId: "alice"
    }]
  });
  const legalHolds = createMemoryContextMemoryLegalHoldStoreV010({
    contractVersion: "0.1.0",
    events: [{
      contractVersion: "0.1.0",
      eventId: "hold:1",
      holdId: "case:1",
      memoryId: "memory:held",
      context: personal,
      state: "PLACED",
      reason: "Preserve",
      occurredAt: "2026-02-01T00:00:00.000Z",
      actorSubjectId: "alice"
    }]
  });

  const result = simulateContextMemoryRetentionV010({
    context: personal,
    memoryStore,
    governanceStore,
    retentionPolicies,
    legalHolds,
    now: new Date("2026-09-27T00:00:00.000Z")
  });

  assert.equal(result.items.find(item => item.memoryId === "memory:held").outcome, "LEGAL_HOLD");
  assert.equal(result.items.find(item => item.memoryId === "memory:expired").outcome, "ALREADY_EXPIRED");
});

test("Eidos retention simulation surface is governance-gated and side-effect-free", () => {
  const memoryStore = createMemoryContextMemoryStoreV010({
    contractVersion: "0.1.0",
    items: [memory("memory:one", "2026-01-01T00:00:00.000Z")]
  });
  const governanceStore = createMemoryContextMemoryGovernanceStoreV010();
  const retentionPolicies = createMemoryContextMemoryRetentionPolicyStoreV010({
    contractVersion: "0.1.0",
    events: [{
      contractVersion: "0.1.0",
      eventId: "policy:ui",
      policyId: "policy:ui",
      context: personal,
      state: "ACTIVE",
      retainForDays: 30,
      occurredAt: "2026-01-01T00:00:00.000Z",
      actorSubjectId: "alice"
    }]
  });
  const legalHolds = createMemoryContextMemoryLegalHoldStoreV010();

  const page = createMemoryRetentionSimulationPageV010({
    principal: {
      contractVersion: "0.1.0",
      subjectId: "alice",
      actorType: "HUMAN",
      identityProviderId: "test"
    },
    personalContext: {
      contractVersion: "0.1.0",
      kind: "PERSONAL",
      contextId: personal.contextId,
      ownerSubjectId: "alice"
    },
    context: personal,
    memoryStore,
    governanceStore,
    retentionPolicies,
    legalHolds,
    now: new Date("2026-09-27T00:00:00.000Z")
  });

  assert.equal(page.id, "evo.memory.retention-simulation");
  assert.equal(page.items[0].status.label, "WOULD_EXPIRE");
  assert.equal(governanceStore.snapshot().events.length, 0);
});
