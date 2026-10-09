/** Presentation-only disambiguation for parallel edges and explicit self relations.
 * No source/target/arrow mutation. Existing unstyled legacy edges may opt out of lane offsets.
 */
import type { DiagramEdgeGeometryV010, DiagramEdgePathKindV010, DiagramEdgePointV010 } from "./edge-paths.js";

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

/** An explicit self-edge is routed around the right side of its own node.
 * A straight-path self relation cannot literally be a single segment: this visual loop
 * is preferable to the degenerate same-point line that would otherwise be invisible.
 */
export function diagramSelfLoopGeometryV010(
  node: DiagramLaneNodeV010,
  kind: DiagramEdgePathKindV010 = "straight",
  laneOffset = 0
): DiagramEdgeGeometryV010 {
  if (![node.x, node.y, node.width, node.height, laneOffset].every(Number.isFinite)
    || node.width <= 0 || node.height <= 0 || Math.abs(laneOffset) > 1000
    || !["straight", "orthogonal", "rounded-orthogonal", "curve"].includes(kind)) {
    throw new Error("EIDOS_DIAGRAM_LOOP_INVALID");
  }
  const right = node.x + node.width;
  const y1 = node.y + node.height * 0.28;
  const y2 = node.y + node.height * 0.72;
  const reach = Math.max(38, 56 + laneOffset);
  const start = { x: right, y: y1 };
  const end = { x: right, y: y2 };
  const topRight = { x: right + reach, y: y1 };
  const bottomRight = { x: right + reach, y: y2 };
  let d: string;
  if (kind === "curve") {
    d = "M " + xy(start) + " C "
      + xy({ x: right + reach, y: y1 - reach * 0.35 }) + " "
      + xy({ x: right + reach, y: y2 + reach * 0.35 }) + " " + xy(end);
  } else if (kind === "rounded-orthogonal") {
    const r = Math.max(1, Math.min(12, (y2 - y1) / 3, reach / 3));
    d = "M " + xy(start)
      + " L " + xy({ x: topRight.x - r, y: y1 })
      + " Q " + xy(topRight) + " " + xy({ x: topRight.x, y: y1 + r })
      + " L " + xy({ x: bottomRight.x, y: y2 - r })
      + " Q " + xy(bottomRight) + " " + xy({ x: bottomRight.x - r, y: y2 })
      + " L " + xy(end);
  } else {
    d = "M " + xy(start) + " L " + xy(topRight) + " L " + xy(bottomRight)
      + " L " + xy(end);
  }
  return {
    kind,
    d,
    label: { x: right + reach + 2, y: (y1 + y2) / 2 }
  };
}
