import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import postgres from "postgres";
import {renderCatalogBrowserToHtml}
  from "../../dist/vendor/eidos/src/catalog-browser/render.js";
import {parseBusinessDictionaryDirectoryRouteV010}
  from "../../dist/apps/business-dictionary/directory-query.js";
import {createCv03AuthorizedDictionarySavedViewPageV010}
  from "../../dist/manager/cv03-personal-saved-view-dictionary-presentation.js";
import {createAppActionRouter} from "../../dist/actions/router.js";
import {createPackageCatalog} from "../../dist/catalog/catalog.js";
import {businessDictionaryPackage} from "../../dist/catalog/seed.js";
import {createMemoryLifecycleStore} from "../../dist/manager/store.js";
import {createAppManagerService} from "../../dist/manager/service.js";
import {createCv03PersonalSavedViewHostReceiptIssuerV010}
  from "../../dist/manager/cv03-personal-saved-view-host-issuer.js";
import {createCapabilityOperationActionPreExecuteV010}
  from "../../dist/manager/capability-operation-access.js";
import {hostEnterpriseContextProviderPackage}
  from "../../dist/providers/enterprise-context/package.js";
import {
  createPostgresConditionalResourceRepositoryV010,
  preparePostgresConditionalResourceSchemaV010
} from "../../dist/providers/enterprise-context/resources-postgres.js";
import {createMemoryEnterpriseResourceRepositoryV010}
  from "../../dist/providers/enterprise-context/resources.js";
import {createBusinessDictionaryRepositoryV010}
  from "../../dist/apps/business-dictionary/repository.js";
import {createBusinessDictionaryActionHandlersV010}
  from "../../dist/apps/business-dictionary/actions.js";
import {
  personalSavedViewsOptInFeatureV010,
  createPersonalSavedViewActionHandlersV010,
  PERSONAL_SAVED_VIEW_READ_V010,
  PERSONAL_SAVED_VIEW_WRITE_V010
} from "../../dist/providers/enterprise-context/personal-saved-views.js";
import {
  createPersonalAgentCapabilityToolRegistrationsV010,
  PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID,
  PERSONAL_AGENT_CAPABILITY_INVOKE_WRITE_TOOL_ID,
  PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID
} from "../../dist/agents/enterprise-agent/capability-fabric-tools.js";

const url=process.env.CV03_RESOURCE_PROOF_DATABASE_URL;
const TEST_SIGNER={keyId:"cv03-test-v1",
  secret:"CV03-ISOLATED-TEST-KEY-NOT-A-PRODUCTION-SECRET-01"};
const dbRequired={skip:!url&&"Set CV03_RESOURCE_PROOF_DATABASE_URL for isolated PostgreSQL 18",
  timeout:60000};
