import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { diagramSelfLoopSideV010, diagramSelfLoopManualSideV010,
  diagramSelfLoopRouteControlsV010, diagramSelfLoopGeometryV010
} from "../../dist/vendor/eidos/src/diagram/edge-lanes.js";

const source={x:100,y:120,width:180,height:100};
const rightBlock={x:290,y:126,width:96,height:92};
const bottomBlock={x:135,y:225,width:100,height:80};
const leftBlock={x:-10,y:126,width:105,height:92};

test("B8g default self-loops retain original right SVG and path kind",()=>{
  for(const kind of ["straight","orthogonal","rounded-orthogonal","curve"]) {
    const original=diagramSelfLoopGeometryV010(source,kind);
    assert.equal(diagramSelfLoopSideV010(source,[]),"right");
    assert.deepEqual(diagramSelfLoopGeometryV010(source,kind,0,undefined,[]),original);
    assert.equal(original.kind,kind);
  }
});

test("B8g right blocked switches to bottom, then left, then top on crowded canvas",()=>{
  assert.equal(diagramSelfLoopSideV010(source,[rightBlock]),"bottom");
  assert.equal(diagramSelfLoopSideV010(source,[rightBlock,bottomBlock]),"left");
  assert.equal(diagramSelfLoopSideV010(source,[rightBlock,bottomBlock,leftBlock]),"top");
  const all=[rightBlock,bottomBlock,leftBlock];
  for(const kind of ["straight","orthogonal","rounded-orthogonal","curve"]){
    const top=diagramSelfLoopGeometryV010(source,kind,0,undefined,all);
    assert.equal(top.kind,kind);
    assert.ok(top.d.startsWith("M 150.4 120 "));
    assert.ok(top.d.endsWith("229.6 120"));
    const bottom=diagramSelfLoopGeometryV010(source,kind,0,undefined,[rightBlock]);
    assert.ok(bottom.d.startsWith("M 150.4 220 "));
    assert.ok(bottom.d.endsWith("229.6 220"));
    assert.notEqual(bottom.d,diagramSelfLoopGeometryV010(source,kind).d);
  }
});

test("B8g manual bottom bulge keeps its route when obstruction changes",()=>{
  const auto=diagramSelfLoopRouteControlsV010(source,"curve",0,[rightBlock]);
  assert.equal(auto.side,"bottom");
  assert.equal(auto.waypoints.length,1);
  assert.ok(auto.waypoints[0].y>source.y+source.height);
  const initial=diagramSelfLoopGeometryV010(source,"curve",0,auto.waypoints,[rightBlock]);
  const noBlock=diagramSelfLoopGeometryV010(source,"curve",0,auto.waypoints,[]);
  assert.equal(noBlock.d,initial.d,
    "manual side must not flip to right merely because a neighbor disappears");
  assert.equal(diagramSelfLoopManualSideV010(source,auto.waypoints),"bottom");
  const pushed=[{x:auto.waypoints[0].x+18,y:auto.waypoints[0].y+44}];
  const edited=diagramSelfLoopGeometryV010(source,"curve",0,pushed,[]);
  assert.match(edited.d,/ C /);
  assert.notEqual(edited.d,initial.d);
  assert.ok(edited.d.startsWith("M 150.4 220 "));
  assert.ok(edited.d.endsWith("229.6 220"));
  assert.equal(diagramSelfLoopRouteControlsV010(source,"curve",0,[],pushed).side,"bottom");
});

test("B8g rounded manual path retains direction, geometry and fixed endpoint",()=>{
  const control=diagramSelfLoopRouteControlsV010(source,"rounded-orthogonal",0,[rightBlock]);
  assert.equal(control.side,"bottom");
  const rounded=diagramSelfLoopGeometryV010(source,"rounded-orthogonal",0,
    control.waypoints,[rightBlock]);
  assert.match(rounded.d,/ Q /);
  assert.equal(rounded.d,diagramSelfLoopGeometryV010(source,"rounded-orthogonal",0,
    control.waypoints,[]).d);
  assert.ok(rounded.d.startsWith("M 150.4 220 "));
  assert.ok(rounded.d.endsWith("229.6 220"));
  assert.deepEqual(control.waypoints,
    diagramSelfLoopRouteControlsV010(source,"rounded-orthogonal",0,[rightBlock]).waypoints);
});

test("B8g route selection is stable under obstacle reordering, ties and bad input",()=>{
  const crowded=[rightBlock,bottomBlock,leftBlock];
  const expected=diagramSelfLoopSideV010(source,crowded);
  assert.equal(diagramSelfLoopSideV010(source,[leftBlock,rightBlock,bottomBlock]),expected);
  assert.equal(diagramSelfLoopSideV010(source,[bottomBlock,leftBlock,rightBlock]),expected);
  assert.throws(()=>diagramSelfLoopSideV010(source,[{x:NaN,y:0,width:20,height:20}]),
    /EIDOS_DIAGRAM_LOOP_INVALID/);
  assert.throws(()=>diagramSelfLoopSideV010(source,[{x:0,y:0,width:-1,height:20}]),
    /EIDOS_DIAGRAM_LOOP_INVALID/);
});

test("B8g Surface passes visible obstacle geometry into both Designer and Viewer",async()=>{
  const s=await readFile(new URL("../../vendor/eidos/src/diagram/surface.ts",import.meta.url),"utf8");
  assert.match(s,/const loopObstacles = edge.source === edge.target/);
  assert.match(s,/diagramSelfLoopGeometryV010\(source, edge\.pathKind, lane,\s*edge\.waypoints, loopObstacles\)/);
  assert.match(s,/diagramSelfLoopRouteControlsV010\(source, edge\.pathKind,\s*lane, loopObstacles, edge\.waypoints\)/);
  assert.match(s,/diagramSelfLoopGeometryV010\(source, edge\.pathKind, lane, points,/);
  assert.match(s,/renderedNodes\.filter\(other => other\.id !== edge\.source\)/);
});

test("B8g spatial neighborhood and full obstacle scan give identical sides",async()=>{
  const {createDiagramObstacleSpatialIndexV010}=await import(
    "../../dist/vendor/eidos/src/diagram/obstacle-spatial-index.js");
  const nodes=[
    {id:"self",...source},
    {id:"right",...rightBlock},
    {id:"bottom",...bottomBlock},
    {id:"far",x:5000,y:5000,width:40,height:40},
    {id:"large",x:-4000,y:source.y+15,width:4080,height:50}
  ];
  const index=createDiagramObstacleSpatialIndexV010(nodes);
  const near=index.near({x:source.x,y:source.y},
    {x:source.x+source.width,y:source.y+source.height},"self","self");
  assert.equal(diagramSelfLoopSideV010(source,near),
    diagramSelfLoopSideV010(source,nodes.slice(1)),
    "B8g large-graph shortcut must not miss near or enormous blocking nodes");
  const s=await readFile(new URL("../../vendor/eidos/src/diagram/surface.ts",import.meta.url),"utf8");
  assert.match(s,/reach \+ 22 <= 134/);
  assert.match(s,/spatialObstacles\.near\(\{ x: source\.x, y: source\.y \}/);
});
