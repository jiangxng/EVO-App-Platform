import test from "node:test";import assert from "node:assert/strict";import {readFile} from "node:fs/promises";
import {audit32HandoffV010 as audit} from "../../tools/diagram-enterprise-assurance-b11p.mjs";
const path="docs/architecture/DIAGRAM-B11P-32-STEP-INDEX-20261011.json";
test("B11p exactly 32 stacked new Draft stages, zero unauthorized formal signoffs",async()=>{
 const m=JSON.parse(await readFile(path,"utf8"));const r=audit(m);
 assert.equal(r.stages,32);assert.equal(r.uniqueDrafts,32);
 assert.equal(r.formalCases,39);assert.equal(r.formalPass,0);
 assert.equal(r.customerSigned,false);assert.equal(r.physicalSigned,false);
 assert.equal(m.increments[31].head,"self");
});
test("B11p rejects fake prod/customer claims and duplicate PRs",async()=>{
 const m=JSON.parse(await readFile(path,"utf8"));
 m.increments[7].realCustomerData=true;assert.throws(()=>audit(m),/unsafe/);
 m.increments[7].realCustomerData=false;
 m.increments[1].pr=m.increments[0].pr;m.increments[1].prUrl=m.increments[0].prUrl;
 assert.throws(()=>audit(m),/provenance/);
});
