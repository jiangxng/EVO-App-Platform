import test from "node:test";
import assert from "node:assert/strict";
import { createAppActionRouter } from "../../dist/actions/router.js";
import { createBusinessDictionaryActionHandlersV010 } from "../../dist/apps/business-dictionary/actions.js";
import { createBusinessDictionaryDirectoryPageV010, parseBusinessDictionaryDirectoryRouteV010 } from "../../dist/apps/business-dictionary/page.js";
import { createBusinessDictionaryRepositoryV010 } from "../../dist/apps/business-dictionary/repository.js";
import { createMemoryEnterpriseResourceRepositoryV010 } from "../../dist/providers/enterprise-context/resources.js";
import { businessDictionaryPackage } from "../../dist/catalog/seed.js";
import { renderCatalogBrowserToHtml } from "../../dist/vendor/eidos/src/catalog-browser/render.js";
import { actionResultDownloadV010 } from "../../dist/vendor/eidos/src/app-host/action-download.js";

const command = "dictionary.collection.page.export.csv";
const contextId = "enterprise-context:cv04-owner";
function context({subjectId = "user-a", actorType = "HUMAN", enterpriseId = "enterprise-a",
  activeId = contextId} = {}) {
  return {
    contractVersion: "0.1.0",
    principal: {contractVersion: "0.1.0",subjectId,actorType,
      identityProviderId: "test",sessionId:"cv04-session"},
    scope: {contractVersion:"0.1.0",enterpriseId},
    context: {contractVersion:"0.1.0",
      personalContext: {contractVersion:"0.1.0",kind:"PERSONAL",
        contextId:"personal:"+subjectId,ownerSubjectId:subjectId},
      activeContext: {contractVersion:"0.1.0",kind:"ENTERPRISE",
        contextId:activeId,enterpriseId}
    },
    correlationId:"cv04-read"
  };
}
function request(values) {
  return {contractVersion:"0.1.0",type:"command",
    command:{code:command,inputVersion:"0.1.0"},
    actionId:"export-current-page",sourceInteractionId:"evo-business-dictionary.directory",
    requiresConfirmation:false,values};
}
function fixture() {
  const repo = createBusinessDictionaryRepositoryV010(
    createMemoryEnterpriseResourceRepositoryV010());
  const dictionaries=[];
  for (const [dictionaryId,displayName] of [
    ["d-alpha","Alpha"],["d-beta","Beta"],["d-gamma","Gamma"]
  ]) {
    repo.saveDraft({contextId,dictionaryId,displayName,
      expectedVersion:0,options:[{code:"SECRET_CODE",
        label:{default:"SECRET_OPTION"},status:"ACTIVE"}],
      actorSubjectId:"owner",recordedAt:"2026-11-12T00:00:00Z"});
    repo.publish({contextId,dictionaryId,expectedVersion:1,actorType:"HUMAN",
      actorSubjectId:"owner",recordedAt:"2026-11-12T00:00:01Z"});
    dictionaries.push(repo.get(contextId,dictionaryId));
  }
  return {repo,dictionaries};
}

test("CV-04 Dictionary page action uses original Eidos download result on exact filtered current page",async()=>{
  const {repo,dictionaries}=fixture();
  const route="/business-dictionaries?view=published&search=a&sort=displayName&direction=asc&page=1&pageSize=1";
  const page=createBusinessDictionaryDirectoryPageV010({
    dictionaries,canManage:false,locale:"zh-CN",
    directorySelection:parseBusinessDictionaryDirectoryRouteV010(route)
  });
  const exportAction=page.actions.find(x=>x.id==="export-current-page");
  assert.ok(exportAction);
  assert.equal(exportAction.command,command);
  assert.equal(exportAction.type,"command");
  assert.equal(exportAction.requiresConfirmation,false);
  assert.deepEqual(exportAction.values.fieldIds,page.table.columns.map(c=>c.id));
  assert.equal(exportAction.values.page,1);
  assert.equal(exportAction.values.pageSize,1);
  assert.equal(exportAction.values.view,"published");
  assert.equal(exportAction.values.search,"a");
  assert.deepEqual(page.table.rows.map(x=>x.itemId),["d-beta"]);
  const html=renderCatalogBrowserToHtml(page);
  assert.match(html,/data-eidos-command="dictionary\.collection\.page\.export\.csv"/);

  let active=true;
  const handlers=createBusinessDictionaryActionHandlersV010({
    repository:repo,canRead:(_principal,id)=>id===contextId,canManage:()=>false
  });
  const actionRouter=createAppActionRouter(handlers,()=>active);
  const res=await actionRouter.execute(request({
    ...exportAction.values,confirmed:false
  }),context());
  assert.equal(res.ok,true,JSON.stringify(res.error));
  const download=actionResultDownloadV010(res.result);
  assert.ok(download);
  assert.equal(download.fileName,"business-dictionaries-page-2.csv");
  assert.equal(download.mediaType,"text/csv;charset=utf-8");
  assert.ok(download.content.startsWith("\uFEFF"));
  assert.equal(download.content.split("\r\n").length,3,"header+one row+trailing newline");
  assert.match(download.content,/"d-beta"/);
  assert.doesNotMatch(download.content,/"d-alpha"|"d-gamma"|SECRET_CODE|SECRET_OPTION|contextId/);
  assert.equal(res.result.pageInfo.hasMore,true);
  const agent=await actionRouter.execute(request(exportAction.values),context({actorType:"AI"}));
  assert.equal(agent.ok,true);
  assert.equal(actionResultDownloadV010(agent.result).content,download.content,
    "Human and Agent use the same currently authorized Collection page");

  active=false;
  const disabled=await actionRouter.execute(request(exportAction.values),context());
  assert.equal(disabled.ok,false);
  assert.equal(disabled.error.code,"ACTION_FEATURE_NOT_ACTIVE");
});

