/** B3 presentation-only explicit connector handles.
 * The geometry is a declarative view override: topology, arrow and relationship identity never change.
 */
import type { DiagramEdgePointV010, DiagramEdgePathKindV010, DiagramEdgeGeometryV010 } from "./edge-paths.js";

export type DiagramEdgeAnchorSideV010 = "auto" | "left" | "right" | "top" | "bottom";
export interface DiagramEdgePathOverrideV010 {
  pathKind: DiagramEdgePathKindV010;
  /** World-space control points; explicit manual route when nonempty. */
  waypoints?: DiagramEdgePointV010[];
  sourceAnchor?: DiagramEdgeAnchorSideV010;
  targetAnchor?: DiagramEdgeAnchorSideV010;
}
export interface DiagramAnchorNodeV010 { x: number; y: number; width: number; height: number }

const sides: readonly DiagramEdgeAnchorSideV010[] = ["auto","left","right","top","bottom"];
const kinds: readonly DiagramEdgePathKindV010[] = ["straight","orthogonal","rounded-orthogonal","curve"];
const limit = 1e7;
const MAX_POINTS = 24;

function round(n: number): string { return String(Math.round(n * 1000) / 1000); }
function coord(p: DiagramEdgePointV010): string { return round(p.x) + " " + round(p.y); }
function validPoint(p: unknown): p is DiagramEdgePointV010 {
  return typeof p === "object" && p !== null && !Array.isArray(p)
    && typeof (p as DiagramEdgePointV010).x === "number"
    && typeof (p as DiagramEdgePointV010).y === "number"
    && Number.isFinite((p as DiagramEdgePointV010).x)
    && Number.isFinite((p as DiagramEdgePointV010).y)
    && Math.abs((p as DiagramEdgePointV010).x) <= limit
    && Math.abs((p as DiagramEdgePointV010).y) <= limit;
}
export function isDiagramEdgeAnchorSideV010(value: unknown): value is DiagramEdgeAnchorSideV010 {
  return typeof value === "string" && sides.includes(value as DiagramEdgeAnchorSideV010);
}
export function validDiagramEdgePathOverrideV010(input: unknown): input is DiagramEdgePathOverrideV010 {
  if (!input || typeof input !== "object" || Array.isArray(input)) return false;
  const o = input as DiagramEdgePathOverrideV010;
  return kinds.includes(o.pathKind)
    && (o.sourceAnchor === undefined || isDiagramEdgeAnchorSideV010(o.sourceAnchor))
    && (o.targetAnchor === undefined || isDiagramEdgeAnchorSideV010(o.targetAnchor))
    && (o.waypoints === undefined || (Array.isArray(o.waypoints) && o.waypoints.length <= MAX_POINTS
      && o.waypoints.every(validPoint) && (o.pathKind !== "straight" || o.waypoints.length === 0)));
}
export function diagramEdgeAnchorPointV010(
  node: DiagramAnchorNodeV010,
  side: DiagramEdgeAnchorSideV010
): DiagramEdgePointV010 | undefined {
  if (!isDiagramEdgeAnchorSideV010(side)
    || ![node.x,node.y,node.width,node.height].every(Number.isFinite)
    || node.width <= 0 || node.height <= 0) throw new Error("EIDOS_EDGE_ANCHOR_INVALID");
  const cx = node.x + node.width / 2, cy = node.y + node.height / 2;
  if (side === "auto") return undefined;
  if (side === "left") return { x: node.x, y: cy };
  if (side === "right") return { x: node.x + node.width, y: cy };
  if (side === "top") return { x: cx, y: node.y };
  return { x: cx, y: node.y + node.height };
}
function midpointAlong(points: readonly DiagramEdgePointV010[]): DiagramEdgePointV010 {
  let length = 0;
  const lengths: number[] = [];
  for (let i=1;i<points.length;i++) {
    const a=points[i-1]!,b=points[i]!;
    const d=Math.hypot(b.x-a.x,b.y-a.y);length+=d;lengths.push(d);
  }
  let remaining=length/2;
  for (let i=1;i<points.length;i++) {
    const d=lengths[i-1]!, a=points[i-1]!,b=points[i]!;
    if (remaining <= d || i === points.length-1) {
      const t=d>0?remaining/d:0;return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
    }
    remaining-=d;
  }
  return {...points[0]!};
}
function cleaned(points: readonly DiagramEdgePointV010[]): DiagramEdgePointV010[] {
  const result: DiagramEdgePointV010[] = [];
  for (const point of points) {
    const prev=result[result.length-1];
    if (!prev || prev.x!==point.x || prev.y!==point.y) result.push(point);
  }
  return result;
}
function orthogonalPoints(start: DiagramEdgePointV010,end: DiagramEdgePointV010,
  waypoints: readonly DiagramEdgePointV010[]): DiagramEdgePointV010[] {
  const controls = [start,...waypoints,end],out=[start];
  for (let i=1;i<controls.length;i++) {
    const a=out[out.length-1]!,b=controls[i]!;
    if (a.x !== b.x && a.y !== b.y) {
      // Deterministic horizontal-first connector into the required user control point.
      out.push({x:b.x,y:a.y});
    }
    out.push(b);
  }
  return cleaned(out);
}
function roundedPath(points: readonly DiagramEdgePointV010[]): string {
  const result=["M "+coord(points[0]!)];
  for(let i=1;i<points.length-1;i++){
    const before=points[i-1]!,cur=points[i]!,after=points[i+1]!;
    const into=Math.hypot(cur.x-before.x,cur.y-before.y);
    const out=Math.hypot(after.x-cur.x,after.y-cur.y);
    if (into===0 || out===0) continue;
    const radius=Math.min(12,into/2,out/2);
    const entry={x:cur.x+(before.x-cur.x)*radius/into,y:cur.y+(before.y-cur.y)*radius/into};
    const exit={x:cur.x+(after.x-cur.x)*radius/out,y:cur.y+(after.y-cur.y)*radius/out};
    result.push("L "+coord(entry),"Q "+coord(cur)+" "+coord(exit));
  }
  result.push("L "+coord(points[points.length-1]!));
  return result.join(" ");
}
/** Generates a true editable manual path. For curves, smooth cubic segments pass through controls.
 * Label is taken from the actual central control segment, never the source-target straight midpoint.
 */
