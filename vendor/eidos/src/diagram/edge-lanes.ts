/** Presentation-only disambiguation for parallel edges and explicit self relations.
 * No source/target/arrow mutation. Existing unstyled legacy edges may opt out of lane offsets.
 */
import type { DiagramEdgeGeometryV010, DiagramEdgePathKindV010, DiagramEdgePointV010 } from "./edge-paths.js";
import { diagramManualEdgeGeometryV010 } from "./edge-waypoints.js";

export interface DiagramLaneEdgeV010 { id: string; source: string; target: string }
export interface DiagramLaneNodeV010 {
  x: number; y: number; width: number; height: number;
}

function fmt(n: number): string { return String(Math.round(n * 1000) / 1000); }
function xy(point: DiagramEdgePointV010): string { return fmt(point.x) + " " + fmt(point.y); }

/** Assign consistent, distinct lane positions regardless of the source data order.
 * Group keys use tuples, not delimiter-concatenated ids.
 */
export function diagramParallelLaneOffsetsV010(
  edges: readonly DiagramLaneEdgeV010[],
  gap = 14
): ReadonlyMap<string, number> {
  if (!Number.isFinite(gap) || gap <= 0 || gap > 64) {
    throw new Error("EIDOS_DIAGRAM_LANE_GAP_INVALID");
  }
  const groups = new Map<string, DiagramLaneEdgeV010[]>();
  const ids = new Set<string>();
  for (const edge of edges) {
    if (!edge.id || !edge.source || !edge.target || ids.has(edge.id)) {
      throw new Error("EIDOS_DIAGRAM_LANE_EDGE_INVALID");
    }
    ids.add(edge.id);
    const key = JSON.stringify([edge.source, edge.target].sort());
    const list = groups.get(key) ?? [];
    list.push(edge);
    groups.set(key, list);
  }
  const offsets = new Map<string, number>();
  for (const group of groups.values()) {
    const sorted = group.sort((a, b) => a.id.localeCompare(b.id));
    sorted.forEach((edge, i) => offsets.set(edge.id, (i - (sorted.length - 1) / 2) * gap));
  }
  return offsets;
}

/** Moves a connector attachment along its existing node boundary, never outside it. */
export function diagramOffsetNodeAttachmentV010(
  node: DiagramLaneNodeV010,
  endpoint: DiagramEdgePointV010,
  toward: DiagramEdgePointV010,
  offset: number
): DiagramEdgePointV010 {
  if (![node.x, node.y, node.width, node.height, endpoint.x, endpoint.y, toward.x, toward.y, offset]
    .every(Number.isFinite) || node.width <= 0 || node.height <= 0) {
    throw new Error("EIDOS_DIAGRAM_LANE_ATTACHMENT_INVALID");
  }
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const majorX = Math.abs(toward.x - cx) / (node.width / 2);
  const majorY = Math.abs(toward.y - cy) / (node.height / 2);
  const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
  if (majorX >= majorY) {
    const inset = Math.min(10, node.height / 4);
    return { x: endpoint.x, y: clamp(endpoint.y + offset, node.y + inset, node.y + node.height - inset) };
  }
  const inset = Math.min(10, node.width / 4);
  return { x: clamp(endpoint.x + offset, node.x + inset, node.x + node.width - inset), y: endpoint.y };
}

export type DiagramSelfLoopSideV010 = "right" | "bottom" | "left" | "top";
const loopSides: readonly DiagramSelfLoopSideV010[] =
  ["right","bottom","left","top"];

/** B8g: deterministic four-sided exterior routing. A side's handle corridor
 * includes 22 world units of breathing room at scale 1. For very dense
 * scenes choose the least intersected corridor (stable tie: right first).
 * Only other visible nodes count; callers exclude the source node.
 */
/** B8h: congestion is an explicit presentation diagnostic, not a
 * persisted routing failure or a mutation of a business relationship.
 * Reserved sides represent earlier, stable-id ordered self-edges on the
 * SAME node. A finite soft penalty keeps alternatives usable if crowded.
 */
/** B8i nonincident route and label reservations, world coordinates.
 * Segment intersection is tested only against the exterior loop corridor.
 * Source/target adjacent strokes must not be included by callers.
 */
