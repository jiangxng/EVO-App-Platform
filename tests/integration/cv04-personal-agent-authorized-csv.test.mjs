import test from "node:test";
import { actionResultDownloadV010 } from "../../dist/vendor/eidos/src/app-host/action-download.js";
import assert from "node:assert/strict";
import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppActionRouter } from "../../dist/actions/router.js";
import { createCapabilityOperationActionPreExecuteV010 } from
  "../../dist/manager/capability-operation-access.js";
import {
  createPersonalAgentCapabilityToolRegistrationsV010,
  PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID,
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
const DICTIONARY_PAGE_EXPORT = "dictionary.collection.page.export.csv";
const SUPPLIER_PAGE_EXPORT = "counterparty.collection.my-suppliers.page.export.csv";
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
  let authorizationOnline=true;
  const projectionService=createCounterpartyProjectionServiceV010({
    repository:counterparty,roleRepository:roles,responsibilityRepository:responsibilities,
    resolveAuthorizationProvider:()=>authorizationOnline?auth:undefined,
    fieldIds:()=>["displayName","code","subjectType"]
  });
  const handlers=[
    ...createBusinessDictionaryActionHandlersV010({
      repository:dictionary,
      canRead:(principal,contextId)=>authorizationOnline && principal.subjectId==="seller-a" && contextId===ENT_A,
      canManage:()=>false
    }),
    ...createCounterpartyProjectionActionHandlersV010({
      service:projectionService,resolveEnterpriseRelationshipKind:()=> "MEMBER"
    })
  ];
  const router=createAppActionRouter(handlers,
    featureId=>manager.getSnapshot().activeFeatures.some(x=>x.featureId===featureId),
    createCapabilityOperationActionPreExecuteV010({
      manager,resolveAuthorizationProvider:()=>authorizationOnline?auth:undefined
    })
  );
  const agent=contextInput=>createPersonalAgentCapabilityToolRegistrationsV010({
    manager,actionRouter:router,requestContext:contextInput,
    resolveAuthorizationProvider:()=>authorizationOnline?auth:undefined
  });
  return {manager,router,agent,dictionary,counterparty,
    setAuthorizationOnline(value){authorizationOnline=value;}};
}

const csvInputs={
  [DICTIONARY_PAGE_EXPORT]:{
    view:"published",sort:"displayName",direction:"asc",page:0,pageSize:1,
    fieldIds:["dictionaryId","displayName"]
  },
  [SUPPLIER_PAGE_EXPORT]:{
    sort:"displayName",direction:"asc",page:0,pageSize:1,
    fieldIds:["displayName","code"]
  }
};

test("CV-04 actual Domain Owners: Human and Personal Agent invoke the same authorized CSV page through Host",async()=>{
  const f=setup();
  const regs=f.agent(context("ent-a","HUMAN"));
  for(const [operationId,expected,blocked] of [
    [DICTIONARY_PAGE_EXPORT,"supplier-category",["other-enterprise-only","internal-draft","Internal"]],
    [SUPPLIER_PAGE_EXPORT,"Hong Kong Supplier",["Other Supplier","supplier-other","taxIdentifier","email"]]
  ]){
    const found=await reg(regs,PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID)
      .execute({query:operationId},[]);
    assert.ok(found.items.some(x=>x.operationId===operationId),
      "Current authorized capability must be discoverable: "+operationId);
    const description=await reg(regs,PERSONAL_AGENT_CAPABILITY_DESCRIBE_TOOL_ID)
      .execute({operationId},[]);
    assert.equal(description.operation.effect,"READ");
    assert.equal(description.operation.binding.type,"ACTION_HOST");
    const human=await f.router.execute(request(operationId,csvInputs[operationId]),context());
    assert.equal(human.ok,true,JSON.stringify(human.error));
    const agent=await reg(regs,PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID)
      .execute({operationId,input:csvInputs[operationId]},[]);
    const humanDownload=actionResultDownloadV010(human.result);
    const agentDownload=actionResultDownloadV010(agent.result);
    assert.ok(humanDownload&&agentDownload,"Both real Host paths must return Eidos-compatible CSV");
    assert.equal(agentDownload.content,humanDownload.content);
    assert.equal(agentDownload.fileName,humanDownload.fileName);
    assert.equal(agentDownload.mediaType,"text/csv;charset=utf-8");
    assert.ok(agentDownload.content.startsWith("\uFEFF"));
    assert.match(agentDownload.content,new RegExp(expected));
    assert.equal(agentDownload.content.split("\r\n").length,3,
      "Exactly one current-page row plus CSV header");
    for(const forbidden of blocked){
      assert.equal(agentDownload.content.includes(forbidden),false,
        "Never leak other enterprise/hidden rows/secret columns: "+forbidden);
    }
    assert.equal(agent.result.pageInfo.rows,1);
    console.log("CV04_AGENT_HUMAN_OWNER_CSV_PARITY_PASS="+operationId);
  }
});

