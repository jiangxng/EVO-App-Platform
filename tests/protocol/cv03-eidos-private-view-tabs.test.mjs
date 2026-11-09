import test from "node:test";
import assert from "node:assert/strict";
import {renderCatalogBrowserToHtml} from "../../dist/vendor/eidos/src/catalog-browser/render.js";
import {createBusinessDictionaryDirectoryPageV010}
  from "../../dist/apps/business-dictionary/page.js";
import {parseBusinessDictionaryDirectoryRouteV010}
  from "../../dist/apps/business-dictionary/directory-query.js";
import {BUSINESS_DICTIONARY_COLLECTION_ID_V010,
  BUSINESS_DICTIONARY_COLLECTION_SCHEMA_V010}
  from "../../dist/apps/business-dictionary/collection-query.js";

const dictionaries=[
  {contractVersion:"0.1.0",contextId:"enterprise:test",dictionaryId:"hk",
    displayName:"Hong Kong Suppliers",version:1,state:"PUBLISHED",
    options:[{code:"P",label:{default:"Never leak this private label"},status:"ACTIVE"}]},
  {contractVersion:"0.1.0",contextId:"enterprise:test",dictionaryId:"other",
    displayName:"Other",version:1,state:"DRAFT",options:[]}
];
const selection=(query="/business-dictionaries?view=published&search=Hong+Kong&page=0&pageSize=25")=>
  parseBusinessDictionaryDirectoryRouteV010(query);
const saved=(more={})=>({
  viewId:"hk-suppliers",title:"我的香港供应商",
  collectionId:BUSINESS_DICTIONARY_COLLECTION_ID_V010,
  schemaRef:BUSINESS_DICTIONARY_COLLECTION_SCHEMA_V010,
  query:{view:"published",search:"Hong Kong"},
  columns:["dictionaryId","displayName"],...more
});
function page(opts={}) {
  return createBusinessDictionaryDirectoryPageV010({
    dictionaries,canManage:false,locale:"zh-CN",
    directorySelection:selection(),...opts
  });
}

test("C3-02 existing Eidos Dictionary table renders a Host-provided private view route",()=>{
  const original=page();
  assert.deepEqual(original.table.views.map(v=>v.id),["all","draft","published"]);
  const authorized=page({
    authorizedPersonalViews:[saved()],
    selectedPersonalViewId:"hk-suppliers"
  });
  const views=authorized.table.views;
  assert.deepEqual(views.map(v=>v.id),["all","draft","published","personal:hk-suppliers"]);
  assert.deepEqual(views.filter(v=>v.selected).map(v=>v.id),["personal:hk-suppliers"]);
  assert.equal(views[3].route,
    "/business-dictionaries?view=published&search=Hong+Kong&page=0&pageSize=25");
  assert.deepEqual(authorized.table.rows.map(r=>r.itemId),original.table.rows.map(r=>r.itemId));
  assert.deepEqual(authorized.table.columns,original.table.columns);
  assert.deepEqual(authorized.items.map(r=>r.id),original.items.map(r=>r.id));
  const html=renderCatalogBrowserToHtml(authorized);
  assert.match(html,/data-eidos-catalog-view-id="personal:hk-suppliers"/);
  assert.match(html,/aria-current="page"/);
  assert.doesNotMatch(html,/Never leak this private label/);
  assert.doesNotMatch(html,/data-eidos-catalog-view-id="private-data"/);
});

test("C3-02 unselected private tab does not change active system view",()=>{
  const result=page({authorizedPersonalViews:[saved()]});
  assert.equal(result.table.views.find(v=>v.id==="published").selected,true);
  assert.equal(result.table.views.find(v=>v.id==="personal:hk-suppliers").selected,false);
  const mismatch=page({
    authorizedPersonalViews:[saved({query:{view:"draft",search:"Hong Kong"}})],
    selectedPersonalViewId:"hk-suppliers"
  });
  assert.deepEqual(mismatch.table.views.filter(v=>v.selected).map(v=>v.id),["published"]);
});

test("C3-02 rejects stale schema, collection, hidden columns, unsafe query and route injection",()=>{
  for(const hostile of [
    {collectionId:"different"},
    {schemaRef:"old/1.0.0"},
    {columns:["options"]},
    {columns:["dictionaryId","dictionaryId"]},
    {query:{view:"deleted"}},
    {query:{view:"published",sql:"drop table data"}},
    {viewId:"../../evil"},
    {title:"x".repeat(121)},
    {query:{view:"published",search:"a".repeat(1200)}}
  ]){
    const p=page({
      authorizedPersonalViews:[saved(hostile)],
      selectedPersonalViewId:"hk-suppliers"
    });
    assert.deepEqual(p.table.views.map(v=>v.id),["all","draft","published"],
      JSON.stringify(hostile));
    assert.doesNotThrow(()=>renderCatalogBrowserToHtml(p));
  }
});

test("C3-02 no Host-authorized view input keeps current Eidos page behavior",()=>{
  const baseline=page();
  const none=page({authorizedPersonalViews:[]});
  assert.deepEqual(none,baseline);
  const legacy=createBusinessDictionaryDirectoryPageV010({
    dictionaries,canManage:false,locale:"zh-CN",
    authorizedPersonalViews:[saved()],selectedPersonalViewId:"hk-suppliers"
  });
  assert.equal(legacy.table,undefined);
  assert.ok(legacy.search);
});
