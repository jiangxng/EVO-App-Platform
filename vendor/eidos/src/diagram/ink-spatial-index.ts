/** B8j+B8k: bounded rendered-SVG ink extraction and spatial lookup.
 * Only presentation coordinates, never persisted graph topology or paths.
 * Q/C are recursively flattened to a maximum 1.5-world-unit deviation
 * (or a conservative 8-level cap); this is not analytical curve intersection.
 */
import type { DiagramEdgePointV010 } from "./edge-paths.js";

export interface DiagramInkSegmentV010 {
  start: DiagramEdgePointV010; end: DiagramEdgePointV010;
}
export interface DiagramInkRectV010 {
  x: number; y: number; width: number; height: number;
}
export interface DiagramInkEntryV010 {
  edgeId: string; sourceId: string; targetId: string;
  segments: readonly DiagramInkSegmentV010[];
  labels: readonly DiagramInkRectV010[];
}
const GRID=256,MAX_ENTRY_CELLS=64,MAX_QUERY_CELLS=4096;
const MAX_CURVE_DEPTH=8,MAX_PATH_SEGMENTS=8192;
const point=(x:number,y:number):DiagramEdgePointV010=>({x,y});
const half=(a:DiagramEdgePointV010,b:DiagramEdgePointV010)=>
  point((a.x+b.x)/2,(a.y+b.y)/2);
function distanceFromLine(
  p:DiagramEdgePointV010,a:DiagramEdgePointV010,b:DiagramEdgePointV010
):number {
  const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
  return length<1e-9 ? Math.hypot(p.x-a.x,p.y-a.y)
    : Math.abs(dx*(a.y-p.y)-(a.x-p.x)*dy)/length;
}
/** Convert M/L/Q/C absolute SVG geometry to deterministic world-space
 * line segments. The input comes from the renderer, not arbitrary raw SVG.
 */
export function diagramSvgInkSegmentsV010(d:string):DiagramInkSegmentV010[]{
  if(typeof d!=="string" || d.length>150000)throw Error("EIDOS_DIAGRAM_INK_INVALID");
  const tokens=d.match(/[MLQC]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g)??[];
  const result:DiagramInkSegmentV010[]=[];
  let current=point(0,0),i=0,opened=false;
  const n=():number=>{
    if(i>=tokens.length || /^[MLQC]$/.test(tokens[i]!))throw Error("EIDOS_DIAGRAM_INK_INVALID");
    const v=Number(tokens[i++]!);
    if(!Number.isFinite(v)||Math.abs(v)>1e8)throw Error("EIDOS_DIAGRAM_INK_INVALID");
    return v;
  };
  const xy=()=>point(n(),n());
  const line=(a:DiagramEdgePointV010,b:DiagramEdgePointV010):void=>{
    if(result.length>=MAX_PATH_SEGMENTS)throw Error("EIDOS_DIAGRAM_INK_COMPLEXITY");
    result.push({start:a,end:b});
  };
  const quad=(a:DiagramEdgePointV010,b:DiagramEdgePointV010,
    c:DiagramEdgePointV010,depth:number):void=>{
    if(depth>=MAX_CURVE_DEPTH || distanceFromLine(b,a,c)<=1.5){
      line(a,c);return;
    }
    const ab=half(a,b),bc=half(b,c),mid=half(ab,bc);
    quad(a,ab,mid,depth+1);quad(mid,bc,c,depth+1);
  };
  const cubic=(a:DiagramEdgePointV010,b:DiagramEdgePointV010,
    c:DiagramEdgePointV010,d0:DiagramEdgePointV010,depth:number):void=>{
    if(depth>=MAX_CURVE_DEPTH ||
      Math.max(distanceFromLine(b,a,d0),distanceFromLine(c,a,d0))<=1.5){
      line(a,d0);return;
    }
    const ab=half(a,b),bc=half(b,c),cd=half(c,d0);
    const abc=half(ab,bc),bcd=half(bc,cd),mid=half(abc,bcd);
    cubic(a,ab,abc,mid,depth+1);cubic(mid,bcd,cd,d0,depth+1);
  };
  while(i<tokens.length){
    const cmd=tokens[i++]!;
    if(cmd==="M"){current=xy();opened=true;}
    else if(cmd==="L"&&opened){const end=xy();line(current,end);current=end;}
    else if(cmd==="Q"&&opened){const control=xy(),end=xy();
      quad(current,control,end,0);current=end;
    }else if(cmd==="C"&&opened){const b=xy(),c=xy(),end=xy();
      cubic(current,b,c,end,0);current=end;
    }else throw Error("EIDOS_DIAGRAM_INK_INVALID");
  }
  return result;
}
function bounds(entry:DiagramInkEntryV010){
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(const seg of entry.segments)for(const p of [seg.start,seg.end]){
    x0=Math.min(x0,p.x);y0=Math.min(y0,p.y);
    x1=Math.max(x1,p.x);y1=Math.max(y1,p.y);
  }
  for(const r of entry.labels){
    x0=Math.min(x0,r.x);y0=Math.min(y0,r.y);
    x1=Math.max(x1,r.x+r.width);y1=Math.max(y1,r.y+r.height);
  }
  return {x0,y0,x1,y1};
}
export interface DiagramInkSpatialIndexV010 {
  near(nodeId:string,node:DiagramInkRectV010,pad:number):{
    segments:DiagramInkSegmentV010[];labels:DiagramInkRectV010[];
  };
}
/** Build once per render. Large-line envelopes become explicit overflow
 * entries. Queries never silently omit huge or far-reaching connectors.
 */
