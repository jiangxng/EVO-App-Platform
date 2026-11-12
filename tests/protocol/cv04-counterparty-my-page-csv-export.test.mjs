import test from "node:test";
import assert from "node:assert/strict";
import {createMemoryEnterpriseResourceRepositoryV010} from "../../dist/providers/enterprise-context/resources.js";
import {createCounterpartyRepositoryV010} from "../../dist/apps/counterparty/repository.js";
import {createCounterpartyRoleRepositoryV010} from "../../dist/apps/counterparty/roles.js";
import {createResponsibilityRepositoryV010} from "../../dist/apps/responsibility/repository.js";
import {createCounterpartyProjectionServiceV010} from "../../dist/apps/counterparty/projection-service.js";
import {createCounterpartyProjectionActionHandlersV010} from "../../dist/apps/counterparty/projection-actions.js";
import {createCounterpartyProjectionPageV010} from "../../dist/apps/counterparty/page.js";
import {counterpartyAuthorizationPolicyV010} from "../../dist/apps/counterparty/authorization.js";
import {createHostStaticAuthorizationProviderV010} from "../../dist/providers/authorization/runtime.js";
import {counterpartyPackage} from "../../dist/apps/counterparty/package.js";
import {createAppActionRouter} from "../../dist/actions/router.js";
import {actionResultDownloadV010} from "../../dist/vendor/eidos/src/app-host/action-download.js";
import {renderCatalogBrowserToHtml} from "../../dist/vendor/eidos/src/catalog-browser/render.js";
import {
  COUNTERPARTY_MY_CUSTOMERS_PAGE_CSV_EXPORT_V010 as CUSTOMER_EXPORT,
  COUNTERPARTY_MY_SUPPLIERS_PAGE_CSV_EXPORT_V010 as SUPPLIER_EXPORT
} from "../../dist/apps/counterparty/constants.js";
import {
  COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010 as CUSTOMER,
  COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010 as SUPPLIER,
  COUNTERPARTY_CUSTOMER_PROJECTION_V010 as ALL_CUSTOMERS
} from "../../dist/apps/counterparty/projections.js";

const CONTEXT="enterprise-context:a";
function ctx(actorType="HUMAN", enterpriseId="ent-a", contextId=CONTEXT) {
  return {
    contractVersion:"0.1.0",correlationId:"cv04-owner-export",
    principal:{contractVersion:"0.1.0",subjectId:"seller-a",actorType,
      identityProviderId:"test",sessionId:"session-cv04"},
    scope:{contractVersion:"0.1.0",enterpriseId,userId:"seller-a"},
    context:{contractVersion:"0.1.0",
      activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
        contextId,enterpriseId},
      personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
        contextId:"personal:seller-a",ownerSubjectId:"seller-a"}}
  };
}
function req(command,values={}) {
  return {contractVersion:"0.1.0",type:"command",
    command:{code:command,inputVersion:"0.1.0"},values,
    sourceInteractionId:"evo-counterparty.projection",
    actionId:"export-current-page",requiresConfirmation:false};
}
function fixture() {
  const resources=createMemoryEnterpriseResourceRepositoryV010();
  const repository=createCounterpartyRepositoryV010(resources);
  const roles=createCounterpartyRoleRepositoryV010(resources,repository);
  const responsibilities=createResponsibilityRepositoryV010(resources);
  const records=[
    ["customer-alpha","Alpha Customer","CUSTOMER","seller-a"],
    ["customer-beta","Beta Customer","CUSTOMER","seller-a"],
    ["customer-hidden","Secret Other Customer","CUSTOMER","someone-else"],
    ["supplier-alpha","Alpha Supplier","SUPPLIER","seller-a"],
    ["supplier-beta","Beta Supplier","SUPPLIER","seller-a"],
    ["supplier-hidden","Secret Other Supplier","SUPPLIER","someone-else"]
  ];
  for(const [id,name,role,assignee] of records) {
    repository.save({contextId:CONTEXT,
      subject:{contractVersion:"0.1.0",counterpartyId:id,
        displayName:name,code:id,subjectType:"ORGANIZATION",status:"ACTIVE",
        email:"hidden-"+id+"@example.invalid",taxIdentifier:"PRIVATE-"+id},
      actorSubjectId:"owner",recordedAt:"2026-11-12T00:00:00Z"});
    roles.assign({contextId:CONTEXT,counterpartyId:id,roleCode:role,
      actorSubjectId:"owner",recordedAt:"2026-11-12T00:00:01Z"});
    responsibilities.assign({contextId:CONTEXT,
      targetRef:{objectType:"counterparty.subject",objectId:id},
      responsibilityType:role==="CUSTOMER"?"SALES_OWNER":"PROCUREMENT_OWNER",
      assigneeRef:{kind:"PRINCIPAL",id:assignee},
      effectiveFrom:"2026-11-12T00:00:00Z",actorSubjectId:"owner"});
  }
  let allow=true,active=true;
  const staticAuth=createHostStaticAuthorizationProviderV010(counterpartyAuthorizationPolicyV010);
  const service=createCounterpartyProjectionServiceV010({
    repository,roleRepository:roles,responsibilityRepository:responsibilities,
    resolveAuthorizationProvider:()=>allow?staticAuth:undefined,
    fieldIds:()=>["displayName","code","status","subjectType","countryOrRegion"]
  });
  const handlers=createCounterpartyProjectionActionHandlersV010({
    service,resolveEnterpriseRelationshipKind:(_p,id)=>id===CONTEXT?"MEMBER":undefined
  });
  const router=createAppActionRouter(handlers,()=>active);
  return {service,router,setAllow:v=>allow=v,setActive:v=>active=v};
}
async function pageFor(f,kind) {
  const projection=await f.service.read({contextId:CONTEXT,projectionId:kind,
    query:{sort:"displayName",direction:"asc",page:1,pageSize:1},
    requestContext:ctx(),enterpriseRelationshipKind:"MEMBER"});
  const page=createCounterpartyProjectionPageV010({
    projectionId:kind,counterparties:projection.counterparties,
    readableFieldIds:projection.readableFieldIds,pageInfo:projection.pageInfo,
    tableQuery:{sort:"displayName",direction:"asc",page:1,pageSize:1},
    canManage:false,locale:"zh-CN"
  });
  return {projection,page};
}

