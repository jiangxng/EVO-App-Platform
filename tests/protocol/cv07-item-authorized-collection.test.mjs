import test from "node:test";
import assert from "node:assert/strict";
import { renderCatalogBrowserToHtml } from "../../dist/vendor/eidos/src/catalog-browser/render.js";
import {
  createMemoryEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";
import {
  createObjectExtensionValueRepositoryV010
} from "../../dist/apps/object-extension/values.js";
import {
  createResponsibilityRepositoryV010
} from "../../dist/apps/responsibility/repository.js";
import { createItemRepositoryV010 } from "../../dist/apps/item/repository.js";
import { createItemProjectionServiceV010 } from "../../dist/apps/item/projection-service.js";
import {
  createItemProjectionPageV010, createItemDetailPageV010
} from "../../dist/apps/item/page.js";
import {
  parseItemCollectionRouteV010, itemCollectionQueryRouteV010
} from "../../dist/apps/item/collection-query.js";
import {
  ITEM_DIRECTORY_PROJECTION_V010,
  ITEM_MY_ITEMS_PROJECTION_V010,
  ITEM_STEWARD_RESPONSIBILITY_V010
} from "../../dist/apps/item/projections.js";
import {
  ITEM_DIRECTORY_COLLECTION_QUERY_V010,
  ITEM_MY_ITEMS_COLLECTION_QUERY_V010
} from "../../dist/apps/item/constants.js";
import { createItemProjectionActionHandlersV010 } from "../../dist/apps/item/projection-actions.js";
import { itemProjectionCapabilityContributionsV010 } from "../../dist/apps/item/capability-manifest.js";
import { itemAuthorizationPolicyV010 } from "../../dist/apps/item/authorization.js";
import {
  createHostStaticAuthorizationProviderV010,
  mergeHostStaticAuthorizationPoliciesV010
} from "../../dist/providers/authorization/runtime.js";

function ctx(subjectId="member-a", scopeId="ent-a") {
  return {
    contractVersion:"0.1.0",
    principal:{contractVersion:"0.1.0",subjectId,actorType:"HUMAN",
      identityProviderId:"test.identity",sessionId:"session-"+subjectId},
    scope:{contractVersion:"0.1.0",enterpriseId:scopeId,userId:subjectId},
    context:{
      contractVersion:"0.1.0",
      personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
        contextId:"personal:"+subjectId,ownerSubjectId:subjectId},
      activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
        contextId:"enterprise-context:a",enterpriseId:"ent-a"},
      enterpriseContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
        contextId:"enterprise-context:a",enterpriseId:"ent-a",
        enterpriseProviderId:"test.enterprise"}
    },
    correlationId:"cv07-item-third-owner"
  };
}
function item(id,name,code) {
  return {contractVersion:"0.1.0",itemId:id,displayName:name,
    code,itemKind:"GOODS",baseUomCode:"C62",
    description:"PRIVATE EXTRA "+id};
}
function fixture(policy=itemAuthorizationPolicyV010) {
  const resources=createMemoryEnterpriseResourceRepositoryV010();
  const items=createItemRepositoryV010(resources);
  const responsibilities=createResponsibilityRepositoryV010(resources);
  const extensions=createObjectExtensionValueRepositoryV010(resources);
  for(const record of [
    item("item-a","Hong Kong Apple","SEC-A"),
    item("item-b","Hong Kong Banana","SEC-B"),
    item("item-c","Tokyo Pear","SEC-C")
  ]) items.save({
    contextId:"enterprise-context:a",item:record,
    actorSubjectId:"owner-a",recordedAt:"2026-11-19T00:00:00Z"
  });
  responsibilities.assign({
    contextId:"enterprise-context:a",
    targetRef:{objectType:"item.subject",objectId:"item-b"},
    responsibilityType:ITEM_STEWARD_RESPONSIBILITY_V010,
    assigneeRef:{kind:"PRINCIPAL",id:"member-a"},
    effectiveFrom:"2026-11-19T00:00:00Z",
    actorSubjectId:"owner-a"
  });
  return createItemProjectionServiceV010({
    repository:items,responsibilityRepository:responsibilities,
    extensionValueRepository:extensions,
    resolveAuthorizationProvider:() => createHostStaticAuthorizationProviderV010(policy),
    fieldIds:()=>["itemId","displayName","code","itemKind","baseUomCode","description"]
  });
}
function request(commandCode, values={}) {
  return {
    contractVersion:"0.1.0",type:"command",
    command:{code:commandCode,inputVersion:"0.1.0"},
    values,sourceInteractionId:"cv07",actionId:"read",
    requiresConfirmation:false
  };
}

