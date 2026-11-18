import test from "node:test";
import assert from "node:assert/strict";
import { presentPersonalAgentReplyV020 } from
  "../../dist/agents/enterprise-agent/reply-presentation.js";
import { renderChatMessageToHtml } from
  "../../dist/vendor/eidos/src/chat/index.js";
import { createEnterpriseAgentRuntime } from
  "../../dist/agents/enterprise-agent/runtime.js";
import { createProviderBackedAgentModel } from
  "../../dist/agents/enterprise-agent/provider-model.js";
import { createEnterpriseAgentHostToolCatalogV010 } from
  "../../dist/agents/enterprise-agent/host-tool-catalog.js";
import { parseCounterpartyProjectionRouteQueryV010 } from
  "../../dist/apps/counterparty/projection-query.js";
import { parseBusinessDictionaryDirectoryRouteV010 } from
  "../../dist/apps/business-dictionary/directory-query.js";
import { COUNTERPARTY_MY_SUPPLIERS_ROUTE } from
  "../../dist/apps/counterparty/constants.js";
import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppActionRouter } from "../../dist/actions/router.js";
import { createCapabilityOperationActionPreExecuteV010 } from
  "../../dist/manager/capability-operation-access.js";
import {
  createPersonalAgentCapabilityToolRegistrationsV010,
  PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID,
  PERSONAL_AGENT_COLLECTION_READ_PREVIEW_TOOL_ID,
  PERSONAL_AGENT_CAPABILITY_DESCRIBE_TOOL_ID,
  PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID
} from "../../dist/agents/enterprise-agent/capability-fabric-tools.js";
import { createHostStaticAuthorizationProviderV010 } from
  "../../dist/providers/authorization/runtime.js";
import { counterpartyAuthorizationPolicyV010 } from
  "../../dist/apps/counterparty/authorization.js";
import { businessDictionaryPackage } from "../../dist/catalog/seed.js";
import { counterpartyPackage } from "../../dist/apps/counterparty/package.js";
import { createBusinessDictionaryRepositoryV010 } from
  "../../dist/apps/business-dictionary/repository.js";
import { createBusinessDictionaryActionHandlersV010 } from
  "../../dist/apps/business-dictionary/actions.js";
import { createCounterpartyRepositoryV010 } from
  "../../dist/apps/counterparty/repository.js";
import { createCounterpartyRoleRepositoryV010 } from
  "../../dist/apps/counterparty/roles.js";
import { createResponsibilityRepositoryV010 } from
  "../../dist/apps/responsibility/repository.js";
import { createCounterpartyProjectionServiceV010 } from
  "../../dist/apps/counterparty/projection-service.js";
import { createCounterpartyProjectionActionHandlersV010 } from
  "../../dist/apps/counterparty/projection-actions.js";
import { createMemoryEnterpriseResourceRepositoryV010 } from
  "../../dist/providers/enterprise-context/resources.js";
import { COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010 } from
  "../../dist/apps/counterparty/constants.js";

const DICTIONARY_READ = "dictionary.collection.query";
const ENT_A = "enterprise-context:a";
const ENT_B = "enterprise-context:b";

/** Inert only for installation dependency capabilities. Real business owners,
 * repositories, policy and ActionHost are used below, not simulated results. */
const supportingCapabilities = {
  contractVersion: "0.1.0", packageId: "test-cv02-host-dependencies",
  displayName: "Isolated Host Capability Dependencies", version: "0.1.0",
  type: "PLATFORM_PROVIDER",
  features: [{
    contractVersion: "0.1.0", featureId: "test-cv02-host-dependencies.default",
    packageId: "test-cv02-host-dependencies",version: "0.1.0",
    activationScope: "INSTALLATION",defaultActivation: true,
    providesCapabilities: [
      "enterprise.resource.repository","enterprise.directory","enterprise.responsibility"
    ],
    contributions: []
  }]
};

function context(enterpriseId="ent-a", actorType="HUMAN") {
  const current = enterpriseId === "ent-a" ? ENT_A : ENT_B;
  return {
    contractVersion:"0.1.0",correlationId:"cv02-agent-owner-read",
    principal:{contractVersion:"0.1.0",subjectId:"seller-a",actorType,
      identityProviderId:"test.identity",sessionId:"session-a"},
    scope:{contractVersion:"0.1.0",enterpriseId,userId:"seller-a"},
    context:{
      contractVersion:"0.1.0",
      personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
        contextId:"personal:seller-a",ownerSubjectId:"seller-a"},
      activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
        contextId:current,enterpriseId}
    }
  };
}
function request(command,values) {
  return {contractVersion:"0.1.0",type:"command",
    command:{code:command,inputVersion:"0.1.0"},values,
    sourceInteractionId:"cv02-human-read",actionId:command,requiresConfirmation:false};
}
const reg = (regs,id) => {
  const r = regs.find(x=>x.descriptor.id===id);
  assert.ok(r,"missing Personal Agent operation "+id);
  return r;
};
const options=[{code:"A",label:{default:"Internal"},status:"ACTIVE"}];
function setup() {
  const resources=createMemoryEnterpriseResourceRepositoryV010();
  const dictionary=createBusinessDictionaryRepositoryV010(resources);
  for(const [contextId,dictionaryId,state] of [
    [ENT_A,"supplier-category","PUBLISHED"],
    [ENT_A,"internal-draft","DRAFT"],
    [ENT_B,"other-enterprise-only","PUBLISHED"]
  ]) {
    const saved=dictionary.saveDraft({contextId,dictionaryId,
      displayName:dictionaryId,expectedVersion:0,options,
      actorSubjectId:"owner-a",recordedAt:"2026-11-09T00:00:00.000Z"});
    if(state==="PUBLISHED")dictionary.publish({contextId,dictionaryId,
      expectedVersion:saved.version,actorSubjectId:"owner-a",actorType:"HUMAN",
      recordedAt:"2026-11-09T00:00:01.000Z"});
  }
  const counterparty=createCounterpartyRepositoryV010(resources);
  const roles=createCounterpartyRoleRepositoryV010(resources,counterparty);
  const responsibilities=createResponsibilityRepositoryV010(resources);
  for(const [id,assignee] of [["supplier-hk","seller-a"],["supplier-other","someone-else"]]) {
    counterparty.save({contextId:ENT_A,
      subject:{contractVersion:"0.1.0",counterpartyId:id,
        code:id.toUpperCase(),displayName:id==="supplier-hk"?"Hong Kong Supplier":"Other Supplier",
        subjectType:"ORGANIZATION",status:"ACTIVE"},
      actorSubjectId:"owner-a",recordedAt:"2026-11-09T00:01:00.000Z"});
    roles.assign({contextId:ENT_A,counterpartyId:id,roleCode:"SUPPLIER",
      actorSubjectId:"owner-a",recordedAt:"2026-11-09T00:01:01.000Z"});
    responsibilities.assign({contextId:ENT_A,
      targetRef:{objectType:"counterparty.subject",objectId:id},
      responsibilityType:"PROCUREMENT_OWNER",
      assigneeRef:{kind:"PRINCIPAL",id:assignee},
      effectiveFrom:"2026-11-09T00:00:00.000Z",actorSubjectId:"owner-a"});
  }
  const auth=createHostStaticAuthorizationProviderV010({
    contractVersion:"0.1.0",
    rules:[
      ...counterpartyAuthorizationPolicyV010.rules,
      {id:"cv02-dictionary-owner-read",effect:"ALLOW",
        actions:["dictionary.read"],actorTypes:["HUMAN","AI"],
        resourceTypes:["business-dictionary.definition"],scope:{enterpriseId:"ent-a"}}
    ]
  });
  const manager=createAppManagerService(
    createPackageCatalog([supportingCapabilities,businessDictionaryPackage,counterpartyPackage]),
    createMemoryLifecycleStore()
  );
  manager.install(businessDictionaryPackage.packageId);
  manager.install(counterpartyPackage.packageId);
  const projectionService=createCounterpartyProjectionServiceV010({
    repository:counterparty,roleRepository:roles,responsibilityRepository:responsibilities,
    resolveAuthorizationProvider:()=>auth,
    fieldIds:()=>["displayName","code","subjectType"]
  });
  const handlers=[
    ...createBusinessDictionaryActionHandlersV010({
      repository:dictionary,
      canRead:(principal,contextId)=>principal.subjectId==="seller-a" && contextId===ENT_A,
      canManage:()=>false
    }),
    ...createCounterpartyProjectionActionHandlersV010({
      service:projectionService,resolveEnterpriseRelationshipKind:()=> "MEMBER"
    })
  ];
  const router=createAppActionRouter(handlers,
    featureId=>manager.getSnapshot().activeFeatures.some(x=>x.featureId===featureId),
    createCapabilityOperationActionPreExecuteV010({
      manager,resolveAuthorizationProvider:()=>auth
    })
  );
  const agent=contextInput=>createPersonalAgentCapabilityToolRegistrationsV010({
    manager,actionRouter:router,requestContext:contextInput,
    resolveAuthorizationProvider:()=>auth
  });
  return {manager,router,agent,dictionary,counterparty};
}

