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
  const gridSize = options.gridSize ?? 24;
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
