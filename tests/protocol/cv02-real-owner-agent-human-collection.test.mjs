import test from "node:test";
import assert from "node:assert/strict";
import { createAppActionRouter } from "../../dist/actions/router.js";
import { createBusinessDictionaryDirectoryPageV010 } from "../../dist/apps/business-dictionary/page.js";
import { withCv06AuthorizedDictionaryChartV010 } from "../../dist/manager/cv06-dictionary-chart-presentation.js";
import { renderCatalogBrowserToHtml } from "../../dist/vendor/eidos/src/catalog-browser/render.js";
import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { businessDictionaryPackage } from "../../dist/catalog/seed.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createCapabilityOperationActionPreExecuteV010 } from "../../dist/manager/capability-operation-access.js";
import { hostEnterpriseContextProviderPackage } from "../../dist/providers/enterprise-context/package.js";
import { createMemoryEnterpriseResourceRepositoryV010 } from "../../dist/providers/enterprise-context/resources.js";
import { createBusinessDictionaryRepositoryV010 } from "../../dist/apps/business-dictionary/repository.js";
import { createBusinessDictionaryActionHandlersV010 } from "../../dist/apps/business-dictionary/actions.js";
import {
  createPersonalAgentCapabilityToolRegistrationsV010,
  PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID,
  PERSONAL_AGENT_COLLECTION_READ_PREVIEW_TOOL_ID,
  PERSONAL_AGENT_CAPABILITY_DESCRIBE_TOOL_ID,
  PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID,
  PERSONAL_AGENT_CAPABILITY_INVOKE_WRITE_TOOL_ID
} from "../../dist/agents/enterprise-agent/capability-fabric-tools.js";

const operationId = "dictionary.collection.query";
const packageId = "evo-business-dictionary";
const contextId = "enterprise-context:alpha";
const enterpriseId = "alpha";

function requestContext(actorType = "HUMAN", overrides = {}) {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0", actorType, subjectId: "owner-a",
      identityProviderId: "test.identity", sessionId: "session-a"
    },
    scope: { contractVersion: "0.1.0", enterpriseId: overrides.enterpriseId ?? enterpriseId, userId: "owner-a" },
    context: {
      contractVersion: "0.1.0",
      personalContext: {contractVersion:"0.1.0",kind:"PERSONAL",contextId:"personal:owner-a",ownerSubjectId:"owner-a"},
      activeContext: {contractVersion:"0.1.0",kind:"ENTERPRISE",
        contextId: overrides.contextId ?? contextId,enterpriseId:overrides.enterpriseId ?? enterpriseId}
    },
    correlationId: "cv02-real-owner-test"
  };
}
function request(values) {
  return {
    contractVersion: "0.1.0", type: "command",
    command: {code:operationId,inputVersion:"0.1.0"},
    values,sourceInteractionId:"cv02-human",actionId:operationId,requiresConfirmation:false
  };
}
function tool(registrations, id) {
  const selected = registrations.find(reg => reg.descriptor.id === id);
  assert.ok(selected, "Personal Agent tool not found: " + id);
  return selected;
}
function fixture() {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const repository = createBusinessDictionaryRepositoryV010(resources);
  for (const [dictionaryId, displayName, state] of [
    ["hk", "Hong Kong Supplier", "PUBLISHED"],
    ["sh", "Shanghai Supplier", "PUBLISHED"],
    ["draft", "Hong Kong Internal", "DRAFT"]
  ]) {
    repository.saveDraft({
      contextId, dictionaryId, displayName, expectedVersion:0,
      options:[{code:"INTERNAL",label:{default:"Private label"},status:"ACTIVE"}],
      actorSubjectId:"owner-a",recordedAt:"2026-11-09T00:00:00.000Z"
    });
    if (state === "PUBLISHED") repository.publish({
      contextId,dictionaryId,expectedVersion:1,
      actorSubjectId:"owner-a",actorType:"HUMAN",recordedAt:"2026-11-09T00:00:01.000Z"
    });
  }
  const manager = createAppManagerService(createPackageCatalog([
    hostEnterpriseContextProviderPackage,businessDictionaryPackage
  ]),createMemoryLifecycleStore());
  manager.install(packageId);
  let policyAllowed = true;
  const provider = {
    providerId:"test.cv02.auth",
    check(input) {
      const granted = policyAllowed
        && input.action === "dictionary.read"
        && input.resource.type === "business-dictionary.definition"
        && input.scope.enterpriseId === enterpriseId;
      return {
        contractVersion:"0.1.0", allowed:granted,
        policyProviderId:"test.cv02.auth",
        reasonCodes:[granted?"READ_ALLOWED":"READ_DENIED"]
      };
    }
  };
  const handlers = createBusinessDictionaryActionHandlersV010({
    repository,
    canRead: (_principal, c) => c === contextId && policyAllowed,
    canManage: () => false
  });
  const router = createAppActionRouter(
    handlers,
    id => manager.getSnapshot().activeFeatures.some(feature => feature.featureId === id),
    createCapabilityOperationActionPreExecuteV010({
      manager,resolveAuthorizationProvider:()=>provider
    })
  );
  const agent = ctx => createPersonalAgentCapabilityToolRegistrationsV010({
    manager,actionRouter:router,requestContext:ctx,
    resolveAuthorizationProvider:()=>provider
  });
  return {
    manager,router,agent,repository,
    setAllowed(value){policyAllowed=value;}
  };
}