test("CV-04 My Customers and My Suppliers use one real responsibility/row/field Owner for paged CSV and Eidos", async()=>{
  const f=fixture();
  for(const [kind,command,expected,other] of [
    [CUSTOMER,CUSTOMER_EXPORT,"customer-beta","customer-alpha"],
    [SUPPLIER,SUPPLIER_EXPORT,"supplier-beta","supplier-alpha"]
  ]) {
    const {projection,page}=await pageFor(f,kind);
    assert.deepEqual(projection.counterparties.map(x=>x.counterpartyId),[expected]);
    assert.equal(projection.pageInfo.total,2,"only my two assigned relationships, not other assigned records");
    assert.equal(projection.pageInfo.hasMore,false);
    assert.ok(page.table);
    assert.deepEqual(page.table.rows.map(x=>x.itemId),[expected]);
    const action=page.actions.find(x=>x.id==="export-current-page");
    assert.equal(action.command,command);
    assert.equal(action.type,"command");
    assert.equal(action.requiresConfirmation,false);
    assert.equal(action.values.page,1);
    assert.equal(action.values.pageSize,1);
    assert.deepEqual(action.values.fieldIds,page.table.columns.map(x=>x.id));
    assert.ok(!action.values.fieldIds.includes("email"));
    assert.ok(!action.values.fieldIds.includes("taxIdentifier"));
    assert.match(renderCatalogBrowserToHtml(page),new RegExp('data-eidos-command="'+command.replaceAll(".","\\.")+'"'));
    const human=await f.router.execute(req(command,{...action.values,confirmed:false}),ctx());
    const agent=await f.router.execute(req(command,action.values),ctx("AI"));
    assert.equal(human.ok,true,JSON.stringify(human.error));
    assert.equal(agent.ok,true,JSON.stringify(agent.error));
    const download=actionResultDownloadV010(human.result);
    assert.ok(download);
    assert.equal(download.mediaType,"text/csv;charset=utf-8");
    assert.match(download.fileName,/^(my-customers|my-suppliers)-page-2\.csv$/);
    assert.ok(download.content.startsWith("\uFEFF"));
    assert.match(download.content,new RegExp(expected));
    assert.doesNotMatch(download.content,new RegExp(other+"|hidden-|PRIVATE-|Secret Other|counterpartyId|email|taxIdentifier"));
    assert.equal(download.content.split("\r\n").length,3,"one header, exactly one row");
    assert.equal(actionResultDownloadV010(agent.result).content,download.content);
    assert.deepEqual(page.table.views.map(v=>[v.id,v.selected]),[["all",false],["mine",true]]);
    assert.ok(page.items[0].primaryAction.route.includes("returnTo="));
  }
});

