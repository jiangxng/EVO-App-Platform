import test from "node:test";
import assert from "node:assert/strict";

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
  createContextMemoryProposalActionHandlersV010
} from "../../dist/manager/context-memory-proposal-actions.js";
import {
  createHostEnterpriseRelationshipProviderV010
} from "../../dist/providers/enterprise-relationship/runtime.js";
import {
  createHostStaticAuthorizationProviderV010
} from "../../dist/providers/authorization/runtime.js";
import {
  createPersonalAgentMemoryReviewPageV010
} from "../../dist/manager/personal-agent-experience.js";
import {
  createLocalizationRuntime,
  localizeAppHostPageDefinition
} from "../../dist/vendor/eidos/src/localization/index.js";
import {
  enterpriseAgentPackage,
  ENTERPRISE_AGENT_MEMORY_REVIEW_PAGE_SOURCE
} from "../../dist/agents/enterprise-agent/package.js";

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

const personalContext = {
  contractVersion: "0.1.0",
  personalContext: {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: "personal:alice",
    ownerSubjectId: "alice",
    displayName: "Alice"
  },
  activeContext: personalRef
};

const enterpriseContext = {
  contractVersion: "0.1.0",
  personalContext: personalContext.personalContext,
  activeContext: enterpriseRef,
  enterpriseContext: {
    contractVersion: "0.1.0",
    kind: "ENTERPRISE",
    contextId: "enterprise:acme",
    enterpriseId: "acme",
    enterpriseProviderId: "test.enterprise",
    displayName: "Acme",
    lifecycleState: "ACTIVE"
  }
};

function requestContext(resolved = personalContext) {
  return {
    contractVersion: "0.1.0",
    principal: alice,
    scope: {
      contractVersion: "0.1.0",
      userId: "alice",
      ...(resolved.activeContext.kind === "ENTERPRISE"
        ? { enterpriseId: resolved.activeContext.enterpriseId }
        : {})
    },
    context: resolved,
    correlationId: "corr:test",
    locale: "en"
  };
}

function allowAll() {
  return createHostStaticAuthorizationProviderV010({
    contractVersion: "0.1.0",
    rules: [{
      id: "allow-memory-review",
      effect: "ALLOW",
      actions: ["*"],
      subjectIds: ["alice"],
      actorTypes: ["HUMAN"],
      resourceTypes: ["*"]
    }]
  });
}

function relationshipProvider(kind = "OWNER") {
  return createHostEnterpriseRelationshipProviderV010(() => [{
    contractVersion: "0.1.0",
    relationshipId: "relationship:alice:" + kind.toLowerCase(),
    subjectId: "alice",
    contextId: "enterprise:acme",
    kind,
    state: "ACTIVE",
    createdAt: "2026-09-27T00:00:00.000Z",
    createdBySubjectId: "alice"
  }]);
}

function harness({ role = "OWNER", ids = [] } = {}) {
  const memoryStore = createMemoryContextMemoryStoreV010();
  const reader = createHostContextMemoryReaderV010(memoryStore);
  const writer = createHostContextMemoryWriterV010(memoryStore);
  const proposalStore = createMemoryContextMemoryProposalStoreV010();
  const generated = [...ids];
  let sequence = 0;
  const service = createContextMemoryProposalServiceV010({
    store: proposalStore,
    resolveReader() { return reader; },
    resolveWriter() { return writer; },
    now: () => new Date("2026-09-27T02:03:04.000Z"),
    id: () => generated.shift() ?? "id-" + (++sequence)
  });
  const relationships = relationshipProvider(role);
  const handlers = createContextMemoryProposalActionHandlersV010({
    service,
    resolveAuthorizationProvider: allowAll,
    resolveRelationshipProvider() { return relationships; },
    listAvailableContexts() { return [personalRef, enterpriseRef]; },
    resolveContext(_principal, ref) {
      return ref.kind === "PERSONAL" ? personalContext : enterpriseContext;
    }
  });
  return {
    memoryStore,
    reader,
    proposalStore,
    service,
    handlers: new Map(handlers.map(item => [item.commandCode, item]))
  };
}