test("CV-02 Human and Personal Agent use the same real dictionary owner, Host authorization and collection READ",async()=>{
  const env=fixture();
  const query={view:"published",search:"Supplier",sort:"displayName",direction:"asc",page:0,pageSize:25};
  const human=await env.router.execute(request(query),requestContext());
  assert.equal(human.ok,true,JSON.stringify(human.error));
  const regs=env.agent(requestContext());
  const found=await tool(regs,PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID).execute({query:"dictionary"},[]);
  assert.ok(found.items.some(x=>x.operationId===operationId));
  const described=await tool(regs,PERSONAL_AGENT_CAPABILITY_DESCRIBE_TOOL_ID).execute({operationId},[]);
  assert.equal(described.operation.effect,"READ");
  const agent=await tool(regs,PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID).execute({operationId,input:query},[]);
  const rows=agent.result.data.rows;
  assert.deepEqual(rows,human.result.data.rows);
  assert.equal(agent.result.data.pageInfo.total,human.result.data.pageInfo.total);
  assert.equal(agent.result.data.pageInfo.total,2);
  assert.deepEqual(rows.map(row=>row.rowId),["hk","sh"]);
  assert.equal(rows.some(row=>Object.hasOwn(row.cells,"options")),false);
  assert.equal(rows.some(row=>Object.hasOwn(row.cells,"contextId")),false);
  await assert.rejects(() => tool(regs,PERSONAL_AGENT_CAPABILITY_INVOKE_WRITE_TOOL_ID).execute({
    operationId,input:query
  },[]),/PERSONAL_AGENT_CAPABILITY_EFFECT_MISMATCH/);
});

test("CV-02 Agent capability discovery/invoke revokes immediately on policy change, context switch and disabled plugin",async()=>{
  const env=fixture();
  const regs=env.agent(requestContext());
  const reader=tool(regs,PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID);
  assert.equal((await reader.execute({operationId,input:{view:"draft"}},[])).result.data.rows.length,1);
  const other=env.agent(requestContext("HUMAN",{enterpriseId:"other",contextId:"enterprise-context:other"}));
  const otherSearch=await tool(other,PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID).execute({query:"dictionary"},[]);
  assert.ok(!otherSearch.items.some(x=>x.operationId===operationId));
  await assert.rejects(()=>tool(other,PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID)
    .execute({operationId,input:{}},[]),/PERSONAL_AGENT_CAPABILITY_NOT_AVAILABLE/);
  env.setAllowed(false);
  const revoked=await tool(regs,PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID).execute({query:"dictionary"},[]);
  assert.ok(!revoked.items.some(x=>x.operationId===operationId));
  await assert.rejects(()=>reader.execute({operationId,input:{}},[]),
    /PERSONAL_AGENT_CAPABILITY_NOT_AVAILABLE/);
  assert.equal((await env.router.execute(request({}),requestContext())).ok,false);
  env.setAllowed(true);
  env.manager.disable(packageId);
  const disabled=await tool(regs,PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID).execute({query:"dictionary"},[]);
  assert.ok(!disabled.items.some(x=>x.operationId===operationId));
  await assert.rejects(()=>reader.execute({operationId,input:{}},[]),
    /PERSONAL_AGENT_CAPABILITY_NOT_AVAILABLE/);
  assert.equal((await env.router.execute(request({}),requestContext())).error.code,
    "ACTION_FEATURE_NOT_ACTIVE");
});

