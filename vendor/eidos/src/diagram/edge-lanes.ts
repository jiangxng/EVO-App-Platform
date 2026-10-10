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
export function diagramSelfLoopSideV010(
  node: DiagramLaneNodeV010,
  obstacles: readonly DiagramLaneNodeV010[] = [],
  laneOffset = 0
): DiagramSelfLoopSideV010 {
  if (![node.x,node.y,node.width,node.height,laneOffset].every(Number.isFinite)
    || node.width<=0 || node.height<=0 || !Number.isFinite(laneOffset)
    || Math.abs(laneOffset)>1000 || !Array.isArray(obstacles)
    || obstacles.some(o=>!o || ![o.x,o.y,o.width,o.height].every(Number.isFinite)
      || o.width<=0 || o.height<=0)) {
    throw new Error("EIDOS_DIAGRAM_LOOP_INVALID");
  }
  if (!obstacles.length) return "right";
  const reach=Math.max(38,56+laneOffset);
  let best: DiagramSelfLoopSideV010="right";
  let bestCost=Infinity;
  for(const side of loopSides){
    const points=loopPointsOnSide(node,side,reach);
    const positions=[points.start,points.end,...points.orthogonal];
    const left=Math.min(...positions.map(p=>p.x))-22;
    const top=Math.min(...positions.map(p=>p.y))-22;
    const right=Math.max(...positions.map(p=>p.x))+22;
    const bottom=Math.max(...positions.map(p=>p.y))+22;
    let cost=0;
    for(const o of obstacles){
      const ix=Math.max(0,Math.min(right,o.x+o.width)-Math.max(left,o.x));
      const iy=Math.max(0,Math.min(bottom,o.y+o.height)-Math.max(top,o.y));
      cost+=ix*iy;
    }
    if(cost<bestCost){best=side;bestCost=cost;}
    if(cost===0)break;
  }
  return best;
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
  manualWaypoints?: readonly DiagramEdgePointV010[]
): { start: DiagramEdgePointV010; end: DiagramEdgePointV010;
  waypoints: DiagramEdgePointV010[]; side: DiagramSelfLoopSideV010 } {
  if (![node.x,node.y,node.width,node.height,laneOffset].every(Number.isFinite)
    || node.width<=0 || node.height<=0 || Math.abs(laneOffset)>1000
    || !["orthogonal","rounded-orthogonal","curve"].includes(kind)) {
    throw new Error("EIDOS_DIAGRAM_LOOP_INVALID");
  }
  const automatically=diagramSelfLoopSideV010(node,obstacles,laneOffset);
  const side=manualWaypoints?.length
    ? diagramSelfLoopManualSideV010(node,manualWaypoints,automatically)
    : automatically;
  const points=loopPointsOnSide(node,side,Math.max(38,56+laneOffset));
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
  obstacles: readonly DiagramLaneNodeV010[] = []
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
  const automaticSide=diagramSelfLoopSideV010(node,obstacles,laneOffset);
  const selectedSide=manualWaypoints?.length
    ? diagramSelfLoopManualSideV010(node,manualWaypoints,automaticSide)
    : automaticSide;
  const reach=Math.max(38,56+laneOffset);
  const frame=loopPointsOnSide(node,selectedSide,reach);
  if(kind==="curve"){
    const bulge=manualWaypoints?.length===1?manualWaypoints[0]!:frame.bulge;
    if(manualWaypoints?.length>1){
      return diagramManualEdgeGeometryV010(frame.start,frame.end,{
        pathKind:"curve",waypoints:[...manualWaypoints]
      });
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
      label:{x:bulge.x+2,y:bulge.y}};
  }
  if(manualWaypoints?.length && kind!=="straight"){
    return diagramManualEdgeGeometryV010(frame.start,frame.end,{
      pathKind:kind,waypoints:[...manualWaypoints]
    });
  }
  if(selectedSide!=="right"){
    const path=diagramManualEdgeGeometryV010(frame.start,frame.end,{
      pathKind:kind==="straight"?"orthogonal":kind,waypoints:frame.orthogonal
    });
    return {...path,kind};
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
  return {kind,d,label:{x:right+reach+2,y:(y1+y2)/2}};
}
