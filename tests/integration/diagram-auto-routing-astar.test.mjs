import test from "node:test";
import assert from "node:assert/strict";
import {routeDiagramOrthogonalV010} from "../../dist/vendor/eidos/src/diagram/obstacle-routing.js";
import {diagramEdgeGeometryV010} from "../../dist/vendor/eidos/src/diagram/edge-paths.js";
const crosses=(a,b,r,pad=14)=>{
 const l=r.x-pad,t=r.y-pad,rr=r.x+r.width+pad,bb=r.y+r.height+pad;
 if(Math.abs(a.y-b.y)<1e-7)return a.y>t+1e-7&&a.y<bb-1e-7
  &&Math.max(a.x,b.x)>l+1e-7&&Math.min(a.x,b.x)<rr-1e-7;
 if(Math.abs(a.x-b.x)<1e-7)return a.x>l+1e-7&&a.x<rr-1e-7
  &&Math.max(a.y,b.y)>t+1e-7&&Math.min(a.y,b.y)<bb-1e-7;
 return true;
};
test("B8r A* automatic router detours real obstacle without crossing clearance",()=>{
 const a={x:0,y:90},b={x:460,y:90};
 const blockers=[{x:125,y:30,width:90,height:100}];
 const route=routeDiagramOrthogonalV010(a,b,blockers);
 assert.ok(route&&route.length>=4);
 assert.deepEqual(route[0],a);assert.deepEqual(route.at(-1),b);
 for(let i=1;i<route.length;i++)
   assert.ok(!crosses(route[i-1],route[i],blockers[0]));
 assert.deepEqual(route,routeDiagramOrthogonalV010(a,b,blockers));
 const rounded=diagramEdgeGeometryV010(a,b,"rounded-orthogonal",{obstacles:blockers});
 assert.match(rounded.d,/ Q /);
});
test("B8r direct corridor remains a short direct orthogonal path",()=>{
 const a={x:0,y:0},b={x:220,y:0};
 const route=routeDiagramOrthogonalV010(a,b,[{x:500,y:500,width:60,height:60}]);
 assert.deepEqual(route,[a,b]);
});
test("B8r 200 legal unrelated-node paths remain bounded/deterministic",()=>{
 const grid=Array.from({length:144},(_,i)=>({
  x:40+(i%12)*170,y:45+Math.floor(i/12)*120,width:110,height:52
 }));
 let routed=0;
 for(let i=0;i<200;i++){
  const source=i%144,target=(source+1)%144;
  const a={x:grid[source].x+110,y:grid[source].y+26};
  const b={x:grid[target].x,y:grid[target].y+26};
  const obstacles=grid.filter((_,j)=>j!==source&&j!==target
   && Math.abs(grid[j].x-a.x)<250&&Math.abs(grid[j].y-a.y)<180);
  const result=routeDiagramOrthogonalV010(a,b,obstacles);
  if(result){
   routed++; assert.deepEqual(result[0],a);assert.deepEqual(result.at(-1),b);
   for(let k=1;k<result.length;k++)for(const r of obstacles)
    assert.equal(crosses(result[k-1],result[k],r),false,
     "auto-route must not cross expanded unrelated node");
  }
 }
 assert.ok(routed>80);
});
