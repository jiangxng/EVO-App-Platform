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
  const query={search:"Supplier",sort:"displayName",direction:"asc",page:0,pageSize:25};
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
function cv05ScriptedModel(operationId, query) {
  const calls=[
    {name:"evo_capabilities_search",arguments:{query:operationId}},
    {name:"evo_capabilities_describe",arguments:{operationId}},
    {name:"evo_collection_read_preview",arguments:{operationId,input:query}}
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

async function cv05RuntimeJourney(env,operationId,query,requestCtx) {
  const scripted=cv05ScriptedModel(operationId,query);
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
  const query={search:"Supplier",sort:"displayName",direction:"asc",page:0,pageSize:25};
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
  const reply=await cv05RuntimeJourney(env,operationId,query,context());
  assert.equal(reply.observations.every(x=>x.ok),true);
  const preview=reply.observations[2].result;
  assert.deepEqual(preview.rows.map(row=>row.rowId),["supplier-category"]);
  const parts=presentPersonalAgentReplyV020(reply,"zh-CN");
  const route=parts.filter(x=>x.type==="proposal")
    .flatMap(x=>x.actions??[]).find(x=>x.id==="open-authorized-collection")?.route;
  assert.ok(route?.startsWith("/business-dictionaries?"));
  const selected=parseBusinessDictionaryDirectoryRouteV010(route);
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
