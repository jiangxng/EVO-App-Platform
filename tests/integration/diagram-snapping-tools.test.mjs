import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { diagramSnapHandleOffsetV010, diagramArrangeNodesV010 } from "../../dist/vendor/eidos/src/diagram/snapping.js";

const references = [
  { id: "n", x: 50, y: 80, width: 20, height: 20 }
];
const opts = { scale: 1, tolerancePx: 6, alignToNodes: true };

test("manual waypoint independently aligns to visible geometry and grid without changing topology", () => {
  const moved = diagramSnapHandleOffsetV010(
    { x: 40, y: 70 }, 7, 8, "both", references, opts);
  assert.deepEqual(moved, {
    dx: 10, dy: 10, guideX: 50, guideY: 80, snapX: "node", snapY: "node"
  });
  const source = {x: 1,y: 2}, target = {x: 140,y: 160};
  assert.deepEqual(source, {x:1,y:2});
  assert.deepEqual(target, {x:140,y:160});
  const off = diagramSnapHandleOffsetV010(
    { x: 40, y: 70 }, 7, 8, "both", references, { scale: 1 });
  assert.deepEqual(off, { dx: 7, dy: 8 });
});

test("orthogonal segment snap is strictly perpendicular and stable at different zooms", () => {
  const x = diagramSnapHandleOffsetV010({x:47,y:10}, 2, 40, "x", references, opts);
  assert.equal(x.dx, 3);
  assert.equal(x.dy, 0);
  assert.equal(x.guideX, 50);
  assert.equal(x.guideY, undefined);
  const y = diagramSnapHandleOffsetV010({x:10,y:77}, 90, 2, "y", references, opts);
  assert.equal(y.dx, 0);
  assert.equal(y.dy, 3);
  assert.equal(y.guideY, 80);
  assert.equal(y.guideX, undefined);
  const scaled = diagramSnapHandleOffsetV010({x:47,y:10},2,0,"x",references,
    {scale:3,tolerancePx:6,alignToNodes:true});
  assert.equal(scaled.dx,2);
  assert.equal(scaled.guideX,undefined);
});

test("route handle grid snap works without node guides, low zoom uses adaptive step", () => {
  const a=diagramSnapHandleOffsetV010({x:170,y:11},0,0,"x",[],
    {scale:.1,snapToGrid:true,alignToNodes:false});
  assert.equal(a.dx,22);
  assert.equal(a.dy,0);
  assert.equal(a.snapX,"grid");
  assert.equal(a.guideX,undefined);
  assert.throws(()=>diagramSnapHandleOffsetV010({x:NaN,y:0},0,0,"both",[],opts),
    /EIDOS_DIAGRAM_HANDLE_SNAP_INVALID/);
});

test("alignment anchors to selected primary node, and preserves other coordinate", () => {
  const nodes=[
    {id:"a",x:0,y:10,width:20,height:20},
    {id:"b",x:70,y:40,width:40,height:50},
    {id:"c",x:130,y:80,width:20,height:20}
  ];
  const center=diagramArrangeNodesV010(nodes,"center-x","a");
  assert.deepEqual(center.map(n=>n.x),[0,-10,0]);
  assert.deepEqual(center.map(n=>n.y),[10,40,80]);
  const bottom=diagramArrangeNodesV010(nodes,"bottom","b");
  assert.deepEqual(bottom.map(n=>n.y),[70,40,70]);
  const right=diagramArrangeNodesV010(nodes,"right","a");
  assert.deepEqual(right.map(n=>n.x),[0,-20,0]);
  assert.equal(nodes[1].x,70,"input objects remain unchanged");
});

test("equal gap distribution keeps first and last bounds fixed, independent of array order", () => {
  const nodes=[
    {id:"a",x:0,y:0,width:20,height:10},
    {id:"b",x:45,y:40,width:30,height:10},
    {id:"c",x:130,y:130,width:20,height:10}
  ];
  const distributed=diagramArrangeNodesV010(nodes,"distribute-x");
  assert.deepEqual(distributed.map(n=>n.x),[0,60,130]);
  assert.deepEqual(distributed.map(n=>n.y),[0,40,130]);
  const reverse=diagramArrangeNodesV010([...nodes].reverse(),"distribute-x").reverse();
  assert.deepEqual(reverse,distributed);
  const vertical=diagramArrangeNodesV010(nodes,"distribute-y");
  assert.deepEqual(vertical.map(n=>n.y),[0,65,130]);
});

test("invalid arrangements reject rather than creating overlaps or undo steps", () => {
  const one=[{id:"a",x:0,y:0,width:20,height:20}];
  assert.throws(()=>diagramArrangeNodesV010(one,"left"),/EIDOS_DIAGRAM_ARRANGE_INVALID/);
  assert.throws(()=>diagramArrangeNodesV010([...one, {...one[0],id:"b",x:5}], "distribute-x"),
    /EIDOS_DIAGRAM_ARRANGE_INVALID/);
  const squeezed=[
    {id:"a",x:0,y:0,width:40,height:10},
    {id:"b",x:30,y:0,width:40,height:10},
    {id:"c",x:50,y:0,width:40,height:10}
  ];
  assert.throws(()=>diagramArrangeNodesV010(squeezed,"distribute-x"),
    /EIDOS_DIAGRAM_DISTRIBUTE_NO_SPACE/);
  assert.throws(()=>diagramArrangeNodesV010([one[0],one[0]],"left"),
    /EIDOS_DIAGRAM_ARRANGE_INVALID/);
});

test("surface exposes explicit commands and cleans route guides on cancellation and release", async () => {
  const src=await readFile(new URL("../../vendor/eidos/src/diagram/surface.ts",import.meta.url),"utf8");
  assert.match(src,/data-eidos-diagram-arrange/);
  assert.match(src,/const applyLocalArrangement/);
  assert.match(src,/checkpoint\(\);[\s\S]*?const before = new Map/);
  assert.match(src,/diagramSnapHandleOffsetV010/);
  assert.match(src,/const onCancel = \(\): void => \{[\s\S]*?resetPreview\(\);\s*drawSnapGuides\(\)/);
  assert.match(src,/cleanup\(\);\s*drawSnapGuides\(\)/);
  assert.match(src,/renderContextNavigationV010|diagramEditorInstanceSequence/);
});
