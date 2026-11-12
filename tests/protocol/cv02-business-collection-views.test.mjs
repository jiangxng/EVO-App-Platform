import test from "node:test";
import assert from "node:assert/strict";
import { renderCatalogBrowserToHtml } from "../../dist/vendor/eidos/src/catalog-browser/render.js";
import { queryBusinessDictionaryCollectionV010 } from "../../dist/apps/business-dictionary/collection-query.js";
import { businessDictionaryPackage } from "../../dist/catalog/seed.js";
import {
  createBusinessDictionaryDirectoryPageV010,
  parseBusinessDictionaryDirectoryRouteV010
} from "../../dist/apps/business-dictionary/page.js";
import {
  businessDictionaryDirectoryQueryRouteV010
} from "../../dist/apps/business-dictionary/directory-query.js";
import { createCounterpartyProjectionPageV010 } from "../../dist/apps/counterparty/page.js";
import {
  COUNTERPARTY_SUPPLIER_PROJECTION_V010,
  COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,
  COUNTERPARTY_CUSTOMER_PROJECTION_V010
} from "../../dist/apps/counterparty/projections.js";

const dictionaries = [
  {contractVersion:"0.1.0",contextId:"enterprise:a",dictionaryId:"d-alpha",
    displayName:"Alpha",version:2,state:"DRAFT",
    options:[{code:"A",label:{default:"Internal"} ,status:"ACTIVE"}]},
  {contractVersion:"0.1.0",contextId:"enterprise:a",dictionaryId:"d-beta",
    displayName:"Beta",version:5,state:"PUBLISHED",
    options:[{code:"B",label:{default:"External"},status:"ACTIVE"}]},
  {contractVersion:"0.1.0",contextId:"enterprise:a",dictionaryId:"d-gamma",
    displayName:"Gamma",version:3,state:"DRAFT",options:[]}
];
function dictionaryPage(route, canManage = false) {
  return createBusinessDictionaryDirectoryPageV010({
    dictionaries,canManage,locale:"zh-CN",
    directorySelection:parseBusinessDictionaryDirectoryRouteV010(route)
  });
}
function supplierPage(projectionId, query = {}) {
  return createCounterpartyProjectionPageV010({
    projectionId, locale:"zh-CN",canManage:false,
    readableFieldIds:["displayName","code"],
    tableQuery:query,
    pageInfo:{page:query.page ?? 0,pageSize:query.pageSize ?? 25,total:1,hasMore:false},
    counterparties:[{contractVersion:"0.1.0",counterpartyId:"s1",
      displayName:"Hong Kong Supplier",code:"S-1"}]
  });
}

test("CV-02 dictionaries: Eidos table, owner collection pagination, scoped system views",()=>{
  const page = dictionaryPage("/business-dictionaries?view=draft&sort=displayName&direction=desc&page=0&pageSize=1");
  assert.equal(page.table.pageInfo.total,2,"draft count is based on authorized filtered collection");
  assert.equal(page.table.pageInfo.pageSize,1);
  assert.deepEqual(page.items.map(x=>x.id),["d-gamma"]);
  assert.deepEqual(page.table.rows.map(x=>x.itemId),["d-gamma"]);
  assert.deepEqual(page.table.views.map(x=>[x.id,x.selected]),
    [["all",false],["draft",true],["published",false]]);
  assert.equal(page.table.pageInfo.nextRoute,
    "/business-dictionaries?view=draft&sort=displayName&direction=desc&page=1&pageSize=1");
  assert.ok(!page.actions.some(x=>x.id==="create"),"read-only does not expose create");
  const html=renderCatalogBrowserToHtml(page);
  assert.match(html,/data-eidos-catalog-view-navigation/);
  assert.match(html,/data-eidos-catalog-table/);
  assert.match(html,/data-eidos-catalog-server-search/);
  assert.match(html,/aria-current="page"/);
  assert.doesNotMatch(html,/Internal|External/,"option payloads must not appear in directory");
  assert.doesNotMatch(html,/data-eidos-catalog-search-input/,
    "the browser must not offer a misleading client-only current-page filter");
});

test("CV-02 dictionaries: view change keeps query and resets pagination",()=>{
  const page=dictionaryPage("/business-dictionaries?view=published&search=Beta&page=4&pageSize=2");
  assert.equal(page.table.pageInfo.total,1);
  assert.equal(page.table.pageInfo.page,4);
  assert.equal(page.items.length,0,"an out-of-range page does not leak other results");
  assert.ok(page.table.views[0].route.includes("search=Beta"));
  assert.ok(page.table.views[0].route.includes("page=0"));
  assert.ok(page.table.views[1].route.includes("view=draft"));
  assert.equal(page.table.search.value,"Beta");
  const canWrite=dictionaryPage("/business-dictionaries?view=all",true);
  assert.deepEqual(canWrite.actions.map(x=>x.id),["export-current-page","create"]);
  const legacy=createBusinessDictionaryDirectoryPageV010({
    dictionaries,canManage:false,locale:"zh-CN"
  });
  assert.equal(legacy.table,undefined);
  assert.ok(legacy.search,"existing callers retain legacy local-search behavior");
});