test("CV-02 actual Personal Agent discovers, describes and executes dictionary READ through Host",async()=>{
  const {manager,router,agent}=setup();
  const regs=agent(context());
  const searched=await reg(regs,PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID)
    .execute({query:"dictionary"},[]);
  assert.ok(searched.items.some(x=>x.operationId===DICTIONARY_READ));
  const described=await reg(regs,PERSONAL_AGENT_CAPABILITY_DESCRIBE_TOOL_ID)
    .execute({operationId:DICTIONARY_READ},[]);
  assert.deepEqual(described.operation.inputSchema.properties.view.enum,
    ["all","draft","published"]);
  const query={view:"published",sort:"displayName",page:0,pageSize:25};
  const human=await router.execute(request(DICTIONARY_READ,query),context());
  const ai=await reg(regs,PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID)
    .execute({operationId:DICTIONARY_READ,input:query},[]);
  assert.equal(human.ok,true);
  assert.deepEqual(
    ai.result.data.rows.map(x=>x.rowId),
    human.result.data.rows.map(x=>x.rowId)
  );
  assert.deepEqual(ai.result.data.rows.map(x=>x.rowId),["supplier-category"]);
  assert.equal(ai.result.data.pageInfo.total,1);
  assert.equal(JSON.stringify(ai).includes("other-enterprise-only"),false);
  assert.equal(JSON.stringify(ai).includes("Internal"),false,
    "dictionary option text must not leak into directory Collection READ");
  await assert.rejects(
    ()=>reg(regs,PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID)
      .execute({operationId:DICTIONARY_READ,input:{view:"hidden"}},[]),
    /COLLECTION_VIEW_INVALID|BUSINESS_DICTIONARY_COLLECTION_VIEW_INVALID|CAPABILITY_OPERATION_INPUT/
  );
  assert.ok(manager.getSnapshot().activeFeatures.some(
    x=>x.featureId===businessDictionaryPackage.features[0].featureId));
});

test("CV-02 actual Personal Agent reads My Suppliers with domain responsibility and field grants",async()=>{
  const {router,agent}=setup();
  const query={search:"Supplier",sort:"displayName",page:0,pageSize:25};
  const h=await router.execute(request(COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010,query),context());
  const a=await reg(agent(context()),PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID)
    .execute({operationId:COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010,input:query},[]);
  assert.equal(h.ok,true);
  assert.deepEqual(a.result.rows,h.result.rows);
  assert.deepEqual(a.result.rows.map(x=>x.rowId),["supplier-hk"]);
  assert.equal(a.result.pageInfo.total,1);
  assert.equal(JSON.stringify(a.result).includes("supplier-other"),false);
  assert.equal(a.result.readableFieldIds.includes("email"),false);
});

test("CV-02 agent denies enterprise-switch, disabled plugin and missing authorization",async()=>{
  const {manager,agent}=setup();
  const other=agent(context("ent-b"));
  const searched=await reg(other,PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID)
    .execute({query:"dictionary"},[]);
  assert.equal(searched.items.some(x=>x.operationId===DICTIONARY_READ),false);
  await assert.rejects(
    ()=>reg(other,PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID)
      .execute({operationId:DICTIONARY_READ,input:{view:"published"}},[]),
    /PERSONAL_AGENT_CAPABILITY_NOT_AVAILABLE/
  );
  const regs=agent(context());
  manager.disable(businessDictionaryPackage.packageId);
  const after=await reg(regs,PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID)
    .execute({query:"dictionary"},[]);
  assert.equal(after.items.some(x=>x.operationId===DICTIONARY_READ),false);
  await assert.rejects(
    ()=>reg(regs,PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID)
      .execute({operationId:DICTIONARY_READ,input:{}},[]),
    /PERSONAL_AGENT_CAPABILITY_NOT_AVAILABLE/
  );
});

