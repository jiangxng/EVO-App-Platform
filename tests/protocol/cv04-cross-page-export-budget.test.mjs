import test from "node:test";
import assert from "node:assert/strict";
import {createAuthorizedCrossPageCsvV010} from
  "../../dist/foundation/collection-query/authorized-cross-page-csv.js";

const fieldIds=["dictionaryId","displayName"];
const policy={pageSize:2,maxPages:3,maxRows:5,maxBytes:8192,maxDurationMs:3000};
const scope={enterpriseId:"ent-a",subjectId:"seller-a",actorType:"HUMAN"};
const values=["Alpha","=HYPERLINK(\"unsafe\")","Gamma","Delta","Epsilon"];
const rows=values.map((displayName,i)=>({
  rowId:"d"+i,
  cells:{dictionaryId:"d"+i,displayName}
}));

function harness(overrides={}){
  const events=[];
  const state={allowed:true,reads:0};
  let data=overrides.rows??rows;
  const snapshot={
    snapshotId:overrides.snapshotId??"dictionary:snapshot-1",
    async readPage(i,pageSize){
      state.reads++;
      if(overrides.hang&&i===0)await new Promise(()=>{});
      if(overrides.revokeOnPage===i)state.allowed=false;
      const chunk=data.slice(i*pageSize,(i+1)*pageSize);
      return {
        contractVersion:"0.1.0",
        collectionId:"evo.business-dictionary.directory",
        schemaRef:overrides.driftSchema&&i>0?"broken.schema": "evo.dictionary/0.1.0",
        readableFieldIds:overrides.readableFieldIds??fieldIds,
        rows:overrides.duplicateRowId&&i===1
          ? chunk.map((row,j)=>j===0?{...row,rowId:"d0"}:row)
          :chunk,
        pageInfo:{
          page:overrides.driftPage&&i===1?7:i,
          pageSize,
          total:overrides.driftTotal&&i>0?data.length+1:data.length,
          hasMore:(i+1)*pageSize<data.length,
          countKind:overrides.estimatedCount?"ESTIMATED":"EXACT"
        }
      };
    }
  };
  const run=()=>createAuthorizedCrossPageCsvV010({
    auditId:"cv04-test-1",scope,fieldIds:overrides.fieldIds??fieldIds,
    policy:overrides.policy??policy,
    authorizeExport:async()=>{
      if(overrides.authError)throw Error("COLLECTION_EXPORT_AUTH_UNAVAILABLE");
      return overrides.denied?false:state.allowed;
    },
    openSnapshot:async()=>snapshot,
    audit:async event=>{
      if(overrides.auditError&&event.stage==="COMPLETED"){
        throw Error("CV04_AUDIT_DISK_UNAVAILABLE");
      }
      events.push(event);
    }
  });
  return {run,events,state};
}

test("CV04 snapshot-wide CSV uses exactly one immutable Owner snapshot and durable audit callback",async()=>{
  const h=harness();
  const result=await h.run();
  assert.equal(result.rowCount,5);
  assert.equal(result.snapshotId,"dictionary:snapshot-1");
  assert.equal(h.state.reads,3);
  assert.ok(result.csv.startsWith("\uFEFF"));
  assert.match(result.csv,/d0/);
  assert.match(result.csv,/d4/);
  assert.ok(result.csv.includes("'=HYPERLINK"));
  assert.equal((result.csv.match(/"dictionaryId","displayName"/g)||[]).length,1);
  assert.deepEqual(h.events.map(x=>x.stage),["STARTED","COMPLETED"]);
  assert.equal(h.events[1].rowCount,5);
  assert.equal(h.events[1].byteCount,result.byteCount);
  assert.equal(JSON.stringify(h.events).includes("Alpha"),false,
    "Audit carries metadata only, never CSV or private row data");
  console.log("CV04_CROSS_PAGE_SNAPSHOT_AUDITED_BUDGET_PASS");
});

test("CV04 missing independent EXPORT grant denies before even opening a snapshot",async()=>{
  const h=harness({denied:true});
  await assert.rejects(h.run(),/COLLECTION_EXPORT_PERMISSION_DENIED/);
  assert.equal(h.state.reads,0);
  assert.deepEqual(h.events.map(e=>e.stage),["REJECTED"]);
  assert.equal(h.events[0].denialCode,"COLLECTION_EXPORT_PERMISSION_DENIED");
});

test("CV04 revoke after the first page rejects all bytes and records denial",async()=>{
  const h=harness({revokeOnPage:1});
  await assert.rejects(h.run(),/COLLECTION_EXPORT_PERMISSION_DENIED/);
  assert.equal(h.state.reads,2);
  assert.deepEqual(h.events.map(e=>e.stage),["STARTED","REJECTED"]);
  assert.equal(h.events.at(-1).snapshotId,"dictionary:snapshot-1");
});

test("CV04 owner exact count, stable page, schema and row identity drift all fail closed",async()=>{
  for(const [overrides,code] of [
    [{estimatedCount:true},"COLLECTION_EXPORT_PAGE_SCOPE_INVALID"],
    [{driftPage:true},"COLLECTION_EXPORT_PAGE_SCOPE_INVALID"],
    [{driftSchema:true},"COLLECTION_EXPORT_SNAPSHOT_DRIFT"],
    [{driftTotal:true},"COLLECTION_EXPORT_SNAPSHOT_DRIFT"],
    [{duplicateRowId:true},"COLLECTION_EXPORT_ROW_DUPLICATE"],
    [{readableFieldIds:["dictionaryId"]},"COLLECTION_CSV_FIELD_NOT_READABLE"]
  ]){
    const h=harness(overrides);
    await assert.rejects(h.run(),new RegExp(code));
    assert.equal(h.events.at(-1).stage,"REJECTED");
  }
});

test("CV04 strict row/byte/time/field budgets fail instead of truncating",async()=>{
  for(const [overrides,code] of [
    [{policy:{...policy,maxRows:4}},"COLLECTION_EXPORT_ROW_BUDGET_EXCEEDED"],
    [{policy:{...policy,maxBytes:30}},"COLLECTION_EXPORT_BYTE_BUDGET_EXCEEDED"],
    [{fieldIds:["options"]},"COLLECTION_CSV_FIELD_NOT_READABLE"],
    [{fieldIds:["displayName","displayName"]},"COLLECTION_EXPORT_CONTRACT_INVALID"],
    [{policy:{...policy,maxRows:1001}},"COLLECTION_EXPORT_BUDGET_INVALID"]
  ]){
    const h=harness(overrides);
    await assert.rejects(h.run(),new RegExp(code));
  }
  const h=harness({hang:true,policy:{...policy,maxDurationMs:10}});
  await assert.rejects(h.run(),/COLLECTION_EXPORT_TIME_BUDGET_EXCEEDED/);
});

test("CV04 audit commit failure rejects bytes even after authorized page reads",async()=>{
  const h=harness({auditError:true});
  await assert.rejects(h.run(),/CV04_AUDIT_DISK_UNAVAILABLE/);
  assert.equal(h.state.reads,3);
  assert.deepEqual(h.events.map(e=>e.stage),["STARTED","REJECTED"]);
});

test("CV04 fake snapshot/Owner row data cannot bypass fail-closed schema gate",async()=>{
  const h=harness({snapshotId:"../../invalid"});
  await assert.rejects(h.run(),/COLLECTION_EXPORT_SNAPSHOT_INVALID/);
  assert.deepEqual(h.events.map(e=>e.stage),["STARTED","REJECTED"]);
});
