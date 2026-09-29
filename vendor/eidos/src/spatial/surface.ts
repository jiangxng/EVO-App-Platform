import type { ActionHost } from "../adapters/ports.js";
import type {
  ActionRequestV010,
  JsonValue
} from "../runtime/contracts.js";
import type { Vec3 } from "./engine.js";

export interface SpatialObservationBadgeV010 {
  id: string;
  label: string;
  value: string;
  detail?: string;
}

export interface SpatialObservatoryReadPresetV010 {
  id: string;
  label: string;
  values: Record<string, JsonValue>;
}

export interface SpatialObservatoryPageV010 {
  contractVersion: "0.1.0";
  kind: "spatial-observatory";
  id: string;
  title: string;
  resourceId: string;
  readCommand: {
    code: string;
    inputVersion: string;
  };
  requestValues?: Record<string, JsonValue>;
  readPresets?: SpatialObservatoryReadPresetV010[];
  emptyMessage?: string;
}

export interface SpatialObservatoryObjectV010 {
  id: string;
  kind: string;
  label: string;
  position: Vec3;
  detail?: string;
  observations?: SpatialObservationBadgeV010[];
}

export interface SpatialObservatoryLinkV010 {
  id: string;
  source: string;
  target: string;
  kind: string;
  label?: string;
  detail?: string;
  observations?: SpatialObservationBadgeV010[];
}

export interface SpatialObservatoryStateV010 {
  contractVersion: "0.1.0";
  resourceId: string;
  revision: number;
  objects: SpatialObservatoryObjectV010[];
  links: SpatialObservatoryLinkV010[];
  camera?: {
    position: Vec3;
    target: Vec3;
  };
  notice?: string;
}

export interface SpatialObservatoryStateValidationV010 {
  ok: boolean;
  issues: string[];
}

export interface MountSpatialObservatoryPageOptionsV010 {
  definition: SpatialObservatoryPageV010;
  container: HTMLElement;
  actionHost: ActionHost;
  onActionResult?: (result: unknown) => void | Promise<void>;
}

export interface MountedSpatialObservatoryPageV010 {
  refresh(): Promise<void>;
  dispose(): void;
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validVec3(value: unknown): value is Vec3 {
  return value !== null
    && typeof value === "object"
    && !Array.isArray(value)
    && finite((value as Partial<Vec3>).x)
    && finite((value as Partial<Vec3>).y)
    && finite((value as Partial<Vec3>).z);
}

function validObservations(value: unknown): boolean {
  return value === undefined
    || (
      Array.isArray(value)
      && value.every(item =>
        nonEmpty(item?.id)
        && nonEmpty(item?.label)
        && nonEmpty(item?.value)
      )
    );
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function isSpatialObservatoryPageV010(
  value: unknown
): value is SpatialObservatoryPageV010 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const page = value as Partial<SpatialObservatoryPageV010>;
  return page.contractVersion === "0.1.0"
    && page.kind === "spatial-observatory"
    && nonEmpty(page.id)
    && nonEmpty(page.title)
    && nonEmpty(page.resourceId)
    && page.readCommand !== undefined
    && nonEmpty(page.readCommand?.code)
    && nonEmpty(page.readCommand?.inputVersion)
    && (
      page.requestValues === undefined
      || (
        page.requestValues !== null
        && typeof page.requestValues === "object"
        && !Array.isArray(page.requestValues)
      )
    )
    && (
      page.readPresets === undefined
      || (
        Array.isArray(page.readPresets)
        && page.readPresets.every(preset =>
          nonEmpty(preset?.id)
          && nonEmpty(preset?.label)
          && preset.values !== null
          && typeof preset.values === "object"
          && !Array.isArray(preset.values)
        )
      )
    );
}

export function validateSpatialObservatoryStateV010(
  value: unknown
): SpatialObservatoryStateValidationV010 {
  const issues: string[] = [];
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, issues: ["State must be an object."] };
  }

  const state = value as Partial<SpatialObservatoryStateV010>;
  if (state.contractVersion !== "0.1.0") {
    issues.push("Unsupported contractVersion.");
  }
  if (!nonEmpty(state.resourceId)) issues.push("resourceId is required.");
  if (
    typeof state.revision !== "number"
    || !Number.isInteger(state.revision)
    || state.revision < 0
  ) {
    issues.push("revision must be a non-negative integer.");
  }
  if (!Array.isArray(state.objects)) issues.push("objects must be an array.");
  if (!Array.isArray(state.links)) issues.push("links must be an array.");
  if (
    state.camera !== undefined
    && (
      !validVec3(state.camera.position)
      || !validVec3(state.camera.target)
    )
  ) {
    issues.push("camera is invalid.");
  }
  if (issues.length > 0) return { ok: false, issues };

  const ids = new Set<string>();
  for (const [index, object] of state.objects!.entries()) {
    if (
      !nonEmpty(object?.id)
      || !nonEmpty(object?.kind)
      || !nonEmpty(object?.label)
      || !validVec3(object?.position)
      || !validObservations(object?.observations)
    ) {
      issues.push(`objects[${index}] is invalid.`);
      continue;
    }
    if (ids.has(object.id)) {
      issues.push(`Duplicate object id '${object.id}'.`);
    }
    ids.add(object.id);
  }

  const linkIds = new Set<string>();
  for (const [index, link] of state.links!.entries()) {
    if (
      !nonEmpty(link?.id)
      || !nonEmpty(link?.source)
      || !nonEmpty(link?.target)
      || !nonEmpty(link?.kind)
      || !ids.has(link.source)
      || !ids.has(link.target)
      || !validObservations(link?.observations)
    ) {
      issues.push(`links[${index}] is invalid.`);
      continue;
    }
    if (linkIds.has(link.id)) {
      issues.push(`Duplicate link id '${link.id}'.`);
    }
    linkIds.add(link.id);
  }

  return { ok: issues.length === 0, issues };
}