function action(code, values, confirmation = false) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: { code, inputVersion: "0.1.0" },
    values,
    sourceInteractionId: "review:" + code,
    actionId: code,
    requiresConfirmation: confirmation
  };
}

async function execute(h, code, values, context, confirmation = false) {
  const handler = h.handlers.get(code);
  assert.ok(handler);
  return handler.execute(action(code, values, confirmation), context);
}

test("Personal Agent proposal is review state, not durable Memory", async () => {
  const h = harness({ ids: ["r1", "p1"] });
  const proposal = await h.service.create({
    principal: alice,
    context: personalRef,
    draft: {
      kind: "PRACTICE",
      summary: "Review supplier bank-account changes with two people.",
      evidenceRefs: ["policy:payments"],
      proposedConfidence: 0.86
    }
  });

  assert.equal(proposal.state, "PENDING");
  assert.equal(proposal.revisions[0].authoredBy, "PERSONAL_AGENT");
  assert.equal(proposal.revisions[0].evidenceQuality, "REFERENCED");
  assert.equal(proposal.revisions[0].proposedConfidence, 0.86);
  assert.equal(h.memoryStore.snapshot().items.length, 0);
});

test("Human edit appends a revision without rewriting the Agent proposal", async () => {
  const h = harness({ ids: ["r1", "p1", "r2"] });
  const proposal = await h.service.create({
    principal: alice,
    context: personalRef,
    draft: {
      kind: "CLAIM",
      summary: "Initial wording."
    }
  });
  const before = structuredClone(proposal.revisions[0]);

  const result = await execute(
    h,
    "context.memory.proposal.edit",
    {
      itemId: proposal.proposalId,
      kind: "FACT",
      summary: "Human-reviewed wording."
    },
    requestContext()
  );
  assert.equal(result.ok, true);

  const updated = h.proposalStore.snapshot().proposals[0];
  assert.equal(updated.revisions.length, 2);
  assert.deepEqual(updated.revisions[0], before);
  assert.equal(updated.revisions[1].authoredBy, "HUMAN");
  assert.equal(updated.revisions[1].kind, "FACT");
  assert.equal(updated.revisions[1].summary, "Human-reviewed wording.");
  assert.equal(h.memoryStore.snapshot().items.length, 0);
});

test("Accept requires confirmation and materializes exactly one immutable Memory", async () => {
  const h = harness({ ids: ["r1", "p1"] });
  const proposal = await h.service.create({
    principal: alice,
    context: personalRef,
    draft: {
      kind: "FACT",
      summary: "The reviewed durable fact.",
      evidenceRefs: ["evidence:1"]
    }
  });

  const denied = await execute(
    h,
    "context.memory.proposal.accept",
    { itemId: proposal.proposalId, kind: "FACT", summary: "The reviewed durable fact." },
    requestContext(),
    false
  );
  assert.equal(denied.ok, false);
  assert.equal(denied.error.code, "MATERIAL_WRITE_CONFIRMATION_REQUIRED");
  assert.equal(h.memoryStore.snapshot().items.length, 0);

  const accepted = await execute(
    h,
    "context.memory.proposal.accept",
    { itemId: proposal.proposalId, kind: "FACT", summary: "The reviewed durable fact." },
    requestContext(),
    true
  );
  assert.equal(accepted.ok, true);
  assert.equal(h.proposalStore.snapshot().proposals[0].state, "ACCEPTED");
  assert.equal(h.memoryStore.snapshot().items.length, 1);

  const memory = h.memoryStore.snapshot().items[0];
  assert.equal(memory.summary, "The reviewed durable fact.");
  assert.equal(memory.attribution.recordedBySubjectId, "alice");
  assert.deepEqual(memory.provenance.evidenceRefs, ["evidence:1"]);

  const retry = await execute(
    h,
    "context.memory.proposal.accept",
    { itemId: proposal.proposalId, kind: "FACT", summary: "The reviewed durable fact." },
    requestContext(),
    true
  );
  assert.equal(retry.ok, true);
  assert.equal(h.memoryStore.snapshot().items.length, 1);
});

