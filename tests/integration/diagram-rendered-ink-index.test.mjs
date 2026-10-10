import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {
  diagramSvgInkSegmentsV010,
  createDiagramInkSpatialIndexV010
} from "../../dist/vendor/eidos/src/diagram/ink-spatial-index.js";
import {diagramSelfLoopDecisionV010} from "../../dist/vendor/eidos/src/diagram/edge-lanes.js";

const loop={x:100,y:100,width:160,height:120};
const point=(x,y)=>({x,y});
const rect=(x,y,width,height)=>({x,y,width,height});

test("B8j actual cubic bulge occupies the right corridor where its end-to-end chord does not",()=>{
  const d="M 50 40 C 500 40 500 300 50 300";
  const actual=diagramSvgInkSegmentsV010(d);
  assert.ok(actual.length>8 && actual.length<=256,"C must be subdivided, not endpoint chord");
  assert.deepEqual(actual[0].start,point(50,40));
  assert.deepEqual(actual.at(-1).end,point(50,300));
  const centerChord=[{start:point(50,40),end:point(50,300)}];
  const old=diagramSelfLoopDecisionV010(loop,[],0,[],{segments:centerChord});
  const improved=diagramSelfLoopDecisionV010(loop,[],0,[],{segments:actual});
  assert.equal(old.side,"right","B8i centerline estimate did not see outward cubic");
  const forced=diagramSelfLoopDecisionV010(loop,[],0,
    [...Array(40).fill("bottom"),...Array(40).fill("left"),
      ...Array(40).fill("top")],{segments:actual});
  assert.notEqual(improved.side,"right",
    "B8j curved route should be preferred away from stroke; debug="+JSON.stringify({
      improved,forced,midpoint:actual[Math.floor(actual.length/2)],
      segments:actual.length
    }));
});

test("B8j corner Q and full cubic C are recursively flattened in source order",()=>{
  const d="M 0 0 L 20 0 Q 60 0 60 40 L 60 60 C 60 110 90 110 90 60";
  const segments=diagramSvgInkSegmentsV010(d);
  assert.ok(segments.length>10);
  assert.deepEqual(segments[0],{start:point(0,0),end:point(20,0)});
  assert.deepEqual(segments.at(-1).end,point(90,60));
  for(let i=1;i<segments.length;i++)
    assert.deepEqual(segments[i].start,segments[i-1].end,
      "adaptive subdivision may not leave gaps in a rounded connector");
});

test("B8j flat segments, degenerate curves and bounded coordinate guards",()=>{
  assert.deepEqual(diagramSvgInkSegmentsV010("M 1 2 L 3 4"),[
    {start:point(1,2),end:point(3,4)}
  ]);
  const degenerate=diagramSvgInkSegmentsV010("M 1 1 C 1 1 1 1 1 1");
  assert.equal(degenerate.length,1);
  assert.throws(()=>diagramSvgInkSegmentsV010("M 0 0 Q NaN 0 1 1"),
    /EIDOS_DIAGRAM_INK_INVALID/);
  assert.throws(()=>diagramSvgInkSegmentsV010("M 0 0 L 100000000000 0"),
    /EIDOS_DIAGRAM_INK_INVALID/);
});

test("B8k spatial index excludes unrelated distant ink and source incident edges",()=>{
  const far=Array.from({length:6000},(_,i)=>({
    edgeId:"far-"+i,sourceId:"a-"+i,targetId:"b-"+i,
    segments:[{start:point(5000+i*10,6000),end:point(5005+i*10,6080)}],
    labels:[rect(5000+i*10,6100,30,12)]
  }));
  const crossing={
    edgeId:"crossing",sourceId:"from",targetId:"to",
    segments:diagramSvgInkSegmentsV010("M 50 40 C 500 40 500 300 50 300"),
    labels:[rect(280,130,36,14)]
  };
  const incident={
    edgeId:"incident",sourceId:"self",targetId:"to",
    segments:[{start:point(310,120),end:point(310,200)}],
    labels:[rect(280,150,35,20)]
  };
  const index=createDiagramInkSpatialIndexV010([...far,crossing,incident]);
  const nearby=index.near("self",loop,190);
  assert.ok(nearby.segments.length>8 && nearby.segments.length<300);
  assert.deepEqual(nearby.labels,[crossing.labels[0]]);
  const allButIncident=createDiagramInkSpatialIndexV010([crossing])
    .near("self",loop,190);
  assert.deepEqual(nearby,allButIncident,"distant and incident edges must not pollute scoring");
});

test("B8k enormous segments crossing many spatial buckets remain discoverable",()=>{
  const giant={
    edgeId:"giant",sourceId:"far-west",targetId:"far-east",
    segments:[{start:point(-10000,160),end:point(10000,160)}],
    labels:[]
  };
  const index=createDiagramInkSpatialIndexV010([giant]);
  const near=index.near("self",loop,170);
  assert.equal(near.segments.length,1);
  assert.deepEqual(near.segments[0],giant.segments[0]);
  assert.throws(()=>index.near("self",loop,-1),/EIDOS_DIAGRAM_INK_QUERY_INVALID/);
});

test("B8j+B8k renderer computes route ink once and shares it between Designer and Viewer",async()=>{
  const code=await readFile(new URL("../../vendor/eidos/src/diagram/surface.ts",import.meta.url),"utf8");
  assert.match(code,/diagramSvgInkSegmentsV010\(geometry.d\)/);
  assert.match(code,/const loopInkIndex=inkEntries.length/);
  assert.match(code,/createDiagramInkSpatialIndexV010\(inkEntries\)/);
  assert.match(code,/loopInkIndex.near\(nodeId,node/);
  assert.match(code,/preciseRouteGeometries.get\(edge.id\)/);
  assert.match(code,/renderedEdges.length <= 12000/);
  assert.match(code,/inkSegmentCount\+parsed.length<=100000/);
});
