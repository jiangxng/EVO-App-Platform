import test from "node:test";
import assert from "node:assert/strict";
import {
  aggregateBusinessDictionaryStatesV010,
  BUSINESS_DICTIONARY_AGGREGATE_MAX_ROWS_V010
} from "../../dist/apps/business-dictionary/collection-aggregate.js";

const NOW=new Date("2026-11-13T12:00:00.000Z");
function sample(contextId="enterprise-context:alpha"){
  return [
    ...Array.from({length:6},(_,i)=>({
      contractVersion:"0.1.0",contextId,dictionaryId:"published-"+i,
      displayName:"Supplier "+i,version:2,state:"PUBLISHED",
      options:[{code:"HIDDEN",label:{default:"PRIVATE OPTION VALUE"},status:"ACTIVE"}]
    })),
    ...Array.from({length:4},(_,i)=>({
      contractVersion:"0.1.0",contextId,dictionaryId:"draft-"+i,
      displayName:"Supplier Draft "+i,version:1,state:"DRAFT",
      options:[{code:"HIDDEN",label:{default:"PRIVATE OPTION VALUE"},status:"ACTIVE"}]
    }))
  ];
}
function aggregate(dictionaries=sample(),query={view:"all"},contextId="enterprise-context:alpha"){
  return aggregateBusinessDictionaryStatesV010({
    dictionaries,contextId,query,now:NOW
  });
}

test("CV06 Owner aggregate counts every authorized row, not the current result page",()=>{
  const page0=aggregate(sample(),{view:"all",search:"Supplier",sort:"displayName",direction:"asc",page:0,pageSize:1});
  const page30=aggregate(sample(),{view:"all",search:"Supplier",sort:"displayName",direction:"asc",page:30,pageSize:1});
  assert.deepEqual(page0,page30);
  assert.equal(page0.kind,"business-dictionary.collection.aggregate.state");
  assert.equal(page0.metricId,"dictionary.count.by-state");
  assert.equal(page0.unit,"dictionary");
  assert.equal(page0.dimensionFieldId,"state");
  assert.equal(page0.scope,"AUTHORIZED_ALL_MATCHING_ROWS");
  assert.equal(page0.asOf,NOW.toISOString());
  assert.equal(page0.countKind,"EXACT");
  assert.equal(page0.total,10);
  assert.deepEqual(page0.buckets,[
    {key:"DRAFT",count:4,countKind:"EXACT"},
    {key:"PUBLISHED",count:6,countKind:"EXACT"}
  ]);
  assert.equal(JSON.stringify(page0).includes("PRIVATE OPTION VALUE"),false);
  assert.equal(JSON.stringify(page0).includes("contextId"),false);
});

test("CV06 state view, search and two enterprise contexts re-filter independently",()=>{
  const a=aggregate(sample(),{view:"published",page:999,pageSize:1});
  assert.deepEqual(a.buckets.map(x=>x.count),[0,6]);
  assert.equal(a.total,6);
  const bRows=sample("enterprise-context:beta").slice(0,4);
  const b=aggregate(bRows,{view:"published",page:0,pageSize:1},"enterprise-context:beta");
  assert.deepEqual(b.buckets.map(x=>x.count),[0,4]);
  assert.equal(b.total,4);
  const empty=aggregate(sample(),{search:"unmatched"});
  assert.deepEqual(empty.buckets.map(x=>x.count),[0,0]);
  assert.equal(empty.total,0);
});

test("CV06 small-sample states and total suppress together without arithmetic leakage",()=>{
  const one=aggregate(sample().slice(0,1),{view:"all"});
  assert.equal(one.countKind,"SUPPRESSED");
  assert.equal(one.total,null);
  assert.equal(one.privacy.suppressionApplied,true);
  assert.equal(one.privacy.minimumVisibleBucketCount,3);
  assert.deepEqual(one.buckets,[
    {key:"DRAFT",count:0,countKind:"EXACT"},
    {key:"PUBLISHED",count:null,countKind:"SUPPRESSED"}
  ]);
  const filtered=aggregate(sample(),{search:"Supplier 1",page:99,pageSize:1});
  assert.equal(filtered.total,null);
  assert.ok(filtered.buckets.some(x=>x.countKind==="SUPPRESSED"));
  assert.equal(JSON.stringify(filtered).includes("PRIVATE OPTION VALUE"),false);
});

test("CV06 aggregate fails closed for mismatched tenant, unapproved query and memory budget",()=>{
  const rows=sample();
  assert.throws(()=>aggregate([...rows,sample("enterprise-context:beta")[0]]),
    /BUSINESS_DICTIONARY_AGGREGATE_OWNER_SCOPE_INVALID/);
  for(const query of [
    {view:"mine"},{field:"state"},{sort:"secret"},{search:"x".repeat(121)},
    {pageSize:0},{page:-1},{direction:"sideways"},{view:"all",metricId:"optionCount"}
  ]) assert.throws(()=>aggregate(rows,query));
  assert.throws(()=>aggregate(Array(BUSINESS_DICTIONARY_AGGREGATE_MAX_ROWS_V010+1).fill(rows[0])),
    /BUSINESS_DICTIONARY_AGGREGATE_BUDGET_EXCEEDED/);
  assert.throws(()=>aggregateBusinessDictionaryStatesV010({
    dictionaries:rows,contextId:"enterprise-context:alpha",query:{},now:new Date("invalid")
  }),/BUSINESS_DICTIONARY_AGGREGATE_AS_OF_INVALID/);
});
