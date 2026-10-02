import type { ActionHost } from "../adapters/ports.js";
import type {
  ActionRequestV010,
  JsonValue
} from "../runtime/contracts.js";

export type DiagramEditorNodeShapeV010 =
  | "rectangle"
  | "rounded-rectangle";

export type DiagramEditorEdgeStyleV010 =
  | "solid"
  | "dashed";

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
  kind: "diagram-editor";
  id: string;
  title: string;
  resourceId: string;
  readCommand: DiagramEditorCommandV010;
  operationCommand: DiagramEditorCommandV010;
  requestValues?: Record<string, JsonValue>;
  readPresets?: DiagramEditorReadPresetV010[];
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
    && page.kind === "diagram-editor"
    && nonEmpty(page.id)
    && nonEmpty(page.title)
    && nonEmpty(page.resourceId)
    && page.readCommand !== undefined
    && nonEmpty(page.readCommand?.code)
    && nonEmpty(page.readCommand?.inputVersion)
    && page.operationCommand !== undefined
    && nonEmpty(page.operationCommand?.code)
    && nonEmpty(page.operationCommand?.inputVersion)
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

export function diagramEditorOperationRequestV010(
  page: DiagramEditorPageV010,
  state: DiagramEditorStateV010,
  operation: JsonValue,
  actionId: string,
  requiresConfirmation = false,
  commandOverride?: DiagramEditorCommandV010
): ActionRequestV010 {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: { ...(commandOverride ?? page.operationCommand) },
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
<header style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
<h1 style="margin:0;font-size:20px">${escapeHtml(page.title)}</h1>
<span data-eidos-diagram-lifecycle style="font-size:12px"></span>
<span data-eidos-diagram-revision style="font-size:12px"></span>
<div data-eidos-diagram-toolbar style="margin-left:auto;display:flex;gap:8px"></div>
</header>
<div style="display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:12px;min-height:0">
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
  let activeReadPresetId = page.readPresets?.[0]?.id;
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

  const renderActions = (): void => {
    toolbar.replaceChildren();
    selectionActions.replaceChildren();
    if (!state) return;

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

  const renderSelection = (): void => {
    if (!state || !selected) {
      selectionText.textContent = page.emptyMessage ?? "Select a node or relation.";
      renderSelectionProperties(undefined);
      renderActions();
      return;
    }
    const item = selected.kind === "node"
      ? state.nodes.find(node => node.id === selected!.id)
      : state.edges.find(edge => edge.id === selected!.id);
    selectionText.textContent = item
      ? [
          item.label,
          item.kind,
          item.detail,
          ...observationText(item.observations)
        ].filter(Boolean).join("\n")
      : page.emptyMessage ?? "Select a node or relation.";
    renderSelectionProperties(item?.properties);
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

    const stage = document.createElement("div");
    stage.style.position = "relative";
    stage.style.width = maxX + "px";
    stage.style.height = maxY + "px";
    stage.style.minWidth = "100%";
    stage.style.minHeight = "100%";

    const svg = svgElement("svg");
    svg.setAttribute("width", String(maxX));
    svg.setAttribute("height", String(maxY));
    svg.style.position = "absolute";
    svg.style.inset = "0";
    svg.style.pointerEvents = "none";

    for (const edge of state.edges) {
      const source = state.nodes.find(node => node.id === edge.source);
      const target = state.nodes.find(node => node.id === edge.target);
      if (!source || !target) continue;
      const a = nodeCenter(source);
      const b = nodeCenter(target);
      const hit = svgElement("line");
      hit.setAttribute("x1", String(a.x));
      hit.setAttribute("y1", String(a.y));
      hit.setAttribute("x2", String(b.x));
      hit.setAttribute("y2", String(b.y));
      hit.setAttribute("stroke", "transparent");
      hit.setAttribute("stroke-width", "18");
      hit.style.pointerEvents = "stroke";
      hit.style.cursor = "pointer";
      hit.addEventListener("click", () => {
        selected = { kind: "edge", id: edge.id };
        renderSelection();
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
      element.style.cursor = node.readOnly || state.lifecycleState === "PUBLISHED"
        ? "default"
        : "grab";
      element.style.zIndex = "2";

      element.addEventListener("click", () => {
        selected = { kind: "node", id: node.id };
        renderSelection();
      });

      if (!node.readOnly && state.lifecycleState !== "PUBLISHED") {
        const pointerDown = (event: PointerEvent) => {
          event.preventDefault();
          element.setPointerCapture(event.pointerId);
          const startX = event.clientX;
          const startY = event.clientY;
          const originalX = node.x;
          const originalY = node.y;
          let moved = false;

          const pointerMove = (move: PointerEvent) => {
            const nextX = Math.max(0, originalX + move.clientX - startX);
            const nextY = Math.max(0, originalY + move.clientY - startY);
            moved = moved || Math.abs(nextX - originalX) > 1 || Math.abs(nextY - originalY) > 1;
            element.style.left = nextX + "px";
            element.style.top = nextY + "px";
          };

          const pointerUp = (up: PointerEvent) => {
            element.releasePointerCapture(up.pointerId);
            element.removeEventListener("pointermove", pointerMove);
            element.removeEventListener("pointerup", pointerUp);
            element.removeEventListener("pointercancel", pointerUp);
            if (!moved) return;
            const x = Number.parseFloat(element.style.left);
            const y = Number.parseFloat(element.style.top);
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

    canvas.appendChild(stage);
    if (state.notice) report(state.notice);
    renderSelection();
  };

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