test("CV-05 Agent Collection preview uses a real authorized owner page and Eidos route without saving",async()=>{
  const env=fixture();
  const query={view:"published",search:"Supplier",sort:"displayName",direction:"asc",page:0,pageSize:25};
  const human=await env.router.execute(request(query),requestContext());
  assert.equal(human.ok,true);
  const preview=await tool(env.agent(requestContext()),
    PERSONAL_AGENT_COLLECTION_READ_PREVIEW_TOOL_ID)
    .execute({operationId,input:query},[]);
  assert.equal(preview.kind,"evo.personal-agent-collection.read-preview");
  assert.equal(preview.operationId,operationId);
  assert.equal(preview.collectionId,human.result.data.collectionId);
  assert.deepEqual(preview.rows,human.result.data.rows);
  assert.deepEqual(preview.pageInfo,human.result.data.pageInfo);
  assert.equal(preview.pageInfo.total,2);
  assert.equal(preview.navigation.authority,"PRESENTATION_ONLY_REAUTHORIZE_ON_OPEN");
  assert.match(preview.navigation.route,/^\/business-dictionaries\?view=published&/);
  assert.ok(preview.navigation.route.includes("search=Supplier"));
  assert.equal(JSON.stringify(preview).includes("Private label"),false);
  assert.equal(JSON.stringify(preview).includes("contextId"),false);
  assert.equal(Object.hasOwn(preview,"receipt"),false);
});

test("CV-05 preview rejects unsupported, unsafe and write-side operations without executing them",async()=>{
  const env=fixture();
  const preview=tool(env.agent(requestContext()),PERSONAL_AGENT_COLLECTION_READ_PREVIEW_TOOL_ID);
  await assert.rejects(()=>preview.execute({
    operationId:"dictionary.publish",input:{}
  },[]),/PERSONAL_AGENT_COLLECTION_PREVIEW_NOT_SUPPORTED/);
  await assert.rejects(()=>preview.execute({
    operationId:"dictionary.list",input:{}
  },[]),/PERSONAL_AGENT_COLLECTION_PREVIEW_NOT_SUPPORTED/);
  await assert.rejects(()=>preview.execute({
    operationId,input:{view:"published",sort:"internalSecret"}
  },[]),/CAPABILITY_OPERATION_INPUT|COLLECTION_QUERY_SORT_INVALID/);
  await assert.rejects(()=>preview.execute({
    operationId,input:{view:"all",pageSize:10000}
  },[]),/CAPABILITY_OPERATION_INPUT|COLLECTION_QUERY_PAGE_SIZE_INVALID/);
  await assert.rejects(()=>preview.execute({
    operationId,input:{view:"all",enterpriseId:"other"}
  },[]),/CAPABILITY_OPERATION_INPUT|COLLECTION_QUERY_FIELD_UNSUPPORTED/);
});

test("CV-05 preview rechecks revocation, enterprise switch, and plugin lifecycle",async()=>{
  const env=fixture();
  const regs=env.agent(requestContext());
  const preview=tool(regs,PERSONAL_AGENT_COLLECTION_READ_PREVIEW_TOOL_ID);
  const args={operationId,input:{view:"published",page:0,pageSize:2}};
  assert.equal((await preview.execute(args,[])).pageInfo.total,2);
  const switched=tool(env.agent(requestContext("HUMAN",{
    enterpriseId:"other",contextId:"enterprise-context:other"
  })),PERSONAL_AGENT_COLLECTION_READ_PREVIEW_TOOL_ID);
  await assert.rejects(()=>switched.execute(args,[]),
    /PERSONAL_AGENT_CAPABILITY_NOT_AVAILABLE/);
  env.setAllowed(false);
  await assert.rejects(()=>preview.execute(args,[]),
    /PERSONAL_AGENT_CAPABILITY_NOT_AVAILABLE/);
  env.setAllowed(true);
  env.manager.disable(packageId);
  await assert.rejects(()=>preview.execute(args,[]),
    /PERSONAL_AGENT_CAPABILITY_NOT_AVAILABLE/);
});


const aggregateOperationId="dictionary.collection.aggregate.state";
function aggregateRequest(values) {
  return {
    ...request(values),command:{code:aggregateOperationId,inputVersion:"0.1.0"},
    actionId:aggregateOperationId
  };
}