test("CV-04 export fails closed on missing enterprise membership, scope drift, forbidden fields, invalid query and inactive feature",async()=>{
  const f=fixture();const base={sort:"displayName",direction:"asc",page:0,pageSize:1,
    fieldIds:["displayName","code"]};
  const execute=(values,c=ctx())=>f.router.execute(req(CUSTOMER_EXPORT,values),c);
  for(const [values,code] of [
    [{...base,fieldIds:["email"]},"COUNTERPARTY_EXPORT_FIELDS_INVALID"],
    [{...base,fieldIds:["taxIdentifier"]},"COUNTERPARTY_EXPORT_FIELDS_INVALID"],
    [{...base,fieldIds:["displayName","displayName"]},"COUNTERPARTY_EXPORT_FIELDS_INVALID"],
    [{...base,fieldIds:["code","countryOrRegion","status","subjectType","displayName","email"]},"COUNTERPARTY_EXPORT_FIELDS_INVALID"],
    [{...base,search:"x",sql:"drop"},"COUNTERPARTY_QUERY_FIELD_UNSUPPORTED"],
    [{...base,sort:"email"},"COUNTERPARTY_QUERY_SORT_INVALID"],
    [{...base,pageSize:101},"COUNTERPARTY_QUERY_PAGE_SIZE_INVALID"],
    [{...base,confirmed:true},"COUNTERPARTY_EXPORT_FIELDS_INVALID"]
  ]) {
    const result=await execute(values);
    assert.equal(result.ok,false,code);
    assert.equal(result.error.code,code);
  }
  const spoof=ctx();spoof.scope.enterpriseId="ent-other";
  assert.equal((await execute(base,spoof)).error.code,"COUNTERPARTY_EXPORT_CONTEXT_DENIED");
  assert.equal((await execute(base,ctx("HUMAN","ent-b","enterprise-context:b"))).error.code,
    "COUNTERPARTY_EXPORT_CONTEXT_DENIED");
  assert.equal((await execute(base,null)).error.code,"REQUEST_CONTEXT_REQUIRED");
  f.setAllow(false);
  assert.equal((await execute(base)).error.code,"COLLECTION_CSV_FIELD_NOT_READABLE");
  f.setAllow(true);
  f.setActive(false);
  assert.equal((await execute(base)).error.code,"ACTION_FEATURE_NOT_ACTIVE");
});

test("CV-04 only My projections offer export while legacy/unpaged and all-scope behavior stays intact",async()=>{
  const f=fixture();
  const {projection,page}=await pageFor(f,CUSTOMER);
  const standard=createCounterpartyProjectionPageV010({
    projectionId:ALL_CUSTOMERS,counterparties:projection.counterparties,
    pageInfo:projection.pageInfo,readableFieldIds:projection.readableFieldIds,
    tableQuery:{sort:"displayName",page:1,pageSize:1},locale:"zh-CN"
  });
  assert.equal(standard.actions.some(x=>x.id==="export-current-page"),false);
  const legacy=createCounterpartyProjectionPageV010({
    projectionId:CUSTOMER,counterparties:projection.counterparties,locale:"zh-CN"
  });
  assert.equal(legacy.actions.some(x=>x.id==="export-current-page"),false);
  assert.equal(legacy.actions[0].id,"responsibility-scope");
  assert.ok(page.actions.some(x=>x.id==="export-current-page"));
  const operations=counterpartyPackage.features[0].contributions
    .filter(x=>x.kind==="platform.capability-operation").map(x=>x.operation);
  for(const operationId of [CUSTOMER_EXPORT,SUPPLIER_EXPORT]) {
    const op=operations.find(x=>x.operationId===operationId);
    assert.ok(op);
    assert.equal(op.effect,"READ");
    assert.equal(op.authorization.action,"counterparty.read");
    assert.equal(op.binding.commandCode,operationId);
    assert.ok(op.exposure.includes("PERSONAL_AGENT"));
    assert.equal(op.inputSchema.properties.pageSize.maximum,100);
    assert.ok(op.inputSchema.required.includes("fieldIds"));
    assert.equal(op.inputSchema.additionalProperties,false);
    assert.ok(!op.inputSchema.properties.fieldIds.items.enum.includes("email"));
  }
});
