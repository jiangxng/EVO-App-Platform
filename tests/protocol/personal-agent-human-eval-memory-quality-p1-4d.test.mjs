import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryPersonalAgentQualityEvidenceStoreV010,
  createHostObservedQualityEvidenceV010,
  createEvaluatedQualityEvidenceV010
} from "../../dist/agents/enterprise-agent/quality-evidence-store.js";
import {
  createPersonalAgentQualityEvaluationActionHandlerV010
} from "../../dist/agents/enterprise-agent/quality-evaluation-actions.js";
import {
  createPersonalAgentQualityReviewPageV010
} from "../../dist/manager/personal-agent-quality-page.js";
import {
  createMemoryContextMemoryQualityStoreV010,
  evaluateContextMemoryQualityV010
} from "../../dist/manager/context-memory-quality-store.js";
import {
  createContextMemoryQualityActionHandlerV010
} from "../../dist/manager/context-memory-quality-actions.js";
import {
  createContextMemoryProposalActionHandlersV010
} from "../../dist/manager/context-memory-proposal-actions.js";
import {
  createMemoryContextMemoryStoreV010
} from "../../dist/manager/context-memory-store.js";
import {
  createMemoryQualityPageV010,
  createMemoryContradictionReviewPageV010
} from "../../dist/manager/memory-governance-page.js";

const personalRef = {
  contractVersion:"0.1.0",
  kind:"PERSONAL",
  contextId:"personal:alice"
};
const personalContext = {
  contractVersion:"0.1.0",
  kind:"PERSONAL",
  contextId:"personal:alice",
  ownerSubjectId:"alice"
};
const principal = {
  contractVersion:"0.1.0",
  subjectId:"alice",
  actorType:"HUMAN",
  identityProviderId:"test"
};
const requestContext = {
  contractVersion:"0.1.0",
  principal,
  scope:{contractVersion:"0.1.0",userId:"alice"},
  context:{
    contractVersion:"0.1.0",
    personalContext,
    activeContext:personalRef
  },
  correlationId:"correlation:p1.4d"
};

function memory(id, overrides={}) {
  return {
    contractVersion:"0.1.0",
    memoryId:id,
    context:personalRef,
    kind:"FACT",
    summary:id,
    provenance:{
      contractVersion:"0.1.0",
      origin:"DIRECT",
      sourceContext:personalRef,
      evidenceRefs:[],
      ...(overrides.evidenceSources ? {evidenceSources:overrides.evidenceSources} : {})
    },
    attribution:{
      contractVersion:"0.1.0",
      recordedBySubjectId:"alice",
      recordedByActorType:"HUMAN",
      recordedAt:"2026-09-27T00:00:00.000Z"
    },
    ...(overrides.observedAt ? {observedAt:overrides.observedAt} : {})
  };
}

function request(code, values={}, requiresConfirmation=false, actionId=code) {
  return {
    contractVersion:"0.1.0",
    type:"command",
    command:{code,inputVersion:"0.1.0"},
    values,
    sourceInteractionId:"interaction:ui",
    actionId,
    requiresConfirmation
  };
}

function allowProvider() {
  return {
    providerId:"allow",
    check() {
      return {
        contractVersion:"0.1.0",
        allowed:true,
        policyProviderId:"allow",
        reasonCodes:["ALLOW"]
      };
    }
  };
}

