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
  parseCounterpartyProjectionRouteQueryV010,
  counterpartyProjectionQueryRouteV010
} from "../../dist/apps/counterparty/projection-query.js";
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
test("CV-02 real dictionary presentation rejects off-origin navigation from any table control",()=>{
  const page=dictionaryPage("/business-dictionaries?view=draft&page=0&pageSize=1");
  for(const unsafe of [
    "//outside.invalid/business-dictionaries",
    "/\\outside.invalid/business-dictionaries",
    "/business-dictionaries\ncross-line"
  ]){
    const render=tableChanges=>renderCatalogBrowserToHtml({
      ...page,table:{...page.table,...tableChanges}
    });
    assert.throws(()=>render({views:[{
      ...page.table.views[0],route:unsafe
    },...page.table.views.slice(1)]}),/EIDOS_CATALOG_TABLE_VIEW_INVALID/);
    assert.throws(()=>render({search:{
      ...page.table.search,route:unsafe
    }}),/EIDOS_CATALOG_TABLE_SEARCH_INVALID/);
    assert.throws(()=>render({columns:[{
      ...page.table.columns[0],sortRoute:unsafe
    },...page.table.columns.slice(1)]}),/EIDOS_CATALOG_TABLE_COLUMN_INVALID/);
    assert.throws(()=>render({pageInfo:{
      ...page.table.pageInfo,nextRoute:unsafe
    }}),/EIDOS_CATALOG_TABLE_PAGE_INVALID/);
  }
  // The existing local Domain route must remain renderable after adoption.
  assert.match(renderCatalogBrowserToHtml(page),/data-eidos-catalog-table/);
});
test("CV-02 owners expose one truthful accessible sort state for dictionary and supplier views",()=>{
  const unsorted=dictionaryPage("/business-dictionaries?view=all&page=0&pageSize=25");
  assert.doesNotMatch(renderCatalogBrowserToHtml(unsorted),/aria-sort=/);
  const dictAsc=dictionaryPage(
    "/business-dictionaries?view=draft&sort=displayName&direction=asc&page=0&pageSize=25");
  assert.equal(dictAsc.table.columns.find(c=>c.id==="displayName").sortDirection,"ascending");
  const dictHtml=renderCatalogBrowserToHtml(dictAsc);
  assert.match(dictHtml,/<th scope="col" aria-sort="ascending">/);
  assert.match(dictHtml,/data-eidos-sort-indicator aria-hidden="true">↑/);
  assert.equal((dictHtml.match(/aria-sort="/g)||[]).length,1);
  assert.match(dictHtml,/data-eidos-catalog-action="sort-displayName"/);

  const dictDesc=dictionaryPage(
    "/business-dictionaries?view=all&sort=version&direction=desc&page=0&pageSize=25");
  assert.equal(dictDesc.table.columns.find(c=>c.id==="version").sortDirection,"descending");
  assert.match(renderCatalogBrowserToHtml(dictDesc),/aria-sort="descending"/);

  const mine=supplierPage(COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,{
    sort:"code",direction:"desc",page:0,pageSize:15
  });
  assert.equal(mine.table.columns.find(c=>c.id==="code").sortDirection,"descending");
  const mineHtml=renderCatalogBrowserToHtml(mine);
  assert.match(mineHtml,/aria-sort="descending"/);
  assert.match(mineHtml,/data-eidos-sort-indicator aria-hidden="true">↓/);
  assert.equal((mineHtml.match(/aria-sort="/g)||[]).length,1);

  const noCode=supplierPage(COUNTERPARTY_SUPPLIER_PROJECTION_V010,{
    sort:"displayName",direction:"asc",page:0,pageSize:15
  });
  assert.equal(noCode.table.columns.find(c=>c.id==="displayName").sortDirection,"ascending");
  assert.equal(noCode.table.columns.some(c=>c.sortDirection),true);
});
test("CV-02 Dictionary owner: column visibility and order use one bounded URL, table, export and detail return",()=>{
  const initial=dictionaryPage(
    "/business-dictionaries?view=draft&search=Alpha&sort=displayName&direction=asc&page=0&pageSize=1");
  const state=initial.table.columnControls.options.find(x=>x.id==="state");
  assert.equal(state.visible,true);
  assert.ok(state.toggle.route.includes("columns=displayName%2CdictionaryId%2Cversion%2CoptionCount"));
  const changed=dictionaryPage(state.toggle.route);
  assert.deepEqual(changed.table.columns.map(x=>x.id),
    ["displayName","dictionaryId","version","optionCount"]);
  assert.deepEqual(Object.keys(changed.table.rows[0].cells),
    ["displayName","dictionaryId","version","optionCount"]);
  assert.equal(changed.table.pageInfo.pageSize,1);
  assert.equal(changed.table.pageInfo.total,1);
  assert.equal(changed.table.search.value,"Alpha");
  assert.ok(changed.table.views.find(x=>x.id==="published").route.includes("columns="));
  const csv=changed.actions.find(x=>x.id==="export-current-page");
  assert.deepEqual(csv.values.fieldIds,changed.table.columns.map(x=>x.id));
  assert.ok(changed.items[0].primaryAction.route.includes("columns%3DdisplayName"));
  const html=renderCatalogBrowserToHtml(changed);
  assert.match(html,/<details data-eidos-catalog-column-controls>/);
  assert.doesNotMatch(html,/data-eidos-col="state"/);
  assert.match(html,/data-eidos-column-choice="state" data-eidos-column-visible="false"/);

  const shown=dictionaryPage(changed.table.columnControls.options.find(x=>x.id==="state").toggle.route);
  assert.deepEqual(shown.table.columns.map(x=>x.id),
    ["displayName","dictionaryId","version","optionCount","state"]);
  const move=shown.table.columnControls.options.find(x=>x.id==="state").moveUp.route;
  const reordered=dictionaryPage(move);
  assert.deepEqual(reordered.table.columns.map(x=>x.id),
    ["displayName","dictionaryId","version","state","optionCount"]);
  assert.deepEqual(reordered.actions.find(x=>x.id==="export-current-page").values.fieldIds,
    reordered.table.columns.map(x=>x.id));
  const reset=dictionaryPage(reordered.table.columnControls.reset.route);
  assert.deepEqual(reset.table.columns.map(x=>x.id),
    ["displayName","dictionaryId","state","version","optionCount"]);
  assert.equal(reset.table.columnControls.reset,undefined);
  assert.equal(reset.table.pageInfo.page,0);
});

test("CV-02 Dictionary column hints are presentation-only and reject invalid or ambiguous fields",()=>{
  for(const columns of [
    "state","displayName,displayName","displayName,secret",
    "displayName,version,state,optionCount,dictionaryId,other",""
  ]){
    assert.throws(()=>parseBusinessDictionaryDirectoryRouteV010(
      "/business-dictionaries?view=all&columns="+encodeURIComponent(columns)
    ),/BUSINESS_DICTIONARY_DIRECTORY_COLUMNS_INVALID/,columns);
  }
  assert.throws(()=>parseBusinessDictionaryDirectoryRouteV010(
    "/business-dictionaries?columns=displayName&columns=displayName"
  ),/BUSINESS_DICTIONARY_DIRECTORY_PARAMETER_DUPLICATE/);
  const sorted=dictionaryPage(
    "/business-dictionaries?view=all&sort=version&direction=desc&page=0&pageSize=25");
  assert.equal(sorted.table.columnControls.options.find(x=>x.id==="version").toggle,undefined,
    "active sorted column cannot be hidden accidentally");
  assert.equal(sorted.table.columnControls.options.find(x=>x.id==="displayName").toggle,undefined,
    "primary identity column stays visible");
  assert.doesNotMatch(renderCatalogBrowserToHtml(
    createBusinessDictionaryDirectoryPageV010({dictionaries,canManage:false,locale:"zh-CN"})
  ),/data-eidos-catalog-column-controls/,"legacy list remains unchanged");
});
test("CV-02 Counterparty: one authorized transient column route drives My Supplier table, CSV and return",()=>{
  const path="/counterparties/my-suppliers";
  const baseQuery={search:"Hong Kong",sort:"displayName",direction:"asc",page:0,pageSize:15};
  const before=supplierPage(COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,baseQuery);
  assert.deepEqual(before.table.columns.map(c=>c.id),["displayName","code"]);
  assert.equal(before.table.columnControls.options.find(x=>x.id==="code").visible,true);
  assert.equal(before.table.columnControls.options.find(x=>x.id==="displayName").toggle,undefined);
  const hide=before.table.columnControls.options.find(x=>x.id==="code").toggle.route;
  const selected=parseCounterpartyProjectionRouteQueryV010(hide,path);
  assert.deepEqual(selected.columns,["displayName"]);
  assert.equal(selected.search,"Hong Kong");
  assert.equal(selected.sort,"displayName");
  assert.equal(selected.pageSize,15);
  const hidden=supplierPage(COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,selected);
  assert.deepEqual(hidden.table.columns.map(c=>c.id),["displayName"]);
  assert.deepEqual(Object.keys(hidden.table.rows[0].cells),["displayName"]);
  assert.deepEqual(hidden.actions.find(x=>x.id==="export-current-page").values.fieldIds,
    ["displayName"]);
  assert.ok(hidden.items[0].primaryAction.route.includes("columns%3DdisplayName"));
  assert.ok(hidden.table.views.find(x=>x.id==="all").route.includes("columns="));
  assert.equal(hidden.table.search.value,"Hong Kong");
  assert.match(renderCatalogBrowserToHtml(hidden),
    /data-eidos-column-choice="code" data-eidos-column-visible="false"/);
  assert.doesNotMatch(renderCatalogBrowserToHtml(hidden),/data-eidos-col="code"/);
  const show=hidden.table.columnControls.options.find(x=>x.id==="code").toggle.route;
  const shown=supplierPage(COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,
    parseCounterpartyProjectionRouteQueryV010(show,path));
  assert.deepEqual(shown.table.columns.map(c=>c.id),["displayName","code"]);
  const reset=shown.table.columnControls.reset.route;
  assert.deepEqual(supplierPage(COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,
    parseCounterpartyProjectionRouteQueryV010(reset,path)).table.columns.map(x=>x.id),
    ["displayName","code"]);
  assert.equal(shown.table.columnControls.reset.route.includes("columns="),false);
});

test("CV-02 Counterparty: owner enforces readable column whitelist before Eidos renderer",()=>{
  for(const malformed of [
    "code","displayName,displayName","displayName,email",
    "displayName,code,status,subjectType,countryOrRegion,unknown",""
  ]){
    assert.throws(()=>parseCounterpartyProjectionRouteQueryV010(
      "/counterparties/my-suppliers?columns="+encodeURIComponent(malformed),
      "/counterparties/my-suppliers"),/COUNTERPARTY_COLUMNS_INVALID/,malformed);
  }
  assert.throws(()=>parseCounterpartyProjectionRouteQueryV010(
    "/counterparties/my-suppliers?columns=displayName&columns=displayName",
    "/counterparties/my-suppliers"),/COUNTERPARTY_QUERY_DUPLICATE_PARAMETER/);
  assert.throws(()=>supplierPage(COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,{
    columns:["displayName","status"],page:0,pageSize:25
  }),/COUNTERPARTY_COLUMNS_UNREADABLE/);
  assert.throws(()=>counterpartyProjectionQueryRouteV010(
    "/counterparties/my-suppliers",{columns:["displayName","email"]},0),
    /COUNTERPARTY_COLUMNS_INVALID/);
  const page=supplierPage(COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,{
    sort:"code",direction:"desc",page:0,pageSize:25
  });
  assert.equal(page.table.columnControls.options.find(x=>x.id==="code").toggle,undefined,
    "actively sorted field may not be hidden");
  const legacy=createCounterpartyProjectionPageV010({
    projectionId:COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,
    counterparties:[],locale:"zh-CN",canManage:false
  });
  assert.equal(legacy.table,undefined);
});

test("CV-02 Counterparty: up/down reorder only currently readable nonidentity fields",()=>{
  const supplier={contractVersion:"0.1.0",counterpartyId:"s-2",
    displayName:"HK Supplier",code:"HK-2",status:"ACTIVE",subjectType:"ORGANIZATION"};
  const page=createCounterpartyProjectionPageV010({
    projectionId:COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,
    counterparties:[supplier],locale:"zh-CN",
    readableFieldIds:["displayName","code","status","subjectType"],
    tableQuery:{sort:"displayName",page:0,pageSize:25},
    pageInfo:{page:0,pageSize:25,total:1,hasMore:false}
  });
  const opts=page.table.columnControls.options;
  assert.equal(opts.find(x=>x.id==="displayName").moveDown,undefined);
  const move=opts.find(x=>x.id==="subjectType").moveUp.route;
  const selected=parseCounterpartyProjectionRouteQueryV010(
    move,"/counterparties/my-suppliers");
  const reordered=createCounterpartyProjectionPageV010({
    projectionId:COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,
    counterparties:[supplier],locale:"zh-CN",
    readableFieldIds:["displayName","code","status","subjectType"],
    tableQuery:selected,pageInfo:{page:0,pageSize:25,total:1,hasMore:false}
  });
  assert.deepEqual(reordered.table.columns.map(x=>x.id),
    ["displayName","code","subjectType","status"]);
  assert.deepEqual(reordered.actions.find(x=>x.id==="export-current-page").values.fieldIds,
    reordered.table.columns.map(x=>x.id));
  assert.deepEqual(Object.keys(reordered.table.rows[0].cells),
    reordered.table.columns.map(x=>x.id));
});