test("CV-05 Personal Agent previews real My Suppliers Owner READ with safe Eidos navigation",async()=>{
  const {router,agent}=setup();
  const query={search:"Supplier",subjectType:"ORGANIZATION",
    sort:"displayName",direction:"asc",page:0,pageSize:25};
  const human=await router.execute(request(COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010,query),context());
  assert.equal(human.ok,true,JSON.stringify(human.error));
  const preview=await reg(agent(context()),PERSONAL_AGENT_COLLECTION_READ_PREVIEW_TOOL_ID)
    .execute({operationId:COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010,input:query},[]);
  assert.equal(preview.kind,"evo.personal-agent-collection.read-preview");
  assert.deepEqual(preview.rows,human.result.rows);
  assert.deepEqual(preview.pageInfo,human.result.pageInfo);
  assert.deepEqual(preview.rows.map(x=>x.rowId),["supplier-hk"]);
  assert.equal(JSON.stringify(preview).includes("supplier-other"),false);
  assert.equal(preview.readableFieldIds.includes("email"),false);
  assert.match(preview.navigation.route,/^\/counterparties\/my-suppliers\?/);
  assert.ok(preview.navigation.route.includes("search=Supplier"));

  const switched=reg(agent(context("ent-b")),PERSONAL_AGENT_COLLECTION_READ_PREVIEW_TOOL_ID);
  // Counterparty's policy permits a READ in B, but B contains no A-owned
  // records. Unlike Dictionary's enterprise-specific grant, this is an
  // authorized empty projection, not a Capability discovery denial.
  const otherPreview=await switched.execute({
    operationId:COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010,input:query
  },[]);
  assert.deepEqual(otherPreview.rows,[]);
  assert.equal(otherPreview.pageInfo.total,0);
  await assert.rejects(()=>reg(agent(context()),PERSONAL_AGENT_COLLECTION_READ_PREVIEW_TOOL_ID)
    .execute({operationId:COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010,
      input:{sort:"email",page:0}},[]),
  /CAPABILITY_OPERATION_INPUT|COUNTERPARTY_QUERY_SORT_INVALID|COUNTERPARTY_QUERY_SORT_FORBIDDEN/);
});

test("CV-05 real My Suppliers Host READ produces a navigable Chinese Eidos chat action",async()=>{
  const {agent}=setup();
  const operationId=COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010;
  const query={search:"Supplier",sort:"displayName",page:0,pageSize:25};
  const actual=await reg(agent(context()),PERSONAL_AGENT_COLLECTION_READ_PREVIEW_TOOL_ID)
    .execute({operationId,input:query},[]);
  assert.deepEqual(actual.rows.map(row=>row.rowId),["supplier-hk"]);
  const parts=presentPersonalAgentReplyV020({
    contractVersion:"0.1.0",agentId:"enterprise-agent",message:"已找到当前有权供应商。",
    tools:[{
      id:PERSONAL_AGENT_COLLECTION_READ_PREVIEW_TOOL_ID,
      title:"Preview authorized Collection",
      ownerPackageId:"evo-app-platform",effect:"READ"
    }],
    observations:[{
      tool:PERSONAL_AGENT_COLLECTION_READ_PREVIEW_TOOL_ID,
      ok:true,result:actual
    }]
  },"zh-CN");
  const navigate=parts.find(p=>p.type==="proposal" && p.actions?.some(a=>
    a.id==="open-authorized-collection"
  ));
  assert.ok(navigate);
  assert.equal(navigate.actions[0].type,"navigate");
  assert.equal(navigate.actions[0].route,actual.navigation.route);
  const html=renderChatMessageToHtml({
    contractVersion:"0.2.0",id:"cv05-real-owner",role:"assistant",parts
  });
  assert.match(html,/data-eidos-chat-action="open-authorized-collection"/);
  assert.match(html,/data-eidos-action-type="navigate"/);
  assert.ok(html.includes('data-eidos-route="/counterparties/my-suppliers?'));
  assert.equal(html.includes("supplier-other"),false);
  assert.equal(html.includes("email"),false);
});

/**
 * CV05 Window11 #03/08. The scripted inference responses deliberately do
 * NOT establish real LLM reasoning quality. They exercise production
 * Provider-backed Agent → real Host catalog → actual ActionRouter/Owner →
 * Eidos Chat render → exact business route reauthorization as one journey.
 */
function cv05ScriptedModel(operationId, query, presentation) {
  const calls=[
    {name:"evo_capabilities_search",arguments:{query:operationId}},
    {name:"evo_capabilities_describe",arguments:{operationId}},
    {name:"evo_collection_read_preview",arguments:{
      operationId,input:query,...(presentation ? {presentation} : {})
    }}
  ];
  let index=0;
  return {
    get calls(){return index;},
    provider:{
      providerId:"cv05-scripted-test-provider",modelId:"scripted-tools-v1",
      async infer(input) {
        assert.ok(input.messages.some(message=>message.role==="user"
          && message.content.includes("请")));
        const selected=calls[index++];
        if(selected) {
          assert.ok(input.tools.some(tool=>tool.name===selected.name),
            "model requested a tool omitted by current Host catalog: "+selected.name);
        }
        return {
          contractVersion:"0.1.0",providerId:"cv05-scripted-test-provider",
          modelId:"scripted-tools-v1",
          text:selected?"":"已根据当前企业权限找到列表，请在列表中打开。",
          toolCalls:selected?[selected]:[],
          usage:{inputTokens:20,outputTokens:5},
          finishReason:selected?"tool_calls":"stop"
        };
      }
    }
  };
}

function cv05RealHostCatalog(env,requestCtx) {
  return createEnterpriseAgentHostToolCatalogV010({
    manager:env.manager,principal:requestCtx.principal,context:requestCtx.context,
    listAvailableContexts:()=>[requestCtx.context.activeContext],
    listProviderBindings:()=>[],getProviderHealth:()=>({state:"UNKNOWN"}),
    searchHelp:()=>[]
  },env.agent(requestCtx));
}

async function cv05RuntimeJourney(env,operationId,query,requestCtx,presentation) {
  const scripted=cv05ScriptedModel(operationId,query,presentation);
  const runtime=createEnterpriseAgentRuntime(
    createProviderBackedAgentModel(scripted.provider),
    cv05RealHostCatalog(env,requestCtx),8
  );
  const reply=await runtime.chat(
    "请查询当前有权限的供应商列表，保留筛选和排序，然后让我在列表中打开。",
    requestCtx.context,requestCtx.principal
  );
  assert.equal(scripted.calls,4,"Search → Describe → Preview → Final");
  return reply;
}

