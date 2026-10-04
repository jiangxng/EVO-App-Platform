export interface DiagramViewPointV010 {
  x: number;
  y: number;
}

export interface DiagramViewportTransformV010 {
  scale: number;
  scrollLeft: number;
  scrollTop: number;
}

export interface DiagramViewportScaleLimitsV010 {
  min: number;
  max: number;
}

export const DEFAULT_DIAGRAM_VIEWPORT_SCALE_LIMITS_V010:
DiagramViewportScaleLimitsV010 = {
  min: 0.1,
  max: 3
};

function finite(value: number): boolean {
  return Number.isFinite(value);
}

export function clampDiagramViewportScaleV010(
  scale: number,
  limits: DiagramViewportScaleLimitsV010 =
    DEFAULT_DIAGRAM_VIEWPORT_SCALE_LIMITS_V010
): number {
  if (
    !finite(scale)
    || !finite(limits.min)
    || !finite(limits.max)
    || limits.min <= 0
    || limits.max < limits.min
  ) {
    throw new Error("EIDOS_2D_VIEWPORT_SCALE_INVALID");
  }
  return Math.max(limits.min, Math.min(limits.max, scale));
}

export function diagramViewportScreenToWorldV010(
  viewport: DiagramViewportTransformV010,
  screen: DiagramViewPointV010
): DiagramViewPointV010 {
  const scale = clampDiagramViewportScaleV010(viewport.scale);
  return {
    x: (viewport.scrollLeft + screen.x) / scale,
    y: (viewport.scrollTop + screen.y) / scale
  };
}

export function diagramViewportWorldToScreenV010(
  viewport: DiagramViewportTransformV010,
  world: DiagramViewPointV010
): DiagramViewPointV010 {
  const scale = clampDiagramViewportScaleV010(viewport.scale);
  return {
    x: world.x * scale - viewport.scrollLeft,
    y: world.y * scale - viewport.scrollTop
  };
}

export function zoomDiagramViewportAtScreenPointV010(
  viewport: DiagramViewportTransformV010,
  nextScale: number,
  anchor: DiagramViewPointV010,
  limits: DiagramViewportScaleLimitsV010 =
    DEFAULT_DIAGRAM_VIEWPORT_SCALE_LIMITS_V010
): DiagramViewportTransformV010 {
  const scale = clampDiagramViewportScaleV010(nextScale, limits);
  const world = diagramViewportScreenToWorldV010(viewport, anchor);
  return {
    scale,
    scrollLeft: Math.max(0, world.x * scale - anchor.x),
    scrollTop: Math.max(0, world.y * scale - anchor.y)
  };
}

export function panDiagramViewportByScreenDeltaV010(
  viewport: DiagramViewportTransformV010,
  delta: DiagramViewPointV010
): DiagramViewportTransformV010 {
  if (!finite(delta.x) || !finite(delta.y)) {
    throw new Error("EIDOS_2D_VIEWPORT_PAN_INVALID");
  }
  return {
    ...viewport,
    scrollLeft: Math.max(0, viewport.scrollLeft - delta.x),
    scrollTop: Math.max(0, viewport.scrollTop - delta.y)
  };
}
