import test from "node:test";import assert from "node:assert/strict";
import {mkdtemp,rm,readFile} from "node:fs/promises";import {tmpdir} from "node:os";import {join} from "node:path";import {spawnSync} from "node:child_process";
import {validateAuthorizedEnterpriseFixtureV010 as check} from "../../tools/diagram-enterprise-fixture-intake-b9k.mjs";
test("B10i actual generator creates different P2P topology, not only process metadata",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"b10i-distinct-"));
 try{
  const graphs=[];
  for(const proc of ["S2C","P2P"]){
   const filename=join(dir,proc+".json");
   const result=spawnSync(process.execPath,["tools/diagram-enterprise-synthetic-fixture-b9l.mjs",filename,proc],{encoding:"utf8"});
   assert.equal(result.status,0,result.stderr);
   const data=JSON.parse(await readFile(filename,"utf8"));
   graphs.push(check(data));
  }
  assert.equal(graphs[0].nodes,25);assert.equal(graphs[0].edges,1);
  assert.equal(graphs[1].nodes,26);assert.equal(graphs[1].edges,2);
  assert.notEqual(graphs[0].topologySha256,graphs[1].topologySha256);
 }finally{await rm(dir,{recursive:true,force:true});}
});
