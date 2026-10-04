import type { ActionHost } from "../adapters/ports.js";
import type {
  ActionRequestV010,
  JsonValue
} from "../runtime/contracts.js";
import {
  clampDiagramViewportScaleV010,
  panDiagramViewportByScreenDeltaV010,
  zoomDiagramViewportAtScreenPointV010
} from "./viewport.js";

export type DiagramEditorNodeShapeV010 =
  | "rectangle"
  | "rounded-rectangle";

export type DiagramEditorEdgeStyleV010 =
  | "solid"
  | "dashed";

export type DiagramEditorEdgeArrowV010 =
  | "none"
  | "start"
  | "end"
  | "both";

export interface DiagramEditorViewInteractionV010 {
  zoom?: boolean;
  pan?: boolean;
  localNodeDrag?: boolean;
}

export interface DiagramEditorCommandV010 {
  code: string;
  inputVersion: string;
}

export interface DiagramObservationBadgeV010 {
  id: string;
  label: string;
  value: string;
  detail?: string;
}

export type DiagramInspectorPropertyValueV010 =
  | string
  | number
  | boolean
  | null;

export interface DiagramInspectorSelectOptionV010 {
  label: string;
  value: Exclude<DiagramInspectorPropertyValueV010, null>;
}

export interface DiagramInspectorPropertyEditorV010 {
  kind: "TEXT" | "NUMBER" | "BOOLEAN" | "SELECT";
  actionId: string;
  command?: DiagramEditorCommandV010;
  valueField: string;
  operation: Record<string, JsonValue>;
  requiresConfirmation?: boolean;
  options?: DiagramInspectorSelectOptionV010[];
}

export interface DiagramInspectorPropertyV010 {
  key: string;
  label: string;
  value: DiagramInspectorPropertyValueV010;
  detail?: string;
  editor?: DiagramInspectorPropertyEditorV010;
}

export interface DiagramEditorReadPresetV010 {
  id: string;
  label: string;
  values: Record<string, JsonValue>;
}

export interface DiagramEditorPageV010 {
  contractVersion: "0.1.0";
  kind: "diagram-editor" | "diagram-workspace";
  id: string;
  title: string;
  resourceId: string;
  readCommand: DiagramEditorCommandV010;
  operationCommand?: DiagramEditorCommandV010;
  selectionReadCommand?: DiagramEditorCommandV010;
  requestValues?: Record<string, JsonValue>;
  readPresets?: DiagramEditorReadPresetV010[];
  viewInteraction?: DiagramEditorViewInteractionV010;
  emptyMessage?: string;
}

export interface DiagramEditorNodeV010 {
  id: string;
  kind: string;
  label: string;
  shape: DiagramEditorNodeShapeV010;
  x: number;
  y: number;
  width: number;
  height: number;
  readOnly?: boolean;
  typeLabel?: string;
  detail?: string;
  properties?: DiagramInspectorPropertyV010[];
  observations?: DiagramObservationBadgeV010[];
}

export interface DiagramEditorEdgeV010 {
  id: string;
  source: string;
  target: string;
  kind: string;
  label?: string;
  style?: DiagramEditorEdgeStyleV010;
  arrow?: DiagramEditorEdgeArrowV010;
  detail?: string;
  properties?: DiagramInspectorPropertyV010[];
  observations?: DiagramObservationBadgeV010[];
}

export interface DiagramEditorActionV010 {
  id: string;
  label: string;
  operation: JsonValue;
  requiresConfirmation?: boolean;
  target?: {
    kind: "graph" | "node" | "edge";
    id?: string;
  };
}

export interface DiagramEditorStateV010 {
  contractVersion: "0.1.0";
  resourceId: string;
  revision: number;
  lifecycleState?: string;
  nodes: DiagramEditorNodeV010[];
  edges: DiagramEditorEdgeV010[];
  actions?: DiagramEditorActionV010[];
  notice?: string;
}

export interface DiagramEditorSelectionInspectionV010 {
  contractVersion: "0.1.0";
  target: {
    kind: "node" | "edge";
    id: string;
  };
  properties: DiagramInspectorPropertyV010[];
}

export interface DiagramEditorStateValidationV010 {
  ok: boolean;
  issues: string[];
}

export interface MountDiagramEditorPageOptionsV010 {
  definition: DiagramEditorPageV010;
  container: HTMLElement;
  actionHost: ActionHost;
  onActionResult?: (result: unknown) => void | Promise<void>;
}

