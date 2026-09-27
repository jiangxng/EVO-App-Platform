import test from "node:test";
import assert from "node:assert/strict";

import {
  createHostObservedQualityEvidenceV010,
  createEvaluatedQualityEvidenceV010
} from "../../dist/agents/enterprise-agent/quality-evidence-store.js";
import {
  createPersonalAgentQualityTrendWindowsV010
} from "../../dist/agents/enterprise-agent/quality-trends.js";
import {
  createMemoryContextMemoryFreshnessPolicyStoreV010
} from "../../dist/manager/context-memory-freshness-policy-store.js";
import {
  createContextMemoryFreshnessPolicyActionHandlersV010
} from "../../dist/manager/context-memory-freshness-policy-actions.js";
import {
  createMemoryContextMemoryQualityStoreV010
} from "../../dist/manager/context-memory-quality-store.js";
import {
  createContextMemoryQualityActionHandlerV010
} from "../../dist/manager/context-memory-quality-actions.js";
import {
  createMemoryContextMemoryStoreV010
} from "../../dist/manager/context-memory-store.js";
import {
  createMemoryPersonalAgentFollowUpStoreV010
} from "../../dist/manager/personal-agent-follow-up-store.js";
import {
  createPersonalAgentFollowUpActionHandlersV010
} from "../../dist/manager/personal-agent-follow-up-actions.js";
import {
  createPersonalAgentFollowUpPageV010
} from "../../dist/manager/personal-agent-follow-up-page.js";
import {
  createMemoryQualityPageV010,
  createMemoryFreshnessPolicyFormV010,
  createMemoryFreshnessPoliciesPageV010
} from "../../dist/manager/memory-governance-page.js";
import {
  createPersonalAgentChatPageV020
} from "../../dist/manager/personal-agent-experience.js";
import {
  createEnterpriseAgentHostToolCatalogV010
} from "../../dist/agents/enterprise-agent/host-tool-catalog.js";

const personalRef={
  contractVersion:"0.1.0",
  kind:"PERSONAL",
  contextId:"personal:alice"
};
const personalContext={
  contractVersion:"0.1.0",
  kind:"PERSONAL",
  contextId:"personal:alice",
  ownerSubjectId:"alice",
  displayName:"Alice"
};
const resolvedContext={
  contractVersion:"0.1.0",
  personalContext,
  activeContext:personalRef
};
const principal={
  contractVersion:"0.1.0",
  subjectId:"alice",
  actorType:"HUMAN",
  identityProviderId:"test"
};
const requestContext={
  contractVersion:"0.1.0",
  principal,
  scope:{contractVersion:"0.1.0",userId:"alice"},
  context:resolvedContext,
  correlationId:"correlation:p1.4e"
};

function request(code,values={},requiresConfirmation=false,actionId=code){
  return {
    contractVersion:"0.1.0",
    type:"command",
    command:{code,inputVersion:"0.1.0"},
    values,
    sourceInteractionId:"interaction:p1.4e",
    actionId,
    requiresConfirmation
  };
}

function allowProvider(){
  return {
    providerId:"allow",
    check(){
      return {
        contractVersion:"0.1.0",
        allowed:true,
        policyProviderId:"allow",
        reasonCodes:["ALLOW"]
      };
    }
  };
}

function memory(id,{kind="FACT",observedAt="2026-08-01T00:00:00.000Z"}={}){
  return {
    contractVersion:"0.1.0",
    memoryId:id,
    context:personalRef,
    kind,
    summary:id,
    provenance:{
      contractVersion:"0.1.0",
      origin:"DIRECT",
      sourceContext:personalRef,
      evidenceRefs:["evidence:"+id],
      evidenceSources:[{
        contractVersion:"0.1.0",
        sourceId:"source:"+id,
        sourceType:"DOCUMENT",
        trustLevel:"HOST_VERIFIED"
      }]
    },
    attribution:{
      contractVersion:"0.1.0",
      recordedBySubjectId:"alice",
      recordedByActorType:"HUMAN",
      recordedAt:"2026-09-01T00:00:00.000Z"
    },
    observedAt
  };
}