const dictionaryOp="dictionary.collection.query";
const context=(subject="owner-a",enterprise="one",overrides={})=>({
  contractVersion:"0.1.0",
  principal:{contractVersion:"0.1.0",actorType:"HUMAN",subjectId:subject,
    identityProviderId:"cv03.test.identity",sessionId:subject+"-session"},
  scope:{contractVersion:"0.1.0",enterpriseId:enterprise,userId:subject},
  context:{
    contractVersion:"0.1.0",
    personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
      contextId:"personal:"+subject,ownerSubjectId:subject},
    activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
      contextId:"enterprise-context:"+enterprise,enterpriseId:enterprise}
  },
  correlationId:"cv03-"+subject+"-"+enterprise,...overrides
});
function command(op,values){
  return {contractVersion:"0.1.0",type:"command",
    command:{code:op,inputVersion:"0.1.0"},
    values,sourceInteractionId:"cv03-human-test",actionId:op,requiresConfirmation:false};
}
function testTool(regs,id){
  const tool=regs.find(x=>x.descriptor.id===id);
  assert.ok(tool,"missing tool "+id);
  return tool;
}
function fixture(storage){
  const resources=createMemoryEnterpriseResourceRepositoryV010();
  const dictionary=createBusinessDictionaryRepositoryV010(resources);
  for(const ent of ["one","two"]){
    dictionary.saveDraft({
      contextId:"enterprise-context:"+ent,dictionaryId:"HK-SUP",
      displayName:ent+" Hong Kong Suppliers",expectedVersion:0,
      options:[{code:"TEST",label:{default:"Internal private option"},status:"ACTIVE"}],
      actorSubjectId:"owner-a",recordedAt:"2026-11-09T00:00:00.000Z"
    });
  }
  const hostPkg={
    ...hostEnterpriseContextProviderPackage,
    features:[...hostEnterpriseContextProviderPackage.features,personalSavedViewsOptInFeatureV010]
  };
  const manager=createAppManagerService(createPackageCatalog([hostPkg,businessDictionaryPackage]),
    createMemoryLifecycleStore());
  manager.install(hostPkg.packageId);
  manager.install(businessDictionaryPackage.packageId);
  let readAllowed=true,writeAllowed=true,receiptAllowed=true,schemaChanged=false;
  const policy={
    providerId:"cv03.test.authority",
    check({principal,scope,action}){
      const allowed=Boolean(principal.subjectId && ["one","two"].includes(scope.enterpriseId))
        && ((action==="dictionary.read"&&readAllowed) ||
          action==="collection.saved-view.read" ||
          (action==="collection.saved-view.write"&&writeAllowed));
      return {contractVersion:"0.1.0",allowed,policyProviderId:"cv03.test.authority",
        reasonCodes:[allowed?"CV03_ALLOWED":"CV03_DENIED"]};
    }
  };
  const hostIssue=createCv03PersonalSavedViewHostReceiptIssuerV010({
    manager,resolveAuthorizationProvider:()=>policy,
    signingKeyId:TEST_SIGNER.keyId,signingSecret:TEST_SIGNER.secret
  });
  let issuedMaterial;
  let router;
  const dictionaryHandlers=createBusinessDictionaryActionHandlersV010({
    repository:dictionary,
    canRead:(_principal,contextId)=>readAllowed &&
      ["enterprise-context:one","enterprise-context:two"].includes(contextId),
    canManage:()=>false
  });
  const savedHandlers=createPersonalSavedViewActionHandlersV010({
    storage,
    allowedSourceOperationIds:[dictionaryOp],
    now:()=>new Date("2026-11-09T05:00:00.000Z"),
    issueHostWriteReceipt:async (ctx,request,material)=>{
      // The real Host-specific issuer rechecks live Capability Operation
      // authorization and signs exact material. This remains isolated test
      // wiring, NOT a registration in production manager/server.ts.
      if(!receiptAllowed)throw Error("SAVED_VIEW_HOST_RECEIPT_DENIED");
      issuedMaterial={ctx,request,material};
      return hostIssue(ctx,request,material);
    },
    async readSource(ctx,op,query) {
      if(op!==dictionaryOp)throw Error("SAVED_VIEW_SOURCE_NOT_ALLOWED");
      const result=await router.execute(command(dictionaryOp,{
        ...query,page:0,pageSize:10
      }),ctx);
      if(!result.ok)throw Error("SAVED_VIEW_SOURCE_DENIED");
      const data=result.result?.data;
      return schemaChanged?{...data,schemaRef:"changed/9.0.0"}:data;
    }
  });
  router=createAppActionRouter([...dictionaryHandlers,...savedHandlers],
    feature=>manager.getSnapshot().activeFeatures.some(x=>x.featureId===feature),
    createCapabilityOperationActionPreExecuteV010({
      manager,resolveAuthorizationProvider:()=>policy
    }));
  return {
    manager,router,dictionary,hostIssue,lastIssued:()=>issuedMaterial,agents:ctx=>createPersonalAgentCapabilityToolRegistrationsV010({
      manager,actionRouter:router,requestContext:ctx,
      resolveAuthorizationProvider:()=>policy
    }),
    control:{
      revokeSource:()=>{readAllowed=false;},
      allowSource:()=>{readAllowed=true;},
      revokeWrite:()=>{writeAllowed=false;},
      revokeReceipt:()=>{receiptAllowed=false;},
      schemaChanged:()=>{schemaChanged=true;}
    }
  };
}
const save=(viewId="hk-sup",expectedRevision=null,extra={})=>({
  viewId,title:"我的香港供应商",queryOperationId:dictionaryOp,
  query:{view:"all",search:"Hong Kong",sort:"displayName",direction:"asc"},
  columns:["dictionaryId","displayName"],
  presentation:"table",expectedRevision,...extra
});
function dataOf(result){
  assert.equal(result.ok,true,JSON.stringify(result.error));
  return result.result.data;
}
async function toolInvoke(env,ctx,id,op,input){
  return testTool(env.agents(ctx),id).execute({operationId:op,input},[]);
}

