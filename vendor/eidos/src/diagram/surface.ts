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

export interface DiagramEditorPageV010 {
  contractVersion: "0.1.0";
  kind: "diagram-editor";
  id: string;
  title: string;
  resourceId: string;
  readCommand: DiagramEditorCommandV010;
  operationCommand: DiagramEditorCommandV010;
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
}

export interface DiagramEditorEdgeV010 {
  id: string;
  source: string;
  target: string;
  kind: string;
  label?: string;
  style?: DiagramEditorEdgeStyleV010;
  detail?: string;
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
  dispose(): void;
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
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
    && nonEmpty(page.operationCommand?.inputVersion);
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
  page: DiagramEditorPageV010
): ActionRequestV010 {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: { ...page.readCommand },
    values: {
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
  requiresConfirmation = false
): ActionRequestV010 {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: { ...page.operationCommand },
    values: {
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
    || !selectionActions
  ) {
    throw new Error("EIDOS_DIAGRAM_EDITOR_SHELL_INCOMPLETE");
  }

  let disposed = false;
  let state: DiagramEditorStateV010 | undefined;
  let selected: { kind: "node" | "edge"; id: string } | undefined;
  const listeners: Array<() => void> = [];

  const report = (message: string): void => {
    if (!disposed) status.textContent = message;
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
    requiresConfirmation = false
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
      requiresConfirmation
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

  const renderSelection = (): void => {
    if (!state || !selected) {
      selectionText.textContent = page.emptyMessage ?? "Select a node or relation.";
      renderActions();
      return;
    }
    const item = selected.kind === "node"
      ? state.nodes.find(node => node.id === selected!.id)
      : state.edges.find(edge => edge.id === selected!.id);
    selectionText.textContent = item
      ? [item.label, item.kind, item.detail].filter(Boolean).join("\n")
      : page.emptyMessage ?? "Select a node or relation.";
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

      if (edge.label) {
        const label = svgElement("text");
        label.setAttribute("x", String((a.x + b.x) / 2));
        label.setAttribute("y", String((a.y + b.y) / 2 - 8));
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("font-size", "12");
        label.textContent = edge.label;
        label.style.pointerEvents = "none";
        svg.appendChild(label);
      }
    }

    stage.appendChild(svg);

    for (const node of state.nodes) {
      const element = document.createElement("button");
      element.type = "button";
      element.setAttribute("data-eidos-diagram-node", node.id);
      element.textContent = node.label;
      element.title = node.detail ?? node.kind;
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

  void (async () => {
    report("Loading…");
    const result = await actionHost.execute(
      diagramEditorReadRequestV010(page)
    );
    await options.onActionResult?.(result);
    if (disposed) return;
    if (!result.ok) {
      report(result.error?.message ?? "Failed to load diagram.");
      return;
    }
    state = stateFromResult(result.result);
    render();
    report("Ready.");
  })().catch(error => {
    report(error instanceof Error ? error.message : String(error));
  });

  return {
    dispose() {
      disposed = true;
      for (const listener of listeners) listener();
    }
  };
}
