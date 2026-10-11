import test from "node:test";
import assert from "node:assert/strict";
import {routeDiagramOrthogonalV010} from "../../dist/vendor/eidos/src/diagram/obstacle-routing.js";
import {diagramCaptionLayoutV010} from "../../dist/vendor/eidos/src/diagram/label-reservation.js";

const margin=14;
const crosses=(a,b,o)=>{
 const l=o.x-margin,r=o.x+o.width+margin;
 const t=o.y-margin,d=o.y+o.height+margin;
 if(a.x===b.x)return a.x>l&&a.x<r&&Math.max(a.y,b.y)>t&&Math.min(a.y,b.y)<d;
 if(a.y===b.y)return a.y>t&&a.y<d&&Math.max(a.x,b.x)>l&&Math.min(a.x,b.x)<r;
 return true;
};
const safe=(path,obstacles)=>{
 for(let j=1;j<path.length;j++){
  const a=path[j-1],b=path[j];
  assert.ok(a.x===b.x||a.y===b.y,"only orthogonal segments");
  for(const o of obstacles) assert.equal(crosses(a,b,o),false,"no hidden obstacle intersection");
 }
};

test("B8t exact 22-related-obstacle boundary keeps a safe deterministic detour",()=>{
 const start={x:0,y:0},end={x:500,y:0};
 const obstacles=Array.from({length:22},(_,i)=>({x:35+i*18,y:-10,width:11,height:20}));
 const first=routeDiagramOrthogonalV010(start,end,obstacles);
 assert.ok(first,"22 relevant obstacles may route inside unchanged safety budget");
 assert.deepEqual(first[0],start);
 assert.deepEqual(first.at(-1),end);
 safe(first,obstacles);
 for(let i=0;i<8;i++)
  assert.deepEqual(routeDiagramOrthogonalV010(start,end,obstacles),first,
   "stable geometry for unchanged presentation graph");
});

test("B8t 23 relevant obstacles cannot silently exceed safe local budget",()=>{
 const start={x:0,y:0},end={x:500,y:0};
 const obstacles=Array.from({length:23},(_,i)=>({x:35+i*18,y:-10,width:11,height:20}));
 assert.equal(routeDiagramOrthogonalV010(start,end,obstacles),undefined);
});

test("B8t distant unrelated nodes do not consume the 22-obstacle budget",()=>{
 const start={x:0,y:0},end={x:500,y:0};
 const far=Array.from({length:600},(_,i)=>({x:10000+i*30,y:10000,width:10,height:10}));
 const baseline=routeDiagramOrthogonalV010(start,end,[]);
 assert.deepEqual(routeDiagramOrthogonalV010(start,end,far),baseline);
});

test("B8t generated obstacle lanes preserve exact endpoints and safety",()=>{
 let found=0;
 for(let i=0;i<64;i++){
  const a={x:0,y:i*6},b={x:540,y:i*6};
  const obstacles=Array.from({length:8},(_,j)=>({
   x:64+j*55,y:i*6+(j%2===0?-22:-15),width:18,height:30
  }));
  const path=routeDiagramOrthogonalV010(a,b,obstacles);
  if(!path)continue; // safe bounded refusal is permitted
  found++;
  assert.deepEqual(path[0],a);
  assert.deepEqual(path.at(-1),b);
  safe(path,obstacles);
 }
 assert.ok(found>=8,"route useful lanes without weakening safety");
});

test("B8u combining marks and ZWJ emoji stay in complete grapheme clusters",()=>{
 const anchor={x:300,y:160};
 const emoji="👩‍💻",composed="שָׁלוֹם";
 const value=(composed+" "+emoji+" ").repeat(45);
 const measure=s=>({width:[...s].length*9,actualBoundingBoxAscent:11,
  actualBoundingBoxDescent:3});
 const layout=diagramCaptionLayoutV010(anchor,value,measure,156,4);
 assert.equal(layout.direction,"rtl");
 assert.ok(layout.lines.length<=4);
 assert.equal(layout.truncated,true);
 assert.ok(layout.lines.at(-1).endsWith("…"));
 assert.equal(layout.lines.join("").includes("👩"),layout.lines.join("").includes(emoji),
  "emoji must not split on a ZWJ boundary");
 assert.ok(layout.box.width<=164+1e-6);
 assert.deepEqual(diagramCaptionLayoutV010(anchor,value,measure,156,4),layout);
});
