import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createDiagramObstacleSpatialIndexV010 } from "../../dist/vendor/eidos/src/diagram/obstacle-spatial-index.js";
import { diagramEdgeGeometryV010 } from "../../dist/vendor/eidos/src/diagram/edge-paths.js";

const sampleNodes = Array.from({length:75},(_,i)=>({
  id:"n"+i,x:(i%15)*210,y:Math.floor(i/15)*135,width:105,height:64
}));
const oldAll = (nodes,src,dst)=>nodes.filter(n=>n.id!==src&&n.id!==dst)
  .map(({x,y,width,height})=>({x,y,width,height}));

test("P01a spatial index preserves exact routed SVG and congestion semantics",()=>{
  const index=createDiagramObstacleSpatialIndexV010(sampleNodes);
  let compared=0;
  for(const pathKind of ["orthogonal","rounded-orthogonal"]){
    for(let i=0;i<75;i+=3){
      const source=sampleNodes[i],target=sampleNodes[(i*7+13)%75];
      if(source===target)continue;
      const a={x:source.x+source.width,y:source.y+source.height/2};
      const b={x:target.x,y:target.y+target.height/2};
      const old=diagramEdgeGeometryV010(a,b,pathKind,{
        obstacles:oldAll(sampleNodes,source.id,target.id)});
      const next=diagramEdgeGeometryV010(a,b,pathKind,{
        obstacles:index.near(a,b,source.id,target.id),forceRouteWhenEmpty:true});
      assert.deepEqual(next,old,JSON.stringify({source:source.id,target:target.id,pathKind}));
      compared++;
    }
  }
  assert.ok(compared>=45);
});

test("P01a preserves no-unrelated-node legacy elbows, distant-only normalized elbows",()=>{
  const a={x:10,y:40},b={x:300,y:40};
  const pair=[
    {id:"from",x:0,y:0,width:20,height:20},
    {id:"to",x:300,y:0,width:20,height:20}
  ];
  const near=createDiagramObstacleSpatialIndexV010(pair).near(a,b,"from","to");
  assert.deepEqual(near,[]);
  assert.deepEqual(diagramEdgeGeometryV010(a,b,"orthogonal",{obstacles:near}),
    diagramEdgeGeometryV010(a,b,"orthogonal",{obstacles:[]}));
  const distant={id:"far",x:99999,y:99999,width:40,height:40};
  const index=createDiagramObstacleSpatialIndexV010([...pair,distant]);
  assert.deepEqual(index.near(a,b,"from","to"),[]);
  const old=diagramEdgeGeometryV010(a,b,"orthogonal",{obstacles:oldAll([...pair,distant],"from","to")});
  const next=diagramEdgeGeometryV010(a,b,"orthogonal",{
    obstacles:index.near(a,b,"from","to"),forceRouteWhenEmpty:true});
  assert.deepEqual(next,old);
});

test("P01a handles giant distant obstacles and giant query envelopes",()=>{
  const nodes=[
    {id:"a",x:-1000,y:-1000,width:50,height:50},
    {id:"giant",x:-100,y:-100,width:100000,height:100000},
    {id:"b",x:200000,y:0,width:50,height:50},
    {id:"c",x:350,y:100,width:30,height:50}
  ];
  const index=createDiagramObstacleSpatialIndexV010(nodes);
  assert.deepEqual(index.near({x:0,y:0},{x:250,y:100},"a","b"),[
    {x:-100,y:-100,width:100000,height:100000},
    {x:350,y:100,width:30,height:50}
  ]);
  assert.deepEqual(index.near({x:-1000,y:-1000},{x:200000,y:0},"a","b"),[
    {x:-100,y:-100,width:100000,height:100000},
    {x:350,y:100,width:30,height:50}
  ]);
});

test("P01a source-order candidate ties stable and bad geometry rejected",()=>{
  const reverse=[...sampleNodes].reverse();
  const index=createDiagramObstacleSpatialIndexV010(reverse);
  const a={x:100,y:100},b={x:900,y:500};
  const near=index.near(a,b,"n0","n1");
  const candidates=reverse.filter(n=>n.id!=="n0"&&n.id!=="n1"
    &&n.x<=Math.max(a.x,b.x)+134&&n.x+n.width>=Math.min(a.x,b.x)-134
    &&n.y<=Math.max(a.y,b.y)+134&&n.y+n.height>=Math.min(a.y,b.y)-134)
    .map(({x,y,width,height})=>({x,y,width,height}));
  assert.deepEqual(near,candidates);
  assert.throws(()=>createDiagramObstacleSpatialIndexV010([
    {id:"bad",x:NaN,y:0,width:10,height:10}
  ]),/EIDOS_DIAGRAM_SPATIAL_NODE_INVALID/);
});

test("P01a Surface uses exactly one endpoint map and obstacle index per draw",async()=>{
  const source=await readFile(new URL("../../vendor/eidos/src/diagram/surface.ts",import.meta.url),"utf8");
  assert.match(source,/const renderedNodeById = new Map/);
  assert.match(source,/createDiagramObstacleSpatialIndexV010\(renderedNodes\)/);
  assert.match(source,/spatialObstacles\.near\(a, b, edge\.source, edge\.target\)/);
  assert.match(source,/forceRouteWhenEmpty/);
});