export interface MountedDiagramEditorPageV010 {
  refresh(): Promise<void>;
  dispose(): void;
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validInspectorEditor(
  value: DiagramInspectorPropertyEditorV010 | undefined
): boolean {
  if (value === undefined) return true;
  if (
    !["TEXT", "NUMBER", "BOOLEAN", "SELECT"].includes(value.kind)
    || !nonEmpty(value.actionId)
    || (
      value.command !== undefined
      && (
        !nonEmpty(value.command.code)
        || !nonEmpty(value.command.inputVersion)
      )
    )
    || !nonEmpty(value.valueField)
    || value.operation === null
    || typeof value.operation !== "object"
    || Array.isArray(value.operation)
  ) {
    return false;
  }
  if (value.options !== undefined) {
    if (
      value.kind !== "SELECT"
      || !Array.isArray(value.options)
      || value.options.length === 0
      || value.options.some(option =>
        !nonEmpty(option?.label)
        || option.value === null
        || !(
          typeof option.value === "string"
          || typeof option.value === "number"
          || typeof option.value === "boolean"
        )
        || (
          typeof option.value === "number"
          && !Number.isFinite(option.value)
        )
      )
    ) {
      return false;
    }
  }
  return value.kind !== "SELECT" || value.options !== undefined;
}

function validInspectorProperties(
  value: DiagramInspectorPropertyV010[] | undefined
): boolean {
  if (value === undefined) return true;
  if (!Array.isArray(value)) return false;
  const keys = new Set<string>();
  for (const property of value) {
    if (
      !nonEmpty(property?.key)
      || !nonEmpty(property?.label)
      || !(
        property.value === null
        || typeof property.value === "string"
        || typeof property.value === "number"
        || typeof property.value === "boolean"
      )
      || (
        typeof property.value === "number"
        && !Number.isFinite(property.value)
      )
      || (
        property.detail !== undefined
        && typeof property.detail !== "string"
      )
      || !validInspectorEditor(property.editor)
      || keys.has(property.key)
    ) {
      return false;
    }
    keys.add(property.key);
  }
  return true;
}

function jsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function isDiagramEditorPageV010(
  value: unknown
): value is DiagramEditorPageV010 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const page = value as Partial<DiagramEditorPageV010>;
  return page.contractVersion === "0.1.0"
    && (page.kind === "diagram-editor" || page.kind === "diagram-workspace")
    && nonEmpty(page.id)
    && nonEmpty(page.title)
    && nonEmpty(page.resourceId)
    && page.readCommand !== undefined
    && nonEmpty(page.readCommand?.code)
    && nonEmpty(page.readCommand?.inputVersion)
    && (
      page.operationCommand === undefined
      || (
        nonEmpty(page.operationCommand.code)
        && nonEmpty(page.operationCommand.inputVersion)
      )
    )
    && (
      page.selectionReadCommand === undefined
      || (
        nonEmpty(page.selectionReadCommand.code)
        && nonEmpty(page.selectionReadCommand.inputVersion)
      )
    )
    && (
      page.viewInteraction === undefined
      || (
        typeof page.viewInteraction === "object"
        && page.viewInteraction !== null
        && !Array.isArray(page.viewInteraction)
        && (
          page.viewInteraction.zoom === undefined
          || typeof page.viewInteraction.zoom === "boolean"
        )
        && (
          page.viewInteraction.pan === undefined
          || typeof page.viewInteraction.pan === "boolean"
        )
        && (
          page.viewInteraction.localNodeDrag === undefined
          || typeof page.viewInteraction.localNodeDrag === "boolean"
        )
      )
    )
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

export function validateDiagramEditorStateV010(
  value: unknown
): DiagramEditorStateValidationV010 {
  const issues: string[] = [];
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return {
      ok: false,
      issues: ["State must be an object."]
    };
  }

  const state = value as Partial<DiagramEditorStateV010>;
  if (state.contractVersion !== "0.1.0") {
    issues.push("Unsupported state contractVersion.");
  }
  if (!nonEmpty(state.resourceId)) {
    issues.push("resourceId is required.");
  }
  if (
    typeof state.revision !== "number"
    || !Number.isInteger(state.revision)
    || state.revision < 0
  ) {
    issues.push("revision must be a non-negative integer.");
  }
  if (!Array.isArray(state.nodes)) issues.push("nodes must be an array.");
  if (!Array.isArray(state.edges)) issues.push("edges must be an array.");
  if (issues.length > 0) return { ok: false, issues };

  const nodeIds = new Set<string>();
  for (const [index, node] of state.nodes!.entries()) {
    if (
      !nonEmpty(node?.id)
      || !nonEmpty(node?.kind)
      || !nonEmpty(node?.label)
      || !["rectangle", "rounded-rectangle"].includes(node?.shape)
      || !finite(node?.x)
      || !finite(node?.y)
      || !finite(node?.width)
      || !finite(node?.height)
      || node.width <= 0
      || node.height <= 0
      || (
        node.typeLabel !== undefined
        && typeof node.typeLabel !== "string"
      )
    ) {
      issues.push(`nodes[${index}] is invalid.`);
      continue;
    }
    if (nodeIds.has(node.id)) {
      issues.push(`Duplicate node id '${node.id}'.`);
    }
    if (!validInspectorProperties(node.properties)) {
      issues.push(`nodes[${index}].properties is invalid.`);
    }
    if (
      node.observations !== undefined
      && (
        !Array.isArray(node.observations)
        || node.observations.some(item =>
          !nonEmpty(item?.id)
          || !nonEmpty(item?.label)
          || !nonEmpty(item?.value)
        )
      )
    ) {
      issues.push(`nodes[${index}].observations is invalid.`);
    }
    nodeIds.add(node.id);
  }

  const edgeIds = new Set<string>();
  for (const [index, edge] of state.edges!.entries()) {
    if (
      !nonEmpty(edge?.id)
      || !nonEmpty(edge?.source)
      || !nonEmpty(edge?.target)
      || !nonEmpty(edge?.kind)
      || (edge.style !== undefined
        && !["solid", "dashed"].includes(edge.style))
      || (edge.arrow !== undefined
        && !["none", "start", "end", "both"].includes(edge.arrow))
    ) {
      issues.push(`edges[${index}] is invalid.`);
      continue;
    }
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      issues.push(`edges[${index}] references an unknown node.`);
    }
    if (edgeIds.has(edge.id)) {
      issues.push(`Duplicate edge id '${edge.id}'.`);
    }
    if (!validInspectorProperties(edge.properties)) {
      issues.push(`edges[${index}].properties is invalid.`);
    }
    if (
      edge.observations !== undefined
      && (
        !Array.isArray(edge.observations)
        || edge.observations.some(item =>
          !nonEmpty(item?.id)
          || !nonEmpty(item?.label)
          || !nonEmpty(item?.value)
        )
      )
    ) {
      issues.push(`edges[${index}].observations is invalid.`);
    }
    edgeIds.add(edge.id);
  }

  if (state.actions !== undefined) {
    if (!Array.isArray(state.actions)) {
      issues.push("actions must be an array when provided.");
    } else {
      const actionIds = new Set<string>();
      for (const [index, action] of state.actions.entries()) {
        if (
          !nonEmpty(action?.id)
          || !nonEmpty(action?.label)
          || action.operation === undefined
        ) {
          issues.push(`actions[${index}] is invalid.`);
          continue;
        }
        if (actionIds.has(action.id)) {
          issues.push(`Duplicate action id '${action.id}'.`);
        }
        actionIds.add(action.id);
        if (action.target?.kind === "node" && !nodeIds.has(action.target.id ?? "")) {
          issues.push(`actions[${index}] targets an unknown node.`);
        }
        if (action.target?.kind === "edge" && !edgeIds.has(action.target.id ?? "")) {
          issues.push(`actions[${index}] targets an unknown edge.`);
        }
      }
    }
  }

  return {
    ok: issues.length === 0,
    issues
  };
}