test("quality trends cohort by Host interaction time, not later evaluation time",()=>{
  const events=[];
  for(let i=0;i<5;i++){
    const previous=createHostObservedQualityEvidenceV010({
      eventId:"host:previous:"+i,
      interactionId:"previous:"+i,
      occurredAt:"2026-09-15T12:00:00.000Z",
      principalSubjectId:"alice",
      context:personalRef,
      observations:[{ok:true},{ok:i!==0}]
    });
    events.push(previous);
    events.push(createEvaluatedQualityEvidenceV010({
      eventId:"human:previous:"+i,
      interactionId:previous.interactionId,
      occurredAt:"2026-09-26T12:00:00.000Z",
      principalSubjectId:"alice",
      context:personalRef,
      source:"HUMAN_EVALUATED",
      hostEvidence:previous.evidence,
      subjective:{
        completionVerified:false,
        clarificationAsked:true,
        clarificationWasNecessary:false
      }
    }));

    const current=createHostObservedQualityEvidenceV010({
      eventId:"host:current:"+i,
      interactionId:"current:"+i,
      occurredAt:"2026-09-25T12:00:00.000Z",
      principalSubjectId:"alice",
      context:personalRef,
      observations:[{ok:true},{ok:true}]
    });
    events.push(current);
    events.push(createEvaluatedQualityEvidenceV010({
      eventId:"human:current:"+i,
      interactionId:current.interactionId,
      occurredAt:"2026-09-26T13:00:00.000Z",
      principalSubjectId:"alice",
      context:personalRef,
      source:"HUMAN_EVALUATED",
      hostEvidence:current.evidence,
      subjective:{
        completionVerified:true,
        clarificationAsked:false,
        clarificationWasNecessary:true
      }
    }));
  }

  const windows=createPersonalAgentQualityTrendWindowsV010({
    events,
    now:new Date("2026-09-27T00:00:00.000Z")
  });
  const seven=windows.find(window=>window.windowDays===7);
  assert.equal(seven.current.interactions,5);
  assert.equal(seven.previous.interactions,5);
  assert.equal(seven.current.humanEvaluatedInteractions,5);
  assert.equal(seven.previous.humanEvaluatedInteractions,5);
  assert.equal(seven.metrics.verifiedCompletionRate.comparable,true);
  assert.equal(seven.metrics.verifiedCompletionRate.current,1);
  assert.equal(seven.metrics.verifiedCompletionRate.previous,0);
  assert.equal(seven.metrics.verifiedCompletionRate.delta,1);
  assert.equal(seven.metrics.unnecessaryClarificationRate.current,0);
  assert.equal(seven.metrics.unnecessaryClarificationRate.previous,1);
  assert.equal("score" in seven,false);
});

test("quality trend comparison stays unavailable when evidence volume is below explicit thresholds",()=>{
  const host=createHostObservedQualityEvidenceV010({
    eventId:"host:small",
    interactionId:"small",
    occurredAt:"2026-09-26T00:00:00.000Z",
    principalSubjectId:"alice",
    context:personalRef,
    observations:[{ok:true}]
  });
  const seven=createPersonalAgentQualityTrendWindowsV010({
    events:[host],
    now:new Date("2026-09-27T00:00:00.000Z")
  }).find(window=>window.windowDays===7);
  assert.equal(seven.metrics.toolSuccessRate.comparable,false);
  assert.equal(
    seven.metrics.toolSuccessRate.reason,
    "INSUFFICIENT_INTERACTIONS"
  );
});

test("freshness policy precedence is kind-specific first, then shortest window at the same specificity",()=>{
  const store=createMemoryContextMemoryFreshnessPolicyStoreV010();
  store.append({
    contractVersion:"0.1.0",
    eventId:"generic:1",
    policyId:"generic",
    context:personalRef,
    state:"ACTIVE",
    freshnessWindowDays:30,
    occurredAt:"2026-01-01T00:00:00.000Z",
    actorSubjectId:"alice"
  });
  store.append({
    contractVersion:"0.1.0",
    eventId:"fact:90",
    policyId:"fact-90",
    context:personalRef,
    state:"ACTIVE",
    freshnessWindowDays:90,
    kinds:["FACT"],
    occurredAt:"2026-01-02T00:00:00.000Z",
    actorSubjectId:"alice"
  });
  store.append({
    contractVersion:"0.1.0",
    eventId:"fact:45",
    policyId:"fact-45",
    context:personalRef,
    state:"ACTIVE",
    freshnessWindowDays:45,
    kinds:["FACT"],
    occurredAt:"2026-01-03T00:00:00.000Z",
    actorSubjectId:"alice"
  });

  assert.equal(store.freshnessWindowDays(memory("memory:fact")),45);
  assert.equal(
    store.freshnessWindowDays(memory("memory:claim",{kind:"CLAIM"})),
    30
  );

  store.append({
    contractVersion:"0.1.0",
    eventId:"fact:45:retired",
    policyId:"fact-45",
    context:personalRef,
    state:"RETIRED",
    freshnessWindowDays:45,
    kinds:["FACT"],
    occurredAt:"2026-02-01T00:00:00.000Z",
    actorSubjectId:"alice"
  });
  assert.equal(store.freshnessWindowDays(memory("memory:fact-2")),90);
});

