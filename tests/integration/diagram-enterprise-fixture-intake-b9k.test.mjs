import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,writeFile,rm,symlink,mkdir} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {
 validateAuthorizedEnterpriseFixtureV010 as validate,
 readAuthorizedEnterpriseFixtureV010 as read
} from "../../tools/diagram-enterprise-fixture-intake-b9k.mjs";

function sample(process="S2C"){
 return {
  contractVersion:"0.1.0",purpose:"diagram-commercial-local-qa",
  process,deidentified:true,ownerApprovedForLocalQa:true,
  preview2d:{contractVersion:"0.1.0",
   nodes:[
    {id:"node-a",kind:"subject",label:"Anonymized start",shape:"rounded-rectangle",
     x:20,y:50,width:140,height:60},
    {id:"node-b",kind:"subject",label:"Anonymized end",shape:"rounded-rectangle",
     x:300,y:50,width:140,height:60}
   ],
   edges:[{id:"relation-a",source:"node-a",target:"node-b",kind:"process",
     label:"Anonymized relation",arrow:"end"}]
  }
 };
}
test("B9k accepts S2C/P2P narrow graph and only returns safe aggregate/fingerprint",()=>{
 for(const process of ["S2C","P2P"]){
  const input=sample(process);
  const result=validate(input);
  assert.equal(result.process,process);
  assert.equal(result.nodes,2);
  assert.equal(result.edges,1);
  assert.equal(result.selfLoops,0);
  assert.deepEqual(result.bounds,{width:420,height:60});
  assert.match(result.sha256,/^[a-f0-9]{64}$/);
  assert.equal(result.stage,"B9k-offline-intake-only");
  assert.doesNotMatch(JSON.stringify(result),/Anonymized|node-a|relation-a|ownerApproved/i);
 }
});
test("B9k deterministic fingerprint varies when projection content changes",()=>{
 const original=sample();
 const a=validate(original).sha256;
 assert.equal(validate(structuredClone(original)).sha256,a);
 original.preview2d.nodes[1].x++;
 assert.notEqual(validate(original).sha256,a);
});
test("B9k enforces explicit owner approval and de-identification attestation",()=>{
 for(const key of ["deidentified","ownerApprovedForLocalQa"]){
  const input=sample();delete input[key];
  assert.throws(()=>validate(input),/attestations required/);
  input[key]=false;
  assert.throws(()=>validate(input),/attestations required/);
 }
});
test("B9k denies unknown processes and data-envelope fields",()=>{
 const input=sample("FINANCE");assert.throws(()=>validate(input),/process/);
 const extra=sample();extra.customerRecords=[{raw:"sensitive"}];
 assert.throws(()=>validate(extra),/top-level/);
 const nested=sample();nested.preview2d.sourceAccount={};assert.throws(()=>validate(nested),/preview2d field/);
});
test("B9k denies invalid, missing, and duplicate node/edge IDs",()=>{
 const dup=sample();dup.preview2d.nodes[1].id="node-a";
 assert.throws(()=>validate(dup),/duplicate node/);
 const orphan=sample();orphan.preview2d.edges[0].target="nonexistent";
 assert.throws(()=>validate(orphan),/endpoint/);
 const dupeEdge=sample();dupeEdge.preview2d.edges.push({...dupeEdge.preview2d.edges[0]});
 assert.throws(()=>validate(dupeEdge),/duplicate relation/);
});
test("B9k rejects non-finite geometry and disallowed graph metadata",()=>{
 const nonFinite=sample();nonFinite.preview2d.nodes[0].x=Number.NaN;
 assert.throws(()=>validate(nonFinite),/geometry/);
 const metadata=sample();metadata.preview2d.nodes[0].personalPhone="PRIVATE";
 assert.throws(()=>validate(metadata),/geometry/);
});
test("B9k rejects obvious emails without echoing them",()=>{
 const person=sample();person.preview2d.nodes[0].label="secret@example.com";
 assert.throws(()=>validate(person),error=>{
  assert.doesNotMatch(error.message,/secret@/);
  return /potential email/.test(error.message);
 });
});
test("B9k has finite input-size/cost bounds and cannot silently accept empty graphs",()=>{
 const blank=sample();blank.preview2d.edges=[];
 assert.throws(()=>validate(blank),/count/);
 const large=sample();large.preview2d.nodes=Array.from({length:1501},(_,i)=>({
  id:"n"+i,kind:"subject",label:"Masked",x:i,y:0,width:1,height:1
 }));
 assert.throws(()=>validate(large),/count/);
});
test("B9k checks OS file location and an explicit opt-in; never writes source",async()=>{
 const outside=await mkdtemp(join(tmpdir(),"b9k-enterprise-outside-"));
 const checkout=await mkdtemp(join(tmpdir(),"b9k-checkout-"));
 try{
  const fixture=join(outside,"s2c.json");
  await writeFile(fixture,JSON.stringify(sample()),"utf8");
  await assert.rejects(()=>read(fixture,{repositoryRoot:checkout}),/AUTHORIZED_QA/);
  const result=await read(fixture,{repositoryRoot:checkout,authorized:true});
  assert.equal(result.nodes,2);
  const inside=join(checkout,"p2p.json");
  await writeFile(inside,JSON.stringify(sample("P2P")),"utf8");
  await assert.rejects(()=>read(inside,{repositoryRoot:checkout,authorized:true}),/outside the Git checkout/);
  const oversized=join(outside,"large.json");
  await writeFile(oversized," ".repeat(2*1024*1024+1),"utf8");
  await assert.rejects(()=>read(oversized,{repositoryRoot:checkout,authorized:true}),/2 MiB/);
 }finally{
  await rm(outside,{recursive:true,force:true});
  await rm(checkout,{recursive:true,force:true});
 }
});

test("B9m rejects leaf symlinks, aliased directory traversal and internal checkout path",async()=>{
 const outside=await mkdtemp(join(tmpdir(),"b9m-external-"));
 const checkout=await mkdtemp(join(tmpdir(),"b9m-repo-"));
 try{
  const target=join(outside,"real.json"),alias=join(outside,"alias.json");
  await writeFile(target,JSON.stringify(sample()),"utf8");
  await symlink(target,alias);
  await assert.rejects(()=>read(alias,{repositoryRoot:checkout,authorized:true}));
  await mkdir(join(checkout,"fixtures"));
  const inside=join(checkout,"fixtures","internal.json");
  await writeFile(inside,JSON.stringify(sample()),"utf8");
  const folderAlias=join(outside,"link-to-checkout");
  await symlink(join(checkout,"fixtures"),folderAlias,"dir");
  await assert.rejects(()=>read(join(folderAlias,"internal.json"),{
   repositoryRoot:checkout,authorized:true
  }),/outside the Git checkout/);
  await assert.rejects(()=>read(inside,{repositoryRoot:checkout,authorized:true}),
   /outside the Git checkout/);
  const safe=await read(target,{repositoryRoot:checkout,authorized:true});
  assert.equal(safe.nodes,2);
 }finally{
  await rm(outside,{recursive:true,force:true});
  await rm(checkout,{recursive:true,force:true});
 }
});
