import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  diagramOverlappingSegmentForWaypointV010,
  diagramEditableOrthogonalSegmentsV010,
  diagramDragOrthogonalSegmentV010,
  diagramManualEdgeGeometryV010
} from "../../dist/vendor/eidos/src/diagram/edge-waypoints.js";

test("B8c Shift picks closest overlapping segment and Shift+Alt picks next",()=>{
  const center={x:100,y:100};
  const segments=[
    {index:5,x:124,y:100,axis:"y"},
    {index:1,x:90,y:100,axis:"x"},
    {index:0,x:145,y:100,axis:"y"},
    {index:3,x:110,y:100,axis:"y"}
  ];
  const snapshot=structuredClone(segments);
  assert.equal(diagramOverlappingSegmentForWaypointV010(center,segments,1)?.index,1);
  assert.equal(diagramOverlappingSegmentForWaypointV010(center,segments,1,true)?.index,3);
  assert.equal(diagramOverlappingSegmentForWaypointV010(center,segments,2)?.index,1);
  assert.equal(diagramOverlappingSegmentForWaypointV010(center,segments,2,true)?.index,3);
  assert.equal(diagramOverlappingSegmentForWaypointV010(center,segments,.5)?.index,1);
  assert.equal(diagramOverlappingSegmentForWaypointV010(center,segments,10),undefined);
  assert.deepEqual(segments,snapshot,"hit selection never alters manual coordinates");
});

test("B8c same-location waypoint and segment remains draggable without reduced target",()=>{
  const start={x:0,y:0},end={x:240,y:0},controls=[{x:120,y:0}];
  const handles=diagramEditableOrthogonalSegmentsV010(start,end,{
    pathKind:"orthogonal",waypoints:controls
  });
  const nearest=diagramOverlappingSegmentForWaypointV010(controls[0],handles,1);
  assert.ok(nearest);
  assert.equal(nearest.axis,"y");
  const next=diagramDragOrthogonalSegmentV010(start,end,
    {pathKind:"orthogonal",waypoints:controls},nearest.index,55);
  assert.ok(next.length);
  assert.deepEqual(controls,[{x:120,y:0}]);
  assert.notEqual(
    diagramManualEdgeGeometryV010(start,end,{pathKind:"orthogonal",waypoints:next}).d,
    diagramManualEdgeGeometryV010(start,end,{pathKind:"orthogonal",waypoints:controls}).d
  );
});

test("B8c no fallback for out-of-range, bad camera or points",()=>{
  const point={x:0,y:0},segment={index:0,x:100,y:0,axis:"y"};
  assert.equal(diagramOverlappingSegmentForWaypointV010(point,[segment],1),undefined);
  assert.equal(diagramOverlappingSegmentForWaypointV010(point,[segment],0),undefined);
  assert.equal(diagramOverlappingSegmentForWaypointV010(point,[segment],Infinity),undefined);
  assert.equal(diagramOverlappingSegmentForWaypointV010({x:NaN,y:0},[segment],1),undefined);
  const ties=[
    {index:2,x:-15,y:0,axis:"y"},
    {index:1,x:15,y:0,axis:"x"}
  ];
  assert.equal(diagramOverlappingSegmentForWaypointV010(point,ties,1)?.index,1);
  assert.equal(diagramOverlappingSegmentForWaypointV010(point,ties,1,true)?.index,2);
});

test("B8c Surface exposes the accessible Shift+drag affordance and preserves one Undo",async()=>{
  const s=await readFile(new URL("../../vendor/eidos/src/diagram/surface.ts",import.meta.url),"utf8");
  assert.match(s,/data-eidos-diagram-overlap-point/);
  assert.match(s,/Shift-drag overlapping segment/);
  assert.match(s,/kind === "point" && event\.shiftKey/);
  assert.match(s,/event\.altKey/);
  assert.match(s,/dragKind === "point"[\s\S]*?diagramMoveWaypointV010/);
  assert.match(s,/diagramDragOrthogonalSegmentV010\([\s\S]*?dragIndex, dragAxis/);
  assert.match(s,/if \(!overlap\) \{/);
  assert.match(s,/checkpoint\(\);\s*edge\.waypoints = current;/);
  assert.match(s,/target\.setAttribute\("r", String\(22 \/ camera\.scale\)\)/);
});
