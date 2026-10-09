import type {
  Template2dPreviewV010,
  TemplatePreviewEdgeV010,
  TemplatePreviewNodeV010
} from "../contracts/template-preview.js";
import {
  assertTemplateProjectionGalleryV010,
  type TemplateProjectionGalleryV010
} from "../contracts/template-projection-gallery.js";

function asObject(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function ledgerFlowDirection(
  direction: string | undefined
): "in" | "out" | undefined {
  if (!direction) return undefined;
  if (["借方", "Dr", "dr", "增加", "add", "-Cr", "-cr"].includes(direction)) {
    return "in";
  }
  if (["贷方", "Cr", "cr", "减少", "sub", "-Dr", "-dr"].includes(direction)) {
    return "out";
  }
  return undefined;
}

function postingFlowLabel(rule: Record<string, unknown>): string {
  const kinds = [
    asString(rule.quantityFormula) ? "数量" : undefined,
    asString(rule.amountFormula) ? "资金" : undefined
  ].filter((value): value is string => value !== undefined);
  return kinds.length > 0 ? kinds.join(" + ") : "发生数";
}

function fromDeclaredPayload(payload: unknown): Template2dPreviewV010 | undefined {
  const root = asObject(payload);
  const preview = asObject(root?.preview2d);
  if (
    preview?.contractVersion !== "0.1.0"
    || !Array.isArray(preview.nodes)
    || !Array.isArray(preview.edges)
  ) {
    return undefined;
  }

  const nodes: TemplatePreviewNodeV010[] = [];
  for (const [index, raw] of preview.nodes.entries()) {
    const node = asObject(raw);
    const id = asString(node?.id);
    const kind = asString(node?.kind);
    const label = asString(node?.label);
    const x = asFiniteNumber(node?.x);
    const y = asFiniteNumber(node?.y);
    const width = asFiniteNumber(node?.width);
    const height = asFiniteNumber(node?.height);
    if (
      !id || !kind || !label
      || x === undefined || y === undefined
      || width === undefined || height === undefined
      || width <= 0 || height <= 0
    ) {
      throw new Error(
        `DEFINITION_PROJECTION_NODE_INVALID: preview2d.nodes[${index}]`
      );
    }
    const shape = asString(node?.shape);
    nodes.push({
      id,
      kind,
      label,
      x,
      y,
      width,
      height,
      ...(shape === "rectangle" || shape === "rounded-rectangle"
        ? { shape }
        : {}),
      ...(asString(node?.typeLabel)
        ? { typeLabel: asString(node?.typeLabel)! }
        : {}),
      ...(asString(node?.detail)
        ? { detail: asString(node?.detail)! }
        : {})
    });
  }

  const nodeIds = new Set(nodes.map(node => node.id));
  const edges: TemplatePreviewEdgeV010[] = [];
  for (const [index, raw] of preview.edges.entries()) {
    const edge = asObject(raw);
    const id = asString(edge?.id);
    const source = asString(edge?.source);
    const target = asString(edge?.target);
    const kind = asString(edge?.kind) ?? "relation";
    if (
      !id || !source || !target
      || !nodeIds.has(source)
      || !nodeIds.has(target)
    ) {
      throw new Error(
        `DEFINITION_PROJECTION_EDGE_INVALID: preview2d.edges[${index}]`
      );
    }
    const arrow = asString(edge?.arrow);
    const pathKind = asString(edge?.pathKind);
    if (pathKind && !["straight", "orthogonal", "rounded-orthogonal", "curve"].includes(pathKind)) {
      throw new Error("DEFINITION_PROJECTION_EDGE_PATH_INVALID");
    }
    edges.push({
      id,
      source,
      target,
      kind,
      ...(asString(edge?.label) ? { label: asString(edge?.label)! } : {}),
      ...(arrow && ["none", "start", "end", "both"].includes(arrow)
        ? { arrow: arrow as "none" | "start" | "end" | "both" }
        : {}),
      ...(pathKind ? { pathKind: pathKind as "straight" | "orthogonal" | "rounded-orthogonal" | "curve" } : {}),
      ...(asString(edge?.detail) ? { detail: asString(edge?.detail)! } : {})
    });
  }
  return { contractVersion: "0.1.0", nodes, edges };
}

function fromLedgerRuntime(payload: unknown): Template2dPreviewV010 | undefined {
  const root = asObject(payload);
  if (root?.kind !== "evo.ledger-runtime.template") return undefined;
  const configuration = asObject(root.configuration);
  if (
    !configuration
    || !Array.isArray(configuration.applications)
    || !Array.isArray(configuration.accounts)
    || !Array.isArray(configuration.postingRules)
  ) return undefined;

  const rulesByApplication = new Map<string, number>();
  const rulesByLedger = new Map<number, number>();
  for (const raw of configuration.postingRules) {
    const rule = asObject(raw);
    const applicationId = asString(rule?.applicationId);
    const ledgerId = asFiniteNumber(rule?.ledgerId);
    if (applicationId) {
      rulesByApplication.set(
        applicationId,
        (rulesByApplication.get(applicationId) ?? 0) + 1
      );
    }
    if (ledgerId !== undefined) {
      rulesByLedger.set(ledgerId, (rulesByLedger.get(ledgerId) ?? 0) + 1);
    }
  }

  const applicationNodes: TemplatePreviewNodeV010[] =
    configuration.applications.map((raw, index) => {
      const app = asObject(raw) ?? {};
      const applicationId = asString(app.applicationId)
        ?? `application-${index + 1}`;
      const title = asString(app.title) ?? applicationId;
      const column = index % 4;
      const row = Math.floor(index / 4);
      return {
        id: `application:${applicationId}`,
        kind: "ledger-runtime-application",
        label: title,
        x: 60 + column * 250,
        y: 80 + row * 118,
        width: 210,
        height: 82,
        shape: "rounded-rectangle",
        typeLabel: "应用",
        detail:
          `Application · ${rulesByApplication.get(applicationId) ?? 0} posting rules`,
        properties: [{
          key: "applicationId",
          label: "Application ID",
          value: applicationId
        }, {
          key: "legacyId",
          label: "Legacy ID",
          value: asFiniteNumber(app.legacyId) ?? null
        }, {
          key: "state",
          label: "Source State",
          value: asString(app.state) ?? null
        }, {
          key: "postingRuleCount",
          label: "Posting Rules",
          value: rulesByApplication.get(applicationId) ?? 0
        }]
      };
    });

  const ledgerNodes: TemplatePreviewNodeV010[] =
    configuration.accounts.map((raw, index) => {
      const account = asObject(raw) ?? {};
      const ledgerId = asFiniteNumber(account.id) ?? index + 1;
      const title = asString(account.title) ?? `Ledger ${ledgerId}`;
      const column = index % 4;
      const row = Math.floor(index / 4);
      return {
        id: `ledger:${ledgerId}`,
        kind: "ledger-runtime-ledger",
        label: title,
        x: 1240 + column * 250,
        y: 80 + row * 118,
        width: 210,
        height: 82,
        shape: "rectangle",
        typeLabel: "账本",
        detail:
          `Ledger ${ledgerId} · ${rulesByLedger.get(ledgerId) ?? 0} posting rules`,
        properties: [{
          key: "ledgerId",
          label: "Ledger ID",
          value: ledgerId
        }, {
          key: "isFinance",
          label: "Financial",
          value: typeof account.isFinance === "boolean" ? account.isFinance : null
        }, {
          key: "bigClass",
          label: "Class",
          value: asString(account.bigClass) ?? null
        }, {
          key: "objectType",
          label: "Object Type",
          value: asString(account.objectType) ?? null
        }, {
          key: "postingRuleCount",
          label: "Posting Rules",
          value: rulesByLedger.get(ledgerId) ?? 0
        }]
      };
    });

  const nodeIds = new Set([
    ...applicationNodes.map(node => node.id),
    ...ledgerNodes.map(node => node.id)
  ]);

  const edges: TemplatePreviewEdgeV010[] = [];
  for (const [index, raw] of configuration.postingRules.entries()) {
    const rule = asObject(raw) ?? {};
    const applicationId = asString(rule.applicationId);
    const ledgerId = asFiniteNumber(rule.ledgerId);
    if (!applicationId || ledgerId === undefined) continue;
    const applicationNode = `application:${applicationId}`;
    const ledgerNode = `ledger:${ledgerId}`;
    if (!nodeIds.has(applicationNode) || !nodeIds.has(ledgerNode)) continue;

    const sourceId = asFiniteNumber(rule.sourceId) ?? index + 1;
    const direction = asString(rule.direction);
    const flowDirection = ledgerFlowDirection(direction);
    const source = flowDirection === "out" ? ledgerNode : applicationNode;
    const target = flowDirection === "out" ? applicationNode : ledgerNode;
    const flowLabel = postingFlowLabel(rule);
    const appTitle = asString(rule.appTitle) ?? applicationId;
    const ledgerTitle = asString(rule.ledgerTitle) ?? String(ledgerId);
    edges.push({
      id: `posting-rule:${sourceId}`,
      source,
      target,
      kind: "posting-rule",
      label: `${flowLabel} · ${direction ?? "posting"}`,
      arrow: "end",
      detail: flowDirection === "out"
        ? `${ledgerTitle} → ${appTitle}`
        : `${appTitle} → ${ledgerTitle}`,
      properties: [{
        key: "sourceId",
        label: "Rule ID",
        value: sourceId
      }, {
        key: "flowType",
        label: "流动类型",
        value: flowLabel
      }, {
        key: "flowDirection",
        label: "流动方向",
        value: flowDirection === "out"
          ? "流出账本"
          : flowDirection === "in"
            ? "流入账本"
            : "未识别"
      }, {
        key: "direction",
        label: "Direction",
        value: direction ?? null
      }, {
        key: "quantityFormula",
        label: "Quantity Formula",
        value: asString(rule.quantityFormula) ?? null
      }, {
        key: "amountFormula",
        label: "Amount Formula",
        value: asString(rule.amountFormula) ?? null
      }, {
        key: "entryConditions",
        label: "Conditions",
        value: asString(rule.entryConditions) ?? null
      }, {
        key: "defaultValues",
        label: "Default Values",
        value: asString(rule.defaultValues) ?? null
      }]
    });
  }

  return {
    contractVersion: "0.1.0",
    nodes: [...applicationNodes, ...ledgerNodes],
    edges
  };
}

function fromRuntimeFlow(payload: unknown): Template2dPreviewV010 | undefined {
  const root = asObject(payload);
  if (!Array.isArray(root?.runtimeFlow)) return undefined;
  const stages = root.runtimeFlow
    .map(asString)
    .filter((value): value is string => value !== undefined);
  if (stages.length === 0) return undefined;

  return {
    contractVersion: "0.1.0",
    nodes: stages.map((stage, index) => ({
      id: `stage:${index + 1}`,
      kind: "ledger-runtime-stage",
      label: stage,
      x: 60 + index * 230,
      y: 160,
      width: 180,
      height: 88,
      detail: `Ledger Runtime stage ${index + 1} of ${stages.length}`,
      properties: [{
        key: "stage",
        label: "Stage",
        value: stage
      }, {
        key: "position",
        label: "Position",
        value: index + 1
      }]
    })),
    edges: stages.slice(0, -1).map((stage, index) => ({
      id: `flow:${index + 1}`,
      source: `stage:${index + 1}`,
      target: `stage:${index + 2}`,
      kind: "flow",
      label: "next",
      properties: [{
        key: "flow",
        label: "Flow",
        value: `${stage} -> ${stages[index + 1]}`
      }]
    }))
  };
}

export function buildDefinition2dBaseV010(
  payload: unknown
): Template2dPreviewV010 | undefined {
  return fromDeclaredPayload(payload)
    ?? fromLedgerRuntime(payload)
    ?? fromRuntimeFlow(payload);
}

export function applyDefinitionProjectionV010(input: {
  diagram: Template2dPreviewV010 | undefined;
  gallery?: TemplateProjectionGalleryV010;
  projectionId?: string;
  includeHidden?: boolean;
}): {
  diagram2d?: Template2dPreviewV010;
  projectionId?: string;
  title?: string;
  description?: string;
  hiddenNodeIds?: string[];
  hiddenEdgeIds?: string[];
  camera?: {
    scale: number;
    translateX: number;
    translateY: number;
  };
} {
  if (!input.gallery) {
    if (input.projectionId) throw new Error("DEFINITION_PROJECTION_NOT_FOUND");
    return input.diagram ? { diagram2d: structuredClone(input.diagram) } : {};
  }

  const gallery = assertTemplateProjectionGalleryV010(input.gallery);
  const projectionId = input.projectionId?.trim()
    || gallery.primaryProjectionId;
  const projection = gallery.projections.find(
    item => item.projectionId === projectionId
  );
  if (!projection) throw new Error("DEFINITION_PROJECTION_NOT_FOUND");

  if (!input.diagram) {
    return {
      projectionId,
      title: projection.title,
      ...(projection.description ? { description: projection.description } : {}),
      ...(projection.view.camera
        ? { camera: structuredClone(projection.view.camera) }
        : {})
    };
  }

  const hiddenNodes = new Set(projection.view.hiddenNodeIds ?? []);
  const hiddenEdges = new Set(projection.view.hiddenEdgeIds ?? []);
  const placements = new Map(
    (projection.view.placements ?? []).map(item => [
      item.nodeId,
      { x: item.x, y: item.y }
    ])
  );

  const nodes = input.diagram.nodes
    .filter(node => input.includeHidden === true || !hiddenNodes.has(node.id))
    .map(node => {
      const placement = placements.get(node.id);
      return placement
        ? { ...node, x: placement.x, y: placement.y }
        : { ...node };
    });
  const visibleNodeIds = new Set(nodes.map(node => node.id));
  const routeByEdgeId = new Map((projection.view.edgePaths ?? []).map(item => [item.edgeId, item.pathKind] as const));
  const edges = input.diagram.edges
    .filter(edge =>
      (input.includeHidden === true || !hiddenEdges.has(edge.id))
      && visibleNodeIds.has(edge.source)
      && visibleNodeIds.has(edge.target)
    )
    .map(edge => ({
      ...edge,
      ...(routeByEdgeId.has(edge.id) ? { pathKind: routeByEdgeId.get(edge.id)! } : {})
    }));

  return {
    projectionId,
    title: projection.title,
    ...(projection.description ? { description: projection.description } : {}),
    ...(projection.view.hiddenNodeIds?.length
      ? { hiddenNodeIds: [...projection.view.hiddenNodeIds] }
      : {}),
    ...(projection.view.hiddenEdgeIds?.length
      ? { hiddenEdgeIds: [...projection.view.hiddenEdgeIds] }
      : {}),
    ...(projection.view.camera
      ? { camera: structuredClone(projection.view.camera) }
      : {}),
    diagram2d: {
      contractVersion: "0.1.0",
      nodes,
      edges
    }
  };
}
