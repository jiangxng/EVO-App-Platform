#!/usr/bin/env node
// Synthetic graph ONLY: creates an externally located, disposable B9l CI fixture.
// Never replace this fixture with actual customer information in GitHub Actions.
import assert from "node:assert/strict";
import {writeFile} from "node:fs/promises";
import {isAbsolute} from "node:path";

const filename=process.argv[2],processName=process.argv[3]??"S2C";
assert.ok(filename&&isAbsolute(filename),"CI synthetic output must be an absolute external path");
assert.ok(processName==="S2C"||processName==="P2P");
const fixture={
 contractVersion:"0.1.0",purpose:"diagram-commercial-local-qa",
 process:processName,deidentified:true,ownerApprovedForLocalQa:true,
 preview2d:{
  contractVersion:"0.1.0",
  nodes:[
   {id:"crowded-a",kind:"subject",label:"Synthetic source",
    shape:"rounded-rectangle",x:20,y:200,width:130,height:64},
   {id:"crowded-b",kind:"subject",label:"Synthetic target",
    shape:"rounded-rectangle",x:880,y:200,width:130,height:64},
   ...Array.from({length:23},(_,i)=>({
    id:"block-"+i,kind:"subject",label:"Synthetic block "+i,
    shape:"rounded-rectangle",x:180+i*26,y:200,width:58,height:64
   }))
  ],
  edges:[{id:"synthetic-business-relation",source:"crowded-a",
   target:"crowded-b",kind:"test",label:"Synthetic review",arrow:"end"}]
 }
};
if(process.env.EVO_B10F_HTML_PROBE==="1"){
 fixture.preview2d.nodes[0].label=
  "Synthetic </script><img src=x onerror='window.__b10fRan=true'>";
}
await writeFile(filename,JSON.stringify(fixture),{encoding:"utf8",mode:0o600,flag:"wx"});
console.log("B9L_SYNTHETIC_FIXTURE_GENERATED=1");