test("Reject is terminal and does not write Memory", async () => {
  const h = harness({ ids: ["r1", "p1"] });
  const proposal = await h.service.create({
    principal: alice,
    context: personalRef,
    draft: {
      kind: "CLAIM",
      summary: "Do not keep this."
    }
  });

  const rejected = await execute(
    h,
    "context.memory.proposal.reject",
    { itemId: proposal.proposalId },
    requestContext(),
    true
  );
  assert.equal(rejected.ok, true);
  assert.equal(h.proposalStore.snapshot().proposals[0].state, "REJECTED");
  assert.equal(h.memoryStore.snapshot().items.length, 0);

  await assert.rejects(
    () => h.service.edit({
      proposalId: proposal.proposalId,
      principal: alice,
      summary: "Try to rewrite terminal proposal."
    }),
    /CONTEXT_MEMORY_PROPOSAL_NOT_PENDING/
  );
});

test("Proposal review signals are assistance, not automatic truth decisions", async () => {
  const h = harness({ ids: ["r1", "p1"] });
  const writer = createHostContextMemoryWriterV010(h.memoryStore);
  await writer.write({
    contractVersion: "0.1.0",
    item: {
      contractVersion: "0.1.0",
      memoryId: "memory:existing",
      context: personalRef,
      kind: "FACT",
      summary: "Existing fact",
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
        recordedAt: "2026-09-27T00:00:00.000Z"
      }
    }
  });

  const proposal = await h.service.create({
    principal: alice,
    context: personalRef,
    draft: {
      kind: "FACT",
      summary: "Existing fact",
      supersedesMemoryId: "memory:existing",
      potentialContradictionMemoryIds: ["memory:existing"]
    }
  });
  const kinds = proposal.revisions[0].reviewSignals.map(item => item.kind).sort();
  assert.deepEqual(kinds, ["POTENTIAL_CONTRADICTION", "SUPERSESSION_CANDIDATE"]);
  assert.equal(proposal.state, "PENDING");
});

test("AUDITOR can read Enterprise Context but cannot accept Enterprise Memory proposal", async () => {
  const h = harness({ role: "AUDITOR", ids: ["r1", "p1"] });
  const proposal = await h.service.create({
    principal: alice,
    context: enterpriseRef,
    draft: {
      kind: "FACT",
      summary: "Enterprise fact candidate."
    }
  });

  const result = await execute(
    h,
    "context.memory.proposal.accept",
    { itemId: proposal.proposalId, kind: "FACT", summary: "Enterprise fact candidate." },
    requestContext(enterpriseContext),
    true
  );
  assert.equal(result.ok, false);
  assert.equal(
    result.error.code,
    "ENTERPRISE_CONTEXT_MEMORY_WRITE_RELATIONSHIP_REQUIRED"
  );
  assert.equal(h.memoryStore.snapshot().items.length, 0);
});