test("freshness policy mutation is Human-governed, confirmed and append-only",async()=>{
  const store=createMemoryContextMemoryFreshnessPolicyStoreV010();
  let n=0;
  const handlers=createContextMemoryFreshnessPolicyActionHandlersV010({
    store,
    resolveAuthorizationProvider:()=>allowProvider(),
    resolveRelationshipProvider:()=>undefined,
    now:()=>new Date("2026-09-27T00:00:00.000Z"),
    id:()=>String(++n)
  });
  const set=handlers.find(handler=>
    handler.commandCode==="context.memory.quality.freshness-policy.set"
  );
  const denied=await set.execute(request(
    "context.memory.quality.freshness-policy.set",
    {
      policyId:"fact-policy",
      freshnessWindowDays:90,
      kinds:"FACT"
    },
    false
  ),requestContext);
  assert.equal(denied.ok,false);
  assert.equal(denied.error.code,"MATERIAL_WRITE_CONFIRMATION_REQUIRED");

  const accepted=await set.execute(request(
    "context.memory.quality.freshness-policy.set",
    {
      policyId:"fact-policy",
      freshnessWindowDays:90,
      kinds:"FACT",
      reason:"Facts need quarterly verification."
    },
    true
  ),requestContext);
  assert.equal(accepted.ok,true);
  assert.equal(store.snapshot().events.length,1);
  assert.equal(store.effectiveForContext(personalRef)[0].freshnessWindowDays,90);

  const retire=handlers.find(handler=>
    handler.commandCode==="context.memory.quality.freshness-policy.retire"
  );
  const retired=await retire.execute(request(
    "context.memory.quality.freshness-policy.retire",
    {itemId:"fact-policy"},
    true
  ),requestContext);
  assert.equal(retired.ok,true);
  assert.equal(store.snapshot().events.length,2);
  assert.equal(store.effectiveForContext(personalRef).length,0);
});

test("Memory Quality uses effective freshness policy instead of the fallback window",()=>{
  const memoryStore=createMemoryContextMemoryStoreV010({
    contractVersion:"0.1.0",
    items:[memory("memory:policy-driven")]
  });
  const qualityStore=createMemoryContextMemoryQualityStoreV010();
  const policies=createMemoryContextMemoryFreshnessPolicyStoreV010({
    contractVersion:"0.1.0",
    events:[
      {
        contractVersion:"0.1.0",
        eventId:"generic:30",
        policyId:"generic",
        context:personalRef,
        state:"ACTIVE",
        freshnessWindowDays:30,
        occurredAt:"2026-01-01T00:00:00.000Z",
        actorSubjectId:"alice"
      },
      {
        contractVersion:"0.1.0",
        eventId:"fact:90",
        policyId:"fact",
        context:personalRef,
        state:"ACTIVE",
        freshnessWindowDays:90,
        kinds:["FACT"],
        occurredAt:"2026-01-02T00:00:00.000Z",
        actorSubjectId:"alice"
      }
    ]
  });
  const page=createMemoryQualityPageV010({
    principal,
    personalContext,
    context:personalRef,
    memoryStore,
    qualityStore,
    freshnessPolicies:policies,
    now:new Date("2026-09-27T00:00:00.000Z")
  });
  const item=page.items.find(value=>value.id==="memory:policy-driven");
  assert.equal(item.metadata.freshnessWindowDays,90);
  assert.ok(item.badges.includes("FRESH"));
});

