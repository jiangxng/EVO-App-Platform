import test from "node:test";
import assert from "node:assert/strict";

import {
  parseHostMemoryIntakeConfigV010,
  createHostMemoryEvidenceSourceProviderV010,
  createHostMemoryIntakeSourceAdapterV010
} from "../../dist/providers/memory-intake/runtime.js";
import {
  createMemoryContextMemoryStoreV010
} from "../../dist/manager/context-memory-store.js";
import {
  createHostContextMemoryReaderV010,
  createHostContextMemoryWriterV010
} from "../../dist/providers/context-memory/runtime.js";
import {
  createMemoryContextMemoryProposalStoreV010
} from "../../dist/manager/context-memory-proposal-store.js";
import {
  createContextMemoryProposalServiceV010
} from "../../dist/manager/context-memory-proposal-service.js";
import {
  createMemoryContextMemoryIntakeStoreV010
} from "../../dist/manager/context-memory-intake-store.js";
import {
  createContextMemoryIntakeServiceV010
} from "../../dist/manager/context-memory-intake-service.js";
import {
  createContextMemoryIntakeActionHandlerV010
} from "../../dist/manager/context-memory-intake-actions.js";
import {
  createHostEnterpriseRelationshipProviderV010
} from "../../dist/providers/enterprise-relationship/runtime.js";
import {
  createHostStaticAuthorizationProviderV010
} from "../../dist/providers/authorization/runtime.js";

const alice = {
  contractVersion: "0.1.0",
  subjectId: "alice",
  actorType: "HUMAN",
  identityProviderId: "test.identity",
  displayName: "Alice"
};

const personalRef = {
  contractVersion: "0.1.0",
  kind: "PERSONAL",
  contextId: "personal:alice"
};

const enterpriseRef = {
  contractVersion: "0.1.0",
  kind: "ENTERPRISE",
  contextId: "enterprise:acme",
  enterpriseId: "acme"
};

function requestContext(ref = personalRef) {
  return {
    contractVersion: "0.1.0",
    principal: alice,
    scope: {
      contractVersion: "0.1.0",
      userId: "alice",
      ...(ref.kind === "ENTERPRISE" ? { enterpriseId: ref.enterpriseId } : {})
    },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:alice",
        ownerSubjectId: "alice",
        displayName: "Alice"
      },
      activeContext: ref,
      ...(ref.kind === "ENTERPRISE"
        ? {
            enterpriseContext: {
              contractVersion: "0.1.0",
              kind: "ENTERPRISE",
              contextId: ref.contextId,
              enterpriseId: ref.enterpriseId,
              enterpriseProviderId: "test.enterprise",
              displayName: "Acme",
              lifecycleState: "ACTIVE"
            }
          }
        : {})
    },
    correlationId: "corr:intake"
  };
}

function allowAll() {
  return createHostStaticAuthorizationProviderV010({
    contractVersion: "0.1.0",
    rules: [{
      id: "allow-intake",
      effect: "ALLOW",
      actions: ["*"],
      subjectIds: ["alice"],
      actorTypes: ["HUMAN"],
      resourceTypes: ["*"]
    }]
  });
}

function denyAll() {
  return createHostStaticAuthorizationProviderV010({
    contractVersion: "0.1.0",
    rules: []
  });
}

function relationshipProvider(kind = "OWNER") {
  return createHostEnterpriseRelationshipProviderV010(() => [{
    contractVersion: "0.1.0",
    relationshipId: "relationship:alice:" + kind.toLowerCase(),
    subjectId: "alice",
    contextId: enterpriseRef.contextId,
    kind,
    state: "ACTIVE",
    createdAt: "2026-09-27T00:00:00.000Z",
    createdBySubjectId: "alice"
  }]);
}

function source(
  trustLevel = "HOST_VERIFIED",
  sourceType = "EXPERIENCE_COMPILER"
) {
  return {
    contractVersion: "0.1.0",
    sourceId: "ec:manufacturing",
    sourceType,
    displayName: "Manufacturing Experience Compiler",
    trustLevel,
    ...(trustLevel === "HOST_VERIFIED"
      ? {
          trustPolicyId: "host.ec.integration",
          verifiedAt: "2026-09-27T00:00:00.000Z"
        }
      : {})
  };
}

function adapter(records) {
  return {
    providerId: "test.ec-adapter",
    sourceId: "ec:manufacturing",
    pull(input) {
      return {
        contractVersion: "0.1.0",
        records: records.filter(item =>
          item.context.kind === input.context.kind
          && item.context.contextId === input.context.contextId
        )
      };
    }
  };
}

function intakeRecord({
  id,
  summary,
  context = personalRef,
  kind = "PRACTICE"
}) {
  return {
    contractVersion: "0.1.0",
    sourceId: "ec:manufacturing",
    sourceRecordId: id,
    context,
    kind,
    summary,
    evidenceRefs: ["ec-node:" + id],
    proposedConfidence: 0.82,
    observedAt: "2026-09-27T00:10:00.000Z"
  };
}

