import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {createFileDefinitionProjectionStoreV010} from "../../dist/providers/enterprise-context/definition-projection-store.js";
import {ledgerRuntimeBaselineBundleV010} from "../../dist/apps/template-store/seed-records.js";

const target={enterpriseId:"ent-b9e",definitionId:"ledger:b9e",definitionRevision:0};
const raceProgram=[
 'import {pathToFileURL} from "node:url";',
 'import {resolve} from "node:path";',
 'const {createFileDefinitionProjectionStoreV010}=await import(pathToFileURL(resolve("dist/providers/enterprise-context/definition-projection-store.js")).href);',
 'const file=process.argv[1],name=process.argv[2];',
 'const id={enterpriseId:"ent-b9e",definitionId:"ledger:b9e",definitionRevision:0};',
 'const store=createFileDefinitionProjectionStoreV010(file);',
 'const gallery=store.get(id);',
 'gallery.projections[0].title="B9e winning writer "+name;',
 'const input={...id,gallery,updatedAt:"2026-10-11T00:00:00.000Z",updatedBySubjectId:"writer-"+name};',
 'try{',
 ' const commit=store.putIfVersion(input,1);',
 ' console.log(JSON.stringify({ok:true,name,version:commit.version}));',
 '}catch(error){',
 ' console.log(JSON.stringify({ok:false,name,error:String(error?.message??error)}));',
 '}'
].join("\n");

const childAttempt=(file,name)=>new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,["--input-type=module","-e",raceProgram,file,name],{
  cwd:process.cwd(),stdio:["ignore","pipe","pipe"]
 });
 let stdout="",stderr="";
 child.stdout.setEncoding("utf8");
 child.stderr.setEncoding("utf8");
 child.stdout.on("data",chunk=>stdout+=chunk);
 child.stderr.on("data",chunk=>stderr+=chunk);
 child.on("error",reject);
 child.on("close",code=>{
  if(code!==0)return reject(new Error("B9e child exit "+code+" "+stderr));
  try{resolve(JSON.parse(stdout.trim()))}
  catch(error){reject(new Error("B9e child returned invalid JSON "+stdout+" "+stderr+" "+error))}
 });
});

test("B9e file projection store: two independent Node processes cannot both win stale CAS",async()=>{
 const dir=mkdtempSync(join(tmpdir(),"evo-b9e-file-cas-"));
 const file=join(dir,"projection-gallery.json");
 try{
  const store=createFileDefinitionProjectionStoreV010(file);
  const gallery=structuredClone(ledgerRuntimeBaselineBundleV010.definition.projectionGallery);
  const first=store.putIfVersion({
   ...target,gallery,updatedAt:"2026-10-11T00:00:00.000Z",
   updatedBySubjectId:"seed-b9e"
  },0);
  assert.equal(first.version,1);
  const attempts=await Promise.all([
   childAttempt(file,"A"),childAttempt(file,"B")
  ]);
  const wins=attempts.filter(result=>result.ok);
  const losses=attempts.filter(result=>!result.ok);
  assert.equal(wins.length,1,
   "cross-process CAS may commit exactly one of two writes with expectedVersion 1");
  assert.equal(losses.length,1,
   "losing process must fail closed, not overwrite a peer");
  assert.match(losses[0].error,
   /DEFINITION_PROJECTION_(?:STORE_LOCKED|WRITE_CONFLICT)/,
   "lock contention or outdated write token must be explicit");
  assert.equal(wins[0].version,2);
  const finalStore=createFileDefinitionProjectionStoreV010(file);
  assert.equal(finalStore.getVersion(target),2,
   "restart file-backed Store after concurrent writers must retain one version increment");
  const storedTitle=finalStore.get(target)?.projections[0].title;
  assert.equal(storedTitle,"B9e winning writer "+wins[0].name);
  assert.equal(finalStore.snapshot().entries.length,1,
   "racing writer must not create duplicate enterprise projection rows");

  // A crash-left-behind lock must not be silently stolen and must never
  // mutate the projection gallery or bump the write version.
  mkdirSync(file+".lock");
  try{
   assert.throws(()=>finalStore.putIfVersion({
    ...target,gallery:finalStore.get(target),
    updatedAt:"2026-10-11T00:01:00.000Z",
    updatedBySubjectId:"blocked-writer"
   },2),/DEFINITION_PROJECTION_STORE_LOCKED/);
   assert.equal(finalStore.getVersion(target),2);
  }finally{rmdirSync(file+".lock")}
  assert.equal(createFileDefinitionProjectionStoreV010(file).getVersion(target),2);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
