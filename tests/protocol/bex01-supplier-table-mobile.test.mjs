import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCounterpartyProjectionPageV010 } from "../../dist/apps/counterparty/page.js";
import { COUNTERPARTY_SUPPLIER_PROJECTION_V010 } from "../../dist/apps/counterparty/projections.js";
import { COUNTERPARTY_SUPPLIERS_ROUTE } from "../../dist/apps/counterparty/constants.js";
import { renderCatalogBrowserToHtml } from "../../dist/vendor/eidos/src/catalog-browser/render.js";
import {
 parseCounterpartyProjectionRouteQueryV010
} from "../../dist/apps/counterparty/projection-query.js";

test("BEX-01 supplier page is a real bounded table with visible columns and mobile card fallback",()=>{
 const records=Array.from({length:25},(_,i)=>({
   contractVersion:"0.1.0",counterpartyId:"s"+i,code:"S"+i,
   displayName:"Supplier "+i,subjectType:"ORGANIZATION",
   status:"ACTIVE",email:"secret@example.com"
 }));
 const page=createCounterpartyProjectionPageV010({
   projectionId:COUNTERPARTY_SUPPLIER_PROJECTION_V010,
   counterparties:records,locale:"zh-CN",canManage:true,
   readableFieldIds:["displayName","code"],
   pageInfo:{page:0,pageSize:25,total:37,hasMore:true},
   tableQuery:{page:0,pageSize:25}
 });
 assert.equal(page.table.rows.length,25);
 assert.deepEqual(page.table.columns.map(x=>x.id),["displayName","code"]);
 assert.equal(page.search,undefined);
 assert.equal(page.table.pageInfo.nextRoute,COUNTERPARTY_SUPPLIERS_ROUTE+"?page=1&pageSize=25");
 assert.ok(page.actions.some(a=>a.id==="suppliers"));
 assert.ok(page.items.every(x=>!Object.hasOwn(x.metadata,"email")));
 const html=renderCatalogBrowserToHtml(page);
 assert.match(html, /<table data-eidos-catalog-table>/);
 assert.match(html, /data-eidos-catalog-has-table="true"/);
 assert.match(html, /data-eidos-catalog-server-search/);
 assert.match(html, /data-eidos-catalog-item="s0"/);
 assert.match(html, /data-eidos-catalog-pagination/);
 assert.doesNotMatch(html,/secret@example.com/);
 const styles=readFileSync("vendor/eidos/src/design-language/productive-workbench-css.ts","utf8");
 assert.match(styles, /max-width:700px/);
 assert.match(styles, /data-eidos-catalog-has-table/);
 assert.match(styles, /safe-area-inset-bottom/);
});
test("BEX-01 URL params never override projection identity and reject polluted paging",()=>{
 const expected=COUNTERPARTY_SUPPLIERS_ROUTE;
 assert.deepEqual(parseCounterpartyProjectionRouteQueryV010(expected+"?page=2&pageSize=50&search=%E4%BE%9B%E5%BA%94%E5%95%86",expected),{
   page:2,pageSize:50,search:"供应商"
 });
 for(const route of [
   "/counterparties/customers?page=0",
   "//evil.invalid/suppliers",
   expected+"?page=1&page=2",
   expected+"?pageSize=100000",
   expected+"?redirect=https://evil.invalid"
 ])assert.throws(()=>parseCounterpartyProjectionRouteQueryV010(route,expected));
});