export function diagramEditorReadRequestV010(
  page: DiagramEditorPageV010,
  values: Record<string, JsonValue> = {}
): ActionRequestV010 {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: { ...page.readCommand },
    values: {
      ...(page.requestValues ? jsonClone(page.requestValues) : {}),
      ...jsonClone(values),
      resourceId: page.resourceId
    },
    sourceInteractionId: page.id,
    actionId: "diagram.read",
    requiresConfirmation: false
  };
}

export function diagramEditorSelectionReadRequestV010(
  page: DiagramEditorPageV010,
  target: { kind: "node" | "edge"; id: string }
): ActionRequestV010 {
  if (!page.selectionReadCommand) {
    throw new Error("EIDOS_DIAGRAM_SELECTION_READ_COMMAND_REQUIRED");
  }
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: { ...page.selectionReadCommand },
    values: {
      ...(page.requestValues ? jsonClone(page.requestValues) : {}),
      resourceId: page.resourceId,
      target: jsonClone(target)
    },
    sourceInteractionId: page.id,
    actionId: "diagram.selection.read",
    requiresConfirmation: false
  };
}

function selectionInspectionFromResult(
  result: unknown,
  expected: { kind: "node" | "edge"; id: string }
): DiagramEditorSelectionInspectionV010 {
  if (result === null || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("EIDOS_DIAGRAM_SELECTION_INSPECTION_INVALID");
  }
  const value = result as Partial<DiagramEditorSelectionInspectionV010>;
  if (
    value.contractVersion !== "0.1.0"
    || value.target?.kind !== expected.kind
    || value.target?.id !== expected.id
    || !validInspectorProperties(value.properties)
  ) {
    throw new Error("EIDOS_DIAGRAM_SELECTION_INSPECTION_INVALID");
  }
  return jsonClone(value as DiagramEditorSelectionInspectionV010);
}

