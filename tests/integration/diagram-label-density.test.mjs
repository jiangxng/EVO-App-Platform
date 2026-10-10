import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {diagramLabelReservationV010} from "../../dist/vendor/eidos/src/diagram/label-reservation.js";
import {diagramInkQualityV010,createDiagramInkSpatialIndexV010}
  from "../../dist/vendor/eidos/src/diagram/ink-spatial-index.js";
import {diagramSelfLoopDecisionV010} from "../../dist/vendor/eidos/src/diagram/edge-lanes.js";
const node={x:100,y:100,width:160,height:120};
test("B8l uses measured browser glyph width instead of truncating at 176 units",()=>{
 const anchor={x:510,y:160};
 const long="Wide label "+("M".repeat(80));
 const measured=diagramLabelReservationV010(anchor,long,{
   width:560,actualBoundingBoxAscent:9,actualBoundingBoxDescent:3
 });
 assert.ok(measured.width>=568,"real browser length should not be truncated");
 assert.equal(measured.x,anchor.x-measured.width/2);
 assert.equal(measured.y,anchor.y-8-9-3);
 assert.equal(measured.height,18);
 const baseline=diagramSelfLoopDecisionV010(node);
 assert.equal(baseline.side,"right");
 assert.equal(diagramSelfLoopDecisionV010(node,[],0,[],{labels:[measured]}).side,
   "bottom","wide glyph footprint must divert loop away from right");
 // Previous 176px cap would NOT occupy right-side 260..338 corridor.
 const capped={...measured,x:anchor.x-88,width:176};
 assert.equal(diagramSelfLoopDecisionV010(node,[],0,[],{labels:[capped]}).side,
   "right");
});
test("B8l deterministic fallback handles CJK and missing Canvas metric",()=>{
 const cjk=diagramLabelReservationV010({x:0,y:0},"业务测试");
 assert.ok(cjk.width>=52);
 const bad=diagramLabelReservationV010({x:0,y:0},"ABCDE",{width:NaN,
   actualBoundingBoxAscent:NaN,actualBoundingBoxDescent:NaN});
 assert.ok(Number.isFinite(bad.width)&&bad.height>0);
 assert.throws(()=>diagramLabelReservationV010({x:NaN,y:0},"X"),
  /EIDOS_DIAGRAM_LABEL_RESERVATION_INVALID/);
});
test("B8m explicit fidelity transitions across 12000 relations",()=>{
 assert.equal(diagramInkQualityV010(12000,true),"full");
 assert.equal(diagramInkQualityV010(12001,true),"node-only");
 assert.equal(diagramInkQualityV010(12000,true,1),"coarse");
 assert.equal(diagramInkQualityV010(6000,false),"full");
 assert.throws(()=>diagramInkQualityV010(-1,true),
   /EIDOS_DIAGRAM_INK_QUALITY_INVALID/);
});
test("B8m 13000 unrelated entries retain bounded nearby lookup",()=>{
 const far=Array.from({length:13000},(_,i)=>({
   edgeId:"far-"+i,sourceId:"a-"+i,targetId:"b-"+i,
   segments:[{start:{x:50000+i*2,y:50000},
     end:{x:50001+i*2,y:50090}}],labels:[]
 }));
 far.push({edgeId:"local",sourceId:"elsewhere",targetId:"remote",
   segments:[{start:{x:320,y:110},end:{x:320,y:210}}],
   labels:[]});
 const index=createDiagramInkSpatialIndexV010(far);
 const candidates=index.near("self",node,150);
 assert.equal(candidates.segments.length,1,
   "far relation volume cannot make local index forget a nearby stroke");
});
test("B8l+B8m Surface uses browser metrics and visible fallback status",async()=>{
 const source=await readFile(new URL("../../vendor/eidos/src/diagram/surface.ts",import.meta.url),"utf8");
 assert.match(source,/measureContext\.measureText\(caption\)/);
 assert.match(source,/diagramLabelReservationV010\(geometry.label,caption,measuredCaption\(caption\)\)/);
 assert.match(source,/data-eidos-diagram-ink-label-metrics/);
 assert.match(source,/inkSegmentCount>=100000/);
 assert.match(source,/data-eidos-diagram-routing-advisory/);
 assert.match(source,/pointer-events:none;z-index:5/);
 assert.match(source,/diagramInkQualityV010\(renderedEdges.length/);
});