test("CV-04 Dictionary export denies forged columns, query, absent membership and wrong Enterprise",async()=>{
  const {repo,dictionaries}=fixture();
  let allowed=true;
  const handlers=createBusinessDictionaryActionHandlersV010({
    repository:repo,
    canRead:(_principal,id)=>allowed&&id===contextId,
    canManage:()=>false
  });
  const execute=(values,c=context())=>
    handlers.find(h=>h.commandCode===command).execute(request(values),c);
  const base={view:"all",sort:"displayName",direction:"asc",page:0,pageSize:2,
    fieldIds:["dictionaryId","displayName"]};
  assert.equal((await execute(base)).ok,true);
  for(const [values,code] of [
    [{...base,fieldIds:["options"]},"COLLECTION_CSV_FIELD_NOT_READABLE"],
    [{...base,fieldIds:["contextId"]},"COLLECTION_CSV_FIELD_NOT_READABLE"],
    [{...base,fieldIds:["displayName","displayName"]},"COLLECTION_CSV_FIELDS_INVALID"],
    [{...base,sql:"SELECT *"},"COLLECTION_QUERY_FIELD_UNSUPPORTED"],
    [{...base,pageSize:101},"COLLECTION_QUERY_PAGE_SIZE_INVALID"],
    [{...base,confirmed:true},"BUSINESS_DICTIONARY_CSV_INPUT_INVALID"]
  ]) {
    const result=await execute(values);
    assert.equal(result.ok,false);
    assert.equal(result.error.code,code);
  }
  assert.equal((await execute(base,undefined)).ok,false);
  const cross=context({activeId:"enterprise-context:other",enterpriseId:"enterprise-b"});
  assert.equal((await execute(base,cross)).error.code,"BUSINESS_DICTIONARY_PERMISSION_DENIED");
  const spoof=context();spoof.scope.enterpriseId="enterprise-other";
  assert.equal((await execute(base,spoof)).error.code,"BUSINESS_DICTIONARY_ENTERPRISE_CONTEXT_REQUIRED");
  allowed=false;
  assert.equal((await execute(base)).error.code,"BUSINESS_DICTIONARY_PERMISSION_DENIED");
  assert.ok(dictionaries.length===3);
});

test("CV-04 export is registered as bounded READ Capability Operation; legacy dictionary routes untouched",()=>{
  const contributions=businessDictionaryPackage.features[0].contributions
    .filter(x=>x.kind==="platform.capability-operation").map(x=>x.operation);
  const operation=contributions.find(x=>x.operationId===command);
  assert.ok(operation);
  assert.equal(operation.binding.commandCode,command);
  assert.equal(operation.effect,"READ");
  assert.equal(operation.authorization.action,"dictionary.read");
  assert.ok(operation.exposure.includes("HUMAN"));
  assert.ok(operation.exposure.includes("PERSONAL_AGENT"));
  assert.ok(operation.inputSchema.additionalProperties===false);
  assert.equal(operation.inputSchema.properties.pageSize.maximum,100);
  assert.equal(operation.inputSchema.properties.fieldIds.maxItems,20);
  assert.equal(operation.inputSchema.properties.fieldIds.items.enum.includes("options"),false);
  assert.ok(contributions.some(x=>x.operationId==="dictionary.collection.query"));
  assert.ok(contributions.some(x=>x.operationId==="dictionary.list"));
  assert.equal(createBusinessDictionaryDirectoryPageV010({
    dictionaries:[],canManage:false
  }).actions.length,0,"legacy unpaged callers never receive export with arbitrary scope");
});
