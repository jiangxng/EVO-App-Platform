import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  diagramSelfLoopGeometryV010, diagramSelfLoopRouteControlsV010
} from "../../dist/vendor/eidos/src/diagram/edge-lanes.js";
import { diagramEditableOrthogonalSegmentsV010,
  diagramDragOrthogonalSegmentV010,
  diagramTranslateWaypointsV010 } from "../../dist/vendor/eidos/src/diagram/edge-waypoints.js";

const node = {x:80,y:100,width:160,height:180};

test("B8f original automatic self-loop SVG unchanged until explicit edit",()=>{
  for(const kind of ["straight","orthogonal","rounded-orthogonal","curve"]){
    const automatic=diagramSelfLoopGeometryV010(node,kind);
    assert.equal(automatic.kind,kind);
    assert.match(automatic.d,/^M 240 150\.4 /);
    assert.match(automatic.d,/240 229\.6$/);
    if(kind==="straight")continue;
    const controls=diagramSelfLoopRouteControlsV010(node,kind);
    assert.deepEqual(controls.start,{x:240,y:150.4});
    assert.deepEqual(controls.end,{x:240,y:229.6});
    assert.ok(controls.waypoints.every(p=>p.x>240));
    const exact=diagramSelfLoopGeometryV010(node,kind,0,controls.waypoints);
    assert.equal(exact.d,automatic.d,"Default converted self-loop must not visually jump");
    assert.equal(exact.kind,kind);
  }
});

test("B8f edit self-loop orthogonal and rounded segments without mutating topology",()=>{
  for(const kind of ["orthogonal","rounded-orthogonal"]){
    const {start,end,waypoints}=diagramSelfLoopRouteControlsV010(node,kind,14);
    const snapshot=structuredClone(waypoints);
    const handles=diagramEditableOrthogonalSegmentsV010(start,end,{pathKind:kind,waypoints});
    assert.ok(handles.length>=3);
    const side=handles.find(h=>h.axis==="x");
    assert.ok(side,"The outer self-loop segment must allow perpendicular drag");
    const shifted=diagramDragOrthogonalSegmentV010(
      start,end,{pathKind:kind,waypoints},side.index,36);
    assert.deepEqual(waypoints,snapshot);
    assert.ok(shifted.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
    const before=diagramSelfLoopGeometryV010(node,kind,14);
    const after=diagramSelfLoopGeometryV010(node,kind,14,shifted);
    assert.notEqual(after.d,before.d);
    assert.ok(after.d.startsWith("M 240 150.4 "));
    assert.ok(after.d.endsWith("240 229.6"));
    if(kind==="rounded-orthogonal")assert.match(after.d,/ Q /);
    assert.equal(diagramSelfLoopGeometryV010(node,kind,14).d,before.d);
  }
});

test("B8f curve self-loop bulge follows one explicit point, preserving right-side anchors",()=>{
  const kind="curve",preset=diagramSelfLoopRouteControlsV010(node,kind);
  assert.equal(preset.waypoints.length,1);
  const original=diagramSelfLoopGeometryV010(node,kind);
  const saved=diagramSelfLoopGeometryV010(node,kind,0,preset.waypoints);
  assert.equal(saved.d,original.d);
  const moved=[{x:preset.waypoints[0].x+44,y:preset.waypoints[0].y-20}];
  const edited=diagramSelfLoopGeometryV010(node,kind,0,moved);
  assert.notEqual(edited.d,original.d);
  assert.ok(edited.d.startsWith("M 240 150.4 C "));
  assert.ok(edited.d.endsWith("240 229.6"));
  assert.deepEqual(edited.label,{x:moved[0].x+2,y:moved[0].y});
  assert.equal(diagramSelfLoopGeometryV010(node,kind,0,preset.waypoints).d,original.d);
  assert.throws(()=>diagramSelfLoopGeometryV010(node,kind,0,[{x:248,y:190}]),
    /EIDOS_DIAGRAM_LOOP_BULGE_INVALID/);
});

test("B8f node move translates only displayed loop waypoints, not business endpoints",()=>{
  const kind="rounded-orthogonal",initial=diagramSelfLoopRouteControlsV010(node,kind,14);
  const shifted=diagramTranslateWaypointsV010(initial.waypoints,40,55);
  const moved={...node,x:node.x+40,y:node.y+55};
  const initialSvg=diagramSelfLoopGeometryV010(node,kind,14,initial.waypoints);
  const movedSvg=diagramSelfLoopGeometryV010(moved,kind,14,shifted);
  assert.notEqual(movedSvg.d,initialSvg.d);
  assert.ok(movedSvg.d.startsWith("M 280 205.4 "));
  assert.ok(movedSvg.d.endsWith("280 284.6"));
  assert.deepEqual(initial.waypoints,diagramSelfLoopRouteControlsV010(node,kind,14).waypoints);
  assert.throws(()=>diagramSelfLoopGeometryV010(node,kind,14,[{x:NaN,y:0}]),
    /EIDOS_DIAGRAM_LOOP_WAYPOINT_INVALID/);
});

test("B8f self-loop route shown in Surface and every read-only Viewer render",async()=>{
  const source=await readFile(new URL("../../vendor/eidos/src/diagram/surface.ts",import.meta.url),"utf8");
  assert.match(source,/diagramSelfLoopRouteControlsV010/);
  assert.match(source,/diagramSelfLoopGeometryV010\(source, edge\.pathKind, lane,\s*edge\.waypoints, loopObstacles, loopReservations\)/);
  assert.match(source,/diagramSelfLoopGeometryV010\(source, edge\.pathKind, lane, points,/);
  assert.match(source,/diagramSelfLoopGeometryV010\(loopNode, edge\.pathKind!, laneOffset, points,/);
  assert.match(source,/loopNode && edge\.pathKind === "curve"/);
  assert.match(source,/edge\.waypoints = current/);
  assert.match(source,/checkpoint\(\);\s*edge\.waypoints = current/);
});
