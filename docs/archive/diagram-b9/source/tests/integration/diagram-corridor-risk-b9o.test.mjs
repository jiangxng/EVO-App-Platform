import test from "node:test";
import assert from "node:assert/strict";
import {analyzeCorridorRiskV010 as risk} from "../../tools/diagram-corridor-risk-b9o.mjs";
function fixture(blockers){
 return {nodes:[
  {id:"left",label:"Customer secret",x:0,y:0,width:50,height:40},
  {id:"right",label:"Supplier secret",x:950,y:0,width:50,height:40},
  ...Array.from({length:blockers},(_,i)=>({id:"ob-"+i,label:"Private "+i,
   x:70+i*30,y:0,width:45,height:40}))
 ],edges:[{id:"secret-relation",source:"left",target:"right"}]};
}
test("B9o proxy shows >22 corridor obstacles in tightly crowded synthetic graph",()=>{
 const g=fixture(23);const r=risk(g);
 assert.equal(r.corridorsAboveBudget,1);
 assert.equal(r.maxCorridorObstacleCount,23);
 assert.deepEqual(r.corridorRiskBands,{"0":0,"1-5":0,"6-22":0,"23+":1});
 assert.match(r.evidenceLevel,/NOT actual Eidos route-congested/);
 assert.doesNotMatch(JSON.stringify(r),/Customer|Supplier|Private|ob-0|secret-relation/);
});
test("B9o empty corridor yields zero risk and no false congestion claim",()=>{
 const r=risk(fixture(0));assert.equal(r.corridorsAboveBudget,0);
 assert.equal(r.corridorRiskBands["0"],1);
});
test("B9o detects self loops separately without pretending to route them",()=>{
 const g=fixture(0);g.edges.push({id:"self",source:"left",target:"left"});
 const r=risk(g);assert.equal(r.selfLoops,1);assert.equal(r.corridorsChecked,1);
});
test("B9o geometry depends on visibility layout but never labels",()=>{
 const g=fixture(7);const a=risk(g);
 for(const node of g.nodes)node.label="completely changed secret label";
 assert.deepEqual(risk(g),a);
 g.nodes[3].y=500;assert.notDeepEqual(risk(g),a);
});
test("B9o rejects impossible budget/margin and missing endpoint",()=>{
 const g=fixture(2);
 assert.throws(()=>risk(g,{budget:0}),/invalid diagnostic/);
 assert.throws(()=>risk(g,{margin:NaN}),/invalid diagnostic/);
 g.edges[0].target="missing";
 assert.throws(()=>risk(g),/topology/);
});