test("CV-02 dictionary routes: only owner-defined fields and local routes",()=>{
  assert.deepEqual(parseBusinessDictionaryDirectoryRouteV010(undefined),
    {view:"all",query:{}});
  const selection=parseBusinessDictionaryDirectoryRouteV010(
    "/business-dictionaries?view=published&search=Beta&page=2&pageSize=15");
  assert.equal(selection.view,"published");
  assert.equal(selection.query.search,"Beta");
  assert.equal(businessDictionaryDirectoryQueryRouteV010(selection,0),
    "/business-dictionaries?view=published&search=Beta&direction=asc&page=0&pageSize=15");
  for(const [route,expected] of [
    ["https://evil.invalid/business-dictionaries","DIRECTORY_ROUTE_INVALID"],
    ["//evil.invalid/business-dictionaries","DIRECTORY_ROUTE_INVALID"],
    ["/other?view=all","DIRECTORY_ROUTE_INVALID"],
    ["/business-dictionaries?view=hidden","DIRECTORY_VIEW_INVALID"],
    ["/business-dictionaries?view=all&view=draft","DIRECTORY_PARAMETER_DUPLICATE"],
    ["/business-dictionaries?sql=drop","DIRECTORY_PARAMETER_UNSUPPORTED"],
    ["/business-dictionaries?sort=notes","COLLECTION_QUERY_SORT_INVALID"],
    ["/business-dictionaries?pageSize=500","COLLECTION_QUERY_PAGE_SIZE_INVALID"],
    ["/business-dictionaries?page=-1","COLLECTION_QUERY_PAGE_INVALID"]
  ]) {
    assert.throws(()=>parseBusinessDictionaryDirectoryRouteV010(route),new RegExp(expected),route);
  }
});

test("CV-02 counterparty: reuse current Eidos table, no duplicate scope button",()=>{
  const query={search:"Hong Kong",sort:"displayName",direction:"asc",page:0,pageSize:15};
  const all=supplierPage(COUNTERPARTY_SUPPLIER_PROJECTION_V010,query);
  const mine=supplierPage(COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,query);
  assert.deepEqual(all.table.views.map(x=>[x.id,x.selected]),
    [["all",true],["mine",false]]);
  assert.deepEqual(mine.table.views.map(x=>[x.id,x.selected]),
    [["all",false],["mine",true]]);
  assert.ok(all.table.views[1].route.startsWith("/counterparties/my-suppliers?search=Hong+Kong"));
  assert.ok(mine.table.views[0].route.startsWith("/counterparties/suppliers?search=Hong+Kong"));
  assert.equal(all.table.views[1].route.includes("page=0"),true);
  assert.equal(all.actions.some(x=>x.id==="responsibility-scope"),false);
  const html=renderCatalogBrowserToHtml(mine);
  assert.match(html,/data-eidos-catalog-view-navigation/);
  assert.match(html,/aria-current="page"/);
  assert.doesNotMatch(html,/data-eidos-col="email"/,"hidden fields stay suppressed");
  const old=createCounterpartyProjectionPageV010({
    projectionId:COUNTERPARTY_CUSTOMER_PROJECTION_V010,
    counterparties:[],locale:"zh-CN",canManage:false
  });
  assert.deepEqual(old.actions.map(a=>a.id),["responsibility-scope"],
    "unpaged legacy UI keeps the old navigation action");
  assert.equal(old.table,undefined);
});

test("CV-02 Personal Agent and Human share one owner-authorized dictionary system-view READ", () => {
  const operation=businessDictionaryPackage.features[0].contributions
    .filter(x=>x.kind==="platform.capability-operation")
    .map(x=>x.operation).find(x=>x.operationId==="dictionary.collection.query");
  assert.equal(operation.effect,"READ");
  assert.ok(operation.exposure.includes("PERSONAL_AGENT"));
  assert.equal(operation.authorization.action,"dictionary.read");
  assert.deepEqual(operation.inputSchema.properties.view.enum,["all","draft","published"]);
  const human=dictionaryPage("/business-dictionaries?view=published&page=0&pageSize=25");
  const agent=queryBusinessDictionaryCollectionV010({
    dictionaries,query:{view:"published",page:0,pageSize:25}
  });
  assert.deepEqual(human.table.rows.map(x=>x.itemId),agent.rows.map(x=>x.rowId));
  assert.equal(human.table.pageInfo.total,agent.pageInfo.total);
  assert.deepEqual(agent.rows.map(x=>x.rowId),["d-beta"]);
  assert.ok(!("options" in agent.rows[0].cells));
  assert.throws(()=>queryBusinessDictionaryCollectionV010({
    dictionaries,query:{view:"unapproved"}
  }),/BUSINESS_DICTIONARY_COLLECTION_VIEW_INVALID/);
});
