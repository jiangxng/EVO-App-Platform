import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  diagramSelfLoopDecisionV010,
  diagramSelfLoopSideV010,
  diagramSelfLoopGeometryV010,
  diagramSelfLoopRouteControlsV010,
  diagramSelfLoopManualSideV010
} from "../../dist/vendor/eidos/src/diagram/edge-lanes.js";

const node={x:100,y:100,width:160,height:120};
const blocks=[
  {x:270,y:106,width:110,height:108},
  {x:114,y:234,width:132,height:85},
  {x:-30,y:106,width:120,height:108},
  {x:114,y:-30,width:132,height:120}
];

test("B8h preserves single-loop unblocked right geometry exactly",()=>{
  const decision=diagramSelfLoopDecisionV010(node,[]);
  assert.deepEqual(decision,{side:"right",congested:false,nodeOverlapArea:0,sameSideLoops:0});
  for(const kind of ["straight","orthogonal","rounded-orthogonal","curve"]){
    assert.deepEqual(diagramSelfLoopGeometryV010(node,kind,0,undefined,[],[]),
      diagramSelfLoopGeometryV010(node,kind));
  }
});

test("B8h distinct sibling side reservations use deterministic four-direction distribution",()=>{
  const assigned=[];
  for(let i=0;i<4;i++){
    const d=diagramSelfLoopDecisionV010(node,[],0,assigned);
    assert.equal(d.congested,false);
    assigned.push(d.side);
  }
  assert.deepEqual(assigned,["right","bottom","left","top"]);
  const shuffled=["left","right"];
  assert.equal(diagramSelfLoopSideV010(node,[],0,shuffled),"bottom");
  assert.deepEqual(diagramSelfLoopDecisionV010(node,[],0,["right"]),
    diagramSelfLoopDecisionV010(node,[],0,["right"]));
});

test("B8h fifth and sixth self-loops nest outward and show honest congestion",()=>{
  const reserved=["right","bottom","left","top"];
  const decision=diagramSelfLoopDecisionV010(node,[],0,reserved);
  assert.equal(decision.side,"right");
  assert.equal(decision.congested,true);
  assert.equal(decision.sameSideLoops,1);
  assert.equal(decision.nodeOverlapArea,0);
  for(const kind of ["straight","orthogonal","rounded-orthogonal","curve"]){
    const first=diagramSelfLoopGeometryV010(node,kind,0,undefined,[]);
    const fifth=diagramSelfLoopGeometryV010(node,kind,0,undefined,[],reserved);
    assert.notEqual(first.d,fifth.d);
    assert.equal(fifth.congested,true);
    if(kind==="curve")assert.match(fifth.d,/ C /);
    if(kind==="rounded-orthogonal")assert.match(fifth.d,/ Q /);
  }
  const auto=diagramSelfLoopRouteControlsV010(node,"curve",0,[],undefined,reserved);
  assert.equal(auto.side,"right");
  assert.ok(auto.waypoints[0].x>node.x+node.width+56);
  const sixth=diagramSelfLoopDecisionV010(node,[],0,[...reserved,"right"]);
  assert.equal(sixth.side,"bottom");
  assert.equal(sixth.sameSideLoops,1);
});

test("B8h all sides blocked returns minimum-coverage warning without false safe claim",()=>{
  const decision=diagramSelfLoopDecisionV010(node,blocks);
  assert.equal(decision.congested,true);
  assert.ok(decision.nodeOverlapArea>0);
  const first=diagramSelfLoopGeometryV010(node,"curve",0,undefined,blocks);
  assert.equal(first.congested,true);
  assert.match(first.d,/ C /);
  const reversed=diagramSelfLoopDecisionV010(node,[...blocks].reverse());
  assert.equal(reversed.side,decision.side);
  assert.equal(reversed.nodeOverlapArea,decision.nodeOverlapArea);
  assert.throws(()=>diagramSelfLoopDecisionV010(node,[],0,["diagonal"]),
    /EIDOS_DIAGRAM_LOOP_INVALID/);
});

test("B8h existing manual exterior route remains pinned despite sibling reservations",()=>{
  const point=diagramSelfLoopRouteControlsV010(node,"curve",0,blocks.slice(0,1)).waypoints;
  assert.equal(diagramSelfLoopManualSideV010(node,point),"bottom");
  const old=diagramSelfLoopGeometryV010(node,"curve",0,point,blocks.slice(0,1));
  const later=diagramSelfLoopGeometryV010(node,"curve",0,point,[],[
    "right","bottom","left","top"
  ]);
  assert.equal(later.d,old.d);
  assert.equal(later.congested,undefined);
});

test("B8h Canvas/Viewer use side reservation and nonblocking warning",async()=>{
  const s=await readFile(new URL("../../vendor/eidos/src/diagram/surface.ts",import.meta.url),"utf8");
  assert.match(s,/siblings.sort\(\(a,b\) => a.id.localeCompare\(b.id\)\)/);
  assert.match(s,/loopReservedSides\.set\(edge.id,\s*\[\.\.\.reserved\]\)/);
  assert.match(s,/const reserved: DiagramSelfLoopSideV010\[\] = ordered/);
  assert.match(s,/\.filter\(edge => edge\.waypoints\?\.length\)/);
  assert.match(s,/diagramSelfLoopManualSideV010\(node,edge\.waypoints!\)/);
  assert.match(s,/loopObstacles, loopReservations,/);
  assert.match(s,/data-eidos-diagram-congestion-warning/);
  assert.match(s,/Self-loop crowded; manual adjustment may be needed/);
  assert.match(s,/warning.style.pointerEvents = "none"/);
});