test("CV07 third owner Item: authorized query paginates before Eidos without new renderer",async()=>{
  const service=fixture();
  const query={search:"Hong Kong",sort:"displayName",direction:"desc",page:0,pageSize:1};
  const result=await service.read({
    contextId:"enterprise-context:a",requestContext:ctx(),
    enterpriseRelationshipKind:"MEMBER",
    projectionId:ITEM_DIRECTORY_PROJECTION_V010,
    query
  });
  assert.equal(result.collection.pageInfo.total,2);
  assert.equal(result.collection.pageInfo.hasMore,true);
  assert.deepEqual(result.collection.rows.map(r=>r.rowId),["item-b"]);
  const page=createItemProjectionPageV010({
    projectionId:ITEM_DIRECTORY_PROJECTION_V010,
    records:result.items,readableFieldIds:result.readableFieldIds,
    pageInfo:result.collection.pageInfo,tableQuery:query,locale:"zh-CN",
    canManage:false
  });
  assert.deepEqual(page.table.rows.map(r=>r.itemId),["item-b"]);
  assert.equal(page.table.views[0].selected,true);
  assert.equal(page.table.views[1].selected,false);
  assert.equal(page.table.pageInfo.total,2);
  assert.ok(page.table.pageInfo.nextRoute.includes("page=1"));
  const html=renderCatalogBrowserToHtml(page);
  const detailRoute=page.items[0].primaryAction.route;
  const returnRoute=new URL(detailRoute,"https://evo.invalid").searchParams.get("returnTo");
  assert.ok(returnRoute?.startsWith("/items?search=Hong+Kong"));
  const detail=createItemDetailPageV010({
    record:result.items[0],
    readableFieldIds:result.readableFieldIds,
    returnRoute,canManage:false
  });
  assert.equal(detail.contextNavigation.items[0].route,returnRoute,
    "Item detail must retain the authorized list navigation coordinates");
  assert.match(html,/data-eidos-catalog-table/);
  assert.match(html,/data-eidos-catalog-server-search/);
  assert.doesNotMatch(html,/data-eidos-catalog-search-input/);
  const next=await service.read({
    contextId:"enterprise-context:a",requestContext:ctx(),
    enterpriseRelationshipKind:"MEMBER",
    projectionId:ITEM_DIRECTORY_PROJECTION_V010,
    query:parseItemCollectionRouteV010(page.table.pageInfo.nextRoute,"/items")
  });
  assert.deepEqual(next.collection.rows.map(r=>r.rowId),["item-a"]);
});

test("CV07 third owner Item: My Items responsibility is intersected with current grants",async()=>{
  const service=fixture();
  const base={contextId:"enterprise-context:a",requestContext:ctx(),
    enterpriseRelationshipKind:"MEMBER",
    projectionId:ITEM_MY_ITEMS_PROJECTION_V010};
  const legacy=await service.read(base);
  assert.equal(legacy.collection,undefined,"old Item caller remains unpaged");
  assert.equal(legacy.count,1);
  const result=await service.read({...base,query:{pageSize:25,search:"Hong Kong"}});
  assert.equal(result.collection.pageInfo.total,1);
  assert.deepEqual(result.collection.rows.map(r=>r.rowId),["item-b"]);
  const routes=itemCollectionQueryRouteV010("/items/my-items",
    {search:"Hong Kong",pageSize:25},3);
  assert.equal(parseItemCollectionRouteV010(routes,"/items/my-items").page,3);
  const page=createItemProjectionPageV010({
    projectionId:ITEM_MY_ITEMS_PROJECTION_V010,records:result.items,
    readableFieldIds:result.readableFieldIds,
    pageInfo:result.collection.pageInfo,
    tableQuery:{search:"Hong Kong",pageSize:25},canManage:false
  });
  assert.equal(page.table.views[1].selected,true);
  assert.ok(page.table.views[0].route.includes("search=Hong+Kong"));
});