export function spatialObservatoryReadRequestV010(
  page: SpatialObservatoryPageV010,
  values: Record<string, JsonValue> = {}
): ActionRequestV010 {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: { ...page.readCommand },
    values: {
      ...(page.requestValues ? clone(page.requestValues) : {}),
      ...clone(values),
      resourceId: page.resourceId
    },
    sourceInteractionId: page.id,
    actionId: "spatial.read",
    requiresConfirmation: false
  };
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderSpatialObservatoryPageShellToHtmlV010(
  page: SpatialObservatoryPageV010
): string {
  return `<section data-eidos-spatial-observatory="${escapeHtml(page.id)}" style="display:grid;grid-template-rows:auto minmax(520px,1fr) auto;gap:12px;min-height:620px">
<header style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
<h1 style="margin:0;font-size:20px">${escapeHtml(page.title)}</h1>
<span data-eidos-spatial-revision style="font-size:12px"></span>
<div data-eidos-spatial-toolbar style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap"></div>
</header>
<div style="display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:12px;min-height:0">
<div data-eidos-spatial-canvas tabindex="0" aria-label="${escapeHtml(page.title)} 3D scene" style="position:relative;overflow:hidden;min-height:520px;border:1px solid currentColor;border-radius:8px;background:color-mix(in srgb,Canvas 97%,CanvasText 3%);touch-action:none">
<svg data-eidos-spatial-links aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></svg>
<div data-eidos-spatial-objects style="position:absolute;inset:0"></div>
</div>
<aside data-eidos-spatial-inspector style="border:1px solid color-mix(in srgb,CanvasText 18%,transparent);border-radius:8px;padding:12px;overflow:auto">
<strong>Selection</strong>
<p data-eidos-spatial-selection style="white-space:pre-wrap">${escapeHtml(page.emptyMessage ?? "Select an object or relation.")}</p>
<p style="font-size:12px;opacity:.72">Drag the scene to orbit. Use the mouse wheel or trackpad to zoom.</p>
</aside>
</div>
<div data-eidos-spatial-status role="status" style="font-size:12px"></div>
</section>`;
}

function stateFromResult(result: unknown): SpatialObservatoryStateV010 {
  const validation = validateSpatialObservatoryStateV010(result);
  if (!validation.ok) {
    throw new Error(
      "EIDOS_SPATIAL_OBSERVATORY_STATE_INVALID: "
      + validation.issues.join(" ")
    );
  }
  return clone(result as SpatialObservatoryStateV010);
}

function observationText(
  observations: SpatialObservationBadgeV010[] | undefined
): string[] {
  return (observations ?? []).map(item =>
    item.label + ": " + item.value
  );
}

interface Projected {
  x: number;
  y: number;
  depth: number;
  scale: number;
  visible: boolean;
}

