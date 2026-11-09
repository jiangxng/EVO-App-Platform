import test from "node:test";
import assert from "node:assert/strict";
import {
  createCounterpartyProjectionPageV010,
  createCounterpartyDetailPageV010
} from "../../dist/apps/counterparty/page.js";
import {
  COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010
} from "../../dist/apps/counterparty/projections.js";
import {
  parseCounterpartyProjectionReturnRouteV010
} from "../../dist/apps/counterparty/projection-query.js";
import {
  businessDictionaryDetailRouteV010,
  parseBusinessDictionaryRouteV010,
  createBusinessDictionaryDirectoryPageV010,
  createBusinessDictionaryDetailPageV010
} from "../../dist/apps/business-dictionary/page.js";
import {
  parseBusinessDictionaryDirectoryRouteV010
} from "../../dist/apps/business-dictionary/directory-query.js";
import { renderCatalogBrowserToHtml } from "../../dist/vendor/eidos/src/catalog-browser/render.js";

const supplier = {
  contractVersion:"0.1.0",counterpartyId:"supplier-a",code:"S-1",
  displayName:"HK Supplier",subjectType:"ORGANIZATION",status:"ACTIVE"
};
const dictionary={
  contractVersion:"0.1.0",contextId:"enterprise:a",dictionaryId:"dict-a",
  displayName:"Supplier Categories",version:4,state:"PUBLISHED",
  options:[{code:"TOP",label:{default:"Key"},status:"ACTIVE"}]
};

test("CV-02 supplier: list→detail→parent restores exact validated My Suppliers query",()=>{
  const page=createCounterpartyProjectionPageV010({
    projectionId:COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,
    counterparties:[supplier],locale:"zh-CN",canManage:false,
    readableFieldIds:["displayName","code"],
    pageInfo:{page:2,pageSize:1,total:3,hasMore:false},
    tableQuery:{search:"HK",sort:"displayName",direction:"desc",page:2,pageSize:1}
  });
  const route=page.items[0].primaryAction.route;
  const parsed=new URL(route,"https://evo.invalid");
  assert.equal(parsed.pathname,"/counterparties/detail");
  const back=parsed.searchParams.get("returnTo");
  assert.equal(back,
    "/counterparties/my-suppliers?search=HK&sort=displayName&direction=desc&page=2&pageSize=1");
  assert.equal(parseCounterpartyProjectionReturnRouteV010(back),back);
  const detail=createCounterpartyDetailPageV010({
    counterparty:supplier,locale:"zh-CN",canManage:false,
    readableFieldIds:["displayName","code"],returnRoute:back
  });
  assert.equal(detail.contextNavigation.items[0].route,back);
  assert.match(renderCatalogBrowserToHtml(detail),/data-eidos-route/);
  const legacy=createCounterpartyDetailPageV010({
    counterparty:supplier,locale:"zh-CN",canManage:false
  });
  assert.equal(legacy.contextNavigation.items[0].route,"/counterparties");
});

test("CV-02 dictionary: filtered published list→detail→parent retains page and search",()=>{
  const selection=parseBusinessDictionaryDirectoryRouteV010(
    "/business-dictionaries?view=published&search=Supplier&sort=displayName&page=1&pageSize=1"
  );
  const page=createBusinessDictionaryDirectoryPageV010({
    dictionaries:[dictionary,{...dictionary,dictionaryId:"dict-b",displayName:"Another Supplier"}],
    canManage:false,locale:"zh-CN",directorySelection:selection
  });
  const link=page.items[0].primaryAction.route;
  const detailParsed=parseBusinessDictionaryRouteV010(link,"detail");
  assert.equal(detailParsed.dictionaryId,page.items[0].id);
  assert.equal(detailParsed.returnTo,
    "/business-dictionaries?view=published&search=Supplier&sort=displayName&direction=asc&page=1&pageSize=1");
  const detail=createBusinessDictionaryDetailPageV010({
    dictionary,canManage:false,locale:"zh-CN",returnTo:detailParsed.returnTo
  });
  assert.equal(detail.contextNavigation.items[0].route,detailParsed.returnTo);
  assert.equal(parseBusinessDictionaryRouteV010(
    businessDictionaryDetailRouteV010("dict-a"),"detail").returnTo,undefined);
  assert.equal(createBusinessDictionaryDetailPageV010({
    dictionary,canManage:false,locale:"zh-CN"
  }).contextNavigation.items[0].route,"/business-dictionaries");
});

test("CV-02 returnTo cannot become open redirect, cross-app route or unrestricted query",()=>{
  for(const unsafe of [
    "https://evil.test/p",
    "//evil.test/p",
    "/data-import?view=all",
    "/counterparties/my-suppliers?sql=1",
    "/counterparties/suppliers?pageSize=999",
    "/counterparties/customers?search=a&search=b",
    "/counterparties/suppliers#hash"
  ]){
    assert.throws(()=>parseCounterpartyProjectionReturnRouteV010(unsafe),undefined,unsafe);
  }
  for(const unsafe of [
    "https://evil.test",
    "//evil.test",
    "/counterparties/suppliers",
    "/business-dictionaries?view=all&view=published",
    "/business-dictionaries?sort=secret",
    "/business-dictionaries?sql=1",
    "/business-dictionaries?pageSize=10000"
  ]) {
    const route="/business-dictionaries/view?dictionaryId=dict-a&returnTo="+encodeURIComponent(unsafe);
    assert.equal(parseBusinessDictionaryRouteV010(route,"detail"),undefined,unsafe);
    assert.throws(()=>businessDictionaryDetailRouteV010("dict-a",unsafe),undefined,unsafe);
  }
  assert.equal(parseBusinessDictionaryRouteV010(
    "/business-dictionaries/view?dictionaryId=dict-a&returnTo=%2Fbusiness-dictionaries&returnTo=%2Fbusiness-dictionaries",
    "detail"),undefined);
  assert.equal(parseBusinessDictionaryRouteV010(
    "/business-dictionaries/option?dictionaryId=dict-a&returnTo=%2Fbusiness-dictionaries",
    "option"),undefined);
});