test("CV-03 C3-02: Human and Personal Agent WRITE share real Dictionary owner, live Host grants, private scope, durable PG",dbRequired,async()=>{
  const schema="cv03_saved_"+randomUUID().replaceAll("-","").slice(0,16);
  await preparePostgresConditionalResourceSchemaV010({connectionString:url,schema});
  const storage=createPostgresConditionalResourceRepositoryV010({
    connectionString:url,schema,trustedHostReceiptKeys:[TEST_SIGNER]
  });
  const sql=postgres(url,{max:2,connect_timeout:10});
  try{
    const env=fixture(storage);
    const alice=context();
    // This is a real PG authority: without a trusted Host receipt issuer,
    // the feature must still reject writes even when source/storage are valid.
    const missingReceipt=createPersonalSavedViewActionHandlersV010({
      storage,allowedSourceOperationIds:[dictionaryOp],
      readSource:async()=>{throw Error("SOURCE_MUST_NOT_BE_INVOKED_WITHOUT_RECEIPT");}
    })[1];
    const noReceipt=await missingReceipt.execute(command(
      PERSONAL_SAVED_VIEW_WRITE_V010,save("without-receipt",null)
    ),alice);
    assert.equal(noReceipt.error.code,"SAVED_VIEW_HOST_WRITE_RECEIPT_REQUIRED");
    const bob=context("owner-b");
    const otherEnterprise=context("owner-a","two");
    const human=dataOf(await env.router.execute(command(PERSONAL_SAVED_VIEW_WRITE_V010,save()),alice));
    assert.equal(human.view.revision,0);
    assert.equal(human.replayed,false);
    assert.equal(human.receipt.status,"SUCCEEDED");
    const issued=env.lastIssued();
    assert.match((await env.hostIssue(issued.ctx,issued.request,issued.material))
      .proof.signature,/^[a-f0-9]{64}$/);
    await assert.rejects(
      ()=>env.hostIssue(issued.ctx,issued.request,{
        ...issued.material,inputDigest:"0".repeat(64)
      }),/CV03_HOST_RECEIPT_CONTEXT_OR_DIGEST_INVALID/);
    await assert.rejects(
      ()=>env.hostIssue(context("owner-b"),issued.request,issued.material),
      /CV03_HOST_RECEIPT_CONTEXT_OR_DIGEST_INVALID/);
    const repeat=dataOf(await env.router.execute(command(PERSONAL_SAVED_VIEW_WRITE_V010,save()),alice));
    assert.equal(repeat.replayed,true);
    assert.equal(repeat.receipt.receiptId,human.receipt.receiptId);
    assert.equal(repeat.view.revision,0);
    assert.equal(human.view.ownerSubjectId,"owner-a");
    assert.equal(human.view.visibility,"PERSONAL");
    assert.equal(human.view.schemaRef,"evo.business-dictionary.directory/0.1.0");
    assert.equal("rows" in human.view,false);
    assert.equal("options" in human.view,false);

    const agentRegs=env.agents(alice);
    const discovered=await testTool(agentRegs,PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID)
      .execute({query:"saved view"},[]);
    assert.ok(discovered.items.some(x=>x.operationId===PERSONAL_SAVED_VIEW_WRITE_V010));
    const agentUpdate=await toolInvoke(env,alice,
      PERSONAL_AGENT_CAPABILITY_INVOKE_WRITE_TOOL_ID,PERSONAL_SAVED_VIEW_WRITE_V010,
      save("hk-sup",0,{title:"香港供应商｜代理更新"}));
    assert.equal(agentUpdate.result.data.view.revision,1);
    assert.equal(agentUpdate.result.data.replayed,false);
    const repeatedAgent=await toolInvoke(env,alice,
      PERSONAL_AGENT_CAPABILITY_INVOKE_WRITE_TOOL_ID,PERSONAL_SAVED_VIEW_WRITE_V010,
      save("hk-sup",0,{title:"香港供应商｜代理更新"}));
    assert.equal(repeatedAgent.result.data.replayed,true);
    assert.equal(repeatedAgent.result.data.view.revision,1);
    assert.equal(agentUpdate.result.data.view.title,"香港供应商｜代理更新");
    const readAgent=await toolInvoke(env,alice,
      PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID,PERSONAL_SAVED_VIEW_READ_V010,{});
    const readHuman=dataOf(await env.router.execute(command(PERSONAL_SAVED_VIEW_READ_V010,{}),alice));
    assert.deepEqual(readAgent.result.data.views,readHuman.views);
    assert.equal(readHuman.views.length,1);
    assert.equal(readHuman.views[0].revision,1);

    assert.equal(dataOf(await env.router.execute(command(PERSONAL_SAVED_VIEW_READ_V010,{}),bob)).views.length,0);
    assert.equal(dataOf(await env.router.execute(command(PERSONAL_SAVED_VIEW_READ_V010,{viewId:"hk-sup"}),bob)).views.length,0);
    assert.equal(dataOf(await env.router.execute(command(PERSONAL_SAVED_VIEW_READ_V010,{}),otherEnterprise)).views.length,0);
    assert.equal(dataOf(await env.router.execute(command(PERSONAL_SAVED_VIEW_WRITE_V010,save()),bob)).view.revision,0);
    assert.equal(dataOf(await env.router.execute(command(PERSONAL_SAVED_VIEW_WRITE_V010,save()),otherEnterprise)).view.revision,0);
    const stale=await env.router.execute(command(PERSONAL_SAVED_VIEW_WRITE_V010,save("hk-sup",0)),alice);
    assert.equal(stale.error.code,"ENTERPRISE_RESOURCE_REVISION_CONFLICT");

    const forged=await env.router.execute(command(PERSONAL_SAVED_VIEW_WRITE_V010,save("attack",null,{ownerSubjectId:"owner-b"})),alice);
    assert.equal(forged.error.code,"SAVED_VIEW_INPUT_INVALID");
    const shared=await env.router.execute(command(PERSONAL_SAVED_VIEW_WRITE_V010,save("shared",null,{visibility:"ENTERPRISE"})),alice);
    assert.equal(shared.error.code,"SAVED_VIEW_INPUT_INVALID");
    const hidden=await env.router.execute(command(PERSONAL_SAVED_VIEW_WRITE_V010,save("hidden",null,{columns:["options"]})),alice);
    assert.equal(hidden.error.code,"SAVED_VIEW_COLUMNS_FORBIDDEN");
    const injected=await env.router.execute(command(PERSONAL_SAVED_VIEW_WRITE_V010,save("sql",null,{query:{sql:"SELECT * FROM x"}})),alice);
    assert.equal(injected.error.code,"SAVED_VIEW_QUERY_INVALID");
    const wrongSource=await env.router.execute(command(PERSONAL_SAVED_VIEW_WRITE_V010,save("list",null,{queryOperationId:"dictionary.list"})),alice);
    assert.equal(wrongSource.error.code,"SAVED_VIEW_SOURCE_NOT_ALLOWED");

    env.control.revokeWrite();
    await assert.rejects(()=>env.hostIssue(issued.ctx,issued.request,issued.material),
      /CV03_HOST_RECEIPT_AUTHORIZATION_DENIED/);
    const revoked=await env.router.execute(command(PERSONAL_SAVED_VIEW_WRITE_V010,save("revoked",null)),alice);
    assert.equal(revoked.ok,false);
    await assert.rejects(()=>toolInvoke(env,alice,PERSONAL_AGENT_CAPABILITY_INVOKE_WRITE_TOOL_ID,
      PERSONAL_SAVED_VIEW_WRITE_V010,save("revoked",null)),/PERSONAL_AGENT_CAPABILITY_NOT_AVAILABLE/);
    env.control.revokeSource();
    assert.equal(dataOf(await env.router.execute(command(PERSONAL_SAVED_VIEW_READ_V010,{}),alice)).views.length,0);
    env.control.allowSource();
    env.control.schemaChanged();
    assert.equal(dataOf(await env.router.execute(command(PERSONAL_SAVED_VIEW_READ_V010,{}),alice)).views.length,0);
    // Respect the existing dependency lifecycle: disable the dependent
    // Dictionary before its Enterprise Context provider package.
    env.manager.disable(businessDictionaryPackage.packageId);
    env.manager.disable(hostEnterpriseContextProviderPackage.packageId);
    await assert.rejects(()=>env.hostIssue(issued.ctx,issued.request,issued.material),
      /CV03_HOST_RECEIPT_OPERATION_INACTIVE/);
    assert.equal((await env.router.execute(command(PERSONAL_SAVED_VIEW_READ_V010,{}),alice)).error.code,
      "ACTION_FEATURE_NOT_ACTIVE");

    // Restart with independent database connection, no in-process saved-view data.
    const reopened=createPostgresConditionalResourceRepositoryV010({
      connectionString:url,schema,trustedHostReceiptKeys:[TEST_SIGNER]
    });
    try {
      const next=fixture(reopened);
      assert.equal(dataOf(await next.router.execute(command(PERSONAL_SAVED_VIEW_READ_V010,{}),alice)).views[0].revision,1);
      next.control.revokeReceipt();
      const blocked=await next.router.execute(command(PERSONAL_SAVED_VIEW_WRITE_V010,save("not-committed",null)),alice);
      assert.equal(blocked.error.code,"SAVED_VIEW_HOST_RECEIPT_DENIED");
      assert.equal(dataOf(await next.router.execute(command(PERSONAL_SAVED_VIEW_READ_V010,{}),alice)).views.length,1);
    }finally{await reopened.close();}
    console.log("CV03_C302_PERSONAL_VIEW_REAL_HOST_AGENT_PG_PROOF=PASS");
  }finally{
    await storage.close();
    await sql.unsafe('DROP SCHEMA "'+schema+'" CASCADE');
    await sql.end();
  }
});