export interface DiagramSelfLoopInkV010 {
  segments?: readonly {start: DiagramEdgePointV010;end: DiagramEdgePointV010}[];
  labels?: readonly DiagramLaneNodeV010[];
}
function segmentHitsRect(a:DiagramEdgePointV010,b:DiagramEdgePointV010,
  x0:number,y0:number,x1:number,y1:number):boolean {
  const dx=b.x-a.x,dy=b.y-a.y;
  let enter=0,exit=1;
  for(const [p,q] of [
    [-dx,a.x-x0],[dx,x1-a.x],[-dy,a.y-y0],[dy,y1-a.y]
  ]){
    if(Math.abs(p)<1e-9){if(q<0)return false;continue;}
    const v=q/p;
    if(p<0)enter=Math.max(enter,v);else exit=Math.min(exit,v);
    if(enter>exit)return false;
  }
  return true;
}
export interface DiagramSelfLoopDecisionV010 {
  side: DiagramSelfLoopSideV010;
  congested: boolean;
  nodeOverlapArea: number;
  sameSideLoops: number;
  edgeCrossings?: number;
  labelOverlapArea?: number;
}
export function diagramSelfLoopDecisionV010(
  node: DiagramLaneNodeV010,
  obstacles: readonly DiagramLaneNodeV010[] = [],
  laneOffset = 0,
  reservedSides: readonly DiagramSelfLoopSideV010[] = [],
  ink: DiagramSelfLoopInkV010 = {}
): DiagramSelfLoopDecisionV010 {
  if (![node.x,node.y,node.width,node.height,laneOffset].every(Number.isFinite)
    || node.width <= 0 || node.height <= 0 || Math.abs(laneOffset) > 1000
    || !Array.isArray(obstacles)
    || obstacles.some(o => !o || ![o.x,o.y,o.width,o.height].every(Number.isFinite)
      || o.width <= 0 || o.height <= 0)
    || !Array.isArray(reservedSides)
    || reservedSides.some(side => !loopSides.includes(side))
    || !Array.isArray(ink.segments ?? []) || !Array.isArray(ink.labels ?? [])
    || (ink.segments ?? []).some(seg => !seg || ![seg.start?.x,seg.start?.y,
      seg.end?.x,seg.end?.y].every(Number.isFinite))
    || (ink.labels ?? []).some(box => !box || ![box.x,box.y,box.width,
      box.height].every(Number.isFinite) || box.width<=0 || box.height<=0)) {
    throw new Error("EIDOS_DIAGRAM_LOOP_INVALID");
  }
  const reach = Math.max(38,56+laneOffset);
  const reservationPenalty = 10000;
  let best: DiagramSelfLoopDecisionV010 = {
    side:"right",congested:false,nodeOverlapArea:0,sameSideLoops:0
  };
  let bestScore = Infinity;
  for(const side of loopSides){
    const siblings=reservedSides.filter(item=>item===side).length;
    const points=loopPointsOnSide(node,side,reach+siblings*32);
    const positions=[points.start,points.end,...points.orthogonal];
    const x0=Math.min(...positions.map(p=>p.x))-22;
    const y0=Math.min(...positions.map(p=>p.y))-22;
    const x1=Math.max(...positions.map(p=>p.x))+22;
    const y1=Math.max(...positions.map(p=>p.y))+22;
    let area=0;
    for(const o of obstacles){
      const ix=Math.max(0,Math.min(x1,o.x+o.width)-Math.max(x0,o.x));
      const iy=Math.max(0,Math.min(y1,o.y+o.height)-Math.max(y0,o.y));
      area+=ix*iy;
    }
    // Candidate ink footprint starts on the node boundary and extends out.
    // Lines traversing the source node itself are not a self-loop penalty.
    const ox0=side==="right"?node.x+node.width:x0;
    const ox1=side==="left"?node.x:x1;
    const oy0=side==="bottom"?node.y+node.height:y0;
    const oy1=side==="top"?node.y:y1;
    const crossings=(ink.segments ?? []).reduce((sum,seg)=>sum+
      Number(segmentHitsRect(seg.start,seg.end,ox0,oy0,ox1,oy1)),0);
    let labelArea=0;
    for(const label of ink.labels ?? []){
      const ix=Math.max(0,Math.min(ox1,label.x+label.width)-Math.max(ox0,label.x));
      const iy=Math.max(0,Math.min(oy1,label.y+label.height)-Math.max(oy0,label.y));
      labelArea+=ix*iy;
    }
    const score=area+siblings*reservationPenalty+crossings*6000+labelArea*2;
    if(score<bestScore){
      bestScore=score;
      best={side,congested:area>0||siblings>0||crossings>0||labelArea>0,
        nodeOverlapArea:area,sameSideLoops:siblings,
        ...(crossings ? {edgeCrossings:crossings} : {}),
        ...(labelArea ? {labelOverlapArea:labelArea} : {})};
    }
  }
  return best;
}

