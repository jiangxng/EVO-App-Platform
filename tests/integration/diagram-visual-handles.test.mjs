import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  diagramMoveWaypointV010,diagramEditableOrthogonalSegmentsV010,
  diagramDragOrthogonalSegmentV010
} from "../../dist/vendor/eidos/src/diagram/edge-waypoints.js";

test("App Host vendored drag geometry keeps terminals and business ownership unchanged",()=>{
  const start={x:-50,y:10},end={x:130,y:90};
  const path={pathKind:"rounded-orthogonal",waypoints:[{x:30,y:10},{x:30,y:90}]};
  const initial=JSON.stringify(path);
  const middle=diagramEditableOrthogonalSegmentsV010(start,end,path)[1];
  assert.equal(middle.axis,"x");
  const moved=diagramDragOrthogonalSegmentV010(start,end,path,middle.index,25);
  assert.deepEqual(moved,[{x:55,y:10},{x:55,y:90}]);
  assert.deepEqual(diagramMoveWaypointV010(path.waypoints,0,5,2)[0],{x:35,y:12});
  assert.equal(JSON.stringify(path),initial);
});

test("App Host retains context navigation and cancel-safe visual handles",async()=>{
  const source=await readFile(new URL("../../vendor/eidos/src/diagram/surface.ts",import.meta.url),"utf8");
  assert.match(source,/renderContextNavigationV010/);
  assert.match(source,/data-eidos-diagram-" \+ \(kind === "point"/);
  assert.match(source,/cancelActiveRouteDrag\?\.\(\)/);
  assert.match(source,/diagramDragOrthogonalSegmentV010/);
  assert.match(source,/checkpoint\(\);\s*edge\.waypoints = current/);
  assert.match(source,/target\.addEventListener\("pointercancel", onCancel\)/);
});

test("vendored handles keep minimum 44 CSS pixel hit diameter after zoom",async()=>{
  const src=await readFile(new URL("../../vendor/eidos/src/diagram/surface.ts",import.meta.url),"utf8");
  assert.match(src,/data-eidos-diagram-handle-screen-radius/);
  assert.match(src,/radius \/ camera\.scale/);
  assert.match(src,/target\.setAttribute\("data-eidos-diagram-handle-screen-radius", "22"\)/);
});