test("CV-05 scripted natural-language Agent tool journey uses real Supplier Owner and reauthorizes Eidos list",async()=>{
  const env=setup(),reqCtx=context();
  const operationId=COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010;
  const query={search:"Supplier",subjectType:"ORGANIZATION",
    sort:"displayName",direction:"asc",page:0,pageSize:25};
  const reply=await cv05RuntimeJourney(env,operationId,query,reqCtx);
  assert.deepEqual(reply.observations.map(x=>x.tool),[
    PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID,
    PERSONAL_AGENT_CAPABILITY_DESCRIBE_TOOL_ID,
    PERSONAL_AGENT_COLLECTION_READ_PREVIEW_TOOL_ID
  ]);
  assert.equal(reply.observations.every(x=>x.ok),true);
  assert.ok(reply.observations[0].result.items.some(x=>x.operationId===operationId));
  assert.equal(reply.observations[1].result.operation.operationId,operationId);
  const preview=reply.observations[2].result;
  assert.deepEqual(preview.rows.map(row=>row.rowId),["supplier-hk"]);
  assert.equal(preview.pageInfo.total,1);
  assert.equal(JSON.stringify(preview).includes("supplier-other"),false);
  assert.equal(preview.readableFieldIds.includes("email"),false);

  const parts=presentPersonalAgentReplyV020(reply,"zh-CN");
  const nav=parts.filter(part=>part.type==="proposal")
    .flatMap(part=>part.actions??[])
    .find(action=>action.id==="open-authorized-collection");
  assert.ok(nav);
  assert.equal(nav.type,"navigate");
  assert.equal(nav.route,preview.navigation.route);
  const html=renderChatMessageToHtml({
    id:"cv05-scripted-agent-journey",contractVersion:"0.2.0",
    role:"assistant",parts
  });
  assert.match(html,/data-eidos-chat-action="open-authorized-collection"/);
  assert.match(html,/data-eidos-action-type="navigate"/);
  assert.equal(html.includes("supplier-other"),false);

  // URL and button are presentation coordinates, not bearer access tokens.
  // A second real Host READ (the Eidos page's expected authority boundary)
  // must preserve the query and Owner-scoped rows.
  const routeQuery=parseCounterpartyProjectionRouteQueryV010(
    nav.route,COUNTERPARTY_MY_SUPPLIERS_ROUTE
  );
  assert.deepEqual(routeQuery,query);
  const human=await env.router.execute(request(operationId,routeQuery),context());
  assert.equal(human.ok,true,JSON.stringify(human.error));
  assert.deepEqual(human.result.rows,preview.rows);

  // An old chat button opened in another enterprise cannot read A's rows.
  const switched=await env.router.execute(
    request(operationId,routeQuery),context("ent-b")
  );
  assert.equal(switched.ok,true,JSON.stringify(switched.error));
  assert.deepEqual(switched.result.rows,[]);
  assert.equal(switched.result.pageInfo.total,0);

  // A previously rendered navigation button cannot reactivate the feature.
  env.manager.disable(counterpartyPackage.packageId);
  const disabled=await env.router.execute(
    request(operationId,routeQuery),context()
  );
  assert.equal(disabled.ok,false);
});

test("CV-05 Agent may not reuse Dictionary navigation across enterprise and revoked plugin",async()=>{
  const env=setup(),operationId=DICTIONARY_READ;
  const query={view:"published",search:"supplier",sort:"displayName",page:0,pageSize:25};
  const reply=await cv05RuntimeJourney(env,operationId,query,context(),"board");
  assert.equal(reply.observations.every(x=>x.ok),true);
  const preview=reply.observations[2].result;
  assert.deepEqual(preview.rows.map(row=>row.rowId),["supplier-category"]);
  assert.match(preview.navigation.route,/presentation=board/);
  const parts=presentPersonalAgentReplyV020(reply,"zh-CN");
  const route=parts.filter(x=>x.type==="proposal")
    .flatMap(x=>x.actions??[]).find(x=>x.id==="open-authorized-collection")?.route;
  assert.ok(route?.startsWith("/business-dictionaries?"));
  const selected=parseBusinessDictionaryDirectoryRouteV010(route);
  assert.equal(selected.presentation,"board");
  assert.equal(selected.view,"published");
  assert.equal(selected.query.search,"supplier");
  const readQuery={view:selected.view,...selected.query};
  const same=await env.router.execute(request(operationId,readQuery),context());
  assert.equal(same.ok,true);
  assert.deepEqual(same.result.data.rows,preview.rows);
  const switched=await env.router.execute(
    request(operationId,readQuery),context("ent-b")
  );
  assert.equal(switched.ok,false,"Enterprise B has no Dictionary READ grant");
  env.manager.disable(businessDictionaryPackage.packageId);
  const disabled=await env.router.execute(
    request(operationId,readQuery),context()
  );
  assert.equal(disabled.ok,false);

  // Replaying an old scripted model choice after plugin disable must fail at
  // Host, and no new navigable Eidos result may be rendered for that turn.
  const replay=await cv05RuntimeJourney(env,operationId,query,context());
  assert.equal(replay.observations.at(-1).ok,false);
  const partsAfter=presentPersonalAgentReplyV020(replay,"zh-CN");
  assert.equal(partsAfter.some(p=>p.type==="proposal"
    && p.actions?.some(a=>a.id==="open-authorized-collection")),false);
});


test("CV-05 rejects non-Dictionary display hints and forbidden Owner filters",async()=>{
  const env=setup();
  const tool=reg(env.agent(context()),PERSONAL_AGENT_COLLECTION_READ_PREVIEW_TOOL_ID);
  await assert.rejects(()=>tool.execute({
    operationId:COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010,
    input:{search:"Supplier"},presentation:"board"
  },[]),/PERSONAL_AGENT_COLLECTION_PREVIEW_PRESENTATION_UNSUPPORTED/);
  await assert.rejects(()=>tool.execute({
    operationId:DICTIONARY_READ,input:{view:"published"},presentation:"drag"
  },[]),/PERSONAL_AGENT_COLLECTION_PREVIEW_PRESENTATION_INVALID/);
  await assert.rejects(()=>tool.execute({
    operationId:COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010,
    input:{search:"Supplier",status:"ACTIVE"}
  },[]),/COUNTERPARTY_QUERY_STATUS_FORBIDDEN|CAPABILITY_OPERATION_INPUT|CAPABILITY_OPERATION/);
});


/**
 * CV05 MVP #05/06: deterministic provider decisions prove the *runtime and
 * real Host* behavior, not live-LLM linguistic correctness.
 */
