import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryPersonalAgentQualityEvidenceStoreV010,
  createHostObservedQualityEvidenceV010
} from "../../dist/agents/enterprise-agent/quality-evidence-store.js";
import {
  createEnterpriseAgentChatActionHandler
} from "../../dist/agents/enterprise-agent/chat-action-handler.js";
import {
  createContextMemoryPolicyActionHandlersV010
} from "../../dist/manager/context-memory-policy-actions.js";
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
  createMemoryContextMemoryRetentionDraftStoreV010
} from "../../dist/manager/context-memory-retention-draft-store.js";
import {
  createMemoryRetentionDraftFormV010,
  createMemoryRetentionDraftsPageV010
} from "../../dist/manager/memory-governance-page.js";
import {
  createPersonalAgentQualityPageV010
} from "../../dist/manager/personal-agent-quality-page.js";

const personalRef = {
  contractVersion: "0.1.0",
  kind: "PERSONAL",
  contextId: "personal:alice"
};
const personalContext = {
  contractVersion: "0.1.0",
  kind: "PERSONAL",
  contextId: "personal:alice",
  ownerSubjectId: "alice"
};
const principal = {
  contractVersion: "0.1.0",
  subjectId: "alice",
  actorType: "HUMAN",
  identityProviderId: "test"
};
const requestContext = {
  contractVersion: "0.1.0",
  principal,
  scope: {
    contractVersion: "0.1.0",
    userId: "alice"
  },
  context: {
    contractVersion: "0.1.0",
    personalContext,
    activeContext: personalRef
  },
  correlationId: "correlation:test"
};