test("CV-03 C3-02 Host-resolved private view READ feeds real Eidos Dictionary table without leaking cross-principal tabs",dbRequired,async()=>{
  const schema="cv03_page_"+randomUUID().replaceAll("-","").slice(0,16);
  await preparePostgresConditionalResourceSchemaV010({connectionString:url,schema});
  const store=createPostgresConditionalResourceRepositoryV010({connectionString:url,schema});
  const sql=postgres(url,{max:2,connect_timeout:10});
  try {
    const env=fixture(store);
    const alice=context("owner-a","one");
    const selection=parseBusinessDictionaryDirectoryRouteV010(
      "/business-dictionaries?view=all&search=Hong+Kong&sort=displayName&direction=asc&page=0&pageSize=25"
    );
    assert.equal(dataOf(await env.router.execute(command(
      PERSONAL_SAVED_VIEW_WRITE_V010,save("hk-views",null)
    ),alice)).view.revision,0);
    const render=ctx=>createCv03AuthorizedDictionarySavedViewPageV010({
      actionRouter:env.router,context:ctx,
      dictionaries:env.dictionary.list("enterprise-context:one"),
      directorySelection:selection,
      canManage:false,locale:"zh-CN",selectedPersonalViewId:"hk-views"
    });
    const page=await render(alice);
    assert.deepEqual(page.table.views.map(v=>v.id),[
      "all","draft","published","personal:hk-views"
    ]);
    assert.deepEqual(page.table.views.filter(v=>v.selected).map(v=>v.id),["personal:hk-views"]);
    assert.equal(page.table.rows.length,1);
    const html=renderCatalogBrowserToHtml(page);
    assert.match(html,/data-eidos-catalog-view-id="personal:hk-views"/);
    assert.doesNotMatch(html,/Internal private option/);
    const bob=await render(context("owner-b","one"));
    assert.deepEqual(bob.table.views.map(v=>v.id),["all","draft","published"]);
    const other=await render(context("owner-a","two"));
    assert.deepEqual(other.table.views.map(v=>v.id),["all","draft","published"]);
    env.control.revokeSource();
    const revoked=await render(alice);
    assert.deepEqual(revoked.table.views.map(v=>v.id),["all","draft","published"]);
    env.control.allowSource();
    env.manager.disable(businessDictionaryPackage.packageId);
    env.manager.disable(hostEnterpriseContextProviderPackage.packageId);
    const disabled=await render(alice);
    assert.deepEqual(disabled.table.views.map(v=>v.id),["all","draft","published"]);
    const missingContext=await createCv03AuthorizedDictionarySavedViewPageV010({
      actionRouter:env.router,dictionaries:env.dictionary.list("enterprise-context:one"),
      directorySelection:selection,canManage:false
    });
    assert.equal(missingContext.table,undefined);
    assert.equal(missingContext.id,"evo-business-dictionary.context-required");
    console.log("CV03_C302_EIDOS_REAL_HOST_PG_PRIVATE_VIEW_PROOF=PASS");
  }finally{
    await store.close();
    await sql.unsafe('DROP SCHEMA "'+schema+'" CASCADE');
    await sql.end();
  }
});

test("CV-03 C3-02: production unregistered and fake receipt/memory authority fail closed",async()=>{
  assert.equal(hostEnterpriseContextProviderPackage.features
    .some(x=>x.featureId===personalSavedViewsOptInFeatureV010.featureId),false);
  const fake={
    conditionalWriteConsistency:"PROCESS_LOCAL",
    get:async()=>undefined,list:async()=>[],
    putIfRevision:async()=>{throw Error("NEVER");},
    archiveIfRevision:async()=>{throw Error("NEVER");},close:async()=>{}
  };
  const handler=createPersonalSavedViewActionHandlersV010({
    storage:fake,allowedSourceOperationIds:[dictionaryOp],
    readSource:async()=>{throw Error("NEVER");}
  })[1];
  const r=await handler.execute(command(PERSONAL_SAVED_VIEW_WRITE_V010,save()),context());
  assert.equal(r.error.code,"SAVED_VIEW_CERTIFIED_STORAGE_REQUIRED");
});