function initialOrbit(camera: SpatialObservatoryStateV010["camera"]): {
  yaw: number;
  pitch: number;
  distance: number;
  target: Vec3;
} {
  const target = camera?.target ?? { x: 0, y: 0, z: 0 };
  const position = camera?.position ?? { x: 700, y: 460, z: 900 };
  const dx = position.x - target.x;
  const dy = position.y - target.y;
  const dz = position.z - target.z;
  const distance = Math.max(200, Math.hypot(dx, dy, dz));
  return {
    yaw: Math.atan2(dx, dz),
    pitch: Math.asin(Math.max(-1, Math.min(1, dy / distance))),
    distance,
    target: clone(target)
  };
}

function project(
  point: Vec3,
  viewport: { width: number; height: number },
  orbit: {
    yaw: number;
    pitch: number;
    distance: number;
    target: Vec3;
  }
): Projected {
  const qx = point.x - orbit.target.x;
  const qy = point.y - orbit.target.y;
  const qz = point.z - orbit.target.z;

  const cy = Math.cos(-orbit.yaw);
  const sy = Math.sin(-orbit.yaw);
  const x1 = cy * qx - sy * qz;
  const z1 = sy * qx + cy * qz;

  const cp = Math.cos(orbit.pitch);
  const sp = Math.sin(orbit.pitch);
  const y2 = cp * qy + sp * z1;
  const z2 = -sp * qy + cp * z1;

  const depth = orbit.distance - z2;
  const focal = Math.max(360, Math.min(viewport.width, viewport.height) * 1.15);
  const visible = depth > 40;
  const scale = visible
    ? Math.max(0.55, Math.min(1.45, focal / depth))
    : 0.55;

  return {
    x: viewport.width / 2 + x1 * focal / Math.max(depth, 40),
    y: viewport.height / 2 - y2 * focal / Math.max(depth, 40),
    depth,
    scale,
    visible
  };
}