function memory(memoryId, recordedAt = "2026-01-01T00:00:00.000Z") {
  return {
    contractVersion: "0.1.0",
    memoryId,
    context: personalRef,
    kind: "FACT",
    summary: memoryId,
    provenance: {
      contractVersion: "0.1.0",
      origin: "DIRECT",
      sourceContext: personalRef,
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

function request(code, values = {}, requiresConfirmation = false) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: { code, inputVersion: "0.1.0" },
    values,
    sourceInteractionId: "interaction:test",
    actionId: code,
    requiresConfirmation
  };
}

test("Host-observed Personal Agent evidence records only objective metrics", () => {
  const store = createMemoryPersonalAgentQualityEvidenceStoreV010();
  store.append(createHostObservedQualityEvidenceV010({
    eventId: "quality:1",
    interactionId: "interaction:1",
    occurredAt: "2026-09-27T04:00:00.000Z",
    principalSubjectId: "alice",
    context: personalRef,
    observations: [{ ok: true }, { ok: false }]
  }));

  const event = store.list()[0];
  assert.equal(event.source, "HOST_OBSERVED");
  assert.equal(event.evidence.toolCalls, 2);
  assert.equal(event.evidence.successfulToolCalls, 1);
  assert.equal(event.evidence.failedToolCalls, 1);
  assert.equal(event.evaluation.metrics.unnecessaryClarifications, "UNKNOWN");
  assert.equal(event.evaluation.metrics.verifiedCompletion, "UNKNOWN");
  assert.deepEqual(event.evaluation.signals, ["TOOL_FAILURE_OBSERVED"]);
});

test("Personal Agent chat persists Host-observed evidence after a real model interaction", async () => {
  const store = createMemoryPersonalAgentQualityEvidenceStoreV010();
  const handler = createEnterpriseAgentChatActionHandler({
    resolveLlmProvider() {
      return {
        installedProviderIds: ["test-llm"],
        provider: {
          providerId: "test.llm",
          modelId: "test-model",
          async infer() {
            return {
              contractVersion: "0.1.0",
              providerId: "test.llm",
              modelId: "test-model",
              text: "Handled.",
              toolCalls: [],
              usage: { inputTokens: 1, outputTokens: 1 },
              finishReason: "stop"
            };
          }
        }
      };
    },
    resolveIdentitySession() {
      return {
        contractVersion: "0.1.0",
        sessionId: "session:alice",
        principal,
        issuedAt: "2026-09-27T04:00:00.000Z"
      };
    },
    resolveContext() {
      return {
        contractVersion: "0.1.0",
        personalContext,
        activeContext: personalRef
      };
    },
    createToolCatalog() {
      return {
        list() { return []; },
        async invoke() { throw new Error("UNEXPECTED_TOOL_CALL"); }
      };
    },
    qualityEvidenceStore: store,
    now: () => new Date("2026-09-27T04:00:00.000Z"),
    qualityEventId: () => "event:1"
  });

  const result = await handler.execute(request("enterprise-agent.chat", {
    message: "Handle this."
  }), requestContext);

  assert.equal(result.ok, true);
  assert.equal(store.list().length, 1);
  assert.equal(store.list()[0].interactionId, "interaction:test");
  assert.equal(store.list()[0].evidence.toolCalls, 0);
});

test("Personal Agent quality page is scoped to principal + active Context and never fabricates metrics", () => {
  const store = createMemoryPersonalAgentQualityEvidenceStoreV010();
  let page = createPersonalAgentQualityPageV010({
    principal,
    context: personalRef,
    store
  });
  assert.equal(page.items.length, 0);
  assert.match(page.emptyMessage, /does not fabricate/i);

  store.append(createHostObservedQualityEvidenceV010({
    eventId: "quality:scoped",
    interactionId: "interaction:scoped",
    occurredAt: "2026-09-27T04:00:00.000Z",
    principalSubjectId: "alice",
    context: personalRef,
    observations: [{ ok: true }]
  }));
  page = createPersonalAgentQualityPageV010({ principal, context: personalRef, store });
  assert.ok(page.items.some(item => item.id === "quality:tool-success"));
  assert.ok(page.items.some(item => item.id === "quality:human-load"));
});

test("retention draft prepare previews impact without governance mutation, then confirmed commit appends policy", async () => {
  const memoryStore = createMemoryContextMemoryStoreV010({
    contractVersion: "0.1.0",
    items: [memory("memory:old")]
  });
  const governanceStore = createMemoryContextMemoryGovernanceStoreV010();
  const retentionPolicies = createMemoryContextMemoryRetentionPolicyStoreV010();
  const legalHolds = createMemoryContextMemoryLegalHoldStoreV010();
  const retentionDrafts = createMemoryContextMemoryRetentionDraftStoreV010();
  let n = 0;
  const handlers = createContextMemoryPolicyActionHandlersV010({
    memoryStore,
    governanceStore,
    retentionPolicies,
    legalHolds,
    retentionDrafts,
    resolveAuthorizationProvider() {
      return {
        providerId: "allow",
        check() {
          return {
            contractVersion: "0.1.0",
            allowed: true,
            policyProviderId: "allow",
            reasonCodes: ["ALLOW"]
          };
        }
      };
    },
    resolveRelationshipProvider() { return undefined; },
    now: () => new Date("2026-09-27T04:00:00.000Z"),
    id: () => String(++n)
  });

  const prepare = handlers.find(h => h.commandCode === "context.memory.retention-draft.prepare");
  const commit = handlers.find(h => h.commandCode === "context.memory.retention-draft.commit");
  const prepared = await prepare.execute(request("context.memory.retention-draft.prepare", {
    policyId: "policy:30d",
    retainForDays: 30,
    reason: "Operational retention"
  }), requestContext);

  assert.equal(prepared.ok, true);
  assert.equal(retentionPolicies.snapshot().events.length, 0);
  assert.equal(governanceStore.snapshot().events.length, 0);
  assert.equal(retentionDrafts.listForContext(personalRef)[0].state, "PREPARED");
  assert.equal(prepared.result.impact.wouldExpire, 1);

  const denied = await commit.execute(request("context.memory.retention-draft.commit", {
    draftId: prepared.result.draftId
  }, false), requestContext);
  assert.equal(denied.ok, false);
  assert.equal(denied.error.code, "MATERIAL_WRITE_CONFIRMATION_REQUIRED");

  const committed = await commit.execute(request("context.memory.retention-draft.commit", {
    draftId: prepared.result.draftId
  }, true), requestContext);
  assert.equal(committed.ok, true);
  assert.equal(retentionPolicies.snapshot().events.length, 1);
  assert.equal(retentionDrafts.get(prepared.result.draftId).state, "COMMITTED");
});

test("retention draft commit fails closed when preview became stale", async () => {
  const memoryStore = createMemoryContextMemoryStoreV010({
    contractVersion: "0.1.0",
    items: [memory("memory:old")]
  });
  const governanceStore = createMemoryContextMemoryGovernanceStoreV010();
  const retentionPolicies = createMemoryContextMemoryRetentionPolicyStoreV010();
  const legalHolds = createMemoryContextMemoryLegalHoldStoreV010();
  const retentionDrafts = createMemoryContextMemoryRetentionDraftStoreV010();
  let n = 0;
  const handlers = createContextMemoryPolicyActionHandlersV010({
    memoryStore,
    governanceStore,
    retentionPolicies,
    legalHolds,
    retentionDrafts,
    resolveAuthorizationProvider() {
      return {
        providerId: "allow",
        check() {
          return {
            contractVersion: "0.1.0",
            allowed: true,
            policyProviderId: "allow",
            reasonCodes: ["ALLOW"]
          };
        }
      };
    },
    resolveRelationshipProvider() { return undefined; },
    now: () => new Date("2026-09-27T04:00:00.000Z"),
    id: () => String(++n)
  });
  const prepare = handlers.find(h => h.commandCode === "context.memory.retention-draft.prepare");
  const commit = handlers.find(h => h.commandCode === "context.memory.retention-draft.commit");

  const prepared = await prepare.execute(request("context.memory.retention-draft.prepare", {
    policyId: "policy:30d",
    retainForDays: 30
  }), requestContext);

  legalHolds.append({
    contractVersion: "0.1.0",
    eventId: "hold:after-preview",
    holdId: "case:after-preview",
    memoryId: "memory:old",
    context: personalRef,
    state: "PLACED",
    reason: "New preservation requirement",
    occurredAt: "2026-09-27T04:01:00.000Z",
    actorSubjectId: "alice"
  });

  const result = await commit.execute(request("context.memory.retention-draft.commit", {
    draftId: prepared.result.draftId
  }, true), requestContext);

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "CONTEXT_MEMORY_RETENTION_DRAFT_STALE_REPREVIEW_REQUIRED");
  assert.equal(retentionPolicies.snapshot().events.length, 0);
  assert.equal(retentionDrafts.get(prepared.result.draftId).state, "PREPARED");
});