test("Memory Review page uses Eidos Review Queue and has all four locale bundles", async () => {
  const h = harness({ ids: ["r1", "p1"] });
  const proposal = await h.service.create({
    principal: alice,
    context: personalRef,
    draft: {
      kind: "PRACTICE",
      summary: "Reviewable proposal.",
      proposedConfidence: 0.73
    }
  });

  const definition = createPersonalAgentMemoryReviewPageV010(
    [proposal],
    new Map([["personal:alice", "Alice"]])
  );
  assert.equal(definition.kind, "review-queue");
  assert.equal(definition.items[0].state, "attention");
  assert.equal(definition.items[0].primaryAction.command, "context.memory.proposal.accept");

  const experience = enterpriseAgentPackage.features[0].contributions.find(
    item => item.kind === "eidos.experience"
  ).manifest;
  assert.equal(
    experience.pages.some(item => item.source === ENTERPRISE_AGENT_MEMORY_REVIEW_PAGE_SOURCE),
    true
  );

  const bundles = enterpriseAgentPackage.features[0].contributions
    .filter(item => item.kind === "eidos.localization-bundle")
    .map(item => item.bundle);
  assert.deepEqual(
    bundles.map(item => item.locale).sort(),
    ["en", "ja", "zh-CN", "zh-TW"]
  );

  const page = {
    experienceId: "enterprise-agent",
    packageId: "enterprise-agent",
    featureId: "enterprise-agent.default",
    route: {
      id: "enterprise-agent.memory-review",
      path: "/enterprise-agent/memory",
      pageId: "enterprise-agent.memory-review"
    },
    page: {
      id: "enterprise-agent.memory-review",
      source: ENTERPRISE_AGENT_MEMORY_REVIEW_PAGE_SOURCE
    },
    definition
  };

  const ja = localizeAppHostPageDefinition(
    page,
    createLocalizationRuntime(bundles, { locale: "ja" })
  );
  assert.equal(ja.title, "メモリーレビュー");
  assert.equal(ja.items[0].primaryAction.label, "承認");
  assert.equal(ja.items[0].fields[0].options[3].value, "PRACTICE");

  const tw = localizeAppHostPageDefinition(
    page,
    createLocalizationRuntime(bundles, { locale: "zh-TW" })
  );
  assert.equal(tw.title, "記憶審核");
  assert.equal(tw.items[0].secondaryActions[1].label, "拒絕");
});


test("Memory Review localizes evidence source trust in all four product locales", async () => {
  const h = harness({ ids: ["r-source", "p-source"] });
  const proposal = await h.service.create({
    principal: alice,
    context: personalRef,
    authoredBy: "SOURCE_ADAPTER",
    draft: {
      kind: "PRACTICE",
      summary: "Source-backed proposal.",
      evidenceRefs: ["source-record:ec:manufacturing:1"],
      evidenceSources: [{
        contractVersion: "0.1.0",
        sourceId: "ec:manufacturing",
        sourceType: "EXPERIENCE_COMPILER",
        displayName: "Manufacturing EC",
        trustLevel: "HOST_VERIFIED",
        trustPolicyId: "host.ec.integration",
        verifiedAt: "2026-09-27T00:00:00.000Z"
      }]
    }
  });

  const definition = createPersonalAgentMemoryReviewPageV010(
    [proposal],
    new Map([["personal:alice", "Alice"]])
  );
  const trustMetric = definition.items[0].metrics.find(
    item => item.id === "source-trust-host-verified"
  );
  assert.equal(trustMetric.value, "1");
  assert.equal(definition.items[0].evidence.some(
    item => item.title === "Manufacturing EC" && item.source === "EXPERIENCE_COMPILER"
  ), true);

  const experience = enterpriseAgentPackage.features[0].contributions.find(
    item => item.kind === "eidos.experience"
  ).manifest;
  const route = experience.routes.find(
    item => item.pageId === "enterprise-agent.memory-review"
  );
  const page = {
    experienceId: "enterprise-agent",
    packageId: "enterprise-agent",
    featureId: "enterprise-agent.default",
    route,
    page: {
      id: "enterprise-agent.memory-review",
      source: ENTERPRISE_AGENT_MEMORY_REVIEW_PAGE_SOURCE
    },
    definition
  };
  const bundles = enterpriseAgentPackage.features[0].contributions
    .filter(item => item.kind === "eidos.localization-bundle")
    .map(item => item.bundle);

  const expected = new Map([
    ["en", "Host-verified sources"],
    ["zh-CN", "Host 已验证来源"],
    ["ja", "Host 検証済みソース"],
    ["zh-TW", "Host 已驗證來源"]
  ]);
  for (const [locale, label] of expected) {
    const localized = localizeAppHostPageDefinition(
      page,
      createLocalizationRuntime(bundles, { locale })
    );
    const metric = localized.items[0].metrics.find(
      item => item.id === "source-trust-host-verified"
    );
    assert.equal(metric.label, label);
  }
});
