import test from "node:test";
import assert from "node:assert/strict";
import { createAppActionRouter } from "../../dist/actions/router.js";
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
    id => manager.getSnapshot().activatedFeatures.some(feature => feature.featureId === id),
    createCapabilityOperationActionPreExecuteV010({
      manager,resolveAuthorizationProvider:()=>provider
    })
  );
  const agent = ctx => createPersonalAgentCapabilityToolRegistrationsV010({
    manager,actionRouter:router,requestContext:ctx,
    resolveAuthorizationProvider:()=>provider
  });
  return {
    manager,router,agent,
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