function harness({
  records,
  trustLevel = "HOST_VERIFIED",
  role = "OWNER",
  authorization = allowAll()
}) {
  const memoryStore = createMemoryContextMemoryStoreV010();
  const reader = createHostContextMemoryReaderV010(memoryStore);
  const writer = createHostContextMemoryWriterV010(memoryStore);
  const proposalStore = createMemoryContextMemoryProposalStoreV010();
  const proposalService = createContextMemoryProposalServiceV010({
    store: proposalStore,
    resolveReader() { return reader; },
    resolveWriter() { return writer; },
    now: () => new Date("2026-09-27T03:00:00.000Z")
  });
  const intakeStore = createMemoryContextMemoryIntakeStoreV010();
  const sourceDescriptor = source(trustLevel);
  const sourceAdapter = adapter(records);
  const evidenceProvider = createHostMemoryEvidenceSourceProviderV010(
    sourceDescriptor
  );
  const service = createContextMemoryIntakeServiceV010({
    store: intakeStore,
    proposalService,
    resolveSourceAdapter() { return sourceAdapter; },
    resolveEvidenceSourceProvider() { return evidenceProvider; },
    now: () => new Date("2026-09-27T03:00:00.000Z")
  });
  const relationships = relationshipProvider(role);
  const actionHandler = createContextMemoryIntakeActionHandlerV010({
    service,
    resolveAuthorizationProvider() { return authorization; },
    resolveRelationshipProvider() { return relationships; },
    resolveSourceAdapter() { return sourceAdapter; }
  });

  return {
    memoryStore,
    reader,
    proposalStore,
    proposalService,
    intakeStore,
    sourceAdapter,
    evidenceProvider,
    service,
    actionHandler
  };
}

function action(values = {}, confirmation = true) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: "context.memory.intake.run",
      inputVersion: "0.1.0"
    },
    values,
    sourceInteractionId: "intake:test",
    actionId: "run",
    requiresConfirmation: confirmation
  };
}

test("reference intake config preserves EXPERIENCE_COMPILER source identity and trust metadata", () => {
  const parsed = parseHostMemoryIntakeConfigV010(JSON.stringify({
    contractVersion: "0.1.0",
    source: source("HOST_VERIFIED"),
    records: [
      intakeRecord({
        id: "r1",
        summary: "Run a bottleneck review before increasing line capacity."
      })
    ]
  }));

  assert.equal(parsed.source.sourceType, "EXPERIENCE_COMPILER");
  assert.equal(parsed.source.trustLevel, "HOST_VERIFIED");

  const evidence = createHostMemoryEvidenceSourceProviderV010(parsed.source);
  assert.equal(
    evidence.describe("ec:manufacturing").trustPolicyId,
    "host.ec.integration"
  );

  const sourceAdapter = createHostMemoryIntakeSourceAdapterV010(parsed);
  const pulled = sourceAdapter.pull({
    contractVersion: "0.1.0",
    context: personalRef,
    limit: 10
  });
  assert.equal(pulled.records.length, 1);
  assert.equal(pulled.records[0].sourceId, "ec:manufacturing");
});

test("EC intake creates a review Proposal and Receipt but never durable Memory", async () => {
  const h = harness({
    records: [
      intakeRecord({
        id: "ec-1",
        summary: "Review the constraint before optimizing non-bottleneck stations."
      })
    ]
  });

  const result = await h.actionHandler.execute(
    action(),
    requestContext(personalRef)
  );

  assert.equal(result.ok, true);
  assert.equal(h.memoryStore.snapshot().items.length, 0);
  assert.equal(h.proposalStore.snapshot().proposals.length, 1);
  assert.equal(h.intakeStore.snapshot().receipts.length, 1);

  const proposal = h.proposalStore.snapshot().proposals[0];
  const revision = proposal.revisions[0];
  assert.equal(proposal.state, "PENDING");
  assert.equal(revision.authoredBy, "SOURCE_ADAPTER");
  assert.equal(revision.evidenceSources[0].sourceType, "EXPERIENCE_COMPILER");
  assert.equal(revision.evidenceSources[0].trustLevel, "HOST_VERIFIED");
  assert.equal(
    revision.evidenceRefs.includes("source-record:ec:manufacturing:ec-1"),
    true
  );

  const receipt = h.intakeStore.snapshot().receipts[0];
  assert.equal(receipt.outcome, "PROPOSED");
  assert.equal(receipt.proposalId, proposal.proposalId);
  assert.equal(receipt.evidenceSource.trustLevel, "HOST_VERIFIED");
});

test("HOST_VERIFIED identifies source assurance; it does not auto-accept content", async () => {
  const h = harness({
    records: [
      intakeRecord({
        id: "ec-trust",
        summary: "A source claim still requires human review."
      })
    ],
    trustLevel: "HOST_VERIFIED"
  });

  await h.actionHandler.execute(action(), requestContext(personalRef));

  const proposal = h.proposalStore.snapshot().proposals[0];
  assert.equal(proposal.state, "PENDING");
  assert.equal(proposal.decision, undefined);
  assert.equal(h.memoryStore.snapshot().items.length, 0);
});