test("CV07 third owner Item: hidden code cannot influence search, sort or emitted cells",async()=>{
  const denied=mergeHostStaticAuthorizationPoliciesV010(
    itemAuthorizationPolicyV010,
    {contractVersion:"0.1.0",rules:[{
      id:"deny-item-code",effect:"DENY",
      actions:["item.field.read"],
      resourceTypes:["item.field"],resourceIds:["code"]
    }]}
  );
  const service=fixture(denied);
  const input={
    contextId:"enterprise-context:a",requestContext:ctx(),
    enterpriseRelationshipKind:"MEMBER",
    projectionId:ITEM_DIRECTORY_PROJECTION_V010
  };
  const rows=await service.read({...input,query:{search:"SEC-A"}});
  assert.equal(rows.collection.pageInfo.total,0);
  assert.equal(rows.collection.readableFieldIds.includes("code"),false);
  const visible=await service.read({...input,query:{search:"Hong Kong"}});
  assert.equal(visible.collection.rows.length,2);
  assert.equal("code" in visible.collection.rows[0].cells,false);
  await assert.rejects(()=>service.read({...input,query:{sort:"code"}}),
    /ITEM_COLLECTION_SORT_FORBIDDEN/);
  const page=createItemProjectionPageV010({
    projectionId:ITEM_DIRECTORY_PROJECTION_V010,
    records:visible.items,readableFieldIds:visible.readableFieldIds,
    pageInfo:visible.collection.pageInfo,tableQuery:{search:"Hong Kong"}
  });
  assert.equal(page.table.columns.some(c=>c.id==="code"),false);
  assert.doesNotMatch(renderCatalogBrowserToHtml(page),/SEC-A|SEC-B/);
});

test("CV07 third owner Item: Host Action and Agent operation share Owner collection shape; forged context denied",async()=>{
  const service=fixture();
  const handlers=createItemProjectionActionHandlersV010({
    service,resolveEnterpriseRelationshipKind:()=> "MEMBER"
  });
  const ops=itemProjectionCapabilityContributionsV010
    .filter(c=>c.kind==="platform.capability-operation")
    .map(c=>c.operation);
  for(const id of [ITEM_DIRECTORY_COLLECTION_QUERY_V010,ITEM_MY_ITEMS_COLLECTION_QUERY_V010]){
    const op=ops.find(o=>o.operationId===id);
    assert.ok(op);
    assert.equal(op.effect,"READ");
    assert.equal(op.authorization.action,"item.read");
    assert.ok(op.exposure.includes("PERSONAL_AGENT"));
    assert.equal(op.inputSchema.additionalProperties,false);
  }
  const command=handlers.find(h=>h.commandCode===ITEM_MY_ITEMS_COLLECTION_QUERY_V010);
  const result=await command.execute(request(ITEM_MY_ITEMS_COLLECTION_QUERY_V010,
    {search:"Hong Kong",pageSize:1}),ctx());
  assert.equal(result.ok,true,JSON.stringify(result.error));
  assert.deepEqual(result.result.rows.map(row=>row.rowId),["item-b"]);
  assert.equal(result.result.pageInfo.total,1);
  const bad=await command.execute(request(ITEM_MY_ITEMS_COLLECTION_QUERY_V010,
    {sql:"SELECT * FROM items"}),ctx());
  assert.equal(bad.ok,false);
  assert.equal(bad.error.code,"COLLECTION_QUERY_FIELD_UNSUPPORTED");
  const mismatch=await command.execute(request(ITEM_MY_ITEMS_COLLECTION_QUERY_V010,
    {}),ctx("member-a","ent-other"));
  assert.equal(mismatch.ok,false);
  assert.equal(mismatch.error.code,"ITEM_COLLECTION_CONTEXT_DENIED");
});

test("CV07 Item routes fail closed on duplicated or foreign query parameters",()=>{
  for(const value of [
    "https://evil.invalid/items","//evil.invalid/items","/counterparties/my-suppliers",
    "/items?search=a&search=b","/items?sql=drop","/items?pageSize=500",
    "/items?page=-1","/items#leak","/items\\steal"
  ]) assert.throws(()=>parseItemCollectionRouteV010(value,"/items"),/ITEM_COLLECTION|COLLECTION_QUERY/);
});