export function diagramSelfLoopSideV010(
  node: DiagramLaneNodeV010,
  obstacles: readonly DiagramLaneNodeV010[] = [],
  laneOffset = 0,
  reservedSides: readonly DiagramSelfLoopSideV010[] = [],
  ink: DiagramSelfLoopInkV010 = {}
): DiagramSelfLoopSideV010 {
  return diagramSelfLoopDecisionV010(node,obstacles,laneOffset,reservedSides,ink).side;
}

function loopPointsOnSide(node: DiagramLaneNodeV010,side: DiagramSelfLoopSideV010,reach:number){
  const x1=node.x+node.width*.28,x2=node.x+node.width*.72;
  const y1=node.y+node.height*.28,y2=node.y+node.height*.72;
  let start: DiagramEdgePointV010,end: DiagramEdgePointV010;
  let nx=0,ny=0,tx=0,ty=0;
  if(side==="right"){start={x:node.x+node.width,y:y1};end={x:node.x+node.width,y:y2};nx=1;ty=1;}
  else if(side==="left"){start={x:node.x,y:y1};end={x:node.x,y:y2};nx=-1;ty=1;}
  else if(side==="bottom"){start={x:x1,y:node.y+node.height};end={x:x2,y:node.y+node.height};ny=1;tx=1;}
  else {start={x:x1,y:node.y};end={x:x2,y:node.y};ny=-1;tx=1;}
  return {
    start,end,nx,ny,tx,ty,
    orthogonal:[
      {x:start.x+reach*nx,y:start.y+reach*ny},
      {x:end.x+reach*nx,y:end.y+reach*ny}
    ],
    bulge:{x:(start.x+end.x)/2+reach*nx,
      y:(start.y+end.y)/2+reach*ny}
  };
}

/** A manual edit anchors its existing side by the most exterior waypoint.
 * This deliberately does not store a new side property in the projection
 * contract. Moving another node cannot silently reroute a user's manual path.
 */
export function diagramSelfLoopManualSideV010(
  node: DiagramLaneNodeV010,waypoints:readonly DiagramEdgePointV010[],
  fallback:DiagramSelfLoopSideV010="right"
):DiagramSelfLoopSideV010{
  let side=fallback,best=8;
  for(const p of waypoints){
    const candidates:[DiagramSelfLoopSideV010,number][]=[
      ["right",p.x-node.x-node.width],["bottom",p.y-node.y-node.height],
      ["left",node.x-p.x],["top",node.y-p.y]
    ];
    for(const [candidate,extent] of candidates)if(extent>best){best=extent;side=candidate;}
  }
  return side;
}

/** Geometry inputs are world coordinates. Reading never creates a manual
 * route; explicit waypoint edits may use any exterior side. */
