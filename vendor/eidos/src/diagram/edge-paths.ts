/**
 * Deterministic declarative edge geometry for the Eidos 2D surface.
 * This module owns presentation only: it never mutates graph topology or business direction.
 * Absence of an explicit pathKind is the legacy straight-line presentation.
 */
import { routeDiagramOrthogonalV010, type DiagramRouteObstacleV010 } from "./obstacle-routing.js";

export type DiagramEdgePathKindV010 =
  | "straight"
  | "orthogonal"
  | "rounded-orthogonal"
  | "curve";

export interface DiagramEdgePointV010 {
  x: number;
  y: number;
}

export interface DiagramEdgeGeometryV010 {
  d: string;
  label: DiagramEdgePointV010;
  kind: DiagramEdgePathKindV010;
  /** True when obstacle avoidance could not find a safe route within the bounded budget. */
  congested?: boolean;
}

export interface DiagramEdgeGeometryOptionsV010 {
  /** Bounding boxes of visible, unrelated nodes, in the same world coordinates. */
  obstacles?: readonly DiagramRouteObstacleV010[];
  clearance?: number;
}

const permittedKinds: readonly DiagramEdgePathKindV010[] = [
  "straight", "orthogonal", "rounded-orthogonal", "curve"
];

export function isDiagramEdgePathKindV010(value: unknown): value is DiagramEdgePathKindV010 {
  return typeof value === "string"
    && permittedKinds.some(kind => kind === value);
}

function fmt(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

function point(value: DiagramEdgePointV010): string {
  return fmt(value.x) + " " + fmt(value.y);
}

function halfwayOnSegments(points: readonly DiagramEdgePointV010[]): DiagramEdgePointV010 {
  const lengths: number[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    lengths.push(length);
    total += length;
  }
  if (total === 0) return { ...points[0]! };
  let remaining = total / 2;
  for (let i = 1; i < points.length; i += 1) {
    const length = lengths[i - 1]!;
    const a = points[i - 1]!;
    const b = points[i]!;
    if (remaining <= length || i === points.length - 1) {
      const t = length === 0 ? 0 : remaining / length;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    remaining -= length;
  }
  return { ...points[points.length - 1]! };
}

function elbowPoints(a: DiagramEdgePointV010, b: DiagramEdgePointV010): DiagramEdgePointV010[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const middle = (a.x + b.x) / 2;
    return [a, { x: middle, y: a.y }, { x: middle, y: b.y }, b];
  }
  const middle = (a.y + b.y) / 2;
  return [a, { x: a.x, y: middle }, { x: b.x, y: middle }, b];
}

function roundedPath(points: readonly DiagramEdgePointV010[]): string {
  const chunks = ["M " + point(points[0]!)];
  for (let i = 1; i < points.length - 1; i += 1) {
    const before = points[i - 1]!;
    const corner = points[i]!;
    const after = points[i + 1]!;
    const into = Math.hypot(corner.x - before.x, corner.y - before.y);
    const out = Math.hypot(after.x - corner.x, after.y - corner.y);
    const radius = Math.min(12, into / 2, out / 2);
    if (radius < 0.001) {
      chunks.push("L " + point(corner));
      continue;
    }
    const enter = {
      x: corner.x + (before.x - corner.x) / into * radius,
      y: corner.y + (before.y - corner.y) / into * radius
    };
    const leave = {
      x: corner.x + (after.x - corner.x) / out * radius,
      y: corner.y + (after.y - corner.y) / out * radius
    };
    chunks.push("L " + point(enter));
    chunks.push("Q " + point(corner) + " " + point(leave));
  }
  chunks.push("L " + point(points[points.length - 1]!));
  return chunks.join(" ");
}

/** Returns an SVG path plus a label coordinate on that route (not a center-center midpoint). */
export function diagramEdgeGeometryV010(
  start: DiagramEdgePointV010,
  end: DiagramEdgePointV010,
  requestedKind: DiagramEdgePathKindV010 = "straight",
  options?: DiagramEdgeGeometryOptionsV010
): DiagramEdgeGeometryV010 {
  if (![start.x, start.y, end.x, end.y].every(Number.isFinite)) {
    throw new Error("EIDOS_DIAGRAM_EDGE_COORDINATES_INVALID");
  }
  if (!isDiagramEdgePathKindV010(requestedKind)) {
    throw new Error("EIDOS_DIAGRAM_EDGE_PATH_KIND_INVALID");
  }
  if (requestedKind === "straight") {
    return {
      kind: requestedKind,
      d: "M " + point(start) + " L " + point(end),
      label: halfwayOnSegments([start, end])
    };
  }
  if (requestedKind === "curve") {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const horizontal = Math.abs(dx) >= Math.abs(dy);
    const amount = Math.max(24, (horizontal ? Math.abs(dx) : Math.abs(dy)) * 0.42);
    const direction = horizontal ? Math.sign(dx) || 1 : Math.sign(dy) || 1;
    const c1 = horizontal
      ? { x: start.x + direction * amount, y: start.y }
      : { x: start.x, y: start.y + direction * amount };
    const c2 = horizontal
      ? { x: end.x - direction * amount, y: end.y }
      : { x: end.x, y: end.y - direction * amount };
    // Cubic Bézier at t=0.5, following the actual curve geometry.
    const label = {
      x: (start.x + 3 * c1.x + 3 * c2.x + end.x) / 8,
      y: (start.y + 3 * c1.y + 3 * c2.y + end.y) / 8
    };
    return {
      kind: requestedKind,
      d: "M " + point(start) + " C " + point(c1) + " " + point(c2) + " " + point(end),
      label
    };
  }
  const obstacles = options?.obstacles ?? [];
  const routed = obstacles.length > 0
    ? routeDiagramOrthogonalV010(start, end, obstacles, options?.clearance)
    : undefined;
  const corners = routed ?? elbowPoints(start, end);
  return {
    kind: requestedKind,
    d: requestedKind === "orthogonal"
      ? corners.map((p, i) => (i === 0 ? "M " : "L ") + point(p)).join(" ")
      : roundedPath(corners),
    label: halfwayOnSegments(corners),
    ...(obstacles.length > 0 && !routed ? { congested: true } : {})
  };
}
