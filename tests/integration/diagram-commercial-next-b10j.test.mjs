import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const source="docs/architecture/DIAGRAM-B10J-16-INCREMENT-MANIFEST-20261011.json";
const ids=["B9u","B9v","B9w","B9x","B9y","B9z","B10a","B10b","B10c","B10d","B10e","B10f","B10g","B10h","B10i","B10j"];
test("B10j 16 incremental independent Draft PR references, chronological and unique",async()=>{
 const m=JSON.parse(await readFile(source,"utf8"));
 assert.deepEqual(m.increments.map(v=>v.id),ids);
 assert.equal(m.increments.length,16);
 assert.equal(new Set(m.increments.map(v=>v.pr)).size,16);
 for(const r of m.increments){
  assert.match(r.url,/^https:\/\/github\.com\/jiangxng\/EVO-App-Platform\/pull\/\d+$/);
  assert.equal(r.url.endsWith("/"+r.pr),true);
  assert.equal(r.prStateAtIndexCreation,"open-draft");
  assert.equal(r.evidenceTier,"synthetic-machine-only");
  assert.equal(r.formalCommercialAcceptance,"NOT TESTED");
  assert.equal(r.realCustomerDataUsed,false);
  assert.equal(r.productionEnvironmentVerified,false);
  assert.equal(r.physicalDeviceSignedOff,false);
 }
 assert.equal(m.mergeAuthorized,false);
 assert.equal(m.deployAuthorized,false);
});
test("B10j evidence count explicitly never upgrades formal §14 to signed",async()=>{
 const m=JSON.parse(await readFile(source,"utf8"));
 assert.equal(m.formalAcceptanceTotal,39);
 assert.equal(m.formalAcceptanceCompleted,0);
 assert.equal(m.increments.filter(x=>x.formalCommercialAcceptance==="NOT TESTED").length,16);
});