test("re-running the same source record is idempotent and does not duplicate Proposal or Receipt", async () => {
  const h = harness({
    records: [
      intakeRecord({
        id: "ec-retry",
        summary: "Use the same intake record only once."
      })
    ]
  });

  const first = await h.service.run({
    principal: alice,
    context: personalRef
  });
  const second = await h.service.run({
    principal: alice,
    context: personalRef
  });

  assert.equal(first.receipts.length, 1);
  assert.equal(second.receipts.length, 0);
  assert.equal(second.reusedSourceRecordReceiptIds.length, 1);
  assert.equal(h.proposalStore.snapshot().proposals.length, 1);
  assert.equal(h.intakeStore.snapshot().receipts.length, 1);
});

test("different source records with identical intake content are fingerprint-deduplicated before review", async () => {
  const same = "Create one review proposal for semantically identical source records.";
  const h = harness({
    records: [
      intakeRecord({ id: "ec-a", summary: same }),
      intakeRecord({ id: "ec-b", summary: same })
    ]
  });

  const result = await h.service.run({
    principal: alice,
    context: personalRef
  });

  assert.equal(result.receipts.length, 2);
  assert.equal(h.proposalStore.snapshot().proposals.length, 1);
  const receipts = h.intakeStore.snapshot().receipts;
  assert.deepEqual(
    receipts.map(item => item.outcome),
    ["PROPOSED", "DUPLICATE_FINGERPRINT"]
  );
  assert.equal(receipts[1].proposalId, receipts[0].proposalId);
  assert.equal(receipts[1].duplicateOfReceiptId, receipts[0].receiptId);

  const proposal = h.proposalStore.snapshot().proposals[0];
  assert.equal(proposal.revisions.length, 2);
  assert.deepEqual(
    proposal.revisions[1].evidenceRefs,
    [
      "ec-node:ec-a",
      "ec-node:ec-b",
      "source-record:ec:manufacturing:ec-a",
      "source-record:ec:manufacturing:ec-b"
    ]
  );
});

test("intake requires Human confirmation and authorization", async () => {
  const records = [
    intakeRecord({
      id: "ec-confirm",
      summary: "Confirmation gate."
    })
  ];
  const h = harness({ records });

  const unconfirmed = await h.actionHandler.execute(
    action({}, false),
    requestContext(personalRef)
  );
  assert.equal(unconfirmed.ok, false);
  assert.equal(unconfirmed.error.code, "MATERIAL_WRITE_CONFIRMATION_REQUIRED");
  assert.equal(h.proposalStore.snapshot().proposals.length, 0);

  const denied = harness({
    records,
    authorization: denyAll()
  });
  const deniedResult = await denied.actionHandler.execute(
    action({}, true),
    requestContext(personalRef)
  );
  assert.equal(deniedResult.ok, false);
  assert.equal(deniedResult.error.code, "STATIC_POLICY_NO_MATCH");
  assert.equal(denied.proposalStore.snapshot().proposals.length, 0);
});

test("AUDITOR cannot run Enterprise Memory intake even when policy Provider allows", async () => {
  const h = harness({
    records: [
      intakeRecord({
        id: "ec-enterprise",
        summary: "Enterprise candidate.",
        context: enterpriseRef
      })
    ],
    role: "AUDITOR"
  });

  const result = await h.actionHandler.execute(
    action(),
    requestContext(enterpriseRef)
  );
  assert.equal(result.ok, false);
  assert.equal(
    result.error.code,
    "ENTERPRISE_CONTEXT_MEMORY_WRITE_RELATIONSHIP_REQUIRED"
  );
  assert.equal(h.proposalStore.snapshot().proposals.length, 0);
});

test("LEXICAL retrieval returns explicit ranking and unsupported semantic strategy fails closed", async () => {
  const memoryStore = createMemoryContextMemoryStoreV010({
    contractVersion: "0.1.0",
    items: [{
      contractVersion: "0.1.0",
      memoryId: "memory:constraint",
      context: personalRef,
      kind: "PRACTICE",
      summary: "Review the bottleneck before adding capacity.",
      provenance: {
        contractVersion: "0.1.0",
        origin: "DIRECT",
        sourceContext: personalRef,
        evidenceRefs: ["doc:toc"]
      },
      attribution: {
        contractVersion: "0.1.0",
        recordedBySubjectId: "alice",
        recordedByActorType: "HUMAN",
        recordedAt: "2026-09-27T00:00:00.000Z"
      }
    }]
  });
  const reader = createHostContextMemoryReaderV010(memoryStore);

  const result = await reader.read({
    contractVersion: "0.1.0",
    context: personalRef,
    query: "bottleneck",
    strategy: "LEXICAL"
  });
  assert.equal(result.strategyUsed, "LEXICAL");
  assert.equal(result.items[0].memoryId, "memory:constraint");
  assert.equal(result.ranking[0].score, 0.75);
  assert.deepEqual(result.ranking[0].signals, ["SUMMARY_CONTAINS"]);

  assert.throws(
    () => reader.read({
      contractVersion: "0.1.0",
      context: personalRef,
      query: "constraint",
      strategy: "SEMANTIC"
    }),
    /CONTEXT_MEMORY_RETRIEVAL_STRATEGY_UNSUPPORTED/
  );
});