export function diagramSelfLoopRouteControlsV010(
  node: DiagramLaneNodeV010,
  kind: "orthogonal" | "rounded-orthogonal" | "curve",
  laneOffset = 0,
  obstacles: readonly DiagramLaneNodeV010[] = [],
  manualWaypoints?: readonly DiagramEdgePointV010[],
  reservedSides: readonly DiagramSelfLoopSideV010[] = [],
  ink: DiagramSelfLoopInkV010 = {}
): { start: DiagramEdgePointV010; end: DiagramEdgePointV010;
  waypoints: DiagramEdgePointV010[]; side: DiagramSelfLoopSideV010 } {
  if (![node.x,node.y,node.width,node.height,laneOffset].every(Number.isFinite)
    || node.width<=0 || node.height<=0 || Math.abs(laneOffset)>1000
    || !["orthogonal","rounded-orthogonal","curve"].includes(kind)) {
    throw new Error("EIDOS_DIAGRAM_LOOP_INVALID");
  }
  const decision=diagramSelfLoopDecisionV010(node,obstacles,laneOffset,reservedSides,ink);
  const automatically=decision.side;
  const side=manualWaypoints?.length
    ? diagramSelfLoopManualSideV010(node,manualWaypoints,automatically)
    : automatically;
  const reach=Math.max(38,56+laneOffset)
    + (manualWaypoints?.length ? 0 : decision.sameSideLoops*32);
  const points=loopPointsOnSide(node,side,reach);
  return {start:points.start,end:points.end,
    waypoints:kind==="curve"?[points.bulge]:points.orthogonal,side};
}

/** Automatic unblocked right-facing loops reproduce pre-B8g SVG exactly.
 * Other sides are chosen by the visible-obstacle corridor score; committed
 * manual waypoints pin the chosen exterior side without a schema migration.
 */
export function diagramSelfLoopGeometryV010(
  node: DiagramLaneNodeV010,
  kind: DiagramEdgePathKindV010 = "straight",
  laneOffset = 0,
  manualWaypoints?: readonly DiagramEdgePointV010[],
  obstacles: readonly DiagramLaneNodeV010[] = [],
  reservedSides: readonly DiagramSelfLoopSideV010[] = [],
  ink: DiagramSelfLoopInkV010 = {}
): DiagramEdgeGeometryV010 {
  if (![node.x,node.y,node.width,node.height,laneOffset].every(Number.isFinite)
    || node.width<=0 || node.height<=0 || Math.abs(laneOffset)>1000
    || !["straight","orthogonal","rounded-orthogonal","curve"].includes(kind)) {
    throw new Error("EIDOS_DIAGRAM_LOOP_INVALID");
  }
  if(manualWaypoints?.length && kind!=="straight" &&
    (manualWaypoints.length>24 || manualWaypoints.some(p=>!p
      || !Number.isFinite(p.x) || !Number.isFinite(p.y)
      || Math.abs(p.x)>1e7 || Math.abs(p.y)>1e7))) {
    throw new Error("EIDOS_DIAGRAM_LOOP_WAYPOINT_INVALID");
  }
  const decision=diagramSelfLoopDecisionV010(node,obstacles,laneOffset,reservedSides,ink);
  const automaticSide=decision.side;
  const status=manualWaypoints?.length ? {} : decision.congested ? {congested:true} : {};
  const selectedSide=manualWaypoints?.length
    ? diagramSelfLoopManualSideV010(node,manualWaypoints,automaticSide)
    : automaticSide;
  const reach=Math.max(38,56+laneOffset)
    + (manualWaypoints?.length ? 0 : decision.sameSideLoops*32);
  const frame=loopPointsOnSide(node,selectedSide,reach);
  if(kind==="curve"){
    const bulge=manualWaypoints?.length===1?manualWaypoints[0]!:frame.bulge;
    if(manualWaypoints && manualWaypoints.length>1){
      return {...diagramManualEdgeGeometryV010(frame.start,frame.end,{
        pathKind:"curve",waypoints:[...manualWaypoints]
      }),...status};
    }
    const external=(bulge.x-frame.bulge.x)*frame.nx
      +(bulge.y-frame.bulge.y)*frame.ny+reach;
    if(external<=8)throw new Error("EIDOS_DIAGRAM_LOOP_BULGE_INVALID");
    const shifted=(bulge.x-frame.bulge.x)*frame.tx
      +(bulge.y-frame.bulge.y)*frame.ty;
    const c1={
      x:frame.start.x+external*frame.nx
        +(-external*.35+shifted)*frame.tx,
      y:frame.start.y+external*frame.ny
        +(-external*.35+shifted)*frame.ty
    };
    const c2={
      x:frame.end.x+external*frame.nx
        +(external*.35+shifted)*frame.tx,
      y:frame.end.y+external*frame.ny
        +(external*.35+shifted)*frame.ty
    };
    return {kind,d:"M "+xy(frame.start)+" C "+xy(c1)+" "+xy(c2)+" "+xy(frame.end),
      label:{x:bulge.x+2,y:bulge.y},...status};
  }
  if(manualWaypoints?.length && kind!=="straight"){
    return {...diagramManualEdgeGeometryV010(frame.start,frame.end,{
      pathKind:kind,waypoints:[...manualWaypoints]
    }),...status};
  }
  if(selectedSide!=="right"){
    const path=diagramManualEdgeGeometryV010(frame.start,frame.end,{
      pathKind:kind==="straight"?"orthogonal":kind,waypoints:frame.orthogonal
    });
    return {...path,kind,...status};
  }
  // Historical right-facing default remains pixel-identical when unblocked.
  const right=node.x+node.width;
  const y1=node.y+node.height*.28,y2=node.y+node.height*.72;
  const start=frame.start,end=frame.end;
  const topRight={x:right+reach,y:y1},bottomRight={x:right+reach,y:y2};
  let d:string;
  if(kind==="rounded-orthogonal"){
    const r=Math.max(1,Math.min(12,(y2-y1)/3,reach/3));
    d="M "+xy(start)+" L "+xy({x:topRight.x-r,y:y1})
      +" Q "+xy(topRight)+" "+xy({x:topRight.x,y:y1+r})
      +" L "+xy({x:bottomRight.x,y:y2-r})
      +" Q "+xy(bottomRight)+" "+xy({x:bottomRight.x-r,y:y2})
      +" L "+xy(end);
  }else{
    d="M "+xy(start)+" L "+xy(topRight)+" L "+xy(bottomRight)+" L "+xy(end);
  }
  return {kind,d,label:{x:right+reach+2,y:(y1+y2)/2},...status};
}