export function mountSpatialObservatoryPageV010(
  options: MountSpatialObservatoryPageOptionsV010
): MountedSpatialObservatoryPageV010 {
  const { definition: page, container, actionHost } = options;
  if (!isSpatialObservatoryPageV010(page)) {
    throw new Error("EIDOS_SPATIAL_OBSERVATORY_PAGE_INVALID");
  }
  const root = container.querySelector<HTMLElement>(
    `[data-eidos-spatial-observatory="${CSS.escape(page.id)}"]`
  );
  if (!root) throw new Error("EIDOS_SPATIAL_OBSERVATORY_ROOT_NOT_FOUND");

  const canvas = root.querySelector<HTMLElement>("[data-eidos-spatial-canvas]");
  const svg = root.querySelector<SVGSVGElement>("[data-eidos-spatial-links]");
  const objectLayer = root.querySelector<HTMLElement>("[data-eidos-spatial-objects]");
  const toolbar = root.querySelector<HTMLElement>("[data-eidos-spatial-toolbar]");
  const revision = root.querySelector<HTMLElement>("[data-eidos-spatial-revision]");
  const selection = root.querySelector<HTMLElement>("[data-eidos-spatial-selection]");
  const status = root.querySelector<HTMLElement>("[data-eidos-spatial-status]");
  if (!canvas || !svg || !objectLayer || !toolbar || !revision || !selection || !status) {
    throw new Error("EIDOS_SPATIAL_OBSERVATORY_SHELL_INCOMPLETE");
  }

  let disposed = false;
  let state: SpatialObservatoryStateV010 | undefined;
  let selected: { kind: "object" | "link"; id: string } | undefined;
  let activePresetId = page.readPresets?.[0]?.id;
  let orbit = initialOrbit(undefined);
  const disposers: Array<() => void> = [];

  const report = (message: string): void => {
    if (!disposed) status.textContent = message;
  };

  const renderSelection = (): void => {
    if (!state || !selected) {
      selection.textContent = page.emptyMessage ?? "Select an object or relation.";
      return;
    }
    const item = selected.kind === "object"
      ? state.objects.find(value => value.id === selected!.id)
      : state.links.find(value => value.id === selected!.id);
    selection.textContent = item
      ? [
          item.label,
          item.kind,
          item.detail,
          ...observationText(item.observations)
        ].filter(Boolean).join("\n")
      : page.emptyMessage ?? "Select an object or relation.";
  };

  const renderToolbar = (): void => {
    toolbar.replaceChildren();
    for (const preset of page.readPresets ?? []) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = preset.label;
      button.setAttribute("aria-pressed", String(activePresetId === preset.id));
      button.onclick = () => {
        activePresetId = preset.id;
        void load(preset);
      };
      toolbar.appendChild(button);
    }
    const reset = document.createElement("button");
    reset.type = "button";
    reset.textContent = "Reset view";
    reset.onclick = () => {
      orbit = initialOrbit(state?.camera);
      renderScene();
    };
    toolbar.appendChild(reset);
  };

  const objectElements = new Map<string, HTMLButtonElement>();
  const linkElements = new Map<string, {
    hit: SVGLineElement;
    line: SVGLineElement;
  }>();
  let sceneFrame: number | undefined;

  const syncSceneDom = (): void => {
    if (!state || disposed) return;

    const objectIds = new Set(state.objects.map(object => object.id));
    for (const [id, element] of objectElements) {
      if (objectIds.has(id)) continue;
      element.remove();
      objectElements.delete(id);
    }

    for (const object of state.objects) {
      let button = objectElements.get(object.id);
      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.setAttribute("data-eidos-spatial-object", object.id);
        button.style.position = "absolute";
        button.style.transformOrigin = "center";
        button.style.minWidth = "118px";
        button.style.maxWidth = "176px";
        button.style.padding = "8px 10px";
        button.style.border = "1.5px solid currentColor";
        button.style.background = "Canvas";
        button.style.color = "CanvasText";
        button.style.cursor = "pointer";
        button.onclick = event => {
          event.stopPropagation();
          selected = { kind: "object", id: object.id };
          renderSelection();
          renderScene();
        };
        objectLayer.appendChild(button);
        objectElements.set(object.id, button);
      }

      button.style.borderRadius = object.kind.toLowerCase().includes("ledger")
        ? "14px"
        : "4px";

      const label = document.createElement("strong");
      label.textContent = object.label;
      label.style.display = "block";
      const children: Node[] = [label];

      for (const observation of object.observations ?? []) {
        const badge = document.createElement("small");
        badge.textContent = observation.label + " " + observation.value;
        badge.title = observation.detail ?? "";
        badge.style.display = "block";
        badge.style.marginTop = "3px";
        badge.style.fontSize = "10px";
        badge.style.fontWeight = "400";
        children.push(badge);
      }
      button.replaceChildren(...children);
    }

    const linkIds = new Set(state.links.map(link => link.id));
    for (const [id, elements] of linkElements) {
      if (linkIds.has(id)) continue;
      elements.hit.remove();
      elements.line.remove();
      linkElements.delete(id);
    }

    for (const link of state.links) {
      if (linkElements.has(link.id)) continue;

      const hit = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      hit.setAttribute("stroke", "transparent");
      hit.setAttribute("stroke-width", "18");
      hit.style.pointerEvents = "stroke";
      hit.style.cursor = "pointer";
      hit.addEventListener("click", () => {
        selected = { kind: "link", id: link.id };
        renderSelection();
        renderScene();
      });

      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("stroke", "currentColor");
      line.setAttribute("stroke-opacity", "0.48");
      line.style.pointerEvents = "none";

      svg.append(hit, line);
      linkElements.set(link.id, { hit, line });
    }
  };

  const renderSceneNow = (): void => {
    if (!state || disposed) return;

    const width = Math.max(320, canvas.clientWidth || 900);
    const height = Math.max(420, canvas.clientHeight || 520);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const projected = new Map(
      state.objects.map(object => [
        object.id,
        project(object.position, { width, height }, orbit)
      ])
    );

    for (const link of state.links) {
      const elements = linkElements.get(link.id);
      if (!elements) continue;
      const a = projected.get(link.source);
      const b = projected.get(link.target);
      const visible = Boolean(a?.visible && b?.visible);
      elements.hit.style.display = visible ? "" : "none";
      elements.line.style.display = visible ? "" : "none";
      if (!visible || !a || !b) continue;

      for (const element of [elements.hit, elements.line]) {
        element.setAttribute("x1", String(a.x));
        element.setAttribute("y1", String(a.y));
        element.setAttribute("x2", String(b.x));
        element.setAttribute("y2", String(b.y));
      }
      elements.line.setAttribute(
        "stroke-width",
        selected?.kind === "link" && selected.id === link.id ? "3" : "1.5"
      );
    }

    for (const object of state.objects) {
      const button = objectElements.get(object.id);
      const p = projected.get(object.id);
      if (!button || !p) continue;
      button.hidden = !p.visible;
      if (!p.visible) continue;

      button.style.left = p.x + "px";
      button.style.top = p.y + "px";
      button.style.transform =
        `translate(-50%,-50%) scale(${p.scale})`;
      button.style.zIndex = String(
        Math.max(1, Math.round(100000 - p.depth))
      );
      button.setAttribute(
        "aria-pressed",
        String(selected?.kind === "object" && selected.id === object.id)
      );
    }

    revision.textContent = "View revision: " + state.revision;
  };

  const renderScene = (): void => {
    if (disposed || sceneFrame !== undefined) return;
    if (typeof globalThis.requestAnimationFrame !== "function") {
      renderSceneNow();
      return;
    }
    sceneFrame = globalThis.requestAnimationFrame(() => {
      sceneFrame = undefined;
      renderSceneNow();
    });
  };

  const load = async (
    preset?: SpatialObservatoryReadPresetV010,
    preserveViewState = false
  ): Promise<void> => {
    if (disposed) return;
    report("Loading…");
    const result = await actionHost.execute(
      spatialObservatoryReadRequestV010(page, preset?.values ?? {})
    );
    await options.onActionResult?.(result);
    if (disposed) return;
    if (!result.ok) {
      report(result.error?.message ?? "Failed to load spatial observatory.");
      return;
    }
    const previousSelection = selected;
    state = stateFromResult(result.result);
    if (!preserveViewState) {
      orbit = initialOrbit(state.camera);
    }
    selected = preserveViewState && previousSelection && (
      previousSelection.kind === "object"
        ? state.objects.some(item => item.id === previousSelection.id)
        : state.links.some(item => item.id === previousSelection.id)
    )
      ? previousSelection
      : undefined;
    renderToolbar();
    syncSceneDom();
    renderSelection();
    renderScene();
    report(state.notice ?? "Ready.");
  };

  let drag:
    | { pointerId: number; x: number; y: number; yaw: number; pitch: number }
    | undefined;

  const pointerDown = (event: PointerEvent): void => {
    if ((event.target as Element | null)?.closest("button")) return;
    drag = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      yaw: orbit.yaw,
      pitch: orbit.pitch
    };
    canvas.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: PointerEvent): void => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    orbit.yaw = drag.yaw + (event.clientX - drag.x) * 0.008;
    orbit.pitch = Math.max(
      -1.25,
      Math.min(1.25, drag.pitch + (event.clientY - drag.y) * 0.006)
    );
    renderScene();
  };
  const pointerUp = (event: PointerEvent): void => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag = undefined;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  };
  const wheel = (event: WheelEvent): void => {
    event.preventDefault();
    orbit.distance = Math.max(
      180,
      Math.min(5000, orbit.distance * Math.exp(event.deltaY * 0.0012))
    );
    renderScene();
  };
  const clearSelection = (event: MouseEvent): void => {
    if ((event.target as Element | null)?.closest("button")) return;
    selected = undefined;
    renderSelection();
    renderScene();
  };

  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerUp);
  canvas.addEventListener("wheel", wheel, { passive: false });
  canvas.addEventListener("click", clearSelection);
  disposers.push(
    () => canvas.removeEventListener("pointerdown", pointerDown),
    () => canvas.removeEventListener("pointermove", pointerMove),
    () => canvas.removeEventListener("pointerup", pointerUp),
    () => canvas.removeEventListener("pointercancel", pointerUp),
    () => canvas.removeEventListener("wheel", wheel),
    () => canvas.removeEventListener("click", clearSelection)
  );

  const resize = typeof ResizeObserver === "undefined"
    ? undefined
    : new ResizeObserver(() => renderScene());
  resize?.observe(canvas);
  if (resize) disposers.push(() => resize.disconnect());

  void load(
    page.readPresets?.find(preset => preset.id === activePresetId)
  ).catch(error => {
    report(error instanceof Error ? error.message : String(error));
  });

  return {
    refresh() {
      return load(
        page.readPresets?.find(preset =>
          preset.id === activePresetId
        ),
        true
      );
    },
    dispose() {
      disposed = true;
      if (
        sceneFrame !== undefined
        && typeof globalThis.cancelAnimationFrame === "function"
      ) {
        globalThis.cancelAnimationFrame(sceneFrame);
        sceneFrame = undefined;
      }
      for (const dispose of disposers) dispose();
    }
  };
}