test("Human evaluation enriches subjective quality without double counting Host tool metrics", async () => {
  const store=createMemoryPersonalAgentQualityEvidenceStoreV010();
  store.append(createHostObservedQualityEvidenceV010({
    eventId:"host:1",
    interactionId:"interaction:1",
    occurredAt:"2026-09-27T01:00:00.000Z",
    principalSubjectId:"alice",
    context:personalRef,
    observations:[{ok:true},{ok:false}]
  }));

  const handler=createPersonalAgentQualityEvaluationActionHandlerV010({
    store,
    resolveAuthorizationProvider:()=>allowProvider(),
    now:()=>new Date("2026-09-27T02:00:00.000Z"),
    id:()=> "1"
  });

  const result=await handler.execute(request(
    "enterprise-agent.quality.evaluate",
    {
      itemId:"interaction:1",
      evaluationSource:"HUMAN_EVALUATED",
      clarificationAsked:"YES",
      clarificationWasNecessary:"NO",
      presentedEquivalentOptionsWithoutRecommendation:"NO",
      executableStepsReturnedToHuman:"2",
      completionVerified:"YES"
    }
  ),requestContext);

  assert.equal(result.ok,true);
  const aggregate=store.aggregate();
  assert.equal(aggregate.interactions,1);
  assert.equal(aggregate.observedToolCalls,2);
  assert.equal(aggregate.successfulToolCalls,1);
  assert.equal(aggregate.failedToolCalls,1);
  assert.equal(aggregate.knownUnnecessaryClarifications,1);
  assert.equal(aggregate.knownExecutableStepsPushedToHuman,2);
  assert.equal(aggregate.humanEvaluatedInteractions,1);
  assert.equal(store.list().filter(event=>event.source==="HUMAN_EVALUATED").length,1);
});

test("Lab evaluation requires a non-Human actor and explicit authorization", async () => {
  const store=createMemoryPersonalAgentQualityEvidenceStoreV010();
  store.append(createHostObservedQualityEvidenceV010({
    eventId:"host:lab",
    interactionId:"interaction:lab",
    occurredAt:"2026-09-27T01:00:00.000Z",
    principalSubjectId:"alice",
    context:personalRef,
    observations:[{ok:true}]
  }));
  const handler=createPersonalAgentQualityEvaluationActionHandlerV010({
    store,
    resolveAuthorizationProvider:()=>allowProvider(),
    id:()=> "lab"
  });

  const humanAttempt=await handler.execute(request(
    "enterprise-agent.quality.evaluate",
    {
      itemId:"interaction:lab",
      evaluationSource:"LAB_EVALUATED",
      targetSubjectId:"alice",
      completionVerified:"YES"
    }
  ),requestContext);
  assert.equal(humanAttempt.ok,false);
  assert.equal(humanAttempt.error.code,"PERSONAL_AGENT_QUALITY_LAB_ACTOR_REQUIRED");

  const labContext={
    ...requestContext,
    principal:{
      ...principal,
      subjectId:"lab:evaluator",
      actorType:"SERVICE"
    }
  };
  const labResult=await handler.execute(request(
    "enterprise-agent.quality.evaluate",
    {
      itemId:"interaction:lab",
      evaluationSource:"LAB_EVALUATED",
      targetSubjectId:"alice",
      completionVerified:"YES"
    }
  ),labContext);
  assert.equal(labResult.ok,true);
  assert.equal(store.aggregate().labEvaluatedInteractions,1);
});

test("Human quality review page is built only from real Host-observed interactions", () => {
  const store=createMemoryPersonalAgentQualityEvidenceStoreV010();
  let page=createPersonalAgentQualityReviewPageV010({
    principal,
    context:personalRef,
    store
  });
  assert.equal(page.items.length,0);

  store.append(createHostObservedQualityEvidenceV010({
    eventId:"host:review",
    interactionId:"interaction:review",
    occurredAt:"2026-09-27T01:00:00.000Z",
    principalSubjectId:"alice",
    context:personalRef,
    observations:[]
  }));
  page=createPersonalAgentQualityReviewPageV010({
    principal,
    context:personalRef,
    store
  });
  assert.equal(page.items.length,1);
  assert.equal(page.items[0].primaryAction.command,"enterprise-agent.quality.evaluate");
  assert.equal(page.items[0].fields.find(field=>field.key==="evaluationSource").value,"HUMAN_EVALUATED");
});

