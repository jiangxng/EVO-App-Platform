#!/usr/bin/env node
/**
 * CV07 nonproduction, real installed Host Item browser preparation.
 * Reuses the already running CV04 disposable Host; creates no second Host,
 * storage engine, Item owner, renderer, identity provider or import engine.
 * The isolated fixture is not a production Human/OIDC sign-off.
 */
import assert from "node:assert/strict";
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";

const cv04=JSON.parse(readFileSync("artifacts/cv04-csv-browser/fixture.json","utf8"));
assert.equal(cv04.isolated,true);
assert.equal(cv04.productionUsed,false);
const host=cv04.hostUrl;
const a=cv04.contextId, b=cv04.secondaryContextId;
const subjectId=cv04.subjectId;
assert.match(host,/^http:\/\/127\.0\.0\.1:\d+$/);
assert.ok(a && b && a!==b && subjectId);
const dir=resolve("artifacts/cv07-item-browser");
mkdirSync(dir,{recursive:true});

async function request(path,method="GET",body,contextId){
  const response=await fetch(host+path,{
    method,
    headers:{
      accept:"application/json",
      ...(body?{"content-type":"application/json"}:{}),
      ...(contextId?{"x-evo-context-id":contextId}:{})
    },
    ...(body?{body:JSON.stringify(body)}:{})
  });
  const data=await response.json();
  return {status:response.status,data};
}
async function command(code,values,contextId,expectSuccess=true){
  const result=await request("/v1/actions","POST",{
    contractVersion:"0.1.0",type:"command",
    command:{code,inputVersion:"0.1.0"},values,
    sourceInteractionId:"cv07-item-real-host-browser",
    actionId:code,requiresConfirmation:false
  },contextId);
  if(expectSuccess){
    assert.equal(result.status,200,"CV07_ITEM_ACTION_HTTP_"+code);
    assert.equal(result.data.ok,true,
      "CV07_ITEM_ACTION_REJECTED_"+code+":"+(result.data.error?.code??"unknown"));
  }else{
    assert.equal(result.data.ok,false,"CV07_ITEM_ILLEGAL_QUERY_ALLOWED");
  }
  return result.data;
}
async function item(contextId,code,displayName,isMine){
  const created=await command("item.create",{
    code,displayName,itemKind:"GOODS",baseUomCode:"C62",
    description:"Test only CV07 record"
  },contextId);
  const id=created.result?.itemId;
  assert.ok(id,"CV07_ITEM_ID_MISSING");
  if(isMine){
    await command("responsibility.assign",{
      targetObjectType:"item.subject",targetObjectId:id,
      responsibilityType:"ITEM_STEWARD",assigneeSubjectId:subjectId
    },contextId);
  }
  return {id,code,displayName,isMine};
}
async function page(source,route,contextId){
  return request("/v1/experience-pages?"+new URLSearchParams({
    source,route,locale:"zh-CN"
  }),"GET",undefined,contextId);
}
const installed=await request("/v1/install","POST",{packageId:"evo-item"});
assert.equal(installed.status,200,"CV07_ITEM_INSTALL_HTTP");
assert.ok(installed.data.snapshot?.installedPackages?.some(x=>x.packageId==="evo-item"),
  "CV07_ITEM_INSTALL_MISSING");

const inA=[
  await item(a,"CV07_A_APPLE","Apple Item CV07",true),
  await item(a,"CV07_A_BANANA","Banana Item CV07",true),
  await item(a,"CV07_A_PEAR","Pear Item CV07",false)
];
const inB=[
  await item(b,"CV07_B_ONLY","B-Only Item CV07",true)
];
const route="/items?search=CV07&sort=displayName&direction=asc&page=0&pageSize=1";
const myRoute="/items/my-items?search=CV07&sort=displayName&direction=asc&page=0&pageSize=1";
const directorySource="app://evo-item/pages/directory";
const mineSource="app://evo-item/pages/my-items";
for(const [contextId,expectedTotal,expectedFirst] of [
  [a,3,"Apple Item CV07"],[b,1,"B-Only Item CV07"]
]){
  const result=await page(directorySource,route,contextId);
  assert.equal(result.status,200,"CV07_REAL_HOST_PAGE_HTTP");
  assert.equal(result.data.table?.pageInfo?.total,expectedTotal,
    "CV07_OWNER_AUTHORIZED_TOTAL");
  assert.equal(result.data.table?.rows?.length,1,"CV07_OWNER_PAGE_SIZE");
  assert.ok(JSON.stringify(result.data.table.rows).includes(expectedFirst),
    "CV07_OWNER_ROW_MISMATCH");
  assert.ok(result.data.table?.search,"CV07_EIDOS_SERVER_SEARCH_MISSING");
  assert.equal(result.data.table?.views?.length,2,"CV07_EIDOS_VIEWS_MISSING");
}
const mine=await page(mineSource,myRoute,a);
assert.equal(mine.status,200);
assert.equal(mine.data.table?.pageInfo?.total,2,"CV07_STEWARDSHIP_TOTAL");
const mineB=await page(mineSource,myRoute,b);
assert.equal(mineB.data.table?.pageInfo?.total,1,"CV07_B_STEWARDSHIP_TOTAL");

const first=await command("item.collection.directory.query",
  {search:"CV07",sort:"displayName",direction:"asc",page:0,pageSize:1},a);
assert.equal(first.result?.pageInfo?.total,3,"CV07_ACTION_OWNER_TOTAL");
const forged=await command("item.collection.directory.query",
  {search:"CV07",sql:"SELECT * FROM items"},a,false);
assert.equal(forged.error?.code,"COLLECTION_QUERY_FIELD_UNSUPPORTED");

writeFileSync(dir+"/fixture.json",JSON.stringify({
  hostUrl:host,contextId:a,secondaryContextId:b,subjectId,
  sourceSha:process.env.GITHUB_SHA??"local",
  isolated:true,productionUsed:false,humanLoginUsed:false,liveLlmUsed:false,
  route,myRoute,directorySource,mineSource,inA,inB
},null,2));
console.log("CV07_REAL_HOST_ITEM_BROWSER_READY="+JSON.stringify({
  aItems:inA.length,bItems:inB.length,stewardA:2,host
}));
