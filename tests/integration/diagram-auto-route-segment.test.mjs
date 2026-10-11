import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  diagramAutomaticOrthogonalPointsV010,diagramEdgeGeometryV010
} from "../../dist/vendor/eidos/src/diagram/edge-paths.js";
import {
  diagramEditableAutomaticOrthogonalRouteV010,
  diagramDragOrthogonalSegmentV010,diagramManualEdgeGeometryV010
} from "../../dist/vendor/eidos/src/diagram/edge-waypoints.js";

const start={x:40,y:30}, end={x:300,y:190};
const obstacles=[
  {x:100,y:0,width:55,height:120},
  {x:190,y:60,width:55,height:100},
  {x:9000,y:9000,width:100,height:100}
];

test("automatic drag candidate exactly shares routed corners and does not mutate endpoints",()=>{
  for(const pathKind of ["orthogonal","rounded-orthogonal"]){
    const src=structuredClone(start), dst=structuredClone(end);
    const points=diagramAutomaticOrthogonalPointsV010(start,end,pathKind,{obstacles});
    const edit=diagramEditableAutomaticOrthogonalRouteV010(start,end,pathKind,{obstacles});
    assert.ok(edit?.segments.length,"route must expose a segment hit target");
    assert.ok(edit.waypoints.length>=1);
    assert.deepEqual(points[0],start);
    assert.deepEqual(points.at(-1),end);
    assert.deepEqual(start,src);
    assert.deepEqual(end,dst);
    assert.deepEqual(edit.waypoints,points.slice(1,-1));
    const before=diagramEdgeGeometryV010(start,end,pathKind,{obstacles});
    assert.equal(before.kind,pathKind);
    const handle=edit.segments[Math.floor(edit.segments.length/2)];
    const updated=diagramDragOrthogonalSegmentV010(start,end,
      {pathKind,waypoints:edit.waypoints},handle.index,48);
    const manual=diagramManualEdgeGeometryV010(start,end,{pathKind,waypoints:updated});
    assert.notEqual(manual.d,before.d);
    assert.deepEqual(src,start);
    assert.deepEqual(dst,end);
    assert.deepEqual(edit.waypoints,points.slice(1,-1),
      "drag must not mutate the derived automatic controls");
  }
});

test("collinear automatic route can be directly dragged using synthetic midpoint",()=>{
  const a={x:0,y:0},b={x:300,y:0};
  for(const pathKind of ["orthogonal","rounded-orthogonal"]){
    const auto=diagramEditableAutomaticOrthogonalRouteV010(a,b,pathKind);
    assert.ok(auto);
    assert.deepEqual(auto.waypoints,[{x:150,y:0}]);
    const handle=auto.segments.find(h=>h.axis==="y");
    assert.ok(handle);
    const points=diagramDragOrthogonalSegmentV010(a,b,
      {pathKind,waypoints:auto.waypoints},handle.index,45);
    const visual=diagramManualEdgeGeometryV010(a,b,{pathKind,waypoints:points});
    assert.ok(visual.d.includes("45"));
    assert.deepEqual(a,{x:0,y:0});
    assert.deepEqual(b,{x:300,y:0});
  }
});

test("automatic edit derives same corners as source SVG, including distant obstacles",()=>{
  for(const pathKind of ["orthogonal","rounded-orthogonal"]){
    const points=diagramAutomaticOrthogonalPointsV010(start,end,pathKind,{
      obstacles:[{x:9000,y:9000,width:20,height:20}],
      forceRouteWhenEmpty:true
    });
    const auto=diagramEditableAutomaticOrthogonalRouteV010(start,end,pathKind,{
      obstacles:[{x:9000,y:9000,width:20,height:20}],
      forceRouteWhenEmpty:true
    });
    assert.ok(auto);
    assert.deepEqual(auto.waypoints,points.slice(1,-1));
  }
  assert.throws(()=>diagramAutomaticOrthogonalPointsV010(start,end,"curve"),
    /EIDOS_DIAGRAM_AUTO_ROUTE_EDIT_INVALID/);
});

test("automatic handles are presentation-only until actual pointer release",async()=>{
  const s=await readFile(new URL("../../vendor/eidos/src/diagram/surface.ts",import.meta.url),"utf8");
  assert.match(s,/data-eidos-diagram-auto-segment-handle/);
  assert.match(s,/if \(preview\) editableRoutes\.push/);
  assert.match(s,/automatic: true, originalGeometry: geometry/);
  assert.match(s,/if \(automatic\) \{[\s\S]*?rendered\.visual\.setAttribute\("d", originalGeometry\.d\)/);
  assert.match(s,/if \(!automatic\) \{[\s\S]*?handle\(point\.x, point\.y, "point", index\)/);
  assert.match(s,/checkpoint\(\);\s*edge\.waypoints = current;/);
  assert.match(s,/report\("Connector route adjusted locally\. Save the projection to persist\."\)/);
  assert.match(s,/renderContextNavigationV010/);
});