test("CV06 Human and Personal Agent use the same real Dictionary Owner aggregate, never page totals",async()=>{
  const env=fixture();
  const query={view:"all",search:"Supplier",sort:"displayName",direction:"asc",page:99,pageSize:1};
  const human=await env.router.execute(aggregateRequest(query),requestContext());
  assert.equal(human.ok,true,JSON.stringify(human.error));
  const data=human.result.data;
  assert.equal(data.metricId,"dictionary.count.by-state");
  assert.equal(data.scope,"AUTHORIZED_ALL_MATCHING_ROWS");
  assert.equal(data.countKind,"SUPPRESSED");
  assert.equal(data.total,null);
  assert.deepEqual(data.buckets,[
    {key:"DRAFT",count:0,countKind:"EXACT"},
    {key:"PUBLISHED",count:null,countKind:"SUPPRESSED"}
  ]);
  assert.equal(JSON.stringify(data).includes("Private label"),false);
  assert.equal(JSON.stringify(data).includes(contextId),false);

  const regs=env.agent(requestContext());
  const found=await tool(regs,PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID)
    .execute({query:"dictionary"},[]);
  assert.ok(found.items.some(x=>x.operationId===aggregateOperationId));
  const described=await tool(regs,PERSONAL_AGENT_CAPABILITY_DESCRIBE_TOOL_ID)
    .execute({operationId:aggregateOperationId},[]);
  assert.equal(described.operation.effect,"READ");
  const invoked=await tool(regs,PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID)
    .execute({operationId:aggregateOperationId,input:query},[]);
  const agent=invoked.result.data;
  assert.deepEqual(agent.buckets,data.buckets);
  assert.equal(agent.total,data.total);
  assert.equal(agent.metricId,data.metricId);
  assert.equal(agent.countKind,data.countKind);

  const first=await env.router.execute(
    aggregateRequest({...query,page:0,pageSize:25}),requestContext());
  assert.equal(first.ok,true);
  assert.deepEqual(first.result.data.buckets,data.buckets);
  assert.equal(first.result.data.total,data.total);
  await assert.rejects(()=>tool(regs,PERSONAL_AGENT_COLLECTION_READ_PREVIEW_TOOL_ID)
    .execute({operationId:aggregateOperationId,input:query},[]),
    /PERSONAL_AGENT_COLLECTION_PREVIEW_NOT_SUPPORTED/);
  await assert.rejects(()=>tool(regs,PERSONAL_AGENT_CAPABILITY_INVOKE_WRITE_TOOL_ID)
    .execute({operationId:aggregateOperationId,input:query},[]),
    /PERSONAL_AGENT_CAPABILITY_EFFECT_MISMATCH/);
});

test("CV06 aggregate authorization is independently revoked for tenant, policy and feature",async()=>{
  const env=fixture();
  const args={operationId:aggregateOperationId,input:{view:"all",pageSize:1}};
  const authorized=tool(env.agent(requestContext()),
    PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID);
  assert.equal((await authorized.execute(args,[])).result.data.countKind,"SUPPRESSED");
  const other=env.agent(requestContext("HUMAN",{
    enterpriseId:"other",contextId:"enterprise-context:other"
  }));
  const search=await tool(other,PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID)
    .execute({query:"aggregate"},[]);
  assert.ok(!search.items.some(x=>x.operationId===aggregateOperationId));
  await assert.rejects(()=>tool(other,PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID)
    .execute(args,[]),/PERSONAL_AGENT_CAPABILITY_NOT_AVAILABLE/);
  const otherHuman=await env.router.execute(aggregateRequest(args.input),requestContext("HUMAN",{
    enterpriseId:"other",contextId:"enterprise-context:other"
  }));
  assert.equal(otherHuman.ok,false);

  env.setAllowed(false);
  const revoked=await env.router.execute(aggregateRequest(args.input),requestContext());
  assert.equal(revoked.ok,false);
  await assert.rejects(()=>authorized.execute(args,[]),
    /PERSONAL_AGENT_CAPABILITY_NOT_AVAILABLE/);
  env.setAllowed(true);
  env.manager.disable(packageId);
  const disabled=await env.router.execute(aggregateRequest(args.input),requestContext());
  assert.equal(disabled.ok,false);
  await assert.rejects(()=>authorized.execute(args,[]),
    /PERSONAL_AGENT_CAPABILITY_NOT_AVAILABLE/);
});