test("CV-04 Personal Agent cannot discover/invoke export after Enterprise change, authorization loss or Plugin disable",async()=>{
  const f=setup();
  const good=f.agent(context());
  const search=reg(good,PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID);
  const invoke=reg(good,PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID);
  const operationId=DICTIONARY_PAGE_EXPORT;
  const values=csvInputs[operationId];
  assert.ok((await search.execute({query:operationId},[])).items.some(x=>x.operationId===operationId));
  const second=f.agent(context("ent-b"));
  const other=await reg(second,PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID)
    .execute({query:operationId},[]);
  assert.equal(other.items.some(x=>x.operationId===operationId),false);
  await assert.rejects(
    ()=>reg(second,PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID)
      .execute({operationId,input:values},[]),
    /PERSONAL_AGENT_CAPABILITY_NOT_AVAILABLE/
  );
  const humanB=await f.router.execute(request(operationId,values),context("ent-b"));
  assert.equal(humanB.ok,false);
  f.setAuthorizationOnline(false);
  assert.equal((await search.execute({query:operationId},[])).items.some(x=>x.operationId===operationId),false);
  await assert.rejects(()=>invoke.execute({operationId,input:values},[]),
    /PERSONAL_AGENT_CAPABILITY_NOT_AVAILABLE/);
  const humanRevoked=await f.router.execute(request(operationId,values),context());
  assert.equal(humanRevoked.ok,false);
  f.setAuthorizationOnline(true);
  assert.ok((await search.execute({query:operationId},[])).items.some(x=>x.operationId===operationId));
  f.manager.disable("evo-business-dictionary");
  assert.equal((await search.execute({query:operationId},[])).items.some(x=>x.operationId===operationId),false);
  await assert.rejects(()=>invoke.execute({operationId,input:values},[]),
    /PERSONAL_AGENT_CAPABILITY_NOT_AVAILABLE/);
  const humanDisabled=await f.router.execute(request(operationId,values),context());
  assert.equal(humanDisabled.ok,false);
  assert.equal(humanDisabled.error.code,"ACTION_FEATURE_NOT_ACTIVE");
  console.log("CV04_AGENT_ENTERPRISE_REVOKE_FEATURE_FAILCLOSED_PASS");
});

test("CV-04 export cannot be used as Agent WRITE or bypass owner field bounds",async()=>{
  const f=setup();
  const regs=f.agent(context());
  const invoke=reg(regs,PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID);
  await assert.rejects(()=>reg(regs,"evo.capabilities.invoke.write")
    .execute({operationId:DICTIONARY_PAGE_EXPORT,input:csvInputs[DICTIONARY_PAGE_EXPORT]},[]),
    /PERSONAL_AGENT_CAPABILITY_EFFECT_MISMATCH/);
  for(const [operationId,fieldIds] of [
    [DICTIONARY_PAGE_EXPORT,["options"]],
    [SUPPLIER_PAGE_EXPORT,["email","taxIdentifier"]]
  ]){
    await assert.rejects(
      ()=>invoke.execute({operationId,input:{...csvInputs[operationId],fieldIds}},[]),
      /CAPABILITY_OPERATION_INPUT|COLLECTION_CSV_FIELD|COUNTERPARTY_EXPORT_FIELDS/
    );
  }
  console.log("CV04_AGENT_EXPORT_BOUND_FIELDS_AND_EFFECT_PASS");
});