test("Eidos retention draft flow uses formal UIDL form and confirmed catalog commit", () => {
  const form = createMemoryRetentionDraftFormV010();
  assert.equal(form.kind, "form");
  assert.equal(form.command.code, "context.memory.retention-draft.prepare");
  assert.equal(form.actions[0].requiresConfirmation, false);

  const drafts = createMemoryContextMemoryRetentionDraftStoreV010();
  const simulation = {
    contractVersion: "0.1.0",
    context: personalRef,
    simulatedAt: "2026-09-27T04:00:00.000Z",
    candidatePolicy: {
      contractVersion: "0.1.0",
      policyId: "policy:30d",
      retainForDays: 30
    },
    totals: {
      examined: 1,
      alreadyExpired: 0,
      legalHold: 0,
      wouldExpire: 1,
      wouldRemainActive: 0,
      noMatchingPolicy: 0
    },
    items: []
  };
  drafts.append({
    contractVersion: "0.1.0",
    eventId: "draft:event:1",
    draftId: "draft:1",
    context: personalRef,
    state: "PREPARED",
    policy: {
      contractVersion: "0.1.0",
      policyId: "policy:30d",
      retainForDays: 30
    },
    simulation,
    occurredAt: "2026-09-27T04:00:00.000Z",
    actorSubjectId: "alice"
  });
  const page = createMemoryRetentionDraftsPageV010({
    principal,
    personalContext,
    context: personalRef,
    drafts
  });
  assert.equal(page.items[0].primaryAction.command, "context.memory.retention-draft.commit");
  assert.equal(page.items[0].primaryAction.requiresConfirmation, true);
  assert.equal(page.items[0].secondaryActions[0].command, "context.memory.retention-draft.discard");
});