export function createDiagramInkSpatialIndexV010(
  entries:readonly DiagramInkEntryV010[]
):DiagramInkSpatialIndexV010 {
  const buckets=new Map<string,number[]>(),oversize:number[]=[];
  const boxes=entries.map(bounds);
  const key=(x:number,y:number)=>x+":"+y;
  entries.forEach((e,i)=>{
    const box=boxes[i]!;
    if(!Number.isFinite(box.x0))return;
    const a=Math.floor(box.x0/GRID),b=Math.floor(box.x1/GRID);
    const c=Math.floor(box.y0/GRID),d=Math.floor(box.y1/GRID);
    if((b-a+1)*(d-c+1)>MAX_ENTRY_CELLS){oversize.push(i);return;}
    for(let x=a;x<=b;x++)for(let y=c;y<=d;y++){
      const k=key(x,y),list=buckets.get(k);
      if(list)list.push(i);else buckets.set(k,[i]);
    }
  });
  return {near(nodeId,node,pad){
    if(!Number.isFinite(pad)||pad<0||pad>1e7
      || ![node.x,node.y,node.width,node.height].every(Number.isFinite)
      || node.width<=0||node.height<=0)throw Error("EIDOS_DIAGRAM_INK_QUERY_INVALID");
    const x0=node.x-pad,y0=node.y-pad;
    const x1=node.x+node.width+pad,y1=node.y+node.height+pad;
    const a=Math.floor(x0/GRID),b=Math.floor(x1/GRID);
    const c=Math.floor(y0/GRID),d=Math.floor(y1/GRID);
    const selected=new Set<number>(oversize);
    if((b-a+1)*(d-c+1)>MAX_QUERY_CELLS){
      entries.forEach((_,i)=>selected.add(i));
    }else for(let x=a;x<=b;x++)for(let y=c;y<=d;y++)
      for(const i of buckets.get(key(x,y))??[])selected.add(i);
    const segments:DiagramInkSegmentV010[]=[],labels:DiagramInkRectV010[]=[];
    for(const i of [...selected].sort((m,n)=>m-n)){
      const e=entries[i]!,r=boxes[i]!;
      if(e.sourceId===nodeId ||e.targetId===nodeId ||r.x1<x0||r.x0>x1||r.y1<y0||r.y0>y1)continue;
      for(const seg of e.segments){
        if(Math.max(seg.start.x,seg.end.x)<x0 ||Math.min(seg.start.x,seg.end.x)>x1
          ||Math.max(seg.start.y,seg.end.y)<y0||Math.min(seg.start.y,seg.end.y)>y1)continue;
        segments.push(seg);
      }
      for(const label of e.labels){
        if(label.x+label.width<x0||label.x>x1||label.y+label.height<y0||label.y>y1)continue;
        labels.push(label);
      }
    }
    return {segments,labels};
  }};
}
