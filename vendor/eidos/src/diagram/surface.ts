import type { ActionHost } from "../adapters/ports.js";
import type {
  ActionRequestV010,
  JsonValue
} from "../runtime/contracts.js";
import type {
  DiagramCameraTransformV010
} from "./viewport.js";
import type {
  EidosContextNavigationItemV010,
  EidosContextNavigationV010
} from "../navigation/context-navigation.js";
import {
  assertContextNavigationV010,
  renderContextNavigationV010
} from "../navigation/context-navigation.js";
import {
  diagramEdgeGeometryV010,
  isDiagramEdgePathKindV010,
  type DiagramEdgePathKindV010
} from "./edge-paths.js";
import { diagramNodesIntersectingRectV010 } from "./selection.js";
import {
  diagramEdgeAnchorPointV010,
  diagramManualEdgeGeometryV010,
  diagramTranslateWaypointsV010,
  validDiagramEdgePathOverrideV010,
  type DiagramEdgeAnchorSideV010
} from "./edge-waypoints.js";
import {
  diagramOffsetNodeAttachmentV010,
  diagramParallelLaneOffsetsV010,
  diagramSelfLoopGeometryV010
} from "./edge-lanes.js";
import {
  layoutLayeredDiagramV010
} from "./layered-layout.js";
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

export type DiagramEditorToolbarPlacementV010 =
  | "TOOLBAR"
  | "OVERFLOW";