export function diagramEditorOperationRequestV010(
  page: DiagramEditorPageV010,
  state: DiagramEditorStateV010,
  operation: JsonValue,
  actionId: string,
  requiresConfirmation = false,
  commandOverride?: DiagramEditorCommandV010
): ActionRequestV010 {
  const command = commandOverride ?? page.operationCommand;
  if (!command) {
    throw new Error("EIDOS_DIAGRAM_OPERATION_COMMAND_REQUIRED");
  }
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: { ...command },
    values: {
      ...(page.requestValues ? jsonClone(page.requestValues) : {}),
      resourceId: page.resourceId,
      expectedRevision: state.revision,
      operation: jsonClone(operation)
    },
    sourceInteractionId: page.id,
    actionId,
    requiresConfirmation
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

export function renderDiagramEditorPageShellToHtmlV010(
  page: DiagramEditorPageV010
): string {
  return `<section data-eidos-diagram-editor="${escapeHtml(page.id)}" style="display:grid;grid-template-rows:auto minmax(420px,1fr);gap:12px;min-height:560px">
<style>
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-layout]{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:12px;min-height:0}
@media (max-width:760px){
  [data-eidos-diagram-editor="${escapeHtml(page.id)}"]{min-height:0!important}
  [data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-layout]{grid-template-columns:minmax(0,1fr)}
  [data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-canvas]{min-height:56vh!important}
}
</style>
<header style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
<h1 style="margin:0;font-size:20px">${escapeHtml(page.title)}</h1>
<span data-eidos-diagram-lifecycle style="font-size:12px"></span>
<span data-eidos-diagram-revision style="font-size:12px"></span>
<div data-eidos-diagram-toolbar style="margin-left:auto;display:flex;gap:8px"></div>
</header>
<div data-eidos-diagram-layout>
<div data-eidos-diagram-canvas style="position:relative;overflow:auto;min-height:480px;border:1px solid currentColor;border-radius:8px;background:color-mix(in srgb,Canvas 97%,CanvasText 3%)"></div>
<aside data-eidos-diagram-inspector style="border:1px solid color-mix(in srgb,CanvasText 18%,transparent);border-radius:8px;padding:12px;overflow:auto">
<strong>Selection</strong>
<p data-eidos-diagram-selection>${escapeHtml(page.emptyMessage ?? "Select a node or relation.")}</p>
<div data-eidos-diagram-selection-properties style="display:grid;gap:6px;margin:10px 0"></div>
<div data-eidos-diagram-selection-actions style="display:grid;gap:8px"></div>
</aside>
</div>
<div data-eidos-diagram-status role="status" style="font-size:12px"></div>
</section>`;
}

function stateFromResult(
  result: unknown
): DiagramEditorStateV010 {
  const validation = validateDiagramEditorStateV010(result);
  if (!validation.ok) {
    throw new Error(
      "EIDOS_DIAGRAM_EDITOR_STATE_INVALID: " + validation.issues.join(" ")
    );
  }
  return jsonClone(result as DiagramEditorStateV010);
}

function svgElement<K extends keyof SVGElementTagNameMap>(
  name: K
): SVGElementTagNameMap[K] {
  return document.createElementNS("http://www.w3.org/2000/svg", name);
}

function nodeCenter(node: DiagramEditorNodeV010): {
  x: number;
  y: number;
} {
  return {
    x: node.x + node.width / 2,
    y: node.y + node.height / 2
  };
}

function nodeBoundaryPoint(
  node: DiagramEditorNodeV010,
  toward: { x: number; y: number }
): { x: number; y: number } {
  const center = nodeCenter(node);
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  if (dx === 0 && dy === 0) return center;
  const halfWidth = Math.max(1, node.width / 2);
  const halfHeight = Math.max(1, node.height / 2);
  const scale = 1 / Math.max(
    Math.abs(dx) / halfWidth,
    Math.abs(dy) / halfHeight
  );
  return {
    x: center.x + dx * scale,
    y: center.y + dy * scale
  };
}

export function mountDiagramEditorPageV010(
  options: MountDiagramEditorPageOptionsV010
): MountedDiagramEditorPageV010 {
  const { definition: page, container, actionHost } = options;
  if (!isDiagramEditorPageV010(page)) {
    throw new Error("EIDOS_DIAGRAM_EDITOR_PAGE_INVALID");
  }

  const root = container.querySelector<HTMLElement>(
    `[data-eidos-diagram-editor="${CSS.escape(page.id)}"]`
  );
  if (!root) throw new Error("EIDOS_DIAGRAM_EDITOR_ROOT_NOT_FOUND");

  const canvas = root.querySelector<HTMLElement>("[data-eidos-diagram-canvas]");
  const toolbar = root.querySelector<HTMLElement>("[data-eidos-diagram-toolbar]");
  const lifecycle = root.querySelector<HTMLElement>("[data-eidos-diagram-lifecycle]");
  const revision = root.querySelector<HTMLElement>("[data-eidos-diagram-revision]");
  const status = root.querySelector<HTMLElement>("[data-eidos-diagram-status]");
  const selectionText = root.querySelector<HTMLElement>("[data-eidos-diagram-selection]");
  const selectionProperties = root.querySelector<HTMLElement>(
    "[data-eidos-diagram-selection-properties]"
  );
  const selectionActions = root.querySelector<HTMLElement>(
    "[data-eidos-diagram-selection-actions]"
  );

  if (
    !canvas
    || !toolbar
    || !lifecycle
    || !revision
    || !status
    || !selectionText
    || !selectionProperties
    || !selectionActions
  ) {
    throw new Error("EIDOS_DIAGRAM_EDITOR_SHELL_INCOMPLETE");
  }

  let disposed = false;
  let state: DiagramEditorStateV010 | undefined;
  let selected: { kind: "node" | "edge"; id: string } | undefined;
  let selectionInspection:
    DiagramEditorSelectionInspectionV010 | undefined;
  let selectionReadGeneration = 0;
  let activeReadPresetId = page.readPresets?.[0]?.id;
  let zoom = 1;
  let suppressNextNodeClick = false;
  const navigationPointers = new Map<number, { x: number; y: number }>();
  let panLast: { x: number; y: number } | undefined;
  let pinchStartDistance: number | undefined;
  let pinchLastDistance: number | undefined;
  let pinchLastMidpoint: { x: number; y: number } | undefined;
  const touchDragThresholdPx = 8;
  const listeners: Array<() => void> = [];

  const report = (message: string): void => {
    if (!disposed) status.textContent = message;
  };

  const observationText = (
    observations: DiagramObservationBadgeV010[] | undefined
  ): string[] =>
    (observations ?? []).map(item =>
      item.label + ": " + item.value
    );

  const load = async (
    preset?: DiagramEditorReadPresetV010,
    preserveViewState = false
  ): Promise<void> => {
    if (disposed) return;
    report("Loading…");
    const result = await actionHost.execute(
      diagramEditorReadRequestV010(page, preset?.values ?? {})
    );
    await options.onActionResult?.(result);
    if (disposed) return;
    if (!result.ok) {
      report(result.error?.message ?? "Failed to load diagram.");
      return;
    }
    const previousSelection = selected;
    state = stateFromResult(result.result);
    selectionInspection = undefined;
    selectionReadGeneration += 1;
    selected = preserveViewState && previousSelection && (
      previousSelection.kind === "node"
        ? state.nodes.some(item => item.id === previousSelection.id)
        : state.edges.some(item => item.id === previousSelection.id)
    )
      ? previousSelection
      : undefined;
    render();
    report("Ready.");
  };

  const matchingActions = (): DiagramEditorActionV010[] => {
    if (!state) return [];
    return (state.actions ?? []).filter(action => {
      if (!action.target || action.target.kind === "graph") {
        return selected === undefined;
      }
      return selected?.kind === action.target.kind
        && selected.id === action.target.id;
    });
  };

  const executeOperation = async (
    operation: JsonValue,
    actionId: string,
    requiresConfirmation = false,
    commandOverride?: DiagramEditorCommandV010
  ): Promise<void> => {
    if (!state || disposed) return;
    if (
      requiresConfirmation
      && !window.confirm(actionId)
    ) {
      return;
    }
    const request = diagramEditorOperationRequestV010(
      page,
      state,
      operation,
      actionId,
      requiresConfirmation,
      commandOverride
    );
    report("Saving…");
    const result = await actionHost.execute(request);
    await options.onActionResult?.(result);
    if (!result.ok) {
      report(result.error?.message ?? "Diagram operation failed.");
      return;
    }
    state = stateFromResult(result.result);
    selected = undefined;
    render();
    report("Saved.");
  };

  const applyZoomAt = (
    nextZoom: number,
    anchor = {
      x: canvas.clientWidth / 2,
      y: canvas.clientHeight / 2
    }
  ): void => {
    const next = zoomDiagramViewportAtScreenPointV010(
      {
        scale: zoom,
        scrollLeft: canvas.scrollLeft,
        scrollTop: canvas.scrollTop
      },
      nextZoom,
      anchor
    );
    zoom = next.scale;
    render();
    canvas.scrollTo({
      left: next.scrollLeft,
      top: next.scrollTop
    });
  };

  const renderActions = (): void => {
    toolbar.replaceChildren();
    selectionActions.replaceChildren();
    if (!state) return;

    if (page.viewInteraction?.zoom) {
      const addViewButton = (
        label: string,
        title: string,
        onClick: () => void
      ) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.title = title;
        button.onclick = onClick;
        toolbar.appendChild(button);
      };
      addViewButton("−", "Zoom out", () => {
        applyZoomAt(zoom / 1.2);
      });
      addViewButton("+", "Zoom in", () => {
        applyZoomAt(zoom * 1.2);
      });
      addViewButton("Fit", "Fit diagram to canvas", () => {
        const maxX = Math.max(
          900,
          ...state!.nodes.map(node => node.x + node.width + 120)
        );
        const maxY = Math.max(
          520,
          ...state!.nodes.map(node => node.y + node.height + 120)
        );
        const availableWidth = Math.max(240, canvas.clientWidth - 24);
        const availableHeight = Math.max(240, canvas.clientHeight - 24);
        zoom = clampDiagramViewportScaleV010(
          Math.min(2, availableWidth / maxX, availableHeight / maxY)
        );
        render();
        canvas.scrollTo({ left: 0, top: 0 });
      });
      addViewButton(
        `${Math.round(zoom * 100)}%`,
        "Reset view",
        () => {
          zoom = 1;
          render();
          canvas.scrollTo({ left: 0, top: 0 });
        }
      );
    }

    for (const preset of page.readPresets ?? []) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = preset.label;
      button.setAttribute("data-eidos-diagram-read-preset", preset.id);
      button.setAttribute(
        "aria-pressed",
        String(activeReadPresetId === preset.id)
      );
      button.onclick = () => {
        activeReadPresetId = preset.id;
        void load(preset);
      };
      toolbar.appendChild(button);
    }

    for (const action of state.actions ?? []) {
      const isGraphAction = !action.target || action.target.kind === "graph";
      if (!isGraphAction) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = action.label;
      button.disabled = state.lifecycleState === "PUBLISHED";
      button.onclick = () => {
        void executeOperation(
          action.operation,
          action.id,
          action.requiresConfirmation === true
        );
      };
      toolbar.appendChild(button);
    }

    for (const action of matchingActions()) {
      if (!action.target || action.target.kind === "graph") continue;
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = action.label;
      button.disabled = state.lifecycleState === "PUBLISHED";
      button.onclick = () => {
        void executeOperation(
          action.operation,
          action.id,
          action.requiresConfirmation === true
        );
      };
      selectionActions.appendChild(button);
    }
  };

  const renderSelectionProperties = (
    properties: DiagramInspectorPropertyV010[] | undefined
  ): void => {
    selectionProperties.replaceChildren();
    if (!properties?.length) return;

    const list = document.createElement("dl");
    list.style.display = "grid";
    list.style.gridTemplateColumns = "minmax(90px,auto) minmax(0,1fr)";
    list.style.gap = "6px 10px";
    list.style.margin = "0";

    for (const property of properties) {
      const term = document.createElement("dt");
      term.textContent = property.label;
      term.style.fontWeight = "600";

      const value = document.createElement("dd");
      value.style.margin = "0";
      value.style.overflowWrap = "anywhere";
      if (property.detail) value.title = property.detail;

      if (!property.editor) {
        value.textContent = property.value === null
          ? "—"
          : String(property.value);
        list.append(term, value);
        continue;
      }

      const editor = property.editor;
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.gap = "6px";
      row.style.alignItems = "center";

      let readValue: () => DiagramInspectorPropertyValueV010;

      if (editor.kind === "BOOLEAN") {
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = property.value === true;
        input.setAttribute("aria-label", property.label);
        input.setAttribute("data-eidos-diagram-property-editor", property.key);
        readValue = () => input.checked;
        row.appendChild(input);
      } else if (editor.kind === "SELECT") {
        const select = document.createElement("select");
        select.setAttribute("aria-label", property.label);
        select.setAttribute("data-eidos-diagram-property-editor", property.key);
        for (const [index, option] of (editor.options ?? []).entries()) {
          const item = document.createElement("option");
          item.value = String(index);
          item.textContent = option.label;
          item.selected = Object.is(option.value, property.value);
          select.appendChild(item);
        }
        readValue = () => {
          const index = Number(select.value);
          return editor.options?.[index]?.value ?? null;
        };
        row.appendChild(select);
      } else {
        const input = document.createElement("input");
        input.type = editor.kind === "NUMBER" ? "number" : "text";
        input.value = property.value === null ? "" : String(property.value);
        input.setAttribute("aria-label", property.label);
        input.setAttribute("data-eidos-diagram-property-editor", property.key);
        readValue = () => {
          if (editor.kind === "NUMBER") {
            if (!input.value.trim()) return null;
            const parsed = Number(input.value);
            if (!Number.isFinite(parsed)) {
              throw new Error("EIDOS_DIAGRAM_PROPERTY_NUMBER_INVALID");
            }
            return parsed;
          }
          return input.value;
        };
        row.appendChild(input);
      }

      const save = document.createElement("button");
      save.type = "button";
      save.textContent = "Save";
      save.setAttribute("data-eidos-diagram-property-save", property.key);
      save.onclick = () => {
        try {
          const operation = jsonClone(editor.operation);
          operation[editor.valueField] = readValue();
          void executeOperation(
            operation,
            editor.actionId,
            editor.requiresConfirmation === true,
            editor.command
          );
        } catch (error) {
          report(error instanceof Error ? error.message : String(error));
        }
      };
      row.appendChild(save);
      value.appendChild(row);
      list.append(term, value);
    }
    selectionProperties.appendChild(list);
  };

  const selectedItem = () => {
    if (!state || !selected) return undefined;
    return selected.kind === "node"
      ? state.nodes.find(node => node.id === selected!.id)
      : state.edges.find(edge => edge.id === selected!.id);
  };

  const selectionPropertiesMerged = (
    base: DiagramInspectorPropertyV010[] | undefined
  ): DiagramInspectorPropertyV010[] | undefined => {
    if (!selectionInspection) return base;
    const result = [...(base ?? [])];
    const keys = new Set(result.map(item => item.key));
    for (const property of selectionInspection.properties) {
      if (keys.has(property.key)) {
        throw new Error("EIDOS_DIAGRAM_SELECTION_PROPERTY_DUPLICATE");
      }
      keys.add(property.key);
      result.push(property);
    }
    return result;
  };

  const inspectSelection = async (): Promise<void> => {
    if (!state || !selected || !page.selectionReadCommand || disposed) return;
    const target = { ...selected };
    const generation = ++selectionReadGeneration;
    selectionInspection = undefined;
    renderSelection();
    const result = await actionHost.execute(
      diagramEditorSelectionReadRequestV010(page, target)
    );
    await options.onActionResult?.(result);
    if (
      disposed
      || generation !== selectionReadGeneration
      || !selected
      || selected.kind !== target.kind
      || selected.id !== target.id
    ) {
      return;
    }
    if (!result.ok) {
      report(result.error?.message ?? "Failed to inspect selection.");
      return;
    }
    selectionInspection = selectionInspectionFromResult(
      result.result,
      target
    );
    renderSelection();
  };

  const renderSelection = (): void => {
    if (!state || !selected) {
      selectionText.textContent = page.emptyMessage ?? "Select a node or relation.";
      renderSelectionProperties(undefined);
      renderActions();
      return;
    }
    const item = selectedItem();
    selectionText.textContent = item
      ? [
          item.label,
          item.kind,
          item.detail,
          ...observationText(item.observations)
        ].filter(Boolean).join("\n")
      : page.emptyMessage ?? "Select a node or relation.";
    try {
      renderSelectionProperties(
        selectionPropertiesMerged(item?.properties)
      );
    } catch (error) {
      report(error instanceof Error ? error.message : String(error));
      renderSelectionProperties(item?.properties);
    }
    renderActions();
  };

  const render = (): void => {
    if (!state || disposed) return;
    lifecycle.textContent = state.lifecycleState
      ? "State: " + state.lifecycleState
      : "";
    revision.textContent = "Revision: " + state.revision;
    canvas.replaceChildren();

    const maxX = Math.max(
      900,
      ...state.nodes.map(node => node.x + node.width + 120)
    );
    const maxY = Math.max(
      520,
      ...state.nodes.map(node => node.y + node.height + 120)
    );

    const viewport = document.createElement("div");
    viewport.style.position = "relative";
    viewport.style.width = Math.max(canvas.clientWidth, maxX * zoom) + "px";
    viewport.style.height = Math.max(canvas.clientHeight, maxY * zoom) + "px";
    viewport.style.minWidth = "100%";
    viewport.style.minHeight = "100%";

    const stage = document.createElement("div");
    stage.style.position = "absolute";
    stage.style.left = "0";
    stage.style.top = "0";
    stage.style.width = maxX + "px";
    stage.style.height = maxY + "px";
    stage.style.transformOrigin = "0 0";
    stage.style.transform = `scale(${zoom})`;

    const svg = svgElement("svg");
    svg.setAttribute("width", String(maxX));
    svg.setAttribute("height", String(maxY));
    svg.style.position = "absolute";
    svg.style.inset = "0";
    svg.style.pointerEvents = "none";

    const defs = svgElement("defs");
    const markerEnd = svgElement("marker");
    markerEnd.setAttribute("id", "eidos-diagram-arrow-end");
    markerEnd.setAttribute("viewBox", "0 0 10 10");
    markerEnd.setAttribute("refX", "9");
    markerEnd.setAttribute("refY", "5");
    markerEnd.setAttribute("markerWidth", "7");
    markerEnd.setAttribute("markerHeight", "7");
    markerEnd.setAttribute("orient", "auto-start-reverse");
    const markerEndPath = svgElement("path");
    markerEndPath.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    markerEndPath.setAttribute("fill", "currentColor");
    markerEnd.appendChild(markerEndPath);
    defs.appendChild(markerEnd);
    svg.appendChild(defs);

    for (const edge of state.edges) {
      const source = state.nodes.find(node => node.id === edge.source);
      const target = state.nodes.find(node => node.id === edge.target);
      if (!source || !target) continue;
      const sourceCenter = nodeCenter(source);
      const targetCenter = nodeCenter(target);
      const a = nodeBoundaryPoint(source, targetCenter);
      const b = nodeBoundaryPoint(target, sourceCenter);
      const hit = svgElement("line");
      hit.setAttribute("x1", String(a.x));
      hit.setAttribute("y1", String(a.y));
      hit.setAttribute("x2", String(b.x));
      hit.setAttribute("y2", String(b.y));
      hit.setAttribute("stroke", "transparent");
      hit.setAttribute("stroke-width", "18");
      hit.style.pointerEvents = "stroke";
      hit.style.cursor = "pointer";
      hit.setAttribute("data-eidos-diagram-edge", edge.id);
      hit.addEventListener("click", () => {
        selected = { kind: "edge", id: edge.id };
        selectionInspection = undefined;
        renderSelection();
        void inspectSelection();
      });
      svg.appendChild(hit);

      const line = svgElement("line");
      line.setAttribute("x1", String(a.x));
      line.setAttribute("y1", String(a.y));
      line.setAttribute("x2", String(b.x));
      line.setAttribute("y2", String(b.y));
      line.setAttribute("stroke", "currentColor");
      line.setAttribute("stroke-width", selected?.kind === "edge" && selected.id === edge.id ? "3" : "2");
      if (edge.style === "dashed") {
        line.setAttribute("stroke-dasharray", "8 6");
      }
      if (edge.arrow === "end" || edge.arrow === "both") {
        line.setAttribute("marker-end", "url(#eidos-diagram-arrow-end)");
      }
      if (edge.arrow === "start" || edge.arrow === "both") {
        line.setAttribute("marker-start", "url(#eidos-diagram-arrow-end)");
      }
      line.style.pointerEvents = "none";
      svg.appendChild(line);

      const edgeCaption = [
        edge.label,
        ...(edge.observations ?? []).map(item =>
          item.label + " " + item.value
        )
      ].filter(Boolean).join(" · ");
      if (edgeCaption) {
        const label = svgElement("text");
        label.setAttribute("x", String((a.x + b.x) / 2));
        label.setAttribute("y", String((a.y + b.y) / 2 - 8));
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("font-size", "12");
        label.textContent = edgeCaption;
        label.style.pointerEvents = "none";
        svg.appendChild(label);
      }
    }

    stage.appendChild(svg);

    for (const node of state.nodes) {
      const element = document.createElement("button");
      element.type = "button";
      element.setAttribute("data-eidos-diagram-node", node.id);
      if (node.typeLabel) {
        const typeLabel = document.createElement("small");
        typeLabel.textContent = node.typeLabel;
        typeLabel.style.display = "block";
        typeLabel.style.marginBottom = "4px";
        typeLabel.style.fontSize = "10px";
        typeLabel.style.fontWeight = "600";
        typeLabel.style.opacity = "0.7";
        element.appendChild(typeLabel);
      }
      const label = document.createElement("strong");
      label.textContent = node.label;
      label.style.display = "block";
      element.appendChild(label);
      for (const observation of node.observations ?? []) {
        const badge = document.createElement("small");
        badge.setAttribute("data-eidos-diagram-observation", observation.id);
        badge.textContent = observation.label + " " + observation.value;
        badge.title = observation.detail ?? "";
        badge.style.display = "block";
        badge.style.marginTop = "3px";
        badge.style.fontSize = "10px";
        badge.style.fontWeight = "400";
        element.appendChild(badge);
      }
      element.title = [
        node.detail ?? node.kind,
        ...observationText(node.observations)
      ].filter(Boolean).join("\n");
      element.style.position = "absolute";
      element.style.left = node.x + "px";
      element.style.top = node.y + "px";
      element.style.width = node.width + "px";
      element.style.height = node.height + "px";
      element.style.border = "2px solid currentColor";
      element.style.borderRadius = node.shape === "rounded-rectangle" ? "14px" : "2px";
      element.style.background = "Canvas";
      element.style.color = "CanvasText";
      const localViewDrag = page.viewInteraction?.localNodeDrag === true;
      const persistentDrag = !node.readOnly && state.lifecycleState !== "PUBLISHED";
      element.style.cursor = localViewDrag || persistentDrag ? "grab" : "default";
      element.style.touchAction = localViewDrag || persistentDrag ? "none" : "auto";
      element.style.zIndex = "2";

      element.addEventListener("click", () => {
        if (suppressNextNodeClick) {
          suppressNextNodeClick = false;
          return;
        }
        selected = { kind: "node", id: node.id };
        selectionInspection = undefined;
        renderSelection();
        void inspectSelection();
      });

      if (localViewDrag || persistentDrag) {
        const pointerDown = (event: PointerEvent) => {
          const isTouch = event.pointerType === "touch";
          if (isTouch) {
            navigationPointers.set(event.pointerId, {
              x: event.clientX,
              y: event.clientY
            });
            const touchDragEligible =
              selected?.kind === "node"
              && selected.id === node.id
              && navigationPointers.size === 1;
            if (!touchDragEligible) {
              return;
            }
          }

          event.preventDefault();
          event.stopPropagation();
          element.setPointerCapture(event.pointerId);
          const startX = event.clientX;
          const startY = event.clientY;
          const originalX = node.x;
          const originalY = node.y;
          let moved = false;
          let cancelledByNavigation = false;

          const cancelForNavigation = (): void => {
            if (cancelledByNavigation) return;
            cancelledByNavigation = true;
            moved = false;
            element.style.left = originalX + "px";
            element.style.top = originalY + "px";
            suppressNextNodeClick = true;
            window.setTimeout(() => {
              suppressNextNodeClick = false;
            }, 0);
          };

          const pointerMove = (move: PointerEvent) => {
            if (isTouch && navigationPointers.size >= 2) {
              cancelForNavigation();
              return;
            }
            if (cancelledByNavigation) return;
            const screenDeltaX = move.clientX - startX;
            const screenDeltaY = move.clientY - startY;
            if (
              isTouch
              && !moved
              && Math.hypot(screenDeltaX, screenDeltaY) < touchDragThresholdPx
            ) {
              return;
            }
            const nextX = Math.max(
              0,
              originalX + screenDeltaX / zoom
            );
            const nextY = Math.max(
              0,
              originalY + screenDeltaY / zoom
            );
            moved = true;
            element.style.left = nextX + "px";
            element.style.top = nextY + "px";
          };

          const pointerUp = (up: PointerEvent) => {
            if (element.hasPointerCapture(up.pointerId)) {
              element.releasePointerCapture(up.pointerId);
            }
            element.removeEventListener("pointermove", pointerMove);
            element.removeEventListener("pointerup", pointerUp);
            element.removeEventListener("pointercancel", pointerUp);
            if (cancelledByNavigation || !moved) return;
            suppressNextNodeClick = true;
            const x = Number.parseFloat(element.style.left);
            const y = Number.parseFloat(element.style.top);
            if (localViewDrag && (node.readOnly || !page.operationCommand)) {
              node.x = x;
              node.y = y;
              render();
              window.setTimeout(() => {
                suppressNextNodeClick = false;
              }, 0);
              report("View adjusted locally. No changes were saved.");
              return;
            }
            void executeOperation(
              {
                type: "MOVE_NODE",
                nodeId: node.id,
                x,
                y
              },
              "diagram.node.move"
            );
          };

          element.addEventListener("pointermove", pointerMove);
          element.addEventListener("pointerup", pointerUp);
          element.addEventListener("pointercancel", pointerUp);
        };
        element.addEventListener("pointerdown", pointerDown);
        listeners.push(() => element.removeEventListener("pointerdown", pointerDown));
      }

      stage.appendChild(element);
    }

    viewport.appendChild(stage);
    canvas.appendChild(viewport);
    if (state.notice) report(state.notice);
    renderSelection();
  };

  if (page.viewInteraction?.zoom || page.viewInteraction?.pan) {
    canvas.style.touchAction = "none";
    if (page.viewInteraction?.pan) {
      canvas.style.cursor = "grab";
    }

    const canvasPoint = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const distance = (
      a: { x: number; y: number },
      b: { x: number; y: number }
    ): number => Math.hypot(b.x - a.x, b.y - a.y);

    const pointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (
        event.pointerType !== "touch"
        && (
          target?.closest?.("[data-eidos-diagram-node]")
          || target?.closest?.("[data-eidos-diagram-edge]")
        )
      ) {
        return;
      }
      if (!page.viewInteraction?.pan && event.pointerType !== "touch") {
        return;
      }
      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);
      navigationPointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY
      });
      const points = [...navigationPointers.values()];
      if (points.length === 1) {
        panLast = points[0];
        canvas.style.cursor = page.viewInteraction?.pan ? "grabbing" : "";
      } else if (points.length >= 2 && page.viewInteraction?.zoom) {
        pinchStartDistance = Math.max(1, distance(points[0]!, points[1]!));
        pinchLastDistance = pinchStartDistance;
        pinchLastMidpoint = {
          x: (points[0]!.x + points[1]!.x) / 2,
          y: (points[0]!.y + points[1]!.y) / 2
        };
        panLast = undefined;
      }
    };

    const pointerMove = (event: PointerEvent) => {
      if (!navigationPointers.has(event.pointerId)) return;
      event.preventDefault();
      navigationPointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY
      });
      const points = [...navigationPointers.values()];

      if (
        points.length >= 2
        && page.viewInteraction?.zoom
        && pinchStartDistance !== undefined
      ) {
        const currentDistance = Math.max(1, distance(points[0]!, points[1]!));
        const midpoint = {
          x: (points[0]!.x + points[1]!.x) / 2,
          y: (points[0]!.y + points[1]!.y) / 2
        };
        if (pinchLastMidpoint && page.viewInteraction?.pan) {
          const next = panDiagramViewportByScreenDeltaV010(
            {
              scale: zoom,
              scrollLeft: canvas.scrollLeft,
              scrollTop: canvas.scrollTop
            },
            {
              x: midpoint.x - pinchLastMidpoint.x,
              y: midpoint.y - pinchLastMidpoint.y
            }
          );
          canvas.scrollTo({
            left: next.scrollLeft,
            top: next.scrollTop
          });
        }
        const previousDistance = Math.max(
          1,
          pinchLastDistance ?? pinchStartDistance
        );
        applyZoomAt(
          zoom * currentDistance / previousDistance,
          canvasPoint(midpoint.x, midpoint.y)
        );
        pinchLastDistance = currentDistance;
        pinchLastMidpoint = midpoint;
        return;
      }

      if (points.length === 1 && page.viewInteraction?.pan && panLast) {
        const current = points[0]!;
        const next = panDiagramViewportByScreenDeltaV010(
          {
            scale: zoom,
            scrollLeft: canvas.scrollLeft,
            scrollTop: canvas.scrollTop
          },
          {
            x: current.x - panLast.x,
            y: current.y - panLast.y
          }
        );
        canvas.scrollTo({
          left: next.scrollLeft,
          top: next.scrollTop
        });
        panLast = current;
      }
    };

    const pointerUp = (event: PointerEvent) => {
      navigationPointers.delete(event.pointerId);
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      const points = [...navigationPointers.values()];
      if (points.length < 2) {
        pinchStartDistance = undefined;
        pinchLastDistance = undefined;
        pinchLastMidpoint = undefined;
      }
      panLast = points.length === 1 ? points[0] : undefined;
      if (points.length === 0) {
        canvas.style.cursor = page.viewInteraction?.pan ? "grab" : "";
      }
    };

    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointercancel", pointerUp);
    const lostPointerCapture = (event: PointerEvent) => {
      if (!navigationPointers.has(event.pointerId)) return;
      navigationPointers.delete(event.pointerId);
      const points = [...navigationPointers.values()];
      if (points.length < 2) {
        pinchStartDistance = undefined;
        pinchLastDistance = undefined;
        pinchLastMidpoint = undefined;
      }
      panLast = points.length === 1 ? points[0] : undefined;
    };
    canvas.addEventListener("lostpointercapture", lostPointerCapture);
    listeners.push(
      () => canvas.removeEventListener("pointerdown", pointerDown),
      () => canvas.removeEventListener("pointermove", pointerMove),
      () => canvas.removeEventListener("pointerup", pointerUp),
      () => canvas.removeEventListener("pointercancel", pointerUp),
      () => canvas.removeEventListener("lostpointercapture", lostPointerCapture)
    );
  }

  if (page.viewInteraction?.zoom) {
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const anchor = (() => {
        const rect = canvas.getBoundingClientRect();
        return {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        };
      })();
      const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
      applyZoomAt(zoom * factor, anchor);
    };
    canvas.addEventListener("wheel", wheel, { passive: false });
    listeners.push(() => canvas.removeEventListener("wheel", wheel));
  }

  void load(
    page.readPresets?.find(preset =>
      preset.id === activeReadPresetId
    )
  ).catch(error => {
    report(error instanceof Error ? error.message : String(error));
  });

  return {
    refresh() {
      return load(
        page.readPresets?.find(preset =>
          preset.id === activeReadPresetId
        ),
        true
      );
    },
    dispose() {
      disposed = true;
      for (const listener of listeners) listener();
    }
  };
}