test("Memory quality exposes source trust, observation freshness and contradiction signals without a composite score", () => {
  const qualityStore=createMemoryContextMemoryQualityStoreV010();
  const item=memory("memory:quality",{
    observedAt:"2026-01-01T00:00:00.000Z",
    evidenceSources:[{
      contractVersion:"0.1.0",
      sourceId:"source:declared",
      sourceType:"DOCUMENT",
      trustLevel:"DECLARED"
    }]
  });
  qualityStore.append({
    contractVersion:"0.1.0",
    eventId:"contradiction:event:1",
    contradictionId:"contradiction:1",
    context:personalRef,
    leftMemoryId:"memory:quality",
    rightMemoryId:"memory:other",
    state:"OPEN",
    origin:"HUMAN",
    occurredAt:"2026-09-01T00:00:00.000Z",
    actorSubjectId:"alice"
  });

  const result=evaluateContextMemoryQualityV010({
    memory:item,
    qualityStore,
    now:new Date("2026-09-27T00:00:00.000Z"),
    freshnessWindowDays:180
  });
  assert.equal(result.evidence.trust,"DECLARED");
  assert.equal(result.freshness.state,"STALE");
  assert.equal(result.contradictions.openCount,1);
  assert.ok(result.signals.includes("EVIDENCE_REFS_MISSING"));
  assert.ok(result.signals.includes("OBSERVATION_STALE"));
  assert.ok(result.signals.includes("OPEN_CONTRADICTION"));
  assert.equal("score" in result,false);
});

test("accepted proposal contradiction signal creates one append-only OPEN quality contradiction", async () => {
  const qualityStore=createMemoryContextMemoryQualityStoreV010();
  const existing=memory("memory:existing");
  const acceptedMemory=memory("memory:accepted");
  const pendingProposal={
    contractVersion:"0.1.0",
    proposalId:"proposal:1",
    context:personalRef,
    state:"PENDING",
    createdAt:"2026-09-27T00:00:00.000Z",
    createdBySubjectId:"alice",
    revisions:[{
      contractVersion:"0.1.0",
      revisionId:"revision:1",
      kind:"FACT",
      summary:"new",
      evidenceRefs:[],
      evidenceQuality:"UNVERIFIED",
      reviewSignals:[{
        contractVersion:"0.1.0",
        kind:"POTENTIAL_CONTRADICTION",
        memoryId:existing.memoryId,
        summary:existing.summary
      }],
      authoredBy:"HUMAN",
      authorSubjectId:"alice",
      createdAt:"2026-09-27T00:00:00.000Z"
    }]
  };
  const acceptedProposal={
    ...pendingProposal,
    state:"ACCEPTED",
    decision:{
      contractVersion:"0.1.0",
      decision:"ACCEPTED",
      decidedAt:"2026-09-27T01:00:00.000Z",
      decidedBySubjectId:"alice",
      acceptedMemoryId:acceptedMemory.memoryId
    }
  };
  const service={
    get(){return pendingProposal;},
    async accept(){return {proposal:acceptedProposal,memory:acceptedMemory};}
  };
  const handlers=createContextMemoryProposalActionHandlersV010({
    service,
    qualityStore,
    resolveAuthorizationProvider:()=>allowProvider(),
    resolveRelationshipProvider:()=>undefined,
    listAvailableContexts:()=>[personalRef],
    resolveContext:()=>requestContext.context,
    now:()=>new Date("2026-09-27T01:00:00.000Z"),
    id:(()=>{let n=0;return()=>String(++n);})()
  });
  const accept=handlers.find(handler=>handler.commandCode==="context.memory.proposal.accept");
  const result=await accept.execute(request(
    "context.memory.proposal.accept",
    {itemId:"proposal:1"},
    true
  ),requestContext);
  assert.equal(result.ok,true);
  const contradictions=qualityStore.listContradictionsForContext(personalRef);
  assert.equal(contradictions.length,1);
  assert.equal(contradictions[0].state,"OPEN");
  assert.equal(contradictions[0].origin,"PROPOSAL_REVIEW");
  assert.deepEqual(
    new Set([contradictions[0].leftMemoryId,contradictions[0].rightMemoryId]),
    new Set(["memory:accepted","memory:existing"])
  );
});

