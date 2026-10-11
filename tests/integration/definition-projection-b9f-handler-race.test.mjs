import test from "node:test";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";

import {createFileDefinitionProjectionStoreV010} from "../../dist/providers/enterprise-context/definition-projection-store.js";

const target={enterpriseId:"ent-b9f",definitionId:"ledger:b9f",definitionRevision:0};
const worker=resolve("tools/diagram-projection-handler-racer-b9f.mjs");
const run=(file,name)=>new Promise((resolveRun,reject)=>{
 const child=spawn(process.execPath,[worker,file,name],{
  cwd:process.cwd(),stdio:["ignore","pipe","pipe"]
 });
 let stdout="",stderr="";
 child.stdout.setEncoding("utf8");child.stderr.setEncoding("utf8");
 child.stdout.on("data",chunk=>stdout+=chunk);
 child.stderr.on("data",chunk=>stderr+=chunk);
 child.on("error",reject);
 child.on("close",code=>{
  if(code!==0)return reject(new Error("B9f worker "+name+" crashed: "+stderr));
  try{resolveRun(JSON.parse(stdout.trim()))}
  catch(error){reject(new Error("B9f invalid real App Handler output: "+stdout+" "+error))}
 });
});

test("B9f two independent App authorized Save handlers commit exactly one file-backed projection CAS write",async()=>{
 const dir=mkdtempSync(join(tmpdir(),"evo-b9f-handlers-"));
 const file=join(dir,"projection-gallery.json");
 try{
  const results=await Promise.all([run(file,"A"),run(file,"B")]);
  const wins=results.filter(r=>r.ok),losses=results.filter(r=>!r.ok);
  assert.equal(wins.length,1,"exactly one actual App Host projection save must win");
  assert.equal(losses.length,1,"rival App save must fail closed, not overwrite");
  assert.match(
   (losses[0].errorCode??"")+" "+(losses[0].errorMessage??""),
   /DEFINITION_PROJECTION_(?:WRITE_CONFLICT|STORE_LOCKED)|Projection changed elsewhere/i,
   "real App handler must propagate explicit conflict or store lock rejection");
  assert.equal(wins[0].businessRevisionCount,1);
  assert.equal(losses[0].businessRevisionCount,1);
  const reopened=createFileDefinitionProjectionStoreV010(file);
  assert.equal(reopened.getVersion(target),1,"one App save increments independent gallery token to 1");
  const gallery=reopened.get(target);
  assert.ok(gallery,"winning App Handler must create projection gallery");
  const primary=gallery.projections.find(p=>p.projectionId===gallery.primaryProjectionId);
  assert.ok(primary);
  assert.equal(primary.view.camera.translateX,wins[0].delta,
   "winning App Handler's camera must persist across process exit");
  assert.equal(primary.view.camera.translateY,0);
  assert.equal(reopened.snapshot().entries.length,1);
  assert.equal(createFileDefinitionProjectionStoreV010(file).getVersion(target),1);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
