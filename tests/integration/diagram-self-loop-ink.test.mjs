import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {diagramSelfLoopDecisionV010,diagramSelfLoopGeometryV010,
  diagramSelfLoopRouteControlsV010} from "../../dist/vendor/eidos/src/diagram/edge-lanes.js";

const n={x:100,y:100,width:160,height:120};
const x=n.x+n.width+56;
const line={start:{x,y:20},end:{x,y:360}};
const label={x:n.x+n.width+21,y:n.y+n.height*.5-8,width:75,height:20};

test("B8i unrelated vertical stroke avoids right automatic self-loop",()=>{
 const old=diagramSelfLoopDecisionV010(n);
 assert.equal(old.side,"right");
 const decision=diagramSelfLoopDecisionV010(n,[],0,[],{segments:[line]});
 assert.equal(decision.side,"bottom");
 assert.equal(decision.congested,false);
 assert.equal(decision.edgeCrossings,undefined);
 const d=diagramSelfLoopGeometryV010(n,"curve",0,undefined,[],[],{segments:[line]});
 const c=diagramSelfLoopRouteControlsV010(n,"curve",0,[],undefined,[],{segments:[line]});
 assert.equal(c.side,"bottom");
 assert.ok(d.d.startsWith("M 144.8 220 "));
 assert.ok(c.waypoints[0].y>n.y+n.height);
});

test("B8i nearby label alone reserves a better exterior side",()=>{
 const decision=diagramSelfLoopDecisionV010(n,[],0,[],{labels:[label]});
 assert.equal(decision.side,"bottom");
 assert.equal(decision.congested,false);
 assert.equal(decision.labelOverlapArea,undefined);
});

test("B8i all-side stroke congestion is truthfully flagged",()=>{
 const ink={segments:[
  line,
  {start:{x:55,y:20},end:{x:55,y:360}},
  {start:{x:30,y:270},end:{x:400,y:270}},
  {start:{x:30,y:50},end:{x:400,y:50}}
 ]};
 const choice=diagramSelfLoopDecisionV010(n,[],0,[],ink);
 assert.equal(choice.congested,true);
 assert.ok((choice.edgeCrossings??0)>0);
 const geom=diagramSelfLoopGeometryV010(n,"rounded-orthogonal",0,undefined,[],[],ink);
 assert.equal(geom.congested,true);
 assert.match(geom.d,/ Q /);
});

test("B8i nonincident strokes and label order never change side decision",()=>{
 const ink={segments:[line,{start:{x:55,y:20},end:{x:55,y:360}}],
  labels:[label,{x:15,y:140,width:20,height:22}]};
 const d=diagramSelfLoopDecisionV010(n,[],0,[],ink);
 assert.deepEqual(diagramSelfLoopDecisionV010(n,[],0,[],{
   segments:[...ink.segments].reverse(),labels:[...ink.labels].reverse()
 }),d);
});

test("B8i saved manual self-loop never reroutes for new strokes or labels",()=>{
 const p=[{x:n.x+n.width+65,y:n.y+n.height*.5}];
 const old=diagramSelfLoopGeometryV010(n,"curve",0,p);
 const moved=diagramSelfLoopGeometryV010(n,"curve",0,p,[],[],
  {segments:[line],labels:[label]});
 assert.equal(old.d,moved.d);
 assert.equal(moved.congested,undefined);
});

test("B8i rejects nonfinite ink inputs",()=>{
 assert.throws(()=>diagramSelfLoopDecisionV010(n,[],0,[],
  {segments:[{start:{x:NaN,y:0},end:{x:1,y:1}}]}),
  /EIDOS_DIAGRAM_LOOP_INVALID/);
 assert.throws(()=>diagramSelfLoopDecisionV010(n,[],0,[],
  {labels:[{x:0,y:0,width:0,height:10}]}),
  /EIDOS_DIAGRAM_LOOP_INVALID/);
});

test("B8i Surface shares stable nonincident ink between Designer and Viewer",async()=>{
 const code=await readFile(new URL("../../vendor/eidos/src/diagram/surface.ts",import.meta.url),"utf8");
 assert.match(code,/const loopInkFor = \(nodeId: string\)/);
 assert.match(code,/other.source === nodeId \|\| other.target === nodeId/);
 assert.match(code,/loopInkFor\(edge.source\)/);
 assert.match(code,/loopInkFor\(nodeId\)/);
 assert.match(code,/renderedEdges\.length <= 12000/);
 assert.match(code,/createDiagramInkSpatialIndexV010\(inkEntries\)/);
});

test("B8i camera-independent Fit all retains unstyled graphs and encloses external handles",async()=>{
 const {diagramSelfLoopFitBoundsV010}=await import(
   "../../dist/vendor/eidos/src/diagram/edge-lanes.js");
 const a={id:"n",...n};
 assert.deepEqual(diagramSelfLoopFitBoundsV010([a],[]),{
   x:n.x,y:n.y,width:n.width,height:n.height});
 const loops=Array.from({length:5},(_,i)=>({
   id:"l"+i,source:"n",target:"n",pathKind:"curve"
 }));
 const b=diagramSelfLoopFitBoundsV010([a],loops);
 assert.ok(b.x<n.x-90&&b.y<n.y-90);
 assert.ok(b.x+b.width>n.x+n.width+90);
 assert.ok(b.y+b.height>n.y+n.height+90);
 const manual={...loops[0],waypoints:[{x:n.x+400,y:n.y+200}]};
 const withManual=diagramSelfLoopFitBoundsV010([a, {
    id:"remote",x:1000,y:2000,width:10,height:10}],[
    manual,...loops.slice(1)]);
 assert.ok(withManual.x+withManual.width>=n.x+422,
   "Saved route control point outside nodes must not be cropped");
 const code=await readFile(new URL("../../vendor/eidos/src/diagram/surface.ts",import.meta.url),"utf8");
 assert.match(code,/diagramSelfLoopFitBoundsV010\(nodes,visibleEdges\(\)\)/);
 assert.match(code,/diagramSelfLoopFitBoundsV010\(nodes,focus\)/);
});