function cv05RecoveryScenarioProvider(steps,onInfer=()=>{}) {
  let index=0;
  return {
    get count(){return index;},
    provider:{
      providerId:"cv05-recovery-scripted",modelId:"bounded-recovery-v1",
      async infer(input) {
        onInfer(input,index);
        const next=steps[index++];
        assert.ok(next,"unexpected extra model inference call");
        if(next.name) assert.ok(input.tools.some(tool=>tool.name===next.name),
          "scenario selected unavailable Host tool: "+next.name);
        return {
          contractVersion:"0.1.0",providerId:"cv05-recovery-scripted",
          modelId:"bounded-recovery-v1",
          text:next.text??"",
          toolCalls:next.name?[{
            name:next.name,arguments:next.arguments
          }]:[],
          usage:{inputTokens:18,outputTokens:8},
          finishReason:next.name?"tool_calls":"stop"
        };
      }
    }
  };
}
const cv05Search=(operationId)=>({
  name:"evo_capabilities_search",arguments:{query:operationId}
});
const cv05Describe=(operationId)=>({
  name:"evo_capabilities_describe",arguments:{operationId}
});
const cv05Preview=(operationId,input,presentation)=>({
  name:"evo_collection_read_preview",arguments:{
    operationId,input,...(presentation?{presentation}:{})
  }
});
const cv05Navigate=(reply)=>presentPersonalAgentReplyV020(reply,"zh-CN")
  .filter(part=>part.type==="proposal")
  .flatMap(part=>part.actions??[])
  .find(action=>action.id==="open-authorized-collection");

test("CV05 #05: ambiguous intent asks without Owner READ; corrected intent re-reads and opens exact authorized list",async()=>{
  const env=setup(),scope=context(),operationId=COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010;
  const intent="请帮我看供应商或者业务字典的状态。";
  const question="你想查看负责的供应商，还是业务字典？";
  const corrected="查看我负责的供应商，名称包含 Supplier，类型是组织。";
  const query={search:"Supplier",subjectType:"ORGANIZATION",page:0,pageSize:25};
  let verifiedInstructions=false,verifiedHistory=false;
  const scripted=cv05RecoveryScenarioProvider([
    {text:question},cv05Search(operationId),cv05Describe(operationId),
    cv05Preview(operationId,query),{text:"已查询当前有权供应商，可以在列表中打开。"}
  ],(input,index)=>{
    if(index===0) {
      const system=input.messages.find(msg=>msg.role==="system")?.content??"";
      assert.match(system,/For business Collection list requests/);
      assert.match(system,/ask one short clarifying question/);
      assert.match(system,/do not silently remove or loosen filters/);
      verifiedInstructions=true;
    }
    if(index===1) {
      assert.ok(input.messages.some(msg=>msg.role==="assistant" && msg.content===question));
      assert.ok(input.messages.some(msg=>msg.role==="user" && msg.content===intent));
      verifiedHistory=true;
    }
  });
  const runtime=createEnterpriseAgentRuntime(
    createProviderBackedAgentModel(scripted.provider),
    cv05RealHostCatalog(env,scope),8
  );
  const ambiguous=await runtime.chat(intent,scope.context,scope.principal);
  assert.equal(ambiguous.message,question);
  assert.deepEqual(ambiguous.observations,[]);
  assert.equal(cv05Navigate(ambiguous),undefined);
  const resolved=await runtime.chat(corrected,scope.context,scope.principal,[
    {role:"user",content:intent},{role:"assistant",content:question}
  ]);
  assert.ok(verifiedInstructions && verifiedHistory);
  assert.equal(scripted.count,5);
  assert.equal(resolved.observations.every(item=>item.ok),true);
  const route=cv05Navigate(resolved)?.route;
  assert.ok(route?.startsWith(COUNTERPARTY_MY_SUPPLIERS_ROUTE));
  const parsed=parseCounterpartyProjectionRouteQueryV010(
    route,COUNTERPARTY_MY_SUPPLIERS_ROUTE
  );
  assert.deepEqual(parsed,query);
  const reopened=await env.router.execute(request(operationId,parsed),scope);
  assert.equal(reopened.ok,true);
  assert.deepEqual(reopened.result.rows,resolved.observations.at(-1).result.rows);
  assert.deepEqual(reopened.result.rows.map(row=>row.rowId),["supplier-hk"]);
});

test("CV05 #05: forbidden filter fails without fake list action; Human correction must start new authorized READ",async()=>{
  const env=setup(),scope=context(),operationId=COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010;
  // The actual fixture grants displayName, code, subjectType, but not status.
  const forbidden={search:"Supplier",status:"ACTIVE",page:0,pageSize:25};
  const corrected={search:"Supplier",subjectType:"ORGANIZATION",page:0,pageSize:25};
  const scripted=cv05RecoveryScenarioProvider([
    cv05Search(operationId),cv05Describe(operationId),
    cv05Preview(operationId,forbidden),{text:"状态字段不可查询，请修改筛选条件。"},
    cv05Search(operationId),cv05Describe(operationId),
    cv05Preview(operationId,corrected),{text:"已按你修改后的组织类型查询。"}
  ]);
  const runtime=createEnterpriseAgentRuntime(
    createProviderBackedAgentModel(scripted.provider),
    cv05RealHostCatalog(env,scope),8
  );
  const denied=await runtime.chat(
    "请查状态为启用的 Supplier 供应商。",scope.context,scope.principal
  );
  assert.equal(denied.observations.at(-1).ok,false);
  assert.match(denied.observations.at(-1).error.code,/COUNTERPARTY_QUERY_STATUS_FORBIDDEN|CAPABILITY_OPERATION/);
  assert.equal(cv05Navigate(denied),undefined);
  assert.equal(presentPersonalAgentReplyV020(denied,"zh-CN")
    .some(part=>part.type==="activity" && part.state==="error"),true);
  const reply=await runtime.chat(
    "不再按状态过滤，改成类型为组织的 Supplier。",scope.context,scope.principal,[
      {role:"user",content:"请查状态为启用的 Supplier 供应商。"},
      {role:"assistant",content:denied.message}
    ]
  );
  assert.equal(scripted.count,8);
  const route=cv05Navigate(reply)?.route;
  assert.ok(route,"new Host preview must be the sole source of a fresh route");
  const parsed=parseCounterpartyProjectionRouteQueryV010(
    route,COUNTERPARTY_MY_SUPPLIERS_ROUTE
  );
  assert.deepEqual(parsed,corrected);
  assert.equal("status" in parsed,false);
  const reopened=await env.router.execute(request(operationId,parsed),scope);
  assert.equal(reopened.ok,true);
  assert.deepEqual(reopened.result.rows,reply.observations.at(-1).result.rows);
});

