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


export interface DiagramCameraTransformV010 {
  scale: number;
  translateX: number;
  translateY: number;
}

export function createDiagramCameraTransformV010(
  value: Partial<DiagramCameraTransformV010> = {}
): DiagramCameraTransformV010 {
  const scale = clampDiagramViewportScaleV010(value.scale ?? 1);
  const translateX = value.translateX ?? 0;
  const translateY = value.translateY ?? 0;
  if (!finite(translateX) || !finite(translateY)) {
    throw new Error("EIDOS_2D_CAMERA_TRANSLATION_INVALID");
  }
  return { scale, translateX, translateY };
}

export function diagramCameraScreenToWorldV010(
  camera: DiagramCameraTransformV010,
  screen: DiagramViewPointV010
): DiagramViewPointV010 {
  const scale = clampDiagramViewportScaleV010(camera.scale);
  return {
    x: (screen.x - camera.translateX) / scale,
    y: (screen.y - camera.translateY) / scale
  };
}

export function diagramCameraWorldToScreenV010(
  camera: DiagramCameraTransformV010,
  world: DiagramViewPointV010
): DiagramViewPointV010 {
  const scale = clampDiagramViewportScaleV010(camera.scale);
  return {
    x: world.x * scale + camera.translateX,
    y: world.y * scale + camera.translateY
  };
}

export function zoomDiagramCameraAtScreenPointV010(
  camera: DiagramCameraTransformV010,
  nextScale: number,
  anchor: DiagramViewPointV010,
  limits: DiagramViewportScaleLimitsV010 =
    DEFAULT_DIAGRAM_VIEWPORT_SCALE_LIMITS_V010
): DiagramCameraTransformV010 {
  const scale = clampDiagramViewportScaleV010(nextScale, limits);
  const world = diagramCameraScreenToWorldV010(camera, anchor);
  return {
    scale,
    translateX: anchor.x - world.x * scale,
    translateY: anchor.y - world.y * scale
  };
}

export function panDiagramCameraByScreenDeltaV010(
  camera: DiagramCameraTransformV010,
  delta: DiagramViewPointV010
): DiagramCameraTransformV010 {
  if (!finite(delta.x) || !finite(delta.y)) {
    throw new Error("EIDOS_2D_CAMERA_PAN_INVALID");
  }
  return {
    ...camera,
    translateX: camera.translateX + delta.x,
    translateY: camera.translateY + delta.y
  };
}

export interface DiagramWorldRectV010 {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DiagramViewportSizeV010 {
  width: number;
  height: number;
}

export function fitDiagramCameraToBoundsV010(
  bounds: DiagramWorldRectV010,
  viewport: DiagramViewportSizeV010,
  padding = 24,
  limits: DiagramViewportScaleLimitsV010 =
    DEFAULT_DIAGRAM_VIEWPORT_SCALE_LIMITS_V010
): DiagramCameraTransformV010 {
  if (
    !finite(bounds.x)
    || !finite(bounds.y)
    || !finite(bounds.width)
    || !finite(bounds.height)
    || bounds.width < 0
    || bounds.height < 0
    || !finite(viewport.width)
    || !finite(viewport.height)
    || viewport.width <= 0
    || viewport.height <= 0
    || !finite(padding)
    || padding < 0
  ) {
    throw new Error("EIDOS_2D_CAMERA_FIT_INVALID");
  }

  const availableWidth = Math.max(1, viewport.width - padding * 2);
  const availableHeight = Math.max(1, viewport.height - padding * 2);
  const widthScale = bounds.width > 0
    ? availableWidth / bounds.width
    : limits.max;
  const heightScale = bounds.height > 0
    ? availableHeight / bounds.height
    : limits.max;
  const scale = clampDiagramViewportScaleV010(
    Math.min(widthScale, heightScale),
    limits
  );
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  return {
    scale,
    translateX: viewport.width / 2 - centerX * scale,
    translateY: viewport.height / 2 - centerY * scale
  };
}