export function diagramManualEdgeGeometryV010(
  start: DiagramEdgePointV010, end: DiagramEdgePointV010,
  override: DiagramEdgePathOverrideV010
): DiagramEdgeGeometryV010 {
  if (!validPoint(start)||!validPoint(end)||!validDiagramEdgePathOverrideV010(override)) {
    throw new Error("EIDOS_EDGE_MANUAL_PATH_INVALID");
  }
  const controls=override.waypoints??[];
  if (!controls.length || override.pathKind==="straight") {
    // A fixed anchor without waypoints is handled by normal geometry at the caller.
    throw new Error("EIDOS_EDGE_MANUAL_POINTS_REQUIRED");
  }
  const points=cleaned([start,...controls,end]);
  if (points.length<2) throw new Error("EIDOS_EDGE_MANUAL_DEGENERATE");
  if (override.pathKind==="curve") {
    const commands=["M "+coord(points[0]!)];
    for(let i=0;i<points.length-1;i++) {
      const prev=points[Math.max(0,i-1)]!,a=points[i]!,b=points[i+1]!,next=points[Math.min(points.length-1,i+2)]!;
      const c1={x:a.x+(b.x-prev.x)/6,y:a.y+(b.y-prev.y)/6};
      const c2={x:b.x-(next.x-a.x)/6,y:b.y-(next.y-a.y)/6};
      commands.push("C "+coord(c1)+" "+coord(c2)+" "+coord(b));
    }
    return {kind:override.pathKind,d:commands.join(" "),label:{...points[Math.floor(points.length/2)]!}};
  }
  const route=orthogonalPoints(start,end,controls);
  return {
    kind:override.pathKind,
    d:override.pathKind==="orthogonal"
      ? route.map((p,i)=>(i===0?"M ":"L ")+coord(p)).join(" ")
      : roundedPath(route),
    label:midpointAlong(route)
  };
}
export function diagramTranslateWaypointsV010(
  waypoints: readonly DiagramEdgePointV010[],dx:number,dy:number
): DiagramEdgePointV010[] {
  if (!Number.isFinite(dx)||!Number.isFinite(dy)
    || !Array.isArray(waypoints)||waypoints.length>MAX_POINTS
    || !waypoints.every(validPoint)) throw new Error("EIDOS_EDGE_WAYPOINT_TRANSLATION_INVALID");
  const moved=waypoints.map(p=>({x:p.x+dx,y:p.y+dy}));
  if (!moved.every(validPoint)) throw new Error("EIDOS_EDGE_WAYPOINT_TRANSLATION_INVALID");
  return moved;
}


/** B5a: pure geometry for accessible on-canvas presentation handles.
 * Coordinates stay in world space; caller converts device pixel deltas using camera.scale.
 */
export interface DiagramOrthogonalSegmentHandleV010 {
  index: number;
  x: number;
  y: number;
  /** The coordinate that a perpendicular segment drag may change. */
  axis: "x" | "y";
}

export function diagramMoveWaypointV010(
  points: readonly DiagramEdgePointV010[], index: number, dx: number, dy: number
): DiagramEdgePointV010[] {
  if (!Array.isArray(points) || points.length > MAX_POINTS || !points.every(validPoint)
    || !Number.isInteger(index) || index < 0 || index >= points.length
    || !Number.isFinite(dx) || !Number.isFinite(dy)) {
    throw new Error("EIDOS_EDGE_WAYPOINT_DRAG_INVALID");
  }
  const next = points.map(point => ({ ...point }));
  next[index] = { x: next[index]!.x + dx, y: next[index]!.y + dy };
  if (!validPoint(next[index])) throw new Error("EIDOS_EDGE_WAYPOINT_DRAG_INVALID");
  return next;
}