export interface DiagramEditorViewInteractionV010 {
  zoom?: boolean;
  pan?: boolean;
  localNodeDrag?: boolean;
  /** Permits local presentation-only connector shape changes, captured on explicit Save. */
  localEdgePathEdit?: boolean;
  localSelectionHide?: boolean;
  localSelectionHideLabel?: string;
  localSelectionHideNotice?: string;
  localVisibilityReset?: boolean;
  localVisibilityResetLabel?: string;
  localVisibilityResetNotice?: string;
  localVisibilityResetPlacement?: DiagramEditorToolbarPlacementV010;
  localAutoLayout?: boolean;
  localAutoLayoutLabel?: string;
  localAutoLayoutNotice?: string;
  localAutoLayoutDirection?: "RIGHT" | "DOWN";
  localAutoLayoutPlacement?: DiagramEditorToolbarPlacementV010;
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

export type DiagramEditorContextNavigationItemV010 =
  EidosContextNavigationItemV010;

export type DiagramEditorContextNavigationV010 =
  EidosContextNavigationV010;

export interface DiagramEditorCapturedViewStateV010 {
  hiddenNodeIds?: string[];
  hiddenEdgeIds?: string[];
  edgePaths?: Array<{ edgeId: string; pathKind: DiagramEdgePathKindV010; waypoints?: Array<{ x: number; y: number }>; sourceAnchor?: DiagramEdgeAnchorSideV010; targetAnchor?: DiagramEdgeAnchorSideV010 }>;
  viewport?: {
    width: number;
    height: number;
  };
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
  toolbarOverflowLabel?: string;
  contextNavigation?: DiagramEditorContextNavigationV010;
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
  /** A presentation route, independent of dashed texture and semantic arrow direction. */
  pathKind?: DiagramEdgePathKindV010;
  /** Explicit presentation-only manual points, never graph connection endpoints. */
  waypoints?: Array<{ x: number; y: number }>;
  sourceAnchor?: DiagramEdgeAnchorSideV010;
  targetAnchor?: DiagramEdgeAnchorSideV010;
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
  placement?: DiagramEditorToolbarPlacementV010;
  textPrompt?: {
    label: string;
    valueKey: string;
    defaultValue?: string;
    required?: boolean;
  };
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
  hiddenNodeIds?: string[];
  hiddenEdgeIds?: string[];
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

function validContextNavigationV010(
  value: DiagramEditorContextNavigationV010 | undefined
): boolean {
  try {
    assertContextNavigationV010(value);
    return true;
  } catch {
    return false;
  }
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
      page.toolbarOverflowLabel === undefined
      || nonEmpty(page.toolbarOverflowLabel)
    )
    && validContextNavigationV010(page.contextNavigation)
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
          page.viewInteraction.localEdgePathEdit === undefined
          || typeof page.viewInteraction.localEdgePathEdit === "boolean"
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
        && (
          page.viewInteraction.localVisibilityReset === undefined
          || typeof page.viewInteraction.localVisibilityReset === "boolean"
        )
        && (
          page.viewInteraction.localVisibilityResetLabel === undefined
          || nonEmpty(page.viewInteraction.localVisibilityResetLabel)
        )
        && (
          page.viewInteraction.localVisibilityResetNotice === undefined
          || nonEmpty(page.viewInteraction.localVisibilityResetNotice)
        )
        && (
          page.viewInteraction.localVisibilityResetPlacement === undefined
          || ["TOOLBAR", "OVERFLOW"].includes(
            page.viewInteraction.localVisibilityResetPlacement
          )
        )
        && (
          page.viewInteraction.localAutoLayout === undefined
          || typeof page.viewInteraction.localAutoLayout === "boolean"
        )
        && (
          page.viewInteraction.localAutoLayoutLabel === undefined
          || nonEmpty(page.viewInteraction.localAutoLayoutLabel)
        )
        && (
          page.viewInteraction.localAutoLayoutNotice === undefined
          || nonEmpty(page.viewInteraction.localAutoLayoutNotice)
        )
        && (
          page.viewInteraction.localAutoLayoutDirection === undefined
          || ["RIGHT", "DOWN"].includes(
            page.viewInteraction.localAutoLayoutDirection
          )
        )
        && (
          page.viewInteraction.localAutoLayoutPlacement === undefined
          || ["TOOLBAR", "OVERFLOW"].includes(
            page.viewInteraction.localAutoLayoutPlacement
          )
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
  for (const [field, value] of [
    ["hiddenNodeIds", state.hiddenNodeIds],
    ["hiddenEdgeIds", state.hiddenEdgeIds]
  ] as const) {
    if (
      value !== undefined
      && (
        !Array.isArray(value)
        || value.some(item => !nonEmpty(item))
        || new Set(value).size !== value.length
      )
    ) {
      issues.push(`${field} must contain unique non-empty strings.`);
    }
  }
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
      || (edge.pathKind !== undefined
        && !isDiagramEdgePathKindV010(edge.pathKind))
      || ((edge.waypoints !== undefined || edge.sourceAnchor !== undefined || edge.targetAnchor !== undefined)
        && !validDiagramEdgePathOverrideV010({
          pathKind: edge.pathKind ?? "straight", waypoints: edge.waypoints,
          sourceAnchor: edge.sourceAnchor, targetAnchor: edge.targetAnchor
        }))
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
          || (
            action.placement !== undefined
            && !["TOOLBAR", "OVERFLOW"].includes(action.placement)
          )
          || (
            action.textPrompt !== undefined
            && (
              !nonEmpty(action.textPrompt.label)
              || !nonEmpty(action.textPrompt.valueKey)
              || (
                action.textPrompt.defaultValue !== undefined
                && typeof action.textPrompt.defaultValue !== "string"
              )
              || (
                action.textPrompt.required !== undefined
                && typeof action.textPrompt.required !== "boolean"
              )
            )
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

function renderDiagramContextNavigationV010(
  page: DiagramEditorPageV010
): string {
  return renderContextNavigationV010(page.contextNavigation);
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
  display:grid;
  gap:4px;
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-heading-row]{
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
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-context-navigation]{
  min-width:0;
  min-height:22px;
  color:var(--eidos-fg-muted,#5F6B76);
  font-size:var(--eidos-font-meta,.75rem);
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-context-navigation-desktop]{
  display:flex;
  align-items:center;
  gap:6px;
  min-width:0;
  white-space:nowrap;
  overflow:hidden;
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-context-navigation-desktop] button,
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-context-navigation-mobile] button{
  appearance:none;
  border:0;
  padding:0;
  background:transparent;
  color:var(--eidos-fg-muted,#5F6B76);
  font:inherit;
  cursor:pointer;
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-context-navigation-desktop] button:hover,
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-context-navigation-mobile] button:hover{
  color:var(--eidos-primary,#2B6CB0);
  text-decoration:underline;
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-context-navigation-desktop] span[aria-current="page"]{
  color:var(--eidos-fg,#1F2933);
  font-weight:600;
  overflow:hidden;
  text-overflow:ellipsis;
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-context-separator]{
  color:color-mix(in srgb,var(--eidos-fg-muted,#5F6B76) 58%,transparent);
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-context-navigation-mobile]{
  display:none;
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-lifecycle],
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-revision]{
  font-size:var(--eidos-font-meta,.75rem);
  color:var(--eidos-fg-muted,#5F6B76);
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-toolbar]{
  margin-left:auto;
  min-width:0;
  display:flex;
  align-items:center;
  justify-content:flex-end;
  gap:6px;
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-more-actions]{
  position:relative;
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-more-actions]>summary{
  list-style:none;
  min-height:32px;
  display:flex;
  align-items:center;
  cursor:pointer;
  border:1px solid var(--eidos-border-strong,#C9D2DC);
  border-radius:var(--eidos-radius-sm,8px);
  padding:0 10px;
  background:var(--eidos-bg,#FFFFFF);
  color:var(--eidos-fg,#1F2933);
  box-shadow:var(--eidos-shadow-surface,0 1px 2px rgba(31,41,51,.05));
  user-select:none;
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-more-actions]>summary::-webkit-details-marker{
  display:none;
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-more-actions]>summary::after{
  content:"▾";
  margin-left:6px;
  font-size:.75em;
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-more-menu]{
  position:absolute;
  right:0;
  top:calc(100% + 6px);
  z-index:20;
  min-width:168px;
  display:grid;
  gap:4px;
  padding:6px;
  border:1px solid var(--eidos-border,#E2E7ED);
  border-radius:var(--eidos-radius-md,10px);
  background:var(--eidos-bg,#FFFFFF);
  box-shadow:var(--eidos-shadow-raised,0 6px 18px rgba(31,41,51,.10));
}
[data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-more-menu] button{
  width:100%;
  justify-content:flex-start;
  text-align:left;
  box-shadow:none;
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
  [data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-context-navigation-desktop]{
    display:none;
  }
  [data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-context-navigation-mobile]{
    display:flex;
    align-items:center;
    min-height:28px;
  }
  [data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-heading-row]{
    display:grid;
    grid-template-columns:minmax(0,1fr);
    align-items:flex-start;
    gap:8px;
  }
  [data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-toolbar]{
    width:100%;
    margin-left:0;
    justify-content:flex-start;
    flex-wrap:nowrap;
  }
  [data-eidos-diagram-editor="${escapeHtml(page.id)}"] [data-eidos-diagram-more-menu]{
    left:0;
    right:auto;
    max-width:min(86vw,280px);
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
${renderDiagramContextNavigationV010(page)}
<div data-eidos-diagram-heading-row>
<h1>${escapeHtml(page.title)}</h1>
<span data-eidos-diagram-lifecycle></span>
<span data-eidos-diagram-revision></span>
<div data-eidos-diagram-toolbar></div>
</div>
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

let diagramEditorInstanceSequence = 0;

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
  const selectedNodeIds = new Set<string>();
  let canvasTool: "SELECT" | "PAN" = "SELECT";
  let spaceHeld = false;
  let wheelInputMode: "MOUSE" | "TRACKPAD" = "MOUSE";
  try {
    wheelInputMode = window.localStorage.getItem("eidos.diagram.wheelMode") === "TRACKPAD"
      ? "TRACKPAD" : "MOUSE";
  } catch { /* Private browsing may disable storage; mouse stays the default. */ }
  let suppressNextCanvasClick = false;
  let canvasClickHandlerInstalled = false;
  let selectionInspection:
    DiagramEditorSelectionInspectionV010 | undefined;
  let selectionReadGeneration = 0;
  let activeReadPresetId = page.readPresets?.[0]?.id;
  let camera = createDiagramCameraTransformV010(page.initialCamera ?? {});
  let followsFitToCanvas = page.initialCamera === undefined;
  let stageElement: HTMLElement | undefined;
  let suppressNextNodeClick = false;
  const arrowMarkerId = "eidos-diagram-arrow-" + (++diagramEditorInstanceSequence);
  const locallyHiddenNodeIds = new Set<string>();
  type ViewSnapshot = {
    positions: Array<{ id: string; x: number; y: number }>;
    edgePaths: Array<{ id: string; pathKind?: DiagramEdgePathKindV010; waypoints?: Array<{ x: number; y: number }>; sourceAnchor?: DiagramEdgeAnchorSideV010; targetAnchor?: DiagramEdgeAnchorSideV010 }>;
    hiddenNodeIds: string[];
    hiddenEdgeIds: string[];
  };
  const undoHistory: ViewSnapshot[] = [];
  const redoHistory: ViewSnapshot[] = [];
  const captureSnapshot = (): ViewSnapshot => ({
    positions: (state?.nodes ?? []).map(node => ({ id: node.id, x: node.x, y: node.y })),
    edgePaths: (state?.edges ?? []).map(edge => ({
      id: edge.id, pathKind: edge.pathKind,
      ...(edge.waypoints ? { waypoints: edge.waypoints.map(p => ({ ...p })) } : {}),
      ...(edge.sourceAnchor ? { sourceAnchor: edge.sourceAnchor } : {}),
      ...(edge.targetAnchor ? { targetAnchor: edge.targetAnchor } : {})
    })),
    hiddenNodeIds: [...locallyHiddenNodeIds],
    hiddenEdgeIds: [...locallyHiddenEdgeIds]
  });
  const checkpoint = (): void => {
    undoHistory.push(captureSnapshot());
    if (undoHistory.length > 50) undoHistory.shift();
    redoHistory.length = 0;
  };
  const restoreSnapshot = (snapshot: ViewSnapshot): void => {
    for (const node of state?.nodes ?? []) {
      const position = snapshot.positions.find(item => item.id === node.id);
      if (position) { node.x = position.x; node.y = position.y; }
    }
    for (const edge of state?.edges ?? []) {
      const previous = snapshot.edgePaths.find(item => item.id === edge.id);
      if (previous) {
        if (previous.pathKind === undefined) delete edge.pathKind;
        else edge.pathKind = previous.pathKind;
        if (previous.waypoints === undefined) delete edge.waypoints;
        else edge.waypoints = previous.waypoints.map(p => ({ ...p }));
        if (previous.sourceAnchor === undefined) delete edge.sourceAnchor;
        else edge.sourceAnchor = previous.sourceAnchor;
        if (previous.targetAnchor === undefined) delete edge.targetAnchor;
        else edge.targetAnchor = previous.targetAnchor;
      }
    }
    locallyHiddenNodeIds.clear();
    locallyHiddenEdgeIds.clear();
    for (const id of snapshot.hiddenNodeIds) locallyHiddenNodeIds.add(id);
    for (const id of snapshot.hiddenEdgeIds) locallyHiddenEdgeIds.add(id);
    selected = undefined;
    selectedNodeIds.clear();
    selectionInspection = undefined;
    selectionReadGeneration += 1;
    render();
    report("View adjusted locally. Save to persist changes.");
  };
  const undoView = (): void => {
    const previous = undoHistory.pop();
    if (!previous) return;
    redoHistory.push(captureSnapshot());
    restoreSnapshot(previous);
  };
  const redoView = (): void => {
    const next = redoHistory.pop();
    if (!next) return;
    undoHistory.push(captureSnapshot());
    restoreSnapshot(next);
  };
  const locallyHiddenEdgeIds = new Set<string>();
  const syncLocalVisibilityFromState = (): void => {
    locallyHiddenNodeIds.clear();
    locallyHiddenEdgeIds.clear();
    for (const id of state?.hiddenNodeIds ?? []) locallyHiddenNodeIds.add(id);
    for (const id of state?.hiddenEdgeIds ?? []) locallyHiddenEdgeIds.add(id);
  };
  const navigationPointers = new Map<number, { x: number; y: number }>();
  let panLast: { x: number; y: number } | undefined;
  let pinchStartDistance: number | undefined;
  let pinchLastDistance: number | undefined;
  let pinchLastMidpoint: { x: number; y: number } | undefined;
  const touchDragThresholdPx = 8;
  const listeners: Array<() => void> = [];

  for (const button of Array.from(
    root.querySelectorAll<HTMLButtonElement>(
      "[data-eidos-context-route]"
    )
  )) {
    const onContextNavigate = (event: Event): void => {
      event.stopPropagation();
      const route = button.dataset.eidosContextRoute?.trim();
      if (route && options.onNavigate) void options.onNavigate(route);
    };
    button.addEventListener("click", onContextNavigate);
    listeners.push(() => button.removeEventListener("click", onContextNavigate));
  }

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
    undoHistory.length = 0;
    redoHistory.length = 0;
    selectedNodeIds.clear();
    syncLocalVisibilityFromState();
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
    if (!state || selectedNodeIds.size > 1) return [];
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
            edgePaths: (state.edges ?? []).filter(edge => edge.pathKind !== undefined)
              .map(edge => ({
                edgeId: edge.id, pathKind: edge.pathKind!,
                ...(edge.waypoints?.length ? { waypoints: edge.waypoints.map(p => ({ ...p })) } : {}),
                ...(edge.sourceAnchor && edge.sourceAnchor !== "auto" ? { sourceAnchor: edge.sourceAnchor } : {}),
                ...(edge.targetAnchor && edge.targetAnchor !== "auto" ? { targetAnchor: edge.targetAnchor } : {})
              })),
            viewport: {
              width: Math.max(1, canvas.clientWidth),
              height: Math.max(1, canvas.clientHeight)
            },
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
    undoHistory.length = 0;
    redoHistory.length = 0;
    selectedNodeIds.clear();
    syncLocalVisibilityFromState();
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

  const selectedBounds = (): {
    x: number;
    y: number;
    width: number;
    height: number;
  } | undefined => {
    if (!state || !selected) return undefined;
    const nodes = selected.kind === "node"
      ? state.nodes.filter(node => node.id === selected!.id)
      : (() => {
          const edge = state.edges.find(item => item.id === selected!.id);
          if (!edge) return [];
          return state.nodes.filter(
            node => node.id === edge.source || node.id === edge.target
          );
        })();
    if (nodes.length === 0) return undefined;
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

  const fitSelectionToCanvas = (): void => {
    const bounds = selectedBounds();
    if (!bounds) return;
    followsFitToCanvas = false;
    camera = fitDiagramCameraToBoundsV010(
      bounds,
      {
        width: Math.max(1, canvas.clientWidth),
        height: Math.max(1, canvas.clientHeight)
      },
      64,
      { min: 0.1, max: 2.5 }
    );
    applyCameraTransform();
    renderActions();
  };

  const resetZoomTo100 = (): void => {
    followsFitToCanvas = false;
    const center = {
      x: canvas.clientWidth / 2,
      y: canvas.clientHeight / 2
    };
    camera = zoomDiagramCameraAtScreenPointV010(camera, 1, center);
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

  const applyLocalAutoLayout = (): void => {
    if (!state) return;
    const visibleNodeIds = new Set(
      state.nodes
        .filter(node => !locallyHiddenNodeIds.has(node.id))
        .map(node => node.id)
    );
    if (visibleNodeIds.size === 0) return;

    const layout = layoutLayeredDiagramV010({
      nodes: state.nodes
        .filter(node => visibleNodeIds.has(node.id))
        .map(node => ({
          id: node.id,
          width: node.width,
          height: node.height
        })),
      edges: state.edges
        .filter(edge =>
          !locallyHiddenEdgeIds.has(edge.id)
          && visibleNodeIds.has(edge.source)
          && visibleNodeIds.has(edge.target)
        )
        .map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target
        })),
      options: {
        direction:
          page.viewInteraction?.localAutoLayoutDirection ?? "RIGHT"
      }
    });
    const placementByNode = new Map(
      layout.placements.map(placement => [
        placement.nodeId,
        placement
      ] as const)
    );
    checkpoint();
    for (const node of state.nodes) {
      const placement = placementByNode.get(node.id);
      if (!placement) continue;
      node.x = placement.x;
      node.y = placement.y;
    }
    selected = undefined;
    selectedNodeIds.clear();
    selectionInspection = undefined;
    selectionReadGeneration += 1;
    render();
    followsFitToCanvas = true;
    fitViewToCanvas();
    report(
      page.viewInteraction?.localAutoLayoutNotice
      ?? "Diagram arranged automatically. Save the view to persist the layout."
    );
  };

  const renderActions = (): void => {
    toolbar.replaceChildren();
    viewControls.replaceChildren();
    selectionActions.replaceChildren();
    if (!state) return;

    if (page.viewInteraction?.localNodeDrag === true) {
      for (const option of [
        { id: "SELECT", label: "Select", title: "Select or marquee nodes (V)" },
        { id: "PAN", label: "Hand", title: "Pan the canvas (H)" }
      ] as const) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = option.label;
        button.title = option.title;
        button.setAttribute("data-eidos-diagram-tool", option.id);
        button.setAttribute("aria-pressed", String(canvasTool === option.id));
        button.onclick = () => {
          canvasTool = option.id;
          canvas.style.cursor = canvasTool === "PAN" ? "grab" : "crosshair";
          renderActions();
        };
        toolbar.appendChild(button);
      }
      const wheelButton = document.createElement("button");
      wheelButton.type = "button";
      wheelButton.textContent = wheelInputMode === "MOUSE" ? "Mouse" : "Trackpad";
      wheelButton.title = "Switch between mouse-wheel zoom and trackpad two-finger pan";
      wheelButton.setAttribute("data-eidos-diagram-wheel-mode", wheelInputMode);
      wheelButton.onclick = () => {
        wheelInputMode = wheelInputMode === "MOUSE" ? "TRACKPAD" : "MOUSE";
        try { window.localStorage.setItem("eidos.diagram.wheelMode", wheelInputMode); }
        catch { /* Preference remains usable for this mount. */ }
        renderActions();
      };
      toolbar.appendChild(wheelButton);
      for (const option of [
        { label: "Undo", key: "undo", enabled: undoHistory.length > 0, action: undoView },
        { label: "Redo", key: "redo", enabled: redoHistory.length > 0, action: redoView }
      ]) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = option.label;
        button.disabled = !option.enabled;
        button.setAttribute("data-eidos-diagram-history", option.key);
        button.onclick = option.action;
        toolbar.appendChild(button);
      }
    }

    const overflowButtons: HTMLButtonElement[] = [];
    const placeToolbarButton = (
      button: HTMLButtonElement,
      placement: DiagramEditorToolbarPlacementV010 = "TOOLBAR"
    ): void => {
      if (placement === "OVERFLOW") overflowButtons.push(button);
      else toolbar.appendChild(button);
    };

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
    if (suppressNextCanvasClick) {
      suppressNextCanvasClick = false;
      return;
    }
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
  if (!canvasClickHandlerInstalled) {
    canvas.addEventListener("click", clearSelectionOnCanvasClick);
    listeners.push(() => canvas.removeEventListener("click", clearSelectionOnCanvasClick));
    canvasClickHandlerInstalled = true;
  }

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
        () => resetZoomTo100()
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

    if (page.viewInteraction?.localVisibilityReset === true) {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("data-eidos-diagram-local-visibility-reset", "");
      button.textContent =
        page.viewInteraction.localVisibilityResetLabel ?? "Restore all";
      button.disabled =
        locallyHiddenNodeIds.size === 0 && locallyHiddenEdgeIds.size === 0;
      button.onclick = () => {
        checkpoint();
        locallyHiddenNodeIds.clear();
        locallyHiddenEdgeIds.clear();
        selected = undefined;
        selectedNodeIds.clear();
        selectionInspection = undefined;
        selectionReadGeneration += 1;
        render();
        followsFitToCanvas = true;
        fitViewToCanvas();
        report(
          page.viewInteraction?.localVisibilityResetNotice
          ?? "All diagram items are visible again. Save to persist the view."
        );
      };
      placeToolbarButton(
        button,
        page.viewInteraction.localVisibilityResetPlacement ?? "TOOLBAR"
      );
    }

    if (page.viewInteraction?.localAutoLayout === true) {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("data-eidos-diagram-auto-layout", "");
      button.textContent =
        page.viewInteraction.localAutoLayoutLabel ?? "Auto layout";
      button.onclick = () => applyLocalAutoLayout();
      placeToolbarButton(
        button,
        page.viewInteraction.localAutoLayoutPlacement ?? "TOOLBAR"
      );
    }

    for (const action of state.actions ?? []) {
      const isGraphAction = !action.target || action.target.kind === "graph";
      if (!isGraphAction) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = action.label;
      button.disabled = state.lifecycleState === "PUBLISHED";
      button.onclick = () => {
        let operation = action.operation;
        if (action.textPrompt) {
          const value = window.prompt(
            action.textPrompt.label,
            action.textPrompt.defaultValue ?? ""
          );
          if (value === null) return;
          const normalized = value.trim();
          if (action.textPrompt.required === true && !normalized) return;
          if (
            operation === null
            || typeof operation !== "object"
            || Array.isArray(operation)
          ) {
            return;
          }
          operation = {
            ...(operation as Record<string, JsonValue>),
            [action.textPrompt.valueKey]: normalized
          } as JsonValue;
        }
        void executeOperation(
          operation,
          action.id,
          action.requiresConfirmation === true,
          undefined,
          action.captureViewState === true
        );
      };
      placeToolbarButton(button, action.placement ?? "TOOLBAR");
    }

    if (overflowButtons.length > 0) {
      const details = document.createElement("details");
      details.setAttribute("data-eidos-diagram-more-actions", "");
      const summary = document.createElement("summary");
      summary.textContent = page.toolbarOverflowLabel ?? "More";
      summary.setAttribute("aria-label", page.toolbarOverflowLabel ?? "More");
      const menu = document.createElement("div");
      menu.setAttribute("data-eidos-diagram-more-menu", "");
      for (const button of overflowButtons) {
        button.addEventListener("click", () => {
          details.open = false;
        });
        menu.appendChild(button);
      }
      details.append(summary, menu);
      toolbar.appendChild(details);
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
    if (!selected && !selectionInspection && selectedNodeIds.size === 0) return;
    selected = undefined;
    selectedNodeIds.clear();
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
    checkpoint();
    if (selectedNodeIds.size > 1) {
      for (const id of selectedNodeIds) locallyHiddenNodeIds.add(id);
    } else if (selected.kind === "node") {
      locallyHiddenNodeIds.add(selected.id);
    } else {
      locallyHiddenEdgeIds.add(selected.id);
    }
    selected = undefined;
    selectedNodeIds.clear();
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
    if (!state || !selected || !page.selectionReadCommand || disposed
      || selectedNodeIds.size > 1) return;
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
    if (selectedNodeIds.size > 1) {
      selectionText.textContent = selectedNodeIds.size + " nodes selected";
      renderSelectionProperties(undefined);
      renderActions();
      return;
    }
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
    if (selected.kind === "edge" && page.viewInteraction?.localEdgePathEdit === true) {
      const edge = state.edges.find(item => item.id === selected!.id);
      if (edge) {
        const control = document.createElement("label");
        control.textContent = "Connector path (presentation only)";
        control.style.display = "grid";
        control.style.gap = "6px";
        control.style.marginTop = "14px";
        const select = document.createElement("select");
        select.setAttribute("data-eidos-diagram-edge-path-kind", edge.id);
        for (const [kind, label] of [
          ["straight", "Straight"],
          ["orthogonal", "Orthogonal"],
          ["rounded-orthogonal", "Rounded orthogonal"],
          ["curve", "Curve"]
        ] as const) {
          const option = document.createElement("option");
          option.value = kind;
          option.textContent = label;
          select.appendChild(option);
        }
        select.value = edge.pathKind ?? "straight";
        select.onchange = () => {
          if (!isDiagramEdgePathKindV010(select.value) || select.value === (edge.pathKind ?? "straight")) return;
          checkpoint();
          edge.pathKind = select.value;
          if (select.value === "straight") delete edge.waypoints;
          render();
          report("Connector presentation updated locally. Save the projection to persist.");
        };
        control.appendChild(select);
        selectionProperties.appendChild(control);

        // Controls work with a mouse, keyboard or touch; no tiny SVG handle is required.
        const editRoute = (action: () => void): void => {
          checkpoint();
          action();
          followsFitToCanvas = false;
          render();
          report("Connector route adjusted locally. Save the projection to persist.");
        };
        if ((edge.pathKind ?? "straight") !== "straight") {
          const waypointPanel = document.createElement("div");
          waypointPanel.setAttribute("data-eidos-diagram-waypoint-controls", edge.id);
          waypointPanel.style.display = "grid";
          waypointPanel.style.gap = "8px";
          waypointPanel.style.marginTop = "12px";
          const heading = document.createElement("strong");
          heading.textContent = "Path points";
          waypointPanel.appendChild(heading);
          const addPoint = document.createElement("button");
          addPoint.type = "button";
          addPoint.textContent = "Add path point";
          addPoint.disabled = (edge.waypoints?.length ?? 0) >= 24;
          addPoint.onclick = () => {
            const source = state!.nodes.find(node => node.id === edge.source);
            const target = state!.nodes.find(node => node.id === edge.target);
            if (!source || !target) return;
            const sx = source.x + source.width / 2, sy = source.y + source.height / 2;
            const tx = target.x + target.width / 2, ty = target.y + target.height / 2;
            editRoute(() => {
              edge.waypoints = [...(edge.waypoints ?? []), { x: (sx + tx) / 2, y: (sy + ty) / 2 }];
            });
          };
          waypointPanel.appendChild(addPoint);
          for (const [index, position] of (edge.waypoints ?? []).entries()) {
            const line = document.createElement("div");
            line.style.display = "flex";
            line.style.flexWrap = "wrap";
            line.style.alignItems = "center";
            line.style.gap = "6px";
            const text = document.createElement("span");
            text.textContent = "Point " + (index + 1);
            line.appendChild(text);
            for (const [label, axis, delta] of [
              ["Left", "x", -10], ["Right", "x", 10], ["Up", "y", -10], ["Down", "y", 10]
            ] as const) {
              const button = document.createElement("button");
              button.type = "button";
              button.textContent = label;
              button.setAttribute("aria-label", label + " path point " + (index + 1) + " by 10");
              button.style.minHeight = "44px";
              button.onclick = () => editRoute(() => {
                const next = (edge.waypoints ?? []).map(p => ({ ...p }));
                const item = next[index]!;
                item[axis] = Math.max(-10000000, Math.min(10000000, item[axis] + delta));
                edge.waypoints = next;
              });
              line.appendChild(button);
            }
            for (const axis of ["x", "y"] as const) {
              const label = document.createElement("label");
              label.textContent = axis.toUpperCase();
              const input = document.createElement("input");
              input.type = "number";
              input.step = "1";
              input.min = "-10000000";
              input.max = "10000000";
              input.value = String(position[axis]);
              input.style.width = "82px";
              input.onchange = () => {
                const n = Number(input.value);
                if (!Number.isFinite(n) || Math.abs(n) > 10000000) {
                  input.value = String(position[axis]); return;
                }
                editRoute(() => {
                  const next = (edge.waypoints ?? []).map(p => ({ ...p }));
                  next[index]![axis] = n;
                  edge.waypoints = next;
                });
              };
              label.appendChild(input);
              line.appendChild(label);
            }
            const remove = document.createElement("button");
            remove.type = "button";
            remove.textContent = "Remove";
            remove.style.minHeight = "44px";
            remove.onclick = () => editRoute(() => {
              edge.waypoints = (edge.waypoints ?? []).filter((_, i) => i !== index);
              if (!edge.waypoints.length) delete edge.waypoints;
            });
            line.appendChild(remove);
            waypointPanel.appendChild(line);
          }
          const reset = document.createElement("button");
          reset.type = "button";
          reset.textContent = "Restore automatic routing";
          reset.style.minHeight = "44px";
          reset.disabled = !(edge.waypoints?.length || edge.sourceAnchor || edge.targetAnchor);
          reset.onclick = () => editRoute(() => {
            delete edge.waypoints;
            delete edge.sourceAnchor;
            delete edge.targetAnchor;
          });
          waypointPanel.appendChild(reset);
          selectionProperties.appendChild(waypointPanel);
        }
        for (const [field, label] of [
          ["sourceAnchor", "Source attachment"],
          ["targetAnchor", "Target attachment"]
        ] as const) {
          const row = document.createElement("label");
          row.textContent = label;
          row.style.display = "grid";
          row.style.gap = "6px";
          const anchor = document.createElement("select");
          anchor.setAttribute("data-eidos-diagram-anchor", field);
          for (const side of ["auto", "left", "right", "top", "bottom"] as const) {
            const option = document.createElement("option");
            option.value = side;
            option.textContent = side;
            anchor.appendChild(option);
          }
          anchor.value = edge[field] ?? "auto";
          anchor.onchange = () => editRoute(() => {
            if (anchor.value === "auto") delete edge[field];
            else edge[field] = anchor.value as DiagramEdgeAnchorSideV010;
          });
          row.appendChild(anchor);
          selectionProperties.appendChild(row);
        }
      }
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
    markerEnd.setAttribute("id", arrowMarkerId);
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
    const laneOffsets = diagramParallelLaneOffsetsV010(
      renderedEdges.filter(edge => edge.pathKind !== undefined)
    );
    const liveEdges = new Map<string, {
      hit: SVGPathElement;
      visual: SVGPathElement;
      label?: SVGTextElement;
    }>();
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
    for (const id of selectedNodeIds) {
      focusedNodeIds.add(id);
      for (const edge of renderedEdges) {
        if (edge.source === id) focusedNodeIds.add(edge.target);
        if (edge.target === id) focusedNodeIds.add(edge.source);
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
      const lane = laneOffsets.get(edge.id) ?? 0;
      const a0 = nodeBoundaryPoint(source, targetCenter);
      const b0 = nodeBoundaryPoint(target, sourceCenter);
      const a = diagramEdgeAnchorPointV010(source, edge.sourceAnchor ?? "auto")
        ?? (edge.pathKind !== undefined && edge.source !== edge.target
          ? diagramOffsetNodeAttachmentV010(source, a0, targetCenter, lane) : a0);
      const b = diagramEdgeAnchorPointV010(target, edge.targetAnchor ?? "auto")
        ?? (edge.pathKind !== undefined && edge.source !== edge.target
          ? diagramOffsetNodeAttachmentV010(target, b0, sourceCenter, lane) : b0);
      const routeObstacles = edge.pathKind === "orthogonal" || edge.pathKind === "rounded-orthogonal"
        ? renderedNodes.filter(node => node.id !== edge.source && node.id !== edge.target)
          .map(node => ({ x: node.x, y: node.y, width: node.width, height: node.height }))
        : [];
      const geometry = edge.source === edge.target
        ? diagramSelfLoopGeometryV010(source, edge.pathKind, lane)
        : edge.waypoints?.length
          ? diagramManualEdgeGeometryV010(a, b, {
              pathKind: edge.pathKind ?? "orthogonal", waypoints: edge.waypoints,
              sourceAnchor: edge.sourceAnchor, targetAnchor: edge.targetAnchor
            })
          : diagramEdgeGeometryV010(a, b, edge.pathKind, { obstacles: routeObstacles });
      const hit = svgElement("path");
      hit.setAttribute("d", geometry.d);
      hit.setAttribute("fill", "none");
      hit.setAttribute("stroke", "transparent");
      hit.setAttribute("stroke-width", "18");
      hit.style.pointerEvents = "stroke";
      hit.style.cursor = "pointer";
      hit.setAttribute("data-eidos-diagram-edge", edge.id);
      if (geometry.congested) {
        hit.setAttribute("data-eidos-diagram-route-congested", "true");
        hit.setAttribute("aria-label", "Connector route congested; manual adjustment may be needed");
      }
      hit.addEventListener("click", () => {
        selectedNodeIds.clear();
        selected = { kind: "edge", id: edge.id };
        selectionInspection = undefined;
        render();
        canvas.focus({ preventScroll: true });
        void inspectSelection();
      });
      svg.appendChild(hit);

      const line = svgElement("path");
      line.setAttribute("d", geometry.d);
      line.setAttribute("fill", "none");
      const edgeSelected = selectedEdgeId === edge.id;
      const edgeConnected =
        Boolean(selectedNodeId)
        && (selectedNodeIds.has(edge.source) || selectedNodeIds.has(edge.target)
          || edge.source === selectedNodeId || edge.target === selectedNodeId);
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
        line.setAttribute("marker-end", "url(#" + arrowMarkerId + ")");
      }
      if (edge.arrow === "start" || edge.arrow === "both") {
        line.setAttribute("marker-start", "url(#" + arrowMarkerId + ")");
      }
      line.setAttribute("data-eidos-diagram-edge-visual", edge.id);
      line.style.pointerEvents = "none";
      svg.appendChild(line);
      liveEdges.set(edge.id, { hit, visual: line });

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
        label.setAttribute("x", String(geometry.label.x));
        label.setAttribute("y", String(geometry.label.y - 8));
        label.setAttribute("data-eidos-diagram-edge-label", edge.id);
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
        liveEdges.get(edge.id)!.label = label;
      }
    }

    // Preview only the incident edges during drag; keep pointer capture and the
    // rest of the canvas mounted until the gesture commits or cancels.
    const previewIncidentEdges = (
      positions: ReadonlyMap<string, { x: number; y: number }>
    ): void => {
      if (positions.size === 0) return;
      const byId = new Map(renderedNodes.map(node => [node.id, node] as const));
      for (const edge of renderedEdges) {
        if (!positions.has(edge.source) && !positions.has(edge.target)) continue;
        const sourceNode = byId.get(edge.source);
        const targetNode = byId.get(edge.target);
        if (!sourceNode || !targetNode) continue;
        const source = { ...sourceNode, ...positions.get(edge.source) };
        const target = { ...targetNode, ...positions.get(edge.target) };
        const sourceCenter = nodeCenter(source);
        const targetCenter = nodeCenter(target);
        const lane = laneOffsets.get(edge.id) ?? 0;
        const a0 = nodeBoundaryPoint(source, targetCenter);
        const b0 = nodeBoundaryPoint(target, sourceCenter);
        const a = diagramEdgeAnchorPointV010(source, edge.sourceAnchor ?? "auto")
          ?? (edge.pathKind !== undefined && edge.source !== edge.target
            ? diagramOffsetNodeAttachmentV010(source, a0, targetCenter, lane) : a0);
        const b = diagramEdgeAnchorPointV010(target, edge.targetAnchor ?? "auto")
          ?? (edge.pathKind !== undefined && edge.source !== edge.target
            ? diagramOffsetNodeAttachmentV010(target, b0, sourceCenter, lane) : b0);
        // Drag preview stays lightweight; the committed render evaluates obstacles.
        const movedSource = positions.get(edge.source), movedTarget = positions.get(edge.target);
        const translated = movedSource && movedTarget
          && Math.abs(movedSource.x - sourceNode.x - (movedTarget.x - targetNode.x)) < 0.001
          && Math.abs(movedSource.y - sourceNode.y - (movedTarget.y - targetNode.y)) < 0.001;
        const points = translated && edge.waypoints?.length
          ? diagramTranslateWaypointsV010(edge.waypoints,
              movedSource!.x - sourceNode.x, movedSource!.y - sourceNode.y)
          : edge.waypoints;
        const route = edge.source === edge.target
          ? diagramSelfLoopGeometryV010(source, edge.pathKind, lane)
          : points?.length
            ? diagramManualEdgeGeometryV010(a, b, { pathKind: edge.pathKind ?? "orthogonal", waypoints: points })
            : diagramEdgeGeometryV010(a, b, edge.pathKind);
        const elements = liveEdges.get(edge.id);
        if (!elements) continue;
        elements.hit.setAttribute("d", route.d);
        elements.visual.setAttribute("d", route.d);
        if (elements.label) {
          elements.label.setAttribute("x", String(route.label.x));
          elements.label.setAttribute("y", String(route.label.y - 8));
        }
      }
    };

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
      const nodeSelected = selectedNodeIds.has(node.id) || selectedNodeId === node.id;
      const nodeFocused = !selected || selectedNodeIds.has(node.id)
        || focusedNodeIds.has(node.id);
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

      element.addEventListener("click", event => {
        if (suppressNextNodeClick) {
          suppressNextNodeClick = false;
          return;
        }
        if (event.shiftKey && page.viewInteraction?.localNodeDrag === true) {
          if (selectedNodeIds.has(node.id)) selectedNodeIds.delete(node.id);
          else selectedNodeIds.add(node.id);
          const last = [...selectedNodeIds].at(-1);
          selected = last ? { kind: "node", id: last } : undefined;
        } else {
          selectedNodeIds.clear();
          selectedNodeIds.add(node.id);
          selected = { kind: "node", id: node.id };
        }
        selectionInspection = undefined;
        selectionReadGeneration += 1;
        render();
        canvas.focus({ preventScroll: true });
        if (selectedNodeIds.size === 1) void inspectSelection();
      });

      if (localViewDrag || persistentDrag) {
        const pointerDown = (event: PointerEvent) => {
          if (event.pointerType !== "touch" && event.button !== 0) return;
          if (spaceHeld || canvasTool === "PAN") return;
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
          const members = localViewDrag && selectedNodeIds.has(node.id)
            ? renderedNodes.filter(item => selectedNodeIds.has(item.id))
            : [node];
          const initial = new Map(members.map(item => [item.id, {
            x: item.x, y: item.y
          }] as const));
          const membersElements = new Map(members.map(item => [
            item.id,
            stage.querySelector<HTMLElement>(
              `[data-eidos-diagram-node="${CSS.escape(item.id)}"]`
            )
          ] as const));
          const movedPositions = (dx: number, dy: number) =>
            new Map(members.map(item => [item.id, {
              x: item.x + dx,
              y: item.y + dy
            }] as const));
          const showPositions = (positions: ReadonlyMap<string, { x: number; y: number }>) => {
            for (const [id, position] of positions) {
              const target = membersElements.get(id);
              if (target) {
                target.style.left = position.x + "px";
                target.style.top = position.y + "px";
              }
            }
            previewIncidentEdges(positions);
          };
          let moved = false;
          let cancelledByNavigation = false;

          const cancelForNavigation = (): void => {
            if (cancelledByNavigation) return;
            cancelledByNavigation = true;
            moved = false;
            showPositions(initial);
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
              !moved && Math.hypot(screenDeltaX, screenDeltaY) < (isTouch ? touchDragThresholdPx : 4)
            ) return;
            if (
              isTouch
              && !moved
              && Math.hypot(screenDeltaX, screenDeltaY) < touchDragThresholdPx
            ) {
              return;
            }
            const nextX = originalX + screenDeltaX / camera.scale;
            const nextY = originalY + screenDeltaY / camera.scale;
            moved = true;
            showPositions(movedPositions(nextX - originalX, nextY - originalY));
          };

          const pointerUp = (up: PointerEvent) => {
            element.removeEventListener("lostpointercapture", lostCapture);
            if (element.hasPointerCapture(up.pointerId)) {
              element.releasePointerCapture(up.pointerId);
            }
            element.removeEventListener("pointermove", pointerMove);
            element.removeEventListener("pointerup", pointerUp);
            element.removeEventListener("pointercancel", pointerCancel);
            if (cancelledByNavigation || !moved) return;
            suppressNextNodeClick = true;
            const x = Number.parseFloat(element.style.left);
            const y = Number.parseFloat(element.style.top);
            if (localViewDrag && (node.readOnly || !page.operationCommand || members.length > 1)) {
              checkpoint();
              const dx = x - originalX;
              const dy = y - originalY;
              for (const item of members) {
                item.x += dx;
                item.y += dy;
              }
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

          const pointerCancel = (event: PointerEvent): void => {
            cancelForNavigation();
            pointerUp(event);
          };
          const lostCapture = (event: PointerEvent): void => {
            pointerCancel(event);
          };
          element.addEventListener("pointermove", pointerMove);
          element.addEventListener("pointerup", pointerUp);
          element.addEventListener("pointercancel", pointerCancel);
          element.addEventListener("lostpointercapture", lostCapture);
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
      canvas.style.cursor = page.viewInteraction?.localNodeDrag && canvasTool === "SELECT"
        ? "crosshair" : "grab";
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

    let marquee: {
      pointerId: number;
      start: { x: number; y: number };
      current: { x: number; y: number };
      additive: boolean;
      moved: boolean;
      element: HTMLDivElement;
    } | undefined;

    const removeMarquee = (): void => {
      marquee?.element.remove();
      marquee = undefined;
    };

    const pointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const mouse = event.pointerType === "mouse" || event.pointerType === "pen";
      const primary = event.button === 0;
      const wantsMarquee = mouse && primary
        && page.viewInteraction?.localNodeDrag === true
        && canvasTool === "SELECT" && !spaceHeld;
      if (
        mouse && primary && !spaceHeld && canvasTool !== "PAN"
        && (
          target?.closest?.("[data-eidos-diagram-node]")
          || target?.closest?.("[data-eidos-diagram-edge]")
        )
      ) {
        return;
      }
      if (mouse && !primary && event.button !== 1 && event.button !== 2) return;
      if (!wantsMarquee && !page.viewInteraction?.pan && event.pointerType !== "touch") return;
      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);
      if (wantsMarquee) {
        const anchor = canvasPoint(event.clientX, event.clientY);
        const element = document.createElement("div");
        element.setAttribute("data-eidos-diagram-marquee", "");
        element.style.cssText = "position:absolute;z-index:9;pointer-events:none;border:1px solid var(--eidos-primary,#2B6CB0);background:color-mix(in srgb,var(--eidos-primary-subtle,#EAF2FB) 75%,transparent);";
        canvas.appendChild(element);
        marquee = {
          pointerId: event.pointerId, start: anchor, current: anchor,
          additive: event.shiftKey, moved: false, element
        };
        return;
      }
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
      if (marquee?.pointerId === event.pointerId) {
        event.preventDefault();
        const current = canvasPoint(event.clientX, event.clientY);
        marquee.current = current;
        if (Math.hypot(current.x - marquee.start.x, current.y - marquee.start.y) >= 4) marquee.moved = true;
        if (marquee.moved) {
          marquee.element.style.left = Math.min(current.x, marquee.start.x) + "px";
          marquee.element.style.top = Math.min(current.y, marquee.start.y) + "px";
          marquee.element.style.width = Math.abs(current.x - marquee.start.x) + "px";
          marquee.element.style.height = Math.abs(current.y - marquee.start.y) + "px";
        }
        return;
      }
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
      if (marquee?.pointerId === event.pointerId) {
        const box = marquee;
        removeMarquee();
        if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
        if (event.type === "pointerup" && box.moved) {
          const minX = Math.min(box.start.x, box.current.x);
          const maxX = Math.max(box.start.x, box.current.x);
          const minY = Math.min(box.start.y, box.current.y);
          const maxY = Math.max(box.start.y, box.current.y);
          const ids = diagramNodesIntersectingRectV010(visibleNodes(), {
            x: (minX - camera.translateX) / camera.scale,
            y: (minY - camera.translateY) / camera.scale,
            width: (maxX - minX) / camera.scale,
            height: (maxY - minY) / camera.scale
          });
          if (!box.additive) selectedNodeIds.clear();
          for (const id of ids) selectedNodeIds.add(id);
          const last = [...selectedNodeIds].at(-1);
          selected = last ? { kind: "node", id: last } : undefined;
          selectionInspection = undefined;
          selectionReadGeneration += 1;
          suppressNextCanvasClick = true;
          render();
          canvas.focus({ preventScroll: true });
          window.setTimeout(() => { suppressNextCanvasClick = false; }, 0);
        }
        return;
      }
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
        canvas.style.cursor = page.viewInteraction?.localNodeDrag && canvasTool === "SELECT"
          ? "crosshair" : (page.viewInteraction?.pan ? "grab" : "");
      }
    };

    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointercancel", pointerUp);
    const onBlur = (): void => {
      removeMarquee();
      navigationPointers.clear();
      panLast = undefined;
      spaceHeld = false;
    };
    window.addEventListener("blur", onBlur);
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
      () => window.removeEventListener("blur", onBlur),
      () => canvas.removeEventListener("lostpointercapture", lostPointerCapture)
    );
  }

  if (page.viewInteraction?.zoom) {
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const deltaUnit = event.deltaMode === 1 ? 16
        : event.deltaMode === 2 ? Math.max(1, canvas.clientHeight) : 1;
      const dx = event.deltaX * deltaUnit;
      const dy = event.deltaY * deltaUnit;
      if (wheelInputMode === "TRACKPAD" && !event.ctrlKey) {
        followsFitToCanvas = false;
        camera = panDiagramCameraByScreenDeltaV010(camera, { x: -dx, y: -dy });
        applyCameraTransform();
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const anchor = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      const factor = Math.max(0.5, Math.min(2, Math.exp(-dy * 0.002)));
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
    const focus = document.activeElement;
    if (focus && focus !== canvas && !focus.closest?.("[data-eidos-diagram-node]")) return;
    if (
      target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || target instanceof HTMLSelectElement
      || (target instanceof HTMLElement && target.isContentEditable)
    ) {
      return;
    }

    if (page.viewInteraction?.localNodeDrag === true) {
      const ctrl = event.ctrlKey || event.metaKey;
      if (ctrl && !event.altKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redoView(); else undoView();
        return;
      }
      if (ctrl && !event.altKey && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redoView();
        return;
      }
      if (ctrl && event.key.toLowerCase() === "a") {
        event.preventDefault();
        selectedNodeIds.clear();
        for (const node of visibleNodes()) selectedNodeIds.add(node.id);
        const last = [...selectedNodeIds].at(-1);
        selected = last ? { kind: "node", id: last } : undefined;
        selectionInspection = undefined;
        selectionReadGeneration += 1;
        render();
        return;
      }
      if (!ctrl && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "v") {
        canvasTool = "SELECT"; renderActions(); return;
      }
      if (!ctrl && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "h") {
        canvasTool = "PAN"; renderActions(); return;
      }
    }

    if (page.viewInteraction?.localNodeDrag === true && event.code === "Space"
      && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      spaceHeld = true;
      canvas.style.cursor = "grab";
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
      return;
    }

    if (
      page.viewInteraction?.localNodeDrag === true
      && selected?.kind === "node"
      && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
      && state
    ) {
      const node = state.nodes.find(item => item.id === selected!.id);
      if (!node) return;
      event.preventDefault();
      checkpoint();
      const step = event.shiftKey ? 10 : 1;
      if (event.key === "ArrowLeft") node.x -= step;
      if (event.key === "ArrowRight") node.x += step;
      if (event.key === "ArrowUp") node.y -= step;
      if (event.key === "ArrowDown") node.y += step;
      followsFitToCanvas = false;
      render();
      canvas.focus({ preventScroll: true });
      report(
        event.shiftKey
          ? "View adjusted by 10 units. No changes were saved."
          : "View adjusted by 1 unit. No changes were saved."
      );
      return;
    }

    if (page.viewInteraction?.zoom === true) {
      const commandOrControl = event.metaKey || event.ctrlKey;
      if (
        event.key === "+"
        || event.key === "="
        || (commandOrControl && event.code === "Equal")
      ) {
        event.preventDefault();
        applyZoomAt(camera.scale * 1.2);
        return;
      }
      if (
        event.key === "-"
        || (commandOrControl && event.code === "Minus")
      ) {
        event.preventDefault();
        applyZoomAt(camera.scale / 1.2);
        return;
      }
      if (event.shiftKey && event.code === "Digit1") {
        event.preventDefault();
        followsFitToCanvas = true;
        fitViewToCanvas();
        return;
      }
      if (event.shiftKey && event.code === "Digit2" && selected) {
        event.preventDefault();
        fitSelectionToCanvas();
        return;
      }
      if (commandOrControl && event.code === "Digit0") {
        event.preventDefault();
        resetZoomTo100();
      }
    }
  };
  root.addEventListener("keydown", keydownHandler);
  const keyupHandler = (event: KeyboardEvent): void => {
    if (event.code === "Space" && spaceHeld) {
      spaceHeld = false;
      canvas.style.cursor = canvasTool === "SELECT" ? "crosshair" : "grab";
    }
  };
  window.addEventListener("keyup", keyupHandler);
  listeners.push(() => root.removeEventListener("keydown", keydownHandler));
  listeners.push(() => window.removeEventListener("keyup", keyupHandler));

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