test("CV05 #05: a subsequent failed Host inspection suppresses earlier successful preview action",async()=>{
  const env=setup(),scope=context(),operationId=DICTIONARY_READ;
  const scripted=cv05RecoveryScenarioProvider([
    cv05Search(operationId),cv05Describe(operationId),
    cv05Preview(operationId,{view:"published",search:"supplier",page:0,pageSize:25},"board"),
    cv05Describe("dictionary.nonexistent.operation"),
    {text:"后续授权检查失败，不能提供之前的列表入口。"}
  ]);
  const runtime=createEnterpriseAgentRuntime(
    createProviderBackedAgentModel(scripted.provider),
    cv05RealHostCatalog(env,scope),8
  );
  const reply=await runtime.chat("请查看有权的字典看板并复核授权。",scope.context,scope.principal);
  assert.equal(reply.observations[2].ok,true);
  assert.match(reply.observations[2].result.navigation.route,/presentation=board/);
  assert.equal(reply.observations[3].ok,false);
  assert.equal(cv05Navigate(reply),undefined);
  const html=renderChatMessageToHtml({
    contractVersion:"0.2.0",id:"cv05-stale-route-reject",
    role:"assistant",parts:presentPersonalAgentReplyV020(reply,"zh-CN")
  });
  assert.doesNotMatch(html,/data-eidos-chat-action="open-authorized-collection"/);
});


/**
 * Opt-in REAL online llm.inference acceptance. Deliberately absent from
 * ordinary CI test enumeration and from any automated deployment trigger.
 * Launch exclusively through tools/agent-line/cv05-live-llm-acceptance.mjs:
 * that launcher verifies independent test-only credentials and explicit
 * metered-network consent before adding EVO_CV05_LIVE_LLM_RUN=1.
 *
 * The actual model infers decisions; only Host, Owner and test records are
 * deterministic. No production tenant, identity, stored user data or WRITE
 * tool is available. A failure is a real quality gap, not a release override.
 */
if (process.env.EVO_CV05_LIVE_LLM_RUN === "1") {
  test("CV05 LIVE online LLM ambiguity, forbidden Owner filter and correction",async()=>{
    const {validateCv05LiveEnvironment}=await import(
      "../../tools/agent-line/cv05-live-llm-acceptance.mjs"
    );
    const {provider,model}=validateCv05LiveEnvironment(process.env);
    const {createOpenAiResponsesLlmProvider}=await import(
      "../../dist/providers/openai/runtime.js"
    );
    const {createDeepSeekResponsesLlmProvider}=await import(
      "../../dist/providers/deepseek/runtime.js"
    );

    // Only two established public Provider endpoints; redirects, alternate
    // DNS URLs, user-provided base URLs and extra request families are denied.
    const origin=provider==="openai"
      ? "https://api.openai.com" : "https://api.deepseek.com";
    const path=provider==="openai"?"/v1/responses":"/responses";
    let networkRequests=0,modelDecisions=0;
    let inputTokens=0,outputTokens=0,usageComplete=true;
    const boundedFetch=async(url,options={})=>{
      const parsed=new URL(String(url));
      if(parsed.origin!==origin||parsed.pathname!==path
        ||options.method!=="POST") {
        throw new Error("CV05_LIVE_PROVIDER_DESTINATION_FORBIDDEN");
      }
      if(++networkRequests>32) {
        throw new Error("CV05_LIVE_PROVIDER_NETWORK_LIMIT");
      }
      const signal=AbortSignal.timeout(25_000);
      const combined=options.signal
        ? AbortSignal.any([options.signal,signal]) : signal;
      return fetch(url,{...options,redirect:"error",signal:combined});
    };
    const original=provider==="openai"
      ? createOpenAiResponsesLlmProvider({
          apiKey:process.env.EVO_CV05_LIVE_LLM_TEST_API_KEY,
          model,fetchImpl:boundedFetch
        })
      : createDeepSeekResponsesLlmProvider({
          apiKey:process.env.EVO_CV05_LIVE_LLM_TEST_API_KEY,
          model,fetchImpl:boundedFetch,inferenceTimeoutMs:25_000
        });
    const measured={
      providerId:original.providerId,modelId:original.modelId,
      async infer(input) {
        if(++modelDecisions>32) {
          throw new Error("CV05_LIVE_PROVIDER_DECISION_LIMIT");
        }
        // The Provider may reflect model prose or tool arguments in an
        // upstream HTTP error message. Never surface it in Actions logs.
        let result;
        try {
          result=await original.infer({...input,maxOutputTokens:700});
        }catch{
          throw new Error("CV05_LIVE_PROVIDER_INFERENCE_FAILED_REDACTED");
        }
        if(result.usage){
          inputTokens+=result.usage.inputTokens;
          outputTokens+=result.usage.outputTokens;
        }else{
          usageComplete=false;
        }
        return result;
      }
    };

    const env=setup(),scope=context();
    const operationId=COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010;
    const allowed=new Set([
      PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID,
      PERSONAL_AGENT_CAPABILITY_DESCRIBE_TOOL_ID,
      PERSONAL_AGENT_COLLECTION_READ_PREVIEW_TOOL_ID
    ]);
    const catalogFor=ctx=>{
      // This wraps the real Host tool catalog. Filtering reduces available
      // capabilities only; actual invocation still performs Host admission,
      // Domain Owner field permissions and enterprise-scoped ActionRouter.
      const host=cv05RealHostCatalog(env,ctx);
      return {
        async list() {
          return (await host.list()).filter(tool=>
            allowed.has(tool.id) && tool.effect==="READ"
          );
        },
        async invoke(call,observations) {
          if(!allowed.has(call.tool)) return {
            tool:call.tool,ok:false,error:{
              code:"CV05_LIVE_READ_ONLY_TOOL_REQUIRED",
              message:"This isolated evaluation only permits three Host READ operations."
            }
          };
          return host.invoke(call,observations);
        }
      };
    };
    const ask=async(message,ctx=scope,conversationHistory=[])=>{
      const runtime=createEnterpriseAgentRuntime(
        createProviderBackedAgentModel(measured),catalogFor(ctx),8
      );
      return runtime.chat(message,ctx.context,ctx.principal,conversationHistory);
    };
    const assertAuthorizedRoute=async reply=>{
      const route=cv05Navigate(reply)?.route;
      assert.ok(route?.startsWith(COUNTERPARTY_MY_SUPPLIERS_ROUTE),
        "CV05_LIVE_FRESH_AUTHORIZED_LIST_ROUTE_REQUIRED");
      const query=parseCounterpartyProjectionRouteQueryV010(
        route,COUNTERPARTY_MY_SUPPLIERS_ROUTE
      );
      assert.equal(query.search,"Supplier");
      assert.equal(query.subjectType,"ORGANIZATION");
      assert.equal("status" in query,false);
      const owner=await env.router.execute(request(operationId,query),scope);
      assert.equal(owner.ok,true,"CV05_LIVE_OWNER_READ_REJECTED");
      const preview=[...reply.observations].reverse().find(item=>
        item.tool===PERSONAL_AGENT_COLLECTION_READ_PREVIEW_TOOL_ID && item.ok
      )?.result;
      assert.ok(preview,"CV05_LIVE_SUCCESSFUL_HOST_PREVIEW_REQUIRED");
      // Preserve the source evidence in memory, not the public failed
      // Actions assertion output (which must not print row bodies).
      assert.ok(JSON.stringify(owner.result.rows)===JSON.stringify(preview.rows),
        "CV05_LIVE_OWNER_PREVIEW_ROWS_MISMATCH");
      assert.ok(owner.result.rows.length===1 &&
        owner.result.rows[0].rowId==="supplier-hk",
        "CV05_LIVE_SCOPED_SUPPLIER_REQUIRED");
      assert.equal(JSON.stringify(preview).includes("supplier-other"),false);
      assert.equal(preview.readableFieldIds.includes("email"),false);
      return route;
    };

    const ambiguousMessage="我要看供应商的状态，也可能是业务字典里的供应商分类；不确定是哪一种。";
    const ambiguous=await ask(ambiguousMessage);
    assert.equal(ambiguous.observations.some(item=>
      item.tool===PERSONAL_AGENT_COLLECTION_READ_PREVIEW_TOOL_ID),false,
    "CV05_LIVE_AMBIGUOUS_INTENT_MUST_NOT_GUESS_OWNER_READ");
    assert.equal(cv05Navigate(ambiguous),undefined);
    assert.ok(
      /[?？]|(?:请|需要).*(?:确认|明确|选择)|哪(?:一|个|类)/.test(ambiguous.message),
      "CV05_LIVE_AMBIGUITY_QUESTION_REQUIRED"
    );
    console.log("CV05_LIVE_SCENARIO_PASS=ambiguity_no_owner_read");

    const correction="明确是我负责的供应商列表，不是字典。名称筛选 Supplier，"
      +"subjectType=ORGANIZATION，第一页，请提供可点击列表入口。";
    const resolved=await ask(correction,scope,[
      {role:"user",content:ambiguousMessage},
      {role:"assistant",content:ambiguous.message}
    ]);
    await assertAuthorizedRoute(resolved);
    console.log("CV05_LIVE_SCENARIO_PASS=corrected_owner_preview_reauthorized_list");

    const deniedMessage="请精确查询我负责的 Supplier 供应商，"
      +"要求 status=ACTIVE。请调用 Owner 查询；若字段未授权不要擅自移除 status。";
    const denied=await ask(deniedMessage);
    assert.equal(cv05Navigate(denied),undefined,
      "CV05_LIVE_FORBIDDEN_FILTER_MUST_NOT_HAVE_LIST_ACTION");
    assert.ok(denied.observations.some(item=>!item.ok
      && /COUNTERPARTY_QUERY_STATUS_FORBIDDEN|CAPABILITY_OPERATION/.test(
        item.error?.code??""
      )),"CV05_LIVE_REAL_OWNER_FORBIDDEN_OBSERVATION_REQUIRED");
    console.log("CV05_LIVE_SCENARIO_PASS=forbidden_status_no_navigation");

    const correctionAfterDenial="我确认不按 status 筛选。请重新查询"
      +"我负责的 Supplier 供应商，subjectType=ORGANIZATION，提供新的列表入口。";
    const repaired=await ask(correctionAfterDenial,scope,[
      {role:"user",content:deniedMessage},
      {role:"assistant",content:denied.message}
    ]);
    const previouslyAuthorizedRoute=await assertAuthorizedRoute(repaired);
    console.log("CV05_LIVE_SCENARIO_PASS=human_corrected_fresh_owner_read");

    env.manager.disable(counterpartyPackage.packageId);

    // A previous Chat button is only a navigation coordinate, not a
    // capability: directly reopening that exact route must now fail at
    // the REAL ActionRouter/Domain Owner with the disabled package.
    const staleQuery=parseCounterpartyProjectionRouteQueryV010(
      previouslyAuthorizedRoute,COUNTERPARTY_MY_SUPPLIERS_ROUTE
    );
    const staleOwnerRead=await env.router.execute(
      request(operationId,staleQuery),scope
    );
    assert.equal(staleOwnerRead.ok,false,
      "CV05_LIVE_REVOKED_OLD_EIDOS_ROUTE_MUST_FAIL_OWNER_READ");
    const staleAgentRead=await cv05RealHostCatalog(env,scope).invoke({
      tool:PERSONAL_AGENT_COLLECTION_READ_PREVIEW_TOOL_ID,
      arguments:{operationId,input:staleQuery}
    },[]);
    assert.equal(staleAgentRead.ok,false,
      "CV05_LIVE_REVOKED_OLD_AGENT_READ_MUST_FAIL_HOST");

    const revoked=await ask("刚才的供应商列表现在还能打开吗？请核对当前授权。");
    assert.equal(cv05Navigate(revoked),undefined,
      "CV05_LIVE_DISABLED_FEATURE_MUST_NOT_REISSUE_NAVIGATION");
    console.log("CV05_LIVE_SCENARIO_PASS=plugin_revoked_no_navigation");

    // No prompts, tool arguments, response bodies or credentials in evidence.
    console.log("CV05_LIVE_INFERENCE_RECEIPT="+JSON.stringify({
      source:"ACTUAL_NETWORK_PROVIDER",
      providerId:measured.providerId,modelId:measured.modelId,
      scenarios:5,networkRequests,modelDecisions,
      usage:usageComplete?{inputTokens,outputTokens}:"UNKNOWN"
    }));
  });
}