function reducedOrthogonalRoute(
  start: DiagramEdgePointV010, end: DiagramEdgePointV010,
  override: DiagramEdgePathOverrideV010
): DiagramEdgePointV010[] {
  if (!validPoint(start) || !validPoint(end)
    || !validDiagramEdgePathOverrideV010(override)
    || (override.pathKind !== "orthogonal" && override.pathKind !== "rounded-orthogonal")
    || !override.waypoints?.length) {
    throw new Error("EIDOS_EDGE_SEGMENT_INVALID");
  }
  const result: DiagramEdgePointV010[] = [];
  for (const point of orthogonalPoints(start, end, override.waypoints)) {
    while (result.length >= 2) {
      const a = result[result.length - 2]!, b = result[result.length - 1]!;
      if (!((a.x === b.x && b.x === point.x) || (a.y === b.y && b.y === point.y))) break;
      result.pop();
    }
    result.push({ ...point });
  }
  return result;
}

export function diagramEditableOrthogonalSegmentsV010(
  start: DiagramEdgePointV010, end: DiagramEdgePointV010,
  override: DiagramEdgePathOverrideV010
): DiagramOrthogonalSegmentHandleV010[] {
  const route = reducedOrthogonalRoute(start, end, override);
  const handles: DiagramOrthogonalSegmentHandleV010[] = [];
  for (let index = 0; index < route.length - 1; index++) {
    const a = route[index]!, b = route[index + 1]!;
    if (Math.hypot(b.x - a.x, b.y - a.y) < 12) continue;
    if (a.x !== b.x && a.y !== b.y) throw new Error("EIDOS_EDGE_SEGMENT_NOT_ORTHOGONAL");
    handles.push({
      index, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2,
      axis: a.x === b.x ? "x" : "y"
    });
  }
  return handles;
}

/** Moves one entire line segment perpendicular to itself, preserving fixed terminals.
 * Returns explicit route vertices as waypoints, so all other segments stay orthogonal.
 */
export function diagramDragOrthogonalSegmentV010(
  start: DiagramEdgePointV010, end: DiagramEdgePointV010,
  override: DiagramEdgePathOverrideV010,
  segmentIndex: number, delta: number
): DiagramEdgePointV010[] {
  const route = reducedOrthogonalRoute(start, end, override);
  if (!Number.isInteger(segmentIndex) || segmentIndex < 0 || segmentIndex >= route.length - 1
    || !Number.isFinite(delta)) throw new Error("EIDOS_EDGE_SEGMENT_DRAG_INVALID");
  if (delta === 0) return (override.waypoints ?? []).map(p => ({ ...p }));
  const a = route[segmentIndex]!, b = route[segmentIndex + 1]!;
  if (a.x !== b.x && a.y !== b.y) throw new Error("EIDOS_EDGE_SEGMENT_NOT_ORTHOGONAL");
  const axis = a.x === b.x ? "x" : "y";
  const shifted = route.map(p => ({ ...p }));
  shifted[segmentIndex]![axis] += delta;
  shifted[segmentIndex + 1]![axis] += delta;
  if (!shifted.every(validPoint)) throw new Error("EIDOS_EDGE_SEGMENT_DRAG_INVALID");
  if (segmentIndex === 0) shifted.unshift({ ...start });
  if (segmentIndex + 1 === route.length - 1) shifted.push({ ...end });
  const reduced: DiagramEdgePointV010[] = [];
  for (const point of shifted) {
    while (reduced.length >= 2) {
      const p = reduced[reduced.length - 2]!, q = reduced[reduced.length - 1]!;
      if (!((p.x === q.x && q.x === point.x) || (p.y === q.y && q.y === point.y))) break;
      reduced.pop();
    }
    if (!reduced.length || reduced[reduced.length - 1]!.x !== point.x
      || reduced[reduced.length - 1]!.y !== point.y) reduced.push(point);
  }
  if (reduced.length < 2 || reduced.length - 2 > MAX_POINTS
    || reduced[0]!.x !== start.x || reduced[0]!.y !== start.y
    || reduced[reduced.length - 1]!.x !== end.x || reduced[reduced.length - 1]!.y !== end.y) {
    throw new Error("EIDOS_EDGE_SEGMENT_DRAG_INVALID");
  }
  for (let i = 1; i < reduced.length; i++) {
    if (reduced[i - 1]!.x !== reduced[i]!.x && reduced[i - 1]!.y !== reduced[i]!.y) {
      throw new Error("EIDOS_EDGE_SEGMENT_DRAG_INVALID");
    }
  }
  return reduced.slice(1, -1);
}
