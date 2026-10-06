import type { ActionHost } from "../adapters/ports.js";
import type {
  ActionRequestV010,
  JsonValue
} from "../runtime/contracts.js";
import type {
  DiagramCameraTransformV010
} from "./viewport.js";
import {
  createDiagramCameraTransformV010,
  fitDiagramCameraToBoundsV010,
  panDiagramCameraByScreenDeltaV010,
  zoomDiagramCameraAtScreenPointV010
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
  localSelectionHide?: boolean;
  localSelectionHideLabel?: string;
  localSelectionHideNotice?: string;
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

export interface DiagramEditorToolbarActionV010 {
  id: string;
  label: string;
  route: string;
  primary?: boolean;
}

export interface DiagramEditorCapturedViewStateV010 {
  hiddenNodeIds?: string[];
  hiddenEdgeIds?: string[];
  placements: Array<{
    nodeId: string;
    x: number;
    y: number;
  }>;
  camera: {
    scale: number;
    translateX: number;
    translateY: number;
  };
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
  toolbarActions?: DiagramEditorToolbarActionV010[];
  initialCamera?: DiagramCameraTransformV010;
  viewInteraction?: DiagramEditorViewInteractionV010;
  showTechnicalMetadata?: boolean;
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
  captureViewState?: boolean;
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
  onNavigate?: (route: string) => void | Promise<void>;
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

export function mergeDiagramInspectorPropertiesV010(
  base: DiagramInspectorPropertyV010[] | undefined,
  inspection: DiagramInspectorPropertyV010[] | undefined
): DiagramInspectorPropertyV010[] | undefined {
  if (!inspection?.length) return base;
  const result = (base ?? []).map(item => ({ ...item }));
  const indexByKey = new Map(
    result.map((item, index) => [item.key, index] as const)
  );
  for (const property of inspection) {
    const existing = indexByKey.get(property.key);
    if (existing === undefined) {
      indexByKey.set(property.key, result.length);
      result.push({ ...property });
    } else {
      // Lazy selection inspection is authoritative for the selected object.
      // Repeated keys refine/refresh the base projection instead of turning a
      // valid selection into a rendering error.
      result[existing] = { ...property };
    }
  }
  return result;
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
      page.toolbarActions === undefined
      || (
        Array.isArray(page.toolbarActions)
        && page.toolbarActions.every(action =>
          nonEmpty(action?.id)
          && nonEmpty(action?.label)
          && nonEmpty(action?.route)
          && action.route.startsWith("/")
          && (
            action.primary === undefined
            || typeof action.primary === "boolean"
          )
        )
      )
    )
    && (
      page.initialCamera === undefined
      || (
        typeof page.initialCamera === "object"
        && page.initialCamera !== null
        && Number.isFinite(page.initialCamera.scale)
        && page.initialCamera.scale > 0
        && Number.isFinite(page.initialCamera.translateX)
        && Number.isFinite(page.initialCamera.translateY)
      )
    )
    && (
      page.showTechnicalMetadata === undefined
      || typeof page.showTechnicalMetadata === "boolean"
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
        && (
          page.viewInteraction.localSelectionHide === undefined
          || typeof page.viewInteraction.localSelectionHide === "boolean"
        )
        && (
          page.viewInteraction.localSelectionHideLabel === undefined
          || nonEmpty(page.viewInteraction.localSelectionHideLabel)
        )
        && (
          page.viewInteraction.localSelectionHideNotice === undefined
          || nonEmpty(page.viewInteraction.localSelectionHideNotice)
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
          || (
            action.captureViewState !== undefined
            && typeof action.captureViewState !== "boolean"
          )
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
  commandOverride?: DiagramEditorCommandV010,
  viewState?: DiagramEditorCapturedViewStateV010
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
      operation: jsonClone(operation),
      ...(viewState
        ? { viewState: jsonClone(viewState) as unknown as JsonValue }
        : {})
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
  return `<section data-eidos-diagram-editor="${escapeHtml(page.id)}" data-has-selection="false">
<style>
[data-eidos-diagram-editor="${escapeHtml(page.id)}"]{
  display:grid;
  grid-template-rows:auto minmax(0,1fr) auto;
  gap:8px;
  min-width:0;
  height:calc(100dvh - 112px);
  min-height:560px;
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"]>header{
  min-height:40px;
  display:flex;
  align-items:center;
  gap:10px;
  flex-wrap:wrap;
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"]>header h1{
  margin:0;
  font-size:1.125rem;
  line-height:1.25;
  font-weight:650;
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-lifecycle],
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-revision]{
  font-size:var(--eidos-font-meta,.75rem);
  color:var(--eidos-fg-muted,#5F6B76);
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-toolbar]{
  margin-left:auto;
  display:flex;
  align-items:center;
  gap:6px;
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-toolbar] button,
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-view-controls] button{
  min-height:32px;
  border:1px solid var(--eidos-border-strong,#C9D2DC);
  border-radius:var(--eidos-radius-sm,8px);
  padding:0 10px;
  background:var(--eidos-bg,#FFFFFF);
  color:var(--eidos-fg,#1F2933);
  box-shadow:var(--eidos-shadow-surface,0 1px 2px rgba(31,41,51,.05));
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-toolbar] button:hover,
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-view-controls] button:hover{
  background:var(--eidos-bg-hover,#EEF3F8);
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-toolbar] button[data-eidos-primary="true"]{
  border-color:var(--eidos-primary,#2B6CB0);
  background:var(--eidos-primary,#2B6CB0);
  color:var(--eidos-primary-fg,#FFFFFF);
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-layout]{
  display:grid;
  grid-template-columns:minmax(0,1fr);
  gap:12px;
  min-height:0;
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"][data-has-selection="true"] [data-eidos-diagram-layout]{
  grid-template-columns:minmax(0,1fr) minmax(260px,320px);
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-canvas-wrap]{
  position:relative;
  min-width:0;
  min-height:0;
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-canvas]{
  position:absolute;
  inset:0;
  overflow:hidden;
  border:1px solid var(--eidos-border,#E2E7ED);
  border-radius:var(--eidos-radius-lg,12px);
  background-color:var(--eidos-bg,#FFFFFF);
  background-image:radial-gradient(circle,color-mix(in srgb,var(--eidos-fg,#1F2933) 10%,transparent) .7px,transparent .8px);
  background-size:24px 24px;
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--eidos-bg,#FFFFFF) 60%,transparent);
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-view-controls]{
  position:absolute;
  right:12px;
  bottom:12px;
  z-index:8;
  display:flex;
  align-items:center;
  gap:4px;
  padding:4px;
  border:1px solid color-mix(in srgb,var(--eidos-border-strong,#C9D2DC) 82%,transparent);
  border-radius:var(--eidos-radius-md,10px);
  background:color-mix(in srgb,var(--eidos-bg,#FFFFFF) 94%,transparent);
  box-shadow:var(--eidos-shadow-raised,0 6px 18px rgba(31,41,51,.10));
  backdrop-filter:blur(8px);
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-view-controls] button{
  min-width:32px;
  padding-inline:8px;
  box-shadow:none;
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-inspector]{
  display:none;
  min-width:0;
  overflow:auto;
  border:1px solid var(--eidos-border,#E2E7ED);
  border-radius:var(--eidos-radius-lg,12px);
  padding:14px;
  background:var(--eidos-bg,#FFFFFF);
  box-shadow:var(--eidos-shadow-surface,0 1px 2px rgba(31,41,51,.05));
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"][data-has-selection="true"] [data-eidos-diagram-inspector]{
  display:block;
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-selection]{
  margin:0 0 10px;
  white-space:pre-line;
  line-height:1.5;
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-selection-actions]{
  display:grid;
  gap:8px;
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-status]{
  min-height:18px;
  font-size:var(--eidos-font-meta,.75rem);
  color:var(--eidos-fg-muted,#5F6B76);
}
@media (max-width:760px){
  [data-eidos-diagram-editor="${escapeHtml(page.id)}"]{
    height:auto;
    min-height:0;
  }
  [data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-layout],
  [data-eidos-diagram-editor="${escapeHtml(page.id)}"][data-has-selection="true"] [data-eidos-diagram-layout]{
    grid-template-columns:minmax(0,1fr);
  }
  [data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-canvas-wrap]{
    min-height:62dvh;
  }
}
</style>
<header>
<h1>${escapeHtml(page.title)}</h1>
<span data-eidos-diagram-lifecycle></span>
<span data-eidos-diagram-revision></span>
<div data-eidos-diagram-toolbar></div>
</header>
<div data-eidos-diagram-layout>
<div data-eidos-diagram-canvas-wrap>
<div data-eidos-diagram-canvas tabindex="0"></div>
<div data-eidos-diagram-view-controls aria-label="Canvas view controls"></div>
</div>
<aside data-eidos-diagram-inspector>
<p data-eidos-diagram-selection>${escapeHtml(page.emptyMessage ?? "Select a node or relation.")}</p>
<div data-eidos-diagram-selection-properties style="display:grid;gap:6px;margin:10px 0"></div>
<div data-eidos-diagram-selection-actions></div>
</aside>
</div>
<div data-eidos-diagram-status role="status"></div>
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
  const viewControls = root.querySelector<HTMLElement>(
    "[data-eidos-diagram-view-controls]"
  );
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
    || !viewControls
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
  let camera = createDiagramCameraTransformV010(page.initialCamera ?? {});
  let followsFitToCanvas = page.initialCamera === undefined;
  let stageElement: HTMLElement | undefined;
  let suppressNextNodeClick = false;
  const locallyHiddenNodeIds = new Set<string>();
  const locallyHiddenEdgeIds = new Set<string>();
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
    if (followsFitToCanvas) fitViewToCanvas();
    report("Ready.");
  };

  const nodeVisible = (nodeId: string): boolean =>
    !locallyHiddenNodeIds.has(nodeId);

  const edgeVisible = (edge: DiagramEditorEdgeV010): boolean =>
    !locallyHiddenEdgeIds.has(edge.id)
    && nodeVisible(edge.source)
    && nodeVisible(edge.target);

  const visibleNodes = (): DiagramEditorNodeV010[] =>
    (state?.nodes ?? []).filter(node => nodeVisible(node.id));

  const visibleEdges = (): DiagramEditorEdgeV010[] =>
    (state?.edges ?? []).filter(edge => edgeVisible(edge));

  const selectionStillExists = (
    candidate: { kind: "node" | "edge"; id: string } | undefined
  ): boolean => {
    if (!state || !candidate) return false;
    return candidate.kind === "node"
      ? visibleNodes().some(item => item.id === candidate.id)
      : visibleEdges().some(item => item.id === candidate.id);
  };

  const applyCameraTransform = (): void => {
    if (!stageElement) return;
    stageElement.style.transform =
      `matrix(${camera.scale},0,0,${camera.scale},${camera.translateX},${camera.translateY})`;
  };

  const graphBounds = (): {
    x: number;
    y: number;
    width: number;
    height: number;
  } => {
    const nodes = visibleNodes();
    if (!state || nodes.length === 0) {
      return { x: 0, y: 0, width: 1, height: 1 };
    }
    const minX = Math.min(...nodes.map(node => node.x));
    const minY = Math.min(...nodes.map(node => node.y));
    const maxX = Math.max(...nodes.map(node => node.x + node.width));
    const maxY = Math.max(...nodes.map(node => node.y + node.height));
    return {
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY)
    };
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
    commandOverride?: DiagramEditorCommandV010,
    captureViewState = false
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
      commandOverride,
      captureViewState
        ? {
            hiddenNodeIds: [...locallyHiddenNodeIds],
            hiddenEdgeIds: [...locallyHiddenEdgeIds],
            placements: visibleNodes().map(node => ({
              nodeId: node.id,
              x: node.x,
              y: node.y
            })),
            camera: {
              scale: camera.scale,
              translateX: camera.translateX,
              translateY: camera.translateY
            }
          }
        : undefined
    );
    const previousSelection = selected;
    report("Saving…");
    const result = await actionHost.execute(request);
    await options.onActionResult?.(result);
    if (!result.ok) {
      report(result.error?.message ?? "Diagram operation failed.");
      return;
    }
    state = stateFromResult(result.result);
    if (captureViewState) {
      locallyHiddenNodeIds.clear();
      locallyHiddenEdgeIds.clear();
    }
    selected = selectionStillExists(previousSelection)
      ? previousSelection
      : undefined;
    render();
    report("Saved.");
  };

  const fitViewToCanvas = (): void => {
    if (!state) return;
    camera = fitDiagramCameraToBoundsV010(
      graphBounds(),
      {
        width: Math.max(1, canvas.clientWidth),
        height: Math.max(1, canvas.clientHeight)
      },
      48,
      { min: 0.1, max: 1.25 }
    );
    applyCameraTransform();
    renderActions();
  };

  const applyZoomAt = (
    nextZoom: number,
    anchor = {
      x: canvas.clientWidth / 2,
      y: canvas.clientHeight / 2
    }
  ): void => {
    followsFitToCanvas = false;
    camera = zoomDiagramCameraAtScreenPointV010(
      camera,
      nextZoom,
      anchor
    );
    applyCameraTransform();
    renderActions();
  };

  const renderActions = (): void => {
    toolbar.replaceChildren();
    viewControls.replaceChildren();
    selectionActions.replaceChildren();
    if (!state) return;

    for (const action of page.toolbarActions ?? []) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = action.label;
      button.setAttribute("data-eidos-diagram-toolbar-action", action.id);
      button.setAttribute(
        "data-eidos-primary",
        action.primary === true ? "true" : "false"
      );
      button.onclick = () => {
        if (options.onNavigate) {
          void options.onNavigate(action.route);
        }
      };
      toolbar.appendChild(button);
    }

    const clearSelectionOnCanvasClick = (event: MouseEvent): void => {
    const target = event.target as Element | null;
    if (
      target?.closest?.("[data-eidos-diagram-node]")
      || target?.closest?.("[data-eidos-diagram-edge]")
      || target?.closest?.("[data-eidos-diagram-view-controls]")
    ) {
      return;
    }
    clearSelection();
  };
  canvas.addEventListener("click", clearSelectionOnCanvasClick);
  listeners.push(() =>
    canvas.removeEventListener("click", clearSelectionOnCanvasClick)
  );

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
        button.setAttribute("aria-label", title);
        button.setAttribute("data-eidos-diagram-view-action", "");
        button.onclick = onClick;
        viewControls.appendChild(button);
      };
      addViewButton("−", "Zoom out", () => {
        applyZoomAt(camera.scale / 1.2);
      });
      addViewButton("+", "Zoom in", () => {
        applyZoomAt(camera.scale * 1.2);
      });
      addViewButton("Fit", "Fit diagram to canvas", () => {
        followsFitToCanvas = true;
        fitViewToCanvas();
      });
      addViewButton(
        `${Math.round(camera.scale * 100)}%`,
        "Reset view",
        () => {
          followsFitToCanvas = false;
          camera = createDiagramCameraTransformV010();
          applyCameraTransform();
          renderActions();
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
          action.requiresConfirmation === true,
          undefined,
          action.captureViewState === true
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

    if (selected && page.viewInteraction?.localSelectionHide === true) {
      const hideButton = document.createElement("button");
      hideButton.type = "button";
      hideButton.setAttribute("data-eidos-diagram-local-hide", "");
      hideButton.textContent =
        page.viewInteraction.localSelectionHideLabel ?? "Remove from view";
      hideButton.onclick = () => hideSelectedFromView();
      selectionActions.appendChild(hideButton);
    }
  };

  function clearSelection(): void {
    if (!selected && !selectionInspection) return;
    selected = undefined;
    selectionInspection = undefined;
    selectionReadGeneration += 1;
    render();
    canvas?.focus({ preventScroll: true });
  }

  function hideSelectedFromView(): void {
    if (
      !state
      || !selected
      || page.viewInteraction?.localSelectionHide !== true
    ) {
      return;
    }
    if (selected.kind === "node") {
      locallyHiddenNodeIds.add(selected.id);
    } else {
      locallyHiddenEdgeIds.add(selected.id);
    }
    selected = undefined;
    selectionInspection = undefined;
    selectionReadGeneration += 1;
    render();
    report(
      page.viewInteraction.localSelectionHideNotice
      ?? "Removed from this view. Save the view to persist the change."
    );
  }

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
  ): DiagramInspectorPropertyV010[] | undefined =>
    mergeDiagramInspectorPropertiesV010(
      base,
      selectionInspection?.properties
    );

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
    root.setAttribute("data-has-selection", selected ? "true" : "false");
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
    const showTechnicalMetadata = page.showTechnicalMetadata === true;
    lifecycle.hidden = !showTechnicalMetadata || !state.lifecycleState;
    revision.hidden = !showTechnicalMetadata;
    lifecycle.textContent = showTechnicalMetadata && state.lifecycleState
      ? "State: " + state.lifecycleState
      : "";
    revision.textContent = showTechnicalMetadata
      ? "Revision: " + state.revision
      : "";
    canvas.replaceChildren();

    const bounds = graphBounds();
    const maxX = Math.max(1, bounds.x + bounds.width + 120);
    const maxY = Math.max(1, bounds.y + bounds.height + 120);

    const viewport = document.createElement("div");
    viewport.style.position = "absolute";
    viewport.style.inset = "0";
    viewport.style.overflow = "visible";

    const stage = document.createElement("div");
    stage.style.position = "absolute";
    stage.style.left = "0";
    stage.style.top = "0";
    stage.style.width = maxX + "px";
    stage.style.height = maxY + "px";
    stage.style.transformOrigin = "0 0";
    stageElement = stage;
    applyCameraTransform();

    const svg = svgElement("svg");
    svg.setAttribute("width", String(maxX));
    svg.setAttribute("height", String(maxY));
    svg.style.position = "absolute";
    svg.style.inset = "0";
    svg.style.overflow = "visible";
    svg.style.pointerEvents = "none";

    const defs = svgElement("defs");
    const markerEnd = svgElement("marker");
    markerEnd.setAttribute("id", "eidos-diagram-arrow-end");
    markerEnd.setAttribute("viewBox", "0 0 10 10");
    markerEnd.setAttribute("refX", "9");
    markerEnd.setAttribute("refY", "5");
    markerEnd.setAttribute("markerWidth", "5.5");
    markerEnd.setAttribute("markerHeight", "5.5");
    markerEnd.setAttribute("orient", "auto-start-reverse");
    const markerEndPath = svgElement("path");
    markerEndPath.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    markerEndPath.setAttribute("fill", "currentColor");
    markerEnd.appendChild(markerEndPath);
    defs.appendChild(markerEnd);
    svg.appendChild(defs);

    const renderedNodes = visibleNodes();
    const renderedEdges = visibleEdges();
    const focusedNodeIds = new Set<string>();
    const selectedNodeId = selected?.kind === "node" ? selected.id : undefined;
    const selectedEdgeId = selected?.kind === "edge" ? selected.id : undefined;
    if (selectedNodeId) {
      focusedNodeIds.add(selectedNodeId);
      for (const edge of renderedEdges) {
        if (edge.source === selectedNodeId) focusedNodeIds.add(edge.target);
        if (edge.target === selectedNodeId) focusedNodeIds.add(edge.source);
      }
    }
    if (selectedEdgeId) {
      const edge = renderedEdges.find(item => item.id === selectedEdgeId);
      if (edge) {
        focusedNodeIds.add(edge.source);
        focusedNodeIds.add(edge.target);
      }
    }

    for (const edge of renderedEdges) {
      const source = renderedNodes.find(node => node.id === edge.source);
      const target = renderedNodes.find(node => node.id === edge.target);
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
        render();
        canvas.focus({ preventScroll: true });
        void inspectSelection();
      });
      svg.appendChild(hit);

      const line = svgElement("line");
      line.setAttribute("x1", String(a.x));
      line.setAttribute("y1", String(a.y));
      line.setAttribute("x2", String(b.x));
      line.setAttribute("y2", String(b.y));
      const edgeSelected = selectedEdgeId === edge.id;
      const edgeConnected =
        Boolean(selectedNodeId)
        && (edge.source === selectedNodeId || edge.target === selectedNodeId);
      const edgeFocused = edgeSelected || edgeConnected;
      const edgeDimmed = Boolean(selected) && !edgeFocused;
      line.setAttribute(
        "stroke",
        edgeFocused
          ? "var(--eidos-primary,#2B6CB0)"
          : "var(--eidos-fg-muted,#5F6B76)"
      );
      line.setAttribute(
        "stroke-width",
        edgeSelected ? "2.4" : edgeConnected ? "1.7" : "1.15"
      );
      line.setAttribute(
        "stroke-opacity",
        edgeDimmed ? "0.10" : edgeFocused ? "0.92" : "0.42"
      );
      line.setAttribute("vector-effect", "non-scaling-stroke");
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
      const showEdgeCaption =
        Boolean(edgeCaption)
        && (
          edgeSelected
          || edgeConnected
          || (renderedEdges.length <= 18 && camera.scale >= 0.72)
        );
      if (showEdgeCaption) {
        const label = svgElement("text");
        label.setAttribute("x", String((a.x + b.x) / 2));
        label.setAttribute("y", String((a.y + b.y) / 2 - 8));
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("font-size", "11");
        label.setAttribute("fill", "var(--eidos-fg-muted,#5F6B76)");
        label.setAttribute("paint-order", "stroke fill");
        label.setAttribute("stroke", "var(--eidos-bg,#FFFFFF)");
        label.setAttribute("stroke-width", "4");
        label.setAttribute("stroke-linejoin", "round");
        label.setAttribute("opacity", edgeFocused ? "1" : "0.82");
        label.textContent = edgeCaption;
        label.style.pointerEvents = "none";
        svg.appendChild(label);
      }
    }

    stage.appendChild(svg);

    for (const node of renderedNodes) {
      const element = document.createElement("button");
      element.type = "button";
      element.setAttribute("data-eidos-diagram-node", node.id);
      if (node.typeLabel) {
        const typeLabel = document.createElement("small");
        typeLabel.textContent = node.typeLabel;
        typeLabel.style.display = "inline-flex";
        typeLabel.style.alignSelf = "center";
        typeLabel.style.marginBottom = "5px";
        typeLabel.style.padding = "1px 6px";
        typeLabel.style.borderRadius = "999px";
        typeLabel.style.fontSize = ".6875rem";
        typeLabel.style.fontWeight = "600";
        typeLabel.style.letterSpacing = ".02em";
        typeLabel.style.color = "var(--eidos-fg-muted,#5F6B76)";
        typeLabel.style.background =
          node.shape === "rounded-rectangle"
            ? "color-mix(in srgb,var(--eidos-primary-subtle,#EAF2FB) 72%,var(--eidos-bg,#FFFFFF) 28%)"
            : "color-mix(in srgb,var(--eidos-accent-teal,#0F7B83) 9%,var(--eidos-bg,#FFFFFF) 91%)";
        element.appendChild(typeLabel);
      }
      const label = document.createElement("strong");
      label.textContent = node.label;
      label.style.display = "block";
      label.style.lineHeight = "1.35";
      label.style.fontWeight = "650";
      element.appendChild(label);
      for (const observation of node.observations ?? []) {
        const badge = document.createElement("small");
        badge.setAttribute("data-eidos-diagram-observation", observation.id);
        badge.textContent = observation.label + " " + observation.value;
        badge.title = observation.detail ?? "";
        badge.style.display = "block";
        badge.style.marginTop = "3px";
        badge.style.fontSize = ".6875rem";
        badge.style.fontWeight = "400";
        element.appendChild(badge);
      }
      element.title = [
        node.detail ?? node.kind,
        ...observationText(node.observations)
      ].filter(Boolean).join("\n");
      const nodeSelected = selectedNodeId === node.id;
      const nodeFocused = !selected || focusedNodeIds.has(node.id);
      element.style.position = "absolute";
      element.style.left = node.x + "px";
      element.style.top = node.y + "px";
      element.style.width = node.width + "px";
      element.style.height = node.height + "px";
      element.style.display = "flex";
      element.style.flexDirection = "column";
      element.style.alignItems = "center";
      element.style.justifyContent = "center";
      element.style.padding = "10px 12px";
      element.style.textAlign = "center";
      element.style.border = nodeSelected
        ? "2px solid var(--eidos-primary,#2B6CB0)"
        : "1px solid var(--eidos-border-strong,#C9D2DC)";
      element.style.borderRadius =
        node.shape === "rounded-rectangle" ? "12px" : "8px";
      element.style.background = nodeSelected
        ? "var(--eidos-primary-subtle,#EAF2FB)"
        : node.shape === "rounded-rectangle"
          ? "color-mix(in srgb,var(--eidos-primary-subtle,#EAF2FB) 34%,var(--eidos-bg,#FFFFFF) 66%)"
          : "color-mix(in srgb,var(--eidos-accent-teal,#0F7B83) 5%,var(--eidos-bg,#FFFFFF) 95%)";
      element.style.color = "var(--eidos-fg,#1F2933)";
      element.style.boxShadow = nodeSelected
        ? "0 0 0 2px color-mix(in srgb,var(--eidos-primary,#2B6CB0) 14%,transparent),var(--eidos-shadow-raised,0 6px 18px rgba(31,41,51,.10))"
        : "var(--eidos-shadow-surface,0 1px 2px rgba(31,41,51,.05))";
      element.style.opacity = nodeFocused ? "1" : "0.42";
      element.style.transition =
        "border-color .12s ease,background-color .12s ease,box-shadow .12s ease,opacity .12s ease";
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
        render();
        canvas.focus({ preventScroll: true });
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
            const nextX =
              originalX + screenDeltaX / camera.scale;
            const nextY =
              originalY + screenDeltaY / camera.scale;
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
      }

      stage.appendChild(element);
    }

    viewport.appendChild(stage);
    canvas.appendChild(viewport);
    applyCameraTransform();
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
          camera = panDiagramCameraByScreenDeltaV010(
            camera,
            {
              x: midpoint.x - pinchLastMidpoint.x,
              y: midpoint.y - pinchLastMidpoint.y
            }
          );
          applyCameraTransform();
        }
        const previousDistance = Math.max(
          1,
          pinchLastDistance ?? pinchStartDistance
        );
        applyZoomAt(
          camera.scale * currentDistance / previousDistance,
          canvasPoint(midpoint.x, midpoint.y)
        );
        pinchLastDistance = currentDistance;
        pinchLastMidpoint = midpoint;
        return;
      }

      if (points.length === 1 && page.viewInteraction?.pan && panLast) {
        const current = points[0]!;
        followsFitToCanvas = false;
        camera = panDiagramCameraByScreenDeltaV010(
          camera,
          {
            x: current.x - panLast.x,
            y: current.y - panLast.y
          }
        );
        applyCameraTransform();
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
      applyZoomAt(camera.scale * factor, anchor);
    };
    canvas.addEventListener("wheel", wheel, { passive: false });
    listeners.push(() => canvas.removeEventListener("wheel", wheel));
  }

  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(() => {
      if (!disposed && state && followsFitToCanvas) {
        fitViewToCanvas();
      }
    });
    observer.observe(canvas);
    listeners.push(() => observer.disconnect());
  }

  const keydownHandler = (event: KeyboardEvent): void => {
    const target = event.target;
    if (
      target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || target instanceof HTMLSelectElement
      || (target instanceof HTMLElement && target.isContentEditable)
    ) {
      return;
    }

    if (event.key === "Escape" && selected) {
      event.preventDefault();
      clearSelection();
      return;
    }

    if (
      page.viewInteraction?.localSelectionHide === true
      && selected
      && (event.key === "Delete" || event.key === "Backspace")
    ) {
      event.preventDefault();
      hideSelectedFromView();
    }
  };
  root.addEventListener("keydown", keydownHandler);
  listeners.push(() => root.removeEventListener("keydown", keydownHandler));

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