/** B8i: stable Fit-all / Fit-selection envelope. Unlike camera-aware route
 * decisions this does not change on pan/zoom/selection, and manual exterior
 * points are always included. Ordinary graphs without styled self-loops
 * preserve their exact original node bounds.
 */
export function diagramSelfLoopFitBoundsV010(
  nodes: readonly (DiagramLaneNodeV010 & {id:string})[],
  edges: readonly (DiagramLaneEdgeV010 & {
    pathKind?: DiagramEdgePathKindV010;
    waypoints?: readonly DiagramEdgePointV010[];
  })[]
): {x:number;y:number;width:number;height:number} {
  if(!nodes.length)return {x:0,y:0,width:1,height:1};
  const byId=new Map(nodes.map(n=>[n.id,n] as const));
  let minX=Math.min(...nodes.map(n=>n.x)),minY=Math.min(...nodes.map(n=>n.y));
  let maxX=Math.max(...nodes.map(n=>n.x+n.width));
  let maxY=Math.max(...nodes.map(n=>n.y+n.height));
  const counts=new Map<string,number>();
  for(const edge of edges){
    if(edge.source===edge.target && edge.pathKind!==undefined && byId.has(edge.source)){
      counts.set(edge.source,(counts.get(edge.source)??0)+1);
      for(const p of edge.waypoints??[]){
        minX=Math.min(minX,p.x-22);minY=Math.min(minY,p.y-22);
        maxX=Math.max(maxX,p.x+22);maxY=Math.max(maxY,p.y+22);
      }
    }
  }
  for(const [id,count] of counts){
    const n=byId.get(id)!;
    // Approximate extreme lane offset, four-side reuse nesting and 22px
    // world-space handle. Fit camera adds its own fixed pixel-space padding.
    const outward=Math.max(38,56+count*7)
      +Math.floor((count-1)/4)*32+22;
    minX=Math.min(minX,n.x-outward);
    minY=Math.min(minY,n.y-outward);
    maxX=Math.max(maxX,n.x+n.width+outward);
    maxY=Math.max(maxY,n.y+n.height+outward);
  }
  return {x:minX,y:minY,width:Math.max(1,maxX-minX),
    height:Math.max(1,maxY-minY)};
}