test("freshness policy Eidos flow uses formal UIDL confirmation and governed retirement",()=>{
  const form=createMemoryFreshnessPolicyFormV010();
  assert.equal(form.command.code,"context.memory.quality.freshness-policy.set");
  assert.equal(form.actions[0].requiresConfirmation,true);

  const policies=createMemoryContextMemoryFreshnessPolicyStoreV010({
    contractVersion:"0.1.0",
    events:[{
      contractVersion:"0.1.0",
      eventId:"p:1",
      policyId:"policy:1",
      context:personalRef,
      state:"ACTIVE",
      freshnessWindowDays:60,
      kinds:["FACT"],
      occurredAt:"2026-09-27T00:00:00.000Z",
      actorSubjectId:"alice"
    }]
  });
  const page=createMemoryFreshnessPoliciesPageV010({
    principal,
    personalContext,
    context:personalRef,
    policies
  });
  const item=page.items.find(value=>value.id==="policy:1");
  assert.equal(
    item.secondaryActions[0].command,
    "context.memory.quality.freshness-policy.retire"
  );
  assert.equal(item.secondaryActions[0].requiresConfirmation,true);
});

test("resolved contradiction creates a planning-only Personal Agent follow-up after governance succeeds",async()=>{
  const left=memory("memory:left");
  const right=memory("memory:right");
  const memoryStore=createMemoryContextMemoryStoreV010({
    contractVersion:"0.1.0",
    items:[left,right]
  });
  const qualityStore=createMemoryContextMemoryQualityStoreV010();
  qualityStore.append({
    contractVersion:"0.1.0",
    eventId:"open:follow-up",
    contradictionId:"contradiction:follow-up",
    context:personalRef,
    leftMemoryId:left.memoryId,
    rightMemoryId:right.memoryId,
    state:"OPEN",
    origin:"HUMAN",
    occurredAt:"2026-09-27T00:00:00.000Z",
    actorSubjectId:"alice"
  });
  const followUps=createMemoryPersonalAgentFollowUpStoreV010();
  let n=0;
  const handler=createContextMemoryQualityActionHandlerV010({
    memoryStore,
    qualityStore,
    followUpStore:followUps,
    resolveAuthorizationProvider:()=>allowProvider(),
    resolveRelationshipProvider:()=>undefined,
    now:()=>new Date("2026-09-27T01:00:00.000Z"),
    id:()=>String(++n)
  });
  const before=memoryStore.snapshot();
  const result=await handler.execute(request(
    "context.memory.quality.contradiction.resolve",
    {
      itemId:"contradiction:follow-up",
      resolution:"PREFER_LEFT",
      reason:"Left reflects the current process."
    },
    true,
    "resolve-contradiction"
  ),requestContext);

  assert.equal(result.ok,true);
  assert.equal(
    qualityStore.contradiction("contradiction:follow-up").state,
    "RESOLVED"
  );
  assert.deepEqual(memoryStore.snapshot(),before);
  const open=followUps.listOpen("alice",personalRef);
  assert.equal(open.length,1);
  assert.equal(open[0].kind,"REVIEW_PREFERRED_MEMORY");
  assert.match(open[0].instruction,/prepare a new Memory Proposal/i);
  assert.match(open[0].instruction,/do not rewrite/i);
});

test("follow-up storage failure never rolls back an already valid contradiction resolution",async()=>{
  const left=memory("memory:left-failure");
  const right=memory("memory:right-failure");
  const memoryStore=createMemoryContextMemoryStoreV010({
    contractVersion:"0.1.0",
    items:[left,right]
  });
  const qualityStore=createMemoryContextMemoryQualityStoreV010();
  qualityStore.append({
    contractVersion:"0.1.0",
    eventId:"open:failure",
    contradictionId:"contradiction:failure",
    context:personalRef,
    leftMemoryId:left.memoryId,
    rightMemoryId:right.memoryId,
    state:"OPEN",
    origin:"HUMAN",
    occurredAt:"2026-09-27T00:00:00.000Z",
    actorSubjectId:"alice"
  });
  const brokenFollowUpStore={
    findBySource(){return undefined;},
    append(){throw new Error("FOLLOW_UP_STORAGE_UNAVAILABLE");},
    get(){return undefined;}
  };
  const handler=createContextMemoryQualityActionHandlerV010({
    memoryStore,
    qualityStore,
    followUpStore:brokenFollowUpStore,
    resolveAuthorizationProvider:()=>allowProvider(),
    resolveRelationshipProvider:()=>undefined,
    now:()=>new Date("2026-09-27T01:00:00.000Z"),
    id:()=> "failure"
  });
  const result=await handler.execute(request(
    "context.memory.quality.contradiction.resolve",
    {
      itemId:"contradiction:failure",
      resolution:"OTHER",
      reason:"Human resolution."
    },
    true,
    "resolve-contradiction"
  ),requestContext);
  assert.equal(result.ok,true);
  assert.equal(
    qualityStore.contradiction("contradiction:failure").state,
    "RESOLVED"
  );
  assert.match(result.result.followUpCreationError,/FOLLOW_UP_STORAGE_UNAVAILABLE/);
});