test("contradiction resolution requires confirmation and never rewrites immutable Memory", async () => {
  const left=memory("memory:left");
  const right=memory("memory:right");
  const memoryStore=createMemoryContextMemoryStoreV010({
    contractVersion:"0.1.0",
    items:[left,right]
  });
  const qualityStore=createMemoryContextMemoryQualityStoreV010();
  qualityStore.append({
    contractVersion:"0.1.0",
    eventId:"open:1",
    contradictionId:"contradiction:resolve",
    context:personalRef,
    leftMemoryId:left.memoryId,
    rightMemoryId:right.memoryId,
    state:"OPEN",
    origin:"HUMAN",
    occurredAt:"2026-09-27T00:00:00.000Z",
    actorSubjectId:"alice"
  });
  const before=memoryStore.snapshot();
  const handler=createContextMemoryQualityActionHandlerV010({
    memoryStore,
    qualityStore,
    resolveAuthorizationProvider:()=>allowProvider(),
    resolveRelationshipProvider:()=>undefined,
    now:()=>new Date("2026-09-27T02:00:00.000Z"),
    id:()=> "resolve"
  });

  const denied=await handler.execute(request(
    "context.memory.quality.contradiction.resolve",
    {itemId:"contradiction:resolve",resolution:"BOTH_VALID",reason:"Different periods"},
    false,
    "resolve-contradiction"
  ),requestContext);
  assert.equal(denied.ok,false);
  assert.equal(denied.error.code,"MATERIAL_WRITE_CONFIRMATION_REQUIRED");

  const resolved=await handler.execute(request(
    "context.memory.quality.contradiction.resolve",
    {itemId:"contradiction:resolve",resolution:"BOTH_VALID",reason:"Different periods"},
    true,
    "resolve-contradiction"
  ),requestContext);
  assert.equal(resolved.ok,true);
  assert.equal(qualityStore.contradiction("contradiction:resolve").state,"RESOLVED");
  assert.equal(qualityStore.contradiction("contradiction:resolve").resolution,"BOTH_VALID");
  assert.deepEqual(memoryStore.snapshot(),before);
});

test("Memory quality and contradiction review surfaces use formal governance actions", () => {
  const left=memory("memory:left-ui");
  const right=memory("memory:right-ui");
  const memoryStore=createMemoryContextMemoryStoreV010({
    contractVersion:"0.1.0",
    items:[left,right]
  });
  const qualityStore=createMemoryContextMemoryQualityStoreV010();
  qualityStore.append({
    contractVersion:"0.1.0",
    eventId:"open:ui",
    contradictionId:"contradiction:ui",
    context:personalRef,
    leftMemoryId:left.memoryId,
    rightMemoryId:right.memoryId,
    state:"OPEN",
    origin:"HUMAN",
    occurredAt:"2026-09-27T00:00:00.000Z",
    actorSubjectId:"alice"
  });
  const page=createMemoryQualityPageV010({
    principal,
    personalContext,
    context:personalRef,
    memoryStore,
    qualityStore,
    now:new Date("2026-09-27T00:00:00.000Z")
  });
  assert.equal(page.items[0].primaryAction.route,"/memory/quality/contradictions");

  const review=createMemoryContradictionReviewPageV010({
    principal,
    personalContext,
    context:personalRef,
    memoryStore,
    qualityStore
  });
  assert.equal(review.items.length,1);
  assert.equal(review.items[0].primaryAction.command,"context.memory.quality.contradiction.resolve");
  assert.equal(review.items[0].primaryAction.requiresConfirmation,true);
  assert.equal(review.items[0].secondaryActions[0].id,"dismiss-contradiction");
});