test("CV06 Eidos chart renders only separately authorized complete Owner aggregate, never current page",async()=>{
  const env=fixture(),context=requestContext();
  const selection={view:"all",query:{page:0,pageSize:1}};
  const page=createBusinessDictionaryDirectoryPageV010({
    dictionaries:env.repository.list(contextId),
    directorySelection:selection,canManage:false,locale:"zh-CN"
  });
  assert.equal(page.table.rows.length,1);
  assert.equal(page.table.pageInfo.total,3);
  const read=await env.router.execute(aggregateRequest({view:"all",page:99,pageSize:1}),context);
  assert.equal(read.ok,true);
  assert.equal(read.result.data.total,null);
  assert.deepEqual(read.result.data.buckets.map(x=>x.count),[null,null]);
  const visible=await withCv06AuthorizedDictionaryChartV010({
    page,actionRouter:env.router,context,directorySelection:selection,locale:"zh-CN"
  });
  assert.ok(visible.authorizedChart);
  assert.equal(visible.authorizedChart.metricId,"dictionary.count.by-state");
  assert.equal(visible.authorizedChart.scope,"AUTHORIZED_ALL_MATCHING_ROWS");
  assert.equal(visible.authorizedChart.total,null);
  assert.deepEqual(visible.authorizedChart.buckets.map(x=>x.count),[null,null]);
  assert.equal(visible.table.rows.length,1,"chart must not replace list data");
  const html=renderCatalogBrowserToHtml(visible);
  assert.match(html,/data-eidos-authorized-aggregate-bars/);
  assert.match(html,/字典状态统计/);
  assert.match(html,/少于 3 条（已隐藏）/);
  assert.doesNotMatch(html,/Private label/);
  assert.equal((html.match(/data-eidos-authorized-bar-key=/g)||[]).length,2);
  assert.doesNotMatch(renderCatalogBrowserToHtml(page),
    /data-eidos-authorized-aggregate-bars/);

  env.setAllowed(false);
  const revoked=await withCv06AuthorizedDictionaryChartV010({
    page,actionRouter:env.router,context,directorySelection:selection,locale:"zh-CN"
  });
  assert.equal(revoked.authorizedChart,undefined);
  assert.deepEqual(revoked.table,page.table);
  env.setAllowed(true);
  env.manager.disable(packageId);
  const stopped=await withCv06AuthorizedDictionaryChartV010({
    page,actionRouter:env.router,context,directorySelection:selection,locale:"zh-CN"
  });
  assert.equal(stopped.authorizedChart,undefined);
});

test("CV06 chart never trusts URL/hinted private view nor a forged or mismatched Host aggregate",async()=>{
  const env=fixture(),ctx=requestContext();
  const selection={view:"published",query:{search:"Supplier",page:0,pageSize:1}};
  const base=createBusinessDictionaryDirectoryPageV010({
    dictionaries:env.repository.list(contextId),canManage:false,
    directorySelection:selection,locale:"en"
  });
  const legitimate=await withCv06AuthorizedDictionaryChartV010({
    page:base,actionRouter:env.router,context:ctx,directorySelection:selection
  });
  assert.equal(legitimate.authorizedChart.countKind,"SUPPRESSED");
  assert.equal(legitimate.authorizedChart.total,null);
  const fake={
    contractVersion:"0.1.0",kind:"business-dictionary.collection.aggregate.state",
    collectionId:"evo.business-dictionary.directory",
    schemaRef:"evo.business-dictionary.directory/0.1.0",
    metricId:"dictionary.count.by-state",dimensionFieldId:"state",
    unit:"dictionary",scope:"AUTHORIZED_ALL_MATCHING_ROWS",
    asOf:"2026-11-13T12:00:00.000Z",
    query:{view:"all",search:"Supplier"},
    privacy:{minimumVisibleBucketCount:3,suppressionApplied:false},
    countKind:"EXACT",total:999,
    buckets:[{key:"DRAFT",count:0,countKind:"EXACT"},
      {key:"PUBLISHED",count:999,countKind:"EXACT"}]
  };
  const maliciousRouter={execute:async()=>({ok:true,result:{data:fake}})};
  const forged=await withCv06AuthorizedDictionaryChartV010({
    page:base,actionRouter:maliciousRouter,context:ctx,directorySelection:selection
  });
  assert.equal(forged.authorizedChart,undefined);
  const hinted=await withCv06AuthorizedDictionaryChartV010({
    page:base,actionRouter:env.router,context:ctx,
    directorySelection:{...selection,personalViewId:"private-guess"}
  });
  assert.equal(hinted.authorizedChart,undefined);
  const wrongContext=await withCv06AuthorizedDictionaryChartV010({
    page:base,actionRouter:env.router,
    context:requestContext("HUMAN",{enterpriseId:"other",contextId:"enterprise-context:other"}),
    directorySelection:selection
  });
  assert.equal(wrongContext.authorizedChart,undefined);
});