test("Personal Agent follow-up appears in queue, chat suggestion and read-only Agent tool",async()=>{
  const store=createMemoryPersonalAgentFollowUpStoreV010();
  store.append({
    contractVersion:"0.1.0",
    eventId:"follow-up:event:1",
    followUpId:"follow-up:1",
    principalSubjectId:"alice",
    context:personalRef,
    state:"OPEN",
    kind:"CLARIFY_MEMORY_CONTEXT",
    sourceType:"MEMORY_CONTRADICTION",
    sourceId:"contradiction:1",
    title:"Clarify both valid Memory records",
    instruction:"Review both records and propose contextual knowledge if needed.",
    relatedMemoryIds:["memory:a","memory:b"],
    occurredAt:"2026-09-27T00:00:00.000Z",
    actorSubjectId:"alice"
  });

  const page=createPersonalAgentFollowUpPageV010({
    principal,
    context:personalRef,
    store
  });
  assert.equal(page.items.length,1);
  assert.equal(page.items[0].primaryAction.route,"/enterprise-agent");

  const readiness={
    contractVersion:"0.1.0",
    state:"ready",
    code:"READY",
    message:"Personal Agent is ready.",
    active:true,
    providerId:"test",
    installedProviderPackageIds:[],
    catalogProviderPackageIds:[]
  };
  const chat=createPersonalAgentChatPageV020(
    readiness,
    resolvedContext,
    [{ref:personalRef,label:"Alice"}],
    store.listOpen("alice",personalRef)
  );
  assert.equal(chat.emptyState.suggestions[0].id,"follow-up:follow-up:1");
  assert.match(chat.emptyState.suggestions[0].prompt,/personal_follow_up_list/);

  const manager={
    getSnapshot(){return {contractVersion:"0.1.0",installedPackages:[],activeFeatures:[],effectiveCapabilities:[]};},
    listCatalog(){return [];},
    listEffectiveServiceProviders(){return [];}
  };
  const catalog=createEnterpriseAgentHostToolCatalogV010({
    manager,
    principal,
    context:resolvedContext,
    listAvailableContexts(){return [personalRef];},
    listProviderBindings(){return [];},
    getProviderHealth(){return {state:"UNKNOWN"};},
    listPersonalFollowUps(){return store.listOpen("alice",personalRef);},
    searchHelp(){return [];}
  });
  const tools=await catalog.list();
  assert.ok(tools.some(tool=>tool.id==="personal.follow-up.list"));
  const observation=await catalog.invoke({
    tool:"personal.follow-up.list",
    arguments:{}
  },[]);
  assert.equal(observation.ok,true);
  assert.equal(observation.result[0].followUpId,"follow-up:1");
});

test("follow-up completion is self-scoped planning state and does not require material-write confirmation",async()=>{
  const store=createMemoryPersonalAgentFollowUpStoreV010();
  store.append({
    contractVersion:"0.1.0",
    eventId:"follow-up:event:complete",
    followUpId:"follow-up:complete",
    principalSubjectId:"alice",
    context:personalRef,
    state:"OPEN",
    kind:"REVIEW_MEMORY_RESOLUTION",
    sourceType:"MEMORY_CONTRADICTION",
    sourceId:"contradiction:complete",
    title:"Review resolution",
    instruction:"Review the Human resolution.",
    relatedMemoryIds:["memory:a","memory:b"],
    occurredAt:"2026-09-27T00:00:00.000Z",
    actorSubjectId:"alice"
  });
  const handlers=createPersonalAgentFollowUpActionHandlersV010({
    store,
    now:()=>new Date("2026-09-27T02:00:00.000Z"),
    id:()=> "complete"
  });
  const complete=handlers.find(handler=>
    handler.commandCode==="enterprise-agent.follow-up.complete"
  );
  const result=await complete.execute(request(
    "enterprise-agent.follow-up.complete",
    {itemId:"follow-up:complete"},
    false
  ),requestContext);
  assert.equal(result.ok,true);
  assert.equal(store.get("follow-up:complete").state,"COMPLETED");
  assert.equal(store.listOpen("alice",personalRef).length,0);
});
