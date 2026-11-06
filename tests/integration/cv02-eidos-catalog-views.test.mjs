import test from "node:test";
import assert from "node:assert/strict";
import { renderCatalogBrowserToHtml } from "../../dist/vendor/eidos/src/catalog-browser/render.js";
import { readFileSync } from "node:fs";

const base = {
  contractVersion: "0.1.0",
  kind: "catalog-browser",
  id: "cv02-suppliers",
  title: "供应商",
  layout: "list",
  density: "compact",
  contextNavigation: {
    items: [{id: "suppliers", label: "供应商", route: "/counterparties/suppliers"}]
  },
  actions: [{id:"import",label:"导入",type:"navigate",route:"/data-import",primary:true}],
  items: [{id:"supplier-a",title:"Hong Kong Supplier",primaryAction:{
    id:"detail",label:"查看",type:"navigate",route:"/counterparties/view?counterpartyId=supplier-a"
  }}],
  table: {
    columns: [{id:"displayName",label:"名称",sortRoute:"/counterparties/suppliers?sort=displayName"}],
    rows: [{itemId:"supplier-a",cells:{displayName:"Hong Kong Supplier"}}],
    search: {route:"/counterparties/suppliers",label:"搜索",placeholder:"名称",submitLabel:"搜索"},
    pageInfo: {page:0,pageSize:25,total:1,summary:"1 / 1",
      previousLabel:"上一页",nextLabel:"下一页"}
  }
};

test("CV-02 Platform adopts Eidos original view chooser while keeping Host overlays", () => {
  const html = renderCatalogBrowserToHtml({...base,table:{...base.table,views:[
    {id:"all",label:"全部供应商",route:"/counterparties/suppliers?view=all"},
    {id:"mine",label:"我的供应商",route:"/counterparties/my-suppliers",selected:true}
  ]}});
  assert.match(html,/data-eidos-catalog-view-navigation/);
  assert.match(html,/data-eidos-catalog-view-id="mine"/);
  assert.match(html,/aria-current="page"/);
  assert.match(html,/data-eidos-route="\/counterparties\/my-suppliers"/);
  assert.match(html,/data-eidos-page-actions/);
  assert.match(html,/data-eidos-page-header/);
  assert.match(html,/data-eidos-catalog-table/);
  assert.match(html,/data-eidos-catalog-server-search/);
  assert.match(html,/data-eidos-catalog-density="compact"/);
});

test("CV-02 old pages and unsafe view definitions have distinct behavior", () => {
  const old = renderCatalogBrowserToHtml(base);
  assert.doesNotMatch(old,/data-eidos-catalog-view-navigation/);
  const withViews = views => renderCatalogBrowserToHtml({
    ...base,table:{...base.table,views}
  });
  for (const route of ["https://unsafe.test","//unsafe.test","/\\unsafe.test"]) {
    assert.throws(() => withViews([{id:"bad",label:"不可用",route}]),
      /EIDOS_CATALOG_TABLE_VIEW_INVALID/);
  }
  assert.throws(() => withViews([
    {id:"a",label:"A",route:"/a"},{id:"a",label:"B",route:"/b"}
  ]),/EIDOS_CATALOG_TABLE_VIEW_INVALID/);
  assert.throws(() => withViews([
    {id:"a",label:"A",route:"/a",selected:true},
    {id:"b",label:"B",route:"/b",selected:true}
  ]),/EIDOS_CATALOG_TABLE_VIEW_SELECTION_INVALID/);
});

test("CV-02 vendored navigation is a scoped Eidos owner forward-port, not broad repin", () => {
  const provenance = JSON.parse(readFileSync(
    new URL("../../vendor/eidos/source.manifest.json",import.meta.url),"utf8"));
  const pin = provenance.componentPins.find(p => p.component === "eidos.catalog-browser-views");
  assert.equal(pin.sourceRepository,"jiangxng/eidos");
  assert.equal(pin.sourceCommit,"127150c30193b57b38d1d9cc62443ddfa90e2349");
  assert.match(pin.status,/SCOPED_SEMANTIC_FORWARD_PORT/);
  assert.notEqual(provenance.sourceCommit,pin.sourceCommit);
});
