/** B6a: deterministic, presentation-only smart alignment for drag previews.
 * Units are world coordinates; tolerance remains constant in CSS pixels.
 * The caller owns gesture cancellation, undo and persistence.
 */
export interface DiagramSnapRectV010 {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface DiagramSnapOptionsV010 {
  scale: number;
  /** Recommended 6 CSS px; never interpreted in world units. */
  tolerancePx?: number;
  gridSize?: number;
  alignToNodes?: boolean;
  snapToGrid?: boolean;
}
export interface DiagramSnapTranslationV010 {
  dx: number;
  dy: number;
  /** World coordinates of matched alignment targets; omit for grid-only snap. */
  guideX?: number;
  guideY?: number;
  snapX?: "node" | "grid";
  snapY?: "node" | "grid";
}

/** Keep the visible grid at least 12 screen px apart when zoomed far out. */
export function diagramGridStepV010(scale: number, base = 24): number {
  if (!Number.isFinite(scale) || scale <= 0
    || !Number.isFinite(base) || base <= 0) {
    throw new Error("EIDOS_DIAGRAM_GRID_SCALE_INVALID");
  }
  let step = base;
  while (step * scale < 12 && step < 1e8) step *= 2;
  return step;
}

function finiteRect(rect: DiagramSnapRectV010): boolean {
  return typeof rect.id === "string" && rect.id.length > 0
    && Number.isFinite(rect.x) && Number.isFinite(rect.y)
    && Number.isFinite(rect.width) && Number.isFinite(rect.height)
    && rect.width >= 0 && rect.height >= 0;
}
function union(rects: readonly DiagramSnapRectV010[]): DiagramSnapRectV010 {
  const minX = Math.min(...rects.map(rect => rect.x));
  const minY = Math.min(...rects.map(rect => rect.y));
  const maxX = Math.max(...rects.map(rect => rect.x + rect.width));
  const maxY = Math.max(...rects.map(rect => rect.y + rect.height));
  return { id: "moving-group", x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
function features(start: number, size: number): readonly number[] {
  return [start, start + size / 2, start + size];
}
function snapAxis(
  moving: readonly number[], others: readonly { id: string; points: readonly number[] }[],
  rawDelta: number, tolerance: number, gridSize: number,
  alignToNodes: boolean, snapToGrid: boolean
): { delta: number; guide?: number; kind?: "node" | "grid" } {
  // Tie-breaking is stable regardless of target enumeration: shortest correction,
  // then lowest target coordinate, followed by stable id and moving-feature index.
  let best: { correction: number; coordinate: number; key: string } | undefined;
  if (alignToNodes) {
    for (let index = 0; index < moving.length; index++) {
      const value = moving[index]! + rawDelta;
      for (const target of others) {
        for (const coordinate of target.points) {
          const correction = coordinate - value;
          if (Math.abs(correction) > tolerance) continue;
          const key = target.id + ":" + index;
          if (!best || Math.abs(correction) < Math.abs(best.correction) - 1e-9
            || (Math.abs(Math.abs(correction) - Math.abs(best.correction)) <= 1e-9
              && (coordinate < best.coordinate
                || (coordinate === best.coordinate && key < best.key)))) {
            best = { correction, coordinate, key };
          }
        }
      }
    }
  }
  if (best) return { delta: rawDelta + best.correction, guide: best.coordinate, kind: "node" };
  if (snapToGrid) {
    const coordinate = Math.round((moving[0]! + rawDelta) / gridSize) * gridSize;
    const correction = coordinate - (moving[0]! + rawDelta);
    if (Math.abs(correction) <= tolerance) return { delta: rawDelta + correction, kind: "grid" };
  }
  return { delta: rawDelta };
}

/** Rigidly translate an entire drag group, never each member independently.
 * Targets already hidden from the diagram must be excluded by the caller.
 */
export function diagramSnapTranslationV010(
  moving: readonly DiagramSnapRectV010[],
  stationary: readonly DiagramSnapRectV010[],
  rawDx: number,
  rawDy: number,
  options: DiagramSnapOptionsV010
): DiagramSnapTranslationV010 {
  if (!moving.length || !moving.every(finiteRect) || !stationary.every(finiteRect)
    || !Number.isFinite(rawDx) || !Number.isFinite(rawDy)
    || !Number.isFinite(options.scale) || options.scale <= 0
    || !Number.isFinite(options.tolerancePx ?? 6)
    || (options.tolerancePx ?? 6) < 0
    || !Number.isFinite(options.gridSize ?? 24)
    || (options.gridSize ?? 24) <= 0) {
    throw new Error("EIDOS_DIAGRAM_SNAP_INPUT_INVALID");
  }
  const box = union(moving);
  const movingIds = new Set(moving.map(rect => rect.id));
  const others = stationary.filter(rect => !movingIds.has(rect.id));
  const tolerance = (options.tolerancePx ?? 6) / options.scale;
  const gridSize = diagramGridStepV010(options.scale, options.gridSize ?? 24);
  const snappedX = snapAxis(features(box.x, box.width),
    others.map(rect => ({ id: rect.id, points: features(rect.x, rect.width) })),
    rawDx, tolerance, gridSize, options.alignToNodes === true, options.snapToGrid === true);
  const snappedY = snapAxis(features(box.y, box.height),
    others.map(rect => ({ id: rect.id, points: features(rect.y, rect.height) })),
    rawDy, tolerance, gridSize, options.alignToNodes === true, options.snapToGrid === true);
  return {
    dx: snappedX.delta, dy: snappedY.delta,
    ...(snappedX.guide === undefined ? {} : { guideX: snappedX.guide }),
    ...(snappedY.guide === undefined ? {} : { guideY: snappedY.guide }),
    ...(snappedX.kind === undefined ? {} : { snapX: snappedX.kind }),
    ...(snappedY.kind === undefined ? {} : { snapY: snappedY.kind })
  };
}


/** B6b: a route waypoint can snap on both axes, while a horizontal or
 * vertical orthogonal segment must only move along its perpendicular axis.
 * Never changes edge topology, anchors or manual waypoint identity.
 */
export function diagramSnapHandleOffsetV010(
  point: { x: number; y: number },
  dx: number,
  dy: number,
  movableAxis: "both" | "x" | "y",
  references: readonly DiagramSnapRectV010[],
  options: DiagramSnapOptionsV010
): DiagramSnapTranslationV010 {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)
    || !["both", "x", "y"].includes(movableAxis)) {
    throw new Error("EIDOS_DIAGRAM_HANDLE_SNAP_INVALID");
  }
  const snapped = diagramSnapTranslationV010(
    [{ id: "handle:active", x: point.x, y: point.y, width: 0, height: 0 }],
    references,
    movableAxis === "y" ? 0 : dx,
    movableAxis === "x" ? 0 : dy,
    options
  );
  if (movableAxis === "x") {
    return {
      dx: snapped.dx, dy: 0,
      ...(snapped.guideX === undefined ? {} : { guideX: snapped.guideX }),
      ...(snapped.snapX === undefined ? {} : { snapX: snapped.snapX })
    };
  }
  if (movableAxis === "y") {
    return {
      dx: 0, dy: snapped.dy,
      ...(snapped.guideY === undefined ? {} : { guideY: snapped.guideY }),
      ...(snapped.snapY === undefined ? {} : { snapY: snapped.snapY })
    };
  }
  return snapped;
}

export type DiagramArrangeModeV010 =
  | "left" | "center-x" | "right"
  | "top" | "center-y" | "bottom"
  | "distribute-x" | "distribute-y";

export interface DiagramArrangedNodeV010 { id: string; x: number; y: number }

/** Explicit, deterministic multi-selection arrangement.
 * Alignment uses the selected anchor node; distribution keeps the first and
 * last nodes fixed and makes gaps between adjacent node bounds equal.
 */
export function diagramArrangeNodesV010(
  nodes: readonly DiagramSnapRectV010[],
  mode: DiagramArrangeModeV010,
  anchorId?: string
): DiagramArrangedNodeV010[] {
  const modes: DiagramArrangeModeV010[] = [
    "left", "center-x", "right", "top", "center-y", "bottom",
    "distribute-x", "distribute-y"
  ];
  if (!modes.includes(mode) || nodes.length < (mode.startsWith("distribute") ? 3 : 2)
    || !nodes.every(finiteRect)
    || new Set(nodes.map(node => node.id)).size !== nodes.length
    || (anchorId !== undefined && !nodes.some(node => node.id === anchorId))) {
    throw new Error("EIDOS_DIAGRAM_ARRANGE_INVALID");
  }
  const anchor = nodes.find(node => node.id === anchorId) ?? nodes[0]!;
  if (mode.startsWith("distribute")) {
    const axis = mode === "distribute-x" ? "x" : "y";
    const size = axis === "x" ? "width" : "height";
    const ordered = [...nodes].sort((a, b) => a[axis] - b[axis] || a.id.localeCompare(b.id));
    const first = ordered[0]!, last = ordered[ordered.length - 1]!;
    const occupied = ordered.slice(0, -1).reduce((sum, node) => sum + node[size], 0);
    const gap = (last[axis] - first[axis] - occupied) / (ordered.length - 1);
    if (!Number.isFinite(gap) || gap < 0) {
      throw new Error("EIDOS_DIAGRAM_DISTRIBUTE_NO_SPACE");
    }
    const positions = new Map<string, number>();
    let cursor = first[axis];
    for (const node of ordered) {
      positions.set(node.id, cursor);
      cursor += node[size] + gap;
    }
    return nodes.map(node => ({
      id: node.id,
      x: axis === "x" ? positions.get(node.id)! : node.x,
      y: axis === "y" ? positions.get(node.id)! : node.y
    }));
  }
  return nodes.map(node => {
    let x = node.x, y = node.y;
    if (mode === "left") x = anchor.x;
    if (mode === "center-x") x = anchor.x + (anchor.width - node.width) / 2;
    if (mode === "right") x = anchor.x + anchor.width - node.width;
    if (mode === "top") y = anchor.y;
    if (mode === "center-y") y = anchor.y + (anchor.height - node.height) / 2;
    if (mode === "bottom") y = anchor.y + anchor.height - node.height;
    return { id: node.id, x, y };
  });
}