/**
 * CV05 #06/07 - zero-network protocol rehearsal of BOTH shipping Responses
 * Provider adapters. Unlike a scripted LlmInferenceProvider, a synthetic
 * Responses HTTP transport goes through the real OpenAI/DeepSeek request
 * builder, strict/optional tool schema mapping, JSON response parser and
 * Provider-backed model before reaching existing Host/Domain Owner/Eidos.
 *
 * IMPORTANT: This is a transport/integration contract only. The sequence of
 * model decisions is prescribed; it is NOT model semantic inference and MUST
 * NOT be reported as LIVE_LLM_VERIFIED or as a real provider request.
 */
for (const providerKind of ["openai","deepseek"]) {
  test("CV05 #06 offline Responses "+providerKind+" transport replays real Host Owner denial, correction, revoked Eidos link",async()=>{
    const {createOpenAiResponsesLlmProvider}=await import(
      "../../dist/providers/openai/runtime.js"
    );
    const {createDeepSeekResponsesLlmProvider}=await import(
      "../../dist/providers/deepseek/runtime.js"
    );
    const env=setup(),scope=context();
    const operationId=COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010;
    const good={search:"Supplier",subjectType:"ORGANIZATION",page:0,pageSize:25};
    const forbidden={search:"Supplier",status:"ACTIVE",page:0,pageSize:25};
    const steps=[
      cv05Search(operationId),
      cv05Describe(operationId),
      cv05Preview(operationId,good),
      {text:"已经获取当前企业中有权查看的供应商列表。"},
      cv05Search(operationId),
      cv05Describe(operationId),
      cv05Preview(operationId,forbidden),
      {text:"状态字段未获许可，需要明确修改筛选条件。"},
      cv05Search(operationId),
      cv05Describe(operationId),
      cv05Preview(operationId,good),
      {text:"已根据新条件重新取得当前权限下的列表。"}
    ];
    const allowed=new Set([
      PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID,
      PERSONAL_AGENT_CAPABILITY_DESCRIBE_TOOL_ID,
      PERSONAL_AGENT_COLLECTION_READ_PREVIEW_TOOL_ID
    ]);
    const raw=cv05RealHostCatalog(env,scope);
    const catalog={
      async list(){
        return (await raw.list()).filter(t=>t.effect==="READ"&&allowed.has(t.id));
      },
      async invoke(call,observations){
        assert.ok(allowed.has(call.tool),"CV05_OFFLINE_ONLY_THREE_READ_TOOLS");
        return raw.invoke(call,observations);
      }
    };
    const urlExpected=providerKind==="openai"
      ?"https://api.openai.com/v1/responses"
      :"https://api.deepseek.com/responses";
    let transportRequests=0;
    const offlineHttp=async(url,options)=>{
      assert.equal(String(url),urlExpected,"CV05_OFFLINE_PROVIDER_ENDPOINT_UNEXPECTED");
      assert.equal(options.method,"POST");
      const requestBody=JSON.parse(options.body);
      assert.equal(requestBody.model,"cv05-offline-fixture");
      assert.equal(requestBody.tool_choice,"auto");
      assert.ok(requestBody.instructions.includes("Host"),
        "CV05_OFFLINE_SYSTEM_INSTRUCTIONS_MISSING");
      assert.ok(Array.isArray(requestBody.tools));
      assert.ok(requestBody.tools.length===3,
        "CV05_OFFLINE_UNEXPECTED_CAPABILITY_EXPOSED");
      assert.ok(requestBody.tools.every(t=>
        ["evo_capabilities_search","evo_capabilities_describe",
          "evo_collection_read_preview"].includes(t.name)
      ));
      const selected=steps[transportRequests++];
      assert.ok(selected,"CV05_OFFLINE_EXTRA_PROVIDER_ROUND_TRIP");
      if(selected.name) assert.ok(
        requestBody.tools.some(t=>t.name===selected.name),
        "CV05_OFFLINE_TOOL_MISSING_FROM_PROTOCOL_REQUEST"
      );
      return Response.json({
        model:"cv05-offline-fixture",
        output:selected.name
          ?[{type:"function_call",name:selected.name,
              arguments:JSON.stringify(selected.arguments)}]
          :[{type:"message",content:[{type:"output_text",text:selected.text}]}],
        usage:{input_tokens:11,output_tokens:5}
      });
    };
    const provider=providerKind==="openai"
      ?createOpenAiResponsesLlmProvider({
          apiKey:"synthetic-offline-key",model:"cv05-offline-fixture",
          fetchImpl:offlineHttp
        })
      :createDeepSeekResponsesLlmProvider({
          apiKey:"synthetic-offline-key",model:"cv05-offline-fixture",
          fetchImpl:offlineHttp
        });
    const runtime=createEnterpriseAgentRuntime(
      createProviderBackedAgentModel(provider),catalog,8
    );
    const first=await runtime.chat(
      "查看我负责的 Supplier 供应商，组织类型，提供列表。",
      scope.context,scope.principal
    );
    assert.equal(transportRequests,4);
    const firstRoute=cv05Navigate(first)?.route;
    assert.ok(firstRoute?.startsWith(COUNTERPARTY_MY_SUPPLIERS_ROUTE),
      "CV05_OFFLINE_FIRST_FRESH_NAVIGATION_REQUIRED");
    assert.ok(first.observations.at(-1).ok);
    assert.ok(first.observations.at(-1).result.rows.length===1);
    assert.equal(first.observations.at(-1).result.rows[0].rowId,"supplier-hk");

    const denied=await runtime.chat(
      "必须精确查询 status=ACTIVE 的 Supplier，不能擅自去掉状态。",
      scope.context,scope.principal
    );
    assert.equal(transportRequests,8);
    assert.equal(cv05Navigate(denied),undefined);
    assert.ok(denied.observations.some(x=>!x.ok &&
      /COUNTERPARTY_QUERY_STATUS_FORBIDDEN|CAPABILITY_OPERATION/.test(
        x.error?.code??""
      )),"CV05_OFFLINE_REAL_OWNER_STATUS_DENIAL_REQUIRED");

    const repaired=await runtime.chat(
      "我明确取消 status 条件，改为 subjectType=ORGANIZATION 且搜索 Supplier。",
      scope.context,scope.principal,[
        {role:"user",content:"必须精确查询 status=ACTIVE 的 Supplier，不能擅自去掉状态。"},
        {role:"assistant",content:denied.message}
      ]
    );
    assert.equal(transportRequests,12);
    const repairedRoute=cv05Navigate(repaired)?.route;
    assert.ok(repairedRoute?.startsWith(COUNTERPARTY_MY_SUPPLIERS_ROUTE),
      "CV05_OFFLINE_HUMAN_CORRECTED_FRESH_ROUTE_REQUIRED");
    const parsed=parseCounterpartyProjectionRouteQueryV010(
      repairedRoute,COUNTERPARTY_MY_SUPPLIERS_ROUTE
    );
    assert.ok(parsed.search==="Supplier" && parsed.subjectType==="ORGANIZATION");
    assert.equal("status" in parsed,false);
    const owner=await env.router.execute(request(operationId,parsed),scope);
    assert.equal(owner.ok,true);
    assert.equal(owner.result.rows.length,1);
    assert.equal(owner.result.rows[0].rowId,"supplier-hk");

    env.manager.disable(counterpartyPackage.packageId);
    const oldOwner=await env.router.execute(request(operationId,parsed),scope);
    assert.equal(oldOwner.ok,false,
      "CV05_OFFLINE_REVOKED_OLD_EIDOS_ROUTE_DENIED");
    const oldAgent=await cv05RealHostCatalog(env,scope).invoke({
      tool:PERSONAL_AGENT_COLLECTION_READ_PREVIEW_TOOL_ID,
      arguments:{operationId,input:parsed}
    },[]);
    assert.equal(oldAgent.ok,false,
      "CV05_OFFLINE_REVOKED_OLD_AGENT_PREVIEW_DENIED");
    // Only simulation: never display business rows or authorize paid LLM.
    console.log("CV05_OFFLINE_RESPONSES_HOST_REHEARSAL_PASS="+providerKind+
      " protocol_decisions="+transportRequests);
  });
}
