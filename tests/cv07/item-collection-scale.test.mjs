/**
 * CV07 isolated Item Owner 1k/10k scale characterization.
 * Real Item Repository, Enterprise Resource, Responsibility, Authorization
 * and Collection Query, no production credentials, remote DB, LLM or writes.
 * Timing/RSS are measurements, not a production SLA or PostgreSQL benchmark.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {performance} from "node:perf_hooks";
import {mkdirSync,writeFileSync} from "node:fs";
import {
  createMemoryEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";
import {createItemRepositoryV010} from "../../dist/apps/item/repository.js";
import {createResponsibilityRepositoryV010} from "../../dist/apps/responsibility/repository.js";
import {createObjectExtensionValueRepositoryV010} from "../../dist/apps/object-extension/values.js";
import {createItemProjectionServiceV010} from "../../dist/apps/item/projection-service.js";
import {itemAuthorizationPolicyV010} from "../../dist/apps/item/authorization.js";
import {
  createHostStaticAuthorizationProviderV010
} from "../../dist/providers/authorization/runtime.js";
import {
  ITEM_DIRECTORY_PROJECTION_V010,
  ITEM_MY_ITEMS_PROJECTION_V010,
  ITEM_STEWARD_RESPONSIBILITY_V010
} from "../../dist/apps/item/projections.js";

function context() {
  return {
    contractVersion:"0.1.0",
    principal:{contractVersion:"0.1.0",subjectId:"scale-member",
      actorType:"HUMAN",identityProviderId:"test.identity",
      sessionId:"scale-session"},
    scope:{contractVersion:"0.1.0",enterpriseId:"ent-scale",
      userId:"scale-member"},
    context:{
      contractVersion:"0.1.0",
      personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
        contextId:"personal:scale-member",ownerSubjectId:"scale-member"},
      activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
        contextId:"enterprise-context:scale",enterpriseId:"ent-scale"},
      enterpriseContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
        contextId:"enterprise-context:scale",enterpriseId:"ent-scale",
        enterpriseProviderId:"test.enterprise"}
    },
    correlationId:"cv07-item-1k10k-scale"
  };
}
function idOf(i) {return "item-"+String(i).padStart(5,"0");}
function record(i) {
  return {contractVersion:"0.1.0",itemId:idOf(i),
    code:"CODE-"+String(i).padStart(5,"0"),
    displayName:"Scale Item "+String(i).padStart(5,"0"),
    itemKind:"GOODS",baseUomCode:"C62",description:"Test only"};
}

const receipts = [];
for(const size of [1_000,10_000]) {
  test("CV07 authorized Item Owner scale "+size+" rows, page-first hydration",{
    timeout:900_000
  },async()=>{
    const startSeed=performance.now();
    const resources=createMemoryEnterpriseResourceRepositoryV010();
    const repository=createItemRepositoryV010(resources);
    repository.saveMany({
      contextId:"enterprise-context:scale",
      items:Array.from({length:size},(_,i)=>record(i)),
      actorSubjectId:"scale-owner",recordedAt:"2026-11-19T00:00:00Z"
    });
    const responsibilityRepository=createResponsibilityRepositoryV010(resources);
    for(const i of [0,size-1]){
      responsibilityRepository.assign({
        contextId:"enterprise-context:scale",
        targetRef:{objectType:"item.subject",objectId:idOf(i)},
        responsibilityType:ITEM_STEWARD_RESPONSIBILITY_V010,
        assigneeRef:{kind:"PRINCIPAL",id:"scale-member"},
        effectiveFrom:"2026-11-19T00:00:00Z",actorSubjectId:"scale-owner"
      });
    }
    const seedingMs=Number((performance.now()-startSeed).toFixed(2));
    const extensionRepository=createObjectExtensionValueRepositoryV010(resources);
    let extensionHydrations=0;
    const service=createItemProjectionServiceV010({
      repository,responsibilityRepository,
      extensionValueRepository:{
        get:input=>extensionRepository.get(input),
        listForObject:input=>{
          extensionHydrations++;
          return extensionRepository.listForObject(input);
        }
      },
      resolveAuthorizationProvider:()=>createHostStaticAuthorizationProviderV010(
        itemAuthorizationPolicyV010
      ),
      fieldIds:()=>["itemId","displayName","code","itemKind","baseUomCode","description"]
    });
    const read=async(projectionId,query)=>{
      const before=extensionHydrations;
      const started=performance.now();
      const result=await service.read({
        contextId:"enterprise-context:scale",requestContext:context(),
        enterpriseRelationshipKind:"MEMBER",projectionId,query
      });
      const duration=Number((performance.now()-started).toFixed(2));
      assert.equal(extensionHydrations-before,result.items.length,
        "extension values must only be loaded for displayed rows");
      assert.ok(result.items.length<=query.pageSize);
      assert.equal(result.collection.rows.length,result.items.length);
      return {result,duration};
    };
    const timings=[];
    const first=await read(ITEM_DIRECTORY_PROJECTION_V010,{
      search:"Scale Item",sort:"displayName",direction:"asc",page:0,pageSize:10
    });
    timings.push(first.duration);
    assert.equal(first.result.collection.pageInfo.total,size);
    assert.equal(first.result.collection.rows[0].rowId,idOf(0));
    assert.equal(first.result.collection.pageInfo.hasMore,true);
    const last=await read(ITEM_DIRECTORY_PROJECTION_V010,{
      sort:"displayName",direction:"asc",page:Math.floor((size-1)/10),pageSize:10
    });
    timings.push(last.duration);
    assert.equal(last.result.collection.pageInfo.total,size);
    assert.equal(last.result.collection.rows.at(-1).rowId,idOf(size-1));
    assert.equal(last.result.collection.pageInfo.hasMore,false);
    const search=await read(ITEM_DIRECTORY_PROJECTION_V010,{
      search:"Scale Item "+String(size-1).padStart(5,"0"),
      sort:"displayName",direction:"asc",page:0,pageSize:10
    });
    timings.push(search.duration);
    assert.equal(search.result.collection.pageInfo.total,1);
    assert.deepEqual(search.result.collection.rows.map(r=>r.rowId),[idOf(size-1)]);
    const mine=await read(ITEM_MY_ITEMS_PROJECTION_V010,{
      search:"Scale",sort:"displayName",direction:"asc",page:0,pageSize:10
    });
    timings.push(mine.duration);
    assert.equal(mine.result.collection.pageInfo.total,2);
    assert.deepEqual(mine.result.collection.rows.map(r=>r.rowId),
      [idOf(0),idOf(size-1)]);
    assert.equal(extensionHydrations,10+10+1+2);
    // Actual measured CPU/RSS are diagnostic only: no invented SLA.
    const sorted=[...timings].sort((a,b)=>a-b);
    const p95=sorted[Math.ceil(sorted.length*.95)-1];
    const receipt={
      suite:"CV07_ITEM_COLLECTION_OWNER_SCALE_V010",
      source:"DISPOSABLE_MEMORY_RESOURCE_REAL_OWNER",
      rowCount:size,seedMs:seedingMs,
      querySamples:timings.length,
      p95ReadMs:p95,
      maxReadMs:Math.max(...timings),
      rssMiB:Number((process.memoryUsage().rss/1024/1024).toFixed(1)),
      extensionHydrations,
      pageSize:10,
      authorizedReadOnly:true,
      realPostgres:false,realBrowser:false,realHuman:false
    };
    assert.equal(receipt.extensionHydrations,23);
    receipts.push(receipt);
    console.log("CV07_ITEM_SCALE_RECEIPT="+JSON.stringify(receipt));
  });
}
test("CV07 scale receipts: both sizes measured and labeled",()=>{
  assert.deepEqual(receipts.map(r=>r.rowCount),[1000,10000]);
  mkdirSync("artifacts/cv07-item-scale",{recursive:true});
  writeFileSync("artifacts/cv07-item-scale/receipts.json",
    JSON.stringify({measuredAt:new Date().toISOString(),receipts},null,2)+"\n");
});
